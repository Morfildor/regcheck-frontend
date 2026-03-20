import { useCallback, useEffect, useMemo, useState } from "react";

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

const DIR_NAME = {
  LVD: "Low Voltage Directive",
  EMC: "EMC Directive",
  RED: "Radio Equipment Directive",
  RED_CYBER: "RED Cybersecurity DA",
  CRA: "Cyber Resilience Act",
  ROHS: "RoHS Directive",
  REACH: "REACH Regulation",
  GDPR: "GDPR",
  AI_Act: "AI Act",
  ESPR: "ESPR",
  ECO: "Ecodesign",
  BATTERY: "Batteries Regulation",
  FCM: "Food Contact",
  OTHER: "Other",
};

const DIR_SHORT = {
  LVD: "LVD",
  EMC: "EMC",
  RED: "RED",
  RED_CYBER: "RED-Cyber",
  CRA: "CRA",
  ROHS: "RoHS",
  REACH: "REACH",
  GDPR: "GDPR",
  AI_Act: "AI Act",
  ESPR: "ESPR",
  ECO: "ECO",
  BATTERY: "Battery",
  FCM: "FCM",
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
  "BATTERY",
  "ECO",
  "ESPR",
  "CRA",
  "AI_Act",
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
    text: "Connected espresso machine with mains power, Wi-Fi app control, OTA updates, cloud brew profiles, water tank, pressure, grinder, and food-contact brew path.",
  },
  {
    label: "Air fryer",
    text: "Smart air fryer with mains power, heating element, food-contact basket coating, Wi-Fi app control, OTA updates, and cloud recipe sync.",
  },
  {
    label: "Robot vacuum",
    text: "Robot vacuum cleaner with rechargeable lithium battery, Wi-Fi and Bluetooth, cloud account, OTA firmware updates, LiDAR navigation, and camera.",
  },
  {
    label: "Air purifier",
    text: "Smart air purifier with mains power, motorized fan, PM sensor, Wi-Fi app control, networked standby, and OTA firmware updates.",
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

function directiveName(key) {
  return DIR_NAME[key] || titleCase(key);
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

function groupBy(items, getKey) {
  return (items || []).reduce((acc, item) => {
    const key = getKey(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function getHeroStats(heroSummary, result) {
  const stats = heroSummary?.stats || [];
  const fallback = [
    {
      label: "Current CE",
      value: result?.stats?.current_legislation_count || 0,
    },
    { label: "Standards", value: result?.stats?.standards_count || 0 },
    { label: "Review items", value: result?.stats?.review_items_count || 0 },
    {
      label: "Input gaps",
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
    "mains power, heating, food-contact brew path, app control, cloud account, and OTA updates",
  );
  addTemplate(
    "electric_kettle",
    "mains power, liquid heating, steam generation, food-contact plastics, and optional Wi-Fi control",
  );
  addTemplate(
    "air_purifier",
    "mains power, motorized fan, sensor electronics, networked standby, app control, and OTA updates",
  );
  addTemplate(
    "air_cleaner",
    "mains power, motorized air cleaning, app control, and cloud dashboard",
  );
  addTemplate(
    "robot_vacuum",
    "rechargeable battery, app control, Wi-Fi and Bluetooth, cloud account, OTA updates, and LiDAR navigation",
  );
  addTemplate(
    "robot_vacuum_cleaner",
    "rechargeable battery, app control, Wi-Fi and Bluetooth, cloud account, OTA updates, and LiDAR navigation",
  );

  const filtered = templates.filter(Boolean);
  return filtered.length ? filtered : DEFAULT_TEMPLATES;
}

function buildContextualChips(metadata, result) {
  const backend = result?.suggested_quick_adds || [];
  const chips = [...backend];
  const productId = result?.product_type;
  const product = (metadata?.products || []).find(
    (item) => item.id === productId,
  );
  const traits = new Set(result?.all_traits || []);

  const push = (label, text) => {
    if (!text) return;
    if (!chips.some((item) => item.text === text)) {
      chips.push({ label, text });
    }
  };

  if (
    product?.implied_traits?.includes("food_contact") ||
    traits.has("food_contact")
  ) {
    push(
      "Food-contact",
      "food-contact plastics, coatings, rubber, or silicone",
    );
    push("Water path", "water tank, seals, and wetted path materials");
  }
  if (
    product?.implied_traits?.includes("motorized") ||
    traits.has("motorized")
  ) {
    push("Motor", "motor and moving parts");
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
    push("Cloud account", "cloud account required");
    push("Local LAN", "local LAN control without cloud dependency");
    push("Patch route", "security and firmware patching over the air");
  }
  if (traits.has("battery_powered")) {
    push("Battery", "rechargeable lithium battery");
  }
  if (traits.has("display")) {
    push("Display", "display and touch UI");
  }
  push("230 V mains", "230 V mains powered");
  push("Consumer", "consumer household use");
  push("Professional", "professional or commercial use");

  return chips.slice(0, 12);
}

function sortDirectiveGroups(groups) {
  return [...(groups || [])].sort((a, b) => {
    const ai = DIR_ORDER.indexOf(a.key);
    const bi = DIR_ORDER.indexOf(b.key);
    const aRank = ai === -1 ? 999 : ai;
    const bRank = bi === -1 ? 999 : bi;
    return aRank - bRank || String(a.key).localeCompare(String(b.key));
  });
}

function prettyValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
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
            marginBottom: 18,
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
                  marginTop: 6,
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
        padding: 28,
      }}
    >
      <div style={{ display: "grid", gap: 24 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <Tag tone="soft">RuleGrid</Tag>
          <RiskPill value={result?.overall_risk || "MEDIUM"} />
          <Tag>
            {titleCase(
              hero.confidence || result?.product_match_confidence || "low",
            )}{" "}
            confidence
          </Tag>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.04,
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
              lineHeight: 1.75,
              maxWidth: 940,
            }}
          >
            {hero.subtitle || result?.summary}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {primaryRegimes.map((dirKey) => (
            <DirPill key={dirKey} dirKey={dirKey} large />
          ))}
        </div>

        <div
          className="hero-stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          {stats.map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: 20,
                border: `1px solid ${THEME.line}`,
                background: "rgba(255,255,255,0.74)",
                padding: "16px 16px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: THEME.soft,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 28,
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

function Sidebar({ result, onJump }) {
  const sections = result?.legislation_sections || [];
  return (
    <SectionCard
      title="Applicable legislation"
      subtitle="Current route, parallel obligations, and future watchlist are separated clearly."
    >
      <div style={{ display: "grid", gap: 12 }}>
        {sections.map((section) => {
          const first = section.items?.[0];
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => onJump(section.key)}
              style={{
                appearance: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                borderRadius: 18,
                border: `1px solid ${THEME.line}`,
                background: "rgba(255,255,255,0.82)",
                padding: 14,
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
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: directiveTone(first?.directive_key || "OTHER")
                        .dot,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{ fontSize: 14, fontWeight: 900, color: THEME.text }}
                  >
                    {section.title}
                  </span>
                </div>
                <Tag>{section.count}</Tag>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: THEME.subtext,
                  lineHeight: 1.6,
                }}
              >
                {(section.items || [])
                  .slice(0, 2)
                  .map((item) => item.code)
                  .join(" · ") || "No items"}
              </div>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}

function ConfidencePanel({ result }) {
  const panel = result?.confidence_panel || {};
  const candidates = result?.product_candidates || [];
  const explanation =
    panel.explanation ||
    "Product confidence is based on alias match, trait overlap, context fit, and contradictory signals.";
  const contradictions = result?.contradictions || [];
  return (
    <SectionCard
      title="Detection confidence"
      subtitle="Minimal by design, but enough to show how solid the product classification is."
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div style={softBoxStyle}>
          <div style={{ fontSize: 12, color: THEME.soft, fontWeight: 800 }}>
            Detected product
          </div>
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
              lineHeight: 1.6,
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
                  background: "rgba(255,255,255,0.8)",
                  padding: 13,
                  display: "grid",
                  gap: 8,
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
                {candidate.reasons?.length ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: THEME.subtext,
                      lineHeight: 1.6,
                    }}
                  >
                    {candidate.reasons.join(" · ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {contradictions.length ? (
          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${THEME.line}`,
              background: "rgba(255,255,255,0.8)",
              padding: 13,
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, color: THEME.text }}>
              Contradictory signals
            </div>
            <div
              style={{
                fontSize: 12,
                color: THEME.subtext,
                lineHeight: 1.7,
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
  metadata,
}) {
  const [depth, setDepth] = useState("standard");
  const [category, setCategory] = useState("");
  const [directiveFilter, setDirectiveFilter] = useState([]);

  const toggleDirective = (dir) => {
    setDirectiveFilter((current) =>
      current.includes(dir)
        ? current.filter((item) => item !== dir)
        : [...current, dir],
    );
  };

  return (
    <SectionCard
      title="Describe the product"
      subtitle="The more precise the input, the cleaner the route. Use product templates, adaptive quick-adds, and optional regime filters."
    >
      <div className="composer-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: 18 }}>
        <div style={{ display: "grid", gap: 14 }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: Connected espresso machine with Wi-Fi, OTA updates, cloud account, mains power, grinder, and food-contact brew path."
            rows={8}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 220,
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
              onClick={() => onAnalyze({ category, depth, directives: directiveFilter })}
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

        <div style={{ display: "grid", gap: 14 }}>
          <div style={miniPanelStyle}>
            <div style={miniTitleStyle}>Suggested templates</div>
            <div style={{ display: "grid", gap: 10 }}>
              {templates.slice(0, 4).map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => setDescription(template.text)}
                  style={templateButtonStyle}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: THEME.text,
                    }}
                  >
                    {template.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: THEME.subtext,
                      lineHeight: 1.6,
                    }}
                  >
                    {template.text}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={miniPanelStyle}>
            <div style={miniTitleStyle}>Analysis mode</div>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              style={selectStyle}
            >
              <option value="quick">Quick</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep</option>
            </select>
          </div>

          <div style={miniPanelStyle}>
            <div style={miniTitleStyle}>Optional category</div>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. coffee machine, robot vacuum"
              style={inputStyle}
            />
          </div>

          <div style={miniPanelStyle}>
            <div style={miniTitleStyle}>Directive focus</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(metadata?.legislations || [])
                .map((item) => item.directive_key)
                .filter(Boolean)
                .filter((value, index, arr) => arr.indexOf(value) === index)
                .sort((a, b) => {
                  const ai = DIR_ORDER.indexOf(a);
                  const bi = DIR_ORDER.indexOf(b);
                  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                })
                .map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => toggleDirective(dir)}
                    style={filterPillStyle(
                      directiveFilter.includes(dir),
                      directiveTone(dir),
                    )}
                  >
                    {directiveShort(dir)}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function InputGapsPanel({ result, onApply }) {
  const items = result?.missing_information_items || [];
  if (!items.length) return null;
  return (
    <SectionCard
      title="Clarify these first"
      subtitle="These missing inputs materially affect legislation scope, standard selection, or confidence."
    >
      <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        {items.map((item) => {
          const tone = IMPORTANCE[item.importance] || IMPORTANCE.medium;
          return (
            <div
              key={item.key}
              style={{
                borderRadius: 18,
                border: `1px solid ${tone.bd}`,
                background: tone.bg,
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
                  lineHeight: 1.7,
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

function ActionBoard({ result, onApply }) {
  const actions = result?.top_actions || result?.suggested_questions || [];
  if (!actions.length) return null;
  return (
    <SectionCard
      title="Best next actions"
      subtitle="Guided follow-up prompts and targeted additions to sharpen the route."
    >
      <div style={{ display: "grid", gap: 12 }}>
        {actions.slice(0, 6).map((action, index) => {
          const label = typeof action === "string" ? action : action.label || action.text;
          const text = typeof action === "string" ? action : action.text || action.label;
          return (
            <div
              key={label + index}
              style={{
                borderRadius: 18,
                border: `1px solid ${THEME.line}`,
                background: "rgba(255,255,255,0.82)",
                padding: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: THEME.text,
                  lineHeight: 1.5,
                }}
              >
                {label}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => onApply(text)}
                  style={secondaryButtonStyle}
                >
                  Add to input
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function LegislationSections({ result, refs }) {
  const sections = result?.legislation_sections || [];
  if (!sections.length) return null;
  return (
    <SectionCard
      title="Legislation route"
      subtitle="Current CE obligations, framework regimes, parallel non-CE obligations, and future regimes are separated to avoid mixing current requirements with watchlist items."
    >
      <div style={{ display: "grid", gap: 18 }}>
        {sections.map((section) => (
          <div
            key={section.key}
            ref={(node) => {
              refs.current[section.key] = node;
            }}
            style={{
              borderRadius: 20,
              border: `1px solid ${THEME.line}`,
              background: "rgba(255,255,255,0.72)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: `1px solid ${THEME.line}`,
                background: "rgba(255,255,255,0.68)",
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

            <div style={{ display: "grid", gap: 0 }}>
              {(section.items || []).map((item, index) => (
                <div
                  key={item.code + index}
                  style={{
                    padding: 16,
                    borderTop:
                      index === 0 ? "none" : `1px solid ${THEME.line}`,
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
                    }}
                  >
                    <DirPill dirKey={item.directive_key || "OTHER"} />
                    <Tag>{item.code}</Tag>
                    <Tag>{titleCase(item.priority)}</Tag>
                    <Tag>{titleCase(item.timing_status)}</Tag>
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 900,
                      color: THEME.text,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: THEME.subtext,
                      lineHeight: 1.7,
                    }}
                  >
                    {item.reason}
                  </div>
                  <div
                    className="standard-meta-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 10,
                    }}
                  >
                    <div style={softBoxStyle}>
                      <div style={miniTitleStyle}>Family</div>
                      <div style={{ fontSize: 13, color: THEME.text }}>
                        {prettyValue(item.family)}
                      </div>
                    </div>
                    <div style={softBoxStyle}>
                      <div style={miniTitleStyle}>Applicability</div>
                      <div style={{ fontSize: 13, color: THEME.text }}>
                        {prettyValue(item.applicability)}
                      </div>
                    </div>
                    {item.applicable_from ? (
                      <div style={softBoxStyle}>
                        <div style={miniTitleStyle}>Applicable from</div>
                        <div style={{ fontSize: 13, color: THEME.text }}>
                          {item.applicable_from}
                        </div>
                      </div>
                    ) : null}
                    {item.applicable_until ? (
                      <div style={softBoxStyle}>
                        <div style={miniTitleStyle}>Applicable until</div>
                        <div style={{ fontSize: 13, color: THEME.text }}>
                          {item.applicable_until}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function StandardCard({ item }) {
  const dirKey = item.directive || item.legislation_key || "OTHER";
  const tone = directiveTone(dirKey);
  const tags = uniqueBy(
    [
      item.category ? titleCase(item.category) : null,
      item.standard_family || null,
      ...(item.test_focus || []).map((t) => titleCase(t)),
    ]
      .filter(Boolean)
      .slice(0, 5),
    (x) => x,
  );

  return (
    <div
      style={{
        borderRadius: 20,
        border: `1px solid ${THEME.line}`,
        background: "rgba(255,255,255,0.82)",
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
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: THEME.subtext,
            lineHeight: 1.7,
          }}
        >
          {item.reason || item.notes || "Relevant standard route for this configuration."}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      <div
        className="standard-meta-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Harmonized reference</div>
          <div style={{ fontSize: 13, color: THEME.text, lineHeight: 1.6 }}>
            {prettyValue(item.harmonized_reference)}
          </div>
        </div>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Harmonized version</div>
          <div style={{ fontSize: 13, color: THEME.text, lineHeight: 1.6 }}>
            {prettyValue(item.dated_version)}
          </div>
        </div>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>State of the art</div>
          <div style={{ fontSize: 13, color: THEME.text, lineHeight: 1.6 }}>
            {prettyValue(item.version)}
          </div>
        </div>
        <div style={softBoxStyle}>
          <div style={miniTitleStyle}>Evidence expected</div>
          <div style={{ fontSize: 13, color: THEME.text, lineHeight: 1.6 }}>
            {prettyValue(item.evidence_hint)}
          </div>
        </div>
      </div>

      {(item.keywords || []).length ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {item.keywords.slice(0, 4).map((keyword) => (
            <Tag key={keyword}>{keyword}</Tag>
          ))}
        </div>
      ) : null}

      <div
        style={{
          height: 4,
          borderRadius: 999,
          background: tone.dot,
          opacity: 0.35,
        }}
      />
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
      subtitle="Harmonized standards, state-of-the-art standards, and review-required routes are separated so the user can see the route more clearly."
    >
      <div style={{ display: "grid", gap: 18 }}>
        {ordered.map((section) => (
          <div
            key={section.key}
            style={{
              borderRadius: 20,
              border: `1px solid ${THEME.line}`,
              background: "rgba(255,255,255,0.7)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: `1px solid ${THEME.line}`,
                background: "rgba(255,255,255,0.6)",
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

function EvidenceStrip({ result }) {
  const stats = result?.stats;
  if (!stats) return null;
  const signals = [
    {
      label: "Harmonized standards",
      value: stats.harmonized_standards_count,
    },
    {
      label: "State-of-the-art standards",
      value: stats.state_of_the_art_standards_count,
    },
    {
      label: "Product-gated standards",
      value: stats.product_gated_standards_count,
    },
    {
      label: "Ambiguity flags",
      value: stats.ambiguity_flag_count,
    },
  ];
  return (
    <SectionCard
      title="Signal overview"
      subtitle="Small trust layer showing the strength and complexity of the route without cluttering the main story."
    >
      <div
        className="hero-stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {signals.map((signal) => (
          <div
            key={signal.label}
            style={{
              borderRadius: 18,
              border: `1px solid ${THEME.line}`,
              background: "rgba(255,255,255,0.8)",
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: THEME.soft,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 700,
              }}
            >
              {signal.label}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 24,
                fontWeight: 900,
                color: THEME.text,
              }}
            >
              {signal.value || 0}
            </div>
          </div>
        ))}
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
      subtitle="Hidden by default. Useful for checking inferred traits and backend signals without crowding the main interface."
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
              <div style={miniTitleStyle}>All traits</div>
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
              <div
                style={{
                  marginTop: 10,
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                  color: THEME.subtext,
                  lineHeight: 1.7,
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
      "Legislation sections:",
      ...(result?.legislation_sections || []).flatMap((section) => [
        `- ${section.title} (${section.count})`,
        ...(section.items || []).map((item) => `  • ${item.code} — ${item.title}`),
      ]),
      "",
      "Standards sections:",
      ...(result?.standard_sections || []).flatMap((section) => [
        `- ${section.title} (${section.count})`,
        ...(section.items || []).map((item) => `  • ${item.code} — ${item.title}`),
      ]),
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
      subtitle="The experience is now structured to detect the product, show confidence, clarify gaps, show legislation, then show standards."
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          color: THEME.subtext,
          fontSize: 14,
          lineHeight: 1.75,
        }}
      >
        <div style={listRowStyle}>
          <span style={bulletStyle} />
          Start with a realistic product description.
        </div>
        <div style={listRowStyle}>
          <span style={bulletStyle} />
          Use the adaptive quick-add chips to enrich the input fast.
        </div>
        <div style={listRowStyle}>
          <span style={bulletStyle} />
          The output will separate current CE routes, future watchlist items,
          and non-CE obligations.
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
  const [lastOptions, setLastOptions] = useState({
    category: "",
    depth: "standard",
    directives: [],
  });
  const sectionRefs = useMemo(() => ({ current: {} }), []);

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
    () => buildContextualChips(metadata, result),
    [metadata, result],
  );

  const runAnalysis = useCallback(
    async ({ category = "", depth = "standard", directives = [] } = {}) => {
      if (!description.trim()) return;
      setBusy(true);
      setError("");
      setLastOptions({ category, depth, directives });
      try {
        const response = await fetch(ANALYZE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description, category, depth, directives }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data?.detail || `Analysis failed (${response.status})`,
          );
        }
        setResult(data);
      } catch (err) {
        setError(err.message || "Analysis failed.");
      } finally {
        setBusy(false);
      }
    },
    [description],
  );

  const applyText = useCallback((text) => {
    setDescription((current) => joinText(current, text));
  }, []);

  const rerun = useCallback(
    () => runAnalysis(lastOptions),
    [lastOptions, runAnalysis],
  );

  const jumpToSection = useCallback(
    (key) => {
      const node = sectionRefs.current[key];
      if (node && typeof node.scrollIntoView === "function") {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [sectionRefs],
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${THEME.bg}, #ece5da)`,
      }}
    >
      <style>{globalCss}</style>
      <div
        style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 20px 56px" }}
      >
        <div style={{ display: "grid", gap: 20 }}>
          <Hero
            result={
              result || {
                overall_risk: "MEDIUM",
                hero_summary: { title: "RuleGrid regulatory scoping" },
              }
            }
          />

          <div
            className="layout-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "320px minmax(0, 1fr)",
              gap: 20,
              alignItems: "start",
            }}
          >
            <div
              style={{ display: "grid", gap: 20, position: "sticky", top: 18 }}
              className="sidebar-stack"
            >
              <Sidebar result={result} onJump={jumpToSection} />
              <ConfidencePanel result={result} />
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              <InputComposer
                description={description}
                setDescription={setDescription}
                templates={templates}
                chips={chips}
                onAnalyze={runAnalysis}
                busy={busy}
                metadata={metadata}
              />

              {error ? (
                <SectionCard title="Analysis error">
                  <div style={{ color: THEME.danger, fontSize: 14 }}>
                    {error}
                  </div>
                </SectionCard>
              ) : null}

              {!result ? (
                <EmptyState />
              ) : (
                <>
                  <InputGapsPanel result={result} onApply={applyText} />
                  <ActionBoard result={result} onApply={applyText} />
                  <LegislationSections result={result} refs={sectionRefs} />
                  <StandardsSection result={result} />
                  <EvidenceStrip result={result} />
                  <DiagnosticsPanel result={result} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <CopyResultsButton
                      result={result}
                      description={description}
                    />
                    <button
                      type="button"
                      onClick={rerun}
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
      </div>
    </div>
  );
}

const globalCss = `
  * { box-sizing: border-box; }
  html, body, #root { margin: 0; padding: 0; min-height: 100%; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: ${THEME.text}; }
  button, input, select, textarea { font: inherit; }
  @media (max-width: 1180px) {
    .layout-grid { grid-template-columns: 1fr !important; }
    .sidebar-stack { position: static !important; }
    .composer-grid { grid-template-columns: 1fr !important; }
    .hero-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 820px) {
    .two-col-grid { grid-template-columns: 1fr !important; }
    .standard-meta-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 640px) {
    .hero-stats-grid { grid-template-columns: 1fr 1fr !important; }
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

const selectStyle = {
  borderRadius: 14,
  border: `1px solid ${THEME.lineStrong}`,
  background: "rgba(255,255,255,0.94)",
  padding: "10px 12px",
  color: THEME.text,
  outline: "none",
};

const miniPanelStyle = {
  borderRadius: 18,
  border: `1px solid ${THEME.line}`,
  background: "rgba(255,255,255,0.84)",
  padding: 14,
  display: "grid",
  gap: 10,
};

const miniTitleStyle = {
  fontSize: 12,
  fontWeight: 900,
  color: THEME.soft,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const templateButtonStyle = {
  appearance: "none",
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  borderRadius: 14,
  border: `1px solid ${THEME.line}`,
  background: "rgba(255,255,255,0.92)",
  padding: 12,
  display: "grid",
  gap: 6,
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

function filterPillStyle(active, tone) {
  return {
    appearance: "none",
    cursor: "pointer",
    borderRadius: 999,
    border: `1px solid ${active ? tone.bd : THEME.lineStrong}`,
    background: active ? tone.bg : "rgba(255,255,255,0.88)",
    color: active ? tone.text : THEME.text,
    padding: "7px 11px",
    fontSize: 12,
    fontWeight: 800,
  };
}

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

const softBoxStyle = {
  borderRadius: 18,
  border: `1px solid ${THEME.line}`,
  background: "rgba(255,255,255,0.74)",
  padding: 14,
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