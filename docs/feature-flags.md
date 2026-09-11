# Gerenciamento de feature flags

O painel administrativo fica em `/adm/feature-flags` e só pode ser aberto por
usuários com papel `admin`. O link discreto no rodapé também aparece somente
para administradores. O painel em si nunca é protegido por uma feature flag,
pois ele é o caminho usado para religar recursos.

## Funcionalidades do painel

- criação, edição e exclusão de flags;
- alternância rápida entre ligada e desligada;
- busca por chave, nome ou descrição;
- filtros por situação e combinação de público;
- ordenação e paginação executadas pela API;
- resumo com totais e distribuição por público;
- sincronização das flags de fábrica ausentes.

O formulário aceita chaves minúsculas com números, `_` e `-`, preservando as
chaves históricas do Orfanato. Metadata livre é validada como objeto JSON.

## Consumo no aplicativo

A aplicação busca `GET /feature-flags/map` depois que a sessão é resolvida. A
API obtém o papel do token opcional e devolve somente a decisão efetiva de cada
flag. O frontend não baixa nomes, metadata nem públicos administrativos para
decidir rotas e menus.

O mapa traz **apenas as flags de interface**. As operacionais — toda chave com
prefixo `email-`, que governa envio no servidor — ficam de fora: a rota é
pública e devolvia o catálogo inteiro a qualquer visitante anônimo, inclusive o
estado da chave-mestra de e-mail. Elas continuam administráveis pelo painel,
que é autenticado.

O mapa fica no slice Redux `featureFlags`. Ao salvar, alternar, excluir ou
sincronizar pelo painel, a listagem e o mapa compartilhado são recarregados. Em
falha de rede valem os padrões locais das três flags já usadas pela interface,
evitando que uma indisponibilidade temporária faça áreas inteiras desaparecerem.

As rotas protegidas esperam a primeira tentativa de carregamento terminar antes
de redirecionar; assim, um deep link válido não é rejeitado enquanto a resposta
ainda está em voo.

## Testes

- `src/store/slices/feature-flags/featureFlagsSlice.test.ts` e
  `src/store/selectors/featureFlagsSelectors.test.ts` — as transições de estado
  (Vitest, regras puras).
- `e2e/live/feature-flags.ui.spec.ts` — o painel contra a API real: cria uma
  flag pela tela e confere na API, alterna e confere, e verifica que o mapa
  público não expõe as operacionais.

## Públicos

O formulário converte as oito combinações possíveis de `admin`, `leader` e
`member` para `targetRoles`. Lista vazia significa qualquer visitante;
`ALL_ROLES` exige autenticação em um dos três papéis.
