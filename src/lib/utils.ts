import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The interest tags that are allowed to appear on a user's public profile.
 * Honors the master `showInterests` toggle, prefers the explicit public list,
 * and never exposes more than the max 3.
 */
export function getPublicInterests(
  user?: { publicInterests?: string[]; interests?: string[]; showInterests?: boolean } | null
): string[] {
  if (!user || user.showInterests === false) return [];
  const pool = user.publicInterests && user.publicInterests.length > 0
    ? user.publicInterests
    : (user.interests || []);
  return pool.slice(0, 3).filter(Boolean);
}
