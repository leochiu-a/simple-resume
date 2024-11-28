import { Controller, useFormContext } from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";
import { Resume } from "@/types/resume";
import { cn } from "@/lib/utils";
import VisibleSwitch from "./visible-switch";
import { SectionCard, SectionTitle, SectionBody } from "./section-card";

const Profile = () => {
  const { register, control, watch } = useFormContext<Resume>();
  const visible = watch("visibility.profile");

  return (
    <SectionCard className={cn(!visible && "opacity-50")}>
      <SectionTitle>
        <span>Profile</span>
        <Controller
          control={control}
          name="visibility.profile"
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </SectionTitle>
      <SectionBody>
        <Textarea
          {...register("profile")}
          rows={5}
          className="field-sizing-content"
        />
      </SectionBody>
    </SectionCard>
  );
};

export default Profile;
