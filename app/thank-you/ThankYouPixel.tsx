"use client";

import { useEffect } from "react";
import { trackPixelEvent } from "../lib/fbPixel";

export default function ThankYouPixel({
  slug,
  name,
  value,
  qty,
  orderRef,
}: {
  slug: string;
  name: string;
  value: number;
  qty: number;
  orderRef: string;
}) {
  useEffect(() => {
    // value/qty are only present when the redirect came from a verified
    // Paystack payment (see CheckoutClient.tsx) — a bare visit to this URL
    // (bookmark, direct link) has no value and shouldn't fire a fake Purchase.
    if (!value || value <= 0) return;

    trackPixelEvent(
      "Purchase",
      {
        value,
        currency: "NGN",
        content_name: name,
        content_ids: [slug],
        content_type: "product",
        num_items: qty || 1,
      },
      orderRef || undefined,
    );
    // Note: reloading this page re-fires Purchase (no server-side event to
    // dedupe against yet) — acceptable for now, but worth knowing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
