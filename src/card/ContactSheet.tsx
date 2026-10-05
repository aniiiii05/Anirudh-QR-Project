import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { profile } from "./profile";
import { contactSchema } from "./logic";
import {
  emailDraftUrl,
  fetchContactStatus,
  sendContact,
  type ContactInput,
} from "./contactClient";
import { Arrow, CopyFeedback } from "./sections/bits";
import { useCopyLink } from "./sections/useCopyLink";

export type SheetView = "connect" | "compose";

export const DEFAULT_SUBJECT = "Hello from your card";

type Props = {
  open: boolean;
  view: SheetView;
  /** Prefilled subject, e.g. a project's askSubject. Empty for a general hello. */
  subject: string;
  onOpenChange: (open: boolean) => void;
  onViewChange: (view: SheetView) => void;
  /** Element to focus again when the sheet closes (the trigger). */
  returnFocus: MutableRefObject<HTMLElement | null>;
  /** Navigation hook for the mailto: draft; injectable for tests. */
  navigate?: (url: string) => void;
};

const defaultNavigate = (url: string) => window.location.assign(url);

/**
 * Lives as long as the sheet component (i.e. the page), so a half-written
 * message survives switching views or an accidental Escape, and the delivery
 * check is not repeated with a "checking…" flash.
 */
type DraftStore = {
  mode: "draft" | "form" | null;
  draft: { name: string; message: string; link: string };
  form: FormState;
  formKey: { fingerprint: string; key: string } | null;
};

export default function ContactSheet({
  open,
  view,
  subject,
  onOpenChange,
  onViewChange,
  returnFocus,
  navigate = defaultNavigate,
}: Props) {
  const resolvedSubject = subject || DEFAULT_SUBJECT;
  const store = useRef<DraftStore>({
    mode: null,
    draft: { name: "", message: "", link: "" },
    form: emptyForm,
    formKey: null,
  }).current;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="contact-sheet"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        <div className="sheet__top">
          <p className="mono sheet__kicker">
            AS<span className="sheet__dot">.</span> / SAY HELLO
          </p>
          <div className="segmented segmented--sheet" role="group" aria-label="How to get in touch">
            <button
              type="button"
              className="segmented__option"
              aria-pressed={view === "connect"}
              onClick={() => onViewChange("connect")}
            >
              Just connect
            </button>
            <button
              type="button"
              className="segmented__option"
              aria-pressed={view === "compose"}
              onClick={() => onViewChange("compose")}
            >
              Share a thought
            </button>
          </div>
        </div>
        <DialogTitle className="sheet__title">
          {view === "connect" ? "Let’s connect." : "Share a thought."}
        </DialogTitle>
        <DialogDescription className="sheet__desc">
          {view === "connect"
            ? "Pick whatever’s easiest. Email reaches me directly."
            : subject
              ? `About: ${subject}. A question, a thought or a small bottleneck — all welcome.`
              : "A small bottleneck, an interesting idea, or simply hello."}
        </DialogDescription>
        {view === "connect" ? (
          <ConnectView subject={resolvedSubject} />
        ) : (
          <ComposeView subject={resolvedSubject} navigate={navigate} store={store} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

function LinkRow({
  href,
  label,
  detail,
  external,
  download,
  icon = <Arrow />,
}: {
  href: string;
  label: string;
  detail: string;
  external?: boolean;
  download?: boolean;
  icon?: ReactNode;
}) {
  return (
    <li>
      <a
        className="link-row"
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...(download ? { download: "" } : {})}
      >
        <span className="link-row__label">
          {label}
          {external && <span className="sr-only"> (opens in a new tab)</span>}
        </span>
        <span className="link-row__detail">{detail}</span>
        <span className="link-row__icon">{icon}</span>
      </a>
    </li>
  );
}

function ConnectView({ subject }: { subject: string }) {
  const { state, url, copy } = useCopyLink();
  const host = (href: string) => href.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
  return (
    <div className="sheet__body">
      <ul className="link-rows">
        <LinkRow
          href={`mailto:${profile.email}?subject=${encodeURIComponent(subject)}`}
          label="Email"
          detail={profile.email}
        />
        <LinkRow href={profile.linkedin} label="LinkedIn" detail={host(profile.linkedin)} external />
        <LinkRow href={profile.github} label="GitHub" detail={host(profile.github)} external />
        <LinkRow
          href="/contact.vcf"
          label="Save contact"
          detail="vCard — name, email and profile link"
          download
          icon={<span aria-hidden="true">↓</span>}
        />
        <li>
          <button type="button" className="link-row" onClick={copy}>
            <span className="link-row__label">Copy link</span>
            <span className="link-row__detail">The address of this page</span>
            <span className="link-row__icon" aria-hidden="true">
              ⧉
            </span>
          </button>
        </li>
      </ul>
      <CopyFeedback state={state} url={url} id="sheet-copy-fallback" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Mode = "checking" | "draft" | "form";

function ComposeView({
  subject,
  navigate,
  store,
}: {
  subject: string;
  navigate: (url: string) => void;
  store: DraftStore;
}) {
  const [mode, setMode] = useState<Mode>(store.mode ?? "checking");
  useEffect(() => {
    if (store.mode) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    let alive = true;
    fetchContactStatus(controller.signal).then((enabled) => {
      if (!alive) return;
      store.mode = enabled ? "form" : "draft";
      setMode(store.mode);
    });
    return () => {
      alive = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [store]);

  if (mode === "checking")
    return (
      <div className="sheet__body">
        <p className="sheet__checking" role="status">
          Checking how messages can reach me…
        </p>
      </div>
    );
  if (mode === "draft") return <DraftMode subject={subject} navigate={navigate} store={store} />;
  return <FormMode subject={subject} store={store} />;
}

/* Email-draft mode: honest default while direct delivery is not configured. */

function DraftMode({
  subject,
  navigate,
  store,
}: {
  subject: string;
  navigate: (url: string) => void;
  store: DraftStore;
}) {
  const id = useId();
  const [name, setName] = useState(store.draft.name);
  const [message, setMessage] = useState(store.draft.message);
  const [link, setLink] = useState(store.draft.link);
  useEffect(() => {
    store.draft = { name, message, link };
  }, [store, name, message, link]);
  const [errors, setErrors] = useState<{ message?: string; link?: string }>({});
  const [opened, setOpened] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [addressCopied, setAddressCopied] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!message.trim()) next.message = "Write a few words first.";
    const trimmed = link.trim();
    if (trimmed) {
      try {
        if (new URL(trimmed).protocol !== "https:") next.link = "Use an HTTPS link.";
      } catch {
        next.link = "Use a full link starting with https://";
      }
    }
    return next;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (next.message) return messageRef.current?.focus();
    if (next.link) return linkRef.current?.focus();
    const lines = [message.trim()];
    if (name.trim()) lines.push("", `— ${name.trim()}`);
    if (link.trim()) lines.push("", `Context: ${link.trim()}`);
    navigate(emailDraftUrl(profile.email, subject, lines.join("\n")));
    setOpened(true);
  }

  return (
    <form className="sheet__body sheet__form" onSubmit={onSubmit} noValidate>
      <p className="sheet__notice">
        <span className="mono sheet__notice-tag">Email draft</span>
        Opens your own email app — this page does not send messages.
      </p>
      <p className="sheet__subject">
        <span className="mono">Subject</span> {subject}
      </p>
      <div className="field">
        <label className="field__label" htmlFor={`${id}-name`}>
          Your name <span className="field__opt">(optional)</span>
        </label>
        <input
          id={`${id}-name`}
          className="field__input"
          type="text"
          autoComplete="name"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${id}-message`}>
          Your message
        </label>
        <textarea
          ref={messageRef}
          id={`${id}-message`}
          className="field__input field__input--area"
          rows={5}
          maxLength={1200}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? `${id}-message-error` : undefined}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {errors.message && (
          <p className="field__error" id={`${id}-message-error`}>
            {errors.message}
          </p>
        )}
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${id}-link`}>
          Context link <span className="field__opt">(optional)</span>
        </label>
        <input
          ref={linkRef}
          id={`${id}-link`}
          className="field__input"
          type="url"
          inputMode="url"
          maxLength={500}
          aria-invalid={!!errors.link}
          aria-describedby={errors.link ? `${id}-link-error` : undefined}
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        {errors.link && (
          <p className="field__error" id={`${id}-link-error`}>
            {errors.link}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn--ink sheet__submit">
        Open email draft <Arrow />
      </button>
      <div className="sheet__result" role="status">
        {opened && (
          <p>Your email app should open with a draft. Nothing has been sent yet — press send there.</p>
        )}
      </div>
      {opened && (
        <div className="sheet__fallback">
          <p>No email app opened? Write to this address instead:</p>
          <div className="sheet__fallback-row">
            <input
              className="field__input"
              type="text"
              readOnly
              aria-label="Email address"
              value={profile.email}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="btn btn--line btn--small"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(profile.email);
                  setAddressCopied(true);
                } catch {
                  setAddressCopied(false);
                }
              }}
            >
              Copy address
            </button>
          </div>
          <p className="copy-status" role="status">
            {addressCopied ? "Address copied" : ""}
          </p>
        </div>
      )}
    </form>
  );
}

/* Form mode: only when the server reports that delivery is configured. */

type FormState = {
  name: string;
  email: string;
  message: string;
  contextUrl: string;
  consent: boolean;
  website: string;
};

type FieldKey = "name" | "email" | "message" | "contextUrl" | "consent";

const emptyForm: FormState = {
  name: "",
  email: "",
  message: "",
  contextUrl: "",
  consent: false,
  website: "",
};

/** A fresh idempotency key (16–80 chars of [A-Za-z0-9-], as the API requires). */
function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function")
    crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return `key-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "error" }
  | { kind: "limited"; minutes?: number };

function FormMode({ subject, store }: { subject: string; store: DraftStore }) {
  const id = useId();
  const [form, setForm] = useState<FormState>(store.form);
  useEffect(() => {
    store.form = form;
  }, [store, form]);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  /** Kept in the store so a retry after switching views reuses the same key. */
  const keyRef = {
    get current() {
      return store.formKey;
    },
    set current(value: { fingerprint: string; key: string } | null) {
      store.formKey = value;
    },
  };
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const sending = status.kind === "sending";

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (status.kind === "success") setStatus({ kind: "idle" });
  };

  /** Same content → same key, so a retry is recognised; changed content → new key. */
  function idempotencyKeyFor(data: ContactInput) {
    const fingerprint = JSON.stringify(data);
    if (keyRef.current?.fingerprint === fingerprint) return keyRef.current.key;
    const key = newIdempotencyKey();
    keyRef.current = { fingerprint, key };
    return key;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as FieldKey;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const order: FieldKey[] = ["name", "email", "message", "contextUrl", "consent"];
      const first = order.find((key) => next[key]);
      if (first) fieldRefs.current[first]?.focus();
      return;
    }
    setErrors({});
    setStatus({ kind: "sending" });
    const data: ContactInput = parsed.data;
    const result = await sendContact(data, idempotencyKeyFor(data));
    if (result.ok) {
      setStatus({ kind: "success" });
      setForm(emptyForm);
      keyRef.current = null;
      return;
    }
    if (result.status === 429) {
      setStatus({
        kind: "limited",
        minutes: result.retryAfter ? Math.max(1, Math.ceil(result.retryAfter / 60)) : undefined,
      });
      return;
    }
    setStatus({ kind: "error" });
  }

  const describedBy = (key: FieldKey, hint?: string) =>
    [hint, errors[key] ? `${id}-${key}-error` : ""].filter(Boolean).join(" ") || undefined;

  const error = (key: FieldKey) =>
    errors[key] ? (
      <p className="field__error" id={`${id}-${key}-error`}>
        {errors[key]}
      </p>
    ) : null;

  return (
    <form className="sheet__body sheet__form" onSubmit={onSubmit} noValidate>
      <p className="sheet__subject">
        <span className="mono">Subject</span> {subject}
      </p>
      <div className="field">
        <label className="field__label" htmlFor={`${id}-name`}>
          Your name
        </label>
        <input
          ref={(el) => (fieldRefs.current.name = el)}
          id={`${id}-name`}
          className="field__input"
          type="text"
          autoComplete="name"
          maxLength={80}
          required
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name")}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        {error("name")}
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${id}-email`}>
          Your email
        </label>
        <input
          ref={(el) => (fieldRefs.current.email = el)}
          id={`${id}-email`}
          className="field__input"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email")}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        {error("email")}
      </div>
      <div className="field">
        <div className="field__row">
          <label className="field__label" htmlFor={`${id}-message`}>
            Your message
          </label>
          <span className="field__count" id={`${id}-message-count`}>
            {form.message.length} / 1200
          </span>
        </div>
        <textarea
          ref={(el) => (fieldRefs.current.message = el)}
          id={`${id}-message`}
          className="field__input field__input--area"
          rows={5}
          maxLength={1200}
          required
          aria-invalid={!!errors.message}
          aria-describedby={describedBy("message", `${id}-message-count`)}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
        />
        {error("message")}
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${id}-contextUrl`}>
          Context link <span className="field__opt">(optional, https://)</span>
        </label>
        <input
          ref={(el) => (fieldRefs.current.contextUrl = el)}
          id={`${id}-contextUrl`}
          className="field__input"
          type="url"
          inputMode="url"
          maxLength={500}
          aria-invalid={!!errors.contextUrl}
          aria-describedby={describedBy("contextUrl")}
          value={form.contextUrl}
          onChange={(e) => set("contextUrl", e.target.value)}
        />
        {error("contextUrl")}
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>
      <div className="field">
        <label className="consent" htmlFor={`${id}-consent`}>
          <input
            ref={(el) => (fieldRefs.current.consent = el)}
            id={`${id}-consent`}
            type="checkbox"
            className="consent__box"
            checked={form.consent}
            aria-invalid={!!errors.consent}
            aria-describedby={describedBy("consent")}
            onChange={(e) => set("consent", e.target.checked)}
          />
          <span>I understand Anirudh may reply by email</span>
        </label>
        {error("consent")}
      </div>
      <button
        type="submit"
        className="btn btn--ink sheet__submit"
        disabled={sending}
        aria-disabled={sending}
      >
        {sending ? "Sending…" : (
          <>
            Send message <Arrow />
          </>
        )}
      </button>
      <div className="sheet__result" role="status" aria-live="polite">
        {status.kind === "success" && (
          <p className="sheet__ok">Received. I’ll read this and get back to you when I can.</p>
        )}
        {status.kind === "error" && (
          <p className="sheet__bad">
            {"That didn't send. Your message is still here—please retry or use email."}
          </p>
        )}
        {status.kind === "limited" && (
          <p className="sheet__bad">
            Too many messages from here just now.{" "}
            {status.minutes
              ? `Please try again in about ${status.minutes} minute${status.minutes === 1 ? "" : "s"}`
              : "Please wait a few minutes and try again"}
            , or use <a href={`mailto:${profile.email}`}>email</a>. Your message is still here.
          </p>
        )}
      </div>
      <p className="sheet__privacy">
        <a href="/privacy">How your message is handled</a>
      </p>
    </form>
  );
}
