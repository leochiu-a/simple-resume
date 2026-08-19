/**
 * The document every rendered sheet lives in.
 *
 * A template is a tree of @react-pdf primitives, which the browser knows nothing
 * about — so it is rendered inside an iframe rather than the page. That buys two
 * things: the app's own stylesheet (and its dark mode) cannot reach the sheet, and
 * the webfonts the PDF embeds are the ones the screen shows.
 *
 * Shared by the full-size preview and the picker's thumbnails, so the small copies
 * are the same rendering as the big one, only scaled down.
 */
export const SHEET_DOCUMENT = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      /* The very files the PDF embeds, rather than Google's copies of the same
         families: what the sheet is for is showing what will be downloaded, and
         Google serves a variable face across 100..900 while the PDF has exactly
         these three weights. The three Latin ones are served from this app, so a
         resume with no Chinese in it still renders offline.

         font-display on every rule, because auto means a block period of about
         three seconds: on the CJK face below — 5.7MB from a CDN — that is a sheet
         whose Chinese is blank until the whole file lands. swap paints it in a
         system face first and swaps when the real one arrives. */
      @font-face {
        font-family: "Noto Sans";
        font-weight: 400;
        font-display: swap;
        src: url("/fonts/NotoSans-Regular.ttf") format("truetype");
      }
      @font-face {
        font-family: "Noto Sans";
        font-weight: 700;
        font-display: swap;
        src: url("/fonts/NotoSans-Bold.ttf") format("truetype");
      }
      @font-face {
        font-family: "Noto Serif";
        font-weight: 700;
        font-display: swap;
        src: url("/fonts/NotoSerif-Bold.ttf") format("truetype");
      }

      /* Chinese, attached to both Latin families so it is found whichever one a
         template names — the same fallback @react-pdf makes per glyph on the PDF
         side, expressed the way CSS does it. Same URLs as fonts.ts registers,
         so the sheet and the download share one fetch and one cache entry.

         The unicode-range is what keeps it lazy, and it has to be: the file is
         5.7MB, and a browser only fetches a face when a character on the page
         actually lands in its range. Doing it here rather than by naming the
         family in a style is also what makes it independent of *when* the PDF
         side notices the Chinese — a sheet already on screen picks the face up
         on the character that needs it.

         The ranges are the CSS half of the CJK test in fonts.ts. Edit one and
         edit the other: the two disagreeing is a character the PDF renders and
         the sheet does not, which nothing here would fail on. */
      @font-face {
        font-family: "Noto Sans";
        font-weight: 400;
        font-display: swap;
        src: url("https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/TC/NotoSansTC-Regular.otf")
          format("opentype");
        unicode-range: U+2E80-303F, U+3100-312F, U+31A0-31BF, U+3400-4DBF, U+4E00-9FFF,
          U+F900-FAFF, U+FE30-FE4F, U+FF00-FFEF;
      }
      @font-face {
        font-family: "Noto Sans";
        font-weight: 700;
        font-display: swap;
        src: url("https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/TC/NotoSansTC-Bold.otf")
          format("opentype");
        unicode-range: U+2E80-303F, U+3100-312F, U+31A0-31BF, U+3400-4DBF, U+4E00-9FFF,
          U+F900-FAFF, U+FE30-FE4F, U+FF00-FFEF;
      }
      @font-face {
        font-family: "Noto Serif";
        font-weight: 700;
        font-display: swap;
        src: url("https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@Sans2.004/Sans/SubsetOTF/TC/NotoSansTC-Bold.otf")
          format("opentype");
        unicode-range: U+2E80-303F, U+3100-312F, U+31A0-31BF, U+3400-4DBF, U+4E00-9FFF,
          U+F900-FAFF, U+FE30-FE4F, U+FF00-FFEF;
      }

      /* @react-pdf's primitives land here as unknown elements, so they carry no
         layout of their own. Letting the sheet stretch is what allows a template's
         full-height sidebar to reach the bottom of the last page instead of
         stopping where the text happens to end. */
      document { display: flex; flex-direction: column; flex: 1 0 auto; }
      page { flex: 1 0 auto; }

      /* @react-pdf breaks a Text on a literal newline; the browser would
         collapse one to a space, so the preview needs telling. pre-line rather
         than pre-wrap: only the newlines are significant, and the templates
         indent their JSX, so the leading whitespace that comes with it must
         still collapse. */
      text { white-space: pre-line; }
    </style>
  </head>
  <body style="margin: 0;">
    <div></div>
  </body>
</html>
`;
