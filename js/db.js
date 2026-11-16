/* La belle appli — accès aux données (Supabase) et thème */
/* --- accès Supabase (hébergement durable) --- */
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v);}
function sbDb(code){
  const H={'apikey':SB.key,'Authorization':'Bearer '+SB.key,'Content-Type':'application/json'};
  const rpc=async(fn,args)=>{const r=await fetch(SB.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:H,body:JSON.stringify(Object.assign({p_code:code},args))});
    if(!r.ok){const e=new Error(await r.text());e.status=r.status;throw e;}const t=await r.text();return t?JSON.parse(t):null;};
  let rows=[],sig='',inflight=0,loaded=false,subs=[],timer=null;
  const sigOf=r=>stable(r.map(x=>[x.coll,x.id,x.data]).sort((a,b)=>(a[0]+a[1]).localeCompare(b[0]+b[1])));
  const fire=err=>subs.forEach(f=>f(err));
  async function poll(){
    if(inflight||document.hidden)return;
    try{const r=await rpc('xp_list',{});if(inflight)return;const g=sigOf(r);const was=loaded;loaded=true;
      if(S.sync==='err')setSync('ok');
      if(g!==sig||!was){sig=g;rows=r;fire();}}
    catch(e){if(loaded)setSync('err','Connexion perdue');}
  }
  async function check(){const r=await rpc('xp_list',{});rows=r;sig=sigOf(r);loaded=true;
    timer=setInterval(poll,5000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});window.addEventListener('online',poll);}
  async function write(fn,args,local){inflight++;try{await rpc(fn,args);local();sig=sigOf(rows);}finally{inflight--;}setTimeout(poll,400);}
  const listen=(get,ok,err)=>{const f=e=>{if(e){err&&err(e);return;}ok(get());};subs.push(f);if(loaded)setTimeout(()=>f(),0);};
  const meta={hasPendingWrites:false,fromCache:false};
  return {check,
    collection:n=>({onSnapshot:(ok,err)=>listen(()=>({metadata:meta,docs:rows.filter(r=>r.coll===n).map(r=>({id:r.id,data:()=>r.data}))}),ok,err)}),
    doc:path=>{const [c,i]=path.split('/');return {
      onSnapshot:(ok,err)=>listen(()=>{const r=rows.find(x=>x.coll===c&&x.id===i);return {metadata:meta,data:()=>r?r.data:undefined};},ok,err),
      set:d=>write('xp_set',{p_coll:c,p_id:i,p_data:d},()=>{rows=rows.filter(x=>!(x.coll===c&&x.id===i));rows.push({coll:c,id:i,data:JSON.parse(JSON.stringify(d))});}),
      delete:()=>write('xp_delete',{p_coll:c,p_id:i},()=>{rows=rows.filter(x=>!(x.coll===c&&x.id===i));})};},
    /* portraits : fonction dédiée (hors synchronisation), repli sur la liste complète tant que la requête SQL n'est pas installée */
    portraits:async()=>{try{return await rpc('xp_portraits',{});}catch(e){return rows.filter(r=>r.coll==='portraits');}}};
}
function askCode(msg){
  return new Promise(resolve=>{
    S.gate=true;S.dlg=null;
    for(const id of ['tabs','bnav','sheetRoot']){const el=document.getElementById(id);if(el)el.innerHTML='';}
    {const mb=document.getElementById('meBtn');if(mb)mb.style.visibility='hidden';}
    document.getElementById('app').innerHTML=`<form class="card" id="cdf" style="max-width:420px;margin:24px auto"><h2 style="margin-top:0">Code de la table</h2><div class="field"><label for="cd">Code</label><input id="cd" type="password" autocomplete="current-password"></div>${msg?`<div class="small" style="color:var(--bad);margin:8px 0" role="alert">${esc(msg)}</div>`:''}<button class="btn pri" type="submit" style="margin-top:8px">Entrer</button><div class="muted small" style="margin-top:8px">Demande le code au MJ. Il est retenu sur cet appareil.</div></form>`;
    setSync('local','Code requis');
    const f=document.getElementById('cdf');document.getElementById('cd').focus();
    f.addEventListener('submit',async ev=>{ev.preventDefault();const c=document.getElementById('cd').value;if(!c)return;
      const db=sbDb(c);
      try{await db.check();try{localStorage.setItem('xp.code',c);}catch(e){}S.gate=false;{const mb=document.getElementById('meBtn');if(mb)mb.style.visibility='';}setSync('loading');render();resolve(db);}
      catch(e){askCode(e&&e.status?'Code incorrect.':'Connexion impossible, réessaie.').then(resolve);}
    });
  });
}
async function getDb(){
  let c=null;try{c=localStorage.getItem('xp.code');}catch(e){}
  if(c){const db=sbDb(c);try{await db.check();return db;}catch(e){if(!(e&&e.status))throw e;}}
  return askCode(c?'Le code a changé, saisis-le à nouveau.':'');
}

/* --- thème clair / nuit --- */
(function(){
  const btn=document.getElementById('themeBtn');if(!btn)return;
  const mq=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
  const MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
  const SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>';
  const eff=()=>{const t=document.documentElement.getAttribute('data-theme');return t||(mq&&mq.matches?'dark':'light');};
  function paint(){const d=eff()==='dark';btn.innerHTML=d?SUN:MOON;btn.setAttribute('aria-label',d?'Passer au thème clair':'Passer au thème nuit');
    const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#0f1b1e':'#efe5cf');}
  btn.addEventListener('click',()=>{const n=eff()==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);try{localStorage.setItem('xp.theme',n);}catch(e){}paint();});
  if(mq&&mq.addEventListener)mq.addEventListener('change',paint);
  paint();
})();

