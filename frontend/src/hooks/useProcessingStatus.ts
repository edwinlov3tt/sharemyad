/**
 * Hook for tracking upload session status via polling
 * Simple interval polling for upload session status
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { fetchApi } from '../services/apiClient'

export interface ProcessingProgress {
  overall: number
  currentStep: string
  estimatedTimeRemaining?: number
}

export interface UseProcessingStatusOptions {
  sessionId: string
  pollIntervalMs?: number
  onComplete?: () => void
  onError?: (error: Error) => void
}

export interface UseProcessingStatusReturn {
  status: string
  progress: ProcessingProgress
  isProcessing: boolean
  isConnected: boolean
  error: Error | null
  refresh: () => Promise<void>
  cleanup: () => void
}

export function useProcessingStatus({
  sessionId,
  pollIntervalMs = 2000,
  onComplete,
  onError,
}: UseProcessingStatusOptions): UseProcessingStatusReturn {
  const [status, setStatus] = useState('pending')
  const [progress, setProgress] = useState<ProcessingProgress>({
    overall: 0,
    currentStep: 'Initializing...',
  })
  const [error, setError] = useState<Error | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
  }, [onComplete, onError])

  const refresh = useCallback(async () => {
    try {
      const session = await fetchApi<any>(`/api/sessions/${sessionId}`)
      setStatus(session.status)

      if (session.status === 'completed' || session.status === 'partial') {
        setProgress({ overall: 100, currentStep: 'Complete' })
        onCompleteRef.current?.()
        // Stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else if (session.status === 'failed') {
        setProgress({ overall: 0, currentStep: 'Failed' })
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else if (session.status === 'processing') {
        setProgress({ overall: 75, currentStep: 'Processing...' })
      } else if (session.status === 'uploading') {
        setProgress({ overall: 25, currentStep: 'Uploading...' })
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj)
      onErrorRef.current?.(errorObj)
    }
  }, [sessionId])

  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, pollIntervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sessionId, pollIntervalMs, refresh])

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const isProcessing = status === 'uploading' || status === 'processing' || status === 'pending'

  return {
    status,
    progress,
    isProcessing,
    isConnected: true,
    error,
    refresh,
    cleanup,
  }
}
