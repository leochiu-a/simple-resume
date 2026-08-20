import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DeleteIcon } from "@/components/icons/delete";
import { IconButton } from "@/components/ui/icon-button";

import { LabeledBulletTextAreaField } from "./labeled-bullet-textarea-field";
import VisibleSwitch from "./visible-switch";
import { Section, SectionBody, SectionTitle } from "./section";

/**
 * One section the user named themselves.
 *
 * The six built-in sections each have their own component because each has its own
 * fields — a school has a degree, a job has dates. A custom section has none of
 * that on purpose: a heading and a list is the shape every one of the sections
 * people ask for actually takes (Certifications, Awards, Languages, Volunteering,
 * Talks), and giving it fields would mean deciding which of those it was.
 *
 * The heading doubles as the section's name everywhere else — the numbered title
 * in the form, the row in the reorder list, the `##` in the Markdown export — so
 * it is an input rather than a fixed label, and empty is a state it has to look
 * reasonable in while someone is still typing it.
 */
const CustomSectionFields: FC<{ index: number }> = ({ index }) => {
  const { control, watch } = useFormContext<Resume>();
  const visible = watch(`customSections.${index}.visible`);
  const title = watch(`customSections.${index}.title`);

  return (
    <Section className={cn(!visible && "opacity-50")}>
      <SectionTitle>
        {/* The heading the form shows is the heading the sheet will show, so it is
            the field itself rather than a label over one. */}
        <span className="truncate">{title?.trim() || "Untitled section"}</span>
        <Controller
          control={control}
          name={`customSections.${index}.visible`}
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </SectionTitle>
      <SectionBody>
        <div className="mt-4 space-y-4">
          <Controller
            control={control}
            name={`customSections.${index}.title`}
            render={({ field }) => (
              <div className="space-y-2">
                <label
                  htmlFor={`custom-section-title-${index}`}
                  className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Heading
                </label>
                <Input
                  id={`custom-section-title-${index}`}
                  placeholder="Certifications"
                  {...field}
                />
              </div>
            )}
          />

          <Controller
            control={control}
            name={`customSections.${index}.description`}
            render={({ field }) => (
              <LabeledBulletTextAreaField
                label="Lines"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
        </div>

        <RemoveButton index={index} />
      </SectionBody>
    </Section>
  );
};

/**
 * Deleting takes the section out of `customSections` and leaves its id in
 * `sectionOrder`, which is not an oversight: the order is normalised on every
 * read, and an id naming a section that no longer exists is exactly what that
 * drops. Writing both would mean two edits that have to agree.
 */
const RemoveButton = ({ index }: { index: number }) => {
  const { getValues, setValue } = useFormContext<Resume>();

  const remove = () => {
    const sections = getValues("customSections") ?? [];

    setValue(
      "customSections",
      sections.filter((_, position) => position !== index),
      { shouldDirty: true },
    );
  };

  return (
    <Tooltip title="Delete">
      <IconButton
        variant="outline"
        type="button"
        onClick={remove}
        className="mt-4"
        icon={DeleteIcon}
      >
        Delete
      </IconButton>
    </Tooltip>
  );
};

export default CustomSectionFields;
