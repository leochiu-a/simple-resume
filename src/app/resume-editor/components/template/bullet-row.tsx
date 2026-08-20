import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

/**
 * One "• line" of a description, in the styles the template hands it.
 *
 * @react-pdf has no list marker, so a bullet is two `Text`s side by side —
 * the disc in its own column so the text wraps against a straight edge rather
 * than back under the marker. Seven of the eight templates draw exactly that,
 * with only the styles differing, and each of them had its own copy in both
 * `experience.tsx` and `projects.tsx`.
 *
 * The row's wrapper is the caller's, not this component's: on a template that
 * lets a page break between two bullets the wrapper is an `AvoidBreak`, and on
 * one that keeps an entry whole it is a plain `View`. That choice is the
 * template's pagination design, so `BulletMarks` renders the marks alone and
 * `BulletRow` is the convenience for the plain-`View` case.
 */

export interface BulletStyles {
  /** The disc. */
  bullet: Style;
  /** The line beside it. */
  text: Style;
}

export const BulletMarks = ({ line, styles }: { line: string; styles: BulletStyles }) => (
  <>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.text}>{line}</Text>
  </>
);

export const BulletRow = ({
  line,
  style,
  styles,
}: {
  line: string;
  /** The row itself — usually the template's `descriptionRow`. */
  style?: Style;
  styles: BulletStyles;
}) => (
  <View style={style}>
    <BulletMarks line={line} styles={styles} />
  </View>
);
