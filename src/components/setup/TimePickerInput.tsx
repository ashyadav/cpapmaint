import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TimePickerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string; // HH:MM format
  onChange: (value: string) => void;
}

export const TimePickerInput = forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <input
        ref={ref}
        type="time"
        value={value}
        onChange={handleChange}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

TimePickerInput.displayName = 'TimePickerInput';
