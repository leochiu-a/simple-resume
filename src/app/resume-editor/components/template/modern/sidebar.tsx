import { View, Text, Link } from "@react-pdf/renderer";
import { PropsWithChildren, ReactNode } from "react";

import { Resume } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";
import { LocationIcon, MailIcon, PhoneIcon } from "./contact-icons";
import { PanelColors } from "./panel-color";

const DetailRow = ({ icon, children }: PropsWithChildren<{ icon: ReactNode }>) => (
  <View style={styles.detailRow}>
    {icon}
    <Text style={styles.detailText}>{children}</Text>
  </View>
);

const Bullet = ({ children }: PropsWithChildren) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const Sidebar = ({ resume, panel }: { resume: Resume; panel: PanelColors }) => {
  const { visibility } = resume;
  const icon = { disc: panel.text, glyph: panel.background };

  return (
    <View style={{ ...styles.sidebar, color: panel.text }}>
      <View style={{ ...styles.sidebarPanel, backgroundColor: panel.background }} />

      <View style={styles.identity}>
        <Text style={styles.name}>{resume.name}</Text>
        <Text style={styles.jobTitle}>{resume.wantedJob}</Text>
      </View>

      <Section title="Details" color={panel.text}>
        <View style={styles.detailList}>
          <DetailRow icon={<MailIcon {...icon} />}>{resume.email}</DetailRow>
          <DetailRow icon={<PhoneIcon {...icon} />}>{resume.phone}</DetailRow>
          <DetailRow icon={<LocationIcon {...icon} />}>{resume.city}</DetailRow>
        </View>
      </Section>

      {visibility.socialLinks && (
        <Section title="Links" color={panel.text}>
          <View style={styles.bulletList}>
            {resume.socialLinks.map((link, index) => (
              <View style={styles.bulletRow} key={index}>
                <Text style={styles.bullet}>•</Text>
                {/* The label has to sit inside a Text: the preview renders this
                    tree as DOM, where a bare <LINK> is treated as a void element
                    and drops its children. */}
                <Text style={styles.bulletText}>
                  <Link src={link.url} style={{ ...styles.link, color: panel.text }}>
                    {link.name}
                  </Link>
                </Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {visibility.skills && (
        <Section title="Skills" color={panel.text}>
          <View style={styles.bulletList}>
            {resume.skills.map((skill, index) => (
              <Bullet key={index}>{skill.name}</Bullet>
            ))}
          </View>
        </Section>
      )}
    </View>
  );
};

export default Sidebar;
