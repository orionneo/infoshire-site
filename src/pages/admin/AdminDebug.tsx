/**
 * AdminDebug.tsx
 * Painel de debug desabilitado no baseline Admin (sem storage/IDB/filas).
 */

import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDebugPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Painel de debug desabilitado no modo Admin baseline (sem IndexedDB, filas ou persistência).
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
