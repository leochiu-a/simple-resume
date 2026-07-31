"use client";

import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";

import { DEFAULT_TEMPLATE_ID } from "@/app/resume-editor/components/template/registry";

/**
 * The colour the visitor picks for the sheet is the page's accent too — the rules,
 * the buttons and the section numbers all follow it. It is published as the CSS
 * variable `--ink` on the page wrapper, so the sections below the hero pick it up
 * without any of them having to be client components.
 *
 * Read `--ink-display` rather than `--ink` for anything that is not the sheet:
 * globals.css lifts it towards white on dark paper, where the darker inks would
 * otherwise vanish.
 */

export interface Swatch {
  name: string;
  value: string;
}

/** Deliberately all mid-to-dark: every one has to read as a page accent, not just
 *  as a block of colour on white paper. Pine and Ink are two of the templates'
 *  own defaults. */
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
        style={{ "--ink": color } as React.CSSProperties}
        className="min-h-screen bg-[var(--paper)] font-body text-[var(--graphite)] transition-colors duration-500"
      >
        {children}
      </div>
    </AccentContext.Provider>
  );
};

export default AccentProvider;
