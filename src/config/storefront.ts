// src/config/storefront.ts
// The curated storefront: only the accounts listed here are shown and sold.
// Titles are matched against YoungPG's catalog ignoring case, punctuation, emoji and spacing,
// so small formatting differences are fine. `displayName` renames an account for your customers.
// A category with `supplierCategory` shows everything from that YoungPG category
// except the titles in `exclude`.

export type StorefrontItem = { title: string; displayName?: string };

export type StorefrontCategory =
  | { key: string; name: string; items: StorefrontItem[] }
  | { key: string; name: string; supplierCategory: string | string[]; exclude: string[] };

const t = (title: string, displayName?: string): StorefrontItem => ({ title, displayName });

export const STOREFRONT: StorefrontCategory[] = [
  {
    key: "usa-facebook",
    name: "USA Facebook",
    items: [
      t("USA FACEBOOK HAVE ALREADY CREATE USA PAGE"),
      t("USA facebook | 200 + FRIENDS (real+fake friendss mix) | YEAR 2024-2025 "),
      t("USA faceb00k | 100+ FRIENDS (real+fake friendss mix) | YEAR 2024-2025 "),
      t("USA Facebook | 30 Friends | Cookies & 2FA Included "),
      t("USA Facebook | 30-60 Real Friends | Marketplace Enabled "),
    ],
  },
  {
    key: "random-country-fb",
    name: "Random Country FB",
    items: [
      t("High Quality 🔥| Random fb | Has Switch Profile 🔂 | Year 2010- 2022"),
      t("Random Facebook | 30–100 Real Friends |Mail Included "),
      t("Facebook Random Account | Hotmail/Outlook Verified | Random IP"),
    ],
  },
  {
    key: "asian-fb",
    name: "Asian Facebook",
    supplierCategory: ["Asian Fb", "Asian Facebook"],
    exclude: ["Facebook Random Accounts | Profile Picture | 2FA Included | Hotmail/Outlook Verified | Random IP"],
  },
  {
    key: "other-countries-fb",
    name: "Other Countries Facebook",
    items: [
      t("Facebook Accounts – Australia | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from AU IP"),
      t("Facebook Accounts – Japan | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included"),
      t("Facebook Accounts – Colombia | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | The Profiles Information is Partially Filled | Registered from CO IP"),
      t("Facebook Accounts – Italy | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from IT IP"),
      t("Facebook Accounts – Spain | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo partially filled | Registered from ES IP"),
      t("Facebook Accounts – France | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from FR IP"),
      t("Facebook Accounts – Canada | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile (Partially Filled) | Registered from CA IP"),
      t("Facebook Accounts – UK | Marketplace + 2FA Enabled | UK SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from UK IP"),
      t("Facebook Accounts – Germany | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included"),
      t("LOCAL FB||EASY LOGIN"),
      t("Facebook Accounts – New Zealand | Marketplace + 2FA Enabled | SMS & Email Verified | Email"),
      t("Facebook Accounts – Vietnam | Marketplace + 2FA Enabled | SMS & Email Verified | Email Access not Included | Profile & Cover Photo | Registered from VN IP"),
      t("Facebook Accounts – Philippines | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | The Profiles Information is Partially Filled | Registered from PHL IP"),
      t("Facebook Accounts – Norway | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from NO IP"),
      t("Facebook Accounts – Romania | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from RO IP"),
      t("Facebook Accounts – Portugal | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from PT IP"),
      t("Facebook Accounts – Indonesia | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Cookies Included | Registered from IDN IP"),
      t("Facebook Accounts – Finland | Marketplace Enabled | SMS & Email Verified | 2FA Enabled | Email Included | Profile & Cover Photo | Registered from FI IP"),
      t("Facebook Accounts – UAE | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from UAE IP"),
      t("Facebook Accounts –Greece | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from GR IP"),
    ],
  },
  {
    key: "aged-facebook",
    name: "Aged Facebook",
    items: [
      t("Aged USA Facebook Account | 30+ Days | Marketplace Enabled "),
      t("Aged USA Female Profile Facebook Accounts 8 years Old | 2FA Turned On."),
      t("Aged USA Facebook Account | 4-5 Months+ Aged | Marketplace + 2FA Enabled "),
    ],
  },
  {
    key: "tiktok",
    name: "TikTok",
    items: [
      t("USA TIKTOK | 0-100 followers "),
      t("TikTok | 200+ REAL Followers"),
      t("TikTok | 500–600 Original Followers "),
      t("TikTok | 1000 REAL Followers "),
      t("Empty USA TikTok "),
    ],
  },
  {
    key: "instagram",
    name: "Instagram",
    items: [
      t("INSTAGRAM | 100-5OO FOLLOWERS"),
      t("2024-25 USA🇺🇸 INSTAGRAM 50-100 FOLLOWERS (1-8POST)"),
      t("Empty USA Instagram"),
      t("Instagram | 500+ Followers "),
      t("Instagram | 1000+ Followers "),
    ],
  },
  {
    key: "twitter",
    name: "Twitter",
    items: [
      t("Empty Twitter Account "),
      t("Twitter 2006-2016 | 0-5 Followers "),
      t("Twitter  | 50+ Followers "),
      t("Twitter  | 2023–2024 | 100–200+ Followers "),
    ],
  },
  {
    key: "vpn",
    name: "VPN",
    items: [
      t("PIA VPN 1 MONTH"),
      t("Express vpn | 1-12 months (one user) don't edit log |"),
      t("HMA vpn | 1-12 months (one user) don't edit log |"),
    ],
  },
  {
    key: "email",
    name: "Email",
    items: [
      t("Hotmail/Outlook "),
      t("Rambler  "),
      t("Mail.com "),
      t("GMail "),
    ],
  },
  {
    key: "snapchat",
    name: "Snapchat",
    items: [
      t("UK 🇬🇧 SNAPCHAT"),
      t("USA Snapchat| Mail Included ")
      t("Snapchat | Fresh/New "),
    ],
  },
  {
    key: "texting-apps",
    name: "Texting Apps",
    items: [
      t("Textplus Microsoft ")
      t("New Google Voice ")
      t("Textnow | Phone Login"),
    ],
  },
  {
    key: "threads",
    name: "Threads",
    items: [
      t("USA Threads ")
      t("Germany Threads "),
      t("Random Threads "),
    ],
  },
  {
    key: "dating-sites",
    name: "Dating Sites",
    items: [
      t("TAGGED"),
      t("Aged Grindr "),
      t("Topface | Male "),
      t("Topface | Female "),
    ],
  },
  {
    key: "reddit",
    name: "Reddit",
    items: [
      t("REDDIT MONTHS OLD"),
      t("🇺🇸 USA Empty Reddit | username & password, Required use VPN"),
      t("Reddit | 2024 | Email Not Verified "),
      t("Reddit | 2025 | Email Not Included"),
      t("Reddit | 2022 | Email Not Verified"),
    ],
  },
  {
    key: "streaming-sites",
    name: "Streaming Sites",
    items: [
      t("All in one, contains Netflix, Showmax, prime video etc… "),
      t("Netflix | one device"),
      t("Spotify Premium | 1 Month "),
    ],
  },
  {
    key: "others",
    name: "Others",
    items: [
      t("Quora Accounts | Email Verified"),
      t("Linkedin | Email included"),
      t("Twitch | 2025 - 2026"),
      t("PINTEREST | 2020 to 2023. | Mail included"),
      t("CGPT | Email Verified"),
      t("USA 🇺🇸 DISCORD | 2023 "),
    ],
  },
];
