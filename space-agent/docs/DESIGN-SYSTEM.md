# Design system “Turquesa”

Derivado do kit de UI escuro de referência (cartões com gradiente suave,
sombras profundas, cantos bem redondos, acentos em gradiente). A cor principal
do kit — índigo/violeta — virou **turquesa**. O pêssego/coral continua como
acento quente e o lavanda passa a ser a terceira cor de dados.

Todos os tokens moram em `app/globals.css`, no bloco `@theme` do Tailwind v4,
e viram classes (`bg-surface`, `text-ink-muted`, `border-line`…).

## Cores

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#061a1f` | Fundo da página (com brilhos radiais turquesa e lavanda) |
| `bg-deep` | `#04121a` | Trilhos, fundo do 3D, texto sobre gradiente |
| `surface` → `surface-2` | `#0e3038` → `#12404a` | Gradiente dos cartões |
| `surface-3` | `#175560` | Controles em relevo |
| `line` | `#2a6f78` | Bordas de campos |
| `primary-300` / `primary` / `primary-600` / `primary-700` | `#6eeadf` / `#2ee6d6` / `#14b8a6` / `#0f8f86` | **Turquesa** — ação principal, foco, brilho |
| `peach` → `coral` | `#ffc29a` → `#f47b6b` | Acento quente: parar, slider, série secundária |
| `lavender` | `#a99bff` | Terceira cor de dados |
| `ink` / `ink-muted` / `ink-faint` | `#e8fbf9` / `#8fbcb8` / `#5d8d8a` | Texto |
| `danger` | `#ff4d5e` | Peça reprovada, erro |
| `success` | `#3ef0a8` | Peça aprovada (tooltip) |

Antes → depois: os violetas `#5b4fd8`/`#7b6cf6` do kit viraram a escala
turquesa; o fundo índigo `#1b1846` virou o petróleo `#061a1f`, mantendo o mesmo
contraste com o texto claro.

## Forma e profundidade

| Token | Valor |
|---|---|
| `--radius-card` | `1.75rem` (28px) |
| `--radius-control` | `0.9rem` (~14px) |
| `--shadow-card` | sombra longa escura + filete claro interno no topo |
| `--shadow-raised` | sombra curta para botões em relevo |
| `--shadow-glow` | halo turquesa para foco/ação principal |

Classes utilitárias: `.ds-card`, `.ds-raised`, `.ds-gradient-primary`,
`.ds-gradient-warm`, `.ds-label` (rótulo em caixa alta com espaçamento largo).

## Tipografia

Poppins 400/500/600/700. Títulos de cartão em `ds-label` (12px, caixa alta,
`letter-spacing: .14em`), como “USERNAME” e “RATING” no kit.

## Componentes (`components/ui`)

| Componente | Origem no kit | Notas |
|---|---|---|
| `Card`, `CardTitle` | Todos os cartões | Gradiente diagonal + `shadow-card` |
| `IconButton` | Botões + − ⌂ ≡ … ↩ | 48px, `aria-label` obrigatório, halo no hover |
| `Button` (`primary` / `warm` / `ghost`) | LOGIN | Pílula, caixa alta |
| `StatPill` | “$4805.25” | Tons `primary`, `warm`, `danger`, `neutral` |
| `DonutGauge` | Anéis 45/60/75% | Fica vermelho quando `danger` |
| `MeterBars` | Barras MAX/MIN | Faixa aceitável tracejada |
| `Slider` | Slider com − / + | `input range` nativo, acessível por teclado |
| `AreaChart` | Gráfico de ondas | SVG, curvas suaves, linha-alvo opcional |
| `Chip` | — | Sugestões do chat |

## Acessibilidade

- Foco visível em turquesa (`:focus-visible`).
- Botões só de ícone têm `aria-label` e `title`.
- Respostas do chat em região `aria-live="polite"`; erros com `role="alert"`.
- Anéis e gráficos com `role="img"` e rótulo textual.
- Animações desligadas com `prefers-reduced-motion`.
