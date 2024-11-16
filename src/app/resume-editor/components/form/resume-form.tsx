import { useFormContext } from "react-hook-form";

import { Typography } from "@/components/ui/typography";
import { Textarea } from "@/components/ui/textarea";
import { Resume } from "@/types/resume";
import Information from "./information";
import SocialLinks from "./social-links";
import Skills from "./skills";
import Educations from "./educations";
import EmploymentHistory from "./employment-history";

const ResumeForm = () => {
  const { register } = useFormContext<Resume>();

  return (
    <div>
      <Information />

      <Typography variant="h4">Profile</Typography>
      <div className="mb-8 mt-4 space-y-4">
        <Textarea
          {...register("profile")}
          rows={5}
          className="field-sizing-content"
        />
      </div>

      <SocialLinks />
      <Skills />
      <EmploymentHistory />
      <Educations />
    </div>
  );
};

export default ResumeForm;
