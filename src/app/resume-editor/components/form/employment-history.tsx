import { FC, useState } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { LabeledDatePickerField } from "./labeled-date-picker-field";
import { LabeledInputField } from "./labeled-input-field";
import { LabeledBulletTextAreaField } from "./labeled-bullet-textarea-field";
import RewritePopover from "./rewrite-popover";
import VisibleSwitch from "./visible-switch";
import { Section, SectionBody, SectionTitle } from "./section";
import { PlusIcon } from "@/components/icons/plus";
import { DeleteIcon } from "@/components/icons/delete";
import { IconButton } from "@/components/ui/icon-button";

const EmploymentHistory: FC = () => {
  const { control, watch, getValues } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "employmentHistory",
  });
  const visible = watch("visibility.employmentHistory");

  /*
    Bumped per row when a rewrite is accepted, and mixed into that row's
    description key.

    The description field is `contentEditable` and seeds its lines into state
    once on mount, so writing a new value through react-hook-form alone would
    update the form and leave the text on screen as it was. Remounting is what
    makes the accepted rewrite visible. It is scoped to the one row so typing in
    a sibling description is never interrupted, and it is deliberately not tied
    to the value itself — keying on that would remount the field on every
    keystroke and lose the caret.
  */
  const [applied, setApplied] = useState<Record<number, number>>({});

  const handleAdd = () => {
    append({
      company: "",
      jobTitle: "",
      timeline: {
        from: "",
        to: "",
      },
      description: "",
    });
  };

  return (
    <Section className={cn(!visible && "opacity-50")}>
      <SectionTitle>
        <span>Employment History</span>
        <Controller
          control={control}
          name="visibility.employmentHistory"
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </SectionTitle>
      <SectionBody>
        {fields.map((field, index) => (
          <div key={field.id} className="border-dotted border-b-2 pb-4">
            <div className="mt-4 grid xl:grid-cols-2 grid-cols-1 gap-4">
              <Controller
                control={control}
                name={`employmentHistory.${index}.company`}
                render={({ field }) => (
                  <LabeledInputField label="Company" placeholder="Company" {...field} />
                )}
              />
              <Controller
                control={control}
                name={`employmentHistory.${index}.jobTitle`}
                render={({ field }) => (
                  <LabeledInputField label="Job title" placeholder="Software Engineer" {...field} />
                )}
              />
              <Controller
                control={control}
                name={`employmentHistory.${index}.timeline`}
                render={({ field }) => (
                  <LabeledDatePickerField
                    label="Date"
                    switchText="Present"
                    onChange={field.onChange}
                    value={field.value}
                  />
                )}
              />
              <Controller
                control={control}
                name={`employmentHistory.${index}.description`}
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
                        getValue={() => getValues(`employmentHistory.${index}.description`)}
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

export default EmploymentHistory;
