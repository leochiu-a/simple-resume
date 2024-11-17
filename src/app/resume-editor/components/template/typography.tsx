import {
  Font,
  Text as PDFText,
  StyleSheet,
  Link as PDFLink,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { ComponentProps, PropsWithChildren } from "react";

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
      src: "/fonts/NotoSans-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});
// https://github.com/diegomura/react-pdf/issues/1418
Font.registerHyphenationCallback((word) => ["", word, ""]);

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

const Typography = ({
  children,
  as,
  style,
  href,
  bold,
}: PropsWithChildren<{
  fontFamily?: "Noto Serif" | "Noto Sans";
  style?: Style;
  as?: "text" | "link";
  href?: string;
  bold?: boolean;
}>) => {
  const textStyle: Style = { fontWeight: bold ? "bold" : "normal", ...style };

  if (as === "link") {
    return (
      <PDFText style={textStyle}>
        <PDFLink href={href} style={styles.link}>
          {children}
        </PDFLink>
      </PDFText>
    );
  } else {
    return <PDFText style={textStyle}>{children}</PDFText>;
  }
};

const createTypographyComponent = (defaultStyle: Style) => {
  const Component = ({
    children,
    style,
    ...props
  }: PropsWithChildren<ComponentProps<typeof Typography>>) => (
    <Typography style={{ ...defaultStyle, ...style }} {...props}>
      {children}
    </Typography>
  );

  return Component;
};

export const Title = createTypographyComponent(styles.title);
export const SubTitle = createTypographyComponent(styles.subtitle);
export const Text = createTypographyComponent(styles.text);
export const SmallText = createTypographyComponent(styles.smallText);
export const SubText = createTypographyComponent(styles.subText);
