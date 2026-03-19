import React, { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const QUESTIONS = [
  {
    id: "what", number: "01", label: "What does your product do?",
    example: 'e.g. "Smart thermostat" or "Industrial water sensor"',
    detect: t => t.length > 60 && /\b(device|product|system|sensor|monitor|tracker|controller|hub|gateway|camera|speaker|display|wearable|appliance|charger|meter|lock|alarm|thermostat|reader|scanner|detector|module|unit|kit|tool|machine)\b/i.test(t),
  },
  {
    id: "market", number: "02", label: "Who buys it and where is it used?",
    example: 'e.g. "EU consumers" or "B2B factories"',
    detect: t => /\b(consumer|residential|household|home|personal|retail|industrial|b2b|factory|medical|clinical|hospital|professional|children|kids|patient|office|commercial|business|enterprise)\b/i.test(t),
  },
  {
    id: "wireless", number: "03", label: "Does it use wireless / radio?",
    example: 'e.g. "WiFi 802.11ac", "Bluetooth 5.0", or "No wireless"',
    detect: t => /wifi|wi-fi|bluetooth|ble|\blte\b|4g |5g |zigbee|nfc|lora|cellular|gsm|nb-iot|wireless|radio|rf |thread|matter|z-wave|no wireless|no radio/i.test(t),
  },
  {
    id: "power", number: "04", label: "How is it powered?",
    example: 'e.g. "230V mains", "3.7V Li-ion", or "USB-C"',
    detect: t => /230v|220v|110v|mains|li-ion|lithium|battery|usb.c|usb power|poe|rechargeable|hardwired|power supply|alkaline|battery powered|coin cell|aa battery/i.test(t),
  },
  {
    id: "data", number: "05", label: "Does it collect personal data?",
    example: 'e.g. "Stores user email and GPS" or "No personal data"',
    detect: t => /personal data|user data|email|location|gps|health|biometric|account|profile|login|password|tracking|camera|microphone|face|voice|no personal data|no user data|anonymi/i.test(t),
  },
  {
    id: "cloud", number: "06", label: "Connects to internet or cloud?",
    example: 'e.g. "AWS cloud" or "Fully offline"',
    detect: t => /cloud|server|aws|azure|google cloud|backend|api |internet|online|local only|no cloud|offline|standalone|no internet|self.hosted/i.test(t),
  },
  {
    id: "software", number: "07", label: "Does it have software / firmware?",
    example: 'e.g. "Embedded firmware with OTA" or "Purely mechanical"',
    detect: t => /firmware|software|ota|over-the-air|embedded|mobile app|companion app|rtos|linux|update|microcontroller|android|ios app|web app|no software|purely mechanical/i.test(t),
  },
  {
    id: "login", number: "08", label: "How do users log in?",
    example: 'e.g. "OAuth2 with MFA" or "No login needed"',
    detect: t => /password|login|credential|authentication|mfa|2fa|oauth|pairing|pin code|default password|unique password|passphrase|no login|no authentication|ble pairing/i.test(t),
  },
  {
    id: "ai", number: "09", label: "Uses AI or machine learning?",
    example: 'e.g. "On-device ML" or "No AI features"',
    detect: t => /\bai\b|machine learning|\bml\b|neural|inference|llm|computer vision|voice assistant|recommendation|automated decision|deep learning|no ai|no ml|no machine learning/i.test(t),
  },
  {
    id: "safety", number: "10", label: "Physical safety concerns?",
    example: 'e.g. "Contains Li-ion", "230V mains", or "No hazards"',
    detect: t => /high voltage|mains|li-ion|lithium|motor|heating|thermal|ip[0-9][0-9]|waterproof|fire|smoke|alarm|safety function|fail.safe|no safety|no hazard|battery cell/i.test(t),
  },
];

const DIR_META = {
  RED:    { label: "RED",    full: "Radio Equipment Directive",           color: "text-blue-400", border: "border-blue-400/30", bg: "bg-blue-400/10", ref: "2014/53/EU" },
  CRA:    { label: "CRA",    full: "Cyber Resilience Act",                color: "text-fuchsia-400", border: "border-fuchsia-400/30", bg: "bg-fuchsia-400/10", ref: "(EU) 2024/2847" },
  GDPR:   { label: "GDPR",   full: "General Data Protection Regulation",  color: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-400/10", ref: "(EU) 2016/679" },
  AI_Act: { label: "AI Act", full: "Artificial Intelligence Act",         color: "text-violet-400", border: "border-violet-400/30", bg: "bg-violet-400/10", ref: "(EU) 2024/1689" },
  LVD:    { label: "LVD",    full: "Low Voltage Directive",               color: "text-orange-400", border: "border-orange-400/30", bg: "bg-orange-400/10", ref: "2014/35/EU" },
  EMC:    { label: "EMC",    full: "EMC Directive",                       color: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-400/10", ref: "2014/30/EU" },
  ESPR:   { label: "ESPR",   full: "Ecodesign for Sustainable Products",  color: "text-green-300", border: "border-green-300/30", bg: "bg-green-300/10", ref: "(EU) 2024/1781" },
};

const STATUS_CFG = {
  FAIL: { icon: "✕", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  WARN: { icon: "!", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  PASS: { icon: "✓", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  INFO: { icon: "i", color: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

const RISK_CFG = {
  CRITICAL: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  HIGH:     { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  MEDIUM:   { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  LOW:      { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function detectDirectives(text) {
  const t = text.toLowerCase();
  const has = (kws) => kws.some(k => t.includes(k));
  const r = [];

  if (has(["wifi","wi-fi","wlan","802.11","2.4ghz","5ghz","6ghz","bluetooth","ble"," bt5"," bt4","zigbee","z-wave","thread","matter","ieee 802.15","lora","lorawan","868mhz","915mhz","lpwan","nfc","near field","rfid","lte","4g ","5g ","nb-iot","cat-m","cellular","gsm","3gpp","radio","rf module","rf transmit","wireless transmit","sub-ghz"])) r.push("RED");
  if (has(["software","firmware","embedded","microcontroller","microprocessor","raspberry","arduino","esp32","app ","mobile app","web app","cloud","server","api","backend","internet","online","iot","connected","ota","over-the-air","remote update","firmware update","digital","processor","mcu","network","ethernet","tcp","mqtt","http","usb","uart","i2c","spi"])) r.push("CRA");
  if (has(["personal data","user data","email","location","gps","health","biometric","account","login","password","tracking","camera","microphone","face recognition","voice recognition","analytics","telemetry","store data","logging","third party","share data","privacy","consent","user account","photo","image capture"])) r.push("GDPR");
  if (has(["artificial intelligence","machine learning","deep learning"," ai ","ai-powered","ai based","ai model"," ml ","ml model","neural network","llm","large language model","computer vision","image recognition","voice assistant","wake word","speech recognition","nlp","natural language","recommendation","automated decision","predictive","inference","classifier","chatbot"])) r.push("AI_Act");
  if (has(["230v","220v","110v","120v","240v","mains","ac power","wall plug","hardwired","power supply","mains-powered","grid-powered","plug-in","li-ion","lithium ion","lipo","li-po","lithium polymer","high capacity battery","18650","21700","battery pack","bms","high voltage","motor drive","inverter","poe","power over ethernet","48v","rechargeable battery"])) r.push("LVD");
  if (has(["electronic","electrical","pcb","circuit board","sensor","actuator","motor","relay","microcontroller","microprocessor","processor","mcu","power supply","battery","usb","230v","mains","wifi","bluetooth","radio","wireless","display","lcd","oled","led driver","pwm","oscillator"])) r.push("EMC");
  if (has(["repair","repairable","replaceable part","spare part","right to repair","recycled","recyclable","recycling","circular","end of life","eol","take-back","sustainability","sustainable","carbon footprint","energy label","energy class","erp","ecodesign","dpp","digital product passport","durability","longevity","standby power","energy consumption"])) r.push("ESPR");

  if (r.length === 0 && text.trim().length > 30) { r.push("CRA"); r.push("EMC"); }
  return r;
}

// Fallback data if the free-tier Render API is sleeping/fails.
const MOCK_FALLBACK = {
  overall_risk: "HIGH",
  summary: "API is unreachable (likely cold start). Displaying mock analysis. Your product indicates significant wireless and cybersecurity implications requiring regulatory action.",
  findings: [
    { directive: "RED", article: "Article 3.1(a) Health & Safety", finding: "Device emits RF energy. An RF exposure assessment is mandatory to ensure user safety limits are not exceeded.", status: "WARN", action: "Perform calculations per EN 62311 or EN 50665." },
    { directive: "RED", article: "Article 3.2 Radio Spectrum", finding: "Product uses wireless transmission. It must demonstrate efficient use of the radio spectrum without harmful interference.", status: "INFO", action: "Test against relevant ETSI EN 300 series standards." },
    { directive: "CRA", article: "Annex I - Security Requirements", finding: "Product incorporates software/firmware. It must be designed with secure-by-default configurations and vulnerability handling.", status: "FAIL", action: "Implement secure boot, encrypted storage, and establish a coordinated vulnerability disclosure policy." },
    { directive: "CRA", article: "Article 10 - Reporting", finding: "Manufacturers must report actively exploited vulnerabilities to ENISA within 24 hours.", status: "WARN", action: "Establish an incident response plan and reporting pipeline." },
    { directive: "GDPR", article: "Article 25 - Data Protection by Design", finding: "Product collects personal data. Data minimization and pseudonymisation should be integrated into the architecture.", status: "WARN", action: "Document a Data Protection Impact Assessment (DPIA)." }
  ]
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  const [desc, setDesc] = useState("");
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const textareaRef = useRef(null);

  const detected = detectDirectives(desc);
  const answered = QUESTIONS.map(q => ({ ...q, done: q.detect(desc) }));
  const doneCount = answered.filter(q => q.done).length;
  const progress = Math.round((doneCount / QUESTIONS.length) * 100);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(300, textareaRef.current.scrollHeight)}px`;
    }
  }, [desc]);

  const runAnalysis = async () => {
    if (desc.trim().length < 20) return;
    setLoading(true);
    setResult(null);
    
    try {
      const r = await fetch("https://regcheck-api.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: detected, depth }),
      });
      if (!r.ok) throw new Error("Server error");
      const data = await r.json();
      setResult(data);
    } catch (e) {
      console.warn("Backend unavailable, using fallback mock data.");
      // Render free tier often times out. Use mock data to ensure UI remains functional.
      setTimeout(() => setResult(MOCK_FALLBACK), 800); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-sky-500/30">
      
      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-100">
              RuleGrid<span className="text-sky-400 font-normal">.net</span>
            </span>
          </div>
          <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            EU Compliance Tool
          </span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {!result && !loading && (
          <InputView 
            desc={desc} 
            setDesc={setDesc} 
            textareaRef={textareaRef} 
            depth={depth} 
            setDepth={setDepth} 
            runAnalysis={runAnalysis}
            detected={detected}
            answered={answered}
            progress={progress}
            doneCount={doneCount}
          />
        )}

        {loading && <LoadingView detected={detected} />}

        {result && <ResultView result={result} reset={() => setResult(null)} />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function InputView({ desc, setDesc, textareaRef, depth, setDepth, runAnalysis, detected, answered, progress, doneCount }) {
  const isReady = desc.trim().length >= 20;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* LEFT: Editor */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-2">
            Define your product architecture.
          </h1>
          <p className="text-slate-400 text-sm">
            Describe your product technically. The engine will parse the description to identify applicable EU regulatory frameworks.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/50 transition-all">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="text-xs font-medium text-slate-500 ml-2">architecture_spec.txt</span>
            </div>
            <div className="text-xs font-mono text-slate-500">{desc.length} chars</div>
          </div>

          <textarea
            ref={textareaRef}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder={`Example input:\n\nA smart home water leak detector using WiFi 802.11n to connect to our AWS cloud server (EU-West). It runs embedded firmware with OTA update support. EU consumers use it at home. It stores device ID and alert history (no personal data). Powered by two AA batteries. No AI features. No mains voltage inside.`}
            className="w-full bg-transparent border-none text-slate-200 text-sm leading-relaxed p-5 min-h-[300px] font-mono resize-none focus:outline-none focus:ring-0"
            spellCheck="false"
          />

          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex flex-wrap gap-2 items-center min-h-[48px]">
            {detected.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Directives will map automatically...</span>
            ) : (
              detected.map(id => {
                const d = DIR_META[id];
                return (
                  <span key={id} className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded border uppercase ${d.color} ${d.bg} ${d.border}`}>
                    {d.label}
                  </span>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
            {[
              { id: "standard", label: "Standard Assessment" },
              { id: "deep", label: "Deep Audit" },
            ].map(d => (
              <button
                key={d.id}
                onClick={() => setDepth(d.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  depth === d.id 
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-400" 
                    : "bg-transparent border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <button
            onClick={runAnalysis}
            disabled={!isReady}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              isReady 
                ? "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(14,165,233,0.3)]" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            Run Analysis
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>

      {/* RIGHT: Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl self-start sticky top-20 flex flex-col max-h-[calc(100vh-120px)]">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Coverage Guide</h3>
            <p className="text-xs text-slate-500 mt-1">{doneCount} of {QUESTIONS.length} parameters defined</p>
          </div>
          {/* Progress Indicator */}
          <div className="w-10 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500 ease-out"
              style={{ 
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#10b981' : progress > 50 ? '#f59e0b' : '#38bdf8' 
              }} 
            />
          </div>
        </div>

        <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {answered.map((q) => (
            <div key={q.id} className={`p-3 rounded-lg flex gap-3 transition-colors ${q.done ? 'opacity-50' : 'hover:bg-slate-800/50'}`}>
              <div className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                q.done ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-slate-700 text-transparent'
              }`}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${q.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                  {q.label}
                </p>
                {!q.done && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {q.example}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingView({ detected }) {
  return (
    <div className="max-w-3xl mx-auto py-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 text-sm text-slate-400 font-medium mb-8">
        <svg className="animate-spin h-5 w-5 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Assessing against {detected.length || 'applicable'} EU directives...
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-slate-800/50 to-transparent" />
            <div className="h-4 w-1/4 bg-slate-800 rounded mb-4" />
            <div className="h-3 w-full bg-slate-800/50 rounded mb-2" />
            <div className="h-3 w-5/6 bg-slate-800/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultView({ result, reset }) {
  const risk = RISK_CFG[result.overall_risk] || RISK_CFG.LOW;

  // Group findings by directive
  const grouped = result.findings.reduce((acc, f) => {
    if (!acc[f.directive]) acc[f.directive] = [];
    acc[f.directive].push(f);
    return acc;
  }, {});

  // Tally overall statuses
  const counts = result.findings.reduce((a, f) => { 
    a[f.status] = (a[f.status] || 0) + 1; 
    return a; 
  }, {});

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-6">
      
      {/* Overview Card */}
      <div className={`border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center ${risk.bg} ${risk.border}`}>
        <div className="shrink-0">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Overall Risk</div>
          <div className={`text-4xl font-black tracking-tight ${risk.color}`}>{result.overall_risk}</div>
        </div>
        
        <div className="w-px h-16 bg-slate-800 hidden md:block" />
        
        <div className="flex-1">
          <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
        </div>

        <div className="flex gap-2 shrink-0">
          {["FAIL", "WARN", "PASS", "INFO"].map(s => {
            const n = counts[s];
            if (!n) return null;
            const sc = STATUS_CFG[s];
            return (
              <div key={s} className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border ${sc.bg} ${sc.border}`}>
                <span className={`text-xl font-bold leading-none ${sc.color}`}>{n}</span>
                <span className={`text-[9px] font-bold uppercase mt-1 opacity-70 ${sc.color}`}>{s}</span>
              </div>
            );
          })}
        </div>

        <button 
          onClick={reset}
          className="shrink-0 p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
          title="Edit Description"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"/></svg>
        </button>
      </div>

      {/* Unified List of Directives */}
      <div className="space-y-8 mt-10">
        {Object.entries(grouped).map(([dirKey, findings]) => {
          const meta = DIR_META[dirKey] || { label: dirKey, full: "Regulatory Requirement", color: "text-slate-300", border: "border-slate-700", bg: "bg-slate-800" };
          
          return (
            <div key={dirKey} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {/* Directive Header */}
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <div>
                  <h2 className={`text-lg font-bold flex items-center gap-2 ${meta.color}`}>
                    {meta.label} <span className="text-slate-500 font-normal text-sm">· {meta.full}</span>
                  </h2>
                  <div className="text-xs text-slate-500 font-mono mt-1">Ref: {meta.ref}</div>
                </div>
              </div>

              {/* Findings */}
              <div className="divide-y divide-slate-800/50">
                {findings.map((f, i) => {
                  const sc = STATUS_CFG[f.status] || STATUS_CFG.INFO;
                  return (
                    <div key={i} className="p-6 grid grid-cols-[auto_1fr] gap-4 hover:bg-slate-800/20 transition-colors">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${sc.bg} ${sc.border} ${sc.color}`}>
                        {sc.icon === "✕" ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : sc.icon === "✓" ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        ) : sc.icon === "!" ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        ) : (
                          <span className="text-sm font-bold">i</span>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-xs font-mono font-semibold text-slate-400">{f.article}</code>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${sc.color} ${sc.bg} ${sc.border}`}>
                            {f.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed mb-3">
                          {f.finding}
                        </p>
                        
                        {f.action && (
                          <div className={`text-sm pl-3 border-l-2 py-0.5 ${sc.border}`}>
                            <span className={`font-semibold ${sc.color}`}>Action Required: </span>
                            <span className="text-slate-400">{f.action}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}