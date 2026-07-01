# Correção v1.53.22 — push recusado ao publicar snapshot

## Problema

O workflow de FIIs gerava o commit do snapshot, mas o `git push` falhava com:

```text
! [rejected] main -> main (fetch first)
Updates were rejected because the remote contains work that you do not have locally.
```

Isso acontece quando outro workflow, como o de ações, ou algum commit manual atualiza a branch `main` enquanto o workflow de FIIs ainda está rodando.

## Correção

- Adicionado `concurrency` nos workflows que publicam snapshot.
- A publicação agora guarda o snapshot gerado em uma pasta temporária.
- Em seguida faz `git fetch origin main` e `git reset --hard origin/main`.
- Reaplica o snapshot gerado sobre a versão mais recente do repositório.
- Tenta `git push origin HEAD:main` até 3 vezes.

## Workflows ajustados

- `.github/workflows/update-acoes.yml`
- `.github/workflows/update-fiis.yml`
- `.github/workflows/snapshot-acoes.yml`

## Próximo teste

Depois de commit/push desta versão, rode novamente:

1. `Actions > Atualizar FIIs > Run workflow`
2. `publicar_snapshot: sim`

Se outro workflow estiver rodando, o GitHub deve colocar em fila em vez de gerar conflito de push.
