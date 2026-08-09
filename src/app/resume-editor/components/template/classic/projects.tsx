import { View } from "@react-pdf/renderer";
import { Title, Text, SubText } from "./typography";
import { styles } from "./styles";
import { Project } from "@/types/resume";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import AvoidBreak from "../avoid-break";

const Projects = ({ projects }: { projects: Project[] }) => {
  return (
    <View style={{ marginBottom: 12 }}>
      <Title>Projects</Title>

      <View style={{ ...styles.flexCol, gap: "12pt" }}>
        {projects.map(({ name, url, description }, index) => (
          <AvoidBreak key={index}>
            <View style={{ ...styles.flexCol, marginBottom: 8 }}>
              <Text bold>{name}</Text>
              {url && <SubText>{url}</SubText>}
            </View>

            {description.split(SPLIT_TEXT).map((item, index) => (
              <AvoidBreak
                key={item + index}
                style={{ ...styles.flexRow, gap: "4pt", paddingLeft: "12px" }}
              >
                <Text bold>•</Text>
                <Text>{item}</Text>
              </AvoidBreak>
            ))}
          </AvoidBreak>
        ))}
      </View>
    </View>
  );
};

export default Projects;
