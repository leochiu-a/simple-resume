import { Controller, useFormContext } from "react-hook-form";

import { Textarea } from "@/components/ui/textarea";
import { Resume } from "@/types/resume";
import { cn } from "@/lib/utils";
import VisibleSwitch from "./visible-switch";
import { Section, SectionTitle, SectionBody } from "./section";
import RewritePopover from "./rewrite-popover";

const Profile = () => {
  const { register, control, watch, getValues, setValue } = useFormContext<Resume>();
  const visible = watch("visibility.profile");

  return (
    <Section className={cn(!visible && "opacity-50")}>
      <SectionTitle>
        <span>Profile</span>
        {/* Both controls ride the heading's `ml-auto` as one group, so the
            rewrite trigger sits beside the visibility toggle rather than on a
            line of its own above the field. */}
        <div className="ml-auto flex items-center gap-4">
          <RewritePopover
            section="profile"
            // Read on demand rather than watched: the popover only needs the
            // text at the moment a rewrite starts, and subscribing here would
            // re-render this section on every keystroke.
            getValue={() => getValues("profile")}
            onApply={(value) =>
              setValue("profile", value, { shouldDirty: true, shouldTouch: true })
            }
          />
          <Controller
            control={control}
            name="visibility.profile"
            render={({ field }) => <VisibleSwitch {...field} />}
          />
        </div>
      </SectionTitle>
      <SectionBody>
        <Textarea {...register("profile")} rows={5} className="field-sizing-content" />
      </SectionBody>
    </Section>
  );
};

export default Profile;
