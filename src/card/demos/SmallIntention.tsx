import { useId, useState } from "react";

const LIMIT = 120;

/**
 * Product demo: one intention, one small next step, one completion toggle.
 * State lives in this component only — nothing is stored or sent.
 */
export default function SmallIntention({ outcome }: { outcome?: string }) {
  const [intention, setIntention] = useState("");
  const [step, setStep] = useState("");
  const [done, setDone] = useState(false);
  const id = useId();
  const ready = intention.trim() !== "" && step.trim() !== "";

  const stage = !intention.trim()
    ? 0
    : !step.trim()
      ? 1
      : done
        ? 3
        : 2;
  const stages = ["Name it", "Make it small", "Do it"];

  return (
    <div className="demo" role="group" aria-labelledby={`${id}-title`}>
      <div className="demo__bar">
        <span className="badge badge--demo">Exploring · demo</span>
        <span className="demo__name" id={`${id}-title`}>
          Intention → next step
        </span>
      </div>

      <ol className="journey" aria-label="Progress">
        {stages.map((label, i) => (
          <li
            key={label}
            className={`journey__step${stage > i ? " is-done" : ""}${
              stage === i ? " is-current" : ""
            }`}
          >
            <span className="journey__dot" aria-hidden="true">
              {stage > i ? "✓" : i + 1}
            </span>
            <span>
              {label}
              <span className="sr-only">
                {stage > i ? " (done)" : stage === i ? " (current)" : ""}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="field">
        <label className="field__label" htmlFor={`${id}-intention`}>
          One intention
        </label>
        <input
          id={`${id}-intention`}
          className="field__input"
          type="text"
          maxLength={LIMIT}
          autoComplete="off"
          placeholder="e.g. Make Sunday evenings calmer"
          value={intention}
          onChange={(e) => {
            setIntention(e.target.value);
            setDone(false);
          }}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${id}-step`}>
          One small next step
        </label>
        <input
          id={`${id}-step`}
          className="field__input"
          type="text"
          maxLength={LIMIT}
          autoComplete="off"
          placeholder="e.g. Write tomorrow’s top three tonight"
          value={step}
          onChange={(e) => {
            setStep(e.target.value);
            setDone(false);
          }}
        />
      </div>

      <button
        type="button"
        className={`toggle-done${done ? " is-done" : ""}`}
        aria-pressed={done}
        disabled={!ready}
        aria-describedby={ready ? undefined : `${id}-hint`}
        onClick={() => setDone((value) => !value)}
      >
        <span className="toggle-done__box" aria-hidden="true">
          {done ? "✓" : ""}
        </span>
        Step done
      </button>

      <div className="intention-card">
        {ready && (
          <p>
            <span className="intention-card__label">Intention</span>
            <span className="intention-card__text">{intention.trim()}</span>
            <span className="intention-card__label">Next</span>
            <span
              className={`intention-card__text${done ? " is-struck" : ""}`}
            >
              {step.trim()}
            </span>
          </p>
        )}
        {/* Only this short sentence is live — never the echoed input text. */}
        <p
          className={ready ? "intention-card__status" : "intention-card__empty"}
          id={`${id}-hint`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {!ready
            ? "Add an intention and one small step to try the journey."
            : done
              ? "Done. That’s the whole journey — small enough to test."
              : "Not done yet. Tick it off when it happens."}
        </p>
      </div>

      {outcome && <p className="demo__outcome">{outcome}</p>}
      <p className="demo__note">
        A prototype created for this page — not a launched product. It only
        lives in this tab: nothing is stored or sent, and refreshing clears it.
      </p>
    </div>
  );
}
