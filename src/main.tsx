import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { installAutoSyncListeners } from "./utils/autoSync";

// Force rebuild - v98 - Added Telegram test button in settings

// ✅ Instala listeners globais para auto-sync ao voltar do WhatsApp (iOS/PWA) e quando ficar online
installAutoSyncListeners();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </StrictMode>
);
