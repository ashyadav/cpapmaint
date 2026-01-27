import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { Button } from '@/components/ui/button';

export function UpdateNotification() {
  const { needRefresh, offlineReady, updateServiceWorker, dismissUpdate } = usePWAUpdate();

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="bg-card border shadow-lg rounded-lg p-4">
        {offlineReady && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Ready for offline use</p>
              <p className="text-xs text-muted-foreground mt-1">
                App has been cached and will work without internet.
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={dismissUpdate}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          </div>
        )}

        {needRefresh && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Update available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  A new version is available. Refresh to update.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={dismissUpdate}>
                Later
              </Button>
              <Button size="sm" onClick={updateServiceWorker}>
                Refresh
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
