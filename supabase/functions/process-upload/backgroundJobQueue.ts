/**
 * Background Job Queue for Large File Processing
 * User Story 4 (T089, T090): Background processing with state preservation
 *
 * Constitution Principle II: Performance & Responsiveness
 * - Jobs requiring > 5 seconds run in background
 * - Progress updates every 2 seconds
 * - State preserved in processing_jobs table
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type JobType = 'extraction' | 'thumbnail_generation' | 'validation' | 'malware_scan'
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface ProcessingJob {
  id: string
  uploadSessionId: string
  jobType: JobType
  status: JobStatus
  progressPercentage: number
  currentFileIndex: number
  totalFiles: number
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  errorFileIndex: number | null
}

export interface JobProgress {
  currentFileIndex: number
  totalFiles: number
  progressPercentage: number
  currentStep: string
  estimatedTimeRemaining?: number
}

export interface ProcessingResult {
  success: boolean
  processedCount: number
  failedCount: number
  errors: Array<{ fileIndex: number; error: string }>
  partialSuccess: boolean
}

/**
 * Create a new processing job in the database
 */
export async function createProcessingJob(
  supabase: SupabaseClient,
  uploadSessionId: string,
  jobType: JobType,
  totalFiles: number
): Promise<ProcessingJob> {
  const { data: job, error } = await supabase
    .from('processing_jobs')
    .insert({
      upload_session_id: uploadSessionId,
      job_type: jobType,
      status: 'queued',
      progress_percentage: 0,
      current_file_index: 0,
      total_files: totalFiles,
      started_at: null,
      completed_at: null,
      error_message: null,
      error_file_index: null,
    })
    .select()
    .single()

  if (error || !job) {
    throw new Error(`Failed to create processing job: ${error?.message || 'Unknown error'}`)
  }

  return mapDatabaseJobToProcessingJob(job)
}

/**
 * Update job progress (called every 2 seconds during processing)
 * T088: Progress updates every 2 seconds
 */
export async function updateJobProgress(
  supabase: SupabaseClient,
  jobId: string,
  progress: JobProgress
): Promise<void> {
  const { error } = await supabase
    .from('processing_jobs')
    .update({
      progress_percentage: progress.progressPercentage,
      current_file_index: progress.currentFileIndex,
      status: 'processing',
    })
    .eq('id', jobId)

  if (error) {
    console.error(`[updateJobProgress] Failed to update job ${jobId}:`, error)
    // Don't throw - progress updates should not halt processing
  } else {
    console.log(
      `[updateJobProgress] Job ${jobId}: ${progress.currentFileIndex}/${progress.totalFiles} (${progress.progressPercentage}%)`
    )
  }
}

/**
 * Mark job as started
 */
export async function markJobStarted(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  const { error } = await supabase
    .from('processing_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  if (error) {
    console.error(`[markJobStarted] Failed to mark job ${jobId} as started:`, error)
  }
}

/**
 * Mark job as completed
 */
export async function markJobCompleted(
  supabase: SupabaseClient,
  jobId: string,
  result: ProcessingResult
): Promise<void> {
  const { error } = await supabase
    .from('processing_jobs')
    .update({
      status: result.success ? 'completed' : 'failed',
      progress_percentage: 100,
      current_file_index: result.processedCount,
      completed_at: new Date().toISOString(),
      error_message: result.errors.length > 0
        ? `Failed to process ${result.failedCount} files. First error: ${result.errors[0]?.error}`
        : null,
      error_file_index: result.errors.length > 0 ? result.errors[0]?.fileIndex : null,
    })
    .eq('id', jobId)

  if (error) {
    console.error(`[markJobCompleted] Failed to mark job ${jobId} as completed:`, error)
  }
}

/**
 * Mark job as failed
 */
export async function markJobFailed(
  supabase: SupabaseClient,
  jobId: string,
  errorMessage: string,
  fileIndex?: number
): Promise<void> {
  const { error } = await supabase
    .from('processing_jobs')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
      error_file_index: fileIndex || null,
    })
    .eq('id', jobId)

  if (error) {
    console.error(`[markJobFailed] Failed to mark job ${jobId} as failed:`, error)
  }
}

/**
 * Process files with progress updates every 2 seconds
 * T089: Background job queue for files requiring > 5 seconds
 * T095: Partial success handling for corrupted archives
 */
export async function processFilesWithProgress<T>(
  supabase: SupabaseClient,
  jobId: string,
  files: T[],
  processor: (file: T, index: number) => Promise<void>,
  options: {
    progressUpdateInterval?: number // milliseconds, default 2000 (2 seconds)
    continueOnError?: boolean // default true
  } = {}
): Promise<ProcessingResult> {
  const { progressUpdateInterval = 2000, continueOnError = true } = options

  // Mark job as started
  await markJobStarted(supabase, jobId)

  const results: ProcessingResult = {
    success: true,
    processedCount: 0,
    failedCount: 0,
    errors: [],
    partialSuccess: false,
  }

  let lastProgressUpdate = Date.now()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    try {
      // Process the file
      await processor(file, i)
      results.processedCount++
    } catch (error) {
      console.error(`[processFilesWithProgress] Error processing file ${i}:`, error)

      results.failedCount++
      results.errors.push({
        fileIndex: i,
        error: error instanceof Error ? error.message : String(error),
      })

      if (!continueOnError) {
        // Stop processing on first error
        results.success = false
        await markJobFailed(
          supabase,
          jobId,
          `Failed at file ${i}: ${error instanceof Error ? error.message : String(error)}`,
          i
        )
        return results
      }
    }

    // Update progress every 2 seconds
    const now = Date.now()
    if (now - lastProgressUpdate >= progressUpdateInterval) {
      const progress: JobProgress = {
        currentFileIndex: i + 1,
        totalFiles: files.length,
        progressPercentage: Math.round(((i + 1) / files.length) * 100),
        currentStep: `Processing file ${i + 1} of ${files.length}`,
      }

      await updateJobProgress(supabase, jobId, progress)
      lastProgressUpdate = now
    }
  }

  // Final progress update
  await updateJobProgress(supabase, jobId, {
    currentFileIndex: files.length,
    totalFiles: files.length,
    progressPercentage: 100,
    currentStep: 'Completed',
  })

  // Determine final status
  if (results.failedCount > 0) {
    results.partialSuccess = results.processedCount > 0
    results.success = results.partialSuccess
  }

  // Mark job as completed
  await markJobCompleted(supabase, jobId, results)

  return results
}

/**
 * Retry a failed processing job
 * T096: Retry/continue options for failed jobs
 */
export async function retryFailedJob(
  supabase: SupabaseClient,
  jobId: string,
  startFromFileIndex?: number
): Promise<void> {
  const { data: job, error: fetchError } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (fetchError || !job) {
    throw new Error(`Failed to fetch job ${jobId}: ${fetchError?.message || 'Not found'}`)
  }

  if (job.status !== 'failed') {
    throw new Error(`Job ${jobId} is not in failed state`)
  }

  // Reset job to processing state
  const resumeFromIndex = startFromFileIndex !== undefined
    ? startFromFileIndex
    : job.error_file_index || 0

  const { error: updateError } = await supabase
    .from('processing_jobs')
    .update({
      status: 'processing',
      current_file_index: resumeFromIndex,
      error_message: null,
      error_file_index: null,
      started_at: new Date().toISOString(),
      completed_at: null,
    })
    .eq('id', jobId)

  if (updateError) {
    throw new Error(`Failed to retry job ${jobId}: ${updateError.message}`)
  }

  console.log(`[retryFailedJob] Job ${jobId} reset to processing state, resuming from file ${resumeFromIndex}`)
}

/**
 * Get active processing jobs for a session
 */
export async function getActiveJobs(
  supabase: SupabaseClient,
  uploadSessionId: string
): Promise<ProcessingJob[]> {
  const { data: jobs, error } = await supabase
    .from('processing_jobs')
    .select('*')
    .eq('upload_session_id', uploadSessionId)
    .in('status', ['queued', 'processing'])
    .order('started_at', { ascending: true })

  if (error) {
    console.error('[getActiveJobs] Failed to fetch active jobs:', error)
    return []
  }

  return (jobs || []).map(mapDatabaseJobToProcessingJob)
}

/**
 * Check if a job should run in background
 * Heuristic: Estimate if processing will take > 5 seconds
 */
export function shouldRunInBackground(
  fileCount: number,
  avgFileSizeBytes: number
): boolean {
  // Rough heuristic:
  // - Files < 1MB: ~100ms per file
  // - Files 1-10MB: ~300ms per file
  // - Files > 10MB: ~500ms per file
  // Run in background if estimated time > 5 seconds

  const estimatedTimePerFile = avgFileSizeBytes < 1024 * 1024
    ? 100
    : avgFileSizeBytes < 10 * 1024 * 1024
    ? 300
    : 500

  const estimatedTotalTime = fileCount * estimatedTimePerFile
  const shouldBackground = estimatedTotalTime > 5000 // 5 seconds

  console.log(
    `[shouldRunInBackground] Files: ${fileCount}, Avg size: ${avgFileSizeBytes}, Estimated time: ${estimatedTotalTime}ms, Background: ${shouldBackground}`
  )

  return shouldBackground
}

/**
 * Map database row to ProcessingJob
 */
function mapDatabaseJobToProcessingJob(row: any): ProcessingJob {
  return {
    id: row.id,
    uploadSessionId: row.upload_session_id,
    jobType: row.job_type,
    status: row.status,
    progressPercentage: row.progress_percentage || 0,
    currentFileIndex: row.current_file_index || 0,
    totalFiles: row.total_files || 0,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
    errorFileIndex: row.error_file_index,
  }
}

/**
 * Cleanup old completed jobs (optional, for maintenance)
 * Remove jobs completed > 7 days ago
 */
export async function cleanupOldJobs(supabase: SupabaseClient): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 7)

  const { data, error } = await supabase
    .from('processing_jobs')
    .delete()
    .eq('status', 'completed')
    .lt('completed_at', cutoffDate.toISOString())
    .select('id')

  if (error) {
    console.error('[cleanupOldJobs] Failed to cleanup old jobs:', error)
    return 0
  }

  const deletedCount = data?.length || 0
  console.log(`[cleanupOldJobs] Deleted ${deletedCount} old jobs`)
  return deletedCount
}
