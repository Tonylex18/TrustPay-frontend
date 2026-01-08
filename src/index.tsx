import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";
import "./styles/index.css";
import "./i18n/config";
import App from "./App";

// ⛔️ DO NOT PATCH window.fetch AT ALL

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

root.render(<App />);
