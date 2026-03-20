
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ANALYZE_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";
const METADATA_URL = ANALYZE_URL.replace(/\/analyze$/, "/metadata/options");

const THEME = {
  bg: "#f5efe7",
  bg2: "#ebe1d5",
  bg3: "#efe8f2",
  panel: "rgba(255,255,255,0.86)",
  panelStrong: "rgba(255,255,255,0.95)",
  line: "rgba(54,42,56,0.10)",
  lineStrong: "rgba(54,42,56,0.18)",
  text: "#211a20",
  subtext: "#665b67",
  soft: "#837783",
  shadow: "0 12px 34px rgba(33,26,32,0.08)",
  shadowLg: "0 24px 60px rgba(33,26,32,0.14)",
  accent: "#355f78",
  accent2: "#7b5a74",
  accent3: "#4c7a73",
  accent4: "#b48b43",
  rose: "#c88ca0",
  sage: "#8fa07a",
  sky: "#7c9eb5",
  lavender: "#8c82b4",
  mint: "#87b3a7",
  danger: "#b06a7c",
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

const DIR_LABEL = {
  LVD: "Low Voltage Directive",
  EMC: "EMC Directive",
  RED: "Radio Equipment Directive",
  RED_CYBER: "RED delegated cybersecurity route",
  CRA: "Cyber Resilience Act",
  ROHS: "RoHS Directive",
  REACH: "REACH Regulation",
  GDPR: "GDPR",
  AI_Act: "AI Act",
  ESPR: "ESPR",
  ECO: "Ecodesign",
  BATTERY: "Battery Regulation",
  FCM: "Food Contact Materials",
  FCM_PLASTIC: "Plastic FCM",
  MD: "Machinery Directive",
  MACH_REG: "Machinery Regulation",
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
  LVD: { dot: "#8fa07a", bg: "#eef4e9", bd: "#d6e2c8", text: "#5f6e4e", glow: "rgba(143,160,122,0.18)" },
  EMC: { dot: "#7ba8b3", bg: "#e9f3f5", bd: "#cfe0e5", text: "#426670", glow: "rgba(123,168,179,0.18)" },
  RED: { dot: "#7c9eb5", bg: "#e9f0f6", bd: "#cfdae6", text: "#4f6f85", glow: "rgba(124,158,181,0.18)" },
  RED_CYBER: { dot: "#a48cb7", bg: "#f1ebf5", bd: "#dfd3e8", text: "#6d5a80", glow: "rgba(164,140,183,0.18)" },
  CRA: { dot: "#85ad99", bg: "#ebf4ef", bd: "#d3e2d9", text: "#577565", glow: "rgba(133,173,153,0.18)" },
  ROHS: { dot: "#c9ab67", bg: "#faf4e6", bd: "#ead9b4", text: "#8d7136", glow: "rgba(201,171,103,0.18)" },
  REACH: { dot: "#c59a88", bg: "#f7eeea", bd: "#e6d4cb", text: "#825f52", glow: "rgba(197,154,136,0.18)" },
  GDPR: { dot: "#87b3a7", bg: "#ecf5f2", bd: "#d3e3de", text: "#5c7a71", glow: "rgba(135,179,167,0.18)" },
  AI_Act: { dot: "#aa96c7", bg: "#f2eef8", bd: "#ddd4ea", text: "#6f6187", glow: "rgba(170,150,199,0.18)" },
  ESPR: { dot: "#d2a06d", bg: "#fbf1e7", bd: "#edd7bf", text: "#8b6637", glow: "rgba(210,160,109,0.18)" },
  ECO: { dot: "#8db69d", bg: "#edf5f0", bd: "#d4e2d9", text: "#5f7867", glow: "rgba(141,182,157,0.18)" },
  BATTERY: { dot: "#a3b777", bg: "#f1f6e8", bd: "#dbe6c6", text: "#687948", glow: "rgba(163,183,119,0.18)" },
  FCM: { dot: "#c79a8d", bg: "#f8efec", bd: "#e7d4ce", text: "#7f5d53", glow: "rgba(199,154,141,0.18)" },
  FCM_PLASTIC: { dot: "#c79a8d", bg: "#f8efec", bd: "#e7d4ce", text: "#7f5d53", glow: "rgba(199,154,141,0.18)" },
  MD: { dot: "#97a0cf", bg: "#eef0fb", bd: "#d6daf1", text: "#616995", glow: "rgba(151,160,207,0.18)" },
  MACH_REG: { dot: "#97a0cf", bg: "#eef0fb", bd: "#d6daf1", text: "#616995", glow: "rgba(151,160,207,0.18)" },
  OTHER: { dot: "#b7aba4", bg: "#f5efeb", bd: "#ddd5cf", text: "#706762", glow: "rgba(183,171,164,0.18)" },
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

function gapLabel(key) {
  const labels = {
    product_type: "Product type",
    power_source: "Power source",
    radio_scope_confirmation: "Radio scope",
    radio_technology: "Radio technology",
    wifi_band: "Wi-Fi band",
    food_contact_materials: "Food-contact materials",
    connectivity_architecture: "Connected design",
    redcyber_auth_scope: "Login / authentication",
    redcyber_transaction_scope: "Payments / subscriptions",
    contradictions: "Contradictions",
  };
  return labels[key] || titleCase(key);
}

function directiveTone(key) {
  return DIR_TONES[key] || DIR_TONES.OTHER;
}

function directiveShort(key) {
  return DIR_SHORT[key] || titleCase(key);
}

function directiveLabel(key) {
  return DIR_LABEL[key] || titleCase(key);
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

function standardCardTags(item) {
  return uniqueBy(
    [
      ...(item.display_tags || []),
      item.category ? titleCase(item.category) : null,
      item.standard_family || null,
    ].filter(Boolean),
    (value) => value,
  ).slice(0, 5);
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

  addTemplate(
    "coffee_machine",
    "mains power, heating, water tank, grinder, food-contact brew path, Wi-Fi radio, app control, cloud account, and OTA updates",
    "Coffee machine",
  );
  addTemplate(
    "electric_kettle",
    "mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi radio control",
    "Electric kettle",
  );
  addTemplate(
    "air_purifier",
    "mains power, motorized fan, sensor electronics, Wi-Fi radio, app control, and OTA updates",
    "Air purifier",
  );
  addTemplate(
    "robot_vacuum",
    "rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, camera, and LiDAR navigation",
    "Robot vacuum",
  );
  addTemplate(
    "robot_vacuum_cleaner",
    "rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, camera, and LiDAR navigation",
    "Robot vacuum",
  );

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
    (item.examples || []).slice(0, 2).forEach((example) => push(gapLabel(item.key), example));
  });

  if (product?.implied_traits?.includes("food_contact") || traits.has("food_contact")) {
    push("Food contact", "food-contact plastics, coatings, silicone, rubber, and metal parts");
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

  if (!traits.has("radio") && (traits.has("app_control") || traits.has("cloud") || traits.has("ota"))) {
    push("Wi-Fi", "Wi-Fi radio");
    push("Bluetooth", "Bluetooth LE radio");
  }

  if (traits.has("cloud") || traits.has("app_control") || traits.has("internet") || traits.has("wifi")) {
    push("Cloud", "cloud account required");
    push("Local control", "local LAN control without cloud dependency");
    push("Patching", "security and firmware patching over the air");
    push("Login", "user account and password login");
    push("PIN", "PIN or passcode entry");
    push("Payments", "payment or subscription purchase through app");
  }

  if (traits.has("wifi") && !traits.has("wifi_5ghz")) {
    push("5 GHz", "dual-band 2.4/5 GHz Wi-Fi");
    push("2.4 GHz", "Wi-Fi 2.4 GHz radio");
  }

  if (traits.has("battery_powered")) push("Battery", "rechargeable lithium battery");
  if (traits.has("camera")) push("Camera", "integrated camera");
  if (traits.has("microphone")) push("Microphone", "microphone or voice input");

  if (!chips.length) {
    push("Mains", "230 V mains powered");
    push("Consumer", "consumer household use");
    push("App control", "mobile app control");
    push("Wi-Fi", "Wi-Fi radio");
    push("Food contact", "food-contact plastics or coatings");
  }

  return chips.slice(0, 10);
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

function orderStandardSections(sections) {
  return [...(sections || [])].sort((a, b) => directiveRank(a.key) - directiveRank(b.key));
}

function buildCopyText(result, description) {
  const lines = [];
  lines.push("RuleGrid analysis");
  lines.push("");
  lines.push(`Input: ${description || result?.product_summary || "—"}`);
  lines.push(`Detected product: ${titleCase(result?.product_type || "unclear")}`);
  lines.push(`Overall risk: ${result?.overall_risk || "—"}`);
  lines.push(`Directives: ${(result?.directives || []).join(", ") || "—"}`);
  lines.push("");
  lines.push("Current path");
  (result?.current_path || []).forEach((line) => lines.push(`- ${line}`));
  lines.push("");
  lines.push("Standards");
  (result?.standards || []).forEach((item) => {
    lines.push(`- ${item.code}: ${item.title}`);
  });
  if (result?.review_items?.length) {
    lines.push("");
    lines.push("Review items");
    result.review_items.forEach((item) => {
      lines.push(`- ${item.code}: ${item.title}`);
    });
  }
  return lines.join("\n");
}

function Tag({ children, tone = "neutral" }) {
  const styles =
    tone === "neutral"
      ? { bg: "rgba(255,255,255,0.76)", bd: THEME.line, text: THEME.soft }
      : tone === "soft"
        ? { bg: "rgba(53,95,120,0.09)", bd: "rgba(53,95,120,0.18)", text: THEME.accent }
        : tone === "accent2"
          ? { bg: "rgba(123,90,116,0.09)", bd: "rgba(123,90,116,0.18)", text: THEME.accent2 }
          : { bg: "rgba(76,122,115,0.09)", bd: "rgba(76,122,115,0.18)", text: THEME.accent3 };

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
        fontWeight: 800,
        lineHeight: 1.1,
      }}
    >
      {children}
    </span>
  );
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
        fontWeight: 900,
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
              <div style={{ fontSize: 18, fontWeight: 900, color: THEME.text, lineHeight: 1.2 }}>{title}</div>
            ) : null}
            {subtitle ? (
              <div style={{ marginTop: 5, fontSize: 13, color: THEME.subtext, lineHeight: 1.55 }}>{subtitle}</div>
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
  const stats = hero.stats || [];
  const primaryRegimes = uniqueBy(hero.primary_regimes || [], (item) => item);

  return (
    <SectionCard
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(250,245,238,0.94) 56%, rgba(235,241,242,0.9))",
        boxShadow: THEME.shadowLg,
        padding: 26,
      }}
    >
      <div style={{ display: "grid", gap: 20 }}>
        {!!result && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <RiskPill value={result?.overall_risk || "MEDIUM"} />
            <Tag>{titleCase(hero.confidence || result?.product_match_confidence || "low")} Confidence</Tag>
          </div>
        )}

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
            {hero.title || "Compliance route analysis"}
          </div>
          <div
            style={{
              fontSize: 15,
              color: THEME.subtext,
              lineHeight: 1.72,
              maxWidth: 920,
            }}
          >
            {hero.subtitle || result?.summary || "Describe the product clearly to generate the standards route and the applicable legislation path."}
          </div>
        </div>

        {!!primaryRegimes.length && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {primaryRegimes.map((dirKey) => (
              <DirPill key={dirKey} dirKey={dirKey} large />
            ))}
          </div>
        )}

        {!!stats.length && (
          <div className="hero-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
            {stats.map((item) => (
              <div
                key={item.label}
                style={{
                  borderRadius: 18,
                  border: `1px solid ${THEME.line}`,
                  background: "rgba(255,255,255,0.76)",
                  padding: "14px 15px 13px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: THEME.soft,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {item.label}
                </div>
                <div style={{ marginTop: 8, fontSize: 26, fontWeight: 900, color: THEME.text }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function SidebarRail({ result }) {
  if (!result) return null;

  const items = buildCompactLegislationItems(result);

  return (
    <aside className="left-rail" style={{ display: "grid", gap: 14, position: "sticky", top: 18, alignSelf: "start" }}>
      <SectionCard title="Applicable legislation" subtitle="Sticky overview" style={{ padding: 16, borderRadius: 20 }}>
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
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: tone.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 900 }}>{item.code}</span>
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
                <div style={{ fontSize: 12, lineHeight: 1.4, fontWeight: 700 }}>{item.title}</div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Detection confidence" subtitle="Product identification" style={{ padding: 16, borderRadius: 20 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>Detected Product</div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: THEME.text }}>
              {titleCase(result?.product_type || "Unclear")}
            </div>
          </div>
          <div style={softBoxStyle}>
            <div style={miniTitleStyle}>Confidence</div>
            <div style={{ marginTop: 7 }}>
              <Tag tone="soft">{titleCase(result?.product_match_confidence || "low")}</Tag>
            </div>
          </div>
          {!!result?.contradictions?.length && (
            <div style={softBoxStyle}>
              <div style={miniTitleStyle}>Contradictions</div>
              <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: THEME.subtext }}>
                {result.contradictions[0]}
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </aside>
  );
}

function InputComposer({ description, setDescription, templates, chips, onAnalyze, busy }) {
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
          placeholder="Example: Connected espresso machine with Wi-Fi radio, OTA updates, cloud account, user login, mains power, grinder, pressure system, and food-contact brew path."
          rows={7}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: 188,
            lineHeight: 1.65,
          }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {chips.map((chip) => (
            <button
              key={chip.label + chip.text}
              type="button"
              onClick={() => setDescription((current) => joinText(current, chip.text))}
              style={chipButtonStyle}
            >
              + {chip.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={onAnalyze} disabled={busy || !description.trim()} style={primaryButtonStyle(busy || !description.trim())}>
            {busy ? "Analyzing..." : "Analyze product"}
          </button>
          <button type="button" onClick={() => setDescription("")} style={secondaryButtonStyle}>
            Clear
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function GuidanceStrip({ result, dirty, busy, onApply, onReanalyze }) {
  const items = result?.input_gaps_panel?.items || result?.missing_information_items || [];
  if (!result || !items.length) return null;

  return (
    <SectionCard
      title="Clarify these first"
      subtitle="Compact input gaps that materially change the route."
      right={
        dirty ? (
          <button type="button" onClick={onReanalyze} disabled={busy} style={secondaryButtonStyle}>
            {busy ? "Updating..." : "Update route"}
          </button>
        ) : null
      }
      style={{ padding: 18 }}
    >
      <div className="guidance-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {items.slice(0, 6).map((item) => {
          const tone = IMPORTANCE[item.importance] || IMPORTANCE.medium;
          return (
            <div
              key={item.key}
              style={{
                borderRadius: 18,
                border: `1px solid ${tone.bd}`,
                background: tone.bg,
                padding: 14,
                display: "grid",
                gap: 10,
                minHeight: 0,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: tone.text }}>{gapLabel(item.key)}</div>
                <Tag>{titleCase(item.importance)}</Tag>
              </div>

              <div style={{ fontSize: 12.5, color: THEME.subtext, lineHeight: 1.55 }}>{item.message}</div>

              {!!item.examples?.length && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {item.examples.slice(0, 2).map((example) => (
                    <button key={example} type="button" onClick={() => onApply(example)} style={tinyActionButtonStyle}>
                      {example}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function StandardsOverview({ result }) {
  if (!result) return null;
  const path = result?.current_path || [];
  const watchlist = result?.future_watchlist || [];

  return (
    <div className="snapshot-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
      <SectionCard title="Current path" subtitle="Immediate route">
        <div style={{ display: "grid", gap: 9 }}>
          {path.length ? path.map((line, index) => (
            <div key={index} style={inlineListRowStyle}>
              <span style={inlineBulletStyle} />
              <span>{line}</span>
            </div>
          )) : <div style={{ fontSize: 13, color: THEME.subtext }}>No current path summary available.</div>}
        </div>
      </SectionCard>

      <SectionCard title="Input focus" subtitle="Most useful next details">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(result?.suggested_questions || []).slice(0, 6).map((item) => (
            <Tag key={item} tone="soft">{item}</Tag>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Future watchlist" subtitle="Track separately from current CE">
        <div style={{ display: "grid", gap: 9 }}>
          {watchlist.length ? watchlist.map((line, index) => (
            <div key={index} style={inlineListRowStyle}>
              <span style={inlineBulletStyle} />
              <span>{line}</span>
            </div>
          )) : <div style={{ fontSize: 13, color: THEME.subtext }}>No future watchlist triggered.</div>}
        </div>
      </SectionCard>
    </div>
  );
}

function StandardCard({ item }) {
  const dirKey = normalizeStandardDirective(item);
  const topRight = prettyValue(item.evidence_hint?.length ? item.evidence_hint.join(" · ") : "—");
  const tags = standardCardTags(item);

  return (
    <div
      style={{
        borderRadius: 20,
        border: `1px solid ${THEME.line}`,
        background: "rgba(255,255,255,0.9)",
        padding: 16,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <DirPill dirKey={dirKey} />
        <Tag>{item.code}</Tag>
        <Tag>{titleCase(item.harmonization_status || "unknown")}</Tag>
        {item.item_type === "review" ? <Tag tone="accent2">Review</Tag> : null}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: THEME.text }}>{item.title}</div>
        <div style={{ fontSize: 13, color: THEME.subtext, lineHeight: 1.62 }}>
          {item.standard_summary || item.reason || item.notes || item.title}
        </div>
      </div>

      {!!tags.length && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
        </div>
      )}

      <div className="standard-meta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Harmonized Reference</div>
          <div style={metaValueStyle}>{prettyValue(item.harmonized_reference)}</div>
        </div>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Evidence Expected</div>
          <div style={metaValueStyle}>{topRight}</div>
        </div>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Harmonized Version</div>
          <div style={metaValueStyle}>{prettyValue(item.dated_version)}</div>
        </div>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>EU Latest Version</div>
          <div style={metaValueStyle}>{prettyValue(item.version)}</div>
        </div>
      </div>
    </div>
  );
}

function StandardsSection({ result }) {
  const sections = orderStandardSections(result?.standard_sections || []);
  if (!sections.length) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {sections.map((section) => (
        <SectionCard
          key={section.key}
          title={section.title || directiveLabel(section.key)}
          subtitle={`${section.count || 0} applicable item${section.count === 1 ? "" : "s"}`}
          right={<DirPill dirKey={section.key} />}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {(section.items || []).map((item) => (
              <StandardCard key={`${item.code}-${normalizeStandardDirective(item)}`} item={item} />
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function DiagnosticsPanel({ result }) {
  const diagnostics = result?.diagnostics || [];
  if (!diagnostics.length) return null;

  return (
    <details style={{ borderRadius: 18, border: `1px solid ${THEME.line}`, background: "rgba(255,255,255,0.7)", padding: 14 }}>
      <summary style={{ cursor: "pointer", fontWeight: 900, color: THEME.text }}>Diagnostics</summary>
      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {diagnostics.slice(0, 40).map((line) => (
          <code key={line} style={{ fontSize: 12, color: THEME.subtext, whiteSpace: "pre-wrap" }}>
            {line}
          </code>
        ))}
      </div>
    </details>
  );
}

function EmptyState() {
  return (
    <SectionCard
      title="Compliance route analysis"
      subtitle="Describe a product to generate current CE legislation, standards routes, parallel obligations, and the future watchlist."
      style={{ padding: 26 }}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ fontSize: 15, color: THEME.subtext, lineHeight: 1.7 }}>
          Start with product type, power source, connectivity, food-contact path, sensors, user-account features, and updates.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Wi-Fi radio", "OTA updates", "Cloud account", "User login", "Payment or subscription flow", "230 V mains powered", "Food-contact plastics"].map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function CopyResultsButton({ result, description }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(result, description));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error(error);
    }
  }, [description, result]);

  return (
    <button type="button" onClick={onCopy} style={secondaryButtonStyle}>
      {copied ? "Copied" : "Copy results"}
    </button>
  );
}

export default function App() {
  const [metadata, setMetadata] = useState(null);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [clarifyDirty, setClarifyDirty] = useState(false);
  const [error, setError] = useState("");
  const resultsRef = useRef(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = globalCss;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMetadata() {
      try {
        const res = await fetch(METADATA_URL);
        if (!res.ok) throw new Error(`Metadata request failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setMetadata(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadMetadata();
    return () => {
      cancelled = true;
    };
  }, []);

  const templates = useMemo(() => buildDynamicTemplates(metadata?.products), [metadata]);
  const guidedChips = useMemo(() => {
    const backend = (result?.suggested_quick_adds || []).map((item) => ({
      label: titleCase(item.label),
      text: item.text,
    }));
    const frontend = buildGuidedChips(metadata, result);
    return uniqueBy([...backend, ...frontend], (item) => item.text).slice(0, 12);
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
      if (!response.ok) {
        throw new Error(data?.detail || `Analysis failed with status ${response.status}`);
      }

      setResult(data);
      setClarifyDirty(false);

      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 40);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }, [description]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at top left, rgba(255,255,255,0.7), transparent 34%), linear-gradient(180deg, ${THEME.bg}, ${THEME.bg2})`,
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: 16 }}>
        <div className="app-shell-grid">
          <div className="left-rail-slot">
            <SidebarRail result={result} />
          </div>

          <main style={{ minWidth: 0, display: "grid", gap: 16 }}>
            <Hero result={result} />

            <InputComposer
              description={description}
              setDescription={(next) => {
                if (typeof next === "function") {
                  setDescription((current) => next(current));
                } else {
                  setDescription(next);
                }
                if (result) setClarifyDirty(true);
              }}
              templates={templates}
              chips={guidedChips}
              onAnalyze={runAnalysis}
              busy={busy}
            />

            {!!error && (
              <SectionCard title="Analysis error" style={{ borderColor: "rgba(176,106,124,0.24)", background: "rgba(255,247,249,0.92)" }}>
                <div style={{ color: THEME.danger, fontSize: 14, lineHeight: 1.6 }}>{error}</div>
              </SectionCard>
            )}

            <div ref={resultsRef} />

            {!result ? (
              <EmptyState />
            ) : (
              <>
                <GuidanceStrip
                  result={result}
                  dirty={clarifyDirty}
                  busy={busy}
                  onReanalyze={runAnalysis}
                  onApply={(text) => {
                    setDescription((current) => {
                      const next = joinText(current, text);
                      if (next !== current) setClarifyDirty(true);
                      return next;
                    });
                  }}
                />

                <StandardsOverview result={result} />
                <StandardsSection result={result} />
                <DiagnosticsPanel result={result} />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                  <CopyResultsButton result={result} description={description} />
                  <button type="button" onClick={runAnalysis} disabled={busy || !description.trim()} style={secondaryButtonStyle}>
                    Re-run analysis
                  </button>
                </div>
              </>
            )}
          </main>
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
  button { cursor: pointer; }
  .app-shell-grid {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  .left-rail-slot { min-width: 0; }
  @media (max-width: 1160px) {
    .hero-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 1040px) {
    .app-shell-grid { grid-template-columns: 1fr; }
    .left-rail, .left-rail-slot {
      position: static !important;
      top: auto !important;
    }
  }
  @media (max-width: 920px) {
    .guidance-grid, .snapshot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 760px) {
    .guidance-grid, .snapshot-grid, .standard-meta-grid, .hero-stats-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

const inputStyle = {
  width: "100%",
  borderRadius: 16,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.97)",
  padding: "12px 14px",
  color: THEME.text,
  outline: "none",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.55)",
};

const softBoxStyle = {
  borderRadius: 18,
  border: `1px solid ${THEME.line}`,
  background: "rgba(255,255,255,0.78)",
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
  marginTop: 8,
  fontSize: 13,
  color: THEME.text,
  lineHeight: 1.6,
  wordBreak: "break-word",
};

const inlineListRowStyle = {
  display: "grid",
  gridTemplateColumns: "10px minmax(0, 1fr)",
  gap: 10,
  alignItems: "start",
  fontSize: 13,
  color: THEME.subtext,
  lineHeight: 1.55,
};

const inlineBulletStyle = {
  width: 7,
  height: 7,
  borderRadius: 999,
  background: THEME.accent,
  marginTop: 6,
};

const templateChipStyle = {
  borderRadius: 999,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.78)",
  color: THEME.text,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 800,
};

const chipButtonStyle = {
  borderRadius: 999,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.9)",
  color: THEME.text,
  padding: "7px 12px",
  fontSize: 13,
  fontWeight: 800,
};

const tinyActionButtonStyle = {
  borderRadius: 999,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.92)",
  color: THEME.text,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
};

function primaryButtonStyle(disabled) {
  return {
    borderRadius: 16,
    border: "none",
    background: disabled ? "rgba(53,95,120,0.45)" : "linear-gradient(135deg, #355f78, #4c7a73)",
    color: "white",
    padding: "11px 16px",
    fontSize: 15,
    fontWeight: 900,
    boxShadow: disabled ? "none" : "0 10px 24px rgba(53,95,120,0.22)",
  };
}

const secondaryButtonStyle = {
  borderRadius: 16,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.84)",
  color: THEME.text,
  padding: "11px 16px",
  fontSize: 15,
  fontWeight: 800,
};
