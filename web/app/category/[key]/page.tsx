"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Drawer from "../../components/Drawer";
import { Product, useCatalog, useUser } from "../../lib/store";
import BuyModal from "../../components/BuyModal";
import CategoryBox from "../../components/CategoryBox";

export default function CategoryPage() {
  const params = useParams<{ key: string }>();
  const key = decodeURIComponent(String(params?.key || ""));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, setUser, logout } = useUser();
  const { categories, setCategories, loading, error } = useCatalog();
  const [search, setSearch] = useState("");
  const [buyItem, setBuyItem] = useState<Product | null>(null);

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
          <div className="avatar">{(user?.firstName || user?.email || "")[0]?.toUpperCase() || ""}</div>
        </div>
      </nav>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} active="dashboard" onLogout={logout} />

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

      {buyItem && user && (
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
