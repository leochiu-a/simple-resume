import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { ColorResult } from "@uiw/react-color";

import { DEFAULT_TEMPLATE_ID, getTemplate, TEMPLATES } from "../components/template/registry";

/**
 * The preview's presentation state: which template renders the resume, and the
 * colour it is tinted with.
 *
 * The templates tint different areas — a full-height sidebar, a light contact
 * panel, the name — so a colour chosen for one rarely suits another. Switching
 * template therefore resets the colour to that template's own default instead of
 * carrying the previous choice over.
 *
 * The choice outlives the tab, next to the resume it presents: picking a template
 * is a decision about your own document, and having it snap back to Classic on
 * every reload made it feel like a preview toggle instead.
 */

export const APPEARANCE_STORAGE_KEY = "resume-appearance";

interface Appearance {
  templateId: string;
  backgroundColor: string;
}

const defaultAppearance = (id: string = DEFAULT_TEMPLATE_ID): Appearance => ({
  templateId: id,
  backgroundColor: getTemplate(id).defaultColor,
});

/**
 * What comes back out of storage, which is not to be trusted: it was written by an
 * older release, or hand-edited, or belongs to a template that has since been
 * removed from the registry.
 *
 * A stale `templateId` is the interesting case. `getTemplate` already falls back
 * to Classic for an unknown id, but the stored colour would then be one chosen for
 * a template nobody can see any more — so the pair is discarded together rather
 * than half-honoured.
 */
const isAppearance = (value: unknown): value is Appearance => {
  if (typeof value !== "object" || value === null) return false;

  const { templateId, backgroundColor } = value as Partial<Appearance>;

  return (
    typeof backgroundColor === "string" &&
    backgroundColor !== "" &&
    TEMPLATES.some((template) => template.id === templateId)
  );
};

const useTemplateOptions = () => {
  const [stored, setStored] = useLocalStorage<Appearance>(
    APPEARANCE_STORAGE_KEY,
    defaultAppearance(),
  );

  const { templateId, backgroundColor } = isAppearance(stored) ? stored : defaultAppearance();

  /* Not persisted: whether the custom-colour picker is open is a property of this
     visit to the panel, not of the resume. Restoring it would reopen the picker
     over a sheet the user had already finished with. */
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  /* Written from the validated `templateId` rather than by spreading what is in
     storage: a rejected entry is on screen as its fallback, and spreading would
     carry the id that was rejected back into the next write. */
  const setBackgroundColor = (color: string) => setStored({ templateId, backgroundColor: color });

  const selectTemplate = (id: string) => {
    // Written as one entry rather than two, so a reload cannot land on the new
    // template still carrying the previous one's colour.
    setStored(defaultAppearance(id));
    setDisplayColorPicker(false);
  };

  return {
    template: getTemplate(templateId),
    selectTemplate,
    backgroundColor,
    /** For the preset swatches, which already know their own hex. */
    selectColor: setBackgroundColor,
    displayColorPicker,
    toggleColorPicker: () => setDisplayColorPicker((shown) => !shown),
    changeBackgroundColor: (color: ColorResult) => setBackgroundColor(color.hex),
  };
};

export default useTemplateOptions;
