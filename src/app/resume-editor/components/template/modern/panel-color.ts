/**
 * The sidebar of this template is a light panel, but the colour picker is shared
 * with the Classic template and defaults to a dark green. Rather than ignore the
 * picked colour, the panel keeps it and flips its own text between ink and white
 * so the contact details stay readable either way.
 */

export const DEFAULT_PANEL_COLOR = "#f2f2f2";

const INK = "#2e404a";
const PAPER = "#ffffff";

const parseHex = (value: string) => {
  const hex = value.replace("#", "").trim();
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => char + char)
          .join("")
      : hex;

  if (!/^[\da-f]{6}$/i.test(full)) return null;

  return [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255);
};

/** sRGB relative luminance, per WCAG 2.1. */
const luminance = (channels: number[]) => {
  const [r, g, b] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export interface PanelColors {
  background: string;
  /** Text, section rules and the contact icon discs. */
  text: string;
}

/**
 * The icon glyphs are punched out of their disc in the panel colour, so the
 * background doubles as the glyph fill — the same relationship the reference
 * design uses.
 */
const panelColors = (backgroundColor: string): PanelColors => {
  const channels = parseHex(backgroundColor);
  const isLight = channels === null || luminance(channels) > 0.4;

  return { background: backgroundColor, text: isLight ? INK : PAPER };
};

export default panelColors;
