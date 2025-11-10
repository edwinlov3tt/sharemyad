/**
 * Creative Set Detector Module
 * User Story 3 (P3) - Pattern matching for creative set detection
 *
 * Detects creative sets from folder naming patterns:
 * - Set-A, Set-B, Set-C (or just A, B, C)
 * - Version-1, Version-2 (or Version_1, Version1)
 * - v1, v2, v3 (short version)
 * - Test-A, Test-B, Test-1, Test-2
 *
 * Per research.md Decision 5: Simple regex patterns, no AI/ML
 * Target: ≥90% accuracy on common naming conventions
 */

/**
 * Detected creative set information
 */
export interface CreativeSet {
  /** Set identifier (e.g., "Set-A", "Version-1", "v2") */
  name: string

  /** Folders belonging to this set */
  folders: string[]

  /** Pattern that matched (for debugging) */
  pattern?: string
}

/**
 * Set detection patterns ordered by specificity (most specific first)
 */
const SET_PATTERNS: Array<{
  name: string
  regex: RegExp
  extractName: (match: RegExpMatchArray) => string
}> = [
  // Pattern 1: Set-X (e.g., "Set-A", "Set-B", "set-final")
  {
    name: 'set-prefix',
    regex: /^(?:Set[-_]?)([A-Za-z0-9]+)$/i,
    extractName: (match) => `Set-${match[1]}`
  },

  // Pattern 2: Version-N (e.g., "Version-1", "Version_2", "Version3")
  {
    name: 'version-number',
    regex: /^Version[-_]?(\d+)$/i,
    extractName: (match) => `Version-${match[1]}`
  },

  // Pattern 3: vN (e.g., "v1", "v2", "V3")
  {
    name: 'v-short',
    regex: /^[Vv](\d+)$/,
    extractName: (match) => `v${match[1]}`
  },

  // Pattern 4: Test-X (e.g., "Test-A", "Test-1", "Test_Control")
  {
    name: 'test-prefix',
    regex: /^Test[-_]?([A-Za-z0-9]+)$/i,
    extractName: (match) => `Test-${match[1]}`
  },

  // Pattern 5: Single letter (e.g., "A", "B", "C")
  {
    name: 'single-letter',
    regex: /^([A-Z])$/i,
    extractName: (match) => match[1].toUpperCase()
  },

  // Pattern 6: Variant-X (e.g., "Variant-A", "Variant-1")
  {
    name: 'variant-prefix',
    regex: /^Variant[-_]?([A-Za-z0-9]+)$/i,
    extractName: (match) => `Variant-${match[1]}`
  },

  // Pattern 7: Control/Treatment pattern
  {
    name: 'control-treatment',
    regex: /^(Control|Treatment)$/i,
    extractName: (match) => match[1]
  },

  // Pattern 8: Draft/Final pattern
  {
    name: 'draft-final',
    regex: /^(Draft|Final)$/i,
    extractName: (match) => match[1]
  }
]

/**
 * Detects creative sets from folder names using pattern matching
 *
 * @param folders - List of folder paths (can be full paths or just folder names)
 * @returns Detected creative sets with their associated folders
 */
export function detectCreativeSets(folders: string[]): CreativeSet[] {
  if (folders.length === 0) {
    return []
  }

  // Map to store sets: set name → folders
  const setsMap = new Map<string, { folders: string[]; pattern: string }>()

  for (const folderPath of folders) {
    // Extract folder name from full path (take last component)
    const pathParts = folderPath.split('/')
    const folderName = pathParts[pathParts.length - 1]

    // Try each pattern until one matches
    let matched = false

    for (const pattern of SET_PATTERNS) {
      const match = folderName.match(pattern.regex)

      if (match) {
        const setName = pattern.extractName(match)

        if (!setsMap.has(setName)) {
          setsMap.set(setName, { folders: [], pattern: pattern.name })
        }

        setsMap.get(setName)!.folders.push(folderPath)
        matched = true
        break // Stop at first match (most specific)
      }
    }

    // If no pattern matched, treat as generic folder (not a set)
    // Don't create a set for non-matching folders
    if (!matched) {
      // Optionally, could create a "default" set here
      // For now, we skip non-matching folders
    }
  }

  // Convert map to array of CreativeSet objects
  return Array.from(setsMap.entries()).map(([name, { folders, pattern }]) => ({
    name,
    folders,
    pattern
  }))
}

/**
 * Detects creative sets from nested folder structures
 * Searches through path hierarchy to find set markers
 *
 * @param folders - List of full folder paths
 * @returns Detected creative sets
 */
export function detectCreativeSetsFromPaths(folders: string[]): CreativeSet[] {
  // First, try detecting sets from immediate folder names
  const immediateSets = detectCreativeSets(folders)

  if (immediateSets.length > 0) {
    return immediateSets
  }

  // If no sets found at immediate level, check parent folders
  // Extract parent folder names
  const parentFolders = folders
    .map(path => {
      const parts = path.split('/')
      // Try second-to-last component if it exists
      return parts.length > 1 ? parts[parts.length - 2] : null
    })
    .filter((parent): parent is string => parent !== null)

  if (parentFolders.length > 0) {
    return detectCreativeSets(parentFolders)
  }

  return []
}

/**
 * Groups folders by detected set pattern
 * Useful for understanding which folders belong to which sets
 *
 * @param folders - List of folder paths
 * @returns Map of set name → folder paths
 */
export function groupFoldersBySets(folders: string[]): Map<string, string[]> {
  const sets = detectCreativeSets(folders)
  const grouped = new Map<string, string[]>()

  for (const set of sets) {
    grouped.set(set.name, set.folders)
  }

  return grouped
}

/**
 * Validates set detection accuracy
 * Returns percentage of folders that matched a pattern
 *
 * @param folders - List of folder paths
 * @returns Accuracy percentage (0-100)
 */
export function getDetectionAccuracy(folders: string[]): number {
  if (folders.length === 0) {
    return 0
  }

  const sets = detectCreativeSets(folders)
  const matchedFolders = sets.reduce((count, set) => count + set.folders.length, 0)

  return (matchedFolders / folders.length) * 100
}

/**
 * Suggests set names for folders that didn't match patterns
 * Useful for providing hints to users
 *
 * @param folders - List of folder paths
 * @returns Unmatched folders with suggested set names
 */
export function suggestSetNames(folders: string[]): Array<{
  folder: string
  suggestion: string
}> {
  const sets = detectCreativeSets(folders)
  const matchedFolders = new Set(
    sets.flatMap(set => set.folders)
  )

  const unmatchedFolders = folders.filter(f => !matchedFolders.has(f))

  return unmatchedFolders.map(folder => {
    const folderName = folder.split('/').pop() || folder

    // Suggest based on common patterns
    if (/\d/.test(folderName)) {
      return { folder, suggestion: `Version-${folderName}` }
    } else if (/[A-Za-z]/.test(folderName)) {
      return { folder, suggestion: `Set-${folderName}` }
    } else {
      return { folder, suggestion: 'Set-A' }
    }
  })
}

/**
 * Normalizes set names for consistent display
 * Ensures consistent casing and formatting
 *
 * @param setName - Raw set name
 * @returns Normalized set name
 */
export function normalizeSetName(setName: string): string {
  // Remove extra hyphens/underscores
  let normalized = setName.replace(/[-_]+/g, '-')

  // Capitalize first letter
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1)

  return normalized
}

/**
 * Detects if folders follow a sequential pattern (1, 2, 3 or A, B, C)
 * Useful for validating set detection results
 *
 * @param setNames - List of detected set names
 * @returns True if sets follow sequential pattern
 */
export function isSequentialPattern(setNames: string[]): boolean {
  if (setNames.length < 2) {
    return false
  }

  // Extract numeric values if present
  const numbers = setNames
    .map(name => {
      const match = name.match(/\d+/)
      return match ? parseInt(match[0], 10) : null
    })
    .filter((n): n is number => n !== null)

  if (numbers.length >= 2) {
    // Check if numbers are sequential
    const sorted = numbers.sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        return false
      }
    }
    return true
  }

  // Extract letter values if present
  const letters = setNames
    .map(name => {
      const match = name.match(/[A-Z]/i)
      return match ? match[0].toUpperCase() : null
    })
    .filter((l): l is string => l !== null)

  if (letters.length >= 2) {
    // Check if letters are sequential
    const sorted = letters.sort()
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].charCodeAt(0) !== sorted[i - 1].charCodeAt(0) + 1) {
        return false
      }
    }
    return true
  }

  return false
}
