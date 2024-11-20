import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Simple Resume",
  description: "A online tool to create a resume",
  openGraph: {
    title: "Simple Resume",
    description: "A online tool to create a resume",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <NextTopLoader showSpinner={false} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
