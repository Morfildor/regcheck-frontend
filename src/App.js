import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

const SAMPLE_DESCRIPTION = `Smart kettle with mobile app to control. Bluetooth connection to the app.`;

const STATUS_CFG = {
  FAIL: { icon: "✕", bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
  WARN: { icon: "!", bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  PASS: { icon: "✓", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  INFO: { icon: "i", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
};

const RISK_CFG = {
  CRITICAL: { color: "#dc2626", tint: "#fef2f2", border: "#fecaca" },
  HIGH: { color: "#ea580c", tint: "#fff7ed", border: "#fed7aa" },
  MEDIUM: { color: "#d97706", tint: "#fffbeb", border: "#fde68a" },
  LOW: { color: "#16a34a", tint: "#f0fdf4", border: "#bbf7d0" },
};

const DIRECTIVE_COLORS = {
  RED: "#2563eb",
  CRA: "#7c3aed",
  GDPR: "#059669",
  AI_Act: "#9333ea",
  LVD: "#ea580c",
  EMC: "#ca8a04",
  ESPR: "#16a34a",
  SYSTEM: "#475569",
};

const QUESTIONS = [
  {
    id: "what",
    label: "What is the product?",
    example: "smart kettle, robot vacuum, baby monitor",
    detect: (t) =>
      /\b(kettle|vacuum|camera|monitor|tracker|wearable|coffee machine|air fryer|fan|lock|gateway|hub|toy|sensor|appliance|device|product)\b/i.test(
        t
      ),
  },
  {
    id: "wireless",
    label: "Does it use radio/wireless?",
    example: "Bluetooth, Wi-Fi, LTE",
    detect: (t) =>
      /\b(bluetooth|ble|wifi|wi-fi|802\.11|lte|4g|5g|zigbee|thread|matter|nfc|cellular|radio)\b/i.test(
        t
      ),
  },
  {
    id: "software",
    label: "Does it use app/software/cloud?",
    example: "mobile app, cloud backend, OTA updates",
    detect: (t) =>
      /\b(app|mobile app|cloud|backend|server|internet|connected|ota|firmware|software)\b/i.test(
        t
      ),
  },
  {
    id: "power",
    label: "How is it powered?",
    example: "mains, 230V, battery, rechargeable",
    detect: (t) =>
      /\b(mains|230v|220v|110v|120v|battery|rechargeable|usb|hardwired|power)\b/i.test(
        t
      ),
  },
  {
    id: "data",
    label: "Does it process sensitive/personal data?",
    example: "camera, microphone, account, location, health",
    detect: (t) =>
      /\b(camera|microphone|account|login|location|gps|health|heart rate|personal data|biometric)\b/i.test(
        t
      ),
  },
];

const STANDARD_CODE_RE =
  /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|GDPR review|AI Act review)\b/i;

function extractDirectivesFromFindings(findings = []) {
  const out = new Set();
  findings.forEach((f) => {
    const raw = (f.directive || "").split(",").map((x) => x.trim());
    raw.forEach((d) => {
      if (d && d !== "SYSTEM") out.add(d);
    });
  });
  return [...out];
}

function splitFindings(findings = []) {
  const buckets = {
    standards: [],
    interpretation: [],
    missingInfo: [],
    contradictions: [],
    other: [],
  };

  findings.forEach((f, index) => {
    const item = { ...f, _i: index };
    const article = (f.article || "").trim();
    const directive = (f.directive || "").trim();

    if (STANDARD_CODE_RE.test(article) || /review$/i.test(article)) {
      buckets.standards.push(item);
      return;
    }

    if (
      directive === "SYSTEM" &&
      /Product interpretation|Explicit signals|Inferred signals/i.test(article)
    ) {
      buckets.interpretation.push(item);
      return;
    }

    if (/Missing/i.test(article)) {
      buckets.missingInfo.push(item);
      return;
    }

    if (/Contradiction/i.test(article)) {
      buckets.contradictions.push(item);
      return;
    }

    buckets.other.push(item);
  });

  return buckets;
}

function MetricCard({ label, value, tone = "slate", sub }) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub ? <div className="metric-sub">{sub}</div> : null}
    </div>
  );
}

function StatusPill({ status, count }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.INFO;
  return (
    <div
      className="status-pill"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
    >
      <span className="status-pill__count">{count}</span>
      <span className="status-pill__label">{status}</span>
    </div>
  );
}

function DirectiveChip({ code }) {
  return (
    <span
      className="directive-chip"
      style={{ background: DIRECTIVE_COLORS[code] || "#334155" }}
    >
      {code}
    </span>
  );
}

function FindingRow({ item, overrideLabel, overridePrefix }) {
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.INFO;

  return (
    <div className="finding">
      <div
        className="finding__icon"
        style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
      >
        {cfg.icon}
      </div>

      <div style={{ color: cfg.text }}>
        <div className="finding__article">{item.article || "Note"}</div>
        <div className="finding__text">{item.finding}</div>
        {item.action ? (
          <div className="finding__action">
            <strong>{overridePrefix || "Action"}:</strong> {item.action}
          </div>
        ) : null}
      </div>

      <div
        className="finding__status"
        style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
      >
        {overrideLabel || item.status}
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
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.max(
      250,
      textareaRef.current.scrollHeight
    )}px`;
  }, [desc]);

  const answered = useMemo(
    () => QUESTIONS.map((q) => ({ ...q, done: q.detect(desc) })),
    [desc]
  );
  const doneCount = answered.filter((q) => q.done).length;
  const progress = Math.round((doneCount / QUESTIONS.length) * 100);
  const isReady = desc.trim().length >= 10;

  const sections = useMemo(
    () => (result?.findings ? splitFindings(result.findings) : null),
    [result]
  );

  const directives = useMemo(() => {
    if (!result) return [];
    if (Array.isArray(result.directives) && result.directives.length) {
      return result.directives;
    }
    return extractDirectivesFromFindings(result.findings || []);
  }, [result]);

  const counts = useMemo(() => {
    if (!result?.findings) return {};
    return result.findings.reduce((acc, finding) => {
      acc[finding.status] = (acc[finding.status] || 0) + 1;
      return acc;
    }, {});
  }, [result]);

  const riskCfg = result
    ? RISK_CFG[result.overall_risk] || RISK_CFG.LOW
    : RISK_CFG.LOW;

  const standardDirectiveCounts = useMemo(() => {
    const map = {};
    (sections?.standards || []).forEach((s) => {
      (s.directive || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((d) => {
          map[d] = (map[d] || 0) + 1;
        });
    });
    return map;
  }, [sections]);

  const handleRun = useCallback(async () => {
    if (!isReady || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          category: "",
          directives: [],
          depth,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out or was cancelled.");
      } else {
        setError(err.message || "Unexpected error.");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [depth, desc, isReady, loading]);

  const resetAll = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return (
    <div className="app-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        :root {
          --bg: #f6f8fc;
          --surface: rgba(255,255,255,0.88);
          --line: #e2e8f0;
          --line-soft: #edf2f7;
          --text: #0f172a;
          --muted: #64748b;
          --muted-2: #94a3b8;
          --primary: #1d4ed8;
          --primary-soft: #eff6ff;
          --shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
          --radius: 18px;
        }

        * { box-sizing: border-box; }
        html, body, #root { min-height: 100%; }
        body {
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: var(--text);
          background:
            radial-gradient(circle at top left, rgba(59,130,246,0.09), transparent 30%),
            radial-gradient(circle at top right, rgba(124,58,237,0.09), transparent 26%),
            var(--bg);
        }

        button, textarea { font: inherit; }
        button { cursor: pointer; }
        textarea { resize: none; }

        .app-shell { min-height: 100vh; }

        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(14px);
          background: rgba(255,255,255,0.75);
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
        }

        .nav__inner, .page {
          width: min(1240px, calc(100vw - 32px));
          margin: 0 auto;
        }

        .nav__inner {
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .brand__logo {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: white;
          background: linear-gradient(135deg, #1d4ed8, #7c3aed);
          box-shadow: 0 8px 24px rgba(59,130,246,0.28);
        }

        .nav__badge {
          font-size: 12px;
          color: var(--muted);
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.9);
          border: 1px solid var(--line);
        }

        .page {
          padding: 28px 0 64px;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 18px;
          margin-bottom: 22px;
        }

        .card {
          background: var(--surface);
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          backdrop-filter: blur(12px);
        }

        .hero-card, .hero-side, .editor, .section-head, .results-card__head, .progress-shell, .sidebar-footer {
          padding: 22px;
        }

        .eyebrow {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.8);
          border: 1px solid var(--line);
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 14px;
        }

        h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 40px);
          line-height: 1.05;
          letter-spacing: -0.05em;
        }

        .hero-copy {
          margin-top: 12px;
          color: var(--muted);
          line-height: 1.75;
          max-width: 64ch;
        }

        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .metric-card {
          border: 1px solid var(--line);
          background: rgba(255,255,255,0.82);
          border-radius: 16px;
          padding: 14px;
        }

        .metric-label {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .metric-sub {
          margin-top: 6px;
          font-size: 12px;
          color: var(--muted-2);
          line-height: 1.5;
        }

        .tone-blue .metric-value { color: #1d4ed8; }
        .tone-violet .metric-value { color: #7c3aed; }
        .tone-green .metric-value { color: #15803d; }
        .tone-orange .metric-value { color: #ea580c; }

        .hero-side {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .hero-side__title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted-2);
          margin-bottom: 10px;
        }

        .chip-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .directive-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 999px;
          color: white;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .hero-note {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--line-soft);
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 18px;
          align-items: start;
        }

        .section-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          margin-top: 6px;
          font-size: 13px;
          color: var(--muted);
          line-height: 1.65;
        }

        .textarea-shell {
          border: 1px solid var(--line);
          border-radius: 16px;
          background: white;
          overflow: hidden;
          transition: border-color .18s ease, box-shadow .18s ease;
        }

        .textarea-shell:focus-within {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(147,197,253,0.18);
        }

        .textarea {
          display: block;
          width: 100%;
          min-height: 250px;
          padding: 18px 18px 16px;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text);
          line-height: 1.8;
          font-size: 14px;
        }

        .editor-bar {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--line-soft);
          padding: 12px 16px;
          flex-wrap: wrap;
          background: #fcfdff;
        }

        .editor-muted {
          color: var(--muted-2);
          font-size: 12px;
        }

        .control-row {
          margin-top: 14px;
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .segmented {
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          border-radius: 12px;
          background: rgba(255,255,255,0.9);
          border: 1px solid var(--line);
        }

        .segmented button, .ghost-btn, .primary-btn {
          border: 0;
          transition: transform .15s ease, background .15s ease, color .15s ease, box-shadow .15s ease;
        }

        .segmented button {
          padding: 9px 14px;
          border-radius: 10px;
          background: transparent;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
        }

        .segmented button.is-active {
          background: var(--primary-soft);
          color: var(--primary);
        }

        .ghost-btn {
          padding: 10px 14px;
          border-radius: 12px;
          background: white;
          border: 1px solid var(--line);
          color: var(--muted);
          font-weight: 600;
          font-size: 13px;
        }

        .primary-btn {
          margin-left: auto;
          padding: 11px 18px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: white;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 12px 24px rgba(37,99,235,0.22);
        }

        .primary-btn:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          box-shadow: none;
          cursor: not-allowed;
        }

        .ghost-btn:hover, .primary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .error-box {
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #9f1239;
          line-height: 1.7;
          font-size: 13px;
        }

        .sidebar-card {
          position: sticky;
          top: 84px;
          overflow: hidden;
        }

        .progress-shell {
          border-bottom: 1px solid var(--line-soft);
        }

        .progress-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .progress-badge {
          border-radius: 999px;
          padding: 6px 10px;
          border: 1px solid var(--line);
          font-size: 12px;
          font-weight: 700;
          background: white;
        }

        .progress-track {
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: #eef2ff;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #1d4ed8, #7c3aed);
          transition: width .25s ease;
        }

        .question-list {
          padding: 6px 10px 10px;
        }

        .question-row {
          display: flex;
          gap: 12px;
          padding: 12px 10px;
          border-radius: 12px;
        }

        .question-row:hover { background: rgba(248,250,252,0.95); }

        .check {
          width: 22px;
          height: 22px;
          flex: 0 0 22px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          margin-top: 2px;
          border: 2px solid #cbd5e1;
          color: white;
          font-size: 12px;
          font-weight: 700;
          background: white;
        }

        .check.done {
          background: #22c55e;
          border-color: #22c55e;
        }

        .question-label {
          font-size: 13px;
          line-height: 1.45;
        }

        .question-label.done {
          color: var(--muted-2);
          text-decoration: line-through;
        }

        .question-example {
          margin-top: 5px;
          color: var(--muted-2);
          font-size: 12px;
          font-style: italic;
          line-height: 1.55;
        }

        .sidebar-footer {
          border-top: 1px solid var(--line-soft);
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .loading-state {
          display: grid;
          gap: 12px;
          margin-top: 18px;
        }

        .skeleton {
          height: 104px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background:
            linear-gradient(90deg, rgba(241,245,249,.6) 0%, rgba(255,255,255,.95) 50%, rgba(241,245,249,.6) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.3s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .results-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 18px;
          align-items: start;
        }

        .risk-card {
          padding: 18px;
          display: grid;
          grid-template-columns: 180px 1fr auto;
          gap: 18px;
          margin-bottom: 16px;
        }

        .risk-block {
          border-radius: 16px;
          padding: 16px;
        }

        .risk-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: var(--muted-2);
          margin-bottom: 8px;
        }

        .risk-value {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.06em;
          line-height: 1;
        }

        .summary-box {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .summary-box p {
          margin: 0;
          color: #334155;
          line-height: 1.75;
          font-size: 14px;
        }

        .status-grid {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .status-pill {
          min-width: 74px;
          border: 1px solid;
          border-radius: 14px;
          padding: 10px 10px 8px;
          text-align: center;
        }

        .status-pill__count {
          display: block;
          font-size: 18px;
          font-weight: 800;
          line-height: 1;
        }

        .status-pill__label {
          display: block;
          margin-top: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .results-card {
          overflow: hidden;
        }

        .results-card + .results-card {
          margin-top: 16px;
        }

        .results-card__head {
          border-bottom: 1px solid var(--line-soft);
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
        }

        .results-card__title {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .results-card__subtitle {
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
        }

        .findings-list {
          padding: 8px;
        }

        .finding {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          gap: 14px;
          padding: 16px 14px;
          border-radius: 16px;
          transition: background .15s ease;
        }

        .finding + .finding { margin-top: 4px; }
        .finding:hover { background: rgba(248,250,252,0.95); }

        .finding__icon {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          border: 1px solid;
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 800;
        }

        .finding__article {
          font-size: 11px;
          font-weight: 700;
          color: var(--muted-2);
          margin-bottom: 6px;
          letter-spacing: 0.02em;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
        }

        .finding__text {
          color: #334155;
          line-height: 1.75;
          font-size: 13.5px;
        }

        .finding__action {
          margin-top: 10px;
          padding-left: 12px;
          border-left: 2px solid currentColor;
          font-size: 13px;
          line-height: 1.7;
          opacity: 0.92;
        }

        .finding__status {
          align-self: start;
          border-radius: 999px;
          border: 1px solid;
          padding: 5px 10px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sidebar-stack {
          display: grid;
          gap: 16px;
          position: sticky;
          top: 84px;
        }

        .side-card {
          padding: 18px;
        }

        .side-title {
          margin: 0 0 10px 0;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .side-muted {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.6;
        }

        .key-list {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }

        .key-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          justify-content: space-between;
          border-top: 1px solid var(--line-soft);
          padding-top: 10px;
        }

        .key-row:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .key-k {
          font-size: 12px;
          color: var(--muted);
          min-width: 110px;
        }

        .key-v {
          font-size: 13px;
          color: var(--text);
          line-height: 1.6;
          text-align: right;
        }

        .pill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .mini-pill {
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          background: #f8fafc;
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 7px 10px;
        }

        .empty {
          padding: 26px 20px;
          text-align: center;
          color: var(--muted);
          line-height: 1.7;
        }

        @media (max-width: 1080px) {
          .hero,
          .layout,
          .results-grid,
          .risk-card {
            grid-template-columns: 1fr;
          }

          .sidebar-card,
          .sidebar-stack {
            position: static;
          }

          .hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .primary-btn { margin-left: 0; }
        }

        @media (max-width: 720px) {
          .nav__inner, .page { width: min(100vw - 20px, 1240px); }
          .hero-metrics { grid-template-columns: 1fr; }
          .risk-card { padding: 14px; }
          .finding { grid-template-columns: 30px 1fr; }
          .finding__status { grid-column: 2; justify-self: start; margin-top: 8px; }
          .control-row { flex-direction: column; align-items: stretch; }
          .segmented { width: 100%; }
          .segmented button { flex: 1; }
          .ghost-btn, .primary-btn { width: 100%; }
          .nav__badge { display: none; }
          .key-row { flex-direction: column; }
          .key-v { text-align: left; }
        }
      `}</style>

      <div className="nav">
        <div className="nav__inner">
          <div className="brand">
            <div className="brand__logo">R</div>
            <div>RuleGrid</div>
          </div>
          <div className="nav__badge">Appliance compliance scoping</div>
        </div>
      </div>

      <main className="page">
        <section className="hero">
          <div className="card hero-card">
            <div className="eyebrow">Standards-first compliance scoping</div>
            <h1>Describe the appliance. Get likely directives, standards, and missing information.</h1>
            <p className="hero-copy">
              This version prioritizes product interpretation and likely applicable standards instead of showing only a flat warnings list.
            </p>
            <div className="hero-metrics">
              <MetricCard label="Checklist topics" value={QUESTIONS.length} tone="blue" />
              <MetricCard label="Coverage" value={`${progress}%`} tone="green" />
              <MetricCard
                label="Standards found"
                value={sections?.standards?.length || 0}
                tone="violet"
              />
              <MetricCard
                label="Missing details"
                value={sections?.missingInfo?.length || 0}
                tone="orange"
              />
            </div>
          </div>

          <div className="card hero-side">
            <div>
              <div className="hero-side__title">Likely directives</div>
              <div className="chip-wrap">
                {directives.length ? (
                  directives.map((d) => <DirectiveChip key={d} code={d} />)
                ) : (
                  <span className="editor-muted">
                    Directives will appear after analysis.
                  </span>
                )}
              </div>
            </div>

            <div className="hero-note">
              Best results come from a short but structured description: product type, connectivity, power, app/cloud, and any camera, microphone, health, or child-use context.
            </div>
          </div>
        </section>

        {!result && !loading && (
          <section className="layout">
            <div className="card input-card">
              <div className="section-head">
                <h2 className="section-title">Product description</h2>
                <div className="section-subtitle">
                  Describe the appliance naturally. The checker will infer likely traits and standards from sparse text.
                </div>
              </div>

              <div className="editor">
                <div className="textarea-shell">
                  <textarea
                    ref={textareaRef}
                    className="textarea"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder={`Example:\n\n${SAMPLE_DESCRIPTION}`}
                    aria-label="Product description"
                  />
                  <div className="editor-bar">
                    <span className="editor-muted">{desc.length} characters</span>
                    <span className="editor-muted">
                      Focus on product type, radio, app/cloud, power, and data features
                    </span>
                  </div>
                </div>

                <div className="control-row">
                  <div className="segmented" aria-label="Analysis depth">
                    {[
                      { value: "standard", label: "Standard" },
                      { value: "deep", label: "Deep" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={depth === option.value ? "is-active" : ""}
                        onClick={() => setDepth(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setDesc(SAMPLE_DESCRIPTION)}
                  >
                    Use sample
                  </button>

                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setDesc("")}
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleRun}
                    disabled={!isReady}
                  >
                    Run analysis →
                  </button>
                </div>

                {error ? <div className="error-box">{error}</div> : null}
              </div>
            </div>

            <aside className="card sidebar-card">
              <div className="progress-shell">
                <div className="progress-head">
                  <div>
                    <div className="section-title" style={{ fontSize: 15 }}>
                      Input coverage
                    </div>
                    <div className="section-subtitle" style={{ marginTop: 4 }}>
                      More detail improves product interpretation.
                    </div>
                  </div>
                  <div className="progress-badge">
                    {doneCount}/{QUESTIONS.length}
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="question-list">
                {answered.map((q) => (
                  <div key={q.id} className="question-row">
                    <div className={`check ${q.done ? "done" : ""}`}>
                      {q.done ? "✓" : ""}
                    </div>
                    <div>
                      <div className={`question-label ${q.done ? "done" : ""}`}>
                        {q.label}
                      </div>
                      {!q.done ? (
                        <div className="question-example">{q.example}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sidebar-footer">
                {progress === 100
                  ? "Good coverage. The backend should be able to infer more accurately."
                  : `${QUESTIONS.length - doneCount} prompt area(s) still missing.`}
              </div>
            </aside>
          </section>
        )}

        {loading && (
          <section>
            <div className="card" style={{ padding: 18, marginBottom: 14 }}>
              <div className="section-title">Running analysis…</div>
              <div className="section-subtitle">
                Interpreting product type, traits, directives, and likely standards.
              </div>
            </div>
            <div className="loading-state">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton" />
              ))}
            </div>
          </section>
        )}

        {result && (
          <section>
            <div className="card risk-card">
              <div
                className="risk-block"
                style={{ background: riskCfg.tint, border: `1px solid ${riskCfg.border}` }}
              >
                <div className="risk-label">Overall risk</div>
                <div className="risk-value" style={{ color: riskCfg.color }}>
                  {result.overall_risk || "LOW"}
                </div>
              </div>

              <div className="summary-box">
                <div className="risk-label">Summary</div>
                <p>{result.summary || "No summary returned."}</p>
              </div>

              <div className="status-grid">
                {["FAIL", "WARN", "PASS", "INFO"].map((status) =>
                  counts[status] ? (
                    <StatusPill key={status} status={status} count={counts[status]} />
                  ) : null
                )}
                <button type="button" className="ghost-btn" onClick={resetAll}>
                  ← Edit
                </button>
              </div>
            </div>

            <div className="results-grid">
              <div>
                <div className="card results-card">
                  <div className="results-card__head">
                    <div>
                      <div className="results-card__title">
                        Likely applicable standards
                      </div>
                      <div className="results-card__subtitle">
                        Initial standards and review items inferred from the current description
                      </div>
                    </div>
                    <div className="status-grid">
                      {directives.map((d) => (
                        <DirectiveChip key={d} code={d} />
                      ))}
                    </div>
                  </div>

                  {sections?.standards?.length ? (
                    <div className="findings-list">
                      {sections.standards.map((f) => (
                        <FindingRow
                          key={f._i}
                          item={f}
                          overridePrefix="Why shown"
                          overrideLabel={f.status}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty">
                      No standards were identified from the current description.
                    </div>
                  )}
                </div>

                {sections?.missingInfo?.length ? (
                  <div className="card results-card">
                    <div className="results-card__head">
                      <div>
                        <div className="results-card__title">
                          Information needed to refine the result
                        </div>
                        <div className="results-card__subtitle">
                          Add these details to improve standards scoping accuracy
                        </div>
                      </div>
                    </div>

                    <div className="findings-list">
                      {sections.missingInfo.map((f) => (
                        <FindingRow
                          key={f._i}
                          item={f}
                          overridePrefix="Add"
                          overrideLabel="MISSING"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {sections?.other?.length ? (
                  <div className="card results-card">
                    <div className="results-card__head">
                      <div>
                        <div className="results-card__title">Additional findings</div>
                        <div className="results-card__subtitle">
                          Other notes returned by the backend
                        </div>
                      </div>
                    </div>

                    <div className="findings-list">
                      {sections.other.map((f) => (
                        <FindingRow key={f._i} item={f} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="sidebar-stack">
                <div className="card side-card">
                  <h3 className="side-title">Product interpretation</h3>
                  <div className="side-muted">
                    How the backend understood the product before mapping standards.
                  </div>

                  <div className="key-list">
                    <div className="key-row">
                      <div className="key-k">Product summary</div>
                      <div className="key-v">{result.product_summary || "—"}</div>
                    </div>

                    <div className="key-row">
                      <div className="key-k">Standards found</div>
                      <div className="key-v">{sections?.standards?.length || 0}</div>
                    </div>

                    <div className="key-row">
                      <div className="key-k">Missing details</div>
                      <div className="key-v">{sections?.missingInfo?.length || 0}</div>
                    </div>

                    <div className="key-row">
                      <div className="key-k">Contradictions</div>
                      <div className="key-v">{sections?.contradictions?.length || 0}</div>
                    </div>
                  </div>

                  {sections?.interpretation?.length ? (
                    <div className="findings-list" style={{ padding: "12px 0 0 0" }}>
                      {sections.interpretation.map((f) => (
                        <div key={f._i} className="finding" style={{ paddingLeft: 0, paddingRight: 0 }}>
                          <div
                            className="finding__icon"
                            style={{
                              background: "#eff6ff",
                              borderColor: "#bfdbfe",
                              color: "#1d4ed8",
                            }}
                          >
                            i
                          </div>
                          <div>
                            <div className="finding__article">{f.article}</div>
                            <div className="finding__text">{f.finding}</div>
                            {f.action ? (
                              <div className="finding__action">
                                <strong>Note:</strong> {f.action}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="card side-card">
                  <h3 className="side-title">Directive coverage</h3>
                  <div className="side-muted">
                    Directives inferred from backend findings and standards mapping.
                  </div>
                  <div className="pill-list">
                    {directives.length ? (
                      directives.map((d) => (
                        <span key={d} className="mini-pill">
                          {d}
                          {standardDirectiveCounts[d]
                            ? ` · ${standardDirectiveCounts[d]}`
                            : ""}
                        </span>
                      ))
                    ) : (
                      <span className="mini-pill">No directives found</span>
                    )}
                  </div>
                </div>

                {sections?.contradictions?.length ? (
                  <div className="card side-card">
                    <h3 className="side-title">Contradictions</h3>
                    <div className="side-muted">
                      Conflicting signals reduce confidence and should be clarified.
                    </div>
                    <div className="findings-list" style={{ padding: "12px 0 0 0" }}>
                      {sections.contradictions.map((f) => (
                        <FindingRow
                          key={f._i}
                          item={f}
                          overrideLabel="CONFLICT"
                          overridePrefix="Clarify"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}