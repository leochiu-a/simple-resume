import { View, Text, Link } from "@react-pdf/renderer";
import { Fragment } from "react";

import { Project } from "@/types/resume";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * A project has no timeline, so this section runs the full measure instead of
 * taking the date margin — an empty gutter down the side of every project would
 * read as something failing to render rather than as a column.
 *
 * The url takes the right of the headline row, where a dated section would have
 * put the years.
 *
 * Like Experience, an entry is a run of blocks rather than one: the headline bound
 * to its first bullet, then each later bullet free to start a new page. See
 * `experience.tsx` for why.
 */
const Projects = ({ projects, accent }: { projects: Project[]; accent: string }) => {
  return (
    <Section title="Projects" accent={accent}>
      <View style={styles.splitEntryList}>
        {projects.map(({ name, url, description }, index) => {
          const [firstBullet, ...restBullets] = description
            .split(SPLIT_TEXT)
            .filter((item) => item.trim() !== "");

          return (
            <Fragment key={index}>
              <AvoidBreak style={styles.entry} key={index}>
                <View style={styles.entryTopRow}>
                  <Text style={styles.entryHeadlineFlex}>{name}</Text>

                  {/* The url has to sit inside a Text: the preview renders this
                      tree as DOM, where a bare <LINK> is treated as a void
                      element and drops its children. Same as `links.tsx`. */}
                  {url && (
                    <Text style={styles.entrySubline}>
                      <Link src={url} style={styles.link}>
                        {url}
                      </Link>
                    </Text>
                  )}
                </View>

                {firstBullet !== undefined && (
                  <View style={styles.descriptionRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{firstBullet}</Text>
                  </View>
                )}
              </AvoidBreak>

              {restBullets.map((item, itemIndex) => (
                <AvoidBreak style={styles.descriptionRow} key={item + itemIndex}>
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
