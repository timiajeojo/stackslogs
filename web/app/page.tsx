"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API, naira, useUser } from "../lib/store";

const labelStyle = { display: "block", fontSize: 13, color: "var(--text-muted)", margin: "0 0 6px" } as const;
const fieldStyle = { width: "100%", margin: "0 0 16px" } as const;

export default function SettingsPage() {
  const { user, setUser, logout } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState({ firstName: "", lastName: "", phone: "" });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // useUser sends them to /login
    async function load() {
      try {
        const res = await fetch(`${API}/api/account`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          setLoadError(`error ${res.status}`);
          return;
        }
        const d = await res.json();
        setEmail(d.email || "");
        setFirstName(d.firstName || "");
        setLastName(d.lastName || "");
        setPhone(d.phone || "");
        setSaved({ firstName: d.firstName || "", lastName: d.lastName || "", phone: d.phone || "" });
      } catch {
        setLoadError("network error");
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  const dirty =
    firstName.trim() !== saved.firstName || lastName.trim() !== saved.lastName || phone.trim() !== saved.phone;

  async function save() {
    if (saving || !dirty) return;
    setSaving(true);
    setMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/account`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "error", text: d.error || "Couldn't save your changes. Please try again." });
        return;
      }
      setFirstName(d.firstName || "");
      setLastName(d.lastName || "");
      setPhone(d.phone || "");
      setSaved({ firstName: d.firstName || "", lastName: d.lastName || "", phone: d.phone || "" });
      setUser((u) => (u ? { ...u, firstName: d.firstName || "" } : u));
      setMsg({ type: "ok", text: "Your changes have been saved." });
    } catch {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/account`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setDeleteError(d.error || "Couldn't delete your account. Please try again.");
        setDeleting(false);
        return;
      }
      logout(); // clears the token and sends them to /login
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      <nav className="dash">
        <div className="nav-left">
          <button className="burger" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
            <span /><span /><span />
          </button>
        </div>
        <Link href="/dashboard" className="logo">
          <span className="mark">S</span>StacksLogs
        </Link>
        <div className="nav-right">
          <div className="avatar">{(email || user?.email || "")[0]?.toUpperCase() || ""}</div>
        </div>
      </nav>

      <div className={`drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <Link href="/dashboard" className="logo" onClick={() => setDrawerOpen(false)}>
            <span className="mark">S</span>StacksLogs
          </Link>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">✕</button>
        </div>
        <div className="drawer-section-label">Home</div>
        <Link href="/dashboard" className="drawer-item" onClick={() => setDrawerOpen(false)}>Dashboard</Link>
        <div className="drawer-section-label">Account</div>
        <Link href="/orders" className="drawer-item" onClick={() => setDrawerOpen(false)}>My orders</Link>
        <Link href="/wallet" className="drawer-item" onClick={() => setDrawerOpen(false)}>Add funds</Link>
        <Link href="/settings" className="drawer-item active" onClick={() => setDrawerOpen(false)}>Settings</Link>
        <div className="drawer-item">Customer care</div>
        <div className="drawer-spacer" />
        <div className="drawer-logout">
          <button className="drawer-item logout" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="dash-main">
        <h1 style={{ fontSize: 26, margin: "0 0 18px" }}>Settings</h1>

        {!loaded && <p style={{ color: "var(--text-muted)" }}>Loading your details...</p>}
        {loaded && !!loadError && (
          <p style={{ color: "var(--text-muted)" }}>Couldn't load your details right now ({loadError}). Please refresh in a moment.</p>
        )}

        {loaded && !loadError && (
          <>
            <section
              style={{
                background: "var(--surface, #0f1626)",
                border: "1px solid var(--border, rgba(128,128,128,0.25))",
                borderRadius: 16,
                padding: 18,
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 17, margin: "0 0 16px" }}>Profile</h2>

              <label style={labelStyle} htmlFor="firstName">First name</label>
              <input
                id="firstName"
                className="search-input"
                style={fieldStyle}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={100}
                autoComplete="given-name"
              />

              <label style={labelStyle} htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                className="search-input"
                style={fieldStyle}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={100}
                autoComplete="family-name"
              />

              <label style={labelStyle} htmlFor="email">Email</label>
              <input
                id="email"
                className="search-input"
                style={{ ...fieldStyle, margin: "0 0 4px", opacity: 0.6, cursor: "not-allowed" }}
                value={email}
                readOnly
                disabled
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>Your email can't be changed.</p>

              <label style={labelStyle} htmlFor="phone">Phone number</label>
              <input
                id="phone"
                className="search-input"
                style={fieldStyle}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                inputMode="tel"
                maxLength={30}
                autoComplete="tel"
              />

              {msg && (
                <p style={{ fontSize: 13, margin: "0 0 12px", color: msg.type === "ok" ? "#22c55e" : "#f87171" }}>{msg.text}</p>
              )}

              <button className="btn btn-blue" onClick={save} disabled={saving || !dirty}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </section>

            <section
              style={{
                background: "var(--surface, #0f1626)",
                border: "1px solid rgba(248,113,113,0.4)",
                borderRadius: 16,
                padding: 18,
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 17, margin: "0 0 8px", color: "#f87171" }}>Delete account</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
                This permanently closes your account and removes your personal details. You won't be able to log in again.
              </p>
              <button
                className="btn"
                style={{ background: "#dc2626", color: "#fff", border: "none" }}
                onClick={() => {
                  setDeleteError("");
                  setConfirmOpen(true);
                }}
              >
                Delete account
              </button>
            </section>
          </>
        )}
      </main>

      {confirmOpen && (
        <div
          onClick={() => !deleting && setConfirmOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 400, background: "var(--surface, #0f1626)", color: "var(--text, #fff)",
              border: "1px solid var(--border-strong, rgba(128,128,128,0.4))", borderRadius: 16, padding: 20,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Delete your account?</div>
            <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 10px" }}>
              This can't be undone. You'll be logged out and won't be able to sign in with this account again.
            </p>
            {(user?.balance || 0) > 0 && (
              <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 10px", color: "#f59e0b" }}>
                Your remaining balance of ₦{naira(user?.balance || 0)} will be lost.
              </p>
            )}
            {deleteError && <p style={{ fontSize: 13, color: "#f87171", margin: "0 0 10px" }}>{deleteError}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</button>
              <button
                className="btn"
                style={{ background: "#dc2626", color: "#fff", border: "none" }}
                onClick={deleteAccount}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="site-footer">
        <div className="foot-inner" style={{ justifyContent: "center", textAlign: "center" }}>
          <span>© 2026 StacksLogs</span>
        </div>
      </footer>
    </>
  );
}
