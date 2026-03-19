import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react"
/*
  ┌──────────────────────────────────────────────┐
  │  POSEIDON PALETTE — the only colours used    │
  │  P1  #012030   deep navy                     │
  │  P2  #13678A   ocean blue                    │
  │  P3  #45C4B0   teal                          │
  │  P4  #9AEBA3   mint green                    │
  │  P5  #DAFDBA   pale lime                     │
  └──────────────────────────────────────────────┘

  Every hex value in this file is a tint, shade, or
  direct use of those five colours.  No red, orange,
  yellow, or purple anywhere.
*/

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

const SAMPLE =
  "Smart kettle with mobile app. Bluetooth connection. Mains powered, 230V.";

/* ── Directive metadata ────────────────────────────────────────────────── */
const DIR_NAME = {
  RED:    "Radio Equipment Directive",
  CRA:    "Cyber Resilience Act",
  GDPR:   "General Data Protection Regulation",
  AI_Act: "EU Artificial Intelligence Act",
  LVD:    "Low Voltage Directive",
  EMC:    "Electromagnetic Compatibility Directive",
  ESPR:   "Ecodesign for Sustainable Products Reg.",
};

/*
  Each directive uses a different corner of the palette so they are
  visually distinct but always harmonious.

  dot   = the dot/accent colour
  pill  = badge background (very light tint)
  ring  = badge border
  ink   = badge text
*/
const DIR = {
  RED:    { dot:"#012030", pill:"#cfe0e8", ring:"#8fb8c8", ink:"#012030" },
  CRA:    { dot:"#13678A", pill:"#d6edf5", ring:"#7db8cf", ink:"#0a3d52" },
  GDPR:   { dot:"#45C4B0", pill:"#daf4f0", ring:"#8dd8ce", ink:"#0d4840" },
  AI_Act: { dot:"#9AEBA3", pill:"#e5f9e8", ring:"#91d99a", ink:"#1a5228" },
  LVD:    { dot:"#012030", pill:"#d0dfe8", ring:"#8bafc0", ink:"#012030" },
  EMC:    { dot:"#13678A", pill:"#d4ecf5", ring:"#7bb5cf", ink:"#0a3d52" },
  ESPR:   { dot:"#45C4B0", pill:"#daf6f2", ring:"#8dd8ce", ink:"#0d4840" },
  SYSTEM: { dot:"#6a9faf", pill:"#dde9ed", ring:"#9abbc6", ink:"#1e4a57" },
};

/*
  Status colours — all derived from Poseidon.
  FAIL  → deepest navy (most serious, very dark)
  WARN  → ocean blue   (notable)
  PASS  → teal         (positive)
  INFO  → mint         (neutral / informational)

  bg     = row background
  border = row border & left stripe
  text   = label / icon colour
  stripe = left stripe (slightly darker than border)
*/
const STS = {
  FAIL: { icon:"×", label:"FAIL", bg:"#c8dde7", border:"#7aafc5", text:"#012030", stripe:"#13678A" },
  WARN: { icon:"!",  label:"WARN", bg:"#d6ecf5", border:"#7db8d0", text:"#093a50", stripe:"#2889a6" },
  PASS: { icon:"✓", label:"PASS", bg:"#daf4f0", border:"#7ccfc4", text:"#0a3c35", stripe:"#45C4B0" },
  INFO: { icon:"i",  label:"INFO", bg:"#e3f7e6", border:"#88d392", text:"#163e22", stripe:"#9AEBA3" },
};

/*
  Risk levels — all Poseidon tones, getting progressively deeper.
  CRITICAL → full deep navy feel
  HIGH     → dark ocean blue feel
  MEDIUM   → teal feel
  LOW      → mint feel
*/
const RISK = {
  CRITICAL: { bg:"#bdd4df", border:"#70a0b5", text:"#012030" },
  HIGH:     { bg:"#cce0ea", border:"#78adc2", text:"#062538" },
  MEDIUM:   { bg:"#d4eef8", border:"#80bdd4", text:"#0a3448" },
  LOW:      { bg:"#d6f5ee", border:"#7fcec3", text:"#094038" },
};

/* ── Helpers ───────────────────────────────────────────────────────────── */
const STD_RE = /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|GDPR review|AI Act review)\b/i;

const QUESTIONS = [
  { id:"type",    label:"What type of product is it?",                  eg:"kettle, robot vacuum, baby monitor",            ok:t=>/\b(kettle|vacuum|camera|monitor|tracker|wearable|coffee|air.?fryer|fan|lock|gateway|hub|toy|sensor|appliance|device|product)\b/i.test(t) },
  { id:"radio",   label:"Does it have wireless or radio?",              eg:"Bluetooth, Wi-Fi, LTE, Zigbee",                 ok:t=>/\b(bluetooth|ble|wifi|wi-fi|802\.11|lte|4g|5g|zigbee|thread|matter|nfc|cellular|radio)\b/i.test(t) },
  { id:"sw",      label:"Does it use an app, cloud, or firmware?",      eg:"mobile app, cloud backend, OTA updates",        ok:t=>/\b(app|mobile.?app|cloud|backend|server|internet|connected|ota|firmware|software)\b/i.test(t) },
  { id:"power",   label:"How is it powered?",                           eg:"mains 230V, battery, rechargeable, USB",        ok:t=>/\b(mains|230v|220v|110v|120v|battery|rechargeable|usb|hardwired|wall.?plug)\b/i.test(t) },
  { id:"data",    label:"Does it process personal or sensitive data?",  eg:"camera, mic, account, location, health data",   ok:t=>/\b(camera|microphone|account|login|location|gps|health|heart.?rate|personal.?data|biometric)\b/i.test(t) },
];

function getDirs(findings = []) {
  const s = new Set();
  findings.forEach(f =>
    (f.directive || "").split(",").map(x => x.trim())
      .forEach(d => d && d !== "SYSTEM" && s.add(d))
  );
  return [...s];
}

function splitFindings(findings = []) {
  const b = { stds: [], interp: [], missing: [], contra: [], other: [] };
  findings.forEach((f, i) => {
    const row = { ...f, _i: i };
    const art = (f.article || "").trim();
    const dir = (f.directive || "").trim();
    if (STD_RE.test(art) || /review$/i.test(art))                                               return b.stds.push(row);
    if (dir === "SYSTEM" && /Product interpretation|Explicit signals|Inferred/i.test(art))      return b.interp.push(row);
    if (/Missing/i.test(art))                                                                   return b.missing.push(row);
    if (/Contradiction/i.test(art))                                                             return b.contra.push(row);
    b.other.push(row);
  });
  return b;
}

/* ── Small components ──────────────────────────────────────────────────── */

/** Coloured directive badge: ● CODE · Full name */
function DirBadge({ code, compact = false }) {
  const d = DIR[code] || DIR.SYSTEM;
  if (compact) {
    return (
      <span className="badge-sm"
        style={{ "--dot": d.dot, "--pill": d.pill, "--ring": d.ring, "--ink": d.ink }}>
        <span className="badge-sm__dot" />
        {code}
      </span>
    );
  }
  return (
    <span className="badge"
      style={{ "--dot": d.dot, "--pill": d.pill, "--ring": d.ring, "--ink": d.ink }}>
      <span className="badge__dot" />
      <span className="badge__code">{code}</span>
      <span className="badge__rule" />
      <span className="badge__name">{DIR_NAME[code] || code}</span>
    </span>
  );
}

/** One finding row */
function FindingRow({ f }) {
  const s = STS[f.status] || STS.INFO;
  const dirs = (f.directive || "").split(",").map(x => x.trim()).filter(Boolean);
  return (
    <div className="frow"
      style={{
        "--fbg": s.bg,
        "--fborder": s.border,
        "--ftext": s.text,
        "--fstripe": s.stripe,
      }}>
      {/* left stripe + status */}
      <div className="frow__left">
        <span className="frow__icon">{s.icon}</span>
        <span className="frow__label">{s.label}</span>
      </div>

      {/* body */}
      <div className="frow__body">
        {dirs.length > 0 && (
          <div className="frow__chips">
            {dirs.map(d => <DirBadge key={d} code={d} compact />)}
          </div>
        )}
        <div className="frow__art">{f.article || ""}</div>
        <div className="frow__text">{f.finding}</div>
        {f.action && (
          <div className="frow__action">
            <span className="frow__arrow">›</span>
            <span>{f.action}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────────────────────── */
export default function App() {
  const [desc,    setDesc]    = useState("");
  const [depth,   setDepth]   = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const taRef    = useRef(null);
  const abortRef = useRef(null);

  // cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // auto-grow textarea
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.max(180, taRef.current.scrollHeight) + "px";
  }, [desc]);

  // checklist
  const qs      = useMemo(() => QUESTIONS.map(q => ({ ...q, done: q.ok(desc) })), [desc]);
  const doneN   = qs.filter(q => q.done).length;
  const pct     = Math.round((doneN / QUESTIONS.length) * 100);
  const ready   = desc.trim().length >= 10;

  // derived from result
  const sec  = useMemo(() => result?.findings ? splitFindings(result.findings) : null, [result]);
  const dirs = useMemo(() => {
    if (!result) return [];
    if (Array.isArray(result.directives) && result.directives.length) return result.directives;
    return getDirs(result.findings || []);
  }, [result]);
  const counts = useMemo(() => {
    if (!result?.findings) return {};
    return result.findings.reduce((a, f) => { a[f.status] = (a[f.status] || 0) + 1; return a; }, {});
  }, [result]);
  const rk = result ? (RISK[result.overall_risk] || RISK.LOW) : RISK.LOW;

  // run analysis
  const run = useCallback(async () => {
    if (!ready || loading) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    abortRef.current = ctrl;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: [], depth }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.name === "AbortError" ? "Request timed out — please try again." : e.message || "Unexpected error.");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, [desc, depth, ready, loading]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false); setError(null); setResult(null);
  }, []);

  /* ── render ── */
  return (
    <div className="shell">
      <AppCSS />

      {/* ── Nav ── */}
      <nav className="nav">
        <div className="w nav-inner">
          <div className="nav-brand">
            <span className="nav-mark">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
                stroke="#DAFDBA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 10 8 14 16 6" />
              </svg>
            </span>
            <span className="nav-name">RuleGrid</span>
          </div>
          <span className="nav-pill">EU Compliance Scoping</span>
        </div>
      </nav>

      {/* ── Page ── */}
      <main className="w page">

        {/* Hero */}
        <header className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Appliances · CE Marking · Standards Mapping</p>
            <h1>Describe your product.<br />Get your compliance roadmap.</h1>
            <p className="hero-sub">
              Write a short description — product type, connectivity, power source.
              RuleGrid maps likely EU directives, harmonised standards, and anything
              it still needs to know.
            </p>
          </div>
          {dirs.length > 0 && (
            <div className="hero-dirs">
              <p className="micro-label">Directives in scope</p>
              <div className="badge-stack">
                {dirs.map(d => <DirBadge key={d} code={d} />)}
              </div>
            </div>
          )}
        </header>

        {/* ── INPUT VIEW ── */}
        {!result && !loading && (
          <div className="split">

            {/* left — textarea */}
            <div className="card input-card">
              <div className="card-head">
                <h2 className="card-title">Product description</h2>
                <p className="card-hint">One or two sentences is enough to get started.</p>
              </div>

              <textarea
                ref={taRef}
                className="ta"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder={"Example:\n\n" + SAMPLE}
              />

              <div className="input-foot">
                <span className="char-count">{desc.length} chars</span>

                <div className="depth-seg">
                  <span className="depth-label">Depth</span>
                  {["standard", "deep"].map(v => (
                    <button key={v} type="button"
                      className={"seg-btn" + (depth === v ? " seg-btn--on" : "")}
                      onClick={() => setDepth(v)}>
                      {v[0].toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="action-row">
                  <button type="button" className="ghost-btn" onClick={() => setDesc(SAMPLE)}>Sample</button>
                  <button type="button" className="ghost-btn" onClick={() => setDesc("")}>Clear</button>
                  <button type="button" className="run-btn" onClick={run} disabled={!ready}>
                    Analyse →
                  </button>
                </div>
              </div>

              {error && <div className="err-bar">{error}</div>}
            </div>

            {/* right — checklist */}
            <aside className="card cl-card">
              <div className="cl-head">
                <span className="card-title" style={{ fontSize: 13 }}>Coverage checklist</span>
                <span className="cl-badge">{doneN}/{QUESTIONS.length}</span>
              </div>
              <div className="cl-bar">
                <div className="cl-bar-fill" style={{ width: pct + "%" }} />
              </div>
              <ul className="cl-list">
                {qs.map(q => (
                  <li key={q.id} className={"cl-row" + (q.done ? " cl-row--done" : "")}>
                    <span className={"cl-tick" + (q.done ? " cl-tick--on" : "")}>
                      {q.done ? "✓" : ""}
                    </span>
                    <div>
                      <div className="cl-qlabel">{q.label}</div>
                      {!q.done && <div className="cl-eg">{q.eg}</div>}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="cl-foot">
                {pct === 100
                  ? "Great detail — expect accurate results."
                  : `${QUESTIONS.length - doneN} topic(s) not yet covered.`}
              </p>
            </aside>

          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="load-wrap">
            <div className="card load-card">
              <span className="spinner" />
              <div>
                <div className="card-title">Analysing…</div>
                <p className="card-hint" style={{ marginTop: 4 }}>
                  Mapping directives, standards, and missing information.
                </p>
              </div>
            </div>
            {[96, 68, 54].map((h, i) => (
              <div key={i} className="skel" style={{ height: h, animationDelay: i * 0.15 + "s" }} />
            ))}
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <>
            {/* Risk / summary bar */}
            <div className="rbar card"
              style={{ "--rbg": rk.bg, "--rborder": rk.border, "--rtext": rk.text }}>
              <div className="rbar-risk">
                <span className="micro-label">Overall risk</span>
                <span className="rbar-val">{result.overall_risk || "LOW"}</span>
              </div>
              <div className="rbar-summary">
                <span className="micro-label">Summary</span>
                <p>{result.summary}</p>
              </div>
              <div className="rbar-pills">
                {["FAIL", "WARN", "PASS", "INFO"].map(s => counts[s] ? (
                  <div key={s} className="stat-pill"
                    style={{ "--fbg": STS[s].bg, "--fborder": STS[s].border, "--ftext": STS[s].text }}>
                    <span className="stat-n">{counts[s]}</span>
                    <span className="stat-s">{s}</span>
                  </div>
                ) : null)}
              </div>
              <button type="button" className="ghost-btn edit-btn" onClick={reset}>← Edit</button>
            </div>

            {/* Two-column results */}
            <div className="res-grid">

              {/* Left — findings */}
              <div className="res-main">

                <section className="card sec">
                  <div className="card-head">
                    <h2 className="card-title">Likely applicable standards</h2>
                    <p className="card-hint">Harmonised standards inferred from your description.</p>
                  </div>
                  {sec?.stds?.length
                    ? <div className="flist">{sec.stds.map(f => <FindingRow key={f._i} f={f} />)}</div>
                    : <p className="empty">No standards identified yet — add more detail.</p>}
                </section>

                {sec?.missing?.length > 0 && (
                  <section className="card sec">
                    <div className="card-head">
                      <h2 className="card-title">Information needed to refine the result</h2>
                      <p className="card-hint">Adding these details will improve accuracy.</p>
                    </div>
                    <div className="flist">{sec.missing.map(f => <FindingRow key={f._i} f={f} />)}</div>
                  </section>
                )}

                {sec?.other?.length > 0 && (
                  <section className="card sec">
                    <div className="card-head">
                      <h2 className="card-title">Additional findings</h2>
                      <p className="card-hint">Other compliance notes from the analysis.</p>
                    </div>
                    <div className="flist">{sec.other.map(f => <FindingRow key={f._i} f={f} />)}</div>
                  </section>
                )}

                {sec?.contra?.length > 0 && (
                  <section className="card sec">
                    <div className="card-head">
                      <h2 className="card-title">Conflicting signals</h2>
                      <p className="card-hint">These reduce accuracy — please clarify your description.</p>
                    </div>
                    <div className="flist">{sec.contra.map(f => <FindingRow key={f._i} f={f} />)}</div>
                  </section>
                )}

              </div>

              {/* Right — sidebar */}
              <aside className="res-aside">

                <div className="card side-card">
                  <h3 className="side-title">Directives in scope</h3>
                  {dirs.length > 0
                    ? <div className="badge-stack" style={{ marginTop: 10 }}>
                        {dirs.map(d => <DirBadge key={d} code={d} />)}
                      </div>
                    : <p className="muted-p">No directives identified yet.</p>}
                </div>

                <div className="card side-card">
                  <h3 className="side-title">Product interpretation</h3>
                  <p className="prod-sum">{result.product_summary || "—"}</p>
                  <table className="meta-tbl">
                    <tbody>
                      <tr><td>Standards found</td><td>{sec?.stds?.length || 0}</td></tr>
                      <tr><td>Details missing</td><td>{sec?.missing?.length || 0}</td></tr>
                      <tr><td>Contradictions</td><td>{sec?.contra?.length || 0}</td></tr>
                    </tbody>
                  </table>
                </div>

              </aside>
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="w footer-inner">
          <span>RuleGrid — EU appliance compliance scoping</span>
          <span>Informational only. Verify with a qualified consultant.</span>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ALL CSS — every colour is a Poseidon tint / shade / direct value.
   Palette reference:
     P1  #012030   deep navy
     P2  #13678A   ocean blue
     P3  #45C4B0   teal
     P4  #9AEBA3   mint green
     P5  #DAFDBA   pale lime
   ══════════════════════════════════════════════════════════════════════════ */
function AppCSS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

      /* ── reset & base ── */
      *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
      html, body, #root { min-height:100%; }
      button { font:inherit; cursor:pointer; border:none; }
      textarea { font:inherit; resize:none; }
      ul { list-style:none; }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;

        /*
          Background: very pale teal-tinted white.
          The two soft radials use P3 teal at 8% and P2 blue at 7%.
          The base is a near-white tint of P3 (#f0fbf9).
        */
        background:
          radial-gradient(ellipse 65% 40% at 0%   0%,  rgba(69,196,176,.08) 0%, transparent 60%),
          radial-gradient(ellipse 55% 35% at 100% 100%, rgba(19,103,138,.07) 0%, transparent 55%),
          #f0fbf9;

        color: #012030;
      }

      /* ── layout helpers ── */
      .shell { min-height:100vh; display:flex; flex-direction:column; }
      .w     { max-width:1180px; margin:0 auto; padding:0 22px; width:100%; }
      .page  { flex:1; padding:32px 22px 60px; }

      /* ── nav ── */
      .nav {
        position: sticky; top:0; z-index:40;
        background: #012030;                          /* P1 */
        border-bottom: 1px solid rgba(69,196,176,.16);/* P3 at 16% */
        backdrop-filter: blur(16px);
      }
      .nav-inner {
        height:56px;
        display:flex; align-items:center; justify-content:space-between;
      }
      .nav-brand { display:flex; align-items:center; gap:10px; }
      .nav-mark {
        width:30px; height:30px; border-radius:8px;
        background: linear-gradient(135deg, #13678A, #45C4B0); /* P2→P3 */
        display:grid; place-items:center;
        box-shadow: 0 2px 10px rgba(69,196,176,.30);
      }
      .nav-name {
        font-size:15px; font-weight:700; letter-spacing:-.025em;
        color: #DAFDBA;                               /* P5 */
      }
      .nav-pill {
        font-size:11px; font-weight:600; letter-spacing:.06em;
        text-transform:uppercase;
        color: #9AEBA3;                               /* P4 */
        background: rgba(154,235,163,.10);            /* P4 at 10% */
        border: 1px solid rgba(154,235,163,.22);
        padding: 4px 12px; border-radius:999px;
      }

      /* ── hero ── */
      .hero {
        display:flex; gap:30px; align-items:flex-start;
        margin-bottom:28px; flex-wrap:wrap;
      }
      .hero-copy { flex:1; min-width:260px; }
      .eyebrow {
        font-size:10.5px; font-weight:700; letter-spacing:.1em;
        text-transform:uppercase;
        color: #13678A;                               /* P2 */
        margin-bottom:10px;
      }
      .hero-copy h1 {
        font-size:clamp(22px,3.2vw,34px);
        font-weight:700; letter-spacing:-.04em; line-height:1.1;
        color: #012030;                               /* P1 */
      }
      .hero-sub {
        margin-top:12px; font-size:14.5px; line-height:1.8;
        color: #2a6070;                               /* dark tint of P2 */
        max-width:54ch;
      }
      .hero-dirs { min-width:240px; max-width:380px; }
      .micro-label {
        font-size:10px; font-weight:700; letter-spacing:.09em;
        text-transform:uppercase;
        color: #5a9baa;                               /* muted P2/P3 mix */
        margin-bottom:8px;
      }

      /* ── badge (full) ── */
      .badge-stack { display:flex; flex-direction:column; gap:6px; }
      .badge {
        display:inline-flex; align-items:stretch;
        border-radius:9px; overflow:hidden;
        border: 1px solid var(--ring);
        background: var(--pill);
        width:100%;
      }
      .badge__dot {
        flex:0 0 5px; background:var(--dot);
      }
      .badge__code {
        font-family:'JetBrains Mono',monospace;
        font-size:10px; font-weight:600;
        color: var(--ink);
        padding:8px 8px 8px 10px; white-space:nowrap;
      }
      .badge__rule {
        width:1px; background:var(--ring); margin:6px 0;
      }
      .badge__name {
        flex:1; padding:8px 12px;
        font-size:12.5px; font-weight:500; line-height:1.3;
        color: var(--ink);
        /* slightly lighter panel for the name half */
        background: rgba(255,255,255,.42);
      }

      /* ── badge compact (used inside findings) ── */
      .badge-sm {
        display:inline-flex; align-items:center; gap:5px;
        border-radius:6px; overflow:hidden;
        border:1px solid var(--ring);
        background:var(--pill);
        padding:3px 8px 3px 6px;
        font-family:'JetBrains Mono',monospace;
        font-size:10px; font-weight:600;
        color:var(--ink);
        white-space:nowrap;
      }
      .badge-sm__dot {
        width:5px; height:5px; border-radius:50%;
        background:var(--dot); flex-shrink:0;
      }

      /* ── card ── */
      .card {
        background: rgba(255,255,255,.88);
        border: 1px solid #b8d8e4;                    /* light P2 tint */
        border-radius:14px;
        box-shadow: 0 1px 3px rgba(1,32,48,.05), 0 4px 14px rgba(1,32,48,.06);
        backdrop-filter: blur(8px);
      }
      .card-head {
        padding:16px 20px 13px;
        border-bottom:1px solid #d6ecf3;              /* very light P2 tint */
      }
      .card-title {
        font-size:14px; font-weight:700; letter-spacing:-.02em;
        color:#012030;                                /* P1 */
      }
      .card-hint {
        margin-top:3px; font-size:12.5px; line-height:1.6;
        color:#3d7e90;                                /* mid P2/P3 */
      }

      /* ── input view split ── */
      .split {
        display:grid;
        grid-template-columns:1fr 290px;
        gap:14px; align-items:start;
      }
      .input-card { overflow:hidden; }

      .ta {
        display:block; width:100%; min-height:180px;
        padding:16px 20px;
        border:none; outline:none;
        background:transparent;
        font-size:14px; line-height:1.85; color:#012030;
        border-bottom:1px solid #d6ecf3;
        transition:background .16s;
      }
      .ta:focus { background:rgba(240,251,249,.55); }
      .ta::placeholder { color:#8ab5c2; }

      .input-foot {
        padding:10px 16px;
        display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        background:#e8f6fa;                           /* very pale P2/P3 tint */
        border-top:1px solid #d0e8f0;
      }
      .char-count { font-size:11.5px; color:#6a9faf; }

      .depth-seg  { display:flex; align-items:center; gap:6px; }
      .depth-label{ font-size:11.5px; color:#3d7e90; }
      .seg-btn {
        padding:5px 11px; border-radius:7px;
        font-size:12px; font-weight:600;
        border:1px solid #b8d8e4;
        background:#fff; color:#3d7e90;
        transition:all .13s;
      }
      .seg-btn--on {
        background: #d6ecf5;                          /* P2 tint */
        border-color: #7db8d0;
        color: #093a50;
      }
      .seg-btn:hover:not(.seg-btn--on) { background:#f0f9fc; }

      .action-row { display:flex; gap:7px; margin-left:auto; }

      .ghost-btn {
        padding:6px 13px; border-radius:8px;
        font-size:12.5px; font-weight:600;
        border:1px solid #b8d8e4;
        background:#fff; color:#2a6070;
        transition:all .13s;
      }
      .ghost-btn:hover {
        background: #ddf5f1;                          /* P3 tint */
        border-color: #7ccfc4;
        color: #094038;
      }

      .run-btn {
        padding:7px 18px; border-radius:9px;
        font-size:13px; font-weight:700;
        border:none;
        background: linear-gradient(130deg, #012030 0%, #13678A 100%); /* P1→P2 */
        color: #DAFDBA;                               /* P5 */
        box-shadow: 0 3px 12px rgba(19,103,138,.30);
        transition: all .15s;
      }
      .run-btn:hover:not(:disabled) {
        transform:translateY(-1px);
        box-shadow:0 5px 18px rgba(19,103,138,.38);
      }
      .run-btn:disabled {
        background: #c8dde7;
        color: #7aacba;
        box-shadow:none; cursor:not-allowed;
      }

      /* error bar — P2 tint, not red */
      .err-bar {
        margin:0 16px 14px;
        padding:11px 14px; border-radius:8px;
        background: #cfe0e8;                          /* light P1 tint */
        border:1px solid #8ab4c8;
        color:#012030; font-size:13px; line-height:1.65;
      }

      /* ── checklist ── */
      .cl-card { overflow:hidden; }
      .cl-head {
        padding:13px 16px 9px;
        display:flex; align-items:center; justify-content:space-between;
        border-bottom:1px solid #d6ecf3;
      }
      .cl-badge {
        font-size:11px; font-weight:700;
        padding:3px 9px; border-radius:999px;
        background:#ddf5f1; border:1px solid #7ccfc4;  /* P3 tints */
        color:#094038;
      }
      .cl-bar {
        height:3px; background:#d0e8f0;               /* P2 tint */
        margin:0 16px 2px; border-radius:999px; overflow:hidden;
      }
      .cl-bar-fill {
        height:100%; border-radius:inherit;
        background:linear-gradient(90deg,#13678A,#45C4B0); /* P2→P3 */
        transition:width .28s ease;
      }
      .cl-list { padding:5px 10px 2px; }
      .cl-row {
        display:flex; gap:9px; padding:9px 7px;
        border-radius:8px; transition:background .12s;
      }
      .cl-row:hover { background:#e8f6fa; }
      .cl-row--done .cl-qlabel { color:#8ab5c2; text-decoration:line-through; }
      .cl-tick {
        flex:0 0 18px; width:18px; height:18px; border-radius:5px;
        border:1.8px solid #9ac5d2;                   /* P2 tint */
        background:#fff; display:grid; place-items:center;
        font-size:9.5px; font-weight:800; color:#fff;
        margin-top:2px; transition:all .13s;
      }
      .cl-tick--on {
        background: #45C4B0;                          /* P3 */
        border-color: #45C4B0;
      }
      .cl-qlabel { font-size:12.5px; font-weight:500; color:#012030; line-height:1.4; }
      .cl-eg     { margin-top:2px; font-size:11px; color:#7aacba; font-style:italic; }
      .cl-foot {
        padding:8px 14px 12px;
        font-size:11.5px; color:#3d7e90; line-height:1.55;
        border-top:1px solid #d6ecf3;
      }

      /* ── loading ── */
      .load-wrap  { display:flex; flex-direction:column; gap:11px; }
      .load-card  { padding:18px 20px; display:flex; align-items:center; gap:14px; }
      .spinner {
        flex:0 0 24px; width:24px; height:24px;
        border:2.5px solid #c8dde7;
        border-top-color:#45C4B0;                     /* P3 */
        border-radius:50%;
        animation:spin .7s linear infinite;
      }
      @keyframes spin { to { transform:rotate(360deg); } }
      .skel {
        border-radius:14px; border:1px solid #c8dde7;
        background:linear-gradient(90deg,#daf0f5 0%,#f0fbf9 50%,#daf0f5 100%);
        background-size:200% 100%;
        animation:shim 1.6s linear infinite;
      }
      @keyframes shim { to { background-position:-200% 0; } }

      /* ── risk bar ── */
      .rbar {
        display:flex; flex-wrap:wrap; align-items:stretch;
        overflow:hidden; margin-bottom:16px; padding:0;
      }
      .rbar-risk {
        padding:16px 22px; min-width:140px;
        display:flex; flex-direction:column; justify-content:center;
        background:var(--rbg); border-right:1px solid var(--rborder);
      }
      .rbar-val {
        font-size:22px; font-weight:800; letter-spacing:-.05em;
        color:var(--rtext); margin-top:5px;
      }
      .rbar-summary {
        flex:1; padding:16px 22px;
        display:flex; flex-direction:column; justify-content:center;
        border-right:1px solid #d0e8f0;
      }
      .rbar-summary p { font-size:13px; line-height:1.78; color:#1e4a57; }
      .rbar-pills {
        padding:16px 14px;
        display:flex; flex-direction:column; gap:6px; justify-content:center;
        border-right:1px solid #d0e8f0;
      }
      .stat-pill {
        display:flex; align-items:baseline; gap:6px;
        padding:6px 10px; border-radius:8px;
        background:var(--fbg); border:1px solid var(--fborder);
      }
      .stat-n { font-size:16px; font-weight:800; line-height:1; color:var(--ftext); }
      .stat-s {
        font-size:9px; font-weight:700; letter-spacing:.1em;
        text-transform:uppercase; color:var(--ftext);
      }
      .edit-btn { margin:16px 14px; align-self:center; }

      /* ── results grid ── */
      .res-grid  { display:grid; grid-template-columns:1fr 280px; gap:14px; align-items:start; }
      .res-main  { display:flex; flex-direction:column; gap:12px; }
      .res-aside { display:flex; flex-direction:column; gap:12px; position:sticky; top:72px; }
      .sec       { overflow:hidden; }
      .flist     { padding:8px 6px; }
      .empty     { padding:18px 20px; font-size:13px; color:#3d7e90; line-height:1.65; }

      /* ── finding row ── */
      .frow {
        display:grid; grid-template-columns:46px 1fr;
        border-radius:9px; overflow:hidden;
        border:1px solid var(--fborder);
        background:var(--fbg);
        margin-bottom:6px;
        transition:box-shadow .13s;
      }
      .frow:last-child { margin-bottom:0; }
      .frow:hover { box-shadow:0 2px 10px rgba(1,32,48,.08); }

      /* left column — the stripe */
      .frow__left {
        background:var(--fstripe);
        display:flex; flex-direction:column;
        align-items:center; justify-content:flex-start;
        padding:13px 0 10px; gap:5px;
      }
      .frow__icon {
        width:22px; height:22px; border-radius:5px;
        background:rgba(255,255,255,.22);
        display:grid; place-items:center;
        font-size:12px; font-weight:800; color:#fff;
      }
      .frow__label {
        font-size:7.5px; font-weight:800; letter-spacing:.1em;
        text-transform:uppercase; color:rgba(255,255,255,.85);
      }

      /* body */
      .frow__body { padding:12px 14px; }
      .frow__chips { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px; }
      .frow__art {
        font-family:'JetBrains Mono',monospace;
        font-size:10.5px; color:#5a9baa; margin-bottom:4px;
      }
      .frow__text { font-size:13px; color:#0e3040; line-height:1.78; }
      .frow__action {
        display:flex; align-items:flex-start; gap:6px;
        margin-top:9px; padding:8px 11px;
        background:rgba(255,255,255,.55);
        border-radius:7px; border:1px solid var(--fborder);
        font-size:12px; line-height:1.65; color:#1e4a57;
      }
      .frow__arrow {
        font-size:14px; font-weight:700;
        color:var(--fstripe); line-height:1.5; flex-shrink:0;
      }

      /* ── sidebar cards ── */
      .side-card { padding:16px 18px; }
      .side-title {
        font-size:13px; font-weight:700; letter-spacing:-.02em;
        color:#012030; margin-bottom:4px;
      }
      .muted-p { font-size:12.5px; color:#5a9baa; margin-top:8px; }
      .prod-sum { font-size:12.5px; color:#1e4a57; line-height:1.75; margin-bottom:12px; }
      .meta-tbl { width:100%; border-collapse:collapse; font-size:12.5px; }
      .meta-tbl td { padding:6px 0; border-top:1px solid #d6ecf3; color:#1e4a57; }
      .meta-tbl td:first-child { color:#5a9baa; }
      .meta-tbl td:last-child  { text-align:right; font-weight:700; color:#13678A; }

      /* ── footer ── */
      .footer { border-top:1px solid #c8dde7; background:#fff; }
      .footer-inner {
        padding:13px 22px;
        display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;
        font-size:11.5px; color:#5a9baa;
      }

      /* ── responsive ── */
      @media (max-width:1020px) {
        .split, .res-grid { grid-template-columns:1fr; }
        .res-aside { position:static; }
        .hero-dirs { max-width:100%; }
      }
      @media (max-width:620px) {
        .page   { padding:18px 14px 44px; }
        .w      { padding:0 14px; }
        .hero   { flex-direction:column; }
        .input-foot { flex-direction:column; align-items:stretch; }
        .action-row { flex-direction:column; margin-left:0; }
        .run-btn, .ghost-btn { width:100%; text-align:center; }
        .rbar   { flex-direction:column; }
        .rbar-risk, .rbar-summary, .rbar-pills {
          border-right:none; border-bottom:1px solid #d0e8f0;
        }
        .nav-pill { display:none; }
        .footer-inner { flex-direction:column; }
      }
    `}</style>
  );
}