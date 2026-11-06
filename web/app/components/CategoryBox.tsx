"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  FaFacebook, FaInstagram, FaTiktok, FaTwitter, FaSnapchat, FaReddit, FaLinkedin, FaTwitch,
  FaPinterest, FaDiscord, FaSpotify, FaQuora, FaRobot, FaEnvelope, FaShieldAlt, FaHeart,
  FaComment, FaPlay, FaAt, FaGlobe,
} from "react-icons/fa";
import { naira, Product } from "../lib/store";

type Icon = { Comp: ComponentType<{ size?: number; color?: string }>; color: string };

const BY_CATEGORY: Record<string, Icon> = {
  "usa-facebook": { Comp: FaFacebook, color: "#1877f2" },
  "random-country-fb": { Comp: FaFacebook, color: "#1877f2" },
  "asian-fb": { Comp: FaFacebook, color: "#1877f2" },
  "other-countries-fb": { Comp: FaFacebook, color: "#1877f2" },
  "aged-facebook": { Comp: FaFacebook, color: "#1877f2" },
  tiktok: { Comp: FaTiktok, color: "#ffffff" },
  instagram: { Comp: FaInstagram, color: "#e1306c" },
  twitter: { Comp: FaTwitter, color: "#1d9bf0" },
  vpn: { Comp: FaShieldAlt, color: "#22c55e" },
  email: { Comp: FaEnvelope, color: "#f59e0b" },
  snapchat: { Comp: FaSnapchat, color: "#fffc00" },
  "texting-apps": { Comp: FaComment, color: "#38bdf8" },
  threads: { Comp: FaAt, color: "#ffffff" },
  "dating-sites": { Comp: FaHeart, color: "#f43f5e" },
  reddit: { Comp: FaReddit, color: "#ff4500" },
  "streaming-sites": { Comp: FaPlay, color: "#e50914" },
};

// "Others" and "Streaming Sites" mix different platforms, so those match on the account title.
const BY_KEYWORD: [string, Icon][] = [
  ["linkedin", { Comp: FaLinkedin, color: "#0a66c2" }],
  ["twitch", { Comp: FaTwitch, color: "#9146ff" }],
  ["pinterest", { Comp: FaPinterest, color: "#e60023" }],
  ["discord", { Comp: FaDiscord, color: "#5865f2" }],
  ["quora", { Comp: FaQuora, color: "#b92b27" }],
  ["cgpt", { Comp: FaRobot, color: "#10a37f" }],
  ["spotify", { Comp: FaSpotify, color: "#1db954" }],
  ["netflix", { Comp: FaPlay, color: "#e50914" }],
];

function iconFor(categoryKey: string | undefined, title: string): Icon {
  const k = categoryKey || "";
  if (k === "others" || k === "streaming-sites") {
    const t = title.toLowerCase();
    const hit = BY_KEYWORD.find(([word]) => t.includes(word));
    if (hit) return hit[1];
  }
  return BY_CATEGORY[k] || { Comp: FaGlobe, color: "#94a3b8" };
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
        const { Comp, color } = iconFor(categoryKey, item.title);
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
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--surface-2, rgba(128,128,128,0.15))",
              }}
            >
              <Comp size={22} color={color} />
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
