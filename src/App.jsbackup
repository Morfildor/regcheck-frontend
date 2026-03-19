import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

// ─── Directive metadata ───────────────────────────────────────────────────────

const DIR_NAME = {
  LVD: "Low Voltage",
  EMC: "EMC",
  RED: "RF / Radio",
  RED_CYBER: "RED Cybersecurity",
  CRA: "Cyber Resilience Act",
  ROHS: "RoHS",
  REACH: "REACH",
  GDPR: "Data / Privacy",
  AI_Act: "AI Act",
  ESPR: "ESPR",
  SYSTEM: "System",
  OTHER: "Other",
};

const DIR_ORDER = [
  "LVD", "EMC", "RED", "RED_CYBER", "CRA", "ROHS", "REACH", "GDPR", "AI_Act", "ESPR", "OTHER",
];

const DIR = {
  LVD:      { dot: "#0d2c3b", pill: "#d8e8ef", ring: "#9fc0cf", ink: "#0d2c3b" },
  EMC:      { dot: "#13678A", pill: "#d8edf5", ring: "#8bbfd4", ink: "#0b4258" },
  RED:      { dot: "#1f3c88", pill: "#dbe5ff", ring: "#a7bbe9", ink: "#1f3c88" },
  RED_CYBER:{ dot: "#533483", pill: "#ece4fb", ring: "#c6b5ea", ink: "#41286a" },
  CRA:      { dot: "#1c7c54", pill: "#daf3e5", ring: "#9ed1b5", ink: "#13533a" },
  ROHS:     { dot: "#6f7f14", pill: "#f2f5d8", ring: "#d0d78a", ink: "#55610f" },
  REACH:    { dot: "#8a5a13", pill: "#f8ecd9", ring: "#e0bf8d", ink: "#6a430d" },
  GDPR:     { dot: "#4a7c59", pill: "#e3f3e8", ring: "#b8d6bf", ink: "#33573f" },
  AI_Act:   { dot: "#6b4f9d", pill: "#ece5f8", ring: "#c5b5e4", ink: "#4b3770" },
  ESPR:     { dot: "#7d6a0f", pill: "#f6f0d1", ring: "#dbcf8b", ink: "#62530d" },
  OTHER:    { dot: "#627d8a", pill: "#e5edf1", ring: "#bfd0d8", ink: "#3f5862" },
  SYSTEM:   { dot: "#627d8a", pill: "#e5edf1", ring: "#bfd0d8", ink: "#3f5862" },
};

const STS = {
  FAIL: { icon: "×", label: "FAIL", bg: "#e5eef3", border: "#9bb8c7", text: "#0d2c3b", stripe: "#2a6782" },
  WARN: { icon: "!", label: "WARN", bg: "#e8f3f8", border: "#9dc7d8", text: "#104052", stripe: "#3c8ca9" },
  PASS: { icon: "✓", label: "PASS", bg: "#e4f5ee", border: "#a6d2bf", text: "#134534", stripe: "#35a37d" },
  INFO: { icon: "i", label: "INFO", bg: "#edf4f6", border: "#bfd0d8", text: "#32505b", stripe: "#7e98a3" },
};

// ─── Guided field definitions ─────────────────────────────────────────────────

const GUIDED_FIELDS = [
  {
    id: "productType",
    step: 1,
    label: "What is the product?",
    placeholder: "e.g. Smart kettle, robotic lawn mower, wall-mounted heat pump…",
    hint: "Be as specific as possible — include the product family and any key mechanical or physical features.",
    chips: [
      "Electric kettle", "Coffee machine", "Vacuum cleaner", "Robotic lawnmower",
      "Air purifier", "Heat pump", "Washing machine", "Tumble dryer",
      "Toaster", "Fan heater", "Electric iron", "Dishwasher",
      "Refrigerator", "Microwave oven", "Hair dryer", "Electric shaver",
    ],
  },
  {
    id: "connectivity",
    step: 2,
    label: "Connectivity & radio?",
    placeholder: "e.g. Wi-Fi 802.11n, Bluetooth 5.0, no radio…",
    hint: "List every wireless technology in the product. This drives the RED / EMC standard selection.",
    chips: [
      "Wi-Fi (2.4 GHz)", "Wi-Fi (5 GHz)", "Bluetooth", "Bluetooth LE",
      "Zigbee", "Thread / Matter", "NFC", "Cellular / LTE",
      "5G", "No radio",
    ],
  },
  {
    id: "power",
    step: 3,
    label: "Power supply?",
    placeholder: "e.g. Mains 230 V AC, rechargeable Li-ion battery…",
    hint: "State the exact supply method. Mains-powered products require LVD; battery-only products may not.",
    chips: [
      "Mains 230 V AC", "Mains 120 V AC", "Built-in Li-ion battery",
      "AA / AAA batteries", "USB-C (5 V)", "USB-C PD", "Dual: mains + battery",
    ],
  },
  {
    id: "software",
    step: 4,
    label: "App, cloud & software?",
    placeholder: "e.g. companion iOS/Android app, OTA firmware updates, AWS cloud…",
    hint: "Connected features can trigger CRA, RED Cybersecurity, and GDPR obligations.",
    chips: [
      "Companion mobile app", "OTA firmware updates", "Cloud backend",
      "User accounts / login", "Voice assistant", "Local only (no cloud)",
      "No app or software",
    ],
  },
  {
    id: "audience",
    step: 5,
    label: "Who is it for?",
    placeholder: "e.g. household consumer, commercial kitchen, children under 12…",
    hint: "Target audience affects which 60335-2 part applies and whether GDPR child-data rules are in scope.",
    chips: [
      "Household / consumer", "Professional / commercial", "Children",
      "Medical / healthcare", "Outdoor / garden", "Industrial",
    ],
  },
  {
    id: "features",
    step: 6,
    label: "Any special features?",
    placeholder: "e.g. camera, AI, heating element, water contact, UV lamp…",
    hint: "Special technologies often unlock additional standards — list anything unusual about this product.",
    chips: [
      "Camera", "Microphone", "AI / machine learning", "Heating element",
      "Water contact", "High-pressure steam", "UV / IR lamp",
      "Moving blades / cutters", "Refrigerant circuit",
    ],
  },
];

const SAMPLE_VALUES = {
  productType: "Smart electric kettle",
  connectivity: "Bluetooth LE",
  power: "Mains 230 V AC",
  software: "Companion mobile app, OTA firmware updates",
  audience: "Household / consumer",
  features: "Heating element, water contact",
};

// ─── Utility functions ────────────────────────────────────────────────────────

function buildDescription(fields) {
  return GUIDED_FIELDS
    .map((f) => fields[f.id]?.trim())
    .filter(Boolean)
    .join(". ");
}

function unique(arr = []) {
  return [...new Set(arr.filter(Boolean))];
}

function normalizeStdName(s = "") {
  return s.replace(/\s+/g, " ").trim();
}

function getDirectiveListFromFinding(f) {
  return (f.directive || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((d) => (d === "RF" ? "RED" : d));
}

function priorityStatus(statuses = []) {
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.includes("WARN")) return "WARN";
  if (statuses.includes("PASS")) return "PASS";
  return "INFO";
}

const STD_RE = /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|UL|ASTM|CISPR|ITU|IEC\/EN)\b/i;

function isStandardFinding(f) {
  const article = (f.article || "").trim();
  return STD_RE.test(article) || /review$/i.test(article);
}

function splitFindings(findings = []) {
  const bucket = { stds: [], missing: [], contra: [], other: [] };
  findings.forEach((f, i) => {
    const row = { ...f, _i: i };
    const art = (f.article || "").trim();
    if (isStandardFinding(f))         { bucket.stds.push(row); return; }
    if (/Missing/i.test(art))         { bucket.missing.push(row); return; }
    if (/Contradiction/i.test(art))   { bucket.contra.push(row); return; }
    bucket.other.push(row);
  });
  return bucket;
}

function inferDirectiveFromText(text = "") {
  const t = text.toLowerCase();
  if (/en\s*18031|18031-1|18031-2|18031-3|red da|delegated act|article 3\.3\(d\)|article 3\.3\(e\)|article 3\.3\(f\)|protect network|personal data.*radio|fraud.*radio/.test(t)) return "RED_CYBER";
  if (/cyber resilience act|\bcra\b|secure development|vulnerability handling|sbom|post-market security update|coordinated vulnerability disclosure/.test(t)) return "CRA";
  if (/rohs|2011\/65\/eu|en iec 63000|iec 63000|en 50581|hazardous substances|restricted substances|iec 62321/.test(t)) return "ROHS";
  if (/\breach\b|ec 1907\/2006|svhc|substances of very high concern|candidate list/.test(t)) return "REACH";
  if (/60335|60730|62233|60335-1|60335-2|household|appliance safety|electrical safety/.test(t)) return "LVD";
  if (/55014|61000|emc|electromagnetic|cispr|harmonic|flicker|electrostatic|esd|surge|immunity|conducted emission|radiated emission/.test(t)) return "EMC";
  if (/300 328|301 489|300 220|300 330|300 440|radio spectrum|wireless|bluetooth|wifi|wi-fi|lte|5g|zigbee|matter|nfc|rf exposure/.test(t)) return "RED";
  if (/gdpr|privacy|personal data|data protection/.test(t)) return "GDPR";
  if (/ai act|artificial intelligence|machine learning/.test(t)) return "AI_Act";
  if (/ecodesign|espr|repairability|durability|energy/.test(t)) return "ESPR";
  return "OTHER";
}

function enrichDirectives(f) {
  const combined = [f.article, f.finding, f.action].filter(Boolean).join(" ");
  const inferred = inferDirectiveFromText(combined);
  let explicit = getDirectiveListFromFinding(f).filter((d) => d !== "SYSTEM");
  if (/en\s*18031|18031-1|18031-2|18031-3/i.test(combined.toLowerCase())) {
    explicit = explicit.filter((d) => d !== "CRA" && d !== "RED");
    explicit.push("RED_CYBER");
  }
  if (inferred === "RED_CYBER" && !explicit.includes("RED_CYBER")) explicit.push("RED_CYBER");
  if (!explicit.length) explicit = inferred ? [inferred] : ["OTHER"];
  return unique(explicit);
}

function buildStandardGroups(stds = []) {
  const map = new Map();
  stds.forEach((f) => {
    const name = normalizeStdName(f.article || "Unnamed standard");
    const directives = enrichDirectives(f);
    const key = name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name, directives: [...directives], statuses: [f.status].filter(Boolean), findings: [f], actions: f.action ? [f.action] : [] });
    } else {
      const curr = map.get(key);
      curr.directives = unique([...curr.directives, ...directives]);
      curr.statuses = unique([...curr.statuses, f.status]);
      curr.findings.push(f);
      if (f.action) curr.actions = unique([...curr.actions, f.action]);
    }
  });
  return [...map.values()];
}

function copyText(text) {
  if (!navigator?.clipboard) return false;
  navigator.clipboard.writeText(text);
  return true;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function dirCodeLabel(code) {
  if (code === "RED") return "RF";
  if (code === "RED_CYBER") return "RED CYBER";
  return code;
}

// ─── Reusable UI components ───────────────────────────────────────────────────

function DirBadge({ code }) {
  const d = DIR[code] || DIR.OTHER;
  return (
    <span className="dir-badge" style={{ "--dot": d.dot, "--pill": d.pill, "--ring": d.ring, "--ink": d.ink }}>
      <span className="dir-badge__dot" />
      <span className="dir-badge__code">{dirCodeLabel(code)}</span>
      <span className="dir-badge__name">{DIR_NAME[code] || code}</span>
    </span>
  );
}

function StatusPill({ status }) {
  const s = STS[status] || STS.INFO;
  return (
    <span className="status-pill" style={{ "--fbg": s.bg, "--fborder": s.border, "--ftext": s.text }}>
      <span className="status-pill__n">{s.icon}</span>
      <span>{s.label}</span>
    </span>
  );
}

function StandardCard({ item }) {
  const mainStatus = priorityStatus(item.statuses);
  const s = STS[mainStatus] || STS.INFO;
  return (
    <div className="std-card" style={{ "--fbg": s.bg, "--fborder": s.border, "--ftext": s.text }}>
      <div className="std-card__top">
        <div className="std-card__name">{item.name}</div>
        <StatusPill status={mainStatus} />
      </div>
      <div className="std-card__chips">
        {item.directives.map((d) => <DirBadge key={d} code={d} />)}
      </div>
      {item.findings?.[0]?.finding && (
        <div className="std-card__finding">{item.findings[0].finding}</div>
      )}
      {item.actions.length > 0 && (
        <div className="std-card__actions">
          <div className="std-card__actions-title">Action</div>
          <ul>
            {item.actions.slice(0, 2).map((a, idx) => <li key={idx}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function FindingRow({ f }) {
  const s = STS[f.status] || STS.INFO;
  return (
    <div className="frow" style={{ "--fbg": s.bg, "--fborder": s.border, "--ftext": s.text, "--fstripe": s.stripe }}>
      <div className="frow__left">
        <span className="frow__icon">{s.icon}</span>
        <span className="frow__label">{s.label}</span>
      </div>
      <div className="frow__body">
        <div className="frow__art">{f.article || ""}</div>
        <div className="frow__text">{f.finding}</div>
        {f.action && <div className="frow__action">{f.action}</div>}
      </div>
    </div>
  );
}

function Section({ title, count, children, right }) {
  return (
    <section className="card section">
      <div className="section__head">
        <div className="section__titleWrap">
          <h2 className="section__title">{title}</h2>
          {typeof count === "number" && <span className="count-pill">{count}</span>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

// ─── Guided input field ───────────────────────────────────────────────────────

function GuidedField({ field, value, onChange, isActive, onActivate }) {
  const isFilled = value.trim().length > 0;

  const toggleChip = (chip) => {
    const current = value.trim();
    if (current.includes(chip)) {
      onChange(current.replace(chip, "").replace(/,\s*,/g, ",").replace(/^,\s*|,\s*$/g, "").trim());
    } else {
      onChange(current ? `${current}, ${chip}` : chip);
    }
  };

  return (
    <div
      className={`gfield ${isActive ? "gfield--active" : ""} ${isFilled ? "gfield--filled" : ""}`}
      onClick={!isActive ? onActivate : undefined}
    >
      <div className="gfield__header">
        <div className="gfield__meta">
          <span className="gfield__step">{field.step}</span>
          <span className="gfield__label">{field.label}</span>
        </div>
        {isFilled && !isActive && (
          <div className="gfield__preview" title={value}>{value.length > 55 ? value.slice(0, 55) + "…" : value}</div>
        )}
        <span className={`gfield__check ${isFilled ? "gfield__check--on" : ""}`}>✓</span>
      </div>

      {isActive && (
        <div className="gfield__body">
          <p className="gfield__hint">{field.hint}</p>
          <input
            className="gfield__input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            autoFocus
          />
          <div className="gfield__chips">
            {field.chips.map((chip) => {
              const active = value.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  className={`chip ${active ? "chip--on" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleChip(chip); }}
                >
                  {active && <span className="chip__tick">✓</span>}
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ fields }) {
  const filled = GUIDED_FIELDS.filter((f) => fields[f.id]?.trim()).length;
  const pct = Math.round((filled / GUIDED_FIELDS.length) * 100);
  return (
    <div className="progress">
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress__label">{filled} of {GUIDED_FIELDS.length} fields filled</span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const EMPTY_FIELDS = Object.fromEntries(GUIDED_FIELDS.map((f) => [f.id, ""]));

export default function App() {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [activeField, setActiveField] = useState(GUIDED_FIELDS[0].id);
  const [showPreview, setShowPreview] = useState(false);

  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedDir, setSelectedDir] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState("");

  const abortRef = useRef(null);

  useEffect(() => { return () => abortRef.current?.abort(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const setField = useCallback((id, val) => {
    setFields((prev) => ({ ...prev, [id]: val }));
  }, []);

  const description = useMemo(() => buildDescription(fields), [fields]);
  const ready = fields.productType.trim().length >= 3;

  const sections = useMemo(
    () => (result?.findings ? splitFindings(result.findings) : null),
    [result]
  );

  const standards = useMemo(
    () => buildStandardGroups(sections?.stds || []),
    [sections]
  );

  const standardsFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return standards.filter((s) => {
      const topStatus = priorityStatus(s.statuses);
      const text = [s.name, s.directives.join(" "), s.actions.join(" "), s.findings.map((f) => [f.finding, f.action].join(" ")).join(" ")].join(" ").toLowerCase();
      return (
        (!q || text.includes(q)) &&
        (selectedDir === "ALL" || s.directives.includes(selectedDir)) &&
        (statusFilter === "ALL" || topStatus === statusFilter)
      );
    });
  }, [standards, search, selectedDir, statusFilter]);

  const standardsByDirective = useMemo(() => {
    const map = new Map();
    DIR_ORDER.forEach((d) => map.set(d, []));
    standardsFiltered.forEach((s) => {
      const dirs = s.directives.length ? s.directives : ["OTHER"];
      const first = dirs.find((d) => DIR_ORDER.includes(d) && d !== "OTHER") || dirs[0] || "OTHER";
      const bucket = DIR_ORDER.includes(first) ? first : "OTHER";
      map.get(bucket).push(s);
    });
    return map;
  }, [standardsFiltered]);

  const availableDirs = useMemo(() => {
    const found = new Set();
    standards.forEach((s) => s.directives.forEach((d) => found.add(d)));
    return DIR_ORDER.filter((d) => found.has(d) && d !== "OTHER").concat(found.has("OTHER") ? ["OTHER"] : []);
  }, [standards]);

  const loadSample = () => {
    setFields(SAMPLE_VALUES);
    setActiveField(null);
  };

  const clearAll = () => {
    setFields(EMPTY_FIELDS);
    setActiveField(GUIDED_FIELDS[0].id);
  };

  const run = useCallback(async () => {
    if (!ready || loading) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearch("");
    setSelectedDir("ALL");
    setStatusFilter("ALL");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, category: "", directives: [], depth }),
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
  }, [description, depth, ready, loading]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setError(null);
    setResult(null);
    setSearch("");
    setSelectedDir("ALL");
    setStatusFilter("ALL");
  }, []);

  const copyStandards = () => { copyText(standardsFiltered.map((s) => s.name).join("\n")); setToast("Standards copied"); };
  const copySummary = () => {
    const txt = [`Product: ${description}`, `Standards found: ${standards.length}`,
      ...DIR_ORDER.flatMap((dir) => {
        const rows = standardsByDirective.get(dir) || [];
        if (!rows.length) return [];
        return ["", `${dirCodeLabel(dir)} (${rows.length})`, ...rows.map((r) => `- ${r.name}`)];
      })].join("\n");
    copyText(txt);
    setToast("Summary copied");
  };
  const exportJson = () => { if (result) { downloadJson("rulegrid-analysis.json", result); setToast("JSON exported"); } };

  return (
    <div className="shell">
      <AppCSS />

      <nav className="nav">
        <div className="container nav__inner">
          <div className="nav__brand">
            <span className="nav__logo">RG</span>
            <span className="nav__name">RuleGrid</span>
          </div>
          <span className="nav__tag">Standards-first compliance view</span>
        </div>
      </nav>

      <main className="container page">
        <header className="hero">
          <div>
            <p className="hero__eyebrow">EU Compliance Scoping</p>
            <h1 className="hero__title">Standards first. Faster review.</h1>
            <p className="hero__sub">
              Answer a few guided questions and get the applicable EU standards
              grouped by LVD, EMC, RED, RED Cybersecurity, CRA, RoHS, REACH,
              GDPR and more.
            </p>
          </div>
        </header>

        {/* ── Input form ── */}
        {!result && !loading && (
          <div className="card input-card">
            {/* Header */}
            <div className="input-card__head">
              <div>
                <h2 className="section__title">Product questionnaire</h2>
                <p className="input-card__hint">
                  Fill in as many fields as you can — more detail means more accurate results.
                </p>
              </div>
              <div className="input-card__controls">
                <div className="depth">
                  {["standard", "deep"].map((v) => (
                    <button key={v} type="button"
                      className={"seg-btn" + (depth === v ? " seg-btn--on" : "")}
                      onClick={() => setDepth(v)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="input-card__progress">
              <ProgressBar fields={fields} />
            </div>

            {/* Guided fields */}
            <div className="gfields">
              {GUIDED_FIELDS.map((f) => (
                <GuidedField
                  key={f.id}
                  field={f}
                  value={fields[f.id]}
                  onChange={(val) => setField(f.id, val)}
                  isActive={activeField === f.id}
                  onActivate={() => setActiveField(f.id)}
                />
              ))}
            </div>

            {/* Preview toggle */}
            <div className="input-card__preview-row">
              <button type="button" className="ghost-btn ghost-btn--sm"
                onClick={() => setShowPreview((p) => !p)}>
                {showPreview ? "Hide" : "Preview"} description
              </button>
              {showPreview && description && (
                <div className="desc-preview">{description || "—"}</div>
              )}
            </div>

            {/* Footer */}
            <div className="input-card__foot">
              <div className="input-card__actions input-card__actions--left">
                <button type="button" className="ghost-btn" onClick={loadSample}>Load sample</button>
                <button type="button" className="ghost-btn" onClick={clearAll}>Clear all</button>
              </div>
              <div className="input-card__actions">
                <button type="button" className="run-btn" onClick={run} disabled={!ready}
                  title={!ready ? "Fill in product type to start" : ""}>
                  {ready ? "Analyse →" : "Enter product type to start"}
                </button>
              </div>
            </div>

            {error && <div className="err-bar">{error}</div>}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="loading">
            <div className="card loading__card">
              <span className="spinner" />
              <div>
                <div className="section__title">Analysing</div>
                <p className="loading__text">Building the standards view and grouping by directive family.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <>
            {/* Result hero strip */}
            <div className="card result-strip">
              <div className="result-strip__text">
                <div className="result-strip__product">{fields.productType || "Product"}</div>
                <div className="result-strip__desc">{description}</div>
              </div>
              <button type="button" className="ghost-btn" onClick={reset}>← Edit</button>
            </div>

            {/* Toolbar */}
            <div className="toolbar card">
              <div className="toolbar__left">
                <div className="search-wrap">
                  <input className="search-input" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search standards, notes, actions…" />
                </div>
                <select className="select" value={selectedDir} onChange={(e) => setSelectedDir(e.target.value)}>
                  <option value="ALL">All buckets</option>
                  {availableDirs.map((d) => <option key={d} value={d}>{dirCodeLabel(d)}</option>)}
                </select>
                <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All statuses</option>
                  <option value="FAIL">FAIL</option>
                  <option value="WARN">WARN</option>
                  <option value="PASS">PASS</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>
              <div className="toolbar__right">
                <button type="button" className="ghost-btn" onClick={copySummary}>Copy summary</button>
                <button type="button" className="ghost-btn" onClick={copyStandards}>Copy standards</button>
                <button type="button" className="ghost-btn" onClick={exportJson}>Export JSON</button>
              </div>
            </div>

            <Section title="Standards" count={standardsFiltered.length}
              right={<div className="section__helper">Primary review view</div>}>
              <div className="group-stack">
                {DIR_ORDER.map((dir) => {
                  const rows = standardsByDirective.get(dir) || [];
                  if (!rows.length) return null;
                  return (
                    <div key={dir} className="std-group">
                      <div className="std-group__head">
                        <div className="std-group__title"><DirBadge code={dir} /></div>
                        <span className="count-pill">{rows.length}</span>
                      </div>
                      <div className="std-grid">
                        {rows.map((item) => <StandardCard key={dir + item.name} item={item} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {sections?.missing?.length > 0 && (
              <Section title="Missing information" count={sections.missing.length}>
                <div className="list-pad">{sections.missing.map((f) => <FindingRow key={f._i} f={f} />)}</div>
              </Section>
            )}
            {sections?.contra?.length > 0 && (
              <Section title="Contradictions" count={sections.contra.length}>
                <div className="list-pad">{sections.contra.map((f) => <FindingRow key={f._i} f={f} />)}</div>
              </Section>
            )}
            {sections?.other?.length > 0 && (
              <Section title="Other findings" count={sections.other.length}>
                <div className="list-pad">{sections.other.map((f) => <FindingRow key={f._i} f={f} />)}</div>
              </Section>
            )}
          </>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ─── All CSS ──────────────────────────────────────────────────────────────────

function AppCSS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { min-height: 100%; }
      button, input, select, textarea { font: inherit; }
      button { cursor: pointer; border: none; }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        background:
          radial-gradient(ellipse 60% 35% at 0% 0%, rgba(19,103,138,.08) 0%, transparent 60%),
          radial-gradient(ellipse 55% 30% at 100% 100%, rgba(53,163,125,.08) 0%, transparent 60%),
          #f4fafc;
        color: #0d2c3b;
      }

      .shell { min-height: 100vh; }
      .container { max-width: 1280px; margin: 0 auto; padding: 0 22px; }

      /* Nav */
      .nav {
        position: sticky; top: 0; z-index: 40;
        background: rgba(13,44,59,.94);
        border-bottom: 1px solid rgba(255,255,255,.08);
        backdrop-filter: blur(12px);
      }
      .nav__inner { height: 58px; display: flex; align-items: center; justify-content: space-between; }
      .nav__brand { display: flex; align-items: center; gap: 10px; }
      .nav__logo {
        width: 30px; height: 30px; border-radius: 8px;
        display: grid; place-items: center;
        background: linear-gradient(135deg, #13678A, #35a37d);
        color: #fff; font-size: 12px; font-weight: 800;
      }
      .nav__name { color: #eff8fb; font-weight: 800; letter-spacing: -.02em; }
      .nav__tag {
        font-size: 11px; color: #cbe2ea;
        padding: 5px 10px; border-radius: 999px;
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.10);
      }

      /* Page */
      .page { padding: 28px 22px 52px; }

      /* Hero */
      .hero { margin-bottom: 20px; }
      .hero__eyebrow {
        font-size: 11px; font-weight: 800; letter-spacing: .12em;
        text-transform: uppercase; color: #2a6782; margin-bottom: 8px;
      }
      .hero__title {
        font-size: clamp(24px, 3vw, 36px); line-height: 1.08;
        letter-spacing: -.04em; font-weight: 800; color: #0d2c3b;
      }
      .hero__sub { margin-top: 12px; max-width: 62ch; color: #42616e; line-height: 1.8; }

      /* Card */
      .card {
        background: rgba(255,255,255,.88);
        border: 1px solid #cfe0e8; border-radius: 16px;
        box-shadow: 0 2px 6px rgba(13,44,59,.04), 0 12px 32px rgba(13,44,59,.05);
        backdrop-filter: blur(8px);
      }

      /* Input card */
      .input-card { overflow: hidden; margin-bottom: 14px; }
      .input-card__head {
        padding: 18px 20px 14px;
        display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        border-bottom: 1px solid #dce9ef;
      }
      .input-card__hint { margin-top: 4px; color: #577582; font-size: 13px; }
      .input-card__controls { display: flex; align-items: center; gap: 8px; }

      .input-card__progress { padding: 14px 20px 10px; border-bottom: 1px solid #dce9ef; }

      .input-card__preview-row {
        padding: 10px 20px;
        border-top: 1px solid #dce9ef;
        display: flex; flex-direction: column; gap: 8px;
      }
      .desc-preview {
        padding: 10px 14px; border-radius: 10px;
        background: #f0f7fa; border: 1px solid #c6d9e2;
        font-size: 13px; color: #3d5a64; line-height: 1.7;
      }

      .input-card__foot {
        padding: 12px 16px;
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        background: #f1f8fb; border-top: 1px solid #dce9ef;
        flex-wrap: wrap;
      }
      .input-card__actions { display: flex; gap: 8px; flex-wrap: wrap; }
      .input-card__actions--left { flex: 1; }

      /* Depth selector */
      .depth { display: flex; gap: 8px; }
      .seg-btn {
        padding: 7px 12px; border-radius: 10px;
        border: 1px solid #c6d9e2; background: #fff;
        color: #496673; font-weight: 700; text-transform: capitalize;
      }
      .seg-btn--on { background: #e8f3f8; border-color: #96bfd1; color: #0f4256; }

      /* Progress bar */
      .progress { display: flex; align-items: center; gap: 12px; }
      .progress__track {
        flex: 1; height: 6px; border-radius: 999px; background: #dce9ef; overflow: hidden;
      }
      .progress__fill {
        height: 100%; border-radius: 999px;
        background: linear-gradient(90deg, #13678A, #35a37d);
        transition: width .35s ease;
      }
      .progress__label { font-size: 12px; color: #627d8a; white-space: nowrap; font-weight: 600; }

      /* Guided fields */
      .gfields { border-bottom: 1px solid #dce9ef; }

      .gfield {
        border-bottom: 1px solid #edf4f6;
        transition: background .15s;
        cursor: pointer;
      }
      .gfield:last-child { border-bottom: none; }
      .gfield:hover:not(.gfield--active) { background: #f8fbfc; }
      .gfield--active {
        background: #f0f8fb;
        border-left: 3px solid #13678A;
        cursor: default;
      }
      .gfield--filled .gfield__check--on { opacity: 1; }

      .gfield__header {
        padding: 14px 20px;
        display: flex; align-items: center; gap: 12px;
      }
      .gfield--active .gfield__header { padding-bottom: 0; }

      .gfield__meta { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }

      .gfield__step {
        width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
        display: grid; place-items: center;
        background: #e1edf2; color: #2a6782;
        font-size: 11px; font-weight: 800;
      }
      .gfield--active .gfield__step { background: #13678A; color: #fff; }

      .gfield__label {
        font-size: 13.5px; font-weight: 700; color: #0d2c3b;
        white-space: nowrap;
      }

      .gfield__preview {
        flex: 1; min-width: 0;
        font-size: 12px; color: #5a7a87;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        text-align: right;
      }

      .gfield__check {
        width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
        display: grid; place-items: center;
        font-size: 11px; font-weight: 800;
        background: #edf4f6; color: #b0c8d2;
        opacity: 0;
        transition: opacity .2s, background .2s, color .2s;
      }
      .gfield__check--on { opacity: 1; background: #d6f0e5; color: #35a37d; }

      .gfield__body { padding: 8px 20px 18px 20px; }

      .gfield__hint {
        font-size: 12.5px; color: #577582; line-height: 1.65;
        margin-bottom: 12px;
      }

      .gfield__input {
        width: 100%; padding: 10px 14px;
        border: 1px solid #c6d9e2; border-radius: 10px;
        background: #fff; color: #0d2c3b; outline: none;
        font-size: 13.5px; line-height: 1.6;
        margin-bottom: 12px;
        transition: border-color .15s, box-shadow .15s;
      }
      .gfield__input:focus { border-color: #13678A; box-shadow: 0 0 0 3px rgba(19,103,138,.1); }
      .gfield__input::placeholder { color: #96b4be; }

      /* Chips */
      .gfield__chips { display: flex; flex-wrap: wrap; gap: 7px; }

      .chip {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 6px 11px; border-radius: 999px;
        border: 1px solid #c6d9e2; background: #fff;
        color: #496673; font-size: 12px; font-weight: 600;
        transition: all .12s;
        user-select: none;
      }
      .chip:hover { background: #edf4f6; border-color: #9dc7d8; }
      .chip--on { background: #e0f2fa; border-color: #7bbcd6; color: #0d2c3b; }
      .chip__tick { font-size: 10px; color: #13678A; font-weight: 800; }

      /* Buttons */
      .ghost-btn {
        padding: 8px 13px; border-radius: 10px;
        background: #fff; border: 1px solid #c6d9e2;
        color: #35515e; font-weight: 700;
      }
      .ghost-btn:hover { background: #f4fafc; }
      .ghost-btn--sm { padding: 5px 10px; font-size: 12px; width: fit-content; }

      .run-btn {
        padding: 10px 22px; border-radius: 10px; font-weight: 800;
        background: linear-gradient(135deg, #0d2c3b, #13678A);
        color: #fff; box-shadow: 0 6px 20px rgba(19,103,138,.22);
        font-size: 14px;
      }
      .run-btn:disabled {
        background: #c8d8df; color: #7d98a4;
        box-shadow: none; cursor: not-allowed;
      }

      .err-bar {
        margin: 0 16px 16px; padding: 12px 14px; border-radius: 10px;
        background: #edf4f6; border: 1px solid #c6d9e2; color: #0d2c3b;
      }

      /* Result strip */
      .result-strip {
        padding: 16px 20px;
        display: flex; align-items: center; justify-content: space-between; gap: 16px;
        margin-bottom: 14px;
      }
      .result-strip__product { font-size: 16px; font-weight: 800; color: #0d2c3b; margin-bottom: 4px; }
      .result-strip__desc { font-size: 13px; color: #577582; line-height: 1.6; }

      /* Loading */
      .loading__card { padding: 18px 20px; display: flex; align-items: center; gap: 14px; }
      .loading__text { margin-top: 4px; color: #5b7885; }
      .spinner {
        width: 24px; height: 24px; border-radius: 50%;
        border: 2.5px solid #c6d9e2; border-top-color: #13678A;
        animation: spin .7s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Toolbar */
      .toolbar {
        padding: 14px 16px;
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        margin-bottom: 14px; flex-wrap: wrap;
      }
      .toolbar__left, .toolbar__right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .search-wrap { min-width: 280px; }
      .search-input, .select {
        height: 40px; border-radius: 10px;
        border: 1px solid #c6d9e2; background: #fff;
        color: #0d2c3b; padding: 0 12px; outline: none;
      }
      .search-input { width: 100%; }
      .search-input:focus, .select:focus { border-color: #96bfd1; box-shadow: 0 0 0 3px rgba(19,103,138,.08); }

      /* Section */
      .section { overflow: hidden; margin-bottom: 14px; }
      .section__head {
        padding: 16px 18px;
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        border-bottom: 1px solid #dce9ef;
      }
      .section__titleWrap { display: flex; align-items: center; gap: 10px; }
      .section__title { font-size: 15px; font-weight: 800; letter-spacing: -.02em; color: #0d2c3b; }
      .section__helper { font-size: 12px; color: #627d8a; }

      .count-pill {
        min-width: 28px; padding: 4px 8px; border-radius: 999px;
        display: inline-flex; align-items: center; justify-content: center;
        background: #edf4f6; border: 1px solid #c6d9e2;
        color: #2a6782; font-size: 11px; font-weight: 800;
      }

      /* Standards */
      .group-stack { padding: 16px; display: flex; flex-direction: column; gap: 22px; }
      .std-group__head {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        margin-bottom: 12px;
      }
      .std-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }

      .std-card {
        border: 1px solid var(--fborder);
        background: linear-gradient(180deg, #fff 0%, var(--fbg) 100%);
        border-radius: 14px; padding: 14px;
      }
      .std-card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .std-card__name { font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.55; font-weight: 600; color: #0d2c3b; }
      .std-card__chips { margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }
      .std-card__finding { margin-top: 12px; color: #36515d; line-height: 1.75; font-size: 12.5px; }
      .std-card__actions { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.7); border: 1px solid rgba(13,44,59,.09); }
      .std-card__actions-title { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #5a7480; margin-bottom: 6px; }
      .std-card__actions ul { padding-left: 18px; }
      .std-card__actions li { font-size: 12px; line-height: 1.65; color: #36515d; }

      /* Dir badge */
      .dir-badge {
        display: inline-flex; align-items: center; gap: 8px;
        border-radius: 999px; border: 1px solid var(--ring);
        background: var(--pill); color: var(--ink);
        padding: 7px 12px 7px 9px; min-height: 34px;
      }
      .dir-badge__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dot); flex-shrink: 0; }
      .dir-badge__code { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; }
      .dir-badge__name { font-size: 12px; font-weight: 700; }

      /* Status pill */
      .status-pill {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 10px; border-radius: 999px;
        background: var(--fbg); border: 1px solid var(--fborder);
        color: var(--ftext); font-size: 11px; font-weight: 800;
      }

      /* Finding row */
      .list-pad { padding: 8px 8px 12px; }
      .frow {
        display: grid; grid-template-columns: 48px 1fr;
        border-radius: 12px; overflow: hidden;
        border: 1px solid var(--fborder); background: var(--fbg);
        margin-bottom: 8px;
      }
      .frow__left { background: var(--fstripe); display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 6px; padding: 12px 0; }
      .frow__icon { width: 22px; height: 22px; border-radius: 6px; background: rgba(255,255,255,.22); display: grid; place-items: center; color: #fff; font-weight: 800; }
      .frow__label { font-size: 8px; color: rgba(255,255,255,.9); font-weight: 800; letter-spacing: .12em; }
      .frow__body { padding: 12px 14px; }
      .frow__art { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: #64808c; margin-bottom: 4px; }
      .frow__text { color: #24404d; line-height: 1.75; }
      .frow__action { margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,.68); border: 1px solid rgba(13,44,59,.08); color: #35515e; font-size: 12px; }

      /* Toast */
      .toast {
        position: fixed; right: 18px; bottom: 18px; z-index: 60;
        padding: 10px 14px; border-radius: 10px;
        background: #0d2c3b; color: #fff;
        box-shadow: 0 10px 24px rgba(13,44,59,.22);
        font-size: 12.5px; font-weight: 700;
      }

      /* Responsive */
      @media (max-width: 980px) {
        .toolbar { flex-direction: column; align-items: stretch; }
        .toolbar__left, .toolbar__right { width: 100%; }
        .search-wrap { min-width: 0; flex: 1; }
      }
      @media (max-width: 720px) {
        .container { padding: 0 14px; }
        .page { padding: 18px 14px 40px; }
        .input-card__head, .input-card__foot { flex-direction: column; align-items: stretch; }
        .input-card__actions, .input-card__actions--left { flex-direction: column; align-items: stretch; }
        .ghost-btn, .run-btn, .select, .search-input { width: 100%; }
        .nav__tag { display: none; }
        .gfield__label { font-size: 13px; }
        .gfield__preview { display: none; }
      }
    `}</style>
  );
}