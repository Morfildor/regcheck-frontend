import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = process.env.REACT_APP_REGCHECK_API_URL || "https://regcheck-api.onrender.com/analyze";
const SAMPLE = "Smart kettle with mobile app. Bluetooth connection. Mains powered, 230V.";

const DIR_NAME = {
  RED:    "Radio Equipment Directive",
  CRA:    "Cyber Resilience Act",
  GDPR:   "General Data Protection Regulation",
  AI_Act: "EU Artificial Intelligence Act",
  LVD:    "Low Voltage Directive",
  EMC:    "Electromagnetic Compatibility Directive",
  ESPR:   "Ecodesign for Sustainable Products Reg.",
};

// Distinct, legible colors for categories
const DIR = {
  RED:    { dot:"#ef4444", bg:"#fee2e2", border:"#fca5a5", text:"#991b1b" },
  CRA:    { dot:"#3b82f6", bg:"#dbeafe", border:"#93c5fd", text:"#1e3a8a" },
  GDPR:   { dot:"#8b5cf6", bg:"#ede9fe", border:"#c4b5fd", text:"#5b21b6" },
  AI_Act: { dot:"#10b981", bg:"#d1fae5", border:"#6ee7b7", text:"#065f46" },
  LVD:    { dot:"#f59e0b", bg:"#fef3c7", border:"#fcd34d", text:"#92400e" },
  EMC:    { dot:"#06b6d4", bg:"#cffafe", border:"#67e8f9", text:"#155e75" },
  ESPR:   { dot:"#14b8a6", bg:"#ccfbf1", border:"#5eead4", text:"#115e59" },
  SYSTEM: { dot:"#64748b", bg:"#f1f5f9", border:"#cbd5e1", text:"#334155" },
};

// Standard semantic colors for risk/status
const STS = {
  FAIL: { icon:"×", class:"sts-fail", label:"FAIL" },
  WARN: { icon:"!", class:"sts-warn", label:"WARN" },
  PASS: { icon:"✓", class:"sts-pass", label:"PASS" },
  INFO: { icon:"i", class:"sts-info", label:"INFO" },
};

const RISK = {
  CRITICAL: "risk-critical",
  HIGH:     "risk-high",
  MEDIUM:   "risk-medium",
  LOW:      "risk-low",
};

const STD_RE = /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|GDPR review|AI Act review)\b/i;

const QUESTIONS = [
  { id:"type",  label:"Product type",             ok:t=>/\b(kettle|vacuum|camera|monitor|tracker|wearable|coffee|air.?fryer|fan|lock|gateway|hub|toy|sensor|appliance|device|product)\b/i.test(t) },
  { id:"radio", label:"Wireless/Radio tech",      ok:t=>/\b(bluetooth|ble|wifi|wi-fi|802\.11|lte|4g|5g|zigbee|thread|matter|nfc|cellular|radio)\b/i.test(t) },
  { id:"sw",    label:"App/Cloud/Firmware",       ok:t=>/\b(app|mobile.?app|cloud|backend|server|internet|connected|ota|firmware|software)\b/i.test(t) },
  { id:"power", label:"Power source",             ok:t=>/\b(mains|230v|220v|110v|120v|battery|rechargeable|usb|hardwired|wall.?plug)\b/i.test(t) },
  { id:"data",  label:"Personal/Sensitive data",  ok:t=>/\b(camera|microphone|account|login|location|gps|health|heart.?rate|personal.?data|biometric)\b/i.test(t) },
];

function getDirs(findings = []) {
  const s = new Set();
  findings.forEach(f => (f.directive || "").split(",").map(x => x.trim()).forEach(d => d && d !== "SYSTEM" && s.add(d)));
  return [...s];
}

function splitFindings(findings = []) {
  const b = { stds: [], interp: [], missing: [], contra: [], other: [] };
  findings.forEach((f, i) => {
    const row = { ...f, _i: i };
    const art = (f.article || "").trim();
    const dir = (f.directive || "").trim();
    if (STD_RE.test(art) || /review$/i.test(art)) return b.stds.push(row);
    if (dir === "SYSTEM" && /Product interpretation|Explicit signals|Inferred/i.test(art)) return b.interp.push(row);
    if (/Missing/i.test(art)) return b.missing.push(row);
    if (/Contradiction/i.test(art)) return b.contra.push(row);
    b.other.push(row);
  });
  return b;
}

function DirBadge({ code, compact = false }) {
  const d = DIR[code] || DIR.SYSTEM;
  const style = { "--bg": d.bg, "--border": d.border, "--text": d.text, "--dot": d.dot };
  
  if (compact) {
    return (
      <span className="badge-sm" style={style}>
        <span className="badge-sm__dot" />{code}
      </span>
    );
  }
  return (
    <span className="badge" style={style}>
      <span className="badge__dot" />
      <span className="badge__code">{code}</span>
      <span className="badge__rule" />
      <span className="badge__name">{DIR_NAME[code] || code}</span>
    </span>
  );
}

function FindingRow({ f }) {
  const s = STS[f.status] || STS.INFO;
  const dirs = (f.directive || "").split(",").map(x => x.trim()).filter(Boolean);
  return (
    <div className={`frow ${s.class}`}>
      <div className="frow__left">
        <span className="frow__icon">{s.icon}</span>
        <span className="frow__label">{s.label}</span>
      </div>
      <div className="frow__body">
        {dirs.length > 0 && (
          <div className="frow__chips">{dirs.map(d => <DirBadge key={d} code={d} compact />)}</div>
        )}
        {f.article && <div className="frow__art">{f.article}</div>}
        <div className="frow__text">{f.finding}</div>
        {f.action && <div className="frow__action"><span>›</span> {f.action}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [desc, setDesc] = useState("");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const taRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.max(160, taRef.current.scrollHeight) + "px";
  }, [desc]);

  const qs = useMemo(() => QUESTIONS.map(q => ({ ...q, done: q.ok(desc) })), [desc]);
  const doneN = qs.filter(q => q.done).length;
  const ready = desc.trim().length >= 10;

  const sec = useMemo(() => result?.findings ? splitFindings(result.findings) : null, [result]);
  const dirs = useMemo(() => {
    if (!result) return [];
    if (Array.isArray(result.directives) && result.directives.length) return result.directives;
    return getDirs(result.findings || []);
  }, [result]);
  
  const counts = useMemo(() => {
    if (!result?.findings) return {};
    return result.findings.reduce((a, f) => { a[f.status] = (a[f.status] || 0) + 1; return a; }, {});
  }, [result]);
  
  const riskClass = result ? (RISK[result.overall_risk] || RISK.LOW) : RISK.LOW;

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
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      setResult(await res.json());
    } catch (e) {
      setError(e.name === "AbortError" ? "Timeout." : e.message);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, [desc, depth, ready, loading]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false); setError(null); setResult(null);
  }, []);

  return (
    <div className="shell">
      <AppCSS />
      <nav className="nav">
        <div className="w nav-inner">
          <div className="nav-brand">RuleGrid</div>
          <div className="nav-pill">EU Compliance Mapping</div>
        </div>
      </nav>

      <main className="w page">
        {!result && !loading && (
          <div className="split-view">
            <div className="card input-col">
              <div className="card-head">
                <h2>Product Description</h2>
                <p>Define product type, connectivity, and power source.</p>
              </div>
              <textarea
                ref={taRef}
                className="ta"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder={"Example:\n" + SAMPLE}
              />
              <div className="controls">
                <div className="control-group">
                  <label>Depth</label>
                  <select value={depth} onChange={e => setDepth(e.target.value)} className="select-input">
                    <option value="standard">Standard</option>
                    <option value="deep">Deep</option>
                  </select>
                </div>
                <div className="actions">
                  <button className="btn-secondary" onClick={() => setDesc(SAMPLE)}>Sample</button>
                  <button className="btn-secondary" onClick={() => setDesc("")}>Clear</button>
                  <button className="btn-primary" onClick={run} disabled={!ready}>Analyze</button>
                </div>
              </div>
              {error && <div className="err-bar">{error}</div>}
            </div>

            <aside className="card checklist-col">
              <div className="card-head">
                <h3>Required Parameters</h3>
                <span className="counter">{doneN} / {QUESTIONS.length}</span>
              </div>
              <ul className="check-list">
                {qs.map(q => (
                  <li key={q.id} className={q.done ? "done" : "pending"}>
                    <span className="icon">{q.done ? "✓" : "○"}</span>
                    {q.label}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}

        {loading && (
          <div className="loading-state card">
            <span className="spinner" /> Processing analysis...
          </div>
        )}

        {result && (
          <div className="results-view">
            <header className={`risk-header ${riskClass}`}>
              <div className="risk-level">
                <span className="label">Overall Risk</span>
                <span className="value">{result.overall_risk || "LOW"}</span>
              </div>
              <div className="risk-summary">{result.summary}</div>
              <div className="risk-stats">
                {["FAIL", "WARN", "PASS", "INFO"].map(s => counts[s] ? (
                  <div key={s} className={`stat-pill sts-${s.toLowerCase()}`}>
                    <strong>{counts[s]}</strong> {s}
                  </div>
                ) : null)}
              </div>
              <button className="btn-secondary" onClick={reset}>New Query</button>
            </header>

            <div className="grid-layout">
              <div className="main-content">
                <Section title="Applicable Standards" items={sec?.stds} />
                <Section title="Missing Information" items={sec?.missing} />
                <Section title="Conflicting Signals" items={sec?.contra} />
                <Section title="Additional Findings" items={sec?.other} />
              </div>

              <aside className="sidebar">
                <div className="card side-card">
                  <h3>Directives in Scope</h3>
                  <div className="badge-stack">
                    {dirs.length > 0 ? dirs.map(d => <DirBadge key={d} code={d} />) : "None identified"}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="card sec">
      <div className="card-head"><h3>{title}</h3></div>
      <div className="flist">{items.map(f => <FindingRow key={f._i} f={f} />)}</div>
    </section>
  );
}

function AppCSS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

      :root {
        --bg-color: #f8fafc;
        --text-main: #0f172a;
        --text-muted: #64748b;
        --border-color: #e2e8f0;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; font-size: 14px; background: var(--bg-color); color: var(--text-main); }
      button { font: inherit; cursor: pointer; border: none; }
      ul { list-style: none; }

      .shell { min-height: 100vh; display: flex; flex-direction: column; }
      .w { max-width: 1200px; margin: 0 auto; width: 100%; padding: 0 20px; }
      .page { padding: 30px 20px 60px; }

      .nav { background: #0f172a; color: #fff; padding: 15px 0; }
      .nav-inner { display: flex; justify-content: space-between; align-items: center; }
      .nav-brand { font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }
      .nav-pill { background: #334155; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }

      .card { background: #fff; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); overflow: hidden; }
      .card-head { padding: 16px 20px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; }
      .card-head h2, .card-head h3 { font-size: 15px; font-weight: 600; }
      .card-head p { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

      .split-view { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
      
      .ta { width: 100%; padding: 16px 20px; border: none; outline: none; resize: none; font-size: 14px; line-height: 1.6; border-bottom: 1px solid var(--border-color); }
      .ta:focus { background: #f8fafc; }

      .controls { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
      .control-group { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; }
      .select-input { padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; font: inherit; }
      
      .actions { display: flex; gap: 8px; }
      .btn-secondary { padding: 8px 16px; background: #fff; border: 1px solid var(--border-color); border-radius: 6px; font-weight: 500; color: var(--text-main); }
      .btn-secondary:hover { background: #f1f5f9; }
      .btn-primary { padding: 8px 20px; background: #2563eb; color: #fff; border-radius: 6px; font-weight: 600; }
      .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
      .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }

      .checklist-col .counter { font-size: 12px; font-weight: 600; color: var(--text-muted); }
      .check-list { padding: 10px; }
      .check-list li { padding: 10px; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; }
      .check-list .done { color: var(--text-muted); }
      .check-list .icon { font-weight: 700; width: 16px; }
      .check-list .done .icon { color: #10b981; }
      
      .loading-state { padding: 40px; text-align: center; font-weight: 500; color: var(--text-muted); }

      /* Status Colors */
      .sts-fail { --s-bg: #fee2e2; --s-br: #fca5a5; --s-tx: #b91c1c; --s-st: #ef4444; }
      .sts-warn { --s-bg: #fef3c7; --s-br: #fcd34d; --s-tx: #b45309; --s-st: #f59e0b; }
      .sts-pass { --s-bg: #dcfce7; --s-br: #86efac; --s-tx: #15803d; --s-st: #10b981; }
      .sts-info { --s-bg: #e0f2fe; --s-br: #bae6fd; --s-tx: #0369a1; --s-st: #38bdf8; }

      .risk-header { display: flex; border-radius: 8px; border: 1px solid var(--r-br); background: var(--r-bg); margin-bottom: 20px; align-items: stretch; overflow: hidden; }
      .risk-critical { --r-bg: #fee2e2; --r-br: #fca5a5; --r-tx: #991b1b; }
      .risk-high { --r-bg: #ffedd5; --r-br: #fdba74; --r-tx: #c2410c; }
      .risk-medium { --r-bg: #fef3c7; --r-br: #fcd34d; --r-tx: #b45309; }
      .risk-low { --r-bg: #dcfce7; --r-br: #86efac; --r-tx: #15803d; }

      .risk-level { padding: 20px; border-right: 1px solid var(--r-br); display: flex; flex-direction: column; justify-content: center; min-width: 150px; }
      .risk-level .label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--text-muted); }
      .risk-level .value { font-size: 24px; font-weight: 800; color: var(--r-tx); }
      
      .risk-summary { padding: 20px; flex: 1; border-right: 1px solid var(--r-br); font-size: 14px; line-height: 1.6; }
      .risk-stats { padding: 15px; display: flex; flex-direction: column; gap: 8px; border-right: 1px solid var(--r-br); justify-content: center; }
      .stat-pill { background: var(--s-bg); border: 1px solid var(--s-br); color: var(--s-tx); padding: 4px 10px; border-radius: 4px; font-size: 11px; }
      .risk-header .btn-secondary { margin: 20px; align-self: center; }

      .grid-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
      .main-content { display: flex; flex-direction: column; gap: 20px; }
      .flist { padding: 10px; display: flex; flex-direction: column; gap: 10px; }

      .frow { display: grid; grid-template-columns: 40px 1fr; border: 1px solid var(--s-br); background: var(--s-bg); border-radius: 6px; overflow: hidden; }
      .frow__left { background: var(--s-st); display: flex; flex-direction: column; align-items: center; padding-top: 12px; color: #fff; }
      .frow__icon { font-weight: 800; font-size: 14px; }
      .frow__body { padding: 14px; }
      
      .frow__chips { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
      .frow__art { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
      .frow__text { font-size: 13px; color: var(--text-main); line-height: 1.6; }
      .frow__action { margin-top: 10px; padding: 8px 12px; background: rgba(255,255,255,0.7); border-radius: 4px; font-size: 12px; border: 1px solid var(--s-br); }

      .badge-stack { display: flex; flex-direction: column; gap: 8px; margin-top: 15px; }
      .badge, .badge-sm { display: inline-flex; align-items: center; border: 1px solid var(--border); background: var(--bg); color: var(--text); border-radius: 4px; overflow: hidden; }
      .badge { width: 100%; }
      .badge__dot, .badge-sm__dot { width: 6px; height: 6px; background: var(--dot); border-radius: 50%; margin: 0 8px; }
      .badge__code { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; padding: 6px 8px 6px 0; border-right: 1px solid var(--border); }
      .badge__name { font-size: 12px; padding: 6px 10px; font-weight: 500; background: rgba(255,255,255,0.4); flex: 1; }
      
      .badge-sm { padding: 4px 8px 4px 0; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; }

      @media (max-width: 900px) {
        .split-view, .grid-layout { grid-template-columns: 1fr; }
        .risk-header { flex-direction: column; }
        .risk-level, .risk-summary, .risk-stats { border-right: none; border-bottom: 1px solid var(--r-br); }
      }
    `}</style>
  );
}