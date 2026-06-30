import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-white">
      <div className="container-page grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-bold text-[var(--color-primary)]">Foco Invest</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-muted)]">
            Consulte ações brasileiras e FIIs com clareza. Dados organizados para fins educacionais e informativos.
          </p>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Contato: <a className="font-semibold text-[var(--color-primary)]" href="mailto:contato@focoinvest.com.br">contato@focoinvest.com.br</a>
          </p>
        </div>

        <div>
          <p className="font-semibold">Produto</p>
          <div className="mt-3 grid gap-2 text-sm text-[var(--color-muted)]">
            <Link href="/acoes">Ações</Link>
            <Link href="/fiis">FIIs</Link>
            <Link href="/rankings">Rankings</Link>
            <Link href="/glossario">Glossário</Link>
            <Link href="/metodologia">Metodologia</Link>
          </div>
        </div>

        <div>
          <p className="font-semibold">Institucional</p>
          <div className="mt-3 grid gap-2 text-sm text-[var(--color-muted)]">
            <Link href="/sobre">Sobre</Link>
            <Link href="/contato">Contato</Link>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos de uso</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] py-4">
        <p className="container-page text-xs text-[var(--color-muted)]">
          As informações exibidas têm finalidade educacional e informativa. Não constituem recomendação de investimento.
        </p>
      </div>
    </footer>
  );
}
