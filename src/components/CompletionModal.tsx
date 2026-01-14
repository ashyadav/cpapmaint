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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { getDueStatus, formatRelativeTime, getDaysOverdue } from '@/lib/date-helpers';
import type { MaintenanceAction, Component } from '@/lib/db';

type CompletionMode = 'quick' | 'detailed' | 'snooze';

interface CompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: MaintenanceAction;
  component: Component;
  onComplete: (actionId: string, notes?: string) => Promise<void>;
  onSkip: (actionId: string) => Promise<void>;
  onSnooze: (actionId: string, hours: number) => Promise<void>;
}

const SNOOZE_OPTIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 2, label: '2 hours' },
  { hours: 4, label: '4 hours' },
  { hours: 8, label: '8 hours' },
  { hours: 24, label: 'Tomorrow' },
];

export function CompletionModal({
  open,
  onOpenChange,
  action,
  component,
  onComplete,
  onSkip,
  onSnooze,
}: CompletionModalProps) {
  const [mode, setMode] = useState<CompletionMode>('quick');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dueStatus = action.next_due ? getDueStatus(action.next_due) : 'ok';
  const daysOverdue = action.next_due && dueStatus === 'overdue'
    ? getDaysOverdue(action.next_due)
    : 0;

  // Check if this is a replacement action (needs more detail)
  const isReplacement = action.action_type.toLowerCase().includes('replace');

  const handleClose = () => {
    if (!isSubmitting) {
      setMode('quick');
      setNotes('');
      onOpenChange(false);
    }
  };

  const handleQuickComplete = async () => {
    if (!action.id) return;
    setIsSubmitting(true);
    try {
      await onComplete(action.id);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailedComplete = async () => {
    if (!action.id) return;
    setIsSubmitting(true);
    try {
      await onComplete(action.id, notes.trim() || undefined);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!action.id) return;
    setIsSubmitting(true);
    try {
      await onSkip(action.id);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSnooze = async (hours: number) => {
    if (!action.id) return;
    setIsSubmitting(true);
    try {
      await onSnooze(action.id, hours);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render quick completion view (default)
  const renderQuickView = () => (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-2">
          <StatusIndicator status={dueStatus} showDot />
          <span className="text-sm text-muted-foreground">{component.name}</span>
        </div>
        <DialogTitle className="text-xl">{action.action_type}</DialogTitle>
        <DialogDescription>
          {dueStatus === 'overdue' && (
            <span className="text-red-600 dark:text-red-400">
              {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
            </span>
          )}
          {dueStatus === 'due' && (
            <span className="text-yellow-600 dark:text-yellow-400">
              Due today
            </span>
          )}
          {action.next_due && dueStatus !== 'overdue' && dueStatus !== 'due' && (
            <span>{formatRelativeTime(action.next_due)}</span>
          )}
        </DialogDescription>
      </DialogHeader>

      {action.instructions && (
        <div className="py-4 border-y border-border my-4">
          <p className="text-sm text-muted-foreground">{action.instructions}</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Primary action - Mark Complete */}
        <Button
          onClick={handleQuickComplete}
          disabled={isSubmitting}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isSubmitting ? 'Completing...' : 'Mark Complete'}
        </Button>

        {/* Add notes option for replacements or detailed logging */}
        <Button
          variant="outline"
          onClick={() => setMode('detailed')}
          disabled={isSubmitting}
          className="w-full"
        >
          {isReplacement ? 'Mark as Replaced + Add Notes' : 'Add Notes'}
        </Button>

        {/* Secondary actions row */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setMode('snooze')}
            disabled={isSubmitting}
            className="flex-1"
          >
            Snooze
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex-1 text-muted-foreground"
          >
            Skip This Time
          </Button>
        </div>
      </div>
    </>
  );

  // Render detailed completion view (with notes)
  const renderDetailedView = () => (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('quick')}
            className="h-8 px-2 -ml-2"
          >
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
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </Button>
        </div>
        <DialogTitle>
          {isReplacement ? 'Log Replacement' : 'Complete with Notes'}
        </DialogTitle>
        <DialogDescription>
          {component.name} - {action.action_type}
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">
            {isReplacement ? 'Observations (optional)' : 'Notes (optional)'}
          </Label>
          <Textarea
            id="notes"
            placeholder={
              isReplacement
                ? 'e.g., Noticed wear on the edges, replaced with new cushion...'
                : 'Add any notes about this maintenance task...'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            These notes will be saved to your maintenance log for future reference.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setMode('quick')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDetailedComplete}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isReplacement ? 'Log Replacement' : 'Complete'}
        </Button>
      </DialogFooter>
    </>
  );

  // Render snooze view
  const renderSnoozeView = () => (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('quick')}
            className="h-8 px-2 -ml-2"
          >
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
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </Button>
        </div>
        <DialogTitle>Snooze Reminder</DialogTitle>
        <DialogDescription>
          Remind me about {action.action_type} later
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-2">
        {SNOOZE_OPTIONS.map((option) => (
          <Button
            key={option.hours}
            variant="outline"
            onClick={() => handleSnooze(option.hours)}
            disabled={isSubmitting}
            className="w-full justify-start"
          >
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {option.label}
          </Button>
        ))}
      </div>

      <DialogFooter>
        <Button
          variant="ghost"
          onClick={() => setMode('quick')}
          disabled={isSubmitting}
          className="w-full"
        >
          Cancel
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="max-w-md mx-4">
        {mode === 'quick' && renderQuickView()}
        {mode === 'detailed' && renderDetailedView()}
        {mode === 'snooze' && renderSnoozeView()}
      </DialogContent>
    </Dialog>
  );
}
