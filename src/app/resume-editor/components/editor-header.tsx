"use client";

import Link from "next/link";
import Image from "next/image";
import { FC } from "react";
import { useTheme } from "next-themes";
import { Monitor, MoreHorizontal } from "lucide-react";
import { MoonIcon } from "@/components/icons/moon";
import { SunIcon } from "@/components/icons/sun";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LangPair } from "@/lib/translator";
import { applyTheme } from "@/lib/theme-transition";
import { AgentReview } from "@/lib/resume-score/review";
import { ScoreReport } from "@/lib/resume-score/rules";
import { WebMcpStatus } from "@/lib/webmcp";
import { ResumeLang } from "@/types/resume-doc";
import { Resume } from "@/types/resume";

import type useTemplateOptions from "../hooks/useTemplateOptions";
import DownloadButton from "./template/download-button";
import LanguageSwitcher from "./language-switcher";
import OnDeviceAiButton from "./on-device-ai/on-device-ai-button";
import ScoreButton from "./score/score-button";

interface EditorHeaderProps {
  resume: Resume;
  options: ReturnType<typeof useTemplateOptions>;
  activeLang: ResumeLang;
  primaryLang: ResumeLang;
  presentLangs: readonly ResumeLang[];
  onSwitchLang: (lang: ResumeLang) => void;
  onSetSoleLang: (lang: ResumeLang) => void;
  mcpStatus: WebMcpStatus;
  mcpToolCount: number;
  pair: LangPair | null;
  pairLabel: string | null;
  score: ScoreReport;
  review: AgentReview | null;
  onClearReview: () => void;
  /** Opens the share-link import dialog, which the page owns. Passed through to
   *  the Share menu, where importing sits beside the exports. */
  onImport: () => void;
  /** Desktop only: at mobile widths the tools ride in the preview dialog. */
  showTools: boolean;
}

/**
 * The editor's single bar.
 *
 * There used to be two. A `sticky top-0` nav held the wordmark and the tools, and
 * a second `sticky top-14` bar under it held the language tabs — two stacked
 * rules and 100px of chrome before the document started. The tabs were in their
 * own bar for a stated reason (they describe the document, not the tools, and the
 * preview beside them is a sticky sibling whose height anything full-width would
 * eat into), and that reasoning was sound while the form column scrolled the
 * page. It no longer does: both columns own their scrolling now, so a full-width
 * bar costs the preview nothing, and the tabs can come up here.
 *
 * The three-slot layout is what makes one bar work — identity left, document
 * centre, tools right. The tabs land in the centre slot on their own merits: they
 * are the one control here that says *which document you are looking at*, and
 * centring is how that reads as a mode rather than as another button.
 *
 * The slots are a 3-column grid rather than flex-with-auto-margins so the centre
 * is centred against the *bar*, not against whatever is left over — the two side
 * slots are different widths, and under flex the tabs would sit visibly off-axis.
 */
const EditorHeader: FC<EditorHeaderProps> = ({
  resume,
  options,
  activeLang,
  primaryLang,
  presentLangs,
  onSwitchLang,
  onSetSoleLang,
  mcpStatus,
  mcpToolCount,
  pair,
  pairLabel,
  score,
  review,
  onClearReview,
  onImport,
  showTools,
}) => {
  const { setTheme, resolvedTheme } = useTheme();
  const { template, backgroundColor } = options;

  return (
    /* Solid paper. The bar is the same stock as the page with a rule under it —
       a blurred bar would be a third material on a surface that only has two. */
    <header className="z-20 shrink-0 border-b bg-background">
      <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="truncate font-display text-xl font-semibold tracking-[-0.02em]">
            <h1>Open Resume</h1>
          </Link>
          <span className="hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground xl:inline">
            Saved in this browser
          </span>
        </div>

        {/* The centre slot. On mobile the tabs are the only thing that fits, and
            they are also the thing most worth keeping. */}
        <LanguageSwitcher
          activeLang={activeLang}
          primaryLang={primaryLang}
          presentLangs={presentLangs}
          onSwitch={onSwitchLang}
          onSetSoleLang={onSetSoleLang}
        />

        <div className="flex items-center justify-end gap-2">
          {/* The score stays in the bar at every width, unlike Download and the
              AI button beside it. It is the one control here that is also a
              readout: hidden on mobile it would not merely be harder to reach,
              it would stop telling you anything, and the number is most of what
              this feature is worth. */}
          <ScoreButton
            report={score}
            resume={resume}
            review={review}
            onClearReview={onClearReview}
          />

          {/* Getting the resume out is the one thing anybody came here to do, so
              Share is the one thing that stays a button. Appearance moved out of
              this bar entirely — it now lives on the preview, where you can see
              what it changes. */}
          {showTools && (
            <DownloadButton
              resume={resume}
              backgroundColor={backgroundColor}
              template={template}
              onImport={onImport}
            />
          )}

          {/* On-device AI is the thing that makes this editor unusual, and it
              spent a release inside the overflow menu — undiscoverable behind a
              `…`, and long enough (two titles, two status words, two sentences
              and a privacy note) that it dwarfed the five plain items under it.
              Its own trigger fixes both: the capability is visible in the bar,
              and the menu is back to being a short list of settings.

              Right of Share, not left: the icon buttons on this side of the
              bar are the secondary controls, and putting one before the primary
              action pushes Share off the bar's right edge. */}
          {showTools && (
            <OnDeviceAiButton
              mcpStatus={mcpStatus}
              mcpToolCount={mcpToolCount}
              pair={pair}
              pairLabel={pairLabel}
            />
          )}

          {/* Everything that is neither identity, document, nor the primary
              action. These are settings and links: consulted rarely, and each one
              left in the bar was a permanent tax on a bar we are trying to
              shorten. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" type="button" aria-label="More">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>

            {/* `w-52`, not the `w-72` this needed while the AI rows lived here:
                every remaining item is two words. */}
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              {/* Every item in this menu carries a leading icon, including the
                  three theme choices that did not need one. It is alignment, not
                  decoration: `DropdownMenuItem` is `gap-2 px-2` around a 16px
                  glyph, so an item with an icon starts its text 32px in and one
                  without starts at 8px. Mixed, the menu reads as two lists. */}
              <DropdownMenuItem onClick={(e) => applyTheme(e, () => setTheme("light"))}>
                <SunIcon />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => applyTheme(e, () => setTheme("dark"))}>
                <MoonIcon />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => applyTheme(e, () => setTheme("system"))}>
                <Monitor />
                System
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="https://github.com/leochiu-a/open-resume" target="_blank">
                  {/* 16px to match the lucide glyphs above it, which is what the
                      shared axis is measured from. */}
                  <Image
                    src={resolvedTheme === "dark" ? "/github-mark-white.png" : "/github-mark.png"}
                    alt=""
                    width={16}
                    height={16}
                  />
                  Source on GitHub
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default EditorHeader;
