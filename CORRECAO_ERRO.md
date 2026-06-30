# Correção v1.11

## Erros corrigidos

1. `Invalid next.config.ts options detected: Unrecognized key(s): 'plugins'`
   - O arquivo `next.config.ts` foi recriado sem a chave inválida `plugins`.

2. `SyntaxError: Unexpected end of JSON input`
   - O componente do TradingView foi ajustado para inserir o JSON do widget de forma mais segura.

## Importante

Para evitar manter arquivos antigos, substitua a pasta inteira do projeto por esta versão.

Depois rode:

```bash
npm install
npm run dev
```

Se o terminal continuar mostrando `plugins`, apague manualmente qualquer arquivo antigo chamado:

```text
next.config.js
next.config.mjs
next.config.cjs
```

Na versão corrigida deve existir apenas:

```text
next.config.ts
```
