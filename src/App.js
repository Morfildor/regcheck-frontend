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
  LVD: { dot: "#6f7566", pill: "#ece8dc", ring: "#cfc7b7", ink: "#505647" },
  EMC: { dot: "#5f8d8b", pill: "#e6f0ef", ring: "#bbd1cf", ink: "#456a69" },
  RED: { dot: "#2f5f69", pill: "#e3eef0", ring: "#b2c7cc", ink: "#294b53" },
  RED_CYBER: { dot: "#9f7084", pill: "#f1e7eb", ring: "#d8c0c9", ink: "#7a5667" },
  CRA: { dot: "#60795f", pill: "#e8efe7", ring: "#c1cec0", ink: "#4a6149" },
  ROHS: { dot: "#b7903e", pill: "#f7efd9", ring: "#e5d3a1", ink: "#8f6e2d" },
  REACH: { dot: "#aa7868", pill: "#f5eae6", ring: "#e3cbc2", ink: "#83584a" },
  GDPR: { dot: "#7f9995", pill: "#edf3f2", ring: "#cad9d8", ink: "#607773" },
  AI_Act: { dot: "#9f7084", pill: "#f1e7eb", ring: "#d8c0c9", ink: "#7a5667" },
  ESPR: { dot: "#b7903e", pill: "#f7f0dd", ring: "#e5d7aa", ink: "#8f6e2d" },
  OTHER: { dot: "#8d8779", pill: "#f0ece3", ring: "#d5cec0", ink: "#686356" },
  SYSTEM: { dot: "#8d8779", pill: "#f0ece3", ring: "#d5cec0", ink: "#686356" },
};

const STS = {
  FAIL: {
    icon: "×",
    label: "FAIL",
    bg: "#f8eef1",
    border: "#e6d0d6",
    text: "#8b6474",
    stripe: "#9f7084",
  },
  WARN: {
    icon: "!",
    label: "WARN",
    bg: "#fbf5e8",
    border: "#ecdcae",
    text: "#9e7d36",
    stripe: "#b7903e",
  },
  PASS: {
    icon: "✓",
    label: "PASS",
    bg: "#eef4ee",
    border: "#ccd7ca",
    text: "#566554",
    stripe: "#60795f",
  },
  INFO: {
    icon: "i",
    label: "INFO",
    bg: "#eff5f5",
    border: "#cadada",
    text: "#517674",
    stripe: "#5f8d8b",
  },
};

const STD_RE = /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|UL|ASTM|CISPR|ITU|IEC\/EN)\b/i;

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

  if (/en\s*18031|18031-1|18031-2|18031-3|red da|delegated act|article 3\.3\(d\)|article 3\.3\(e\)|article 3\.3\(f\)/.test(t)) {
    return "RED_CYBER";
  }
  if (/cyber resilience act|\bcra\b|sbom|vulnerability|secure development/.test(t)) {
    return "CRA";
  }
  if (/rohs|2011\/65\/eu|iec 63000|en iec 63000|62321/.test(t)) {
    return "ROHS";
  }
  if (/\breach\b|1907\/2006|svhc|article 33/.test(t)) {
    return "REACH";
  }
  if (/60335|60730|62233|electrical safety|appliance safety/.test(t)) {
    return "LVD";
  }
  if (/55014|61000|emc|electromagnetic|cispr|harmonic|flicker|esd|surge|immunity/.test(t)) {
    return "EMC";
  }
  if (/300 328|301 489|300 220|300 330|wireless|bluetooth|wifi|wi-fi|zigbee|matter|nfc|lte|5g/.test(t)) {
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
    explicit = explicit.filter((d) => d !== "CRA" && d !== "RED");
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
  const [open, setOpen] = useState(false);
  const firstFinding = item.findings?.[0]?.finding || "";
  const shortFinding = firstFinding.length > 110 ? `${firstFinding.slice(0, 110)}…` : firstFinding;

  return (
    <div
      className={`std-card ${open ? "std-card--open" : ""}`}
      style={{
        "--fbg": (STS[mainStatus] || STS.INFO).bg,
        "--fborder": (STS[mainStatus] || STS.INFO).border,
        "--ftext": (STS[mainStatus] || STS.INFO).text,
      }}
    >
      <button type="button" className="std-card__button" onClick={() => setOpen((v) => !v)}>
        <div className="std-card__top">
          <div className="std-card__titleWrap">
            <div className="std-card__eyebrow">STANDARD</div>
            <div className="std-card__name">{item.name}</div>
          </div>
          <div className="std-card__topRight">
            <StatusPill status={mainStatus} />
            <span className="std-card__chevron">{open ? "−" : "+"}</span>
          </div>
        </div>

        <div className="std-card__chips">
          {item.directives.map((d) => (
            <DirBadge key={d} code={d} compact />
          ))}
        </div>

        {shortFinding ? <div className="std-card__finding std-card__finding--compact">{shortFinding}</div> : null}
      </button>

      {open ? (
        <div className="std-card__details">
          {firstFinding ? <div className="std-card__finding">{firstFinding}</div> : null}
          {item.actions.length > 0 ? (
            <div className="std-card__actions">
              <div className="std-card__actions-title">Suggested action</div>
              <ul>
                {item.actions.slice(0, 3).map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </div>
          ) : null}
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
        <button key={item.label} type="button" className="type-chip" onClick={() => onPick(item.value)}>
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
        Pick the closest product first. Then add power, connectivity, materials, software, or moving-part details only when relevant.
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
    if (!t.includes(value.toLowerCase())) quick.push({ label, value, stage });
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
    return { productType, primary: productChoices, secondary: [] };
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

  return { productType, primary: quick.slice(0, 4), secondary: quick.slice(4, 9) };
}

export default function App() {
  const [collapsedGroups, setCollapsedGroups] = useState({});
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
        body: JSON.stringify({ description: text, category: "", directives: [], depth }),
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

  const toggleGroup = useCallback((key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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
      if (trimmed.toLowerCase().includes(value.toLowerCase())) return trimmed;
      if (trimmed.endsWith(".")) return `${trimmed} ${value}.`;
      return `${trimmed}. ${value}.`;
    });
  }, []);

  return (
    <div className="page-shell v3">
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
              Start with the product type first. Then add only the follow-up details that matter for legislation and standard scoping.
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
          <EmptyState onLoadSample={() => setDescription(SAMPLE)} onPickType={(value) => setDescription(value)} />
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

            <div className="chip-strip card">
              <div className="chip-strip__label">Quick view</div>
              <div className="chip-strip__items">
                {(result.directives || []).slice(0, 10).map((d) => (
                  <DirBadge key={d} code={d} compact />
                ))}
                <span className="meta-chip">{summaryStats.standards} standards</span>
                <span className="meta-chip">{summaryStats.warn} warnings</span>
                <span className="meta-chip">{summaryStats.fail} fails</span>
              </div>
            </div>

            <Section
              title="Summary"
              helper="High-level result with less visual noise"
              right={
                <StatusPill
                  status={
                    result.overall_risk === "CRITICAL"
                      ? "FAIL"
                      : result.overall_risk === "HIGH" || result.overall_risk === "MEDIUM"
                      ? "WARN"
                      : "PASS"
                  }
                />
              }
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
              helper="Grouped by legislation bucket for easier scanning"
              count={filteredStandardGroups.length}
            >
              <div className="group-stack group-stack--v2">
                {DIR_ORDER.filter((d) => (standardsByDirective[d] || []).length > 0).map((d) => {
                  const isCollapsed = !!collapsedGroups[d];
                  return (
                    <div key={d} className="std-group std-group--v2">
                      <button
                        type="button"
                        className="std-group__head std-group__head--v2 std-group__toggle"
                        onClick={() => toggleGroup(d)}
                      >
                        <div className="std-group__titleWrap">
                          <DirBadge code={d} />
                          <div className="std-group__subtitle">{DIR_NAME[d] || d}</div>
                        </div>
                        <div className="std-group__headRight">
                          <span className="count-pill">{standardsByDirective[d].length}</span>
                          <span className="std-group__chevron">{isCollapsed ? "+" : "−"}</span>
                        </div>
                      </button>

                      {!isCollapsed ? (
                        <div className="std-grid">
                          {standardsByDirective[d].map((item) => (
                            <StandardCard key={`${d}-${item.name}`} item={item} />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section
              title="Other findings"
              helper="Only non-standard findings are shown here"
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
        --bg: #ede5dc;
        --bg2: #e3d8ce;
        --card: rgba(255,255,255,0.76);
        --line: rgba(72, 68, 58, 0.14);
        --ink: #3c3b36;
        --muted: #706d64;
        --muted-2: #958f86;
        --shadow: 0 18px 50px rgba(88, 74, 62, 0.12);
        --shadow-soft: 0 8px 24px rgba(88, 74, 62, 0.08);
        --accent: #5f8d8b;
        --accent-deep: #2f5f69;
        --accent-soft: #9f7084;
        --accent-warm: #b7903e;
        --accent-earth: #aa7868;
        --accent-sage: #60795f;
        --surface-dark: #4b4e45;
        --surface-deep: #2f5f69;
      }
      body {
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(159,112,132,.20), transparent 24%),
          radial-gradient(circle at top right, rgba(183,144,62,.16), transparent 20%),
          radial-gradient(circle at 50% 0%, rgba(95,141,139,.14), transparent 28%),
          radial-gradient(circle at 80% 18%, rgba(170,120,104,.12), transparent 18%),
          linear-gradient(180deg, #ede5dc 0%, #e1d5ca 100%);
        color: var(--ink);
      }
      button, input, textarea, select { font: inherit; }
      button { cursor: pointer; border: none; }

      .bg-grid {
        position: fixed;
        inset: 0;
        pointer-events: none;
        background-image:
          linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px);
        background-size: 32px 32px;
        mask-image: linear-gradient(180deg, rgba(0,0,0,.5), transparent 80%);
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
        background: linear-gradient(180deg, rgba(74,97,73,.78), rgba(47,95,105,.72));
        border-bottom: 1px solid rgba(255,255,255,.10);
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
        background: linear-gradient(135deg, #9f7084 0%, #5f8d8b 48%, #2f5f69 100%);
        color: white;
        display: grid;
        place-items: center;
        font-weight: 800;
        letter-spacing: -.03em;
        box-shadow: 0 10px 28px rgba(95,141,139,.24);
      }
      .brand__title { font-size: 16px; font-weight: 800; letter-spacing: -.02em; color: #f8f2ea; }
      .brand__sub { font-size: 12px; color: rgba(248,242,234,.74); }
      .topbar__meta { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
      .meta-chip {
        min-height: 34px;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.14);
        border: 1px solid rgba(255,255,255,.14);
        color: #f6efe7;
        display: inline-flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
      }

      .page { padding: 28px 20px 52px; position: relative; z-index: 1; }

      .hero-v2 { padding: 12px 0 18px; }
      .hero-v2__eyebrow {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid #d8c0c9;
        background: rgba(241,231,235,.90);
        color: #7a5667;
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
        color: #3d3b36;
      }
      .hero-v2__text {
        margin: 0;
        max-width: 760px;
        color: #655f56;
        line-height: 1.8;
        font-size: 15px;
      }

      .card {
        background: linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(250,247,242,0.72) 100%);
        border: 1px solid rgba(255,255,255,0.38);
        box-shadow: var(--shadow);
        border-radius: 24px;
        backdrop-filter: blur(18px);
        position: relative;
      }
      .card::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(255,255,255,.34), transparent 22%);
      }

      .composer {
        overflow: hidden;
        margin-bottom: 18px;
        border-radius: 28px;
        border: 1px solid rgba(47,95,105,.10);
      }
      .composer__top {
        padding: 22px 24px 16px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        background: linear-gradient(180deg, rgba(47,95,105,.10), rgba(255,255,255,0));
      }
      .composer__label {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: -.02em;
        color: #3f4c4a;
      }
      .composer__sub {
        margin-top: 6px;
        color: var(--muted);
        font-size: 13px;
        max-width: 640px;
        line-height: 1.7;
      }

      .depth { display: flex; gap: 8px; flex-wrap: wrap; }
      .seg-btn {
        padding: 9px 14px;
        border-radius: 12px;
        border: 1px solid rgba(47,95,105,.16);
        background: rgba(255,255,255,.72);
        color: #4c5755;
        font-weight: 700;
        text-transform: capitalize;
        transition: .16s ease;
      }
      .seg-btn:hover { transform: translateY(-1px); }
      .seg-btn--on {
        background: linear-gradient(180deg, #3f6f78 0%, #2f5f69 100%);
        border-color: #2f5f69;
        color: #f4ece4;
      }

      .composer__textareaWrap {
        position: relative;
        padding: 0 24px;
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
        border-radius: 22px;
        border: 1px solid rgba(95,141,139,.18);
        background: linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(246,241,234,.92) 100%);
        padding: 26px 24px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 8px 30px rgba(88,74,62,.04);
        line-height: 1.95;
        font-size: 15px;
        color: #3f3b37;
      }
      .ta--v3 { min-height: 148px; }
      .ta--v2:focus {
        border-color: #bbd1cf;
        box-shadow: 0 0 0 4px rgba(95,141,139,.10), inset 0 1px 0 rgba(255,255,255,.7);
      }
      .ta--v2::placeholder { color: #9a8f8c; }

      .ghost-guide {
        position: absolute;
        left: 42px;
        right: 42px;
        bottom: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        pointer-events: none;
      }
      .ghost-guide--v3 { gap: 6px; }
      .ghost-guide span {
        padding: 8px 11px;
        border-radius: 999px;
        background: rgba(255,255,255,.78);
        border: 1px dashed rgba(159,112,132,.22);
        color: #9a8d92;
        font-size: 12px;
        font-weight: 600;
      }
      .ghost-guide--v3 span {
        font-size: 11.5px;
        padding: 7px 9px;
      }

      .assist-panel {
        padding: 14px 24px 0;
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .assist-panel__block {
        border: 1px solid rgba(255,255,255,.5);
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(255,255,255,.62), rgba(255,255,255,.42));
        padding: 14px 14px 12px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.5);
      }
      .assist-panel__block--soft {
        background: linear-gradient(180deg, rgba(248,247,243,.78), rgba(255,255,255,.46));
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

      .hint-chip {
        padding: 9px 13px;
        border-radius: 999px;
        background: rgba(255,255,255,.88);
        border: 1px solid rgba(148,163,184,.16);
        color: #3f433f;
        font-weight: 700;
        transition: .16s ease;
        box-shadow: 0 2px 10px rgba(104,92,78,.03);
      }
      .hint-chip:hover {
        transform: translateY(-1px);
        border-color: #bbd1cf;
        color: #456a69;
        box-shadow: 0 10px 20px rgba(104,92,78,.06);
      }
      .hint-chip--primary {
        background: #f1e7eb;
        border-color: #d8c0c9;
        color: #7a5667;
      }
      .hint-chip--soft {
        background: rgba(255,255,255,.7);
      }

      .composer__bottom {
        padding: 18px 24px 22px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }
      .composer__helper { color: var(--muted); font-size: 12.5px; }
      .composer__actions { display: flex; gap: 10px; flex-wrap: wrap; }

      .ghost-btn {
        padding: 10px 14px;
        border-radius: 12px;
        background: rgba(255,255,255,.84);
        border: 1px solid rgba(47,95,105,.14);
        color: #4a4b46;
        font-weight: 700;
        transition: .16s ease;
        box-shadow: 0 2px 10px rgba(104,92,78,.03);
      }
      .ghost-btn:hover {
        transform: translateY(-1px);
        background: white;
        box-shadow: 0 10px 20px rgba(104,92,78,.06);
      }
      .run-btn {
        padding: 10px 16px;
        border-radius: 12px;
        font-weight: 800;
        background: linear-gradient(135deg, #9f7084 0%, #5f8d8b 48%, #2f5f69 100%);
        color: #fff8f2;
        box-shadow: 0 14px 28px rgba(47,95,105,.24);
      }
      .run-btn:disabled {
        background: #cfc8bd;
        color: #7b766d;
        box-shadow: none;
        cursor: not-allowed;
      }
      .err-bar {
        margin: 0 24px 22px;
        padding: 12px 14px;
        border-radius: 14px;
        background: #f8eef1;
        border: 1px solid #e6d0d6;
        color: #8b6474;
      }

      .empty-state {
        position: relative;
        overflow: hidden;
        padding: 30px 22px;
        text-align: center;
        margin-bottom: 18px;
      }
      .empty-state__orb {
        position: absolute;
        width: 240px;
        height: 240px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(95,141,139,.18) 0%, transparent 68%);
        left: 50%;
        top: -70px;
        transform: translateX(-50%);
        pointer-events: none;
      }
      .empty-state__eyebrow {
        position: relative;
        z-index: 1;
        color: #7a5667;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .empty-state__title {
        position: relative;
        z-index: 1;
        margin: 10px 0 8px;
        font-size: 28px;
        letter-spacing: -.04em;
      }
      .empty-state__text {
        position: relative;
        z-index: 1;
        max-width: 640px;
        margin: 0 auto;
        color: var(--muted);
        line-height: 1.8;
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
        border-color: #d8c0c9;
        color: #7a5667;
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
        border: 3px solid #d8e4e2;
        border-top-color: #2f5f69;
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
        margin-bottom: 12px;
        flex-wrap: wrap;
        border-radius: 20px;
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
        border: 1px solid rgba(148,163,184,.18);
        background: rgba(255,255,255,.88);
        color: var(--ink);
        padding: 0 14px;
        outline: none;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
      }
      .search-input { width: 100%; }
      .search-input:focus, .select:focus {
        border-color: #bbd1cf;
        box-shadow: 0 0 0 4px rgba(95,141,139,.10);
      }

      .chip-strip {
        padding: 12px 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
        border-radius: 18px;
        flex-wrap: wrap;
        background: linear-gradient(180deg, rgba(47,95,105,.86), rgba(74,97,73,.82));
        border: 1px solid rgba(255,255,255,.08);
      }
      .chip-strip__label {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: rgba(248,242,234,.72);
      }
      .chip-strip__items {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }

      .section {
        overflow: hidden;
        margin-bottom: 18px;
        border-radius: 24px;
      }
      .section__head {
        padding: 18px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border-bottom: 1px solid rgba(95,88,74,.08);
        background: linear-gradient(180deg, rgba(47,95,105,.08), rgba(255,255,255,0));
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
        color: #38423f;
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
        background: rgba(47,95,105,.10);
        border: 1px solid rgba(47,95,105,.14);
        color: #355861;
        font-size: 11px;
        font-weight: 800;
      }

      .summary-grid {
        padding: 18px;
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      }
      .summary-grid--v2 {
        grid-template-columns: 1.6fr repeat(5, minmax(120px, 1fr));
      }
      .summary-box {
        border: 1px solid rgba(148,163,184,.14);
        border-radius: 20px;
        padding: 16px;
        background: linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(248,247,243,.90) 100%);
        box-shadow: var(--shadow-soft);
      }
      .summary-box--feature {
        background: linear-gradient(135deg, rgba(159,112,132,.14) 0%, rgba(183,144,62,.14) 42%, rgba(95,141,139,.16) 100%);
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
      .std-group__head--v2 {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }
      .std-group__toggle {
        width: 100%;
        padding: 0;
        background: transparent;
        text-align: left;
      }
      .std-group__titleWrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .std-group__subtitle {
        color: #68645c;
        font-size: 13px;
        font-weight: 600;
      }
      .std-group__headRight {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .std-group__chevron {
        width: 26px;
        height: 26px;
        border-radius: 999px;
        border: 1px solid rgba(47,95,105,.16);
        background: rgba(47,95,105,.08);
        display: grid;
        place-items: center;
        color: #355861;
        font-weight: 800;
        flex-shrink: 0;
      }

      .dir-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        border: 1px solid var(--ring);
        background: linear-gradient(180deg, rgba(255,255,255,.56), var(--pill));
        color: var(--ink);
        padding: 8px 12px 8px 10px;
        min-height: 36px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.45);
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
        border-radius: 20px;
        padding: 0;
        box-shadow: var(--shadow-soft);
        transition: transform .14s ease, box-shadow .14s ease;
        overflow: hidden;
      }
      .std-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 28px rgba(104,92,78,.08);
      }
      .std-card__button {
        width: 100%;
        background: transparent;
        text-align: left;
        padding: 15px;
      }
      .std-card__details {
        padding: 0 15px 15px;
      }
      .std-card__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .std-card__titleWrap { min-width: 0; }
      .std-card__topRight {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
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
      .std-card__chevron {
        width: 26px;
        height: 26px;
        border-radius: 999px;
        border: 1px solid rgba(47,95,105,.14);
        background: rgba(47,95,105,.08);
        display: grid;
        place-items: center;
        color: #355861;
        font-weight: 800;
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
      .std-card__finding--compact {
        color: #5d685e;
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
        background: linear-gradient(180deg, rgba(255,255,255,.42), var(--fbg));
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
        background: linear-gradient(180deg, rgba(255,255,255,.96) 0%, var(--fbg) 100%);
        margin-bottom: 10px;
        box-shadow: 0 6px 16px rgba(104,92,78,.04);
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
        border: 1px solid rgba(148,163,184,.18);
        background: rgba(255,255,255,.84);
        color: #5a5d56;
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
        background: #2f5f69;
        color: white;
        box-shadow: 0 14px 30px rgba(47,95,105,.26);
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
