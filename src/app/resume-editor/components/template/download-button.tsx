import { usePDF } from "@react-pdf/renderer";
import { CheckIcon } from "@/components/icons/check";
import { ChevronDownIcon } from "@/components/icons/chevron-down";
import { UploadIcon } from "@/components/icons/upload";
import { useIconHover } from "@/components/icons/use-icon-hover";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/spinner";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { buildResumeMarkdown } from "@/lib/resume-markdown";
import { buildShareUrl } from "@/lib/share-link";
import { Resume } from "@/types/resume";

import { TemplateDefinition } from "./registry";

const COPY_ANNOUNCEMENT = {
  markdown: "Resume copied as Markdown",
  link: "Share link copied",
  none: "",
} as const;

/**
 * A menu item that confirms a copy in place.
 *
 * `preventDefault` on select keeps the menu open, which is the only place the copy
 * can be confirmed — the click that triggers it would otherwise close the one
 * surface able to say so.
 */
const CopyItem = ({
  label,
  copied,
  onCopy,
}: {
  label: string;
  copied: boolean;
  onCopy: () => void;
}) => (
  <DropdownMenuItem
    data-copied={copied}
    onSelect={(event) => event.preventDefault()}
    onClick={onCopy}
  >
    {/* Both labels occupy the same grid cell, so the item is always as wide as the
        longer of the two and confirming the copy cannot resize the menu under the
        pointer. They cross-fade on `opacity` rather than `visibility`: that keeps
        the resting label in the accessibility tree, so the item's name stays put
        while the tick — which on its own says nothing — is hidden from it, and the
        live region in the parent is what actually announces the copy. */}
    <span className="grid">
      <span className={cn("col-start-1 row-start-1 transition-opacity", copied && "opacity-0")}>
        {label}
      </span>
      <span
        aria-hidden
        className={cn(
          "col-start-1 row-start-1 flex items-center gap-2 transition-opacity",
          !copied && "opacity-0",
        )}
      >
        <CheckIcon className="size-4" />
        Copied
      </span>
    </span>
  </DropdownMenuItem>
);

/**
 * One button for every way a resume moves in or out of the editor.
 *
 * Two full-width buttons side by side were the widest thing in the nav, and none of
 * this is done while writing — worth a second click to keep the bar calm the rest
 * of the time.
 *
 * The label has moved twice, each time because the menu outgrew it. "Download" was
 * already a stretch for the Markdown copy and plainly wrong once a share link
 * joined it: two of the four items hand back a string, not a file. "Export" fixed
 * that and then broke in turn when importing arrived — a menu that reads a resume
 * *in* is not an export menu.
 *
 * "Share" covers all of it, and is what the feature is actually called: a link is
 * how a resume leaves this editor and how it gets back in. Import sits under a
 * separator at the bottom, because it is the one item here that overwrites rather
 * than emits — grouping is what keeps a destructive action from looking like
 * another way to save a file.
 */
const DownloadButton = ({
  resume,
  backgroundColor,
  template,
  onImport,
}: {
  resume: Resume;
  backgroundColor: string;
  template: TemplateDefinition;
  onImport: () => void;
}) => {
  const [instance, update] = usePDF({
    document: template.render({ resume, backgroundColor }),
  });
  const [startDownload, setStartDownload] = useState(false);
  const { registerIcon, startIcons, stopIcons } = useIconHover();
  /* Which item last confirmed a copy, rather than a boolean per item: only one
     tick can be showing at a time, and a new copy must clear the other's. */
  const [copied, setCopied] = useState<"markdown" | "link" | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const downloadPdf = () => {
    setStartDownload(true);
    update(template.render({ resume, backgroundColor }));
  };

  useEffect(() => {
    if (startDownload && !instance.loading && instance.url) {
      const a = document.createElement("a");
      a.href = instance.url;
      a.download = "resume.pdf";
      a.click();
      /* Counted here rather than on the click that started it, for the same
         reason the clipboard copies are counted after the write: the file only
         exists once @react-pdf has finished rendering it, and a render that
         never finishes is not an export. */
      trackEvent("resume_exported", { format: "pdf", template: template.id });
      setStartDownload(false);
    }
  }, [instance.loading, instance.url, startDownload, template.id]);

  const downloadHtml = () => {
    trackEvent("resume_exported", { format: "html", template: template.id });

    const html = template.buildHtml({ resume, backgroundColor });
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));

    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.html";
    a.click();

    // Firefox aborts the download if the object URL is revoked in the same
    // task as the click, so let the navigation start first.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /**
   * The one export that does not produce a file: Markdown for pasting into an AI
   * agent, which reads headings and bullets far better than a laid-out PDF.
   */
  const confirmCopy = async (what: "markdown" | "link", text: () => Promise<string> | string) => {
    try {
      await navigator.clipboard.writeText(await text());
      /* After the write, not before: a denied clipboard permission means nothing
         was copied, and an export the user never got is not an export. */
      trackEvent("resume_exported", {
        format: what === "markdown" ? "markdown" : "share_link",
        template: template.id,
      });
      setCopied(what);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      // Denied clipboard permission, or an insecure origin. Nothing was copied,
      // so the item must not claim otherwise.
      setCopied(null);
    }
  };

  const copyMarkdown = () => confirmCopy("markdown", () => buildResumeMarkdown(resume));

  /**
   * A link that carries the whole resume in its fragment. Nothing is uploaded —
   * see `share-link` for why the payload travels in the URL rather than behind it.
   */
  const copyShareLink = () =>
    confirmCopy("link", () =>
      buildShareUrl(window.location.origin, {
        resume,
        templateId: template.id,
        backgroundColor,
      }),
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* `upload` rather than a `share` that the registry does not have. The two
              glyphs are the same drawing — lucide's share is a tray, an arrowhead and a
              stem, and so is this — which is why the swap does not change what the
              button looks like or says. Its animation lifts the arrow out of the tray,
              which is the one thing every item in this menu does.

              Driven from the button: the pointer is on the word far more often than on
              the 16px glyph. */}
          <Button
            type="button"
            aria-label="Share"
            onMouseEnter={startIcons}
            onMouseLeave={stopIcons}
            onFocus={startIcons}
            onBlur={stopIcons}
          >
            {/* The spinner takes the icon's place rather than the whole label: a
                button that briefly turns into an unlabelled box reads as broken. */}
            {instance.loading ? (
              <LoadingSpinner />
            ) : (
              <UploadIcon ref={registerIcon} className="size-4" />
            )}
            <span className="ml-2">Share</span>
            <ChevronDownIcon className="ml-1 size-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={downloadPdf}>Download PDF</DropdownMenuItem>
          <DropdownMenuItem onClick={downloadHtml}>Download HTML</DropdownMenuItem>
          <CopyItem label="Copy as Markdown" copied={copied === "markdown"} onCopy={copyMarkdown} />
          <CopyItem label="Copy share link" copied={copied === "link"} onCopy={copyShareLink} />

          {/* Below a rule, because everything above emits a copy of the resume and
              this one replaces it. The two directions belong in the same menu — a
              share link is how a resume leaves and how it returns — but not in the
              same undifferentiated list. */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onImport}>Import from link…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Outside the menu: a live region among the items would be a child of
          `role="menu"`, and the tick alone says nothing to a screen reader. */}
      <output className="sr-only">{COPY_ANNOUNCEMENT[copied ?? "none"]}</output>
    </>
  );
};

/** @react-pdf cannot render on the server, so the PDF side is client-only. */
const DownloadButtonCSR = dynamic(() => Promise.resolve(DownloadButton), {
  ssr: false,
});

export default DownloadButtonCSR;
