import { useCallback, useState } from "react";

import { MonthPicker } from "@/components/ui/month-picker";
import { Switch } from "@/components/ui/switch";

interface LabeledDatePickerFieldProps {
  label: string;
  switchText: string;
  value: {
    from: string | null;
    to: string | null;
  } | null;
  onChange: (value: { from: string | null; to: string | null }) => void;
}

const LabeledDatePickerField = ({
  label,
  switchText,
  onChange,
  value,
}: LabeledDatePickerFieldProps) => {
  const [checked, setChecked] = useState(false);

  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        onChange?.({ from: value?.from ?? null, to: null });
      }
      setChecked(checked);
    },
    [onChange, value?.from]
  );

  const handleChangeFromMonth = useCallback(
    (date: Date) => {
      onChange?.({ from: date.toISOString(), to: value?.to ?? null });
    },
    [onChange, value?.to]
  );

  const handleChangeToMonth = useCallback(
    (date: Date) => {
      onChange?.({ from: value?.from ?? null, to: date.toISOString() });
    },
    [onChange, value?.from]
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <div>{label}</div>
        <div className="flex gap-1">
          <Switch checked={checked} onCheckedChange={handleCheckedChange} />
          {switchText}
        </div>
      </div>

      <div className="flex gap-2">
        <MonthPicker
          onMonthChange={handleChangeFromMonth}
          placeholder="From"
          value={value?.from ? new Date(value.from) : null}
        />
        {!checked && (
          <MonthPicker
            onMonthChange={handleChangeToMonth}
            placeholder="To"
            value={value?.to ? new Date(value.to) : null}
          />
        )}
      </div>
    </div>
  );
};
LabeledDatePickerField.displayName = "LabeledDatePickerField";

export { LabeledDatePickerField };
