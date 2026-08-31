/* Lista as agendas da conta, para o usuário escolher qual tem a rotina. */
import { cors, json, gapi, kvGet } from './_lib.js';

export default async function handler(req, res){
  if (cors(req, res)) return;
  const conta = String((req.query && req.query.conta) || '');
  if (!conta) return json(res, 400, { erro: 'sem conta' });

  const u = await kvGet('u:' + conta);
  if (!u) return json(res, 404, { erro: 'conta desconhecida' });
  if (u.revogado) return json(res, 401, { erro: 'acesso revogado' });

  try {
    const d = await gapi(conta, 'users/me/calendarList', { maxResults: 100, minAccessRole: 'reader' });
    const agendas = (d.items || []).map(c => ({
      id: c.id,
      nome: c.summary || c.id,
      principal: !!c.primary
    }));
    json(res, 200, { agendas, escolhida: u.calendarId || '' });
  } catch(e) {
    json(res, e.status === 401 ? 401 : 502, { erro: String(e.message || e) });
  }
}
