/* O Google bate aqui a cada mudança na agenda.
   A notificação não traz o que mudou — é só um toque de campainha, com o corpo
   vazio. Então a gente rebusca a janela e atualiza o espelho. */
import { kvGet, mesmoSegredo, sincronizar } from './_lib.js';

export default async function handler(req, res){
  /* o Google só manda POST; qualquer outra coisa é ruído */
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const canalId = req.headers['x-goog-channel-id'] || '';
  const estado = req.headers['x-goog-resource-state'] || '';
  const segredo = req.headers['x-goog-channel-token'] || '';

  /* handshake da criação do canal: só confirmar */
  if (estado === 'sync') { res.status(200).end(); return; }
  if (!canalId) { res.status(400).end(); return; }

  const conta = await kvGet('ch:' + canalId);
  /* canal que não conhecemos: responder 200 mesmo assim, senão o Google fica
     tentando de novo por horas */
  if (!conta) { res.status(200).end(); return; }
  if (!mesmoSegredo(segredo, conta)) { res.status(403).end(); return; }

  const u = await kvGet('u:' + conta);
  if (!u || u.revogado || !u.calendarId) { res.status(200).end(); return; }

  try {
    await sincronizar(conta);
  } catch(e) {
    /* erro de verdade: devolver 500 faz o Google tentar de novo depois */
    const passageiro = !e.status || e.status >= 500 || e.status === 429;
    res.status(passageiro ? 500 : 200).end();
    return;
  }
  res.status(200).end();
}
