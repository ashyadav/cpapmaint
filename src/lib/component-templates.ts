import type { Component } from './db';

// ============================================================================
// Component Template Types
// ============================================================================

export interface ComponentTemplate {
  name: string;
  category: Component['category'];
  description: string;
  tracking_mode: Component['tracking_mode'];
  maintenanceActions: MaintenanceActionTemplate[];
}

export interface MaintenanceActionTemplate {
  action_type: string;
  description: string;
  schedule_frequency: number;
  schedule_unit: 'days' | 'uses';
  notification_time: string; // HH:MM format
  reminder_strategy: 'gentle' | 'standard' | 'urgent';
  instructions?: string;
  notificationConfig: NotificationConfigTemplate;
}

export interface NotificationConfigTemplate {
  enabled: boolean;
  escalation_strategy: 'single_daily' | 'multiple_daily' | 'increasing_urgency';
  escalation_intervals: number[]; // hours
}

// ============================================================================
// Default Component Templates
// Based on SPEC.md Appendix: Component Templates
// ============================================================================

export const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // Mask Cushion/Pillows
  {
    name: 'Mask Cushion/Pillows',
    category: 'mask_cushion',
    description: 'The part of the mask that contacts your face',
    tracking_mode: 'calendar',
    maintenanceActions: [
      {
        action_type: 'Daily Rinse',
        description: 'Quick rinse with warm water',
        schedule_frequency: 1,
        schedule_unit: 'days',
        notification_time: '08:00',
        reminder_strategy: 'gentle',
        instructions: 'Rinse the cushion with warm water and mild soap. Let air dry.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'single_daily',
          escalation_intervals: [0],
        },
      },
      {
        action_type: 'Weekly Deep Clean',
        description: 'Thorough cleaning with mild soap',
        schedule_frequency: 7,
        schedule_unit: 'days',
        notification_time: '09:00',
        reminder_strategy: 'standard',
        instructions: 'Soak in warm soapy water for 10 minutes, rinse thoroughly, and air dry.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'multiple_daily',
          escalation_intervals: [0, 4],
        },
      },
      {
        action_type: 'Monthly Replacement',
        description: 'Replace with new cushion',
        schedule_frequency: 30,
        schedule_unit: 'days',
        notification_time: '10:00',
        reminder_strategy: 'urgent',
        instructions: 'Replace the cushion with a new one. Dispose of the old cushion.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'increasing_urgency',
          escalation_intervals: [0, 4, 8],
        },
      },
    ],
  },

  // Mask Frame/Headgear
  {
    name: 'Mask Frame & Headgear',
    category: 'mask_frame',
    description: 'The frame and straps that hold the mask in place',
    tracking_mode: 'calendar',
    maintenanceActions: [
      {
        action_type: 'Weekly Clean',
        description: 'Clean frame and headgear',
        schedule_frequency: 7,
        schedule_unit: 'days',
        notification_time: '09:00',
        reminder_strategy: 'standard',
        instructions: 'Wash with warm soapy water, rinse well, and air dry.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'multiple_daily',
          escalation_intervals: [0, 4],
        },
      },
      {
        action_type: 'Quarterly Replacement',
        description: 'Replace frame and headgear',
        schedule_frequency: 90,
        schedule_unit: 'days',
        notification_time: '10:00',
        reminder_strategy: 'urgent',
        instructions: 'Replace with new frame and headgear components.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'increasing_urgency',
          escalation_intervals: [0, 4, 8],
        },
      },
    ],
  },

  // Tubing/Hose
  {
    name: 'Tubing/Hose',
    category: 'tubing',
    description: 'The tube connecting the machine to the mask',
    tracking_mode: 'calendar',
    maintenanceActions: [
      {
        action_type: 'Weekly Rinse',
        description: 'Rinse tubing thoroughly',
        schedule_frequency: 7,
        schedule_unit: 'days',
        notification_time: '09:00',
        reminder_strategy: 'standard',
        instructions: 'Disconnect tubing, rinse with warm soapy water, hang to air dry.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'multiple_daily',
          escalation_intervals: [0, 4],
        },
      },
      {
        action_type: 'Monthly Replacement',
        description: 'Replace tubing',
        schedule_frequency: 30,
        schedule_unit: 'days',
        notification_time: '10:00',
        reminder_strategy: 'urgent',
        instructions: 'Replace with new tubing. Check for any wear or damage.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'increasing_urgency',
          escalation_intervals: [0, 4, 8],
        },
      },
    ],
  },

  // Water Chamber
  {
    name: 'Water Chamber',
    category: 'water_chamber',
    description: 'The humidifier water tank',
    tracking_mode: 'calendar',
    maintenanceActions: [
      {
        action_type: 'Daily Rinse',
        description: 'Empty and rinse water chamber',
        schedule_frequency: 1,
        schedule_unit: 'days',
        notification_time: '08:00',
        reminder_strategy: 'gentle',
        instructions: 'Empty remaining water, rinse with warm water, and refill with distilled water.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'single_daily',
          escalation_intervals: [0],
        },
      },
      {
        action_type: 'Weekly Deep Clean with Vinegar',
        description: 'Clean with vinegar solution',
        schedule_frequency: 7,
        schedule_unit: 'days',
        notification_time: '09:00',
        reminder_strategy: 'standard',
        instructions: 'Fill with 1:1 vinegar and water solution, let soak for 20 minutes, rinse thoroughly.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'multiple_daily',
          escalation_intervals: [0, 4],
        },
      },
      {
        action_type: 'Monthly Sanitize',
        description: 'Sanitize water chamber',
        schedule_frequency: 30,
        schedule_unit: 'days',
        notification_time: '10:00',
        reminder_strategy: 'standard',
        instructions: 'Use approved CPAP cleaning solution to sanitize chamber.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'multiple_daily',
          escalation_intervals: [0, 4],
        },
      },
      {
        action_type: '6-Month Replacement',
        description: 'Replace water chamber',
        schedule_frequency: 180,
        schedule_unit: 'days',
        notification_time: '10:00',
        reminder_strategy: 'urgent',
        instructions: 'Replace with new water chamber.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'increasing_urgency',
          escalation_intervals: [0, 4, 8],
        },
      },
    ],
  },

  // Air Filter (Disposable)
  {
    name: 'Air Filter (Disposable)',
    category: 'filter',
    description: 'Disposable filter for machine air intake',
    tracking_mode: 'calendar',
    maintenanceActions: [
      {
        action_type: 'Monthly Replacement',
        description: 'Replace disposable filter',
        schedule_frequency: 30,
        schedule_unit: 'days',
        notification_time: '10:00',
        reminder_strategy: 'urgent',
        instructions: 'Remove old filter and replace with new disposable filter.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'increasing_urgency',
          escalation_intervals: [0, 4, 8],
        },
      },
    ],
  },

  // Air Filter (Reusable)
  {
    name: 'Air Filter (Reusable)',
    category: 'filter',
    description: 'Reusable filter for machine air intake',
    tracking_mode: 'calendar',
    maintenanceActions: [
      {
        action_type: 'Weekly Rinse',
        description: 'Rinse reusable filter',
        schedule_frequency: 7,
        schedule_unit: 'days',
        notification_time: '09:00',
        reminder_strategy: 'standard',
        instructions: 'Rinse filter with warm water, let air dry completely before reinserting.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'multiple_daily',
          escalation_intervals: [0, 4],
        },
      },
      {
        action_type: 'Monthly Deep Clean',
        description: 'Deep clean reusable filter',
        schedule_frequency: 30,
        schedule_unit: 'days',
        notification_time: '10:00',
        reminder_strategy: 'standard',
        instructions: 'Wash with mild soap and warm water, rinse thoroughly, air dry completely.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'multiple_daily',
          escalation_intervals: [0, 4],
        },
      },
      {
        action_type: '6-Month Replacement',
        description: 'Replace reusable filter',
        schedule_frequency: 180,
        schedule_unit: 'days',
        notification_time: '10:00',
        reminder_strategy: 'urgent',
        instructions: 'Replace with new reusable filter.',
        notificationConfig: {
          enabled: true,
          escalation_strategy: 'increasing_urgency',
          escalation_intervals: [0, 4, 8],
        },
      },
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get template by category
 */
export function getTemplateByCategory(category: Component['category']): ComponentTemplate[] {
  return COMPONENT_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Get all template categories
 */
export function getAllTemplateCategories(): Component['category'][] {
  return Array.from(new Set(COMPONENT_TEMPLATES.map((template) => template.category)));
}

/**
 * Get template by name
 */
export function getTemplateByName(name: string): ComponentTemplate | undefined {
  return COMPONENT_TEMPLATES.find((template) => template.name === name);
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: Component['category']): string {
  const displayNames: Record<Component['category'], string> = {
    mask_cushion: 'Mask Cushion/Pillows',
    mask_frame: 'Mask Frame & Headgear',
    tubing: 'Tubing/Hose',
    water_chamber: 'Water Chamber',
    filter: 'Air Filter',
    other: 'Other',
  };
  return displayNames[category] || category;
}

/**
 * Get category description
 */
export function getCategoryDescription(category: Component['category']): string {
  const descriptions: Record<Component['category'], string> = {
    mask_cushion: 'The part of the mask that contacts your face',
    mask_frame: 'The frame and straps that hold the mask in place',
    tubing: 'The tube connecting the machine to the mask',
    water_chamber: 'The humidifier water tank',
    filter: 'Machine air intake filter',
    other: 'Other CPAP components',
  };
  return descriptions[category] || '';
}
