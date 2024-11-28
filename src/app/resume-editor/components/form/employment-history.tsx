import { FC } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FaPlus, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { LabeledDatePickerField } from "./labeled-date-picker-field";
import { LabeledInputField } from "./labeled-input-field";
import { LabeledBulletTextAreaField } from "./labeled-bullet-textarea-field";
import VisibleSwitch from "./visible-switch";
import { SectionBody, SectionCard, SectionTitle } from "./section-card";

const EmploymentHistory: FC = () => {
  const { control, watch } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "employmentHistory",
  });
  const visible = watch("visibility.employmentHistory");

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
    <SectionCard className={cn(!visible && "opacity-50")}>
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
                  <LabeledInputField
                    label="Company"
                    placeholder="Company"
                    {...field}
                  />
                )}
              />
              <Controller
                control={control}
                name={`employmentHistory.${index}.jobTitle`}
                render={({ field }) => (
                  <LabeledInputField
                    label="Job title"
                    placeholder="Software Engineer"
                    {...field}
                  />
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
                    label="Description"
                    onChange={field.onChange}
                    value={field.value}
                    className="xl:col-span-2"
                  />
                )}
              />
            </div>
            <Tooltip title="Delete">
              <Button
                variant="outline"
                onClick={() => remove(index)}
                className="mt-4"
              >
                <FaTrash className="mr-2 size-4" /> Delete
              </Button>
            </Tooltip>
          </div>
        ))}

        <Button variant="outline" onClick={handleAdd} type="button">
          <FaPlus className="mr-2 size-4" />
          Add
        </Button>
      </SectionBody>
    </SectionCard>
  );
};

export default EmploymentHistory;
