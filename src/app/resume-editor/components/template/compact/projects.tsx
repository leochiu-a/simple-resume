import { View, Text, Link } from "@react-pdf/renderer";
import { Fragment } from "react";

import { Project } from "@/types/resume";

import Section from "./section";
import { bulletStyles, styles } from "./styles";
import AvoidBreak from "../avoid-break";
import { toBulletLines } from "../bullets";
import { BulletMarks, BulletRow } from "../bullet-row";

/**
 * A project has no timeline, so the right of the headline row carries its url
 * instead — the same line doing the same job of saying where the thing is. Then
 * the description as disc bullets, same as Experience.
 *
 * And, like Experience, an entry is a run of blocks rather than one: the headline
 * bound to its first bullet, then each later bullet free to start a new page. See
 * `experience.tsx` for why.
 */
const Projects = ({ projects, accent }: { projects: Project[]; accent: string }) => {
  return (
    <Section title="Projects" accent={accent}>
      <View style={styles.splitEntryList}>
        {projects.map(({ name, url, description }, index) => {
          const [firstBullet, ...restBullets] = toBulletLines(description);

          return (
            <Fragment key={index}>
              <AvoidBreak style={styles.entryHead}>
                <View style={styles.entryTopRow}>
                  <Text style={{ ...styles.entryHeadline, ...styles.entryHeadlineStrong }}>
                    {name}
                  </Text>

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
                  <BulletRow
                    line={firstBullet}
                    style={styles.descriptionRow}
                    styles={bulletStyles}
                  />
                )}
              </AvoidBreak>

              {restBullets.map((item, itemIndex) => (
                <AvoidBreak style={styles.entryBullet} key={item + itemIndex}>
                  <BulletMarks line={item} styles={bulletStyles} />
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
