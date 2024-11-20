import { FC, Fragment } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FaPlus, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";

import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import VisibleSwitch from "./visible-switch";

const Skills: FC = () => {
  const { control } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });

  const handleAdd = () => {
    append({ name: "" });
  };

  return (
    <>
      <Typography variant="h4" className="flex items-center gap-2">
        <span>Skills</span>
        <Controller
          control={control}
          name="visibility.skills"
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </Typography>
      <div className="mb-8 mt-4 space-y-4">
        {fields.map((field, index) => (
          <Fragment key={field.id}>
            <div className="mt-4 flex gap-4">
              <Controller
                control={control}
                name={`skills.${index}.name`}
                render={({ field }) => <Input {...field} />}
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
      </div>
    </>
  );
};

export default Skills;
