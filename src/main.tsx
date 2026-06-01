import "./index.css";

const recoverFromModuleLoadFailure = async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const isModuleLoadFailure =
    /Importing a module script failed|Failed to fetch dynamically imported module|Load failed/i.test(message);

  if (!isModuleLoadFailure || sessionStorage.getItem("toddy-module-reload-attempted") === "true") {
    throw error;
  }

  sessionStorage.setItem("toddy-module-reload-attempted", "true");

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if (window.caches) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  window.location.reload();
};

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
}).catch(recoverFromModuleLoadFailure);
