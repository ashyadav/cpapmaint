import { create } from 'zustand';
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
 */
export const useCurrentStreak = () => {
  // This is a simplified version - full implementation would be more complex
  // For now, return 0 as placeholder
  return 0;
};

/**
 * Calculate compliance percentage for last N days
 */
export const useCompliancePercentage = () => {
  // This is a simplified version - full implementation would be more complex
  // For now, return 100 as placeholder
  return 100;
};
