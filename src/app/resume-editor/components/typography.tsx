import { Font, Text as PDFText, StyleSheet } from "@react-pdf/renderer";
import { PropsWithChildren } from "react";

Font.register({
  family: "Noto Serif",
  src: "/fonts/NotoSerif-Bold.ttf",
  fontWeight: "bold",
});
Font.register({
  family: "Noto Sans",
  src: "/fonts/NotoSans-Regular.ttf",
});

const styles = StyleSheet.create({
  title: {
    fontFamily: "Noto Serif",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  text: {
    fontFamily: "Noto Sans",
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  subText: {
    fontFamily: "Noto Sans",
    fontSize: 12,
    lineHeight: 1.3,
    color: "#B3B8C0",
  },
});

export const Title = ({ children }: PropsWithChildren) => {
  return <PDFText style={styles.title}>{children}</PDFText>;
};

export const Text = ({
  children,
  bold,
}: PropsWithChildren<{ bold?: boolean }>) => {
  return <PDFText style={styles.text}>{children}</PDFText>;
};

export const SubText = ({
  children,
  bold,
}: PropsWithChildren<{ bold?: boolean }>) => {
  return <PDFText style={styles.subText}>{children}</PDFText>;
};
