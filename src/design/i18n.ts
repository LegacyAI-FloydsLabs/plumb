/**
 * Plumb — minimal i18n shim.
 *
 * No runtime deps. UI chrome strings only (not FLUM tool output — those
 * live in each tool's engine and need individual translation passes).
 *
 * Adding a language: extend STRINGS with a new Lang key, add the label
 * to LANG_LABELS, and ship. Incomplete translations fall through to English.
 *
 * Contributors: we welcome trade-verified translations. See CONTRIBUTING.md.
 */

export type Lang = "en" | "es";

const STORAGE_KEY = "plumb-lang";

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  es: "ES",
};

export function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "es") return saved as Lang;
  } catch {
    /* localStorage unavailable — fall through */
  }
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.toLowerCase().startsWith("es") ? "es" : "en";
}

export function setLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
}

type StringTable = Record<string, string>;

const STRINGS: Record<Lang, StringTable> = {
  en: {
    "header.sub": "A Legacy AI field tool",
    "action.dark": "Dark",
    "action.light": "Light",
    "action.menu": "Menu",
    "action.close": "Close",
    "action.skip": "Skip to main content",

    "home.tagline": "Free tools for the plumbing trade.",
    "home.tagline.sub": "Offline. In your pocket. Yours forever.",
    "home.intro":
      "Eleven tools a working plumber needs in a day. Slope, pipe size, fixture count, code lookup, pressure, drainage, permits, clearances, materials, backflow, bid — in one small app that runs on your phone with no signal, no login, no account.",
    "home.why.label": "Why it's free",
    "home.why.body":
      "The code book shouldn't cost $200 a year. Your math doesn't belong to a subscription. A good trade tool is something you give, not sell.",
    "home.who.label": "Who made it",
    "home.who.body":
      "Legacy AI. We build AI agents for small businesses — receptionists, dispatchers, review catchers, the whole menu. This one is on the house.",
    "home.how.label": "How it stays free",
    "home.how.body":
      "Open source. AGPL licensed. Nobody can close it and sell it back. Ever.",
    "home.tools.label": "Pick a tool",
    "home.install": "Install on your phone",
    "home.install.hint": "Works offline after first visit. No account. No tracking.",
    "home.signoff": "— Douglas · Legacy AI",

    "chat.palette.placeholder": "Jump to a tool or describe the job…",
    "chat.send": "Send",
    "chat.voice": "Speak",
    "chat.voice.listening": "Listening…",
    "chat.voice.unsupported": "Your browser doesn't support voice input yet.",

    "next": "Next",
    "tip": "Tip",

    // Tool nav labels
    "tool.slope": "Slope Reader",
    "tool.pipe_sizer": "Pipe Sizer",
    "tool.fixture_counter": "Fixture Counter",
    "tool.code_compliance": "Code Book",
    "tool.hydraulic_analyzer": "Pressure Reader",
    "tool.drainage_designer": "Drain Layout",
    "tool.permit_navigator": "Permit Finder",
    "tool.ada_compliance": "Clearance Check",
    "tool.material_spec": "Material Match",
    "tool.backflow_test": "Backflow Log",
    "tool.bid_generator": "Bid Writer",

  "action.share": "Share",
  "cmd.palette.heading": "Where to?",
  "cmd.palette.placeholder": "Type a tool or a question…",
  "cmd.palette.recent": "Recent",
  "cmd.palette.noResults": "No tool matches. Try a shorter word.",
  "cmd.trigger": "⌘K · Jump to a tool",
  "cmd.trigger.mobile": "Jump to a tool",
  "error.generic": "Couldn't run that calculation. Check the numbers and try again.",
  "error.storage": "Couldn't save to this device. Your last calculation is still visible above.",
  "offline.banner": "You're offline. Everything still works.",
  "i18n.invite": "Reading this in English? You can help translate it — CONTRIBUTING.md",

  },

  es: {
    "header.sub": "Una herramienta de campo de Legacy AI",
    "action.dark": "Oscuro",
    "action.light": "Claro",
    "action.menu": "Menú",
    "action.close": "Cerrar",
    "action.skip": "Saltar al contenido principal",

    "home.tagline": "Herramientas gratis para el oficio de la plomería.",
    "home.tagline.sub": "Sin conexión. En tu bolsillo. Tuyas para siempre.",
    "home.intro":
      "Once herramientas que un plomero necesita en un día. Pendiente, tamaño de tubería, conteo de accesorios, consulta de código, presión, drenaje, permisos, espacios, materiales, antirretorno, cotización — en una aplicación pequeña que funciona en tu teléfono sin señal, sin inicio de sesión, sin cuenta.",
    "home.why.label": "Por qué es gratis",
    "home.why.body":
      "El libro de códigos no debería costar $200 al año. Tus cálculos no pertenecen a una suscripción. Una buena herramienta es algo que se da, no se vende.",
    "home.who.label": "Quién la hizo",
    "home.who.body":
      "Legacy AI. Construimos agentes de IA para pequeños negocios — recepcionistas, despachadores, recolectores de reseñas, el menú completo. Esta va por la casa.",
    "home.how.label": "Cómo se mantiene gratis",
    "home.how.body":
      "Código abierto. Licencia AGPL. Nadie puede cerrarla y revenderla. Nunca.",
    "home.tools.label": "Elige una herramienta",
    "home.install": "Instálala en tu teléfono",
    "home.install.hint":
      "Funciona sin conexión después de la primera visita. Sin cuenta. Sin rastreo.",
    "home.signoff": "— Douglas · Legacy AI",

    "chat.palette.placeholder": "Ve a una herramienta o describe el trabajo…",
    "chat.send": "Enviar",
    "chat.voice": "Hablar",
    "chat.voice.listening": "Escuchando…",
    "chat.voice.unsupported": "Tu navegador aún no admite entrada de voz.",

    "next": "Siguiente",
    "tip": "Consejo",

    "tool.slope": "Lector de Pendiente",
    "tool.pipe_sizer": "Calculador de Tubería",
    "tool.fixture_counter": "Contador de Accesorios",
    "tool.code_compliance": "Libro de Código",
    "tool.hydraulic_analyzer": "Lector de Presión",
    "tool.drainage_designer": "Trazado de Drenaje",
    "tool.permit_navigator": "Buscador de Permisos",
    "tool.ada_compliance": "Verificación ADA",
    "tool.material_spec": "Compatibilidad de Materiales",
    "tool.backflow_test": "Registro de Antirretorno",
    "tool.bid_generator": "Redactor de Cotización",
  },
};

export function t(key: string, lang: Lang): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

export const SUPPORTED_LANGS: Lang[] = ["en", "es"];
