import type { Metadata } from "next";
import Script from "next/script";
import { Newsreader, Josefin_Sans, IBM_Plex_Mono } from "next/font/google";
import SiteChrome from "./SiteChrome";
import "./landing.css";

const META_PIXEL_ID = "1029781434361659";

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
      <body>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
