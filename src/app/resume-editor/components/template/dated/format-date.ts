import { format, parseISO } from "date-fns";

/**
 * The date range as this template's margin needs it: `JAN 2018 — JAN 2020`.
 *
 * Every other template sets the range inline, where there is a whole line for it,
 * so they all use `formatDateRange` and its full month names. Here it goes in a
 * gutter, and the gutter's width is the layout — so the string has to fit the
 * column rather than the column being widened to fit the string.
 *
 * The numbers, measured in the preview against a 712px text column:
 *
 * | JANUARY 2018 — JANUARY 2020 | 202px | 28.4% |
 * | JAN 2018 — JAN 2020         | 129px | 18.1% |
 * | 2018 — 2020                 |  73px | 10.3% |
 *
 * At the 22% the gutter started on, the full form wrapped to two lines with the
 * dash left dangling at the end of the first. Widening to 29% would fix that and
 * make it worse overall: the same gutter is empty beside Summary, Projects,
 * Skills and Links, and at 29% that emptiness is a 200px hole down the side of
 * the page.
 *
 * Abbreviating is the one change that helps both — it fits on one line inside a
 * *narrower* gutter. Years alone would be narrower still, and is what a printed
 * academic CV usually does, but it drops something the user typed, which is not
 * this template's call to make.
 */
const formatMarginDateRange = (
  timeline: { from: string | null; to: string | null },
  placeholder: string,
): string => {
  const { from, to } = timeline;
  const short = (date: string) => format(parseISO(date), "MMM yyyy").toUpperCase();

  return `${from ? short(from) : ""} — ${to ? short(to) : placeholder}`;
};

export default formatMarginDateRange;
