import { useEffect, useRef } from "react";
import type { CopyState } from "./useCopyLink";

/** The ↗ that ends every call to action. Decorative: the words carry the meaning. */
export function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      ↗
    </span>
  );
}

/** The lime "idea tile" from the printed card — a rounded square with ↗. */
export function IdeaTile({ className = "" }: { className?: string }) {
  return (
    <span className={`idea-tile ${className}`} aria-hidden="true">
      <span className="idea-tile__arrow">↗</span>
    </span>
  );
}

/**
 * Polite announcement for "Copy link", plus a selectable read-only field when
 * the Clipboard API is unavailable or refused.
 */
export function CopyFeedback({
  state,
  url,
  id,
}: {
  state: CopyState;
  url: string;
  id: string;
}) {
  const fallbackRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state === "fallback") {
      fallbackRef.current?.focus();
      fallbackRef.current?.select();
    }
  }, [state]);
  return (
    <>
      <p className="copy-status" role="status" aria-live="polite">
        {state === "copied" ? "Link copied" : ""}
      </p>
      {state === "fallback" && (
        <div className="copy-fallback">
          <label htmlFor={id}>Copying didn’t work here — select and copy this link:</label>
          <input
            ref={fallbackRef}
            id={id}
            className="field__input"
            type="text"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      )}
    </>
  );
}
