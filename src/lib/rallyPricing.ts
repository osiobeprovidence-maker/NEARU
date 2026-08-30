/**
 * rallyPricing — single source of truth for how a RALLY's admission model is
 * shown to users. The data model stores `pricing` as one of three values:
 *
 *   - 'free'  → "FREE" badge
 *   - 'paid'  → charged admission, shows the amount (₦price)
 *   - 'none'  → "No admission fee" (no charge applied at all)
 *
 * Legacy posts carry only `isPaid`/`price`, so those are resolved as a
 * fallback for backwards compatibility. POST-type content never shows a badge.
 */

export type RallyPricing = 'free' | 'paid' | 'none';

interface PricingLike {
  type?: string;
  isPaid?: boolean;
  price?: number | null;
  pricing?: RallyPricing | null;
}

export interface RallyAccess {
  kind: 'free' | 'paid' | 'none';
  /** Human-readable badge text, e.g. "FREE", "₦5,000" or "No admission fee". */
  label: string;
  price?: number;
}

/** Resolve a rally/post's access model to a displayable badge. */
export function rallyAccess(rally: PricingLike): RallyAccess {
  const pricing =
    rally.pricing ?? (rally.isPaid ? 'paid' : 'none');

  if (pricing === 'paid') {
    const price =
      typeof rally.price === 'number' && rally.price > 0 ? rally.price : undefined;
    return {
      kind: 'paid',
      label: price != null ? `₦${price.toLocaleString('en-NG')}` : 'PAID',
      price,
    };
  }

  if (pricing === 'free') {
    return { kind: 'free', label: 'FREE' };
  }

  return { kind: 'none', label: 'No admission fee' };
}