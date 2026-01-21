/**
 * Notification Scheduling Service
 *
 * Handles checking for due maintenance items and triggering notifications.
 * Implements progressive reminder escalation based on reminder strategy.
 */

import { dbOperations } from './db-operations';
import type { MaintenanceAction, NotificationConfig, Component } from './db';
import {
  areNotificationsAllowed,
  showMaintenanceNotification,
  showReminderNotification,
  setBadgeCount,
  getReminderCount,
  recordNotificationShown,
  setupNotificationClickHandler,
} from './notifications';
import { isOverdue } from './date-helpers';

// ============================================================================
// Types
// ============================================================================

export interface DueItem {
  action: MaintenanceAction;
  component: Component;
  notificationConfig?: NotificationConfig;
  isOverdue: boolean;
  hoursOverdue: number;
}

export interface NotificationSchedulerOptions {
  onNotificationClick?: (actionId: string) => void;
  checkIntervalMinutes?: number;
}

// ============================================================================
// Due Item Detection
// ============================================================================

/**
 * Get all items that are due or overdue for notification
 */
export async function getDueItemsForNotification(): Promise<DueItem[]> {
  const now = new Date();
  const allActions = await dbOperations.maintenanceActions.getAll();
  const allComponents = await dbOperations.components.getAll();
  const allNotificationConfigs = await dbOperations.notificationConfigs.getAll();

  const dueItems: DueItem[] = [];

  for (const action of allActions) {
    if (!action.next_due || !action.id) continue;

    // Check if action is due or overdue
    const isDue = action.next_due <= now;
    if (!isDue) continue;

    // Get the component for this action
    const component = allComponents.find((c) => c.id === action.component_id);
    if (!component || !component.is_active) continue;

    // Get notification config for this action
    const notificationConfig = allNotificationConfigs.find(
      (nc) => nc.action_id === action.id
    );

    // Skip if notifications are explicitly disabled for this action
    if (notificationConfig && !notificationConfig.enabled) continue;

    // Calculate how overdue
    const msOverdue = now.getTime() - action.next_due.getTime();
    const hoursOverdue = Math.floor(msOverdue / (1000 * 60 * 60));

    dueItems.push({
      action,
      component,
      notificationConfig,
      isOverdue: isOverdue(action.next_due),
      hoursOverdue: Math.max(0, hoursOverdue),
    });
  }

  // Sort by priority: overdue first, then by how overdue
  return dueItems.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return b.hoursOverdue - a.hoursOverdue;
  });
}

// ============================================================================
// Escalation Logic
// ============================================================================

/**
 * Determine if a reminder should be shown based on escalation strategy
 */
function shouldShowReminder(
  dueItem: DueItem,
  currentReminderCount: number
): boolean {
  const { notificationConfig, action, hoursOverdue } = dueItem;

  // Default escalation based on reminder_strategy if no notification config
  const strategy = notificationConfig?.escalation_strategy ||
    getDefaultEscalationStrategy(action.reminder_strategy);
  const intervals = notificationConfig?.escalation_intervals ||
    getDefaultEscalationIntervals(action.reminder_strategy);

  switch (strategy) {
    case 'single_daily':
      // Only one notification per day
      return currentReminderCount === 0;

    case 'multiple_daily':
      // Show at configured intervals
      return intervals.some((interval) => {
        // Check if we've passed this interval and haven't shown this reminder yet
        return hoursOverdue >= interval && currentReminderCount <= intervals.indexOf(interval);
      });

    case 'increasing_urgency':
      // Show more frequently as time goes on
      // Start with gentler reminders, increase urgency
      if (currentReminderCount === 0) return true;
      if (hoursOverdue >= 4 && currentReminderCount === 1) return true;
      if (hoursOverdue >= 8 && currentReminderCount === 2) return true;
      if (hoursOverdue >= 24 && currentReminderCount === 3) return true;
      return false;

    default:
      return currentReminderCount === 0;
  }
}

/**
 * Get default escalation strategy based on reminder type
 */
function getDefaultEscalationStrategy(
  reminderStrategy: MaintenanceAction['reminder_strategy']
): NotificationConfig['escalation_strategy'] {
  switch (reminderStrategy) {
    case 'gentle':
      return 'single_daily';
    case 'standard':
      return 'multiple_daily';
    case 'urgent':
      return 'increasing_urgency';
    default:
      return 'single_daily';
  }
}

/**
 * Get default escalation intervals (in hours)
 */
function getDefaultEscalationIntervals(
  reminderStrategy: MaintenanceAction['reminder_strategy']
): number[] {
  switch (reminderStrategy) {
    case 'gentle':
      return [0]; // Once at due time
    case 'standard':
      return [0, 4, 8]; // At due time, then 4 and 8 hours later
    case 'urgent':
      return [0, 2, 4, 8, 12]; // More frequent reminders
    default:
      return [0];
  }
}

// ============================================================================
// Notification Triggering
// ============================================================================

/**
 * Check for due items and show notifications as needed
 */
export async function checkAndNotify(
  onNotificationClick?: (actionId: string) => void
): Promise<number> {
  // Don't do anything if notifications aren't allowed
  if (!areNotificationsAllowed()) {
    return 0;
  }

  const dueItems = await getDueItemsForNotification();
  let notificationsShown = 0;

  for (const item of dueItems) {
    const actionId = item.action.id!;
    const currentReminderCount = getReminderCount(actionId);

    // Check if we should show a reminder based on escalation strategy
    if (!shouldShowReminder(item, currentReminderCount)) {
      continue;
    }

    // Show the notification
    const notification = item.isOverdue && currentReminderCount > 0
      ? showReminderNotification(
          actionId,
          item.action.action_type,
          item.component.name,
          currentReminderCount + 1
        )
      : showMaintenanceNotification(
          actionId,
          item.action.action_type,
          item.component.name,
          item.isOverdue
        );

    if (notification) {
      // Set up click handler
      if (onNotificationClick) {
        setupNotificationClickHandler(notification, () => {
          onNotificationClick(actionId);
        });
      }

      // Record that we showed this notification
      recordNotificationShown(actionId, currentReminderCount + 1);
      notificationsShown++;
    }
  }

  // Update badge count
  await updateBadgeCount();

  return notificationsShown;
}

/**
 * Update the app badge to show number of due items
 */
export async function updateBadgeCount(): Promise<void> {
  const dueItems = await getDueItemsForNotification();
  await setBadgeCount(dueItems.length);
}

// ============================================================================
// Scheduler Class
// ============================================================================

let schedulerInstance: NotificationScheduler | null = null;

export class NotificationScheduler {
  private checkIntervalId: ReturnType<typeof setInterval> | null = null;
  private options: NotificationSchedulerOptions;
  private isRunning = false;

  constructor(options: NotificationSchedulerOptions = {}) {
    this.options = {
      checkIntervalMinutes: 15, // Default check every 15 minutes
      ...options,
    };
  }

  /**
   * Start the notification scheduler
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // Check immediately on start
    this.check();

    // Set up periodic checking
    const intervalMs = (this.options.checkIntervalMinutes || 15) * 60 * 1000;
    this.checkIntervalId = setInterval(() => {
      this.check();
    }, intervalMs);

    // Also check when the page becomes visible (user returns to app)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    console.log(`Notification scheduler started (checking every ${this.options.checkIntervalMinutes} minutes)`);
  }

  /**
   * Stop the notification scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    console.log('Notification scheduler stopped');
  }

  /**
   * Perform a check for due items
   */
  async check(): Promise<number> {
    try {
      return await checkAndNotify(this.options.onNotificationClick);
    } catch (error) {
      console.error('Error checking notifications:', error);
      return 0;
    }
  }

  /**
   * Handle page visibility change
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // User returned to the app, check for due items
      this.check();
    }
  };

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * Get or create the singleton scheduler instance
 */
export function getNotificationScheduler(
  options?: NotificationSchedulerOptions
): NotificationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new NotificationScheduler(options);
  }
  return schedulerInstance;
}

/**
 * Start the notification scheduler (convenience function)
 */
export function startNotificationScheduler(
  options?: NotificationSchedulerOptions
): NotificationScheduler {
  const scheduler = getNotificationScheduler(options);
  scheduler.start();
  return scheduler;
}

/**
 * Stop the notification scheduler (convenience function)
 */
export function stopNotificationScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
}

// ============================================================================
// Scheduled Notification Support (for specific times)
// ============================================================================

/**
 * Calculate when the next notification should be shown for an action
 * Based on the configured notification time
 */
export function getNextNotificationTime(
  action: MaintenanceAction,
  notificationConfig?: NotificationConfig
): Date | null {
  if (!action.next_due) return null;

  const notificationTime = notificationConfig?.time || action.notification_time;
  if (!notificationTime) {
    // If no specific time configured, notify when due
    return action.next_due;
  }

  // Parse the notification time (HH:MM format)
  const [hours, minutes] = notificationTime.split(':').map(Number);
  const nextNotification = new Date(action.next_due);
  nextNotification.setHours(hours, minutes, 0, 0);

  return nextNotification;
}

/**
 * Check if it's time to show a notification based on configured time
 */
export function isNotificationTimeReached(
  action: MaintenanceAction,
  notificationConfig?: NotificationConfig
): boolean {
  const notificationTime = getNextNotificationTime(action, notificationConfig);
  if (!notificationTime) return false;

  const now = new Date();
  return now >= notificationTime;
}

// ============================================================================
// Export all functions
// ============================================================================

export const notificationScheduler = {
  getDueItems: getDueItemsForNotification,
  checkAndNotify,
  updateBadge: updateBadgeCount,
  getScheduler: getNotificationScheduler,
  start: startNotificationScheduler,
  stop: stopNotificationScheduler,
  getNextTime: getNextNotificationTime,
  isTimeReached: isNotificationTimeReached,
};
