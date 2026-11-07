"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, useUser } from "../lib/store";

type Status = "processing" | "completed" | "failed" | "needs_review";

interface Order {
  id: string;
  title: string;
  quantity: number;
  unit_price: number; // kobo
  price_paid: number; // kobo
  status: Status;
  created_at: string;
}

const naira = (kobo: number) =>
  (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusLabel: Record<Status, string> = {
  completed: "Completed",
  processing: "Processing",
  needs_review: "Confirming",
  failed: "Failed",
};

export default function OrdersPage() {
  const { user, logout } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string[]>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // useUser sends them to /login

    async function load() {
      try {
        const res = await fetch(`${API}/api/catalog/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function toggle(order: Order) {
    if (openId === order.id) {
      setOpenId(null);
      return;
    }
    setOpenId(order.id);
    setDetailError("");

    if (order.status !== "completed" || details[order.id]) return;

    const token = localStorage.getItem("token");
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/api/catalog/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setDetails((d) => ({ ...d, [order.id]: data.accounts || [] }));
    } catch {
      setDetailError("Couldn't load the account details. Please try again.");
    } finally {
      setDetailLoading(false);
    }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 1500);
  }

  return (
    <>
      <nav className="dash">
        <div className="nav-left">
          <button className="burger" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
            <span /><span /><span />
          </button>
        </div>
        <Link href="/dashboard" className="logo">
          <span className="mark">S</span>StacksLogs
        </Link>
        <div className="nav-right">
          <div className="avatar">{(user?.email || "")[0]?.toUpperCase() || ""}</div>
        </div>
      </nav>

      <div className={`drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <Link href="/dashboard" className="logo" onClick={() => setDrawerOpen(false)}>
            <span className="mark">S</span>StacksLogs
          </Link>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">✕</button>
        </div>
        <div className="drawer-section-label">Home</div>
        <Link href="/dashboard" className="drawer-item" onClick={() => setDrawerOpen(false)}>Dashboard</Link>
        <div className="drawer-section-label">Account</div>
        <Link href="/orders" className="drawer-item active" onClick={() => setDrawerOpen(false)}>My orders</Link>
        <Link href="/wallet" className="drawer-item" onClick={() => setDrawerOpen(false)}>Add funds</Link>
        <Link href="/settings" className="drawer-item" onClick={() => setDrawerOpen(false)}>Settings</Link>
        <div className="drawer-item">Customer care</div>
        <div className="drawer-spacer" />
        <div className="drawer-logout">
          <button className="drawer-item logout" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="dash-main">
        <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>My orders</h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 18px", fontSize: 14 }}>
          Tap an order to see your account details.
        </p>

        {loading && <p style={{ color: "var(--text-muted)" }}>Loading your orders...</p>}
        {!loading && error && (
          <p style={{ color: "var(--text-muted)" }}>Couldn't load your orders right now. Please refresh in a moment.</p>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="order-empty">
            <p>You haven't bought anything yet.</p>
            <Link href="/dashboard" className="btn btn-blue">Browse accounts</Link>
          </div>
        )}

        {orders.map((o) => {
          const isOpen = openId === o.id;
          const accounts = details[o.id];
          return (
            <div className="order-card" key={o.id}>
              <button className="order-top" onClick={() => toggle(o)} aria-expanded={isOpen}>
                <div className="order-main">
                  <div className="order-title">{o.title}</div>
                  <div className="order-meta">
                    {new Date(o.created_at).toLocaleString()} · {o.quantity} × ₦{naira(o.unit_price)}
                  </div>
                </div>
                <div className="order-side">
                  <div className="order-total">₦{naira(o.price_paid)}</div>
                  <span className={`order-status ${o.status}`}>{statusLabel[o.status]}</span>
                </div>
              </button>

              {isOpen && (
                <div className="order-body">
                  {o.status === "completed" && (
                    <>
                      {detailLoading && !accounts && <p className="order-note">Loading account details...</p>}
                      {detailError && !accounts && <p className="order-note error">{detailError}</p>}
                      {accounts && accounts.length === 0 && (
                        <p className="order-note">No account details were saved for this order. Please contact support.</p>
                      )}
                      {accounts && accounts.length > 0 && (
                        <>
                          <div className="order-logs">
                            {accounts.map((a, i) => (
                              <div className="order-log" key={i}>
                                <code>{a}</code>
                                <button className="log-copy" onClick={() => copy(a, `${o.id}-${i}`)}>
                                  {copiedKey === `${o.id}-${i}` ? "Copied ✓" : "Copy"}
                                </button>
                              </div>
                            ))}
                          </div>
                          {accounts.length > 1 && (
                            <button className="btn btn-ghost" onClick={() => copy(accounts.join("\n"), `${o.id}-all`)}>
                              {copiedKey === `${o.id}-all` ? "Copied ✓" : "Copy all"}
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {(o.status === "processing" || o.status === "needs_review") && (
                    <p className="order-note">
                      We're confirming this order with our supplier. It will update here shortly. If it
                      takes more than a few minutes, please contact support.
                    </p>
                  )}
                  {o.status === "failed" && (
                    <p className="order-note">This order didn't go through, and you were not charged.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>

      <footer className="site-footer">
        <div className="foot-inner">
          <span>© 2026 StacksLogs</span>
          <span>support@stackslogs.com</span>
        </div>
      </footer>
    </>
  );
}
