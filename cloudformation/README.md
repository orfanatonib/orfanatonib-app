# CloudFormation - Orfanatos NIB Amplify App

Este diretório contém os templates e scripts para deploy da aplicação Orfanatos NIB no AWS Amplify usando CloudFormation.

## 📁 Arquivos

### Templates CloudFormation
- `amplify-app.yaml` - Template CloudFormation para AWS Amplify App
- `route53-dns.yaml` - Template CloudFormation para registros DNS do Route53

### Parâmetros
- `parameters.json` - Parâmetros para a stack do Amplify
- `exemple.parameters.json` - Exemplo de parâmetros (não versionar!)

### Scripts de Deploy
- **`deploy.sh`** - Script único de deploy completo (orquestra tudo automaticamente)

### Arquivos de Ambiente
- `../env/env.prod` - Variáveis de ambiente para produção
- `../env/env.staging` - Variáveis de ambiente para staging

## 🚀 Como fazer o deploy

### Pré-requisitos

1. **AWS CLI configurado** com o perfil `orfanato-aws`:
   ```bash
   aws configure --profile orfanato-aws
   ```

2. **Domínio `orfanatonib.com` controlado** pela conta AWS do perfil `orfanato-aws`

3. **GitHub Personal Access Token** (será configurado manualmente no console):
   - Crie um token em [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Permissões necessárias:
     - `repo` (Full control of private repositories)
     - `workflow` (Update GitHub Action workflows)
   - **IMPORTANTE**: Guarde o token, será usado no passo 4 dos pós-deploy

3. **Repositório GitHub** configurado (atualmente aponta para `https://github.com/ministerioorfanatos/orfanatonib-app`)

### Deploy Completo

Execute um único comando para fazer o deploy de tudo:

```bash
# 1. Export o GitHub token
export AMPLIFY_GITHUB_TOKEN='your-github-token-here'

# 2. Execute o deploy completo
./deploy.sh
```

**O script faz automaticamente:**
1. ✅ Cria/atualiza stack Amplify (App + Branches + Domain)
2. ✅ Atualiza environment variables (de env/env.prod e env/env.staging)
3. ✅ Obtém DNS records do Amplify dinamicamente
4. ✅ Cria/atualiza stack DNS no Route53
5. ✅ Dispara builds das branches main e staging

### Opções Avançadas

```bash
# Pular deploy do DNS
./deploy.sh --skip-dns

# Pular builds do Amplify
./deploy.sh --skip-builds

# Usar outro profile AWS
./deploy.sh --profile outro-profile

# Ver todas as opções
./deploy.sh --help
```

### Deletar as Stacks

```bash
aws cloudformation delete-stack --stack-name orfanatonib-dns --profile orfanato-aws
aws cloudformation delete-stack --stack-name orfanatonib-amplify --profile orfanato-aws
```

## 🏗️ Arquitetura e Recursos Criados

### Stack 1: Amplify App (`orfanatonib-amplify`)
Cria automaticamente via CloudFormation:
- **AWS Amplify App** (`orfanatonib-app`)
  - Build settings otimizadas para Vite + React
  - Auto-build habilitado para branches
  - Repositório GitHub conectado automaticamente

- **Branches**:
  - **`main`** → Produção
  - **`staging`** → Staging

- **Domain Association**:
  - Domínio customizado: `orfanatonib.com`
  - Certificado SSL gerenciado automaticamente
  - CloudFront distribution criado automaticamente

### Stack 2: Route53 DNS (`orfanatonib-dns`)
Cria automaticamente via CloudFormation:
- **Registros DNS**:
  - `orfanatonib.com` → Alias (A + AAAA) para CloudFront
  - `staging.orfanatonib.com` → CNAME para CloudFront
  - Registro de validação do certificado SSL

**IMPORTANTE**: Esta stack obtém os valores dinamicamente do Amplify, não são hardcoded!

### Environment Variables
Cada branch tem suas próprias variáveis de ambiente:
- `VITE_API_URL`
- `VITE_FEED_MINISTERIO_ID`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_SPECIAL_FAMILY_DAY_ID`

### Domínios
- **Produção**: `https://orfanatonib.com`
- **Staging**: `https://staging.orfanatonib.com`

## 🔧 Configurações pós-deploy

Após o deploy bem-sucedido, você precisará:

1. **Configurar webhook do GitHub**:
   - Acesse o [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Selecione a app `orfanatonib-app`
   - Vá para "App settings" > "Repository"
   - Clique em "Connect to repository"
   - Selecione GitHub e faça login
   - Cole o Personal Access Token criado anteriormente
   - Selecione o repositório `ministerioorfanatos/orfanatonib-app`
   - Configure webhooks para auto-deploy das branches `main` e `staging`

2. **Criar branches no Amplify**:
   - No Amplify Console, vá para "App settings" > "Branch settings"
   - Clique em "Add branch" para cada branch:
     - **Branch main**: Ambiente de produção
     - **Branch staging**: Ambiente de staging
   - Configure as environment variables para cada branch (conforme parameters.json)

3. **Configurar domínios**:
   - Vá para "App settings" > "Domain management"
   - Adicione o domínio `orfanatonib.com`
   - Configure subdomínios:
     - `orfanatonib.com` → branch `main`
     - `staging.orfanatonib.com` → branch `staging`

2. **Configurar domínio no Route 53** (se necessário):
   - Verifique se `orfanatonib.com` está configurado no Route 53
   - O Amplify criará os registros necessários automaticamente

3. **Fazer push das branches**:
   ```bash
   git checkout main
   git push origin main

   git checkout -b staging
   git push origin staging
   ```

## 📊 Monitoramento

### Ver status da stack:
```bash
aws cloudformation describe-stacks \
  --stack-name orfanatonib-amplify-stack \
  --profile orfanato-aws \
  --region us-east-1
```

### Ver outputs da stack:
```bash
aws cloudformation describe-stacks \
  --stack-name orfanatonib-amplify-stack \
  --profile orfanato-aws \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Logs de build:
- Acesse o AWS Amplify Console
- Vá para a app `orfanatonib-app`
- Clique em "Build settings" > "Build history"

## 🔍 Troubleshooting

### Stack falha ao criar:
- Verifique se o perfil `orfanato-aws` tem permissões adequadas
- Confirme que o domínio `orfanatonib.com` está na conta AWS correta

### Build falha no Amplify:
- Verifique os logs no Amplify Console
- Confirme que todas as environment variables estão configuradas
- Verifique se o repositório GitHub está acessível

### Domínio não funciona:
- Aguarde a propagação do DNS (pode levar até 24h)
- Verifique se os registros CNAME estão criados no Route 53
- Confirme que o domínio não está sendo usado por outro serviço

## 🏷️ Outputs da Stack

A stack exporta os seguintes valores:
- `AmplifyAppId` - ID da aplicação Amplify
- `ProductionBranchName` - Nome da branch de produção
- `StagingBranchName` - Nome da branch de staging
- `ProductionDomain` - URL de produção
- `StagingDomain` - URL de staging

## 📝 Personalização

Para modificar configurações:

1. **Environment variables**: Edite o `parameters.json`
2. **Build settings**: Modifique o `BuildSpec` no `amplify-app.yaml`
3. **Branches**: Altere os parâmetros `RepositoryBranch` e `StagingBranch`
4. **Domínios**: Modifique a seção `DomainAssociation`

Após mudanças, execute:
```bash
./deploy.sh update orfanatonib-amplify-stack
```
