import { Font } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";

/**
 * Font registration for every PDF template. Importing this module is what makes
 * the families below available, so each template only has to name them.
 *
 * `SANS` and `SERIF` are *stacks*, not names: @react-pdf resolves a style's
 * families per glyph, so a run of Chinese inside an English line falls through to
 * the CJK face while the Latin around it stays in Noto Sans. The stacks start
 * Latin-only and gain the CJK face the first time a resume needs one — see
 * `applyResumeFonts`.
 */

/**
 * The CJK face is the one font this app does not ship.
 *
 * The two files behind it are 5.7MB and 5.8MB — four times everything else in
 * `public/` put together — and they are upstream release artifacts that never
 * change, which is the shape a CDN is for and the shape a repository is not. The
 * ref is a *tag*, not a branch: `Sans2.004` is a released version of Noto Sans
 * CJK and its bytes cannot move under us, which a `main` URL's could.
 *
 * The cost, stated plainly: the editor reaches a third party the first time it
 * meets a Chinese character, and a Chinese resume cannot be exported offline.
 * The Latin faces stay in `public/`, so an English one still can.
 */
const CJK_DIR = "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/TC";

/** Every file behind a face, named once for the two consumers that need them. */
const FILES = {
  sansRegular: "/fonts/NotoSans-Regular.ttf",
  sansBold: "/fonts/NotoSans-Bold.ttf",
  serifBold: "/fonts/NotoSerif-Bold.ttf",
  cjkRegular: `${CJK_DIR}/NotoSansTC-Regular.otf`,
  cjkBold: `${CJK_DIR}/NotoSansTC-Bold.otf`,
} as const;

Font.register({
  family: "Noto Serif",
  src: FILES.serifBold,
  fontWeight: "bold",
});
Font.register({
  family: "Noto Sans",
  fonts: [{ src: FILES.sansRegular }, { src: FILES.sansBold, fontWeight: "bold" }],
});

const CJK_SANS = "Noto Sans TC";

export const SANS = ["Noto Sans"];
export const SERIF = ["Noto Serif"];

/**
 * What the templates get for Chinese, in both slots.
 *
 * The Latin faces shipped here are the Noto *latin* subsets — 3,000 characters,
 * not one of them Han — so every Chinese character used to come out as `.notdef`,
 * which @react-pdf draws with a zero advance: the whole word piled up on a single
 * x and the line ran through it. This is the face that carries them.
 *
 * The serif stack falls back to the same sans face rather than to Noto Serif TC.
 * A second CJK file is another 8MB for what is only ever bold display type, and a
 * Chinese heading set in the sans next to serif Latin reads as a deliberate pair
 * — which is how mixed-script typography usually resolves this anyway.
 */
const registerCjk = () => {
  Font.register({
    family: CJK_SANS,
    fonts: [{ src: FILES.cjkRegular }, { src: FILES.cjkBold, fontWeight: "bold" }],
  });

  SANS.push(CJK_SANS);
  SERIF.push(CJK_SANS);
};

/**
 * Which characters put a resume in reach of the CJK face.
 *
 * Not a language check, and deliberately not one: what decides this is whether
 * the Latin files have the glyph, character by character. An English resume with
 * a single Chinese company name in it needs the face for exactly that name, and
 * that is the case any "which language is this document" answer gets wrong — so
 * this is a script test rather than the Language Detector API or a detection
 * library.
 *
 * Wider than `HAN` in the scorer, which answers a different question again: which
 * verb list judges a line. Punctuation says nothing about that, but 「，。」 are as
 * absent from the Latin subsets as the ideographs are.
 *
 * `scx=Han` is Unicode's own answer for the ideographs — Extension A and B and
 * the compatibility forms come with it, and no range in here is maintained by
 * hand. What it does not carry is the punctuation the scripts share, so the CJK
 * symbols block and the fullwidth forms are named beside it, and Bopomofo for
 * zhuyin. The ellipsis and the em dash stay out: the Latin files have both.
 */
const CJK = /[\p{scx=Han}\p{scx=Bopomofo}\u3000-\u303F\uFF00-\uFFEF]/u;

/**
 * The same set as a CSS `unicode-range`, for the sheet's `@font-face` rules.
 *
 * Two halves of one decision, which is why they sit together: a range in one and
 * not the other is a character the PDF renders and the preview does not, and
 * nothing in the suite fails on that. The regex covers the ideographs through
 * `scx=Han`, which CSS has no equivalent of, so the blocks are spelled out here —
 * Extension A, the unified block, the compatibility forms, and the same
 * punctuation, radicals and Bopomofo. Extension B and beyond are outside the BMP,
 * and the face has no glyphs for them either way.
 */
const CJK_RANGE = [
  "U+2E80-303F",
  "U+3100-312F",
  "U+31A0-31BF",
  "U+3400-4DBF",
  "U+4E00-9FFF",
  "U+F900-FAFF",
  "U+FE30-FE4F",
  "U+FF00-FFEF",
].join(", ");

/**
 * The `@font-face` rules the preview sheet declares.
 *
 * The sheet is its own document — that isolation is the point of the iframe — so
 * the app's own stylesheet, and anything `next/font` sets up in it, cannot reach
 * it. It gets these instead, built from the same files @react-pdf registers
 * above, so the screen shows the faces the download embeds.
 *
 * The CJK face is attached to both Latin families rather than named as a third,
 * which is the same per-glyph fallback the stacks make on the PDF side expressed
 * the way CSS does it. `unicode-range` is what keeps it lazy — a browser only
 * fetches a face when a character on the page lands in its range — and doing it
 * here rather than in a style is what makes the sheet independent of *when* the
 * PDF side notices the Chinese.
 *
 * `font-display: swap` on every rule: `auto` means about three seconds of the
 * text being drawn invisibly, which on a 5.7MB face is a sheet with blank lines
 * where the Chinese should be. The Google stylesheet these replaced asked for
 * `swap` too.
 */
const face = (family: string, weight: 400 | 700, src: string, range?: string) => `
      @font-face {
        font-family: "${family}";
        font-weight: ${weight};
        font-display: swap;
        src: url("${src}") format("${src.endsWith(".otf") ? "opentype" : "truetype"}");${
          range ? `\n        unicode-range: ${range};` : ""
        }
      }`;

export const SHEET_FONT_FACES = [
  face("Noto Sans", 400, FILES.sansRegular),
  face("Noto Sans", 700, FILES.sansBold),
  face("Noto Serif", 700, FILES.serifBold),
  face("Noto Sans", 400, FILES.cjkRegular, CJK_RANGE),
  face("Noto Sans", 700, FILES.cjkBold, CJK_RANGE),
  face("Noto Serif", 700, FILES.cjkBold, CJK_RANGE),
].join("");

/**
 * Puts the CJK face in the stacks the first time a resume contains a character
 * that needs it. Every template's `render` runs this before it builds its tree,
 * so whoever renders a resume — the editor, a share link, the download — gets the
 * same answer.
 *
 * It has to be conditional. @react-pdf fetches *every* family a style names
 * before it can lay a page out, whether or not a glyph on that page turns out to
 * need it, and the CJK file is 5.7MB against the Latin subset's 0.6MB. An English
 * resume must not pay for it, so the family is registered — and only then named —
 * when the text asks for it.
 *
 * One way. A resume that loses its last Chinese character keeps the face in the
 * stack for the rest of the session, which costs nothing: a stack entry no glyph
 * reaches is not embedded in the PDF, and the file is already fetched.
 */
export const applyResumeFonts = (resume: Resume) => {
  if (SANS.length > 1) return;
  if (CJK.test(JSON.stringify(resume))) registerCjk();
};

const NO_BREAK_BEFORE = /[，。、；：？！）］｝」』】〕》〉‧・…—～　%％]/;
const NO_BREAK_AFTER = /[（［｛「『【〔《〈]/;

/**
 * Where a line is allowed to break inside a word.
 *
 * Latin keeps the behaviour this project has always had: no hyphenation at all
 * (https://github.com/diegomura/react-pdf/issues/1418). Chinese cannot have that
 * — it is written without spaces, so a whole sentence arrives here as one "word"
 * and a paragraph that never breaks runs straight off the right edge of the page.
 *
 * So a break is offered on either side of every Chinese character, minus the two
 * cases that would be wrong: a closing bracket or a comma may not open a line,
 * and an opening bracket may not end one.
 *
 * The breaks are *empty strings* between the characters rather than the
 * characters alone, and that is the whole trick. @react-pdf reads the gap between
 * two non-empty syllables as a hyphenation point and draws a hyphen at whichever
 * one it breaks on — 「介面規-範」. An empty syllable between them is a zero-width
 * break instead, and because it is empty it adds nothing to the string a text
 * extractor pulls back out. It is the same shape as the Latin case's `["", word,
 * ""]`, which is what has been disabling hyphenation here all along.
 */
const hyphenate = (word: string) => {
  if (!CJK.test(word)) return ["", word, ""];

  const characters = [...word];
  const parts: string[] = [""];

  characters.forEach((character, index) => {
    const next = characters[index + 1];

    parts.push(character);

    // Latin inside a Chinese sentence still breaks only at its spaces, so a gap
    // is only a break if the character on one side of it is Chinese.
    const breakable =
      next !== undefined &&
      (CJK.test(character) || CJK.test(next)) &&
      !NO_BREAK_AFTER.test(character) &&
      !NO_BREAK_BEFORE.test(next);

    if (breakable) parts.push("");
  });

  return parts;
};

Font.registerHyphenationCallback(hyphenate);
