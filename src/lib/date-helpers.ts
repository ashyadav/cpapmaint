import {
  addDays,
  addHours,
  differenceInDays,
  differenceInHours,
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  isToday,
  isFuture,
  startOfDay,
  endOfDay,
  parseISO,
  isValid,
} from 'date-fns';

// ============================================================================
// Date Calculation Helpers
// ============================================================================

/**
 * Calculate next due date based on original due date and frequency
 * This prevents schedule drift by always calculating from the original due date
 *
 * Example: Weekly clean due Monday, completed Wednesday → next due following Monday
 */
export function calculateNextDueDate(
  originalDueDate: Date,
  frequency: number,
  unit: 'days' | 'uses'
): Date {
  if (unit === 'uses') {
    // For usage-based tracking, we can't calculate automatically
    // Return original due date for now - will be updated when usage is logged
    return originalDueDate;
  }

  // For calendar-based tracking
  const now = new Date();
  let nextDue = new Date(originalDueDate);

  // Keep adding frequency until we're in the future
  while (isBefore(nextDue, now) || isToday(nextDue)) {
    nextDue = addDays(nextDue, frequency);
  }

  return nextDue;
}

/**
 * Calculate initial due date for a new maintenance action
 * Sets the first occurrence based on current time and notification time
 */
export function calculateInitialDueDate(
  frequency: number,
  unit: 'days' | 'uses',
  notificationTime?: string
): Date {
  const now = new Date();

  if (unit === 'uses') {
    // For usage-based, set initial due after N uses from now
    // This will be adjusted when actual usage is tracked
    return addDays(now, frequency);
  }

  // For calendar-based
  let dueDate = addDays(now, frequency);

  // If notification time is specified, set the time component
  if (notificationTime) {
    const [hours, minutes] = notificationTime.split(':').map(Number);
    dueDate.setHours(hours, minutes, 0, 0);
  }

  return dueDate;
}

/**
 * Check if a date is overdue (past due date, not including today)
 */
export function isOverdue(dueDate: Date): boolean {
  if (!dueDate) return false;
  const now = new Date();
  const daysDiff = differenceInDays(now, dueDate);
  return daysDiff > 0;
}

/**
 * Check if a date is due today
 */
export function isDueToday(dueDate: Date): boolean {
  if (!dueDate) return false;
  return isToday(dueDate);
}

/**
 * Check if a date is coming up (within N days)
 */
export function isUpcoming(dueDate: Date, withinDays: number = 7): boolean {
  if (!dueDate) return false;
  const now = new Date();
  const futureDate = addDays(now, withinDays);
  return isAfter(dueDate, now) && isBefore(dueDate, futureDate);
}

/**
 * Get the number of days overdue (0 if not overdue)
 */
export function getDaysOverdue(dueDate: Date): number {
  if (!isOverdue(dueDate)) return 0;
  return differenceInDays(new Date(), dueDate);
}

/**
 * Get the number of days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate: Date): number {
  return differenceInDays(dueDate, new Date());
}

/**
 * Format a date as a relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format a date as a readable string
 */
export function formatDate(date: Date, formatString: string = 'PPP'): string {
  return format(date, formatString);
}

/**
 * Format a date as a short date string (e.g., "Jan 5, 2026")
 */
export function formatShortDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

/**
 * Format a date as a long date string (e.g., "January 5, 2026")
 */
export function formatLongDate(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

/**
 * Format a date as a date and time string (e.g., "Jan 5, 2026 at 2:30 PM")
 */
export function formatDateTime(date: Date): string {
  return format(date, 'MMM d, yyyy \'at\' h:mm a');
}

/**
 * Format time only (e.g., "2:30 PM")
 */
export function formatTime(date: Date): string {
  return format(date, 'h:mm a');
}

/**
 * Get status text for a due date
 */
export function getDueStatusText(dueDate: Date): string {
  if (!dueDate) return 'No due date';

  if (isOverdue(dueDate)) {
    const days = getDaysOverdue(dueDate);
    if (days === 1) return '1 day overdue';
    return `${days} days overdue`;
  }

  if (isDueToday(dueDate)) {
    return 'Due today';
  }

  const days = getDaysUntilDue(dueDate);
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;

  return `Due ${formatShortDate(dueDate)}`;
}

/**
 * Get status type for a due date (for styling/badges)
 */
export function getDueStatus(dueDate: Date): 'overdue' | 'due' | 'ok' {
  if (!dueDate) return 'ok';
  if (isOverdue(dueDate)) return 'overdue';
  if (isDueToday(dueDate)) return 'due';
  return 'ok';
}

/**
 * Parse a time string (HH:MM) and return hours and minutes
 */
export function parseTime(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Set time on a date object
 */
export function setTime(date: Date, timeString: string): Date {
  const { hours, minutes } = parseTime(timeString);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * Get start of day for a date
 */
export function getStartOfDay(date: Date = new Date()): Date {
  return startOfDay(date);
}

/**
 * Get end of day for a date
 */
export function getEndOfDay(date: Date = new Date()): Date {
  return endOfDay(date);
}

/**
 * Check if a notification should be sent based on time
 * Returns true if current time matches or is past the notification time
 */
export function shouldSendNotification(
  dueDate: Date,
  notificationTime: string,
  lastNotificationSent?: Date
): boolean {
  const now = new Date();

  // Don't send if not due yet
  if (isFuture(dueDate)) return false;

  // Parse notification time
  const { hours, minutes } = parseTime(notificationTime);
  const notificationDateTime = new Date(dueDate);
  notificationDateTime.setHours(hours, minutes, 0, 0);

  // Check if we've already sent a notification recently (within last hour)
  if (lastNotificationSent) {
    const hoursSinceLastNotification = differenceInHours(now, lastNotificationSent);
    if (hoursSinceLastNotification < 1) return false;
  }

  // Send if current time is past notification time
  return isAfter(now, notificationDateTime) || isToday(notificationDateTime);
}

/**
 * Calculate escalation notification times
 */
export function getEscalationNotificationTimes(
  dueDate: Date,
  notificationTime: string,
  escalationIntervals: number[]
): Date[] {
  const { hours, minutes } = parseTime(notificationTime);
  const baseNotificationTime = new Date(dueDate);
  baseNotificationTime.setHours(hours, minutes, 0, 0);

  return escalationIntervals.map((intervalHours) => {
    return addHours(baseNotificationTime, intervalHours);
  });
}

/**
 * Calculate streak from maintenance logs and scheduled actions
 * A streak is maintained if ALL scheduled tasks for each day were completed
 *
 * @param logs - Array of maintenance logs with completion dates
 * @param scheduledActionsPerDay - Map of date string (YYYY-MM-DD) to required action count
 * @returns Number of consecutive days with 100% completion
 */
export function calculateStreak(
  logs: Array<{ completed_at: Date; action_id: string }>,
  scheduledActionsPerDay: Map<string, Set<string>>
): number {
  if (logs.length === 0) return 0;

  // Group completed actions by day
  const completedByDay = new Map<string, Set<string>>();
  for (const log of logs) {
    const dayKey = format(startOfDay(log.completed_at), 'yyyy-MM-dd');
    if (!completedByDay.has(dayKey)) {
      completedByDay.set(dayKey, new Set());
    }
    completedByDay.get(dayKey)!.add(log.action_id);
  }

  let streak = 0;
  let currentDate = startOfDay(new Date());

  // Count backwards from today (or yesterday if nothing scheduled today yet)
  for (let i = 0; i < 365; i++) {
    const dayKey = format(currentDate, 'yyyy-MM-dd');
    const requiredActions = scheduledActionsPerDay.get(dayKey);

    // If no actions were scheduled for this day, skip it (don't break streak)
    if (!requiredActions || requiredActions.size === 0) {
      currentDate = addDays(currentDate, -1);
      continue;
    }

    // Check if ALL required actions for this day were completed
    const completedActions = completedByDay.get(dayKey);
    if (!completedActions) {
      // No completions on a day with required actions - streak broken
      break;
    }

    // Check if every required action was completed
    let allCompleted = true;
    for (const actionId of requiredActions) {
      if (!completedActions.has(actionId)) {
        allCompleted = false;
        break;
      }
    }

    if (!allCompleted) {
      // Not all required actions completed - streak broken
      break;
    }

    streak++;
    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

/**
 * Legacy calculateStreak for backward compatibility
 * @deprecated Use the new calculateStreak with scheduled actions
 */
export function calculateStreakLegacy(
  completedDates: Date[]
): number {
  if (completedDates.length === 0) return 0;

  // Sort dates descending (most recent first)
  const sortedDates = [...completedDates].sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  let currentDate = startOfDay(new Date());

  // Count backwards from today
  for (let i = 0; i < sortedDates.length; i++) {
    const completedDate = startOfDay(sortedDates[i]);
    const daysDiff = differenceInDays(currentDate, completedDate);

    if (daysDiff === 0) {
      // Completed today
      streak++;
      currentDate = addDays(currentDate, -1);
    } else if (daysDiff === 1) {
      // Completed yesterday
      streak++;
      currentDate = completedDate;
      currentDate = addDays(currentDate, -1);
    } else {
      // Gap in streak
      break;
    }
  }

  return streak;
}

/**
 * Calculate compliance percentage for a date range
 */
export function calculateCompliancePercentage(
  completedCount: number,
  requiredCount: number
): number {
  if (requiredCount === 0) return 100;
  return Math.round((completedCount / requiredCount) * 100);
}

/**
 * Get date range for last N days
 */
export function getLastNDaysRange(days: number): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  const start = startOfDay(addDays(end, -days));
  return { start, end };
}

/**
 * Check if date is valid
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && isValid(date);
}

/**
 * Safe date parse that handles both Date objects and ISO strings
 */
export function safeParseDate(date: Date | string): Date | null {
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }
  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  }
  return null;
}
