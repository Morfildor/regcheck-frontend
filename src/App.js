import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

const SAMPLE_DESCRIPTION = `Smart kettle with mobile app to control. Bluetooth connection to the app.`;

/* ─── Full names for each directive code ─── */
const DIRECTIVE_FULL_NAMES = {
  RED:    "Radio Equipment Directive",
  CRA:    "Cyber Resilience Act",
  GDPR:   "General Data Protection Regulation",
  AI_Act: "EU Artificial Intelligence Act",
  LVD:    "Low Voltage Directive",
  EMC:    "Electromagnetic Compatibility Directive",
  ESPR:   "Ecodesign for Sustainable Products Regulation",
};

/* ─── Colors per directive ─── */
const DIRECTIVE_CFG = {
  RED:    { bg: "#1e40af", light: "#dbeafe", text: "#1e3a8a" },
  CRA:    { bg: "#6d28d9", light: "#ede9fe", text: "#4c1d95" },
  GDPR:   { bg: "#065f46", light: "#d1fae5", text: "#064e3b" },
  AI_Act: { bg: "#7e22ce", light: "#f3e8ff", text: "#581c87" },
  LVD:    { bg: "#c2410c", light: "#ffedd5", text: "#7c2d12" },
  EMC:    { bg: "#a16207", light: "#fef9c3", text: "#713f12" },
  ESPR:   { bg: "#15803d", light: "#dcfce7", text: "#14532d" },
  SYSTEM: { bg: "#475569", light: "#f1f5f9", text: "#1e293b" },
};

const STATUS_CFG = {
  FAIL: { icon: "✕", bg: "#fff1f2", border: "#fecdd3", text: "#be123c", label: "FAIL" },
  WARN: { icon: "!",  bg: "#fffbeb", border: "#fde68a", text: "#b45309", label: "WARN" },
  PASS: { icon: "✓", bg: "#f0fdf4", border: "#86efac", text: "#16a34a", label: "PASS" },
  INFO: { icon: "i",  bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", label: "INFO" },
};

const RISK_CFG = {
  CRITICAL: { color: "#dc2626", tint: "#fef2f2", border: "#fca5a5" },
  HIGH:     { color: "#ea580c", tint: "#fff7ed", border: "#fdba74" },
  MEDIUM:   { color: "#d97706", tint: "#fffbeb", border: "#fcd34d" },
  LOW:      { color: "#16a34a", tint: "#f0fdf4", border: "#86efac" },
};

const STANDARD_CODE_RE =
  /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|GDPR review|AI Act review)\b/i;

const QUESTIONS = [
  { id: "what",     label: "What type of product is it?",         example: "smart kettle, robot vacuum, baby monitor",      detect: (t) => /\b(kettle|vacuum|camera|monitor|tracker|wearable|coffee machine|air fryer|fan|lock|gateway|hub|toy|sensor|appliance|device|product)\b/i.test(t) },
  { id: "wireless", label: "Does it use radio/wireless?",          example: "Bluetooth, Wi-Fi, LTE",                          detect: (t) => /\b(bluetooth|ble|wifi|wi-fi|802\.11|lte|4g|5g|zigbee|thread|matter|nfc|cellular|radio)\b/i.test(t) },
  { id: "software", label: "Does it use app, software or cloud?", example: "mobile app, cloud backend, OTA updates",         detect: (t) => /\b(app|mobile app|cloud|backend|server|internet|connected|ota|firmware|software)\b/i.test(t) },
  { id: "power",    label: "How is it powered?",                   example: "mains 230V, battery, rechargeable, USB",        detect: (t) => /\b(mains|230v|220v|110v|120v|battery|rechargeable|usb|hardwired|power)\b/i.test(t) },
  { id: "data",     label: "Does it process personal/sensitive data?", example: "camera, microphone, account, location, health", detect: (t) => /\b(camera|microphone|account|login|location|gps|health|heart rate|personal data|biometric)\b/i.test(t) },
];

/* ─── Helpers ─── */
function extractDirectivesFromFindings(findings = []) {
  const out = new Set();
  findings.forEach((f) => {
    (f.directive || "").split(",").map((x) => x.trim()).forEach((d) => {
      if (d && d !== "SYSTEM") out.add(d);
    });
  });
  return [...out];
}

function splitFindings(findings = []) {
  const buckets = { standards: [], interpretation: [], missingInfo: [], contradictions: [], other: [] };
  findings.forEach((f, index) => {
    const item = { ...f, _i: index };
    const article = (f.article || "").trim();
    const directive = (f.directive || "").trim();
    if (STANDARD_CODE_RE.test(article) || /review$/i.test(article)) { buckets.standards.push(item); return; }
    if (directive === "SYSTEM" && /Product interpretation|Explicit signals|Inferred signals/i.test(article)) { buckets.interpretation.push(item); return; }
    if (/Missing/i.test(article)) { buckets.missingInfo.push(item); return; }
    if (/Contradiction/i.test(article)) { buckets.contradictions.push(item); return; }
    buckets.other.push(item);
  });
  return buckets;
}

/* ─── DirectiveBadge: colored chip + full name ─── */
function DirectiveBadge({ code, size = "md" }) {
  const cfg = DIRECTIVE_CFG[code] || DIRECTIVE_CFG.SYSTEM;
  const fullName = DIRECTIVE_FULL_NAMES[code] || code;
  if (size === "sm") {
    return (
      <span className="dir-badge dir-badge--sm" style={{ "--bg": cfg.bg, "--light": cfg.light, "--txt": cfg.text }}>
        <span className="dir-badge__code">{code}</span>
        <span className="dir-badge__name">{fullName}</span>
      </span>
    );
  }
  return (
    <span className="dir-badge" style={{ "--bg": cfg.bg, "--light": cfg.light, "--txt": cfg.text }}>
      <span className="dir-badge__code">{code}</span>
      <span className="dir-badge__name">{fullName}</span>
    </span>
  );
}

/* ─── Finding row with directive badge ─── */
function FindingRow({ item }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.INFO;
  const directives = (item.directive || "").split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <div className="finding" style={{ "--s-bg": cfg.bg, "--s-border": cfg.border, "--s-text": cfg.text }}>
      <div className="finding__left">
        <span className="finding__icon">{cfg.icon}</span>
        <span className="finding__status-label">{cfg.label}</span>
      </div>

      <div className="finding__body">
        {/* Directive badges shown prominently */}
        {directives.length > 0 && (
          <div className="finding__directives">
            {directives.map((d) => (
              <DirectiveBadge key={d} code={d} size="sm" />
            ))}
          </div>
        )}

        <div className="finding__article">{item.article || "Note"}</div>
        <div className="finding__text">{item.finding}</div>

        {item.action && (
          <div className="finding__action">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            {item.action}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [desc, setDesc] = useState("");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.max(220, textareaRef.current.scrollHeight)}px`;
  }, [desc]);

  const answered = useMemo(() => QUESTIONS.map((q) => ({ ...q, done: q.detect(desc) })), [desc]);
  const doneCount = answered.filter((q) => q.done).length;
  const progress = Math.round((doneCount / QUESTIONS.length) * 100);
  const isReady = desc.trim().length >= 10;

  const sections = useMemo(() => result?.findings ? splitFindings(result.findings) : null, [result]);

  const directives = useMemo(() => {
    if (!result) return [];
    if (Array.isArray(result.directives) && result.directives.length) return result.directives;
    return extractDirectivesFromFindings(result.findings || []);
  }, [result]);

  const counts = useMemo(() => {
    if (!result?.findings) return {};
    return result.findings.reduce((acc, f) => { acc[f.status] = (acc[f.status] || 0) + 1; return acc; }, {});
  }, [result]);

  const riskCfg = result ? (RISK_CFG[result.overall_risk] || RISK_CFG.LOW) : RISK_CFG.LOW;

  const handleRun = useCallback(async () => {
    if (!isReady || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    abortRef.current = controller;
    setLoading(true); setError(null); setResult(null);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: [], depth }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      setResult(await response.json());
    } catch (err) {
      setError(err.name === "AbortError" ? "Request timed out. Please try again." : err.message || "Unexpected error.");
    } finally {
      clearTimeout(timeout); setLoading(false);
    }
  }, [depth, desc, isReady, loading]);

  const resetAll = useCallback(() => { abortRef.current?.abort(); setLoading(false); setError(null); setResult(null); }, []);

  return (
    <div className="shell">
      <Style />

      {/* ── Navigation ── */}
      <nav className="nav">
        <div className="nav__inner">
          <div className="nav__brand">
            <div className="brand-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            <span className="brand-name">RuleGrid</span>
          </div>
          <div className="nav__right">
            <span className="nav__tag">EU Compliance Scoping</span>
          </div>
        </div>
      </nav>

      <main className="page">

        {/* ── Hero ── */}
        <header className="hero">
          <div className="hero__text">
            <p className="hero__eyebrow">Appliance · CE Marking · Standards Mapping</p>
            <h1 className="hero__title">Describe your product.<br/>Get your compliance roadmap.</h1>
            <p className="hero__sub">
              Paste a short description of your product. RuleGrid infers which EU directives apply,
              which harmonised standards to check, and what information you still need to confirm.
            </p>
          </div>
          {directives.length > 0 && (
            <div className="hero__directives">
              <p className="hero__directives-label">Directives identified</p>
              <div className="hero__directives-list">
                {directives.map((d) => <DirectiveBadge key={d} code={d} />)}
              </div>
            </div>
          )}
        </header>

        {/* ── Input phase ── */}
        {!result && !loading && (
          <div className="input-layout">

            {/* Left: textarea */}
            <div className="input-main">
              <div className="card">
                <div className="card__head">
                  <h2 className="card__title">Product description</h2>
                  <p className="card__sub">Write naturally — one or two sentences is enough to get started.</p>
                </div>

                <div className="textarea-wrap">
                  <textarea
                    ref={textareaRef}
                    className="textarea"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder={`Try:\n\n${SAMPLE_DESCRIPTION}`}
                    aria-label="Product description"
                  />
                  <div className="textarea-footer">
                    <span className="muted-sm">{desc.length} chars</span>
                  </div>
                </div>

                <div className="controls">
                  <div className="depth-toggle">
                    <span className="muted-sm">Depth:</span>
                    {["standard","deep"].map((v) => (
                      <button key={v} type="button" className={`depth-btn ${depth === v ? "depth-btn--active" : ""}`} onClick={() => setDepth(v)}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="controls__right">
                    <button type="button" className="ghost-btn" onClick={() => setDesc(SAMPLE_DESCRIPTION)}>Use sample</button>
                    <button type="button" className="ghost-btn" onClick={() => setDesc("")}>Clear</button>
                    <button type="button" className="run-btn" onClick={handleRun} disabled={!isReady}>
                      Analyse →
                    </button>
                  </div>
                </div>

                {error && <div className="error-box">{error}</div>}
              </div>
            </div>

            {/* Right: checklist */}
            <aside className="input-aside">
              <div className="card checklist-card">
                <div className="checklist-head">
                  <span className="card__title" style={{fontSize:15}}>Coverage checklist</span>
                  <span className="progress-chip">{doneCount}/{QUESTIONS.length}</span>
                </div>

                <div className="progress-bar">
                  <div className="progress-bar__fill" style={{width:`${progress}%`}} />
                </div>

                <ul className="checklist">
                  {answered.map((q) => (
                    <li key={q.id} className={`checklist__item ${q.done ? "checklist__item--done" : ""}`}>
                      <span className={`check-dot ${q.done ? "check-dot--done" : ""}`}>{q.done ? "✓" : ""}</span>
                      <div>
                        <div className="checklist__label">{q.label}</div>
                        {!q.done && <div className="checklist__hint">{q.example}</div>}
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="checklist__footer">
                  {progress === 100 ? "Great detail — expect accurate results." : `${QUESTIONS.length - doneCount} topic(s) missing. Add them for better scoping.`}
                </p>
              </div>
            </aside>

          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="loading-wrap">
            <div className="card loading-card">
              <div className="spinner" />
              <div>
                <div className="card__title">Analysing your product…</div>
                <p className="card__sub">Mapping directives, standards, and missing information.</p>
              </div>
            </div>
            {[1,2,3].map((i) => <div key={i} className="skeleton" style={{animationDelay:`${i*0.12}s`}} />)}
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <>
            {/* Risk summary bar */}
            <div className="risk-bar card" style={{ "--r-tint": riskCfg.tint, "--r-border": riskCfg.border, "--r-color": riskCfg.color }}>
              <div className="risk-block">
                <span className="risk-label">Overall risk</span>
                <span className="risk-value">{result.overall_risk || "LOW"}</span>
              </div>
              <div className="risk-summary">
                <span className="risk-label">Summary</span>
                <p>{result.summary}</p>
              </div>
              <div className="risk-counts">
                {["FAIL","WARN","PASS","INFO"].map((s) => counts[s] ? (
                  <div key={s} className="count-pill" style={{ background: STATUS_CFG[s].bg, borderColor: STATUS_CFG[s].border, color: STATUS_CFG[s].text }}>
                    <span className="count-pill__n">{counts[s]}</span>
                    <span className="count-pill__s">{s}</span>
                  </div>
                ) : null)}
              </div>
              <button type="button" className="ghost-btn" onClick={resetAll} style={{alignSelf:"center"}}>← Edit</button>
            </div>

            <div className="results-layout">

              {/* Main findings column */}
              <div className="results-main">

                {/* Standards */}
                <div className="card section-card">
                  <div className="card__head">
                    <h2 className="card__title">Likely applicable standards</h2>
                    <p className="card__sub">Harmonised standards and regulatory review items inferred from your description.</p>
                  </div>
                  {sections?.standards?.length ? (
                    <div className="findings">
                      {sections.standards.map((f) => <FindingRow key={f._i} item={f} />)}
                    </div>
                  ) : (
                    <p className="empty">No standards identified from the current description.</p>
                  )}
                </div>

                {/* Missing info */}
                {sections?.missingInfo?.length ? (
                  <div className="card section-card">
                    <div className="card__head">
                      <h2 className="card__title">Information needed to refine the result</h2>
                      <p className="card__sub">Add these details to improve accuracy.</p>
                    </div>
                    <div className="findings">
                      {sections.missingInfo.map((f) => <FindingRow key={f._i} item={f} />)}
                    </div>
                  </div>
                ) : null}

                {/* Other findings */}
                {sections?.other?.length ? (
                  <div className="card section-card">
                    <div className="card__head">
                      <h2 className="card__title">Additional findings</h2>
                      <p className="card__sub">Other compliance notes from the analysis.</p>
                    </div>
                    <div className="findings">
                      {sections.other.map((f) => <FindingRow key={f._i} item={f} />)}
                    </div>
                  </div>
                ) : null}

                {/* Contradictions */}
                {sections?.contradictions?.length ? (
                  <div className="card section-card">
                    <div className="card__head">
                      <h2 className="card__title">Conflicting signals</h2>
                      <p className="card__sub">These reduce confidence and should be clarified.</p>
                    </div>
                    <div className="findings">
                      {sections.contradictions.map((f) => <FindingRow key={f._i} item={f} />)}
                    </div>
                  </div>
                ) : null}

              </div>

              {/* Sidebar */}
              <aside className="results-aside">

                {/* Directives overview */}
                <div className="card side-card">
                  <h3 className="side-title">Directives in scope</h3>
                  <div className="directive-stack">
                    {directives.length ? directives.map((d) => {
                      const cfg = DIRECTIVE_CFG[d] || DIRECTIVE_CFG.SYSTEM;
                      const fullName = DIRECTIVE_FULL_NAMES[d] || d;
                      return (
                        <div key={d} className="directive-row" style={{ "--bg": cfg.bg, "--light": cfg.light, "--txt": cfg.text }}>
                          <span className="directive-row__code">{d}</span>
                          <span className="directive-row__name">{fullName}</span>
                        </div>
                      );
                    }) : <p className="muted-sm">No directives found.</p>}
                  </div>
                </div>

                {/* Product interpretation */}
                <div className="card side-card">
                  <h3 className="side-title">Product interpretation</h3>
                  <p className="side-product-summary">{result.product_summary || "—"}</p>
                  <table className="meta-table">
                    <tbody>
                      <tr><td>Standards</td><td>{sections?.standards?.length || 0}</td></tr>
                      <tr><td>Missing details</td><td>{sections?.missingInfo?.length || 0}</td></tr>
                      <tr><td>Contradictions</td><td>{sections?.contradictions?.length || 0}</td></tr>
                    </tbody>
                  </table>
                </div>

              </aside>

            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <span>RuleGrid — EU appliance compliance scoping</span>
          <span>For informational purposes only. Always verify with a qualified consultant.</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── All styles in one component ─── */
function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      :root {
        --bg:       #f4f6f9;
        --surface:  #ffffff;
        --line:     #e4e8ef;
        --line2:    #edf0f5;
        --text:     #111827;
        --muted:    #6b7280;
        --muted2:   #9ca3af;
        --radius:   14px;
        --shadow:   0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
        --shadow-lg:0 8px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.04);
        --font:     'DM Sans', -apple-system, sans-serif;
        --mono:     'DM Mono', ui-monospace, monospace;
      }

      html, body, #root { min-height: 100%; }
      body {
        font-family: var(--font);
        color: var(--text);
        background: var(--bg);
        -webkit-font-smoothing: antialiased;
      }
      button { font: inherit; cursor: pointer; }
      textarea { font: inherit; resize: none; }
      ul { list-style: none; }

      /* ── Shell ── */
      .shell { min-height: 100vh; display: flex; flex-direction: column; }

      /* ── Nav ── */
      .nav {
        position: sticky; top: 0; z-index: 40;
        background: rgba(255,255,255,0.9);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid var(--line);
      }
      .nav__inner {
        max-width: 1200px; margin: 0 auto;
        padding: 0 24px; height: 60px;
        display: flex; align-items: center; justify-content: space-between;
      }
      .nav__brand { display: flex; align-items: center; gap: 10px; }
      .brand-mark {
        width: 34px; height: 34px; border-radius: 10px;
        background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
        display: grid; place-items: center;
        box-shadow: 0 4px 12px rgba(37,99,235,0.3);
      }
      .brand-name { font-size: 17px; font-weight: 700; letter-spacing: -0.03em; }
      .nav__tag {
        font-size: 12px; color: var(--muted);
        background: var(--bg); border: 1px solid var(--line);
        padding: 5px 10px; border-radius: 999px;
      }

      /* ── Page ── */
      .page { flex: 1; max-width: 1200px; margin: 0 auto; padding: 32px 24px 60px; width: 100%; }

      /* ── Hero ── */
      .hero {
        display: flex; gap: 32px; align-items: flex-start;
        margin-bottom: 28px; flex-wrap: wrap;
      }
      .hero__text { flex: 1; min-width: 280px; }
      .hero__eyebrow {
        font-size: 12px; font-weight: 600; letter-spacing: 0.08em;
        text-transform: uppercase; color: var(--muted);
        margin-bottom: 12px;
      }
      .hero__title {
        font-size: clamp(26px,4vw,38px); font-weight: 700;
        letter-spacing: -0.04em; line-height: 1.12;
        color: var(--text);
      }
      .hero__sub {
        margin-top: 14px; font-size: 15px; color: var(--muted);
        line-height: 1.75; max-width: 60ch;
      }
      .hero__directives { min-width: 260px; max-width: 420px; }
      .hero__directives-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
      .hero__directives-list { display: flex; flex-direction: column; gap: 8px; }

      /* ── Directive Badge ── */
      .dir-badge {
        display: inline-flex; align-items: center; gap: 0;
        border-radius: 10px; overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--bg) 0%, var(--light));
        width: 100%;
      }
      .dir-badge__code {
        padding: 8px 12px;
        background: var(--bg); color: white;
        font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
        font-family: var(--mono);
        white-space: nowrap;
        background: var(--bg); color: var(--txt);
      }
      .dir-badge__name {
        flex: 1; padding: 8px 12px;
        background: var(--light); color: var(--txt);
        font-size: 13px; font-weight: 500;
        line-height: 1.3;
      }

      /* Small badge variant for findings */
      .dir-badge--sm {
        border-radius: 7px; width: auto;
      }
      .dir-badge--sm .dir-badge__code {
        padding: 4px 8px; font-size: 10px;
      }
      .dir-badge--sm .dir-badge__name {
        padding: 4px 10px; font-size: 11px; font-weight: 600;
      }

      /* ── Card ── */
      .card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
      }
      .card__head { padding: 20px 22px 16px; border-bottom: 1px solid var(--line2); }
      .card__title { font-size: 16px; font-weight: 700; letter-spacing: -0.025em; }
      .card__sub { margin-top: 4px; font-size: 13px; color: var(--muted); line-height: 1.6; }

      /* ── Input layout ── */
      .input-layout { display: grid; grid-template-columns: 1fr 320px; gap: 18px; align-items: start; }

      .input-main .card { overflow: hidden; }

      .textarea-wrap { border-bottom: 1px solid var(--line2); }
      .textarea {
        display: block; width: 100%;
        min-height: 220px; padding: 18px 20px;
        border: none; outline: none; background: transparent;
        font-size: 14.5px; line-height: 1.8; color: var(--text);
        transition: background .15s;
      }
      .textarea:focus { background: rgba(248,250,255,0.6); }
      .textarea::placeholder { color: var(--muted2); }
      .textarea-footer { padding: 10px 20px; background: #fafbfc; }

      .controls {
        padding: 14px 20px;
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      }
      .controls__right { display: flex; gap: 8px; align-items: center; margin-left: auto; }

      .depth-toggle { display: flex; align-items: center; gap: 6px; }
      .depth-btn {
        padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
        border: 1px solid var(--line); background: white; color: var(--muted);
        transition: all .15s;
      }
      .depth-btn--active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
      .depth-btn:hover:not(.depth-btn--active) { background: var(--bg); }

      .ghost-btn {
        padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
        border: 1px solid var(--line); background: white; color: var(--muted);
        transition: all .15s;
      }
      .ghost-btn:hover { background: var(--bg); border-color: #cbd5e1; color: var(--text); }

      .run-btn {
        padding: 9px 20px; border-radius: 9px; font-size: 14px; font-weight: 700;
        border: none; background: linear-gradient(135deg,#1d4ed8,#2563eb);
        color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.3);
        transition: all .15s;
      }
      .run-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,235,0.38); }
      .run-btn:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }

      .error-box { margin: 0 16px 16px; padding: 13px 15px; border-radius: 10px; background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; font-size: 13px; line-height: 1.65; }

      /* ── Checklist ── */
      .checklist-card { overflow: hidden; }
      .checklist-head { padding: 16px 18px 12px; border-bottom: 1px solid var(--line2); display: flex; align-items: center; justify-content: space-between; }
      .progress-chip { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: var(--bg); border: 1px solid var(--line); color: var(--muted); }

      .progress-bar { height: 5px; background: #eef2ff; margin: 0 18px 2px; border-radius: 999px; overflow: hidden; }
      .progress-bar__fill { height: 100%; background: linear-gradient(90deg,#1d4ed8,#7c3aed); border-radius: 999px; transition: width .3s ease; }

      .checklist { padding: 8px 10px 6px; }
      .checklist__item { display: flex; gap: 12px; padding: 10px 8px; border-radius: 9px; transition: background .12s; }
      .checklist__item:hover { background: #f8fafc; }
      .checklist__item--done .checklist__label { color: var(--muted2); text-decoration: line-through; }
      .check-dot {
        flex: 0 0 20px; width: 20px; height: 20px; border-radius: 6px;
        border: 2px solid #d1d5db; background: white;
        display: grid; place-items: center; font-size: 11px; font-weight: 800; color: white;
        margin-top: 1px; transition: all .15s;
      }
      .check-dot--done { background: #22c55e; border-color: #22c55e; }
      .checklist__label { font-size: 13px; line-height: 1.4; font-weight: 500; }
      .checklist__hint { margin-top: 3px; font-size: 12px; color: var(--muted2); font-style: italic; }
      .checklist__footer { padding: 10px 18px 14px; font-size: 12px; color: var(--muted); line-height: 1.55; border-top: 1px solid var(--line2); }

      /* ── Loading ── */
      .loading-wrap { display: flex; flex-direction: column; gap: 12px; }
      .loading-card { padding: 20px 22px; display: flex; align-items: center; gap: 16px; }
      .spinner {
        flex: 0 0 28px; width: 28px; height: 28px;
        border: 3px solid #dbeafe; border-top-color: #2563eb;
        border-radius: 50%; animation: spin .7s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .skeleton {
        height: 88px; border-radius: var(--radius);
        background: linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%);
        background-size: 200% 100%;
        animation: shimmer 1.4s linear infinite;
        border: 1px solid var(--line);
      }
      @keyframes shimmer { to { background-position: -200% 0; } }

      /* ── Risk bar ── */
      .risk-bar {
        display: flex; align-items: stretch; gap: 0;
        margin-bottom: 20px; overflow: hidden; flex-wrap: wrap;
        padding: 0;
      }
      .risk-block {
        padding: 20px 24px; display: flex; flex-direction: column; justify-content: center;
        background: var(--r-tint); border-right: 1px solid var(--r-border); min-width: 160px;
      }
      .risk-label { font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; }
      .risk-value { font-size: 26px; font-weight: 800; letter-spacing: -0.05em; color: var(--r-color); }
      .risk-summary { padding: 20px 24px; flex: 1; display: flex; flex-direction: column; justify-content: center; border-right: 1px solid var(--line2); }
      .risk-summary p { font-size: 13.5px; line-height: 1.75; color: #374151; }
      .risk-counts { padding: 20px 18px; display: flex; flex-direction: column; gap: 8px; justify-content: center; border-right: 1px solid var(--line2); }
      .count-pill { display: flex; align-items: baseline; gap: 7px; padding: 8px 12px; border-radius: 9px; border: 1px solid; }
      .count-pill__n { font-size: 18px; font-weight: 800; line-height: 1; }
      .count-pill__s { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      .risk-bar .ghost-btn { margin: 20px 18px; }

      /* ── Results layout ── */
      .results-layout { display: grid; grid-template-columns: 1fr 300px; gap: 18px; align-items: start; }
      .results-main { display: flex; flex-direction: column; gap: 16px; }
      .results-aside { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 76px; }

      .section-card { overflow: hidden; }
      .findings { padding: 8px; }

      /* ── Finding row ── */
      .finding {
        display: grid;
        grid-template-columns: 56px 1fr;
        gap: 0;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 6px;
        border: 1px solid var(--s-border);
        background: var(--s-bg);
        transition: box-shadow .15s;
      }
      .finding:last-child { margin-bottom: 0; }
      .finding:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }

      .finding__left {
        display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
        padding: 14px 0 14px;
        background: color-mix(in srgb, var(--s-bg) 60%, var(--s-border));
        border-right: 1px solid var(--s-border);
        gap: 6px;
      }
      .finding__icon {
        font-size: 14px; font-weight: 800; color: var(--s-text);
        width: 26px; height: 26px; display: grid; place-items: center;
        border-radius: 7px; background: white; border: 1.5px solid var(--s-border);
      }
      .finding__status-label {
        font-size: 9px; font-weight: 800; letter-spacing: 0.09em;
        text-transform: uppercase; color: var(--s-text);
      }

      .finding__body { padding: 14px 16px; }
      .finding__directives { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }

      .finding__article {
        font-size: 11px; color: var(--muted); font-family: var(--mono);
        margin-bottom: 5px; letter-spacing: 0.01em;
      }
      .finding__text { font-size: 13.5px; color: #1f2937; line-height: 1.75; }
      .finding__action {
        display: flex; align-items: flex-start; gap: 6px;
        margin-top: 10px; padding: 10px 12px;
        background: rgba(255,255,255,0.7); border-radius: 8px;
        border: 1px solid var(--s-border);
        font-size: 12.5px; line-height: 1.65; color: #374151;
      }
      .finding__action svg { flex: 0 0 14px; margin-top: 2px; color: var(--s-text); }

      /* ── Sidebar cards ── */
      .side-card { padding: 18px 20px; }
      .side-title { font-size: 14px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 12px; }
      .side-product-summary { font-size: 13px; color: #374151; line-height: 1.7; margin-bottom: 14px; }

      .directive-stack { display: flex; flex-direction: column; gap: 6px; }
      .directive-row {
        display: flex; align-items: center; gap: 0;
        border-radius: 9px; overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--light) 70%, #ccc);
      }
      .directive-row__code {
        padding: 9px 12px; background: var(--bg); color: var(--txt);
        font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
        font-family: var(--mono); white-space: nowrap; min-width: 52px;
      }
      .directive-row__name {
        flex: 1; padding: 9px 12px;
        background: var(--light); color: var(--txt);
        font-size: 12px; font-weight: 500; line-height: 1.3;
      }

      .meta-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .meta-table td { padding: 7px 0; border-top: 1px solid var(--line2); color: #374151; }
      .meta-table td:first-child { color: var(--muted); }
      .meta-table td:last-child { text-align: right; font-weight: 600; }

      /* ── Empty ── */
      .empty { padding: 24px 22px; color: var(--muted); font-size: 13.5px; line-height: 1.65; }

      /* ── Misc utils ── */
      .muted-sm { font-size: 12px; color: var(--muted2); }

      /* ── Footer ── */
      .footer { border-top: 1px solid var(--line); background: white; }
      .footer__inner {
        max-width: 1200px; margin: 0 auto;
        padding: 16px 24px;
        display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
        font-size: 12px; color: var(--muted);
      }

      /* ── Responsive ── */
      @media (max-width: 1024px) {
        .input-layout, .results-layout { grid-template-columns: 1fr; }
        .results-aside { position: static; }
      }
      @media (max-width: 640px) {
        .page { padding: 20px 14px 40px; }
        .hero { flex-direction: column; }
        .controls { flex-direction: column; align-items: stretch; }
        .controls__right { flex-direction: column; }
        .run-btn, .ghost-btn { width: 100%; text-align: center; }
        .risk-bar { flex-direction: column; }
        .risk-block, .risk-summary, .risk-counts { border-right: none; border-bottom: 1px solid var(--line2); }
        .finding { grid-template-columns: 48px 1fr; }
        .nav__tag { display: none; }
        .footer__inner { flex-direction: column; }
      }
    `}</style>
  );
}