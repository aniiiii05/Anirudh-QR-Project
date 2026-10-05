import { useId, useMemo, useState } from "react";
import {
  SAMPLE_NOTES,
  TIDY_INPUT_LIMIT,
  TIDY_ITEM_LIMIT,
  tidyNotes,
} from "./tidy";

const fmt = (n: number) => n.toLocaleString("en-GB");

/** Automation demo: messy notes in, a clean checklist out. Text only, never HTML. */
export default function UsefulWorkflow({ outcome }: { outcome?: string }) {
  const [notes, setNotes] = useState(SAMPLE_NOTES);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const id = useId();
  const result = useMemo(() => tidyNotes(notes), [notes]);
  const removed = result.removedDuplicates + result.removedEmpty;

  return (
    <div className="demo" role="group" aria-labelledby={`${id}-title`}>
      <div className="demo__bar">
        <span className="badge badge--demo">Exploring · demo</span>
        <span className="demo__name" id={`${id}-title`}>
          Notes → checklist
        </span>
      </div>

      <div className="field">
        <div className="field__row">
          <label className="field__label" htmlFor={`${id}-notes`}>
            Paste messy notes
          </label>
          <span
            className={`field__count${
              notes.length > TIDY_INPUT_LIMIT ? " is-over" : ""
            }`}
            id={`${id}-count`}
          >
            {fmt(notes.length)} / {fmt(TIDY_INPUT_LIMIT)}
          </span>
        </div>
        <textarea
          id={`${id}-notes`}
          className="field__input field__input--area"
          rows={6}
          spellCheck={false}
          aria-describedby={`${id}-count ${id}-rules`}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setChecked({});
          }}
        />
        <p className="field__hint" id={`${id}-rules`}>
          One task per line. Bullets, numbering, blank lines and repeats get
          tidied.
        </p>
        <div className="demo__actions">
          <button
            type="button"
            className="btn btn--small btn--line"
            onClick={() => {
              setNotes(SAMPLE_NOTES);
              setChecked({});
            }}
          >
            Use sample notes
          </button>
          <button
            type="button"
            className="btn btn--small btn--line"
            disabled={notes === ""}
            onClick={() => {
              setNotes("");
              setChecked({});
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="checklist">
        {/* Only the short summary is announced; the list itself stays quiet while typing. */}
        <p
          className="checklist__summary"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {result.items.length === 0
            ? "Nothing to tidy yet."
            : `${result.items.length} clear ${
                result.items.length === 1 ? "step" : "steps"
              }${removed ? ` · ${removed} ${removed === 1 ? "line" : "lines"} removed` : ""}`}
        </p>
        {result.items.length === 0 ? (
          <p className="checklist__empty">
            Paste a few lines above — a to-do dump, meeting notes, anything
            list-shaped — and a clean checklist appears here.
          </p>
        ) : (
          <ul className="checklist__items" aria-label="Clean checklist">
            {result.items.map((item, index) => {
              const key = `${index}:${item}`;
              const inputId = `${id}-item-${index}`;
              return (
                <li key={key}>
                  <label className="checklist__row" htmlFor={inputId}>
                    <input
                      id={inputId}
                      type="checkbox"
                      className="checklist__box"
                      checked={!!checked[key]}
                      onChange={(e) =>
                        setChecked((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    <span className="checklist__text">{item}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {(result.inputTruncated || result.itemsTruncated) && (
          <p className="checklist__limit" role="note">
            {result.inputTruncated &&
              `Only the first ${fmt(TIDY_INPUT_LIMIT)} characters were tidied. `}
            {result.itemsTruncated &&
              `Showing the first ${TIDY_ITEM_LIMIT} steps.`}
          </p>
        )}
      </div>

      {outcome && <p className="demo__outcome">{outcome}</p>}
      <p className="demo__note">
        Deterministic rules running in this tab: no AI provider, no upload,
        nothing saved.
      </p>
    </div>
  );
}
