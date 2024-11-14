import { Font, Text as PDFText, StyleSheet } from "@react-pdf/renderer";
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
    fontSize: 16,
    lineHeight: 1.5,
    marginBottom: 2,
    display: "flex",
  },
  text: {
    fontFamily: "Noto Sans",
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  subText: {
    fontFamily: "Noto Sans",
    fontSize: 9,
    lineHeight: 1.2,
    color: "#B3B8C0",
    letterSpacing: 1.5,
  },
});

export const Title = ({ children }: PropsWithChildren) => {
  return <PDFText style={styles.title}>{children}</PDFText>;
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

export const SubText = ({
  children,
}: PropsWithChildren<{ bold?: boolean }>) => {
  return <PDFText style={styles.subText}>{children}</PDFText>;
};
