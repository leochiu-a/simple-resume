import { View, Text } from "@react-pdf/renderer";
import { PropsWithChildren } from "react";

import { styles } from "./styles";

/**
 * A widely letter-spaced uppercase title with its body flush beneath it.
 *
 * No rule and no indent: the band at the top of the sheet is this template's
 * structure, and repeating that weight down the page would compete with it.
 */
const Section = ({ title, children }: PropsWithChildren<{ title: string }>) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {children}
    </View>
  );
};

export default Section;
