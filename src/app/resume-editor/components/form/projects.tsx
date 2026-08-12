import { FC, useState } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { LabeledInputField } from "./labeled-input-field";
import { LabeledBulletTextAreaField } from "./labeled-bullet-textarea-field";
import RewritePopover from "./rewrite-popover";
import VisibleSwitch from "./visible-switch";
import { Section, SectionBody, SectionTitle } from "./section";
import { PlusIcon } from "@/components/icons/plus";
import { DeleteIcon } from "@/components/icons/delete";
import { IconButton } from "@/components/ui/icon-button";

const Projects: FC = () => {
  const { control, watch, getValues } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "projects",
  });
  const visible = watch("visibility.projects");

  // Same remount trick as the employment description — see EmploymentHistory.
  const [applied, setApplied] = useState<Record<number, number>>({});

  const handleAdd = () => {
    append({
      name: "",
      url: "",
      description: "",
    });
  };

  return (
    <Section className={cn(!visible && "opacity-50")}>
      <SectionTitle index="06">
        <span>Projects</span>
        <Controller
          control={control}
          name="visibility.projects"
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </SectionTitle>
      <SectionBody>
        {fields.map((field, index) => (
          <div key={field.id} className="border-dotted border-b-2 pb-4">
            <div className="mt-4 grid xl:grid-cols-2 grid-cols-1 gap-4">
              <Controller
                control={control}
                name={`projects.${index}.name`}
                render={({ field }) => (
                  <LabeledInputField label="Project" placeholder="Project name" {...field} />
                )}
              />
              <Controller
                control={control}
                name={`projects.${index}.url`}
                render={({ field }) => (
                  <LabeledInputField
                    label="Link"
                    placeholder="https://github.com/you/project"
                    {...field}
                  />
                )}
              />
              <Controller
                control={control}
                name={`projects.${index}.description`}
                render={({ field }) => (
                  <LabeledBulletTextAreaField
                    key={applied[index] ?? 0}
                    label="Description"
                    onChange={field.onChange}
                    value={field.value}
                    className="xl:col-span-2"
                    action={
                      <RewritePopover
                        section="description"
                        getValue={() => getValues(`projects.${index}.description`)}
                        onApply={(value) => {
                          field.onChange(value);
                          setApplied((previous) => ({
                            ...previous,
                            [index]: (previous[index] ?? 0) + 1,
                          }));
                        }}
                      />
                    }
                  />
                )}
              />
            </div>
            <Tooltip title="Delete">
              <IconButton
                variant="outline"
                type="button"
                onClick={() => remove(index)}
                className="mt-4"
                icon={DeleteIcon}
              >
                Delete
              </IconButton>
            </Tooltip>
          </div>
        ))}

        <IconButton variant="outline" onClick={handleAdd} type="button" icon={PlusIcon}>
          Add
        </IconButton>
      </SectionBody>
    </Section>
  );
};

export default Projects;
