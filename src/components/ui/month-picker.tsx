import { FC, useEffect, useState } from "react";
import {
  add,
  eachMonthOfInterval,
  endOfYear,
  format,
  isEqual,
  isFuture,
  parse,
  startOfMonth,
  startOfToday,
} from "date-fns";

import { Button, buttonVariants } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@/components/icons/chevron-left";
import { ChevronRightIcon } from "@/components/icons/chevron-right";
import { CalendarDaysIcon } from "@/components/icons/calendar-days";
import { useIconHover } from "@/components/icons/use-icon-hover";

function getStartOfCurrentMonth() {
  return startOfMonth(startOfToday());
}

export interface MonthCalendarProps {
  currentMonth?: Date;
  onMonthChange?: (newMonth: Date) => void;
}

const MonthCalendar: FC<MonthCalendarProps> = ({ currentMonth = new Date(), onMonthChange }) => {
  const [currentYear, setCurrentYear] = useState(format(currentMonth, "yyyy"));
  const firstDayCurrentYear = parse(currentYear, "yyyy", new Date());

  const months = eachMonthOfInterval({
    start: firstDayCurrentYear,
    end: endOfYear(firstDayCurrentYear),
  });

  const previousYear = () => {
    const firstDayNextYear = add(firstDayCurrentYear, { years: -1 });
    setCurrentYear(format(firstDayNextYear, "yyyy"));
  };

  const nextYear = () => {
    const firstDayNextYear = add(firstDayCurrentYear, { years: 1 });
    setCurrentYear(format(firstDayNextYear, "yyyy"));
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
                onClick={previousYear}
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
                onClick={nextYear}
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-2" role="grid" aria-labelledby="month-picker">
            {months.map((month) => (
              <div
                key={month.toString()}
                className="relative p-0 text-center text-sm focus-within:z-20"
                role="presentation"
              >
                <button
                  name="day"
                  className={cn(
                    "inline-flex h-9 w-16 items-center justify-center rounded-md p-0 text-sm font-normal ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    /* Selected is the inked button, and it has to stay inked under the
                       cursor: without the hover and focus repeats the row's generic
                       `hover:bg-accent` would wash the current month back to a wash. */
                    isEqual(month, currentMonth) &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    !isEqual(month, currentMonth) &&
                      isEqual(month, getStartOfCurrentMonth()) &&
                      "bg-accent text-accent-foreground",
                  )}
                  disabled={isFuture(month)}
                  role="gridcell"
                  aria-selected={isEqual(month, currentMonth)}
                  tabIndex={-1}
                  type="button"
                  onClick={() => onMonthChange?.(month)}
                >
                  <time dateTime={format(month, "yyyy-MM-dd")}>{format(month, "MMM")}</time>
                </button>
              </div>
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
