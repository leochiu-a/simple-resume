import { useRef, useState } from "react";

import { InputProps } from "@/components/ui/input";
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
  const [items] = useState(() => (props.value as string)?.split(",") ?? []);
  const ref = useRef<HTMLDivElement>(null);

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const result = [];
    for (const child of (e.target as HTMLElement).children) {
      result.push(child.textContent);
    }
    props.onChange?.(result.join(","));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div>{label}</div>
      <div
        className={cn(
          "[&>div]:list-item",
          "min-h-[60px] w-full rounded-md border border-input bg-transparent px-6 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
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
