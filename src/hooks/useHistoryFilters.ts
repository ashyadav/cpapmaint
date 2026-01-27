import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MaintenanceLog, Component, MaintenanceAction } from '@/lib/db';

export interface HistoryFilters {
  componentId: string | null;
  actionType: string | null;
  dateRange: 'all' | '7d' | '30d' | '90d' | '1y';
  overdueOnly: boolean;
}

export interface UseHistoryFiltersResult {
  filters: HistoryFilters;
  setFilter: <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => void;
  resetFilters: () => void;
  filteredLogs: MaintenanceLog[];
  uniqueActionTypes: string[];
}

const DEFAULT_FILTERS: HistoryFilters = {
  componentId: null,
  actionType: null,
  dateRange: '30d',
  overdueOnly: false,
};

function getDateRangeStart(range: HistoryFilters['dateRange']): Date | null {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return null;
  }
}

export function useHistoryFilters(
  logs: MaintenanceLog[],
  actions: MaintenanceAction[],
  _components: Component[]
): UseHistoryFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<HistoryFilters>(() => ({
    componentId: searchParams.get('component') || null,
    actionType: searchParams.get('action') || null,
    dateRange: (searchParams.get('range') as HistoryFilters['dateRange']) || DEFAULT_FILTERS.dateRange,
    overdueOnly: searchParams.get('overdue') === 'true',
  }));

  // Sync filters to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.componentId) params.set('component', filters.componentId);
    if (filters.actionType) params.set('action', filters.actionType);
    if (filters.dateRange !== DEFAULT_FILTERS.dateRange) params.set('range', filters.dateRange);
    if (filters.overdueOnly) params.set('overdue', 'true');
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const setFilter = useCallback(<K extends keyof HistoryFilters>(
    key: K,
    value: HistoryFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Get unique action types from actions
  const uniqueActionTypes = useMemo(() => {
    const types = new Set(actions.map((a) => a.action_type));
    return Array.from(types).sort();
  }, [actions]);

  // Create action lookup map
  const actionMap = useMemo(() => {
    return new Map(actions.map((a) => [a.id, a]));
  }, [actions]);

  // Apply filters to logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by component
    if (filters.componentId) {
      result = result.filter((log) => log.component_id === filters.componentId);
    }

    // Filter by action type
    if (filters.actionType) {
      result = result.filter((log) => {
        const action = actionMap.get(log.action_id);
        return action?.action_type === filters.actionType;
      });
    }

    // Filter by date range
    const rangeStart = getDateRangeStart(filters.dateRange);
    if (rangeStart) {
      result = result.filter((log) => log.completed_at >= rangeStart);
    }

    // Filter by overdue status
    if (filters.overdueOnly) {
      result = result.filter((log) => log.was_overdue);
    }

    // Sort by date descending
    result.sort((a, b) => b.completed_at.getTime() - a.completed_at.getTime());

    return result;
  }, [logs, filters, actionMap]);

  return {
    filters,
    setFilter,
    resetFilters,
    filteredLogs,
    uniqueActionTypes,
  };
}
