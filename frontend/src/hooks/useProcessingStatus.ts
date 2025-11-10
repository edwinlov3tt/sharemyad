/**
 * Hook for tracking processing job status with Supabase Realtime
 * User Story 4 (T087): Real-time progress updates via Server-Sent Events
 *
 * Constitution Principle II: Performance & Responsiveness
 * - Real-time updates reduce polling overhead
 * - Push vs pull for better UX
 *
 * Constitution Principle V: Accessibility as Default
 * - Progress updates announced via ARIA live regions
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../services/apiClient'
import type { ProcessingJob, ProcessingProgress } from '../types/processing.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface UseProcessingStatusOptions {
  /** Upload session ID to track */
  sessionId: string
  /** Enable auto-recovery on connection loss */
  autoReconnect?: boolean
  /** Callback when processing completes */
  onComplete?: (jobs: ProcessingJob[]) => void
  /** Callback when processing fails */
  onError?: (error: Error) => void
  /** Callback on each progress update */
  onProgress?: (progress: ProcessingProgress) => void
}

export interface UseProcessingStatusReturn {
  /** Active processing jobs */
  jobs: ProcessingJob[]
  /** Overall processing progress (0-100) */
  progress: ProcessingProgress
  /** Is currently processing */
  isProcessing: boolean
  /** Connection state */
  isConnected: boolean
  /** Any error that occurred */
  error: Error | null
  /** Manually refresh job status */
  refresh: () => Promise<void>
  /** Cleanup subscription */
  cleanup: () => void
}

/**
 * Subscribe to real-time processing job updates via Supabase Realtime
 *
 * @example
 * ```tsx
 * const { jobs, progress, isProcessing } = useProcessingStatus({
 *   sessionId: 'abc-123',
 *   onComplete: (jobs) => {
 *     showNotification('Processing complete!');
 *   },
 * });
 *
 * return (
 *   <div>
 *     <p>{progress.currentStep}</p>
 *     <ProgressBar value={progress.overall} />
 *   </div>
 * );
 * ```
 */
export function useProcessingStatus({
  sessionId,
  autoReconnect = true,
  onComplete,
  onError,
  onProgress,
}: UseProcessingStatusOptions): UseProcessingStatusReturn {
  const [jobs, setJobs] = useState<ProcessingJob[]>([])
  const [progress, setProgress] = useState<ProcessingProgress>({
    overall: 0,
    currentStep: 'Initializing...',
    estimatedTimeRemaining: undefined,
  })
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)
  const onProgressRef = useRef(onProgress)

  // Keep callbacks fresh without triggering re-subscription
  useEffect(() => {
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
    onProgressRef.current = onProgress
  }, [onComplete, onError, onProgress])

  /**
   * Calculate overall progress from active jobs
   */
  const calculateOverallProgress = useCallback(
    (activeJobs: ProcessingJob[]): ProcessingProgress => {
      if (activeJobs.length === 0) {
        return {
          overall: 0,
          currentStep: 'Initializing...',
        }
      }

      // Calculate weighted average of job progress
      const totalProgress = activeJobs.reduce(
        (sum, job) => sum + job.progressPercentage,
        0
      )
      const overall = Math.round(totalProgress / activeJobs.length)

      // Find the current processing job
      const currentJob = activeJobs.find((j) => j.status === 'processing')

      // Generate current step description
      let currentStep = 'Processing...'
      if (currentJob) {
        const jobTypeLabel = {
          extraction: 'Extracting files',
          thumbnail_generation: 'Generating thumbnails',
          validation: 'Validating assets',
          malware_scan: 'Scanning for malware',
        }[currentJob.jobType]

        currentStep = `${jobTypeLabel}... ${currentJob.currentFileIndex}/${currentJob.totalFiles} (${currentJob.progressPercentage}%)`
      }

      // Calculate estimated time remaining
      // Simple heuristic: assume remaining % takes proportional time
      const estimatedTimeRemaining =
        currentJob && currentJob.startedAt
          ? calculateEstimatedTime(currentJob)
          : undefined

      return {
        overall,
        currentStep,
        estimatedTimeRemaining,
      }
    },
    []
  )

  /**
   * Calculate estimated time remaining for a job
   */
  const calculateEstimatedTime = (job: ProcessingJob): number | undefined => {
    if (!job.startedAt || job.progressPercentage === 0) {
      return undefined
    }

    const startTime = new Date(job.startedAt).getTime()
    const currentTime = Date.now()
    const elapsedSeconds = (currentTime - startTime) / 1000

    const progressFraction = job.progressPercentage / 100
    const estimatedTotalTime = elapsedSeconds / progressFraction
    const remaining = Math.round(estimatedTotalTime - elapsedSeconds)

    return Math.max(0, remaining)
  }

  /**
   * Fetch current job status from database
   */
  const refresh = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('upload_session_id', sessionId)
        .order('started_at', { ascending: true })

      if (fetchError) {
        throw new Error(`Failed to fetch processing jobs: ${fetchError.message}`)
      }

      const activeJobs = (data || []).map(mapDatabaseJobToProcessingJob)
      setJobs(activeJobs)

      const newProgress = calculateOverallProgress(activeJobs)
      setProgress(newProgress)

      // Notify progress callback
      if (onProgressRef.current) {
        onProgressRef.current(newProgress)
      }

      // Check if all jobs completed
      const allCompleted = activeJobs.every(
        (j) => j.status === 'completed' || j.status === 'failed'
      )
      if (allCompleted && activeJobs.length > 0 && onCompleteRef.current) {
        onCompleteRef.current(activeJobs)
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj)
      if (onErrorRef.current) {
        onErrorRef.current(errorObj)
      }
    }
  }, [sessionId, calculateOverallProgress])

  /**
   * Map database row to ProcessingJob type
   */
  const mapDatabaseJobToProcessingJob = (row: any): ProcessingJob => ({
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
  })

  /**
   * Setup Supabase Realtime subscription
   */
  useEffect(() => {
    // Initial fetch
    refresh()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`processing:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processing_jobs',
          filter: `upload_session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[useProcessingStatus] Job updated:', payload)

          // Update job in state
          setJobs((prevJobs) => {
            const updatedJobs = prevJobs.map((job) =>
              job.id === payload.new.id
                ? mapDatabaseJobToProcessingJob(payload.new)
                : job
            )

            const newProgress = calculateOverallProgress(updatedJobs)
            setProgress(newProgress)

            // Notify progress callback
            if (onProgressRef.current) {
              onProgressRef.current(newProgress)
            }

            // Check if all jobs completed
            const allCompleted = updatedJobs.every(
              (j) => j.status === 'completed' || j.status === 'failed'
            )
            if (allCompleted && updatedJobs.length > 0 && onCompleteRef.current) {
              onCompleteRef.current(updatedJobs)
            }

            return updatedJobs
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'processing_jobs',
          filter: `upload_session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[useProcessingStatus] New job created:', payload)

          // Add new job to state
          const newJob = mapDatabaseJobToProcessingJob(payload.new)
          setJobs((prevJobs) => {
            const updatedJobs = [...prevJobs, newJob]
            const newProgress = calculateOverallProgress(updatedJobs)
            setProgress(newProgress)

            if (onProgressRef.current) {
              onProgressRef.current(newProgress)
            }

            return updatedJobs
          })
        }
      )
      .subscribe((status) => {
        console.log('[useProcessingStatus] Subscription status:', status)

        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          if (autoReconnect) {
            console.log('[useProcessingStatus] Connection lost, reconnecting...')
            // Supabase client handles automatic reconnection
          }
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        }
      })

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      console.log('[useProcessingStatus] Cleaning up subscription')
      channel.unsubscribe()
    }
  }, [sessionId, refresh, calculateOverallProgress, autoReconnect])

  /**
   * Manual cleanup function
   */
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
  }, [])

  // Derive isProcessing from jobs
  const isProcessing = jobs.some((job) => job.status === 'processing' || job.status === 'queued')

  return {
    jobs,
    progress,
    isProcessing,
    isConnected,
    error,
    refresh,
    cleanup,
  }
}
