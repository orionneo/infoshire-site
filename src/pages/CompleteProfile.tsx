import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Phone } from 'lucide-react';
import { ClientLayout } from '@/components/layouts/ClientLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';

function normalizePhoneBR(raw: string) {
  const digits = (raw || '').replace(/\D/g, '');
  // Aceita 10 ou 11 dígitos (DDD + número)
  if (digits.length === 10 || digits.length === 11) return digits;
  return '';
}

export default function CompleteProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const needsPhone = useMemo(() => {
    const p = (profile?.phone || '').replace(/\D/g, '');
    return !p || p.length < 10;
  }, [profile?.phone]);

  useEffect(() => {
    // se não tiver user, volta login
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    // se já tem telefone, não precisa ficar aqui
    if (user && profile && !needsPhone) {
      navigate('/client', { replace: true });
    }
  }, [user, profile, needsPhone, navigate]);

  const handleSave = async () => {
    if (!user) return;

    const normalized = normalizePhoneBR(phone);
    if (!normalized) {
      toast({
        title: 'Telefone inválido',
        description: 'Informe um telefone com DDD (10 ou 11 dígitos). Ex: (19) 99999-9999',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Upsert garante que profile exista mesmo para login Google
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            phone: normalized,
            // mantém role se já existir, senão client
            role: profile?.role || 'client',
            email: profile?.email || user.email || null,
            name:
              profile?.name ||
              (user.user_metadata?.full_name as string | undefined) ||
              (user.user_metadata?.name as string | undefined) ||
              null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Tudo certo!',
        description: 'Telefone confirmado. Agora você pode usar o sistema.',
      });

      navigate('/client', { replace: true });
    } catch (e: any) {
      console.error('CompleteProfile save error:', e);
      toast({
        title: 'Erro ao salvar',
        description: e?.message || 'Não foi possível salvar seu telefone.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Carregando profile
  if (!user || !profile) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Confirme seu WhatsApp</h1>
          <p className="text-muted-foreground">
            Para acompanhar OS e receber mensagens, precisamos do seu telefone.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Telefone (WhatsApp)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>Com DDD (ex: 19999999999)</span>
            </div>

            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(19) 99999-9999"
              inputMode="tel"
            />

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Telefone'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}