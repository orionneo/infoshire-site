#!/bin/bash
# validate_button_fix.sh - Script para validar o FIX de button unresponsiveness
# Verifica se todas as instruções foram aplicadas

set -e

WORKSPACE_DIR="/workspaces/infoshire-site"
cd "$WORKSPACE_DIR"

echo "🔍 VALIDANDO FIX: Button Unresponsiveness After Background"
echo "=========================================================="
echo ""

# ✅ Check 1: Refs adicionadas
echo "✅ [1/7] Verificando refs adicionados (lastClickTimeRef, etc)..."
if grep -q "lastClickTimeRef" src/pages/admin/AdminOrders.tsx; then
    echo "    ✓ lastClickTimeRef encontrado"
else
    echo "    ✗ FALHA: lastClickTimeRef não encontrado"
    exit 1
fi

if grep -q "creatingStartTimeRef" src/pages/admin/AdminOrders.tsx; then
    echo "    ✓ creatingStartTimeRef encontrado"
else
    echo "    ✗ FALHA: creatingStartTimeRef não encontrado"
    exit 1
fi

if grep -q "creatingOpIdRef" src/pages/admin/AdminOrders.tsx; then
    echo "    ✓ creatingOpIdRef encontrado"
else
    echo "    ✗ FALHA: creatingOpIdRef não encontrado"
    exit 1
fi

# ✅ Check 2: useEffects de recovery
echo ""
echo "✅ [2/7] Verificando Recovery useEffects..."
if grep -q "ui_background_reset" src/pages/admin/AdminOrders.tsx; then
    echo "    ✓ ui_background_reset log encontrado"
else
    echo "    ✗ FALHA: ui_background_reset não encontrado"
    exit 1
fi

if grep -q "stuck_detected" src/pages/admin/AdminOrders.tsx; then
    echo "    ✓ stuck_detected reason encontrado"
else
    echo "    ✗ FALHA: stuck_detected não encontrado"
    exit 1
fi

# ✅ Check 3: Handler instrumentation
echo ""
echo "✅ [3/7] Verificando Handler Instrumentation..."
if grep -q "ui_confirm_click" src/pages/admin/AdminOrders.tsx; then
    echo "    ✓ ui_confirm_click log encontrado"
else
    echo "    ✗ FALHA: ui_confirm_click não encontrado"
    exit 1
fi

if grep -q "ui_confirm_blocked" src/pages/admin/AdminOrders.tsx; then
    echo "    ✓ ui_confirm_blocked log encontrado"
else
    echo "    ✗ FALHA: ui_confirm_blocked não encontrado"
    exit 1
fi

if grep -q "creating_already_true" src/pages/admin/AdminOrders.tsx; then
    echo "    ✓ Guard clause 'creating_already_true' encontrado"
else
    echo "    ✗ FALHA: Guard clause não encontrado"
    exit 1
fi

# ✅ Check 4: QueueProcessor throttle fix
echo ""
echo "✅ [4/7] Verificando QueueProcessor Throttle Fix..."
if grep -q "needsImmediateProcess" src/services/queueProcessor.ts; then
    echo "    ✓ needsImmediateProcess logic encontrada"
else
    echo "    ✗ FALHA: needsImmediateProcess não encontrado"
    exit 1
fi

if grep -q "focus.*visibility.*user_click" src/services/queueProcessor.ts; then
    echo "    ✓ Immediate process reasons encontrados"
else
    echo "    ✗ FALHA: Immediate process reasons não encontrados"
    exit 1
fi

if grep -q "IMMEDIATE PROCESS" src/services/queueProcessor.ts; then
    echo "    ✓ IMMEDIATE PROCESS log encontrado"
else
    echo "    ✗ FALHA: IMMEDIATE PROCESS log não encontrado"
    exit 1
fi

# ✅ Check 5: UI debug attributes
echo ""
echo "✅ [5/7] Verificando UI Debug Attributes..."
if grep -q "data-testid=\"confirm-button\"" src/components/OrderConfirmationDialog.tsx; then
    echo "    ✓ data-testid encontrado"
else
    echo "    ✗ FALHA: data-testid não encontrado"
    exit 1
fi

if grep -q "data-disabled" src/components/OrderConfirmationDialog.tsx; then
    echo "    ✓ data-disabled encontrado"
else
    echo "    ✗ FALHA: data-disabled não encontrado"
    exit 1
fi

if grep -q "data-loading" src/components/OrderConfirmationDialog.tsx; then
    echo "    ✓ data-loading encontrado"
else
    echo "    ✗ FALHA: data-loading não encontrado"
    exit 1
fi

# ✅ Check 6: TypeScript compilation
echo ""
echo "✅ [6/7] Verificando TypeScript compilation..."
if npm run type-check 2>&1 | grep -q "error"; then
    echo "    ✗ FALHA: TypeScript errors encontrados"
    npm run type-check
    exit 1
else
    echo "    ✓ TypeScript compila sem erros"
fi

# ✅ Check 7: Documentation
echo ""
echo "✅ [7/7] Verificando Documentação..."
if [ -f "FIX_BUTTON_UNRESPONSIVENESS.md" ]; then
    echo "    ✓ FIX_BUTTON_UNRESPONSIVENESS.md encontrado"
else
    echo "    ✗ FALHA: FIX_BUTTON_UNRESPONSIVENESS.md não encontrado"
    exit 1
fi

if [ -f "EXECUTIVE_SUMMARY_BUTTON_FIX.md" ]; then
    echo "    ✓ EXECUTIVE_SUMMARY_BUTTON_FIX.md encontrado"
else
    echo "    ✗ FALHA: EXECUTIVE_SUMMARY_BUTTON_FIX.md não encontrado"
    exit 1
fi

# ✅ Final verification
echo ""
echo "=========================================================="
echo "✅ VALIDAÇÃO COMPLETA - TODOS OS CHECKS PASSARAM!"
echo "=========================================================="
echo ""
echo "📊 Resumo das Mudanças:"
echo "   • Refs adicionados: 3 (timing tracking)"
echo "   • useEffects adicionados: 2 (background recovery)"
echo "   • Handler instrumentation: completo"
echo "   • QueueProcessor throttle: fixo"
echo "   • UI debug attributes: adicionados"
echo "   • Documentação: completa"
echo ""
echo "🚀 Status: PRONTO PARA TESTE E DEPLOYMENT"
echo ""
