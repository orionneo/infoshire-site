import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppWrapper } from "./components/common/PageMeta.tsx";

/**
 * ✅ CRITICAL: Dynamic entrypoint + BOUNDARY RELOAD
 * 
 * Problem: If user navigates from public site to /#/admin without reload,
 * they stay in AppPublic and queueProcessor keeps running.
 * 
 * Solution: Monitor hash changes and force reload when crossing boundary.
 * 
 * Admin routes MUST use AppAdmin (no queue imports)
 * Public routes use AppPublic (with queue logic)
 */

// Force rebuild - v100 - Boundary reload: force correct entrypoint

function isAdminRoute(hash: string = window.location.hash) {
  return hash.startsWith('#/admin') || window.location.pathname.startsWith('/admin');
}

let currentMode: 'admin' | 'public' = isAdminRoute() ? 'admin' : 'public';

// ✅ BOUNDARY RELOAD: Watch for route boundary crossing
window.addEventListener('hashchange', () => {
  const nowAdmin = isAdminRoute();
  const newMode = nowAdmin ? 'admin' : 'public';
  
  if (newMode !== currentMode) {
    console.log(`[BoundaryReload] Crossing ${currentMode} → ${newMode}, reloading...`);
    window.location.reload();
  }
});

async function bootstrap() {
  const root = createRoot(document.getElementById("root")!);

  if (currentMode === 'admin') {
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
