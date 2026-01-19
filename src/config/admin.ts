import type { User } from '@supabase/supabase-js';

// Lista de emails admin (separados por vírgula) – coloque no .env
// Ex: VITE_ADMIN_EMAILS=diogo@infoshire.com.br,financeiro@infoshire.com.br
const RAW = (import.meta as any).env?.VITE_ADMIN_EMAILS || '';

export const ADMIN_EMAILS = RAW
  .split(',')
  .map((s: string) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminUser(user: User | null | undefined): boolean {
  const email = (user?.email || '').toLowerCase();
  if (!email) return false;

  // fallback: também aceita claim app_metadata.role=admin se você configurar no futuro
  const metaRole = (user as any)?.app_metadata?.role;

  return ADMIN_EMAILS.includes(email) || metaRole === 'admin';
}
