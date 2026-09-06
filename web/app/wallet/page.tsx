"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WalletPage() {
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatar, setAvatar] = useState("U");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    async function loadUser() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

        const response = await fetch(`${apiUrl}/api/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        const user = await response.json();

        setAvatar(user?.email?.[0]?.toUpperCase() || "U");
      } catch {
        setAvatar("U");
      }
    }

    loadUser();
  }, [router]);

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <>
      {/* Navigation */}
      <nav className="dash">
        <div className="nav-left">
          <button
            className="burger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <Link href="/dashboard" className="logo">
          <span className="mark">S</span>
          StacksLogs
        </Link>

        <div className="nav-right">
          <div className="avatar">{avatar}</div>
        </div>
      </nav>

      {/* Drawer overlay */}
      <div
        className={`drawer-overlay ${
          drawerOpen ? "open" : ""
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <aside className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <Link
            href="/dashboard"
            className="logo"
            onClick={closeDrawer}
          >
            <span className="mark">S</span>
            StacksLogs
          </Link>

          <button
            className="drawer-close"
            onClick={closeDrawer}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <div className="drawer-section-label">
          Home
        </div>

        <Link
          href="/dashboard"
          className="drawer-item"
          onClick={closeDrawer}
        >
          <span className="d-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </svg>
          </span>
          Dashboard
        </Link>

        <div className="drawer-section-label">
          Account
        </div>

        <Link
          href="/orders"
          className="drawer-item"
          onClick={closeDrawer}
        >
          <span className="d-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
              <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6" />
            </svg>
          </span>
          My orders
        </Link>

        <Link
          href="/wallet"
          className="drawer-item active"
          onClick={closeDrawer}
        >
          <span className="d-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="2.5"
                y="6"
                width="19"
                height="13"
                rx="2.5"
              />
              <path d="M2.5 10.5h19" />
              <path d="M6 15h4" />
            </svg>
          </span>
          Add funds
        </Link>

        <div className="drawer-item">
          <span className="d-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.65 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.65a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.35 9c.13.47.5.86 1.56 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04Z" />
            </svg>
          </span>
          Settings
        </div>

        <div className="drawer-item">
          <span className="d-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 13a9 9 0 0 1 18 0" />
              <path d="M21 13v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z" />
              <path d="M3 13v4a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2Z" />
            </svg>
          </span>
          Customer care
        </div>

        <div className="drawer-spacer" />

        <div className="drawer-logout">
          <button
            className="drawer-item logout"
            onClick={logout}
          >
            <span className="d-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="wallet-main">
        <div className="wallet-head-card">
          <div className="wallet-head-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="2.5"
                y="6"
                width="19"
                height="13"
                rx="2.5"
              />
              <path d="M2.5 10.5h19" />
              <path d="M6 15h4" />
            </svg>
          </div>

          <div className="wallet-head-text">
            <h1>Balance activity</h1>
            <p>
              Top-ups, spending, and balance activity
            </p>
          </div>

          <button className="btn btn-blue wallet-deposit-btn">
            + Deposit money
          </button>
        </div>

        {/* Balance statistics */}
        <div className="balance-grid">
          <div className="balance-stat">
            <div className="balance-stat-icon wallet">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect
                  x="2.5"
                  y="6"
                  width="19"
                  height="13"
                  rx="2.5"
                />
                <path d="M2.5 10.5h19" />
                <path d="M6 15h4" />
              </svg>
            </div>

            <div className="balance-stat-amount">
              <span>₦</span>0.00
            </div>

            <div className="balance-stat-label">
              Current balance
            </div>
          </div>

          <div className="balance-stat">
            <div className="balance-stat-icon deposit">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v10" />
                <path d="M8.5 10.5c0-1.7 1.6-3 3.5-3s3.5 1 3.5 2.3c0 3-7 1.4-7 4.3 0 1.4 1.6 2.4 3.5 2.4s3.5-1 3.5-2.4" />
              </svg>
            </div>

            <div className="balance-stat-amount">
              <span>₦</span>0.00
            </div>

            <div className="balance-stat-label">
              Total deposit
            </div>
          </div>

          <div className="balance-stat">
            <div className="balance-stat-icon used">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
                <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6" />
              </svg>
            </div>

            <div className="balance-stat-amount">
              <span>₦</span>0.00
            </div>

            <div className="balance-stat-label">
              Used
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="history-card">
          <div className="history-head">
            <div className="history-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 7h13l-3-3" />
                <path d="M17 17H4l3 3" />
              </svg>
            </div>

            <h2>Recent transactions</h2>
          </div>

          <div className="empty-state">
            <div className="empty-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect
                  x="2.5"
                  y="6"
                  width="19"
                  height="13"
                  rx="2.5"
                />
                <path d="M16.5 12.5h.01" />
                <path d="M2.5 10.5h19" />
              </svg>
            </div>

            <h3>No data available</h3>

            <p>No transactions yet.</p>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="foot-inner">
          <span>© 2026 StacksLogs</span>
          <span>support@stackslogs.com</span>
        </div>
      </footer>
    </>
  );
}