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
    fonts: [
      { src: "/fonts/NotoSansTC-Regular.otf" },
      { src: "/fonts/NotoSansTC-Bold.otf", fontWeight: "bold" },
    ],
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

const NO_BREAK_BEFORE = /[，。、；：？！）］｝」』】〕》〉‧・…—～　%]/;
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
export const hyphenate = (word: string) => {
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
