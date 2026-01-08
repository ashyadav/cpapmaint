import { useState, useEffect, useCallback } from 'react';
import type { Component } from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

export interface ActionConfig {
  actionType: string;
  description: string;
  enabled: boolean;
  scheduleFrequency: number;
  scheduleUnit: 'days' | 'uses';
  notificationTime: string; // HH:MM format
  reminderStrategy: 'gentle' | 'standard' | 'urgent';
  instructions?: string;
}

export interface ComponentConfig {
  templateName: string;
  customName?: string;
  trackingMode: Component['tracking_mode'];
  actions: ActionConfig[];
}

export interface SetupWizardState {
  selectedTemplates: string[];
  componentConfigs: ComponentConfig[];
  notificationTime: string;
  notificationPermission: NotificationPermission;
}

const STORAGE_KEY = 'cpap_setup_wizard_state';
const DEFAULT_NOTIFICATION_TIME = '08:00';

// ============================================================================
// localStorage Utilities
// ============================================================================

function loadStateFromStorage(): SetupWizardState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    // Validate version for future migrations
    if (parsed.version === '1.0') {
      return {
        selectedTemplates: parsed.selectedTemplates || [],
        componentConfigs: parsed.componentConfigs || [],
        notificationTime: parsed.notificationTime || DEFAULT_NOTIFICATION_TIME,
        notificationPermission: parsed.notificationPermission || 'default',
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to load wizard state from localStorage:', error);
    return null;
  }
}

function saveStateToStorage(state: SetupWizardState): void {
  try {
    const toSave = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      ...state,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save wizard state to localStorage:', error);
  }
}

function clearStateFromStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================================
// Hook
// ============================================================================

export function useSetupWizard() {
  // Initialize state from localStorage or defaults
  const [state, setState] = useState<SetupWizardState>(() => {
    const stored = loadStateFromStorage();
    if (stored) return stored;

    return {
      selectedTemplates: [],
      componentConfigs: [],
      notificationTime: DEFAULT_NOTIFICATION_TIME,
      notificationPermission: 'default' as NotificationPermission,
    };
  });

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // ============================================================================
  // Template Selection
  // ============================================================================

  const selectTemplate = useCallback((templateName: string) => {
    setState((prev) => {
      if (prev.selectedTemplates.includes(templateName)) {
        return prev; // Already selected
      }
      return {
        ...prev,
        selectedTemplates: [...prev.selectedTemplates, templateName],
      };
    });
  }, []);

  const deselectTemplate = useCallback((templateName: string) => {
    setState((prev) => ({
      ...prev,
      selectedTemplates: prev.selectedTemplates.filter((name) => name !== templateName),
      // Also remove from componentConfigs if exists
      componentConfigs: prev.componentConfigs.filter((config) => config.templateName !== templateName),
    }));
  }, []);

  const toggleTemplate = useCallback((templateName: string) => {
    setState((prev) => {
      const isSelected = prev.selectedTemplates.includes(templateName);
      if (isSelected) {
        return {
          ...prev,
          selectedTemplates: prev.selectedTemplates.filter((name) => name !== templateName),
          componentConfigs: prev.componentConfigs.filter((config) => config.templateName !== templateName),
        };
      } else {
        return {
          ...prev,
          selectedTemplates: [...prev.selectedTemplates, templateName],
        };
      }
    });
  }, []);

  const selectAllTemplates = useCallback((templateNames: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedTemplates: templateNames,
    }));
  }, []);

  const deselectAllTemplates = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedTemplates: [],
      componentConfigs: [],
    }));
  }, []);

  // ============================================================================
  // Component Configuration
  // ============================================================================

  const updateComponentConfig = useCallback((config: ComponentConfig) => {
    setState((prev) => {
      const existingIndex = prev.componentConfigs.findIndex(
        (c) => c.templateName === config.templateName
      );

      if (existingIndex >= 0) {
        // Update existing config
        const newConfigs = [...prev.componentConfigs];
        newConfigs[existingIndex] = config;
        return {
          ...prev,
          componentConfigs: newConfigs,
        };
      } else {
        // Add new config
        return {
          ...prev,
          componentConfigs: [...prev.componentConfigs, config],
        };
      }
    });
  }, []);

  const getComponentConfig = useCallback(
    (templateName: string): ComponentConfig | undefined => {
      return state.componentConfigs.find((c) => c.templateName === templateName);
    },
    [state.componentConfigs]
  );

  // ============================================================================
  // Notification Settings
  // ============================================================================

  const setNotificationTime = useCallback((time: string) => {
    setState((prev) => ({
      ...prev,
      notificationTime: time,
    }));
  }, []);

  const setNotificationPermission = useCallback((permission: NotificationPermission) => {
    setState((prev) => ({
      ...prev,
      notificationPermission: permission,
    }));
  }, []);

  // ============================================================================
  // Validation
  // ============================================================================

  const canProceedFromSelect = useCallback((): boolean => {
    return state.selectedTemplates.length > 0;
  }, [state.selectedTemplates.length]);

  const canProceedFromConfigure = useCallback((): boolean => {
    // All selected templates must have configurations
    return state.selectedTemplates.every((templateName) =>
      state.componentConfigs.some((config) => config.templateName === templateName)
    );
  }, [state.selectedTemplates, state.componentConfigs]);

  // ============================================================================
  // Reset & Cleanup
  // ============================================================================

  const reset = useCallback(() => {
    setState({
      selectedTemplates: [],
      componentConfigs: [],
      notificationTime: DEFAULT_NOTIFICATION_TIME,
      notificationPermission: 'default',
    });
    clearStateFromStorage();
  }, []);

  const clearStorage = useCallback(() => {
    clearStateFromStorage();
  }, []);

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // State
    selectedTemplates: state.selectedTemplates,
    componentConfigs: state.componentConfigs,
    notificationTime: state.notificationTime,
    notificationPermission: state.notificationPermission,

    // Template selection actions
    selectTemplate,
    deselectTemplate,
    toggleTemplate,
    selectAllTemplates,
    deselectAllTemplates,

    // Component configuration actions
    updateComponentConfig,
    getComponentConfig,

    // Notification actions
    setNotificationTime,
    setNotificationPermission,

    // Validation
    canProceedFromSelect,
    canProceedFromConfigure,

    // Utilities
    reset,
    clearStorage,
  };
}
