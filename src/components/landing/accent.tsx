"use client";

import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";

import { DEFAULT_TEMPLATE_ID } from "@/app/resume-editor/components/template/registry";

/**
 * The template and the tint the visitor is trying out. Both reach the sheet as
 * props — see `template-sheet.tsx` — and neither leaves it.
 *
 * The tint used to be published as `--ink` on the page wrapper and drive the
 * whole page's accent as well. It no longer does: the swatch is a preview of a
 * printed page, not a theme picker, and a site that repainted itself every time
 * someone clicked through six colours read as unstable rather than responsive.
 * The page's accent is fixed in globals.css as `--accent`.
 */

export interface Swatch {
  name: string;
  value: string;
}

/** Deliberately all mid-to-dark: every one has to hold a sidebar of white type on
 *  white paper. Pine and Ink are two of the templates' own defaults, and Pine is
 *  also the page's fixed accent — if it changes here, change `--c-accent` in
 *  globals.css with it (it is an HSL triple there, not a hex). */
export const SWATCHES: Swatch[] = [
  { name: "Pine", value: "#094C42" },
  { name: "Ink", value: "#02061b" },
  { name: "Oxblood", value: "#6E1F2B" },
  { name: "Indigo", value: "#2A3A8F" },
  { name: "Ochre", value: "#8A5A12" },
  { name: "Slate", value: "#3C4A52" },
];

interface AccentValue {
  templateId: string;
  color: string;
  setTemplateId: (id: string) => void;
  setColor: (color: string) => void;
}

const AccentContext = createContext<AccentValue | null>(null);

export const useAccent = () => {
  const value = useContext(AccentContext);
  if (!value) throw new Error("useAccent must be used inside <AccentProvider>");
  return value;
};

const AccentProvider = ({ children }: PropsWithChildren) => {
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [color, setColor] = useState(SWATCHES[0].value);

  const value = useMemo(
    () => ({ templateId, color, setTemplateId, setColor }),
    [templateId, color],
  );

  return (
    <AccentContext.Provider value={value}>
      <div
        data-landing
        className="min-h-screen bg-[var(--paper)] font-body text-[var(--graphite)] transition-colors duration-500"
      >
        {children}
      </div>
    </AccentContext.Provider>
  );
};

export default AccentProvider;
