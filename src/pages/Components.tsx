import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, Container, Navigation } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useAppStore, useComponentActions } from '@/lib/store';
import { getCategoryDisplayName } from '@/lib/component-templates';
import { getDueStatus } from '@/lib/date-helpers';
import type { Component } from '@/lib/db';

function ComponentCard({ component }: { component: Component }) {
  const actions = useComponentActions(component.id!);

  // Calculate status summary
  const overdueCount = actions.filter(a => a.next_due && getDueStatus(a.next_due) === 'overdue').length;
  const dueCount = actions.filter(a => a.next_due && getDueStatus(a.next_due) === 'due').length;

  let statusBadge = null;
  if (overdueCount > 0) {
    statusBadge = <Badge variant="overdue">{overdueCount} overdue</Badge>;
  } else if (dueCount > 0) {
    statusBadge = <Badge variant="due">{dueCount} due today</Badge>;
  } else {
    statusBadge = <Badge variant="ok">Up to date</Badge>;
  }

  return (
    <Link to={`/components/${component.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">
                  {getCategoryDisplayName(component.category)}
                </span>
                {!component.is_active && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <h3 className="font-semibold text-base mb-2 truncate">
                {component.name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {statusBadge}
                <span className="text-xs text-muted-foreground">
                  {actions.length} maintenance {actions.length === 1 ? 'action' : 'actions'}
                </span>
              </div>
              {component.notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                  {component.notes}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components', active: true },
  { label: 'History', href: '/history' },
  { label: 'Settings', href: '/settings' },
];

export function Components() {
  const { isLoading, isInitialized, loadData, components } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (!isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  // Loading state
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="Components"
          description="Manage your CPAP equipment components"
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

  // Filter components
  const filteredComponents = components.filter(c => {
    if (filter === 'active') return c.is_active;
    if (filter === 'inactive') return !c.is_active;
    return true;
  });

  const activeCount = components.filter(c => c.is_active).length;
  const inactiveCount = components.filter(c => !c.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Components"
        description="Manage your CPAP equipment components"
      />
      <Navigation items={navItems} />

      <main>
        <Container>
          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Filter buttons */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({components.length})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Active ({activeCount})
              </Button>
              <Button
                variant={filter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('inactive')}
              >
                Inactive ({inactiveCount})
              </Button>
            </div>

            {/* Add button */}
            <Link to="/components/new">
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Component
              </Button>
            </Link>
          </div>

          {/* Components list */}
          {filteredComponents.length === 0 ? (
            <EmptyState
              title={filter === 'all' ? 'No components yet' : `No ${filter} components`}
              description={
                filter === 'all'
                  ? 'Add your first CPAP component to start tracking maintenance.'
                  : `You don't have any ${filter} components.`
              }
              action={
                filter === 'all' ? (
                  <Link to="/components/new">
                    <Button>Add Your First Component</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredComponents.map(component => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
