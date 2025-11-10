// File validator with traffic light feedback (green/yellow/red)
import React from 'react'
import type { ValidationResult, ValidationStatus } from '../../types/asset.types'

export interface FileValidatorProps {
  results: ValidationResult[]
  overallStatus: ValidationStatus
}

/**
 * File validator component with traffic light system
 * Constitution Principle I: Simplicity Through Progressive Disclosure
 * Constitution Principle V: Accessibility as Default - Color + Icons + Text
 */
export function FileValidator({
  results,
  overallStatus,
}: FileValidatorProps): JSX.Element {
  const statusConfig = {
    valid: {
      color: '#16a34a',
      bgColor: '#f0fdf4',
      borderColor: '#86efac',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      label: 'Valid',
    },
    warning: {
      color: '#ca8a04',
      bgColor: '#fefce8',
      borderColor: '#fde047',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      label: 'Warning',
    },
    invalid: {
      color: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#fca5a5',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      label: 'Invalid',
    },
    pending: {
      color: '#6b7280',
      bgColor: '#f9fafb',
      borderColor: '#d1d5db',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      label: 'Pending',
    },
  }

  const config = statusConfig[overallStatus]

  return (
    <div
      style={{
        border: `2px solid ${config.borderColor}`,
        borderRadius: '8px',
        backgroundColor: config.bgColor,
        padding: '1rem',
      }}
      role="status"
      aria-label={`Validation status: ${config.label}`}
    >
      {/* Overall Status Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ color: config.color }}>{config.icon}</div>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: config.color,
            margin: 0,
          }}
        >
          {config.label}
        </h3>
      </div>

      {/* Validation Results */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {results.map((result, index) => {
          const resultConfig = statusConfig[result.status]

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              {/* Status Indicator */}
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: resultConfig.color,
                  flexShrink: 0,
                  marginTop: '3px',
                }}
                role="img"
                aria-label={`${resultConfig.label} indicator`}
              />

              {/* Result Message */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    color: '#374151',
                    lineHeight: '1.5',
                  }}
                >
                  {result.message}
                </p>
                {result.standard && (
                  <p
                    style={{
                      margin: 0,
                      marginTop: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#6b7280',
                    }}
                  >
                    Standard: {result.standard}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
