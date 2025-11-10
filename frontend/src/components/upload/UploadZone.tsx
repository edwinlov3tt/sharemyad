// Drag-and-drop upload zone with file picker
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export interface UploadZoneProps {
  onFileSelected: (file: File | File[]) => void
  accept?: Record<string, string[]>
  maxSize?: number
  disabled?: boolean
  multiple?: boolean
}

/**
 * Upload zone component with drag-and-drop and click-to-browse
 * Constitution Principle I: Simplicity Through Progressive Disclosure
 * Constitution Principle V: Accessibility as Default
 */
export function UploadZone({
  onFileSelected,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
  },
  maxSize = 500 * 1024 * 1024, // 500MB default
  disabled = false,
  multiple = false,
}: UploadZoneProps): JSX.Element {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        if (multiple) {
          onFileSelected(acceptedFiles) // User Story 2: Multiple files
        } else {
          onFileSelected(acceptedFiles[0]) // User Story 1: Single file
        }
      }
    },
    [onFileSelected, multiple]
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    disabled,
    multiple,
    noClick: false,
    noKeyboard: false,
  })

  const errorMessage = fileRejections[0]?.errors[0]?.message

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${
          isDragReject
            ? '#dc2626'
            : isDragActive
              ? '#3b82f6'
              : '#d1d5db'
        }`,
        borderRadius: '8px',
        padding: '3rem 2rem',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: isDragActive
          ? '#eff6ff'
          : isDragReject
            ? '#fef2f2'
            : '#f9fafb',
        transition: 'all 0.2s ease-in-out',
        outline: 'none',
      }}
      role="button"
      aria-label="Upload file"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        // Accessibility: Allow space/enter to trigger file picker
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault()
          const input = e.currentTarget.querySelector('input')
          input?.click()
        }
      }}
    >
      <input {...getInputProps()} aria-label="File input" />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Upload Icon */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: isDragReject ? '#dc2626' : '#6b7280' }}
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        {/* Main Message */}
        <div>
          {isDragActive ? (
            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: isDragReject ? '#dc2626' : '#3b82f6',
                margin: 0,
              }}
            >
              {isDragReject ? 'File type not supported' : 'Drop file here'}
            </p>
          ) : (
            <>
              <p
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginTop: 0,
                  marginLeft: 0,
                  marginRight: 0,
                  marginBottom: '0.5rem',
                }}
              >
                Drag & drop your file here
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0,
                }}
              >
                or click to browse
              </p>
            </>
          )}
        </div>

        {/* File Type Info */}
        {!isDragActive && (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              margin: 0,
            }}
          >
            Supported: JPG, PNG, GIF, MP4, WEBM, ZIP{multiple ? ' (multiple files allowed)' : ''} (max {maxSize / (1024 * 1024)}MB)
          </p>
        )}

        {/* Error Message */}
        {errorMessage && (
          <p
            style={{
              fontSize: '0.875rem',
              color: '#dc2626',
              marginTop: '0.5rem',
              marginBottom: 0,
              marginLeft: 0,
              marginRight: 0,
            }}
            role="alert"
            aria-live="assertive"
          >
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  )
}
