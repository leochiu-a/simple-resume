import { FC, Fragment } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FaPlus, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { LabeledDatePickerField } from "./labeled-date-picker-field";
import { LabeledInputField } from "./labeled-input-field";
import { LabeledBulletTextAreaField } from "./labeled-bullet-textarea-field";

const EmploymentHistory: FC = () => {
  const { control } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "employmentHistory",
  });

  return (
    <>
      <Typography variant="h4">Employment History</Typography>
      <div className="mb-8 mt-4 space-y-4">
        {fields.map((field, index) => (
          <Fragment key={field.id}>
            <div className="mt-4 grid grid-cols-2 gap-4">
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
                    className="col-span-2"
                  />
                )}
              />
            </div>
            <Tooltip title="Delete">
              <button onClick={() => remove(index)} className="max-w-max">
                <FaTrash />
              </button>
            </Tooltip>
          </Fragment>
        ))}

        <Button
          variant="ghost"
          onClick={() =>
            append({
              company: "",
              jobTitle: "",
              timeline: {
                from: "",
                to: "",
              },
              description: "",
            })
          }
        >
          <FaPlus className="mr-2 size-4" />
          Add
        </Button>
      </div>
    </>
  );
};

export default EmploymentHistory;
