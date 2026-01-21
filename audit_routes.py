from pathlib import Path

EXTS = (".ts", ".tsx", ".js", ".jsx", ".html")

BAD_SNIPPETS = [
    "window.location.href = '/'",
    "window.location.href='/'",
    "window.location.href = \"/\"",
    "navigate('/')",
    "navigate(\"/\")",
    "<Link to=\"/\">",
    "<Link to='/'>",
    "window.location.origin + '/'",
    "window.location.origin + \"/\"",
    "window.location.origin+'/login'",
    "window.location.origin + '/login'",
    "window.location.origin+'/approve'",
    "window.location.origin + '/approve'",
]

print("\n🔍 AUDITORIA GLOBAL DE ROTAS PÚBLICAS (HashRouter)\n")

found = False

for file in Path(".").rglob("*"):
    if not file.suffix.lower() in EXTS:
        continue
    try:
        lines = file.read_text(encoding="utf-8", errors="ignore").splitlines()
    except Exception:
        continue

    for i, line in enumerate(lines, start=1):
        for bad in BAD_SNIPPETS:
            if bad in line:
                found = True
                print("⚠️ ROTA PROBLEMÁTICA ENCONTRADA")
                print(f"   Arquivo : {file}")
                print(f"   Linha   : {i}")
                print(f"   Código  : {line.strip()}")
                print()

if not found:
    print("✅ Nenhuma rota pública problemática encontrada.")
