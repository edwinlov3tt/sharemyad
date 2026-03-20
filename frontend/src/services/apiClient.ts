// API client - calls Workers API
import { storageConfig } from '../config/storage'

export interface ApiError {
  error: string
  code: string
  details?: unknown
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

const API_BASE = storageConfig.presignWorkerUrl

export async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error', code: 'UNKNOWN' }))
      throw new ApiClientError(
        errorData.code || 'API_ERROR',
        errorData.error || `Request failed with status ${response.status}`,
        errorData.details
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }

    throw new ApiClientError(
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed'
    )
  }
}
