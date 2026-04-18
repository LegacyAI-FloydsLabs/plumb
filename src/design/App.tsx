import { useState, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { PsiChat } from "./PsiChat";
import { parseIntent, compute, type FlumResponse, type ToolId } from "../llm";

// Tool page imports — lazy loaded in production build
import { SlopeCalculator } from "../slope";
import { PipeSizerPage } from "../tools/pipe-sizer/PipeSizerPage";
import { FixtureCounterPage } from "../tools/fixture-counter/FixtureCounterPage";
import { CodeCompliancePage } from "../tools/code-compliance/CodeCompliancePage";
import { HydraulicAnalyzerPage } from "../tools/hydraulic-analyzer/HydraulicAnalyzerPage";
import { DrainageDesignerPage } from "../tools/drainage-designer/DrainageDesignerPage";
import { PermitNavigatorPage } from "../tools/permit-navigator/PermitNavigatorPage";
import { AdaCompliancePage } from "../tools/ada-compliance/AdaCompliancePage";
import { MaterialSpecPage } from "../tools/material-spec/MaterialSpecPage";
import { BackflowTestPage } from "../tools/backflow-test/BackflowTestPage";
import { BidGeneratorPage } from "../tools/bid-generator/BidGeneratorPage";

const TOOLS: { id: ToolId; label: string; icon: string; value: string; description: string }[] = [
  { id: "slope", label: "Slope Calculator", icon: "📐", value: "11.4%", description: "Sonde-and-grade lateral slope survey with code verdict" },
  { id: "pipe_sizer", label: "Pipe Sizer", icon: "🔧", value: "10.2%", description: "All-in-one water supply, drain, and vent sizing" },
  { id: "fixture_counter", label: "Fixture Counter", icon: "🔢", value: "10.5%", description: "DFU/WSFU counting with bathroom group reduction" },
  { id: "code_compliance", label: "Code Compliance", icon: "📖", value: "9.8%", description: "Natural language code lookup for IPC/UPC" },
  { id: "hydraulic_analyzer", label: "Hydraulic & Gas", icon: "💧", value: "9.5%", description: "Pressure, flow, surge, and gas pipe analysis" },
  { id: "drainage_designer", label: "Drainage Designer", icon: "🏗️", value: "7.2%", description: "DWV system design with stack sizing and cleanouts" },
  { id: "permit_navigator", label: "Permit Navigator", icon: "📋", value: "7.0%", description: "Permit type, fees, and document requirements" },
  { id: "ada_compliance", label: "ADA Scanner", icon: "♿", value: "7.4%", description: "ADA clearance verification with measured input" },
  { id: "material_spec", label: "Material Spec", icon: "🔩", value: "7.8%", description: "Material compatibility and BOM generation" },
  { id: "backflow_test", label: "Backflow & Test", icon: "🔄", value: "7.3%", description: "Assembly selection, installation, and test logging" },
  { id: "bid_generator", label: "Bid Generator", icon: "💰", value: "10.5%", description: "Smart bid with material takeoff and labor estimation" },
];

export function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("psi-app-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [navOpen, setNavOpen] = useState(false);
  const [lastResponse, setLastResponse] = useState<FlumResponse | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("psi-app--dark", isDark);
    document.documentElement.classList.toggle("psi-app--light", !isDark);
    localStorage.setItem("psi-app-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handleIntent = useCallback(async (intent: { rawInput: string; tool: ToolId }) => {
    const parsed = parseIntent(intent.rawInput);
    const response = await compute({
      tool: parsed.tool ?? intent.tool,
      action: "compute",
      params: parsed.params,
    });
    setLastResponse(response);
  }, []);

  return (
    <BrowserRouter>
      <div className={`psi-app ${isDark ? "psi-app--dark" : "psi-app--light"}`}>
        <a href="#psi-app-content" className="psi-app__skip-link">
          Skip to main content
        </a>

        <header className="psi-app__header">
          <button
            className="psi-app__menu-toggle"
            onClick={() => setNavOpen(!navOpen)}
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
          >
            {navOpen ? "✕" : "☰"}
          </button>
          <NavLink to="/" className="psi-app__header-logo">
            <img src={`${import.meta.env.BASE_URL}hero-legacy.jpg`} alt="PSI" style={{ height: 28, borderRadius: 4 }} />
            <span className="psi-app__header-title">PSI Field Suite</span>
          </NavLink>
          <div className="psi-app__header-actions">
            <button
              className="psi-app__theme-toggle"
              onClick={() => setIsDark(!isDark)}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* Mobile overlay */}
        {navOpen && (
          <div
            className="psi-app__overlay psi-app__overlay--visible"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            onClick={() => setNavOpen(false)}
            onKeyDown={(e) => { if (e.key === "Escape") setNavOpen(false); }}
          />
        )}

        <nav className={`psi-app__nav ${navOpen ? "psi-app__nav--open" : ""}`}>
          <ul className="psi-app__nav-list">
            {TOOLS.map((tool) => (
              <li key={tool.id} className="psi-app__nav-item">
                <NavLink
                  to={`/${tool.id}`}
                  className={({ isActive }) =>
                    `psi-app__nav-link ${isActive ? "psi-app__nav-link--active" : ""}`
                  }
                  onClick={() => setNavOpen(false)}
                >
                  <span className="psi-app__nav-icon">{tool.icon}</span>
                  {tool.label}
                  <span className="psi-app__nav-value">{tool.value}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="psi-app__main" id="psi-app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/slope" replace />} />
            <Route path="/slope" element={<ToolPage toolId="slope" onIntent={handleIntent} />} />
            <Route path="/pipe_sizer" element={<ToolPage toolId="pipe_sizer" onIntent={handleIntent} />} />
            <Route path="/fixture_counter" element={<ToolPage toolId="fixture_counter" onIntent={handleIntent} />} />
            <Route path="/code_compliance" element={<ToolPage toolId="code_compliance" onIntent={handleIntent} />} />
            <Route path="/hydraulic_analyzer" element={<ToolPage toolId="hydraulic_analyzer" onIntent={handleIntent} />} />
            <Route path="/drainage_designer" element={<ToolPage toolId="drainage_designer" onIntent={handleIntent} />} />
            <Route path="/permit_navigator" element={<ToolPage toolId="permit_navigator" onIntent={handleIntent} />} />
            <Route path="/ada_compliance" element={<ToolPage toolId="ada_compliance" onIntent={handleIntent} />} />
            <Route path="/material_spec" element={<ToolPage toolId="material_spec" onIntent={handleIntent} />} />
            <Route path="/backflow_test" element={<ToolPage toolId="backflow_test" onIntent={handleIntent} />} />
            <Route path="/bid_generator" element={<ToolPage toolId="bid_generator" onIntent={handleIntent} />} />
          </Routes>

          {lastResponse && (
            <FlumResultCard response={lastResponse} onDismiss={() => setLastResponse(null)} />
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}

// ---------------------------------------------------------------------------
// Tool Page Wrapper — provides the FLUM chat interface for each tool
// ---------------------------------------------------------------------------

interface ToolPageProps {
  toolId: ToolId;
  onIntent: (intent: { rawInput: string; tool: ToolId }) => void;
}

function ToolPage({ toolId, onIntent }: ToolPageProps) {
  const tool = TOOLS.find((t) => t.id === toolId);
  if (!tool) return <div>Tool not found</div>;

  // Fully implemented tools with form UI
  if (toolId === "slope") {
    return (
      <div>
        <div className="psi-app__section">
          <h2 className="psi-app__section-title">{tool.icon} {tool.label}</h2>
          <p style={{ fontSize: 14, color: "var(--psi-ink-soft)", margin: "0 0 16px 0" }}>
            {tool.description} · <strong>Value: {tool.value}</strong> of standard day
          </p>
          <PsiChat onIntent={onIntent} toolId={toolId} autoFocus />
        </div>
        <SlopeCalculator
          initialJobId=""
          initialUnits="imperial"
          pipeDiameterIn={4}
        />
      </div>
    );
  }

  if (toolId === "pipe_sizer") {
    return (
      <div>
        <div className="psi-app__section">
          <h2 className="psi-app__section-title">{tool.icon} {tool.label}</h2>
          <p style={{ fontSize: 14, color: "var(--psi-ink-soft)", margin: "0 0 16px 0" }}>
            {tool.description} · <strong>Value: {tool.value}</strong> of standard day
          </p>
          <PsiChat onIntent={onIntent} toolId={toolId} autoFocus />
        </div>
        <PipeSizerPage />
      </div>
    );
  }

  // All other tools: real page component + PsiChat
  const PAGE_MAP: Record<string, React.ReactNode> = {
    fixture_counter: <FixtureCounterPage />,
    code_compliance: <CodeCompliancePage />,
    hydraulic_analyzer: <HydraulicAnalyzerPage />,
    drainage_designer: <DrainageDesignerPage />,
    permit_navigator: <PermitNavigatorPage />,
    ada_compliance: <AdaCompliancePage />,
    material_spec: <MaterialSpecPage />,
    backflow_test: <BackflowTestPage />,
    bid_generator: <BidGeneratorPage />,
  };

  const page = PAGE_MAP[toolId];
  if (page) {
    return (
      <div>
        <div className="psi-app__section">
          <h2 className="psi-app__section-title">{tool.icon} {tool.label}</h2>
          <p style={{ fontSize: 14, color: "var(--psi-ink-soft)", margin: "0 0 16px 0" }}>
            {tool.description}
          </p>
          <PsiChat onIntent={onIntent} toolId={toolId} autoFocus />
        </div>
        {page}
      </div>
    );
  }

  // Unknown tool fallback
  return (
    <div>
      <div className="psi-app__section">
        <h2 className="psi-app__section-title">
          {tool.icon} {tool.label}
        </h2>
        <p style={{ fontSize: 14, color: "var(--psi-ink-soft)", margin: "0 0 16px 0" }}>
          {tool.description}
        </p>
      </div>

      <div className="psi-app__section">
        <p style={{ fontSize: 14, color: "var(--psi-ink-soft)" }}>
          Describe what you need in natural language. The FLUM engine will route your request to the correct calculation.
        </p>
        <PsiChat onIntent={onIntent} toolId={toolId} autoFocus />
      </div>

      <div className="psi-app__section" style={{
        background: "var(--psi-surface)",
        borderRadius: "var(--psi-radius)",
        padding: 24,
        textAlign: "center" as const,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
        <h3 style={{ margin: "0 0 8px 0" }}>{tool.label} — Coming Soon</h3>
        <p style={{ fontSize: 14, color: "var(--psi-ink-soft)", margin: "0 auto", maxWidth: 400 }}>
          The calculation engine for this tool is being built. The natural language interface 
          and FLUM-compliant response format are ready. Check back soon for full functionality.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FLUM Result Card — displays the response from the compute engine
// ---------------------------------------------------------------------------

interface FlumResultCardProps {
  response: FlumResponse;
  onDismiss: () => void;
}

function FlumResultCard({ response, onDismiss }: FlumResultCardProps) {
  const statusClass =
    response.status === "success"
      ? "psi-app__result--success"
      : response.status === "failure"
        ? "psi-app__result--failure"
        : "psi-app__result--pending";

  const confidenceClass =
    (response.metadata?.confidence ?? 1) >= 0.95
      ? "psi-app__confidence--high"
      : (response.metadata?.confidence ?? 1) >= 0.8
        ? "psi-app__confidence--medium"
        : "psi-app__confidence--low";

  return (
    <div className={`psi-app__result ${statusClass}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 className="psi-app__result-title">
          {response.result}
          <span className={`psi-app__confidence ${confidenceClass}`}>
            {((response.metadata?.confidence ?? 1) * 100).toFixed(0)}% confidence
          </span>
        </h3>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--psi-ink-soft)" }}
          aria-label="Dismiss result"
        >
          ✕
        </button>
      </div>

      {response.hint && (
        <div className="psi-app__result-hint">💡 {response.hint}</div>
      )}

      {response.tip && (
        <div className="psi-app__result-tip">💡 {response.tip}</div>
      )}

      {response.actions_available.length > 0 && (
        <div className="psi-app__result-actions">
          {response.actions_available.map((action) => (
            <span key={action} className="psi-app__result-action">{action}</span>
          ))}
        </div>
      )}

      {response.metadata?.requires_human_confirmation && (
        <div style={{ fontSize: 13, color: "var(--psi-warn)", marginTop: 8 }}>
          ⚠️ Low confidence — please verify measurements manually before proceeding.
        </div>
      )}
    </div>
  );
}