"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare Turnstile site key. Public by design (safe in the client
 * bundle) — paired server-side with TURNSTILE_SECRET_KEY, which verifies the
 * token before anything sensitive happens (starting a checkout, logging in).
 * Hardcoded here rather than via NEXT_PUBLIC_* because this project's build
 * pipeline doesn't reliably inline NEXT_PUBLIC_ env vars at build time (see
 * the same note on PAYSTACK_PUBLIC_KEY in CheckoutClient.tsx).
 */
const TURNSTILE_SITE_KEY =
  process.env.NODE_ENV === "development"
    ? // Cloudflare's "always passes" test key — the real widget rejects localhost.
      // Paired with the test secret in lib/turnstile.ts.
      "1x00000000000000000000AA"
    : "0x4AAAAAAE2bKzgvvJ4qRYIs";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export default function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function render() {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="turnstile-widget" />;
}
