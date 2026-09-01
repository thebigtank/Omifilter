import type { Metadata } from "next";
import { Newsreader, Josefin_Sans, IBM_Plex_Mono } from "next/font/google";
import "./landing.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "OmiFilter — Clean water from your own tap",
  description:
    "OmiFilter is a dual-ceramic faucet filter that screws onto a standard Nigerian tap in sixty seconds. It takes out the rust, sediment, chlorine and bacteria your family cannot see.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The reveal boot script stamps `data-reveal-ready` on <html> during parse,
    // before hydration, so the server markup and the client DOM differ on that
    // attribute by design (no-JS must never get it, or content stays hidden).
    // suppressHydrationWarning silences only this element's own attribute diff.
    <html
      lang="en"
      className={`${newsreader.variable} ${josefinSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
