/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-23T02:28:38
 * Last Updated: 2025-12-23T02:28:38
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

export type CalendarMode = 'single' | 'multiple' | 'range';
export type CalendarValue = Date | Date[] | null;

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isRangeStart?: boolean;
  isRangeEnd?: boolean;
  isInRange?: boolean;
  id?: string;
}

export interface CalendarDayConfig {
  year: number;
  month: number;
  mode: CalendarMode;
  selectedDates: Date[];
  minDate: Date | null;
  maxDate: Date | null;
  disabled: boolean;
}

export { type ZardCalendarVariants } from './calendar.variants';
