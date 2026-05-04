/**
 * How each order amount is split between Ma-bei (platform fee) and the supermarket.
 * ("Ma-bei" means many prices.) The customer pays `customerTotalKes` only — the fee is
 * deducted from that total internally (not an extra line item for the shopper).
 *
 * Configure via NEXT_PUBLIC_* so checkout UI and server agree without an extra round-trip.
 */

export type OrderMoneySplit = {
  /** What the customer pays (same as basket total at checkout). */
  customerTotalKes: number;
  /** Ma-bei (platform) commission (KSh, integer). */
  platformFeeKes: number;
  /** Remittance due to the supermarket (KSh, integer). */
  supermarketPayoutKes: number;
  /** Effective percentage read from env (for display). */
  feePercent: number;
  /** Fixed fee from env (for display). */
  feeFixedKes: number;
};

function readFeePercent(): number {
  const raw = process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ?? "2.5";
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return 2.5;
  return Math.min(n, 100);
}

function readFeeFixed(): number {
  const raw = process.env.NEXT_PUBLIC_PLATFORM_FEE_FIXED_KES ?? "0";
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** True = redirect to Paystack / STK as today. False = place order without charging (default). */
export function checkoutRequiresOnlinePayment(): boolean {
  return process.env.NEXT_PUBLIC_CHECKOUT_REQUIRE_PAYMENT === "true";
}

/**
 * @param customerTotalKes Basket total in KSh (what the customer pays).
 */
export function computeOrderMoneySplit(
  customerTotalKes: number,
): OrderMoneySplit {
  const feePercent = readFeePercent();
  const feeFixedKes = readFeeFixed();
  const total = Math.max(0, Math.round(customerTotalKes));

  if (total === 0) {
    return {
      customerTotalKes: 0,
      platformFeeKes: 0,
      supermarketPayoutKes: 0,
      feePercent,
      feeFixedKes,
    };
  }

  const percentPart = Math.round((total * feePercent) / 100);
  let platformFeeKes = percentPart + feeFixedKes;
  platformFeeKes = Math.min(total, Math.max(0, platformFeeKes));
  const supermarketPayoutKes = total - platformFeeKes;

  return {
    customerTotalKes: total,
    platformFeeKes,
    supermarketPayoutKes,
    feePercent,
    feeFixedKes,
  };
}
