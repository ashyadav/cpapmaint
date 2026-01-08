import { dbOperations } from './db-operations';
import { scheduler } from './scheduler';
import { useAppStore } from './store';
import { getTemplateByName } from './component-templates';
import { getEscalationStrategy, getEscalationIntervals } from './setup-helpers';
import type { SetupWizardState } from '@/hooks/useSetupWizard';

// ============================================================================
// Setup Completion
// ============================================================================

export interface SetupResult {
  success: boolean;
  error?: string;
  componentsCreated: number;
  actionsCreated: number;
}

/**
 * Completes the setup wizard by creating all database records
 * from the wizard state
 */
export async function completeSetup(wizardState: SetupWizardState): Promise<SetupResult> {
  try {
    let componentsCreated = 0;
    let actionsCreated = 0;

    // Process each configured component
    for (const config of wizardState.componentConfigs) {
      const template = getTemplateByName(config.templateName);
      if (!template) {
        console.warn(`Template not found: ${config.templateName}`);
        continue;
      }

      // 1. Create Component record
      const componentId = await dbOperations.components.create({
        name: config.customName || template.name,
        category: template.category,
        tracking_mode: config.trackingMode,
        usage_count: 0,
        is_active: true,
        notes: undefined,
      });

      componentsCreated++;

      // 2. Create MaintenanceAction records (only enabled ones)
      for (const actionConfig of config.actions.filter((a) => a.enabled)) {
        const actionId = await dbOperations.maintenanceActions.create({
          component_id: componentId,
          action_type: actionConfig.actionType,
          description: actionConfig.description,
          schedule_frequency: actionConfig.scheduleFrequency,
          schedule_unit: actionConfig.scheduleUnit,
          notification_time: actionConfig.notificationTime,
          reminder_strategy: actionConfig.reminderStrategy,
          instructions: actionConfig.instructions || undefined,
          last_completed: undefined,
          next_due: undefined, // Will be set by scheduler
        });

        actionsCreated++;

        // 3. Create NotificationConfig record
        await dbOperations.notificationConfigs.create({
          action_id: actionId,
          enabled: wizardState.notificationPermission === 'granted',
          time: actionConfig.notificationTime,
          escalation_strategy: getEscalationStrategy(actionConfig.reminderStrategy),
          escalation_intervals: getEscalationIntervals(actionConfig.reminderStrategy),
        });
      }
    }

    // 4. Initialize all maintenance actions (set next_due dates)
    await scheduler.initializeAllMaintenanceActions();

    // 5. Refresh Zustand store to load new data
    await useAppStore.getState().loadData();

    // 6. Mark setup as complete in localStorage
    localStorage.setItem('setup_completed', 'true');

    return {
      success: true,
      componentsCreated,
      actionsCreated,
    };
  } catch (error) {
    console.error('Error completing setup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      componentsCreated: 0,
      actionsCreated: 0,
    };
  }
}

/**
 * Clears all setup data (for testing or reset)
 */
export async function clearSetup(): Promise<void> {
  // Clear database
  const components = await dbOperations.components.getAll();
  for (const component of components) {
    if (component.id) {
      await dbOperations.components.delete(component.id);
    }
  }

  // Clear localStorage
  localStorage.removeItem('setup_completed');
  localStorage.removeItem('cpap_setup_wizard_state');

  // Refresh store
  await useAppStore.getState().loadData();
}
