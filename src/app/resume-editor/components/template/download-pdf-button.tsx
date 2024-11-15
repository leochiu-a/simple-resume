import { usePDF } from "@react-pdf/renderer";
import ResumeTemplate from "./resume-template";
import { Button } from "@/components/ui/button";

const DownloadPDFButton = () => {
  const [instance] = usePDF({ document: <ResumeTemplate /> });

  return (
    <Button className="ml-auto" variant="outline" asChild>
      <a href={instance.url!} download>
        {instance.loading ? "Loading" : "Download"}
      </a>
    </Button>
  );
};

export default DownloadPDFButton;
