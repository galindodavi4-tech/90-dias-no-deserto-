# Space Agent

Agente de IA que responde sobre espaço e astronomia, diz se uma nave pode lançar,
comenta tendências de marketing e economia e mostra um foguete 3D interativo com
as peças com defeito em vermelho. Feito a partir do PRD *Space AI Agent*, com o
design system “Turquesa”.

![Tela inicial](docs/tela-inicial.png)

- **Análise completa da estrutura:** [`docs/ANALISE.md`](docs/ANALISE.md)
- **Design system:** [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md)

## Rodar

Precisa de Node 22+ e uma chave da API da Anthropic.

```bash
cd space-agent
npm install
cp .env.example .env.local   # e cole a chave em ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

## Testar

```bash
npm test           # regras da checagem de lançamento (Vitest)
npm run typecheck
npm run build
```

## Experimente perguntar

- “Qual é a missão tripulada mais recente?”
- “Meu foguete: 1 estágio, 20 t secas, 300 t de propelente, empuxo 2.900 kN,
  Isp 290 s, 5 motores, 2 t de carga para LEO, sem aletas. Pode lançar?”
- “Mostre um foguete de 3 estágios com aletas.”
- “Quais são as maiores tendências econômicas agora?”

## Como funciona, em uma linha

O navegador manda a conversa para `/api/chat`; o servidor roda o loop do agente
(Claude + `web_search` + `check_launch` + `show_rocket`) e devolve texto, checagem
e modelo 3D em streaming. As regras de lançamento são simplificadas e educativas —
não são aprovação de engenharia real.
