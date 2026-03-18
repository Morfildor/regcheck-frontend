import { useState } from "react";

const LEGISLATION = [
  {
    id: "RED", label: "RED", full: "Radio Equipment Directive", ref: "2014/53/EU", color: "#60a5fa",
    description: "Cybersecurity requirements for WiFi, Bluetooth, Zigbee and all radio-enabled products",
    standards: ["ETSI EN 303 645", "EN 18031-1/-2/-3", "ETSI EN 301 489-1", "ETSI EN 301 489-17", "ETSI EN 300 328", "Del. Reg. (EU) 2022/30"],
    docs: ["Threat model", "Security architecture", "SBOM", "Vulnerability disclosure policy", "Test reports (EN 303 645)", "DoC referencing Del. Reg."],
  },
  {
    id: "CRA", label: "CRA", full: "Cyber Resilience Act", ref: "2024/2847", color: "#f472b6",
    description: "Mandatory cybersecurity for all products with digital elements sold in the EU",
    standards: ["ETSI EN 303 645", "IEC 62443 series", "NIST CSF 2.0", "ISO/IEC 27001", "SPDX / CycloneDX", "ENISA reporting process"],
    docs: ["SBOM (machine-readable)", "Vulnerability handling policy", "CVD programme", "5-year update commitment", "Technical file (Annex VII)", "EU DoC"],
  },
  {
    id: "AI_Act", label: "AI Act", full: "Artificial Intelligence Act", ref: "2024/1689", color: "#a78bfa",
    description: "Risk-based regulation for AI systems — from minimal risk to prohibited practices",
    standards: ["ISO/IEC 42001", "ISO/IEC 23894", "NIST AI RMF", "CEN/CENELEC JTC 21", "ISO/IEC 25059"],
    docs: ["AI system card (Art.11)", "Risk management system", "Training data documentation", "Performance metrics", "Post-market monitoring plan", "EU AI database registration"],
  },
  {
    id: "GDPR", label: "GDPR", full: "General Data Protection Regulation", ref: "2016/679", color: "#34d399",
    description: "Personal data protection obligations for products that collect, process or transmit user data",
    standards: ["ISO/IEC 27701", "ISO/IEC 29134 (DPIA)", "ENISA guidelines", "EDPB guidelines", "ISO/IEC 27018"],
    docs: ["DPIA (Art.35)", "Records of processing (Art.30)", "Data Processing Agreements", "Privacy notice", "Consent mechanism", "Data retention policy"],
  },
  {
    id: "EMC", label: "EMC", full: "Electromagnetic Compatibility Directive", ref: "2014/30/EU", color: "#fbbf24",
    description: "Limits on electromagnetic emissions and minimum immunity requirements for electrical products",
    standards: ["EN 55032 (emissions)", "EN 55035 (immunity)", "EN 61000-4-2 (ESD)", "EN 61000-4-3 (radiated)", "EN 61000-4-4 (EFT)", "ETSI EN 301 489 series"],
    docs: ["EMC test reports (accredited lab)", "Technical construction file", "List of harmonised standards applied", "EU Declaration of Conformity"],
  },
  {
    id: "LVD", label: "LVD", full: "Low Voltage Directive", ref: "2014/35/EU", color: "#fb923c",
    description: "Electrical safety requirements for mains-powered and battery-powered products",
    standards: ["EN 60335-1 (household)", "EN 60335-2-x (product-specific)", "EN 62368-1 (AV/IT)", "IEC 62133-2 (Li-ion)", "EN 60529 (IP rating)"],
    docs: ["Electrical schematic", "Risk assessment", "Insulation coordination analysis", "LVD test reports", "Battery cell specifications", "EU Declaration of Conformity"],
  },
  {
    id: "ESPR", label: "ESPR", full: "Ecodesign for Sustainable Products Regulation", ref: "2024/1781", color: "#86efac",
    description: "Sustainability, repairability and software longevity requirements — Digital Product Passport incoming",
    standards: ["ISO 14040/44 (LCA)", "EN 45554 (repairability)", "IEC 63074 (software updates)", "GS1 standards (DPP data)", "CIRPASS (DPP format)"],
    docs: ["Repairability index", "Spare parts commitment", "Software support period", "Digital Product Passport (DPP)", "Product information sheet", "Material declaration"],
  },
];

const DEPTHS = [
  { value: "quick", label: "Quick", desc: "3-5 key gaps only" },
  { value: "standard", label: "Standard", desc: "Article-by-article" },
  { value: "deep", label: "Deep", desc: "Full doc checklist" },
];

const STATUS_COLOR = { PASS: "#4ade80", WARN: "#facc15", FAIL: "#f87171", INFO: "#38bdf8" };
const STATUS_BG    = { PASS: "rgba(74,222,128,0.08)", WARN: "rgba(250,204,21,0.08)", FAIL: "rgba(248,113,113,0.08)", INFO: "rgba(56,189,248,0.08)" };
const RISK_COLOR   = { LOW: "#4ade80", MEDIUM: "#facc15", HIGH: "#f87171", CRITICAL: "#f87171" };
const RISK_BG      = { LOW: "rgba(74,222,128,0.06)", MEDIUM: "rgba(250,204,21,0.06)", HIGH: "rgba(248,113,113,0.07)", CRITICAL: "rgba(248,113,113,0.11)" };

function StatusBadge({ status }) {
  return (
    <span style={{
      fontSize: 9, padding: "3px 7px", borderRadius: 2,
      background: STATUS_BG[status], color: STATUS_COLOR[status],
      border: `1px solid ${STATUS_COLOR[status]}30`,
      letterSpacing: "0.1em", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0
    }}>{status}</span>
  );
}

function Skeleton() {
  return (
    <div style={{ padding: "24px 20px" }}>
      <style>{`@keyframes skshimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
      {[80, 60, 90, 50, 70, 65].map((w, i) => (
        <div key={i} style={{
          height: i % 3 === 0 ? 10 : 7, borderRadius: 3, marginBottom: i % 3 === 0 ? 18 : 8,
          width: `${w}%`, background: "linear-gradient(90deg,#151d18 25%,#1e2e24 50%,#151d18 75%)",
          backgroundSize: "800px 100%", animation: `skshimmer 1.4s infinite linear`,
          animationDelay: `${i * 0.1}s`
        }} />
      ))}
    </div>
  );
}

export default function App() {
  const [desc, setDesc]         = useState("");
  const [selected, setSelected] = useState(["RED", "AI_Act"]);
  const [depth, setDepth]       = useState("standard");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState("input");

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const run = async () => {
    if (!desc.trim()) { alert("Please enter a product description."); return; }
    if (!selected.length) { alert("Select at least one directive."); return; }
    setLoading(true); setResult(null); setError(null); setTab("results");
    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: selected, depth }),
      });
      if (!res.ok) throw new Error("Server error " + res.status);
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const counts = result
    ? result.findings.reduce((a, f) => { a[f.status] = (a[f.status]||0)+1; return a; }, {})
    : {};

  const selectedLeg = LEGISLATION.filter(l => selected.includes(l.id));

  const tabs = [
    { id: "input",     icon: "⌨",  label: "Input" },
    { id: "results",   icon: "◈",  label: "Results",   badge: result ? (counts.FAIL||0)+(counts.WARN||0) : null },
    { id: "reference", icon: "⊞",  label: "Reference" },
  ];

  return (
    <div style={{ background: "#080c0b", minHeight: "100vh", color: "#dce8de", fontFamily: "'IBM Plex Mono','Courier New',monospace", paddingBottom: 64 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#1e2e24;border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        textarea:focus{border-color:rgba(100,240,140,0.3)!important;outline:none;}
        .btn-run:hover:not(:disabled){background:#86f5a6!important;transform:translateY(-1px);}
        .finding-row:hover{background:rgba(255,255,255,0.012);}
        .tab-btn:hover{color:#8ab89a!important;}
        .dir-btn:hover{opacity:1!important;}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #121a16", padding:"12px 18px", display:"flex", alignItems:"center", gap:12, background:"rgba(8,12,11,0.97)", position:"sticky", top:0, zIndex:200, backdropFilter:"blur(14px)" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800, color:"#64f08c", letterSpacing:"-0.02em" }}>RegCheck</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:"#1e2e24" }}>EU</span>
        </div>
        <div style={{ width:1, height:14, background:"#1a2420" }} />
        <span style={{ fontSize:9, color:"#1e3028", letterSpacing:"0.16em", textTransform:"uppercase" }}>Compliance Intelligence</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:1, background:"#0c1410", border:"1px solid #131d18", borderRadius:3, padding:2 }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
              style={{ background: tab===t.id ? "#182420":"transparent", border:"none", color: tab===t.id ? "#64f08c":"#2a3c30", fontSize:10, padding:"5px 12px", borderRadius:2, cursor:"pointer", fontFamily:"inherit", transition:"color 0.15s", display:"flex", alignItems:"center", gap:5 }}>
              <span>{t.icon}</span><span>{t.label}</span>
              {t.badge > 0 && <span style={{ background:"#f87171", color:"#080c0b", fontSize:8, fontWeight:700, borderRadius:10, padding:"1px 5px" }}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Directive strip */}
      <div style={{ borderBottom:"1px solid #0f1712", background:"#090e0c", overflowX:"auto" }}>
        <div style={{ display:"flex", minWidth:"fit-content" }}>
          {LEGISLATION.map((leg, i) => {
            const on = selected.includes(leg.id);
            return (
              <button key={leg.id} className="dir-btn" onClick={() => toggle(leg.id)}
                style={{ background: on ? `${leg.color}0c`:"transparent", border:"none", borderRight: i<LEGISLATION.length-1 ? "1px solid #0f1712":"none", borderBottom:`2px solid ${on ? leg.color:"transparent"}`, padding:"9px 16px 8px", cursor:"pointer", display:"flex", flexDirection:"column", gap:1, transition:"all 0.15s", opacity: on ? 1:0.35 }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:800, color: on ? leg.color:"#3a5044", whiteSpace:"nowrap" }}>{leg.label}</span>
                <span style={{ fontSize:8, color: on ? `${leg.color}55`:"#1a2820", whiteSpace:"nowrap" }}>{leg.ref}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* INPUT */}
      {tab === "input" && (
        <div style={{ maxWidth:780, margin:"0 auto", padding:"28px 18px", animation:"fadeUp 0.25s ease" }}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.18em", color:"#2a3c30", marginBottom:7 }}>Product Description</div>
            <textarea rows={8} value={desc} onChange={e => setDesc(e.target.value)}
              placeholder={"Describe the product:\n\n• Connectivity: WiFi, BT, Zigbee, LoRa, NFC\n• Market: EU residential / industrial / medical\n• Data: cloud storage, local only, US servers\n• Power: mains, Li-ion battery, USB\n• Features: AI/ML, camera, voice, OTA updates\n• Auth: login, password, default credentials\n\nMore detail = more accurate analysis."}
              style={{ width:"100%", background:"#0c1410", border:"1px solid #131d18", color:"#c8deca", fontSize:12, padding:"13px 15px", borderRadius:4, resize:"vertical", lineHeight:1.75, fontFamily:"inherit", transition:"border-color 0.2s", minHeight:200 }} />
            <div style={{ marginTop:5, fontSize:9, color:"#1a2820" }}>{desc.length} characters</div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.18em", color:"#2a3c30", marginBottom:7 }}>Analysis Depth</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {DEPTHS.map(d => (
                <button key={d.value} onClick={() => setDepth(d.value)}
                  style={{ background: depth===d.value ? "rgba(100,240,140,0.07)":"transparent", border:`1px solid ${depth===d.value ? "rgba(100,240,140,0.25)":"#131d18"}`, color: depth===d.value ? "#64f08c":"#2a3c30", fontSize:10, padding:"8px 16px", borderRadius:3, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", display:"flex", flexDirection:"column", gap:2 }}>
                  <span style={{ fontWeight:600 }}>{d.label}</span>
                  <span style={{ fontSize:8, opacity:0.6 }}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:26 }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.18em", color:"#2a3c30", marginBottom:7 }}>
              Directives <span style={{ color:"#64f08c" }}>({selected.length} selected)</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {LEGISLATION.map(l => {
                const on = selected.includes(l.id);
                return (
                  <button key={l.id} onClick={() => toggle(l.id)}
                    style={{ background: on ? `${l.color}09`:"transparent", border:`1px solid ${on ? l.color+"35":"#131d18"}`, borderRadius:3, padding:"10px 13px", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:12, transition:"all 0.15s", textAlign:"left" }}>
                    <div style={{ width:3, height:28, background: on ? l.color:"#1a2420", borderRadius:2, flexShrink:0, transition:"background 0.15s" }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:800, color: on ? l.color:"#2a3c30" }}>{l.label}</span>
                        <span style={{ fontSize:9, color:"#1e2e24" }}>{l.ref}</span>
                      </div>
                      <span style={{ fontSize:10, color: on ? "#4a6a54":"#1e2e24", lineHeight:1.4 }}>{l.description}</span>
                    </div>
                    <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${on ? l.color:"#1e2e24"}`, background: on ? l.color:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                      {on && <div style={{ width:6, height:6, borderRadius:"50%", background:"#080c0b" }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button className="btn-run" onClick={run} disabled={loading}
            style={{ background:"#64f08c", color:"#020804", border:"none", padding:"13px 28px", fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", cursor: loading ? "not-allowed":"pointer", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"inherit", transition:"all 0.2s", opacity: loading ? 0.5:1, width:"100%" }}>
            {loading
              ? <><div style={{ width:12, height:12, border:"2px solid rgba(0,0,0,0.2)", borderTopColor:"#020804", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />Analysing…</>
              : <>▶  Run Compliance Check — {selected.length} directive{selected.length!==1?"s":""}</>
            }
          </button>
        </div>
      )}

      {/* RESULTS */}
      {tab === "results" && (
        <div style={{ animation:"fadeUp 0.25s ease" }}>
          {!result && !error && !loading && (
            <div style={{ padding:60, textAlign:"center", color:"#1a2820" }}>
              <div style={{ fontSize:32, marginBottom:10 }}>◈</div>
              <p style={{ fontSize:11, lineHeight:1.8 }}>No analysis yet. Go to Input and run a check.</p>
            </div>
          )}
          {loading && <Skeleton />}
          {error && (
            <div style={{ padding:"24px 20px", color:"#f87171", fontSize:11, lineHeight:1.8 }}>
              <div style={{ marginBottom:8, fontWeight:600 }}>⚠ Could not reach backend</div>
              <div style={{ color:"#2a3c30", marginBottom:12 }}>{error}</div>
              <div style={{ background:"#0c1410", border:"1px solid #131d18", borderRadius:3, padding:"10px 13px", fontSize:10, color:"#3a5a42" }}>
                Make sure this is running:<br />
                <code style={{ color:"#64f08c" }}>uvicorn main:app --reload</code>
              </div>
            </div>
          )}
          {result && (
            <>
              <div style={{ padding:"16px 20px", background: RISK_BG[result.overall_risk], borderBottom:"1px solid #0f1712", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.16em", color:"#2a3c30", marginBottom:2 }}>Overall Risk</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color: RISK_COLOR[result.overall_risk], lineHeight:1 }}>{result.overall_risk}</div>
                </div>
                <div style={{ width:1, height:36, background:"#131d18", flexShrink:0 }} />
                <div style={{ fontSize:11, color:"#5a7a62", lineHeight:1.65, flex:1, minWidth:160 }}>{result.product_summary}</div>
                <div style={{ display:"flex", gap:16 }}>
                  {[["FAIL","#f87171"],["WARN","#facc15"],["PASS","#4ade80"],["INFO","#38bdf8"]].map(([s,c]) => (
                    <div key={s} style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:(counts[s]||0)>0 ? c:"#1e2e24", lineHeight:1 }}>{counts[s]||0}</div>
                      <div style={{ fontSize:8, color:"#1e2e24", letterSpacing:"0.1em", marginTop:2 }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedLeg.map(leg => {
                const legFindings = result.findings.filter(f =>
                  f.directive === leg.label || f.directive === leg.id ||
                  f.directive.toUpperCase().includes(leg.label.replace("_"," ").toUpperCase())
                );
                if (!legFindings.length) return null;
                const legFail = legFindings.filter(f=>f.status==="FAIL").length;
                const legWarn = legFindings.filter(f=>f.status==="WARN").length;
                const legStatus = legFail>0 ? "FAIL" : legWarn>0 ? "WARN" : "PASS";
                return (
                  <div key={leg.id} style={{ borderBottom:"1px solid #0f1712" }}>
                    <div style={{ padding:"10px 20px", background:`${leg.color}07`, borderBottom:"1px solid #0f1712", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                      <div style={{ width:3, height:14, background:leg.color, borderRadius:2, opacity:0.7 }} />
                      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:800, color:leg.color }}>{leg.label}</span>
                      <span style={{ fontSize:10, color:"#2a3c30", flex:1 }}>{leg.full}</span>
                      <StatusBadge status={legStatus} />
                      <span style={{ fontSize:9, color:"#1a2820" }}>{legFindings.length} finding{legFindings.length!==1?"s":""}</span>
                    </div>
                    {legFindings.map((f, i) => (
                      <div key={i} className="finding-row" style={{ padding:"13px 20px", borderBottom:"1px solid #0d1210", display:"flex", gap:12, alignItems:"flex-start", transition:"background 0.15s", animation:`fadeUp 0.22s ease ${i*0.04}s both` }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background: STATUS_COLOR[f.status], boxShadow:`0 0 5px ${STATUS_COLOR[f.status]}45`, marginTop:4, flexShrink:0 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:"#2a3c30", marginBottom:4 }}>{f.article}</div>
                          <div style={{ fontSize:11, lineHeight:1.7, color:"#b0ccb4" }}>{f.finding}</div>
                          {f.action && (
                            <div style={{ fontSize:10, color:"#3a5a42", lineHeight:1.6, paddingLeft:10, borderLeft:"2px solid #131d18", marginTop:5 }}>
                              → {f.action}
                            </div>
                          )}
                        </div>
                        <StatusBadge status={f.status} />
                      </div>
                    ))}
                  </div>
                );
              })}

              <div style={{ padding:"16px 20px", fontSize:11, lineHeight:1.8, color:"#3a5a42", fontStyle:"italic" }}>{result.summary}</div>
              <div style={{ padding:"12px 20px", borderTop:"1px solid #0f1712" }}>
                <button onClick={() => setTab("input")}
                  style={{ background:"transparent", border:"1px solid #131d18", color:"#2a3c30", fontSize:10, padding:"8px 16px", borderRadius:3, cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.08em" }}>
                  ← Modify and run again
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* REFERENCE */}
      {tab === "reference" && (
        <div style={{ animation:"fadeUp 0.25s ease" }}>
          <div style={{ padding:"10px 18px", borderBottom:"1px solid #0f1712", fontSize:9, color:"#1a2820", letterSpacing:"0.1em", textTransform:"uppercase" }}>
            Directives · Standards · Technical Documentation
          </div>
          <div style={{ overflowX:"auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${LEGISLATION.length},minmax(170px,1fr))`, minWidth:`${LEGISLATION.length*170}px` }}>
              {LEGISLATION.map((leg, ci) => {
                const on = selected.includes(leg.id);
                return (
                  <div key={leg.id} style={{ borderRight: ci<LEGISLATION.length-1 ? "1px solid #0f1712":"none", opacity: on ? 1:0.28, transition:"opacity 0.2s" }}>
                    <div style={{ padding:"14px 13px 11px", background:`${leg.color}08`, borderBottom:`2px solid ${leg.color}30`, position:"sticky", top:94, zIndex:10 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:leg.color, marginBottom:1 }}>{leg.label}</div>
                      <div style={{ fontSize:9, color:`${leg.color}55`, lineHeight:1.4, marginBottom:2 }}>{leg.full}</div>
                      <div style={{ fontSize:8, color:"#1a2820" }}>{leg.ref}</div>
                    </div>
                    <div style={{ padding:"11px 12px 6px" }}>
                      <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.18em", color:"#1a2820", marginBottom:7, paddingBottom:5, borderBottom:"1px solid #0f1712" }}>Standards</div>
                      {leg.standards.map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:6, marginBottom:7 }}>
                          <div style={{ width:4, height:4, borderRadius:"50%", background:leg.color, opacity:0.4, marginTop:4, flexShrink:0 }} />
                          <span style={{ fontSize:10, color:"#4a6a52", lineHeight:1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:"6px 12px 18px" }}>
                      <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.18em", color:"#1a2820", marginBottom:7, paddingBottom:5, borderBottom:"1px solid #0f1712" }}>Technical Docs</div>
                      {leg.docs.map((d,i) => (
                        <div key={i} style={{ display:"flex", gap:6, marginBottom:7 }}>
                          <div style={{ width:4, height:4, background:leg.color, opacity:0.3, marginTop:4, flexShrink:0, borderRadius:1, transform:"rotate(45deg)" }} />
                          <span style={{ fontSize:10, color:"#3a5242", lineHeight:1.5 }}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(8,12,11,0.97)", borderTop:"1px solid #131d18", display:"flex", zIndex:300, backdropFilter:"blur(14px)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, background:"transparent", border:"none", color: tab===t.id ? "#64f08c":"#2a3c30", padding:"11px 0 9px", cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:3, transition:"color 0.15s", position:"relative" }}>
            <span style={{ fontSize:14 }}>{t.icon}</span>
            <span style={{ fontSize:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>{t.label}</span>
            {t.badge > 0 && (
              <span style={{ position:"absolute", top:7, right:"calc(50% - 16px)", background:"#f87171", color:"#080c0b", fontSize:7, fontWeight:700, borderRadius:10, padding:"1px 4px" }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}