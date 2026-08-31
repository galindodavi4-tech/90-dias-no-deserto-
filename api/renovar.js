/* Cron diário. Canal do Google Calendar tem prazo de validade (poucos dias),
   e quando ele vence o webhook simplesmente para de chegar — sem aviso.
   Aqui a gente reabre os que estão perto de vencer. */
import { kvChaves, kvGet, abrirCanal, sincronizar, json } from './_lib.js';

const DOIS_DIAS = 2 * 24 * 60 * 60 * 1000;

export default async function handler(req, res){
  /* protege o endpoint: a Vercel manda o cabeçalho de cron, e aceitamos também
     um segredo próprio para poder chamar na mão */
  const autorizado =
    (req.headers['user-agent'] || '').includes('vercel-cron') ||
    (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET);
  if (!autorizado) return json(res, 401, { erro: 'nao autorizado' });

  const chaves = (await kvChaves('u:*')) || [];
  const relatorio = { contas: chaves.length, renovados: 0, falhas: 0, pulados: 0 };

  for (const chave of chaves) {
    const conta = chave.slice(2);
    try {
      const u = await kvGet(chave);
      if (!u || u.revogado || !u.calendarId) { relatorio.pulados++; continue; }
      const vence = Number(u.canalExpira || 0);
      if (u.canalId && vence && vence - Date.now() > DOIS_DIAS) { relatorio.pulados++; continue; }
      await abrirCanal(conta);
      await sincronizar(conta);   /* enquanto o canal esteve fechado pode ter mudado algo */
      relatorio.renovados++;
    } catch(e) {
      relatorio.falhas++;
    }
  }
  json(res, 200, relatorio);
}
