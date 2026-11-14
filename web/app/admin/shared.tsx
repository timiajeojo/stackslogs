"use client";

import { useCallback, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { API, naira } from "../lib/store";

// Small pieces shared by the admin pages (transactions, users, purchases, YPG Media).

export const money = (k: number) => `${k < 0 ? "-" : ""}₦${naira(Math.abs(k))}`;

export const card: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: 18,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 12,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-2)",
  color: "var(--text)",
  font: "inherit",
};

/** "12 Nov 2026, 12:51" in Nigerian time. */
export function fmtDate(iso: string, withTime = true) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Africa/Lagos",
  });
}

/** Calls /api/admin/*. Sends signed-out users to /login and flags non-admins. */
export function useAdminApi() {
  const router = useRouter();
  const [forbidden, setForbidden] = useState(false);

  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        throw new Error("signed out");
      }
      const res = await fetch(`${API}/api/admin${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        throw new Error("signed out");
      }
      if (res.status === 403) {
        setForbidden(true);
        throw new Error("forbidden");
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    [router]
  );

  return { api, forbidden };
}

export function Forbidden() {
  return (
    <div style={{ ...card, textAlign: "center" }}>
      <h2>Admins only</h2>
      <p style={{ color: "var(--text-muted)" }}>This account doesn&apos;t have access to the admin panel.</p>
    </div>
  );
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>{title}</h1>
        {subtitle && <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function RangeSelect({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  return (
    <div className="select-shell">
      <select value={days} onChange={(e) => onChange(Number(e.target.value))}>
        <option value={7}>Last 7 Days</option>
        <option value={30}>Last 30 Days</option>
        <option value={90}>Last 90 Days</option>
        <option value={365}>Last 12 Months</option>
      </select>
    </div>
  );
}

/** A big stat card with an icon (used for the totals at the top of each page). */
export function StatCard({ icon, tint, label, value, sub, right }: {
  icon: string; tint: string; label: string; value: string; sub?: string; right?: ReactNode;
}) {
  return (
    <div style={{ ...card, display: "flex", gap: 14, alignItems: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: tint, display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, wordBreak: "break-word" }}>{value}</div>
        {sub && <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/** A smaller stat card without an icon (used in a 2-column grid). */
export function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color: color || "var(--text)", wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ ...card, padding: 6, display: "inline-flex", gap: 4, maxWidth: "100%", overflowX: "auto" }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            border: 0,
            cursor: "pointer",
            font: "inherit",
            padding: "9px 18px",
            borderRadius: 10,
            whiteSpace: "nowrap",
            background: value === t.id ? "var(--blue)" : "transparent",
            color: value === t.id ? "#fff" : "var(--text-muted)",
            fontWeight: value === t.id ? 700 : 500,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

const PILLS = {
  good: { bg: "rgba(34,197,94,.15)", fg: "var(--success)" },
  wait: { bg: "rgba(245,158,11,.16)", fg: "#d97706" },
  bad: { bg: "rgba(239,68,68,.15)", fg: "var(--danger)" },
};

export function Pill({ tone, children }: { tone: keyof typeof PILLS; children: ReactNode }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 999, fontSize: 13, background: PILLS[tone].bg, color: PILLS[tone].fg }}>
      {children}
    </span>
  );
}

export function Avatar({ letter }: { letter: string }) {
  return (
    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(99,102,241,.18)", color: "#6d5df0", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
      {letter.toUpperCase()}
    </div>
  );
}
