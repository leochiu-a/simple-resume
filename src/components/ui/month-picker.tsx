import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  add,
  eachMonthOfInterval,
  endOfYear,
  format,
  isFuture,
  isSameMonth,
  parse,
  startOfToday,
} from "date-fns";

import { Button, buttonVariants } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/chevron-left";
import { ChevronRightIcon } from "@/components/icons/chevron-right";
import { CalendarDaysIcon } from "@/components/icons/calendar-days";
import { useIconHover } from "@/components/icons/use-icon-hover";

/**
 * Selection is compared by month, not by instant.
 *
 * The grid's own dates are local month starts, but the incoming value is whatever
 * was stored — and `isEqual` demands the same millisecond, so a value that named the
 * right month but not local midnight matched nothing and the picker opened with
 * nothing highlighted. A month picker's question is which month, so that is the
 * comparison; it also means the value can be normalised at the storage layer without
 * this component caring how.
 */
const isSelected = (month: Date, selected: Date) => isSameMonth(month, selected);

/** The width of the wrap, and so the distance Up and Down travel. */
const MONTHS_PER_ROW = 3;

function monthsOfYear(firstDay: Date) {
  return eachMonthOfInterval({ start: firstDay, end: endOfYear(firstDay) });
}

/**
 * Where the listbox's single tab stop sits.
 *
 * The selected month when it is on this page and reachable, otherwise the first
 * month that is. The fallback is not politeness: a disabled button cannot take
 * focus, so parking the only tab stop on one makes the whole listbox unreachable
 * — which is the failure this component already had, in a different form.
 */
function initialActiveIndex(months: Date[], selected: Date) {
  const selectedIndex = months.findIndex((month) => isSelected(month, selected));
  if (selectedIndex !== -1 && !isFuture(months[selectedIndex])) return selectedIndex;

  const firstOpen = months.findIndex((month) => !isFuture(month));
  return firstOpen === -1 ? 0 : firstOpen;
}

export interface MonthCalendarProps {
  currentMonth?: Date;
  onMonthChange?: (newMonth: Date) => void;
}

const MonthCalendar: FC<MonthCalendarProps> = ({ currentMonth = new Date(), onMonthChange }) => {
  const [currentYear, setCurrentYear] = useState(format(currentMonth, "yyyy"));
  const firstDayCurrentYear = parse(currentYear, "yyyy", new Date());

  const months = monthsOfYear(firstDayCurrentYear);

  /* Roving tabindex: the twelve months are one tab stop and the arrow keys move
     between them. Making each its own stop would also be reachable, and would put
     twelve presses between the trigger and whatever follows the popover. */
  const monthRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(() => initialActiveIndex(months, currentMonth));

  /* Future months are always a contiguous tail — there are no gaps to hop — so the
     last reachable one is a scan, and every move only has to refuse to leave the run. */
  const lastOpenIndex = months.reduce((last, month, index) => (isFuture(month) ? last : index), 0);

  const goToYear = (delta: number) => {
    const firstDay = add(firstDayCurrentYear, { years: delta });
    setCurrentYear(format(firstDay, "yyyy"));
    /* The year moved under the tab stop, so an index that was valid a moment ago can
       now point at a month that has not happened. Focus is on the year button here,
       not in the list, so this re-places the stop without stealing it. */
    setActiveIndex(initialActiveIndex(monthsOfYear(firstDay), currentMonth));
  };

  const focusMonth = (index: number) => {
    if (index < 0 || index >= months.length || isFuture(months[index])) return;
    setActiveIndex(index);
    monthRefs.current[index]?.focus();
  };

  /* Bound to each option rather than to the listbox: the handler then moves from the
     month it actually fired on, instead of from a state value that is only supposed
     to agree with where focus is. */
  const onMonthKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -MONTHS_PER_ROW,
      ArrowDown: MONTHS_PER_ROW,
    };

    if (event.key in step) {
      /* Otherwise the arrow that picks a month also scrolls the page behind it. */
      event.preventDefault();
      focusMonth(index + step[event.key]);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusMonth(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusMonth(lastOpenIndex);
    }
  };

  return (
    <div className="p-3">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <div className="space-y-4">
          <div className="relative flex items-center justify-center pt-1">
            <div
              className="text-sm font-medium"
              aria-live="polite"
              role="presentation"
              id="month-picker"
            >
              {format(firstDayCurrentYear, "yyyy")}
            </div>
            <div className="static flex items-center space-x-1">
              <button
                name="previous-year"
                aria-label="Go to previous year"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  "absolute left-1",
                )}
                type="button"
                onClick={() => goToYear(-1)}
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <button
                name="next-year"
                aria-label="Go to next year"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  "absolute right-1 disabled:bg-muted",
                )}
                type="button"
                disabled={isFuture(add(firstDayCurrentYear, { years: 1 }))}
                onClick={() => goToYear(1)}
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
          {/* A listbox rather than a grid. Twelve months with one chosen is exactly
              what `option` and `aria-selected` describe, whereas `grid` owes the
              accessibility tree a `row` level that a three-wide wrap has nowhere
              honest to put — and without it the cells, and the selected state on
              them, are not reliably exposed at all.

              The options are the grid items directly now: the wrapper divs existed
              to centre a fixed-width button and to carry `:has([aria-selected])`
              styling for an attribute nothing set, and a presentational layer
              between a listbox and its options is a layer that can only get in
              the way. */}
          <div
            className="grid w-full grid-cols-3 gap-2"
            role="listbox"
            aria-labelledby="month-picker"
          >
            {months.map((month, index) => (
              <button
                key={month.toString()}
                ref={(element) => {
                  monthRefs.current[index] = element;
                }}
                className={cn(
                  "inline-flex h-9 w-16 items-center justify-center justify-self-center rounded-md p-0 text-sm font-normal ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  /* Selected is the inked button, and it has to stay inked under the
                     cursor: without the hover and focus repeats the generic
                     `hover:bg-accent` would wash the current month back to a wash. */
                  isSelected(month, currentMonth) &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  !isSelected(month, currentMonth) &&
                    isSameMonth(month, startOfToday()) &&
                    "bg-accent text-accent-foreground",
                )}
                disabled={isFuture(month)}
                role="option"
                aria-selected={isSelected(month, currentMonth)}
                tabIndex={index === activeIndex ? 0 : -1}
                type="button"
                onKeyDown={(event) => onMonthKeyDown(event, index)}
                onClick={() => {
                  setActiveIndex(index);
                  onMonthChange?.(month);
                }}
              >
                <time dateTime={format(month, "yyyy-MM-dd")}>{format(month, "MMM")}</time>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface MonthPickerProps {
  onMonthChange?: (newMonth: Date) => void;
  placeholder?: string;
  value?: Date | null;
  className?: string;
}

const MonthPicker: FC<MonthPickerProps> = ({
  onMonthChange,
  placeholder = "Pick a date",
  value,
  className,
}) => {
  const [date, setDate] = useState<Date | null | undefined>(null);
  const { registerIcon, startIcons, stopIcons } = useIconHover();

  const handleMonthChange = (newMonth: Date) => {
    setDate(newMonth);
    onMonthChange?.(newMonth);
  };

  useEffect(() => {
    setDate(value);
  }, [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* The button is up to 280px wide and the glyph is 16 of them, so the trigger
            drives the animation rather than the icon waiting to be hovered itself. */}
        <Button
          variant={"outline"}
          onMouseEnter={startIcons}
          onMouseLeave={stopIcons}
          onFocus={startIcons}
          onBlur={stopIcons}
          className={cn(
            "md:w-[280px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDaysIcon ref={registerIcon} className="mr-2 size-4" />
          {date ? format(date, "yyyy-MMM") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <MonthCalendar currentMonth={date ?? new Date()} onMonthChange={handleMonthChange} />
      </PopoverContent>
    </Popover>
  );
};

export { MonthPicker };
