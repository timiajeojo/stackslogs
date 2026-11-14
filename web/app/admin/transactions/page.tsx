"use client";

import { useCallback, useEffect, useState } from "react";
import { Forbidden, PageTitle, Pill, RangeSelect, StatCard, Tabs, card, fmtDate, money, useAdminApi } from "../shared";

interface Tx {
  id: string;
  kind: "deposit" | "debit" | "credit";
  status: string;
  amount: number;
  name: string;
  email: string;
  title: string | null;
  at: string;
}
interface Data {
  totals: { deposits: number; depositCount: number; debits: number; debitCount: number };
  transactions: Tx[];
}

type Tab = "all" | "deposit" | "debit";

const STATUS: Record<string, { label: string; tone: "good" | "wait" | "bad" }> = {
  completed: { label: "Successful", tone: "good" },
  pending: { label: "Pending", tone: "wait" },
  failed: { label: "Failed", tone: "bad" },
};

export default function AdminTransactions() {
  const { api, forbidden } = useAdminApi();
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<Tab>("all");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await api(`/transactions?days=${days}`));
    } catch (e: any) {
      if (e.message !== "forbidden" && e.message !== "signed out") setError(e.message || "Couldn't load transactions.");
    }
  }, [api, days]);

  useEffect(() => {
    load();
  }, [load]);

  if (forbidden) return <Forbidden />;

  const list = (data?.transactions || []).filter((t) => tab === "all" || (tab === "deposit" ? t.kind === "deposit" : t.kind === "debit"));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageTitle title="Transactions" subtitle="Customer deposits and debits" right={<RangeSelect days={days} onChange={setDays} />} />

      {error && <div style={{ ...card, color: "var(--danger)" }}>{error}</div>}

      <StatCard
        icon="⬇️"
        tint="rgba(34,197,94,.16)"
        label="Total Deposits"
        value={data ? money(data.totals.deposits) : "…"}
        sub={data ? `${data.totals.depositCount} successful deposits` : undefined}
      />
      <StatCard
        icon="⬆️"
        tint="rgba(99,102,241,.16)"
        label="Total Debits"
        value={data ? money(data.totals.debits) : "…"}
        sub={data ? `${data.totals.debitCount} successful purchases` : undefined}
      />

      <div>
        <Tabs
          tabs={[
            { id: "all", label: "All" },
            { id: "deposit", label: "Deposits" },
            { id: "debit", label: "Debits" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div style={card}>
        {!data && !error && <div style={{ color: "var(--text-muted)" }}>Loading…</div>}
        {data && list.length === 0 && <div style={{ color: "var(--text-muted)" }}>No transactions in this period.</div>}
        {list.map((t, i) => {
          const st = STATUS[t.status] || { label: t.status, tone: "wait" as const };
          const plus = t.kind !== "debit";
          return (
            <div
              key={t.id}
              style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderTop: i ? "1px solid var(--border)" : "none" }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 22, fontWeight: 700,
                  background: plus ? "rgba(34,197,94,.16)" : "rgba(239,68,68,.14)",
                  color: plus ? "var(--success)" : "var(--danger)",
                }}
              >
                {plus ? "+" : "−"}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, wordBreak: "break-word" }}>
                  {t.kind === "deposit" ? "Deposit via Paystack" : t.kind === "debit" ? t.title || "Purchase" : "Credit"}
                </div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.name ? `${t.name} · ` : ""}{t.email}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{fmtDate(t.at)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, color: plus ? "var(--success)" : "var(--text)" }}>
                  {plus ? "+" : "-"}{money(t.amount)}
                </div>
                <div style={{ marginTop: 6 }}><Pill tone={st.tone}>{st.label}</Pill></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
