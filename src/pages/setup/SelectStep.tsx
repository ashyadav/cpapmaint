import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ComponentSelectionCard } from '@/components/setup';
import { COMPONENT_TEMPLATES } from '@/lib/component-templates';
import { useSetupWizard } from '@/hooks/useSetupWizard';

export function SelectStep() {
  const navigate = useNavigate();
  const {
    selectedTemplates,
    toggleTemplate,
    selectAllTemplates,
    deselectAllTemplates,
    canProceedFromSelect,
  } = useSetupWizard();

  const [error, setError] = useState<string>('');

  const handleNext = () => {
    if (!canProceedFromSelect()) {
      setError('Please select at least one component to continue');
      return;
    }
    setError('');
    navigate('/setup/configure');
  };

  const handleBack = () => {
    navigate('/setup/welcome');
  };

  const handleSelectAll = () => {
    selectAllTemplates(COMPONENT_TEMPLATES.map((t) => t.name));
    setError('');
  };

  const handleDeselectAll = () => {
    deselectAllTemplates();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Select Your CPAP Components
        </h2>
        <p className="mt-2 text-muted-foreground">
          Choose the equipment you use. We'll help you track maintenance for each one.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          {selectedTemplates.length} of {COMPONENT_TEMPLATES.length} selected
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectedTemplates.length === COMPONENT_TEMPLATES.length}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            disabled={selectedTemplates.length === 0}
          >
            Deselect All
          </Button>
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {COMPONENT_TEMPLATES.map((template) => (
          <ComponentSelectionCard
            key={template.name}
            template={template}
            selected={selectedTemplates.includes(template.name)}
            onToggle={() => {
              toggleTemplate(template.name);
              setError(''); // Clear error when user makes a selection
            }}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </Button>
        <Button onClick={handleNext}>
          Next
          <svg
            className="ml-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
