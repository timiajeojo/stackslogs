"use strict";
// src/config/storefront.ts
// The curated storefront: only the accounts listed here are shown and sold.
// Titles are matched against YoungPG's catalog ignoring case, punctuation, emoji and spacing,
// so small formatting differences are fine. `displayName` renames an account for your customers.
// A category with `supplierCategory` shows everything from that YoungPG category
// except the titles in `exclude`.
Object.defineProperty(exports, "__esModule", { value: true });
exports.STOREFRONT = void 0;
var t = function (title, displayName) { return ({ title: title, displayName: displayName }); };
exports.STOREFRONT = [
    {
        key: "usa-facebook",
        name: "USA Facebook",
        items: [
            t("USA FACEBOOK HAVE ALREADY CREATE USA PAGE", "USA FACEBOOK HAVE ALREADY CREATE PAGE"),
            t("USA faceb00k ( 200 + FRIENDS)(real+fake friendss mix) YEAR 2024-2025 (have many friends from other countries)(Accounts have US profiles but most of the locations are not in the US", "USA facebook | 200 + FRIENDS | real+fake friendss mix | YEAR 2024-2025"),
            t("USA faceb00k (100+ FRIENDS)(real+fake friendss mix) YEAR 2024-2025 (have many friends from other countries)(Accounts have US profiles but most of the locations are not in the US)", "USA facebook | 100+ FRIENDS | real+fake friends mix | YEAR 2024-2025"),
            t("USA Facebook Accounts | 30 Friends | Outlook/Hotmail Verified | Avatar Added | Cookies & 2FA Included | USA IP", "USA Facebook Accounts | 30+ Friends | Cookies & 2FA Included"),
            t("Facebook Accounts | 30-60 Real Friends | Marketplace Enabled | Email Verified & Included | 2FA Included | With Profile Picture | Cookies Included | USA IP Registered"),
        ],
    },
    {
        key: "random-country-fb",
        name: "Random Country Facebook",
        items: [
            t("High Quality 🔥| Random fb | Has Switch Profile 🔂 || Created Year 2010- 2022", "High Quality 🔥| Random fb | Has Switch Profile 🔂 |Year 2010- 2022 |"),
            t("Facebook Accounts | 30–100 Real Friends | Outlook/Hotmail Email Verified & Included | Male & Female | 2FA Included | Profile Photo Uploaded | Random IP Registered"),
            t("Facebook Random Accounts | Profile Picture | 2FA Included | Hotmail/Outlook Verified | Random IP"),
        ],
    },
    {
        key: "asian-fb",
        name: "Asian Facebook",
        supplierCategory: "Asian Facebook",
        exclude: ["Facebook Random Accounts | Profile Picture | 2FA Included | Hotmail/Outlook Verified | Random IP"],
    },
    {
        key: "other-countries-fb",
        name: "Other Countries Facebook",
        items: [
            t("Facebook Accounts – Australia | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from AU IP"),
            t("Facebook Accounts – Japan | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from JP IP"),
            t("Facebook Accounts – Colombia | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | The Profiles Information is Partially Filled | Registered from CO IP"),
            t("Facebook Accounts – Italy | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from IT IP"),
            t("Facebook Accounts – Spain | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo partially filled | Registered from ES IP"),
            t("Facebook Accounts – France | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from FR IP"),
            t("Facebook Accounts – Canada | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile (Partially Filled) | Registered from CA IP"),
            t("Facebook Accounts – UK | Marketplace + 2FA Enabled | UK SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from UK IP"),
            t("Facebook Accounts – Germany | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from DE IP"),
            t("LOCAL FB||EASY LOGIN"),
            t("Facebook Accounts – New Zealand | Marketplace + 2FA Enabled | SMS & Email Verified | Email Included | Profile & Cover Photo | Registered from NZ IP"),
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
            t("Aged USA Facebook Accounts | 30+ Days | Real Mobile Verified | Marketplace Enabled | 2FA Secured | Hotmail Included"),
            t("Aged USA Female Profile Facebook Accounts 8 years Old | 2FA Turned On."),
            t("Facebook Accounts | 4-5 Months+ Aged | Marketplace + 2FA Enabled | USA SMS & Email Verified | Profile & Cover Photo Partially Filled | Registered from USA IP"),
        ],
    },
    {
        key: "tiktok",
        name: "TikTok",
        items: [
            t("USA TIKTOK- (Random follower 0-100)"),
            t("TikTok Accounts With 200+ REAL Followers Have Post | Countries: USA, Russia, Canada and more random countries"),
            t("TikTok Account | 500–600 Original Followers | 50–150 Original Likes | Random Country | Fresh Account | Email Verified | 2FA Included"),
            t("TikTok Accounts With 1K REAL Followers Have Post | Countries: USA, Russia, Canada and more random countries"),
            t("TikTok Accounts | USA | Outlook/Hotmail Verified | Mixed Gender | 2FA included | Partial Profiles | USA IP"),
        ],
    },
    {
        key: "instagram",
        name: "Instagram",
        items: [
            t("INSTAGRAM WITH 100-5OO FOLLOWER"),
            t("2024-25 🇺🇸 INSTAGRAM 50-100 FOLLOWERS (1-8POST)"),
            t("IG Accounts | Email address is included (outlook.com/hotmail.com) | Verified by SMS | 2FA Enabled | Account is empty (no posts, no profile picture etc.) | Registered from USA IPS."),
            t("IG Accounts | 500+ Followers | 2FA Enabled | Email Included | Best for OnlyFans | Partially Filled Profiles | Australia IP"),
            t("IG Accounts | 1000+ Followers | Profile Partially Filled | 2FA Added | Email Included (Hotmail/Outlook) | USA IP"),
        ],
    },
    {
        key: "twitter",
        name: "Twitter",
        items: [
            t("Twitter Accounts | Token Enabled | 2FA Included | Email Not Included | Mixed IP Registered | Fresh 2026"),
            t("Twitter (X) Accounts 2006-2016 | Hotmail Access | 2FA | Auth Token | 0-5 Followers,Account Format User | Password | 2FA | Auth Token | Mail | PassMail | Refresh Token | Client ID | Email Recovery | Cookies"),
            t("Twitter Accounts | Auto-Reg | 50+ Followers | Email Included | Avatar & Header | Token | 2FA (Optional)"),
            t("Twitter Accounts | Aged 2023–2024 | 100–200+ Followers | Outlook/Hotmail Email Included | Male & Female | 2FA Included | Token Included"),
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
            t("Hotmail/Outlook Accounts | Email@outlook.com accounts provided | Male or female | POP3, SMTP, IMAP activated"),
            t("Rambler Accounts | Male or female | Accounts might be used for some of the services | POP3, SMTP, IMAP activated"),
            t("Mail.com Accounts| One of the fastest, and safest emails service, very easy to use! To login visit www.mail.com"),
            t("GMail Accounts | 2FA Included | SMS Verified | App Password Enabled | Mixed Ip Created"),
        ],
    },
    {
        key: "snapchat",
        name: "Snapchat",
        items: [
            t("UK 🇬🇧 SNAPCHAT"),
            t("Snapchat.com Accounts | Verified by gmx mail (email included in the set). New Accounts, Sex can be both male and female. The accounts are registered with USA IPs.", "USA Snapchat"),
            t("Snapchat Accounts | Fresh/New | 2FA Enabled"),
        ],
    },
    {
        key: "texting-apps",
        name: "Texting Apps",
        items: [
            t("Textplus Microsoft | Tap sign in|Tap others|Select sign in with Microsoft Note: (OVPNSPIDER VPN CONNECT JAPAN)", "Textplus Microsoft"),
            t("New Google Voice (GV) Account | Fully Activated | USA Number | Recovary Or 2FA Included | Fresh Account", "New Google Voice"),
            t("TextNow usa fresh account"),
        ],
    },
    {
        key: "threads",
        name: "Threads",
        items: [
            t("Threads Accounts | Email included (outlook.com/hotmail.com) | Verified by SMS | 2FA Enabled | Account is empty | Registered from USA IPS.", "USA Threads Account"),
            t("GERMANY IP 1-MONTH ACCOUNT (GERMAN NAME, PHOTO & 2FA KEY)", "Germany Threads Account"),
            t("Threads Accounts | Email included (outlook.com/hotmail.com) | Verified by SMS | 2FA Enabled | Profile is Partially Filled | Registered from MIX IPS.", "Random Threads Account"),
        ],
    },
    {
        key: "dating-sites",
        name: "Dating Sites",
        items: [
            t("TAGGED"),
            t("Old Aged Grindr Profiles | Secure Login | Email Verified | Ready Access"),
            t("Topface | Accounts | Gender: Male | dating site Topface.com"),
            t("Topface | Accounts | Gender: Female | dating site Topface.com"),
        ],
    },
    {
        key: "reddit",
        name: "Reddit",
        items: [
            t("REDDIT MONTHS OLD"),
            t("🇺🇸 USA Empty Reddit | username & password, Required use VPN"),
            t("Reddit Accounts | Registered 2024 | Aged Accounts | Email Not Verified | Registered from USA IPs"),
            t("Reddit Accounts | Registered 2025 | Aged Accounts | Email Not Included | Registered from EU IPs"),
            t("Reddit Accounts | Registered 2022 | Aged Accounts | Email Not Verified | Registered from EU IPs"),
        ],
    },
    {
        key: "streaming-sites",
        name: "Streaming Sites",
        items: [
            t("All in one, contains Netflix, Showmax, prime video etc… once purchased copy and paste the log on your browser and follow instructions"),
            t("Netflix | device only | don’t edit anything | one device"),
            t("Spotify Premium | Personal Account of your | 1 Month | Works in Any Country | Manual Delivery via Live Chat"),
        ],
    },
    {
        key: "others",
        name: "Others",
        items: [
            t("Quora Accounts | Premium Quality | Email Verified | Full Email Access | Random country-[ America-Europe-Australia-South America-Asia ]"),
            t("Linkedin.com Accounts | Email included (Outlook/Hotmail.com). Male or female Accounts are partially filled. Registered from USA."),
            t("Premium Twitch.tv Accounts | Created 2025 - 2026 | Login & Password | Email Not Confirmed | USA Registered IP | Ready to Use"),
            t("PINTEREST | Account registration date is 2020 to 2023. | Mail included. Mail Access Via { Rambler.ru }"),
            t("CGPT Accounts | Ready to Use | Verified by email@outlook.com/hotmail.com (included in the set) | The accounts are registered with USA IP."),
            t("2023 USA 🇺🇸 DISCORD FULL ACCESS discord:pass:mail:mailpass"),
        ],
    },
];
