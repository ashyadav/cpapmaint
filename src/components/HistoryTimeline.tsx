import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatShortDate, formatRelativeTime } from '@/lib/date-helpers';
import type { MaintenanceLog, MaintenanceAction, Component } from '@/lib/db';

interface HistoryTimelineProps {
  logs: MaintenanceLog[];
  actions: MaintenanceAction[];
  components: Component[];
  showComponent?: boolean;
}

export function HistoryTimeline({
  logs,
  actions,
  components,
  showComponent = true,
}: HistoryTimelineProps) {
  // Create lookup maps
  const actionMap = new Map(actions.map((a) => [a.id, a]));
  const componentMap = new Map(components.map((c) => [c.id, c]));

  // Group logs by date
  const groupedLogs = logs.reduce((groups, log) => {
    const dateKey = log.completed_at.toISOString().split('T')[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(log);
    return groups;
  }, new Map<string, MaintenanceLog[]>());

  // Sort dates descending
  const sortedDates = Array.from(groupedLogs.keys()).sort((a, b) => b.localeCompare(a));

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No maintenance history found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const dayLogs = groupedLogs.get(dateKey)!;
        const date = new Date(dateKey);

        return (
          <div key={dateKey}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm font-medium text-muted-foreground">
                {formatShortDate(date)}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Logs for this date */}
            <div className="space-y-2">
              {dayLogs.map((log) => {
                const action = actionMap.get(log.action_id);
                const component = componentMap.get(log.component_id);

                return (
                  <Card key={log.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Status indicator */}
                        <div
                          className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                            log.was_overdue ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {action?.action_type || 'Unknown Action'}
                            </span>
                            {log.was_overdue && (
                              <Badge variant="secondary" className="text-xs">
                                Completed late
                              </Badge>
                            )}
                          </div>

                          {showComponent && component && (
                            <Link
                              to={`/components/${component.id}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {component.name}
                            </Link>
                          )}

                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(log.completed_at)}
                          </p>

                          {log.notes && (
                            <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
