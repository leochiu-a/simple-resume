import { View, Text } from "@react-pdf/renderer";
import { PropsWithChildren } from "react";

import { styles } from "./styles";

/**
 * A bold uppercase serif title with its body beneath. Unlike the Modern
 * template there is no rule under the heading — the space alone separates the
 * sections here.
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
