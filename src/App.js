import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// KEYWORD DETECTION — comprehensive, multi-signal
// ═══════════════════════════════════════════════════════════════════════════
function detectDirectives(text) {
  const t = text.toLowerCase();
  const has  = (kws) => kws.some(k => t.includes(k));
  const hasW = (kws) => kws.some(k => new RegExp(`\\b${k}\\b`,'i').test(t));
  const r = [];

  // RED — Radio Equipment Directive
  // Triggers: any intentional radio transmitter/receiver
  if (has(["wifi","wi-fi","wlan","802.11","2.4ghz","5ghz","6ghz",
           "bluetooth","ble"," bt5"," bt4","bt 5","bt 4",
           "zigbee","z-wave","thread","matter","ieee 802.15",
           "lora","lorawan","868mhz","915mhz","lpwan",
           "nfc","near field","rfid",
           "lte","4g ","5g ","nb-iot","cat-m","cat-nb","cellular","gsm","3gpp","lte-m",
           "radio","rf module","rf transmit","wireless transmit","sub-ghz",
           "868 mhz","915 mhz","2.4 ghz","5 ghz"])) r.push("RED");

  // CRA — Cyber Resilience Act
  // Triggers: any product with digital elements (software, firmware, connectivity)
  if (has(["software","firmware","embedded","microcontroller","microprocessor",
           "raspberry","arduino","esp32","stm32","nrf52",
           "app ","mobile app","web app","companion app","dashboard",
           "cloud","server","api","backend","internet","online","iot","connected",
           "ota","over-the-air","remote update","firmware update","software update",
           "digital","processor","mcu","soc","rtos","linux","operating system",
           "network","ethernet","tcp","mqtt","http","coap","modbus",
           "usb","uart","i2c","spi"])) r.push("CRA");

  // GDPR — General Data Protection Regulation
  // Triggers: any personal data processing
  if (has(["personal data","user data","usage data","usage pattern","user profile",
           "account","login","password","credentials","sign in","sign up",
           "email","name ","address","phone","location","gps","coordinates","geolocation",
           "health","heart rate","blood","spo2","sleep","medical","ecg","stress",
           "biometric","fingerprint","face id","facial","voice recognition",
           "tracking","behaviour","behavioral","analytics","telemetry",
           "cloud","store data","stores data","data retention","log ","logging",
           "third party","share data","gdpr","privacy","consent","dpia",
           "user account","camera","microphone","photo","image capture"])) r.push("GDPR");

  // AI Act — Artificial Intelligence Act
  // Triggers: any ML/AI inference or automated decision-making
  if (has(["artificial intelligence","machine learning","deep learning",
           " ai ","ai-powered","ai based","ai model",
           " ml ","ml model","neural network","neural net",
           "llm","large language model","gpt","transformer",
           "computer vision","image recognition","object detection",
           "voice assistant","wake word","speech recognition","nlp","natural language",
           "recommendation","recommender","personalisation","personalization",
           "automated decision","autonomous","predictive","inference","model inference",
           "classifier","regression model","anomaly detection","clustering",
           "emotion detection","facial recognition","gait analysis",
           "generative ai","stable diffusion","chatbot"])) r.push("AI_Act");

  // LVD — Low Voltage Directive
  // Triggers: mains power or significant battery systems
  if (has(["230v","220v","110v","120v","240v","mains","ac power","wall plug",
           "hardwired","power supply","mains-powered","grid-powered","plug-in",
           "li-ion","lithium ion","lipo","li-po","lithium polymer",
           "high capacity battery","18650","21700","battery pack","battery management",
           "bms","high voltage","motor drive","inverter","power electronics",
           "poe","power over ethernet","48v","24v dc","industrial power",
           "rechargeable battery","battery powered device"])) r.push("LVD");

  // EMC — Electromagnetic Compatibility
  // Triggers: virtually any electronic device
  if (has(["electronic","electrical","pcb","circuit board","circuit",
           "sensor","actuator","motor","relay","switch mode",
           "microcontroller","microprocessor","processor","mcu","soc",
           "power supply","battery","usb","230v","mains",
           "wifi","bluetooth","radio","wireless","rf",
           "display","lcd","oled","led driver","pwm",
           "clock signal","oscillator","crystal"])) r.push("EMC");

  // ESPR — Ecodesign for Sustainable Products
  // Triggers: sustainability claims, repairability, or energy consumption mentions
  if (has(["repair","repairable","replaceable part","spare part","ifixit","right to repair",
           "recycled","recyclable","recycling","circular","end of life","eol","take-back",
           "sustainability","sustainable","carbon footprint","carbon neutral","lifecycle",
           "energy label","energy class","energy rating","erp","ecodesign",
           "dpp","digital product passport","durability","longevity",
           "biodegradable","bio-based","refurbished","remanufactured",
           "standby power","networked standby","energy consumption"])) r.push("ESPR");

  if (r.length === 0 && text.trim().length > 30) { r.push("CRA"); r.push("EMC"); }
  return r;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKLIST — smart detection per item
// ═══════════════════════════════════════════════════════════════════════════
const CHECKLIST = [
  {
    id: "purpose",
    label: "What does the product do?",
    hint: "e.g. smart thermostat, industrial sensor, fitness tracker…",
    detect: t => t.length > 60 && /\b(device|product|system|sensor|monitor|tracker|controller|hub|gateway|camera|speaker|display|wearable|appliance|charger|meter|lock|alarm)\b/i.test(t),
  },
  {
    id: "user",
    label: "Who uses it & where?",
    hint: "e.g. consumers at home, medical professionals, industrial B2B…",
    detect: t => /\b(consumer|residential|household|home|personal|retail|industrial|b2b|factory|medical|clinical|hospital|professional|children|kids|patient|office|commercial)\b/i.test(t),
  },
  {
    id: "radio",
    label: "Wireless connectivity?",
    hint: "e.g. WiFi 802.11ac, BT 5.0, Zigbee 3.0, LTE Cat-M, NFC…",
    detect: t => /wifi|wi-fi|bluetooth|ble|\blte\b|4g |5g |zigbee|nfc|lora|cellular|gsm|nb-iot|wireless|radio|rf /i.test(t),
  },
  {
    id: "power",
    label: "How is it powered?",
    hint: "e.g. 230V mains, Li-ion 3.7V, USB-C 5V, PoE 48V, AA batteries…",
    detect: t => /230v|220v|110v|mains|li-ion|lithium|battery|usb.c|usb power|poe|rechargeable|hardwired|power supply|alkaline/i.test(t),
  },
  {
    id: "data",
    label: "Personal or sensitive data?",
    hint: "e.g. stores email, collects location GPS, health metrics, user accounts…",
    detect: t => /personal data|user data|email|location|gps|health|biometric|account|profile|login|password|tracking|camera|microphone|face|voice/i.test(t),
  },
  {
    id: "cloud",
    label: "Cloud backend or internet?",
    hint: "e.g. AWS cloud, own server in EU, local only (no internet)…",
    detect: t => /cloud|server|aws|azure|google cloud|backend|api |internet|online|local only|no cloud|offline|standalone/i.test(t),
  },
  {
    id: "software",
    label: "Software, firmware & updates?",
    hint: "e.g. OTA firmware updates, embedded Linux, companion mobile app…",
    detect: t => /firmware|software|ota|over-the-air|embedded|mobile app|companion app|rtos|linux|update|microcontroller/i.test(t),
  },
  {
    id: "auth",
    label: "Authentication & access?",
    hint: "e.g. password login, unique per-device credentials, MFA, BLE pairing…",
    detect: t => /password|login|credential|authentication|mfa|2fa|oauth|pairing|pin code|default password|unique password|passphrase/i.test(t),
  },
  {
    id: "ai",
    label: "AI or ML features?",
    hint: "e.g. on-device inference, cloud ML model, voice assistant, anomaly detection…",
    detect: t => /\bai\b|machine learning|\bml\b|neural|inference|model|llm|computer vision|voice assistant|recommendation|automated decision/i.test(t),
  },
  {
    id: "physical",
    label: "Physical & safety aspects?",
    hint: "e.g. mains voltage inside, Li-ion battery, motor, heating element, IP67…",
    detect: t => /high voltage|mains|li-ion|lithium|motor|heating|thermal|ip[0-9][0-9]|waterproof|fire|smoke|alarm|safety function|fail.safe/i.test(t),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// DIRECTIVE METADATA
// ═══════════════════════════════════════════════════════════════════════════
const DIR_META = {
  RED:    { label:"RED",    full:"Radio Equipment Directive",            color:"#60a5fa", ref:"2014/53/EU",      standards:["ETSI EN 303 645","EN 18031-1",  "EN 18031-2","EN 18031-3","ETSI EN 301 489-1","ETSI EN 300 328","ETSI EN 305 645"] },
  CRA:    { label:"CRA",    full:"Cyber Resilience Act",                 color:"#f472b6", ref:"(EU) 2024/2847",  standards:["ETSI EN 303 645","IEC 62443-4-1","IEC 62443-4-2","ISO/IEC 27001","ISO/IEC 29147","ISO/IEC 30111","SPDX 3.0 / CycloneDX"] },
  GDPR:   { label:"GDPR",   full:"General Data Protection Regulation",   color:"#34d399", ref:"(EU) 2016/679",   standards:["ISO/IEC 27701:2019","ISO/IEC 29134","ISO/IEC 27018","EDPB Guidelines 2/2019","EDPB Guidelines 9/2022","EDPB Rec. 01/2020"] },
  AI_Act: { label:"AI Act", full:"Artificial Intelligence Act",          color:"#a78bfa", ref:"(EU) 2024/1689",  standards:["ISO/IEC 42001:2023","ISO/IEC 23894","ISO/IEC 25059","NIST AI RMF 1.0","CEN/CENELEC JTC 21","ISO/IEC TR 24027"] },
  LVD:    { label:"LVD",    full:"Low Voltage Directive",                color:"#fb923c", ref:"2014/35/EU",      standards:["EN 62368-1:2020","EN 60335-1+A14","IEC 62133-2:2017","EN 60664-1","EN 60529","EN 60950-1 (legacy)"] },
  EMC:    { label:"EMC",    full:"Electromagnetic Compatibility",        color:"#fbbf24", ref:"2014/30/EU",      standards:["EN 55032:2015+A1","EN 55035:2017+A11","EN 61000-4-2","EN 61000-4-3","EN 61000-4-5","ETSI EN 301 489-1"] },
  ESPR:   { label:"ESPR",   full:"Ecodesign for Sustainable Products",   color:"#86efac", ref:"(EU) 2024/1781",  standards:["ISO 14040 / 14044","EN 45554:2020","IEC 63074:2023","ISO 14021","GS1 Digital Link","CIRPASS DPP"] },
};

const STATUS_CFG = {
  FAIL: { icon:"✕", color:"#ef4444", bg:"rgba(239,68,68,0.10)", border:"rgba(239,68,68,0.28)" },
  WARN: { icon:"!",  color:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.28)" },
  PASS: { icon:"✓", color:"#10b981", bg:"rgba(16,185,129,0.08)", border:"rgba(16,185,129,0.28)" },
  INFO: { icon:"i",  color:"#60a5fa", bg:"rgba(96,165,250,0.07)", border:"rgba(96,165,250,0.22)" },
};

const RISK_CFG = {
  CRITICAL: { color:"#ef4444", glow:"rgba(239,68,68,0.15)"  },
  HIGH:     { color:"#f97316", glow:"rgba(249,115,22,0.15)" },
  MEDIUM:   { color:"#f59e0b", glow:"rgba(245,158,11,0.12)" },
  LOW:      { color:"#10b981", glow:"rgba(16,185,129,0.12)" },
};

// Colour palette
const C = {
  bg:      "#080d1a",
  surface: "#0c1222",
  card:    "#101828",
  card2:   "#0e1520",
  border:  "#1a2540",
  border2: "#1e2e50",
  text:    "#e2e8f0",
  sub:     "#94a3b8",
  dim:     "#334155",
  accent:  "#3b82f6",
  accentL: "#60a5fa",
};

export default function App() {
  const [desc,      setDesc]      = useState("");
  const [depth,     setDepth]     = useState("standard");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  const detected  = detectDirectives(desc);
  const checklist = CHECKLIST.map(c => ({ ...c, done: c.detect(desc) }));
  const doneCount = checklist.filter(c => c.done).length;
  const quality   = Math.round((doneCount / CHECKLIST.length) * 100);

  const run = async () => {
    if (desc.trim().length < 20) return;
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
      const g = groupFindings(data.findings);
      setActiveTab(Object.keys(g)[0] || null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const groupFindings = (findings) =>
    findings.reduce((acc, f, i) => {
      if (!acc[f.directive]) acc[f.directive] = [];
      acc[f.directive].push({ ...f, _i: i });
      return acc;
    }, {});

  const grouped      = result ? groupFindings(result.findings) : {};
  const dirTabs      = Object.keys(grouped);
  const counts       = result ? result.findings.reduce((a, f) => { a[f.status] = (a[f.status]||0)+1; return a; }, {}) : {};
  const tabFindings  = (activeTab && grouped[activeTab]) ? grouped[activeTab] : [];
  const activeDir    = activeTab ? DIR_META[activeTab] : null;
  const riskCfg      = result ? (RISK_CFG[result.overall_risk] || RISK_CFG.LOW) : null;

  // Quality colour
  const qColor = quality >= 80 ? "#10b981" : quality >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Inter',-apple-system,sans-serif", fontSize:14 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:${C.bg}; }
        textarea,button { font-family:inherit; }
        textarea { outline:none; resize:none; }
        button { cursor:pointer; border:none; outline:none; }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:.35} 50%{opacity:.7} }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:2px; }
        .tab-btn:hover:not(.active) { background:${C.card} !important; color:${C.sub} !important; }
        .run-btn:hover:not(:disabled) { filter:brightness(1.12); transform:translateY(-1px); }
        .finding-row:hover { background:rgba(255,255,255,0.02) !important; }
        textarea:focus { border-color:${C.accent} !important; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
        .checklist-row { transition: background 0.15s; border-radius:6px; }
        .checklist-row:hover { background:rgba(255,255,255,0.03); }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"0 24px", position:"sticky", top:0, zIndex:200 }}>
        <div style={{ maxWidth:1140, margin:"0 auto", height:52, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#3b82f6,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:"#fff" }}>R</div>
            <span style={{ fontWeight:800, fontSize:16, letterSpacing:"-0.03em", color:"#f1f5f9" }}>
              RuleGrid<span style={{ color:C.accentL, fontWeight:500 }}>.net</span>
            </span>
          </div>
          <span style={{ fontSize:11, color:C.dim, letterSpacing:"0.06em", fontWeight:600 }}>EU COMPLIANCE · v4</span>
        </div>
      </nav>

      <div style={{ maxWidth:1140, margin:"0 auto", padding:"28px 20px 70px" }}>

        {/* ════════════════════════════════ INPUT VIEW ════════════════════════════════ */}
        {!result && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>

            {/* Page title */}
            <div style={{ marginBottom:22 }}>
              <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:"-0.04em", color:"#f1f5f9", marginBottom:5 }}>EU Compliance Analysis</h1>
              <p style={{ fontSize:13, color:C.sub, lineHeight:1.6 }}>Describe your product below. Directives are detected automatically. Use the checklist on the right to maximise accuracy.</p>
            </div>

            {/* Split layout */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16, alignItems:"start" }}>

              {/* ── LEFT: textarea + controls ── */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

                {/* Textarea card */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    rows={15}
                    placeholder={`Be specific — the more detail, the more accurate the analysis:

• Connectivity: WiFi 802.11ac, BT 5.0, Zigbee 3.0, LoRaWAN, NFC, LTE Cat-M…
• Market: EU residential / industrial / medical / retail
• Data: cloud storage (which cloud/region), local only, usage analytics…
• Power: 230V mains, Li-ion 3.7V, USB-C 5V, PoE…
• Features: AI/ML model, camera, voice, OTA updates, mobile app…
• Auth: password login, default credentials, MFA, OAuth, BLE pairing…
• Target user: consumers, children, professionals, patients…`}
                    style={{
                      width:"100%", background:"transparent",
                      border:"1.5px solid transparent", borderRadius:12,
                      color:C.text, fontSize:13.5, lineHeight:1.8,
                      padding:"18px 20px", minHeight:280,
                      transition:"border-color 0.15s, box-shadow 0.15s",
                    }}
                  />

                  {/* Auto-detected directives strip */}
                  <div style={{ padding:"10px 20px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", minHeight:44 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:"0.1em", marginRight:4 }}>Auto-detected:</span>
                    {detected.length === 0
                      ? <span style={{ fontSize:12, color:C.dim, fontStyle:"italic" }}>start typing to detect directives…</span>
                      : detected.map(id => {
                          const d = DIR_META[id];
                          return (
                            <span key={id} style={{ fontSize:10, fontWeight:700, color:d.color, background:d.color+"18", border:`1px solid ${d.color}35`, padding:"2px 10px", borderRadius:5, letterSpacing:"0.04em" }}>
                              {d.label}
                            </span>
                          );
                        })
                    }
                  </div>
                </div>

                {/* Controls row */}
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ fontSize:12, fontWeight:600, color:C.sub }}>Depth:</span>
                  {[
                    { v:"standard", label:"Standard", desc:"Core check" },
                    { v:"deep",     label:"Deep",     desc:"Full audit" },
                  ].map(d => (
                    <button key={d.v} onClick={() => setDepth(d.v)} style={{
                      fontSize:12, fontWeight:600, padding:"7px 15px", borderRadius:7,
                      border:`1px solid ${depth===d.v ? C.accent : C.border}`,
                      background: depth===d.v ? "rgba(59,130,246,0.1)" : "transparent",
                      color: depth===d.v ? C.accentL : C.sub,
                      transition:"all 0.15s",
                    }}>
                      {d.label} <span style={{ fontSize:10, opacity:0.6 }}>— {d.desc}</span>
                    </button>
                  ))}

                  <button
                    className="run-btn"
                    onClick={run}
                    disabled={loading || desc.trim().length < 20}
                    style={{
                      marginLeft:"auto",
                      background: desc.trim().length < 20 ? C.dim : "linear-gradient(135deg,#3b82f6,#6366f1)",
                      color:"#fff", fontSize:13, fontWeight:700,
                      padding:"10px 28px", borderRadius:8,
                      boxShadow: desc.trim().length >= 20 ? "0 4px 16px rgba(59,130,246,0.28)" : "none",
                      opacity: desc.trim().length < 20 ? 0.5 : 1,
                      display:"flex", alignItems:"center", gap:8, transition:"all 0.2s",
                      letterSpacing:"-0.01em",
                    }}
                  >
                    {loading
                      ? <><div style={{ width:13, height:13, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />Analysing…</>
                      : `Run Analysis →`
                    }
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:10, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
                    <span style={{ color:"#ef4444", fontSize:16, marginTop:1 }}>⚠</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#ef4444", marginBottom:4 }}>Backend unreachable</div>
                      <div style={{ fontSize:12, color:"#fca5a5", lineHeight:1.65, marginBottom:8 }}>{error}</div>
                      <code style={{ fontSize:11, color:"#a78bfa", background:C.surface, padding:"5px 12px", borderRadius:6, display:"inline-block", letterSpacing:"0.02em" }}>
                        uvicorn main:app --reload
                      </code>
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT: checklist panel ── */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", position:"sticky", top:68 }}>

                {/* Header */}
                <div style={{ padding:"14px 16px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:10, fontWeight:800, color:C.sub, textTransform:"uppercase", letterSpacing:"0.12em" }}>Input Quality</span>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:60, height:4, background:C.border, borderRadius:2, overflow:"hidden" }}>
                      <div style={{ width:`${quality}%`, height:"100%", background:qColor, borderRadius:2, transition:"width 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:qColor }}>{quality}%</span>
                  </div>
                </div>

                {/* Checklist items */}
                <div style={{ padding:"8px 12px 12px" }}>
                  {checklist.map(c => (
                    <div key={c.id} className="checklist-row" style={{ padding:"8px 6px", display:"flex", gap:10, alignItems:"flex-start" }}>
                      {/* Checkbox */}
                      <div style={{
                        width:18, height:18, borderRadius:5, flexShrink:0, marginTop:1,
                        background: c.done ? "rgba(16,185,129,0.15)" : "transparent",
                        border: `1.5px solid ${c.done ? "#10b981" : C.dim}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:10, color:"#10b981", fontWeight:800, transition:"all 0.2s",
                      }}>{c.done ? "✓" : ""}</div>

                      {/* Label + hint */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{
                          fontSize:12, fontWeight:600, lineHeight:1.35,
                          color: c.done ? C.dim : "#cbd5e1",
                          textDecoration: c.done ? "line-through" : "none",
                          transition:"all 0.25s",
                        }}>{c.label}</div>
                        {!c.done && (
                          <div style={{ fontSize:10, color:C.dim, lineHeight:1.5, marginTop:2 }}>{c.hint}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer message */}
                <div style={{ padding:"10px 16px 14px", borderTop:`1px solid ${C.border}` }}>
                  {quality === 100
                    ? <div style={{ fontSize:11, color:"#10b981", fontWeight:600 }}>✓ All items covered — excellent detail!</div>
                    : quality >= 70
                    ? <div style={{ fontSize:11, color:"#f59e0b" }}>Good — a few more details will improve accuracy.</div>
                    : <div style={{ fontSize:11, color:C.sub, lineHeight:1.6 }}>Fill unchecked items above for the most accurate compliance check.</div>
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════ LOADING ════════════════════════════════ */}
        {loading && (
          <div style={{ animation:"fadeIn 0.2s ease" }}>
            <div style={{ fontSize:13, color:C.sub, marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:13, height:13, border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />
              Checking {detected.length} directive{detected.length!==1?"s":""}…
            </div>
            {[90,70,85,55].map((w,i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:12, animation:`pulse 1.5s ease ${i*0.18}s infinite` }}>
                <div style={{ height:12, background:C.border, borderRadius:4, width:`${w*0.35}%`, marginBottom:13 }} />
                <div style={{ height:10, background:C.surface, borderRadius:4, width:`${w}%`, marginBottom:7 }} />
                <div style={{ height:10, background:C.surface, borderRadius:4, width:`${w*0.7}%` }} />
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════ RESULTS ════════════════════════════════ */}
        {result && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>

            {/* ── Risk banner ── */}
            <div style={{
              background:C.card, border:`1px solid ${C.border}`,
              borderLeft:`3px solid ${riskCfg.color}`,
              borderRadius:12, padding:"18px 22px", marginBottom:16,
              display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap",
              boxShadow:`0 0 24px ${riskCfg.glow}`,
            }}>
              {/* Risk */}
              <div style={{ minWidth:90 }}>
                <div style={{ fontSize:9, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>Risk Level</div>
                <div style={{ fontSize:30, fontWeight:800, color:riskCfg.color, letterSpacing:"-0.04em", lineHeight:1 }}>{result.overall_risk}</div>
              </div>
              <div style={{ width:1, background:C.border, alignSelf:"stretch" }} />
              {/* Summary */}
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:9, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:6 }}>Summary</div>
                <div style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.68 }}>{result.summary}</div>
              </div>
              {/* Counts */}
              <div style={{ display:"flex", gap:8, flexShrink:0, flexWrap:"wrap" }}>
                {[["FAIL","#ef4444"],["WARN","#f59e0b"],["PASS","#10b981"],["INFO","#60a5fa"]].map(([s,c]) =>
                  (counts[s]>0) && (
                    <div key={s} style={{ background:c+"12", border:`1px solid ${c}28`, borderRadius:8, padding:"8px 14px", textAlign:"center", minWidth:52 }}>
                      <div style={{ fontSize:20, fontWeight:800, color:c, lineHeight:1 }}>{counts[s]}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:c, opacity:0.65, letterSpacing:"0.08em", marginTop:2 }}>{s}</div>
                    </div>
                  )
                )}
              </div>
              {/* Modify */}
              <button onClick={() => { setResult(null); setError(null); }} style={{
                background:"transparent", border:`1px solid ${C.border}`, color:C.sub,
                fontSize:12, fontWeight:600, padding:"8px 16px", borderRadius:7, alignSelf:"center",
                transition:"all 0.15s",
              }}>← Modify</button>
            </div>

            {/* ── Horizontal directive tabs ── */}
            <div style={{ display:"flex", gap:3, overflowX:"auto", position:"relative" }}>
              {dirTabs.map(dir => {
                const dm  = DIR_META[dir] || { label:dir, color:C.accent };
                const isA = activeTab === dir;
                const fc  = (grouped[dir]||[]).filter(f=>f.status==="FAIL").length;
                const wc  = (grouped[dir]||[]).filter(f=>f.status==="WARN").length;
                return (
                  <button key={dir} className={`tab-btn ${isA?"active":""}`} onClick={() => setActiveTab(dir)} style={{
                    padding:"9px 16px",
                    background: isA ? C.card : "transparent",
                    border:`1px solid ${isA ? dm.color+"50" : C.border}`,
                    borderBottom: isA ? `1px solid ${C.card}` : `1px solid ${C.border}`,
                    borderTopLeftRadius:8, borderTopRightRadius:8,
                    borderBottomLeftRadius:0, borderBottomRightRadius:0,
                    color: isA ? dm.color : C.dim,
                    fontSize:12, fontWeight:700, whiteSpace:"nowrap",
                    display:"flex", alignItems:"center", gap:6,
                    transition:"all 0.15s", position:"relative", bottom:-1,
                    cursor:"pointer",
                  }}>
                    {dm.label}
                    {fc>0 && <span style={{ fontSize:9, fontWeight:800, color:"#fff", background:"#ef4444", padding:"1px 5px", borderRadius:4, letterSpacing:"0.04em" }}>{fc}F</span>}
                    {fc===0 && wc>0 && <span style={{ fontSize:9, fontWeight:800, color:"#78350f", background:"#fde68a", padding:"1px 5px", borderRadius:4 }}>{wc}W</span>}
                  </button>
                );
              })}
            </div>

            {/* ── Tab content ── */}
            {activeDir && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"0 8px 12px 12px" }}>

                {/* Panel header */}
                <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"auto 1fr auto", gap:"0 24px", alignItems:"start" }}>
                  {/* Directive name */}
                  <div>
                    <div style={{ fontSize:17, fontWeight:800, color:activeDir.color, letterSpacing:"-0.02em", marginBottom:2 }}>{activeDir.label}</div>
                    <div style={{ fontSize:11, color:C.sub }}>{activeDir.full}</div>
                    <div style={{ fontSize:10, color:C.dim, marginTop:1 }}>{activeDir.ref}</div>
                  </div>
                  {/* Standards — vertical list */}
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>Applicable Standards</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      {activeDir.standards.map((s,i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:3, height:3, borderRadius:"50%", background:activeDir.color, opacity:0.5, flexShrink:0 }} />
                          <span style={{ fontSize:11, color:"#94a3b8", fontFamily:"'SFMono-Regular','Fira Code',monospace" }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Finding counts */}
                  <div style={{ display:"flex", gap:6 }}>
                    {["FAIL","WARN","PASS","INFO"].map(s => {
                      const n = tabFindings.filter(f=>f.status===s).length;
                      const sc = STATUS_CFG[s];
                      return n>0 && (
                        <div key={s} style={{ background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:6, padding:"5px 10px", textAlign:"center" }}>
                          <div style={{ fontSize:16, fontWeight:800, color:sc.color, lineHeight:1 }}>{n}</div>
                          <div style={{ fontSize:8, fontWeight:700, color:sc.color, opacity:0.65, letterSpacing:"0.08em", marginTop:2 }}>{s}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Findings */}
                {tabFindings.map((f, idx) => {
                  const sc = STATUS_CFG[f.status] || STATUS_CFG.INFO;
                  return (
                    <div key={f._i} className="finding-row" style={{
                      padding:"15px 20px",
                      borderBottom: idx < tabFindings.length-1 ? `1px solid ${C.border}` : "none",
                      display:"grid", gridTemplateColumns:"30px 1fr auto",
                      gap:"0 14px", background:"transparent", transition:"background 0.12s",
                    }}>
                      {/* Icon */}
                      <div style={{
                        width:26, height:26, borderRadius:7, gridRow:"1/3",
                        background:sc.bg, border:`1px solid ${sc.border}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:11, fontWeight:800, color:sc.color, flexShrink:0, marginTop:1,
                      }}>{sc.icon}</div>

                      {/* Content */}
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#cbd5e1", marginBottom:4, lineHeight:1.4 }}>{f.article}</div>
                        <div style={{ fontSize:12, color:C.sub, lineHeight:1.68 }}>{f.finding}</div>
                        {f.action && (
                          <div style={{ marginTop:8, paddingLeft:12, borderLeft:`2px solid ${sc.color}35`, fontSize:12, color:C.dim, lineHeight:1.65 }}>
                            <span style={{ fontWeight:600, color:sc.color, opacity:0.85 }}>Action: </span>
                            {f.action}
                          </div>
                        )}
                      </div>

                      {/* Badge */}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}