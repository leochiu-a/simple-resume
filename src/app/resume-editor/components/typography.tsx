import {
  Font,
  Text as PDFText,
  StyleSheet,
  Link as PDFLink,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { PropsWithChildren } from "react";

Font.register({
  family: "Noto Serif",
  src: "/fonts/NotoSerif-Bold.ttf",
  fontWeight: "bold",
});
Font.register({
  family: "Noto Sans",
  fonts: [
    {
      src: "/fonts/NotoSans-Regular.ttf",
    },
    {
      src: "/fonts/NotoSans-bold.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  title: {
    fontFamily: "Noto Serif",
    fontWeight: "bold",
    fontSize: "13pt",
    lineHeight: 1.5,
    marginBottom: "3pt",
    display: "flex",
  },
  subtitle: {
    fontFamily: "Noto Serif",
    fontWeight: "bold",
    fontSize: "11pt",
    lineHeight: 1.5,
    marginBottom: "3pt",
    display: "flex",
  },
  text: {
    fontFamily: "Noto Sans",
    fontSize: "9pt",
    lineHeight: 1.6,
  },
  smallText: {
    fontFamily: "Noto Sans",
    fontSize: "9pt",
    transform: "scale(0.9)",
    transformOrigin: "left",
  },
  subText: {
    fontFamily: "Noto Sans",
    color: "#818487",
    fontSize: "9pt",
    transform: "scale(0.7)",
    transformOrigin: "left",
    letterSpacing: 1.5,
  },
  link: {
    display: "flex",
    textDecoration: "underline",
    color: "#fff",
  },
});

export const Title = ({
  children,
  style,
}: PropsWithChildren<{ style?: Style }>) => {
  return <PDFText style={{ ...styles.title, ...style }}>{children}</PDFText>;
};

export const SubTitle = ({
  children,
  fontFamily = "Noto Serif",
}: PropsWithChildren<{ fontFamily?: "Noto Serif" | "Noto Sans" }>) => {
  return (
    <PDFText style={{ ...styles.subtitle, fontFamily }}>{children}</PDFText>
  );
};

export const Text = ({
  children,
  bold = false,
  style,
}: PropsWithChildren<{ bold?: boolean; style?: Style }>) => {
  return (
    <PDFText
      style={{
        ...styles.text,
        fontWeight: bold ? "bold" : "normal",
        ...style,
      }}
    >
      {children}
    </PDFText>
  );
};

export const SmallText = ({
  children,
  as = "text",
  href,
  style,
}: PropsWithChildren<{
  as?: "text" | "link";
  href?: string;
  style?: Style;
}>) => {
  if (as === "link") {
    return (
      <PDFText style={{ ...styles.smallText, ...style }}>
        <PDFLink href={href} style={styles.link}>
          {children}
        </PDFLink>
      </PDFText>
    );
  } else {
    return (
      <PDFText style={{ ...styles.smallText, ...style }}>{children}</PDFText>
    );
  }
};

export const SubText = ({
  children,
  style,
}: PropsWithChildren<{ bold?: boolean; style?: Style }>) => {
  return <PDFText style={{ ...styles.subText, ...style }}>{children}</PDFText>;
};
