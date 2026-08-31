/* Manda o usuário para a tela de permissão do Google.
   Pedimos access_type=offline para receber o refresh token, que é o que permite
   o servidor continuar lendo a agenda sem ninguém logado na frente. */
import { CLIENT_ID, REDIRECT_URI, APP_URL, faltaConfig, novoId, kvSet } from '../_lib.js';

export default async function handler(req, res){
  const faltando = faltaConfig();
  if (faltando.length) {
    res.status(500).send('Faltam variáveis de ambiente: ' + faltando.join(', '));
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
