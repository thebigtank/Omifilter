"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ShoppingBasket, ShieldCheck } from "lucide-react";
import { titleCase, type Tier } from "../tiers";
import TurnstileWidget from "../TurnstileWidget";

/** Minimal shape of the Paystack inline payment global loaded by checkout.js. */
type PaystackPop = {
  setup: (options: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    metadata?: { custom_fields?: { display_name: string; variable_name: string; value: string }[] };
    callback: (response: { reference?: string; trxref?: string }) => void;
    onClose: () => void;
  }) => { openIframe: () => void };
};

/**
 * Paystack public key, used to start the inline payment popup
 * (js.paystack.co/v1/inline.js). This is a *public* key Paystack requires in
 * the browser, so it's safe to ship in the client bundle. It's defined here in
 * code (not `next/env`) because this build wasn't inlining the env var at
 * build time, which made the popup fail with "Could not start this
 * transaction."
 *
 * MUST be the same mode (test/live) as the server's PAYSTACK_SECRET_KEY, or
 * Paystack rejects the checkout request outright.
 */
const PAYSTACK_PUBLIC_KEY = "pk_live_049b22426338e664609e45847ad524c531551e53";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

type FormState = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  state: string;
};

const EMPTY: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  state: "",
};

export default function CheckoutClient({ tier }: { tier: Tier }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [qty, setQty] = useState(1);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Paystack charges the per-unit price × quantity, in kobo.
  const qtyPriceKobo = tier.priceKobo * qty;

  const set = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [field]: e.target.value })),
    [],
  );

  const buyNow = useCallback(async () => {
    setError(null);

    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    if (!form.address.trim() || !form.state) {
      setError("Enter your delivery address and state.");
      return;
    }
    if (!turnstileToken) {
      setError("Please complete the verification check.");
      return;
    }

    const paystack = (window as unknown as { PaystackPop?: PaystackPop }).PaystackPop;
    if (!paystack) {
      setError("Payment is still loading — try again in a moment.");
      return;
    }

    const reference = `OMW-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    setPaying(true);

    try {
      const startRes = await fetch("/api/checkout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          tierSlug: tier.slug,
          qty,
          email,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          state: form.state,
          turnstileToken,
        }),
      });

      if (!startRes.ok) {
        const data = await startRes.json().catch(() => null);
        setError(data?.reason || "Couldn't start checkout — try again in a moment.");
        setPaying(false);
        return;
      }
    } catch {
      setError("Couldn't start checkout — try again in a moment.");
      setPaying(false);
      return;
    }

    paystack.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: qtyPriceKobo,
      currency: "NGN",
      ref: reference,
      metadata: {
        custom_fields: [
          {
            display_name: "Product",
            variable_name: "product",
            value: tier.name,
          },
          {
            display_name: "Customer",
            variable_name: "customer",
            value: `${form.firstName.trim()} ${form.lastName.trim()}`,
          },
        ],
      },
      // NOTE: must be a *plain* (non-async) function. Paystack's inline.js
      // validates it with `{}.toString.call(fn) === "[object Function]"`, and
      // an async function reports "[object AsyncFunction]", which makes
      // setup() throw "Attribute callback must be a valid function" before it
      // ever opens the popup. Do the async work in an inner IIFE instead.
      callback: (response) => {
        const ref = response.reference || response.trxref || reference;

        void (async () => {
          try {
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: ref }),
            });
            const data = await verifyRes.json().catch(() => null);

            if (!verifyRes.ok || !data?.ok) {
              setPaying(false);
              setError(
                "We couldn't confirm your payment — please contact support before trying again.",
              );
              return;
            }

            setPaying(false);
            router.push(`/thank-you/${tier.slug}`);
          } catch {
            setPaying(false);
            setError(
              "We couldn't confirm your payment — please contact support before trying again.",
            );
          }
        })();
      },
      onClose: () => {
        setPaying(false);
      },
    }).openIframe();
  }, [form, qty, qtyPriceKobo, router, tier, turnstileToken]);

  return (
    <>
      <header className="checkout-bar">
        <div className="shell checkout-bar__inner">
          <Link href="/" className="checkout-bar__wordmark">
            Omi<em>Filter</em>
          </Link>
          <Link href="/" className="checkout-bar__back">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="checkout-main">
        <div className="shell checkout-grid">
          {/* Left — the order form ---------------------------------------- */}
          <section className="checkout-form" aria-labelledby="checkout-title">
            <p className="eyebrow">Checkout</p>
            <h1 className="checkout-form__title" id="checkout-title">
              Order the {titleCase(tier.name)}.
            </h1>
            <p className="checkout-form__lede">
              Tell us where to send it. Paystack handles the payment securely
              — you’ll be redirected straight back when it’s done.
            </p>

            <form
              className="checkout-fields"
              onSubmit={(e) => {
                e.preventDefault();
                buyNow();
              }}
            >
              {/* A plain, non-async <script> tag so it renders as a real DOM
                  node right here inside the <form> — Paystack's inline.js
                  requires its own script tag to be a form descendant. Both
                  next/script (afterInteractive) and a plain `async` script
                  tag get hoisted into <head> by Next.js/React 19's resource
                  handling, which breaks that check, so this must stay a
                  synchronous script tag. */}
              {/* eslint-disable-next-line @next/next/no-sync-scripts */}
              <script src="https://js.paystack.co/v1/inline.js" />

              <div className="checkout-fields__grid">
                <label className="field">
                  <span className="field__label">First name</span>
                  <input
                    type="text"
                    autoComplete="given-name"
                    required
                    value={form.firstName}
                    onChange={set("firstName")}
                    placeholder="Adaeze"
                  />
                </label>
                <label className="field">
                  <span className="field__label">Last name</span>
                  <input
                    type="text"
                    autoComplete="family-name"
                    required
                    value={form.lastName}
                    onChange={set("lastName")}
                    placeholder="Okafor"
                  />
                </label>
              </div>

              <div className="checkout-fields__grid">
                <label className="field">
                  <span className="field__label">Email address</span>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="field">
                  <span className="field__label">Phone number</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="0801 234 5678"
                  />
                </label>
              </div>

              <div className="checkout-fields__grid checkout-fields__address">
                <label className="field">
                  <span className="field__label">Delivery address</span>
                  <input
                    type="text"
                    autoComplete="street-address"
                    required
                    value={form.address}
                    onChange={set("address")}
                    placeholder="12 Marina Road, Lagos"
                  />
                </label>
                <label className="field">
                  <span className="field__label">State</span>
                  <select required value={form.state} onChange={set("state")}>
                    <option value="" disabled>
                      Select your state
                    </option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <TurnstileWidget onToken={setTurnstileToken} />
            </form>

            {error && (
              <p className="checkout-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              className="btn btn--teal checkout-buy"
              onClick={buyNow}
              disabled={paying || !turnstileToken}
            >
              <ShoppingBasket size={18} strokeWidth={1.75} aria-hidden="true" />
              {paying ? "Processing payment…" : "Buy Now"}
            </button>
          </section>

          {/* Right — the selected pack ------------------------------------ */}
          <aside className="checkout-summary" aria-label="Your order">
            <div
              className={`membership-card membership-card--featured is-front${
                tier.feature ? "" : " membership-card--hero"
              }`}
            >
              {tier.feature && (
                <span className="membership-card__tab" aria-hidden="true">
                  Most popular
                </span>
              )}
              <span className="membership-card__row">
                <span className="membership-card__tier">{tier.tier}</span>
                <span className="membership-card__no">OMW·0421</span>
              </span>
              <span className="membership-card__barcode" aria-hidden="true" />
              <span className="membership-card__name">{tier.name}</span>
              <span className="membership-card__price">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 0,
                }).format(qtyPriceKobo / 100)}
              </span>
              <span className="membership-card__units">
                {qty} × {tier.units}
              </span>
              <span className="membership-card__save">{tier.note}</span>
            </div>

            <div className="checkout-qty" aria-label="Quantity">
              <button
                type="button"
                className="checkout-qty__btn"
                aria-label="Decrease quantity"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
              >
                −
              </button>
              <span className="checkout-qty__value" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                className="checkout-qty__btn"
                aria-label="Increase quantity"
                onClick={() => setQty((n) => Math.min(20, n + 1))}
              >
                +
              </button>
            </div>

            <p className="checkout-paynote">
              <ShieldCheck size={16} strokeWidth={1.75} aria-hidden="true" />
              Pay securely with Paystack
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
