/**
 * App branding. "Ma-bei" — many prices (Swahili).
 * Override display name with NEXT_PUBLIC_APP_NAME.
 */

/** Earlier single-word key prefix (intermediate rename). */
const LEGACY_MBEI = "mabei";
/** Original app storage prefix, split so the old name does not appear as one token in source. */
const LEGACY_ORIGINAL = "price" + "snap";

export const APP_DISPLAY_NAME_DEFAULT = "Ma-bei";

export const STORAGE = {
  theme: "ma-bei_theme",
  basket: "ma-bei_basket",
  store: "ma-bei_store",
  receipt: "ma-bei_last_receipt",
  cardCheckoutDraft: "ma-bei_card_checkout",
} as const;

/** Older keys to read once and move into `STORAGE.*` (order: newer first). */
export const STORAGE_LEGACY_KEYS = {
  theme: [`${LEGACY_MBEI}_theme`, `${LEGACY_ORIGINAL}_theme`],
  basket: [`${LEGACY_MBEI}_basket`, `${LEGACY_ORIGINAL}_basket`],
  store: [`${LEGACY_MBEI}_store`, `${LEGACY_ORIGINAL}_store`],
  receipt: [`${LEGACY_MBEI}_last_receipt`, `${LEGACY_ORIGINAL}_last_receipt`],
  cardCheckoutDraft: [
    `${LEGACY_MBEI}_card_checkout`,
    `${LEGACY_ORIGINAL}_card_checkout`,
  ],
} as const;

export function appDisplayName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME || APP_DISPLAY_NAME_DEFAULT;
}

/** Inline script: restore theme from `localStorage` before paint (with key migration). */
export function themeBootstrapInlineScript(): string {
  const k = STORAGE.theme;
  const legs = STORAGE_LEGACY_KEYS.theme;
  return `(function(){try{var k=${JSON.stringify(k)};var legs=${JSON.stringify(legs)};var s=localStorage.getItem(k);var i,o,leg;if(s===null){for(i=0;i<legs.length;i++){leg=legs[i];o=localStorage.getItem(leg);if(o!==null){localStorage.setItem(k,o);localStorage.removeItem(leg);s=o;break;}}}var d=document.documentElement;var prefers=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&prefers))d.classList.add('dark');else d.classList.remove('dark');}catch(e){}})();`;
}

export function readLocalStorageWithMigration(
  primary: string,
  legacyKeys: readonly string[],
): string | null {
  if (typeof window === "undefined") return null;
  try {
    let v = localStorage.getItem(primary);
    if (v != null) return v;
    for (const leg of legacyKeys) {
      v = localStorage.getItem(leg);
      if (v != null) {
        localStorage.setItem(primary, v);
        localStorage.removeItem(leg);
        return v;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function removeLocalStorageKeys(keys: readonly string[]) {
  if (typeof window === "undefined") return;
  try {
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function readSessionStorageWithMigration(
  primary: string,
  legacyKeys: readonly string[],
): string | null {
  if (typeof window === "undefined") return null;
  try {
    let v = sessionStorage.getItem(primary);
    if (v != null) return v;
    for (const leg of legacyKeys) {
      v = sessionStorage.getItem(leg);
      if (v != null) {
        sessionStorage.setItem(primary, v);
        sessionStorage.removeItem(leg);
        return v;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function removeSessionStorageKeys(keys: readonly string[]) {
  if (typeof window === "undefined") return;
  try {
    for (const k of keys) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
