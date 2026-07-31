"use client";

import { Check, ChevronDown } from "lucide-react";
import { FaTableColumns } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { TEMPLATES, TemplateDefinition } from "./registry";

/**
 * The one place the preview's appearance is chosen: which template, and what
 * colour it is tinted.
 *
 * These used to be two buttons in the nav. Folding them together is what keeps the
 * bar quiet — and they belong together anyway, since each template tints a
 * different part of the page.
 */

/** Enough range to suit any of the templates without opening the full picker. */
const SWATCHES = [
  { hex: "#02061b", label: "Ink" },
  { hex: "#2e404a", label: "Slate" },
  { hex: "#094c42", label: "Green" },
  { hex: "#2e4a6b", label: "Navy" },
  { hex: "#4a90b8", label: "Blue" },
  { hex: "#f2f2f2", label: "Light" },
];

const AppearanceMenu = ({
  template,
  color,
  onSelectTemplate,
  onSelectColor,
  onOpenColorPicker,
}: {
  template: TemplateDefinition;
  color: string;
  onSelectTemplate: (id: string) => void;
  onSelectColor: (hex: string) => void;
  onOpenColorPicker: () => void;
}) => {
  const isCurrent = (hex: string) => hex.toLowerCase() === color.toLowerCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" type="button" aria-label="Change template">
          <FaTableColumns />
          <span className="ml-2 hidden sm:inline">{template.label}</span>
          {/* The current colour, so both halves of the state show on the trigger.
              The border keeps a pale swatch visible against the button. */}
          <span
            aria-hidden
            className="ml-2 size-3 rounded-full border border-foreground/20"
            style={{ backgroundColor: color }}
          />
          <ChevronDown className="ml-1 size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="max-w-72">
        <DropdownMenuLabel>Template</DropdownMenuLabel>
        {TEMPLATES.map(({ id, label, description }) => (
          <DropdownMenuItem
            key={id}
            onClick={() => onSelectTemplate(id)}
            className="items-start gap-2"
          >
            <Check className={cn("mt-1 h-4 w-4 shrink-0", id !== template.id && "opacity-0")} />
            <span className="flex flex-col">
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Colour</DropdownMenuLabel>
        <div className="flex items-center gap-1.5 px-2 pb-1">
          {SWATCHES.map(({ hex, label }) => (
            <button
              key={hex}
              type="button"
              aria-label={label}
              aria-pressed={isCurrent(hex)}
              onClick={() => onSelectColor(hex)}
              style={{ backgroundColor: hex }}
              className={cn(
                "size-6 rounded-full border transition-transform hover:scale-110",
                isCurrent(hex)
                  ? "border-foreground ring-2 ring-foreground/20"
                  : "border-foreground/20",
              )}
            />
          ))}
        </div>

        <DropdownMenuItem onClick={onOpenColorPicker}>Custom colour…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AppearanceMenu;
