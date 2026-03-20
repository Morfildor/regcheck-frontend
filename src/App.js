import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ANALYZE_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";
const METADATA_URL = ANALYZE_URL.replace(/\/analyze$/, "/metadata/options");

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:          "#0c0e18",
  bgPanel:     "#13151f",
  bgCard:      "#1a1d2c",
  bgCardInner: "#20243a",
  bgCardDeep:  "#161928",
  line:        "rgba(255,255,255,0.07)",
  lineStrong:  "rgba(255,255,255,0.12)",
  lineFocus:   "rgba(99,172,255,0.48)",
  text:        "#eef0f8",
  textSub:     "#b4bbd4",
  textMuted:   "#6a729a",
  textLabel:   "#8892b8",
  blue:        "#63acff",
  teal:        "#38c9b0",
  violet:      "#9b87f5",
  rose:        "#f87171",
  amber:       "#fbbf24",
  green:       "#4ade80",
  shadow:      "0 4px 28px rgba(0,0,0,0.5)",
  shadowLg:    "0 8px 48px rgba(0,0,0,0.6)",
};

// ─── Directive metadata ──────────────────────────────────────────────────────
const DIR_SHORT = {
  LVD:"LVD", EMC:"EMC", RED:"RED", RED_CYBER:"RED Cyber", CRA:"CRA",
  ROHS:"RoHS", REACH:"REACH", GDPR:"GDPR", AI_Act:"AI Act", ESPR:"ESPR",
  ECO:"Ecodesign", BATTERY:"Battery", FCM:"FCM", FCM_PLASTIC:"FCM Plastic",
  MD:"MD", MACH_REG:"Machinery Reg.", OTHER:"Other",
};

const DIR_LABEL = {
  LVD:"Low Voltage Directive", EMC:"EMC Directive", RED:"Radio Equipment Directive",
  RED_CYBER:"RED delegated cybersecurity route", CRA:"Cyber Resilience Act",
  ROHS:"RoHS Directive", REACH:"REACH Regulation", GDPR:"GDPR", AI_Act:"AI Act",
  ESPR:"ESPR", ECO:"Ecodesign", BATTERY:"Battery Regulation",
  FCM:"Food Contact Materials", FCM_PLASTIC:"Plastic FCM",
  MD:"Machinery Directive", MACH_REG:"Machinery Regulation", OTHER:"Other",
};

const DIR_ORDER = [
  "LVD","EMC","RED","RED_CYBER","ROHS","REACH","GDPR","FCM","FCM_PLASTIC",
  "BATTERY","ECO","ESPR","CRA","AI_Act","MD","MACH_REG","OTHER",
];

const DIR_TONES = {
  LVD:        {dot:"#6ee7b7",bg:"rgba(110,231,183,0.09)",bd:"rgba(110,231,183,0.20)",text:"#6ee7b7"},
  EMC:        {dot:"#67e8f9",bg:"rgba(103,232,249,0.09)",bd:"rgba(103,232,249,0.20)",text:"#67e8f9"},
  RED:        {dot:"#63acff",bg:"rgba(99,172,255,0.09)", bd:"rgba(99,172,255,0.20)", text:"#63acff"},
  RED_CYBER:  {dot:"#c084fc",bg:"rgba(192,132,252,0.09)",bd:"rgba(192,132,252,0.20)",text:"#c084fc"},
  CRA:        {dot:"#86efac",bg:"rgba(134,239,172,0.09)",bd:"rgba(134,239,172,0.20)",text:"#86efac"},
  ROHS:       {dot:"#fcd34d",bg:"rgba(252,211,77,0.09)", bd:"rgba(252,211,77,0.20)", text:"#fcd34d"},
  REACH:      {dot:"#fdba74",bg:"rgba(253,186,116,0.09)",bd:"rgba(253,186,116,0.20)",text:"#fdba74"},
  GDPR:       {dot:"#38c9b0",bg:"rgba(56,201,176,0.09)", bd:"rgba(56,201,176,0.20)", text:"#38c9b0"},
  AI_Act:     {dot:"#a78bfa",bg:"rgba(167,139,250,0.09)",bd:"rgba(167,139,250,0.20)",text:"#a78bfa"},
  ESPR:       {dot:"#fb923c",bg:"rgba(251,146,60,0.09)", bd:"rgba(251,146,60,0.20)", text:"#fb923c"},
  ECO:        {dot:"#4ade80",bg:"rgba(74,222,128,0.09)", bd:"rgba(74,222,128,0.20)", text:"#4ade80"},
  BATTERY:    {dot:"#a3e635",bg:"rgba(163,230,53,0.09)", bd:"rgba(163,230,53,0.20)", text:"#a3e635"},
  FCM:        {dot:"#f9a8d4",bg:"rgba(249,168,212,0.09)",bd:"rgba(249,168,212,0.20)",text:"#f9a8d4"},
  FCM_PLASTIC:{dot:"#f9a8d4",bg:"rgba(249,168,212,0.09)",bd:"rgba(249,168,212,0.20)",text:"#f9a8d4"},
  MD:         {dot:"#93c5fd",bg:"rgba(147,197,253,0.09)",bd:"rgba(147,197,253,0.20)",text:"#93c5fd"},
  MACH_REG:   {dot:"#93c5fd",bg:"rgba(147,197,253,0.09)",bd:"rgba(147,197,253,0.20)",text:"#93c5fd"},
  OTHER:      {dot:"#94a3b8",bg:"rgba(148,163,184,0.07)",bd:"rgba(148,163,184,0.16)",text:"#94a3b8"},
};

const STATUS = {
  LOW:     {bg:"rgba(74,222,128,0.10)", bd:"rgba(74,222,128,0.26)", text:"#4ade80"},
  MEDIUM:  {bg:"rgba(251,191,36,0.10)", bd:"rgba(251,191,36,0.26)", text:"#fbbf24"},
  HIGH:    {bg:"rgba(251,113,133,0.10)",bd:"rgba(251,113,133,0.26)",text:"#fb7185"},
  CRITICAL:{bg:"rgba(248,113,113,0.14)",bd:"rgba(248,113,113,0.30)",text:"#f87171"},
};

const IMPORTANCE = {
  high:  {bg:"rgba(248,113,113,0.09)",bd:"rgba(248,113,113,0.22)",text:"#fb7185",dot:"#fb7185"},
  medium:{bg:"rgba(251,191,36,0.09)", bd:"rgba(251,191,36,0.22)", text:"#fbbf24",dot:"#fbbf24"},
  low:   {bg:"rgba(74,222,128,0.07)", bd:"rgba(74,222,128,0.20)", text:"#4ade80",dot:"#4ade80"},
};

const SECTION_TONES = {
  harmonized:      {bg:"rgba(99,172,255,0.06)", bd:"rgba(99,172,255,0.15)", tag:"rgba(99,172,255,0.13)", tagText:"#63acff", icon:"⬡"},
  state_of_the_art:{bg:"rgba(251,146,60,0.06)", bd:"rgba(251,146,60,0.15)", tag:"rgba(251,146,60,0.13)", tagText:"#fb923c", icon:"◈"},
  review:          {bg:"rgba(248,113,133,0.06)",bd:"rgba(248,113,133,0.15)",tag:"rgba(248,113,133,0.13)",tagText:"#fb7185",icon:"◉"},
  unknown:         {bg:"rgba(148,163,184,0.04)",bd:"rgba(148,163,184,0.12)",tag:"rgba(148,163,184,0.10)",tagText:"#94a3b8",icon:"○"},
};

const DEFAULT_TEMPLATES = [
  {label:"Coffee machine", text:"Connected espresso machine with mains power, Wi-Fi radio, app control, OTA updates, cloud account, grinder, pressure, water tank, and food-contact brew path."},
  {label:"Electric kettle", text:"Electric kettle with mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi radio control."},
  {label:"Air purifier",   text:"Smart air purifier with mains power, motorized fan, electronic controls, Wi-Fi radio, app control, networked standby, and OTA firmware updates."},
  {label:"Robot vacuum",   text:"Robot vacuum cleaner with rechargeable lithium battery, Wi-Fi and Bluetooth radio, cloud account, OTA firmware updates, LiDAR navigation, and camera."},
];

// ─── Utility functions ───────────────────────────────────────────────────────
function titleCase(input) {
  return String(input||"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim().replace(/\b\w/g,m=>m.toUpperCase());
}
function directiveTone(key) { return DIR_TONES[key]||DIR_TONES.OTHER; }
function directiveShort(key) { return DIR_SHORT[key]||titleCase(key); }
function directiveLabel(key) { return DIR_LABEL[key]||titleCase(key); }
function directiveRank(key) { const r=DIR_ORDER.indexOf(key||"OTHER"); return r===-1?999:r; }
function normalizeStandardDirective(item) {
  const code=String(item?.code||"").toUpperCase();
  if(code.startsWith("EN 18031-")) return "RED_CYBER";
  return item?.directive||item?.legislation_key||"OTHER";
}
function joinText(base,addition) {
  const a=String(base||"").trim(),b=String(addition||"").trim();
  if(!b) return a; if(!a) return b;
  if(a.toLowerCase().includes(b.toLowerCase())) return a;
  const sep=/[\s,;:]$/.test(a)?" ":a.endsWith(".")?" ":", ";
  return `${a}${sep}${b}`;
}
function uniqueBy(items,getKey) {
  const map=new Map();
  (items||[]).forEach(item=>{ const k=getKey(item); if(!map.has(k)) map.set(k,item); });
  return Array.from(map.values());
}
function prettyValue(value) {
  if(value===null||value===undefined||value==="") return "—";
  if(Array.isArray(value)) return value.join(", ");
  return String(value);
}
function standardCardTags(item) {
  return uniqueBy([
    ...(item.display_tags||[]),
    item.category ? titleCase(item.category) : null,
    item.standard_family||null,
  ].filter(Boolean),(v)=>v).slice(0,5);
}

function buildDynamicTemplates(products) {
  const lookup=new Map((products||[]).map(p=>[p.id,p]));
  const templates=[];
  function addT(productId,suffix,label) {
    const p=lookup.get(productId); if(!p) return;
    templates.push({label,text:`${p.label} with ${suffix}.`});
  }
  addT("coffee_machine","mains power, heating, water tank, grinder, food-contact brew path, Wi-Fi radio, app control, cloud account, and OTA updates","Coffee machine");
  addT("electric_kettle","mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi radio control","Electric kettle");
  addT("air_purifier","mains power, motorized fan, sensor electronics, Wi-Fi radio, app control, and OTA updates","Air purifier");
  addT("robot_vacuum","rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, camera, and LiDAR navigation","Robot vacuum");
  addT("robot_vacuum_cleaner","rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, camera, and LiDAR navigation","Robot vacuum");
  return uniqueBy(templates.length?templates:DEFAULT_TEMPLATES,item=>item.label).slice(0,4);
}

function buildGuidedChips(metadata,result) {
  const productId=result?.product_type;
  const product=(metadata?.products||[]).find(item=>item.id===productId);
  const traits=new Set(result?.all_traits||[]);
  const missingItems=result?.missing_information_items||[];
  const chips=[];
  const push=(label,text)=>{ if(!label||!text) return; if(!chips.some(c=>c.text===text)) chips.push({label,text}); };
  missingItems.forEach(item=>(item.examples||[]).slice(0,2).forEach(ex=>push(titleCase(item.key),ex)));
  if(product?.implied_traits?.includes("food_contact")||traits.has("food_contact")) {
    push("Food contact","food-contact plastics, coatings, silicone, rubber, and metal parts");
    push("Water path","wetted path materials, seals, and water tank");
  }
  if(product?.implied_traits?.includes("motorized")||traits.has("motorized")) {
    push("Motor","motorized function");
    push("Pump","pump or fluid transfer function");
  }
  if(traits.has("radio")) { push("Wi-Fi","Wi-Fi radio"); push("Bluetooth","Bluetooth LE radio"); push("OTA","OTA firmware updates"); }
  if(!traits.has("radio")&&(traits.has("app_control")||traits.has("cloud")||traits.has("ota"))) {
    push("Wi-Fi","Wi-Fi radio"); push("Bluetooth","Bluetooth LE radio");
  }
  if(traits.has("cloud")||traits.has("app_control")||traits.has("internet")) {
    push("Cloud","cloud account required");
    push("Local control","local LAN control without cloud dependency");
    push("Patching","security and firmware patching over the air");
  }
  if(traits.has("battery_powered")) push("Battery","rechargeable lithium battery");
  if(traits.has("camera")) push("Camera","integrated camera");
  if(traits.has("microphone")) push("Microphone","microphone or voice input");
  if(!chips.length) {
    push("Mains","230 V mains powered"); push("Consumer","consumer household use");
    push("App control","mobile app control"); push("Wi-Fi","Wi-Fi radio");
    push("Food contact","food-contact plastics or coatings");
  }
  return chips.slice(0,10);
}

function buildGuidanceItems(result) {
  const traits=new Set(result?.all_traits||[]);
  const rawItems=result?.input_gaps_panel?.items||result?.missing_information_items||[];
  const items=[],seen=new Set();
  const add=(key,title,why,importance,choices=[])=>{
    if(seen.has(key)) return; seen.add(key);
    items.push({key,title,why,importance,choices:choices.filter(Boolean).slice(0,3)});
  };
  if(traits.has("radio"))
    add("radio_stack","Confirm radios","Changes RED and RF scope.","high",["Wi-Fi radio","Bluetooth LE radio","NFC radio"]);
  if(traits.has("cloud")||traits.has("internet")||traits.has("app_control")||traits.has("ota"))
    add("connected_architecture","Confirm connected design","Changes EN 18031 and cybersecurity route.","high",["cloud account required","local LAN control without cloud dependency","OTA firmware updates"]);
  if(traits.has("food_contact"))
    add("food_contact","Confirm wetted materials","Changes food-contact obligations.","medium",["food-contact plastics","silicone seal","metal wetted path"]);
  if(traits.has("battery_powered"))
    add("battery","Confirm battery setup","Changes Battery Regulation scope.","medium",["rechargeable lithium battery","replaceable battery","battery supplied with the product"]);
  if(traits.has("camera")||traits.has("microphone")||traits.has("personal_data_likely"))
    add("data_functions","Confirm sensitive functions","Changes cybersecurity/privacy expectations.","high",["integrated camera","microphone or voice input","user account and profile data"]);
  rawItems.forEach(item=>add(item.key,titleCase(item.key),item.message,item.importance||"medium",item.examples||[]));
  return items.slice(0,4);
}

function buildCompactLegislationItems(result) {
  const sections=result?.legislation_sections||[];
  const allItems=sections.flatMap(s=>(s.items||[]).map(item=>({...item,section_key:s.key,section_title:s.title})));
  return uniqueBy(
    [...allItems].sort((a,b)=>directiveRank(a.directive_key)-directiveRank(b.directive_key)||String(a.code).localeCompare(String(b.code))),
    item=>`${item.code}-${item.directive_key}`
  );
}

function compactLegislationGroupLabel(item) {
  const k=item.section_key;
  if(k==="framework") return "Additional";
  if(k==="non_ce") return "Parallel";
  if(k==="future") return "Future";
  if(k==="ce") return "CE";
  return titleCase(k);
}

function sortStandardItems(items) {
  return [...(items||[])].sort((a,b)=>{
    const aD=normalizeStandardDirective(a),bD=normalizeStandardDirective(b);
    return directiveRank(aD)-directiveRank(bD)||String(a.code||"").localeCompare(String(b.code||""));
  });
}

function buildSectionsFromFlatResult(result) {
  const standardRows=(result?.standards||[]).map(item=>({...item,item_type:item.item_type||"standard"}));
  const reviewRows=(result?.review_items||[]).map(item=>({...item,item_type:"review"}));
  const grouped={};
  [...standardRows,...reviewRows].forEach(item=>{
    let key=item.harmonization_status||(item.item_type==="review"?"review":"unknown");
    if(!["harmonized","state_of_the_art","review","unknown"].includes(key)) key="unknown";
    if(!grouped[key]) grouped[key]={key,title:
      key==="harmonized"?"Harmonized standards":
      key==="state_of_the_art"?"State of the art / latest technical route":
      key==="review"?"Review-required routes":"Other standards",
      count:0,items:[]};
    grouped[key].items.push(item);
  });
  return ["harmonized","state_of_the_art","review","unknown"]
    .filter(k=>grouped[k])
    .map(key=>({...grouped[key],items:sortStandardItems(grouped[key].items),count:grouped[key].items.length}));
}

function buildDirectiveBreakdown(result) {
  const sections=result?.standard_sections?.length?result.standard_sections:buildSectionsFromFlatResult(result);
  const counts={};
  sections.forEach(s=>(s.items||[]).forEach(item=>{ const dir=normalizeStandardDirective(item); counts[dir]=(counts[dir]||0)+1; }));
  return Object.entries(counts).sort((a,b)=>directiveRank(a[0])-directiveRank(b[0])).map(([key,count])=>({key,count}));
}

function orderStandardSections(sections) {
  return [...(sections||[])].sort((a,b)=>directiveRank(a.key)-directiveRank(b.key));
}

function buildCopyText(result,description) {
  const sections=result?.standard_sections?.length?result.standard_sections:buildSectionsFromFlatResult(result);
  const lines=[
    "RuleGrid compliance analysis","",
    `Input: ${description||result?.product_summary||"—"}`,
    `Detected product: ${titleCase(result?.product_type||"unclear")}`,
    `Confidence: ${titleCase(result?.product_match_confidence||"low")}`,
    `Overall risk: ${result?.overall_risk||"—"}`,
    `Summary: ${result?.summary||""}`,
    "","Standards route:",
    ...sections.flatMap(s=>[
      `\n${s.title} (${s.count})`,
      ...sortStandardItems(s.items||[]).map(item=>`  • ${item.code} — ${item.title}`),
    ]),
    "","Applicable legislation:",
    ...buildCompactLegislationItems(result).map(item=>`- ${item.code} — ${item.title}`),
    "","Current path:",
    ...(result?.current_path||[]).map(l=>`- ${l}`),
    "","Future watchlist:",
    ...(result?.future_watchlist||[]).map(l=>`- ${l}`),
  ];
  return lines.join("\n");
}

// ─── Primitive components ────────────────────────────────────────────────────
function DirPill({dirKey,large=false}) {
  const tone=directiveTone(dirKey);
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:6,borderRadius:6,
      border:`1px solid ${tone.bd}`,background:tone.bg,color:tone.text,
      padding:large?"5px 12px":"3px 9px",fontSize:large?12:11,fontWeight:700,
      whiteSpace:"nowrap",letterSpacing:"0.03em",
    }}>
      <span style={{width:6,height:6,borderRadius:999,background:tone.dot,flexShrink:0}}/>
      {directiveShort(dirKey)}
    </span>
  );
}

function RiskBadge({value}) {
  const tone=STATUS[value]||STATUS.MEDIUM;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:7,borderRadius:6,
      border:`1px solid ${tone.bd}`,background:tone.bg,color:tone.text,
      padding:"4px 12px",fontSize:11,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",
    }}>
      <span style={{width:5,height:5,borderRadius:999,background:tone.text}}/>
      {value} Risk
    </span>
  );
}

function Chip({children,tone="neutral"}) {
  const s=tone==="neutral"
    ?{bg:"rgba(255,255,255,0.06)",bd:T.lineStrong,text:T.textSub}
    :tone==="blue"
    ?{bg:"rgba(99,172,255,0.11)",bd:"rgba(99,172,255,0.22)",text:T.blue}
    :{bg:"rgba(56,201,176,0.09)",bd:"rgba(56,201,176,0.20)",text:T.teal};
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",borderRadius:6,
      border:`1px solid ${s.bd}`,background:s.bg,color:s.text,
      padding:"3px 9px",fontSize:11,fontWeight:600,
    }}>{children}</span>
  );
}

function Card({children,style}) {
  return (
    <div style={{
      borderRadius:18,border:`1px solid ${T.lineStrong}`,
      background:T.bgCard,boxShadow:T.shadow,overflow:"hidden",...style,
    }}>{children}</div>
  );
}

function CardHeader({title,subtitle,right}) {
  return (
    <div style={{
      padding:"15px 20px 12px",borderBottom:`1px solid ${T.line}`,
      background:T.bgCardDeep,
      display:"flex",gap:14,alignItems:"flex-start",justifyContent:"space-between",
    }}>
      <div style={{minWidth:0}}>
        {title&&<div style={{fontSize:14,fontWeight:700,color:T.text,letterSpacing:"-0.01em"}}>{title}</div>}
        {subtitle&&<div style={{marginTop:4,fontSize:12,color:T.textMuted,lineHeight:1.5}}>{subtitle}</div>}
      </div>
      {right&&<div style={{flexShrink:0,marginTop:1}}>{right}</div>}
    </div>
  );
}

function SoftBox({children,style}) {
  return (
    <div style={{
      borderRadius:10,border:`1px solid rgba(255,255,255,0.09)`,
      background:"rgba(255,255,255,0.06)",padding:"11px 13px",...style,
    }}>{children}</div>
  );
}

function Label({children}) {
  return (
    <div style={{
      fontSize:10,fontWeight:700,color:T.textLabel,
      textTransform:"uppercase",letterSpacing:"0.10em",marginBottom:5,
    }}>{children}</div>
  );
}

function Value({children}) {
  return <div style={{fontSize:13,color:T.textSub,lineHeight:1.6}}>{children}</div>;
}

// ─── Buttons ─────────────────────────────────────────────────────────────────
function PrimaryBtn({onClick,disabled,children}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      appearance:"none",cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?0.38:1,borderRadius:10,border:"none",
      background:disabled?"rgba(99,172,255,0.20)":`linear-gradient(135deg,${T.blue},${T.teal})`,
      color:"#030a14",padding:"10px 22px",fontWeight:700,fontSize:13,
      boxShadow:disabled?"none":"0 0 32px rgba(99,172,255,0.26)",
      transition:"all 0.18s",letterSpacing:"0.01em",whiteSpace:"nowrap",
    }}>{children}</button>
  );
}

function SecondaryBtn({onClick,disabled,children,style}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      appearance:"none",cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?0.4:1,borderRadius:10,
      border:`1px solid ${T.lineStrong}`,background:"rgba(255,255,255,0.04)",
      color:T.textSub,padding:"9px 18px",fontWeight:600,fontSize:13,
      transition:"all 0.18s",...style,
    }}>{children}</button>
  );
}

function GhostBtn({onClick,children}) {
  return (
    <button onClick={onClick} style={{
      appearance:"none",cursor:"pointer",borderRadius:8,
      border:`1px solid ${T.line}`,background:"transparent",
      color:T.textMuted,padding:"5px 12px",fontWeight:600,fontSize:12,
      transition:"all 0.18s",
    }}>{children}</button>
  );
}

function TemplateBtn({onClick,children}) {
  return (
    <button onClick={onClick} style={{
      appearance:"none",cursor:"pointer",borderRadius:8,
      border:`1px solid rgba(99,172,255,0.20)`,background:"rgba(99,172,255,0.07)",
      color:T.blue,padding:"6px 14px",fontSize:12,fontWeight:600,
      transition:"all 0.15s",
    }}>{children}</button>
  );
}

function AddChipBtn({onClick,children}) {
  return (
    <button onClick={onClick} style={{
      appearance:"none",cursor:"pointer",borderRadius:8,
      border:`1px solid ${T.lineStrong}`,background:"rgba(255,255,255,0.04)",
      color:T.textSub,padding:"5px 11px",fontWeight:600,fontSize:12,
      transition:"background 0.15s,color 0.15s",
    }}>{children}</button>
  );
}

function CharCounter({value,max=1200}) {
  const len=value.length,pct=Math.min(len/max,1);
  const color=pct>0.9?T.rose:pct>0.7?T.amber:T.textMuted;
  return <span style={{fontSize:11,color,fontWeight:500,fontVariantNumeric:"tabular-nums"}}>{len} / {max}</span>;
}

// ─── Topbar ──────────────────────────────────────────────────────────────────
function Topbar({result}) {
  const totalStandards=result?(
    result?.standard_sections?.length
      ?result.standard_sections.reduce((n,s)=>n+(s.items||[]).length,0)
      :(result?.standards||[]).length+(result?.review_items||[]).length
  ):null;

  return (
    <div style={{
      borderBottom:`1px solid ${T.line}`,
      background:`${T.bgPanel}e8`,backdropFilter:"blur(20px)",
      padding:"0 24px",display:"flex",alignItems:"center",gap:12,height:52,
      position:"sticky",top:0,zIndex:100,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{
          width:28,height:28,borderRadius:8,
          background:`linear-gradient(135deg,${T.blue},${T.teal})`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:13,fontWeight:900,color:"#030a14",
        }}>⬡</div>
        <span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:18,color:T.text,letterSpacing:"-0.01em"}}>
          RuleGrid
        </span>
      </div>
      <div style={{width:1,height:20,background:T.line,margin:"0 2px"}}/>
      <span style={{fontSize:11,color:T.textMuted,fontWeight:500}}>EU Regulatory Scoping</span>
      {result&&(
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
          <RiskBadge value={result?.overall_risk||"MEDIUM"}/>
          {totalStandards!==null&&(
            <span style={{
              fontSize:11,color:T.textMuted,fontWeight:600,
              background:"rgba(255,255,255,0.04)",border:`1px solid ${T.line}`,
              borderRadius:6,padding:"3px 9px",
            }}>
              {totalStandards} standard{totalStandards!==1?"s":""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({result}) {
  const hero=result?.hero_summary||{};
  const stats=hero.stats||[];
  const primaryRegimes=uniqueBy(hero.primary_regimes||[],k=>k);
  const showMeta=Boolean(result);

  return (
    <div style={{
      borderRadius:20,border:`1px solid ${T.lineStrong}`,
      background:"linear-gradient(145deg,#1b1f33,#161929 55%,#1c2036)",
      boxShadow:`${T.shadowLg},0 0 80px rgba(99,172,255,0.05)`,
      padding:"32px 28px",position:"relative",overflow:"hidden",
    }}>
      {/* Subtle grid overlay */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`,backgroundSize:"40px 40px"}}/>
      {/* Glow */}
      <div style={{position:"absolute",top:-80,left:"50%",transform:"translateX(-50%)",width:500,height:220,background:"radial-gradient(ellipse,rgba(99,172,255,0.08),transparent 70%)",pointerEvents:"none"}}/>

      <div style={{position:"relative",display:"grid",gap:18,justifyItems:"center",textAlign:"center"}}>
        {showMeta&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            <RiskBadge value={result?.overall_risk||"MEDIUM"}/>
            <Chip tone="blue">{titleCase(hero.confidence||result?.product_match_confidence||"low")} Confidence</Chip>
          </div>
        )}

        <div>
          <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:"clamp(24px,4vw,38px)",fontWeight:400,color:T.text,lineHeight:1.08,letterSpacing:"-0.02em",marginBottom:12}}>
            {hero.title||"RuleGrid Regulatory Scoping"}
          </div>
          <div style={{fontSize:14,color:T.textSub,lineHeight:1.78,maxWidth:600,margin:"0 auto"}}>
            {hero.subtitle||"Describe the product clearly to generate the standards route and the applicable legislation path."}
          </div>
        </div>

        {showMeta&&primaryRegimes.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            {primaryRegimes.map(dirKey=><DirPill key={dirKey} dirKey={dirKey} large/>)}
          </div>
        )}

        {showMeta&&result?.summary&&(
          <div style={{
            maxWidth:700,padding:"13px 18px",borderRadius:12,
            background:"rgba(99,172,255,0.06)",border:`1px solid rgba(99,172,255,0.14)`,
            fontSize:13,color:T.textSub,lineHeight:1.72,textAlign:"left",
          }}>{result.summary}</div>
        )}

        {/* Stats grid — from App.js */}
        {showMeta&&!!stats.length&&(
          <div className="hero-stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10,width:"100%",maxWidth:700}}>
            {stats.map(item=>(
              <div key={item.label} style={{
                borderRadius:14,border:`1px solid ${T.line}`,
                background:"rgba(255,255,255,0.04)",padding:"14px 12px",textAlign:"center",
              }}>
                <div style={{fontSize:10,fontWeight:800,color:T.textLabel,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
                  {item.label}
                </div>
                <div style={{fontSize:26,fontWeight:900,color:T.text}}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar rail ─────────────────────────────────────────────────────────────
function SidebarRail({result}) {
  if(!result) return null;
  const items=buildCompactLegislationItems(result);
  const confidence=result?.confidence_panel?.confidence||result?.product_match_confidence||"low";

  return (
    <aside className="left-rail" style={{display:"grid",gap:12,position:"sticky",top:68,alignSelf:"start"}}>
      <Card>
        <CardHeader title="Applicable legislation" subtitle="All detected obligations"/>
        <div style={{padding:"12px 14px",display:"grid",gap:7}}>
          {items.map(item=>{
            const tone=directiveTone(item.directive_key||"OTHER");
            return (
              <div key={`${item.code}-${item.directive_key}-${item.section_key}`}
                style={{borderRadius:10,border:`1px solid ${tone.bd}`,background:tone.bg,padding:"9px 11px",display:"grid",gap:4}}>
                <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{width:6,height:6,borderRadius:999,background:tone.dot,flexShrink:0}}/>
                  <span style={{fontSize:12,fontWeight:700,color:tone.text}}>{item.code}</span>
                  <span style={{fontSize:9,opacity:0.75,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:tone.text}}>
                    {compactLegislationGroupLabel(item)}
                  </span>
                </div>
                <div style={{fontSize:11,lineHeight:1.45,color:T.textSub,fontWeight:500}}>{item.title}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Detection" subtitle="Product identification"/>
        <div style={{padding:"12px 14px",display:"grid",gap:8}}>
          <SoftBox>
            <Label>Detected product</Label>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>{titleCase(result?.product_type||"Unclear")}</div>
          </SoftBox>
          <SoftBox>
            <Label>Confidence</Label>
            <Chip tone="blue">{titleCase(confidence)}</Chip>
          </SoftBox>
          {result?.overall_risk&&(
            <SoftBox>
              <Label>Overall risk</Label>
              <RiskBadge value={result.overall_risk}/>
            </SoftBox>
          )}
          {!!result?.contradictions?.length&&(
            <SoftBox>
              <Label>Contradictions</Label>
              <Value>{result.contradictions[0]}</Value>
            </SoftBox>
          )}
        </div>
      </Card>
    </aside>
  );
}

// ─── Input composer ───────────────────────────────────────────────────────────
function InputComposer({description,setDescription,templates,chips,onAnalyze,busy,onDirty}) {
  const [focused,setFocused]=useState(false);
  const charMax=1200;
  const wordCount=description.trim()?description.trim().split(/\s+/).length:0;

  return (
    <Card>
      <CardHeader
        title="Product description"
        subtitle="Product type · connectivity · power source · key functions · sensors · materials · battery"
      />
      <div style={{padding:"16px 18px",display:"grid",gap:14}}>
        {/* Quick-fill templates */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:T.textLabel,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Quick fill</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {templates.slice(0,4).map(t=>(
              <TemplateBtn key={t.label} onClick={()=>{ setDescription(t.text); onDirty(false); }}>{t.label}</TemplateBtn>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div style={{position:"relative"}}>
          <textarea
            value={description}
            onChange={e=>{ setDescription(e.target.value); onDirty(false); }}
            onFocus={()=>setFocused(true)}
            onBlur={()=>setFocused(false)}
            placeholder="Example: Connected espresso machine with Wi-Fi radio, OTA updates, cloud account, mains power, grinder, pressure system, and food-contact brew path."
            rows={7}
            maxLength={charMax}
            style={{
              width:"100%",borderRadius:12,resize:"vertical",minHeight:160,lineHeight:1.75,
              border:`1px solid ${focused?T.lineFocus:T.lineStrong}`,
              background:"rgba(0,0,0,0.28)",padding:"13px 15px 34px",
              color:T.text,outline:"none",fontSize:14,
              boxShadow:focused?"0 0 0 3px rgba(99,172,255,0.08)":"none",
              transition:"border-color 0.2s,box-shadow 0.2s",boxSizing:"border-box",
            }}
          />
          <div style={{position:"absolute",bottom:10,right:12,pointerEvents:"none"}}>
            <CharCounter value={description} max={charMax}/>
          </div>
        </div>

        {/* Add-detail chips */}
        {chips.length>0&&(
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.textLabel,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Add detail</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {chips.map(chip=>(
                <AddChipBtn key={chip.label+chip.text} onClick={()=>{ setDescription(cur=>joinText(cur,chip.text)); onDirty(true); }}>
                  + {chip.label}
                </AddChipBtn>
              ))}
            </div>
          </div>
        )}

        {/* Action row */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <PrimaryBtn onClick={onAnalyze} disabled={busy||!description.trim()}>
              {busy?(
                <span style={{display:"flex",alignItems:"center",gap:8}}>
                  <span className="spin" style={{display:"inline-block",width:12,height:12,border:"2px solid rgba(3,10,20,0.3)",borderTopColor:"#030a14",borderRadius:999}}/>
                  Analyzing…
                </span>
              ):"Analyze product"}
            </PrimaryBtn>
            <SecondaryBtn onClick={()=>{ setDescription(""); onDirty(false); }} disabled={!description.trim()}>Clear</SecondaryBtn>
          </div>
          {wordCount>0&&!busy&&(
            <span style={{fontSize:11,color:T.textMuted,fontStyle:"italic"}}>{wordCount} word{wordCount!==1?"s":""}</span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Guidance strip ───────────────────────────────────────────────────────────
function GuidanceStrip({result,dirty,busy,onReanalyze,onApply}) {
  const items=buildGuidanceItems(result);
  if(!items.length) return null;

  return (
    <Card>
      <CardHeader
        title="Refinement guidance"
        subtitle="Clarifications that can materially change the standards route."
        right={<PrimaryBtn onClick={onReanalyze} disabled={!dirty||busy}>{busy?"Analyzing…":dirty?"Refresh route →":"Route current"}</PrimaryBtn>}
      />
      <div style={{padding:"14px 16px",display:"grid",gap:10}}>
        <div className="guidance-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:10}}>
          {items.map(item=>{
            const tone=IMPORTANCE[item.importance]||IMPORTANCE.medium;
            return (
              <div key={item.key} style={{borderRadius:12,border:`1px solid ${tone.bd}`,background:tone.bg,padding:"12px 13px",display:"grid",gap:8}}>
                <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontSize:12,fontWeight:700,color:tone.text}}>{item.title}</div>
                  <span style={{width:6,height:6,borderRadius:999,background:tone.dot,flexShrink:0}}/>
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.52)",lineHeight:1.5}}>{item.why}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {item.choices.map(choice=>(
                    <button key={choice} onClick={()=>onApply(choice)} style={{
                      appearance:"none",cursor:"pointer",borderRadius:6,
                      border:`1px solid ${tone.bd}`,background:"rgba(0,0,0,0.2)",
                      color:tone.text,padding:"4px 9px",fontSize:11,fontWeight:600,
                    }}>+ {choice}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {dirty&&(
          <div style={{fontSize:12,color:T.amber,fontWeight:600,display:"flex",alignItems:"center",gap:7,paddingTop:2}}>
            <span style={{width:5,height:5,borderRadius:999,background:T.amber,display:"inline-block"}}/>
            Input updated — refresh route to apply changes.
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Route snapshot (breakdown by directive) ──────────────────────────────────
function StandardsOverview({result}) {
  const breakdown=buildDirectiveBreakdown(result);
  // Also show current path and watchlist (from App.js)
  const path=result?.current_path||[];
  const watchlist=result?.future_watchlist||[];
  const questions=(result?.suggested_questions||[]).slice(0,6);
  if(!breakdown.length) return null;
  const total=breakdown.reduce((n,{count})=>n+count,0);

  return (
    <div style={{display:"grid",gap:14}}>
      {/* Directive tile breakdown */}
      <Card>
        <CardHeader title="Route snapshot" subtitle={`${total} standard${total!==1?"s":""} across ${breakdown.length} directive${breakdown.length!==1?"s":""}.`}/>
        <div style={{padding:"14px 16px"}}>
          <div className="snapshot-grid" style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:8}}>
            {breakdown.map(({key,count})=>{
              const tone=directiveTone(key);
              const barPct=Math.max(10,Math.round((count/total)*100));
              return (
                <div key={key} style={{borderRadius:12,border:`1px solid ${tone.bd}`,background:tone.bg,padding:"12px 10px",display:"grid",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:6,height:6,borderRadius:999,background:tone.dot}}/>
                    <div style={{fontSize:11,fontWeight:700,color:tone.text}}>{directiveShort(key)}</div>
                  </div>
                  <div style={{fontSize:26,lineHeight:1,fontWeight:800,color:T.text}}>{count}</div>
                  <div style={{height:3,borderRadius:999,background:"rgba(255,255,255,0.07)",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${barPct}%`,borderRadius:999,background:tone.dot,transition:"width 0.6s ease"}}/>
                  </div>
                  <div style={{fontSize:10,color:T.textMuted,letterSpacing:"0.04em"}}>standard{count!==1?"s":""}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Three-column summary strip — current path, input focus, watchlist */}
      <div className="tri-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14}}>
        <Card>
          <CardHeader title="Current path" subtitle="Immediate compliance route"/>
          <div style={{padding:"14px 16px",display:"grid",gap:8}}>
            {path.length ? path.map((line,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"8px minmax(0,1fr)",gap:10,alignItems:"start",fontSize:13,color:T.textSub,lineHeight:1.55}}>
                <span style={{width:7,height:7,borderRadius:999,background:T.blue,marginTop:5,flexShrink:0,display:"block"}}/>
                <span>{line}</span>
              </div>
            )) : <Value>No current path summary available.</Value>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Input focus" subtitle="Most useful next details"/>
          <div style={{padding:"14px 16px",display:"flex",gap:8,flexWrap:"wrap"}}>
            {questions.length ? questions.map(q=><Chip key={q} tone="blue">{q}</Chip>) : <Value>No suggestions at this time.</Value>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Future watchlist" subtitle="Track separately from current CE"/>
          <div style={{padding:"14px 16px",display:"grid",gap:8}}>
            {watchlist.length ? watchlist.map((line,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"8px minmax(0,1fr)",gap:10,alignItems:"start",fontSize:13,color:T.textSub,lineHeight:1.55}}>
                <span style={{width:7,height:7,borderRadius:999,background:T.amber,marginTop:5,flexShrink:0,display:"block"}}/>
                <span>{line}</span>
              </div>
            )) : <Value>No future watchlist triggered.</Value>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Standard card ────────────────────────────────────────────────────────────
function StandardCard({item,sectionKey}) {
  const dirKey=normalizeStandardDirective(item);
  const dirTone=directiveTone(dirKey);
  const sectionTone=SECTION_TONES[sectionKey]||SECTION_TONES.unknown;
  const evidenceList=(item.evidence_hint||[]);
  const evidence=evidenceList.join(" · ") || "—";
  const summary=item.standard_summary||item.reason||item.notes||item.title;
  const tags=standardCardTags(item);

  const metaFields=[
    {label:"Harmonized Reference",value:prettyValue(item.harmonized_reference)},
    {label:"Evidence Expected",   value:prettyValue(evidence)},
    {label:"Harmonized Version",  value:prettyValue(item.dated_version)},
    {label:"EU Latest Version",   value:prettyValue(item.version)},
  ];

  return (
    <div style={{
      borderRadius:14,border:`1px solid ${dirTone.bd}`,
      background:"rgba(255,255,255,0.03)",overflow:"hidden",
      boxShadow:"0 2px 14px rgba(0,0,0,0.28)",
    }}>
      {/* Header band */}
      <div style={{
        padding:"13px 15px 11px",
        background:`linear-gradient(135deg,${dirTone.bg},transparent)`,
        borderBottom:`1px solid ${T.line}`,display:"grid",gap:10,
      }}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <DirPill dirKey={dirKey}/>
            <span style={{
              display:"inline-flex",alignItems:"center",borderRadius:6,
              background:sectionTone.tag,border:`1px solid ${sectionTone.bd}`,
              color:sectionTone.tagText,padding:"2px 8px",fontSize:10,fontWeight:700,
              textTransform:"uppercase",letterSpacing:"0.08em",
            }}>{titleCase(item.harmonization_status||"unknown")}</span>
            {item.item_type==="review"&&(
              <span style={{
                display:"inline-flex",alignItems:"center",borderRadius:6,
                background:"rgba(248,113,133,0.10)",border:"1px solid rgba(248,113,133,0.22)",
                color:"#fb7185",padding:"2px 8px",fontSize:10,fontWeight:700,
                textTransform:"uppercase",letterSpacing:"0.08em",
              }}>Review</span>
            )}
          </div>
          <span style={{
            display:"inline-flex",alignItems:"center",borderRadius:8,
            background:dirTone.dot,color:"#030a14",
            padding:"6px 13px",fontSize:13,fontWeight:800,
            letterSpacing:"-0.02em",whiteSpace:"nowrap",flexShrink:0,
          }}>{item.code}</span>
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:T.text,lineHeight:1.35}}>{item.title}</div>
          <div style={{marginTop:5,fontSize:12,color:T.textSub,lineHeight:1.7}}>{summary}</div>
        </div>
      </div>

      {/* Tags row */}
      {!!tags.length&&(
        <div style={{padding:"10px 14px 6px",display:"flex",gap:7,flexWrap:"wrap",borderBottom:`1px solid ${T.line}`}}>
          {tags.map(tag=><Chip key={tag}>{tag}</Chip>)}
        </div>
      )}

      {/* Meta grid */}
      <div className="standard-meta-grid" style={{padding:14,display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
        {metaFields.map(({label,value})=>(
          <SoftBox key={label}><Label>{label}</Label><Value>{value}</Value></SoftBox>
        ))}
      </div>
    </div>
  );
}

// ─── Collapsible section wrapper ──────────────────────────────────────────────
function CollapsibleSection({section,defaultOpen=true}) {
  const [open,setOpen]=useState(defaultOpen);
  const sectionTone=SECTION_TONES[section.key]||SECTION_TONES.unknown;
  const dirKey=section.key;

  return (
    <div style={{borderRadius:14,border:`1px solid ${sectionTone.bd}`,background:`linear-gradient(135deg,${sectionTone.bg},transparent)`,overflow:"hidden"}}>
      <button onClick={()=>setOpen(v=>!v)} style={{
        appearance:"none",cursor:"pointer",width:"100%",
        padding:"12px 15px",borderBottom:open?`1px solid ${sectionTone.bd}`:"none",
        background:"transparent",textAlign:"left",
        display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",
      }}>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>{section.title||directiveLabel(dirKey)}</div>
            <div style={{marginTop:3,fontSize:11,color:T.textMuted}}>{section.count} item{section.count!==1?"s":""}</div>
          </div>
          <DirPill dirKey={dirKey}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{
            display:"inline-flex",alignItems:"center",gap:6,borderRadius:6,
            background:sectionTone.tag,border:`1px solid ${sectionTone.bd}`,
            color:sectionTone.tagText,padding:"3px 10px",fontSize:11,fontWeight:700,
          }}>{sectionTone.icon} {titleCase(section.key)}</span>
          <span style={{
            fontSize:14,color:T.textMuted,display:"inline-block",
            transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s",
          }}>▾</span>
        </div>
      </button>
      {open&&(
        <div style={{padding:14,display:"grid",gap:12}}>
          {(section.items||[]).map(item=>(
            <StandardCard key={`${section.key}-${item.code}-${item.title}`} item={item} sectionKey={section.key}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Standards section ────────────────────────────────────────────────────────
function StandardsSection({result}) {
  // Prefer standard_sections from API; fall back to flat result re-grouping
  const rawSections=result?.standard_sections?.length
    ?orderStandardSections(result.standard_sections).map(s=>({
        ...s,
        items:sortStandardItems(s.items||[]).map(item=>({...item,directive:normalizeStandardDirective(item)})),
      }))
    :buildSectionsFromFlatResult(result);

  // Render in canonical harmonized → state_of_the_art → review → unknown order
  const ordered=["harmonized","state_of_the_art","review","unknown"]
    .map(key=>rawSections.find(s=>s.key===key))
    .filter(Boolean);

  if(!ordered.length) return null;

  return (
    <Card>
      <CardHeader title="Standards route" subtitle="Primary output · ordered LVD → EMC → RED → RED Cyber."/>
      <div style={{padding:"14px 16px",display:"grid",gap:14}}>
        {ordered.map((section,i)=>(
          <CollapsibleSection key={section.key} section={section} defaultOpen={i<2}/>
        ))}
      </div>
    </Card>
  );
}

// ─── Diagnostics panel ────────────────────────────────────────────────────────
function DiagnosticsPanel({result}) {
  const [open,setOpen]=useState(false);
  const diagnostics=result?.diagnostics||[];
  const traits=result?.all_traits||[];
  if(!diagnostics.length&&!traits.length) return null;

  return (
    <Card>
      <CardHeader
        title="Advanced diagnostics"
        subtitle="Trait detection and engine output."
        right={<GhostBtn onClick={()=>setOpen(v=>!v)}>{open?"Hide diagnostics":"Show diagnostics"}</GhostBtn>}
      />
      {open&&(
        <div style={{padding:"12px 16px 16px",display:"grid",gap:12}}>
          {traits.length>0&&(
            <SoftBox>
              <Label>All traits detected</Label>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:8}}>
                {traits.map(trait=><Chip key={trait}>{titleCase(trait)}</Chip>)}
              </div>
            </SoftBox>
          )}
          {diagnostics.length>0&&(
            <SoftBox>
              <Label>Engine diagnostics</Label>
              <div style={{marginTop:8,display:"grid",gap:6}}>
                {diagnostics.slice(0,40).map((line,i)=>(
                  <div key={line+i} style={{fontSize:12,color:T.textSub,lineHeight:1.65,paddingLeft:12,borderLeft:`2px solid ${T.line}`}}>{line}</div>
                ))}
              </div>
            </SoftBox>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Copy results button ──────────────────────────────────────────────────────
function CopyResultsButton({result,description}) {
  const [copied,setCopied]=useState(false);
  const onCopy=useCallback(async()=>{
    try {
      await navigator.clipboard.writeText(buildCopyText(result,description));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),2200);
    } catch(e){ console.error(e); }
  },[result,description]);

  return (
    <SecondaryBtn onClick={onCopy} style={copied?{color:T.green,borderColor:"rgba(74,222,128,0.28)"}:{}}>
      {copied?"✓ Copied to clipboard":"Copy summary"}
    </SecondaryBtn>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  const steps=[
    {icon:"01",label:"Describe the product",text:"Product type, power source, connectivity, key functions."},
    {icon:"02",label:"Add detail",text:"Materials (food-contact), sensors, battery, certifications."},
    {icon:"03",label:"Refine iteratively",text:"Use the guidance strip to clarify traits and refresh the route."},
  ];
  return (
    <Card style={{border:`1px dashed ${T.line}`}}>
      <div style={{padding:"36px 28px",display:"grid",gap:24,justifyItems:"center",textAlign:"center"}}>
        <div style={{
          width:60,height:60,borderRadius:18,
          border:"1px solid rgba(99,172,255,0.18)",background:"rgba(99,172,255,0.06)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,
        }}>⬡</div>
        <div>
          <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:22,color:T.text,marginBottom:8}}>Ready for analysis</div>
          <div style={{fontSize:13,color:T.textSub,lineHeight:1.75,maxWidth:440}}>
            Enter a product description above to generate the standards route and legislation overview.
          </div>
        </div>
        <div style={{display:"grid",gap:10,width:"100%",maxWidth:480,textAlign:"left"}}>
          {steps.map(step=>(
            <div key={step.icon} style={{
              display:"flex",gap:14,alignItems:"flex-start",
              padding:"10px 14px",borderRadius:12,
              background:"rgba(255,255,255,0.025)",border:`1px solid ${T.line}`,
            }}>
              <span style={{
                fontSize:10,fontWeight:800,color:T.blue,letterSpacing:"0.08em",
                background:"rgba(99,172,255,0.09)",border:"1px solid rgba(99,172,255,0.18)",
                borderRadius:6,padding:"3px 7px",flexShrink:0,marginTop:1,
              }}>{step.icon}</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:2}}>{step.label}</div>
                <div style={{fontSize:12,color:T.textSub,lineHeight:1.6}}>{step.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Error card ───────────────────────────────────────────────────────────────
function ErrorCard({message}) {
  return (
    <div style={{
      borderRadius:14,border:"1px solid rgba(248,113,113,0.26)",
      background:"rgba(248,113,113,0.06)",padding:"14px 18px",
      display:"flex",gap:12,alignItems:"flex-start",
    }}>
      <span style={{fontSize:16,flexShrink:0,marginTop:1,color:T.rose}}>⚠</span>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:"#fb7185",marginBottom:4}}>Analysis error</div>
        <div style={{fontSize:13,color:T.textSub,lineHeight:1.6}}>{message}</div>
      </div>
    </div>
  );
}

// ─── Scroll-to-top ────────────────────────────────────────────────────────────
function ScrollTopBtn({visible}) {
  return (
    <button
      onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
      style={{
        position:"fixed",bottom:28,right:28,zIndex:200,
        width:40,height:40,borderRadius:12,
        border:`1px solid ${T.lineStrong}`,background:T.bgCard,
        color:T.textSub,fontSize:16,cursor:"pointer",
        boxShadow:T.shadow,display:"flex",alignItems:"center",justifyContent:"center",
        opacity:visible?1:0,pointerEvents:visible?"auto":"none",
        transition:"opacity 0.3s",
      }}
      title="Back to top"
    >↑</button>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [description,setDescription]=useState("");
  const [result,setResult]=useState(null);
  const [metadata,setMetadata]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [clarifyDirty,setClarifyDirty]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const resultsRef=useRef(null);

  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>400);
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  useEffect(()=>{
    let active=true;
    fetch(METADATA_URL)
      .then(res=>{ if(!res.ok) throw new Error(); return res.json(); })
      .then(data=>{ if(active) setMetadata(data); })
      .catch(()=>{ if(active) setMetadata({traits:[],products:[],legislations:[]}); });
    return()=>{ active=false; };
  },[]);

  const templates=useMemo(()=>{
    const d=buildDynamicTemplates(metadata?.products||[]);
    return d.length?d:DEFAULT_TEMPLATES;
  },[metadata]);

  const chips=useMemo(()=>{
    const backend=(result?.suggested_quick_adds||[]).map(item=>({
      label:titleCase(item.label),text:item.text,
    }));
    const frontend=buildGuidedChips(metadata,result);
    return uniqueBy([...backend,...frontend],item=>item.text).slice(0,12);
  },[metadata,result]);

  useEffect(()=>{
    if(!result||!resultsRef.current) return;
    const timer=window.setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),80);
    return()=>window.clearTimeout(timer);
  },[result]);

  const runAnalysis=useCallback(async()=>{
    const payload=String(description||"").trim();
    if(!payload) return;
    setBusy(true); setError("");
    try {
      const response=await fetch(ANALYZE_URL,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({description:payload,depth:"deep"}),
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data?.detail||`Analysis failed (${response.status})`);
      setResult(data); setClarifyDirty(false);
    } catch(err) {
      setError(err?.message||"Analysis failed.");
    } finally {
      setBusy(false);
    }
  },[description]);

  return (
    <div style={{minHeight:"100vh",background:T.bg}}>
      <style>{globalCss}</style>
      <Topbar result={result}/>

      <div style={{maxWidth:1380,margin:"0 auto",padding:"22px 20px 72px"}}>
        <div className="app-shell-grid">
          <div className="left-rail-slot">{result?<SidebarRail result={result}/>:null}</div>

          <main style={{display:"grid",gap:14,minWidth:0}}>
            <Hero result={result}/>

            <InputComposer
              description={description}
              setDescription={setDescription}
              templates={templates}
              chips={chips}
              onAnalyze={runAnalysis}
              busy={busy}
              onDirty={setClarifyDirty}
            />

            {error&&<ErrorCard message={error}/>}
            <div ref={resultsRef}/>

            {!result ? (
              <EmptyState/>
            ) : (
              <>
                <GuidanceStrip
                  result={result} dirty={clarifyDirty} busy={busy} onReanalyze={runAnalysis}
                  onApply={text=>{
                    setDescription(cur=>{ const next=joinText(cur,text); if(next!==cur) setClarifyDirty(true); return next; });
                  }}
                />
                <StandardsOverview result={result}/>
                <StandardsSection result={result}/>
                <DiagnosticsPanel result={result}/>

                <div style={{display:"flex",justifyContent:"flex-end",gap:10,flexWrap:"wrap"}}>
                  <CopyResultsButton result={result} description={description}/>
                  <SecondaryBtn onClick={runAnalysis} disabled={busy||!description.trim()}>Re-run analysis</SecondaryBtn>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <ScrollTopBtn visible={scrolled}/>
    </div>
  );
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const globalCss=`
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
  *{ box-sizing:border-box; margin:0; padding:0; }
  html,body,#root{
    min-height:100%;
    font-family:'DM Sans',ui-sans-serif,system-ui,sans-serif;
    color:${T.text};
    background:${T.bg};
    -webkit-font-smoothing:antialiased;
  }
  button,input,select,textarea{ font:inherit; color:inherit; }
  textarea::placeholder{ color:${T.textMuted}; }
  textarea::-webkit-scrollbar{ width:5px; }
  textarea::-webkit-scrollbar-track{ background:transparent; }
  textarea::-webkit-scrollbar-thumb{ background:rgba(255,255,255,0.11); border-radius:3px; }

  .app-shell-grid{
    display:grid;
    grid-template-columns:268px minmax(0,1fr);
    gap:16px;
    align-items:start;
  }
  .left-rail-slot{ min-width:0; }

  @keyframes spin{ to{ transform:rotate(360deg); } }
  .spin{ animation:spin 0.75s linear infinite; }

  button:not(:disabled):hover{ filter:brightness(1.10); }
  button:not(:disabled):active{ filter:brightness(0.95); transform:scale(0.99); }

  @media(max-width:1200px){
    .snapshot-grid{ grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
    .hero-stats-grid{ grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
  }
  @media(max-width:1040px){
    .app-shell-grid{ grid-template-columns:1fr; }
    .left-rail,.left-rail-slot{ position:static !important; top:auto !important; }
    .snapshot-grid{ grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
    .tri-grid{ grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
  }
  @media(max-width:960px){
    .guidance-grid{ grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
    .snapshot-grid{ grid-template-columns:repeat(3,minmax(0,1fr)) !important; }
  }
  @media(max-width:680px){
    .guidance-grid,.snapshot-grid,.standard-meta-grid,.hero-stats-grid,.tri-grid{
      grid-template-columns:1fr !important;
    }
  }
`;
