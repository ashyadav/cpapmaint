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
import { CompletionToast } from '@/components/CompletionToast';
import { useAppStore } from '@/lib/store';
import { dbOperations } from '@/lib/db-operations';
import { initializeMaintenanceAction } from '@/lib/scheduler';
import {
  COMPONENT_TEMPLATES,
  getCategoryDescription,
  type ComponentTemplate,
} from '@/lib/component-templates';
import type { Component } from '@/lib/db';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components' },
];

type CategoryType = Component['category'];
type TrackingMode = Component['tracking_mode'];

const categories: { value: CategoryType; label: string }[] = [
  { value: 'mask_cushion', label: 'Mask Cushion/Pillows' },
  { value: 'mask_frame', label: 'Mask Frame & Headgear' },
  { value: 'tubing', label: 'Tubing/Hose' },
  { value: 'water_chamber', label: 'Water Chamber' },
  { value: 'filter', label: 'Air Filter' },
  { value: 'other', label: 'Other' },
];

const trackingModes: { value: TrackingMode; label: string; description: string }[] = [
  { value: 'calendar', label: 'Calendar-based', description: 'Schedule based on days/weeks/months' },
  { value: 'usage', label: 'Usage-based', description: 'Schedule based on nights of use' },
  { value: 'hybrid', label: 'Hybrid', description: 'Both calendar and usage tracking' },
];

export function ComponentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { isLoading, isInitialized, loadData, components, refreshComponents, refreshMaintenanceActions, refreshNotificationConfigs } = useAppStore();

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('mask_cushion');
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('calendar');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ComponentTemplate | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (!isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  // Load existing component data when editing
  useEffect(() => {
    if (isEditing && isInitialized && id) {
      const component = components.find(c => c.id === id);
      if (component) {
        setName(component.name);
        setCategory(component.category);
        setTrackingMode(component.tracking_mode);
        setNotes(component.notes || '');
        setIsActive(component.is_active);
        setUseTemplate(false); // Don't use template when editing
      }
    }
  }, [isEditing, isInitialized, components, id]);

  // Update template when category changes
  useEffect(() => {
    if (!isEditing && useTemplate) {
      const templates = COMPONENT_TEMPLATES.filter(t => t.category === category);
      if (templates.length > 0) {
        setSelectedTemplate(templates[0]);
        if (!name || COMPONENT_TEMPLATES.some(t => t.name === name)) {
          setName(templates[0].name);
        }
        setTrackingMode(templates[0].tracking_mode);
      }
    }
  }, [category, useTemplate, isEditing, name]);

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && id) {
        // Update existing component
        await dbOperations.components.update(id, {
          name: name.trim(),
          category,
          tracking_mode: trackingMode,
          notes: notes.trim() || undefined,
          is_active: isActive,
        });
        await refreshComponents();
        setToastMessage('Component updated successfully!');
        setShowToast(true);
        setTimeout(() => navigate(`/components/${id}`), 1500);
      } else {
        // Create new component
        const componentId = await dbOperations.components.create({
          name: name.trim(),
          category,
          tracking_mode: trackingMode,
          usage_count: 0,
          is_active: isActive,
          notes: notes.trim() || undefined,
        });

        // If using template, create maintenance actions
        if (useTemplate && selectedTemplate) {
          for (const actionTemplate of selectedTemplate.maintenanceActions) {
            const actionId = await dbOperations.maintenanceActions.create({
              component_id: componentId,
              action_type: actionTemplate.action_type,
              description: actionTemplate.description,
              schedule_frequency: actionTemplate.schedule_frequency,
              schedule_unit: actionTemplate.schedule_unit,
              notification_time: actionTemplate.notification_time,
              reminder_strategy: actionTemplate.reminder_strategy,
              instructions: actionTemplate.instructions,
            });

            // Create notification config
            await dbOperations.notificationConfigs.create({
              action_id: actionId,
              enabled: actionTemplate.notificationConfig.enabled,
              time: actionTemplate.notification_time,
              escalation_strategy: actionTemplate.notificationConfig.escalation_strategy,
              escalation_intervals: actionTemplate.notificationConfig.escalation_intervals,
            });

            // Initialize the action with first due date
            await initializeMaintenanceAction(actionId);
          }
        }

        await refreshComponents();
        await refreshMaintenanceActions();
        await refreshNotificationConfigs();
        setToastMessage('Component created successfully!');
        setShowToast(true);
        setTimeout(() => navigate(`/components/${componentId}`), 1500);
      }
    } catch (error) {
      console.error('Error saving component:', error);
      setToastMessage('Failed to save component. Please try again.');
      setShowToast(true);
      setIsSaving(false);
    }
  };

  // Get available templates for selected category
  const availableTemplates = COMPONENT_TEMPLATES.filter(t => t.category === category);

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header title={isEditing ? 'Edit Component' : 'Add Component'} />
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={isEditing ? 'Edit Component' : 'Add Component'}
        description={isEditing ? 'Update component details' : 'Add a new CPAP component to track'}
      />
      <Navigation items={navItems} />

      <main>
        <Container size="md">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryType)}
                    disabled={isSaving}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {getCategoryDescription(category)}
                  </p>
                </div>

                {/* Template selection (only for new components) */}
                {!isEditing && availableTemplates.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="useTemplate"
                        checked={useTemplate}
                        onChange={(e) => setUseTemplate(e.target.checked)}
                        className="h-4 w-4 rounded border-input"
                        disabled={isSaving}
                      />
                      <Label htmlFor="useTemplate" className="cursor-pointer">
                        Use recommended template
                      </Label>
                    </div>
                    {useTemplate && availableTemplates.length > 1 && (
                      <Select
                        value={selectedTemplate?.name || ''}
                        onChange={(e) => {
                          const template = availableTemplates.find(t => t.name === e.target.value);
                          if (template) {
                            setSelectedTemplate(template);
                            setName(template.name);
                            setTrackingMode(template.tracking_mode);
                          }
                        }}
                        disabled={isSaving}
                      >
                        {availableTemplates.map(t => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </Select>
                    )}
                    {useTemplate && selectedTemplate && (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium mb-2">Included maintenance actions:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {selectedTemplate.maintenanceActions.map(a => (
                            <li key={a.action_type} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {a.action_type} - Every {a.schedule_frequency} {a.schedule_unit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Mask Cushion"
                    disabled={isSaving}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Tracking Mode */}
                <div className="space-y-2">
                  <Label htmlFor="trackingMode">Tracking Mode</Label>
                  <Select
                    id="trackingMode"
                    value={trackingMode}
                    onChange={(e) => setTrackingMode(e.target.value as TrackingMode)}
                    disabled={isSaving}
                  >
                    {trackingModes.map(mode => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {trackingModes.find(m => m.value === trackingMode)?.description}
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes about this component..."
                    rows={3}
                    disabled={isSaving}
                  />
                </div>

                {/* Active toggle (only for editing) */}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                      disabled={isSaving}
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active (show in maintenance tracking)
                    </Label>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Component'}
                  </Button>
                  <Link to={isEditing ? `/components/${id}` : '/components'}>
                    <Button type="button" variant="outline" disabled={isSaving}>
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </form>
        </Container>
      </main>

      {/* Toast */}
      {showToast && (
        <CompletionToast message={toastMessage} onDismiss={() => setShowToast(false)} />
      )}
    </div>
  );
}
