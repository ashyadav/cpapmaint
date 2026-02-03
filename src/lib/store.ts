import { create } from 'zustand';
import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import type { Component, MaintenanceAction, MaintenanceLog, NotificationConfig } from './db';
import { dbOperations } from './db-operations';

// ============================================================================
// App State Interface
// ============================================================================

interface AppState {
  // Data
  components: Component[];
  maintenanceActions: MaintenanceAction[];
  maintenanceLogs: MaintenanceLog[];
  notificationConfigs: NotificationConfig[];

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  loadData: () => Promise<void>;
  refreshComponents: () => Promise<void>;
  refreshMaintenanceActions: () => Promise<void>;
  refreshMaintenanceLogs: () => Promise<void>;
  refreshNotificationConfigs: () => Promise<void>;
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  components: [],
  maintenanceActions: [],
  maintenanceLogs: [],
  notificationConfigs: [],
  isLoading: false,
  isInitialized: false,

  // Load all data from database
  loadData: async () => {
    set({ isLoading: true });
    try {
      const [components, actions, logs, configs] = await Promise.all([
        dbOperations.components.getAll(),
        dbOperations.maintenanceActions.getAll(),
        dbOperations.maintenanceLogs.getAll(),
        dbOperations.notificationConfigs.getAll(),
      ]);

      set({
        components,
        maintenanceActions: actions,
        maintenanceLogs: logs,
        notificationConfigs: configs,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      set({ isLoading: false });
    }
  },

  // Refresh components from database
  refreshComponents: async () => {
    const components = await dbOperations.components.getAll();
    set({ components });
  },

  // Refresh maintenance actions from database
  refreshMaintenanceActions: async () => {
    const maintenanceActions = await dbOperations.maintenanceActions.getAll();
    set({ maintenanceActions });
  },

  // Refresh maintenance logs from database
  refreshMaintenanceLogs: async () => {
    const maintenanceLogs = await dbOperations.maintenanceLogs.getAll();
    set({ maintenanceLogs });
  },

  // Refresh notification configs from database
  refreshNotificationConfigs: async () => {
    const notificationConfigs = await dbOperations.notificationConfigs.getAll();
    set({ notificationConfigs });
  },
}));

// ============================================================================
// Computed Selectors (Derived State)
// ============================================================================

/**
 * Get active components
 */
export const useActiveComponents = () => {
  const components = useAppStore((state) => state.components);
  return components.filter((c) => c.is_active);
};

/**
 * Get due maintenance actions
 */
export const useDueActions = () => {
  const actions = useAppStore((state) => state.maintenanceActions);
  const now = new Date();
  return actions.filter((action) => action.next_due && action.next_due <= now);
};

/**
 * Get overdue maintenance actions
 */
export const useOverdueActions = () => {
  const actions = useAppStore((state) => state.maintenanceActions);
  const now = new Date();
  return actions.filter((action) => {
    if (!action.next_due) return false;
    const daysDiff = Math.floor(
      (now.getTime() - action.next_due.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff > 0;
  });
};

/**
 * Get due today maintenance actions
 */
export const useDueTodayActions = () => {
  const actions = useAppStore((state) => state.maintenanceActions);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  return actions.filter((action) => {
    if (!action.next_due) return false;
    return action.next_due >= startOfDay && action.next_due <= endOfDay;
  });
};

/**
 * Get upcoming maintenance actions (next N days)
 */
export const useUpcomingActions = (days: number = 7) => {
  const actions = useAppStore((state) => state.maintenanceActions);
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);

  return actions
    .filter((action) => {
      if (!action.next_due) return false;
      return action.next_due > now && action.next_due <= futureDate;
    })
    .sort((a, b) => {
      if (!a.next_due || !b.next_due) return 0;
      return a.next_due.getTime() - b.next_due.getTime();
    });
};

/**
 * Get maintenance actions for a specific component
 */
export const useComponentActions = (componentId: string) => {
  const actions = useAppStore((state) => state.maintenanceActions);
  return actions.filter((action) => action.component_id === componentId);
};

/**
 * Get maintenance logs for a specific component
 */
export const useComponentLogs = (componentId: string) => {
  const logs = useAppStore((state) => state.maintenanceLogs);
  return logs
    .filter((log) => log.component_id === componentId)
    .sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());
};

/**
 * Get maintenance logs for a specific action
 */
export const useActionLogs = (actionId: string) => {
  const logs = useAppStore((state) => state.maintenanceLogs);
  return logs
    .filter((log) => log.action_id === actionId)
    .sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());
};

/**
 * Get notification config for an action
 */
export const useActionNotificationConfig = (actionId: string) => {
  const configs = useAppStore((state) => state.notificationConfigs);
  return configs.find((config) => config.action_id === actionId);
};

/**
 * Calculate current streak (consecutive days of compliance)
 * Returns number of days with 100% completion
 *
 * Optimized with:
 * - shallow comparison to prevent unnecessary re-subscriptions
 * - useMemo to cache expensive calculation
 */
export const useCurrentStreak = () => {
  // Use shallow comparison to prevent re-renders when data hasn't changed
  const { logs, actions } = useAppStore(
    (state) => ({
      logs: state.maintenanceLogs,
      actions: state.maintenanceActions,
    }),
    shallow
  );

  // Memoize the expensive streak calculation
  return useMemo(() => {
    // Build scheduled actions per day map for the last 365 days
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const scheduledActionsPerDay = new Map<string, Set<string>>();

    for (const action of actions) {
      if (action.schedule_unit !== 'days' || action.schedule_frequency <= 0) continue;

      const frequency = action.schedule_frequency;
      const dayMs = 24 * 60 * 60 * 1000;

      // Find occurrences in range
      let checkDate = action.next_due || new Date();
      while (checkDate.getTime() > oneYearAgo.getTime()) {
        checkDate = new Date(checkDate.getTime() - frequency * dayMs);
      }
      while (checkDate.getTime() <= now.getTime()) {
        if (checkDate.getTime() >= oneYearAgo.getTime()) {
          const dayKey = checkDate.toISOString().split('T')[0];
          if (!scheduledActionsPerDay.has(dayKey)) {
            scheduledActionsPerDay.set(dayKey, new Set());
          }
          if (action.id) {
            scheduledActionsPerDay.get(dayKey)!.add(action.id);
          }
        }
        checkDate = new Date(checkDate.getTime() + frequency * dayMs);
      }
    }

    // Calculate streak using the new logic
    const logsForStreak = logs.map(log => ({
      completed_at: log.completed_at,
      action_id: log.action_id,
    }));

    // Inline streak calculation to avoid circular dependency
    if (logsForStreak.length === 0) return 0;

    // Group completed actions by day
    const completedByDay = new Map<string, Set<string>>();
    for (const log of logsForStreak) {
      const dayKey = log.completed_at.toISOString().split('T')[0];
      if (!completedByDay.has(dayKey)) {
        completedByDay.set(dayKey, new Set());
      }
      completedByDay.get(dayKey)!.add(log.action_id);
    }

    let streak = 0;
    let currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const dayKey = currentDate.toISOString().split('T')[0];
      const requiredActions = scheduledActionsPerDay.get(dayKey);

      if (!requiredActions || requiredActions.size === 0) {
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
        continue;
      }

      const completedActions = completedByDay.get(dayKey);
      if (!completedActions) {
        break;
      }

      let allCompleted = true;
      for (const actionId of requiredActions) {
        if (!completedActions.has(actionId)) {
          allCompleted = false;
          break;
        }
      }

      if (!allCompleted) {
        break;
      }

      streak++;
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    }

    return streak;
  }, [logs, actions]);
};

/**
 * Calculate compliance percentage for last N days
 *
 * Optimized with:
 * - shallow comparison to prevent unnecessary re-subscriptions
 * - useMemo to cache calculation
 */
export const useCompliancePercentage = (days: number = 30) => {
  // Use shallow comparison to prevent re-renders when data hasn't changed
  const { logs, actions } = useAppStore(
    (state) => ({
      logs: state.maintenanceLogs,
      actions: state.maintenanceActions,
    }),
    shallow
  );

  // Memoize the compliance calculation
  return useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Filter logs to the date range
    const logsInRange = logs.filter(
      (log) => log.completed_at >= startDate && log.completed_at <= now
    );

    // Calculate required tasks in range
    let totalRequired = 0;

    for (const action of actions) {
      if (action.schedule_unit !== 'days' || action.schedule_frequency <= 0) continue;
      const frequency = action.schedule_frequency;
      const occurrences = Math.floor(days / frequency);
      totalRequired += Math.max(1, occurrences);
    }

    const totalCompleted = logsInRange.length;

    if (totalRequired === 0) return 100;
    return Math.min(100, Math.round((totalCompleted / totalRequired) * 100));
  }, [logs, actions, days]);
};
