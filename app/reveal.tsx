"use client";

/* ==========================================================================
   Scroll reveal — blur fade-in, count-up, and the sequential install stagger.

   Design notes
   ------------
   * The hidden state lives behind `[data-reveal-ready]` on <html>, which a tiny
     inline script sets during HTML parse (see `RevealBootScript`). If the JS
     bundle never boots, a 4s failsafe in that same script drops the attribute
     again, so content can never be stranded at opacity 0.
   * One shared IntersectionObserver serves every reveal on the page.
   * Reveals fire once and unobserve — they never re-hide on scroll back up.
   ========================================================================== */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

/** Milliseconds between siblings in a staggered group. */
export const REVEAL_STAGGER = 90;

/** Fires when the element is ~15% visible. */
const RATIO = 0.15;
const THRESHOLDS = [0, 0.05, 0.1, RATIO, 0.3, 0.5];

/** The inline boot script. Kept as one line so it parses and runs instantly. */
export const REVEAL_BOOT_SCRIPT =
  "(function(){var d=document.documentElement;" +
  "d.setAttribute('data-reveal-ready','');" +
  "setTimeout(function(){if(!window.__revealBooted)" +
  "d.removeAttribute('data-reveal-ready')},4000)})()";

type Booted = { __revealBooted?: boolean };

function reduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* --- Shared observer ------------------------------------------------------ */

type RevealCallback = () => void;

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, RevealCallback>();

/* Elements still waiting to be revealed. An element that reflows out of view
   while it sits above the viewport (a late image or webfont pushing the page
   down after you have scrolled past) never crosses a threshold again, so the
   observer alone can strand it at opacity 0. A rAF-throttled scroll sweep
   catches exactly that case, and unhooks itself once nothing is pending. */
const pending = new Set<Element>();
let sweepRaf = 0;
let sweeping = false;

function markRevealed(el: Element) {
  pending.delete(el);
  (el as HTMLElement).dataset.revealed = "true";
  const cb = callbacks.get(el);
  if (cb) {
    callbacks.delete(el);
    cb();
  }
}

function sweep() {
  sweepRaf = 0;
  for (const el of Array.from(pending)) {
    if (el.getBoundingClientRect().bottom <= 0) {
      sharedObserver?.unobserve(el);
      markRevealed(el);
    }
  }
  if (pending.size === 0) stopSweeping();
}

function queueSweep() {
  if (!sweepRaf) sweepRaf = requestAnimationFrame(sweep);
}

function startSweeping() {
  if (sweeping) return;
  sweeping = true;
  window.addEventListener("scroll", queueSweep, { passive: true });
  window.addEventListener("resize", queueSweep);
}

function stopSweeping() {
  if (!sweeping) return;
  sweeping = false;
  window.removeEventListener("scroll", queueSweep);
  window.removeEventListener("resize", queueSweep);
}

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // An element taller than ~6.5 viewports can never reach a 15% ratio,
          // so also accept one that already fills much of the viewport.
          const rootHeight =
            entry.rootBounds?.height ?? window.innerHeight ?? 1;
          const fillsViewport =
            entry.intersectionRect.height >= rootHeight * 0.55;
          if (entry.intersectionRatio >= RATIO || fillsViewport) {
            obs.unobserve(entry.target);
            markRevealed(entry.target);
          }
        }
      },
      { threshold: THRESHOLDS },
    );
  }
  return sharedObserver;
}

/**
 * Reveal `el` once it scrolls into view. Returns a cleanup function.
 * With reduced motion (or no IntersectionObserver) it resolves immediately.
 */
export function observeReveal(el: Element, cb?: RevealCallback): () => void {
  const observer = reduceMotion() ? null : getObserver();

  if (!observer) {
    (el as HTMLElement).dataset.revealed = "true";
    cb?.();
    return () => {};
  }

  if (cb) callbacks.set(el, cb);
  pending.add(el);
  observer.observe(el);
  startSweeping();

  return () => {
    callbacks.delete(el);
    pending.delete(el);
    observer.unobserve(el);
    if (pending.size === 0) stopSweeping();
  };
}

/**
 * Marks the bundle as booted (disarming the failsafe) and, under reduced
 * motion, strips the ready flag so nothing is ever hidden in the first place.
 */
export function useRevealBoot(): void {
  useEffect(() => {
    (window as unknown as Booted).__revealBooted = true;
    if (reduceMotion()) {
      document.documentElement.removeAttribute("data-reveal-ready");
    }
  }, []);
}

/* --- <Reveal> ------------------------------------------------------------- */

type RevealTag =
  | "div"
  | "span"
  | "section"
  | "article"
  | "h1"
  | "h2"
  | "h3"
  | "p"
  | "ul"
  | "li";

type RevealProps = HTMLAttributes<HTMLElement> & {
  as?: RevealTag;
  /** Position within a staggered group; multiplied by REVEAL_STAGGER. */
  index?: number;
  /** Explicit delay in ms, overriding `index`. */
  delay?: number;
  children?: ReactNode;
};

export function Reveal({
  as = "div",
  index = 0,
  delay,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeReveal(el);
  }, []);

  const ms = delay ?? index * REVEAL_STAGGER;
  const merged = ms
    ? ({ ...style, "--reveal-delay": `${ms}ms` } as CSSProperties)
    : style;
  // One JSX element stands in for a union of tags, and TypeScript intersects
  // the props of every member of that union. Narrow to a single element type
  // and let `as` choose the tag at runtime.
  const Tag = as as "div";

  return (
    <Tag {...rest} ref={ref} data-reveal="" style={merged}>
      {children}
    </Tag>
  );
}

/* --- <CountUp> ------------------------------------------------------------ */

type Parsed = {
  prefix: string;
  suffix: string;
  target: number;
  format: (n: number) => string;
};

/**
 * Splits e.g. "₦394,000" into prefix/number/suffix and builds a formatter that
 * matches the source string's grouping and decimal places. Returns null for
 * anything that should stay static — notably ranges such as "3–6".
 */
function parseValue(value: string): Parsed | null {
  const match = /^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/.exec(value);
  if (!match) return null;

  const [, prefix, raw, suffix] = match;
  if (/[0-9]/.test(suffix)) return null; // a range, not a single figure

  const plain = raw.replace(/,/g, "");
  const target = Number(plain);
  if (!Number.isFinite(target)) return null;

  const dot = plain.indexOf(".");
  const decimals = dot === -1 ? 0 : plain.length - dot - 1;
  const nf = new Intl.NumberFormat("en-US", {
    useGrouping: raw.includes(","),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return { prefix, suffix, target, format: (n) => nf.format(n) };
}

type CountUpProps = {
  value: string;
  className?: string;
  /** Total duration in ms. */
  duration?: number;
};

/**
 * Counts from 0 to `value` when the element is revealed, then lands on the
 * original string byte-for-byte. Server-renders the final value, so no-JS and
 * reduced-motion readers see the real number.
 */
export function CountUp({ value, className, duration = 1400 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [text, setText] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // `text` already starts at the exact source string, so a value that is
    // static (a range) or a reader who prefers reduced motion needs no work.
    const parsed = parseValue(value);
    if (!parsed || reduceMotion()) return;

    let raf = 0;
    const stop = observeReveal(el, () => {
      const started = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / duration);
        if (t >= 1) {
          setText(value); // exact original string
          return;
        }
        const eased = 1 - Math.pow(1 - t, 3);
        setText(parsed.prefix + parsed.format(parsed.target * eased) + parsed.suffix);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    return () => {
      stop();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

/* --- Sequential reveal (install steps) ------------------------------------ */

/**
 * Reveals `count` siblings one at a time, driven by how far the container has
 * travelled up the viewport. An IntersectionObserver cannot do this: on desktop
 * the four install steps sit side by side, so they all cross any threshold at
 * the same instant. Mapping scroll progress over the container works in both
 * the 4-column and the stacked layout.
 */
export function useSequentialReveal(count: number) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    let raf = 0;
    let current = 0;

    if (reduceMotion()) {
      raf = requestAnimationFrame(() => setShown(count));
      return () => cancelAnimationFrame(raf);
    }

    const advance = (n: number) => {
      if (n > current) {
        current = n;
        setShown(n);
      }
    };

    const measure = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      // Scrolled clean past it — everything must be visible.
      if (rect.bottom <= 0) {
        advance(count);
        return;
      }

      const span = Math.max(vh * 0.75, rect.height * 0.9);
      const progress = (vh * 0.9 - rect.top) / span;
      if (progress < 0) return;
      advance(Math.min(count, Math.floor(progress * count) + 1));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    raf = requestAnimationFrame(measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [count]);

  return { gridRef, shown };
}
