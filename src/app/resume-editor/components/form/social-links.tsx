import { FC, Fragment } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import VisibleSwitch from "./visible-switch";
import { Section, SectionBody, SectionTitle } from "./section";
import { PlusIcon } from "@/components/icons/plus";
import { IconButton } from "@/components/ui/icon-button";
import { DeleteIcon } from "@/components/icons/delete";

const SocialLinksSection: FC = () => {
  const { control, watch } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinks",
  });
  const visible = watch("visibility.socialLinks");

  const handleAdd = () => {
    append({ name: "", url: "" });
  };

  return (
    <Section className={cn(!visible && "opacity-50")}>
      <SectionTitle index="03">
        <span>Website & Social links</span>
        <Controller
          control={control}
          name="visibility.socialLinks"
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </SectionTitle>
      <SectionBody>
        {fields.map((field, index) => (
          <Fragment key={field.id}>
            <div className="mt-4 flex gap-4">
              <Controller
                control={control}
                name={`socialLinks.${index}.name`}
                render={({ field }) => <Input placeholder="name" {...field} />}
              />
              <Controller
                control={control}
                name={`socialLinks.${index}.url`}
                render={({ field }) => <Input placeholder="https://medium.com" {...field} />}
              />
              <Tooltip title="Delete">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <DeleteIcon className="size-4" />
                </button>
              </Tooltip>
            </div>
          </Fragment>
        ))}

        <IconButton variant="outline" onClick={handleAdd} type="button" icon={PlusIcon}>
          Add
        </IconButton>
      </SectionBody>
    </Section>
  );
};

export default SocialLinksSection;
