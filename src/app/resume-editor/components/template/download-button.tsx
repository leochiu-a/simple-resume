import { usePDF } from "@react-pdf/renderer";
import { ChevronDown, Download } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Resume } from "@/types/resume";

import { TemplateDefinition } from "./registry";

/**
 * One button for both export formats.
 *
 * Two full-width buttons side by side were the widest thing in the nav, and
 * downloading is a thing you do once at the end — worth a second click to keep
 * the bar calm the rest of the time.
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

  return (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** @react-pdf cannot render on the server, so the PDF side is client-only. */
const DownloadButtonCSR = dynamic(() => Promise.resolve(DownloadButton), {
  ssr: false,
});

export default DownloadButtonCSR;
