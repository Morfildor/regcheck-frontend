import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "https://regcheck-api.onrender.com/analyze";
const HISTORY_KEY = "regcheck_history_v1";

const DIR = {
  LVD:{label:"LVD",bg:"#ece8dc",bd:"#cfc7b7",tx:"#505647",accent:"#8a9484",stripe:"rgba(111,117,102,0.08)"},
  EMC:{label:"EMC",bg:"#e6f0ef",bd:"#bbd1cf",tx:"#456a69",accent:"#5f8d8b",stripe:"rgba(95,141,139,0.08)"},
  RED:{label:"RED",bg:"#e3eef0",bd:"#b2c7cc",tx:"#294b53",accent:"#2f5f69",stripe:"rgba(47,95,105,0.08)"},
  RED_CYBER:{label:"RED CYBER",bg:"#f1e7eb",bd:"#d8c0c9",tx:"#7a5667",accent:"#9f7084",stripe:"rgba(159,112,132,0.08)"},
  ROHS:{label:"RoHS",bg:"#f7efd9",bd:"#e5d3a1",tx:"#8f6e2d",accent:"#b7903e",stripe:"rgba(183,144,62,0.08)"},
  REACH:{label:"REACH",bg:"#f5eae6",bd:"#e3cbc2",tx:"#83584a",accent:"#aa7868",stripe:"rgba(170,120,104,0.08)"},
  CRA:{label:"CRA",bg:"#e8efe7",bd:"#c1cec0",tx:"#4a6149",accent:"#60795f",stripe:"rgba(96,121,95,0.08)"},
  GDPR:{label:"GDPR",bg:"#edf3f2",bd:"#cad9d8",tx:"#607773",accent:"#7f9995",stripe:"rgba(127,153,149,0.08)"},
  AI_Act:{label:"AI Act",bg:"#f1e7eb",bd:"#d8c0c9",tx:"#7a5667",accent:"#9f7084",stripe:"rgba(159,112,132,0.08)"},
  OTHER:{label:"Other",bg:"#f0ece3",bd:"#d5cec0",tx:"#686356",accent:"#8d8779",stripe:"rgba(141,135,121,0.08)"},
};

const SECTION_META = {
  harmonized:{title:"Harmonized standards", subtitle:"Presumption-of-conformity route from the Commission references."},
  state_of_the_art:{title:"State of the art / latest route", subtitle:"Latest technical route found online when not clearly harmonized in the checked list."},
  review:{title:"Review-required routes", subtitle:"Family standards or scoping placeholders that still need product-specific confirmation."},
  unknown:{title:"Other standards", subtitle:"Matched standards without explicit harmonization classification."},
};

const LEG_META = {
  ce:{title:"CE", subtitle:"Current CE legislations"},
  framework:{title:"Framework", subtitle:"Cross-cutting or family regimes"},
  non_ce:{title:"Parallel", subtitle:"Non-CE obligations"},
  future:{title:"Future", subtitle:"Upcoming obligations"},
  informational:{title:"Info", subtitle:"Informational references"},
};

const QUICK_CHIPS = [
  { label:"Mains powered", text:"mains powered" },
  { label:"Battery", text:"rechargeable lithium battery" },
  { label:"Wi-Fi / BT", text:"Wi-Fi and Bluetooth connectivity" },
  { label:"OTA", text:"OTA firmware updates" },
  { label:"Cloud", text:"cloud account and remote app control" },
  { label:"Food-contact", text:"food-contact materials and coatings" },
  { label:"Camera", text:"camera" },
  { label:"Display", text:"touch display and user interface" },
];

const TEMPLATES = [
  { label:"Air fryer", text:"Smart air fryer with Wi-Fi app control, mains powered, OTA firmware updates, cloud recipe sync, and food-contact basket coating." },
  { label:"Coffee machine", text:"Connected espresso machine with app control, mains powered, OTA firmware updates, cloud brew profiles, water path food-contact materials, and user account login." },
  { label:"Robot vacuum", text:"Robot vacuum cleaner with Wi-Fi and Bluetooth, camera, OTA firmware updates, cloud cleaning schedule, rechargeable lithium battery, and docking charger." },
  { label:"Air purifier", text:"Smart air purifier with Wi-Fi control, PM sensor, OTA firmware updates, cloud air-quality logging, mains power, and touch display." },
];

function toneForDirective(key){ return DIR[key] || DIR.OTHER; }
function statusTone(level){
  if(level === "CRITICAL") return { bg:"#f6e9ee", bd:"#e2c7d0", tx:"#7f5263" };
  if(level === "HIGH") return { bg:"#f8eee4", bd:"#e8d0b0", tx:"#8a6a2e" };
  if(level === "MEDIUM") return { bg:"#f6f3ea", bd:"#ddd3bf", tx:"#76664a" };
  return { bg:"#edf3ef", bd:"#cfe0d4", tx:"#57705c" };
}
function titleCase(value){ return String(value || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
function normalize(text){ return String(text || "").toLowerCase(); }

function loadHistory(){
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveHistory(items){
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)); } catch {}
}

function Pill({ children, tone }){
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:999,border:`1px solid ${tone.bd}`,background:tone.bg,color:tone.tx,fontWeight:800,fontSize:12,whiteSpace:"nowrap"}}>
      <span style={{width:7,height:7,borderRadius:999,background:tone.accent || tone.tx,display:"inline-block"}} />
      {children}
    </span>
  );
}

function SmallMeta({ label, value }){
  if(!value) return null;
  return (
    <div style={{fontSize:12,lineHeight:1.5,color:"#786f65"}}>
      <strong style={{color:"#544e47"}}>{label}:</strong> {value}
    </div>
  );
}

function StatCard({ label, value, tone }){
  return (
    <div style={{flex:"1 1 160px",padding:"14px 16px",borderRadius:16,border:`1px solid ${tone.bd}`,background:tone.bg}}>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:tone.tx,opacity:0.8}}>{label}</div>
      <div style={{marginTop:6,fontSize:24,fontWeight:900,color:tone.tx}}>{value}</div>
    </div>
  );
}

function Toast({ message, visible }){
  return (
    <div
      style={{
        position:"fixed",
        top:18,
        left:"50%",
        transform:`translateX(-50%) translateY(${visible ? 0 : -12}px)`,
        padding:"10px 18px",
        borderRadius:12,
        background:"rgba(42,37,32,0.92)",
        color:"#f5f1eb",
        fontSize:13,
        fontWeight:700,
        boxShadow:"0 6px 24px rgba(0,0,0,0.18)",
        opacity:visible ? 1 : 0,
        pointerEvents:"none",
        transition:"opacity 0.2s, transform 0.2s",
        zIndex:999
      }}
    >
      {message}
    </div>
  );
}

function SkeletonLine({ w="100%", h=14 }){
  return (
    <div
      style={{
        width:w,
        height:h,
        borderRadius:8,
        background:"linear-gradient(90deg,rgba(200,193,183,0.35) 25%,rgba(220,214,206,0.55) 50%,rgba(200,193,183,0.35) 75%)",
        backgroundSize:"200% 100%",
        animation:"regcheckShimmer 1.6s infinite"
      }}
    />
  );
}

function LoadingSkeleton(){
  return (
    <div style={{display:"grid",gap:14}}>
      <style>{`@keyframes regcheckShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{flex:"1 1 160px",padding:"14px 16px",borderRadius:16,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)"}}>
            <SkeletonLine w="45%" h={10} />
            <div style={{height:8}} />
            <SkeletonLine w="65%" h={24} />
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"240px minmax(0,1fr) 300px",gap:14}}>
        <div style={{borderRadius:20,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)",padding:12}}>
          <SkeletonLine w="70%" h={12} />
          <div style={{height:10}} />
          {[0,1,2,3].map(i => (
            <div key={i} style={{marginBottom:8}}>
              <SkeletonLine w="100%" h={36} />
            </div>
          ))}
        </div>

        <div style={{display:"grid",gap:14}}>
          <div style={{borderRadius:20,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)",padding:16}}>
            <SkeletonLine w="28%" h={18} />
            <div style={{height:10}} />
            <SkeletonLine w="100%" h={12} />
            <div style={{height:8}} />
            <SkeletonLine w="88%" h={12} />
          </div>

          {[0,1].map(i => (
            <div key={i} style={{borderRadius:20,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)",padding:16}}>
              <SkeletonLine w="34%" h={18} />
              <div style={{height:12}} />
              {[0,1,2].map(j => (
                <div key={j} style={{marginBottom:10}}>
                  <SkeletonLine w={`${85 - j * 8}%`} h={14} />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{borderRadius:20,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)",padding:12}}>
          <SkeletonLine w="52%" h={16} />
          <div style={{height:10}} />
          {[0,1,2].map(i => (
            <div key={i} style={{marginBottom:8}}>
              <SkeletonLine w="100%" h={52} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({ history, onLoad, onDelete, onClear }){
  const [open, setOpen] = useState(false);
  if(!history.length) return null;

  return (
    <div style={{position:"relative"}}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display:"inline-flex",
          alignItems:"center",
          gap:8,
          padding:"8px 12px",
          borderRadius:12,
          border:"1px solid rgba(198,189,177,0.7)",
          background:"rgba(255,255,255,0.72)",
          color:"#5f5a53",
          fontWeight:800,
          fontSize:13,
          cursor:"pointer",
          fontFamily:"inherit"
        }}
      >
        <span>🕑</span>
        History
        <span style={{minWidth:18,height:18,padding:"0 5px",borderRadius:999,background:"rgba(143,148,132,0.18)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900}}>
          {history.length}
        </span>
      </button>

      {open ? <div onClick={() => setOpen(false)} style={{position:"fixed",inset:0,zIndex:20}} /> : null}

      {open ? (
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:360,zIndex:21,borderRadius:16,border:"1px solid rgba(197,190,180,0.7)",background:"rgba(252,250,247,0.98)",backdropFilter:"blur(20px)",boxShadow:"0 8px 32px rgba(0,0,0,0.12)",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(197,190,180,0.4)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:14,fontWeight:900,color:"#3a3630"}}>Recent analyses</span>
            <button
              type="button"
              onClick={() => { onClear(); setOpen(false); }}
              style={{padding:"4px 10px",borderRadius:8,border:"1px solid rgba(197,190,180,0.7)",background:"transparent",color:"#9e9890",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}
            >
              Clear all
            </button>
          </div>

          <div style={{maxHeight:340,overflowY:"auto",padding:8,display:"grid",gap:8}}>
            {history.map(entry => (
              <div key={entry.id} style={{padding:"10px 12px",borderRadius:12,border:"1px solid rgba(197,190,180,0.45)",background:"rgba(255,255,255,0.78)"}}>
                <div style={{fontSize:13,fontWeight:900,color:"#3d3833",lineHeight:1.4}}>{entry.title}</div>
                <div style={{marginTop:5,fontSize:12,color:"#777067",lineHeight:1.5}}>{entry.preview}</div>
                <div style={{marginTop:8,display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#9a9288"}}>{entry.time}</span>
                  <div style={{display:"flex",gap:6}}>
                    <button
                      type="button"
                      onClick={() => { onLoad(entry); setOpen(false); }}
                      style={{padding:"5px 9px",borderRadius:8,border:"1px solid rgba(197,190,180,0.7)",background:"#fff",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(entry.id)}
                      style={{padding:"5px 9px",borderRadius:8,border:"1px solid rgba(225,195,200,0.9)",background:"#fff6f8",color:"#9a6575",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LegislationRail({ sections, activeKey, setActiveKey }){
  const available = (sections || []).filter(s => s.items?.length);
  if(!available.length) return null;

  return (
    <aside style={{display:"grid",gap:10,alignSelf:"start"}}>
      <div style={{padding:"12px",borderRadius:18,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)",backdropFilter:"blur(18px)"}}>
        <div style={{fontSize:12,fontWeight:900,letterSpacing:"0.08em",textTransform:"uppercase",color:"#8e867d",marginBottom:10}}>Applicable legislations</div>
        <div style={{display:"grid",gap:8}}>
          {available.map(section => {
            const active = activeKey === section.key;
            const first = section.items?.[0]?.directive_key || "OTHER";
            const tone = toneForDirective(first);

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveKey(section.key)}
                style={{textAlign:"left",padding:"10px 12px",borderRadius:14,border:`1px solid ${active ? tone.bd : "rgba(190,182,171,0.4)"}`,background:active ? tone.bg : "rgba(255,255,255,0.7)",cursor:"pointer",fontFamily:"inherit"}}
              >
                <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:900,color:active ? tone.tx : "#4a443d"}}>{LEG_META[section.key]?.title || titleCase(section.key)}</span>
                  <span style={{minWidth:24,height:24,padding:"0 8px",borderRadius:999,border:`1px solid ${tone.bd}`,background:active ? "rgba(255,255,255,0.7)" : tone.bg,color:tone.tx,fontSize:12,fontWeight:900,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                    {section.count}
                  </span>
                </div>
                <div style={{marginTop:4,fontSize:12,color:"#7f776d",lineHeight:1.4}}>{LEG_META[section.key]?.subtitle || section.title}</div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function StandardsSection({ section, query }){
  const meta = SECTION_META[section.key] || { title: section.title, subtitle: "" };

  const items = (section.items || []).filter(item => {
    const hay = [
      item.code,
      item.title,
      item.directive,
      item.legislation_key,
      item.reason,
      item.notes,
      item.version,
      item.dated_version,
      ...(item.keywords || [])
    ].join(" ").toLowerCase();
    return !query || hay.includes(query);
  });

  if(!items.length) return null;

  return (
    <section style={{borderRadius:20,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)",backdropFilter:"blur(18px)",overflow:"hidden"}}>
      <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(188,178,165,0.2)",background:"rgba(255,255,255,0.55)"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:"#322d28"}}>{meta.title}</div>
            <div style={{fontSize:13,color:"#7b7369",marginTop:4}}>{meta.subtitle}</div>
          </div>
          <div style={{minWidth:28,height:28,padding:"0 10px",borderRadius:999,border:"1px solid #d4d9d3",background:"#eef2ef",color:"#5c675f",fontSize:13,fontWeight:900,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
            {items.length}
          </div>
        </div>
      </div>

      <div style={{padding:14,display:"grid",gap:10}}>
        {items.map(item => {
          const tone = toneForDirective(item.directive || item.legislation_key);
          return (
            <div key={`${section.key}-${item.code}`} style={{borderRadius:16,border:`1px solid ${tone.bd}`,background:"rgba(255,255,255,0.84)",padding:"14px 15px",boxShadow:"0 1px 0 rgba(255,255,255,0.7) inset"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div style={{display:"grid",gap:8,minWidth:0,flex:1}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <Pill tone={tone}>{DIR[item.directive]?.label || item.directive || item.legislation_key || "Other"}</Pill>
                    <span style={{display:"inline-flex",padding:"4px 9px",borderRadius:999,border:"1px solid rgba(197,189,177,0.7)",background:"#f7f5f1",color:"#655f57",fontWeight:800,fontSize:12}}>
                      {item.item_type === "review" ? "Review" : (section.key === "state_of_the_art" ? "Latest route" : "Standard")}
                    </span>
                  </div>

                  <div style={{fontSize:16,fontWeight:900,color:"#302b27",lineHeight:1.4}}>{item.code}</div>
                  <div style={{fontSize:14,color:"#5c564f",lineHeight:1.55}}>{item.title}</div>
                </div>
              </div>

              <div style={{marginTop:10,display:"grid",gap:4}}>
                <SmallMeta label="Harmonized reference" value={item.harmonized_reference} />
                <SmallMeta label="Harmonized version" value={item.dated_version} />
                <SmallMeta label="State-of-the-art version" value={item.version} />
                <SmallMeta label="Match basis" value={item.match_basis ? titleCase(item.match_basis) : null} />
                <SmallMeta label="Reason" value={item.reason || item.notes} />
                <SmallMeta label="Evidence" value={(item.evidence_hint || []).join(", ")} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LegislationPanel({ section }){
  if(!section || !section.items?.length) return null;

  return (
    <section style={{borderRadius:20,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)",backdropFilter:"blur(18px)",overflow:"hidden"}}>
      <div style={{padding:"16px 18px",borderBottom:"1px solid rgba(188,178,165,0.2)",background:"rgba(255,255,255,0.55)"}}>
        <div style={{fontSize:18,fontWeight:900,color:"#322d28"}}>{section.title}</div>
        <div style={{fontSize:13,color:"#7b7369",marginTop:4}}>{LEG_META[section.key]?.subtitle || "Applicable legislation group"}</div>
      </div>

      <div style={{padding:14,display:"grid",gap:10}}>
        {section.items.map(item => {
          const tone = toneForDirective(item.directive_key);
          return (
            <div key={item.code} style={{borderRadius:16,border:`1px solid ${tone.bd}`,background:"rgba(255,255,255,0.84)",padding:"14px 15px"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                <div style={{display:"grid",gap:8}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <Pill tone={tone}>{DIR[item.directive_key]?.label || item.directive_key || "Other"}</Pill>
                    <span style={{display:"inline-flex",padding:"4px 9px",borderRadius:999,border:"1px solid rgba(197,189,177,0.7)",background:"#f7f5f1",color:"#655f57",fontWeight:800,fontSize:12}}>
                      {titleCase(item.timing_status)}
                    </span>
                  </div>

                  <div style={{fontSize:15,fontWeight:900,color:"#2f2a26"}}>{item.code}</div>
                  <div style={{fontSize:14,color:"#59534c",lineHeight:1.55}}>{item.title}</div>
                </div>
              </div>

              <div style={{marginTop:10,display:"grid",gap:4}}>
                <SmallMeta label="Family" value={item.family} />
                <SmallMeta label="Reason" value={item.reason || item.notes} />
                <SmallMeta label="Applies from" value={item.applicable_from} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CheckPanel({ items }){
  if(!items?.length) return null;

  return (
    <section style={{borderRadius:20,border:"1px solid rgba(220,205,170,0.9)",background:"rgba(255,255,255,0.72)",backdropFilter:"blur(18px)",overflow:"hidden"}}>
      <div style={{padding:"15px 16px",borderBottom:"1px solid rgba(220,205,170,0.9)",background:"#f7f2e6"}}>
        <div style={{fontSize:16,fontWeight:900,color:"#7d6432"}}>Things to check</div>
        <div style={{fontSize:13,color:"#8d7a56",marginTop:4}}>Missing inputs and contradictions that still affect scope quality.</div>
      </div>

      <div style={{padding:12,display:"grid",gap:8}}>
        {items.map((item, idx) => (
          <div key={`${item.article}-${idx}`} style={{padding:"12px 13px",borderRadius:14,border:"1px solid #e5d6b4",background:"#fffaf0"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#745f34"}}>{item.article}</div>
            <div style={{marginTop:4,fontSize:13,color:"#6a655e",lineHeight:1.5}}>{item.finding}</div>
            {item.action ? <div style={{marginTop:5,fontSize:12,color:"#8a8379",lineHeight:1.5}}>{item.action}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App(){
  const inputRef = useRef(null);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  const [text, setText] = useState("");
  const [mode, setMode] = useState("standard");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeLegislationKey, setActiveLegislationKey] = useState("ce");
  const [history, setHistory] = useState(() => loadHistory());
  const [toast, setToast] = useState({ visible:false, message:"" });

  const showToast = useCallback((message) => {
    setToast({ visible:true, message });
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => setToast({ visible:false, message:"" }), 2200);
  }, []);

  useEffect(() => {
    function onKey(e){
      if((e.ctrlKey || e.metaKey) && e.key === "k"){
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if(window.innerWidth > 900) inputRef.current?.focus();
  }, []);

  const runAnalysis = useCallback(async (overrideText) => {
    const value = String(overrideText ?? text).trim();
    if(!value) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ description:value, category:"", directives:[], depth:mode }),
      });

      const data = await response.json();
      if(!response.ok) throw new Error(data?.detail || "Analysis failed");

      setResult(data);

      const firstSection = (data.legislation_sections || []).find(section => section.items?.length);
      setActiveLegislationKey(firstSection?.key || "ce");

      const topDirective = ((data.standard_sections || [])
        .flatMap(s => s.items || [])
        .map(i => i.directive || i.legislation_key)
        .filter(Boolean)[0]) || "OTHER";

      const entry = {
        id: Date.now().toString(),
        title: `${data.product_type ? titleCase(data.product_type) : "Product"} · ${data.overall_risk || "LOW"}`,
        preview: value.length > 140 ? `${value.slice(0, 140)}…` : value,
        text: value,
        mode,
        time: new Date().toLocaleString(),
        directive: topDirective,
      };

      setHistory(prev => {
        const next = [entry, ...prev.filter(x => x.text !== value)].slice(0, 8);
        saveHistory(next);
        return next;
      });

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 80);
      showToast("Analysis updated");
    } catch (err) {
      setError(err?.message || "Analysis failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [mode, text, showToast]);

  const findingsToCheck = useMemo(
    () => (result?.findings || []).filter(
      item => item.status === "WARN" && /^Missing:|Contradiction$/i.test(item.article || "")
    ),
    [result]
  );

  const standardSections = useMemo(
    () => result?.standard_sections || [],
    [result]
  );

  const legislationSections = useMemo(
    () => result?.legislation_sections || [],
    [result]
  );

  const activeLegislationSection = useMemo(
    () =>
      legislationSections.find(section => section.key === activeLegislationKey) ||
      legislationSections[0] ||
      null,
    [legislationSections, activeLegislationKey]
  );

  const riskTone = statusTone(result?.overall_risk || "LOW");

  const directiveTags = useMemo(() => {
    const keys = new Set();
    standardSections.forEach(section => {
      (section.items || []).forEach(item => {
        keys.add(item.directive || item.legislation_key || "OTHER");
      });
    });
    return [...keys];
  }, [standardSections]);

  function append(textToAdd){
    setText(prev => {
      const base = prev.trimEnd();
      if(!base) return textToAdd.charAt(0).toUpperCase() + textToAdd.slice(1);
      return /[.!?]$/.test(base) ? `${base} ${textToAdd}` : `${base}, ${textToAdd}`;
    });
    inputRef.current?.focus();
  }

  function clearAll(){
    setText("");
    setResult(null);
    setError("");
    setQuery("");
    showToast("Cleared");
  }

  return (
    <div style={{minHeight:"100vh",padding:"24px 20px 80px",fontFamily:"Inter, system-ui, sans-serif",background:"radial-gradient(circle at top left, rgba(143,182,193,0.22), transparent 24%), radial-gradient(circle at top right, rgba(184,154,90,0.18), transparent 20%), linear-gradient(180deg,#ddd7cf 0%,#d4cdc4 100%)",color:"#342f2b"}}>
      <Toast message={toast.message} visible={toast.visible} />

      <div style={{maxWidth:1260,margin:"0 auto",display:"grid",gap:14}}>
        <header style={{padding:"18px 22px",borderRadius:22,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.6)",backdropFilter:"blur(18px)",display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{width:42,height:42,borderRadius:14,background:"linear-gradient(135deg,#7fa4af,#5f7f87)",display:"grid",placeItems:"center",color:"white",fontSize:14,fontWeight:900}}>RC</div>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#26221e"}}>RegCheck</div>
              <div style={{fontSize:13,color:"#857d73",marginTop:2}}>Backend-aligned compliance scoping</div>
            </div>
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <HistoryPanel
              history={history}
              onLoad={(entry) => { setText(entry.text); setMode(entry.mode || "standard"); showToast("Loaded from history"); }}
              onDelete={(id) => setHistory(prev => {
                const next = prev.filter(item => item.id !== id);
                saveHistory(next);
                return next;
              })}
              onClear={() => {
                setHistory([]);
                saveHistory([]);
              }}
            />
            {directiveTags.map(key => <Pill key={key} tone={toneForDirective(key)}>{DIR[key]?.label || key}</Pill>)}
          </div>
        </header>

        {result ? (
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <StatCard label="Overall risk" value={result.overall_risk} tone={riskTone} />
            <StatCard label="Legislations" value={result.stats?.legislation_count ?? 0} tone={toneForDirective("LVD")} />
            <StatCard label="Harmonized" value={result.stats?.harmonized_standards_count ?? 0} tone={toneForDirective("EMC")} />
            <StatCard label="Latest / SOTA" value={result.stats?.state_of_the_art_standards_count ?? 0} tone={toneForDirective("RED")} />
            <StatCard label="Review items" value={result.stats?.review_items_count ?? 0} tone={toneForDirective("RED_CYBER")} />
          </div>
        ) : null}

        <section style={{borderRadius:22,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.68)",backdropFilter:"blur(20px)",overflow:"hidden"}}>
          <div style={{padding:"18px 20px 0"}}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if((e.ctrlKey || e.metaKey) && e.key === "Enter") runAnalysis(); }}
              placeholder="Describe the product with concrete features. Example: smart air fryer with Wi-Fi, mains power, OTA updates, cloud recipe sync, and food-contact basket coating."
              style={{width:"100%",minHeight:118,resize:"vertical",border:"none",background:"transparent",fontSize:16,lineHeight:1.65,color:"#2f2a26",fontFamily:"inherit",outline:"none"}}
            />
          </div>

          <div style={{padding:"12px 20px",borderTop:"1px solid rgba(188,178,165,0.18)",display:"flex",gap:8,flexWrap:"wrap"}}>
            {QUICK_CHIPS.map(chip => (
              <button key={chip.label} type="button" onClick={() => append(chip.text)} style={{padding:"6px 12px",borderRadius:999,border:"1px solid rgba(198,189,177,0.7)",background:"rgba(255,255,255,0.78)",color:"#5d5750",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                {chip.label}
              </button>
            ))}
          </div>

          <div style={{padding:"12px 20px",borderTop:"1px solid rgba(188,178,165,0.18)",display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {TEMPLATES.map(item => (
                <button key={item.label} type="button" onClick={() => setText(item.text)} style={{padding:"6px 12px",borderRadius:999,border:"1px solid rgba(198,189,177,0.7)",background:text === item.text ? "rgba(143,182,193,0.18)" : "rgba(255,255,255,0.72)",color:text === item.text ? "#4f7580" : "#5d5750",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",borderRadius:12,overflow:"hidden",border:"1px solid rgba(198,189,177,0.7)",background:"rgba(255,255,255,0.5)"}}>
                {["quick","standard","deep"].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMode(val)}
                    style={{padding:"8px 14px",border:"none",borderRight:val !== "deep" ? "1px solid rgba(198,189,177,0.45)" : "none",background:mode === val ? "linear-gradient(180deg,#6f9199,#567a82)" : "transparent",color:mode === val ? "#fff" : "#736d64",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}
                  >
                    {titleCase(val)}
                  </button>
                ))}
              </div>

              <button type="button" onClick={clearAll} style={{padding:"8px 14px",borderRadius:12,border:"1px solid rgba(198,189,177,0.7)",background:"rgba(255,255,255,0.78)",color:"#5f5a53",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                Clear
              </button>

              <button
                type="button"
                disabled={loading || !text.trim()}
                onClick={() => runAnalysis()}
                style={{padding:"8px 18px",borderRadius:12,border:"1px solid #5a8188",background:loading || !text.trim() ? "#9eafb3" : "linear-gradient(180deg,#6f9199,#567a82)",color:"#fff",fontWeight:900,fontSize:14,cursor:loading || !text.trim() ? "not-allowed" : "pointer",fontFamily:"inherit"}}
              >
                {loading ? "Analysing…" : "Run analysis"}
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div style={{padding:"13px 16px",borderRadius:14,border:"1px solid #e3c7cf",background:"#f9edf1",color:"#906878"}}>
            {error}
          </div>
        ) : null}

        {loading ? <LoadingSkeleton /> : null}

        {result && !loading ? (
          <div ref={resultsRef} style={{display:"grid",gridTemplateColumns:"240px minmax(0,1fr) 300px",gap:14,alignItems:"start"}}>
            <LegislationRail sections={legislationSections} activeKey={activeLegislationKey} setActiveKey={setActiveLegislationKey} />

            <div style={{display:"grid",gap:14,minWidth:0}}>
              <section style={{borderRadius:20,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)",backdropFilter:"blur(18px)",padding:"16px 18px"}}>
                <div style={{fontSize:18,fontWeight:900,color:"#2e2925"}}>Analysis summary</div>
                <div style={{marginTop:8,fontSize:14,color:"#5c564f",lineHeight:1.65}}>{result.summary}</div>
                <div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}>
                  {result.product_type ? <Pill tone={toneForDirective("OTHER")}>{titleCase(result.product_type)}</Pill> : null}
                  {(result.functional_classes || []).map(item => <Pill key={item} tone={toneForDirective("OTHER")}>{titleCase(item)}</Pill>)}
                </div>
              </section>

              <section style={{borderRadius:20,border:"1px solid rgba(183,175,163,0.28)",background:"rgba(255,255,255,0.72)",backdropFilter:"blur(18px)",padding:"14px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:900,color:"#2e2925"}}>Standards view</div>
                    <div style={{marginTop:4,fontSize:13,color:"#7b7369"}}>Harmonized, latest-route, and review items are separated.</div>
                  </div>

                  <input
                    ref={searchRef}
                    value={query}
                    onChange={e => setQuery(normalize(e.target.value))}
                    placeholder="Filter standards…"
                    style={{width:240,padding:"9px 12px",borderRadius:12,border:"1px solid rgba(198,189,177,0.7)",background:"rgba(255,255,255,0.85)",fontSize:14,color:"#433d37",fontFamily:"inherit",outline:"none"}}
                  />
                </div>
              </section>

              {standardSections.map(section => <StandardsSection key={section.key} section={section} query={query} />)}
              <LegislationPanel section={activeLegislationSection} />
            </div>

            <CheckPanel items={findingsToCheck} />
          </div>
        ) : null}
      </div>
    </div>
  );
}