import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ListChecks,
  LoaderCircle,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
  Zap,
  FlaskConical,
  Wifi,
  Cloud,
  Cpu,
  Droplets,
  Leaf,
  ShoppingCart,
} from "lucide-react";
import "./App.css";
import {
  ANALYZE_URL,
  DEFAULT_TEMPLATES,
  IMPORTANCE,
  METADATA_URL,
  SECTION_TONES,
  STATUS,
  buildClipboardSummary,
  buildCompactLegislationItems,
  buildDirectiveBreakdown,
  buildDynamicTemplates,
  buildGuidanceItems,
  buildLegislationGroups,
  buildRouteSections,
  directiveRank,
  directiveShort,
  directiveTone,
  formatUiLabel,
  joinText,
  normalizeStandardDirective,
  prettyValue,
  routeTitle,
  sentenceCaseList,
  titleCaseMinor,
  formatStageLabel,
} from "./appHelpers";

/* ================================================================
   ErrorBoundary
   ================================================================ */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback" role="alert">
          <TriangleAlert size={15} />
          <div>
            <div className="error-boundary-fallback__title">
              {this.props.label || "This section could not be rendered"}
            </div>
            <div className="error-boundary-fallback__text">
              Try starting a new analysis if the problem persists.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


/* ================================================================
   SMART SUGGESTION ENGINE v2
   ================================================================ */

const TEXT_SIGNALS = [
  { re: /\b(mains|230v|240v|plug.?in|corded|wall.?socket|ac.?power)\b/i,  trait: "mains_powered" },
  { re: /\b(battery|rechargeable|cordless|lithium)\b/i,                    trait: "battery_powered" },
  { re: /\b(usb.?c?|usb.powered)\b/i,                                      trait: "usb_powered" },
  { re: /\b(external.*(psu|adapter|adaptor)|power.?supply|charger.?brick)\b/i, trait: "external_psu" },
  { re: /\b(wi.?fi|wireless.*connect|802\.11)\b/i,                         trait: "wifi" },
  { re: /\b(bluetooth|ble\b)\b/i,                                           trait: "bluetooth" },
  { re: /\b(app.?control|mobile.?app|smartphone.?app|ios.*android|android.*ios)\b/i, trait: "app_control" },
  { re: /\b(cloud|remote.?server|vendor.?backend)\b/i,                     trait: "cloud" },
  { re: /\b(ota|over.?the.?air|firmware.?update|software.?update)\b/i,     trait: "ota" },
  { re: /\b(internet|online.?service)\b/i,                                  trait: "internet" },
  { re: /\b(account|user.?login|sign.?in)\b/i,                             trait: "account" },
  { re: /\b(password|pin\b|authentication)\b/i,                            trait: "authentication" },
  { re: /\b(cellular|4g|5g|lte|sim.?card)\b/i,                             trait: "cellular" },
  { re: /\b(zigbee)\b/i,                                                    trait: "zigbee" },
  { re: /\b(thread.?protocol|thread.?mesh)\b/i,                            trait: "thread" },
  { re: /\b(matter.?protocol|matter.?smart)\b/i,                           trait: "matter" },
  { re: /\b(nfc)\b/i,                                                       trait: "nfc" },
  { re: /\b(food.?contact|wetted.?path|brew.?path|in.?contact.?with.?food)\b/i, trait: "food_contact" },
  { re: /\b(no.*(food|beverage).?contact|does.?not.?contact.?food)\b/i,   trait: "no_food_contact" },
  { re: /\b(pressure|bar\b|pump|pressuri[sz]ed)\b/i,                      trait: "pressure" },
  { re: /\b(steam|steamer)\b/i,                                             trait: "steam" },
  { re: /\b(outdoor|outside|weather|ip[456][0-9]|ipx)\b/i,                trait: "outdoor_use" },
  { re: /\b(indoor.?only|indoor.?use)\b/i,                                 trait: "indoor_use" },
  { re: /\b(camera|webcam|video.?capture)\b/i,                             trait: "camera" },
  { re: /\b(microphone|voice.?(control|command)|alexa|google.?assistant)\b/i, trait: "microphone" },
  { re: /\b(ai\b|machine.?learning|ml.?model|neural)\b/i,                  trait: "ai_related" },
  { re: /\b(payment|subscription|transaction|wallet|order.?within)\b/i,   trait: "monetary_transaction" },
  { re: /\b(motor|motorized|compressor|turbine)\b/i,                       trait: "motorized" },
  { re: /\b(no.?wire|no.?radio|local.?only|no.?connect)\b/i,              trait: "local_only" },
];

const PRODUCT_CONTEXTS = [
  { re: /\b(kettle|water.?boiler)\b/i,
    implied: ["liquid_heating","water_heating","food_contact","mains_power_likely","heating"] },
  { re: /\b(espresso|coffee.?machine|coffee.?maker|bean.?to.?cup)\b/i,
    implied: ["coffee_brewing","beverage_preparation","food_contact","mains_power_likely"] },
  { re: /\b(coffee.?grinder|bean.?grinder)\b/i,
    implied: ["coffee_grinding","food_contact","motorized","mains_power_likely"] },
  { re: /\b(fridge|refrigerator|fridge.?freezer)\b/i,
    implied: ["refrigeration","cooling","food_contact","mains_power_likely","motorized"] },
  { re: /\b(freezer)\b/i,
    implied: ["refrigeration","cooling","food_contact","mains_power_likely","motorized"] },
  { re: /\b(air.?fry|airfry)\b/i,
    implied: ["cooking","heating","food_preparation","mains_power_likely"] },
  { re: /\b(robot.?vacuum|robovac|robotic.?clean)\b/i,
    implied: ["surface_cleaning","motorized","battery_powered"] },
  { re: /\b(vacuum.?cleaner|hoover)\b/i,
    implied: ["surface_cleaning","motorized"] },
  { re: /\b(dishwasher)\b/i,
    implied: ["washing","water_contact","motorized","mains_power_likely","food_contact"] },
  { re: /\b(washing.?machine|washer)\b/i,
    implied: ["washing","textile_care","motorized","mains_power_likely"] },
  { re: /\b(tumble.?dryer|clothes.?dryer)\b/i,
    implied: ["drying","textile_care","motorized","mains_power_likely"] },
  { re: /\b(microwave)\b/i,
    implied: ["cooking","heating","mains_power_likely"] },
  { re: /\b(toaster)\b/i,
    implied: ["cooking","heating","food_contact","mains_power_likely"] },
  { re: /\b(oven|bake.?oven)\b/i,
    implied: ["cooking","heating","mains_power_likely"] },
  { re: /\b(blender|smoothie.?maker|juicer)\b/i,
    implied: ["food_preparation","motorized","food_contact","mains_power_likely"] },
  { re: /\b(food.?processor|stand.?mixer|mixer)\b/i,
    implied: ["food_preparation","motorized","food_contact","mains_power_likely"] },
  { re: /\b(air.?purifier|air.?cleaner)\b/i,
    implied: ["air_cleaning","air_treatment","motorized","mains_power_likely"] },
  { re: /\b(fan\b|desk.?fan|tower.?fan|ceiling.?fan)\b/i,
    implied: ["ventilation","motorized","mains_power_likely"] },
  { re: /\b(heater|space.?heater|electric.?heater|radiator)\b/i,
    implied: ["heating","heating_personal_environment","mains_power_likely"] },
  { re: /\b(air.?con|aircon|air.?conditioner)\b/i,
    implied: ["air_treatment","cooling","heating","mains_power_likely","motorized"] },
  { re: /\b(lawn.?mower|robot.?mow|robotic.?mow)\b/i,
    implied: ["garden_use","outdoor_use","motorized"] },
  { re: /\b(smart.?plug|power.?strip|smart.?socket)\b/i,
    implied: ["mains_powered","electrical"] },
  { re: /\b(smart.?speaker|voice.?assistant)\b/i,
    implied: ["speaker","microphone","wifi","cloud","mains_power_likely"] },
  { re: /\b(doorbell|video.?door)\b/i,
    implied: ["camera","outdoor_use","fixed_installation"] },
  { re: /\b(security.?camera|ip.?camera|surveillance)\b/i,
    implied: ["camera","outdoor_use","data_storage"] },
  { re: /\b(pet.?feeder|automatic.?feeder)\b/i,
    implied: ["animal_use","food_contact"] },
  { re: /\b(electric.?toothbrush|oral irrigator)\b/i,
    implied: ["oral_care","personal_care","skin_contact","wet_environment","battery_powered"] },
  { re: /\b(hair.?dryer|hair.?straighten|hair.?curler|curling.?iron)\b/i,
    implied: ["hair_care","personal_care","mains_power_likely","heating"] },
];

const SUGGESTION_TIERS = [
  {
    id: "power",
    label: "Power source",
    icon: "zap",
    show_if: (det) => det.hasProduct && !det.hasPower,
    suggestions: [
      { label: "Mains powered",    text: "mains powered (230 V AC)" },
      { label: "Battery",          text: "battery powered with rechargeable pack" },
      { label: "External adapter", text: "powered via external AC/DC power supply adapter" },
      { label: "USB-C powered",    text: "USB-C powered (low-voltage supply)" },
    ],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    icon: "wifi",
    show_if: (det) => !det.hasRadio && !det.hasLocalOnly && (det.hasProduct || det.hasPower),
    suggestions: [
      { label: "Wi-Fi",        text: "Wi-Fi connected (2.4 GHz)" },
      { label: "Bluetooth",    text: "Bluetooth connected (BLE)" },
      { label: "App control",  text: "controllable via mobile app (iOS and Android)" },
      { label: "No wireless",  text: "no wireless connectivity — fully local operation" },
    ],
  },
  {
    id: "cloud_software",
    label: "Cloud & software",
    icon: "cloud",
    show_if: (det) => det.hasRadio && !det.hasCloud && !det.hasOTA && !det.hasAccount,
    suggestions: [
      { label: "Cloud account",  text: "with cloud account and user login (email + password)" },
      { label: "OTA updates",    text: "with over-the-air firmware updates" },
      { label: "Local only",     text: "local network only — no cloud or OTA dependency" },
    ],
  },
  {
    id: "food_contact",
    label: "Food & materials",
    icon: "flask",
    show_if: (det) => det.hasFoodContext && !det.hasFoodContact && !det.hasNoFoodContact,
    suggestions: [
      { label: "Food-contact path",  text: "food-contact wetted path (plastic and metal parts contact food or beverages)" },
      { label: "Plastic food parts", text: "plastic food-contact parts in brew or food path" },
      { label: "No food contact",    text: "no direct food or beverage contact" },
    ],
  },
  {
    id: "pressure_steam",
    label: "Pressure & steam",
    icon: "droplets",
    show_if: (det) => det.hasCoffeeContext && !det.hasPressure && !det.hasSteam,
    suggestions: [
      { label: "Pressure system", text: "pressurised brew system (15-bar pump)" },
      { label: "Steam wand",      text: "steam wand for milk frothing" },
      { label: "No pressure",     text: "drip or filter brew — no pressure" },
    ],
  },
  {
    id: "outdoor_context",
    label: "Use environment",
    icon: "leaf",
    show_if: (det) => det.hasOutdoorContext && !det.hasOutdoor && !det.hasIndoor,
    suggestions: [
      { label: "Outdoor rated",  text: "for outdoor use — weather and dust exposure (IP-rated enclosure)" },
      { label: "Indoor only",    text: "indoor use only — not weather exposed" },
    ],
  },
  {
    id: "cybersecurity",
    label: "Account & auth",
    icon: "cpu",
    show_if: (det) => (det.hasCloud || det.hasInternet) && !det.hasAccount && !det.hasAuthentication,
    suggestions: [
      { label: "User account",     text: "requires user account creation (email, password, profile)" },
      { label: "Authentication",   text: "password and multi-factor authentication for device access" },
      { label: "No account",       text: "no user account required — device works standalone" },
    ],
  },
  {
    id: "payments",
    label: "Transactions",
    icon: "cart",
    show_if: (det) => det.hasAppControl && !det.hasMonetary,
    suggestions: [
      { label: "In-app purchase",  text: "supports in-app purchases or subscription billing" },
      { label: "No payments",      text: "no monetary transactions or subscription functions" },
    ],
  },
];

function detectTraits(text) {
  const t = text.toLowerCase();
  const signals = new Set();

  for (const { re, trait } of TEXT_SIGNALS) {
    if (re.test(t)) signals.add(trait);
  }

  let impliedTraits = new Set();
  let hasProduct = false;
  for (const { re, implied } of PRODUCT_CONTEXTS) {
    if (re.test(t)) {
      hasProduct = true;
      implied.forEach(i => impliedTraits.add(i));
    }
  }

  const has = (trait) => signals.has(trait) || impliedTraits.has(trait);

  return {
    hasProduct,
    hasPower:          has("mains_powered") || has("battery_powered") || has("usb_powered") || has("external_psu") || has("mains_power_likely"),
    hasRadio:          has("wifi") || has("bluetooth") || has("cellular") || has("zigbee") || has("thread") || has("nfc"),
    hasAppControl:     has("app_control"),
    hasCloud:          has("cloud"),
    hasOTA:            has("ota"),
    hasInternet:       has("internet"),
    hasAccount:        has("account"),
    hasAuthentication: has("authentication"),
    hasLocalOnly:      has("local_only"),
    hasFoodContext:    has("food_contact") || has("food_preparation") || has("beverage_preparation") || has("liquid_heating") || has("coffee_brewing"),
    hasFoodContact:    has("food_contact"),
    hasNoFoodContact:  has("no_food_contact"),
    hasCoffeeContext:  has("coffee_brewing") || t.includes("espresso") || t.includes("coffee"),
    hasPressure:       has("pressure"),
    hasSteam:          has("steam"),
    hasOutdoorContext: has("outdoor_use") || has("garden_use"),
    hasOutdoor:        signals.has("outdoor_use"),
    hasIndoor:         has("indoor_use"),
    hasMonetary:       has("monetary_transaction"),
    raw: signals,
  };
}

function useSmartSuggestions(description, backendChips) {
  return useMemo(() => {
    const text = (description || "").trim();

    if (backendChips && backendChips.length) {
      return [{ id: "backend", label: "Suggested additions", suggestions: backendChips.slice(0, 6) }];
    }

    if (text.length < 5) return [];

    const det = detectTraits(text);
    const groups = [];

    for (const tier of SUGGESTION_TIERS) {
      if (tier.show_if(det)) {
        groups.push({ id: tier.id, label: tier.label, icon: tier.icon, suggestions: tier.suggestions });
        if (groups.length >= 3) break;
      }
    }

    return groups;
  }, [description, backendChips]);
}


function Panel({ eyebrow, title, subtitle, action, className = "", children }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(eyebrow || title || subtitle || action) && (
        <header className="panel__header">
          <div className="panel__heading">
            {eyebrow ? <div className="panel__eyebrow">{eyebrow}</div> : null}
            {title ? <h2 className="panel__title">{title}</h2> : null}
            {subtitle ? <p className="panel__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="panel__action">{action}</div> : null}
        </header>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}

function DirectivePill({ dirKey }) {
  const tone = directiveTone(dirKey);
  return (
    <span
      className="directive-pill"
      style={{
        "--pill-bg": tone.bg,
        "--pill-border": tone.bd,
        "--pill-text": tone.text,
        "--pill-dot": tone.dot,
      }}
    >
      <span className="directive-pill__dot" />
      {directiveShort(dirKey)}
    </span>
  );
}

function RiskPill({ value }) {
  const tone = STATUS[value] || STATUS.MEDIUM;
  return (
    <span
      className="status-pill"
      style={{
        "--pill-bg": tone.bg,
        "--pill-border": tone.bd,
        "--pill-text": tone.text,
      }}
    >
      {formatUiLabel(value || "MEDIUM")} risk
    </span>
  );
}

function ImportancePill({ value }) {
  const tone = IMPORTANCE[value] || IMPORTANCE.medium;
  return (
    <span
      className="importance-pill"
      style={{
        "--pill-bg": tone.bg,
        "--pill-border": tone.bd,
        "--pill-text": tone.text,
        "--pill-dot": tone.dot,
      }}
    >
      <span className="importance-pill__dot" />
      {formatUiLabel(value)}
    </span>
  );
}


/* ──────────────────────────────────────────────────────────
   AnalysisProgressBanner
   ────────────────────────────────────────────────────────── */
const PROGRESS_STEPS = [
  "Parsing product traits",
  "Detecting applicable regimes",
  "Matching standards route",
  "Generating clarifications",
];
const STEP_DELAYS_MS = [0, 2200, 4400, 6800];

function AnalysisProgressBanner({ busy }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!busy) {
      setStepIndex(0);
      return;
    }
    const timers = STEP_DELAYS_MS.slice(1).map((delay, i) =>
      window.setTimeout(() => setStepIndex(i + 1), delay)
    );
    return () => timers.forEach(window.clearTimeout);
  }, [busy]);

  if (!busy) return null;

  return (
    <div className="analysis-progress" role="status" aria-live="polite">
      <div className="analysis-progress__steps">
        {PROGRESS_STEPS.map((step, i) => (
          <div
            key={step}
            className={[
              "analysis-progress__step",
              i < stepIndex  ? "analysis-progress__step--done"   : "",
              i === stepIndex ? "analysis-progress__step--active" : "",
            ].filter(Boolean).join(" ")}
          >
            <div className="analysis-progress__dot">
              {i < stepIndex ? <Check size={9} /> : null}
            </div>
            <span>{step}{i === stepIndex ? "…" : ""}</span>
          </div>
        ))}
      </div>
      <div className="analysis-progress__bar">
        <div
          className="analysis-progress__fill"
          style={{ width: `${((stepIndex + 1) / PROGRESS_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}


/* ──────────────────────────────────────────────────────────
   DirtyBanner
   ────────────────────────────────────────────────────────── */
function DirtyBanner({ dirty, busy, onReanalyze, onDismiss }) {
  return (
    <div className={`dirty-banner ${dirty ? "dirty-banner--visible" : ""}`} aria-hidden={!dirty}>
      <div className="page-shell dirty-banner__inner">
        <div className="dirty-banner__left">
          <span className="dirty-banner__dot" />
          <span>Description updated — re-run to apply changes</span>
        </div>
        <div className="dirty-banner__actions">
          <button
            type="button"
            className="button button--primary dirty-banner__btn"
            onClick={onReanalyze}
            disabled={busy}
            tabIndex={dirty ? 0 : -1}
          >
            {busy ? <LoaderCircle size={13} className="spin" /> : <RefreshCcw size={13} />}
            {busy ? "Re-running…" : "Re-run analysis"}
          </button>
          <button
            type="button"
            className="dirty-banner__dismiss"
            onClick={onDismiss}
            tabIndex={dirty ? 0 : -1}
            aria-label="Dismiss"
            title="Dismiss — keep current analysis"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}


/* ──────────────────────────────────────────────────────────
   TopBar
   ────────────────────────────────────────────────────────── */
function TopBar({ result, totalStandards, onReset, prevResult, onRestorePrev, onCopy, copied }) {
  return (
    <header className="topbar">
      <div className="page-shell topbar__inner">
        <div className="brand">
          <div className="brand__mark">
            <img src="/logo512.png" alt="RuleGrid" className="brand__logo" />
          </div>
          <div>
            <div className="brand__title">RuleGrid</div>
            <div className="brand__subtitle">EU regulatory scoping</div>
          </div>
        </div>

        <div className="topbar__meta">
          {result ? (
            <>
              <RiskPill value={result?.overall_risk || "MEDIUM"} />
              <span className="topbar__count topbar__count--hideable">{totalStandards} standards</span>

              <button
                type="button"
                className="button button--secondary topbar__action-btn"
                onClick={onCopy}
                title="Copy analysis summary to clipboard"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span className="topbar__btn-label">{copied ? "Copied" : "Copy"}</span>
              </button>

              {prevResult ? (
                <button
                  type="button"
                  className="button button--secondary topbar__action-btn"
                  onClick={onRestorePrev}
                  title="Restore previous analysis"
                >
                  <ArrowLeft size={13} />
                  <span className="topbar__btn-label">Previous</span>
                </button>
              ) : null}

              <button type="button" className="button button--secondary" onClick={onReset}>
                <RefreshCcw size={13} />
                New analysis
              </button>
            </>
          ) : (
            <span className="topbar__hint">Describe the product — get a standards route</span>
          )}
        </div>
      </div>
    </header>
  );
}


/* ──────────────────────────────────────────────────────────
   HeroPanel
   ────────────────────────────────────────────────────────── */
function HeroPanel({ result, routeSections = [], legislationItems = [], guidanceItems = [] }) {
  const hero = result?.hero_summary || {};
  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";

  if (!result) {
    return (
      <div className="landing-strip">
        <div className="landing-strip__inner">
          <div className="landing-strip__eyebrow">
            <Sparkles size={11} />
            Guided Workspace
          </div>
          <h1 className="landing-strip__title">
            EU regulatory scoping,<br />
            <span className="landing-strip__title--accent">instantly</span>
          </h1>
          <p className="landing-strip__sub">
            Describe the product below and get the applicable standards route, legislation context, and scope-changing clarifications.
          </p>
        </div>
      </div>
    );
  }

  const title = hero.title || `${formatUiLabel(result?.product_type || "Product")} regulatory route`;
  const subtitle = result?.summary || hero.subtitle || "";

  const triggeredDirectives = [...new Set(routeSections.map((s) => s.key))].sort(
    (a, b) => directiveRank(a) - directiveRank(b)
  );

  const totalStandards = routeSections.reduce((n, s) => n + (s.count || 0), 0);

  return (
    <div className="hero-grid">
      <Panel className="panel--hero" eyebrow="Guided Workspace" title={title} subtitle={subtitle}>
        <div className="hero-panel__content">
          <div className="hero-panel__tags">
            <span className="soft-tag">Confidence: {formatUiLabel(confidence)}</span>
            {result?.product_type ? (
              <span className="soft-tag">{formatUiLabel(result.product_type)}</span>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel className="panel--support" eyebrow="Directives triggered" title="Scope">
        <div className="directive-scope-list">
          {triggeredDirectives.length ? (
            <div className="directive-scope-pills">
              {triggeredDirectives.map((key) => (
                <DirectivePill key={key} dirKey={key} />
              ))}
            </div>
          ) : (
            <span className="soft-tag" style={{ color: "var(--text-soft)" }}>No directives detected</span>
          )}
          <p className="directive-scope-hint">
            {totalStandards} standard{totalStandards === 1 ? "" : "s"} across{" "}
            {routeSections.length} regime{routeSections.length === 1 ? "" : "s"} —
            {" "}{legislationItems.length} legislation item{legislationItems.length === 1 ? "" : "s"} —
            {" "}{guidanceItems.length} clarification{guidanceItems.length === 1 ? "" : "s"}.
          </p>
        </div>
      </Panel>
    </div>
  );
}


/* ──────────────────────────────────────────────────────────
   Base Safety Route
   ────────────────────────────────────────────────────────── */
const BASE_SAFETY_ROUTE_COPY = {
  EN_60335: {
    key: "EN_60335",
    label: "EN 60335 appliance route",
    shortLabel: "EN 60335",
    description:
      "Primary function points to household and similar appliance safety under EN 60335-1 with the relevant Part 2 standard.",
    note:
      "Connected features do not move an appliance into EN 62368-1 when the primary function remains cooking, cleaning, heating, cooling, or a similar physical appliance function.",
  },
  EN_62368: {
    key: "EN_62368",
    label: "EN 62368 AV/ICT route",
    shortLabel: "EN 62368",
    description:
      "Primary function points to audio/video, information, or communications equipment safety under EN 62368-1.",
    note:
      "This is the base safety path for products such as routers, smart displays, laptops, monitors, speakers, and other AV/ICT equipment.",
  },
};

function baseSafetyRouteTone(route) {
  if (route?.key === "EN_62368") {
    return {
      bg: "rgba(185,162,255,0.14)",
      bd: "rgba(185,162,255,0.30)",
      text: "#cab7ff",
      dot: "#b9a2ff",
    };
  }
  return {
    bg: "rgba(143,218,184,0.14)",
    bd: "rgba(143,218,184,0.30)",
    text: "#9ee7c4",
    dot: "#8fdab8",
  };
}

function inferBaseSafetyRoute(result, routeSections) {
  if (!result) return null;

  const rows = (routeSections || []).flatMap((section) => section.items || []);
  const codeStrings = rows.map((item) => String(item?.code || "").toUpperCase());
  const titleStrings = rows.map((item) => String(item?.title || "").toLowerCase());

  const has60335 =
    codeStrings.some((code) => /(?:^|\b)(?:EN|IEC)\s*60335(?:-\d+)?(?:\b|\s|$)/i.test(code)) ||
    titleStrings.some((title) => title.includes("household and similar electrical appliances"));

  const has62368 =
    codeStrings.some((code) => /(?:^|\b)(?:EN|IEC)\s*62368(?:-\d+)?(?:\b|\s|$)/i.test(code)) ||
    titleStrings.some(
      (title) =>
        title.includes("audio/video") ||
        title.includes("information and communication technology") ||
        title.includes("communications technology equipment")
    );

  const productText = [
    result?.product_type || "",
    result?.summary || "",
    ...(result?.all_traits || []),
  ]
    .join(" ")
    .toLowerCase();

  const applianceHints = [
    /coffee/, /espresso/, /kettle/, /air.?fry/, /oven/, /vacuum/,
    /robot.?vac/, /air.?purifier/, /fan\b/, /heater/, /dishwasher/,
    /washing.?machine/, /dryer/, /blender/, /mixer/, /toaster/,
    /fridge/, /freezer/, /appliance/,
  ];

  const avictHints = [
    /router/, /modem/, /gateway/, /access.?point/, /switch\b/, /laptop/,
    /desktop/, /server/, /nas\b/, /monitor/, /display/, /smart.?display/,
    /smart.?speaker/, /speaker/, /television/, /smart.?tv/, /stream(ing)?/,
    /set.?top/, /projector/, /voip/, /ict/, /communications?/, /audio/,
    /video/, /network/,
  ];

  const hasApplianceHint = applianceHints.some((re) => re.test(productText));
  const hasAvictHint = avictHints.some((re) => re.test(productText));

  if (has60335 && !has62368) return BASE_SAFETY_ROUTE_COPY.EN_60335;
  if (has62368 && !has60335) return BASE_SAFETY_ROUTE_COPY.EN_62368;

  if (has60335 && has62368) {
    if (hasApplianceHint && !hasAvictHint) return BASE_SAFETY_ROUTE_COPY.EN_60335;
    if (hasAvictHint && !hasApplianceHint) return BASE_SAFETY_ROUTE_COPY.EN_62368;
  }

  if (hasAvictHint && !hasApplianceHint) return BASE_SAFETY_ROUTE_COPY.EN_62368;
  if (hasApplianceHint && !hasAvictHint) return BASE_SAFETY_ROUTE_COPY.EN_60335;

  return null;
}

function BaseSafetyRoutePill({ route, compact = false, labelOverride = "" }) {
  if (!route) return null;
  const tone = baseSafetyRouteTone(route);
  const Icon = route.key === "EN_62368" ? Cpu : ShieldCheck;

  return (
    <span
      className={`base-route-pill${compact ? " base-route-pill--compact" : ""}`}
      style={{
        "--base-route-bg": tone.bg,
        "--base-route-border": tone.bd,
        "--base-route-text": tone.text,
        "--base-route-dot": tone.dot,
      }}
    >
      <Icon size={12} />
      <span>{labelOverride || route.label}</span>
    </span>
  );
}


/* ──────────────────────────────────────────────────────────
   SmartSuggestionsPanel
   ────────────────────────────────────────────────────────── */
const SUGGESTION_ICONS = {
  zap:      <Zap size={11} />,
  wifi:     <Wifi size={11} />,
  cloud:    <Cloud size={11} />,
  cpu:      <Cpu size={11} />,
  flask:    <FlaskConical size={11} />,
  droplets: <Droplets size={11} />,
  leaf:     <Leaf size={11} />,
  cart:     <ShoppingCart size={11} />,
};

function SmartSuggestionsPanel({ description, onApply, backendChips, appliedChipTexts = new Set() }) {
  const groups = useSmartSuggestions(description, backendChips);
  if (!groups.length) return null;

  return (
    <div className="smart-suggestions">
      {groups.map((group) => (
        <div key={group.id} className="smart-suggestions__group">
          <div className="smart-suggestions__label">
            {group.icon ? SUGGESTION_ICONS[group.icon] : null}
            {group.label}
          </div>
          <div className="smart-suggestions__chips">
            {group.suggestions.map((s) => {
              const isApplied = appliedChipTexts.has(s.text);
              return (
                <button
                  key={s.label}
                  type="button"
                  className={`smart-chip${isApplied ? " smart-chip--applied" : ""}`}
                  onClick={() => { if (!isApplied) onApply(s.text); }}
                  disabled={isApplied}
                  title={isApplied ? "Already applied" : `Add: ${s.text}`}
                  aria-pressed={isApplied}
                >
                  {isApplied ? <Check size={10} /> : null}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


/* ──────────────────────────────────────────────────────────
   ComposerPanel
   ────────────────────────────────────────────────────────── */
function ComposerPanel({ description, setDescription, templates, backendChips, onAnalyze, busy, onDirty, isLanding }) {
  const charMax = 1200;
  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const usageState =
    description.length > charMax * 0.9
      ? "counter--danger"
      : description.length > charMax * 0.7
        ? "counter--warn"
        : "";

  const textareaRef = useRef(null);
  const [appliedChipTexts, setAppliedChipTexts] = useState(() => new Set());

  useEffect(() => {
    setAppliedChipTexts(new Set());
  }, [isLanding]);

  useEffect(() => {
    if (isLanding && textareaRef.current) {
      const t = setTimeout(() => textareaRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isLanding]);

  const handleApply = useCallback((text) => {
    setDescription((current) => joinText(current, text));
    setAppliedChipTexts((prev) => new Set([...prev, text]));
    onDirty(true);
    textareaRef.current?.focus();
  }, [setDescription, onDirty]);

  const showWordHint = wordCount > 0 && wordCount < 30;

  const sharedTextarea = (
    <label className={isLanding ? "landing-composer__field" : "composer__field"}>
      <span className="sr-only">Describe your product</span>
      <textarea
        ref={textareaRef}
        value={description}
        onChange={(event) => {
          setDescription(event.target.value);
          onDirty(true);
        }}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onAnalyze();
          }
        }}
        placeholder="e.g. Connected espresso machine with Wi-Fi, OTA updates, cloud account, mains power, grinder, pressure system, food-contact brew path."
        rows={isLanding ? 7 : 6}
        maxLength={charMax}
        spellCheck={false}
        className={isLanding ? "landing-composer__textarea" : "composer__textarea"}
        aria-label="Describe your product"
      />
      {!isLanding && (
        <div className="composer__field-footer">
          <div className="composer__helper">
            Include: power · radios · cloud/OTA · core functions · food-contact paths
          </div>
          <div className={`counter ${usageState}`.trim()}>
            {wordCount ? <span>{wordCount}w</span> : null}
            <span>{description.length} / {charMax}</span>
          </div>
        </div>
      )}
    </label>
  );

  /* ── Landing variant ── */
  if (isLanding) {
    return (
      <div className="landing-composer">
        <div className="landing-composer__quickstart">
          <span className="micro-label">Quick start</span>
          <div className="template-row">
            {templates.slice(0, 7).map((template) => (
              <button
                key={template.label}
                type="button"
                className="chip-button"
                onClick={() => {
                  setDescription(template.text);
                  setAppliedChipTexts(new Set());
                  onDirty(true);
                  textareaRef.current?.focus();
                }}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <div className="landing-composer__input-block">
          {sharedTextarea}
          <div className="landing-composer__cta-row">
            <div className="landing-composer__cta-left">
              <div className={`counter ${usageState}`.trim()}>
                {wordCount ? <span>{wordCount}w</span> : null}
                <span>{description.length} / {charMax}</span>
              </div>
              {showWordHint ? (
                <span className="word-hint">aim for 30–80 words</span>
              ) : null}
            </div>
            <button
              type="button"
              className="button button--primary button--landing-cta"
              onClick={onAnalyze}
              disabled={busy || !description.trim()}
            >
              {busy ? <LoaderCircle size={15} className="spin" /> : <Search size={15} />}
              {busy ? "Analyzing…" : "Analyze product"}
              {!busy && <span className="cta-hint">⌘↩</span>}
            </button>
          </div>
        </div>

        <div className="input-hints">
          <div className="input-hint">
            <span className="input-hint__icon"><Zap size={11} /></span>
            <span><strong>Power & function</strong> — mains, battery, motors, heating</span>
          </div>
          <div className="input-hint">
            <span className="input-hint__icon"><Wifi size={11} /></span>
            <span><strong>Connectivity</strong> — Wi-Fi, Bluetooth, cloud, OTA</span>
          </div>
          <div className="input-hint">
            <span className="input-hint__icon"><FlaskConical size={11} /></span>
            <span><strong>Materials</strong> — wetted paths, food-contact</span>
          </div>
        </div>

        <SmartSuggestionsPanel
          description={description}
          onApply={handleApply}
          backendChips={null}
          appliedChipTexts={appliedChipTexts}
        />
      </div>
    );
  }

  /* ── Refinement variant (post-result) ── */
  return (
    <Panel
      eyebrow="Input"
      title="Refine description"
      subtitle="Add missing detail and re-run to tighten the route."
      action={<span className="keyboard-hint">⌘ + Enter</span>}
    >
      <div className="composer">
        <div className="composer__block">
          <div className="micro-label">Quick start</div>
          <div className="template-row">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.label}
                type="button"
                className="chip-button"
                onClick={() => {
                  setDescription(template.text);
                  setAppliedChipTexts(new Set());
                  onDirty(true);
                }}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {sharedTextarea}

        <SmartSuggestionsPanel
          description={description}
          onApply={handleApply}
          backendChips={backendChips}
          appliedChipTexts={appliedChipTexts}
        />

        <div className="composer__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={onAnalyze}
            disabled={busy || !description.trim()}
          >
            {busy ? <LoaderCircle size={15} className="spin" /> : <Search size={15} />}
            {busy ? "Analyzing…" : "Analyze product"}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setDescription("");
              setAppliedChipTexts(new Set());
              onDirty(false);
            }}
            disabled={!description}
          >
            Clear
          </button>
        </div>
      </div>
    </Panel>
  );
}


/* ──────────────────────────────────────────────────────────
   OverviewPanel
   ────────────────────────────────────────────────────────── */
function InlineTag({ children, tone = "default" }) {
  const tones = {
    default: {
      bg: "rgba(167,183,203,0.11)",
      bd: "rgba(167,183,203,0.22)",
      text: "#c0cbda",
    },
    positive: {
      bg: "rgba(128,214,168,0.13)",
      bd: "rgba(128,214,168,0.26)",
      text: "#9ce0bc",
    },
    caution: {
      bg: "rgba(240,192,103,0.14)",
      bd: "rgba(240,192,103,0.28)",
      text: "#f5cc81",
    },
    strong: {
      bg: "rgba(125,185,255,0.13)",
      bd: "rgba(125,185,255,0.28)",
      text: "#93c5ff",
    },
  };
  const style = tones[tone] || tones.default;
  return (
    <span
      className="soft-tag"
      style={{
        background: style.bg,
        borderColor: style.bd,
        color: style.text,
      }}
    >
      {children}
    </span>
  );
}

function OverviewPanel({ result, routeSections, legislationItems }) {
  if (!result) return null;

  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
  const totalStandards = routeSections.reduce(
    (count, section) => count + (section.items || []).length,
    0
  );

  const metrics = [
    { label: "Product", value: formatUiLabel(result?.product_type || "unclear") },
    { label: "Stage", value: formatStageLabel(result?.product_match_stage) },
    {
      label: "Risk",
      value: formatUiLabel(result?.overall_risk || "MEDIUM"),
      highlight: (result?.overall_risk || "MEDIUM").toUpperCase() === "HIGH",
    },
    { label: "Confidence", value: formatUiLabel(confidence) },
    { label: "Standards", value: String(totalStandards) },
    { label: "Legislation", value: String(legislationItems.length) },
  ];

  return (
    <div className="overview-bar">
      <p className="overview-bar__summary">
        {result?.summary || "Analysis complete."}
      </p>
      <div className="overview-bar__metrics">
        {metrics.map(({ label, value, highlight }) => (
          <div key={label} className="overview-metric">
            <span className="overview-metric__label">{label}</span>
            <span className={`overview-metric__value${highlight ? " overview-metric__value--high" : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ──────────────────────────────────────────────────────────
   SnapshotRail — sticky sidebar
   Removed: EngineDetailsSection, legislation groups section
   Added: active directives pills
   ────────────────────────────────────────────────────────── */
function SnapshotRail({ result, routeSections, description, onCopy, copied, legislationGroups }) {
  // Collect all legislation item names for compact sidebar summary
  const allLegislationNames = useMemo(() => {
    const names = [];
    (legislationGroups || []).forEach((group) => {
      (group.items || []).forEach((item) => {
        if (item.title) names.push({ title: item.title, code: item.code, dirKey: item.directive_key || "OTHER" });
      });
    });
    return names;
  }, [legislationGroups]);

  if (!result) return null;

  const totalStandards = routeSections.reduce(
    (count, section) => count + (section.items || []).length,
    0
  );

  const triggeredDirectives = [...new Set(routeSections.map((s) => s.key))].sort(
    (a, b) => directiveRank(a) - directiveRank(b)
  );

  return (
    <aside className="side-column">
      <div className="side-column__sticky">
        <Panel
          className="panel--sidebar"
          eyebrow="Snapshot"
          title="Context"
          subtitle="Product identity pinned alongside the route."
        >
          <div className="snapshot-list">
            {[
              ["Product", formatUiLabel(result?.product_type || "unclear")],
              ["Family", formatUiLabel(result?.product_family || "unclear")],
              ["Subtype", result?.product_subtype ? formatUiLabel(result.product_subtype) : "Not locked"],
              ["Stage", formatStageLabel(result?.product_match_stage)],
              ["Risk", formatUiLabel(result?.overall_risk || "MEDIUM")],
              ["Standards", totalStandards],
            ].map(([label, value]) => (
              <div key={label} className="snapshot-row">
                <span className="snapshot-row__label">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <CopyResultsButton onCopy={onCopy} copied={copied} />

          {triggeredDirectives.length ? (
            <div className="sidebar-section">
              <div className="sidebar-section__heading">Active directives</div>
              <div className="sidebar-section__subheading">Regimes covered in the standards route</div>
              <div className="tag-row" style={{ marginTop: 10 }}>
                {triggeredDirectives.map((key) => (
                  <DirectivePill key={key} dirKey={key} />
                ))}
              </div>
            </div>
          ) : null}

          {allLegislationNames.length ? (
            <div className="sidebar-section">
              <div className="sidebar-section__heading">Applicable legislation</div>
              <div className="sidebar-section__subheading">Full detail shown in main panel below</div>
              <div className="sidebar-legislation-list">
                {allLegislationNames.slice(0, 10).map((leg, i) => {
                  const tone = directiveTone(leg.dirKey);
                  return (
                    <div key={`sidebar-leg-${i}`} className="sidebar-leg-item">
                      <span className="sidebar-leg-item__dot" style={{ background: tone.dot }} />
                      <span className="sidebar-leg-item__name">{leg.code ? `${leg.code} — ` : ""}{leg.title}</span>
                    </div>
                  );
                })}
                {allLegislationNames.length > 10 ? (
                  <div className="sidebar-leg-item sidebar-leg-item--more">
                    +{allLegislationNames.length - 10} more
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {(result?.future_watchlist || []).length ? (
            <div className="sidebar-section">
              <div className="sidebar-section__heading">Future watchlist</div>
              <div className="tag-row" style={{ marginTop: 8 }}>
                {(result.future_watchlist || []).slice(0, 6).map((item) => (
                  <InlineTag key={`sidebar-watch-${item}`}>{titleCaseMinor(item)}</InlineTag>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    </aside>
  );
}


/* ──────────────────────────────────────────────────────────
   MinimalClarificationPrompt — replaces ClarificationsPanel
   ────────────────────────────────────────────────────────── */
function MinimalClarificationPrompt({ items, onApply }) {
  const [appliedKeys, setAppliedKeys] = useState(new Set());
  const [dismissed, setDismissed] = useState(false);

  const handleApply = useCallback((itemKey, choiceText) => {
    setAppliedKeys((prev) => new Set([...prev, itemKey]));
    onApply(choiceText);
  }, [onApply]);

  if (!items.length || dismissed) return null;

  // Show only high/medium importance items, max 3
  const topItems = items
    .filter((item) => item.importance === "high" || item.importance === "medium")
    .slice(0, 3);

  if (!topItems.length) return null;

  return (
    <div className="clarify-prompt">
      <div className="clarify-prompt__header">
        <div className="clarify-prompt__left">
          <Sparkles size={12} />
          <span>Scope-changing details detected</span>
        </div>
        <button
          type="button"
          className="clarify-prompt__dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
      <div className="clarify-prompt__items">
        {topItems.map((item) => {
          const isApplied = appliedKeys.has(item.key);
          return (
            <div
              key={item.key}
              className={`clarify-prompt__item${isApplied ? " clarify-prompt__item--applied" : ""}`}
            >
              <div className="clarify-prompt__item-title">
                <ImportancePill value={item.importance} />
                <span>{item.title}</span>
                {isApplied ? <Check size={11} style={{ color: "var(--accent-teal)", marginLeft: 6 }} /> : null}
              </div>
              {!isApplied && item.choices?.length ? (
                <div className="clarify-prompt__choices">
                  {item.choices.slice(0, 3).map((choice) => (
                    <button
                      key={`${item.key}-${choice}`}
                      type="button"
                      className="chip-button chip-button--soft"
                      onClick={() => handleApply(item.key, choice)}
                    >
                      + {choice}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ──────────────────────────────────────────────────────────
   ClarificationsPanel (kept for ErrorBoundary label compat)
   ────────────────────────────────────────────────────────── */
function ClarificationsPanel({ items, onApply }) {
  return <MinimalClarificationPrompt items={items} onApply={onApply} />;
}


function StandardItem({ item, sectionKey }) {
  const dirKey = normalizeStandardDirective(item);
  const dirTone = directiveTone(dirKey);
  const sectionTone = SECTION_TONES[sectionKey] || SECTION_TONES.unknown;
  const evidenceList = sentenceCaseList(item.evidence_hint || []);
  const matchedTraits = sentenceCaseList(item.matched_traits_all || item.matched_traits_any || []);
  const summary = item.standard_summary || item.reason || item.notes || "";
  const metaFields = [
    { label: "Legislation",   value: prettyValue(item.harmonized_reference) },
    { label: "EU Harmonized", value: prettyValue(item.dated_version) },
    { label: "EU Latest",     value: prettyValue(item.version) },
  ].filter((field) => field.value && field.value !== "—");

  return (
    <article
      className="standard-item"
      style={{
        "--item-accent": dirTone.dot,
        "--item-accent-bg": dirTone.bg,
        "--item-accent-border": dirTone.bd,
      }}
    >
      <div className="standard-item__header">
        <div className="standard-item__chips">
          <span className="code-chip">{item.code || "No code"}</span>
          <DirectivePill dirKey={dirKey} />
          <span
            className="status-pill status-pill--soft"
            style={{
              "--pill-bg": sectionTone.bg,
              "--pill-border": sectionTone.bd,
              "--pill-text": sectionTone.text,
            }}
          >
            {formatUiLabel(item.harmonization_status || sectionKey || "unknown")}
          </span>
          {item.match_basis ? <InlineTag tone="strong">{formatUiLabel(item.match_basis)}</InlineTag> : null}
          {item.fact_basis ? <InlineTag tone={item.fact_basis === "confirmed" ? "positive" : "caution"}>{formatUiLabel(item.fact_basis)}</InlineTag> : null}
          {item.selection_group ? <InlineTag>{titleCaseMinor(item.selection_group)}</InlineTag> : null}
        </div>
        <h4 className="standard-item__title">{titleCaseMinor(item.title || "Untitled standard")}</h4>
      </div>

      {summary && summary !== item.title ? (
        <p className="standard-item__summary">{summary}</p>
      ) : null}

      {metaFields.length ? (
        <div className="standard-item__meta-grid">
          {metaFields.map((field) => (
            <div key={field.label} className="standard-item__meta-card">
              <div className="micro-label">{field.label}</div>
              <div className="standard-item__meta-value">{field.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {evidenceList.length ? (
        <div className="standard-item__evidence">
          <div className="micro-label">Evidence expected</div>
          <div className="tag-row">
            {evidenceList.map((entry) => (
              <span key={entry} className="soft-tag">
                {entry}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {matchedTraits.length ? (
        <div className="standard-item__evidence">
          <div className="micro-label">Matched traits</div>
          <div className="tag-row">
            {matchedTraits.slice(0, 8).map((entry) => (
              <span key={entry} className="soft-tag">
                {entry}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}


/* ──────────────────────────────────────────────────────────
   RouteSection — id added for RegimeNav anchor scrolling
   ────────────────────────────────────────────────────────── */
function RouteSection({ section, baseSafetyRoute, open, onToggle }) {
  const tone = directiveTone(section.key);
  const title = routeTitle(section);
  const subtitle =
    section.title && titleCaseMinor(section.title) !== title ? titleCaseMinor(section.title) : "";
  const lvdBaseSafetyLabel =
    section.key === "LVD" && baseSafetyRoute
      ? `Base safety: ${baseSafetyRoute.key === "EN_62368" ? "EN 62368-1" : "EN 60335-1"}`
      : "";

  const bodyId = `route-section-body-${section.key}`;

  return (
    <section
      id={`route-section-${section.key}`}
      className="route-section"
      style={{
        "--route-tone-bg": tone.bg,
        "--route-tone-border": tone.bd,
        "--route-tone-dot": tone.dot,
      }}
    >
      <button
        type="button"
        className="route-section__toggle"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <div className="route-section__title-wrap">
          <div className="route-section__indicator" />
          <div>
            <div className="route-section__title-row">
              <h3>{title}</h3>
              <DirectivePill dirKey={section.key} />
              {lvdBaseSafetyLabel ? (
                <BaseSafetyRoutePill route={baseSafetyRoute} compact labelOverride={lvdBaseSafetyLabel} />
              ) : null}
            </div>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>

        <div className="route-section__meta">
          <span className="route-section__count">
            {section.count || 0} standard{section.count === 1 ? "" : "s"}
          </span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open ? (
        <div id={bodyId} className="route-section__body">
          {(section.items || []).map((item) => (
            <StandardItem
              key={`${section.key}-${item.code || item.title}-${item.version || ""}`}
              item={item}
              sectionKey={item.harmonization_status || "unknown"}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   RegimeNav — chips now scroll to their section on click
   ────────────────────────────────────────────────────────── */
function RegimeNav({ directiveBreakdown }) {
  const scrollToSection = useCallback((key) => {
    const el = document.getElementById(`route-section-${key}`);
    if (el) {
      const offset = 80; // topbar + dirty banner approx
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  if (!directiveBreakdown.length) return null;

  return (
    <div className="regime-nav">
      <div className="regime-nav__inner">
        {directiveBreakdown.map(({ key, count }) => {
          const tone = directiveTone(key);
          return (
            <button
              key={key}
              type="button"
              className="regime-chip regime-chip--clickable"
              onClick={() => scrollToSection(key)}
              title={`Jump to ${directiveShort(key)} section`}
              style={{
                "--chip-dot": tone.dot,
                "--chip-bg": tone.bg,
                "--chip-border": tone.bd,
                "--chip-text": tone.text,
              }}
            >
              <span className="regime-chip__dot" />
              <span className="regime-chip__label">{directiveShort(key)}</span>
              <span className="regime-chip__count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


/* ──────────────────────────────────────────────────────────
   StandardsRoutePanel
   ────────────────────────────────────────────────────────── */
function StandardsRoutePanel({ sections, directiveBreakdown, baseSafetyRoute }) {
  const [openSet, setOpenSet] = useState(
    () => new Set(sections.slice(0, 1).map((s) => s.key))
  );

  const allOpen = sections.length > 0 && openSet.size === sections.length;

  const toggleSection = useCallback((key) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allOpen) {
      setOpenSet(new Set());
    } else {
      setOpenSet(new Set(sections.map((s) => s.key)));
    }
  }, [allOpen, sections]);

  if (!sections.length) return null;

  return (
    <Panel
      className="panel--standards"
      eyebrow="Primary Output"
      title="Standards route"
      subtitle="Grouped by regime — scan the path without losing item-level detail."
      action={
        <button
          type="button"
          className="button button--secondary expand-all-btn"
          onClick={toggleAll}
          title={allOpen ? "Collapse all sections" : "Expand all sections"}
        >
          {allOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span className="expand-all-btn__label">{allOpen ? "Collapse all" : "Expand all"}</span>
        </button>
      }
    >
      <RegimeNav directiveBreakdown={directiveBreakdown} />

      <div className="route-stack">
        {sections.map((section) => (
          <RouteSection
            key={section.key || section.title}
            section={section}
            baseSafetyRoute={baseSafetyRoute}
            open={openSet.has(section.key)}
            onToggle={() => toggleSection(section.key)}
          />
        ))}
      </div>
    </Panel>
  );
}


/* ──────────────────────────────────────────────────────────
   LegislationSection — mirrors RouteSection exactly.
   Each non-CE legislation item gets its own expandable card.
   ────────────────────────────────────────────────────────── */
const LEGISLATION_CATEGORY_LABELS = {
  non_ce:    "Parallel obligation",
  future:    "Upcoming",
  framework: "Framework",
  other:     "Other",
};

function LegislationDetailField({ label, value }) {
  const display = value && String(value).trim() ? String(value) : "—";
  return (
    <div className="standard-item__meta-card">
      <div className="micro-label">{label}</div>
      <div className={`standard-item__meta-value${display === "—" ? " standard-item__meta-value--empty" : ""}`}>
        {display}
      </div>
    </div>
  );
}

function LegislationSection({ item, groupKey, open, onToggle }) {
  const dirKey = item.directive_key || "OTHER";
  const tone = directiveTone(dirKey);
  const categoryLabel = LEGISLATION_CATEGORY_LABELS[groupKey] || "Legislation";
  const bodyId = `leg-section-body-${dirKey}-${item.code || item.title}`;

  const metaFields = [
    { label: "Reference / Code",    value: item.code },
    { label: "Category",            value: categoryLabel },
    { label: "Effective date",      value: item.effective_date || item.date },
    { label: "Review / repeal",     value: item.review_date || item.repeal_date },
    { label: "Official Journal ref",value: item.oj_reference || item.oj_ref },
    { label: "Transposition",       value: item.transposition },
  ].filter((f) => f.value && String(f.value).trim());

  const allMetaFields = [
    { label: "Reference / Code",    value: item.code },
    { label: "Category",            value: categoryLabel },
    { label: "Effective date",      value: item.effective_date || item.date },
    { label: "Review / repeal",     value: item.review_date || item.repeal_date },
    { label: "Official Journal ref",value: item.oj_reference || item.oj_ref },
    { label: "Transposition",       value: item.transposition },
  ];

  const obligationTags = [
    item.compliance_path,
    item.conformity_route,
    item.enforcement_body,
  ].filter(Boolean);

  return (
    <section
      className="route-section"
      style={{
        "--route-tone-bg": tone.bg,
        "--route-tone-border": tone.bd,
        "--route-tone-dot": tone.dot,
      }}
    >
      <button
        type="button"
        className="route-section__toggle"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <div className="route-section__title-wrap">
          <div className="route-section__indicator" />
          <div>
            <div className="route-section__title-row">
              <h3>{titleCaseMinor(item.title || "Untitled legislation")}</h3>
              <DirectivePill dirKey={dirKey} />
              {item.code ? (
                <span className="code-chip">{item.code}</span>
              ) : null}
            </div>
            {categoryLabel ? (
              <p style={{ fontSize: "0.80rem", color: "var(--text-soft)", marginTop: 3 }}>
                {categoryLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="route-section__meta">
          <span className="route-section__count">expand</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open ? (
        <div id={bodyId} className="route-section__body leg-section__body">
          {/* Summary */}
          {item.obligation_summary ? (
            <div className="leg-detail-block">
              <div className="micro-label">Obligation summary</div>
              <p className="leg-detail-block__text">{item.obligation_summary}</p>
            </div>
          ) : null}

          {/* Rationale / notes */}
          {item.rationale ? (
            <div className="leg-detail-block">
              <div className="micro-label">Rationale</div>
              <p className="leg-detail-block__text">{item.rationale}</p>
            </div>
          ) : null}

          {item.notes ? (
            <div className="leg-detail-block">
              <div className="micro-label">Notes</div>
              <p className="leg-detail-block__text">{item.notes}</p>
            </div>
          ) : null}

          {/* Key obligations list */}
          {(item.key_obligations || []).length ? (
            <div className="leg-detail-block">
              <div className="micro-label">Key obligations</div>
              <ul className="leg-detail-block__list">
                {item.key_obligations.map((ob, i) => (
                  <li key={i}>{ob}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Scope */}
          {item.scope ? (
            <div className="leg-detail-block">
              <div className="micro-label">Scope</div>
              <p className="leg-detail-block__text">{item.scope}</p>
            </div>
          ) : null}

          {/* Meta grid — reference, dates, etc. */}
          <div className="standard-item__meta-grid">
            {allMetaFields.map((f) => (
              <LegislationDetailField key={f.label} label={f.label} value={f.value} />
            ))}
          </div>

          {/* Compliance tags */}
          {obligationTags.length ? (
            <div className="standard-item__evidence">
              <div className="micro-label">Compliance path</div>
              <div className="tag-row">
                {obligationTags.map((tag) => (
                  <span key={tag} className="soft-tag">{titleCaseMinor(tag)}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Evidence / actions */}
          {(item.evidence_hint || item.actions || []).length ? (
            <div className="standard-item__evidence">
              <div className="micro-label">Actions / evidence expected</div>
              <div className="tag-row">
                {(item.evidence_hint || item.actions || []).map((a) => (
                  <span key={a} className="soft-tag">{a}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}


/* ──────────────────────────────────────────────────────────
   ParallelObligationsPanel
   CE group is excluded — it is covered by the standards route.
   All remaining items are flattened and rendered as
   LegislationSection cards (same style as RouteSection).
   ────────────────────────────────────────────────────────── */
function ParallelObligationsPanel({ legislationGroups }) {
  // Flatten all non-CE items, tagging each with their group key
  const flatItems = useMemo(() => {
    const result = [];
    (legislationGroups || []).forEach((group) => {
      if (group.key === "ce") return; // CE marking excluded — covered above
      (group.items || []).forEach((item) => {
        result.push({ ...item, _groupKey: group.key });
      });
    });
    return result;
  }, [legislationGroups]);

  const [openSet, setOpenSet] = useState(() => new Set([flatItems[0]?._id || flatItems[0]?.code || flatItems[0]?.title]));

  useEffect(() => {
    // Open first item by default on new analysis
    const first = flatItems[0];
    if (first) {
      setOpenSet(new Set([first.code || first.title]));
    }
  }, [legislationGroups]); // eslint-disable-line react-hooks/exhaustive-deps

  const getItemId = useCallback(
    (item) => `${item._groupKey}-${item.code || item.title}`,
    []
  );

  const toggleItem = useCallback((id) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allOpen = flatItems.length > 0 && openSet.size === flatItems.length;

  const toggleAll = useCallback(() => {
    setOpenSet((prev) =>
      prev.size === flatItems.length
        ? new Set()
        : new Set(flatItems.map((item) => `${item._groupKey}-${item.code || item.title}`))
    );
  }, [flatItems]);

  if (!flatItems.length) return null;

  return (
    <Panel
      className="panel--parallel"
      eyebrow="Applicable Legislation"
      title="Parallel obligations"
      subtitle="Frameworks that apply alongside the CE standards route — excluding CE marking."
      action={
        <button
          type="button"
          className="button button--secondary expand-all-btn"
          onClick={toggleAll}
          title={allOpen ? "Collapse all" : "Expand all"}
        >
          {allOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          <span className="expand-all-btn__label">{allOpen ? "Collapse all" : "Expand all"}</span>
        </button>
      }
    >
      <div className="route-stack">
        {flatItems.map((item) => {
          const id = getItemId(item);
          return (
            <LegislationSection
              key={id}
              item={item}
              groupKey={item._groupKey}
              open={openSet.has(id)}
              onToggle={() => toggleItem(id)}
            />
          );
        })}
      </div>
    </Panel>
  );
}


/* ──────────────────────────────────────────────────────────
   CopyResultsButton
   ────────────────────────────────────────────────────────── */
function CopyResultsButton({ onCopy, copied }) {
  return (
    <button type="button" className="button button--copy-rail button--full" onClick={onCopy}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Copied to clipboard" : "Copy analysis summary"}
    </button>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="error-banner" role="alert">
      <TriangleAlert size={16} />
      <div>
        <div className="error-banner__title">Analysis error</div>
        <div className="error-banner__text">{message}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  const items = [
    {
      icon: <Search size={16} />,
      title: "1. Describe the real product",
      text: "Include power, radios, control model, updates, materials, and any sensitive functions.",
    },
    {
      icon: <ListChecks size={16} />,
      title: "2. Review the route first",
      text: "The overview and route grouping are designed to make the first pass fast.",
    },
    {
      icon: <ShieldCheck size={16} />,
      title: "3. Refine with clarifications",
      text: "Use guided prompts to add scope-changing details, then re-run.",
    },
  ];

  return (
    <div className="empty-state-compact">
      {items.map((item) => (
        <div key={item.title} className="empty-state-step">
          <div className="empty-state-step__icon">{item.icon}</div>
          <div>
            <div className="empty-state-step__title">{item.title}</div>
            <div className="empty-state-step__text">{item.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScrollTopButton({ visible }) {
  return (
    <button
      type="button"
      className={`scroll-top ${visible ? "scroll-top--visible" : ""}`.trim()}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      <ArrowUp size={15} />
    </button>
  );
}


/* ================================================================
   App — root component
   ================================================================ */
export default function App() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [resultRevision, setResultRevision] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clarifyDirty, setClarifyDirty] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const resultsRef = useRef(null);
  const analysisAbortRef = useRef(null);
  // Stable per-session random order for templates
  const [templateOrder] = useState(() => Array.from({ length: 50 }, () => Math.random()));

  const [prevResult, setPrevResult] = useState(null);
  const [prevDescription, setPrevDescription] = useState("");
  const [analysisCopied, setAnalysisCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 360);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(METADATA_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Metadata failed (${response.status})`);
        return response.json();
      })
      .then((data) => setMetadata(data))
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setMetadata({ traits: [], products: [], legislations: [] });
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      analysisAbortRef.current?.abort();
      analysisAbortRef.current = null;
    };
  }, []);

  const templates = useMemo(() => {
    const pool = buildDynamicTemplates(metadata?.products || []);
    // Shuffle using stable per-session order
    return [...pool]
      .map((item, i) => ({ item, sort: templateOrder[i % templateOrder.length] }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item);
  }, [metadata, templateOrder]);

  const routeSections      = useMemo(() => buildRouteSections(result),          [result]);
  const guidanceItems      = useMemo(() => buildGuidanceItems(result),           [result]);
  const legislationItems   = useMemo(() => buildCompactLegislationItems(result), [result]);
  const legislationGroups  = useMemo(() => buildLegislationGroups(result),       [result]);
  const directiveBreakdown = useMemo(() => buildDirectiveBreakdown(routeSections), [routeSections]);
  const baseSafetyRoute    = useMemo(() => inferBaseSafetyRoute(result, routeSections), [result, routeSections]);

  const totalStandards = useMemo(
    () => routeSections.reduce((count, section) => count + (section.items || []).length, 0),
    [routeSections]
  );

  const backendChips = useMemo(() => {
    if (!result) return null;
    return (result?.suggested_quick_adds || []).map((item) => ({
      label: item.label,
      text: item.text,
    }));
  }, [result]);

  useEffect(() => {
    if (!result || !resultsRef.current) return;
    const timer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [result]);

  const cancelActiveAnalysis = useCallback(() => {
    const controller = analysisAbortRef.current;
    if (controller) {
      analysisAbortRef.current = null;
      controller.abort();
    }
    setBusy(false);
  }, []);

  const runAnalysis = useCallback(async () => {
    const payloadDescription = String(description || "").trim();
    if (!payloadDescription || busy || analysisAbortRef.current) return;

    if (result) {
      setPrevResult(result);
      setPrevDescription(description);
    }

    const controller = new AbortController();
    analysisAbortRef.current = controller;
    setBusy(true);
    setError("");

    try {
      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: payloadDescription, depth: "deep" }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (analysisAbortRef.current !== controller) return;
      if (!response.ok) {
        throw new Error(data?.detail || `Analysis failed (${response.status})`);
      }

      setResult(data);
      setResultRevision((current) => current + 1);
      setClarifyDirty(false);
    } catch (requestError) {
      if (requestError?.name !== "AbortError" && analysisAbortRef.current === controller) {
        setError(requestError?.message || "Analysis failed.");
      }
    } finally {
      if (analysisAbortRef.current === controller) {
        analysisAbortRef.current = null;
        setBusy(false);
      }
    }
  }, [busy, description, result]);

  const restorePrev = useCallback(() => {
    if (!prevResult) return;
    cancelActiveAnalysis();
    setResult(prevResult);
    setResultRevision((current) => current + 1);
    setDescription(prevDescription);
    setError("");
    setClarifyDirty(false);
    setPrevResult(null);
    setPrevDescription("");
  }, [cancelActiveAnalysis, prevResult, prevDescription]);

  const resetAnalysis = useCallback(() => {
    cancelActiveAnalysis();
    setResult(null);
    setDescription("");
    setError("");
    setClarifyDirty(false);
    setPrevResult(null);
    setPrevDescription("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [cancelActiveAnalysis]);

  const handleCopyAnalysis = useCallback(async () => {
    if (!result) return;
    const text = buildClipboardSummary({ result, description, routeSections, legislationGroups });
    try {
      await navigator.clipboard.writeText(text);
      setAnalysisCopied(true);
      window.setTimeout(() => setAnalysisCopied(false), 2400);
    } catch (_) {}
  }, [result, description, routeSections, legislationGroups]);

  return (
    <div className="app-shell">
      <TopBar
        result={result}
        totalStandards={totalStandards}
        onReset={resetAnalysis}
        prevResult={prevResult}
        onRestorePrev={restorePrev}
        onCopy={handleCopyAnalysis}
        copied={analysisCopied}
      />

      {result ? (
        <DirtyBanner
          dirty={clarifyDirty}
          busy={busy}
          onReanalyze={runAnalysis}
          onDismiss={() => setClarifyDirty(false)}
        />
      ) : null}

      <main className={`page-shell page-main ${!result ? "page-main--landing" : ""}`.trim()}>
        <HeroPanel
          result={result}
          routeSections={routeSections}
          legislationItems={legislationItems}
          guidanceItems={guidanceItems}
        />

        <ComposerPanel
          description={description}
          setDescription={setDescription}
          templates={templates}
          backendChips={backendChips}
          onAnalyze={runAnalysis}
          busy={busy}
          onDirty={setClarifyDirty}
          isLanding={!result}
        />

        <AnalysisProgressBanner busy={busy} />

        {!result && !busy && <EmptyState />}

        {error ? <ErrorBanner message={error} /> : null}

        <div ref={resultsRef} />

        {result ? (
          <div className="workspace-grid">
            <div className="workspace-main">
              <OverviewPanel
                result={result}
                routeSections={routeSections}
                legislationItems={legislationItems}
              />

              <ErrorBoundary
                key={`standards-${resultRevision}`}
                label="Standards route could not be rendered"
              >
                <StandardsRoutePanel
                  sections={routeSections}
                  directiveBreakdown={directiveBreakdown}
                  baseSafetyRoute={baseSafetyRoute}
                />
              </ErrorBoundary>

              <ErrorBoundary
                key={`legislation-${resultRevision}`}
                label="Legislation panel could not be rendered"
              >
                <ParallelObligationsPanel legislationGroups={legislationGroups} />
              </ErrorBoundary>

              <ErrorBoundary
                key={`clarifications-${resultRevision}`}
                label="Clarifications could not be rendered"
              >
                <MinimalClarificationPrompt
                  items={guidanceItems}
                  onApply={(text) => {
                    setDescription((current) => {
                      const next = joinText(current, text);
                      if (next !== current) setClarifyDirty(true);
                      return next;
                    });
                  }}
                />
              </ErrorBoundary>

              <div className="footer-note">
                <span>
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span>RuleGrid</span>
              </div>
            </div>

            <ErrorBoundary
              key={`sidebar-${resultRevision}`}
              label="Sidebar could not be rendered"
            >
              <SnapshotRail
                result={result}
                routeSections={routeSections}
                description={description}
                onCopy={handleCopyAnalysis}
                copied={analysisCopied}
                legislationGroups={legislationGroups}
              />
            </ErrorBoundary>
          </div>
        ) : null}
      </main>

      <ScrollTopButton visible={scrolled} />
    </div>
  );
}