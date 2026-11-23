/* La belle appli — accueil, « Qui es-tu ? », notifications, fenêtres et rendu */
/* ---------- Accueil ---------- */
function viewHome(){
  const V=validDates()[0],np=openProps().length;
  const tile=(v,ic,l)=>`<button class="htile" data-act="tab" data-v="${v}"><span class="hic">${ICON[ic]}</span><span class="hl">${l}</span></button>`;
  return `<div class="home-in"><button class="htile hplan" data-act="tab" data-v="planning" data-pv="com"><span class="hic" style="position:relative">${ICON.calp}${unseenProps()?`<span class="bdg">${unseenProps()}</span>`:''}</span><span class="ht"><span class="hl">Planning</span><span class="muted small">${V?'Prochaine partie validée':'Prochaine partie'}</span><b>${V?dLine(V):'Aucune partie validée'}</b>${V?`<span class="muted small">${esc(V.type||'Scénario')}${np?' · '+np+' date'+(np>1?'s':'')+' proposée'+(np>1?'s':'')+' en attente':''}</span>`:np?`<span class="muted small">${np} date${np>1?'s':''} proposée${np>1?'s':''} en attente</span>`:''}</span></button>
  <div class="hgrid">${tile('gains','medaille','XP')}${tile('team','masque','Personnages')}${tile('univers','livre','Univers')}</div>
  <div class="card hmsg">La belle appli est une application pour aider la gestion des éléments ludiques des Héritiers. Elle vient en complément des éléments de lore présents sur le <a href="${KANKA_URL}" target="_blank" rel="noopener">Kanka</a>, qui reste la référence pour le contenu de nos belles aventures.</div>
  <div class="hlinks"><button class="btn ghost" data-act="tab" data-v="players">Joueurs</button><button class="btn ghost" data-act="tab" data-v="rules">Règles</button><button class="btn ghost" data-act="tab" data-v="params">Paramètres</button></div></div>`;
}
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
const refuse=()=>{S._errScroll=true;};
function renderSheet0(){
  const root=document.getElementById('sheetRoot');
  {const ae0=document.activeElement;if(S.dlg&&(S.dlg.kind==='b'||S.dlg.kind==='a'||S.dlg.kind==='sx'||S.dlg.kind==='se'||S.dlg.kind==='ca'||S.dlg.kind==='ce'||S.dlg.kind==='sn'||S.dlg.kind==='sm'||S.dlg.kind==='pd'||S.dlg.kind==='pp2'||S.dlg.kind==='rv')&&ae0&&(ae0.id==='dn'||ae0.id==='dp'||ae0.id==='sxt'||ae0.id==='rvt'||ae0.id==='crn'||ae0.id==='sdi'||ae0.id==='pdn'||ae0.id==='pdd')&&root.contains(ae0))return;}
  if(S.dlg){
    const g=S.dlg;let titre='',txt='';
    if(g.kind==='menu'){root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Menu"><div class="in"><div class="menulist"><button data-act="tab" data-v="players"${S.view==='players'?' aria-current="page"':''}>${ICON.groupe}Joueurs</button><button data-act="tab" data-v="rules"${S.view==='rules'?' aria-current="page"':''}>${ICON.de}Règles</button>${canEdit()?`<button data-act="tab" data-v="params"${S.view==='params'?' aria-current="page"':''}>${ICON.baguette}Paramètres</button>`:''}</div><div class="actions"><button class="btn" data-act="closeSheet">Fermer</button></div></div></div>`;return;}
    if(g.kind==='pd'){root.innerHTML=dateSheet(g);return;}
    if(PF_KINDS.has(g.kind)){const html=pfSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='me'){root.innerHTML=idSheet();return;}
    if(SH_DLG.has(g.kind)){const html=shDlgSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='cons'){const html=consSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='elEdit'||g.kind==='pwPick'){const html=g.kind==='elEdit'?elEditSheet(g):pwPickSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='pl'||g.kind==='pc'||g.kind==='newp'||g.kind==='newc'){const html=g.kind==='pl'?plSheet(g):g.kind==='pc'?pcSheet(g):g.kind==='newp'?newPSheet():newCSheet();if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='ne'){const e=sessById(g.id);if(!e){S.dlg=null;root.innerHTML='';return;}
      let body;
      if(g.one){const tg=orderPJ(natTargets(e,g.n));body=`<div class="field"><label for="ne-m">XP par personnage</label><input id="ne-m" type="number" inputmode="numeric" min="0" data-nem="1" value="${esc(g.m)}" placeholder="0"></div>
        <div class="muted small">${g.n==='Scénario'?'Pour les PJ présents':'Pour'} : ${tg.filter(i=>vis(S.chars[i])).map(i=>esc(S.chars[i].court)).join(', ')||'aucun PJ'}.${g.mixed?' Les montants actuels diffèrent : enregistrer alignera tout le monde sur ce montant.':''} Mets 0 pour retirer cette nature de la session.</div>`;}
      else body=natList(e,g).map(i=>`<div class="ped"><label for="ne-${i}">${esc(S.chars[i].court)}</label><input id="ne-${i}" type="number" inputmode="numeric" min="0" data-nv="${i}" value="${g.vals[i]?g.vals[i]:''}" placeholder="0"></div>`).join('')+`<div class="muted small">PJ présents à la session. Mets 0 ou laisse vide pour retirer le gain d'un personnage.</div>`;
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Modifier ${esc(g.n)}"><div class="in"><div><h2>${esc(g.n)}</h2><div class="muted small">${esc(e.titre)}</div></div>
      ${body}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="natSave">Enregistrer</button></div></div></div>`;return;}
    if(g.kind==='ptr'){const c=S.chars[g.cid],ill=/^ill-/.test(g.cid);if(!c&&!ill){S.dlg=null;root.innerHTML='';return;}const s2=g.base*g.z;
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${ill?'Illustration':'Portrait'}"><div class="in"><div><h2>${ill?'Illustration'+(g.lab?' : '+esc(g.lab):''):'Portrait de '+esc(c.court)}</h2><div class="muted small">Fais glisser l'image pour la cadrer dans le ${ill?'carré':'cercle'}, et zoome avec le curseur.</div></div>
      <div id="ptrStage"><img id="ptrImg" src="${g.src}" alt="" style="left:${g.x}px;top:${g.y}px;width:${g.w*s2}px;height:${g.h*s2}px"><div class="ring${ill?' sq':''}"></div></div>
      <div class="field"><label for="ptrz">Zoom</label><input id="ptrz" type="range" min="1" max="4" step="0.01" data-ptrz="1" value="${g.z}" style="width:100%"></div>
      <div class="muted small">L'image est recadrée et réduite (environ 30 Ko) avant l'envoi.</div>
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
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Session de jeu"><div class="in"><h2>${g.kind==='sn'?'Nouvelle session de jeu':'Modifier la session'}</h2>
      <div class="field"><label for="sdt">Type</label><select id="sdt" data-sd="type">${TYPES.map(t=>`<option${t===g.type?' selected':''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label for="sdi">Intitulé</label><input id="sdi" type="text" data-sd="titre" autocomplete="off" placeholder="ex. S14. Titre du scénario" value="${esc(g.titre)}"></div>
      <div class="field"><label for="sdd">Date</label><input id="sdd" type="date" data-sd="date" value="${esc(g.date)}"></div>
      <div class="field"><label>PJ présents</label><div class="chips" style="flex-wrap:wrap;overflow:visible">${orderPJ([...new Set([...pjIds().filter(i=>actif(S.chars[i])),...(g.pj||[])])]).map(i=>`<button class="chip" data-act="sdPj" data-id="${i}" aria-pressed="${(g.pj||[]).includes(i)}">${esc(S.chars[i].court)}</button>`).join('')}</div><div class="muted small" style="margin-top:4px">L'XP de Scénario va aux PJ présents ; l'Individuel se choisit parmi eux.</div></div>
      ${g.kind==='sn'?'<div class="muted small">La nouvelle session devient la session proposée par défaut pour l\'XP, les secrets et les races.</div>':kids?`<div class="muted small">Suppression impossible : ${kids} découverte${kids>1?'s sont rattachées':' est rattachée'} à cette session. Change d'abord leur session ou retire-les.</div>`:g.confirm?'<div class="muted small">La session et l\'XP saisie dedans seront supprimées pour tous les personnages.</div>':''}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button>${g.kind==='sm'?(g.confirm?`<button class="btn" style="color:var(--bad)" data-act="sessDelOk">Confirmer la suppression</button>`:`<button class="btn" data-act="sessDel"${kids?' disabled':''}>Supprimer</button>`):''}<button class="btn pri" data-act="${g.kind==='sn'?'sessCreate':'sessSave'}"${g.titre.trim()?'':' disabled'}>${g.kind==='sn'?'Créer la session':'Enregistrer'}</button></div></div></div>`;return;}
    if(g.kind==='ca'||g.kind==='ct'||g.kind==='ce'){const html=creSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='eye'){const html=g.t==='sec'?eyeSecSheet(g):eyeRaceSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='pp2'||g.kind==='rv'){const html=g.kind==='pp2'?propSheet(g):revSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='sx'||g.kind==='se'){const html=secSheet(g);if(!html){S.dlg=null;root.innerHTML='';return;}root.innerHTML=html;return;}
    if(g.kind==='c'){const c=S.chars[g.id];if(!c){S.dlg=null;root.innerHTML='';return;}titre='Supprimer '+c.court+' ?';txt="La fiche, les achats et les gains de ce personnage seront supprimés définitivement. Pour garder l'historique, passe plutôt son statut à « Décédé » ou « Retiré ».";}
    else if(g.kind==='p'){const p=S.players[g.id];if(!p){S.dlg=null;root.innerHTML='';return;}titre='Supprimer '+p.nom+' ?';txt="Le joueur disparaît de la liste. Ses personnages ne sont pas supprimés.";}
    else if(g.kind==='a'){const c=S.chars[g.id];if(!c){S.dlg=null;root.innerHTML='';return;}const dispo=summary(c,S.events).dispo,p=Math.floor(+g.pts)||0,ok=p>=1&&p<=dispo;
      root.innerHTML=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Dépenser des XP"><div class="in"><div><h2>Dépenser en ${esc(autreLab(g.nom))}</h2><div class="muted small">${esc(c.court)}</div></div>${g.nom==='PNJ'&&pnjOf(c).length>1?`<div class="field"><label for="dpn">PNJ</label><select id="dpn" data-dpn="1"><option value="">— choisir —</option>${pnjOf(c).map(x=>`<option value="${x.id}"${g.pnj===x.id?' selected':''}>${esc(x.court)}</option>`).join('')}</select></div>`:''}<div class="field"><label for="dp">XP à ${g.nom==='Triche'?'dépenser':'transférer'}</label><input id="dp" type="number" inputmode="numeric" min="1" data-dp="1" autocomplete="off" value="${esc(g.pts)}"></div>${(()=>{if(g.nom==='PNJ'){const L=pnjOf(c),pn=L.length===1?L[0]:S.chars[g.pnj];return pn?`<div class="xpbox" id="dxfer">→ <span data-xn>${p||'…'}</span> XP transférés à ${esc(pn.court)} (ajoutés à son compteur).</div>`:'<div class="muted small">Choisis le PNJ qui reçoit les XP.</div>';}if(g.nom==='Domaine')return `<div class="xpbox">→ <span data-xn>${p||'…'}</span> XP transférés au domaine (à rattacher à sa fiche quand elle existera).</div>`;return '';})()}<div class="calc"><span>Disponible</span><b>${dispo} XP</b><span>Après dépense</span><b id="dafter">${dispo-p} XP</b></div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="dlgOk"${ok&&(g.nom!=='PNJ'||pnjOf(c).length===1||g.pnj)?'':' disabled'}>${g.nom==='Triche'?'Dépenser':'Transférer'}</button></div></div></div>`;
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
function render(){
  if(S.gate)return; /* écran du code : rien ne doit le remplacer */
  const cur=k=>S.view===k||(k==='team'&&S.view==='sheet');
  if(S.edit&&(!isGest()||S.visit)){S.edit=false;S.rfEd=false;S.edQuit=false;}
  if(S.view==='params'&&!canEdit())S.view='home'; /* lot 4 bis : Paramètres seulement en mode édition */
  const tabs=[['gains','XP'],['team','Personnages'],['univers','Univers'],['planning','Planning'],['players','Joueurs'],['rules','Règles'],['params','Paramètres']].filter(t=>t[0]!=='params'||canEdit());
  const nb=unseenProps(),ns=propBadge(),bdg=k=>k==='planning'&&nb?`<span class="bdg" aria-label="${nb} date${nb>1?'s':''} proposée${nb>1?'s':''} sans réponse">${nb}</span>`:k==='univers'&&ns?`<span class="bdg" aria-label="${ns} proposition${ns>1?'s':''} de découverte en attente">${ns}</span>`:'';
  document.getElementById('tabs').innerHTML=tabs.map(([k,l])=>`<button data-act="tab" data-v="${k}" aria-current="${cur(k)}">${l}${bdg(k)}</button>`).join('');
  const bn=[['gains','XP','medaille'],['team','Personnages','masque'],['univers','Univers','livre'],['planning','Planning','calp']];
  const inMenu=S.view==='players'||S.view==='rules'||S.view==='params';
  document.getElementById('bnav').innerHTML=bn.map(([k,l,ic])=>`<button data-act="tab" data-v="${k}" aria-current="${cur(k)}" style="position:relative">${ICON[ic]}<span>${l}</span>${bdg(k)}</button>`).join('')+
    `<button data-act="menu" aria-current="${inMenu}" aria-label="Menu : Joueurs, Règles, Paramètres" aria-haspopup="dialog">${ICON.menu}<span aria-hidden="true">&nbsp;</span></button>`;
  document.body.classList.toggle('home',S.view==='home');
  {const mb=document.getElementById('meBtn');if(mb&&mb.parentNode){let eb=document.getElementById('edBtn');const show=isGest()&&!S.visit;
    if(!eb&&show){eb=document.createElement('button');eb.type='button';eb.id='edBtn';eb.className='edbtn';eb.dataset.act='editToggle';mb.parentNode.insertBefore(eb,mb);}
    if(eb){eb.hidden=!show;const on=!!S.edit;eb.classList.toggle('on',on);eb.setAttribute('aria-pressed',String(on));const lab=on?'Quitter le mode édition':'Passer en mode édition';eb.setAttribute('aria-label',lab);eb.title=lab;if(!eb.innerHTML)eb.innerHTML=ICON.crayon;}}}
  {const mb=document.getElementById('meBtn');if(mb){const me=ME&&S.players[ME];const lab=me?esc(me.nom):'Qui es-tu ?';const html=`${ICON.perso}<span>${lab}</span>`;if(mb.innerHTML!==html)mb.innerHTML=html;mb.setAttribute('aria-label',me?'Connecté en tant que '+me.nom+', changer de joueur':'Choisir qui tu es');}}
  const ae=document.activeElement;
  if(ae&&ae.closest&&ae.closest('#app')&&/INPUT|SELECT|TEXTAREA/.test(ae.tagName)&&!S._force){S.dirty=true;renderSheet();return;}
  S._force=false;S.dirty=false;navSave();
  const v=S.view,app=document.getElementById('app');
  app.innerHTML=idBanners()+socleBanner()+(canEdit()?`<div class="edband" role="status">${ICON.crayon}<span>Mode édition actif : les modifications sont enregistrées pour toute la table</span></div>`:'')+navBar()+(S.asPlayer?`<div class="asplayer"><span>Vous voyez l'appli <b>comme un joueur</b></span><button class="btn ghost" data-act="asPlayerOff">Revenir</button></div>`:'')+(v==='home'?viewHome():v==='team'?viewTeam():v==='sheet'?viewSheet():v==='gains'?viewGains():v==='univers'?viewUnivers():v==='players'?viewPlayers():v==='planning'?viewPlanning():v==='ref'?viewUnivers():v==='params'?viewParams():viewRules());
  renderSheet();
  {let q=document.getElementById('edqRoot');if(!q){q=document.createElement('div');q.id='edqRoot';document.body.appendChild(q);}const qh=S.edQuit?edQuitSheet():'';if(q.innerHTML!==qh)q.innerHTML=qh;}
  if(S.secHl){const k=S.secHl.k,el=document.getElementById(k==='titre'||k==='bonus'?'seck-titre':'secel-'+k+'-'+S.secHl.i)||document.getElementById('seck-'+k);if(el){el.classList.add('hl');requestAnimationFrame(()=>el.scrollIntoView({block:'center'}));}}
  const w=whoGate();let wr=document.getElementById('whoRoot');if(!wr){wr=document.createElement('div');wr.id='whoRoot';document.body.appendChild(wr);}if(wr.innerHTML!==w)wr.innerHTML=w;
}

