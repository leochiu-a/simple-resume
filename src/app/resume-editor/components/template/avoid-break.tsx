import { View } from "@react-pdf/renderer";
import { ComponentProps } from "react";

/**
 * A block that must not be split across a page boundary — a single job, one
 * education entry, one bullet.
 *
 * It carries the instruction twice because the two renderers read different
 * things. `wrap={false}` is what @react-pdf honours when it paginates the PDF.
 * React drops that `false` before it reaches the DOM (a non-boolean attribute
 * given a boolean), so the preview — which renders this same tree as HTML — has
 * no way to see it. `data-avoid-break` is the preview's copy of the same
 * instruction, and `use-pagination` looks for exactly that.
 *
 * Keeping both on one component is what stops them drifting apart: mark a block
 * unbreakable here and the PDF and the preview agree on where the page ends.
 */
const AvoidBreak = ({ children, ...props }: ComponentProps<typeof View>) => (
  <View {...props} wrap={false} {...{ "data-avoid-break": "true" }}>
    {children}
  </View>
);

export default AvoidBreak;
