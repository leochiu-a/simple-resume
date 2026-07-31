import { View, Text } from "@react-pdf/renderer";
import { PropsWithChildren } from "react";

import { styles } from "./styles";

/**
 * An uppercase, letterspaced heading with a hairline rule beneath it. The rule
 * takes the surrounding ink colour, which differs between the two columns.
 */
const Section = ({
  title,
  color,
  children,
}: PropsWithChildren<{ title: string; color: string }>) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ ...styles.sectionRule, borderTopColor: color }} />

      {children}
    </View>
  );
};

export default Section;
