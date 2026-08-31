/* Manda o usuário para a tela de permissão do Google.
   Pedimos access_type=offline para receber o refresh token, que é o que permite
   o servidor continuar lendo a agenda sem ninguém logado na frente. */
import { CLIENT_ID, REDIRECT_URI, APP_URL, faltaConfig, novoId, kvSet } from '../_lib.js';

export default async function handler(req, res){
  const faltando = faltaConfig();
  if (faltando.length) {
    /* sem isso o login nem começa. Melhor uma página que explica do que um erro cru. */
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send(`<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Falta configurar</title>
<style>body{margin:0;padding:32px 22px;background:#15130F;color:#E7DFCC;
font-family:system-ui,sans-serif;line-height:1.55}h1{font-size:20px;margin:0 0 14px}
p{color:#8F857A;margin:0 0 12px}li{color:#8F857A;margin-bottom:6px}
code{background:#2C2720;padding:2px 6px;border-radius:5px;color:#E7DFCC}
a{color:#E8A24A}</style>
<h1>Falta terminar a configuração</h1>
<p>A conexão com o Google ainda não pode ser feita porque o servidor não recebeu:</p>
<ul>${faltando.map(f => '<li>' + f + '</li>').join('')}</ul>
<p>Isso se resolve no painel da Vercel, em <b>Settings → Environment Variables</b>.
O passo a passo completo está no <code>README.md</code> do projeto, na parte
“Ligar o Google Calendar”.</p>
<p>Depois de salvar, publique de novo (<b>Deployments → Redeploy</b>) para as
informações novas entrarem.</p>
<p><a href="/">Voltar para o app</a></p>`);
    return;
  }

  /* state de uso único, contra CSRF no retorno */
  const state = novoId();
  await kvSet('st:' + state, { criadoEm: Date.now() }, 600);

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.readonly');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', state);

  res.setHeader('Cache-Control', 'no-store');
  res.redirect(302, url.toString());
}
