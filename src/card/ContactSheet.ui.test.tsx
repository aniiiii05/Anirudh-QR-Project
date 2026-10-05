import { useRef, useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContactSheet, { type SheetView } from "./ContactSheet";
import { profile } from "./profile";

function Harness({
  view: initialView = "connect",
  subject = "",
  navigate = vi.fn(),
}: {
  view?: SheetView;
  subject?: string;
  navigate?: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SheetView>(initialView);
  const opener = useRef<HTMLElement | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          opener.current = e.currentTarget;
          setOpen(true);
        }}
      >
        Open sheet
      </button>
      <ContactSheet
        open={open}
        view={view}
        subject={subject}
        onOpenChange={setOpen}
        onViewChange={setView}
        returnFocus={opener}
        navigate={navigate}
      />
    </>
  );
}

type FetchCall = { url: string; init?: RequestInit };
let calls: FetchCall[] = [];

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return handler(url, init);
    }),
  );
}

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

function openSheet() {
  fireEvent.click(screen.getByRole("button", { name: "Open sheet" }));
  return screen.getByRole("dialog");
}

// jsdom lacks AbortSignal.timeout (real browsers have it); contactClient uses it.
if (typeof AbortSignal.timeout !== "function") {
  (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout = (ms) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

beforeEach(() => {
  history.replaceState(null, "", "/card?utm_source=card#work");
  mockFetch(() => new Response("not found", { status: 404 }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Contact sheet — connect view", () => {
  it("offers email, LinkedIn, GitHub, Save contact and Copy link", () => {
    render(<Harness subject="The useful workflow" />);
    const dialog = openSheet();
    const email = within(dialog).getByRole("link", { name: /Email/ });
    expect(email.getAttribute("href")).toBe(
      `mailto:${profile.email}?subject=${encodeURIComponent("The useful workflow")}`,
    );
    for (const [name, href] of [
      [/LinkedIn/, profile.linkedin],
      [/GitHub/, profile.github],
    ] as const) {
      const link = within(dialog).getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    const vcf = within(dialog).getByRole("link", { name: /Save contact/ });
    expect(vcf).toHaveAttribute("href", "/contact.vcf");
    expect(vcf).toHaveAttribute("download");
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("copies the canonical /card URL without query or hash and announces it", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Harness />);
    const dialog = openSheet();
    fireEvent.click(within(dialog).getByRole("button", { name: /Copy link/ }));
    await waitFor(() => expect(within(dialog).getByText("Link copied")).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/card`);
    expect(within(dialog).getByText("Link copied")).toHaveAttribute("role", "status");
  });

  it("falls back to a selectable read-only field when the Clipboard API fails", async () => {
    const writeText = vi.fn(async () => {
      throw new Error("denied");
    });
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Harness />);
    const dialog = openSheet();
    fireEvent.click(within(dialog).getByRole("button", { name: /Copy link/ }));
    const field = await within(dialog).findByLabelText(/select and copy this link/);
    expect(field).toHaveAttribute("readonly");
    expect(field).toHaveValue(`${window.location.origin}/card`);
    expect((field as HTMLInputElement).value).not.toMatch(/[?#]/);
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open sheet" });
    trigger.focus();
    openSheet();
    await waitFor(() => expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement));
    fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe("Contact sheet — compose view", () => {
  it("uses honest email-draft mode when delivery is not configured", async () => {
    const navigate = vi.fn();
    render(<Harness view="compose" subject="One small intention" navigate={navigate} />);
    const dialog = openSheet();
    await within(dialog).findByText("Opens your own email app — this page does not send messages.");
    expect(calls[0].url).toBe("/api/contact");
    expect(within(dialog).queryByLabelText(/I understand Anirudh may reply by email/)).toBeNull();

    const submit = within(dialog).getByRole("button", { name: "Open email draft" });
    fireEvent.click(submit);
    expect(within(dialog).getByText("Write a few words first.")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/Your name/), { target: { value: "Sam" } });
    fireEvent.change(within(dialog).getByLabelText("Your message"), {
      target: { value: "A thought about your demo." },
    });
    fireEvent.change(within(dialog).getByLabelText(/Context link/), {
      target: { value: "http://insecure.example" },
    });
    fireEvent.click(submit);
    expect(within(dialog).getByText("Use an HTTPS link.")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText(/Context link/), {
      target: { value: "https://example.com/idea" },
    });
    fireEvent.click(submit);
    expect(navigate).toHaveBeenCalledTimes(1);
    const url = navigate.mock.calls[0][0] as string;
    expect(url.startsWith(`mailto:${profile.email}?`)).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("subject")).toBe("One small intention");
    expect(params.get("body")).toContain("A thought about your demo.");
    expect(params.get("body")).toContain("— Sam");
    expect(params.get("body")).toContain("Context: https://example.com/idea");
    expect(
      within(dialog).getByText(
        "Your email app should open with a draft. Nothing has been sent yet — press send there.",
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue(profile.email)).toHaveAttribute("readonly");
  });

  it("keeps a half-written draft across view switches and Escape, without re-checking delivery", async () => {
    render(<Harness view="compose" />);
    let dialog = openSheet();
    await within(dialog).findByText("Opens your own email app — this page does not send messages.");
    fireEvent.change(within(dialog).getByLabelText("Your message"), {
      target: { value: "Half a thought" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Just connect" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Share a thought" }));
    expect(within(dialog).queryByText("Checking how messages can reach me…")).toBeNull();
    expect(within(dialog).getByLabelText("Your message")).toHaveValue("Half a thought");

    fireEvent.keyDown(within(dialog).getByLabelText("Your message"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    dialog = openSheet();
    expect(within(dialog).getByLabelText("Your message")).toHaveValue("Half a thought");
    expect(calls).toHaveLength(1);
  });

  it("shows the validated form when the server reports delivery is enabled", async () => {
    let post = 0;
    mockFetch((url, init) => {
      if (!init || init.method === "GET") return json({ enabled: true });
      post += 1;
      if (post === 1) return json({ error: "x" }, { status: 502 });
      if (post === 2) return json({ error: "slow down" }, { status: 429, headers: { "Retry-After": "120" } });
      return json({ ok: true, requestId: "r1" });
    });
    render(<Harness view="compose" subject="The operations lens" />);
    const dialog = openSheet();
    const consent = await within(dialog).findByLabelText("I understand Anirudh may reply by email");

    // Honeypot is hidden from assistive tech and keyboard.
    const honeypot = dialog.querySelector(".honeypot")!;
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
    expect(honeypot.querySelector("input")).toHaveAttribute("tabindex", "-1");

    const send = within(dialog).getByRole("button", { name: "Send message" });
    fireEvent.click(send);
    const name = within(dialog).getByLabelText("Your name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    const errorId = name.getAttribute("aria-describedby")!;
    expect(document.getElementById(errorId)).toHaveTextContent("Use at least 2 characters.");
    expect(within(dialog).getByText("Please confirm that Anirudh may reply by email.")).toBeInTheDocument();
    expect(name).toHaveFocus();

    fireEvent.change(name, { target: { value: "Sample Person" } });
    fireEvent.change(within(dialog).getByLabelText("Your email"), {
      target: { value: "sample@example.com" },
    });
    fireEvent.change(within(dialog).getByLabelText("Your message"), {
      target: { value: "Here is a small bottleneck worth a look." },
    });
    fireEvent.click(consent);

    fireEvent.click(send);
    await within(dialog).findByText(
      "That didn't send. Your message is still here—please retry or use email.",
    );
    expect(within(dialog).getByLabelText("Your message")).toHaveValue(
      "Here is a small bottleneck worth a look.",
    );
    const postCalls = () => calls.filter((c) => c.init?.method === "POST");
    const key1 = (postCalls()[0].init!.headers as Record<string, string>)["Idempotency-Key"];
    expect(key1).toMatch(/^[a-zA-Z0-9-]{16,80}$/);

    // Same content → same key; 429 → retry hint.
    fireEvent.click(within(dialog).getByRole("button", { name: "Send message" }));
    await within(dialog).findByText(/try again in about 2 minutes/);
    const key2 = (postCalls()[1].init!.headers as Record<string, string>)["Idempotency-Key"];
    expect(key2).toBe(key1);

    // Changed content → new key; success clears the form.
    fireEvent.change(within(dialog).getByLabelText("Your message"), {
      target: { value: "Here is a small bottleneck worth a look, edited." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Send message" }));
    await within(dialog).findByText("Received. I’ll read this and get back to you when I can.");
    const key3 = (postCalls()[2].init!.headers as Record<string, string>)["Idempotency-Key"];
    expect(key3).not.toBe(key1);
    expect(within(dialog).getByLabelText("Your message")).toHaveValue("");
    expect(within(dialog).getByRole("link", { name: "How your message is handled" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });

  it("disables the submit button while a request is in flight", async () => {
    let release: (r: Response) => void = () => {};
    mockFetch((url, init) => {
      if (!init || init.method === "GET") return json({ enabled: true });
      return new Promise<Response>((resolve) => (release = resolve));
    });
    render(<Harness view="compose" />);
    const dialog = openSheet();
    await within(dialog).findByLabelText("I understand Anirudh may reply by email");
    fireEvent.change(within(dialog).getByLabelText("Your name"), { target: { value: "Sam Sample" } });
    fireEvent.change(within(dialog).getByLabelText("Your email"), { target: { value: "s@example.com" } });
    fireEvent.change(within(dialog).getByLabelText("Your message"), {
      target: { value: "Twenty characters or more here." },
    });
    fireEvent.click(within(dialog).getByLabelText("I understand Anirudh may reply by email"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Send message" }));
    const busy = await within(dialog).findByRole("button", { name: "Sending…" });
    expect(busy).toBeDisabled();
    fireEvent.click(busy);
    expect(calls.filter((c) => c.init?.method === "POST")).toHaveLength(1);
    release(json({ ok: true }));
    await within(dialog).findByText("Received. I’ll read this and get back to you when I can.");
  });
});
