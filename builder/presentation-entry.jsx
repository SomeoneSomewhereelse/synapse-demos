// The real app at /tovspace/presentation, opened on the new task's card.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import "@fontsource-variable/heebo";
import "../src/index.css";
import App from "../src/App.jsx";
import { LangProvider } from "../src/i18n/LangContext";
import { ThemeProvider } from "../src/theme/ThemeContext";
import { AccessibilityProvider } from "../src/theme/AccessibilityContext";
import { SaveProvider } from "../src/state/SaveContext";

try {
  sessionStorage.setItem("tovspace:staff-authed:v1", "1");
  sessionStorage.setItem("tovspace:system-authed:v1", "1");
} catch {
  /* demo only */
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MemoryRouter initialEntries={["/tovspace/presentation"]}>
      <ThemeProvider>
        <AccessibilityProvider>
          <LangProvider>
            <SaveProvider>
              <App />
            </SaveProvider>
          </LangProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </MemoryRouter>
  </StrictMode>,
);

// Open the workday presentation, then the new task's card, rather than a
// random one; and point root-relative images at the files beside the page.
const hub = ["סימולציית יום עבודה", "workday simulation"];
const names = ["Spreadsheet calculations", "חישובים בגיליון אלקטרוני"];
const find = (texts, exact) =>
  [...document.querySelectorAll("button")].find((b) =>
    texts.some((n) => (exact ? b.textContent.trim().endsWith(n) : b.textContent.toLowerCase().includes(n.toLowerCase()))),
  );
let step = 0;
let tries = 0;
const timer = setInterval(() => {
  for (const img of document.querySelectorAll('img[src^="/"]')) img.setAttribute("src", "." + img.getAttribute("src"));
  if (step === 0) {
    const b = find(hub, false);
    if (b) { b.click(); step = 1; }
  } else if (step === 1) {
    const b = find(names, true);
    if (b) { b.click(); step = 2; }
  }
  if (++tries > 100) clearInterval(timer);
}, 100);
