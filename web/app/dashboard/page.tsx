"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "";

interface Product {
  slug: string;
  title: string;
  available_stock: number;
  price: number; // kobo, already includes your markup
}
interface StoreCategory {
  key: string;
  name: string;
  items: Product[];
}

const platformMeta: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  twitter: "X",
  telegram: "TG",
  discord: "DC",
  facebook: "FB",
  fb: "FB",
  vpn: "VP",
  email: "EM",
  reddit: "RD",
  threads: "TH",
  dating: "DT",
  streaming: "SS",
  texting: "TX",
  tools: "TL",
  youtube: "YT",
  google: "GG",
  snapchat: "SC",
  steam: "ST",
  outlook: "OL",
  protonmail: "PM",
};

const naira = (kobo: number) =>
  (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function badge(title: string) {
  const t = title.toLowerCase();
  const hit = Object.keys(platformMeta).find((k) => t.includes(k));
  return hit ? platformMeta[hit] : title.slice(0, 2).toUpperCase();
}

export default function Dashboard() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; firstName: string; balance: number } | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [selected, setSelected] = useState("all"); // "all" | category key
  const [search, setSearch] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);

  // Buy popup
  const [buyItem, setBuyItem] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyMsg, setBuyMsg] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const [accounts, setAccounts] = useState<string[] | null>(null);

  // Load the user once
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadUser() {
      const meRes = await fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!meRes.ok) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }
      setUser(await meRes.json());
    }
    loadUser();
  }, [router]);

  // Load the curated storefront (categories with their accounts)
  useEffect(() => {
    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError(false);
      try {
        const res = await fetch(`${API}/api/catalog`);
        if (!res.ok) throw new Error("catalog failed");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch {
        setCategories([]);
        setCatalogError(true);
      } finally {
        setCatalogLoading(false);
      }
    }
    loadCatalog();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  function openBuy(item: Product) {
    setBuyItem(item);
    setQty(1);
    setBuyMsg(null);
    setAccounts(null);
  }

  function closeBuy() {
    setBuyItem(null);
    setAccounts(null);
    setBuyMsg(null);
  }

  async function buy() {
    if (!buyItem || buying) return;
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
        body: JSON.stringify({ slug: buyItem.slug, quantity: qty }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        setAccounts(data.accounts || []);
        setUser((u) => (u ? { ...u, balance: data.new_balance } : u));
        setCategories((cats) =>
          cats.map((c) => ({
            ...c,
            items: c.items.map((p) =>
              p.slug === buyItem.slug ? { ...p, available_stock: Math.max(p.available_stock - qty, 0) } : p
            ),
          }))
        );
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

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="logo"><span className="mark">S</span>StacksLogs</div>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const visible = categories
    .filter((c) => selected === "all" || c.key === selected)
    .map((c) => ({
      ...c,
      items: c.items.filter((i) => !query || i.title.toLowerCase().includes(query)),
    }))
    .filter((c) => c.items.length > 0);

  const total = buyItem ? buyItem.price * qty : 0;
  const cannotAfford = buyItem ? total > user.balance : false;
  const maxQty = buyItem ? Math.min(buyItem.available_stock, 50) : 1;

  return (
    <>
      <nav className="dash">
        <div className="nav-left">
          <div className="burger" onClick={() => setDrawerOpen(true)}>
            <span></span><span></span><span></span>
          </div>
        </div>
        <div className="logo"><span className="mark">S</span>StacksLogs</div>
        <div className="nav-right">
          <div className="avatar">{user.email?.[0]?.toUpperCase() || "U"}</div>
        </div>
      </nav>

      <div className={`drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <div className="logo"><span className="mark">S</span>StacksLogs</div>
          <div className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</div>
        </div>
        <div className="drawer-section-label">Home</div>
        <div className="drawer-item active">Dashboard</div>
        <div className="drawer-section-label">Account</div>
        <Link href="/orders" className="drawer-item" onClick={() => setDrawerOpen(false)}>
          My orders
        </Link>
        <Link href="/wallet" className="drawer-item" onClick={() => setDrawerOpen(false)}>
          Add funds
        </Link>
        <Link href="/settings" className="drawer-item" onClick={() => setDrawerOpen(false)}>
          Settings
        </Link>
        <div className="drawer-item">Customer care</div>
        <div className="drawer-spacer"></div>
        <div className="drawer-logout">
          <div className="drawer-item" onClick={logout}>Logout</div>
        </div>
      </aside>

      <main className="dash-main">
        <div className="balance-card">
          <div>
            <div className="greeting">Welcome back, <strong>{user.firstName}</strong></div>
            <div className="amount"><span className="cur">₦</span>{naira(user.balance || 0)}</div>
          </div>
          <div className="balance-actions">
            <Link href="/wallet" className="btn btn-blue">Fund wallet</Link>
            <Link href="/orders" className="btn btn-ghost">Order history</Link>
          </div>
        </div>

        <div className="filter-row">
          <div className="select-shell">
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option value={c.key} key={c.key}>
                  {c.name} ({c.items.length})
                </option>
              ))}
            </select>
          </div>
          <input
            className="search-input"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {catalogLoading && <p style={{ color: "var(--text-muted)" }}>Loading accounts...</p>}

        {!catalogLoading && catalogError && (
          <p style={{ color: "var(--text-muted)" }}>Couldn't load accounts right now. Please refresh in a moment.</p>
        )}

        {!catalogLoading && !catalogError && visible.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>No accounts match your filters yet.</p>
        )}

        {!catalogLoading &&
          visible.map((cat) => (
            <section className="cat-section" key={cat.key}>
              <div className="cat-head">
                <div className="cat-title">
                  <span className="cat-badge">{badge(cat.name)}</span> {cat.name}
                </div>
              </div>
              <div className="card-row">
                {cat.items.map((item) => (
                  <div className="acc-card" key={item.slug}>
                    <div className="acc-top">
                      <div className="acc-icon">{badge(cat.name)}</div>
                      <span className={`stock-pill ${item.available_stock > 0 ? "in" : "out"}`}>
                        {item.available_stock > 0 ? `${item.available_stock} in stock` : "Sold out"}
                      </span>
                    </div>
                    <div className="acc-name">{item.title}</div>
                    <div className="acc-bottom">
                      <div className="price-block">
                        <span className="price-now">₦{naira(item.price)}</span>
                      </div>
                      <button
                        className="cart-btn"
                        disabled={item.available_stock === 0}
                        onClick={() => openBuy(item)}
                      >
                        🛒
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </main>

      {buyItem && (
        <div
          onClick={closeBuy}
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
                  <button
                    className="btn btn-blue"
                    onClick={() => navigator.clipboard.writeText(accounts.join("\n"))}
                  >
                    Copy all
                  </button>
                  <button className="btn btn-ghost" onClick={closeBuy}>Done</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Buy accounts</div>
                <p style={{ margin: "0 0 12px", fontSize: 14 }}>{buyItem.title}</p>

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
                  <span>Price each</span><span>₦{naira(buyItem.price)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 4 }}>
                  <span>Total</span><span>₦{naira(total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)" }}>
                  <span>Your balance</span><span>₦{naira(user.balance)}</span>
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
                  <button className="btn btn-ghost" onClick={closeBuy} disabled={buying}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="site-footer">
        <div className="foot-inner">
          <span>© 2026 StacksLogs</span>
          <span>support@stackslogs.com</span>
        </div>
      </footer>
    </>
  );
}
