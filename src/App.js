import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

const DIR_NAME = {
  LVD:      "Low Voltage Directive",
  EMC:      "EMC Directive",
  RED:      "RF / Radio Equipment",
  RED_CYBER:"RED Cybersecurity DA",
  CRA:      "Cyber Resilience Act",
  ROHS:     "RoHS Directive",
  REACH:    "REACH Regulation",
  GDPR:     "Data & Privacy",
  AI_Act:   "AI Act",
  ESPR:     "ESPR / Ecodesign",
  OTHER:    "Other",
  SYSTEM:   "System",
};

const DIR_SHORT = {
  LVD:      "LVD",
  EMC:      "EMC",
  RED:      "RED",
  RED_CYBER:"RED-Cyber",
  CRA:      "CRA",
  ROHS:     "RoHS",
  REACH:    "REACH",
  GDPR:     "GDPR",
  AI_Act:   "AI Act",
  ESPR:     "ESPR",
  OTHER:    "Other",
  SYSTEM:   "System",
};

const DIR_ORDER = [
  "LVD","EMC","RED","RED_CYBER","CRA",
  "ROHS","REACH","GDPR","AI_Act","ESPR","OTHER",
];

const DIR = {
  LVD:       { dot:"#6f7566", pill:"#ece8dc", ring:"#cfc7b7", ink:"#505647", accent:"#8a9484", header:"#d8d3c8", stripe:"rgba(111,117,102,0.08)" },
  EMC:       { dot:"#5f8d8b", pill:"#e6f0ef", ring:"#bbd1cf", ink:"#456a69", accent:"#5f8d8b", header:"#d0e4e3", stripe:"rgba(95,141,139,0.08)" },
  RED:       { dot:"#2f5f69", pill:"#e3eef0", ring:"#b2c7cc", ink:"#294b53", accent:"#2f5f69", header:"#cde0e4", stripe:"rgba(47,95,105,0.08)" },
  RED_CYBER: { dot:"#9f7084", pill:"#f1e7eb", ring:"#d8c0c9", ink:"#7a5667", accent:"#9f7084", header:"#e8d8df", stripe:"rgba(159,112,132,0.08)" },
  CRA:       { dot:"#60795f", pill:"#e8efe7", ring:"#c1cec0", ink:"#4a6149", accent:"#60795f", header:"#d5e3d4", stripe:"rgba(96,121,95,0.08)" },
  ROHS:      { dot:"#b7903e", pill:"#f7efd9", ring:"#e5d3a1", ink:"#8f6e2d", accent:"#b7903e", header:"#f0e5c3", stripe:"rgba(183,144,62,0.08)" },
  REACH:     { dot:"#aa7868", pill:"#f5eae6", ring:"#e3cbc2", ink:"#83584a", accent:"#aa7868", header:"#e8d8d0", stripe:"rgba(170,120,104,0.08)" },
  GDPR:      { dot:"#7f9995", pill:"#edf3f2", ring:"#cad9d8", ink:"#607773", accent:"#7f9995", header:"#daeaea", stripe:"rgba(127,153,149,0.08)" },
  AI_Act:    { dot:"#9f7084", pill:"#f1e7eb", ring:"#d8c0c9", ink:"#7a5667", accent:"#9f7084", header:"#e8d8df", stripe:"rgba(159,112,132,0.08)" },
  ESPR:      { dot:"#b7903e", pill:"#f7f0dd", ring:"#e5d7aa", ink:"#8f6e2d", accent:"#b7903e", header:"#f0e8ca", stripe:"rgba(183,144,62,0.08)" },
  OTHER:     { dot:"#8d8779", pill:"#f0ece3", ring:"#d5cec0", ink:"#686356", accent:"#8d8779", header:"#e5e0d7", stripe:"rgba(141,135,121,0.08)" },
  SYSTEM:    { dot:"#8d8779", pill:"#f0ece3", ring:"#d5cec0", ink:"#686356", accent:"#8d8779", header:"#e5e0d7", stripe:"rgba(141,135,121,0.08)" },
};

const STS = {
  FAIL:{ icon:"✕", label:"FAIL", bg:"#f8eef1", border:"#e6d0d6", text:"#8b6474", dot:"#c97a90" },
  WARN:{ icon:"!", label:"WARN", bg:"#fbf5e8", border:"#ecdcae", text:"#9e7d36", dot:"#c9a040" },
  PASS:{ icon:"✓", label:"PASS", bg:"#eef4ee", border:"#ccd7ca", text:"#566554", dot:"#6a9068" },
  INFO:{ icon:"·", label:"INFO", bg:"#eff5f5", border:"#cadada", text:"#517674", dot:"#7fa8a6" },
};

const STD_RE = /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|UL|ASTM|CISPR|ITU|IEC\/EN)\b/i;

const QUICK_CHIPS = [
  { label:"Heating element", text:"heating element" },
  { label:"Wi-Fi / BT",      text:"Wi-Fi and Bluetooth connectivity" },
  { label:"OTA updates",     text:"OTA firmware updates" },
  { label:"Battery",         text:"rechargeable lithium battery" },
  { label:"Food-contact",    text:"food-contact materials" },
  { label:"Cloud account",   text:"cloud account and user data storage" },
  { label:"Motor / pump",    text:"motor and pump" },
  { label:"Display / UI",    text:"display and touch UI" },
];

const PRODUCT_TEMPLATES = [
  { label:"Air fryer",      text:"Smart air fryer with Wi-Fi app control, mains powered, OTA updates, cloud recipe sync, and food-contact basket coating." },
  { label:"Coffee machine", text:"Connected espresso machine with app control, mains powered, OTA updates, cloud brew profiles, water tank sensor, and food-contact brew path." },
  { label:"Robot vacuum",   text:"Robot vacuum cleaner with Wi-Fi and Bluetooth, LiDAR navigation, OTA firmware updates, cloud cleaning schedule, rechargeable lithium battery, and camera." },
  { label:"Air purifier",   text:"Smart air purifier with Wi-Fi control, PM2.5 sensor, OTA firmware updates, cloud air quality logging, and mains power." },
];

/* ------------------------------------------------------------------ */
/* Pure helpers                                                         */
/* ------------------------------------------------------------------ */
function unique(arr){ return [...new Set((arr||[]).filter(Boolean))]; }
function normalizeStdName(s){ return (s||"").replace(/\s+/g," ").trim(); }
function getDirectiveListFromFinding(f){
  return (f.directive||"").split(",").map(x=>x.trim()).filter(Boolean).map(d=>d==="RF"?"RED":d);
}
function statusRank(s){ return {FAIL:4,WARN:3,PASS:2,INFO:1}[s]||1; }
function priorityStatus(statuses){
  if(!statuses||!statuses.length) return "INFO";
  return [...statuses].sort((a,b)=>statusRank(b)-statusRank(a))[0];
}
function isStandardFinding(f){
  const art=(f.article||"").trim();
  return STD_RE.test(art)||/review$/i.test(art);
}
function titleCase(s){
  return String(s||"").replace(/[_-]/g," ").replace(/\s+/g," ").trim().replace(/\b\w/g,m=>m.toUpperCase());
}
function prettyDirectiveName(key){ return DIR_NAME[key]||titleCase(key); }

function inferDirectiveFromText(text){
  const t=(text||"").toLowerCase();
  if(/en\s*18031|18031-1|18031-2|18031-3|red da|delegated act|article 3\.3\(d\)|article 3\.3\(e\)|article 3\.3\(f\)/.test(t)) return "RED_CYBER";
  if(/cyber resilience act|\bcra\b|sbom|vulnerability|secure development/.test(t)) return "CRA";
  if(/rohs|2011\/65\/eu|iec 63000|en iec 63000|62321/.test(t)) return "ROHS";
  if(/\breach\b|1907\/2006|svhc|article 33/.test(t)) return "REACH";
  if(/60335|60730|62233|electrical safety|appliance safety/.test(t)) return "LVD";
  if(/55014|61000|emc|electromagnetic|cispr|harmonic|flicker|esd|surge|immunity/.test(t)) return "EMC";
  if(/300 328|301 489|300 220|300 330|wireless|bluetooth|wifi|wi-fi|zigbee|matter|nfc|lte|5g/.test(t)) return "RED";
  if(/gdpr|privacy|personal data|data protection/.test(t)) return "GDPR";
  if(/ai act|artificial intelligence|machine learning|model/.test(t)) return "AI_Act";
  if(/ecodesign|espr|repairability|durability|energy/.test(t)) return "ESPR";
  return "OTHER";
}

function enrichDirectives(f){
  const combined=[f.article,f.finding,f.action].filter(Boolean).join(" ");
  const inferred=inferDirectiveFromText(combined);
  let explicit=getDirectiveListFromFinding(f).filter(d=>d!=="SYSTEM");
  if(/en\s*18031|18031-1|18031-2|18031-3/i.test(combined.toLowerCase())){
    explicit=explicit.filter(d=>d!=="CRA"&&d!=="RED");
    explicit.push("RED_CYBER");
  }
  if(inferred==="RED_CYBER"&&!explicit.includes("RED_CYBER")) explicit.push("RED_CYBER");
  if(!explicit.length) explicit=inferred?[inferred]:["OTHER"];
  return unique(explicit);
}

function standardStatusFromItem(item){
  return item.item_type==="review"?"WARN":"PASS";
}

function buildGroupsFromBackendItems(standards,reviewItems){
  const all=[...(standards||[]),...(reviewItems||[])];
  const map=new Map();
  all.forEach(row=>{
    const name=normalizeStdName(row.code||row.title||"Unnamed item");
    const directive=row.directive||row.legislation_key||"OTHER";
    const key=directive+"::"+name.toLowerCase();
    const status=standardStatusFromItem(row);
    const findingText=row.title||"";
    const actionText=row.reason||row.notes||"";
    if(!map.has(key)){
      map.set(key,{name,directives:[directive],statuses:[status],findings:[{finding:findingText,action:actionText,status}],actions:actionText?[actionText]:[]});
      return;
    }
    const curr=map.get(key);
    curr.directives=unique([...curr.directives,directive]);
    curr.statuses=unique([...curr.statuses,status]);
    if(actionText) curr.actions=unique([...curr.actions,actionText]);
    curr.findings.push({finding:findingText,action:actionText,status});
  });
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
}

function categoriseFindings(findings,knownStdNames){
  const toCheck=[];
  const notes=[];
  const stdSet=knownStdNames||new Set();
  (findings||[]).forEach((f,i)=>{
    const row=Object.assign({},f,{_i:i});
    const art=(f.article||"").trim();
    const findingText=(f.finding||"").trim();
    if(isStandardFinding(f)) return;
    const artLow=art.toLowerCase();
    const findLow=findingText.toLowerCase();
    const coversKnownStd=[...stdSet].some(name=>{
      const n=name.toLowerCase();
      return artLow===n||(n.length>8&&(artLow.includes(n)||findLow.includes(n)));
    });
    if(coversKnownStd) return;
    const isUncertain=
      /Missing|unclear|not specified|confirm|check whether|verify|not confirmed/i.test(art)||
      /Missing|unclear|not specified|confirm|check whether|verify|not confirmed/i.test(findingText);
    if(isUncertain){ toCheck.push(row); } else { notes.push(row); }
  });
  return {toCheck,notes};
}

function tagToneForSignal(signal){
  if(signal==="high")   return {bg:"#f8eef1",bd:"#e6d0d6",tx:"#8b6474"};
  if(signal==="medium") return {bg:"#fbf5e8",bd:"#ecdcae",tx:"#9e7d36"};
  if(signal==="good")   return {bg:"#eef4ee",bd:"#ccd7ca",tx:"#566554"};
  return {bg:"#eff5f5",bd:"#cadada",tx:"#517674"};
}

/* ------------------------------------------------------------------ */
/* History helpers                                                      */
/* ------------------------------------------------------------------ */
const HISTORY_KEY = "regcheck_history_v1";
const MAX_HISTORY = 10;

function loadHistory(){
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
  } catch { return []; }
}
function saveHistory(entries){
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0,MAX_HISTORY))); } catch {}
}

/* ------------------------------------------------------------------ */
/* Export helpers                                                       */
/* ------------------------------------------------------------------ */
function buildExportText(text, standardGroups, standardsByDirective, notes, toCheck){
  const lines=[];
  lines.push("RegCheck — Compliance Analysis Export");
  lines.push("Product: "+text.trim());
  lines.push("Date: "+new Date().toLocaleString());
  lines.push("");
  lines.push("=== APPLICABLE STANDARDS ===");
  DIR_ORDER.forEach(d=>{
    const grps=standardsByDirective[d];
    if(!grps||!grps.length) return;
    lines.push("\n-- "+prettyDirectiveName(d)+" --");
    grps.forEach(g=>{
      lines.push("  "+g.name+" ["+priorityStatus(g.statuses)+"]");
      g.findings.forEach(f=>{
        if(f.finding) lines.push("    • "+f.finding);
        if(f.action) lines.push("      → "+f.action);
      });
    });
  });
  if(notes.length){
    lines.push("\n=== APPLICABLE LEGISLATIONS ===");
    notes.forEach(f=>{
      lines.push("  • "+(f.finding||f.article||""));
      if(f.action) lines.push("    → "+f.action);
    });
  }
  if(toCheck.length){
    lines.push("\n=== THINGS TO VERIFY ===");
    toCheck.forEach((f,i)=>{
      const label=(f.article||f.finding||"").replace(/^Missing[:\s]*/i,"").replace(/^Check[:\s]*/i,"").trim();
      lines.push("  "+(i+1)+". "+label);
      if(f.action) lines.push("     → "+f.action);
    });
  }
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Atoms                                                                */
/* ------------------------------------------------------------------ */

function DirPill({dirKey,size="sm",active,onClick}){
  const tone=DIR[dirKey]||DIR.OTHER;
  const fs=size==="sm"?11:13;
  return(
    <span
      onClick={onClick}
      style={{
        display:"inline-flex",alignItems:"center",gap:5,
        padding:size==="sm"?"2px 9px 2px 7px":"3px 11px 3px 9px",
        borderRadius:999,border:"1px solid "+(active?tone.dot:tone.ring),
        background:active?tone.dot:tone.pill,
        color:active?"#fff":tone.ink,
        fontSize:fs,fontWeight:800,letterSpacing:"0.04em",whiteSpace:"nowrap",
        cursor:onClick?"pointer":"default",
        transition:"all 0.15s",
        boxShadow:active?"0 1px 6px rgba(0,0,0,0.12)":"none",
      }}>
      <span style={{width:6,height:6,borderRadius:999,background:active?"rgba(255,255,255,0.7)":tone.dot,flexShrink:0}}/>
      {DIR_SHORT[dirKey]||dirKey}
    </span>
  );
}

function StatusBadge({status,small}){
  const s=STS[status]||STS.INFO;
  const fs=small?12:13;
  return(
    <span style={{
      display:"inline-flex",alignItems:"center",gap:5,
      padding:small?"3px 9px":"4px 11px",
      borderRadius:999,border:"1px solid "+s.border,
      background:s.bg,color:s.text,
      fontSize:fs,fontWeight:900,lineHeight:1,whiteSpace:"nowrap",
    }}>
      <span style={{width:6,height:6,borderRadius:999,background:s.dot,flexShrink:0}}/>
      {s.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton loader                                                      */
/* ------------------------------------------------------------------ */
function SkeletonPulse({w="100%",h=16,r=8,mb=0}){
  return(
    <div style={{
      width:w,height:h,borderRadius:r,marginBottom:mb,
      background:"linear-gradient(90deg,rgba(200,193,183,0.35) 25%,rgba(220,214,206,0.55) 50%,rgba(200,193,183,0.35) 75%)",
      backgroundSize:"200% 100%",
      animation:"skeletonShimmer 1.6s infinite",
    }}/>
  );
}

function LoadingSkeleton(){
  return(
    <div style={{display:"grid",gap:14}}>
      {/* Summary bar skeleton */}
      <div style={{
        display:"flex",gap:0,borderRadius:18,
        border:"1px solid rgba(183,175,163,0.3)",
        overflow:"hidden",background:"rgba(255,255,255,0.55)",
        backdropFilter:"blur(16px)",
      }}>
        {[100,80,80,80].map((w,i)=>(
          <div key={i} style={{flex:"1 1 auto",padding:"14px 20px",borderRight:i<3?"1px solid rgba(183,175,163,0.25)":"none"}}>
            <SkeletonPulse w={60} h={10} r={6} mb={10}/>
            <SkeletonPulse w={w} h={22} r={6}/>
          </div>
        ))}
      </div>
      {/* Main panel skeleton */}
      <div style={{
        borderRadius:22,border:"1px solid rgba(183,175,163,0.28)",
        background:"rgba(255,255,255,0.62)",backdropFilter:"blur(18px)",overflow:"hidden",
      }}>
        <div style={{padding:"16px 20px 14px",borderBottom:"1px solid rgba(188,178,165,0.22)"}}>
          <SkeletonPulse w={180} h={18} r={8}/>
        </div>
        <div style={{padding:"14px",display:"grid",gap:10}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{borderRadius:16,border:"1px solid rgba(200,193,183,0.35)",overflow:"hidden"}}>
              <div style={{padding:"13px 16px",background:"rgba(230,225,218,0.4)",display:"flex",alignItems:"center",gap:10}}>
                <SkeletonPulse w={10} h={10} r={99}/>
                <SkeletonPulse w={140} h={14} r={6}/>
                <div style={{marginLeft:"auto"}}><SkeletonPulse w={28} h={24} r={99}/></div>
              </div>
              <div style={{padding:"10px 16px 14px",display:"grid",gap:8}}>
                {[0,1].map(j=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(188,178,165,0.12)"}}>
                    <SkeletonPulse w={3} h={28} r={99}/>
                    <SkeletonPulse w={`${60+j*15}%`} h={14} r={6}/>
                    <div style={{marginLeft:"auto"}}><SkeletonPulse w={48} h={22} r={99}/></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StandardRow                                                          */
/* ------------------------------------------------------------------ */

function StandardRow({group,expanded,onToggle}){
  const topStatus=priorityStatus(group.statuses);
  const d=(group.directives&&group.directives[0])||"OTHER";
  const tone=DIR[d]||DIR.OTHER;

  return(
    <div style={{borderBottom:"1px solid rgba(188,178,165,0.15)"}}>
      <div
        onClick={onToggle}
        style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px 11px 0",cursor:"pointer",transition:"background 0.12s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.4)";}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
      >
        <span style={{width:3,alignSelf:"stretch",borderRadius:99,background:tone.accent,flexShrink:0,minHeight:24,marginLeft:0}}/>
        <span style={{flex:1,fontSize:15,fontWeight:700,color:"#2c2925",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingLeft:8}}>
          {group.name}
        </span>
        <StatusBadge status={topStatus} small={true}/>
        <span style={{
          fontSize:11,color:"#9e9890",marginLeft:4,
          transition:"transform 0.2s",
          transform:expanded?"rotate(180deg)":"rotate(0deg)",
          display:"inline-block",flexShrink:0,fontWeight:900,
        }}>▾</span>
      </div>

      {expanded&&(
        <div style={{marginLeft:4,marginBottom:12,borderLeft:"2px solid "+tone.ring,paddingLeft:16,marginRight:8,display:"grid",gap:8}}>
          {group.findings.map((f,idx)=>{
            const rowStatus=f.status||topStatus;
            const signal=rowStatus==="FAIL"?"high":rowStatus==="WARN"?"medium":rowStatus==="PASS"?"good":"neutral";
            const tagTone=tagToneForSignal(signal);
            return(
              <div key={group.name+"-"+idx} style={{borderRadius:10,border:"1px solid "+tagTone.bd,background:tagTone.bg,padding:"11px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <StatusBadge status={rowStatus} small={true}/>
                </div>
                {f.finding&&<div style={{fontSize:14,fontWeight:700,color:"#2f2c28",lineHeight:1.5}}>{f.finding}</div>}
                {f.action&&<div style={{marginTop:5,fontSize:13,color:"#7a746b",lineHeight:1.6}}>{f.action}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DirectiveLane                                                        */
/* ------------------------------------------------------------------ */

function DirectiveLane({dirKey,groups,expandedStandards,onToggleStandard}){
  const [open,setOpen]=useState(true);
  const tone=DIR[dirKey]||DIR.OTHER;

  return(
    <div style={{borderRadius:16,border:"1px solid "+tone.ring,overflow:"hidden",background:"rgba(255,255,255,0.72)"}}>
      <div
        onClick={()=>setOpen(o=>!o)}
        style={{
          display:"flex",alignItems:"center",gap:10,
          padding:"13px 16px",cursor:"pointer",
          background:tone.header,
          borderBottom:open?"1px solid "+tone.ring:"none",
        }}
      >
        <span style={{width:10,height:10,borderRadius:999,background:tone.dot,flexShrink:0}}/>
        <span style={{fontSize:14,fontWeight:900,color:tone.ink,flex:1,letterSpacing:"0.02em"}}>
          {prettyDirectiveName(dirKey)}
        </span>
        <span style={{
          minWidth:24,height:24,padding:"0 8px",borderRadius:999,
          background:tone.ring,color:tone.ink,
          fontWeight:900,fontSize:12,
          display:"inline-flex",alignItems:"center",justifyContent:"center",
        }}>
          {groups.length}
        </span>
        <span style={{
          fontSize:11,color:tone.ink,opacity:0.7,
          transform:open?"rotate(180deg)":"rotate(0deg)",
          display:"inline-block",transition:"transform 0.2s",fontWeight:900,
        }}>▾</span>
      </div>

      {open&&(
        <div style={{padding:"0 0 4px"}}>
          {groups.map(group=>{
            const key=dirKey+"::"+group.name;
            return(
              <StandardRow
                key={key}
                group={group}
                expanded={!!expandedStandards[key]}
                onToggle={()=>onToggleStandard(key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CheckItem                                                            */
/* ------------------------------------------------------------------ */

function CheckItem({finding,index}){
  const directives=enrichDirectives(finding);
  const tone=DIR[directives[0]||"OTHER"]||DIR.OTHER;
  const rawLabel=(finding.article||finding.finding||"").trim();
  const label=rawLabel.replace(/^Missing[:\s]*/i,"").replace(/^Check[:\s]*/i,"").trim();
  const shortLabel=label.length>72?label.slice(0,70)+"…":label;
  const body=(finding.action||(finding.article?finding.finding:"")||"").trim();

  return(
    <div style={{
      padding:"12px 14px",borderRadius:12,
      border:"1px solid "+tone.ring,
      background:"rgba(255,255,255,0.8)",
      display:"grid",gap:7,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
        <span style={{
          width:22,height:22,borderRadius:999,flexShrink:0,
          background:tone.accent,color:"#fff",
          fontSize:11,fontWeight:900,
          display:"inline-flex",alignItems:"center",justifyContent:"center",
        }}>{index+1}</span>
        {directives.map(d=><DirPill key={d} dirKey={d}/>)}
      </div>
      <div style={{fontSize:14,fontWeight:800,color:"#2c2925",lineHeight:1.45}}>
        {shortLabel||"Confirm applicability"}
      </div>
      {body&&body!==shortLabel&&(
        <div style={{fontSize:13,color:"#7a746b",lineHeight:1.55}}>{body}</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LegislationItem                                                      */
/* ------------------------------------------------------------------ */

function LegislationItem({finding}){
  const status=finding.status||"INFO";
  const directives=enrichDirectives(finding);
  const s=STS[status]||STS.INFO;
  const d=directives[0]||"OTHER";
  const tone=DIR[d]||DIR.OTHER;

  return(
    <div style={{
      display:"flex",gap:12,alignItems:"flex-start",
      padding:"12px 14px",borderRadius:12,
      background:"rgba(255,255,255,0.72)",
      border:"1px solid "+tone.ring,
    }}>
      <div style={{
        width:32,height:32,borderRadius:8,flexShrink:0,
        background:tone.pill,border:"1px solid "+tone.ring,
        display:"flex",alignItems:"center",justifyContent:"center",
        color:tone.ink,fontSize:14,fontWeight:900,
      }}>{s.icon}</div>
      <div style={{minWidth:0,flex:1}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
          {directives.map(d=><DirPill key={d} dirKey={d}/>)}
          <StatusBadge status={status} small={true}/>
        </div>
        <div style={{fontSize:14,fontWeight:700,color:"#2f2c28",lineHeight:1.45}}>
          {finding.finding||finding.article||"Legislation note"}
        </div>
        {finding.action&&(
          <div style={{marginTop:4,fontSize:13,color:"#7a746b",lineHeight:1.55}}>{finding.action}</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                           */
/* ------------------------------------------------------------------ */

function EmptyState({title,subtitle}){
  return(
    <div style={{
      borderRadius:12,border:"1px dashed rgba(186,176,160,0.7)",
      background:"rgba(250,247,242,0.6)",padding:"24px 20px",
      color:"#807b73",textAlign:"center",
    }}>
      <div style={{fontSize:16,fontWeight:800,color:"#59544c"}}>{title}</div>
      {subtitle&&<div style={{marginTop:6,fontSize:14,lineHeight:1.55}}>{subtitle}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SummaryBar                                                           */
/* ------------------------------------------------------------------ */

function SummaryBar({topRisk,standardGroups,standardsByDirective,toCheck}){
  const riskColor=topRisk==="FAIL"?DIR.RED_CYBER:topRisk==="WARN"?DIR.ROHS:topRisk==="PASS"?DIR.CRA:DIR.EMC;
  const items=[
    {label:"Overall Risk",value:topRisk,c:riskColor,big:true},
    {label:"Standards",value:standardGroups.length,c:DIR.LVD},
    {label:"Directives",value:Object.keys(standardsByDirective).length,c:DIR.EMC},
    ...(toCheck.length>0?[{label:"To Verify",value:toCheck.length,c:DIR.ROHS}]:[]),
  ];
  return(
    <div style={{
      display:"flex",gap:0,borderRadius:18,
      border:"1px solid rgba(183,175,163,0.3)",
      overflow:"hidden",background:"rgba(255,255,255,0.55)",
      backdropFilter:"blur(16px)",flexWrap:"wrap",
    }}>
      {items.map((item,i)=>(
        <div key={item.label} style={{
          flex:"1 1 auto",padding:"14px 20px",
          borderRight:i<items.length-1?"1px solid rgba(183,175,163,0.25)":"none",
          background:i===0?item.c.pill:"transparent",
        }}>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.1em",color:item.c.ink,opacity:0.7,marginBottom:3,textTransform:"uppercase"}}>{item.label}</div>
          <div style={{fontSize:item.big?24:22,fontWeight:900,color:item.c.ink,lineHeight:1}}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HistoryPanel                                                         */
/* ------------------------------------------------------------------ */

function HistoryPanel({history,onLoad,onDelete,onClear}){
  const [open,setOpen]=useState(false);
  if(!history.length) return null;
  return(
    <div style={{position:"relative"}}>
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{
          display:"flex",alignItems:"center",gap:7,
          padding:"7px 14px",borderRadius:11,
          border:"1px solid rgba(197,190,180,0.7)",
          background:open?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.55)",
          color:"#5c5750",fontWeight:700,fontSize:13,
          cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s",
        }}
      >
        <span style={{fontSize:15}}>🕑</span>
        History
        <span style={{
          minWidth:18,height:18,padding:"0 5px",borderRadius:99,
          background:"rgba(143,148,132,0.18)",color:"#6b6760",
          fontWeight:900,fontSize:11,
          display:"inline-flex",alignItems:"center",justifyContent:"center",
        }}>{history.length}</span>
      </button>
      {open&&(
        <div style={{
          position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:100,
          width:340,borderRadius:16,
          border:"1px solid rgba(197,190,180,0.7)",
          background:"rgba(252,250,247,0.98)",
          backdropFilter:"blur(20px)",
          boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
          overflow:"hidden",
        }}>
          <div style={{
            padding:"12px 16px",borderBottom:"1px solid rgba(197,190,180,0.4)",
            display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <span style={{fontSize:14,fontWeight:900,color:"#3a3630"}}>Recent Analyses</span>
            <button onClick={()=>{onClear();setOpen(false);}} style={{
              padding:"4px 10px",borderRadius:8,border:"1px solid rgba(197,190,180,0.7)",
              background:"transparent",color:"#9e9890",fontSize:12,fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",
            }}>Clear all</button>
          </div>
          <div style={{maxHeight:320,overflowY:"auto",padding:"8px"}}>
            {history.map(entry=>(
              <div key={entry.id} style={{
                display:"flex",alignItems:"flex-start",gap:10,
                padding:"10px 12px",borderRadius:10,
                border:"1px solid rgba(197,190,180,0.3)",
                background:"rgba(255,255,255,0.6)",
                marginBottom:6,cursor:"pointer",transition:"background 0.12s",
              }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.95)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.6)"}
              onClick={()=>{onLoad(entry);setOpen(false);}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#2c2925",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {entry.text.slice(0,60)+(entry.text.length>60?"…":"")}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:5,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#b0a89d"}}>{entry.time}</span>
                    {entry.directives&&entry.directives.slice(0,3).map(d=><DirPill key={d} dirKey={d}/>)}
                    {entry.directives&&entry.directives.length>3&&(
                      <span style={{fontSize:11,color:"#9e9890",fontWeight:700}}>+{entry.directives.length-3}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={e=>{e.stopPropagation();onDelete(entry.id);}}
                  style={{
                    flexShrink:0,width:22,height:22,borderRadius:6,
                    border:"none",background:"rgba(0,0,0,0.06)",
                    color:"#9e9890",fontSize:13,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sticky New Analysis Bar                                              */
/* ------------------------------------------------------------------ */

function StickyBar({onNewAnalysis}){
  return(
    <div style={{
      position:"fixed",bottom:0,left:0,right:0,zIndex:50,
      padding:"12px 20px",
      background:"rgba(218,212,204,0.88)",
      backdropFilter:"blur(20px)",
      borderTop:"1px solid rgba(183,175,163,0.35)",
      display:"flex",justifyContent:"center",
    }}>
      <button
        onClick={onNewAnalysis}
        style={{
          padding:"10px 28px",borderRadius:12,
          border:"1px solid rgba(90,129,136,0.6)",
          background:"linear-gradient(180deg,#6f9199,#567a82)",
          color:"#fffdf8",fontWeight:900,fontSize:14,
          cursor:"pointer",
          boxShadow:"0 4px 16px rgba(86,122,130,0.3)",
          transition:"all 0.14s",fontFamily:"inherit",letterSpacing:"-0.01em",
        }}
        onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.08)"}
        onMouseLeave={e=>e.currentTarget.style.filter="brightness(1)"}
      >
        ↑ New Analysis
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                  */
/* ------------------------------------------------------------------ */

export default function App(){
  const [mode,setMode]=useState("standard");
  const [text,setText]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [expandedStandards,setExpandedStandards]=useState({});
  const [search,setSearch]=useState("");
  const [legsOpen,setLegsOpen]=useState(true);
  const [activeDirectiveFilter,setActiveDirectiveFilter]=useState(null); // NEW: directive filter
  const [history,setHistory]=useState(()=>loadHistory());                // NEW: history
  const [copied,setCopied]=useState(false);                               // NEW: export feedback
  const inputRef=useRef(null);
  const topRef=useRef(null);

  const runAnalysis=useCallback(function(payloadText){
    const trimmed=((payloadText!==undefined?payloadText:text)||"").trim();
    if(!trimmed) return Promise.resolve();
    setLoading(true);
    setError("");
    setResult(null);
    setActiveDirectiveFilter(null);
    return fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({description:trimmed,depth:mode,category:"",directives:[]}),
    })
    .then(res=>res.json().then(data=>{
      if(!res.ok) throw new Error((data&&data.detail)||"Analysis failed");
      setResult(data);
      const initialExpanded={};
      buildGroupsFromBackendItems(data.standards||[],data.review_items||[]).forEach(group=>{
        const directive=(group.directives&&group.directives[0])||"OTHER";
        initialExpanded[directive+"::"+group.name]=true;
      });
      setExpandedStandards(initialExpanded);
    }))
    .catch(err=>{
      setError((err&&err.message)||"Analysis failed");
      setResult(null);
    })
    .finally(()=>setLoading(false));
  },[mode,text]);

  useEffect(()=>{
    if(inputRef.current&&window.innerWidth>900) inputRef.current.focus();
  },[]);

  const standardGroups=useMemo(()=>
    buildGroupsFromBackendItems((result&&result.standards)||[],(result&&result.review_items)||[]),
    [result]
  );

  const categorised=useMemo(()=>{
    const knownStdNames=new Set(standardGroups.map(g=>g.name));
    return categoriseFindings((result&&result.findings)||[],knownStdNames);
  },[result,standardGroups]);

  const toCheck=categorised.toCheck;
  const notes=categorised.notes;

  // Save to history when we get a result
  useEffect(()=>{
    if(!result||!text.trim()) return;
    const directives=DIR_ORDER.filter(d=>{
      const grps={};
      buildGroupsFromBackendItems(result.standards||[],result.review_items||[]).forEach(g=>{
        const dir=(g.directives&&g.directives[0])||"OTHER";
        if(!grps[dir]) grps[dir]=[];
        grps[dir].push(g);
      });
      return grps[d]&&grps[d].length;
    });
    const entry={
      id:Date.now().toString(),
      text:text.trim(),
      time:new Date().toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}),
      result,
      directives,
      mode,
    };
    setHistory(prev=>{
      const next=[entry,...prev.filter(h=>h.text!==entry.text)];
      saveHistory(next);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[result]);

  const filteredStandardGroups=useMemo(()=>{
    let groups=standardGroups;
    // Directive filter
    if(activeDirectiveFilter){
      groups=groups.filter(g=>(g.directives||[]).includes(activeDirectiveFilter));
    }
    // Text search
    const q=search.trim().toLowerCase();
    if(!q) return groups;
    return groups.filter(g=>{
      const hay=[g.name,...(g.directives||[]),...(g.actions||[]),...(g.findings||[]).map(f=>(f.finding||"")+" "+(f.action||""))].join(" ").toLowerCase();
      return hay.includes(q);
    });
  },[search,standardGroups,activeDirectiveFilter]);

  const standardsByDirective=useMemo(()=>{
    const groups={};
    filteredStandardGroups.forEach(g=>{
      const d=(g.directives&&g.directives[0])||"OTHER";
      if(!groups[d]) groups[d]=[];
      groups[d].push(g);
    });
    return groups;
  },[filteredStandardGroups]);

  // Unfiltered directive map (for header pills)
  const allDirectives=useMemo(()=>{
    const map={};
    standardGroups.forEach(g=>{
      const d=(g.directives&&g.directives[0])||"OTHER";
      if(!map[d]) map[d]=[];
      map[d].push(g);
    });
    return map;
  },[standardGroups]);

  const topRisk=useMemo(()=>{
    const statuses=[
      ...((result&&result.findings)||[]).map(f=>f.status).filter(Boolean),
      ...standardGroups.flatMap(g=>g.statuses||[]),
    ];
    return priorityStatus(statuses);
  },[result,standardGroups]);

  function appendChip(chipText){
    setText(t=>{
      const trimmed=t.trimEnd();
      if(!trimmed) return chipText.charAt(0).toUpperCase()+chipText.slice(1);
      return /[.!?]$/.test(trimmed)?trimmed+" "+chipText:trimmed+", "+chipText;
    });
    if(inputRef.current) inputRef.current.focus();
  }

  // Collapse / Expand all
  function setAllExpanded(val){
    const next={};
    standardGroups.forEach(g=>{
      const d=(g.directives&&g.directives[0])||"OTHER";
      next[d+"::"+g.name]=val;
    });
    setExpandedStandards(next);
  }

  // Export
  function handleExport(){
    const txt=buildExportText(text,standardGroups,allDirectives,notes,toCheck);
    navigator.clipboard.writeText(txt).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false),2000);
    }).catch(()=>{
      // Fallback
      const el=document.createElement("textarea");
      el.value=txt;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(()=>setCopied(false),2000);
    });
  }

  // Load from history
  function handleLoadHistory(entry){
    setText(entry.text);
    setResult(entry.result);
    setActiveDirectiveFilter(null);
    const initialExpanded={};
    buildGroupsFromBackendItems(entry.result.standards||[],entry.result.review_items||[]).forEach(group=>{
      const directive=(group.directives&&group.directives[0])||"OTHER";
      initialExpanded[directive+"::"+group.name]=true;
    });
    setExpandedStandards(initialExpanded);
    setTimeout(()=>topRef.current&&topRef.current.scrollIntoView({behavior:"smooth"}),50);
  }

  function handleNewAnalysis(){
    topRef.current&&topRef.current.scrollIntoView({behavior:"smooth"});
    setTimeout(()=>inputRef.current&&inputRef.current.focus(),300);
  }

  const hasResults=!!result;
  const hasSidebar=hasResults&&toCheck.length>0;
  const hasLegislations=hasResults&&notes.length>0;
  const allExpanded=Object.values(expandedStandards).every(Boolean);

  return(
    <div style={{
      minHeight:"100vh",
      background:"radial-gradient(ellipse at top left, rgba(133,176,190,0.25), transparent 30%), radial-gradient(ellipse at top right, rgba(204,189,148,0.2), transparent 28%), linear-gradient(180deg,#ddd7cf 0%,#d4cdc4 100%)",
      padding:"24px 20px 100px",
      fontFamily:"'DM Sans','Helvetica Neue',Arial,sans-serif",
      color:"#3d3832",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&display=swap');
        *{box-sizing:border-box;}
        ::placeholder{color:#b0a89d;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:rgba(150,140,128,0.35);border-radius:99px;}
        textarea:focus,input:focus{outline:none;}
        .chip-btn:hover{background:rgba(255,255,255,0.95)!important;border-color:#b0a89d!important;}
        .tmpl-btn:hover{background:rgba(255,255,255,0.9)!important;}
        .run-btn:not(:disabled):hover{filter:brightness(1.06);}
        .mode-seg-btn:hover{background:rgba(255,255,255,0.18)!important;}
        .clear-btn:hover{background:rgba(255,255,255,0.95)!important;}
        @keyframes skeletonShimmer{
          0%{background-position:200% 0}
          100%{background-position:-200% 0}
        }
        @keyframes fadeIn{
          from{opacity:0;transform:translateY(6px)}
          to{opacity:1;transform:translateY(0)}
        }
        .results-appear{animation:fadeIn 0.25s ease both;}
      `}</style>

      <div ref={topRef} style={{maxWidth:1120,margin:"0 auto",display:"grid",gap:14}}>

        {/* ── HEADER ── */}
        <header style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"16px 22px",borderRadius:20,
          background:"rgba(255,255,255,0.55)",
          border:"1px solid rgba(183,175,163,0.3)",
          backdropFilter:"blur(20px)",flexWrap:"wrap",gap:12,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:13}}>
            <div style={{
              width:40,height:40,borderRadius:12,
              background:"linear-gradient(135deg,#8fb6c1,#5d848f)",
              display:"grid",placeItems:"center",
              color:"white",fontWeight:900,fontSize:14,letterSpacing:"-0.02em",
            }}>RC</div>
            <div>
              <div style={{fontSize:20,fontWeight:900,color:"#2a2520",letterSpacing:"-0.03em",lineHeight:1}}>RegCheck</div>
              <div style={{fontSize:12,fontWeight:700,color:"#9e9890",marginTop:1}}>EU Product Compliance Analyser</div>
            </div>
            <span style={{fontSize:11,fontWeight:800,color:"#8c887f",background:"rgba(0,0,0,0.07)",borderRadius:99,padding:"2px 9px",alignSelf:"flex-start",marginTop:1}}>v4</span>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            {/* Clickable directive filter pills in header */}
            {hasResults&&(
              <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                {DIR_ORDER.filter(d=>allDirectives[d]&&allDirectives[d].length).map(d=>(
                  <DirPill
                    key={d}
                    dirKey={d}
                    active={activeDirectiveFilter===d}
                    onClick={()=>setActiveDirectiveFilter(prev=>prev===d?null:d)}
                  />
                ))}
              </div>
            )}
            {/* History button */}
            <HistoryPanel
              history={history}
              onLoad={handleLoadHistory}
              onDelete={id=>setHistory(prev=>{const next=prev.filter(h=>h.id!==id);saveHistory(next);return next;})}
              onClear={()=>setHistory([])||saveHistory([])}
            />
          </div>
        </header>

        {/* ── SUMMARY BAR ── */}
        {hasResults&&(
          <div className="results-appear">
            <SummaryBar
              topRisk={topRisk}
              standardGroups={standardGroups}
              standardsByDirective={allDirectives}
              toCheck={toCheck}
            />
          </div>
        )}

        {/* ── INPUT PANEL ── */}
        <div style={{
          borderRadius:22,border:"1px solid rgba(183,175,163,0.3)",
          background:"rgba(255,255,255,0.65)",
          backdropFilter:"blur(20px)",overflow:"hidden",
        }}>
          {/* Textarea */}
          <div style={{padding:"18px 20px 0"}}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter") runAnalysis();}}
              placeholder="Describe the product — e.g. Smart air fryer with Wi-Fi, mains powered, OTA updates, food-contact basket coating..."
              style={{
                width:"100%",minHeight:96,resize:"vertical",
                border:"none",background:"transparent",
                fontSize:16,lineHeight:1.65,color:"#2e2b27",fontFamily:"inherit",
              }}
            />
          </div>

          {/* Quick chips */}
          <div style={{padding:"10px 20px",borderTop:"1px solid rgba(188,178,165,0.18)"}}>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              <span style={{fontSize:11,fontWeight:800,color:"#b0a89d",letterSpacing:"0.1em",marginRight:2,textTransform:"uppercase"}}>Add</span>
              {QUICK_CHIPS.map(chip=>(
                <button key={chip.label} type="button" className="chip-btn"
                  onClick={()=>appendChip(chip.text)}
                  style={{
                    padding:"5px 12px",borderRadius:99,
                    border:"1px solid rgba(200,192,182,0.7)",
                    background:"rgba(255,255,255,0.65)",
                    color:"#5c5750",fontWeight:700,fontSize:13,
                    cursor:"pointer",transition:"all 0.12s",fontFamily:"inherit",
                  }}>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls row */}
          <div style={{
            padding:"12px 20px 16px",
            borderTop:"1px solid rgba(188,178,165,0.18)",
            display:"flex",alignItems:"center",
            justifyContent:"space-between",gap:12,flexWrap:"wrap",
          }}>
            {/* Templates */}
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              <span style={{fontSize:11,fontWeight:800,color:"#b0a89d",letterSpacing:"0.1em",marginRight:2,textTransform:"uppercase"}}>Template</span>
              {PRODUCT_TEMPLATES.map(tpl=>(
                <button key={tpl.label} type="button" className="tmpl-btn"
                  onClick={()=>{setText(tpl.text);if(inputRef.current) inputRef.current.focus();}}
                  style={{
                    padding:"5px 12px",borderRadius:99,
                    border:"1px solid rgba(200,192,182,0.7)",
                    background:text===tpl.text?"rgba(143,182,193,0.2)":"rgba(255,255,255,0.55)",
                    color:text===tpl.text?"#3e7080":"#5c5750",
                    fontWeight:700,fontSize:13,cursor:"pointer",
                    transition:"all 0.12s",fontFamily:"inherit",
                  }}>
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Action group */}
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              {/* Mode selector */}
              <div style={{display:"flex",borderRadius:12,border:"1px solid rgba(197,190,180,0.7)",overflow:"hidden",background:"rgba(255,255,255,0.45)"}}>
                {[["quick","Quick"],["standard","Standard"],["deep","Deep"]].map(([val,lbl])=>{
                  const active=mode===val;
                  return(
                    <button key={val} type="button" className="mode-seg-btn"
                      onClick={()=>setMode(val)}
                      style={{
                        padding:"7px 15px",border:"none",
                        borderRight:val!=="deep"?"1px solid rgba(197,190,180,0.5)":"none",
                        background:active?"linear-gradient(180deg,#6f9199,#567a82)":"transparent",
                        color:active?"#fffdf8":"#7f7a71",
                        fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",
                      }}>
                      {lbl}
                    </button>
                  );
                })}
              </div>
              <button type="button" className="clear-btn"
                onClick={()=>{setText("");setResult(null);setError("");setActiveDirectiveFilter(null);}}
                style={{
                  padding:"8px 15px",borderRadius:11,
                  border:"1px solid rgba(197,190,180,0.7)",
                  background:"rgba(255,255,255,0.72)",
                  color:"#6f6a61",fontWeight:700,fontSize:13,
                  cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s",
                }}>Clear</button>
              <button type="button" disabled={loading||!text.trim()} className="run-btn"
                onClick={()=>runAnalysis()}
                style={{
                  padding:"8px 22px",borderRadius:11,
                  border:"1px solid #5a8188",
                  background:loading||!text.trim()
                    ?"linear-gradient(180deg,#a7b7bb,#95a4a8)"
                    :"linear-gradient(180deg,#6f9199,#567a82)",
                  color:"#fffdf8",fontWeight:900,fontSize:14,
                  cursor:loading||!text.trim()?"not-allowed":"pointer",
                  boxShadow:loading||!text.trim()?"none":"0 6px 20px rgba(86,122,130,0.25)",
                  transition:"all 0.14s",fontFamily:"inherit",letterSpacing:"-0.01em",
                }}>
                {loading?"Analysing…":"Run analysis →"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error&&(
          <div style={{borderRadius:14,border:"1px solid #e3c7cf",background:"#f9edf1",color:"#906878",padding:"13px 16px",fontSize:14}}>
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading&&<LoadingSkeleton/>}

        {/* ── RESULTS ── */}
        {hasResults&&(
          <div className="results-appear" style={{display:"grid",gridTemplateColumns:hasSidebar?"1fr 272px":"1fr",gap:14,alignItems:"start"}}>

            {/* LEFT: Standards panel */}
            <div style={{display:"grid",gap:14}}>
              <div style={{
                borderRadius:22,border:"1px solid rgba(183,175,163,0.28)",
                background:"rgba(255,255,255,0.62)",backdropFilter:"blur(18px)",overflow:"hidden",
              }}>
                {/* Standards header */}
                <div style={{
                  padding:"16px 20px 14px",
                  borderBottom:"1px solid rgba(188,178,165,0.22)",
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  gap:12,flexWrap:"wrap",
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:17,fontWeight:900,color:"#3a3630",letterSpacing:"-0.02em"}}>Applicable Standards</span>
                    <span style={{
                      minWidth:26,height:24,padding:"0 9px",borderRadius:99,
                      background:"#eef2f0",border:"1px solid #d6ddd8",
                      color:"#5b6862",fontWeight:900,fontSize:13,
                      display:"inline-flex",alignItems:"center",justifyContent:"center",
                    }}>{filteredStandardGroups.length}</span>
                    {activeDirectiveFilter&&(
                      <span style={{
                        fontSize:11,fontWeight:800,color:"#5f8d8b",
                        background:"rgba(95,141,139,0.1)",borderRadius:99,padding:"2px 8px",
                        cursor:"pointer",
                      }} onClick={()=>setActiveDirectiveFilter(null)}>
                        {DIR_SHORT[activeDirectiveFilter]} ×
                      </span>
                    )}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {/* Collapse/Expand all */}
                    <button
                      onClick={()=>setAllExpanded(!allExpanded)}
                      style={{
                        padding:"6px 12px",borderRadius:9,
                        border:"1px solid rgba(197,190,180,0.7)",
                        background:"rgba(255,255,255,0.6)",
                        color:"#6f6a61",fontSize:12,fontWeight:800,
                        cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s",
                        whiteSpace:"nowrap",
                      }}>
                      {allExpanded?"Collapse all":"Expand all"}
                    </button>
                    {/* Export */}
                    <button
                      onClick={handleExport}
                      style={{
                        padding:"6px 12px",borderRadius:9,
                        border:"1px solid rgba(197,190,180,0.7)",
                        background:copied?"rgba(106,144,104,0.15)":"rgba(255,255,255,0.6)",
                        color:copied?"#566554":"#6f6a61",fontSize:12,fontWeight:800,
                        cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",
                        whiteSpace:"nowrap",
                      }}>
                      {copied?"✓ Copied!":"⎘ Export"}
                    </button>
                    <input
                      value={search}
                      onChange={e=>setSearch(e.target.value)}
                      placeholder="Filter standards…"
                      style={{
                        width:180,borderRadius:11,
                        border:"1px solid rgba(198,189,177,0.7)",
                        background:"rgba(255,255,255,0.8)",
                        padding:"7px 13px",fontSize:13,
                        color:"#46413a",fontFamily:"inherit",
                      }}
                    />
                  </div>
                </div>

                {/* Standards lanes */}
                <div style={{padding:"14px 14px",display:"grid",gap:10}}>
                  {!filteredStandardGroups.length
                    ?<EmptyState title="No standards found" subtitle={activeDirectiveFilter?"Try removing the directive filter or run a more detailed analysis.":"Run analysis with a more detailed product description."}/>
                    :DIR_ORDER.filter(d=>standardsByDirective[d]&&standardsByDirective[d].length).map(directive=>(
                      <DirectiveLane
                        key={directive}
                        dirKey={directive}
                        groups={standardsByDirective[directive]}
                        expandedStandards={expandedStandards}
                        onToggleStandard={key=>setExpandedStandards(prev=>{
                          const next={...prev};next[key]=!prev[key];return next;
                        })}
                      />
                    ))
                  }
                </div>
              </div>

              {/* Applicable Legislations */}
              {hasLegislations&&(
                <div style={{
                  borderRadius:22,border:"1px solid rgba(183,175,163,0.28)",
                  background:"rgba(255,255,255,0.62)",backdropFilter:"blur(18px)",overflow:"hidden",
                }}>
                  <div
                    onClick={()=>setLegsOpen(o=>!o)}
                    style={{
                      padding:"16px 20px 14px",cursor:"pointer",
                      borderBottom:legsOpen?"1px solid rgba(188,178,165,0.22)":"none",
                      display:"flex",alignItems:"center",gap:10,
                      background:"rgba(255,255,255,0.3)",
                    }}
                  >
                    <span style={{fontSize:17,fontWeight:900,color:"#3a3630",flex:1,letterSpacing:"-0.02em"}}>Applicable Legislations</span>
                    <span style={{
                      minWidth:26,height:24,padding:"0 9px",borderRadius:99,
                      background:"#eef2f0",border:"1px solid #d6ddd8",
                      color:"#5b6862",fontWeight:900,fontSize:13,
                      display:"inline-flex",alignItems:"center",justifyContent:"center",
                    }}>{notes.length}</span>
                    <span style={{
                      fontSize:11,color:"#9e9890",fontWeight:900,
                      transform:legsOpen?"rotate(180deg)":"rotate(0deg)",
                      display:"inline-block",transition:"transform 0.2s",
                    }}>▾</span>
                  </div>
                  {legsOpen&&(
                    <div style={{padding:"14px",display:"grid",gap:10}}>
                      {notes.map((f,i)=>(
                        <LegislationItem key={f._i+"-"+i} finding={f}/>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Things to check sidebar */}
            {hasSidebar&&(
              <div style={{
                borderRadius:20,overflow:"hidden",
                border:"1px solid "+DIR.ROHS.ring,
                background:"rgba(255,255,255,0.62)",
                backdropFilter:"blur(18px)",
              }}>
                <div style={{
                  padding:"15px 16px 12px",
                  borderBottom:"1px solid "+DIR.ROHS.ring,
                  background:DIR.ROHS.header,
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16,fontWeight:900,color:DIR.ROHS.ink,flex:1,letterSpacing:"-0.01em"}}>Things to Check</span>
                    <span style={{
                      minWidth:24,height:24,padding:"0 8px",borderRadius:99,
                      background:DIR.ROHS.ring,color:DIR.ROHS.ink,
                      fontWeight:900,fontSize:12,
                      display:"inline-flex",alignItems:"center",justifyContent:"center",
                    }}>{toCheck.length}</span>
                  </div>
                  <div style={{marginTop:6,fontSize:13,color:"#7a6030",lineHeight:1.5}}>
                    Potentially applicable — verify before scoping out.
                  </div>
                </div>
                <div style={{padding:"12px",display:"grid",gap:9}}>
                  {toCheck.map((f,i)=>(
                    <CheckItem key={f._i+"-"+i} finding={f} index={i}/>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Sticky new analysis bar — only shown when results are visible */}
      {hasResults&&<StickyBar onNewAnalysis={handleNewAnalysis}/>}

    </div>
  );
}