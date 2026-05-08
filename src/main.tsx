import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Tvinga www.toddy.se -> toddy.se INNAN appen laddas.
// Annars sparas OAuth PKCE-state på fel origin och Google-login fastnar
// med "failed to exchange authorization code" efter callback.
if (
  typeof window !== "undefined" &&
  window.location.hostname === "www.toddy.se"
) {
  const target =
    "https://toddy.se" +
    window.location.pathname +
    window.location.search +
    window.location.hash;
  window.location.replace(target);
} else {
  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
