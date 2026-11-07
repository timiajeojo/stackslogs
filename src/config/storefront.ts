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
      t("USA faceb00k ( 200 + FRIENDS)(real+fake friendss mix) YEAR 2024-2025 (have many friends from other countries)(Accounts have US profiles but most of the locations are not in the US", "USA Facebook | 200+ Friends (Real + Fake Mix) | Year 2024-2025"),
      t("USA faceb00k (100+ FRIENDS)(real+fake friendss mix) YEAR 2024-2025 (have many friends from other countries)(Accounts have US profiles but most of the locations are not in the US)", "USA Facebook | 100+ Friends (Real + Fake Mix) | Year 2024-2025"),
      t("USA Facebook Accounts | 30 Friends | Outlook/Hotmail Verified | Avatar Added | Cookies & 2FA Included | USA IP", "USA Facebook | 30 Friends | Cookies & 2FA Included"),
      t("Facebook Accounts | 30-60 Real Friends | Marketplace Enabled | Email Verified & Included | 2FA Included | With Profile Picture | Cookies Included | USA IP Registered", "USA Facebook | 30-60 Real Friends | Marketplace Enabled"),
    ],
  },
  {
    key: "random-country-fb",
    name: "Random Country FB",
    items: [
      t("High Quality 🔥| Random fb | Has Switch Profile 🔂 || Created Year 2010- 2022", "High Quality 🔥 | Random Facebook | Has Switch Profile 🔂 | Year 2010-2022"),
      t("Facebook Accounts | 30–100 Real Friends | Outlook/Hotmail Email Verified & Included | Male & Female | 2FA Included | Profile Photo Uploaded | Random IP Registered", "Random Facebook | 30–100 Real Friends | Mail Included"),
      t("Facebook Random Accounts | Profile Picture | 2FA Included | Hotmail/Outlook Verified | Random IP", "Facebook Random Account | Hotmail/Outlook Verified | Random IP"),
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
      t("Aged USA Facebook Accounts | 30+ Days | Real Mobile Verified | Marketplace Enabled | 2FA Secured | Hotmail Included", "Aged USA Facebook Account | 30+ Days | Marketplace Enabled"),
      t("Aged USA Female Profile Facebook Accounts 8 years Old | 2FA Turned On."),
      t("Facebook Accounts | 4-5 Months+ Aged | Marketplace + 2FA Enabled | USA SMS & Email Verified | Profile & Cover Photo Partially Filled | Registered from USA IP", "Aged USA Facebook Account | 4-5 Months+ Aged | Marketplace + 2FA Enabled"),
    ],
  },
  {
    key: "tiktok",
    name: "TikTok",
    items: [
      t("USA TIKTOK- (Random follower 0-100)", "USA TikTok | 0-100 Followers"),
      t("TikTok Accounts With 200+ REAL Followers Have Post | Countries: USA, Russia, Canada and more random countries", "TikTok | 200+ Real Followers"),
      t("TikTok Account | 500–600 Original Followers | 50–150 Original Likes | Random Country | Fresh Account | Email Verified | 2FA Included", "TikTok | 500–600 Original Followers"),
      t("TikTok Accounts With 1K REAL Followers Have Post | Countries: USA, Russia, Canada and more random countries", "TikTok | 1000 Real Followers"),
      t("TikTok Accounts | USA | Outlook/Hotmail Verified | Mixed Gender | 2FA included | Partial Profiles | USA IP", "Empty USA TikTok"),
    ],
  },
  {
    key: "instagram",
    name: "Instagram",
    items: [
      t("INSTAGRAM WITH 100-5OO FOLLOWER", "Instagram | 100-500 Followers"),
      t("2024-25 🇺🇸 INSTAGRAM 50-100 FOLLOWERS (1-8POST)", "2024-25 USA 🇺🇸 Instagram | 50-100 Followers | 1-8 Posts"),
      t("IG Accounts | Email address is included (outlook.com/hotmail.com) | Verified by SMS | 2FA Enabled | Account is empty (no posts, no profile picture etc.) | Registered from USA IPS.", "Empty USA Instagram"),
      t("IG Accounts | 500+ Followers | 2FA Enabled | Email Included | Best for OnlyFans | Partially Filled Profiles | Australia IP", "Instagram | 500+ Followers"),
      t("IG Accounts | 1000+ Followers | Profile Partially Filled | 2FA Added | Email Included (Hotmail/Outlook) | USA IP", "Instagram | 1000+ Followers"),
    ],
  },
  {
    key: "twitter",
    name: "Twitter",
    items: [
      t("Twitter Accounts | Token Enabled | 2FA Included | Email Not Included | Mixed IP Registered | Fresh 2026", "Empty Twitter Account"),
      t("Twitter (X) Accounts 2006-2016 | Hotmail Access | 2FA | Auth Token | 0-5 Followers,Account Format User | Password | 2FA | Auth Token | Mail | PassMail | Refresh Token | Client ID | Email Recovery | Cookies", "Twitter | 2006-2016 | 0-5 Followers"),
      t("Twitter Accounts | Auto-Reg | 50+ Followers | Email Included | Avatar & Header | Token | 2FA (Optional)", "Twitter | 50+ Followers"),
      t("Twitter Accounts | Aged 2023–2024 | 100–200+ Followers | Outlook/Hotmail Email Included | Male & Female | 2FA Included | Token Included", "Twitter | 2023–2024 | 100–200+ Followers"),
    ],
  },
  {
    key: "vpn",
    name: "VPN",
    items: [
      t("PIA VPN 1 MONTH"),
      t("Express vpn | 1-12 months (one user) don't edit log |", "Express VPN | 1-12 Months (One User) | Don't Edit Log"),
      t("HMA vpn | 1-12 months (one user) don't edit log |", "HMA VPN | 1-12 Months (One User) | Don't Edit Log"),
    ],
  },
  {
    key: "email",
    name: "Email",
    items: [
      t("Hotmail/Outlook Accounts | Email@outlook.com accounts provided | Male or female | POP3, SMTP, IMAP activated", "Hotmail/Outlook"),
      t("Rambler Accounts | Male or female | Accounts might be used for some of the services | POP3, SMTP, IMAP activated", "Rambler"),
      t("Mail.com Accounts| One of the fastest, and safest emails service, very easy to use! To login visit www.mail.com", "Mail.com"),
      t("GMail Accounts | 2FA Included | SMS Verified | App Password Enabled | Mixed Ip Created", "Gmail"),
    ],
  },
  {
    key: "snapchat",
    name: "Snapchat",
    items: [
      t("UK 🇬🇧 SNAPCHAT"),
      t("Snapchat.com Accounts | Verified by gmx mail (email included in the set). New Accounts, Sex can be both male and female. The accounts are registered with USA IPs.", "USA Snapchat | Mail Included"),
      t("Snapchat Accounts | Fresh/New | 2FA Enabled", "Snapchat | Fresh/New"),
    ],
  },
  {
    key: "texting-apps",
    name: "Texting Apps",
    items: [
      t("Textplus Microsoft | Tap sign in|Tap others|Select sign in with Microsoft Note: (OVPNSPIDER VPN CONNECT JAPAN)", "Textplus Microsoft"),
      t("New Google Voice (GV) Account | Fully Activated | USA Number | Recovary Or 2FA Included | Fresh Account", "New Google Voice"),
      t("Textnow.com USA Fresh Account | Phone Login", "TextNow | Phone Login"),
    ],
  },
  {
    key: "threads",
    name: "Threads",
    items: [
      t("Threads Accounts | Email included (outlook.com/hotmail.com) | Verified by SMS | 2FA Enabled | Account is empty | Registered from USA IPS.", "USA Threads"),
      t("GERMANY IP 1-MONTH ACCOUNT (GERMAN NAME, PHOTO & 2FA KEY)", "Germany Threads"),
      t("Threads Accounts | Email included (outlook.com/hotmail.com) | Verified by SMS | 2FA Enabled | Profile is Partially Filled | Registered from MIX IPS.", "Random Threads"),
    ],
  },
  {
    key: "dating-sites",
    name: "Dating Sites",
    items: [
      t("TAGGED"),
      t("Old Aged Grindr Profiles | Secure Login | Email Verified | Ready Access", "Aged Grindr"),
      t("Topface | Accounts | Gender: Male | dating site Topface.com", "Topface | Male"),
      t("Topface | Accounts | Gender: Female | dating site Topface.com", "Topface | Female"),
    ],
  },
  {
    key: "reddit",
    name: "Reddit",
    items: [
      t("REDDIT MONTHS OLD"),
      t("🇺🇸 USA Empty Reddit | username & password, Required use VPN"),
      t("Reddit Accounts | Registered 2024 | Aged Accounts | Email Not Verified | Registered from USA IPs", "Reddit | 2024 | Email Not Verified"),
      t("Reddit Accounts | Registered 2025 | Aged Accounts | Email Not Included | Registered from EU IPs", "Reddit | 2025 | Email Not Included"),
      t("Reddit Accounts | Registered 2022 | Aged Accounts | Email Not Verified | Registered from EU IPs", "Reddit | 2022 | Email Not Verified"),
    ],
  },
  {
    key: "streaming-sites",
    name: "Streaming Sites",
    items: [
      t("All in one, contains Netflix, Showmax, prime video etc… once purchased copy and paste the log on your browser and follow instructions", "All-in-One | Contains Netflix, Showmax, Prime Video, etc."),
      t("Netflix | device only | don’t edit anything | one device", "Netflix | one device"),
      t("Spotify Premium | Personal Account of your | 1 Month | Works in Any Country | Manual Delivery via Live Chat", "Spotify Premium | 1 Month"),
    ],
  },
  {
    key: "others",
    name: "Others",
    items: [
      t("Quora Accounts | Premium Quality | Email Verified | Full Email Access | Random country-[ America-Europe-Australia-South America-Asia ]", "Quora Accounts | Email Verified"),
      t("Linkedin.com Accounts | Email included (Outlook/Hotmail.com). Male or female Accounts are", "LinkedIn | Email Included"),
      t("Premium Twitch.tv Accounts | Created 2025 - 2026 | Login & Password | Email Not Confirmed | USA Registered IP | Ready to Use", "Twitch | 2025-2026"),
      t("PINTEREST | Account registration date is 2020 to 2023. | Mail included. Mail Access Via { Rambler.ru }", "Pinterest | 2020 to 2023 | Mail Included"),
      t("CGPT Accounts | Ready to Use | Verified by email@outlook.com/hotmail.com (included in the set) | The accounts are registered with USA IP.", "CGPT | Email Verified"),
      t("2023 USA 🇺🇸 DISCORD FULL ACCESS discord:pass:mail:mailpass", "USA 🇺🇸 Discord | 2023"),
    ],
  },
];
