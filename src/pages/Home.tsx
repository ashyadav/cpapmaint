import { useEffect, useState } from 'react';
import { Header, Container } from '@/components/layout';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { MaintenanceActionCard } from '@/components/MaintenanceActionCard';
import { StreakCelebration } from '@/components/StreakCelebration';
import { CompletionToast } from '@/components/CompletionToast';
import { useAppStore, useOverdueActions, useDueTodayActions, useUpcomingActions, useCurrentStreak } from '@/lib/store';
import { completeMaintenanceAction } from '@/lib/scheduler';
import { formatRelativeTime } from '@/lib/date-helpers';
import type { MaintenanceAction, Component } from '@/lib/db';

export function Home() {
  const { isLoading, isInitialized, loadData, refreshMaintenanceActions, components } = useAppStore();
  const overdueActions = useOverdueActions();
  const dueTodayActions = useDueTodayActions();
  const upcomingActions = useUpcomingActions(7);
  const currentStreak = useCurrentStreak();

  const [completingActionId, setCompletingActionId] = useState<string | null>(null);
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

  const handleComplete = async (actionId: string) => {
    setCompletingActionId(actionId);

    try {
      // Complete the action
      await completeMaintenanceAction(actionId);

      // Refresh data from database
      await refreshMaintenanceActions();

      // Show success feedback
      setToastMessage('Task completed! Great job!');
      setShowToast(true);

      // Check if we should show streak celebration
      // Show celebration at 7, 30, 90 day milestones
      const newStreak = currentStreak; // This would be recalculated
      if (newStreak === 7 || newStreak === 30 || newStreak === 90) {
        setCelebrationStreak(newStreak);
        setTimeout(() => setShowStreakCelebration(true), 500);
      }
    } catch (error) {
      console.error('Error completing action:', error);
      setToastMessage('Failed to complete task. Please try again.');
      setShowToast(true);
    } finally {
      setCompletingActionId(null);
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

      <main>
        <Container>
          {!hasActionsNeedingAttention ? (
            // Empty state - All caught up!
            <EmptyState
              title="All caught up!"
              description={
                nextUpcoming && nextUpcoming.next_due
                  ? `Great work! Everything is up to date. Next maintenance: ${getComponentById(nextUpcoming.component_id)?.name} - ${nextUpcoming.action_type} ${formatRelativeTime(nextUpcoming.next_due)}.`
                  : 'Great work! Everything is up to date. No upcoming maintenance scheduled.'
              }
            />
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
                          onComplete={handleComplete}
                          isCompleting={completingActionId === action.id}
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
                          onComplete={handleComplete}
                          isCompleting={completingActionId === action.id}
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
