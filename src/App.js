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
  CRA: "Cybersecurity",
  GDPR: "Data / Privacy",
  AI_Act: "AI Act",
  ESPR: "ESPR",
  SYSTEM: "System",
};

const DIR_ORDER = ["LVD", "EMC", "RED", "CRA", "GDPR", "AI_Act", "ESPR", "OTHER"];

const DIR = {
  LVD: { dot: "#0d2c3b", pill: "#d8e8ef", ring: "#9fc0cf", ink: "#0d2c3b" },
  EMC: { dot: "#13678A", pill: "#d8edf5", ring: "#8bbfd4", ink: "#0b4258" },
  RED: { dot: "#1f3c88", pill: "#dbe5ff", ring: "#a7bbe9", ink: "#1f3c88" },
  CRA: { dot: "#1c7c54", pill: "#daf3e5", ring: "#9ed1b5", ink: "#13533a" },
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
    /60335|60730|62233|60335-1|60335-2|household|appliance safety|safety of household/i.test(
      text
    )
  ) {
    return "LVD";
  }

  if (
    /55014|61000|emc|electromagnetic|cisp?r|harmonic|flicker|electrostatic|surge|immunity/i.test(
      t
    )
  ) {
    return "EMC";
  }

  if (
    /300 328|301 489|300 220|300 330|300 440|300 086|300 113|radio|rf|wireless|bluetooth|wifi|wi-fi|lte|5g|zigbee|matter|nfc/i.test(
      t
    )
  ) {
    return "RED";
  }

  if (
    /18031|cyber|cybersecurity|cra|secure update|vulnerability|authentication|software bill|sbom|access control|en 303 645/i.test(
      t
    )
  ) {
    return "CRA";
  }

  if (/gdpr|privacy|personal data|data protection/i.test(t)) {
    return "GDPR";
  }

  if (/ai act|artificial intelligence|machine learning|model/i.test(t)) {
    return "AI_Act";
  }

  if (/ecodesign|espr|repairability|durability|energy/i.test(t)) {
    return "ESPR";
  }

  return "OTHER";
}

function enrichDirectives(f) {
  const explicit = getDirectiveListFromFinding(f).filter((d) => d !== "SYSTEM");
  if (explicit.length) return explicit;

  const inferred = inferDirectiveFromText(
    [f.article, f.finding, f.action].filter(Boolean).join(" ")
  );

  return inferred ? [inferred] : ["OTHER"];
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
      <span className="dir-badge__code">{code === "RED" ? "RF" : code}</span>
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

function Section({ title, count, children, right }) {
  return (
    <section className="card section">
      <div className="section__head">
        <div className="section__titleWrap">
          <h2 className="section__title">{title}</h2>
          {typeof count === "number" ? (
            <span className="count-pill">{count}</span>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function App() {
  const [desc, setDesc] = useState("");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedDir, setSelectedDir] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
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
    const t = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const ready = desc.trim().length >= 10;

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
      const text = [
        s.name,
        s.directives.join(" "),
        s.actions.join(" "),
        s.findings.map((f) => [f.finding, f.action].join(" ")).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = !q || text.includes(q);
      const matchDir =
        selectedDir === "ALL" || s.directives.includes(selectedDir);
      const matchStatus =
        statusFilter === "ALL" || topStatus === statusFilter;

      return matchSearch && matchDir && matchStatus;
    });
  }, [standards, search, selectedDir, statusFilter]);

  const standardsByDirective = useMemo(() => {
    const map = new Map();

    DIR_ORDER.forEach((d) => map.set(d, []));

    standardsFiltered.forEach((s) => {
      const dirs = s.directives.length ? s.directives : ["OTHER"];
      const firstKnown =
        dirs.find((d) => DIR_ORDER.includes(d) && d !== "OTHER") ||
        dirs[0] ||
        "OTHER";
      const bucket = DIR_ORDER.includes(firstKnown) ? firstKnown : "OTHER";
      map.get(bucket).push(s);
    });

    return map;
  }, [standardsFiltered]);

  const availableDirs = useMemo(() => {
    const found = new Set();
    standards.forEach((s) => s.directives.forEach((d) => found.add(d)));
    return DIR_ORDER.filter((d) => found.has(d) && d !== "OTHER").concat(
      found.has("OTHER") ? ["OTHER"] : []
    );
  }, [standards]);

  const copyStandards = () => {
    copyText(standardsFiltered.map((s) => s.name).join("\n"));
    setToast("Standards copied");
  };

  const copySummary = () => {
    const txt = [
      `Product: ${desc.trim()}`,
      `Standards found: ${standards.length}`,
      ...DIR_ORDER.flatMap((dir) => {
        const rows = standardsByDirective.get(dir) || [];
        if (!rows.length) return [];
        return [
          "",
          `${dir === "RED" ? "RF" : dir} (${rows.length})`,
          ...rows.map((r) => `- ${r.name}`),
        ];
      }),
    ].join("\n");
    copyText(txt);
    setToast("Summary copied");
  };

  const exportJson = () => {
    if (!result) return;
    downloadJson("rulegrid-analysis.json", result);
    setToast("JSON exported");
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
    setSearch("");
    setSelectedDir("ALL");
    setStatusFilter("ALL");
  }, []);

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
              Describe the product and review the standards grouped by LVD, EMC,
              RF, Cybersecurity, and the rest.
            </p>
          </div>
        </header>

        {!result && !loading && (
          <div className="card input-card">
            <div className="input-card__head">
              <div>
                <h2 className="section__title">Product description</h2>
                <p className="input-card__hint">
                  Keep it short: product type, connectivity, power, app/cloud.
                </p>
              </div>
              <div className="input-card__controls">
                <div className="depth">
                  {["standard", "deep"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={"seg-btn" + (depth === v ? " seg-btn--on" : "")}
                      onClick={() => setDepth(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <textarea
              ref={taRef}
              className="ta"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={"Example:\n\n" + SAMPLE}
            />

            <div className="input-card__foot">
              <div className="input-card__meta">{desc.length} chars</div>
              <div className="input-card__actions">
                <button type="button" className="ghost-btn" onClick={() => setDesc(SAMPLE)}>
                  Sample
                </button>
                <button type="button" className="ghost-btn" onClick={() => setDesc("")}>
                  Clear
                </button>
                <button
                  type="button"
                  className="run-btn"
                  onClick={run}
                  disabled={!ready}
                >
                  Analyse
                </button>
              </div>
            </div>

            {error ? <div className="err-bar">{error}</div> : null}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="card loading__card">
              <span className="spinner" />
              <div>
                <div className="section__title">Analysing</div>
                <p className="loading__text">
                  Building the standards view and grouping by directive family.
                </p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <>
            <div className="toolbar card">
              <div className="toolbar__left">
                <div className="search-wrap">
                  <input
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search standards, notes, actions..."
                  />
                </div>

                <select
                  className="select"
                  value={selectedDir}
                  onChange={(e) => setSelectedDir(e.target.value)}
                >
                  <option value="ALL">All buckets</option>
                  {availableDirs.map((d) => (
                    <option key={d} value={d}>
                      {d === "RED" ? "RF" : d}
                    </option>
                  ))}
                </select>

                <select
                  className="select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All statuses</option>
                  <option value="FAIL">FAIL</option>
                  <option value="WARN">WARN</option>
                  <option value="PASS">PASS</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>

              <div className="toolbar__right">
                <button type="button" className="ghost-btn" onClick={copySummary}>
                  Copy summary
                </button>
                <button type="button" className="ghost-btn" onClick={copyStandards}>
                  Copy standards
                </button>
                <button type="button" className="ghost-btn" onClick={exportJson}>
                  Export JSON
                </button>
                <button type="button" className="ghost-btn" onClick={reset}>
                  Edit
                </button>
              </div>
            </div>

            <Section
              title="Standards"
              count={standardsFiltered.length}
              right={<div className="section__helper">Primary review view</div>}
            >
              <div className="group-stack">
                {DIR_ORDER.map((dir) => {
                  const rows = standardsByDirective.get(dir) || [];
                  if (!rows.length) return null;

                  return (
                    <div key={dir} className="std-group">
                      <div className="std-group__head">
                        <div className="std-group__title">
                          <DirBadge code={dir} />
                        </div>
                        <span className="count-pill">{rows.length}</span>
                      </div>

                      <div className="std-grid">
                        {rows.map((item) => (
                          <StandardCard key={dir + item.name} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {sections?.missing?.length > 0 && (
              <Section title="Missing information" count={sections.missing.length}>
                <div className="list-pad">
                  {sections.missing.map((f) => (
                    <FindingRow key={f._i} f={f} />
                  ))}
                </div>
              </Section>
            )}

            {sections?.contra?.length > 0 && (
              <Section title="Contradictions" count={sections.contra.length}>
                <div className="list-pad">
                  {sections.contra.map((f) => (
                    <FindingRow key={f._i} f={f} />
                  ))}
                </div>
              </Section>
            )}

            {sections?.other?.length > 0 && (
              <Section title="Other findings" count={sections.other.length}>
                <div className="list-pad">
                  {sections.other.map((f) => (
                    <FindingRow key={f._i} f={f} />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </main>

      {toast ? <div className="toast">{toast}</div> : null}
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

      .nav {
        position: sticky;
        top: 0;
        z-index: 40;
        background: rgba(13,44,59,.94);
        border-bottom: 1px solid rgba(255,255,255,.08);
        backdrop-filter: blur(12px);
      }
      .nav__inner {
        height: 58px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .nav__brand { display: flex; align-items: center; gap: 10px; }
      .nav__logo {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #13678A, #35a37d);
        color: #fff;
        font-size: 12px;
        font-weight: 800;
      }
      .nav__name {
        color: #eff8fb;
        font-weight: 800;
        letter-spacing: -.02em;
      }
      .nav__tag {
        font-size: 11px;
        color: #cbe2ea;
        padding: 5px 10px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.10);
      }

      .page { padding: 28px 22px 52px; }

      .hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 18px;
      }
      .hero__eyebrow {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .12em;
        text-transform: uppercase;
        color: #2a6782;
        margin-bottom: 8px;
      }
      .hero__title {
        font-size: clamp(24px, 3vw, 36px);
        line-height: 1.08;
        letter-spacing: -.04em;
        font-weight: 800;
        color: #0d2c3b;
      }
      .hero__sub {
        margin-top: 12px;
        max-width: 62ch;
        color: #42616e;
        line-height: 1.8;
      }

      .card {
        background: rgba(255,255,255,.88);
        border: 1px solid #cfe0e8;
        border-radius: 16px;
        box-shadow: 0 2px 6px rgba(13,44,59,.04), 0 12px 32px rgba(13,44,59,.05);
        backdrop-filter: blur(8px);
      }

      .input-card { overflow: hidden; }
      .input-card__head {
        padding: 18px 20px 14px;
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