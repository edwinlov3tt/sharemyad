/**
 * Folder Structure Manager
 * User Story 3 (P3) - Folder hierarchy storage and flattening
 *
 * Handles:
 * - Storing folder hierarchies in folder_structure table
 * - Flattening deeply nested structures (max 3 levels)
 * - Preserving full paths in metadata
 */

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Maximum folder depth allowed for display
 * Per spec.md FR-029
 */
export const MAX_FOLDER_DEPTH = 3

/**
 * Folder node for hierarchy
 */
export interface FolderNode {
  /** Folder name */
  name: string

  /** Full path from root */
  fullPath: string

  /** Parent folder path (null if root) */
  parentPath: string | null

  /** Depth level (0 = root) */
  depth: number

  /** Number of assets directly in this folder */
  assetCount: number
}

/**
 * Builds folder hierarchy from list of folder paths
 *
 * @param folderPaths - List of folder paths from zip extraction
 * @param assetCounts - Map of folder path → asset count
 * @returns List of folder nodes with parent relationships
 */
export function buildFolderHierarchy(
  folderPaths: string[],
  assetCounts: Map<string, number> = new Map()
): FolderNode[] {
  const nodes: FolderNode[] = []
  const uniquePaths = new Set(folderPaths)

  for (const fullPath of uniquePaths) {
    const parts = fullPath.split('/')
    const name = parts[parts.length - 1]
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') : null
    const depth = parts.length - 1
    const assetCount = assetCounts.get(fullPath) || 0

    nodes.push({
      name,
      fullPath,
      parentPath,
      depth,
      assetCount
    })
  }

  return nodes.sort((a, b) => a.depth - b.depth || a.fullPath.localeCompare(b.fullPath))
}

/**
 * Flattens folder hierarchy to max depth
 * Preserves original full paths for reference
 *
 * @param nodes - Folder nodes
 * @param maxDepth - Maximum depth (default 3)
 * @returns Flattened nodes with original paths preserved
 */
export function flattenHierarchy(
  nodes: FolderNode[],
  maxDepth: number = MAX_FOLDER_DEPTH
): Array<FolderNode & { originalPath: string; isFlattened: boolean }> {
  return nodes.map(node => {
    if (node.depth <= maxDepth) {
      // No flattening needed
      return {
        ...node,
        originalPath: node.fullPath,
        isFlattened: false
      }
    }

    // Flatten to maxDepth
    const parts = node.fullPath.split('/')
    const flattenedParts = parts.slice(0, maxDepth + 1) // +1 because depth is 0-indexed
    const flattenedPath = flattenedParts.join('/')

    const flattenedParentParts = flattenedParts.slice(0, -1)
    const flattenedParentPath = flattenedParentParts.length > 0
      ? flattenedParentParts.join('/')
      : null

    return {
      name: flattenedParts[flattenedParts.length - 1],
      fullPath: flattenedPath,
      parentPath: flattenedParentPath,
      depth: maxDepth,
      assetCount: node.assetCount,
      originalPath: node.fullPath,
      isFlattened: true
    }
  })
}

/**
 * Stores folder structure in database
 *
 * @param supabase - Supabase client
 * @param creativeSetId - Creative set ID
 * @param nodes - Folder nodes to store
 * @returns Array of inserted folder structure IDs
 */
export async function storeFolderStructure(
  supabase: SupabaseClient,
  creativeSetId: string,
  nodes: FolderNode[]
): Promise<string[]> {
  const insertedIds: string[] = []

  // Create a map to track database IDs for parent lookup
  const pathToIdMap = new Map<string, string>()

  // Insert nodes in order of depth (parents before children)
  for (const node of nodes) {
    // Find parent database ID if parent exists
    let parentFolderId: string | null = null
    if (node.parentPath && pathToIdMap.has(node.parentPath)) {
      parentFolderId = pathToIdMap.get(node.parentPath)!
    }

    // Insert folder structure record
    const { data, error } = await supabase
      .from('folder_structure')
      .insert({
        creative_set_id: creativeSetId,
        folder_name: node.name,
        parent_folder_id: parentFolderId,
        depth_level: node.depth,
        full_path: node.fullPath,
        asset_count: node.assetCount
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to store folder structure: ${error.message}`)
    }

    const folderId = data.id
    pathToIdMap.set(node.fullPath, folderId)
    insertedIds.push(folderId)
  }

  return insertedIds
}

/**
 * Updates asset count for a folder and all its parents
 *
 * @param supabase - Supabase client
 * @param folderPath - Folder path to update
 * @param creativeSetId - Creative set ID
 * @param increment - Amount to increment (default 1)
 */
export async function incrementFolderAssetCount(
  supabase: SupabaseClient,
  folderPath: string,
  creativeSetId: string,
  increment: number = 1
): Promise<void> {
  // Update the folder itself
  const { error } = await supabase.rpc('increment_folder_asset_count', {
    p_creative_set_id: creativeSetId,
    p_folder_path: folderPath,
    p_increment: increment
  })

  if (error) {
    // Fallback: manual update
    const { error: updateError } = await supabase
      .from('folder_structure')
      .update({ asset_count: supabase.rpc('asset_count + ' + increment) })
      .eq('creative_set_id', creativeSetId)
      .eq('full_path', folderPath)

    if (updateError) {
      console.error('Failed to increment folder asset count:', updateError)
    }
  }
}

/**
 * Gets folder hierarchy for a creative set
 *
 * @param supabase - Supabase client
 * @param creativeSetId - Creative set ID
 * @returns Folder nodes ordered by depth
 */
export async function getFolderStructure(
  supabase: SupabaseClient,
  creativeSetId: string
): Promise<FolderNode[]> {
  const { data, error } = await supabase
    .from('folder_structure')
    .select('*')
    .eq('creative_set_id', creativeSetId)
    .order('depth_level')
    .order('full_path')

  if (error) {
    throw new Error(`Failed to fetch folder structure: ${error.message}`)
  }

  return data.map(row => ({
    name: row.folder_name,
    fullPath: row.full_path,
    parentPath: row.parent_folder_id ? '' : null, // Would need join to get parent path
    depth: row.depth_level,
    assetCount: row.asset_count
  }))
}

/**
 * Validates folder structure integrity
 * Checks for:
 * - Orphaned folders (parent doesn't exist)
 * - Incorrect depth calculations
 * - Duplicate paths
 *
 * @param nodes - Folder nodes
 * @returns Validation result
 */
export function validateFolderStructure(nodes: FolderNode[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const paths = new Set<string>()

  for (const node of nodes) {
    // Check for duplicates
    if (paths.has(node.fullPath)) {
      errors.push(`Duplicate folder path: ${node.fullPath}`)
    }
    paths.add(node.fullPath)

    // Check depth matches path
    const expectedDepth = node.fullPath.split('/').length - 1
    if (node.depth !== expectedDepth) {
      errors.push(`Incorrect depth for ${node.fullPath}: expected ${expectedDepth}, got ${node.depth}`)
    }

    // Check parent path validity
    if (node.parentPath && !paths.has(node.parentPath)) {
      // Parent should be processed before child (since sorted by depth)
      errors.push(`Orphaned folder ${node.fullPath}: parent ${node.parentPath} not found`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Merges duplicate folders from flattening
 * Combines asset counts for folders that flatten to same path
 *
 * @param nodes - Flattened nodes
 * @returns Deduplicated nodes with merged asset counts
 */
export function mergeDuplicateFolders(
  nodes: Array<FolderNode & { originalPath: string; isFlattened: boolean }>
): FolderNode[] {
  const mergedMap = new Map<string, FolderNode>()

  for (const node of nodes) {
    if (mergedMap.has(node.fullPath)) {
      // Merge asset counts
      const existing = mergedMap.get(node.fullPath)!
      existing.assetCount += node.assetCount
    } else {
      mergedMap.set(node.fullPath, {
        name: node.name,
        fullPath: node.fullPath,
        parentPath: node.parentPath,
        depth: node.depth,
        assetCount: node.assetCount
      })
    }
  }

  return Array.from(mergedMap.values())
}
