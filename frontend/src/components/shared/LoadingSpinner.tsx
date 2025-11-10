// Accessible Loading Spinner Component
import React from 'react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  fullScreen?: boolean
  className?: string
}

const sizeMap = {
  sm: '24px',
  md: '40px',
  lg: '64px',
}

const borderWidthMap = {
  sm: '2px',
  md: '3px',
  lg: '4px',
}

export function LoadingSpinner({
  size = 'md',
  label = 'Loading...',
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps): JSX.Element {
  const spinnerSize = sizeMap[size]
  const borderWidth = borderWidthMap[size]

  const spinnerStyles: React.CSSProperties = {
    width: spinnerSize,
    height: spinnerSize,
    border: `${borderWidth} solid #e5e7eb`,
    borderTop: `${borderWidth} solid #3b82f6`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }

  const containerStyles: React.CSSProperties = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999,
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
      }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div
        className={className}
        style={containerStyles}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div style={spinnerStyles} aria-hidden="true" />
        <span
          style={{
            fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
            color: '#6b7280',
            fontWeight: '500',
          }}
        >
          {label}
        </span>
      </div>
    </>
  )
}

// Skeleton loader for content placeholders
export interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
}: SkeletonProps): JSX.Element {
  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>

      <div
        className={className}
        style={{
          width,
          height,
          borderRadius,
          backgroundColor: '#e5e7eb',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
        role="status"
        aria-label="Loading content"
        aria-busy="true"
      />
    </>
  )
}

// Progress bar for upload/processing operations
export interface ProgressBarProps {
  progress: number // 0-100
  label?: string
  showPercentage?: boolean
  color?: string
  className?: string
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  color = '#3b82f6',
  className = '',
}: ProgressBarProps): JSX.Element {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div
      className={className}
      style={{
        width: '100%',
      }}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            color: '#6b7280',
            fontWeight: '500',
          }}
        >
          <span>{label}</span>
          {showPercentage && <span>{clampedProgress}%</span>}
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clampedProgress}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease-in-out',
            borderRadius: '9999px',
          }}
        />
      </div>
    </div>
  )
}
