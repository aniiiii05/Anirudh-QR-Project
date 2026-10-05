import { profile } from "../profile";

const year = (value: string) => value.slice(0, 4);

export default function About() {
  const { education } = profile;
  return (
    <section id="about" className="about section" aria-labelledby="about-title">
      <div className="wrap about__grid">
        <div className="about__side">
          <p className="section__num mono">03 / ABOUT</p>
          <p className="about__sticker" aria-hidden="true">
            <span>Human,</span>
            <span>But Automated.</span>
          </p>
        </div>
        <div className="about__main">
          <h2 id="about-title" className="section__title about__title">
            Curious by default. <span className="about__title-soft">Practical on purpose.</span>
          </h2>
          <div className="about__copy">
            {profile.about.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>

          <details className="background">
            <summary className="background__summary">
              <span className="background__label">Background</span>
              <span className="mono background__hint">
                Education · skills · learning · languages
              </span>
              <span className="background__icon" aria-hidden="true" />
            </summary>
            <div className="background__body">
              <div className="background__block">
                <h3 className="mono background__heading">Education</h3>
                <p className="background__edu">
                  {education.qualification} — {education.institution},{" "}
                  {year(education.start)}–{year(education.end)}
                </p>
                <p className="background__note">Graduate</p>
              </div>
              <div className="background__block background__block--wide">
                <h3 className="mono background__heading">Skills</h3>
                <div className="skills">
                  {profile.skills.map((group) => (
                    <div className="skills__group" key={group.group}>
                      <h4 className="skills__name">{group.group}</h4>
                      <ul className="chips">
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="background__block">
                <h3 className="mono background__heading">Learning &amp; credentials</h3>
                <ul className="plain-list">
                  {profile.learning.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              </div>
              <div className="background__block">
                <h3 className="mono background__heading">Languages</h3>
                <dl className="langs">
                  {profile.languages.map((lang) => (
                    <div key={lang.name}>
                      <dt>{lang.name}</dt>
                      <dd>{lang.level}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
