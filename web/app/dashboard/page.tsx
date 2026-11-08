"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import Drawer from "../components/Drawer";
import { naira, Product, useCatalog, useUser } from "../lib/store";
import BuyModal from "../components/BuyModal";
import CategoryBox from "../components/CategoryBox";

const PREVIEW_COUNT = 5;

export default function Dashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, setUser, logout } = useUser();
  const { categories, setCategories, loading: catalogLoading, error: catalogError } = useCatalog();
  const [selected, setSelected] = useState("all"); // "all" | category key
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [buyItem, setBuyItem] = useState<Product | null>(null);

  const query = search.trim().toLowerCase();
  // Home view (all categories, no search): only the first 5 accounts per category.
  const overview = selected === "all" && !query;
  const visible = categories
    .filter((c) => selected === "all" || c.key === selected)
    .map((c) => {
      const matches = c.items.filter((i) => !query || i.title.toLowerCase().includes(query));
      return { ...c, items: overview ? matches.slice(0, PREVIEW_COUNT) : matches };
    })
    .filter((c) => c.items.length > 0);

  const selectedName = selected === "all" ? "All categories" : categories.find((c) => c.key === selected)?.name || "All categories";

  function pick(key: string) {
    setSelected(key);
    setMenuOpen(false);
  }

  const optionStyle = (active: boolean): CSSProperties => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "12px 14px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "left",
    fontSize: 14,
    color: active ? "#fff" : "var(--text, #fff)",
    background: active ? "var(--blue, #3b82f6)" : "transparent",
  });

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
        <div className="balance-card">
          <div>
            <div className="greeting">Welcome back{user?.firstName ? "," : ""} <strong>{user?.firstName}</strong></div>
            <div className="amount"><span className="cur">₦</span>{user ? naira(user.balance || 0) : "0.00"}</div>
          </div>
          <div className="balance-actions">
            <Link href="/wallet" className="btn btn-blue">Fund wallet</Link>
            <Link href="/orders" className="btn btn-ghost">Order history</Link>
          </div>
        </div>

        <div className="filter-row">
          <div style={{ position: "relative", flex: "0 0 auto" }}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12,
                cursor: "pointer", fontSize: 14, maxWidth: 190,
                background: "var(--surface, #0f1626)", color: "var(--text, #fff)",
                border: `1px solid ${menuOpen ? "var(--blue, #3b82f6)" : "var(--border-strong, rgba(128,128,128,0.4))"}`,
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedName}</span>
              <span style={{ fontSize: 10, transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}>▼</span>
            </button>

            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
                    width: 260, maxHeight: 360, overflowY: "auto", padding: 6,
                    background: "var(--surface, #0f1626)", border: "1px solid var(--border-strong, rgba(128,128,128,0.4))",
                    borderRadius: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
                  }}
                >
                  <button type="button" style={optionStyle(selected === "all")} onClick={() => pick("all")}>
                    <span>All categories</span>
                  </button>
                  {categories.map((c) => (
                    <button type="button" key={c.key} style={optionStyle(selected === c.key)} onClick={() => pick(c.key)}>
                      <span>{c.name}</span>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>{c.items.length}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
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

        {visible.map((cat) => (
          <CategoryBox
            key={cat.key}
            categoryKey={cat.key}
            name={cat.name}
            href={`/category/${cat.key}`}
            items={cat.items}
            onBuy={setBuyItem}
          />
        ))}
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
        </div>
      </footer>
    </>
  );
}
