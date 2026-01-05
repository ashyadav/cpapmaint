import Dexie, { Table } from 'dexie';

// Type definitions based on SPEC.md data models
export interface Component {
  id?: string;
  name: string;
  category: 'mask_cushion' | 'mask_frame' | 'tubing' | 'water_chamber' | 'filter' | 'other';
  tracking_mode: 'calendar' | 'usage' | 'hybrid';
  usage_count: number;
  is_active: boolean;
  created_at: Date;
  notes?: string;
}

export interface MaintenanceAction {
  id?: string;
  component_id: string;
  action_type: string; // e.g., "Daily Rinse", "Deep Clean", "Replace"
  description: string;
  schedule_frequency: number; // number of days or uses
  schedule_unit: 'days' | 'uses';
  notification_time?: string; // HH:MM format
  reminder_strategy: 'gentle' | 'standard' | 'urgent';
  last_completed?: Date;
  next_due?: Date;
  instructions?: string;
}

export interface MaintenanceLog {
  id?: string;
  component_id: string;
  action_id: string;
  completed_at: Date;
  was_overdue: boolean;
  notes?: string;
  logged_by: 'user' | 'system';
}

export interface NotificationConfig {
  id?: string;
  action_id: string;
  enabled: boolean;
  time: string; // HH:MM format
  escalation_strategy: 'single_daily' | 'multiple_daily' | 'increasing_urgency';
  escalation_intervals: number[]; // hours, e.g., [0, 4, 8]
}

// Dexie database class
export class CPAPDatabase extends Dexie {
  components!: Table<Component, string>;
  maintenanceActions!: Table<MaintenanceAction, string>;
  maintenanceLogs!: Table<MaintenanceLog, string>;
  notificationConfigs!: Table<NotificationConfig, string>;

  constructor() {
    super('CPAPMaintenanceDB');

    this.version(1).stores({
      components: 'id, category, is_active, created_at',
      maintenanceActions: 'id, component_id, action_type, next_due',
      maintenanceLogs: 'id, component_id, action_id, completed_at',
      notificationConfigs: 'id, action_id, enabled'
    });
  }
}

// Create and export database instance
export const db = new CPAPDatabase();
