"use client";

import { useCallback, useEffect, useState } from "react";
import { Avatar, Forbidden, PageTitle, StatCard, card, fmtDate, inputStyle, money, useAdminApi } from "../shared";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  joinedAt: string;
}
interface Data {
  totals: { total: number; newThisMonth: number; balances: number };
  users: AdminUser[];
}

export default function AdminUsers() {
  const { api, forbidden } = useAdminApi();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await api("/users"));
    } catch (e: any) {
      if (e.message !== "forbidden" && e.message !== "signed out") setError(e.message || "Couldn't load users.");
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  if (forbidden) return <Forbidden />;

  const q = search.trim().toLowerCase();
  const list = (data?.users || []).filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageTitle title="Users" subtitle="People who have created an account" />

      {error && <div style={{ ...card, color: "var(--danger)" }}>{error}</div>}

      <StatCard icon="👥" tint="rgba(59,130,246,.16)" label="Total Users" value={data ? String(data.totals.total) : "…"} />
      <StatCard icon="🆕" tint="rgba(34,197,94,.16)" label="New This Month" value={data ? String(data.totals.newThisMonth) : "…"} />
      <StatCard icon="👛" tint="rgba(245,158,11,.18)" label="Total Wallet Balances" value={data ? money(data.totals.balances) : "…"} />

      <input style={inputStyle} placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div style={card}>
        {!data && !error && <div style={{ color: "var(--text-muted)" }}>Loading…</div>}
        {data && list.length === 0 && <div style={{ color: "var(--text-muted)" }}>No users match.</div>}
        {list.map((u, i) => (
          <div key={u.id} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
            <Avatar letter={(u.name || u.email)[0] || "?"} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, wordBreak: "break-word" }}>
                {u.name || u.email.split("@")[0]}
                {u.isAdmin && <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(99,102,241,.18)", color: "#6d5df0" }}>Admin</span>}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", wordBreak: "break-all" }}>{u.email}</div>
              <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Joined {fmtDate(u.joinedAt, false)}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 800 }}>{money(u.balance)}</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Wallet</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
