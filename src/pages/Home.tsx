import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, Container, Navigation } from '@/components/layout';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { MaintenanceActionCard } from '@/components/MaintenanceActionCard';
import { CompletionModal } from '@/components/CompletionModal';
import { StreakCelebration } from '@/components/StreakCelebration';
import { CompletionToast } from '@/components/CompletionToast';
import { useAppStore, useOverdueActions, useDueTodayActions, useUpcomingActions, useCurrentStreak } from '@/lib/store';
import { completeMaintenanceAction, skipMaintenanceAction, snoozeMaintenanceAction } from '@/lib/scheduler';
import { formatRelativeTime } from '@/lib/date-helpers';
import { updateBadgeCount } from '@/lib/notification-scheduler';
import type { MaintenanceAction, Component } from '@/lib/db';

const navItems = [
  { label: 'Home', href: '/', active: true },
  { label: 'Components', href: '/components' },
  { label: 'Settings', href: '/settings' },
];

export function Home() {
  const { isLoading, isInitialized, loadData, refreshMaintenanceActions, components } = useAppStore();
  const overdueActions = useOverdueActions();
  const dueTodayActions = useDueTodayActions();
  const upcomingActions = useUpcomingActions(7);
  const currentStreak = useCurrentStreak();

  // Modal state
  const [selectedAction, setSelectedAction] = useState<MaintenanceAction | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  // Feedback state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);

  // Load data on mount
  useEffect(() => {
    if (!isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  // Handle opening the completion modal
  const handleActionSelect = (action: MaintenanceAction, component: Component) => {
    setSelectedAction(action);
    setSelectedComponent(component);
    setIsModalOpen(true);
  };

  // Handle completing an action
  const handleComplete = async (actionId: string, notes?: string) => {
    setProcessingActionId(actionId);

    try {
      await completeMaintenanceAction(actionId, new Date(), notes);
      await refreshMaintenanceActions();

      // Update notification badge count
      await updateBadgeCount();

      // Show success feedback
      setToastMessage('Task completed! Great job!');
      setShowToast(true);

      // Check if we should show streak celebration at milestones
      const newStreak = currentStreak;
      if (newStreak === 7 || newStreak === 30 || newStreak === 90) {
        setCelebrationStreak(newStreak);
        setTimeout(() => setShowStreakCelebration(true), 500);
      }
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

      // Update notification badge count
      await updateBadgeCount();

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

      // Update notification badge count
      await updateBadgeCount();

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

  const handleDismissToast = () => {
    setShowToast(false);
  };

  const handleDismissStreakCelebration = () => {
    setShowStreakCelebration(false);
  };

  // Get component by ID helper
  const getComponentById = (componentId: string) => {
    return components.find((c: Component) => c.id === componentId);
  };

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="CPAP Maintenance Tracker"
          description="Track your CPAP equipment maintenance"
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

  // Check if we have any actions that need attention
  const hasActionsNeedingAttention = overdueActions.length > 0 || dueTodayActions.length > 0;

  // Get next upcoming action for empty state
  const nextUpcoming = upcomingActions[0];

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="CPAP Maintenance Tracker"
        description="Track your CPAP equipment maintenance"
      />
      <Navigation items={navItems} />

      <main>
        <Container>
          {!hasActionsNeedingAttention ? (
            // Empty state - All caught up or no components
            components.length === 0 ? (
              <EmptyState
                title="Welcome to CPAP Maintenance Tracker"
                description="Get started by adding your first CPAP component. We'll help you keep track of all your maintenance tasks."
                action={
                  <Link to="/components/new">
                    <Button>Add Your First Component</Button>
                  </Link>
                }
              />
            ) : (
              <EmptyState
                title="All caught up!"
                description={
                  nextUpcoming && nextUpcoming.next_due
                    ? `Great work! Everything is up to date. Next maintenance: ${getComponentById(nextUpcoming.component_id)?.name} - ${nextUpcoming.action_type} ${formatRelativeTime(nextUpcoming.next_due)}.`
                    : 'Great work! Everything is up to date. No upcoming maintenance scheduled.'
                }
              />
            )
          ) : (
            <div className="space-y-6">
              {/* Overdue Items */}
              {overdueActions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                      Overdue ({overdueActions.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {overdueActions.map((action: MaintenanceAction) => {
                      const component = getComponentById(action.component_id);
                      if (!component) return null;

                      return (
                        <MaintenanceActionCard
                          key={action.id}
                          action={action}
                          component={component}
                          onActionSelect={handleActionSelect}
                          isProcessing={processingActionId === action.id}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Due Today Items */}
              {dueTodayActions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                      Due Today ({dueTodayActions.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {dueTodayActions.map((action: MaintenanceAction) => {
                      const component = getComponentById(action.component_id);
                      if (!component) return null;

                      return (
                        <MaintenanceActionCard
                          key={action.id}
                          action={action}
                          component={component}
                          onActionSelect={handleActionSelect}
                          isProcessing={processingActionId === action.id}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </Container>
      </main>

      {/* Completion modal */}
      {selectedAction && selectedComponent && (
        <CompletionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          action={selectedAction}
          component={selectedComponent}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onSnooze={handleSnooze}
        />
      )}

      {/* Completion toast */}
      {showToast && (
        <CompletionToast message={toastMessage} onDismiss={handleDismissToast} />
      )}

      {/* Streak celebration modal */}
      {showStreakCelebration && (
        <StreakCelebration
          streak={celebrationStreak}
          onDismiss={handleDismissStreakCelebration}
        />
      )}
    </div>
  );
}
