import { Arrow, IdeaTile } from "./bits";

export default function Conversation({
  onShare,
  onConnect,
}: {
  onShare: () => void;
  onConnect: () => void;
}) {
  return (
    <section id="say-hello" className="talk section" aria-labelledby="talk-title">
      <div className="wrap">
        <div className="talk__card">
          <p className="section__num mono talk__num">04 / SAY HELLO</p>
          <h2 id="talk-title" className="talk__title">
            What should we make <span className="talk__hl">less annoying?</span>
          </h2>
          <div className="talk__foot">
            <p className="talk__lede">
              Tell me about a small bottleneck or an interesting idea. I like
              thoughtful problems.
            </p>
            <div className="actions">
              <button type="button" className="btn btn--lime" onClick={onShare}>
                Share a thought <Arrow />
              </button>
              <button type="button" className="btn btn--ghost" onClick={onConnect}>
                Just connect <Arrow />
              </button>
            </div>
          </div>
          <IdeaTile className="talk__tile" />
        </div>
      </div>
    </section>
  );
}
