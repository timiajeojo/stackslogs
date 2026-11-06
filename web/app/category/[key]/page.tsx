"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API, naira, Product, useCatalog } from "../../lib/store";
import BuyModal from "../../components/BuyModal";
import CategoryBox from "../../components/CategoryBox";

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams<{ key: string }>();
  const key = decodeURIComponent(String(params?.key || ""));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; firstName: string; balance: number } | null>(null);
  const { categories, setCategories, loading, error } = useCatalog();
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

  const cat = categories.find((c) => c.key === key);
  const query = search.trim().toLowerCase();
  const items = cat ? cat.items.filter((i) => !query || i.title.toLowerCase().includes(query)) : [];

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
        <Link href="/dashboard" className="drawer-item" onClick={() => setDrawerOpen(false)}>Dashboard</Link>
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
        <Link href="/dashboard" className="view-all" style={{ display: "inline-block", marginBottom: 14 }}>
          ← Back to dashboard
        </Link>

        {loading && <p style={{ color: "var(--text-muted)" }}>Loading accounts...</p>}
        {!loading && error && (
          <p style={{ color: "var(--text-muted)" }}>Couldn't load accounts right now. Please refresh in a moment.</p>
        )}
        {!loading && !error && !cat && (
          <p style={{ color: "var(--text-muted)" }}>Category not found.</p>
        )}

        {!loading && cat && (
          <>
            <input
              className="search-input"
              style={{ width: "100%", margin: "0 0 14px" }}
              placeholder={`Search ${cat.name}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {items.length === 0 && <p style={{ color: "var(--text-muted)" }}>No accounts match your search.</p>}
            {items.length > 0 && <CategoryBox categoryKey={cat.key} name={`${cat.name} (${cat.items.length})`} items={items} onBuy={setBuyItem} />}
          </>
        )}
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
