/* Peças compartilhadas pelas funções da API.
   Guardamos tudo no Redis (Upstash) via REST, que funciona em qualquer runtime
   serverless só com duas variáveis de ambiente. */

/* A Upstash cria variáveis com nomes diferentes dependendo de como o banco foi
   ligado na Vercel. Aceitamos os dois para ninguém precisar renomear nada. */
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN;

export const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
/* endereço público do app, sem barra no fim. Ex.: https://deserto.vercel.app */
export const APP_URL = (process.env.APP_URL || '').replace(/\/+$/, '');
export const REDIRECT_URI = APP_URL + '/api/auth/callback';

/* janela de agenda que mantemos espelhada, em dias */
export const JANELA_DIAS = 14;

export function faltaConfig(){
  const faltando = [];
  if (!KV_URL || !KV_TOKEN) faltando.push('o banco (Upstash Redis) não está ligado no projeto');
  if (!CLIENT_ID) faltando.push('GOOGLE_CLIENT_ID');
  if (!CLIENT_SECRET) faltando.push('GOOGLE_CLIENT_SECRET');
  if (!APP_URL) faltando.push('APP_URL');
  return faltando;
}

/* ---------- Redis ---------- */
async function kv(cmd){
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KV_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  if (!r.ok) throw new Error('kv ' + r.status);
  const j = await r.json();
  if (j.error) throw new Error('kv ' + j.error);
  return j.result;
}
export async function kvGet(chave){
  const v = await kv(['GET', chave]);
  if (v == null) return null;
  try { return JSON.parse(v); } catch(e){ return v; }
}
export async function kvSet(chave, valor, segundos){
  const cmd = ['SET', chave, JSON.stringify(valor)];
  if (segundos) cmd.push('EX', String(segundos));
  return kv(cmd);
}
export const kvDel = chave => kv(['DEL', chave]);
export const kvChaves = padrao => kv(['KEYS', padrao]);

/* ---------- identificadores ---------- */
export function novoId(){
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return Array.from(b, x => x.toString(16).padStart(2,'0')).join('');
}
/* comparação que não vaza tempo, para os segredos que chegam de fora */
export function mesmoSegredo(a, b){
  const x = String(a || ''), y = String(b || '');
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
}

/* ---------- respostas ---------- */
export function json(res, status, corpo){
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(corpo));
}
export function cors(req, res){
  const origem = req.headers.origin;
  if (origem && APP_URL && origem === APP_URL) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

/* ---------- Google ---------- */
/* devolve um access token válido, renovando pelo refresh token quando precisa */
export async function tokenDe(conta){
  const u = await kvGet('u:' + conta);
  if (!u || !u.refresh) throw new Error('conta desconhecida');
  if (u.acesso && u.expira > Date.now() + 60000) return u.acesso;

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: u.refresh,
      grant_type: 'refresh_token'
    })
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) {
    /* refresh revogado pelo usuário: a conta precisa reconectar */
    if (j.error === 'invalid_grant') { u.revogado = true; await kvSet('u:' + conta, u); }
    throw new Error('refresh falhou: ' + (j.error || r.status));
  }
  u.acesso = j.access_token;
  u.expira = Date.now() + (j.expires_in || 3600) * 1000;
  await kvSet('u:' + conta, u);
  return u.acesso;
}

export async function gapi(conta, caminho, params, opcoes){
  const token = await tokenDe(conta);
  const url = new URL('https://www.googleapis.com/calendar/v3/' + caminho);
  Object.entries(params || {}).forEach(([k,v]) => { if (v !== undefined && v !== '') url.searchParams.set(k, v); });
  const r = await fetch(url, Object.assign({
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
  }, opcoes || {}));
  const txt = await r.text();
  let j = null; try { j = txt ? JSON.parse(txt) : null; } catch(e){}
  if (!r.ok) {
    /* token morto (acesso revogado, por exemplo): joga fora o que está em cache
       para a próxima chamada tentar o refresh em vez de insistir com ele */
    if (r.status === 401) {
      const u = await kvGet('u:' + conta);
      if (u) { delete u.acesso; delete u.expira; await kvSet('u:' + conta, u); }
    }
    const e = new Error('google ' + r.status + ' ' + (j && j.error && j.error.message || ''));
    e.status = r.status;
    throw e;
  }
  return j;
}

const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');

/* converte um evento da API no item que o app entende */
export function paraItem(ev){
  if (!ev || ev.status === 'cancelled') return null;
  const ini = ev.start && ev.start.dateTime;
  if (!ini) return null;                       /* evento de dia inteiro não tem horário */
  const di = new Date(ini);
  if (isNaN(di)) return null;
  const df = ev.end && ev.end.dateTime ? new Date(ev.end.dateTime) : null;

  /* o horário tem que ser lido no fuso de quem criou o evento, não no do servidor */
  const fuso = (ev.start.timeZone) || null;
  const hhmm = d => {
    const f = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: fuso || undefined
    });
    return f.format(d);
  };
  const dia = d => {
    if (!fuso) return iso(d);
    const f = new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit', timeZone: fuso });
    return f.format(d);
  };
  const dataIni = dia(di);
  return {
    id: 'g' + (ev.id || Math.random().toString(36).slice(2)),
    data: dataIni,
    ini: hhmm(di),
    fim: (df && dia(df) === dataIni) ? hhmm(df) : '',
    nome: String(ev.summary || 'Sem título').trim().slice(0,60),
    google: true
  };
}

/* busca a janela inteira e guarda. Devolve a rotina nova. */
export async function sincronizar(conta){
  const u = await kvGet('u:' + conta);
  if (!u || !u.calendarId) throw new Error('sem agenda escolhida');

  const agora = new Date();
  const de = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const ate = new Date(de); ate.setDate(ate.getDate() + JANELA_DIAS);

  let pagina = '', brutos = [], voltas = 0;
  do {
    const d = await gapi(conta, 'calendars/' + encodeURIComponent(u.calendarId) + '/events', {
      timeMin: de.toISOString(),
      timeMax: ate.toISOString(),
      singleEvents: 'true',      /* o Google expande as repetições e resolve o fuso */
      orderBy: 'startTime',
      maxResults: '250',
      showDeleted: 'false',
      pageToken: pagina
    });
    brutos = brutos.concat(d.items || []);
    pagina = d.nextPageToken || '';
  } while (pagina && ++voltas < 8);

  const eventos = brutos.map(paraItem).filter(Boolean).slice(0, 400);
  const antes = await kvGet('r:' + conta);
  const igual = antes && JSON.stringify(antes.eventos) === JSON.stringify(eventos);
  const rotina = {
    versao: igual ? antes.versao : (antes ? antes.versao + 1 : 1),
    atualizadoEm: new Date().toISOString(),
    calendarNome: u.calendarNome || '',
    eventos
  };
  await kvSet('r:' + conta, rotina);
  return rotina;
}

/* ---------- canal de aviso do Google (o webhook) ---------- */
export async function abrirCanal(conta){
  const u = await kvGet('u:' + conta);
  if (!u || !u.calendarId) throw new Error('sem agenda escolhida');
  await fecharCanal(conta);

  const canalId = novoId();
  const r = await gapi(conta, 'calendars/' + encodeURIComponent(u.calendarId) + '/events/watch', {}, {
    method: 'POST',
    body: JSON.stringify({
      id: canalId,
      type: 'web_hook',
      address: APP_URL + '/api/webhook',
      token: conta                       /* volta no cabeçalho, confere de quem é */
    })
  });
  u.canalId = canalId;
  u.recursoId = r.resourceId || '';
  u.canalExpira = Number(r.expiration || 0);
  delete u.canalFalhou;
  await kvSet('u:' + conta, u);
  await kvSet('ch:' + canalId, conta);
  return u;
}

export async function fecharCanal(conta){
  const u = await kvGet('u:' + conta);
  if (!u || !u.canalId || !u.recursoId) return;
  try {
    const token = await tokenDe(conta);
    await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.canalId, resourceId: u.recursoId })
    });
  } catch(e){ /* canal já morto: tudo bem */ }
  await kvDel('ch:' + u.canalId);
  delete u.canalId; delete u.recursoId; delete u.canalExpira;
  await kvSet('u:' + conta, u);
}
