import { FC, Fragment } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FaPlus, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { LabeledDatePickerField } from "./labeled-date-picker-field";
import { LabeledInputField } from "./labeled-input-field";

const Educations: FC = () => {
  const { control } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "educations",
  });

  const handleAdd = () => {
    append({
      school: "",
      degree: "",
      major: "",
      timeline: {
        from: "",
        to: "",
      },
    });
  };

  return (
    <>
      <Typography variant="h4">Educations</Typography>
      <div className="mb-8 mt-4 space-y-4">
        {fields.map((field, index) => (
          <Fragment key={field.id}>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name={`educations.${index}.degree`}
                render={({ field }) => (
                  <LabeledInputField
                    label="Degree"
                    placeholder="Degree"
                    {...field}
                  />
                )}
              />
              <Controller
                control={control}
                name={`educations.${index}.school`}
                render={({ field }) => (
                  <LabeledInputField
                    label="School"
                    placeholder="School"
                    {...field}
                  />
                )}
              />
              <Controller
                control={control}
                name={`educations.${index}.major`}
                render={({ field }) => (
                  <LabeledInputField
                    label="Major"
                    placeholder="Major"
                    {...field}
                  />
                )}
              />
              <Controller
                control={control}
                name={`educations.${index}.timeline`}
                render={({ field }) => (
                  <LabeledDatePickerField
                    label="Date"
                    switchText="In school"
                    onChange={field.onChange}
                    value={field.value}
                  />
                )}
              />
              <Tooltip title="Delete">
                <button onClick={() => remove(index)} className="max-w-max">
                  <FaTrash />
                </button>
              </Tooltip>
            </div>
          </Fragment>
        ))}

        <Button variant="ghost" onClick={handleAdd} type="button">
          <FaPlus className="mr-2 size-4" />
          Add
        </Button>
      </div>
    </>
  );
};

export default Educations;
