import { Input, Label, Select, Badge } from '@/components/ui';
import { TimePickerInput } from './TimePickerInput';
import { cn } from '@/lib/utils';
import type { ActionConfig } from '@/hooks/useSetupWizard';

interface MaintenanceActionConfigProps {
  action: ActionConfig;
  onChange: (action: ActionConfig) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function MaintenanceActionConfig({
  action,
  onChange,
  isExpanded,
  onToggleExpand,
}: MaintenanceActionConfigProps) {
  const handleFieldChange = (field: keyof ActionConfig, value: any) => {
    onChange({
      ...action,
      [field]: value,
    });
  };

  const resetToDefaults = () => {
    // This would ideally restore from template defaults
    // For now, just toggle enabled back on if it was disabled
    if (!action.enabled) {
      onChange({ ...action, enabled: true });
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        action.enabled ? 'border-border bg-card' : 'border-muted bg-muted/30'
      )}
    >
      {/* Header - Always Visible */}
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={onToggleExpand}
      >
        <div className="flex flex-1 items-center gap-3">
          {/* Enable/Disable Checkbox */}
          <input
            type="checkbox"
            checked={action.enabled}
            onChange={(e) => {
              e.stopPropagation();
              handleFieldChange('enabled', e.target.checked);
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Action Name */}
          <div className="flex-1">
            <p
              className={cn(
                'font-medium',
                action.enabled ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {action.actionType}
            </p>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </div>

          {/* Frequency Badge */}
          <Badge variant={action.enabled ? 'default' : 'outline'}>
            Every {action.scheduleFrequency} {action.scheduleUnit}
          </Badge>
        </div>

        {/* Expand/Collapse Icon */}
        <svg
          className={cn(
            'ml-2 h-5 w-5 text-muted-foreground transition-transform',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Configuration */}
      {isExpanded && action.enabled && (
        <div className="space-y-4 border-t p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor={`frequency-${action.actionType}`}>Frequency</Label>
              <Input
                id={`frequency-${action.actionType}`}
                type="number"
                min="1"
                value={action.scheduleFrequency}
                onChange={(e) =>
                  handleFieldChange('scheduleFrequency', parseInt(e.target.value) || 1)
                }
              />
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor={`unit-${action.actionType}`}>Unit</Label>
              <Select
                id={`unit-${action.actionType}`}
                value={action.scheduleUnit}
                onChange={(e) => handleFieldChange('scheduleUnit', e.target.value)}
              >
                <option value="days">Days</option>
                <option value="uses">Uses</option>
              </Select>
            </div>

            {/* Notification Time */}
            <div className="space-y-2">
              <Label htmlFor={`time-${action.actionType}`}>Notification Time</Label>
              <TimePickerInput
                id={`time-${action.actionType}`}
                value={action.notificationTime}
                onChange={(value) => handleFieldChange('notificationTime', value)}
              />
            </div>

            {/* Reminder Strategy */}
            <div className="space-y-2">
              <Label htmlFor={`strategy-${action.actionType}`}>Reminder Strategy</Label>
              <Select
                id={`strategy-${action.actionType}`}
                value={action.reminderStrategy}
                onChange={(e) => handleFieldChange('reminderStrategy', e.target.value)}
              >
                <option value="gentle">Gentle (1x daily)</option>
                <option value="standard">Standard (2x daily)</option>
                <option value="urgent">Urgent (3x daily)</option>
              </Select>
            </div>
          </div>

          {/* Instructions */}
          {action.instructions && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">Instructions:</p>
              <p className="mt-1 text-sm text-foreground">{action.instructions}</p>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetToDefaults}
              className="text-sm text-primary hover:underline"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
