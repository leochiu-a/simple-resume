import { View, Text } from "@react-pdf/renderer";
import { PropsWithChildren } from "react";

import { styles } from "./styles";

/**
 * A heading whose rule is split in two: dark beneath the title itself, then
 * continuing in light grey across the rest of the column.
 *
 * Both halves are real views. There is no `::after` here, so the grey remainder
 * cannot be a pseudo-element — it is a sibling that takes `flex: 1`, and
 * `alignItems: "flex-end"` on the row lands the two borders on the same line.
 *
 * The reference sets a small icon before each title. That is left out: icons
 * would mean `Svg`, which draws nothing in the preview.
 */
const Section = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleBox}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionRule} />
      </View>

      {children}
    </View>
  );
};

export default Section;
