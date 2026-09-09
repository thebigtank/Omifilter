import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTier, titleCase } from "../../tiers";
import CheckoutClient from "../CheckoutClient";
import "../checkout.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tier = getTier(slug);
  if (!tier) {
    return { title: "Checkout — OmiFilter" };
  }
  return {
    title: `Checkout — ${titleCase(tier.name)} | OmiFilter`,
    description: `Order the ${titleCase(tier.name)} and pay securely with Paystack. Clean water from your own tap, delivered across Nigeria.`,
  };
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  const tier = getTier(slug);
  if (!tier) notFound();

  return <CheckoutClient tier={tier} />;
}
