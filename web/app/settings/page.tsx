"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Drawer from "../components/Drawer";
import { API, naira, useUser } from "../lib/store";

const labelStyle = { display: "block", fontSize: 13, color: "var(--text-muted)", margin: "0 0 6px" } as const;
const fieldStyle = { width: "100%", margin: "0 0 16px" } as const;

type Theme = "dark" | "light" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  margin = "0 0 16px",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  margin?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", margin }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        className="search-input"
        style={{ width: "100%", paddingRight: 44 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        maxLength={128}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        style={{
          position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", padding: 6, cursor: "pointer",
          color: "var(--text-muted)", display: "flex", alignItems: "center",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {!show && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  );
}

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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [theme, setTheme] = useState<Theme>("system");
  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      if (t === "dark" || t === "light" || t === "system") setTheme(t);
    } catch {}
  }, []);

  function chooseTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  const hasFunds = (user?.balance || 0) > 0;

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

  const pwTooShort = newPassword.length > 0 && newPassword.length < 8;
  const pwMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const pwReady =
    !!currentPassword && newPassword.length >= 8 && newPassword === confirmPassword && !pwSaving;

  async function changePassword() {
    if (!pwReady) return;
    setPwSaving(true);
    setPwMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/account/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwMsg({ type: "error", text: d.error || "Couldn't change your password. Please try again." });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg({ type: "ok", text: "Your password has been changed." });
    } catch {
      setPwMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setPwSaving(false);
    }
  }

  async function deleteAccount() {
    if (deleting || hasFunds) return;
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
          <div className="avatar">{(user?.firstName || saved.firstName || email || user?.email || "")[0]?.toUpperCase() || ""}</div>
        </div>
      </nav>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} active="settings" onLogout={logout} />

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
                border: "1px solid var(--border, rgba(128,128,128,0.25))",
                borderRadius: 16,
                padding: 18,
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 17, margin: "0 0 16px" }}>Password</h2>

              <label style={labelStyle} htmlFor="currentPassword">Current password</label>
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />

              <label style={labelStyle} htmlFor="newPassword">New password</label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                margin="0 0 4px"
              />
              <p style={{ fontSize: 12, margin: "0 0 16px", color: pwTooShort ? "#f87171" : "var(--text-muted)" }}>
                At least 8 characters.
              </p>

              <label style={labelStyle} htmlFor="confirmPassword">Confirm new password</label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                margin="0 0 4px"
              />
              <p style={{ fontSize: 12, margin: "0 0 16px", color: "#f87171", minHeight: 16 }}>
                {pwMismatch ? "Passwords don't match." : ""}
              </p>

              {pwMsg && (
                <p style={{ fontSize: 13, margin: "0 0 12px", color: pwMsg.type === "ok" ? "#22c55e" : "#f87171" }}>
                  {pwMsg.text}
                </p>
              )}

              <button className="btn btn-blue" onClick={changePassword} disabled={!pwReady}>
                {pwSaving ? "Updating..." : "Confirm password change"}
              </button>
            </section>

            <section
              style={{
                background: "var(--surface, #0f1626)",
                border: "1px solid var(--border, rgba(128,128,128,0.25))",
                borderRadius: 16,
                padding: 18,
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 17, margin: "0 0 6px" }}>Appearance</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 14px" }}>
                Choose how StacksLogs looks. System follows your device setting.
              </p>
              <div role="radiogroup" aria-label="Theme" style={{ display: "flex", gap: 8 }}>
                {(["dark", "light", "system"] as Theme[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={theme === option}
                    onClick={() => chooseTheme(option)}
                    className={theme === option ? "btn btn-blue" : "btn btn-ghost"}
                    style={{ flex: 1, textTransform: "capitalize" }}
                  >
                    {option}
                  </button>
                ))}
              </div>
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
              {hasFunds && (
                <p style={{ fontSize: 13, color: "#f59e0b", margin: "0 0 14px", lineHeight: 1.5 }}>
                  You still have ₦{naira(user?.balance || 0)} in your account. Use up your balance before deleting your account.
                </p>
              )}
              <button
                className="btn"
                disabled={hasFunds}
                style={{
                  background: "#dc2626", color: "#fff", border: "none",
                  opacity: hasFunds ? 0.5 : 1, cursor: hasFunds ? "not-allowed" : "pointer",
                }}
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
          <span>©2026 StacksLogs</span>
        </div>
      </footer>
    </>
  );
}
