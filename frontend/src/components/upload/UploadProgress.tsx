// Upload progress indicator with percentage display
// User Story 4 (T091, T092): Extended with current step, estimated time, and ARIA live regions
import React from 'react'
import { ProgressBar } from '../shared/LoadingSpinner'
import type { ProcessingProgress } from '../../types/processing.types'

export interface UploadProgressProps {
  progress: number // 0-100
  status: 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error'
  filename?: string
  error?: Error
  /** User Story 4: Real-time processing progress */
  processingProgress?: ProcessingProgress
  /** User Story 4: Show retry button for failed processing */
  onRetry?: () => void
}

const STATUS_LABELS: Record<string, string> = {
  idle: 'Ready to upload',
  validating: 'Validating file...',
  uploading: 'Uploading',
  processing: 'Processing file...',
  completed: 'Upload complete',
  error: 'Upload failed',
}

/**
 * Upload progress component with clear status messaging
 * Constitution Principle I: Simplicity Through Progressive Disclosure
 * Constitution Principle V: Accessibility as Default - ARIA live regions
 *
 * User Story 4 Extensions:
 * - T091: Current step and estimated time display
 * - T092: ARIA live region updates for screen readers
 */
export function UploadProgress({
  progress,
  status,
  filename,
  error,
  processingProgress,
  onRetry,
}: UploadProgressProps): JSX.Element | null {
  // Don't show anything if idle
  if (status === 'idle') {
    return null
  }

  // Use processing progress if available (User Story 4)
  const displayProgress = processingProgress?.overall ?? progress
  const currentStep = processingProgress?.currentStep
  const estimatedTimeRemaining = processingProgress?.estimatedTimeRemaining

  const statusColor =
    status === 'error'
      ? '#dc2626'
      : status === 'completed'
        ? '#16a34a'
        : '#3b82f6'

  return (
    <div
      style={{
        padding: '1.5rem',
        border: `2px solid ${statusColor}`,
        borderRadius: '8px',
        backgroundColor: '#ffffff',
      }}
      role="region"
      aria-label="Upload progress"
    >
      {/* Filename */}
      {filename && (
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            marginBottom: '0.75rem',
          }}
        >
          {filename}
        </p>
      )}

      {/* Progress Bar */}
      {(status === 'uploading' || status === 'processing') && (
        <>
          <ProgressBar
            progress={displayProgress}
            label={STATUS_LABELS[status]}
            showPercentage={status === 'uploading'}
            color={statusColor}
          />

          {/* User Story 4: Current step and estimated time */}
          {currentStep && (
            <div
              style={{
                marginTop: '0.75rem',
                fontSize: '0.875rem',
                color: '#4b5563',
              }}
              data-testid="current-step"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {currentStep}
            </div>
          )}

          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <div
              style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#6b7280',
              }}
              data-testid="estimated-time"
              aria-live="polite"
            >
              {formatEstimatedTime(estimatedTimeRemaining)} remaining
            </div>
          )}
        </>
      )}

      {/* Status Message */}
      {status === 'validating' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e5e7eb',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: '0.875rem',
              color: '#6b7280',
            }}
            role="status"
            aria-live="polite"
          >
            {STATUS_LABELS[status]}
          </span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Completed Status */}
      {status === 'completed' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {/* Success Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#16a34a' }}
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#16a34a',
            }}
            role="status"
            aria-live="polite"
          >
            {STATUS_LABELS[status]}
          </span>
        </div>
      )}

      {/* Error Status */}
      {status === 'error' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          {/* Error Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }}
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#dc2626',
                margin: 0,
                marginBottom: '0.25rem',
              }}
              role="alert"
              aria-live="assertive"
            >
              {STATUS_LABELS[status]}
            </p>
            {error && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#7f1d1d',
                  margin: 0,
                  marginBottom: onRetry ? '0.75rem' : 0,
                }}
              >
                {error.message}
              </p>
            )}

            {/* User Story 4: Retry button for failed processing (T096) */}
            {onRetry && (
              <button
                onClick={onRetry}
                data-testid="retry-button"
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6'
                }}
              >
                Retry Processing
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Format estimated time in human-readable format
 * User Story 4 (T091): Helper for estimated time display
 */
function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    return `${minutes}m ${remainingSeconds}s`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  return `${hours}h ${remainingMinutes}m`
}
