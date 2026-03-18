import { useState } from "react";

// ── Auto-detect which directives apply based on description ───────────────
function detectDirectives(text) {
  const t = text.toLowerCase();
  const active = [];

  const has = (keywords) => keywords.some(k => t.includes(k));

  if (has(["wifi","wi-fi","bluetooth","ble","zigbee","lora","nfc","lte","4g","5g","gsm","cellular","radio","wireless","rf module","802.11","nb-iot","cat-m"]))
    active.push("RED");

  if (has(["software","firmware","digital","processor","microcontroller","embedded","app","connected","iot","network","cloud","internet","ota","update"]))
    active.push("CRA");

  if (has(["personal data","user data","email","location","gps","health","biometric","usage data","account","profile","tracking","analytics","store data","cloud"]))
    active.push("GDPR");

  if (has(["ai","machine learning","ml","neural","inference","model","recommendation","automated decision","computer vision","nlp","llm","voice assistant"]))
    active.push("AI_Act");

  if (has(["230v","mains","110v","ac power","wall plug","hardwired","power supply","li-ion","lithium","battery","rechargeable","usb power","poe"]))
    active.push("LVD");

  // EMC applies to virtually all electronics
  if (has(["electronic","electrical","device","sensor","circuit","pcb","mcu","processor","power","voltage","current","wifi","bluetooth","radio","mains","battery","usb"]))
    active.push("EMC");

  if (has(["repair","recyclable","recycled","sustainability","energy label","energy class","spare part","eol","end of life","dpp","digital product passport","carbon"]))
    active.push("ESPR");

  // If nothing matched but there's substantial text, assume at minimum CRA+EMC for any digital product
  if (active.length === 0 && text.length > 30) {
    active.push("CRA");
    active.push("EMC");
  }

  return active;
}

const DIRECTIVE_META = {
  RED:    { label: "RED",    full: "Radio Equipment Directive",               color: "#3b82f6", bg: "#eff6ff" },
  CRA:    { label: "CRA",    full: "Cyber Resilience Act",                    color: "#ec4899", bg: "#fdf2f8" },
  GDPR:   { label: "GDPR",   full: "General Data Protection Regulation",       color: "#10b981", bg: "#f0fdf4" },
  AI_Act: { label: "AI Act", full: "Artificial Intelligence Act",              color: "#8b5cf6", bg: "#f5f3ff" },
  LVD:    { label: "LVD",    full: "Low Voltage Directive",                    color: "#f59e0b", bg: "#fffbeb" },
  EMC:    { label: "EMC",    full: "Electromagnetic Compatibility Directive",   color: "#f97316", bg: "#fff7ed" },
  ESPR:   { label: "ESPR",   full: "Ecodesign for Sustainable Products",       color: "#84cc16", bg: "#f7fee7" },
};

const STATUS_CONFIG = {
  FAIL: { icon: "✕", color: "#ef4444", bg: "#fef2f2", border: "#fecaca", label: "Non-Conformity" },
  WARN: { icon: "▲", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Warning"        },
  PASS: { icon: "✓", color: "#10b981", bg: "#f0fdf4", border: "#a7f3d0", label: "Pass"           },
  INFO: { icon: "i", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", label: "Info"           },
};

const RISK_CONFIG = {
  CRITICAL: { color: "#ef4444", bg: "#fef2f2", bar: "#ef4444" },
  HIGH:     { color: "#f97316", bg: "#fff7ed", bar: "#f97316" },
  MEDIUM:   { color: "#f59e0b", bg: "#fffbeb", bar: "#f59e0b" },
  LOW:      { color: "#10b981", bg: "#f0fdf4", bar: "#10b981" },
};

const DEPTHS = [
  { value: "standard", label: "Standard", desc: "Core compliance check" },
  { value: "deep",     label: "Deep",     desc: "Full technical audit" },
];

export default function App() {
  const [desc,    setDesc]    = useState("");
  const [depth,   setDepth]   = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [expanded, setExpanded] = useState({});

  const detected = detectDirectives(desc);

  const run = async () => {
    if (!desc.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const r = await fetch("https://regcheck-api.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: detected, depth }),
      });
      if (!r.ok) throw new Error("Server error " + r.status);
      setResult(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const toggleExpand = (i) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  const grouped = result ? result.findings.reduce((acc, f, i) => {
    const key = f.directive;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...f, _i: i });
    return acc;
  }, {}) : {};

  const counts = result ? result.findings.reduce((a, f) => {
    a[f.status] = (a[f.status] || 0) + 1; return a;
  }, {}) : {};

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#0f172a",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; }
        ::placeholder { color: #94a3b8; }
        textarea { outline: none; }
        button { cursor: pointer; outline: none; border: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .finding-row:hover { background: #f8fafc !important; }
        .run-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,102,241,0.35) !important; }
        .run-btn:active:not(:disabled) { transform: translateY(0); }
        .depth-btn:hover { border-color: #6366f1 !important; }
        .directive-tag { transition: all 0.15s; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 24px",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#fff", fontWeight: 700,
            }}>R</div>
            <div>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#0f172a", letterSpacing: "-0.02em" }}>RegCheck</span>
              <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, marginLeft: 6, letterSpacing: "0.05em" }}>EU</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>EU Compliance Intelligence</div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── HERO ── */}
        {!result && !loading && (
          <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeUp 0.4s ease" }}>
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(28px, 5vw, 44px)",
              fontWeight: 400,
              color: "#0f172a",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              marginBottom: 14,
            }}>
              EU Compliance, <span style={{ color: "#6366f1" }}>instantly.</span>
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Describe your product. We automatically detect which EU directives apply and run a full compliance check.
            </p>
          </div>
        )}

        {/* ── INPUT CARD ── */}
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
        }}>
          <div style={{ marginBottom:20 }}>
  <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.18em", color:"#2a3c2e", marginBottom:7 }}>Product Description</div>
  
  <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
    
    {/* Textarea */}
    <textarea rows={9} value={desc} onChange={e => setDesc(e.target.value)}
      placeholder="Describe your product in detail…"
      style={{ flex:1, background:"#0b1210", border:"1px solid #111a14", color:"#c0d8c4", fontSize:12, padding:"13px 15px", borderRadius:4, resize:"vertical", lineHeight:1.8, fontFamily:"inherit", transition:"border-color 0.2s", minHeight:210 }} />

    {/* Checklist sidebar */}
    <div style={{ width:200, flexShrink:0, background:"#0b1210", border:"1px solid #111a14", borderRadius:4, padding:"11px 13px" }}>
      <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.16em", color:"#2a3c2e", marginBottom:9 }}>Cover these topics</div>
      {[
        { key:"connectivity", label:"Connectivity", keywords:["wifi","wi-fi","bluetooth","bt ","ble","zigbee","lora","nfc","lte","4g","5g","cellular","gsm","radio","wireless"] },
        { key:"market",       label:"Market / region", keywords:["eu ","residential","industrial","medical","retail","consumer","professional"] },
        { key:"data",         label:"Data & cloud", keywords:["cloud","aws","azure","data","storage","analytics","local","offline"] },
        { key:"power",        label:"Power supply", keywords:["230v","mains","battery","usb","poe","li-ion","3.7v","5v","power"] },
        { key:"features",     label:"Features", keywords:["camera","voice","ota","update","mobile app","ai","ml","dashboard"] },
        { key:"auth",         label:"Auth & access", keywords:["password","login","mfa","oauth","pairing","credentials","2fa"] },
        { key:"user",         label:"Target user", keywords:["consumer","child","professional","patient","user","adult"] },
      ].map(item => {
        const covered = item.keywords.some(k => desc.toLowerCase().includes(k));
        return (
          <div key={item.key} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7, transition:"opacity 0.2s", opacity: covered ? 0.4 : 1 }}>
            <div style={{ width:12, height:12, flexShrink:0, borderRadius:2, border:`1px solid ${covered?"#4ade80":"#1c2820"}`, background:covered?"rgba(74,222,128,0.15)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
              {covered && <span style={{ color:"#4ade80", fontSize:9, lineHeight:1 }}>✓</span>}
            </div>
            <span style={{ fontSize:10, color: covered ? "#2a3c2e" : "#4a6a54", textDecoration: covered ? "line-through" : "none", transition:"all 0.2s" }}>{item.label}</span>
          </div>
        );
      })}
    </div>

  </div>
  <div style={{ marginTop:5, fontSize:9, color:"#182018" }}>{desc.length} characters — aim for 100+ for best results</div>
</div>

          {/* Detected directives preview */}
          {desc.length > 20 && (
            <div style={{ padding: "10px 24px 16px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Auto-detected:</span>
              {detected.length === 0 && <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>}
              {detected.map(id => {
                const m = DIRECTIVE_META[id];
                return (
                  <span key={id} className="directive-tag" style={{
                    fontSize: 11, fontWeight: 600,
                    color: m.color, background: m.bg,
                    padding: "3px 9px", borderRadius: 99,
                    border: `1px solid ${m.color}30`,
                  }}>{m.label}</span>
                );
              })}
            </div>
          )}

          {/* Depth + Run */}
          <div style={{ padding: "14px 24px 20px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, marginRight: 2 }}>Depth:</span>
            {DEPTHS.map(d => (
              <button key={d.value} className="depth-btn" onClick={() => setDepth(d.value)} style={{
                fontSize: 12, fontWeight: 500,
                padding: "6px 14px",
                borderRadius: 8,
                background: depth === d.value ? "#eef2ff" : "transparent",
                color: depth === d.value ? "#6366f1" : "#94a3b8",
                border: `1px solid ${depth === d.value ? "#c7d2fe" : "#e2e8f0"}`,
                transition: "all 0.15s",
              }}>{d.label}</button>
            ))}

            <button
              className="run-btn"
              onClick={run}
              disabled={loading || desc.trim().length < 10}
              style={{
                marginLeft: "auto",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff",
                fontSize: 13, fontWeight: 600,
                padding: "10px 28px",
                borderRadius: 10,
                boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
                opacity: (loading || desc.trim().length < 10) ? 0.5 : 1,
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 8,
                letterSpacing: "0.01em",
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Analysing…
                </>
              ) : "Run Compliance Check →"}
            </button>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
            padding: "16px 20px", marginBottom: 24, animation: "fadeUp 0.3s ease",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ color: "#ef4444", fontSize: 16, marginTop: 1 }}>⚠</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>Backend unreachable</div>
              <div style={{ fontSize: 12, color: "#7f1d1d", lineHeight: 1.6 }}>{error}</div>
              <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 8, fontFamily: "monospace", background: "#fee2e2", padding: "6px 10px", borderRadius: 6, display: "inline-block" }}>
                uvicorn main:app --reload
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING SKELETON ── */}
        {loading && (
          <div style={{ animation: "fadeUp 0.2s ease" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
                padding: 20, marginBottom: 12,
                animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
              }}>
                <div style={{ height: 12, background: "#f1f5f9", borderRadius: 6, width: "40%", marginBottom: 10 }} />
                <div style={{ height: 10, background: "#f8fafc", borderRadius: 6, width: "85%", marginBottom: 6 }} />
                <div style={{ height: 10, background: "#f8fafc", borderRadius: 6, width: "60%" }} />
              </div>
            ))}
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div style={{ animation: "fadeUp 0.35s ease" }}>

            {/* Risk summary banner */}
            <div style={{
              background: RISK_CONFIG[result.overall_risk]?.bg || "#f8fafc",
              border: `1px solid ${RISK_CONFIG[result.overall_risk]?.bar || "#e2e8f0"}30`,
              borderLeft: `4px solid ${RISK_CONFIG[result.overall_risk]?.bar || "#6366f1"}`,
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 24,
              display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Overall Risk</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: RISK_CONFIG[result.overall_risk]?.bar, fontFamily: "'DM Serif Display', serif", letterSpacing: "-0.02em" }}>
                  {result.overall_risk}
                </div>
              </div>

              <div style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch", flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Summary</div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.65 }}>{result.product_summary}</div>
              </div>

              {/* Counters */}
              <div style={{ display: "flex", gap: 12 }}>
                {[["FAIL","#ef4444"],["WARN","#f59e0b"],["PASS","#10b981"],["INFO","#6366f1"]].map(([s, c]) => (
                  counts[s] > 0 && (
                    <div key={s} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: c, lineHeight: 1 }}>{counts[s]}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.08em", marginTop: 2 }}>{s}</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Findings grouped by directive */}
            {Object.entries(grouped).map(([directive, findings]) => {
              const meta = DIRECTIVE_META[directive] || { label: directive, color: "#6366f1", bg: "#eef2ff" };
              return (
                <div key={directive} style={{ marginBottom: 20 }}>
                  {/* Directive header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: meta.color, background: meta.bg,
                      padding: "4px 12px", borderRadius: 99,
                      border: `1px solid ${meta.color}25`,
                    }}>{meta.label}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>{meta.full}</span>
                    <div style={{ flex: 1, height: 1, background: "#f1f5f9", marginLeft: 4 }} />
                    <span style={{ fontSize: 11, color: "#cbd5e1" }}>{findings.length} item{findings.length !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Finding cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {findings.map((f) => {
                      const sc = STATUS_CONFIG[f.status] || STATUS_CONFIG.INFO;
                      const open = expanded[f._i];
                      return (
                        <div key={f._i}
                          className="finding-row"
                          onClick={() => toggleExpand(f._i)}
                          style={{
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {/* Row header */}
                          <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                            {/* Status badge */}
                            <div style={{
                              width: 24, height: 24, borderRadius: 6,
                              background: sc.bg, border: `1px solid ${sc.border}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, color: sc.color,
                              flexShrink: 0, marginTop: 1,
                            }}>{sc.icon}</div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 3, lineHeight: 1.4 }}>
                                {f.article}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.55,
                                overflow: open ? "visible" : "hidden",
                                display: open ? "block" : "-webkit-box",
                                WebkitLineClamp: open ? "unset" : 2,
                                WebkitBoxOrient: "vertical",
                              }}>
                                {f.finding}
                              </div>
                            </div>

                            <span style={{ fontSize: 10, color: sc.color, fontWeight: 700, flexShrink: 0, marginTop: 3, padding: "2px 8px", background: sc.bg, borderRadius: 6 }}>
                              {f.status}
                            </span>
                          </div>

                          {/* Expanded action */}
                          {open && f.action && (
                            <div style={{
                              margin: "0 16px 14px 52px",
                              padding: "12px 14px",
                              background: "#f8fafc",
                              borderRadius: 8,
                              border: "1px solid #f1f5f9",
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                                Required Action
                              </div>
                              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65 }}>{f.action}</div>
                            </div>
                          )}

                          {/* Expand hint */}
                          <div style={{ padding: "0 16px 10px 52px", fontSize: 10, color: "#cbd5e1" }}>
                            {open ? "▲ collapse" : "▼ expand for required action"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Run again */}
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button onClick={() => { setResult(null); setError(null); }} style={{
                background: "transparent",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                fontSize: 13, fontWeight: 500,
                padding: "10px 24px",
                borderRadius: 10,
                transition: "all 0.15s",
              }}>← Modify and run again</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}