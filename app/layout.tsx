import type { Metadata } from "next";
import "./landing.css";

export const metadata: Metadata = {
  title: "OmiWater — Clean Water From Your Tap",
  description:
    "The OmiWater faucet filter removes E. coli, rust, and heavy metals from Nigerian tap water. Installs in 60 seconds, no plumber required.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
