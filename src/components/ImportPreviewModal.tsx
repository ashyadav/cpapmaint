import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { ExportData, ImportValidationResult, ImportMode } from '@/lib/export-import';
import { importData } from '@/lib/export-import';

interface ImportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExportData;
  validation: ImportValidationResult;
  onImportComplete: () => void;
}

export function ImportPreviewModal({
  open,
  onOpenChange,
  data,
  validation,
  onImportComplete,
}: ImportPreviewModalProps) {
  const [mode, setMode] = useState<ImportMode>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isImporting) {
      setError(null);
      onOpenChange(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);

    try {
      await importData(data, mode);
      onImportComplete();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const exportDate = data.exportedAt
    ? new Date(data.exportedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Preview
          </DialogTitle>
          <DialogDescription>
            Exported {exportDate}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Data summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Data Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 rounded bg-muted">
                <span className="text-muted-foreground">Components</span>
                <span className="font-medium">{validation.summary.components}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted">
                <span className="text-muted-foreground">Actions</span>
                <span className="font-medium">{validation.summary.maintenanceActions}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted">
                <span className="text-muted-foreground">Logs</span>
                <span className="font-medium">{validation.summary.maintenanceLogs}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted">
                <span className="text-muted-foreground">Notifications</span>
                <span className="font-medium">{validation.summary.notificationConfigs}</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Warnings</h4>
              <div className="space-y-1.5">
                {validation.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs p-2 rounded bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="text-yellow-700 dark:text-yellow-300">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import mode selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Import Mode</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setMode('merge')}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors w-full ${
                  mode === 'merge'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  mode === 'merge' ? 'border-primary' : 'border-muted-foreground'
                }`}>
                  {mode === 'merge' && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">Merge</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Keep existing data and add new items. Existing items with the same ID will be updated.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('replace')}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors w-full ${
                  mode === 'replace'
                    ? 'border-red-500 bg-red-50 dark:bg-red-950'
                    : 'border-border hover:border-red-500/50'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  mode === 'replace' ? 'border-red-500' : 'border-muted-foreground'
                }`}>
                  {mode === 'replace' && (
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm text-red-600 dark:text-red-400">Replace All</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Delete all existing data and import fresh. This cannot be undone.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Replace mode warning */}
          {mode === 'replace' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="text-xs text-red-700 dark:text-red-300">
                <strong>Warning:</strong> All current data including components, maintenance history, and settings will be permanently deleted and replaced with the imported data.
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-600 dark:text-red-400 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting}
            variant={mode === 'replace' ? 'destructive' : 'default'}
          >
            {isImporting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Importing...
              </>
            ) : (
              <>
                {mode === 'replace' ? 'Replace All Data' : 'Import Data'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
