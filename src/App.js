import { useState } from "react";



// ── Legislation database ───────────────────────────────────────────────────
const LEGISLATION = [
  {
    id: "RED", label: "RED", full: "Radio Equipment Directive", ref: "2014/53/EU + Del.Reg.(EU)2022/30", color: "#60a5fa",
    description: "Cybersecurity for WiFi, BT, Zigbee, LoRa, NFC, LTE/5G and all radio products",
    applicableWhen: "Product intentionally emits or receives radio waves",
    standards: [
      { id: "ETSI EN 303 645", note: "IoT cybersecurity baseline — primary reference" },
      { id: "EN 18031-1", note: "Network harm prevention (Art.3(3)(d))" },
      { id: "EN 18031-2", note: "Privacy / user data protection (Art.3(3)(e))" },
      { id: "EN 18031-3", note: "Fraud prevention (Art.3(3)(f))" },
      { id: "ETSI EN 301 489-1", note: "Generic EMC for radio equipment" },
      { id: "ETSI EN 301 489-17", note: "WiFi (802.11) and Bluetooth" },
      { id: "ETSI EN 301 489-3", note: "Short range devices, Zigbee, LoRa" },
      { id: "ETSI EN 300 328", note: "2.4 GHz wideband — WiFi/BT RF performance" },
      { id: "ETSI EN 305 645", note: "Evaluation methodology for EN 303 645" },
    ],
    docs: ["Threat model & risk assessment", "Security architecture document", "Software Bill of Materials (SBOM)", "Vulnerability disclosure policy (VDP)", "Test reports (EN 303 645 / EN 18031)", "EU Declaration of Conformity (Del.Reg. ref.)"],
  },
  {
    id: "CRA", label: "CRA", full: "Cyber Resilience Act", ref: "Regulation (EU) 2024/2847", color: "#f472b6",
    description: "Mandatory cybersecurity for all products with digital elements — software, firmware, connectivity",
    applicableWhen: "Product contains software, firmware, or any network interface",
    standards: [
      { id: "ETSI EN 303 645", note: "Widely referenced for consumer IoT compliance" },
      { id: "IEC 62443-4-1", note: "Secure product development lifecycle" },
      { id: "IEC 62443-4-2", note: "Technical security requirements for components" },
      { id: "ISO/IEC 27001", note: "Information security management system" },
      { id: "NIST CSF 2.0", note: "Cybersecurity framework reference" },
      { id: "SPDX 3.0 / CycloneDX", note: "Machine-readable SBOM formats" },
      { id: "ISO/IEC 29147", note: "Vulnerability disclosure" },
      { id: "ISO/IEC 30111", note: "Vulnerability handling processes" },
    ],
    docs: ["SBOM (SPDX or CycloneDX format)", "Vulnerability handling policy", "CVD programme + security contact", "5-year security update commitment", "Technical file (CRA Annex VII)", "EU Declaration of Conformity"],
  },
  {
    id: "AI_Act", label: "AI Act", full: "Artificial Intelligence Act", ref: "Regulation (EU) 2024/1689", color: "#a78bfa",
    description: "Risk-based regulation for AI systems — prohibited practices to minimal risk, with conformity tiers",
    applicableWhen: "Product contains ML inference, recommendation engine, or automated decision-making",
    standards: [
      { id: "ISO/IEC 42001:2023", note: "AI management system — primary standard" },
      { id: "ISO/IEC 23894:2023", note: "AI risk management guidance" },
      { id: "ISO/IEC 25059:2023", note: "Quality model for AI systems" },
      { id: "NIST AI RMF 1.0", note: "AI risk management framework" },
      { id: "CEN/CENELEC JTC 21", note: "EU AI Act harmonised standards in development" },
      { id: "ISO/IEC TR 24027", note: "Bias in AI systems" },
      { id: "ISO/IEC 42005", note: "AI system impact assessment (in development)" },
    ],
    docs: ["AI system card (Annex IV)", "Risk management system documentation", "Training data governance records", "Performance & accuracy metrics", "Post-market monitoring plan", "EU AI database registration (high-risk)"],
  },
  {
    id: "GDPR", label: "GDPR", full: "General Data Protection Regulation", ref: "Regulation (EU) 2016/679", color: "#34d399",
    description: "Personal data protection for any product collecting, processing, or transmitting user data",
    applicableWhen: "Product processes any personal data of EU residents",
    standards: [
      { id: "ISO/IEC 27701:2019", note: "Privacy information management — primary" },
      { id: "ISO/IEC 29134:2017", note: "Privacy impact assessment (DPIA)" },
      { id: "ISO/IEC 27018:2019", note: "Cloud PII protection" },
      { id: "ENISA IoT Guidelines", note: "ENISA guidelines for IoT security/privacy" },
      { id: "EDPB Guidelines 2/2019", note: "Art.6(1)(b) — contract as lawful basis" },
      { id: "EDPB Guidelines 9/2022", note: "DPIA screening" },
      { id: "EDPB Rec. 01/2020", note: "International data transfers" },
    ],
    docs: ["Data Protection Impact Assessment (DPIA)", "Records of Processing Activities (RoPA)", "Data Processing Agreements (DPA)", "Privacy notice", "Consent mechanism documentation", "Data retention & deletion policy"],
  },
  {
    id: "EMC", label: "EMC", full: "Electromagnetic Compatibility Directive", ref: "Directive 2014/30/EU", color: "#fbbf24",
    description: "Emission limits and immunity requirements for all electrical and electronic equipment",
    applicableWhen: "Product is any electrical or electronic device",
    standards: [
      { id: "EN 55032:2015+A1", note: "Emissions — multimedia equipment (CISPR 32)" },
      { id: "EN 55035:2017+A11", note: "Immunity — multimedia equipment (CISPR 35)" },
      { id: "EN 61000-4-2", note: "ESD immunity" },
      { id: "EN 61000-4-3", note: "Radiated RF immunity" },
      { id: "EN 61000-4-4", note: "Electrical fast transient / burst (EFT)" },
      { id: "EN 61000-4-5", note: "Surge immunity" },
      { id: "EN 61000-4-6", note: "Conducted RF immunity" },
      { id: "ETSI EN 301 489-1/-17/-3", note: "EMC for radio equipment (if radio)" },
    ],
    docs: ["EMC test reports (ILAC/MRA accredited lab)", "Technical construction file", "List of harmonised standards (with dates)", "EU Declaration of Conformity"],
  },
  {
    id: "LVD", label: "LVD", full: "Low Voltage Directive", ref: "Directive 2014/35/EU", color: "#fb923c",
    description: "Electrical safety for mains-powered (50–1000V AC / 75–1500V DC) and battery products",
    applicableWhen: "Product operates on mains power or high-capacity battery systems",
    standards: [
      { id: "EN 60335-1:2012+A14", note: "Safety of household appliances — general" },
      { id: "EN 60335-2-x", note: "Product-specific part (numerous parts available)" },
      { id: "EN 62368-1:2020", note: "Audio/video and IT equipment (replaces EN 60950/60065)" },
      { id: "IEC 62133-2:2017", note: "Li-ion / LiPo battery safety" },
      { id: "EN 60664-1", note: "Insulation coordination — clearance & creepage" },
      { id: "EN 60529", note: "IP protection degrees (ingress protection)" },
      { id: "EN 60950-1", note: "IT equipment (legacy, use EN 62368-1 for new designs)" },
    ],
    docs: ["Electrical schematic & circuit diagrams", "Risk assessment (LVD Annex I)", "Insulation coordination analysis", "LVD safety test reports (accredited lab)", "Battery specification & BMS documentation", "EU Declaration of Conformity"],
  },
  {
    id: "ESPR", label: "ESPR", full: "Ecodesign for Sustainable Products Regulation", ref: "Regulation (EU) 2024/1781", color: "#86efac",
    description: "Sustainability, repairability, recyclability, and software longevity — Digital Product Passport incoming",
    applicableWhen: "Physical products placed on EU market (product-specific Delegated Acts define exact scope)",
    standards: [
      { id: "ISO 14040:2006 / 14044:2006", note: "Life Cycle Assessment (LCA)" },
      { id: "EN 45554:2020", note: "Repairability scoring methodology" },
      { id: "IEC 63074:2023", note: "Safety aspects of software updates" },
      { id: "ISO 14021", note: "Environmental self-declarations" },
      { id: "GS1 Digital Link", note: "DPP data carrier standard" },
      { id: "CIRPASS DPP", note: "EU Digital Product Passport data model" },
      { id: "IEC 62474", note: "Material declaration for EEE" },
    ],
    docs: ["Repairability index (EN 45554)", "Spare parts availability commitment", "Software support period declaration", "Digital Product Passport (DPP) — from 2026", "Product information sheet (Art.7)", "Material declaration (IEC 62474)"],
  },
];

const DEPTHS = [
  { value: "quick",    label: "Quick",    desc: "3–5 key gaps" },
  { value: "standard", label: "Standard", desc: "Article-by-article" },
  { value: "deep",     label: "Deep",     desc: "Full doc checklist" },
];

const SC = { PASS: "#4ade80", WARN: "#facc15", FAIL: "#f87171", INFO: "#38bdf8" };
const SB = { PASS: "rgba(74,222,128,0.07)", WARN: "rgba(250,204,21,0.07)", FAIL: "rgba(248,113,113,0.07)", INFO: "rgba(56,189,248,0.07)" };
const RC = { LOW: "#4ade80", MEDIUM: "#facc15", HIGH: "#f87171", CRITICAL: "#f87171" };
const RB = { LOW: "rgba(74,222,128,0.05)", MEDIUM: "rgba(250,204,21,0.05)", HIGH: "rgba(248,113,113,0.06)", CRITICAL: "rgba(248,113,113,0.1)" };

function Badge({ s }) {
  return <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 2, background: SB[s], color: SC[s], border: `1px solid ${SC[s]}28`, letterSpacing: "0.1em", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{s}</span>;
}

function Skeleton() {
  return (
    <div style={{ padding: "28px 20px" }}>
      <style>{`@keyframes sk{0%{background-position:-600px 0}100%{background-position:600px 0}}`}</style>
      {[72, 55, 88, 44, 66, 78, 50, 60].map((w, i) => (
        <div key={i} style={{ height: i % 4 === 0 ? 11 : 7, borderRadius: 3, marginBottom: i % 4 === 0 ? 20 : 9, width: `${w}%`, background: "linear-gradient(90deg,#141c18 25%,#1d2c22 50%,#141c18 75%)", backgroundSize: "1200px 100%", animation: `sk 1.6s infinite linear`, animationDelay: `${i*0.08}s` }} />
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
    if (!desc.trim()) { alert("Please describe your product."); return; }
    if (!selected.length) { alert("Select at least one directive."); return; }
    setLoading(true); setResult(null); setError(null); setTab("results");
    try {
      const r = await fetch("https://regcheck-api.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: selected, depth }),
      });
      if (!r.ok) throw new Error("Server error " + r.status);
      setResult(await r.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const counts = result ? result.findings.reduce((a, f) => { a[f.status] = (a[f.status]||0)+1; return a; }, {}) : {};
  const selLeg = LEGISLATION.filter(l => selected.includes(l.id));

  const tabs = [
    { id: "input",     icon: "⌨",  label: "Input" },
    { id: "results",   icon: "◈",  label: "Results", badge: result ? (counts.FAIL||0)+(counts.WARN||0) : null },
    { id: "reference", icon: "⊞",  label: "Reference" },
  ];

  return (
    <div style={{ background: "#070b09", minHeight: "100vh", color: "#d4e8d8", fontFamily: "'IBM Plex Mono','Courier New',monospace", paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#1c2c20;border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        textarea:focus{border-color:rgba(100,240,140,0.35)!important;outline:none}
        .run-btn:hover:not(:disabled){background:#7df5a0!important;box-shadow:0 4px 20px rgba(80,220,110,0.2)}
        .dir-row:hover{background:rgba(255,255,255,0.018)!important}
        .finding-row:hover{background:rgba(255,255,255,0.013)}
        .tab-b:hover{color:#8fba98!important}
        .strip-b:hover{opacity:1!important}
        .ref-card:hover .ref-toggle{opacity:1!important}
      `}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom:"1px solid #111a14", padding:"12px 20px", display:"flex", alignItems:"center", gap:12, background:"rgba(7,11,9,0.97)", position:"sticky", top:0, zIndex:300, backdropFilter:"blur(16px)" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#5de87a", letterSpacing:"-0.02em" }}>RegCheck</span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:"#1c2e20" }}>EU</span>
          <span style={{ fontSize:8, background:"rgba(93,232,122,0.1)", color:"#5de87a", border:"1px solid rgba(93,232,122,0.2)", padding:"1px 6px", borderRadius:2, letterSpacing:"0.1em", marginLeft:4 }}>v2</span>
        </div>
        <div style={{ width:1, height:13, background:"#1a2820" }} />
        <span style={{ fontSize:9, color:"#1c3022", letterSpacing:"0.16em", textTransform:"uppercase" }}>EU Compliance Intelligence</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:1, background:"#0b130e", border:"1px solid #111a14", borderRadius:3, padding:2 }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-b" onClick={() => setTab(t.id)}
              style={{ background: tab===t.id?"#172218":"transparent", border:"none", color: tab===t.id?"#5de87a":"#2a3c2e", fontSize:10, padding:"5px 11px", borderRadius:2, cursor:"pointer", fontFamily:"inherit", transition:"color 0.15s", display:"flex", alignItems:"center", gap:5 }}>
              <span>{t.icon}</span><span>{t.label}</span>
              {t.badge > 0 && <span style={{ background:"#f87171", color:"#070b09", fontSize:7, fontWeight:800, borderRadius:10, padding:"1px 5px", lineHeight:1.6 }}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Directive strip ── */}
      <div style={{ borderBottom:"1px solid #0e1611", background:"#080d0a", overflowX:"auto" }}>
        <div style={{ display:"flex", minWidth:"fit-content" }}>
          {LEGISLATION.map((leg, i) => {
            const on = selected.includes(leg.id);
            return (
              <button key={leg.id} className="strip-b" onClick={() => toggle(leg.id)}
                style={{ background: on?`${leg.color}0b`:"transparent", border:"none", borderRight:i<LEGISLATION.length-1?"1px solid #0e1611":"none", borderBottom:`2px solid ${on?leg.color:"transparent"}`, padding:"8px 15px 7px", cursor:"pointer", display:"flex", flexDirection:"column", gap:1, transition:"all 0.15s", opacity:on?1:0.32, minWidth:90 }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:800, color:on?leg.color:"#3a5040", whiteSpace:"nowrap" }}>{leg.label}</span>
                <span style={{ fontSize:8, color:on?`${leg.color}50`:"#182018", whiteSpace:"nowrap", letterSpacing:"0.03em" }}>{leg.ref.split("+")[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════ INPUT ════════════ */}
      {tab === "input" && (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"26px 18px 32px", animation:"fadeUp 0.25s ease" }}>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.18em", color:"#2a3c2e", marginBottom:7 }}>Product Description</div>
            <textarea rows={9} value={desc} onChange={e => setDesc(e.target.value)}
              placeholder={"Be specific — the more detail, the more accurate the analysis:\n\n• Connectivity: WiFi 802.11ac, BT 5.0, Zigbee 3.0, LoRaWAN, NFC, LTE Cat-M…\n• Market: EU residential / industrial / medical / retail\n• Data: cloud storage (which cloud/region), local only, usage analytics…\n• Power: 230V mains, Li-ion 3.7V, USB-C 5V, PoE…\n• Features: AI/ML model, camera, voice, OTA updates, mobile app…\n• Auth: password login, default credentials, MFA, OAuth, BLE pairing…\n• Target user: consumers, children, professionals, patients…"}
              style={{ width:"100%", background:"#0b1210", border:"1px solid #111a14", color:"#c0d8c4", fontSize:12, padding:"13px 15px", borderRadius:4, resize:"vertical", lineHeight:1.8, fontFamily:"inherit", transition:"border-color 0.2s", minHeight:210 }} />
            <div style={{ marginTop:5, fontSize:9, color:"#182018" }}>{desc.length} characters — aim for 100+ for best results</div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.18em", color:"#2a3c2e", marginBottom:7 }}>Analysis Depth</div>
            <div style={{ display:"flex", gap:6 }}>
              {DEPTHS.map(d => (
                <button key={d.value} onClick={() => setDepth(d.value)}
                  style={{ flex:1, background: depth===d.value?"rgba(93,232,122,0.06)":"transparent", border:`1px solid ${depth===d.value?"rgba(93,232,122,0.28)":"#111a14"}`, color: depth===d.value?"#5de87a":"#2a3c2e", fontSize:10, padding:"9px 12px", borderRadius:3, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", display:"flex", flexDirection:"column", gap:2, alignItems:"center" }}>
                  <span style={{ fontWeight:600 }}>{d.label}</span>
                  <span style={{ fontSize:8, opacity:0.6 }}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:26 }}>
            <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.18em", color:"#2a3c2e", marginBottom:7 }}>
              Directives <span style={{ color:"#5de87a" }}>({selected.length} selected)</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {LEGISLATION.map(l => {
                const on = selected.includes(l.id);
                return (
                  <button key={l.id} className="dir-row" onClick={() => toggle(l.id)}
                    style={{ background: on?`${l.color}08`:"transparent", border:`1px solid ${on?l.color+"30":"#111a14"}`, borderRadius:3, padding:"10px 13px", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:11, transition:"all 0.15s", textAlign:"left" }}>
                    <div style={{ width:3, height:30, background:on?l.color:"#1a2820", borderRadius:2, flexShrink:0, transition:"background 0.15s" }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:2 }}>
                        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:800, color:on?l.color:"#2a3c2e" }}>{l.label}</span>
                        <span style={{ fontSize:9, color:"#1c2820", letterSpacing:"0.04em" }}>{l.ref.split("+")[0].trim()}</span>
                      </div>
                      <div style={{ fontSize:10, color:on?"#4a6a54":"#1c2820", lineHeight:1.4 }}>{l.description}</div>
                    </div>
                    <div style={{ width:15, height:15, borderRadius:"50%", border:`2px solid ${on?l.color:"#1c2820"}`, background:on?l.color:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                      {on && <div style={{ width:5, height:5, borderRadius:"50%", background:"#070b09" }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button className="run-btn" onClick={run} disabled={loading}
            style={{ width:"100%", background:"#5de87a", color:"#020804", border:"none", padding:"13px 24px", fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", cursor:loading?"not-allowed":"pointer", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"inherit", transition:"all 0.2s", opacity:loading?0.5:1 }}>
            {loading
              ? <><div style={{ width:12, height:12, border:"2px solid rgba(0,0,0,0.2)", borderTopColor:"#020804", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />Analysing…</>
              : `▶  Run Compliance Check — ${selected.length} directive${selected.length!==1?"s":""}`
            }
          </button>
        </div>
      )}

      {/* ════════════ RESULTS ════════════ */}
      {tab === "results" && (
        <div style={{ animation:"fadeUp 0.25s ease" }}>
          {!result && !error && !loading && (
            <div style={{ padding:70, textAlign:"center", color:"#182018" }}>
              <div style={{ fontSize:28, marginBottom:10 }}>◈</div>
              <p style={{ fontSize:11, lineHeight:1.9 }}>No analysis yet.<br />Go to Input tab and run a check.</p>
            </div>
          )}
          {loading && <Skeleton />}
          {error && (
            <div style={{ padding:"24px 20px" }}>
              <div style={{ color:"#f87171", fontSize:11, fontWeight:600, marginBottom:8 }}>⚠ Backend unreachable</div>
              <div style={{ color:"#2a3c2e", fontSize:11, marginBottom:12, lineHeight:1.7 }}>{error}</div>
              <div style={{ background:"#0b1210", border:"1px solid #111a14", borderRadius:3, padding:"11px 14px", fontSize:10, color:"#3a5a42", lineHeight:1.8 }}>
                Make sure this is running in your other terminal:<br />
                <code style={{ color:"#5de87a" }}>uvicorn main:app --reload</code>
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Risk banner */}
              <div style={{ padding:"16px 20px", background:RB[result.overall_risk], borderBottom:"1px solid #0e1611", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <div style={{ minWidth:90 }}>
                  <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.16em", color:"#2a3c2e", marginBottom:2 }}>Risk Level</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:RC[result.overall_risk], lineHeight:1 }}>{result.overall_risk}</div>
                </div>
                <div style={{ width:1, height:34, background:"#111a14", flexShrink:0 }} />
                <div style={{ fontSize:11, color:"#4a6a54", lineHeight:1.65, flex:1, minWidth:140 }}>{result.product_summary}</div>
                <div style={{ display:"flex", gap:14 }}>
                  {[["FAIL","#f87171"],["WARN","#facc15"],["PASS","#4ade80"],["INFO","#38bdf8"]].map(([s,c]) => (
                    <div key={s} style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:19, fontWeight:800, color:(counts[s]||0)>0?c:"#1c2820", lineHeight:1 }}>{counts[s]||0}</div>
                      <div style={{ fontSize:8, color:"#1c2820", letterSpacing:"0.1em", marginTop:2 }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-directive sections */}
              {selLeg.map(leg => {
                const legF = result.findings.filter(f =>
                  f.directive === leg.label || f.directive === leg.id ||
                  f.directive.toUpperCase().replace("_"," ").includes(leg.label.toUpperCase().replace("_"," "))
                );
                if (!legF.length) return null;
                const fail = legF.filter(f=>f.status==="FAIL").length;
                const warn = legF.filter(f=>f.status==="WARN").length;
                const legSt = fail>0?"FAIL":warn>0?"WARN":"PASS";

                return (
                  <div key={leg.id} style={{ borderBottom:"1px solid #0e1611" }}>

                    {/* Directive header WITH standards */}
                    <div style={{ background:`${leg.color}06`, borderBottom:"1px solid #0e1611" }}>
                      {/* Title row */}
                      <div style={{ padding:"11px 20px 0", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                        <div style={{ width:3, height:14, background:leg.color, borderRadius:2, opacity:0.75, flexShrink:0 }} />
                        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:800, color:leg.color }}>{leg.label}</span>
                        <span style={{ fontSize:10, color:"#2a3c2e", flex:1 }}>{leg.full}</span>
                        <Badge s={legSt} />
                        <span style={{ fontSize:9, color:"#182018" }}>{legF.length} finding{legF.length!==1?"s":""}</span>
                      </div>

                      {/* Standards row — always visible */}
                      <div style={{ padding:"8px 20px 11px", paddingLeft:33, display:"flex", flexWrap:"wrap", gap:"4px 10px", alignItems:"center" }}>
                        <span style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.14em", color:"#1c2820", marginRight:4, whiteSpace:"nowrap" }}>Standards:</span>
                        {leg.standards.map((s, i) => (
                          <span key={i} title={s.note}
                            style={{ fontSize:9, color:`${leg.color}90`, background:`${leg.color}0d`, border:`1px solid ${leg.color}20`, borderRadius:2, padding:"1px 7px", whiteSpace:"nowrap", cursor:"help", letterSpacing:"0.03em" }}>
                            {s.id}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Findings */}
                    {legF.map((f, i) => (
                      <div key={i} className="finding-row" style={{ padding:"13px 20px", borderBottom:"1px solid #0b0f0d", display:"flex", gap:12, alignItems:"flex-start", transition:"background 0.12s", animation:`fadeUp 0.2s ease ${i*0.04}s both` }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background:SC[f.status], boxShadow:`0 0 6px ${SC[f.status]}40`, marginTop:4, flexShrink:0 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.11em", color:"#2a3c2e", marginBottom:4, lineHeight:1.4 }}>{f.article}</div>
                          <div style={{ fontSize:11, lineHeight:1.72, color:"#a8c8ac" }}>{f.finding}</div>
                          {f.action && (
                            <div style={{ fontSize:10, color:"#3a5a42", lineHeight:1.65, paddingLeft:10, borderLeft:"2px solid #111a14", marginTop:6 }}>
                              → {f.action}
                            </div>
                          )}
                        </div>
                        <Badge s={f.status} />
                      </div>
                    ))}
                  </div>
                );
              })}

              <div style={{ padding:"16px 20px", fontSize:11, lineHeight:1.8, color:"#3a5a42", fontStyle:"italic", borderTop:"1px solid #0e1611" }}>{result.summary}</div>
              <div style={{ padding:"10px 20px", borderTop:"1px solid #0e1611" }}>
                <button onClick={() => setTab("input")}
                  style={{ background:"transparent", border:"1px solid #111a14", color:"#2a3c2e", fontSize:10, padding:"7px 15px", borderRadius:3, cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.08em", transition:"border-color 0.15s" }}>
                  ← Modify and run again
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════ REFERENCE ════════════ */}
      {tab === "reference" && (
        <div style={{ animation:"fadeUp 0.25s ease" }}>
          <div style={{ padding:"9px 18px", borderBottom:"1px solid #0e1611", fontSize:9, color:"#182018", letterSpacing:"0.12em", textTransform:"uppercase" }}>
            All directives · Standards · Technical documentation required
          </div>

          {/* Desktop: horizontal columns */}
          <div style={{ overflowX:"auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${LEGISLATION.length},minmax(185px,1fr))`, minWidth:`${LEGISLATION.length*185}px` }}>
              {LEGISLATION.map((leg, ci) => {
                const on = selected.includes(leg.id);
                return (
                  <div key={leg.id} style={{ borderRight:ci<LEGISLATION.length-1?"1px solid #0e1611":"none", opacity:on?1:0.25, transition:"opacity 0.2s" }}>
                    {/* Column header */}
                    <div style={{ padding:"13px 13px 10px", background:`${leg.color}08`, borderBottom:`2px solid ${leg.color}28`, position:"sticky", top:88, zIndex:10 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:leg.color, marginBottom:1 }}>{leg.label}</div>
                      <div style={{ fontSize:9, color:`${leg.color}60`, lineHeight:1.4, marginBottom:2 }}>{leg.full}</div>
                      <div style={{ fontSize:8, color:"#182018" }}>{leg.ref}</div>
                    </div>

                    {/* Standards — with notes on hover */}
                    <div style={{ padding:"10px 12px 6px" }}>
                      <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.18em", color:"#182018", marginBottom:7, paddingBottom:5, borderBottom:"1px solid #0e1611" }}>
                        Required Standards
                      </div>
                      {leg.standards.map((s, i) => (
                        <div key={i} title={s.note} style={{ marginBottom:8, cursor:"help" }}>
                          <div style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
                            <div style={{ width:4, height:4, borderRadius:"50%", background:leg.color, opacity:0.45, marginTop:4, flexShrink:0 }} />
                            <div>
                              <div style={{ fontSize:10, color:"#4a6a50", lineHeight:1.4, fontWeight:500 }}>{s.id}</div>
                              <div style={{ fontSize:9, color:"#283828", lineHeight:1.3, marginTop:1 }}>{s.note}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Docs */}
                    <div style={{ padding:"5px 12px 18px" }}>
                      <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.18em", color:"#182018", marginBottom:7, paddingBottom:5, borderBottom:"1px solid #0e1611" }}>
                        Technical File Documents
                      </div>
                      {leg.docs.map((d, i) => (
                        <div key={i} style={{ display:"flex", gap:6, marginBottom:7 }}>
                          <div style={{ width:4, height:4, background:leg.color, opacity:0.28, marginTop:4, flexShrink:0, borderRadius:1, transform:"rotate(45deg)" }} />
                          <span style={{ fontSize:10, color:"#344834", lineHeight:1.5 }}>{d}</span>
                        </div>
                      ))}
                    </div>

                    {/* Applies when */}
                    <div style={{ padding:"0 12px 14px" }}>
                      <div style={{ fontSize:8, textTransform:"uppercase", letterSpacing:"0.18em", color:"#182018", marginBottom:5, paddingBottom:4, borderBottom:"1px solid #0e1611" }}>Applies when</div>
                      <div style={{ fontSize:9, color:"#283828", lineHeight:1.55 }}>{leg.applicableWhen}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding:"10px 18px", borderTop:"1px solid #0e1611", fontSize:9, color:"#182018" }}>
            Dimmed columns = directive not selected for current analysis · Hover standards for notes
          </div>
        </div>
      )}

      {/* ── Bottom nav ── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(7,11,9,0.97)", borderTop:"1px solid #111a14", display:"flex", zIndex:400, backdropFilter:"blur(16px)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, background:"transparent", border:"none", color:tab===t.id?"#5de87a":"#1c2c20", padding:"10px 0 8px", cursor:"pointer", fontFamily:"inherit", display:"flex", flexDirection:"column", alignItems:"center", gap:3, transition:"color 0.15s", position:"relative" }}>
            <span style={{ fontSize:13 }}>{t.icon}</span>
            <span style={{ fontSize:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>{t.label}</span>
            {t.badge > 0 && <span style={{ position:"absolute", top:6, right:"calc(50% - 18px)", background:"#f87171", color:"#070b09", fontSize:7, fontWeight:800, borderRadius:10, padding:"1px 4px", lineHeight:1.5 }}>{t.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}