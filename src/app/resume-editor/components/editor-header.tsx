"use client";

import Link from "next/link";
import Image from "next/image";
import { FC } from "react";
import { useTheme } from "next-themes";
import { MoreHorizontal } from "lucide-react";

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
import { WebMcpStatus } from "@/lib/webmcp";
import { ResumeLang } from "@/types/resume-doc";
import { Resume } from "@/types/resume";

import type useTemplateOptions from "../hooks/useTemplateOptions";
import DownloadButton from "./template/download-button";
import LanguageSwitcher from "./language-switcher";
import OnDeviceAiRows from "./on-device-ai/on-device-ai-rows";

interface EditorHeaderProps {
  resume: Resume;
  options: ReturnType<typeof useTemplateOptions>;
  activeLang: ResumeLang;
  primaryLang: ResumeLang;
  onSwitchLang: (lang: ResumeLang) => void;
  mcpStatus: WebMcpStatus;
  mcpToolCount: number;
  pair: LangPair | null;
  pairLabel: string | null;
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
  onSwitchLang,
  mcpStatus,
  mcpToolCount,
  pair,
  pairLabel,
  showTools,
}) => {
  const { setTheme, resolvedTheme } = useTheme();
  const { template, backgroundColor } = options;

  return (
    /* Solid paper, and no `backdrop-blur`: a backdrop-filter would make this a
       containing block for fixed positioning, and the appearance panel's
       full-screen click-catcher is a `fixed inset-0`. Blurring here shrinks that
       overlay to the height of the bar and the picker stops closing on an outside
       click. The same trap is documented on the panel itself. */
    <header className="z-20 shrink-0 border-b bg-background">
      <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="truncate font-display text-xl font-semibold tracking-[-0.02em]">
            <h1>Simple Resume</h1>
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
          onSwitch={onSwitchLang}
        />

        <div className="flex items-center justify-end gap-2">
          {/* Download is the one thing anybody came here to do, so it is the one
              thing that stays a button. Appearance moved out of this bar entirely
              — it now lives on the preview, where you can see what it changes. */}
          {showTools && (
            <DownloadButton resume={resume} backgroundColor={backgroundColor} template={template} />
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

            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>On-device AI</DropdownMenuLabel>
              {/* Plain children of the menu, not `DropdownMenuItem`s. These rows
                  hold a progress bar and the button that starts the model
                  download, and a menu item would close the menu on the very
                  click that starts it — see the note on OnDeviceAiRows. They
                  used to hide behind a nested popover for that reason; the
                  popover was a second click to read a status, so the rows moved
                  out here and only the constraint stayed. */}
              <OnDeviceAiRows
                mcpStatus={mcpStatus}
                mcpToolCount={mcpToolCount}
                pair={pair}
                pairLabel={pairLabel}
              />

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuItem onClick={(e) => applyTheme(e, () => setTheme("light"))}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => applyTheme(e, () => setTheme("dark"))}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => applyTheme(e, () => setTheme("system"))}>
                System
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link
                  href="https://github.com/leochiu-a/simple-resume"
                  target="_blank"
                  className="flex items-center gap-2"
                >
                  <Image
                    src={resolvedTheme === "dark" ? "/github-mark-white.png" : "/github-mark.png"}
                    alt=""
                    width={14}
                    height={14}
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
