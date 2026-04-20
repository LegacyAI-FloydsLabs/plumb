import { useState, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { PsiChat } from "./PsiChat";
import { HomePage } from "./HomePage";
import { parseIntent, compute, type FlumResponse, type ToolId } from "../llm";
import { detectLang, setLang as persistLang, t, LANG_LABELS, SUPPORTED_LANGS, type Lang } from "./i18n";
import "./styles.css";
import "./home.css";
import "./tool.css";
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
  { id: "slope", label: "Slope Reader", icon: "SL", value: "11.4%",
    description: "Tells you exactly where the belly is. Sonde, laser rod, math — all in one place." },
  { id: "pipe_sizer", label: "Pipe Sizer", icon: "PS", value: "10.2%",
    description: "The right size, first try. Supply, drain, and vent — with no table lookup." },
  { id: "fixture_counter", label: "Fixture Counter", icon: "FX", value: "10.5%",
    description: "DFUs and WSFUs without the code-book page flip. Bathroom group reduction included." },
  { id: "code_compliance", label: "Code Book", icon: "CB", value: "9.8%",
    description: "IPC and UPC answers in your hand. Free forever. No subscription, no login." },
  { id: "hydraulic_analyzer", label: "Pressure Reader", icon: "PR", value: "9.5%",
    description: "Pressure, flow, surge, and gas. Every answer on site, every time." },
  { id: "drainage_designer", label: "Drain Layout", icon: "DR", value: "7.2%",
    description: "Stacks, cleanouts, vents — laid out right the first time." },
  { id: "permit_navigator", label: "Permit Finder", icon: "PM", value: "7.0%",
    description: "Which permit, which fee, which form. By jurisdiction, before you dig." },
  { id: "ada_compliance", label: "Clearance Check", icon: "CL", value: "7.4%",
    description: "ADA clearances verified on the spot. No surprises from the inspector." },
  { id: "material_spec", label: "Material Match", icon: "MT", value: "7.8%",
    description: "Copper to PVC. PEX to brass. Transitions, takeoffs, and BOMs — with no guessing." },
  { id: "backflow_test", label: "Backflow Log", icon: "BK", value: "7.3%",
    description: "Pick the assembly. Test it right. File the log on the spot." },
  { id: "bid_generator", label: "Bid Writer", icon: "BD", value: "10.5%",
    description: "A complete bid in under a minute. Materials and labor priced in." },
];

export function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("psi-app-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [navOpen, setNavOpen] = useState(false);
  const [lastResponse, setLastResponse] = useState<FlumResponse | null>(null);
  const [lang, setLangState] = useState<Lang>(() => detectLang());
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("psi-app--dark", isDark);
    document.documentElement.classList.toggle("psi-app--light", !isDark);
    localStorage.setItem("psi-app-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    persistLang(lang);
  }, [lang]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const cycleLang = useCallback(() => {
    setLangState((prev) => {
      const idx = SUPPORTED_LANGS.indexOf(prev);
      return SUPPORTED_LANGS[(idx + 1) % SUPPORTED_LANGS.length];
    });
  }, []);

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

    {isOffline && (
      <div role="status" aria-live="polite" className="psi-app__offline-banner">
        {t('offline.banner', lang)}
      </div>
    )}

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
            <img src={`${import.meta.env.BASE_URL}hero-legacy.jpg`} alt="" aria-hidden="true" />
            <span className="psi-app__header-title">
              Plumb
              <span className="psi-app__header-sub">{t("header.sub", lang)}</span>
            </span>
          </NavLink>
          <div className="psi-app__header-actions">
            <button
              className="psi-app__theme-toggle"
              onClick={cycleLang}
              aria-label={`Language: ${LANG_LABELS[lang]}`}
              title="Change language"
            >
              {LANG_LABELS[lang]}
            </button>
            <button
              className="psi-app__theme-toggle"
              onClick={() => setIsDark(!isDark)}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? t("action.light", lang) : t("action.dark", lang)}
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
                  <span className="psi-app__nav-icon" aria-hidden="true">{tool.icon}</span>
                  <span>{t(`tool.${tool.id}`, lang)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="psi-app__main" id="psi-app-content">
          <Routes>
            <Route path="/" element={<HomePage lang={lang} tools={TOOLS} />} />
            <Route path="/slope" element={<ToolPage toolId="slope" onIntent={handleIntent} lang={lang} />} />
            <Route path="/pipe_sizer" element={<ToolPage toolId="pipe_sizer" onIntent={handleIntent} lang={lang} />} />
            <Route path="/fixture_counter" element={<ToolPage toolId="fixture_counter" onIntent={handleIntent} lang={lang} />} />
            <Route path="/code_compliance" element={<ToolPage toolId="code_compliance" onIntent={handleIntent} lang={lang} />} />
            <Route path="/hydraulic_analyzer" element={<ToolPage toolId="hydraulic_analyzer" onIntent={handleIntent} lang={lang} />} />
            <Route path="/drainage_designer" element={<ToolPage toolId="drainage_designer" onIntent={handleIntent} lang={lang} />} />
            <Route path="/permit_navigator" element={<ToolPage toolId="permit_navigator" onIntent={handleIntent} lang={lang} />} />
            <Route path="/ada_compliance" element={<ToolPage toolId="ada_compliance" onIntent={handleIntent} lang={lang} />} />
            <Route path="/material_spec" element={<ToolPage toolId="material_spec" onIntent={handleIntent} lang={lang} />} />
            <Route path="/backflow_test" element={<ToolPage toolId="backflow_test" onIntent={handleIntent} lang={lang} />} />
            <Route path="/bid_generator" element={<ToolPage toolId="bid_generator" onIntent={handleIntent} lang={lang} />} />
          </Routes>

          {lastResponse && (
            <FlumResultCard response={lastResponse} onDismiss={() => setLastResponse(null)} />
          )}
        </main>

        <AppFooter />
      </div>
    </BrowserRouter>
  );
}

// ---------------------------------------------------------------------------
// Footer — the signature on the gift. Appears on every route.
// ---------------------------------------------------------------------------

function AppFooter() {
  const advisorySeats = [
    { title: 'Master plumber', filled: false },
    { title: 'Trade-school instructor', filled: false },
    { title: 'Code official', filled: false },
    { title: 'Journeyman, non-native-English-speaking', filled: false },
    { title: 'Youth apprentice', filled: false },
  ];

  return (
    <footer className="psi-app__footer" role="contentinfo">
      <div className="psi-app__footer-inner">
        <div className="psi-app__footer-brand">
          <span className="psi-app__label">Plumb</span>
          <p className="psi-app__footer-tagline">
            Free tools for the plumbing trade. Offline. No login. No account.
            Nothing leaves your phone unless you send it.
          </p>
        </div>

        <div className="psi-app__footer-col">
          <span className="psi-app__label">License</span>
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
            target="_blank"
            rel="noopener noreferrer"
            className="psi-app__footer-link"
          >
            AGPL-3.0-or-later
          </a>
          <span className="psi-app__footer-note">
            Open source. Nobody can close it and sell it back.
          </span>
        </div>

        <div className="psi-app__footer-col">
          <span className="psi-app__label">Made by</span>
          <a
            href="https://legacyai.space"
            target="_blank"
            rel="noopener noreferrer"
            className="psi-app__footer-link"
          >
            Legacy AI
          </a>
          <span className="psi-app__footer-note">
            AI agents for small businesses. This one is on the house.
          </span>
        </div>

      <div className="psi-app__footer-seats">
        <span className="psi-app__label">Advisory seats</span>
        <p className="psi-app__footer-seats-intro">
          Five seats. Held by the trade, not by the project.
        </p>
        <ul className="psi-app__footer-seats-list">
          {advisorySeats.map((seat) => (
            <li key={seat.title} className="psi-app__footer-seat">
              <span className="psi-app__footer-seat-title">{seat.title}</span>
              {seat.filled ? (
                <span className="psi-app__footer-seat-name">{seat.filled}</span>
              ) : (
                <a
                  href="https://github.com/legacyai/plumb/discussions"
                  className="psi-app__footer-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Seat open · apply →
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="psi-app__footer-sign">
        <span>— Douglas</span>
        <span aria-hidden="true" className="psi-app__footer-dot">·</span>
        <a href="https://legacyai.space" target="_blank" rel="noopener noreferrer">
          legacyai.space
        </a>
      </div>
      </div>
    </footer>
  );
}


// ---------------------------------------------------------------------------
// Tool Page Wrapper — provides the FLUM chat interface for each tool
// ---------------------------------------------------------------------------

interface ToolPageProps {
  toolId: ToolId;
  onIntent: (intent: { rawInput: string; tool: ToolId }) => void;
  lang: Lang;
}

function ToolPage({ toolId, onIntent, lang }: ToolPageProps) {
  const tool = TOOLS.find((x) => x.id === toolId);
  if (!tool) return <div>Tool not found</div>;
  const label = t(`tool.${toolId}`, lang);

  // Fully implemented tools with form UI
  if (toolId === "slope") {
    return (
      <div>
        <div className="psi-app__section">
          <h2 className="psi-app__section-title">{label}</h2>
          <p>
            {tool.description}
            {" · "}
            <span className="psi-app__numeric">{tool.value}</span>
            <span className="psi-app__label" style={{ marginLeft: 6 }}>of day</span>
          </p>
          <PsiChat onIntent={onIntent} toolId={toolId} autoFocus lang={lang} />
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
          <h2 className="psi-app__section-title">{label}</h2>
          <p>
            {tool.description}
            {" · "}
            <span className="psi-app__numeric">{tool.value}</span>
            <span className="psi-app__label" style={{ marginLeft: 6 }}>of day</span>
          </p>
          <PsiChat onIntent={onIntent} toolId={toolId} autoFocus lang={lang} />
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
          <h2 className="psi-app__section-title">{label}</h2>
          <p>{tool.description}</p>
          <PsiChat onIntent={onIntent} toolId={toolId} autoFocus lang={lang} />
        </div>
        {page}
      </div>
    );
  }

  // Unreachable with current TOOLS registry — every toolId has a page.
  // Kept as a typed safety net only.
  return null;
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
      <h3 className="psi-app__result-title">
        <span style={{ flex: 1, minWidth: 0 }}>{response.result}</span>
        <span className={`psi-app__confidence ${confidenceClass}`}>
          {((response.metadata?.confidence ?? 1) * 100).toFixed(0)}%
        </span>
        <button
          onClick={onDismiss}
          className="psi-app__result-dismiss"
          aria-label="Dismiss result"
        >
          ×
        </button>
      </h3>

      {response.hint && (
        <div className="psi-app__result-hint">{response.hint}</div>
      )}

      {response.tip && (
        <div className="psi-app__result-tip">{response.tip}</div>
      )}

      {response.actions_available.length > 0 && (
        <div className="psi-app__result-actions">
          {response.actions_available.map((action) => (
            <span key={action} className="psi-app__result-action">{action}</span>
          ))}
        </div>
      )}

      {response.metadata?.requires_human_confirmation && (
        <div className="psi-app__result-warn">
          Low confidence — verify measurements manually before proceeding.
        </div>
      )}
    </div>
  );
}
