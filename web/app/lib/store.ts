"use client";

import { useEffect, useState } from "react";

export const API = process.env.NEXT_PUBLIC_API_URL || "";

export interface Product {
  slug: string;
  title: string;
  available_stock: number;
  price: number; // kobo, already includes your markup
}
export interface StoreCategory {
  key: string;
  name: string;
  items: Product[];
}

export const naira = (kobo: number) =>
  (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Loads the storefront (3 attempts, 25s each, so it never sits on "Loading" forever). */
export function useCatalog() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 25000);
        try {
          const res = await fetch(`${API}/api/catalog`, { signal: ctrl.signal });
          if (!res.ok) throw new Error("catalog failed");
          const data = await res.json();
          if (cancelled) return;
          setCategories(data.categories || []);
          setLoading(false);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 2500));
        } finally {
          clearTimeout(timer);
        }
      }
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, setCategories, loading, error };
}
