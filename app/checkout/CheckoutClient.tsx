"use client";

import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ShoppingBasket, ShieldCheck } from "lucide-react";
import { titleCase, type Tier } from "../tiers";

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
 */
const PAYSTACK_PUBLIC_KEY = "pk_test_e1e0f359eb3fec37797dcd197bf009ea600ed234";

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

  // Paystack charges the per-unit price × quantity, in kobo.
  const qtyPriceKobo = tier.priceKobo * qty;

  const set = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [field]: e.target.value })),
    [],
  );

  const buyNow = useCallback(() => {
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

    const paystack = (window as unknown as { PaystackPop?: PaystackPop }).PaystackPop;
    if (!paystack) {
      setError("Payment is still loading — try again in a moment.");
      return;
    }

    setPaying(true);
    paystack.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: qtyPriceKobo,
      currency: "NGN",
      ref: `OMW-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
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
      callback: () => {
        setPaying(false);
        router.push(`/thank-you/${tier.slug}`);
      },
      onClose: () => {
        setPaying(false);
      },
    }).openIframe();
  }, [form, qtyPriceKobo, router, tier]);

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
      />

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
              disabled={paying}
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
