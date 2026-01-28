import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  exportToJSON,
  exportMaintenanceLogsToCSV,
  downloadJSON,
  downloadCSV,
} from '@/lib/export-import';

type ExportFormat = 'json' | 'csv';

export function ExportSection() {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      if (selectedFormat === 'json') {
        const data = await exportToJSON();
        downloadJSON(data);
      } else {
        const csvContent = await exportMaintenanceLogsToCSV();
        downloadCSV(csvContent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
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
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Data
        </CardTitle>
        <CardDescription>
          Backup your data or export for medical records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Export Format</label>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setSelectedFormat('json')}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                selectedFormat === 'json'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedFormat === 'json' ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {selectedFormat === 'json' && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <div className="font-medium text-sm">JSON Full Backup</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Includes all components, maintenance actions, logs, and notification settings.
                  Use for backups or transferring to another device.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('csv')}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                selectedFormat === 'csv'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selectedFormat === 'csv' ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {selectedFormat === 'csv' && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <div className="font-medium text-sm">CSV Maintenance Log</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Exports maintenance history only. Opens in spreadsheet apps.
                  Useful for medical records or compliance documentation.
                </div>
              </div>
            </button>
          </div>
        </div>

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

        {/* Export button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Exporting...
            </>
          ) : (
            <>
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
                className="mr-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export {selectedFormat === 'json' ? 'JSON Backup' : 'CSV Log'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
