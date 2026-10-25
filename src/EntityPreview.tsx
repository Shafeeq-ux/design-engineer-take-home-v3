import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type EntityPreviewProps = {
  id: string;
  label: ReactNode;
  children: ReactNode;
};

type PreviewPosition = {
  left: number;
  top: number;
  ready: boolean;
};

const VIEWPORT_GUTTER = 16;
const PREVIEW_GAP = 8;

export function EntityPreview({ id, label, children }: EntityPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PreviewPosition>({ left: 0, top: 0, ready: false });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<HTMLSpanElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openPreview = useCallback(() => {
    cancelClose();
    setPosition((current) => ({ ...current, ready: false }));
    setIsOpen(true);
  }, [cancelClose]);

  const closePreview = useCallback(() => {
    cancelClose();
    setIsOpen(false);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 100);
  }, [cancelClose]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const preview = previewRef.current;

    if (!trigger || !preview) return;

    const triggerRect = trigger.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();
    const maxLeft = Math.max(VIEWPORT_GUTTER, window.innerWidth - previewRect.width - VIEWPORT_GUTTER);
    const left = Math.min(Math.max(VIEWPORT_GUTTER, triggerRect.left), maxLeft);
    const fitsBelow = triggerRect.bottom + PREVIEW_GAP + previewRect.height <= window.innerHeight - VIEWPORT_GUTTER;
    const top = fitsBelow
      ? triggerRect.bottom + PREVIEW_GAP
      : Math.max(VIEWPORT_GUTTER, triggerRect.top - previewRect.height - PREVIEW_GAP);

    setPosition({ left, top, ready: true });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !previewRef.current?.contains(target)) {
        closePreview();
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, [closePreview, isOpen]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  return (
    <span className="entity-preview" onPointerEnter={openPreview} onPointerLeave={scheduleClose}>
      <button
        ref={triggerRef}
        className="chip"
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen((open) => !open)}
        onFocus={openPreview}
        onBlur={scheduleClose}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closePreview();
          }
        }}
      >
        {label}
      </button>

      {isOpen
        ? createPortal(
            <span
              ref={previewRef}
              className="hover-card"
              id={id}
              role="tooltip"
              data-ready={position.ready}
              style={{ left: position.left, top: position.top }}
              onPointerEnter={cancelClose}
              onPointerLeave={scheduleClose}
            >
              {children}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
