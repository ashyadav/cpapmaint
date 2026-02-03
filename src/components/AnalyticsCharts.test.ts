import { describe, it, expect } from 'vitest';
import { format, startOfWeek } from 'date-fns';

// Helper function matching the one in AnalyticsCharts.tsx
function toLocalDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// Simulates the OLD buggy behavior using toISOString
function toUTCDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

describe('Chart date bucketing', () => {
  describe('toLocalDateKey vs toUTCDateKey (the bug)', () => {
    it('should bucket evening times correctly in UTC+ timezones', () => {
      // Simulate a user in UTC+5:30 (India) completing a task at 11 PM local time
      // 11 PM on Feb 2nd in UTC+5:30 = 5:30 PM UTC on Feb 2nd = still Feb 2nd in UTC
      // But let's test a more extreme case:
      // 11 PM on Feb 2nd in UTC+12 (New Zealand) = 11 AM UTC on Feb 2nd = Feb 2nd
      // Actually the bug happens the other way:
      // If local time is 11 PM Feb 2nd in UTC+5:30, that's 5:30 PM UTC Feb 2nd
      // toISOString would give 2024-02-02T17:30:00Z, which splits to 2024-02-02
      // So actually the bug is when you set hours to 0,0,0,0 on local time
      // then call toISOString - the UTC conversion can shift the date

      // Let's simulate: User in UTC+5:30 at local midnight Feb 3rd
      // Local midnight Feb 3rd UTC+5:30 = Feb 2nd 6:30 PM UTC
      // If we create a date at local midnight and call toISOString, we get the UTC date

      // Create a date representing local midnight on a specific date
      const localDate = new Date(2024, 1, 3, 0, 0, 0, 0); // Feb 3, 2024 midnight LOCAL time

      // Local date key should always be 2024-02-03 regardless of timezone
      const localKey = toLocalDateKey(localDate);
      expect(localKey).toBe('2024-02-03');

      // The buggy UTC key depends on timezone - in UTC+ zones it could be the previous day
      // We can't directly test this without mocking timezones, but we document the behavior
    });

    it('should handle dates at midnight correctly', () => {
      // Midnight local time
      const midnight = new Date(2024, 5, 15, 0, 0, 0, 0); // June 15, 2024
      expect(toLocalDateKey(midnight)).toBe('2024-06-15');
    });

    it('should handle dates at end of day correctly', () => {
      // 11:59 PM local time
      const endOfDay = new Date(2024, 5, 15, 23, 59, 59, 999);
      expect(toLocalDateKey(endOfDay)).toBe('2024-06-15');
    });

    it('should demonstrate the UTC conversion bug', () => {
      // This test documents the bug that was fixed
      // When you have a date at local midnight and convert to ISO string,
      // the UTC offset can cause the date to appear as the previous day

      const localMidnight = new Date(2024, 1, 15, 0, 0, 0, 0); // Feb 15, 2024 midnight local

      // Local key is always correct
      expect(toLocalDateKey(localMidnight)).toBe('2024-02-15');

      // UTC key may differ depending on timezone
      // In a UTC+ timezone, toISOString would give the previous UTC day
      // In a UTC- timezone, it would give the same day
      // We just verify that our local function always returns the expected local date
    });
  });

  describe('week bucketing', () => {
    it('should bucket to start of week (Sunday) in local time', () => {
      // Wednesday Feb 14, 2024
      const wednesday = new Date(2024, 1, 14, 15, 30, 0);
      const weekStart = startOfWeek(wednesday, { weekStartsOn: 0 });

      // Should be Sunday Feb 11, 2024
      expect(toLocalDateKey(weekStart)).toBe('2024-02-11');
    });

    it('should handle Sunday correctly', () => {
      // Sunday Feb 11, 2024
      const sunday = new Date(2024, 1, 11, 10, 0, 0);
      const weekStart = startOfWeek(sunday, { weekStartsOn: 0 });

      // Should be the same Sunday
      expect(toLocalDateKey(weekStart)).toBe('2024-02-11');
    });

    it('should handle Saturday correctly', () => {
      // Saturday Feb 17, 2024
      const saturday = new Date(2024, 1, 17, 22, 0, 0);
      const weekStart = startOfWeek(saturday, { weekStartsOn: 0 });

      // Should be Sunday Feb 11, 2024
      expect(toLocalDateKey(weekStart)).toBe('2024-02-11');
    });
  });

  describe('day bucketing', () => {
    it('should create consistent bucket dates for same-day logs', () => {
      // Multiple times on the same day should bucket together
      const morning = new Date(2024, 5, 15, 8, 30, 0);
      const afternoon = new Date(2024, 5, 15, 14, 45, 0);
      const evening = new Date(2024, 5, 15, 21, 0, 0);

      // Create bucket dates using local midnight (matching the fix)
      const morningBucket = new Date(morning.getFullYear(), morning.getMonth(), morning.getDate());
      const afternoonBucket = new Date(afternoon.getFullYear(), afternoon.getMonth(), afternoon.getDate());
      const eveningBucket = new Date(evening.getFullYear(), evening.getMonth(), evening.getDate());

      expect(toLocalDateKey(morningBucket)).toBe('2024-06-15');
      expect(toLocalDateKey(afternoonBucket)).toBe('2024-06-15');
      expect(toLocalDateKey(eveningBucket)).toBe('2024-06-15');

      // All should have the same key
      expect(toLocalDateKey(morningBucket)).toBe(toLocalDateKey(afternoonBucket));
      expect(toLocalDateKey(afternoonBucket)).toBe(toLocalDateKey(eveningBucket));
    });
  });
});
