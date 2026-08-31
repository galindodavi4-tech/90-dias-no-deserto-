/* Grava a agenda escolhida, faz a primeira sincronização e abre o canal de
   aviso do Google. A partir daqui o Google avisa este servidor a cada mudança. */
import { cors, json, kvGet, kvSet, sincronizar, abrirCanal } from './_lib.js';

export default async function handler(req, res){
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { erro: 'use POST' });

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const conta = String(corpo.conta || '');
  const calendarId = String(corpo.calendarId || '');
  const calendarNome = String(corpo.calendarNome || '').slice(0, 80);
  if (!conta || !calendarId) return json(res, 400, { erro: 'faltam dados' });

  const u = await kvGet('u:' + conta);
  if (!u) return json(res, 404, { erro: 'conta desconhecida' });

  u.calendarId = calendarId;
  u.calendarNome = calendarNome;
  await kvSet('u:' + conta, u);

  try {
    const rotina = await sincronizar(conta);
    /* o canal é o webhook. Se o Google recusar (domínio não verificado, por
       exemplo), a rotina já está válida — só não chega sozinha. */
    let webhook = true, avisoWebhook = '';
    try { await abrirCanal(conta); }
    catch(e){
      webhook = false;
      avisoWebhook = String(e.message || e);
      const uu = await kvGet('u:' + conta);
      uu.canalFalhou = avisoWebhook; await kvSet('u:' + conta, uu);
    }
    json(res, 200, { ok: true, webhook, avisoWebhook, rotina });
  } catch(e) {
    json(res, e.status === 401 ? 401 : 502, { erro: String(e.message || e) });
  }
}
