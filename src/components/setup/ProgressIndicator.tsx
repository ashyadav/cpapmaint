import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface Step {
  id: string;
  label: string;
  shortLabel?: string; // For mobile
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <li key={step.id} className="relative flex-1">
              {/* Connector line (not shown for last step) */}
              {index !== steps.length - 1 && (
                <div
                  className="absolute left-1/2 top-4 h-0.5 w-full"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      'h-full transition-colors',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}

              {/* Step indicator */}
              <div className="relative flex flex-col items-center">
                {/* Circle */}
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary',
                    isFuture && 'border-muted bg-background text-muted-foreground'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    // Checkmark for completed steps
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    // Step number
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-foreground',
                    isFuture && 'text-muted-foreground',
                    // Hide full label on mobile, show short label
                    'hidden md:block'
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors',
                    isCurrent && 'text-primary',
                    isCompleted && 'text-foreground',
                    isFuture && 'text-muted-foreground',
                    // Show short label on mobile
                    'block md:hidden'
                  )}
                >
                  {step.shortLabel || step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
