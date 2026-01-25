import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppWrapper } from "./components/common/PageMeta.tsx";

/**
 * ✅ CRITICAL: Dynamic entrypoint + ROBUST BOUNDARY RELOAD
 * 
 * Problem: If user navigates from public site to /#/admin without reload,
 * they stay in AppPublic and queueProcessor keeps running.
 * 
 * Solution: Monitor ALL navigation mechanisms and force reload when crossing boundary:
 * - hashchange (direct hash changes)
 * - popstate (back/forward buttons)
 * - History API interception (pushState/replaceState)
 * 
 * Admin routes MUST use AppAdmin (no queue imports)
 * Public routes use AppPublic (with queue logic)
 */

// Force rebuild - v101 - Robust boundary reload with History API interception

function isAdminRoute(hash: string = window.location.hash) {
  return hash.startsWith('#/admin') || window.location.pathname.startsWith('/admin');
}

let currentMode: 'admin' | 'public' = isAdminRoute() ? 'admin' : 'public';

function checkBoundaryCrossing() {
  const nowAdmin = isAdminRoute();
  const newMode = nowAdmin ? 'admin' : 'public';
  
  if (newMode !== currentMode) {
    console.log(`[BoundaryReload] Crossing ${currentMode} → ${newMode}, reloading...`);
    window.location.reload();
  }
}

// ✅ BOUNDARY RELOAD: Watch for route boundary crossing (hashchange)
window.addEventListener('hashchange', checkBoundaryCrossing);

// ✅ BOUNDARY RELOAD: Watch for back/forward navigation (popstate)
window.addEventListener('popstate', checkBoundaryCrossing);

// ✅ BOUNDARY RELOAD: Intercept History API (pushState/replaceState)
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  originalPushState.apply(this, args);
  // Check after state change
  setTimeout(checkBoundaryCrossing, 0);
};

history.replaceState = function(...args) {
  originalReplaceState.apply(this, args);
  // Check after state change
  setTimeout(checkBoundaryCrossing, 0);
};

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
