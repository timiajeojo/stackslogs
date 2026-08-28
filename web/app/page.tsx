import Link from "next/link";

export default function Home() {
  const platforms = [
    { code: "IG", name: "Instagram", count: "3,120 available" },
    { code: "TT", name: "TikTok", count: "1,840 available" },
    { code: "X", name: "X", count: "1,910 available" },
    { code: "FB", name: "Facebook", count: "2,205 available" },
    { code: "TG", name: "Telegram", count: "930 available" },
    { code: "TH", name: "Threads", count: "440 available" },
  ];

  return (
    <>
      <nav>
        <div className="logo"><span className="mark">S</span>StacksLogs</div>
        <div className="navlinks">
          <a href="#accounts">Accounts</a>
          <a href="#how">How it works</a>
          <a href="#why">Why us</a>
        </div>
        <Link href="/register" className="btn btn-blue">Get Started</Link>
      </nav>

      <header className="hero">
        <h1>Buy verified social<br />media accounts <span className="accent">instantly</span></h1>
        <p>Skip building from zero. Get ready-to-use Instagram, TikTok, X, and Facebook accounts — checked, verified, and delivered fast.</p>
        <Link href="/register" className="btn btn-blue">Get Started</Link>
        <div className="hero-note"><span className="check">✓</span> Secure checkout · Verified accounts · Fast delivery</div>
      </header>

      <div className="stats">
        <div className="stats-grid">
          <div><div className="stat-num">12,800+</div><div className="stat-label">Accounts delivered</div></div>
          <div><div className="stat-num">9,400+</div><div className="stat-label">Customers served</div></div>
          <div><div className="stat-num">&lt;10min</div><div className="stat-label">Avg. delivery time</div></div>
          <div><div className="stat-num">4.8/5</div><div className="stat-label">Customer rating</div></div>
        </div>
      </div>

      <section id="accounts" className="section-pad">
        <div className="section-head">
          <span className="section-eyebrow">Accounts</span>
          <h2>Every platform, ready to go</h2>
          <p>Browse by platform and pick the account that fits — filter by followers, age, and niche.</p>
        </div>
        <div className="plat-grid">
          {platforms.map((p) => (
            <div className="plat-card" key={p.code}>
              <div className="plat-badge">{p.code}</div>
              <div className="name">{p.name}</div>
              <div className="count">{p.count}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="section-pad">
        <div className="section-head">
          <span className="section-eyebrow">Process</span>
          <h2>Buying an account takes minutes</h2>
          <p>No back-and-forth, no waiting around.</p>
        </div>
        <div className="steps">
          <div className="step">
            <span className="step-num">01</span>
            <h3>Pick an account</h3>
            <p>Filter by platform, follower count, niche, and price to find the right fit.</p>
          </div>
          <div className="step">
            <span className="step-num">02</span>
            <h3>Checkout securely</h3>
            <p>Pay with your preferred method through our encrypted checkout.</p>
          </div>
          <div className="step">
            <span className="step-num">03</span>
            <h3>Get instant access</h3>
            <p>Login details are delivered straight to your dashboard, ready to use.</p>
          </div>
        </div>
      </section>

      <section id="why" className="section-pad">
        <div className="section-head">
          <span className="section-eyebrow">Why StacksLogs</span>
          <h2>Built for buyers who need it to just work</h2>
          <p>Every account is checked before it&apos;s listed, and support is there if anything&apos;s off.</p>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon">✓</div>
            <h3>Verified accounts</h3>
            <p>Every account is checked for authenticity and activity before it&apos;s listed.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">⚡</div>
            <h3>Instant delivery</h3>
            <p>Login details land in your dashboard the moment payment clears.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">🔒</div>
            <h3>Secure payment</h3>
            <p>Encrypted checkout with multiple payment options.</p>
          </div>
          <div className="feat-card">
            <div className="feat-icon">◐</div>
            <h3>24/7 support</h3>
            <p>Real support if an account doesn&apos;t match its listing.</p>
          </div>
        </div>
      </section>

      <div className="cta-band">
        <h2>Ready to get started?</h2>
        <p>Browse available accounts and find the right one in minutes.</p>
        <Link href="/register" className="btn btn-blue">Get Started</Link>
      </div>

      <footer>
        <div className="foot-inner">
          <span>© 2026 StacksLogs</span>
          <span>support@stackslogs.com</span>
        </div>
      </footer>
    </>
  );
}