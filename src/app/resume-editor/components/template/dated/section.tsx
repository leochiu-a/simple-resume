import { View, Text } from "@react-pdf/renderer";
import { PropsWithChildren } from "react";

import { styles } from "./styles";

/**
 * A serif uppercase title in the picked colour, underlined by a hairline that
 * runs the full measure, with the section's body beneath it.
 *
 * The title spans the whole width rather than sitting in the date margin: the
 * margin belongs to the entries here, and a heading in it would claim the one
 * edge the reader is meant to be scanning for dates.
 *
 * `inset` is for the sections that have no dates. They still start their content
 * at the same edge as the dated ones, with the gutter simply left empty.
 *
 * That is a correction. They ran the full measure at first, on the reasoning that
 * an empty gutter beside four of the six sections would read as something failing
 * to render. Seen at the size the editor actually shows, the opposite was true:
 * the page had two different left edges for its content — Experience indented,
 * Projects snapping back out to the margin — and read as broken alignment rather
 * than as a deliberate change of measure. One content column throughout is also
 * what the academic CVs this layout comes from do.
 */
const Section = ({
  title,
  accent,
  inset,
  children,
}: PropsWithChildren<{ title: string; accent: string; inset?: boolean }>) => {
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: accent }}>{title}</Text>

      {inset ? (
        <View style={styles.insetRow}>
          <View style={styles.dateColumnSpacer} />
          <View style={styles.insetBody}>{children}</View>
        </View>
      ) : (
        children
      )}
    </View>
  );
};

export default Section;
