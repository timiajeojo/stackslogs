"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { naira, Product } from "../lib/store";

type Icon = { bg: string; glyph: ReactNode };

const W = "#ffffff";
const text = (s: string, size = 15) => (
  <text x="12" y={12 + size * 0.36} textAnchor="middle" fontSize={size} fontWeight="700" fontFamily="Arial, sans-serif" fill={W}>
    {s}
  </text>
);

const ICONS: Record<string, Icon> = {
  facebook: { bg: "#1877f2", glyph: text("f", 20) },
  instagram: {
    bg: "linear-gradient(45deg,#f9a03f,#e1306c 50%,#833ab4)",
    glyph: (
      <g fill="none" stroke={W} strokeWidth="1.8">
        <rect x="5" y="5" width="14" height="14" rx="4" />
        <circle cx="12" cy="12" r="3.3" />
        <circle cx="16.4" cy="7.6" r="0.6" fill={W} />
      </g>
    ),
  },
  tiktok: {
    bg: "#111111",
    glyph: (
      <g fontFamily="Arial, sans-serif" fontWeight="700" fontSize="17" textAnchor="middle">
        <text x="11" y="17" fill="#25f4ee">♪</text>
        <text x="13" y="17" fill="#fe2c55">♪</text>
        <text x="12" y="17" fill={W}>♪</text>
      </g>
    ),
  },
  twitter: {
    bg: "#111111",
    glyph: (
      <g stroke={W} strokeWidth="2" strokeLinecap="round">
        <line x1="6.5" y1="6" x2="17.5" y2="18" />
        <line x1="17.5" y1="6" x2="6.5" y2="18" />
      </g>
    ),
  },
  snapchat: {
    bg: "#fffc00",
    glyph: (
      <path
        d="M12 4c-2.8 0-4.6 2-4.6 4.6V11l-1.9 1.1 1.7 1c-.3 1-.9 1.6-1.8 2 1 .8 2.2.8 3.4.3.8 1 1.7 1.6 3.2 1.6s2.4-.6 3.2-1.6c1.2.5 2.4.5 3.4-.3-.9-.4-1.5-1-1.8-2l1.7-1L16.6 11V8.6C16.6 6 14.8 4 12 4z"
        fill="#ffffff"
        stroke="#111"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    ),
  },
  reddit: {
    bg: "#ff4500",
    glyph: (
      <g>
        <ellipse cx="12" cy="13.5" rx="6.5" ry="4.5" fill={W} />
        <circle cx="9.7" cy="13" r="1.1" fill="#ff4500" />
        <circle cx="14.3" cy="13" r="1.1" fill="#ff4500" />
        <circle cx="16.8" cy="8" r="1.3" fill={W} />
        <path d="M12 9.2 13 5l3.8 3" fill="none" stroke={W} strokeWidth="1.2" />
      </g>
    ),
  },
  linkedin: { bg: "#0a66c2", glyph: text("in", 14) },
  twitch: {
    bg: "#9146ff",
    glyph: (
      <g fill="none" stroke={W} strokeWidth="1.8" strokeLinejoin="round">
        <path d="M6 5h12v8l-3 3h-3l-2.5 2.5V16H6z" />
        <line x1="12" y1="8.5" x2="12" y2="11.5" strokeLinecap="round" />
        <line x1="15" y1="8.5" x2="15" y2="11.5" strokeLinecap="round" />
      </g>
    ),
  },
  pinterest: { bg: "#e60023", glyph: text("P", 18) },
  discord: {
    bg: "#5865f2",
    glyph: (
      <g>
        <rect x="5" y="7" width="14" height="10" rx="4" fill={W} />
        <circle cx="9.6" cy="12" r="1.4" fill="#5865f2" />
        <circle cx="14.4" cy="12" r="1.4" fill="#5865f2" />
      </g>
    ),
  },
  spotify: {
    bg: "#1db954",
    glyph: (
      <g fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6.5 9.5c3.6-1.2 7.6-.9 11 1" />
        <path d="M7.3 12.8c3-.9 6.1-.6 8.8.9" />
        <path d="M8.1 15.8c2.4-.6 4.7-.4 6.8.7" />
      </g>
    ),
  },
  quora: { bg: "#b92b27", glyph: text("Q", 17) },
  chatgpt: {
    bg: "#10a37f",
    glyph: (
      <path d="M12 4.5l6 3.5v8l-6 3.5-6-3.5V8z M12 8.5v7" fill="none" stroke={W} strokeWidth="1.6" strokeLinejoin="round" />
    ),
  },
  email: {
    bg: "#f59e0b",
    glyph: (
      <g fill="none" stroke={W} strokeWidth="1.8" strokeLinejoin="round">
        <rect x="5" y="7" width="14" height="10" rx="2" />
        <path d="M5.5 8l6.5 5 6.5-5" />
      </g>
    ),
  },
  vpn: {
    bg: "#16a34a",
    glyph: <path d="M12 4.5l6 2v5c0 4-2.6 6.4-6 8-3.4-1.6-6-4-6-8v-5z" fill="none" stroke={W} strokeWidth="1.8" strokeLinejoin="round" />,
  },
  texting: {
    bg: "#0ea5e9",
    glyph: <path d="M6 6h12v9H11l-4 3v-3H6z" fill="none" stroke={W} strokeWidth="1.8" strokeLinejoin="round" />,
  },
  threads: { bg: "#111111", glyph: text("@", 17) },
  dating: {
    bg: "#f43f5e",
    glyph: <path d="M12 18.5C6 14.5 5 11.5 5 9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 1.5c0 2-1 5-7 9z" fill={W} />,
  },
  streaming: { bg: "#e50914", glyph: <path d="M9 6.5v11l9-5.5z" fill={W} /> },
  other: {
    bg: "#475569",
    glyph: (
      <g fill="none" stroke={W} strokeWidth="1.6">
        <circle cx="12" cy="12" r="7" />
        <ellipse cx="12" cy="12" rx="3" ry="7" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </g>
    ),
  },
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

function iconFor(categoryKey: string | undefined, title: string): Icon {
  const k = categoryKey || "";
  if (k === "others" || k === "streaming-sites") {
    const t = title.toLowerCase();
    const hit = KEYWORDS.find(([word]) => t.includes(word));
    if (hit) return ICONS[hit[1]];
  }
  return ICONS[BY_CATEGORY[k] || "other"];
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
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, overflow: "hidden", background: icon.bg }}>
              <svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true">
                {icon.glyph}
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, lineHeight: 1.4, wordBreak: "break-word" }}>{item.title}</div>
              <div style={{ marginTop: 8 }}>
                <span className={`stock-pill ${item.available_stock > 0 ? "in" : "out"}`}>
                  {item.available_stock > 0 ? `${item.available_stock} in stock` : "Sold out"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>₦{naira(item.price)}</span>
              <button className="cart-btn" disabled={item.available_stock === 0} onClick={() => onBuy(item)}>
                🛒
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
