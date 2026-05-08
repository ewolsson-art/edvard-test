import "./index.css";

// Tvinga www.toddy.se -> toddy.se innan React/Supabase/Lovable-auth laddas.
// OAuth PKCE-state är origin-bundet, så www och root-domänen får inte blandas.
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
  Promise.all([
    import("react-dom/client"),
    import("react-helmet-async"),
    import("./App.tsx"),
    import("./i18n"),
  ]).then(([{ createRoot }, { HelmetProvider }, { default: App }]) => {
    createRoot(document.getElementById("root")!).render(
      <HelmetProvider>
        <App />
      </HelmetProvider>
    );
  });
}
