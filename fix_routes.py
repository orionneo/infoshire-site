from pathlib import Path
import re

ROOT = Path("src")

REPLACEMENTS = [
    # navigate('/')
    (re.compile(r"navigate\(\s*['\"]\/['\"]\s*\)"), "navigate('/#/')"),

    # <Link to="/">
    (re.compile(r"<Link([^>]+)to=['\"]\/['\"]"), r"<Link\1to=\"/#/\""),

    # onClick={() => navigate('/')}
    (re.compile(r"navigate\(\s*['\"]\/['\"]\s*\)"), "navigate('/#/')"),
]

changed_files = []

for file in ROOT.rglob("*"):
    if file.suffix not in (".ts", ".tsx", ".js", ".jsx"):
        continue

    text = file.read_text(encoding="utf-8", errors="ignore")
    new = text

    for pattern, replacement in REPLACEMENTS:
        new = pattern.sub(replacement, new)

    if new != text:
        file.write_text(new, encoding="utf-8")
        changed_files.append(file)

print("\n🛠️ FIX DE ROTAS (HashRouter) FINALIZADO\n")
if changed_files:
    for f in changed_files:
        print("✅ Corrigido:", f)
else:
    print("ℹ️ Nenhuma alteração necessária.")
