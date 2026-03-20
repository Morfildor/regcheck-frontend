import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ANALYZE_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";
const METADATA_URL = ANALYZE_URL.replace(/\/analyze$/, "/metadata/options");

const THEME = {
  bg: "#f3ede4",
  bg2: "#e7ddd1",
  panel: "rgba(255,255,255,0.82)",
  panelStrong: "rgba(255,255,255,0.92)",
  line: "rgba(54, 42, 56, 0.10)",
  lineStrong: "rgba(54, 42, 56, 0.18)",
  text: "#211a20",
  subtext: "#665b67",
  soft: "#837783",
  shadow: "0 12px 34px rgba(33, 26, 32, 0.08)",
  shadowLg: "0 24px 60px rgba(33, 26, 32, 0.14)",
  accent: "#355f78",
  accent2: "#7b5a74",
  accent3: "#4c7a73",
  accent4: "#b48b43",
  deep: "#241c28",
  deep2: "#302537",
  deep3: "#203847",
  success: "#5d7f66",
  warning: "#a77b37",
  danger: "#b06a7c",
  lavender: "#74679a",
  blush: "#efe6ec",
  mint: "#e7f1ef",
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
  LVD: { dot: "#7d8a63", bg: "#eef1e5", bd: "#d6debf", text: "#566143", glow: "rgba(125,138,99,0.16)" },
  EMC: { dot: "#4f7f88", bg: "#e8f2f4", bd: "#c9dde2", text: "#355d65", glow: "rgba(79,127,136,0.16)" },
  RED: { dot: "#355f78", bg: "#e7eef4", bd: "#c8d7e3", text: "#2f5065", glow: "rgba(53,95,120,0.16)" },
  RED_CYBER: { dot: "#855d7d", bg: "#f2eaf0", bd: "#e0ccda", text: "#69495f", glow: "rgba(133,93,125,0.16)" },
  CRA: { dot: "#618068", bg: "#ecf3ed", bd: "#d0dfd2", text: "#49614e", glow: "rgba(97,128,104,0.16)" },
  ROHS: { dot: "#b48b43", bg: "#fbf4e3", bd: "#ecd9ad", text: "#8d6b2d", glow: "rgba(180,139,67,0.16)" },
  REACH: { dot: "#9c7766", bg: "#f6ede9", bd: "#e4d3ca", text: "#7a5749", glow: "rgba(156,119,102,0.16)" },
  GDPR: { dot: "#6d8e8b", bg: "#edf4f3", bd: "#d1dfdd", text: "#56706d", glow: "rgba(109,142,139,0.16)" },
  AI_Act: { dot: "#8a6796", bg: "#f1ebf5", bd: "#ddcfe5", text: "#6b5276", glow: "rgba(138,103,150,0.16)" },
  ESPR: { dot: "#b48b43", bg: "#fbf4e3", bd: "#ecd9ad", text: "#8d6b2d", glow: "rgba(180,139,67,0.16)" },
  ECO: { dot: "#5d826c", bg: "#edf4ef", bd: "#d2e0d6", text: "#496354", glow: "rgba(93,130,108,0.16)" },
  BATTERY: { dot: "#708557", bg: "#f1f5e9", bd: "#d9e5c6", text: "#586944", glow: "rgba(112,133,87,0.16)" },
  FCM: { dot: "#8f6e60", bg: "#f6eee9", bd: "#e3d4cb", text: "#6c5247", glow: "rgba(143,110,96,0.16)" },
  FCM_PLASTIC: { dot: "#8f6e60", bg: "#f6eee9", bd: "#e3d4cb", text: "#6c5247", glow: "rgba(143,110,96,0.16)" },
  MD: { dot: "#6d6fa1", bg: "#eeeef7", bd: "#d5d6ea", text: "#555782", glow: "rgba(109,111,161,0.16)" },
  MACH_REG: { dot: "#6d6fa1", bg: "#eeeef7", bd: "#d5d6ea", text: "#555782", glow: "rgba(109,111,161,0.16)" },
  OTHER: { dot: "#8a807b", bg: "#f4efe9", bd: "#ddd4cd", text: "#665d59", glow: "rgba(138,128,123,0.16)" },
};

const STATUS = {
  LOW: { bg: "#eef4ee", bd: "#d4e2d3", text: "#52664f" },
  MEDIUM: { bg: "#fbf5e8", bd: "#ecdcae", text: "#9a7a33" },
  HIGH: { bg: "#f9ecef", bd: "#ebd1d8", text: "#9a6878" },
  CRITICAL: { bg: "#f3e6eb", bd: "#e0c2cd", text: "#8f5468" },
};

const IMPORTANCE = {
  high: { bg: "#f8eef1", bd: "#e8d2d9", text: "#8d6474" },
  medium: { bg: "#fbf5e8", bd: "#ecdcae", text: "#9e7d36" },
  low: { bg: "#eef4ee", bd: "#d7e3d5", text: "#5d7659" },
};

const SECTION_TONES = {
  harmonized: {
    bg: "linear-gradient(135deg, rgba(53,95,120,0.12), rgba(53,95,120,0.03))",
    bd: "rgba(53,95,120,0.16)",
    tagBg: "rgba(53,95,120,0.10)",
    tagText: "#355f78",
  },
  state_of_the_art: {
    bg: "linear-gradient(135deg, rgba(180,139,67,0.14), rgba(180,139,67,0.03))",
    bd: "rgba(180,139,67,0.18)",
    tagBg: "rgba(180,139,67,0.10)",
    tagText: "#8d6b2d",
  },
  review: {
    bg: "linear-gradient(135deg, rgba(123,90,116,0.13), rgba(123,90,116,0.03))",
    bd: "rgba(123,90,116,0.18)",
    tagBg: "rgba(123,90,116,0.10)",
    tagText: "#7b5a74",
  },
  unknown: {
    bg: "linear-gradient(135deg, rgba(138,128,123,0.12), rgba(138,128,123,0.03))",
    bd: "rgba(138,128,123,0.18)",
    tagBg: "rgba(138,128,123,0.10)",
    tagText: "#665d59",
  },
};

const DEFAULT_TEMPLATES = [
  {
    label: "Coffee machine",
    text: "Connected espresso machine with mains power, Wi-Fi app control, OTA updates, cloud account, grinder, pressure, water tank, and food-contact brew path.",
  },
  {
    label: "Electric kettle",
    text: "Electric kettle with mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi control.",
  },
  {
    label: "Air purifier",
    text: "Smart air purifier with mains power, motorized fan, electronic controls, Wi-Fi app control, networked standby, and OTA firmware updates.",
  },
  {
    label: "Robot vacuum",
    text: "Robot vacuum cleaner with rechargeable lithium battery, Wi-Fi and Bluetooth, cloud account, OTA firmware updates, LiDAR navigation, and camera.",
  },
];

function titleCase(input) {
  return String(input || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function sentenceCaseList(values) {
  return (values || []).map((value) => titleCase(String(value)));
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

function joinText(base, addition) {
  const a = String(base || "").trim();
  const b = String(addition || "").trim();
  if (!b) return a;
  if (!a) return b;
  if (a.toLowerCase().includes(b.toLowerCase())) return a;
  const separator = /[\s,;:]$/.test(a) ? " " : a.endsWith(".") ? " " : ", ";
  return `${a}${separator}${b}`;
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

function buildDynamicTemplates(products) {
  const lookup = new Map((products || []).map((p) => [p.id, p]));
  const templates = [];

  function addTemplate(productId, suffix, labelOverride) {
    const product = lookup.get(productId);
    if (!product) return;
    templates.push({
      label: labelOverride || product.label,
      text: `${product.label} with ${suffix}.`,
    });
  }

  addTemplate("coffee_machine", "mains power, heating, water tank, grinder, food-contact brew path, app control, and OTA updates", "Coffee machine");
  addTemplate("electric_kettle", "mains power, liquid heating, food-contact water path, and optional Wi-Fi control", "Electric kettle");
  addTemplate("air_purifier", "mains power, motorized fan, sensor electronics, app control, and OTA updates", "Air purifier");
  addTemplate("robot_vacuum", "rechargeable battery, app control, Wi-Fi and Bluetooth, cloud account, OTA updates, and LiDAR navigation", "Robot vacuum");
  addTemplate("robot_vacuum_cleaner", "rechargeable battery, app control, Wi-Fi and Bluetooth, cloud account, OTA updates, and LiDAR navigation", "Robot vacuum");

  return uniqueBy(templates.length ? templates : DEFAULT_TEMPLATES, (item) => item.label).slice(0, 4);
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
    (item.examples || []).slice(0, 2).forEach((example) => {
      push(titleCase(item.key), example);
    });
  });

  if (product?.implied_traits?.includes("food_contact") || traits.has("food_contact")) {
    push("Food contact", "food-contact plastics, coatings, silicone, or rubber");
    push("Water path", "wetted path materials, seals, and water tank");
  }
  if (product?.implied_traits?.includes("motorized") || traits.has("motorized")) {
    push("Motor", "motorized function");
    push("Pump", "pump or fluid transfer function");
  }
  if (traits.has("radio")) {
    push("Wi-Fi", "Wi-Fi radio");
    push("Bluetooth", "Bluetooth LE radio");
    push("OTA", "OTA firmware updates");
  }
  if (traits.has("cloud") || traits.has("app_control") || traits.has("internet")) {
    push("Cloud", "cloud account required");
    push("Local control", "local LAN control without cloud dependency");
    push("Patching", "security and firmware patching over the air");
  }
  if (traits.has("battery_powered")) push("Battery", "rechargeable lithium battery");
  if (traits.has("camera")) push("Camera", "integrated camera");
  if (traits.has("microphone")) push("Microphone", "microphone or voice input");

  if (!chips.length) {
    push("Mains", "230 V mains powered");
    push("Consumer", "consumer household use");
    push("App control", "mobile app control");
    push("Food contact", "food-contact plastics or coatings");
  }

  return chips.slice(0, 8);
}

function buildCompactLegislationItems(result) {
  const sections = result?.legislation_sections || [];
  const allItems = sections.flatMap((section) =>
    (section.items || []).map((item) => ({
      ...item,
      section_key: section.key,
      section_title: section.title,
    })),
  );

  const sorted = [...allItems].sort((a, b) => {
    return directiveRank(a.directive_key) - directiveRank(b.directive_key) || String(a.code).localeCompare(String(b.code));
  });

  return uniqueBy(sorted, (item) => `${item.code}-${item.directive_key}`);
}

function compactLegislationGroupLabel(item) {
  const sectionKey = item.section_key;
  if (sectionKey === "framework") return "Additional";
  if (sectionKey === "non_ce") return "Parallel";
  if (sectionKey === "future") return "Future";
  if (sectionKey === "ce") return "CE";
  return titleCase(sectionKey);
}

function sortStandardItems(items) {
  return [...(items || [])].sort((a, b) => {
    return (
      directiveRank(a.directive || a.legislation_key) - directiveRank(b.directive || b.legislation_key) ||
      String(a.code || "").localeCompare(String(b.code || ""))
    );
  });
}

function DirPill({ dirKey, large = false }) {
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
        padding: large ? "6px 12px" : "4px 10px",
        fontSize: large ? 13 : 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: tone.dot,
          flexShrink: 0,
        }}
      />
      {directiveShort(dirKey)}
    </span>
  );
}

function RiskPill({ value }) {
  const tone = STATUS[value] || STATUS.MEDIUM;
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
        fontWeight: 900,
      }}
    >
      {value}
    </span>
  );
}

function Tag({ children, tone = "neutral" }) {
  const styles =
    tone === "neutral"
      ? { bg: "rgba(255,255,255,0.72)", bd: THEME.line, text: THEME.soft }
      : tone === "soft"
        ? {
            bg: "rgba(53,95,120,0.09)",
            bd: "rgba(53,95,120,0.18)",
            text: THEME.accent,
          }
        : {
            bg: "rgba(123,90,116,0.09)",
            bd: "rgba(123,90,116,0.18)",
            text: THEME.accent2,
          };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        border: `1px solid ${styles.bd}`,
        background: styles.bg,
        color: styles.text,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.1,
      }}
    >
      {children}
    </span>
  );
}

function SectionCard({ title, subtitle, right, children, style }) {
  return (
    <section
      style={{
        borderRadius: 24,
        border: `1px solid ${THEME.line}`,
        background: THEME.panel,
        boxShadow: THEME.shadow,
        backdropFilter: "blur(10px)",
        padding: 22,
        ...style,
      }}
    >
      {(title || subtitle || right) && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {title ? (
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: THEME.text,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </div>
            ) : null}
            {subtitle ? (
              <div
                style={{
                  marginTop: 5,
                  fontSize: 13,
                  color: THEME.subtext,
                  lineHeight: 1.55,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function Hero({ result }) {
  const hero = result?.hero_summary || {};
  const primaryRegimes = hero.primary_regimes || [];
  const showResultMeta = Boolean(result);

  return (
    <SectionCard
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(249,244,239,0.94) 54%, rgba(235,239,244,0.92))",
        boxShadow: THEME.shadowLg,
        padding: 26,
      }}
    >
      <div style={{ display: "grid", gap: 18 }}>
        {showResultMeta ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <RiskPill value={result?.overall_risk || "MEDIUM"} />
            <Tag>{titleCase(hero.confidence || result?.product_match_confidence || "low")} Confidence</Tag>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.06,
              fontWeight: 900,
              color: THEME.text,
              letterSpacing: "-0.03em",
            }}
          >
            {hero.title || "RuleGrid regulatory scoping"}
          </div>
          <div
            style={{
              fontSize: 15,
              color: THEME.subtext,
              lineHeight: 1.72,
              maxWidth: 920,
            }}
          >
            {hero.subtitle ||
              "Describe the product clearly to generate the standards route and the applicable legislation path."}
          </div>
        </div>

        {showResultMeta && primaryRegimes.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {primaryRegimes.map((dirKey) => (
              <DirPill key={dirKey} dirKey={dirKey} large />
            ))}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function SidebarRail({ result }) {
  if (!result) return null;

  const items = buildCompactLegislationItems(result);
  const confidence =
    result?.confidence_panel?.confidence ||
    result?.product_match_confidence ||
    "low";

  return (
    <aside
      className="left-rail"
      style={{
        display: "grid",
        gap: 14,
        position: "sticky",
        top: 18,
        alignSelf: "start",
      }}
    >
      <SectionCard
        title="Applicable legislation"
        subtitle="Sticky overview"
        style={{ padding: 16, borderRadius: 20 }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item) => {
            const tone = directiveTone(item.directive_key || "OTHER");
            return (
              <div
                key={`${item.code}-${item.directive_key}-${item.section_key}`}
                style={{
                  borderRadius: 14,
                  border: `1px solid ${tone.bd}`,
                  background: tone.bg,
                  color: tone.text,
                  padding: "10px 11px",
                  display: "grid",
                  gap: 5,
                  boxShadow: `0 0 0 1px ${tone.glow}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: tone.dot,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 900 }}>
                    {item.code}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      opacity: 0.82,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {compactLegislationGroupLabel(item)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.4,
                    fontWeight: 700,
                  }}
                >
                  {item.title}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Detection confidence"
        subtitle="Product identification"
        style={{ padding: 16, borderRadius: 20 }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>Detected Product</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 18,
                fontWeight: 900,
                color: THEME.text,
              }}
            >
              {titleCase(result?.product_type || "Unclear")}
            </div>
          </div>
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>Confidence</div>
            <div style={{ marginTop: 7 }}>
              <Tag tone="soft">{titleCase(confidence)}</Tag>
            </div>
          </div>
        </div>
      </SectionCard>
    </aside>
  );
}

function InputComposer({
  description,
  setDescription,
  templates,
  chips,
  onAnalyze,
  busy,
}) {
  return (
    <SectionCard
      title="Describe the product"
      subtitle="Describe product type, connectivity, power source, key functions, sensors, materials, and battery if relevant."
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {templates.slice(0, 4).map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => setDescription(template.text)}
              style={templateChipStyle}
            >
              {template.label}
            </button>
          ))}
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: Connected espresso machine with Wi-Fi, OTA updates, cloud account, mains power, grinder, pressure system, and food-contact brew path."
          rows={7}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: 190,
            lineHeight: 1.65,
          }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {chips.map((chip) => (
            <button
              key={chip.label + chip.text}
              type="button"
              onClick={() =>
                setDescription((current) => joinText(current, chip.text))
              }
              style={chipButtonStyle}
            >
              + {chip.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={busy || !description.trim()}
            style={primaryButtonStyle(busy || !description.trim())}
          >
            {busy ? "Analyzing..." : "Analyze product"}
          </button>
          <button
            type="button"
            onClick={() => setDescription("")}
            style={secondaryButtonStyle}
          >
            Clear
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function InputGapsPanel({ result, onApply }) {
  const rawItems = result?.missing_information_items || [];
  const items = rawItems.slice(0, 6);
  if (!items.length) return null;

  return (
    <SectionCard
      title="Clarify these first"
      subtitle="These inputs materially affect the route."
    >
      <div
        className="two-col-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {items.map((item) => {
          const tone = IMPORTANCE[item.importance] || IMPORTANCE.medium;
          return (
            <div
              key={item.key}
              style={{
                borderRadius: 18,
                border: `1px solid ${tone.bd}`,
                background: tone.bg,
                padding: 15,
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ fontSize: 14, fontWeight: 900, color: tone.text }}
                >
                  {titleCase(item.key)}
                </div>
                <Tag>{titleCase(item.importance)}</Tag>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: THEME.subtext,
                  lineHeight: 1.65,
                }}
              >
                {item.message}
              </div>

              {item.examples?.length ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {item.examples.slice(0, 3).map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => onApply(example)}
                      style={chipButtonStyle}
                    >
                      + {example}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function StandardCard({ item, sectionKey }) {
  const dirKey = item.directive || item.legislation_key || "OTHER";
  const dirTone = directiveTone(dirKey);
  const sectionTone = SECTION_TONES[sectionKey] || SECTION_TONES.unknown;
  const evidence = sentenceCaseList(item.evidence_hint || []).join(" · ");
  const tags = uniqueBy(
    [
      item.category ? titleCase(item.category) : null,
      item.standard_family || null,
      ...(item.test_focus || []).map((t) => titleCase(t)),
    ]
      .filter(Boolean)
      .slice(0, 4),
    (value) => value,
  );

  return (
    <div
      style={{
        borderRadius: 22,
        border: `1px solid ${dirTone.bd}`,
        background: "rgba(255,255,255,0.92)",
        padding: 0,
        display: "grid",
        gap: 0,
        overflow: "hidden",
        boxShadow: `0 12px 24px ${dirTone.glow}`,
      }}
    >
      <div
        style={{
          padding: "14px 16px 12px",
          background: `linear-gradient(135deg, ${dirTone.bg}, rgba(255,255,255,0.92))`,
          borderBottom: `1px solid ${dirTone.bd}`,
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <DirPill dirKey={dirKey} />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 999,
                background: sectionTone.tagBg,
                border: `1px solid ${sectionTone.bd}`,
                color: sectionTone.tagText,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {titleCase(item.harmonization_status || "unknown")}
            </span>
            {item.item_type === "review" ? <Tag tone="accent2">Review</Tag> : null}
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 12,
              background: dirTone.dot,
              color: "white",
              padding: "9px 13px",
              fontSize: 19,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              boxShadow: `0 0 0 4px ${dirTone.glow}`,
            }}
          >
            {item.code}
          </span>
        </div>

        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: THEME.text }}>
            {item.title}
          </div>
          {(item.reason || item.notes) ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: THEME.subtext,
                lineHeight: 1.65,
              }}
            >
              {item.reason || item.notes}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ padding: 16, display: "grid", gap: 12 }}>
        {tags.length ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        ) : null}

        <div
          className="standard-meta-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>Standard Flag</div>
            <div style={{ ...metaValueStyle, fontWeight: 900, fontSize: 16, color: dirTone.text }}>
              {prettyValue(item.code)}
            </div>
          </div>
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>Harmonized Standard Reference</div>
            <div style={metaValueStyle}>{prettyValue(item.harmonized_reference)}</div>
          </div>
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>Evidence Expected</div>
            <div style={metaValueStyle}>{prettyValue(evidence || "—")}</div>
          </div>
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>EU State-of-the-art Reference</div>
            <div style={metaValueStyle}>{prettyValue(item.version)}</div>
          </div>
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>EU Legislation</div>
            <div style={metaValueStyle}>{prettyValue(item.dated_version)}</div>
          </div>
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>Category</div>
            <div style={metaValueStyle}>
              {prettyValue(item.category ? titleCase(item.category) : "—")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StandardsSection({ result }) {
  const sections = result?.standard_sections || [];
  if (!sections.length) return null;

  const ordered = ["harmonized", "state_of_the_art", "review", "unknown"]
    .map((key) => sections.find((section) => section.key === key))
    .filter(Boolean)
    .map((section) => ({
      ...section,
      items: sortStandardItems(section.items || []),
    }));

  return (
    <SectionCard
      title="Standards route"
      subtitle="Ordered to show LVD first, then EMC, RED, RED cybersecurity, and RoHS-related routes. Standard reference is visually prioritised."
    >
      <div style={{ display: "grid", gap: 18 }}>
        {ordered.map((section) => {
          const sectionTone = SECTION_TONES[section.key] || SECTION_TONES.unknown;
          return (
            <div
              key={section.key}
              style={{
                borderRadius: 22,
                border: `1px solid ${sectionTone.bd}`,
                background: "rgba(255,255,255,0.74)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: `1px solid ${sectionTone.bd}`,
                  background: sectionTone.bg,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      color: THEME.text,
                    }}
                  >
                    {section.title}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: THEME.subtext,
                    }}
                  >
                    {section.count} item{section.count === 1 ? "" : "s"}
                  </div>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 999,
                    background: sectionTone.tagBg,
                    color: sectionTone.tagText,
                    padding: "5px 11px",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {titleCase(section.key)}
                </span>
              </div>

              <div style={{ padding: 16, display: "grid", gap: 14 }}>
                {(section.items || []).map((item) => (
                  <StandardCard
                    key={`${section.key}-${item.code}-${item.title}`}
                    item={item}
                    sectionKey={section.key}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function DiagnosticsPanel({ result }) {
  const [open, setOpen] = useState(false);
  const diagnostics = result?.diagnostics || [];
  const traits = result?.all_traits || [];
  if (!diagnostics.length && !traits.length) return null;

  return (
    <SectionCard
      title="Advanced diagnostics"
      subtitle="Hidden by default."
      right={
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          style={secondaryButtonStyle}
        >
          {open ? "Hide" : "Show"}
        </button>
      }
    >
      {open ? (
        <div style={{ display: "grid", gap: 14 }}>
          {traits.length ? (
            <div style={softBoxStyle}>
              <div style={miniTitleStyle}>All Traits</div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                {traits.map((trait) => (
                  <Tag key={trait}>{titleCase(trait)}</Tag>
                ))}
              </div>
            </div>
          ) : null}

          {diagnostics.length ? (
            <div style={softBoxStyle}>
              <div style={miniTitleStyle}>Diagnostics</div>
              <div
                style={{
                  marginTop: 10,
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                  color: THEME.subtext,
                  lineHeight: 1.65,
                }}
              >
                {diagnostics.map((line, index) => (
                  <div key={line + index}>• {line}</div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );
}

function CopyResultsButton({ result, description }) {
  const handleCopy = async () => {
    const text = [
      "RuleGrid compliance summary",
      "",
      `Input: ${description}`,
      "",
      `Detected product: ${titleCase(result?.product_type || "Unclear")}`,
      `Confidence: ${titleCase(result?.product_match_confidence || "low")}`,
      `Overall risk: ${result?.overall_risk || "MEDIUM"}`,
      "",
      `Summary: ${result?.summary || ""}`,
      "",
      "Standards route:",
      ...(result?.standard_sections || []).flatMap((section) => [
        `- ${section.title} (${section.count})`,
        ...sortStandardItems(section.items || []).map((item) => `  • ${item.code} — ${item.title}`),
      ]),
      "",
      "Applicable legislation:",
      ...buildCompactLegislationItems(result).map(
        (item) => `- ${item.code} — ${item.title}`,
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <button type="button" onClick={handleCopy} style={secondaryButtonStyle}>
      Copy summary
    </button>
  );
}

function EmptyState() {
  return (
    <SectionCard
      title="Ready for analysis"
      subtitle="Enter a product description to generate the standards route and legislation overview."
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          color: THEME.subtext,
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        <div style={listRowStyle}>
          <span style={bulletStyle} />
          Start with a realistic product description.
        </div>
        <div style={listRowStyle}>
          <span style={bulletStyle} />
          Mention connectivity, power source, key functions, and special materials or sensors.
        </div>
        <div style={listRowStyle}>
          <span style={bulletStyle} />
          After analysis, refine the input using the clarification chips.
        </div>
      </div>
    </SectionCard>
  );
}

function App() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const resultsRef = useRef(null);

  useEffect(() => {
    let active = true;

    fetch(METADATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Metadata request failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (active) setMetadata(data);
      })
      .catch(() => {
        if (active) setMetadata({ traits: [], products: [], legislations: [] });
      });

    return () => {
      active = false;
    };
  }, []);

  const templates = useMemo(() => {
    const dynamic = buildDynamicTemplates(metadata?.products || []);
    return dynamic.length ? dynamic : DEFAULT_TEMPLATES;
  }, [metadata]);

  const chips = useMemo(
    () => buildGuidedChips(metadata, result),
    [metadata, result],
  );

  useEffect(() => {
    if (!result || !resultsRef.current) return;
    const timer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [result]);

  const runAnalysis = useCallback(async () => {
    if (!description.trim()) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || `Analysis failed (${response.status})`);
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }, [description]);

  const applyText = useCallback((text) => {
    setDescription((current) => joinText(current, text));
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at top left, rgba(123,90,116,0.08), transparent 26%),
          radial-gradient(circle at top right, rgba(53,95,120,0.08), transparent 26%),
          linear-gradient(180deg, ${THEME.bg}, ${THEME.bg2})
        `,
      }}
    >
      <style>{globalCss}</style>

      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "28px 20px 56px",
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <Hero result={result} />

          <div className="app-shell-grid">
            {result ? <SidebarRail result={result} /> : <div />}

            <main style={{ display: "grid", gap: 18, minWidth: 0 }}>
              <InputComposer
                description={description}
                setDescription={setDescription}
                templates={templates}
                chips={chips}
                onAnalyze={runAnalysis}
                busy={busy}
              />

              {error ? (
                <SectionCard title="Analysis error">
                  <div style={{ color: THEME.danger, fontSize: 14 }}>{error}</div>
                </SectionCard>
              ) : null}

              <div ref={resultsRef} />

              {!result ? (
                <EmptyState />
              ) : (
                <>
                  <InputGapsPanel result={result} onApply={applyText} />
                  <StandardsSection result={result} />
                  <DiagnosticsPanel result={result} />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <CopyResultsButton result={result} description={description} />
                    <button
                      type="button"
                      onClick={runAnalysis}
                      disabled={busy || !description.trim()}
                      style={secondaryButtonStyle}
                    >
                      Re-run analysis
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>
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
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: ${THEME.text};
  }
  button, input, select, textarea { font: inherit; }
  .app-shell-grid {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  @media (max-width: 1040px) {
    .app-shell-grid {
      grid-template-columns: 1fr;
    }
    .left-rail {
      position: static !important;
      top: auto !important;
    }
  }
  @media (max-width: 760px) {
    .two-col-grid { grid-template-columns: 1fr !important; }
    .standard-meta-grid { grid-template-columns: 1fr !important; }
  }
`;

const inputStyle = {
  width: "100%",
  borderRadius: 16,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.96)",
  padding: "12px 14px",
  color: THEME.text,
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
};

const softBoxStyle = {
  borderRadius: 18,
  border: `1px solid ${THEME.line}`,
  background: "rgba(255,255,255,0.76)",
  padding: 14,
};

const miniTitleStyle = {
  fontSize: 11,
  fontWeight: 900,
  color: THEME.soft,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const metaValueStyle = {
  marginTop: 7,
  fontSize: 13,
  color: THEME.text,
  lineHeight: 1.6,
};

const templateChipStyle = {
  appearance: "none",
  cursor: "pointer",
  borderRadius: 999,
  border: `1px solid ${THEME.lineStrong}`,
  background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,238,244,0.92))",
  color: THEME.deep2,
  padding: "9px 13px",
  fontSize: 12,
  fontWeight: 900,
  boxShadow: "0 8px 16px rgba(33,26,32,0.05)",
};

const chipButtonStyle = {
  appearance: "none",
  cursor: "pointer",
  borderRadius: 999,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.90)",
  color: THEME.text,
  padding: "7px 11px",
  fontSize: 12,
  fontWeight: 800,
};

function primaryButtonStyle(disabled) {
  return {
    appearance: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    borderRadius: 14,
    border: "none",
    background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent3})`,
    color: "white",
    padding: "11px 15px",
    fontWeight: 900,
    boxShadow: "0 12px 24px rgba(53,95,120,0.20)",
  };
}

const secondaryButtonStyle = {
  appearance: "none",
  cursor: "pointer",
  borderRadius: 14,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.88)",
  color: THEME.text,
  padding: "10px 14px",
  fontWeight: 800,
};

const listRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  fontSize: 14,
  color: THEME.subtext,
  lineHeight: 1.7,
};

const bulletStyle = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: THEME.accent,
  marginTop: 8,
  flexShrink: 0,
};

export default App;