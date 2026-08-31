# 90 Dias no Deserto — Checklist

Checklist diário, mapa de hábitos e metas por marco para desafios de 40, 60 ou 90 dias.
Site estático: um `index.html`, sem build, sem servidor, sem conta.

## Como funciona

- **Semana de preparação** — enquanto o desafio não começa, a tela inicial vira um painel azul com os 5 passos de preparação e a contagem regressiva.
- **Hoje** — a frase do dia, os hábitos, o placar de pontos e o diário. Três formas de compartilhar: o relatório do dia em imagem (botão **Publicar**), o card do story e o resumo em texto.
- **Pontuação** — cada hábito cumprido vale 10 pontos. Com 7 hábitos, um dia perfeito vale 70 e o desafio de 90 dias vale 6.300. O placar mostra os pontos do dia, o total, o possível até aqui e o valor do desafio inteiro.
- **Frase do dia** — 19 frases de motivação giram em voltas reembaralhadas: uma por dia, sempre a mesma para a mesma data, sem repetir na virada de uma volta para a outra. Aparece na tela inicial, no relatório e no resumo.
- **Rotina** — os próximos 7 dias, com data. Vem de duas fontes que convivem: o **Google Calendar conectado** (eventos reais, com hora certa) e os **blocos fixos** que você monta no app e se repetem toda semana. O Trello ainda entra por arquivo (`.json` do quadro).
- **Google Calendar** — você autoriza uma vez, escolhe a agenda e pronto. Mexeu na agenda, o Google avisa o servidor **na hora** (webhook) e a rotina muda no app em segundos, sem ninguém apertar nada. Só leitura: o app nunca escreve na sua agenda. Nenhum token do Google fica no aparelho.
- **O que é agora** — com a rotina montada, a tela inicial abre com o evento em andamento em destaque, com emoji e quanto falta para acabar. Fora de horário, mostra o próximo, mesmo que seja em outro dia. O aviso se atualiza sozinho conforme o relógio anda.
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

## Ligar o Google Calendar

O checklist funciona sem isso. Só a sincronização instantânea da rotina precisa
de configuração, porque o webhook do Google exige um servidor para receber o aviso.

**1. Banco (Upstash Redis).** No painel da Vercel, aba Storage, adicione um Redis
da Upstash ao projeto. Isso já cria `KV_REST_API_URL` e `KV_REST_API_TOKEN` sozinho.

**2. Projeto no Google Cloud** (`console.cloud.google.com`):

- Em **APIs e serviços → Biblioteca**, ative a **Google Calendar API**.
- Em **Tela de permissão OAuth**, escolha **Externo**, preencha o nome e adicione
  em **Usuários de teste** o e-mail de quem vai usar (até 100 pessoas).
- Em **Credenciais → Criar credenciais → ID do cliente OAuth**, tipo
  **Aplicativo da Web**. Em **URIs de redirecionamento autorizados**, coloque
  `https://SEU-APP.vercel.app/api/auth/callback`.
- Guarde o **Client ID** e o **Client secret**.

**3. Verificar o domínio.** O Google só entrega webhook em domínio verificado.
No Cloud Console, em **APIs e serviços → Verificação de domínio**, adicione o
domínio do app e siga o passo a passo do Search Console. Sem isso tudo funciona,
menos o aviso instantâneo — o app avisa na tela quando isso acontece.

**4. Variáveis de ambiente na Vercel:**

```
GOOGLE_CLIENT_ID       o Client ID do passo 2
GOOGLE_CLIENT_SECRET   o Client secret do passo 2
APP_URL                https://SEU-APP.vercel.app   (sem barra no fim)
CRON_SECRET            uma senha qualquer, só para chamar /api/renovar na mão
```

Depois é abrir a aba **Rotina** e tocar em **Conectar com o Google**.

### Como funciona por dentro

O app nunca fala com o Google. Quem fala é o servidor: ele guarda o refresh token,
mantém um espelho dos próximos 14 dias da agenda e registra um canal de aviso.
Quando algo muda, o Google chama `/api/webhook`, o servidor rebusca a janela e sobe
a versão do espelho. O app pergunta "mudou?" a cada 20 segundos e recebe uma
resposta vazia quando não mudou — barato para os dois lados.

Canal do Google vence em poucos dias, então `/api/renovar` roda todo dia às 6h UTC
(configurado em `vercel.json`) e reabre os que estão perto de vencer.

Ao desconectar, o servidor fecha o canal, revoga o token no Google e apaga tudo
que era seu.

## Estrutura

```
index.html               app inteiro (HTML + CSS + JS)
manifest.json            instalação na tela de início
icon.svg                 ícone
vercel.json              agenda do cron de renovação
api/_lib.js              Redis, tokens, sincronização e canal de aviso
api/auth/start.js        manda para a tela de permissão do Google
api/auth/callback.js     recebe o código e cria a conta
api/agendas.js           lista as agendas da conta
api/escolher.js          grava a agenda, sincroniza e abre o webhook
api/rotina.js            o que o app lê (204 quando nada mudou)
api/webhook.js           o aviso do Google chega aqui
api/renovar.js           cron diário que reabre canais perto de vencer
api/desconectar.js       fecha o canal, revoga o token e apaga a conta
```
