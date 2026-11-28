/* La belle appli — accueil, « Qui es-tu ? », notifications, fenêtres et rendu */
/* ---------- Accueil (UX3, 28/11/2026) : tableau de bord personnel ----------
   Temps · À traiter · Mon personnage · Nouveautés · texte d'accueil ; blocs repliables mémorisés (localStorage xp.homeOpen) */
const ACC_DEF='La belle appli aide à gérer les éléments ludiques des Héritiers : personnages, XP, univers et organisation des parties.';
const accTxt=()=>S.accueil&&typeof S.accueil.txt==='string'?S.accueil.txt:ACC_DEF;
const isWide=()=>typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(min-width: 900px)').matches;
function hmOpenGet(){try{return JSON.parse(localStorage.getItem('xp.homeOpen')||'{}')||{};}catch(e){return {};}}
function hmOpen(k,def){if(isWide())return true;const o=hmOpenGet();return o[k]==null?def:!!o[k];}
function hmSeenGet(){try{return localStorage.getItem('xp.homeSeen')||'';}catch(e){return '';}}
/* Points à traiter, selon les droits de chacun : [{rub, txt, sub, attrs}] */
const AT_RUB=[['rev','Révélations'],['perso','Personnages'],['sess','Sessions'],['sig','Signalements']];
/* Droit de traiter : éléments de PP → MJ et gestion ; race, pouvoir, capacité ou personnage visibles → tous ; visibilité d'une race → MJ */
function atSigSee(s){if(!s||!s.obj||s.obj.t==='brouillon')return false;if(isGest())return true;const t=s.obj.t;
  if(t==='ppel')return isTech();if(['race','pouvoir','capacite'].includes(t))return !!sigOpenAttrs(s.obj); /* correctif : modifiables par tous s'ils sont visibles */
  if(t==='perso')return !/^Visibilité/.test(s.champ||'')&&!!sigOpenAttrs(s.obj);return false;}
function atItems(){if(!isUser())return [];const G=isGest(),out=[],add=(rub,txt,sub,attrs,o)=>out.push({rub,txt,sub,attrs,...(o||{})});
  if(G&&typeof secLot==='function'){const L=secLot();if(L.length)add('rev','Révélations en attente',L.length+' élément'+(L.length>1?'s':'')+' · invisibles des joueurs jusqu\'à la validation','data-act="lotOpen"',{lot:L.length});}
  if(G)for(const b of Object.values(S.brouillons||{}))if(b&&b.statut==='attente'){const I=(b.d||{}).ident||{};add('perso','Brouillon à valider · '+(((I.court||'').trim())||'?'),(b.kind==='feal'?'Féal':'PJ')+' · envoyé par '+((S.players[b.par]||{}).nom||'?'),`data-act="cwOpen" data-id="${esc(b.id)}"`);}
  if(G&&typeof propsAtt==='function')for(const p of propsAtt()){const sc=secById(p.n);const by=(S.players[p.by]||{}).nom;add('perso','Proposition de découverte',(by?by+' · ':'')+'Secret n° '+p.n+(sc&&sc.titre?' · '+sc.titre:''),lnkAttrs({t:'secret',n:p.n}));}
  if(typeof plPast==='function')for(const x of plPast())add('sess','Créer la session du '+fmtLong(x.date).replace(/^./,c=>c.toLowerCase()),'Date validée passée · '+(x.type||'Scénario'),'',{plan:x.id});
  if(typeof chRattProps==='function'){const n=chRattProps().filter(r=>r.ev).length;if(n)add('sess','Rattachements à vérifier',n+' session'+(n>1?'s':'')+' sans événement','data-act="atRatt"');}
  if(G&&typeof fi6RattCands==='function'){const n=fi6RattCands().length;if(n)add('sess','Rattachement par nom',n+' ligne'+(n>1?'s':'')+' de Situation à relier à une fiche','data-act="atF" data-v="sess"',{r6:n});}
  if(typeof sigAll==='function')for(const sg of sigAll())if(!sg.ok&&atSigSee(sg))add('sig',(SIG_OBJ[sg.obj.t]||'')+' · '+sigObjName(sg.obj)+' › '+sg.champ,(SIG_ST[sg.statut]||'')+(sg.note?' · '+sg.note:''),sigOpenAttrs(sg.obj),{sg});
  return out;}
function atRowH(x){if(x.plan)return `<div class="atrow"><span class="cmain"><b>${esc(x.txt)}</b><small>${esc(x.sub)}</small></span><span class="acts"><button type="button" class="btn pri" data-act="plMkSess" data-id="${esc(x.plan)}">Créer</button><button type="button" class="btn ghost" data-act="plEcart" data-id="${esc(x.plan)}">Écarter</button></span></div>`;
  return x.attrs?`<button type="button" class="atrow" ${x.attrs}><span class="cmain"><b>${esc(x.txt)}</b><small>${esc(x.sub)}</small></span><span class="chev" aria-hidden="true">›</span></button>`:`<div class="atrow"><span class="cmain"><b>${esc(x.txt)}</b><small>${esc(x.sub)}</small></span></div>`;}
/* Mes personnages : PJ, féaux, brouillons, fiefs */
function hmMine(){if(!isUser()||!ME)return [];const out=[],fiefs=new Set();
  const pjs=pjIds().map(i=>S.chars[i]).filter(c=>c&&actif(c)&&owners(c).some(p=>p.id===ME)).sort((a,b)=>(a.court||'').localeCompare(b.court||'','fr'));
  for(const c of pjs){const t=typeof titreBest==='function'?titreBest(c):null,rg=typeof rangInfo==='function'?rangInfo(c):null;
    const obj=t?t.nom+' '+titreTxt(t):rg&&!rg.done?rg.next+(rg.blocked?' : hors de portée':rg.ready?' : pouvoir à acquérir':' dans '+rg.total+' XP'):'';
    out.push({k:'pj',c,obj,xp:summary(c,S.events).dispo});
    for(const f of Object.values(S.chars))if(f&&f.type==='PNJ'&&f.pj===c.id&&actif(f)&&typeof isFeal==='function'&&isFeal(f))out.push({k:'feal',c:f,xp:summary(f,S.events).dispo});
    if(typeof fgFiefsOf==='function')for(const fid of fgFiefsOf(c))fiefs.add(fid);}
  for(const b of Object.values(S.brouillons||{}))if(b&&b.par===ME&&(b.statut==='brouillon'||b.statut==='attente'))out.push({k:'br',b});
  for(const fid of fiefs){const f=S.fiches[fid];if(f&&fiSee(f))out.push({k:'fief',f,xp:fgXp(fid).solde});}
  return out;}
function hmMineRow(x){const av=c=>{const im=portrait(c);return `<span class="hmav">${im?`<img src="${im}" alt="">`:esc((c.court||'?').slice(0,1))}</span>`;};
  if(x.k==='pj')return `<button type="button" class="hmrow" data-act="hmGo" data-k="prog" data-id="${esc(x.c.id)}">${av(x.c)}<span class="cmain"><b>${esc(x.c.court||x.c.nom)}</b>${x.obj?`<small>${esc(x.obj)}</small>`:''}</span><span class="hmxp"><b>${x.xp}</b><small>XP à dépenser</small></span></button>`;
  if(x.k==='feal')return `<button type="button" class="hmrow sub" data-act="hmGo" data-k="prog" data-id="${esc(x.c.id)}"><span class="cmain">Féal · ${esc(x.c.court||x.c.nom)}</span><span class="hmxp"><b>${x.xp}</b> XP</span></button>`;
  if(x.k==='br'){const I=(x.b.d||{}).ident||{},st=crSteps(x.b),n=Math.min(x.b.etape||0,st.length-1);return `<button type="button" class="hmrow" data-act="cwOpen" data-id="${esc(x.b.id)}"><span class="hmav br">+</span><span class="cmain"><b>${esc((I.court||'').trim()||(x.b.kind==='feal'?'Nouveau féal':'Nouveau PJ'))}</b> <span class="pill ${x.b.statut==='attente'?'acc':'plan'}">${x.b.statut==='attente'?'En attente':'Brouillon'}</span><small>Étape ${n+1} sur ${st.length}</small></span><span class="hmgo">${x.b.statut==='attente'?'Voir':'Reprendre'} ›</span></button>`;}
  return `<button type="button" class="hmrow" data-act="hmGo" data-k="fief" data-id="${esc(x.f.id)}"><span class="hmav fief" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V10l7-5 7 5v11M10 21v-5h4v5"/></svg></span><span class="cmain"><b>Fief · ${esc(x.f.nom)}</b><small>Gestion du fief</small></span><span class="hmxp fief"><b>${x.xp}</b><small>XP du fief</small></span></button>`;}
/* Nouveautés : dernières fiches et événements visibles, par date de modification */
const HM_G=new Set(['lieu','org','famille','objet','bete','carte','evenement','chrono','art']);
function hmNews(){if(typeof fiAll!=='function'||!S.fichesReady)return {L:[],n:0};let seen=hmSeenGet();
  if(!seen){seen=new Date().toISOString();try{localStorage.setItem('xp.homeSeen',seen);}catch(e){}} /* première visite : point de départ */
  const A=fiAll().filter(f=>HM_G.has(f.genre)&&fiSee(f)&&f.modif).sort((a,b)=>String(b.modif).localeCompare(String(a.modif)));
  return {L:A.slice(0,5),n:A.filter(f=>(!seen||String(f.modif)>seen)&&f.par!==ME).length};}
function hmWhen(iso){const d=String(iso||'').slice(0,10),t=today();if(d===t)return "aujourd'hui";const y=new Date(Date.now()-864e5).toISOString().slice(0,10);if(d===y)return 'hier';return d?d.slice(8,10)+'/'+d.slice(5,7):'';}
function hmNewsRow(f){const ev=f.genre==='evenement',num=ev&&typeof chNumOf==='function'?chNumOf(f):'',cl=ev&&typeof chCl==='function'?chCl(f):'';
  const sub=f.type&&!ev?f.type:cap1((FI_G[f.genre]||{}).un||(ev?'événement':'fiche'));
  return `<button type="button" class="hmnew" ${lnkAttrs({t:'fiche',id:f.id})}><span class="cmain">${num?`<span class="chnum ${cl}">${esc(num)}</span> `:''}<b>${esc(f.nom||'')}</b> <span class="muted">· ${esc(sub)}</span></span><span class="muted small">${esc(hmWhen(f.modif))}</span></button>`;}
function hmBlk(k,title,badge,sum,body,def,cls){const o=hmOpen(k,def);
  return `<details class="hmblk${cls?' '+cls:''}" data-hm="${k}"${o?' open':''}><summary><h3>${title}</h3>${badge?`<span class="bdg${cls==='hmat'?'':' g'}">${badge}</span>`:''}<span class="hmsum">${esc(sum||'')}</span><span class="chev" aria-hidden="true">›</span></summary><div class="hmbody">${body}</div></details>`;}
function viewHome(){
  const V=validDates()[0],np=openProps().length,nb=unseenProps(),hb=typeof chHomeBits==='function'?chHomeBits():null,U=isUser();
  const game=hb?`<button type="button" class="hmt hgame" data-act="chHome"><span class="hic">${ICON.sablier}</span><span class="ht"><span class="hlab">Dans le jeu</span><b>${esc(chDateTxt(hb.now).replace(/^./,x=>x.toUpperCase()))}</b>${hb.B.length?`<span class="muted small">${esc(hb.B.join(' · '))}</span>`:''}</span><span class="chev" aria-hidden="true">›</span></button>`:'';
  let plan;
  if(V){const dd=Math.round((new Date(V.date+'T12:00')-new Date(today()+'T12:00'))/864e5);
    plan=`<button type="button" class="hmt hplan" data-act="tab" data-v="planning" data-pv="com"><span class="hic">${ICON.calp}</span><span class="ht"><span class="hlab">Prochaine partie</span><b>${dLine(V)}</b><span class="muted small">${esc(V.type||'Scénario')}${dd>1?' · dans '+dd+' jours':dd===1?' · demain':dd===0?" · aujourd'hui":''}${nb?' · '+nb+' date'+(nb>1?'s':'')+' à répondre':''}</span></span><span class="chev" aria-hidden="true">›</span></button>`;}
  else plan=`<div class="hmt hplan"><span class="hic">${ICON.calp}</span><span class="ht"><span class="hlab">Prochaine partie</span><b>Rien de prévu</b>${U?`<span class="hmbtns">${nb?`<button type="button" class="btn pri" data-act="tab" data-v="planning" data-pv="com">Répondre (${nb})</button>`:''}<button type="button" class="btn ghost" data-act="dPropose">Proposer une date</button></span>`:np?`<span class="muted small">${np} date${np>1?'s':''} proposée${np>1?'s':''}</span>`:''}</span></div>`;
  let h=`<div class="home-in"><section class="hmtime" aria-label="Temps">${game}${plan}</section>`;
  const A=atItems();
  if(A.length){const sum=[...new Set(A.map(x=>(AT_RUB.find(r=>r[0]===x.rub)||[,''])[1].toLowerCase()))].join(', ');
    h+=hmBlk('at','À traiter',A.length,sum,A.slice(0,3).map(atRowH).join('')+`<button type="button" class="hmall" data-act="tab" data-v="todo">Tout voir (${A.length}) ›</button>`,false,'hmat');}
  const M=hmMine();
  if(M.length){const n=M.filter(x=>x.k!=='feal').length;h+=hmBlk('me',n>1?'Mes personnages':'Mon personnage','','',M.map(hmMineRow).join(''),true);}
  const N=hmNews();
  if(N.L.length)h+=hmBlk('nv','Nouveautés',N.n||'',N.n?(N.n>1?'depuis ta dernière visite':'depuis ta dernière visite'):'',N.L.map(hmNewsRow).join('')+`<button type="button" class="hmall" data-act="tab" data-v="univers">Tout l'univers ›</button>`,false);
  const tx=accTxt(),E=canEdit();
  if(tx.trim()||E)h+=`<div class="hmtxt${E?' ed':''}">${E?`<div class="blkhd"><span class="hlab">Texte d'accueil</span><button type="button" class="ibtn" data-act="hmTxt" aria-label="Modifier le texte d'accueil">${ICON.crayon}</button></div>`:''}${tx.trim()?`<p>${esc(tx).replace(/\n/g,'<br>')}</p>`:'<p class="muted small">Vide : masqué pour la table.</p>'}</div>`;
  return h+'</div>';
}
/* Fenêtre du texte d'accueil (MJ et gestion, mode édition) */
function hmTxtSheet(g){return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Texte d'accueil"><div class="in"><div class="shd"><h2>Texte d'accueil</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>
  <label for="hmtx" class="muted small">Affiché en bas de l'accueil, pour toute la table. Vide = masqué.</label><textarea id="hmtx" rows="5" data-hmtx="1">${esc(g.txt)}</textarea>
  <div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="hmTxtSave">Enregistrer</button></div></div></div>`;}
/* Page « À traiter » */
function viewTodo(){if(!isUser())return `<h2>À traiter</h2><div class="card empty">Réservé aux joueurs identifiés.</div>`;
  const A=atItems(),f=S.atF||'',H=(S.xpHelp||{}).todo;
  let h=`${crumb(['Accueil','data-act="tab" data-v="home"'],[''])}<div class="pghead"><h2 style="margin:4px 0 0;flex:1">À traiter</h2><button type="button" class="qbtn" data-act="xpHelp" data-k="todo" aria-expanded="${!!H}" aria-label="Aide de la page À traiter">?</button></div>`;
  if(H)h+=`<div class="qtip2">Chacun voit les points qu'il a le droit de traiter : éléments masqués, brouillons et révélations pour le MJ ; réglages pour le MJ et la gestion ; le reste pour toute la table. Un signalement automatique disparaît quand le champ est rempli ; un signalement posé à la main se ferme avec « Résolu ».</div>`;
  const R=AT_RUB.filter(([k])=>A.some(x=>x.rub===k));
  if(R.length>1)h+=`<div class="chips atchips">${[['','Tout · '+A.length],...R.map(([k,l])=>[k,l+' · '+A.filter(x=>x.rub===k).length])].map(([k,l])=>`<button type="button" class="chip" data-act="atF" data-v="${k}" aria-pressed="${f===k}">${esc(l)}</button>`).join('')}</div>`;
  if(!A.length)h+=`<div class="card empty">Rien à traiter pour l'instant.</div>`;
  for(const [k,l] of AT_RUB){if(f&&f!==k)continue;const L=A.filter(x=>x.rub===k);if(!L.length)continue;
    const who=k==='rev'||k==='perso'?'MJ':k==='sess'?'toute la table':'selon l\'élément';
    let body;
    if(k==='rev')body=`<div class="atrow"><span class="cmain"><b>${L[0].lot} élément${L[0].lot>1?'s':''} en attente</b><small>Invisibles des joueurs jusqu'à la validation · une seule notification</small></span></div><div class="actions"><button type="button" class="btn pri" data-act="lotOpen">Valider le lot</button><button type="button" class="btn ghost" data-act="atSec">Ouvrir les secrets</button></div>`;
    else if(k==='sig'){const T=isTech(),sf=S.sigF=S.sigF||{st:'',t:'',res:false},Lf=L.filter(x=>(!sf.st||x.sg.statut===sf.st)&&(!sf.t||x.sg.obj.t===sf.t));
      body=`<details class="atflt"${sf.st||sf.t?' open':''}><summary class="btn ghost">Filtres ▾</summary><div class="flt">${[['','Tous'],...Object.entries(SIG_ST)].map(([q,l2])=>`<button data-act="sigF" data-k="st" data-v="${q}" aria-pressed="${sf.st===q}">${l2}</button>`).join('')}</div><div class="flt">${[['','Tous objets'],...Object.entries(SIG_OBJ).filter(([q])=>q!=='brouillon')].map(([q,l2])=>`<button data-act="sigF" data-k="t" data-v="${q}" aria-pressed="${sf.t===q}">${l2}</button>`).join('')}</div></details>`
        +Lf.map(x=>`<div class="atsig">${atRowH(x)}${x.sg.auto?'':`<button class="btn ghost ui-xs" data-act="sigOk" data-id="${esc(x.sg.id)}">Résolu</button>`}</div>`).join('')+(Lf.length?'':'<div class="muted small">Aucun signalement pour ce filtre.</div>');
      if(T&&typeof sigForm==='function')body+=sigForm();
      const res=sigStored().filter(s=>s.ok&&atSigSee(s));if(T&&res.length)body+=`<details class="atres"><summary class="muted small">Résolus · ${res.length}</summary>${res.map(s=>`<div class="atsig"><div class="atrow"><span class="cmain"><b>${esc((SIG_OBJ[s.obj.t]||'')+' · '+sigObjName(s.obj)+' › '+s.champ)}</b><small>résolu le ${fmtDate(s.okDate||'')}</small></span></div><button class="btn ghost ui-xs" data-act="sigOk" data-id="${esc(s.id)}">Rouvrir</button></div>`).join('')}</details>`;}
    else body=L.filter(x=>!x.r6).map(atRowH).join('')+(k==='sess'&&L.some(x=>x.r6)&&typeof fi6RattView==='function'?fi6RattView():'');
    h+=`<section class="card atsec"><div class="blkhd"><h3>${esc(l)}</h3><span class="tag2">${esc(who)}</span>${k==='sig'?`<span class="muted small">${L.length} ouvert${L.length>1?'s':''}</span>`:''}</div>${body}</section>`;}
  return h;}
function homeAct(a,d){
  if(a==='hmGo'){if(d.k==='fief'){S.fiTab='gest';if(navGo({t:'fiche',id:d.id}))render();return true;}
    if(d.k==='prog'){if(navGo({t:'perso',id:d.id})){S.shTab='prog';render();}return true;}return true;}
  if(a==='hmTxt'){if(!canEdit())return true;S.dlg={kind:'hmTxt',txt:accTxt()};render();return true;}
  if(a==='hmTxtSave'){const g=S.dlg;if(!canEdit()||!g||g.kind!=='hmTxt')return true;S.accueil={txt:String(g.txt||'').trim()};persist('meta/accueil',S.accueil);S.dlg=null;render();toast('Enregistré');return true;}
  if(a==='atF'){S.atF=d.v||'';if(S.view!=='todo'){S.view='todo';}render();return true;}
  if(a==='atSec'){if(!isGest())return true;S.view='univers';S.uni='secrets';S.fi=null;S.sec=null;window.scrollTo(0,0);render();return true;}
  if(a==='atRatt'){if(!isUser())return true;S.view='univers';S.uni='chronique';S.fi=null;S.chPage='ratt';S.chRat=null;window.scrollTo(0,0);render();return true;}
  return false;}
document.addEventListener('toggle',ev=>{const t=ev.target;if(!t||!t.dataset||!t.dataset.hm||isWide())return;const o=hmOpenGet();o[t.dataset.hm]=t.open;try{localStorage.setItem('xp.homeOpen',JSON.stringify(o));}catch(e){}
  if(t.dataset.hm==='nv'&&t.open){try{localStorage.setItem('xp.homeSeen',new Date().toISOString());}catch(e){}}},true);
document.addEventListener('input',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.hmtx!==undefined&&S.dlg&&S.dlg.kind==='hmTxt')S.dlg.txt=t.value;});
/* ---------- Qui es-tu ? ---------- */
function whoGate(){return idGate();
  const pl=planPlayers();
  if(!S.ready||!pl.length||(ME&&S.players[ME]))return '';
  return `<div class="who" role="dialog" aria-modal="true" aria-label="Qui es-tu ?"><div class="who-in"><div class="who-g">${ICON.gear||''}</div><h2>Bienvenue dans La belle appli</h2><p>Qui es-tu ?</p><div class="who-grid">${pl.map(p=>`<button class="btn" data-act="setMe" data-id="${p.id}">${esc(p.nom)}</button>`).join('')}</div><p class="muted small">Demandé une seule fois sur cet appareil. Tu pourras changer dans l'onglet Joueurs. Ton nom sert pour tes disponibilités et tes réponses aux dates proposées.</p></div></div>`;
}

/* ---------- Notifications ---------- */
const pushOK=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let SWREG=null;
if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').then(r=>{SWREG=r;return r.pushManager&&r.pushManager.getSubscription();}).then(sub=>{S.pushSub=sub||null;S._force=true;render();}).catch(()=>{});}
function b64u(s){const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0));}
async function pushEnable(){
  if(!ME||!S.players[ME]){alertMsg('Choisis d\'abord ton nom dans « Je suis ».');return;}
  try{
    const perm=await Notification.requestPermission();if(perm!=='granted'){S.pushMsg='Notifications refusées. Tu peux les autoriser dans les réglages du navigateur.';render();return;}
    const reg=SWREG||await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID_PUBLIC)});
    const js=sub.toJSON(),pl=clone(S.players[ME]);pl.push=(pl.push||[]).filter(x=>x.endpoint!==js.endpoint);pl.push.push({endpoint:js.endpoint,keys:js.keys});
    S.pushSub=sub;S.pushMsg='Notifications activées sur cet appareil.';savePlayer(pl);
  }catch(e){console.error(e);S.pushMsg='Activation impossible sur cet appareil.';render();}
}
async function pushDisable(){
  try{const sub=S.pushSub;if(sub){const ep=sub.endpoint;await sub.unsubscribe();for(const p of Object.values(S.players)){if((p.push||[]).some(x=>x.endpoint===ep)){const n=clone(p);n.push=n.push.filter(x=>x.endpoint!==ep);savePlayer(n);}}}
    S.pushSub=null;S.pushMsg='Notifications désactivées sur cet appareil.';render();}catch(e){console.error(e);}
}
function alertMsg(m){S.pushMsg=m;render();}
function notify(payload){let code=null;try{code=localStorage.getItem('xp.code');}catch(e){}if(!code)return;
  fetch(SB.url+'/functions/v1/notify',{method:'POST',headers:{'apikey':SB.key,'Authorization':'Bearer '+SB.key,'Content-Type':'application/json'},body:JSON.stringify(Object.assign({code},payload))}).catch(()=>{});}
function pushCard(){
  let st,act='';
  if(!pushOK())st=isIOS()&&!isStandalone()?'Sur iPhone, ajoute d\'abord l\'appli à l\'écran d\'accueil (Partager › Sur l\'écran d\'accueil), puis ouvre-la depuis le raccourci.':'Ce navigateur ne gère pas les notifications.';
  else if(!ME||!S.players[ME])st='Choisis ton nom ci-dessus pour activer les notifications.';
  else if(Notification.permission==='denied')st='Notifications bloquées pour ce site : autorise-les dans les réglages du navigateur.';
  else if(S.pushSub){st='Activées sur cet appareil.';act=`<button class="btn" data-act="pushOff">Désactiver</button>`;}
  else{st='Reçois une notification quand une date est proposée, et un rappel la veille d\'une partie validée.';act=`<button class="btn pri" data-act="pushOn">Activer les notifications</button>`;}
  return `<div class="card" style="margin-top:12px"><h3 style="margin-top:0">Notifications</h3><div class="muted small">${st}</div>${S.pushMsg?`<div class="small" style="margin-top:6px">${esc(S.pushMsg)}</div>`:''}${act?`<div class="actions">${act}</div>`:''}</div>`;
}
const unseenProps=()=>{if(!ME||!S.players[ME])return 0;const r=S.players[ME].rep||{};return openProps().filter(x=>!r[x.id]&&x.by!==ME).length;};
/* Correctifs (lots 3-4) : un redessin de la fenêtre garde sa position de défilement ; un bloc d'édition qui s'ouvre est amené à l'écran ;
   le retour à une fenêtre précédente retrouve sa position ; un refus d'enregistrement amène son message à l'écran ; une réussite affiche « Enregistré ». */
let SH_PREV=null;
function renderSheet(){const root=document.getElementById('sheetRoot'),sh0=root&&root.querySelector('.sheet');
  if(sh0&&SH_PREV)SH_PREV._st=sh0.scrollTop;const ed0=sh0?sh0.querySelectorAll('.fxed,.elvar.ed').length:0,same=S.dlg&&S.dlg===SH_PREV;
  renderSheet0();const sh=root&&root.querySelector('.sheet');
  if(sh&&S.dlg){const st=S.dlg._st;if(st)sh.scrollTop=st;
    const eds=sh.querySelectorAll('.fxed,.elvar.ed');if(same&&eds.length>ed0)inView(sh,eds[eds.length-1]);}
  SH_PREV=S.dlg||null;uiAfter();}
function inView(sh,e){const r=e.getBoundingClientRect(),R=sh.getBoundingClientRect();if(r.top<R.top||r.bottom>R.bottom)sh.scrollTop+=Math.min(r.top-R.top-12,r.bottom-R.bottom+12);}
function uiAfter(){if(!S._errScroll)return;S._errScroll=false;const sh=document.querySelector('#sheetRoot .sheet');
  const e=(sh&&sh.querySelector('[role=alert]'))||document.querySelector('#app [role=alert]');if(!e)return;if(sh&&sh.contains(e))inView(sh,e);else e.scrollIntoView({block:'center'});}
function toast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');document.body.appendChild(t);}
  t.textContent=m;t.className='on';clearTimeout(toast._t);toast._t=setTimeout(()=>{t.className='';},1800);}
/* UX2 : toast avec action (ex. « Annuler ») */
function toastAct(m,lab,act){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.setAttribute('role','status');document.body.appendChild(t);}
  t.innerHTML=`<span>${esc(m)}</span> <button type="button" class="toastb" data-act="${act}">${esc(lab)}</button>`;t.className='on act';clearTimeout(toast._t);toast._t=setTimeout(()=>{t.className='';t.textContent='';},5000);}
const refuse=()=>{S._errScroll=true;};
function renderSheet0(){
  const root=document.getElementById('sheetRoot');
  {const ae0=document.activeElement;if(S.dlg&&(S.dlg.kind==='b'||S.dlg.kind==='a'||S.dlg.kind==='sx'||S.dlg.kind==='se'||S.dlg.kind==='ca'||S.dlg.kind==='ce'||S.dlg.kind==='sn'||S.dlg.kind==='sm'||S.dlg.kind==='pd'||S.dlg.kind==='pp2'||S.dlg.kind==='rv')&&ae0&&(ae0.id==='dn'||ae0.id==='dp'||ae0.id==='sxt'||ae0.id==='rvt'||ae0.id==='crn'||ae0.id==='sdi'||ae0.id==='pdn'||ae0.id==='pdd')&&root.contains(ae0))return;}
  if(S.dlg){
    const g=S.dlg;let titre='',txt='';
    if(fiSheetHook(g,root))return; /* lot 1 : fenêtres des fiches */
    if(g.kind==='menu'){root.innerHTML=plusMenu();return;}
    if(g.kind==='pnjXp'){const c=S.chars[S.sel],f=S.pnjForm;if(!c){S.dlg=null;root.innerHTML='';return;}root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Ajouter des XP"><div class="in"><div class="blkhd"><h2 style="flex:1;margin:0">XP pour ${esc(c.court)}</h2><button type="button" class="ibtn sm" data-act="closeSheet" aria-label="Fermer">✕</button></div><div class="frow"><div class="field"><label for="px">Intitulé</label><input id="px" type="text" data-pnj="titre" value="${esc(f.titre)}"></div><div class="field"><label for="pm">XP</label><input id="pm" type="number" inputmode="numeric" min="0" data-pnj="montant" value="${esc(f.montant)}"></div></div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pnjXp"${f.titre.trim()&&+f.montant>0?'':' disabled'}>Ajouter</button></div></div></div>`;return;}
    if(g.kind==='xpd'){root.innerHTML=xpdSheet(g);return;}
    if(g.kind==='her'){root.innerHTML=heritageSheet();return;}
    if(g.kind==='teamNew'){root.innerHTML=teamNewSheet();return;}
    if(g.kind==='plWho'){root.innerHTML=plWhoSheet(g);return;}
    if(g.kind==='xpAdd'){const x=xpAddSheet(g);if(!x){S.dlg=null;root.innerHTML='';return;}root.innerHTML=x;return;}
    if(g.kind==='pd'){root.innerHTML=dateSheet(g);return;}
    if(PF_KINDS.has(g.kind)){const html=pfSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='me'){root.innerHTML=idSheet();return;}
    if(SH_DLG.has(g.kind)){const html=shDlgSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='cons'){const html=consSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='elEdit'||g.kind==='pwPick'){const html=g.kind==='elEdit'?elEditSheet(g):pwPickSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='cwPP'||g.kind==='cwVal'||g.kind==='cwQuit'||g.kind==='cwDel'){const html=g.kind==='cwPP'?cwPPSheet(g):g.kind==='cwVal'?cwValSheet(g):cwDlgSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;} /* lot C */
    if(g.kind==='hmTxt'){root.innerHTML=hmTxtSheet(g);return;} /* UX3 : texte d'accueil */
    if(g.kind==='pl'||g.kind==='pc'||g.kind==='newp'){const html=g.kind==='pl'?plSheet(g):g.kind==='pc'?pcSheet(g):newPSheet();if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='ne'){const e=sessById(g.id);if(!e){S.dlg=null;root.innerHTML='';return;}
      let body;
      if(g.one){const tg=orderPJ(natTargets(e,g.n));body=`<div class="field"><label for="ne-m">XP par personnage</label><input id="ne-m" type="number" inputmode="numeric" min="0" data-nem="1" value="${esc(g.m)}" placeholder="0"></div>
        <div class="muted small">${g.n==='Scénario'?'Pour les PJ présents':'Pour'} : ${tg.filter(i=>vis(S.chars[i])).map(i=>esc(S.chars[i].court)).join(', ')||'aucun PJ'}.${g.mixed?' Les montants actuels diffèrent : enregistrer alignera tout le monde sur ce montant.':''} Mets 0 pour retirer cette nature de la session.</div>`;}
      else body=natList(e,g).map(i=>`<div class="ped"><label for="ne-${i}">${esc(S.chars[i].court)}</label><input id="ne-${i}" type="number" inputmode="numeric" min="0" data-nv="${i}" value="${g.vals[i]?g.vals[i]:''}" placeholder="0"></div>`).join('')+`<div class="muted small">PJ présents à la session. Mets 0 ou laisse vide pour retirer le gain d'un personnage.</div>`;
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Modifier ${esc(g.n)}"><div class="in"><div><h2>${esc(g.n)}</h2><div class="muted small">${esc(e.titre)}</div></div>
      ${body}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="natSave">Enregistrer</button></div></div></div>`;return;}
    if(g.kind==='ptr'){const c=S.chars[g.cid],ill=/^ill-|^br-/.test(g.cid);if(!c&&!ill){S.dlg=null;root.innerHTML='';return;}const s2=g.base*g.z;
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${ill?'Illustration':'Portrait'}"><div class="in"><div><h2>${ill?'Illustration'+(g.lab?' : '+esc(g.lab):''):'Portrait de '+esc(c.court)}</h2><div class="muted small">Fais glisser l'image pour la cadrer dans le ${ill?'carré':'cercle'}, et zoome avec le curseur.</div></div>
      <div id="ptrStage"><img id="ptrImg" src="${g.src}" alt="" style="left:${g.x}px;top:${g.y}px;width:${g.w*s2}px;height:${g.h*s2}px"><div class="ring${ill?' sq':''}"></div></div>
      <div class="field"><label for="ptrz">Zoom</label><input id="ptrz" type="range" min="1" max="4" step="0.01" data-ptrz="1" value="${g.z}" style="width:100%"></div>
      <div class="muted small">Le cadrage ne vaut que pour la vignette (listes, médaillons) : l'image entière est aussi conservée pour les fiches.</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="ptrSave">Enregistrer</button></div></div></div>`;return;}
    if(g.kind==='atc'){const c=S.chars[g.cid],e=c&&atoutsOf(c)[g.i];if(!e){S.dlg=null;root.innerHTML='';return;}const ach=e.achat&&(c.achats||[]).find(x=>x.id===e.achat);
      const txt=(ach?`Annuler l'achat rend ${ach.cout} XP.`:'L\'atout redevient « à rattacher » : il reste compté et pourra recevoir un autre nom sans XP.')+((e.typ&&e.typ.length)||e.typAnon?' Les spécialités offertes par cet atout sont retirées.':'');
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Annuler un atout"><div class="in"><div><h2>${esc(e.nom)}</h2><div class="muted small">${esc(c.court)}</div></div><div>Annuler cet atout ?</div><div class="muted small">${txt}</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Garder</button><button class="btn pri" data-act="atCancelOk">Annuler l'atout</button></div></div></div>`;return;}
    if(g.kind==='spc'){const c=S.chars[g.cid],e=c&&specsOf(c)[g.i];if(!e){S.dlg=null;root.innerHTML='';return;}const ach=e.achat&&(c.achats||[]).find(x=>x.id===e.achat);
      const txt=ach?`Annuler l'achat rend ${ach.cout} XP.`:e.offert?'Cette spécialité offerte sera retirée.':'Elle redevient « à rattacher » : elle reste comptée et pourra être rattachée ailleurs sans XP.';
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Annuler une spécialité"><div class="in"><div><h2>${esc(e.nom)}</h2><div class="muted small">${esc(c.court)}</div></div><div>Annuler cette spécialité ?</div><div class="muted small">${txt}</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Garder</button><button class="btn pri" data-act="spCancelOk">Annuler la spécialité</button></div></div></div>`;return;}
    if(g.kind==='pp'){const c=S.chars[g.cid],pr=c&&(c.profils||[]).find(x=>x.nom===g.prof);if(!pr){S.dlg=null;root.innerHTML='';return;}
      const have=pr.note==null||pr.note===''?0:+pr.note,n=+String(g.spent).replace(',','.')||0,ok=n>0&&!isNaN(have);
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Points de personnage"><div class="in"><div><h2>Points de personnage</h2><div class="muted small">${esc(c.court)} · ${esc(pr.nom)} (rang ${rankOf(c,pr)})</div></div>
      <div class="calc"><span>PP disponibles</span><b>${esc(ppFmt(isNaN(have)?pr.note:have))}</b></div>
      <div class="field"><label for="pps">Points dépensés</label><input id="pps" type="number" inputmode="decimal" step="0.5" min="0" data-ppv="spent" value="${esc(g.spent)}" style="max-width:140px"></div>
      <div class="field"><label for="ppw">Pour quoi ? <span class="muted small">(facultatif)</span></label><input id="ppw" type="text" data-ppv="why" value="${esc(g.why)}" autocomplete="off"></div>
      <div class="muted small" id="ppinfo">${ok?`Il restera ${esc(ppFmt(have-n))} PP. `:''}Atteindre le rang N de ce profil ajoute N PP automatiquement. La dépense est inscrite dans l'historique des achats et peut y être annulée.</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="ppSave"${ok?'':' disabled'}>Enregistrer</button></div></div></div>`;return;}
    if(g.kind==='rat'){const c=S.chars[g.id],n=+g.montant||0,ok=n>0&&g.who.length&&(g.titre||'').trim();
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Rattrapage d'XP"><div class="in"><div><h2>Rattrapage d'XP</h2><div class="muted small">${esc(c.court)} · ${g.total} XP · ${g.ecart} sous la moyenne du groupe (${String(g.avg).replace('.',',')})</div></div>
      <div class="field"><label for="rty">Type</label><select id="rty" data-sd="type">${TYPES.map(t=>`<option${t===g.type?' selected':''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label for="rti">Intitulé</label><input id="rti" type="text" data-sd="titre" autocomplete="off" value="${esc(g.titre)}"></div>
      <div class="field"><label for="rda">Date</label><input id="rda" type="date" data-sd="date" value="${esc(g.date)}"></div>
      <div class="frow"><div class="field"><label for="rna">Nature</label><select id="rna" data-sd="nature">${NATURES.map(t=>`<option${t===g.nature?' selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label for="rmo">XP par personnage</label><input id="rmo" type="number" inputmode="numeric" min="0" data-sd="montant" value="${esc(g.montant)}"></div></div>
      <div class="chips" style="flex-wrap:wrap;overflow:visible">${pjIds().filter(i=>actif(S.chars[i])).map(i=>`<button class="chip" data-act="ratChar" data-id="${i}" aria-pressed="${g.who.includes(i)}">${esc(S.chars[i].court)}</button>`).join('')}</div>
      <div class="muted small">${g.cible?`${g.base} XP pour rejoindre ${esc(g.cible)} (${g.cibleTotal} XP), le joueur juste devant. `:''}Les PNJ rattachés ne touchent pas de part sur ce rattrapage.</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="ratOk"${ok?'':' disabled'}>Attribuer ${n} XP</button></div></div></div>`;return;}
    if(g.kind==='sn'||g.kind==='sm'){const kids=g.kind==='sm'?sessChildren(g.id).filter(k=>!(k.secret&&k.secret.k==='bonus')).length:0;
      const se=g.kind==='sm'&&sessById(g.id),fe=se&&se.evt&&S.fiches[se.evt],lk=g.kind==='sn'?xpLinked(g.type)&&!!g.evt:!!fe&&g.type===evType(se),L=g.kind==='sn'&&xpLinked(g.type)?xpEvOf(g.type):[];
      const evF=g.kind==='sn'&&xpLinked(g.type)?`<div class="field"><label for="sde">Événement</label><select id="sde" data-sd="evt">${g.type==='Vie du fief'?`<option value=""${!g.evt?' selected':''}>Aucun événement</option>`:''}${L.map(f=>`<option value="${esc(f.id)}"${g.evt===f.id?' selected':''}>${esc((chNumOf(f)?chNumOf(f)+' · ':'')+f.nom)}</option>`).join('')}<option value="__new"${g.evt==='__new'?' selected':''}>＋ Nouvel événement n° ${chPad(g.type,xpNextN(g.type))}</option></select></div>${g.evt==='__new'?`<div class="field"><label for="sdn">Titre de l'événement</label><input id="sdn" type="text" data-sd="evNom" autocomplete="off" value="${esc(g.evNom||'')}"></div>`:''}`:lk?`<div class="field"><label>Événement</label><div class="small"><span class="chsn ${CH_TCL[fe.type]||''}">${esc(chNumOf(fe)||'·')}</span> ${esc(fe.nom)} <span class="muted">· se change depuis la Chronique</span></div></div>`:'';
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Session de jeu"><div class="in"><h2>${g.kind==='sn'?'Nouvelle session':'Modifier la session'}</h2>
      <div class="field"><label for="sdt">Type</label><select id="sdt" data-sd="type">${TYPES.map(t=>`<option${t===g.type?' selected':''}>${t}</option>`).join('')}</select>${fe&&g.type!==evType(se)?(S.events.some(x=>x.session&&x.evt===fe.id&&x.id!==se.id)?`<div class="muted small" style="margin-top:4px;color:var(--bad)">L'événement « ${esc(fe.nom)} » a d'autres sessions : changer le type détache cette session.</div>`:`<div class="muted small" style="margin-top:4px">L'événement « ${esc(fe.nom)} » suit : il devient ${esc(g.type)}${CH_TCL[g.type]?' n° '+esc(chPad(g.type,xpNextN(g.type))):''}.</div>`):''}</div>
      <div class="field"><label for="sdd">Date</label><input id="sdd" type="date" data-sd="date" value="${esc(g.date)}"></div>
      ${evF}
      <div class="field"><label for="sdi">${lk?'Complément de titre <span class="muted small">(facultatif, ex. « Partie 2 », « Épilogue »)</span>':'Intitulé'}</label><input id="sdi" type="text" data-sd="titre" autocomplete="off" value="${esc(g.titre)}"></div>
      <div class="field"><label>PJ présents</label><div class="chips" style="flex-wrap:wrap;overflow:visible">${orderPJ([...new Set([...pjIds().filter(i=>actif(S.chars[i])),...(g.pj||[])])]).map(i=>`<button class="chip" data-act="sdPj" data-id="${i}" aria-pressed="${(g.pj||[]).includes(i)}">${esc(S.chars[i].court)}</button>`).join('')}</div><div class="muted small" style="margin-top:4px">L'XP de Scénario va aux PJ présents ; l'Individuel se choisit parmi eux.</div></div>
      ${kids?`<div class="muted small">Suppression impossible : ${kids} découverte${kids>1?'s sont rattachées':' est rattachée'} à cette session.</div>`:''}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="${g.kind==='sn'?'sessCreate':'sessSave'}"${sdOk(g)?'':' disabled'}>${g.kind==='sn'?'Créer la session':'Enregistrer'}</button></div></div></div>`;return;}
    if(g.kind==='ca'||g.kind==='ct'||g.kind==='ce'){const html=creSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='lotw'||g.kind==='lotr'){const html=g.kind==='lotw'?lotWinSheet(g):lotRecapSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;} /* UX2 : lot de révélations */
    if(g.kind==='eye'){const html=g.t==='sec'?eyeSecSheet(g):eyeRaceSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='pp2'||g.kind==='rv'){const html=g.kind==='pp2'?propSheet(g):revSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='sx'||g.kind==='se'){const html=secSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='c'){const c=S.chars[g.id];if(!c){S.dlg=null;root.innerHTML='';return;}titre='Supprimer '+c.court+' ?';txt="La fiche, les achats et les gains de ce personnage seront supprimés définitivement. Pour garder l'historique, passe plutôt son statut à « Décédé » ou « Retiré ».";}
    else if(g.kind==='p'){const p=S.players[g.id];if(!p){S.dlg=null;root.innerHTML='';return;}titre='Supprimer '+p.nom+' ?';txt="Le joueur disparaît de la liste. Ses personnages ne sont pas supprimés.";}
    else if(g.kind==='a'){const c=S.chars[g.id];if(!c){S.dlg=null;root.innerHTML='';return;}const dispo=summary(c,S.events).dispo,p=Math.floor(+g.pts)||0,ok=p>=1&&p<=dispo;
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Dépenser des XP"><div class="in"><div><h2>Dépenser en ${esc(autreLab(g.nom))}</h2><div class="muted small">${esc(c.court)}</div></div>${g.nom==='PNJ'&&pnjOf(c).length>1?`<div class="field"><label for="dpn">PNJ</label><select id="dpn" data-dpn="1"><option value="">— choisir —</option>${pnjOf(c).map(x=>`<option value="${x.id}"${g.pnj===x.id?' selected':''}>${esc(x.court)}</option>`).join('')}</select></div>`:''}<div class="field"><label for="dp">XP à ${g.nom==='Triche'?'dépenser':'transférer'}</label><input id="dp" type="number" inputmode="numeric" min="1" data-dp="1" autocomplete="off" value="${esc(g.pts)}"></div>${(()=>{if(g.nom==='PNJ'){const L=pnjOf(c),pn=L.length===1?L[0]:S.chars[g.pnj];return pn?`<div class="xpbox" id="dxfer">→ <span data-xn>${p||'…'}</span> XP transférés à ${esc(pn.court)} (ajoutés à son compteur).</div>`:'<div class="muted small">Choisis le PNJ qui reçoit les XP.</div>';}if(g.nom==='Domaine')return typeof fgXferHtml==='function'?fgXferHtml(c,g,p):`<div class="xpbox">→ <span data-xn>${p||'…'}</span> XP transférés au fief.</div>`;return '';})()}<div class="calc"><span>Disponible</span><b>${dispo} XP</b><span>Après dépense</span><b id="dafter">${dispo-p} XP</b></div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="dlgOk"${ok&&(g.nom!=='PNJ'||pnjOf(c).length===1||g.pnj)?'':' disabled'}>${g.nom==='Triche'?'Dépenser':'Transférer'}</button></div></div></div>`;
      return;}
    else if(g.kind==='u'){const c=S.chars[g.id];if(!c){S.dlg=null;root.innerHTML='';return;}const l=lastAutre(c,g.nom);
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Annuler une dépense"><div class="in"><div><h2>${esc(autreLab(g.nom))}</h2><div class="muted small">${esc(c.court)} · ${autreTotal(c,g.nom)} XP dépensés au total</div></div>${l?`<div class="muted small">Annule la dernière saisie : ${l.cout} XP${l.date?' du '+fmtDate(l.date):''}. Les XP sont rendus.</div><div class="actions"><button class="btn pri" data-act="dlgOk">Annuler la dernière saisie</button></div>`:'<div class="muted">Aucune saisie à annuler.</div>'}<div class="actions"><button class="btn" data-act="closeSheet">Fermer</button></div></div></div>`;
      return;}
    else if(g.kind==='b'){const c=S.chars[g.id],r=c&&ref(c,g.key);if(!r){S.dlg=null;root.innerHTML='';return;}const k=lvlCost(r.kind,g.from+1),dispo=summary(c,S.events).dispo;
      const named=r.kind==='atout'||r.kind==='spec',lab=named?(r.kind==='atout'?"un atout féerique":'une spécialité'):`${r.nom} ${g.from+1}`;
      const field=named?`<div class="field"><label for="dn">Nom de ${r.kind==='atout'?"l'atout":'la spécialité'}</label><input id="dn" type="text" data-dn="1" autocomplete="off" value="${esc(g.nom||'')}"></div>`:'';
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="alertdialog" aria-modal="true" aria-label="Confirmer l'achat"><div class="in"><div><h2>Acheter ${esc(lab)} ?</h2><div class="muted small">${esc(c.court)}</div></div>${field}${g.gain?`<div class="xpbox">Gain en jeu : le niveau monte sans dépense d'XP.</div><div class="field"><label for="gm">Motif (facultatif)</label><input id="gm" type="text" data-gm="1" value="${esc(g.motif||'')}" placeholder="ex. Bénédiction de la Dame du lac"></div><div class="field"><label for="sxs">Session (obligatoire)</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div><div class="actions"><button class="btn" data-act="gainOff">Retour</button><button class="btn pri" data-act="gainOk"${(named&&!(g.nom||'').trim())||!g.sess?' disabled':''}>Valider le gain</button></div>`:`<div class="calc"><span>Coût</span><b>${k} XP</b><span>Disponible</span><b>${dispo} XP</b><span>Après achat</span><b>${dispo-k} XP</b></div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="dlgOk"${(named&&!(g.nom||'').trim())||k>dispo?' disabled':''}>Acheter</button></div><div class="actions" style="margin-top:4px"><button class="btn ghost" data-act="gainOn">Gain en jeu (0 XP)</button></div>`}</div></div>`;
      return;}
    else{const e=S.events.find(x=>x.id===g.id);if(!e){S.dlg=null;root.innerHTML='';return;}titre='Supprimer « '+e.titre+' » ?';txt="Ce gain d'XP est retiré pour tous les personnages concernés.";}
    root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="alertdialog" aria-modal="true" aria-label="Confirmation"><div class="in"><h2>${esc(titre)}</h2><div class="muted">${esc(txt)}</div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn" style="background:var(--bad);border-color:var(--bad);color:#fff" data-act="dlgOk">Supprimer définitivement</button></div></div></div>`;
    return;
  }
  if(S.asheet){
    const a=S.asheet,c=S.chars[a.cid],x=c&&(c.achats||[]).find(y=>y.id===a.id);
    if(!x){S.asheet=null;root.innerHTML='';return;}
    const r=x.key?ref(c,x.key):null,canRev=!!r&&(r.o.cur||0)===x.to;
    const info=(x.key||'').startsWith('pp:')?`Annuler cette dépense rend ${esc(ppFmt(x.pp||0))} PP au profil ${esc(x.key.slice(3))}.`:(x.key||'').startsWith('autre:')?`Annuler cette dépense rend ${x.cout} XP.`:x.key?(canRev?`Annuler cet achat rend ${x.cout} XP et fait redescendre ${esc(r.nom)} de ${x.to} à ${x.from}.`:`Le niveau de cet élément a changé depuis l'achat : annuler rend seulement les XP. Corrige le niveau à la main si besoin.`):`Achat importé du tableur : annuler rend les XP, mais ne change pas le niveau sur la fiche. Corrige le niveau ensuite avec « Corriger le niveau ».`;
    root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Achat"><div class="in"><div><h2>Modifier l'achat</h2><div class="muted small">${esc(c.court)}</div></div>
      <div class="field"><label for="al">Libellé</label><input id="al" type="text" data-as="label" value="${esc(a.label)}"></div>
      <div class="frow" style="margin:0"><div class="field"><label for="ac">Coût (XP)</label><input id="ac" type="number" inputmode="numeric" min="0" data-as="cout" value="${esc(a.cout)}"></div><div class="field"><label for="ad">Date</label><input id="ad" type="date" data-as="date" value="${esc(a.date||'')}"></div></div>
      <div class="muted small">${info}</div>
      <div class="actions"><button class="btn pri" data-act="achatSave">Enregistrer</button>${a.confirm?`<button class="btn" style="color:var(--bad)" data-act="achatCancelOk">Confirmer l'annulation</button>`:`<button class="btn" data-act="achatCancel">Annuler l'achat</button>`}<button class="btn ghost" data-act="closeSheet">Fermer</button></div></div></div>`;
    return;
  }
  const sh=S.sheet;
  if(!sh){root.innerHTML='';return;}
  const c=S.chars[sh.id],r=c&&ref(c,sh.key);if(!r){S.sheet=null;root.innerHTML='';return;}
  const cur=r.o.cur||0,max=r.max,lb=lastBuy(c,sh.key);
  const acc=isAcc(c,sh.key);
  let body=`<div class="calc"><span>Niveau actuel</span><b>${cur+(acc?1:0)}${max!=null?' / '+(max+(acc?1:0)):''}</b></div>`;
  if(acc)body+=`<div class="muted small" style="margin-top:-4px">Base ${cur} / ${max}, +1 « ${esc(r.nom)} ${accW(r.nom)} » hors maximum. Le coût d'évolution se calcule sur la base${max!=null&&cur<max?` : passer à ${cur+1} (score réel ${cur+2}) coûte ${lvlCost('carac',cur+1)} XP`:''}.</div>`;
  let undoH='';
  if(lb){const refund=(lb.to-lb.from<=1)?(lb.cout||0):Math.min(lb.cout||0,lvlCost(r.kind,cur));
    undoH+=`<div class="muted small">Redescend ${esc(r.nom)} de ${cur} à ${cur-1} et rend ${refund} XP.</div><div class="actions"><button class="btn pri" data-act="undoLvl">Annuler le dernier achat</button></div>`;}
  else undoH+=`<div class="muted">Aucun achat à annuler pour cet élément.</div>`;
  if(r.kind==='fortune'&&FORTUNE[cur]){const f=FORTUNE[cur],nx=FORTUNE[cur+1];
    body+=`<div class="card" style="margin:0;padding:12px 14px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap"><b style="font-size:18px">${esc(f[0])}</b><span class="pill acc">${f[4]>0?'+'+f[4]:f[4]} en Classe et Entregent</span></div>
      <div class="ftab"><span>Revenu annuel</span><b>${esc(f[1])}&nbsp;F</b><span>Argent de poche</span><b>${frs(f[2])}</b><span>Argent disponible par mois</span><b>${frs(f[3])}</b></div>
      ${nx?`<div class="muted small fnext">Rang suivant : ${esc(nx[0])} · Revenu par mois ${frs(nx[3])} · Argent de poche ${frs(nx[2])}</div>`:''}</div>
      <div class="muted small">⚠ Dépenser plus de ${frs(f[3]*2)} (le double du mois) en moins de deux mois fait perdre un rang de Fortune.</div>`;}
  if(r.kind==='carac'&&(!ACCRU[c.race]||ACCRU[c.race].includes(r.nom)||acc)){const other=c.accru&&!acc?c.accru:null;
    body+=`<label style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;margin:6px 0${other?';opacity:.6':''}"><span><b>${esc(r.nom)} ${accW(r.nom)}</b><br><span class="muted small">${other?`Déjà accrue : ${esc(other)}. Une seule par personnage.`:'+1 au score, au-delà du maximum. Une seule par personnage.'}</span></span><input type="checkbox" data-acc="${esc(r.nom)}"${acc?' checked':''}${other?' disabled':''} style="width:22px;height:22px;accent-color:var(--accent)"></label>`;}
  body+=undoH;
  let fix=`<button class="btn ghost" data-act="fixToggle" style="align-self:flex-start">${sh.fix?'Masquer la correction':'Corriger le niveau'}</button>`;
  if(sh.fix)fix+=`<div class="frow" style="margin:0"><div class="field"><label for="fc">Niveau actuel</label><input id="fc" type="number" min="0" data-sh="fixCur" value="${esc(sh.fixCur)}"></div></div><div class="muted small">La correction ne dépense ni ne rend aucun XP.</div><div class="actions"><button class="btn" data-act="fixApply">Appliquer la correction</button></div>`;
  root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(r.nom)}"><div class="in"><div><h2>${esc(r.nom)}</h2><div class="muted small">${esc(c.court)}</div></div>${body}${fix}<div class="actions"><button class="btn" data-act="closeSheet">Fermer</button></div></div></div>`;
}
/* UX1 (28/11/2026) : menu « Plus » — identité, Joueurs, Règles, Paramètres (mode édition), Voir comme un joueur, thème, notifications, déconnexion */
function plusMenu(){const me=ME&&S.players[ME],dark=(document.documentElement.getAttribute('data-theme')||((window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'))==='dark';
  const sw=on=>`<span class="pmsw${on?' on':''}" aria-hidden="true"><i></i></span>`;
  const row=(act,ic,lab,extra,attrs)=>`<button type="button" class="pmrow" data-act="${act}"${attrs||''}>${ic||''}<span class="pml">${lab}</span>${extra||''}</button>`;
  const pk=pushOK()&&me&&typeof Notification!=='undefined'&&Notification.permission!=='denied';
  const role=me?(me.role==='MJ'?'MJ':hasGest(me)?'Gestion':S.visit?'Visiteur':'Joueur'):'';
  let h=`<div class="pmid">${me?`<span class="mepast big">${esc((me.nom||'?').charAt(0).toUpperCase())}</span><span class="pml"><b>${esc(me.nom)}</b><span class="muted small">${role}${S.visit?' · lecture seule':''}</span></span>`:'<span class="pml">Personne</span>'}<button type="button" class="lnk" data-act="meOpen">Changer</button></div>`;
  h+=row('tab',ICON.groupe,'Joueurs','',` data-v="players"${S.view==='players'?' aria-current="page"':''}`);
  h+=row('tab',ICON.de,'Règles','',` data-v="rules"${S.view==='rules'?' aria-current="page"':''}`);
  if(isTech())h+=canEdit()?row('tab',ICON.baguette,'Paramètres','',` data-v="params"${S.view==='params'?' aria-current="page"':''}`):`<div class="pmrow dis" aria-disabled="true">${ICON.baguette}<span class="pml">Paramètres</span><span class="muted small">mode édition requis</span></div>`;
  if(me&&isMJ(me)&&!S.visit)h+=S.asPlayer?row('asPlayerOff','','Revenir à ma vue (MJ)'):row('asPlayer','','Voir comme un joueur');
  h+=`<hr class="pmhr">`+row('themeToggle','','Thème sombre',sw(dark));
  if(pk)h+=row(S.pushSub?'pushOff':'pushOn','','Notifications',sw(!!S.pushSub));
  else if(pushOK()&&typeof Notification!=='undefined'&&Notification.permission==='denied')h+=`<div class="pmrow dis"><span class="pml">Notifications</span><span class="muted small">bloquées dans le navigateur</span></div>`;
  h+=row('logout','','Se déconnecter','',' style="color:var(--bad)"');
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet pmenu" role="dialog" aria-modal="true" aria-label="Plus"><div class="in">${h}</div></div>`;}
function render(){
  if(S.gate)return;
  if(typeof CA_BUSY!=='undefined'&&CA_BUSY&&Date.now()-CA_G.t0<4000){CA_PEND=true;return;} /* lot Cartes : pas de redessin pendant un geste sur la carte */
  if(S.caFull&&!(S.view==='univers'&&S.fi&&S.fiches[S.fi]&&S.fiches[S.fi].genre==='carte')){S.caFull=false;document.body.classList.remove('cafull');} /* écran du code : rien ne doit le remplacer */
  const cur=k=>S.view===k||(k==='team'&&(S.view==='sheet'||S.view==='crea'));
  if(S.edit&&(!isTech()||S.visit)){S.edit=false;S.rfEd=false;S.edQuit=false;}
  if(S.view==='params'&&!canEdit())S.view='home'; /* lot 4 bis : Paramètres seulement en mode édition */
  const tabs=[['home','Accueil'],['univers','Univers'],['team','Personnages'],['gains','XP'],['planning','Planning']]; /* UX1 : même structure partout */
  const nb=unseenProps(),ns=propBadge(),bdg=k=>k==='planning'&&nb?`<span class="bdg" aria-label="${nb} date${nb>1?'s':''} proposée${nb>1?'s':''} sans réponse">${nb}</span>`:k==='univers'&&ns?`<span class="bdg" aria-label="${ns} proposition${ns>1?'s':''} de découverte en attente">${ns}</span>`:'';
  const inMenu=S.view==='players'||S.view==='rules'||S.view==='params';
  document.getElementById('tabs').innerHTML=tabs.map(([k,l])=>`<button data-act="tab" data-v="${k}" aria-current="${cur(k)}">${l}${bdg(k)}</button>`).join('')+`<button data-act="menu" aria-current="${inMenu}" aria-haspopup="dialog" class="tabplus">Plus ▾</button>`;
  const bn=[['home','Accueil','maison'],['univers','Univers','livre'],['team','Personnages','masque'],['gains','XP','medaille'],['planning','Planning','calp']];
  document.getElementById('bnav').innerHTML=bn.map(([k,l,ic])=>`<button data-act="tab" data-v="${k}" aria-current="${cur(k)}" style="position:relative">${ICON[ic]||ICON.livre}<span>${l}</span>${bdg(k)}</button>`).join('')+
    `<button data-act="menu" aria-current="${inMenu}" aria-label="Plus : Joueurs, Règles, Paramètres, thème, identité" aria-haspopup="dialog">${ICON.menu}<span>Plus</span></button>`;
  {const h1a=document.querySelector('.brand h1 a');if(h1a&&h1a.textContent!=='La belle appli')h1a.textContent='La belle appli';}
  document.body.classList.toggle('edmode',canEdit());
  document.body.classList.toggle('home',S.view==='home');document.body.classList.toggle('crea',S.view==='crea'); /* lot C : assistant en plein écran */
  {const mb=document.getElementById('meBtn');if(mb&&mb.parentNode){let eb=document.getElementById('edBtn');const show=isTech()&&!S.visit;
    {let sb=document.getElementById('srBtn');if(!sb){sb=document.createElement('button');sb.type='button';sb.id='srBtn';sb.className='edbtn srbtn';sb.dataset.act='srOpen';sb.setAttribute('aria-label','Rechercher (Ctrl + K)');sb.title='Rechercher (Ctrl + K)';sb.innerHTML=SR_IC;mb.parentNode.insertBefore(sb,mb);}sb.classList.toggle('on',S.view==='srch');sb.hidden=!!S.gate;} /* recherche globale */
    if(!eb&&show){eb=document.createElement('button');eb.type='button';eb.id='edBtn';eb.className='edbtn';eb.dataset.act='editToggle';mb.parentNode.insertBefore(eb,mb);}
    if(eb){eb.hidden=!show;const on=!!S.edit;eb.classList.toggle('on',on);eb.setAttribute('aria-pressed',String(on));const lab=on?'Quitter le mode édition':'Passer en mode édition';eb.setAttribute('aria-label',lab);eb.title=lab;if(!eb.innerHTML)eb.innerHTML=ICON.crayon;}}}
  {const mb=document.getElementById('meBtn');if(mb){const me=ME&&S.players[ME];const html=me?`<span class="mepast">${esc((me.nom||'?').trim().charAt(0).toUpperCase())}</span>`:`${ICON.perso}`;if(mb.innerHTML!==html)mb.innerHTML=html;mb.dataset.act='menu';mb.setAttribute('aria-label',me?me.nom+' — menu Plus':'Choisir qui tu es');}}
  const ae=document.activeElement;
  if(ae&&ae.closest&&ae.closest('#app')&&/INPUT|SELECT|TEXTAREA/.test(ae.tagName)&&!S._force){S.dirty=true;renderSheet();return;}
  S._force=false;S.dirty=false;navSave();
  const v=S.view,app=document.getElementById('app');
  app.innerHTML=idBanners()+socleBanner()+navBar()+(S.asPlayer?`<div class="asplayer"><span>Vous voyez l'appli <b>comme un joueur</b></span><button class="btn ghost" data-act="asPlayerOff">Revenir</button></div>`:'')+(v==='home'?viewHome():v==='todo'?viewTodo():v==='team'?viewTeam():v==='sheet'?viewSheet():v==='gains'?viewGains():v==='univers'?viewUnivers():v==='players'?viewPlayers():v==='planning'?viewPlanning():v==='ref'?viewUnivers():v==='params'?viewParams():v==='crea'?viewCrea():v==='srch'?viewSrch():viewRules());
  renderSheet();
  hxTrack(); /* historique : une étape par écran (core.js) */
  {let q=document.getElementById('edqRoot');if(!q){q=document.createElement('div');q.id='edqRoot';document.body.appendChild(q);}const qh=S.edQuit?edQuitSheet():'';if(q.innerHTML!==qh)q.innerHTML=qh;}
  if(S.secHl){const k=S.secHl.k,el=document.getElementById(k==='titre'||k==='bonus'?'seck-titre':'secel-'+k+'-'+S.secHl.i)||document.getElementById('seck-'+k);if(el){el.classList.add('hlx');requestAnimationFrame(()=>el.scrollIntoView({block:'center'}));}}
  const w=whoGate();let wr=document.getElementById('whoRoot');if(!wr){wr=document.createElement('div');wr.id='whoRoot';document.body.appendChild(wr);}if(wr.innerHTML!==w)wr.innerHTML=w;
}

