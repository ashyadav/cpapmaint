import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { MaintenanceActionConfig } from '@/components/setup';
import { useSetupWizard, type ComponentConfig, type ActionConfig } from '@/hooks/useSetupWizard';
import { getTemplateByName } from '@/lib/component-templates';

export function ConfigureStep() {
  const navigate = useNavigate();
  const {
    selectedTemplates,
    updateComponentConfig,
    getComponentConfig,
  } = useSetupWizard();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedActionIndex, setExpandedActionIndex] = useState<number | null>(null);

  // Current component being configured
  const currentTemplateName = selectedTemplates[currentIndex];
  const template = currentTemplateName ? getTemplateByName(currentTemplateName) : null;
  const currentConfig = getComponentConfig(currentTemplateName);

  // Initialize config for current component if not exists
  useEffect(() => {
    if (template && !currentConfig) {
      // Create initial config from template
      const initialConfig: ComponentConfig = {
        templateName: template.name,
        customName: template.name,
        trackingMode: template.tracking_mode,
        actions: template.maintenanceActions.map((actionTemplate) => ({
          actionType: actionTemplate.action_type,
          description: actionTemplate.description,
          enabled: true,
          scheduleFrequency: actionTemplate.schedule_frequency,
          scheduleUnit: actionTemplate.schedule_unit,
          notificationTime: actionTemplate.notification_time,
          reminderStrategy: actionTemplate.reminder_strategy,
          instructions: actionTemplate.instructions,
        })),
      };
      updateComponentConfig(initialConfig);
    }
  }, [template, currentConfig, updateComponentConfig]);

  if (!template || !currentConfig) {
    return <div>Loading...</div>;
  }

  const handleNameChange = (newName: string) => {
    updateComponentConfig({
      ...currentConfig,
      customName: newName,
    });
  };

  const handleTrackingModeChange = (mode: ComponentConfig['trackingMode']) => {
    updateComponentConfig({
      ...currentConfig,
      trackingMode: mode,
    });
  };

  const handleActionChange = (index: number, updatedAction: ActionConfig) => {
    const newActions = [...currentConfig.actions];
    newActions[index] = updatedAction;
    updateComponentConfig({
      ...currentConfig,
      actions: newActions,
    });
  };

  const handleResetToDefaults = () => {
    const initialConfig: ComponentConfig = {
      templateName: template.name,
      customName: template.name,
      trackingMode: template.tracking_mode,
      actions: template.maintenanceActions.map((actionTemplate) => ({
        actionType: actionTemplate.action_type,
        description: actionTemplate.description,
        enabled: true,
        scheduleFrequency: actionTemplate.schedule_frequency,
        scheduleUnit: actionTemplate.schedule_unit,
        notificationTime: actionTemplate.notification_time,
        reminderStrategy: actionTemplate.reminder_strategy,
        instructions: actionTemplate.instructions,
      })),
    };
    updateComponentConfig(initialConfig);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setExpandedActionIndex(null);
    } else {
      navigate('/setup/select');
    }
  };

  const handleNext = () => {
    if (currentIndex < selectedTemplates.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setExpandedActionIndex(null);
    } else {
      navigate('/setup/notifications');
    }
  };

  const isFirstComponent = currentIndex === 0;
  const isLastComponent = currentIndex === selectedTemplates.length - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Configure Your Components</h2>
        <p className="mt-2 text-muted-foreground">
          Customize maintenance schedules and tracking preferences
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="rounded-lg bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Configuring{' '}
          <span className="font-medium text-foreground">
            {currentIndex + 1} of {selectedTemplates.length}
          </span>
        </p>
      </div>

      {/* Component Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>Component Settings</CardTitle>
              <CardDescription>Review and customize maintenance schedules</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleResetToDefaults}>
              Reset to Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Component Name */}
          <div className="space-y-2">
            <Label htmlFor="component-name">Component Name</Label>
            <Input
              id="component-name"
              value={currentConfig.customName || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={template.name}
            />
            <p className="text-xs text-muted-foreground">
              You can customize the name for your own reference
            </p>
          </div>

          {/* Tracking Mode */}
          <div className="space-y-3">
            <Label>Tracking Mode</Label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="tracking-mode"
                  value="calendar"
                  checked={currentConfig.trackingMode === 'calendar'}
                  onChange={() => handleTrackingModeChange('calendar')}
                  className="mt-0.5 h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Calendar-based{' '}
                    {template.tracking_mode === 'calendar' && (
                      <span className="text-xs text-primary">(Recommended)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Maintenance due every N days, regardless of usage
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="tracking-mode"
                  value="usage"
                  checked={currentConfig.trackingMode === 'usage'}
                  onChange={() => handleTrackingModeChange('usage')}
                  className="mt-0.5 h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Usage-based</p>
                  <p className="text-sm text-muted-foreground">
                    Maintenance due after N nights of use (requires manual logging)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="tracking-mode"
                  value="hybrid"
                  checked={currentConfig.trackingMode === 'hybrid'}
                  onChange={() => handleTrackingModeChange('hybrid')}
                  className="mt-0.5 h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Hybrid</p>
                  <p className="text-sm text-muted-foreground">
                    Combines both calendar and usage-based tracking
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Maintenance Actions */}
          <div className="space-y-3">
            <div>
              <Label>Maintenance Actions</Label>
              <p className="text-sm text-muted-foreground">
                Configure cleaning and replacement schedules. Click to expand and customize.
              </p>
            </div>

            <div className="space-y-3">
              {currentConfig.actions.map((action, index) => (
                <MaintenanceActionConfig
                  key={action.actionType}
                  action={action}
                  onChange={(updatedAction) => handleActionChange(index, updatedAction)}
                  isExpanded={expandedActionIndex === index}
                  onToggleExpand={() =>
                    setExpandedActionIndex(expandedActionIndex === index ? null : index)
                  }
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handlePrevious}>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {isFirstComponent ? 'Back to Selection' : 'Previous Component'}
        </Button>
        <Button onClick={handleNext}>
          {isLastComponent ? 'Continue to Notifications' : 'Next Component'}
          <svg
            className="ml-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
