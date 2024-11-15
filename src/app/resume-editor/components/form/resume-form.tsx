import { Typography } from "@/components/ui/typography";
import Information from "./information";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { Resume } from "@/types/resume";

const ResumeForm = () => {
  const { register } = useFormContext<Resume>();

  return (
    <div>
      <Information />

      <Typography variant="h4">Profile</Typography>
      <div className="mb-8 mt-4 space-y-4">
        <Textarea {...register("profile")} rows={5} />
      </div>
    </div>
  );
};

export default ResumeForm;
