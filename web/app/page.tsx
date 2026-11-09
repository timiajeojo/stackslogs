"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Root route: public landing page. Signed-in users go straight to the dashboard.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem("token");
    } catch {}
    if (token) router.replace("/dashboard");
  }, [router]);

  // Slide elements in from the left or right as they scroll into view.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal:not(.in)");
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <nav>
        <Link href="/" className="logo">
          <span className="mark">S</span>StacksLogs
        </Link>
        <div className="navlinks">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
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
        <h1 className="reveal from-left">
          Welcome to <span className="accent">Stackslogs</span>
        </h1>
        <p className="reveal from-right">
          The right destination for premium social media accounts. Start exploring now and find the right account for your goals.
        </p>
        <div className="reveal from-left" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/register" className="btn btn-blue">
            Create free account
          </Link>
          <Link href="/login" className="btn btn-ghost" style={{ padding: "14px 30px", fontSize: 15 }}>
            Sign in
          </Link>
        </div>
        <div className="hero-note reveal from-right">
          <span className="check">✓</span> Free to sign up. You only pay when you buy.
        </div>
      </section>

      <section id="how">
        <div className="section-pad">
          <div className="section-head reveal from-left">
            <span className="section-eyebrow">How it works</span>
            <h2>From sign-up to your first account in three steps</h2>
            <p>No setup and no back and forth. Everything happens inside your dashboard.</p>
          </div>
          <div className="steps">
            <div className="step reveal from-left">
              <span className="step-num">01</span>
              <h3>Create your account</h3>
              <p>Sign up with your email and a password. It takes under a minute.</p>
            </div>
            <div className="step reveal from-right">
              <span className="step-num">02</span>
              <h3>Fund your wallet</h3>
              <p>Add money in naira through Paystack. Your balance is ready to spend once the payment is confirmed.</p>
            </div>
            <div className="step reveal from-left">
              <span className="step-num">03</span>
              <h3>Pick an account and pay</h3>
              <p>Choose from the catalog and place your order. Your details are saved in My Orders for you to copy.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div className="section-pad">
          <div className="section-head reveal from-left">
            <span className="section-eyebrow">Features</span>
            <h2>Built to keep buying simple</h2>
            <p>The tools you need to find, buy and keep track of your accounts.</p>
          </div>
          <div className="feat-grid">
            <div className="feat-card reveal from-left">
              <div className="feat-icon">◉</div>
              <h3>Live stock</h3>
              <p>Browse by category and see how many of each account are available before you buy.</p>
            </div>
            <div className="feat-card reveal from-right">
              <div className="feat-icon">⧉</div>
              <h3>Saved orders</h3>
              <p>Every purchase is kept in My Orders with its details, ready to copy whenever you need them.</p>
            </div>
            <div className="feat-card reveal from-left">
              <div className="feat-icon">◐</div>
              <h3>Light or dark</h3>
              <p>Switch the look of the site in Settings to whichever is easier on your eyes.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="cta-band reveal from-right">
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