import { View, Text, Link } from "@react-pdf/renderer";

import { Project } from "@/types/resume";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import { styles, CONTENT_COLOR } from "./styles";
import AvoidBreak from "../avoid-break";

const Projects = ({ projects }: { projects: Project[] }) => {
  return (
    <Section title="Projects" color={CONTENT_COLOR}>
      <View style={styles.entryList}>
        {projects.map(({ name, url, description }, index) => {
          const bullets = description.split(SPLIT_TEXT).filter((item) => item.trim() !== "");

          return (
            <AvoidBreak style={styles.entry} key={index}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryTitle}>{name}</Text>
                {url && (
                  <Text style={styles.entryLocation}>
                    <Link src={url} style={{ ...styles.link, color: CONTENT_COLOR }}>
                      {url}
                    </Link>
                  </Text>
                )}
              </View>

              {bullets.length > 0 && (
                <View style={styles.description}>
                  {bullets.map((item, itemIndex) => (
                    <View style={styles.descriptionRow} key={item + itemIndex}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </AvoidBreak>
          );
        })}
      </View>
    </Section>
  );
};

export default Projects;
