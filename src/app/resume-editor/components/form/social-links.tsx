import { FC, Fragment } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FaPlus, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import VisibleSwitch from "./visible-switch";
import { SectionBody, SectionCard, SectionTitle } from "./section-card";

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
    <SectionCard className={cn(!visible && "opacity-50")}>
      <SectionTitle>
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
                render={({ field }) => (
                  <Input placeholder="https://medium.com" {...field} />
                )}
              />
              <Tooltip title="Delete">
                <button onClick={() => remove(index)}>
                  <FaTrash />
                </button>
              </Tooltip>
            </div>
          </Fragment>
        ))}

        <Button variant="outline" onClick={handleAdd} type="button">
          <FaPlus className="mr-2 size-4" />
          Add
        </Button>
      </SectionBody>
    </SectionCard>
  );
};

export default SocialLinksSection;
