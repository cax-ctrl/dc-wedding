// Private server-side RSVP gateway. Submitting never issues an invitation code.
const COUNTRY = {
  NG: {prefix:'+234',mobile:/^\+234[789]\d{9}$/},
  GB: {prefix:'+44',mobile:/^\+447\d{9}$/},
  US: {prefix:'+1',mobile:/^\+1[2-9]\d{2}[2-9]\d{6}$/},
  CN: {prefix:'+86',mobile:/^\+861[3-9]\d{9}$/}
};
const METHODS = new Set(['SMS','WhatsApp','WeChat']);
function response(payload,status,extra={}) {
  return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extra}});
}
function cors(origin,env) {
  const approved=String(env.ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);
  if(!origin || !approved.includes(origin)) return null;
  return {'access-control-allow-origin':origin,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'Content-Type','vary':'Origin'};
}
function validName(name) {
  return typeof name==='string' && name.trim().length>=2 && name.trim().length<=100
    && !/[\u0000-\u001f\u007f]/.test(name);
}
function validWechat(id) {
  return typeof id==='string' && id.trim().length>=2 && id.trim().length<=80
    && !/[\u0000-\u001f\u007f]/.test(id);
}
export default {
  async fetch(request,env) {
    const origin=request.headers.get('Origin')||'';
    const headers=cors(origin,env);
    if(!headers) return response({error:'Origin not allowed.'},403);
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
    if(new URL(request.url).pathname!=='/api/rsvp/request' || request.method!=='POST')
      return response({error:'Not found.'},404,headers);

    if(!env.APPS_SCRIPT_URL || !env.RSVP_BRIDGE_SECRET ||
       !env.RSVP_RATE_LIMITER || !env.RSVP_GLOBAL_LIMITER) {
      return response({error:'RSVP requests are not yet open.'},503,headers);
    }
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(env.APPS_SCRIPT_URL))
      return response({error:'RSVP configuration is incomplete.'},503,headers);
    if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
      return response({error:'Invalid request format.'},415,headers);
    let data;
    try {
      const length=Number(request.headers.get('content-length')||0);
      if(length>2048) throw Error('Too large');
      const raw=await request.text();
      if(raw.length>2048) throw Error('Too large');
      data=JSON.parse(raw);
    }catch(_){return response({error:'Invalid request.'},400,headers);}
    if(!data || typeof data!=='object' || Array.isArray(data))
      return response({error:'Invalid request.'},400,headers);
    if(data.website) return response({accepted:true},202,headers);

    const country=String(data.country||'');
    const name=String(data.fullName||'').trim().replace(/\s+/g,' ');
    const phone=String(data.phone||'').trim();
    const method=String(data.confirmationMethod||'');
    const wechatId=String(data.wechatId||'').trim();
    if(!COUNTRY[country] || !COUNTRY[country].mobile.test(phone) ||
       !validName(name) || !METHODS.has(method) || data.consent!==true ||
       (method==='WeChat' && !validWechat(wechatId))) {
      return response({error:'Please check your name, country, mobile number and confirmation method.'},400,headers);
    }
    const globalLimit=await env.RSVP_GLOBAL_LIMITER.limit({key:'rsvp-global'});
    const phoneLimit=await env.RSVP_RATE_LIMITER.limit({key:phone});
    if(!globalLimit.success || !phoneLimit.success)
      return response({error:'Too many requests. Please try again later.'},429,headers);

    try {
      const bridge=await fetch(env.APPS_SCRIPT_URL,{
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=UTF-8'},
        redirect:'follow',
        body:JSON.stringify({
          bridgeSecret:env.RSVP_BRIDGE_SECRET,
          requestId:crypto.randomUUID(),
          fullName:name,country,phone,
          confirmationMethod:method,
          wechatId:method==='WeChat'?wechatId:'',
          consent:true
        })
      });
      if(!bridge.ok) throw Error('Bridge HTTP error');
      const result=await bridge.json();
      if(result?.ok!==true) throw Error('Bridge not acknowledged');
      // Do not return an invitation code or details of any prior submission.
      return response({accepted:true},202,headers);
    }catch(_){
      return response({error:'We could not receive your request. Please try again later.'},503,headers);
    }
  }
};
