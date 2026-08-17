import { View, Text } from "@react-pdf/renderer";
import { Fragment } from "react";

import { Resume } from "@/types/resume";

import { styles } from "./styles";

/**
 * The name, then the wanted job and every contact detail on one wrapping line.
 *
 * Two lines for the whole header, against Formal's centred block of five. The
 * wanted job joins the contact run rather than getting a line of its own, because
 * at this size it reads as one more fact about the person rather than as display
 * type.
 */
const Header = ({ resume }: { resume: Resume }) => {
  /*
   * A detail that was never filled in is left out entirely. Kept in, an empty
   * value still claimed its separator dot, so the line advertised a gap rather
   * than hiding one.
   */
  const details = [resume.wantedJob, resume.city, resume.email, resume.phone]
    .map((value) => value.trim())
    .filter((value) => value !== "");

  return (
    <View style={styles.header}>
      <Text style={styles.name}>{resume.name}</Text>

      <View style={styles.contactRow}>
        {details.map((value, index) => (
          <Fragment key={value}>
            <Text style={styles.contactItem}>{value}</Text>
            {/* No dot trails the last detail. */}
            {index < details.length - 1 && <Text style={styles.contactSeparator}>·</Text>}
          </Fragment>
        ))}
      </View>
    </View>
  );
};

export default Header;
