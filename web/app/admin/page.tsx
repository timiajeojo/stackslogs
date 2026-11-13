"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API, naira } from "../lib/store";

interface Stats {
  totalDeposits: number;
  unusedDeposits: number;
  usedDeposits: number;
  ypgReserve: number;
  totalYpgFunding: number;
  totalYpgFundingSource: "calculated" | "records";
  grossProfit: number;
  netProfit: number;
  ypgBalance: number | null;
  ypgBalanceError: string | null;
  breakdown: {
    depositCount: number;
    completedOrders: number;
    paystackFees: number;
    paystackFeesSource: "paystack" | "mixed" | "estimated";
    fundingFees: number;
    otherExpenses: number;
    ordersNeedingReview: number;
    needsReviewAmount: number;
  };
  generatedAt: string;
}

interface LedgerRecord {
  id: string;
  kind: "funding" | "funding_fee" | "expense";
  amount: number; // kobo
  note: string | null;
  createdAt: string;
}

const KIND_LABEL: Record<LedgerRecord["kind"], string> = {
  funding: "YPG Media funding",
  funding_fee: "YPG Media funding fee",
  expense: "Other expense",
};

const money = (kobo: number) => `${kobo < 0 ? "-" : ""}₦${naira(Math.abs(kobo))}`;

const cardStyle: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 16,
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const [kind, setKind] = useState<LedgerRecord["kind"]>("funding_fee");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, l] = await Promise.all([api("/stats"), api("/ledger")]);
      setStats(s);
      setRecords(l.records || []);
    } catch (e: any) {
      if (e.message !== "forbidden" && e.message !== "signed out") setError(e.message || "Couldn't load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function addRecord() {
    setFormError("");
    const value = Number(amount);
    if (!value || value <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }
    setSaving(true);
    try {
      await api("/ledger", { method: "POST", body: JSON.stringify({ kind, amount: value, note }) });
      setAmount("");
      setNote("");
      await load();
    } catch (e: any) {
      setFormError(e.message || "Couldn't save the record.");
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(r: LedgerRecord) {
    if (!confirm(`Delete this record? ${KIND_LABEL[r.kind]}: ${money(r.amount)}`)) return;
    try {
      await api(`/ledger/${r.id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      alert(e.message || "Couldn't delete the record.");
    }
  }

  const b = stats?.breakdown;
  const cards: { label: string; value: string; hint: string; tone?: "good" | "bad" }[] = stats && b
    ? [
        { label: "Total customer deposits", value: money(stats.totalDeposits), hint: `${b.depositCount} successful deposit${b.depositCount === 1 ? "" : "s"}` },
        { label: "Unused deposits", value: money(stats.unusedDeposits), hint: "Deposited by customers but not spent yet" },
        { label: "Used deposits", value: money(stats.usedDeposits), hint: `Spent on ${b.completedOrders} completed purchase${b.completedOrders === 1 ? "" : "s"}` },
        { label: "YPG Media replenishment reserve", value: money(stats.ypgReserve), hint: "Actual YPG Media cost of successful customer purchases" },
        { label: "Total YPG Media funding", value: money(stats.totalYpgFunding), hint: stats.totalYpgFundingSource === "calculated" ? "Calculated: your live YPG Media balance plus what you've spent there through the site" : "From the funding records below (YPG Media balance was unavailable)" },
        { label: "Gross profit", value: money(stats.grossProfit), hint: "What customers paid minus what YPG Media charged", tone: stats.grossProfit < 0 ? "bad" : "good" },
        {
          label: "Net profit",
          value: money(stats.netProfit),
          hint: `After Paystack fees (${money(b.paystackFees)}${b.paystackFeesSource === "paystack" ? "" : b.paystackFeesSource === "mixed" ? ", partly estimated" : ", estimated"}), funding fees (${money(b.fundingFees)}) and other expenses (${money(b.otherExpenses)})`,
          tone: stats.netProfit < 0 ? "bad" : "good",
        },
        {
          label: "Current YPG Media balance",
          value: stats.ypgBalance === null ? "Unavailable" : money(stats.ypgBalance),
          hint: stats.ypgBalance === null ? stats.ypgBalanceError || "Couldn't reach YPG Media" : "Live from your YPG Media account",
          tone: stats.ypgBalance === null ? "bad" : undefined,
        },
      ]
    : [];

  return (
    <>
      <nav className="dash">
        <div className="nav-left">
          <Link href="/dashboard" className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 13.5 }}>
            ← Dashboard
          </Link>
        </div>
        <div className="logo">
          <span className="mark">S</span>StacksLogs Admin
        </div>
        <div className="nav-right" />
      </nav>

      <main className="dash-main">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Admin dashboard</h1>
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {stats ? `Updated ${new Date(stats.generatedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}` : "Business overview"}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {forbidden && (
          <div style={{ ...cardStyle, maxWidth: 520 }}>
            <strong>You don't have access to this page.</strong>
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>This area is for admins only.</span>
          </div>
        )}

        {!forbidden && error && <p style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</p>}
        {!forbidden && loading && !stats && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}

        {!forbidden && b && b.ordersNeedingReview > 0 && (
          <div
            style={{
              marginBottom: 20, padding: "14px 18px", borderRadius: 12, fontSize: 14, lineHeight: 1.5,
              border: "1px solid rgba(232,180,77,0.5)", background: "rgba(232,180,77,0.1)",
            }}
          >
            <strong>{b.ordersNeedingReview} order{b.ordersNeedingReview === 1 ? "" : "s"} need review</strong> ({money(b.needsReviewAmount)} charged
            to customers). YPG Media's result is unknown, so these are not counted in used deposits or profit until they're resolved.
          </div>
        )}

        {!forbidden && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, marginBottom: 36 }}>
            {cards.map((c) => (
              <div key={c.label} style={cardStyle}>
                <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{c.label}</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 26, fontWeight: 600, wordBreak: "break-word",
                    color: c.tone === "good" ? "var(--success)" : c.tone === "bad" ? "var(--danger)" : "var(--text)",
                  }}
                >
                  {c.value}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.45 }}>{c.hint}</div>
              </div>
            ))}
          </div>
        )}

        {!forbidden && stats && (
          <section style={{ ...cardStyle, gap: 14, padding: 22 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Fees &amp; expenses</h2>
              <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Everything else on this page comes from your site, Paystack and YPG Media automatically. Add only what they can't see:
                the fee you pay when funding YPG Media, and any other business expense. These come off "Net profit".
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select value={kind} onChange={(e) => setKind(e.target.value as LedgerRecord["kind"])} disabled={saving}>
                <option value="funding_fee">YPG Media funding fee</option>
                <option value="expense">Other expense</option>
              </select>
              <input
                className="search-input"
                style={{ flex: "1 1 140px", minWidth: 120 }}
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="Amount (₦)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={saving}
              />
              <input
                className="search-input"
                style={{ flex: "2 1 200px" }}
                placeholder="Note (optional)"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={saving}
              />
              <button className="btn btn-blue" onClick={addRecord} disabled={saving}>
                {saving ? "Saving..." : "Add record"}
              </button>
            </div>
            {formError && <p style={{ fontSize: 13, color: "var(--danger)" }}>{formError}</p>}

            {records.length === 0 ? (
              <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No records yet.</p>
            ) : (
              <div>
                {records.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{KIND_LABEL[r.kind]}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-muted)", wordBreak: "break-word" }}>
                        {new Date(r.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                        {r.note ? ` · ${r.note}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      <span className="mono" style={{ fontWeight: 600 }}>{money(r.amount)}</span>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "6px 12px", fontSize: 13, color: "var(--danger)" }}
                        onClick={() => removeRecord(r)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
