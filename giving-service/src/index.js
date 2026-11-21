/* Private Cloudflare Worker: gift notices, sponsor requests and organiser verification.
 * It never represents a pending notice or sponsor enquiry as received funds.
 */
const CURRENCIES=new Set(['NGN','GBP','USD','EUR','CNY']);
const SPONSOR_METHODS=new Set(['bank','paypal','stripe','alipay']);
const GIFT_METHODS=new Set(['bank','alipay']);
const SPONSOR_AMOUNT_NGN=10000000;
const logoTypes={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};

function response(value,status=200,extra={}){
  return new Response(JSON.stringify(value),{
    status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extra}
  });
}
function originHeaders(request,env){
  const origin=request.headers.get('origin');
  const list=String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!origin || !list.includes(origin))return null;
  return {'access-control-allow-origin':origin,'access-control-allow-methods':'GET,POST,OPTIONS',
    'access-control-allow-headers':'Content-Type, Authorization','vary':'Origin'};
}
function same(a,b) {
  if(typeof a!=='string'||typeof b!=='string'||!a.length||a.length!==b.length)return false;
  let bad=0;
  for(let i=0;i<a.length;i++)bad|=a.charCodeAt(i)^b.charCodeAt(i);
  return bad===0;
}
async function sha(value){
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function textValue(v,min,max) {
  return typeof v==='string' && v.trim().length>=min &&
    v.trim().length<=max && !/[\u0000-\u001F\u007f]/.test(v);
}
function emailValid(v){
  return textValue(v,5,160)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function amountValid(v){
  const number=Number(v);
  return Number.isFinite(number) && number>=0.01 && number<=1000000000 &&
    /^\d{1,10}(\.\d{1,2})?$/.test(String(v));
}
async function checkLimit(env,request){
  const global=await env.GLOBAL_LIMITER.limit({key:'global-giving'});
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const user=await env.IP_LIMITER.limit({key:ip});
  return Boolean(global.success && user.success);
}
async function jsonBody(request,max=4096){
  const header=request.headers.get('content-type')||'';
  if(!header.startsWith('application/json'))throw Error('format');
  if(Number(request.headers.get('content-length')||0)>max)throw Error('size');
  const raw=await request.text();
  if(raw.length>max)throw Error('size');
  return JSON.parse(raw);
}
function magicMatches(content,type){
  const b=new Uint8Array(content);
  if(type==='image/png')return b.length>8 && [137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v);
  if(type==='image/jpeg')return b.length>3 && b[0]===255 && b[1]===216 && b[2]===255;
  if(type==='image/webp')return b.length>12 &&
    [82,73,70,70].every((v,i)=>b[i]===v) &&
    [87,69,66,80].every((v,i)=>b[i+8]===v);
  return false;
}
export default {
  async fetch(request,env){
    const url=new URL(request.url), path=url.pathname;
    const isAdmin=path==='/api/admin/verify';
    const headers=originHeaders(request,env);
    // Authenticated server-side administrative calls need no browser Origin.
    if(!headers && !(isAdmin && !request.headers.get('origin')))
      return response({error:'Origin not permitted.'},403);
    const safeHeaders=headers||{};
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:safeHeaders});
    if(!env.GIVING_DB || !env.IP_LIMITER || !env.GLOBAL_LIMITER)
      return response({error:'Giving service is not available.'},503,safeHeaders);
    try{
      if(path==='/api/gifts/status' && request.method==='POST'){
        const body=await jsonBody(request);
        const id=String(body?.id||''), token=String(body?.token||'');
        if(!/^[\da-f-]{36}$/.test(id)||!/^[a-f0-9]{64}$/.test(token))
          return response({error:'Invalid reference.'},400,safeHeaders);
        const rec=await env.GIVING_DB.prepare('SELECT status FROM gift_notices WHERE id=? AND access_hash=?').bind(id,await sha(token)).first();
        if(!rec)return response({error:'Reference not found.'},404,safeHeaders);
        return response({status:rec.status},200,safeHeaders);
      }
      if(path==='/api/admin/verify' && request.method==='POST'){
        const expected=String(env.GIVING_ADMIN_TOKEN||'');
        if(!expected || !same(request.headers.get('authorization')||'','Bearer '+expected))
          return response({error:'Not authorised.'},401,safeHeaders);
        const body=await jsonBody(request);
        const id=String(body?.id||'');
        const kind=String(body?.kind||'');
        const state=String(body?.status||'');
        if(!/^[\da-f-]{36}$/.test(id))return response({error:'Invalid reference.'},400,safeHeaders);
        let table,valid;
        if(kind==='gift'){table='gift_notices';valid=['verified','rejected'].includes(state);}
        else if(kind==='sponsor'){table='sponsor_requests';valid=['approved','rejected','paid'].includes(state);}
        else return response({error:'Invalid type.'},400,safeHeaders);
        if(!valid)return response({error:'Invalid status.'},400,safeHeaders);
        // Only a privileged organiser can perform this transition, after their own manual checks.
        const result=await env.GIVING_DB.prepare('UPDATE '+table+' SET status=?,updated_at=? WHERE id=?')
          .bind(state,new Date().toISOString(),id).run();
        if(!result.meta?.changes)return response({error:'Reference not found.'},404,safeHeaders);
        return response({ok:true},200,safeHeaders);
      }
      if(request.method!=='POST')return response({error:'Not found.'},404,safeHeaders);
      if(path!=='/api/gifts/notice' && path!=='/api/sponsors/request')
        return response({error:'Not found.'},404,safeHeaders);
      if(!await checkLimit(env,request))
        return response({error:'Too many requests. Please try again later.'},429,safeHeaders);

      if(path==='/api/gifts/notice'){
        const p=await jsonBody(request);
        const amount=String(p?.amount??'');
        if(!textValue(p?.giftId,2,60)||!textValue(p?.giftName,2,120)||
           !textValue(p?.senderName,2,100)||!emailValid(p?.contactEmail)||
           !CURRENCIES.has(p?.currency)||!GIFT_METHODS.has(p?.method)||
           p?.consent!==true || !amountValid(amount) ||
           !(p?.transferReference===''||p?.transferReference===undefined||textValue(p?.transferReference,1,100)))
          return response({error:'Check your name, amount and transfer details.'},400,safeHeaders);
        const noticeId=crypto.randomUUID();
        const raw=crypto.getRandomValues(new Uint8Array(32));
        const token=[...raw].map(x=>x.toString(16).padStart(2,'0')).join('');
        const time=new Date().toISOString();
        await env.GIVING_DB.prepare(
          'INSERT INTO gift_notices(id,access_hash,gift_id,gift_name,sender_name,contact_email,currency,amount,method,transfer_reference,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?, ?,?)'
        ).bind(noticeId,await sha(token),p.giftId.trim(),p.giftName.trim(),
          p.senderName.trim(),p.contactEmail.trim(),p.currency,amount,p.method,
          String(p.transferReference||'').trim(),'pending',time,time).run();
        return response({accepted:true,noticeId,accessToken:token,status:'pending'},201,safeHeaders);
      }
      // Sponsor requests (optional logo stored in private R2 bucket).
      const length=Number(request.headers.get('content-length')||0);
      if(length>2600000)return response({error:'File or request is too large.'},413,safeHeaders);
      if(!(request.headers.get('content-type')||'').startsWith('multipart/form-data'))
        return response({error:'Invalid request type.'},415,safeHeaders);
      const form=await request.formData();
      const name=form.get('sponsorName'),email=form.get('email');
      const currency=form.get('preferredCurrency'),method=form.get('preferredMethod');
      const fixed=form.get('packageAmountNGN');
      const transferRef=String(form.get('transferReference')||'').trim();
      const consent=form.get('consent');
      if(!textValue(name,2,120)||!emailValid(email)||!CURRENCIES.has(currency)||
         !SPONSOR_METHODS.has(method)||fixed!=='10000000'||consent!=='yes'||
         (transferRef.length>0&&!textValue(transferRef,1,100)))
        return response({error:'Please check sponsorship contact and package details.'},400,safeHeaders);
      const file=form.get('logo');
      const hasFile=file && typeof file==='object' && typeof file.arrayBuffer==='function' && file.size>0;
      if(hasFile && (file.size>2*1024*1024 || !logoTypes[file.type]))
        return response({error:'Use a PNG, JPG or WebP logo below 2 MB.'},400,safeHeaders);
      if(hasFile && !env.SPONSOR_LOGOS)return response({error:'Logo storage is not configured.'},503,safeHeaders);
      const id=crypto.randomUUID(), now=new Date().toISOString();
      let key=null;
      if(hasFile){
        const data=await file.arrayBuffer();
        if(!magicMatches(data,file.type))return response({error:'Invalid image file.'},400,safeHeaders);
        key='private-sponsors/'+id+'.'+logoTypes[file.type];
        await env.SPONSOR_LOGOS.put(key,data,{httpMetadata:{contentType:file.type}});
      }
      try{
        await env.GIVING_DB.prepare(
          'INSERT INTO sponsor_requests(id,sponsor_name,email,package_amount_ngn,preferred_currency,preferred_method,transfer_reference,logo_key,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)'
        ).bind(id,name.trim(),email.trim(),SPONSOR_AMOUNT_NGN,currency,method,transferRef,key,'pending',now,now).run();
      }catch(e){
        if(key)await env.SPONSOR_LOGOS.delete(key);
        throw e;
      }
      return response({accepted:true,requestId:id,status:'pending'},201,safeHeaders);
    }catch(_){
      return response({error:'Unable to process the request. Please try again later.'},503,safeHeaders);
    }
  }
};