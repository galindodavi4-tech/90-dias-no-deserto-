/* O app lê a rotina daqui. É uma leitura de cache: o webhook já deixou tudo
   pronto, então a resposta é rápida e não gasta cota do Google.
   Com ?v=<versao que o app já tem>, devolve 204 quando nada mudou — assim o
   app pode perguntar de poucos em poucos segundos sem pesar. */
import { cors, json, kvGet, sincronizar } from './_lib.js';

export default async function handler(req, res){
  if (cors(req, res)) return;
  const q = req.query || {};
  const conta = String(q.conta || '');
  if (!conta) return json(res, 400, { erro: 'sem conta' });

  const u = await kvGet('u:' + conta);
  if (!u) return json(res, 404, { erro: 'conta desconhecida' });
  if (u.revogado) return json(res, 401, { erro: 'acesso revogado' });

  let rotina = await kvGet('r:' + conta);

  /* forçar=1 é o botão "Atualizar agora"; também cobre o caso de o canal ter
     morrido sem a gente perceber */
  if (!rotina || q['forcar'] === '1') {
    try { rotina = await sincronizar(conta); }
    catch(e){
      if (!rotina) return json(res, e.status === 401 ? 401 : 502, { erro: String(e.message || e) });
    }
  }

  if (q.v && rotina && String(rotina.versao) === String(q.v)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(204).end();
  }

  json(res, 200, {
    versao: rotina.versao,
    atualizadoEm: rotina.atualizadoEm,
    calendarNome: u.calendarNome || rotina.calendarNome || '',
    calendarId: u.calendarId || '',
    webhook: !!u.canalId,
    avisoWebhook: u.canalFalhou || '',
    eventos: rotina.eventos || []
  });
}
