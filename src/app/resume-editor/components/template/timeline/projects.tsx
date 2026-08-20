import { View, Text, Link } from "@react-pdf/renderer";

import { Project } from "@/types/resume";

import Section from "./section";
import Marker from "./marker";
import { bulletStyles, styles } from "./styles";
import AvoidBreak from "../avoid-break";
import { toBulletLines } from "../bullets";
import { BulletMarks } from "../bullet-row";

/**
 * A project has no timeline, so the date column that other entries fill sits
 * empty here — the marker still lands on the rail, keeping it continuous, but
 * with nothing dated to hang off it.
 */
const Projects = ({ projects, accent }: { projects: Project[]; accent: string }) => {
  return (
    <Section title="Projects">
      <View style={styles.entryList}>
        {projects.map(({ name, url, description }, index) => {
          const bullets = toBulletLines(description);

          return (
            <AvoidBreak style={styles.entry} key={index}>
              <View style={styles.entryLeft}>
                <Marker connected={index < projects.length - 1} />
                <View style={styles.entryDateColumn} />
              </View>

              <View style={styles.entryRight}>
                <Text style={{ ...styles.entryTitle, color: accent }}>{name}</Text>
                {url && (
                  <Text style={styles.linkRow}>
                    <Link src={url} style={styles.link}>
                      {url}
                    </Link>
                  </Text>
                )}

                {bullets.length > 0 && (
                  <View style={styles.description}>
                    {bullets.map((item, itemIndex) => (
                      <View style={styles.descriptionRow} key={item + itemIndex}>
                        <BulletMarks line={item} styles={bulletStyles} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </AvoidBreak>
          );
        })}
      </View>
    </Section>
  );
};

export default Projects;
