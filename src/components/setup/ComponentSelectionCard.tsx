import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ComponentTemplate } from '@/lib/component-templates';

interface ComponentSelectionCardProps {
  template: ComponentTemplate;
  selected: boolean;
  onToggle: () => void;
}

export function ComponentSelectionCard({
  template,
  selected,
  onToggle,
}: ComponentSelectionCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        selected && 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
      )}
      onClick={onToggle}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              {selected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
            <CardDescription className="text-sm">
              {template.description}
            </CardDescription>
          </div>

          {/* Checkbox */}
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded border-2 transition-colors',
              selected
                ? 'border-primary bg-primary'
                : 'border-muted-foreground/30 bg-background'
            )}
          >
            {selected && (
              <svg
                className="h-4 w-4 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Maintenance Actions Preview */}
        <div className="mt-3 flex flex-wrap gap-2">
          {template.maintenanceActions.map((action) => (
            <span
              key={action.action_type}
              className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {action.action_type}
            </span>
          ))}
        </div>
      </CardHeader>
    </Card>
  );
}
