import type { Metadata } from "next";
import Link from "next/link";
import "./policies.css";
import SiteHeader from "../SiteHeader";

export const metadata: Metadata = {
  title: "Policies — OmiFilter",
  description:
    "How OmiFilter gets a filter to every Nigerian state, and the 30-day money-back guarantee behind every order.",
};

export default function PoliciesPage() {
  return (
    <>
      <SiteHeader variant="page" />

      <main className="policies-main">
        <div className="shell">
          <header className="policies-intro">
            <p className="eyebrow">Policies</p>
            <h1 className="policies-intro__title">
              Delivery &amp; returns, plainly put.
            </h1>
            <p className="policies-intro__lede">
              How a filter gets to your tap, and what happens if anything
              isn’t right. Every order ships with a tracking number and is
              covered by a 30-day money-back guarantee.
            </p>
          </header>

          <div className="policies-stack">
            {/* Delivery ---------------------------------------------------- */}
            <section className="policy" aria-labelledby="delivery-title">
              <header className="policy__head">
                <span className="policy__num">01</span>
                <h2 className="policy__title" id="delivery-title">
                  Delivery Policy
                </h2>
              </header>

              <div className="policy__body">
                <p className="policy__lead">
                  OmiWater Filter delivers to all 36 states and the FCT.
                  Orders are processed within 1 to 2 business days of payment
                  confirmation.
                </p>

                <p className="policy__rule">Estimated delivery after dispatch</p>
                <ul className="policy__dest">
                  <li className="policy__dest-row">
                    <span className="policy__where">Lagos</span>
                    <span className="policy__when">2 to 3 business days</span>
                  </li>
                  <li className="policy__dest-row">
                    <span className="policy__where">
                      Abuja, Port Harcourt, Warri and Ibadan
                    </span>
                    <span className="policy__when">3 to 5 business days</span>
                  </li>
                  <li className="policy__dest-row">
                    <span className="policy__where">Other states</span>
                    <span className="policy__when">
                      5 to 10 business days
                      <span aria-hidden="true"> · </span>depending on location
                    </span>
                  </li>
                </ul>

                <p className="policy__lead">
                  A tracking number is provided for every order via WhatsApp
                  or email after dispatch.
                </p>
              </div>
            </section>

            {/* Returns ------------------------------------------------------ */}
            <section className="policy" aria-labelledby="returns-title">
              <header className="policy__head">
                <span className="policy__num">02</span>
                <h2 className="policy__title" id="returns-title">
                  Return and Refund Policy
                </h2>
              </header>

              <div className="policy__body">
                <div className="policy__guarantee">
                  <span className="policy__guarantee-mark">Guarantee</span>
                  <p className="policy__guarantee-text">
                    30-day money-back guarantee on all purchases.
                  </p>
                </div>

                <ul className="policy__points">
                  <li className="policy__point">
                    If you are unsatisfied with your product for any reason
                    within 30 days of delivery, contact us via WhatsApp or
                    email with your order details.
                  </li>
                  <li className="policy__point">
                    Damaged items must be reported within 24 hours of
                    delivery with a photograph.
                  </li>
                  <li className="policy__point">
                    Approved refunds are processed within 3 to 5 business
                    days back to your original payment method.
                  </li>
                  <li className="policy__point">
                    Return shipping for items is at the buyer’s cost.
                  </li>
                  <li className="policy__point">
                    Replacement units are dispatched within 48 hours for
                    confirmed damaged or defective products.
                  </li>
                </ul>
              </div>
            </section>
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
              <Link href="/policies" aria-current="page">
                Policies
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
