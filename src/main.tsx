import "./index.css";

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
