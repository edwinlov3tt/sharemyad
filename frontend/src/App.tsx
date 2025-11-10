// Main App Component for ShareMyAd
import React, { useState } from 'react'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { UploadZone } from './components/upload/UploadZone'
import { UploadProgress } from './components/upload/UploadProgress'
import { FileValidator } from './components/upload/FileValidator'
import { AssetGrid } from './components/preview/AssetGrid'
import { useMultipleFileUpload } from './hooks/useFileUpload'

function App() {
  const { uploadState, assets, upload, reset, isUploading } = useMultipleFileUpload()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileSelected = async (fileOrFiles: File | File[]) => {
    // Support both single file and multiple files
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]
    setSelectedFiles(files)
    await upload(files)
  }

  const handleReset = () => {
    setSelectedFiles([])
    reset()
  }

  return (
    <ErrorBoundary>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          padding: '2rem',
        }}
      >
        {/* Header */}
        <header
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            marginBottom: '3rem',
          }}
        >
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0,
              marginBottom: '0.5rem',
            }}
          >
            ShareMyAd
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              margin: 0,
            }}
          >
            Upload and validate creative assets for advertising campaigns
          </p>
        </header>

        {/* Main Content */}
        <main
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* Upload Section */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
                marginBottom: '1.5rem',
              }}
            >
              Upload Asset
            </h2>

            <UploadZone
              onFileSelected={handleFileSelected}
              disabled={isUploading}
              multiple={true}
              accept={{
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/png': ['.png'],
                'image/gif': ['.gif'],
                'video/mp4': ['.mp4'],
                'video/webm': ['.webm'],
                'application/zip': ['.zip'],
              }}
            />

            {/* Upload Progress */}
            {uploadState.status !== 'idle' && (
              <div style={{ marginTop: '1.5rem' }}>
                <UploadProgress
                  progress={uploadState.progress}
                  status={uploadState.status}
                  filename={
                    selectedFiles.length === 1
                      ? selectedFiles[0]?.name
                      : `${selectedFiles.length} files`
                  }
                  error={uploadState.error}
                />

                {/* Multiple file progress details */}
                {selectedFiles.length > 1 && uploadState.status === 'uploading' && (
                  <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    <p>
                      Completed: {uploadState.completedCount} / {uploadState.totalFiles}
                      {uploadState.errorCount > 0 && ` (${uploadState.errorCount} errors)`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Validation Results */}
            {uploadState.validationResults && uploadState.validationResults.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <FileValidator
                  results={uploadState.validationResults}
                  overallStatus={
                    uploadState.validationResults.some((r) => r.status === 'invalid')
                      ? 'invalid'
                      : uploadState.validationResults.some((r) => r.status === 'warning')
                        ? 'warning'
                        : 'valid'
                  }
                />
              </div>
            )}

            {/* Reset Button */}
            {uploadState.status === 'completed' && (
              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                  }}
                >
                  Upload Another File
                </button>
              </div>
            )}
          </section>

          {/* Asset Preview Section */}
          {assets.length > 0 && (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0,
                  marginBottom: '1.5rem',
                }}
              >
                Uploaded Assets ({assets.length})
              </h2>

              <AssetGrid assets={assets} />
            </section>
          )}
        </main>

        {/* Footer */}
        <footer
          style={{
            maxWidth: '1200px',
            margin: '3rem auto 0',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#9ca3af',
          }}
        >
          <p style={{ margin: 0 }}>
            ShareMyAd - Validate creative assets against IAB, Google, Meta, and TikTok standards
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

export default App
