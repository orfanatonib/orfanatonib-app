#!/bin/bash

# Script de deploy da stack CloudFormation para Orfanato NIB Amplify App
# Uso:
#   ./deploy.sh [create|update|delete|apply|status] STACK_NAME [--yes] [--recreate] [--profile P] [--region R] [--template FILE] [--parameters FILE]
#
# Notas:
# - Por padrão usa o profile local 'clubinho-aws' (pode sobrescrever via --profile).
# - "apply" faz create se não existir; caso exista faz update.
# - "recreate" deleta e recria automaticamente quando a stack está em estados que impedem update.

set -euo pipefail

# Defaults (podem ser sobrescritos por flags)
TEMPLATE_FILE="amplify-app.yaml"
PARAMETERS_FILE="parameters.json"
PROFILE="clubinho-aws"
REGION="us-east-1"
ASSUME_YES="false"
RECREATE_ON_BLOCKED_STATUS="false"

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

usage() {
  cat <<EOF
Uso: $0 [create|update|delete|apply|status] STACK_NAME [opções]

Opções:
  --yes            Não pedir confirmação (non-interactive)
  --recreate       Se a stack estiver em estados bloqueados (ROLLBACK/FAILED), deleta e recria automaticamente
  --profile P      AWS CLI profile (default: clubinho-aws)
  --region R       AWS region (default: us-east-1)
  --template FILE  Template CloudFormation (default: amplify-app.yaml)
  --parameters FILE Parâmetros CloudFormation (default: parameters.json)

Exemplos:
  $0 apply  orfanatonib-amplify-staging --recreate --yes
  $0 create orfanatonib-amplify-staging --yes
  $0 update orfanatonib-amplify-staging --recreate --yes
  $0 delete orfanatonib-amplify-staging --yes
EOF
}

if [ $# -lt 2 ]; then
  usage
  exit 1
fi

ACTION="$1"
STACK_NAME="$2"
shift 2

while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      ASSUME_YES="true"
      shift
      ;;
    --recreate)
      RECREATE_ON_BLOCKED_STATUS="true"
      shift
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --template)
      TEMPLATE_FILE="$2"
      shift 2
      ;;
    --parameters)
      PARAMETERS_FILE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      error "Flag desconhecida: $1"
      usage
      exit 1
      ;;
  esac
done

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

stack_exists() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" >/dev/null 2>&1
}

get_stack_status() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || true
}

is_in_progress_status() {
  case "$1" in
    *_IN_PROGRESS|*_CLEANUP_IN_PROGRESS|REVIEW_IN_PROGRESS)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_blocked_status() {
  case "$1" in
    ROLLBACK_COMPLETE|UPDATE_ROLLBACK_COMPLETE|CREATE_FAILED|UPDATE_ROLLBACK_FAILED|ROLLBACK_FAILED|IMPORT_ROLLBACK_COMPLETE|IMPORT_ROLLBACK_FAILED)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

wait_until_not_in_progress() {
  local status
  status="$(get_stack_status)"
  if [ -z "$status" ]; then
    return 0
  fi

  if ! is_in_progress_status "$status"; then
    return 0
  fi

  log "Stack está em progresso ($status). Aguardando finalizar..."
  while true; do
    sleep 10
    status="$(get_stack_status)"
    if [ -z "$status" ]; then
      break
    fi
    if ! is_in_progress_status "$status"; then
      log "Stack saiu de IN_PROGRESS: $status"
      break
    fi
  done
}

delete_stack_force() {
  if ! stack_exists; then
    success "Stack não existe; nada para deletar."
    return 0
  fi

  wait_until_not_in_progress
  local status
  status="$(get_stack_status)"

  log "Deletando stack CloudFormation: $STACK_NAME (status atual: $status)"
  aws cloudformation delete-stack \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION"

  # Espera até sumir
  log "Aguardando delete completar..."
  while stack_exists; do
    sleep 10
  done
  success "Stack deletada com sucesso!"
}

create_stack() {
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

  log "Aguardando create completar..."
  aws cloudformation wait stack-create-complete \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION"
  success "Stack create concluída com sucesso!"
}

update_stack() {
  log "Atualizando stack CloudFormation: $STACK_NAME"

  # update-stack retorna exit code 255 em "No updates are to be performed."
  set +e
  out=$(aws cloudformation update-stack \
    --stack-name "$STACK_NAME" \
    --template-body "file://$TEMPLATE_FILE" \
    --parameters "file://$PARAMETERS_FILE" \
    --capabilities CAPABILITY_IAM \
    --profile "$PROFILE" \
    --region "$REGION" 2>&1)
  rc=$?
  set -e

  if [ $rc -ne 0 ]; then
    if echo "$out" | grep -qi "No updates are to be performed"; then
      success "Nenhuma atualização necessária (No updates are to be performed)."
      return 0
    fi
    error "Falha ao chamar update-stack:"
    echo "$out"
    return 1
  fi

  log "Aguardando update completar..."
  aws cloudformation wait stack-update-complete \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION"
  success "Stack update concluída com sucesso!"
}

case "$ACTION" in
  status)
    if ! stack_exists; then
      echo "STACK_NOT_FOUND"
      exit 0
    fi
    get_stack_status
    exit 0
    ;;

  create)
    if stack_exists; then
      wait_until_not_in_progress
      status="$(get_stack_status)"
      warning "Stack já existe (status: $status)."

      if is_blocked_status "$status"; then
        if [ "$RECREATE_ON_BLOCKED_STATUS" = "true" ] || [ "$ASSUME_YES" = "true" ]; then
          warning "Status bloqueado ($status). Recriando stack automaticamente..."
          delete_stack_force
          create_stack
        else
          error "Status bloqueado ($status). Rode: $0 delete $STACK_NAME --yes  (ou use --recreate)."
          exit 1
        fi
      else
        error "Para stack existente use 'update' ou 'apply'."
        exit 1
      fi
    else
      create_stack
    fi
    ;;

  update)
    if ! stack_exists; then
      warning "Stack não existe; fazendo create."
      create_stack
    else
      wait_until_not_in_progress
      status="$(get_stack_status)"

      if is_blocked_status "$status"; then
        if [ "$RECREATE_ON_BLOCKED_STATUS" = "true" ] || [ "$ASSUME_YES" = "true" ]; then
          warning "Status bloqueado ($status). Recriando stack automaticamente..."
          delete_stack_force
          create_stack
        else
          error "Status bloqueado ($status). Use --recreate."
          exit 1
        fi
      else
        if ! update_stack; then
          # Se falhar e cair em rollback, podemos recriar
          wait_until_not_in_progress
          status="$(get_stack_status)"
          if is_blocked_status "$status" && ([ "$RECREATE_ON_BLOCKED_STATUS" = "true" ] || [ "$ASSUME_YES" = "true" ]); then
            warning "Update falhou e stack ficou em $status. Recriando..."
            delete_stack_force
            create_stack
          else
            exit 1
          fi
        fi
      fi
    fi
    ;;

  apply)
    if stack_exists; then
      "$0" update "$STACK_NAME" --profile "$PROFILE" --region "$REGION" --template "$TEMPLATE_FILE" --parameters "$PARAMETERS_FILE" $( [ "$ASSUME_YES" = "true" ] && echo "--yes" ) $( [ "$RECREATE_ON_BLOCKED_STATUS" = "true" ] && echo "--recreate" )
    else
      "$0" create "$STACK_NAME" --profile "$PROFILE" --region "$REGION" --template "$TEMPLATE_FILE" --parameters "$PARAMETERS_FILE" $( [ "$ASSUME_YES" = "true" ] && echo "--yes" ) $( [ "$RECREATE_ON_BLOCKED_STATUS" = "true" ] && echo "--recreate" )
    fi
    ;;

  delete)
    if ! stack_exists; then
      success "Stack não existe; nada para deletar."
      exit 0
    fi

    if [ "$ASSUME_YES" != "true" ]; then
      warning "Isso irá deletar a stack '$STACK_NAME' e TODOS os recursos associados!"
      read -r -p "Tem certeza? Digite 'yes' para confirmar: " confirm || true
      if [ "${confirm:-}" != "yes" ]; then
        log "Operação cancelada."
        exit 0
      fi
    fi

    delete_stack_force
    ;;

  *)
    error "Ação inválida: $ACTION"
    usage
    exit 1
    ;;
esac

# Mostra os outputs da stack (exceto delete)
if [ "$ACTION" != "delete" ] && [ "$ACTION" != "status" ]; then
    log "Obtendo informações da stack..."

    outputs=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --profile "$PROFILE" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs' \
        --output json 2>/dev/null)

    if [ "$outputs" != "null" ] && [ -n "$outputs" ]; then
        echo ""
        success "Stack criada/atualizada com sucesso!"
        echo "Outputs:"
        if command -v jq >/dev/null 2>&1; then
          echo "$outputs" | jq -r '.[] | "  \(.OutputKey): \(.OutputValue)"'
        else
          python3 - <<'PY'
import json,sys
o=json.loads(sys.stdin.read() or "null")
if not o:
    sys.exit(0)
for item in o:
    print(f"  {item.get('OutputKey')}: {item.get('OutputValue')}")
PY
        fi
        echo ""
        warning "Próximos passos:"
        echo "1. Configure o webhook do GitHub no Amplify Console"
        echo "2. Faça push das branches main e staging"
        echo "3. Configure o domínio orfanatonib.com no Route 53 (se necessário)"
    fi
fi

success "Deploy concluído!"
