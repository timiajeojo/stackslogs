"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API, naira, Product, useCatalog } from "../lib/store";
import BuyModal from "../components/BuyModal";

const PREVIEW_COUNT = 5;

export default function Dashboard() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; firstName: string; balance: number } | null>(null);
  const { categories, setCategories, loading: catalogLoading, error: catalogError } = useCatalog();
  const [selected, setSelected] = useState("all"); // "all" | category key
  const [search, setSearch] = useState("");
  const [buyItem, setBuyItem] = useState<Product | null>(null);

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

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="logo"><span className="mark">S</span>StacksLogs</div>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  // Home view (all categories, no search): only the first 5 accounts per category.
  const overview = selected === "all" && !query;
  const visible = categories
    .filter((c) => selected === "all" || c.key === selected)
    .map((c) => {
      const matches = c.items.filter((i) => !query || i.title.toLowerCase().includes(query));
      return { ...c, total: c.items.length, items: overview ? matches.slice(0, PREVIEW_COUNT) : matches };
    })
    .filter((c) => c.items.length > 0);

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
        <Link href="/orders" className="drawer-item" onClick={() => setDrawerOpen(false)}>My orders</Link>
        <Link href="/wallet" className="drawer-item" onClick={() => setDrawerOpen(false)}>Add funds</Link>
        <Link href="/settings" className="drawer-item" onClick={() => setDrawerOpen(false)}>Settings</Link>
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
                <div className="cat-title">{cat.name}</div>
                <Link href={`/category/${cat.key}`} className="view-all">View all →</Link>
              </div>
              <div className="card-row">
                {cat.items.map((item) => (
                  <div className="acc-card" key={item.slug}>
                    <div className="acc-top">
                      <span className={`stock-pill ${item.available_stock > 0 ? "in" : "out"}`}>
                        {item.available_stock > 0 ? `${item.available_stock} in stock` : "Sold out"}
                      </span>
                    </div>
                    <div className="acc-name">{item.title}</div>
                    <div className="acc-bottom">
                      <div className="price-block">
                        <span className="price-now">₦{naira(item.price)}</span>
                      </div>
                      <button className="cart-btn" disabled={item.available_stock === 0} onClick={() => setBuyItem(item)}>
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
        <BuyModal
          item={buyItem}
          balance={user.balance}
          onClose={() => setBuyItem(null)}
          onBought={({ slug, qty, newBalance }) => {
            setUser((u) => (u ? { ...u, balance: newBalance } : u));
            setCategories((cats) =>
              cats.map((c) => ({
                ...c,
                items: c.items.map((p) =>
                  p.slug === slug ? { ...p, available_stock: Math.max(p.available_stock - qty, 0) } : p
                ),
              }))
            );
          }}
        />
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
