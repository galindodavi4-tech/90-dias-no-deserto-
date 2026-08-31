/* Volta do Google com o código. Trocamos por tokens, criamos a conta e
   devolvemos o usuário ao app com a chave dele no fragmento da URL
   (fragmento não vai para o servidor nem para os logs). */
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, APP_URL, faltaConfig,
         novoId, kvGet, kvSet, kvDel } from '../_lib.js';

function volta(res, hash){
  res.setHeader('Cache-Control', 'no-store');
  res.redirect(302, APP_URL + '/#' + hash);
}

export default async function handler(req, res){
  if (faltaConfig().length) { res.status(500).send('Servidor sem configuração'); return; }

  const { code, state, error } = req.query || {};
  if (error) return volta(res, 'gerro=' + encodeURIComponent(error));
  if (!code || !state) return volta(res, 'gerro=sem_codigo');

  const guardado = await kvGet('st:' + state);
  if (!guardado) return volta(res, 'gerro=state_invalido');
  await kvDel('st:' + state);

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: String(code),
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  const j = await r.json();
  if (!r.ok || !j.refresh_token) {
    /* sem refresh token não dá para manter o webhook vivo */
    return volta(res, 'gerro=' + encodeURIComponent(j.error || 'sem_refresh'));
  }

  const conta = novoId();
  await kvSet('u:' + conta, {
    refresh: j.refresh_token,
    acesso: j.access_token || '',
    expira: Date.now() + (j.expires_in || 3600) * 1000,
    criadoEm: Date.now()
  });

  volta(res, 'gconta=' + conta);
}
