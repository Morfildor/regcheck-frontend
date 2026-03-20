import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ANALYZE_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";
const METADATA_URL = ANALYZE_URL.replace(/\/analyze$/, "/metadata/options");

const THEME = {
  bg: "#f5efe7",
  bg2: "#e9dfd4",
  bg3: "#efe8f2",
  panel: "rgba(255,255,255,0.84)",
  panelStrong: "rgba(255,255,255,0.94)",
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
  peach: "#d9a77c",
  sage: "#90a77f",
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

const SECTION_TONES = {
  harmonized: {
    bg: "linear-gradient(135deg, rgba(124,158,181,0.14), rgba(124,158,181,0.03))",
    bd: "rgba(124,158,181,0.18)",
    tagBg: "rgba(124,158,181,0.10)",
    tagText: "#4f6f85",
  },
  state_of_the_art: {
    bg: "linear-gradient(135deg, rgba(210,160,109,0.14), rgba(210,160,109,0.03))",
    bd: "rgba(210,160,109,0.18)",
    tagBg: "rgba(210,160,109,0.10)",
    tagText: "#8b6637",
  },
  review: {
    bg: "linear-gradient(135deg, rgba(200,140,160,0.13), rgba(200,140,160,0.03))",
    bd: "rgba(200,140,160,0.18)",
    tagBg: "rgba(200,140,160,0.10)",
    tagText: "#8d6474",
  },
  unknown: {
    bg: "linear-gradient(135deg, rgba(183,171,164,0.12), rgba(183,171,164,0.03))",
    bd: "rgba(183,171,164,0.18)",
    tagBg: "rgba(183,171,164,0.10)",
    tagText: "#706762",
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
    (item.examples || []).slice(0, 2).forEach((example) => push(titleCase(item.key), example));
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

function buildGuidanceItems(result) {
  const traits = new Set(result?.all_traits || []);
  const rawItems = result?.missing_information_items || [];
  const items = [];
  const seen = new Set();

  const add = (key, title, why, importance, choices = []) => {
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ key, title, why, importance, choices: choices.filter(Boolean).slice(0, 3) });
  };

  if (traits.has("radio")) {
    add("radio_stack", "Confirm radios", "Changes RED and RF scope.", "high", ["Wi-Fi radio", "Bluetooth LE radio", "NFC radio"]);
  }
  if (traits.has("cloud") || traits.has("internet") || traits.has("app_control") || traits.has("ota")) {
    add(
      "connected_architecture",
      "Confirm connected design",
      "Changes EN 18031 and cybersecurity route.",
      "high",
      ["cloud account required", "local LAN control without cloud dependency", "OTA firmware updates"]
    );
  }
  if (traits.has("food_contact")) {
    add("food_contact", "Confirm wetted materials", "Changes food-contact obligations.", "medium", ["food-contact plastics", "silicone seal", "metal wetted path"]);
  }
  if (traits.has("battery_powered")) {
    add("battery", "Confirm battery setup", "Changes Battery Regulation scope.", "medium", ["rechargeable lithium battery", "replaceable battery", "battery supplied with the product"]);
  }
  if (traits.has("camera") || traits.has("microphone") || traits.has("personal_data_likely")) {
    add("data_functions", "Confirm sensitive functions", "Changes cybersecurity/privacy expectations.", "high", ["integrated camera", "microphone or voice input", "user account and profile data"]);
  }

  rawItems.forEach((item) => {
    add(item.key, titleCase(item.key), item.message, item.importance || "medium", item.examples || []);
  });

  return items.slice(0, 4);
}

function buildCompactLegislationItems(result) {
  const sections = result?.legislation_sections || [];
  const allItems = sections.flatMap((section) =>
    (section.items || []).map((item) => ({
      ...item,
      section_key: section.key,
      section_title: section.title,
    }))
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
    const aDir = normalizeStandardDirective(a);
    const bDir = normalizeStandardDirective(b);
    return directiveRank(aDir) - directiveRank(bDir) || String(a.code || "").localeCompare(String(b.code || ""));
  });
}

function buildSectionsFromFlatResult(result) {
  const standardRows = (result?.standards || []).map((item) => ({ ...item, item_type: item.item_type || "standard" }));
  const reviewRows = (result?.review_items || []).map((item) => ({ ...item, item_type: "review" }));

  const grouped = {};
  [...standardRows, ...reviewRows].forEach((item) => {
    let key = item.harmonization_status || (item.item_type === "review" ? "review" : "unknown");
    if (!["harmonized", "state_of_the_art", "review", "unknown"].includes(key)) key = "unknown";
    if (!grouped[key]) {
      grouped[key] = {
        key,
        title:
          key === "harmonized"
            ? "Harmonized standards"
            : key === "state_of_the_art"
              ? "State of the art / latest technical route"
              : key === "review"
                ? "Review-required routes"
                : "Other standards",
        count: 0,
        items: [],
      };
    }
    grouped[key].items.push(item);
  });

  return ["harmonized", "state_of_the_art", "review", "unknown"]
    .filter((key) => grouped[key])
    .map((key) => ({
      ...grouped[key],
      items: sortStandardItems(grouped[key].items),
      count: grouped[key].items.length,
    }));
}

function buildDirectiveBreakdown(result) {
  const sections = result?.standard_sections?.length ? result.standard_sections : buildSectionsFromFlatResult(result);
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
        ? { bg: "rgba(124,158,181,0.10)", bd: "rgba(124,158,181,0.18)", text: THEME.accent }
        : { bg: "rgba(200,140,160,0.10)", bd: "rgba(200,140,160,0.18)", text: THEME.accent2 };

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
        backdropFilter: "blur(12px)",
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
  const primaryRegimes = hero.primary_regimes || [];
  const showMeta = Boolean(result);

  return (
    <SectionCard
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,243,238,0.95) 40%, rgba(240,236,246,0.94) 72%, rgba(235,243,241,0.94))",
        boxShadow: THEME.shadowLg,
        padding: 26,
      }}
    >
      <div style={{ display: "grid", gap: 16, justifyItems: "center", textAlign: "center" }}>
        {showMeta ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "center" }}>
            <RiskPill value={result?.overall_risk || "MEDIUM"} />
            <Tag>{titleCase(hero.confidence || result?.product_match_confidence || "low")} Confidence</Tag>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 6, maxWidth: 980 }}>
          <div
            style={{
              fontSize: 31,
              lineHeight: 1.04,
              fontWeight: 900,
              color: THEME.text,
              letterSpacing: "-0.03em",
            }}
          >
            {hero.title || "RuleGrid regulatory scoping"}
          </div>
          <div style={{ fontSize: 15, color: THEME.subtext, lineHeight: 1.7 }}>
            {hero.subtitle ||
              "Describe the product clearly to generate the standards route and the applicable legislation path."}
          </div>
        </div>

        {showMeta && primaryRegimes.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
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
  const confidence = result?.confidence_panel?.confidence || result?.product_match_confidence || "low";

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
                  <span style={{ fontSize: 10, opacity: 0.82, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
              <Tag tone="soft">{titleCase(confidence)}</Tag>
            </div>
          </div>
        </div>
      </SectionCard>
    </aside>
  );
}

function InputComposer({ description, setDescription, templates, chips, onAnalyze, busy, onDirty }) {
  return (
    <SectionCard
      title="Describe the product"
      subtitle="Describe product type, connectivity, power source, key functions, sensors, materials, and battery if relevant."
      style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.93), rgba(252,249,247,0.88))" }}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {templates.slice(0, 4).map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => {
                setDescription(template.text);
                onDirty(false);
              }}
              style={templateChipStyle}
            >
              {template.label}
            </button>
          ))}
        </div>

        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            onDirty(false);
          }}
          placeholder="Example: Connected espresso machine with Wi-Fi, OTA updates, cloud account, mains power, grinder, pressure system, and food-contact brew path."
          rows={7}
          style={{ ...inputStyle, resize: "vertical", minHeight: 180, lineHeight: 1.65 }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {chips.map((chip) => (
            <button
              key={chip.label + chip.text}
              type="button"
              onClick={() => {
                setDescription((current) => joinText(current, chip.text));
                onDirty(true);
              }}
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
          <button
            type="button"
            onClick={() => {
              setDescription("");
              onDirty(false);
            }}
            style={secondaryButtonStyle}
          >
            Clear
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function GuidanceStrip({ result, dirty, busy, onReanalyze, onApply }) {
  const items = buildGuidanceItems(result);
  if (!items.length) return null;

  return (
    <SectionCard
      title="Guidance"
      subtitle="Compact refinements before trusting the route."
      right={<button type="button" onClick={onReanalyze} disabled={!dirty || busy} style={primaryButtonStyle(!dirty || busy)}>{busy ? "Analyzing..." : dirty ? "Refresh route" : "Route current"}</button>}
      style={{ padding: 18, borderRadius: 20 }}
    >
      <div className="guidance-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
        {items.map((item) => {
          const tone = IMPORTANCE[item.importance] || IMPORTANCE.medium;
          return (
            <div
              key={item.key}
              style={{
                borderRadius: 16,
                border: `1px solid ${tone.bd}`,
                background: tone.bg,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: tone.text }}>{item.title}</div>
                <Tag>{titleCase(item.importance)}</Tag>
              </div>
              <div style={{ fontSize: 12, color: THEME.subtext, lineHeight: 1.45 }}>{item.why}</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {item.choices.map((choice) => (
                  <button key={choice} type="button" onClick={() => onApply(choice)} style={miniChipButtonStyle}>
                    + {choice}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {dirty ? <div style={{ marginTop: 10, fontSize: 12, color: THEME.accent2, fontWeight: 800 }}>Input updated. Refresh route to update standards.</div> : null}
    </SectionCard>
  );
}

function StandardsOverview({ result }) {
  const breakdown = buildDirectiveBreakdown(result);
  if (!breakdown.length) return null;

  return (
    <SectionCard
      title="Route snapshot"
      subtitle="Quick view of where the standards are concentrated."
      style={{ padding: 18, borderRadius: 20, background: "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(247,244,250,0.82))" }}
    >
      <div className="snapshot-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }}>
        {breakdown.map(({ key, count }) => {
          const tone = directiveTone(key);
          return (
            <div
              key={key}
              style={{
                borderRadius: 16,
                border: `1px solid ${tone.bd}`,
                background: tone.bg,
                padding: "12px 10px",
                display: "grid",
                gap: 6,
                boxShadow: `0 0 0 1px ${tone.glow}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: tone.dot, flexShrink: 0 }} />
                <div style={{ fontSize: 12, fontWeight: 900, color: tone.text }}>{directiveShort(key)}</div>
              </div>
              <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 900, color: THEME.text }}>{count}</div>
              <div style={{ fontSize: 11, color: THEME.subtext }}>standards</div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function StandardCard({ item, sectionKey }) {
  const dirKey = normalizeStandardDirective(item);
  const dirTone = directiveTone(dirKey);
  const sectionTone = SECTION_TONES[sectionKey] || SECTION_TONES.unknown;
  const evidence = sentenceCaseList(item.evidence_hint || []).join(" · ");
  const summary = item.standard_summary || item.reason || item.notes || item.title;

  return (
    <div
      style={{
        borderRadius: 22,
        border: `1px solid ${dirTone.bd}`,
        background: "rgba(255,255,255,0.94)",
        overflow: "hidden",
        boxShadow: `0 12px 24px ${dirTone.glow}`,
      }}
    >
      <div
        style={{
          padding: "15px 16px 12px",
          background: `linear-gradient(135deg, ${dirTone.bg}, rgba(255,255,255,0.95))`,
          borderBottom: `1px solid ${dirTone.bd}`,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
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
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 12,
              background: dirTone.dot,
              color: "white",
              padding: "9px 13px",
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              boxShadow: `0 0 0 4px ${dirTone.glow}`,
              whiteSpace: "nowrap",
            }}
          >
            {item.code}
          </span>
        </div>

        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: THEME.text }}>{item.title}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: THEME.subtext, lineHeight: 1.65 }}>{summary}</div>
        </div>
      </div>

      <div className="standard-meta-grid" style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Harmonized Reference</div>
          <div style={metaValueStyle}>{prettyValue(item.harmonized_reference)}</div>
        </div>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Evidence Expected</div>
          <div style={metaValueStyle}>{prettyValue(evidence || "—")}</div>
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
  const sourceSections =
    result?.standard_sections?.length
      ? result.standard_sections.map((section) => ({
          ...section,
          items: sortStandardItems(section.items || []).map((item) => ({ ...item, directive: normalizeStandardDirective(item) })),
        }))
      : buildSectionsFromFlatResult(result);

  const ordered = ["harmonized", "state_of_the_art", "review", "unknown"]
    .map((key) => sourceSections.find((section) => section.key === key))
    .filter(Boolean);

  if (!ordered.length) return null;

  return (
    <SectionCard
      title="Standards route"
      subtitle="Primary output. Ordered to keep LVD, EMC, RED and RED cybersecurity visible and readable."
      style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(249,246,243,0.88))" }}
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
                background: "rgba(255,255,255,0.78)",
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
                  <div style={{ fontSize: 16, fontWeight: 900, color: THEME.text }}>{section.title}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: THEME.subtext }}>{section.count} item{section.count === 1 ? "" : "s"}</div>
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
                  <StandardCard key={`${section.key}-${item.code}-${item.title}`} item={item} sectionKey={section.key} />
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
      right={<button type="button" onClick={() => setOpen((value) => !value)} style={secondaryButtonStyle}>{open ? "Hide" : "Show"}</button>}
    >
      {open ? (
        <div style={{ display: "grid", gap: 14 }}>
          {traits.length ? (
            <div style={softBoxStyle}>
              <div style={miniTitleStyle}>All Traits</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {traits.map((trait) => (
                  <Tag key={trait}>{titleCase(trait)}</Tag>
                ))}
              </div>
            </div>
          ) : null}

          {diagnostics.length ? (
            <div style={softBoxStyle}>
              <div style={miniTitleStyle}>Diagnostics</div>
              <div style={{ marginTop: 10, display: "grid", gap: 8, fontSize: 13, color: THEME.subtext, lineHeight: 1.65 }}>
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
    const sections = result?.standard_sections?.length ? result.standard_sections : buildSectionsFromFlatResult(result);

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
      ...sections.flatMap((section) => [
        `- ${section.title} (${section.count})`,
        ...sortStandardItems(section.items || []).map((item) => `  • ${item.code} — ${item.title}`),
      ]),
      "",
      "Applicable legislation:",
      ...buildCompactLegislationItems(result).map((item) => `- ${item.code} — ${item.title}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {}
  };

  return <button type="button" onClick={handleCopy} style={secondaryButtonStyle}>Copy summary</button>;
}

function EmptyState() {
  return (
    <SectionCard title="Ready for analysis" subtitle="Enter a product description to generate the standards route and legislation overview.">
      <div style={{ display: "grid", gap: 12, color: THEME.subtext, fontSize: 14, lineHeight: 1.7 }}>
        <div style={listRowStyle}><span style={bulletStyle} />Start with a realistic product description.</div>
        <div style={listRowStyle}><span style={bulletStyle} />Mention connectivity, power source, key functions, and special materials or sensors.</div>
        <div style={listRowStyle}><span style={bulletStyle} />Use the guidance strip to refine the standards route if needed.</div>
      </div>
    </SectionCard>
  );
}

export default function App() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clarifyDirty, setClarifyDirty] = useState(false);

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

  const chips = useMemo(() => buildGuidedChips(metadata, result), [metadata, result]);

  useEffect(() => {
    if (!result || !resultsRef.current) return;
    const timer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      if (!response.ok) throw new Error(data?.detail || `Analysis failed (${response.status})`);
      setResult(data);
      setClarifyDirty(false);
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }, [description]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at top left, rgba(200,140,160,0.10), transparent 24%),
          radial-gradient(circle at top right, rgba(124,158,181,0.10), transparent 24%),
          radial-gradient(circle at bottom right, rgba(135,179,167,0.10), transparent 22%),
          linear-gradient(180deg, ${THEME.bg}, ${THEME.bg2} 62%, ${THEME.bg3})
        `,
      }}
    >
      <style>{globalCss}</style>

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 20px 56px" }}>
        <div className="app-shell-grid">
          <div className="left-rail-slot">{result ? <SidebarRail result={result} /> : null}</div>

          <main style={{ display: "grid", gap: 18, minWidth: 0 }}>
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
              <SectionCard title="Analysis error">
                <div style={{ color: THEME.danger, fontSize: 14 }}>{error}</div>
              </SectionCard>
            ) : null}

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
  .app-shell-grid {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }
  .left-rail-slot { min-width: 0; }
  @media (max-width: 1120px) {
    .snapshot-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 1040px) {
    .app-shell-grid { grid-template-columns: 1fr; }
    .left-rail, .left-rail-slot {
      position: static !important;
      top: auto !important;
    }
  }
  @media (max-width: 960px) {
    .guidance-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 760px) {
    .guidance-grid, .snapshot-grid, .standard-meta-grid { grid-template-columns: 1fr !important; }
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
  background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,240,247,0.92))",
  color: THEME.text,
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

const miniChipButtonStyle = {
  appearance: "none",
  cursor: "pointer",
  borderRadius: 999,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.88)",
  color: THEME.text,
  padding: "6px 9px",
  fontSize: 11,
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