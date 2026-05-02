/* Registration flow — three-step ticket-style */
const { useState: useStateReg } = React;

function ProgressRail({ step, total = 3 }) {
  const labels = ["Your Details", "Pick Your Tier", "Card on File"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 48 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i + 1 === step;
        const done = i + 1 < step;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38,
                border: "1.5px solid " + (done || active ? "var(--terracotta)" : "var(--rule)"),
                background: done ? "var(--terracotta)" : "var(--paper)",
                color: done ? "var(--cream)" : active ? "var(--terracotta)" : "var(--ink-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Playfair Display, serif", fontStyle: "italic", fontSize: 18,
                transform: "rotate(45deg)",
              }}>
                <span style={{ transform: "rotate(-45deg)" }}>{done ? "✓" : i + 1}</span>
              </div>
              <div className="smallcaps" style={{ fontSize: 9, color: active ? "var(--terracotta)" : "var(--ink-soft)", opacity: active || done ? 1 : 0.55 }}>{labels[i]}</div>
            </div>
            {i < total - 1 && <div style={{ flex: 1, maxWidth: 110, height: 1, background: i + 1 < step ? "var(--terracotta)" : "var(--rule)", margin: "0 18px", marginBottom: 22, position: "relative" }}>
              <span style={{ position: "absolute", top: -3, left: "50%", transform: "translateX(-50%)", color: i + 1 < step ? "var(--terracotta)" : "var(--gold)", fontSize: 8 }}>✦</span>
            </div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TicketHeader() {
  return (
    <div style={{ textAlign: "center", padding: "32px 32px 24px", borderBottom: "1px dashed var(--rule-strong)", position: "relative" }}>
      <div style={{ position: "absolute", left: -10, top: "100%", width: 20, height: 20, borderRadius: "50%", background: "var(--cream-deep)", transform: "translateY(-50%)" }} />
      <div style={{ position: "absolute", right: -10, top: "100%", width: 20, height: 20, borderRadius: "50%", background: "var(--cream-deep)", transform: "translateY(-50%)" }} />
      <Badge size={66} />
      <div className="serif" style={{ fontSize: 32, fontStyle: "italic", marginTop: 10, color: "var(--navy)" }}>Welcome to the Club</div>
      <div className="smallcaps" style={{ fontSize: 10, color: "var(--terracotta)", marginTop: 6 }}>Hill Country Cider House · Est. 2020</div>
    </div>
  );
}

function FieldGroup({ label, children, hint, required }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label className="smallcaps" style={{ fontSize: 10, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "var(--terracotta)", marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && <div className="sans" style={{ fontSize: 11, color: "var(--ink-soft)", opacity: 0.7, marginTop: 4, fontStyle: "italic" }}>{hint}</div>}
    </div>
  );
}

function StepDetails({ form, set, onNext }) {
  return (
    <div style={{ padding: "32px 56px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div className="serif" style={{ fontSize: 26, fontStyle: "italic" }}>Tell us who you are</div>
        <div className="sans" style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>We'll send a magic link — no passwords to forget.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FieldGroup label="First name" required><input className="field-saloon" placeholder="June" value={form.firstName} onChange={e => set("firstName", e.target.value)} /></FieldGroup>
        <FieldGroup label="Last name" required><input className="field-saloon" placeholder="Calloway" value={form.lastName} onChange={e => set("lastName", e.target.value)} /></FieldGroup>
      </div>
      <FieldGroup label="Email" required hint="Pickup reminders and your magic link land here.">
        <input className="field-saloon" placeholder="june@texas.com" value={form.email} onChange={e => set("email", e.target.value)} />
      </FieldGroup>
      <FieldGroup label="Phone" hint="Optional — text reminders for pickup parties.">
        <input className="field-saloon" placeholder="(830) 555-0123" value={form.phone} onChange={e => set("phone", e.target.value)} />
      </FieldGroup>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
        <FieldGroup label="City"><input className="field-saloon" placeholder="Comfort" /></FieldGroup>
        <FieldGroup label="State"><input className="field-saloon" placeholder="TX" maxLength={2} /></FieldGroup>
        <FieldGroup label="Zip"><input className="field-saloon" placeholder="78013" /></FieldGroup>
      </div>
      <button className="btn-saloon" style={{ width: "100%", marginTop: 16 }} onClick={onNext}>Next: Pick Your Tier →</button>
    </div>
  );
}

function StepTier({ form, set, onBack, onNext }) {
  const tiers = [
    { id: "pickers", name: "The Pickers", lvl: "I", bottles: 3, price: 65, blurb: "A taste of every season" },
    { id: "pressers", name: "The Pressers", lvl: "II", bottles: 6, price: 120, blurb: "Our most popular — the sweet spot", featured: true },
    { id: "cellar", name: "Cellar Crew", lvl: "III", bottles: 9, price: 170, blurb: "Full Hill Country, barrel-room access" },
  ];
  return (
    <div style={{ padding: "32px 56px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div className="serif" style={{ fontSize: 26, fontStyle: "italic" }}>Pick your tier</div>
        <div className="sans" style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>Billed each quarter at pickup. Pause anytime.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tiers.map(t => {
          const selected = form.tier === t.id;
          return (
            <label key={t.id} style={{
              display: "flex", alignItems: "center", gap: 20,
              padding: "20px 22px",
              border: selected ? "1.5px solid var(--terracotta)" : "1px solid var(--rule)",
              background: selected ? "rgba(182, 90, 60, 0.05)" : "var(--paper)",
              cursor: "pointer", position: "relative",
            }} onClick={() => set("tier", t.id)}>
              <div style={{
                width: 22, height: 22, border: "1.5px solid " + (selected ? "var(--terracotta)" : "var(--rule-strong)"),
                background: selected ? "var(--terracotta)" : "transparent",
                color: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center",
                transform: "rotate(45deg)", fontSize: 10, flexShrink: 0,
              }}>{selected && <span style={{ transform: "rotate(-45deg)" }}>✓</span>}</div>
              <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span className="serif" style={{ fontSize: 22, fontStyle: "italic" }}>{t.name}</span>
                    <span className="smallcaps" style={{ fontSize: 9, color: "var(--gold-deep)" }}>Level {t.lvl}</span>
                    {t.featured && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--terracotta)", border: "1px solid var(--terracotta)", padding: "2px 8px" }}>Most Picked</span>}
                  </div>
                  <div className="sans" style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>{t.bottles} bottles per quarter · {t.blurb}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="serif" style={{ fontSize: 28, fontStyle: "italic" }}>${t.price}</div>
                  <div className="smallcaps" style={{ fontSize: 9, color: "var(--ink-soft)" }}>per quarter</div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <FieldGroup label="Referral code" hint="Got a code from a friend? Drop it here.">
        <input className="field-saloon" placeholder="Optional" />
      </FieldGroup>
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button onClick={onBack} className="btn-ghost-navy" style={{ color: "var(--ink-soft)", borderColor: "var(--rule-strong)", flexShrink: 0 }}>← Back</button>
        <button className="btn-saloon" style={{ flex: 1 }} onClick={onNext}>Next: Card on File →</button>
      </div>
    </div>
  );
}

function StepCard({ form, onBack, onSubmit }) {
  return (
    <div style={{ padding: "32px 56px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div className="serif" style={{ fontSize: 26, fontStyle: "italic" }}>Card on file</div>
        <div className="sans" style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4, maxWidth: 360, margin: "4px auto 0" }}>
          We won't charge a penny today. Your card is billed when you pick up your quarterly box.
        </div>
      </div>

      <div style={{ background: "var(--paper)", border: "1px solid var(--rule)", padding: 24 }}>
        <FieldGroup label="Card number">
          <div className="field-saloon" style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(74,67,52,0.5)" }}>
            <span style={{ fontFamily: "monospace", letterSpacing: 4 }}>1234 5678 9012 3456</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--gold-deep)", letterSpacing: "0.2em" }}>VISA</span>
          </div>
        </FieldGroup>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <FieldGroup label="Expires"><input className="field-saloon" placeholder="MM / YY" /></FieldGroup>
          <FieldGroup label="CVC"><input className="field-saloon" placeholder="123" /></FieldGroup>
          <FieldGroup label="Zip"><input className="field-saloon" placeholder="78013" /></FieldGroup>
        </div>
        <div className="sans" style={{ fontSize: 11, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6, marginTop: 4, opacity: 0.75 }}>
          <span style={{ color: "var(--gold-deep)" }}>🔒</span> Card info is securely stored by Square. We never see your full card number.
        </div>
      </div>

      <div style={{ background: "var(--navy)", color: "var(--cream)", marginTop: 20, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="smallcaps" style={{ fontSize: 10, color: "var(--gold-bright)" }}>Your tier</div>
          <div className="serif" style={{ fontSize: 22, fontStyle: "italic", marginTop: 2 }}>The Pressers</div>
          <div className="sans" style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Billed at each quarterly pickup</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="serif" style={{ fontSize: 30, fontStyle: "italic", color: "var(--gold-bright)" }}>$120</div>
          <div className="smallcaps" style={{ fontSize: 9, opacity: 0.6 }}>per quarter</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button onClick={onBack} className="btn-ghost-navy" style={{ color: "var(--ink-soft)", borderColor: "var(--rule-strong)", flexShrink: 0 }}>← Back</button>
        <button className="btn-saloon" style={{ flex: 1 }} onClick={onSubmit}>Saddle Up — Join the Club</button>
      </div>
      <div className="sans" style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "var(--ink-soft)" }}>
        <a href="#" style={{ color: "var(--ink-soft)", textDecoration: "underline", textUnderlineOffset: 3 }}>Skip for now — add a card later</a>
      </div>
    </div>
  );
}

function StepDone({ form }) {
  return (
    <div style={{ padding: "48px 56px", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, margin: "0 auto", border: "2px solid var(--gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold-deep)", fontSize: 40 }}>✦</div>
      <div className="serif" style={{ fontSize: 36, fontStyle: "italic", marginTop: 24, color: "var(--navy)" }}>You're in, partner.</div>
      <p className="sans" style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.6, maxWidth: 380, margin: "12px auto 0" }}>
        We just sent a welcome note to <strong style={{ color: "var(--ink)" }}>{form.email || "june@texas.com"}</strong> with your member portal link. Check your inbox.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 36, padding: "24px 0", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
        <div>
          <div className="smallcaps" style={{ fontSize: 9, color: "var(--ink-soft)" }}>First Pickup</div>
          <div className="serif" style={{ fontSize: 20, fontStyle: "italic", marginTop: 4 }}>June 14</div>
        </div>
        <div style={{ width: 1, background: "var(--rule)" }} />
        <div>
          <div className="smallcaps" style={{ fontSize: 9, color: "var(--ink-soft)" }}>Member #</div>
          <div className="serif" style={{ fontSize: 20, fontStyle: "italic", marginTop: 4 }}>0143</div>
        </div>
        <div style={{ width: 1, background: "var(--rule)" }} />
        <div>
          <div className="smallcaps" style={{ fontSize: 9, color: "var(--ink-soft)" }}>Tier</div>
          <div className="serif" style={{ fontSize: 20, fontStyle: "italic", marginTop: 4 }}>Pressers</div>
        </div>
      </div>
      <button className="btn-saloon" style={{ marginTop: 32 }}>Open Member Portal →</button>
    </div>
  );
}

function Register({ initialStep = 1 }) {
  const [step, setStep] = useStateReg(initialStep);
  const [form, setForm] = useStateReg({ firstName: "June", lastName: "Calloway", email: "june@texas.com", phone: "", tier: "pressers" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="paper-bg" style={{ minHeight: "100%", padding: "48px 24px 64px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {step <= 3 && <ProgressRail step={step} />}
        <div className="paper-card" style={{ background: "var(--paper)", position: "relative" }}>
          <TicketHeader />
          {step === 1 && <StepDetails form={form} set={set} onNext={() => setStep(2)} />}
          {step === 2 && <StepTier form={form} set={set} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
          {step === 3 && <StepCard form={form} onBack={() => setStep(2)} onSubmit={() => setStep(4)} />}
          {step === 4 && <StepDone form={form} />}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a href="#" className="smallcaps" style={{ fontSize: 10, color: "var(--ink-soft)", textDecoration: "none", letterSpacing: "0.22em" }}>← Back to Hill Country Cider House</a>
        </div>
      </div>
    </div>
  );
}

window.Register = Register;
