# 90 Dias no Deserto — Checklist

Checklist diário, mapa de hábitos e metas por marco para desafios de 40, 60 ou 90 dias.
Site estático: um `index.html`, sem build, sem servidor, sem conta.

## Como funciona

- **Semana de preparação** — enquanto o desafio não começa, a tela inicial vira um painel azul com os 5 passos de preparação e a contagem regressiva.
- **Hoje** — marca os hábitos do dia, escreve o diário, gera o card do story e copia o resumo pro grupo.
- **Mapa** — a grade inteira do desafio (hábitos × dias). Dá para corrigir dias passados. Abaixo da grade, o gráfico de evolução mostra quantos hábitos você cumpriu em cada dia, com a média móvel de 7 dias.
- **Metas** — metas por marco (1 mês, 2 meses, 3 meses ou o dia final, conforme a duração).
- **Testes** — Yo-Yo, CMJ, SJ, teste técnico, peso e o que mais vocês medirem. Cada avaliação é de número (com base, variação e minigráfico) ou de texto (passou / não passou).
- **Ajustes** — nome, data de início, duração, hábitos, exportar/importar, zerar.

Os dados ficam no navegador de cada pessoa (`localStorage`). Ninguém vê o progresso do outro:
a partilha é pelo card do story e pelo resumo copiado.

## Rodar local

Abrir `index.html` no navegador já funciona. Para testar o modo app (manifest/ícone):

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Publicar

Qualquer host estático serve. Na Vercel, sem framework, com o diretório raiz como saída.

## Estrutura

```
index.html      app inteiro (HTML + CSS + JS)
manifest.json   instalação na tela de início
icon.svg        ícone
```
