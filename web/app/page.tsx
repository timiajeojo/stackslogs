
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCatalog } from "./lib/store";

// Root route: public landing page. Signed-in users go straight to the dashboard.
export default function Home() {
  const router = useRouter();
  const { categories } = useCatalog();

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem("token");
    } catch {}
    if (token) router.replace("/dashboard");
  }, [router]);

  const totalStock = categories.reduce(
    (sum, c) => sum + c.items.reduce((s, i) => s + (i.available_stock || 0), 0),
    0
  );
  const shown = categories.slice(0, 12);

  return (
    <>
      <nav>
        <Link href="/" className="logo">
          <span className="mark">S</span>StacksLogs
        </Link>
        <div className="navlinks">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          {categories.length > 0 && <a href="#categories">Categories</a>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" className="btn btn-ghost" style={{ padding: "9px 16px" }}>
            Sign in
          </Link>
          <Link href="/register" className="btn btn-blue" style={{ padding: "9px 16px" }}>
            Get started
          </Link>
        </div>
      </nav>

      <section className="hero">
        <h1>
          Buy verified social media accounts, <span className="accent">paid in naira</span>
        </h1>
        <p>
          Browse accounts by category, top up your wallet with Paystack, and keep every order and its details in one
          place.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/register" className="btn btn-blue">
            Create free account
          </Link>
          <Link href="/login" className="btn btn-ghost" style={{ padding: "14px 30px", fontSize: 15 }}>
            Sign in
          </Link>
        </div>
        <div className="hero-note">
          <span className="check">✓</span> Free to sign up. You only pay when you buy.
        </div>
      </section>

      {categories.length > 0 && (
        <div className="stats">
          <div className="stats-grid">
            <div>
              <div className="stat-num">{totalStock.toLocaleString("en-NG")}</div>
              <div className="stat-label">Accounts in stock</div>
            </div>
            <div>
              <div className="stat-num">{categories.length}</div>
              <div className="stat-label">Categories</div>
            </div>
            <div>
              <div className="stat-num">NGN</div>
              <div className="stat-label">Wallet currency</div>
            </div>
            <div>
              <div className="stat-num">Paystack</div>
              <div className="stat-label">Wallet deposits</div>
            </div>
          </div>
        </div>
      )}

      <section id="how">
        <div className="section-pad">
          <div className="section-head">
            <span className="section-eyebrow">How it works</span>
            <h2>From sign-up to your first account in three steps</h2>
            <p>No setup and no back and forth. Everything happens inside your dashboard.</p>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-num">01</span>
              <h3>Create your account</h3>
              <p>Sign up with your email and a password. It takes under a minute.</p>
            </div>
            <div className="step">
              <span className="step-num">02</span>
              <h3>Fund your wallet</h3>
              <p>Add money in naira through Paystack. Your balance is ready to spend once the payment is confirmed.</p>
            </div>
            <div className="step">
              <span className="step-num">03</span>
              <h3>Pick an account and buy</h3>
              <p>Choose from the catalog and place your order. Your details are saved in My Orders for you to copy.</p>
            </div>
          </div>
        </div>
      </section>

      {shown.length > 0 && (
        <section id="categories">
          <div className="section-pad" style={{ paddingTop: 0 }}>
            <div className="section-head">
              <span className="section-eyebrow">Categories</span>
              <h2>What you can buy</h2>
              <p>This is the live catalog. Sign in to see prices and place an order.</p>
            </div>
            <div className="plat-grid">
              {shown.map((c) => {
                const stock = c.items.reduce((s, i) => s + (i.available_stock || 0), 0);
                return (
                  <div className="plat-card" key={c.key}>
                    <div className="plat-badge">{c.name.slice(0, 2).toUpperCase()}</div>
                    <div className="name">{c.name}</div>
                    <div className="count">{stock.toLocaleString("en-NG")} in stock</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section id="features">
        <div className="section-pad" style={{ paddingTop: shown.length > 0 ? 0 : undefined }}>
          <div className="section-head">
            <span className="section-eyebrow">Features</span>
            <h2>Built to keep buying simple</h2>
            <p>The tools you need to find, buy and keep track of your accounts.</p>
          </div>
          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">₦</div>
              <h3>Pay in naira</h3>
              <p>Top up your wallet through Paystack and see every price in naira.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">◉</div>
              <h3>Live stock</h3>
              <p>Browse by category and see how many of each account are available before you buy.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">⧉</div>
              <h3>Saved orders</h3>
              <p>Every purchase is kept in My Orders with its details, ready to copy whenever you need them.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon">◐</div>
              <h3>Light or dark</h3>
              <p>Switch the look of the site in Settings to whichever is easier on your eyes.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="cta-band">
          <h2>Ready to get started?</h2>
          <p>Create your account, fund your wallet and start browsing.</p>
          <Link href="/register" className="btn btn-blue" style={{ padding: "14px 30px", fontSize: 15 }}>
            Create free account
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <div className="foot-inner">
          <span>© 2026 StacksLogs</span>
        </div>
      </footer>
    </>
  );
}