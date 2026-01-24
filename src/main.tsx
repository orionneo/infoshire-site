import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppWrapper } from "./components/common/PageMeta.tsx";

/**
 * ✅ CRITICAL: Dynamic entrypoint to prevent Admin from loading queue code
 * 
 * Admin routes MUST use AppAdmin (no queue imports)
 * Public routes use AppPublic (with queue logic)
 * 
 * This ensures Admin bundle is tree-shaken and does NOT include:
 * - queueProcessor
 * - processOfflineQueue
 * - pendingOps
 * - IndexedDB side effects
 */

// Force rebuild - v99 - Hard split: Admin vs Public entrypoints

const isAdminRoute = 
  window.location.hash.startsWith('#/admin') || 
  window.location.pathname.startsWith('/admin');

async function bootstrap() {
  const root = createRoot(document.getElementById("root")!);

  if (isAdminRoute) {
    // ✅ Admin: Load clean bundle without queue code
    const { AppAdmin } = await import('./AppAdmin.tsx');
    
    root.render(
      <StrictMode>
        <AppWrapper>
          <AppAdmin />
        </AppWrapper>
      </StrictMode>
    );
  } else {
    // ✅ Public: Load full bundle with queue/offline logic
    const { AppPublic } = await import('./AppPublic.tsx');
    
    root.render(
      <StrictMode>
        <AppWrapper>
          <AppPublic />
        </AppWrapper>
      </StrictMode>
    );
  }
}

bootstrap();
