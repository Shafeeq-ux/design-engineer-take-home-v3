import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { streamAnswer } from "../mock/streamAnswer";
import type { CoachingCard as CoachingCardData } from "../mock/types";
import { CoachingCard } from "./CoachingCard";
import { Icons } from "./icons";

type AssistantExperienceProps = {
  prompt: string;
  onDismiss: () => void;
  triggerRef: RefObject<HTMLInputElement | null>;
  onAnnounce: (message: string) => void;
  onBooked: () => void;
  docked: boolean;
  dockAvailable: boolean;
  onToggleDock: () => void;
  onCloseStart: () => void;
};

const STAGES = ["Answer", "Evidence", "Draft", "Sent", "Booked"] as const;

const REHEARSAL_WHEN = "Tomorrow, 9:00 AM";

type Attachment = { id: string; label: string };

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex='0']";

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Box = { left: number; top: number; width: number; height: number };

function readBox(element: HTMLElement): Box {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function boxIsUsable(box: Box) {
  return box.width >= 1 && box.height >= 1;
}

const PLACEMENT_PROPS = ["left", "top", "width", "height", "right", "bottom", "transform", "maxHeight", "transition", "zIndex"] as const;

function clearPlacement(element: HTMLElement | null) {
  if (!element) return;
  for (const prop of PLACEMENT_PROPS) element.style[prop] = "";
}

function writeBox(element: HTMLElement, box: Box) {
  element.style.left = `${box.left}px`;
  element.style.top = `${box.top}px`;
  element.style.width = `${box.width}px`;
  element.style.height = `${box.height}px`;
  element.style.right = "auto";
  element.style.bottom = "auto";
  element.style.transform = "none";
  element.style.maxHeight = "none";
}

function clearSheetFill(sheet: HTMLElement | null) {
  if (!sheet) return;
  sheet.style.height = "";
  sheet.style.maxHeight = "";
  sheet.style.flex = "";
}

function placementTiming() {
  const style = getComputedStyle(document.documentElement);
  const raw = style.getPropertyValue("--duration-panel").trim() || "380ms";
  const easing = style.getPropertyValue("--ease-out").trim() || "cubic-bezier(0.16, 1, 0.3, 1)";
  const value = Number.parseFloat(raw);
  const duration = raw.endsWith("ms") ? value : value * 1000;
  return { duration: Number.isFinite(duration) ? duration : 380, easing };
}

function triggerElement() {
  return document.querySelector<HTMLElement>(".assistant-trigger");
}

function readSidebarWidth() {
  const shell = document.querySelector(".app-shell");
  if (!shell) return "15rem";
  return getComputedStyle(shell).getPropertyValue("--sidebar-w").trim() || "15rem";
}

function lowestRow(card: CoachingCardData) {
  return card.rows.reduce((lowest, row) => (row.score < lowest.score ? row : lowest));
}

function buildDraft(deltas: string[], card: CoachingCardData) {
  const prose = deltas.join("").trim();
  const gap = lowestRow(card);
  return `${prose}\n\n${gap.skill}. ${gap.evidence}\n\n${card.nextStep}`;
}

function formatLeft(milliseconds: number) {
  const left = Math.max(0, milliseconds);
  const minutes = Math.floor(left / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")} left`;
}

function revealBottom(scroller: HTMLElement, bottom: number, pad = 8) {
  const hidden = bottom - (scroller.getBoundingClientRect().bottom - pad);
  if (hidden > 1) scroller.scrollTop += hidden;
}

function draftTextBottom(textarea: HTMLTextAreaElement) {
  const style = getComputedStyle(textarea);
  const width = textarea.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:-9999px;top:0;visibility:hidden;white-space:pre-wrap;overflow-wrap:anywhere;";
  probe.style.font = style.font;
  probe.style.lineHeight = style.lineHeight;
  probe.style.letterSpacing = style.letterSpacing;
  probe.style.width = `${Math.max(0, width)}px`;
  probe.textContent = textarea.value.length > 0 ? textarea.value : "\u00a0";
  document.body.appendChild(probe);
  const height = probe.offsetHeight;
  probe.remove();
  return textarea.getBoundingClientRect().top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop) + height;
}

/**
 * The answer grows up from the composer, then follows the next step through
 * evidence, an editable note, a send receipt, and one rehearsal time.
 * Opening starts floating, and docking lasts only for this visit.
 * Dock and float share one measured move; reduced motion snaps.
 * Closing reverses that motion, then unmounts.
 * Prose stays out of the live region.
 * streamAnswer is the only data source.
 */
export function AssistantExperience({ prompt, onDismiss, onAnnounce, onBooked, docked, dockAvailable, onToggleDock, onCloseStart }: AssistantExperienceProps) {
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [deltas, setDeltas] = useState<string[]>([]);
  const [card, setCard] = useState<CoachingCardData | null>(null);
  const [streamDone, setStreamDone] = useState(false);
  const [filled, setFilled] = useState(false);
  const [stage, setStage] = useState(0);
  const [openSkillId, setOpenSkillId] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const [folded, setFolded] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftFull, setDraftFull] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [sentHint, setSentHint] = useState<string | null>(null);
  const [sentEdited, setSentEdited] = useState(false);
  const [sentLabels, setSentLabels] = useState<string[]>([]);
  const [bookedWhen, setBookedWhen] = useState<string | null>(null);
  const [recallEnds, setRecallEnds] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);
  const [entering, setEntering] = useState(true);
  const [closing, setClosing] = useState(false);
  const [quietFocus, setQuietFocus] = useState<"close" | "home" | null>("close");

  const runRef = useRef(0);
  const flowRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const placementRef = useRef(docked);
  const anchorBoxRef = useRef<Box | null>(null);
  const triggerBoxRef = useRef<Box | null>(null);
  const placingRef = useRef(false);
  const draftButtonRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const bookRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const homeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const closingRef = useRef(false);
  const onAnnounceRef = useRef(onAnnounce);
  const onDismissRef = useRef(onDismiss);
  const onCloseStartRef = useRef(onCloseStart);
  onAnnounceRef.current = onAnnounce;
  onDismissRef.current = onDismiss;
  onCloseStartRef.current = onCloseStart;

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    runRef.current += 1;
    setClosing(true);
    onCloseStartRef.current();
    const reduced = prefersReducedMotion();
    const ms = reduced ? 120 : placementTiming().duration;
    window.setTimeout(() => onDismissRef.current(), ms);
  }, []);

  useLayoutEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const ms = prefersReducedMotion() ? 160 : 420;
    const id = window.setTimeout(() => setEntering(false), ms);
    return () => window.clearTimeout(id);
  }, []);

  useLayoutEffect(() => {
    const shell = document.querySelector(".app-shell");
    const sidebar = shell?.querySelector(".sidebar");
    const content = shell?.querySelector(".main-inner");
    const previousOverflow = document.body.style.overflow;

    if (!docked) {
      sidebar?.setAttribute("inert", "");
      content?.setAttribute("inert", "");
      document.body.style.overflow = "hidden";
    }

    const read = () => setSidebarWidth(readSidebarWidth());
    const observer = new MutationObserver(read);
    if (shell) observer.observe(shell, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", read);

    return () => {
      sidebar?.removeAttribute("inert");
      content?.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;
      observer.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [docked]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const trigger = triggerElement();
    if (!anchor || !trigger) return;

    const remember = () => {
      if (placingRef.current) return;
      anchorBoxRef.current = readBox(anchor);
      const liveTrigger = triggerElement();
      if (liveTrigger) triggerBoxRef.current = readBox(liveTrigger);
    };

    const changed = placementRef.current !== docked;
    placementRef.current = docked;
    if (!changed || prefersReducedMotion()) {
      remember();
      return;
    }

    const sheet = sheetRef.current;
    const surface = sheet?.querySelector<HTMLElement>(".assistant-surface") ?? null;
    const root = anchor.parentElement;
    let fromAnchor = anchorBoxRef.current;
    let fromTrigger = triggerBoxRef.current;
    // Margin is mid-transition on the first frame, which makes the floating sheet
    // measure one gutter too tall and snap when the travel ends.
    const fromMargin = surface ? getComputedStyle(surface).marginBottom : "";

    if (placingRef.current) {
      fromAnchor = readBox(anchor);
      fromTrigger = readBox(trigger);
      clearPlacement(anchor);
      clearPlacement(trigger);
      clearSheetFill(sheet);
    }

    if (surface) surface.style.transition = "none";
    const toAnchor = readBox(anchor);
    const toTrigger = readBox(trigger);
    const usable = fromAnchor && fromTrigger && boxIsUsable(fromAnchor) && boxIsUsable(fromTrigger) && boxIsUsable(toAnchor) && boxIsUsable(toTrigger);
    if (!fromAnchor || !fromTrigger || !usable) {
      placingRef.current = false;
      root?.removeAttribute("data-motion");
      clearPlacement(anchor);
      clearPlacement(trigger);
      clearSheetFill(sheet);
      if (surface) {
        surface.style.transition = "";
        surface.style.marginBottom = "";
      }
      remember();
      return;
    }

    const { duration, easing } = placementTiming();
    const travel = `left ${duration}ms ${easing}, top ${duration}ms ${easing}, width ${duration}ms ${easing}, height ${duration}ms ${easing}`;
    placingRef.current = true;
    root?.setAttribute("data-motion", "place");
    setEntering(false);

    if (sheet) {
      sheet.style.height = "100%";
      sheet.style.maxHeight = "none";
      sheet.style.flex = "1 1 auto";
    }

    anchor.style.transition = "none";
    trigger.style.transition = "none";
    writeBox(anchor, fromAnchor);
    writeBox(trigger, fromTrigger);
    trigger.style.zIndex = "62";
    if (surface) surface.style.marginBottom = fromMargin;
    anchor.getBoundingClientRect();

    anchor.style.transition = travel;
    trigger.style.transition = `${travel}, box-shadow var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out)`;
    if (surface) {
      surface.style.transition = "";
      surface.style.marginBottom = "";
    }
    writeBox(anchor, toAnchor);
    writeBox(trigger, toTrigger);

    let settled = false;
    let timer = 0;
    const settle = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      anchor.removeEventListener("transitionend", onEnd);
      placingRef.current = false;
      clearPlacement(anchor);
      clearPlacement(triggerElement());
      clearSheetFill(sheetRef.current);
      const liveSurface = sheetRef.current?.querySelector<HTMLElement>(".assistant-surface");
      if (liveSurface) {
        liveSurface.style.transition = "";
        liveSurface.style.marginBottom = "";
      }
      root?.removeAttribute("data-motion");
      anchorBoxRef.current = readBox(anchor);
      const liveTrigger = triggerElement();
      if (liveTrigger) triggerBoxRef.current = readBox(liveTrigger);
    };
    const onEnd = (event: Event) => {
      const transition = event as TransitionEvent;
      if (transition.target !== anchor || transition.propertyName !== "width") return;
      settle();
    };

    anchor.addEventListener("transitionend", onEnd);
    timer = window.setTimeout(settle, duration + 80);

    return () => {
      window.clearTimeout(timer);
      anchor.removeEventListener("transitionend", onEnd);
      if (!anchor.isConnected) {
        clearPlacement(triggerElement());
        placingRef.current = false;
      }
    };
  }, [docked]);

  useLayoutEffect(() => {
    if (placingRef.current) return;
    const anchor = anchorRef.current;
    const trigger = triggerElement();
    if (anchor) anchorBoxRef.current = readBox(anchor);
    if (trigger) triggerBoxRef.current = readBox(trigger);
  });

  useEffect(() => {
    const remember = () => {
      if (placingRef.current) return;
      const anchor = anchorRef.current;
      const trigger = triggerElement();
      if (anchor) anchorBoxRef.current = readBox(anchor);
      if (trigger) triggerBoxRef.current = readBox(trigger);
    };
    window.addEventListener("resize", remember);
    return () => window.removeEventListener("resize", remember);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const speed = prefersReducedMotion() ? 2 : 1;

    const run = async () => {
      for await (const event of streamAnswer(prompt, { speed })) {
        if (cancelled) return;
        switch (event.type) {
          case "status":
            setStatusLabel(event.label);
            onAnnounceRef.current(event.label);
            break;
          case "text":
            setDeltas((current) => [...current, event.delta]);
            break;
          case "artifact":
            setCard(event.data);
            onAnnounceRef.current(
              `Answer ready. Coaching card with ${event.data.rows.length} scored skills: ` +
                event.data.rows.map((row) => `${row.skill} ${row.score.toFixed(1)}`).join(", ") +
                ".",
            );
            break;
          case "done":
            setStreamDone(true);
            break;
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [prompt]);

  useEffect(() => {
    if (!card) return;
    const frame = window.requestAnimationFrame(() => setFilled(true));
    return () => window.cancelAnimationFrame(frame);
  }, [card]);

  useLayoutEffect(() => {
    const area = noteRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight}px`;
  }, [draftText, drafting]);

  useLayoutEffect(() => {
    const node = flowRef.current;
    if (!node || stage >= 3 || closing) return;

    if (drafting && noteRef.current) {
      const field = noteRef.current;
      const textBottom = draftTextBottom(field);
      const view = node.getBoundingClientRect();
      if (textBottom > view.bottom - 8) {
        revealBottom(node, textBottom);
      } else if (!draftText && field.getBoundingClientRect().top > view.bottom - 48) {
        node.scrollTop += field.getBoundingClientRect().top - (view.top + 12);
      }
      return;
    }

    const next = node.querySelector<HTMLElement>(".next");
    if (next && next.getClientRects().length > 0) {
      revealBottom(node, next.getBoundingClientRect().bottom);
      return;
    }

    const prose = node.querySelector<HTMLElement>(".assistant-prose");
    if (prose) revealBottom(node, prose.getBoundingClientRect().bottom);
  }, [deltas.length, card, draftText, stage, drafting, streamDone, closing]);

  useEffect(() => {
    const reveal = () => {
      const node = flowRef.current;
      if (!node || stage >= 2 || closingRef.current) return;
      const next = node.querySelector<HTMLElement>(".next");
      if (!next || next.getClientRects().length === 0) return;
      revealBottom(node, next.getBoundingClientRect().bottom);
    };
    window.addEventListener("resize", reveal);
    return () => window.removeEventListener("resize", reveal);
  }, [stage]);

  useEffect(() => {
    if (returnFocus.current && !drafting) {
      returnFocus.current = false;
      draftButtonRef.current?.focus();
    }
  }, [drafting]);

  useEffect(() => {
    if (!draftReady) return;
    const node = noteRef.current;
    if (!node) return;
    node.focus();
    node.setSelectionRange(0, 0);
  }, [draftReady]);

  useEffect(() => {
    if (stage === 3) bookRef.current?.focus();
    if (stage === 4) homeRef.current?.focus({ preventScroll: true });
  }, [stage]);

  useEffect(() => {
    if (recallEnds === null || stage !== 3) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [recallEnds, stage]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey) {
        sheetRef.current?.querySelectorAll<HTMLElement>("[data-focus-quiet]").forEach((element) => {
          element.removeAttribute("data-focus-quiet");
        });
        setQuietFocus(null);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
      if (docked || event.key !== "Tab" || !sheetRef.current) return;
      const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.getClientRects().length > 0,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismiss, docked]);

  const toggleSkill = (id: string, name: string) => {
    const opening = openSkillId !== id;
    setOpenSkillId(opening ? id : null);
    if (opening && stage === 0) {
      setStage(1);
      onAnnounce(`Evidence shown for ${name}.`);
    }
  };

  const startDraft = () => {
    if (!card) return;
    const full = buildDraft(deltas, card);
    const gap = lowestRow(card);
    const chips: Attachment[] = [{ id: gap.id, label: gap.skill }];
    if (openSkillId && openSkillId !== gap.id) {
      const row = card.rows.find((item) => item.id === openSkillId);
      if (row) chips.push({ id: row.id, label: row.skill });
    }
    setAttachments(chips);
    setDraftFull(full);
    setDraftText("");
    setDraftReady(false);
    setCompact(true);
    setFolded(true);
    setDrafting(true);
    setStage(2);
    onAnnounce(`Drafting a coaching note to ${card.rep}.`);

    const token = ++runRef.current;
    const parts = full.split("\n\n");
    const delay = prefersReducedMotion() ? 160 : 480;
    void (async () => {
      let built = "";
      for (const part of parts) {
        await wait(delay);
        if (token !== runRef.current) return;
        built = built ? `${built}\n\n${part}` : part;
        setDraftText(built);
      }
      if (token !== runRef.current) return;
      setDraftReady(true);
      onAnnounce("Draft ready and editable. Send to Marcus when you are happy with it.");
    })();
  };

  const backToCard = () => {
    runRef.current += 1;
    returnFocus.current = true;
    setDrafting(false);
    setDraftReady(false);
    setFolded(false);
    setStage(openSkillId ? 1 : 0);
  };

  const sendNote = () => {
    if (!card || sending) return;
    setSending(true);
    const token = ++runRef.current;
    const edited = draftText.trim() !== draftFull.trim();
    const labels = attachments.map((item) => item.label);
    const delay = prefersReducedMotion() ? 200 : 700;
    void (async () => {
      await wait(delay);
      if (token !== runRef.current) return;
      setSentEdited(edited);
      setSentLabels(labels);
      setSending(false);
      setDrafting(false);
      setSentHint("Note sent to Marcus.");
      setRecallEnds(Date.now() + 10 * 60 * 1000);
      setNow(Date.now());
      setStage(3);
      onAnnounce(`Note sent to ${card.rep}. Tomorrow at 9:00 AM is open for a rehearsal.`);
    })();
  };

  const recall = () => {
    onAnnounce("Note recalled. Nothing was sent to Marcus.");
    dismiss();
  };

  const book = () => {
    setRecallEnds(null);
    setBookedWhen(REHEARSAL_WHEN);
    setQuietFocus("home");
    setStage(4);
    onBooked();
    onAnnounce(`Rehearsal booked for ${REHEARSAL_WHEN}. Coaching follow-ups is now 5.`);
  };

  const recallLeft = recallEnds === null ? null : recallEnds - now;
  const recallClosed = recallLeft !== null && recallLeft <= 0;
  const attachedSummary =
    sentLabels.length === 0
      ? "No moments attached"
      : `${sentLabels.join(", ")} · ${sentLabels.length} ${sentLabels.length === 1 ? "moment" : "moments"} attached`;

  return createPortal(
    <div className={`assistant-root${closing ? " is-closing" : ""}`} data-placement={docked ? "dock" : "float"}>
      <div className="assistant-scrim" aria-hidden="true" onClick={docked ? undefined : dismiss} />
      <div ref={anchorRef} className="assistant-anchor" style={{ "--sidebar-w": sidebarWidth } as CSSProperties}>
        <div
          ref={sheetRef}
          className={`assistant-sheet${entering && !closing ? " is-entering" : ""}${closing ? " is-closing" : ""}${stage >= 2 && !docked ? " locked" : ""}`}
          role="dialog"
          aria-modal={docked ? "false" : "true"}
          aria-labelledby="assistant-question"
        >
          <span className="assistant-grab" aria-hidden="true" />
          <header className="assistant-head">
            <span className="assistant-mark" aria-hidden="true">
              <img src="./aria-logo.png" alt="" width={16} height={10} />
            </span>
            <span className="assistant-id">
              <span className="assistant-name">Aria AI Assistant</span>
            </span>
            <div className="assistant-tools">
              {dockAvailable ? (
                <button className="assistant-mode" type="button" aria-label={docked ? "Float assistant" : "Dock assistant to the side"} onClick={onToggleDock}>
                  {docked ? <Icons.float /> : <Icons.dock />}
                </button>
              ) : null}
              <button ref={closeRef} className="assistant-close" type="button" aria-label="Close assistant (Escape)" data-focus-quiet={quietFocus === "close" ? "" : undefined} onClick={dismiss}>
                <Icons.close />
              </button>
            </div>
          </header>

          <div className="assistant-surface">
          <div
            className="assistant-spine"
            role="progressbar"
            aria-label="Answer progress"
            aria-valuemin={1}
            aria-valuemax={STAGES.length}
            aria-valuenow={stage + 1}
            aria-valuetext={`${STAGES[stage]}, step ${stage + 1} of ${STAGES.length}`}
          >
            <span className="assistant-segs" aria-hidden="true">
              {STAGES.map((label, index) => (
                <span key={label} className="assistant-seg" data-s={index < stage ? "done" : index === stage ? "now" : "ahead"} />
              ))}
            </span>
            <span className="assistant-at">
              <b>{STAGES[stage]}</b> · {stage + 1} of {STAGES.length}
            </span>
          </div>

          <div ref={flowRef} className="assistant-flow" tabIndex={-1}>
            <p className="assistant-question" id="assistant-question">
              {prompt}
              {card ? <span className="assistant-meta">{card.rep} · {card.period}</span> : null}
            </p>
            <section className="assistant-stage" data-stage="answer">
              {!streamDone && statusLabel ? (
                <p className="assistant-status">
                  <span className="status-dot" data-busy="true" aria-hidden="true" />
                  <span>{statusLabel}</span>
                </p>
              ) : null}

              {deltas.length > 0 && stage < 2 ? (
                <p className="assistant-prose">
                  {deltas.map((delta, index) => (
                    <span className="chunk" key={index}>{delta}</span>
                  ))}
                  {!streamDone ? <span className="caret" aria-hidden="true" /> : null}
                </p>
              ) : null}

              {card ? (
                <CoachingCard
                  card={card}
                  openId={openSkillId}
                  compact={compact}
                  folded={folded}
                  filled={filled}
                  sentHint={sentHint}
                  onToggleSkill={toggleSkill}
                />
              ) : null}
            </section>

            {drafting ? (
              <section className="assistant-stage" data-stage="draft">
                <p className={`assistant-status${draftReady ? " settled" : ""}`}>
                  <span className="status-dot" data-busy={draftReady ? "false" : "true"} aria-hidden="true" />
                  <span>{draftReady ? "Drafted from the call evidence. Yours to edit." : "Drafting from the Brookfield evidence"}</span>
                </p>
                <p className="draft-to">
                  <span className="avatar cool" aria-hidden="true">MB</span>
                  <span>To <b>{card?.rep}</b> · goes to his inbox</span>
                </p>
                <div className="draft">
                  <textarea
                    ref={noteRef}
                    id="coaching-note"
                    aria-label={`Coaching note to ${card?.rep ?? "Marcus Bell"}`}
                    rows={8}
                    value={draftText}
                    readOnly={!draftReady}
                    onChange={(event) => setDraftText(event.target.value)}
                  />
                  {attachments.length > 0 ? (
                    <div className="attach">
                      {attachments.map((item) => (
                        <span key={item.id}>
                          {item.label}
                          <button type="button" aria-label={`Remove ${item.label}`} onClick={() => setAttachments((current) => current.filter((chip) => chip.id !== item.id))}>
                            <Icons.close aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <p className="hint">Scores stay with you. Marcus sees only what is attached here.</p>
              </section>
            ) : null}

            {stage === 3 ? (
              <section className="assistant-stage" data-stage="sent">
                <div className="receipt">
                  <span className="tick" aria-hidden="true"><Icons.check /></span>
                  <div>
                    <h4>Coaching note sent to Marcus</h4>
                    <p className="when">Today, 9:14 AM · from Jordan Ashby</p>
                    <p className="facts">{attachedSummary} · {sentEdited ? "sent with your edits" : "sent as drafted"}</p>
                  </div>
                </div>
                <p className="rehearsal">
                  <strong>Tomorrow, 9:00 AM</strong>
                  <span>15 min · both free, before Thursday's Brookfield security review.</span>
                </p>
              </section>
            ) : null}

            {stage === 4 && bookedWhen ? (
              <section className="assistant-stage" data-stage="booked">
                <div className="receipt">
                  <span className="tick" aria-hidden="true"><Icons.check /></span>
                  <div>
                    <h4 tabIndex={-1}>Rehearsal booked for {bookedWhen}</h4>
                    <p className="when">15 min · Jordan and Marcus · before Thursday's review</p>
                  </div>
                </div>
                <div>
                  <p className="happened">What happened</p>
                  <ul className="timeline">
                    <li>
                      <span className="tick" aria-hidden="true"><Icons.check /></span>
                      <p>6 discovery calls reviewed, three skills scored</p>
                      <span>9:12 AM</span>
                    </li>
                    <li>
                      <span className="tick" aria-hidden="true"><Icons.check /></span>
                      <p>Coaching note sent to Marcus</p>
                      <span>9:14 AM</span>
                    </li>
                    <li className="ahead">
                      <span className="pending" aria-hidden="true" />
                      <p>Re-score after the review <span className="sr-only">(scheduled, not yet done)</span></p>
                      <span>Thursday</span>
                    </li>
                  </ul>
                </div>
                <p className="hint">Two other reps have moments waiting. Lena Ortiz has the oldest.</p>
              </section>
            ) : null}
          </div>

          {card ? (
            <footer className="assistant-dock">
              {stage < 2 ? (
                <div className="acts">
                  <button className="btn" type="button" onClick={dismiss}>
                    Not now
                  </button>
                  <button ref={draftButtonRef} className="btn primary" type="button" onClick={startDraft}>
                    Draft the coaching note
                  </button>
                </div>
              ) : null}
              {drafting ? (
                <div className="acts">
                  <button className="btn" type="button" onClick={backToCard} disabled={sending}>
                    Back to the card
                  </button>
                  <button className="btn primary" type="button" id="send-note" disabled={!draftReady || sending} onClick={sendNote}>
                    {sending ? <span className="spin" aria-hidden="true" /> : null}
                    {sending ? "Sending" : "Send to Marcus"}
                  </button>
                </div>
              ) : null}
              {stage === 3 ? (
                <>
                  <p className="recall">
                    <button className="linkbtn" type="button" onClick={recall} disabled={recallClosed}>Recall note</button>
                    <span className="clock">{recallClosed || recallLeft === null ? "recall window closed" : formatLeft(recallLeft)}</span>
                  </p>
                  <div className="acts">
                    <button className="btn" type="button" onClick={dismiss}>Not now</button>
                    <button ref={bookRef} className="btn primary" type="button" onClick={book}>Book the rehearsal</button>
                  </div>
                </>
              ) : null}
              {stage === 4 ? (
                <div className="acts">
                  <button ref={homeRef} className="btn primary" type="button" data-focus-quiet={quietFocus === "home" ? "" : undefined} onClick={dismiss}>Back to Home</button>
                </div>
              ) : null}
            </footer>
          ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
