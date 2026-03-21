import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ANALYZE_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";
const METADATA_URL = ANALYZE_URL.replace(/\/analyze$/, "/metadata/options");

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:          "#0b0d12",
  bgPanel:     "#13151c",
  bgCard:      "#1a1d28",
  bgCardInner: "#21253a",
  bgCardDeep:  "#161924",

  line:        "rgba(255,255,255,0.07)",
  lineStrong:  "rgba(255,255,255,0.12)",
  lineFocus:   "rgba(99,172,255,0.45)",

  text:        "#eef0f8",
  textSub:     "#b4bbd4",
  textMuted:   "#6e7898",
  textLabel:   "#8892b4",

  blue:        "#63acff",
  teal:        "#2dd4bf",
  violet:      "#a78bfa",
  rose:        "#f87171",
  amber:       "#fbbf24",
  green:       "#4ade80",

  shadow:      "0 2px 16px rgba(0,0,0,0.5)",
  shadowLg:    "0 8px 40px rgba(0,0,0,0.6)",
  shadowCard:  "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)",
};

// ─── Directive metadata ───────────────────────────────────────────────────────
const DIR_SHORT = {
  LVD:"LVD", EMC:"EMC", RED:"RED", RED_CYBER:"RED Cyber", CRA:"CRA",
  ROHS:"RoHS", REACH:"REACH", GDPR:"GDPR", AI_Act:"AI Act", ESPR:"ESPR",
  ECO:"Ecodesign", BATTERY:"Battery", FCM:"FCM", FCM_PLASTIC:"FCM Plastic",
  MD:"MD", MACH_REG:"Machinery Reg.", OTHER:"Other",
};

const DIR_ORDER = [
  "LVD","EMC","RED","RED_CYBER","ROHS","REACH","GDPR","FCM","FCM_PLASTIC",
  "BATTERY","ECO","ESPR","CRA","AI_Act","MD","MACH_REG","OTHER",
];

const DIR_TONES = {
  LVD:         { dot:"#6ee7b7", bg:"rgba(110,231,183,0.09)", bd:"rgba(110,231,183,0.20)", text:"#6ee7b7" },
  EMC:         { dot:"#67e8f9", bg:"rgba(103,232,249,0.09)", bd:"rgba(103,232,249,0.20)", text:"#67e8f9" },
  RED:         { dot:"#63acff", bg:"rgba(99,172,255,0.09)",  bd:"rgba(99,172,255,0.20)",  text:"#63acff" },
  RED_CYBER:   { dot:"#c084fc", bg:"rgba(192,132,252,0.09)", bd:"rgba(192,132,252,0.20)", text:"#c084fc" },
  CRA:         { dot:"#86efac", bg:"rgba(134,239,172,0.09)", bd:"rgba(134,239,172,0.20)", text:"#86efac" },
  ROHS:        { dot:"#fcd34d", bg:"rgba(252,211,77,0.09)",  bd:"rgba(252,211,77,0.20)",  text:"#fcd34d" },
  REACH:       { dot:"#fdba74", bg:"rgba(253,186,116,0.09)", bd:"rgba(253,186,116,0.20)", text:"#fdba74" },
  GDPR:        { dot:"#2dd4bf", bg:"rgba(45,212,191,0.09)",  bd:"rgba(45,212,191,0.20)",  text:"#2dd4bf" },
  AI_Act:      { dot:"#a78bfa", bg:"rgba(167,139,250,0.09)", bd:"rgba(167,139,250,0.20)", text:"#a78bfa" },
  ESPR:        { dot:"#fb923c", bg:"rgba(251,146,60,0.09)",  bd:"rgba(251,146,60,0.20)",  text:"#fb923c" },
  ECO:         { dot:"#4ade80", bg:"rgba(74,222,128,0.09)",  bd:"rgba(74,222,128,0.20)",  text:"#4ade80" },
  BATTERY:     { dot:"#a3e635", bg:"rgba(163,230,53,0.09)",  bd:"rgba(163,230,53,0.20)",  text:"#a3e635" },
  FCM:         { dot:"#f9a8d4", bg:"rgba(249,168,212,0.09)", bd:"rgba(249,168,212,0.20)", text:"#f9a8d4" },
  FCM_PLASTIC: { dot:"#f9a8d4", bg:"rgba(249,168,212,0.09)", bd:"rgba(249,168,212,0.20)", text:"#f9a8d4" },
  MD:          { dot:"#93c5fd", bg:"rgba(147,197,253,0.09)", bd:"rgba(147,197,253,0.20)", text:"#93c5fd" },
  MACH_REG:    { dot:"#93c5fd", bg:"rgba(147,197,253,0.09)", bd:"rgba(147,197,253,0.20)", text:"#93c5fd" },
  OTHER:       { dot:"#94a3b8", bg:"rgba(148,163,184,0.09)", bd:"rgba(148,163,184,0.20)", text:"#94a3b8" },
};

const STATUS = {
  LOW:      { bg:"rgba(74,222,128,0.10)",  bd:"rgba(74,222,128,0.25)",  text:"#4ade80" },
  MEDIUM:   { bg:"rgba(251,191,36,0.10)",  bd:"rgba(251,191,36,0.25)",  text:"#fbbf24" },
  HIGH:     { bg:"rgba(251,113,133,0.10)", bd:"rgba(251,113,133,0.25)", text:"#fb7185" },
  CRITICAL: { bg:"rgba(248,113,113,0.13)", bd:"rgba(248,113,113,0.30)", text:"#f87171" },
};

const IMPORTANCE = {
  high:   { bg:"rgba(248,113,113,0.08)", bd:"rgba(248,113,113,0.22)", text:"#fb7185", dot:"#fb7185" },
  medium: { bg:"rgba(251,191,36,0.08)",  bd:"rgba(251,191,36,0.22)",  text:"#fbbf24", dot:"#fbbf24" },
  low:    { bg:"rgba(74,222,128,0.07)",  bd:"rgba(74,222,128,0.20)",  text:"#4ade80", dot:"#4ade80" },
};

const SECTION_TONES = {
  harmonized:       { tag:"rgba(99,172,255,0.14)",  bd:"rgba(99,172,255,0.22)",  tagText:"#63acff" },
  state_of_the_art: { tag:"rgba(251,146,60,0.14)",  bd:"rgba(251,146,60,0.22)",  tagText:"#fb923c" },
  review:           { tag:"rgba(248,113,133,0.14)", bd:"rgba(248,113,133,0.22)", tagText:"#fb7185" },
  unknown:          { tag:"rgba(148,163,184,0.10)", bd:"rgba(148,163,184,0.18)", tagText:"#94a3b8" },
};

const DEFAULT_TEMPLATES = [
  { label:"Coffee machine",  text:"Connected espresso machine with mains power, Wi-Fi app control, OTA updates, cloud account, grinder, pressure, water tank, and food-contact brew path." },
  { label:"Electric kettle", text:"Electric kettle with mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi control." },
  { label:"Air purifier",    text:"Smart air purifier with mains power, motorized fan, electronic controls, Wi-Fi app control, networked standby, and OTA firmware updates." },
  { label:"Robot vacuum",    text:"Robot vacuum cleaner with rechargeable lithium battery, Wi-Fi and Bluetooth, cloud account, OTA firmware updates, LiDAR navigation, and camera." },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
function titleCase(input){
  return String(input||"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim().replace(/\b\w/g,m=>m.toUpperCase());
}
function gapLabel(key){
  const labels={
    product_type:"Product type", power_source:"Power source",
    radio_scope_confirmation:"Radio scope", radio_technology:"Radio technology",
    wifi_band:"Wi-Fi band", food_contact_materials:"Food-contact materials",
    connectivity_architecture:"Connected design", redcyber_auth_scope:"Login / auth",
    redcyber_transaction_scope:"Payments", contradictions:"Contradictions",
  };
  return labels[key]||titleCase(key);
}
function sentenceCaseList(values){ return (values||[]).map(v=>titleCase(String(v))); }
function directiveTone(key){ return DIR_TONES[key]||DIR_TONES.OTHER; }
function directiveShort(key){ return DIR_SHORT[key]||titleCase(key); }
function directiveRank(key){ const r=DIR_ORDER.indexOf(key||"OTHER"); return r===-1?999:r; }
function normalizeStandardDirective(item){
  const code=String(item?.code||"").toUpperCase();
  if(code.startsWith("EN 18031-")) return "RED_CYBER";
  return item?.directive||item?.legislation_key||"OTHER";
}
function joinText(base,addition){
  const a=String(base||"").trim(), b=String(addition||"").trim();
  if(!b) return a; if(!a) return b;
  if(a.toLowerCase().includes(b.toLowerCase())) return a;
  const sep=/[\s,;:]$/.test(a)?" ":a.endsWith(".")?" ":", ";
  return `${a}${sep}${b}`;
}
function uniqueBy(items,getKey){
  const map=new Map();
  (items||[]).forEach(item=>{ const k=getKey(item); if(!map.has(k)) map.set(k,item); });
  return Array.from(map.values());
}
function prettyValue(value){
  if(value===null||value===undefined||value==="") return "—";
  if(Array.isArray(value)) return value.join(", ");
  return String(value);
}

function buildDynamicTemplates(products){
  const lookup=new Map((products||[]).map(p=>[p.id,p]));
  const templates=[];
  function addTemplate(productId,suffix,labelOverride){
    const product=lookup.get(productId);
    if(!product) return;
    templates.push({ label:labelOverride||product.label, text:`${product.label} with ${suffix}.` });
  }
  addTemplate("coffee_machine","mains power, heating, water tank, grinder, food-contact brew path, Wi-Fi radio, app control, cloud account, and OTA updates","Coffee machine");
  addTemplate("electric_kettle","mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi radio control","Electric kettle");
  addTemplate("air_purifier","mains power, motorized fan, sensor electronics, Wi-Fi radio, app control, and OTA updates","Air purifier");
  addTemplate("robot_vacuum","rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, and LiDAR navigation","Robot vacuum");
  addTemplate("robot_vacuum_cleaner","rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, and LiDAR navigation","Robot vacuum");
  return uniqueBy(templates.length?templates:DEFAULT_TEMPLATES, item=>item.label).slice(0,4);
}

function buildGuidedChips(metadata,result){
  const productId=result?.product_type;
  const product=(metadata?.products||[]).find(item=>item.id===productId);
  const traits=new Set(result?.all_traits||[]);
  const missingItems=result?.missing_information_items||[];
  const chips=[];
  const push=(label,text)=>{ if(!label||!text) return; if(!chips.some(item=>item.text===text)) chips.push({label,text}); };
  missingItems.forEach(item=>(item.examples||[]).slice(0,2).forEach(ex=>push(gapLabel(item.key),ex)));
  if(product?.implied_traits?.includes("food_contact")||traits.has("food_contact")){
    push("Food contact","food-contact plastics, coatings, silicone, rubber, and metal parts");
    push("Water path","wetted path materials, seals, and water tank");
  }
  if(product?.implied_traits?.includes("motorized")||traits.has("motorized")){
    push("Motor","motorized function");
    push("Pump","pump or fluid transfer function");
  }
  if(traits.has("radio")){
    push("Wi-Fi","Wi-Fi radio");
    push("Bluetooth","Bluetooth LE radio");
    push("OTA","OTA firmware updates");
  }
  if(!traits.has("radio")&&(traits.has("app_control")||traits.has("cloud")||traits.has("ota"))){
    push("Wi-Fi","Wi-Fi radio");
    push("Bluetooth","Bluetooth LE radio");
  }
  if(traits.has("cloud")||traits.has("app_control")||traits.has("internet")){
    push("Cloud","cloud account required");
    push("Local control","local LAN control without cloud dependency");
    push("Patching","security and firmware patching over the air");
  }
  if(traits.has("food_contact"))
    push("Food contact","food-contact plastics, coatings, silicone, rubber, and metal parts");
  if(traits.has("battery_powered")) push("Battery","rechargeable lithium battery");
  if(traits.has("camera")) push("Camera","integrated camera");
  if(traits.has("microphone")) push("Microphone","microphone or voice input");
  if(!chips.length){
    push("Mains","230 V mains powered");
    push("Consumer","consumer household use");
    push("App control","mobile app control");
    push("Wi-Fi","Wi-Fi radio");
    push("Food contact","food-contact plastics or coatings");
  }
  return chips.slice(0,10);
}

function buildGuidanceItems(result){
  const traits=new Set(result?.all_traits||[]);
  const rawItems=result?.input_gaps_panel?.items||result?.missing_information_items||[];
  const items=[], seen=new Set();
  const add=(key,title,why,importance,choices=[])=>{
    if(seen.has(key)) return; seen.add(key);
    items.push({key,title,why,importance,choices:choices.filter(Boolean).slice(0,3)});
  };
  if(traits.has("radio"))
    add("radio_stack","Confirm radios","Changes RED and RF scope.","high",["Wi-Fi radio","Bluetooth LE radio","NFC radio"]);
  if(traits.has("cloud")||traits.has("internet")||traits.has("app_control")||traits.has("ota")||traits.has("wifi"))
    add("connected_architecture","Confirm connected design","Changes EN 18031 and cybersecurity route.","high",["cloud account required","local LAN control without cloud dependency","OTA firmware updates"]);
  if(traits.has("food_contact"))
    add("food_contact","Confirm wetted materials","Changes food-contact obligations.","medium",["food-contact plastics","silicone seal","metal wetted path"]);
  if(traits.has("battery_powered"))
    add("battery","Confirm battery setup","Changes Battery Regulation scope.","medium",["rechargeable lithium battery","replaceable battery","battery supplied with the product"]);
  if(traits.has("camera")||traits.has("microphone")||traits.has("personal_data_likely"))
    add("data_functions","Confirm sensitive functions","Changes cybersecurity/privacy expectations.","high",["integrated camera","microphone or voice input","user account and profile data"]);
  rawItems.forEach(item=>add(item.key,gapLabel(item.key),item.message,item.importance||"medium",item.examples||[]));
  return items.slice(0,6);
}

function buildCompactLegislationItems(result){
  const sections=result?.legislation_sections||[];
  const allItems=sections.flatMap(section=>(section.items||[]).map(item=>({...item,section_key:section.key,section_title:section.title})));
  return uniqueBy(
    [...allItems].sort((a,b)=>directiveRank(a.directive_key)-directiveRank(b.directive_key)||String(a.code).localeCompare(String(b.code))),
    item=>`${item.code}-${item.directive_key}`
  );
}

function compactLegislationGroupLabel(item){
  const k=item.section_key;
  if(k==="framework") return "Additional";
  if(k==="non_ce") return "Parallel";
  if(k==="future") return "Future";
  if(k==="ce") return "CE";
  return titleCase(k);
}

function sortStandardItems(items){
  return [...(items||[])].sort((a,b)=>{
    const aDir=normalizeStandardDirective(a), bDir=normalizeStandardDirective(b);
    return directiveRank(aDir)-directiveRank(bDir)||String(a.code||"").localeCompare(String(b.code||""));
  });
}

function buildSectionsFromFlatResult(result){
  const standardRows=(result?.standards||[]).map(item=>({...item,item_type:item.item_type||"standard"}));
  const reviewRows=(result?.review_items||[]).map(item=>({...item,item_type:"review"}));
  const grouped={};
  [...standardRows,...reviewRows].forEach(item=>{
    let key=item.harmonization_status||(item.item_type==="review"?"review":"unknown");
    if(!["harmonized","state_of_the_art","review","unknown"].includes(key)) key="unknown";
    if(!grouped[key]) grouped[key]={ key, title:
      key==="harmonized"?"Harmonized standards":
      key==="state_of_the_art"?"State of the art / latest technical route":
      key==="review"?"Review-required routes":"Other standards",
      count:0, items:[] };
    grouped[key].items.push(item);
  });
  return ["harmonized","state_of_the_art","review","unknown"]
    .filter(k=>grouped[k])
    .map(key=>({ ...grouped[key], items:sortStandardItems(grouped[key].items), count:grouped[key].items.length }));
}

function buildDirectiveBreakdown(result){
  const sections=result?.standard_sections?.length?result.standard_sections:buildSectionsFromFlatResult(result);
  const counts={};
  sections.forEach(section=>(section.items||[]).forEach(item=>{ const dir=normalizeStandardDirective(item); counts[dir]=(counts[dir]||0)+1; }));
  return Object.entries(counts).sort((a,b)=>directiveRank(a[0])-directiveRank(b[0])).map(([key,count])=>({key,count}));
}

// ─── Primitive components ─────────────────────────────────────────────────────

function DirPill({ dirKey, large=false }){
  const tone=directiveTone(dirKey);
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:5,borderRadius:6,
      border:`1px solid ${tone.bd}`,background:tone.bg,color:tone.text,
      padding:large?"5px 12px":"3px 8px", fontSize:large?12:11, fontWeight:700,
      whiteSpace:"nowrap",letterSpacing:"0.02em",
    }}>
      <span style={{width:5,height:5,borderRadius:999,background:tone.dot,flexShrink:0}}/>
      {directiveShort(dirKey)}
    </span>
  );
}

function RiskBadge({ value }){
  const tone=STATUS[value]||STATUS.MEDIUM;
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:6,borderRadius:6,
      border:`1px solid ${tone.bd}`,background:tone.bg,color:tone.text,
      padding:"3px 10px",fontSize:11,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",
    }}>
      <span style={{width:5,height:5,borderRadius:999,background:tone.text}}/>
      {value} Risk
    </span>
  );
}

function Chip({ children, tone="neutral" }){
  const s = tone==="neutral"
    ? {bg:"rgba(255,255,255,0.06)", bd:T.lineStrong, text:T.textSub}
    : tone==="blue"
    ? {bg:"rgba(99,172,255,0.10)", bd:"rgba(99,172,255,0.22)", text:T.blue}
    : {bg:"rgba(45,212,191,0.10)", bd:"rgba(45,212,191,0.22)", text:T.teal};
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",borderRadius:6,
      border:`1px solid ${s.bd}`,background:s.bg,color:s.text,
      padding:"3px 9px",fontSize:11,fontWeight:600,
    }}>{children}</span>
  );
}

function Card({ children, style }){
  return (
    <div style={{
      borderRadius:16,border:`1px solid ${T.lineStrong}`,
      background:T.bgCard,boxShadow:T.shadowCard,overflow:"hidden",
      ...style,
    }}>{children}</div>
  );
}

function CardHeader({ title, subtitle, right }){
  return (
    <div style={{
      padding:"15px 20px 13px",
      borderBottom:`1px solid ${T.line}`,
      background:T.bgCardDeep,
      display:"flex",gap:12,alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",
    }}>
      <div style={{minWidth:0}}>
        {title&&<div style={{fontSize:13,fontWeight:700,color:T.text,letterSpacing:"-0.01em"}}>{title}</div>}
        {subtitle&&<div style={{marginTop:3,fontSize:11,color:T.textMuted,lineHeight:1.55}}>{subtitle}</div>}
      </div>
      {right&&<div style={{flexShrink:0}}>{right}</div>}
    </div>
  );
}

function SoftBox({ children, style }){
  return (
    <div style={{
      borderRadius:10,border:`1px solid rgba(255,255,255,0.08)`,
      background:"rgba(255,255,255,0.04)",padding:"10px 12px",
      ...style,
    }}>{children}</div>
  );
}

function Label({ children }){
  return (
    <div style={{
      fontSize:9.5,fontWeight:700,color:T.textLabel,
      textTransform:"uppercase",letterSpacing:"0.10em",marginBottom:5,
    }}>{children}</div>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

function PrimaryBtn({ onClick, disabled, children }){
  return (
    <button onClick={onClick} disabled={disabled} style={{
      appearance:"none",cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?0.38:1,borderRadius:10,border:"none",
      background:disabled?"rgba(99,172,255,0.18)":`linear-gradient(135deg,${T.blue},${T.teal})`,
      color:"#000",padding:"11px 22px",fontWeight:700,fontSize:13,
      boxShadow:disabled?"none":"0 0 24px rgba(99,172,255,0.22)",
      transition:"all 0.2s",letterSpacing:"0.01em",whiteSpace:"nowrap",
    }}>{children}</button>
  );
}

function SecondaryBtn({ onClick, disabled, children, style }){
  return (
    <button onClick={onClick} disabled={disabled} style={{
      appearance:"none",cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?0.4:1,borderRadius:10,
      border:`1px solid ${T.lineStrong}`,background:"rgba(255,255,255,0.04)",
      color:T.textSub,padding:"10px 18px",fontWeight:600,fontSize:13,
      transition:"all 0.2s",...style,
    }}>{children}</button>
  );
}

function GhostBtn({ onClick, children }){
  return (
    <button onClick={onClick} style={{
      appearance:"none",cursor:"pointer",borderRadius:8,
      border:`1px solid ${T.line}`,background:"transparent",
      color:T.textMuted,padding:"5px 11px",fontWeight:600,fontSize:11.5,
      transition:"all 0.2s",whiteSpace:"nowrap",
    }}>{children}</button>
  );
}

function AddChipBtn({ onClick, children }){
  return (
    <button onClick={onClick} style={{
      appearance:"none",cursor:"pointer",borderRadius:7,
      border:`1px solid ${T.lineStrong}`,background:"rgba(255,255,255,0.04)",
      color:T.textSub,padding:"5px 11px",fontWeight:600,fontSize:11.5,
      transition:"background 0.15s,color 0.15s,border-color 0.15s",
    }}>{children}</button>
  );
}

function CharCounter({ value, max=1200 }){
  const len=value.length, pct=Math.min(len/max,1);
  const color=pct>0.9?T.rose:pct>0.7?T.amber:T.textMuted;
  return (
    <span style={{fontSize:11,color,fontWeight:500,fontVariantNumeric:"tabular-nums"}}>
      {len} / {max}
    </span>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar({ result, onReset }){
  const totalStandards=result
    ?(result?.standard_sections?.length
      ?result.standard_sections.reduce((n,s)=>n+(s.items||[]).length,0)
      :(result?.standards||[]).length+(result?.review_items||[]).length)
    :null;

  return (
    <div style={{
      borderBottom:`1px solid ${T.line}`,
      background:`${T.bgPanel}f0`,
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      padding:"0 20px",
      display:"flex",alignItems:"center",gap:10,height:50,
      position:"sticky",top:0,zIndex:100,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <div style={{
          width:26,height:26,borderRadius:7,
          background:`linear-gradient(135deg,${T.blue},${T.teal})`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:12,fontWeight:900,color:"#000",flexShrink:0,
        }}>⬡</div>
        <span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:17,color:T.text,letterSpacing:"-0.01em",whiteSpace:"nowrap"}}>
          RuleGrid
        </span>
      </div>

      <div style={{width:1,height:18,background:T.line,margin:"0 2px",flexShrink:0}}/>
      <span className="topbar-subtitle" style={{fontSize:11,color:T.textMuted,fontWeight:500}}>EU Regulatory Scoping</span>

      {result&&(
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:7}}>
          <RiskBadge value={result?.overall_risk||"MEDIUM"}/>
          {totalStandards!==null&&(
            <span className="topbar-count" style={{
              fontSize:11,color:T.textMuted,fontWeight:600,
              background:"rgba(255,255,255,0.04)",border:`1px solid ${T.line}`,
              borderRadius:6,padding:"3px 8px",whiteSpace:"nowrap",
            }}>{totalStandards} std</span>
          )}
          <button onClick={onReset} style={{
            appearance:"none",cursor:"pointer",borderRadius:8,
            border:`1px solid rgba(99,172,255,0.25)`,
            background:"rgba(99,172,255,0.07)",
            color:T.blue,padding:"5px 12px",fontWeight:600,fontSize:12,
            display:"flex",alignItems:"center",gap:5,
            transition:"all 0.15s",whiteSpace:"nowrap",
          }}>↺ <span className="topbar-new-label">New analysis</span></button>
        </div>
      )}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ result }){
  const hero=result?.hero_summary||{};
  const primaryRegimes=hero.primary_regimes||[];
  const showMeta=Boolean(result);

  return (
    <div style={{
      borderRadius:16,border:`1px solid ${T.lineStrong}`,
      background:"linear-gradient(150deg,#1c2035 0%,#161926 55%,#1a1e30 100%)",
      boxShadow:`${T.shadowLg},0 0 60px rgba(99,172,255,0.05)`,
      padding:"clamp(20px,4vw,36px) clamp(16px,4vw,32px)",
      position:"relative",overflow:"hidden",
    }}>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",
        backgroundImage:`linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`,
        backgroundSize:"48px 48px"}}/>
      <div style={{position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",
        width:400,height:200,
        background:"radial-gradient(ellipse,rgba(99,172,255,0.07),transparent 70%)",
        pointerEvents:"none"}}/>

      <div style={{position:"relative",display:"grid",gap:14,justifyItems:"center",textAlign:"center"}}>
        {showMeta&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center"}}>
            <RiskBadge value={result?.overall_risk||"MEDIUM"}/>
            <Chip tone="blue">{titleCase(hero.confidence||result?.product_match_confidence||"low")} Confidence</Chip>
          </div>
        )}
        <div>
          <h1 style={{
            fontFamily:"'DM Serif Display',Georgia,serif",
            fontSize:"clamp(22px,4vw,38px)",fontWeight:400,color:T.text,
            lineHeight:1.1,letterSpacing:"-0.02em",marginBottom:10,
          }}>
            {hero.title||"RuleGrid Regulatory Scoping"}
          </h1>
          <p style={{fontSize:"clamp(13px,2vw,14px)",color:T.textSub,lineHeight:1.75,maxWidth:560,margin:"0 auto"}}>
            {hero.subtitle||"Describe the product clearly to generate the standards route and the applicable legislation path."}
          </p>
        </div>
        {showMeta&&primaryRegimes.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center"}}>
            {primaryRegimes.map(dirKey=><DirPill key={dirKey} dirKey={dirKey} large/>)}
          </div>
        )}
        {showMeta&&result?.summary&&(
          <div style={{
            width:"100%",maxWidth:640,padding:"13px 18px",borderRadius:12,
            background:"rgba(99,172,255,0.06)",border:`1px solid rgba(99,172,255,0.14)`,
            fontSize:13,color:T.textSub,lineHeight:1.75,textAlign:"left",
          }}>{result.summary}</div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar rail ─────────────────────────────────────────────────────────────
function SidebarRail({ result }){
  if(!result) return null;
  const items=buildCompactLegislationItems(result);
  const confidence=result?.confidence_panel?.confidence||result?.product_match_confidence||"low";
  return (
    <aside className="left-rail" style={{display:"grid",gap:10,position:"sticky",top:64,alignSelf:"start"}}>
      <Card>
        <CardHeader title="Applicable legislation" subtitle="All detected legislation"/>
        <div style={{padding:"10px 12px",display:"grid",gap:6}}>
          {items.map(item=>{
            const tone=directiveTone(item.directive_key||"OTHER");
            return (
              <div key={`${item.code}-${item.directive_key}-${item.section_key}`}
                style={{borderRadius:9,border:`1px solid ${tone.bd}`,background:tone.bg,padding:"8px 10px",display:"grid",gap:3}}>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{width:5,height:5,borderRadius:999,background:tone.dot,flexShrink:0}}/>
                  <span style={{fontSize:11.5,fontWeight:700,color:tone.text}}>{item.code}</span>
                  <span style={{fontSize:9.5,opacity:0.7,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:tone.text}}>
                    {compactLegislationGroupLabel(item)}
                  </span>
                </div>
                <div style={{fontSize:11,lineHeight:1.45,color:T.textSub}}>{item.title}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Detection" subtitle="Product identification"/>
        <div style={{padding:"10px 12px",display:"grid",gap:7}}>
          <SoftBox>
            <Label>Detected product</Label>
            <div style={{fontSize:14,fontWeight:700,color:T.text,marginTop:1}}>{titleCase(result?.product_type||"Unclear")}</div>
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
        </div>
      </Card>
    </aside>
  );
}

// ─── Input composer ───────────────────────────────────────────────────────────
function InputComposer({ description, setDescription, templates, chips, onAnalyze, busy, onDirty }){
  const [focused,setFocused]=useState(false);
  const charMax=1200;
  const wordCount=description.trim()?description.trim().split(/\s+/).length:0;

  return (
    <Card>
      <CardHeader
        title="Product description"
        subtitle="Type · connectivity · power · functions · sensors · materials · battery"
      />
      <div style={{padding:"16px 18px",display:"grid",gap:14}}>

        <div>
          <div style={{fontSize:10,fontWeight:700,color:T.textLabel,textTransform:"uppercase",letterSpacing:"0.10em",marginBottom:8}}>
            Quick fill
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {templates.slice(0,4).map(template=>(
              <button key={template.label} onClick={()=>{ setDescription(template.text); onDirty(true); }} style={{
                appearance:"none",cursor:"pointer",borderRadius:8,
                border:`1px solid rgba(99,172,255,0.20)`,background:"rgba(99,172,255,0.07)",
                color:T.blue,padding:"6px 13px",fontSize:12,fontWeight:600,transition:"all 0.15s",
              }}>{template.label}</button>
            ))}
          </div>
        </div>

        <div style={{position:"relative"}}>
          <textarea
            value={description}
            onChange={e=>{ setDescription(e.target.value); onDirty(true); }}
            onFocus={()=>setFocused(true)}
            onBlur={()=>setFocused(false)}
            placeholder="Example: Connected espresso machine with Wi-Fi radio, OTA updates, cloud account, mains power, grinder, pressure system, and food-contact brew path."
            rows={6}
            maxLength={charMax}
            style={{
              width:"100%",borderRadius:12,resize:"vertical",minHeight:140,lineHeight:1.7,
              border:`1px solid ${focused?T.lineFocus:T.lineStrong}`,
              background:"rgba(0,0,0,0.22)",padding:"12px 14px 32px",
              color:T.text,outline:"none",fontSize:14,
              boxShadow:focused?"0 0 0 3px rgba(99,172,255,0.08)":"none",
              transition:"border-color 0.2s,box-shadow 0.2s",
              boxSizing:"border-box",
            }}
          />
          <div style={{position:"absolute",bottom:10,right:12,pointerEvents:"none"}}>
            <CharCounter value={description} max={charMax}/>
          </div>
        </div>

        {chips.length>0&&(
          <div>
            <div style={{fontSize:10,fontWeight:700,color:T.textLabel,textTransform:"uppercase",letterSpacing:"0.10em",marginBottom:8}}>
              Add detail
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {chips.map(chip=>(
                <AddChipBtn key={chip.label+chip.text} onClick={()=>{ setDescription(cur=>joinText(cur,chip.text)); onDirty(true); }}>
                  + {chip.label}
                </AddChipBtn>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:9,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
            <PrimaryBtn onClick={onAnalyze} disabled={busy||!description.trim()}>
              {busy?(
                <span style={{display:"flex",alignItems:"center",gap:8}}>
                  <span className="spin">◌</span> Analyzing…
                </span>
              ):"Analyze product"}
            </PrimaryBtn>
            <SecondaryBtn onClick={()=>{ setDescription(""); onDirty(true); }} disabled={!description}>Clear</SecondaryBtn>
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
function GuidanceStrip({ result, dirty, busy, onReanalyze, onApply }){
  const [open,setOpen]=useState(false);
  const items=buildGuidanceItems(result);
  if(!items.length) return null;

  const highCount=items.filter(i=>i.importance==="high").length;
  const accentColor=highCount>0?T.amber:T.textMuted;
  const accentBd=highCount>0?"rgba(251,191,36,0.20)":"rgba(255,255,255,0.08)";
  const accentBg=highCount>0?"rgba(251,191,36,0.04)":"rgba(255,255,255,0.02)";

  return (
    <div style={{borderRadius:12,border:`1px solid ${accentBd}`,background:accentBg,overflow:"hidden"}}>
      <div
        style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",cursor:"pointer",userSelect:"none",flexWrap:"wrap"}}
        onClick={()=>setOpen(v=>!v)}
      >
        <span style={{fontSize:12,color:accentColor,flexShrink:0}}>{open?"▾":"▸"}</span>
        <span style={{fontSize:12,fontWeight:700,color:accentColor,whiteSpace:"nowrap"}}>
          {items.length} clarification{items.length!==1?"s":""} that may refine this route
        </span>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",flex:1,minWidth:0}}>
          {items.slice(0,3).map(item=>{
            const tone=IMPORTANCE[item.importance]||IMPORTANCE.medium;
            return (
              <span key={item.key} style={{
                fontSize:10,fontWeight:600,borderRadius:5,padding:"2px 7px",
                background:tone.bg,border:`1px solid ${tone.bd}`,color:tone.text,whiteSpace:"nowrap",
              }}>{item.title}</span>
            );
          })}
          {items.length>3&&<span style={{fontSize:10,color:T.textMuted,alignSelf:"center"}}>+{items.length-3}</span>}
        </div>
        {dirty&&(
          <button
            onClick={e=>{e.stopPropagation();onReanalyze();}}
            disabled={busy}
            style={{
              appearance:"none",cursor:"pointer",borderRadius:7,border:"none",
              background:`linear-gradient(135deg,${T.blue},${T.teal})`,
              color:"#000",padding:"5px 12px",fontWeight:700,fontSize:11,
              flexShrink:0,opacity:busy?0.5:1,whiteSpace:"nowrap",
            }}
          >{busy?"…":"Refresh →"}</button>
        )}
        {dirty&&!busy&&(
          <span style={{fontSize:10,color:T.amber,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>● Updated</span>
        )}
      </div>
      {open&&(
        <div style={{borderTop:`1px solid rgba(255,255,255,0.06)`,padding:"10px 14px 12px",display:"flex",gap:6,flexWrap:"wrap"}}>
          {items.flatMap(item=>item.choices.map(choice=>{
            const tone=IMPORTANCE[item.importance]||IMPORTANCE.medium;
            return (
              <button key={item.key+choice} onClick={()=>onApply(choice)} style={{
                appearance:"none",cursor:"pointer",borderRadius:6,
                border:`1px solid ${tone.bd}`,background:"rgba(0,0,0,0.18)",
                color:tone.text,padding:"4px 9px",fontSize:11,fontWeight:600,
                transition:"filter 0.15s",
              }}>+ {choice}</button>
            );
          }))}
        </div>
      )}
    </div>
  );
}

// ─── Route pills ──────────────────────────────────────────────────────────────
function RoutePills({ result }){
  const breakdown=buildDirectiveBreakdown(result);
  if(!breakdown.length) return null;
  const total=breakdown.reduce((n,{count})=>n+count,0);
  return (
    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:11,color:T.textMuted,fontWeight:500,marginRight:2}}>
        {total} standards —
      </span>
      {breakdown.map(({key,count})=>{
        const tone=directiveTone(key);
        return (
          <span key={key} style={{
            display:"inline-flex",alignItems:"center",gap:4,
            borderRadius:20,border:`1px solid ${tone.bd}`,background:tone.bg,
            color:tone.text,padding:"2px 8px",fontSize:10.5,fontWeight:700,whiteSpace:"nowrap",
          }}>
            <span style={{width:4,height:4,borderRadius:999,background:tone.dot,flexShrink:0}}/>
            {directiveShort(key)}<span style={{opacity:0.6,fontWeight:400,marginLeft:2}}>{count}</span>
          </span>
        );
      })}
    </div>
  );
}

// ─── Standard card ────────────────────────────────────────────────────────────
function StandardCard({ item, sectionKey }){
  const dirKey=normalizeStandardDirective(item);
  const dirTone=directiveTone(dirKey);
  const sectionTone=SECTION_TONES[sectionKey]||SECTION_TONES.unknown;
  const evidence=sentenceCaseList(item.evidence_hint||[]).join(" · ");
  const summary=item.standard_summary||item.reason||item.notes||item.title;

  const metaFields=[
    {label:"Harmonized Ref.",   value:prettyValue(item.harmonized_reference)},
    {label:"Evidence Expected", value:prettyValue(evidence||"—")},
    {label:"Harmonized Ver.",   value:prettyValue(item.dated_version)},
    {label:"EU Latest Ver.",    value:prettyValue(item.version)},
  ];

  return (
    <div className="standard-card" style={{
      borderRadius:14,
      border:`1.5px solid ${dirTone.bd}`,
      background:`linear-gradient(160deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.015) 100%)`,
      overflow:"hidden",
      boxShadow:"0 4px 22px rgba(0,0,0,0.35)",
      transition:"box-shadow 0.2s,transform 0.2s",
    }}>
      {/* Header band */}
      <div style={{
        padding:"14px 18px 12px",
        background:`linear-gradient(135deg,${dirTone.bg} 0%,transparent 70%)`,
        borderBottom:`1px solid rgba(255,255,255,0.07)`,
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <DirPill dirKey={dirKey}/>
            <span style={{
              display:"inline-flex",alignItems:"center",borderRadius:5,
              background:sectionTone.tag,border:`1px solid ${sectionTone.bd}`,
              color:sectionTone.tagText,padding:"2px 7px",
              fontSize:9.5,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",
            }}>{titleCase(item.harmonization_status||"unknown")}</span>
          </div>
          <span style={{
            display:"inline-flex",alignItems:"center",
            borderRadius:8,background:dirTone.dot,color:"#000",
            padding:"5px 12px",fontSize:12.5,fontWeight:900,
            letterSpacing:"-0.01em",whiteSpace:"nowrap",flexShrink:0,
            fontFamily:"'DM Mono',ui-monospace,monospace",
          }}>{item.code}</span>
        </div>

        <div style={{fontSize:15,fontWeight:700,color:T.text,lineHeight:1.35,marginBottom:summary&&summary!==item.title?6:0,letterSpacing:"-0.015em"}}>
          {item.title}
        </div>

        {summary&&summary!==item.title&&(
          <div style={{fontSize:12.5,color:"rgba(180,187,212,0.85)",lineHeight:1.7,fontStyle:"italic"}}>
            {summary}
          </div>
        )}
      </div>

      {/* Meta grid */}
      <div className="standard-meta-grid" style={{
        padding:"12px 16px 14px",
        display:"grid",
        gridTemplateColumns:"repeat(2,minmax(0,1fr))",
        gap:7,
        background:"rgba(0,0,0,0.18)",
      }}>
        {metaFields.map(({label,value})=>(
          <div key={label} style={{
            borderRadius:8,padding:"9px 11px",
            background:"rgba(255,255,255,0.035)",
            border:"1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{fontSize:9,fontWeight:700,color:T.textLabel,textTransform:"uppercase",letterSpacing:"0.11em",marginBottom:5}}>
              {label}
            </div>
            <div style={{
              lineHeight:1.5,fontWeight:value==="—"?400:500,
              color:value==="—"?T.textMuted:T.text,
              fontFamily:value==="—"?"inherit":"'DM Mono',ui-monospace,monospace",
              fontSize:value==="—"?12.5:12,
            }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Standards section ────────────────────────────────────────────────────────
function StandardsSection({ result }){
  const sections=(result?.standard_sections||[])
    .map(section=>({
      ...section,
      items:sortStandardItems((section.items||[]).map(item=>({ ...item, directive:normalizeStandardDirective(item) }))),
    }))
    .sort((a,b)=>directiveRank(a.key)-directiveRank(b.key));

  if(!sections.length) return null;

  return (
    <Card>
      <div style={{
        padding:"16px 20px 14px",
        borderBottom:`1px solid ${T.line}`,
        background:T.bgCardDeep,
        display:"grid",gap:10,
      }}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:T.text,letterSpacing:"-0.01em"}}>Standards route</div>
            <div style={{marginTop:3,fontSize:11,color:T.textMuted}}>Primary output · ordered LVD → EMC → RED → RED Cyber</div>
          </div>
        </div>
        <RoutePills result={result}/>
      </div>

      <div style={{padding:"16px 16px 20px",display:"grid",gap:16}}>
        {sections.map((section,i)=>{
          const tone=directiveTone(section.key);
          return (
            <div key={section.key} style={{
              borderRadius:14,
              border:`1px solid ${tone.bd}`,
              background:`linear-gradient(145deg,${tone.bg},transparent 80%)`,
              overflow:"hidden",
            }}>
              <div style={{
                padding:"11px 15px",borderBottom:`1px solid ${tone.bd}`,
                display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap",
                background:"rgba(0,0,0,0.14)",
              }}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,letterSpacing:"-0.01em"}}>
                    {section.title||directiveShort(section.key)}
                  </div>
                  <div style={{marginTop:2,fontSize:11,color:T.textMuted}}>
                    {section.count||0} item{(section.count||0)!==1?"s":""}
                  </div>
                </div>
                <DirPill dirKey={section.key}/>
              </div>
              <div style={{padding:"14px",display:"grid",gap:12}}>
                {(section.items||[]).map(item=>(
                  <StandardCard
                    key={`${section.key}-${item.code}-${item.title}-${i}`}
                    item={item}
                    sectionKey={item.harmonization_status||"unknown"}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Diagnostics panel ────────────────────────────────────────────────────────
function DiagnosticsPanel({ result }){
  const [open,setOpen]=useState(false);
  const diagnostics=result?.diagnostics||[];
  const traits=result?.all_traits||[];
  if(!diagnostics.length&&!traits.length) return null;
  return (
    <Card>
      <CardHeader
        title="Advanced diagnostics"
        subtitle="Trait detection and engine output."
        right={<GhostBtn onClick={()=>setOpen(v=>!v)}>{open?"Hide":"Show diagnostics"}</GhostBtn>}
      />
      {open&&(
        <div style={{padding:"12px 16px 16px",display:"grid",gap:10}}>
          {traits.length>0&&(
            <SoftBox>
              <Label>All traits detected</Label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:7}}>
                {traits.map(trait=><Chip key={trait}>{titleCase(trait)}</Chip>)}
              </div>
            </SoftBox>
          )}
          {diagnostics.length>0&&(
            <SoftBox>
              <Label>Engine diagnostics</Label>
              <div style={{marginTop:7,display:"grid",gap:5}}>
                {diagnostics.map((line,i)=>(
                  <div key={line+i} style={{fontSize:12,color:T.textSub,lineHeight:1.6,paddingLeft:11,borderLeft:`2px solid ${T.line}`}}>{line}</div>
                ))}
              </div>
            </SoftBox>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyResultsButton({ result, description }){
  const [copied,setCopied]=useState(false);
  const handleCopy=async()=>{
    const sections=result?.standard_sections?.length?result.standard_sections:buildSectionsFromFlatResult(result);
    const text=[
      "RuleGrid compliance summary","",
      `Input: ${description}`,"",
      `Detected product: ${titleCase(result?.product_type||"Unclear")}`,
      `Confidence: ${titleCase(result?.product_match_confidence||"low")}`,
      `Overall risk: ${result?.overall_risk||"MEDIUM"}`,"",
      `Summary: ${result?.summary||""}`,"",
      "Standards route:",
      ...sections.flatMap(section=>[
        `- ${section.title} (${section.count})`,
        ...sortStandardItems(section.items||[]).map(item=>`  • ${item.code} — ${item.title}`),
      ]),"",
      "Applicable legislation:",
      ...buildCompactLegislationItems(result).map(item=>`- ${item.code} — ${item.title}`),
    ].join("\n");
    try{ await navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2400); }catch(_){}
  };
  return (
    <SecondaryBtn onClick={handleCopy} style={copied?{color:T.green,borderColor:"rgba(74,222,128,0.28)"}:{}}>
      {copied?"✓ Copied":"Copy summary"}
    </SecondaryBtn>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState(){
  const steps=[
    {n:"01",label:"Describe the product",text:"Product type, power source, connectivity, key functions."},
    {n:"02",label:"Add detail",text:"Materials (food-contact), sensors, battery, certifications needed."},
    {n:"03",label:"Refine iteratively",text:"Use clarification hints to sharpen the route."},
  ];
  return (
    <Card style={{border:`1px dashed rgba(255,255,255,0.08)`}}>
      <div style={{padding:"clamp(24px,5vw,44px) clamp(16px,5vw,32px)",display:"grid",gap:22,justifyItems:"center",textAlign:"center"}}>
        <div style={{
          width:52,height:52,borderRadius:16,
          border:`1px solid rgba(99,172,255,0.18)`,background:"rgba(99,172,255,0.06)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
        }}>⬡</div>
        <div>
          <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:"clamp(18px,3vw,22px)",color:T.text,marginBottom:7}}>
            Ready for analysis
          </div>
          <div style={{fontSize:13,color:T.textSub,lineHeight:1.75,maxWidth:400}}>
            Enter a product description above to generate the standards route and legislation overview.
          </div>
        </div>
        <div style={{display:"grid",gap:8,width:"100%",maxWidth:440,textAlign:"left"}}>
          {steps.map(step=>(
            <div key={step.n} style={{
              display:"flex",gap:13,alignItems:"flex-start",
              padding:"10px 14px",borderRadius:11,
              background:"rgba(255,255,255,0.025)",border:`1px solid ${T.line}`,
            }}>
              <span style={{
                fontSize:9.5,fontWeight:800,color:T.blue,letterSpacing:"0.08em",
                background:"rgba(99,172,255,0.09)",border:`1px solid rgba(99,172,255,0.16)`,
                borderRadius:6,padding:"3px 6px",flexShrink:0,marginTop:1,
              }}>{step.n}</span>
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
function ErrorCard({ message }){
  return (
    <div style={{
      borderRadius:13,border:`1px solid rgba(248,113,113,0.25)`,
      background:"rgba(248,113,113,0.06)",padding:"13px 17px",
      display:"flex",gap:11,alignItems:"flex-start",
    }}>
      <span style={{fontSize:15,flexShrink:0,marginTop:1,color:T.rose}}>⚠</span>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:"#fb7185",marginBottom:4}}>Analysis error</div>
        <div style={{fontSize:13,color:T.textSub,lineHeight:1.6}}>{message}</div>
      </div>
    </div>
  );
}

// ─── Scroll-to-top ────────────────────────────────────────────────────────────
function ScrollTopBtn({ visible }){
  return (
    <button
      onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
      style={{
        position:"fixed",bottom:24,right:20,zIndex:200,
        width:38,height:38,borderRadius:11,
        border:`1px solid ${T.lineStrong}`,background:T.bgCard,
        color:T.textSub,fontSize:15,cursor:"pointer",
        boxShadow:T.shadow,display:"flex",alignItems:"center",justifyContent:"center",
        opacity:visible?1:0,pointerEvents:visible?"auto":"none",
        transition:"opacity 0.25s",
      }}
      title="Back to top"
    >↑</button>
  );
}

// ─── Root app ─────────────────────────────────────────────────────────────────
export default function App(){
  const [description,setDescription]=useState("");
  const [result,setResult]=useState(null);
  const [metadata,setMetadata]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [clarifyDirty,setClarifyDirty]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const resultsRef=useRef(null);

  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>360);
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  useEffect(()=>{
    let active=true;
    fetch(METADATA_URL)
      .then(res=>{ if(!res.ok) throw new Error(`Metadata failed (${res.status})`); return res.json(); })
      .then(data=>{ if(active) setMetadata(data); })
      .catch(()=>{ if(active) setMetadata({traits:[],products:[],legislations:[]}); });
    return()=>{ active=false; };
  },[]);

  const templates=useMemo(()=>{
    const dynamic=buildDynamicTemplates(metadata?.products||[]);
    return dynamic.length?dynamic:DEFAULT_TEMPLATES;
  },[metadata]);

  const chips=useMemo(()=>{
    const backend=(result?.suggested_quick_adds||[]).map(item=>({ label:titleCase(item.label), text:item.text }));
    const frontend=buildGuidedChips(metadata,result);
    return uniqueBy([...backend,...frontend], item=>item.text).slice(0,12);
  },[metadata,result]);

  useEffect(()=>{
    if(!result||!resultsRef.current) return;
    const timer=window.setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),80);
    return()=>window.clearTimeout(timer);
  },[result]);

  const runAnalysis=useCallback(async()=>{
    const payloadDescription=String(description||"").trim();
    if(!payloadDescription) return;
    setBusy(true); setError("");
    try{
      const response=await fetch(ANALYZE_URL,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ description:payloadDescription, depth:"deep" }),
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data?.detail||`Analysis failed (${response.status})`);
      setResult(data); setClarifyDirty(false);
    }catch(err){
      setError(err?.message||"Analysis failed.");
    }finally{
      setBusy(false);
    }
  },[description]);

  const resetAnalysis=useCallback(()=>{
    setResult(null);
    setDescription("");
    setError("");
    setClarifyDirty(false);
    window.scrollTo({top:0,behavior:"smooth"});
  },[]);

  return (
    <div style={{minHeight:"100vh",background:T.bg}}>
      <style>{globalCss}</style>
      <Topbar result={result} onReset={resetAnalysis}/>

      <div style={{maxWidth:1360,margin:"0 auto",padding:"clamp(12px,3vw,22px) clamp(12px,3vw,20px) 80px"}}>
        <div className="app-shell-grid">
          <div className="left-rail-slot">{result?<SidebarRail result={result}/>:null}</div>

          <main style={{display:"grid",gap:12,minWidth:0}}>
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
            {!result?(
              <EmptyState/>
            ):(
              <>
                <GuidanceStrip
                  result={result}
                  dirty={clarifyDirty}
                  busy={busy}
                  onReanalyze={runAnalysis}
                  onApply={text=>{
                    setDescription(cur=>{ const next=joinText(cur,text); if(next!==cur) setClarifyDirty(true); return next; });
                  }}
                />
                <StandardsSection result={result}/>
                <DiagnosticsPanel result={result}/>
                <div style={{display:"flex",justifyContent:"flex-end",gap:8,flexWrap:"wrap",paddingTop:4}}>
                  <CopyResultsButton result={result} description={description}/>
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
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    min-height: 100%;
    font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
    color: ${T.text};
    background: ${T.bg};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button, input, select, textarea { font: inherit; color: inherit; }

  textarea::placeholder { color: ${T.textMuted}; }
  textarea::-webkit-scrollbar { width: 4px; }
  textarea::-webkit-scrollbar-track { background: transparent; }
  textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }

  /* Layout */
  .app-shell-grid {
    display: grid;
    grid-template-columns: 240px minmax(0,1fr);
    gap: 14px;
    align-items: start;
  }
  .left-rail-slot { min-width: 0; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.8s linear infinite; display: inline-block; }

  /* Standard card hover lift */
  .standard-card:hover {
    box-shadow: 0 8px 36px rgba(0,0,0,0.5) !important;
    transform: translateY(-1px);
  }

  button:not(:disabled):hover { filter: brightness(1.10); }
  button:not(:disabled):active { filter: brightness(0.94); transform: scale(0.985); }

  /* ── Responsive ────────────────────────────────────────── */

  /* Sidebar collapses below 1040px — moves below main */
  @media (max-width: 1040px) {
    .app-shell-grid {
      grid-template-columns: 1fr;
    }
    .left-rail, .left-rail-slot {
      position: static !important;
      top: auto !important;
    }
    .left-rail-slot { order: 2; }
    main { order: 1; }
  }

  /* Tablet: meta grid goes single column */
  @media (max-width: 768px) {
    .standard-meta-grid {
      grid-template-columns: 1fr !important;
    }
    .topbar-subtitle { display: none; }
  }

  /* Mobile: further simplify topbar */
  @media (max-width: 480px) {
    .standard-meta-grid {
      grid-template-columns: 1fr !important;
    }
    .topbar-count { display: none; }
    .topbar-new-label { display: none; }
  }
`;