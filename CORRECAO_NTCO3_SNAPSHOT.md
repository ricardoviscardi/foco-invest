# v1.53.18 - Correção NTCO3 e publicação segura do snapshot

## Correções

- Adicionados hints de correspondência CVM para NTCO3/Natura e WIZC3/Wiz.
- Melhorada a extração de termos de marca para ativos cujo nome da origem de preços difere da razão social CVM.
- O workflow `Atualizar ações` agora valida NTCO3 e WIZC3 no snapshot antes de publicar.
- O snapshot só é publicado se as etapas anteriores e a validação passarem.
- Evita publicar snapshot parcial/ruim quando a CVM ou a validação falha.

## Validação esperada

Após rodar `Atualizar ações` com `todas_acoes_b3` e `publicar_snapshot: sim`, a URL:

```text
/api/data/asset/ntco3
```

deve retornar `source: snapshot-local` e `historicalBaseLoaded: true`.
