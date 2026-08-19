import { expect, test } from "@playwright/test";

import { styles as banner } from "../src/app/resume-editor/components/template/banner/styles";
import { styles as classic } from "../src/app/resume-editor/components/template/classic/styles";
import { styles as compact } from "../src/app/resume-editor/components/template/compact/styles";
import { styles as dated } from "../src/app/resume-editor/components/template/dated/styles";
import { styles as formal } from "../src/app/resume-editor/components/template/formal/styles";
import { styles as ledger } from "../src/app/resume-editor/components/template/ledger/styles";
import { styles as modern } from "../src/app/resume-editor/components/template/modern/styles";
import { styles as timeline } from "../src/app/resume-editor/components/template/timeline/styles";

/**
 * A `lineHeight` without a `fontSize` beside it is a PDF that does not match the
 * preview.
 *
 * @react-pdf resolves a unitless `lineHeight` against its own default of 18pt
 * when the same style block does not name a size. Inheritance still supplies the
 * size the glyphs are *drawn* at, so the type looks right and only the leading is
 * wrong — and CSS has no such split, so the preview goes on showing the intended
 * spacing while the PDF sets the paragraph at nearly twice it.
 *
 * It cost four templates at once (Banner, Compact, Dated, Ledger printed the
 * profile at ~165% of its leading) and nothing caught it: no error, no failing
 * assertion, and a preview that looked exactly right.
 *
 * Asserted on the style objects rather than on a rendered PDF because that is
 * where the mistake is legible. Measuring the leading in the output means
 * finding a wrapped paragraph among every other block of body text on the sheet,
 * which is a fragile thing to ask of a test whose job is to be believed.
 */
const SHEETS = {
  banner,
  classic,
  compact,
  dated,
  formal,
  ledger,
  modern,
  timeline,
};

test.describe("template leading", () => {
  test("no style sets a line height without the size it is measured against", () => {
    const offenders: string[] = [];

    for (const [template, sheet] of Object.entries(SHEETS)) {
      for (const [name, style] of Object.entries(sheet) as [string, Record<string, unknown>][]) {
        /* `page` is exempt: it is the root of the tree, so there is nothing above
           it to inherit a size from and its own `fontSize` is always declared. */
        if (name === "page") continue;
        if (style.lineHeight !== undefined && style.fontSize === undefined) {
          offenders.push(`${template}.${name}`);
        }
      }
    }

    expect(offenders, "these will print at @react-pdf's 18pt default leading").toEqual([]);
  });
});
