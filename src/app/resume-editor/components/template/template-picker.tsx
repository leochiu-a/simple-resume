"use client";

import { Check } from "lucide-react";
import { FaTableColumns } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { TEMPLATES, TemplateDefinition } from "./registry";

const TemplatePicker = ({
  template,
  onSelect,
}: {
  template: TemplateDefinition;
  onSelect: (id: string) => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" type="button" aria-label="Change template">
          <FaTableColumns />
          <span className="ml-2 hidden sm:inline">{template.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-w-72">
        {TEMPLATES.map(({ id, label, description }) => (
          <DropdownMenuItem key={id} onClick={() => onSelect(id)} className="items-start gap-2">
            <Check className={cn("mt-1 h-4 w-4 shrink-0", id !== template.id && "opacity-0")} />
            <span className="flex flex-col">
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TemplatePicker;
