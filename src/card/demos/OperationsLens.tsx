import { useId, useState } from "react";
import {
  OTIF_DEFINITION,
  classifyOrder,
  computeOtif,
  describeOrder,
  sampleIds,
  samples,
  type SampleId,
} from "./otif";

/** Data demo: on-time, in-full delivery calculated from fictional orders. */
export default function OperationsLens({ outcome }: { outcome?: string }) {
  const [sampleId, setSampleId] = useState<SampleId>("A");
  const titleId = useId();
  const sample = samples[sampleId];
  const summary = computeOtif(sample.orders);

  return (
    <div className="demo" role="group" aria-labelledby={titleId}>
      <div className="demo__bar">
        <span className="badge badge--demo">Exploring · demo</span>
        <span className="demo__name" id={titleId}>
          OTIF on fictional orders
        </span>
      </div>

      <div
        className="segmented"
        role="group"
        aria-label="Sample period"
      >
        {sampleIds.map((id) => (
          <button
            key={id}
            type="button"
            className="segmented__option"
            aria-pressed={sampleId === id}
            onClick={() => setSampleId(id)}
          >
            {samples[id].label}
          </button>
        ))}
      </div>

      <div className="otif__readout">
        <p className="otif__figure" aria-live="polite" aria-atomic="true">
          <span className="otif__number" data-testid="otif-percent">
            {summary.percent}
            <span className="otif__unit">%</span>
          </span>
          <span className="otif__caption">
            {summary.both} of {summary.total} orders arrived on time and in
            full in {sample.label}.
          </span>
        </p>
        <p className="otif__formula">
          <span className="otif__formula-label">How it’s counted</span>
          {OTIF_DEFINITION}
          <span className="otif__math" aria-hidden="true">
            {summary.both} ÷ {summary.total} = {summary.percent}%
          </span>
        </p>
      </div>

      <ul className="otif__orders" aria-label={`${sample.label} orders`}>
        {sample.orders.map((o) => {
          const s = classifyOrder(o);
          return (
            <li
              key={o.id}
              className={`otif__order${s.both ? " is-both" : ""}`}
              data-both={s.both}
            >
              <span className="otif__order-id" aria-hidden="true">
                {o.id}
              </span>
              <span className="otif__marks" aria-hidden="true">
                <span className={`otif__mark${s.onTime ? " is-on" : ""}`}>
                  T
                </span>
                <span className={`otif__mark${s.inFull ? " is-on" : ""}`}>
                  F
                </span>
              </span>
              <span className="sr-only">{describeOrder(o)}</span>
            </li>
          );
        })}
      </ul>

      <dl className="otif__legend">
        <div>
          <dt>
            <span className="otif__mark is-on" aria-hidden="true">
              T
            </span>{" "}
            On time
          </dt>
          <dd>
            {summary.onTime}/{summary.total}
          </dd>
        </div>
        <div>
          <dt>
            <span className="otif__mark is-on" aria-hidden="true">
              F
            </span>{" "}
            In full
          </dt>
          <dd>
            {summary.inFull}/{summary.total}
          </dd>
        </div>
        <div>
          <dt>
            <span className="otif__swatch" aria-hidden="true" /> Both
          </dt>
          <dd>
            {summary.both}/{summary.total}
          </dd>
        </div>
      </dl>

      {outcome && <p className="demo__outcome">{outcome}</p>}
      <p className="demo__note">
        Illustrative only: fictional orders made up for this page, not
        Anirudh’s business results or any employer’s data.
      </p>
    </div>
  );
}
