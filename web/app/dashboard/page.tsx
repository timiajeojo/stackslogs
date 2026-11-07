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

function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.7 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6" />
    </svg>
  );
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
  const [reloadKey, setReloadKey] = useState(0);

  // Buy popup
  const [buyItem, setBuyItem] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const [buyMsg, setBuyMsg] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const [accounts, setAccounts] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 40_000);

    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError(false);
      try {
        const res = await fetch(`${API}/api/catalog`, { signal: controller.signal });
        if (!res.ok) throw new Error("catalog failed");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch {
        setCategories([]);
        setCatalogError(true);
      } finally {
        clearTimeout(timer);
        setCatalogLoading(false);
      }
    }
    loadCatalog();

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [reloadKey]);

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  function openBuy(item: Product) {
    setBuyItem(item);
    setQty(1);
    setBuyMsg(null);
    setAccounts(null);
    setCopied(false);
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
          <div>
            <p style={{ color: "var(--text-muted)" }}>Couldn't load accounts right now.</p>
            <button className="btn btn-ghost" onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
          </div>
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
                        style={{ color: "#fff" }}
                        disabled={item.available_stock === 0}
                        onClick={() => openBuy(item)}
                        aria-label={`Buy ${item.title}`}
                      >
                        <CartIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </main>

      {buyItem && (
        <div className="buy-overlay" onClick={closeBuy}>
          <div className="buy-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {accounts ? (
              <>
                <div className="buy-success-icon">✓</div>
                <h3 className="buy-heading center">Purchase complete</h3>
                <p className="buy-sub center">
                  Your account details are below. They're also saved in My orders.
                </p>
                <div className="buy-logs">
                  {accounts.map((a, i) => (
                    <div className="buy-log" key={i}>{a}</div>
                  ))}
                </div>
                <div className="buy-actions">
                  <button
                    className="btn btn-blue"
                    onClick={() => {
                      navigator.clipboard.writeText(accounts.join("\n"));
                      setCopied(true);
                    }}
                  >
                    {copied ? "Copied ✓" : "Copy all"}
                  </button>
                  <Link href="/orders" className="btn btn-ghost">View in My orders</Link>
                </div>
              </>
            ) : (
              <>
                <div className="buy-head">
                  <h3 className="buy-heading">Buy accounts</h3>
                  <button className="buy-x" onClick={closeBuy} disabled={buying} aria-label="Close">✕</button>
                </div>
                <p className="buy-title">{buyItem.title}</p>

                <label className="buy-label">Quantity</label>
                <div className="qty-row">
                  <button className="qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                  <input
                    className="buy-input"
                    type="number"
                    min={1}
                    max={maxQty}
                    value={qty}
                    onChange={(e) => setQty(Math.min(Math.max(Number(e.target.value) || 1, 1), maxQty))}
                  />
                  <button className="qty-btn" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}>+</button>
                </div>

                <div className="buy-lines">
                  <div><span>Price each</span><span>₦{naira(buyItem.price)}</span></div>
                  <div className="total"><span>Total</span><span>₦{naira(total)}</span></div>
                  <div className="muted"><span>Your balance</span><span>₦{naira(user.balance)}</span></div>
                </div>

                {cannotAfford && (
                  <p className="buy-msg error">
                    Not enough balance. <Link href="/wallet">Fund your wallet</Link>
                  </p>
                )}
                {buyMsg && <p className={`buy-msg ${buyMsg.type}`}>{buyMsg.text}</p>}

                <div className="buy-actions">
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
