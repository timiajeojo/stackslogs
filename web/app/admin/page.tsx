"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { API, naira } from "../lib/store";

interface Stats {
  days: number;
  totalDeposits: number;
  unusedDeposits: number;
  usedDeposits: number;
  ypgReserve: number;
  totalYpgFunding: number;
  grossProfit: number;
  netProfit: number;
  ypgBalance: number | null;
  ypgBalanceError: string | null;
  breakdown: {
    depositCount: number;
    completedOrders: number;
    paystackFees: number;
    paystackFeesEstimatedCount: number;
    fundingFees: number;
    otherExpenses: number;
    ordersNeedingReview: number;
    needsReviewAmount: number;
  };
  series: { date: string; deposits: number; purchases: number; profit: number }[];
  quick: { users: number; purchases: number; transactions: number };
  activity: { kind: "deposit" | "purchase"; amount: number; title: string | null; who: string; at: string }[];
}
interface Topup { id: string; amount: number; fee: number; note: string | null; createdAt: string }

const money = (k: number) => `${k < 0 ? "-" : ""}₦${naira(Math.abs(k))}`;
const card: CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18 };

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Metric({ icon, tint, label, value, sub }: { icon: string; tint: string; label: string; value: string; sub?: string }) {
  return (
    <div style={{ ...card, display: "flex", gap: 14, alignItems: "center" }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: tint, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, wordBreak: "break-word" }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function LineChart({ series }: { series: Stats["series"] }) {
  const W = 640, H = 220, P = { l: 8, r: 8, t: 12, b: 24 };
  const lines: { key: "deposits" | "purchases" | "profit"; color: string; label: string }[] = [
    { key: "deposits", color: "#3b82f6", label: "Deposits" },
    { key: "purchases", color: "#22c55e", label: "Purchases" },
    { key: "profit", color: "#f59e0b", label: "Profit" },
  ];
  const max = Math.max(1, ...series.flatMap((s) => [s.deposits, s.purchases, s.profit]));
  const x = (i: number) => P.l + (series.length < 2 ? 0 : (i * (W - P.l - P.r)) / (series.length - 1));
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--border)" strokeDasharray="4 4" />
        ))}
        {lines.map((l) => (
          <polyline key={l.key} fill="none" stroke={l.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
            points={series.map((s, i) => `${x(i)},${y(s[l.key])}`).join(" ")} />
        ))}
        {series.length > 0 && (
          <>
            <text x={P.l} y={H - 6} fontSize="11" fill="var(--text-dim)">{series[0].date.slice(5)}</text>
            <text x={W - P.r} y={H - 6} fontSize="11" fill="var(--text-dim)" textAnchor="end">{series[series.length - 1].date.slice(5)}</text>
          </>
        )}
      </svg>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
        {lines.map((l) => (
          <span key={l.key}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: l.color, marginRight: 6 }} />{l.label}</span>
        ))}
      </div>
    </div>
  );
}

function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <svg viewBox="0 0 140 140" width={150} height={150}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="18" />
        {total > 0 && parts.map((p) => {
          const len = (Math.max(0, p.value) / total) * C;
          const el = (
            <circle key={p.label} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="18"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" />
          );
          off += len;
          return el;
        })}
      </svg>
      <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
        {parts.map((p) => (
          <div key={p.label}><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: p.color, marginRight: 8 }} />
            {p.label}: <b>{money(p.value)}</b></div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); throw new Error("signed out"); }
    const res = await fetch(`${API}/api/admin${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    });
    if (res.status === 401) { localStorage.removeItem("token"); router.push("/login"); throw new Error("signed out"); }
    if (res.status === 403) { setForbidden(true); throw new Error("forbidden"); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, t] = await Promise.all([api(`/stats?days=${days}`), api("/topups")]);
      setStats(s);
      setTopups(t.topups || []);
    } catch (e: any) {
      if (e.message !== "forbidden" && e.message !== "signed out") setError(e.message || "Couldn't load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, [api, days]);

  useEffect(() => { load(); }, [load]);

  async function addTopup() {
    setFormError("");
    const a = Number(amount);
    if (!a || a <= 0) { setFormError("Enter the amount you sent."); return; }
    setSaving(true);
    try {
      await api("/topups", { method: "POST", body: JSON.stringify({ amount: a, fee: fee === "" ? 0 : Number(fee), note }) });
      setAmount(""); setFee(""); setNote("");
      await load();
    } catch (e: any) {
      setFormError(e.message || "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTopup(id: string) {
    if (!confirm("Delete this top-up?")) return;
    try { await api(`/topups/${id}`, { method: "DELETE" }); await load(); } catch (e: any) { setFormError(e.message); }
  }

  if (forbidden) {
    return <div style={{ ...card, textAlign: "center" }}><h2>Admins only</h2><p style={{ color: "var(--text-muted)" }}>This account doesn&apos;t have access to the admin panel.</p></div>;
  }

  const input: CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--text)", font: "inherit" };
  const b = stats?.breakdown;
  const expenses = b ? b.paystackFees + b.fundingFees + b.otherExpenses : 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Dashboard</h1>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Overview of your store</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="select-shell">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 12 months</option>
            </select>
          </div>
          <button className="btn" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
        </div>
      </div>

      {error && <div style={{ ...card, color: "var(--danger)" }}>{error}</div>}
      {stats?.ypgBalanceError && <div style={{ ...card, color: "var(--danger)" }}>YPG Media balance unavailable: {stats.ypgBalanceError}</div>}

      {!stats ? (
        !error && <div style={{ ...card, color: "var(--text-muted)" }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            <Metric icon="💰" tint="rgba(59,130,246,.18)" label="Total deposits" value={money(stats.totalDeposits)} sub={`${b!.depositCount} deposits`} />
            <Metric icon="👛" tint="rgba(168,85,247,.18)" label="Unused deposits" value={money(stats.unusedDeposits)} sub="User wallet balances, now" />
            <Metric icon="🛍️" tint="rgba(34,197,94,.18)" label="Used deposits" value={money(stats.usedDeposits)} sub={`${b!.completedOrders} completed orders`} />
            <Metric icon="🏦" tint="rgba(245,158,11,.18)" label="YPG Media reserve" value={money(stats.ypgReserve)} sub="Cost of completed orders" />
            <Metric icon="📥" tint="rgba(14,165,233,.18)" label="Total YPG Media funding" value={money(stats.totalYpgFunding)} sub="From logged top-ups" />
            <Metric icon="🌐" tint="rgba(20,184,166,.18)" label="YPG Media balance" value={stats.ypgBalance === null ? "Unavailable" : money(stats.ypgBalance)} sub="Live, now" />
            <Metric icon="📈" tint="rgba(34,197,94,.18)" label="Gross profit" value={money(stats.grossProfit)} sub="Used deposits − reserve" />
            <Metric icon="✅" tint="rgba(34,197,94,.18)" label="Net profit" value={money(stats.netProfit)} sub={`After ${money(expenses)} expenses`} />
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Overview</h3>
              <LineChart series={stats.series} />
            </div>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Where the money went</h3>
              <Donut parts={[
                { label: "Reserve (YPG cost)", value: stats.ypgReserve, color: "#f59e0b" },
                { label: "Fees & expenses", value: expenses, color: "#ef4444" },
                { label: "Net profit", value: Math.max(0, stats.netProfit), color: "#22c55e" },
              ]} />
              {b!.paystackFeesEstimatedCount > 0 && (
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>{b!.paystackFeesEstimatedCount} Paystack fee(s) are estimates.</div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Quick stats</h3>
              {[["Total users", stats.quick.users], ["Completed purchases", stats.quick.purchases], ["Completed transactions", stats.quick.transactions],
                ["Orders needing review", b!.ordersNeedingReview]].map(([l, v]) => (
                <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{l}</span><b>{v}</b>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Recent activity</h3>
              {stats.activity.length === 0 && <div style={{ color: "var(--text-muted)" }}>Nothing yet.</div>}
              {stats.activity.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, wordBreak: "break-word" }}>{a.kind === "deposit" ? "Deposit" : a.title || "Purchase"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{a.who} · {ago(a.at)}</div>
                  </div>
                  <b style={{ color: a.kind === "deposit" ? "var(--success)" : "var(--text)", whiteSpace: "nowrap" }}>{a.kind === "deposit" ? "+" : ""}{money(a.amount)}</b>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0 }}>YPG Media top-ups</h3>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>Log each time you fund YPG Media, with any fee you paid. This drives “Total YPG Media funding” and net profit.</div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
              <input style={input} type="number" inputMode="decimal" min="0" placeholder="Amount sent (₦)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <input style={input} type="number" inputMode="decimal" min="0" placeholder="Fee paid (₦, optional)" value={fee} onChange={(e) => setFee(e.target.value)} />
              <input style={input} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-blue" onClick={addTopup} disabled={saving}>{saving ? "Saving…" : "Add top-up"}</button>
            </div>
            {formError && <div style={{ color: "var(--danger)", marginTop: 8, fontSize: 14 }}>{formError}</div>}
            <div style={{ marginTop: 14 }}>
              {topups.map((t, i) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                  <div style={{ minWidth: 0 }}>
                    <div><b>{money(t.amount)}</b>{t.fee > 0 && <span style={{ color: "var(--text-muted)" }}> · fee {money(t.fee)}</span>}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{new Date(t.createdAt).toLocaleDateString()}{t.note ? ` · ${t.note}` : ""}</div>
                  </div>
                  <button className="btn" onClick={() => removeTopup(t.id)} aria-label="Delete top-up">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
