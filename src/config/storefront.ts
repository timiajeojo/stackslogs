// src/config/storefront.ts
//
// Curated, display-only storefront configuration.
// Add a product only after confirming that it is a legitimate product/service
// and that the supplier is authorised to provide it.
//
// Do not add social-media profiles, email accounts, messaging accounts,
// streaming accounts, login bundles, cookies, passwords, 2FA codes, auth tokens,
// recovery details, or other account credentials.
//
// The display-only catalogue controller requires:
//   - enabled: true
//   - an explicit items array
//   - each item title to match exactly one YoungPG supplier listing
//
// Supplier category-wide imports are intentionally not supported.

export type StorefrontItem = {
  /** Exact YoungPG listing title. Keep supplier wording unchanged. */
  title: string;
};

export type StorefrontCategory = {
  key: string;
  name: string;
  enabled: boolean;
  /** Explicit allowlist. Do not replace with automatic category imports. */
  items: StorefrontItem[];
};

/**
 * No products are enabled by default.
 *
 * Add only individually reviewed, permitted products. For example, a
 * legitimate standalone digital service or software licence may be listed
 * here after its authorisation and fulfilment method have been verified.
 */
export const STOREFRONT: StorefrontCategory[] = [];
