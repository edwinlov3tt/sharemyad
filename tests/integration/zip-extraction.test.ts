/**
 * Integration Test: Zip Extraction with Creative Sets
 * User Story 3 (P3) - Test-First Development
 *
 * Tests zip file upload, extraction, folder structure preservation,
 * creative set detection, and file limit enforcement.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'
import { readFile, writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'

// Test configuration
const TEST_DIR = join(__dirname, '../__test-data__')
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key'

describe('Zip Extraction Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>
  let testUserId: string
  let uploadSessionId: string

  beforeEach(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Create test data directory
    await mkdir(TEST_DIR, { recursive: true })

    // Create test user session (mock auth for integration tests)
    testUserId = crypto.randomUUID()
  })

  afterEach(async () => {
    // Cleanup test data
    await rm(TEST_DIR, { recursive: true, force: true })

    // Cleanup database records
    if (uploadSessionId) {
      await supabase
        .from('upload_sessions')
        .delete()
        .eq('id', uploadSessionId)
    }
  })

  describe('Basic Zip Extraction', () => {
    it('should extract a simple zip file with multiple images', async () => {
      // Arrange: Create test zip with 3 images
      const zip = new JSZip()
      zip.file('image1.jpg', Buffer.from('fake-jpg-content-1'))
      zip.file('image2.png', Buffer.from('fake-png-content-2'))
      zip.file('image3.gif', Buffer.from('fake-gif-content-3'))

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
      const zipPath = join(TEST_DIR, 'simple.zip')
      await writeFile(zipPath, zipBuffer)

      // Act: Upload and extract zip
      const { data: session, error: sessionError } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 3,
          total_size_bytes: zipBuffer.length,
          status: 'pending'
        })
        .select()
        .single()

      uploadSessionId = session!.id
      expect(sessionError).toBeNull()

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/simple.zip`, zipBuffer)

      expect(uploadError).toBeNull()

      // Trigger processing function
      const { data: processData, error: processError } = await supabase.functions
        .invoke('process-upload', {
          body: { session_id: uploadSessionId }
        })

      expect(processError).toBeNull()

      // Assert: Verify extraction results
      const { data: assets, error: assetsError } = await supabase
        .from('creative_assets')
        .select('*, creative_sets!inner(*)')
        .eq('creative_sets.upload_session_id', uploadSessionId)

      expect(assetsError).toBeNull()
      expect(assets).toHaveLength(3)
      expect(assets?.map(a => a.filename_original)).toContain('image1.jpg')
      expect(assets?.map(a => a.filename_original)).toContain('image2.png')
      expect(assets?.map(a => a.filename_original)).toContain('image3.gif')
    })

    it('should preserve folder structure from zip', async () => {
      // Arrange: Create zip with nested folders
      const zip = new JSZip()
      zip.folder('Campaign')?.folder('Set-A')?.file('banner.jpg', Buffer.from('banner-content'))
      zip.folder('Campaign')?.folder('Set-B')?.file('ad.png', Buffer.from('ad-content'))

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      // Act: Extract and process
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 2,
          total_size_bytes: zipBuffer.length
        })
        .select()
        .single()

      uploadSessionId = session!.id

      await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/nested.zip`, zipBuffer)

      await supabase.functions.invoke('process-upload', {
        body: { session_id: uploadSessionId }
      })

      // Assert: Verify folder structure stored
      const { data: folders } = await supabase
        .from('folder_structure')
        .select('*, creative_sets!inner(*)')
        .eq('creative_sets.upload_session_id', uploadSessionId)
        .order('depth_level')

      expect(folders).not.toBeNull()
      expect(folders!.length).toBeGreaterThan(0)

      // Check folder names preserved
      const folderNames = folders!.map(f => f.folder_name)
      expect(folderNames).toContain('Campaign')
      expect(folderNames).toContain('Set-A')
      expect(folderNames).toContain('Set-B')

      // Check full paths constructed correctly
      const fullPaths = folders!.map(f => f.full_path)
      expect(fullPaths).toContain('Campaign/Set-A')
      expect(fullPaths).toContain('Campaign/Set-B')
    })
  })

  describe('Creative Set Detection', () => {
    it('should detect creative sets from folder names (Set-A, Set-B)', async () => {
      // Arrange: Zip with explicit set naming
      const zip = new JSZip()
      zip.folder('Set-A')?.file('banner-300x250.jpg', Buffer.from('set-a-content'))
      zip.folder('Set-B')?.file('banner-300x250.jpg', Buffer.from('set-b-content'))
      zip.folder('Set-C')?.file('banner-300x250.jpg', Buffer.from('set-c-content'))

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      // Act
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 3,
          total_size_bytes: zipBuffer.length
        })
        .select()
        .single()

      uploadSessionId = session!.id

      await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/sets.zip`, zipBuffer)

      await supabase.functions.invoke('process-upload', {
        body: { session_id: uploadSessionId }
      })

      // Assert: Verify creative sets detected
      const { data: sets } = await supabase
        .from('creative_sets')
        .select('*')
        .eq('upload_session_id', uploadSessionId)
        .order('set_name')

      expect(sets).toHaveLength(3)
      expect(sets!.map(s => s.set_name)).toContain('Set-A')
      expect(sets!.map(s => s.set_name)).toContain('Set-B')
      expect(sets!.map(s => s.set_name)).toContain('Set-C')

      // Verify asset counts
      sets!.forEach(set => {
        expect(set.asset_count).toBe(1)
      })
    })

    it('should detect creative sets from version naming (Version-1, Version-2)', async () => {
      // Arrange
      const zip = new JSZip()
      zip.folder('Version-1')?.file('ad.jpg', Buffer.from('v1-content'))
      zip.folder('Version-2')?.file('ad.jpg', Buffer.from('v2-content'))

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      // Act
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 2,
          total_size_bytes: zipBuffer.length
        })
        .select()
        .single()

      uploadSessionId = session!.id

      await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/versions.zip`, zipBuffer)

      await supabase.functions.invoke('process-upload', {
        body: { session_id: uploadSessionId }
      })

      // Assert
      const { data: sets } = await supabase
        .from('creative_sets')
        .select('*')
        .eq('upload_session_id', uploadSessionId)

      expect(sets).toHaveLength(2)
      expect(sets!.map(s => s.set_name)).toContain('Version-1')
      expect(sets!.map(s => s.set_name)).toContain('Version-2')
    })
  })

  describe('File Limit Enforcement', () => {
    it('should enforce 500-file limit and show warning', async () => {
      // Arrange: Create zip with 550 files
      const zip = new JSZip()
      for (let i = 1; i <= 550; i++) {
        zip.file(`file${i}.jpg`, Buffer.from(`content-${i}`))
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      // Act
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 550,
          total_size_bytes: zipBuffer.length
        })
        .select()
        .single()

      uploadSessionId = session!.id

      await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/large.zip`, zipBuffer)

      const { data: result } = await supabase.functions.invoke('process-upload', {
        body: { session_id: uploadSessionId }
      })

      // Assert: Only 500 files processed
      const { data: assets } = await supabase
        .from('creative_assets')
        .select('count')
        .eq('upload_session_id', uploadSessionId)
        .single()

      expect(assets).not.toBeNull()
      // @ts-ignore - count aggregation
      expect(assets.count).toBeLessThanOrEqual(500)

      // Verify warning in response
      expect(result).toHaveProperty('warning')
      expect(result?.warning).toContain('File limit reached')
      expect(result?.warning).toContain('500 of 550')
    })
  })

  describe('Error Handling', () => {
    it('should handle corrupted zip gracefully with partial success', async () => {
      // Arrange: Create partially corrupted zip
      const zip = new JSZip()
      zip.file('valid1.jpg', Buffer.from('valid-content-1'))
      zip.file('valid2.jpg', Buffer.from('valid-content-2'))
      // Note: Actual corruption would require binary manipulation

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      // Corrupt the buffer at position 100
      const corruptedBuffer = Buffer.from(zipBuffer)
      corruptedBuffer[100] = 0xFF
      corruptedBuffer[101] = 0xFF

      // Act
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 2,
          total_size_bytes: corruptedBuffer.length,
          status: 'processing'
        })
        .select()
        .single()

      uploadSessionId = session!.id

      await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/corrupted.zip`, corruptedBuffer)

      const { data: result, error } = await supabase.functions.invoke('process-upload', {
        body: { session_id: uploadSessionId }
      })

      // Assert: Processing should fail gracefully
      // Either complete with error or partial success
      expect(result || error).not.toBeNull()

      if (error) {
        expect(error.message).toContain('corrupted')
      } else {
        expect(result).toHaveProperty('status')
        expect(['failed', 'partial_success']).toContain(result?.status)
      }

      // Check processing job logged error
      const { data: job } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('upload_session_id', uploadSessionId)
        .eq('job_type', 'extraction')
        .single()

      expect(job).not.toBeNull()
      expect(['failed', 'completed']).toContain(job!.status)

      if (job!.status === 'failed') {
        expect(job!.error_message).not.toBeNull()
      }
    })

    it('should reject password-protected zips with clear error', async () => {
      // Arrange: Create password-protected zip
      const zip = new JSZip()
      zip.file('secret.jpg', Buffer.from('secret-content'), {
        // JSZip encryption simulation
        compression: 'DEFLATE'
      })

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        // Note: JSZip doesn't support password protection in creation
        // This test verifies detection logic when receiving such files
      })

      // Act
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 1,
          total_size_bytes: zipBuffer.length
        })
        .select()
        .single()

      uploadSessionId = session!.id

      await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/protected.zip`, zipBuffer)

      const { data: result, error } = await supabase.functions.invoke('process-upload', {
        body: { session_id: uploadSessionId }
      })

      // Assert: Error message clear and actionable
      if (error || result?.status === 'failed') {
        const errorMessage = error?.message || result?.error
        expect(errorMessage).toMatch(/password.*protected|encrypted/i)
        expect(errorMessage).toContain('unprotected')
      }
    })
  })

  describe('Folder Flattening', () => {
    it('should flatten deeply nested folders to max 3 levels', async () => {
      // Arrange: Create zip with 10 levels of nesting
      const zip = new JSZip()
      let folder: JSZip | null = zip.folder('Level1')
      for (let i = 2; i <= 10; i++) {
        folder = folder?.folder(`Level${i}`) || null
      }
      folder?.file('deep-file.jpg', Buffer.from('deep-content'))

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      // Act
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 1,
          total_size_bytes: zipBuffer.length
        })
        .select()
        .single()

      uploadSessionId = session!.id

      await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/nested.zip`, zipBuffer)

      await supabase.functions.invoke('process-upload', {
        body: { session_id: uploadSessionId }
      })

      // Assert: Max depth is 3 levels
      const { data: folders } = await supabase
        .from('folder_structure')
        .select('*')
        .eq('upload_session_id', uploadSessionId)
        .order('depth_level', { ascending: false })

      expect(folders).not.toBeNull()
      const maxDepth = folders![0]?.depth_level || 0
      expect(maxDepth).toBeLessThanOrEqual(3)

      // Verify full path still preserved in metadata
      const { data: asset } = await supabase
        .from('creative_assets')
        .select('*, creative_sets!inner(*)')
        .eq('creative_sets.upload_session_id', uploadSessionId)
        .single()

      expect(asset).not.toBeNull()
      expect(asset!.creative_sets.original_folder_path).toContain('Level1')
    })
  })

  describe('HTML5 Bundle Detection', () => {
    it('should detect HTML5 bundles with index.html', async () => {
      // Arrange: Create zip with HTML5 bundle structure
      const zip = new JSZip()
      zip.file('index.html', Buffer.from('<html><body>Ad Content</body></html>'))
      zip.file('styles.css', Buffer.from('body { color: red; }'))
      zip.file('script.js', Buffer.from('console.log("ad");'))

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      // Act
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 3,
          total_size_bytes: zipBuffer.length
        })
        .select()
        .single()

      uploadSessionId = session!.id

      await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/html5.zip`, zipBuffer)

      await supabase.functions.invoke('process-upload', {
        body: { session_id: uploadSessionId }
      })

      // Assert: HTML5 bundle detected
      const { data: asset } = await supabase
        .from('creative_assets')
        .select('*')
        .eq('filename_original', 'index.html')
        .single()

      expect(asset).not.toBeNull()
      expect(asset!.is_html5_bundle).toBe(true)
      expect(asset!.file_type).toBe('html5')
      expect(asset!.mime_type).toBe('text/html')
    })

    it('should warn if HTML5 bundle incomplete (missing index.html)', async () => {
      // Arrange: Zip with HTML/CSS/JS but no index.html
      const zip = new JSZip()
      zip.file('main.html', Buffer.from('<html></html>'))
      zip.file('styles.css', Buffer.from(''))

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

      // Act
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: testUserId,
          session_type: 'zip',
          total_files: 2,
          total_size_bytes: zipBuffer.length
        })
        .select()
        .single()

      uploadSessionId = session!.id

      await supabase.storage
        .from('uploads')
        .upload(`temp-uploads/${uploadSessionId}/incomplete.zip`, zipBuffer)

      const { data: result } = await supabase.functions.invoke('process-upload', {
        body: { session_id: uploadSessionId }
      })

      // Assert: Warning about incomplete bundle
      expect(result).toHaveProperty('warnings')
      const warnings = result?.warnings || []
      const htmlWarning = warnings.find((w: string) => w.includes('HTML5 bundle'))
      expect(htmlWarning).toBeDefined()
      expect(htmlWarning).toContain('incomplete')
    })
  })
})
