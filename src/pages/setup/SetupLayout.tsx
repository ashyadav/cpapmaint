import { Outlet, useLocation } from 'react-router-dom';
import { Container } from '@/components/layout';
import { ProgressIndicator, type Step } from '@/components/setup';

// ============================================================================
// Setup Steps Configuration
// ============================================================================

const SETUP_STEPS: Step[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    shortLabel: 'Start',
  },
  {
    id: 'select',
    label: 'Select Components',
    shortLabel: 'Select',
  },
  {
    id: 'configure',
    label: 'Configure',
    shortLabel: 'Config',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    shortLabel: 'Notify',
  },
  {
    id: 'complete',
    label: 'Complete',
    shortLabel: 'Done',
  },
];

// ============================================================================
// Helper to determine current step from URL
// ============================================================================

function getCurrentStepIndex(pathname: string): number {
  const stepId = pathname.split('/').pop() || 'welcome';

  const index = SETUP_STEPS.findIndex((step) => step.id === stepId);
  return index >= 0 ? index : 0;
}

// ============================================================================
// Component
// ============================================================================

export function SetupLayout() {
  const location = useLocation();
  const currentStepIndex = getCurrentStepIndex(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <Container size="lg" className="py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              CPAP Maintenance Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Setup Wizard
            </p>
          </div>
        </Container>
      </header>

      {/* Progress Indicator */}
      <div className="border-b bg-card">
        <Container size="lg" className="py-6">
          <ProgressIndicator
            steps={SETUP_STEPS}
            currentStep={currentStepIndex}
          />
        </Container>
      </div>

      {/* Main Content */}
      <main className="py-8">
        <Container size="md">
          <Outlet />
        </Container>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/50 py-6">
        <Container size="lg">
          <p className="text-center text-xs text-muted-foreground">
            Setup takes 2-3 minutes · All data stored locally on your device
          </p>
        </Container>
      </footer>
    </div>
  );
}
