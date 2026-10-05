import { useCallback, useEffect, useRef, useState } from "react";
import "./card.css";
import { visibleProjects, type Project, type ProjectId } from "./profile";
import Workspace3D from "./Workspace3D";
import ContactSheet, { type SheetView } from "./ContactSheet";
import Header from "./sections/Header";
import Hero from "./sections/Hero";
import CapabilityStrip from "./sections/CapabilityStrip";
import Work from "./sections/Work";
import About from "./sections/About";
import Conversation from "./sections/Conversation";
import Footer from "./sections/Footer";
import { scrollToElement } from "./sections/motion";

const projectIds = new Set<string>(visibleProjects.map((p) => p.id));
const isProjectId = (value: string): value is ProjectId => projectIds.has(value);

export default function Card() {
  const [openWork, setOpenWork] = useState<ProjectId | null>(null);
  const [sheet, setSheet] = useState<{ open: boolean; view: SheetView; subject: string }>({
    open: false,
    view: "connect",
    subject: "",
  });
  const opener = useRef<HTMLElement | null>(null);
  /**
   * A scroll request for an opened item. Each request gets a fresh `seq`, so the
   * scroll effect runs even when the item is already open (React would skip a
   * same-value setOpenWork), and no stale request survives to fire later.
   */
  const [scrollRequest, setScrollRequest] = useState<{
    id: ProjectId;
    instant: boolean;
    seq: number;
  } | null>(null);

  const openContact = useCallback((view: SheetView, subject = "") => {
    opener.current = (document.activeElement as HTMLElement | null) ?? null;
    setSheet({ open: true, view, subject });
  }, []);

  /** Opens one work item (closing any other), updates the fragment and scrolls to it. */
  const showWork = useCallback((id: ProjectId, { instant = false } = {}) => {
    setOpenWork(id);
    if (window.location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
    setScrollRequest((prev) => ({ id, instant, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const toggleWork = useCallback(
    (id: ProjectId) => {
      const next = openWork === id ? null : id;
      setScrollRequest(null);
      setOpenWork(next);
      history.replaceState(null, "", next ? `#${next}` : "#work");
    },
    [openWork],
  );

  // Scroll after the opened item has rendered, so its final position is measured.
  useEffect(() => {
    if (!scrollRequest) return;
    const { id, instant } = scrollRequest;
    const frame = requestAnimationFrame(() => {
      scrollToElement(document.getElementById(id), { instant });
      setScrollRequest(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollRequest]);

  // Deep links: #operations / #practice / #workflow open their story on load and on hash change.
  useEffect(() => {
    const fromHash = (instant: boolean) => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (isProjectId(id)) showWork(id, { instant });
      else if (instant && id) {
        const target = document.getElementById(id);
        if (target) requestAnimationFrame(() => scrollToElement(target, { instant: true }));
      }
    };
    fromHash(true);
    const onHashChange = () => fromHash(false);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [showWork]);

  const askAbout = useCallback(
    (project: Project) => openContact("compose", project.askSubject),
    [openContact],
  );

  return (
    <div className="handoff" id="top">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header onSayHello={() => openContact("connect")} />
      <main id="main" tabIndex={-1}>
        <Hero onSayHello={() => openContact("connect")} />
        <CapabilityStrip />
        <Workspace3D onExplore={(id: ProjectId) => showWork(id)} />
        <Work openId={openWork} onToggle={toggleWork} onAsk={askAbout} />
        <About />
        <Conversation
          onShare={() => openContact("compose")}
          onConnect={() => openContact("connect")}
        />
      </main>
      <Footer />
      <ContactSheet
        open={sheet.open}
        view={sheet.view}
        subject={sheet.subject}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        onViewChange={(view) => setSheet((s) => ({ ...s, view }))}
        returnFocus={opener}
      />
    </div>
  );
}
