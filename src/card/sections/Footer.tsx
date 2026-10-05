import { profile } from "../profile";
import { CopyFeedback } from "./bits";
import { useCopyLink } from "./useCopyLink";

export default function Footer() {
  const { state, url, copy } = useCopyLink();
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p className="site-footer__big">You scanned. We should probably say hi.</p>
        <div className="site-footer__row">
          <span className="mono mono--case">
            {profile.name} © {new Date().getFullYear()}
          </span>
          <span className="mono mono--case">Built as a personal project</span>
          <a className="site-footer__link" href="/privacy">
            Privacy
          </a>
          <button type="button" className="site-footer__link" onClick={copy}>
            Copy link{" "}
            <span className="arrow" aria-hidden="true">
              ⧉
            </span>
          </button>
        </div>
        <CopyFeedback state={state} url={url} id="footer-copy-fallback" />
        <p className="site-footer__note">
          Personal work and opinions; no employer affiliation implied.
        </p>
      </div>
    </footer>
  );
}
