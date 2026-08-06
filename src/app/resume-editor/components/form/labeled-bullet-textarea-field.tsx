import { useRef, useState } from "react";

import { InputProps } from "@/components/ui/input";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { cn } from "@/lib/utils";

interface LabeledBulletTextAreaFieldProps extends Omit<InputProps, "onChange"> {
  label: string;
  onChange: (value: string) => void;
}

const LabeledBulletTextAreaField = ({
  label,
  className,
  ...props
}: LabeledBulletTextAreaFieldProps) => {
  const [items] = useState(() => (props.value as string)?.split(SPLIT_TEXT) ?? []);
  const ref = useRef<HTMLDivElement>(null);

  const handleInput = (e: React.InputEvent<HTMLDivElement>) => {
    const result = [];
    for (const child of e.currentTarget.children) {
      result.push(child.textContent);
    }
    props.onChange?.(result.join(SPLIT_TEXT));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "[&>div]:list-item",
          "min-h-[60px] w-full rounded-sm border border-input bg-card px-6 py-2 text-base leading-relaxed transition-colors focus-visible:border-foreground/60 focus-visible:outline-none focus-visible:ring-0",
        )}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        ref={ref}
      >
        {items.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </div>
  );
};

export { LabeledBulletTextAreaField };
