"use client";

import Link from "next/link";
import { naira, Product } from "../lib/store";

/** One category in a rounded box: title + "View all" on top, accounts listed below. */
export default function CategoryBox({
  name,
  href,
  items,
  onBuy,
}: {
  name: string;
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

      {items.map((item, i) => (
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, lineHeight: 1.4, wordBreak: "break-word" }}>{item.title}</div>
            <div
              style={{
                fontSize: 13,
                marginTop: 6,
                color: item.available_stock > 0 ? "var(--text-muted)" : "var(--danger, #f87171)",
              }}
            >
              {item.available_stock > 0 ? `${item.available_stock} pcs` : "Sold out"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>₦{naira(item.price)}</span>
            <button className="cart-btn" disabled={item.available_stock === 0} onClick={() => onBuy(item)}>
              🛒
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
