import { useRef, type KeyboardEvent } from "react";
import { visibleProjects, type Project, type ProjectId, type ProjectState } from "../profile";
import OperationsLens from "../demos/OperationsLens";
import SmallIntention from "../demos/SmallIntention";
import UsefulWorkflow from "../demos/UsefulWorkflow";
import { Arrow } from "./bits";
import WorkVisual from "./WorkVisual";

const stateText: Record<ProjectState, string> = {
  shipped: "Shipped and in use.",
  "case-study": "A written case study.",
  prototype: "Prototype · still exploring, not launched.",
  demo: "Working demo · illustrative sample data only.",
};

/** Per-project wording where the generic state line would be inaccurate. */
const stateOverride: Partial<Record<ProjectId, string>> = {
  operations: "Working demo · fictional sample records, not real business results.",
  workflow: "Working demo · runs on what you paste, in this tab only.",
};

/** The project summary is already shown under the title, so demos skip their outcome line here. */
function Demo({ project }: { project: Project }) {
  if (project.id === "operations") return <OperationsLens />;
  if (project.id === "practice") return <SmallIntention />;
  return <UsefulWorkflow />;
}

type Props = {
  openId: ProjectId | null;
  onToggle: (id: ProjectId) => void;
  onAsk: (project: Project) => void;
};

export default function Work({ openId, onToggle, onAsk }: Props) {
  const toggles = useRef<Partial<Record<ProjectId, HTMLButtonElement | null>>>({});

  function onItemKeyDown(event: KeyboardEvent<HTMLElement>, id: ProjectId) {
    if (event.key !== "Escape" || openId !== id) return;
    event.preventDefault();
    event.stopPropagation();
    onToggle(id);
    toggles.current[id]?.focus();
  }

  return (
    <section id="work" className="work section" aria-labelledby="work-title">
      <div className="wrap">
        <div className="section__head">
          <p className="section__num mono">02 / WORK</p>
          <h2 id="work-title" className="section__title">
            {"A few things I've made, mapped, or made easier."}
          </h2>
        </div>
        <ol className="work__list">
          {visibleProjects.map((project, index) => {
            const open = openId === project.id;
            const detailId = `${project.id}-detail`;
            return (
              <li
                key={project.id}
                id={project.id}
                className={`work-item${open ? " is-open" : ""}`}
                onKeyDown={(e) => onItemKeyDown(e, project.id)}
              >
                <article aria-labelledby={`${project.id}-title`}>
                  <div className="work-item__head">
                    <span className="work-item__index mono" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <div className="work-item__visual">
                      <WorkVisual id={project.id} />
                    </div>
                    <div className="work-item__meta">
                      <p className="work-item__tags">
                        <span className="badge badge--demo">{project.label}</span>
                        <span className="mono work-item__cat">{project.category}</span>
                      </p>
                      <h3 className="work-item__title" id={`${project.id}-title`}>
                        <button
                          ref={(el) => (toggles.current[project.id] = el)}
                          type="button"
                          className="work-item__toggle"
                          aria-expanded={open}
                          aria-controls={detailId}
                          onClick={() => onToggle(project.id)}
                        >
                          {project.title}
                        </button>
                      </h3>
                      <p className="work-item__summary">{project.summary}</p>
                    </div>
                    <span className="work-item__icon" aria-hidden="true" />
                  </div>
                  <div
                    id={detailId}
                    className="work-item__detail"
                    hidden={!open}
                  >
                    {open && (
                      <>
                        {/* Prompt and demo come first so the interactive part is near the title on phones. */}
                        <p className="story__prompt work-item__lead">{project.prompt}</p>
                        <div className="work-item__demo">
                          <Demo project={project} />
                        </div>
                        <div className="work-item__body">
                          <dl className="story">
                            <div>
                              <dt className="mono">Problem</dt>
                              <dd>{project.problem}</dd>
                            </div>
                            <div>
                              <dt className="mono">Approach</dt>
                              <dd>{project.approach}</dd>
                            </div>
                            <div>
                              <dt className="mono">What this is</dt>
                              <dd>{project.contribution}</dd>
                            </div>
                            <div>
                              <dt className="mono">Honest state</dt>
                              <dd>{stateOverride[project.id] ?? stateText[project.state]}</dd>
                            </div>
                          </dl>
                          <button
                            type="button"
                            className="btn btn--line work-item__ask"
                            onClick={() => onAsk(project)}
                          >
                            Ask me about this <Arrow />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
