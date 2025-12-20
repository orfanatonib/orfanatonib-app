# CloudFormation - Orfanato NIB Amplify App

Este diretório contém os templates e scripts para deploy da aplicação Orfanato NIB no AWS Amplify usando CloudFormation.

## 📁 Arquivos

- `amplify-app.yaml` - Template CloudFormation principal
- `parameters.json` - Parâmetros para o deploy
- `deploy.sh` - Script automatizado de deploy
- `README.md` - Este arquivo

## 🚀 Como fazer o deploy

### Pré-requisitos

1. **AWS CLI configurado** com o perfil `clubinho-aws`:
   ```bash
   aws configure --profile clubinho-aws
   ```

2. **Domínio `orfanatonib.com` controlado** pela conta AWS do perfil `clubinho-aws`

3. **GitHub Personal Access Token** com permissões para acessar o repositório:
   - Vá para [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Crie um novo token com as seguintes permissões:
     - `repo` (Full control of private repositories)
     - `workflow` (Update GitHub Action workflows)
   - Copie o token gerado e substitua `YOUR_GITHUB_OAUTH_TOKEN_HERE` no `parameters.json`

3. **Repositório GitHub** configurado (atualmente aponta para `https://github.com/diego-seven/orfanatonib-app`)

### Deploy da Stack

#### Criar a stack (primeira vez):
```bash
./deploy.sh create orfanatonib-amplify-stack
```

#### Atualizar a stack (deploy de mudanças):
```bash
./deploy.sh update orfanatonib-amplify-stack
```

#### Deletar a stack:
```bash
./deploy.sh delete orfanatonib-amplify-stack
```

## 🏗️ O que a stack cria

### AWS Amplify App
- **Nome**: `orfanatonib-app`
- **Build settings** otimizadas para Vite + React
- **Auto-build** habilitado para branches

### Branches configuradas
- **`main`** → Produção (`orfanatonib.com`)
- **`staging`** → Staging (`staging.orfanatonib.com`)

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
   - Acesse o AWS Amplify Console
   - Conecte o repositório GitHub
   - Configure webhooks para auto-deploy

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
  --profile clubinho-aws \
  --region us-east-1
```

### Ver outputs da stack:
```bash
aws cloudformation describe-stacks \
  --stack-name orfanatonib-amplify-stack \
  --profile clubinho-aws \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Logs de build:
- Acesse o AWS Amplify Console
- Vá para a app `orfanatonib-app`
- Clique em "Build settings" > "Build history"

## 🔍 Troubleshooting

### Stack falha ao criar:
- Verifique se o perfil `clubinho-aws` tem permissões adequadas
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
