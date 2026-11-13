"use client";

import { useEffect } from "react";
import Link from "next/link";
import { naira, Product } from "../lib/store";

// Font Awesome Free (loaded from a CDN, so nothing to install).
const FA_URL = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";

function useFontAwesome() {
  useEffect(() => {
    if (document.getElementById("fa-css")) return;
    const link = document.createElement("link");
    link.id = "fa-css";
    link.rel = "stylesheet";
    link.href = FA_URL;
    document.head.appendChild(link);
  }, []);
}

// bg = tile color, cls = Font Awesome class, fg = icon color (white unless the tile is light)
// img = a logo file in /public (used instead of the Font Awesome icon); pad = space around a logo that isn't full-bleed
type Icon = { bg: string; cls: string; fg?: string; img?: string; pad?: number };

const ICONS: Record<string, Icon> = {
  facebook: { bg: "#1877f2", cls: "fa-brands fa-facebook-f" },
  instagram: { bg: "linear-gradient(45deg,#f9a03f,#e1306c 50%,#833ab4)", cls: "fa-brands fa-instagram" },
  tiktok: { bg: "#111111", cls: "fa-brands fa-tiktok" },
  twitter: { bg: "#111111", cls: "fa-brands fa-x-twitter" },
  snapchat: { bg: "#fffc00", cls: "fa-brands fa-snapchat", fg: "#111111" },
  reddit: { bg: "#ff4500", cls: "fa-brands fa-reddit-alien" },
  linkedin: { bg: "#0a66c2", cls: "fa-brands fa-linkedin-in" },
  twitch: { bg: "#9146ff", cls: "fa-brands fa-twitch" },
  pinterest: { bg: "#e60023", cls: "fa-brands fa-pinterest-p" },
  discord: { bg: "#5865f2", cls: "fa-brands fa-discord" },
  spotify: { bg: "#1db954", cls: "fa-brands fa-spotify" },
  quora: { bg: "#b92b27", cls: "fa-brands fa-quora" },
  chatgpt: { bg: "#10a37f", cls: "fa-solid fa-robot" },
  email: { bg: "#f59e0b", cls: "fa-solid fa-envelope" },
  hotmail: { bg: "#f59e0b", cls: "", img: "/icons/email/hotmail.png" },
  gmail: { bg: "#f59e0b", cls: "", img: "/icons/email/gmail.png" },
  rumbler: { bg: "#f59e0b", cls: "", img: "/icons/email/rumbler.png" },
  mail: { bg: "#f59e0b", cls: "", img: "/icons/email/mail.png" },
  vpn: { bg: "#16a34a", cls: "fa-solid fa-shield-halved" },
  expressvpn: { bg: "#da3940", cls: "", img: "/icons/vpn/expressvpn.png" },
  surfshark: { bg: "#ffffff", cls: "", img: "/icons/vpn/surfshark.png" },
  pia: { bg: "#ffffff", cls: "", img: "/icons/vpn/pia.jpg", pad: 4 },
  nordvpn: { bg: "#4687ff", cls: "", img: "/icons/vpn/nordvpn.png" },
  hma: { bg: "#0057a8", cls: "", img: "/icons/vpn/hma.png" },
  texting: { bg: "#0ea5e9", cls: "fa-solid fa-comment" },
  textnow: { bg: "#0ea5e9", cls: "", img: "/icons/texting/textnow.png" },
  textplus: { bg: "#0ea5e9", cls: "", img: "/icons/texting/textplus.png" },
  googlevoice: { bg: "#0ea5e9", cls: "", img: "/icons/texting/googlevoice.png" },
  threads: { bg: "#111111", cls: "fa-brands fa-threads" },
  dating: { bg: "#f43f5e", cls: "fa-solid fa-heart" },
  grindr: { bg: "#f43f5e", cls: "", img: "/icons/dating/grindr.png" },
  tagged: { bg: "#f43f5e", cls: "", img: "/icons/dating/tagged.png" },
  topface: { bg: "#f43f5e", cls: "", img: "/icons/dating/topface.png" },
  // meetme.png currently lives in public/icons/texting/ in your repo
  meetme: { bg: "#f43f5e", cls: "", img: "/icons/texting/meetme.png" },
  streaming: { bg: "#e50914", cls: "fa-solid fa-play" },
  other: { bg: "#475569", cls: "fa-solid fa-globe" },
};

const BY_CATEGORY: Record<string, string> = {
  "usa-facebook": "facebook",
  "random-country-fb": "facebook",
  "asian-fb": "facebook",
  "other-countries-fb": "facebook",
  "aged-facebook": "facebook",
  tiktok: "tiktok",
  instagram: "instagram",
  twitter: "twitter",
  vpn: "vpn",
  email: "email",
  snapchat: "snapchat",
  "texting-apps": "texting",
  threads: "threads",
  "dating-sites": "dating",
  reddit: "reddit",
  "streaming-sites": "streaming",
};

// "Others" and "Streaming Sites" mix platforms, so those match on the account title.
const KEYWORDS: [string, string][] = [
  ["linkedin", "linkedin"],
  ["twitch", "twitch"],
  ["pinterest", "pinterest"],
  ["discord", "discord"],
  ["quora", "quora"],
  ["cgpt", "chatgpt"],
  ["spotify", "spotify"],
  ["netflix", "streaming"],
];

// VPN accounts match on the account title; anything unmatched keeps the generic shield.
const VPN_KEYWORDS: [RegExp, string][] = [
  [/express/, "expressvpn"],
  [/surfshark/, "surfshark"],
  [/\bpia\b|private\s*internet/, "pia"],
  [/nord/, "nordvpn"],
  [/\bhma\b|hide\s*my\s*ass|hidemyass/, "hma"],
];

// Email, texting and dating accounts also match on the account title; unmatched ones keep the generic icon.
const TITLE_MATCHERS: Record<string, [RegExp, string][]> = {
  vpn: VPN_KEYWORDS,
  email: [
    [/hotmail|outlook/, "hotmail"],
    [/gmail|google/, "gmail"],
    [/rambler|rumbler/, "rumbler"],
    [/mail\.?ru|\bmail\b/, "mail"],
  ],
  "texting-apps": [
    [/textnow|text\s*now/, "textnow"],
    [/textplus|text\s*plus/, "textplus"],
    [/google\s*voice|gvoice/, "googlevoice"],
  ],
  "dating-sites": [
    [/grindr/, "grindr"],
    [/tagged/, "tagged"],
    [/topface/, "topface"],
    [/meet\s*me|meetme/, "meetme"],
  ],
};

function iconFor(categoryKey: string | undefined, title: string): Icon {
  const k = categoryKey || "";
  const matchers = TITLE_MATCHERS[k];
  if (matchers) {
    const t = title.toLowerCase();
    const hit = matchers.find(([re]) => re.test(t));
    if (hit && ICONS[hit[1]]) return ICONS[hit[1]];
  }
  if (k === "others" || k === "streaming-sites") {
    const t = title.toLowerCase();
    const hit = KEYWORDS.find(([word]) => t.includes(word));
    if (hit) return ICONS[hit[1]];
  }
  // Never return undefined: a missing key here would crash the whole page.
  return ICONS[BY_CATEGORY[k]] ?? ICONS.other;
}

/** One category in a rounded box: title + "View all" on top, accounts listed below. */
export default function CategoryBox({
  name,
  categoryKey,
  href,
  items,
  onBuy,
}: {
  name: string;
  categoryKey?: string;
  href?: string; // when set, shows the "View all" button
  items: Product[];
  onBuy: (item: Product) => void;
}) {
  useFontAwesome();
  return (
    <section
      style={{
        background: "var(--surface, #0f1626)",
        border: "1px solid var(--border, rgba(128,128,128,0.25))",
        borderRadius: 16,
        padding: 16,
        margin: "0 0 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 17, textTransform: "uppercase" }}>{name}</div>
        {href && (
          <Link href={href} className="btn btn-blue" style={{ padding: "8px 14px", fontSize: 14, whiteSpace: "nowrap" }}>
            View all
          </Link>
        )}
      </div>

      {items.map((item, i) => {
        const icon = iconFor(categoryKey, item.title);
        return (
          <div
            key={item.slug}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--border, rgba(128,128,128,0.2))",
            }}
          >
            <div
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: icon.bg,
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}
            >
              {icon.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={icon.img}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: "100%", height: "100%", display: "block",
                    objectFit: icon.pad ? "contain" : "cover", padding: icon.pad || 0,
                  }}
                />
              ) : (
                <i className={icon.cls} style={{ color: icon.fg || "#ffffff", fontSize: 18 }} aria-hidden="true" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, lineHeight: 1.4, wordBreak: "break-word" }}>{item.title}</div>
              <div style={{ marginTop: 8 }}>
                <span className={`stock-pill ${item.available_stock > 0 ? "in" : "out"}`}>
                  {item.available_stock > 0 ? `${item.available_stock} in stock` : "Out of stock"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{item.price > 0 ? `₦${naira(item.price)}` : "—"}</span>
              <button className="cart-btn" disabled={item.available_stock === 0} onClick={() => onBuy(item)}>
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ display: "block" }}
                >
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                  <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
                </svg>
                <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Buy</span>
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
