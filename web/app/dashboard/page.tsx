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

interface DatamollCategory {
  category_id: number;
  name: string;
  parent_id: number;
  parent_name: string;
  product_count: number;
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
  const [categories, setCategories] = useState<DatamollCategory[]>([]);
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
    const [meRes, listingsRes, categoriesRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`),
    ]);

    if (!meRes.ok) {
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    setUser(await meRes.json());
    setListings(await listingsRes.json());

    const catData = await categoriesRes.json();
    setCategories(catData.items || []);
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

const platformGroups = categories.reduce<Record<string, DatamollCategory[]>>((acc, c) => {
  (acc[c.parent_name] ||= []).push(c);
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
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DatamollCategory {
  category_id: number;
  name: string;
  parent_id: number;
  parent_name: string;
  product_count: number;
}

interface DatamollProduct {
  product_id: number;
  name: string;
  price: string;
  currency: string;
  stock: number;
  category_id: number;
  category_name: string;
  image_url: string;
}

const platformMeta: Record<string, string> = {
  instagram: "IG",
  tiktok: "TT",
  twitter: "X",
  telegram: "TG",
  discord: "DC",
  facebook: "FB",
  youtube: "YT",
  google: "GG",
  snapchat: "SC",
  steam: "ST",
  outlook: "OL",
  protonmail: "PM",
};

export default function Dashboard() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; firstName: string; balance: number } | null>(null);
  const [catalogItems, setCatalogItems] = useState<DatamollProduct[]>([]);
  const [categories, setCategories] = useState<DatamollCategory[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Load user + categories once
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadInitial() {
      const [meRes, categoriesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`),
      ]);

      if (!meRes.ok) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      setUser(await meRes.json());
      const catData = await categoriesRes.json();
      setCategories(catData.items || []);
    }
    loadInitial();
  }, [router]);

  // Re-fetch live catalog whenever the selected category changes
  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const url =
          category === "all"
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/catalog`
            : `${process.env.NEXT_PUBLIC_API_URL}/api/catalog?category_id=${category}`;
        const res = await fetch(url);
        const data = await res.json();
        setCatalogItems(data.items || []);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [category]);

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  const categoryLookup = categories.reduce<Record<number, DatamollCategory>>((acc, c) => {
    acc[c.category_id] = c;
    return acc;
  }, {});

  const filteredItems = catalogItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filteredItems.reduce<Record<string, DatamollProduct[]>>((acc, item) => {
    const platform = categoryLookup[item.category_id]?.parent_name || "Other";
    (acc[platform] ||= []).push(item);
    return acc;
  }, {});

  const platformGroups = categories.reduce<Record<string, DatamollCategory[]>>((acc, c) => {
    (acc[c.parent_name] ||= []).push(c);
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
        <Link
            href="/wallet"
            className="drawer-item"
            onClick={() => setDrawerOpen(false)}
              >
             Add funds
           </Link>
           <Link
            href="/settings"
            className="drawer-item"
            onClick={() => setDrawerOpen(false)}
              >
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
              {Object.entries(platformGroups).map(([platform, subs]) => (
               <optgroup label={platform} key={platform}>
               {subs.map((c) => (
              <option value={String(c.category_id)} key={c.category_id}>
                {c.name} ({c.product_count})
               </option>
                  ))}
                 </optgroup>
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

        {Object.keys(grouped).length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>No listings match your filters yet.</p>
        )}

        {Object.entries(grouped).map(([platform, items]) => (
          <section className="cat-section" key={platform}>
            <div className="cat-head">
              <div className="cat-title">
                <span className="cat-badge">
                  {platformMeta[platform.toLowerCase()] || platform.slice(0, 2).toUpperCase()}
                </span>{" "}
                {platform}
              </div>
            </div>
            <div className="card-row">
              {items.map((item) => (
                <div className="acc-card" key={item.product_id}>
                  <div className="acc-top">
                    <div className="acc-icon">
                      {platformMeta[platform.toLowerCase()] || platform.slice(0, 2).toUpperCase()}
                    </div>
                    <span className={`stock-pill ${item.stock > 0 ? "in" : "out"}`}>
                      {item.stock > 0 ? "In stock" : "Sold out"}
                    </span>
                  </div>
                  <div className="acc-name">{item.name}</div>
                  <div className="acc-bottom">
                    <div className="price-block">
                      <span className="price-now">${Number(item.price).toFixed(2)}</span>
                    </div>
                    <button className="cart-btn" disabled={item.stock === 0}>🛒</button>
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