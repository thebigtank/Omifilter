"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { useLenis } from "lenis/react";
import { ShoppingBasket } from "lucide-react";

const basketProps = {
  size: 18,
  strokeWidth: 1.75,
  "aria-hidden": true,
} as const;

const NAV_SECTIONS = [
  { href: "#filter", label: "The filter" },
  { href: "#water", label: "Your water" },
  { href: "#install", label: "Install" },
];

function Wordmark() {
  return (
    <Link href="/" className="wordmark">
      Omi<em>Filter</em>
    </Link>
  );
}

type SiteHeaderProps = {
  /** "home" renders an Order button that opens the order modal; "page" renders
      one that navigates to the order section on the home page. */
  variant?: "home" | "page";
  /** Home only: opens the order modal. Ignored for the "page" variant. */
  onOrder?: () => void;
};

export default function SiteHeader({
  variant = "home",
  onOrder,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const lenis = useLenis();
  const [navOpen, setNavOpen] = useState(false);

  const close = useCallback(() => setNavOpen(false), []);

  const onSection = useCallback(
    (hash: string) => {
      // On the home page we scroll to the section in place. Elsewhere we
      // navigate to /#section, which the anchor then scrolls to.
      if (pathname === "/") {
        const target = document.querySelector(hash) as HTMLElement | null;
        if (target) {
          if (lenis) {
            lenis.scrollTo(target, { offset: -72 });
          } else {
            target.scrollIntoView({ behavior: "smooth" });
          }
        }
      } else {
        window.location.hash = hash;
      }
      close();
    },
    [lenis, pathname, close],
  );

  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Wordmark />
        <nav className="site-nav" data-open={navOpen}>
          {NAV_SECTIONS.map(({ href, label }) => (
            <button
              key={href}
              type="button"
              className="site-nav__link"
              onClick={() => onSection(href)}
            >
              {label}
            </button>
          ))}

          <Link href="/faq" className="site-nav__link" onClick={close}>
            FAQ
          </Link>

          {variant === "home" ? (
            <button
              type="button"
              className="btn btn--teal"
              onClick={() => {
                onOrder?.();
                close();
              }}
            >
              <ShoppingBasket {...basketProps} />
              Order
            </button>
          ) : (
            <Link href="/#order" className="btn btn--teal" onClick={close}>
              <ShoppingBasket {...basketProps} />
              Order
            </Link>
          )}
        </nav>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={navOpen}
          aria-label="Toggle navigation"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span />
        </button>
      </div>
    </header>
  );
}
