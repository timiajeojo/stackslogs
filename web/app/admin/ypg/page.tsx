"use client";

import { useCallback, useEffect, useState } from "react";
import { Forbidden, PageTitle, StatCard, card, fmtDate, inputStyle, money, useAdminApi } from "../shared";

// Where "Fund YPG Media" opens. Change this to YPG Media's own deposit page if you have the link.
const FUND_URL = "https://youngpgmedia.com.ng";

interface Topup {
  id: string;
  amount: number;
  fee: number;
  note: string | null;
  createdAt: string;
}
interface Data {
  balance: number | null;
  balanceError: string | null;
  totalFunded: number;
  fundingFees: number;
  topupCount: number;
  topups: Topup[];
}

export default function AdminYpg() {
  const { api, forbidden } = useAdminApi();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setRefreshing(true);
    try {
      setData(await api("/ypg"));
    } catch (e: any) {
      if (e.message !== "forbidden" && e.message !== "signed out") setError(e.message || "Couldn't load YPG Media.");
    } finally {
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function addTopup() {
    setFormError("");
    const a = Number(amount);
    if (!a || a <= 0) {
      setFormError("Enter the amount you sent.");
      return;
    }
    setSaving(true);
    try {
      await api("/topups", { method: "POST", body: JSON.stringify({ amount: a, fee: fee === "" ? 0 : Number(fee), note }) });
      setAmount("");
      setFee("");
      setNote("");
      await load();
    } catch (e: any) {
      setFormError(e.message || "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTopup(id: string) {
    if (!confirm("Delete this top-up?")) return;
    try {
      await api(`/topups/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setFormError(e.message);
    }
  }

  if (forbidden) return <Forbidden />;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageTitle
        title="YPG Media"
        subtitle="Your YPG Media balance and funding history"
        right={
          <a href={FUND_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>
            Fund YPG Media ↗
          </a>
        }
      />

      {error && <div style={{ ...card, color: "var(--danger)" }}>{error}</div>}

      <StatCard
        icon="🌐"
        tint="rgba(99,102,241,.16)"
        label="Current YPG Media Balance"
        value={!data ? "…" : data.balance === null ? "Unavailable" : money(data.balance)}
        sub={data?.balanceError ? data.balanceError : "Live from YPG Media"}
        right={
          <button className="btn" onClick={load} disabled={refreshing} style={{ alignSelf: "flex-start" }}>
            {refreshing ? "…" : "Refresh"}
          </button>
        }
      />
      <StatCard
        icon="📊"
        tint="rgba(20,184,166,.18)"
        label="Total Funded"
        value={data ? money(data.totalFunded) : "…"}
        sub={data ? `${data.topupCount} top-ups recorded` : undefined}
      />
      <StatCard
        icon="🧾"
        tint="rgba(245,158,11,.18)"
        label="Funding Fees"
        value={data ? money(data.fundingFees) : "…"}
        sub="Fees paid when funding YPG Media"
      />

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Add a top-up</h3>
        <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 14 }}>
          Each time you fund YPG Media, record the amount you sent and any fee you paid. Total Funded and net profit use these records.
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <input style={inputStyle} type="number" inputMode="decimal" min="0" placeholder="Amount sent (₦)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input style={inputStyle} type="number" inputMode="decimal" min="0" placeholder="Fee paid (₦)" value={fee} onChange={(e) => setFee(e.target.value)} />
        </div>
        <input style={{ ...inputStyle, marginTop: 10 }} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-blue" onClick={addTopup} disabled={saving} style={{ width: "100%", marginTop: 12 }}>
          {saving ? "Saving…" : "Add top-up"}
        </button>
        {formError && <div style={{ color: "var(--danger)", marginTop: 8, fontSize: 14 }}>{formError}</div>}
      </div>

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Funding history</h3>
        {data && data.topups.length === 0 && <div style={{ color: "var(--text-muted)" }}>No top-ups recorded yet.</div>}
        {data?.topups.map((t, i) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "12px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
            <div style={{ minWidth: 0 }}>
              <div>
                <b>{money(t.amount)}</b>
                {t.fee > 0 && <span style={{ color: "var(--text-muted)" }}> · fee {money(t.fee)}</span>}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-dim)", wordBreak: "break-word" }}>
                {fmtDate(t.createdAt, false)}
                {t.note ? ` · ${t.note}` : ""}
              </div>
            </div>
            <button className="btn" onClick={() => removeTopup(t.id)} aria-label="Delete top-up">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
