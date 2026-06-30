import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Sobre o Foco Invest",
  description: "Conheça o Foco Invest, uma ferramenta independente para consultar ações brasileiras e FIIs com clareza."
};

export default function AboutPage() {
  return (
    <section className="container-page py-10">
      <SectionHeader
        eyebrow="Sobre"
        title="Consulta de ações e FIIs com clareza"
        description="O Foco Invest foi criado para tornar a leitura de dados financeiros mais simples, organizada e acessível."
      />

      <div className="grid gap-5">
        <Card>
          <h2 className="text-xl font-bold">O que é o Foco Invest</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O Foco Invest é uma plataforma independente de consulta de ações brasileiras
            e fundos imobiliários. A proposta é reunir cotação, gráficos, oscilações,
            dividendos, indicadores e fundamentos em uma experiência limpa, rápida e
            objetiva.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Para quem foi criado</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            A ferramenta foi pensada para investidores iniciantes, estudantes e usuários
            que pesquisam tickers no Google e querem entender os principais dados de um
            ativo sem abrir várias abas ou navegar por páginas excessivamente técnicas.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Desenvolvimento</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            O Foco Invest é desenvolvido e mantido de forma independente, com foco em
            organização de dados, experiência do usuário, SEO e evolução contínua da base
            de informações financeiras.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Contato</h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            Para sugestões, correções, parcerias ou contato institucional, envie uma
            mensagem para <a className="font-semibold text-[var(--color-primary)]" href="mailto:contato@focoinvest.com.br">contato@focoinvest.com.br</a>.
          </p>
        </Card>
      </div>
    </section>
  );
}
