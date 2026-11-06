"use client";

import { SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
export interface User {
  email: string;
  firstName: string;
  balance: number;
}

export const naira = (kobo: number) =>
  (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Remembered between pages so switching to the dashboard doesn't flash a loading screen.
let cachedCats: StoreCategory[] | null = null;
let cachedUser: User | null = null;

/** Loads the storefront (3 attempts, 25s each). Shows the last copy instantly when you come back to a page. */
export function useCatalog() {
  const [categories, setCats] = useState<StoreCategory[]>(cachedCats || []);
  const [loading, setLoading] = useState(!cachedCats);
  const [error, setError] = useState(false);

  function setCategories(u: SetStateAction<StoreCategory[]>) {
    setCats((prev) => {
      const next = typeof u === "function" ? u(prev) : u;
      cachedCats = next;
      return next;
    });
  }

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
          cachedCats = data.categories || [];
          setCats(cachedCats as StoreCategory[]);
          setError(false);
          setLoading(false);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 2500));
        } finally {
          clearTimeout(timer);
        }
      }
      if (!cancelled) {
        if (!cachedCats) setError(true);
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

/** Loads the signed-in user (redirects to /login if not signed in). No blocking screen. */
export function useUser() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(cachedUser);

  function setUser(u: SetStateAction<User | null>) {
    setUserState((prev) => {
      const next = typeof u === "function" ? u(prev) : u;
      cachedUser = next;
      return next;
    });
  }

  function logout() {
    localStorage.removeItem("token");
    cachedUser = null;
    cachedCats = null;
    router.push("/login");
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    async function load() {
      try {
        const res = await fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          cachedUser = null;
          router.push("/login");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        cachedUser = data;
        setUserState(data);
      } catch {
        // keep whatever we already have
      }
    }
    load();
  }, [router]);

  return { user, setUser, logout };
}
