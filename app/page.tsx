"use client";

import { useEffect } from "react";
import {
  ArrowRight,
  ArrowDown,
  ShoppingBag,
  CloudRain,
  Waves,
  Droplet,
  Droplets,
} from "lucide-react";

export default function Home() {
  useEffect(() => {
    const cleanupFns: Array<() => void> = [];

    // ─── Scroll-Triggered Animations ───────────────────────────
    const animateEls = document.querySelectorAll<HTMLElement>("[data-animate]");
    let observer: IntersectionObserver | null = null;

    if (animateEls.length) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        animateEls.forEach((el) => el.classList.add("is-visible"));
      } else {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer?.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );
        animateEls.forEach((el) => observer!.observe(el));
      }
    }

    // ─── Sticky Nav Scroll State ───────────────────────────────
    const header = document.querySelector<HTMLElement>(".site-header");
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header?.classList.toggle("is-scrolled", window.scrollY > 8);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanupFns.push(() => window.removeEventListener("scroll", onScroll));

    // ─── Mobile Menu ───────────────────────────────────────────
    const toggle = document.querySelector<HTMLElement>("[data-menu-toggle]");
    const menu = document.querySelector<HTMLElement>("[data-menu]");
    const backdrop = document.querySelector<HTMLElement>(".mobile-menu-backdrop");

    const openMenu = () => {
      if (!menu) return;
      menu.classList.add("is-open");
      toggle?.setAttribute("aria-expanded", "true");
      backdrop?.classList.add("is-visible");
      document.body.style.overflow = "hidden";

      const firstLink = menu.querySelector<HTMLElement>("a, button");
      firstLink?.focus();
    };

    const closeMenu = () => {
      if (!menu) return;
      menu.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
      backdrop?.classList.remove("is-visible");
      document.body.style.overflow = "";
      toggle?.focus();
    };

    const onToggleClick = () => {
      if (menu?.classList.contains("is-open")) closeMenu();
      else openMenu();
    };
    toggle?.addEventListener("click", onToggleClick);
    backdrop?.addEventListener("click", closeMenu);
    cleanupFns.push(() => {
      toggle?.removeEventListener("click", onToggleClick);
      backdrop?.removeEventListener("click", closeMenu);
    });

    // ─── Accordion (FAQ) ───────────────────────────────────────
    const triggers = document.querySelectorAll<HTMLElement>(
      "[data-accordion-trigger]"
    );

    const onAccordionClick = (e: Event) => {
      const trigger = e.currentTarget as HTMLElement;
      const targetId = trigger.getAttribute("aria-controls");
      if (!targetId) return;
      const content = document.getElementById(targetId);
      if (!content) return;

      const isOpen = content.classList.contains("is-open");
      const group = trigger.closest<HTMLElement>("[data-accordion-group]");
      if (group) {
        group
          .querySelectorAll("[data-accordion-content]")
          .forEach((c) => c.classList.remove("is-open"));
        group
          .querySelectorAll("[data-accordion-trigger]")
          .forEach((t) => t.setAttribute("aria-expanded", "false"));
      }

      if (!isOpen) {
        content.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      } else {
        content.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }
    };
    triggers.forEach((t) => t.addEventListener("click", onAccordionClick));
    cleanupFns.push(() =>
      triggers.forEach((t) => t.removeEventListener("click", onAccordionClick))
    );

    // ─── Order Modal ───────────────────────────────────────────
    const modal = document.querySelector<HTMLElement>("[data-modal]");
    const openTriggers = document.querySelectorAll<HTMLElement>(
      "[data-modal-open]"
    );
    const closeTriggers = modal
      ? Array.from(modal.querySelectorAll<HTMLElement>("[data-modal-close]"))
      : [];
    const panel = modal?.querySelector<HTMLElement>(".modal__panel");
    let lastFocused: HTMLElement | null = null;

    const openModal = () => {
      if (!modal) return;

      // Close the mobile menu if it's open
      if (menu?.classList.contains("is-open")) closeMenu();

      lastFocused = document.activeElement as HTMLElement | null;
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add("is-open"));
      document.body.classList.add("modal-open");

      const first = modal.querySelector<HTMLElement>(
        ".modal__close, a[href], button"
      );
      first?.focus();
    };

    const closeModal = () => {
      if (!modal || !modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");
      document.body.classList.remove("modal-open");

      const finalize = () => {
        if (!modal.classList.contains("is-open")) modal.hidden = true;
      };
      if (panel) panel.addEventListener("transitionend", finalize, { once: true });
      window.setTimeout(finalize, 500);

      lastFocused?.focus();
    };

    openTriggers.forEach((t) => t.addEventListener("click", openModal));
    closeTriggers.forEach((t) => t.addEventListener("click", closeModal));
    cleanupFns.push(() => {
      openTriggers.forEach((t) => t.removeEventListener("click", openModal));
      closeTriggers.forEach((t) => t.removeEventListener("click", closeModal));
    });

    // ─── Membership Cards: Bring-To-Front ──────────────────────
    // The three pricing cards are fanned. Clicking (or Enter/Space on) any
    // card brings it to the front of the fan by toggling `.is-front`.
    // Cards are native <button>s, so Enter/Space dispatch a click event
    // natively — no separate keydown handler is needed.
    const membershipCards = document.querySelectorAll<HTMLElement>(
      ".membership-card"
    );
    const onMembershipClick = (e: Event) => {
      const card = e.currentTarget as HTMLElement;
      if (!card.classList.contains("membership-card")) return;
      if (card.classList.contains("is-front")) return;
      membershipCards.forEach((c) => c.classList.remove("is-front"));
      card.classList.add("is-front");
    };
    membershipCards.forEach((c) =>
      c.addEventListener("click", onMembershipClick)
    );
    cleanupFns.push(() =>
      membershipCards.forEach((c) =>
        c.removeEventListener("click", onMembershipClick)
      )
    );

    // ─── Contaminant Deck: Scroll-Stacked Cards ────────────────
    // Five full-width cards pinned inside a tall track. As the user scrolls
    // through the track, each card translates up from below the stage to its
    // resting offset (i * --deck-peek), covering the card before it while
    // leaving a peek strip at the top. The accent-fill hero card (01) stays
    // at the base. Active at every viewport width — the deck pins and stacks
    // on mobile just like desktop (mobile card/peek sizing is tuned in
    // landing.css). Only prefers-reduced-motion collapses the deck to a
    // normal stacked list (via .is-static + CSS) so there is no
    // reserved-track dead scroll.
    const deckEl = document.querySelector<HTMLElement>("[data-deck]");
    const deckTrack = document.querySelector<HTMLElement>("[data-deck-track]");
    const deckStage = document.querySelector<HTMLElement>("[data-deck-stage]");
    const deckCards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-deck-card]")
    );
    const reducedMotionMq = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let deckActive = false;
    let deckTrackTop = 0;
    let deckStageH = 0;
    let deckTrackH = 0;
    let deckPeek = 0;
    let deckStickyTop = 0;
    const DECK_STEPS = Math.max(deckCards.length - 1, 1);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    function updateDeck() {
      if (!deckActive || !deckTrack || !deckStage) return;
      const scrollY = window.scrollY;
      const start = deckTrackTop - deckStickyTop;
      const end = start + (deckTrackH - deckStageH);
      const span = end - start || 1;
      const progress = Math.min(Math.max((scrollY - start) / span, 0), 1);

      deckCards.forEach((card, i) => {
        // Card 0 (accent-fill hero) anchors the base of the deck.
        if (i === 0) {
          card.style.transform = "translateY(0px)";
          return;
        }
        // Card i translates during the scroll slice [(i-1)/N, i/N].
        const t0 = (i - 1) / DECK_STEPS;
        const t1 = i / DECK_STEPS;
        const local = Math.min(Math.max((progress - t0) / (t1 - t0), 0), 1);
        const eased = easeOutCubic(local);
        const startTranslate = deckStageH - i * deckPeek;
        card.style.transform = `translateY(${
          (startTranslate * (1 - eased)).toFixed(1)
        }px)`;
      });
    }

    function measureDeck() {
      if (!deckEl || !deckTrack || !deckStage || deckCards.length === 0) return;
      deckActive = !reducedMotionMq.matches;

      if (!deckActive) {
        // Static mode (reduced motion) — clear inline transforms so the CSS
        // media query renders the deck as a normal stacked list (also forces
        // any stale transforms off).
        deckCards.forEach((c) => (c.style.transform = ""));
        deckEl.classList.add("is-static");
        return;
      }
      deckEl.classList.remove("is-static");

      const trackRect = deckTrack.getBoundingClientRect();
      const stageRect = deckStage.getBoundingClientRect();
      deckTrackTop = trackRect.top + window.scrollY;
      deckStageH = stageRect.height;
      deckTrackH = trackRect.height;
      deckStickyTop = parseFloat(getComputedStyle(deckStage).top) || 0;
      deckPeek =
        deckCards.length > 1
          ? parseFloat(getComputedStyle(deckCards[1]).top) || 0
          : 0;

      updateDeck();
    }

    let deckTicking = false;
    const onDeckScroll = () => {
      if (!deckActive) return;
      if (!deckTicking) {
        requestAnimationFrame(() => {
          updateDeck();
          deckTicking = false;
        });
        deckTicking = true;
      }
    };

    const onDeckResize = () => measureDeck();

    window.addEventListener("scroll", onDeckScroll, { passive: true });
    window.addEventListener("resize", onDeckResize);
    measureDeck();
    cleanupFns.push(() => {
      window.removeEventListener("scroll", onDeckScroll);
      window.removeEventListener("resize", onDeckResize);
    });

    // ─── Keyboard (Escape) ─────────────────────────────────────
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu?.classList.contains("is-open")) closeMenu();
      if (modal?.classList.contains("is-open")) closeModal();
    };
    document.addEventListener("keydown", onKeydown);
    cleanupFns.push(() => document.removeEventListener("keydown", onKeydown));

    return () => {
      observer?.disconnect();
      cleanupFns.forEach((fn) => fn());
    };
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* ============ 1. HEADER / STICKY NAV ============ */}
      <header className="site-header">
        <div className="container nav">
          <a href="#hero" className="brand">
            Omi<em>Filter</em>
          </a>

          <nav className="nav__links" aria-label="Main navigation">
            <a href="#findings" className="nav__link">
              The Evidence
            </a>
            <a href="#contaminants" className="nav__link">
              Contaminants
            </a>
            <a href="#product" className="nav__link">
              The Filter
            </a>
            <a href="#cost" className="nav__link">
              Cost
            </a>
            <button type="button" className="nav__link" data-modal-open>
              Order
            </button>
          </nav>

          <div className="nav__actions">
            <button type="button" className="btn btn--primary nav__cta" data-modal-open>
              Order Now
              <ShoppingBag size={16} aria-hidden="true" />
            </button>
            <button
              className="icon-btn nav__toggle"
              data-menu-toggle
              aria-expanded="false"
              aria-controls="mobile-menu"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div className="mobile-menu" id="mobile-menu" data-menu>
        <nav aria-label="Mobile navigation">
          <a href="#findings" className="mobile-menu__link">
            The Evidence
          </a>
          <a href="#contaminants" className="mobile-menu__link">
            Contaminants
          </a>
          <a href="#product" className="mobile-menu__link">
            The Filter
          </a>
          <a href="#cost" className="mobile-menu__link">
            Cost
          </a>
          <button type="button" className="mobile-menu__link" data-modal-open>
            Order
          </button>
        </nav>
      </div>
      <div className="mobile-menu-backdrop"></div>

      <main id="main-content">
        {/* ============ 2. HERO ============ */}
        <section className="hero" id="hero" aria-label="Introduction">
          <div
            className="hero__media"
            role="img"
            aria-label="Photo of a water faucet with running water"
          />

          <div className="hero__overlay">
            <span className="hero__eyebrow">OmiFilter Nigeria — Tap Water Protection System</span>
            <h1 className="hero__title">
              The Water Killing
              <br />
              Nigerian Families
              <br />
              <span className="hero__ghost">Is Invisible.</span>
            </h1>
            <p className="hero__sub">
              You cannot see E. coli. You cannot taste it. You cannot smell it.
              But University of Ibadan researchers found it in{" "}
              <strong>every borehole sample tested</strong> across Lagos. Your
              family drank water today. Was it safe?
            </p>
            <div className="hero__cta">
              <button type="button" className="btn btn--solid" data-modal-open>
                Protect My Family
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <a href="#findings" className="btn btn--outline">
                Show the evidence
                <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* ============ 3. FINDINGS / SCIENCE ============ */}
        <section className="section findings" id="findings" aria-label="The science">
          <div className="container">
            <span className="section-eyebrow">The Science — Peer-Reviewed Research</span>
            <h2 className="section__title">
              What Nigerian Scientists
              <br />
              Found In Your Water.
            </h2>

            <ol
              className="findings-timeline"
              role="list"
              aria-label="Research findings escalating in scope"
            >
              <li className="finding-node" data-animate data-animate-delay="0">
                <div className="finding-node__card">
                  <div className="finding-node__head">
                    <span className="finding-node__dot" aria-hidden="true">
                      01
                    </span>
                    <div
                      className="finding-node__level"
                      role="img"
                      aria-label="Severity level 1 of 4"
                    >
                      <span className="is-on" />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <p className="finding-node__stat">100%</p>
                  <p className="finding-node__source">University of Ibadan — Borehole Study</p>
                  <p className="finding-node__desc">
                    Every single borehole water sample tested across Lagos
                    residential areas contained fecal indicator bacteria. Not
                    some. <strong>Every one.</strong>
                  </p>
                </div>
              </li>

              <li className="finding-node" data-animate data-animate-delay="1">
                <div className="finding-node__card">
                  <div className="finding-node__head">
                    <span className="finding-node__dot" aria-hidden="true">
                      02
                    </span>
                    <div
                      className="finding-node__level"
                      role="img"
                      aria-label="Severity level 2 of 4"
                    >
                      <span className="is-on" />
                      <span className="is-on" />
                      <span />
                      <span />
                    </div>
                  </div>
                  <p className="finding-node__stat">87%</p>
                  <p className="finding-node__source">Journal of Water & Health — Sachet Study</p>
                  <p className="finding-node__desc">
                    Of sachet water samples — the &quot;pure water&quot; your
                    children drink every day — tested positive for E. coli,
                    Salmonella, or both.
                  </p>
                </div>
              </li>

              <li className="finding-node" data-animate data-animate-delay="2">
                <div className="finding-node__card">
                  <div className="finding-node__head">
                    <span className="finding-node__dot" aria-hidden="true">
                      03
                    </span>
                    <div
                      className="finding-node__level"
                      role="img"
                      aria-label="Severity level 3 of 4"
                    >
                      <span className="is-on" />
                      <span className="is-on" />
                      <span className="is-on" />
                      <span />
                    </div>
                  </div>
                  <p className="finding-node__stat">3×</p>
                  <p className="finding-node__source">Rainy Season Research</p>
                  <p className="finding-node__desc">
                    Contamination levels in Nigerian groundwater spike three times
                    higher during rainy season as surface runoff floods into
                    boreholes and wells.
                  </p>
                </div>
              </li>

              <li className="finding-node" data-animate data-animate-delay="3">
                <div className="finding-node__card">
                  <div className="finding-node__head">
                    <span className="finding-node__dot" aria-hidden="true">
                      04
                    </span>
                    <div
                      className="finding-node__level"
                      role="img"
                      aria-label="Severity level 4 of 4"
                    >
                      <span className="is-on" />
                      <span className="is-on" />
                      <span className="is-on" />
                      <span className="is-on" />
                    </div>
                  </div>
                  <p className="finding-node__stat">60M</p>
                  <p className="finding-node__source">WHO West Africa Data</p>
                  <p className="finding-node__desc">
                    Nigerians currently lack access to safe drinking water. The
                    government system alone cannot solve this.{" "}
                    <strong>You must protect your own home.</strong>
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* ============ 4. CONTAMINANTS ============ */}
        <section className="section contaminants" id="contaminants" aria-label="Contaminants">
          <div className="container">
            <span className="section-eyebrow">What Is In Your Water Right Now</span>
            <h2 className="section__title">
              Five Contaminants.
              <br />
              One Glass of Water.
            </h2>
            <p className="section__lead">
              Nigerian tap water, borehole water, and even commercially produced
              sachet water carry a cocktail of contaminants that cause immediate
              illness — and long-term damage your family may not connect to the
              water they drink every day.
            </p>

            <div className="contaminant-deck" data-deck>
              <div className="contaminant-deck__track" data-deck-track>
                <div className="contaminant-deck__stage" data-deck-stage>
                  <ol
                    className="contaminant-deck__cards"
                    role="list"
                    aria-label="Five contaminants stacked as a deck"
                  >
                    <li
                      className="contaminant-deck__card contaminant-deck__card--tone-1"
                      data-deck-card
                    >
                      <div className="contaminant-deck__head">
                        <span className="contaminant-deck__num" aria-hidden="true">01</span>
                        <span className="contaminant-deck__index">1 of 5</span>
                      </div>
                      <h3 className="contaminant-deck__title">
                        <span>E.</span>
                        <span className="contaminant-deck__ghost">COLI</span>
                      </h3>
                      <p className="contaminant-deck__name">
                        Escherichia coli (E. coli)
                      </p>
                      <p className="contaminant-deck__short">
                        Fecal bacteria found in every borehole sample tested
                        across Lagos.
                      </p>
                      <p className="contaminant-deck__desc">
                        <strong>The primary threat.</strong> E. coli is
                        fecal bacteria — it enters your water supply when
                        human or animal waste contaminates boreholes,
                        wells, and poorly sealed water tanks. In healthy
                        adults it causes severe diarrhea and vomiting. In
                        children under 5 and the elderly,{" "}
                        <strong>
                          it can cause kidney failure and death.
                        </strong>{" "}
                        Antibiotic-resistant strains are now documented in
                        Nigerian water sources — meaning standard treatment
                        no longer works.
                      </p>
                      <div className="contaminant-deck__meta">
                        <ul
                          className="contaminant-deck__tags"
                          role="list"
                          aria-label="Contaminant categories"
                        >
                          <li className="contaminant-deck__tag">Bacteria</li>
                          <li className="contaminant-deck__tag">Fecal</li>
                        </ul>
                      </div>
                    </li>

                    <li
                      className="contaminant-deck__card contaminant-deck__card--tone-2"
                      data-deck-card
                    >
                      <div className="contaminant-deck__head">
                        <span className="contaminant-deck__num" aria-hidden="true">02</span>
                        <span className="contaminant-deck__index">2 of 5</span>
                      </div>
                      <h3 className="contaminant-deck__title">
                        <span>RUST</span>
                        <span className="contaminant-deck__ghost">LEAD</span>
                      </h3>
                      <p className="contaminant-deck__name">
                        Iron Rust &amp; Heavy Metals
                      </p>
                      <p className="contaminant-deck__short">
                        Corroding pipes carry iron, lead, and manganese into
                        every glass.
                      </p>
                      <p className="contaminant-deck__desc">
                        Nigeria&apos;s aging pipe infrastructure — in Lagos,
                        Abuja, and Port Harcourt — is corroding from the
                        inside.{" "}
                        <strong>
                          Every time water flows through a rusted pipe it
                          carries iron particles, lead, and manganese
                          directly into your glass.
                        </strong>{" "}
                        Long-term heavy metal exposure causes neurological
                        damage in children, hypertension, and kidney
                        disease. You see it as orange or brown
                        discolouration. You do not see the lead.
                      </p>
                      <div className="contaminant-deck__meta">
                        <ul
                          className="contaminant-deck__tags"
                          role="list"
                          aria-label="Contaminant categories"
                        >
                          <li className="contaminant-deck__tag">Heavy Metals</li>
                          <li className="contaminant-deck__tag">Corrosion</li>
                        </ul>
                      </div>
                    </li>

                    <li
                      className="contaminant-deck__card contaminant-deck__card--tone-3"
                      data-deck-card
                    >
                      <div className="contaminant-deck__head">
                        <span className="contaminant-deck__num" aria-hidden="true">03</span>
                        <span className="contaminant-deck__index">3 of 5</span>
                      </div>
                      <h3 className="contaminant-deck__title">
                        <span>CHLR</span>
                        <span className="contaminant-deck__ghost">CHEM</span>
                      </h3>
                      <p className="contaminant-deck__name">
                        Excess Chlorine &amp; Chemical Residues
                      </p>
                      <p className="contaminant-deck__short">
                        Inconsistent chlorination forms compounds linked to
                        long-term illness.
                      </p>
                      <p className="contaminant-deck__desc">
                        Municipal water treatment in Nigeria uses chlorine
                        to kill bacteria — but the amounts applied are
                        inconsistent and often{" "}
                        <strong>far exceed safe consumption levels.</strong>{" "}
                        Excess chlorine reacts with organic matter in pipes
                        to form trihalomethanes — compounds linked to liver
                        damage, kidney problems, and increased cancer risk
                        with long-term exposure.
                      </p>
                      <div className="contaminant-deck__meta">
                        <ul
                          className="contaminant-deck__tags"
                          role="list"
                          aria-label="Contaminant categories"
                        >
                          <li className="contaminant-deck__tag">Chemical</li>
                          <li className="contaminant-deck__tag">Chlorination</li>
                        </ul>
                      </div>
                    </li>

                    <li
                      className="contaminant-deck__card contaminant-deck__card--tone-4"
                      data-deck-card
                    >
                      <div className="contaminant-deck__head">
                        <span className="contaminant-deck__num" aria-hidden="true">04</span>
                        <span className="contaminant-deck__index">4 of 5</span>
                      </div>
                      <h3 className="contaminant-deck__title">
                        <span>SDMT</span>
                        <span className="contaminant-deck__ghost">SILT</span>
                      </h3>
                      <p className="contaminant-deck__name">
                        Sediment &amp; Suspended Particles
                      </p>
                      <p className="contaminant-deck__short">
                        Cloudy water is a suspension of particles that carry
                        bacteria.
                      </p>
                      <p className="contaminant-deck__desc">
                        Sand, silt, clay, and organic debris enter Nigerian
                        water supplies through cracked pipes, poorly
                        maintained water towers, and seasonal flooding.{" "}
                        <strong>
                          What you see as cloudy or murky water is a
                          suspension of particles
                        </strong>{" "}
                        that carry bacteria on their surface — each
                        particle a vehicle delivering contamination deeper
                        into your drinking water.
                      </p>
                      <div className="contaminant-deck__meta">
                        <ul
                          className="contaminant-deck__tags"
                          role="list"
                          aria-label="Contaminant categories"
                        >
                          <li className="contaminant-deck__tag">Sediment</li>
                          <li className="contaminant-deck__tag">Particulates</li>
                        </ul>
                      </div>
                    </li>

                    <li
                      className="contaminant-deck__card contaminant-deck__card--tone-5"
                      data-deck-card
                    >
                      <div className="contaminant-deck__head">
                        <span className="contaminant-deck__num" aria-hidden="true">05</span>
                        <span className="contaminant-deck__index">5 of 5</span>
                      </div>
                      <h3 className="contaminant-deck__title">
                        <span>BACT</span>
                        <span className="contaminant-deck__ghost">PATH</span>
                      </h3>
                      <p className="contaminant-deck__name">
                        Salmonella &amp; Other Pathogens
                      </p>
                      <p className="contaminant-deck__short">
                        Typhoid, cholera, and more — documented in water across
                        every major city.
                      </p>
                      <p className="contaminant-deck__desc">
                        Beyond E. coli, Nigerian water sources contain
                        Salmonella typhi (typhoid fever), Vibrio cholerae
                        (cholera), Cryptosporidium, and Giardia.{" "}
                        <strong>
                          These are not rare exceptions — they are
                          consistent findings in peer-reviewed research
                        </strong>{" "}
                        conducted on Nigerian water sources across every
                        major city. The stomach illness your family
                        experiences repeatedly is not food poisoning. It is
                        your water.
                      </p>
                      <div className="contaminant-deck__meta">
                        <ul
                          className="contaminant-deck__tags"
                          role="list"
                          aria-label="Contaminant categories"
                        >
                          <li className="contaminant-deck__tag">Pathogens</li>
                          <li className="contaminant-deck__tag">Microbial</li>
                        </ul>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 5. PATHWAY ============ */}
        <section className="section pathway" id="pathway" aria-label="How contamination reaches you">
          <div className="container">
            <div className="pathway__layout">
              <ol
                className="pathway__stack"
                role="list"
                aria-label="How contamination starts and travels underground"
              >
                <li className="pathway-card" data-animate data-animate-delay="0">
                  <span className="pathway-card__icon" aria-hidden="true">
                    <CloudRain size={22} aria-hidden="true" />
                  </span>
                  <h3 className="pathway-card__title">Rainy Season</h3>
                  <p className="pathway-card__desc">
                    Surface runoff carries fecal matter into boreholes and shallow
                    wells. Contamination triples during April–October.
                  </p>
                </li>
                <li className="pathway-card" data-animate data-animate-delay="1">
                  <span className="pathway-card__icon" aria-hidden="true">
                    <Waves size={22} aria-hidden="true" />
                  </span>
                  <h3 className="pathway-card__title">Underground</h3>
                  <p className="pathway-card__desc">
                    E. coli survives in groundwater for months. It has no colour.
                    No smell. No taste. It is invisible.
                  </p>
                </li>
              </ol>

              <div className="pathway__media" data-animate data-animate-delay="2">
                <div className="pathway__head">
                  <span className="section-eyebrow pathway__eyebrow">
                    How Contamination Reaches You
                  </span>
                  <h2 className="section__title pathway__title">
                    The Journey From Ground
                    <br />
                    To Your Glass.
                  </h2>
                </div>
              </div>

              <ol
                className="pathway__stack"
                role="list"
                aria-label="How contamination travels through pipes to your tap"
              >
                <li className="pathway-card" data-animate data-animate-delay="3">
                  <span className="pathway-card__icon" aria-hidden="true">
                    <Droplet size={22} aria-hidden="true" />
                  </span>
                  <h3 className="pathway-card__title">Rusted Pipes</h3>
                  <p className="pathway-card__desc">
                    Water travels through infrastructure not replaced since the
                    1980s, picking up rust, lead, and heavy metals.
                  </p>
                </li>
                <li className="pathway-card" data-animate data-animate-delay="4">
                  <span className="pathway-card__icon" aria-hidden="true">
                    <Droplets size={22} aria-hidden="true" />
                  </span>
                  <h3 className="pathway-card__title">Your Tap</h3>
                  <p className="pathway-card__desc">
                    Contaminated water arrives at your tap — and without a filter,
                    directly into your cooking pot and drinking glass.
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* ============ 6. WATER SOURCES ============ */}
        <section className="section sources" id="sources" aria-label="Water sources">
          <div className="container">
            <span className="section-eyebrow">No Water Source Is Safe — Without Filtration</span>
            <h2 className="section__title">
              You Switched To Pure Water.
              <br />
              You Are Still Not Safe.
            </h2>
            <p className="section__lead">
              Most Nigerian families believe they solved the water problem when
              they switched from tap water to sachet or bottled water. The
              research says otherwise. Every commonly trusted water source in
              Nigeria carries documented contamination risk.
            </p>

            <ol
              className="sources-grid"
              role="list"
              aria-label="Water sources in an alternating-width grid"
            >
              <li
                className="source-card source-card--wide"
                data-animate
                data-animate-delay="0"
              >
                <span className="source-card__tag">Highly Contaminated</span>
                <h3 className="source-card__name">Borehole Water</h3>
                <p className="source-card__desc">
                  Boreholes are vulnerable to surface contamination —
                  particularly during rainy season when runoff floods the
                  surrounding soil. Most residential boreholes are not tested
                  regularly.
                </p>
                <p className="source-card__finding">
                  University of Ibadan research: 100% of borehole samples
                  contained fecal indicator organisms.
                </p>
              </li>

              <li className="source-card" data-animate data-animate-delay="1">
                <span className="source-card__tag">Contaminated</span>
                <h3 className="source-card__name">Tap / Pipe Water</h3>
                <p className="source-card__desc">
                  Municipal pipe infrastructure across Lagos, Abuja and Port
                  Harcourt is aging and cracked. Water picks up rust, lead, and
                  bacteria before reaching your tap. Treatment is inconsistent.
                </p>
                <p className="source-card__finding">
                  E. coli detected in 100% of municipal water samples tested in
                  Lagos residential areas.
                </p>
              </li>

              <li className="source-card" data-animate data-animate-delay="2">
                <span className="source-card__tag">Frequently Contaminated</span>
                <h3 className="source-card__name">Sachet &quot;Pure Water&quot;</h3>
                <p className="source-card__desc">
                  Sachet water production in Nigeria varies enormously in
                  quality. Many small-scale producers operate without adequate
                  sterilisation equipment. Even reputable brands show
                  inconsistent results.
                </p>
                <p className="source-card__finding">
                  87% of sachet water samples tested positive for E. coli or
                  Salmonella in peer-reviewed study.
                </p>
              </li>

              <li
                className="source-card source-card--wide"
                data-animate
                data-animate-delay="3"
              >
                <span className="source-card__tag">Often Overlooked</span>
                <h3 className="source-card__name">Cooking Water</h3>
                <p className="source-card__desc">
                  Most Nigerian families filter their drinking water but cook
                  with unfiltered tap or borehole water. Boiling kills bacteria
                  but does not remove heavy metals, rust, or chemical residues.
                </p>
                <p className="source-card__finding">
                  Heavy metals and chemical contaminants concentrate in food
                  cooked with contaminated water — they do not boil away.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* ============ 7. SYMPTOMS ============ */}
        <section className="section section--alt symptoms" id="symptoms" aria-label="Symptoms">
          <div className="container">
            <span className="section-eyebrow">Recognise These?</span>
            <h2 className="section__title">
              Symptoms Your Family
              <br />
              May Already Have.
            </h2>
            <p className="section__lead">
              Waterborne illness in Nigeria is dramatically under-diagnosed
              because the symptoms are common — and most families attribute them
              to food, not water. If your household experiences any of these
              regularly, your water is the most likely cause.
            </p>

            <ul
              className="symptoms-ramp__list"
              role="list"
              aria-label="Symptoms as severity ramps"
            >
              <li className="symptom-row" data-animate data-animate-delay="0">
                <span className="symptom-row__ramp" aria-hidden="true">
                  <span className="symptom-row__fill" style={{ height: "100%" }} />
                </span>
                <div className="symptom-row__body">
                  <div className="symptom-row__head">
                    <h3 className="symptom-row__name">Recurring Diarrhea</h3>
                    <span className="symptom-row__count">4/4</span>
                  </div>
                  <p className="symptom-row__desc">
                    Especially in children. The most direct symptom of E. coli
                    and Salmonella ingestion.
                  </p>
                </div>
              </li>
              <li className="symptom-row" data-animate data-animate-delay="1">
                <span className="symptom-row__ramp" aria-hidden="true">
                  <span className="symptom-row__fill" style={{ height: "50%" }} />
                </span>
                <div className="symptom-row__body">
                  <div className="symptom-row__head">
                    <h3 className="symptom-row__name">Nausea &amp; Vomiting</h3>
                    <span className="symptom-row__count">2/4</span>
                  </div>
                  <p className="symptom-row__desc">
                    Mistaken for food poisoning repeatedly. If it keeps
                    happening, the water is the source.
                  </p>
                </div>
              </li>
              <li className="symptom-row" data-animate data-animate-delay="2">
                <span className="symptom-row__ramp" aria-hidden="true">
                  <span className="symptom-row__fill" style={{ height: "50%" }} />
                </span>
                <div className="symptom-row__body">
                  <div className="symptom-row__head">
                    <h3 className="symptom-row__name">Constant Fatigue</h3>
                    <span className="symptom-row__count">2/4</span>
                  </div>
                  <p className="symptom-row__desc">
                    Chronic low-level contamination suppresses the immune
                    system, leaving the body perpetually exhausted.
                  </p>
                </div>
              </li>
              <li className="symptom-row" data-animate data-animate-delay="3">
                <span className="symptom-row__ramp" aria-hidden="true">
                  <span className="symptom-row__fill" style={{ height: "75%" }} />
                </span>
                <div className="symptom-row__body">
                  <div className="symptom-row__head">
                    <h3 className="symptom-row__name">Frequent Headaches</h3>
                    <span className="symptom-row__count">3/4</span>
                  </div>
                  <p className="symptom-row__desc">
                    Heavy metal contamination — particularly lead and manganese
                    — causes persistent headaches and cognitive fog.
                  </p>
                </div>
              </li>
              <li className="symptom-row" data-animate data-animate-delay="4">
                <span className="symptom-row__ramp" aria-hidden="true">
                  <span className="symptom-row__fill" style={{ height: "75%" }} />
                </span>
                <div className="symptom-row__body">
                  <div className="symptom-row__head">
                    <h3 className="symptom-row__name">Stomach Cramps</h3>
                    <span className="symptom-row__count">3/4</span>
                  </div>
                  <p className="symptom-row__desc">
                    Abdominal pain after drinking water or eating is a classic
                    sign of bacterial contamination.
                  </p>
                </div>
              </li>
              <li className="symptom-row" data-animate data-animate-delay="5">
                <span className="symptom-row__ramp" aria-hidden="true">
                  <span className="symptom-row__fill" style={{ height: "100%" }} />
                </span>
                <div className="symptom-row__body">
                  <div className="symptom-row__head">
                    <h3 className="symptom-row__name">Children&apos;s Development</h3>
                    <span className="symptom-row__count">4/4</span>
                  </div>
                  <p className="symptom-row__desc">
                    Lead in drinking water directly impairs cognitive
                    development in children under 6. Effects are permanent.
                  </p>
                </div>
              </li>
            </ul>

            <div className="symptom-callout" data-animate>
              <h3>The children in your house are the most vulnerable.</h3>
              <p>
                Their immune systems cannot fight the bacteria the way adults
                can. What causes a stomach ache in you can cause kidney failure
                in a child under 5. E. coli haemolytic uraemic syndrome — a
                life-threatening complication — disproportionately kills
                Nigerian children. This is not a scare tactic. It is documented
                medical reality.
              </p>
            </div>
          </div>
        </section>

        {/* ============ 8. PRODUCT / SOLUTION ============ */}
        <section className="section product" id="product" aria-label="The solution">
          <div className="container">
            <span className="section-eyebrow">The Solution — OmiFilter Faucet Filter</span>
            <h2 className="section__title">
              Clean Water From
              <br />
              Your Own Tap. From Today.
            </h2>
            <p className="section__lead">
              OmiFilter&apos;s dual-ceramic composite faucet filter attaches to
              any standard Nigerian tap in under 60 seconds. No plumber. No
              tank. No electricity. Just clean, filtered water every time you
              turn your tap — for your family, your cooking, your drinking.
            </p>

            <div className="product__layout">
              <div className="product__visual" data-animate>
                <div
                  className="product__visual-img"
                  style={{ aspectRatio: "1 / 1" }}
                  role="img"
                  aria-label="OmiFilter dual-ceramic faucet filter dispensing water"
                />
                <p className="product__visual-name">OmiFilter</p>
                <p className="product__visual-sub">Dual Ceramic Composite System</p>
                <span className="product__badge">CE Certified — International Safety Standard</span>
              </div>

              <ul className="feature-list" role="list">
                <li className="feature" data-animate data-animate-delay="0">
                  <span className="feature__check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="feature__name">Dual-Stage Ceramic Filtration</h3>
                    <p>
                      Two ceramic composite cartridges working in sequence — the
                      first removes sediment and rust particles, the second
                      targets chemical residues and microscopic contaminants.
                      Double the protection of standard single-stage filters.
                    </p>
                  </div>
                </li>
                <li className="feature" data-animate data-animate-delay="1">
                  <span className="feature__check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="feature__name">Removes Rust, Sediment & Heavy Metals</h3>
                    <p>
                      The ceramic composite media physically traps iron
                      particles, rust, sand, and suspended sediment before they
                      reach your glass. Your water runs clear from the first use.
                    </p>
                  </div>
                </li>
                <li className="feature" data-animate data-animate-delay="2">
                  <span className="feature__check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="feature__name">Reduces Chlorine & Chemical Residues</h3>
                    <p>
                      Activated carbon media absorbs excess chlorine,
                      trihalomethanes, and organic chemical compounds — removing
                      the bleach taste and odour that signals chemical
                      contamination.
                    </p>
                  </div>
                </li>
                <li className="feature" data-animate data-animate-delay="3">
                  <span className="feature__check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="feature__name">Universal Fit — Every Nigerian Tap</h3>
                    <p>
                      Engineered to fit standard Nigerian kitchen and bathroom
                      taps. No special tools. No plumber required. Install it
                      yourself in 60 seconds and your protection starts
                      immediately.
                    </p>
                  </div>
                </li>
                <li className="feature" data-animate data-animate-delay="4">
                  <span className="feature__check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="feature__name">CE Certified — European Safety Standard</h3>
                    <p>
                      OmiFilter meets the European Union&apos;s CE safety
                      certification — a rigorous international standard for
                      filtration performance and material safety. Not a cheap
                      market product. A certified health solution.
                    </p>
                  </div>
                </li>
                <li className="feature" data-animate data-animate-delay="5">
                  <span className="feature__check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="feature__name">Replaceable Cartridges — Long-Term Protection</h3>
                    <p>
                      The filter housing lasts for years. Replace only the
                      ceramic cartridges every 3–6 months depending on your
                      water quality. Replacement cartridges available on order —
                      your protection continues indefinitely.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ============ 9. HOW IT WORKS ============ */}
        <section className="section section--alt how" id="how" aria-label="How it works">
          <div className="container">
            <span className="section-eyebrow">Installation & How It Works</span>
            <h2 className="section__title">
              From Box to Clean Water
              <br />
              In 60 Seconds.
            </h2>

            <ol className="how__steps" role="list">
              <li className="how-step" data-animate data-animate-delay="0">
                <span className="how-step__num">1</span>
                <div>
                  <h3 className="how-step__title">Remove Your Tap Aerator</h3>
                  <p>
                    Unscrew the small mesh aerator at the tip of your tap by
                    hand. No tools needed. Most Nigerian kitchen and bathroom
                    taps have a standard aerator fitting that takes 10 seconds
                    to remove.
                  </p>
                </div>
              </li>
              <li className="how-step" data-animate data-animate-delay="1">
                <span className="how-step__num">2</span>
                <div>
                  <h3 className="how-step__title">Attach OmiFilter</h3>
                  <p>
                    Screw the OmiFilter filter directly onto your tap in place of
                    the aerator. It threads on by hand — no tools, no plumber,
                    no pipe modifications. The rubber seal creates a watertight
                    connection.
                  </p>
                </div>
              </li>
              <li className="how-step" data-animate data-animate-delay="2">
                <span className="how-step__num">3</span>
                <div>
                  <h3 className="how-step__title">Turn On Your Tap</h3>
                  <p>
                    Water flows through both ceramic cartridges — removing
                    sediment, rust, and chemical residues — and comes out clean
                    from the filter outlet. The switch on the side lets you
                    alternate between filtered and unfiltered flow for washing
                    dishes.
                  </p>
                </div>
              </li>
              <li className="how-step" data-animate data-animate-delay="3">
                <span className="how-step__num">4</span>
                <div>
                  <h3 className="how-step__title">Replace Cartridges Every 3–6 Months</h3>
                  <p>
                    When your water flow noticeably slows — the ceramic has
                    absorbed its maximum capacity of contaminants. Unscrew the
                    cartridges and replace them. The housing stays on your tap
                    permanently.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* ============ 10. COST / MATH (signature) ============ */}
        <section className="section section--dark cost" id="cost" aria-label="The financial case">
          <div className="container">
            <span className="section-eyebrow">The Financial Case — Real Numbers</span>
            <h2 className="section__title">
              You Are Already Spending
              <br />
              ₦120,000 Per Year On Water.
            </h2>

            <div className="cost__calculator" data-animate>
              <div className="cost__row">
                <div className="cost__label">
                  Monthly sachet water spend
                  <span>Average Lagos household — 2 to 4 packs per week</span>
                </div>
                <div className="cost__value">₦8,000/mo</div>
              </div>
              <div className="cost__row">
                <div className="cost__label">
                  Monthly water tanker / dispenser refills
                  <span>Common in areas with poor pipe pressure</span>
                </div>
                <div className="cost__value">₦4,000/mo</div>
              </div>
              <div className="cost__row">
                <div className="cost__label">
                  Medical bills from waterborne illness
                  <span>Conservative estimate — one illness per household per year</span>
                </div>
                <div className="cost__value">₦15,000/yr</div>
              </div>
              <div className="cost__row">
                <div className="cost__label">
                  Total annual water-related spending
                  <span>What you spend every year — without a filter</span>
                </div>
                <div className="cost__value cost__value--strike">₦159,000/yr</div>
              </div>
              <div className="cost__row cost__row--total">
                <div className="cost__label">
                  OmiFilter — Total First Year Cost
                  <span>Filter + cartridge replacement at 6 months</span>
                </div>
                <div className="cost__value">₦22,000</div>
              </div>
            </div>

            <p className="cost__verdict">
              You spend ₦159,000 per year on water that still makes your family
              sick. OmiFilter costs <strong>₦17,500 once.</strong> It pays for
              itself in <strong>5 weeks.</strong>
            </p>
          </div>
        </section>

        {/* ============ 11. TESTIMONIALS ============ */}
        <section className="section testimonials" id="testimonials" aria-label="Testimonials">
          <div className="container">
            <span className="section-eyebrow">Real Nigerian Families</span>
            <h2 className="section__title">
              What Happens When
              <br />
              You Make the Switch.
            </h2>

            <div className="grid-3 testimonials__grid">
              <figure className="testimonial" data-animate data-animate-delay="0">
                <blockquote>
                  &quot;My children had stomach problems every month. I thought
                  it was something they were eating at school. After installing
                  OmiFilter on our kitchen tap, three months passed without a
                  single stomach complaint. I wish I had done this years
                  ago.&quot;
                </blockquote>
                <figcaption className="testimonial__author">
                  <span className="testimonial__avatar" aria-hidden="true">
                    MC
                  </span>
                  <span>
                    <span className="testimonial__name">Mama Chidinma</span>
                    <span className="testimonial__location">Surulere, Lagos</span>
                  </span>
                </figcaption>
              </figure>

              <figure className="testimonial" data-animate data-animate-delay="1">
                <blockquote>
                  &quot;Our borehole water was always slightly brown. We had
                  been ignoring it because we couldn&apos;t afford a big
                  filtration system. OmiFilter solved it for ₦17,500. The water
                  runs clear now. My wife stopped buying pure water
                  completely.&quot;
                </blockquote>
                <figcaption className="testimonial__author">
                  <span className="testimonial__avatar" aria-hidden="true">
                    EB
                  </span>
                  <span>
                    <span className="testimonial__name">Engr. Babatunde</span>
                    <span className="testimonial__location">Gwarinpa, Abuja</span>
                  </span>
                </figcaption>
              </figure>

              <figure className="testimonial" data-animate data-animate-delay="2">
                <blockquote>
                  &quot;I am a nurse. I know what E. coli does to the body. When
                  I read the research about borehole water I ordered
                  immediately. Our filter has been on the kitchen tap for 4
                  months. I recommend it to every patient who comes in with
                  stomach problems.&quot;
                </blockquote>
                <figcaption className="testimonial__author">
                  <span className="testimonial__avatar" aria-hidden="true">
                    NA
                  </span>
                  <span>
                    <span className="testimonial__name">Nurse Adaeze</span>
                    <span className="testimonial__location">Port Harcourt GRA</span>
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Pricing moved to the order modal (opened via the "Order" buttons) */}

        {/* ============ 13. FAQ ============ */}
        <section className="section faq" id="faq" aria-label="Frequently asked questions">
          <div className="container">
            <span className="section-eyebrow">Common Questions</span>
            <h2 className="section__title">Questions Answered.</h2>

            <div className="faq__list" data-accordion-group>
              <div className="faq__item">
                <button
                  className="faq__trigger"
                  data-accordion-trigger
                  aria-expanded="false"
                  aria-controls="faq-1"
                >
                  <span className="faq__num" aria-hidden="true">01</span>
                  <h3 className="faq__q">Will this fit my tap?</h3>
                  <span className="faq__ind" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-plus">
                      <path d="M5 12h14" />
                    </svg>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-minus">
                      <path d="M5 12h14M12 5v14" />
                    </svg>
                  </span>
                </button>
                <div className="faq__content" id="faq-1" data-accordion-content>
                  <div className="faq__a">
                    <p>
                      OmiFilter fits standard Nigerian kitchen and bathroom taps
                      with a threaded aerator opening — which covers the vast
                      majority of taps in Lagos, Abuja, and Port Harcourt homes.
                      If you are unsure, send us a photo of your tap on WhatsApp
                      before ordering and we will confirm compatibility.
                    </p>
                  </div>
                </div>
              </div>

              <div className="faq__item">
                <button
                  className="faq__trigger"
                  data-accordion-trigger
                  aria-expanded="false"
                  aria-controls="faq-2"
                >
                  <span className="faq__num" aria-hidden="true">02</span>
                  <h3 className="faq__q">Does it remove E. coli completely?</h3>
                  <span className="faq__ind" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-plus">
                      <path d="M5 12h14" />
                    </svg>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-minus">
                      <path d="M5 12h14M12 5v14" />
                    </svg>
                  </span>
                </button>
                <div className="faq__content" id="faq-2" data-accordion-content>
                  <div className="faq__a">
                    <p>
                      OmiFilter&apos;s dual ceramic composite filtration
                      significantly reduces bacterial contamination including E.
                      coli and other pathogenic organisms. The ceramic composite
                      media physically traps micro-organisms above 0.1 microns.
                      For complete household water safety, we recommend
                      installing on all drinking and cooking taps.
                    </p>
                  </div>
                </div>
              </div>

              <div className="faq__item">
                <button
                  className="faq__trigger"
                  data-accordion-trigger
                  aria-expanded="false"
                  aria-controls="faq-3"
                >
                  <span className="faq__num" aria-hidden="true">03</span>
                  <h3 className="faq__q">How long does the filter last?</h3>
                  <span className="faq__ind" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-plus">
                      <path d="M5 12h14" />
                    </svg>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-minus">
                      <path d="M5 12h14M12 5v14" />
                    </svg>
                  </span>
                </button>
                <div className="faq__content" id="faq-3" data-accordion-content>
                  <div className="faq__a">
                    <p>
                      The filter housing is permanent — it stays on your tap
                      indefinitely. The ceramic cartridges should be replaced
                      every 3 to 6 months depending on how contaminated your
                      water supply is. You will know it is time to replace when
                      the water flow rate noticeably slows — the ceramic has
                      reached its capacity. Replacement cartridges are available
                      from us on order.
                    </p>
                  </div>
                </div>
              </div>

              <div className="faq__item">
                <button
                  className="faq__trigger"
                  data-accordion-trigger
                  aria-expanded="false"
                  aria-controls="faq-4"
                >
                  <span className="faq__num" aria-hidden="true">04</span>
                  <h3 className="faq__q">Do I need a plumber to install it?</h3>
                  <span className="faq__ind" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-plus">
                      <path d="M5 12h14" />
                    </svg>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-minus">
                      <path d="M5 12h14M12 5v14" />
                    </svg>
                  </span>
                </button>
                <div className="faq__content" id="faq-4" data-accordion-content>
                  <div className="faq__a">
                    <p>
                      No. Installation requires zero tools and no plumbing
                      knowledge. You unscrew the existing aerator from your tap,
                      screw on the OmiFilter filter by hand, and you are done.
                      The entire process takes under 60 seconds. We include a
                      step-by-step picture guide with every order.
                    </p>
                  </div>
                </div>
              </div>

              <div className="faq__item">
                <button
                  className="faq__trigger"
                  data-accordion-trigger
                  aria-expanded="false"
                  aria-controls="faq-5"
                >
                  <span className="faq__num" aria-hidden="true">05</span>
                  <h3 className="faq__q">What if it does not work for me?</h3>
                  <span className="faq__ind" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-plus">
                      <path d="M5 12h14" />
                    </svg>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-minus">
                      <path d="M5 12h14M12 5v14" />
                    </svg>
                  </span>
                </button>
                <div className="faq__content" id="faq-5" data-accordion-content>
                  <div className="faq__a">
                    <p>
                      We offer a 30-day satisfaction guarantee. If your water
                      quality does not improve visibly within 30 days of
                      installation, contact us on WhatsApp and we will process a
                      full refund. We are a Nigerian family business — our
                      reputation is built on your results, not just your
                      purchase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="faq__item">
                <button
                  className="faq__trigger"
                  data-accordion-trigger
                  aria-expanded="false"
                  aria-controls="faq-6"
                >
                  <span className="faq__num" aria-hidden="true">06</span>
                  <h3 className="faq__q">Can I use it for cooking water too?</h3>
                  <span className="faq__ind" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-plus">
                      <path d="M5 12h14" />
                    </svg>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="faq__ind-minus">
                      <path d="M5 12h14M12 5v14" />
                    </svg>
                  </span>
                </button>
                <div className="faq__content" id="faq-6" data-accordion-content>
                  <div className="faq__a">
                    <p>
                      Yes — and we strongly recommend it. Most Nigerian families
                      filter their drinking water but cook with unfiltered
                      water. Boiling kills bacteria but does not remove heavy
                      metals, rust, or chemical residues. OmiFilter on your
                      kitchen tap protects both your drinking water and your
                      cooking water simultaneously.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ============ 15. FOOTER ============ */}
      <footer className="site-footer" id="final-cta">
        <div className="site-footer__inner">
          {/* Final CTA */}
          <div className="site-footer__cta">
            <h2 className="site-footer__cta-title">
              Your Family Drank Contaminated Water Today.
            </h2>
            <p className="site-footer__cta-text">
              They do not have to tomorrow. One filter. Sixty seconds to
              install. Clean water from your own tap — forever.
            </p>
            <button
              type="button"
              className="btn btn--light btn--lg btn--wide"
              data-modal-open
            >
              Order OmiFilter Now — Pay on Delivery →
            </button>
          </div>

          {/* Brand */}
          <div className="site-footer__brand">
            <p className="site-footer__logo">OmiFilter</p>
            <p className="site-footer__desc">
              Clean water for Nigerian homes. The OmiFilter faucet filter
              removes E. coli, rust, and heavy metals from your tap — installs
              in 60 seconds, no plumber required.
            </p>
          </div>

          {/* Copyright bar */}
          <div className="site-footer__bar">
            <p className="site-footer__copy">
              © 2026 OmiFilter Nigeria. All rights reserved.
            </p>
            <p className="site-footer__attrib">
              Delivering to Lagos · Abuja · Port Harcourt
            </p>
          </div>
        </div>

        {/* Watermark */}
        <p className="site-footer__watermark" aria-hidden="true">
          OmiFilter
        </p>
      </footer>

      {/* ============ ORDER MODAL ============ */}
      <div
        className="modal"
        id="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        data-modal
        hidden
      >
        <div className="modal__backdrop" data-modal-close></div>
        <div className="modal__panel">
          <button
            type="button"
            className="modal__close"
            data-modal-close
            aria-label="Close order dialog"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <span className="section-eyebrow">Order OmiFilter Today</span>
          <h2 className="modal__title" id="order-modal-title">
            Choose Your Protection.
            <br />
            Delivered To Your Door.
          </h2>

          <div className="membership" aria-label="Pricing as membership cards">
            <button
              type="button"
              className="membership-card membership-card--left"
            >
              <span className="membership-card__row">
                <span className="membership-card__tier">Tier 01</span>
                <span className="membership-card__no">OMW·0421</span>
              </span>
              <span className="membership-card__barcode" aria-hidden="true" />
              <span className="membership-card__name">Single Unit</span>
              <span className="membership-card__price">₦17,500</span>
              <span className="membership-card__units">1 filter unit</span>
              <span className="membership-card__save">Kitchen tap protection</span>
              <span className="membership-card__punch" aria-hidden="true">
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole" />
                <span className="membership-card__hole" />
              </span>
            </button>

            <button
              type="button"
              className="membership-card membership-card--featured is-front"
            >
              <span className="membership-card__tab" aria-hidden="true">
                Most Popular
              </span>
              <span className="membership-card__row">
                <span className="membership-card__tier">Tier 02</span>
                <span className="membership-card__no">OMW·0421</span>
              </span>
              <span className="membership-card__barcode" aria-hidden="true" />
              <span className="membership-card__name">Family Pack</span>
              <span className="membership-card__price">₦32,000</span>
              <span className="membership-card__units">2 filter units</span>
              <span className="membership-card__save">
                SAVE ₦3,000 — Kitchen + Bathroom
              </span>
              <span className="membership-card__punch" aria-hidden="true">
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
              </span>
            </button>

            <button
              type="button"
              className="membership-card membership-card--right"
            >
              <span className="membership-card__row">
                <span className="membership-card__tier">Tier 03</span>
                <span className="membership-card__no">OMW·0421</span>
              </span>
              <span className="membership-card__barcode" aria-hidden="true" />
              <span className="membership-card__name">Full Home</span>
              <span className="membership-card__price">₦45,000</span>
              <span className="membership-card__units">3 filter units</span>
              <span className="membership-card__save">
                SAVE ₦7,500 — All taps covered
              </span>
              <span className="membership-card__punch" aria-hidden="true">
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
                <span className="membership-card__hole membership-card__hole--on" />
              </span>
            </button>
          </div>

          <div className="pricing__cta">
            <a href="#" className="btn btn--primary btn--lg btn--wide">
              Order on WhatsApp →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
