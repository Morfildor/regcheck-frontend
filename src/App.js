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
  "LVD", "EMC", "RED", "RED_CYBER", "CRA",
  "ROHS", "REACH", "GDPR", "AI_Act", "ESPR", "OTHER",
];

const DIR = {
  LVD:       { dot: "#6f7566", pill: "#ece8dc", ring: "#cfc7b7", ink: "#505647", accent: "#8a9484" },
  EMC:       { dot: "#5f8d8b", pill: "#e6f0ef", ring: "#bbd1cf", ink: "#456a69", accent: "#5f8d8b" },
  RED:       { dot: "#2f5f69", pill: "#e3eef0", ring: "#b2c7cc", ink: "#294b53", accent: "#2f5f69" },
  RED_CYBER: { dot: "#9f7084", pill: "#f1e7eb", ring: "#d8c0c9", ink: "#7a5667", accent: "#9f7084" },
  CRA:       { dot: "#60795f", pill: "#e8efe7", ring: "#c1cec0", ink: "#4a6149", accent: "#60795f" },
  ROHS:      { dot: "#b7903e", pill: "#f7efd9", ring: "#e5d3a1", ink: "#8f6e2d", accent: "#b7903e" },
  REACH:     { dot: "#aa7868", pill: "#f5eae6", ring: "#e3cbc2", ink: "#83584a", accent: "#aa7868" },
  GDPR:      { dot: "#7f9995", pill: "#edf3f2", ring: "#cad9d8", ink: "#607773", accent: "#7f9995" },
  AI_Act:    { dot: "#9f7084", pill: "#f1e7eb", ring: "#d8c0c9", ink: "#7a5667", accent: "#9f7084" },
  ESPR:      { dot: "#b7903e", pill: "#f7f0dd", ring: "#e5d7aa", ink: "#8f6e2d", accent: "#b7903e" },
  OTHER:     { dot: "#8d8779", pill: "#f0ece3", ring: "#d5cec0", ink: "#686356", accent: "#8d8779" },
  SYSTEM:    { dot: "#8d8779", pill: "#f0ece3", ring: "#d5cec0", ink: "#686356", accent: "#8d8779" },
};

const STS = {
  FAIL: { icon: "×", label: "FAIL", bg: "#f8eef1", border: "#e6d0d6", text: "#8b6474", stripe: "#9f7084" },
  WARN: { icon: "!", label: "WARN", bg: "#fbf5e8", border: "#ecdcae", text: "#9e7d36", stripe: "#b7903e" },
  PASS: { icon: "✓", label: "PASS", bg: "#eef4ee", border: "#ccd7ca", text: "#566554", stripe: "#60795f" },
  INFO: { icon: "i", label: "INFO", bg: "#eff5f5", border: "#cadada", text: "#517674", stripe: "#5f8d8b" },
};

const STD_RE = /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|UL|ASTM|CISPR|ITU|IEC\/EN)\b/i;

const QUICK_CHIPS = [
  { label: "Heating element", text: "heating element" },
  { label: "Wi-Fi / BT", text: "Wi-Fi and Bluetooth connectivity" },
  { label: "OTA updates", text: "OTA firmware updates" },
  { label: "Battery", text: "rechargeable lithium battery" },
  { label: "Food-contact", text: "food-contact materials" },
  { label: "Cloud account", text: "cloud account and user data storage" },
  { label: "Motor / pump", text: "motor and pump" },
  { label: "Display / UI", text: "display and touch UI" },
];

const PRODUCT_TEMPLATES = [
  { label: "Air fryer", text: "Smart air fryer with Wi-Fi app control, mains powered, OTA updates, cloud recipe sync, and food-contact basket coating." },
  { label: "Coffee machine", text: "Connected espresso machine with app control, mains powered, OTA updates, cloud brew profiles, water tank sensor, and food-contact brew path." },
  { label: "Robot vacuum", text: "Robot vacuum cleaner with Wi-Fi and Bluetooth, LiDAR navigation, OTA firmware updates, cloud cleaning schedule, rechargeable lithium battery, and camera." },
  { label: "Air purifier", text: "Smart air purifier with Wi-Fi control, PM2.5 sensor, OTA firmware updates, cloud air quality logging, and mains power." },
];

function unique(arr = []) { return [...new Set(arr.filter(Boolean))]; }
function normalizeStdName(s = "") { return s.replace(/\s+/g, " ").trim(); }

function getDirectiveListFromFinding(f) {
  return (f.directive || "").split(",").map((x) => x.trim()).filter(Boolean).map((d) => (d === "RF" ? "RED" : d));
}
function statusRank(status = "INFO") { return { FAIL: 4, WARN: 3, PASS: 2, INFO: 1 }[status] || 1; }
function priorityStatus(statuses = []) {
  if (!statuses.length) return "INFO";
  return [...statuses].sort((a, b) => statusRank(b) - statusRank(a))[0];
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
    if (/Missing/i.test(art)) { bucket.missing.push(row); return; }
    if (/Contradiction/i.test(art)) { bucket.contra.push(row); return; }
    bucket.other.push(row);
  });
  return bucket;
}
function inferDirectiveFromText(text = "") {
  const t = text.toLowerCase();
  if (/en\s*18031|18031-1|18031-2|18031-3|red da|delegated act|article 3\.3\(d\)|article 3\.3\(e\)|article 3\.3\(f\)/.test(t)) return "RED_CYBER";
  if (/cyber resilience act|\bcra\b|sbom|vulnerability|secure development/.test(t)) return "CRA";
  if (/rohs|2011\/65\/eu|iec 63000|en iec 63000|62321/.test(t)) return "ROHS";
  if (/\breach\b|1907\/2006|svhc|article 33/.test(t)) return "REACH";
  if (/60335|60730|62233|electrical safety|appliance safety/.test(t)) return "LVD";
  if (/55014|61000|emc|electromagnetic|cispr|harmonic|flicker|esd|surge|immunity/.test(t)) return "EMC";
  if (/300 328|301 489|300 220|300 330|wireless|bluetooth|wifi|wi-fi|zigbee|matter|nfc|lte|5g/.test(t)) return "RED";
  if (/gdpr|privacy|personal data|data protection/.test(t)) return "GDPR";
  if (/ai act|artificial intelligence|machine learning|model/.test(t)) return "AI_Act";
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
function standardStatusFromItem(item) {
  if (item.item_type === "review") return "WARN";
  return "PASS";
}
function buildGroupsFromBackendItems(standards = [], reviewItems = []) {
  const all = [...(standards || []), ...(reviewItems || [])];
  const map = new Map();
  all.forEach((row) => {
    const name = normalizeStdName(row.code || row.title || "Unnamed item");
    const directive = row.directive || row.legislation_key || "OTHER";
    const key = `${directive}::${name.toLowerCase()}`;
    const status = standardStatusFromItem(row);
    const findingText = row.title || "";
    const actionText = row.reason || row.notes || "";
    if (!map.has(key)) {
      map.set(key, { name, directives: [directive], statuses: [status], findings: [{ finding: findingText, action: actionText, status }], actions: actionText ? [actionText] : [] });
      return;
    }
    const curr = map.get(key);
    curr.directives = unique([...curr.directives, directive]);
    curr.statuses = unique([...curr.statuses, status]);
    if (actionText) curr.actions = unique([...curr.actions, actionText]);
    curr.findings.push({ finding: findingText, action: actionText, status });
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function collectDirectiveCounts(groups = []) {
  const counts = {};
  groups.forEach((g) => { const d = g.directives?.[0] || "OTHER"; counts[d] = (counts[d] || 0) + 1; });
  return counts;
}
function titleCase(s = "") {
  return String(s).replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase());
}
function prettyDirectiveName(key = "OTHER") { return DIR_NAME[key] || titleCase(key); }
function tagToneForSignal(signal = "neutral") {
  if (signal === "high")   return { bg: "#f8eef1", bd: "#e6d0d6", tx: "#8b6474" };
  if (signal === "medium") return { bg: "#fbf5e8", bd: "#ecdcae", tx: "#9e7d36" };
  if (signal === "good")   return { bg: "#eef4ee", bd: "#ccd7ca", tx: "#566554" };
  return { bg: "#eff5f5", bd: "#cadada", tx: "#517674" };
}

/* ─── Atoms ─────────────────────────────────────────────── */

function DirDot({ dirKey }) {
  const tone = DIR[dirKey] || DIR.OTHER;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 9px 3px 7px", borderRadius: 999,
      border: `1px solid ${tone.ring}`, background: tone.pill,
      color: tone.ink, fontSize: 11, fontWeight: 800, letterSpacing: "0.06em",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: tone.dot, flexShrink: 0 }} />
      {dirKey}
    </span>
  );
}

function StatusBadge({ status = "INFO", small = false }) {
  const s = STS[status] || STS.INFO;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: small ? "3px 8px" : "4px 10px",
      borderRadius: 999, border: `1px solid ${s.border}`,
      background: s.bg, color: s.text,
      fontSize: small ? 11 : 12, fontWeight: 800, lineHeight: 1, whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: small ? 11 : 13 }}>{s.icon}</span>
      {s.label}
    </span>
  );
}

/* ─── StandardRow ────────────────────────────────────────── */

function StandardRow({ group, expanded, onToggle }) {
  const topStatus = priorityStatus(group.statuses);
  const d = group.directives?.[0] || "OTHER";
  const tone = DIR[d] || DIR.OTHER;

  return (
    <div style={{ borderBottom: "1px solid rgba(188,178,165,0.18)" }}>
      {/* Row header — clickable */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px 10px 0", cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.35)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        {/* Color accent stripe */}
        <span style={{
          width: 3, alignSelf: "stretch", borderRadius: 99, background: tone.accent,
          flexShrink: 0, minHeight: 22, marginLeft: 2,
        }} />

        {/* Standard name */}
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 700, color: "#2c2925",
          letterSpacing: "0.01em", minWidth: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {group.name}
        </span>

        <StatusBadge status={topStatus} small />

        {/* Chevron */}
        <span style={{
          fontSize: 10, color: "#9e9890", marginLeft: 2, transition: "transform 0.2s",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-block", flexShrink: 0,
        }}>▼</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          marginLeft: 17, marginBottom: 10,
          borderLeft: `2px solid ${tone.ring}`,
          paddingLeft: 14, display: "grid", gap: 8,
        }}>
          {group.findings.map((f, idx) => {
            const rowStatus = f.status || topStatus;
            const signal = rowStatus === "FAIL" ? "high" : rowStatus === "WARN" ? "medium" : rowStatus === "PASS" ? "good" : "neutral";
            const tagTone = tagToneForSignal(signal);
            return (
              <div key={`${group.name}-${idx}`} style={{
                borderRadius: 10, border: `1px solid ${tagTone.bd}`,
                background: tagTone.bg, padding: "10px 12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: tagTone.tx, letterSpacing: "0.1em" }}>
                    {rowStatus}
                  </span>
                </div>
                {f.finding ? (
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2f2c28", lineHeight: 1.45 }}>{f.finding}</div>
                ) : null}
                {f.action ? (
                  <div style={{ marginTop: 5, fontSize: 12, color: "#7a746b", lineHeight: 1.55 }}>{f.action}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── DirectiveLane ──────────────────────────────────────── */

function DirectiveLane({ dirKey, groups, expandedStandards, onToggleStandard, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const tone = DIR[dirKey] || DIR.OTHER;

  return (
    <div style={{
      borderRadius: 16,
      border: `1px solid ${tone.ring}`,
      background: "rgba(255,255,255,0.68)",
      overflow: "hidden",
    }}>
      {/* Lane header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "11px 14px", cursor: "pointer",
          background: tone.pill,
          borderBottom: open ? `1px solid ${tone.ring}` : "none",
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 999, background: tone.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 900, color: tone.ink, letterSpacing: "0.1em", flex: 1 }}>
          {dirKey} <span style={{ fontWeight: 600, opacity: 0.7 }}>— {prettyDirectiveName(dirKey)}</span>
        </span>
        <span style={{
          minWidth: 22, height: 22, padding: "0 7px", borderRadius: 999,
          background: tone.ring, color: tone.ink, fontWeight: 900, fontSize: 11,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          {groups.length}
        </span>
        <span style={{
          fontSize: 9, color: tone.ink, opacity: 0.6,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-block", transition: "transform 0.2s",
        }}>▼</span>
      </div>

      {/* Standards list */}
      {open && (
        <div style={{ padding: "2px 0" }}>
          {groups.map((group) => {
            const key = `${dirKey}::${group.name}`;
            return (
              <StandardRow
                key={key}
                group={group}
                expanded={!!expandedStandards[key]}
                onToggle={() => onToggleStandard(key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── FindingRow ─────────────────────────────────────────── */

function FindingRow({ finding }) {
  const status = finding.status || "INFO";
  const signal = status === "FAIL" ? "high" : status === "WARN" ? "medium" : status === "PASS" ? "good" : "neutral";
  const tone = tagToneForSignal(signal);
  const directives = enrichDirectives(finding);

  return (
    <div style={{
      display: "grid", gap: 6,
      borderRadius: 12, border: `1px solid ${tone.bd}`,
      background: tone.bg, padding: "11px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {directives.map((d) => <DirDot key={d} dirKey={d} />)}
        <StatusBadge status={status} small />
        {finding.article ? (
          <span style={{ fontSize: 11, color: "#9b968b", fontWeight: 800, letterSpacing: "0.1em", marginLeft: "auto" }}>
            {finding.article}
          </span>
        ) : null}
      </div>
      {finding.finding ? (
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2f2c28", lineHeight: 1.45 }}>{finding.finding}</div>
      ) : null}
      {finding.action ? (
        <div style={{ fontSize: 12, color: "#7a746b", lineHeight: 1.55 }}>{finding.action}</div>
      ) : null}
    </div>
  );
}

/* ─── EmptyState ─────────────────────────────────────────── */
function EmptyState({ title, subtitle }) {
  return (
    <div style={{
      borderRadius: 12, border: "1px dashed rgba(186,176,160,0.7)",
      background: "rgba(250,247,242,0.6)", padding: "20px 18px",
      color: "#807b73", textAlign: "center",
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#59544c" }}>{title}</div>
      {subtitle ? <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>{subtitle}</div> : null}
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────── */

export default function App() {
  const [mode, setMode] = useState("standard");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedStandards, setExpandedStandards] = useState({});
  const [search, setSearch] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef(null);

  const runAnalysis = useCallback(async (payloadText) => {
    const trimmed = (payloadText ?? text).trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed, depth: mode, category: "", directives: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Analysis failed");
      setResult(data);
      const initialExpanded = {};
      buildGroupsFromBackendItems(data.standards || [], data.review_items || []).forEach((group) => {
        const directive = group.directives?.[0] || "OTHER";
        initialExpanded[`${directive}::${group.name}`] = true;
      });
      setExpandedStandards(initialExpanded);
    } catch (err) {
      setError(err?.message || "Analysis failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [mode, text]);

  useEffect(() => {
    if (inputRef.current && window.innerWidth > 900) inputRef.current.focus();
  }, []);

  const findingsBucket = useMemo(() => splitFindings(result?.findings || []), [result]);
  const standardGroups = useMemo(() => buildGroupsFromBackendItems(result?.standards || [], result?.review_items || []), [result]);

  const filteredStandardGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return standardGroups;
    return standardGroups.filter((g) => {
      const hay = [g.name, ...(g.directives || []), ...(g.actions || []), ...(g.findings || []).map((f) => `${f.finding || ""} ${f.action || ""}`)]
        .join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [search, standardGroups]);

  const standardsByDirective = useMemo(() => {
    const groups = {};
    filteredStandardGroups.forEach((g) => {
      const d = g.directives?.[0] || "OTHER";
      if (!groups[d]) groups[d] = [];
      groups[d].push(g);
    });
    return groups;
  }, [filteredStandardGroups]);

  const topRisk = useMemo(() => {
    const statuses = [
      ...(result?.findings || []).map((f) => f.status).filter(Boolean),
      ...standardGroups.flatMap((g) => g.statuses || []),
    ];
    return priorityStatus(statuses);
  }, [result, standardGroups]);

  const otherFindingsCount = findingsBucket.other.length + findingsBucket.missing.length + findingsBucket.contra.length;

  function appendChip(chipText) {
    setText((t) => {
      const trimmed = t.trimEnd();
      if (!trimmed) return chipText.charAt(0).toUpperCase() + chipText.slice(1);
      const endsWithPunct = /[.!?]$/.test(trimmed);
      return endsWithPunct ? `${trimmed} ${chipText}` : `${trimmed}, ${chipText}`;
    });
    inputRef.current?.focus();
  }

  const riskColor = topRisk === "FAIL" ? DIR.RED_CYBER : topRisk === "WARN" ? DIR.ROHS : topRisk === "PASS" ? DIR.CRA : DIR.EMC;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top left, rgba(133,176,190,0.22), transparent 26%), radial-gradient(circle at top right, rgba(204,189,148,0.18), transparent 22%), linear-gradient(180deg, #ddd7cf 0%, #d4cdc4 100%)",
      padding: "24px 16px 80px",
      fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
      color: "#3d3832",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #b0a89d; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(150,140,128,0.35); border-radius: 99px; }
        textarea:focus, input:focus { outline: none; }
        .chip-btn:hover { background: rgba(255,255,255,0.95) !important; border-color: #b0a89d !important; }
        .tmpl-btn:hover { background: rgba(255,255,255,0.9) !important; }
        .run-btn:not(:disabled):hover { background: linear-gradient(180deg, #7aa3ac, #5d8a94) !important; }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 16 }}>

        {/* ── HEADER BAR ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderRadius: 18,
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(183,175,163,0.3)",
          backdropFilter: "blur(16px)",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #8fb6c1, #5d848f)",
              display: "grid", placeItems: "center",
              color: "white", fontWeight: 900, fontSize: 13, letterSpacing: "-0.03em",
            }}>RC</div>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#3a3630", letterSpacing: "-0.02em" }}>RegCheck</span>
            <span style={{
              fontSize: 11, fontWeight: 800, color: "#8c887f",
              background: "rgba(0,0,0,0.06)", borderRadius: 99, padding: "2px 8px",
            }}>v3</span>
          </div>

          {result && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: riskColor.ink,
                background: riskColor.pill, border: `1px solid ${riskColor.ring}`,
                borderRadius: 99, padding: "4px 11px",
              }}>Risk {topRisk}</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: DIR.LVD.ink,
                background: DIR.LVD.pill, border: `1px solid ${DIR.LVD.ring}`,
                borderRadius: 99, padding: "4px 11px",
              }}>{standardGroups.length} standards</span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: DIR.EMC.ink,
                background: DIR.EMC.pill, border: `1px solid ${DIR.EMC.ring}`,
                borderRadius: 99, padding: "4px 11px",
              }}>{Object.keys(standardsByDirective).length} buckets</span>
            </div>
          )}
        </div>

        {/* ── INPUT PANEL ── */}
        <div style={{
          borderRadius: 22,
          border: "1px solid rgba(183,175,163,0.3)",
          background: "rgba(255,255,255,0.62)",
          backdropFilter: "blur(18px)",
          overflow: "hidden",
        }}>
          {/* Textarea */}
          <div style={{ padding: "16px 18px 0" }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runAnalysis(); }}
              placeholder="Describe the product — e.g. Smart air fryer with Wi-Fi, mains powered, OTA updates, food-contact basket coating..."
              style={{
                width: "100%", minHeight: 92, resize: "vertical",
                border: "none", background: "transparent",
                fontSize: 15, lineHeight: 1.6, color: "#2e2b27",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Quick-add chips */}
          <div style={{ padding: "8px 18px", borderTop: "1px solid rgba(188,178,165,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#b0a89d", letterSpacing: "0.1em", marginRight: 2 }}>ADD</span>
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className="chip-btn"
                  onClick={() => appendChip(chip.text)}
                  style={{
                    padding: "4px 11px", borderRadius: 99,
                    border: "1px solid rgba(200,192,182,0.7)",
                    background: "rgba(255,255,255,0.65)",
                    color: "#5c5750", fontWeight: 700, fontSize: 12,
                    cursor: "pointer", transition: "all 0.12s",
                    fontFamily: "inherit",
                  }}
                >{chip.label}</button>
              ))}
            </div>
          </div>

          {/* Template row + controls */}
          <div style={{
            padding: "10px 18px 14px",
            borderTop: "1px solid rgba(188,178,165,0.18)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}>
            {/* Product templates */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#b0a89d", letterSpacing: "0.1em", marginRight: 2 }}>TEMPLATE</span>
              {PRODUCT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  className="tmpl-btn"
                  onClick={() => { setText(tpl.text); inputRef.current?.focus(); }}
                  style={{
                    padding: "4px 11px", borderRadius: 99,
                    border: "1px solid rgba(200,192,182,0.7)",
                    background: text === tpl.text ? "rgba(143,182,193,0.18)" : "rgba(255,255,255,0.55)",
                    color: text === tpl.text ? "#3e7080" : "#5c5750",
                    fontWeight: 700, fontSize: 12, cursor: "pointer",
                    transition: "all 0.12s", fontFamily: "inherit",
                  }}
                >{tpl.label}</button>
              ))}
            </div>

            {/* Depth + action buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {/* Depth toggle */}
              <div style={{
                display: "flex", borderRadius: 12,
                border: "1px solid rgba(197,190,180,0.7)",
                overflow: "hidden", background: "rgba(255,255,255,0.5)",
              }}>
                {[["quick","Quick"],["standard","Standard"],["deep","Deep"]].map(([value, label]) => {
                  const active = mode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      style={{
                        padding: "6px 13px",
                        border: "none",
                        borderRight: value !== "deep" ? "1px solid rgba(197,190,180,0.5)" : "none",
                        background: active ? "linear-gradient(180deg, #6f9199, #567a82)" : "transparent",
                        color: active ? "#fffdf8" : "#7f7a71",
                        fontWeight: 800, fontSize: 12, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >{label}</button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => { setText(""); setResult(null); setError(""); }}
                style={{
                  padding: "7px 13px", borderRadius: 11,
                  border: "1px solid rgba(197,190,180,0.7)",
                  background: "rgba(255,255,255,0.72)",
                  color: "#6f6a61", fontWeight: 700, fontSize: 12,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >Clear</button>

              <button
                type="button"
                disabled={loading || !text.trim()}
                className="run-btn"
                onClick={() => runAnalysis()}
                style={{
                  padding: "7px 18px", borderRadius: 11,
                  border: "1px solid #5a8188",
                  background: loading || !text.trim()
                    ? "linear-gradient(180deg, #a7b7bb, #95a4a8)"
                    : "linear-gradient(180deg, #6f9199, #567a82)",
                  color: "#fffdf8", fontWeight: 900, fontSize: 13,
                  cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                  boxShadow: loading || !text.trim() ? "none" : "0 6px 18px rgba(86,122,130,0.22)",
                  transition: "all 0.14s", fontFamily: "inherit",
                  letterSpacing: "0.01em",
                }}
              >{loading ? "Running…" : "Run analysis ⌘↵"}</button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              margin: "0 18px 14px", borderRadius: 12,
              border: "1px solid #e3c7cf", background: "#f9edf1",
              color: "#906878", padding: "11px 14px", fontSize: 13,
            }}>{error}</div>
          )}
        </div>

        {/* ── RESULTS ── */}
        {result && (
          <>
            {/* Standards section */}
            <div style={{
              borderRadius: 22,
              border: "1px solid rgba(183,175,163,0.28)",
              background: "rgba(255,255,255,0.62)",
              backdropFilter: "blur(18px)",
              overflow: "hidden",
            }}>
              {/* Section header */}
              <div style={{
                padding: "14px 18px 12px",
                borderBottom: "1px solid rgba(188,178,165,0.22)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#3a3630" }}>Applicable standards</span>
                  <span style={{
                    minWidth: 24, height: 22, padding: "0 8px", borderRadius: 99,
                    background: "#eef2f0", border: "1px solid #d6ddd8",
                    color: "#5b6862", fontWeight: 900, fontSize: 12,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>{filteredStandardGroups.length}</span>
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter standards…"
                  style={{
                    width: 200, borderRadius: 10,
                    border: "1px solid rgba(198,189,177,0.7)",
                    background: "rgba(255,255,255,0.8)",
                    padding: "7px 12px",
                    fontSize: 13, color: "#46413a", fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ padding: "12px 14px", display: "grid", gap: 8 }}>
                {!filteredStandardGroups.length
                  ? <EmptyState title="No standards shown" subtitle="Run analysis with a more detailed product description." />
                  : DIR_ORDER.filter((d) => standardsByDirective[d]?.length).map((directive) => (
                    <DirectiveLane
                      key={directive}
                      dirKey={directive}
                      groups={standardsByDirective[directive]}
                      expandedStandards={expandedStandards}
                      onToggleStandard={(key) => setExpandedStandards((prev) => ({ ...prev, [key]: !prev[key] }))}
                      defaultOpen={true}
                    />
                  ))
                }
              </div>
            </div>

            {/* Other findings */}
            <div style={{
              borderRadius: 22,
              border: "1px solid rgba(183,175,163,0.28)",
              background: "rgba(255,255,255,0.62)",
              backdropFilter: "blur(18px)",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "14px 18px 12px",
                borderBottom: "1px solid rgba(188,178,165,0.22)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#3a3630" }}>Other findings</span>
                <span style={{
                  minWidth: 24, height: 22, padding: "0 8px", borderRadius: 99,
                  background: "#eef2f0", border: "1px solid #d6ddd8",
                  color: "#5b6862", fontWeight: 900, fontSize: 12,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>{otherFindingsCount}</span>
              </div>

              <div style={{ padding: "12px 14px", display: "grid", gap: 8 }}>
                {!otherFindingsCount
                  ? <EmptyState title="No extra findings" subtitle="Scope findings, missing data prompts, and contradictions will appear here." />
                  : [...findingsBucket.missing, ...findingsBucket.contra, ...findingsBucket.other].map((finding) => (
                    <FindingRow key={`${finding._i}-${finding.article}-${finding.finding}`} finding={finding} />
                  ))
                }
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}