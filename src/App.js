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
  buildEngineSidebarSections,
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
   IMPROVEMENT #11 — ErrorBoundary
   Class component wrapping volatile panels so a render error in
   one section doesn't blank the entire UI.
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
    show_if: (det) => det.likelyFood && !det.hasFoodContact && !det.hasNoFoodContact,
    suggestions: [
      { label: "Food-contact path",   text: "food-contact / wetted path present" },
      { label: "No food contact",     text: "no food-contact materials in normal use" },
      { label: "Pressure + steam",    text: "contains pressurized and steam-generating system" },
    ],
  },
  {
    id: "environment",
    label: "Environment",
    icon: "droplets",
    show_if: (det) => det.hasProduct && !det.hasIndoorOutdoor,
    suggestions: [
      { label: "Indoor only",   text: "indoor use only" },
      { label: "Outdoor use",   text: "intended for outdoor use / weather exposure" },
      { label: "Wet environment", text: "used in wet / splash-prone environment" },
    ],
  },
  {
    id: "privacy_sensors",
    label: "Sensors & privacy",
    icon: "cpu",
    show_if: (det) => det.hasRadio && !det.hasCamera && !det.hasMicrophone && !det.hasDataStorage,
    suggestions: [
      { label: "Camera",       text: "includes camera / video capture" },
      { label: "Microphone",   text: "includes microphone / voice control" },
      { label: "Stores personal data", text: "stores user or personal data locally or in cloud" },
    ],
  },
  {
    id: "sustainability",
    label: "Lifecycle hints",
    icon: "leaf",
    show_if: (det) => det.hasProduct,
    suggestions: [
      { label: "Battery replaceability", text: "battery is user-removable / replaceable" },
      { label: "Spare parts available",  text: "spare parts and service information are available" },
      { label: "Repairable design",      text: "designed for repair / maintenance access" },
    ],
  },
  {
    id: "commerce",
    label: "Commercial model",
    icon: "cart",
    show_if: (det) => det.hasRadio && !det.hasMonetary,
    suggestions: [
      { label: "Subscription", text: "subscription or paid cloud feature model" },
      { label: "In-app orders", text: "allows monetary transactions / ordering within app" },
    ],
  },
];

function detectSuggestionState(description) {
  const text = String(description || "");
  const lower = text.toLowerCase();

  const present = new Set();
  for (const sig of TEXT_SIGNALS) {
    if (sig.re.test(text)) present.add(sig.trait);
  }
  for (const ctx of PRODUCT_CONTEXTS) {
    if (ctx.re.test(text)) {
      ctx.implied.forEach((trait) => present.add(trait));
    }
  }

  const hasProduct = PRODUCT_CONTEXTS.some((ctx) => ctx.re.test(text)) || lower.length > 10;
  const hasPower =
    present.has("mains_powered") ||
    present.has("battery_powered") ||
    present.has("usb_powered") ||
    present.has("external_psu") ||
    present.has("mains_power_likely");

  const hasRadio =
    present.has("wifi") ||
    present.has("bluetooth") ||
    present.has("cellular") ||
    present.has("zigbee") ||
    present.has("thread") ||
    present.has("matter") ||
    present.has("nfc");

  const likelyFood =
    present.has("food_contact") ||
    present.has("coffee_brewing") ||
    present.has("beverage_preparation") ||
    present.has("food_preparation") ||
    present.has("cooking") ||
    /\b(food|coffee|espresso|beverage|drink|brew|kitchen)\b/i.test(text);

  return {
    hasProduct,
    hasPower,
    hasRadio,
    hasCloud: present.has("cloud"),
    hasOTA: present.has("ota"),
    hasAccount: present.has("account") || present.has("authentication"),
    hasFoodContact: present.has("food_contact"),
    hasNoFoodContact: present.has("no_food_contact"),
    likelyFood,
    hasIndoorOutdoor: present.has("indoor_use") || present.has("outdoor_use"),
    hasCamera: present.has("camera"),
    hasMicrophone: present.has("microphone"),
    hasDataStorage: present.has("data_storage"),
    hasMonetary: present.has("monetary_transaction"),
    hasLocalOnly: present.has("local_only"),
  };
}

function useSmartSuggestions(description, backendChips) {
  return useMemo(() => {
    if (backendChips?.length) {
      const grouped = [];
      const chunks = [
        { id: "backend", label: "Suggested details", icon: "cpu", suggestions: backendChips },
      ];
      for (const c of chunks) {
        if (c.suggestions?.length) grouped.push(c);
      }
      return grouped;
    }

    const det = detectSuggestionState(description);
    return SUGGESTION_TIERS
      .filter((tier) => tier.show_if(det))
      .map((tier) => ({
        ...tier,
        suggestions: tier.suggestions,
      }))
      .filter((tier) => tier.suggestions.length > 0);
  }, [description, backendChips]);
}

/* ================================================================
   UI HELPERS
   ================================================================ */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Panel({ eyebrow, title, subtitle, action, className = "", children }) {
  return (
    <section className={cx("panel", className)}>
      {(eyebrow || title || subtitle || action) && (
        <div className="panel__header">
          <div className="panel__titlewrap">
            {eyebrow ? <span className="panel__eyebrow">{eyebrow}</span> : null}
            {title ? <h2 className="panel__title">{title}</h2> : null}
            {subtitle ? <p className="panel__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="panel__action">{action}</div> : null}
        </div>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}

function InlineTag({ children, tone = "neutral", className = "" }) {
  return <span className={cx("inline-tag", `inline-tag--${tone}`, className)}>{children}</span>;
}

function RiskPill({ value }) {
  const normalized = String(value || "").toUpperCase();
  const map = {
    LOW: "success",
    MEDIUM: "warn",
    HIGH: "danger",
    UNKNOWN: "neutral",
  };
  return (
    <InlineTag tone={map[normalized] || "neutral"}>
      {formatUiLabel(normalized || "Unknown")}
    </InlineTag>
  );
}

function StatusPill({ value }) {
  const info = STATUS[value] || STATUS.conditional;
  return (
    <InlineTag tone={info.tone}>
      {info.label}
    </InlineTag>
  );
}

function ImportancePill({ value }) {
  const key = String(value || "medium").toLowerCase();
  const tone = IMPORTANCE[key] || IMPORTANCE.medium;
  return (
    <span
      className="importance-pill"
      style={{
        "--importance-dot": tone.dot,
        "--importance-bg": tone.bg,
        "--importance-border": tone.bd,
        "--importance-text": tone.text,
      }}
    >
      <span className="importance-pill__dot" />
      {tone.label}
    </span>
  );
}

function DirectivePill({ dirKey }) {
  const tone = directiveTone(dirKey || "OTHER");
  const short = directiveShort(dirKey || "OTHER");
  return (
    <span
      className="directive-pill"
      style={{
        "--directive-pill-bg": tone.bg,
        "--directive-pill-border": tone.bd,
        "--directive-pill-text": tone.text,
      }}
    >
      {short}
    </span>
  );
}

function NotesList({ items = [] }) {
  if (!items.length) return null;
  return (
    <ul className="notes-list">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`}>{titleCaseMinor(item)}</li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <section className="empty-state">
      <div className="empty-state__orb" />
      <div className="empty-state__content">
        <div className="empty-state__eyebrow">
          <Sparkles size={12} />
          Ready to analyze
        </div>
        <h2 className="empty-state__title">Build the route with one precise description</h2>
        <p className="empty-state__copy">
          Mention the main function, power source, radios, cloud/OTA features, and any
          food-contact or safety-relevant details.
        </p>
        <div className="empty-state__tips">
          <span>Wi-Fi / Bluetooth</span>
          <span>Mains / battery</span>
          <span>Cloud account</span>
          <span>Food-contact path</span>
        </div>
      </div>
    </section>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="banner banner--error" role="alert">
      <TriangleAlert size={15} />
      <span>{message}</span>
    </div>
  );
}

function AnalysisProgressBanner({ busy }) {
  if (!busy) return null;
  return (
    <div className="banner banner--progress" role="status" aria-live="polite">
      <LoaderCircle size={15} className="spin" />
      <span>Running standards route, legislation mapping, and clarification checks…</span>
    </div>
  );
}

function CopyResultsButton({ onCopy, copied }) {
  return (
    <button type="button" className="button button--ghost button--copy" onClick={onCopy}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy summary"}
    </button>
  );
}

function DirtyBanner({ dirty, onAnalyze, busy, onReset }) {
  if (!dirty) return null;
  return (
    <div className="dirty-banner" role="status" aria-live="polite">
      <div className="dirty-banner__copy">
        <span className="dirty-banner__title">Description changed</span>
        <span className="dirty-banner__text">Re-run to refresh the route.</span>
      </div>
      <div className="dirty-banner__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={onReset}
          disabled={busy}
        >
          <RefreshCcw size={14} />
          Reset
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={onAnalyze}
          disabled={busy}
        >
          {busy ? <LoaderCircle size={14} className="spin" /> : <Search size={14} />}
          {busy ? "Updating…" : "Re-run analysis"}
        </button>
      </div>
    </div>
  );
}

function baseSafetyRoutePill({ route, compact = false, labelOverride = "" }) {
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
   FIX #9: isApplied now uses explicit Set tracking instead of
   substring scan. No false positives when the user types the
   same word themselves; no false negatives when they paraphrase.
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
   FIX #9: tracks appliedChipTexts in an explicit Set so
            SmartSuggestionsPanel gets accurate isApplied state
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

  if (isLanding) {
    return (
      <div className="landing-composer">
        <div className="landing-composer__quickstart">
          <span className="micro-label">Quick start</span>
          <div className="template-row">
            {templates.slice(0, 5).map((template) => (
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
            <X size={14} />
            Clear
          </button>
        </div>
      </div>
    </Panel>
  );
}

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
            {routeSections.length} regime{routeSections.length === 1 ? "" : "s"}.
          </p>
        </div>
      </Panel>
    </div>
  );
}


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
    codeStrings.some((code) => code.includes("60335")) ||
    titleStrings.some((title) => title.includes("household and similar electrical appliances"));

  const has62368 =
    codeStrings.some((code) => code.includes("62368")) ||
    titleStrings.some((title) => title.includes("audio/video") || title.includes("ict"));

  if (has60335 && !has62368) return BASE_SAFETY_ROUTE_COPY.EN_60335;
  if (has62368 && !has60335) return BASE_SAFETY_ROUTE_COPY.EN_62368;

  const family = String(result?.product_family || "").toLowerCase();
  const type = String(result?.product_type || "").toLowerCase();
  const subtype = String(result?.product_subtype || "").toLowerCase();
  const joined = `${family} ${type} ${subtype}`;

  const applianceHints = [
    "coffee", "espresso", "kettle", "toaster", "oven", "air fryer", "vacuum", "fan",
    "purifier", "dishwasher", "washing machine", "dryer", "heater", "fridge", "freezer",
    "blender", "mixer", "food processor",
  ];
  const ictHints = [
    "router", "speaker", "display", "monitor", "tv", "laptop", "tablet", "camera",
    "doorbell", "printer", "scanner", "headset", "vr", "ar", "set-top",
  ];

  if (applianceHints.some((hint) => joined.includes(hint))) return BASE_SAFETY_ROUTE_COPY.EN_60335;
  if (ictHints.some((hint) => joined.includes(hint))) return BASE_SAFETY_ROUTE_COPY.EN_62368;

  return null;
}

function SnapshotMetric({ label, value }) {
  return (
    <div className="snapshot-metric">
      <div className="snapshot-metric__label">{label}</div>
      <div className="snapshot-metric__value">{value}</div>
    </div>
  );
}

function EngineDetailsSection({ result }) {
  const items = buildEngineSidebarSections(result);
  if (!items.length) return null;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section__heading">Engine detail</div>
      <div className="sidebar-metadata-list">
        {items.map((item) => (
          <div key={item.label} className="sidebar-metadata-row">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function SnapshotRail({ result, routeSections, legislationGroups, description, onCopy, copied }) {
  if (!result) return null;

  const totalStandards = routeSections.reduce(
    (count, section) => count + (section.items || []).length,
    0
  );
  const totalLegislation = legislationGroups.reduce(
    (count, group) => count + (group.items || []).length,
    0
  );

  return (
    <aside className="side-column">
      <Panel
        className="panel--sidebar"
        eyebrow="Snapshot"
        title="Context"
        subtitle="Product identity and legislation pinned alongside the route."
      >
        <div className="snapshot-list">
          {[
            ["Product", formatUiLabel(result?.product_type || "unclear")],
            ["Family", formatUiLabel(result?.product_family || "unclear")],
            ["Subtype", result?.product_subtype ? formatUiLabel(result.product_subtype) : "Not locked"],
            ["Stage", formatStageLabel(result?.product_match_stage)],
            ["Risk", formatUiLabel(result?.overall_risk || "MEDIUM")],
            ["Standards", totalStandards],
            ["Legislation", totalLegislation],
          ].map(([label, value]) => (
            <div key={label} className="snapshot-row">
              <span className="snapshot-row__label">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <CopyResultsButton onCopy={onCopy} copied={copied} />

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

        <EngineDetailsSection result={result} />

        <div className="sidebar-section">
          <div className="sidebar-section__heading">Applicable legislation</div>
          <div className="sidebar-section__subheading">
            Secondary context to the standards route
          </div>

          <div className="legislation-group-list">
            {legislationGroups.map((group) => (
              <div key={group.key || group.title} className="legislation-group">
                <div className="legislation-group__header">
                  <span>{titleCaseMinor(group.title)}</span>
                  <span>{(group.items || []).length}</span>
                </div>
                <div className="legislation-group__items">
                  {(group.items || []).map((item) => {
                    const tone = directiveTone(item.directive_key || "OTHER");
                    const shortCode = directiveShort(item.directive_key || "OTHER");
                    return (
                      <div
                        key={`${group.key}-${item.code}-${item.title}`}
                        className="legislation-item"
                        style={{
                          "--legislation-dot": tone.dot,
                          "--legislation-dot-bg": tone.bg,
                          "--legislation-dot-border": tone.bd,
                          "--legislation-dot-text": tone.text,
                        }}
                      >
                        <div className="legislation-item__badge">{shortCode}</div>
                        <div className="legislation-item__copy">
                          <div className="legislation-item__title">{item.title}</div>
                          {item.code ? (
                            <div className="legislation-item__code-num">{item.code}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </aside>
  );
}

function getParallelObligationGroups(legislationGroups) {
  return (legislationGroups || [])
    .filter((group) => ["non_ce", "future", "framework", "other"].includes(group?.key))
    .filter((group) => (group.items || []).length > 0);
}

function ParallelObligationsPanel({ legislationGroups }) {
  const groups = getParallelObligationGroups(legislationGroups);

  if (!groups.length) return null;

  const totalItems = groups.reduce((count, group) => count + (group.items || []).length, 0);

  return (
    <Panel
      className="panel--parallel"
      eyebrow="Additional requirements"
      title="Parallel obligations"
      subtitle="Shown in the main route as well, not only in the sidebar."
    >
      <div className="parallel-obligations">
        <div className="parallel-obligations__summary">
          <span className="soft-tag">
            {totalItems} obligation{totalItems === 1 ? "" : "s"}
          </span>
        </div>

        <div className="parallel-obligations__groups">
          {groups.map((group) => (
            <section key={group.key || group.title} className="parallel-group">
              <div className="parallel-group__header">
                <div className="parallel-group__title-wrap">
                  <span className="parallel-group__title">{titleCaseMinor(group.title || group.key)}</span>
                  <span className="parallel-group__count">
                    {(group.items || []).length}
                  </span>
                </div>
              </div>

              <div className="parallel-group__items">
                {(group.items || []).map((item) => {
                  const tone = directiveTone(item.directive_key || "OTHER");
                  return (
                    <article
                      key={`${group.key}-${item.code || item.title}-${item.directive_key || "OTHER"}`}
                      className="parallel-item"
                      style={{
                        "--parallel-dot": tone.dot,
                        "--parallel-bg": tone.bg,
                        "--parallel-border": tone.bd,
                        "--parallel-text": tone.text,
                      }}
                    >
                      <div className="parallel-item__top">
                        <DirectivePill dirKey={item.directive_key || "OTHER"} />
                        {item.code ? <span className="code-chip">{item.code}</span> : null}
                      </div>

                      <h4 className="parallel-item__title">
                        {titleCaseMinor(item.title || "Untitled obligation")}
                      </h4>

                      {item.notes ? (
                        <p className="parallel-item__text">{titleCaseMinor(item.notes)}</p>
                      ) : item.reason ? (
                        <p className="parallel-item__text">{titleCaseMinor(item.reason)}</p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Panel>
  );
}


/* ──────────────────────────────────────────────────────────
   ClarificationsPanel
   ────────────────────────────────────────────────────────── */
function ClarificationsPanel({ items, onApply }) {
  const [appliedKeys, setAppliedKeys] = useState(new Set());

  const handleCardApply = useCallback(
    (itemKey, choiceText) => {
      setAppliedKeys((prev) => new Set([...prev, itemKey]));
      onApply(choiceText);
    },
    [onApply]
  );

  if (!items.length) return null;

  const appliedCount = appliedKeys.size;

  return (
    <section className="panel panel--clarifications-compact">
      <div className="clarifications-header clarifications-header--compact">
        <div className="clarifications-header__left clarifications-header__left--stack">
          <span className="clarifications-header__eyebrow">Clarifications</span>
          <span className="clarifications-header__subtitle">
            {items.length} item{items.length === 1 ? "" : "s"} may change the route
            {appliedCount > 0 ? (
              <span className="clarifications-applied-tally"> · {appliedCount} applied</span>
            ) : null}
          </span>
        </div>
        <span className="keyboard-hint">Tap one detail to add it to the description</span>
      </div>

      <div className="panel__body panel__body--compact">
        <div className="clarification-list clarification-list--compact">
          {items.map((item) => {
            const tone = IMPORTANCE[item.importance] || IMPORTANCE.medium;
            const isApplied = appliedKeys.has(item.key);

            return (
              <article
                key={item.key}
                className={`clarification-card clarification-card--compact${
                  isApplied ? " clarification-card--applied" : ""
                }`}
                style={{
                  "--card-accent": isApplied ? "#78d5c1" : tone.dot,
                  "--card-border": isApplied ? "rgba(120, 213, 193, 0.30)" : tone.bd,
                  "--card-bg": tone.bg,
                }}
              >
                <div className="clarification-card__header clarification-card__header--compact">
                  <div className="clarification-card__title-group clarification-card__title-group--compact">
                    <ImportancePill value={item.importance} />
                    <h3>{item.title}</h3>
                  </div>

                  {isApplied ? (
                    <span className="clarification-applied-badge">
                      <Check size={10} />
                      Applied
                    </span>
                  ) : null}
                </div>

                {item.choices?.length ? (
                  <div className="template-row template-row--compact">
                    {item.choices.map((choice) => (
                      <button
                        key={`${item.key}-${choice}`}
                        type="button"
                        className={`chip-button chip-button--soft${
                          isApplied ? " chip-button--muted" : ""
                        }`}
                        onClick={() => handleCardApply(item.key, choice)}
                      >
                        + {choice}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   StandardsRouteSection
   ────────────────────────────────────────────────────────── */
function StandardsRouteSection({ section, baseSafetyRoute, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const tone = SECTION_TONES[section.key] || SECTION_TONES.OTHER;

  return (
    <section
      className="route-section"
      style={{
        "--section-dot": tone.dot,
        "--section-bg": tone.bg,
        "--section-border": tone.bd,
        "--section-text": tone.text,
      }}
    >
      <button
        type="button"
        className="route-section__header"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className="route-section__titlewrap">
          <DirectivePill dirKey={section.key} />
          <div>
            <h3 className="route-section__title">{routeTitle(section.key)}</h3>
            <p className="route-section__subtitle">
              {section.count} standard{section.count === 1 ? "" : "s"}
            </p>
          </div>
          {section.key === "LVD" && baseSafetyRoute ? (
            <div className="route-section__base-route">
              {baseSafetyRoutePill({ route: baseSafetyRoute, compact: true })}
            </div>
          ) : null}
        </div>
        <span className="route-section__chevron">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open ? (
        <div className="route-section__body">
          {(section.items || []).map((item) => {
            const standardDirective = normalizeStandardDirective(item.directive_key || section.key);
            const itemTone = directiveTone(standardDirective);
            return (
              <article
                key={`${section.key}-${item.code}-${item.title}`}
                className="standard-card"
                style={{
                  "--card-dot": itemTone.dot,
                  "--card-bg": itemTone.bg,
                  "--card-border": itemTone.bd,
                  "--card-text": itemTone.text,
                }}
              >
                <div className="standard-card__top">
                  <div className="standard-card__badges">
                    <DirectivePill dirKey={standardDirective} />
                    {item.tag ? <InlineTag>{item.tag}</InlineTag> : null}
                    {item.route_role ? <InlineTag tone="neutral">{titleCaseMinor(item.route_role)}</InlineTag> : null}
                  </div>
                  <StatusPill value={item.status} />
                </div>

                <div className="standard-card__header">
                  <h4 className="standard-card__title">
                    {item.code ? `${item.code} — ` : ""}
                    {titleCaseMinor(item.title || "Untitled standard")}
                  </h4>
                  {item.short_note ? (
                    <p className="standard-card__intro">{titleCaseMinor(item.short_note)}</p>
                  ) : null}
                </div>

                <div className="standard-card__meta-grid">
                  {item.harmonized_reference ? (
                    <div className="standard-card__meta">
                      <span className="standard-card__meta-label">Harmonized</span>
                      <strong>{item.harmonized_reference}</strong>
                    </div>
                  ) : null}

                  {item.latest_reference ? (
                    <div className="standard-card__meta">
                      <span className="standard-card__meta-label">State of the art</span>
                      <strong>{item.latest_reference}</strong>
                    </div>
                  ) : null}

                  {item.evidence_expected ? (
                    <div className="standard-card__meta">
                      <span className="standard-card__meta-label">Evidence expected</span>
                      <strong>{titleCaseMinor(item.evidence_expected)}</strong>
                    </div>
                  ) : null}

                  {item.scope_gate ? (
                    <div className="standard-card__meta">
                      <span className="standard-card__meta-label">Scope gate</span>
                      <strong>{titleCaseMinor(item.scope_gate)}</strong>
                    </div>
                  ) : null}
                </div>

                {item.notes?.length ? <NotesList items={item.notes} /> : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   StandardsRoutePanel
   ────────────────────────────────────────────────────────── */
function StandardsRoutePanel({ sections, directiveBreakdown, baseSafetyRoute }) {
  if (!sections.length) return null;

  return (
    <Panel
      eyebrow="Main route"
      title="Standards route"
      subtitle="Primary harmonized and supporting standards, grouped by regime."
    >
      <div className="route-summary-strip">
        {directiveBreakdown.map((item) => (
          <SnapshotMetric key={item.key} label={directiveShort(item.key)} value={item.count} />
        ))}
      </div>

      {baseSafetyRoute ? (
        <div className="base-route-callout">
          <div className="base-route-callout__top">
            {baseSafetyRoutePill({ route: baseSafetyRoute })}
          </div>
          <p className="base-route-callout__text">{baseSafetyRoute.description}</p>
          <p className="base-route-callout__note">{baseSafetyRoute.note}</p>
        </div>
      ) : null}

      <div className="route-section-list">
        {sections.map((section, index) => (
          <StandardsRouteSection
            key={section.key}
            section={section}
            baseSafetyRoute={baseSafetyRoute}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </Panel>
  );
}

/* ──────────────────────────────────────────────────────────
   OverviewPanel — summary text + inline metric strip
   ────────────────────────────────────────────────────────── */
function OverviewPanel({ result, routeSections, legislationItems }) {
  if (!result) return null;

  const confidence = result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
  const metrics = [
    ["Confidence", formatUiLabel(confidence)],
    ["Risk", formatUiLabel(result?.overall_risk || "medium")],
    ["Regimes", routeSections.length],
    ["Legislation", legislationItems.length],
  ];

  return (
    <Panel
      eyebrow="Overview"
      title={result?.summary_title || "Assessment overview"}
      subtitle={result?.summary || "Review the route, supporting legislation, and missing detail below."}
    >
      <div className="overview-metrics">
        {metrics.map(([label, value]) => (
          <div key={label} className="overview-metric">
            <span className="overview-metric__label">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function App() {
  const [description, setDescription] = useState("");
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [metadata, setMetadata] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [clarifyDirty, setClarifyDirty] = useState(false);
  const [resultRevision, setResultRevision] = useState(0);

  const resultsRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetch(METADATA_URL)
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        setMetadata(json);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const routeSections = useMemo(() => buildRouteSections(result), [result]);
  const legislationItems = useMemo(() => buildCompactLegislationItems(result), [result]);
  const legislationGroups = useMemo(() => buildLegislationGroups(result), [result]);
  const guidanceItems = useMemo(() => buildGuidanceItems(result), [result]);
  const directiveBreakdown = useMemo(() => buildDirectiveBreakdown(routeSections), [routeSections]);
  const backendChips = useMemo(() => buildDynamicTemplates(result), [result]);
  const baseSafetyRoute = useMemo(() => inferBaseSafetyRoute(result, routeSections), [result, routeSections]);

  const runAnalysis = useCallback(async () => {
    if (!description.trim()) return;
    setBusy(true);
    setError("");
    setCopied(false);

    try {
      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        throw new Error("Analysis request failed");
      }

      const data = await res.json();
      setResult(data);
      setClarifyDirty(false);
      setResultRevision((v) => v + 1);

      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(err?.message || "Could not analyze the product.");
    } finally {
      setBusy(false);
    }
  }, [description]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(buildClipboardSummary(result));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [result]);

  const resetAnalysis = useCallback(() => {
    setResult(null);
    setError("");
    setCopied(false);
    setClarifyDirty(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div className="topbar__left">
            {result ? (
              <button type="button" className="button button--ghost" onClick={resetAnalysis}>
                <ArrowLeft size={14} />
                New analysis
              </button>
            ) : null}
          </div>
          <div className="topbar__right">
            {result ? (
              <button
                type="button"
                className="button button--ghost"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <ArrowUp size={14} />
                Top
              </button>
            ) : null}
          </div>
        </header>

        <HeroPanel
          result={result}
          routeSections={routeSections}
          legislationItems={legislationItems}
          guidanceItems={guidanceItems}
        />

        <DirtyBanner
          dirty={clarifyDirty}
          onAnalyze={runAnalysis}
          busy={busy}
          onReset={() => setClarifyDirty(false)}
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
                key={`clarifications-${resultRevision}`}
                label="Clarifications could not be rendered"
              >
                <ClarificationsPanel
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
                key={`parallel-${resultRevision}`}
                label="Parallel obligations could not be rendered"
              >
                <ParallelObligationsPanel legislationGroups={legislationGroups} />
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

            <SnapshotRail
              result={result}
              routeSections={routeSections}
              legislationGroups={legislationGroups}
              description={description}
              onCopy={handleCopy}
              copied={copied}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}