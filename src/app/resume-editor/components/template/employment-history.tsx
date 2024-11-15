import { View } from "@react-pdf/renderer";
import { Title, Text, SubText } from "./typography";
import { styles } from "./styles";

const ITEMS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.",
  "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti.",
  "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates.",
  "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti.",
  "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates.",
  "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat.",
];

const EmploymentHistory = () => {
  return (
    <View style={{ marginBottom: 12 }}>
      <Title>Employment History</Title>

      <View style={{ ...styles.flexCol, gap: "12pt" }}>
        {Array.from({ length: 2 }).map((_, index) => (
          <View key={index} wrap={false}>
            <View style={{ ...styles.flexCol, marginBottom: 8 }}>
              <Text bold>Lorem</Text>
              <SubText>OCTOBER 2020 — NOVEMBER 2024</SubText>
            </View>

            {ITEMS.map((item, index) => (
              <View
                key={item + index}
                style={{ ...styles.flexRow, gap: "4pt", paddingLeft: "12px" }}
                wrap={false}
              >
                <Text bold>•</Text>
                <Text>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default EmploymentHistory;
