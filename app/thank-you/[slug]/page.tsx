import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTier, titleCase, type Tier } from "../../tiers";
import { getOrderByReference, type Order } from "../../lib/db";
import { WHATSAPP_DISPLAY, WHATSAPP_HREF } from "../../lib/contact";
import ThankYouPixel from "../ThankYouPixel";
import "../thank-you.css";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ value?: string; qty?: string; ref?: string; method?: string }>;
};

function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tier = getTier(slug);
  if (!tier) {
    return { title: "Order confirmed — OmiFilter" };
  }
  return {
    title: `Thank you — ${titleCase(tier.name)} | OmiFilter`,
    description: "Your OmiFilter order is confirmed. Thank you for choosing clean water.",
  };
}

export default async function ThankYouPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { value, qty, ref, method } = await searchParams;
  const tier = getTier(slug);
  if (!tier) notFound();

  if (method === "pod") {
    // Read the order back rather than trusting the URL, so the WhatsApp text
    // and the pixel value are the real stored order.
    const found = ref ? getOrderByReference(ref) : undefined;
    const order =
      found && found.payment_method === "pod" && found.tier_slug === tier.slug ? found : undefined;
    return <PayOnDeliveryThanks tier={tier} order={order} />;
  }

  return (
    <main className="thanks">
      <ThankYouPixel
        slug={tier.slug}
        name={tier.name}
        value={Number(value) || 0}
        qty={Number(qty) || 1}
        orderRef={ref || ""}
      />
      <div className="shell thanks__inner">
        <div className="thanks__badge" aria-hidden="true">
          ✓
        </div>
        <p className="eyebrow">Order confirmed</p>
        <h1 className="thanks__title">
          Thank you for ordering the {titleCase(tier.name)}.
        </h1>
        <p className="thanks__lede">
          Your payment went through and your {tier.units} is being
          prepared. We’ll send your tracking number on WhatsApp or email once
          it’s dispatched.
        </p>
        <div className="thanks__actions">
          <Link href="/" className="btn btn--ink">
            Go Back to Home
          </Link>
          <Link href="/#order" className="btn btn--teal">
            Order Again
          </Link>
        </div>
      </div>
    </main>
  );
}

function PayOnDeliveryThanks({ tier, order }: { tier: Tier; order?: Order }) {
  const whatsappHref = order
    ? `${WHATSAPP_HREF}?text=${encodeURIComponent(
        `Hi OmiFilter, I just placed a pay-on-delivery order. ` +
          `Ref: ${order.reference}. ${order.tier_name} × ${order.qty}, total ${formatNaira(order.amount_kobo)}. ` +
          `Name: ${order.first_name} ${order.last_name}, ${order.state}.`,
      )}`
    : WHATSAPP_HREF;

  return (
    <main className="thanks">
      {order && (
        <ThankYouPixel
          event="Lead"
          slug={tier.slug}
          name={tier.name}
          value={order.amount_kobo / 100}
          qty={order.qty}
          orderRef={order.reference}
        />
      )}
      <div className="shell thanks__inner">
        <div className="thanks__badge" aria-hidden="true">
          ✓
        </div>
        <p className="eyebrow">Order received</p>
        <h1 className="thanks__title">
          Thank you for ordering the {titleCase(tier.name)}.
        </h1>
        <p className="thanks__lede">
          Your order is in. Our team will call you
          {order ? <> on {order.phone}</> : null} to confirm before dispatch.
          Pay the rider in cash or by bank transfer when it arrives.
        </p>
        <p className="thanks__lede">
          Want it confirmed faster? Send us your order on WhatsApp
          ({WHATSAPP_DISPLAY}).
          {order ? <> Your order reference is <strong>{order.reference}</strong>.</> : null}
        </p>
        <div className="thanks__actions">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn--teal">
            Confirm on WhatsApp
          </a>
          <Link href="/" className="btn btn--ink">
            Go Back to Home
          </Link>
          <Link href="/#order" className="btn btn--ink">
            Order Again
          </Link>
        </div>
      </div>
    </main>
  );
}
