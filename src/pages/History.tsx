import { useEffect, lazy, Suspense, memo } from 'react';
import { Header, Container, Navigation } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { HistoryTimeline } from '@/components/HistoryTimeline';
import { useAppStore, useCurrentStreak, useCompliancePercentage } from '@/lib/store';

// Lazy load charts to reduce initial bundle size (~350KB recharts)
const AnalyticsCharts = lazy(() => import('@/components/AnalyticsCharts'));
import { useHistoryFilters, type HistoryFilters } from '@/hooks/useHistoryFilters';
import type { Component } from '@/lib/db';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components' },
  { label: 'History', href: '/history', active: true },
  { label: 'Settings', href: '/settings' },
];

// Memoized to prevent re-renders from parent state changes (rerender-memo pattern)
const StatsCards = memo(function StatsCards() {
  const streak = useCurrentStreak();
  const compliance = useCompliancePercentage(30);
  const logs = useAppStore((state) => state.maintenanceLogs);

  // Calculate stats
  const totalCompleted = logs.length;
  const overdueCount = logs.filter((l) => l.was_overdue).length;
  const onTimeRate = totalCompleted > 0 ? Math.round(((totalCompleted - overdueCount) / totalCompleted) * 100) : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">{streak}</div>
          <div className="text-sm text-muted-foreground">Day Streak</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">{compliance}%</div>
          <div className="text-sm text-muted-foreground">30-Day Compliance</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">{totalCompleted}</div>
          <div className="text-sm text-muted-foreground">Total Completed</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">{onTimeRate}%</div>
          <div className="text-sm text-muted-foreground">On-Time Rate</div>
        </CardContent>
      </Card>
    </div>
  );
});

function FilterBar({
  filters,
  setFilter,
  resetFilters,
  components,
  uniqueActionTypes,
}: {
  filters: HistoryFilters;
  setFilter: <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => void;
  resetFilters: () => void;
  components: Component[];
  uniqueActionTypes: string[];
}) {
  const hasActiveFilters =
    filters.componentId !== null ||
    filters.actionType !== null ||
    filters.dateRange !== '30d' ||
    filters.overdueOnly;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Date Range */}
          <Select
            value={filters.dateRange}
            onChange={(e) => setFilter('dateRange', e.target.value as HistoryFilters['dateRange'])}
            className="w-[140px]"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </Select>

          {/* Component Filter */}
          <Select
            value={filters.componentId || 'all'}
            onChange={(e) => setFilter('componentId', e.target.value === 'all' ? null : e.target.value)}
            className="w-[160px]"
          >
            <option value="all">All components</option>
            {components.map((component) => (
              <option key={component.id} value={component.id!}>
                {component.name}
              </option>
            ))}
          </Select>

          {/* Action Type Filter */}
          <Select
            value={filters.actionType || 'all'}
            onChange={(e) => setFilter('actionType', e.target.value === 'all' ? null : e.target.value)}
            className="w-[150px]"
          >
            <option value="all">All actions</option>
            {uniqueActionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>

          {/* Overdue Only Toggle */}
          <Button
            variant={filters.overdueOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('overdueOnly', !filters.overdueOnly)}
          >
            {filters.overdueOnly ? 'Late only' : 'Show late only'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function History() {
  const { isLoading, isInitialized, loadData, maintenanceLogs, maintenanceActions, components } =
    useAppStore();

  const { filters, setFilter, resetFilters, filteredLogs, uniqueActionTypes } = useHistoryFilters(
    maintenanceLogs,
    maintenanceActions,
    components
  );

  useEffect(() => {
    if (!isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="History" description="View your maintenance history" />
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

  return (
    <div className="min-h-screen bg-background">
      <Header title="History" description="View your maintenance history and analytics" />
      <Navigation items={navItems} />

      <main>
        <Container>
          <div className="space-y-6">
            {/* Stats Overview */}
            <StatsCards />

            {/* Charts - lazy loaded to reduce initial bundle */}
            <Suspense fallback={
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-[280px]" />
                <Skeleton className="h-[280px]" />
                <Skeleton className="h-[280px]" />
                <Skeleton className="h-[280px]" />
              </div>
            }>
              <AnalyticsCharts
                logs={filteredLogs}
                actions={maintenanceActions}
                components={components}
                dateRange={filters.dateRange}
              />
            </Suspense>

            {/* Filters */}
            <FilterBar
              filters={filters}
              setFilter={setFilter}
              resetFilters={resetFilters}
              components={components}
              uniqueActionTypes={uniqueActionTypes}
            />

            {/* Timeline */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Activity Timeline
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredLogs.length} entries)
                </span>
              </h2>
              <HistoryTimeline
                logs={filteredLogs}
                actions={maintenanceActions}
                components={components}
              />
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
