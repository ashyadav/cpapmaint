import type { NotificationConfig } from './db';

// ============================================================================
// Escalation Strategy Mapping
// ============================================================================

/**
 * Maps reminder strategy to escalation strategy
 */
export function getEscalationStrategy(
  reminderStrategy: 'gentle' | 'standard' | 'urgent'
): NotificationConfig['escalation_strategy'] {
  const map: Record<string, NotificationConfig['escalation_strategy']> = {
    gentle: 'single_daily',
    standard: 'multiple_daily',
    urgent: 'increasing_urgency',
  };
  return map[reminderStrategy] || 'single_daily';
}

/**
 * Maps reminder strategy to escalation intervals (in hours)
 */
export function getEscalationIntervals(
  reminderStrategy: 'gentle' | 'standard' | 'urgent'
): number[] {
  const map: Record<string, number[]> = {
    gentle: [0], // Single notification
    standard: [0, 4], // Initial + 4 hours later
    urgent: [0, 4, 8], // Initial + 4 hours + 8 hours
  };
  return map[reminderStrategy] || [0];
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates if a time string is in HH:MM format
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Validates if a component configuration is complete
 */
export function isComponentConfigValid(config: any): boolean {
  if (!config) return false;
  if (!config.templateName) return false;
  if (!config.trackingMode) return false;
  if (!Array.isArray(config.actions)) return false;

  // At least one action must be enabled
  const hasEnabledAction = config.actions.some((action: any) => action.enabled);
  return hasEnabledAction;
}
