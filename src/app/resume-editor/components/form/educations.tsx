import { FC } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { LabeledDatePickerField } from "./labeled-date-picker-field";
import { LabeledInputField } from "./labeled-input-field";
import VisibleSwitch from "./visible-switch";
import { Section, SectionBody, SectionTitle } from "./section";
import { PlusIcon } from "@/components/icons/plus";

const Educations: FC = () => {
  const { control, watch } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "educations",
  });
  const visible = watch("visibility.educations");

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
    <Section className={cn(!visible && "opacity-50")}>
      <SectionTitle index="07">
        <span>Educations</span>
        <Controller
          control={control}
          name="visibility.educations"
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </SectionTitle>
      <SectionBody>
        {fields.map((field, index) => (
          <div key={field.id} className="border-dotted border-b-2 pb-4">
            <div className="mt-4 grid xl:grid-cols-2 grid-cols-1 gap-4">
              <Controller
                control={control}
                name={`educations.${index}.degree`}
                render={({ field }) => (
                  <LabeledInputField label="Degree" placeholder="Degree" {...field} />
                )}
              />
              <Controller
                control={control}
                name={`educations.${index}.school`}
                render={({ field }) => (
                  <LabeledInputField label="School" placeholder="School" {...field} />
                )}
              />
              <Controller
                control={control}
                name={`educations.${index}.major`}
                render={({ field }) => (
                  <LabeledInputField label="Major" placeholder="Major" {...field} />
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
            </div>

            <Tooltip title="Delete">
              <Button
                variant="outline"
                type="button"
                onClick={() => remove(index)}
                className="mt-4"
              >
                <FaTrash className="mr-2 size-4" /> Delete
              </Button>
            </Tooltip>
          </div>
        ))}

        <Button variant="outline" onClick={handleAdd} type="button">
          <PlusIcon className="mr-2 size-4" />
          Add
        </Button>
      </SectionBody>
    </Section>
  );
};

export default Educations;
