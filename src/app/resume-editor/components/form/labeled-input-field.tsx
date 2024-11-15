import { forwardRef } from "react";

import { Input, InputProps } from "@/components/ui/input";

interface LabeledInputFieldProps extends InputProps {
  label: string;
}

const LabeledInputField = forwardRef<HTMLInputElement, LabeledInputFieldProps>(
  ({ label, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <div>{label}</div>
        <Input {...props} ref={ref} />
      </div>
    );
  }
);
LabeledInputField.displayName = "LabeledInputField";

export { LabeledInputField };
