"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/");
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="hero">
      <h1>Welcome back</h1>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 380, marginTop: 30, display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "12px 16px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "12px 16px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text)" }}
        />
        {error && <p style={{ color: "#ff6b6b", fontSize: 14 }}>{error}</p>}
        <button type="submit" className="btn btn-blue" disabled={loading} style={{ justifyContent: "center", border: "none", cursor: "pointer" }}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
        Don&apos;t have an account? <Link href="/register" style={{ color: "var(--blue)" }}>Sign up</Link>
      </p>
    </div>
  );
}
