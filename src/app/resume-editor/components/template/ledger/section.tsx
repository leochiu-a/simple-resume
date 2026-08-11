import { View, Text } from "@react-pdf/renderer";
import { PropsWithChildren } from "react";

import { styles } from "./styles";

/**
 * A section as a row: the title in the narrow left gutter, the content in the
 * wide column beside it. This is the whole idea of the template, so it lives in
 * the one component every section goes through.
 *
 * The title takes the picked colour. It is the only place the colour repeats down
 * the sheet — the header's rule sets it once at the top — which is what ties the
 * gutter together as a column without tinting a panel behind it.
 */
const Section = ({
  title,
  titleColor,
  children,
}: PropsWithChildren<{ title: string; titleColor: string }>) => {
  return (
    <View style={styles.section}>
      <Text style={{ ...styles.sectionTitle, color: titleColor }}>{title}</Text>

      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

export default Section;
