"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import Drawer from "../components/Drawer";
import { API, naira, useUser } from "../lib/store";

interface Order {
  id: string;
  title: string;
  quantity: number;
  unit_price: number; // kobo
  price_paid: number; // kobo
  status: string; // processing | needs_review | completed | failed
  created_at: string;
}

type Tab = "all" | "completed" | "processing" | "refunds";

// Tries each URL until one exists (the route prefix depends on how the backend mounts it).
const ORDER_URLS = ["/api/catalog/orders", "/api/orders"];

const PAGE_SIZE = 10;

// Square chevron button used for page navigation.
const pageBtnStyle = (primary: boolean, disabled: boolean): CSSProperties => ({
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.35 : 1,
  color: primary ? "#fff" : "var(--text, #fff)",
  background: primary ? "var(--blue, #3D8FFF)" : "var(--surface-2, rgba(128,128,128,0.15))",
  border: primary ? "none" : "1px solid var(--border-strong, rgba(128,128,128,0.4))",
});

const group = (o: Order): Exclude<Tab, "all"> =>
  o.status === "completed" ? "completed" : o.status === "failed" ? "refunds" : "processing";

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  completed: { text: "Completed", color: "#22c55e" },
  processing: { text: "Processing", color: "#f59e0b" },
  refunds: { text: "Refunded", color: "#f87171" },
};

export default function OrdersPage() {
  const { user, logout } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [base, setBase] = useState(ORDER_URLS[0]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string[] | "loading" | "error">>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // useUser sends them to /login
    let cancelled = false;

    async function load() {
      for (const path of ORDER_URLS) {
        try {
          const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.status === 404) continue; // wrong prefix, try the next one
          if (!res.ok) throw new Error("orders failed");
          const data = await res.json();
          if (cancelled) return;
          setBase(path);
          setOrders(Array.isArray(data.orders) ? data.orders : []);
          setLoading(false);
          return;
        } catch {
          break;
        }
      }
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(order: Order) {
    if (openId === order.id) {
      setOpenId(null);
      return;
    }
    setOpenId(order.id);
    if (order.status !== "completed" || Array.isArray(details[order.id])) return;

    const token = localStorage.getItem("token");
    setDetails((d) => ({ ...d, [order.id]: "loading" }));
    try {
      const res = await fetch(`${API}${base}/${order.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("detail failed");
      const data = await res.json();
      setDetails((d) => ({ ...d, [order.id]: Array.isArray(data.accounts) ? data.accounts : [] }));
    } catch {
      setDetails((d) => ({ ...d, [order.id]: "error" }));
    }
  }

  const count = (t: Tab) => (t === "all" ? orders.length : orders.filter((o) => group(o) === t).length);
  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "completed", label: "Completed" },
    { id: "processing", label: "Processing" },
    { id: "refunds", label: "Refunds" },
  ];

  // Refunded orders were never kept, so they don't count as spent.
  const totalSpent = orders.filter((o) => o.status !== "failed").reduce((sum, o) => sum + o.price_paid, 0);
  const shown = orders.filter((o) => activeTab === "all" || group(o) === activeTab);
  const totalPages = Math.max(Math.ceil(shown.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);
  const pageItems = shown.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
          <div className="avatar">{(user?.firstName || user?.email || "")[0]?.toUpperCase() || ""}</div>
        </div>
      </nav>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} active="orders" onLogout={logout} />

      <main className="dash-main orders-main">
        <div className="orders-head-card">
          <div className="orders-head-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2h6a2 2 0 0 1 2 2v16l-5-3-5 3V4a2 2 0 0 1 2-2Z" />
              <path d="M9 8h6" />
              <path d="M9 12h6" />
            </svg>
          </div>
          <div>
            <h1>My orders</h1>
            <p className="orders-sub">
              Total <span className="cur">₦</span>
              <span className="mono">{naira(totalSpent)}</span> spent
            </p>
          </div>
        </div>

        <div className="status-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`status-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
                setOpenId(null);
              }}
            >
              {tab.label} <span className="mono">· {count(tab.id)}</span>
            </button>
          ))}
        </div>

        <div className="history-card">
          <div className="history-head">
            <div className="history-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a4 4 0 0 1 8 0v2" />
              </svg>
            </div>
            <h2>Order history</h2>
          </div>

          {loading && <p style={{ color: "var(--text-muted)", padding: 16 }}>Loading orders...</p>}
          {!loading && error && (
            <p style={{ color: "var(--text-muted)", padding: 16 }}>Couldn't load your orders right now. Please refresh in a moment.</p>
          )}

          {!loading && !error && shown.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M8 7V5a4 4 0 0 1 8 0v2" />
                </svg>
              </div>
              <h3>{orders.length === 0 ? "No orders yet" : "No orders in this tab"}</h3>
              <p>
                {orders.length === 0
                  ? "You haven't bought any accounts yet. Explore the catalog to get started."
                  : "Try another tab to see your other orders."}
              </p>
              {orders.length === 0 && (
                <Link href="/dashboard" className="btn btn-blue">Browse accounts</Link>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            pageItems.map((o, i) => {
              const g = group(o);
              const st = STATUS_LABEL[g];
              const detail = details[o.id];
              return (
                <div
                  key={o.id}
                  style={{
                    padding: "14px 16px",
                    borderTop: i === 0 ? "none" : "1px solid var(--border, rgba(128,128,128,0.2))",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, lineHeight: 1.4, wordBreak: "break-word" }}>{o.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                        {o.quantity} × ₦{naira(o.unit_price)} ·{" "}
                        {new Date(o.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700 }}>₦{naira(o.price_paid)}</div>
                      <div style={{ fontSize: 12, marginTop: 6, color: st.color, fontWeight: 600 }}>{st.text}</div>
                    </div>
                  </div>

                  {g === "completed" && (
                    <button
                      className="btn btn-ghost"
                      style={{ marginTop: 10, padding: "6px 12px", fontSize: 13 }}
                      onClick={() => toggle(o)}
                    >
                      {openId === o.id ? "Hide accounts" : "View accounts"}
                    </button>
                  )}
                  {g === "processing" && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "8px 0 0" }}>
                      We're confirming this order. Your accounts will appear here once it's complete.
                    </p>
                  )}
                  {g === "refunds" && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "8px 0 0" }}>
                      This order failed and the amount was returned to your wallet.
                    </p>
                  )}

                  {openId === o.id && g === "completed" && (
                    <div style={{ marginTop: 10 }}>
                      {detail === "loading" && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading accounts...</p>}
                      {detail === "error" && (
                        <p style={{ fontSize: 13, color: "#f87171" }}>Couldn't load the accounts. Please try again.</p>
                      )}
                      {Array.isArray(detail) && (
                        <>
                          <pre
                            style={{
                              background: "rgba(128,128,128,0.12)", padding: 12, borderRadius: 10, fontSize: 12,
                              whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0,
                            }}
                          >
                            {detail.join("\n")}
                          </pre>
                          <button
                            className="btn btn-blue"
                            style={{ marginTop: 8, padding: "6px 12px", fontSize: 13 }}
                            onClick={() => navigator.clipboard.writeText(detail.join("\n"))}
                          >
                            Copy all
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {!loading && !error && totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "16px",
                borderTop: "1px solid var(--border-strong, rgba(128,128,128,0.3))",
              }}
            >
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => {
                  setPage(currentPage - 1);
                  setOpenId(null);
                }}
                style={pageBtnStyle(false, currentPage <= 1)}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>

              <span style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", minWidth: 110 }}>
                Page {currentPage} of {totalPages}
                <br />
                {shown.length} orders
              </span>

              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setPage(currentPage + 1);
                  setOpenId(null);
                }}
                style={pageBtnStyle(true, currentPage >= totalPages)}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="foot-inner">
          <span>© 2026 StacksLogs</span>
        </div>
      </footer>
    </>
  );
}
