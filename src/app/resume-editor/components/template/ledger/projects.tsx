import { View, Text, Link } from "@react-pdf/renderer";
import { Fragment } from "react";

import { Project } from "@/types/resume";

import Section from "./section";
import { MUTED, bulletStyles, styles } from "./styles";
import AvoidBreak from "../avoid-break";
import { toBulletLines } from "../bullets";
import { BulletMarks, BulletRow } from "../bullet-row";

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
          const [firstBullet, ...restBullets] = toBulletLines(description);

          return (
            <Fragment key={index}>
              <AvoidBreak style={styles.entryHead}>
                <View style={styles.entryHeadline}>
                  <Text style={styles.entryTitle}>{name}</Text>
                  {/* The url has to sit inside a Text: the preview renders this
                      tree as DOM, where a bare <LINK> is treated as a void
                      element and drops its children. Same as `links.tsx`. The
                      link keeps the date column's muted ink rather than the
                      full-strength ink `styles.link` carries. */}
                  {url !== "" && (
                    <Text style={styles.entryDate}>
                      <Link src={url} style={{ ...styles.link, color: MUTED }}>
                        {url}
                      </Link>
                    </Text>
                  )}
                </View>

                {firstBullet !== undefined && (
                  <View style={styles.description}>
                    <BulletRow
                      line={firstBullet}
                      style={styles.descriptionRow}
                      styles={bulletStyles}
                    />
                  </View>
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
