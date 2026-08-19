import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { ColorResult } from "@uiw/react-color";

import { trackEvent } from "@/lib/analytics";
import { readAppearanceRequest } from "@/lib/appearance-link";

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

  /**
   * The appearance the landing page's preview was showing, if the visitor arrived
   * on one of its links. It wins over what is in storage — the sheet they were
   * looking at when they clicked is a fresher statement of intent than a template
   * chosen on some earlier visit.
   *
   * Read from `window.location` rather than `useSearchParams`, which would put a
   * Suspense boundary around a page that is already client-only, and applied in an
   * effect so the write happens once instead of on every render.
   *
   * The params are stripped afterwards, and that is not tidying: leaving them in
   * the address bar would make every later reload of the tab re-apply the landing
   * page's choice over whatever template the user had since picked in the panel.
   */
  useEffect(() => {
    const requested = readAppearanceRequest(window.location.search);
    if (!requested || !isAppearance(requested)) return;

    setStored(requested);
    window.history.replaceState(null, "", window.location.pathname);
  }, [setStored]);

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
    trackEvent("template_selected", { template: id });
  };

  /* The colour goes out as which template it was chosen for and whether it came
     from a swatch or the picker — never the hex. A custom colour is a handful of
     bits about one person's taste, and this is the app that does not collect
     things about one person. Which templates people reach past the presets for
     is the question worth asking anyway.

     Once per visit to the picker, not once per change: the picker fires on every
     frame of a drag across the saturation square, and a hundred identical events
     for one colour is both noise and a bill. The flag resets when the picker is
     opened again, so a second colour later in the session still counts. */
  const pickerTracked = useRef(false);

  const changeColor = (color: string, source: "swatch" | "custom") => {
    setBackgroundColor(color);

    if (source === "custom") {
      if (pickerTracked.current) return;
      pickerTracked.current = true;
    }

    trackEvent("color_changed", { template: templateId, source });
  };

  return {
    template: getTemplate(templateId),
    selectTemplate,
    backgroundColor,
    /** For the preset swatches, which already know their own hex. */
    selectColor: (color: string) => changeColor(color, "swatch"),
    displayColorPicker,
    toggleColorPicker: () =>
      setDisplayColorPicker((shown) => {
        if (!shown) pickerTracked.current = false;

        return !shown;
      }),
    changeBackgroundColor: (color: ColorResult) => changeColor(color.hex, "custom"),
  };
};

export default useTemplateOptions;
