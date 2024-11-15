import { format, parseISO } from "date-fns";

interface DateRange {
  from: string;
  to: string;
}

const formatDateRange = ({ from, to }: DateRange): string => {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);

  const fromFormatted = format(fromDate, "MMMM yyyy").toUpperCase();
  const toFormatted = format(toDate, "MMMM yyyy").toUpperCase();

  return `${fromFormatted} — ${toFormatted}`;
};

export default formatDateRange;
