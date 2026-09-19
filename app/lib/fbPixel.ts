type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/**
 * Fires a Meta Pixel event client-side. No-ops on the server or before the
 * pixel script has loaded. `eventId` pairs with a matching Conversions API
 * (server-side) event of the same ID for Meta's event-dedup, per
 * https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking#duplicate-events
 * — there's no server-side event sent from this app yet, so it doesn't
 * dedupe anything on its own today, but it's free to include for later.
 */
export function trackPixelEvent(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window !== "undefined" && window.fbq) {
    if (eventId) {
      window.fbq("track", event, params, { eventID: eventId });
    } else {
      window.fbq("track", event, params);
    }
  }
}
