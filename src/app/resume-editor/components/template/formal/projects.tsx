import { View, Text } from "@react-pdf/renderer";
import { Fragment } from "react";

import { Project } from "@/types/resume";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * A project has no timeline, so each entry is just its name as the headline
 * and, when given, the url as a secondary line — then the description as disc
 * bullets, same as Experience.
 *
 * And, like Experience, an entry is a run of blocks rather than one: the headline
 * bound to its first bullet, then each later bullet free to start a new page. See
 * `experience.tsx` for why.
 */
const Projects = ({ projects }: { projects: Project[] }) => {
  return (
    <Section title="Projects">
      <View style={styles.splitEntryList}>
        {projects.map(({ name, url, description }, index) => {
          const [firstBullet, ...restBullets] = description
            .split(SPLIT_TEXT)
            .filter((item) => item.trim() !== "");

          return (
            <Fragment key={index}>
              <AvoidBreak style={styles.entryHead}>
                <Text style={styles.entryHeadline}>{name}</Text>

                {url && <Text style={styles.entrySubline}>{url}</Text>}

                {firstBullet !== undefined && (
                  <View style={styles.descriptionRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{firstBullet}</Text>
                  </View>
                )}
              </AvoidBreak>

              {restBullets.map((item, itemIndex) => (
                <AvoidBreak style={styles.entryBullet} key={item + itemIndex}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </AvoidBreak>
              ))}
            </Fragment>
          );
        })}
      </View>
    </Section>
  );
};

export default Projects;
