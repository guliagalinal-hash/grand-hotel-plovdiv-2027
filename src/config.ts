// ─────────────────────────────────────────────────────────────
//  SITE CONFIGURATION — edit this file before launch.
//  No secrets belong here (this file is public). API keys live only in Cloudflare env variables.
// ─────────────────────────────────────────────────────────────

export interface SellerInfo {
  /** Legal name of the tour operator / seller (legal block only, never in the advertising part) */
  name: string | null;
  address: string | null;
  registrationNo: string | null;
  /** Tour-operator licence / insurance details, if legally required */
  licenseInfo: string | null;
  /** Full URL of the privacy policy / personal-data processing terms */
  privacyUrl: string | null;
}

/** Turnstile PUBLIC site key is injected at build time from the TURNSTILE_SITE_KEY variable (see README). */
declare const __TURNSTILE_SITE_KEY__: string;

export const config = {
  /** Planned public address (canonical/hreflang/Open Graph only). Not live until you publish. */
  siteUrl: 'https://newyear.rootsandroads.com',

  /** Cloudflare Pages Function that receives the inquiry form (see functions/api/inquiry.ts). */
  formEndpoint: '/api/inquiry',

  /** Cloudflare Turnstile public site key. Empty = form runs in "not connected" mode and sends nothing. */
  turnstileSiteKey: (typeof __TURNSTILE_SITE_KEY__ !== 'undefined' ? __TURNSTILE_SITE_KEY__ : '') as string,

  /** Contact details given by the owner (NOT the hotel's contacts). */
  contact: {
    phoneDisplay: '+359 89 539 6896',
    phoneRaw: '+359895396896', // used for the tel: link
    email: 'info@wordofethnic.com',
    telegramUrl: 'https://t.me/globacheva',
  },

  /** Legal data of the seller. Empty values are simply not shown on the page. */
  seller: {
    name: null,
    address: null,
    registrationNo: null,
    licenseInfo: null,
    privacyUrl: null,
  } as SellerInfo,
};

