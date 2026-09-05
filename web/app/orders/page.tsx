"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab =
  | "all"
  | "completed"
  | "processing"
  | "refunds"
  | "cancelled";

export default function OrdersPage() {
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("all");
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

  const tabs: {
    id: Tab;
    label: string;
    count: number;
  }[] = [
    {
      id: "all",
      label: "All",
      count: 0,
    },
    {
      id: "completed",
      label: "Completed",
      count: 0,
    },
    {
      id: "processing",
      label: "Processing",
      count: 0,
    },
    {
      id: "refunds",
      label: "Refunds",
      count: 0,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: 0,
    },
  ];

  return (
    <>
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

      <div
        className={`drawer-overlay ${
          drawerOpen ? "open" : ""
        }`}
        onClick={closeDrawer}
      />

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
          Dashboard
        </Link>

        <div className="drawer-section-label">
          Account
        </div>

        <Link
          href="/orders"
          className="drawer-item active"
          onClick={closeDrawer}
        >
          My orders
        </Link>

        <Link
          href="/wallet"
          className="drawer-item"
          onClick={closeDrawer}
        >
          Add funds
        </Link>

        <div className="drawer-item">
          Settings
        </div>

        <div className="drawer-item">
          Customer care
        </div>

        <div className="drawer-spacer" />

        <div className="drawer-logout">
          <button
            className="drawer-item logout"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="dash-main orders-main">
        <div className="orders-head-card">
          <div className="orders-head-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 2h6a2 2 0 0 1 2 2v16l-5-3-5 3V4a2 2 0 0 1 2-2Z" />
              <path d="M9 8h6" />
              <path d="M9 12h6" />
            </svg>
          </div>

          <div>
            <h1>My orders</h1>

            <p className="orders-sub">
              Total{" "}
              <span className="cur">₦</span>
              <span className="mono">0.00</span> spent
            </p>
          </div>
        </div>

        <div className="status-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`status-tab ${
                activeTab === tab.id ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}{" "}
              <span className="mono">
                · {tab.count}
              </span>
            </button>
          ))}
        </div>

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
                <rect
                  x="3"
                  y="7"
                  width="18"
                  height="13"
                  rx="2"
                />
                <path d="M8 7V5a4 4 0 0 1 8 0v2" />
              </svg>
            </div>

            <h2>Order history</h2>
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
                  x="3"
                  y="7"
                  width="18"
                  height="13"
                  rx="2"
                />
                <path d="M8 7V5a4 4 0 0 1 8 0v2" />
              </svg>
            </div>

            <h3>No orders yet</h3>

            <p>
              You haven&apos;t bought any accounts yet.
              Explore the catalog to get started.
            </p>

            <Link
              href="/dashboard"
              className="btn btn-blue"
            >
              Browse accounts
            </Link>
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