import { Text as PDFText, StyleSheet, Link as PDFLink } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { ComponentProps, PropsWithChildren } from "react";

import "../fonts";

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
    /** The sidebar, where links started out — see the colour note in Typography. */
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
    // A PDF link carries its own colour rather than inheriting one, so the text
    // style's colour has to be handed down explicitly — otherwise a link in the
    // white content column comes out in the sidebar's white and disappears.
    return (
      <PDFText style={textStyle}>
        <PDFLink
          href={href}
          style={{ ...styles.link, color: textStyle.color ?? styles.link.color }}
        >
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
