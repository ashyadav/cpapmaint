import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Spinner } from '@/components/ui';
import { useSetupWizard } from '@/hooks/useSetupWizard';
import { completeSetup, type SetupResult } from '@/lib/onboarding';

export function CompleteStep() {
  const navigate = useNavigate();
  const wizardState = useSetupWizard();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<SetupResult | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Run setup completion on mount
  useEffect(() => {
    async function runSetup() {
      try {
        const setupResult = await completeSetup(wizardState);
        setResult(setupResult);

        if (setupResult.success) {
          setStatus('success');
          // Clear wizard state after successful setup
          wizardState.clearStorage();
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Setup failed:', error);
        setStatus('error');
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          componentsCreated: 0,
          actionsCreated: 0,
        });
      }
    }

    runSetup();
  }, []); // Run only once on mount

  // Auto-redirect countdown on success
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/');
    }
  }, [status, countdown, navigate]);

  const handleRetry = async () => {
    setStatus('loading');
    setCountdown(3);

    try {
      const setupResult = await completeSetup(wizardState);
      setResult(setupResult);

      if (setupResult.success) {
        setStatus('success');
        wizardState.clearStorage();
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Setup retry failed:', error);
      setStatus('error');
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        componentsCreated: 0,
        actionsCreated: 0,
      });
    }
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Setting up your tracker...</h2>
            <p className="mt-2 text-muted-foreground">
              Creating components and maintenance schedules
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-8 w-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Setup Failed</h2>
          <p className="mt-2 text-muted-foreground">
            There was an error setting up your tracker
          </p>
        </div>

        {result?.error && (
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg bg-destructive/10 p-4">
                <p className="text-sm text-destructive">
                  <strong>Error:</strong> {result.error}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/setup/notifications')}>
            Go Back
          </Button>
          <Button onClick={handleRetry}>Retry Setup</Button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* Success Icon with Animation */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-in zoom-in duration-300">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-foreground">You're all set!</h2>
        <p className="mt-2 text-muted-foreground">
          Your CPAP maintenance tracker is ready to use
        </p>
      </div>

      {/* Summary Card */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-sm text-muted-foreground">Components added</span>
                <span className="text-lg font-semibold text-foreground">
                  {result.componentsCreated}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-sm text-muted-foreground">Maintenance schedules</span>
                <span className="text-lg font-semibold text-foreground">
                  {result.actionsCreated}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <span className="text-sm text-muted-foreground">Notifications</span>
                <span className="text-lg font-semibold text-foreground">
                  {wizardState.notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-redirect message */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Redirecting to dashboard in{' '}
          <span className="font-semibold text-foreground">{countdown}</span> seconds...
        </p>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button size="lg" onClick={handleGoToDashboard} className="px-8">
          Go to Dashboard
          <svg
            className="ml-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
