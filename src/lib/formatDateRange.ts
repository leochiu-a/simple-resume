import { format, parseISO } from "date-fns";

interface DateRange {
  from: string | null;
  to: string | null;
}

const formatDate = (date: string) => {
  const dateFormatted = format(parseISO(date), "MMMM yyyy").toUpperCase();

  return dateFormatted;
};

const formatDateRange = (
  timeline: DateRange,
  placeholder: string
): string => {
  const { from, to } = timeline;
  const fromDate = from ? formatDate(from) : "";
  const toDate = to ? formatDate(to) : placeholder;

  return `${fromDate} — ${toDate}`;
};

export default formatDateRange;
