import type { Metadata } from "next";
import { Josefin_Sans, Raleway } from "next/font/google";
import "./landing.css";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
  weight: ["400", "500", "600", "700"],
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OmiWater — Clean Water From Your Tap",
  description:
    "The OmiWater faucet filter removes E. coli, rust, and heavy metals from Nigerian tap water. Installs in 60 seconds, no plumber required.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${josefinSans.variable} ${raleway.variable}`}>
      <body>{children}</body>
    </html>
  );
}
