// Processing Job Types
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

export interface ProcessingProgress {
  overall: number
  currentStep: string
  estimatedTimeRemaining?: number
}

export interface JobError {
  message: string
  fileIndex?: number
  fileName?: string
}
