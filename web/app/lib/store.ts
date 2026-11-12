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

// ---- Remembered in memory (between pages) and on the device (between visits) ----
let cachedCats: StoreCategory[] | null = null;
let cachedUser: User | null = null;

const CAT_KEY = "sl_catalog_v1";
const USER_KEY = "sl_user_v1";

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: not a problem, we just skip the cache
  }
}
// A short fingerprint of the login token, so one person's saved details are never shown to another.
const tokenTag = (token: string) => token.slice(-16);

/**
 * Wakes the backend. Free hosting puts the server to sleep when it is idle, and the first
 * request after that takes up to a minute. Calling this on the landing and login pages means
 * it is already awake by the time the user reaches the dashboard.
 */
export function prewarm() {
  try {
    fetch(`${API}/health`, { mode: "no-cors", cache: "no-store" }).catch(() => {});
  } catch {
    // ignore
  }
}

/**
 * Loads the storefront. Shows the copy saved on this device instantly, then refreshes it
 * from the server in the background. `waking` is true when the server is slow to answer.
 */
export function useCatalog() {
  const [categories, setCats] = useState<StoreCategory[]>(cachedCats || []);
  const [loading, setLoading] = useState(!cachedCats);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState(false);

  function setCategories(u: SetStateAction<StoreCategory[]>) {
    setCats((prev) => {
      const next = typeof u === "function" ? u(prev) : u;
      cachedCats = next;
      writeJSON(CAT_KEY, next);
      return next;
    });
  }

  useEffect(() => {
    let cancelled = false;

    // 1. Show what we saved last time, right away.
    if (!cachedCats) {
      const saved = readJSON<StoreCategory[]>(CAT_KEY);
      if (saved && saved.length > 0) {
        cachedCats = saved;
        setCats(saved);
        setLoading(false);
      }
    }

    // 2. Tell the user when the server is slow to wake up.
    const wakeTimer = setTimeout(() => {
      if (!cancelled && !cachedCats) setWaking(true);
    }, 5000);

    // 3. Refresh from the server. The first try waits long enough for a sleeping server to wake.
    async function load() {
      for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), attempt === 0 ? 70000 : 30000);
        try {
          const res = await fetch(`${API}/api/catalog`, { signal: ctrl.signal });
          if (!res.ok) throw new Error("catalog failed");
          const data = await res.json();
          if (cancelled) return;
          cachedCats = data.categories || [];
          writeJSON(CAT_KEY, cachedCats);
          setCats(cachedCats as StoreCategory[]);
          setError(false);
          setWaking(false);
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
        setWaking(false);
        setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
      clearTimeout(wakeTimer);
    };
  }, []);

  return { categories, setCategories, loading, waking, error };
}

/** Loads the signed-in user (redirects to /login if not signed in). No blocking screen. */
export function useUser() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(cachedUser);

  function setUser(u: SetStateAction<User | null>) {
    setUserState((prev) => {
      const next = typeof u === "function" ? u(prev) : u;
      cachedUser = next;
      try {
        const token = localStorage.getItem("token");
        if (token && next) writeJSON(USER_KEY, { tag: tokenTag(token), user: next });
      } catch {
        // ignore
      }
      return next;
    });
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem(USER_KEY);
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
    let cancelled = false;

    // Show the details saved for THIS login straight away (name and last known balance).
    if (!cachedUser) {
      const saved = readJSON<{ tag: string; user: User }>(USER_KEY);
      if (saved && saved.tag === tokenTag(token)) {
        cachedUser = saved.user;
        setUserState(saved.user);
      }
    }

    async function load() {
      // Retry a few times: a sleeping server can fail the first request.
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        try {
          const res = await fetch(`${API}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem(USER_KEY);
            cachedUser = null;
            router.push("/login");
            return;
          }
          if (!res.ok) throw new Error("me failed");
          const data = await res.json();
          if (cancelled) return;
          cachedUser = data;
          writeJSON(USER_KEY, { tag: tokenTag(token as string), user: data });
          setUserState(data);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { user, setUser, logout };
}
