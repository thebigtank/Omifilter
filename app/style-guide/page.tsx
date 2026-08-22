import type { Metadata } from "next";
import Link from "next/link";
import "./style-guide.css";

export const metadata: Metadata = {
  title: "Style Guide — OmiWater",
  description:
    "Alternating-width card grid for the OmiWater water-sources section, in grayscale wireframe.",
};

const EYEBROW = "No Water Source Is Safe — Without Filtration";
const TITLE_TOP = "You Switched To Pure Water.";
const TITLE_BOTTOM = "You Are Still Not Safe.";
const LEAD =
  "Most Nigerian families believe they solved the water problem when they switched from tap water to sachet or bottled water. The research says otherwise. Every commonly trusted water source in Nigeria carries documented contamination risk.";

function SectionHeader() {
  return (
    <>
      <span className="section-eyebrow">{EYEBROW}</span>
      <h2 className="section__title">
        {TITLE_TOP}
        <br />
        {TITLE_BOTTOM}
      </h2>
      <p className="section__lead">{LEAD}</p>
    </>
  );
}

export default function StyleGuidePage() {
  return (
    <main className="sg-page">
      {/* ── Gallery header ─────────────────────────────────────── */}
      <header className="sg-header">
        <div className="sg-header__inner">
          <Link href="/" className="sg-header__back">
            <span aria-hidden="true">←</span> Back to live page
          </Link>
          <p className="sg-header__eyebrow">{EYEBROW}</p>
          <h1 className="sg-header__title">Style Guide</h1>
          <p className="sg-header__sub">1 variation — alternating-width cards.</p>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 01 — Alternating Widths
          ══════════════════════════════════════════════════════════ */}
      <div
        className="sg-variation"
        role="region"
        aria-labelledby="sg-var-1-label"
      >
        <div className="sg-var__meta">
          <p id="sg-var-1-label" className="sg-var__label">
            Variation 01 — <strong>Alternating Widths</strong>
          </p>
          <p className="sg-var__desc">
            Four text cards in alternating widths — a wide card and a small
            card on the top row, a small card and a wide card below.
          </p>
        </div>

        <section className="section sg-grid-bg">
          <div className="container">
            <SectionHeader />

            <ol
              className="sg-grid"
              role="list"
              aria-label="Water sources in an alternating-width grid"
            >
              <li className="sg-card sg-card--wide">
                <span className="sg-card__tag">Highly Contaminated</span>
                <h3 className="sg-card__name">Borehole Water</h3>
                <p className="sg-card__desc">
                  Boreholes are vulnerable to surface contamination —
                  particularly during rainy season when runoff floods the
                  surrounding soil. Most residential boreholes are not tested
                  regularly.
                </p>
                <p className="sg-card__finding">
                  University of Ibadan research: 100% of borehole samples
                  contained fecal indicator organisms.
                </p>
              </li>

              <li className="sg-card">
                <span className="sg-card__tag">Contaminated</span>
                <h3 className="sg-card__name">Tap / Pipe Water</h3>
                <p className="sg-card__desc">
                  Municipal pipe infrastructure across Lagos, Abuja and Port
                  Harcourt is aging and cracked. Water picks up rust, lead, and
                  bacteria before reaching your tap. Treatment is inconsistent.
                </p>
                <p className="sg-card__finding">
                  E. coli detected in 100% of municipal water samples tested in
                  Lagos residential areas.
                </p>
              </li>

              <li className="sg-card">
                <span className="sg-card__tag">Frequently Contaminated</span>
                <h3 className="sg-card__name">Sachet &quot;Pure Water&quot;</h3>
                <p className="sg-card__desc">
                  Sachet water production in Nigeria varies enormously in
                  quality. Many small-scale producers operate without adequate
                  sterilisation equipment. Even reputable brands show
                  inconsistent results.
                </p>
                <p className="sg-card__finding">
                  87% of sachet water samples tested positive for E. coli or
                  Salmonella in peer-reviewed study.
                </p>
              </li>

              <li className="sg-card sg-card--wide">
                <span className="sg-card__tag">Often Overlooked</span>
                <h3 className="sg-card__name">Cooking Water</h3>
                <p className="sg-card__desc">
                  Most Nigerian families filter their drinking water but cook
                  with unfiltered tap or borehole water. Boiling kills bacteria
                  but does not remove heavy metals, rust, or chemical residues.
                </p>
                <p className="sg-card__finding">
                  Heavy metals and chemical contaminants concentrate in food
                  cooked with contaminated water — they do not boil away.
                </p>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
