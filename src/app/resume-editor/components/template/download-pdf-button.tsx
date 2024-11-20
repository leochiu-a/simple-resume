import { usePDF } from "@react-pdf/renderer";
import ResumeTemplate from "./resume-template";
import { Button } from "@/components/ui/button";
import { Resume } from "@/types/resume";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";

const DownloadPDFButton = ({ resume }: { resume: Resume }) => {
  const [instance, update] = usePDF({
    document: <ResumeTemplate resume={resume} />,
  });
  const [startDownload, setStartDownload] = useState(false);

  const downloadResume = () => {
    setStartDownload(true);
    update(<ResumeTemplate resume={resume} />);
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
    <Button variant="outline" onClick={downloadResume}>
      {instance.loading ? <LoadingSpinner /> : "Download"}
    </Button>
  );
};

export default DownloadPDFButton;
