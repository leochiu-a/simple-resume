import { usePDF } from "@react-pdf/renderer";
import { Check, ChevronDown, Download } from "lucide-react";
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
import { Resume } from "@/types/resume";

import { TemplateDefinition } from "./registry";

/**
 * One button for every way of taking the resume out of the editor.
 *
 * Two full-width buttons side by side were the widest thing in the nav, and
 * exporting is a thing you do once at the end — worth a second click to keep
 * the bar calm the rest of the time. The Markdown copy rides in here for the
 * same reason, even though it lands on the clipboard rather than on disk.
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
  const [copied, setCopied] = useState(false);
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
  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(buildResumeMarkdown(resume));
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Denied clipboard permission, or an insecure origin. Nothing was copied,
      // so the item must not claim otherwise.
      setCopied(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" aria-label="Download">
            {/* The spinner takes the icon's place rather than the whole label: a
                button that briefly turns into an unlabelled box reads as broken. */}
            {instance.loading ? <LoadingSpinner /> : <Download className="size-4" />}
            <span className="ml-2">Download</span>
            <ChevronDown className="ml-1 size-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={downloadPdf}>Download PDF</DropdownMenuItem>
          <DropdownMenuItem onClick={downloadHtml}>Download HTML</DropdownMenuItem>
          {/* `preventDefault` keeps the menu open, which is the only place the copy
              can be confirmed — the click that triggers it would otherwise close
              the one surface able to say so. */}
          <DropdownMenuItem
            data-copied={copied}
            onSelect={(event) => event.preventDefault()}
            onClick={copyMarkdown}
          >
            {/* Both labels occupy the same grid cell, so the item is always as wide
                as the longer of the two and confirming the copy cannot resize the
                menu under the pointer. They cross-fade on `opacity` rather than
                `visibility`: that keeps the resting label in the accessibility tree,
                so the item's name stays "Copy as Markdown" while the tick — which on
                its own says nothing — is hidden from it, and the live region below is
                what actually announces the copy. */}
            <span className="grid">
              <span
                className={cn("col-start-1 row-start-1 transition-opacity", copied && "opacity-0")}
              >
                Copy as Markdown
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
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Outside the menu: a live region among the items would be a child of
          `role="menu"`, and the tick alone says nothing to a screen reader. */}
      <output className="sr-only">{copied ? "Resume copied as Markdown" : ""}</output>
    </>
  );
};

/** @react-pdf cannot render on the server, so the PDF side is client-only. */
const DownloadButtonCSR = dynamic(() => Promise.resolve(DownloadButton), {
  ssr: false,
});

export default DownloadButtonCSR;
