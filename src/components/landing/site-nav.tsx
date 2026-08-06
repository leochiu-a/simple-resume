"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { useTheme } from "next-themes";

import { applyTheme } from "@/lib/theme-transition";

/**
 * The landing page's own toggle rather than the editor's `ModeToggle`: this one is
 * a flip, not a three-way menu, and it is drawn in the page's paper palette
 * instead of the editor's shadcn one. Both go through `applyTheme`, so the wipe is
 * the same.
 */
const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server has no way of knowing which theme resolves, so the icon can only
  // be chosen after hydration.
  useEffect(() => setMounted(true), []);

  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={(event: MouseEvent<HTMLButtonElement>) => applyTheme(event, () => setTheme(next))}
      className="flex size-9 items-center justify-center border border-[var(--rule)] transition-colors duration-200 hover:border-[var(--accent)]"
    >
      {mounted && resolvedTheme === "dark" ? (
        <Moon className="size-4" />
      ) : (
        <Sun className="size-4" />
      )}
    </button>
  );
};

const SiteNav = () => (
  <header className="border-b border-[var(--rule)]">
    <div className="mx-auto flex w-full max-w-[1280px] items-center gap-6 px-6 py-5 lg:px-10">
      <Link href="/" className="font-display text-xl font-semibold tracking-[-0.02em]">
        Simple Resume
      </Link>
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--graphite-soft)] sm:inline">
        Local-first résumé builder
      </span>

      <div className="ml-auto flex items-center gap-3">
        <Link
          href="https://github.com/leochiu-a/simple-resume"
          target="_blank"
          aria-label="Source on GitHub"
          className="flex size-9 items-center justify-center border border-[var(--rule)] transition-colors duration-200 hover:border-[var(--accent)]"
        >
          <SiGithub className="size-4" />
        </Link>
        <ThemeToggle />
        <Link
          href="/resume-editor"
          className="hidden bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] transition-transform duration-200 hover:-translate-y-0.5 sm:block"
        >
          Create resume
        </Link>
      </div>
    </div>
  </header>
);

export default SiteNav;
