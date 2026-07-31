import { Controller, useFormContext } from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";
import { Resume } from "@/types/resume";
import { cn } from "@/lib/utils";
import VisibleSwitch from "./visible-switch";
import { Section, SectionTitle, SectionBody } from "./section";

const Profile = () => {
  const { register, control, watch } = useFormContext<Resume>();
  const visible = watch("visibility.profile");

  return (
    <Section className={cn(!visible && "opacity-50")}>
      <SectionTitle index="02">
        <span>Profile</span>
        <Controller
          control={control}
          name="visibility.profile"
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </SectionTitle>
      <SectionBody>
        <Textarea {...register("profile")} rows={5} className="field-sizing-content" />
      </SectionBody>
    </Section>
  );
};

export default Profile;
