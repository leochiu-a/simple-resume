import { View, Text } from "@react-pdf/renderer";
import { Fragment } from "react";

import { Resume } from "@/types/resume";

import { styles } from "./styles";

/**
 * The centred header: the wanted job, then the name in the picked colour, then
 * the contact details on a single wrapping row closed off by a dashed rule.
 */

const CONTACT_LABELS = {
  city: "Address:",
  email: "Email address:",
  phone: "Phone number:",
} as const;

const Header = ({ resume, nameColor }: { resume: Resume; nameColor: string }) => {
  const contacts = (["city", "email", "phone"] as const).map((field) => ({
    label: CONTACT_LABELS[field],
    value: resume[field],
  }));

  return (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View style={styles.titleBlock}>
          <Text style={styles.jobTitle}>{resume.wantedJob}</Text>
          <Text style={{ ...styles.name, color: nameColor }}>{resume.name}</Text>
        </View>

        <View style={styles.contactRow}>
          {contacts.map(({ label, value }, index) => (
            <Fragment key={label}>
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>{label}</Text> {value}
              </Text>
              {/* No dot trails the last detail. */}
              {index < contacts.length - 1 && <Text style={styles.contactSeparator}>·</Text>}
            </Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

export default Header;
