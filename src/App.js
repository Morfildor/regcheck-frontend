import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ANALYZE_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";
const METADATA_URL = ANALYZE_URL.replace(/\/analyze$/, "/metadata/options");

const THEME = {
  bg: "#f4efe7",
  panel: "rgba(255,255,255,0.78)",
  panelStrong: "rgba(255,255,255,0.92)",
  line: "rgba(109, 99, 88, 0.14)",
  lineStrong: "rgba(109, 99, 88, 0.22)",
  text: "#28241f",
  subtext: "#665f56",
  soft: "#847c72",
  shadow: "0 10px 30px rgba(67, 57, 49, 0.08)",
  shadowLg: "0 18px 48px rgba(67, 57, 49, 0.12)",
  accent: "#2f5f69",
  accent2: "#8d6f85",
  accent3: "#5f8d8b",
  accent4: "#b7903e",
  success: "#5e7f5b",
  warning: "#a67c34",
  danger: "#b06779",
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
  LVD: { dot: "#7f8872", bg: "#efeadf", bd: "#d8d1c1", text: "#505647" },
  EMC: { dot: "#5f8d8b", bg: "#e8f2f1", bd: "#c6dddb", text: "#446b69" },
  RED: { dot: "#2f5f69", bg: "#e6eef0", bd: "#cadbe0", text: "#2e4f57" },
  RED_CYBER: { dot: "#9c7185", bg: "#f3eaee", bd: "#dfcad3", text: "#765365" },
  CRA: { dot: "#667f65", bg: "#edf3ec", bd: "#d5e0d3", text: "#4e634d" },
  ROHS: { dot: "#b7903e", bg: "#faf2df", bd: "#ecd8ab", text: "#8f6e2d" },
  REACH: { dot: "#a97869", bg: "#f6ece8", bd: "#e5d2c8", text: "#84574a" },
  GDPR: { dot: "#7f9995", bg: "#edf3f2", bd: "#d1dfde", text: "#5e7875" },
  AI_Act: { dot: "#9c7185", bg: "#f3eaee", bd: "#dfcad3", text: "#765365" },
  ESPR: { dot: "#b7903e", bg: "#faf2df", bd: "#ecd8ab", text: "#8f6e2d" },
  ECO: { dot: "#6f8f7a", bg: "#edf4ef", bd: "#d5e3d9", text: "#53705d" },
  BATTERY: { dot: "#738a5a", bg: "#f0f5e9", bd: "#dae5c7", text: "#5d6f48" },
  FCM: { dot: "#8f7060", bg: "#f6ede8", bd: "#e3d3c9", text: "#6f574a" },
  FCM_PLASTIC: { dot: "#8f7060", bg: "#f6ede8", bd: "#e3d3c9", text: "#6f574a" },
  MD: { dot: "#7c7da6", bg: "#ededf8", bd: "#d5d5eb", text: "#5e5f83" },
  MACH_REG: { dot: "#7c7da6", bg: "#ededf8", bd: "#d5d5eb", text: "#5e5f83" },
  OTHER: { dot: "#8b857a", bg: "#f3efe7", bd: "#ddd5c8", text: "#6a635a" },
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
    text: "Connected espresso machine with mains power, Wi-Fi app control, OTA updates, cloud account, grinder, pressure, water tank, and food-contact brew path.",
  },
  {
    label: "Air fryer",
    text: "Consumer household air fryer with mains power, heating element, food-contact basket, electronic controls, and optional app control.",
  },
  {
    label: "Robot vacuum",
    text: "Robot vacuum cleaner with rechargeable lithium battery, Wi-Fi and Bluetooth, cloud account, OTA firmware updates, LiDAR navigation, and camera.",
  },
  {
    label: "Air purifier",
    text: "Smart air purifier with mains power, motorized fan, electronic controls, Wi-Fi app control, networked standby, and OTA firmware updates.",
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

function getHeroStats(heroSummary, result) {
  const stats = heroSummary?.stats || [];
  const fallback = [
    {
      label: "Current CE",
      value: result?.stats?.current_legislation_count || 0,
    },
    { label: "Standards", value: result?.stats?.standards_count || 0 },
    { label: "Review Items", value: result?.stats?.review_items_count || 0 },
    {
      label: "Input Gaps",
      value: result?.stats?.missing_information_count || 0,
    },
  ];
  return stats.length ? stats : fallback;
}

function buildDynamicTemplates(products) {
  const lookup = new Map((products || []).map((p) => [p.id, p]));
  const templates = [];

  function addTemplate(productId, suffix) {
    const product = lookup.get(productId);
    if (!product) return;
    templates.push({
      label: product.label,
      text: `${product.label} with ${suffix}.`,
    });
  }

  addTemplate(
    "coffee_machine",
    "mains power, heating, water tank, grinder, food-contact brew path, app control, and OTA updates",
  );
  addTemplate(
    "electric_kettle",
    "mains power, liquid heating, food-contact water path, and optional Wi-Fi control",
  );
  addTemplate(
    "air_purifier",
    "mains power, motorized fan, sensor electronics, app control, and OTA updates",
  );
  addTemplate(
    "robot_vacuum",
    "rechargeable battery, app control, Wi-Fi and Bluetooth, cloud account, OTA updates, and LiDAR navigation",
  );
  addTemplate(
    "robot_vacuum_cleaner",
    "rechargeable battery, app control, Wi-Fi and Bluetooth, cloud account, OTA updates, and LiDAR navigation",
  );

  return templates.length ? templates : DEFAULT_TEMPLATES;
}

function buildGuidedChips(metadata, result) {
  const productId = result?.product_type;
  const product = (metadata?.products || []).find((item) => item.id === productId);
  const traits = new Set(result?.all_traits || []);
  const missingItems = result?.missing_information_items || [];
  const chips = [];

  const push = (label, text) => {
    if (!label || !text) return;
    if (!chips.some((item) => item.text === text)) {
      chips.push({ label, text });
    }
  };

  missingItems.forEach((item) => {
    (item.examples || []).slice(0, 2).forEach((example) => {
      push(titleCase(item.key), example);
    });
  });

  if (
    product?.implied_traits?.includes("food_contact") ||
    traits.has("food_contact")
  ) {
    push("Food Contact", "food-contact plastics, coatings, silicone, or rubber");
    push("Water Path", "wetted path materials, seals, and water tank");
  }

  if (
    product?.implied_traits?.includes("motorized") ||
    traits.has("motorized")
  ) {
    push("Motor", "motorized function");
    push("Pump", "pump or fluid transfer function");
  }

  if (traits.has("radio")) {
    push("Wi-Fi", "Wi-Fi radio");
    push("Bluetooth", "Bluetooth LE radio");
    push("OTA", "OTA firmware updates");
  }

  if (
    traits.has("cloud") ||
    traits.has("app_control") ||
    traits.has("internet")
  ) {
    push("Cloud", "cloud account required");
    push("Local Control", "local LAN control without cloud dependency");
    push("Patching", "security and firmware patching over the air");
  }

  if (traits.has("battery_powered")) {
    push("Battery", "rechargeable lithium battery");
  }

  if (traits.has("camera")) {
    push("Camera", "integrated camera");
  }

  if (traits.has("microphone")) {
    push("Microphone", "microphone or voice input");
  }

  if (!chips.length) {
    push("Mains", "230 V mains powered");
    push("Consumer", "consumer household use");
    push("App Control", "mobile app control");
    push("Food Contact", "food-contact plastics or coatings");
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
    const aDir = DIR_ORDER.indexOf(a.directive_key || "OTHER");
    const bDir = DIR_ORDER.indexOf(b.directive_key || "OTHER");
    const aRank = aDir === -1 ? 999 : aDir;
    const bRank = bDir === -1 ? 999 : bDir;
    return aRank - bRank || String(a.code).localeCompare(String(b.code));
  });

  return uniqueBy(sorted, (item) => `${item.code}-${item.directive_key}`);
}

function compactLegislationGroupLabel(item) {
  const sectionKey = item.section_key;
  if (sectionKey === "framework") return "Additional Requirements";
  if (sectionKey === "non_ce") return "Parallel Obligations";
  if (sectionKey === "future") return "Future Watchlist";
  if (sectionKey === "ce") return "CE Route";
  return titleCase(sectionKey);
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
      ? { bg: "rgba(255,255,255,0.7)", bd: THEME.line, text: THEME.soft }
      : tone === "soft"
        ? {
            bg: "rgba(47,95,105,0.08)",
            bd: "rgba(47,95,105,0.18)",
            text: THEME.accent,
          }
        : {
            bg: "rgba(159,112,132,0.08)",
            bd: "rgba(159,112,132,0.18)",
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
  const stats = getHeroStats(hero, result);
  const primaryRegimes = hero.primary_regimes || [];

  return (
    <SectionCard
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(250,245,238,0.94) 56%, rgba(235,241,242,0.9))",
        boxShadow: THEME.shadowLg,
        padding: 26,
      }}
    >
      <div style={{ display: "grid", gap: 20 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <RiskPill value={result?.overall_risk || "MEDIUM"} />
          <Tag>
            {titleCase(
              hero.confidence || result?.product_match_confidence || "low",
            )}{" "}
            Confidence
          </Tag>
        </div>

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
            {hero.subtitle || result?.summary}
          </div>
        </div>

        {primaryRegimes.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {primaryRegimes.map((dirKey) => (
              <DirPill key={dirKey} dirKey={dirKey} large />
            ))}
          </div>
        ) : null}

        <div
          className="hero-stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {stats.map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: 18,
                border: `1px solid ${THEME.line}`,
                background: "rgba(255,255,255,0.74)",
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
              <div
                style={{
                  marginTop: 8,
                  fontSize: 26,
                  fontWeight: 900,
                  color: THEME.text,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function ConfidencePanel({ result }) {
  if (!result) return null;

  const panel = result?.confidence_panel || {};
  const candidates = result?.product_candidates || [];
  const contradictions = result?.contradictions || [];
  const explanation =
    panel.explanation ||
    "Product confidence is based on alias match, trait overlap, context fit, and contradictory signals.";

  return (
    <SectionCard
      title="Detection confidence"
      subtitle="Minimal overview of how certain the product identification is."
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Detected Product</div>
          <div
            style={{
              marginTop: 6,
              fontSize: 20,
              fontWeight: 900,
              color: THEME.text,
            }}
          >
            {titleCase(result?.product_type || "Unclear")}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: THEME.subtext,
              lineHeight: 1.65,
            }}
          >
            {explanation}
          </div>
        </div>

        {candidates.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {candidates.slice(0, 3).map((candidate, index) => (
              <div
                key={candidate.id + index}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${THEME.line}`,
                  background: "rgba(255,255,255,0.82)",
                  padding: 13,
                  display: "grid",
                  gap: 7,
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
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: THEME.text,
                    }}
                  >
                    {candidate.label}
                  </div>
                  <Tag>{titleCase(candidate.confidence)}</Tag>
                </div>
                <div style={{ fontSize: 12, color: THEME.subtext }}>
                  Score {candidate.score}
                  {candidate.matched_alias
                    ? ` · Alias: ${candidate.matched_alias}`
                    : ""}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {contradictions.length ? (
          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${THEME.line}`,
              background: "rgba(255,255,255,0.82)",
              padding: 13,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: THEME.text }}>
              Contradictory signals
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: THEME.subtext,
                lineHeight: 1.65,
              }}
            >
              {contradictions.slice(0, 3).join(" · ")}
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
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
      subtitle="Keep it simple. Describe the product, connectivity, power source, key functions, and any relevant materials or sensors."
    >
      <div style={{ display: "grid", gap: 14 }}>
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
      subtitle="These missing points affect the route materially. Add them to sharpen the standards and legislation output."
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

function StandardCard({ item }) {
  const dirKey = item.directive || item.legislation_key || "OTHER";
  const topRight = sentenceCaseList(item.evidence_hint || []).join(" · ");
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
        borderRadius: 20,
        border: `1px solid ${THEME.line}`,
        background: "rgba(255,255,255,0.84)",
        padding: 16,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <DirPill dirKey={dirKey} />
        <Tag>{item.code}</Tag>
        <Tag>{titleCase(item.harmonization_status || "unknown")}</Tag>
        {item.item_type === "review" ? <Tag tone="accent2">Review</Tag> : null}
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
          <div style={miniTitleStyle}>Harmonized Reference</div>
          <div style={metaValueStyle}>
            {prettyValue(item.harmonized_reference)}
          </div>
        </div>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Evidence Expected</div>
          <div style={metaValueStyle}>{prettyValue(topRight || "—")}</div>
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
  const sections = result?.standard_sections || [];
  if (!sections.length) return null;

  const ordered = ["harmonized", "state_of_the_art", "review", "unknown"]
    .map((key) => sections.find((section) => section.key === key))
    .filter(Boolean);

  return (
    <SectionCard
      title="Standards route"
      subtitle="Harmonized standards first, then state-of-the-art and review-required routes."
    >
      <div style={{ display: "grid", gap: 18 }}>
        {ordered.map((section) => (
          <div
            key={section.key}
            style={{
              borderRadius: 20,
              border: `1px solid ${THEME.line}`,
              background: "rgba(255,255,255,0.74)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: `1px solid ${THEME.line}`,
                background: "rgba(255,255,255,0.62)",
                display: "flex",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
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
              <Tag>{titleCase(section.key)}</Tag>
            </div>

            <div style={{ padding: 16, display: "grid", gap: 14 }}>
              {(section.items || []).map((item) => (
                <StandardCard key={item.code + item.title} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function LegislationOverview({ result }) {
  const items = buildCompactLegislationItems(result);
  if (!items.length) return null;

  return (
    <SectionCard
      title="Applicable legislation"
      subtitle="Compact overview of the applicable regimes and additional obligations."
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {items.map((item) => {
          const tone = directiveTone(item.directive_key || "OTHER");
          return (
            <div
              key={`${item.code}-${item.directive_key}-${item.section_key}`}
              style={{
                minWidth: 0,
                borderRadius: 16,
                border: `1px solid ${tone.bd}`,
                background: tone.bg,
                color: tone.text,
                padding: "11px 12px",
                display: "grid",
                gap: 5,
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
                <span style={{ fontSize: 11, opacity: 0.82, fontWeight: 700 }}>
                  {compactLegislationGroupLabel(item)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.45,
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
        ...(section.items || []).map((item) => `  • ${item.code} — ${item.title}`),
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
      subtitle="Enter a product description to generate the standards route and compact legislation overview."
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
        background: `linear-gradient(180deg, ${THEME.bg}, #ece5da)`,
      }}
    >
      <style>{globalCss}</style>

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "28px 20px 56px",
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <Hero
            result={
              result || {
                overall_risk: "MEDIUM",
                hero_summary: { title: "RuleGrid regulatory scoping" },
              }
            }
          />

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
              <LegislationOverview result={result} />
              <ConfidencePanel result={result} />
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
  @media (max-width: 920px) {
    .hero-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 760px) {
    .two-col-grid { grid-template-columns: 1fr !important; }
    .standard-meta-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 540px) {
    .hero-stats-grid { grid-template-columns: 1fr !important; }
  }
`;

const inputStyle = {
  width: "100%",
  borderRadius: 14,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.94)",
  padding: "12px 14px",
  color: THEME.text,
  outline: "none",
};

const softBoxStyle = {
  borderRadius: 18,
  border: `1px solid ${THEME.line}`,
  background: "rgba(255,255,255,0.74)",
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
  background: "rgba(255,255,255,0.88)",
  color: THEME.text,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
};

const chipButtonStyle = {
  appearance: "none",
  cursor: "pointer",
  borderRadius: 999,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.88)",
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
    boxShadow: "0 12px 24px rgba(47,95,105,0.18)",
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