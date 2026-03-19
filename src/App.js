import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

const SAMPLE =
  "Smart kettle with mobile app. Bluetooth connection. Mains powered, 230V.";

/* ── Directive metadata ────────────────────────────────────────────────── */
const DIR_NAME = {
  RED: "Radio Equipment Directive",
  CRA: "Cyber Resilience Act",
  GDPR: "General Data Protection Regulation",
  AI_Act: "EU Artificial Intelligence Act",
  LVD: "Low Voltage Directive",
  EMC: "Electromagnetic Compatibility Directive",
  ESPR: "Ecodesign for Sustainable Products Regulation",
};

const DIR = {
  RED: { dot: "#012030", pill: "#cfe0e8", ring: "#8fb8c8", ink: "#012030" },
  CRA: { dot: "#13678A", pill: "#d6edf5", ring: "#7db8cf", ink: "#0a3d52" },
  GDPR: { dot: "#45C4B0", pill: "#daf4f0", ring: "#8dd8ce", ink: "#0d4840" },
  AI_Act: { dot: "#9AEBA3", pill: "#e5f9e8", ring: "#91d99a", ink: "#1a5228" },
  LVD: { dot: "#012030", pill: "#d0dfe8", ring: "#8bafc0", ink: "#012030" },
  EMC: { dot: "#13678A", pill: "#d4ecf5", ring: "#7bb5cf", ink: "#0a3d52" },
  ESPR: { dot: "#45C4B0", pill: "#daf6f2", ring: "#8dd8ce", ink: "#0d4840" },
  SYSTEM: { dot: "#6a9faf", pill: "#dde9ed", ring: "#9abbc6", ink: "#1e4a57" },
};

const STS = {
  FAIL: { icon: "×", label: "FAIL", bg: "#c8dde7", border: "#7aafc5", text: "#012030", stripe: "#13678A" },
  WARN: { icon: "!", label: "WARN", bg: "#d6ecf5", border: "#7db8d0", text: "#093a50", stripe: "#2889a6" },
  PASS: { icon: "✓", label: "PASS", bg: "#daf4f0", border: "#7ccfc4", text: "#0a3c35", stripe: "#45C4B0" },
  INFO: { icon: "i", label: "INFO", bg: "#e3f7e6", border: "#88d392", text: "#163e22", stripe: "#9AEBA3" },
};

const RISK = {
  CRITICAL: { bg: "#bdd4df", border: "#70a0b5", text: "#012030" },
  HIGH: { bg: "#cce0ea", border: "#78adc2", text: "#062538" },
  MEDIUM: { bg: "#d4eef8", border: "#80bdd4", text: "#0a3448" },
  LOW: { bg: "#d6f5ee", border: "#7fcec3", text: "#094038" },
};

const STD_RE =
  /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|IEC|UL|ASTM|CISPR|ITU|IEC\/EN|GDPR review|AI Act review)\b/i;

const QUESTIONS = [
  {
    id: "type",
    label: "What type of product is it?",
    eg: "kettle, robot vacuum, baby monitor",
    ok: (t) =>
      /\b(kettle|vacuum|camera|monitor|tracker|wearable|coffee|air.?fryer|fan|lock|gateway|hub|toy|sensor|appliance|device|product|purifier|machine|dryer|iron|blender)\b/i.test(
        t
      ),
  },
  {
    id: "radio",
    label: "Does it have wireless or radio?",
    eg: "Bluetooth, Wi-Fi, LTE, Zigbee",
    ok: (t) =>
      /\b(bluetooth|ble|wifi|wi-fi|802\.11|lte|4g|5g|zigbee|thread|matter|nfc|cellular|radio)\b/i.test(
        t
      ),
  },
  {
    id: "sw",
    label: "Does it use an app, cloud, or firmware?",
    eg: "mobile app, cloud backend, OTA updates",
    ok: (t) =>
      /\b(app|mobile.?app|cloud|backend|server|internet|connected|ota|firmware|software|platform|api)\b/i.test(
        t
      ),
  },
  {
    id: "power",
    label: "How is it powered?",
    eg: "mains 230V, battery, rechargeable, USB",
    ok: (t) =>
      /\b(mains|230v|220v|110v|120v|battery|rechargeable|usb|hardwired|wall.?plug|ac|dc)\b/i.test(
        t
      ),
  },
  {
    id: "data",
    label: "Does it process personal or sensitive data?",
    eg: "camera, mic, account, location, health data",
    ok: (t) =>
      /\b(camera|microphone|mic|account|login|location|gps|health|heart.?rate|personal.?data|biometric|voice|user.?profile)\b/i.test(
        t
      ),
  },
];

const TAB_KEYS = ["overview", "legislation", "standards", "findings"];

function unique(arr = []) {
  return [...new Set(arr)];
}

function getDirectiveListFromFinding(f) {
  return (f.directive || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function getDirs(findings = []) {
  const s = new Set();
  findings.forEach((f) => {
    getDirectiveListFromFinding(f).forEach((d) => {
      if (d && d !== "SYSTEM") s.add(d);
    });
  });
  return [...s];
}

function splitFindings(findings = []) {
  const b = { stds: [], interp: [], missing: [], contra: [], other: [] };
  findings.forEach((f, i) => {
    const row = { ...f, _i: i };
    const art = (f.article || "").trim();
    const dir = (f.directive || "").trim();

    if (STD_RE.test(art) || /review$/i.test(art)) {
      b.stds.push(row);
      return;
    }
    if (
      dir === "SYSTEM" &&
      /Product interpretation|Explicit signals|Inferred/i.test(art)
    ) {
      b.interp.push(row);
      return;
    }
    if (/Missing/i.test(art)) {
      b.missing.push(row);
      return;
    }
    if (/Contradiction/i.test(art)) {
      b.contra.push(row);
      return;
    }
    b.other.push(row);
  });
  return b;
}

function normalizeStdName(s = "") {
  return s.replace(/\s+/g, " ").trim();
}

function buildStandardGroups(stds = []) {
  const map = new Map();

  stds.forEach((f) => {
    const name = normalizeStdName(f.article || "Unnamed standard");
    const directives = getDirectiveListFromFinding(f).filter((d) => d !== "SYSTEM");
    const key = name.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        name,
        directives: [...directives],
        statuses: [f.status].filter(Boolean),
        findings: [f],
        actions: f.action ? [f.action] : [],
      });
    } else {
      const curr = map.get(key);
      curr.directives = unique([...curr.directives, ...directives]);
      curr.statuses = unique([...curr.statuses, f.status].filter(Boolean));
      curr.findings.push(f);
      if (f.action) curr.actions = unique([...curr.actions, f.action]);
    }
  });

  return [...map.values()];
}

function priorityStatus(statuses = []) {
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.includes("WARN")) return "WARN";
  if (statuses.includes("PASS")) return "PASS";
  return "INFO";
}

function copyText(text) {
  if (!navigator?.clipboard) return false;
  navigator.clipboard.writeText(text);
  return true;
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Small components ──────────────────────────────────────────────────── */

function DirBadge({ code, compact = false }) {
  const d = DIR[code] || DIR.SYSTEM;

  if (compact) {
    return (
      <span
        className="badge-sm"
        style={{
          "--dot": d.dot,
          "--pill": d.pill,
          "--ring": d.ring,
          "--ink": d.ink,
        }}
      >
        <span className="badge-sm__dot" />
        {code}
      </span>
    );
  }

  return (
    <span
      className="badge"
      style={{
        "--dot": d.dot,
        "--pill": d.pill,
        "--ring": d.ring,
        "--ink": d.ink,
      }}
    >
      <span className="badge__dot" />
      <span className="badge__code">{code}</span>
      <span className="badge__rule" />
      <span className="badge__name">{DIR_NAME[code] || code}</span>
    </span>
  );
}

function StatusPill({ status }) {
  const s = STS[status] || STS.INFO;
  return (
    <span
      className="status-pill"
      style={{
        "--fbg": s.bg,
        "--fborder": s.border,
        "--ftext": s.text,
      }}
    >
      <span className="status-pill__n">{s.icon}</span>
      <span>{s.label}</span>
    </span>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub ? <div className="metric-sub">{sub}</div> : null}
    </div>
  );
}

function FindingRow({ f }) {
  const s = STS[f.status] || STS.INFO;
  const dirs = getDirectiveListFromFinding(f);

  return (
    <div
      className="frow"
      style={{
        "--fbg": s.bg,
        "--fborder": s.border,
        "--ftext": s.text,
        "--fstripe": s.stripe,
      }}
    >
      <div className="frow__left">
        <span className="frow__icon">{s.icon}</span>
        <span className="frow__label">{s.label}</span>
      </div>

      <div className="frow__body">
        {dirs.length > 0 && (
          <div className="frow__chips">
            {dirs.map((d) => (
              <DirBadge key={d} code={d} compact />
            ))}
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

function Section({ title, hint, count, defaultOpen = true, children, right }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card sec">
      <div className="card-head section-head">
        <div>
          <h2 className="card-title">{title}</h2>
          {hint ? <p className="card-hint">{hint}</p> : null}
        </div>

        <div className="section-head__right">
          {typeof count === "number" ? <span className="count-pill">{count}</span> : null}
          {right}
          <button type="button" className="mini-btn" onClick={() => setOpen((v) => !v)}>
            {open ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {open ? children : null}
    </section>
  );
}

function StandardCard({ item }) {
  const mainStatus = priorityStatus(item.statuses);
  const s = STS[mainStatus] || STS.INFO;

  return (
    <div
      className="std-card"
      style={{
        "--fbg": s.bg,
        "--fborder": s.border,
        "--ftext": s.text,
      }}
    >
      <div className="std-card__top">
        <div>
          <div className="std-card__name">{item.name}</div>
          <div className="std-card__meta">
            {item.directives.length > 0 ? (
              <div className="std-card__chips">
                {item.directives.map((d) => (
                  <DirBadge key={d} code={d} compact />
                ))}
              </div>
            ) : (
              <span className="muted-inline">No directive mapping in response</span>
            )}
          </div>
        </div>
        <StatusPill status={mainStatus} />
      </div>

      <div className="std-card__body">
        {item.findings.slice(0, 2).map((f) => (
          <div key={f._i} className="std-card__finding">
            {f.finding}
          </div>
        ))}

        {item.actions.length > 0 && (
          <div className="std-card__actions">
            <div className="std-card__actions-label">Actions</div>
            <ul>
              {item.actions.map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────────────────────── */

export default function App() {
  const [desc, setDesc] = useState("");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [directiveFilter, setDirectiveFilter] = useState([]);
  const [sortMode, setSortMode] = useState("name-asc");
  const [toast, setToast] = useState("");

  const taRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.max(180, taRef.current.scrollHeight) + "px";
  }, [desc]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const qs = useMemo(
    () => QUESTIONS.map((q) => ({ ...q, done: q.ok(desc) })),
    [desc]
  );
  const doneN = qs.filter((q) => q.done).length;
  const pct = Math.round((doneN / QUESTIONS.length) * 100);
  const ready = desc.trim().length >= 10;

  const sec = useMemo(
    () => (result?.findings ? splitFindings(result.findings) : null),
    [result]
  );

  const dirs = useMemo(() => {
    if (!result) return [];
    if (Array.isArray(result.directives) && result.directives.length) {
      return result.directives;
    }
    return getDirs(result.findings || []);
  }, [result]);

  const counts = useMemo(() => {
    if (!result?.findings) return {};
    return result.findings.reduce((a, f) => {
      a[f.status] = (a[f.status] || 0) + 1;
      return a;
    }, {});
  }, [result]);

  const rk = result ? RISK[result.overall_risk] || RISK.LOW : RISK.LOW;

  const standardGroups = useMemo(
    () => buildStandardGroups(sec?.stds || []),
    [sec]
  );

  const legislationCards = useMemo(() => {
    return dirs.map((code) => {
      const related = (result?.findings || []).filter((f) =>
        getDirectiveListFromFinding(f).includes(code)
      );

      return {
        code,
        name: DIR_NAME[code] || code,
        count: related.length,
        standards: buildStandardGroups(
          related.filter((f) => STD_RE.test((f.article || "").trim()) || /review$/i.test(f.article || ""))
        ).length,
        findings: related,
      };
    });
  }, [dirs, result]);

  const findingsFiltered = useMemo(() => {
    const all = result?.findings || [];
    const q = query.trim().toLowerCase();

    return all.filter((f) => {
      const dirsForFinding = getDirectiveListFromFinding(f);
      const matchesQuery =
        !q ||
        [f.article, f.finding, f.action, f.directive]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter.length === 0 || statusFilter.includes(f.status);

      const matchesDirective =
        directiveFilter.length === 0 ||
        dirsForFinding.some((d) => directiveFilter.includes(d));

      return matchesQuery && matchesStatus && matchesDirective;
    });
  }, [result, query, statusFilter, directiveFilter]);

  const standardsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let rows = standardGroups.filter((s) => {
      const matchesQuery =
        !q ||
        [s.name, s.directives.join(" "), s.actions.join(" "), s.findings.map((f) => f.finding).join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const topStatus = priorityStatus(s.statuses);
      const matchesStatus =
        statusFilter.length === 0 || statusFilter.includes(topStatus);

      const matchesDirective =
        directiveFilter.length === 0 ||
        s.directives.some((d) => directiveFilter.includes(d));

      return matchesQuery && matchesStatus && matchesDirective;
    });

    rows = [...rows].sort((a, b) => {
      if (sortMode === "name-desc") return b.name.localeCompare(a.name);
      if (sortMode === "status") {
        const order = { FAIL: 0, WARN: 1, PASS: 2, INFO: 3 };
        return (
          order[priorityStatus(a.statuses)] - order[priorityStatus(b.statuses)] ||
          a.name.localeCompare(b.name)
        );
      }
      if (sortMode === "directive-count") {
        return b.directives.length - a.directives.length || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });

    return rows;
  }, [standardGroups, query, statusFilter, directiveFilter, sortMode]);

  const standardsByDirective = useMemo(() => {
    const map = new Map();

    dirs.forEach((d) => {
      map.set(
        d,
        standardsFiltered.filter((s) => s.directives.includes(d))
      );
    });

    const unmapped = standardsFiltered.filter((s) => s.directives.length === 0);
    if (unmapped.length) map.set("UNMAPPED", unmapped);

    return map;
  }, [dirs, standardsFiltered]);

  const productSummaryText = useMemo(() => {
    const lines = [
      `Overall risk: ${result?.overall_risk || "LOW"}`,
      result?.summary ? `Summary: ${result.summary}` : "",
      result?.product_summary ? `Product interpretation: ${result.product_summary}` : "",
      dirs.length ? `Directives in scope: ${dirs.join(", ")}` : "",
      standardGroups.length ? `Standards: ${standardGroups.map((s) => s.name).join("\n- ")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return lines;
  }, [result, dirs, standardGroups]);

  const run = useCallback(async () => {
    if (!ready || loading) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveTab("overview");
    setQuery("");
    setStatusFilter([]);
    setDirectiveFilter([]);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          category: "",
          directives: [],
          depth,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(
        e.name === "AbortError"
          ? "Request timed out — please try again."
          : e.message || "Unexpected error."
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, [desc, depth, ready, loading]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setError(null);
    setResult(null);
    setQuery("");
    setStatusFilter([]);
    setDirectiveFilter([]);
    setSortMode("name-asc");
    setActiveTab("overview");
  }, []);

  const toggleStatus = (s) => {
    setStatusFilter((curr) =>
      curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s]
    );
  };

  const toggleDirective = (d) => {
    setDirectiveFilter((curr) =>
      curr.includes(d) ? curr.filter((x) => x !== d) : [...curr, d]
    );
  };

  const handleCopySummary = () => {
    copyText(productSummaryText);
    setToast("Summary copied");
  };

  const handleCopyStandards = () => {
    copyText(standardsFiltered.map((s) => s.name).join("\n"));
    setToast("Standards copied");
  };

  const handleExportJson = () => {
    if (!result) return;
    downloadJson("rulegrid-analysis.json", result);
    setToast("JSON exported");
  };

  return (
    <div className="shell">
      <AppCSS />

      <nav className="nav">
        <div className="w nav-inner">
          <div className="nav-brand">
            <span className="nav-mark">
              <svg
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="none"
                stroke="#DAFDBA"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="4 10 8 14 16 6" />
              </svg>
            </span>
            <span className="nav-name">RuleGrid</span>
          </div>
          <span className="nav-pill">EU Compliance Scoping</span>
        </div>
      </nav>

      <main className="w page">
        <header className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Appliances · CE Marking · Standards Mapping</p>
            <h1>
              Describe your product.
              <br />
              Get your compliance roadmap.
            </h1>
            <p className="hero-sub">
              Write a short description — product type, connectivity, power source.
              RuleGrid maps likely EU directives, legislations, standards, and gaps
              that still need clarification.
            </p>
          </div>

          {dirs.length > 0 && (
            <div className="hero-dirs">
              <p className="micro-label">Directives in scope</p>
              <div className="badge-stack">
                {dirs.map((d) => (
                  <DirBadge key={d} code={d} />
                ))}
              </div>
            </div>
          )}
        </header>

        {!result && !loading && (
          <div className="split">
            <div className="card input-card">
              <div className="card-head">
                <h2 className="card-title">Product description</h2>
                <p className="card-hint">One or two sentences is enough to get started.</p>
              </div>

              <textarea
                ref={taRef}
                className="ta"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={"Example:\n\n" + SAMPLE}
              />

              <div className="input-foot">
                <span className="char-count">{desc.length} chars</span>

                <div className="depth-seg">
                  <span className="depth-label">Depth</span>
                  {["standard", "deep"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={"seg-btn" + (depth === v ? " seg-btn--on" : "")}
                      onClick={() => setDepth(v)}
                    >
                      {v[0].toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="action-row">
                  <button type="button" className="ghost-btn" onClick={() => setDesc(SAMPLE)}>
                    Sample
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => setDesc("")}>
                    Clear
                  </button>
                  <button type="button" className="run-btn" onClick={run} disabled={!ready}>
                    Analyse →
                  </button>
                </div>
              </div>

              {error && <div className="err-bar">{error}</div>}
            </div>

            <aside className="card cl-card">
              <div className="cl-head">
                <span className="card-title" style={{ fontSize: 13 }}>
                  Coverage checklist
                </span>
                <span className="cl-badge">
                  {doneN}/{QUESTIONS.length}
                </span>
              </div>
              <div className="cl-bar">
                <div className="cl-bar-fill" style={{ width: pct + "%" }} />
              </div>
              <ul className="cl-list">
                {qs.map((q) => (
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
                  ? "Great detail — expect more accurate results."
                  : `${QUESTIONS.length - doneN} topic(s) not yet covered.`}
              </p>
            </aside>
          </div>
        )}

        {loading && (
          <div className="load-wrap">
            <div className="card load-card">
              <span className="spinner" />
              <div>
                <div className="card-title">Analysing…</div>
                <p className="card-hint" style={{ marginTop: 4 }}>
                  Mapping legislations, standards, risks, and missing information.
                </p>
              </div>
            </div>
            {[96, 68, 54].map((h, i) => (
              <div key={i} className="skel" style={{ height: h, animationDelay: i * 0.15 + "s" }} />
            ))}
          </div>
        )}

        {result && (
          <>
            <div
              className="rbar card"
              style={{ "--rbg": rk.bg, "--rborder": rk.border, "--rtext": rk.text }}
            >
              <div className="rbar-risk">
                <span className="micro-label">Overall risk</span>
                <span className="rbar-val">{result.overall_risk || "LOW"}</span>
              </div>

              <div className="rbar-summary">
                <span className="micro-label">Summary</span>
                <p>{result.summary}</p>
              </div>

              <div className="rbar-pills">
                {["FAIL", "WARN", "PASS", "INFO"].map((s) =>
                  counts[s] ? (
                    <div
                      key={s}
                      className="stat-pill"
                      style={{
                        "--fbg": STS[s].bg,
                        "--fborder": STS[s].border,
                        "--ftext": STS[s].text,
                      }}
                    >
                      <span className="stat-n">{counts[s]}</span>
                      <span className="stat-s">{s}</span>
                    </div>
                  ) : null
                )}
              </div>

              <div className="rbar-actions">
                <button type="button" className="ghost-btn" onClick={handleCopySummary}>
                  Copy summary
                </button>
                <button type="button" className="ghost-btn" onClick={handleCopyStandards}>
                  Copy standards
                </button>
                <button type="button" className="ghost-btn" onClick={handleExportJson}>
                  Export JSON
                </button>
                <button type="button" className="ghost-btn edit-btn" onClick={reset}>
                  ← Edit
                </button>
              </div>
            </div>

            <div className="metrics-grid">
              <StatCard label="Directives" value={dirs.length} sub="Detected in scope" />
              <StatCard label="Standards" value={standardGroups.length} sub="Deduplicated list" />
              <StatCard label="Missing details" value={sec?.missing?.length || 0} sub="Need clarification" />
              <StatCard label="Conflicts" value={sec?.contra?.length || 0} sub="Contradictions detected" />
            </div>

            <div className="tabs-row">
              {TAB_KEYS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={"tab-btn" + (activeTab === tab ? " tab-btn--on" : "")}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "overview" && "Overview"}
                  {tab === "legislation" && "Legislation"}
                  {tab === "standards" && "Standards"}
                  {tab === "findings" && "All findings"}
                </button>
              ))}
            </div>

            <div className="res-grid">
              <div className="res-main">
                {activeTab === "overview" && (
                  <>
                    <Section
                      title="Product interpretation"
                      hint="How the engine understood the product based on your description."
                      count={sec?.interp?.length || 0}
                    >
                      <div className="overview-box">
                        <div className="overview-summary">
                          <div className="overview-summary__title">Product summary</div>
                          <p>{result.product_summary || "—"}</p>
                        </div>

                        {sec?.interp?.length > 0 && (
                          <div className="flist">
                            {sec.interp.map((f) => (
                              <FindingRow key={f._i} f={f} />
                            ))}
                          </div>
                        )}
                      </div>
                    </Section>

                    <Section
                      title="Likely applicable legislations"
                      hint="Directives and regulations inferred from the description."
                      count={legislationCards.length}
                    >
                      <div className="leg-grid">
                        {legislationCards.map((d) => (
                          <div className="leg-card" key={d.code}>
                            <DirBadge code={d.code} />
                            <div className="leg-card__meta">
                              <div className="leg-card__stat">
                                <span>{d.count}</span>
                                <small>linked findings</small>
                              </div>
                              <div className="leg-card__stat">
                                <span>{d.standards}</span>
                                <small>mapped standards</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>

                    <Section
                      title="Top standards"
                      hint="Deduplicated standards, grouped for faster review."
                      count={standardsFiltered.length}
                      right={
                        <select
                          className="sort-select"
                          value={sortMode}
                          onChange={(e) => setSortMode(e.target.value)}
                        >
                          <option value="name-asc">A–Z</option>
                          <option value="name-desc">Z–A</option>
                          <option value="status">By status</option>
                          <option value="directive-count">By directive count</option>
                        </select>
                      }
                    >
                      <div className="std-grid">
                        {standardsFiltered.slice(0, 8).map((item) => (
                          <StandardCard key={item.name} item={item} />
                        ))}
                      </div>
                    </Section>

                    {sec?.missing?.length > 0 && (
                      <Section
                        title="Information needed to refine the result"
                        hint="Add these details for a tighter scope."
                        count={sec.missing.length}
                      >
                        <div className="flist">
                          {sec.missing.map((f) => (
                            <FindingRow key={f._i} f={f} />
                          ))}
                        </div>
                      </Section>
                    )}

                    {sec?.contra?.length > 0 && (
                      <Section
                        title="Conflicting signals"
                        hint="These reduce accuracy and should be clarified."
                        count={sec.contra.length}
                        defaultOpen={false}
                      >
                        <div className="flist">
                          {sec.contra.map((f) => (
                            <FindingRow key={f._i} f={f} />
                          ))}
                        </div>
                      </Section>
                    )}
                  </>
                )}

                {activeTab === "legislation" && (
                  <Section
                    title="Legislation and directive view"
                    hint="Each directive with related findings and mapped standards."
                    count={legislationCards.length}
                  >
                    <div className="legislation-stack">
                      {legislationCards.map((d) => {
                        const relatedStandards = buildStandardGroups(
                          d.findings.filter((f) =>
                            STD_RE.test((f.article || "").trim()) || /review$/i.test(f.article || "")
                          )
                        );

                        return (
                          <details className="leg-detail" key={d.code} open>
                            <summary className="leg-detail__summary">
                              <div className="leg-detail__title">
                                <DirBadge code={d.code} />
                              </div>
                              <div className="leg-detail__counts">
                                <span>{d.count} findings</span>
                                <span>{relatedStandards.length} standards</span>
                              </div>
                            </summary>

                            {relatedStandards.length > 0 && (
                              <div className="leg-detail__body">
                                <div className="leg-detail__subhead">Mapped standards</div>
                                <div className="chip-cloud">
                                  {relatedStandards.map((s) => (
                                    <span key={s.name} className="chip-cloud__item">
                                      {s.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flist">
                              {d.findings.map((f) => (
                                <FindingRow key={f._i} f={f} />
                              ))}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </Section>
                )}

                {activeTab === "standards" && (
                  <>
                    <Section
                      title="Standards library view"
                      hint="Grouped, deduplicated, filterable, and sortable."
                      count={standardsFiltered.length}
                      right={
                        <select
                          className="sort-select"
                          value={sortMode}
                          onChange={(e) => setSortMode(e.target.value)}
                        >
                          <option value="name-asc">A–Z</option>
                          <option value="name-desc">Z–A</option>
                          <option value="status">By status</option>
                          <option value="directive-count">By directive count</option>
                        </select>
                      }
                    >
                      <div className="standards-by-dir">
                        {[...standardsByDirective.entries()].map(([code, rows]) => (
                          <div key={code} className="std-group">
                            <div className="std-group__head">
                              <div className="std-group__title">
                                {code === "UNMAPPED" ? (
                                  <span className="plain-head">Unmapped standards</span>
                                ) : (
                                  <DirBadge code={code} />
                                )}
                              </div>
                              <span className="count-pill">{rows.length}</span>
                            </div>

                            {rows.length > 0 ? (
                              <div className="std-grid">
                                {rows.map((item) => (
                                  <StandardCard key={code + item.name} item={item} />
                                ))}
                              </div>
                            ) : (
                              <p className="empty">No standards under current filters.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  </>
                )}

                {activeTab === "findings" && (
                  <>
                    <Section
                      title="Filtered findings"
                      hint="All findings after search and filter selection."
                      count={findingsFiltered.length}
                    >
                      {findingsFiltered.length > 0 ? (
                        <div className="flist">
                          {findingsFiltered.map((f, idx) => (
                            <FindingRow key={`${f._i}-${idx}`} f={f} />
                          ))}
                        </div>
                      ) : (
                        <p className="empty">No findings match the current filters.</p>
                      )}
                    </Section>
                  </>
                )}
              </div>

              <aside className="res-aside">
                <div className="card side-card">
                  <h3 className="side-title">View tools</h3>

                  <div className="filter-group">
                    <label className="side-label">Search</label>
                    <input
                      className="search-input"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search directives, standards, findings..."
                    />
                  </div>

                  <div className="filter-group">
                    <label className="side-label">Status</label>
                    <div className="toggle-wrap">
                      {["FAIL", "WARN", "PASS", "INFO"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={"filter-chip" + (statusFilter.includes(s) ? " filter-chip--on" : "")}
                          onClick={() => toggleStatus(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-group">
                    <label className="side-label">Directives</label>
                    <div className="toggle-wrap">
                      {dirs.map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={"filter-chip" + (directiveFilter.includes(d) ? " filter-chip--on" : "")}
                          onClick={() => toggleDirective(d)}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filter-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => {
                        setQuery("");
                        setStatusFilter([]);
                        setDirectiveFilter([]);
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                </div>

                <div className="card side-card">
                  <h3 className="side-title">Directives in scope</h3>
                  {dirs.length > 0 ? (
                    <div className="badge-stack" style={{ marginTop: 10 }}>
                      {dirs.map((d) => (
                        <DirBadge key={d} code={d} />
                      ))}
                    </div>
                  ) : (
                    <p className="muted-p">No directives identified yet.</p>
                  )}
                </div>

                <div className="card side-card">
                  <h3 className="side-title">Product interpretation</h3>
                  <p className="prod-sum">{result.product_summary || "—"}</p>
                  <table className="meta-tbl">
                    <tbody>
                      <tr>
                        <td>Unique standards</td>
                        <td>{standardGroups.length}</td>
                      </tr>
                      <tr>
                        <td>Filtered findings</td>
                        <td>{findingsFiltered.length}</td>
                      </tr>
                      <tr>
                        <td>Details missing</td>
                        <td>{sec?.missing?.length || 0}</td>
                      </tr>
                      <tr>
                        <td>Contradictions</td>
                        <td>{sec?.contra?.length || 0}</td>
                      </tr>
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

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function AppCSS() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

      *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
      html, body, #root { min-height:100%; }
      button, input, select, textarea { font:inherit; }
      button { cursor:pointer; border:none; }
      textarea { resize:none; }
      ul { list-style:none; }

      body {
        font-family:'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size:14px;
        line-height:1.6;
        -webkit-font-smoothing:antialiased;
        background:
          radial-gradient(ellipse 65% 40% at 0% 0%, rgba(69,196,176,.08) 0%, transparent 60%),
          radial-gradient(ellipse 55% 35% at 100% 100%, rgba(19,103,138,.07) 0%, transparent 55%),
          #f0fbf9;
        color:#012030;
      }

      .shell { min-height:100vh; display:flex; flex-direction:column; }
      .w { max-width:1240px; margin:0 auto; padding:0 22px; width:100%; }
      .page { flex:1; padding:32px 22px 60px; }

      .nav {
        position:sticky; top:0; z-index:40;
        background:#012030;
        border-bottom:1px solid rgba(69,196,176,.16);
        backdrop-filter:blur(16px);
      }
      .nav-inner {
        height:56px;
        display:flex; align-items:center; justify-content:space-between;
      }
      .nav-brand { display:flex; align-items:center; gap:10px; }
      .nav-mark {
        width:30px; height:30px; border-radius:8px;
        background:linear-gradient(135deg,#13678A,#45C4B0);
        display:grid; place-items:center;
        box-shadow:0 2px 10px rgba(69,196,176,.30);
      }
      .nav-name {
        font-size:15px; font-weight:700; letter-spacing:-.025em; color:#DAFDBA;
      }
      .nav-pill {
        font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
        color:#9AEBA3;
        background:rgba(154,235,163,.10);
        border:1px solid rgba(154,235,163,.22);
        padding:4px 12px; border-radius:999px;
      }

      .hero {
        display:flex; gap:30px; align-items:flex-start; flex-wrap:wrap;
        margin-bottom:24px;
      }
      .hero-copy { flex:1; min-width:260px; }
      .eyebrow {
        font-size:10.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
        color:#13678A; margin-bottom:10px;
      }
      .hero-copy h1 {
        font-size:clamp(22px,3.2vw,34px);
        font-weight:800; letter-spacing:-.04em; line-height:1.1; color:#012030;
      }
      .hero-sub {
        margin-top:12px; font-size:14.5px; line-height:1.8; color:#2a6070; max-width:58ch;
      }
      .hero-dirs { min-width:240px; max-width:380px; }
      .micro-label {
        font-size:10px; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
        color:#5a9baa; margin-bottom:8px;
      }

      .badge-stack { display:flex; flex-direction:column; gap:6px; }
      .badge {
        display:inline-flex; align-items:stretch;
        border-radius:9px; overflow:hidden;
        border:1px solid var(--ring);
        background:var(--pill);
        width:100%;
      }
      .badge__dot { flex:0 0 5px; background:var(--dot); }
      .badge__code {
        font-family:'JetBrains Mono',monospace;
        font-size:10px; font-weight:600; color:var(--ink);
        padding:8px 8px 8px 10px; white-space:nowrap;
      }
      .badge__rule { width:1px; background:var(--ring); margin:6px 0; }
      .badge__name {
        flex:1; padding:8px 12px; font-size:12.5px; font-weight:500; line-height:1.3;
        color:var(--ink); background:rgba(255,255,255,.42);
      }

      .badge-sm {
        display:inline-flex; align-items:center; gap:5px;
        border-radius:6px; overflow:hidden;
        border:1px solid var(--ring); background:var(--pill);
        padding:3px 8px 3px 6px;
        font-family:'JetBrains Mono',monospace;
        font-size:10px; font-weight:600; color:var(--ink); white-space:nowrap;
      }
      .badge-sm__dot {
        width:5px; height:5px; border-radius:50%; background:var(--dot); flex-shrink:0;
      }

      .card {
        background:rgba(255,255,255,.88);
        border:1px solid #b8d8e4;
        border-radius:14px;
        box-shadow:0 1px 3px rgba(1,32,48,.05), 0 4px 14px rgba(1,32,48,.06);
        backdrop-filter:blur(8px);
      }
      .card-head {
        padding:16px 20px 13px;
        border-bottom:1px solid #d6ecf3;
      }
      .section-head {
        display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
      }
      .section-head__right {
        display:flex; align-items:center; gap:8px; flex-wrap:wrap;
      }
      .card-title {
        font-size:14px; font-weight:800; letter-spacing:-.02em; color:#012030;
      }
      .card-hint {
        margin-top:3px; font-size:12.5px; line-height:1.6; color:#3d7e90;
      }

      .split {
        display:grid; grid-template-columns:1fr 290px; gap:14px; align-items:start;
      }
      .input-card { overflow:hidden; }

      .ta {
        display:block; width:100%; min-height:180px;
        padding:16px 20px; border:none; outline:none; background:transparent;
        font-size:14px; line-height:1.85; color:#012030;
        border-bottom:1px solid #d6ecf3;
        transition:background .16s;
      }
      .ta:focus { background:rgba(240,251,249,.55); }
      .ta::placeholder { color:#8ab5c2; }

      .input-foot {
        padding:10px 16px;
        display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        background:#e8f6fa;
        border-top:1px solid #d0e8f0;
      }
      .char-count { font-size:11.5px; color:#6a9faf; }

      .depth-seg { display:flex; align-items:center; gap:6px; }
      .depth-label { font-size:11.5px; color:#3d7e90; }
      .seg-btn {
        padding:5px 11px; border-radius:7px; font-size:12px; font-weight:600;
        border:1px solid #b8d8e4; background:#fff; color:#3d7e90;
        transition:all .13s;
      }
      .seg-btn--on {
        background:#d6ecf5; border-color:#7db8d0; color:#093a50;
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
        background:#ddf5f1;
        border-color:#7ccfc4;
        color:#094038;
      }

      .run-btn {
        padding:7px 18px; border-radius:9px;
        font-size:13px; font-weight:700; border:none;
        background:linear-gradient(130deg,#012030 0%,#13678A 100%);
        color:#DAFDBA;
        box-shadow:0 3px 12px rgba(19,103,138,.30);
        transition:all .15s;
      }
      .run-btn:hover:not(:disabled) {
        transform:translateY(-1px);
        box-shadow:0 5px 18px rgba(19,103,138,.38);
      }
      .run-btn:disabled {
        background:#c8dde7; color:#7aacba; box-shadow:none; cursor:not-allowed;
      }

      .err-bar {
        margin:0 16px 14px;
        padding:11px 14px; border-radius:8px;
        background:#cfe0e8;
        border:1px solid #8ab4c8;
        color:#012030; font-size:13px; line-height:1.65;
      }

      .cl-card { overflow:hidden; }
      .cl-head {
        padding:13px 16px 9px;
        display:flex; align-items:center; justify-content:space-between;
        border-bottom:1px solid #d6ecf3;
      }
      .cl-badge {
        font-size:11px; font-weight:700;
        padding:3px 9px; border-radius:999px;
        background:#ddf5f1; border:1px solid #7ccfc4; color:#094038;
      }
      .cl-bar {
        height:3px; background:#d0e8f0; margin:0 16px 2px;
        border-radius:999px; overflow:hidden;
      }
      .cl-bar-fill {
        height:100%; border-radius:inherit;
        background:linear-gradient(90deg,#13678A,#45C4B0);
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
        border:1.8px solid #9ac5d2;
        background:#fff; display:grid; place-items:center;
        font-size:9.5px; font-weight:800; color:#fff; margin-top:2px;
        transition:all .13s;
      }
      .cl-tick--on { background:#45C4B0; border-color:#45C4B0; }
      .cl-qlabel { font-size:12.5px; font-weight:500; color:#012030; line-height:1.4; }
      .cl-eg { margin-top:2px; font-size:11px; color:#7aacba; font-style:italic; }
      .cl-foot {
        padding:8px 14px 12px; font-size:11.5px; color:#3d7e90; line-height:1.55;
        border-top:1px solid #d6ecf3;
      }

      .load-wrap { display:flex; flex-direction:column; gap:11px; }
      .load-card { padding:18px 20px; display:flex; align-items:center; gap:14px; }
      .spinner {
        flex:0 0 24px; width:24px; height:24px; border-radius:50%;
        border:2.5px solid #c8dde7; border-top-color:#45C4B0;
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

      .rbar {
        display:grid; grid-template-columns:160px 1fr auto auto;
        overflow:hidden; margin-bottom:16px; padding:0;
      }
      .rbar-risk {
        padding:16px 22px; display:flex; flex-direction:column; justify-content:center;
        background:var(--rbg); border-right:1px solid var(--rborder);
      }
      .rbar-val {
        font-size:22px; font-weight:800; letter-spacing:-.05em; color:var(--rtext); margin-top:5px;
      }
      .rbar-summary {
        padding:16px 22px; display:flex; flex-direction:column; justify-content:center;
        border-right:1px solid #d0e8f0;
      }
      .rbar-summary p { font-size:13px; line-height:1.78; color:#1e4a57; }
      .rbar-pills {
        padding:16px 14px; display:flex; flex-direction:column; gap:6px; justify-content:center;
        border-right:1px solid #d0e8f0;
      }
      .rbar-actions {
        padding:16px 14px; display:flex; flex-direction:column; gap:8px; justify-content:center;
      }
      .stat-pill {
        display:flex; align-items:baseline; gap:6px;
        padding:6px 10px; border-radius:8px;
        background:var(--fbg); border:1px solid var(--fborder);
      }
      .stat-n { font-size:16px; font-weight:800; line-height:1; color:var(--ftext); }
      .stat-s {
        font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--ftext);
      }

      .metrics-grid {
        display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px;
      }
      .metric-card {
        background:rgba(255,255,255,.88);
        border:1px solid #b8d8e4;
        border-radius:14px;
        padding:14px 16px;
        box-shadow:0 1px 3px rgba(1,32,48,.05), 0 4px 14px rgba(1,32,48,.04);
      }
      .metric-label {
        font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#5a9baa;
      }
      .metric-value {
        margin-top:4px; font-size:26px; line-height:1; font-weight:800; letter-spacing:-.05em; color:#012030;
      }
      .metric-sub {
        margin-top:6px; font-size:12px; color:#3d7e90;
      }

      .tabs-row {
        display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;
      }
      .tab-btn {
        padding:9px 14px; border-radius:10px;
        border:1px solid #b8d8e4; background:#fff; color:#2a6070;
        font-size:12.5px; font-weight:700;
      }
      .tab-btn--on {
        background:linear-gradient(180deg,#e8f6fa 0%, #d8f2ee 100%);
        border-color:#7ccfc4; color:#093a50;
      }

      .res-grid {
        display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:14px; align-items:start;
      }
      .res-main { display:flex; flex-direction:column; gap:12px; min-width:0; }
      .res-aside {
        display:flex; flex-direction:column; gap:12px;
        position:sticky; top:72px;
      }
      .sec { overflow:hidden; }
      .flist { padding:8px 6px; }
      .empty {
        padding:18px 20px; font-size:13px; color:#3d7e90; line-height:1.65;
      }

      .frow {
        display:grid; grid-template-columns:46px 1fr;
        border-radius:9px; overflow:hidden;
        border:1px solid var(--fborder); background:var(--fbg);
        margin-bottom:6px; transition:box-shadow .13s;
      }
      .frow:last-child { margin-bottom:0; }
      .frow:hover { box-shadow:0 2px 10px rgba(1,32,48,.08); }

      .frow__left {
        background:var(--fstripe);
        display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
        padding:13px 0 10px; gap:5px;
      }
      .frow__icon {
        width:22px; height:22px; border-radius:5px;
        background:rgba(255,255,255,.22);
        display:grid; place-items:center;
        font-size:12px; font-weight:800; color:#fff;
      }
      .frow__label {
        font-size:7.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
        color:rgba(255,255,255,.85);
      }
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
        font-size:14px; font-weight:700; color:var(--fstripe); line-height:1.5; flex-shrink:0;
      }

      .side-card { padding:16px 18px; }
      .side-title {
        font-size:13px; font-weight:800; letter-spacing:-.02em; color:#012030; margin-bottom:4px;
      }
      .side-label {
        display:block; margin-bottom:6px;
        font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#5a9baa;
      }
      .muted-p { font-size:12.5px; color:#5a9baa; margin-top:8px; }
      .prod-sum { font-size:12.5px; color:#1e4a57; line-height:1.75; margin-bottom:12px; }
      .meta-tbl { width:100%; border-collapse:collapse; font-size:12.5px; }
      .meta-tbl td { padding:6px 0; border-top:1px solid #d6ecf3; color:#1e4a57; }
      .meta-tbl td:first-child { color:#5a9baa; }
      .meta-tbl td:last-child { text-align:right; font-weight:700; color:#13678A; }

      .filter-group + .filter-group { margin-top:14px; }
      .search-input, .sort-select {
        width:100%; border:1px solid #b8d8e4; background:#fff;
        color:#012030; border-radius:10px; padding:10px 12px;
        outline:none;
      }
      .search-input:focus, .sort-select:focus {
        border-color:#7db8d0; box-shadow:0 0 0 3px rgba(69,196,176,.12);
      }

      .toggle-wrap { display:flex; gap:8px; flex-wrap:wrap; }
      .filter-chip {
        padding:6px 10px; border-radius:999px;
        border:1px solid #b8d8e4; background:#fff; color:#2a6070;
        font-size:11.5px; font-weight:700;
      }
      .filter-chip--on {
        background:#d6ecf5; border-color:#7db8d0; color:#093a50;
      }

      .filter-actions { margin-top:14px; }

      .count-pill {
        display:inline-flex; align-items:center; justify-content:center;
        min-width:28px; padding:4px 8px;
        border-radius:999px;
        background:#e8f6fa; border:1px solid #b8d8e4;
        color:#13678A; font-size:11px; font-weight:800;
      }
      .mini-btn {
        padding:6px 10px; border-radius:8px;
        background:#fff; border:1px solid #b8d8e4; color:#2a6070;
        font-size:11.5px; font-weight:700;
      }

      .status-pill {
        display:inline-flex; align-items:center; gap:6px;
        padding:6px 10px; border-radius:999px;
        background:var(--fbg); border:1px solid var(--fborder); color:var(--ftext);
        font-size:11px; font-weight:800; letter-spacing:.04em;
      }
      .status-pill__n { font-size:12px; }

      .overview-box { padding:16px 16px 10px; }
      .overview-summary {
        padding:14px 14px 12px;
        border:1px solid #d6ecf3;
        border-radius:12px;
        background:#f8fefe;
        margin-bottom:12px;
      }
      .overview-summary__title {
        font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#5a9baa;
        margin-bottom:6px;
      }
      .overview-summary p { color:#1e4a57; line-height:1.8; }

      .leg-grid {
        display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;
        padding:16px;
      }
      .leg-card {
        border:1px solid #d6ecf3;
        border-radius:12px;
        background:#fbfefe;
        padding:12px;
      }
      .leg-card__meta {
        margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;
      }
      .leg-card__stat {
        flex:1; min-width:110px;
        padding:10px 12px; border-radius:10px;
        background:#e8f6fa; border:1px solid #d0e8f0;
      }
      .leg-card__stat span {
        display:block; font-size:20px; font-weight:800; color:#012030; line-height:1;
      }
      .leg-card__stat small {
        display:block; margin-top:4px; color:#3d7e90; font-size:11.5px;
      }

      .std-grid {
        display:grid; grid-template-columns:repeat(auto-fit, minmax(290px, 1fr)); gap:12px;
        padding:16px;
      }
      .std-card {
        border:1px solid var(--fborder);
        background:linear-gradient(180deg, #ffffff 0%, var(--fbg) 100%);
        border-radius:12px;
        padding:14px;
      }
      .std-card__top {
        display:flex; justify-content:space-between; gap:10px; align-items:flex-start;
      }
      .std-card__name {
        font-family:'JetBrains Mono',monospace;
        font-size:12px; line-height:1.5; font-weight:600; color:#012030;
      }
      .std-card__meta { margin-top:8px; }
      .std-card__chips { display:flex; gap:6px; flex-wrap:wrap; }
      .std-card__body { margin-top:12px; }
      .std-card__finding {
        font-size:12.5px; line-height:1.7; color:#1e4a57;
      }
      .std-card__finding + .std-card__finding {
        margin-top:8px; padding-top:8px; border-top:1px solid rgba(19,103,138,.10);
      }
      .std-card__actions {
        margin-top:12px;
        padding:10px 12px;
        border-radius:10px;
        background:rgba(255,255,255,.72);
        border:1px solid rgba(19,103,138,.12);
      }
      .std-card__actions-label {
        font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#5a9baa;
        margin-bottom:6px;
      }
      .std-card__actions ul {
        list-style:disc; padding-left:18px;
      }
      .std-card__actions li {
        font-size:12px; color:#1e4a57; line-height:1.65;
      }

      .legislation-stack { padding:16px; display:flex; flex-direction:column; gap:12px; }
      .leg-detail {
        border:1px solid #d6ecf3; border-radius:12px; overflow:hidden; background:#fbfefe;
      }
      .leg-detail__summary {
        padding:14px; display:flex; justify-content:space-between; align-items:center; gap:12px;
        cursor:pointer; list-style:none;
      }
      .leg-detail__summary::-webkit-details-marker { display:none; }
      .leg-detail__title { flex:1; min-width:0; }
      .leg-detail__counts {
        display:flex; gap:8px; flex-wrap:wrap;
      }
      .leg-detail__counts span {
        padding:5px 9px; border-radius:999px;
        font-size:11px; font-weight:800;
        background:#e8f6fa; border:1px solid #d0e8f0; color:#13678A;
      }
      .leg-detail__body {
        padding:0 14px 14px;
      }
      .leg-detail__subhead {
        font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#5a9baa;
        margin-bottom:8px;
      }

      .chip-cloud {
        display:flex; flex-wrap:wrap; gap:8px;
      }
      .chip-cloud__item {
        padding:7px 10px; border-radius:999px;
        font-size:11.5px; font-weight:600;
        background:#ffffff; border:1px solid #d6ecf3; color:#1e4a57;
      }

      .standards-by-dir { display:flex; flex-direction:column; gap:18px; padding:16px; }
      .std-group__head {
        display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;
      }
      .plain-head {
        font-size:13px; font-weight:800; color:#012030;
      }
      .muted-inline {
        font-size:11.5px; color:#5a9baa;
      }

      .footer { border-top:1px solid #c8dde7; background:#fff; margin-top:28px; }
      .footer-inner {
        padding:13px 22px;
        display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;
        font-size:11.5px; color:#5a9baa;
      }

      .toast {
        position:fixed; right:18px; bottom:18px; z-index:80;
        padding:10px 14px; border-radius:10px;
        background:#012030; color:#DAFDBA;
        box-shadow:0 8px 24px rgba(1,32,48,.24);
        font-size:12.5px; font-weight:700;
      }

      @media (max-width:1100px) {
        .rbar { grid-template-columns:1fr; }
        .rbar-risk, .rbar-summary, .rbar-pills { border-right:none; border-bottom:1px solid #d0e8f0; }
        .rbar-actions { flex-direction:row; flex-wrap:wrap; }
        .metrics-grid { grid-template-columns:repeat(2,1fr); }
      }

      @media (max-width:1020px) {
        .split, .res-grid { grid-template-columns:1fr; }
        .res-aside { position:static; }
        .hero-dirs { max-width:100%; }
      }

      @media (max-width:620px) {
        .page { padding:18px 14px 44px; }
        .w { padding:0 14px; }
        .hero { flex-direction:column; }
        .input-foot { flex-direction:column; align-items:stretch; }
        .action-row { flex-direction:column; margin-left:0; }
        .run-btn, .ghost-btn { width:100%; text-align:center; }
        .metrics-grid { grid-template-columns:1fr; }
        .tabs-row { display:grid; grid-template-columns:1fr 1fr; }
        .tab-btn { width:100%; }
        .nav-pill { display:none; }
        .footer-inner { flex-direction:column; }
        .std-grid, .leg-grid { grid-template-columns:1fr; }
      }
    `}</style>
  );
}