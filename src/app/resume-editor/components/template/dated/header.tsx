import { View, Text } from "@react-pdf/renderer";
import { Fragment } from "react";

import { Resume } from "@/types/resume";

import { styles } from "./styles";

/**
 * The name in serif, the wanted job under it, and the contact details on one
 * wrapping row, all closed off by a rule across the full measure.
 *
 * Ranged left rather than centred, and spanning both columns. The date margin
 * starts below: the header is about a person, not an entry, so it has no date to
 * hang out there and an empty gutter beside it would only make the sheet look
 * like it had lost something.
 */
const Header = ({ resume }: { resume: Resume }) => {
  /*
   * A detail that was never filled in is left out entirely. Kept in, an empty
   * value still claimed its separator dot, so the row advertised a gap rather
   * than hiding one.
   */
  const contacts = (["city", "email", "phone"] as const)
    .map((field) => resume[field].trim())
    .filter((value) => value !== "");

  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.name}>{resume.name}</Text>
        <Text style={styles.wantedJob}>{resume.wantedJob}</Text>
      </View>

      <View style={styles.contactRow}>
        {contacts.map((value, index) => (
          <Fragment key={value}>
            <Text style={styles.contactItem}>{value}</Text>
            {/* No dot trails the last detail. */}
            {index < contacts.length - 1 && <Text style={styles.contactSeparator}>·</Text>}
          </Fragment>
        ))}
      </View>
    </View>
  );
};

export default Header;
