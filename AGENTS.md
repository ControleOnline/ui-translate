## Escopo
- Modulo de traducao e idiomas.
- Reune telas antigas para manter textos e linguagem do sistema.

## Estado
- Este modulo hoje nao tem `src/react`; a implementacao disponivel fica em `src/vue`.
- Em novos prompts, priorizar modulos React equivalentes quando existirem.
- So mexer em `src/vue` se o pedido for explicitamente sobre este fluxo ou se nao houver alternativa atual.

## Quando usar
- Prompts sobre traducao, language, dicionario e telas antigas de manutencao de textos.

## Regras de negocio
- A traducao da empresa selecionada tem prioridade na exibicao.
- Quando a empresa selecionada nao tiver uma traducao propria, a traducao da empresa principal deve ser usada como fallback.
- Empresas que nao sao a principal precisam conseguir visualizar a traducao da empresa principal como referencia para criar a propria traducao.
- Quando uma empresa secundaria criar a propria traducao, ela passa a prevalecer sobre a traducao da empresa principal.
- Somente usuarios com acesso a uma empresa podem alterar as traducoes dessa empresa.
- Ao editar traducoes no contexto de uma empresa secundaria, a tela deve deixar claro o que e fallback da empresa principal e o que ja e sobrescrita da empresa atual.
