"use client";

import { useCallback, useEffect, useState } from "react";
import { Forbidden, MiniStat, PageTitle, Pill, RangeSelect, Tabs, card, fmtDate, inputStyle, money, useAdminApi } from "../shared";

interface Purchase {
  id: string;
  title: string;
  quantity: number;
  paid: number;
  cost: number;
  status: string;
  supplierOrderId: string | null;
  reason: string | null;
  name: string;
  email: string;
  at: string;
}
interface Data {
  summary: { orders: number; successful: number; pending: number; refunded: number; paid: number; cost: number; profit: number };
  purchases: Purchase[];
}

type Tab = "all" | "successful" | "pending" | "refunded";

const GROUP: Record<string, Tab> = { completed: "successful", processing: "pending", needs_review: "pending", failed: "refunded" };
const LABEL: Record<string, { text: string; tone: "good" | "wait" | "bad" }> = {
  completed: { text: "Successful", tone: "good" },
  processing: { text: "Pending", tone: "wait" },
  needs_review: { text: "Needs review", tone: "wait" },
  failed: { text: "Refunded", tone: "bad" },
};

export default function AdminPurchases() {
  const { api, forbidden } = useAdminApi();
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await api(`/purchases?days=${days}`));
    } catch (e: any) {
      if (e.message !== "forbidden" && e.message !== "signed out") setError(e.message || "Couldn't load purchases.");
    }
  }, [api, days]);

  useEffect(() => {
    load();
  }, [load]);

  if (forbidden) return <Forbidden />;

  const s = data?.summary;
  const q = search.trim().toLowerCase();
  const list = (data?.purchases || []).filter(
    (p) =>
      (tab === "all" || GROUP[p.status] === tab) &&
      (!q ||
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.supplierOrderId || "").toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q))
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageTitle
        title="Purchases"
        subtitle={s ? `${s.orders} orders · ${s.successful} successful · ${s.pending} pending · ${s.refunded} refunded` : "Loading…"}
        right={<RangeSelect days={days} onChange={setDays} />}
      />

      {error && <div style={{ ...card, color: "var(--danger)" }}>{error}</div>}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <MiniStat label="Successful purchases" value={s ? String(s.successful) : "…"} />
        <MiniStat label="Customers paid" value={s ? money(s.paid) : "…"} />
        <MiniStat label="YPG Media cost" value={s ? money(s.cost) : "…"} />
        <MiniStat label="Profit" value={s ? money(s.profit) : "…"} color={s && s.profit < 0 ? "var(--danger)" : undefined} />
      </div>

      <div>
        <Tabs
          tabs={[
            { id: "all", label: "All" },
            { id: "successful", label: "Successful" },
            { id: "pending", label: "Pending" },
            { id: "refunded", label: "Refunded" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <input style={inputStyle} placeholder="Search order ID, customer or product" value={search} onChange={(e) => setSearch(e.target.value)} />

      {!data && !error && <div style={{ ...card, color: "var(--text-muted)" }}>Loading…</div>}
      {data && list.length === 0 && <div style={{ ...card, color: "var(--text-muted)" }}>No purchases match.</div>}

      {list.map((p) => {
        const st = LABEL[p.status] || { text: p.status, tone: "wait" as const };
        const profit = p.paid - p.cost;
        return (
          <div key={p.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, wordBreak: "break-word" }}>{p.title}</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", wordBreak: "break-word" }}>
                  {p.quantity} × · {p.name ? `${p.name} · ` : ""}{p.email}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{fmtDate(p.at)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800 }}>{money(p.paid)}</div>
                <div style={{ marginTop: 6 }}><Pill tone={st.tone}>{st.text}</Pill></div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)" }}>
              {p.status === "completed" && (
                <>
                  <span>Cost <b style={{ color: "var(--text)" }}>{money(p.cost)}</b></span>
                  <span>Profit <b style={{ color: profit < 0 ? "var(--danger)" : "var(--success)" }}>{money(profit)}</b></span>
                </>
              )}
              <span>Order <b style={{ color: "var(--text)" }}>{p.id.slice(0, 8)}</b></span>
              {p.supplierOrderId && <span>YPG order <b style={{ color: "var(--text)" }}>{p.supplierOrderId}</b></span>}
            </div>

            {p.status === "needs_review" && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#d97706" }}>
                The customer was charged but YPG Media&apos;s result is unknown{p.reason ? ` (${p.reason})` : ""}. Check this order in your YPG Media
                dashboard, then deliver it or refund the customer.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
