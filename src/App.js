import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD QUESTIONS — plain language, multi-select chips
// Each answer contributes keyword phrases to the final description
// ─────────────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "type",
    q: "What kind of product is it?",
    sub: "Pick the closest match — you can refine later.",
    multi: false,
    options: [
      { label:"Smart home device",     icon:"🏠", val:"smart home consumer device for residential use" },
      { label:"Industrial sensor",     icon:"🏭", val:"industrial sensor for professional B2B use in factory environment" },
      { label:"Wearable / fitness",    icon:"⌚", val:"consumer wearable fitness tracker worn by end users" },
      { label:"Medical device",        icon:"🏥", val:"medical device for clinical or patient use in healthcare" },
      { label:"Router / gateway",      icon:"📡", val:"network gateway router hub for connectivity" },
      { label:"EV charger / energy",   icon:"⚡", val:"EV charger energy management device mains-powered" },
      { label:"Security camera",       icon:"📷", val:"security camera with video capture surveillance" },
      { label:"Children's toy",        icon:"🧸", val:"children's toy for kids educational use" },
      { label:"Other / custom",        icon:"🔧", val:"electronic connected device" },
    ],
  },
  {
    id: "wireless",
    q: "Does it communicate wirelessly?",
    sub: "Select all that apply.",
    multi: true,
    options: [
      { label:"WiFi",        icon:"📶", val:"WiFi 802.11 wireless" },
      { label:"Bluetooth",   icon:"🔵", val:"Bluetooth BLE wireless" },
      { label:"Zigbee",      icon:"🔷", val:"Zigbee IEEE 802.15 wireless" },
      { label:"4G / LTE",    icon:"📱", val:"LTE 4G cellular GSM" },
      { label:"5G",          icon:"🚀", val:"5G cellular NR" },
      { label:"LoRa / LPWAN",icon:"📻", val:"LoRa LoRaWAN LPWAN 868MHz 915MHz" },
      { label:"NFC / RFID",  icon:"💳", val:"NFC near field RFID" },
      { label:"No wireless", icon:"🚫", val:"no wireless radio standalone wired only" },
    ],
  },
  {
    id: "power",
    q: "How is it powered?",
    sub: "Select all that apply.",
    multi: true,
    options: [
      { label:"Mains plug 230V",    icon:"🔌", val:"mains-powered 230V AC power supply wall plug hardwired" },
      { label:"Li-ion battery",     icon:"🔋", val:"Li-ion lithium battery rechargeable battery pack BMS" },
      { label:"USB-C / USB power",  icon:"⚡", val:"USB-C USB power 5V USB powered" },
      { label:"AA / AAA batteries", icon:"🪫", val:"AA AAA alkaline battery replaceable" },
      { label:"PoE (Ethernet)",     icon:"🌐", val:"PoE Power over Ethernet 48V" },
      { label:"Solar / energy harvest", icon:"☀️", val:"solar energy harvesting" },
    ],
  },
  {
    id: "data",
    q: "What data does it collect or process?",
    sub: "Select all that apply. This is critical for GDPR.",
    multi: true,
    options: [
      { label:"No personal data",      icon:"🔒", val:"no personal data collected local only offline" },
      { label:"User accounts / login", icon:"👤", val:"user account login password credentials authentication" },
      { label:"Location / GPS",        icon:"📍", val:"GPS location geolocation tracking position coordinates" },
      { label:"Health / biometric",    icon:"❤️", val:"health data heart rate biometric blood SPO2 sleep medical ECG" },
      { label:"Email / name / contact",icon:"📧", val:"personal data email name address contact user profile" },
      { label:"Usage patterns",        icon:"📊", val:"usage data behavioural analytics telemetry usage pattern" },
      { label:"Camera / video",        icon:"📸", val:"camera video capture image snapshot surveillance" },
      { label:"Voice / microphone",    icon:"🎙️", val:"voice microphone audio speech recognition" },
    ],
  },
  {
    id: "cloud",
    q: "Where does data go?",
    sub: "Select one.",
    multi: false,
    options: [
      { label:"EU cloud (AWS EU, Azure EU…)", icon:"🇪🇺", val:"cloud server EU-based AWS Azure Google Cloud backend API internet connected" },
      { label:"US / non-EU cloud",            icon:"🌎", val:"US cloud server non-EU outside EU US-based server data transfer" },
      { label:"Own server (EU)",              icon:"🖥️", val:"own server self-hosted EU backend cloud API" },
      { label:"Fully local — no cloud",       icon:"🔌", val:"local only no cloud no internet offline standalone no remote" },
      { label:"Mobile app + cloud",           icon:"📱", val:"mobile app iOS Android companion app cloud backend internet connected" },
    ],
  },
  {
    id: "software",
    q: "What software features does it have?",
    sub: "Select all that apply.",
    multi: true,
    options: [
      { label:"Firmware updates (OTA)", icon:"🔄", val:"OTA over-the-air firmware update software update remote update" },
      { label:"Mobile companion app",   icon:"📱", val:"mobile app companion app iOS Android web dashboard" },
      { label:"Embedded OS / Linux",    icon:"💻", val:"embedded Linux RTOS operating system microcontroller firmware software" },
      { label:"Web interface",          icon:"🌐", val:"web interface web app dashboard browser" },
      { label:"API / cloud integration",icon:"🔗", val:"API endpoint cloud integration backend server MQTT HTTP" },
      { label:"No software / simple",   icon:"⚙️", val:"simple embedded microcontroller basic firmware" },
    ],
  },
  {
    id: "auth",
    q: "How do users log in or pair the device?",
    sub: "Pick the closest match.",
    multi: false,
    options: [
      { label:"Unique password per device", icon:"✅", val:"unique per-device password device-specific credentials secure by default" },
      { label:"User sets own password",     icon:"🔑", val:"user account login password authentication credentials" },
      { label:"Default password (same for all)", icon:"⚠️", val:"default password default credentials same password all devices admin" },
      { label:"MFA / two-factor auth",      icon:"🛡️", val:"MFA 2FA two-factor multi-factor authentication TOTP OAuth" },
      { label:"BLE pairing / PIN",          icon:"🔷", val:"BLE pairing PIN code Bluetooth pairing passphrase" },
      { label:"No login needed",            icon:"🚫", val:"no authentication no login anonymous access" },
    ],
  },
  {
    id: "ai",
    q: "Does it use AI or machine learning?",
    sub: "Select all that apply.",
    multi: true,
    options: [
      { label:"No AI",                    icon:"🚫", val:"no AI no machine learning rule-based" },
      { label:"On-device ML inference",   icon:"🧠", val:"on-device AI machine learning inference neural network model embedded" },
      { label:"Cloud AI / LLM",           icon:"☁️", val:"cloud AI LLM large language model GPT machine learning backend" },
      { label:"Computer vision / camera", icon:"👁️", val:"computer vision image recognition object detection camera AI" },
      { label:"Voice assistant",          icon:"🗣️", val:"voice assistant wake word speech recognition always listening NLP" },
      { label:"Anomaly / predictive",     icon:"📈", val:"anomaly detection predictive analytics recommendation engine automated decision" },
      { label:"Facial recognition",       icon:"😶", val:"facial recognition face detection biometric AI face ID" },
    ],
  },
  {
    id: "market",
    q: "Where and how is it sold?",
    sub: "Select all that apply.",
    multi: true,
    options: [
      { label:"Direct to consumers (B2C)", icon:"🛒", val:"consumer product retail end user residential household personal use" },
      { label:"Business / enterprise (B2B)", icon:"🏢", val:"B2B enterprise professional industrial business use" },
      { label:"Medical / healthcare",      icon:"🏥", val:"medical clinical healthcare hospital patient wellness" },
      { label:"Children's product",        icon:"🧒", val:"children kids toy school minors parental control age verification" },
      { label:"EU market",                 icon:"🇪🇺", val:"EU market European Union CE marking" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTIVE DETECTION
// ─────────────────────────────────────────────────────────────────────────────
function detectDirectives(text) {
  const t = text.toLowerCase();
  const has = (kws) => kws.some(k => t.includes(k));
  const r = [];
  if (has(["wifi","802.11","bluetooth","ble","zigbee","lora","lorawan","nfc","near field","lte","4g","5g","cellular","gsm","nb-iot","radio","wireless","rf ","868mhz","915mhz"])) r.push("RED");
  if (has(["software","firmware","embedded","microcontroller","app","connected","iot","cloud","internet","ota","over-the-air","api","network","mqtt","http","linux","rtos","digital"])) r.push("CRA");
  if (has(["personal data","user account","login","password","credentials","email","location","gps","health","biometric","camera","voice","usage data","tracking","analytics","surveillance"])) r.push("GDPR");
  if (has(["machine learning","ai ","neural","inference","llm","computer vision","voice assistant","speech recognition","facial recognition","anomaly","recommendation","automated decision"])) r.push("AI_Act");
  if (has(["230v","mains","mains-powered","wall plug","hardwired","li-ion","lithium","battery pack","bms","poe","power over ethernet","rechargeable battery","usb-c","usb power"])) r.push("LVD");
  if (has(["mains","230v","battery","usb","wifi","bluetooth","radio","wireless","embedded","microcontroller","sensor","circuit","electronic","electrical","pcb","motor","display"])) r.push("EMC");
  if (has(["repair","recyclable","recycled","sustainability","energy label","spare part","end of life","eol","digital product passport","dpp","carbon","ecodesign"])) r.push("ESPR");
  if (r.length === 0 && text.length > 20) { r.push("CRA"); r.push("EMC"); }
  return [...new Set(r)];
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTIVE + STATUS METADATA
// ─────────────────────────────────────────────────────────────────────────────
const DIR_META = {
  RED:    { label:"RED",    full:"Radio Equipment Directive",            color:"#60a5fa", ref:"2014/53/EU",     standards:["ETSI EN 303 645","EN 18031-1/-2/-3","ETSI EN 301 489-1","ETSI EN 300 328"] },
  CRA:    { label:"CRA",    full:"Cyber Resilience Act",                 color:"#f472b6", ref:"(EU) 2024/2847", standards:["ETSI EN 303 645","IEC 62443-4-1/-2","ISO/IEC 27001","ISO/IEC 29147","SPDX / CycloneDX"] },
  GDPR:   { label:"GDPR",   full:"General Data Protection Regulation",   color:"#34d399", ref:"(EU) 2016/679",  standards:["ISO/IEC 27701:2019","ISO/IEC 29134","ISO/IEC 27018","EDPB Guidelines 9/2022"] },
  AI_Act: { label:"AI Act", full:"Artificial Intelligence Act",          color:"#a78bfa", ref:"(EU) 2024/1689", standards:["ISO/IEC 42001:2023","ISO/IEC 23894","NIST AI RMF 1.0","CEN/CENELEC JTC 21"] },
  LVD:    { label:"LVD",    full:"Low Voltage Directive",                color:"#fb923c", ref:"2014/35/EU",     standards:["EN 62368-1:2020","EN 60335-1+A14","IEC 62133-2:2017","EN 60664-1"] },
  EMC:    { label:"EMC",    full:"Electromagnetic Compatibility",        color:"#fbbf24", ref:"2014/30/EU",     standards:["EN 55032:2015+A1","EN 55035:2017","EN 61000-4-2/-3/-5","ETSI EN 301 489-1"] },
  ESPR:   { label:"ESPR",   full:"Ecodesign for Sustainable Products",   color:"#86efac", ref:"(EU) 2024/1781", standards:["ISO 14040/14044","EN 45554:2020","IEC 63074:2023","GS1 Digital Link"] },
};

const SC = {
  FAIL: { icon:"✕", color:"#ef4444", bg:"rgba(239,68,68,0.10)", border:"rgba(239,68,68,0.28)" },
  WARN: { icon:"!",  color:"#f59e0b", bg:"rgba(245,158,11,0.09)", border:"rgba(245,158,11,0.28)" },
  PASS: { icon:"✓", color:"#10b981", bg:"rgba(16,185,129,0.09)", border:"rgba(16,185,129,0.28)" },
  INFO: { icon:"i",  color:"#60a5fa", bg:"rgba(96,165,250,0.08)", border:"rgba(96,165,250,0.22)" },
};

const RISK = {
  CRITICAL:{ color:"#ef4444", glow:"rgba(239,68,68,0.18)"  },
  HIGH:    { color:"#f97316", glow:"rgba(249,115,22,0.15)" },
  MEDIUM:  { color:"#f59e0b", glow:"rgba(245,158,11,0.13)" },
  LOW:     { color:"#10b981", glow:"rgba(16,185,129,0.12)" },
};

// Palette
const P = {
  bg:"#080d1a", surf:"#0c1222", card:"#101828", card2:"#0e1520",
  b:"#1a2540", b2:"#1e2e50", text:"#e2e8f0", sub:"#94a3b8",
  dim:"#334155", acc:"#3b82f6", accL:"#60a5fa",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // Wizard state
  const [step,      setStep]      = useState(0);          // current question index
  const [answers,   setAnswers]   = useState({});         // { qId: [val,...] }
  const [extraDesc, setExtraDesc] = useState("");         // optional freetext
  const [depth,     setDepth]     = useState("standard");
  const [view,      setView]      = useState("wizard");   // wizard | results

  // Result state
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  // Build description from answers
  const buildDesc = () => {
    const parts = [];
    QUESTIONS.forEach(q => {
      const ans = answers[q.id];
      if (ans && ans.length) ans.forEach(v => parts.push(v));
    });
    if (extraDesc.trim()) parts.push(extraDesc.trim());
    return parts.join(". ");
  };

  const desc     = buildDesc();
  const detected = detectDirectives(desc);
  const answered = Object.keys(answers).filter(k => answers[k]?.length > 0).length;
  const progress = Math.round((answered / QUESTIONS.length) * 100);

  // Select / deselect an option
  const pick = (qId, val, multi) => {
    setAnswers(prev => {
      const cur = prev[qId] || [];
      if (multi) {
        return { ...prev, [qId]: cur.includes(val) ? cur.filter(v=>v!==val) : [...cur, val] };
      } else {
        return { ...prev, [qId]: cur[0] === val ? [] : [val] };
      }
    });
  };

  const isSelected = (qId, val) => (answers[qId] || []).includes(val);

  // Run analysis
  const run = async () => {
    if (!desc.trim()) return;
    setLoading(true); setResult(null); setError(null); setView("results");
    try {
      const r = await fetch("https://regcheck-api.onrender.com/analyze", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ description:desc, category:"", directives:detected, depth }),
      });
      if (!r.ok) throw new Error("Server error " + r.status);
      const data = await r.json();
      setResult(data);
      const g = groupFindings(data.findings);
      setActiveTab(Object.keys(g)[0] || null);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const groupFindings = (findings) => findings.reduce((acc, f, i) => {
    if (!acc[f.directive]) acc[f.directive] = [];
    acc[f.directive].push({...f, _i:i});
    return acc;
  }, {});

  const grouped     = result ? groupFindings(result.findings) : {};
  const dirTabs     = Object.keys(grouped);
  const counts      = result ? result.findings.reduce((a,f)=>{ a[f.status]=(a[f.status]||0)+1; return a; },{}) : {};
  const tabFindings = (activeTab && grouped[activeTab]) ? grouped[activeTab] : [];
  const activeDir   = activeTab ? DIR_META[activeTab] : null;
  const riskCfg     = result ? (RISK[result.overall_risk] || RISK.LOW) : null;

  const curQ = QUESTIONS[step];

  return (
    <div style={{ minHeight:"100vh", background:P.bg, color:P.text, fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:${P.bg}}
        button,textarea{font-family:inherit}
        textarea{outline:none;resize:none}
        button{cursor:pointer;border:none;outline:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.35}50%{opacity:.7}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:${P.b};border-radius:2px}
        .chip:hover{border-color:${P.accL} !important;background:rgba(96,165,250,0.06) !important}
        .chip.sel{border-color:${P.acc} !important}
        .tab-btn:hover:not(.active){color:${P.sub} !important;background:${P.card} !important}
        .finding-row:hover{background:rgba(255,255,255,0.018) !important}
        textarea:focus{border-color:${P.acc} !important}
        .run:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px)}
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background:P.surf, borderBottom:`1px solid ${P.b}`, padding:"0 24px", position:"sticky", top:0, zIndex:200 }}>
        <div style={{ maxWidth:860, margin:"0 auto", height:52, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#3b82f6,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:"#fff" }}>R</div>
            <span style={{ fontWeight:800, fontSize:16, letterSpacing:"-0.03em", color:"#f1f5f9" }}>
              RuleGrid<span style={{ color:P.accL, fontWeight:500 }}>.net</span>
            </span>
          </div>
          {view === "wizard" && (
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:120, height:3, background:P.b, borderRadius:2, overflow:"hidden" }}>
                <div style={{ width:`${progress}%`, height:"100%", background:`linear-gradient(90deg,#3b82f6,#7c3aed)`, transition:"width 0.4s ease", borderRadius:2 }} />
              </div>
              <span style={{ fontSize:11, color:P.dim, fontWeight:600 }}>{answered}/{QUESTIONS.length}</span>
            </div>
          )}
          {view === "results" && (
            <button onClick={()=>{ setView("wizard"); setResult(null); setError(null); }} style={{ fontSize:12, fontWeight:600, color:P.sub, background:"transparent", border:`1px solid ${P.b}`, padding:"6px 14px", borderRadius:7 }}>
              ← Edit answers
            </button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"32px 20px 80px" }}>

        {/* ════════════════════ WIZARD ════════════════════ */}
        {view === "wizard" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>

            {/* Step indicator dots */}
            <div style={{ display:"flex", gap:5, marginBottom:32, justifyContent:"center" }}>
              {QUESTIONS.map((q,i) => {
                const done = (answers[q.id]||[]).length > 0;
                const active = i === step;
                return (
                  <button key={q.id} onClick={() => setStep(i)} style={{
                    width: active ? 24 : 8, height:8, borderRadius:4,
                    background: done ? P.acc : active ? P.accL : P.b,
                    border:"none", transition:"all 0.25s ease", cursor:"pointer",
                    opacity: active ? 1 : done ? 0.8 : 0.4,
                  }} />
                );
              })}
            </div>

            {/* Question card */}
            <div key={step} style={{ animation:"fadeIn 0.25s ease" }}>
              <div style={{ textAlign:"center", marginBottom:28 }}>
                <div style={{ fontSize:11, fontWeight:700, color:P.dim, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>
                  Step {step+1} of {QUESTIONS.length}
                </div>
                <h2 style={{ fontSize:"clamp(18px,3.5vw,26px)", fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.03em", marginBottom:8, lineHeight:1.25 }}>
                  {curQ.q}
                </h2>
                <p style={{ fontSize:13, color:P.sub, lineHeight:1.6 }}>{curQ.sub}</p>
              </div>

              {/* Option chips */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center", marginBottom:32 }}>
                {curQ.options.map(opt => {
                  const sel = isSelected(curQ.id, opt.val);
                  return (
                    <button
                      key={opt.val}
                      className={`chip ${sel?"sel":""}`}
                      onClick={() => pick(curQ.id, opt.val, curQ.multi)}
                      style={{
                        padding:"12px 18px",
                        background: sel ? "rgba(59,130,246,0.12)" : P.card,
                        border:`1.5px solid ${sel ? P.acc : P.b}`,
                        borderRadius:10, color: sel ? "#f1f5f9" : P.sub,
                        fontSize:13, fontWeight: sel ? 600 : 500,
                        display:"flex", alignItems:"center", gap:8,
                        transition:"all 0.15s", minWidth:140,
                        boxShadow: sel ? `0 0 0 3px rgba(59,130,246,0.12)` : "none",
                      }}
                    >
                      <span style={{ fontSize:18 }}>{opt.icon}</span>
                      <span>{opt.label}</span>
                      {sel && <span style={{ marginLeft:"auto", fontSize:11, color:P.acc }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                <button
                  onClick={() => setStep(s => Math.max(0,s-1))}
                  disabled={step === 0}
                  style={{ fontSize:13, fontWeight:600, color:P.sub, background:"transparent", border:`1px solid ${P.b}`, padding:"10px 22px", borderRadius:8, opacity:step===0?0.3:1, transition:"opacity 0.15s" }}
                >
                  ← Back
                </button>

                {/* Detected directives preview */}
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"center" }}>
                  {detected.map(id => {
                    const d = DIR_META[id];
                    return <span key={id} style={{ fontSize:10, fontWeight:700, color:d.color, background:d.color+"18", border:`1px solid ${d.color}30`, padding:"2px 9px", borderRadius:5, letterSpacing:"0.04em" }}>{d.label}</span>;
                  })}
                </div>

                {step < QUESTIONS.length - 1 ? (
                  <button
                    onClick={() => setStep(s => s+1)}
                    style={{ fontSize:13, fontWeight:700, color:"#fff", background:`linear-gradient(135deg,${P.acc},#6366f1)`, border:"none", padding:"10px 26px", borderRadius:8, boxShadow:"0 4px 14px rgba(59,130,246,0.25)", transition:"all 0.2s" }}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => setStep(QUESTIONS.length)} // go to review
                    style={{ fontSize:13, fontWeight:700, color:"#fff", background:`linear-gradient(135deg,#10b981,#059669)`, border:"none", padding:"10px 26px", borderRadius:8, boxShadow:"0 4px 14px rgba(16,185,129,0.25)", transition:"all 0.2s" }}
                  >
                    Review & Run →
                  </button>
                )}
              </div>
            </div>

            {/* ── REVIEW / LAUNCH step ── */}
            {step >= QUESTIONS.length && (
              <div style={{ marginTop:32, animation:"fadeIn 0.25s ease" }}>
                <div style={{ textAlign:"center", marginBottom:24 }}>
                  <h2 style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", letterSpacing:"-0.03em", marginBottom:6 }}>Ready to analyse</h2>
                  <p style={{ fontSize:13, color:P.sub }}>Review your answers below. Add any extra detail, then run.</p>
                </div>

                {/* Answer summary */}
                <div style={{ background:P.card, border:`1px solid ${P.b}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                  {QUESTIONS.map((q,i) => {
                    const ans = answers[q.id] || [];
                    const labels = q.options.filter(o => ans.includes(o.val)).map(o=>o.icon+" "+o.label);
                    return (
                      <div key={q.id} style={{ padding:"12px 18px", borderBottom: i<QUESTIONS.length-1?`1px solid ${P.b}`:"none", display:"flex", gap:12, alignItems:"flex-start" }}>
                        <button onClick={()=>setStep(i)} style={{ fontSize:10, fontWeight:700, color:P.acc, background:"transparent", border:`1px solid ${P.b}`, borderRadius:5, padding:"2px 8px", whiteSpace:"nowrap", flexShrink:0, marginTop:2 }}>Edit</button>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:P.dim, marginBottom:4 }}>{q.q}</div>
                          {labels.length > 0
                            ? <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                                {labels.map((l,j) => <span key={j} style={{ fontSize:12, color:P.accL, background:P.acc+"14", border:`1px solid ${P.acc}28`, padding:"2px 10px", borderRadius:5 }}>{l}</span>)}
                              </div>
                            : <span style={{ fontSize:12, color:P.dim, fontStyle:"italic" }}>Not answered</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Extra detail */}
                <div style={{ background:P.card, border:`1px solid ${P.b}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                  <div style={{ padding:"12px 18px 0" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:P.dim, marginBottom:8 }}>Anything else to add? (optional)</div>
                    <textarea
                      rows={3}
                      value={extraDesc}
                      onChange={e=>setExtraDesc(e.target.value)}
                      placeholder="e.g. product is CE marked already, uses TLS 1.3, has ISO 27001 certification, targets UK market too…"
                      style={{ width:"100%", background:"transparent", border:`1px solid ${P.b}`, borderRadius:8, color:P.text, fontSize:13, lineHeight:1.7, padding:"10px 14px", transition:"border-color 0.15s" }}
                    />
                  </div>
                  <div style={{ padding:"10px 18px 14px", display:"flex", alignItems:"center", gap:10, borderTop:`1px solid ${P.b}`, marginTop:12 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:P.sub }}>Depth:</span>
                    {[{v:"standard",l:"Standard"},{v:"deep",l:"Deep — full audit"}].map(d=>(
                      <button key={d.v} onClick={()=>setDepth(d.v)} style={{ fontSize:12, fontWeight:600, padding:"6px 14px", borderRadius:7, border:`1px solid ${depth===d.v?P.acc:P.b}`, background:depth===d.v?"rgba(59,130,246,0.1)":"transparent", color:depth===d.v?P.accL:P.sub, transition:"all 0.15s" }}>{d.l}</button>
                    ))}
                  </div>
                </div>

                {/* Detected directives */}
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:20, alignItems:"center" }}>
                  <span style={{ fontSize:11, fontWeight:600, color:P.dim }}>Will check:</span>
                  {detected.map(id => { const d=DIR_META[id]; return <span key={id} style={{ fontSize:11, fontWeight:700, color:d.color, background:d.color+"18", border:`1px solid ${d.color}30`, padding:"3px 10px", borderRadius:6 }}>{d.label} — {d.full}</span>; })}
                </div>

                <button className="run" onClick={run} disabled={loading || detected.length===0} style={{
                  width:"100%", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"#fff",
                  fontSize:15, fontWeight:700, padding:"15px", borderRadius:10,
                  boxShadow:"0 6px 20px rgba(59,130,246,0.3)", transition:"all 0.2s",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  opacity: detected.length===0 ? 0.5 : 1, letterSpacing:"-0.01em",
                }}>
                  {loading
                    ? <><div style={{ width:15,height:15,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.65s linear infinite" }}/>Analysing {detected.length} directive{detected.length!==1?"s":""}…</>
                    : `Run Compliance Analysis — ${detected.length} directive${detected.length!==1?"s":""}  →`
                  }
                </button>

                {error && (
                  <div style={{ marginTop:14, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.22)", borderRadius:10, padding:"14px 18px" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#ef4444", marginBottom:4 }}>Backend unreachable</div>
                    <div style={{ fontSize:12, color:"#fca5a5", marginBottom:8, lineHeight:1.6 }}>{error}</div>
                    <code style={{ fontSize:11, color:"#a78bfa", background:P.surf, padding:"5px 12px", borderRadius:6, display:"inline-block" }}>uvicorn main:app --reload</code>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ LOADING ════════════════════ */}
        {view === "results" && loading && (
          <div style={{ animation:"fadeIn 0.2s ease" }}>
            <div style={{ fontSize:13, color:P.sub, marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:13,height:13,border:`2px solid ${P.b}`,borderTopColor:P.acc,borderRadius:"50%",animation:"spin 0.65s linear infinite" }}/>
              Checking {detected.length} directive{detected.length!==1?"s":" "}across EU regulations…
            </div>
            {[1,2,3,4].map(i=>(
              <div key={i} style={{ background:P.card, border:`1px solid ${P.b}`, borderRadius:10, padding:20, marginBottom:12, animation:`pulse 1.5s ease ${i*0.18}s infinite` }}>
                <div style={{ height:12,background:P.b,borderRadius:4,width:"32%",marginBottom:13 }}/>
                <div style={{ height:10,background:P.surf,borderRadius:4,width:"85%",marginBottom:7 }}/>
                <div style={{ height:10,background:P.surf,borderRadius:4,width:"60%" }}/>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════ RESULTS ════════════════════ */}
        {view === "results" && result && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>

            {/* Risk banner */}
            <div style={{ background:P.card, border:`1px solid ${P.b}`, borderLeft:`3px solid ${riskCfg.color}`, borderRadius:12, padding:"18px 22px", marginBottom:16, display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap", boxShadow:`0 0 24px ${riskCfg.glow}` }}>
              <div>
                <div style={{ fontSize:9,fontWeight:700,color:P.dim,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4 }}>Risk Level</div>
                <div style={{ fontSize:30,fontWeight:800,color:riskCfg.color,letterSpacing:"-0.04em",lineHeight:1 }}>{result.overall_risk}</div>
              </div>
              <div style={{ width:1,background:P.b,alignSelf:"stretch" }}/>
              <div style={{ flex:1,minWidth:200 }}>
                <div style={{ fontSize:9,fontWeight:700,color:P.dim,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6 }}>Summary</div>
                <div style={{ fontSize:13,color:"#cbd5e1",lineHeight:1.68 }}>{result.summary}</div>
              </div>
              <div style={{ display:"flex",gap:8,flexShrink:0,flexWrap:"wrap" }}>
                {[["FAIL","#ef4444"],["WARN","#f59e0b"],["PASS","#10b981"],["INFO","#60a5fa"]].map(([s,c])=>
                  (counts[s]>0)&&(
                    <div key={s} style={{ background:c+"12",border:`1px solid ${c}28`,borderRadius:8,padding:"8px 14px",textAlign:"center",minWidth:52 }}>
                      <div style={{ fontSize:20,fontWeight:800,color:c,lineHeight:1 }}>{counts[s]}</div>
                      <div style={{ fontSize:9,fontWeight:700,color:c,opacity:0.65,letterSpacing:"0.08em",marginTop:2 }}>{s}</div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Horizontal tabs */}
            <div style={{ display:"flex",gap:3,overflowX:"auto",position:"relative" }}>
              {dirTabs.map(dir=>{
                const dm=DIR_META[dir]||{label:dir,color:P.acc};
                const isA=activeTab===dir;
                const fc=(grouped[dir]||[]).filter(f=>f.status==="FAIL").length;
                const wc=(grouped[dir]||[]).filter(f=>f.status==="WARN").length;
                return(
                  <button key={dir} className={`tab-btn ${isA?"active":""}`} onClick={()=>setActiveTab(dir)} style={{
                    padding:"9px 16px", background:isA?P.card:"transparent",
                    border:`1px solid ${isA?dm.color+"50":P.b}`,
                    borderBottom:isA?`1px solid ${P.card}`:`1px solid ${P.b}`,
                    borderTopLeftRadius:8,borderTopRightRadius:8,borderBottomLeftRadius:0,borderBottomRightRadius:0,
                    color:isA?dm.color:P.dim, fontSize:12,fontWeight:700,whiteSpace:"nowrap",
                    display:"flex",alignItems:"center",gap:6,transition:"all 0.15s",position:"relative",bottom:-1,
                  }}>
                    {dm.label}
                    {fc>0&&<span style={{ fontSize:9,fontWeight:800,color:"#fff",background:"#ef4444",padding:"1px 5px",borderRadius:4 }}>{fc}F</span>}
                    {fc===0&&wc>0&&<span style={{ fontSize:9,fontWeight:800,color:"#78350f",background:"#fde68a",padding:"1px 5px",borderRadius:4 }}>{wc}W</span>}
                  </button>
                );
              })}
            </div>

            {/* Tab panel */}
            {activeDir&&(
              <div style={{ background:P.card,border:`1px solid ${P.b}`,borderRadius:"0 8px 12px 12px" }}>
                {/* Header */}
                <div style={{ padding:"16px 20px",borderBottom:`1px solid ${P.b}`,display:"grid",gridTemplateColumns:"auto 1fr auto",gap:"0 24px",alignItems:"start" }}>
                  <div>
                    <div style={{ fontSize:17,fontWeight:800,color:activeDir.color,letterSpacing:"-0.02em",marginBottom:2 }}>{activeDir.label}</div>
                    <div style={{ fontSize:11,color:P.sub }}>{activeDir.full}</div>
                    <div style={{ fontSize:10,color:P.dim,marginTop:1 }}>{activeDir.ref}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:9,fontWeight:700,color:P.dim,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:7 }}>Applicable Standards</div>
                    <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                      {activeDir.standards.map((s,i)=>(
                        <div key={i} style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <div style={{ width:3,height:3,borderRadius:"50%",background:activeDir.color,opacity:0.5,flexShrink:0 }}/>
                          <span style={{ fontSize:11,color:"#94a3b8",fontFamily:"monospace" }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:6 }}>
                    {["FAIL","WARN","PASS","INFO"].map(s=>{
                      const n=tabFindings.filter(f=>f.status===s).length;
                      const sc=SC[s];
                      return n>0&&(
                        <div key={s} style={{ background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:6,padding:"5px 10px",textAlign:"center" }}>
                          <div style={{ fontSize:16,fontWeight:800,color:sc.color,lineHeight:1 }}>{n}</div>
                          <div style={{ fontSize:8,fontWeight:700,color:sc.color,opacity:0.65,letterSpacing:"0.08em",marginTop:2 }}>{s}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Findings */}
                {tabFindings.map((f,idx)=>{
                  const sc=SC[f.status]||SC.INFO;
                  return(
                    <div key={f._i} className="finding-row" style={{ padding:"15px 20px",borderBottom:idx<tabFindings.length-1?`1px solid ${P.b}`:"none",display:"grid",gridTemplateColumns:"30px 1fr auto",gap:"0 14px",background:"transparent",transition:"background 0.12s" }}>
                      <div style={{ width:26,height:26,borderRadius:7,background:sc.bg,border:`1px solid ${sc.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:sc.color,marginTop:1 }}>{sc.icon}</div>
                      <div>
                        <div style={{ fontSize:12,fontWeight:700,color:"#cbd5e1",marginBottom:4,lineHeight:1.4 }}>{f.article}</div>
                        <div style={{ fontSize:12,color:P.sub,lineHeight:1.68 }}>{f.finding}</div>
                        {f.action&&(
                          <div style={{ marginTop:8,paddingLeft:12,borderLeft:`2px solid ${sc.color}35`,fontSize:12,color:P.dim,lineHeight:1.65 }}>
                            <span style={{ fontWeight:600,color:sc.color,opacity:0.85 }}>Action: </span>{f.action}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:9,fontWeight:800,color:sc.color,background:sc.bg,border:`1px solid ${sc.border}`,padding:"3px 8px",borderRadius:5,alignSelf:"start",letterSpacing:"0.07em",whiteSpace:"nowrap" }}>{f.status}</div>
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