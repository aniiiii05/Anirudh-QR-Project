import { useEffect } from "react";
import { qrDestination } from "./logic";

/** Client-side fallback only. Production serves /q from api/q.ts as a server redirect. */
export default function QRRedirect() {
  useEffect(() => {
    location.replace(qrDestination(location.href));
  }, []);
  return (
    <p>
      Taking you to <a href="/card">Anirudh’s card</a>…
    </p>
  );
}
