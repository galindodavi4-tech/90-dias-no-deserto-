/* Fecha o canal, revoga o refresh token no Google e apaga a conta.
   Depois disso o servidor não guarda mais nada dessa pessoa. */
import { cors, json, kvGet, kvDel, fecharCanal } from './_lib.js';

export default async function handler(req, res){
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { erro: 'use POST' });

  const corpo = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const conta = String(corpo.conta || '');
  if (!conta) return json(res, 400, { erro: 'sem conta' });

  const u = await kvGet('u:' + conta);
  if (!u) return json(res, 200, { ok: true });   /* já não existe: nada a fazer */

  try { await fecharCanal(conta); } catch(e){}
  if (u.refresh) {
    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: u.refresh })
      });
    } catch(e){}
  }
  await kvDel('u:' + conta);
  await kvDel('r:' + conta);
  json(res, 200, { ok: true });
}
