import { usePDF } from "@react-pdf/renderer";
import ResumeTemplate from "./resume-template";
import { Button } from "@/components/ui/button";
import { Resume } from "@/types/resume";
import { useEffect } from "react";

const DownloadPDFButton = ({ resume }: { resume: Resume }) => {
  const [instance, update] = usePDF({
    document: <ResumeTemplate resume={resume} />,
  });

  useEffect(() => {
    // trigger document re-rendering whenever the resume changes
    update(<ResumeTemplate resume={resume} />);
  }, [resume, update]);

  return (
    <Button className="ml-auto" variant="outline" asChild>
      <a href={instance.url!} download>
        {instance.loading ? "Loading" : "Download"}
      </a>
    </Button>
  );
};

export default DownloadPDFButton;
