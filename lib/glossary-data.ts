export type GlossaryItem = {
  slug: string;
  term: string;
  name: string;
  seoTitle: string;
  seoDescription: string;
  explanation: string;
  example: string;
  attention: string;
};

export const glossaryItems: GlossaryItem[] = [
  {
    slug: "pl",
    term: "P/L",
    name: "Preço sobre Lucro",
    seoTitle: "O que é P/L? Entenda o Preço sobre Lucro",
    seoDescription: "Entenda o indicador P/L, como calcular, como interpretar e quais cuidados tomar ao comparar ações.",
    explanation: "Mostra quantas vezes o mercado está pagando pelo lucro anual da empresa. É calculado dividindo o preço da ação pelo lucro por ação.",
    example: "Se uma ação custa R$ 20 e o lucro por ação é R$ 2, o P/L é 10. Isso significa que o preço equivale a 10 anos de lucro por ação, mantendo o lucro constante.",
    attention: "P/L baixo não significa automaticamente ação barata. Pode indicar lucro temporário, risco alto ou piora esperada nos resultados."
  },
  {
    slug: "pvp",
    term: "P/VP",
    name: "Preço sobre Valor Patrimonial",
    seoTitle: "O que é P/VP? Entenda o Preço sobre Valor Patrimonial",
    seoDescription: "Veja o que significa P/VP, como interpretar esse indicador e em quais setores ele costuma ser mais útil.",
    explanation: "Compara o preço da ação com o valor patrimonial por ação. Ajuda a entender quanto o mercado paga em relação ao patrimônio contábil da empresa.",
    example: "Se a ação custa R$ 30 e o valor patrimonial por ação é R$ 15, o P/VP é 2. O mercado paga duas vezes o patrimônio contábil.",
    attention: "É mais útil em bancos, seguradoras e empresas intensivas em ativos. Em empresas leves, pode ser menos relevante."
  },
  {
    slug: "dividend-yield",
    term: "DY 12m",
    name: "Dividend Yield dos últimos 12 meses",
    seoTitle: "O que é Dividend Yield? Entenda o DY 12m",
    seoDescription: "Entenda o Dividend Yield, como calcular o DY dos últimos 12 meses e quais cuidados tomar ao analisar dividendos.",
    explanation: "Indica quanto a empresa distribuiu em dividendos e JCP nos últimos 12 meses em relação ao preço atual da ação.",
    example: "Se a ação custa R$ 50 e pagou R$ 5 em proventos nos últimos 12 meses, o Dividend Yield é 10%.",
    attention: "DY alto pode ser resultado de queda forte no preço da ação ou de pagamento extraordinário que talvez não se repita."
  },
  {
    slug: "roe",
    term: "ROE",
    name: "Retorno sobre Patrimônio Líquido",
    seoTitle: "O que é ROE? Entenda o Retorno sobre Patrimônio Líquido",
    seoDescription: "Saiba o que é ROE, como esse indicador mede a rentabilidade da empresa e quais cuidados considerar.",
    explanation: "Mede quanto lucro a empresa gera em relação ao patrimônio líquido dos acionistas.",
    example: "ROE de 20% significa que, para cada R$ 100 de patrimônio líquido, a empresa gerou R$ 20 de lucro.",
    attention: "ROE muito alto pode ser bom, mas também pode vir de endividamento elevado ou patrimônio muito reduzido."
  },
  {
    slug: "roic",
    term: "ROIC",
    name: "Retorno sobre Capital Investido",
    seoTitle: "O que é ROIC? Entenda o Retorno sobre Capital Investido",
    seoDescription: "Veja como o ROIC mede a eficiência da empresa em gerar retorno sobre o capital investido.",
    explanation: "Mede o retorno gerado sobre o capital total investido na operação, considerando capital próprio e de terceiros.",
    example: "ROIC de 15% indica que a empresa gerou R$ 15 de resultado operacional para cada R$ 100 de capital investido.",
    attention: "É muito útil para avaliar qualidade operacional, mas deve ser comparado com o custo de capital da empresa."
  },
  {
    slug: "margem-liquida",
    term: "Margem Líquida",
    name: "Lucro líquido sobre receita",
    seoTitle: "O que é Margem Líquida? Entenda esse indicador",
    seoDescription: "Entenda como a margem líquida mostra a porcentagem da receita que vira lucro líquido.",
    explanation: "Mostra qual porcentagem da receita vira lucro líquido depois de custos, despesas, juros e impostos.",
    example: "Margem líquida de 12% significa que a cada R$ 100 de receita, R$ 12 viram lucro líquido.",
    attention: "Margens variam bastante por setor. Bancos, varejo, indústria e utilities têm padrões diferentes."
  },
  {
    slug: "ev-ebitda",
    term: "EV/EBITDA",
    name: "Valor da firma sobre EBITDA",
    seoTitle: "O que é EV/EBITDA? Entenda esse múltiplo",
    seoDescription: "Veja como interpretar EV/EBITDA e por que esse indicador é usado para comparar empresas.",
    explanation: "Compara o valor total da empresa, incluindo dívida líquida, com a geração operacional aproximada de caixa medida pelo EBITDA.",
    example: "EV/EBITDA de 8 significa que o valor da firma equivale a 8 vezes seu EBITDA anual.",
    attention: "É útil para comparar empresas do mesmo setor, mas não substitui análise de dívida, crescimento e qualidade dos resultados."
  },
  {
    slug: "divida-liquida-ebitda",
    term: "Dív.Líq/EBITDA",
    name: "Dívida líquida sobre EBITDA",
    seoTitle: "O que é Dívida Líquida/EBITDA?",
    seoDescription: "Entenda como a Dívida Líquida/EBITDA ajuda a avaliar o endividamento de uma empresa.",
    explanation: "Indica quantos anos de EBITDA seriam necessários para pagar a dívida líquida, desconsiderando outros fatores.",
    example: "Dív.Líq/EBITDA de 2 significa que a dívida líquida equivale a aproximadamente 2 anos de EBITDA.",
    attention: "Quanto maior, maior tende a ser o risco financeiro. Mas o nível aceitável muda conforme o setor."
  },
  {
    slug: "vpa",
    term: "VPA",
    name: "Valor Patrimonial por Ação",
    seoTitle: "O que é VPA? Entenda o Valor Patrimonial por Ação",
    seoDescription: "Saiba o que significa VPA e como ele se relaciona com patrimônio líquido e número de ações.",
    explanation: "Representa o patrimônio líquido dividido pelo número de ações.",
    example: "Se a empresa tem R$ 1 bilhão de patrimônio líquido e 100 milhões de ações, o VPA é R$ 10.",
    attention: "O VPA é contábil. Ele não necessariamente representa o valor justo da ação."
  },
  {
    slug: "valor-de-mercado",
    term: "Valor de mercado",
    name: "Market cap",
    seoTitle: "O que é Valor de Mercado? Entenda o market cap",
    seoDescription: "Entenda como o valor de mercado é calculado e como ele difere do valor da firma.",
    explanation: "É o preço da ação multiplicado pela quantidade de ações da empresa.",
    example: "Se a empresa tem 1 bilhão de ações e cada ação vale R$ 20, o valor de mercado é R$ 20 bilhões.",
    attention: "Valor de mercado não é a mesma coisa que valor da firma. O valor da firma também considera dívida líquida."
  }
];

export function getGlossaryItem(slug: string): GlossaryItem | undefined {
  return glossaryItems.find((item) => item.slug === slug);
}
