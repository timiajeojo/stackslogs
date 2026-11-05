"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const PREVIEW_LIMIT = 5;

interface Product {
  slug: string;
  title: string;
  available_stock: number;
  price: number; // kobo
}

interface StoreCategory {
  key: string;
  name: string;
  items: Product[];
}

const categoryBadges: Record<string, string> = {
  software: "SW",
  vpn: "VP",
  tools: "TL",
  hosting: "HS",
  design: "DS",
  digital: "DG",
  api: "API",
};

const naira = (kobo: number) =>
  (kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function badge(name: string) {
  const key = Object.keys(categoryBadges).find((item) =>
    name.toLowerCase().includes(item)
  );
  return key ? categoryBadges[key] : name.slice(0, 2).toUpperCase();
}

export default function Dashboard() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<{
    email: string;
    firstName: string;
    balance: number;
  } | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [selected, setSelected] = useState("all");
  const [search, setSearch] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadUser() {
      try {
        const response = await fetch(`${API}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        setUser(await response.json());
      } catch {
        router.push("/login");
      }
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError(false);
      try {
        const response = await fetch(`${API}/api/catalog`);
        if (!response.ok) throw new Error("Catalogue request failed");
        const data = await response.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
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

  const query = search.trim().toLowerCase();

  const visibleCategories = useMemo(() => {
    return categories
      .filter((category) => selected === "all" || category.key === selected)
      .map((category) => {
        const matchingItems = category.items.filter(
          (item) => !query || item.title.toLowerCase().includes(query)
        );

        // Category previews show five products. Search and an opened category
        // show every matching product so results are not hidden.
        const showAll = Boolean(query) || selected !== "all";
        return {
          ...category,
          items: showAll
            ? matchingItems
            : matchingItems.slice(0, PREVIEW_LIMIT),
          matchingCount: matchingItems.length,
        };
      })
      .filter((category) => category.items.length > 0);
  }, [categories, query, selected]);

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="logo">
          <span className="mark">S</span>StacksLogs
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="dash">
        <div className="nav-left">
          <button
            type="button"
            className="burger"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
        <div className="logo">
          <span className="mark">S</span>StacksLogs
        </div>
        <div className="nav-right">
          <div className="avatar">{user.email?.[0]?.toUpperCase() || "U"}</div>
        </div>
      </nav>

      <div
        className={`drawer-overlay ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <div className="logo">
            <span className="mark">S</span>StacksLogs
          </div>
          <button
            type="button"
            className="drawer-close"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          >
            ✕
          </button>
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
          <button type="button" className="drawer-item" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="balance-card">
          <div>
            <div className="greeting">
              Welcome back, <strong>{user.firstName}</strong>
            </div>
            <div className="amount">
              <span className="cur">₦</span>{naira(user.balance || 0)}
            </div>
          </div>
          <div className="balance-actions">
            <Link href="/wallet" className="btn btn-blue">Fund wallet</Link>
            <Link href="/orders" className="btn btn-ghost">Order history</Link>
          </div>
        </div>

        <section className="catalogue">
          <div className="catalogue-heading">
            <div>
              <h1>Digital Products</h1>
              <p>Browse the products and services currently available.</p>
            </div>
            {selected !== "all" && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelected("all")}
              >
                ← All categories
              </button>
            )}
          </div>

          <div className="filter-row">
            <div className="select-shell">
              <select
                aria-label="Filter by category"
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option value={category.key} key={category.key}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="search-input"
              type="search"
              aria-label="Search products"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </section>

        {catalogLoading && (
          <p style={{ color: "var(--text-muted)" }}>Loading products...</p>
        )}

        {!catalogLoading && catalogError && (
          <p style={{ color: "var(--text-muted)" }}>
            Couldn't load products right now. Please refresh in a moment.
          </p>
        )}

        {!catalogLoading && !catalogError && visibleCategories.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>
            {categories.length === 0
              ? "No approved products are currently available."
              : "No products match your search or category."}
          </p>
        )}

        {!catalogLoading &&
          !catalogError &&
          visibleCategories.map((category) => (
            <section className="cat-section" key={category.key}>
              <div className="cat-head">
                <div className="cat-title">
                  <span className="cat-badge">{badge(category.name)}</span>
                  {category.name}
                </div>
                {!query && selected === "all" && category.matchingCount > PREVIEW_LIMIT && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setSelected(category.key);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    View all ({category.matchingCount})
                  </button>
                )}
              </div>

              <div className="card-row">
                {category.items.map((item) => (
                  <article className="acc-card" key={item.slug}>
                    <div className="acc-top">
                      <div className="acc-icon">{badge(category.name)}</div>
                      <span className={`stock-pill ${item.available_stock > 0 ? "in" : "out"}`}>
                        {item.available_stock > 0
                          ? `${item.available_stock} available`
                          : "Out of stock"}
                      </span>
                    </div>
                    <div className="acc-name">{item.title}</div>
                    <div className="acc-bottom">
                      <div className="price-block">
                        <span className="price-now">₦{naira(item.price)}</span>
                      </div>
                      <span className="stock-pill">
                        {item.available_stock > 0 ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </article>
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
