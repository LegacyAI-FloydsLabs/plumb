import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SlopeCalculator } from "./slope";
import { ErrorBoundary } from "./slope/SlopeCalculator";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found in index.html");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <SlopeCalculator
        initialJobId=""
        initialUnits="imperial"
        pipeDiameterIn={4}
        onComplete={(payload) => {
          // Standalone shell: just log. The PWA wires this to its backend.
          // eslint-disable-next-line no-console
          console.log("[psi-slope] survey complete", payload);
        }}
      />
    </ErrorBoundary>
  </StrictMode>,
);

// Register service worker for offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failed — non-critical, app still works
    });
  });
}