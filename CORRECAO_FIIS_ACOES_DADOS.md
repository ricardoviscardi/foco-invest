# Foco Invest v1.53.19

Correção focada em ações + FIIs antes de avançar a etapa de FIIs.

## Ajustes

- Busca global agora diferencia ações e FIIs.
- Tickers de FIIs, como `RBRF11`, abrem em `/fiis/rbrf11` quando selecionados na busca.
- `/fiis/[ticker]` passa a renderizar página própria, em vez de redirecionar para `/acoes/[ticker]`.
- A rotina `Atualizar FIIs` agora roda duas etapas:
  1. Yahoo/yfinance para cotação, histórico e rendimentos.
  2. Fundamentus público para complementar P/VP, VP/Cota, patrimônio, número de cotas, DY e informações públicas do fundo.
- O snapshot continua sendo publicado em `public/data/snapshots`, reunindo ações e FIIs para uso local quando a rede bloqueia o Supabase.
- Mensagens de dados parciais foram ajustadas para diferenciar ações e FIIs.
- Cache interno atualizado para v15319.

## Atualização automática x manual

- **Automática:**
  - `Atualizar ações` roda de segunda a sexta à noite e publica snapshot se houver alteração.
  - `Atualizar FIIs` roda terça e sexta de madrugada e publica snapshot se houver alteração.

- **Manual:**
  - Use `Run workflow` quando quiser forçar uma atualização imediatamente.
  - Depois que o GitHub Actions publicar snapshot, rode `git pull` localmente.

## Limite honesto

FIIs não divulgam todos os mesmos blocos de DRE/Balanço/Fluxo que ações no mesmo formato. Por isso, para FIIs, a página prioriza: cotação, histórico, rendimentos, DY, P/VP, VP/Cota, patrimônio, valor de mercado e número de cotas. Campos sem fonte pública confiável permanecem ocultos ou como indisponíveis.
