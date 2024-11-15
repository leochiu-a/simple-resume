import { usePDF } from "@react-pdf/renderer";
import ResumeTemplate from "./resume-template";
import { Button } from "@/components/ui/button";
import { Resume } from "@/types/resume";

const DownloadPDFButton = ({ resume }: { resume: Resume }) => {
  const [instance] = usePDF({ document: <ResumeTemplate resume={resume} /> });

  return (
    <Button className="ml-auto" variant="outline" asChild>
      <a href={instance.url!} download>
        {instance.loading ? "Loading" : "Download"}
      </a>
    </Button>
  );
};

export default DownloadPDFButton;
