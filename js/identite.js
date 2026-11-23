/* La belle appli — Identité : code PIN par joueur, mode Visiteur, contournement par la gestion.
   Les PIN sont vérifiés par Supabase (script 3_pin.sql) ; sans ce script, l'appli garde l'ancien choix libre. */
const LSx={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}}};
const toks=()=>{try{return JSON.parse(LSx.get('xp.tok')||'{}')||{};}catch(e){return {};}};
const setTok=(p,t)=>{const o=toks();if(t)o[p]=t;else delete o[p];LSx.set('xp.tok',JSON.stringify(o));};
let BY=LSx.get('xp.by')||null;          /* personne avec droits de gestion qui a pris une autre identité */
S.visit=LSx.get('xp.visit')==='1';
S.id={state:'init',pins:null,off:false,started:false};
const realId=()=>BY||ME;
const realGest=()=>!!realId()&&hasGest(S.players[realId()]);
const pinOn=()=>!S.id.off;
/* Démarrage : vérifie que cet appareil est reconnu pour l'identité retenue */
async function idInit(){if(S.id.started||!DB||!Object.keys(S.players).length)return;S.id.started=true;
  try{const r=await DB.rpc('xp_pin_status',{});S.id.pins=new Set((r||[]).map(x=>typeof x==='string'?x:(x.xp_pin_status||x.player||Object.values(x)[0])));}
  catch(e){S.id.off=true;S.id.state='ok';render();return;}
  if(S.visit){S.id.state='ok';render();return;}
  const who=realId();let ok=false;
  if(who&&S.players[who]){const t=toks()[who];if(t){try{ok=!!(await DB.rpc('xp_pin_token',{p_player:who,p_token:t}));}catch(e){ok=false;}}
    if(ok&&BY&&(!hasGest(S.players[BY])||!S.players[ME]))ok=false;}
  if(ok){S.id.state='ok';render();return;}
  if(BY){ME=BY;BY=null;LSx.set('xp.by',null);LSx.set('xp.me',ME);}
  S.id.state='need';S.pinF=ME&&S.players[ME]?pinStart(ME):null;render();}
const pinStart=pid=>({pid,mode:S.id.pins&&S.id.pins.has(pid)?'enter':'create',a:'',b:'',err:'',busy:false});
/* Changement d'identité effectif (transfert de l'abonnement aux notifications comme avant) */
function meApply(pid,keepPush){const old=ME;ME=pid;LSx.set('xp.me',ME);S._force=true;
  if(!keepPush&&S.pushSub&&old!==ME&&ME){const js=S.pushSub.toJSON(),ep=js.endpoint;for(const pp of Object.values(S.players)){if(pp.id!==ME&&(pp.push||[]).some(x=>x.endpoint===ep)){const n=clone(pp);n.push=n.push.filter(x=>x.endpoint!==ep);savePlayer(n);}}
    const me=S.players[ME];if(me&&!(me.push||[]).some(x=>x.endpoint===ep)){const n=clone(me);n.push=[...(n.push||[]),{endpoint:ep,keys:js.keys}];savePlayer(n);}}}
function idDone(pid,token){if(token)setTok(pid,token);BY=null;LSx.set('xp.by',null);S.visit=false;LSx.set('xp.visit',null);meApply(pid);S.id.state='ok';S.pinF=null;S.dlg=null;if(S.id.pins)S.id.pins.add(pid);render();}
function idVisit(){S.visit=true;LSx.set('xp.visit','1');BY=null;LSx.set('xp.by',null);ME=null;LSx.set('xp.me',null);S.asPlayer=false;S.id.state='ok';S.pinF=null;S.dlg=null;S._force=true;render();}
/* Droits de gestion : prendre une identité sans PIN, puis revenir */
function idSwitchAs(pid){const origin=realId();BY=pid===origin?null:origin;LSx.set('xp.by',BY);S.visit=false;LSx.set('xp.visit',null);S.asPlayer=false;meApply(pid,true);S.pinF=null;S.dlg=null;render();}
/* Choix d'une identité (écran d'accueil ou fenêtre « Changer d'identité ») */
function idPick(pid){if(!pinOn()){S.visit=false;LSx.set('xp.visit',null);meApply(pid);S.dlg=null;render();return;}
  if(S.id.state==='ok'&&!S.visit&&realGest()){idSwitchAs(pid);return;}
  S.pinF=pinStart(pid);render();}
async function pinKey(k){const f=S.pinF;if(!f||f.busy)return;
  const cur=f.mode==='create'&&f.a.length===4?'b':'a';
  if(k==='del'){f[cur]=f[cur].slice(0,-1);if(cur==='b'&&!f.b&&false)f.a=f.a.slice(0,-1);render();return;}
  if(!/^[0-9]$/.test(k)||f[cur].length>=4)return;f[cur]+=k;f.err='';render();
  if(f.mode==='enter'&&f.a.length===4){f.busy=true;render();let r=null;try{r=await DB.rpc('xp_pin_check',{p_player:f.pid,p_pin:f.a});}catch(e){r={ok:false,err:'net'};}f.busy=false;
    if(r&&r.ok){idDone(f.pid,r.token);return;}
    f.a='';if(r&&r.err==='nopin'){f.mode='create';f.err='Aucun PIN pour cette identité : crée-le.';}
    else if(r&&r.err==='locked'){const t=r.until?new Date(r.until):null;f.err='Trop d\'essais : réessaie'+(t?' après '+t.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):' dans 15 minutes')+'.';}
    else if(r&&r.err==='bad'){f.err='Code incorrect · '+r.left+' essai'+(r.left>1?'s':'')+' restant'+(r.left>1?'s':'');}
    else f.err='Connexion impossible, réessaie.';render();return;}
  if(f.mode==='create'&&f.b.length===4){if(f.a!==f.b){f.a='';f.b='';f.err='Les deux codes ne correspondent pas. Recommence.';render();return;}
    f.busy=true;render();let r=null;try{r=await DB.rpc('xp_pin_create',{p_player:f.pid,p_pin:f.a});}catch(e){r={ok:false,err:'net'};}f.busy=false;
    if(r&&r.ok){idDone(f.pid,r.token);return;}
    f.a='';f.b='';if(r&&r.err==='exists'){f.mode='enter';f.err='Un PIN existe déjà pour cette identité : saisis-le.';}else f.err='Connexion impossible, réessaie.';render();}}
/* Affichage */
function pinPanel(){const f=S.pinF,p=S.players[f.pid];if(!p)return '';const cre=f.mode==='create',phase=cre&&f.a.length===4?'b':'a';
  const dots=v=>`<div class="pinb">${[0,1,2,3].map(i=>`<span class="${i<v.length?'f':''}">${i<v.length?'•':''}</span>`).join('')}</div>`;
  return `<div class="pinp"><h2 style="margin:0">${cre?'Crée ton code PIN':'Code PIN de '+esc(p.nom)}</h2><div class="muted small">${cre?esc(p.nom)+' · 4 chiffres, à saisir deux fois. Il te sera demandé sur un nouvel appareil et pour reprendre ton identité.':'Saisis le code de cette identité.'}</div>
    ${cre?`<div class="lab2">Code PIN</div>${dots(f.a)}<div class="lab2">Confirmation</div>${dots(phase==='b'?f.b:'')}`:dots(f.a)}
    ${f.err?`<div class="pinerr" role="alert">${esc(f.err)}</div>`:''}${f.busy?'<div class="muted small" style="text-align:center">Vérification…</div>':''}
    <div class="kp">${['1','2','3','4','5','6','7','8','9','','0','del'].map(k=>k?`<button data-act="pinKey" data-k="${k}" aria-label="${k==='del'?'Effacer':k}">${k==='del'?'⌫':k}</button>`:'<span></span>').join('')}</div>
    ${cre?'':'<div class="muted small" style="margin-top:10px;text-align:center">PIN oublié ? Demande à une personne qui a les droits de gestion de le réinitialiser.</div>'}
    <div class="actions" style="margin-top:10px"><button class="btn ghost" data-act="pinBack">‹ Autre identité</button></div></div>`;}
function idList(intro){const pl=planPlayers(),G=S.id.state==='ok'&&!S.visit&&realGest();
  const st=p=>!pinOn()?'':G?'sans PIN':S.id.pins&&S.id.pins.has(p.id)?'🔒 PIN':'nouveau : créer un PIN';
  return `${intro}<div class="idl">${pl.map(p=>{const mine=Object.values(S.chars).filter(c=>(p.persos||[]).includes(c.id)&&c.type==='PJ').map(c=>c.court).join(', ');
    return `<button data-act="idPick" data-id="${esc(p.id)}" aria-pressed="${p.id===ME&&!S.visit}"><span><b>${esc(p.nom)}</b>${p.role==='MJ'||mine?`<small>${esc(p.role==='MJ'?'MJ':mine)}</small>`:''}</span><span class="lk">${st(p)}</span></button>`;}).join('')}
    <button class="vis2" data-act="idVisit" aria-pressed="${!!S.visit}"><span><b>Visiteur</b><small>Consulter l'appli sans être joueur, en lecture seule</small></span><span class="lk">sans PIN</span></button></div>`;}
function idGate(){const pl=planPlayers();if(!S.ready||!pl.length)return '';
  if(!pinOn()){if(S.visit||(ME&&S.players[ME]))return '';}
  else if(S.id.state==='init')return Object.keys(S.players).length?`<div class="who"><div class="who-in"><p class="muted">Vérification de l'identité…</p></div></div>`:'';
  else if(S.id.state!=='need')return '';
  return `<div class="who" role="dialog" aria-modal="true" aria-label="Qui es-tu ?"><div class="who-in">${S.pinF?pinPanel():idList(`<div class="who-g">${ICON.gear||''}</div><h2>Bienvenue dans La belle appli</h2><p>Qui es-tu ?</p>`)}</div></div>`;}
function idSheet(){const G=S.id.state==='ok'&&!S.visit&&realGest();
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Changer d'identité"><div class="in">${S.pinF?pinPanel():idList(`<h2>Changer d'identité</h2><div class="muted small">${!pinOn()?'Mémorisé sur cet appareil.':G?'Droits de gestion : pas de PIN demandé.':'Le PIN de l\'identité choisie est demandé.'}</div>`)}<div class="actions"><button class="btn" data-act="closeSheet">Fermer</button></div></div></div>`;}
function idBanners(){let h='';
  if(S.visit)h+=`<div class="idban v"><span>👁 Tu consultes l'appli en <b>visiteur</b> (lecture seule)</span><button class="btn ghost" data-act="meOpen">Changer</button></div>`;
  if(BY&&S.players[BY]&&S.players[ME])h+=`<div class="idban g"><span>${esc(S.players[BY].nom)}, tu es connecté <b>en tant que ${esc(S.players[ME].nom)}</b></span><button class="btn ghost" data-act="idBack">Revenir</button></div>`;
  return h;}
/* Joueurs : état des PIN et réinitialisation (gestion) */
function pinCard(){if(!isGest())return '';
  if(!pinOn())return `<div class="card" style="margin-top:12px"><h3>Codes PIN</h3><div class="muted small">Les codes PIN ne sont pas encore actifs : le script <b>3_pin.sql</b> n'est pas installé dans Supabase. En attendant, l'identité se choisit librement.</div></div>`;
  return `<div class="card" style="margin-top:12px"><h3>Codes PIN</h3>${planPlayers().map(p=>{const has=S.id.pins&&S.id.pins.has(p.id),arm=S.confirm==='pin:'+p.id;
    return `<div class="gestrow"><div><b>${esc(p.nom)}</b></div><div style="display:flex;gap:8px;align-items:center"><span class="pst2 ${has?'ok':'no'}">${has?'PIN défini':'pas encore de PIN'}</span>${has?(arm?`<button class="btn" style="color:var(--bad)" data-act="pinResetOk" data-pid="${esc(p.id)}">Confirmer</button>`:`<button class="btn ghost" data-act="pinReset" data-pid="${esc(p.id)}">Réinitialiser</button>`):''}</div></div>`;}).join('')}
    <div class="muted small" style="margin-top:8px">Réinitialiser efface le PIN : le joueur en créera un nouveau à sa prochaine connexion.</div></div>`;}
async function pinReset(pid){const by=realId();let r=null;try{r=await DB.rpc('xp_pin_reset',{p_by:by,p_token:toks()[by]||'',p_player:pid});}catch(e){r=null;}
  S.confirm=null;if(r&&r.ok&&S.id.pins)S.id.pins.delete(pid);else alert('Réinitialisation refusée : reconnecte-toi avec ton PIN puis réessaie.');render();}
/* Visiteur : seules la navigation et la consultation sont permises */
const VISIT_OK=new Set(['jrSel','jrOpen','jrBack','jrGo','pwToggle','rfTab','rfFold','shFold','jOpen','jBack','pfOpen','pfTab','pfRub','ppElOpen','ppElBack','shTab','onlyBuy','goalToggle','derTip','forme','tab','menu','meOpen','closeSheet','sel','uni','secOpen','secBack','secFilter','rfOpen','rfBack','rfHum','ptab','forme','histToggle','sessToggle','planMonth','planView','open','openAutre','idPick','idVisit','idBack','pinKey','pinBack','step','quick']);
/* Met à jour la liste des identités qui ont un PIN (créé depuis un autre appareil) */
async function pinRefresh(){if(!pinOn()||!DB)return;try{const r=await DB.rpc('xp_pin_status',{});S.id.pins=new Set((r||[]).map(x=>typeof x==='string'?x:(x.xp_pin_status||x.player||Object.values(x)[0])));render();}catch(e){}}
