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
import { isZipFile, extractZip } from '../services/zipService'
import type { UploadSession } from '../types/upload.types'
import type { CreativeAsset } from '../types/asset.types'
import type { ValidationResult } from '../types/asset.types'

export interface UploadState {
  progress: number
  status: 'idle' | 'validating' | 'uploading' | 'extracting' | 'processing' | 'completed' | 'error'
  validationResults?: ValidationResult[]
  error?: Error
}

export interface UseFileUploadResult {
  uploadState: UploadState
  session: UploadSession | null
  assets: CreativeAsset[]
  upload: (file: File) => Promise<void>
  reset: () => void
  isUploading: boolean
  isValidating: boolean
  isError: boolean
}

/**
 * Hook for handling single file upload with validation and progress tracking
 */
export function useFileUpload(): UseFileUploadResult {
  const queryClient = useQueryClient()
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: 'idle',
  })
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const {
    data: session = null,
    isLoading: isLoadingSession,
  } = useQuery({
    queryKey: ['uploadSession', currentSessionId],
    queryFn: () => (currentSessionId ? getUploadSession(currentSessionId) : null),
    enabled: !!currentSessionId,
  })

  const { data: assets = [] } = useQuery({
    queryKey: ['sessionAssets', currentSessionId],
    queryFn: () => (currentSessionId ? getSessionAssets(currentSessionId) : []),
    enabled: !!currentSessionId,
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
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
      queryClient.invalidateQueries({ queryKey: ['uploadSession', data.session.id] })
      queryClient.invalidateQueries({ queryKey: ['sessionAssets', data.session.id] })
    },
    onError: (error: Error) => {
      setUploadState({ progress: 0, status: 'error', error })
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
 * Multiple file upload with zip extraction support
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
  creativeSets?: string[]
}

export interface UseMultipleFileUploadResult {
  uploadState: MultipleUploadState
  session: UploadSession | null
  assets: CreativeAsset[]
  upload: (files: File[]) => Promise<void>
  reset: () => void
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

  const {
    data: session = null,
    isLoading: isLoadingSession,
  } = useQuery({
    queryKey: ['uploadSession', currentSessionId],
    queryFn: () => (currentSessionId ? getUploadSession(currentSessionId) : null),
    enabled: !!currentSessionId,
  })

  const { data: assets = [] } = useQuery({
    queryKey: ['sessionAssets', currentSessionId],
    queryFn: () => (currentSessionId ? getSessionAssets(currentSessionId) : []),
    enabled: !!currentSessionId,
  })

  const uploadMutation = useMutation({
    mutationFn: async (inputFiles: File[]) => {
      let filesToUpload: File[] = []
      let detectedSets: string[] = []

      // Check if any file is a zip — if so, extract it
      const zipFiles = inputFiles.filter(isZipFile)
      const regularFiles = inputFiles.filter((f) => !isZipFile(f))

      if (zipFiles.length > 0) {
        setUploadState((prev) => ({
          ...prev,
          progress: 0,
          status: 'extracting',
          filesStatus: new Map(),
          completedCount: 0,
          errorCount: 0,
          totalFiles: 0,
        }))

        // Extract all zip files
        for (const zip of zipFiles) {
          const result = await extractZip(zip)
          filesToUpload.push(...result.files.map((f) => f.file))
          detectedSets.push(...result.creativeSets)
        }
      }

      // Add regular (non-zip) files
      filesToUpload.push(...regularFiles)

      if (filesToUpload.length === 0) {
        throw new Error('No valid files found in the uploaded zip')
      }

      // Deduplicate creative sets
      detectedSets = [...new Set(detectedSets)]

      // Initialize state for all extracted files
      const filesStatus = new Map(
        filesToUpload.map((file) => [
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
        totalFiles: filesToUpload.length,
        creativeSets: detectedSets.length > 0 ? detectedSets : undefined,
      })

      // Upload all extracted files
      const result = await uploadMultipleFiles({
        files: filesToUpload,
        onProgress: (aggregateProgress) => {
          setUploadState((prev) => ({
            ...prev,
            progress: aggregateProgress,
          }))
        },
        onFileStart: (filename) => {
          setUploadState((prev) => {
            const newFilesStatus = new Map(prev.filesStatus)
            newFilesStatus.set(filename, { status: 'uploading', progress: 0 })
            return { ...prev, filesStatus: newFilesStatus }
          })
        },
        onFileComplete: (filename, _asset) => {
          setUploadState((prev) => {
            const newFilesStatus = new Map(prev.filesStatus)
            newFilesStatus.set(filename, { status: 'completed', progress: 100 })
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
            newFilesStatus.set(filename, { status: 'error', progress: 0, error })
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
