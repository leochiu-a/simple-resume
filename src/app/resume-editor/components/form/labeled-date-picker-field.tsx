import { useCallback, useState } from "react";
import { format, parseISO, startOfMonth } from "date-fns";

import { MonthPicker } from "@/components/ui/month-picker";
import { Switch } from "@/components/ui/switch";

/**
 * A resume month is a calendar month, not an instant.
 *
 * These used to be stored with `toISOString()`, which turned "July 2026" picked in
 * Taipei into `2026-06-30T16:00:00.000Z` — a value whose month depends on who reads
 * it. Locally that survived, because it was parsed back in the same zone; through a
 * share link opened west of UTC it came out as June.
 *
 * Storing the month itself is the only form that travels. It also matches what the
 * rest of the app already assumes: everything else reads these with `parseISO`,
 * which takes a date-only string as local midnight where bare `new Date()` takes it
 * as UTC — the reason the picker never highlighted a month it had not just written.
 */
const toStoredMonth = (date: Date) => format(startOfMonth(date), "yyyy-MM-dd");

interface LabeledDatePickerFieldProps {
  label: string;
  switchText: string;
  value: {
    from: string | null;
    to: string | null;
  };
  onChange: (value: { from: string | null; to: string | null }) => void;
}

const LabeledDatePickerField = ({
  label,
  switchText,
  onChange,
  value,
}: LabeledDatePickerFieldProps) => {
  const [checked, setChecked] = useState(() => value.to === null);

  const handleChangeFromMonth = useCallback(
    (date: Date) => {
      onChange?.({ from: toStoredMonth(date), to: value?.to ?? null });
    },
    [onChange, value?.to],
  );

  const handleChangeToMonth = useCallback(
    (date: Date) => {
      onChange?.({ from: value?.from ?? null, to: toStoredMonth(date) });
    },
    [onChange, value?.from],
  );

  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        onChange?.({ from: value?.from ?? null, to: null });
      } else {
        handleChangeToMonth(new Date());
      }
      setChecked(checked);
    },
    [handleChangeToMonth, onChange, value?.from],
  );

  return (
    <div className="space-y-2">
      <div className="flex h-5 items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Switch checked={checked} onCheckedChange={handleCheckedChange} />
          {switchText}
        </div>
      </div>

      <div className="flex gap-2">
        <MonthPicker
          onMonthChange={handleChangeFromMonth}
          placeholder="From"
          value={value?.from ? parseISO(value.from) : null}
          className="flex-1"
        />
        {!checked && (
          <MonthPicker
            onMonthChange={handleChangeToMonth}
            placeholder="To"
            value={value?.to ? parseISO(value.to) : null}
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
};
LabeledDatePickerField.displayName = "LabeledDatePickerField";

export { LabeledDatePickerField };
