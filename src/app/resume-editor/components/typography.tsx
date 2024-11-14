import { Font, Text as PDFText, StyleSheet } from "@react-pdf/renderer";
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
  },
  text: {
    fontFamily: "Noto Sans",
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  subText: {
    fontFamily: "Noto Sans",
    fontSize: 10,
    lineHeight: 1.2,
    color: "#B3B8C0",
  },
});

export const Title = ({ children }: PropsWithChildren) => {
  return <PDFText style={styles.title}>{children}</PDFText>;
};

export const Text = ({
  children,
  bold = false,
}: PropsWithChildren<{ bold?: boolean }>) => {
  return (
    <PDFText
      style={{
        ...styles.text,
        fontWeight: bold ? "bold" : "normal",
      }}
    >
      {children}
    </PDFText>
  );
};

export const SubText = ({
  children,
  bold,
}: PropsWithChildren<{ bold?: boolean }>) => {
  return <PDFText style={styles.subText}>{children}</PDFText>;
};
