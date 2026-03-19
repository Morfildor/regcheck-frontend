import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

const SAMPLE =
  "Smart kettle with mobile app. Bluetooth connection. Mains powered, 230V.";

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
  OTHER: "Other",
  SYSTEM: "System",
};

const DIR_ORDER = [
  "LVD", "EMC", "RED", "RED_CYBER", "CRA",
  "ROHS", "REACH", "GDPR", "AI_Act", "ESPR", "OTHER",
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

const DEPTH_INFO = {
  standard: "Core applicable standards — fastest turnaround.",
  deep: "Full deep dive including edge-case and emerging requirements.",
};

const STD_RE = /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|UL|ASTM|CISPR|ITU|IEC\/EN)\b/i;

function unique(arr = []) { return [...new Set(arr.filter(Boolean))]; }
function normalizeStdName(s = "") { return s.replace(/\s+/g, " ").trim(); }

function getDirectiveListFromFinding(f) {
  return (f.directive || "").split(",").map(x => x.trim()).filter(Boolean).map(d => d === "RF" ? "RED" : d);
}

function priorityStatus(statuses = []) {
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.includes("WARN")) return "WARN";
  if (statuses.includes("PASS")) return "PASS";
  return "INFO";
}

function isStandardFinding(f) {
  const article = (f.article || "").trim();
  return STD_RE.test(article) || /review$/i.test(article);
}

function splitFindings(findings = []) {
  const bucket = { stds: [], missing: [], contra: [], other: [] };
  findings.forEach((f, i) => {
    const row = { ...f, _i: i };
    const art = (f.article || "").trim();
    if (isStandardFinding(f)) { bucket.stds.push(row); return; }
    if (/Missing/i.test(art))  { bucket.missing.push(row); return; }
    if (/Contradiction/i.test(art)) { bucket.contra.push(row); return; }
    bucket.other.push(row);
  });
  return bucket;
}

function inferDirectiveFromText(text = "") {
  const t = text.toLowerCase();
  if (/en\s*18031|18031-1|18031-2|18031-3|red da|delegated act|article 3\.3\(d\)|article 3\.3\(e\)|article 3\.3\(f\)|protect network|personal data.*radio|fraud.*radio/.test(t)) return "RED_CYBER";
  if (/cyber resilience act|\bcra\b|secure development|vulnerability handling|sbom|software bill of materials|post-market security update|coordinated vulnerability disclosure/.test(t)) return "CRA";
  if (/rohs|2011\/65\/eu|en iec 63000|iec 63000|en 50581|hazardous substances|restricted substances|iec 62321/.test(t)) return "ROHS";
  if (/\breach\b|ec 1907\/2006|regulation \(ec\) no 1907\/2006|svhc|substances of very high concern|candidate list|annex xvii|article 33/.test(t)) return "REACH";
  if (/60335|60730|62233|60335-1|60335-2|household|appliance safety|electrical safety/.test(t)) return "LVD";
  if (/55014|61000|emc|electromagnetic|cispr|harmonic|flicker|electrostatic|esd|surge|immunity|conducted emission|radiated emission/.test(t)) return "EMC";
  if (/300 328|301 489|300 220|300 330|300 440|300 086|300 113|radio spectrum|wireless|bluetooth|wifi|wi-fi|lte|5g|zigbee|matter|nfc|rf exposure|receiver category/.test(t)) return "RED";
  if (/gdpr|privacy|personal data|data protection/.test(t)) return "GDPR";
  if (/ai act|artificial intelligence|machine learning|model/.test(t)) return "AI_Act";
  if (/ecodesign|espr|repairability|durability|energy/.test(t)) return "ESPR";
  return "OTHER";
}

function enrichDirectives(f) {
  const combined = [f.article, f.finding, f.action].filter(Boolean).join(" ");
  const inferred = inferDirectiveFromText(combined);
  let explicit = getDirectiveListFromFinding(f).filter(d => d !== "SYSTEM");
  if (/en\s*18031|18031-1|18031-2|18031-3/i.test(combined.toLowerCase())) {
    explicit = explicit.filter(d => d !== "CRA" && d !== "RED");
    explicit.push("RED_CYBER");
  }
  if (inferred === "RED_CYBER" && !explicit.includes("RED_CYBER")) explicit.push("RED_CYBER");
  if (!explicit.length) explicit = inferred ? [inferred] : ["OTHER"];
  return unique(explicit);
}

function buildStandardGroups(stds = []) {
  const map = new Map();
  stds.forEach(f => {
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

function DirBadge({ code, compact = false }) {
  const d = DIR[code] || DIR.OTHER;
  return (
    <span className={"dir-badge" + (compact ? " dir-badge--compact" : "")}
      style={{ "--dot": d.dot, "--pill": d.pill, "--ring": d.ring, "--ink": d.ink }}>
      <span className="dir-badge__dot" />
      <span className="dir-badge__code">{dirCodeLabel(code)}</span>
      {!compact && <span className="dir-badge__name">{DIR_NAME[code] || code}</span>}
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
        {item.directives.map(d => <DirBadge key={d} code={d} compact />)}
      </div>
      {item.findings?.[0]?.finding && (
        <div className="std-card__finding">{item.findings[0].finding}</div>
      )}
      {item.actions.length > 0 && (
        <div className="std-card__actions">
          <div className="std-card__actions-title">Required action</div>
          <ul>{item.actions.slice(0, 2).map((a, i) => <li key={i}>{a}</li>)}</ul>
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

function DirFilterBar({ availableDirs, selected, onChange, standardsByDirective }) {
  return (
    <div className="dir-filter-bar">
      <button
        className={"dir-chip" + (selected === "ALL" ? " dir-chip--active" : "")}
        onClick={() => onChange("ALL")}
      >
        All
      </button>
      {availableDirs.map(d => {
        const count = (standardsByDirective?.get(d) || []).length;
        const colors = DIR[d] || DIR.OTHER;
        return (
          <button
            key={d}
            className={"dir-chip" + (selected === d ? " dir-chip--active" : "")}
            style={selected === d
              ? { "--chip-bg": colors.pill, "--chip-border": colors.ring, "--chip-text": colors.ink }
              : {}}
            onClick={() => onChange(d)}
          >
            <span className="dir-chip__dot" style={{ background: colors.dot }} />
            {dirCodeLabel(d)}
            {count > 0 && <span className="dir-chip__count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function SummaryBar({ standards, sections, result }) {
  const statusCounts = useMemo(() => {
    const all = standards.map(s => priorityStatus(s.statuses));
    return {
      FAIL: all.filter(s => s === "FAIL").length,
      WARN: all.filter(s => s === "WARN").length,
      PASS: all.filter(s => s === "PASS").length,
      INFO: all.filter(s => s === "INFO").length,
    };
  }, [standards]);

  return (
    <div className="summary-bar">
      <div className="summary-bar__stat">
        <span className="summary-bar__num">{standards.length}</span>
        <span className="summary-bar__label">standards identified</span>
      </div>
      <div className="summary-bar__divider" />
      {["FAIL", "WARN", "PASS", "INFO"].map(st => statusCounts[st] > 0 && (
        <div key={st} className="summary-bar__status" style={{ "--fbg": STS[st].bg, "--fborder": STS[st].border, "--fstripe": STS[st].stripe }}>
          <span className="summary-bar__status-icon">{STS[st].icon}</span>
          <span className="summary-bar__status-num">{statusCounts[st]}</span>
          <span className="summary-bar__status-label">{STS[st].label}</span>
        </div>
      ))}
      {(sections?.missing?.length > 0 || sections?.contra?.length > 0) && (
        <>
          <div className="summary-bar__divider" />
          {sections.missing?.length > 0 && (
            <div className="summary-bar__flag">
              <span className="summary-bar__flag-icon">⚠</span>
              {sections.missing.length} missing info
            </div>
          )}
          {sections.contra?.length > 0 && (
            <div className="summary-bar__flag">
              <span className="summary-bar__flag-icon">⚡</span>
              {sections.contra.length} contradiction{sections.contra.length > 1 ? "s" : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  const [desc, setDesc] = useState("");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submittedDesc, setSubmittedDesc] = useState("");

  const [search, setSearch] = useState("");
  const [selectedDir, setSelectedDir] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [collapsedDirs, setCollapsedDirs] = useState(new Set());
  const [toast, setToast] = useState("");

  const taRef = useRef(null);
  const abortRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => { return () => abortRef.current?.abort(); }, []);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.max(160, taRef.current.scrollHeight) + "px";
  }, [desc]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const ready = desc.trim().length >= 10;

  const sections = useMemo(() => result?.findings ? splitFindings(result.findings) : null, [result]);
  const standards = useMemo(() => buildStandardGroups(sections?.stds || []), [sections]);

  const standardsFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return standards.filter(s => {
      const topStatus = priorityStatus(s.statuses);
      const text = [s.name, s.directives.join(" "), s.actions.join(" "), s.findings.map(f => [f.finding, f.action].join(" ")).join(" ")].join(" ").toLowerCase();
      return (!q || text.includes(q))
        && (selectedDir === "ALL" || s.directives.includes(selectedDir))
        && (statusFilter === "ALL" || topStatus === statusFilter);
    });
  }, [standards, search, selectedDir, statusFilter]);

  const standardsByDirective = useMemo(() => {
    const map = new Map();
    DIR_ORDER.forEach(d => map.set(d, []));
    standardsFiltered.forEach(s => {
      const dirs = s.directives.length ? s.directives : ["OTHER"];
      const firstKnown = dirs.find(d => DIR_ORDER.includes(d) && d !== "OTHER") || dirs[0] || "OTHER";
      const bucket = DIR_ORDER.includes(firstKnown) ? firstKnown : "OTHER";
      map.get(bucket).push(s);
    });
    return map;
  }, [standardsFiltered]);

  const availableDirs = useMemo(() => {
    const found = new Set();
    standards.forEach(s => s.directives.forEach(d => found.add(d)));
    return DIR_ORDER.filter(d => found.has(d) && d !== "OTHER").concat(found.has("OTHER") ? ["OTHER"] : []);
  }, [standards]);

  const toggleDir = (dir) => {
    setCollapsedDirs(prev => {
      const next = new Set(prev);
      next.has(dir) ? next.delete(dir) : next.add(dir);
      return next;
    });
  };

  const copyStandards = () => { copyText(standardsFiltered.map(s => s.name).join("\n")); setToast("✓ Standards list copied"); };
  const copySummary = () => {
    const txt = [`Product: ${submittedDesc.trim()}`, `Standards found: ${standards.length}`, ...DIR_ORDER.flatMap(dir => { const rows = standardsByDirective.get(dir) || []; if (!rows.length) return []; return ["", `${dirCodeLabel(dir)} (${rows.length})`, ...rows.map(r => `- ${r.name}`)]; })].join("\n");
    copyText(txt); setToast("✓ Summary copied");
  };
  const exportJson = () => { if (!result) return; downloadJson("rulegrid-analysis.json", result); setToast("✓ JSON exported"); };

  const run = useCallback(async () => {
    if (!ready || loading) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    abortRef.current = ctrl;

    setLoading(true); setError(null); setResult(null);
    setSearch(""); setSelectedDir("ALL"); setStatusFilter("ALL");
    setCollapsedDirs(new Set());
    setSubmittedDesc(desc);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: [], depth }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError(e.name === "AbortError" ? "Request timed out — please try again." : e.message || "Unexpected error.");
    } finally {
      clearTimeout(timer); setLoading(false);
    }
  }, [desc, depth, ready, loading]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false); setError(null); setResult(null);
    setSearch(""); setSelectedDir("ALL"); setStatusFilter("ALL");
    setCollapsedDirs(new Set()); setSubmittedDesc("");
  }, []);

  const activeDirs = DIR_ORDER.filter(d => (standardsByDirective.get(d) || []).length > 0);

  return (
    <div className="shell">
      <AppCSS />

      <nav className="nav">
        <div className="container nav__inner">
          <div className="nav__brand">
            <span className="nav__logo">RG</span>
            <span className="nav__name">RuleGrid</span>
          </div>
          <span className="nav__tag">EU compliance scoping</span>
        </div>
      </nav>

      <main className="container page">

        {/* ── INPUT PANEL ── always visible, collapses when results shown */}
        <div className={"input-panel" + (result ? " input-panel--compact" : "")}>
          {!result && (
            <header className="hero">
              <p className="hero__eyebrow">EU Compliance Scoping</p>
              <h1 className="hero__title">Standards first.<br />Faster review.</h1>
              <p className="hero__sub">Describe your product and get applicable EU standards grouped by directive — LVD, EMC, RF, RED Cybersecurity, CRA, RoHS, REACH, and more.</p>
            </header>
          )}

          <div className="card input-card">
            {result ? (
              /* Compact: show submitted description as read-only context */
              <div className="input-card__context">
                <div className="input-card__context-label">Analysed product</div>
                <div className="input-card__context-text">{submittedDesc}</div>
                <button className="new-analysis-btn" onClick={reset}>← New analysis</button>
              </div>
            ) : (
              <>
                <div className="input-card__head">
                  <div>
                    <h2 className="input-card__title">Describe your product</h2>
                    <p className="input-card__hint">Include: product type, connectivity (BT/Wi-Fi/cellular), power source, any app or cloud component.</p>
                  </div>
                </div>

                <textarea
                  ref={taRef}
                  className="ta"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder={"e.g. " + SAMPLE}
                />

                <div className="input-card__foot">
                  <div className="depth-wrap">
                    <span className="depth-label">Analysis depth</span>
                    <div className="depth">
                      {["standard", "deep"].map(v => (
                        <button key={v} type="button"
                          className={"seg-btn" + (depth === v ? " seg-btn--on" : "")}
                          onClick={() => setDepth(v)}
                          title={DEPTH_INFO[v]}
                        >
                          {v === "standard" ? "Standard" : "Deep dive"}
                        </button>
                      ))}
                    </div>
                    <span className="depth-hint">{DEPTH_INFO[depth]}</span>
                  </div>

                  <div className="input-card__actions">
                    <button type="button" className="ghost-btn" onClick={() => setDesc(SAMPLE)}>Try example</button>
                    {desc && <button type="button" className="ghost-btn" onClick={() => setDesc("")}>Clear</button>}
                    <button type="button" className="run-btn" onClick={run} disabled={!ready}>
                      {loading ? "Analysing…" : "Analyse →"}
                    </button>
                  </div>
                </div>

                {error && <div className="err-bar">{error}</div>}
              </>
            )}
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="loading">
            <div className="card loading__card">
              <span className="spinner" />
              <div>
                <div className="loading__title">Analysing product</div>
                <p className="loading__text">Identifying applicable standards and grouping by directive family…</p>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div ref={resultsRef}>
            {/* Summary bar */}
            <SummaryBar standards={standards} sections={sections} result={result} />

            {/* Filter toolbar */}
            <div className="results-toolbar card">
              {/* Directive filter — visual chips */}
              <div className="results-toolbar__row">
                <span className="toolbar-label">Filter by directive</span>
                <DirFilterBar
                  availableDirs={availableDirs}
                  selected={selectedDir}
                  onChange={code => { setSelectedDir(code); setSearch(""); }}
                  standardsByDirective={standardsByDirective}
                />
              </div>

              <div className="results-toolbar__row results-toolbar__row--between">
                <div className="toolbar__search">
                  <span className="search-icon">⌕</span>
                  <input
                    className="search-input"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search standards, notes, actions…"
                  />
                  {search && (
                    <button className="search-clear" onClick={() => setSearch("")}>×</button>
                  )}
                </div>

                <div className="status-chips">
                  {["ALL", "FAIL", "WARN", "PASS", "INFO"].map(st => (
                    <button key={st}
                      className={"status-chip" + (statusFilter === st ? " status-chip--active" : "")}
                      style={st !== "ALL" ? { "--schip-bg": STS[st]?.bg, "--schip-border": STS[st]?.border, "--schip-text": STS[st]?.text } : {}}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st === "ALL" ? "All statuses" : <><span>{STS[st].icon}</span> {STS[st].label}</>}
                    </button>
                  ))}
                </div>

                <div className="export-actions">
                  <button type="button" className="ghost-btn" onClick={copySummary} title="Copy full summary to clipboard">Copy summary</button>
                  <button type="button" className="ghost-btn" onClick={copyStandards} title="Copy just the standard names">Copy standards</button>
                  <button type="button" className="ghost-btn" onClick={exportJson} title="Download raw JSON">Export JSON</button>
                </div>
              </div>
            </div>

            {/* Standards sections — collapsible per directive */}
            <div className="results-body">
              {standardsFiltered.length === 0 ? (
                <div className="card empty-state">
                  <div className="empty-state__icon">◎</div>
                  <div className="empty-state__title">No standards match your filters</div>
                  <button className="ghost-btn" onClick={() => { setSearch(""); setSelectedDir("ALL"); setStatusFilter("ALL"); }}>Clear filters</button>
                </div>
              ) : (
                activeDirs
                  .filter(dir => (selectedDir === "ALL" || selectedDir === dir))
                  .map(dir => {
                    const rows = standardsByDirective.get(dir) || [];
                    if (!rows.length) return null;
                    const collapsed = collapsedDirs.has(dir);
                    return (
                      <section key={dir} className="dir-section card">
                        <button className="dir-section__head" onClick={() => toggleDir(dir)}>
                          <div className="dir-section__headLeft">
                            <DirBadge code={dir} />
                            <span className="count-pill">{rows.length}</span>
                          </div>
                          <span className={"dir-section__chevron" + (collapsed ? "" : " dir-section__chevron--open")}>›</span>
                        </button>

                        {!collapsed && (
                          <div className="dir-section__body">
                            <div className="std-grid">
                              {rows.map(item => <StandardCard key={dir + item.name} item={item} />)}
                            </div>
                          </div>
                        )}
                      </section>
                    );
                  })
              )}
            </div>

            {/* Secondary finding sections */}
            {sections?.missing?.length > 0 && (
              <section className="card finding-section">
                <div className="finding-section__head">
                  <h2 className="finding-section__title">Missing information</h2>
                  <span className="count-pill">{sections.missing.length}</span>
                </div>
                <div className="list-pad">{sections.missing.map(f => <FindingRow key={f._i} f={f} />)}</div>
              </section>
            )}

            {sections?.contra?.length > 0 && (
              <section className="card finding-section">
                <div className="finding-section__head">
                  <h2 className="finding-section__title">Contradictions</h2>
                  <span className="count-pill">{sections.contra.length}</span>
                </div>
                <div className="list-pad">{sections.contra.map(f => <FindingRow key={f._i} f={f} />)}</div>
              </section>
            )}

            {sections?.other?.length > 0 && (
              <section className="card finding-section">
                <div className="finding-section__head">
                  <h2 className="finding-section__title">Other findings</h2>
                  <span className="count-pill">{sections.other.length}</span>
                </div>
                <div className="list-pad">{sections.other.map(f => <FindingRow key={f._i} f={f} />)}</div>
              </section>
            )}
          </div>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function AppCSS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { min-height: 100%; }
      button, input, select, textarea { font: inherit; }
      button { cursor: pointer; border: none; }
      textarea { resize: none; }

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

      /* ── NAV ── */
      .nav {
        position: sticky; top: 0; z-index: 40;
        background: rgba(13,44,59,.94);
        border-bottom: 1px solid rgba(255,255,255,.08);
        backdrop-filter: blur(12px);
      }
      .nav__inner { height: 56px; display: flex; align-items: center; justify-content: space-between; }
      .nav__brand { display: flex; align-items: center; gap: 10px; }
      .nav__logo {
        width: 28px; height: 28px; border-radius: 7px;
        display: grid; place-items: center;
        background: linear-gradient(135deg, #13678A, #35a37d);
        color: #fff; font-size: 11px; font-weight: 800;
      }
      .nav__name { color: #eff8fb; font-weight: 800; letter-spacing: -.02em; }
      .nav__tag {
        font-size: 11px; color: #cbe2ea;
        padding: 4px 10px; border-radius: 999px;
        background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.10);
      }

      .page { padding: 28px 0 60px; }
      .card {
        background: rgba(255,255,255,.88);
        border: 1px solid #cfe0e8;
        border-radius: 16px;
        box-shadow: 0 2px 6px rgba(13,44,59,.04), 0 12px 32px rgba(13,44,59,.05);
        backdrop-filter: blur(8px);
      }

      /* ── HERO / INPUT PANEL ── */
      .input-panel { margin-bottom: 24px; }
      .input-panel--compact { margin-bottom: 20px; }

      .hero { margin-bottom: 20px; }
      .hero__eyebrow {
        font-size: 11px; font-weight: 800; letter-spacing: .12em;
        text-transform: uppercase; color: #2a6782; margin-bottom: 8px;
      }
      .hero__title {
        font-size: clamp(26px, 3.5vw, 40px);
        line-height: 1.08; letter-spacing: -.04em; font-weight: 800; color: #0d2c3b;
      }
      .hero__sub { margin-top: 12px; max-width: 60ch; color: #42616e; line-height: 1.8; }

      /* Input card */
      .input-card { overflow: hidden; }
      .input-card__head {
        padding: 18px 20px 12px;
        border-bottom: 1px solid #dce9ef;
      }
      .input-card__title { font-size: 15px; font-weight: 800; color: #0d2c3b; letter-spacing: -.02em; }
      .input-card__hint { margin-top: 4px; color: #577582; font-size: 13px; }

      .ta {
        display: block; width: 100%; min-height: 160px;
        padding: 18px 20px; border: none; outline: none;
        background: transparent; color: #0d2c3b; line-height: 1.85; font-size: 14px;
      }
      .ta::placeholder { color: #8daab5; }

      .input-card__foot {
        padding: 12px 16px;
        display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
        background: #f1f8fb; border-top: 1px solid #dce9ef;
        flex-wrap: wrap;
      }

      /* Depth selector — improved with label + hint */
      .depth-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .depth-label { font-size: 12px; font-weight: 700; color: #627d8a; white-space: nowrap; }
      .depth { display: flex; gap: 6px; }
      .seg-btn {
        padding: 7px 13px; border-radius: 10px;
        border: 1px solid #c6d9e2; background: #fff;
        color: #496673; font-weight: 700; font-size: 13px;
        transition: all .12s;
      }
      .seg-btn--on { background: #e8f3f8; border-color: #96bfd1; color: #0f4256; }
      .depth-hint { font-size: 11.5px; color: #7a9aaa; max-width: 28ch; line-height: 1.4; }

      .input-card__actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

      /* Compact context view (after results load) */
      .input-card__context {
        padding: 14px 18px;
        display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
      }
      .input-card__context-label { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #627d8a; white-space: nowrap; }
      .input-card__context-text { flex: 1; font-size: 13px; color: #1e3f4e; min-width: 0; }
      .new-analysis-btn {
        padding: 7px 13px; border-radius: 10px; border: 1px solid #96bfd1;
        background: #e8f3f8; color: #0f4256; font-weight: 700; font-size: 13px;
        white-space: nowrap; flex-shrink: 0;
        transition: background .12s;
      }
      .new-analysis-btn:hover { background: #d8ecf5; }

      /* Buttons */
      .ghost-btn {
        padding: 8px 13px; border-radius: 10px;
        background: #fff; border: 1px solid #c6d9e2;
        color: #35515e; font-weight: 700; font-size: 13px;
        transition: background .1s;
      }
      .ghost-btn:hover { background: #f4fafc; }

      .run-btn {
        padding: 8px 18px; border-radius: 10px; font-weight: 800; font-size: 14px;
        background: linear-gradient(135deg, #0d2c3b, #13678A);
        color: #fff; box-shadow: 0 6px 20px rgba(19,103,138,.22);
        transition: opacity .12s, transform .1s;
      }
      .run-btn:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
      .run-btn:disabled { background: #c8d8df; color: #7d98a4; box-shadow: none; cursor: not-allowed; transform: none; }

      .err-bar {
        margin: 0 16px 16px; padding: 12px 14px;
        border-radius: 10px; background: #edf4f6;
        border: 1px solid #c6d9e2; color: #0d2c3b;
      }

      /* ── LOADING ── */
      .loading { margin-bottom: 16px; }
      .loading__card { padding: 18px 20px; display: flex; align-items: center; gap: 14px; }
      .loading__title { font-weight: 800; color: #0d2c3b; }
      .loading__text { margin-top: 3px; color: #5b7885; font-size: 13px; }
      .spinner {
        width: 24px; height: 24px; border-radius: 50%;
        border: 2.5px solid #c6d9e2; border-top-color: #13678A;
        animation: spin .7s linear infinite; flex-shrink: 0;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* ── SUMMARY BAR ── */
      .summary-bar {
        display: flex; align-items: center; gap: 16px;
        padding: 14px 18px; margin-bottom: 12px;
        background: rgba(255,255,255,.72);
        border: 1px solid #cfe0e8; border-radius: 14px;
        flex-wrap: wrap;
      }
      .summary-bar__stat { display: flex; align-items: baseline; gap: 6px; }
      .summary-bar__num { font-size: 22px; font-weight: 800; letter-spacing: -.04em; color: #0d2c3b; }
      .summary-bar__label { font-size: 12px; color: #627d8a; }
      .summary-bar__divider { width: 1px; height: 28px; background: #d0e4ec; flex-shrink: 0; }
      .summary-bar__status {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 10px 5px 8px; border-radius: 999px;
        background: var(--fbg); border: 1px solid var(--fborder);
        font-size: 12px; font-weight: 700;
      }
      .summary-bar__status-icon {
        width: 18px; height: 18px; border-radius: 5px;
        background: var(--fstripe); color: #fff;
        display: grid; place-items: center; font-size: 11px; font-weight: 800;
      }
      .summary-bar__status-num { font-weight: 800; }
      .summary-bar__status-label { font-weight: 600; }
      .summary-bar__flag {
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 12px; font-weight: 700; color: #5a6e77;
      }
      .summary-bar__flag-icon { font-size: 13px; }

      /* ── RESULTS TOOLBAR ── */
      .results-toolbar {
        padding: 14px 16px; margin-bottom: 14px;
        display: flex; flex-direction: column; gap: 10px;
      }
      .results-toolbar__row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .results-toolbar__row--between { justify-content: space-between; }
      .toolbar-label { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #627d8a; white-space: nowrap; }

      /* Directive filter chips */
      .dir-filter-bar { display: flex; gap: 6px; flex-wrap: wrap; }
      .dir-chip {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 11px; border-radius: 999px;
        border: 1px solid #c6d9e2; background: #fff;
        color: #35515e; font-size: 12px; font-weight: 700;
        transition: all .1s; cursor: pointer;
      }
      .dir-chip:hover { background: #edf4f6; }
      .dir-chip--active {
        background: var(--chip-bg, #e8f3f8);
        border-color: var(--chip-border, #96bfd1);
        color: var(--chip-text, #0f4256);
      }
      .dir-chip__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
      .dir-chip__count {
        min-width: 18px; height: 18px; padding: 0 5px;
        border-radius: 999px; background: rgba(13,44,59,.1);
        color: inherit; font-size: 10px; font-weight: 800;
        display: grid; place-items: center;
      }

      /* Search */
      .toolbar__search {
        position: relative; display: flex; align-items: center;
        min-width: 260px; flex: 1; max-width: 380px;
      }
      .search-icon {
        position: absolute; left: 10px;
        font-size: 17px; color: #8daab5; pointer-events: none;
        line-height: 1;
      }
      .search-input {
        width: 100%; height: 36px; border-radius: 10px;
        border: 1px solid #c6d9e2; background: #fff;
        color: #0d2c3b; padding: 0 32px 0 32px;
        outline: none; font-size: 13px;
      }
      .search-input:focus { border-color: #96bfd1; box-shadow: 0 0 0 3px rgba(19,103,138,.08); }
      .search-clear {
        position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: #8daab5; font-size: 16px;
        padding: 2px 4px; line-height: 1; cursor: pointer;
      }
      .search-clear:hover { color: #4a6875; }

      /* Status chips */
      .status-chips { display: flex; gap: 5px; flex-wrap: wrap; }
      .status-chip {
        padding: 5px 10px; border-radius: 999px;
        border: 1px solid #c6d9e2; background: #fff;
        color: #496673; font-size: 12px; font-weight: 700;
        display: inline-flex; align-items: center; gap: 5px;
        transition: all .1s;
      }
      .status-chip:hover { background: #edf4f6; }
      .status-chip--active {
        background: var(--schip-bg, #e8f3f8);
        border-color: var(--schip-border, #96bfd1);
        color: var(--schip-text, #0f4256);
      }

      /* Export buttons */
      .export-actions { display: flex; gap: 6px; flex-wrap: wrap; }

      /* ── RESULTS BODY ── */
      .results-body { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }

      /* Directive sections — collapsible */
      .dir-section { overflow: hidden; }
      .dir-section__head {
        width: 100%; padding: 14px 18px;
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        background: none; border: none; text-align: left;
        cursor: pointer; border-radius: 16px;
        transition: background .1s;
      }
      .dir-section__head:hover { background: rgba(13,44,59,.025); }
      .dir-section__headLeft { display: flex; align-items: center; gap: 10px; }
      .dir-section__chevron {
        font-size: 20px; color: #8daab5; font-weight: 400;
        transform: rotate(90deg); transition: transform .18s;
        line-height: 1;
      }
      .dir-section__chevron--open { transform: rotate(-90deg); }
      .dir-section__body { padding: 0 16px 16px; }

      /* Badges */
      .dir-badge {
        display: inline-flex; align-items: center; gap: 8px;
        border-radius: 999px; border: 1px solid var(--ring);
        background: var(--pill); color: var(--ink);
        padding: 7px 12px 7px 9px; min-height: 34px;
      }
      .dir-badge--compact {
        padding: 4px 9px 4px 7px; min-height: 26px; gap: 5px;
      }
      .dir-badge__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dot); flex-shrink: 0; }
      .dir-badge--compact .dir-badge__dot { width: 6px; height: 6px; }
      .dir-badge__code { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; }
      .dir-badge--compact .dir-badge__code { font-size: 10px; }
      .dir-badge__name { font-size: 12px; font-weight: 700; }

      /* Standards grid */
      .std-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
      .std-card {
        border: 1px solid var(--fborder);
        background: linear-gradient(180deg, #fff 0%, var(--fbg) 100%);
        border-radius: 14px; padding: 14px;
      }
      .std-card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .std-card__name { font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.55; font-weight: 600; color: #0d2c3b; }
      .std-card__chips { margin-top: 10px; display: flex; gap: 5px; flex-wrap: wrap; }
      .std-card__finding { margin-top: 12px; color: #36515d; line-height: 1.75; font-size: 12.5px; }
      .std-card__actions { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.7); border: 1px solid rgba(13,44,59,.09); }
      .std-card__actions-title { font-size: 10px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; color: #5a7480; margin-bottom: 6px; }
      .std-card__actions ul { padding-left: 16px; }
      .std-card__actions li { font-size: 12px; line-height: 1.65; color: #36515d; }

      /* Status pill */
      .status-pill {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 9px; border-radius: 999px;
        background: var(--fbg); border: 1px solid var(--fborder); color: var(--ftext);
        font-size: 11px; font-weight: 800; white-space: nowrap; flex-shrink: 0;
      }
      .status-pill__n { font-weight: 800; }

      /* Count pill */
      .count-pill {
        min-width: 26px; padding: 3px 8px;
        border-radius: 999px; display: inline-flex; align-items: center; justify-content: center;
        background: #edf4f6; border: 1px solid #c6d9e2;
        color: #2a6782; font-size: 11px; font-weight: 800;
      }

      /* Finding rows */
      .list-pad { padding: 8px 8px 12px; }
      .frow {
        display: grid; grid-template-columns: 48px 1fr;
        border-radius: 12px; overflow: hidden;
        border: 1px solid var(--fborder); background: var(--fbg);
        margin-bottom: 8px;
      }
      .frow__left {
        background: var(--fstripe); display: flex; flex-direction: column;
        align-items: center; justify-content: flex-start; gap: 6px; padding: 12px 0;
      }
      .frow__icon {
        width: 22px; height: 22px; border-radius: 6px;
        background: rgba(255,255,255,.22); display: grid; place-items: center;
        color: #fff; font-weight: 800;
      }
      .frow__label { font-size: 8px; color: rgba(255,255,255,.9); font-weight: 800; letter-spacing: .12em; }
      .frow__body { padding: 12px 14px; }
      .frow__art { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: #64808c; margin-bottom: 4px; }
      .frow__text { color: #24404d; line-height: 1.75; }
      .frow__action { margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,.68); border: 1px solid rgba(13,44,59,.08); color: #35515e; font-size: 12px; }

      /* Finding section headers */
      .finding-section { overflow: hidden; margin-bottom: 12px; }
      .finding-section__head { padding: 14px 18px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #dce9ef; }
      .finding-section__title { font-size: 15px; font-weight: 800; letter-spacing: -.02em; color: #0d2c3b; }

      /* Empty state */
      .empty-state { padding: 48px 24px; text-align: center; }
      .empty-state__icon { font-size: 28px; color: #9bbac6; margin-bottom: 12px; }
      .empty-state__title { font-size: 15px; font-weight: 700; color: #4a6875; margin-bottom: 16px; }

      /* Toast */
      .toast {
        position: fixed; right: 18px; bottom: 18px; z-index: 60;
        padding: 10px 16px; border-radius: 10px;
        background: #0d2c3b; color: #fff;
        box-shadow: 0 10px 24px rgba(13,44,59,.22);
        font-size: 13px; font-weight: 700;
        animation: fadeInUp .18s ease;
      }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

      /* ── RESPONSIVE ── */
      @media (max-width: 980px) {
        .results-toolbar__row--between { flex-direction: column; align-items: flex-start; }
        .toolbar__search { max-width: 100%; width: 100%; }
        .export-actions { width: 100%; }
      }

      @media (max-width: 720px) {
        .page { padding: 18px 0 40px; }
        .input-card__foot { flex-direction: column; align-items: stretch; }
        .depth-wrap { flex-wrap: wrap; }
        .depth-hint { display: none; }
        .input-card__actions { flex-direction: column; }
        .ghost-btn, .run-btn, .search-input { width: 100%; }
        .nav__tag { display: none; }
        .summary-bar { gap: 10px; }
        .std-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}