/** Small helpers shared by the page sections. CSS-first motion; JS only scrolls. */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scrolls an element into view, instantly when the visitor prefers reduced motion. */
export function scrollToElement(
  el: Element | null | undefined,
  { instant = false }: { instant?: boolean } = {},
) {
  if (!el || typeof (el as HTMLElement).scrollIntoView !== "function") return;
  (el as HTMLElement).scrollIntoView({
    behavior: instant || prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}

/** The canonical, shareable page address — never carries query strings or fragments. */
export function canonicalCardUrl(): string {
  return new URL("/card", window.location.origin).href;
}
