"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password) && password.length >= 10) score++;
    return score;
  })();
  const strengthLabel =
    password.length === 0 ? "Use 8+ characters with a mix of letters & numbers"
    : strength <= 1 ? "Weak password"
    : strength === 2 ? "Getting there"
    : "Strong password";
  const segClass = (i: number) => {
    if (password.length === 0) return "strength-seg";
    if (strength <= 1) return i === 0 ? "strength-seg weak" : "strength-seg";
    if (strength === 2) return i <= 1 ? "strength-seg mid" : "strength-seg";
    return "strength-seg strong";
  };

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mismatch) return;
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.formErrors?.[0] || data.error || "Registration failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <nav>
        <div className="logo"><span className="mark">S</span>StacksLogs</div>
        <div className="nav-note">Already have an account? <Link href="/login">Sign in</Link></div>
      </nav>

      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-head">
            <h1>Create your account</h1>
            <p>Sign up to start browsing verified accounts.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="name-row">
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input id="firstName" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input id="lastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input type="email" id="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-shell">
                <input
                  type={showPass ? "text" : "password"}
                  id="password"
                  placeholder="Create a password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="toggle-pass" onClick={() => setShowPass(!showPass)}>{showPass ? "HIDE" : "SHOW"}</span>
              </div>
              <div className="strength-row">
                <div className={segClass(0)}></div>
                <div className={segClass(1)}></div>
                <div className={segClass(2)}></div>
              </div>
              <div className="strength-label">{strengthLabel}</div>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="input-shell">
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Re-enter your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={mismatch ? "error" : ""}
                />
                <span className="toggle-pass" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? "HIDE" : "SHOW"}</span>
              </div>
              <div className={`error-text ${mismatch ? "show" : ""}`}>Passwords don&apos;t match</div>
            </div>

            <div className="terms-row">
              <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <label htmlFor="terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
            </div>

            {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{error}</p>}

            <button type="submit" className="btn btn-blue" disabled={loading} style={{ display: "flex", justifyContent: "center" }}>
  {loading ? "Creating account..." : "Create account"}
</button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>

      <footer className="site-footer">
        <div className="foot-inner">
          <span>© 2026 StacksLogs</span>
          <span>support@stackslogs.com</span>
        </div>
      </footer>
    </>
  );
}