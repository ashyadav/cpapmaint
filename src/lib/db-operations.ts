import { db } from './db';
import type { Component, MaintenanceAction, MaintenanceLog, NotificationConfig } from './db';

// Generate UUID using crypto API (available in modern browsers)
const generateId = (): string => {
  return crypto.randomUUID();
};

// ============================================================================
// Component CRUD Operations
// ============================================================================

export const componentOperations = {
  /**
   * Create a new component
   */
  async create(component: Omit<Component, 'id' | 'created_at'>): Promise<string> {
    const id = generateId();
    await db.components.add({
      ...component,
      id,
      created_at: new Date(),
    });
    return id;
  },

  /**
   * Get a component by ID
   */
  async getById(id: string): Promise<Component | undefined> {
    return await db.components.get(id);
  },

  /**
   * Get all components
   */
  async getAll(): Promise<Component[]> {
    return await db.components.toArray();
  },

  /**
   * Get all active components
   */
  async getActive(): Promise<Component[]> {
    return await db.components.where('is_active').equals(1).toArray();
  },

  /**
   * Get components by category
   */
  async getByCategory(category: Component['category']): Promise<Component[]> {
    return await db.components.where('category').equals(category).toArray();
  },

  /**
   * Update a component
   */
  async update(id: string, updates: Partial<Omit<Component, 'id' | 'created_at'>>): Promise<void> {
    await db.components.update(id, updates);
  },

  /**
   * Delete a component (and cascade delete related data)
   */
  async delete(id: string): Promise<void> {
    // Delete all maintenance actions for this component
    const actions = await maintenanceActionOperations.getByComponent(id);
    for (const action of actions) {
      await maintenanceActionOperations.delete(action.id!);
    }

    // Delete all maintenance logs for this component
    await db.maintenanceLogs.where('component_id').equals(id).delete();

    // Delete the component
    await db.components.delete(id);
  },

  /**
   * Increment usage count for a component
   */
  async incrementUsage(id: string, increment: number = 1): Promise<void> {
    const component = await db.components.get(id);
    if (component) {
      await db.components.update(id, {
        usage_count: component.usage_count + increment,
      });
    }
  },

  /**
   * Toggle component active status
   */
  async toggleActive(id: string): Promise<void> {
    const component = await db.components.get(id);
    if (component) {
      await db.components.update(id, {
        is_active: !component.is_active,
      });
    }
  },
};

// ============================================================================
// Maintenance Action CRUD Operations
// ============================================================================

export const maintenanceActionOperations = {
  /**
   * Create a new maintenance action
   */
  async create(action: Omit<MaintenanceAction, 'id'>): Promise<string> {
    const id = generateId();
    await db.maintenanceActions.add({
      ...action,
      id,
    });
    return id;
  },

  /**
   * Get a maintenance action by ID
   */
  async getById(id: string): Promise<MaintenanceAction | undefined> {
    return await db.maintenanceActions.get(id);
  },

  /**
   * Get all maintenance actions
   */
  async getAll(): Promise<MaintenanceAction[]> {
    return await db.maintenanceActions.toArray();
  },

  /**
   * Get all maintenance actions for a component
   */
  async getByComponent(componentId: string): Promise<MaintenanceAction[]> {
    return await db.maintenanceActions.where('component_id').equals(componentId).toArray();
  },

  /**
   * Get all due maintenance actions
   */
  async getDue(): Promise<MaintenanceAction[]> {
    const now = new Date();
    const actions = await db.maintenanceActions.toArray();
    return actions.filter(action => action.next_due && action.next_due <= now);
  },

  /**
   * Get all overdue maintenance actions
   */
  async getOverdue(): Promise<MaintenanceAction[]> {
    const now = new Date();
    const actions = await db.maintenanceActions.toArray();
    return actions.filter(action => {
      if (!action.next_due) return false;
      const daysDiff = Math.floor((now.getTime() - action.next_due.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 0;
    });
  },

  /**
   * Get all due today maintenance actions
   */
  async getDueToday(): Promise<MaintenanceAction[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const actions = await db.maintenanceActions.toArray();
    return actions.filter(action => {
      if (!action.next_due) return false;
      return action.next_due >= startOfDay && action.next_due <= endOfDay;
    });
  },

  /**
   * Get upcoming maintenance actions (next N days)
   */
  async getUpcoming(days: number = 7): Promise<MaintenanceAction[]> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    const actions = await db.maintenanceActions.toArray();
    return actions.filter(action => {
      if (!action.next_due) return false;
      return action.next_due > now && action.next_due <= futureDate;
    }).sort((a, b) => {
      if (!a.next_due || !b.next_due) return 0;
      return a.next_due.getTime() - b.next_due.getTime();
    });
  },

  /**
   * Update a maintenance action
   */
  async update(id: string, updates: Partial<Omit<MaintenanceAction, 'id'>>): Promise<void> {
    await db.maintenanceActions.update(id, updates);
  },

  /**
   * Delete a maintenance action (and cascade delete related data)
   */
  async delete(id: string): Promise<void> {
    // Delete notification config for this action
    await db.notificationConfigs.where('action_id').equals(id).delete();

    // Delete maintenance logs for this action
    await db.maintenanceLogs.where('action_id').equals(id).delete();

    // Delete the action
    await db.maintenanceActions.delete(id);
  },

  /**
   * Mark action as completed (updates last_completed and next_due)
   */
  async complete(id: string, completedAt: Date, nextDue: Date): Promise<void> {
    await db.maintenanceActions.update(id, {
      last_completed: completedAt,
      next_due: nextDue,
    });
  },
};

// ============================================================================
// Maintenance Log CRUD Operations
// ============================================================================

export const maintenanceLogOperations = {
  /**
   * Create a new maintenance log entry
   */
  async create(log: Omit<MaintenanceLog, 'id'>): Promise<string> {
    const id = generateId();
    await db.maintenanceLogs.add({
      ...log,
      id,
    });
    return id;
  },

  /**
   * Get a maintenance log by ID
   */
  async getById(id: string): Promise<MaintenanceLog | undefined> {
    return await db.maintenanceLogs.get(id);
  },

  /**
   * Get all maintenance logs
   */
  async getAll(): Promise<MaintenanceLog[]> {
    const logs = await db.maintenanceLogs.toArray();
    return logs.sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());
  },

  /**
   * Get logs for a specific component
   */
  async getByComponent(componentId: string): Promise<MaintenanceLog[]> {
    const logs = await db.maintenanceLogs.where('component_id').equals(componentId).toArray();
    return logs.sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());
  },

  /**
   * Get logs for a specific action
   */
  async getByAction(actionId: string): Promise<MaintenanceLog[]> {
    const logs = await db.maintenanceLogs.where('action_id').equals(actionId).toArray();
    return logs.sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());
  },

  /**
   * Get logs within a date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<MaintenanceLog[]> {
    const logs = await db.maintenanceLogs
      .where('completed_at')
      .between(startDate, endDate, true, true)
      .toArray();
    return logs.sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());
  },

  /**
   * Get overdue logs only
   */
  async getOverdue(): Promise<MaintenanceLog[]> {
    const logs = await db.maintenanceLogs.where('was_overdue').equals(1).toArray();
    return logs.sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());
  },

  /**
   * Update a maintenance log
   */
  async update(id: string, updates: Partial<Omit<MaintenanceLog, 'id'>>): Promise<void> {
    await db.maintenanceLogs.update(id, updates);
  },

  /**
   * Delete a maintenance log
   */
  async delete(id: string): Promise<void> {
    await db.maintenanceLogs.delete(id);
  },

  /**
   * Delete all logs for a component
   */
  async deleteByComponent(componentId: string): Promise<void> {
    await db.maintenanceLogs.where('component_id').equals(componentId).delete();
  },
};

// ============================================================================
// Notification Config CRUD Operations
// ============================================================================

export const notificationConfigOperations = {
  /**
   * Create a new notification config
   */
  async create(config: Omit<NotificationConfig, 'id'>): Promise<string> {
    const id = generateId();
    await db.notificationConfigs.add({
      ...config,
      id,
    });
    return id;
  },

  /**
   * Get a notification config by ID
   */
  async getById(id: string): Promise<NotificationConfig | undefined> {
    return await db.notificationConfigs.get(id);
  },

  /**
   * Get notification config for an action
   */
  async getByAction(actionId: string): Promise<NotificationConfig | undefined> {
    return await db.notificationConfigs.where('action_id').equals(actionId).first();
  },

  /**
   * Get all enabled notification configs
   */
  async getEnabled(): Promise<NotificationConfig[]> {
    return await db.notificationConfigs.where('enabled').equals(1).toArray();
  },

  /**
   * Get all notification configs
   */
  async getAll(): Promise<NotificationConfig[]> {
    return await db.notificationConfigs.toArray();
  },

  /**
   * Update a notification config
   */
  async update(id: string, updates: Partial<Omit<NotificationConfig, 'id'>>): Promise<void> {
    await db.notificationConfigs.update(id, updates);
  },

  /**
   * Toggle notification enabled status
   */
  async toggleEnabled(id: string): Promise<void> {
    const config = await db.notificationConfigs.get(id);
    if (config) {
      await db.notificationConfigs.update(id, {
        enabled: !config.enabled,
      });
    }
  },

  /**
   * Delete a notification config
   */
  async delete(id: string): Promise<void> {
    await db.notificationConfigs.delete(id);
  },

  /**
   * Delete notification config for an action
   */
  async deleteByAction(actionId: string): Promise<void> {
    await db.notificationConfigs.where('action_id').equals(actionId).delete();
  },
};

// ============================================================================
// Export all operations
// ============================================================================

export const dbOperations = {
  components: componentOperations,
  maintenanceActions: maintenanceActionOperations,
  maintenanceLogs: maintenanceLogOperations,
  notificationConfigs: notificationConfigOperations,
};
