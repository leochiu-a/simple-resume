import { Font } from "@react-pdf/renderer";

/**
 * Font registration for every PDF template. Importing this module is what makes
 * the families below available, so each template only has to name them.
 */

Font.register({
  family: "Noto Serif",
  src: "/fonts/NotoSerif-Bold.ttf",
  fontWeight: "bold",
});
Font.register({
  family: "Noto Sans",
  fonts: [
    {
      src: "/fonts/NotoSans-Regular.ttf",
    },
    {
      src: "/fonts/NotoSans-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});
// https://github.com/diegomura/react-pdf/issues/1418
Font.registerHyphenationCallback((word) => ["", word, ""]);

export const SANS = "Noto Sans";
export const SERIF = "Noto Serif";
