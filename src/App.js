import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  directiveShort,
  directiveTone,
  formatUiLabel,
  joinText,
  normalizeStandardDirective,
  prettyValue,
  routeTitle,
  sentenceCaseList,
  titleCaseMinor,
} from "./appHelpers";

/* ================================================================
   SMART SUGGESTION ENGINE v2
   Detects traits from free text, surfaces high-impact missing ones.
   Grounded in traits.yaml + legislation_catalog.yaml triggers.
   ================================================================ */

// Text → trait signal map (order matters — more specific first)
const TEXT_SIGNALS = [
  // Power
  { re: /\b(mains|230v|240v|plug.?in|corded|wall.?socket|ac.?power)\b/i,  trait: "mains_powered" },
  { re: /\b(battery|rechargeable|cordless|lithium)\b/i,                    trait: "battery_powered" },
  { re: /\b(usb.?c?|usb.powered)\b/i,                                      trait: "usb_powered" },
  { re: /\b(external.*(psu|adapter|adaptor)|power.?supply|charger.?brick)\b/i, trait: "external_psu" },
  // Radio / connectivity
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
  // Food / materials
  { re: /\b(food.?contact|wetted.?path|brew.?path|in.?contact.?with.?food)\b/i, trait: "food_contact" },
  { re: /\b(no.*(food|beverage).?contact|does.?not.?contact.?food)\b/i,   trait: "no_food_contact" },
  // Product features
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

// Product keyword → context traits implied by the product type
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

// Suggestion tiers — evaluated in order, first matching tier shown
// Each tier specifies when to show (requires_*) and what to offer
const SUGGESTION_TIERS = [
  {
    id: "power",
    label: "Power source",
    icon: "zap",
    // Show when: product detected but no power source mentioned
    show_if: (det) => det.hasProduct && !det.hasPower,
    suggestions: [
      { label: "Mains powered",    text: "mains powered (230 V AC)",                           icon: "zap" },
      { label: "Battery",          text: "battery powered with rechargeable pack",              icon: "zap" },
      { label: "External adapter", text: "powered via external AC/DC power supply adapter",    icon: "zap" },
      { label: "USB-C powered",    text: "USB-C powered (low-voltage supply)",                  icon: "zap" },
    ],
  },
  {
    id: "connectivity",
    label: "Connectivity",
    icon: "wifi",
    // Show when: no radio connectivity mentioned yet
    show_if: (det) => !det.hasRadio && !det.hasLocalOnly && (det.hasProduct || det.hasPower),
    suggestions: [
      { label: "Wi-Fi",        text: "Wi-Fi connected (2.4 GHz)",                              icon: "wifi" },
      { label: "Bluetooth",    text: "Bluetooth connected (BLE)",                              icon: "wifi" },
      { label: "App control",  text: "controllable via mobile app (iOS and Android)",          icon: "wifi" },
      { label: "No wireless",  text: "no wireless connectivity — fully local operation",       icon: "wifi" },
    ],
  },
  {
    id: "cloud_software",
    label: "Cloud & software",
    icon: "cloud",
    // Show when: radio detected but no cloud/ota/account mentioned
    show_if: (det) => det.hasRadio && !det.hasCloud && !det.hasOTA && !det.hasAccount,
    suggestions: [
      { label: "Cloud account",  text: "with cloud account and user login (email + password)", icon: "cloud" },
      { label: "OTA updates",    text: "with over-the-air firmware updates",                   icon: "cloud" },
      { label: "Local only",     text: "local network only — no cloud or OTA dependency",      icon: "cloud" },
    ],
  },
  {
    id: "food_contact",
    label: "Food & materials",
    icon: "flask",
    // Show when: food/beverage product detected but no food-contact statement
    show_if: (det) => det.hasFoodContext && !det.hasFoodContact && !det.hasNoFoodContact,
    suggestions: [
      { label: "Food-contact path",  text: "food-contact wetted path (plastic and metal parts contact food or beverages)", icon: "flask" },
      { label: "Plastic food parts", text: "plastic food-contact parts in brew or food path",  icon: "flask" },
      { label: "No food contact",    text: "no direct food or beverage contact",               icon: "flask" },
    ],
  },
  {
    id: "pressure_steam",
    label: "Pressure & steam",
    icon: "droplets",
    // Show when: coffee/espresso but no pressure/steam mentioned
    show_if: (det) => det.hasCoffeeContext && !det.hasPressure && !det.hasSteam,
    suggestions: [
      { label: "Pressure system", text: "pressurised brew system (15-bar pump)",  icon: "droplets" },
      { label: "Steam wand",      text: "steam wand for milk frothing",           icon: "droplets" },
      { label: "No pressure",     text: "drip or filter brew — no pressure",      icon: "droplets" },
    ],
  },
  {
    id: "outdoor_context",
    label: "Use environment",
    icon: "leaf",
    // Show when: outdoor/garden product but no environment stated
    show_if: (det) => det.hasOutdoorContext && !det.hasOutdoor && !det.hasIndoor,
    suggestions: [
      { label: "Outdoor rated",  text: "for outdoor use — weather and dust exposure (IP-rated enclosure)", icon: "leaf" },
      { label: "Indoor only",    text: "indoor use only — not weather exposed",   icon: "leaf" },
    ],
  },
  {
    id: "cybersecurity",
    label: "Account & auth",
    icon: "cpu",
    // Show when: cloud/internet detected but no account/auth mentioned
    show_if: (det) => (det.hasCloud || det.hasInternet) && !det.hasAccount && !det.hasAuthentication,
    suggestions: [
      { label: "User account",     text: "requires user account creation (email, password, profile)", icon: "cpu" },
      { label: "Authentication",   text: "password and multi-factor authentication for device access",  icon: "cpu" },
      { label: "No account",       text: "no user account required — device works standalone",          icon: "cpu" },
    ],
  },
  {
    id: "payments",
    label: "Transactions",
    icon: "cart",
    // Show when: app + connected but no payments mentioned
    show_if: (det) => det.hasAppControl && !det.hasMonetary,
    suggestions: [
      { label: "In-app purchase",  text: "supports in-app purchases or subscription billing", icon: "cart" },
      { label: "No payments",      text: "no monetary transactions or subscription functions", icon: "cart" },
    ],
  },
];

// Derive a detection state object from free text
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

    // After analysis: backend chips take priority, fill remaining slots with smart ones
    if (backendChips && backendChips.length) {
      return [{ id: "backend", label: "Suggested additions", suggestions: backendChips.slice(0, 6) }];
    }

    // No text yet — return empty
    if (text.length < 5) return [];

    const det = detectTraits(text);
    const groups = [];

    for (const tier of SUGGESTION_TIERS) {
      if (tier.show_if(det)) {
        groups.push({ id: tier.id, label: tier.label, icon: tier.icon, suggestions: tier.suggestions });
        if (groups.length >= 3) break; // max 3 groups at once to avoid overwhelm
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


function TopBar({ result, totalStandards, onReset }) {
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
              <span className="topbar__count">{totalStandards} standards</span>
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
   HeroPanel — compact strip on landing, full panel on result
   ────────────────────────────────────────────────────────── */
function HeroPanel({ result, routeSections, legislationItems, guidanceItems }) {
  const hero = result?.hero_summary || {};
  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";

  /* ── Empty / Landing state: compact strip ── */
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

  /* ── Result state: full two-column hero ── */
  const title = hero.title || `${formatUiLabel(result?.product_type || "Product")} regulatory route`;
  const subtitle = result?.summary || hero.subtitle || "";

  const supportItems = [
    {
      icon: <ListChecks size={14} />,
      title: `${routeSections.length} route sections`,
      text: "Standards grouped by regime for a faster first pass.",
    },
    {
      icon: <ShieldCheck size={14} />,
      title: `${legislationItems.length} legislation items`,
      text: "Applicable frameworks pinned in the side rail.",
    },
    {
      icon: <Search size={14} />,
      title: `${guidanceItems.length} clarifications`,
      text: "Details most likely to shift scope.",
    },
  ];

  return (
    <div className="hero-grid">
      <Panel className="panel--hero" eyebrow="Guided Workspace" title={title} subtitle={subtitle}>
        <div className="hero-panel__content">
          <div className="hero-panel__tags">
            <RiskPill value={result?.overall_risk || "MEDIUM"} />
            <span className="soft-tag">Confidence: {formatUiLabel(confidence)}</span>
            {result?.product_type ? (
              <span className="soft-tag">{formatUiLabel(result.product_type)}</span>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel
        className="panel--support"
        eyebrow="This output"
        title="What's covered"
      >
        <div className="support-list">
          {supportItems.map((item) => (
            <div key={item.title} className="support-list__item">
              <div className="support-list__icon">{item.icon}</div>
              <div>
                <div className="support-list__title">{item.title}</div>
                <div className="support-list__text">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   SmartSuggestionsPanel — live-updating chips from trait engine
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

function SmartSuggestionsPanel({ description, onApply, backendChips }) {
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
            {group.suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                className="smart-chip"
                onClick={() => onApply(s.text)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   ComposerPanel — landing & refinement variants
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

  useEffect(() => {
    if (isLanding && textareaRef.current) {
      const t = setTimeout(() => textareaRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isLanding]);

  const handleApply = useCallback((text) => {
    setDescription((current) => joinText(current, text));
    onDirty(true);
    textareaRef.current?.focus();
  }, [setDescription, onDirty]);

  const sharedTextarea = (
    <label className={isLanding ? "landing-composer__field" : "composer__field"}>
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
        {/* Quick-start templates */}
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
                  onDirty(true);
                  textareaRef.current?.focus();
                }}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea + CTA always locked together */}
        <div className="landing-composer__input-block">
          {sharedTextarea}
          <div className="landing-composer__cta-row">
            <div className={`counter ${usageState}`.trim()}>
              {wordCount ? <span>{wordCount}w</span> : null}
              <span>{description.length} / {charMax}</span>
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

        {/* Static hints row */}
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

        {/* Dynamic smart suggestions — updates as you type */}
        <SmartSuggestionsPanel
          description={description}
          onApply={handleApply}
          backendChips={null}
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
                onClick={() => { setDescription(template.text); onDirty(true); }}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {sharedTextarea}

        {/* Smart suggestions — backend chips post-result, live inference pre-result */}
        <SmartSuggestionsPanel
          description={description}
          onApply={handleApply}
          backendChips={backendChips}
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
            onClick={() => { setDescription(""); onDirty(true); }}
            disabled={!description}
          >
            Clear
          </button>
        </div>
      </div>
    </Panel>
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
    { label: "Product",     value: formatUiLabel(result?.product_type || "unclear") },
    { label: "Risk",        value: formatUiLabel(result?.overall_risk || "MEDIUM"),
      highlight: (result?.overall_risk || "MEDIUM").toUpperCase() === "HIGH" },
    { label: "Confidence",  value: formatUiLabel(confidence) },
    { label: "Standards",   value: String(totalStandards) },
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

function SnapshotRail({ result, routeSections, legislationGroups, description }) {
  if (!result) return null;

  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
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
            ["Confidence", formatUiLabel(confidence)],
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

        <CopyResultsButton
          result={result}
          description={description}
          routeSections={routeSections}
          legislationGroups={legislationGroups}
        />

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

function ClarificationsPanel({ items, dirty, busy, onReanalyze, onApply }) {
  if (!items.length) return null;

  return (
    <section className="panel">
      <div className="clarifications-header">
        <div className="clarifications-header__left">
          <span className="clarifications-header__eyebrow">Clarifications</span>
          <span className="clarifications-header__subtitle">
            {items.length} question{items.length === 1 ? "" : "s"} that may change scope
          </span>
        </div>
        {dirty ? (
          <button type="button" className="button button--primary" onClick={onReanalyze} disabled={busy}>
            {busy ? <LoaderCircle size={15} className="spin" /> : <RefreshCcw size={15} />}
            {busy ? "Re-running" : "Re-run analysis"}
          </button>
        ) : (
          <span className="keyboard-hint">Apply a detail below to update</span>
        )}
      </div>
      <div className="panel__body">
        <div className="clarification-list">
          {items.map((item, index) => {
            const tone = IMPORTANCE[item.importance] || IMPORTANCE.medium;
            return (
              <article
                key={item.key}
                className="clarification-card"
                style={{
                  "--card-accent": tone.dot,
                  "--card-border": tone.bd,
                  "--card-bg": tone.bg,
                }}
              >
                <div className="clarification-card__header">
                  <div className="clarification-card__title-group">
                    <ImportancePill value={item.importance} />
                    <h3>{item.title}</h3>
                  </div>
                  <div className="clarification-card__index">{String(index + 1).padStart(2, "0")}</div>
                </div>
                <p className="clarification-card__text">{item.why}</p>
                {item.choices?.length ? (
                  <div className="template-row">
                    {item.choices.map((choice) => (
                      <button
                        key={`${item.key}-${choice}`}
                        type="button"
                        className="chip-button chip-button--soft"
                        onClick={() => onApply(choice)}
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

function StandardItem({ item, sectionKey }) {
  const dirKey = normalizeStandardDirective(item);
  const dirTone = directiveTone(dirKey);
  const sectionTone = SECTION_TONES[sectionKey] || SECTION_TONES.unknown;
  const evidenceList = sentenceCaseList(item.evidence_hint || []);
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
    </article>
  );
}

function RouteSection({ section }) {
  const [open, setOpen] = useState(true);
  const tone = directiveTone(section.key);
  const title = routeTitle(section);
  const subtitle =
    section.title && titleCaseMinor(section.title) !== title ? titleCaseMinor(section.title) : "";

  return (
    <section
      className="route-section"
      style={{
        "--route-tone-bg": tone.bg,
        "--route-tone-border": tone.bd,
        "--route-tone-dot": tone.dot,
      }}
    >
      <button type="button" className="route-section__toggle" onClick={() => setOpen((current) => !current)}>
        <div className="route-section__title-wrap">
          <div className="route-section__indicator" />
          <div>
            <div className="route-section__title-row">
              <h3>{title}</h3>
              <DirectivePill dirKey={section.key} />
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
        <div className="route-section__body">
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

function RegimeNav({ directiveBreakdown }) {
  if (!directiveBreakdown.length) return null;
  return (
    <div className="regime-nav">
      <div className="regime-nav__inner">
        {directiveBreakdown.map(({ key, count }) => {
          const tone = directiveTone(key);
          return (
            <div
              key={key}
              className="regime-chip"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StandardsRoutePanel({ sections, directiveBreakdown }) {
  if (!sections.length) return null;

  return (
    <Panel
      className="panel--standards"
      eyebrow="Primary Output"
      title="Standards route"
      subtitle="Grouped by regime — scan the path without losing item-level detail."
    >
      <RegimeNav directiveBreakdown={directiveBreakdown} />

      <div className="route-stack">
        {sections.map((section) => (
          <RouteSection key={section.key || section.title} section={section} />
        ))}
      </div>
    </Panel>
  );
}

function CopyResultsButton({ result, description, routeSections, legislationGroups }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = buildClipboardSummary({
      result,
      description,
      routeSections,
      legislationGroups,
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch (_) {
      setCopied(false);
    }
  }, [description, legislationGroups, result, routeSections]);

  return (
    <button type="button" className="button button--secondary button--full" onClick={handleCopy}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Copied" : "Copy analysis summary"}
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
      icon: <Waypoints size={16} />,
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

export default function App() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clarifyDirty, setClarifyDirty] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const resultsRef = useRef(null);

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

  const templates = useMemo(() => {
    const dynamic = buildDynamicTemplates(metadata?.products || []);
    return dynamic.length ? dynamic : DEFAULT_TEMPLATES;
  }, [metadata]);

  const routeSections      = useMemo(() => buildRouteSections(result),          [result]);
  const guidanceItems      = useMemo(() => buildGuidanceItems(result),           [result]);
  const legislationItems   = useMemo(() => buildCompactLegislationItems(result), [result]);
  const legislationGroups  = useMemo(() => buildLegislationGroups(result),       [result]);
  const directiveBreakdown = useMemo(() => buildDirectiveBreakdown(routeSections), [routeSections]);

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
        throw new Error(data?.detail || `Analysis failed (${response.status})`);
      }

      setResult(data);
      setClarifyDirty(false);
    } catch (requestError) {
      setError(requestError?.message || "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }, [description]);

  const resetAnalysis = useCallback(() => {
    setResult(null);
    setDescription("");
    setError("");
    setClarifyDirty(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="app-shell">
      <TopBar result={result} totalStandards={totalStandards} onReset={resetAnalysis} />

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

        {!result && <EmptyState />}

        {error ? <ErrorBanner message={error} /> : null}

        <div ref={resultsRef} />

        {result ? (
          <div className="workspace-grid">
            <div className="workspace-main">
              <OverviewPanel
                result={result}
                routeSections={routeSections}
                legislationItems={legislationItems}
                directiveBreakdown={directiveBreakdown}
              />

              <StandardsRoutePanel sections={routeSections} directiveBreakdown={directiveBreakdown} />

              <ClarificationsPanel
                items={guidanceItems}
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
            />
          </div>
        ) : null}
      </main>

      <ScrollTopButton visible={scrolled} />
    </div>
  );
}