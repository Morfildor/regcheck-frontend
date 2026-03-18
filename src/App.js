import { useState } from "react";

// ── Legislation metadata ───────────────────────────────────────────────────
const LEGISLATION = [
  {
    id: "RED",
    label: "RED",
    full: "Radio Equipment Directive",
    ref: "2014/53/EU",
    color: "#60a5fa",
    standards: [
      "ETSI EN 303 645",
      "EN 18031-1",
      "EN 18031-2",
      "EN 18031-3",
      "ETSI EN 301 489-1",
      "ETSI EN 301 489-17",
      "ETSI EN 300 328",
      "Del. Reg. (EU) 2022/30",
    ],
    docs: [
      "Threat model",
      "Security architecture",
      "SBOM",
      "Vulnerability disclosure policy",
      "Test reports (EN 303 645)",
      "DoC referencing Del. Reg.",
    ],
  },
  {
    id: "CRA",
    label: "CRA",
    full: "Cyber Resilience Act",
    ref: "2024/2847",
    color: "#f472b6",
    standards: [
      "ETSI EN 303 645",
      "IEC 62443 series",
      "NIST CSF 2.0",
      "ISO/IEC 27001",
      "SPDX / CycloneDX (SBOM)",
      "ENISA reporting process",
    ],
    docs: [
      "SBOM (machine-readable)",
      "Vulnerability handling policy",
      "CVD programme",
      "5-year update commitment",
      "Technical file (Annex VII)",
      "EU Declaration of Conformity",
    ],
  },
  {
    id: "AI_Act",
    label: "AI Act",
    full: "Artificial Intelligence Act",
    ref: "2024/1689",
    color: "#a78bfa",
    standards: [
      "ISO/IEC 42001",
      "ISO/IEC 23894",
      "NIST AI RMF",
      "CEN/CENELEC JTC 21",
      "ISO/IEC 25059",
    ],
    docs: [
      "AI system card (Art.11)",
      "Risk management system",
      "Training data documentation",
      "Performance metrics",
      "Post-market monitoring plan",
      "EU AI database registration",
    ],
  },
  {
    id: "GDPR",
    label: "GDPR",
    full: "General Data Protection Regulation",
    ref: "2016/679",
    color: "#34d399",
    standards: [
      "ISO/IEC 27701",
      "ISO/IEC 29134 (DPIA)",
      "ENISA guidelines",
      "EDPB guidelines",
      "ISO/IEC 27018",
    ],
    docs: [
      "DPIA (Art.35)",
      "Records of processing (Art.30)",
      "Data Processing Agreements",
      "Privacy notice",
      "Consent mechanism",
      "Data retention policy",
    ],
  },
  {
    id: "EMC",
    label: "EMC",
    full: "Electromagnetic Compatibility Directive",
    ref: "2014/30/EU",
    color: "#fbbf24",
    standards: [
      "EN 55032 (emissions)",
      "EN 55035 (immunity)",
      "EN 61000-4-2 (ESD)",
      "EN 61000-4-3 (radiated immunity)",
      "EN 61000-4-4 (EFT)",
      "EN 61000-4-6 (conducted immunity)",
      "ETSI EN 301 489 series",
    ],
    docs: [
      "EMC test reports (accredited lab)",
      "Technical construction file",
      "List of harmonised standards",
      "EU Declaration of Conformity",
    ],
  },
  {
    id: "LVD",
    label: "LVD",
    full: "Low Voltage Directive",
    ref: "2014/35/EU",
    color: "#fb923c",
    standards: [
      "EN 60335-1 (household appliances)",
      "EN 60335-2-x (product specific)",
      "EN 62368-1 (AV/IT)",
      "IEC 62133-2 (Li-ion batteries)",
      "EN 60529 (IP rating)",
      "EN 60950-1",
    ],
    docs: [
      "Electrical schematic",
      "Risk assessment",
      "Insulation coordination analysis",
      "LVD test reports",
      "Battery cell specifications",
      "EU Declaration of Conformity",
    ],
  },
  {
    id: "ESPR",
    label: "ESPR",
    full: "Ecodesign for Sustainable Products",
    ref: "2024/1781",
    color: "#86efac",
    standards: [
      "ISO 14040/44 (LCA)",
      "EN 45554 (repairability)",
      "IEC 63074 (software updates)",
      "GS1 standards (DPP data)",
      "CIRPASS (DPP format)",
    ],
    docs: [
      "Repairability index",
      "Spare parts commitment",
      "Software support period",
      "Digital Product Passport (DPP)",
      "Product information sheet",
      "Material declaration",
    ],
  },
];

const DEPTHS = [
  { value: "quick", label: "Quick" },
  { value: "standard", label: "Standard" },
  { value: "deep", label: "Deep" },
];

const STATUS_COLOR = {
  PASS: "#4ade80",
  WARN: "#facc15",
  FAIL: "#f87171",
  INFO: "#38bdf8",
};

const RISK_COLOR = {
  LOW: "#4ade80",
  MEDIUM: "#facc15",
  HIGH: "#f87171",
  CRITICAL: "#f87171",
};

const RISK_BG = {
  LOW: "rgba(74,222,128,0.06)",
  MEDIUM: "rgba(250,204,21,0.06)",
  HIGH: "rgba(248,113,113,0.06)",
  CRITICAL: "rgba(248,113,113,0.1)",
};

export default function App() {
  const [desc, setDesc] = useState("");
  const [selected, setSelected] = useState(["RED", "AI_Act"]);
  const [depth, setDepth] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("input");

  const toggle = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const run = async () => {
    if (!desc.trim()) { alert("Please enter a product description."); return; }
    if (selected.length === 0) { alert("Select at least one directive."); return; }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
        const response = await fetch("https://regcheck-api.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: selected, depth }),
      });
      if (!response.ok) throw new Error("Server error " + response.status);
      const data = await response.json();
      setResult(data);
      setActiveTab("results");
    } catch (e) {
      setError(e.message);
      setActiveTab("results");
    } finally {
      setLoading(false);
    }
  };

  const counts = result
    ? result.findings.reduce((a, f) => { a[f.status] = (a[f.status] || 0) + 1; return a; }, {})
    : {};

  const selectedLeg = LEGISLATION.filter(l => selected.includes(l.id));

  return (
    <div style={{ background: "#080c0b", minHeight: "100vh", color: "#dce8de", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a3830; border-radius: 2px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .tab-btn:hover { color: #dce8de !important; }
        .run-btn:hover:not(:disabled) { background: #7df0a0 !important; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(100,240,140,0.2); }
        textarea:focus { border-color: rgba(100,240,140,0.3) !important; outline: none; }
        .finding-row:hover { background: rgba(255,255,255,0.015); }
        .leg-col { transition: opacity 0.2s; }
        .dir-strip-btn:hover span:first-child { opacity: 1 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid #151d18", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14, background: "rgba(8,12,11,0.97)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#64f08c", letterSpacing: "-0.02em" }}>RegCheck</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#253028" }}>EU</span>
        </div>
        <div style={{ width: 1, height: 16, background: "#1a2420" }} />
        <span style={{ fontSize: 9, color: "#253028", letterSpacing: "0.18em", textTransform: "uppercase" }}>Compliance Intelligence Platform</span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 1, background: "#0d1510", border: "1px solid #151d18", borderRadius: 3, padding: 2 }}>
          {[["input","Input"], ["results","Results"], ["reference","Reference"]].map(([t, label]) => (
            <button key={t} className="tab-btn" onClick={() => setActiveTab(t)}
              style={{ background: activeTab === t ? "#182420" : "transparent", border: "none", color: activeTab === t ? "#64f08c" : "#2a3c30", fontSize: 10, padding: "5px 14px", borderRadius: 2, cursor: "pointer", letterSpacing: "0.08em", fontFamily: "inherit", transition: "color 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Directive strip ── */}
      <div style={{ borderBottom: "1px solid #151d18", background: "#090e0c", overflowX: "auto" }}>
        <div style={{ display: "flex", minWidth: "fit-content" }}>
          {LEGISLATION.map((leg, i) => {
            const on = selected.includes(leg.id);
            return (
              <button key={leg.id} className="dir-strip-btn" onClick={() => toggle(leg.id)}
                style={{ background: on ? `${leg.color}0d` : "transparent", border: "none", borderRight: i < LEGISLATION.length - 1 ? "1px solid #151d18" : "none", borderBottom: `2px solid ${on ? leg.color : "transparent"}`, padding: "10px 18px 9px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start", transition: "all 0.15s", minWidth: 100 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 800, color: on ? leg.color : "#2a3c30", transition: "color 0.15s", opacity: on ? 1 : 0.6 }}>{leg.label}</span>
                <span style={{ fontSize: 8, color: on ? `${leg.color}60` : "#1a2820", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{leg.ref}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── INPUT TAB ── */}
      {activeTab === "input" && (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px", animation: "fadeUp 0.3s ease" }}>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em", color: "#2a3c30", marginBottom: 8 }}>Product Description</div>
            <textarea rows={8} value={desc} onChange={e => setDesc(e.target.value)}
              placeholder={'Describe the product — connectivity (WiFi, BT, Zigbee), market (EU residential/industrial), data processing (cloud, local), power source, AI features, update mechanism, authentication.\n\nE.g.: "WiFi + Bluetooth smart thermostat. Controls HVAC via app. Stores usage data in US cloud. OTA firmware. Password login. EU residential market."'}
              style={{ width: "100%", background: "#0d1410", border: "1px solid #151d18", color: "#c8deca", fontSize: 12, padding: "14px 16px", borderRadius: 3, resize: "vertical", lineHeight: 1.75, fontFamily: "inherit", transition: "border-color 0.2s" }} />
            <div style={{ marginTop: 5, fontSize: 9, color: "#1a2820" }}>{desc.length} chars — more detail = more accurate results</div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em", color: "#2a3c30", marginBottom: 8 }}>Analysis Depth</div>
            <div style={{ display: "flex", gap: 6 }}>
              {DEPTHS.map(d => (
                <button key={d.value} onClick={() => setDepth(d.value)}
                  style={{ background: depth === d.value ? "rgba(100,240,140,0.07)" : "transparent", border: `1px solid ${depth === d.value ? "rgba(100,240,140,0.25)" : "#151d18"}`, color: depth === d.value ? "#64f08c" : "#2a3c30", fontSize: 10, padding: "7px 18px", borderRadius: 2, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.18em", color: "#2a3c30", marginBottom: 8 }}>
              Selected Directives <span style={{ color: "#64f08c" }}>({selected.length})</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {LEGISLATION.map(l => {
                const on = selected.includes(l.id);
                return (
                  <button key={l.id} onClick={() => toggle(l.id)}
                    style={{ background: on ? `${l.color}10` : "transparent", border: `1px solid ${on ? l.color + "45" : "#151d18"}`, color: on ? l.color : "#2a3c30", fontSize: 10, padding: "5px 12px", borderRadius: 2, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", letterSpacing: "0.05em" }}>
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="run-btn" onClick={run} disabled={loading}
            style={{ background: "#64f08c", color: "#020804", border: "none", padding: "13px 30px", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", borderRadius: 3, display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "inherit", transition: "all 0.2s", opacity: loading ? 0.5 : 1 }}>
            {loading && <div style={{ width: 11, height: 11, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#020804", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />}
            {loading ? "Analysing…" : "▶  Run Compliance Check"}
          </button>
        </div>
      )}

      {/* ── RESULTS TAB ── */}
      {activeTab === "results" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          {!result && !error && !loading && (
            <div style={{ padding: 80, textAlign: "center", color: "#1a2820" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
              <p style={{ fontSize: 11, lineHeight: 1.8 }}>No analysis yet — go to Input and run a check.</p>
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 80, gap: 14, color: "#2a3c30" }}>
              <div style={{ width: 24, height: 24, border: "2px solid #151d18", borderTopColor: "#64f08c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 11, animation: "shimmer 1.5s infinite" }}>Running analysis…</span>
            </div>
          )}

          {error && (
            <div style={{ padding: "28px 24px", color: "#f87171", fontSize: 11, lineHeight: 1.8 }}>
              ⚠ {error}<br /><br />
              <span style={{ color: "#2a3c30" }}>Ensure backend is running: </span>
              <code style={{ color: "#64f08c", fontSize: 11 }}>uvicorn main:app --reload</code>
            </div>
          )}

          {result && (
            <>
              {/* Risk banner */}
              <div style={{ padding: "18px 24px", background: RISK_BG[result.overall_risk], borderBottom: "1px solid #151d18", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "#2a3c30", marginBottom: 2 }}>Risk Level</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: RISK_COLOR[result.overall_risk], letterSpacing: "-0.01em" }}>{result.overall_risk}</div>
                </div>
                <div style={{ width: 1, height: 36, background: "#151d18" }} />
                <div style={{ fontSize: 11, color: "#6a8a72", lineHeight: 1.6, flex: 1, minWidth: 200 }}>{result.product_summary}</div>
                <div style={{ display: "flex", gap: 18, marginLeft: "auto" }}>
                  {[["PASS","#4ade80"],["WARN","#facc15"],["FAIL","#f87171"],["INFO","#38bdf8"]].map(([s, c]) => (
                    <div key={s} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: c, lineHeight: 1 }}>{counts[s] || 0}</div>
                      <div style={{ fontSize: 8, color: "#2a3c30", letterSpacing: "0.12em", marginTop: 2 }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Findings grouped by directive */}
              {selectedLeg.map(leg => {
                const legFindings = result.findings.filter(f =>
                  f.directive === leg.label ||
                  f.directive === leg.id ||
                  f.directive.startsWith(leg.label) ||
                  f.directive.toUpperCase().includes(leg.label.toUpperCase())
                );
                if (legFindings.length === 0) return null;
                return (
                  <div key={leg.id} style={{ borderBottom: "1px solid #151d18" }}>
                    <div style={{ padding: "9px 24px", background: `${leg.color}07`, borderBottom: "1px solid #151d18", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 3, height: 14, background: leg.color, borderRadius: 2, opacity: 0.8 }} />
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 800, color: leg.color }}>{leg.label}</span>
                      <span style={{ fontSize: 10, color: "#2a3c30" }}>—</span>
                      <span style={{ fontSize: 10, color: "#2a3c30" }}>{leg.full}</span>
                      <span style={{ fontSize: 9, color: "#1a2820", marginLeft: "auto" }}>{leg.ref}</span>
                    </div>
                    {legFindings.map((f, i) => (
                      <div key={i} className="finding-row" style={{ padding: "13px 24px", borderBottom: "1px solid #0f1512", display: "grid", gridTemplateColumns: "8px 1fr 50px", gap: "0 14px", alignItems: "start", transition: "background 0.15s", animation: `fadeUp 0.22s ease ${i * 0.05}s both` }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[f.status], boxShadow: `0 0 5px ${STATUS_COLOR[f.status]}50`, marginTop: 4, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2a3c30", marginBottom: 3 }}>{f.article}</div>
                          <div style={{ fontSize: 11, lineHeight: 1.7, color: "#b8d4bc" }}>{f.finding}</div>
                          {f.action && (
                            <div style={{ fontSize: 10, color: "#3a5a42", marginTop: 5, lineHeight: 1.6, paddingLeft: 10, borderLeft: "2px solid #151d18" }}>
                              → {f.action}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 8, padding: "3px 5px", borderRadius: 2, background: `${STATUS_COLOR[f.status]}12`, color: STATUS_COLOR[f.status], border: `1px solid ${STATUS_COLOR[f.status]}28`, letterSpacing: "0.08em", textAlign: "center", alignSelf: "start", whiteSpace: "nowrap" }}>{f.status}</div>
                      </div>
                    ))}
                  </div>
                );
              })}

              <div style={{ padding: "18px 24px", fontSize: 11, lineHeight: 1.8, color: "#3a5a42", fontStyle: "italic" }}>{result.summary}</div>
            </>
          )}
        </div>
      )}

      {/* ── REFERENCE TAB — horizontal legislation columns ── */}
      {activeTab === "reference" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ padding: "10px 24px", borderBottom: "1px solid #151d18", fontSize: 9, color: "#1a2820", letterSpacing: "0.1em" }}>
            DIRECTIVES × STANDARDS × DOCUMENTATION — columns dimmed when directive is not selected for analysis
          </div>
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${LEGISLATION.length}, minmax(175px, 1fr))`, minWidth: `${LEGISLATION.length * 175}px` }}>
              {LEGISLATION.map((leg, ci) => {
                const on = selected.includes(leg.id);
                return (
                  <div key={leg.id} className="leg-col" style={{ borderRight: ci < LEGISLATION.length - 1 ? "1px solid #151d18" : "none", opacity: on ? 1 : 0.28 }}>
                    {/* Column header */}
                    <div style={{ padding: "14px 14px 11px", background: `${leg.color}09`, borderBottom: `2px solid ${leg.color}35`, position: "sticky", top: "94px", zIndex: 10 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: leg.color, marginBottom: 1 }}>{leg.label}</div>
                      <div style={{ fontSize: 9, color: `${leg.color}65`, lineHeight: 1.4, marginBottom: 1 }}>{leg.full}</div>
                      <div style={{ fontSize: 8, color: "#1a2820", letterSpacing: "0.05em" }}>{leg.ref}</div>
                    </div>

                    {/* Standards section */}
                    <div style={{ padding: "11px 13px 6px" }}>
                      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.18em", color: "#1a2820", marginBottom: 7, paddingBottom: 5, borderBottom: "1px solid #151d18" }}>
                        Standards
                      </div>
                      {leg.standards.map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 7, animation: `fadeUp 0.2s ease ${i * 0.03}s both` }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: leg.color, opacity: 0.45, marginTop: 4, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: "#4a6a52", lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>

                    {/* Documents section */}
                    <div style={{ padding: "6px 13px 18px" }}>
                      <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.18em", color: "#1a2820", marginBottom: 7, paddingBottom: 5, borderBottom: "1px solid #151d18" }}>
                        Technical Docs
                      </div>
                      {leg.docs.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 7, animation: `fadeUp 0.2s ease ${i * 0.03 + 0.12}s both` }}>
                          <div style={{ width: 4, height: 4, background: leg.color, opacity: 0.3, marginTop: 4, flexShrink: 0, borderRadius: 1, transform: "rotate(45deg)" }} />
                          <span style={{ fontSize: 10, color: "#3a5242", lineHeight: 1.5 }}>{d}</span>
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
    </div>
  );
}