import { FC, Fragment } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import VisibleSwitch from "./visible-switch";
import { Section, SectionBody, SectionTitle } from "./section";
import { PlusIcon } from "@/components/icons/plus";

const Skills: FC = () => {
  const { control, watch } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });
  const visible = watch("visibility.skills");

  const handleAdd = () => {
    append({ name: "" });
  };

  return (
    <Section className={cn(!visible && "opacity-50")}>
      <SectionTitle index="04">
        <span>Skills</span>
        <Controller
          control={control}
          name="visibility.skills"
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </SectionTitle>
      <SectionBody>
        {fields.map((field, index) => (
          <Fragment key={field.id}>
            <div className="mt-4 flex gap-4">
              <Controller
                control={control}
                name={`skills.${index}.name`}
                render={({ field }) => <Input {...field} />}
              />
              <Tooltip title="Delete">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <FaTrash />
                </button>
              </Tooltip>
            </div>
          </Fragment>
        ))}

        <Button variant="outline" onClick={handleAdd} type="button">
          <PlusIcon className="mr-2 size-4" />
          Add
        </Button>
      </SectionBody>
    </Section>
  );
};

export default Skills;
