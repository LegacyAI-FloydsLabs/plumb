import { useEffect, useState } from "react";
import { t, type Lang } from "./i18n";

interface HomePageProps {
  lang: Lang;
}

// Minimal BeforeInstallPromptEvent shape — the spec type isn't in lib.dom
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function HomePage({ lang }: HomePageProps) {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstallEvent(null);
  };

  return (
    <article className="psi-home">
      <header className="psi-home__hero">
        <div className="psi-home__wordmark" aria-hidden="true">
          <span className="psi-home__wordmark-main">PLUMB</span>
          <span className="psi-home__wordmark-rule" />
          <span className="psi-home__wordmark-sub">Field Library · v0.1</span>
        </div>

        <h1 className="psi-home__tagline">
          {t("home.tagline", lang)}
          <span className="psi-home__tagline-sub">{t("home.tagline.sub", lang)}</span>
        </h1>

        <p className="psi-home__intro">{t("home.intro", lang)}</p>

        {installEvent && (
          <div className="psi-home__install">
            <button
              type="button"
              onClick={handleInstall}
              className="psi-home__install-btn"
            >
              {t("home.install", lang)}
              <span aria-hidden="true">→</span>
            </button>
            <span className="psi-home__install-hint">
              {t("home.install.hint", lang)}
            </span>
          </div>
        )}
      </header>

      <section className="psi-home__pillars" aria-label="About">
        <div className="psi-home__pillar">
          <span className="psi-app__label">{t("home.why.label", lang)}</span>
          <p>{t("home.why.body", lang)}</p>
        </div>
        <div className="psi-home__pillar">
          <span className="psi-app__label">{t("home.who.label", lang)}</span>
          <p>{t("home.who.body", lang)}</p>
        </div>
        <div className="psi-home__pillar">
          <span className="psi-app__label">{t("home.how.label", lang)}</span>
          <p>{t("home.how.body", lang)}</p>
        </div>
      </section>


      <footer className="psi-home__signoff">
        <p>{t("home.signoff", lang)}</p>
        <a
          href="https://legacyai.space"
          target="_blank"
          rel="noopener noreferrer"
        >
          legacyai.space
        </a>
      </footer>
    </article>
  );
}
