// React hook for file upload with TanStack Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  uploadSingleFile,
  uploadMultipleFiles,
  getUploadSession,
  getSessionAssets,
} from '../services/uploadService'
import { validateFile } from '../services/validationService'
import type { UploadSession } from '../types/upload.types'
import type { CreativeAsset } from '../types/asset.types'
import type { ValidationResult } from '../types/asset.types'

export interface UploadState {
  progress: number
  status: 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error'
  validationResults?: ValidationResult[]
  error?: Error
}

export interface UseFileUploadResult {
  // Upload state
  uploadState: UploadState
  session: UploadSession | null
  assets: CreativeAsset[]

  // Actions
  upload: (file: File) => Promise<void>
  reset: () => void

  // Loading states
  isUploading: boolean
  isValidating: boolean
  isError: boolean
}

/**
 * Hook for handling single file upload with validation and progress tracking
 * Integrates with TanStack Query for caching and optimistic updates
 */
export function useFileUpload(): UseFileUploadResult {
  const queryClient = useQueryClient()
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: 'idle',
  })
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Query to fetch upload session details
  const {
    data: session = null,
    isLoading: isLoadingSession,
  } = useQuery({
    queryKey: ['uploadSession', currentSessionId],
    queryFn: () => (currentSessionId ? getUploadSession(currentSessionId) : null),
    enabled: !!currentSessionId,
  })

  // Query to fetch assets for current session
  const { data: assets = [] } = useQuery({
    queryKey: ['sessionAssets', currentSessionId],
    queryFn: () => (currentSessionId ? getSessionAssets(currentSessionId) : []),
    enabled: !!currentSessionId,
  })

  // Mutation for uploading files
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Validation
      setUploadState({ progress: 0, status: 'validating' })
      const validation = await validateFile(file)

      if (!validation.isValid) {
        throw new Error(
          validation.results.find((r) => r.status === 'invalid')?.message ||
            'File validation failed'
        )
      }

      setUploadState({
        progress: 0,
        status: 'uploading',
        validationResults: validation.results,
      })

      // Step 2: Upload
      const result = await uploadSingleFile({
        file,
        onProgress: (progress) => {
          setUploadState((prev) => ({
            ...prev,
            progress,
            status: progress === 100 ? 'processing' : 'uploading',
          }))
        },
      })

      return result
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.session.id)
      setUploadState({ progress: 100, status: 'completed' })

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['uploadSession', data.session.id] })
      queryClient.invalidateQueries({ queryKey: ['sessionAssets', data.session.id] })
    },
    onError: (error: Error) => {
      setUploadState({
        progress: 0,
        status: 'error',
        error,
      })
    },
  })

  const upload = async (file: File): Promise<void> => {
    await uploadMutation.mutateAsync(file)
  }

  const reset = (): void => {
    setUploadState({ progress: 0, status: 'idle' })
    setCurrentSessionId(null)
    uploadMutation.reset()
  }

  return {
    uploadState,
    session,
    assets,
    upload,
    reset,
    isUploading: uploadMutation.isPending || isLoadingSession,
    isValidating: uploadState.status === 'validating',
    isError: uploadState.status === 'error',
  }
}

/**
 * User Story 2 (T060): Hook for multiple file upload with aggregate progress tracking
 * Supports concurrent uploads with individual file status tracking
 */
export interface MultipleUploadState extends UploadState {
  filesStatus: Map<
    string,
    {
      status: 'pending' | 'uploading' | 'completed' | 'error'
      progress: number
      error?: Error
    }
  >
  completedCount: number
  errorCount: number
  totalFiles: number
}

export interface UseMultipleFileUploadResult {
  // Upload state
  uploadState: MultipleUploadState
  session: UploadSession | null
  assets: CreativeAsset[]

  // Actions
  upload: (files: File[]) => Promise<void>
  reset: () => void

  // Loading states
  isUploading: boolean
  isValidating: boolean
  isError: boolean
}

export function useMultipleFileUpload(): UseMultipleFileUploadResult {
  const queryClient = useQueryClient()
  const [uploadState, setUploadState] = useState<MultipleUploadState>({
    progress: 0,
    status: 'idle',
    filesStatus: new Map(),
    completedCount: 0,
    errorCount: 0,
    totalFiles: 0,
  })
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Query to fetch upload session details
  const {
    data: session = null,
    isLoading: isLoadingSession,
  } = useQuery({
    queryKey: ['uploadSession', currentSessionId],
    queryFn: () => (currentSessionId ? getUploadSession(currentSessionId) : null),
    enabled: !!currentSessionId,
  })

  // Query to fetch assets for current session
  const { data: assets = [] } = useQuery({
    queryKey: ['sessionAssets', currentSessionId],
    queryFn: () => (currentSessionId ? getSessionAssets(currentSessionId) : []),
    enabled: !!currentSessionId,
  })

  // Mutation for uploading multiple files
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      // Initialize state for all files
      const filesStatus = new Map(
        files.map((file) => [
          file.name,
          { status: 'pending' as const, progress: 0 },
        ])
      )

      setUploadState({
        progress: 0,
        status: 'uploading',
        filesStatus,
        completedCount: 0,
        errorCount: 0,
        totalFiles: files.length,
      })

      // Upload with callbacks for progress tracking
      const result = await uploadMultipleFiles({
        files,
        onProgress: (aggregateProgress) => {
          setUploadState((prev) => ({
            ...prev,
            progress: aggregateProgress,
          }))
        },
        onFileStart: (filename) => {
          setUploadState((prev) => {
            const newFilesStatus = new Map(prev.filesStatus)
            newFilesStatus.set(filename, {
              status: 'uploading',
              progress: 0,
            })

            return {
              ...prev,
              filesStatus: newFilesStatus,
            }
          })
        },
        onFileComplete: (filename, asset) => {
          setUploadState((prev) => {
            const newFilesStatus = new Map(prev.filesStatus)
            newFilesStatus.set(filename, {
              status: 'completed',
              progress: 100,
            })

            return {
              ...prev,
              filesStatus: newFilesStatus,
              completedCount: prev.completedCount + 1,
            }
          })
        },
        onFileError: (filename, error) => {
          setUploadState((prev) => {
            const newFilesStatus = new Map(prev.filesStatus)
            newFilesStatus.set(filename, {
              status: 'error',
              progress: 0,
              error,
            })

            return {
              ...prev,
              filesStatus: newFilesStatus,
              errorCount: prev.errorCount + 1,
            }
          })
        },
        maxConcurrent: 10,
        continueOnError: true,
      })

      return result
    },
    onSuccess: (data) => {
      setCurrentSessionId(data.session.id)
      setUploadState((prev) => ({
        ...prev,
        progress: 100,
        status: data.errors.length === 0 ? 'completed' : 'error',
      }))

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['uploadSession', data.session.id] })
      queryClient.invalidateQueries({ queryKey: ['sessionAssets', data.session.id] })
    },
    onError: (error: Error) => {
      setUploadState((prev) => ({
        ...prev,
        progress: 0,
        status: 'error',
        error,
      }))
    },
  })

  const upload = async (files: File[]): Promise<void> => {
    await uploadMutation.mutateAsync(files)
  }

  const reset = (): void => {
    setUploadState({
      progress: 0,
      status: 'idle',
      filesStatus: new Map(),
      completedCount: 0,
      errorCount: 0,
      totalFiles: 0,
    })
    setCurrentSessionId(null)
    uploadMutation.reset()
  }

  return {
    uploadState,
    session,
    assets,
    upload,
    reset,
    isUploading: uploadMutation.isPending || isLoadingSession,
    isValidating: uploadState.status === 'validating',
    isError: uploadState.status === 'error',
  }
}
