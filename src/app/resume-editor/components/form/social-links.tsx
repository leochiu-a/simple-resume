import { FC, Fragment } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { FaPlus, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";

import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";

const SocialLinksSection: FC = () => {
  const { control } = useFormContext<Resume>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socialLinks",
  });

  const handleAdd = () => {
    append({ name: "", url: "" });
  };

  return (
    <>
      <Typography variant="h4">Website & Social links</Typography>
      <div className="mb-8 mt-4 space-y-4">
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

        <Button variant="ghost" onClick={handleAdd} type="button">
          <FaPlus className="mr-2 size-4" />
          Add
        </Button>
      </div>
    </>
  );
};

export default SocialLinksSection;
