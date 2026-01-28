import { db } from './db';
import type { Component, MaintenanceAction, MaintenanceLog, NotificationConfig } from './db';

// ============================================================================
// Export Data Types
// ============================================================================

export interface ExportData {
  version: string;
  exportedAt: string;
  data: {
    components: Component[];
    maintenanceActions: MaintenanceAction[];
    maintenanceLogs: MaintenanceLog[];
    notificationConfigs: NotificationConfig[];
  };
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    components: number;
    maintenanceActions: number;
    maintenanceLogs: number;
    notificationConfigs: number;
  };
}

export type ImportMode = 'merge' | 'replace';

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export all data as a JSON object with version metadata
 */
export async function exportToJSON(): Promise<ExportData> {
  const [components, maintenanceActions, maintenanceLogs, notificationConfigs] = await Promise.all([
    db.components.toArray(),
    db.maintenanceActions.toArray(),
    db.maintenanceLogs.toArray(),
    db.notificationConfigs.toArray(),
  ]);

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      components,
      maintenanceActions,
      maintenanceLogs,
      notificationConfigs,
    },
  };
}

/**
 * Export maintenance logs as CSV for medical records
 */
export async function exportMaintenanceLogsToCSV(): Promise<string> {
  const [logs, components, actions] = await Promise.all([
    db.maintenanceLogs.toArray(),
    db.components.toArray(),
    db.maintenanceActions.toArray(),
  ]);

  // Create lookup maps
  const componentMap = new Map(components.map(c => [c.id, c]));
  const actionMap = new Map(actions.map(a => [a.id, a]));

  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort((a, b) => {
    const dateA = a.completed_at instanceof Date ? a.completed_at : new Date(a.completed_at);
    const dateB = b.completed_at instanceof Date ? b.completed_at : new Date(b.completed_at);
    return dateB.getTime() - dateA.getTime();
  });

  // CSV header
  const header = ['Date', 'Component', 'Action', 'Was Overdue', 'Notes', 'Logged By'];

  // CSV rows
  const rows = sortedLogs.map(log => {
    const component = componentMap.get(log.component_id);
    const action = actionMap.get(log.action_id);
    const completedAt = log.completed_at instanceof Date
      ? log.completed_at
      : new Date(log.completed_at);

    return [
      completedAt.toISOString().split('T')[0], // YYYY-MM-DD format
      component?.name || 'Unknown',
      action?.action_type || 'Unknown',
      log.was_overdue ? 'Yes' : 'No',
      escapeCSV(log.notes || ''),
      log.logged_by,
    ];
  });

  // Combine header and rows
  const csvContent = [
    header.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Escape a value for CSV (handles commas, quotes, and newlines)
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Trigger a browser download for JSON data
 */
export function downloadJSON(data: ExportData, filename?: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `cpap-maintenance-backup-${date}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger a browser download for CSV data
 */
export function downloadCSV(csvContent: string, filename?: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `cpap-maintenance-log-${date}.csv`;

  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Read and parse an uploaded JSON file
 */
export function readImportFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        resolve(data);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate import data schema and return errors/warnings/summary
 */
export async function validateImportData(data: unknown): Promise<ImportValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid data format: expected an object'],
      warnings: [],
      summary: { components: 0, maintenanceActions: 0, maintenanceLogs: 0, notificationConfigs: 0 },
    };
  }

  const exportData = data as Partial<ExportData>;

  // Check version
  if (!exportData.version) {
    errors.push('Missing version field');
  } else if (exportData.version !== '1.0') {
    warnings.push(`Unknown version "${exportData.version}", import may not work correctly`);
  }

  // Check data structure
  if (!exportData.data || typeof exportData.data !== 'object') {
    return {
      isValid: false,
      errors: ['Missing or invalid data field'],
      warnings,
      summary: { components: 0, maintenanceActions: 0, maintenanceLogs: 0, notificationConfigs: 0 },
    };
  }

  const { components = [], maintenanceActions = [], maintenanceLogs = [], notificationConfigs = [] } = exportData.data;

  // Validate arrays
  if (!Array.isArray(components)) {
    errors.push('components must be an array');
  }
  if (!Array.isArray(maintenanceActions)) {
    errors.push('maintenanceActions must be an array');
  }
  if (!Array.isArray(maintenanceLogs)) {
    errors.push('maintenanceLogs must be an array');
  }
  if (!Array.isArray(notificationConfigs)) {
    errors.push('notificationConfigs must be an array');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      summary: { components: 0, maintenanceActions: 0, maintenanceLogs: 0, notificationConfigs: 0 },
    };
  }

  // Build component ID set for reference validation
  const componentIds = new Set(components.map(c => c.id));
  const actionIds = new Set(maintenanceActions.map(a => a.id));

  // Check for orphaned references
  let orphanedActions = 0;
  for (const action of maintenanceActions) {
    if (!componentIds.has(action.component_id)) {
      orphanedActions++;
    }
  }
  if (orphanedActions > 0) {
    warnings.push(`${orphanedActions} maintenance action(s) reference missing components`);
  }

  let orphanedLogs = 0;
  for (const log of maintenanceLogs) {
    if (!componentIds.has(log.component_id) || !actionIds.has(log.action_id)) {
      orphanedLogs++;
    }
  }
  if (orphanedLogs > 0) {
    warnings.push(`${orphanedLogs} maintenance log(s) reference missing components or actions`);
  }

  let orphanedConfigs = 0;
  for (const config of notificationConfigs) {
    if (!actionIds.has(config.action_id)) {
      orphanedConfigs++;
    }
  }
  if (orphanedConfigs > 0) {
    warnings.push(`${orphanedConfigs} notification config(s) reference missing actions`);
  }

  // Validate required fields on components
  for (let i = 0; i < components.length; i++) {
    const c = components[i];
    if (!c.id) errors.push(`Component at index ${i} missing id`);
    if (!c.name) errors.push(`Component at index ${i} missing name`);
  }

  // Validate required fields on actions
  for (let i = 0; i < maintenanceActions.length; i++) {
    const a = maintenanceActions[i];
    if (!a.id) errors.push(`Maintenance action at index ${i} missing id`);
    if (!a.component_id) errors.push(`Maintenance action at index ${i} missing component_id`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      components: components.length,
      maintenanceActions: maintenanceActions.length,
      maintenanceLogs: maintenanceLogs.length,
      notificationConfigs: notificationConfigs.length,
    },
  };
}

/**
 * Import data with specified mode (merge or replace)
 */
export async function importData(data: ExportData, mode: ImportMode): Promise<void> {
  const { components, maintenanceActions, maintenanceLogs, notificationConfigs } = data.data;

  if (mode === 'replace') {
    // Clear all existing data first
    await clearAllData();

    // Bulk insert all data
    await bulkImportComponents(components);
    await bulkImportMaintenanceActions(maintenanceActions);
    await bulkImportMaintenanceLogs(maintenanceLogs);
    await bulkImportNotificationConfigs(notificationConfigs);
  } else {
    // Merge mode: add new items, update existing by ID
    await mergeImportComponents(components);
    await mergeImportMaintenanceActions(maintenanceActions);
    await mergeImportMaintenanceLogs(maintenanceLogs);
    await mergeImportNotificationConfigs(notificationConfigs);
  }
}

// ============================================================================
// Bulk Operations (used by import)
// ============================================================================

/**
 * Clear all data from all tables
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.components.clear(),
    db.maintenanceActions.clear(),
    db.maintenanceLogs.clear(),
    db.notificationConfigs.clear(),
  ]);
}

/**
 * Bulk import components (for replace mode)
 */
async function bulkImportComponents(components: Component[]): Promise<void> {
  if (components.length === 0) return;

  // Parse dates and ensure proper format
  const parsed = components.map(c => ({
    ...c,
    created_at: c.created_at instanceof Date ? c.created_at : new Date(c.created_at),
  }));

  await db.components.bulkAdd(parsed);
}

/**
 * Bulk import maintenance actions (for replace mode)
 */
async function bulkImportMaintenanceActions(actions: MaintenanceAction[]): Promise<void> {
  if (actions.length === 0) return;

  // Parse dates and ensure proper format
  const parsed = actions.map(a => ({
    ...a,
    next_due: a.next_due ? (a.next_due instanceof Date ? a.next_due : new Date(a.next_due)) : undefined,
    last_completed: a.last_completed ? (a.last_completed instanceof Date ? a.last_completed : new Date(a.last_completed)) : undefined,
  }));

  await db.maintenanceActions.bulkAdd(parsed);
}

/**
 * Bulk import maintenance logs (for replace mode)
 */
async function bulkImportMaintenanceLogs(logs: MaintenanceLog[]): Promise<void> {
  if (logs.length === 0) return;

  // Parse dates and ensure proper format
  const parsed = logs.map(l => ({
    ...l,
    completed_at: l.completed_at instanceof Date ? l.completed_at : new Date(l.completed_at),
  }));

  await db.maintenanceLogs.bulkAdd(parsed);
}

/**
 * Bulk import notification configs (for replace mode)
 */
async function bulkImportNotificationConfigs(configs: NotificationConfig[]): Promise<void> {
  if (configs.length === 0) return;
  await db.notificationConfigs.bulkAdd(configs);
}

/**
 * Merge import components (for merge mode)
 */
async function mergeImportComponents(components: Component[]): Promise<void> {
  for (const component of components) {
    const existing = await db.components.get(component.id!);
    const parsed = {
      ...component,
      created_at: component.created_at instanceof Date ? component.created_at : new Date(component.created_at),
    };

    if (existing) {
      await db.components.update(component.id!, parsed);
    } else {
      await db.components.add(parsed);
    }
  }
}

/**
 * Merge import maintenance actions (for merge mode)
 */
async function mergeImportMaintenanceActions(actions: MaintenanceAction[]): Promise<void> {
  for (const action of actions) {
    const existing = await db.maintenanceActions.get(action.id!);
    const parsed = {
      ...action,
      next_due: action.next_due ? (action.next_due instanceof Date ? action.next_due : new Date(action.next_due)) : undefined,
      last_completed: action.last_completed ? (action.last_completed instanceof Date ? action.last_completed : new Date(action.last_completed)) : undefined,
    };

    if (existing) {
      await db.maintenanceActions.update(action.id!, parsed);
    } else {
      await db.maintenanceActions.add(parsed);
    }
  }
}

/**
 * Merge import maintenance logs (for merge mode)
 */
async function mergeImportMaintenanceLogs(logs: MaintenanceLog[]): Promise<void> {
  for (const log of logs) {
    const existing = await db.maintenanceLogs.get(log.id!);
    const parsed = {
      ...log,
      completed_at: log.completed_at instanceof Date ? log.completed_at : new Date(log.completed_at),
    };

    if (existing) {
      await db.maintenanceLogs.update(log.id!, parsed);
    } else {
      await db.maintenanceLogs.add(parsed);
    }
  }
}

/**
 * Merge import notification configs (for merge mode)
 */
async function mergeImportNotificationConfigs(configs: NotificationConfig[]): Promise<void> {
  for (const config of configs) {
    const existing = await db.notificationConfigs.get(config.id!);

    if (existing) {
      await db.notificationConfigs.update(config.id!, config);
    } else {
      await db.notificationConfigs.add(config);
    }
  }
}
