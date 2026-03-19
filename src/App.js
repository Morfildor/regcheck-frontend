import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

const SAMPLE_DESCRIPTION = `A smart home water leak detector intended for EU consumers. It uses Wi-Fi 802.11n to connect to an AWS cloud backend hosted in Ireland and sends alerts through a companion mobile app. The device runs embedded firmware and supports OTA updates. It is powered by two AA batteries and contains no mains voltage inside the product. It stores device ID, event history, and optional user email for notifications. No AI features are used.`;

const QUESTIONS = [
  {
    id: "what",
    label: "What does your product do?",
    example: '“A smart thermostat that controls home heating”',
    detect: (t) =>
      t.length > 60 &&
      /\b(device|product|system|sensor|monitor|tracker|controller|hub|gateway|camera|speaker|display|wearable|appliance|charger|meter|lock|alarm|thermostat|reader|scanner|detector|module|unit)\b/i.test(t),
  },
  {
    id: "market",
    label: "Who uses it and where?",
    example: '“EU consumers at home” or “B2B industrial factory”',
    detect: (t) =>
      /\b(consumer|residential|household|home|personal|retail|industrial|b2b|factory|medical|clinical|hospital|professional|children|kids|patient|office|eu|uk)\b/i.test(t),
  },
  {
    id: "wireless",
    label: "Does it use wireless / radio?",
    example: '“Wi-Fi 802.11ac” or “Bluetooth 5.0” or “No wireless”',
    detect: (t) =>
      /wifi|wi-fi|bluetooth|ble|\blte\b|4g |5g |zigbee|nfc|lora|cellular|gsm|nb-iot|wireless|radio|rf |thread|matter|no wireless|no radio/i.test(t),
  },
  {
    id: "power",
    label: "How is it powered?",
    example: '“230V mains” or “3.7V Li-ion battery” or “USB-C 5V”',
    detect: (t) =>
      /230v|220v|110v|mains|li-ion|lithium|battery|usb-c|usb power|poe|rechargeable|hardwired|power supply|alkaline|coin cell|aa battery/i.test(t),
  },
  {
    id: "data",
    label: "Does it collect personal data?",
    example: '“Stores user email and GPS location” or “No personal data”',
    detect: (t) =>
      /personal data|user data|email|location|gps|health|biometric|account|profile|login|password|tracking|camera|microphone|face|voice|no personal data|no user data/i.test(t),
  },
  {
    id: "cloud",
    label: "Does it connect to the internet?",
    example: '“AWS cloud in Ireland” or “Fully offline, no internet”',
    detect: (t) =>
      /cloud|server|aws|azure|google cloud|backend|api |internet|online|local only|no cloud|offline|standalone|no internet/i.test(t),
  },
  {
    id: "software",
    label: "Does it have software or firmware?",
    example: '“Embedded firmware with OTA updates” or “No software”',
    detect: (t) =>
      /firmware|software|ota|over-the-air|embedded|mobile app|companion app|rtos|linux|update|microcontroller|android|ios app|no software|purely mechanical/i.test(t),
  },
  {
    id: "login",
    label: "How do users log in?",
    example: '“Unique per-device password” or “OAuth2 + MFA” or “No login”',
    detect: (t) =>
      /password|login|credential|authentication|mfa|2fa|oauth|pairing|pin code|default password|unique password|no login|no authentication/i.test(t),
  },
  {
    id: "ai",
    label: "Does it use AI or machine learning?",
    example: '“On-device ML model” or “Cloud GPT” or “No AI features”',
    detect: (t) =>
      /\bai\b|machine learning|\bml\b|neural|inference|llm|computer vision|voice assistant|recommendation|automated decision|no ai|no ml/i.test(t),
  },
  {
    id: "safety",
    label: "Any physical safety concerns?",
    example: '“Contains Li-ion battery” or “230V inside” or “No hazards”',
    detect: (t) =>
      /high voltage|mains|li-ion|lithium|motor|heating|thermal|ip[0-9][0-9]|waterproof|fire|smoke|safety function|fail.safe|no safety|no hazard|battery cell/i.test(t),
  },
];

const DIR_META = {
  RED: { label: "RED", full: "Radio Equipment Directive", color: "#2563eb" },
  CRA: { label: "CRA", full: "Cyber Resilience Act", color: "#7c3aed" },
  GDPR: { label: "GDPR", full: "General Data Protection Regulation", color: "#059669" },
  AI_Act: { label: "AI Act", full: "Artificial Intelligence Act", color: "#9333ea" },
  LVD: { label: "LVD", full: "Low Voltage Directive", color: "#ea580c" },
  EMC: { label: "EMC", full: "EMC Directive", color: "#ca8a04" },
  ESPR: { label: "ESPR", full: "Ecodesign for Sustainable Products", color: "#16a34a" },
};

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

function detectDirectives(text) {
  const t = text.toLowerCase();
  const has = (kws) => kws.some((k) => t.includes(k));
  const results = [];

  if (
    has([
      "wifi",
      "wi-fi",
      "wlan",
      "802.11",
      "bluetooth",
      "ble",
      "zigbee",
      "z-wave",
      "thread",
      "matter",
      "lora",
      "lorawan",
      "nfc",
      "near field",
      "rfid",
      "lte",
      "4g ",
      "5g ",
      "nb-iot",
      "cat-m",
      "cellular",
      "gsm",
      "radio",
      "rf module",
      "wireless transmit",
    ])
  ) {
    results.push("RED");
  }

  if (
    has([
      "software",
      "firmware",
      "embedded",
      "microcontroller",
      "microprocessor",
      "app ",
      "mobile app",
      "web app",
      "cloud",
      "server",
      "api",
      "backend",
      "internet",
      "online",
      "iot",
      "connected",
      "ota",
      "over-the-air",
      "remote update",
      "digital",
      "processor",
      "mcu",
      "network",
      "ethernet",
      "tcp",
      "mqtt",
      "http",
      "usb",
    ])
  ) {
    results.push("CRA");
  }

  if (
    has([
      "personal data",
      "user data",
      "email",
      "location",
      "gps",
      "health",
      "biometric",
      "account",
      "login",
      "password",
      "tracking",
      "camera",
      "microphone",
      "face recognition",
      "voice recognition",
      "analytics",
      "telemetry",
      "store data",
      "logging",
      "third party",
      "privacy",
      "consent",
    ])
  ) {
    results.push("GDPR");
  }

  if (
    has([
      "artificial intelligence",
      "machine learning",
      "deep learning",
      " ai ",
      "ai-powered",
      " ml ",
      "neural network",
      "llm",
      "computer vision",
      "voice assistant",
      "recommendation",
      "automated decision",
      "predictive",
      "inference",
      "classifier",
      "chatbot",
    ])
  ) {
    results.push("AI_Act");
  }

  if (
    has([
      "230v",
      "220v",
      "110v",
      "120v",
      "mains",
      "ac power",
      "wall plug",
      "hardwired",
      "power supply",
      "mains-powered",
      "li-ion",
      "lithium ion",
      "lipo",
      "lithium polymer",
      "battery pack",
      "bms",
      "high voltage",
      "motor drive",
      "inverter",
      "poe",
      "rechargeable battery",
    ])
  ) {
    results.push("LVD");
  }

  if (
    has([
      "electronic",
      "electrical",
      "pcb",
      "circuit board",
      "sensor",
      "actuator",
      "motor",
      "relay",
      "microcontroller",
      "microprocessor",
      "power supply",
      "battery",
      "usb",
      "230v",
      "mains",
      "wifi",
      "bluetooth",
      "radio",
      "wireless",
      "display",
      "lcd",
      "oled",
      "led driver",
    ])
  ) {
    results.push("EMC");
  }

  if (
    has([
      "repair",
      "repairable",
      "replaceable part",
      "spare part",
      "right to repair",
      "recycled",
      "recyclable",
      "circular",
      "end of life",
      "sustainability",
      "sustainable",
      "carbon footprint",
      "energy label",
      "ecodesign",
      "digital product passport",
      "durability",
      "standby power",
      "energy consumption",
    ])
  ) {
    results.push("ESPR");
  }

  if (results.length === 0 && text.trim().length > 30) {
    results.push("CRA", "EMC");
  }

  return results;
}

function groupFindings(findings = []) {
  return findings.reduce((acc, item, index) => {
    const key = item.directive || "OTHER";
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...item, _i: index });
    return acc;
  }, {});
}

function MetricCard({ label, value, tone = "slate" }) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

function StatusPill({ status, count }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.INFO;
  return (
    <div className="status-pill" style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}>
      <span className="status-pill__count">{count}</span>
      <span className="status-pill__label">{status}</span>
    </div>
  );
}

export default function App() {
  const [desc, setDesc] = useState("");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.max(300, textareaRef.current.scrollHeight)}px`;
  }, [desc]);

  const detected = useMemo(() => detectDirectives(desc), [desc]);
  const answered = useMemo(
    () => QUESTIONS.map((q) => ({ ...q, done: q.detect(desc) })),
    [desc]
  );
  const doneCount = answered.filter((q) => q.done).length;
  const progress = Math.round((doneCount / QUESTIONS.length) * 100);
  const isReady = desc.trim().length >= 20;

  const grouped = useMemo(() => (result ? groupFindings(result.findings) : {}), [result]);
  const dirTabs = useMemo(() => Object.keys(grouped), [grouped]);
  const counts = useMemo(() => {
    if (!result?.findings) return {};
    return result.findings.reduce((acc, finding) => {
      acc[finding.status] = (acc[finding.status] || 0) + 1;
      return acc;
    }, {});
  }, [result]);

  const tabFindings = activeTab && grouped[activeTab] ? grouped[activeTab] : [];
  const riskCfg = result ? RISK_CFG[result.overall_risk] || RISK_CFG.LOW : null;

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
          directives: detected,
          depth,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      const groupedData = groupFindings(data.findings || []);
      setActiveTab(Object.keys(groupedData)[0] || null);
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
  }, [depth, desc, detected, isReady, loading]);

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
          --surface-strong: #ffffff;
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

        .app-shell {
          min-height: 100vh;
          color: var(--text);
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(14px);
          background: rgba(255,255,255,0.75);
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
        }

        .nav__inner,
        .page {
          width: min(1200px, calc(100vw - 32px));
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
          width: 36px;
          height: 36px;
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
          grid-template-columns: 1.3fr 0.7fr;
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

        .hero-card {
          padding: 26px;
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
          max-width: 60ch;
        }

        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
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

        .tone-blue .metric-value { color: #1d4ed8; }
        .tone-violet .metric-value { color: #7c3aed; }
        .tone-green .metric-value { color: #15803d; }

        .hero-side {
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100%;
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

        .chip {
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

        .input-card,
        .sidebar-card,
        .results-card,
        .risk-card {
          overflow: hidden;
        }

        .section-head {
          padding: 18px 22px 0;
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

        .editor {
          padding: 16px 22px 18px;
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
          min-height: 300px;
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

        .segmented button,
        .ghost-btn,
        .primary-btn,
        .tab-btn {
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

        .primary-btn:hover:not(:disabled),
        .ghost-btn:hover,
        .tab-btn:hover {
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
        }

        .progress-shell {
          padding: 18px 18px 14px;
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
          padding: 14px 18px 18px;
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

        .tab-bar {
          display: flex;
          gap: 8px;
          margin: 0 0 10px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          border-radius: 12px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.72);
          border: 1px solid var(--line);
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
        }

        .tab-btn.active {
          background: white;
          color: var(--text);
          box-shadow: 0 8px 18px rgba(15,23,42,0.07);
        }

        .tab-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          flex: 0 0 9px;
        }

        .results-card__head {
          padding: 18px 20px;
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

        .empty {
          padding: 32px 20px;
          text-align: center;
          color: var(--muted);
          line-height: 1.7;
        }

        @media (max-width: 1080px) {
          .hero,
          .layout,
          .risk-card {
            grid-template-columns: 1fr;
          }

          .sidebar-card {
            position: static;
          }

          .hero-metrics {
            grid-template-columns: 1fr 1fr 1fr;
          }

          .primary-btn { margin-left: 0; }
        }

        @media (max-width: 720px) {
          .nav__inner, .page { width: min(100vw - 20px, 1200px); }
          .hero-card, .hero-side, .editor, .section-head, .results-card__head, .progress-shell, .sidebar-footer { padding-left: 16px; padding-right: 16px; }
          .hero-metrics { grid-template-columns: 1fr; }
          .risk-card { padding: 14px; }
          .finding { grid-template-columns: 30px 1fr; }
          .finding__status { grid-column: 2; justify-self: start; margin-top: 8px; }
          .control-row { flex-direction: column; align-items: stretch; }
          .segmented { width: 100%; justify-content: stretch; }
          .segmented button { flex: 1; }
          .ghost-btn, .primary-btn { width: 100%; }
          .nav__badge { display: none; }
        }
      `}</style>

      <div className="nav">
        <div className="nav__inner">
          <div className="brand">
            <div className="brand__logo">R</div>
            <div>RuleGrid.net</div>
          </div>
          <div className="nav__badge">EU compliance scope triage</div>
        </div>
      </div>

      <main className="page">
        <section className="hero">
          <div className="card hero-card">
            <div className="eyebrow">CRA-compatible React version</div>
            <h1>Describe the product. Surface the likely EU compliance areas.</h1>
            <p className="hero-copy">
              Cleaner visual hierarchy, better responsiveness, safer API calls, and improved results presentation for
              a more production-ready front end.
            </p>
            <div className="hero-metrics">
              <MetricCard label="Checklist topics" value={QUESTIONS.length} tone="blue" />
              <MetricCard label="Detected now" value={detected.length} tone="violet" />
              <MetricCard label="Coverage" value={`${progress}%`} tone="green" />
            </div>
          </div>

          <div className="card hero-side">
            <div>
              <div className="hero-side__title">Likely directives</div>
              <div className="chip-wrap">
                {detected.length ? (
                  detected.map((id) => (
                    <span key={id} className="chip" style={{ background: DIR_META[id]?.color || "#334155" }}>
                      {DIR_META[id]?.label || id}
                    </span>
                  ))
                ) : (
                  <span className="editor-muted">Directive hints appear as the description becomes more complete.</span>
                )}
              </div>
            </div>

            <div className="hero-note">
              For Create React App, store the backend URL in <code>.env</code> as <code>REACT_APP_REGCHECK_API_URL</code>.
            </div>
          </div>
        </section>

        {!result && !loading && (
          <section className="layout">
            <div className="card input-card">
              <div className="section-head">
                <h2 className="section-title">Product description</h2>
                <div className="section-subtitle">
                  Write a structured product summary. The checklist updates automatically as coverage improves.
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
                    <div className="chip-wrap">
                      {detected.map((id) => (
                        <span key={id} className="chip" style={{ background: DIR_META[id]?.color || "#334155" }}>
                          {DIR_META[id]?.label || id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="control-row">
                  <div className="segmented" aria-label="Analysis depth">
                    {[
                      { value: "standard", label: "Standard" },
                      { value: "deep", label: "Deep audit" },
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

                  <button type="button" className="ghost-btn" onClick={() => setDesc(SAMPLE_DESCRIPTION)}>
                    Use sample
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => setDesc("")}>
                    Clear
                  </button>
                  <button type="button" className="primary-btn" onClick={handleRun} disabled={!isReady}>
                    Run analysis →
                  </button>
                </div>

                {error && (
                  <div className="error-box">
                    <strong>Backend request failed.</strong>
                    <br />
                    {error}
                  </div>
                )}
              </div>
            </div>

            <aside className="card sidebar-card">
              <div className="progress-shell">
                <div className="progress-head">
                  <div>
                    <div className="section-title" style={{ fontSize: 15 }}>Coverage guide</div>
                    <div className="section-subtitle" style={{ marginTop: 4 }}>Aim to cover all ten topics.</div>
                  </div>
                  <div className="progress-badge">{doneCount}/{QUESTIONS.length}</div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="question-list">
                {answered.map((q) => (
                  <div key={q.id} className="question-row">
                    <div className={`check ${q.done ? "done" : ""}`}>{q.done ? "✓" : ""}</div>
                    <div>
                      <div className={`question-label ${q.done ? "done" : ""}`}>{q.label}</div>
                      {!q.done && <div className="question-example">{q.example}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sidebar-footer">
                {progress === 100
                  ? "All topics are covered. The description is detailed enough for a stronger first-pass analysis."
                  : `${QUESTIONS.length - doneCount} topic${QUESTIONS.length - doneCount === 1 ? "" : "s"} still missing for best results.`}
              </div>
            </aside>
          </section>
        )}

        {loading && (
          <section>
            <div className="card" style={{ padding: 18, marginBottom: 14 }}>
              <div className="section-title">Running analysis…</div>
              <div className="section-subtitle">
                Checking {detected.length} likely directive{detected.length === 1 ? "" : "s"} against the backend.
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
                <div className="risk-value" style={{ color: riskCfg.color }}>{result.overall_risk}</div>
              </div>

              <div className="summary-box">
                <div className="risk-label">Summary</div>
                <p>{result.summary}</p>
              </div>

              <div className="status-grid">
                {["FAIL", "WARN", "PASS", "INFO"].map((status) =>
                  counts[status] ? <StatusPill key={status} status={status} count={counts[status]} /> : null
                )}
                <button type="button" className="ghost-btn" onClick={resetAll}>
                  ← Edit
                </button>
              </div>
            </div>

            <div className="tab-bar">
              {dirTabs.map((dir) => {
                const meta = DIR_META[dir] || { label: dir, color: "#334155" };
                const failCount = (grouped[dir] || []).filter((f) => f.status === "FAIL").length;
                const warnCount = (grouped[dir] || []).filter((f) => f.status === "WARN").length;
                return (
                  <button
                    key={dir}
                    type="button"
                    className={`tab-btn ${activeTab === dir ? "active" : ""}`}
                    onClick={() => setActiveTab(dir)}
                  >
                    <span className="tab-dot" style={{ background: meta.color }} />
                    {meta.label}
                    {failCount > 0 && <span style={{ color: "#b91c1c" }}>· {failCount}F</span>}
                    {failCount === 0 && warnCount > 0 && <span style={{ color: "#b45309" }}>· {warnCount}W</span>}
                  </button>
                );
              })}
            </div>

            <div className="card results-card">
              <div className="results-card__head">
                <div>
                  <div className="results-card__title">{DIR_META[activeTab]?.full || activeTab || "Results"}</div>
                  <div className="results-card__subtitle">{DIR_META[activeTab]?.label || "Directive findings"}</div>
                </div>
                <div className="status-grid">
                  {["FAIL", "WARN", "PASS", "INFO"].map((status) => {
                    const count = tabFindings.filter((item) => item.status === status).length;
                    return count ? <StatusPill key={status} status={status} count={count} /> : null;
                  })}
                </div>
              </div>

              {tabFindings.length ? (
                <div className="findings-list">
                  {tabFindings.map((f) => {
                    const cfg = STATUS_CFG[f.status] || STATUS_CFG.INFO;
                    return (
                      <div key={f._i} className="finding">
                        <div
                          className="finding__icon"
                          style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
                        >
                          {cfg.icon}
                        </div>
                        <div style={{ color: cfg.text }}>
                          <div className="finding__article">{f.article || "Reference not provided"}</div>
                          <div className="finding__text">{f.finding}</div>
                          {f.action && (
                            <div className="finding__action">
                              <strong>Action:</strong> {f.action}
                            </div>
                          )}
                        </div>
                        <div
                          className="finding__status"
                          style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
                        >
                          {f.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">No findings available for this directive.</div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}