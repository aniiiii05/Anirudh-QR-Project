import { Component, lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./site/Home";
import { profile } from "./card/profile";

// Only the homepage is in the critical bundle; the other routes load on demand.
const Card = lazy(() => import("./card/Card"));
const Privacy = lazy(() => import("./card/Privacy"));
const QRRedirect = lazy(() => import("./card/QRRedirect"));
const NotFound = lazy(() => import("./pages/NotFound"));

/**
 * If a route chunk fails to load (weak mobile signal) or a render throws, keep
 * the visitor's way to get in touch instead of leaving a blank page.
 */
export class ContactFallbackBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="handoff" role="alert" style={{ padding: "2rem 1.25rem", maxWidth: "36rem" }}>
        <h1>{profile.name}</h1>
        <p>This page did not load fully. You can still get in touch:</p>
        <ul>
          <li>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
          <li>
            <a href={profile.linkedin} rel="noopener noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={profile.github} rel="noopener noreferrer">
              GitHub
            </a>
          </li>
          <li>
            <a href="/contact.vcf">Save contact (vCard)</a>
          </li>
        </ul>
        <p>
          <a href="/">Try again</a>
        </p>
      </main>
    );
  }
}

const App = () => (
  <ContactFallbackBoundary>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/card" element={<Card />} />
          {/* Client fallback only: production serves /q from api/q.ts. */}
          <Route path="/q" element={<QRRedirect />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </ContactFallbackBoundary>
);

export default App;
