"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAVY = "#0b1220";
const NAVY_2 = "#111a2e";
const LINE = "rgba(255,255,255,0.08)";

const ITEMS: { label: string; icon: string; href?: string }[] = [
  { label: "Dashboard", icon: "📊", href: "/admin" },
  { label: "Transactions", icon: "💳" },
  { label: "Users", icon: "👥" },
  { label: "Purchases", icon: "🛒" },
  { label: "YPG Media", icon: "🌐" },
  { label: "Reports", icon: "📈" },
  { label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();

  function logout() {
    try {
      localStorage.removeItem("token");
    } catch {}
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <style>{`
        .adm-side{position:fixed;top:0;left:0;bottom:0;width:260px;background:${NAVY};color:#e6ebf5;z-index:60;
          transform:translateX(-100%);transition:transform .2s ease;display:flex;flex-direction:column;border-right:1px solid ${LINE}}
        .adm-side.open{transform:none}
        .adm-scrim{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:50}
        .adm-main{padding:16px 16px 40px;max-width:1200px;margin:0 auto}
        .adm-link{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;color:#c7d0e2;font-size:15px;
          text-decoration:none;border:0;background:none;width:100%;text-align:left;cursor:pointer;font-family:inherit}
        .adm-link:hover:not(.off){background:${NAVY_2}}
        .adm-link.active{background:var(--blue);color:#fff}
        .adm-link.off{opacity:.45;cursor:not-allowed}
        @media (min-width:980px){
          .adm-side{transform:none}
          .adm-scrim,.adm-burger{display:none}
          .adm-wrap{margin-left:260px}
        }
      `}</style>

      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}

      <aside className={`adm-side${open ? " open" : ""}`}>
        <div style={{ padding: "20px 18px 14px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ fontWeight: 800, fontSize: 19 }}>StacksLogs</div>
          <div style={{ fontSize: 12, color: "#8b97b0", marginTop: 2 }}>Admin panel</div>
        </div>
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4, flex: 1, overflowY: "auto" }}>
          {ITEMS.map((it) =>
            it.href ? (
              <Link
                key={it.label}
                href={it.href}
                onClick={() => setOpen(false)}
                className={`adm-link${path === it.href ? " active" : ""}`}
              >
                <span aria-hidden>{it.icon}</span>
                {it.label}
              </Link>
            ) : (
              <span key={it.label} className="adm-link off" title="Coming soon">
                <span aria-hidden>{it.icon}</span>
                {it.label}
              </span>
            )
          )}
        </div>
        <div style={{ padding: 10, borderTop: `1px solid ${LINE}`, display: "flex", flexDirection: "column", gap: 4 }}>
          <Link href="/dashboard" className="adm-link">
            <span aria-hidden>🏠</span>Back to site
          </Link>
          <button className="adm-link" onClick={logout}>
            <span aria-hidden>🚪</span>Logout
          </button>
        </div>
      </aside>

      <div className="adm-wrap">
        <header
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
            background: NAVY, color: "#fff", position: "sticky", top: 0, zIndex: 40,
          }}
        >
          <button
            className="adm-burger"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            style={{ background: "none", border: 0, color: "#fff", fontSize: 22, cursor: "pointer", lineHeight: 1 }}
          >
            ☰
          </button>
          <div style={{ fontWeight: 700 }}>Admin</div>
        </header>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
