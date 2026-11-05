"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "";

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

const naira = (kobo: number) =>
  (kobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function badge(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams<{ key: string }>();
  const categoryKey = decodeURIComponent(String(params?.key ?? ""));

  const [category, setCategory] = useState<StoreCategory | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`${API}/api/catalog`);
        if (!response.ok) throw new Error("Catalogue request failed");
        const data = await response.json();
        const list: StoreCategory[] = Array.isArray(data.categories)
          ? data.categories
          : [];
        setCategory(list.find((item) => item.key === categoryKey) ?? null);
      } catch {
        setCategory(null);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [categoryKey]);

  const query = search.trim().toLowerCase();

  const items = useMemo(() => {
    if (!category) return [];
    return category.items.filter(
      (item) => !query || item.title.toLowerCase().includes(query)
    );
  }, [category, query]);

  return (
    <main className="dash-main">
      <section className="catalogue">
        <div className="catalogue-heading">
          <div>
            <h1>{category ? category.name : "Category"}</h1>
            {category && <p>{category.items.length} products</p>}
          </div>
          <Link href="/dashboard" className="btn btn-ghost">
            ← Back to dashboard
          </Link>
        </div>

        <div className="filter-row">
          <input
            className="search-input"
            type="search"
            aria-label="Search products"
            placeholder="Search this category..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      {loading && <p style={{ color: "var(--text-muted)" }}>Loading products...</p>}

      {!loading && error && (
        <p style={{ color: "var(--text-muted)" }}>
          Couldn't load products right now. Please refresh in a moment.
        </p>
      )}

      {!loading && !error && !category && (
        <p style={{ color: "var(--text-muted)" }}>Category not found.</p>
      )}

      {!loading && !error && category && items.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>No products match your search.</p>
      )}

      {!loading && !error && category && items.length > 0 && (
        <div className="card-row">
          {items.map((item) => (
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
      )}
    </main>
  );
}
