import { View, Text, Link } from "@react-pdf/renderer";

import { Project } from "@/types/resume";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import Marker from "./marker";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

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
          const bullets = description.split(SPLIT_TEXT).filter((item) => item.trim() !== "");

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
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{item}</Text>
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
