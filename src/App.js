import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

const SAMPLE =
  "Smart air fryer with Wi-Fi app control, mains powered, OTA updates, cloud recipe sync, and food-contact basket coating.";

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
  LVD: { dot: "#0f172a", pill: "#eef2ff", ring: "#c7d2fe", ink: "#312e81" },
  EMC: { dot: "#0f766e", pill: "#ecfeff", ring: "#a5f3fc", ink: "#155e75" },
  RED: { dot: "#1d4ed8", pill: "#eff6ff", ring: "#bfdbfe", ink: "#1e40af" },
  RED_CYBER: { dot: "#6d28d9", pill: "#f5f3ff", ring: "#ddd6fe", ink: "#5b21b6" },
  CRA: { dot: "#166534", pill: "#f0fdf4", ring: "#bbf7d0", ink: "#166534" },
  ROHS: { dot: "#4d7c0f", pill: "#f7fee7", ring: "#d9f99d", ink: "#3f6212" },
  REACH: { dot: "#b45309", pill: "#fff7ed", ring: "#fed7aa", ink: "#9a3412" },
  GDPR: { dot: "#0f766e", pill: "#f0fdfa", ring: "#99f6e4", ink: "#115e59" },
  AI_Act: { dot: "#7c3aed", pill: "#faf5ff", ring: "#e9d5ff", ink: "#6b21a8" },
  ESPR: { dot: "#a16207", pill: "#fefce8", ring: "#fde68a", ink: "#854d0e" },
  OTHER: { dot: "#475569", pill: "#f8fafc", ring: "#cbd5e1", ink: "#334155" },
  SYSTEM: { dot: "#475569", pill: "#f8fafc", ring: "#cbd5e1", ink: "#334155" },
};

const STS = {
  FAIL: {
    icon: "×",
    label: "FAIL",
    bg: "#fef2f2",
    border: "#fecaca",
    text: "#991b1b",
    stripe: "#dc2626",
  },
  WARN: {
    icon: "!",
    label: "WARN",
    bg: "#fffbeb",
    border: "#fde68a",
    text: "#92400e",
    stripe: "#f59e0b",
  },
  PASS: {
    icon: "✓",
    label: "PASS",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: "#166534",
    stripe: "#22c55e",
  },
  INFO: {
    icon: "i",
    label: "INFO",
    bg: "#f8fafc",
    border: "#cbd5e1",
    text: "#334155",
    stripe: "#64748b",
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
  if (/60335|60730|62233|60335-1|60335-2|household|appliance safety|electrical safety/.test(t)) {
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

function DirBadge({ code, compact = false }) {
  const d = DIR[code] || DIR.OTHER;
  return (
    <span
      className={`dir-badge ${compact ? "dir-badge--compact" : ""}`}
      style={{
        "--dot": d.dot,
        "--pill": d.pill,
        "--ring": d.ring,
        "--ink": d.ink,
      }}
    >
      <span className="dir-badge__dot" />
      <span className="dir-badge__code">{dirCodeLabel(code)}</span>
      {!compact ? <span className="dir-badge__name">{DIR_NAME[code] || code}</span> : null}
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
        <div>
          <div className="std-card__eyebrow">STANDARD</div>
          <div className="std-card__name">{item.name}</div>
        </div>
        <StatusPill status={mainStatus} />
      </div>

      <div className="std-card__chips">
        {item.directives.map((d) => (
          <DirBadge key={d} code={d} compact />
        ))}
      </div>

      {item.findings?.[0]?.finding ? (
        <div className="std-card__finding">{item.findings[0].finding}</div>
      ) : null}

      {item.actions.length > 0 ? (
        <div className="std-card__actions">
          <div className="std-card__actions-title">Suggested action</div>
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
      </div>
      <div className="frow__body">
        <div className="frow__topline">
          <span className="frow__art">{f.article || ""}</span>
          <StatusPill status={f.status} />
        </div>
        <div className="frow__text">{f.finding}</div>
        {f.action ? <div className="frow__action">{f.action}</div> : null}
      </div>
    </div>
  );
}

function Section({ title, helper, count, right, children }) {
  return (
    <section className="card section">
      <div className="section__head">
        <div>
          <div className="section__titleRow">
            <div className="section__title">{title}</div>
            {typeof count === "number" ? <span className="count-pill">{count}</span> : null}
          </div>
          {helper ? <div className="section__helper">{helper}</div> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function ProductTypePicker({ onPick }) {
  const types = [
    { label: "Air fryer", value: "Air fryer" },
    { label: "Kettle", value: "Kettle" },
    { label: "Coffee machine", value: "Coffee machine" },
    { label: "Vacuum cleaner", value: "Vacuum cleaner" },
    { label: "Blender", value: "Blender" },
    { label: "Hair dryer", value: "Hair dryer" },
    { label: "Heater", value: "Portable heater" },
    { label: "Fan", value: "Electric fan" },
  ];

  return (
    <div className="type-picker">
      {types.map((item) => (
        <button
          key={item.label}
          type="button"
          className="type-chip"
          onClick={() => onPick(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ onLoadSample, onPickType }) {
  return (
    <div className="card empty-state empty-state--v3">
      <div className="empty-state__orb" />
      <div className="empty-state__eyebrow">Version 3</div>
      <h2 className="empty-state__title">Start with the product type</h2>
      <p className="empty-state__text">
        Pick the closest product first. Then add power, connectivity, materials,
        software, or moving-part details only when relevant.
      </p>
      <ProductTypePicker onPick={onPickType} />
      <div className="empty-state__row">
        <button type="button" className="ghost-btn" onClick={onLoadSample}>
          Load sample
        </button>
      </div>
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

function detectProductType(text = "") {
  const t = text.toLowerCase();
  const rules = [
    { type: "air_fryer", re: /air fryer/ },
    { type: "kettle", re: /kettle/ },
    { type: "coffee_machine", re: /coffee|espresso|bean to cup|filter coffee/ },
    { type: "vacuum", re: /vacuum|robot vacuum|stick vacuum/ },
    { type: "blender", re: /blender|mixer|food processor/ },
    { type: "hair_dryer", re: /hair dryer|hairdryer/ },
    { type: "heater", re: /heater|radiator/ },
    { type: "fan", re: /fan|air circulator/ },
  ];
  return rules.find((r) => r.re.test(t))?.type || null;
}

function hasAny(text = "", words = []) {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w));
}

function buildGuidedQuickAdds(description = "") {
  const t = description.toLowerCase().trim();
  const productType = detectProductType(t);
  const quick = [];

  const add = (label, value, stage = "detail") => {
    if (!t.includes(value.toLowerCase())) {
      quick.push({ label, value, stage });
    }
  };

  const productChoices = [
    { label: "Air fryer", value: "Air fryer", stage: "product" },
    { label: "Kettle", value: "Kettle", stage: "product" },
    { label: "Coffee machine", value: "Coffee machine", stage: "product" },
    { label: "Vacuum cleaner", value: "Vacuum cleaner", stage: "product" },
    { label: "Blender", value: "Blender", stage: "product" },
    { label: "Hair dryer", value: "Hair dryer", stage: "product" },
  ];

  if (!t || !productType) {
    return {
      productType,
      primary: productChoices,
      secondary: [],
    };
  }

  if (!hasAny(t, ["mains", "battery", "usb", "230v", "220v"])) {
    add("Mains powered", "Mains powered, 230V");
    add("Battery powered", "Battery powered");
    add("USB powered", "USB powered");
  }

  if (!hasAny(t, ["wifi", "wi-fi", "bluetooth", "zigbee", "thread", "matter", "nfc"])) {
    add("Wi-Fi", "Wi-Fi connection");
    add("Bluetooth", "Bluetooth connection");
    add("Matter", "Matter support");
  }

  if (!hasAny(t, ["app", "cloud", "ota", "account", "login"])) {
    add("App control", "Mobile app control");
    add("Cloud", "Cloud connectivity");
    add("OTA updates", "OTA software updates");
  }

  if (productType === "air_fryer") {
    if (!hasAny(t, ["food", "basket", "coating"])) add("Food contact", "Food-contact basket and internal surfaces");
    if (!hasAny(t, ["heating", "heater", "element"])) add("Heating element", "Contains heating element");
    if (!hasAny(t, ["timer", "display"])) add("Display / timer", "Electronic display and timer control");
  }

  if (productType === "kettle") {
    if (!hasAny(t, ["food", "water path", "beverage"])) add("Water contact", "Food-contact water path materials");
    if (!hasAny(t, ["heating", "heater", "element"])) add("Heating element", "Contains heating element");
    if (!hasAny(t, ["base", "cordless"])) add("Cordless base", "Cordless kettle with separate power base");
  }

  if (productType === "coffee_machine") {
    if (!hasAny(t, ["water", "milk", "coffee path", "food"])) add("Food contact path", "Food-contact water, coffee, and milk path materials");
    if (!hasAny(t, ["pump", "pressure"])) add("Pump / pressure", "Contains pump and pressurized fluid path");
    if (!hasAny(t, ["cleaning", "descale"])) add("Cleaning cycle", "Automatic cleaning and descaling functions");
  }

  if (productType === "vacuum") {
    if (!hasAny(t, ["motor", "suction"])) add("Motorized suction", "Motorized suction function");
    if (!hasAny(t, ["battery", "charger", "dock"])) add("Charging system", "Battery charging dock or charger");
    if (!hasAny(t, ["app", "mapping", "camera", "lidar"])) add("Navigation", "App-connected mapping or navigation sensors");
  }

  if (productType === "blender") {
    if (!hasAny(t, ["food", "jar", "blade"])) add("Food contact", "Food-contact jar, lid, seals, and blade area");
    if (!hasAny(t, ["motor", "blade"])) add("Motor and blades", "High-speed motorized blade system");
    if (!hasAny(t, ["safety lock", "interlock"])) add("Safety interlock", "Lid or jar safety interlock");
  }

  if (productType === "hair_dryer") {
    if (!hasAny(t, ["heating", "heater", "element"])) add("Heating element", "Contains heating element");
    if (!hasAny(t, ["fan", "motor"])) add("Fan motor", "Contains internal fan motor");
    if (!hasAny(t, ["ion", "ionic"])) add("Ionic function", "Ionic hair care function");
  }

  if (productType === "heater") {
    if (!hasAny(t, ["heating", "heater", "element"])) add("Heating element", "Contains heating element");
    if (!hasAny(t, ["thermostat", "temperature"])) add("Thermostat", "Electronic thermostat control");
    if (!hasAny(t, ["tip-over", "overheat"])) add("Protective safety", "Tip-over and overheat protection");
  }

  if (productType === "fan") {
    if (!hasAny(t, ["motor"])) add("Motorized", "Motorized fan function");
    if (!hasAny(t, ["remote", "wifi", "app"])) add("Remote control", "Remote or app control");
    if (!hasAny(t, ["oscillation", "guard"])) add("Oscillation / guard", "Oscillation function and protective guard");
  }

  return {
    productType,
    primary: quick.slice(0, 4),
    secondary: quick.slice(4, 9),
  };
}

export default function App() {
  const [description, setDescription] = useState("");
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

  const guidedAdds = useMemo(() => buildGuidedQuickAdds(description), [description]);

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

      <div className="bg-grid" />
      <header className="topbar">
        <div className="container topbar__inner">
          <div className="brand">
            <div className="brand__mark">RC</div>
            <div>
              <div className="brand__title">RegCheck</div>
              <div className="brand__sub">Modern compliance scoping workspace</div>
            </div>
          </div>

          <div className="topbar__meta">
            <span className="meta-chip">Version 3</span>
            {result ? <span className="meta-chip">Risk {result.overall_risk}</span> : null}
            {result ? <span className="meta-chip">{summaryStats.standards} standards</span> : null}
          </div>
        </div>
      </header>

      <main className="container page">
        <section className="hero-v2">
          <div className="hero-v2__content">
            <div className="hero-v2__eyebrow">CE / DoC preparation support</div>
            <h1 className="hero-v2__title">Guided EU compliance screening</h1>
            <p className="hero-v2__text">
              Start with the product type first. Then add only the follow-up details that matter
              for legislation and standard scoping.
            </p>
          </div>
        </section>

        <section className="card composer">
          <div className="composer__top">
            <div>
              <div className="composer__label">Describe the product</div>
              <div className="composer__sub">
                The more concrete the description, the more complete the legislation and standard scope.
              </div>
            </div>
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

          <div className="composer__textareaWrap">
            <textarea
              className="ta ta--v2 ta--v3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Start with product type. Example: Air fryer"
            />
            {!description.trim() ? (
              <div className="ghost-guide ghost-guide--v3">
                <span>Start: Air fryer</span>
                <span>Then: mains powered</span>
                <span>Then: Wi-Fi or Bluetooth</span>
                <span>Then: app / cloud / OTA</span>
              </div>
            ) : null}
          </div>

          <div className="assist-panel">
            <div className="assist-panel__block">
              <div className="assist-panel__title">
                {guidedAdds.productType ? "Suggested next details" : "Choose product type"}
              </div>
              <div className="assist-panel__chips">
                {guidedAdds.primary.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    className={`hint-chip ${q.stage === "product" ? "hint-chip--primary" : ""}`}
                    onClick={() => appendHint(q.value)}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {guidedAdds.secondary.length > 0 ? (
              <div className="assist-panel__block assist-panel__block--soft">
                <div className="assist-panel__title">More related details</div>
                <div className="assist-panel__chips">
                  {guidedAdds.secondary.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      className="hint-chip hint-chip--soft"
                      onClick={() => appendHint(q.value)}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="composer__bottom">
            <div className="composer__helper">Pick product type first, then enrich only the relevant details.</div>
            <div className="composer__actions">
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
        </section>

        {!result && !loading ? (
          <EmptyState
            onLoadSample={() => setDescription(SAMPLE)}
            onPickType={(value) => setDescription(value)}
          />
        ) : null}

        {loading ? (
          <div className="card loading__card">
            <div className="spinner" />
            <div>
              <div className="section__title">Running analysis</div>
              <div className="loading__text">Checking legislation, standards, missing information, and grouped output.</div>
            </div>
          </div>
        ) : null}

        {result ? (
          <>
            <div className="toolbar toolbar--v2 card">
              <div className="toolbar__left">
                <div className="search-wrap">
                  <input
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search standards, findings, actions"
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
                <button type="button" className="ghost-btn" onClick={() => setHidePassedInfo((v) => !v)}>
                  {hidePassedInfo ? "Show all findings" : "Hide pass/info"}
                </button>
              </div>
            </div>

            <Section
              title="Summary"
              helper="Top-level backend result"
              right={<StatusPill status={result.overall_risk === "CRITICAL" ? "FAIL" : result.overall_risk === "HIGH" || result.overall_risk === "MEDIUM" ? "WARN" : "PASS"} />}
            >
              <div className="summary-grid summary-grid--v2">
                <div className="summary-box summary-box--feature">
                  <div className="summary-box__label">Analysis summary</div>
                  <div className="summary-box__value summary-box__value--text">{result.summary}</div>
                </div>
                <div className="summary-box"><div className="summary-box__label">Risk</div><div className="summary-box__value">{result.overall_risk}</div></div>
                <div className="summary-box"><div className="summary-box__label">Directive buckets</div><div className="summary-box__value">{summaryStats.directives}</div></div>
                <div className="summary-box"><div className="summary-box__label">Standards</div><div className="summary-box__value">{summaryStats.standards}</div></div>
                <div className="summary-box"><div className="summary-box__label">Warnings</div><div className="summary-box__value">{summaryStats.warn}</div></div>
                <div className="summary-box"><div className="summary-box__label">Fails</div><div className="summary-box__value">{summaryStats.fail}</div></div>
              </div>
            </Section>

            <Section
              title="Applicable standards"
              helper="Grouped by legislation bucket"
              count={filteredStandardGroups.length}
            >
              <div className="group-stack group-stack--v2">
                {DIR_ORDER.filter((d) => (standardsByDirective[d] || []).length > 0).map((d) => (
                  <div key={d} className="std-group std-group--v2">
                    <div className="std-group__head std-group__head--v2">
                      <div className="std-group__titleWrap">
                        <DirBadge code={d} />
                        <div className="std-group__subtitle">{DIR_NAME[d] || d}</div>
                      </div>
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
              helper="Missing information, contradictions, legislation notes, and non-standard findings"
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
      </main>

      {msg ? <div className="toast">{msg}</div> : null}
    </div>
  );
}

function Style() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      html, body, #root { margin: 0; min-height: 100%; }
      :root {
        --bg: #f8fafc;
        --bg2: #eef2ff;
        --card: rgba(255,255,255,0.84);
        --line: rgba(15,23,42,0.08);
        --ink: #0f172a;
        --muted: #64748b;
        --muted-2: #94a3b8;
        --shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
        --shadow-soft: 0 8px 24px rgba(15, 23, 42, 0.05);
        --accent: #2563eb;
      }
      body {
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(59,130,246,.12), transparent 26%),
          radial-gradient(circle at top right, rgba(139,92,246,.10), transparent 22%),
          linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        color: var(--ink);
      }
      button, input, textarea, select { font: inherit; }
      button { cursor: pointer; border: none; }

      .bg-grid {
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,.08) 1px, transparent 1px);
        background-size: 32px 32px;
        mask-image: linear-gradient(180deg, rgba(0,0,0,.55), transparent 80%);
      }

      .container {
        width: 100%;
        max-width: 1360px;
        margin: 0 auto;
        padding: 0 20px;
      }
      .page-shell { min-height: 100vh; position: relative; }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 40;
        backdrop-filter: blur(18px);
        background: rgba(248,250,252,.72);
        border-bottom: 1px solid var(--line);
      }
      .topbar__inner {
        min-height: 74px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .brand { display: flex; align-items: center; gap: 14px; }
      .brand__mark {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: linear-gradient(135deg, #111827, #2563eb 68%, #7c3aed);
        color: white;
        display: grid;
        place-items: center;
        font-weight: 800;
        letter-spacing: -.03em;
        box-shadow: 0 10px 28px rgba(37,99,235,.22);
      }
      .brand__title { font-size: 16px; font-weight: 800; letter-spacing: -.02em; }
      .brand__sub { font-size: 12px; color: var(--muted); }
      .topbar__meta { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
      .meta-chip {
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.75);
        border: 1px solid var(--line);
        color: #334155;
        display: inline-flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
      }

      .page { padding: 28px 20px 52px; position: relative; z-index: 1; }

      .hero-v2 {
        padding: 12px 0 18px;
      }
      .hero-v2__eyebrow {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid #dbeafe;
        background: rgba(239,246,255,.88);
        color: #1d4ed8;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .09em;
        text-transform: uppercase;
      }
      .hero-v2__title {
        margin: 14px 0 10px;
        font-size: clamp(32px, 4vw, 52px);
        line-height: 1.02;
        letter-spacing: -.05em;
        max-width: 900px;
      }
      .hero-v2__text {
        margin: 0;
        max-width: 760px;
        color: var(--muted);
        line-height: 1.8;
        font-size: 15px;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--line);
        box-shadow: var(--shadow);
        border-radius: 24px;
        backdrop-filter: blur(18px);
      }

      .composer {
        overflow: hidden;
        margin-bottom: 18px;
      }
      .composer__top {
        padding: 20px 22px 14px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .composer__label {
        font-size: 15px;
        font-weight: 800;
        letter-spacing: -.02em;
      }
      .composer__sub {
        margin-top: 5px;
        color: var(--muted);
        font-size: 13px;
      }

      .depth { display: flex; gap: 8px; flex-wrap: wrap; }
      .seg-btn {
        padding: 9px 14px;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: rgba(255,255,255,.76);
        color: #475569;
        font-weight: 700;
        text-transform: capitalize;
        transition: .16s ease;
      }
      .seg-btn:hover { transform: translateY(-1px); }
      .seg-btn--on {
        background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
        border-color: #bfdbfe;
        color: #1d4ed8;
      }

      .composer__textareaWrap {
        position: relative;
        padding: 0 22px;
      }
      .ta {
        display: block;
        width: 100%;
        border: none;
        outline: none;
        resize: vertical;
        background: transparent;
        color: var(--ink);
      }
      .ta--v2 {
        min-height: 170px;
        border-radius: 20px;
        border: 1px solid rgba(148,163,184,.20);
        background:
          linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(248,250,252,.92) 100%);
        padding: 24px 22px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
        line-height: 1.9;
        font-size: 15px;
      }
      .ta--v2:focus {
        border-color: #bfdbfe;
        box-shadow: 0 0 0 4px rgba(59,130,246,.08), inset 0 1px 0 rgba(255,255,255,.7);
      }
      .ta--v2::placeholder {
        color: #94a3b8;
      }

      .ghost-guide {
        position: absolute;
        left: 40px;
        bottom: 18px;
        right: 40px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        pointer-events: none;
      }
      .ghost-guide span {
        padding: 8px 10px;
        border-radius: 999px;
        background: rgba(255,255,255,.72);
        border: 1px dashed rgba(148,163,184,.35);
        color: #94a3b8;
        font-size: 12px;
        font-weight: 600;
      }

      .quick-adds--v2 {
        padding: 14px 22px 0;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .hint-chip {
        padding: 9px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.84);
        border: 1px solid rgba(148,163,184,.22);
        color: #334155;
        font-weight: 700;
        transition: .16s ease;
      }
      .hint-chip:hover {
        transform: translateY(-1px);
        border-color: #bfdbfe;
        color: #1d4ed8;
      }

      .composer__bottom {
        padding: 18px 22px 22px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }
      .composer__helper { color: var(--muted); font-size: 12.5px; }
      .composer__actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .ghost-btn {
        padding: 10px 14px;
        border-radius: 12px;
        background: rgba(255,255,255,.82);
        border: 1px solid rgba(148,163,184,.22);
        color: #334155;
        font-weight: 700;
        transition: .16s ease;
      }
      .ghost-btn:hover {
        transform: translateY(-1px);
        background: white;
      }
      .run-btn {
        padding: 10px 16px;
        border-radius: 12px;
        font-weight: 800;
        background: linear-gradient(135deg, #111827, #2563eb 68%, #7c3aed);
        color: #fff;
        box-shadow: 0 12px 30px rgba(37,99,235,.25);
      }
      .run-btn:disabled {
        background: #cbd5e1;
        color: #64748b;
        box-shadow: none;
        cursor: not-allowed;
      }
      .err-bar {
        margin: 0 22px 22px;
        padding: 12px 14px;
        border-radius: 14px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #991b1b;
      }

      .empty-state {
        position: relative;
        overflow: hidden;
        padding: 34px 24px;
        text-align: center;
        margin-bottom: 18px;
      }
      .empty-state--v3 {
        padding: 30px 22px;
      }
      .empty-state__row {
        margin-top: 16px;
        display: flex;
        justify-content: center;
      }
      .type-picker {
        position: relative;
        z-index: 1;
        margin: 18px auto 6px;
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
        max-width: 760px;
      }
      .type-chip {
        padding: 11px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,.88);
        border: 1px solid rgba(148,163,184,.24);
        color: #1e293b;
        font-weight: 700;
        transition: .16s ease;
      }
      .type-chip:hover {
        transform: translateY(-1px);
        border-color: #bfdbfe;
        color: #1d4ed8;
      }

      .assist-panel {
        padding: 12px 22px 0;
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }
      .assist-panel__block {
        border: 1px solid rgba(148,163,184,.16);
        border-radius: 16px;
        background: rgba(255,255,255,.58);
        padding: 12px 12px 10px;
      }
      .assist-panel__block--soft {
        background: rgba(248,250,252,.72);
      }
      .assist-panel__title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 10px;
      }
      .assist-panel__chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .hint-chip--primary {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #1d4ed8;
      }
      .hint-chip--soft {
        background: rgba(255,255,255,.7);
      }

      .ta--v3 {
        min-height: 148px;
      }
      .ghost-guide--v3 {
        gap: 6px;
      }
      .ghost-guide--v3 span {
        font-size: 11.5px;
        padding: 7px 9px;
      }

      .loading__card {
        padding: 22px;
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 18px;
      }
      .spinner {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid #dbeafe;
        border-top-color: #2563eb;
        animation: spin .75s linear infinite;
      }
      .loading__text { margin-top: 4px; color: var(--muted); }
      @keyframes spin { to { transform: rotate(360deg); } }

      .toolbar--v2 {
        padding: 14px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
        flex-wrap: wrap;
      }
      .toolbar__left, .toolbar__right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .search-wrap { min-width: 340px; }
      .search-input, .select {
        height: 42px;
        border-radius: 12px;
        border: 1px solid rgba(148,163,184,.24);
        background: rgba(255,255,255,.86);
        color: var(--ink);
        padding: 0 14px;
        outline: none;
      }
      .search-input { width: 100%; }
      .search-input:focus, .select:focus {
        border-color: #bfdbfe;
        box-shadow: 0 0 0 4px rgba(59,130,246,.08);
      }

      .section {
        overflow: hidden;
        margin-bottom: 18px;
      }
      .section__head {
        padding: 18px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border-bottom: 1px solid var(--line);
      }
      .section__titleRow {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      .section__title {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: -.02em;
      }
      .section__helper {
        margin-top: 6px;
        color: var(--muted);
        font-size: 12.5px;
      }
      .count-pill {
        min-width: 28px;
        padding: 4px 9px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,.8);
        border: 1px solid rgba(148,163,184,.22);
        color: #334155;
        font-size: 11px;
        font-weight: 800;
      }

      .summary-grid {
        padding: 18px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 12px;
      }
      .summary-grid--v2 {
        grid-template-columns: 1.6fr repeat(5, minmax(120px, 1fr));
      }
      .summary-box {
        border: 1px solid rgba(148,163,184,.18);
        border-radius: 18px;
        padding: 16px;
        background: linear-gradient(180deg, rgba(255,255,255,.92) 0%, rgba(248,250,252,.88) 100%);
        box-shadow: var(--shadow-soft);
      }
      .summary-box--feature {
        background: linear-gradient(135deg, rgba(239,246,255,.95) 0%, rgba(250,245,255,.95) 100%);
      }
      .summary-box__label {
        font-size: 11px;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 800;
        margin-bottom: 8px;
      }
      .summary-box__value {
        font-size: 26px;
        font-weight: 800;
        letter-spacing: -.04em;
      }
      .summary-box__value--text {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.8;
        color: #334155;
        letter-spacing: 0;
      }

      .group-stack--v2 {
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .std-group--v2 {
        padding: 0;
      }
      .std-group__head--v2 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }
      .std-group__titleWrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .std-group__subtitle {
        color: var(--muted);
        font-size: 13px;
        font-weight: 600;
      }

      .dir-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        border: 1px solid var(--ring);
        background: var(--pill);
        color: var(--ink);
        padding: 8px 12px 8px 10px;
        min-height: 36px;
      }
      .dir-badge--compact { min-height: 30px; padding: 6px 10px 6px 8px; }
      .dir-badge__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--dot);
        flex-shrink: 0;
      }
      .dir-badge__code {
        font-family: "JetBrains Mono", monospace;
        font-size: 11px;
        font-weight: 700;
      }
      .dir-badge__name {
        font-size: 12px;
        font-weight: 700;
      }

      .std-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 12px;
      }
      .std-card {
        border: 1px solid var(--fborder);
        background: linear-gradient(180deg, rgba(255,255,255,.98) 0%, var(--fbg) 100%);
        border-radius: 18px;
        padding: 14px;
        box-shadow: var(--shadow-soft);
      }
      .std-card__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .std-card__eyebrow {
        font-size: 10px;
        letter-spacing: .12em;
        color: var(--muted);
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .std-card__name {
        font-family: "JetBrains Mono", monospace;
        font-size: 12px;
        line-height: 1.55;
        font-weight: 700;
      }
      .std-card__chips {
        margin-top: 12px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .std-card__finding {
        margin-top: 10px;
        color: #334155;
        line-height: 1.65;
        font-size: 12.5px;
      }
      .std-card__actions {
        margin-top: 14px;
        padding: 12px 13px;
        border-radius: 14px;
        background: rgba(255,255,255,.74);
        border: 1px solid rgba(148,163,184,.18);
      }
      .std-card__actions-title {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 8px;
      }
      .std-card__actions ul { margin: 0; padding-left: 18px; }
      .std-card__actions li {
        font-size: 12px;
        line-height: 1.65;
        color: #334155;
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

      .list-pad { padding: 10px 10px 14px; }
      .frow {
        display: grid;
        grid-template-columns: 46px 1fr;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid var(--fborder);
        background: linear-gradient(180deg, rgba(255,255,255,.95) 0%, var(--fbg) 100%);
        margin-bottom: 10px;
      }
      .frow__left {
        background: var(--fstripe);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 16px;
      }
      .frow__icon {
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: rgba(255,255,255,.18);
        display: grid;
        place-items: center;
        color: white;
        font-weight: 800;
      }
      .frow__body { padding: 14px 16px; }
      .frow__topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }
      .frow__art {
        font-family: "JetBrains Mono", monospace;
        font-size: 10.5px;
        color: var(--muted);
      }
      .frow__text {
        color: #1e293b;
        line-height: 1.8;
      }
      .frow__action {
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255,255,255,.76);
        border: 1px solid rgba(148,163,184,.18);
        color: #334155;
        font-size: 12px;
      }

      .diag-wrap {
        padding: 18px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .diag-pill {
        padding: 8px 11px;
        border-radius: 999px;
        border: 1px solid rgba(148,163,184,.22);
        background: rgba(255,255,255,.8);
        color: #334155;
        font-size: 12px;
      }
      .empty { padding: 18px; color: var(--muted); }
      .toast {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 60;
        padding: 10px 14px;
        border-radius: 12px;
        background: #111827;
        color: white;
        box-shadow: 0 14px 30px rgba(15,23,42,.25);
        font-size: 12.5px;
        font-weight: 700;
      }

      @media (max-width: 1080px) {
        .summary-grid--v2 { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
      }
      @media (max-width: 900px) {
        .toolbar--v2,
        .composer__top,
        .composer__bottom,
        .section__head,
        .topbar__inner {
          flex-direction: column;
          align-items: stretch;
        }
        .toolbar__left, .toolbar__right, .topbar__meta { width: 100%; }
        .search-wrap { min-width: 0; flex: 1; }
      }
      @media (max-width: 720px) {
        .container { padding: 0 14px; }
        .page { padding: 18px 14px 40px; }
        .std-grid { grid-template-columns: 1fr; }
        .ghost-guide {
          position: static;
          padding: 8px 0 0;
          left: auto;
          right: auto;
          bottom: auto;
        }
        .ghost-btn, .run-btn, .select, .search-input { width: 100%; }
        .composer__actions, .toolbar__right, .toolbar__left { flex-direction: column; align-items: stretch; }
      }
    `}</style>
  );
}
