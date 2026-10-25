/**
 * Aria Sales Hub: coded host shell.
 *
 * This responsive shell gives your AI Assistant a realistic product context.
 * Most candidate work belongs in the post-invocation experience rendered by
 * <AssistantExperience />. Small shell integration changes are welcome when
 * they help the proposed experience feel coherent.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AssistantExperience } from "./AssistantExperience";
import { EntityPreview } from "./EntityPreview";
import { Icons } from "./icons";

export const DEFAULT_PROMPT = "How is Marcus doing on discovery calls this quarter?";

/** Largest font that keeps the whole question visible. Longer text stays on one line and scrolls. */
function fitPromptField(input: HTMLInputElement) {
  input.style.fontSize = "";
  const max = parseFloat(getComputedStyle(input).fontSize);
  if (!Number.isFinite(max) || input.clientWidth < 1) return;
  if (input.scrollWidth <= input.clientWidth) return;

  const floor = 8;
  let low = floor;
  let high = max;
  let best = floor;
  let fitted = false;
  for (let step = 0; step < 12; step += 1) {
    const mid = (low + high) / 2;
    input.style.fontSize = `${mid}px`;
    if (input.scrollWidth <= input.clientWidth) {
      fitted = true;
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }
  input.style.fontSize = `${fitted ? best : floor}px`;
}

const overviewSignals = [
  { label: "Calls reviewed", value: "18", context: "this week", trend: [42, 54, 48, 68, 74, 100], note: "Five reps have new moments ready to review." },
  { label: "Coaching follow-ups", value: "4", context: "open", trend: [56, 72, 62, 78, 70, 88], note: "Lena and Didi have check-ins scheduled today." },
  { label: "Deals needing attention", value: "3", context: "active", trend: [88, 76, 82, 68, 58, 52], note: "Brookfield and Percepto have follow-ups this week." },
] as const;

export function App() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [submittedPrompt, setSubmittedPrompt] = useState(DEFAULT_PROMPT);
  const [assistantIsOpen, setAssistantIsOpen] = useState(false);
  const [sidebarIsCompact, setSidebarIsCompact] = useState(false);
  const [followUpsBumped, setFollowUpsBumped] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [assistantDocked, setAssistantDocked] = useState(false);
  const [assistantClosing, setAssistantClosing] = useState(false);
  const [dockAvailable, setDockAvailable] = useState(() => window.matchMedia("(min-width: 761px)").matches);
  const triggerRef = useRef<HTMLInputElement>(null);
  const docked = assistantIsOpen && assistantDocked && dockAvailable;
  const showDockColumn = docked && !assistantClosing;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 761px)");
    const onChange = () => setDockAvailable(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const invokeAssistant = (text?: string) => {
    const next = (text ?? prompt).trim() || DEFAULT_PROMPT;
    setPrompt(next);
    setSubmittedPrompt(next);
    setAssistantIsOpen(true);
  };

  useLayoutEffect(() => {
    const input = triggerRef.current;
    if (!input) return;
    const fit = () => fitPromptField(input);
    fit();
    const observer = new ResizeObserver(fit);
    if (input.parentElement) observer.observe(input.parentElement);
    return () => observer.disconnect();
  }, [prompt, assistantIsOpen, sidebarIsCompact, showDockColumn]);

  const dismissAssistant = () => {
    setAssistantIsOpen(false);
    setAssistantDocked(false);
    setAssistantClosing(false);
    // The dialog clears `inert` on the shell during commit. A second frame
    // waits for that before focus returns to the composer.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    });
  };

  return (
    <div className={`app-shell${sidebarIsCompact ? " sidebar-compact" : ""}${assistantIsOpen ? " assistant-open" : ""}${showDockColumn ? " assistant-docked" : ""}${assistantClosing && assistantDocked ? " assistant-closing" : ""}`}>
      <aside className="sidebar" aria-label="Primary">
        <div className="brand-row">
          <a className="brand" href="#top" aria-label="Aria Sales Hub home">
            <img src="./aria-logo.png" alt="" width={26} height={26} />
            <span className="nav-label">Aria</span>
          </a>
          <button
            className="sidebar-toggle"
            type="button"
            aria-label={sidebarIsCompact ? "Expand sidebar" : "Compact sidebar"}
            aria-expanded={!sidebarIsCompact}
            aria-controls="primary-navigation"
            onClick={() => setSidebarIsCompact((compact) => !compact)}
          >
            {sidebarIsCompact ? <Icons.panelOpen data-icon="inline-only" /> : <Icons.panelClose data-icon="inline-only" />}
          </button>
        </div>

        <div className="sidebar-search shell-context" data-label="Search" aria-hidden="true">
          <Icons.search data-icon="inline-start" />
          <span className="nav-label">Search</span>
          <span className="kbd">⌘K</span>
        </div>

        <nav className="nav-group" id="primary-navigation" aria-label="Main">
          <span className="nav-item shell-context" aria-current="page" data-label="Home"><Icons.home data-icon="inline-start" /><span className="nav-label">Home</span></span>
          <span className="nav-item shell-context" data-label="Team"><Icons.users data-icon="inline-start" /><span className="nav-label">Team</span></span>
          <span className="nav-item shell-context" data-label="Coaching"><Icons.target data-icon="inline-start" /><span className="nav-label">Coaching</span></span>
          <span className="nav-item shell-context" data-label="Deals"><Icons.briefcase data-icon="inline-start" /><span className="nav-label">Deals</span></span>
          <span className="nav-item shell-context" data-label="Library"><Icons.library data-icon="inline-start" /><span className="nav-label">Library</span></span>
        </nav>

        <div className="sidebar-foot">
          <span className="nav-item shell-context" data-label="Help"><Icons.help data-icon="inline-start" /><span className="nav-label">Help</span></span>
          <span className="nav-item shell-context" data-label="Settings"><Icons.settings data-icon="inline-start" /><span className="nav-label">Settings</span></span>
          <div className="user-row shell-context" data-label="Jordan Ashby">
            <span className="avatar">JA</span>
            <span className="who">
              <strong>Jordan Ashby</strong>
              <small>Sales manager · North America</small>
            </span>
          </div>
        </div>
      </aside>

      <main className="main" id="top">
        <div className="main-inner">
          <div className="greeting-row">
            <h1 className="greeting">Good to see you, Jordan.</h1>
            <p className="date-eyebrow">Today · Friday, September 4</p>
          </div>

          <div className="content">
            <section className="brief" aria-labelledby="brief-title">
              <h2 id="brief-title" className="sr-only">Today's brief</h2>
              <p className="brief-lead">
                Your morning brief has <strong>three coaching moments</strong> and <strong>two deal follow-ups</strong> across the team.
              </p>
              <ul className="brief-points">
                <li>
                  <b>Coaching.</b>{" "}
                  <EntityPreview id="marcus-preview" label={<><span className="avatar cool">MB</span>Marcus Bell</>}>
                    <span className="hover-card-head">
                      <span className="avatar cool lg">MB</span>
                      <span><strong>Marcus Bell</strong><small>Account executive · Mid-market</small></span>
                    </span>
                    <span className="preview-grid">
                      <span><small>Calls available</small><strong>6 this quarter</strong></span>
                      <span><small>Coaching moments</small><strong>2 ready</strong></span>
                    </span>
                    <span className="preview-note"><b>Active deal</b> Brookfield is in evaluation.</span>
                  </EntityPreview>{", Lena Ortiz, and Didi Rao each have recent calls ready for review."}
                </li>
                <li>
                  <b>Deals.</b>{" "}
                  <EntityPreview id="brookfield-preview" label={<><span className="mark"><Icons.shield data-icon="inline-start" /></span>Brookfield</>}>
                    <span className="hover-card-head">
                      <span className="mark large"><Icons.shield data-icon="inline-start" /></span>
                      <span><strong>Brookfield</strong><small>Enterprise opportunity</small></span>
                    </span>
                    <span className="preview-grid">
                      <span><small>Stage</small><strong>Evaluation</strong></span>
                      <span><small>Next meeting</small><strong>September 9</strong></span>
                    </span>
                    <span className="preview-note"><b>Latest update</b> Security review is scheduled.</span>
                  </EntityPreview>
                  {" "}enters security review today; Percepto has a pricing follow-up Friday.
                </li>
              </ul>
            </section>

            <section className="section" aria-labelledby="signals-title">
              <div className="section-head">
                <h2 id="signals-title" className="section-title">Team overview</h2>
                <span className="section-meta">Today · 6 reps · 12 active deals</span>
              </div>
              <div className="stat-grid">
                {overviewSignals.map((signal) => {
                  const bumped = signal.label === "Coaching follow-ups" && followUpsBumped;
                  const value = bumped ? "5" : signal.value;
                  const note = bumped ? "Marcus has a rehearsal before Thursday's Brookfield review." : signal.note;
                  return (
                  <article className={`stat${bumped ? " bumped" : ""}`} key={signal.label} aria-label={`${signal.label}: ${value} ${signal.context}`}>
                    <div className="stat-head"><span className="stat-skill">{signal.label}</span></div>
                    <div className="stat-value-row">
                      <span className="stat-value">{value}</span>
                      <span className="stat-context">{signal.context}</span>
                    </div>
                    <div className="bars" aria-hidden="true">
                      {signal.trend.map((height, index) => <span key={index} style={{ "--h": `${height}%` } as CSSProperties} />)}
                    </div>
                    <p className="stat-note">{note}</p>
                  </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {assistantIsOpen ? (
          <AssistantExperience
            prompt={submittedPrompt}
            onDismiss={dismissAssistant}
            triggerRef={triggerRef}
            onAnnounce={setAnnouncement}
            onBooked={() => setFollowUpsBumped(true)}
            docked={docked}
            dockAvailable={dockAvailable}
            onToggleDock={() => setAssistantDocked((current) => !current)}
            onCloseStart={() => setAssistantClosing(true)}
          />
        ) : null}
      </main>

      <form
        className="assistant-trigger"
        aria-label="Ask AI Assistant"
        onSubmit={(event) => {
          event.preventDefault();
          invokeAssistant();
        }}
      >
        <label className="sr-only" htmlFor="assistant-prompt">Ask AI Assistant anything</label>
        <input ref={triggerRef} id="assistant-prompt" value={prompt} autoComplete="off" onChange={(event) => setPrompt(event.target.value)} />
        <button className="icon-button optional-action" type="button" aria-label="Voice input" disabled><Icons.mic data-icon="inline-only" /></button>
        <button className="icon-button primary" type="submit" aria-label="Ask AI Assistant"><Icons.arrowUp data-icon="inline-only" /></button>
      </form>
      {createPortal(
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>,
        document.body,
      )}
    </div>
  );
}
