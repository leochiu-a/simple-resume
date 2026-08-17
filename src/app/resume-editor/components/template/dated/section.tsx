import { View, Text } from "@react-pdf/renderer";
import { PropsWithChildren } from "react";

import { styles } from "./styles";

/**
 * A serif uppercase title in the picked colour, underlined by a hairline that
 * runs the full measure.
 *
 * The title spans the whole column rather than sitting in the date margin: the
 * margin belongs to the entries here, and a heading in it would claim the one
 * edge the reader is meant to be scanning for dates.
 */
const Section = ({
  title,
  accent,
  children,
}: PropsWithChildren<{ title: string; accent: string }>) => {
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: accent }}>{title}</Text>

      {children}
    </View>
  );
};

export default Section;
