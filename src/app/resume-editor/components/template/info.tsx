import { View } from "@react-pdf/renderer";
import { SmallText, SubText, SubTitle, Title } from "./typography";
import { styles } from "./styles";
import { Skill, SocialLink } from "@/types/resume";

const Info = ({
  name,
  jobTitle,
  city,
  phone,
  email,
  links,
  skills,
}: {
  name: string;
  jobTitle: string;
  city: string;
  phone: string;
  email: string;
  links: SocialLink[];
  skills: Skill[];
}) => {
  return (
    <View
      style={{
        color: "#fff",
        ...styles.flexCol,
        alignItems: "center",
      }}
    >
      <View style={{ marginHorizontal: "40pt", marginTop: "40pt" }}>
        <Title style={{ fontSize: "16pt", marginBottom: 0 }}>{name}</Title>
      </View>
      <View
        style={{
          height: "1pt",
          width: "12pt",
          backgroundColor: "#3B7269",
          margin: "10pt",
        }}
      ></View>
      <SubText style={{ transformOrigin: "center", color: "#fff" }}>
        {jobTitle}
      </SubText>

      <View
        style={{
          alignSelf: "flex-start",
          marginLeft: 40,
          marginTop: 20,
          ...styles.flexCol,
          gap: 20,
        }}
      >
        <View style={{ ...styles.flexCol }}>
          <SubTitle>Details</SubTitle>
          <View style={{ ...styles.flexCol, gap: "2pt" }}>
            <SmallText>{city}</SmallText>
            <SmallText>{phone}</SmallText>
            <SmallText style={{ textDecoration: "underline" }}>
              {email}
            </SmallText>
          </View>
        </View>

        <View style={{ ...styles.flexCol }}>
          <SubTitle>Links</SubTitle>
          <View style={{ ...styles.flexCol, gap: "8pt" }}>
            {links.map((link, index) => (
              <SmallText as="link" href={link.url} key={index}>
                {link.name}
              </SmallText>
            ))}
          </View>
        </View>

        <View style={{ ...styles.flexCol }}>
          <SubTitle>Skills</SubTitle>
          <View style={{ ...styles.flexCol, gap: "6pt" }}>
            {skills.map((skill, index) => (
              <SmallText key={index}>{skill.name}</SmallText>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default Info;
