import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Schibsted_Grotesk } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/react";

import MotionProvider from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/constants/site";

import "./globals.css";

/**
 * Only the landing page opts into these — the editor keeps the system stack set
 * in globals.css, so its chrome stays out of the way of the sheet it is showing.
 *
 * One grotesk carries the headings and a second the prose, which is the shape this
 * kind of product page wants: the display face has to hold tight negative tracking
 * at 72px without turning into a logo, and the body face has to stay legible at
 * 17px for a paragraph. Neither is Inter — that is the face this look defaults to,
 * and defaulting is the thing being avoided.
 */
const display = Schibsted_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

/** Kept for the metadata rows and tool names — the places where a figure or an
 *  identifier should line up rather than read as prose. Geist Mono was the first
 *  choice and its files would not resolve from Google Fonts here, so this stays on
 *  the mono the project already shipped rather than blocking on it. */
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  /* Without this, the generated `opengraph-image` is emitted against `http://localhost:3000`,
     which is the address of the machine that built the page and of nothing a crawler
     can fetch — so every share renders with no image. It is the base every relative
     metadata URL resolves against, not a canonical-URL declaration. */
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    /* Both stated explicitly: Open Graph consumers key off `url` for the canonical
       destination, and `type` defaults to nothing, which some scrapers treat as
       unshareable. */
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    /* The card format the existing 1200×630 image is already the right shape for. */
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="antialiased bg-background">
        <NextTopLoader showSpinner={false} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
