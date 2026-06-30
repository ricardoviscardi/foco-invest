# Foco Invest

Website planejado: `www.focoinvest.com.br`

## Versão atual

**v1.53 — GitHub Actions para atualização de ações**

## Novidades

- Workflow manual e agendado para ações:
  - `.github/workflows/update-acoes.yml`
- Workflow semanal para fundamentos CVM:
  - `.github/workflows/update-cvm-semanal.yml`
- Guia:
  - `GITHUB_ACTIONS_SETUP.md`

## Por que isso foi feito

A rede da empresa bloqueou o domínio do Supabase via OpenDNS/Cisco Umbrella. Então a atualização pesada passa a rodar fora da rede local, pelo GitHub Actions.

## Secrets necessários

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Opcional:

```text
BRAPI_API_TOKEN
```

## Como rodar

```text
Actions > Atualizar ações > Run workflow
```

Modos:

```text
precos
cvm
completo_sem_itr
completo_com_itr
```

## Próximo passo

Depois de validar a action e atualizar as ações:

**v1.54 — FIIs oficiais + revisão final para deploy.**
