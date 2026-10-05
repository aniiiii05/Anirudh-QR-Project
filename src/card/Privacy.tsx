import { useEffect } from "react";
import { profile } from "./profile";
import "./card.css";

/**
 * Privacy notice written from the page's actual behaviour (guide §11).
 * Update it — and the date — before enabling direct form delivery or analytics.
 */
export const PRIVACY_LAST_UPDATED = "2 October 2026";

export default function Privacy() {
  useEffect(() => {
    const previous = document.title;
    document.title = `Privacy — ${profile.name}`;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="handoff privacy-page">
      <a className="text-link" href="/card">
        ← Back to the card
      </a>
      <h1>
        Privacy,
        <br />
        plainly.
      </h1>
      <p>
        This is a personal page. It is built to work without collecting
        information about you.
      </p>

      <h2>No analytics, cookies or tracking</h2>
      <p>
        This page does not use analytics, cookies, tracking pixels or any other
        tracking. This page does not load third-party analytics or advertising
        scripts. Its fonts are self-hosted, so viewing it sends no requests to a
        font provider.
      </p>
      <p>
        The printed QR code opens this page with a short campaign label (for
        example <code>utm_source=card</code>). It describes the card, not you,
        and nothing on this page collects it.
      </p>

      <h2>The demos and the 3D workspace</h2>
      <p>
        The demos and the 3D workspace run only in your browser tab. Anything
        you type into a demo is not sent to a server or stored, and it is gone
        when you refresh or close the tab.
      </p>

      <h2>Getting in touch</h2>
      <p>
        “Share a thought” opens an email draft in your own email app. Nothing is
        sent by this page: you review the draft and decide whether to send it.
        If you do, your email provider and the recipient’s email provider
        process the message, and your details are used to read and reply to it.
      </p>
      <p>
        Direct form delivery is not enabled. Before it is enabled, this notice
        will be updated to name the email-delivery and rate-limiting providers,
        how long messages are kept, and how to have them deleted.
      </p>

      <h2>Saving the contact card</h2>
      <p>
        “Save contact” downloads a contact card (vCard) generated from the same
        public details shown on this page: name, email address and public
        profile links. It contains no information about you.
      </p>

      <h2>Hosting</h2>
      <p>
        Like any website, the hosting provider processes standard request
        data — such as your IP address, browser user agent and the address
        requested — to deliver the page and keep it secure.
      </p>

      <h2>External links</h2>
      <p>
        GitHub, LinkedIn and your email provider have their own privacy
        policies, which apply when you follow a link to them.
      </p>

      <h2>Questions and deletion requests</h2>
      <p>
        To ask a question about this notice, or to ask for an email you sent to
        be deleted, write to{" "}
        <a href={`mailto:${profile.email}`}>{profile.email}</a>.
      </p>
      <p>Last updated: {PRIVACY_LAST_UPDATED}</p>
      <p>
        <a href="/card">Back to the card</a>
      </p>
    </main>
  );
}
