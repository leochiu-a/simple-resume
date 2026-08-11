import { View, Text } from "@react-pdf/renderer";
import { Fragment } from "react";

import { Project } from "@/types/resume";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * A project has no timeline, so the headline row carries only its name — and,
 * when given, the url takes the place the dates would have had at the right
 * margin, which keeps the column's edge straight.
 *
 * And, like Experience, an entry is a run of blocks rather than one: the headline
 * bound to its first bullet, then each later bullet free to start a new page. See
 * `experience.tsx` for why.
 */
const Projects = ({ projects, titleColor }: { projects: Project[]; titleColor: string }) => {
  return (
    <Section title="Projects" titleColor={titleColor}>
      <View style={styles.splitEntryList}>
        {projects.map(({ name, url, description }, index) => {
          const [firstBullet, ...restBullets] = description
            .split(SPLIT_TEXT)
            .filter((item) => item.trim() !== "");

          return (
            <Fragment key={index}>
              <AvoidBreak style={styles.entryHead}>
                <View style={styles.entryHeadline}>
                  <Text style={styles.entryTitle}>{name}</Text>
                  {url !== "" && <Text style={styles.entryDate}>{url}</Text>}
                </View>

                {firstBullet !== undefined && (
                  <View style={styles.description}>
                    <View style={styles.descriptionRow}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{firstBullet}</Text>
                    </View>
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
