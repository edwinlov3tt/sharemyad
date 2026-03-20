import { useState, useRef, useEffect } from 'react'
import { tokens } from '../../config/designTokens'
import { useWorkspace } from '../../context/WorkspaceContext'
import { UploadZone } from '../upload/UploadZone'
import { UploadProgress } from '../upload/UploadProgress'
import { FileValidator } from '../upload/FileValidator'
import { useMultipleFileUpload } from '../../hooks/useFileUpload'

const t = tokens

export function UploadModal() {
  const { showUploadModal, toggleUploadModal } = useWorkspace()
  const { uploadState, upload, reset, isUploading } = useMultipleFileUpload()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const prevShowRef = useRef(showUploadModal)

  // Reset upload state when modal closes (transition from open → closed)
  useEffect(() => {
    if (prevShowRef.current && !showUploadModal) {
      setSelectedFiles([])
      reset()
    }
    prevShowRef.current = showUploadModal
  }, [showUploadModal]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!showUploadModal) return null

  const handleFileSelected = async (fileOrFiles: File | File[]) => {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]
    setSelectedFiles(files)
    await upload(files)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={toggleUploadModal}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 640,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: t.color.bgDefault,
          borderRadius: t.radius.card,
          boxShadow: t.shadow.dropdown,
          padding: t.space[8],
          animation: 'fadeSlideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Close button */}
        <button
          onClick={toggleUploadModal}
          style={{
            position: 'absolute',
            top: t.space[4],
            right: t.space[4],
            width: 32,
            height: 32,
            borderRadius: t.radius.sm,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: t.color.fgMuted,
            transition: `all ${t.transition.base}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = t.color.bgMuted }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <h2
          style={{
            fontSize: t.text.h4,
            fontWeight: t.weight.bold,
            color: t.color.fgDefault,
            margin: 0,
            marginBottom: t.space[1],
          }}
        >
          Upload Assets
        </h2>
        <p
          style={{
            fontSize: t.text.bodySm,
            color: t.color.fgMuted,
            margin: 0,
            marginBottom: t.space[6],
          }}
        >
          Drag and drop files or click to browse. Supports JPG, PNG, GIF, MP4, WEBM, and ZIP.
        </p>

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
          <div style={{ marginTop: t.space[5] }}>
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

            {uploadState.totalFiles > 0 && (uploadState.status === 'uploading' || uploadState.status === 'completed') && (
              <div style={{ marginTop: t.space[3], fontSize: t.text.bodySm, color: t.color.fgMuted }}>
                Completed: {uploadState.completedCount} / {uploadState.totalFiles}
                {uploadState.errorCount > 0 && ` (${uploadState.errorCount} errors)`}
              </div>
            )}
          </div>
        )}

        {/* Validation Results */}
        {uploadState.validationResults && uploadState.validationResults.length > 0 && (
          <div style={{ marginTop: t.space[5] }}>
            <FileValidator
              results={uploadState.validationResults}
              overallStatus={
                uploadState.validationResults.some(r => r.status === 'invalid')
                  ? 'invalid'
                  : uploadState.validationResults.some(r => r.status === 'warning')
                    ? 'warning'
                    : 'valid'
              }
            />
          </div>
        )}

        {/* Done button */}
        {uploadState.status === 'completed' && (
          <div style={{ marginTop: t.space[6], display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={toggleUploadModal}
              style={{
                padding: `${t.space[2]}px ${t.space[5]}px`,
                borderRadius: t.radius.button,
                background: t.color.actionBgPrimary,
                color: '#ffffff',
                border: 'none',
                fontSize: t.text.body,
                fontWeight: t.weight.semibold,
                cursor: 'pointer',
                transition: `opacity ${t.transition.base}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
