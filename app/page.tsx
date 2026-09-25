"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WaterCanvas from "./WaterCanvas";
import SiteHeader from "./SiteHeader";
import { tiers, titleCase } from "./tiers";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Biohazard,
  Bug,
  Droplets,
  Filter as FilterIcon,
  FlaskConical,
  Layers,
  RefreshCw,
  ShieldCheck,
  ShoppingBasket,
  Waves,
  Wrench,
} from "lucide-react";
import {
  CountUp,
  REVEAL_BOOT_SCRIPT,
  Reveal,
  useRevealBoot,
  useSequentialReveal,
} from "./reveal";

const parts = [
  {
    num: "1",
    short: "Ceramic cartridge",
    tag: "Stage one",
    title: "Ceramic composite cartridge",
    body: "The clear housing holds the first ceramic stage. Its pore structure physically traps rust flakes, sand, silt and suspended particles — the things that make water look cloudy or brown.",
    x: "40%",
    y: "40%",
  },
  {
    num: "2",
    short: "Carbon stage",
    tag: "Stage two",
    title: "Activated carbon media",
    body: "Behind the ceramic, carbon media absorbs excess chlorine, trihalomethanes and organic chemical residues — the bleach taste and smell that signal over-chlorination.",
    x: "33%",
    y: "60%",
  },
  {
    num: "3",
    short: "Filtered outlet",
    tag: "Output",
    title: "Filtered water outlet",
    body: "Filtered water leaves through the lower aerated outlet in a soft, even stream. This is the water for drinking, cooking and washing food.",
    x: "34%",
    y: "75%",
  },
  {
    num: "4",
    short: "Diverter switch",
    tag: "Control",
    title: "Filtered / unfiltered switch",
    body: "Flip the side lever to send water straight through, unfiltered, for dishes and cleaning. That saves cartridge life for the water you actually drink.",
    x: "70%",
    y: "48%",
  },
  {
    num: "5",
    short: "Tap thread",
    tag: "Fitting",
    title: "Universal tap thread",
    body: "The collar threads onto the standard aerator opening on Nigerian kitchen and bathroom taps. Hand-tight, with a rubber seal. No tools, no plumber.",
    x: "57%",
    y: "41%",
  },
  {
    num: "6",
    short: "Bypass outlet",
    tag: "Output",
    title: "Bypass outlet",
    body: "The second outlet delivers full unfiltered flow at normal pressure, so filling pots and buckets is not slowed by the ceramic.",
    x: "55%",
    y: "69%",
  },
];

const exploded = [
  {
    src: "/part-media-stack.jpg",
    alt: "The filter opened up, showing its seven internal media layers",
    label: "Seven media layers: mesh, diatom ceramic, activated carbon",
  },
  {
    src: "/part-ceramic-housing.jpg",
    alt: "Front view of the clear housing over the ceramic cartridge",
    label: "Clear housing over the stage one ceramic cartridge",
  },
  {
    src: "/part-diverter.jpg",
    alt: "Angled view of the filter body showing the diverter lever",
    label: "Diverter lever and the aerated filtered outlet",
  },
];

const features = [
  {
    icon: Layers,
    title: "Dual-stage ceramic",
    body: "Two cartridges in sequence: the first takes out sediment and rust, the second chemical residues and microscopic contaminants.",
  },
  {
    icon: FilterIcon,
    title: "Rust, sediment, metals",
    body: "Ceramic composite media traps iron particles, rust, sand and silt before they reach your glass. Water runs clear from the first use.",
  },
  {
    icon: FlaskConical,
    title: "Chlorine & chemicals",
    body: "Activated carbon absorbs excess chlorine and organic compounds, taking the bleach taste and smell with them.",
  },
  {
    icon: Wrench,
    title: "Fits every Nigerian tap",
    body: "Standard aerator thread, hand-tight. No special tools, no plumber, no pipe work. Protection starts in sixty seconds.",
  },
  {
    icon: ShieldCheck,
    title: "CE certified",
    body: "Meets the European Union CE standard for filtration performance and material safety. Not a market product — a certified one.",
  },
  {
    icon: RefreshCw,
    title: "Replaceable cartridges",
    body: "The housing lasts years. Replace cartridges every three to six months; refills available on order, so protection never lapses.",
  },
];

const stats = [
  {
    figure: "100%",
    source: "University of Ibadan — borehole study",
    body: "Every borehole sample tested across Lagos residential areas contained fecal indicator bacteria. Not some of them. All of them.",
  },
  {
    figure: "87%",
    source: "Journal of Water & Health — sachet study",
    body: "Of sachet water samples — the pure water your children drink daily — tested positive for E. coli, Salmonella, or both.",
  },
  {
    figure: "3×",
    source: "Rainy season research",
    body: "Contamination in Nigerian groundwater runs three times higher through the rains, as surface runoff floods into boreholes and wells.",
  },
  {
    figure: "60M",
    source: "WHO West Africa data",
    body: "Nigerians lack access to safe drinking water. The public system will not fix this in time for your household.",
  },
];

const contaminants = [
  {
    code: "E.COLI",
    icon: Bug,
    title: "Escherichia coli",
    body: "Fecal bacteria, found in every Lagos borehole sample tested. Severe diarrhea and vomiting in adults; in children under five it can cause kidney failure. Antibiotic-resistant strains are now documented here.",
  },
  {
    code: "RUST · PB",
    icon: Droplets,
    title: "Iron rust & heavy metals",
    body: "Pipes laid decades ago are corroding from the inside, carrying iron, lead and manganese into every glass. You see the orange tint. You do not see the lead.",
  },
  {
    code: "CL · CHEM",
    icon: FlaskConical,
    title: "Excess chlorine & chemicals",
    body: "Municipal chlorination is inconsistent and often well above safe levels. Chlorine reacts with organic matter in pipes to form trihalomethanes, linked to liver and kidney damage.",
  },
  {
    code: "SEDIMENT",
    icon: Waves,
    title: "Sediment & particles",
    body: "Sand, silt and organic debris enter through cracked pipes and flooding. Each suspended particle carries bacteria on its surface, deeper into your drinking water.",
  },
  {
    code: "PATHOGEN",
    icon: Biohazard,
    title: "Salmonella & other pathogens",
    body: "Typhoid, cholera, Cryptosporidium and Giardia are consistent findings in Nigerian water research. The stomach illness that keeps returning is usually not the food.",
  },
];

const sources = [
  {
    badge: "Highly contaminated",
    title: "Borehole water",
    body: "Vulnerable to surface contamination, especially in the rains. Most residential boreholes are never tested. Ibadan research: 100% carried fecal indicator organisms.",
  },
  {
    badge: "Contaminated",
    title: "Tap / pipe water",
    body: "Aging, cracked municipal pipes pick up rust, lead and bacteria before the water reaches you. Treatment along the line is inconsistent.",
  },
  {
    badge: "Frequently contaminated",
    title: "Sachet pure water",
    body: "Quality varies enormously between producers, many without adequate sterilisation. 87% of samples in one study tested positive for E. coli or Salmonella.",
  },
  {
    badge: "Often overlooked",
    title: "Cooking water",
    body: "Families filter drinking water and cook with unfiltered. Metals and chemical residues concentrate in the pot — they do not boil away.",
  },
];

const symptoms = [
  {
    title: "Recurring diarrhea",
    body: "Especially in children. The most direct sign of E. coli or Salmonella.",
  },
  {
    title: "Nausea & vomiting",
    body: "Blamed on food poisoning again and again. If it repeats, look at the water.",
  },
  {
    title: "Constant fatigue",
    body: "Low-level contamination keeps the immune system busy and the body tired.",
  },
  {
    title: "Frequent headaches",
    body: "Lead and manganese exposure brings persistent headaches and mental fog.",
  },
  {
    title: "Stomach cramps",
    body: "Abdominal pain after drinking or eating is a classic bacterial sign.",
  },
  {
    title: "Slow development",
    body: "Lead impairs cognitive development in children under six, permanently.",
  },
];

const steps = [
  {
    num: "1",
    title: "Remove your aerator",
    body: "Unscrew the small mesh piece at the tip of your tap by hand. Ten seconds, no tools.",
  },
  {
    num: "2",
    title: "Screw on OmiFilter",
    body: "It threads straight onto the same opening. The rubber seal makes the joint watertight.",
  },
  {
    num: "3",
    title: "Turn on the tap",
    body: "Water runs through both ceramic stages and out clean. Flip the side switch for unfiltered flow when washing up.",
  },
  {
    num: "4",
    title: "Replace every 3–6 months",
    body: "When the flow slows, the ceramic is full. Swap the cartridges; the housing stays put.",
  },
];

// The annual cost of the alternatives, against one filter bought once.
const costs = [
  {
    label: "Sachet water for the household",
    detail: "₦8,000 a month, every month",
    year: "₦96,000",
  },
  {
    label: "Tanker and dispenser refills",
    detail: "₦4,000 a month, every month",
    year: "₦48,000",
  },
  {
    label: "Medical bills from waterborne illness",
    detail: "₦50,000 per person, family of five",
    year: "₦250,000",
  },
];

const heroStats = [
  { figure: "60s", label: "to install, by hand" },
  { figure: "2", label: "ceramic stages" },
  { figure: "3–6", label: "months per cartridge" },
];

/** Shared props for the basket glyph on every order button. */
const basketProps = {
  size: 18,
  strokeWidth: 1.75,
  "aria-hidden": true,
} as const;

export default function Home() {
  const [part, setPart] = useState(0);

  // Order modal: `front` is the tier currently at the front of the fan.
  // Defaults to 1 — the featured Family Pack.
  const [orderOpen, setOrderOpen] = useState(false);
  const [front, setFront] = useState(1);
  const lastFocused = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);

  const activePart = parts[part];

  useRevealBoot();
  const { gridRef: installGridRef, shown: stepsShown } =
    useSequentialReveal(steps.length);

  const openOrder = useCallback(() => {
    lastFocused.current = document.activeElement as HTMLElement | null;
    setOrderOpen(true);
  }, []);

  const closeOrder = useCallback(() => {
    setOrderOpen(false);
    lastFocused.current?.focus();
  }, []);

  const router = useRouter();

  const goCheckout = useCallback(
    (slug: string) => {
      // Don't setOrderOpen(false) here — it would repaint the home page behind
      // the modal before the route transition lands, causing a visible flash.
      // The modal unmounts with the home page when the new route mounts.
      router.push(`/checkout/${slug}`);
    },
    [router],
  );

  // Lock body scroll, close on Escape, and move focus into the dialog.
  useEffect(() => {
    if (!orderOpen) return;

    document.body.classList.add("modal-open");
    closeBtn.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOrder();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [orderOpen, closeOrder]);

  return (
    <>
      {/* Arms the reveal hidden-state during HTML parse, so content is never
          stranded invisible when scripting is off or the bundle fails. */}
      <script
        dangerouslySetInnerHTML={{ __html: REVEAL_BOOT_SCRIPT }}
      />

      <SiteHeader variant="home" onOrder={openOrder} />

      <main>
        <section className="hero" id="hero">
          <div className="shell hero__inner">
          <div>
            <Reveal className="hero__badge">
              <span className="hero__dot" />
              CE Certified · Nationwide delivery
            </Reveal>
            <Reveal as="h1" className="hero__title" index={1}>
              Clean water,
              <br />
              straight from
              <br />
              <em>your own tap.</em>
            </Reveal>
            <Reveal as="p" className="hero__lede" index={2}>
              OmiFilter is a dual-ceramic faucet filter that screws onto a
              standard Nigerian tap in sixty seconds. No plumber. No tank. No
              electricity. It takes out the rust, sediment, chlorine and
              bacteria your family cannot see.
            </Reveal>
            <Reveal className="hero__actions" index={3}>
              <button type="button" className="btn btn--ink" onClick={openOrder}>
                <ShoppingBasket {...basketProps} />
                Order <span>→</span>
              </button>
              <div className="hero__assurance">
                Pay online or on delivery
                <br />
                30-day money-back guarantee
              </div>
            </Reveal>
            <div className="hero__stats">
              {heroStats.map((s, i) => (
                <Reveal key={s.label} index={4 + i}>
                  <div className="hero__stat-figure">
                    <CountUp value={s.figure} />
                  </div>
                  <div className="hero__stat-label">{s.label}</div>
                </Reveal>
              ))}
            </div>
          </div>
          <div className="hero__media">
            <div className="hero__glow" />
            <WaterCanvas
              className="hero__image"
              src="/hero-tap-filter.webp"
              alt="OmiFilter fitted to a kitchen tap with water running"
              width={900}
              height={900}
              priority
            />
            <div className="hero__tag">
              <div className="hero__tag-label">Model</div>
              <div className="hero__tag-value">Dual Ceramic Composite</div>
            </div>
          </div>
          </div>
        </section>

        <section className="section filter" id="filter">
          <div className="shell filter__grid">
            <div>
              <Reveal className="eyebrow">The filter, part by part</Reveal>
              <Reveal as="h2" className="filter__title" index={1}>
                Six parts. One
                <br />
                clear glass of water.
              </Reveal>
              <Reveal as="p" className="filter__lede" index={2}>
                Tap a marker on the filter to see what that part does.
              </Reveal>
              <Reveal className="filter__panel" index={3}>
                <div className="eyebrow">{activePart.tag}</div>
                <h3>{activePart.title}</h3>
                <p>{activePart.body}</p>
              </Reveal>
              <Reveal className="filter__chips" index={4}>
                {parts.map((p, i) => (
                  <button
                    key={p.num}
                    type="button"
                    className="chip"
                    aria-pressed={i === part}
                    onClick={() => setPart(i)}
                  >
                    {p.short}
                  </button>
                ))}
              </Reveal>
            </div>
            <div className="filter__figure">
              <Reveal className="filter__stage">
                <Image
                  src="/aquaplus-filter.webp"
                  alt="OmiFilter dual ceramic faucet filter"
                  width={900}
                  height={900}
                />
                {parts.map((p, i) => (
                  <button
                    key={p.num}
                    type="button"
                    className="hotspot"
                    style={{ left: p.x, top: p.y }}
                    title={p.title}
                    aria-label={p.title}
                    aria-pressed={i === part}
                    onClick={() => setPart(i)}
                  >
                    {p.num}
                  </button>
                ))}
              </Reveal>
              <div className="filter__exploded">
                {exploded.map((e, i) => (
                  <Reveal key={e.src} index={i + 1}>
                    <div className="filter__slot">
                      <Image
                        src={e.src}
                        alt={e.alt}
                        width={800}
                        height={800}
                      />
                    </div>
                    <div className="filter__slot-label">{e.label}</div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell features">
            {features.map((f, i) => (
              <Reveal className="feature" key={f.title} index={i}>
                <div className="feature__num">
                  <f.icon size={22} strokeWidth={1.5} aria-hidden />
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section section--flush-top" id="water">
          <div className="shell">
            <Reveal className="eyebrow">Peer-reviewed Nigerian research</Reveal>
            <Reveal as="h2" className="stats__title" index={1}>
              What scientists found in the water your family drinks.
            </Reveal>
            <div className="stats__grid">
              {stats.map((s, i) => (
                <Reveal className="stat" key={s.figure} index={i}>
                  <div className="stat__figure">
                    <CountUp value={s.figure} />
                  </div>
                  <div className="stat__source">{s.source}</div>
                  <p>{s.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--no-top">
          <div className="shell">
            <div className="contaminants__head">
              <Reveal as="h2">
                Five contaminants,
                <br />
                one glass of water.
              </Reveal>
              <Reveal as="p" index={1}>
                Tap water, borehole water and sachet water all carry the same
                cocktail — bacteria that make your family sick this week, and
                metals that damage them over years.
              </Reveal>
            </div>
            <div className="contaminants__grid">
              {contaminants.map((c, i) => (
                <Reveal className="contaminant" key={c.code} index={i}>
                  <div className="contaminant__meta">
                    <span className="contaminant__code">{c.code}</span>
                    <c.icon
                      className="contaminant__icon"
                      size={18}
                      strokeWidth={1.6}
                      aria-hidden
                    />
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--no-top">
          <div className="shell sources">
            <Reveal as="h2">
              You switched to pure water. You are still not safe.
            </Reveal>
            <div className="sources__grid">
              {sources.map((w, i) => (
                <Reveal className="source" key={w.title} index={i}>
                  <div className="source__badge">{w.badge}</div>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--no-top">
          <div className="shell symptoms">
            <div>
              <Reveal as="h2">Symptoms your family may already have.</Reveal>
              <Reveal as="p" className="symptoms__lede" index={1}>
                Waterborne illness is under-diagnosed here because the signs
                look ordinary, and families blame the food. If these repeat in
                your house, start with the water.
              </Reveal>
              <Reveal as="p" className="symptoms__note" index={2}>
                Children under five are the most exposed. What gives an adult a
                stomach ache can put a small child in hospital.
              </Reveal>
            </div>
            <div className="symptoms__grid">
              {symptoms.map((s, i) => (
                <Reveal className="symptom" key={s.title} index={i}>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section install" id="install">
          <div className="shell">
            <Reveal className="eyebrow">Installation</Reveal>
            <Reveal as="h2" index={1}>
              From box to clean water in sixty seconds.
            </Reveal>
            {/* Steps are driven by scroll position, not the shared observer:
                on desktop all four sit on one row and would otherwise pop in
                together. See useSequentialReveal. */}
            <div className="install__grid" ref={installGridRef}>
              {steps.map((st, i) => (
                <div
                  className="step"
                  key={st.num}
                  data-reveal=""
                  data-revealed={i < stepsShown ? "true" : undefined}
                >
                  <div className="step__num">{st.num}</div>
                  <h3>{st.title}</h3>
                  <p>{st.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section cost" id="cost">
          <div className="shell">
            <Reveal className="eyebrow">
              The financial case — real numbers
            </Reveal>
            <Reveal as="h2" className="cost__title" index={1}>
              You already spend ₦394,000
              <br />a year on water.
            </Reveal>

            <div className="cost__table">
              {costs.map((c, i) => (
                <Reveal className="cost__row" key={c.label} index={i}>
                  <div className="cost__label">
                    {c.label}
                    <span>{c.detail}</span>
                  </div>
                  <div className="cost__value">
                    <CountUp value={c.year} />
                  </div>
                </Reveal>
              ))}

              <Reveal className="cost__row cost__row--sum" index={3}>
                <div className="cost__label">
                  What your household spends now
                  <span>Every year, on water that still makes you ill</span>
                </div>
                <div className="cost__value cost__value--strike">
                  <CountUp value="₦394,000" />
                </div>
              </Reveal>

              <Reveal className="cost__row cost__row--total" index={4}>
                <div className="cost__label">
                  OmiFilter — bought once
                  <span>One filter unit</span>
                </div>
                <div className="cost__value">
                  <CountUp value="₦34,999" />
                </div>
              </Reveal>
            </div>

            <Reveal as="p" className="cost__verdict" index={5}>
              You spend <strong>₦394,000</strong> a year on water that still
              makes your family sick. OmiFilter costs{" "}
              <strong>₦34,999 once</strong> — it pays for itself in under a
              month.
            </Reveal>
          </div>
        </section>

        <section className="section" id="order">
          <div className="shell">
            <div className="order__head">
              <Reveal as="h2">Choose your protection.</Reveal>
              <Reveal as="p" index={1}>
                Nationwide delivery. Pay online or on delivery. Free shipping.
              </Reveal>
            </div>
            <div className="order__grid">
              {tiers.map((t, i) => (
                <Reveal
                  className={`tier${t.feature ? " tier--feature" : ""}`}
                  key={t.name}
                  index={i}
                >
                  <div className="tier__meta">
                    <span>{t.tier}</span>
                    <span>{t.flag}</span>
                  </div>
                  <h3>{t.name}</h3>
                  <div className="tier__price">
                    <s className="tier__price-was">{t.originalPrice}</s> {t.price}
                  </div>
                  <div className="tier__units">{t.units}</div>
                  <div className="tier__note">{t.note}</div>
                  <button
                    type="button"
                    className="tier__cta"
                    onClick={() => goCheckout(t.slug)}
                  >
                    <ShoppingBasket {...basketProps} />
                    Order {t.name} →
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="site-footer" id="final-cta">
        <div className="site-footer__inner">
          <div className="site-footer__cta">
            <Reveal as="h2" className="site-footer__cta-title">
              Your family drank unfiltered water today.
            </Reveal>
            <Reveal as="p" className="site-footer__cta-text" index={1}>
              They do not have to tomorrow. One filter. Sixty seconds to
              install. Clean water from your own tap — forever.
            </Reveal>
            <Reveal as="div" index={2}>
              <button
                type="button"
                className="btn btn--teal"
                onClick={openOrder}
              >
                <ShoppingBasket {...basketProps} />
                Order OmiFilter →
              </button>
            </Reveal>
          </div>

          <div className="site-footer__brand">
            <Reveal as="p" className="site-footer__logo">
              OmiFilter
            </Reveal>
            <Reveal as="p" className="site-footer__desc" index={1}>
              Clean water for Nigerian homes. The OmiFilter faucet filter
              removes E. coli, rust and heavy metals from your tap — installs
              in 60 seconds, no plumber required.
            </Reveal>
          </div>

          <div className="site-footer__bar">
            <p className="site-footer__copy">
              © 2026 OmiFilter Nigeria. All rights reserved.
            </p>
            <nav className="site-footer__meta" aria-label="Site">
              <p className="site-footer__attrib">
                CE Certified · Nationwide delivery
              </p>
              <Link href="/policies">Policies</Link>
            </nav>
          </div>
        </div>

        <p className="site-footer__watermark" aria-hidden="true">
          OmiFilter
        </p>
      </footer>

      {/* ============ ORDER MODAL ============ */}
      {orderOpen && (
        <div
          className="modal is-open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
        >
          <div className="modal__backdrop" onClick={closeOrder} />
          <div className="modal__panel">
            <button
              ref={closeBtn}
              type="button"
              className="modal__close"
              onClick={closeOrder}
              aria-label="Close order dialog"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <line
                  x1="6"
                  y1="6"
                  x2="18"
                  y2="18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="18"
                  y1="6"
                  x2="6"
                  y2="18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="eyebrow">Order OmiFilter today</div>
            <h2 className="modal__title" id="order-modal-title">
              Choose your protection.
              <br />
              Delivered to your door.
            </h2>

            <div className="membership" aria-label="Pricing tiers">
              {tiers.map((t, i) => {
                const pos =
                  i === 0 ? " membership-card--left" : i === 2 ? " membership-card--right" : "";
                const feat = t.feature ? " membership-card--featured" : "";
                const isFront = front === i ? " is-front" : "";
                return (
                  <button
                    key={t.name}
                    type="button"
                    className={`membership-card${pos}${feat}${isFront}`}
                    aria-pressed={front === i}
                    onClick={() => setFront(i)}
                  >
                    {t.feature && (
                      <span className="membership-card__tab" aria-hidden="true">
                        Most popular
                      </span>
                    )}
                    <span className="membership-card__row">
                      <span className="membership-card__tier">{t.tier}</span>
                      <span className="membership-card__no">OMW·0421</span>
                    </span>
                    <span className="membership-card__barcode" aria-hidden="true" />
                    <span className="membership-card__name">{t.name}</span>
                    <span className="membership-card__price">
                      <s className="membership-card__price-was">{t.originalPrice}</s> {t.price}
                    </span>
                    <span className="membership-card__units">{t.units}</span>
                    <span className="membership-card__save">{t.note}</span>
                  </button>
                );
              })}
            </div>

            <div className="modal__cta">
              <button
                type="button"
                className="modal__order"
                onClick={() => goCheckout(tiers[front].slug)}
              >
                <ShoppingBasket {...basketProps} />
                Order {titleCase(tiers[front].name)} Now
              </button>
              <p className="modal__fineprint">
                Pay online or on delivery · Free shipping
              </p>
              <p className="modal__fineprint modal__fineprint--emphasis">
                30-day money-back guarantee
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
