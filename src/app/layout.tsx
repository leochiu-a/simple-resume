import type { Metadata } from "next";
import { Archivo, Fraunces, IBM_Plex_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/react";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

/**
 * Only the landing page opts into these — the editor keeps the system stack set
 * in globals.css, so its chrome stays out of the way of the sheet it is showing.
 */
const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

const body = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

const DESCRIPTION =
  "Write a resume in the browser and export it as a PDF or a single self-contained HTML file. No account, no upload — it is saved in your browser's storage and nowhere else.";

export const metadata: Metadata = {
  title: "Simple Resume — a resume that never leaves your browser",
  description: DESCRIPTION,
  openGraph: {
    title: "Simple Resume — a resume that never leaves your browser",
    description: DESCRIPTION,
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
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
