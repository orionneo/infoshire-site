import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClientLayout } from '@/components/layouts/ClientLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/db/api';
import { useToast } from '@/hooks/use-toast';

function normalizePhone(raw?: string) {
  return (raw || '').replace(/\D/g, '');
}

export default function ClientProfile() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const forcePhone = params.get('forcePhone') === '1';

  const [loading, setLoading] = useState(false);

  const defaultPhone = useMemo(() => profile?.phone || '', [profile?.phone]);

  const form = useForm({
    defaultValues: {
      name: profile?.name || '',
      phone: defaultPhone,
    },
  });

  useEffect(() => {
    // Atualiza defaults quando profile carrega
    form.reset({
      name: profile?.name || '',
      phone: profile?.phone || '',
    });
  }, [profile?.name, profile?.phone]);

  const onSubmit = async (data: { name: string; phone: string }) => {
    if (!profile) return;

    const phoneDigits = normalizePhone(data.phone);
    if (phoneDigits.length < 10) {
      toast({
        title: 'Telefone obrigatório',
        description: 'Informe um telefone válido com DDD (ex: (19) 99999-9999).',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile(profile.id, {
        name: data.name || null,
        phone: data.phone || null,
      });

      await refreshProfile();

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso',
      });

      // Se estava forçado, manda pro painel
      if (forcePhone) navigate('/client', { replace: true });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const phoneOk = normalizePhone(profile?.phone || '').length >= 10;

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>

        {forcePhone && !phoneOk && (
          <Card className="border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-500" />
              <div>
                <p className="font-semibold">Só falta seu WhatsApp 📲</p>
                <p className="text-sm text-muted-foreground">
                  Para acompanhar OS e receber atualizações, precisamos do seu telefone com DDD.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input placeholder="(19) 99999-9999" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Obrigatório para mensagens e acompanhamento via WhatsApp.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>E-mail</FormLabel>
                  <Input value={profile?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado</p>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Altere sua senha regularmente para manter sua conta segura
                </p>
                <Button variant="outline" onClick={() => navigate('/change-password')} className="w-full sm:w-auto">
                  <Lock className="mr-2 h-4 w-4" />
                  Alterar Senha
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
