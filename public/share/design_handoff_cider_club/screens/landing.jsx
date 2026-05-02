/* Landing page — Hill Country Cider Club */
const { useState } = React;

// Shield/badge SVG echoing the brand logo's silhouette
function Badge({ size = 110 }) {
  return (
    <svg viewBox="0 0 200 140" width={size} style={{ display: "block" }}>
      <defs>
        <pattern id="dots" width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.4" fill="#c9a14a" opacity="0.4" />
        </pattern>
      </defs>
      <path
        d="M10 30 Q10 15 25 15 L80 15 Q100 5 120 15 L175 15 Q190 15 190 30 L190 95 Q190 115 170 120 L130 130 Q100 138 70 130 L30 120 Q10 115 10 95 Z"
        fill="#1a2540"
        stroke="#c9a14a"
        strokeWidth="1.5"
      />
      <path
        d="M14 33 Q14 19 28 19 L82 19 Q100 9 118 19 L172 19 Q186 19 186 33 L186 92 Q186 112 168 116 L130 126 Q100 134 70 126 L32 116 Q14 112 14 92 Z"
        fill="none"
        stroke="#c9a14a"
        strokeWidth="0.5"
        opacity="0.6"
      />
      {/* longhorn mini */}
      <path d="M70 38 Q90 30 100 38 Q110 30 130 38 M95 40 L105 40 L103 50 L97 50 Z" stroke="#f7f1e3" strokeWidth="1.2" fill="none" />
      <circle cx="100" cy="52" r="2" fill="#f7f1e3" />
      <text x="100" y="78" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="20" fontStyle="italic" fill="#f7f1e3">Cider</text>
      <text x="100" y="96" textAnchor="middle" fontFamily="Inter Tight, sans-serif" fontSize="8" letterSpacing="3" fill="#c9a14a">CLUB · EST 2020</text>
      <text x="100" y="113" textAnchor="middle" fontFamily="Inter Tight, sans-serif" fontSize="6" letterSpacing="2" fill="#c9a14a" opacity="0.7">SMALL BATCH · COMFORT, TX</text>
    </svg>
  );
}

function StarDivider({ dark = false }) {
  return (
    <div className="flourish" style={{ color: dark ? "#e7c87a" : "#c9a14a" }}>
      <span style={{ fontSize: 10, letterSpacing: 4 }}>✦ ✦ ✦</span>
    </div>
  );
}

function NavBar({ tweaks }) {
  const links = ["Tasting Room", "Apple Trees", "About", "Contact"];
  return (
    <header style={{
      borderBottom: "1px solid rgba(201,161,74,0.25)",
      background: tweaks.darkNav ? "var(--navy)" : "var(--paper)",
      color: tweaks.darkNav ? "var(--cream)" : "var(--ink)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 56px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, flexShrink: 0, display: "flex", alignItems: "center" }}>
            <Badge size={48} />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div className="serif" style={{ fontSize: 18, fontStyle: "italic", lineHeight: 1 }}>Hill Country</div>
            <div className="smallcaps" style={{ fontSize: 9, color: "var(--gold)", marginTop: 4 }}>Cider House</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {links.map(l => (
            <a key={l} className="smallcaps" href="#" style={{ fontSize: 11, color: "inherit", textDecoration: "none", opacity: 0.85 }}>{l}</a>
          ))}
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.22em", textTransform: "uppercase", borderBottom: "1px solid currentColor", paddingBottom: 2 }}>Join the Club</span>
          <a className="smallcaps" href="#" style={{ fontSize: 11, color: "inherit", textDecoration: "none", opacity: 0.6 }}>Member Sign-in</a>
        </nav>
      </div>
    </header>
  );
}

function Hero({ tweaks }) {
  return (
    <section style={{
      background: "var(--navy)",
      color: "var(--cream)",
      position: "relative",
      overflow: "hidden",
      padding: "100px 56px 120px",
    }}>
      {/* faint star field */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.08, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle at 18% 28%, #e7c87a 0.5px, transparent 1px), radial-gradient(circle at 78% 60%, #e7c87a 0.5px, transparent 1px), radial-gradient(circle at 42% 78%, #e7c87a 0.5px, transparent 1px)",
        backgroundSize: "60px 60px, 90px 90px, 70px 70px",
      }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 80, alignItems: "center", position: "relative" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <span style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span className="smallcaps" style={{ fontSize: 11, color: "var(--gold-bright)" }}>A Quarterly Cider Club ✦ Comfort, Texas</span>
          </div>
          <h1 className="serif" style={{ fontSize: 92, lineHeight: 0.96, fontWeight: 400, margin: 0, letterSpacing: "-0.01em" }}>
            Pull up a chair.<br />
            <span style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>You're family</span> now.
          </h1>
          <p className="sans" style={{ fontSize: 19, lineHeight: 1.55, marginTop: 32, maxWidth: 540, color: "rgba(247, 241, 227, 0.78)" }}>
            Four times a year, we set aside a small batch of our best ciders for the people who make this place feel like home. Pick the bottles you love. Bring a friend. We'll keep the porch light on.
          </p>
          <div style={{ display: "flex", gap: 18, marginTop: 44, alignItems: "center" }}>
            <button className="btn-gold">Join the Club →</button>
            <button className="btn-ghost-navy">View the Lineup</button>
          </div>
          <div style={{ display: "flex", gap: 36, marginTop: 56, paddingTop: 28, borderTop: "1px solid rgba(231,200,122,0.2)" }}>
            <Stat n="142" l="Members" />
            <Stat n="23" l="Ciders Released" />
            <Stat n="4×" l="Pickup Parties / yr" />
          </div>
        </div>

        {/* Imagery cluster */}
        <div style={{ position: "relative", height: 560 }}>
          <div style={{ position: "absolute", top: 0, right: 40, width: 260, height: 340, transform: "rotate(3deg)", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
            <div className="bottle-frame" style={{ width: "100%", height: "100%" }}>
              <img src="brand/cherry.jpg" alt="Cherry Bloom" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", bottom: -14, left: 16, background: "var(--cream)", color: "var(--navy)", padding: "6px 14px", fontFamily: "Playfair Display, serif", fontStyle: "italic", fontSize: 14 }}>Cherry Bloom · 7.6%</div>
          </div>
          <div style={{ position: "absolute", bottom: 30, left: 0, width: 240, height: 200, transform: "rotate(-4deg)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <div className="bottle-frame" style={{ width: "100%", height: "100%" }}>
              <img src="brand/pineapple.jpg" alt="Pineapple Paradise" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ position: "absolute", bottom: -14, right: 16, background: "var(--terracotta)", color: "var(--cream)", padding: "6px 14px", fontFamily: "Playfair Display, serif", fontStyle: "italic", fontSize: 14 }}>Pineapple Paradise</div>
          </div>
          {/* stamp */}
          <div style={{ position: "absolute", top: 380, right: 0, transform: "rotate(-8deg)", padding: 22, border: "2px solid var(--gold)", borderRadius: "50%", background: "rgba(26,37,64,0.6)", textAlign: "center", width: 130, height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="smallcaps" style={{ fontSize: 9, color: "var(--gold-bright)" }}>Members<br/>Only</div>
            <div className="serif" style={{ fontSize: 36, fontStyle: "italic", color: "var(--cream)", lineHeight: 1, margin: "4px 0" }}>20%</div>
            <div className="smallcaps" style={{ fontSize: 8, color: "var(--gold-bright)" }}>Off Bottles</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div className="serif" style={{ fontSize: 36, fontStyle: "italic", color: "var(--gold-bright)", lineHeight: 1 }}>{n}</div>
      <div className="smallcaps" style={{ fontSize: 10, color: "rgba(247,241,227,0.6)", marginTop: 6 }}>{l}</div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "I.", t: "Saddle Up", d: "Pick a club tier, drop your details, leave a card on file. No password to forget." },
    { n: "II.", t: "We Holler", d: "Each season we'll send word when the new lineup is bottled and ready to customize." },
    { n: "III.", t: "Pick Your Bottles", d: "Swap, mix, and choose from our quarterly release. Defaults are good. Yours is better." },
    { n: "IV.", t: "Come On Down", d: "Pickup party in Comfort, Texas. Open bar, live music, your bottles boxed and ready." },
  ];
  return (
    <section className="paper-bg" style={{ padding: "120px 56px", color: "var(--ink)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div className="smallcaps" style={{ fontSize: 11, color: "var(--terracotta)", marginBottom: 18 }}>How It Works</div>
          <h2 className="serif" style={{ fontSize: 64, fontWeight: 400, margin: 0, lineHeight: 1.05 }}>
            <span style={{ fontStyle: "italic" }}>Four seasons,</span> four good reasons
          </h2>
          <div style={{ marginTop: 28 }}><StarDivider /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--rule)", border: "1px solid var(--rule)" }}>
          {steps.map(s => (
            <div key={s.n} style={{ background: "var(--paper)", padding: "44px 32px" }}>
              <div className="serif" style={{ fontSize: 56, fontStyle: "italic", color: "var(--gold-deep)", lineHeight: 1, marginBottom: 18 }}>{s.n}</div>
              <div className="serif" style={{ fontSize: 26, marginBottom: 14, lineHeight: 1.15 }}>{s.t}</div>
              <p className="sans" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-soft)", margin: 0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Tiers({ tweaks }) {
  const tiers = [
    { name: "The Pickers", lvl: "I", bottles: 3, price: 65, blurb: "A taste of the season — three bottles, hand-picked or yours to choose.", perks: ["Member discount: 10% off bottles", "5% off everything else", "One free pour each visit", "Pickup party invite"] },
    { name: "The Pressers", lvl: "II", bottles: 6, price: 120, blurb: "Six bottles a quarter — the sweet spot for folks who like a deep cellar.", perks: ["Member discount: 15% off bottles", "5% off everything else", "Free pour for you + a guest", "Open-bar pickup parties", "Early access to new releases"], featured: true },
    { name: "Cellar Crew", lvl: "III", bottles: 9, price: 170, blurb: "Nine bottles, plus the keys to the barrel room. The full Hill Country.", perks: ["Member discount: 20% off bottles", "10% off everything else", "Free pour for you + a guest", "Open-bar pickup parties", "First access to limited releases", "Free barrel-room reservation"] },
  ];
  return (
    <section style={{ background: "var(--cream-deep)", padding: "120px 56px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div className="smallcaps" style={{ fontSize: 11, color: "var(--terracotta)", marginBottom: 18 }}>Three Tiers</div>
          <h2 className="serif" style={{ fontSize: 64, fontWeight: 400, margin: 0, lineHeight: 1.05 }}>Choose your <span style={{ fontStyle: "italic" }}>seat at the table</span></h2>
          <p className="sans" style={{ fontSize: 16, color: "var(--ink-soft)", marginTop: 18, maxWidth: 580, marginLeft: "auto", marginRight: "auto" }}>Billed quarterly when you pick up. Pause whenever you'd like. Cancel any time, no hard feelings.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
          {tiers.map(t => (
            <div key={t.name} style={{
              background: t.featured ? "var(--navy)" : "var(--paper)",
              color: t.featured ? "var(--cream)" : "var(--ink)",
              border: t.featured ? "1px solid var(--gold)" : "1px solid var(--rule)",
              padding: "48px 36px",
              position: "relative",
              boxShadow: t.featured ? "0 30px 60px rgba(26,37,64,0.25)" : "0 2px 14px rgba(26,37,64,0.05)",
            }}>
              {t.featured && <div className="stamp" style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "var(--terracotta)", color: "var(--cream)" }}>★ Most Picked ★</div>}
              <div style={{ textAlign: "center", borderBottom: t.featured ? "1px solid rgba(231,200,122,0.25)" : "1px solid var(--rule)", paddingBottom: 24 }}>
                <div className="serif" style={{ fontSize: 18, fontStyle: "italic", color: t.featured ? "var(--gold-bright)" : "var(--gold-deep)", marginBottom: 6 }}>Level {t.lvl}</div>
                <div className="serif" style={{ fontSize: 38, lineHeight: 1.05 }}>{t.name}</div>
                <div className="smallcaps" style={{ fontSize: 10, marginTop: 10, color: t.featured ? "var(--gold-bright)" : "var(--terracotta)" }}>{t.bottles} Bottles · Every Quarter</div>
              </div>
              <div style={{ textAlign: "center", padding: "28px 0", borderBottom: t.featured ? "1px solid rgba(231,200,122,0.25)" : "1px solid var(--rule)" }}>
                <span className="serif" style={{ fontSize: 64, fontStyle: "italic", lineHeight: 1 }}>${t.price}</span>
                <span className="sans" style={{ fontSize: 14, marginLeft: 8, opacity: 0.7 }}>/ quarter</span>
                <p className="sans" style={{ fontSize: 13, opacity: 0.75, margin: "16px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>"{t.blurb}"</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "24px 0 32px" }}>
                {t.perks.map(p => (
                  <li key={p} className="sans" style={{ fontSize: 14, padding: "8px 0", display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.45 }}>
                    <span style={{ color: t.featured ? "var(--gold-bright)" : "var(--terracotta)", fontFamily: "Playfair Display", fontStyle: "italic", lineHeight: 1, flexShrink: 0, marginTop: 2 }}>✦</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <button className={t.featured ? "btn-gold" : "btn-saloon"} style={{ width: "100%" }}>Saddle Up →</button>
            </div>
          ))}
        </div>
        <p className="sans" style={{ textAlign: "center", marginTop: 48, fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic" }}>
          Already a member? <a className="link-saloon" href="#">Get your access link →</a>
        </p>
      </div>
    </section>
  );
}

function Lineup() {
  const bottles = [
    { src: "brand/cherry.jpg", name: "Cherry Bloom", style: "Dry · Sparkling", abv: "7.6%" },
    { src: "brand/pineapple.jpg", name: "Pineapple Paradise", style: "Sweet · Tropical", abv: "5.8%" },
    { src: "brand/lemongrass.jpg", name: "Lemongrass Lush", style: "Botanical · Bright", abv: "6.4%" },
    { src: "brand/hero1.jpg", name: "Black Bart", style: "Gentleman's Cider", abv: "6.8%" },
  ];
  return (
    <section style={{ background: "var(--navy)", color: "var(--cream)", padding: "120px 56px", position: "relative" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56 }}>
          <div>
            <div className="smallcaps" style={{ fontSize: 11, color: "var(--gold-bright)", marginBottom: 14 }}>This Quarter's Pour</div>
            <h2 className="serif" style={{ fontSize: 64, fontWeight: 400, margin: 0, lineHeight: 1 }}>Spring '26 <span style={{ fontStyle: "italic", color: "var(--gold-bright)" }}>Lineup</span></h2>
          </div>
          <div className="sans" style={{ fontSize: 14, opacity: 0.7, maxWidth: 380, lineHeight: 1.6 }}>
            Eight ciders are on tap this quarter. Members can mix any combination — defaults are set, but the choice is always yours.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {bottles.map(b => (
            <div key={b.name}>
              <div className="bottle-frame" style={{ aspectRatio: "3/4", background: "var(--navy-soft)" }}>
                <img src={b.src} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "20px 4px 0" }}>
                <div className="serif" style={{ fontSize: 24, fontStyle: "italic" }}>{b.name}</div>
                <div className="smallcaps" style={{ fontSize: 9, color: "var(--gold-bright)", marginTop: 6 }}>{b.style} · {b.abv}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Letter() {
  return (
    <section className="paper-bg" style={{ padding: "120px 56px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <div className="serif" style={{ fontSize: 80, color: "var(--gold)", lineHeight: 0.7, fontStyle: "italic" }}>"</div>
        <p className="serif" style={{ fontSize: 32, lineHeight: 1.4, fontStyle: "italic", color: "var(--ink)", margin: "16px 0 32px" }}>
          We started pressing apples in our backyard with a hand crank and a stubborn streak. Eight years on, this club is how we say thank you to the folks who showed up early — and stayed.
        </p>
        <div className="hr-gold" style={{ width: 80, margin: "0 auto 18px" }} />
        <div className="smallcaps" style={{ fontSize: 11, color: "var(--terracotta)" }}>— The Founders, Comfort TX</div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: "var(--navy-deep)", color: "var(--cream)", padding: "72px 56px 32px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 48, paddingBottom: 48, borderBottom: "1px solid rgba(231,200,122,0.2)" }}>
          <div>
            <Badge size={70} />
            <p className="sans" style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6, marginTop: 18, maxWidth: 320 }}>
              Small-batch craft cider, pressed and bottled in the Texas Hill Country since 2020.
            </p>
          </div>
          <FooterCol title="Visit" items={["Tasting Room", "Saturdays in Comfort", "Apple Trees", "Supper Club"]} />
          <FooterCol title="Club" items={["Join the Club", "Member Sign-in", "FAQs", "Pickup Schedule"]} />
          <FooterCol title="Reach Us" items={["hello@hillcountryciderhouse.com", "(830) 344-0441", "Comfort, Texas", "@hillcountrycider"]} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 28 }}>
          <div className="smallcaps" style={{ fontSize: 10, opacity: 0.5 }}>© 2026 Hill Country Cider House · Small Batch · Quality Cider</div>
          <div className="smallcaps" style={{ fontSize: 10, opacity: 0.5 }}>Drink responsibly · 21+</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }) {
  return (
    <div>
      <div className="smallcaps" style={{ fontSize: 10, color: "var(--gold-bright)", marginBottom: 18 }}>{title}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map(i => (
          <li key={i} className="sans" style={{ fontSize: 13, padding: "4px 0", opacity: 0.75 }}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function Landing({ tweaks }) {
  return (
    <div style={{ width: "100%" }}>
      <NavBar tweaks={tweaks} />
      <Hero tweaks={tweaks} />
      <HowItWorks />
      <Tiers tweaks={tweaks} />
      <Lineup />
      <Letter />
      <Footer />
    </div>
  );
}

window.Landing = Landing;
window.Badge = Badge;
window.StarDivider = StarDivider;
