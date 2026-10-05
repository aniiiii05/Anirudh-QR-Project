import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectId } from "./profile";

// The 3D workspace is owned and tested separately; here only its onExplore contract matters.
vi.mock("./Workspace3D", () => ({
  default: ({ onExplore }: { onExplore: (id: ProjectId) => void }) => (
    <button type="button" onClick={() => onExplore("workflow")}>
      Mock explore workflow
    </button>
  ),
}));

import Card from "./Card";

const scrollSpy = vi.fn();

beforeEach(() => {
  scrollSpy.mockClear();
  Element.prototype.scrollIntoView = scrollSpy;
  history.replaceState(null, "", "/card");
  // Contact status check: no server in tests → email-draft mode.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("not found", { status: 404 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const toggle = (name: string) => screen.getByRole("button", { name });

describe("Card page", () => {
  it("renders the exact hero copy with a single h1 and the section order", () => {
    const { container } = render(<Card />);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Hi, I'm Anirudh.");
    expect(screen.getByText("YOU FOUND MY OFFLINE PROFILE.")).toBeInTheDocument();
    expect(container.querySelector(".hero__statement")).toHaveTextContent(
      /^I turn messy ideas into useful systems\.$/,
    );
    expect(
      screen.getByText("Data brain. Product curiosity. A soft spot for automating the boring bits."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The card worked. Now let's make the conversation interesting."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See what I make" })).toHaveAttribute("href", "#work");
    expect(screen.getByText("A few things I've made, mapped, or made easier.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "What should we make less annoying?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tell me about a small bottleneck or an interesting idea. I like thoughtful problems.",
      ),
    ).toBeInTheDocument();
    for (const name of ["Share a thought", "Just connect", "Say hello"])
      expect(screen.getAllByRole("button", { name }).length).toBeGreaterThan(0);
    expect(screen.getByText("You scanned. We should probably say hi.")).toBeInTheDocument();
    expect(
      screen.getByText(`Anirudh Sharma © ${new Date().getFullYear()}`),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");

    const ids = Array.from(container.querySelectorAll("main > section")).map(
      (s) => s.id || s.className.split(" ")[0],
    );
    expect(ids).toEqual(["hero", "caps", "work", "about", "say-hello"]);
  });

  it("capability strip uses real toggle buttons with aria-pressed and a polite readout", () => {
    render(<Card />);
    const data = toggle("DATA");
    const automation = toggle("AUTOMATION");
    const product = toggle("PRODUCT");
    expect(data).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Find the signal. Make it useful.")).toBeInTheDocument();

    fireEvent.click(automation);
    expect(automation).toHaveAttribute("aria-pressed", "true");
    expect(data).toHaveAttribute("aria-pressed", "false");
    const line = screen.getByText("Give the repetitive work a better job.");
    expect(line.closest("[aria-live='polite']")).not.toBeNull();

    // Arrow keys move selection and focus.
    fireEvent.keyDown(automation, { key: "ArrowRight" });
    expect(product).toHaveAttribute("aria-pressed", "true");
    expect(product).toHaveFocus();
    expect(screen.getByText("Make the idea real enough to test.")).toBeInTheDocument();
    fireEvent.keyDown(product, { key: "ArrowRight" });
    expect(data).toHaveAttribute("aria-pressed", "true");
  });

  it("expands one work story at a time and keeps the fragment useful", () => {
    render(<Card />);
    const ops = toggle("The operations lens");
    const flow = toggle("The useful workflow");
    expect(ops.tagName).toBe("BUTTON");
    expect(ops).toHaveAttribute("aria-expanded", "false");
    expect(ops).toHaveAttribute("aria-controls", "operations-detail");
    expect(document.getElementById("operations-detail")).not.toBeVisible();

    fireEvent.click(ops);
    expect(ops).toHaveAttribute("aria-expanded", "true");
    expect(window.location.hash).toBe("#operations");
    const detail = document.getElementById("operations-detail")!;
    expect(within(detail).getByText("What this is")).toBeInTheDocument();
    expect(within(detail).getByText("Honest state")).toBeInTheDocument();
    expect(within(detail).getByRole("button", { name: "Ask me about this" })).toBeInTheDocument();

    fireEvent.click(flow);
    expect(flow).toHaveAttribute("aria-expanded", "true");
    expect(ops).toHaveAttribute("aria-expanded", "false");
    expect(window.location.hash).toBe("#workflow");

    fireEvent.click(flow);
    expect(flow).toHaveAttribute("aria-expanded", "false");
    expect(window.location.hash).toBe("#work");
  });

  it("Escape inside an open story collapses it and returns focus to its toggle", () => {
    render(<Card />);
    const flow = toggle("The useful workflow");
    fireEvent.click(flow);
    const textarea = screen.getByLabelText("Paste messy notes");
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(flow).toHaveAttribute("aria-expanded", "false");
    expect(flow).toHaveFocus();
    expect(screen.queryByLabelText("Paste messy notes")).toBeNull();
  });

  it("opens and scrolls to the story named in the URL fragment on load", async () => {
    history.replaceState(null, "", "/card#practice");
    render(<Card />);
    expect(toggle("One small intention")).toHaveAttribute("aria-expanded", "true");
    expect(toggle("The operations lens")).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(scrollSpy).toHaveBeenCalled());
    expect(scrollSpy.mock.contexts.at(-1)).toBe(document.getElementById("practice"));
  });

  it("follows hash changes to other stories", async () => {
    render(<Card />);
    act(() => {
      window.location.hash = "#operations";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await waitFor(() =>
      expect(toggle("The operations lens")).toHaveAttribute("aria-expanded", "true"),
    );
  });

  it("onExplore from the 3D workspace opens the item, updates the hash and scrolls", async () => {
    render(<Card />);
    fireEvent.click(screen.getByRole("button", { name: "Mock explore workflow" }));
    expect(toggle("The useful workflow")).toHaveAttribute("aria-expanded", "true");
    expect(window.location.hash).toBe("#workflow");
    await waitFor(() => expect(scrollSpy).toHaveBeenCalled());
    expect(scrollSpy.mock.calls.at(-1)?.[0]).toMatchObject({ block: "start" });
  });

  it("onExplore on an already-open item still scrolls it into view, with no stale scroll later", async () => {
    render(<Card />);
    const explore = screen.getByRole("button", { name: "Mock explore workflow" });
    fireEvent.click(explore);
    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1));
    fireEvent.click(explore);
    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(2));
    expect(toggle("The useful workflow")).toHaveAttribute("aria-expanded", "true");
    // Collapse and reopen via the toggle: no leftover request should scroll.
    fireEvent.click(toggle("The useful workflow"));
    fireEvent.click(toggle("The useful workflow"));
    await new Promise((r) => setTimeout(r, 50));
    expect(scrollSpy).toHaveBeenCalledTimes(2);
  });

  it("an open story leads with its demo, uses honest per-project state and no repeated outcome", () => {
    const { container } = render(<Card />);
    fireEvent.click(toggle("The useful workflow"));
    const item = container.querySelector("#workflow") as HTMLElement;
    expect(within(item).getByText("Working demo · runs on what you paste, in this tab only.")).toBeInTheDocument();
    expect(within(item).getAllByText("Less copying between tabs. More time to think.")).toHaveLength(1);
    const detail = item.querySelector(".work-item__detail") as HTMLElement;
    const demo = detail.querySelector(".work-item__demo") as HTMLElement;
    const story = detail.querySelector(".story") as HTMLElement;
    expect(demo.compareDocumentPosition(story) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("'Ask me about this' opens the contact sheet with the project's subject", async () => {
    render(<Card />);
    fireEvent.click(toggle("The operations lens"));
    fireEvent.click(screen.getByRole("button", { name: "Ask me about this" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Share a thought.")).toBeInTheDocument();
    await waitFor(() =>
      expect(within(dialog).getByText(/this page does not send messages/)).toBeInTheDocument(),
    );
    expect(dialog.querySelector(".sheet__subject")).toHaveTextContent(
      "Subject The operations lens",
    );
  });

  it("About shows the background disclosure with education, skills, learning and languages", () => {
    render(<Card />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Curious by default. Practical on purpose." }),
    ).toBeInTheDocument();
    const details = screen.getByText("Background").closest("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(
      within(details).getByText(
        "B.Tech, Mechanical Engineering — National Institute of Technology Durgapur, 2022–2026",
      ),
    ).toBeInTheDocument();
    expect(within(details).getByText("Learning & credentials")).toBeInTheDocument();
    expect(within(details).getByText("Google AI Essentials")).toBeInTheDocument();
    expect(within(details).getByText("Languages")).toBeInTheDocument();
    expect(
      screen.getByText("Personal work and opinions; no employer affiliation implied."),
    ).toBeInTheDocument();
  });
});
