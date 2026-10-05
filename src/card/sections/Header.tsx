import { Arrow } from "./bits";

export default function Header({ onSayHello }: { onSayHello: () => void }) {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <div className="site-header__brand">
          <a className="monogram" href="#top" aria-label="Anirudh Sharma — back to top">
            <span aria-hidden="true">
              AS<span className="monogram__dot">.</span>
            </span>
          </a>
          <span className="site-header__note mono">
            01 / A PERSON ON THE INTERNET
          </span>
        </div>
        <nav className="site-nav" aria-label="Primary">
          <ul>
            <li>
              <a className="site-nav__link" href="#work">
                Work
              </a>
            </li>
            <li>
              <a className="site-nav__link" href="#about">
                About
              </a>
            </li>
            <li>
              <button
                type="button"
                className="btn btn--ink btn--small site-nav__cta"
                onClick={onSayHello}
              >
                Say hello <Arrow />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
