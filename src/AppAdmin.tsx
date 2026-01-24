// src/AppAdmin.tsx
// ✅ ADMIN-ONLY ENTRYPOINT - ZERO QUEUE/OFFLINE IMPORTS

import React from 'react';
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom';
import { RouteGuard } from '@/components/common/RouteGuard';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import routes from './routes';

/**
 * ⚠️ CRITICAL: This file must NEVER import:
 * - queueProcessor
 * - processOfflineQueue
 * - pendingOps
 * - autoSync
 * - Any code with IndexedDB side effects
 * 
 * Admin stability depends on keeping this bundle clean.
 */

export function AppAdmin() {
  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <div className="flex flex-col min-h-screen relative z-10">
            <main className="flex-grow">
              <Routes>
                {routes.map((route, index) => (
                  <Route key={index} path={route.path} element={route.element} />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
}

export default AppAdmin;
