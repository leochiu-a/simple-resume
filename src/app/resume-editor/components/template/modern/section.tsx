import { View, Text } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { PropsWithChildren } from "react";

import { styles } from "./styles";

/**
 * An uppercase, letterspaced heading with a hairline rule beneath it. The rule
 * takes the surrounding ink colour, which differs between the two columns.
 *
 * `style` is merged over the section's own: the sidebar uses it to lift each
 * section in front of the tinted panel behind the column.
 */
const Section = ({
  title,
  color,
  style,
  children,
}: PropsWithChildren<{ title: string; color: string; style?: Style }>) => {
  return (
    <View style={{ ...styles.section, ...style }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ ...styles.sectionRule, borderTopColor: color }} />

      {children}
    </View>
  );
};

export default Section;
