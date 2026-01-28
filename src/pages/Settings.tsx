import { useEffect, useState } from 'react';
import { Header, Container, Navigation } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ExportSection } from '@/components/ExportSection';
import { ImportSection } from '@/components/ImportSection';
import { useAppStore } from '@/lib/store';
import {
  isNotificationSupported,
  getNotificationPermission,
  areNotificationsAllowed,
  requestNotificationPermission,
  showNotification,
} from '@/lib/notifications';
import { startNotificationScheduler, stopNotificationScheduler, getNotificationScheduler } from '@/lib/notification-scheduler';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components' },
  { label: 'History', href: '/history' },
  { label: 'Settings', href: '/settings', active: true },
];

// Notification permission status component
function NotificationPermissionStatus() {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleTestNotification = () => {
    showNotification({
      title: 'Test Notification',
      body: 'Notifications are working correctly!',
      tag: 'test-notification',
    });
  };

  if (!isNotificationSupported()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
          <CardDescription>
            Get reminders when maintenance is due
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 dark:text-yellow-400 flex-shrink-0">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Notifications not supported
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your browser doesn't support notifications. Try using a different browser or installing the app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notifications</CardTitle>
        <CardDescription>
          Get reminders when maintenance is due
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Permission Status</span>
            {permission === 'granted' && (
              <Badge variant="ok">Enabled</Badge>
            )}
            {permission === 'denied' && (
              <Badge variant="overdue">Blocked</Badge>
            )}
            {permission === 'default' && (
              <Badge variant="secondary">Not Set</Badge>
            )}
          </div>
        </div>

        {/* Action based on permission state */}
        {permission === 'default' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enable notifications to receive reminders when maintenance tasks are due.
              We'll only notify you when something needs your attention.
            </p>
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Requesting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                  </svg>
                  Enable Notifications
                </>
              )}
            </Button>
          </div>
        )}

        {permission === 'granted' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Notifications are enabled. You'll receive reminders when maintenance tasks are due or overdue.
            </p>
            <Button variant="outline" onClick={handleTestNotification}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
              Send Test Notification
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  Notifications are blocked
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  You've blocked notifications for this app. To enable them:
                </p>
                <ol className="text-sm text-red-700 dark:text-red-300 mt-2 list-decimal list-inside space-y-1">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Find "Notifications" in the permissions</li>
                  <li>Change it from "Block" to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Notification scheduler status component
function NotificationSchedulerStatus() {
  const [isSchedulerActive, setIsSchedulerActive] = useState(false);

  useEffect(() => {
    // Check if scheduler is running
    const scheduler = getNotificationScheduler();
    setIsSchedulerActive(scheduler.isActive());
  }, []);

  const handleToggleScheduler = () => {
    if (isSchedulerActive) {
      stopNotificationScheduler();
      setIsSchedulerActive(false);
    } else {
      startNotificationScheduler();
      setIsSchedulerActive(true);
    }
  };

  if (!areNotificationsAllowed()) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Background Checking</CardTitle>
        <CardDescription>
          Automatically check for due maintenance tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Automatic Notifications</p>
            <p className="text-xs text-muted-foreground">
              Check for due items every 15 minutes
            </p>
          </div>
          <Button
            variant={isSchedulerActive ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleScheduler}
          >
            {isSchedulerActive ? 'Active' : 'Inactive'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Note: Background notifications work best when the app is open. For reliable reminders,
          keep the app open in a browser tab or install it as a PWA.
        </p>
      </CardContent>
    </Card>
  );
}

// Reminder strategy explanation
function ReminderStrategiesInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reminder Strategies</CardTitle>
        <CardDescription>
          How notifications work for different maintenance types
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Gentle</p>
              <p className="text-xs text-muted-foreground">
                One notification per day at the scheduled time. Used for daily routine tasks like rinsing.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Standard</p>
              <p className="text-xs text-muted-foreground">
                Notifications at the scheduled time, then reminders at 4 and 8 hours if not completed.
                Used for weekly cleaning tasks.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Urgent</p>
              <p className="text-xs text-muted-foreground">
                More frequent reminders (2, 4, 8, 12 hours) with increasing urgency.
                Used for important replacements.
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2 border-t">
          You can customize the reminder strategy for each maintenance action in the component settings.
        </p>
      </CardContent>
    </Card>
  );
}

// About section
function AboutSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">About</CardTitle>
        <CardDescription>
          CPAP Maintenance Tracker
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Version</span>
          <span className="text-sm font-medium">1.0.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Data Storage</span>
          <span className="text-sm font-medium">Local (IndexedDB)</span>
        </div>
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Your data is stored locally on this device. Use the export feature to backup
          your data or transfer it to another device.
        </p>
      </CardContent>
    </Card>
  );
}

export function Settings() {
  const { isLoading, isInitialized, loadData } = useAppStore();

  useEffect(() => {
    if (!isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  const handleImportComplete = () => {
    // Reload all data after import
    loadData();
  };

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="Settings"
          description="Configure your preferences"
        />
        <Navigation items={navItems} />
        <main>
          <Container>
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
        title="Settings"
        description="Configure your preferences"
      />
      <Navigation items={navItems} />

      <main>
        <Container>
          <div className="space-y-6">
            <InstallPrompt />
            <ExportSection />
            <ImportSection onImportComplete={handleImportComplete} />
            <NotificationPermissionStatus />
            <NotificationSchedulerStatus />
            <ReminderStrategiesInfo />
            <AboutSection />
          </div>
        </Container>
      </main>
    </div>
  );
}
