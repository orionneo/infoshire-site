import { AlertCircle, Loader2, Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getAllSiteSettings, getTelegramSettings, updateSiteSetting, updateTelegramSettings } from '@/db/api';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';

export default function AdminSiteSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const form = useForm({
    defaultValues: {
      site_name: '',
      home_hero_title: '',
      home_hero_subtitle: '',
      about_content: '',
      contact_email: '',
      contact_phone: '',
      contact_address: '',
      telegram_chat_id: '',
      telegram_notifications_enabled: false,
      whatsapp_pickup_template: '',
      search_enabled: true,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settings, telegramSettings] = await Promise.all([
        getAllSiteSettings(),
        getTelegramSettings(),
      ]);
      
      const settingsMap: Record<string, any> = {};
      settings.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });

      form.reset({
        site_name: settingsMap.site_name || '',
        home_hero_title: settingsMap.home_hero_title || '',
        home_hero_subtitle: settingsMap.home_hero_subtitle || '',
        about_content: settingsMap.about_content || '',
        contact_email: settingsMap.contact_email || '',
        contact_phone: settingsMap.contact_phone || '',
        contact_address: settingsMap.contact_address || '',
        telegram_chat_id: telegramSettings.chat_id || '',
        telegram_notifications_enabled: telegramSettings.enabled || false,
        whatsapp_pickup_template: settingsMap.whatsapp_pickup_template || '',
        search_enabled: settingsMap.search_enabled === 'true' || settingsMap.search_enabled === true,
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      await Promise.all([
        updateSiteSetting('site_name', data.site_name),
        updateSiteSetting('home_hero_title', data.home_hero_title),
        updateSiteSetting('home_hero_subtitle', data.home_hero_subtitle),
        updateSiteSetting('about_content', data.about_content),
        updateSiteSetting('contact_email', data.contact_email),
        updateSiteSetting('contact_phone', data.contact_phone),
        updateSiteSetting('contact_address', data.contact_address),
        updateSiteSetting('whatsapp_pickup_template', data.whatsapp_pickup_template),
        updateSiteSetting('search_enabled', String(data.search_enabled)),
        updateTelegramSettings(data.telegram_chat_id, data.telegram_notifications_enabled),
      ]);

      toast({
        title: 'Configurações salvas',
        description: 'As configurações do site foram atualizadas com sucesso',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          orderNumber: 'TESTE',
          equipment: 'Equipamento de Teste',
          clientName: 'Cliente Teste',
          totalCost: 100.00,
          laborCost: 50.00,
          partsCost: 50.00,
          notificationType: 'approved',
        },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        console.error('Erro ao testar Telegram:', errorMsg || error?.message);
        throw new Error(errorMsg || error?.message || 'Erro ao enviar mensagem de teste');
      }

      toast({
        title: 'Mensagem de teste enviada!',
        description: 'Verifique seu Telegram para confirmar o recebimento',
      });
    } catch (error: any) {
      console.error('Erro ao testar Telegram:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message || 'Verifique se o Chat ID e o token estão configurados corretamente',
        variant: 'destructive',
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Site</h1>
          <p className="text-muted-foreground">Personalize o conteúdo do site público</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="site_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Site</FormLabel>
                      <FormControl>
                        <Input placeholder="TechFix - Assistência Técnica" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome que aparece no cabeçalho e rodapé do site
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades do Site</CardTitle>
                <CardDescription>
                  Ative ou desative funcionalidades do site público
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="search_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Barra de Busca</FormLabel>
                        <FormDescription>
                          Exibir barra de busca no site público para os visitantes pesquisarem conteúdo
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Página Inicial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="home_hero_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título Principal</FormLabel>
                      <FormControl>
                        <Input placeholder="Assistência Técnica Especializada" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="home_hero_subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtítulo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Reparo de eletrônicos, computadores, notebooks e celulares com qualidade e transparência"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Página Sobre</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="about_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Conte a história da sua empresa..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contato@techfix.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua Exemplo, 123 - São Paulo, SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notificações do Telegram</CardTitle>
                <CardDescription>
                  Configure o bot do Telegram para receber notificações quando um orçamento for aprovado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <AlertTitle className="text-amber-800 dark:text-amber-400">Configuração Necessária</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    <div className="space-y-2 mt-2">
                      <p className="font-semibold">⚠️ IMPORTANTE: Token do Bot Necessário</p>
                      <p>Para que as notificações funcionem, você precisa configurar o <strong>TELEGRAM_BOT_TOKEN</strong> no Supabase:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                        <li>Acesse: <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Painel do Supabase</a></li>
                        <li>Vá em <strong>Settings → Edge Functions → Secrets</strong></li>
                        <li>Adicione um novo secret:
                          <ul className="list-disc list-inside ml-4 mt-1">
                            <li><strong>Name:</strong> <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code></li>
                            <li><strong>Value:</strong> Token do seu bot (obtido no @BotFather)</li>
                          </ul>
                        </li>
                        <li>Clique em <strong>Save</strong></li>
                      </ol>
                      <p className="text-xs mt-2 italic">Sem este token, as notificações não serão enviadas mesmo que estejam ativadas.</p>
                    </div>
                  </AlertDescription>
                </Alert>
                <FormField
                  control={form.control}
                  name="telegram_notifications_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativar Notificações</FormLabel>
                        <FormDescription>
                          Receba mensagens no Telegram quando um cliente aprovar um orçamento
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telegram_chat_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chat ID do Telegram</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormDescription>
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold">Como configurar:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Abra o Telegram e busque por <code className="bg-muted px-1 py-0.5 rounded">@BotFather</code></li>
                            <li>Envie o comando <code className="bg-muted px-1 py-0.5 rounded">/newbot</code></li>
                            <li>Siga as instruções para criar seu bot</li>
                            <li>Copie o <strong>token</strong> fornecido (você precisará dele depois)</li>
                            <li>Busque por <code className="bg-muted px-1 py-0.5 rounded">@userinfobot</code> no Telegram</li>
                            <li>Envie qualquer mensagem e copie seu <strong>Chat ID</strong></li>
                            <li>Cole o Chat ID no campo acima</li>
                            <li>Entre em contato com o suporte para configurar o token do bot</li>
                          </ol>
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram || !form.watch('telegram_chat_id')}
                  >
                    {testingTelegram ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Mensagem de Teste
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mensagem do WhatsApp</CardTitle>
                <CardDescription>
                  Configure a mensagem padrão enviada ao cliente quando o equipamento estiver pronto para retirada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="default" className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                  <AlertTitle className="text-blue-800 dark:text-blue-400">Variáveis Disponíveis</AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-300">
                    <div className="space-y-2 mt-2">
                      <p>Use as seguintes variáveis no template. Elas serão substituídas automaticamente:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                        <li><code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{'{{cliente_nome}}'}</code> - Nome do cliente</li>
                        <li><code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{'{{equipamento}}'}</code> - Nome do equipamento</li>
                        <li><code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{'{{numero_os}}'}</code> - Número da ordem de serviço</li>
                        <li><code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{'{{valor_total}}'}</code> - Valor total (formatado automaticamente)</li>
                        <li><code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{'{{desconto}}'}</code> - Desconto aplicado (se houver)</li>
                        <li><code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{'{{valor_final}}'}</code> - Valor final com desconto</li>
                        <li><code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{'{{observacoes}}'}</code> - Observações adicionais</li>
                      </ul>
                      <p className="text-xs mt-2 italic">💡 Dica: Use *texto* para negrito no WhatsApp</p>
                    </div>
                  </AlertDescription>
                </Alert>
                <FormField
                  control={form.control}
                  name="whatsapp_pickup_template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template da Mensagem</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Olá {{cliente_nome}}!&#10;&#10;Seu equipamento *{{equipamento}}* está pronto! 🎉"
                          className="min-h-[300px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Personalize a mensagem que será enviada via WhatsApp quando o status for alterado para "Pronto para Retirada"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
