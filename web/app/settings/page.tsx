"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "profile" | "password" | "appearance";

export default function SettingsPage() {
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [avatar, setAvatar] = useState("U");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [appearance, setAppearance] = useState<
    "light" | "dark" | "system"
  >("dark");

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

        setEmail(user?.email || "");
        setFullName(
          [user?.firstName, user?.lastName]
            .filter(Boolean)
            .join(" ")
        );
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

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    // Profile API can be connected here later.
  }

  function savePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    // Password update API can be connected here later.
  }

  function deleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );

    if (!confirmed) return;

    // Account deletion API can be connected here later.
  }

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

        <Link
          href="/settings"
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.65 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.65a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.35 9c.13.47.5.86 1.56 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04Z" />
            </svg>
          </span>
          Settings
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
            className="drawer-item"
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

      <main className="settings-main">
        <div className="settings-head">
          <h1>Settings</h1>
          <p>Manage your profile and account settings</p>
        </div>

        <div className="settings-layout">
          <div className="settings-tabs">
            <button
              className={`settings-tab ${
                activeTab === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>

            <button
              className={`settings-tab ${
                activeTab === "password" ? "active" : ""
              }`}
              onClick={() => setActiveTab("password")}
            >
              Password
            </button>

            <button
              className={`settings-tab ${
                activeTab === "appearance" ? "active" : ""
              }`}
              onClick={() => setActiveTab("appearance")}
            >
              Appearance
            </button>
          </div>

          <div>
            {activeTab === "profile" && (
              <div className="settings-panel">
                <form
                  className="panel-card"
                  onSubmit={saveProfile}
                >
                  <h2>Profile information</h2>
                  <p className="panel-sub">
                    Update your name and email address
                  </p>

                  <div className="field">
                    <label htmlFor="fullName">
                      Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      placeholder="Your name"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="settingsEmail">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="settingsEmail"
                      value={email}
                      disabled
                      readOnly
                    />
                    <div className="field-note">
                      Your email address can't be changed.
                    </div>
                  </div>

                  <div className="field last-field">
                    <label htmlFor="phone">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value)
                      }
                      placeholder="e.g. 07048054133"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-blue"
                  >
                    Save
                  </button>
                </form>

                <div className="panel-card">
                  <h2>Delete account</h2>
                  <p className="panel-sub">
                    Delete your account and all of its
                    resources
                  </p>

                  <div className="warning-box">
                    <div className="w-title">
                      Warning
                    </div>

                    <p>
                      Please proceed with caution, this
                      cannot be undone.
                    </p>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={deleteAccount}
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div className="settings-panel">
                <form
                  className="panel-card"
                  onSubmit={savePassword}
                >
                  <h2>Update password</h2>

                  <p className="panel-sub">
                    Ensure your account is using a long,
                    random password to stay secure
                  </p>

                  <div className="field">
                    <label htmlFor="currentPassword">
                      Current password
                    </label>

                    <div className="input-shell">
                      <input
                        type={
                          showCurrent
                            ? "text"
                            : "password"
                        }
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) =>
                          setCurrentPassword(
                            e.target.value
                          )
                        }
                        placeholder="Current password"
                      />

                      <button
                        type="button"
                        className="toggle-pass"
                        onClick={() =>
                          setShowCurrent(!showCurrent)
                        }
                      >
                        {showCurrent ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="newPassword">
                      New password
                    </label>

                    <div className="input-shell">
                      <input
                        type={
                          showNew
                            ? "text"
                            : "password"
                        }
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(
                            e.target.value
                          )
                        }
                        placeholder="New password"
                      />

                      <button
                        type="button"
                        className="toggle-pass"
                        onClick={() =>
                          setShowNew(!showNew)
                        }
                      >
                        {showNew ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                  </div>

                  <div className="field last-field">
                    <label htmlFor="confirmPassword">
                      Confirm password
                    </label>

                    <div className="input-shell">
                      <input
                        type={
                          showConfirm
                            ? "text"
                            : "password"
                        }
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        placeholder="Confirm password"
                      />

                      <button
                        type="button"
                        className="toggle-pass"
                        onClick={() =>
                          setShowConfirm(!showConfirm)
                        }
                      >
                        {showConfirm ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-blue"
                  >
                    Save password
                  </button>
                </form>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="settings-panel">
                <div className="panel-card">
                  <h2>Appearance settings</h2>

                  <p className="panel-sub">
                    Update your account's appearance
                    settings
                  </p>

                  <div className="appearance-row">
                    <button
                      type="button"
                      className={`appearance-opt ${
                        appearance === "light"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setAppearance("light")
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="4"
                        />
                        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                      </svg>
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      className={`appearance-opt ${
                        appearance === "dark"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setAppearance("dark")
                      }
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                      </svg>
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      className={`appearance-opt ${
                        appearance === "system"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        setAppearance("system")
                      }
                    >
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
                          y="4.5"
                          width="19"
                          height="13"
                          rx="2"
                        />
                        <path d="M8 21h8M12 17.5V21" />
                      </svg>
                      <span>System</span>
                    </button>
                  </div>
  </div>
  </div>
      )}
          </div>
        </div>
      </main>

      <footer className="site-footer">
      <div className="foot-inner">
            <span>© 2026 Stackslogs</span>
      <span>support@stackslogs.com</span>
    </div>
    </footer>
    </>
    )
}