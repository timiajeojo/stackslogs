"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API, naira, Product } from "../lib/store";

export default function BuyModal({
  item,
  balance,
  onClose,
  onBought,
}: {
  item: Product;
  balance: number;
  onClose: () => void;
  onBought: (info: { slug: string; qty: number; newBalance: number }) => void;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyMsg, setBuyMsg] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const [accounts, setAccounts] = useState<string[] | null>(null);

  const total = item.price * qty;
  const cannotAfford = total > balance;
  const maxQty = Math.max(Math.min(item.available_stock, 50), 1);

  async function buy() {
    if (buying) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setBuying(true);
    setBuyMsg(null);
    try {
      const res = await fetch(`${API}/api/catalog/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug: item.slug, quantity: qty }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) {
        setAccounts(data.accounts || []);
        onBought({ slug: item.slug, qty, newBalance: data.new_balance });
      } else if (res.status === 202) {
        setBuyMsg({ type: "info", text: data.message || "Your order is being confirmed. Check My orders shortly." });
      } else {
        setBuyMsg({ type: "error", text: data.error || "Purchase failed. Please try again." });
      }
    } catch {
      setBuyMsg({ type: "error", text: "Network error. Check My orders before trying again." });
    } finally {
      setBuying(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100,
        display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 12,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 440, maxHeight: "85vh", overflowY: "auto",
          background: "var(--card, #141a2b)", color: "var(--text, #fff)",
          border: "1px solid rgba(128,128,128,0.25)", borderRadius: 16, padding: 18,
        }}
      >
        {accounts ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Purchase complete</div>
            <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 10px" }}>
              Your accounts are below and saved in My orders.
            </p>
            <pre
              style={{
                background: "rgba(128,128,128,0.12)", padding: 12, borderRadius: 10,
                fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0,
              }}
            >
              {accounts.join("\n")}
            </pre>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-blue" onClick={() => navigator.clipboard.writeText(accounts.join("\n"))}>
                Copy all
              </button>
              <button className="btn btn-ghost" onClick={onClose}>Done</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Buy accounts</div>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>{item.title}</p>

            <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Quantity</label>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(Math.min(Math.max(Number(e.target.value) || 1, 1), maxQty))}
              className="search-input"
              style={{ width: "100%", margin: "6px 0 12px" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
              <span>Price each</span><span>₦{naira(item.price)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 4 }}>
              <span>Total</span><span>₦{naira(total)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)" }}>
              <span>Your balance</span><span>₦{naira(balance)}</span>
            </div>

            {cannotAfford && (
              <p style={{ fontSize: 13, margin: "12px 0 0" }}>
                Not enough balance. <Link href="/wallet" style={{ textDecoration: "underline" }}>Fund your wallet</Link>
              </p>
            )}
            {buyMsg && (
              <p style={{ fontSize: 13, margin: "12px 0 0", color: buyMsg.type === "error" ? "#f87171" : "inherit" }}>
                {buyMsg.text}
              </p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn btn-blue" disabled={buying || cannotAfford} onClick={buy}>
                {buying ? "Processing..." : `Pay ₦${naira(total)}`}
              </button>
              <button className="btn btn-ghost" onClick={onClose} disabled={buying}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
