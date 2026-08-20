import { View, Text, Link } from "@react-pdf/renderer";

import { Project } from "@/types/resume";

import Section from "./section";
import { CONTENT_COLOR, bulletStyles, styles } from "./styles";
import AvoidBreak from "../avoid-break";
import { toBulletLines } from "../bullets";
import { BulletMarks } from "../bullet-row";

const Projects = ({ projects }: { projects: Project[] }) => {
  return (
    <Section title="Projects" color={CONTENT_COLOR}>
      <View style={styles.entryList}>
        {projects.map(({ name, url, description }, index) => {
          const bullets = toBulletLines(description);

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
                      <BulletMarks line={item} styles={bulletStyles} />
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
