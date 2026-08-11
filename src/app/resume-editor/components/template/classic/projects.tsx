import { View } from "@react-pdf/renderer";
import { Fragment } from "react";
import { Title, Text, SubText } from "./typography";
import { styles, entryBullet, entryHead, splitEntryList } from "./styles";
import { Project } from "@/types/resume";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import AvoidBreak from "../avoid-break";

/**
 * Like the employment history, a project is a run of unbreakable blocks rather
 * than one — the name and url bound to the first bullet, then each later bullet
 * free to start a new page. See `employment-history.tsx` for why.
 */
const Projects = ({ projects }: { projects: Project[] }) => {
  return (
    <View style={{ marginBottom: 12 }}>
      <Title>Projects</Title>

      <View style={splitEntryList}>
        {projects.map(({ name, url, description }, index) => {
          const [firstBullet, ...restBullets] = description.split(SPLIT_TEXT);

          return (
            <Fragment key={index}>
              <AvoidBreak style={entryHead}>
                <View style={{ ...styles.flexCol, marginBottom: 8 }}>
                  <Text bold>{name}</Text>
                  {url && <SubText>{url}</SubText>}
                </View>

                {firstBullet !== undefined && (
                  <View style={{ ...styles.flexRow, gap: "4pt", paddingLeft: "12px" }}>
                    <Text bold>•</Text>
                    <Text>{firstBullet}</Text>
                  </View>
                )}
              </AvoidBreak>

              {restBullets.map((item, itemIndex) => (
                <AvoidBreak key={item + itemIndex} style={entryBullet}>
                  <Text bold>•</Text>
                  <Text>{item}</Text>
                </AvoidBreak>
              ))}
            </Fragment>
          );
        })}
      </View>
    </View>
  );
};

export default Projects;
