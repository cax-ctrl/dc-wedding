// Cloudflare Worker + D1: shared, atomic gift reservation states.
// Configure REGISTRY_DB, ALLOWED_ORIGINS and REGISTRY_ADMIN_TOKEN outside the public repo.
const IDS = new Set(['luggage', 'cars', 'photo-frame', 'bedding', 'coffee']);
const HOLD_SECONDS = 72 * 60 * 60;
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
}
function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  return origin && allowed.includes(origin)
    ? {'access-control-allow-origin':origin,'access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'Content-Type, Authorization','vary':'Origin'}
    : {};
}
function safeEqual(a,b) {
  if(typeof a !== 'string' || typeof b !== 'string' || !a.length || a.length!==b.length) return false;
  let mismatch = 0;
  for(let i=0;i<a.length;i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
async function hash(raw) {
  const bytes = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function cleanHolds(db) {
  await db.prepare("UPDATE registry_items SET status='available',guest_name=NULL,guest_email=NULL,reservation_token_hash=NULL,reserved_until=NULL,updated_at=? WHERE status='reserved' AND reserved_until<=?")
    .bind(Math.floor(Date.now()/1000),Math.floor(Date.now()/1000)).run();
}
async function parseBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('JSON content type is required.');
  if (Number(request.headers.get('content-length') || 0) > 4096) throw new Error('Request too large.');
  const text = await request.text();
  if(text.length>4096) throw new Error('Request too large.');
  return JSON.parse(text);
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || '';
    const headers = corsHeaders(origin, env);
    const permitted = Object.keys(headers).length > 0;
    if (request.method === 'OPTIONS') return new Response(null, {status:permitted?204:403,headers});
    if (origin && !permitted) return json({error:'Origin not permitted.'},403,headers);
    if (!env.REGISTRY_DB) return json({error:'Registry database unavailable.'},503,headers);
    const path = new URL(request.url).pathname;
    if (path === '/api/registry' && request.method === 'GET') {
      await cleanHolds(env.REGISTRY_DB);
      const rows = await env.REGISTRY_DB.prepare('SELECT id,status FROM registry_items ORDER BY id').all();
      return json({items:rows.results || []},200,headers);
    }
    if(path === '/api/registry/checkout') {
      // Never accept payment without a verified payment processor and webhook.
      return json({error:'Secure checkout is not available yet.'},503,headers);
    }
    if (request.method !== 'POST') return json({error:'Not found.'},404,headers);
    let body;
    try {body = await parseBody(request);} catch (_) {return json({error:'Invalid request.'},400,headers);}
    if (path === '/api/registry/reserve') {
      const id = String(body.itemId || '');
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      if (!IDS.has(id) || name.length<2 || name.length>100 || email.length>160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return json({error:'Please enter a valid name and email address.'},400,headers);
      await cleanHolds(env.REGISTRY_DB);
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const token = [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
      const tokenHash = await hash(token);
      const now = Math.floor(Date.now()/1000);
      const result = await env.REGISTRY_DB.prepare("UPDATE registry_items SET status='reserved',guest_name=?,guest_email=?,reservation_token_hash=?,reserved_until=?,updated_at=? WHERE id=? AND status='available'")
        .bind(name,email,tokenHash,now+HOLD_SECONDS,now,id).run();
      if (!result.meta?.changes) return json({error:'This gift has already been reserved or purchased.'},409,headers);
      return json({ok:true,reservationToken:token,reservedUntil:new Date((now+HOLD_SECONDS)*1000).toISOString()},201,headers);
    }
    if(path === '/api/registry/release') {
      const id = String(body.itemId || '');
      const token = String(body.reservationToken || '');
      if (!IDS.has(id) || token.length !== 64) return json({error:'Invalid reservation.'},400,headers);
      const tokenHash = await hash(token);
      const result = await env.REGISTRY_DB.prepare("UPDATE registry_items SET status='available',guest_name=NULL,guest_email=NULL,reservation_token_hash=NULL,reserved_until=NULL,updated_at=? WHERE id=? AND status='reserved' AND reservation_token_hash=?")
        .bind(Math.floor(Date.now()/1000),id,tokenHash).run();
      if(!result.meta?.changes) return json({error:'Reservation not found or already released.'},404,headers);
      return json({ok:true},200,headers);
    }
    if(path === '/api/registry/admin/mark') {
      const auth = request.headers.get('authorization') || '';
      if (!env.REGISTRY_ADMIN_TOKEN || !safeEqual(auth,'Bearer '+env.REGISTRY_ADMIN_TOKEN))
        return json({error:'Unauthorised.'},401,headers);
      const id = String(body.itemId || '');
      const status = String(body.status || '');
      if(!IDS.has(id) || !['available','reserved','purchased'].includes(status))
        return json({error:'Invalid item or status.'},400,headers);
      if(status === 'reserved') return json({error:'Use the public reservation endpoint to reserve.'},400,headers);
      await env.REGISTRY_DB.prepare("UPDATE registry_items SET status=?, guest_name=NULL,guest_email=NULL,reservation_token_hash=NULL,reserved_until=NULL,updated_at=? WHERE id=?")
        .bind(status,Math.floor(Date.now()/1000),id).run();
      return json({ok:true},200,headers);
    }
    return json({error:'Not found.'},404,headers);
  }
};
