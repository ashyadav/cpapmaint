import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header, Container, Navigation } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MaintenanceActionCard } from '@/components/MaintenanceActionCard';
import { CompletionModal } from '@/components/CompletionModal';
import { CompletionToast } from '@/components/CompletionToast';
import { useAppStore, useComponentActions, useComponentLogs } from '@/lib/store';
import { dbOperations } from '@/lib/db-operations';
import { completeMaintenanceAction, skipMaintenanceAction, snoozeMaintenanceAction } from '@/lib/scheduler';
import { getCategoryDisplayName } from '@/lib/component-templates';
import { getDueStatus, formatShortDate, formatRelativeTime } from '@/lib/date-helpers';
import type { Component, MaintenanceAction, MaintenanceLog } from '@/lib/db';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components' },
  { label: 'Settings', href: '/settings' },
];

function ActionHistoryItem({ log, actions }: { log: MaintenanceLog; actions: MaintenanceAction[] }) {
  const action = actions.find(a => a.id === log.action_id);

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${log.was_overdue ? 'bg-yellow-500' : 'bg-green-500'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{action?.action_type || 'Unknown Action'}</span>
          {log.was_overdue && (
            <Badge variant="secondary" className="text-xs">Completed late</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatShortDate(log.completed_at)} ({formatRelativeTime(log.completed_at)})
        </p>
        {log.notes && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{log.notes}</p>
        )}
      </div>
    </div>
  );
}

export function ComponentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading, isInitialized, loadData, components, refreshComponents, refreshMaintenanceActions, refreshMaintenanceLogs } = useAppStore();
  const actions = useComponentActions(id || '');
  const logs = useComponentLogs(id || '');

  const [component, setComponent] = useState<Component | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  // Completion modal state
  const [selectedAction, setSelectedAction] = useState<MaintenanceAction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  useEffect(() => {
    if (isInitialized && id) {
      const found = components.find(c => c.id === id);
      setComponent(found || null);
    }
  }, [isInitialized, components, id]);

  // Handle action selection for completion modal
  const handleActionSelect = (action: MaintenanceAction, _component: Component) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  // Handle completing an action
  const handleComplete = async (actionId: string, notes?: string) => {
    setProcessingActionId(actionId);
    try {
      await completeMaintenanceAction(actionId, new Date(), notes);
      await refreshMaintenanceActions();
      await refreshMaintenanceLogs();
      setToastMessage('Task completed! Great job!');
      setShowToast(true);
    } catch (error) {
      console.error('Error completing action:', error);
      setToastMessage('Failed to complete task. Please try again.');
      setShowToast(true);
    } finally {
      setProcessingActionId(null);
    }
  };

  // Handle skipping an action
  const handleSkip = async (actionId: string) => {
    setProcessingActionId(actionId);
    try {
      await skipMaintenanceAction(actionId);
      await refreshMaintenanceActions();
      setToastMessage('Task skipped. We\'ll remind you at the next scheduled time.');
      setShowToast(true);
    } catch (error) {
      console.error('Error skipping action:', error);
      setToastMessage('Failed to skip task. Please try again.');
      setShowToast(true);
    } finally {
      setProcessingActionId(null);
    }
  };

  // Handle snoozing an action
  const handleSnooze = async (actionId: string, hours: number) => {
    setProcessingActionId(actionId);
    try {
      await snoozeMaintenanceAction(actionId, hours);
      await refreshMaintenanceActions();
      const timeLabel = hours === 1 ? '1 hour' : hours === 24 ? 'tomorrow' : `${hours} hours`;
      setToastMessage(`Snoozed! We'll remind you in ${timeLabel}.`);
      setShowToast(true);
    } catch (error) {
      console.error('Error snoozing action:', error);
      setToastMessage('Failed to snooze task. Please try again.');
      setShowToast(true);
    } finally {
      setProcessingActionId(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await dbOperations.components.delete(id);
      await refreshComponents();
      await refreshMaintenanceActions();
      await refreshMaintenanceLogs();
      navigate('/components');
    } catch (error) {
      console.error('Error deleting component:', error);
      setToastMessage('Failed to delete component. Please try again.');
      setShowToast(true);
      setIsDeleting(false);
    }
  };

  // Handle toggle active
  const handleToggleActive = async () => {
    if (!id) return;
    setIsTogglingActive(true);
    try {
      await dbOperations.components.toggleActive(id);
      await refreshComponents();
      setToastMessage(component?.is_active ? 'Component deactivated.' : 'Component activated.');
      setShowToast(true);
    } catch (error) {
      console.error('Error toggling active:', error);
      setToastMessage('Failed to update component. Please try again.');
      setShowToast(true);
    } finally {
      setIsTogglingActive(false);
    }
  };

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Component Details" />
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

  // Not found state
  if (!component) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Component Not Found" />
        <Navigation items={navItems} />
        <main>
          <Container>
            <EmptyState
              title="Component not found"
              description="The component you're looking for doesn't exist or has been deleted."
              action={
                <Link to="/components">
                  <Button>Back to Components</Button>
                </Link>
              }
            />
          </Container>
        </main>
      </div>
    );
  }

  // Sort actions by due status
  const sortedActions = [...actions].sort((a, b) => {
    const statusA = a.next_due ? getDueStatus(a.next_due) : 'ok';
    const statusB = b.next_due ? getDueStatus(b.next_due) : 'ok';
    const statusOrder = { overdue: 0, due: 1, ok: 2 };
    return statusOrder[statusA] - statusOrder[statusB];
  });

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={component.name}
        description={getCategoryDisplayName(component.category)}
      />
      <Navigation items={navItems} />

      <main>
        <Container>
          {/* Status and actions bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {component.is_active ? (
                <Badge variant="ok">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
              {component.tracking_mode === 'usage' && (
                <Badge variant="outline">Usage: {component.usage_count} nights</Badge>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
                disabled={isTogglingActive}
              >
                {component.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Link to={`/components/${id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Component notes */}
          {component.notes && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{component.notes}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Maintenance Actions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Maintenance Actions</h2>
                <Link to={`/components/${id}/actions/new`}>
                  <Button variant="outline" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Action
                  </Button>
                </Link>
              </div>

              {sortedActions.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">
                      No maintenance actions configured.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sortedActions.map(action => (
                    <MaintenanceActionCard
                      key={action.id}
                      action={action}
                      component={component}
                      onActionSelect={handleActionSelect}
                      isProcessing={processingActionId === action.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* History */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent History</h2>
              <Card>
                {logs.length === 0 ? (
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">
                      No maintenance history yet.
                    </p>
                  </CardContent>
                ) : (
                  <CardContent className="p-4">
                    <div className="max-h-96 overflow-y-auto">
                      {logs.slice(0, 10).map(log => (
                        <ActionHistoryItem key={log.id} log={log} actions={actions} />
                      ))}
                    </div>
                    {logs.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center mt-4">
                        Showing 10 of {logs.length} entries
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </Container>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onClose={() => setShowDeleteDialog(false)}>
          <DialogHeader>
            <DialogTitle>Delete Component</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{component.name}"? This will also delete all maintenance actions and history for this component. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion modal */}
      {selectedAction && component && (
        <CompletionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          action={selectedAction}
          component={component}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onSnooze={handleSnooze}
        />
      )}

      {/* Toast */}
      {showToast && (
        <CompletionToast message={toastMessage} onDismiss={() => setShowToast(false)} />
      )}
    </div>
  );
}
