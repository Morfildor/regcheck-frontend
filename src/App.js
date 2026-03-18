import { useState } from "react";

// ── Auto-detect directives from description ───────────────────────────────
function detectDirectives(text) {
  const t = text.toLowerCase();
  const has = (kws) => kws.some(k => t.includes(k));
  const active = [];

  if (has(["wifi","wi-fi","bluetooth","ble","zigbee","lora","nfc","lte","4g","5g","gsm","cellular","radio","wireless","rf ","802.11","nb-iot","cat-m"]))
    active.push("RED");

  if (has(["software","firmware","digital","processor","microcontroller","embedded","app","connected","iot","network","cloud","internet","ota","update","api"]))
    active.push("CRA");

  if (has(["personal data","user data","email","location","gps","health","biometric","usage data","account","profile","tracking","analytics","store data","cloud","login","password"]))
    active.push("GDPR");

  if (has(["ai ","artificial intelligence","machine learning"," ml ","neural","inference","model","recommendation","automated decision","computer vision","nlp","llm","voice assistant"]))
    active.push("AI_Act");

  if (has(["230v","mains","110v","ac power","wall plug","hardwired","power supply","li-ion","lithium","battery","rechargeable","usb power","poe","high voltage"]))
    active.push("LVD");

  if (has(["electronic","electrical","device","sensor","circuit","pcb","mcu","processor","power","voltage","wifi","bluetooth","radio","mains","battery","usb"]))
    active.push("EMC");

  if (has(["repair","recyclable","recycled","sustainability","energy label","energy class","spare part","eol","end of life","dpp","digital product passport","carbon"]))
    active.push("ESPR");

  if (active.length === 0 && text.length > 30) { active.push("CRA"); active.push("EMC"); }
  return active;
}

const DIR = {
  RED:    { label:"RED",    full:"Radio Equipment Directive",              color:"#2563eb" },
  CRA:    { label:"CRA",    full:"Cyber Resilience Act",                   color:"#db2777" },
  GDPR:   { label:"GDPR",   full:"General Data Protection Regulation",     color:"#059669" },
  AI_Act: { label:"AI Act", full:"Artificial Intelligence Act",            color:"#7c3aed" },
  LVD:    { label:"LVD",    full:"Low Voltage Directive",                  color:"#d97706" },
  EMC:    { label:"EMC",    full:"Electromagnetic Compatibility",          color:"#ea580c" },
  ESPR:   { label:"ESPR",   full:"Ecodesign for Sustainable Products",     color:"#16a34a" },
};

const STATUS = {
  FAIL: { label:"FAIL", icon:"✕", textColor:"#fff",    bg:"#dc2626", border:"#dc2626" },
  WARN: { label:"WARN", icon:"!",  textColor:"#92400e", bg:"#fef3c7", border:"#f59e0b" },
  PASS: { label:"PASS", icon:"✓", textColor:"#fff",    bg:"#16a34a", border:"#16a34a" },
  INFO: { label:"INFO", icon:"i",  textColor:"#1e3a8a", bg:"#dbeafe", border:"#3b82f6" },
};

const RISK_COLORS = {
  CRITICAL: { text:"#dc2626", bg:"#fef2f2" },
  HIGH:     { text:"#ea580c", bg:"#fff7ed" },
  MEDIUM:   { text:"#d97706", bg:"#fffbeb" },
  LOW:      { text:"#16a34a", bg:"#f0fdf4" },
};

export default function App() {
  const [desc,     setDesc]     = useState("");
  const [depth,    setDepth]    = useState("standard");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const [expanded, setExpanded] = useState({});

  const detected = detectDirectives(desc);

  const run = async () => {
    if (!desc.trim() || desc.length < 10) return;
    setLoading(true); setResult(null); setError(null); setExpanded({});
    try {
      const r = await fetch("https://regcheck-api.onrender.com/analyze", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ description:desc, category:"", directives:detected, depth }),
      });
      if (!r.ok) throw new Error("Server responded with error " + r.status);
      setResult(await r.json());
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const toggle = (i) => setExpanded(p => ({...p, [i]:!p[i]}));

  const grouped = result
    ? result.findings.reduce((acc, f, i) => {
        if (!acc[f.directive]) acc[f.directive] = [];
        acc[f.directive].push({...f, _i:i});
        return acc;
      }, {})
    : {};

  const counts = result
    ? result.findings.reduce((a,f) => { a[f.status]=(a[f.status]||0)+1; return a; }, {})
    : {};

  const riskCfg = result ? (RISK_COLORS[result.overall_risk] || RISK_COLORS.LOW) : null;

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:"#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#f1f5f9; }
        textarea { outline:none; }
        button { cursor:pointer; outline:none; border:none; font-family:inherit; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:0.55; } 50% { opacity:1; } }
        .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; }
        .finding { transition:box-shadow 0.15s; }
        .finding:hover { box-shadow:0 2px 10px rgba(0,0,0,0.08); }
        .run-btn:hover:not(:disabled) { filter:brightness(1.08); transform:translateY(-1px); }
        .run-btn:active:not(:disabled) { transform:translateY(0); }
        .back-btn:hover { background:#f1f5f9 !important; }
        textarea:focus { border-color:#6366f1 !important; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background:"#0f172a", padding:"0 24px", position:"sticky", top:0, zIndex:200, boxShadow:"0 1px 0 rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:860, margin:"0 auto", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#6366f1,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#fff" }}>R</div>
            <span style={{ fontWeight:800, fontSize:17, color:"#fff", letterSpacing:"-0.02em" }}>
              RegCheck <span style={{ color:"#818cf8", fontWeight:600 }}>EU</span>
            </span>
          </div>
          <span style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>EU Compliance Analysis · v3</span>
        </div>
      </nav>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"36px 20px 80px" }}>

        {/* ── HERO (only when no result) ── */}
        {!result && !loading && (
          <div style={{ marginBottom:28, animation:"fadeUp 0.35s ease" }}>
            <h1 style={{ fontSize:"clamp(24px,4vw,34px)", fontWeight:800, color:"#0f172a", letterSpacing:"-0.03em", lineHeight:1.2, marginBottom:10 }}>
              EU Compliance, instantly.
            </h1>
            <p style={{ fontSize:15, color:"#64748b", lineHeight:1.65, maxWidth:500 }}>
              Describe your product and we automatically detect applicable EU directives — RED, CRA, GDPR, AI Act, LVD, EMC, ESPR — and run a full compliance check.
            </p>
          </div>
        )}

        {/* ── INPUT CARD ── */}
        <div className="card" style={{ marginBottom:20, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", animation:"fadeUp 0.3s ease" }}>

          <div style={{ padding:"22px 22px 16px" }}>
            <label style={{ fontSize:11, fontWeight:700, color:"#64748b", letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:10 }}>
              Product Description
            </label>
            <textarea
              rows={8}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder={"Describe your product in detail — the more specific, the better:\n\n• What it does and who uses it\n• Connectivity: WiFi, Bluetooth, 4G/5G, Zigbee, NFC…\n• Power: mains 230V, Li-ion battery, USB-C…\n• Data collected: personal info, location, health data?\n• Software: firmware updates, mobile app, cloud API?\n• Special: AI/ML models, camera, voice, medical sensors…"}
              style={{
                width:"100%", border:"1.5px solid #e2e8f0", borderRadius:8,
                background:"#f8fafc", color:"#0f172a", fontSize:14,
                lineHeight:1.75, padding:"14px 16px", resize:"vertical",
                fontFamily:"inherit", minHeight:190, transition:"all 0.15s",
              }}
            />
            <div style={{ marginTop:7, fontSize:12, color: desc.length < 50 ? "#f59e0b" : "#94a3b8", fontWeight:500 }}>
              {desc.length} chars{desc.length < 50 ? " — add more detail for accurate results" : " ✓"}
            </div>
          </div>

          {/* Detected directive tags */}
          {desc.length > 20 && (
            <div style={{ padding:"11px 22px", background:"#f8fafc", borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.07em", marginRight:2 }}>Detected:</span>
              {detected.length === 0
                ? <span style={{ fontSize:12, color:"#cbd5e1" }}>None yet</span>
                : detected.map(id => {
                    const d = DIR[id];
                    return (
                      <span key={id} style={{
                        fontSize:11, fontWeight:700, color:"#fff",
                        background:d.color, padding:"3px 11px",
                        borderRadius:6, letterSpacing:"0.03em",
                      }}>{d.label}</span>
                    );
                  })
              }
            </div>
          )}

          {/* Depth selector + Run button */}
          <div style={{ padding:"14px 22px 18px", borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:600, color:"#64748b" }}>Depth:</span>
            {[{value:"standard",label:"Standard"},{value:"deep",label:"Deep"}].map(d => (
              <button key={d.value} onClick={()=>setDepth(d.value)} style={{
                fontSize:12, fontWeight:600, padding:"7px 16px", borderRadius:7,
                border:"1.5px solid " + (depth===d.value ? "#6366f1" : "#e2e8f0"),
                background: depth===d.value ? "#eef2ff" : "#fff",
                color: depth===d.value ? "#4f46e5" : "#64748b",
                transition:"all 0.15s",
              }}>{d.label}</button>
            ))}

            <button
              className="run-btn"
              onClick={run}
              disabled={loading || desc.trim().length < 10}
              style={{
                marginLeft:"auto",
                background: (loading || desc.trim().length < 10) ? "#cbd5e1" : "#4f46e5",
                color:"#fff", fontSize:14, fontWeight:700,
                padding:"11px 30px", borderRadius:8,
                boxShadow: desc.trim().length >= 10 ? "0 4px 14px rgba(79,70,229,0.3)" : "none",
                transition:"all 0.2s", display:"flex", alignItems:"center", gap:8,
                letterSpacing:"-0.01em",
              }}
            >
              {loading
                ? <><div style={{ width:14, height:14, border:"2.5px solid rgba(255,255,255,0.35)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />Analysing…</>
                : "Run Analysis →"
              }
            </button>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="card" style={{ borderColor:"#fca5a5", padding:"18px 22px", marginBottom:20, display:"flex", gap:14, animation:"fadeUp 0.25s ease" }}>
            <div style={{ width:34, height:34, borderRadius:8, background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>⚠️</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#dc2626", marginBottom:5 }}>Backend unreachable</div>
              <div style={{ fontSize:13, color:"#7f1d1d", lineHeight:1.65, marginBottom:10 }}>{error}</div>
              <code style={{ fontSize:12, background:"#0f172a", color:"#a78bfa", padding:"7px 14px", borderRadius:7, display:"inline-block", letterSpacing:"0.02em" }}>
                uvicorn main:app --reload
              </code>
            </div>
          </div>
        )}

        {/* ── LOADING SKELETON ── */}
        {loading && (
          <div style={{ animation:"fadeUp 0.2s ease" }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:18, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:14, height:14, border:"2.5px solid #c7d2fe", borderTopColor:"#4f46e5", borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />
              Checking {detected.length} directive{detected.length!==1?"s":""}…
            </div>
            {[1,2,3,4].map(i => (
              <div key={i} className="card" style={{ padding:22, marginBottom:12, animation:`shimmer 1.5s ease-in-out ${i*0.15}s infinite` }}>
                <div style={{ height:14, background:"#f1f5f9", borderRadius:6, width:"30%", marginBottom:14 }} />
                <div style={{ height:12, background:"#f8fafc", borderRadius:5, width:"88%", marginBottom:8 }} />
                <div style={{ height:12, background:"#f8fafc", borderRadius:5, width:"65%" }} />
              </div>
            ))}
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>

            {/* Risk / summary banner */}
            <div className="card" style={{ marginBottom:24, overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ padding:"22px 24px", background:riskCfg.bg, borderBottom:"1px solid #e2e8f0", display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>

                {/* Risk level */}
                <div style={{ minWidth:100 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:5 }}>Risk Level</div>
                  <div style={{ fontSize:34, fontWeight:800, color:riskCfg.text, letterSpacing:"-0.04em", lineHeight:1 }}>{result.overall_risk}</div>
                </div>

                <div style={{ width:1, alignSelf:"stretch", background:"#e2e8f0", flexShrink:0 }} />

                {/* Summary text */}
                <div style={{ flex:1, minWidth:220 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:7 }}>Summary</div>
                  <div style={{ fontSize:14, color:"#1e293b", lineHeight:1.7, fontWeight:400 }}>{result.product_summary}</div>
                </div>

                {/* Counts */}
                <div style={{ display:"flex", gap:10, flexShrink:0, flexWrap:"wrap" }}>
                  {[
                    ["FAIL","#dc2626","#fef2f2","#fecaca"],
                    ["WARN","#d97706","#fffbeb","#fde68a"],
                    ["PASS","#16a34a","#f0fdf4","#a7f3d0"],
                    ["INFO","#4f46e5","#eef2ff","#c7d2fe"],
                  ].map(([s,c,bg,bd]) => (counts[s]>0) && (
                    <div key={s} style={{ background:bg, border:`1.5px solid ${bd}`, borderRadius:10, padding:"9px 16px", textAlign:"center", minWidth:58 }}>
                      <div style={{ fontSize:22, fontWeight:800, color:c, lineHeight:1 }}>{counts[s]}</div>
                      <div style={{ fontSize:10, fontWeight:700, color:c, opacity:0.75, letterSpacing:"0.07em", marginTop:3 }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Directives checked */}
              <div style={{ padding:"12px 24px", display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
                <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", marginRight:4 }}>Checked against:</span>
                {detected.map(id => {
                  const d = DIR[id];
                  return (
                    <span key={id} style={{ fontSize:11, fontWeight:700, color:d.color, background:d.color+"14", padding:"3px 10px", borderRadius:6, border:`1px solid ${d.color}28` }}>
                      {d.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Findings grouped by directive */}
            {Object.entries(grouped).map(([directive, findings]) => {
              const dm = DIR[directive] || { label:directive, color:"#6366f1", full:"" };
              const fc = findings.filter(f=>f.status==="FAIL").length;
              const wc = findings.filter(f=>f.status==="WARN").length;

              return (
                <div key={directive} style={{ marginBottom:22 }}>
                  {/* Directive label row */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:12, fontWeight:800, color:"#fff", background:dm.color, padding:"5px 13px", borderRadius:7, letterSpacing:"0.03em" }}>
                      {dm.label}
                    </span>
                    <span style={{ fontSize:13, fontWeight:500, color:"#475569" }}>{dm.full}</span>
                    <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
                    {fc>0 && <span style={{ fontSize:11, fontWeight:700, color:"#dc2626", background:"#fef2f2", padding:"2px 8px", borderRadius:5 }}>{fc} FAIL</span>}
                    {wc>0 && <span style={{ fontSize:11, fontWeight:700, color:"#d97706", background:"#fffbeb", padding:"2px 8px", borderRadius:5 }}>{wc} WARN</span>}
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {findings.map(f => {
                      const sc = STATUS[f.status] || STATUS.INFO;
                      const open = expanded[f._i];
                      return (
                        <div
                          key={f._i}
                          className="card finding"
                          onClick={()=>toggle(f._i)}
                          style={{ cursor:"pointer", overflow:"hidden" }}
                        >
                          <div style={{ padding:"16px 18px", display:"flex", gap:14, alignItems:"flex-start" }}>
                            {/* Status icon */}
                            <div style={{
                              width:30, height:30, borderRadius:8, flexShrink:0,
                              background:sc.bg, border:`1.5px solid ${sc.border}`,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:13, fontWeight:800, color:sc.textColor,
                              marginTop:1,
                            }}>{sc.icon}</div>

                            <div style={{ flex:1, minWidth:0 }}>
                              {/* Article */}
                              <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", lineHeight:1.45, marginBottom:5 }}>
                                {f.article}
                              </div>
                              {/* Finding body */}
                              <div style={{
                                fontSize:13, color:"#374151", lineHeight:1.7,
                                overflow: open ? "visible" : "hidden",
                                display: open ? "block" : "-webkit-box",
                                WebkitLineClamp: open ? "unset" : 2,
                                WebkitBoxOrient: "vertical",
                              }}>
                                {f.finding}
                              </div>
                            </div>

                            {/* Status label pill */}
                            <span style={{
                              fontSize:10, fontWeight:800, flexShrink:0,
                              background:sc.bg, color:sc.textColor,
                              border:`1.5px solid ${sc.border}`,
                              padding:"4px 10px", borderRadius:6,
                              letterSpacing:"0.07em", marginTop:2,
                            }}>{sc.label}</span>
                          </div>

                          {/* Required action (expanded) */}
                          {open && f.action && (
                            <div style={{ margin:"0 18px 16px 62px", padding:"14px 16px", background:"#f8fafc", borderRadius:8, border:"1.5px solid #e2e8f0" }}>
                              <div style={{ fontSize:11, fontWeight:800, color:"#4f46e5", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>
                                ▸ Required Action
                              </div>
                              <div style={{ fontSize:13, color:"#1e293b", lineHeight:1.72, fontWeight:400 }}>{f.action}</div>
                            </div>
                          )}

                          {/* Collapse / expand hint */}
                          <div style={{ padding:"5px 18px 11px 62px", fontSize:11, color:"#94a3b8", fontWeight:500, userSelect:"none" }}>
                            {open ? "▲ collapse" : "▼ expand to see required action"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Run again button */}
            <div style={{ display:"flex", justifyContent:"center", marginTop:36 }}>
              <button
                className="back-btn"
                onClick={()=>{ setResult(null); setError(null); }}
                style={{ background:"#fff", border:"1.5px solid #e2e8f0", color:"#475569", fontSize:13, fontWeight:600, padding:"11px 30px", borderRadius:8, transition:"all 0.15s" }}
              >
                ← Modify and run again
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}