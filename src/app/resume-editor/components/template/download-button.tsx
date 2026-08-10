import { usePDF } from "@react-pdf/renderer";
import { Check, ChevronDown, Share } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/spinner";
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
        <Check className="size-4" />
        Copied
      </span>
    </span>
  </DropdownMenuItem>
);

/**
 * One button for every way of taking the resume out of the editor.
 *
 * Two full-width buttons side by side were the widest thing in the nav, and
 * exporting is a thing you do once at the end — worth a second click to keep
 * the bar calm the rest of the time.
 *
 * It is labelled "Export" rather than "Download" because only half of what is in
 * here downloads anything: the PDF and the HTML land on disk, but the Markdown
 * and the share link land on the clipboard. "Download" was already a stretch for
 * the Markdown copy and became plainly wrong once a link joined it — a menu whose
 * trigger promises a file and then hands back a URL is a small lie about what the
 * button does. "Export" covers all four without favouring the file ones.
 */
const DownloadButton = ({
  resume,
  backgroundColor,
  template,
}: {
  resume: Resume;
  backgroundColor: string;
  template: TemplateDefinition;
}) => {
  const [instance, update] = usePDF({
    document: template.render({ resume, backgroundColor }),
  });
  const [startDownload, setStartDownload] = useState(false);
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
      setStartDownload(false);
    }
  }, [instance.loading, instance.url, startDownload]);

  const downloadHtml = () => {
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
          <Button type="button" aria-label="Export">
            {/* The spinner takes the icon's place rather than the whole label: a
                button that briefly turns into an unlabelled box reads as broken. */}
            {instance.loading ? <LoadingSpinner /> : <Share className="size-4" />}
            <span className="ml-2">Export</span>
            <ChevronDown className="ml-1 size-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={downloadPdf}>Download PDF</DropdownMenuItem>
          <DropdownMenuItem onClick={downloadHtml}>Download HTML</DropdownMenuItem>
          <CopyItem label="Copy as Markdown" copied={copied === "markdown"} onCopy={copyMarkdown} />
          <CopyItem label="Copy share link" copied={copied === "link"} onCopy={copyShareLink} />
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
