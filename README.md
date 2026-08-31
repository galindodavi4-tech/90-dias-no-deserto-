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

O checklist inteiro funciona sem isso. Essa parte é só para a rotina vir da sua
agenda e se atualizar sozinha.

São quatro coisas. Faça no computador, não no celular — é bem mais fácil.
Guarde num bloco de notas o que a gente for copiando.

### 1. Criar o lugar onde as informações ficam guardadas

O app precisa de um cantinho para lembrar quem conectou a agenda.

1. Entre em `vercel.com` e abra o seu projeto.
2. Clique na aba **Storage**.
3. Clique em **Create Database** e escolha **Upstash → Redis**.
4. Dê qualquer nome, escolha a região mais perto do Brasil e crie.
5. Se aparecer a pergunta de conectar ao projeto, diga que sim.

Pronto. A Vercel já anota sozinha o endereço e a senha desse cantinho — você não
precisa copiar nada aqui.

### 2. Pedir autorização ao Google

Aqui você cria um cadastro no Google que dá ao app permissão de ler sua agenda.

1. Entre em `console.cloud.google.com` e crie um projeto (qualquer nome).
2. No menu, vá em **APIs e serviços → Biblioteca**. Procure por
   **Google Calendar API** e clique em **Ativar**.
3. Vá em **Tela de permissão OAuth**:
   - Escolha **Externo**.
   - Preencha nome do app e seu e-mail.
   - Na parte de **Usuários de teste**, adicione o seu e-mail do Gmail e o de
     quem mais for usar. Só quem estiver nessa lista consegue conectar.
4. Vá em **Credenciais → Criar credenciais → ID do cliente OAuth**:
   - Tipo: **Aplicativo da Web**.
   - Em **URIs de redirecionamento autorizados**, clique em adicionar e cole
     o endereço do seu app com `/api/auth/callback` no fim. Exemplo:
     `https://seu-app.vercel.app/api/auth/callback`
   - Clique em criar.
5. Vai aparecer uma janela com dois textos compridos: o **ID do cliente** e a
   **Chave secreta do cliente**. Copie os dois para o bloco de notas.

### 3. Provar ao Google que o site é seu

Essa etapa é só para o aviso instantâneo. O Google só manda o aviso "sua agenda
mudou" para um site que ele sabe que é seu.

No Cloud Console, vá em **APIs e serviços → Verificação de domínio** e adicione
o endereço do seu app, seguindo o passo a passo que ele mostrar.

**Atenção, porque isso pode travar:** endereço terminado em `.vercel.app` é da
Vercel, não seu, e o Google costuma recusar. Se recusar, você tem duas saídas:
usar um domínio próprio (comprar um e apontar para a Vercel) ou pular esta etapa.
Pulando, tudo continua funcionando — a rotina atualiza quando você abre o app, só
não no mesmo segundo. O app avisa na tela da Rotina quando é esse o caso, então
você não fica no escuro.

### 4. Colar as informações na Vercel

De volta em `vercel.com`, no seu projeto, vá em **Settings → Environment
Variables**. Adicione quatro, uma de cada vez, com esses nomes exatos:

| Nome | O que colar no valor |
|---|---|
| `GOOGLE_CLIENT_ID` | o **ID do cliente** que você copiou no passo 2 |
| `GOOGLE_CLIENT_SECRET` | a **Chave secreta do cliente** do passo 2 |
| `APP_URL` | o endereço do seu app, ex. `https://seu-app.vercel.app` (sem barra no fim) |
| `CRON_SECRET` | uma senha inventada por você, qualquer uma |

Salve e mande a Vercel publicar de novo (**Deployments → ... → Redeploy**), senão
as variáveis novas não entram.

Agora é abrir o app, ir na aba **Rotina** e tocar em **Conectar com o Google**.
Na primeira vez o Google mostra um aviso de "app não verificado" — é normal,
porque o cadastro está em modo de teste. Clique em **Avançado → Acessar
(não seguro)** e siga.

### Como funciona por dentro

O app nunca fala com o Google. Quem fala é o servidor: ele guarda a autorização,
mantém uma cópia dos próximos 14 dias da agenda e registra um canal de aviso.
Quando algo muda, o Google chama `/api/webhook`, o servidor rebusca a janela e
sobe a versão da cópia. O app pergunta "mudou?" a cada 20 segundos e recebe uma
resposta vazia quando não mudou — barato para os dois lados.

O canal de aviso do Google vence em poucos dias, então `/api/renovar` roda todo
dia às 6h UTC (configurado em `vercel.json`) e reabre os que estão perto de vencer.

Ao desconectar, o servidor fecha o canal, revoga a autorização no Google e apaga
tudo que era seu.

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
