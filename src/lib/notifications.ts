/**
 * Web Notifications API Wrapper
 *
 * Provides a clean interface for browser notifications with:
 * - Permission management
 * - Notification display with click handling
 * - Badge count support (where available)
 * - Service worker integration
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string; // Used to replace existing notifications with same tag
  data?: Record<string, unknown>; // Custom data for click handling
  requireInteraction?: boolean; // Keep notification visible until user interacts
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

// ============================================================================
// Permission Management
// ============================================================================

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Check if notifications are currently allowed
 */
export function areNotificationsAllowed(): boolean {
  return getNotificationPermission() === 'granted';
}

/**
 * Check if notification permission has been denied
 */
export function areNotificationsDenied(): boolean {
  return getNotificationPermission() === 'denied';
}

/**
 * Check if notification permission hasn't been decided yet
 */
export function isNotificationPermissionDefault(): boolean {
  return getNotificationPermission() === 'default';
}

/**
 * Request notification permission from the user
 * Returns the new permission state
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser');
    return 'denied';
  }

  // If already granted or denied, return current state
  const currentPermission = getNotificationPermission();
  if (currentPermission !== 'default') {
    return currentPermission;
  }

  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

// ============================================================================
// Notification Display
// ============================================================================

/**
 * Show a notification
 * Returns the Notification object if successful, null otherwise
 */
export function showNotification(options: NotificationOptions): Notification | null {
  if (!areNotificationsAllowed()) {
    console.warn('Notifications are not allowed');
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/pwa-192x192.png',
      badge: options.badge || '/pwa-192x192.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
    });

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * Show a notification for a maintenance action that's due
 */
export function showMaintenanceNotification(
  actionId: string,
  actionType: string,
  componentName: string,
  isOverdue: boolean = false
): Notification | null {
  const title = isOverdue
    ? `Overdue: ${actionType}`
    : `Due Now: ${actionType}`;

  const body = `${componentName} - ${actionType} is ${isOverdue ? 'overdue' : 'due now'}`;

  return showNotification({
    title,
    body,
    tag: `maintenance-${actionId}`, // Replace previous notification for same action
    data: {
      type: 'maintenance',
      actionId,
      url: '/', // Navigate to home to see due items
    },
    requireInteraction: isOverdue, // Keep overdue notifications visible
  });
}

/**
 * Show a reminder notification (for escalation)
 */
export function showReminderNotification(
  actionId: string,
  actionType: string,
  componentName: string,
  reminderCount: number
): Notification | null {
  const title = `Reminder: ${actionType}`;
  const body = reminderCount > 1
    ? `${componentName} - ${actionType} still needs attention (reminder ${reminderCount})`
    : `${componentName} - ${actionType} needs your attention`;

  return showNotification({
    title,
    body,
    tag: `reminder-${actionId}`,
    data: {
      type: 'reminder',
      actionId,
      url: '/',
    },
    requireInteraction: true,
  });
}

// ============================================================================
// Click Handling
// ============================================================================

/**
 * Set up a click handler for a notification
 */
export function setupNotificationClickHandler(
  notification: Notification,
  onClick: (data: Record<string, unknown>) => void
): void {
  notification.onclick = (event) => {
    event.preventDefault();

    // Focus the window
    window.focus();

    // Call the click handler with notification data
    const data = (notification as Notification & { data?: Record<string, unknown> }).data || {};
    onClick(data);

    // Close the notification
    notification.close();
  };
}

/**
 * Show a notification with a click handler that navigates to a URL
 */
export function showNotificationWithNavigation(
  options: NotificationOptions,
  navigate: (url: string) => void
): Notification | null {
  const notification = showNotification(options);

  if (notification) {
    setupNotificationClickHandler(notification, (data) => {
      const url = (data.url as string) || '/';
      navigate(url);
    });
  }

  return notification;
}

// ============================================================================
// Badge Count (App Icon Badge)
// ============================================================================

/**
 * Check if badge API is supported
 */
export function isBadgeSupported(): boolean {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

/**
 * Set the app badge count
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  if (!isBadgeSupported()) {
    return false;
  }

  try {
    if (count > 0) {
      await (navigator as Navigator & { setAppBadge: (count: number) => Promise<void> }).setAppBadge(count);
    } else {
      await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
    }
    return true;
  } catch (error) {
    console.error('Error setting badge count:', error);
    return false;
  }
}

/**
 * Clear the app badge
 */
export async function clearBadge(): Promise<boolean> {
  return setBadgeCount(0);
}

// ============================================================================
// Service Worker Notifications (for background)
// ============================================================================

/**
 * Check if service worker is available and has push capability
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
}

/**
 * Show a notification through the service worker (works when app is in background)
 */
export async function showServiceWorkerNotification(
  options: NotificationOptions
): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();

  if (!registration) {
    // Fall back to regular notification
    const notification = showNotification(options);
    return notification !== null;
  }

  try {
    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/pwa-192x192.png',
      badge: options.badge || '/pwa-192x192.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
    });
    return true;
  } catch (error) {
    console.error('Error showing service worker notification:', error);
    return false;
  }
}

// ============================================================================
// Notification Storage (for tracking shown notifications)
// ============================================================================

const SHOWN_NOTIFICATIONS_KEY = 'cpap_shown_notifications';

interface ShownNotificationRecord {
  actionId: string;
  shownAt: string;
  reminderCount: number;
}

/**
 * Get record of shown notifications (for today)
 */
export function getShownNotifications(): ShownNotificationRecord[] {
  try {
    const stored = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
    if (!stored) return [];

    const records: ShownNotificationRecord[] = JSON.parse(stored);

    // Filter to only today's notifications
    const today = new Date().toDateString();
    return records.filter((r) => new Date(r.shownAt).toDateString() === today);
  } catch {
    return [];
  }
}

/**
 * Record that a notification was shown
 */
export function recordNotificationShown(actionId: string, reminderCount: number = 1): void {
  try {
    const records = getShownNotifications();
    const existingIndex = records.findIndex((r) => r.actionId === actionId);

    if (existingIndex >= 0) {
      records[existingIndex].reminderCount = reminderCount;
      records[existingIndex].shownAt = new Date().toISOString();
    } else {
      records.push({
        actionId,
        shownAt: new Date().toISOString(),
        reminderCount,
      });
    }

    localStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Error recording notification:', error);
  }
}

/**
 * Get the reminder count for an action (how many times we've notified today)
 */
export function getReminderCount(actionId: string): number {
  const records = getShownNotifications();
  const record = records.find((r) => r.actionId === actionId);
  return record?.reminderCount || 0;
}

/**
 * Clear notification records (called at start of new day)
 */
export function clearNotificationRecords(): void {
  localStorage.removeItem(SHOWN_NOTIFICATIONS_KEY);
}

// ============================================================================
// Export all functions
// ============================================================================

export const notifications = {
  // Permission
  isSupported: isNotificationSupported,
  getPermission: getNotificationPermission,
  areAllowed: areNotificationsAllowed,
  areDenied: areNotificationsDenied,
  isPermissionDefault: isNotificationPermissionDefault,
  requestPermission: requestNotificationPermission,

  // Display
  show: showNotification,
  showMaintenance: showMaintenanceNotification,
  showReminder: showReminderNotification,
  showWithNavigation: showNotificationWithNavigation,
  showViaServiceWorker: showServiceWorkerNotification,

  // Click handling
  setupClickHandler: setupNotificationClickHandler,

  // Badge
  isBadgeSupported,
  setBadgeCount,
  clearBadge,

  // Records
  getShownRecords: getShownNotifications,
  recordShown: recordNotificationShown,
  getReminderCount,
  clearRecords: clearNotificationRecords,
};
