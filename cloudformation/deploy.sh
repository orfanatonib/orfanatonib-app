#!/bin/bash

# Script de deploy da stack CloudFormation para Orfanato NIB Amplify App
# Uso: ./deploy.sh [create|update|delete] [stack-name]

set -e

# Configurações
TEMPLATE_FILE="amplify-app.yaml"
PARAMETERS_FILE="parameters.json"
PROFILE="clubinho-aws"
REGION="us-east-1"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verifica se os parâmetros foram fornecidos
if [ $# -lt 2 ]; then
    echo "Uso: $0 [create|update|delete] [stack-name]"
    echo ""
    echo "Exemplos:"
    echo "  $0 create orfanatonib-amplify-stack"
    echo "  $0 update orfanatonib-amplify-stack"
    echo "  $0 delete orfanatonib-amplify-stack"
    exit 1
fi

ACTION=$1
STACK_NAME=$2

# Verifica se o perfil AWS existe
if ! aws configure list-profiles | grep -q "^${PROFILE}$"; then
    error "Perfil AWS '${PROFILE}' não encontrado. Configure-o primeiro:"
    echo "aws configure --profile ${PROFILE}"
    exit 1
fi

# Verifica se os arquivos existem
if [ ! -f "$TEMPLATE_FILE" ]; then
    error "Arquivo de template '$TEMPLATE_FILE' não encontrado!"
    exit 1
fi

if [ ! -f "$PARAMETERS_FILE" ]; then
    error "Arquivo de parâmetros '$PARAMETERS_FILE' não encontrado!"
    exit 1
fi

# Função para aguardar stack estar pronta
wait_for_stack() {
    local stack_name=$1
    local action=$2

    log "Aguardando stack $action completar..."
    aws cloudformation wait stack-${action}-complete \
        --stack-name "$stack_name" \
        --profile "$PROFILE" \
        --region "$REGION"

    success "Stack $action concluída com sucesso!"
}

case $ACTION in
    create)
        log "Criando stack CloudFormation: $STACK_NAME"
        log "Perfil AWS: $PROFILE"
        log "Região: $REGION"

        aws cloudformation create-stack \
            --stack-name "$STACK_NAME" \
            --template-body "file://$TEMPLATE_FILE" \
            --parameters "file://$PARAMETERS_FILE" \
            --capabilities CAPABILITY_IAM \
            --profile "$PROFILE" \
            --region "$REGION"

        wait_for_stack "$STACK_NAME" "create"
        ;;

    update)
        log "Atualizando stack CloudFormation: $STACK_NAME"

        # Verifica se a stack existe
        if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" --profile "$PROFILE" --region "$REGION" &>/dev/null; then
            error "Stack '$STACK_NAME' não existe. Use 'create' primeiro."
            exit 1
        fi

        aws cloudformation update-stack \
            --stack-name "$STACK_NAME" \
            --template-body "file://$TEMPLATE_FILE" \
            --parameters "file://$PARAMETERS_FILE" \
            --capabilities CAPABILITY_IAM \
            --profile "$PROFILE" \
            --region "$REGION"

        wait_for_stack "$STACK_NAME" "update"
        ;;

    delete)
        warning "Isso irá deletar a stack '$STACK_NAME' e TODOS os recursos associados!"
        read -p "Tem certeza? Digite 'yes' para confirmar: " confirm

        if [ "$confirm" != "yes" ]; then
            log "Operação cancelada."
            exit 0
        fi

        log "Deletando stack CloudFormation: $STACK_NAME"

        aws cloudformation delete-stack \
            --stack-name "$STACK_NAME" \
            --profile "$PROFILE" \
            --region "$REGION"

        wait_for_stack "$STACK_NAME" "delete"
        ;;

    *)
        error "Ação inválida: $ACTION"
        echo "Ações válidas: create, update, delete"
        exit 1
        ;;
esac

# Mostra os outputs da stack (exceto delete)
if [ "$ACTION" != "delete" ]; then
    log "Obtendo informações da stack..."

    outputs=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --profile "$PROFILE" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs' \
        --output json 2>/dev/null)

    if [ $? -eq 0 ] && [ "$outputs" != "null" ]; then
        echo ""
        success "Stack criada/atualizada com sucesso!"
        echo "Outputs:"
        echo "$outputs" | jq -r '.[] | "  \(.OutputKey): \(.OutputValue)"'
        echo ""
        warning "Próximos passos:"
        echo "1. Configure o webhook do GitHub no Amplify Console"
        echo "2. Faça push das branches main e staging"
        echo "3. Configure o domínio orfanatonib.com no Route 53 (se necessário)"
    fi
fi

success "Deploy concluído!"
