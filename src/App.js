import { useState } from "react";

// ── Detect directives ─────────────────────────────────────────────────────
function detectDirectives(t) {
  t = t.toLowerCase();
  const has = (kws) => kws.some(k => t.includes(k));
  const r = [];
  if (has(["wifi","wi-fi","bluetooth","ble","zigbee","lora","nfc","lte","4g","5g","gsm","cellular","radio","wireless","rf ","802.11","nb-iot","cat-m"])) r.push("RED");
  if (has(["software","firmware","digital","processor","microcontroller","embedded","app","connected","iot","network","cloud","internet","ota","update","api"])) r.push("CRA");
  if (has(["personal data","user data","email","location","gps","health","biometric","usage data","account","profile","tracking","analytics","store data","cloud","login","password"])) r.push("GDPR");
  if (has(["ai ","artificial intelligence","machine learning"," ml ","neural","inference","model","recommendation","automated decision","computer vision","nlp","llm","voice assistant"])) r.push("AI_Act");
  if (has(["230v","mains","110v","ac power","wall plug","hardwired","power supply","li-ion","lithium","battery","rechargeable","usb power","poe"])) r.push("LVD");
  if (has(["electronic","electrical","device","sensor","circuit","pcb","mcu","processor","voltage","wifi","bluetooth","radio","mains","battery","usb"])) r.push("EMC");
  if (has(["repair","recyclable","recycled","sustainability","energy label","spare part","eol","end of life","dpp","digital product passport","carbon"])) r.push("ESPR");
  if (r.length === 0 && t.length > 30) { r.push("CRA"); r.push("EMC"); }
  return r;
}

// ── Checklist items with detector functions ───────────────────────────────
const CHECKLIST = [
  { id:"purpose",  label:"What does it do?",             detect: t => t.length > 40 },
  { id:"user",     label:"Who uses it?",                 detect: t => /consumer|industrial|medical|professional|children|user|customer|patient/i.test(t) },
  { id:"radio",    label:"Connectivity (WiFi/BT/4G…)",   detect: t => /wifi|wi-fi|bluetooth|ble|lte|4g|5g|zigbee|nfc|lora|cellular|wireless/i.test(t) },
  { id:"power",    label:"Power source",                 detect: t => /battery|mains|230v|usb|poe|li-ion|rechargeable|hardwired/i.test(t) },
  { id:"data",     label:"Personal data collected?",     detect: t => /personal data|user data|email|location|health|account|profile|tracking|login|password/i.test(t) },
  { id:"cloud",    label:"Cloud / backend?",             detect: t => /cloud|server|aws|azure|backend|api|internet|online/i.test(t) },
  { id:"software", label:"Firmware / OTA updates?",      detect: t => /firmware|software|ota|update|embedded/i.test(t) },
  { id:"ai",       label:"AI or ML features?",           detect: t => /ai |machine learning| ml |neural|inference|model|llm|computer vision/i.test(t) },
];

const DIR_META = {
  RED:    { label:"RED",    full:"Radio Equipment Directive",            color:"#60a5fa", ref:"2014/53/EU",      standards:["ETSI EN 303 645","EN 18031-1","EN 18031-2","EN 18031-3","ETSI EN 301 489-1","ETSI EN 300 328"] },
  CRA:    { label:"CRA",    full:"Cyber Resilience Act",                 color:"#f472b6", ref:"(EU) 2024/2847",  standards:["ETSI EN 303 645","IEC 62443-4-1","IEC 62443-4-2","ISO/IEC 27001","ISO/IEC 29147","SPDX/CycloneDX"] },
  GDPR:   { label:"GDPR",   full:"General Data Protection Regulation",   color:"#34d399", ref:"(EU) 2016/679",   standards:["ISO/IEC 27701","ISO/IEC 29134","ISO/IEC 27018","EDPB Guidelines 2/2019","EDPB Guidelines 9/2022"] },
  AI_Act: { label:"AI Act", full:"Artificial Intelligence Act",          color:"#a78bfa", ref:"(EU) 2024/1689",  standards:["ISO/IEC 42001","ISO/IEC 23894","ISO/IEC 25059","NIST AI RMF 1.0","CEN/CENELEC JTC 21"] },
  LVD:    { label:"LVD",    full:"Low Voltage Directive",                color:"#fb923c", ref:"2014/35/EU",      standards:["EN 62368-1:2020","EN 60335-1","IEC 62133-2","EN 60664-1","EN 60529"] },
  EMC:    { label:"EMC",    full:"Electromagnetic Compatibility",        color:"#fbbf24", ref:"2014/30/EU",      standards:["EN 55032","EN 55035","EN 61000-4-2","EN 61000-4-3","EN 61000-4-5","ETSI EN 301 489-1"] },
  ESPR:   { label:"ESPR",   full:"Ecodesign for Sustainable Products",   color:"#86efac", ref:"(EU) 2024/1781",  standards:["ISO 14040/14044","EN 45554:2020","IEC 63074:2023","ISO 14021","GS1 Digital Link"] },
};

const STATUS_CFG = {
  FAIL: { icon:"✕", color:"#ef4444", bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.3)"  },
  WARN: { icon:"!",  color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.3)" },
  PASS: { icon:"✓", color:"#10b981", bg:"rgba(16,185,129,0.1)",  border:"rgba(16,185,129,0.3)" },
  INFO: { icon:"i",  color:"#60a5fa", bg:"rgba(96,165,250,0.08)", border:"rgba(96,165,250,0.2)" },
};

const RISK_CFG = {
  CRITICAL: { color:"#ef4444", glow:"rgba(239,68,68,0.2)"  },
  HIGH:     { color:"#f97316", glow:"rgba(249,115,22,0.2)" },
  MEDIUM:   { color:"#f59e0b", glow:"rgba(245,158,11,0.2)" },
  LOW:      { color:"#10b981", glow:"rgba(16,185,129,0.2)" },
};

export default function App() {
  const [desc,    setDesc]    = useState("");
  const [depth,   setDepth]   = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  const detected = detectDirectives(desc);
  const checklist = CHECKLIST.map(c => ({ ...c, done: c.detect(desc) }));
  const allDone = checklist.every(c => c.done);

  const run = async () => {
    if (desc.trim().length < 10) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const r = await fetch("https://regcheck-api.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: detected, depth }),
      });
      if (!r.ok) throw new Error("Server error " + r.status);
      const data = await r.json();
      setResult(data);
      // Auto-select first tab with findings
      const grouped = groupFindings(data.findings);
      setActiveTab(Object.keys(grouped)[0] || null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const groupFindings = (findings) =>
    findings.reduce((acc, f, i) => {
      if (!acc[f.directive]) acc[f.directive] = [];
      acc[f.directive].push({ ...f, _i: i });
      return acc;
    }, {});

  const grouped = result ? groupFindings(result.findings) : {};
  const dirTabs = Object.keys(grouped);
  const counts = result
    ? result.findings.reduce((a, f) => { a[f.status] = (a[f.status] || 0) + 1; return a; }, {})
    : {};

  const tabFindings = activeTab && grouped[activeTab] ? grouped[activeTab] : [];
  const activeDir = activeTab ? DIR_META[activeTab] : null;
  const riskCfg = result ? (RISK_CFG[result.overall_risk] || RISK_CFG.LOW) : null;

  // ── Styles ──
  const C = {
    bg:      "#0a0f1e",
    surface: "#0f1629",
    card:    "#131c33",
    border:  "#1e2d4a",
    border2: "#243050",
    text:    "#e2e8f0",
    muted:   "#64748b",
    dim:     "#334155",
    accent:  "#3b82f6",
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Inter',-apple-system,sans-serif", fontSize:14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0a0f1e; }
        textarea,button,input { font-family:inherit; }
        textarea { outline:none; resize:none; }
        button { cursor:pointer; border:none; outline:none; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1e2d4a; border-radius:2px; }
        .tab-btn:hover { background:#1a2540 !important; }
        .run-btn:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 6px 20px rgba(59,130,246,0.4) !important; }
        .finding-row:hover { background:#192035 !important; }
        textarea:focus { border-color:#3b82f6 !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ borderBottom:`1px solid ${C.border}`, padding:"0 24px", background:C.surface, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", height:52, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:"#fff", letterSpacing:"-0.02em" }}>R</div>
            <span style={{ fontWeight:800, fontSize:16, letterSpacing:"-0.03em" }}>RegCheck<span style={{ color:"#3b82f6", fontWeight:600 }}> EU</span></span>
          </div>
          <span style={{ fontSize:11, color:C.muted, fontWeight:500, letterSpacing:"0.04em" }}>EU COMPLIANCE · v4</span>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 20px 60px" }}>

        {/* ══ INPUT SECTION ══ */}
        {!result && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ marginBottom:20 }}>
              <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.04em", marginBottom:6, color:"#f1f5f9" }}>EU Compliance Analysis</h1>
              <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>Describe your product. Directives are auto-detected. Fill the checklist for best results.</p>
            </div>

            {/* Split pane: textarea LEFT, checklist RIGHT */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:16, alignItems:"start" }}>

              {/* LEFT — textarea + controls */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    rows={14}
                    placeholder="Describe your product here…"
                    style={{ width:"100%", background:"transparent", border:`1px solid transparent`, borderRadius:12, color:C.text, fontSize:14, lineHeight:1.75, padding:"16px 18px", transition:"border-color 0.15s", minHeight:260 }}
                  />
                  {/* Detected tags */}
                  {detected.length > 0 && (
                    <div style={{ padding:"10px 18px", borderTop:`1px solid ${C.border}`, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>Detected:</span>
                      {detected.map(id => {
                        const d = DIR_META[id];
                        return <span key={id} style={{ fontSize:10, fontWeight:700, color:d.color, background:d.color+"18", border:`1px solid ${d.color}35`, padding:"2px 9px", borderRadius:5, letterSpacing:"0.04em" }}>{d.label}</span>;
                      })}
                    </div>
                  )}
                </div>

                {/* Controls row */}
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:C.muted }}>Depth:</span>
                  {["standard","deep"].map(d => (
                    <button key={d} onClick={() => setDepth(d)} style={{
                      fontSize:12, fontWeight:600, padding:"7px 16px", borderRadius:7,
                      border:`1px solid ${depth===d ? C.accent : C.border}`,
                      background: depth===d ? "rgba(59,130,246,0.1)" : "transparent",
                      color: depth===d ? C.accent : C.muted,
                      textTransform:"capitalize", transition:"all 0.15s",
                    }}>{d}</button>
                  ))}

                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
                    {!allDone && (
                      <span style={{ fontSize:11, color:"#f59e0b", fontWeight:500 }}>
                        {checklist.filter(c=>c.done).length}/{checklist.length} checklist items
                      </span>
                    )}
                    <button
                      className="run-btn"
                      onClick={run}
                      disabled={loading || desc.trim().length < 10}
                      style={{
                        background: desc.trim().length < 10 ? C.dim : "linear-gradient(135deg,#3b82f6,#6366f1)",
                        color:"#fff", fontSize:13, fontWeight:700, padding:"10px 26px",
                        borderRadius:8, boxShadow:"0 4px 14px rgba(59,130,246,0.25)",
                        display:"flex", alignItems:"center", gap:7, transition:"all 0.2s",
                        opacity: desc.trim().length < 10 ? 0.5 : 1,
                        letterSpacing:"-0.01em",
                      }}
                    >
                      {loading
                        ? <><div style={{ width:13, height:13, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />Analysing…</>
                        : "Run Analysis →"
                      }
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"14px 16px", display:"flex", gap:10 }}>
                    <span style={{ color:"#ef4444", fontSize:15 }}>⚠</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#ef4444", marginBottom:4 }}>Backend unreachable</div>
                      <div style={{ fontSize:12, color:"#fca5a5", lineHeight:1.6, marginBottom:8 }}>{error}</div>
                      <code style={{ fontSize:11, color:"#a78bfa", background:C.surface, padding:"5px 10px", borderRadius:5, display:"inline-block" }}>uvicorn main:app --reload</code>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT — checklist panel */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", position:"sticky", top:72 }}>
                <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:10, fontWeight:800, color:C.muted, textTransform:"uppercase", letterSpacing:"0.12em" }}>Input Checklist</div>
                </div>
                <div style={{ padding:"10px 14px 14px" }}>
                  {checklist.map(c => (
                    <div key={c.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 0", borderBottom:`1px solid ${C.border}28` }}>
                      <div style={{
                        width:16, height:16, borderRadius:4, flexShrink:0,
                        background: c.done ? "rgba(16,185,129,0.15)" : "transparent",
                        border: `1.5px solid ${c.done ? "#10b981" : C.dim}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:9, color:"#10b981", fontWeight:800, transition:"all 0.2s",
                      }}>{c.done ? "✓" : ""}</div>
                      <span style={{
                        fontSize:12, fontWeight:500, lineHeight:1.4,
                        color: c.done ? C.muted : "#94a3b8",
                        textDecoration: c.done ? "line-through" : "none",
                        transition:"all 0.2s",
                      }}>{c.label}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:12, fontSize:11, color:C.muted, lineHeight:1.6, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                    {allDone
                      ? <span style={{ color:"#10b981", fontWeight:600 }}>✓ All items covered — great detail!</span>
                      : `${checklist.filter(c=>c.done).length} of ${checklist.length} covered`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ LOADING ══ */}
        {loading && (
          <div style={{ animation:"fadeIn 0.2s ease" }}>
            <div style={{ fontSize:13, color:C.muted, marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:13, height:13, border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />
              Checking {detected.length} directive{detected.length!==1?"s":""}…
            </div>
            {[1,2,3].map(i => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:12, animation:`pulse 1.5s ease ${i*0.2}s infinite` }}>
                <div style={{ height:12, background:C.border, borderRadius:4, width:"30%", marginBottom:12 }} />
                <div style={{ height:10, background:C.surface, borderRadius:4, width:"85%", marginBottom:7 }} />
                <div style={{ height:10, background:C.surface, borderRadius:4, width:"60%" }} />
              </div>
            ))}
          </div>
        )}

        {/* ══ RESULTS ══ */}
        {result && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>

            {/* ── Risk banner ── */}
            <div style={{
              background:C.card, border:`1px solid ${C.border}`,
              borderLeft:`3px solid ${riskCfg.color}`,
              borderRadius:12, padding:"18px 22px", marginBottom:20,
              display:"flex", alignItems:"flex-start", gap:20, flexWrap:"wrap",
              boxShadow:`0 0 20px ${riskCfg.glow}`,
            }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Risk Level</div>
                <div style={{ fontSize:30, fontWeight:800, color:riskCfg.color, letterSpacing:"-0.04em", lineHeight:1 }}>{result.overall_risk}</div>
              </div>
              <div style={{ width:1, background:C.border, alignSelf:"stretch" }} />
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Summary</div>
                <div style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.65 }}>{result.summary}</div>
              </div>
              {/* stat pills */}
              <div style={{ display:"flex", gap:8 }}>
                {[["FAIL","#ef4444"],["WARN","#f59e0b"],["PASS","#10b981"],["INFO","#60a5fa"]].map(([s,c]) =>
                  (counts[s]>0) && (
                    <div key={s} style={{ background:c+"14", border:`1px solid ${c}30`, borderRadius:8, padding:"8px 14px", textAlign:"center", minWidth:52 }}>
                      <div style={{ fontSize:20, fontWeight:800, color:c, lineHeight:1 }}>{counts[s]}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:c, opacity:0.7, letterSpacing:"0.08em", marginTop:2 }}>{s}</div>
                    </div>
                  )
                )}
              </div>
              {/* Modify button */}
              <button onClick={() => { setResult(null); setError(null); }} style={{
                background:"transparent", border:`1px solid ${C.border}`, color:C.muted,
                fontSize:12, fontWeight:600, padding:"8px 16px", borderRadius:7, alignSelf:"center",
              }}>← Modify</button>
            </div>

            {/* ── Horizontal directive tabs ── */}
            <div style={{ display:"flex", gap:4, marginBottom:0, overflowX:"auto", paddingBottom:0 }}>
              {dirTabs.map(dir => {
                const dm = DIR_META[dir] || { label:dir, color:C.accent };
                const isActive = activeTab === dir;
                const fc = (grouped[dir]||[]).filter(f=>f.status==="FAIL").length;
                const wc = (grouped[dir]||[]).filter(f=>f.status==="WARN").length;
                return (
                  <button key={dir} className="tab-btn" onClick={() => setActiveTab(dir)} style={{
                    padding:"10px 18px",
                    background: isActive ? C.card : "transparent",
                    border: `1px solid ${isActive ? dm.color+"60" : C.border}`,
                    borderBottom: isActive ? `1px solid ${C.card}` : `1px solid ${C.border}`,
                    borderTopLeftRadius:8, borderTopRightRadius:8, borderBottomLeftRadius:0, borderBottomRightRadius:0,
                    color: isActive ? dm.color : C.muted,
                    fontSize:12, fontWeight:700, whiteSpace:"nowrap",
                    display:"flex", alignItems:"center", gap:6, transition:"all 0.15s",
                    position:"relative", bottom:-1,
                  }}>
                    {dm.label}
                    {fc>0 && <span style={{ fontSize:9, fontWeight:800, color:"#fff", background:"#ef4444", padding:"1px 5px", borderRadius:4 }}>{fc}</span>}
                    {fc===0 && wc>0 && <span style={{ fontSize:9, fontWeight:800, color:"#92400e", background:"#fef3c7", padding:"1px 5px", borderRadius:4 }}>{wc}</span>}
                  </button>
                );
              })}
            </div>

            {/* ── Tab content panel ── */}
            {activeDir && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"0 8px 12px 12px", overflow:"hidden" }}>

                {/* Panel header: directive info + standards inline */}
                <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"flex-start", gap:20, flexWrap:"wrap" }}>
                  <div style={{ minWidth:160 }}>
                    <div style={{ fontSize:16, fontWeight:800, color:activeDir.color, letterSpacing:"-0.02em", marginBottom:2 }}>{activeDir.label}</div>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:1 }}>{activeDir.full}</div>
                    <div style={{ fontSize:10, color:C.dim }}>{activeDir.ref}</div>
                  </div>
                  {/* Standards — vertical list inline */}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:7 }}>Applicable Standards</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      {activeDir.standards.map((s,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <div style={{ width:4, height:4, borderRadius:"50%", background:activeDir.color, opacity:0.5, flexShrink:0 }} />
                          <span style={{ fontSize:11, color:"#94a3b8", fontFamily:"'SFMono-Regular',monospace", fontWeight:500 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Quick count */}
                  <div style={{ display:"flex", gap:8, alignSelf:"flex-start" }}>
                    {["FAIL","WARN","PASS","INFO"].map(s => {
                      const n = tabFindings.filter(f=>f.status===s).length;
                      const sc = STATUS_CFG[s];
                      return n>0 && (
                        <div key={s} style={{ background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:6, padding:"5px 10px", textAlign:"center" }}>
                          <div style={{ fontSize:16, fontWeight:800, color:sc.color, lineHeight:1 }}>{n}</div>
                          <div style={{ fontSize:8, fontWeight:700, color:sc.color, opacity:0.7, letterSpacing:"0.08em", marginTop:2 }}>{s}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Findings list */}
                <div>
                  {tabFindings.map((f, idx) => {
                    const sc = STATUS_CFG[f.status] || STATUS_CFG.INFO;
                    return (
                      <div key={f._i} className="finding-row" style={{
                        padding:"14px 20px",
                        borderBottom: idx < tabFindings.length-1 ? `1px solid ${C.border}` : "none",
                        background:"transparent", transition:"background 0.12s",
                        display:"grid", gridTemplateColumns:"auto 1fr auto", gap:"0 14px",
                      }}>
                        {/* Status icon */}
                        <div style={{
                          width:26, height:26, borderRadius:6, flexShrink:0,
                          background:sc.bg, border:`1px solid ${sc.border}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:11, fontWeight:800, color:sc.color,
                          gridRow:"1 / 3", alignSelf:"start", marginTop:1,
                        }}>{sc.icon}</div>

                        {/* Article + finding */}
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:"#cbd5e1", marginBottom:4, lineHeight:1.4 }}>{f.article}</div>
                          <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.65 }}>{f.finding}</div>
                          {f.action && (
                            <div style={{ marginTop:8, paddingLeft:10, borderLeft:`2px solid ${sc.color}40`, fontSize:12, color:"#64748b", lineHeight:1.6 }}>
                              <span style={{ fontWeight:600, color:sc.color, opacity:0.9 }}>Action: </span>
                              {f.action}
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        <div style={{
                          fontSize:9, fontWeight:800, color:sc.color,
                          background:sc.bg, border:`1px solid ${sc.border}`,
                          padding:"3px 8px", borderRadius:5, alignSelf:"start",
                          letterSpacing:"0.07em", whiteSpace:"nowrap",
                        }}>{f.status}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}