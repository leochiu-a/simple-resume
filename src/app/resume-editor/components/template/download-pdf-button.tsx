import { usePDF } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Resume } from "@/types/resume";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import dynamic from "next/dynamic";

import { TemplateDefinition } from "./registry";

const DownloadPDFButton = ({
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

  const downloadResume = () => {
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

  return (
    <Button type="button" onClick={downloadResume} aria-label="Download PDF">
      {instance.loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* The mobile dialog puts both download buttons and the colour picker
              in one row, so the verb is dropped on narrow screens. */}
          <span className="hidden sm:inline">Download&nbsp;</span>PDF
        </>
      )}
    </Button>
  );
};

const DownloadPDFButtonCSR = dynamic(() => Promise.resolve(DownloadPDFButton), {
  ssr: false,
});

export default DownloadPDFButtonCSR;
