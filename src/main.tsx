import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { SettingsProvider } from "./settings";
import "./styles.css";

// Invoker commands (command/commandfor) open the settings dialog; load the
// polyfill only in browsers that lack them.
if (!("commandForElement" in HTMLButtonElement.prototype)) {
  import("invokers-polyfill");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
);
