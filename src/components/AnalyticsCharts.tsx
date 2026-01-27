import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MaintenanceLog, MaintenanceAction, Component } from '@/lib/db';

interface AnalyticsChartsProps {
  logs: MaintenanceLog[];
  actions: MaintenanceAction[];
  components: Component[];
  dateRange: '7d' | '30d' | '90d' | '1y' | 'all';
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

function formatDate(date: Date, range: string): string {
  if (range === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  if (range === '30d') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function CompletionRateChart({ logs, dateRange }: Pick<AnalyticsChartsProps, 'logs' | 'dateRange'>) {
  const data = useMemo(() => {
    // Group logs by day/week/month depending on range
    const grouped = new Map<string, { date: Date; count: number }>();

    const groupByInterval = dateRange === '7d' || dateRange === '30d' ? 'day' : 'week';

    for (const log of logs) {
      const date = new Date(log.completed_at);
      let key: string;

      if (groupByInterval === 'day') {
        date.setHours(0, 0, 0, 0);
        key = date.toISOString().split('T')[0];
      } else {
        // Group by week - get start of week (Sunday)
        const dayOfWeek = date.getDay();
        date.setDate(date.getDate() - dayOfWeek);
        date.setHours(0, 0, 0, 0);
        key = date.toISOString().split('T')[0];
      }

      if (!grouped.has(key)) {
        grouped.set(key, { date: new Date(date), count: 0 });
      }
      grouped.get(key)!.count++;
    }

    // Convert to array and sort by date
    return Array.from(grouped.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((item) => ({
        date: formatDate(item.date, dateRange),
        completed: item.count,
      }));
  }, [logs, dateRange]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completion Trend</CardTitle>
          <CardDescription>Tasks completed over time</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Completion Trend</CardTitle>
        <CardDescription>Tasks completed over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ fill: '#4F46E5', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ComponentBreakdownChart({
  logs,
  components,
}: Pick<AnalyticsChartsProps, 'logs' | 'components'>) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();

    for (const log of logs) {
      const count = counts.get(log.component_id) || 0;
      counts.set(log.component_id, count + 1);
    }

    return components
      .filter((c) => counts.has(c.id!))
      .map((component) => ({
        name: component.name,
        value: counts.get(component.id!) || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs, components]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">By Component</CardTitle>
          <CardDescription>Tasks completed per component</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">By Component</CardTitle>
        <CardDescription>Tasks completed per component</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ActionTypeChart({
  logs,
  actions,
}: Pick<AnalyticsChartsProps, 'logs' | 'actions'>) {
  const data = useMemo(() => {
    const actionMap = new Map(actions.map((a) => [a.id, a]));
    const counts = new Map<string, number>();

    for (const log of logs) {
      const action = actionMap.get(log.action_id);
      if (action) {
        const count = counts.get(action.action_type) || 0;
        counts.set(action.action_type, count + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [logs, actions]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">By Action Type</CardTitle>
          <CardDescription>Tasks completed by type</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">By Action Type</CardTitle>
        <CardDescription>Tasks completed by type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="type" tick={{ fontSize: 12 }} width={100} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function OnTimeVsLateChart({ logs }: Pick<AnalyticsChartsProps, 'logs'>) {
  const data = useMemo(() => {
    let onTime = 0;
    let late = 0;

    for (const log of logs) {
      if (log.was_overdue) {
        late++;
      } else {
        onTime++;
      }
    }

    return [
      { name: 'On Time', value: onTime, fill: '#10B981' },
      { name: 'Late', value: late, fill: '#F59E0B' },
    ];
  }, [logs]);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">On-Time Rate</CardTitle>
          <CardDescription>Tasks completed before due date</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  const onTimePercent = Math.round((data[0].value / total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">On-Time Rate</CardTitle>
        <CardDescription>Tasks completed before due date</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            <div className="text-3xl font-bold text-green-600">{onTimePercent}%</div>
            <div className="text-sm text-muted-foreground">on-time completion</div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>{data[0].value} on time</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>{data[1].value} late</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsCharts({ logs, actions, components, dateRange }: AnalyticsChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CompletionRateChart logs={logs} dateRange={dateRange} />
      <OnTimeVsLateChart logs={logs} />
      <ComponentBreakdownChart logs={logs} components={components} />
      <ActionTypeChart logs={logs} actions={actions} />
    </div>
  );
}
