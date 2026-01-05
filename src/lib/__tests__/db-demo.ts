/**
 * Database Operations Demo/Test
 *
 * This file demonstrates all CRUD operations and scheduling logic.
 * Run this in the browser console or as part of onboarding to populate demo data.
 */

import { dbOperations } from '../db-operations';
import { scheduler } from '../scheduler';
import { COMPONENT_TEMPLATES } from '../component-templates';

// ============================================================================
// Demo Data Population
// ============================================================================

/**
 * Populate database with demo data based on component templates
 */
export async function populateDemoData(): Promise<void> {
  console.log('🚀 Starting demo data population...');

  try {
    // Clear existing data (optional - comment out to preserve data)
    // await clearAllData();

    // Create components from templates
    await createDemoComponent('Mask Cushion/Pillows');
    await createDemoComponent('Water Chamber');
    await createDemoComponent('Tubing/Hose');
    await createDemoComponent('Air Filter (Disposable)');

    console.log('✅ Created 4 demo components');

    // Get counts
    const componentCount = await dbOperations.components.getAll();
    const actionCount = await dbOperations.maintenanceActions.getAll();
    const configCount = await dbOperations.notificationConfigs.getAll();

    console.log(`📊 Database Summary:`);
    console.log(`   - Components: ${componentCount.length}`);
    console.log(`   - Maintenance Actions: ${actionCount.length}`);
    console.log(`   - Notification Configs: ${configCount.length}`);

    // Initialize all actions to have due dates
    const initialized = await scheduler.initializeAllMaintenanceActions();
    console.log(`✅ Initialized ${initialized} maintenance actions`);

    console.log('🎉 Demo data population complete!');
  } catch (error) {
    console.error('❌ Error populating demo data:', error);
    throw error;
  }
}

/**
 * Create a component from a template with all its actions and configs
 */
async function createDemoComponent(templateName: string): Promise<string> {
  const template = COMPONENT_TEMPLATES.find((t) => t.name === templateName);
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  // Create component
  const componentId = await dbOperations.components.create({
    name: template.name,
    category: template.category,
    tracking_mode: template.tracking_mode,
    usage_count: 0,
    is_active: true,
    notes: `Demo component created from ${templateName} template`,
  });

  console.log(`   ✓ Created component: ${template.name} (${componentId})`);

  // Create maintenance actions for this component
  for (const actionTemplate of template.maintenanceActions) {
    const actionId = await dbOperations.maintenanceActions.create({
      component_id: componentId,
      action_type: actionTemplate.action_type,
      description: actionTemplate.description,
      schedule_frequency: actionTemplate.schedule_frequency,
      schedule_unit: actionTemplate.schedule_unit,
      notification_time: actionTemplate.notification_time,
      reminder_strategy: actionTemplate.reminder_strategy,
      instructions: actionTemplate.instructions,
      last_completed: undefined,
      next_due: undefined, // Will be set by scheduler
    });

    console.log(`     ↳ Created action: ${actionTemplate.action_type}`);

    // Create notification config for this action
    await dbOperations.notificationConfigs.create({
      action_id: actionId,
      enabled: actionTemplate.notificationConfig.enabled,
      time: actionTemplate.notification_time,
      escalation_strategy: actionTemplate.notificationConfig.escalation_strategy,
      escalation_intervals: actionTemplate.notificationConfig.escalation_intervals,
    });
  }

  return componentId;
}

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
  console.log('🗑️  Clearing all data...');

  const components = await dbOperations.components.getAll();
  for (const component of components) {
    if (component.id) {
      await dbOperations.components.delete(component.id);
    }
  }

  console.log('✅ All data cleared');
}

// ============================================================================
// Test CRUD Operations
// ============================================================================

/**
 * Test all component CRUD operations
 */
export async function testComponentOperations(): Promise<void> {
  console.log('\n📝 Testing Component CRUD Operations...');

  // Create
  const componentId = await dbOperations.components.create({
    name: 'Test Component',
    category: 'mask_cushion',
    tracking_mode: 'calendar',
    usage_count: 0,
    is_active: true,
    notes: 'Test component for CRUD operations',
  });
  console.log('✓ Create:', componentId);

  // Read
  const component = await dbOperations.components.getById(componentId);
  console.log('✓ Read:', component?.name);

  // Update
  await dbOperations.components.update(componentId, {
    name: 'Updated Test Component',
    usage_count: 5,
  });
  const updated = await dbOperations.components.getById(componentId);
  console.log('✓ Update:', updated?.name, 'Usage:', updated?.usage_count);

  // Get all
  const all = await dbOperations.components.getAll();
  console.log('✓ Get All:', all.length, 'components');

  // Get active
  const active = await dbOperations.components.getActive();
  console.log('✓ Get Active:', active.length, 'active components');

  // Toggle active
  await dbOperations.components.toggleActive(componentId);
  const toggled = await dbOperations.components.getById(componentId);
  console.log('✓ Toggle Active:', toggled?.is_active);

  // Delete
  await dbOperations.components.delete(componentId);
  const deleted = await dbOperations.components.getById(componentId);
  console.log('✓ Delete:', deleted === undefined ? 'Success' : 'Failed');

  console.log('✅ Component CRUD tests complete\n');
}

/**
 * Test scheduling logic
 */
export async function testSchedulingLogic(): Promise<void> {
  console.log('\n📅 Testing Scheduling Logic...');

  // Create test component and action
  const componentId = await dbOperations.components.create({
    name: 'Test Scheduling Component',
    category: 'water_chamber',
    tracking_mode: 'calendar',
    usage_count: 0,
    is_active: true,
  });

  const actionId = await dbOperations.maintenanceActions.create({
    component_id: componentId,
    action_type: 'Daily Rinse',
    description: 'Test daily rinse',
    schedule_frequency: 1,
    schedule_unit: 'days',
    notification_time: '08:00',
    reminder_strategy: 'gentle',
  });

  console.log('✓ Created test component and action');

  // Initialize action (set first due date)
  const initialized = await scheduler.initializeMaintenanceAction(actionId);
  console.log('✓ Initialized action, next due:', initialized.next_due);

  // Complete action
  const { nextDueDate } = await scheduler.completeMaintenanceAction(
    actionId,
    new Date(),
    'Test completion'
  );
  console.log('✓ Completed action, next due:', nextDueDate);

  // Get maintenance summary
  const summary = await scheduler.getMaintenanceSummary();
  console.log('✓ Maintenance summary:', summary);

  // Get actions needing attention
  const needsAttention = await scheduler.getActionsNeedingAttention();
  console.log('✓ Actions needing attention:', needsAttention.length);

  // Cleanup
  await dbOperations.components.delete(componentId);
  console.log('✓ Cleaned up test data');

  console.log('✅ Scheduling logic tests complete\n');
}

/**
 * Test maintenance log operations
 */
export async function testMaintenanceLogOperations(): Promise<void> {
  console.log('\n📋 Testing Maintenance Log Operations...');

  // Create test component and action
  const componentId = await dbOperations.components.create({
    name: 'Test Log Component',
    category: 'mask_cushion',
    tracking_mode: 'calendar',
    usage_count: 0,
    is_active: true,
  });

  const actionId = await dbOperations.maintenanceActions.create({
    component_id: componentId,
    action_type: 'Weekly Clean',
    description: 'Test weekly clean',
    schedule_frequency: 7,
    schedule_unit: 'days',
    notification_time: '09:00',
    reminder_strategy: 'standard',
  });

  // Create some logs
  await dbOperations.maintenanceLogs.create({
    component_id: componentId,
    action_id: actionId,
    completed_at: new Date(),
    was_overdue: false,
    notes: 'First log entry',
    logged_by: 'user',
  });

  await dbOperations.maintenanceLogs.create({
    component_id: componentId,
    action_id: actionId,
    completed_at: new Date(),
    was_overdue: true,
    notes: 'Second log entry (overdue)',
    logged_by: 'user',
  });

  console.log('✓ Created 2 log entries');

  // Get all logs
  const allLogs = await dbOperations.maintenanceLogs.getAll();
  console.log('✓ Get all logs:', allLogs.length);

  // Get logs by component
  const componentLogs = await dbOperations.maintenanceLogs.getByComponent(componentId);
  console.log('✓ Get component logs:', componentLogs.length);

  // Get logs by action
  const actionLogs = await dbOperations.maintenanceLogs.getByAction(actionId);
  console.log('✓ Get action logs:', actionLogs.length);

  // Get overdue logs
  const overdueLogs = await dbOperations.maintenanceLogs.getOverdue();
  console.log('✓ Get overdue logs:', overdueLogs.length);

  // Cleanup
  await dbOperations.components.delete(componentId);
  console.log('✓ Cleaned up test data');

  console.log('✅ Maintenance log tests complete\n');
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🧪 Running All Database Tests...\n');
  console.log('='.repeat(50));

  try {
    await testComponentOperations();
    await testSchedulingLogic();
    await testMaintenanceLogOperations();

    console.log('='.repeat(50));
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<void> {
  console.log('\n📊 Database Statistics...\n');

  const components = await dbOperations.components.getAll();
  const actions = await dbOperations.maintenanceActions.getAll();
  const logs = await dbOperations.maintenanceLogs.getAll();
  const configs = await dbOperations.notificationConfigs.getAll();

  const activeComponents = components.filter((c) => c.is_active);
  const summary = await scheduler.getMaintenanceSummary();

  console.log(`Components:           ${components.length} (${activeComponents.length} active)`);
  console.log(`Maintenance Actions:  ${actions.length}`);
  console.log(`Maintenance Logs:     ${logs.length}`);
  console.log(`Notification Configs: ${configs.length}`);
  console.log(`\nMaintenance Summary:`);
  console.log(`  Overdue:            ${summary.overdueCount}`);
  console.log(`  Due Today:          ${summary.dueTodayCount}`);
  console.log(`  Upcoming:           ${summary.upcomingCount}`);
  console.log(`  All Caught Up:      ${summary.allCaughtUp ? 'Yes ✅' : 'No ⚠️'}`);

  if (summary.nextUpcoming) {
    console.log(
      `  Next Upcoming:      ${summary.nextUpcoming.action.action_type} in ${summary.nextUpcoming.daysUntil} days`
    );
  }
}

// ============================================================================
// Export for console use
// ============================================================================

// Make available globally for easy console testing
if (typeof window !== 'undefined') {
  (window as any).dbDemo = {
    populateDemoData,
    clearAllData,
    runAllTests,
    getDatabaseStats,
    testComponentOperations,
    testSchedulingLogic,
    testMaintenanceLogOperations,
  };

  console.log('💡 Database demo functions available on window.dbDemo:');
  console.log('   - populateDemoData()');
  console.log('   - clearAllData()');
  console.log('   - runAllTests()');
  console.log('   - getDatabaseStats()');
}
