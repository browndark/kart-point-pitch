#!/bin/bash
# Script para configurar e publicar o pitch website do Kart Point

echo "🎮 Kart Point - Pitch Website Setup Script"
echo "=========================================="
echo ""

# Verificar se Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado. Por favor, instale Git primeiro."
    exit 1
fi

echo "✅ Git detectado com sucesso"
echo ""

# Configurar Git (opcional)
echo "Para publicar no GitHub, execute os seguintes comandos:"
echo ""
echo "1. Configure suas credenciais (primeira vez apenas):"
echo "   git config --global user.name 'Seu Nome'"
echo "   git config --global user.email 'seu.email@example.com'"
echo ""

echo "2. Crie um repositório no GitHub (https://github.com/new)"
echo ""

echo "3. Adicione o repositório remoto:"
echo "   git remote add origin https://github.com/seu-usuario/kart-point-pitch.git"
echo ""

echo "4. Renomeie a branch principal (opcional):"
echo "   git branch -M main"
echo ""

echo "5. Faça push do código:"
echo "   git push -u origin main"
echo ""

echo "=========================================="
echo "Para servir localmente:"
echo "  - Abra index.html no navegador, ou"
echo "  - Use Live Server (VS Code), ou"
echo "  - Execute: python -m http.server 8000"
echo ""
echo "Para ativar GitHub Pages:"
echo "  - Vá em Settings > Pages"
echo "  - Source: main branch / root folder"
echo "  - Seu site estará em: https://seu-usuario.github.io/kart-point-pitch"
echo "=========================================="