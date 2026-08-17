import { View, Text } from "@react-pdf/renderer";
import { Fragment } from "react";

import { Resume } from "@/types/resume";

import { styles } from "./styles";
import { BannerColors } from "./banner-color";

/**
 * The band: the name in serif over the wanted job, a hairline, then the contact
 * details on one wrapping row — all printed on the picked colour.
 *
 * Unlike Formal's header the details carry no labels. There they sit on white
 * paper among other text and need saying what they are; here they are the only
 * small type inside a colour field, and "Email address:" in front of each one
 * would fill the band with words nobody reads.
 */
const Header = ({ resume, colors }: { resume: Resume; colors: BannerColors }) => {
  /*
   * A detail that was never filled in is left out entirely. Kept in, an empty
   * value still claimed its separator dot, so the row advertised a gap rather
   * than hiding one.
   */
  const contacts = (["city", "email", "phone"] as const)
    .map((field) => resume[field].trim())
    .filter((value) => value !== "");

  return (
    <View style={{ ...styles.band, backgroundColor: colors.background }}>
      <View style={styles.titleBlock}>
        <Text style={{ ...styles.name, color: colors.text }}>{resume.name}</Text>
        <Text style={{ ...styles.wantedJob, color: colors.text }}>{resume.wantedJob}</Text>
      </View>

      <View style={{ ...styles.bandRule, backgroundColor: colors.muted }} />

      <View style={styles.contactRow}>
        {contacts.map((value, index) => (
          <Fragment key={value}>
            <Text style={{ ...styles.contactItem, color: colors.text }}>{value}</Text>
            {/* No dot trails the last detail. */}
            {index < contacts.length - 1 && (
              <Text style={{ ...styles.contactSeparator, color: colors.muted }}>·</Text>
            )}
          </Fragment>
        ))}
      </View>
    </View>
  );
};

export default Header;
