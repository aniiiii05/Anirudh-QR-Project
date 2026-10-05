import { profile } from "../profile";
import { Arrow, IdeaTile } from "./bits";

/** Decorative echo of the printed card the visitor just scanned. */
function PrintedCard() {
  return (
    <div className="printed" aria-hidden="true">
      <div className="printed__card">
        <span className="printed__mono">
          AS<span className="printed__dot">.</span>
        </span>
        <span className="printed__name">{profile.name.toUpperCase()}</span>
        <span className="printed__tag">{profile.tagline}</span>
        <span className="printed__grid">
          {Array.from({ length: 16 }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      </div>
      <IdeaTile className="printed__tile" />
    </div>
  );
}

export default function Hero({ onSayHello }: { onSayHello: () => void }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="wrap hero__grid">
        {/* Phones: the header is compact, so its "01 /" line moves here (only one is ever displayed). */}
        <p className="hero__note mono">01 / A PERSON ON THE INTERNET</p>
        <div className="hero__hookrow">
          <p className="hero__hook mono">
            <span className="hero__pulse" aria-hidden="true" />
            YOU FOUND MY OFFLINE PROFILE.
          </p>
          <IdeaTile className="hero__mini-tile" />
        </div>
        <h1 id="hero-title" className="hero__title">
          <span className="hero__hi">{"Hi, I'm"}</span>{" "}
          <span className="hero__name">Anirudh.</span>
        </h1>
        <PrintedCard />
        <p className="hero__statement">
          I turn messy ideas into <span className="hl">useful systems.</span>
        </p>
        <div className="hero__aside">
          <p className="hero__lede">
            Data brain. Product curiosity. A soft spot for automating the boring
            bits.
          </p>
          <div className="actions">
            <a className="btn btn--ink" href="#work">
              See what I make <Arrow />
            </a>
            <button type="button" className="btn btn--line" onClick={onSayHello}>
              Say hello <Arrow />
            </button>
          </div>
        </div>
        <p className="hero__support">
          {"The card worked. Now let's make the conversation interesting."}
        </p>
      </div>
    </section>
  );
}
