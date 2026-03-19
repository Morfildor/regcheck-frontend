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
  SYSTEM: "System",
  OTHER: "Other",
};

const DIR_ORDER = [
  "LVD",
  "EMC",
  "RED",
  "RED_CYBER",
  "CRA",
  "ROHS",
  "REACH",
  "GDPR",
  "AI_Act",
  "ESPR",
  "OTHER",
];

const DIR = {
  LVD: { dot: "#0d2c3b", pill: "#d8e8ef", ring: "#9fc0cf", ink: "#0d2c3b" },
  EMC: { dot: "#13678A", pill: "#d8edf5", ring: "#8bbfd4", ink: "#0b4258" },
  RED: { dot: "#1f3c88", pill: "#dbe5ff", ring: "#a7bbe9", ink: "#1f3c88" },
  RED_CYBER: {
    dot: "#533483",
    pill: "#ece4fb",
    ring: "#c6b5ea",
    ink: "#41286a",
  },
  CRA: { dot: "#1c7c54", pill: "#daf3e5", ring: "#9ed1b5", ink: "#13533a" },
  ROHS: { dot: "#6f7f14", pill: "#f2f5d8", ring: "#d0d78a", ink: "#55610f" },
  REACH: { dot: "#8a5a13", pill: "#f8ecd9", ring: "#e0bf8d", ink: "#6a430d" },
  GDPR: { dot: "#4a7c59", pill: "#e3f3e8", ring: "#b8d6bf", ink: "#33573f" },
  AI_Act: { dot: "#6b4f9d", pill: "#ece5f8", ring: "#c5b5e4", ink: "#4b3770" },
  ESPR: { dot: "#7d6a0f", pill: "#f6f0d1", ring: "#dbcf8b", ink: "#62530d" },
  OTHER: { dot: "#627d8a", pill: "#e5edf1", ring: "#bfd0d8", ink: "#3f5862" },
  SYSTEM: { dot: "#627d8a", pill: "#e5edf1", ring: "#bfd0d8", ink: "#3f5862" },
};

const STS = {
  FAIL: {
    icon: "×",
    label: "FAIL",
    bg: "#e5eef3",
    border: "#9bb8c7",
    text: "#0d2c3b",
    stripe: "#2a6782",
  },
  WARN: {
    icon: "!",
    label: "WARN",
    bg: "#e8f3f8",
    border: "#9dc7d8",
    text: "#104052",
    stripe: "#3c8ca9",
  },
  PASS: {
    icon: "✓",
    label: "PASS",
    bg: "#e4f5ee",
    border: "#a6d2bf",
    text: "#134534",
    stripe: "#35a37d",
  },
  INFO: {
    icon: "i",
    label: "INFO",
    bg: "#edf4f6",
    border: "#bfd0d8",
    text: "#32505b",
    stripe: "#7e98a3",
  },
};

const STD_RE =
  /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|UL|ASTM|CISPR|ITU|IEC\/EN)\b/i;

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

function isStandardFinding(f) {
  const article = (f.article || "").trim();
  return STD_RE.test(article) || /review$/i.test(article);
}

function splitFindings(findings = []) {
  const bucket = { stds: [], missing: [], contra: [], other: [] };

  findings.forEach((f, i) => {
    const row = { ...f, _i: i };
    const art = (f.article || "").trim();

    if (isStandardFinding(f)) {
      bucket.stds.push(row);
      return;
    }
    if (/Missing/i.test(art)) {
      bucket.missing.push(row);
      return;
    }
    if (/Contradiction/i.test(art)) {
      bucket.contra.push(row);
      return;
    }
    bucket.other.push(row);
  });

  return bucket;
}

function inferDirectiveFromText(text = "") {
  const t = text.toLowerCase();

  if (
    /en\s*18031|18031-1|18031-2|18031-3|red da|delegated act|article 3\.3\(d\)|article 3\.3\(e\)|article 3\.3\(f\)|protect network|personal data.*radio|fraud.*radio/.test(
      t
    )
  ) {
    return "RED_CYBER";
  }

  if (
    /cyber resilience act|\bcra\b|secure development|vulnerability handling|sbom|software bill of materials|post-market security update|coordinated vulnerability disclosure/.test(
      t
    )
  ) {
    return "CRA";
  }

  if (
    /rohs|2011\/65\/eu|en iec 63000|iec 63000|en 50581|hazardous substances|restricted substances|iec 62321|62321-3-1|62321-3-2|62321-3-3|62321-4|62321-5|62321-6|62321-7-1|62321-7-2|62321-8/.test(
      t
    )
  ) {
    return "ROHS";
  }

  if (
    /\breach\b|ec 1907\/2006|regulation \(ec\) no 1907\/2006|svhc|substances of very high concern|candidate list|annex xvii|article 33/.test(
      t
    )
  ) {
    return "REACH";
  }

  if (
    /60335|60730|62233|60335-1|60335-2|household|appliance safety|electrical safety/.test(
      t
    )
  ) {
    return "LVD";
  }

  if (
    /55014|61000|emc|electromagnetic|cispr|harmonic|flicker|electrostatic|esd|surge|immunity|conducted emission|radiated emission/.test(
      t
    )
  ) {
    return "EMC";
  }

  if (
    /300 328|301 489|300 220|300 330|300 440|300 086|300 113|radio spectrum|wireless|bluetooth|wifi|wi-fi|lte|5g|zigbee|matter|nfc|rf exposure|receiver category/.test(
      t
    )
  ) {
    return "RED";
  }

  if (/gdpr|privacy|personal data|data protection/.test(t)) {
    return "GDPR";
  }

  if (/ai act|artificial intelligence|machine learning|model/.test(t)) {
    return "AI_Act";
  }

  if (/ecodesign|espr|repairability|durability|energy/.test(t)) {
    return "ESPR";
  }

  return "OTHER";
}

function enrichDirectives(f) {
  const combined = [f.article, f.finding, f.action].filter(Boolean).join(" ");
  const inferred = inferDirectiveFromText(combined);

  let explicit = getDirectiveListFromFinding(f).filter((d) => d !== "SYSTEM");

  if (/en\s*18031|18031-1|18031-2|18031-3/i.test(combined.toLowerCase())) {
    explicit = explicit.filter((d) => d !== "CRA");
    explicit = explicit.filter((d) => d !== "RED");
    explicit.push("RED_CYBER");
  }

  if (inferred === "RED_CYBER" && !explicit.includes("RED_CYBER")) {
    explicit.push("RED_CYBER");
  }

  if (!explicit.length) {
    explicit = inferred ? [inferred] : ["OTHER"];
  }

  return unique(explicit);
}

function buildStandardGroups(stds = []) {
  const map = new Map();

  stds.forEach((f) => {
    const name = normalizeStdName(f.article || "Unnamed standard");
    const directives = enrichDirectives(f);
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

function dirCodeLabel(code) {
  if (code === "RED") return "RF";
  if (code === "RED_CYBER") return "RED CYBER";
  return code;
}

function DirBadge({ code }) {
  const d = DIR[code] || DIR.OTHER;

  return (
    <span
      className="dir-badge"
      style={{
        "--dot": d.dot,
        "--pill": d.pill,
        "--ring": d.ring,
        "--ink": d.ink,
      }}
    >
      <span className="dir-badge__dot" />
      <span className="dir-badge__code">{dirCodeLabel(code)}</span>
      <span className="dir-badge__name">{DIR_NAME[code] || code}</span>
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

function StandardCard({ item }) {
  const mainStatus = priorityStatus(item.statuses);

  return (
    <div
      className="std-card"
      style={{
        "--fbg": (STS[mainStatus] || STS.INFO).bg,
        "--fborder": (STS[mainStatus] || STS.INFO).border,
        "--ftext": (STS[mainStatus] || STS.INFO).text,
      }}
    >
      <div className="std-card__top">
        <div className="std-card__name">{item.name}</div>
        <StatusPill status={mainStatus} />
      </div>

      <div className="std-card__chips">
        {item.directives.map((d) => (
          <DirBadge key={d} code={d} />
        ))}
      </div>

      {item.findings?.[0]?.finding ? (
        <div className="std-card__finding">{item.findings[0].finding}</div>
      ) : null}

      {item.actions.length > 0 ? (
        <div className="std-card__actions">
          <div className="std-card__actions-title">Action</div>
          <ul>
            {item.actions.slice(0, 2).map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function FindingRow({ f }) {
  const s = STS[f.status] || STS.INFO;
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
        <div className="frow__art">{f.article || ""}</div>
        <div className="frow__text">{f.finding}</div>
        {f.action ? <div className="frow__action">{f.action}</div> : null}
      </div>
    </div>
  );
}

function Section({ title, helper, count, right, children }) {
  return (
    <div className="card section">
      <div className="section__head">
        <div className="section__titleWrap">
          <div className="section__title">{title}</div>
          {typeof count === "number" ? <span className="count-pill">{count}</span> : null}
          {helper ? <div className="section__helper">{helper}</div> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function useToast(timeout = 1800) {
  const [msg, setMsg] = useState("");
  const tRef = useRef(null);

  const show = useCallback(
    (text) => {
      setMsg(text);
      if (tRef.current) clearTimeout(tRef.current);
      tRef.current = setTimeout(() => setMsg(""), timeout);
    },
    [timeout]
  );

  useEffect(() => {
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, []);

  return { msg, show };
}

function collectDirectiveCounts(groups = []) {
  const counts = {};
  groups.forEach((g) => {
    g.directives.forEach((d) => {
      counts[d] = (counts[d] || 0) + 1;
    });
  });
  return counts;
}

export default function App() {
  const [description, setDescription] = useState(SAMPLE);
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDir, setFilterDir] = useState("ALL");
  const [hidePassedInfo, setHidePassedInfo] = useState(false);
  const { msg, show } = useToast();

  const run = useCallback(async () => {
    const text = description.trim();
    if (!text) {
      setError("Describe the product first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: text,
          category: "",
          directives: [],
          depth,
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw || `Request failed: ${res.status}`);
      }

      const json = await res.json();
      setResult(json);
    } catch (e) {
      setError(e?.message || "Request failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [description, depth]);

  const findingsBucket = useMemo(() => splitFindings(result?.findings || []), [result]);

  const standardGroups = useMemo(() => {
    const fromFindings = buildStandardGroups(findingsBucket.stds || []);
    return fromFindings.sort((a, b) => a.name.localeCompare(b.name));
  }, [findingsBucket]);

  const filteredStandardGroups = useMemo(() => {
    return standardGroups.filter((g) => {
      const matchesSearch = !search.trim()
        ? true
        : [g.name, ...g.findings.map((x) => x.finding || ""), ...g.actions]
            .join(" ")
            .toLowerCase()
            .includes(search.trim().toLowerCase());

      const matchesDir = filterDir === "ALL" ? true : g.directives.includes(filterDir);
      return matchesSearch && matchesDir;
    });
  }, [standardGroups, search, filterDir]);

  const standardsByDirective = useMemo(() => {
    const groups = {};
    filteredStandardGroups.forEach((g) => {
      g.directives.forEach((d) => {
        if (!groups[d]) groups[d] = [];
        groups[d].push(g);
      });
    });
    return groups;
  }, [filteredStandardGroups]);

  const directiveCounts = useMemo(() => collectDirectiveCounts(standardGroups), [standardGroups]);

  const nonStdFindings = useMemo(() => {
    const arr = [...(findingsBucket.other || []), ...(findingsBucket.missing || []), ...(findingsBucket.contra || [])];
    return hidePassedInfo ? arr.filter((f) => f.status !== "PASS" && f.status !== "INFO") : arr;
  }, [findingsBucket, hidePassedInfo]);

  const summaryStats = useMemo(() => {
    const findings = result?.findings || [];
    return {
      pass: findings.filter((x) => x.status === "PASS").length,
      warn: findings.filter((x) => x.status === "WARN").length,
      fail: findings.filter((x) => x.status === "FAIL").length,
      info: findings.filter((x) => x.status === "INFO").length,
      directives: result?.directives?.length || 0,
      standards: standardGroups.length,
    };
  }, [result, standardGroups]);

  const exportPayload = useMemo(() => {
    if (!result) return null;
    return {
      exported_at: new Date().toISOString(),
      input: { description, depth },
      summary: result.summary,
      overall_risk: result.overall_risk,
      directives: result.directives || [],
      findings: result.findings || [],
      standards_grouped: standardGroups,
      diagnostics: result.diagnostics || [],
      raw: result,
    };
  }, [result, description, depth, standardGroups]);

  const quickAdds = useMemo(() => {
    const t = description.toLowerCase();
    const options = [];

    const add = (label, value) => {
      if (!t.includes(value.toLowerCase())) options.push({ label, value });
    };

    if (!t.includes("mains") && !t.includes("battery") && !t.includes("usb")) {
      add("Mains powered", "Mains powered, 230V");
      add("Battery powered", "Battery powered");
      add("USB powered", "USB powered");
    }

    if (!t.includes("bluetooth") && !t.includes("wifi") && !t.includes("zigbee") && !t.includes("thread") && !t.includes("matter")) {
      add("Bluetooth", "Bluetooth connection");
      add("Wi-Fi", "Wi-Fi connection");
      add("Matter", "Matter support");
    }

    if (!t.includes("app") && !t.includes("cloud") && !t.includes("ota")) {
      add("Mobile app", "Mobile app control");
      add("Cloud", "Cloud connectivity");
      add("OTA updates", "OTA software updates");
    }

    if (!t.includes("food") && !t.includes("drink") && !t.includes("beverage")) {
      add("Food contact", "Food-contact surfaces in normal use");
    }

    if (!t.includes("heating") && !t.includes("motor") && !t.includes("compressor")) {
      add("Heating element", "Contains heating element");
      add("Motorized", "Motorized function");
    }

    return options.slice(0, 8);
  }, [description]);

  const appendHint = useCallback((value) => {
    setDescription((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return value;
      if (trimmed.endsWith(".")) return `${trimmed} ${value}.`;
      return `${trimmed}. ${value}.`;
    });
  }, []);

  return (
    <div className="page-shell">
      <Style />

      <div className="nav">
        <div className="container nav__inner">
          <div className="nav__brand">
            <div className="nav__logo">RC</div>
            <div>
              <div className="nav__title">RegCheck</div>
              <div className="nav__tag">EU product compliance scope assistant</div>
            </div>
          </div>

          {result ? (
            <div className="nav__stats">
              <div className="nav-pill nav-pill--risk">Risk: {result.overall_risk || "-"}</div>
              <div className="nav-pill">Standards: {summaryStats.standards}</div>
              <div className="nav-pill">Warnings: {summaryStats.warn}</div>
              <div className="nav-pill">Fails: {summaryStats.fail}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="page container">
        <div className="hero">
          <div>
            <div className="eyebrow">Version upgrade</div>
            <h1 className="hero__title">Compliance scoping with directive-grouped standards</h1>
            <p className="hero__sub">
              Describe the product in plain language. Add power source, radio features,
              app/cloud details, materials, moving parts, and intended use.
            </p>
          </div>
        </div>

        <div className="card input-card">
          <div className="input-card__head">
            <div>
              <div className="section__title">Product description</div>
              <div className="input-card__hint">
                Include what it is, how it is powered, whether it has radio, app/cloud,
                heating, motors, food contact, sensors, and updates.
              </div>
            </div>

            <div className="input-card__controls">
              <div className="depth">
                {["quick", "standard", "deep"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`seg-btn ${depth === d ? "seg-btn--on" : ""}`}
                    onClick={() => setDepth(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <textarea
            className="ta"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: Smart air fryer with Wi-Fi app control, mains powered, OTA updates, cloud recipe sync, and food-contact basket coating."
          />

          {quickAdds.length > 0 ? (
            <div className="quick-adds">
              {quickAdds.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  className="ghost-btn"
                  onClick={() => appendHint(q.value)}
                >
                  + {q.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="input-card__foot">
            <div className="input-card__meta">
              Better input gives tighter legislation and standard mapping.
            </div>
            <div className="input-card__actions">
              <button type="button" className="ghost-btn" onClick={() => setDescription(SAMPLE)}>
                Load sample
              </button>
              <button type="button" className="ghost-btn" onClick={() => setDescription("")}>Clear</button>
              <button type="button" className="run-btn" onClick={run} disabled={loading || !description.trim()}>
                {loading ? "Analyzing..." : "Run analysis"}
              </button>
            </div>
          </div>

          {error ? <div className="err-bar">{error}</div> : null}
        </div>

        {loading ? (
          <div className="card loading__card">
            <div className="spinner" />
            <div>
              <div className="section__title">Running analysis</div>
              <div className="loading__text">Checking legislation, standards, gaps, and grouped output.</div>
            </div>
          </div>
        ) : null}

        {result ? (
          <>
            <div className="card toolbar">
              <div className="toolbar__left">
                <div className="search-wrap">
                  <input
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search standard, finding, or action"
                  />
                </div>

                <select className="select" value={filterDir} onChange={(e) => setFilterDir(e.target.value)}>
                  <option value="ALL">All directive groups</option>
                  {DIR_ORDER.filter((d) => directiveCounts[d]).map((d) => (
                    <option key={d} value={d}>
                      {DIR_NAME[d] || d} ({directiveCounts[d]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="toolbar__right">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    if (!exportPayload) return;
                    downloadJson("regcheck-analysis.json", exportPayload);
                  }}
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    if (!exportPayload) return;
                    const ok = copyText(JSON.stringify(exportPayload, null, 2));
                    if (ok) show("JSON copied");
                  }}
                >
                  Copy JSON
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setHidePassedInfo((v) => !v)}
                >
                  {hidePassedInfo ? "Show all findings" : "Hide pass/info"}
                </button>
              </div>
            </div>

            <Section
              title="Analysis summary"
              helper="High-level result from backend output"
              right={<StatusPill status={result.overall_risk === "CRITICAL" ? "FAIL" : result.overall_risk === "HIGH" || result.overall_risk === "MEDIUM" ? "WARN" : "PASS"} />}
            >
              <div className="summary-grid">
                <div className="summary-box">
                  <div className="summary-box__label">Summary</div>
                  <div className="summary-box__value summary-box__value--text">{result.summary}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box__label">Risk</div>
                  <div className="summary-box__value">{result.overall_risk}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box__label">Directives</div>
                  <div className="summary-box__value">{summaryStats.directives}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box__label">Standards</div>
                  <div className="summary-box__value">{summaryStats.standards}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box__label">Warnings</div>
                  <div className="summary-box__value">{summaryStats.warn}</div>
                </div>
                <div className="summary-box">
                  <div className="summary-box__label">Fails</div>
                  <div className="summary-box__value">{summaryStats.fail}</div>
                </div>
              </div>
            </Section>

            <Section
              title="Applicable standards"
              helper="Grouped by directive bucket. Search and filter stay applied."
              count={filteredStandardGroups.length}
            >
              <div className="group-stack">
                {DIR_ORDER.filter((d) => (standardsByDirective[d] || []).length > 0).map((d) => (
                  <div key={d} className="std-group">
                    <div className="std-group__head">
                      <DirBadge code={d} />
                      <span className="count-pill">{standardsByDirective[d].length}</span>
                    </div>
                    <div className="std-grid">
                      {standardsByDirective[d].map((item) => (
                        <StandardCard key={`${d}-${item.name}`} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Other findings"
              helper="Legislation, missing information, contradictions, and non-standard findings"
              count={nonStdFindings.length}
            >
              <div className="list-pad">
                {nonStdFindings.length ? (
                  nonStdFindings.map((f) => <FindingRow key={`${f._i}-${f.article}-${f.finding}`} f={f} />)
                ) : (
                  <div className="empty">No additional findings under current filters.</div>
                )}
              </div>
            </Section>

            {result.diagnostics?.length ? (
              <Section title="Diagnostics" helper="Backend debug markers" count={result.diagnostics.length}>
                <div className="diag-wrap">
                  {result.diagnostics.map((d, idx) => (
                    <div key={idx} className="diag-pill">{d}</div>
                  ))}
                </div>
              </Section>
            ) : null}
          </>
        ) : null}
      </div>

      {msg ? <div className="toast">{msg}</div> : null}
    </div>
  );
}

function Style() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      html, body, #root { margin: 0; min-height: 100%; }
      body {
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, #edf6fa 0%, transparent 30%),
          linear-gradient(180deg, #f5fafc 0%, #edf4f7 100%);
        color: #0d2c3b;
      }
      button, input, textarea, select { font: inherit; }
      button {
        cursor: pointer;
        border: none;
      }

      .container {
        width: 100%;
        max-width: 1320px;
        margin: 0 auto;
        padding: 0 18px;
      }

      .page-shell { min-height: 100vh; }

      .nav {
        position: sticky;
        top: 0;
        z-index: 40;
        backdrop-filter: blur(12px);
        background: rgba(245, 250, 252, 0.84);
        border-bottom: 1px solid rgba(13, 44, 59, 0.08);
      }
      .nav__inner {
        min-height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .nav__brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .nav__logo {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: linear-gradient(135deg, #0d2c3b, #13678A);
        color: #fff;
        display: grid;
        place-items: center;
        font-weight: 800;
        letter-spacing: -.03em;
      }
      .nav__title {
        font-size: 15px;
        font-weight: 800;
        letter-spacing: -.02em;
      }
      .nav__tag {
        font-size: 11px;
        color: #64808c;
      }
      .nav__stats {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .nav-pill {
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        background: #fff;
        border: 1px solid #c6d9e2;
        color: #35515e;
        display: inline-flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
      }
      .nav-pill--risk {
        background: #0d2c3b;
        color: #fff;
        border-color: #0d2c3b;
      }

      .page {
        padding: 24px 18px 48px;
      }

      .hero {
        margin-bottom: 16px;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        background: #e8f3f8;
        color: #13678A;
        border: 1px solid #b8d8e5;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .hero__title {
        margin: 10px 0 8px;
        font-size: clamp(28px, 4vw, 44px);
        line-height: 1.04;
        letter-spacing: -.04em;
      }
      .hero__sub {
        margin: 0;
        max-width: 860px;
        color: #53707d;
        line-height: 1.75;
      }

      .card {
        background: rgba(255,255,255,.92);
        border: 1px solid rgba(13,44,59,.08);
        box-shadow: 0 18px 46px rgba(13,44,59,.07);
        border-radius: 18px;
      }

      .input-card {
        overflow: hidden;
        margin-bottom: 14px;
      }
      .input-card__head {
        padding: 16px 16px 14px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid #dce9ef;
      }
      .input-card__hint {
        margin-top: 4px;
        color: #577582;
        font-size: 13px;
      }
      .input-card__controls { display: flex; align-items: center; gap: 8px; }

      .depth { display: flex; gap: 8px; }
      .seg-btn {
        padding: 7px 12px;
        border-radius: 10px;
        border: 1px solid #c6d9e2;
        background: #fff;
        color: #496673;
        font-weight: 700;
        text-transform: capitalize;
      }
      .seg-btn--on {
        background: #e8f3f8;
        border-color: #96bfd1;
        color: #0f4256;
      }

      .ta {
        display: block;
        width: 100%;
        min-height: 180px;
        padding: 18px 20px;
        border: none;
        outline: none;
        background: transparent;
        color: #0d2c3b;
        line-height: 1.85;
      }
      .ta::placeholder { color: #8daab5; }

      .quick-adds {
        padding: 0 16px 14px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .input-card__foot {
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: #f1f8fb;
        border-top: 1px solid #dce9ef;
      }
      .input-card__meta {
        font-size: 12px;
        color: #627d8a;
      }
      .input-card__actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .ghost-btn {
        padding: 8px 13px;
        border-radius: 10px;
        background: #fff;
        border: 1px solid #c6d9e2;
        color: #35515e;
        font-weight: 700;
      }
      .ghost-btn:hover {
        background: #f4fafc;
      }

      .run-btn {
        padding: 8px 16px;
        border-radius: 10px;
        font-weight: 800;
        background: linear-gradient(135deg, #0d2c3b, #13678A);
        color: #fff;
        box-shadow: 0 6px 20px rgba(19,103,138,.22);
      }
      .run-btn:disabled {
        background: #c8d8df;
        color: #7d98a4;
        box-shadow: none;
        cursor: not-allowed;
      }

      .err-bar {
        margin: 0 16px 16px;
        padding: 12px 14px;
        border-radius: 10px;
        background: #edf4f6;
        border: 1px solid #c6d9e2;
        color: #0d2c3b;
      }

      .loading__card {
        padding: 18px 20px;
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .loading__text {
        margin-top: 4px;
        color: #5b7885;
      }
      .spinner {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2.5px solid #c6d9e2;
        border-top-color: #13678A;
        animation: spin .7s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      .toolbar {
        padding: 14px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }
      .toolbar__left, .toolbar__right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .search-wrap { min-width: 320px; }
      .search-input, .select {
        height: 40px;
        border-radius: 10px;
        border: 1px solid #c6d9e2;
        background: #fff;
        color: #0d2c3b;
        padding: 0 12px;
        outline: none;
      }
      .search-input {
        width: 100%;
      }
      .search-input:focus, .select:focus {
        border-color: #96bfd1;
        box-shadow: 0 0 0 3px rgba(19,103,138,.08);
      }

      .section {
        overflow: hidden;
        margin-bottom: 14px;
      }
      .section__head {
        padding: 16px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid #dce9ef;
      }
      .section__titleWrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .section__title {
        font-size: 15px;
        font-weight: 800;
        letter-spacing: -.02em;
        color: #0d2c3b;
      }
      .section__helper {
        font-size: 12px;
        color: #627d8a;
      }

      .count-pill {
        min-width: 28px;
        padding: 4px 8px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #edf4f6;
        border: 1px solid #c6d9e2;
        color: #2a6782;
        font-size: 11px;
        font-weight: 800;
      }

      .summary-grid {
        padding: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      .summary-box {
        border: 1px solid #dce9ef;
        border-radius: 12px;
        padding: 14px;
        background: linear-gradient(180deg, #fff 0%, #f7fbfc 100%);
      }
      .summary-box__label {
        font-size: 11px;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: #64808c;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .summary-box__value {
        font-size: 24px;
        font-weight: 800;
        color: #0d2c3b;
      }
      .summary-box__value--text {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.7;
        color: #32505b;
      }

      .group-stack {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }

      .std-group__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      .dir-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        border: 1px solid var(--ring);
        background: var(--pill);
        color: var(--ink);
        padding: 7px 12px 7px 9px;
        min-height: 34px;
      }
      .dir-badge__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--dot);
        flex-shrink: 0;
      }
      .dir-badge__code {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
      }
      .dir-badge__name {
        font-size: 12px;
        font-weight: 700;
      }

      .std-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 12px;
      }

      .std-card {
        border: 1px solid var(--fborder);
        background: linear-gradient(180deg, #fff 0%, var(--fbg) 100%);
        border-radius: 14px;
        padding: 14px;
      }
      .std-card__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .std-card__name {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        line-height: 1.55;
        font-weight: 600;
        color: #0d2c3b;
      }
      .std-card__chips {
        margin-top: 10px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .std-card__finding {
        margin-top: 12px;
        color: #36515d;
        line-height: 1.75;
        font-size: 12.5px;
      }
      .std-card__actions {
        margin-top: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(255,255,255,.7);
        border: 1px solid rgba(13,44,59,.09);
      }
      .std-card__actions-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: #5a7480;
        margin-bottom: 6px;
      }
      .std-card__actions ul {
        padding-left: 18px;
      }
      .std-card__actions li {
        font-size: 12px;
        line-height: 1.65;
        color: #36515d;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--fbg);
        border: 1px solid var(--fborder);
        color: var(--ftext);
        font-size: 11px;
        font-weight: 800;
      }

      .list-pad { padding: 8px 8px 12px; }
      .frow {
        display: grid;
        grid-template-columns: 48px 1fr;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--fborder);
        background: var(--fbg);
        margin-bottom: 8px;
      }
      .frow__left {
        background: var(--fstripe);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 6px;
        padding: 12px 0;
      }
      .frow__icon {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: rgba(255,255,255,.22);
        display: grid;
        place-items: center;
        color: #fff;
        font-weight: 800;
      }
      .frow__label {
        font-size: 8px;
        color: rgba(255,255,255,.9);
        font-weight: 800;
        letter-spacing: .12em;
      }
      .frow__body {
        padding: 12px 14px;
      }
      .frow__art {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10.5px;
        color: #64808c;
        margin-bottom: 4px;
      }
      .frow__text {
        color: #24404d;
        line-height: 1.75;
      }
      .frow__action {
        margin-top: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        background: rgba(255,255,255,.68);
        border: 1px solid rgba(13,44,59,.08);
        color: #35515e;
        font-size: 12px;
      }

      .diag-wrap {
        padding: 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .diag-pill {
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid #c6d9e2;
        background: #f7fbfc;
        color: #36515d;
        font-size: 12px;
      }

      .empty {
        padding: 16px;
        color: #64808c;
      }

      .toast {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 60;
        padding: 10px 14px;
        border-radius: 10px;
        background: #0d2c3b;
        color: #fff;
        box-shadow: 0 10px 24px rgba(13,44,59,.22);
        font-size: 12.5px;
        font-weight: 700;
      }

      @media (max-width: 980px) {
        .toolbar {
          flex-direction: column;
          align-items: stretch;
        }
        .toolbar__left, .toolbar__right {
          width: 100%;
        }
        .search-wrap {
          min-width: 0;
          flex: 1;
        }
      }

      @media (max-width: 720px) {
        .container { padding: 0 14px; }
        .page { padding: 18px 14px 40px; }
        .input-card__head,
        .input-card__foot {
          flex-direction: column;
          align-items: stretch;
        }
        .input-card__actions,
        .toolbar__right,
        .toolbar__left {
          flex-direction: column;
          align-items: stretch;
        }
        .ghost-btn, .run-btn, .select, .search-input {
          width: 100%;
        }
        .nav__tag {
          display: none;
        }
      }
    `}</style>
  );
}
