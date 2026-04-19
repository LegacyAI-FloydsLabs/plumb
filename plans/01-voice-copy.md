# Plumb — Voice & Copy Guide (Douglas's Voice)

Companion to: `00-plumb-launch-full.md`.
Purpose: every builder, translator, and contributor writes Plumb copy in a single, recognizable voice. This document is the source of truth.

---

## The voice in one paragraph

Plumb's voice is Douglas Talley's voice from the Legacy AI solutions dossier. Direct. Plain-spoken. Outcome-first. Names things with "The" when naming helps. Speaks to the owner-operator and the working plumber, not to the procurement committee. Short sentences. Fragments are allowed when they carry more weight than a full sentence. No hedging, no hype, no "empower" or "unlock" or "seamless." Concrete places and concrete problems. Signed personally when possible.

## The five rules

1. **Outcome before mechanism.** "Sundays are yours again" before any feature description. The tech doesn't care how it works; they care what it gives back.
2. **Name the thing.** "The Silent Closer." "The Receptionist Who Never Calls In." "The Bid Writer." "The Code Book." Naming a tool with "The" carries dignity and memorability.
3. **No salesman tells.** Banned words: *empower, unlock, seamless, leverage, streamline, innovative, best-in-class, enterprise-grade, next-gen, game-changing, cutting-edge, revolutionary, disrupting, democratizing.*
4. **Specific beats general.** Brown County, not "rural Indiana." $200 a year, not "expensive." 1421 Oak St, not "a job." Tangible detail proves you're real.
5. **Sign the work.** "— Douglas" at the bottom of the manifesto. `legacyai.space` in the footer of every surface. Fingerprints visible.

## Do / Don't table

| Do | Don't |
|---|---|
| "Free forever. No subscription." | "Premium features unlocked at no cost." |
| "Nothing leaves your phone unless you send it." | "Privacy-first architecture." |
| "The code book shouldn't cost $200 a year." | "Affordable alternative to legacy reference tools." |
| "Tells you exactly where the belly is." | "Advanced slope analysis with AI-powered belly detection." |
| "Paid on-site, every time." | "Accelerate revenue recognition." |
| "On the house." | "Complimentary offering." |
| "Nobody can close it and sell it back." | "Open-source ecosystem ensures vendor neutrality." |
| "Talks to your real customers on your real numbers." | "Integrated with your existing tech stack." |
| "In your pocket." | "Mobile-optimized." |
| "Works with no signal." | "Progressive Web App with offline support." |

The left column is always shorter, always more concrete, and always carries emotional weight the right column strips out.

## Banned phrases (hard-enforce)

- **"In plain English"** — exclusionary to non-native English speakers. Use "plain language," "jargon-free," "no codes or acronyms," or simply describe the behavior (e.g., "no part numbers as prose").
- **"Coming soon"** / **"in development"** / **"MVP"** / **"beta"** — Plumb is launched when it launches. Nothing pending, nothing placeholder.
- **"Users"** (in copy visible to actual users) — prefer "plumbers," "techs," "you."
- **"Customers"** (for Plumb users) — Plumb has no customers. It has users. "Customer" is reserved for the plumbing-business-owner's customer (the homeowner).
- **"Leverage," "utilize," "facilitate"** — use "use," "use," "help."

## Surface-by-surface string bank

Builders consume these as the canonical sources. Translators translate FROM these. Voice reviewers check AGAINST these.

### Header wordmark

- Primary: `Plumb`
- Subtitle (visible on ≥520px viewport): `A Legacy AI field tool`

### Landing hero (`/`)

- Wordmark block: `PLUMB` · separator rule · `Field Library · v0.9`
- Tagline, line 1 (large): `Free tools for the plumbing trade.`
- Tagline, line 2 (sub): `Offline. In your pocket. Yours forever.`
- Intro paragraph: `Eleven tools a working plumber needs in a day. Slope, pipe size, fixture count, code lookup, pressure, drainage, permits, clearances, materials, backflow, bid — in one small app that runs on your phone with no signal, no login, no account.`

### Landing pillars (three cards)

- **Why it's free** · `The code book shouldn't cost $200 a year. Your math doesn't belong to a subscription. A good trade tool is something you give, not sell.`
- **Who made it** · `Legacy AI. We build AI agents for small businesses — receptionists, dispatchers, review catchers, the whole menu. This one is on the house.`
- **How it stays free** · `Open source. AGPL licensed. Nobody can close it and sell it back. Ever.`

### Landing tool grid heading

- `Pick a tool`

### Landing install prompt

- Button label: `Install on your phone`
- Hint: `Works offline after the first visit. No account. No tracking.`

### Landing signoff

- `— Douglas · Legacy AI`
- Link: `legacyai.space`

### Footer (site-wide)

- Left block label: `Plumb`
- Tagline: `Free tools for the plumbing trade. Offline. No login. No account. Nothing leaves your phone unless you send it.`
- Middle block label: `License`
- Link text: `AGPL-3.0-or-later`
- Note: `Open source. Nobody can close it and sell it back.`
- Right block label: `Made by`
- Link text: `Legacy AI`
- Note: `AI agents for small businesses. This one is on the house.`
- Sign line: `— Douglas  ·  legacyai.space`

### Footer advisory seats row (A09)

- Label: `Advisory seats`
- Intro: `Five seats. Held by the trade, not by the project.`
- Seat titles (each either filled with a name or "Seat open · apply →"):
  - Master plumber
  - Trade-school instructor
  - Code official
  - Journeyman, non-native-English-speaking
  - Youth apprentice

### The eleven tools — canonical copy

Every tool needs: label, one-line description (on home card), chat placeholder (in-tool), and one sample FLUM hint (`result`, `hint`, `actions_available[]`) to anchor the voice for engine authors.

#### The Slope Reader · `SL`

- Label: `Slope Reader`
- Description: `Tells you exactly where the belly is. Sonde, laser rod, math — all in one place.`
- Chat placeholder: `What run are you reading? Paste stations, or tell me what you saw.`
- Sample FLUM hint on success: `Take another reading between stations 3 and 4 to tighten the belly bound.`

#### The Pipe Sizer · `PS`

- Label: `Pipe Sizer`
- Description: `The right size, first try. Supply, drain, and vent — with no table lookup.`
- Chat placeholder: `How many fixtures, what building, how long a run?`
- Sample FLUM hint: `Move one bathroom group below the stack to drop the drain to 3-inch.`

#### The Fixture Counter · `FX`

- Label: `Fixture Counter`
- Description: `DFUs and WSFUs without the code-book page flip. Bathroom group reduction included.`
- Chat placeholder: `What's on the floor? I'll count the DFUs.`
- Sample FLUM hint: `The group reduction saves you two DFUs. Add a lavatory and you're still under the threshold.`

#### The Code Book · `CB`

- Label: `Code Book`
- Description: `IPC and UPC answers in your hand. Free forever. No subscription, no login.`
- Chat placeholder: `What's the code say about…?`
- Sample FLUM hint: `Your jurisdiction adopted IPC 2021 in 2023. This section also applies to existing work.`

#### The Pressure Reader · `PR`

- Label: `Pressure Reader`
- Description: `Pressure, flow, surge, and gas. Every answer on site, every time.`
- Chat placeholder: `2-inch copper, 50 feet, 40 psi — what do I lose?`
- Sample FLUM hint: `Surge pressure exceeds the fitting rating. Add a water hammer arrestor within 6 feet.`

#### The Drain Layout · `DR`

- Label: `Drain Layout`
- Description: `Stacks, cleanouts, vents — laid out right the first time.`
- Chat placeholder: `Four stories, two stacks, one building. Size it.`
- Sample FLUM hint: `Relief vent every 10 branch intervals. Your tallest stack needs one at floor 5.`

#### The Permit Finder · `PM`

- Label: `Permit Finder`
- Description: `Which permit, which fee, which form. By jurisdiction, before you dig.`
- Chat placeholder: `Bathroom remodel in Austin — what do I file?`
- Sample FLUM hint: `City of Austin requires a separate trade-permit for each gas line alteration. File the form before the inspection window closes.`

#### The Clearance Check · `CL`

- Label: `Clearance Check`
- Description: `ADA clearances verified on the spot. No surprises from the inspector.`
- Chat placeholder: `Commercial bathroom — what clearances do I need?`
- Sample FLUM hint: `You're 2 inches short on side clearance. Move the paper holder 2 inches forward and you're compliant.`

#### The Material Match · `MT`

- Label: `Material Match`
- Description: `Copper to PVC. PEX to brass. Transitions, takeoffs, and BOMs — with no guessing.`
- Chat placeholder: `Can I connect copper to PVC? What's the transition?`
- Sample FLUM hint: `Use a dielectric union between the copper and galvanized. Direct contact will corrode inside 3 years.`

#### The Backflow Log · `BK`

- Label: `Backflow Log`
- Description: `Pick the assembly. Test it right. File the log on the spot.`
- Chat placeholder: `Irrigation system — which assembly goes in?`
- Sample FLUM hint: `PVB for irrigation. RPZ if any chemical injection is present now or planned.`

#### The Bid Writer · `BD`

- Label: `Bid Writer`
- Description: `A complete bid in under a minute. Materials and labor priced in.`
- Chat placeholder: `Three-bathroom remodel, residential — write the bid.`
- Sample FLUM hint: `Your margin lands at 32%. Raise labor rate $5/hr or add a change-order line to hit 35%.`

### Chat command palette (C01)

- Trigger label (desktop): `⌘K · Jump to a tool`
- Trigger label (mobile): `Jump to a tool`
- Dialog heading: `Where to?`
- Placeholder: `Type a tool or a question…`
- Empty-state heading: `Recent`
- No-results string: `No tool matches. Try a shorter word.`

### Entity-extraction clarification prompts (C02)

When extraction is ambiguous:

- Heading: `Is this right?`
- Pattern: `You said "[input]" — I read it as [parsed summary]. Fix it if I got it wrong.`
- Confirm button: `That's right`
- Fix button: `Let me fix it`

### Voice input (G01)

- Button label: `Speak`
- Listening state: `Listening…`
- Error: `Didn't catch that. Try again, or type it.`
- Unsupported browser: `Voice input not supported here. Type it instead.`

### PDF share (F01/F02)

- Button label: `Share`
- Share sheet title: `[Tool name] result`
- Share body (appended automatically): `Made with Plumb — a free tool for the plumbing trade. legacyai.space`
- Footer stamp on PDF: `Plumb — A Legacy AI field tool · legacyai.space · AGPL-3.0`

### Offline indicator

- Banner text when network unreachable: `You're offline. Everything still works.`
- Banner text when back online: (none — the banner just disappears; don't announce network presence)

### Error states

- Generic calculation error: `Couldn't run that calculation. Check the numbers and try again.`
- Input-out-of-range: `[Field] is outside what the code allows. Expected [range].`
- Storage error: `Couldn't save to this device. Your last calculation is still visible above.`

### Translation invitation

- Landing banner (when UI is English but `navigator.language` is not): `Reading this in English? You can help translate it — CONTRIBUTING.md`
- Inside `/contribute/translations` (or wherever hosted): `Plumb should be readable by every plumber who works in the United States, and eventually every plumber anywhere. If you're fluent in a language the trade speaks and we don't cover — help us. Nothing about the process is hard. See CONTRIBUTING.md.`

### Advisory seat CTA

- Footer seat row: `Seat open · apply →`
- `CONTRIBUTING.md#advisory-seats` section opener: `We're holding five advisory seats for people active in the trade. Seats are three-year terms, unpaid, with hard veto rights on mission drift. If you're a working master plumber, a code official, a trade-school instructor, a non-native-English-speaking journeyman, or a youth apprentice in your first two years — introduce yourself.`

## Launch-surface copy (PR / social / README)

### README opener (A04)

> # Plumb
>
> **Free tools for the plumbing trade. Offline. In your pocket. Yours forever.**
>
> Eleven tools a working plumber needs in a day — slope, pipe size, fixture count, code lookup, pressure, drainage, permits, clearances, materials, backflow, bid — in one small app that runs on your phone with no signal, no login, no account.
>
> **It's free because the code book shouldn't cost $200 a year.** It's free because your math doesn't belong to a subscription. It's free because a good trade tool is something you give, not sell.
>
> **Open source.** [AGPL-3.0-or-later](LICENSE). Nobody can close it and sell it back. Ever.
>
> — Douglas · [Legacy AI](https://legacyai.space)

### Social / launch-day copy

**Twitter/X (one post):**
> Plumb is live. Eleven tools a working plumber needs in a day. Offline. No login. No account. Free forever. Open source. Built by Legacy AI as a gift to the trade. If the code book shouldn't cost $200 a year, neither should the calculator. [link]

**LinkedIn (one post):**
> For 30 years the plumbing trade has been sold software by people who don't work in the trade. Today we release Plumb — a free, offline, open-source kit of the eleven tools a working plumber actually uses in a day. No account. No subscription. No trap. Nothing leaves your phone. This is a gift from Legacy AI to the trade that built the country's plumbing. Open source under AGPL. Nobody can close it and sell it back. legacyai.space

**Hacker News (title + first comment):**
- Title: `Plumb: Free offline plumbing-trade tool kit, AGPL-licensed`
- First comment: `We run Legacy AI. Our day job is building AI agents for small businesses — phones, scheduling, reports, that stack. We made Plumb because the plumbing trade gets sold expensive software by people who don't work in the trade, and the reference books that tell them what's legal are paywalled. The whole thing is open source, offline-first, no account, no telemetry. License is AGPL specifically so nobody can close it and sell it back. Feedback from working plumbers or code officials welcome. — Douglas`

**Trade subreddit post (r/Plumbing):**
- Title: `Free offline plumbing calculator app — 11 tools, no login, open source`
- Body: `Hey folks. We built this because a friend who pulls sewer cameras for a living asked us to fix his slope math on a job site with no signal. It's the eleven tools a working plumber needs in a day — slope reader, pipe sizer, fixture counter, code book, pressure reader, drainage designer, permit finder, ADA clearance checker, material compatibility, backflow log, bid writer. All of it runs offline after you install it. No account. No ads. No tracking. Free forever. Source is on GitHub under AGPL so nobody can close it and charge for it. Spanish too — more languages if anyone wants to help translate. Any corrections from code officials or master plumbers welcome — we're holding advisory seats specifically for that. Link: legacyai.space`

## Translation approach

- Every string that renders in the UI lives in `src/design/i18n.ts`.
- FLUM engine output strings live alongside each tool's engine file.
- Contributors submit translations via PR against `i18n.ts` or the tool-engine string table.
- Quality bar: translations must read as if a working tech from a trade that uses that language wrote them. Machine translation alone is insufficient — a native speaker in the trade must review before the language ships as "complete."
- "Partial" languages are welcome. Partial languages show the translated strings they have and English fallback for the rest, with a visible `Help translate to [language] → CONTRIBUTING.md` banner until parity.
- The Spanish launch is the reference: every string translated, plus Slope Reader's FLUM envelope localized end-to-end.

## What gets signed by Douglas personally

- HomePage signoff line.
- Footer sign line (every route).
- README closing line.
- Social launch posts (Twitter, LinkedIn, HN).
- Trade subreddit post.
- Email auto-responder on the security-disclosure address.

Everything else can be maintained by contributors without Douglas's direct authorship, as long as it passes the voice bar above.
