import { useState, useEffect, useRef } from "react";
import { STANDARDS, STANDARD_TYPE_META } from "./standards";

// ─────────────────────────────────────────────────────────────────────────────
//  DETECTION UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function anyOf(text, keywords) {
  return keywords.some(k => text.includes(k));
}

// ─────────────────────────────────────────────────────────────────────────────
//  KEYWORD GROUPS  (v2)
// ─────────────────────────────────────────────────────────────────────────────

const KW = {
  WIFI: ["wifi","wi-fi","wi fi","wlan","wireless lan","802.11","802.11a","802.11b","802.11g","802.11n","802.11ac","802.11ax","802.11be","wifi 4","wifi 5","wifi 6","wifi 6e","wifi 7","2.4ghz","2.4 ghz","5ghz","5 ghz","6ghz","6 ghz","dual band","dual-band","tri band","tri-band","wireless network","access point","wireless router"],
  BLUETOOTH: ["bluetooth","ble","bluetooth le","bluetooth low energy","bluetooth smart"," bt ","bt5","bt4","bt 5","bt 4","bt 4.0","bt 4.1","bt 4.2","bt 5.0","bt 5.1","bt 5.2","bt 5.3","bluetooth 4","bluetooth 5"],
  ZIGBEE: ["zigbee","z-wave","zwave","thread","matter protocol","ieee 802.15","ieee 802.15.4","openthread","mesh network"],
  LORA: ["lora","lorawan","lora wan","lpwan","sigfox","868mhz","868 mhz","915mhz","915 mhz","433mhz","433 mhz","sub-ghz","sub ghz","low power wide area"],
  NFC: ["nfc","near field","near-field communication","rfid","uhf rfid","contactless"],
  CELLULAR: ["lte","4g ","5g ","nb-iot","nbiot","nb iot","cat-m","cat m","cat-m1","lte-m","emtc","cellular","cell modem","sim card","esim","e-sim","gsm","3gpp","umts","2g ","3g ","mobile network","mobile data"],
  RADIO_GENERIC: ["wireless","radio module","rf module","rf transmitter","rf receiver","radio frequency","radio communication","radio link","antenna","transceiver","radio-frequency","short range","srd"],

  MAINS: ["mains","mains power","mains powered","mains-powered","wall socket","wall outlet","wall plug","wall power","ac power","ac powered","ac supply","ac adapter","ac adaptor","230v","230 v","240v","240 v","220v","220 v","110v","110 v","120v","120 v","grid power","power grid","hardwired","hard-wired","psu","power supply unit","plug-in","mains plug","mains connected","mains-connected"],
  BATTERY: ["battery","batteries","rechargeable","rechargeable battery","li-ion","li ion","lithium ion","lithium-ion","lipo","li-po","lithium polymer","lithium-polymer","lifepo4","lifepo","lithium iron","alkaline","aa battery","aa batteries","aaa battery","aaa batteries","coin cell","button cell","cr2032","18650","battery pack","battery cell","battery powered","battery-powered","battery operated","3.7v","7.4v"],
  USB_POWER: ["usb power","usb powered","usb-powered","usb-c power","usb c power","5v usb","powered by usb","usb charging","usb charger","power bank","usb pd","usb power delivery"],
  POE: ["poe","power over ethernet","ieee 802.3af","ieee 802.3at"],

  // LVD: anything that implies an electrical product potentially within voltage scope
  LVD_VOLTAGE: ["50v","75v","100v","110v","115v","120v","127v","200v","208v","220v","230v","240v","277v","380v","400v","415v","480v","600v","690v","1000v","50 v","75 v","100 v","110 v","120 v","230 v","400 v","1000 v","ac power","ac supply","ac mains","mains voltage","line voltage","dc bus","dc link","dc supply","bus voltage","transformer","rectifier","inverter","converter","ups","uninterruptible","power supply","switching power supply","smps","switch mode","motor drive","vfd","variable frequency drive","servo drive","solar inverter","grid-tied","grid tied","en 60950","en 62368","en 60065","iec 62368","iec 60950","en 60335","iec 60335","en 61010","iec 61010","low voltage directive","lvd"],
  LVD_GENERAL: ["electrical","electric","electronics","electronic device","mains","hardwired","plug","socket","outlet","watt","watts","kilowatt","kw ","kva","ampere","amps","volt","volts","fuse","circuit breaker","mcb","rcd","gfci","pcb","printed circuit","circuit board","high voltage","hv ","insulation","dielectric","creepage","clearance","battery system","battery pack","battery module","battery bank","energy storage","ess ","bms","battery management","48v","72v","96v","144v","400v battery","800v battery","motor","heater","heating element","resistive heat","immersion","pump","compressor","hvac","fan motor"],

  EMC: ["electronic","electrical","pcb","circuit board","printed circuit","microcontroller","microprocessor","mcu","processor","cpu","fpga","dsp","sensor","actuator","motor","relay","solenoid","display","lcd","oled","led driver","backlight","power supply","smps","switch mode","buck","boost","flyback","usb","ethernet","rs232","rs485","can bus","spi","i2c","oscillator","crystal","clock signal","rf","radio","wireless","antenna","transmitter","receiver","emc","electromagnetic","interference","radiated emissions","conducted emissions","en 55032","cispr 32","cispr 35","en 55035","mains","battery","rechargeable"],

  EMF: ["emf","electromagnetic field","electromagnetic fields","magnetic field","electric field","rf exposure","sar","specific absorption","icnirp","2013/35/eu","directive 2013/35","induction","wireless charging","qi charging","magnetic induction","industrial magnet","mri","nmr","high power rf","radar","broadcast","base station","cell tower","occupational exposure","worker exposure"],

  SOFTWARE: ["software","firmware","embedded software","embedded firmware","application","app","mobile app","web app","web application","rtos","embedded linux","linux","freertos","zephyr","microcontroller","mcu","processor","microprocessor","digital","digital product","code","source code","sdk","library","framework","operating system"],
  OTA: ["ota","over-the-air","over the air","firmware update","firmware updates","software update","software updates","remote update","automatic update","auto update","fota"],
  CLOUD: ["cloud","cloud server","cloud platform","cloud service","cloud storage","server","remote server","backend server","api server","aws","amazon web services","azure","microsoft azure","google cloud","gcp","firebase","internet","internet connection","internet connected","online","connected device","iot","internet of things","iiot","mqtt","http","https","rest api","web service","hosted","hosting","saas"],
  NO_CLOUD: ["no cloud","no internet","no online","local only","offline","standalone","self-contained","no remote","fully offline","air-gapped","no connectivity","without internet","without cloud"],

  PERSONAL_DATA: ["personal data","personal information","personally identifiable","pii","user data","user information","user profile","account data","email","e-mail","name","full name","phone number","address","home address","date of birth","dob","customer data","stores data","collects data","data collection","data processing","processes data"],
  HEALTH_DATA: ["health data","health information","medical data","health record","heart rate","bpm","pulse","blood pressure","blood oxygen","spo2","ecg","ekg","sleep data","sleep tracking","stress level","body temperature","calories","calorie tracking","fitness data","glucose","blood glucose","weight","bmi"],
  LOCATION_DATA: ["location","location data","location tracking","gps","gnss","geolocation","geofence","geofencing","latitude","longitude","coordinates","tracking","real-time location","indoor positioning","maps","mapping"],
  BIOMETRIC: ["biometric","biometrics","biometric data","fingerprint","fingerprint scanner","face id","face recognition","facial recognition","iris scan","voice recognition","palm print","vein recognition"],
  BEHAVIORAL: ["behavior","behaviour","behavioural","behavioral","usage pattern","usage data","activity data","activity tracking","habits","consumption pattern","browsing history"],
  DATA_SHARING: ["share data","data sharing","third party","third-party","analytics provider","advertising","ad network","monetise","monetize","sell data","data broker"],
  DATA_RETENTION: ["store data","stores data","data storage","data retention","retention policy","log","logging","logs","audit log","history","archive","record"],

  AUTH: ["login","log in","sign in","password","passphrase","passcode","authentication","authenticate","user account","credentials","pin","pin code","mfa","2fa","two-factor","multi-factor","totp","oauth","sso","pairing","device pairing"],
  DEFAULT_PW: ["default password","default credentials","factory default password","preset password","same password","shared password","universal password","admin/admin","admin password","admin123","default login"],
  UNIQUE_PW: ["unique password","unique credentials","per-device","per device","device-specific","individual password","unique per device","device password","printed password","label password"],
  MFA: ["mfa","2fa","two-factor","multi-factor","totp","authenticator","one-time password","otp","sms code","email code","verification code"],
  LOCKOUT: ["lockout","account lock","rate limit","rate limiting","brute force","failed attempts","max attempts","temporary lock"],

  AI: ["artificial intelligence","ai ","ai-powered","ai powered"," ai,","(ai)","ai-based","machine learning","ml ","deep learning","neural network","llm","gpt","generative ai","computer vision","image recognition","object detection","natural language processing","nlp","recommendation engine","predictive","inference","on-device model","edge ai","tflite","tensorflow lite","onnx","classification model"],
  FACE_RECOG: ["face recognition","facial recognition","face id","face detection","face analysis","face tracking","facial analysis","face unlock","face authentication"],
  VOICE_AI: ["voice assistant","wake word","hotword","always listening","speech recognition","voice recognition","voice command","voice control","alexa","google assistant","siri","cortana","smart speaker","voice activated"],
  PROHIBITED_AI: ["social scoring","social credit","real-time biometric surveillance","subliminal manipulation","mass surveillance","emotion recognition public"],
  HIGH_RISK_AI: ["emotion recognition","emotion detection","automated decision","automated decision-making","autonomous decision","user scoring","scoring users","ranking users","credit scoring","insurance scoring","recruitment ai","hiring ai","law enforcement ai","biometric ai","educational ai","children's ai","ai for kids","adaptive learning ai"],

  REPAIRABILITY: ["repair","repairable","replaceable","user replaceable","spare part","spare parts","ifixit","right to repair","modular","serviceable","disassemble"],
  RECYCLING: ["recycled","recycling","recyclable","circular","circular economy","eol","end of life","end-of-life","take back","weee","electronic waste","e-waste"],
  ENERGY_LABEL: ["energy label","energy class","energy rating","energy efficiency class","a+++","a++","erp","ecodesign regulation","standby power","standby consumption","energy consumption","power consumption","watts"],
  SAFETY: ["safety function","safety critical","safety-critical","emergency stop","alarm","fire alarm","smoke alarm","co detector","carbon monoxide","smoke detector","fail safe","fail-safe","iec 61508","iec 62061","iso 13849"],
  HIGH_VOLTAGE: ["high voltage","hv ","400v","480v","600v","690v","1000v","motor drive","vfd","variable frequency drive","inverter","power inverter","igbt"],
  CONSUMER: ["consumer","consumers","end user","end users","end-user","end-users","household","households","residential","home use","personal use","private use","retail","retail product","general public","mass market","b2c","individual user","domestic","domestic use"],
};

// ─────────────────────────────────────────────────────────────────────────────
//  CHECKLIST QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: "what",
    label: "What does your product do?",
    example: '"A smart thermostat that controls home heating"',
    detect: t =>
      t.length > 60 && anyOf(t, ["device","product","system","sensor","monitor","tracker","controller","hub","gateway","camera","speaker","display","wearable","appliance","charger","meter","lock","alarm","thermostat","reader","scanner","detector","module","unit","gadget","hardware","machine","equipment","tool","instrument","panel","beacon","tag","actuator","pump","valve","light","bulb","switch","dimmer","plug","socket","router","modem","repeater","bridge","dongle","adapter","converter","transmitter","receiver","antenna","remote","keyboard","mouse","headset","headphones"]),
  },
  {
    id: "market",
    label: "Who uses it and where?",
    example: '"EU consumers at home" or "B2B industrial factory"',
    detect: t =>
      anyOf(t, [...KW.CONSUMER,"industrial","industry","b2b","professional","commercial","factory","warehouse","scada","plc","manufacturing","medical","healthcare","clinical","hospital","patient","child","children","kids","toy","school","education","student","eu","e.u.","eea","europe","european","european union","european economic area","member state","ce mark","ce marking","germany","france","italy","spain","netherlands","poland","belgium"]),
  },
  {
    id: "wireless",
    label: "Does it use wireless / radio?",
    example: '"WiFi 802.11ac" or "Bluetooth 5.0" or "No wireless"',
    detect: t =>
      anyOf(t, [...KW.WIFI,...KW.BLUETOOTH,...KW.ZIGBEE,...KW.LORA,...KW.NFC,...KW.CELLULAR,...KW.RADIO_GENERIC,"no wireless","no radio","no wifi","no bluetooth","wired only","ethernet only"]),
  },
  {
    id: "power",
    label: "How is it powered?",
    example: '"230V mains" or "3.7V Li-ion battery" or "USB-C 5V"',
    detect: t =>
      anyOf(t, [...KW.MAINS,...KW.BATTERY,...KW.USB_POWER,...KW.POE,"solar","solar powered","solar panel","energy harvesting","power","powered by","voltage","volt","volts"]),
  },
  {
    id: "data",
    label: "Does it collect personal data?",
    example: '"Stores user email and GPS location" or "No personal data"',
    detect: t =>
      anyOf(t, [...KW.PERSONAL_DATA,...KW.HEALTH_DATA,...KW.LOCATION_DATA,...KW.BIOMETRIC,"no personal data","no user data","no data collected","anonymous","anonymised","anonymized","no pii","privacy preserving"]),
  },
  {
    id: "cloud",
    label: "Does it connect to the internet?",
    example: '"AWS cloud in Ireland" or "Fully offline, no internet"',
    detect: t =>
      anyOf(t, [...KW.CLOUD,...KW.NO_CLOUD,"mobile app","smartphone app","ios app","android app","web interface","web dashboard","web portal","companion app","dashboard"]),
  },
  {
    id: "software",
    label: "Does it have software or firmware?",
    example: '"Embedded firmware with OTA updates" or "No software"',
    detect: t =>
      anyOf(t, [...KW.SOFTWARE,...KW.OTA,"no software","no firmware","purely mechanical","mechanical only"]),
  },
  {
    id: "login",
    label: "How do users log in?",
    example: '"Unique per-device password" or "OAuth2 + MFA" or "No login"',
    detect: t =>
      anyOf(t, [...KW.AUTH,...KW.MFA,...KW.DEFAULT_PW,...KW.UNIQUE_PW,"no login","no authentication","no password","no account","open access"]),
  },
  {
    id: "ai",
    label: "Does it use AI or machine learning?",
    example: '"On-device ML model" or "Cloud GPT" or "No AI features"',
    detect: t =>
      anyOf(t, [...KW.AI,...KW.FACE_RECOG,...KW.VOICE_AI,...KW.HIGH_RISK_AI,...KW.PROHIBITED_AI,"no ai","no ml","no machine learning","no artificial intelligence","rule-based"]),
  },
  {
    id: "safety",
    label: "Any physical safety concerns?",
    example: '"230V inside" or "Li-ion battery" or "No hazards"',
    detect: t =>
      anyOf(t, [...KW.HIGH_VOLTAGE,...KW.MAINS,...KW.BATTERY,...KW.SAFETY,"high temperature","hot surface","burn hazard","chemical","toxic","hazardous","flammable","ip67","ip68","ip65","waterproof","no safety","no hazard","low voltage","safe voltage"]),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  DIRECTIVE DETECTION  (v2 — priority ordered)
// ─────────────────────────────────────────────────────────────────────────────

// Physical safety first, then cyber/data/AI
const DIRECTIVE_ORDER = ["LVD","EMC","EMF","RED","GDPR","CRA","AI_Act","ESPR"];

function detectDirectives(text) {
  const t = text.toLowerCase();
  const result = new Set();

  // 1. LVD — Low Voltage Directive
  // Applies to electrical equipment 50–1000V AC or 75–1500V DC.
  // Catch: explicit voltage, mains/AC, power conversion, high-voltage battery systems
  const hasExplicitElectrical =
    anyOf(t, KW.MAINS) ||
    anyOf(t, KW.LVD_VOLTAGE) ||
    anyOf(t, KW.HIGH_VOLTAGE) ||
    anyOf(t, KW.POE);

  const hasBatterySystem =
    anyOf(t, KW.BATTERY) &&
    anyOf(t, ["48v","72v","96v","144v","400v","800v","battery system","battery pack","battery module","battery bank","energy storage","bms","battery management","ebike","e-bike","ev ","electric vehicle"]);

  if (hasExplicitElectrical || hasBatterySystem) result.add("LVD");

  // 2. EMC — Electromagnetic Compatibility Directive
  // Virtually all electronic/electrical apparatus
  if (
    anyOf(t, KW.EMC) ||
    anyOf(t, KW.WIFI) || anyOf(t, KW.BLUETOOTH) ||
    anyOf(t, KW.ZIGBEE) || anyOf(t, KW.CELLULAR) ||
    anyOf(t, KW.MAINS) || anyOf(t, KW.BATTERY) ||
    anyOf(t, KW.SOFTWARE) ||
    anyOf(t, KW.LVD_GENERAL)
  ) result.add("EMC");

  // 3. EMF — Electromagnetic Fields Directive (2013/35/EU)
  if (anyOf(t, KW.EMF)) result.add("EMF");

  // 4. RED — Radio Equipment Directive
  if (
    anyOf(t, KW.WIFI) || anyOf(t, KW.BLUETOOTH) ||
    anyOf(t, KW.ZIGBEE) || anyOf(t, KW.LORA) ||
    anyOf(t, KW.NFC) || anyOf(t, KW.CELLULAR) ||
    anyOf(t, KW.RADIO_GENERIC)
  ) result.add("RED");

  // 5. GDPR
  if (
    anyOf(t, KW.PERSONAL_DATA) || anyOf(t, KW.HEALTH_DATA) ||
    anyOf(t, KW.LOCATION_DATA) || anyOf(t, KW.BIOMETRIC) ||
    anyOf(t, KW.BEHAVIORAL) || anyOf(t, KW.DATA_SHARING) ||
    anyOf(t, KW.DATA_RETENTION) ||
    anyOf(t, ["privacy","gdpr","data protection","consent","dpia","data controller"])
  ) result.add("GDPR");

  // 6. CRA — Cyber Resilience Act
  if (
    anyOf(t, KW.SOFTWARE) || anyOf(t, KW.OTA) ||
    anyOf(t, KW.CLOUD) || anyOf(t, KW.WIFI) ||
    anyOf(t, KW.BLUETOOTH) || anyOf(t, KW.CELLULAR) ||
    anyOf(t, ["internet","connected","network","ethernet","tcp","mqtt","http","https","usb","api","digital","processor","microcontroller","mcu"])
  ) result.add("CRA");

  // 7. AI Act
  if (
    anyOf(t, KW.AI) || anyOf(t, KW.FACE_RECOG) ||
    anyOf(t, KW.VOICE_AI) || anyOf(t, KW.HIGH_RISK_AI) ||
    anyOf(t, KW.PROHIBITED_AI)
  ) result.add("AI_Act");

  // 8. ESPR
  if (
    anyOf(t, KW.REPAIRABILITY) || anyOf(t, KW.RECYCLING) ||
    anyOf(t, KW.ENERGY_LABEL) || anyOf(t, KW.OTA) ||
    anyOf(t, ["ecodesign","sustainability","sustainable","carbon footprint","carbon neutral","digital product passport","dpp","durability","lifespan","lifetime","material","recyclability","repairability index","spare parts availability"])
  ) result.add("ESPR");

  // Fallback
  if (result.size === 0 && text.trim().length > 30) {
    result.add("CRA");
    result.add("EMC");
  }

  return DIRECTIVE_ORDER.filter(d => result.has(d));
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DIR_META = {
  LVD:    { label: "LVD",    full: "Low Voltage Directive",              color: "#f97316", icon: "⚡" },
  EMC:    { label: "EMC",    full: "EMC Directive",                      color: "#d97706", icon: "📡" },
  EMF:    { label: "EMF",    full: "Electromagnetic Fields Directive",   color: "#db2777", icon: "🌐" },
  RED:    { label: "RED",    full: "Radio Equipment Directive",          color: "#2563eb", icon: "📶" },
  GDPR:   { label: "GDPR",   full: "General Data Protection Regulation", color: "#059669", icon: "🔒" },
  CRA:    { label: "CRA",    full: "Cyber Resilience Act",               color: "#7c3aed", icon: "🛡" },
  AI_Act: { label: "AI Act", full: "Artificial Intelligence Act",        color: "#4f46e5", icon: "🤖" },
  ESPR:   { label: "ESPR",   full: "Ecodesign for Sustainable Products", color: "#16a34a", icon: "🌱" },
};

const STATUS_CFG = {
  FAIL: { icon: "✕", color: "#ef4444", bg: "#fff1f2", border: "#fecaca", text: "#be123c" },
  WARN: { icon: "!",  color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  PASS: { icon: "✓", color: "#10b981", bg: "#f0fdf4", border: "#a7f3d0", text: "#065f46" },
  INFO: { icon: "i",  color: "#6366f1", bg: "#f5f3ff", border: "#c4b5fd", text: "#4338ca" },
};

const RISK_CFG = {
  CRITICAL: { color: "#be123c", bg: "#fff1f2", glow: "rgba(190,18,60,0.12)" },
  HIGH:     { color: "#c2410c", bg: "#fff7ed", glow: "rgba(194,65,12,0.12)" },
  MEDIUM:   { color: "#92400e", bg: "#fffbeb", glow: "rgba(146,64,14,0.10)" },
  LOW:      { color: "#065f46", bg: "#f0fdf4", glow: "rgba(6,95,70,0.10)"   },
};

// ─────────────────────────────────────────────────────────────────────────────
//  APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [desc,      setDesc]      = useState("");
  const [depth,     setDepth]     = useState("standard");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [activeTab,    setActiveTab]    = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("findings"); // "findings" | "standards"
  const textareaRef = useRef(null);

  const t        = desc.toLowerCase();
  const detected = detectDirectives(desc);
  const answered  = QUESTIONS.map(q => ({ ...q, done: q.detect(t) }));
  const doneCount = answered.filter(q => q.done).length;
  const progress  = Math.round((doneCount / QUESTIONS.length) * 100);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.max(300, textareaRef.current.scrollHeight) + "px";
    }
  }, [desc]);

  const goHome = () => { setResult(null); setError(null); setLoading(false); setActiveTab(null); };
  const goEdit = () => { setResult(null); setError(null); setActiveTab(null); };

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
      const firstTab = DIRECTIVE_ORDER.find(d => g[d]) || Object.keys(g)[0] || null;
      setActiveTab(firstTab);
      setActiveSubTab("findings");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const groupFindings = (findings) =>
    findings.reduce((acc, f, i) => {
      if (!acc[f.directive]) acc[f.directive] = [];
      acc[f.directive].push({ ...f, _i: i });
      return acc;
    }, {});

  const grouped     = result ? groupFindings(result.findings) : {};
  const dirTabs     = DIRECTIVE_ORDER.filter(d => grouped[d]);
  const counts      = result ? result.findings.reduce((a, f) => { a[f.status] = (a[f.status]||0)+1; return a; }, {}) : {};
  const tabFindings = (activeTab && grouped[activeTab]) ? grouped[activeTab] : [];
  const riskCfg     = result ? (RISK_CFG[result.overall_risk] || RISK_CFG.LOW) : null;
  const canRun      = !loading && desc.trim().length >= 20;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Sora', sans-serif", fontSize: 14, color: "#0f172a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f8fafc}
        textarea,button,input{font-family:'Sora',sans-serif}
        button{cursor:pointer;border:none;outline:none}
        textarea{outline:none;border:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.75}}
        @keyframes popIn{0%{transform:scale(0.85);opacity:0}100%{transform:scale(1);opacity:1}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
        .home-link{cursor:pointer;transition:opacity 0.15s;display:flex;align-items:center;gap:10px}
        .home-link:hover{opacity:0.72}
        .run-btn{background:linear-gradient(135deg,#1e40af 0%,#4f46e5 100%);transition:all 0.2s;box-shadow:0 4px 14px rgba(79,70,229,0.28)}
        .run-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(79,70,229,0.38)}
        .run-btn:active:not(:disabled){transform:translateY(0)}
        .run-btn:disabled{background:#e5e7eb;box-shadow:none}
        .depth-btn{transition:all 0.15s}
        .depth-btn:hover{border-color:#818cf8!important}
        .dir-tab{transition:all 0.15s;cursor:pointer;border:none;background:transparent}
        .dir-tab:hover:not(.dir-tab-active){background:#f1f5f9!important}
        .finding-row{transition:background 0.1s}
        .finding-row:hover{background:#fafafa!important}
        .q-row{transition:background 0.1s}
        .q-row:hover{background:#f8fafc!important}
        .edit-btn{transition:all 0.15s;cursor:pointer}
        .edit-btn:hover{background:#eff6ff!important;border-color:#93c5fd!important;color:#1d4ed8!important}
        .textarea-shell:focus-within{border-color:#818cf8!important;box-shadow:0 0 0 3px rgba(129,140,248,0.15)!important}
        .dir-pill{animation:popIn 0.2s ease;display:inline-flex;align-items:center;gap:4px}
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ background:"rgba(255,255,255,0.92)", backdropFilter:"blur(14px)", borderBottom:"1px solid #e5e7eb", padding:"0 32px", position:"sticky", top:0, zIndex:200 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", height:58, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div className="home-link" onClick={goHome}>
            <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#1e40af 0%,#4f46e5 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:800, color:"#fff", boxShadow:"0 2px 8px rgba(79,70,229,0.32)" }}>R</div>
            <span style={{ fontWeight:800, fontSize:16.5, color:"#0f172a", letterSpacing:"-0.03em" }}>
              Rule<span style={{ color:"#4f46e5" }}>Grid</span><span style={{ color:"#94a3b8", fontWeight:400, fontSize:13 }}>.net</span>
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {result && (
              <button className="edit-btn" onClick={goEdit} style={{ fontSize:13, fontWeight:600, color:"#4f46e5", padding:"7px 16px", borderRadius:8, border:"1.5px solid #c7d2fe", background:"#f5f3ff", display:"flex", alignItems:"center", gap:6 }}>
                ✏️ Edit description
              </button>
            )}
            <span style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:"0.08em", textTransform:"uppercase" }}>EU Compliance</span>
          </div>
        </div>
      </nav>

      {/* ── INPUT VIEW ── */}
      {!result && !loading && (
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"40px 32px 100px", animation:"fadeUp 0.35s ease" }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:20, padding:"4px 13px", marginBottom:14 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#3b82f6" }} />
              <span style={{ fontSize:11.5, fontWeight:700, color:"#1d4ed8", letterSpacing:"0.05em" }}>BETA · FREE TO USE</span>
            </div>
            <h1 style={{ fontSize:28, fontWeight:800, color:"#0f172a", letterSpacing:"-0.035em", lineHeight:1.25, marginBottom:10 }}>
              Check your product's EU compliance<br />
              <span style={{ color:"#4f46e5" }}>in seconds.</span>
            </h1>
            <p style={{ fontSize:14.5, color:"#64748b", lineHeight:1.7, maxWidth:530 }}>
              Describe your product below. The guide on the right helps you cover every topic — applicable directives appear automatically as you type.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 316px", gap:20, alignItems:"start" }}>
            {/* Textarea */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div className="textarea-shell" style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, overflow:"hidden", transition:"border-color 0.2s,box-shadow 0.2s", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>
                <textarea
                  ref={textareaRef}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder={"Describe your product here — use the checklist on the right.\n\nExample:\n\"A smart home water leak detector for EU consumers. It uses WiFi 802.11n to connect to our AWS cloud server in Ireland. Embedded firmware with OTA support. Powered by two AA batteries — no mains voltage. Stores only device ID and alert timestamps, no personal data. No AI features.\""}
                  style={{ width:"100%", background:"transparent", color:"#0f172a", fontSize:14.5, lineHeight:1.85, padding:"22px 24px", minHeight:300, resize:"none", display:"block", fontWeight:400 }}
                />
                {/* Directive strip */}
                <div style={{ padding:"10px 24px 14px", borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                  <span style={{ fontSize:11.5, color:"#cbd5e1", fontWeight:500 }}>{desc.length} chars</span>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
                    {detected.length === 0
                      ? <span style={{ fontSize:12, color:"#cbd5e1", fontStyle:"italic" }}>Directives appear here as you type…</span>
                      : detected.map(id => {
                          const d = DIR_META[id] || { label:id, color:"#6366f1", icon:"" };
                          return (
                            <span key={id} className="dir-pill" style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:6, color:"#fff", background:d.color, letterSpacing:"0.03em" }}>
                              {d.icon} {d.label}
                            </span>
                          );
                        })
                    }
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ fontSize:11.5, color:"#94a3b8", fontWeight:700, letterSpacing:"0.06em" }}>DEPTH</span>
                {[{v:"standard",label:"Standard"},{v:"deep",label:"Deep audit"}].map(d => (
                  <button key={d.v} className="depth-btn" onClick={() => setDepth(d.v)} style={{ fontSize:13, fontWeight:500, padding:"7px 15px", borderRadius:8, border:`1.5px solid ${depth===d.v?"#818cf8":"#e2e8f0"}`, background:depth===d.v?"#f5f3ff":"#fff", color:depth===d.v?"#4338ca":"#64748b" }}>{d.label}</button>
                ))}
                <button className="run-btn" onClick={run} disabled={!canRun} style={{ marginLeft:"auto", fontSize:14, fontWeight:700, padding:"10px 28px", borderRadius:10, color:canRun?"#fff":"#94a3b8", display:"flex", alignItems:"center", gap:8, letterSpacing:"-0.01em" }}>
                  {loading
                    ? <><div style={{ width:13, height:13, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />Analysing…</>
                    : <>Run analysis <span style={{ opacity:0.75 }}>→</span></>
                  }
                </button>
              </div>

              {error && (
                <div style={{ background:"#fff1f2", border:"1.5px solid #fecaca", borderRadius:10, padding:"14px 18px", display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ color:"#ef4444", flexShrink:0, fontSize:16 }}>⚠</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#be123c", marginBottom:4 }}>Could not reach backend</div>
                    <div style={{ fontSize:12, color:"#ef4444", lineHeight:1.6, marginBottom:8 }}>{error}</div>
                    <code style={{ fontSize:12, color:"#7c3aed", background:"#f5f3ff", padding:"3px 10px", borderRadius:5 }}>uvicorn main:app --reload</code>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, overflow:"hidden", position:"sticky", top:70, boxShadow:"0 1px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ padding:"16px 20px 14px", borderBottom:"1px solid #f1f5f9", background:"linear-gradient(135deg,#f8faff 0%,#fefcff 100%)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", letterSpacing:"-0.01em" }}>Coverage guide</div>
                  <div style={{ fontSize:12, fontWeight:700, padding:"3px 11px", borderRadius:20, background:progress>=80?"#f0fdf4":progress>=50?"#fffbeb":"#fff1f2", color:progress>=80?"#065f46":progress>=50?"#92400e":"#be123c", border:`1.5px solid ${progress>=80?"#a7f3d0":progress>=50?"#fde68a":"#fecaca"}`, transition:"all 0.3s" }}>
                    {doneCount} / {QUESTIONS.length}
                  </div>
                </div>
                <div style={{ height:6, background:"#f1f5f9", borderRadius:10, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:10, width:`${progress}%`, background:progress>=80?"linear-gradient(90deg,#10b981,#34d399)":progress>=50?"linear-gradient(90deg,#f59e0b,#fbbf24)":"linear-gradient(90deg,#ef4444,#f87171)", transition:"width 0.4s ease,background 0.3s" }} />
                </div>
              </div>

              {answered.map((q,i) => (
                <div key={q.id} className="q-row" style={{ padding:"12px 20px", display:"flex", gap:12, alignItems:"flex-start", background:"#fff", borderBottom:i<answered.length-1?"1px solid #f8fafc":"none" }}>
                  <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, marginTop:1, background:q.done?"linear-gradient(135deg,#10b981,#34d399)":"#fff", border:q.done?"none":"2px solid #d1d5db", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.22s ease", boxShadow:q.done?"0 2px 6px rgba(16,185,129,0.28)":"none" }}>
                    {q.done && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1.5 4.5L4 7L9.5 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:q.done?400:500, color:q.done?"#94a3b8":"#1e293b", textDecoration:q.done?"line-through":"none", lineHeight:1.45, transition:"color 0.22s" }}>{q.label}</div>
                    {!q.done && <div style={{ marginTop:3, fontSize:11.5, color:"#cbd5e1", lineHeight:1.5, fontStyle:"italic" }}>{q.example}</div>}
                  </div>
                </div>
              ))}

              <div style={{ padding:"12px 20px", borderTop:"1px solid #f1f5f9", background:"#fafafa" }}>
                {progress===100
                  ? <span style={{ fontSize:12.5, color:"#065f46", fontWeight:600 }}>✓ All topics covered!</span>
                  : <span style={{ fontSize:12, color:"#94a3b8" }}>{QUESTIONS.length-doneCount} topic{QUESTIONS.length-doneCount!==1?"s":""} remaining for best results</span>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"48px 32px", animation:"fadeUp 0.3s ease" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, color:"#64748b", fontSize:13.5, fontWeight:500, marginBottom:28 }}>
            <div style={{ width:15, height:15, border:"2.5px solid #e2e8f0", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.65s linear infinite" }} />
            Checking {detected.length} directive{detected.length!==1?"s":""}…
          </div>
          {[72,55,88,61,78].map((w,i) => (
            <div key={i} style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"22px 24px", marginBottom:12, animation:`shimmer 1.8s ease ${i*0.14}s infinite` }}>
              <div style={{ height:12, background:"linear-gradient(90deg,#f1f5f9,#e8edf2)", borderRadius:6, width:`${w*0.32}%`, marginBottom:16 }} />
              <div style={{ height:10, background:"#f8fafc", borderRadius:5, width:`${w}%`, marginBottom:8 }} />
              <div style={{ height:10, background:"#f8fafc", borderRadius:5, width:`${w*0.6}%` }} />
            </div>
          ))}
        </div>
      )}

      {/* ── RESULTS ── */}
      {result && (
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 32px 100px", animation:"fadeUp 0.35s ease" }}>

          {/* Edit bar */}
          <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:12, padding:"13px 20px", marginBottom:16, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:"0.06em", flexShrink:0 }}>DESCRIPTION</div>
            <div style={{ flex:1, fontSize:13.5, color:"#475569", fontStyle:"italic", lineHeight:1.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", minWidth:0 }}>
              "{desc.length>120?desc.slice(0,120)+"…":desc}"
            </div>
            <button className="edit-btn" onClick={goEdit} style={{ fontSize:13, fontWeight:600, color:"#4f46e5", padding:"7px 16px", borderRadius:8, border:"1.5px solid #c7d2fe", background:"#f5f3ff", flexShrink:0, display:"flex", alignItems:"center", gap:6 }}>
              ✏️ Edit
            </button>
          </div>

          {/* Risk banner */}
          <div style={{ background:riskCfg.bg, border:`1.5px solid ${riskCfg.color}28`, borderLeft:`4px solid ${riskCfg.color}`, borderRadius:14, padding:"22px 28px", marginBottom:20, display:"flex", gap:24, alignItems:"flex-start", flexWrap:"wrap", boxShadow:`0 4px 20px ${riskCfg.glow}` }}>
            <div style={{ flexShrink:0 }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Overall risk</div>
              <div style={{ fontSize:32, fontWeight:800, color:riskCfg.color, letterSpacing:"-0.04em", lineHeight:1 }}>{result.overall_risk}</div>
            </div>
            <div style={{ width:1, background:"#e2e8f0", alignSelf:"stretch" }} />
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:7 }}>Summary</div>
              <div style={{ fontSize:13.5, color:"#374151", lineHeight:1.75 }}>{result.summary}</div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignSelf:"center" }}>
              {["FAIL","WARN","PASS","INFO"].map(s => {
                const n = counts[s]||0;
                if (!n) return null;
                const sc = STATUS_CFG[s];
                return (
                  <div key={s} style={{ background:"#fff", border:`1.5px solid ${sc.border}`, borderRadius:10, padding:"9px 15px", textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:sc.text, lineHeight:1 }}>{n}</div>
                    <div style={{ fontSize:9.5, fontWeight:700, color:sc.text, opacity:0.7, letterSpacing:"0.08em", marginTop:3 }}>{s}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:3, overflowX:"auto", paddingBottom:1 }}>
            {dirTabs.map(dir => {
              const dm  = DIR_META[dir]||{label:dir,color:"#6366f1",icon:""};
              const isA = activeTab===dir;
              const fc  = (grouped[dir]||[]).filter(f=>f.status==="FAIL").length;
              const wc  = (grouped[dir]||[]).filter(f=>f.status==="WARN").length;
              return (
                <button key={dir} className={`dir-tab${isA?" dir-tab-active":""}`} onClick={()=>setActiveTab(dir)} style={{ padding:"10px 18px", background:isA?"#fff":"transparent", border:`1.5px solid ${isA?"#e2e8f0":"transparent"}`, borderBottom:isA?"1.5px solid #fff":"1.5px solid transparent", borderRadius:"10px 10px 0 0", color:isA?"#0f172a":"#64748b", fontSize:13, fontWeight:isA?700:500, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:7, position:"relative", bottom:-2 }}>
                  {isA&&<span style={{ width:8, height:8, borderRadius:"50%", background:dm.color, flexShrink:0, boxShadow:`0 0 0 3px ${dm.color}25` }} />}
                  <span style={{ fontSize:14 }}>{dm.icon}</span>
                  {dm.label}
                  {fc>0&&<span style={{ fontSize:9.5, fontWeight:800, color:"#fff", background:"#ef4444", padding:"1px 6px", borderRadius:5 }}>{fc}F</span>}
                  {fc===0&&wc>0&&<span style={{ fontSize:9.5, fontWeight:800, color:"#92400e", background:"#fef9c3", padding:"1px 6px", borderRadius:5 }}>{wc}W</span>}
                </button>
              );
            })}
          </div>

          {/* Tab panel */}
          {activeTab&&DIR_META[activeTab]&&(
            <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:"0 12px 14px 14px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>

              {/* Panel header */}
              <div style={{ padding:"18px 24px 0", background:"linear-gradient(135deg,#fafafa 0%,#fff 100%)", borderBottom:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:17, fontWeight:700, color:"#0f172a", letterSpacing:"-0.02em" }}>{DIR_META[activeTab].icon} {DIR_META[activeTab].full}</div>
                    <div style={{ fontSize:12, color:"#94a3b8", marginTop:3, fontWeight:500 }}>{DIR_META[activeTab].label} · {tabFindings.length} finding{tabFindings.length!==1?"s":""}</div>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {["FAIL","WARN","PASS","INFO"].map(s=>{
                      const n=tabFindings.filter(f=>f.status===s).length;
                      if(!n)return null;
                      const sc=STATUS_CFG[s];
                      return <div key={s} style={{ background:sc.bg, border:`1.5px solid ${sc.border}`, borderRadius:9, padding:"6px 12px", textAlign:"center" }}><div style={{ fontSize:18, fontWeight:800, color:sc.text, lineHeight:1 }}>{n}</div><div style={{ fontSize:9, fontWeight:700, color:sc.text, opacity:0.6, letterSpacing:"0.08em", marginTop:2 }}>{s}</div></div>;
                    })}
                  </div>
                </div>

                {/* Sub-tabs: Findings | Standards */}
                <div style={{ display:"flex", gap:2 }}>
                  {[
                    { key:"findings",  label:"Findings",  icon:"🔍" },
                    { key:"standards", label:`Applicable Standards ${(STANDARDS[activeTab]||[]).length > 0 ? `(${(STANDARDS[activeTab]||[]).length})` : ""}`, icon:"📋" },
                  ].map(st=>{
                    const isA=activeSubTab===st.key;
                    return (
                      <button key={st.key} onClick={()=>setActiveSubTab(st.key)} style={{
                        fontSize:12.5, fontWeight:isA?700:500, padding:"8px 16px",
                        background:isA?"#fff":"transparent",
                        border:`1px solid ${isA?"#e2e8f0":"transparent"}`,
                        borderBottom:isA?"1px solid #fff":"none",
                        borderRadius:"8px 8px 0 0",
                        color:isA?"#0f172a":"#64748b",
                        cursor:"pointer",
                        position:"relative", bottom:-1,
                        display:"flex", alignItems:"center", gap:5,
                        transition:"all 0.15s",
                      }}>
                        <span>{st.icon}</span> {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── FINDINGS sub-tab ── */}
              {activeSubTab==="findings"&&tabFindings.map((f,idx)=>{
                const sc=STATUS_CFG[f.status]||STATUS_CFG.INFO;
                return (
                  <div key={f._i} className="finding-row" style={{ padding:"18px 24px", borderBottom:idx<tabFindings.length-1?"1px solid #f3f4f6":"none", display:"grid", gridTemplateColumns:"30px 1fr auto", gap:"0 16px", background:"#fff" }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:sc.bg, border:`1.5px solid ${sc.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:sc.text, flexShrink:0, marginTop:2 }}>{sc.icon}</div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:600, color:"#a1a1aa", marginBottom:6, lineHeight:1.4, fontFamily:"'SF Mono','Fira Code',monospace", letterSpacing:"0.01em" }}>{f.article}</div>
                      <div style={{ fontSize:14, color:"#374151", lineHeight:1.75 }}>{f.finding}</div>
                      {f.action&&(
                        <div style={{ marginTop:11, paddingLeft:14, borderLeft:`2px solid ${sc.color}45`, fontSize:13.5, color:"#6b7280", lineHeight:1.7 }}>
                          <span style={{ fontWeight:700, color:sc.text }}>Action: </span>{f.action}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize:10, fontWeight:800, color:sc.text, background:sc.bg, border:`1.5px solid ${sc.border}`, padding:"3px 9px", borderRadius:6, alignSelf:"start", whiteSpace:"nowrap", letterSpacing:"0.07em" }}>{f.status}</div>
                  </div>
                );
              })}

              {/* ── STANDARDS sub-tab ── */}
              {activeSubTab==="standards"&&(()=>{
                const stds = STANDARDS[activeTab] || [];
                if (stds.length === 0) return (
                  <div style={{ padding:"40px 24px", textAlign:"center", color:"#94a3b8", fontSize:13.5 }}>
                    No standards listed yet for {DIR_META[activeTab].label}.<br/>
                    <span style={{ fontSize:12, color:"#cbd5e1" }}>Add entries to standards.js → STANDARDS.{activeTab}</span>
                  </div>
                );
                // Group by type: harmonised first, then supporting, then guidance
                const order = ["harmonised","supporting","guidance"];
                const grouped_s = order.reduce((acc, type) => {
                  const items = stds.filter(s => s.type === type);
                  if (items.length) acc.push({ type, items });
                  return acc;
                }, []);
                return (
                  <div>
                    {/* Legend */}
                    <div style={{ padding:"14px 24px 10px", borderBottom:"1px solid #f8fafc", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:11.5, color:"#94a3b8", fontWeight:600, letterSpacing:"0.04em" }}>TYPE:</span>
                      {order.map(type=>{
                        const m=STANDARD_TYPE_META[type];
                        return (
                          <span key={type} style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:5, color:m.color, background:m.bg, border:`1px solid ${m.border}` }} title={m.tooltip}>
                            {m.label}
                          </span>
                        );
                      })}
                      <span style={{ fontSize:11, color:"#cbd5e1", marginLeft:"auto" }}>{stds.length} standard{stds.length!==1?"s":""}</span>
                    </div>

                    {grouped_s.map(({ type, items }) => {
                      const m = STANDARD_TYPE_META[type];
                      return (
                        <div key={type}>
                          {/* Group header */}
                          <div style={{ padding:"10px 24px 8px", background:"#fafafa", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:5, color:m.color, background:m.bg, border:`1px solid ${m.border}` }}>{m.label}</span>
                            <span style={{ fontSize:11.5, color:"#94a3b8", fontWeight:500 }}>{m.tooltip}</span>
                          </div>
                          {/* Standard rows */}
                          {items.map((s, si) => (
                            <div key={s.id} className="finding-row" style={{ padding:"16px 24px", borderBottom:si<items.length-1?"1px solid #f8fafc":"none", background:"#fff" }}>
                              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                                <div style={{ flex:1, minWidth:0 }}>
                                  {/* Standard number */}
                                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                                    <span style={{ fontSize:12.5, fontWeight:700, color:"#0f172a", fontFamily:"'SF Mono','Fira Code',monospace", letterSpacing:"0.01em", background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:5, padding:"2px 8px", whiteSpace:"nowrap" }}>
                                      {s.number}
                                    </span>
                                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:5, color:m.color, background:m.bg, border:`1px solid ${m.border}` }}>
                                      {m.label}
                                    </span>
                                  </div>
                                  {/* Title */}
                                  <div style={{ fontSize:14, fontWeight:600, color:"#1e293b", lineHeight:1.4, marginBottom:5 }}>{s.title}</div>
                                  {/* Scope */}
                                  <div style={{ fontSize:13, color:"#6b7280", lineHeight:1.7 }}>{s.scope}</div>
                                </div>
                                {/* Link */}
                                {s.url && (
                                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, fontWeight:600, color:"#4f46e5", background:"#f5f3ff", border:"1px solid #c4b5fd", borderRadius:7, padding:"5px 13px", textDecoration:"none", whiteSpace:"nowrap", flexShrink:0, transition:"all 0.15s" }}>
                                    View ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}