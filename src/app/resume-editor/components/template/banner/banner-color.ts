/**
 * The band across the top of the sheet is the one thing on this template the
 * picked colour fills, and the name and contact details are printed on it. The
 * picker is shared with every other template, so that colour arrives as anything
 * from Classic's near-black green to Modern's near-white grey — and either end
 * has to stay readable.
 *
 * So the band keeps whatever colour it is given and flips its own text between
 * ink and paper, the same bargain `modern/panel-color.ts` strikes for its
 * sidebar. The two are deliberately separate copies: each template owns its own
 * look, and a shared helper would tie the band's threshold to the sidebar's.
 */

/** A deep navy: the band is the whole design, so it starts on a colour worth filling it with. */
export const DEFAULT_BANNER_COLOR = "#1f3a5f";

const INK = "rgb(2, 6, 27)";
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

export interface BannerColors {
  background: string;
  /** The name, the wanted job and the contact details. */
  text: string;
  /**
   * The rule under the name and the dots between contact details.
   *
   * They have to read as quieter than the text without being a third colour: a
   * grey chosen for a dark band disappears on a light one. Ink and paper at a
   * fraction of their opacity stay in the same relationship to the band whatever
   * it is filled with.
   */
  muted: string;
}

const bannerColors = (backgroundColor: string): BannerColors => {
  const channels = parseHex(backgroundColor);
  const isLight = channels === null || luminance(channels) > 0.4;

  return {
    background: backgroundColor,
    text: isLight ? INK : PAPER,
    muted: isLight ? "rgba(2, 6, 27, 0.45)" : "rgba(255, 255, 255, 0.55)",
  };
};

export default bannerColors;
