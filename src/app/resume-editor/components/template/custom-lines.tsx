import type { Style } from "@react-pdf/types";

import AvoidBreak from "./avoid-break";
import { BulletMarks, type BulletStyles } from "./bullet-row";
import { toBulletLines } from "./bullets";

/**
 * The body of a section the user named: its lines, as this template's bullets.
 *
 * A custom section has no entries to keep together — every line stands alone, and
 * a list of certifications is exactly as readable split across a page break as it
 * is whole. So each line is its own unbreakable block: the page may end between
 * any two of them, and no single line is ever cut down the middle.
 *
 * The styles come from the template, so a custom section is drawn in the same
 * bullets as the job descriptions above it rather than in a look of its own. That
 * is the whole design brief for these: the user names the section, the template
 * still owns how the sheet looks.
 */
const CustomLines = ({
  description,
  rowStyle,
  styles,
}: {
  description: string;
  /** The row — the template's own bullet block, gap and all. */
  rowStyle: Style;
  styles: BulletStyles;
}) => (
  <>
    {toBulletLines(description).map((line, index) => (
      /* The first line loses the row's top margin. That margin is the gap between
         two bullets, and on the first one it would push the section's opening line
         further from its heading than every other section's is — the same
         correction `splitEntryList` makes with a negative margin for entries. */
      <AvoidBreak style={index === 0 ? { ...rowStyle, marginTop: 0 } : rowStyle} key={line + index}>
        <BulletMarks line={line} styles={styles} />
      </AvoidBreak>
    ))}
  </>
);

export default CustomLines;
