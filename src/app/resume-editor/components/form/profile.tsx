import { Controller, useFormContext } from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { Resume } from "@/types/resume";
import VisibleSwitch from "./visible-switch";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { register, control, watch } = useFormContext<Resume>();
  const visible = watch("visibility.profile");

  return (
    <div className={cn(!visible && "opacity-50")}>
      <Typography variant="h4" className="flex items-center gap-2">
        <span>Profile</span>
        <Controller
          control={control}
          name="visibility.profile"
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </Typography>
      <div className="mb-8 mt-4 space-y-4">
        <Textarea
          {...register("profile")}
          rows={5}
          className="field-sizing-content"
        />
      </div>
    </div>
  );
};

export default Profile;
