# Space Agent

Web app (Next.js App Router + TypeScript + Tailwind v4) com chat e visualizador 3D,
usando o Claude pela API da Anthropic. PRD analisado em `docs/ANALISE.md`.

## Regras do projeto

- O Claude conversa; o código calcula. Veredito de lançamento só sai de
  `lib/tools/checkLaunch.ts`. Não mover lógica de decisão para o prompt.
- IDs de peça vêm de `lib/parts.ts` e ligam a checagem ao 3D. Mudou um, mude nos dois lados.
- Schemas zod em `lib/schemas.ts` são a fonte única: geram o JSON Schema das ferramentas
  e validam a entrada no servidor.
- Cores, raios e sombras só pelos tokens de `app/globals.css` (design system “Turquesa”,
  `docs/DESIGN-SYSTEM.md`). Nada de hex solto nos componentes, exceto no material 3D.
- Textos da interface em português do Brasil.
- Nunca commitar `.env.local`.

## Comandos

- `npm run dev` — desenvolvimento (precisa de `ANTHROPIC_API_KEY` no `.env.local`)
- `npm test` — testes Vitest do `checkLaunch`
- `npm run typecheck` — TypeScript
- `npm run build` — build de produção
