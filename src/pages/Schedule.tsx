import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Container } from '@/components/layout';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Spinner,
  EmptyState,
  StatusIndicator,
} from '@/components/ui';
import type { StatusType } from '@/components/ui/status-indicator';
import { dbOperations } from '@/lib/db-operations';
import type { MaintenanceAction, Component } from '@/lib/db';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';

interface ScheduleItem {
  action: MaintenanceAction;
  component: Component;
  status: StatusType;
}

export function Schedule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      setLoading(true);

      // Get all maintenance actions
      const actions = await dbOperations.maintenanceActions.getAll();

      // Get all components
      const components = await dbOperations.components.getAll();

      // Create a map of component IDs to components for easy lookup
      const componentMap = new Map(components.map(c => [c.id!, c]));

      // Create schedule items with component info and status
      const items: ScheduleItem[] = actions
        .filter(action => action.next_due) // Only show actions with a due date
        .map(action => {
          const component = componentMap.get(action.component_id);
          if (!component) return null;

          const now = new Date();
          const dueDate = action.next_due!;

          let status: StatusType;
          if (dueDate < now) {
            status = 'overdue';
          } else if (isToday(dueDate)) {
            status = 'due';
          } else {
            status = 'ok';
          }

          return {
            action,
            component,
            status,
          };
        })
        .filter((item): item is ScheduleItem => item !== null)
        .sort((a, b) => {
          // Sort by due date (earliest first)
          return a.action.next_due!.getTime() - b.action.next_due!.getTime();
        });

      setScheduleItems(items);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDueDate(date: Date): string {
    if (isToday(date)) {
      return 'Today';
    }
    if (isTomorrow(date)) {
      return 'Tomorrow';
    }

    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    }

    if (diffDays <= 7) {
      return `In ${diffDays} days`;
    }

    return format(date, 'MMM d, yyyy');
  }

  function getStatusBadgeVariant(status: StatusType): 'overdue' | 'due' | 'ok' {
    return status;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="Maintenance Schedule"
          description="View your upcoming maintenance tasks"
        />
        <main>
          <Container size="lg">
            <div className="flex min-h-[400px] items-center justify-center">
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
        title="Maintenance Schedule"
        description="View your upcoming maintenance tasks"
      />

      <main>
        <Container size="lg">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Upcoming Maintenance</h2>
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>

          {scheduleItems.length === 0 ? (
            <EmptyState
              title="No maintenance scheduled"
              description="Complete the setup wizard to add your CPAP components and create maintenance schedules."
              action={
                <Button onClick={() => navigate('/setup/welcome')}>
                  Start Setup
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {scheduleItems.map((item) => (
                <Card key={item.action.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <StatusIndicator status={item.status} showDot />
                          <h3 className="text-lg font-semibold text-foreground">
                            {item.component.name}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status === 'overdue' ? 'Overdue' :
                             item.status === 'due' ? 'Due Today' :
                             'Upcoming'}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {item.action.description || item.action.action_type}
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Due: </span>
                            <span className="font-medium text-foreground">
                              {formatDueDate(item.action.next_due!)}
                            </span>
                          </div>

                          <div>
                            <span className="text-muted-foreground">Frequency: </span>
                            <span className="font-medium text-foreground">
                              Every {item.action.schedule_frequency} {item.action.schedule_unit}
                            </span>
                          </div>

                          {item.action.last_completed && (
                            <div>
                              <span className="text-muted-foreground">Last completed: </span>
                              <span className="font-medium text-foreground">
                                {formatDistanceToNow(item.action.last_completed, { addSuffix: true })}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="text-muted-foreground">Category: </span>
                            <span className="font-medium text-foreground">
                              {item.component.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button
                          variant={item.status === 'overdue' ? 'destructive' : 'default'}
                          size="sm"
                        >
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
