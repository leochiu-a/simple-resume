import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

/**
 * The shared pieces behind the icon and Open Graph routes.
 *
 * These images are drawn from code rather than checked in as artwork because the
 * two that were checked in — a black circle-and-triangle favicon and an
 * `opengraph-image.png` still reading "Simple Resume" — were both left over from a
 * design the site no longer has. A PNG cannot follow a rebrand; a component can.
 *
 * Satori (what `next/og` renders with) does not read the stylesheet, so the palette
 * is restated here as hex. These are the light-mode `--c-*` tokens from
 * `globals.css` converted once: the ramp stops, the page surface and the two inks.
 * Light mode only — a share card has no theme to follow.
 */
const G1 = "#10B77F";
const G2 = "#14ADB8";
const G3 = "#5048E5";

const GRADIENT = `linear-gradient(100deg, ${G1}, ${G2} 46%, ${G3})`;

const PAPER = "#FBFBFE";
const GRAPHITE = "#0F111A";
const GRAPHITE_SOFT = "#65656F";

/**
 * The nav mark: the ramp, boxed, with a sheet of paper on it.
 *
 * Proportions come from `site-nav.tsx`, where the mark is a 28px square with a 9px
 * radius holding a 10px square with a 3px one — kept as ratios so the same mark can
 * be a 32px favicon and a 56px badge on the share card without being redrawn.
 */
export const Mark = ({ size }: { size: number }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      borderRadius: size * 0.32,
      backgroundImage: GRADIENT,
    }}
  >
    <div
      style={{
        width: size * 0.36,
        height: size * 0.36,
        borderRadius: size * 0.11,
        background: "rgba(255,255,255,0.95)",
      }}
    />
  </div>
);

/** The size every Open Graph consumer expects, and the one the `summary_large_image`
 *  Twitter card is cropped for. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Read at render time rather than at module scope: the icon routes import `Mark`
 *  from this file and have no text on them, so they should not pay for a font. */
const font = (file: string) => readFileSync(join(process.cwd(), "src/assets/fonts", file));

type Card = {
  /** The headline, split so the middle phrase can carry the ramp the way the hero's
   *  headline does. */
  lead: string;
  highlight: string;
  tail: string;
  /** The pill under the mark — the same three claims the hero badge makes. */
  eyebrow: string;
};

export const renderOgCard = ({ lead, highlight, tail, eyebrow }: Card) =>
  new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "72px 80px",
        background: PAPER,
        color: GRAPHITE,
        fontFamily: "Schibsted Grotesk",
        position: "relative",
      }}
    >
      {/* The hero's ambient field, flattened to one blob. Sat behind everything and
            bled off the top-right corner so the card has somewhere to breathe rather
            than being type on a flat rectangle. */}
      <div
        style={{
          position: "absolute",
          top: -260,
          right: -200,
          width: 820,
          height: 820,
          borderRadius: 820,
          /* Fully transparent well before the box edge. A radial gradient sizes
               itself to the farthest corner, so stops that only reach clear at 70%
               are still faintly tinted along the sides — which draws the blob's
               square as a seam across the card. */
          backgroundImage: `radial-gradient(circle, ${G2}30 0%, ${G3}16 30%, ${PAPER}00 52%)`,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Mark size={56} />
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>Open Resume</div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
          fontSize: 76,
          fontWeight: 600,
          lineHeight: 1.08,
          letterSpacing: "-0.032em",
        }}
      >
        {/* One flex row per line so the ramp lands on the phrase rather than on the
              whole block — satori has no inline flow to wrap a span in. */}
        <div style={{ display: "flex" }}>{lead}</div>
        <div style={{ display: "flex", gap: 20 }}>
          <div
            style={{
              backgroundImage: GRADIENT,
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {highlight}
          </div>
          {/* Omitted rather than rendered empty: the row's gap would otherwise hang
                off the end of a headline whose highlight is its last phrase. */}
          {tail ? <div style={{ display: "flex" }}>{tail}</div> : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 48,
          fontSize: 26,
          color: GRAPHITE_SOFT,
        }}
      >
        {eyebrow}
      </div>

      {/* The ramp again, as the card's bottom edge — the one place it is allowed to
            be a full-width band, which is what keeps it a signature instead of a wash. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 10,
          backgroundImage: GRADIENT,
        }}
      />
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        {
          name: "Schibsted Grotesk",
          data: font("SchibstedGrotesk-Regular.ttf"),
          weight: 400,
          style: "normal",
        },
        {
          name: "Schibsted Grotesk",
          data: font("SchibstedGrotesk-SemiBold.ttf"),
          weight: 600,
          style: "normal",
        },
      ],
    },
  );
