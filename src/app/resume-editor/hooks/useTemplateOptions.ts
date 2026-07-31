import { useState } from "react";
import { ColorResult } from "@uiw/react-color";

import { DEFAULT_TEMPLATE_ID, getTemplate } from "../components/template/registry";

/**
 * The preview's presentation state: which template renders the resume, and the
 * colour it is tinted with.
 *
 * The two templates tint different areas — a full-height sidebar versus a light
 * contact panel — so a colour chosen for one rarely suits the other. Switching
 * template therefore resets the colour to that template's own default instead of
 * carrying the previous choice over.
 */
const useTemplateOptions = () => {
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [backgroundColor, setBackgroundColor] = useState(
    getTemplate(DEFAULT_TEMPLATE_ID).defaultColor,
  );
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  const selectTemplate = (id: string) => {
    setTemplateId(id);
    setBackgroundColor(getTemplate(id).defaultColor);
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
