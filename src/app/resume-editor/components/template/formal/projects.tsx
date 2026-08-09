import { View, Text } from "@react-pdf/renderer";

import { Project } from "@/types/resume";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * A project has no timeline, so each entry is just its name as the headline
 * and, when given, the url as a secondary line — then the description as disc
 * bullets, same as Experience.
 */
const Projects = ({ projects }: { projects: Project[] }) => {
  return (
    <Section title="Projects">
      <View style={styles.entryList}>
        {projects.map(({ name, url, description }, index) => {
          const bullets = description.split(SPLIT_TEXT).filter((item) => item.trim() !== "");

          return (
            <AvoidBreak style={styles.entry} key={index}>
              <Text style={styles.entryHeadline}>{name}</Text>

              {url && <Text style={styles.entrySubline}>{url}</Text>}

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
