"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import { MoonIcon } from "@/components/icons/moon";
import { SunIcon } from "@/components/icons/sun";
import { useTheme } from "next-themes";

import { applyTheme } from "@/lib/theme-transition";
import { GithubIcon } from "@/components/icons/github";

/**
 * The landing page's own toggle rather than the editor's `ModeToggle`: this one is
 * a flip, not a three-way menu, and it is drawn in the page's palette instead of
 * the editor's shadcn one. Both go through `applyTheme`, so the wipe is the same.
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
      className="flex size-8 items-center justify-center rounded-full text-[var(--graphite-soft)] transition-colors duration-200 hover:bg-[var(--wash)] hover:text-[var(--graphite)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      {mounted && resolvedTheme === "dark" ? (
        <MoonIcon className="size-4" />
      ) : (
        <SunIcon className="size-4" />
      )}
    </button>
  );
};

/** `whitespace-nowrap` is load-bearing: the label is long enough that at 375px it
 *  otherwise breaks across two lines and doubles the height of the bar. */
const NAV_LINK =
  "whitespace-nowrap rounded-full px-2 py-1.5 text-[0.875rem] text-[var(--graphite-soft)] transition-colors duration-200 hover:bg-[var(--wash)] hover:text-[var(--graphite)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3";

/**
 * A floating pill nav.
 *
 * It starts transparent over the hero and gains its surface once the page has
 * scrolled, so the top of the page is the hero rather than a bar sitting on the
 * hero. The mark is the only place the signature ramp appears at full strength in
 * the chrome — everything else in here is neutral, which is what keeps a nav with a
 * gradient in it from reading as a toy.
 */
const SiteNav = () => {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const read = () => setLifted(window.scrollY > 16);
    read(); // A reload partway down the page starts lifted, not transparent.
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div
        className={`mx-auto flex w-full max-w-[1120px] items-center gap-2 rounded-[var(--r-xl)] px-3 py-2.5 transition-[background-color,box-shadow,border-color] duration-300 motion-reduce:transition-none sm:gap-3 sm:px-4 ${
          lifted
            ? "border border-[var(--rule)] bg-[color-mix(in_oklab,var(--paper-raised)_82%,transparent)] shadow-[var(--shadow-md),var(--highlight)] backdrop-blur-xl"
            : "border border-transparent"
        }`}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-full pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {/* The mark: the ramp, boxed. A sheet of paper with a fold, at 20px. */}
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-[9px] bg-[image:var(--gradient)] shadow-[var(--shadow-sm)]"
          >
            <span className="block size-2.5 rounded-[3px] bg-white/95" />
          </span>
          <span className="whitespace-nowrap font-display text-[0.9375rem] font-semibold tracking-[-0.02em] sm:text-[1.0625rem]">
            Open Resume
          </span>
        </Link>

        {/* Beside the wordmark, which is where this kind of nav puts its destinations —
            the right-hand group is controls and one CTA, and a link sitting among them
            reads as a fourth button rather than as somewhere to go.

            Named after what the page explains rather than after the technology in it:
            "AI" on its own labels a topic and promises nothing. Same shape as the
            "How it works" every product nav already has. */}
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <Link href="/how-ai-works" className={NAV_LINK}>
            How AI works
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <Link
            href="https://github.com/leochiu-a/open-resume"
            target="_blank"
            aria-label="Source on GitHub"
            className="flex size-8 items-center justify-center rounded-full text-[var(--graphite-soft)] transition-colors duration-200 hover:bg-[var(--wash)] hover:text-[var(--graphite)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <GithubIcon className="size-4" />
          </Link>
          <ThemeToggle />
          <Link
            href="/resume-editor"
            className="ml-1 hidden rounded-full bg-[var(--graphite)] px-4 py-2 text-[0.875rem] font-medium text-[var(--paper)] shadow-[var(--shadow-sm)] transition-transform duration-200 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none sm:block"
          >
            Create resume
          </Link>
        </div>
      </div>
    </header>
  );
};

export default SiteNav;
