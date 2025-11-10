// Base API client with error handling
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  const headers = new Headers(options?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('Content-Type', 'application/json')

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData: ApiError = await response.json()
      throw new ApiClientError(
        errorData.code,
        errorData.error,
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

export function getApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || supabaseUrl
  return `${baseUrl}/functions/v1${path}`
}
