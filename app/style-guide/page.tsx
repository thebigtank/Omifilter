import type { Metadata } from "next";
import Link from "next/link";
import "./style-guide.css";

export const metadata: Metadata = {
  title: "Style Guide — OmiWater",
  description:
    "Five grayscale pricing-card variations for the OmiWater order modal, in wireframe.",
};

/* ════════════════════════════════════════════════════════════════════
   Shared copy — VERBATIM from the live order modal in app/page.tsx
   (lines 1359–1444). Em/en dashes, the naira sign and the arrow are
   preserved exactly as they appear in the source.
   ════════════════════════════════════════════════════════════════════ */

const EYEBROW = "Order OmiWater Today";
const TITLE_ONE = "Choose Your Protection.";
const TITLE_TWO = "Delivered To Your Door.";

type Tier = {
  id: string;
  name: string;
  price: string;
  units: string;
  save: string;
  /* Anchor price (derived from the stated savings) used only by the
     hangtag variation to show the "was ₦X" strikethrough. */
  anchor?: string;
  popular?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "single",
    name: "Single Unit",
    price: "₦17,500",
    units: "1 filter unit",
    save: "Kitchen tap protection",
  },
  {
    id: "family",
    name: "Family Pack",
    price: "₦32,000",
    units: "2 filter units",
    save: "SAVE ₦3,000 — Kitchen + Bathroom",
    anchor: "₦35,000",
    popular: true,
  },
  {
    id: "home",
    name: "Full Home",
    price: "₦45,000",
    units: "3 filter units",
    save: "SAVE ₦7,500 — All taps covered",
    anchor: "₦52,500",
  },
];

const GUARANTEE =
  "30-day satisfaction guarantee. If your water is not visibly cleaner within 30 days — full refund. No questions.";

const TRUST = [
  "Delivered Lagos & Abuja",
  "Pay on delivery",
  "30-day guarantee",
  "WhatsApp support",
];

const pad = (n: number) => String(n).padStart(2, "0");

/* ── Waybill barcode bar widths (module-level so x positions are stable) ── */

const WAYBILL_BARS = [3, 1, 2, 1, 4, 2, 1, 3, 1, 1, 5, 2, 3, 1, 2, 1, 4, 2, 1, 3];
const WAYBILL_BAR_DATA: { x: number; w: number }[] = (() => {
  const data: { x: number; w: number }[] = [];
  let x = 0;
  for (const w of WAYBILL_BARS) {
    data.push({ x, w });
    x += w + 1.5;
  }
  return data;
})();

/* ════════════════════════════════════════════════════════════════════
   Shared modal mockup pieces
   Each variation renders a STATIC mockup of the modal panel — the white
   card with its close button, header, pricing concept, and the shared
   guarantee / CTA / trust-row footer. No live overlay JS.
   ════════════════════════════════════════════════════════════════════ */

function CloseButton() {
  return (
    <button
      type="button"
      className="sg-modal__close"
      aria-label="Close order dialog (mockup)"
      tabIndex={-1}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function ModalFooter() {
  return (
    <div className="sg-modal__footer">
      <div className="sg-modal__guarantee">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>{GUARANTEE}</span>
      </div>

      <div className="sg-modal__cta">
        <span className="sg-modal__cta-btn">Order on WhatsApp — Pay on Delivery →</span>
        <ul className="sg-modal__trust" role="list" aria-label="Delivery details">
          {TRUST.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ModalShell({
  variation,
  children,
}: {
  variation: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sg-modal" role="group" aria-label={`Static mockup — ${variation}`}>
      <CloseButton />
      <span className="sg-modal__eyebrow">{EYEBROW}</span>
      <h2 className="sg-modal__title">
        {TITLE_ONE}
        <br />
        {TITLE_TWO}
      </h2>
      {children}
      <ModalFooter />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   VARIATION 01 — Till Receipt
   Conceptual object: a POINT-OF-SALE RECEIPT. The three tiers are line
   items on one continuous thermal slip — dashed separators, right-aligned
   ₦ prices, a perforation with scissors, a "TOTAL DUE TODAY ₦0.00" row
   (nothing is due because you pay on delivery), and a rotated
   "PAY ON DELIVERY" stamp. The Family Pack line is bracketed as the
   receipt's "★ MOST POPULAR" pick.
   ════════════════════════════════════════════════════════════════════ */

function ReceiptVariation() {
  return (
    <div className="sg-receipt" aria-label="Pricing as a till receipt">
      <div className="sg-receipt__paper">
        <header className="sg-receipt__mast">
          <p className="sg-receipt__shop">OMI•WATER</p>
          <p className="sg-receipt__kicker">Point of sale · Price list</p>
        </header>

        <div className="sg-receipt__dash" aria-hidden="true" />

        <ol className="sg-receipt__lines" role="list" aria-label="Packages on this receipt">
          {TIERS.map((tier) => (
            <li
              className={"sg-receipt__line" + (tier.popular ? " sg-receipt__line--featured" : "")}
              key={tier.id}
            >
              <div className="sg-receipt__row">
                <span className="sg-receipt__qty">1×</span>
                <span className="sg-receipt__name">{tier.name}</span>
                {tier.popular && (
                  <span className="sg-receipt__tag" aria-hidden="true">
                    ★ Most Popular
                  </span>
                )}
                <span className="sg-receipt__dots" aria-hidden="true" />
                <span className="sg-receipt__price">{tier.price}</span>
              </div>
              <p className="sg-receipt__units">{tier.units}</p>
              <p className="sg-receipt__save">{tier.save}</p>
            </li>
          ))}
        </ol>

        <div className="sg-receipt__perf" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="9" y2="15" />
            <line x1="20" y1="20" x2="9" y2="9" />
          </svg>
        </div>

        <dl className="sg-receipt__total">
          <div className="sg-receipt__totalrow">
            <dt>Total due today</dt>
            <dd>₦0.00</dd>
          </div>
          <p className="sg-receipt__totalnote">Pay when your pack is delivered.</p>
        </dl>

        <p className="sg-receipt__stamp" aria-hidden="true">
          Pay on Delivery
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   VARIATION 02 — À la Carte
   Conceptual object: a RESTAURANT MENU. The tiers are menu entries with
   dotted leaders running to right-aligned prices, descriptions beneath,
   a "MAIN PROTECTION" section rule, and the Family Pack boxed up as the
   "✳ CHEF'S CHOICE" of the house. A dark cover band headers the card.
   ════════════════════════════════════════════════════════════════════ */

function MenuVariation() {
  return (
    <article className="sg-menu" aria-label="Pricing as a restaurant menu">
      <header className="sg-menu__head">
        <p className="sg-menu__kicker">OmiWater · Kitchen &amp; Bath</p>
        <h3 className="sg-menu__name">The Clean Water Menu</h3>
        <p className="sg-menu__tagline">Served straight from your tap</p>
      </header>

      <div className="sg-menu__body">
        <p className="sg-menu__heading">
          <span aria-hidden="true">—</span> Main Protection <span aria-hidden="true">—</span>
        </p>

        <ul className="sg-menu__list" role="list" aria-label="Packages on the menu">
          {TIERS.map((tier) => (
            <li
              className={"sg-menu__item" + (tier.popular ? " sg-menu__item--choice" : "")}
              key={tier.id}
            >
              {tier.popular && (
                <span className="sg-menu__choice" aria-hidden="true">
                  ✳ Chef&rsquo;s Choice
                </span>
              )}
              <div className="sg-menu__row">
                <span className="sg-menu__itemname">{tier.name}</span>
                <span className="sg-menu__leader" aria-hidden="true" />
                <span className="sg-menu__price">{tier.price}</span>
              </div>
              <p className="sg-menu__desc">
                {tier.units} · {tier.save}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <footer className="sg-menu__note">
        <span aria-hidden="true">✳</span> All mains include a 30-day satisfaction guarantee
      </footer>
    </article>
  );
}

/* ════════════════════════════════════════════════════════════════════
   VARIATION 03 — On the Rack
   Conceptual object: PRICE-TAG HANGTAGS. Three physical paper tags hang
   from a rail on strings, each punched with a hole at the top, oversized
   ₦ price, and a struck-through anchor price showing the saving
   (₦35,000 → ₦32,000; ₦52,500 → ₦45,000). The Family Pack hangs higher,
   larger and inverted, with a "BEST VALUE" crimp ribbon.
   ════════════════════════════════════════════════════════════════════ */

function TagsVariation() {
  return (
    <div className="sg-tags" aria-label="Pricing as hanging price tags">
      <span className="sg-tags__rail" aria-hidden="true" />
      {TIERS.map((tier) => (
        <article
          className={
            "sg-tag" +
            (tier.popular
              ? " sg-tag--featured"
              : tier.id === "single"
                ? " sg-tag--left"
                : " sg-tag--right")
          }
          key={tier.id}
        >
          <span className="sg-tag__hole" aria-hidden="true" />
          {tier.popular && (
            <span className="sg-tag__ribbon" aria-hidden="true">
              Best Value
            </span>
          )}
          <p className="sg-tag__label">{tier.name}</p>
          <p className="sg-tag__price">{tier.price}</p>
          {tier.anchor && (
            <p className="sg-tag__anchor" aria-hidden="true">
              was {tier.anchor}
            </p>
          )}
          <p className="sg-tag__units">{tier.units}</p>
          <p className="sg-tag__save">{tier.save}</p>
        </article>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   VARIATION 04 — The Membership
   Conceptual object: LOYALTY / WALLET CARDS. Three credit-card-sized
   memberships fanned in a row — "TIER 01 / 02 / 03" mono labels, member
   numbers, a barcode strip, and a punched-benefits row. The Family Pack
   is the dark premium card, raised and pulled forward, carrying a notched
   "MOST POPULAR" tab cut into its top edge.
   ════════════════════════════════════════════════════════════════════ */

function WalletVariation() {
  return (
    <div className="sg-wallet" aria-label="Pricing as membership cards">
      {TIERS.map((tier, i) => (
        <article
          className={
            "sg-card" +
            (tier.popular
              ? " sg-card--featured"
              : tier.id === "single"
                ? " sg-card--left"
                : " sg-card--right")
          }
          key={tier.id}
        >
          {tier.popular && (
            <span className="sg-card__tab" aria-hidden="true">
              Most Popular
            </span>
          )}
          <p className="sg-card__row">
            <span className="sg-card__tier">Tier {pad(i + 1)}</span>
            <span className="sg-card__no">OMW·0421</span>
          </p>
          <span className="sg-card__barcode" aria-hidden="true" />
          <h3 className="sg-card__name">{tier.name}</h3>
          <p className="sg-card__price">{tier.price}</p>
          <p className="sg-card__units">{tier.units}</p>
          <p className="sg-card__save">{tier.save}</p>
          <ul className="sg-card__punch" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((p) => (
              <li
                key={p}
                className={"sg-card__hole" + (p < (tier.id === "single" ? 3 : 5) ? " sg-card__hole--on" : "")}
              />
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   VARIATION 05 — Courier Manifest
   Conceptual object: a COURIER WAYBILL. The tiers are rows on a delivery
   manifest where you tick (radio) the pack you want — the Family Pack is
   pre-ticked — with QTY, price, a "DELIVER TO" block (Lagos pre-checked),
   a barcode and a "PAY ON DELIVERY" notice. Choosing a pack is the act of
   ticking one line.
   ════════════════════════════════════════════════════════════════════ */

function WaybillVariation() {
  return (
    <div className="sg-waybill" aria-label="Pricing as a courier waybill">
      <header className="sg-waybill__band">
        <span className="sg-waybill__carrier">OMW Express</span>
        <span className="sg-waybill__notify">Pay on Delivery</span>
      </header>

      <div className="sg-waybill__body">
        <header className="sg-waybill__head">
          <div>
            <p className="sg-waybill__doc">Courier Waybill · Nº 000421</p>
            <p className="sg-waybill__route">
              FROM <strong>Lagos Hub</strong> → TO{" "}
              <span className="sg-waybill__blank">your door</span>
            </p>
          </div>
          <p className="sg-waybill__service">Service · OMW Standard</p>
        </header>

        <p className="sg-waybill__prompt">
          <span className="sg-waybill__promptdot" aria-hidden="true" /> Tick your pack — pay
          when it arrives
        </p>

        <div className="sg-waybill__rows">
          <p className="sg-waybill__labels" aria-hidden="true">
            <span>Tick</span>
            <span>Pack &amp; savings</span>
            <span>Price</span>
          </p>
          {TIERS.map((tier) => (
            <div
              className={"sg-waybill__row" + (tier.popular ? " sg-waybill__row--ticked" : "")}
              key={tier.id}
            >
              <span className="sg-waybill__tick" aria-hidden="true">
                {tier.popular && <span className="sg-waybill__tickdot" />}
              </span>
              <div className="sg-waybill__pack">
                <p className="sg-waybill__name">{tier.name}</p>
                <p className="sg-waybill__desc">
                  {tier.units} · {tier.save}
                </p>
              </div>
              <span className="sg-waybill__price">{tier.price}</span>
            </div>
          ))}
        </div>

        <div className="sg-waybill__deliver">
          <p className="sg-waybill__label">Deliver to</p>
          <div className="sg-waybill__blankline" aria-hidden="true" />
          <div className="sg-waybill__blankline" aria-hidden="true" />
          <p className="sg-waybill__city">
            <span className="sg-waybill__check sg-waybill__check--on" aria-hidden="true" />
            Lagos
            <span className="sg-waybill__check" aria-hidden="true" />
            Abuja
          </p>
        </div>

        <footer className="sg-waybill__foot">
          <div className="sg-waybill__barcode" aria-hidden="true">
            <svg viewBox="0 0 120 28" role="presentation" focusable="false">
              {WAYBILL_BAR_DATA.map((b) => (
                <rect key={b.x} x={b.x} y={0} width={b.w} height={28} />
              ))}
            </svg>
          </div>
          <p className="sg-waybill__notice">Scan to track · Pay cash or transfer on delivery</p>
        </footer>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Style Guide page — gallery of the 5 order-modal pricing variations
   ════════════════════════════════════════════════════════════════════ */

export default function StyleGuidePage() {
  return (
    <main className="sg-page">
      {/* ── Gallery header ─────────────────────────────────────── */}
      <header className="sg-header">
        <div className="sg-header__inner">
          <Link href="/" className="sg-header__back">
            <span aria-hidden="true">←</span> Back to live page
          </Link>
          <p className="sg-header__eyebrow">Order Modal · Pricing Presentation</p>
          <h1 className="sg-header__title">Style Guide</h1>
          <p className="sg-header__sub">
            5 variations — reimagining the three-tier pricing inside the
            OmiWater order modal as distinct everyday objects.
          </p>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 01 — Till Receipt
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-1-label">
        <div className="sg-var__meta">
          <p id="sg-var-1-label" className="sg-var__label">
            Variation 01 — <strong>Till Receipt</strong>
          </p>
          <p className="sg-var__desc">
            A point-of-sale slip — the tiers as line items, a perforation,
            a ₦0.00 &quot;due today&quot; total and a Pay on Delivery stamp.
          </p>
        </div>
        <div className="sg-stage">
          <ModalShell variation="Till Receipt">
            <ReceiptVariation />
          </ModalShell>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 02 — À la Carte
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-2-label">
        <div className="sg-var__meta">
          <p id="sg-var-2-label" className="sg-var__label">
            Variation 02 — <strong>À la Carte</strong>
          </p>
          <p className="sg-var__desc">
            A restaurant menu — dotted leaders to right-aligned prices, with
            the Family Pack boxed as the Chef&rsquo;s Choice.
          </p>
        </div>
        <div className="sg-stage">
          <ModalShell variation="À la Carte">
            <MenuVariation />
          </ModalShell>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 03 — On the Rack
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-3-label">
        <div className="sg-var__meta">
          <p id="sg-var-3-label" className="sg-var__label">
            Variation 03 — <strong>On the Rack</strong>
          </p>
          <p className="sg-var__desc">
            Physical price-tag hangtags on strings — oversized ₦, struck-through
            anchor prices, and a raised Best Value tag.
          </p>
        </div>
        <div className="sg-stage">
          <ModalShell variation="On the Rack">
            <TagsVariation />
          </ModalShell>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 04 — The Membership
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-4-label">
        <div className="sg-var__meta">
          <p id="sg-var-4-label" className="sg-var__label">
            Variation 04 — <strong>The Membership</strong>
          </p>
          <p className="sg-var__desc">
            Wallet loyalty cards — tier numbers, punched benefits, and a notched
            Most Popular tab on the raised Family Pack card.
          </p>
        </div>
        <div className="sg-stage">
          <ModalShell variation="The Membership">
            <WalletVariation />
          </ModalShell>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 05 — Courier Manifest
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-5-label">
        <div className="sg-var__meta">
          <p id="sg-var-5-label" className="sg-var__label">
            Variation 05 — <strong>Courier Manifest</strong>
          </p>
          <p className="sg-var__desc">
            A delivery waybill — tick the pack you want, a deliver-to block,
            a barcode and a Pay on Delivery notice.
          </p>
        </div>
        <div className="sg-stage">
          <ModalShell variation="Courier Manifest">
            <WaybillVariation />
          </ModalShell>
        </div>
      </div>
    </main>
  );
}
