"use client";

import { Button } from "@/components/ui/button";
import { Resume } from "@/types/resume";

import { TemplateDefinition } from "./registry";

const DownloadHTMLButton = ({
  resume,
  backgroundColor,
  template,
}: {
  resume: Resume;
  backgroundColor: string;
  template: TemplateDefinition;
}) => {
  const downloadResume = () => {
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
    <Button type="button" variant="outline" onClick={downloadResume} aria-label="Download HTML">
      <span className="hidden sm:inline">Download&nbsp;</span>HTML
    </Button>
  );
};

export default DownloadHTMLButton;
