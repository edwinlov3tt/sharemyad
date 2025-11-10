// Error Boundary Component with recovery UI
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo)

    // Log to error tracking service (e.g., Sentry) in production
    if (import.meta.env.PROD) {
      // TODO: Add error tracking integration
      console.error('Production error:', {
        error: error.message,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '2rem',
            margin: '2rem auto',
            maxWidth: '600px',
            border: '2px solid #dc2626',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
          }}
        >
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#991b1b',
              marginBottom: '1rem',
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              color: '#7f1d1d',
              marginBottom: '1rem',
            }}
          >
            {this.state.error.message || 'An unexpected error occurred'}
          </p>

          {import.meta.env.DEV && (
            <details
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #fca5a5',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#991b1b',
                }}
              >
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  color: '#7f1d1d',
                }}
              >
                {this.state.error.stack}
              </pre>
            </details>
          )}

          <button
            onClick={this.resetError}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook-friendly wrapper for use with React.lazy and Suspense
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, reset: () => void) => ReactNode
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
