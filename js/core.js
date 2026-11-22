/* La belle appli — état de l'application et outils communs */
/* ---------- Application ---------- */
const ORDER=['kerian','massetoc','rowen','sloan','theodule','maral','ismael','anselme'];
if(location.hash==='#dates'){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}window.__openDates=true;}
{const m=location.hash.match(/^#secret-(\d+)$/);if(m){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}window.__openSec=+m[1];}}
let ME=null;try{ME=localStorage.getItem('xp.me')||null;}catch(e){}
const S={chars:{},players:{},events:[],ready:false,view:window.__openDates?'planning':'home',sel:null,sheet:null,asheet:null,dlg:null,nameForm:{kind:null,nom:''},confirm:null,heritage:{score:'',delta:0},
  futForm:{open:false,nom:'',max:'6'},pnjForm:{titre:'',montant:''},newP:{nom:'',role:'Joueur'},newC:{court:'',nom:'',type:'PJ',owner:''},
  secrets:[],secretsReady:false,dates:[],datesReady:false,plan:{view:window.__openDates?'com':'mes',y:new Date().getFullYear(),m:new Date().getMonth(),open:null},curSess:null,creatures:[],creaturesReady:false,uni:'secrets',sec:null,secFilter:'all',
  form:{titre:'',type:'Scénario',date:'',lines:[{nature:'Scénario',montant:'',persos:null}]},hist:{},dirty:false,sync:'loading'};
/* Lot 2 : au rechargement, l'appli rouvre la même page et le même onglet (mémoire de l'onglet du navigateur) */
const KANKA_URL='https://app.kanka.io/w/350361';
const kankaHref=(lien,nom)=>(lien&&/^https?:\/\//.test(lien))?lien:KANKA_URL+'/search?q='+encodeURIComponent(nom||'');
const NAV_KEYS=['view','sel','shTab','uni','sec','ptab','forme'];
function navSave(){try{const o={};for(const k of NAV_KEYS)o[k]=S[k];o.pv=S.plan&&S.plan.view;sessionStorage.setItem('xp.nav',JSON.stringify(o));}catch(e){}}
if(window.__openSec){S.view='univers';S.uni='secrets';S.sec=window.__openSec;}
(function navLoad(){if(window.__openDates||window.__openSec)return;try{const o=JSON.parse(sessionStorage.getItem('xp.nav')||'null');if(!o)return;for(const k of NAV_KEYS)if(o[k]!==undefined&&o[k]!==null)S[k]=o[k];if(o.pv)S.plan.view=o.pv;}catch(e){}})();
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const fmtDate=d=>{if(!d)return '';const [y,m,j]=d.split('-');return `${j}/${m}/${y.slice(2)}`;};
const actif=c=>(c.statut||'actif')==='actif';
const owners=c=>Object.values(S.players).filter(p=>(p.persos||[]).includes(c.id));
/* Droits de gestion (indépendants du rôle MJ) ; « voir comme un joueur » les suspend */
/* Lot 2 : le MJ a les droits de gestion d'office ; il y a toujours au moins un MJ */
const hasGest=p=>!!(p&&(p.gestion||p.role==='MJ')&&!p.parti);
const mjCount=()=>Object.values(S.players).filter(p=>p.role==='MJ'&&!p.parti).length;
const lastMJ=p=>!!p&&p.role==='MJ'&&!p.parti&&mjCount()<=1;
const isGest=()=>!S.asPlayer&&!!ME&&hasGest(S.players[ME]);
const gestCount=()=>Object.values(S.players).filter(hasGest).length;
const meOwns=c=>!!ME&&!!S.players[ME]&&(S.players[ME].persos||[]).includes(c.id);
const vis=c=>!c.cache||meOwns(c)||owners(c).length===0||isGest();
const ids=()=>Object.keys(S.chars).filter(i=>vis(S.chars[i])).sort((a,b)=>{const i=ORDER.indexOf(a),j=ORDER.indexOf(b);return (i<0?99:i)-(j<0?99:j)||(S.chars[a].court||'').localeCompare(S.chars[b].court||'');});
const pjIds=()=>ids().filter(i=>S.chars[i].type==='PJ');
const playersSorted=()=>Object.values(S.players).sort((a,b)=>(a.nom||'').localeCompare(b.nom||''));
const slug=s=>(String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'')||'x')+'-'+Math.random().toString(36).slice(2,6);
let DB=null;
const queue={};
function chain(path,fn){queue[path]=(queue[path]||Promise.resolve()).then(fn).then(()=>setSync('ok')).catch(e=>{console.error(e);setSync('err','Enregistrement refusé');});}
function persist(path,data){if(S.visit)return;if(writesLocked()){if(!S.lockMsg){S.lockMsg=true;setTimeout(()=>alert("Mise à jour des données en attente : cette modification n'est pas enregistrée. L'appli reste en lecture seule jusqu'à la mise à jour."),0);}return;}if(DB)chain(path,()=>DB.doc(path).set(data));}
function persistDel(path){if(S.visit||writesLocked())return;if(DB)chain(path,()=>DB.doc(path).delete());}
function setSync(st,msg){S.sync=st;const el=document.getElementById('sync');if(!el)return;el.className='sync '+(st==='ok'?'ok':st==='err'?'err':'');
  el.querySelector('span').textContent=msg||(st==='ok'?'Synchronisé':st==='loading'?'Connexion…':st==='local'?'Hors ligne':'Erreur');}
function saveChar(c){c=fxSync(c);S.chars[c.id]=c;render();persist('chars/'+c.id,c);}
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
  const acc=isAcc(c,key); /* onglet Progression : l'accrue s'affiche toujours (la forme ne joue que dans « Fiche complète ») */
  const lvTxt=max!=null?`${cur+(acc?1:0)}<small>/${max+(acc?1:0)}</small>`:`${cur}`;
  const tail=atMax?`<span class="pill plan" style="grid-column:2/4;justify-self:end">★ max</span>`:
    `<button class="heart${planned?' on':''}" data-act="heart" data-key="${esc(key)}" aria-pressed="${planned}" aria-label="Prévoir un niveau de ${esc(r.nom)}">${planned?'♥':'♡'}</button><button class="plus${can?' ok':''}" data-act="quick" data-key="${esc(key)}"${can?'':' disabled'} aria-label="Acheter un niveau de ${esc(r.nom)} pour ${k} XP">+<small>${k}</small></button>`;
  let sub='';
  if(r.kind==='fortune'&&FORTUNE[cur])sub=`<span class="nsub">${esc(FORTUNE[cur][0])}</span>`;
  if(r.kind==='spec'){const ta=specToAttach(c);if(ta)sub=`<span class="nsub bad">${ta} à rattacher</span>`;}
  const pwk=r.kind==='feerie'&&c.type==='PJ'&&!isHum(c)&&!!c.race;
  if(pwk){const tc=canEditC(c)?pwToChoose(c):0;if(tc)sub=`<span class="nsub bad">${tc} pouvoir${tc>1?'s':''} à choisir</span>`;}
  const spk=r.kind==='comp'||r.kind==='fut'||r.kind==='prof',sps=spk?specsOf(c).filter(x=>x.cible===key):[];
  const so=!!(S.specOpen&&S.specOpen[c.id+'|'+key]);

  let after=spk&&so?specList(c,key,dispo):'';
  if(r.kind==='atout'&&c.type==='PJ'){const ao=!!(S.specOpen&&S.specOpen[c.id+'|atout']);if(ao)after=atoutList(c,dispo);}
  return `<div class="irow${atMax?' max':can?' can':''}"><button class="rmain" data-act="${pwk?'pwToggle':spk||(r.kind==='atout'&&c.type==='PJ')?'specToggle':'open'}" data-key="${esc(key)}"${pwk?` data-id="${esc(c.id)}" aria-expanded="${!!(S.pwOpen&&S.pwOpen[c.id])}"`:spk||(r.kind==='atout'&&c.type==='PJ')?` aria-expanded="${spk?so:!!(S.specOpen&&S.specOpen[c.id+'|atout'])}"`:''}><span class="nm">${esc(r.nom)}${sub}${acc?`<span class="accst" title="${esc(r.nom)} ${accW(r.nom)} : +1 hors maximum" aria-label="accru">★</span>`:''}</span>${max!=null?(acc?barAcc(cur,max,planned):bar(cur,max,planned)):'<span></span>'}<span class="lv">${lvTxt}</span></button>${tail}</div>${after}`;
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


/* PNJ rattachés à un PJ (pour les transferts d'XP) */
const pnjOf=c=>Object.values(S.chars).filter(x=>x.type==='PNJ'&&x.pj===c.id&&(!x.statut||x.statut==='actif')).sort((a,b)=>(a.court||'').localeCompare(b.court||''));

/* ---------- Lot 4 bis : liens entre fiches, pile du retour, mode édition ----------
   Cible d'un lien : {t:'perso'|'race'|'pw'|'cap'|'joueur'|'secret', id, n, k, i}.
   Un lien n'existe que si la personne voit la cible ; sinon le nom reste en texte simple. */
S.nav=[];S.edit=false;S.rfEd=false;S.edDirty=false;
/* Mode édition : droits de gestion + mode actif (bouton crayon) ; désactivé à chaque ouverture */
const canEdit=()=>isGest()&&!!S.edit&&!S.visit;
const crById=id=>(S.creatures||[]).find(c=>c.id===id);
const crBySing=sing=>!!sing&&(S.creatures||[]).find(x=>raceRec(x).sing===sing);
/* Un pouvoir ou une capacité est connu de la personne s'il apparaît, visible, sur une race ou un personnage qu'elle voit */
function elSeen(t,id){if(isGest())return true;
  if(t==='pw'){if(Object.values(S.chars).some(c=>vis(c)&&(c.pw||[]).some(o=>o.id===id)))return true;
    return raceCres().some(cr=>{const x=raceRec(cr);return raceVisible(cr,x)&&pwSlots(x).some((v,i)=>v===id&&pwVisible(cr,x,i)&&!pwUnk(x,i));});}
  return elUses('cap',id).some(u=>{const x=raceRec(u.cr);return raceVisible(u.cr,x)&&blockVisible(u.cr,x,'cap');});}
function lnkOk(o){if(!o)return false;
  if(o.t==='perso'){const c=S.chars[o.id];return !!c&&vis(c);}
  if(o.t==='race'){const cr=crById(o.id);return !!cr&&raceVisible(cr,raceRec(cr));}
  if(o.t==='joueur')return !!S.players[o.id];
  if(o.t==='pw')return !!(S.pouvoirs&&S.pouvoirs[o.id])&&elSeen('pw',o.id);
  if(o.t==='cap')return !!(S.capacites&&S.capacites[o.id])&&elSeen('cap',o.id);
  if(o.t==='secret'){const s=secById(+o.n);if(!s)return false;if(o.k==='titre')return titreVis(s)||(isGest()&&!!s.titre);
    if(o.k&&o.k!=='bonus'){const x=((s.slots||{})[o.k]||[])[+o.i];return !!x&&(isGest()||!x.hid);}return true;}
  return false;}
const lnkAttrs=o=>`data-act="lnk" data-t="${o.t}"${o.id!=null?` data-id="${esc(o.id)}"`:''}${o.n!=null?` data-n="${o.n}"`:''}${o.k?` data-k="${esc(o.k)}"`:''}${o.i!=null?` data-i="${o.i}"`:''}`;
/* Nom en lien (vert, souligné de pointillés, chevron) ou en texte simple si la cible n'est pas visible */
const lk=(o,label)=>lnkOk(o)?`<button type="button" class="lk" ${lnkAttrs(o)}>${esc(label)}</button>`:`<span class="nolk">${esc(label)}</span>`;
const lkRace=(c,label)=>{const cr=crBySing(c&&c.race);return cr?lk({t:'race',id:cr.id},label):esc(label);};
const lkCap=(nom,label)=>{const id=capIdByName(S.capacites||{},nom);return id?lk({t:'cap',id},label||nom):esc(label||nom);};
/* Libellé de l'écran courant, pour le chemin de la barre « ‹ Retour » */
function navLabel(){const g=S.dlg;
  if(g&&g.kind==='cons'){const e=((g.t==='pw'?S.pouvoirs:S.capacites)||{})[g.id];return e?e.nom:'';}
  if(g&&g.kind==='pl'){const p=S.players[g.id];return p?p.nom:'Joueur';}
  if(S.view==='sheet'){const c=S.chars[S.sel];return c?c.court:'Personnage';}
  if(S.view==='univers'&&S.uni==='creatures'&&S.rf){if(S.rf.hum)return HUMAIN;const cr=crById(S.rf.id);return cr?raceNm(raceRec(cr)):'Races';}
  if(S.view==='univers'&&S.uni==='creatures')return 'Races';
  if(S.view==='univers'&&S.sec)return 'Secret '+(ROMAN[S.sec-1]||S.sec);
  if(S.view==='univers')return 'Secrets';
  return ({home:'Accueil',gains:'XP',team:'Personnages',planning:'Planning',players:'Joueurs',rules:'Règles',params:'Paramètres'})[S.view]||'';}
function navSnap(){const g=S.dlg&&(S.dlg.kind==='cons'||S.dlg.kind==='pl')?{kind:S.dlg.kind,t:S.dlg.t,id:S.dlg.id,nav:S.dlg.nav}:null;
  return {view:S.view,sel:S.sel,shTab:S.shTab,uni:S.uni,sec:S.sec,rf:S.rf,rfTab:S.rfTab,rfEd:S.rfEd,dlg:g,y:window.scrollY||0,lab:navLabel()};}
/* Suivre un lien : mémorise l'écran de départ puis ouvre la cible */
function navGo(o){if(!lnkOk(o))return false;
  S.nav.push(navSnap());try{history.pushState({xpnav:S.nav.length},'');}catch(e){}
  S.sheet=null;S.asheet=null;S.confirm=null;S.secHl=null;
  if(o.t==='perso'){S.dlg=null;S.view='sheet';S.sel=o.id;S.futForm.open=false;}
  else if(o.t==='race'){S.dlg=null;S.view='univers';S.uni='creatures';S.rf=rfDraft(o.id);S.rfTab='fiche';S.rfEd=false;}
  else if(o.t==='secret'){S.dlg=null;S.view='univers';S.uni='secrets';S.sec=+o.n;S.secHl=o.k?{k:o.k,i:+o.i||0}:null;}
  else if(o.t==='joueur'){S.dlg={kind:'pl',id:o.id,nav:true};return true;}
  else if(o.t==='pw'||o.t==='cap'){S.dlg={kind:'cons',t:o.t,id:o.id,nav:true};return true;}
  window.scrollTo(0,0);return true;}
/* Revenir d'un cran : restaure l'écran mémorisé et sa position de défilement */
function navPop(){const s=S.nav.pop();if(!s)return;
  S.view=s.view;S.sel=s.sel;S.shTab=s.shTab;S.uni=s.uni;S.sec=s.sec;S.rf=s.rf;S.rfTab=s.rfTab;S.rfEd=s.rfEd&&canEdit();S.dlg=s.dlg?{...s.dlg}:null;
  S.sheet=null;S.asheet=null;S.confirm=null;S.secHl=null;S._force=true;render();
  const y=s.y;requestAnimationFrame(()=>window.scrollTo(0,y));}
/* « ‹ Retour » : passe par l'historique du navigateur quand il porte la pile (même effet que le retour du téléphone) */
function navBack(){const st=history.state;if(st&&st.xpnav&&st.xpnav===S.nav.length){history.back();return;}navPop();}
const navClear=()=>{S.nav=[];};
function navBar(){if(!S.nav.length)return '';const path=S.nav.map(s=>s.lab).filter(Boolean);
  return `<div class="navbar"><button type="button" class="navback" data-act="navBack"><span aria-hidden="true">‹</span> Retour</button><span class="navpath">${path.length?'depuis '+path.map(esc).join(' › '):''}</span></div>`;}
/* Retour du téléphone (ou du navigateur) : ferme d'abord une fenêtre ouverte, puis dépile */
if(window.addEventListener)window.addEventListener('popstate',()=>{if(!S.nav.length)return;
  if(S.dlg&&!S.dlg.nav){S.dlg=null;S.sheet=null;S.asheet=null;S._force=true;render();try{history.pushState({xpnav:S.nav.length},'');}catch(e){}return;}
  if(S.sheet||S.asheet){S.sheet=null;S.asheet=null;S._force=true;render();try{history.pushState({xpnav:S.nav.length},'');}catch(e){}return;}
  navPop();});
/* Nom principal d'une race : réglage de la fiche (masculin par défaut, sinon féminin) ; l'autre nom suit */
const raceNm=x=>{if(!x)return '';const f=(x.fem||'').trim();return x.nomP==='f'&&f?f:(x.sing||f);};
const raceNmOther=x=>{if(!x||x.mVide)return '';const f=(x.fem||'').trim(),p=raceNm(x),o=p===x.sing?f:x.sing;return o&&nrm(o)!==nrm(p)?' · '+o:'';};
/* Mode édition : quitter avec un éditeur ouvert ne pose la question que s'il reste des changements non enregistrés */
const EDIT_DLG=new Set(['elEdit','pfEd','ppEl','se','ce']);
const SAVE_ACTS=new Set(['rfSave','rfHumSave','elSave','pfSave','ppElSave','seSave','creSave','pSave']);
const editorOpen=()=>!!((S.rfEd&&S.rf)||(S.dlg&&EDIT_DLG.has(S.dlg.kind)));
function editOff(){S.edit=false;S.rfEd=false;S.edDirty=false;S.edQuit=false;if(S.dlg&&EDIT_DLG.has(S.dlg.kind))S.dlg=null;if(S.view==='params')S.view='home';S._force=true;render();}
function editToggle(){if(!isGest()||S.visit)return;if(!S.edit){S.edit=true;S.edDirty=false;S._force=true;render();return;}
  if(editorOpen()&&S.edDirty){S.edQuit=true;S._force=true;render();return;}editOff();}
/* Quitter l'éditeur de race (Terminer, ‹ Races, retour, onglet, lien) avec des changements non enregistrés : même question */
const RF_LEAVE=new Set(['rfEdOff','rfBack','tab','navBack','lnk','rfOpen','rfHum','rfNew']);
function rfLeaveAsk(a,d,ev){if(!(S.rfEd&&S.rf&&S.edDirty&&RF_LEAVE.has(a)))return false;if(ev)ev.preventDefault();S.edQuit={a,d:{...d}};S._force=true;render();return true;}
function edReplay(q){if(!q||q.a==='rfEdOff'){S._force=true;render();return;}const b=document.createElement('button');b.hidden=true;b.dataset.act=q.a;for(const k in q.d)b.dataset[k]=q.d[k];document.body.appendChild(b);b.click();b.remove();}
function rfDiscard(){S.rfEd=false;S.edDirty=false;if(S.rf)S.rf=S.rf.id?rfDraft(S.rf.id):null;}
function edQuitSheet(){const rf=!!(S.edQuit&&S.edQuit.a),t=rf?'Quitter la modification ?':'Quitter le mode édition ?';return `<div class="sheet-bg" data-act="edqStay"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${t}"><div class="in"><h2>${t}</h2><div class="muted">Des changements ne sont pas encore enregistrés.</div><div class="actions"><button class="btn ghost" data-act="edqStay">Rester</button><button class="btn" data-act="edqDrop">Abandonner</button><button class="btn pri" data-act="edqSave">Enregistrer</button></div></div></div>`;}
/* Clics propres au lot 4 bis ; renvoie true si le clic est traité */
function lnkAct(a,d){
  if(a==='lnk'){if(navGo({t:d.t,id:d.id,n:d.n,k:d.k,i:d.i}))render();return true;}
  if(a==='navBack'){navBack();return true;}
  if(a==='editToggle'){editToggle();return true;}
  if(a==='edqStay'){S.edQuit=false;S._force=true;render();return true;}
  if(a==='edqDrop'){if(S.edQuit&&S.edQuit.a){const q=S.edQuit;S.edQuit=false;rfDiscard();edReplay(q);return true;}editOff();return true;}
  if(a==='edqSave'&&S.edQuit&&S.edQuit.a){const q=S.edQuit;S.edQuit=false;S._force=true;render();const b=document.querySelector('#app [data-act="rfSave"]');if(b&&!b.disabled)b.click();
    if(document.querySelector('#app [role="alert"]')||(S.rf&&(S.rf.unkAsk||S.rf.err)))return true;S.edDirty=false;if(q.a==='rfEdOff')rfDiscard();edReplay(q);return true;}
  if(a==='edqSave'){S.edQuit=false;S._force=true;render();const b=document.querySelector('#sheetRoot [data-act="'+[...SAVE_ACTS].join('"],#sheetRoot [data-act="')+'"],#app [data-act="'+[...SAVE_ACTS].join('"],#app [data-act="')+'"]');
    if(b&&!b.disabled)b.click();if(!document.querySelector('#app [role="alert"],#sheetRoot [role="alert"]'))editOff();return true;}
  if(a==='rfEdOn'){if(!canEdit())return true;S.rfEd=true;S.edDirty=false;S._force=true;render();window.scrollTo(0,0);return true;}
  if(a==='rfEdOff'){rfDiscard();S._force=true;render();return true;}
  if(a==='consEdit'){if(!canEdit())return true;const g=S.dlg;if(!g||g.kind!=='cons')return true;const back={...g};S.dlg=elDraft(g.t,g.id);S.dlg.back=back;S.edDirty=false;S._force=true;render();return true;}
  if(a==='secJump'){const el=document.getElementById('seck-'+d.k);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});return true;}
  if(SAVE_ACTS.has(a))setTimeout(()=>{if(!document.querySelector('#app [role="alert"],#sheetRoot [role="alert"]'))S.edDirty=false;},0);
  return false;}
/* PJ visible de toute la table dont la race a encore des éléments fermés (hors pouvoirs) : incohérence signalée à la gestion */
function raceIncoh(c){if(!c||c.type!=='PJ'||c.cache||!actif(c)||!c.race||!modelV1())return false;const cr=crBySing(c.race);if(!cr)return false;const e=eyeOf(cr,raceRec(cr));return !(e.fiche&&EYE_BLOCKS.every(([k])=>e[k]));}
