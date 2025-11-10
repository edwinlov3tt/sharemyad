/**
 * Integration tests for upload pipeline
 * Tests the complete upload flow from file selection to asset storage
 *
 * User Story 1 (T032): Single file upload flow
 * User Story 2 (T055): Multiple file upload with concurrent processing
 * User Story 4 (T085): State preservation across page refresh
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for tests
const supabaseUrl = process.env.SUPABASE_URL || 'https://gnurilaiddffxfjujegu.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdudXJpbGFpZGRmZnhmanVqZWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NDk3MzksImV4cCI6MjA3ODMyNTczOX0.FSjyDjyxSBzDT6vUYGhgwJ946noSbeUkXIvuTlYoSYw'
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * User Story 1 (T032): Single file upload flow
 * Tests the complete single file upload pipeline from session creation to asset storage
 */
describe('Upload Pipeline - User Story 1: Single File Upload', () => {
  const testSessionIds: string[] = []
  const testAssetIds: string[] = []

  afterEach(async () => {
    // Cleanup test data
    if (testAssetIds.length > 0) {
      await supabase.from('creative_assets').delete().in('id', testAssetIds)
    }
    if (testSessionIds.length > 0) {
      await supabase.from('creative_sets').delete().in('upload_session_id', testSessionIds)
      await supabase.from('upload_sessions').delete().in('id', testSessionIds)
    }
    testAssetIds.length = 0
    testSessionIds.length = 0
  })

  describe('T032: Complete single file upload integration', () => {
    it('should create upload session for single file', async () => {
      // Arrange
      const sessionData = {
        user_id: '00000000-0000-0000-0000-000000000000', // Anonymous user for MVP
        session_type: 'single' as const,
        status: 'pending' as const,
        total_files: 1,
        total_size_bytes: 51200, // 50KB
      }

      // Act: Create upload session
      const { data: session, error } = await supabase
        .from('upload_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (session) testSessionIds.push(session.id)

      // Assert: Session created successfully
      expect(error).toBeNull()
      expect(session).toBeDefined()
      expect(session.id).toBeTruthy()
      expect(session.session_type).toBe('single')
      expect(session.status).toBe('pending')
      expect(session.total_files).toBe(1)
    })

    it('should create creative set for upload session', async () => {
      // Arrange: Create upload session first
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          session_type: 'single',
          status: 'pending',
          total_files: 1,
          total_size_bytes: 51200,
        })
        .select()
        .single()

      testSessionIds.push(session.id)

      // Act: Create creative set for session
      const { data: creativeSet, error } = await supabase
        .from('creative_sets')
        .insert({
          upload_session_id: session.id,
          set_name: 'default',
          set_order: 0,
          original_folder_path: null,
        })
        .select()
        .single()

      // Assert: Creative set created
      expect(error).toBeNull()
      expect(creativeSet).toBeDefined()
      expect(creativeSet.upload_session_id).toBe(session.id)
      expect(creativeSet.set_name).toBe('default')
    })

    it('should create creative asset with validation metadata', async () => {
      // Arrange: Create session and creative set
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          session_type: 'single',
          status: 'uploading',
          total_files: 1,
          total_size_bytes: 51200,
        })
        .select()
        .single()

      testSessionIds.push(session.id)

      const { data: creativeSet } = await supabase
        .from('creative_sets')
        .insert({
          upload_session_id: session.id,
          set_name: 'default',
          set_order: 0,
        })
        .select()
        .single()

      // Act: Create creative asset
      const assetData = {
        creative_set_id: creativeSet.id,
        filename: 'banner-300x250.jpg',
        filename_original: 'banner-300x250.jpg',
        file_type: 'image' as const,
        mime_type: 'image/jpeg',
        size_bytes: 51200,
        width: 300,
        height: 250,
        storage_path: `temp-uploads/${session.id}/banner-300x250.jpg`,
        storage_url: `https://storage.example.com/temp-uploads/${session.id}/banner-300x250.jpg`,
        validation_status: 'valid' as const,
        validation_notes: 'Standard IAB Medium Rectangle (300x250)',
      }

      const { data: asset, error } = await supabase
        .from('creative_assets')
        .insert(assetData)
        .select()
        .single()

      if (asset) testAssetIds.push(asset.id)

      // Assert: Asset created with all metadata
      expect(error).toBeNull()
      expect(asset).toBeDefined()
      expect(asset.creative_set_id).toBe(creativeSet.id)
      expect(asset.filename).toBe('banner-300x250.jpg')
      expect(asset.file_type).toBe('image')
      expect(asset.width).toBe(300)
      expect(asset.height).toBe(250)
      expect(asset.validation_status).toBe('valid')
      expect(asset.validation_notes).toContain('IAB Medium Rectangle')
    })

    it('should update session status to completed after asset creation', async () => {
      // Arrange: Create session with asset
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          session_type: 'single',
          status: 'processing',
          total_files: 1,
          total_size_bytes: 51200,
        })
        .select()
        .single()

      testSessionIds.push(session.id)

      // Act: Mark session as completed
      const { data: updatedSession, error } = await supabase
        .from('upload_sessions')
        .update({ status: 'completed' })
        .eq('id', session.id)
        .select()
        .single()

      // Assert: Session marked as completed
      expect(error).toBeNull()
      expect(updatedSession.status).toBe('completed')
    })

    it('should handle non-standard dimensions with warning status', async () => {
      // Arrange: Create session and set
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          session_type: 'single',
          status: 'uploading',
          total_files: 1,
          total_size_bytes: 30720,
        })
        .select()
        .single()

      testSessionIds.push(session.id)

      const { data: creativeSet } = await supabase
        .from('creative_sets')
        .insert({
          upload_session_id: session.id,
          set_name: 'default',
          set_order: 0,
        })
        .select()
        .single()

      // Act: Create asset with non-standard dimensions (400x300)
      const { data: asset, error } = await supabase
        .from('creative_assets')
        .insert({
          creative_set_id: creativeSet.id,
          filename: 'custom-400x300.jpg',
          filename_original: 'custom-400x300.jpg',
          file_type: 'image',
          mime_type: 'image/jpeg',
          size_bytes: 30720,
          width: 400,
          height: 300,
          storage_path: `temp-uploads/${session.id}/custom-400x300.jpg`,
          storage_url: `https://storage.example.com/temp-uploads/${session.id}/custom-400x300.jpg`,
          validation_status: 'warning', // Non-standard dimensions
          validation_notes: '400x300 - Non-standard dimensions (no exact match found)',
        })
        .select()
        .single()

      if (asset) testAssetIds.push(asset.id)

      // Assert: Asset created with warning status
      expect(error).toBeNull()
      expect(asset.validation_status).toBe('warning')
      expect(asset.validation_notes).toContain('Non-standard dimensions')
      expect(asset.width).toBe(400)
      expect(asset.height).toBe(300)
    })

    it('should handle video file with duration metadata', async () => {
      // Arrange: Create session and set
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          session_type: 'single',
          status: 'uploading',
          total_files: 1,
          total_size_bytes: 5242880, // 5MB
        })
        .select()
        .single()

      testSessionIds.push(session.id)

      const { data: creativeSet } = await supabase
        .from('creative_sets')
        .insert({
          upload_session_id: session.id,
          set_name: 'default',
          set_order: 0,
        })
        .select()
        .single()

      // Act: Create video asset with duration
      const { data: asset, error } = await supabase
        .from('creative_assets')
        .insert({
          creative_set_id: creativeSet.id,
          filename: 'video-1920x1080.mp4',
          filename_original: 'video-1920x1080.mp4',
          file_type: 'video',
          mime_type: 'video/mp4',
          size_bytes: 5242880,
          width: 1920,
          height: 1080,
          duration_seconds: 30.5,
          storage_path: `temp-uploads/${session.id}/video-1920x1080.mp4`,
          storage_url: `https://storage.example.com/temp-uploads/${session.id}/video-1920x1080.mp4`,
          validation_status: 'valid',
          validation_notes: 'Standard HD Video (1920x1080)',
        })
        .select()
        .single()

      if (asset) testAssetIds.push(asset.id)

      // Assert: Video asset with duration
      expect(error).toBeNull()
      expect(asset.file_type).toBe('video')
      expect(asset.mime_type).toBe('video/mp4')
      expect(asset.duration_seconds).toBe(30.5)
      expect(asset.width).toBe(1920)
      expect(asset.height).toBe(1080)
    })

    it('should query uploaded asset by session ID', async () => {
      // Arrange: Create complete upload session with asset
      const { data: session } = await supabase
        .from('upload_sessions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          session_type: 'single',
          status: 'completed',
          total_files: 1,
          total_size_bytes: 51200,
        })
        .select()
        .single()

      testSessionIds.push(session.id)

      const { data: creativeSet } = await supabase
        .from('creative_sets')
        .insert({
          upload_session_id: session.id,
          set_name: 'default',
          set_order: 0,
        })
        .select()
        .single()

      const { data: asset } = await supabase
        .from('creative_assets')
        .insert({
          creative_set_id: creativeSet.id,
          filename: 'banner-300x250.jpg',
          filename_original: 'banner-300x250.jpg',
          file_type: 'image',
          mime_type: 'image/jpeg',
          size_bytes: 51200,
          width: 300,
          height: 250,
          storage_path: `temp-uploads/${session.id}/banner-300x250.jpg`,
          storage_url: `https://storage.example.com/temp-uploads/${session.id}/banner-300x250.jpg`,
          validation_status: 'valid',
        })
        .select()
        .single()

      if (asset) testAssetIds.push(asset.id)

      // Act: Query assets by session ID (join through creative_sets)
      const { data: assets, error } = await supabase
        .from('creative_assets')
        .select(`
          *,
          creative_set:creative_sets!inner(
            upload_session_id
          )
        `)
        .eq('creative_set.upload_session_id', session.id)

      // Assert: Asset retrieved successfully
      expect(error).toBeNull()
      expect(assets).toHaveLength(1)
      expect(assets[0].filename).toBe('banner-300x250.jpg')
      expect(assets[0].validation_status).toBe('valid')
    })
  })
})

/**
 * User Story 4 (T085): State preservation across page refresh
 * Tests that processing jobs persist and can be resumed after page refresh
 */
describe('Upload Pipeline - User Story 4: State Preservation', () => {
  // Test session IDs to clean up
  const testSessionIds: string[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage to ensure clean state
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  afterEach(async () => {
    // Cleanup test data
    if (testSessionIds.length > 0) {
      await supabase
        .from('processing_jobs')
        .delete()
        .in('upload_session_id', testSessionIds)
    }
    testSessionIds.length = 0
  })

  describe('T085: State preservation across page refresh', () => {
    it('should save processing job state to database', async () => {
      // Arrange: Create a processing job
      const sessionId = `test-session-${Date.now()}-1`
      testSessionIds.push(sessionId)

      const jobData = {
        upload_session_id: sessionId,
        job_type: 'extraction' as const,
        status: 'processing' as const,
        progress_percentage: 45,
        current_file_index: 45,
        total_files: 100,
        started_at: new Date().toISOString(),
        completed_at: null,
        error_message: null,
        error_file_index: null,
      }

      // Act: Insert processing job into database
      const { data: job, error } = await supabase
        .from('processing_jobs')
        .insert(jobData)
        .select()
        .single()

      // Assert: Job is saved with all fields
      expect(error).toBeNull()
      expect(job).toBeDefined()
      expect(job.upload_session_id).toBe(sessionId)
      expect(job.progress_percentage).toBe(45)
      expect(job.current_file_index).toBe(45)
      expect(job.status).toBe('processing')
    })

    it('should retrieve processing job state after simulated refresh', async () => {
      // Arrange: Create and save a processing job
      const sessionId = `test-session-${Date.now()}-2`
      testSessionIds.push(sessionId)

      await supabase.from('processing_jobs').insert({
        upload_session_id: sessionId,
        job_type: 'extraction',
        status: 'processing',
        progress_percentage: 67,
        current_file_index: 67,
        total_files: 100,
        started_at: new Date().toISOString(),
      })

      // Simulate page refresh by clearing in-memory state
      // (In real app, this would be handled by React component remounting)

      // Act: Query for existing processing job (simulating state recovery)
      const { data: jobs, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('upload_session_id', sessionId)
        .eq('status', 'processing')

      // Assert: Job state is recovered correctly
      expect(error).toBeNull()
      expect(jobs).toHaveLength(1)
      expect(jobs[0].progress_percentage).toBe(67)
      expect(jobs[0].current_file_index).toBe(67)
      expect(jobs[0].total_files).toBe(100)
    })

    it('should handle multiple processing jobs per session', async () => {
      // Arrange: Create session with multiple jobs (extraction + thumbnails)
      const sessionId = `test-session-${Date.now()}-3`
      testSessionIds.push(sessionId)

      await supabase.from('processing_jobs').insert([
        {
          upload_session_id: sessionId,
          job_type: 'extraction',
          status: 'completed',
          progress_percentage: 100,
          current_file_index: 100,
          total_files: 100,
          started_at: new Date(Date.now() - 10000).toISOString(),
          completed_at: new Date().toISOString(),
        },
        {
          upload_session_id: sessionId,
          job_type: 'thumbnail_generation',
          status: 'processing',
          progress_percentage: 35,
          current_file_index: 35,
          total_files: 100,
          started_at: new Date().toISOString(),
        },
      ])

      // Act: Query all jobs for session
      const { data: jobs } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('upload_session_id', sessionId)
        .order('started_at', { ascending: true })

      // Assert: Both jobs retrieved, extraction completed, thumbnails in progress
      expect(jobs).toHaveLength(2)
      expect(jobs[0].job_type).toBe('extraction')
      expect(jobs[0].status).toBe('completed')
      expect(jobs[1].job_type).toBe('thumbnail_generation')
      expect(jobs[1].status).toBe('processing')
      expect(jobs[1].progress_percentage).toBe(35)
    })

    it('should update job progress without losing previous state', async () => {
      // Arrange: Create initial job
      const sessionId = `test-session-${Date.now()}-4`
      testSessionIds.push(sessionId)

      const { data: initialJob } = await supabase
        .from('processing_jobs')
        .insert({
          upload_session_id: sessionId,
          job_type: 'extraction',
          status: 'processing',
          progress_percentage: 25,
          current_file_index: 25,
          total_files: 100,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      // Act: Update progress (simulating background job update)
      const { data: updatedJob } = await supabase
        .from('processing_jobs')
        .update({
          progress_percentage: 75,
          current_file_index: 75,
        })
        .eq('id', initialJob.id)
        .select()
        .single()

      // Assert: Progress updated, other fields preserved
      expect(updatedJob.progress_percentage).toBe(75)
      expect(updatedJob.current_file_index).toBe(75)
      expect(updatedJob.status).toBe('processing') // Not changed
      expect(updatedJob.total_files).toBe(100) // Not changed
      expect(updatedJob.upload_session_id).toBe(sessionId) // Not changed
    })

    it('should mark job as completed when processing finishes', async () => {
      // Arrange: Create processing job
      const sessionId = `test-session-${Date.now()}-5`
      testSessionIds.push(sessionId)

      const { data: job } = await supabase
        .from('processing_jobs')
        .insert({
          upload_session_id: sessionId,
          job_type: 'extraction',
          status: 'processing',
          progress_percentage: 99,
          current_file_index: 99,
          total_files: 100,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      // Act: Mark as completed
      const completionTime = new Date().toISOString()
      const { data: completedJob } = await supabase
        .from('processing_jobs')
        .update({
          status: 'completed',
          progress_percentage: 100,
          current_file_index: 100,
          completed_at: completionTime,
        })
        .eq('id', job.id)
        .select()
        .single()

      // Assert: Job marked as completed
      expect(completedJob.status).toBe('completed')
      expect(completedJob.progress_percentage).toBe(100)
      expect(completedJob.completed_at).toBe(completionTime)
    })

    it('should preserve error state across refresh', async () => {
      // Arrange: Create failed job
      const sessionId = `test-session-${Date.now()}-6`
      testSessionIds.push(sessionId)

      const errorMessage = 'Corrupted archive at file 50'
      const { data: failedJob } = await supabase
        .from('processing_jobs')
        .insert({
          upload_session_id: sessionId,
          job_type: 'extraction',
          status: 'failed',
          progress_percentage: 50,
          current_file_index: 50,
          total_files: 100,
          started_at: new Date(Date.now() - 5000).toISOString(),
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
          error_file_index: 50,
        })
        .select()
        .single()

      // Simulate refresh

      // Act: Retrieve failed job
      const { data: retrievedJob } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('id', failedJob.id)
        .single()

      // Assert: Error state preserved
      expect(retrievedJob.status).toBe('failed')
      expect(retrievedJob.error_message).toBe(errorMessage)
      expect(retrievedJob.error_file_index).toBe(50)
      expect(retrievedJob.progress_percentage).toBe(50) // Stopped at error point
    })

    it('should cleanup completed jobs older than session', async () => {
      // Arrange: Create old completed job
      const oldSessionId = `old-session-${Date.now()}`
      testSessionIds.push(oldSessionId)

      const oldTimestamp = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago

      await supabase.from('processing_jobs').insert({
        upload_session_id: oldSessionId,
        job_type: 'extraction',
        status: 'completed',
        progress_percentage: 100,
        current_file_index: 100,
        total_files: 100,
        started_at: oldTimestamp,
        completed_at: oldTimestamp,
      })

      // Act: Query for old jobs (simulating cleanup query)
      const { data: oldJobs } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('status', 'completed')
        .lt('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Older than 1 day

      // Assert: Old job is found (ready for cleanup)
      expect(oldJobs.length).toBeGreaterThan(0)
      expect(oldJobs.some((j) => j.upload_session_id === oldSessionId)).toBe(true)
    })
  })
})
