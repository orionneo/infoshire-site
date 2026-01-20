export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-2">Acesso negado</h1>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar essa área.
        </p>
      </div>
    </div>
  );
}
