import { useFormContext } from "react-hook-form";

import { Typography } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { Resume } from "@/types/resume";
import Information from "./information";
import SocialLinks from "./social-links";

const ResumeForm = () => {
  const { register } = useFormContext<Resume>();

  return (
    <div>
      <Information />

      <Typography variant="h4">Profile</Typography>
      <div className="mb-8 mt-4 space-y-4">
        <Textarea {...register("profile")} rows={5} />
      </div>

      <SocialLinks />
    </div>
  );
};

export default ResumeForm;
