// Shared by server and client code — keep this free of Node-only imports.

export const PAYMENT_METHODS = ["paystack", "pod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

/** Lifecycle of a pay-on-delivery order; NULL for Paystack orders. */
export const POD_STATUSES = ["pending", "confirmed", "delivered", "cancelled"] as const;
export type PodStatus = (typeof POD_STATUSES)[number];

export function isPodStatus(value: unknown): value is PodStatus {
  return POD_STATUSES.includes(value as PodStatus);
}

export const POD_STATUS_LABELS: Record<PodStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  delivered: "Delivered & paid",
  cancelled: "Cancelled",
};
