import { useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Label } from '@/components/ui';
import { TimePickerInput } from '@/components/setup';
import { useSetupWizard } from '@/hooks/useSetupWizard';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export function NotificationsStep() {
  const navigate = useNavigate();
  const {
    notificationTime,
    setNotificationTime,
    setNotificationPermission,
    selectedTemplates,
  } = useSetupWizard();

  const {
    permission,
    isSupported,
    isGranted,
    isDenied,
    isDefault,
    requestPermission,
  } = useNotificationPermission();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
  };

  const handleBack = () => {
    navigate('/setup/configure');
  };

  const handleNext = () => {
    // Update wizard state with current permission
    setNotificationPermission(permission);
    navigate('/setup/complete');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Notification Preferences</h2>
        <p className="mt-2 text-muted-foreground">
          Get reminded when maintenance is due
        </p>
      </div>

      {/* Default Notification Time */}
      <Card>
        <CardHeader>
          <CardTitle>Default Reminder Time</CardTitle>
          <CardDescription>
            Set your preferred time for daily maintenance reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-time">What time do you typically wake up?</Label>
            <TimePickerInput
              id="notification-time"
              value={notificationTime}
              onChange={setNotificationTime}
            />
            <p className="text-xs text-muted-foreground">
              This will be the default time for daily reminders. You can customize individual
              reminders for each component.
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> You've configured{' '}
              {selectedTemplates.length} component{selectedTemplates.length !== 1 && 's'} with
              custom notification times in the previous step.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Permission */}
      <Card>
        <CardHeader>
          <CardTitle>Browser Notifications</CardTitle>
          <CardDescription>
            Enable notifications to get reminded even when the app is closed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported && (
            <div className="rounded-lg bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                <strong>Notifications not supported</strong>
                <br />
                Your browser doesn't support notifications. You can still use the app and check
                for reminders manually.
              </p>
            </div>
          )}

          {isSupported && (
            <>
              {/* Permission Status */}
              {isDefault && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <svg
                          className="h-6 w-6 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          Enable notifications to stay on track
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          You'll receive timely reminders for cleaning and replacement tasks, even
                          when the app is closed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleRequestPermission} className="w-full">
                    Enable Notifications
                  </Button>
                </div>
              )}

              {isGranted && (
                <div className="rounded-lg bg-primary/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Notifications enabled</p>
                      <p className="text-sm text-muted-foreground">
                        You'll receive reminders for maintenance tasks
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isDenied && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-foreground/10">
                      <svg
                        className="h-5 w-5 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Notifications blocked</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Notification permission was denied. You can still use the app and check for
                        reminders when you open it.
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        To enable notifications later, update your browser settings for this site.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Continue without notifications note */}
          {isDefault && (
            <p className="text-center text-xs text-muted-foreground">
              You can continue without notifications and enable them later in settings
            </p>
          )}
        </CardContent>
      </Card>

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <Button onClick={handleNext}>
          Complete Setup
          <svg
            className="ml-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
