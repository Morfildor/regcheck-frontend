import { useState, useEffect, useRef } from "react";

const QUESTIONS = [
  {
    id: "what",
    label: "What does your product do?",
    example: '"A smart thermostat that controls home heating"',
    detect: t => t.length > 60 && /\b(device|product|system|sensor|monitor|tracker|controller|hub|gateway|camera|speaker|display|wearable|appliance|charger|meter|lock|alarm|thermostat|reader|scanner|detector|module|unit)\b/i.test(t),
  },
  {
    id: "market",
    label: "Who uses it and where?",
    example: '"EU consumers at home" or "B2B industrial factory"',
    detect: t => /\b(consumer|residential|household|home|personal|retail|industrial|b2b|factory|medical|clinical|hospital|professional|children|kids|patient|office)\b/i.test(t),
  },
  {
    id: "wireless",
    label: "Does it use wireless / radio?",
    example: '"WiFi 802.11ac" or "Bluetooth 5.0" or "No wireless"',
    detect: t => /wifi|wi-fi|bluetooth|ble|\blte\b|4g |5g |zigbee|nfc|lora|cellular|gsm|nb-iot|wireless|radio|rf |thread|matter|no wireless|no radio/i.test(t),
  },
  {
    id: "power",
    label: "How is it powered?",
    example: '"230V mains" or "3.7V Li-ion battery" or "USB-C 5V"',
    detect: t => /230v|220v|110v|mains|li-ion|lithium|battery|usb.c|usb power|poe|rechargeable|hardwired|power supply|alkaline|coin cell|aa battery/i.test(t),
  },
  {
    id: "data",
    label: "Does it collect personal data?",
    example: '"Stores user email and GPS location" or "No personal data"',
    detect: t => /personal data|user data|email|location|gps|health|biometric|account|profile|login|password|tracking|camera|microphone|face|voice|no personal data|no user data/i.test(t),
  },
  {
    id: "cloud",
    label: "Does it connect to the internet?",
    example: '"AWS cloud in Ireland" or "Fully offline, no internet"',
    detect: t => /cloud|server|aws|azure|google cloud|backend|api |internet|online|local only|no cloud|offline|standalone|no internet/i.test(t),
  },
  {
    id: "software",
    label: "Does it have software or firmware?",
    example: '"Embedded firmware with OTA updates" or "No software"',
    detect: t => /firmware|software|ota|over-the-air|embedded|mobile app|companion app|rtos|linux|update|microcontroller|android|ios app|no software|purely mechanical/i.test(t),
  },
  {
    id: "login",
    label: "How do users log in?",
    example: '"Unique per-device password" or "OAuth2 + MFA" or "No login"',
    detect: t => /password|login|credential|authentication|mfa|2fa|oauth|pairing|pin code|default password|unique password|no login|no authentication/i.test(t),
  },
  {
    id: "ai",
    label: "Does it use AI or machine learning?",
    example: '"On-device ML model" or "Cloud GPT" or "No AI features"',
    detect: t => /\bai\b|machine learning|\bml\b|neural|inference|llm|computer vision|voice assistant|recommendation|automated decision|no ai|no ml/i.test(t),
  },
  {
    id: "safety",
    label: "Any physical safety concerns?",
    example: '"Contains Li-ion battery" or "230V inside" or "No hazards"',
    detect: t => /high voltage|mains|li-ion|lithium|motor|heating|thermal|ip[0-9][0-9]|waterproof|fire|smoke|safety function|fail.safe|no safety|no hazard|battery cell/i.test(t),
  },
];

function detectDirectives(text) {
  const t = text.toLowerCase();
  const has = (kws) => kws.some(k => t.includes(k));
  const r = [];
  if (has(["wifi","wi-fi","wlan","802.11","bluetooth","ble","zigbee","z-wave","thread","matter","lora","lorawan","nfc","near field","rfid","lte","4g ","5g ","nb-iot","cat-m","cellular","gsm","radio","rf module","wireless transmit"])) r.push("RED");
  if (has(["software","firmware","embedded","microcontroller","microprocessor","app ","mobile app","web app","cloud","server","api","backend","internet","online","iot","connected","ota","over-the-air","remote update","digital","processor","mcu","network","ethernet","tcp","mqtt","http","usb"])) r.push("CRA");
  if (has(["personal data","user data","email","location","gps","health","biometric","account","login","password","tracking","camera","microphone","face recognition","voice recognition","analytics","telemetry","store data","logging","third party","privacy","consent"])) r.push("GDPR");
  if (has(["artificial intelligence","machine learning","deep learning"," ai ","ai-powered"," ml ","neural network","llm","computer vision","voice assistant","recommendation","automated decision","predictive","inference","classifier","chatbot"])) r.push("AI_Act");
  if (has(["230v","220v","110v","120v","mains","ac power","wall plug","hardwired","power supply","mains-powered","li-ion","lithium ion","lipo","lithium polymer","battery pack","bms","high voltage","motor drive","inverter","poe","rechargeable battery"])) r.push("LVD");
  if (has(["electronic","electrical","pcb","circuit board","sensor","actuator","motor","relay","microcontroller","microprocessor","power supply","battery","usb","230v","mains","wifi","bluetooth","radio","wireless","display","lcd","oled","led driver"])) r.push("EMC");
  if (has(["repair","repairable","replaceable part","spare part","right to repair","recycled","recyclable","circular","end of life","sustainability","sustainable","carbon footprint","energy label","ecodesign","digital product passport","durability","standby power","energy consumption"])) r.push("ESPR");
  if (r.length === 0 && text.trim().length > 30) { r.push("CRA"); r.push("EMC"); }
  return r;
}

const DIR_META = {
  RED:    { label: "RED",    full: "Radio Equipment Directive",          color: "#3b82f6" },
  CRA:    { label: "CRA",    full: "Cyber Resilience Act",               color: "#a855f7" },
  GDPR:   { label: "GDPR",   full: "General Data Protection Regulation", color: "#10b981" },
  AI_Act: { label: "AI Act", full: "Artificial Intelligence Act",        color: "#8b5cf6" },
  LVD:    { label: "LVD",    full: "Low Voltage Directive",              color: "#f97316" },
  EMC:    { label: "EMC",    full: "EMC Directive",                      color: "#eab308" },
  ESPR:   { label: "ESPR",   full: "Ecodesign for Sustainable Products", color: "#22c55e" },
};

const STATUS_CFG = {
  FAIL: { icon: "✕", color: "#ef4444", bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
  WARN: { icon: "!",  color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  PASS: { icon: "✓", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  INFO: { icon: "i",  color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
};

const RISK_CFG = {
  CRITICAL: { color: "#ef4444", border: "#ef4444" },
  HIGH:     { color: "#f97316", border: "#f97316" },
  MEDIUM:   { color: "#f59e0b", border: "#f59e0b" },
  LOW:      { color: "#22c55e", border: "#22c55e" },
};

export default function App() {
  const [desc,      setDesc]      = useState("");
  const [depth,     setDepth]     = useState("standard");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const textareaRef = useRef(null);

  const detected  = detectDirectives(desc);
  const answered  = QUESTIONS.map(q => ({ ...q, done: q.detect(desc) }));
  const doneCount = answered.filter(q => q.done).length;
  const progress  = Math.round((doneCount / QUESTIONS.length) * 100);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.max(280, textareaRef.current.scrollHeight) + "px";
    }
  }, [desc]);

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

  const grouped     = result ? groupFindings(result.findings) : {};
  const dirTabs     = Object.keys(grouped);
  const counts      = result ? result.findings.reduce((a, f) => { a[f.status] = (a[f.status]||0)+1; return a; }, {}) : {};
  const tabFindings = (activeTab && grouped[activeTab]) ? grouped[activeTab] : [];
  const riskCfg     = result ? (RISK_CFG[result.overall_risk] || RISK_CFG.LOW) : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: 14,
      color: "#0f172a",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f8fafc}
        textarea,button{font-family:inherit}
        button{cursor:pointer;border:none;outline:none}
        textarea{outline:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.45}50%{opacity:.8}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
        .q-row{transition:background 0.12s}
        .q-row:hover{background:#f8fafc !important}
        .dir-tab{transition:all 0.15s;cursor:pointer}
        .dir-tab:hover:not(.atab){background:#f1f5f9 !important}
        .run-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(29,78,216,0.2)!important}
        .run-btn{transition:all 0.18s}
        .finding-row:hover{background:#fafafa !important}
        .finding-row{transition:background 0.1s}
        .depth-btn{transition:all 0.15s}
        .depth-btn:hover{border-color:#93c5fd !important}
        textarea:focus-visible{outline:none}
        .textarea-wrap:focus-within{border-color:#93c5fd !important;box-shadow:0 0 0 3px rgba(147,197,253,0.2) !important}
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 28px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: "#1e40af",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>R</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", letterSpacing: "-0.02em" }}>
              RuleGrid<span style={{ color: "#3b82f6", fontWeight: 400 }}>.net</span>
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>EU Compliance Checker</span>
        </div>
      </nav>

      {/* ─────────────────── INPUT VIEW ─────────────────── */}
      {!result && !loading && (
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px 80px", animation: "fadeUp 0.3s ease" }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              Describe your product, check EU compliance
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65, marginTop: 6 }}>
              Write a description on the left. The checklist on the right guides you — each topic ticks off automatically as you cover it.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 324px", gap: 20, alignItems: "start" }}>

            {/* ── textarea + controls ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div className="textarea-wrap" style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}>
                <textarea
                  ref={textareaRef}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder={`Describe your product here — use the checklist on the right as your guide.

Example:
"A smart home water leak detector for EU consumers. It uses WiFi 802.11n to connect to our AWS cloud server in Ireland. It has embedded firmware with OTA update support. Powered by two AA batteries — no mains voltage inside. It only stores device ID and alert history, no personal data. No AI features."`}
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    color: "#0f172a", fontSize: 14, lineHeight: 1.8,
                    padding: "20px 22px", minHeight: 280,
                    fontFamily: "inherit", resize: "none", outline: "none",
                  }}
                />

                {/* Bottom strip: char count + detected directives */}
                <div style={{
                  padding: "10px 22px 14px",
                  borderTop: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}>
                  <span style={{ fontSize: 12, color: "#cbd5e1" }}>{desc.length} chars</span>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {detected.length === 0
                      ? <span style={{ fontSize: 12, color: "#cbd5e1", fontStyle: "italic" }}>Directives appear here as you type…</span>
                      : detected.map(id => {
                          const d = DIR_META[id];
                          return (
                            <span key={id} style={{
                              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 5,
                              color: "#fff", background: d.color,
                            }}>{d.label}</span>
                          );
                        })
                    }
                  </div>
                </div>
              </div>

              {/* Controls row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Depth:</span>
                {[
                  { v: "standard", label: "Standard" },
                  { v: "deep",     label: "Deep audit" },
                ].map(d => (
                  <button key={d.v} className="depth-btn" onClick={() => setDepth(d.v)} style={{
                    fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: 8,
                    border: `1.5px solid ${depth === d.v ? "#3b82f6" : "#e2e8f0"}`,
                    background: depth === d.v ? "#eff6ff" : "#fff",
                    color: depth === d.v ? "#1d4ed8" : "#64748b",
                  }}>{d.label}</button>
                ))}

                <button
                  className="run-btn"
                  onClick={run}
                  disabled={loading || desc.trim().length < 20}
                  style={{
                    marginLeft: "auto",
                    background: desc.trim().length < 20 ? "#f1f5f9" : "#1d4ed8",
                    color: desc.trim().length < 20 ? "#94a3b8" : "#fff",
                    fontSize: 14, fontWeight: 600, padding: "9px 24px",
                    borderRadius: 9,
                    boxShadow: desc.trim().length >= 20 ? "0 4px 14px rgba(29,78,216,0.18)" : "none",
                    display: "flex", alignItems: "center", gap: 8,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {loading
                    ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />Analysing…</>
                    : "Run analysis →"
                  }
                </button>
              </div>

              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                  padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start",
                }}>
                  <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#b91c1c", marginBottom: 4 }}>Could not reach backend</div>
                    <div style={{ fontSize: 12, color: "#ef4444", lineHeight: 1.6, marginBottom: 8 }}>{error}</div>
                    <code style={{ fontSize: 12, color: "#7c3aed", background: "#f5f3ff", padding: "3px 10px", borderRadius: 5 }}>
                      uvicorn main:app --reload
                    </code>
                  </div>
                </div>
              )}
            </div>

            {/* ── CHECKLIST ── */}
            <div style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
              position: "sticky",
              top: 68,
            }}>

              {/* Header */}
              <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                    Coverage guide
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: progress >= 80 ? "#f0fdf4" : progress >= 50 ? "#fffbeb" : "#fef2f2",
                    color: progress >= 80 ? "#15803d" : progress >= 50 ? "#b45309" : "#b91c1c",
                    border: `1px solid ${progress >= 80 ? "#bbf7d0" : progress >= 50 ? "#fde68a" : "#fecaca"}`,
                    transition: "all 0.3s",
                  }}>
                    {doneCount}/{QUESTIONS.length}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 10,
                    width: `${progress}%`,
                    background: progress >= 80 ? "#22c55e" : progress >= 50 ? "#f59e0b" : "#ef4444",
                    transition: "width 0.4s ease, background 0.3s",
                  }} />
                </div>
              </div>

              {/* Question rows */}
              <div>
                {answered.map((q, i) => (
                  <div
                    key={q.id}
                    className="q-row"
                    style={{
                      padding: "13px 20px",
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      background: "#fff",
                      borderBottom: i < answered.length - 1 ? "1px solid #f8fafc" : "none",
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 22, height: 22,
                      borderRadius: 6,
                      flexShrink: 0,
                      marginTop: 1,
                      background: q.done ? "#22c55e" : "#fff",
                      border: q.done ? "2px solid #22c55e" : "2px solid #d1d5db",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.22s ease",
                    }}>
                      {q.done && (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1.5 4.5L4 7L9.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    {/* Label + hint */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13.5,
                        fontWeight: q.done ? 400 : 500,
                        color: q.done ? "#94a3b8" : "#1e293b",
                        textDecoration: q.done ? "line-through" : "none",
                        lineHeight: 1.4,
                        transition: "color 0.22s, font-weight 0.22s",
                      }}>
                        {q.label}
                      </div>

                      {!q.done && (
                        <div style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: "#94a3b8",
                          lineHeight: 1.55,
                          fontStyle: "italic",
                        }}>
                          {q.example}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                padding: "12px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fafafa",
              }}>
                {progress === 100 ? (
                  <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                    ✓ All topics covered — great detail!
                  </span>
                ) : (
                  <span style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>
                    {QUESTIONS.length - doneCount} topic{QUESTIONS.length - doneCount !== 1 ? "s" : ""} remaining for best results
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── LOADING ─────────────────── */}
      {loading && (
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13, marginBottom: 24 }}>
            <div style={{ width: 14, height: 14, border: "2px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
            Checking {detected.length} directive{detected.length !== 1 ? "s" : ""}…
          </div>
          {[75, 55, 85, 60].map((w, i) => (
            <div key={i} style={{
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
              padding: "20px 22px", marginBottom: 12,
              animation: `pulse 1.6s ease ${i * 0.16}s infinite`,
            }}>
              <div style={{ height: 12, background: "#f1f5f9", borderRadius: 4, width: `${w * 0.35}%`, marginBottom: 14 }} />
              <div style={{ height: 10, background: "#f8fafc", borderRadius: 4, width: `${w}%`, marginBottom: 8 }} />
              <div style={{ height: 10, background: "#f8fafc", borderRadius: 4, width: `${w * 0.65}%` }} />
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────── RESULTS ─────────────────── */}
      {result && (
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px 80px", animation: "fadeUp 0.3s ease" }}>

          {/* Risk banner */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderLeft: `4px solid ${riskCfg.color}`,
            borderRadius: 12, padding: "20px 24px", marginBottom: 20,
            display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                Overall risk
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: riskCfg.color, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {result.overall_risk}
              </div>
            </div>

            <div style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch" }} />

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Summary
              </div>
              <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7 }}>{result.summary}</div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["FAIL", "WARN", "PASS", "INFO"].map(s => {
                const n = counts[s] || 0;
                if (!n) return null;
                const sc = STATUS_CFG[s];
                return (
                  <div key={s} style={{
                    background: sc.bg, border: `1px solid ${sc.border}`,
                    borderRadius: 10, padding: "8px 14px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: sc.text, lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: sc.text, opacity: 0.7, letterSpacing: "0.06em", marginTop: 3 }}>{s}</div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => { setResult(null); setError(null); }} style={{
              background: "#fff", border: "1px solid #e2e8f0", color: "#64748b",
              fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8,
              alignSelf: "center", transition: "all 0.15s",
            }}>← Edit description</button>
          </div>

          {/* Directive tabs */}
          <div style={{ display: "flex", gap: 3, overflowX: "auto" }}>
            {dirTabs.map(dir => {
              const dm  = DIR_META[dir] || { label: dir, color: "#3b82f6" };
              const isA = activeTab === dir;
              const fc  = (grouped[dir] || []).filter(f => f.status === "FAIL").length;
              const wc  = (grouped[dir] || []).filter(f => f.status === "WARN").length;
              return (
                <button key={dir} className={`dir-tab${isA ? " atab" : ""}`} onClick={() => setActiveTab(dir)} style={{
                  padding: "9px 16px",
                  background: isA ? "#fff" : "transparent",
                  border: `1px solid ${isA ? "#e2e8f0" : "transparent"}`,
                  borderBottom: isA ? "1px solid #fff" : "1px solid transparent",
                  borderRadius: "8px 8px 0 0",
                  color: isA ? "#0f172a" : "#64748b",
                  fontSize: 13, fontWeight: isA ? 600 : 500,
                  whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 7,
                  position: "relative", bottom: -1,
                }}>
                  {isA && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dm.color, flexShrink: 0 }} />}
                  {dm.label}
                  {fc > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#ef4444", padding: "1px 5px", borderRadius: 4 }}>{fc}F</span>}
                  {fc === 0 && wc > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309", background: "#fef9c3", padding: "1px 5px", borderRadius: 4 }}>{wc}W</span>}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab && DIR_META[activeTab] && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0 8px 12px 12px", overflow: "hidden" }}>

              {/* Panel header */}
              <div style={{
                padding: "16px 22px", borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{DIR_META[activeTab].full}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{DIR_META[activeTab].label}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["FAIL", "WARN", "PASS", "INFO"].map(s => {
                    const n = tabFindings.filter(f => f.status === s).length;
                    if (!n) return null;
                    const sc = STATUS_CFG[s];
                    return (
                      <div key={s} style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, padding: "5px 11px", textAlign: "center" }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: sc.text, lineHeight: 1 }}>{n}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: sc.text, opacity: 0.6, letterSpacing: "0.06em", marginTop: 2 }}>{s}</div>
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
                    padding: "16px 22px",
                    borderBottom: idx < tabFindings.length - 1 ? "1px solid #f8fafc" : "none",
                    display: "grid", gridTemplateColumns: "32px 1fr auto", gap: "0 14px",
                    background: "#fff",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: sc.text, flexShrink: 0, marginTop: 2,
                    }}>{sc.icon}</div>

                    <div>
                      <div style={{
                        fontSize: 11.5, fontWeight: 600, color: "#94a3b8", marginBottom: 5, lineHeight: 1.4,
                        fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
                      }}>{f.article}</div>
                      <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.72 }}>{f.finding}</div>
                      {f.action && (
                        <div style={{
                          marginTop: 10, paddingLeft: 14,
                          borderLeft: `2px solid ${sc.color}60`,
                          fontSize: 13, color: "#6b7280", lineHeight: 1.68,
                        }}>
                          <span style={{ fontWeight: 600, color: sc.text }}>Action: </span>
                          {f.action}
                        </div>
                      )}
                    </div>

                    <div style={{
                      fontSize: 10, fontWeight: 700, color: sc.text,
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      padding: "3px 8px", borderRadius: 5, alignSelf: "start", whiteSpace: "nowrap", letterSpacing: "0.06em",
                    }}>{f.status}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}