#!/bin/bash

# =============================================================================
# Script de Deploy Completo - Clubinho NIB Amplify App
# =============================================================================
#
# Este script orquestra o deploy completo da infraestrutura via CloudFormation:
# 1. Stack Amplify (App + Branches + Domain)
# 2. Stack Route53 DNS (obtém valores dinamicamente do Amplify)
# 3. Atualiza environment variables
# 4. Dispara builds
#
# Uso:
#   export AMPLIFY_GITHUB_TOKEN='your-token'
#   ./deploy.sh
#
# Opções:
#   --profile PROFILE    AWS CLI profile (default: clubinho-aws)
#   --region REGION      AWS region (default: us-east-1)
#   --skip-dns          Pula o deploy da stack DNS
#   --skip-builds       Pula os builds do Amplify
#   --yes               Não pede confirmação
#
# =============================================================================

set -euo pipefail

# =============================================================================
# CONFIGURAÇÕES
# =============================================================================

PROFILE="clubinho-aws"
REGION="us-east-1"
AMPLIFY_STACK_NAME="clubinhonib-amplify"
DNS_STACK_NAME="clubinhonib-dns"
AMPLIFY_TEMPLATE="amplify-app.yaml"
DNS_TEMPLATE="route53-dns.yaml"
AMPLIFY_PARAMS="parameters.json"
GITHUB_TOKEN_ENV="AMPLIFY_GITHUB_TOKEN"
HOSTED_ZONE_ID="Z04342831HLGP0JZ4VI5K"
ROOT_DOMAIN="clubinhonib.com"
STAGING_PREFIX="staging"

SKIP_DNS="false"
SKIP_BUILDS="false"
ASSUME_YES="false"

# =============================================================================
# CORES
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# FUNÇÕES DE LOG
# =============================================================================

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
header() { echo -e "\n${CYAN}═══════════════════════════════════════════════════${NC}\n${CYAN}$1${NC}\n${CYAN}═══════════════════════════════════════════════════${NC}\n"; }

# =============================================================================
# PARSE ARGUMENTS
# =============================================================================

while [ $# -gt 0 ]; do
  case "$1" in
    --profile) PROFILE="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --skip-dns) SKIP_DNS="true"; shift ;;
    --skip-builds) SKIP_BUILDS="true"; shift ;;
    --yes) ASSUME_YES="true"; shift ;;
    -h|--help)
      echo "Uso: $0 [opções]"
      echo ""
      echo "Opções:"
      echo "  --profile PROFILE    AWS CLI profile (default: clubinho-aws)"
      echo "  --region REGION      AWS region (default: us-east-1)"
      echo "  --skip-dns           Pula deploy da stack DNS"
      echo "  --skip-builds        Pula builds do Amplify"
      echo "  --yes                Não pede confirmação"
      echo "  -h, --help           Mostra esta ajuda"
      exit 0
      ;;
    *)
      error "Opção desconhecida: $1"
      exit 1
      ;;
  esac
done

# =============================================================================
# VERIFICAÇÕES INICIAIS
# =============================================================================

header "🚀 Deploy Clubinho NIB - CloudFormation"

log "Verificando pré-requisitos..."

# Verifica AWS CLI profile
if ! aws configure list-profiles | grep -q "^${PROFILE}$"; then
  error "Perfil AWS '$PROFILE' não encontrado!"
  echo "Configure com: aws configure --profile $PROFILE"
  exit 1
fi

# Verifica autenticação AWS
if ! aws sts get-caller-identity --profile "$PROFILE" --region "$REGION" >/dev/null 2>&1; then
  error "Falha ao autenticar com AWS (profile=$PROFILE)"
  exit 1
fi

# Verifica GitHub token
if ! printenv "$GITHUB_TOKEN_ENV" >/dev/null 2>&1; then
  error "GitHub token não encontrado!"
  echo "Export o token primeiro:"
  echo "  export $GITHUB_TOKEN_ENV='your-github-token'"
  exit 1
fi

GITHUB_TOKEN="$(printenv "$GITHUB_TOKEN_ENV")"

success "Pré-requisitos OK"

# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================

stack_exists() {
  local stack_name="$1"
  aws cloudformation describe-stacks \
    --stack-name "$stack_name" \
    --profile "$PROFILE" \
    --region "$REGION" >/dev/null 2>&1
}

get_stack_output() {
  local stack_name="$1"
  local key="$2"
  aws cloudformation describe-stacks \
    --stack-name "$stack_name" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='${key}'].OutputValue | [0]" \
    --output text 2>/dev/null || echo ""
}

create_or_update_stack() {
  local stack_name="$1"
  local template="$2"
  local params_file="$3"

  if stack_exists "$stack_name"; then
    log "Atualizando stack: $stack_name"

    set +e
    out=$(aws cloudformation update-stack \
      --stack-name "$stack_name" \
      --template-body "file://$template" \
      --parameters "file://$params_file" \
      --capabilities CAPABILITY_IAM \
      --profile "$PROFILE" \
      --region "$REGION" 2>&1)
    rc=$?
    set -e

    if [ $rc -ne 0 ]; then
      if echo "$out" | grep -qi "No updates are to be performed"; then
        success "Stack já está atualizada"
        return 0
      fi
      error "Falha ao atualizar stack"
      echo "$out"
      return 1
    fi

    log "Aguardando update completar..."
    aws cloudformation wait stack-update-complete \
      --stack-name "$stack_name" \
      --profile "$PROFILE" \
      --region "$REGION"
    success "Stack atualizada!"
  else
    log "Criando stack: $stack_name"

    aws cloudformation create-stack \
      --stack-name "$stack_name" \
      --template-body "file://$template" \
      --parameters "file://$params_file" \
      --capabilities CAPABILITY_IAM \
      --profile "$PROFILE" \
      --region "$REGION"

    log "Aguardando create completar..."
    aws cloudformation wait stack-create-complete \
      --stack-name "$stack_name" \
      --profile "$PROFILE" \
      --region "$REGION"
    success "Stack criada!"
  fi
}

# =============================================================================
# ETAPA 1: DEPLOY STACK AMPLIFY
# =============================================================================

header "📦 ETAPA 1/4: Deploy Stack Amplify"

log "Preparando parâmetros..."

# Cria arquivo temporário com parâmetros (incluindo token)
TEMP_PARAMS="/tmp/amplify-params-$$.json"
python3 - "$AMPLIFY_PARAMS" "$GITHUB_TOKEN" <<'PY' > "$TEMP_PARAMS"
import json, sys
params_file = sys.argv[1]
token = sys.argv[2]

with open(params_file, 'r') as f:
    params = json.load(f)

# Remove GitHubAccessToken se existir
params = [p for p in params if p.get("ParameterKey") != "GitHubAccessToken"]

# Remove parâmetros que não existem no template
allowed = {"RepositoryUrl", "RepositoryBranch", "StagingBranch", "RootDomainName", "StagingSubdomainPrefix", "GitHubAccessToken"}
params = [p for p in params if p.get("ParameterKey") in allowed]

# Adiciona token
params.append({"ParameterKey": "GitHubAccessToken", "ParameterValue": token})

print(json.dumps(params, indent=2))
PY

create_or_update_stack "$AMPLIFY_STACK_NAME" "$AMPLIFY_TEMPLATE" "$TEMP_PARAMS"
rm -f "$TEMP_PARAMS"

# Obtém App ID
APP_ID="$(get_stack_output "$AMPLIFY_STACK_NAME" "AmplifyAppId")"
if [ -z "$APP_ID" ] || [ "$APP_ID" = "None" ]; then
  error "Não consegui obter AmplifyAppId"
  exit 1
fi

success "Amplify App ID: $APP_ID"

# =============================================================================
# ETAPA 2: ATUALIZAR ENVIRONMENT VARIABLES
# =============================================================================

header "🔧 ETAPA 2/4: Atualizar Environment Variables"

log "Lendo env files..."

if [ ! -f "../env/env.prod" ] || [ ! -f "../env/env.staging" ]; then
  warning "Arquivos env não encontrados em ../env/"
  warning "Pulando atualização de environment variables"
else
  # Converte env files para JSON
  ENV_PROD_JSON="$(python3 - "../env/env.prod" <<'PY'
import json, sys
env_file = sys.argv[1]
env = {}
with open(env_file, 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
print(json.dumps(env))
PY
)"

  ENV_STAGING_JSON="$(python3 - "../env/env.staging" <<'PY'
import json, sys
env_file = sys.argv[1]
env = {}
with open(env_file, 'r') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
print(json.dumps(env))
PY
)"

  log "Atualizando env vars da branch main..."
  aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name main \
    --environment-variables "$ENV_PROD_JSON" \
    --profile "$PROFILE" \
    --region "$REGION" >/dev/null
  success "Main branch atualizada"

  log "Atualizando env vars da branch staging..."
  aws amplify update-branch \
    --app-id "$APP_ID" \
    --branch-name staging \
    --environment-variables "$ENV_STAGING_JSON" \
    --profile "$PROFILE" \
    --region "$REGION" >/dev/null
  success "Staging branch atualizada"
fi

# =============================================================================
# ETAPA 3: DEPLOY STACK DNS
# =============================================================================

if [ "$SKIP_DNS" = "false" ]; then
  header "🌐 ETAPA 3/4: Deploy Stack DNS"

  log "Obtendo informações de DNS do Amplify..."
  log "Aguardando Amplify gerar DNS records (pode levar alguns minutos)..."

  DNS_INFO=""
  for i in $(seq 1 30); do
    DA_JSON="$(aws amplify get-domain-association \
      --app-id "$APP_ID" \
      --domain-name "$ROOT_DOMAIN" \
      --profile "$PROFILE" \
      --region "$REGION" \
      --output json 2>/dev/null || true)"

    if [ -n "$DA_JSON" ]; then
      DNS_INFO="$(python3 - <<'PY'
import json, sys
raw = sys.stdin.read().strip()
if not raw:
    sys.exit(1)

j = json.loads(raw)
da = j.get("domainAssociation", {})

# CloudFront target
cf_target = ""
for sd in da.get("subDomains", []):
    setting = sd.get("subDomainSetting") or {}
    if setting.get("branchName") == "main" and not setting.get("prefix"):
        rec = (sd.get("dnsRecord") or "").strip()
        p = [x for x in rec.split(" ") if x]
        if len(p) >= 2:
            cf_target = p[-1]
        break

if not cf_target and da.get("subDomains"):
    rec = (da["subDomains"][0].get("dnsRecord") or "").strip()
    p = [x for x in rec.split(" ") if x]
    if len(p) >= 2:
        cf_target = p[-1]

if cf_target and cf_target.endswith("."):
    cf_target = cf_target[:-1]

# Certificado
cert = da.get("certificateVerificationDNSRecord") or da.get("certificate", {}).get("certificateVerificationDNSRecord") or ""
cert_name = cert_value = ""
if cert:
    parts = [p for p in cert.strip().split(" ") if p]
    if len(parts) >= 3:
        cert_name = parts[0]
        cert_value = parts[2]
        if cert_name.endswith("."):
            cert_name = cert_name[:-1]
        if cert_value.endswith("."):
            cert_value = cert_value[:-1]

if cf_target and cert_name and cert_value:
    print(f"{cf_target}|{cert_name}|{cert_value}")
PY
<<<"$DA_JSON" || true)"

      if [ -n "$DNS_INFO" ]; then
        break
      fi
    fi

    log "Tentativa $i/30..."
    sleep 10
  done

  if [ -z "$DNS_INFO" ]; then
    warning "Timeout aguardando DNS records do Amplify"
    warning "Execute novamente depois: ./deploy.sh"
  else
    IFS='|' read -r CF_DIST CERT_NAME CERT_VALUE <<<"$DNS_INFO"

    success "CloudFront: $CF_DIST"
    success "Cert Name: $CERT_NAME"
    success "Cert Value: $CERT_VALUE"

    # Cria arquivo de parâmetros para DNS
    DNS_PARAMS="/tmp/dns-params-$$.json"
    cat > "$DNS_PARAMS" <<EOF
[
  {"ParameterKey": "HostedZoneId", "ParameterValue": "$HOSTED_ZONE_ID"},
  {"ParameterKey": "RootDomainName", "ParameterValue": "$ROOT_DOMAIN"},
  {"ParameterKey": "StagingSubdomainPrefix", "ParameterValue": "$STAGING_PREFIX"},
  {"ParameterKey": "CloudFrontDistribution", "ParameterValue": "$CF_DIST"},
  {"ParameterKey": "CertificateValidationName", "ParameterValue": "$CERT_NAME"},
  {"ParameterKey": "CertificateValidationValue", "ParameterValue": "$CERT_VALUE"}
]
EOF

    create_or_update_stack "$DNS_STACK_NAME" "$DNS_TEMPLATE" "$DNS_PARAMS"
    rm -f "$DNS_PARAMS"
  fi
else
  warning "Pulando deploy da stack DNS (--skip-dns)"
fi

# =============================================================================
# ETAPA 4: DISPARAR BUILDS
# =============================================================================

if [ "$SKIP_BUILDS" = "false" ]; then
  header "🔨 ETAPA 4/4: Disparar Builds"

  log "Disparando build: staging"
  aws amplify start-job \
    --app-id "$APP_ID" \
    --branch-name staging \
    --job-type RELEASE \
    --profile "$PROFILE" \
    --region "$REGION" >/dev/null
  success "Build staging iniciado"

  log "Disparando build: main"
  aws amplify start-job \
    --app-id "$APP_ID" \
    --branch-name main \
    --job-type RELEASE \
    --profile "$PROFILE" \
    --region "$REGION" >/dev/null
  success "Build main iniciado"
else
  warning "Pulando builds (--skip-builds)"
fi

# =============================================================================
# FINALIZAÇÃO
# =============================================================================

header "✅ DEPLOY CONCLUÍDO COM SUCESSO!"

echo ""
warning "Próximos Passos:"
echo ""
echo "1️⃣  Aguarde os builds finalizarem (5-10 minutos)"
echo "    Console: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo ""
echo "2️⃣  Aguarde a propagação do DNS (5-60 minutos)"
echo ""
echo "3️⃣  Acesse os domínios:"
echo "    • Produção: https://$ROOT_DOMAIN"
echo "    • Staging:  https://$STAGING_PREFIX.$ROOT_DOMAIN"
echo ""

success "Tudo pronto! 🎉"
echo ""
