import { FC, useEffect, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Pencil } from "lucide-react";

import { Resume } from "@/types/resume";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DeleteIcon } from "@/components/icons/delete";
import { IconButton } from "@/components/ui/icon-button";

import { LabeledBulletTextAreaField } from "./labeled-bullet-textarea-field";
import VisibleSwitch from "./visible-switch";
import { Section, SectionBody, SectionTitle } from "./section";

/** Shown while the heading is empty, and the width the input opens at. */
const HEADING_PLACEHOLDER = "Certifications";

/**
 * What a section is called the moment it is added.
 *
 * A new section used to arrive with no name at all, which left the form showing an
 * empty box where every other section shows a heading, and left the section itself
 * off the sheet until it was named. A placeholder cannot carry that: it is not a
 * value, so nothing downstream — the reorder list, the export, the sheet — can read
 * it. This is a real title, so the section is a whole section from its first frame,
 * and the input it opens on has it selected, so naming it is still one word typed
 * over rather than a field to clear first. Deliberately not one of the names people
 * actually use ("Certifications", "Awards"): a default that claims something is on
 * the resume when nothing was typed is worse than one that plainly asks to be
 * renamed.
 */
export const DEFAULT_CUSTOM_SECTION_TITLE = "New section";

/**
 * One section the user named themselves.
 *
 * The six built-in sections each have their own component because each has its
 * own fields — a school has a degree, a job has dates. A custom section has none
 * of that on purpose: a heading and a list is the shape every one of the sections
 * people ask for actually takes (Certifications, Awards, Languages, Volunteering,
 * Talks), and giving it fields would mean deciding which of those it was.
 *
 * The heading is edited in the heading. It began as a labelled field in the body
 * like every other input here, which put the same words on the screen twice —
 * "Certifications" as the section's title and "Certifications" again in a box
 * underneath it, with no way to tell which one the sheet would use. The title is
 * the field; the pencil beside it is how you say so.
 */
const CustomSectionFields: FC<{ index: number; autoFocusHeading?: boolean }> = ({
  index,
  autoFocusHeading,
}) => {
  const { control, watch } = useFormContext<Resume>();
  const visible = watch(`customSections.${index}.visible`);
  const title = watch(`customSections.${index}.title`);

  /* A section opens on the input when it was just added — the name it arrived with
     is a default asking to be replaced — and whenever it has no name at all, since
     a pencil beside "Untitled section" is one more click to reach the only thing
     that can be done next. */
  const [renaming, setRenaming] = useState(() => !title?.trim() || !!autoFocusHeading);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Focus is taken only when the user asked for the input — by pressing Add or
     the pencil. Doing it whenever the input happens to be showing would pull the
     caret across the page on every reload of a document with an unnamed section. */
  const takeFocus = useRef(!!autoFocusHeading);
  useEffect(() => {
    if (!renaming || !takeFocus.current) return;

    takeFocus.current = false;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [renaming]);

  const stopRenaming = () => {
    // Nothing to fall back to while it is unnamed, so the input stays.
    if (inputRef.current?.value.trim()) setRenaming(false);
  };

  return (
    <Section className={cn(!visible && "opacity-50")}>
      <SectionTitle>
        {/* One child rather than two, so the eye keeps the `[&>button]:ml-auto`
            that pushes it to the far end — a pencil sitting next to the eye would
            be a control for the section rather than for its name. */}
        <span className="flex min-w-0 items-center gap-2">
          {renaming ? (
            <Controller
              control={control}
              name={`customSections.${index}.title`}
              render={({ field }) => (
                <input
                  {...field}
                  ref={inputRef}
                  aria-label="Section heading"
                  placeholder={HEADING_PLACEHOLDER}
                  /* The field is drawn entirely in paint, never in layout.
                     `ring` and `outline` are box-shadow and outline underneath —
                     neither takes space — so the fill and its border sit 6px
                     around the title without a padding, a border or a taller box
                     between them and the text. Press the pencil and the field
                     appears around the word; nothing on the page moves by a pixel.

                     Both are the colours `components/ui/input` uses — `bg-card`
                     behind, `border-input` around it, `foreground/60` when it has
                     focus — because this is one of this form's fields and should
                     not be a second idea of what one looks like. They are set at
                     the same distance so the line lands on the fill's own edge
                     rather than a ring outside a ring.

                     The rest is the same promise from the other two directions.
                     `font: inherit` takes the h2's face, size and weight, so the
                     first letter stays where it was. The height is pinned to the
                     `1em` line box the title occupied, because an input is
                     otherwise taller than its text by whatever the browser thinks
                     a field should be — and those few pixels push every section
                     below this one down the page.

                     `size` makes it hug the word rather than reserve a column: it
                     grows as you type, and the eye beside it is pushed to the far
                     end by `ml-auto`, so it does not move with it. The floor is
                     the placeholder, which is otherwise clipped on a section that
                     has not been named yet. */
                  size={Math.max((field.value?.length ?? 0) + 1, HEADING_PLACEHOLDER.length)}
                  style={{ font: "inherit", letterSpacing: "inherit", height: "1em" }}
                  className="w-auto rounded-sm border-0 bg-transparent p-0 leading-none outline outline-1 outline-offset-[6px] outline-input ring-[6px] ring-card placeholder:text-muted-foreground/70 focus:outline-foreground/60"
                  onKeyDown={(event) => {
                    /* Both keys mean "done": every field in this form is saved as
                       it is typed, so there is no draft for Escape to throw away
                       and pretending otherwise would be the surprise. */
                    if (event.key === "Enter" || event.key === "Escape") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  onBlur={() => {
                    field.onBlur();
                    stopRenaming();
                  }}
                />
              )}
            />
          ) : (
            <>
              <span className="truncate">{title.trim()}</span>
              <Tooltip title="Rename section">
                <button
                  type="button"
                  // The tooltip renders in a portal, so it names nothing for a
                  // screen reader — this button's only content is an icon.
                  aria-label="Rename section"
                  onClick={() => {
                    takeFocus.current = true;
                    setRenaming(true);
                  }}
                >
                  <Pencil className="size-4" />
                </button>
              </Tooltip>
            </>
          )}
        </span>

        <Controller
          control={control}
          name={`customSections.${index}.visible`}
          render={({ field }) => <VisibleSwitch {...field} />}
        />
      </SectionTitle>

      <SectionBody>
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
