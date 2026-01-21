import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header, Container, Navigation } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { CompletionToast } from '@/components/CompletionToast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore, useComponentActions } from '@/lib/store';
import { dbOperations } from '@/lib/db-operations';
import { initializeMaintenanceAction } from '@/lib/scheduler';
import type { MaintenanceAction } from '@/lib/db';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components' },
];

type ScheduleUnit = 'days' | 'uses';
type ReminderStrategy = 'gentle' | 'standard' | 'urgent';
type EscalationStrategy = 'single_daily' | 'multiple_daily' | 'increasing_urgency';

const scheduleUnits: { value: ScheduleUnit; label: string }[] = [
  { value: 'days', label: 'Days' },
  { value: 'uses', label: 'Uses' },
];

const reminderStrategies: { value: ReminderStrategy; label: string; description: string }[] = [
  { value: 'gentle', label: 'Gentle', description: 'One quiet reminder per day' },
  { value: 'standard', label: 'Standard', description: 'Multiple reminders throughout the day' },
  { value: 'urgent', label: 'Urgent', description: 'Persistent reminders with increasing frequency' },
];

export function MaintenanceActionForm() {
  const { id: componentId, actionId } = useParams<{ id: string; actionId?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(actionId);

  const { isLoading, isInitialized, loadData, components, refreshMaintenanceActions, refreshNotificationConfigs, notificationConfigs } = useAppStore();
  const componentActions = useComponentActions(componentId || '');

  // Form state
  const [actionType, setActionType] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState('7');
  const [scheduleUnit, setScheduleUnit] = useState<ScheduleUnit>('days');
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [reminderStrategy, setReminderStrategy] = useState<ReminderStrategy>('standard');
  const [instructions, setInstructions] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [escalationStrategy, setEscalationStrategy] = useState<EscalationStrategy>('multiple_daily');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errors, setErrors] = useState<{ actionType?: string; frequency?: string }>({});

  const component = components.find(c => c.id === componentId);

  useEffect(() => {
    if (!isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  // Load existing action data when editing
  useEffect(() => {
    if (isEditing && isInitialized && actionId) {
      const action = componentActions.find(a => a.id === actionId);
      if (action) {
        setActionType(action.action_type);
        setDescription(action.description);
        setScheduleFrequency(action.schedule_frequency.toString());
        setScheduleUnit(action.schedule_unit);
        setNotificationTime(action.notification_time || '09:00');
        setReminderStrategy(action.reminder_strategy);
        setInstructions(action.instructions || '');

        // Load notification config
        const config = notificationConfigs.find(c => c.action_id === actionId);
        if (config) {
          setNotificationsEnabled(config.enabled);
          setEscalationStrategy(config.escalation_strategy);
        }
      }
    }
  }, [isEditing, isInitialized, componentActions, actionId, notificationConfigs]);

  const validateForm = (): boolean => {
    const newErrors: { actionType?: string; frequency?: string } = {};

    if (!actionType.trim()) {
      newErrors.actionType = 'Action type is required';
    }

    const freq = parseInt(scheduleFrequency, 10);
    if (isNaN(freq) || freq <= 0) {
      newErrors.frequency = 'Frequency must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !componentId) {
      return;
    }

    setIsSaving(true);

    try {
      const actionData: Omit<MaintenanceAction, 'id'> = {
        component_id: componentId,
        action_type: actionType.trim(),
        description: description.trim(),
        schedule_frequency: parseInt(scheduleFrequency, 10),
        schedule_unit: scheduleUnit,
        notification_time: notificationTime,
        reminder_strategy: reminderStrategy,
        instructions: instructions.trim() || undefined,
      };

      if (isEditing && actionId) {
        // Update existing action
        await dbOperations.maintenanceActions.update(actionId, actionData);

        // Update notification config
        const existingConfig = notificationConfigs.find(c => c.action_id === actionId);
        if (existingConfig) {
          await dbOperations.notificationConfigs.update(existingConfig.id!, {
            enabled: notificationsEnabled,
            time: notificationTime,
            escalation_strategy: escalationStrategy,
          });
        }

        await refreshMaintenanceActions();
        await refreshNotificationConfigs();
        setToastMessage('Action updated successfully!');
        setShowToast(true);
        setTimeout(() => navigate(`/components/${componentId}`), 1500);
      } else {
        // Create new action
        const newActionId = await dbOperations.maintenanceActions.create(actionData);

        // Create notification config
        const escalationIntervals =
          escalationStrategy === 'single_daily' ? [0] :
          escalationStrategy === 'multiple_daily' ? [0, 4] :
          [0, 4, 8];

        await dbOperations.notificationConfigs.create({
          action_id: newActionId,
          enabled: notificationsEnabled,
          time: notificationTime,
          escalation_strategy: escalationStrategy,
          escalation_intervals: escalationIntervals,
        });

        // Initialize the action with first due date
        await initializeMaintenanceAction(newActionId);

        await refreshMaintenanceActions();
        await refreshNotificationConfigs();
        setToastMessage('Action created successfully!');
        setShowToast(true);
        setTimeout(() => navigate(`/components/${componentId}`), 1500);
      }
    } catch (error) {
      console.error('Error saving action:', error);
      setToastMessage('Failed to save action. Please try again.');
      setShowToast(true);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actionId) return;
    setIsDeleting(true);
    try {
      await dbOperations.maintenanceActions.delete(actionId);
      await refreshMaintenanceActions();
      await refreshNotificationConfigs();
      navigate(`/components/${componentId}`);
    } catch (error) {
      console.error('Error deleting action:', error);
      setToastMessage('Failed to delete action. Please try again.');
      setShowToast(true);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header title={isEditing ? 'Edit Action' : 'Add Action'} />
        <Navigation items={navItems} />
        <main>
          <Container size="md">
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          </Container>
        </main>
      </div>
    );
  }

  // Component not found
  if (!component) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Component Not Found" />
        <Navigation items={navItems} />
        <main>
          <Container>
            <EmptyState
              title="Component not found"
              description="The component you're looking for doesn't exist."
              action={
                <Link to="/components">
                  <Button>Back to Components</Button>
                </Link>
              }
            />
          </Container>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={isEditing ? 'Edit Maintenance Action' : 'Add Maintenance Action'}
        description={`For ${component.name}`}
      />
      <Navigation items={navItems} />

      <main>
        <Container size="md">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Action Type */}
                <div className="space-y-2">
                  <Label htmlFor="actionType">Action Type</Label>
                  <Input
                    id="actionType"
                    type="text"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    placeholder="e.g., Daily Rinse, Weekly Clean, Monthly Replace"
                    disabled={isSaving}
                    className={errors.actionType ? 'border-red-500' : ''}
                  />
                  {errors.actionType && (
                    <p className="text-xs text-red-500">{errors.actionType}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the action"
                    disabled={isSaving}
                  />
                </div>

                {/* Schedule */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Input
                      id="frequency"
                      type="number"
                      min="1"
                      value={scheduleFrequency}
                      onChange={(e) => setScheduleFrequency(e.target.value)}
                      placeholder="7"
                      disabled={isSaving}
                      className={errors.frequency ? 'border-red-500' : ''}
                    />
                    {errors.frequency && (
                      <p className="text-xs text-red-500">{errors.frequency}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      id="unit"
                      value={scheduleUnit}
                      onChange={(e) => setScheduleUnit(e.target.value as ScheduleUnit)}
                      disabled={isSaving}
                    >
                      {scheduleUnits.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Notification Time */}
                <div className="space-y-2">
                  <Label htmlFor="notificationTime">Notification Time</Label>
                  <Input
                    id="notificationTime"
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    When should we remind you about this action?
                  </p>
                </div>

                {/* Reminder Strategy */}
                <div className="space-y-2">
                  <Label htmlFor="reminderStrategy">Reminder Strategy</Label>
                  <Select
                    id="reminderStrategy"
                    value={reminderStrategy}
                    onChange={(e) => {
                      const strategy = e.target.value as ReminderStrategy;
                      setReminderStrategy(strategy);
                      // Update escalation strategy to match
                      if (strategy === 'gentle') {
                        setEscalationStrategy('single_daily');
                      } else if (strategy === 'standard') {
                        setEscalationStrategy('multiple_daily');
                      } else {
                        setEscalationStrategy('increasing_urgency');
                      }
                    }}
                    disabled={isSaving}
                  >
                    {reminderStrategies.map(strategy => (
                      <option key={strategy.value} value={strategy.value}>
                        {strategy.label}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {reminderStrategies.find(s => s.value === reminderStrategy)?.description}
                  </p>
                </div>

                {/* Notifications enabled */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                    disabled={isSaving}
                  />
                  <Label htmlFor="notificationsEnabled" className="cursor-pointer">
                    Enable notifications for this action
                  </Label>
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions (optional)</Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Step-by-step instructions for completing this action..."
                    rows={4}
                    disabled={isSaving}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Action'}
                  </Button>
                  <Link to={`/components/${componentId}`}>
                    <Button type="button" variant="outline" disabled={isSaving}>
                      Cancel
                    </Button>
                  </Link>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isSaving}
                      className="ml-auto"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Container>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onClose={() => setShowDeleteDialog(false)}>
          <DialogHeader>
            <DialogTitle>Delete Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{actionType}"? This will also delete all history for this action. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {showToast && (
        <CompletionToast message={toastMessage} onDismiss={() => setShowToast(false)} />
      )}
    </div>
  );
}
