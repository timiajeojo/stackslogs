"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Listing {
  id: string;
  platform: string;
  title: string;
  price: number;
  status: string;
}

const platformMeta: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  twitter: "X",
  youtube: "YT",
  other: "OT",
};

export default function Dashboard() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; firstName: string; balance: number } | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function load() {
      try {
        const [meRes, listingsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings`),
        ]);

        if (!meRes.ok) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const userData = await meRes.json();
        console.log("Dashboard user:", userData);
        setUser(userData);
        setListings(await listingsRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  const filtered = listings.filter((l) => {
    const matchesCategory = category === "all" || l.platform === category;
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const grouped = filtered.reduce<Record<string, Listing[]>>((acc, l) => {
    (acc[l.platform] ||= []).push(l);
    return acc;
  }, {});

     if (loading) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="logo"><span className="mark">S</span>StacksLogs</div>
    </div>
  );
}

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
          <div className="avatar">{user?.email?.[0]?.toUpperCase() || "U"}</div>
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
        <Link
              href="/orders"
              className="drawer-item"
             onClick={() => setDrawerOpen(false)}
             >
             My orders
           </Link>
        <div className="drawer-item">Add funds</div>
        <div className="drawer-item">Settings</div>
        <div className="drawer-item">Customer care</div>
        <div className="drawer-spacer"></div>
        <div className="drawer-logout">
          <div className="drawer-item" onClick={logout}>Logout</div>
        </div>
      </aside>

      <main className="dash-main">
        <div className="balance-card">
          <div>
            <div className="greeting">Welcome back, <strong>{user?.firstName}</strong></div>
            <div className="amount"><span className="cur">₦</span>{((user?.balance || 0) / 100).toLocaleString()}</div>
          </div>
          <div className="balance-actions">
            <Link href="/wallet" className="btn btn-blue">Fund wallet</Link>
            <Link href="/orders" className="btn btn-ghost">Order history</Link>
          </div>
        </div>

        <div className="filter-row">
          <div className="select-shell">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">X</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <input
            className="search-input"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {Object.keys(grouped).length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>No listings match your filters yet.</p>
        )}

        {Object.entries(grouped).map(([platform, items]) => (
          <section className="cat-section" key={platform}>
            <div className="cat-head">
              <div className="cat-title">
                <span className="cat-badge">{platformMeta[platform] || "?"}</span> {platform}
              </div>
            </div>
            <div className="card-row">
              {items.map((l) => (
                <div className="acc-card" key={l.id}>
                  <div className="acc-top">
                    <div className="acc-icon">{platformMeta[l.platform] || "?"}</div>
                    <span className={`stock-pill ${l.status === "available" ? "in" : "out"}`}>
                      {l.status === "available" ? "In stock" : "Sold out"}
                    </span>
                  </div>
                  <div className="acc-name">{l.title}</div>
                  <div className="acc-bottom">
                    <div className="price-block">
                      <span className="price-now">₦{(l.price / 100).toLocaleString()}</span>
                    </div>
                    <button className="cart-btn" disabled={l.status !== "available"}>🛒</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
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