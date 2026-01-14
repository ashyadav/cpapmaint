import { MaintenanceAction, Component } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { getDueStatus, formatRelativeTime, getDaysOverdue } from '@/lib/date-helpers';

interface MaintenanceActionCardProps {
  action: MaintenanceAction;
  component: Component;
  onActionSelect: (action: MaintenanceAction, component: Component) => void;
  isProcessing?: boolean;
}

export function MaintenanceActionCard({
  action,
  component,
  onActionSelect,
  isProcessing = false,
}: MaintenanceActionCardProps) {
  const dueStatus = action.next_due ? getDueStatus(action.next_due) : 'ok';
  const daysOverdue = action.next_due && dueStatus === 'overdue' ? getDaysOverdue(action.next_due as Date) : 0;

  const statusColors = {
    overdue: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
    due: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900',
    ok: 'bg-background border-border',
  };

  const handleClick = () => {
    if (!isProcessing) {
      onActionSelect(action, component);
    }
  };

  return (
    <Card className={`transition-all ${statusColors[dueStatus]}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Status and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusIndicator status={dueStatus} showDot />
              <span className="text-xs text-muted-foreground truncate">
                {component?.name || 'Unknown Component'}
              </span>
            </div>

            <h3 className="font-semibold text-base mb-1 truncate">
              {action.action_type}
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              {dueStatus === 'overdue' && (
                <Badge variant="overdue" className="text-xs">
                  {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                </Badge>
              )}
              {dueStatus === 'due' && (
                <Badge variant="due" className="text-xs">
                  Due today
                </Badge>
              )}
              {action.next_due && (
                <span className="text-xs text-muted-foreground">
                  {dueStatus === 'overdue'
                    ? `Was due ${formatRelativeTime(action.next_due)}`
                    : formatRelativeTime(action.next_due)
                  }
                </span>
              )}
            </div>

            {action.instructions && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {action.instructions}
              </p>
            )}
          </div>

          {/* Right side - Action button */}
          <div className="flex-shrink-0">
            <Button
              onClick={handleClick}
              disabled={isProcessing}
              size="lg"
              className="whitespace-nowrap"
            >
              {isProcessing ? 'Processing...' : 'Mark Done'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
