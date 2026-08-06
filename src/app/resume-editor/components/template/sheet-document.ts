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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <style>
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
