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

function statusRank(status = "INFO") {
  return { FAIL: 4, WARN: 3, PASS: 2, INFO: 1 }[status] || 1;
}

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
      map.set(key, {
        name,
        directives: [directive],
        statuses: [status],
        findings: [
          {
            finding: findingText,
            action: actionText,
            status,
          },
        ],
        actions: actionText ? [actionText] : [],
      });
      return;
    }

    const curr = map.get(key);
    curr.directives = unique([...curr.directives, directive]);
    curr.statuses = unique([...curr.statuses, status]);
    if (actionText) curr.actions = unique([...curr.actions, actionText]);
    curr.findings.push({
      finding: findingText,
      action: actionText,
      status,
    });
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function collectDirectiveCounts(groups = []) {
  const counts = {};
  groups.forEach((g) => {
    const d = g.directives?.[0] || "OTHER";
    counts[d] = (counts[d] || 0) + 1;
  });
  return counts;
}

function titleCase(s = "") {
  return String(s)
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function prettyDirectiveName(key = "OTHER") {
  return DIR_NAME[key] || titleCase(key);
}

function tagToneForSignal(signal = "neutral") {
  if (signal === "high") return { bg: "#f8eef1", bd: "#e6d0d6", tx: "#8b6474" };
  if (signal === "medium") return { bg: "#fbf5e8", bd: "#ecdcae", tx: "#9e7d36" };
  if (signal === "good") return { bg: "#eef4ee", bd: "#ccd7ca", tx: "#566554" };
  return { bg: "#eff5f5", bd: "#cadada", tx: "#517674" };
}

function Pill({ children, color = DIR.OTHER, dense = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: dense ? "5px 10px" : "8px 12px",
        borderRadius: 999,
        border: `1px solid ${color.ring}`,
        background: color.pill,
        color: color.ink,
        fontSize: dense ? 12 : 13,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 11,
          height: 11,
          borderRadius: 999,
          background: color.dot,
          boxShadow: `0 0 0 2px ${color.pill} inset`,
          flex: "0 0 auto",
        }}
      />
      {children}
    </span>
  );
}

function StatusPill({ status = "INFO" }) {
  const s = STS[status] || STS.INFO;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        borderRadius: 999,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.text,
        fontSize: 12,
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{s.icon}</span>
      {s.label}
    </span>
  );
}

function SectionCard({ title, subtitle, count, right, children }) {
  return (
    <section
      style={{
        background: "rgba(255,255,255,0.74)",
        border: "1px solid rgba(188,178,165,0.34)",
        borderRadius: 30,
        boxShadow: "0 20px 50px rgba(122,100,78,0.08)",
        backdropFilter: "blur(18px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "28px 30px 20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 18,
          borderBottom: "1px solid rgba(188,178,165,0.2)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                lineHeight: 1.1,
                color: "#5e5a50",
                fontWeight: 800,
              }}
            >
              {title}
            </h2>
            {typeof count === "number" ? (
              <span
                style={{
                  minWidth: 34,
                  height: 34,
                  padding: "0 10px",
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#eef2f0",
                  border: "1px solid #d6ddd8",
                  color: "#5b6862",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                {count}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p style={{ margin: "8px 0 0", color: "#8c897f", fontSize: 15 }}>{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      <div style={{ padding: "24px 28px 30px" }}>{children}</div>
    </section>
  );
}

function ExpandButton({ open, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        width: 42,
        height: 42,
        borderRadius: 999,
        border: "1px solid rgba(180,185,183,0.7)",
        background: "linear-gradient(180deg, #f6f8f7, #e7ebea)",
        color: "#5d6763",
        fontSize: 26,
        lineHeight: 1,
        cursor: "pointer",
        boxShadow: "0 8px 18px rgba(86,100,96,0.08)",
      }}
      aria-label={open ? "Collapse" : "Expand"}
      title={open ? "Collapse" : "Expand"}
    >
      {open ? "−" : "+"}
    </button>
  );
}

function StandardCard({ group, expanded, onToggle }) {
  const topStatus = priorityStatus(group.statuses);
  const tone = DIR[group.directives?.[0] || "OTHER"] || DIR.OTHER;

  return (
    <article
      style={{
        border: `1px solid ${tone.ring}`,
        borderRadius: 28,
        background: "rgba(255,255,255,0.78)",
        boxShadow: "0 14px 26px rgba(126,111,93,0.07)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "18px 18px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", minWidth: 0 }}>
          <Pill color={tone}>{group.directives?.[0] || "OTHER"} {prettyDirectiveName(group.directives?.[0] || "OTHER")}</Pill>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.14em", color: "#9b968b", fontWeight: 800 }}>
              STANDARD
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#2f2c28",
                fontWeight: 800,
                marginTop: 5,
                wordBreak: "break-word",
              }}
            >
              {group.name}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <StatusPill status={topStatus} />
          <ExpandButton open={expanded} onClick={onToggle} />
        </div>
      </div>

      {expanded ? (
        <div style={{ padding: "0 18px 18px" }}>
          <div
            style={{
              borderRadius: 24,
              border: "1px solid rgba(210,201,187,0.7)",
              background: "rgba(249,246,240,0.72)",
              padding: 18,
              display: "grid",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {group.directives.map((d) => (
                <Pill key={d} color={DIR[d] || DIR.OTHER} dense>
                  {d}
                </Pill>
              ))}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {group.findings.map((f, idx) => {
                const rowStatus = f.status || topStatus;
                const signal = rowStatus === "FAIL" ? "high" : rowStatus === "WARN" ? "medium" : rowStatus === "PASS" ? "good" : "neutral";
                const tagTone = tagToneForSignal(signal);
                return (
                  <div
                    key={`${group.name}-${idx}`}
                    style={{
                      borderRadius: 18,
                      border: "1px solid rgba(214,205,190,0.7)",
                      background: "rgba(255,255,255,0.8)",
                      padding: 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 800,
                          color: "#5d594f",
                          fontSize: 14,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: tagTone.tx,
                            display: "inline-block",
                          }}
                        />
                        Detail
                      </span>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: tagTone.bg,
                          border: `1px solid ${tagTone.bd}`,
                          color: tagTone.tx,
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        {rowStatus}
                      </span>
                    </div>
                    <div style={{ marginTop: 10, color: "#3a3732", fontSize: 15, fontWeight: 700 }}>
                      {f.finding || "No detail provided"}
                    </div>
                    {f.action ? (
                      <div style={{ marginTop: 8, color: "#7f7a71", fontSize: 14, lineHeight: 1.55 }}>
                        {f.action}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function FindingCard({ finding }) {
  const status = finding.status || "INFO";
  const signal = status === "FAIL" ? "high" : status === "WARN" ? "medium" : status === "PASS" ? "good" : "neutral";
  const tone = tagToneForSignal(signal);
  const directives = enrichDirectives(finding);

  return (
    <article
      style={{
        borderRadius: 24,
        border: "1px solid rgba(212,202,187,0.7)",
        background: "rgba(255,255,255,0.8)",
        padding: 18,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {directives.map((d) => (
            <Pill key={d} color={DIR[d] || DIR.OTHER} dense>
              {d}
            </Pill>
          ))}
        </div>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: tone.bg,
            border: `1px solid ${tone.bd}`,
            color: tone.tx,
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {status}
        </span>
      </div>

      <div style={{ color: "#4f4a43", fontSize: 12, letterSpacing: "0.14em", fontWeight: 800 }}>
        {finding.article || "Finding"}
      </div>
      <div style={{ color: "#2f2c28", fontSize: 16, fontWeight: 800 }}>
        {finding.finding || "No detail provided"}
      </div>
      {finding.action ? (
        <div style={{ color: "#7f7a71", fontSize: 14, lineHeight: 1.55 }}>{finding.action}</div>
      ) : null}
    </article>
  );
}

function BucketSummary({ title, count, colorKey = "OTHER" }) {
  const tone = DIR[colorKey] || DIR.OTHER;
  return (
    <div
      style={{
        borderRadius: 24,
        border: `1px solid ${tone.ring}`,
        background: "rgba(255,255,255,0.76)",
        padding: 20,
        boxShadow: "0 12px 26px rgba(126,111,93,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: tone.dot,
            display: "inline-block",
          }}
        />
        <div style={{ color: "#6a655d", fontSize: 13, fontWeight: 800, letterSpacing: "0.12em" }}>{title}</div>
      </div>
      <div style={{ marginTop: 14, color: "#2f2c28", fontWeight: 900, fontSize: 52, lineHeight: 1 }}>{count}</div>
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div
      style={{
        borderRadius: 24,
        border: "1px dashed rgba(186,176,160,0.8)",
        background: "rgba(250,247,242,0.75)",
        padding: 24,
        color: "#807b73",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: "#59544c" }}>{title}</div>
      {subtitle ? <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>{subtitle}</div> : null}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("standard");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedStandards, setExpandedStandards] = useState({});
  const [search, setSearch] = useState("");
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
        body: JSON.stringify({
          description: trimmed,
          depth: mode,
          category: "",
          directives: [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || "Analysis failed");
      }

      setResult(data);

const initialExpanded = {};
[...(data.standards || []), ...(data.review_items || [])].forEach((row) => {
  const key = normalizeStdName(row.code || row.title || "Unnamed item");
  initialExpanded[key] = true;
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
    if (inputRef.current && window.innerWidth > 900) {
      inputRef.current.focus();
    }
  }, []);

  const findingsBucket = useMemo(() => splitFindings(result?.findings || []), [result]);

  const standardGroups = useMemo(() => {
    return buildGroupsFromBackendItems(result?.standards || [], result?.review_items || []);
  }, [result]);

  const filteredStandardGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return standardGroups;
    return standardGroups.filter((g) => {
      const hay = [g.name, ...(g.directives || []), ...(g.actions || []), ...(g.findings || []).map((f) => `${f.finding || ""} ${f.action || ""}`)]
        .join(" ")
        .toLowerCase();
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

  const directiveCounts = useMemo(() => collectDirectiveCounts(filteredStandardGroups), [filteredStandardGroups]);

  const topRisk = useMemo(() => {
    const statuses = [
      ...(result?.findings || []).map((f) => f.status).filter(Boolean),
      ...standardGroups.flatMap((g) => g.statuses || []),
    ];
    return priorityStatus(statuses);
  }, [result, standardGroups]);

  const summaryCards = [
    { title: "Applicable buckets", count: Object.keys(standardsByDirective).length, colorKey: "SYSTEM" },
    { title: "Applicable standards", count: standardGroups.length, colorKey: "LVD" },
    {
      title: "Other findings",
      count: findingsBucket.other.length + findingsBucket.missing.length + findingsBucket.contra.length,
      colorKey: topRisk === "FAIL" ? "RED_CYBER" : topRisk === "WARN" ? "ROHS" : "EMC",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(133,176,190,0.22), transparent 26%), radial-gradient(circle at top right, rgba(204,189,148,0.18), transparent 22%), linear-gradient(180deg, #ddd7cf 0%, #d4cdc4 100%)",
        padding: "32px 18px 80px",
        color: "#3d3832",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 22 }}>
        <section
          style={{
            borderRadius: 34,
            border: "1px solid rgba(183,175,163,0.34)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(246,242,236,0.72))",
            boxShadow: "0 24px 60px rgba(111,95,76,0.10)",
            backdropFilter: "blur(18px)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "26px 28px 18px",
              display: "flex",
              gap: 18,
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 20,
                    background: "linear-gradient(135deg, #8fb6c1, #5d848f)",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    fontSize: 28,
                    boxShadow: "0 10px 24px rgba(82,120,130,0.18)",
                  }}
                >
                  RC
                </div>
                <div>
                  <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: "#fffdf8" }}>RegCheck</div>
                  <div style={{ marginTop: 6, fontSize: 16, color: "rgba(255,253,248,0.88)" }}>
                    Modern compliance scoping workspace
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Pill color={DIR.SYSTEM}>Version 3</Pill>
              <Pill color={topRisk === "FAIL" ? DIR.RED_CYBER : topRisk === "WARN" ? DIR.ROHS : DIR.EMC}>
                Risk {topRisk}
              </Pill>
              <Pill color={DIR.LVD}>{standardGroups.length} standards</Pill>
            </div>
          </div>

          <div style={{ padding: "0 20px 20px" }}>
            <div
              style={{
                borderRadius: 30,
                border: "1px solid rgba(203,194,180,0.36)",
                background: "rgba(255,255,255,0.6)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
                padding: 10,
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#5b564e" }}>Describe the product</div>
                  <div style={{ marginTop: 6, color: "#8c877d", fontSize: 14 }}>
                    The more concrete the description, the more complete the legislation and standard scope.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    ["quick", "Quick"],
                    ["standard", "Standard"],
                    ["deep", "Deep"],
                  ].map(([value, label]) => {
                    const active = mode === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: 16,
                          border: active ? "1px solid #76939a" : "1px solid rgba(197,190,180,0.7)",
                          background: active ? "linear-gradient(180deg, #6f9199, #567a82)" : "rgba(255,255,255,0.72)",
                          color: active ? "#fffdf8" : "#6f6a61",
                          fontWeight: 800,
                          fontSize: 14,
                          cursor: "pointer",
                          boxShadow: active ? "0 12px 24px rgba(86,122,130,0.16)" : "none",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Example: Smart air fryer with Wi-Fi app control, mains powered, OTA updates, cloud recipe sync, and food-contact basket coating."
                style={{
                  width: "100%",
                  minHeight: 146,
                  resize: "vertical",
                  borderRadius: 24,
                  border: "1px solid rgba(198,189,177,0.7)",
                  background: "rgba(255,255,255,0.72)",
                  padding: "18px 20px",
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: "#413d37",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <div
                style={{
                  borderRadius: 22,
                  border: "1px solid rgba(218,211,201,0.8)",
                  background: "rgba(255,255,255,0.48)",
                  padding: 14,
                }}
              >
                <div style={{ color: "#837d73", fontSize: 12, fontWeight: 900, letterSpacing: "0.12em" }}>
                  SUGGESTED NEXT DETAILS
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  {["Heating element", "Display / timer", "Bluetooth / Wi-Fi", "Battery", "Food-contact material", "Cloud account"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const add = text.trim().endsWith(".") || !text.trim() ? chip.toLowerCase() : `, ${chip.toLowerCase()}`;
                        setText((t) => `${t}${add}`);
                      }}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 999,
                        border: "1px solid rgba(203,197,188,0.9)",
                        background: "rgba(255,255,255,0.82)",
                        color: "#58534b",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ color: "#868177", fontSize: 14 }}>Pick product type first, then enrich only the relevant details.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setText(SAMPLE)}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 16,
                      border: "1px solid rgba(197,190,180,0.8)",
                      background: "rgba(255,255,255,0.82)",
                      color: "#5f5a52",
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Load sample
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setText("");
                      setResult(null);
                      setError("");
                    }}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 16,
                      border: "1px solid rgba(197,190,180,0.8)",
                      background: "rgba(255,255,255,0.82)",
                      color: "#5f5a52",
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    disabled={loading || !text.trim()}
                    onClick={() => runAnalysis()}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 16,
                      border: "1px solid #5a8188",
                      background: loading || !text.trim() ? "linear-gradient(180deg, #a7b7bb, #95a4a8)" : "linear-gradient(180deg, #6f9199, #567a82)",
                      color: "#fffdf8",
                      fontWeight: 900,
                      fontSize: 14,
                      cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                      boxShadow: loading || !text.trim() ? "none" : "0 12px 24px rgba(86,122,130,0.18)",
                    }}
                  >
                    {loading ? "Running..." : "Run analysis"}
                  </button>
                </div>
              </div>

              {error ? (
                <div
                  style={{
                    borderRadius: 18,
                    border: "1px solid #e3c7cf",
                    background: "#f9edf1",
                    color: "#906878",
                    padding: "14px 16px",
                    fontSize: 14,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
          }}
        >
          {summaryCards.map((card) => (
            <BucketSummary key={card.title} title={card.title} count={card.count} colorKey={card.colorKey} />
          ))}
        </div>

        <SectionCard
          title="Applicable standards"
          subtitle="Grouped by legislation bucket for easier scanning"
          count={filteredStandardGroups.length}
          right={
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search standards or notes"
              style={{
                width: 240,
                maxWidth: "100%",
                borderRadius: 16,
                border: "1px solid rgba(198,189,177,0.7)",
                background: "rgba(255,255,255,0.8)",
                padding: "11px 14px",
                fontSize: 14,
                color: "#46413a",
                outline: "none",
              }}
            />
          }
        >
          {!filteredStandardGroups.length ? (
            <EmptyState
              title="No standards shown"
              subtitle="Run the analysis and add a more concrete product description if you expect standards to appear."
            />
          ) : (
            <div style={{ display: "grid", gap: 22 }}>
              {DIR_ORDER.filter((d) => standardsByDirective[d]?.length).map((directive) => (
                <div key={directive} style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <Pill color={DIR[directive] || DIR.OTHER}>{directive} {prettyDirectiveName(directive)}</Pill>
                    <div style={{ color: "#6d685f", fontWeight: 800, fontSize: 18 }}>{prettyDirectiveName(directive)}</div>
                    <span
                      style={{
                        minWidth: 38,
                        height: 38,
                        padding: "0 12px",
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#eef2f0",
                        border: "1px solid #d6ddd8",
                        color: "#58655f",
                        fontWeight: 900,
                        fontSize: 16,
                      }}
                    >
                      {directiveCounts[directive] || 0}
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 14 }}>
                    {standardsByDirective[directive].map((group) => {
                      const key = `${directive}::${group.name}`;
                      const expanded = !!expandedStandards[key];
                      return (
                        <StandardCard
                          key={key}
                          group={group}
                          expanded={expanded}
                          onToggle={() =>
                            setExpandedStandards((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Other findings"
          subtitle="Only non-standard findings are shown here"
          count={findingsBucket.other.length + findingsBucket.missing.length + findingsBucket.contra.length}
        >
          {!(findingsBucket.other.length + findingsBucket.missing.length + findingsBucket.contra.length) ? (
            <EmptyState title="No extra findings" subtitle="Scope findings, missing data prompts, and contradictions will appear here." />
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {[...findingsBucket.missing, ...findingsBucket.contra, ...findingsBucket.other].map((finding) => (
                <FindingCard key={`${finding._i}-${finding.article}-${finding.finding}`} finding={finding} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}