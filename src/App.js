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

const INPUT_GUIDE = [
  {
    id: "product",
    label: "Product",
    hint: "What is it?",
    examples: "kettle, vacuum, air fryer, lock",
    chips: ["Smart kettle.", "Robot vacuum cleaner.", "Smart door lock."],
    patterns: [
      /\bkettle\b/i,
      /\bvacuum\b/i,
      /\bair fryer\b/i,
      /\bcoffee machine\b/i,
      /\bdoor lock\b/i,
      /\block\b/i,
      /\bcharger\b/i,
      /\bappliance\b/i,
      /\bdevice\b/i,
      /\bproduct\b/i,
      /\brobot\b/i,
      /\bcamera\b/i,
      /\bthermostat\b/i,
      /\blamp\b/i,
    ],
  },
  {
    id: "power",
    label: "Power",
    hint: "How is it powered?",
    examples: "230V, battery, USB-C, adapter",
    chips: ["Mains powered, 230V.", "Battery powered.", "USB-C charging."],
    patterns: [
      /\b230v\b/i,
      /\b240v\b/i,
      /\bmains\b/i,
      /\bbattery\b/i,
      /\busb\b/i,
      /\bcharger\b/i,
      /\badapter\b/i,
      /\bac\b/i,
      /\bdc\b/i,
    ],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    hint: "Any radio / wireless?",
    examples: "Bluetooth, Wi-Fi, Zigbee, NFC",
    chips: ["Bluetooth connection.", "Wi-Fi connection.", "Zigbee radio."],
    patterns: [
      /\bbluetooth\b/i,
      /\bwi-?fi\b/i,
      /\bzigbee\b/i,
      /\bnfc\b/i,
      /\blte\b/i,
      /\b5g\b/i,
      /\b4g\b/i,
      /\bradio\b/i,
      /\bwireless\b/i,
      /\bmatter\b/i,
      /\bthread\b/i,
    ],
  },
  {
    id: "software",
    label: "Software",
    hint: "App / cloud / updates?",
    examples: "mobile app, cloud, firmware, OTA",
    chips: ["Mobile app.", "Cloud backend.", "Firmware / OTA updates."],
    patterns: [
      /\bapp\b/i,
      /\bmobile\b/i,
      /\bcloud\b/i,
      /\bfirmware\b/i,
      /\bupdate\b/i,
      /\bota\b/i,
      /\bsoftware\b/i,
      /\bbackend\b/i,
      /\bapi\b/i,
      /\baccount\b/i,
    ],
  },
  {
    id: "data",
    label: "Data",
    hint: "Does it process data?",
    examples: "usage logs, account, location, camera",
    chips: [
      "Processes personal data.",
      "Stores usage logs.",
      "Stores user account data.",
    ],
    patterns: [
      /\bpersonal data\b/i,
      /\buser data\b/i,
      /\bprivacy\b/i,
      /\baccount\b/i,
      /\blocation\b/i,
      /\bcamera\b/i,
      /\bvoice\b/i,
      /\baudio\b/i,
      /\bvideo\b/i,
      /\blogs?\b/i,
      /\btelemetry\b/i,
    ],
  },
  {
    id: "environment",
    label: "Use",
    hint: "Where is it used?",
    examples: "household, kitchen, indoor, outdoor",
    chips: ["Household use.", "Indoor use.", "Kitchen appliance."],
    patterns: [
      /\bhousehold\b/i,
      /\bkitchen\b/i,
      /\bindoor\b/i,
      /\boutdoor\b/i,
      /\bwet\b/i,
      /\bbathroom\b/i,
      /\bconsumer\b/i,
      /\bhome\b/i,
      /\bresidential\b/i,
    ],
  },
];

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

function getGuideStatus(text = "") {
  return INPUT_GUIDE.map((item) => {
    const complete = item.patterns.some((re) => re.test(text));
    return { ...item, complete };
  });
}

function scoreInput(text = "") {
  const matches = getGuideStatus(text).filter((x) => x.complete).length;
  const total = INPUT_GUIDE.length;
  const ratio = total ? matches / total : 0;

  return {
    matches,
    total,
    ratio,
    label:
      ratio >= 0.84
        ? "Strong"
        : ratio >= 0.5
        ? "Good"
        : ratio >= 0.25
        ? "Basic"
        : "Weak",
  };
}

function buildDynamicSuggestions(text = "") {
  const status = getGuideStatus(text);
  const missing = status.filter((x) => !x.complete);
  const present = status.filter((x) => x.complete).map((x) => x.id);
  const lower = text.toLowerCase();

  const suggestions = [];

  missing.forEach((item) => {
    if (item.id === "connectivity" && /app|cloud|ota|firmware/.test(lower)) {
      suggestions.push("Wi-Fi connection.");
    } else if (
      item.id === "software" &&
      /bluetooth|wi-?fi|zigbee|matter|thread|lte|5g|radio/.test(lower)
    ) {
      suggestions.push("Mobile app.");
    } else if (
      item.id === "data" &&
      /app|cloud|account|camera|voice/.test(lower)
    ) {
      suggestions.push("Processes personal data.");
    } else if (item.id === "environment" && /kettle|vacuum|air fryer|coffee/i.test(text)) {
      suggestions.push("Household use.");
    } else {
      suggestions.push(item.chips[0]);
    }
  });

  if (present.includes("connectivity") && !present.includes("software")) {
    suggestions.unshift("Firmware / OTA updates.");
  }
  if (present.includes("software") && !present.includes("data")) {
    suggestions.unshift("Stores user account data.");
  }
  if (present.includes("power") && !present.includes("environment")) {
    suggestions.unshift("Indoor use.");
  }

  return unique(suggestions).slice(0, 5);
}

function appendSentence(base, snippet) {
  const trimmed = (base || "").trim();
  if (!trimmed) return snippet;
  const needsSpace = !/[.\n]\s*$/.test(trimmed);
  return `${trimmed}${needsSpace ? " " : "\n"}${snippet}`;
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
    taRef.current.style.height = Math.max(220, taRef.current.scrollHeight) + "px";
  }, [desc]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const ready = desc.trim().length >= 10;

  const guideStatus = useMemo(() => getGuideStatus(desc), [desc]);
  const guideDone = useMemo(
    () => guideStatus.filter((x) => x.complete).length,
    [guideStatus]
  );
  const firstMissing = useMemo(
    () => guideStatus.find((x) => !x.complete) || null,
    [guideStatus]
  );
  const inputQuality = useMemo(() => scoreInput(desc), [desc]);
  const dynamicSuggestions = useMemo(() => buildDynamicSuggestions(desc), [desc]);

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

  const appendText = useCallback((snippet) => {
    setDesc((prev) => appendSentence(prev, snippet));
  }, []);

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
          `${dirCodeLabel(dir)} (${rows.length})`,
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
              Describe the product clearly. The UI suggests the next missing details
              instead of asking everything at once.
            </p>
          </div>
        </header>

        {!result && !loading && (
          <div className="intake-layout">
            <section className="card input-card input-card--primary">
              <div className="input-card__head">
                <div className="input-card__titleWrap">
                  <h2 className="section__title">Product description</h2>
                  <p className="input-card__hint">
                    Start with product type, then add power, connectivity, software, and use.
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

              <div className="input-strip">
                <div className="input-strip__left">
                  <div className="quality-line">
                    <span className="quality-line__label">Coverage</span>
                    <div className="quality-line__track">
                      <div
                        className="quality-line__fill"
                        style={{ width: `${Math.max(8, inputQuality.ratio * 100)}%` }}
                      />
                    </div>
                    <span className="quality-line__value">
                      {guideDone}/{INPUT_GUIDE.length}
                    </span>
                  </div>

                  {firstMissing ? (
                    <div className="focus-hint">
                      <span className="focus-hint__k">Next</span>
                      <span className="focus-hint__v">
                        {firstMissing.label}: {firstMissing.hint}
                      </span>
                    </div>
                  ) : (
                    <div className="focus-hint focus-hint--done">
                      <span className="focus-hint__k">Ready</span>
                      <span className="focus-hint__v">Enough detail for a strong first pass.</span>
                    </div>
                  )}
                </div>

                <div className="input-strip__right">
                  <span className="mini-counter">{desc.length} chars</span>
                </div>
              </div>

              <div className="smart-adds">
                <div className="smart-adds__label">Suggested next details</div>
                <div className="smart-adds__chips">
                  {dynamicSuggestions.length > 0 ? (
                    dynamicSuggestions.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="prompt-chip"
                        onClick={() => appendText(chip)}
                      >
                        + {chip}
                      </button>
                    ))
                  ) : (
                    <span className="smart-adds__done">All main details covered.</span>
                  )}
                </div>
              </div>

              <div className="textarea-wrap">
                <textarea
                  ref={taRef}
                  className="ta"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={
                    "Example:\n\n" +
                    "Smart kettle. Mains powered, 230V. Bluetooth connection. Mobile app. Household kitchen use."
                  }
                />
              </div>

              <div className="input-card__foot">
                <div className="input-card__meta">
                  Keep it compact. One sentence per fact works best.
                </div>
                <div className="input-card__actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setDesc(SAMPLE)}
                  >
                    Sample
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
                    className="run-btn"
                    onClick={run}
                    disabled={!ready}
                  >
                    Analyse
                  </button>
                </div>
              </div>

              {error ? <div className="err-bar">{error}</div> : null}
            </section>

            <aside className="card rail-card">
              <div className="rail-card__head">
                <h3 className="rail-card__title">Guide</h3>
                <span className="rail-card__score">{inputQuality.label}</span>
              </div>

              <div className="guide-dots">
                {guideStatus.map((item) => (
                  <div key={item.id} className="guide-dots__row">
                    <div
                      className={
                        "guide-dot" + (item.complete ? " guide-dot--done" : "")
                      }
                    />
                    <div className="guide-dots__text">
                      <div className="guide-dots__label">{item.label}</div>
                      <div className="guide-dots__hint">{item.examples}</div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
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
                      {dirCodeLabel(d)}
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
          radial-gradient(ellipse 60% 35% at 0% 0%, rgba(19,103,138,.07) 0%, transparent 60%),
          radial-gradient(ellipse 55% 30% at 100% 100%, rgba(53,163,125,.06) 0%, transparent 60%),
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
        max-width: 70ch;
        color: #42616e;
        line-height: 1.8;
      }

      .card {
        background: rgba(255,255,255,.9);
        border: 1px solid #cfe0e8;
        border-radius: 16px;
        box-shadow: 0 2px 6px rgba(13,44,59,.04), 0 12px 32px rgba(13,44,59,.05);
        backdrop-filter: blur(8px);
      }

      .intake-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) 290px;
        gap: 16px;
        align-items: start;
      }

      .input-card--primary {
        overflow: hidden;
        border-color: #bfd7e3;
        box-shadow: 0 4px 16px rgba(13,44,59,.05), 0 16px 36px rgba(13,44,59,.07);
      }

      .input-card__head {
        padding: 18px 20px 14px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid #dce9ef;
      }
      .input-card__titleWrap {
        max-width: 72ch;
      }
      .input-card__hint {
        margin-top: 4px;
        color: #577582;
        font-size: 13px;
      }
      .input-card__controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

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

      .input-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 18px 10px;
      }
      .input-strip__left {
        min-width: 0;
        flex: 1;
      }
      .input-strip__right {
        flex-shrink: 0;
      }

      .quality-line {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 10px;
      }
      .quality-line__label,
      .quality-line__value {
        font-size: 12px;
        font-weight: 700;
        color: #5a7784;
      }
      .quality-line__track {
        height: 8px;
        border-radius: 999px;
        background: #e5eff4;
        overflow: hidden;
      }
      .quality-line__fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #13678A, #35a37d);
      }

      .focus-hint {
        margin-top: 10px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 999px;
        background: #f2f8fb;
        border: 1px solid #d8e7ee;
        color: #3f5d69;
        max-width: 100%;
      }
      .focus-hint--done {
        background: #eef8f2;
        border-color: #cfe4d8;
        color: #325345;
      }
      .focus-hint__k {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: #2a6782;
      }
      .focus-hint__v {
        font-size: 12.5px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mini-counter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 78px;
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid #d8e7ee;
        background: #fbfeff;
        color: #54707d;
        font-size: 12px;
        font-weight: 700;
      }

      .smart-adds {
        padding: 0 18px 12px;
      }
      .smart-adds__label {
        font-size: 12px;
        font-weight: 800;
        color: #5d7884;
        margin-bottom: 8px;
      }
      .smart-adds__chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .smart-adds__done {
        font-size: 12.5px;
        color: #4b6a76;
      }

      .prompt-chip {
        padding: 8px 11px;
        border-radius: 999px;
        border: 1px solid #cfe0e8;
        background: #fff;
        color: #35515e;
        font-weight: 700;
        font-size: 12.5px;
        transition: .15s ease;
      }
      .prompt-chip:hover {
        background: #f5fbfd;
        border-color: #9fc4d5;
        transform: translateY(-1px);
      }

      .textarea-wrap {
        position: relative;
        margin: 0 14px 14px;
        border: 1px solid #d7e6ed;
        border-radius: 14px;
        background:
          linear-gradient(180deg, rgba(244,250,252,0.8) 0%, rgba(255,255,255,1) 100%);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
      }
      .textarea-wrap:focus-within {
        border-color: #9cc4d4;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.7),
          0 0 0 4px rgba(19,103,138,.08);
      }

      .ta {
        display: block;
        width: 100%;
        min-height: 220px;
        padding: 18px 18px;
        border: none;
        outline: none;
        background: transparent;
        color: #0d2c3b;
        line-height: 1.85;
      }
      .ta::placeholder {
        color: #8daab5;
      }

      .input-card__foot {
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: #f6fbfd;
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
        margin: 0 14px 14px;
        padding: 12px 14px;
        border-radius: 10px;
        background: #edf4f6;
        border: 1px solid #c6d9e2;
        color: #0d2c3b;
      }

      .rail-card {
        padding: 14px;
        position: sticky;
        top: 76px;
        background: rgba(250,253,254,.92);
      }
      .rail-card__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
      }
      .rail-card__title {
        font-size: 14px;
        font-weight: 800;
        color: #0d2c3b;
      }
      .rail-card__score {
        padding: 4px 8px;
        border-radius: 999px;
        background: #eef5f8;
        border: 1px solid #d7e6ed;
        color: #476572;
        font-size: 11px;
        font-weight: 800;
      }

      .guide-dots {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .guide-dots__row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      .guide-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #d8e7ee;
        margin-top: 6px;
        flex-shrink: 0;
      }
      .guide-dot--done {
        background: #35a37d;
        box-shadow: 0 0 0 4px rgba(53,163,125,.12);
      }
      .guide-dots__label {
        font-size: 12.5px;
        font-weight: 800;
        color: #1d4353;
      }
      .guide-dots__hint {
        font-size: 12px;
        color: #688490;
        line-height: 1.55;
        margin-top: 2px;
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

      @media (max-width: 1080px) {
        .intake-layout {
          grid-template-columns: 1fr;
        }
        .rail-card {
          position: static;
          top: unset;
        }
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
        .input-card__foot,
        .input-strip {
          flex-direction: column;
          display: flex;
          align-items: stretch;
        }

        .toolbar__right,
        .toolbar__left,
        .input-card__actions {
          flex-direction: column;
          align-items: stretch;
        }

        .ghost-btn, .run-btn, .select, .search-input {
          width: 100%;
        }

        .nav__tag {
          display: none;
        }

        .quality-line {
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .focus-hint {
          display: flex;
          border-radius: 12px;
          white-space: normal;
        }

        .mini-counter {
          width: 100%;
        }
      }
    `}</style>
  );
}