import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./faq.css";
import { FaqList } from "./faq-list";

export const metadata: Metadata = {
  title: "FAQ — OmiFilter",
  description:
    "Answers to the questions Nigerian families ask before they order OmiFilter — tap fit, E. coli removal, delivery to all 36 states, cartridges and the 30-day money-back guarantee.",
};

const faqs = [
  {
    title: "Will this fit my tap?",
    body: "It fits standard Nigerian kitchen and bathroom taps with a threaded aerator opening, which covers the large majority of homes in Lagos, Abuja and Port Harcourt. If you are unsure, send a photo of your tap on WhatsApp and we will confirm before you order.",
  },
  {
    title: "Does it remove E. coli?",
    body: "The dual ceramic composite media traps micro-organisms above 0.1 microns, significantly reducing E. coli and other pathogens. For full household safety we recommend a filter on every drinking and cooking tap.",
  },
  {
    title: "How long does a cartridge last?",
    body: "Three to six months, depending on how contaminated your supply is. When the flow noticeably slows, the ceramic has reached capacity — unscrew and replace. The housing itself stays on the tap for years.",
  },
  {
    title: "Do I need a plumber?",
    body: "No. Unscrew your existing aerator, screw on OmiFilter by hand, done — under sixty seconds, no tools. A picture guide comes with every order.",
  },
  {
    title: "What if it does not work for me?",
    body: "Thirty-day satisfaction guarantee. If your water does not visibly improve within thirty days, message us on WhatsApp for a full refund. We are a Nigerian family business and our reputation is the product.",
  },
  {
    title: "Can I use it for cooking water?",
    body: "Yes, and we recommend it. Boiling kills bacteria but leaves heavy metals, rust and chemical residues behind. A filter on the kitchen tap covers drinking and cooking at once.",
  },
  {
    title: "Is OmiFilter a scam? How do I know it is legit?",
    body: "Completely fair to ask. OmiFilter is a registered Nigerian business, the filter is CE certified, and every order carries a 30-day money-back guarantee — a full refund if you are not satisfied. Real Nigerian families use it every day; message us on WhatsApp if you would like to talk it through before you order.",
  },
  {
    title: "Why do I have to pay before delivery?",
    body: "We do not offer cash on delivery — it is how delivery scams run in Nigeria, against buyers as much as sellers. Your protection is the 30-day money-back guarantee: if your filter does not arrive, or does not perform as described, we refund every naira. Message us first if you want to verify us or speak to a customer before you pay anything.",
  },
  {
    title: "Do you deliver to my state? How long does it take?",
    body: "Yes — we deliver to all 36 states and the FCT. After dispatch: Lagos in 2 to 3 business days; Abuja, Port Harcourt, Warri and Ibadan in 3 to 5; every other state in 5 to 10, depending on location. Every order gets a tracking number by WhatsApp or email, and the full timelines are on our Policies page.",
  },
  {
    title: "What if the filter arrives damaged?",
    body: "Report it within 24 hours of delivery with a photograph, and we will send a replacement within 48 hours — no charge. We pack every order carefully to survive transit, but if damage happens we make it right fast.",
  },
  {
    title: "Our water pressure is very low. Will the filter still work?",
    body: "Yes. OmiFilter is built for the low to normal pressure found across most Nigerian homes, including gravity-fed tank systems. It does not need high pressure — water pressure alone drives it through the ceramic.",
  },
  {
    title: "The water flow from my OmiFilter is slow. What should I do?",
    body: "OmiFilter needs standard tap pressure to run at full flow. If yours is slow, make sure you are connected to the tap with the strongest pressure in your home — usually the one closest to your overhead tank or borehole pump, and ground floor taps beat upper floor taps. If pressure is low on every tap, ask your borehole technician to check the pump output. The filter itself is working correctly — low flow simply means low incoming pressure.",
  },
  {
    title: "Can I use it on water from my overhead tank?",
    body: "Yes, and it is one of the best uses. Overhead tanks collect sediment and bacteria over time; OmiFilter installs on the tap and catches all of it at the point of use, before it reaches your glass.",
  },
  {
    title: "Does it need electricity, like for a borehole?",
    body: "None at all. OmiFilter is purely mechanical — water pressure does the work, so it behaves exactly the same whether your borehole runs on mains, generator, or solar.",
  },
  {
    title: "Where do I get replacement cartridges?",
    body: "Directly from us. Message us on WhatsApp and we will deliver replacements to your location; we keep cartridges in stock so your protection is never interrupted. Swapping one takes seconds — no plumber, no tools.",
  },
  {
    title: "Do you offer bulk pricing for a shop or office?",
    body: "Yes. If you need to cover many taps — offices, salons, restaurants, small businesses — message us on WhatsApp for a bulk quote. For larger institutional orders like churches, schools or hospitals we make special arrangements.",
  },
  {
    title: "Is this the same as the cheap filters sold in the market?",
    body: "No. Most market filters are single-stage sediment screens with no certification and unknown media. OmiFilter is CE certified with dual ceramic composite media that targets E. coli, rust, heavy metals, chlorine and sediment. The difference is the science, the certification, and the guarantee.",
  },
  {
    title: "Can my family abroad buy this as a gift for us?",
    body: "Yes — this happens a lot with diaspora families. They order and pay from anywhere in the world, enter your Nigerian delivery address, and we deliver straight to your door. It makes a genuinely useful, life-protecting gift.",
  },
];

export default function FaqPage() {
  return (
    <>
      <header className="policies-bar">
        <div className="shell policies-bar__inner">
          <Link href="/" className="policies-bar__wordmark">
            Omi<em>Filter</em>
          </Link>
          <Link href="/#order" className="btn btn--teal">
            Order OmiFilter
          </Link>
        </div>
      </header>

      <main className="policies-main">
        <div className="shell">
          <header className="policies-intro">
            <p className="eyebrow">FAQ</p>
            <h1 className="policies-intro__title">
              Questions answered.
            </h1>
            <p className="policies-intro__lede">
              Everything Nigerian families ask before they order — tap fit, E. coli
              removal, delivery to all 36 states and the FCT, cartridges and the
              30-day money-back guarantee. Still not sure? Message us on WhatsApp
              before you order.
            </p>
          </header>

          <div className="faq-layout">
            <div className="faq-page">
              <FaqList faqs={faqs} />
            </div>
            <aside className="faq-side" aria-label="OmiWater filter illustration">
              <Image
                src="/faq-water-filter.jpg"
                alt="OmiWater filter turning 1000+ TDS, heavily scaled and polluted water into pure, clean drinking water"
                width={1024}
                height={1280}
                className="faq-side__img"
                priority
              />
            </aside>
          </div>
        </div>
      </main>

      <footer className="site-footer policies-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <p className="site-footer__logo">OmiFilter</p>
            <p className="site-footer__desc">
              Clean water for Nigerian homes. The OmiFilter faucet filter
              removes E. coli, rust and heavy metals from your tap — installs
              in 60 seconds, no plumber required.
            </p>
          </div>

          <div className="site-footer__bar">
            <p className="site-footer__copy">
              © 2026 OmiFilter Nigeria. All rights reserved.
            </p>
            <nav className="site-footer__meta" aria-label="Site">
              <Link href="/">Home</Link>
              <Link href="/faq" aria-current="page">
                FAQ
              </Link>
            </nav>
          </div>
        </div>

        <p className="site-footer__watermark" aria-hidden="true">
          OmiFilter
        </p>
      </footer>
    </>
  );
}
