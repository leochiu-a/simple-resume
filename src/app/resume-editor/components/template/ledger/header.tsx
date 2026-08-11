import { View, Text } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";

import { styles } from "./styles";

/**
 * The name in serif over the wanted job, with the contact details on a single
 * wrapping row and a thick rule in the picked colour closing the block off.
 *
 * The header is the one row that ignores the label gutter — it spans the sheet, so
 * the rule beneath it reads as the sheet's own edge rather than a section's.
 */
const Header = ({ resume, accentColor }: { resume: Resume; accentColor: string }) => {
  /*
   * A detail that was never filled in is left out entirely. Kept in, an empty
   * phone number printed as nothing at all but still claimed a column gap, so the
   * row advertised a hole rather than closing it.
   */
  const contacts = (["city", "email", "phone"] as const)
    .map((field) => resume[field].trim())
    .filter((value) => value !== "");

  return (
    <View style={{ ...styles.header, borderBottomColor: accentColor }}>
      <Text style={styles.name}>{resume.name}</Text>

      {resume.wantedJob.trim() !== "" && <Text style={styles.wantedJob}>{resume.wantedJob}</Text>}

      <View style={styles.contactRow}>
        {contacts.map((value) => (
          <Text style={styles.contactItem} key={value}>
            {value}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default Header;
