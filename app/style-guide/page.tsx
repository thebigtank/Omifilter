import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./style-guide.css";

export const metadata: Metadata = {
  title: "Style Guide — OmiWater",
  description:
    "Five grayscale contaminant-card variations for the OmiWater 'What Is In Your Water Right Now' section, in wireframe.",
};

/* ── Shared copy (verbatim from the live #contaminants section in app/page.tsx) ── */

const EYEBROW = "What Is In Your Water Right Now";
const TITLE_ONE = "Five Contaminants.";
const TITLE_TWO = "One Glass of Water.";
const LEAD =
  "Nigerian tap water, borehole water, and even commercially produced sachet water carry a cocktail of contaminants that cause immediate illness — and long-term damage your family may not connect to the water they drink every day.";

function ContaminantsHeader() {
  return (
    <>
      <span className="section-eyebrow">{EYEBROW}</span>
      <h2 className="section__title">
        {TITLE_ONE}
        <br />
        {TITLE_TWO}
      </h2>
      <p className="section__lead">{LEAD}</p>
    </>
  );
}

type Contaminant = {
  num: string;
  abbr: string;
  name: string;
  body: ReactNode;
};

/* Descriptions copied exactly from app/page.tsx (lines 416–529). The live file
   writes entities like &apos; directly in JSX — the same entity is used here,
   and the <strong> segments are preserved word-for-word. */

const CONTAMINANTS: Contaminant[] = [
  {
    num: "01",
    abbr: "E.COLI",
    name: "Escherichia coli (E. coli)",
    body: (
      <>
        <strong>The primary threat.</strong> E. coli is fecal bacteria — it
        enters your water supply when human or animal waste contaminates
        boreholes, wells, and poorly sealed water tanks. In healthy adults it
        causes severe diarrhea and vomiting. In children under 5 and the
        elderly, <strong>it can cause kidney failure and death.</strong>{" "}
        Antibiotic-resistant strains are now documented in Nigerian water
        sources — meaning standard treatment no longer works.
      </>
    ),
  },
  {
    num: "02",
    abbr: "RUST",
    name: "Iron Rust & Heavy Metals",
    body: (
      <>
        Nigeria&apos;s aging pipe infrastructure — in Lagos, Abuja, and Port
        Harcourt — is corroding from the inside.{" "}
        <strong>
          Every time water flows through a rusted pipe it carries iron
          particles, lead, and manganese directly into your glass.
        </strong>{" "}
        Long-term heavy metal exposure causes neurological damage in children,
        hypertension, and kidney disease. You see it as orange or brown
        discolouration. You do not see the lead.
      </>
    ),
  },
  {
    num: "03",
    abbr: "CHLR",
    name: "Excess Chlorine & Chemical Residues",
    body: (
      <>
        Municipal water treatment in Nigeria uses chlorine to kill bacteria —
        but the amounts applied are inconsistent and often{" "}
        <strong>far exceed safe consumption levels.</strong> Excess chlorine
        reacts with organic matter in pipes to form trihalomethanes — compounds
        linked to liver damage, kidney problems, and increased cancer risk with
        long-term exposure.
      </>
    ),
  },
  {
    num: "04",
    abbr: "SDMT",
    name: "Sediment & Suspended Particles",
    body: (
      <>
        Sand, silt, clay, and organic debris enter Nigerian water supplies
        through cracked pipes, poorly maintained water towers, and seasonal
        flooding.{" "}
        <strong>
          What you see as cloudy or murky water is a suspension of particles
        </strong>{" "}
        that carry bacteria on their surface — each particle a vehicle
        delivering contamination deeper into your drinking water.
      </>
    ),
  },
  {
    num: "05",
    abbr: "BACT",
    name: "Salmonella & Other Pathogens",
    body: (
      <>
        Beyond E. coli, Nigerian water sources contain Salmonella typhi
        (typhoid fever), Vibrio cholerae (cholera), Cryptosporidium, and
        Giardia.{" "}
        <strong>
          These are not rare exceptions — they are consistent findings in
          peer-reviewed research
        </strong>{" "}
        conducted on Nigerian water sources across every major city. The stomach
        illness your family experiences repeatedly is not food poisoning. It is
        your water.
      </>
    ),
  },
];

/* ── Line-art indicators (pure inline SVG, grayscale) ────────────── */

function WarningGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Style Guide page
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
          <p className="sg-header__eyebrow">
            What Is In Your Water Right Now — Contaminants Section
          </p>
          <h1 className="sg-header__title">Style Guide</h1>
          <p className="sg-header__sub">
            5 variations — contaminant card treatments.
          </p>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 01 — Spec Sheet
          Each contaminant is a full-width ruled row on a data sheet: a
          fixed mono gutter (number + bordered abbreviation) with the name
          and body beside it. The row inverts a shade on hover.
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-1-label">
        <div className="sg-var__meta">
          <p id="sg-var-1-label" className="sg-var__label">
            Variation 01 — <strong>Spec Sheet</strong>
          </p>
          <p className="sg-var__desc">
            Horizontal data-sheet rows — a fixed mono gutter (number over a
            bordered abbreviation) with the name and body ruled out beside it.
          </p>
        </div>

        <section className="section sg-spec" aria-label="Contaminants — spec sheet">
          <div className="container">
            <ContaminantsHeader />

            <ol className="sg-spec__list" role="list" aria-label="Contaminant spec sheet">
              {CONTAMINANTS.map((c) => (
                <li className="sg-spec__row" key={c.num}>
                  <div className="sg-spec__gutter">
                    <span className="sg-spec__num" aria-hidden="true">
                      {c.num}
                    </span>
                    <span className="sg-spec__abbr">{c.abbr}</span>
                  </div>
                  <div className="sg-spec__body">
                    <h3 className="sg-spec__name">{c.name}</h3>
                    <p>{c.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 02 — Watermark Tiles
          A two-column card grid. Each bordered tile carries its
          abbreviation as a giant ghost watermark, a dark number badge,
          and the name + body in the foreground.
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-2-label">
        <div className="sg-var__meta">
          <p id="sg-var-2-label" className="sg-var__label">
            Variation 02 — <strong>Watermark Tiles</strong>
          </p>
          <p className="sg-var__desc">
            A two-column card grid — each contaminant is a bordered tile with
            its abbreviation as a giant ghost watermark.
          </p>
        </div>

        <section className="section sg-tile" aria-label="Contaminants — watermark tiles">
          <div className="container">
            <ContaminantsHeader />

            <ol className="sg-tile__grid" role="list" aria-label="Contaminant tiles">
              {CONTAMINANTS.map((c) => (
                <li className="sg-tile__card" key={c.num}>
                  <span className="sg-tile__wm" aria-hidden="true">
                    {c.abbr}
                  </span>
                  <span className="sg-tile__num" aria-hidden="true">
                    {c.num}
                  </span>
                  <h3 className="sg-tile__name">{c.name}</h3>
                  <p className="sg-tile__desc">{c.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 03 — Dossier Timeline
          A vertical case-file timeline: large mono index numbers sit on
          a left rail joined by a hairline; each body is indented to the
          right with a mono abbreviation tag above the name.
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-3-label">
        <div className="sg-var__meta">
          <p id="sg-var-3-label" className="sg-var__label">
            Variation 03 — <strong>Dossier Timeline</strong>
          </p>
          <p className="sg-var__desc">
            A vertical case-file timeline — large mono index numbers on a left
            rail, bodies indented on a hairline.
          </p>
        </div>

        <section className="section sg-doss" aria-label="Contaminants — dossier timeline">
          <div className="container">
            <ContaminantsHeader />

            <ol className="sg-doss__list" role="list" aria-label="Contaminant timeline">
              {CONTAMINANTS.map((c) => (
                <li className="sg-doss__item" key={c.num}>
                  <span className="sg-doss__num" aria-hidden="true">
                    {c.num}
                  </span>
                  <div className="sg-doss__body">
                    <div className="sg-doss__head">
                      <span className="sg-doss__abbr">{c.abbr}</span>
                      <h3 className="sg-doss__name">{c.name}</h3>
                    </div>
                    <p>{c.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 04 — Lab Report
          A ruled laboratory table with mono column headers (No. /
          Contaminant / What it does). One row inverts to dark to draw
          the eye; the table stacks on mobile.
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-4-label">
        <div className="sg-var__meta">
          <p id="sg-var-4-label" className="sg-var__label">
            Variation 04 — <strong>Lab Report</strong>
          </p>
          <p className="sg-var__desc">
            A ruled laboratory table — No. / Contaminant / What it does
            columns with one inverted highlight row.
          </p>
        </div>

        <section className="section sg-lab" aria-label="Contaminants — lab report">
          <div className="container">
            <ContaminantsHeader />

            <div
              className="sg-lab__table"
              role="table"
              aria-label="Laboratory analysis of five contaminants"
            >
              <div className="sg-lab__thead" role="row">
                <span role="columnheader">No.</span>
                <span role="columnheader">Contaminant</span>
                <span role="columnheader">What it does</span>
              </div>
              {CONTAMINANTS.map((c, i) => (
                <div
                  className={i === 2 ? "sg-lab__row is-highlighted" : "sg-lab__row"}
                  role="row"
                  key={c.num}
                >
                  <span className="sg-lab__num" role="cell">
                    {c.num}
                    <small className="sg-lab__abbr">{c.abbr}</small>
                  </span>
                  <h3 className="sg-lab__name" role="cell">
                    {c.name}
                  </h3>
                  <p className="sg-lab__desc" role="cell">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════════════════════
          VARIATION 05 — Hazard Placards
          A full-bleed dark band where each contaminant is a warning
          placard: a square warning-glyph chip, a mono index, and the
          abbreviation in a bordered mono badge beside the name.
          ══════════════════════════════════════════════════════════ */}
      <div className="sg-variation" role="region" aria-labelledby="sg-var-5-label">
        <div className="sg-var__meta">
          <p id="sg-var-5-label" className="sg-var__label">
            Variation 05 — <strong>Hazard Placards</strong>
          </p>
          <p className="sg-var__desc">
            A dark warning register — each contaminant is a placard with a
            warning glyph and a mono abbreviation badge.
          </p>
        </div>

        <section className="section sg-haz" aria-label="Contaminants — hazard placards">
          <div className="container">
            <ContaminantsHeader />

            <ol className="sg-haz__list" role="list" aria-label="Contaminant hazard placards">
              {CONTAMINANTS.map((c) => (
                <li className="sg-haz__placard" key={c.num}>
                  <span className="sg-haz__icon" aria-hidden="true">
                    <WarningGlyph />
                  </span>
                  <span className="sg-haz__num" aria-hidden="true">
                    {c.num}
                  </span>
                  <div className="sg-haz__body">
                    <div className="sg-haz__head">
                      <h3 className="sg-haz__name">{c.name}</h3>
                      <span className="sg-haz__badge">{c.abbr}</span>
                    </div>
                    <p>{c.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
