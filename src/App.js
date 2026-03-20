import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ANALYZE_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";
const METADATA_URL = ANALYZE_URL.replace(/\/analyze$/, "/metadata/options");

const T = {
  bg: "#0d0f14",
  panel: "#151924",
  panel2: "#1a2030",
  card: "#1a2030",
  soft: "rgba(255,255,255,0.05)",
  softer: "rgba(255,255,255,0.035)",
  line: "rgba(255,255,255,0.08)",
  lineStrong: "rgba(255,255,255,0.14)",
  text: "#f2f4fb",
  textSub: "#c3c9da",
  textMuted: "#8d95ab",
  blue: "#63acff",
  teal: "#38c9b0",
  violet: "#b78cff",
  amber: "#f4c15d",
  green: "#56d38b",
  red: "#fb7185",
  shadow: "0 10px 34px rgba(0,0,0,0.34)",
};

const DIR_SHORT = {
  LVD: "LVD",
  EMC: "EMC",
  RED: "RED",
  RED_CYBER: "RED Cyber",
  CRA: "CRA",
  ROHS: "RoHS",
  REACH: "REACH",
  GDPR: "GDPR",
  AI_Act: "AI Act",
  ESPR: "ESPR",
  ECO: "Ecodesign",
  BATTERY: "Battery",
  FCM: "FCM",
  FCM_PLASTIC: "FCM Plastic",
  MD: "MD",
  MACH_REG: "Machinery Reg.",
  OTHER: "Other",
};

const DIR_ORDER = [
  "LVD",
  "EMC",
  "RED",
  "RED_CYBER",
  "ROHS",
  "REACH",
  "GDPR",
  "FCM",
  "FCM_PLASTIC",
  "BATTERY",
  "ECO",
  "ESPR",
  "CRA",
  "AI_Act",
  "MD",
  "MACH_REG",
  "OTHER",
];

const DIR_TONES = {
  LVD: { dot: "#67df9d", bg: "rgba(103,223,157,0.12)", bd: "rgba(103,223,157,0.24)", text: "#8cecb4" },
  EMC: { dot: "#67d7ff", bg: "rgba(103,215,255,0.12)", bd: "rgba(103,215,255,0.24)", text: "#89e2ff" },
  RED: { dot: "#63acff", bg: "rgba(99,172,255,0.12)", bd: "rgba(99,172,255,0.24)", text: "#90c5ff" },
  RED_CYBER: { dot: "#b78cff", bg: "rgba(183,140,255,0.12)", bd: "rgba(183,140,255,0.24)", text: "#d0b5ff" },
  CRA: { dot: "#56d38b", bg: "rgba(86,211,139,0.12)", bd: "rgba(86,211,139,0.24)", text: "#8de7b0" },
  ROHS: { dot: "#f4c15d", bg: "rgba(244,193,93,0.12)", bd: "rgba(244,193,93,0.24)", text: "#ffd78b" },
  REACH: { dot: "#f2a869", bg: "rgba(242,168,105,0.12)", bd: "rgba(242,168,105,0.24)", text: "#ffc796" },
  GDPR: { dot: "#38c9b0", bg: "rgba(56,201,176,0.12)", bd: "rgba(56,201,176,0.24)", text: "#79e2d0" },
  AI_Act: { dot: "#a98cff", bg: "rgba(169,140,255,0.12)", bd: "rgba(169,140,255,0.24)", text: "#c8b5ff" },
  ESPR: { dot: "#f5b15d", bg: "rgba(245,177,93,0.12)", bd: "rgba(245,177,93,0.24)", text: "#ffd091" },
  ECO: { dot: "#79d48f", bg: "rgba(121,212,143,0.12)", bd: "rgba(121,212,143,0.24)", text: "#9fe5af" },
  BATTERY: { dot: "#b8db57", bg: "rgba(184,219,87,0.12)", bd: "rgba(184,219,87,0.24)", text: "#d5ef94" },
  FCM: { dot: "#f39bc5", bg: "rgba(243,155,197,0.12)", bd: "rgba(243,155,197,0.24)", text: "#ffc0dd" },
  FCM_PLASTIC: { dot: "#f39bc5", bg: "rgba(243,155,197,0.12)", bd: "rgba(243,155,197,0.24)", text: "#ffc0dd" },
  MD: { dot: "#a8c6ff", bg: "rgba(168,198,255,0.12)", bd: "rgba(168,198,255,0.24)", text: "#cadeff" },
  MACH_REG: { dot: "#a8c6ff", bg: "rgba(168,198,255,0.12)", bd: "rgba(168,198,255,0.24)", text: "#cadeff" },
  OTHER: { dot: "#9ca3b7", bg: "rgba(156,163,183,0.12)", bd: "rgba(156,163,183,0.24)", text: "#c1c7d8" },
};

const DEFAULT_TEMPLATES = [
  {
    label: "Coffee machine",
    text: "Connected espresso machine with mains power, Wi-Fi radio, app control, OTA updates, cloud account, grinder, pressure, water tank, and food-contact brew path.",
  },
  {
    label: "Electric kettle",
    text: "Electric kettle with mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi radio control.",
  },
  {
    label: "Air purifier",
    text: "Smart air purifier with mains power, motorized fan, electronic controls, Wi-Fi radio, app control, networked standby, and OTA firmware updates.",
  },
  {
    label: "Robot vacuum",
    text: "Robot vacuum cleaner with rechargeable lithium battery, Wi-Fi and Bluetooth radio, cloud account, OTA firmware updates, LiDAR navigation, and camera.",
  },
];

function titleCase(input) {
  return String(input || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function directiveTone(key) {
  return DIR_TONES[key] || DIR_TONES.OTHER;
}

function directiveShort(key) {
  return DIR_SHORT[key] || titleCase(key);
}

function directiveRank(key) {
  const rank = DIR_ORDER.indexOf(key || "OTHER");
  return rank === -1 ? 999 : rank;
}

function normalizeStandardDirective(item) {
  const code = String(item?.code || "").toUpperCase();
  if (code.startsWith("EN 18031-")) return "RED_CYBER";
  return item?.directive || item?.legislation_key || "OTHER";
}

function uniqueBy(items, getKey) {
  const map = new Map();
  (items || []).forEach((item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
}

function prettyValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function joinText(base, addition) {
  const a = String(base || "").trim();
  const b = String(addition || "").trim();
  if (!b) return a;
  if (!a) return b;
  if (a.toLowerCase().includes(b.toLowerCase())) return a;
  return `${a}${/[.,;:]$/.test(a) ? " " : ", "}${b}`;
}

function buildDynamicTemplates(products) {
  const lookup = new Map((products || []).map((p) => [p.id, p]));
  const templates = [];

  function add(productId, suffix, labelOverride) {
    const product = lookup.get(productId);
    if (!product) return;
    templates.push({
      label: labelOverride || product.label,
      text: `${product.label} with ${suffix}.`,
    });
  }

  add(
    "coffee_machine",
    "mains power, heating, water tank, grinder, food-contact brew path, Wi-Fi radio, app control, cloud account, and OTA updates",
    "Coffee machine",
  );
  add(
    "electric_kettle",
    "mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi radio control",
    "Electric kettle",
  );
  add(
    "air_purifier",
    "mains power, motorized fan, sensor electronics, Wi-Fi radio, app control, and OTA updates",
    "Air purifier",
  );
  add(
    "robot_vacuum",
    "rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, camera, and LiDAR navigation",
    "Robot vacuum",
  );
  add(
    "robot_vacuum_cleaner",
    "rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, camera, and LiDAR navigation",
    "Robot vacuum",
  );

  return uniqueBy(templates.length ? templates : DEFAULT_TEMPLATES, (x) => x.label).slice(0, 4);
}

function buildGuidedChips(metadata, result) {
  const productId = result?.product_type;
  const product = (metadata?.products || []).find((item) => item.id === productId);
  const traits = new Set(result?.all_traits || []);
  const missingItems = result?.missing_information_items || [];
  const chips = [];

  const push = (label, text) => {
    if (!label || !text) return;
    if (!chips.some((item) => item.text === text)) chips.push({ label, text });
  };

  missingItems.forEach((item) => {
    (item.examples || []).slice(0, 1).forEach((example) => push(titleCase(item.key), example));
  });

  if (product?.implied_traits?.includes("food_contact") || traits.has("food_contact")) {
    push("Food contact", "food-contact plastics or coatings");
    push("Water path", "wetted path materials");
  }
  if (traits.has("radio") || traits.has("app_control") || traits.has("cloud") || traits.has("ota")) {
    push("Wi-Fi", "Wi-Fi radio");
    push("OTA", "OTA firmware updates");
  }
  if (traits.has("internet") || traits.has("cloud")) {
    push("Cloud", "cloud account required");
  }
  if (traits.has("account")) {
    push("Login", "user account login or password authentication");
  }
  if (traits.has("monetary_transaction")) {
    push("Payments", "subscriptions or payments through the product or app");
  }
  if (traits.has("battery_powered")) push("Battery", "rechargeable lithium battery");
  if (traits.has("camera")) push("Camera", "integrated camera");
  if (traits.has("microphone")) push("Microphone", "microphone or voice input");

  if (!chips.length) {
    push("Mains", "230 V mains powered");
    push("Consumer", "consumer household use");
    push("App", "mobile app control");
    push("Wi-Fi", "Wi-Fi radio");
  }

  return chips.slice(0, 8);
}

function buildCompactLegislationItems(result) {
  const sections = result?.legislation_sections || [];
  const allItems = sections.flatMap((section) =>
    (section.items || []).map((item) => ({
      ...item,
      section_key: section.key,
    })),
  );

  return uniqueBy(
    [...allItems].sort(
      (a, b) =>
        directiveRank(a.directive_key) - directiveRank(b.directive_key) ||
        String(a.code || "").localeCompare(String(b.code || "")),
    ),
    (item) => `${item.code}-${item.directive_key}`,
  );
}

function buildDirectiveBreakdown(result) {
  const sections = result?.standard_sections || [];
  const counts = {};
  sections.forEach((section) => {
    (section.items || []).forEach((item) => {
      const dir = normalizeStandardDirective(item);
      counts[dir] = (counts[dir] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => directiveRank(a[0]) - directiveRank(b[0]))
    .map(([key, count]) => ({ key, count }));
}

function sortStandardSections(sections) {
  return [...(sections || [])].sort((a, b) => directiveRank(a.key) - directiveRank(b.key));
}

function sortStandardItems(items) {
  return [...(items || [])].sort((a, b) => {
    const aDir = normalizeStandardDirective(a);
    const bDir = normalizeStandardDirective(b);
    return directiveRank(aDir) - directiveRank(bDir) || String(a.code || "").localeCompare(String(b.code || ""));
  });
}

function standardTags(item) {
  return uniqueBy(
    [
      item.category ? titleCase(item.category) : null,
      item.standard_family || null,
      item.item_type === "review" ? "Review" : null,
      item.harmonization_status ? titleCase(item.harmonization_status) : null,
    ].filter(Boolean),
    (x) => x,
  ).slice(0, 4);
}

function Card({ children, style }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${T.line}`,
        background: T.panel,
        boxShadow: T.shadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div
      style={{
        padding: "16px 18px 12px",
        borderBottom: `1px solid ${T.line}`,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{title}</div>
        {subtitle ? (
          <div style={{ marginTop: 4, fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>{subtitle}</div>
        ) : null}
      </div>
      {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
    </div>
  );
}

function DirPill({ dirKey }) {
  const tone = directiveTone(dirKey);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        borderRadius: 999,
        border: `1px solid ${tone.bd}`,
        background: tone.bg,
        color: tone.text,
        padding: "5px 11px",
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: tone.dot }} />
      {directiveShort(dirKey)}
    </span>
  );
}

function TinyTag({ children, tone = "neutral" }) {
  const styles =
    tone === "blue"
      ? { bg: "rgba(99,172,255,0.12)", bd: "rgba(99,172,255,0.22)", text: T.blue }
      : tone === "violet"
        ? { bg: "rgba(183,140,255,0.12)", bd: "rgba(183,140,255,0.22)", text: T.violet }
        : { bg: "rgba(255,255,255,0.06)", bd: T.line, text: T.textSub };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        border: `1px solid ${styles.bd}`,
        background: styles.bg,
        color: styles.text,
        padding: "4px 9px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, onClick, disabled, primary = false, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        borderRadius: 12,
        border: primary ? "none" : `1px solid ${T.lineStrong}`,
        background: primary
          ? "linear-gradient(135deg, #63acff, #38c9b0)"
          : "rgba(255,255,255,0.05)",
        color: primary ? "#071018" : T.text,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 800,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Topbar({ result, onReset }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: 56,
        borderBottom: `1px solid ${T.line}`,
        background: "rgba(13,15,20,0.86)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            background: "linear-gradient(135deg, #63acff, #38c9b0)",
            display: "grid",
            placeItems: "center",
            color: "#071018",
            fontWeight: 900,
            fontSize: 14,
          }}
        >
          ⬡
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: T.text, letterSpacing: "-0.02em" }}>RuleGrid</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {result?.overall_risk ? <TinyTag tone="blue">{result.overall_risk} Risk</TinyTag> : null}
        {result ? (
          <Button onClick={onReset} style={{ padding: "9px 12px" }}>
            New analysis
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Hero({ result }) {
  const summary = result?.summary;
  const product = result?.product_type ? titleCase(result.product_type) : null;
  const confidence = result?.product_match_confidence ? titleCase(result.product_match_confidence) : null;

  return (
    <Card
      style={{
        background: "linear-gradient(145deg, #151924, #181d2b)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "22px 20px" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <TinyTag tone="blue">EU regulatory scoping</TinyTag>
            {product ? <TinyTag>{product}</TinyTag> : null}
            {confidence ? <TinyTag>{confidence} confidence</TinyTag> : null}
          </div>

          <div style={{ fontSize: 30, fontWeight: 900, color: T.text, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
            Standards route first
          </div>

          <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, maxWidth: 860 }}>
            {summary ||
              "Describe the product to generate the standards route, applicable legislation, and compact guidance for missing details."}
          </div>
        </div>
      </div>
    </Card>
  );
}

function InputComposer({
  description,
  setDescription,
  templates,
  chips,
  onAnalyze,
  busy,
  onDirty,
}) {
  return (
    <Card>
      <SectionHeader
        title="Describe the product"
        subtitle="Product type, connectivity, power source, key functions, sensors, food-contact path, battery, login, or payments."
      />
      <div style={{ padding: 16, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {templates.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => {
                setDescription(template.text);
                onDirty(true);
              }}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(99,172,255,0.22)",
                background: "rgba(99,172,255,0.08)",
                color: T.blue,
                padding: "7px 12px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {template.label}
            </button>
          ))}
        </div>

        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            onDirty(true);
          }}
          rows={7}
          placeholder="Example: Connected espresso machine with Wi-Fi radio, OTA updates, cloud account, user login, mains power, grinder, pressure system, and food-contact brew path."
          style={{
            width: "100%",
            resize: "vertical",
            minHeight: 170,
            borderRadius: 14,
            border: `1px solid ${T.lineStrong}`,
            background: "rgba(0,0,0,0.18)",
            color: T.text,
            padding: "14px 15px",
            fontSize: 14,
            lineHeight: 1.7,
            outline: "none",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {chips.slice(0, 8).map((chip) => (
            <button
              key={chip.label + chip.text}
              type="button"
              onClick={() => {
                setDescription((current) => joinText(current, chip.text));
                onDirty(true);
              }}
              style={{
                borderRadius: 999,
                border: `1px solid ${T.line}`,
                background: "rgba(255,255,255,0.04)",
                color: T.textSub,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + {chip.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button primary onClick={onAnalyze} disabled={busy || !description.trim()}>
            {busy ? "Analyzing..." : "Analyze product"}
          </Button>
          <Button
            onClick={() => {
              setDescription("");
              onDirty(true);
            }}
            disabled={!description}
          >
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}

function QuickGuidance({ result, dirty, busy, onApply, onRefresh }) {
  const missing = result?.missing_information_items || [];
  const compact = uniqueBy(
    missing.flatMap((item) =>
      (item.examples || []).slice(0, 1).map((example) => ({
        key: item.key,
        label: titleCase(item.key),
        text: example,
      })),
    ),
    (item) => item.text,
  ).slice(0, 4);

  if (!result || (!compact.length && !dirty)) return null;

  return (
    <Card>
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
          <TinyTag tone="violet">Guidance</TinyTag>
          <span style={{ fontSize: 12, color: T.textMuted }}>
            Add one detail only if it changes scope.
          </span>
          {compact.map((item) => (
            <button
              key={item.text}
              type="button"
              onClick={() => onApply(item.text)}
              style={{
                borderRadius: 999,
                border: `1px solid ${T.line}`,
                background: "rgba(255,255,255,0.04)",
                color: T.textSub,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + {item.label}
            </button>
          ))}
        </div>

        {dirty ? (
          <Button onClick={onRefresh} disabled={busy} style={{ padding: "8px 12px" }}>
            {busy ? "Updating..." : "Refresh route"}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function StandardsTopBar({ result, onReset, onRerun, busy, disabled }) {
  const breakdown = buildDirectiveBreakdown(result);

  return (
    <Card>
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>Standards route</div>
          {breakdown.map(({ key, count }) => (
            <span
              key={key}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                borderRadius: 999,
                border: `1px solid ${directiveTone(key).bd}`,
                background: directiveTone(key).bg,
                color: directiveTone(key).text,
                padding: "5px 10px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: directiveTone(key).dot }} />
              {directiveShort(key)} · {count}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button onClick={onRerun} disabled={busy || disabled}>
            Re-run
          </Button>
          <Button onClick={onReset}>New analysis</Button>
        </div>
      </div>
    </Card>
  );
}

function StandardCard({ item }) {
  const dirKey = normalizeStandardDirective(item);
  const tone = directiveTone(dirKey);
  const summary = item.standard_summary || item.reason || item.notes || item.title;
  const tags = standardTags(item);

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${tone.bd}`,
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.025))",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "15px 16px 12px",
          borderBottom: `1px solid ${T.line}`,
          background: `linear-gradient(135deg, ${tone.bg}, transparent)`,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <DirPill dirKey={dirKey} />
            {tags.map((tag) => (
              <TinyTag key={tag}>{tag}</TinyTag>
            ))}
          </div>

          <div
            style={{
              borderRadius: 10,
              background: tone.dot,
              color: "#071018",
              padding: "7px 11px",
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {item.code}
          </div>
        </div>

        <div style={{ fontSize: 17, fontWeight: 900, color: T.text, lineHeight: 1.28 }}>{item.title}</div>
        <div style={{ fontSize: 13.5, color: T.textSub, lineHeight: 1.7 }}>{summary}</div>
      </div>

      <div className="meta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, padding: 14 }}>
        <MetaBox label="Harmonized Reference" value={prettyValue(item.harmonized_reference)} />
        <MetaBox
          label="Evidence Expected"
          value={prettyValue((item.evidence_hint || []).join(" · "))}
        />
        <MetaBox label="Harmonized Version" value={prettyValue(item.dated_version)} />
        <MetaBox label="EU Latest Version" value={prettyValue(item.version)} />
      </div>
    </div>
  );
}

function MetaBox({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${T.line}`,
        background: T.softer,
        padding: "11px 12px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          color: T.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function StandardsSection({ result }) {
  const sections = sortStandardSections(result?.standard_sections || []);
  if (!sections.length) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {sections.map((section) => {
        const tone = directiveTone(section.key);
        const items = sortStandardItems(section.items || []);
        return (
          <Card key={section.key} style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "15px 16px 12px",
                borderBottom: `1px solid ${T.line}`,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                background: `linear-gradient(135deg, ${tone.bg}, transparent)`,
              }}
            >
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <DirPill dirKey={section.key} />
                  <span style={{ fontSize: 15, fontWeight: 900, color: T.text }}>{section.title || directiveShort(section.key)}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: T.textMuted }}>
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            <div style={{ padding: 16, display: "grid", gap: 12 }}>
              {items.map((item) => (
                <StandardCard key={`${section.key}-${item.code}-${item.title}`} item={item} />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function MinimalSidebar({ result }) {
  if (!result) return null;
  const items = buildCompactLegislationItems(result);

  return (
    <div className="sidebar-col" style={{ display: "grid", gap: 12 }}>
      <Card>
        <SectionHeader
          title="Applicable legislation"
          subtitle="Auxiliary overview"
        />
        <div style={{ padding: 12, display: "grid", gap: 8 }}>
          {items.map((item) => {
            const tone = directiveTone(item.directive_key || "OTHER");
            return (
              <div
                key={`${item.code}-${item.directive_key}`}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${tone.bd}`,
                  background: tone.bg,
                  padding: "10px 11px",
                  display: "grid",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: tone.dot }} />
                  <span style={{ fontSize: 12, fontWeight: 900, color: tone.text }}>{item.code}</span>
                </div>
                <div style={{ fontSize: 11.5, color: T.textSub, lineHeight: 1.45 }}>{item.title}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function DiagnosticsPanel({ result }) {
  const [open, setOpen] = useState(false);
  const diagnostics = result?.diagnostics || [];
  if (!diagnostics.length) return null;

  return (
    <Card>
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Diagnostics</div>
        <Button onClick={() => setOpen((v) => !v)} style={{ padding: "8px 12px" }}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      {open ? (
        <div style={{ padding: "0 14px 14px", display: "grid", gap: 7 }}>
          {diagnostics.slice(0, 40).map((line, idx) => (
            <div
              key={idx}
              style={{
                borderLeft: `2px solid ${T.lineStrong}`,
                paddingLeft: 10,
                fontSize: 12,
                color: T.textSub,
                lineHeight: 1.6,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <div style={{ padding: "34px 24px", display: "grid", gap: 12, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>Ready for analysis</div>
        <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, maxWidth: 700, margin: "0 auto" }}>
          The main output is the standards route. Add the product description above and analyze to generate the cards.
        </div>
      </div>
    </Card>
  );
}

export default function App() {
  const [metadata, setMetadata] = useState(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clarifyDirty, setClarifyDirty] = useState(false);
  const topRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      try {
        const res = await fetch(METADATA_URL);
        if (!res.ok) throw new Error(`Metadata request failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setMetadata(data);
      } catch {
        if (!cancelled) setMetadata({ products: [], traits: [], legislations: [] });
      }
    }

    loadMetadata();
    return () => {
      cancelled = true;
    };
  }, []);

  const templates = useMemo(() => buildDynamicTemplates(metadata?.products), [metadata]);

  const chips = useMemo(() => {
    const backend = (result?.suggested_quick_adds || []).map((item) => ({
      label: titleCase(item.label),
      text: item.text,
    }));
    const frontend = buildGuidedChips(metadata, result);
    return uniqueBy([...backend, ...frontend], (item) => item.text).slice(0, 8);
  }, [metadata, result]);

  const runAnalysis = useCallback(async () => {
    const payloadDescription = String(description || "").trim();
    if (!payloadDescription) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: payloadDescription, depth: "deep" }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || `Analysis failed (${response.status})`);

      setResult(data);
      setClarifyDirty(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err?.message || "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }, [description]);

  const resetToFrontpage = useCallback(() => {
    setDescription("");
    setResult(null);
    setError("");
    setClarifyDirty(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div ref={topRef} style={{ minHeight: "100vh", background: T.bg }}>
      <style>{globalCss}</style>

      <Topbar result={result} onReset={resetToFrontpage} />

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "18px 16px 40px" }}>
        <div className="page-grid">
          <main style={{ display: "grid", gap: 14, minWidth: 0 }}>
            <Hero result={result} />

            <InputComposer
              description={description}
              setDescription={setDescription}
              templates={templates}
              chips={chips}
              onAnalyze={runAnalysis}
              busy={busy}
              onDirty={setClarifyDirty}
            />

            {error ? (
              <Card style={{ borderColor: "rgba(251,113,133,0.24)", background: "rgba(251,113,133,0.07)" }}>
                <div style={{ padding: 14, fontSize: 13, color: "#ffb2bf", lineHeight: 1.6 }}>{error}</div>
              </Card>
            ) : null}

            {result ? (
              <>
                <QuickGuidance
                  result={result}
                  dirty={clarifyDirty}
                  busy={busy}
                  onApply={(text) => {
                    setDescription((current) => joinText(current, text));
                    setClarifyDirty(true);
                  }}
                  onRefresh={runAnalysis}
                />

                <StandardsTopBar
                  result={result}
                  onReset={resetToFrontpage}
                  onRerun={runAnalysis}
                  busy={busy}
                  disabled={!description.trim()}
                />

                <StandardsSection result={result} />
                <DiagnosticsPanel result={result} />
              </>
            ) : (
              <EmptyState />
            )}
          </main>

          <MinimalSidebar result={result} />
        </div>
      </div>
    </div>
  );
}

const globalCss = `
  * { box-sizing: border-box; }
  html, body, #root {
    margin: 0;
    padding: 0;
    min-height: 100%;
    background: ${T.bg};
    color: ${T.text};
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  button, input, textarea, select { font: inherit; }
  textarea::placeholder { color: ${T.textMuted}; }

  .page-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 270px;
    gap: 16px;
    align-items: start;
  }

  .sidebar-col {
    position: sticky;
    top: 72px;
    align-self: start;
  }

  @media (max-width: 1100px) {
    .page-grid {
      grid-template-columns: 1fr;
    }
    .sidebar-col {
      position: static;
      top: auto;
    }
  }

  @media (max-width: 760px) {
    .meta-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;