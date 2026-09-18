export type Tier = {
  slug: string;
  tier: string;
  flag: string;
  name: string;
  price: string;
  units: string;
  note: string;
  feature: boolean;
  /** Paystack charges in kobo (smallest unit), so this is ₦ × 100. */
  priceKobo: number;
};

export const tiers: Tier[] = [
  {
    slug: "single",
    tier: "Tier 01",
    flag: "OMW·0421",
    name: "Starter",
    price: "₦45,000",
    units: "1 filter unit",
    note: "Kitchen tap protection.",
    feature: false,
    priceKobo: 4500000,
  },
  {
    slug: "family",
    tier: "Tier 02",
    flag: "Most popular",
    name: "Family pack",
    price: "₦105,000",
    units: "2 filter units",
    note: "Kitchen and bathroom covered.",
    feature: true,
    priceKobo: 10500000,
  },
  {
    slug: "full-home",
    tier: "Tier 03",
    flag: "OMW·0421",
    name: "Premium",
    price: "₦170,000",
    units: "3 filter units",
    note: "Get 1 free — every tap covered.",
    feature: false,
    priceKobo: 17000000,
  },
];

export function getTier(slug: string): Tier | undefined {
  return tiers.find((t) => t.slug === slug);
}

/** "Full home" -> "Full Home" — for button labels and page headings. */
export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}
