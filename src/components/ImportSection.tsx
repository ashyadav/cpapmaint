import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ImportPreviewModal } from './ImportPreviewModal';
import {
  readImportFile,
  validateImportData,
  type ExportData,
  type ImportValidationResult,
} from '@/lib/export-import';

interface ImportSectionProps {
  onImportComplete: () => void;
}

export function ImportSection({ onImportComplete }: ImportSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ExportData | null>(null);
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    event.target.value = '';

    setIsProcessing(true);
    setError(null);

    try {
      // Read and parse the file
      const data = await readImportFile(file);

      // Validate the data
      const validationResult = await validateImportData(data);

      if (!validationResult.isValid) {
        const errorMessages = validationResult.errors.join('; ');
        throw new Error(`Invalid file: ${errorMessages}`);
      }

      // Store data and show preview modal
      setPreviewData(data as ExportData);
      setValidation(validationResult);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setPreviewData(null);
    setValidation(null);
  };

  const handleImportComplete = () => {
    handlePreviewClose();
    onImportComplete();
  };

  return (
    <>
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
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Data
          </CardTitle>
          <CardDescription>
            Restore from a backup or transfer from another device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Import a JSON backup file previously exported from this app.
            You can choose to merge with existing data or replace all data.
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Error display */}
          {error && (
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
            </div>
          )}

          {/* Select file button */}
          <Button
            variant="outline"
            onClick={handleSelectFile}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Processing...
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
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Select JSON File
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import preview modal */}
      {previewData && validation && (
        <ImportPreviewModal
          open={showPreview}
          onOpenChange={handlePreviewClose}
          data={previewData}
          validation={validation}
          onImportComplete={handleImportComplete}
        />
      )}
    </>
  );
}
