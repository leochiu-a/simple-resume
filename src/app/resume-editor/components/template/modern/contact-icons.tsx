import { View } from "@react-pdf/renderer";

import { pt } from "./units";

/**
 * The contact rows are prefixed by a small disc with the glyph outlined on it —
 * `disc` is the sidebar ink and `glyph` the sidebar background, so the pair stays
 * legible whichever colour the panel is.
 *
 * The glyphs are built from plain views rather than SVG on purpose. The preview
 * renders this tree as DOM (see `resume-iframe.tsx`), where @react-pdf's `Svg`
 * becomes an unknown element and draws nothing; a bordered box renders the same
 * in the PDF and in the browser. That leaves three shapes to tell apart, so each
 * icon is a distinct silhouette: wide for mail, tall for phone, round for place.
 */

export interface IconProps {
  disc: string;
  glyph: string;
}

const discStyle = (backgroundColor: string) => ({
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  flexShrink: 0,
  width: pt(20),
  height: pt(20),
  borderRadius: pt(10),
  backgroundColor,
});

const glyphStyle = (borderColor: string) => ({
  borderStyle: "solid" as const,
  borderWidth: pt(1.2),
  borderColor,
});

export const MailIcon = ({ disc, glyph }: IconProps) => (
  <View style={discStyle(disc)}>
    <View style={{ ...glyphStyle(glyph), width: pt(11), height: pt(8), borderRadius: pt(1) }} />
  </View>
);

export const PhoneIcon = ({ disc, glyph }: IconProps) => (
  <View style={discStyle(disc)}>
    <View style={{ ...glyphStyle(glyph), width: pt(7), height: pt(11), borderRadius: pt(1.5) }} />
  </View>
);

export const LocationIcon = ({ disc, glyph }: IconProps) => (
  <View style={discStyle(disc)}>
    <View style={{ ...glyphStyle(glyph), width: pt(8), height: pt(8), borderRadius: pt(4) }} />
  </View>
);
