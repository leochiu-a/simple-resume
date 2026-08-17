/**
 * The appearance the landing page's preview was showing, carried into the editor
 * on the link that opens it.
 *
 * Without this, clicking through from the gallery — having just picked a template
 * and a tint and watched a sheet render in them — landed on Classic in its own
 * default colour, so the one thing the page had spent a screen asking the visitor
 * to decide was thrown away at the door.
 *
 * The query string is the right carrier: the landing page has no business writing
 * the editor's storage key, and a link that says what it will open is one the
 * visitor can also copy, bookmark or open in a new tab. The tint travels without
 * its `#` so the URL needs no escaping, and nothing here is personal — a template
 * id and six hex digits.
 *
 * The editor consumes the params once, then strips them: see `useTemplateOptions`.
 */

const TEMPLATE_PARAM = "template";
const TINT_PARAM = "tint";

/** Only ever written from `SWATCHES` or a template's `defaultColor`, but it arrives
 *  back as whatever was in the address bar. */
const HEX = /^[0-9a-fA-F]{6}$/;

export interface AppearanceRequest {
  templateId: string;
  backgroundColor: string;
}

export const editorHref = ({ templateId, backgroundColor }: AppearanceRequest) =>
  `/resume-editor?${TEMPLATE_PARAM}=${encodeURIComponent(templateId)}&${TINT_PARAM}=${backgroundColor.replace("#", "")}`;

/**
 * Both halves or neither. A template without its tint would open in that
 * template's default colour rather than the one on screen, which is the same
 * mismatch this exists to remove; a tint without a template has no sheet to
 * belong to. Whether the pair is one the editor can actually render is the
 * caller's question, since only it holds the registry.
 */
export const readAppearanceRequest = (search: string): AppearanceRequest | null => {
  const params = new URLSearchParams(search);
  const templateId = params.get(TEMPLATE_PARAM);
  const tint = params.get(TINT_PARAM);

  if (!templateId || !tint || !HEX.test(tint)) return null;

  return { templateId, backgroundColor: `#${tint}` };
};
