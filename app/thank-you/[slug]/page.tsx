import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTier, titleCase } from "../../tiers";
import ThankYouPixel from "../ThankYouPixel";
import "../thank-you.css";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ value?: string; qty?: string; ref?: string }>;
};

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
  const { value, qty, ref } = await searchParams;
  const tier = getTier(slug);
  if (!tier) notFound();

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
