/**
 * Browser Notification Service
 * User Story 4 (T093, T094): Browser notifications with click handlers
 *
 * Constitution Principle V: Accessibility as Default
 * - Notifications must be accessible and respect user preferences
 */

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  /** Click handler - typically navigates to a page */
  onClick?: () => void
  /** Close handler */
  onClose?: () => void
  /** Error handler */
  onError?: (error: Error) => void
}

/**
 * Request permission for browser notifications
 * @returns {Promise<boolean>} True if permission granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[notificationService] Browser notifications not supported')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    console.warn('[notificationService] Notification permission denied')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('[notificationService] Failed to request permission:', error)
    return false
  }
}

/**
 * Check if notifications are supported and permitted
 */
export function canShowNotifications(): boolean {
  return (
    'Notification' in window &&
    Notification.permission === 'granted'
  )
}

/**
 * Show a browser notification
 * T093: Browser notification on processing completion
 * T094: Notification click handler to navigate to preview
 *
 * @example
 * ```ts
 * await showNotification({
 *   title: 'Processing Complete',
 *   body: 'Your 250 files are ready for review',
 *   onClick: () => {
 *     window.location.href = '/preview/session-123'
 *   }
 * })
 * ```
 */
export async function showNotification(options: NotificationOptions): Promise<Notification | null> {
  // Check browser support
  if (!('Notification' in window)) {
    console.warn('[notificationService] Browser notifications not supported')
    return null
  }

  // Request permission if not already granted
  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission()
    if (!granted) {
      console.warn('[notificationService] Notification permission not granted')
      return null
    }
  }

  try {
    // Create notification
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      badge: options.badge,
      tag: options.tag,
      requireInteraction: false, // Auto-dismiss after timeout
      silent: false, // Play sound
    })

    // Attach event handlers
    if (options.onClick) {
      notification.onclick = () => {
        console.log('[notificationService] Notification clicked')
        options.onClick?.()
        notification.close()
      }
    }

    if (options.onClose) {
      notification.onclose = () => {
        console.log('[notificationService] Notification closed')
        options.onClose?.()
      }
    }

    if (options.onError) {
      notification.onerror = (event) => {
        console.error('[notificationService] Notification error:', event)
        const error = new Error('Notification error')
        options.onError?.(error)
      }
    }

    console.log('[notificationService] Notification shown:', options.title)
    return notification
  } catch (error) {
    console.error('[notificationService] Failed to show notification:', error)
    options.onError?.(error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * Show processing completion notification
 * User Story 4 (T093): Standard notification for completed processing
 */
export async function showProcessingCompleteNotification(
  fileCount: number,
  onNavigateToPreview: () => void
): Promise<Notification | null> {
  const body = fileCount === 1
    ? 'Your file is ready for review'
    : `Your ${fileCount} files are ready for review`

  return showNotification({
    title: 'Processing Complete',
    body,
    tag: 'processing-complete',
    onClick: onNavigateToPreview,
  })
}

/**
 * Show processing error notification
 * User Story 4 (T095): Partial success notification
 */
export async function showProcessingErrorNotification(
  successCount: number,
  failedCount: number,
  totalCount: number,
  onNavigateToPreview: () => void
): Promise<Notification | null> {
  const title = successCount > 0
    ? 'Processing Partially Complete'
    : 'Processing Failed'

  const body = successCount > 0
    ? `${successCount} of ${totalCount} files processed successfully. ${failedCount} failed.`
    : `Failed to process ${failedCount} files`

  return showNotification({
    title,
    body,
    tag: 'processing-error',
    onClick: onNavigateToPreview,
  })
}

/**
 * Close a notification by tag
 */
export function closeNotificationByTag(tag: string): void {
  // Note: This requires iterating all notifications, which isn't fully supported
  // In most browsers. We rely on auto-dismiss and user interaction.
  console.log(`[notificationService] Request to close notification with tag: ${tag}`)
}

/**
 * Check notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (!('Notification' in window)) {
    return null
  }
  return Notification.permission
}

/**
 * Initialize notification service (request permission proactively)
 * Call this early in the application lifecycle
 */
export async function initializeNotificationService(): Promise<void> {
  if (!('Notification' in window)) {
    console.log('[notificationService] Browser notifications not supported')
    return
  }

  if (Notification.permission === 'default') {
    console.log('[notificationService] Notification permission not yet requested')
    // Don't request automatically - wait for user action
  } else if (Notification.permission === 'granted') {
    console.log('[notificationService] Notification permission already granted')
  } else {
    console.log('[notificationService] Notification permission denied')
  }
}
