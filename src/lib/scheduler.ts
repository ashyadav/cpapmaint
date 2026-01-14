import type { MaintenanceAction } from './db';
import { dbOperations } from './db-operations';
import {
  calculateNextDueDate,
  calculateInitialDueDate,
  isOverdue,
  setTime,
} from './date-helpers';

// ============================================================================
// Scheduling Logic
// ============================================================================

/**
 * Complete a maintenance action and schedule the next occurrence
 *
 * This function:
 * 1. Logs the completion in MaintenanceLog
 * 2. Calculates the next due date from the ORIGINAL due date (prevents drift)
 * 3. Updates the action with new last_completed and next_due
 *
 * @param actionId - The ID of the maintenance action to complete
 * @param completedAt - When the action was completed (defaults to now)
 * @param notes - Optional notes about the completion
 * @returns The log ID and updated action
 */
export async function completeMaintenanceAction(
  actionId: string,
  completedAt: Date = new Date(),
  notes?: string
): Promise<{ logId: string; nextDueDate: Date }> {
  const action = await dbOperations.maintenanceActions.getById(actionId);
  if (!action) {
    throw new Error(`Maintenance action ${actionId} not found`);
  }

  // Determine if this completion was overdue
  const wasOverdue = action.next_due ? isOverdue(action.next_due) : false;

  // Create log entry
  const logId = await dbOperations.maintenanceLogs.create({
    component_id: action.component_id,
    action_id: actionId,
    completed_at: completedAt,
    was_overdue: wasOverdue,
    notes,
    logged_by: 'user',
  });

  // Calculate next due date from original due date (prevents drift)
  const originalDueDate = action.next_due || completedAt;
  const nextDueDate = calculateNextDueDate(
    originalDueDate,
    action.schedule_frequency,
    action.schedule_unit
  );

  // If notification time is set, apply it to the next due date
  if (action.notification_time) {
    const nextDueDateWithTime = setTime(nextDueDate, action.notification_time);

    // Update the action
    await dbOperations.maintenanceActions.update(actionId, {
      last_completed: completedAt,
      next_due: nextDueDateWithTime,
    });

    return { logId, nextDueDate: nextDueDateWithTime };
  }

  // Update the action
  await dbOperations.maintenanceActions.update(actionId, {
    last_completed: completedAt,
    next_due: nextDueDate,
  });

  return { logId, nextDueDate };
}

/**
 * Skip a maintenance action (dismiss without logging completion)
 * Reschedules to the next occurrence from the original due date
 * This prevents "debt accumulation" - we don't guilt-trip about missed tasks
 *
 * @param actionId - The ID of the maintenance action to skip
 * @returns The next due date after skipping
 */
export async function skipMaintenanceAction(actionId: string): Promise<Date> {
  const action = await dbOperations.maintenanceActions.getById(actionId);
  if (!action) {
    throw new Error(`Maintenance action ${actionId} not found`);
  }

  // Calculate next due date from original due date (prevents drift)
  const originalDueDate = action.next_due || new Date();
  const nextDueDate = calculateNextDueDate(
    originalDueDate,
    action.schedule_frequency,
    action.schedule_unit
  );

  // Apply notification time if set
  let finalNextDue = nextDueDate;
  if (action.notification_time) {
    finalNextDue = setTime(nextDueDate, action.notification_time);
  }

  // Update the action - no log entry, just reschedule
  await dbOperations.maintenanceActions.update(actionId, {
    next_due: finalNextDue,
  });

  return finalNextDue;
}

/**
 * Snooze a maintenance action (delay reminder for X hours)
 *
 * @param actionId - The ID of the maintenance action to snooze
 * @param hours - Number of hours to snooze (default 4)
 */
export async function snoozeMaintenanceAction(
  actionId: string,
  hours: number = 4
): Promise<Date> {
  const action = await dbOperations.maintenanceActions.getById(actionId);
  if (!action) {
    throw new Error(`Maintenance action ${actionId} not found`);
  }

  // Calculate snooze until time
  const snoozeUntil = new Date();
  snoozeUntil.setHours(snoozeUntil.getHours() + hours);

  // Note: This updates next_due temporarily
  // Future: Could add a separate "snoozed_until" field to preserve original next_due
  await dbOperations.maintenanceActions.update(actionId, {
    next_due: snoozeUntil,
  });

  return snoozeUntil;
}

/**
 * Initialize a new maintenance action with its first due date
 *
 * @param action - The maintenance action to initialize
 * @returns The initialized action with next_due set
 */
export async function initializeMaintenanceAction(
  actionId: string
): Promise<MaintenanceAction> {
  const action = await dbOperations.maintenanceActions.getById(actionId);
  if (!action) {
    throw new Error(`Maintenance action ${actionId} not found`);
  }

  // If already has a next_due date, don't reinitialize
  if (action.next_due) {
    return action;
  }

  // Calculate initial due date
  const initialDueDate = calculateInitialDueDate(
    action.schedule_frequency,
    action.schedule_unit,
    action.notification_time
  );

  // Update the action
  await dbOperations.maintenanceActions.update(actionId, {
    next_due: initialDueDate,
  });

  return {
    ...action,
    next_due: initialDueDate,
  };
}

/**
 * Reschedule a maintenance action to a new due date
 * Useful for manual adjustments or corrections
 *
 * @param actionId - The ID of the maintenance action
 * @param newDueDate - The new due date
 */
export async function rescheduleMaintenanceAction(
  actionId: string,
  newDueDate: Date
): Promise<void> {
  await dbOperations.maintenanceActions.update(actionId, {
    next_due: newDueDate,
  });
}

/**
 * Update usage count for a component and recalculate usage-based actions
 *
 * @param componentId - The ID of the component
 * @param usageIncrement - How many uses to add (default 1)
 */
export async function updateComponentUsage(
  componentId: string,
  usageIncrement: number = 1
): Promise<void> {
  // Update component usage count
  await dbOperations.components.incrementUsage(componentId, usageIncrement);

  // Get component to check new usage count
  const component = await dbOperations.components.getById(componentId);
  if (!component) {
    throw new Error(`Component ${componentId} not found`);
  }

  // Get all usage-based actions for this component
  const actions = await dbOperations.maintenanceActions.getByComponent(componentId);
  const usageBasedActions = actions.filter((a) => a.schedule_unit === 'uses');

  // Check if any usage-based actions should be marked as due
  for (const action of usageBasedActions) {
    // If we've reached or exceeded the required usage
    if (component.usage_count >= action.schedule_frequency) {
      // Mark as due now (if not already due)
      if (!action.next_due || action.next_due > new Date()) {
        await dbOperations.maintenanceActions.update(action.id!, {
          next_due: new Date(),
        });
      }
    }
  }
}

/**
 * Get all actions that need attention (due or overdue)
 *
 * @returns Array of actions needing attention, sorted by priority
 */
export async function getActionsNeedingAttention(): Promise<MaintenanceAction[]> {
  const allActions = await dbOperations.maintenanceActions.getAll();
  const now = new Date();

  // Filter for due or overdue actions
  const actionsNeedingAttention = allActions.filter((action) => {
    if (!action.next_due) return false;
    return action.next_due <= now;
  });

  // Sort by priority: overdue first, then by how overdue/due they are
  return actionsNeedingAttention.sort((a, b) => {
    if (!a.next_due || !b.next_due) return 0;

    const aIsOverdue = isOverdue(a.next_due);
    const bIsOverdue = isOverdue(b.next_due);

    // Overdue actions come first
    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    // Among same status, sort by date (earlier first)
    return a.next_due.getTime() - b.next_due.getTime();
  });
}

/**
 * Get summary statistics for the home screen
 */
export async function getMaintenanceSummary(): Promise<{
  overdueCount: number;
  dueTodayCount: number;
  upcomingCount: number;
  allCaughtUp: boolean;
  nextUpcoming?: { action: MaintenanceAction; daysUntil: number };
}> {
  const allActions = await dbOperations.maintenanceActions.getAll();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  let overdueCount = 0;
  let dueTodayCount = 0;
  let upcomingCount = 0;
  let nextUpcomingAction: MaintenanceAction | undefined;
  let nextUpcomingDays = Infinity;

  for (const action of allActions) {
    if (!action.next_due) continue;

    if (isOverdue(action.next_due)) {
      overdueCount++;
    } else if (action.next_due >= startOfToday && action.next_due <= endOfToday) {
      dueTodayCount++;
    } else if (action.next_due > now) {
      upcomingCount++;

      // Track closest upcoming action
      const daysUntil = Math.ceil(
        (action.next_due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil < nextUpcomingDays) {
        nextUpcomingDays = daysUntil;
        nextUpcomingAction = action;
      }
    }
  }

  const allCaughtUp = overdueCount === 0 && dueTodayCount === 0;

  return {
    overdueCount,
    dueTodayCount,
    upcomingCount,
    allCaughtUp,
    nextUpcoming: nextUpcomingAction
      ? { action: nextUpcomingAction, daysUntil: nextUpcomingDays }
      : undefined,
  };
}

/**
 * Calculate statistics for a date range
 */
export async function calculateStatistics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalCompleted: number;
  totalRequired: number;
  compliancePercentage: number;
  overdueCompletions: number;
  onTimeCompletions: number;
}> {
  const logs = await dbOperations.maintenanceLogs.getByDateRange(startDate, endDate);

  const totalCompleted = logs.length;
  const overdueCompletions = logs.filter((log) => log.was_overdue).length;
  const onTimeCompletions = totalCompleted - overdueCompletions;

  // Calculate total required (simplified - would need more complex logic in real app)
  // For now, assume same number as completed
  const totalRequired = totalCompleted;
  const compliancePercentage =
    totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 100;

  return {
    totalCompleted,
    totalRequired,
    compliancePercentage,
    overdueCompletions,
    onTimeCompletions,
  };
}

/**
 * Batch initialize all maintenance actions that don't have a next_due date
 */
export async function initializeAllMaintenanceActions(): Promise<number> {
  const allActions = await dbOperations.maintenanceActions.getAll();
  const uninitializedActions = allActions.filter((action) => !action.next_due);

  let initializedCount = 0;
  for (const action of uninitializedActions) {
    if (action.id) {
      await initializeMaintenanceAction(action.id);
      initializedCount++;
    }
  }

  return initializedCount;
}

/**
 * Export all scheduling functions
 */
export const scheduler = {
  completeMaintenanceAction,
  skipMaintenanceAction,
  snoozeMaintenanceAction,
  initializeMaintenanceAction,
  rescheduleMaintenanceAction,
  updateComponentUsage,
  getActionsNeedingAttention,
  getMaintenanceSummary,
  calculateStatistics,
  initializeAllMaintenanceActions,
};
