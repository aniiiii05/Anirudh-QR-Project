import { useCallback, useEffect, useRef, useState } from "react";
import { canonicalCardUrl } from "./motion";

export type CopyState = "idle" | "copied" | "fallback";

/**
 * Copies the canonical /card address. When the Clipboard API is missing or
 * refused, the caller shows a selectable read-only field instead.
 */
export function useCopyLink() {
  const [state, setState] = useState<CopyState>("idle");
  const [url, setUrl] = useState("");
  const timer = useRef<number | undefined>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async () => {
    const link = canonicalCardUrl();
    setUrl(link);
    window.clearTimeout(timer.current);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("No clipboard");
      await navigator.clipboard.writeText(link);
      setState("copied");
      timer.current = window.setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("fallback");
    }
  }, []);

  return { state, url, copy };
}
