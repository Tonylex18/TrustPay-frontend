import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";
import "./styles/index.css";
import "./i18n/config";
import { clearStoredToken } from "./utils/api";
import App from "./App";


declare global {
  interface Window {
    __trustpayAuthPatched?: boolean;
  }
}

try {
  if (typeof window !== "undefined" && !window.__trustpayAuthPatched) {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401 || response.status === 501) {
        clearStoredToken();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      return response;
    };
    window.__trustpayAuthPatched = true;
  }
} catch (e) {
  console.warn("Fetch patch failed:", e);
}


const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

root.render(<App />);
