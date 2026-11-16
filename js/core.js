/* La belle appli — état de l'application et outils communs */
/* ---------- Application ---------- */
const ORDER=['kerian','massetoc','rowen','sloan','theodule','maral','ismael','anselme'];
if(location.hash==='#dates'){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}window.__openDates=true;}
let ME=null;try{ME=localStorage.getItem('xp.me')||null;}catch(e){}
const S={chars:{},players:{},events:[],ready:false,view:window.__openDates?'planning':'home',sel:null,sheet:null,asheet:null,dlg:null,nameForm:{kind:null,nom:''},confirm:null,heritage:{score:'',delta:0},
  futForm:{open:false,nom:'',max:'6'},pnjForm:{titre:'',montant:''},newP:{nom:'',role:'Joueur'},newC:{court:'',nom:'',type:'PJ',owner:''},
  secrets:[],secretsReady:false,dates:[],datesReady:false,plan:{view:window.__openDates?'com':'mes',y:new Date().getFullYear(),m:new Date().getMonth(),open:null},curSess:null,creatures:[],creaturesReady:false,uni:'secrets',sec:null,secFilter:'all',
  form:{titre:'',type:'Scénario',date:'',lines:[{nature:'Scénario',montant:'',persos:null}]},hist:{},dirty:false,sync:'loading'};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const fmtDate=d=>{if(!d)return '';const [y,m,j]=d.split('-');return `${j}/${m}/${y.slice(2)}`;};
const actif=c=>(c.statut||'actif')==='actif';
const owners=c=>Object.values(S.players).filter(p=>(p.persos||[]).includes(c.id));
/* Droits de gestion (indépendants du rôle MJ) ; « voir comme un joueur » les suspend */
const hasGest=p=>!!(p&&p.gestion&&!p.parti);
const isGest=()=>!S.asPlayer&&!!ME&&hasGest(S.players[ME]);
const gestCount=()=>Object.values(S.players).filter(hasGest).length;
/* Mise en place ponctuelle : si personne n'a encore de droits de gestion, les donner au(x) MJ et à Gurvan */
function fixGestion(){const P=Object.values(S.players);if(!P.length||P.some(p=>'gestion' in p))return;
  for(const p0 of P){const p=clone(p0);p.gestion=p.role==='MJ'||p.id==='lorenzo';S.players[p.id]=p;persist('players/'+p.id,p);}render();}
const meOwns=c=>!!ME&&!!S.players[ME]&&(S.players[ME].persos||[]).includes(c.id);
const vis=c=>!c.cache||meOwns(c)||owners(c).length===0;
const ids=()=>Object.keys(S.chars).filter(i=>vis(S.chars[i])).sort((a,b)=>{const i=ORDER.indexOf(a),j=ORDER.indexOf(b);return (i<0?99:i)-(j<0?99:j)||(S.chars[a].court||'').localeCompare(S.chars[b].court||'');});
const pjIds=()=>ids().filter(i=>S.chars[i].type==='PJ');
const playersSorted=()=>Object.values(S.players).sort((a,b)=>(a.nom||'').localeCompare(b.nom||''));
const slug=s=>(String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'')||'x')+'-'+Math.random().toString(36).slice(2,6);
let DB=null;
const queue={};
function chain(path,fn){queue[path]=(queue[path]||Promise.resolve()).then(fn).then(()=>setSync('ok')).catch(e=>{console.error(e);setSync('err','Enregistrement refusé');});}
function persist(path,data){if(DB)chain(path,()=>DB.doc(path).set(data));}
function persistDel(path){if(DB)chain(path,()=>DB.doc(path).delete());}
function setSync(st,msg){S.sync=st;const el=document.getElementById('sync');if(!el)return;el.className='sync '+(st==='ok'?'ok':st==='err'?'err':'');
  el.querySelector('span').textContent=msg||(st==='ok'?'Synchronisé':st==='loading'?'Connexion…':st==='local'?'Hors ligne':'Erreur');}
function saveChar(c){S.chars[c.id]=c;render();persist('chars/'+c.id,c);}
function savePlayer(p){S.players[p.id]=p;render();persist('players/'+p.id,p);}
function saveEvents(ev){S.events=ev;render();persist('gains/all',{events:ev});}
function removeChar(id){
  delete S.chars[id];persistDel('chars/'+id);
  for(const p of Object.values(S.players))if((p.persos||[]).includes(id)){const q=clone(p);q.persos=q.persos.filter(x=>x!==id);S.players[q.id]=q;persist('players/'+q.id,q);}
  const ev=S.events.map(e=>({...e,entries:e.entries.filter(en=>en.perso!==id)})).filter(e=>e.entries.length);
  saveEvents(ev);
}
function removePlayer(id){delete S.players[id];if(ME===id){ME=null;try{localStorage.removeItem('xp.me');}catch(e){}}persistDel('players/'+id);render();}

/* --- composants --- */
function barAcc(cur,max,plan){const t=max+1,p=Math.min(100,Math.round(100*cur/t)),q=Math.min(100-p,Math.round(100/t));return `<span class="bar acb${plan?' plan':''}"><i style="width:${p}%"></i><i class="accb" style="width:${q}%"></i></span>`;}
const accW=n=>(n==='Esprit'||n==='Sang Froid')?'accru':'accrue'; /* accord avec la caractéristique */
const isAcc=(c,key)=>!!c.accru&&key==='carac:'+c.accru;
function bar(cur,max,plan){const p=max?Math.min(100,Math.round(100*cur/max)):0;return `<span class="bar${plan?' plan':''}"><i style="width:${p}%"></i></span>`;}
function itemRow(c,key,dispo){
  const r=ref(c,key);if(!r)return '';const cur=r.o.cur||0,max=r.max,to=(c.plan||{})[key];
  const planned=!!to&&to>cur,atMax=max!=null&&cur>=max;
  const k=atMax?0:lvlCost(r.kind,cur+1),can=!atMax&&k<=dispo;
  const acc=isAcc(c,key);
  const lvTxt=max!=null?`${cur+(acc?1:0)}<small>/${max+(acc?1:0)}</small>`:`${cur}`;
  const tail=atMax?`<span class="pill plan" style="grid-column:2/4;justify-self:end">★ max</span>`:
    `<button class="heart${planned?' on':''}" data-act="heart" data-key="${esc(key)}" aria-pressed="${planned}" aria-label="Prévoir un niveau de ${esc(r.nom)}">${planned?'♥':'♡'}</button><button class="plus${can?' ok':''}" data-act="quick" data-key="${esc(key)}"${can?'':' disabled'} aria-label="Acheter un niveau de ${esc(r.nom)} pour ${k} XP">+<small>${k}</small></button>`;
  let sub='';
  if(r.kind==='fortune'&&FORTUNE[cur])sub=`<span class="nsub">${esc(FORTUNE[cur][0])}</span>`;
  if(r.kind==='spec'){const ta=specToAttach(c);if(ta)sub=`<span class="nsub bad">${ta} à rattacher</span>`;}
  const spk=r.kind==='comp'||r.kind==='fut'||r.kind==='prof',sps=spk?specsOf(c).filter(x=>x.cible===key):[];
  const so=!!(S.specOpen&&S.specOpen[c.id+'|'+key]);

  let after=spk&&so?specList(c,key,dispo):'';
  if(r.kind==='atout'&&c.type==='PJ'){const ao=!!(S.specOpen&&S.specOpen[c.id+'|atout']);if(ao)after=atoutList(c,dispo);}
  return `<div class="irow${atMax?' max':can?' can':''}"><button class="rmain" data-act="${spk||(r.kind==='atout'&&c.type==='PJ')?'specToggle':'open'}" data-key="${esc(key)}"${spk||(r.kind==='atout'&&c.type==='PJ')?` aria-expanded="${spk?so:!!(S.specOpen&&S.specOpen[c.id+'|atout'])}"`:''}><span class="nm">${esc(r.nom)}${sub}${acc?`<span class="accst" title="${esc(r.nom)} ${accW(r.nom)} : +1 hors maximum" aria-label="accru">★</span>`:''}</span>${max!=null?(acc?barAcc(cur,max,planned):bar(cur,max,planned)):'<span></span>'}<span class="lv">${lvTxt}</span></button>${tail}</div>${after}`;
}
/* Liste dépliée sous une compétence : spécialités du livre (acquise / achat), acquises hors liste, à rattacher, et ligne libre */
function specList(c,key,dispo){const all=specsOf(c),own=all.filter(x=>x.cible===key),ownN=new Set(own.map(x=>nrmS(x.nom))),anon=specAnon(c);
  const acq=x=>{const i=specInfo(x.nom);return `<div class="ln acqd"><span>${esc(x.nom)}${i&&i[2]?'*':''}${i?`<small>${esc(i[1])}</small>`:''}</span><button class="acq" data-act="spCancel" data-i="${all.indexOf(x)}" aria-label="${esc(x.nom)} acquise : annuler">★ Acquise</button></div>`;};
  const btn=(nom,attrs)=>{if(anon>0)return `<button class="bb" ${attrs}>Rattacher</button>`;const k=specCost(key,nom);return `<button class="bb" ${attrs}${k>dispo?' disabled':''} aria-label="Acheter ${esc(nom)} pour ${k} XP">+ ${k}</button>`;};
  let h='';
  for(const x of all.filter(y=>!y.cible))h+=`<div class="ln att"><span>${esc(x.nom)}<small>possédée, à rattacher</small></span><button class="bb" data-act="spAttach" data-i="${all.indexOf(x)}" data-key="${esc(key)}">Rattacher</button></div>`;
  for(const e of specCatalog(key,c)){if(e[0]==='Langue : ')continue;const o=own.find(x=>nrmS(x.nom)===nrmS(e[0]));
    if(o){h+=acq(o);continue;}const k=specCost(key,e[0]),ok=anon>0||k<=dispo;
    h+=`<div class="ln${ok?' dispo':''}"><span>${esc(e[0])}${e[2]?'*':''}<small>${esc(e[1])}</small></span>${btn(e[0],`data-act="spBuy" data-key="${esc(key)}" data-nom="${esc(e[0])}"`)}</div>`;}
  const cat=new Set(specCatalog(key,c).map(e=>nrmS(e[0])));for(const o of own)if(!cat.has(nrmS(o.nom)))h+=acq(o);
  const ph=key==='comp:Culture'?'Autre spécialité ou langue…':'Autre spécialité…';
  h+=`<div class="ln"><input type="text" data-spo="${esc(key)}" placeholder="${ph}" aria-label="${ph}" value="${esc((S.spOther||{})[c.id+'|'+key]||'')}" autocomplete="off">${btn('',`data-act="spBuyO" data-key="${esc(key)}"`)}</div>`;
  return `<div class="spx">${h}${lvlLine(c,key)}</div>`;}
function lvlLine(c,key){const r=ref(c,key);if(!r)return '';const cur=r.o.cur||0,lb=lastBuy(c,key);
  return `<div class="fixl"><span>Niveau ${cur}${r.max!=null?' / '+r.max:''}</span><span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${lb?`<button class="btn ghost" data-act="undoK" data-key="${esc(key)}">Annuler le dernier achat</button>`:''}<button class="btn ghost" data-act="fixOpen" data-key="${esc(key)}">Corriger le niveau</button></span></div>`;}
/* Liste dépliée des atouts féeriques : atouts de la race + Spécialités typiques (acquis / achat), acquis hors liste, ligne libre */
function atoutList(c,dispo){const all=atoutsOf(c),anon=atoutAnon(c),r=RACES[c.race],typ=r&&r.t&&r.t.length?'offre '+r.t.map(x=>x[0]).join(', '):'offre 2 spécialités gratuites à choisir';
  const lst=(r?r.a:[]).concat([[TYP,typ]]),cost=RULES.atout;
  const acq=(x,d)=>`<div class="ln acqd"><span>${esc(x.nom)}${d?`<small style="display:block;margin-left:0">${esc(d)}</small>`:''}</span><button class="acq" data-act="atCancel" data-i="${all.indexOf(x)}" aria-label="${esc(x.nom)} acquis : annuler">★ Acquis</button></div>`;
  const btn=(attrs,nom)=>anon>0?`<button class="bb" ${attrs}>Rattacher</button>`:`<button class="bb" ${attrs}${cost>dispo?' disabled':''} aria-label="Acheter ${esc(nom||'un atout')} pour ${cost} XP">+ ${cost}</button>`;
  let h='';const used=new Set();
  for(const [nom,desc] of lst){const o=all.find(x=>nrmA(x.nom)===nrmA(nom)||(nom===TYP&&isTyp(x.nom)));if(o){used.add(o);h+=acq(o,desc);continue;}
    h+=`<div class="ln${anon>0||cost<=dispo?' dispo':''}"><span>${esc(nom)}${desc?`<small style="display:block;margin-left:0">${esc(desc)}</small>`:''}</span>${btn(`data-act="atBuy" data-nom="${esc(nom)}"`,nom)}</div>`;}
  for(const o of all)if(!used.has(o))h+=acq(o,'hors liste de la race');
  h+=`<div class="ln"><input type="text" data-ato="1" placeholder="Autre atout…" aria-label="Autre atout" value="${esc((S.spOther||{})[c.id+'|atout']||'')}" autocomplete="off">${btn('data-act="atBuyO"')}</div>`;
  if(!c.race)h+=`<div class="muted small" style="padding:4px 10px">Race à préciser dans Joueurs pour proposer ses atouts.</div>`;
  return `<div class="spx">${h}${lvlLine(c,'atout')}</div>`;}
function specBlock(c){const ta=specToAttach(c),named=specsOf(c).filter(x=>!x.cible);
  return `<div class="muted small" style="padding:4px 0 8px">Les spécialités s'affichent sous leur ${c.type==='PNJ'?'profil':'compétence'}. ${ta?`<b style="color:var(--bad)">${ta} à rattacher</b>${named.length?` (dont ${named.map(x=>esc(x.nom)).join(', ')})`:''} : ouvre une ${c.type==='PNJ'?'ligne de profil':'compétence'} pour la rattacher sans XP.`:''}</div>`;}
function namesBlock(c,kind){
  const lab=kind==='atout'?'Atouts féeriques':'Spécialités',un=kind==='atout'?'atout':'spécialité';
  const list=nameList(c,kind),o=c[kind]||{cur:0},cur=o.cur||0,manual=(c.noms&&c.noms[kind])||[],miss=Math.max(0,cur-list.length);
  const full=kind==='atout'&&o.max!=null&&cur>=o.max,open=S.nameForm.kind===kind;
  let h=`<div class="names"><span class="lab">${lab}</span><div class="lst">${list.length?list.map(x=>esc(x)).join('<span class="sep">-</span>'):'<span class="muted">Aucun nom renseigné</span>'}</div>`;
  if(miss)h+=`<div class="miss">${miss} ${un}${miss>1?'s':''} sans nom</div>`;
  if(open){
    h+=`<div style="margin-top:6px">${manual.map((x,i)=>`<span class="nchip">${esc(x)}<button data-act="nameDel" data-kind="${kind}" data-i="${i}" aria-label="Retirer ${esc(x)}">✕</button></span>`).join('')}</div>
    <div class="frow" style="margin-top:8px"><div class="field"><label for="nm-${kind}">Nom de ${kind==='atout'?"l'atout":'la spécialité'}</label><input id="nm-${kind}" type="text" data-nm="${kind}" value="${esc(S.nameForm.nom)}"></div></div>
    <div class="actions"><button class="btn pri" data-act="nameAdd" data-full="${full?1:0}"${S.nameForm.nom.trim()&&!full?'':' disabled'}>Ajouter</button><button class="btn ghost" data-act="nameClose">Fermer</button></div>
    <div class="muted small" style="margin-top:6px">${full?'Maximum atteint : impossible d\'ajouter.':'Ne dépense aucun XP, mais ajoute 1 au total.'}</div>`;
  }else h+=`<div class="nact"><button class="mini" data-act="nameOpen" data-kind="${kind}">+ Ajouter un nom</button></div>`;
  return h+`</div>`;
}
function staticRow(nom,val,note){return `<div class="irow"><div class="rmain" style="cursor:default"><span class="nm">${esc(nom)}</span><span></span><span class="lv">${val}</span></div><span class="muted small" style="grid-column:2/4;justify-self:end">${esc(note||'')}</span></div>`;}
function whoLine(c){if(c.type==='PNJ'){const pj=c.pj&&S.chars[c.pj];return pj?'PNJ · rattaché à '+esc(pj.court):'PNJ';}const o=owners(c);return o.length?'joué par '+esc(o.map(p=>p.nom).join(', ')):'Personnage joueur';}
const STATUTS={actif:'Actif',mort:'Décédé',retire:'Retiré'};

