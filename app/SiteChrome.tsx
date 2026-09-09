"use client";

import { Lenis, useLenis } from "lenis/react";
import { useCallback, useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** How far (in px) the user must scroll before the back-to-top button shows. */
const SHOW_AFTER = 600;

/**
 * Scroll-direction + back-to-top logic. Runs as a child of <Lenis root> so it
 * can read the live Lenis instance and subscribe to its scroll events.
 */
function ScrollState() {
  const lenis = useLenis();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    if (!lenis) return;

    let lastY = lenis.scroll ?? 0;
    const onScroll = ({ scroll }: { scroll: number }) => {
      const root = document.documentElement;
      // Toggle a "scrolled" flag so CSS can restyle the header once we're
      // past the top, and a scroll *direction* flag so the header can hide
      // while scrolling down and reveal on scroll up.
      root.dataset.scrolled = scroll > 16 ? "true" : "";
      root.dataset.scrollDirection =
        scroll < lastY ? "up" : scroll > lastY ? "down" : root.dataset.scrollDirection;
      lastY = scroll;
      setShowTop(scroll > SHOW_AFTER);
    };

    onScroll({ scroll: lenis.scroll ?? 0 });
    lenis.on("scroll", onScroll);
    return () => lenis.off("scroll", onScroll);
  }, [lenis]);

  const scrollToTop = useCallback(() => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.1 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lenis]);

  return (
    <button
      type="button"
      className="back-to-top"
      data-visible={showTop ? "true" : ""}
      aria-label="Back to top"
      onClick={scrollToTop}
    >
      <ArrowUp size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}

/**
 * Global site "chrome": Lenis smooth scrolling (site-wide), the scroll-state
 * data attributes that drive the hide/reveal header, and the floating
 * back-to-top button. Mounted once in the root layout.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <Lenis
      root
      options={{
        autoRaf: true,
        // Native scroll is kept so IntersectionObserver / getBoundingClientRect
        // reveals in app/reveal.tsx keep working (no transform wrappers).
        smoothWheel: true,
        lerp: 0.1,
      }}
    >
      <ScrollState />
      {children}
    </Lenis>
  );
}
