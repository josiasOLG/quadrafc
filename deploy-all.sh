#!/bin/bash

# Script de deploy automático para os 3 projetos no Vercel
# Execute: ./deploy-all.sh

echo "🚀 Iniciando deploy de todos os projetos no Vercel..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para verificar se o comando foi executado com sucesso
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 executado com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao executar $1${NC}"
        exit 1
    fi
}

# 1. Deploy do Backend (deve ser primeiro para gerar as URLs)
echo -e "${BLUE}📦 Fazendo deploy do Backend...${NC}"
cd backend
vercel --prod --yes
check_success "Deploy do Backend"
cd ..

echo -e "${BLUE}⏰ Aguardando 30 segundos para o backend ficar disponível...${NC}"
sleep 30

# 2. Deploy do Frontend
echo -e "${BLUE}🌐 Fazendo deploy do Frontend...${NC}"
cd frontend
vercel --prod --yes
check_success "Deploy do Frontend"
cd ..

# 3. Deploy do Admin
echo -e "${BLUE}⚙️ Fazendo deploy do Admin...${NC}"
cd admin
vercel --prod --yes
check_success "Deploy do Admin"
cd ..

echo -e "${GREEN}🎉 Todos os deploys foram concluídos com sucesso!${NC}"
echo ""
echo -e "${BLUE}📋 URLs dos projetos:${NC}"
echo "Backend API: https://quadrafc-backend.vercel.app"
echo "Frontend: https://quadrafc-frontend.vercel.app"
echo "Admin: https://quadrafc-admin.vercel.app"
echo ""
echo -e "${BLUE}📚 Documentação da API: https://quadrafc-backend.vercel.app/api/docs${NC}"
