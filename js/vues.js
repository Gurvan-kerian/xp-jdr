/* La belle appli — vues : XP, personnages, joueurs, règles */
/* --- vues --- */
const kankaBtn=()=>''; /* UX1 : liens Kanka retirés de l'affichage (identifiants gardés en base) */
/* ---------- UX1 (28/11/2026) : liste des personnages ---------- */
function teamStage(c){const p=rangInfo(c);if(!p||p.done||!actif(c))return '';return `<span class="muted small">${esc(p.next)}${p.blocked?' : hors de portée':p.ready?' : pouvoir à acquérir':' dans '+p.total+' XP'}</span>`;}
/* Correctif recette lot 1 (28/11) : titre de profil le plus proche (XP pour atteindre 22 points de compétences, PP manquants) */
function titrePath(c,pr){if(c.type!=='PJ'||ppBought(c).some(a=>a.ppel.id==='titre:'+pr.nom))return null;
  const cs=(pr.comps||[]).map(x=>({nom:x.nom,cur:x.cur||0,max:x.max,from:x.cur||0,k:0}));let sum=cs.reduce((t,x)=>t+x.cur,0),cost=0;
  while(sum<PPT_PTS){let b=null;for(const x of cs){if(x.max!=null&&x.cur>=x.max)continue;const k=lvlCost('comp',x.cur+1);if(!b||k<b.k)b={x,k};}if(!b)return null;cost+=b.k;b.x.k+=b.k;b.x.cur++;sum++;}
  return{prof:pr.nom,nom:prOf(pr.nom).titre.nom,cost,pp:Math.max(0,PPT_COST-ppHave(pr)),have:ppHave(pr),steps:cs.filter(x=>x.cur>x.from)};}
function titreBest(c){let b=null;for(const pr of c.profils||[]){const t=titrePath(c,pr);if(t&&(!b||t.cost<b.cost||(t.cost===b.cost&&t.pp<b.pp)))b=t;}return b;}
function titreTxt(t){return t.cost?`dans ${t.cost} XP${t.pp?' + '+ppFmt(t.pp)+' PP':''}`:t.pp?`: il manque ${ppFmt(t.pp)} PP`:': à acheter';}
function teamTitre(c){if(!actif(c))return '';const t=titreBest(c);return t?`<span class="muted small">${esc(t.nom)} ${esc(titreTxt(t))}</span>`:'';}
function titreBlock(c){const t=titreBest(c);if(!t)return '';const k=c.id+'|titre',open=!!(S.rkOpen&&S.rkOpen[k]);
  let h=`<button class="goal" data-act="rkOpen" data-k="${esc(k)}" aria-expanded="${open}"><span><b>${esc(t.nom)}</b> ${esc(titreTxt(t))} ›</span><span class="gg">${esc(profLab(t.prof,c))} ${open?'▴':'▾'}</span></button>`;
  if(!open)return h;
  h+=`<div class="card goald">${t.steps.length?`<ul class="rkpath" style="margin-left:0;list-style:none">${t.steps.map(x=>`<li style="display:flex;justify-content:space-between;gap:8px"><span>${esc(x.nom)} ${x.from} → ${x.cur}</span><span class="num">${x.k} XP</span></li>`).join('')}</ul>`:''}
  <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)"><span>Points de compétences</span><b class="num">${PPT_PTS} / ${PPT_PTS}${t.cost?' · '+t.cost+' XP':''}</b></div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span>PP ${esc(profLab(t.prof,c))} : ${esc(ppFmt(t.have))} / ${PPT_COST}</span><button type="button" class="lnk" data-act="ppOpen" data-prof="${esc(t.prof)}">Achats en PP ›</button></div></div>`;
  return h;}
function teamCard(c){
  const s=summary(c,S.events),off=!actif(c),img=portrait(c),o=owners(c);
  const sub=[c.race,rangOf(c),o.length?o.map(p=>p.nom).join(', '):''].filter(Boolean).map(esc).join(' · ');
  const fe=off?'':pnjOf(c).filter(vis).map(f=>`<button type="button" class="tfeal" data-act="sel" data-id="${f.id}"><span>Féal · ${esc(f.court)}</span><span class="muted small">${summary(f,S.events).dispo} XP</span></button>`).join('');
  return `<div class="tcw"><button type="button" class="tcard${off?' off':''}" data-act="sel" data-id="${c.id}"><span class="tph">${img?`<img src="${img}" alt="">`:`<span class="ini">${esc((c.court||'?').slice(0,1))}</span>`}</span><span class="tmain"><span class="nm">${esc(c.court)}</span><span class="muted small">${sub}${c.cache?' · masqué aux autres':''}${off?' · '+esc(STATUTS[c.statut]||''):''}</span>${off?'':`<span class="tpl">${teamStage(c)}</span>${teamTitre(c)}`}</span><span class="txp"><b class="num">${s.dispo}</b><small>XP</small></span></button>${fe}</div>`;}
function cwCard(b){const I=(b.d||{}).ident||{},st=crSteps(b),n=Math.min(b.etape||0,st.length-1),own=S.players[b.par];
  return `<div class="tcw"><button type="button" class="tcard" data-act="cwOpen" data-id="${esc(b.id)}"><span class="tph"><span class="ini">+</span></span><span class="tmain"><span class="nm">${esc((I.court||'').trim()||(b.kind==='feal'?'Nouveau féal':'Nouveau PJ'))} <span class="pill ${b.statut==='attente'?'acc':'plan'}">${b.statut==='attente'?'En attente':'Brouillon'}</span></span><span class="muted small">${b.kind==='feal'?'Féal':'PJ'}${b.d&&b.d.race?' · '+esc(b.d.race):''} · étape ${n+1} / ${st.length}${isTech()&&own?' · par '+esc(own.nom):''}</span>${b.com&&b.statut==='brouillon'?`<span class="small bad">Renvoyé par le MJ</span>`:''}</span></button><button type="button" class="lnk cwtdel" data-act="cwDelAsk" data-id="${esc(b.id)}" aria-label="Supprimer le brouillon">Supprimer</button></div>`;}
function heritageRow(){const n=starCount(S.events);return `<button type="button" class="crow hrrow" data-act="herOpen"><span class="cmain"><span class="t">Rang d'héritage ${esc(S.heritage.score||'–')}</span></span><span class="hst">★ ${n} / ${STARS}</span><span class="chev" aria-hidden="true">›</span></button>`;}
function heritageSheet(){const n=starCount(S.events);let st='';for(let i=1;i<=STARS;i++)st+=`<span class="star${i<=n?' on':''}" aria-hidden="true">${i<=n?'★':'☆'}</span>`;
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Rang d'héritage"><div class="in"><div class="blkhd"><h2 style="flex:1;margin:0">Rang d'héritage</h2><button type="button" class="ibtn sm" data-act="closeSheet" aria-label="Fermer">✕</button></div>
  <div class="field"><label for="hs">Score</label><input id="hs" type="number" inputmode="numeric" data-her="score" value="${esc(S.heritage.score)}"${isTech()?'':' disabled'} style="max-width:120px"></div>
  <div class="stars" role="img" aria-label="${n} étoiles sur ${STARS}">${st}</div><div class="muted small" style="margin-top:6px">Une étoile par événement Scénario joué, ${STARS} au maximum.</div></div></div>`;}
function viewTeam(){
  if(S.teamSel==='pnj'){S.teamSel='pj';S.view='univers';S.uni='pnj';return viewUnivers();} /* UX1 : liste des PNJ déplacée dans l'Univers */
  if(!ids().length&&!(ME&&S.players[ME]&&!S.visit))return emptyState();
  const P=pjIds().filter(i=>vis(S.chars[i])),act=P.filter(i=>actif(S.chars[i])),arc=P.filter(i=>!actif(S.chars[i]));
  const al=L=>L.slice().sort((a,b)=>(S.chars[a].court||'').localeCompare(S.chars[b].court||'','fr'));
  const can=ME&&S.players[ME]&&!S.visit;
  let h=`<div class="pghead"><h2>Personnages</h2>${can?`<button type="button" class="pbtn big" data-act="teamNew" aria-label="Nouveau personnage">+</button>`:''}</div>`;
  h+=`<section class="card xpsec">${heritageRow()}</section>`;
  const B=cwList();
  if(isTech()){h+=`<div class="tgrid">${al(act).map(i=>teamCard(S.chars[i])).join('')}${B.map(cwCard).join('')}</div>`;}
  else{const mine=act.filter(i=>ME&&owners(S.chars[i]).some(p=>p.id===ME)),oth=al(act.filter(i=>!mine.includes(i))),mb=B.filter(b=>b.par===ME);
    if(mine.length||mb.length)h+=`<h3 class="tgh">Mes personnages</h3><div class="tgrid">${mine.map(i=>teamCard(S.chars[i])).join('')}${mb.map(cwCard).join('')}</div>`;
    if(oth.length)h+=`<h3 class="tgh">La troupe</h3><div class="tgrid">${oth.map(i=>teamCard(S.chars[i])).join('')}${B.filter(b=>b.par!==ME).map(cwCard).join('')}</div>`;}
  if(arc.length)h+=`<h3 class="tgh">Archives</h3><div class="tgrid">${al(arc).map(i=>teamCard(S.chars[i])).join('')}</div>`;
  return h;
}
function teamNewSheet(){return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Nouveau personnage"><div class="in"><div class="blkhd"><h2 style="flex:1;margin:0">Nouveau personnage</h2><button type="button" class="ibtn sm" data-act="closeSheet" aria-label="Fermer">✕</button></div>
  <button type="button" class="crow" data-act="cwNew" data-v="pj"><span class="cmain"><span class="t">Personnage joueur</span><span class="s">Assistant de création</span></span><span class="chev" aria-hidden="true">›</span></button>
  <button type="button" class="crow" data-act="cwNew" data-v="feal"><span class="cmain"><span class="t">Féal</span><span class="s">Rattaché à un de tes PJ</span></span><span class="chev" aria-hidden="true">›</span></button></div></div>`;}
function emptyState(){
  const msg=S.sync==='local'?"Les données sont partagées par la base du groupe, qui n'est pas accessible depuis cette vue. Ouvre la page depuis claude.ai avec ton compte.":S.ready?"Aucun personnage visible pour l'instant. Tu peux en créer un dans l'onglet Joueurs.":"Chargement des personnages…";
  return `<div class="card empty">${esc(msg)}</div>`;
}
const PORTRAITS=['kerian','maral','massetoc','rowen','sloan','theodule'];
function portrait(c){if(S.ptr&&c&&S.ptr[c.id])return S.ptr[c.id];const k=String(c.court||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');return PORTRAITS.includes(k)?'portraits/'+k+'.jpg':null;}
/* Pictogrammes des valeurs dérivées (nom complet en infobulle) */
const DER_ICO={'PdV':'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
'Esquive':'<circle cx="15.5" cy="4" r="2"/><path d="M10 21l3-6 3 2v4"/><path d="M13 15l1.5-6 3.5 3 3 .5"/><path d="M14.5 9L11 10l-2 3"/><path d="M2.5 9h4M1.5 12.5h4.5M2.5 16h4"/>',
'Parade':'<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/>',
'Résistance physique':'<path d="M3 12h18"/><rect x="4" y="8" width="3" height="8" rx="1"/><rect x="17" y="8" width="3" height="8" rx="1"/><path d="M2 10v4M22 10v4"/>',
'Résistance psychique':'<path d="M12 5a3 3 0 0 0-5.6 1.4A3 3 0 0 0 4 10a3 3 0 0 0 1.5 4.6A3 3 0 0 0 9 19a3 3 0 0 0 3-2z"/><path d="M12 5a3 3 0 0 1 5.6 1.4A3 3 0 0 1 20 10a3 3 0 0 1-1.5 4.6A3 3 0 0 1 15 19a3 3 0 0 1-3-2z"/><path d="M12 5v12"/>',
'Initiative':'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
'Base mêlée':'<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/><path d="M9.5 6.5L13 3h3v3l-3.5 3.5"/><path d="M5 14l-1.5 1.5"/>',
'Base tir':'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>'};
const derIco=n=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DER_ICO[n]||''}</svg>`;
/* « Achetable maintenant » : la ligne peut-elle être achetée avec le dispo ? */
function canBuyKey(c,key,dispo){const r=ref(c,key);if(!r)return false;const cu=r.o.cur||0;if(r.max!=null&&cu>=r.max)return false;if(r.kind==='art'&&aoGate(c,key,cu+1))return false;return lvlCost(r.kind,cu+1)<=dispo;}
const GSHORT={'Féerie':'Féerie','Une caractéristique':'Caract.','Une compétence':'Comp.','Atouts féeriques':'Atouts'};
function goalBlock(c,s){const p=rangInfo(c);if(!p)return '';const open=!!(S.goalOpen&&S.goalOpen[c.id]);
  if(p.done)return `<div class="goal done"><b>Rang Légendaire</b> · atteint</div>`;
  const sum=p.gauges.map(g=>{const ok=g.cost===0&&g.cur>=g.target;return `${GSHORT[g.label]||g.label} ${ok?'✓':g.cur+'/'+g.target}`;}).join(' · ');
  const etat=p.blocked?'maximum trop bas':p.ready?'Acquérir le pouvoir '+p.next.toLowerCase():p.total+' XP restants';
  let h=`<button class="goal${p.ready?' ready':''}" data-act="goalToggle" data-id="${esc(c.id)}" aria-expanded="${open}"><span><b>Rang ${esc(p.next)}</b> ${p.blocked?'· '+etat:p.ready?'· '+etat:'dans '+p.total+' XP'} ›</span><span class="gg">${esc(sum)} ${open?'▴':'▾'}</span></button>`;
  if(!open)return h;
  h+=`<div class="card goald"><div class="muted small" style="margin-bottom:6px">${p.ready?`Les quatre critères sont réunis : il reste à acquérir le pouvoir ${p.next.toLowerCase()} (Capacités féeriques › Féerie). Le MJ le dévoile.`:'Il faut réunir les quatre critères.'}</div>`+p.gauges.map(g=>{const done=g.cost===0&&g.cur>=g.target;
    return `<div class="gauge${done?' done':''}"><span>${esc(g.label)}${g.via?`<br><span class="muted small">le moins cher : ${esc(g.via)}</span>`:''}</span>${bar(g.cur,g.target)}<span class="lv">${g.cur}<small>/${g.target}</small> <span class="pill ${done?'good':g.blocked?'bad':''}">${done?'OK':g.blocked?'max trop bas':g.cost+' XP'}</span></span></div>`;}).join('');
  if(!p.ready){h+=`<div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)"><b>Total restant</b><b class="num">${p.blocked?'—':p.total+' XP'}</b></div>`;
    if(!p.blocked)h+=`<div class="muted small">${p.total<=s.dispo?'Finançable avec les XP disponibles.':'Il manque '+(p.total-s.dispo)+' XP par rapport au solde disponible.'}</div>`;}
  return h+`</div>`;}
function viewSheet(){
  if(!ids().length)return emptyState();
  const id=S.sel&&S.chars[S.sel]&&vis(S.chars[S.sel])?S.sel:ids()[0];S.sel=id;const c=S.chars[id],s=summary(c,S.events);
  if(c.type==='PNJ')return (isFeal(c)?shHead(c,s):pnSheetHead(c,s))+pnSheetBody(c,s,id); /* UX1 : le féal prend l'en-tête du PJ ; lot 4 : fiche PNJ (fiches.js) */
  let h=shHead(c,s);
  const tab=shTabOf(c);
  h+=shTabsBar(c,tab);
  if(tab!=='prog')return h+viewSheetTab(c,tab);
  return h+viewProg(c,s,id);}
/* UX1 (28/11/2026) : en-tête commun des fiches PJ et féal */
function shPickList(id){const L=pjIds().filter(i=>vis(S.chars[i])&&actif(S.chars[i])).concat(ids().filter(i=>isFeal(S.chars[i])&&vis(S.chars[i])).sort((a,b)=>(S.chars[a].court||'').localeCompare(S.chars[b].court||'','fr')));
  return `<div class="shpick card">${L.map(i=>{const c=S.chars[i],img=portrait(c);return `<button type="button" class="shpk" data-act="sel" data-id="${i}" aria-pressed="${i===id}"><span class="tph">${img?`<img src="${img}" alt="">`:`<span class="ini">${esc((c.court||'?').slice(0,1))}</span>`}</span><span class="small">${esc(c.court)}</span></button>`;}).join('')}</div>`;}
function shHead(c,s){const id=c.id,im=portrait(c),inner=im?`<img src="${im}" alt="">`:`<span class="ini">${esc((c.court||'?').slice(0,1))}</span>`,fe=c.type==='PNJ';
  let h=`<div class="shtop">${crumb(['Personnages','data-act="tab" data-v="team"'])}<button type="button" class="shpkb" data-act="shPick" aria-expanded="${!!S.shPick}" aria-label="Changer de personnage"><span class="tph sm">${inner}</span>▾</button><span style="flex:1"></span>${isGest()?`<button type="button" class="ibtn del" data-act="cDel" data-id="${id}" aria-label="Supprimer ${esc(c.court)}">${ICON.corbeille}</button>`:''}</div>`;
  if(S.shPick)h+=shPickList(id);
  const idm=!fe&&!isHum(c)&&S.forme==='m'&&(c.idm||'').trim(),o=owners(c);
  const sub=fe?[raceLk(c),esc(rangOf(c)),'féal de '+lk({t:'perso',id:c.pj},S.chars[c.pj].court)]:[c.race?raceLk(c):'',esc(rangOf(c)),natfOf(c)?esc(NATF[natfOf(c)]):'',o.length?esc(o.map(p=>p.nom).join(', ')):''];
  h+=`<div class="shid">${canPortrait(c)?`<label class="shmed ed" aria-label="Changer le portrait de ${esc(c.court)}">${inner}<span class="pen" aria-hidden="true">✎</span><input type="file" accept="image/*" data-ptrfile="${esc(id)}" hidden></label>`:`<span class="shmed">${inner}</span>`}
    <div class="shidt"><div class="shname"><span>${esc(idm||c.nom||c.court)}</span>${canEditC(c)?`<button type="button" class="ibtn sm" data-act="pcOpen" data-id="${id}" data-sh="1" aria-label="Modifier l'identité">${ICON.crayon}</button>`:''}</div>${idm?`<div class="shreal">identité masquée · vrai nom : ${esc(c.nom)}</div>`:''}${(c.surnom||'').trim()?`<div class="shsur">« ${esc(c.surnom.trim())} »</div>`:''}<div class="muted small">${sub.filter(Boolean).join(' · ')}${actif(c)?'':' · '+(STATUTS[c.statut]||'')}${c.cache?' · masqué aux autres':''}</div>${fe?'':fealLine(c)}</div>
    <button type="button" class="shxp" data-act="xpdOpen" data-id="${id}"><b class="num">${s.dispo}</b><small>XP ›</small>${s.manque?`<span class="pill bad">−${s.manque}</span>`:''}</button></div>`;
  return h;}
function xpdSheet(g){const c=S.chars[g.id];if(!c)return '';const s=summary(c,S.events),r=(l,v,cl)=>`<div class="xprow"><span class="cmain">${l}</span><b class="${cl||''}">${v}</b></div>`;
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="XP de ${esc(c.court)}"><div class="in"><div class="blkhd"><h2 style="flex:1;margin:0">XP de ${esc(c.court)}</h2><button type="button" class="ibtn sm" data-act="closeSheet" aria-label="Fermer">✕</button></div>
  ${r('Disponibles',s.dispo)}${r('Prévus',s.prevu)}${r('Manquants',s.manque,s.manque?'bad':'')}${r('Gagnés',s.gains)}${r('Dépensés',s.spent)}
  <div class="actions"><button type="button" class="btn" data-act="xpdHist" data-id="${c.id}">Voir l'historique ›</button></div></div></div>`;}
/* Onglet Progrès (PJ) et Progression (féal, lot 4) */
/* Médaillons du haut : les PJ, puis les PNJ rattachés à un PJ (lot 4, médaillons plus petits) */
function shChips(id){const L=pjIds().concat(ids().filter(i=>isFeal(S.chars[i])).sort((a,b)=>(S.chars[a].court||'').localeCompare(S.chars[b].court||'','fr')));
  return `<div class="pchips">${L.map(i=>{const c=S.chars[i],img=portrait(c),f=c.type==='PNJ';return `<button class="pchip${f?' pchf':''}" data-act="sel" data-id="${i}" aria-pressed="${i===id}" aria-label="${esc(c.court)}${f?' (féal de '+esc(S.chars[c.pj].court)+')':''}"><span class="ph">${img?`<img src="${img}" alt="">`:`<span class="ini">${esc((c.court||'?').slice(0,1))}</span>`}</span><span class="pn">${esc(c.court)}</span></button>`;}).join('')}</div>`;}
function viewProg(c,s,id){let h='';
  if(c.type==='PNJ'){
    if(canEditC(c))h+=`<div class="pghead" style="margin-top:0"><span></span><button type="button" class="btn" data-act="pnjXpOpen">+ XP</button></div>`; /* UX1 : fenêtre au lieu du formulaire permanent */
  }
  if(c.type==='PJ')h+=goalBlock(c,s);
  const OB=!!S.onlyBuy,ir=key=>OB&&!canBuyKey(c,key,s.dispo)?'':itemRow(c,key,s.dispo),none='<div class="muted small" style="padding:6px 2px">Rien d\'achetable ici pour l\'instant.</div>';
  const PJ=c.type==='PJ',card=(t,inner,k,sum)=>PJ?cBlk('pg-'+k,t,sum==null?'':sum,inner||none):`<h2>${t}</h2><div class="card">${inner||none}</div>`;
  const nMax=keys=>keys.filter(k=>{const r=ref(c,k);return r&&r.max!=null&&(r.o.cur||0)>=r.max;}).length,mxS=keys=>{const n=nMax(keys);return n?n+' au max':'';};
  const L1=[],L2=[];
  if(PJ)h+=titreBlock(c); /* correctif recette lot 1 : chemin vers le titre de profil le plus proche (remplace le bandeau des PP) */
  h+=`<div class="flt">${PJ?`<span class="muted small">♥ = prévu</span><button type="button" class="qbtn" data-act="xpHelp" data-k="prog" aria-label="Aide">?</button><span style="flex:1"></span>`:''}<span>Achetable maintenant</span><button class="tgb" data-act="onlyBuy" role="switch" aria-checked="${OB}" aria-label="Afficher seulement ce qui est achetable maintenant"><span class="tg${OB?' on':''}"></span></button></div>${PJ&&(S.xpHelp||{}).prog?`<div class="qtip2">♡ prévoit un niveau (le coût s'ajoute aux XP prévus). « +n » achète un niveau pour n XP ; grisé quand les XP disponibles ne suffisent pas. ★ max : valeur au maximum.</div>`:''}`;
  if(c.type==='PJ'){
    const fe=ir('feerie');
    L1.push(card('Capacités féeriques',fe+(fe?pwSection(c):'')+ir('masque')+(OB?'':staticRow('Tricherie',tricherie(c),'calculée'))+ir('atout'),'fee',mxS(['feerie','masque','atout'])));
    L1.push(aoProgBlock(c,s,ir)); /* arts obscurs : invisible tant qu'aucun art n'est débloqué */
    const fo=ir('fortune');
    L1.push(card('Ressources générales',fo?fo+(()=>{const src=fxIntSrc(c,'fortune').concat(ppFortSrc(c));return src.length?`<div class="muted small fxnote">Fortune : dont ${src.map(esc).join(', ')}</div>`:'';})():'','res'));
  }
  (PJ?L1:{push:x=>{h+=x;}}).push(card('Caractéristiques',CARACS.map(n=>{const r=ir('carac:'+n);return r?r+(()=>{const src=fxIntSrc(c,'car:'+n);return src.length?`<div class="muted small fxnote">${esc(n)} : dont ${src.map(esc).join(', ')}</div>`:'';})():'';}).join(''),'car',mxS(CARACS.map(n=>'carac:'+n))));
  if(!OB&&c.type==='PNJ')h+=traitsCard(c); /* lot 4 : traits des PJ sur l'onglet Fiche seulement */
  if(!PJ)h+=`<h2>Profils</h2>`;let PB='';
  if(c.type==='PJ'){const sp=ir('spec');if(sp)PB+=`<div class="card" style="margin-bottom:10px">${sp}${specBlock(c)}</div>`;}
  let anyP=false;
  for(const pr of c.profils||[]){
    const rk=rankOf(c,pr),nr=nextRank(c,pr);
    let body='';
    if(c.type==='PJ'){body=(pr.comps||[]).map(x=>ir('comp:'+x.nom)).join('');if(OB&&!body)continue;
      const ko=c.id+'|'+pr.nom,ro=!!(S.rkOpen&&S.rkOpen[ko]);
      body+=nr?`<button type="button" class="lnk rklink" data-act="rkOpen" data-k="${esc(ko)}" aria-expanded="${ro}">Rang ${rk+1} dans ${nr.cost} XP ›</button>${ro?`<ul class="rkpath">${nr.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}`:`<div class="muted small" style="padding-top:6px">Rang suivant hors de portée (maxima atteints).</div>`;}
    else{body=ir('prof:'+pr.nom);if(OB&&!body)continue;if(pr.subs&&pr.subs.length)body+=`<div class="tags">${pr.subs.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`;}
    anyP=true;
    if(c.type==='PJ'&&rk>=4)body=titreLine(c,pr)+body;
    if(PJ){const k='pr-'+pr.nom,fold=OB?false:shFolded(k,true),pp=ppHave(pr);
      PB+=`<section class="rblk"><div class="rbh"><button type="button" class="rbt" data-act="shFold" data-k="${esc(k)}" data-e="1" aria-expanded="${!fold}"><span class="tt"><span class="t">${esc(profLab(pr.nom,c))}</span><span class="n">rang ${rk}</span></span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button>${pp>0?`<button type="button" class="ppgold" data-act="ppOpen" data-prof="${esc(pr.nom)}" aria-label="${esc(ppFmt(pp))} PP à dépenser pour ${esc(profLab(pr.nom,c))}">${esc(ppFmt(pp))} PP</button>`:''}</div>${fold?'':`<div class="rbb">${body}</div>`}</section>`;continue;}
    h+=`<div class="card" style="margin-bottom:10px"><div class="prof-head"><b>${esc(profLab(pr.nom,c))}</b><span style="display:flex;gap:8px;align-items:center"><span class="pill acc">rang ${rk}</span>`+
      (c.type==='PJ'?`<button class="ppf${ppHave(pr)>0?' on':''}" data-act="ppOpen" data-prof="${esc(pr.nom)}" aria-label="Points de personnage ${esc(profLab(pr.nom,c))} : ${pr.note??0}"><small>PP</small>${esc(ppFmt(pr.note??0))}</button>`:'')+`</span></div>${body}</div>`;
  }
  if(OB&&!anyP){if(PJ)PB+=none;else h+=`<div class="card">${none}</div>`;}
  if(PJ)L2.push(cBlk('pg-comp','Compétences',String((c.profils||[]).length)+' profils',PB));
  if(c.type==='PNJ'){const sp=ir('spec');if(sp)h+=`<div class="card" style="margin-top:10px">${sp}${specBlock(c)}</div>`;}
  if(c.type==='PJ'){
    const fu=(c.futiles||[]).map(f=>ir('fut:'+f.nom)).join('');
    let FU=(fu||(OB?none:'<div class="muted">Aucune.</div>'));
    if(!OB){if(S.futForm.open)FU+=`<div class="frow" style="margin-top:10px"><div class="field"><label for="fn">Nom</label><input id="fn" type="text" data-fut="nom" value="${esc(S.futForm.nom)}"></div><div class="field"><label for="fm">Niveau max</label><input id="fm" type="number" min="1" max="12" data-fut="max" value="${esc(S.futForm.max)}"></div></div><div class="actions"><button class="btn pri" data-act="futSave">Ajouter</button><button class="btn" data-act="futCancel">Annuler</button></div>`;
    else FU+=`<div style="margin-top:10px"><button class="btn" data-act="futOpen">+ Ajouter une compétence futile</button></div>`;}
    L2.push(cBlk('pg-fut','Compétences futiles',String((c.futiles||[]).length),FU));
    const pnjs=pnjOf(c);
    L2.push(cBlk('pg-aut','Autres dépenses','',AUTRES.filter(n=>n!=='PNJ'||pnjs.length).map(n=>`<div class="irow" style="grid-template-columns:minmax(0,1fr) 60px"><button class="rmain" data-act="openAutre" data-nom="${n}" style="grid-template-columns:minmax(0,1fr) auto"><span class="nm">${autreLab(n)}${n==='PNJ'?`<span class="nsub">vers ${pnjs.map(x=>esc(x.court)).join(', ')}</span>`:n==='Domaine'?'<span class="nsub">transfert</span>':''}</span><span class="lv">${autreTotal(c,n)}<small> XP</small></span></button><button class="plus${s.dispo>0?' ok':''}" data-act="autrePlus" data-nom="${n}"${s.dispo>0?'':' disabled'} aria-label="Dépenser des XP en ${autreLab(n)}">+</button></div>`).join('')));
    h+=`<div class="pg2col"><div>${L1.join('')}</div><div>${L2.join('')}</div></div>`;
  }
  const ach=[...(c.achats||[])].reverse();
  let HI=`<div class="muted small" style="margin-bottom:6px">${s.spent} XP dépensés · touche un achat pour le modifier ou l'annuler</div>`;
  const shown=S.hist[id]?ach:ach.slice(0,3);
  HI+=shown.map(a=>`<button class="row" style="grid-template-columns:minmax(0,1fr) auto" data-act="achatEdit" data-id="${a.id}"><span><span class="t" style="font-weight:600">${a.ppNP?esc(a.label.replace(/non précisé$/,'')).concat('<i style="font-weight:400">non précisé</i>'):esc(a.label)}</span><br><span class="muted small">${a.date?fmtDate(a.date):'sans date'}${a.motif?' · '+esc(a.motif):''}</span></span><span class="nx">${a.cout} XP</span></button>`).join('')||'<div class="muted">Aucun achat.</div>';
  if(ach.length>3)HI+=`<div style="margin-top:8px"><button class="btn ghost" data-act="histToggle">${S.hist[id]?'Réduire':'Tout afficher ('+ach.length+')'}</button></div>`;
  h+=PJ?`<div id="pg-hist">${cBlk('pg-hist','Historique',ach.length+' achats',HI)}</div>`:`<h2>Historique des achats</h2><div class="card">${HI}</div>`;
  return h;
}
/* Onglet « Fiche complète » : consultation, sans achat */
function viewSheetFull(c){const fm=S.forme||'d',fxl=fxOf(c),x=raceRecOf(c),fee=c.type==='PJ'&&!isHum(c);let h='';
  const val=n=>`<b class="num">${n}</b>`,row=(a,b)=>`<div class="fr"><span>${a}</span>${val(b)}</div>`;
  const fxLines=(k,nom)=>fxl.filter(e=>e.kind===k&&nrmA(e.src)===nrmA(nom)).map(e=>`<div class="fxs${fxOn(e,fm)?'':' off'}">Effet : ${esc(fxLabel(e))}${fxQ(e.quand)==='d'?' · démasqué seulement':''}${e.t!=='rap'&&e.txt?' · '+esc(e.txt):''}</div>`).join('');
  const item=(nom,desc,fx)=>`<div class="fi"><b>${esc(nom)}</b>${desc?`<div class="s">${esc(desc)}</div>`:''}${fx||''}</div>`;
  const spl=key=>{const L=specsOf(c).filter(y=>y.cible===key);return L.length?`<div class="fsp">${L.map(y=>{const i=specInfo(y.nom);return esc(y.nom)+(i&&i[2]?'*':'');}).join(', ')}</div>`:'';};
  if(!isHum(c))h+=`<div class="formesw"><span>Forme ${fm==='d'?'démasquée':'masquée'}</span><button class="tgb" data-act="forme" data-v="${fm==='d'?'m':'d'}" role="switch" aria-checked="${fm==='d'}" aria-label="Forme démasquée"><span class="tg${fm==='d'?' on':''}"></span></button></div>`; /* UX1 : interrupteur */
  h+=`<h2>Caractéristiques dérivées</h2><div class="dg">`+derived(c,fm).map(([n,v,b,src])=>{const tip=derFormula(c,fm,n);
    const ab=(src||[]).map(y=>{const m=y.match(/^([+−-]?\d+)\s+(.*)$/);return m?m[1]+' '+m[2].slice(0,4)+'.':y;}).join(' ');
    return `<button class="dt" data-act="derTip" data-n="${esc(n)}" title="${esc(tip)}" aria-label="${esc(tip)} : ${v}">${derIco(n)}<b class="num">${v}</b>${ab?`<small>${esc(ab)}</small>`:''}${S.derTip===n?`<span class="dtip" role="tooltip">${esc(tip)}</span>`:''}</button>`;}).join('')+`</div>`;
  if(fee){const own=c.pw||[],pal=own.some(o=>o.i===7)?'Légendaire':own.some(o=>o.i===6)?'Profond':'';
    let b=(pal?`<div class="muted small" style="padding-bottom:4px">Palier ${pal}</div>`:'')+row('Féerie',lv(c,'feerie'))+row('Masque',lv(c,'masque'))+row('Tricherie',tricherie(c));
    if(x&&own.length){b+=`<div class="muted small" style="margin-top:8px">Pouvoirs</div>`+[...own].sort((a,z)=>a.i-z.i).map(o=>{const p=pwCat(o.id),v=varOf(p,o.v||raceVarAt(x,o.i)),meta=[pwNat(o.id)?NAT_L[pwNat(o.id)].toLowerCase():'',p.type?TYPE_L[p.type]||p.type:''].filter(Boolean).join(' · ');
      const fl=(L,t)=>(L||[]).map(e=>`<div class="fxs${fxOn(e,fm)?'':' off'}">Effet : ${esc(fxLabel(e))}${fxQ(e.quand)==='d'?' · démasqué seulement':''}${v?` <span class="muted">· ${t}</span>`:''}</div>`).join('');
      const op=!!(S.pwF&&S.pwF[c.id+'|'+o.id]);
      return `<div class="fi fil">${illThumb('pw',o.id,48)}<div style="flex:1"><b>${pwLk(x,o.i,o.id)}</b>${meta?` <span class="muted small">${esc(meta)}</span>`:''}${op?(p.desc?`<div class="s">${esc(p.desc)}</div>`:'')+fl(p.fx,'commun')+(v?fl(v.fx,'sous-type'):''):''}</div><button type="button" class="ibtn sm" data-act="pwF" data-k="${esc(c.id+'|'+o.id)}" aria-expanded="${op}" aria-label="Détail">${op?'⌄':'›'}</button></div>`;}).join('');}
    h+=`<h2>Capacités féeriques</h2><div class="card">${b}</div>`;}
  if(x&&c.type==='PJ'){
    const av=(x.av||[]).filter(e=>e&&e[0]),dv=(x.dv||[]).filter(e=>e&&e[0]);
    if(av.length||dv.length)h+=`<h2>Avantages et désavantages</h2><div class="card">${av.length?`<div class="fsub">Avantages</div>`+av.map(e=>item(e[0],e[1],fxLines('av',e[0]))).join(''):''}${dv.length?`<div class="fsub">Désavantages</div>`+dv.map(e=>item(e[0],e[1],fxLines('dv',e[0]))).join(''):''}</div>`;
    const cap=(x.cap||[]).filter(e=>e&&e[0]).map(e=>{const cid=capIdByName(S.capacites||{},e[0]),th=cid?illThumb('cap',cid,48):'',nm=capLk(e);return th?`<div class="fi fil">${th}<div><b>${nm}</b>${e[1]?`<div class="s">${esc(e[1])}</div>`:''}${fxLines('cap',e[0])}</div></div>`:`<div class="fi"><b>${nm}</b>${e[1]?`<div class="s">${esc(e[1])}</div>`:''}${fxLines('cap',e[0])}</div>`;}).join('')+(c.accru?`<div class="fi"><b>${accLk(c.accru)}</b><div class="fxs${fm==='d'?'':' off'}">Effet : ${esc(c.accru)} +1 · démasqué seulement</div></div>`:'');
    if(cap)h+=`<h2>Capacités naturelles</h2><div class="card">${cap}</div>`;
    const at=atoutsOf(c).filter(a=>a&&a.nom);
    if(at.length)h+=`<h2>Atouts féeriques</h2><div class="card">${at.map(a=>{const d=(x.at||[]).find(e=>e&&nrmA(e[0])===nrmA(a.nom));
      /* lot 4 : sous l'atout « Spécialités typiques », les 2 spécialités de la race (fiche de race, onglet Création) */
      const ty=isTyp(a.nom)?((RACES[c.race]||{}).t||[]).filter(e=>e&&e[0]):null;
      const tyH=ty?`<div class="fsp">${ty.length?ty.map(([sp,cp])=>esc(sp)+(cp?` <span class="muted">(${esc(cp)})</span>`:'')).join(', '):'<span class="muted">2 spécialités à rattacher</span>'}</div>`:'';
      return item(a.nom,d&&d[1],fxLines('at',a.nom)+tyH);}).join('')}</div>`;}
  if(c.type==='PJ'){const f=lv(c,'fortune');h+=`<h2>Fortune</h2><div class="card">${row(FORTUNE[f]?esc(FORTUNE[f][0]):'Fortune',f)}</div>`;}
  h+=`<h2>Caractéristiques</h2><div class="card fgrid">${CARACS.map(n=>row(esc(n),lv(c,'carac:'+n)+(c.accru===n&&fm==='d'?1:0))).join('')}</div>`;
  {const T=traitsOf(c);if(T.length)h+=`<h2>Traits de caractère</h2><div class="card"><div class="fxl">${T.map(([n,s])=>`<span class="rchip">${esc(n)} <small class="muted">· ${esc(s)}</small></span>`).join('')}</div></div>`;}
  h+=`<h2>Profils</h2>`+(c.profils||[]).map(pr=>{let b=`<div class="fr"><b>${esc(profLab(pr.nom,c))}</b><span class="muted">rang ${rankOf(c,pr)}</span></div>`;
    if(c.type==='PJ')b+=(pr.comps||[]).map(y=>row(esc(y.nom),lv(c,'comp:'+y.nom))+spl('comp:'+y.nom)).join('');
    else{b+=spl('prof:'+pr.nom);if(pr.subs&&pr.subs.length)b+=`<div class="fsp">${pr.subs.map(esc).join(', ')}</div>`;}
    return `<div class="card" style="margin-bottom:10px">${b}</div>`;}).join('');
  if(c.type==='PJ'&&(c.futiles||[]).length)h+=`<h2>Compétences futiles</h2><div class="card">${c.futiles.map(f=>row(esc(f.nom),lv(c,'fut:'+f.nom))+spl('fut:'+f.nom)).join('')}</div>`;
  if(c.type==='PJ')h+=ppFullBlock(c);
  return h;}
const allPJ=()=>Object.values(S.chars).filter(c=>c.type==='PJ'&&actif(c)&&!c.cache).map(c=>c.id);
const lp=l=>l.persos!=null?l.persos:(l.nature==='Scénario'||l.nature==='Groupe')?allPJ():[];
const lockedLine=l=>l.nature==='Groupe'&&l.persos==null;
function viewLegacyForm(){
  let h='';
  const f=S.form;if(!f.date)f.date=today();
  const formChars=pjIds().filter(i=>actif(S.chars[i]));
  const editing=!!f.editId;
  h+=`<h2 style="margin-top:4px">${editing?'Modifier le gain':'Nouveau gain d\'XP'}</h2><div class="card"${editing?' style="border-color:var(--accent)"':''}><div class="frow"><div class="field"><label for="gty">Type</label><select id="gty" data-f="type">${TYPES.map(t=>`<option${t===(f.type||'Scénario')?' selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label for="gt">Intitulé</label><input id="gt" type="text" data-f="titre" placeholder="ex. S12. Titre du scénario" value="${esc(f.titre)}"></div><div class="field"><label for="gd">Date</label><input id="gd" type="date" data-f="date" value="${esc(f.date)}"></div></div>`;
  f.lines.forEach((ln,i)=>{
    h+=`<div style="border-top:1px solid var(--line);padding-top:10px;margin-top:10px"><div class="frow"><div class="field"><label for="gn${i}">Nature</label><select id="gn${i}" data-l="${i}" data-k="nature">${NATURES.map(n=>`<option${n===ln.nature?' selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label for="gm${i}">XP par personnage</label><input id="gm${i}" type="number" inputmode="numeric" min="0" data-l="${i}" data-k="montant" value="${esc(ln.montant)}"></div></div>
    <div class="chips" style="flex-wrap:wrap;overflow:visible">${formChars.map(id=>`<button class="chip" data-act="lineChar" data-l="${i}" data-id="${id}" aria-pressed="${lp(ln).includes(id)}"${lockedLine(ln)?' disabled':''}>${esc(S.chars[id].court)}</button>`).join('')}</div>${lockedLine(ln)?'<div class="muted small">Groupe : s\'applique à tous les PJ.</div>':''}
    <div class="actions" style="margin-bottom:4px">${lockedLine(ln)?'':`<button class="btn ghost" data-act="lineAll" data-l="${i}">Tous les PJ</button><button class="btn ghost" data-act="lineNone" data-l="${i}">Aucun</button>`}${f.lines.length>1?`<button class="btn ghost" data-act="lineDel" data-l="${i}">Retirer la ligne</button>`:''}</div></div>`;
  });
  const valid=f.titre.trim()&&(f.lines.some(l=>+l.montant>0&&lp(l).length)||(editing&&(f.keep||[]).length));
  h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="lineAdd">+ Autre nature</button>${editing?'<button class="btn ghost" data-act="gainCancel">Annuler</button>':''}<button class="btn pri" data-act="gainSave"${valid?'':' disabled'}>${editing?'Enregistrer les modifications':'Enregistrer le gain'}</button></div></div>`;
  return h;
}

const sessList=()=>S.events.filter(e=>e.session&&!e.rattrapage).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||S.events.indexOf(b)-S.events.indexOf(a));
const sessById=id=>S.events.find(e=>e.id===id&&e.session);
function curSession(){const L=sessList();if(S.curSess&&L.some(e=>e.id===S.curSess))return sessById(S.curSess);return L[0]||null;}
/* PJ présents d'une session : liste enregistrée, sinon déduite (PJ ayant du Scénario, à défaut un gain quelconque) */
function presents(e){if(!e)return [];const isPJ=i=>S.chars[i]&&S.chars[i].type==='PJ';if(Array.isArray(e.pj))return e.pj.filter(isPJ);
  const sc=[...new Set(e.entries.filter(x=>x.nature==='Scénario'&&x.montant&&isPJ(x.perso)).map(x=>x.perso))];if(sc.length)return sc;
  return [...new Set(e.entries.filter(x=>x.montant&&isPJ(x.perso)).map(x=>x.perso))];}
const orderPJ=a=>{const o=pjIds();return [...a].sort((x,y)=>{const i=o.indexOf(x),j=o.indexOf(y);return (i<0?99:i)-(j<0?99:j);});};
/* Destinataires d'une ligne de saisie dans une session : Scénario → présents, Groupe → PJ actifs, Individuel → choix parmi les présents */
function slp(l,cs){if(l.nature==='Fief'){const f=typeof fgLineFief==='function'?fgLineFief(l):'';return f?['fief:'+f]:[];} /* lot 7 : XP versée au fief */
  if(l.nature==='Scénario')return presents(cs);if(l.nature==='Groupe')return allPJ();const pr=presents(cs);return (l.persos||[]).filter(p=>pr.includes(p));}
/* Modifier par nature : Scénario → présents ; Groupe → PJ qui l'ont déjà (sinon PJ actifs) ; Individuel → présents + ceux qui en ont */
function natTargets(e,n){if(n==='Scénario')return presents(e);const has=[...new Set(e.entries.filter(x=>x.nature===n&&x.montant&&S.chars[x.perso]&&S.chars[x.perso].type==='PJ').map(x=>x.perso))];return has.length?has:allPJ();}
function natList(e,g){return orderPJ([...new Set([...presents(e),...Object.keys(g.vals).filter(i=>+g.vals[i])])]).filter(i=>S.chars[i]&&vis(S.chars[i]));}
function modeOf(a){const c={};let b=null;for(const v of a){c[v]=(c[v]||0)+1;if(b===null||c[v]>c[b])b=v;}return b;}
/* Début d'intitulé proposé : numéro suivant le plus grand déjà utilisé pour ce type */
function sessPrefix(type){
  const re=type==='Scénario'?/^S\.?\s*0*(\d+)/i:type==='Interscénario'?/^\[\s*Int\.?\s*0*(\d+)/i:null;if(!re)return '';
  let n=0;for(const e of S.events)if(e.session&&evType(e)===type){const m=(e.titre||'').match(re);if(m)n=Math.max(n,+m[1]);}
  return type==='Scénario'?'S'+String(n+1).padStart(2,'0')+'. ':'[Int. '+String(n+1).padStart(3,'0')+'] ';
}
const sessLabel=e=>e?esc((h=>(h.num?h.num+' · ':'')+h.t)(chSessHead(e)))+(e.date?' · '+fmtDate(e.date):e.textuelle?' · Session textuelle':''):'';
const sessChildren=id=>S.events.filter(e=>e.sessionId===id);
function sessOptions(sel,req){return (req&&sessList().length?'':`<option value="">Aucune session</option>`)+sessList().map(e=>`<option value="${e.id}"${e.id===sel?' selected':''}>${sessLabel(e)}</option>`).join('');}
function pnjAttached(){return Object.values(S.chars).filter(c=>c.type==='PNJ'&&c.pj&&S.chars[c.pj]&&vis(c)).sort((a,b)=>(a.court||'').localeCompare(b.court||''));}
/* UX1 : événements d'un type, plus récent (numéro le plus haut) en tête */
const xpEvOf=type=>chEvs().filter(f=>{const x=chEvNum(f);return x?x.type===type:f.type===type;}).sort((a,b)=>((chEvNum(b)||{}).n||0)-((chEvNum(a)||{}).n||0));
const xpLinked=t=>t!=='Autre';
function sdOk(g){if(g.kind==='sm'){const e=sessById(g.id);return (!!(e&&e.evt&&S.fiches[e.evt])&&(g.type===evType(e)||!S.events.some(x=>x.session&&x.evt===e.evt&&x.id!==e.id)))||!!(g.titre||'').trim();} /* UX2 : l'événement de sa seule session suit le type */
  if(!xpLinked(g.type)||(g.type==='Vie du fief'&&!g.evt))return !!(g.titre||'').trim();return g.evt==='__new'?!!(g.evNom||'').trim():!!(g.evt&&S.fiches[g.evt]);}
/* ---------- UX1 (28/11/2026) : page XP — Bilan, Sessions, session ouverte ---------- */
const XP_PILL=e=>{const h=chSessHead(e);return `<span class="chsn ${h.cl}">${esc(h.num||'·')}</span>`;};
const xpNum=d=>String(Math.round(d*10)/10).replace('.',',');
function xpNextN(type){let n=0;for(const f of Object.values(S.fiches||{}))if(f.genre==='evenement'){const x=chEvNum(f);if(x&&x.type===type)n=Math.max(n,x.n);}return n+1;}
function xpBilan(){const list=pjIds().map(i=>S.chars[i]).filter(c=>c&&vis(c)),gt=gainsTable(list,S.events);
  const extra=[];for(const e of S.events)for(const en of e.entries){const ch=S.chars[en.perso];if(ch&&ch.type==='PJ'&&!NATURES.includes(en.nature)&&!extra.includes(en.nature))extra.push(en.nature);}
  const nat=NATURES.concat(extra),rows=gt.rows.slice().sort((a,b)=>b.total-a.total);
  const on=r=>actif(r.c)&&!r.c.horsMoyenne,off=rows.filter(r=>!on(r));S.xpDet=S.xpDet||{};
  const ec=r=>{const d=Math.round(r.delta*10)/10;return on(r)?(d>0?'+'+xpNum(d):d<0?'−'+xpNum(-d):'0'):'';};
  let ph=rows.filter(on).map(r=>{const c=r.c,det=S.xpDet[c.id];
    return `<div class="xpbr${r.alert?' alert':''}"><button type="button" class="crow" data-act="xpDet" data-id="${c.id}" aria-expanded="${!!det}"><span class="cmain"><span class="t">${esc(c.court)}</span></span>${r.alert?`<span class="xpwarn">⚠ ${ec(r)}</span>`:`<span class="muted small">${ec(r)}</span>`}<b class="xptot">${r.total}</b></button>${r.alert&&rattrapage(gt.rows,r)?`<button type="button" class="lnk" data-act="ratOpen" data-id="${c.id}">Rattraper</button>`:''}${det?`<div class="xpdet muted small">${nat.filter(n=>r.by[n]).map(n=>`${esc(n)} ${r.by[n]}`).join(' · ')}</div>`:''}</div>`;}).join('');
  ph+=`<div class="xpavg muted small"><span>Moyenne du groupe · ${xpNum(gt.avg)}</span>${off.length?`<span>${off.map(r=>esc(r.c.court)+' : '+r.total).join(', ')} (hors moyenne)</span>`:''}</div>`;
  const tb=`<div class="tbl"><table><thead><tr><th>PJ</th>${nat.map(n=>`<th>${esc(n)}</th>`).join('')}<th>Total</th><th>Écart</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.alert?'alert':on(r)?'':'off'}"><td>${esc(r.c.court)}${on(r)?'':' <span class="pill">hors moyenne</span>'}</td>${nat.map(n=>`<td>${r.by[n]||'·'}</td>`).join('')}<td><b>${r.total}</b></td><td>${r.alert?'⚠ ':''}${ec(r)}</td><td>${r.alert&&rattrapage(gt.rows,r)?`<button type="button" class="lnk" data-act="ratOpen" data-id="${r.c.id}">Rattraper</button>`:''}</td></tr>`).join('')}<tr class="avg"><td>Moyenne du groupe</td>${nat.map(()=>'<td></td>').join('')}<td><b>${xpNum(gt.avg)}</b></td><td></td><td></td></tr></tbody></table></div>`;
  return `<section class="card xpsec"><div class="blkhd"><h3>Bilan</h3><button type="button" class="qbtn" data-act="xpHelp" data-k="bil" aria-label="Aide">?</button></div>${(S.xpHelp||{}).bil?`<div class="qtip2">⚠ : PJ actif dont le total est inférieur d'au moins ${GAP} XP à la moyenne. « Rattraper » propose l'XP qui le ramène au PJ juste devant. Toucher une ligne : détail par nature.</div>`:''}<div class="only-ph">${ph}</div><div class="only-pc">${tb}</div></section>`;}
function xpSessList(){const F=S.xpF||{t:[],p:''},L=sessList().filter(e=>(!F.t.length||F.t.includes(evType(e)))&&(!F.p||presents(e).includes(F.p)||e.entries.some(x=>x.perso===F.p)));
  let fl='';if(S.xpFo){const chip=(act,v,lab,on)=>`<button type="button" class="chip" data-act="${act}" data-v="${esc(v)}" aria-pressed="${on}">${esc(lab)}</button>`;
    fl=`<div class="chips" style="flex-wrap:wrap;overflow:visible;margin:6px 0">${TYPES.map(t=>chip('xpFt',t,t,F.t.includes(t))).join('')}</div><div class="chips" style="flex-wrap:wrap;overflow:visible;margin:0 0 6px">${chip('xpFp','','Tous les PJ',!F.p)}${pjIds().filter(i=>vis(S.chars[i])).map(i=>chip('xpFp',i,S.chars[i].court,F.p===i)).join('')}</div>`;}
  const rows=L.map(e=>`<button type="button" class="crow" data-act="xpOpen" data-id="${e.id}">${XP_PILL(e)}<span class="cmain"><span class="t">${esc(chSessHead(e).t)}</span><span class="s">${e.date?fmtDate(e.date):'sans date'} · ${presents(e).length} PJ</span></span><span class="chev" aria-hidden="true">›</span></button>`).join('');
  return `<section class="card xpsec"><div class="blkhd"><h3>Sessions · ${L.length}</h3><button type="button" class="chip" data-act="xpFo" aria-expanded="${!!S.xpFo}">Filtres ▾</button></div>${fl}${rows||'<div class="muted small">Aucune session.</div>'}</section>`;}
function xpSessView(e){const h=chSessHead(e),f=e.evt&&S.fiches[e.evt],ed=isUser(),pr=orderPJ(presents(e)).filter(i=>vis(S.chars[i]));
  const kids=sessChildren(e.id),blocked=kids.filter(k=>!(k.secret&&k.secret.k==='bonus')).length,others=f?sessList().filter(x=>x.evt===f.id&&x.id!==e.id).length:0;
  let o=crumb(['XP','data-act="xpClose"'],['Session '+(h.num||esc(evType(e)))]);
  o+=`<div class="ttlrow"><div class="ttl"><div class="xpmeta">${XP_PILL(e)}<span class="muted small">${esc(evType(e))} · ${e.date?fmtDate(e.date):'sans date'} · ${pr.length} PJ</span></div><h2 class="xph">${esc(h.t)}</h2></div>${ed?`<button type="button" class="ibtn" data-act="sessEditId" data-id="${e.id}" aria-label="Modifier la session">${ICON.crayon}</button><button type="button" class="ibtn del" data-act="xpDelAsk" data-id="${e.id}" aria-label="Supprimer la session"${blocked?' disabled':''}>${ICON.corbeille}</button>`:''}</div>`;
  if(S.xpDel===e.id)o+=`<div class="delconf" role="alert"><span><b>Supprimer cette session ?</b> L'XP saisie dedans sera retirée pour tous les personnages.</span>${f&&!others?`<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-xpdelev="1"${S.xpDelEv?' checked':''}> Supprimer aussi l'événement « ${esc(f.nom)} » (aucune autre session)</label>`:''}<div class="acts"><button type="button" class="btn" data-act="xpDelNo">Annuler</button><button type="button" class="btn danger" data-act="xpDelOk" data-id="${e.id}">Supprimer</button></div></div>`;
  if(blocked)o+=`<div class="muted small">Suppression impossible tant que ${blocked} découverte${blocked>1?'s sont rattachées':' est rattachée'} à cette session.</div>`;
  const pv=c=>{const ch=S.chars[c];return ch&&ch.type==='PJ'&&vis(ch);},ord=pjIds(),by={};
  for(const en of e.entries){if(!pv(en.perso))continue;(by[en.nature]=by[en.nature]||{});by[en.nature][en.perso]=(by[en.nature][en.perso]||0)+en.montant;}
  const nats=NATURES.filter(n=>by[n]).concat(Object.keys(by).filter(n=>!NATURES.includes(n)));
  let body='';for(const n of nats){const x=by[n],ps=Object.keys(x).filter(p=>x[p]).sort((a,b)=>ord.indexOf(a)-ord.indexOf(b));if(!ps.length)continue;const vals=[...new Set(ps.map(p=>x[p]))],nm=p=>esc(S.chars[p].court);
    const act=pjIds().filter(i=>actif(S.chars[i])&&vis(S.chars[i]));
    const who=vals.length===1?`<div class="xprow"><span class="cmain">${n==='Groupe'&&ps.length>=act.length?'Tous les PJ actifs, présents ou non':ps.map(nm).join(', ')}</span><b>${vals[0]}${ps.length>1?' chacun':''}</b></div>`:ps.map(p=>`<div class="xprow"><span class="cmain">${nm(p)}</span><b>${x[p]}</b></div>`).join('');
    body+=`<div class="xpnat"><div class="xpnh"><span>${esc(n)}</span>${ed?`<button type="button" class="ibtn sm" data-act="natEdit" data-id="${e.id}" data-n="${esc(n)}" aria-label="Modifier ${esc(n)}">${ICON.crayon}</button>`:''}</div>${who}</div>`;}
  body+=typeof fgSessBlock==='function'?fgSessBlock(e):'';
  body+=kids.map(k=>{const ents=k.entries.filter(en=>pv(en.perso));if(!ents.length)return '';return `<div class="xpnat"><div class="xpnh"><span>${jTitle(k)}</span></div><div class="muted small">${[...new Set(ents.map(en=>en.nature+' +'+en.montant))].join(' · ')} · se corrige depuis Univers › ${k.creature?'Races':'Secrets'}</div></div>`;}).join('');
  {const P=pnjAttached().map(c=>({c,sh:pnjShares(c,S.events).find(x=>x.sess===e.id)})).filter(x=>x.sh);
    if(P.length)body+=`<div class="xpnat"><div class="xpnh"><span>Part des PNJ</span><button type="button" class="qbtn" data-act="xpHelp" data-k="pnj" aria-label="Aide">?</button></div>${(S.xpHelp||{}).pnj?`<div class="qtip2">Féal rattaché : 50 % des gains de son PJ dans la session s'il a participé activement, 25 % sinon (interrupteur), arrondi à l'inférieur.</div>`:''}${P.map(({c,sh})=>`<div class="xprow"><span class="cmain">${esc(c.court)} <span class="muted small">· féal de ${esc(S.chars[c.pj].court)} · ${sh.pct} %</span></span><b>${sh.montant}</b>${ed?`<button class="tgl" role="switch" aria-checked="${sh.on}" aria-label="${esc(c.court)} a participé activement" data-act="pnjToggle" data-id="${c.id}" data-s="${e.id}"><i></i></button>`:''}</div>`).join('')}</div>`;}
  o+=`<section class="card xpsec"><div class="blkhd"><h3>XP attribués</h3>${ed?`<button type="button" class="pbtn" data-act="xpAddOpen" data-id="${e.id}" aria-label="Ajouter des XP">+</button>`:''}</div>${body||'<div class="muted small">Aucun XP pour l\'instant.</div>'}</section>`;
  if(f)o+=`<section class="card xpsec"><div class="xpmeta">${f?`<span class="chsn ${CH_TCL[f.type]||''}">${esc(chNumOf(f)||'·')}</span>`:''}<span class="cmain">Événement : ${esc(f.nom)}</span></div><button type="button" class="lnk" data-act="xpEvGo" data-id="${f.id}">Voir dans la Chronique ›</button></section>`;
  return o;}
function viewGains(){
  if(!ids().length)return emptyState();
  if(S.form.editId)return viewLegacyForm()+gainsTableAndJournal();
  const se=S.xpSess&&sessById(S.xpSess);if(se)return xpSessView(se);
  return `<div class="pghead"><h2>XP</h2>${isUser()?`<button type="button" class="pbtn big" data-act="sessNew" aria-label="Nouvelle session">+</button>`:''}</div>`+xpBilan()+xpSessList();
}
/* Fenêtre « + XP » : reprend le formulaire d'ajout existant (S.form, sessAdd) dans une feuille */
function xpAddSheet(g){const cs=sessById(g.sid);if(!cs)return '';S.curSess=cs.id;const f=S.form,pr=orderPJ(presents(cs));
  let h='';f.lines.forEach((ln,i)=>{
    h+=`<div style="${i?'border-top:1px solid var(--line);padding-top:10px;margin-top:10px':''}"><div class="frow"><div class="field"><label for="gn${i}">Nature</label><select id="gn${i}" data-l="${i}" data-k="nature">${NATURES.concat(typeof fgFiefs==='function'&&fgFiefs().length?['Fief']:[]).map(n=>`<option${n===ln.nature?' selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label for="gm${i}">${ln.nature==='Fief'?'XP au fief':'Montant par PJ'}</label><input id="gm${i}" type="number" inputmode="numeric" min="0" data-l="${i}" data-k="montant" value="${esc(ln.montant)}"></div></div>`;
    if(ln.nature==='Groupe')h+=`<div class="muted small" style="margin:6px 0 4px">Tous les PJ actifs, présents ou non (${allPJ().length}).</div>`;
    else if(ln.nature==='Fief')h+=fgFormLine(ln,i);
    else if(ln.nature==='Scénario')h+=`<div class="muted small" style="margin:6px 0 4px">${pr.length?'PJ présents : '+pr.filter(id=>vis(S.chars[id])).map(id=>esc(S.chars[id].court)).join(', ')+'.':'Aucun PJ présent : coche-les dans la session (crayon).'}</div>`;
    else{const sel=slp(ln,cs);h+=`<div class="chips" style="flex-wrap:wrap;overflow:visible;margin-top:6px">${pr.filter(id=>vis(S.chars[id])).map(id=>`<button class="chip" data-act="slChar" data-l="${i}" data-id="${id}" aria-pressed="${sel.includes(id)}">${esc(S.chars[id].court)}</button>`).join('')}</div>`;}
    if(f.lines.length>1)h+=`<div class="actions" style="margin-bottom:4px"><button class="btn ghost" data-act="lineDel" data-l="${i}">Retirer la ligne</button></div>`;
    h+=`</div>`;});
  const add=[];for(const l of f.lines){const m=+l.montant;if(m>0)for(const pp of slp(l,cs))add.push([pp,m]);}
  const rs=add.length?add.map(([p,m])=>(String(p).startsWith('fief:')?'Fief':esc((S.chars[p]||{}).court||p))+' +'+m).join(', '):'';
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Ajouter des XP"><div class="in"><div class="blkhd"><h2 style="flex:1;margin:0">Ajouter des XP</h2><button type="button" class="ibtn sm" data-act="closeSheet" aria-label="Fermer">✕</button></div>${h}${rs?`<div class="small">${rs}.</div>`:''}<div class="actions"><button class="btn ghost" data-act="lineAdd">+ Autre nature</button><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="sessAdd"${add.length?'':' disabled'}>Ajouter</button></div></div></div>`;}
function gainsTableAndJournal(){
  let h='';
  const list=pjIds().map(i=>S.chars[i]);
  const gt=gainsTable(list,S.events);
  const extra=[];for(const e of S.events)for(const en of e.entries){const ch=S.chars[en.perso];if(ch&&ch.type==='PJ'&&!NATURES.includes(en.nature)&&!extra.includes(en.nature))extra.push(en.nature);}
  const nat=NATURES.concat(extra);
  h+=`<h2>XP gagnée par nature</h2><div class="card"><div class="muted small" style="margin-bottom:8px">⚠ signale un PJ dont le total est inférieur d'au moins ${GAP} XP à la moyenne du groupe (${(Math.round(gt.avg*10)/10).toString().replace('.',',')}).</div><div class="tbl"><table><thead><tr><th>Perso</th>${nat.map(n=>`<th>${esc(n)}</th>`).join('')}<th>Total</th><th>Écart</th></tr></thead><tbody>`+
    gt.rows.map(r=>{const c=r.c,off=!actif(c)||c.horsMoyenne;const d=Math.round(r.delta);
      const rt=r.alert?rattrapage(gt.rows,r):null;
      return `<tr class="${r.alert?'alert':off?'off':''}"><td>${r.alert?'<span aria-label="Alerte">⚠</span> ':''}${esc(c.court)}${rt?` <button class="ratbtn" data-act="ratOpen" data-id="${c.id}" title="Rattrapage d'XP" aria-label="Rattrapage d'XP pour ${esc(c.court)}">↑</button>`:''}${!actif(c)?' <span class="pill">'+(STATUTS[c.statut]||'')+'</span>':''}${c.horsMoyenne&&actif(c)?' <span class="pill">hors moyenne</span>':''}</td>${nat.map(n=>`<td>${r.by[n]||'·'}</td>`).join('')}<td><b>${r.total}</b></td><td>${off?'·':(d>0?'+'+d:d<0?'−'+(-d):'0')}</td></tr>`;}).join('')+
    `<tr class="avg"><td>Moyenne du groupe</td>${nat.map(()=>'<td></td>').join('')}<td><b>${Math.round(gt.avg*10)/10}</b></td><td></td></tr></tbody></table></div></div>`;

  h+=`<h2>Journal</h2><div class="card">`;
  const pv=c=>{const ch=S.chars[c];return ch&&ch.type==='PJ'&&vis(ch);};
  const grpTags=ents=>{const grp={};for(const en of ents){const k=en.nature+' +'+en.montant;(grp[k]=grp[k]||[]).push(S.chars[en.perso].court);}return grp;};
  const top=[...S.events].reverse().filter(e=>!e.sessionId||!sessById(e.sessionId));
  const first=top.find(e=>e.session);S.jOpen=S.jOpen||{};
  h+=top.map(e=>{
    if(e.session){
      const open=e.id in S.jOpen?S.jOpen[e.id]:e===first;
      if(!open)return `<div class="sess${chSessHead(e).cl?' evg '+chSessHead(e).cl:''}"><div class="shead stog" data-act="sessToggle" data-id="${e.id}" role="button" tabindex="0" aria-expanded="false"><span class="chev" aria-hidden="true">›</span><div style="min-width:0"><div class="t" style="font-size:17px">${chSessT(e)}</div><div class="muted small">${[e.date?fmtDate(e.date):e.textuelle?'Session textuelle':'',esc(evType(e))].filter(Boolean).join(' · ')}</div>${(()=>{const pr=orderPJ(presents(e)).filter(i=>vis(S.chars[i]));return pr.length?`<div class="muted small" style="margin-top:2px">👥 ${pr.map(i=>esc(S.chars[i].court)).join(', ')}</div>`:'';})()}${chSessLine(e)}</div></div></div>`;
      const kids=sessChildren(e.id);
      let body='';
      const NCL={Scénario:'n-sc',Groupe:'n-gr',Individuel:'n-in'},ord=pjIds(),by={};
      for(const en of e.entries){if(!pv(en.perso))continue;(by[en.nature]=by[en.nature]||{});by[en.nature][en.perso]=(by[en.nature][en.perso]||0)+en.montant;}
      const nats=NATURES.filter(n=>by[n]).concat(Object.keys(by).filter(n=>!NATURES.includes(n)));
      for(const n of nats){const o=by[n],ps=Object.keys(o).filter(p=>o[p]).sort((a,b)=>ord.indexOf(a)-ord.indexOf(b));if(!ps.length)continue;const cl=NCL[n]||'acc',nm=p=>esc(S.chars[p].court);
        const btn=`<button class="btn ghost" style="padding:4px 10px;flex:none" data-act="natEdit" data-id="${e.id}" data-n="${esc(n)}">Modifier</button>`;
        if(n==='Individuel'){body+=`<div class="nb"><div class="nbh"><b>${esc(n)}</b>${btn}</div><div class="nbl">${ps.map(p=>`<span class="xpi">${nm(p)} <span class="xpn">+${o[p]}</span></span>`).join(', ')}</div></div>`;continue;}
        const g={};for(const p of ps)(g[o[p]]=g[o[p]]||[]).push(p);const ks=Object.keys(g).sort((a,b)=>b-a);
        body+=`<div class="nb"><div class="nbh"><span class="nt"><b>${esc(n)}</b>${ks.length===1?`<span class="xpn">+${ks[0]}</span>`:''}</span>${btn}</div><div class="nbl">${ks.length===1?`<span class="muted small">${g[ks[0]].map(nm).join(', ')}</span>`:ks.map(m=>`<div><span class="xpn">+${m}</span> <span class="muted small">${g[m].map(nm).join(', ')}</span></div>`).join('')}</div></div>`;}
      body+=typeof fgSessBlock==='function'?fgSessBlock(e):''; /* lot 7 */
      body+=kids.map(k=>{const ents=k.entries.filter(en=>pv(en.perso));if(!ents.length)return '';const g=grpTags(ents);return `<div class="sline"><div style="min-width:0"><div>${jTitle(k)}</div><div class="tags">${Object.keys(g).map(x=>`<span class="pill acc">${esc(x)}</span><span class="muted small">${g[x].length===allPJ().length?'tous les PJ actifs':esc(g[x].join(', '))}</span>`).join(' ')}</div></div><span class="locked" style="max-width:110px;text-align:right">Se corrige depuis Univers › ${k.creature?'Races':'Secrets'}</span></div>`;}).join('');
      {const pn=[];let calc=false,rep=false;
        for(const en of e.entries){const ch=S.chars[en.perso];if(!ch||ch.type!=='PNJ'||!vis(ch)||!en.montant)continue;const x=pn.find(y=>y.id===en.perso&&y.n===en.nature);if(x)x.m+=en.montant;else pn.push({id:en.perso,n:en.nature,m:en.montant});rep=true;}
        for(const c of Object.values(S.chars)){if(c.type!=='PNJ'||!vis(c))continue;const sh=pnjShares(c,S.events).find(x=>x.sess===e.id);if(sh&&sh.montant){pn.push({id:c.id,n:sh.nature,m:sh.montant});calc=true;}}
        if(pn.length)body+=`<div class="nb"><div class="nbh"><b>PNJ</b><span class="locked" style="text-align:right">${calc&&rep?'Calculée ou reprise':calc?'Calculée automatiquement':'Reprise de l\'ancien journal'}</span></div><div class="nbl">${pn.map(x=>{const m=(x.n||'').match(/\((\d+) %\)/);return `<div>${esc(S.chars[x.id].court)} <span class="xpn">+${x.m}</span>${m?' ('+m[1]+' %)':''}</div>`;}).join('')}</div></div>`;}
      const blocked=kids.filter(k=>!(k.secret&&k.secret.k==='bonus')).length;
      return `<div class="sess open${chSessHead(e).cl?' evg '+chSessHead(e).cl:''}"><div class="shead stog" data-act="sessToggle" data-id="${e.id}" role="button" tabindex="0" aria-expanded="true"><span class="chev" aria-hidden="true">›</span><div style="min-width:0"><div class="t" style="font-size:17px">${chSessT(e)}</div><div class="muted small">${[e.date?fmtDate(e.date):e.textuelle?'Session textuelle':'',esc(evType(e))].filter(Boolean).join(' · ')}</div>${(()=>{const pr=orderPJ(presents(e)).filter(i=>vis(S.chars[i]));return pr.length?`<div class="muted small" style="margin-top:2px">👥 ${pr.map(i=>esc(S.chars[i].court)).join(', ')}</div>`:'';})()}${chSessLine(e)}</div><button class="btn ghost" style="padding:4px 10px;flex:none" data-act="sessEditId" data-id="${e.id}">Modifier</button></div>${body||'<div class="muted small" style="padding:6px 0">Aucun gain pour l\'instant.</div>'}${blocked?`<div class="muted small" style="margin-top:6px">Suppression impossible tant que ${blocked} découverte${blocked>1?'s sont rattachées':' est rattachée'} à cette session.</div>`:''}</div>`;
    }
    const ents=e.entries.filter(en=>pv(en.perso));if(!ents.length)return '';
    const g=grpTags(ents);
    const tags=Object.keys(g).map(k=>`<span class="pill acc">${esc(k)}</span><span class="muted small">${esc(g[k].join(', '))}</span>`).join(' ');
    return `<div class="ev"><div style="min-width:0"><div class="t">${jTitle(e)}</div><div class="muted small">${e.date?fmtDate(e.date):'sans date'} · ${esc(evTypeL(e))}</div><div class="tags">${tags}</div></div>${e.secret||e.creature?`<span class="locked" style="flex:none;max-width:120px;text-align:right">Se corrige depuis Univers › ${e.creature?'Races':'Secrets'}</span>`:`<span style="display:flex;gap:6px;flex:none"><button class="btn ghost" style="padding:4px 10px" data-act="gainEdit" data-id="${e.id}">Modifier</button><button class="btn ghost" style="padding:4px 10px" data-act="gainDel" data-id="${e.id}">Supprimer</button></span>`}</div>`;
  }).join('')||'<div class="muted">Aucun gain enregistré.</div>';
  h+=`</div>`;
  return h;
}
function viewPlayers(){
  const pl=playersSorted(),tab='joueurs',G=isGest(); /* UX1 : sous-onglet Personnages supprimé */
  const me=S.players[ME],CHG='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
  const pushOk=pushOK()&&me&&Notification.permission!=='denied';
  let h=`<h2 style="margin-top:4px">Joueurs</h2><div class="card me2"><div style="min-width:0"><div class="muted small" style="white-space:nowrap">Sur cet appareil</div><b style="font-size:17px">${S.visit?'Visiteur':me?esc(me.nom):'—'}</b></div><div class="me2r">${pushOk?`<button class="nsw" data-act="${S.pushSub?'pushOff':'pushOn'}" role="switch" aria-checked="${!!S.pushSub}" aria-label="Notifications sur cet appareil" title="Notifications sur cet appareil"><span aria-hidden="true">🔔</span><span class="tg${S.pushSub?' on':''}"></span></button>`:''}<button class="icb" data-act="meOpen" title="Changer d'identité" aria-label="Changer d'identité">${CHG}</button></div></div>`;
  if(S.pushMsg||(!pushOK()&&me))h+=`<div class="muted small" style="margin:6px 4px 0">${S.pushMsg?esc(S.pushMsg):isIOS()&&!isStandalone()?'Notifications : sur iPhone, ajoute d\'abord l\'appli à l\'écran d\'accueil.':'Notifications non disponibles sur ce navigateur.'}</div>`;
  else if(me&&pushOK()&&Notification.permission==='denied')h+=`<div class="muted small" style="margin:6px 4px 0">Notifications bloquées pour ce site : autorise-les dans les réglages du navigateur.</div>`;
  const vc=ids().map(i=>S.chars[i]);
  const av=(txt,img)=>`<span class="av2">${img?`<img src="${img}" alt="">`:esc((txt||'?').slice(0,1))}</span>`;
  if(tab==='joueurs'){
    const row=p=>{const mine=vc.filter(c=>(p.persos||[]).includes(c.id)).map(c=>c.court).join(', ');
      const tags=(p.role==='MJ'?' <span class="tag2 mj">MJ</span>':'')+(hasGest(p)?' <span class="tag2 g">gestion</span>':'')+(p.id===ME?' <span class="tag2">toi</span>':'')+(p.parti?' <span class="tag2">parti</span>':'');
      const pin=G&&pinOn()?(S.id.pins&&S.id.pins.has(p.id)?'<span class="lk2" title="PIN défini">🔒</span>':'<span class="lk2">pas de PIN</span>'):'';
      return `<button class="lrow" data-act="plOpen" data-pid="${esc(p.id)}"${p.parti?' style="opacity:.7"':''}>${av(p.nom)}<span class="lm"><span class="lt">${esc(p.nom)}${tags}</span><span class="ls">${esc(mine||'—')}</span></span>${pin}<span class="chev">›</span></button>`;};
    h+=`<div class="card lcard">${pl.map(row).join('')||'<div class="empty">Aucun joueur.</div>'}</div>`;
    if(G)h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="newPOpen">+ Nouveau joueur</button></div>`;
    if(G&&!pinOn())h+=`<div class="muted small" style="margin-top:8px">Codes PIN inactifs : le script <b>3_pin.sql</b> n'est pas installé dans Supabase.</div>`;
  }else{
    const sub=c=>c.type==='PNJ'?(c.race?esc(raceLabel(c))+' · ':'')+(c.pj&&S.chars[c.pj]?'rattaché à '+esc(S.chars[c.pj].court):'non rattaché'):(c.race?esc(raceLabel(c)):'race à préciser')+' · '+(owners(c).map(p=>esc(p.nom)).join(', ')||'sans joueur');
    const row=c=>`<button class="lrow" data-act="pcOpen" data-id="${esc(c.id)}">${av(c.court,portrait(c))}<span class="lm"><span class="lt">${esc(c.court)}${c.type==='PNJ'?(!pnRev(c)?' <span class="tag2">préparé</span>':''):c.cache?' <span class="tag2">masqué</span>':''}</span><span class="ls">${sub(c)}</span></span><span class="chev">›</span></button>`;
    const act=c=>!c.statut||c.statut==='actif';
    const grp=(t,L)=>L.length?`<div class="grp2">${t}</div><div class="card lcard">${L.map(row).join('')}</div>`:'';
    const arch=vc.filter(c=>!act(c));
    h+=grp('PJ actifs',vc.filter(c=>act(c)&&c.type==='PJ'))+grp('PNJ',vc.filter(c=>act(c)&&c.type==='PNJ'));
    h+=`<div class="grp2">Archives</div>`+(arch.length?`<div class="card lcard">${arch.map(row).join('')}</div>`:`<div class="card"><span class="muted small">Décédés et retirés : aucun</span></div>`);
    if(ME&&!S.visit)h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="cwNew">+ Nouveau personnage</button></div>`; /* lot C : ouvre l'assistant */
  }
  return h;
}
/* Droits dans l'onglet Joueurs : chacun sa fiche et ses personnages ; le reste avec les droits de gestion */
const canEditP=p=>!!p&&!S.visit&&(isGest()||p.id===ME);
const canEditC=c=>!!c&&isUser()&&vis(c); /* UX1 : tout le visible est modifiable par tout joueur identifié (PJ des autres, féaux, PNJ) */
function plSheet(g){const p=S.players[g.id];if(!p)return null;const G=isGest(),ed=canEditP(p),last=gestCount()<=1,on=hasGest(p),arm=S.confirm==='pin:'+p.id;
  const mine=Object.values(S.chars).filter(c=>(p.persos||[]).includes(c.id)&&vis(c)).sort((a,b)=>(a.court||'').localeCompare(b.court||''));
  const opt=(lab,body)=>`<div class="optrow2"><span>${lab}</span>${body}</div>`;
  let h=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Fiche de ${esc(p.nom)}"><div class="in"><div class="shd"><h2>${esc(p.nom)}</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>
    <div class="frow"><div class="field"><label for="pn-${p.id}">Nom</label>${ed?`<input id="pn-${p.id}" type="text" data-pf="nom" data-pid="${p.id}" value="${esc(p.nom)}">`:`<div class="ro2">${esc(p.nom)}</div>`}</div><div class="field"><label for="pr-${p.id}">Rôle</label>${lastMJ(p)?`<div class="ro2">MJ <span class="tag2">non modifiable</span></div><div class="muted small" style="margin-top:4px">Droits de gestion automatiques pour le MJ</div>`:G?`<select id="pr-${p.id}" data-pf="role" data-pid="${p.id}">${['Joueur','MJ'].map(r=>`<option${(p.role||'Joueur')===r?' selected':''}>${r}</option>`).join('')}</select>`:`<div class="ro2">${esc(p.role||'Joueur')}</div>`}</div></div>
    <div class="grp2">Personnages</div>${mine.length?`<div class="plist2">${mine.map(c=>`<button class="lrow" data-act="pcOpen" data-id="${esc(c.id)}"><span class="av2">${portrait(c)?`<img src="${portrait(c)}" alt="">`:esc((c.court||'?').slice(0,1))}</span><span class="lm"><span class="lt">${esc(c.court)}${c.cache?' <span class="tag2">masqué</span>':''}</span><span class="ls">${c.type}${c.race?' · '+esc(c.race):''}</span></span><span class="chev">›</span></button>`).join('')}</div>`:'<div class="muted small">Aucun personnage.</div>'}`;
  let o='';
  if(ed)o+=opt('Parti de la table',`<button class="tgb" data-act="partiToggle" data-pid="${p.id}" role="switch" aria-checked="${!!p.parti}" aria-label="Parti de la table"${lastMJ(p)?' disabled title="Il y a toujours au moins un MJ"':''}><span class="tg${p.parti?' on':''}"></span></button>`);
  if(G)o+=opt('Droits de gestion'+(p.role==='MJ'?' <span class="muted small">(d\'office pour le MJ)</span>':''),`<button class="tgb" data-act="gestToggle" data-pid="${p.id}" role="switch" aria-checked="${on}" aria-label="Droits de gestion"${p.role==='MJ'?' disabled title="Le MJ a les droits de gestion d\'office"':on&&last?' disabled title="Il faut toujours au moins une personne avec ces droits"':''}><span class="tg${on?' on':''}"></span></button>`);
  if(G&&pinOn()){const has=S.id.pins&&S.id.pins.has(p.id);o+=opt(`Code PIN <span class="pst2 ${has?'ok':'no'}">${has?'défini':'pas encore de PIN'}</span>`,has?(arm?`<button class="btn" style="color:var(--bad)" data-act="pinResetOk" data-pid="${esc(p.id)}">Confirmer</button>`:`<button class="btn ghost" data-act="pinReset" data-pid="${esc(p.id)}">Réinitialiser</button>`):'');}
  if(o)h+=`<div class="grp2">Options</div>${o}`;
  if(G&&p.id===realId())h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="asPlayer">Voir comme un joueur</button></div>`;
  if(p.role==='MJ')h+=`<div class="muted small" style="margin-top:8px">${lastMJ(p)?'Le rôle MJ ne se change pas depuis ce volet et il y a toujours au moins un MJ. ':''}Le MJ a les droits de gestion d'office. Jusqu'à la fin des développements, la gestion garde l'accès à tout.</div>`;
  if(G)h+=`<div class="danger2"><span>Zone sensible</span><button class="lnk-bad" data-act="pDel" data-pid="${p.id}">Supprimer le joueur</button></div>`;
  return h+`</div></div>`;}
function pcSheet(g){const c=S.chars[g.id];if(!c)return null;const ed=canEditC(c),G=isGest(),img=portrait(c),own=!!(S.ptr&&S.ptr[c.id]),ow=owners(c);
  const opt=(lab,body)=>`<div class="optrow2"><span>${lab}</span>${body}</div>`,ro=v=>`<div class="ro2">${v}</div>`;
  const sub=c.type+(c.race?' · '+esc(raceLabel(c)):'')+(c.type==='PJ'?(ow.length?' · joué par '+ow.map(p=>esc(p.nom)).join(', '):' · sans joueur'):(c.pj&&S.chars[c.pj]?' · rattaché à '+esc(S.chars[c.pj].court):''));
  let h=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(c.court)}"><div class="in"><div class="shd">${img?`<button type="button" class="av2 big avz" data-act="fiImg" data-cid="${esc(c.id)}" aria-label="Agrandir le portrait de ${esc(c.court)}"><img src="${img}" alt=""></button>`:`<span class="av2 big">${esc((c.court||'?').slice(0,1))}</span>`}<div style="flex:1;min-width:0"><h2>${esc(c.court)}</h2><div class="muted small">${sub}</div></div><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>
    <div class="frow"><div class="field"><label for="cc-${c.id}">Nom court</label>${ed?`<input id="cc-${c.id}" type="text" data-cf="court" data-id="${c.id}" value="${esc(c.court)}">`:ro(esc(c.court))}</div><div class="field"><label for="cn-${c.id}">Nom complet</label>${ed?`<input id="cn-${c.id}" type="text" data-cf="nom" data-id="${c.id}" value="${esc(c.nom)}">`:ro(esc(c.nom||'—'))}</div>
    <div class="field"><label for="csu-${c.id}">Surnom</label>${ed?`<input id="csu-${c.id}" type="text" data-cf="surnom" data-id="${c.id}" value="${esc(c.surnom||'')}" placeholder="La rose de velours" autocomplete="off">`:ro(esc(c.surnom||'—'))}</div>
    ${c.type==='PJ'&&!isHum(c)?`<div class="field"><label for="cim-${c.id}">Identité masquée</label>${ed?`<input id="cim-${c.id}" type="text" data-cf="idm" data-id="${c.id}" value="${esc(c.idm||'')}" placeholder="Nom parmi les humains" autocomplete="off">`:ro(esc(c.idm||'—'))}</div>`:''}
    <div class="field"><label for="cs-${c.id}">Statut</label>${ed?`<select id="cs-${c.id}" data-cf="statut" data-id="${c.id}">${Object.entries(STATUTS).map(([k,v])=>`<option value="${k}"${(c.statut||'actif')===k?' selected':''}>${v}</option>`).join('')}</select>`:ro(STATUTS[c.statut||'actif'])}</div>
    <div class="field"><label for="cr-${c.id}">Race</label>${ed&&(c.type==='PNJ'||!c.race)?`<select id="cr-${c.id}" data-cf="race" data-id="${c.id}"><option value="">— à préciser —</option>${(c.type==='PNJ'?pnRaces():Object.keys(RACES).sort((a,b)=>a.localeCompare(b,'fr'))).map(r=>`<option${r===c.race?' selected':''}>${esc(r)}</option>`).join('')}</select>`:ro(esc(c.race?raceLabel(c):'—'))}</div>
    <div class="field"><label for="cgn-${c.id}">Genre</label>${ed?`<select id="cgn-${c.id}" data-cf="genre" data-id="${c.id}">${[['','— à préciser —'],['m','Masculin'],['f','Féminin']].map(([v,l])=>`<option value="${v}"${(c.genre||'')===v?' selected':''}>${l}</option>`).join('')}</select>`:ro(c.genre==='f'?'Féminin':c.genre==='m'?'Masculin':'—')}</div>
    ${c.type==='PNJ'?`<div class="field"><label for="crg-${c.id}">Rang</label>${ed?`<select id="crg-${c.id}" data-cf="rang" data-id="${c.id}">${[...new Set([...pnjRangs(),rangOf(c)])].map(r=>`<option${rangOf(c)===r?' selected':''}>${esc(r)}</option>`).join('')}</select>`:ro(esc(rangOf(c)))}</div>`:`<div class="field"><label>Rang</label>${ro(esc(rangOf(c)))}</div>`}
    ${c.type==='PNJ'&&c.race===HUMAIN&&!isFeal(c)?`<div class="field" style="grid-column:1/-1"><label class="chk"><input type="checkbox" data-cfeal="${c.id}"${c.feal?' checked':''}${ed?'':' disabled'}> Féal <span class="muted small">(humain au courant de l'existence des fées et qui leur est favorable)</span></label></div>`:''}
    ${c.type==='PJ'?`<div class="field" style="grid-column:1/-1"><label for="co-${c.id}">Joué par</label>${ed?`<select id="co-${c.id}" data-owner="${c.id}"><option value="">— personne —</option>${playersSorted().filter(p=>!p.parti||ow.some(o=>o.id===p.id)).map(p=>`<option value="${p.id}"${ow[0]&&ow[0].id===p.id?' selected':''}>${esc(p.nom)}</option>`).join('')}</select>`:ro(ow.map(p=>esc(p.nom)).join(', ')||'—')}</div>`:`<div class="field" style="grid-column:1/-1"><label for="cp-${c.id}">Rattaché au PJ</label>${ed?`<select id="cp-${c.id}" data-cf="pj" data-id="${c.id}"><option value="">— aucun —</option>${Object.values(S.chars).filter(x=>x.type==='PJ').sort((a,b)=>(a.court||'').localeCompare(b.court||'')).map(x=>`<option value="${x.id}"${c.pj===x.id?' selected':''}>${esc(x.court)}</option>`).join('')}</select>`:ro(c.pj&&S.chars[c.pj]?esc(S.chars[c.pj].court):'—')}</div>`}</div>`;
  if(g.own!==undefined){const np=S.players[g.own];h+=`<div class="confirm2"><div><b>Confier ${esc(c.court)} à ${np?esc(np.nom):'personne'} ?</b></div><div class="muted small">${ow.length?esc(ow.map(p=>p.nom).join(', '))+' ne le verra plus dans ses personnages.':''}${np?' '+esc(np.nom)+' pourra le modifier.':' Le personnage n\'aura plus de joueur.'}</div><div class="actions"><button class="btn ghost" data-act="ownNo">Annuler</button><button class="btn pri" data-act="ownOk">Confirmer</button></div></div>`;}
  let o='';
  if(ed&&c.type==='PJ')o+=opt('Masquer aux autres',`<button class="tgb" data-act="cHide" data-id="${c.id}" role="switch" aria-checked="${!!c.cache}" aria-label="Masquer aux autres"><span class="tg${c.cache?' on':''}"></span></button>`);
  if(ed&&c.type==='PJ')o+=opt('Exclure de la moyenne d\'XP',`<button class="tgb" data-act="cMoy" data-id="${c.id}" role="switch" aria-checked="${!!c.horsMoyenne}" aria-label="Exclure de la moyenne d'XP"><span class="tg${c.horsMoyenne?' on':''}"></span></button>`);
  if(canPortrait(c))o+=opt('Portrait',`<span style="display:flex;gap:6px"><label class="btn ghost" style="cursor:pointer">Changer<input type="file" accept="image/*" data-ptrfile="${c.id}" hidden></label>${own?`<button class="btn ghost" data-act="ptrDel" data-id="${c.id}">Retirer</button>`:''}</span>`);
  if(o)h+=`<div class="grp2">Options</div>${o}`;
  if(!g.sh)h+=`<div class="actions" style="margin-top:12px"><button class="btn pri" data-act="pcSheetGo" data-id="${c.id}">Ouvrir la fiche ›</button></div>`;
  if(G)h+=`<div class="danger2"><span>Zone sensible</span><button class="lnk-bad" data-act="cDel" data-id="${c.id}">Supprimer le personnage</button></div>`;
  return h+`</div></div>`;}
function newPSheet(){return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Nouveau joueur"><div class="in"><div class="shd"><h2>Nouveau joueur</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div><div class="frow"><div class="field"><label for="np-n">Nom</label><input id="np-n" type="text" data-np="nom" value="${esc(S.newP.nom)}"></div><div class="field"><label for="np-r">Rôle</label><select id="np-r" data-np="role">${['Joueur','MJ'].map(r=>`<option${S.newP.role===r?' selected':''}>${r}</option>`).join('')}</select></div></div><div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="addP">Ajouter</button></div></div></div>`;}
function viewRules(){
  const rows=[['Féerie',`(niveau suivant) × ${RULES.feerie}`],['Masque',`(niveau suivant) × ${RULES.masque}`],['Tricherie','moyenne Féerie/Masque, arrondie à l\'inférieur (calculée)'],['Caractéristique',`(niveau suivant) × ${RULES.carac}, sauf 1→2 qui coûte ${RULES.carac12}`],['Compétence',`(niveau suivant) × ${RULES.comp}`],['Compétence futile',`(niveau suivant) × ${RULES.fut}`],['Fortune',`(niveau suivant) × ${RULES.fortune} ; le détail donne la situation, l\'argent de poche, l\'argent disponible par mois et le modificateur de Classe et Entregent. Dépenser plus du double du mois en moins de deux mois fait perdre un rang`],['Atout féerique',`${RULES.atout} points par atout. Chaque race propose 4 atouts, plus « Spécialités typiques » qui offre les 2 spécialités typiques de la race (ou 2 spécialités à choisir). Le compteur affiche acquis / listés (un atout ajouté à la main compte dans les listés). Pas d'atout pour les humains`],['Spécialité',`${RULES.spec} points (${RULES.mauvaiseMain} pour Mauvaise main, ${RULES.specFut} pour une compétence futile). Elle se rattache à une compétence (à un profil pour un PNJ), donne +1 et ne demande aucun rang ; * = obligatoire pour agir dans ce domaine. Tant que des spécialités comptées restent à rattacher, en choisir une est gratuit`],['Points de personnage (PP)','atteindre le rang N d\'un profil ajoute N PP sur ce profil (automatique depuis le 16/11/2026). Toucher « PP » pour en dépenser : la dépense est inscrite dans l\'historique des achats et peut être annulée'],['Profil d\'un PNJ',`(niveau suivant) × ${RULES.prof}, soit quatre compétences à la fois`],['Rang de profil (PJ)','moyenne arrondie à l\'inférieur des quatre compétences'],['Masque et résistances','+1 de résistance physique et psychique par niveau de Masque au-delà de 5'],['Palier Profond',`Féerie ${STAGES[0].feerie}, une caractéristique ${STAGES[0].carac}, une compétence ${STAGES[0].comp}, ${STAGES[0].atout} atouts féeriques`],['Palier Légendaire',`Féerie ${STAGES[1].feerie}, une caractéristique ${STAGES[1].carac}, une compétence ${STAGES[1].comp}, ${STAGES[1].atout} atouts féeriques (après Profond)`],['Caractéristique accrue','une seule par personnage : +1 au score, au-delà du maximum (ex. Esprit 6/9 devient 7/10). Le coût d\'évolution et les paliers Profond et Légendaire se calculent sur la base, sans le bonus. Se coche dans le détail de la caractéristique'],['Rang PJ : éligibilité',`seules les compétences dont le niveau max est de ${PALIER_MAX} ou plus comptent pour Profond et Légendaire`],['Arts obscurs','compétences débloquées par le MJ sur prérequis de compétences'],['Autres dépenses','Fief, Triche, PNJ : montant libre, sans maximum ni évolution'],['Rang d\'héritage','une étoile par gain de type Scénario (30 au maximum), corrigeable à la main'],['Secrets de l\'univers','titre +1, indice +1, vérité mineure +2, vérité majeure +3 ; +4 quand toutes les vérités majeures d\'un secret sont découvertes. XP de nature Groupe pour tous les PJ actifs, inscrite au journal d\'XP (type « Secret de l\'univers »)'],['Races de l\'univers','+1 quand toutes nos connaissances sur une race sont réunies (fiche complète). XP de nature Groupe pour tous les PJ actifs, inscrite au journal d\'XP (type « Race de l\'univers »)'],['Sessions de jeu','chaque gain d\'XP est saisi dans une session (type, intitulé, date) ; les secrets et les races complétées peuvent y être rattachés. Une session ne peut être supprimée tant que des découvertes y sont rattachées'],['Part des PNJ','PNJ rattaché à un PJ : 50 % des gains du PJ dans la session s\'il a participé activement, 25 % sinon, arrondi à l\'inférieur ; sessions datées à partir du rattachement'],['Planning','chaque joueur coche ses disponibilités en journée et en soirée ; créneaux préférés : samedi soir et dimanche journée. « Prochaines dates » : dates validées, créneaux où toute la table est libre, dates proposées que chacun accepte ou décline ; la prochaine date validée s\'affiche sur l\'accueil. Si un MJ décline une proposition, elle est refusée et ne peut pas être validée. Des créneaux consécutifs libres pour toute la table (par exemple samedi soir et dimanche journée) forment une seule date'],['Alerte de gains','PJ actif dont le total est inférieur d\'au moins '+GAP+' XP à la moyenne du groupe'],['Rattrapage d\'XP','sur la ligne d\'un PJ en alerte, la flèche ↑ ouvre une attribution pré-remplie (type Autre, nature Individuel, date du jour) du nombre d\'XP qui le ramène au total du PJ juste devant. Rien n\'est attribué automatiquement, tout reste modifiable. Hors session de jeu, sans part pour les PNJ rattachés']];
  const tabs=`<h2 style="margin-top:4px">Règles</h2><div class="seg rgtabs" role="group" aria-label="Sous-onglets des règles"><button type="button" data-act="rgTab" data-v="" aria-pressed="${S.rgTab!=='img'}">Règles</button><button type="button" data-act="rgTab" data-v="img" aria-pressed="${S.rgTab==='img'}">Règles en images</button></div>`; /* import Kanka fin : 2 sous-onglets */
  if(S.rgTab==='img')return tabs+rgPane();
  return tabs+`<div class="card">${rows.map(r=>`<div class="ev"><div class="t" style="min-width:140px">${esc(r[0])}</div><div class="muted" style="text-align:right">${esc(r[1])}</div></div>`).join('')}</div>${typeof fgRules==='function'?fgRules():''}
  <div class="muted small" style="margin-top:12px">Ces valeurs viennent de l'écran Paramètres${isGest()?'':', modifiable par les personnes ayant les droits de gestion'}.</div><div class="actions" style="margin-top:8px"><button class="btn" data-act="tab" data-v="params">Paramètres ›</button></div><div class="actions" style="margin-top:12px"><button class="btn ghost" data-act="logout">Changer de code (se déconnecter)</button></div>`;
}


/* Fiche : effets de race et d'atouts (moteur de bonus) */
function fxCard(c,L,fm){if(!L.length)return '';
  const note=c.fx?`Acquis d'office avec la race ${esc(c.race)}${L.some(e=>e.kind==='at')?' et les atouts pris':''}.${L.some(e=>fxQ(e.quand)==='d')?' Les effets qui ne s\'appliquent pas à la forme choisie sont grisés.':''}`:`À titre d'information : ce personnage a été créé avant le moteur de bonus. La gestion peut l'y faire entrer depuis Paramètres › Bonus.`;
  return `<h2>Effets de race et d'atouts</h2><div class="card">${c.fx?'':`<div class="muted small" style="margin-bottom:4px">${note}</div>`}${L.map(e=>`<div class="fxe${fxOn(e,fm)?'':' off'}">${fxChip(e)} <b>${esc(e.src)}</b><div class="s">${FX_KIND[e.kind]} · ${FX_Q[fxQ(e.quand)]}${e.t!=='rap'&&e.txt?' · '+esc(e.txt):''}${e.t==='jet'?' · non ajouté aux rangs':e.t==='perm'&&c.fx?(fxInteg(e)?' · compris dans la valeur enregistrée':' · ajouté à la valeur affichée'):''}</div></div>`).join('')}</div>`;}

/* Lot 4 : traits, titre du profil, Contacts et points de personnage */
function traitsCard(c){const T=traitsOf(c),ed=canEditC(c);if(!T.length&&!ed)return '';
  return `<h2>Traits de caractère</h2><div class="card"><div class="prof-head" style="margin:0">${T.length?`<div class="fxl" style="margin:0">${T.map(([n,s])=>`<span class="rchip">${esc(n)} <small class="muted">· ${esc(s)}</small></span>`).join('')}</div>`:'<span class="muted small">Aucun trait renseigné.</span>'}${ed?`<button class="btn ghost" data-act="trOpen" data-id="${esc(c.id)}">Modifier</button>`:''}</div></div>`;}
function titreLine(c,pr){const P=prOf(pr.nom),got=ppBought(c).some(a=>a.ppel.id==='titre:'+pr.nom),sum=ppSum(c,pr);
  return `<div class="ptl">${ICON.medaille||''}<span>${esc(P.titre.nom)}</span>${got?'<span class="pill acc">acquis</span>':`<span class="num muted">${sum} / ${PPT_PTS}</span>`}</div>`;}
function ppFullBlock(c){const B=ppBought(c),free=(c.achats||[]).filter(a=>(a.key||'').startsWith('pp:')&&!a.ppel);
  let h=`<h2>Contacts et points de personnage</h2><div class="card"><div class="fgrid">${(c.profils||[]).map(pr=>`<div class="fr"><span>PP ${esc(profLab(pr.nom,c))}</span><b class="num">${esc(ppFmt(ppHave(pr)))}</b></div>`).join('')}</div>`;
  const G=[['A','Activités'],['E','Possessions'],['L','Langues'],['C','Contacts'],['T','Famille, titres et statuts']];
  for(const [r,l] of G){const L=B.filter(a=>a.ppel.rub===r);if(!L.length)continue;
    h+=`<div class="fsub">${l}</div>`+L.map(a=>{const x=a.ppel,bits=[x.fin?(ppGd(x.fin)?"jusqu'au "+ppGd(x.fin):'terminé'):'',ppBits(x)].filter(Boolean);
      const fx=fxOf(c).filter(e=>e.kind==='pp'&&e.src===x.nom);return `<div class="fi"><b>${esc(x.nom)}</b>${bits.length?` <span class="muted small">· ${bits.map(esc).join(' · ')}</span>`:''}${fx.map(e=>`<div class="fxs">Effet : ${esc(fxLabel(e))}${e.t!=='rap'&&e.txt?' · '+esc(e.txt):''}</div>`).join('')}</div>`;}).join('');}
  if(free.length)h+=`<div class="fsub">Autres dépenses de PP</div>`+free.map(a=>`<div class="fi"><span class="small">${esc(a.label)}</span></div>`).join('');
  if(!B.length&&!free.length)h+='<div class="muted small" style="margin-top:6px">Aucune acquisition en points de personnage.</div>';
  const fo=ppFortSrc(c);
  if(fo.length)h+=`<div class="muted small" style="margin-top:8px">Fortune ${lv(c,'fortune')} · dont ${fo.map(esc).join(', ')}.</div>`;
  return h+'</div>';}

const ppFortSrc=c=>c.type==='PJ'?ppBought(c).filter(a=>!a.ppel.fin&&ppElFort(a.ppel)).map(a=>{const x=a.ppel,v=ppElFort(x);return x.nom+' '+(x.rub==='A'&&x.opt==='p'?v+' (principale)':'+'+v+(x.rub==='A'?' (secondaire)':''));}):[];

/* ---------- Lot 4 bis : liens de la fiche de personnage ---------- */
/* Race du personnage : lien vers sa fiche ; pour la gestion, picto si la race d'un PJ visible a encore des blocs fermés */
function raceLk(c){const cr=crBySing(c.race),lab=raceLabel(c);if(!cr)return esc(lab);return lk({t:'race',id:cr.id},lab)+(c.type==='PJ'&&raceIncoh(c)&&canEdit()?'<span class="sigx" title="PJ visible de tous, mais sa race a encore des éléments fermés (voir Paramètres › Données)" aria-label="Incohérence de visibilité">!</span>':'');}
/* Joué par (joueurs en lien) ; féal : PJ de rattachement en lien */
function whoLineL(c){if(c.type==='PNJ'){const pj=c.pj&&S.chars[c.pj];return pj?'Féal de '+lk({t:'perso',id:pj.id},pj.court):'PNJ';}
  const o=owners(c);return o.length?'joué par '+o.map(p=>lk({t:'joueur',id:p.id},p.nom)).join(', '):'Personnage joueur';}
/* Féaux d'un PJ (retour du lien « Féal de … ») : seulement ceux que la personne voit */
function fealLine(c){if(c.type!=='PJ')return '';const L=pnjOf(c).filter(vis);return L.length?`<div class="muted small">${L.length>1?'Féaux':'Féal'} de ${esc(c.court)} : ${L.map(y=>lk({t:'perso',id:y.id},y.court)).join(', ')}</div>`:'';}
/* Nom d'un pouvoir (lien) suivi de son sous-type en texte */
function pwLk(x,i,id){id=id||pwSlots(x)[i];if(!id||id==='?')return esc(pwFull(x,i));const nm=pwName(id),full=pwFull(x,i);return lk({t:'pw',id},nm)+esc(full.slice(nm.length));}
/* Capacité naturelle [nom, desc, sous-type] : nom en lien, sous-type en texte */
const capLk=e=>lkCap(e[0])+(e[2]?' ('+esc(e[2])+')':'');
/* ---------- Lot 4 bis : journal d'XP ---------- */
/* Ligne de secret ou de race complétée : intitulé en lien (identifiant déjà sur la ligne) ; lignes reprises du tableur en texte */
function jTitle(e){if(e.secret&&e.secret.n!=null)return lk({t:'secret',n:e.secret.n,k:e.secret.k,i:e.secret.i||0},e.titre||'');
  if(e.creature&&e.creature.id)return lk({t:'race',id:e.creature.id},e.titre||'');return esc(e.titre||'');}
/* Libellé du type : « Créature de l'univers » s'affiche « Race de l'univers » (donnée enregistrée inchangée) */
const evTypeL=e=>{const t=evType(e);return t===CRE_TYPE?"Race de l'univers":t;};
/* ==========================================================================
   Fiche de personnage en onglets (23/11/2026) : Progrès · Fiche · Féerie · Relations · Situation · Journaux
   Progrès = l'ancien onglet Progression, inchangé. Les ajouts en jeu (Relations, Situation, Journaux)
   sont des actions de jeu : joueur du personnage et gestion (canEditC), hors mode édition.
   ========================================================================== */
const SH_ICO={por:'<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-4 3.8-6 7-6s6 2 7 6"/>',prog:'<path d="M4 18l5-5 4 3 7-8"/><path d="M15 8h5v5"/>',fiche:'<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',feer:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',rel:'<circle cx="8.5" cy="9" r="3"/><circle cx="16" cy="10" r="2.5"/><path d="M3.5 19c.8-3 3-4.5 5-4.5s4.2 1.5 5 4.5M14 15.2c2.6-.4 4.6.9 5.5 3.8"/>',situ:'<path d="M4 20V10l8-5 8 5v10"/><path d="M9.5 20v-5h5v5"/>',jour:'<path d="M6 3.5h10a2 2 0 0 1 2 2v15H8a2 2 0 0 1-2-2z"/><path d="M6 17.5a2 2 0 0 1 2-2h10"/>'};
const SH_TABS=[['prog','Progrès'],['fiche','Fiche'],['feer','Féerie'],['rel','Relations'],['situ','Situation'],['jour','Carnets']]; /* UX1 : « Chronique » devient « Carnets » ; lot 2 : l'onglet Journaux devient « Chronique » (Quêtes / Journaux ; Feuilleton au lot 3) */
const shHasFee=c=>c.type==='PJ'&&!isHum(c);
const PN_TABS=[['por','Portrait'],['situ','Situation'],['rel','Relations']]; /* lot 4 : fiche PNJ ; féal : + Progression */
const shTabsOf=c=>c.type==='PNJ'?(isFeal(c)?[['prog','Progrès']].concat(PN_TABS):PN_TABS):SH_TABS.filter(([k])=>k!=='feer'||shHasFee(c));
function shTabOf(c){const L=shTabsOf(c);let t=S.shTab||L[0][0];if(t==='full')t='fiche';return L.some(x=>x[0]===t)?t:L[0][0];}
const shTabsBar=(c,tab)=>`<div class="tabs6" role="group" aria-label="Parties de la fiche" style="grid-template-columns:repeat(${shTabsOf(c).length},minmax(0,1fr))">${shTabsOf(c).map(([k,l])=>`<button type="button" data-act="shTab" data-v="${k}" aria-pressed="${tab===k}"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SH_ICO[k]}</svg>${l}</button>`).join('')}</div>`;
const SHFOLD0={fut:true,lang:true,notab:true};
const shFolded=(k,empty)=>{const f=(S.shFold||{})[k];return f==null?(!!SHFOLD0[k]||!!empty):f;};
/* lot 4 : empty = encart vide, replié par défaut (Relations, Situation) */
function cBlk(k,title,sum,body,add,empty){const fold=shFolded(k,empty),id='cb-'+k;
  return `<section class="rblk"><div class="rbh"><button type="button" class="rbt" data-act="shFold" data-k="${k}"${empty?' data-e="1"':''} aria-expanded="${!fold}" aria-controls="${id}"><span class="tt"><span class="t">${title}</span>${sum!==''&&sum!=null?`<span class="n">${sum}</span>`:''}</span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button></div>${fold?'':`<div class="rbb" id="${id}">${body}${add||''}</div>`}</section>`;}
const shNone='<div class="muted small">—</div>';
/* lot 4 : encarts remplis d'abord, vides ensuite (ordre habituel conservé dans chaque groupe) */
const shOrder=L=>L.filter(x=>!x.e).concat(L.filter(x=>x.e)).map(x=>x.h).join('');
const srcChip=s=>s==='pp'?'<span class="srcb">PP</span>':s==='session'?'<span class="srcb j">session</span>':s==='feal'?'<span class="srcb">féal</span>':'<span class="srcb j">en jeu</span>';
const ppBits=x=>[PPOPT[x.opt]||'',x.fort!=null?'Fortune '+x.fort:'',x.fortS!=null?'Fortune +'+x.fortS:'',ppFxFort(x)?'Fortune +'+ppFxFort(x):'',x.spec?'spécialité '+x.spec:'',x.prec||''].filter(Boolean).join(' · ');
/* Recette lot C : élément en cours « depuis le … » ; terminé (activité remplacée, titre abandonné) grisé « jusqu'au … » ; abandon d'un titre ou d'un élément « Fortune +x » */
const ppGd=d=>d&&typeof chOk==='function'&&chOk(d)?chDateTxt(d):'';
const ppCanAb=(a,r)=>!a.ppel.fin&&!a.ppel.titre&&(r==='T'||(r!=='A'&&ppElFort(a.ppel)>0));
function ppLinesOf(c,r){const E=canEditC(c),L=ppBought(c).filter(a=>a.ppel.rub===r);
  return L.filter(a=>!a.ppel.fin).concat(L.filter(a=>a.ppel.fin)).map(a=>{const x=a.ppel,end=!!x.fin,dt=end?(ppGd(x.fin)?"jusqu'au "+ppGd(x.fin):x.finT==='ab'?'abandonné':'terminé'):(ppGd(x.debut)?'depuis le '+ppGd(x.debut):a.crea?'depuis la création':''),
    bits=[dt,ppBits(x)].filter(Boolean).join(' · ');
    const fk=(c.ppLk||{})[a.id];return `<div class="srow${end?' end':''}"><span><b>${esc(x.nom)}</b>${fk&&S.fiches[fk]?' → '+fi6Ref(fk):''}${bits?`<span class="d">${esc(bits)}</span>`:''}</span>${srcChip('pp')}${E&&ppCanAb(a,r)?`<button type="button" class="lnk" data-act="ppAb" data-id="${esc(c.id)}" data-a="${esc(a.id)}">Abandonner / retirer</button>`:''}</div>`;});}
/* ---------- Lot 2 bis (24/11/2026) : illustration de l'onglet Fiche ----------
   PJ fée : une illustration par forme, selon le sélecteur, distinctes du portrait (cartes, médaillons) ; autres personnages : le portrait seul.
   Illustration manquante : cadre vide (avec « Ajouter » pour le joueur du personnage et la gestion). */
const illMasqId=c=>'ill-masque-'+c.id,illDemId=c=>'ill-demasque-'+c.id;
function shIllu(c,fm){const two=c.type==='PJ'&&!isHum(c),mq=two&&fm!=='d',id=two?(mq?illMasqId(c):illDemId(c)):c.id,src=two?((S.ptr&&S.ptr[id])||null):portrait(c);
  const lab=two?(mq?'forme masquée':'forme démasquée'):'',full=c.court+(lab?' · '+lab:''),can=canPortrait(c);
  const inp=`<input type="file" accept="image/*" data-ptrfile="${esc(id)}" data-plab="${esc(full)}" hidden>`;
  if(src)return `<div class="fibigw shill">${bigImg(id,src,full)}${can?`<div style="margin-top:6px"><label class="edl" style="cursor:pointer">${ICON.crayon} Changer l'illustration${lab?' ('+esc(lab)+')':''}${inp}</label></div>`:''}</div>`;
  return `<div class="fibigw shill">${can?`<label class="addimg" aria-label="Ajouter l'illustration${lab?' ('+esc(lab)+')':''}">+ Image${lab?' <span class="muted small">('+esc(lab)+')</span>':''}${inp}</label>`:''}</div>`;}
/* ---------- onglets Fiche et Féerie : reprise de l'ancienne « Fiche complète », en blocs ---------- */
function viewSheetTab(c,tab){
  if(tab==='rel')return viewRelations(c);
  if(tab==='situ')return viewSituation(c);
  if(tab==='jour')return jrView(c); /* lot 2 (fiches.js) */
  const fm=S.forme||'d',fxl=fxOf(c),x=raceRecOf(c),fee=shHasFee(c);let h='';
  const val=n=>`<b class="num">${n}</b>`,row=(a,b)=>`<div class="fr"><span>${a}</span>${val(b)}</div>`;
  const fxLines=(k,nom)=>fxl.filter(e=>e.kind===k&&nrmA(e.src)===nrmA(nom)).map(e=>`<div class="fxs${fxOn(e,fm)?'':' off'}">Effet : ${esc(fxLabel(e))}${fxQ(e.quand)==='d'?' · démasqué seulement':''}${e.t!=='rap'&&e.txt?' · '+esc(e.txt):''}</div>`).join('');
  const item=(nom,desc,fx)=>`<div class="fi"><b>${esc(nom)}</b>${desc?`<div class="s">${esc(desc)}</div>`:''}${fx||''}</div>`;
  const spl=key=>{const L=specsOf(c).filter(y=>y.cible===key);return L.length?`<div class="fsp">${L.map(y=>{const i=specInfo(y.nom);return esc(y.nom)+(i&&i[2]?'*':'');}).join(', ')}</div>`:'';};
  if(!isHum(c))h+=`<div class="formesw"><span>Forme ${fm==='d'?'démasquée':'masquée'}</span><button class="tgb" data-act="forme" data-v="${fm==='d'?'m':'d'}" role="switch" aria-checked="${fm==='d'}" aria-label="Forme démasquée"><span class="tg${fm==='d'?' on':''}"></span></button></div>`; /* UX1 : interrupteur */
  if(tab==='fiche')h+=shIllu(c,fm); /* UX1 : âge dans le bloc « Âge et traits » */
  if(tab==='fiche'){
    const T=traitsOf(c);
    h+=cBlk('trt','Âge et traits',T.length?String(T.length):'',chAgeBlk(c)+(T.length?`<div class="fxl">${T.map(([n,s])=>`<span class="rchip">${esc(n)} <small class="muted">· ${esc(s)}</small></span>`).join('')}</div>`:'')||shNone,canEditC(c)?`<div class="relbtns" style="justify-content:flex-end"><button type="button" class="ibtn sm" data-act="trOpen" data-id="${esc(c.id)}" aria-label="Modifier les traits">${ICON.crayon}</button></div>`:''); /* UX1 ; lot 4 : modifiables ici seulement */
    h+=cBlk('der','Caractéristiques dérivées','',`<div class="dg">`+derived(c,fm).map(([n,v,b,src])=>{const tip=derFormula(c,fm,n);
      const ab=(src||[]).map(y=>{const m=y.match(/^([+−-]?\d+)\s+(.*)$/);return m?m[1]+' '+m[2].slice(0,4)+'.':y;}).join(' ');
      return `<button class="dt" data-act="derTip" data-n="${esc(n)}" title="${esc(tip)}" aria-label="${esc(tip)} : ${v}">${derIco(n)}<b class="num">${v}</b>${ab?`<small>${esc(ab)}</small>`:''}${S.derTip===n?`<span class="dtip" role="tooltip">${esc(tip)}</span>`:''}</button>`;}).join('')+`</div>`);
    h+=cBlk('car','Caractéristiques',fm==='d'?'forme démasquée':'forme masquée',`<div class="fgrid">${CARACS.map(n=>row(esc(n),lv(c,'carac:'+n)+(c.accru===n&&fm==='d'?1:0))).join('')}</div>`);
    h+=cBlk('prof',c.type==='PJ'?'Profils et compétences':'Profils',String((c.profils||[]).length),(c.profils||[]).map(pr=>{let b=`<div class="fr"><b>${esc(profLab(pr.nom,c))}</b><span class="muted">rang ${rankOf(c,pr)}</span></div>`;
      if(c.type==='PJ')b+=(pr.comps||[]).map(y=>row(esc(y.nom),lv(c,'comp:'+y.nom))+spl('comp:'+y.nom)).join('');
      else{b+=spl('prof:'+pr.nom);if(pr.subs&&pr.subs.length)b+=`<div class="fsp">${pr.subs.map(esc).join(', ')}</div>`;}
      return `<div class="pblk">${b}</div>`;}).join('')||shNone);
    if(c.type==='PJ'&&(c.futiles||[]).length)h+=cBlk('fut','Compétences futiles',String(c.futiles.length),c.futiles.map(f=>row(esc(f.nom),lv(c,'fut:'+f.nom))+spl('fut:'+f.nom)).join(''));
    const L=ppLinesOf(c,'L');if(L.length)h+=cBlk('lang','Langues',String(L.length),L.join(''));
    return h;}
  /* Féerie */
  if(!fee)return h+shNone;
  const own=c.pw||[],pal=own.some(o=>o.i===7)?'Légendaire':own.some(o=>o.i===6)?'Profond':'';
  h+=cBlk('fm','Féerie et Masque',pal?'palier '+pal:'',row('Féerie',lv(c,'feerie'))+row('Masque',lv(c,'masque')));
  let pw='';if(x&&own.length)pw=[...own].sort((a,z)=>a.i-z.i).map(o=>{const p=pwCat(o.id),v=varOf(p,o.v||raceVarAt(x,o.i)),meta=[PW_LAB[o.i]?PW_LAB[o.i].toLowerCase():'',p.type?TYPE_L[p.type]||p.type:''].filter(Boolean).join(' · ');
      const fl=(L,t)=>(L||[]).map(e=>`<div class="fxs${fxOn(e,fm)?'':' off'}">Effet : ${esc(fxLabel(e))}${fxQ(e.quand)==='d'?' · démasqué seulement':''}${v?` <span class="muted">· ${t}</span>`:''}</div>`).join('');
      return `<div class="fi fil">${illThumb('pw',o.id,48)}<div><b>${pwLk(x,o.i,o.id)}</b>${meta?` <span class="muted small">${esc(meta)}</span>`:''}${p.desc?`<div class="s">${esc(p.desc)}</div>`:''}${fl(p.fx,'commun')}${v?fl(v.fx,'sous-type'):''}</div></div>`;}).join('');
  h+=cBlk('pw','Pouvoirs',`${own.length} pouvoir${own.length>1?'s':''} sur 8 possibles`,pw||'<div class="muted small">Aucun pouvoir choisi.</div>');
  if(x){const av=(x.av||[]).filter(e=>e&&e[0]),dv=(x.dv||[]).filter(e=>e&&e[0]);
    h+=cBlk('avdv','Avantages et désavantages',`${av.length} + ${dv.length}`,(av.length?`<div class="fsub">Avantages</div>`+av.map(e=>item(e[0],e[1],fxLines('av',e[0]))).join(''):'')+(dv.length?`<div class="fsub">Désavantages</div>`+dv.map(e=>item(e[0],e[1],fxLines('dv',e[0]))).join(''):'')||shNone);
    const capL=(x.cap||[]).filter(e=>e&&e[0]);
    const cap=capL.map(e=>{const cid=capIdByName(S.capacites||{},e[0]),th=cid?illThumb('cap',cid,48):'',nm=capLk(e);return th?`<div class="fi fil">${th}<div><b>${nm}</b>${e[1]?`<div class="s">${esc(e[1])}</div>`:''}${fxLines('cap',e[0])}</div></div>`:`<div class="fi"><b>${nm}</b>${e[1]?`<div class="s">${esc(e[1])}</div>`:''}${fxLines('cap',e[0])}</div>`;}).join('')+(c.accru?`<div class="fi"><b>${accLk(c.accru)}</b><div class="fxs${fm==='d'?'':' off'}">Effet : ${esc(c.accru)} +1 · démasqué seulement</div></div>`:'')
      +(c.capx&&c.capx.nom?`<div class="fi"><b>${capLk([c.capx.nom,'',c.capx.v])}</b><div class="s">Choix définitif de la création</div>${fxLines('cap',c.capx.nom)}</div>`:''); /* lot C */
    h+=cBlk('cap','Capacités naturelles',String(capL.length+(c.accru?1:0)+(c.capx&&c.capx.nom?1:0)),cap||shNone);
    const at=atoutsOf(c).filter(a=>a&&a.nom);
    h+=cBlk('at','Atouts féeriques',String(at.length),at.map(a=>{const d=(x.at||[]).find(e=>e&&nrmA(e[0])===nrmA(a.nom));
      /* lot 4 : sous l'atout « Spécialités typiques », les 2 spécialités de la race (fiche de race, onglet Création) */
      const ty=isTyp(a.nom)?((RACES[c.race]||{}).t||[]).filter(e=>e&&e[0]):null;
      const tyH=ty?`<div class="fsp">${ty.length?ty.map(([sp,cp])=>esc(sp)+(cp?` <span class="muted">(${esc(cp)})</span>`:'')).join(', '):'<span class="muted">2 spécialités à rattacher</span>'}</div>`:'';
      return item(a.nom,d&&d[1],fxLines('at',a.nom)+tyH);}).join('')||shNone);}
  return h;}
/* ---------- Situation ---------- */
const SITU=[['titres','Titres','Titre obtenu en jeu'],['fiefs','Fiefs','Fief'],['familles','Familles','Famille'],['orgs','Organisations','Organisation'],['poss','Possessions courantes','Possession'],['possN','Possessions notables','Possession notable'],['lieux','Résidence et lieux','Lieu']]; /* lot 4 : « lieux » pour les PNJ ; lot 6 : aussi pour les PJ (nature résidence / propriétaire / autre) */
const situOf=c=>c.situ||{};
function situRows(c,k){const E=canEditC(c);return (situOf(c)[k]||[]).map(e=>`<div class="srow"><span>${k==='lieux'?situLieuH(e):situNm(e)}${k==='orgs'&&e.role?` <span class="muted">· ${esc(e.role)}</span>`:''}${e.note?`<span class="d">${esc(e.note)}</span>`:''}</span>${E?`<button type="button" class="ibtn sm" data-act="situEd" data-k="${k}" data-i="${esc(e.id)}" aria-label="Modifier ${esc(e.nom)}">✎</button>`:''}</div>`);}
function viewSituation(c){let h='';const E=canEditC(c),add=(k,l)=>E?`<button type="button" class="addl" data-act="situEd" data-k="${k}">+ ${l}</button>`:'';
  if(c.type==='PJ'){const f=lv(c,'fortune'),F=FORTUNE[f];h+=`<div class="fortl"><span>Fortune <b class="num">${f}</b>${F?` · <b>${esc(F[0])}</b>`:''}</span></div>`;} /* UX1 : une ligne */
  const B=[],A=ppLinesOf(c,'A');B.push({e:!A.length,h:cBlk('act','Activités',String(A.length),A.join('')||shNone,'',!A.length)});
  for(const [k,l,al] of SITU){if(k==='fiefs'&&c.type==='PJ')continue;
    if(k==='titres'&&c.type==='PJ'){const ti=situTitIds(c),TR=ogSitRows(c,'titres'),FL=situOf(c).fiefs||[],FR=situRows(c,'fiefs'),used=new Set();let rows=ppLinesOf(c,'T');
      TR.forEach((r,i)=>{rows.push(r);FL.forEach((f,j)=>{if(f.titre&&f.titre===ti[i]){used.add(j);rows.push(`<div class="sfief">${FR[j]}</div>`);}});});
      FL.forEach((f,j)=>{if(!used.has(j))rows.push(FR[j]);});
      const n=rows.length;B.push({e:!n,h:cBlk('titres','Titres et fiefs',String(n),rows.join('')||shNone,E?`<div class="relbtns">${add('titres','Titre')}${add('fiefs','Fief')}</div>`:'',!n)});continue;}
    let rows=k==='orgs'||k==='titres'?ogSitRows(c,k):k==='familles'?faSitRows(c):situRows(c,k); /* lot 5 a : organisations et titres reliés */
    if(k==='titres')rows=ppLinesOf(c,'T').concat(rows);
    if(k==='poss')rows=ppLinesOf(c,'E').concat(situObjRows(c),rows); /* lot 6 : objets dont il est détenteur */
    B.push({e:!rows.length,h:cBlk(k,l,String(rows.length),rows.join('')||shNone,add(k,al),!rows.length)});}
  return h+shOrder(B);}
/* UX1 : identifiants des titres, dans l'ordre d'ogSitRows(c,'titres') */
function situTitIds(c){const T=ogTitles(c).filter(x=>!x.t.pp),ids=new Set(T.map(x=>x.t.id));return T.map(x=>x.t.id).concat(((c.situ||{}).titres||[]).filter(e=>!ids.has(e.id)).map(e=>e.id));}
function situTitOpts(c){const T=ogTitles(c).filter(x=>!x.t.pp),ids=new Set(T.map(x=>x.t.id));return T.map(x=>[x.t.id,ogRL(x.r,c)]).concat(((c.situ||{}).titres||[]).filter(e=>!ids.has(e.id)).map(e=>[e.id,e.nom]));}
/* ---------- Relations v2 (23/11/2026) : Contacts · Alliés · Ennemis · Autres jauges ----------
   Contacts / Alliés / Ennemis = PNJ de la liste (rang repris de sa fiche) ; contacts achetés en PP et contacts de groupe en texte ;
   jauge en cours affichée dans la section visée ; jauge pleine → « Valider ». Aucun coût ni gain d'XP / PP. */
const REL_NIV={ennemi:'Ennemi',neutre:'Neutre',contact:'Contact',allie:'Allié'};
const REL_OBJ={contact:['neutre','contact','vers contact','Contact'],allie:['contact','allie','vers allié','Allié']};
const relP=()=>S.relp||{};
const relTaille=(rang,obj)=>{const v=((relP().taille||{})[rang]||{})[obj];return v>0?+v:null;};
const relDiff=(rang,obj)=>{const v=((relP().diff||{})[rang]||{})[obj];return v===''||v==null?null:+v;};
const relRang=r=>{const p=r.pnj&&S.chars[r.pnj];return p?rangOf(p):(r.rang||'');};
const relPnjs=c=>Object.values(S.chars).filter(p=>p.type==='PNJ'&&vis(p)&&p.id!==c.id).sort((a,z)=>(a.court||'').localeCompare(z.court||''));
/* Correctif 26/11/2026 : contacts reliés aux PNJ (rattachement par nom, création du PNJ à la volée) */
function ctcMatch(nom){const n=nrm(nom);if(!n)return [];return Object.values(S.chars).filter(p=>p.type==='PNJ'&&[p.nom,p.court,p.surnom].some(v=>v&&nrm(v)===n));}
function ctcPnjOf(x){if(x.pnj&&S.chars[x.pnj])return x.pnj;if(x.noPnj)return null;const m=ctcMatch(x.prec);return m.length===1?m[0].id:null;}
function ctcNewPnj(nom){const nc=pnMake({nom:nom.trim(),race:HUMAIN,rang:pnjRangs()[0]||'Larbin',vis:'rev'});saveChar(nc);return nc;}
/* élément de PP « contact » : relié au PNJ du même nom, sinon fiche créée (nom seul) */
function ctcLinkX(x){if(!x||x.rub!=='C'||!(x.prec||'').trim()||x.pnj)return;const m=ctcMatch(x.prec);if(m.length===1)x.pnj=m[0].id;else if(!m.length)x.pnj=ctcNewPnj(x.prec).id;}
const pnjPickF=(f,pn,lab)=>`<div class="field"><label for="dk-pnj">${lab||'PNJ (liste de l\'appli)'}</label><select id="dk-pnj" data-dk="pnj"><option value="">— choisir —</option>${pn.map(x=>`<option value="${esc(x.id)}"${f.pnj===x.id?' selected':''}>${esc(x.court||x.nom)}</option>`).join('')}<option value="__new"${f.pnj==='__new'?' selected':''}>+ Créer un nouveau PNJ</option></select></div>${f.pnj==='__new'?fld('nnom','Nom du nouveau PNJ',f.nnom)+'<div class="muted small">Fiche créée avec le nom seul (Humain, rang '+esc(pnjRangs()[0]||'Larbin')+', révélée), à compléter ensuite.</div>':''}`;
function relsOf(c){const R=(c.rel||[]).filter(r=>r.pnj||r.grp).map(r=>({...r}));
  for(const a of ppBought(c).filter(a=>a.ppel.rub==='C')){const pid=ctcPnjOf(a.ppel);R.push({id:'pp:'+a.id,aid:a.id,virt:true,...(pid?{pnj:pid}:{}),nom:a.ppel.prec||a.ppel.nom,niv:'contact',src:'pp',note:pid?[a.ppel.nom,ppBits({...a.ppel,prec:''})].filter(Boolean).join(' · '):ppBits(a.ppel)});}
  for(const f of Object.values(S.chars).filter(f=>f.pj===c.id&&vis(f)))if(!R.some(r=>r.pnj===f.id&&r.niv==='allie'))R.push({id:'feal:'+f.id,pnj:f.id,virt:true,niv:'allie',src:'feal'});
  return R;}
/* lot 5 a : organisation commune comparée par fiche (sinon par nom), titres compris */
const relOrgName=(c,r)=>{const p=r.pnj&&S.chars[r.pnj];return p?ogCommon(c,p):'';};
function relOrgBonus(c,r){return relOrgName(c,r)?(relP().bonusOrg!=null&&relP().bonusOrg!==''?+relP().bonusOrg:1):0;}
const relName=r=>{const p=r.pnj&&S.chars[r.pnj];return p&&vis(p)?lk({t:'perso',id:p.id},p.court||p.nom):`<b>${esc(r.nom||(p&&(p.court||p.nom))||'?')}</b>`;};
const pbar=(f,n)=>`<span class="pbar" role="img" aria-label="${f} succès sur ${n}"><i style="width:${n?Math.min(100,Math.round(100*f/n)):0}%"></i></span>`;
function jaugeBox(c,E,j,head,acts){const full=(j.cases||0)>=j.taille;
  return `<div class="pend${j.done?' done':''}">${head}<div class="pbw">${pbar(j.cases||0,j.taille)}<small>${j.cases||0} / ${j.taille}${j.diffShow!=null?` · difficulté ${j.diffShow}`:''}</small></div>${j.done?'<div class="muted small">Jauge terminée.</div>':''}
    ${E&&!j.done?(full?`<div class="relbtns"><button type="button" class="btn pri sm" data-act="${acts.val}" data-id="${esc(acts.id||'')}" data-j="${esc(j.id)}">Valider${acts.valLab?' : '+acts.valLab:''}</button></div>`
      :`<div class="relbtns sx"><label class="small" for="rs-${esc(j.id)}">Succès</label><input id="rs-${esc(j.id)}" class="sxi" type="number" min="0" inputmode="numeric" data-rs="${esc(j.id)}" placeholder="0"><button type="button" class="btn pri sm" data-act="${acts.add}" data-id="${esc(acts.id||'')}" data-j="${esc(j.id)}">Ajouter</button>${acts.del?`<button type="button" class="btn ghost sm jclose" data-act="${acts.del}" data-id="${esc(acts.id||'')}" data-j="${esc(j.id)}">Fermer la jauge</button>`:''}</div>`)
      :E&&j.done&&acts.del?`<div class="relbtns"><button type="button" class="btn ghost sm" data-act="${acts.del}" data-id="${esc(acts.id||'')}" data-j="${esc(j.id)}">Retirer</button></div>`:''}</div>`;}
function relRow(c,r,E){const rk=relRang(r);
  const sub=r.grp?`<span class="srcb j">contact de groupe</span>${r.orig?' · '+esc(r.orig):''}`:r.src==='pp'?srcChip('pp'):r.src==='feal'?srcChip('feal'):'';
  return `<div class="relr"><div class="relh"><span>${relName(r)}${rk?` <span class="muted small">· ${esc(rk)}</span>`:''}</span><span class="rr"><span class="lvl ${r.niv}">${REL_NIV[r.niv]||''}</span>${E&&r.src==='pp'?`<button type="button" class="${r.pnj?'ibtn':'addl'}" data-act="relPP" data-id="${esc(r.aid)}" aria-label="Rattacher à un PNJ">${r.pnj?'✎':'Rattacher'}</button>`:''}${E&&!r.virt?`<button type="button" class="ibtn" data-act="${r.grp?'relGrp':'relEd'}" data-id="${esc(r.id)}" aria-label="Modifier">✎</button>`:''}</span></div>${sub||r.note?`<div class="muted small">${sub}${sub&&r.note?' · ':''}${r.note?esc(r.note):''}</div>`:''}</div>`;}
function viewRelations(c){const R=relsOf(c),E=canEditC(c);let h='';
  const pend=obj=>R.flatMap(r=>(r.jauges||[]).filter(j=>j.obj===obj).map(j=>{const bo=relOrgBonus(c,r),d=j.diff!=null&&j.diff!==''?+j.diff:relDiff(relRang(r),obj);
    return jaugeBox(c,E,{...j,diffShow:d!=null?d-bo:null},`<div class="relh"><span>${relName(r)} <span class="muted small">· ${esc(relRang(r))}</span></span><span class="tagp">en cours ${REL_OBJ[obj][2]}</span></div>${bo?`<div class="muted small">dont même organisation −${bo} (${esc(relOrgName(c,r))})</div>`:''}`,{id:r.id,add:'relAddS',del:'relJDel',val:'relVal',valLab:'devient '+REL_OBJ[obj][3].toLowerCase()});})).join('');
  const sec=(k,t,niv,obj,btns)=>{const L=R.filter(r=>r.niv===niv),P=obj?pend(obj):'',n=L.length;
    const em=!n&&!P;return {e:em,h:cBlk('rel-'+k,t,String(n)+(P?' + jauge en cours':''),(L.map(r=>relRow(c,r,E)).join('')||(P?'':shNone))+P,E?`<div class="relbtns">${btns}</div>`:'',em)};};
  const B=[];
  B.push(sec('contact','Contacts','contact','contact','<button type="button" class="addl" data-act="relNew" data-niv="contact">+ Contact</button><button type="button" class="addl" data-act="relGrp">+ Contact de groupe</button>'));
  B.push(sec('allie','Alliés','allie','allie','<button type="button" class="addl" data-act="relNew" data-niv="allie">+ Allié</button>'));
  B.push(sec('ennemi','Ennemis','ennemi',null,'<button type="button" class="addl" data-act="relNew" data-niv="ennemi">+ Ennemi</button>'));
  const O=c.jauges||[],QJ=jrRelJauges(c),nO=O.length+QJ.length; /* lot 2 : jauges de recherche des quêtes */
  B.push({e:!nO,h:cBlk('rel-autres','Autres jauges',String(nO),QJ.join('')+O.map(j=>jaugeBox(c,E,{...j,diffShow:j.diff!==''&&j.diff!=null?+j.diff:null},`<div class="relh"><span><b>${esc(j.nom)}</b></span></div>`,{add:'relOAdd',del:'relODel',val:'relOVal'})).join('')||(QJ.length?'':shNone),E?`<div class="relbtns"><button type="button" class="addl" data-act="relOJ">+ Autre jauge</button></div>`:'',!nO)});
  h+=shOrder(B);
  h+=`<div class="blkhd" style="justify-content:flex-end;margin-top:4px"><button type="button" class="qbtn" data-act="xpHelp" data-k="rel" aria-label="Aide sur les jauges">?</button></div>`;
  if((S.xpHelp||{}).rel)h+=`<div class="qtip2">Jauges : ouvertes à la demande du joueur ; après un jet fait à la table, on ajoute les succès (plusieurs d'un coup). Jauge pleine : « Valider ». Aucun coût en XP ni en PP.</div>`;
  return h;}
/* ---------- Journaux : remplacés au lot 2 par l'onglet Chronique (fiches.js, jrView) ---------- */
/* ---------- Fenêtres et actions des onglets Relations et Situation ---------- */
const SH_DLG=new Set(['situEd','relEd','relNew','relGrp','relOJ','relPP']);
const dlgHead=(t,sub)=>`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(t)}"><div class="in"><div class="shd"><h2 style="margin:0">${esc(t)}</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>${sub?`<div class="muted small" style="margin-bottom:8px">${sub}</div>`:''}`;
const fld=(k,l,v,ta)=>`<div class="field"><label for="dk-${k}">${l}</label>${ta?`<textarea id="dk-${k}" rows="${ta}" data-dk="${k}">${esc(v||'')}</textarea>`:`<input id="dk-${k}" type="${['taille','n','diff'].includes(k)?'number':'text'}"${['taille','n','diff'].includes(k)?' min="0" inputmode="numeric"':''} data-dk="${k}" value="${esc(v==null?'':v)}">`}</div>`;
const segF=(k,v,opts,l)=>`<div class="field"><label>${l}</label><div class="seg" role="group" aria-label="${esc(l)}">${opts.map(([o,t])=>`<button type="button" data-act="dlgSet" data-k="${k}" data-v="${o}" aria-pressed="${v===o}">${t}</button>`).join('')}</div></div>`;
const dlgFoot=(del,ok)=>`${S.dlg&&S.dlg.err?`<div class="bad small" role="alert">${esc(S.dlg.err)}</div>`:''}<div class="actions" style="margin-top:12px">${del?`<button class="btn ghost" data-act="${del}" style="margin-right:auto">${S.dlg&&S.dlg.conf?'Confirmer le retrait':'Retirer'}</button>`:''}<button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="${ok}">Enregistrer</button></div></div></div>`;
function shDlgSheet(g){const c=S.chars[g.cid];if(!c)return null;const f=g.f;
  if(g.kind==='situEd'){const L=SITU.find(s=>s[0]===g.k);return dlgHead((g.i?'Modifier : ':'Ajouter : ')+L[2].toLowerCase(),esc(c.court))+fld('nom','Nom',f.nom)+(g.k==='orgs'?fld('role','Rôle dans l\'organisation',f.role):'')+situFField(g.k,f.f)+(g.k==='fiefs'?`<div class="field"><label for="dk-titre">Titre</label><select id="dk-titre" data-dk="titre"><option value="">— sans titre —</option>${situTitOpts(c).map(([id,n])=>`<option value="${esc(id)}"${f.titre===id?' selected':''}>${esc(n)}</option>`).join('')}</select><div class="muted small" style="margin-top:4px">Titre absent de la liste : ajoute-le d'abord (« + Titre »).</div></div>`:'')+(g.k==='lieux'?situNatField(f.nats||[],f.natx||'','situNatT','data-dk="natx"'):'')+fld('note','Note',f.note,2)+dlgFoot(g.i?'situDel':'','situSave');}
  if(g.kind==='relPP'){const a=(c.achats||[]).find(x=>x.id===g.aid);if(!a||!a.ppel)return null;const cur=ctcPnjOf(a.ppel);
    return dlgHead('Contact acheté en PP',esc(c.court)+' · '+esc(a.ppel.nom)+(a.ppel.prec?' : '+esc(a.ppel.prec):''))+pnjPickF(f,relPnjs(c),'PNJ relié')
      +`${g.err?`<div class="bad small" role="alert">${esc(g.err)}</div>`:''}<div class="actions" style="margin-top:12px">${cur?'<button class="btn ghost" data-act="relPPDet" style="margin-right:auto">Détacher</button>':''}<button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="relPPSave">Enregistrer</button></div></div></div>`;}
  if(g.kind==='relNew'){const pn=relPnjs(c).filter(p=>!(c.rel||[]).some(r=>r.pnj===p.id&&r.niv===g.niv)),nw=f.pnj==='__new',p=!nw&&f.pnj&&S.chars[f.pnj],rk=p?rangOf(p):nw?(pnjRangs()[0]||'Larbin'):'',obj=REL_OBJ[g.niv]?g.niv:null;
    const miss=obj&&(p||nw)&&(relTaille(rk,obj)==null||relDiff(rk,obj)==null);
    return dlgHead('Ajouter : '+REL_NIV[g.niv].toLowerCase(),esc(c.court))+``+pnjPickF(f,pn)
      +(p?`<div class="field"><label>Rang (repris de sa fiche)</label><div class="inp ro">${esc(rk||'—')}</div></div>`:'')+fld('note','Note',f.note,2)
      +(obj&&(p||nw)?(miss?`<div class="muted small">Jauge ${REL_OBJ[obj][3].toLowerCase()} pour le rang ${esc(rk)} pas encore réglée dans les Paramètres : saisis-la pour ouvrir une jauge.</div><div style="display:flex;gap:8px"><div style="flex:1">${fld('taille','Jauge (cases)',f.taille)}</div><div style="flex:1">${fld('diff','Difficulté',f.diff)}</div></div>`:`<div class="muted small">Ouvrir une jauge : ${relTaille(rk,obj)} cases, difficulté ${relDiff(rk,obj)} (Paramètres, ${esc(rk)} · ${REL_OBJ[obj][3]}).</div>`):'')
      +`${g.err?`<div class="bad small" role="alert">${esc(g.err)}</div>`:''}<div class="actions" style="margin-top:12px"><button class="btn ghost" data-act="closeSheet">Annuler</button>${obj?`<button class="btn" data-act="relNewJ">Ouvrir une jauge</button>`:''}<button class="btn pri" data-act="relNewSave">Enregistrer</button></div></div></div>`;}
  if(g.kind==='relEd'){const r=(c.rel||[]).find(x=>x.id===g.id);if(!r)return null;return dlgHead(REL_NIV[r.niv]||'Relation',esc(r.pnj&&S.chars[r.pnj]?S.chars[r.pnj].court:r.nom||''))+fld('note','Note',f.note,2)+dlgFoot('relDel','relEdSave');}
  if(g.kind==='relGrp')return dlgHead(g.id?'Contact de groupe':'Nouveau contact de groupe',esc(c.court))+fld('nom','Intitulé (ex. Les druides)',f.nom)+fld('orig','Origine (ex. atout Ami des druides)',f.orig)+fld('note','Note',f.note,2)+dlgFoot(g.id?'relDel':'','relGrpSave');
  if(g.kind==='relOJ')return dlgHead('Autre jauge',esc(c.court))+fld('nom','Intitulé',f.nom)+`<div style="display:flex;gap:8px"><div style="flex:1">${fld('taille','Jauge (cases)',f.taille)}</div><div style="flex:1">${fld('diff','Difficulté',f.diff)}</div></div>`+dlgFoot('','relOSave');
  return null;}
function shCharAct(a,d){if(relpAct(a))return true;const c=S.chars[S.sel];
  if(a==='shFold'){S.shFold={...(S.shFold||{}),[d.k]:!shFolded(d.k,d.e==='1')};render();return true;}
  if(a==='situNatT'&&S.dlg&&S.dlg.f){const L=S.dlg.f.nats||[];S.dlg.f.nats=L.includes(d.v)?L.filter(x=>x!==d.v):L.concat([d.v]);render();return true;}
  if(a==='dlgSet'&&S.dlg&&S.dlg.f){S.dlg.f[d.k]=d.k==='pub'||d.k==='res'?d.v==='1':d.v;render();return true;}
  const OPEN=['situEd','relNew','relEd','relGrp','relOJ','relPP','relAddS','relOAdd','relVal','relJDel','relOVal','relODel'],SAVE=['situSave','situDel','relNewSave','relNewJ','relPPSave','relPPDet','relEdSave','relDel','relGrpSave','relOSave'];
  if(!OPEN.includes(a)&&!SAVE.includes(a))return false;
  const cc=OPEN.includes(a)?c:S.chars[S.dlg&&S.dlg.cid];if(!cc||!canEditC(cc))return true;
  const now=today(),g=S.dlg;
  const setC=fn=>{const n=clone(cc);fn(n);saveChar(n);};
  if(a==='situEd'){const e=d.i&&(situOf(cc)[d.k]||[]).find(x=>x.id===d.i);S.dlg={kind:'situEd',cid:cc.id,k:d.k,i:d.i||null,f:e?{nom:e.nom,role:e.role||'',note:e.note||'',res:!!e.res,nat:situNat(e),nats:situNats(e),natx:situNatX(e),f:e.f||'',titre:e.titre||''}:{nom:'',role:'',note:'',res:false,nat:'res',nats:['res'],natx:'',f:'',titre:''}};}
  else if(a==='situSave'){if(situSaveF(cc,g)){S.dlg=null;toast('Enregistré');render();return true;} /* lot 6 : objet ou lieu choisi dans Possessions */
    const fx=g.f.f&&S.fiches[g.f.f]&&situFk[g.k]?S.fiches[g.f.f]:null,nom=(g.f.nom||'').trim()||(fx?fx.nom:'');if(!nom){g.err='Le nom est obligatoire.';render();return true;}
    if(g.k==='lieux'){const nv=situNatV(g.f.nats,g.f.natx);if(!nv.nats.length&&!nv.natx){g.err='Coche au moins une nature ou précise le lien.';render();return true;}}
    setC(n=>{const s=n.situ={...(n.situ||{})},L=(s[g.k]||[]).slice(),v={nom,...((g.f.role||'').trim()&&g.k==='orgs'?{role:g.f.role.trim()}:{}),...((g.f.note||'').trim()?{note:g.f.note.trim()}:{}),...(g.k==='lieux'?situNatV(g.f.nats,g.f.natx):{}),...(g.k==='fiefs'?{titre:g.f.titre||''}:{}),f:fx?fx.id:undefined};
      const i=L.findIndex(x=>x.id===g.i);if(i>=0){L[i]={...L[i],...v,role:v.role,note:v.note,res:v.res,nat:v.nat,f:v.f};if(g.k==='lieux'){L[i].nats=v.nats;L[i].natx=v.natx;}if(g.k==='fiefs'&&!v.titre)delete L[i].titre;if(!v.f)delete L[i].f;}else{const nv={id:uid('s'),date:now,...v};if(!nv.f)delete nv.f;L.push(nv);}s[g.k]=L;}); /* lot 5 a : ajout sans fiche corrigé */S.dlg=null;toast('Enregistré');}
  else if(a==='situDel'){if(!g.conf){g.conf=true;render();return true;}setC(n=>{const s=n.situ={...(n.situ||{})};s[g.k]=(s[g.k]||[]).filter(x=>x.id!==g.i);});S.dlg=null;}
  else if(a==='relNew'){S.dlg={kind:'relNew',cid:cc.id,niv:d.niv,f:{pnj:'',nnom:'',note:'',taille:'',diff:''}};}
  else if(a==='relPP'){const x=(cc.achats||[]).find(y=>y.id===d.id);if(!x||!x.ppel)return true;const cur=ctcPnjOf(x.ppel);S.dlg={kind:'relPP',cid:cc.id,aid:x.id,f:{pnj:cur||(ctcMatch(x.ppel.prec).length?'':(x.ppel.prec?'__new':'')),nnom:x.ppel.prec||''}};}
  else if(a==='relPPSave'||a==='relPPDet'){const f=g.f;let pid=null;
    if(a==='relPPSave'){if(f.pnj==='__new'){const nm=(f.nnom||'').trim();if(!nm){g.err='Le nom du nouveau PNJ est obligatoire.';render();return true;}pid=ctcNewPnj(nm).id;}
      else{if(!f.pnj||!S.chars[f.pnj]){g.err='Choisis un PNJ dans la liste.';render();return true;}pid=f.pnj;}}
    setC(n=>{const x=(n.achats||[]).find(y=>y.id===g.aid);if(!x||!x.ppel)return;if(pid){x.ppel.pnj=pid;delete x.ppel.noPnj;}else{delete x.ppel.pnj;x.ppel.noPnj=true;}});S.dlg=null;toast(pid?'Contact relié':'Contact détaché');}
  else if(a==='relNewSave'||a==='relNewJ'){const f=g.f;
    if(f.pnj==='__new'){const nm=(f.nnom||'').trim();if(!nm){g.err='Le nom du nouveau PNJ est obligatoire.';render();return true;}
      if(a==='relNewJ'&&g.niv==='allie'){g.err='Un nouveau PNJ n\'est pas encore un contact : enregistre-le directement comme allié, ou ouvre d\'abord une jauge vers contact.';render();return true;}
      if(a==='relNewJ'){const rk0=pnjRangs()[0]||'Larbin';if(!(relTaille(rk0,g.niv)||parseInt(f.taille,10)>0)){g.err='Indique la taille de la jauge (nombre de cases).';render();return true;}}
      f.pnj=ctcNewPnj(nm).id;}
    const p=f.pnj&&S.chars[f.pnj];if(!p){g.err='Choisis un PNJ dans la liste.';render();return true;}
    const R=(cc.rel||[]).slice(),i=R.findIndex(r=>r.pnj===p.id&&r.niv!=='ennemi'||r.pnj===p.id&&g.niv==='ennemi');const note=(f.note||'').trim();
    if(a==='relNewSave'){setC(n=>{const L=(n.rel||[]).slice(),k=L.findIndex(r=>r.pnj===p.id);if(k>=0)L[k]={...L[k],niv:g.niv,...(note?{note}:{})};else L.push({id:uid('r'),pnj:p.id,niv:g.niv,date:now,...(note?{note}:{})});n.rel=L;});S.dlg=null;toast('Enregistré');}
    else{const obj=g.niv,rk=rangOf(p),cur=R.find(r=>r.pnj===p.id);
      if(obj==='allie'&&!(cur&&cur.niv==='contact')){g.err=(p.court||p.nom)+' n\'est pas encore un contact : ouvre d\'abord une jauge vers contact, ou enregistre-le directement comme allié.';render();return true;}
      const t=relTaille(rk,obj)||parseInt(f.taille,10),df=relDiff(rk,obj)!=null?relDiff(rk,obj):(f.diff===''?null:+f.diff);
      if(!(t>0)){g.err='Indique la taille de la jauge (nombre de cases).';render();return true;}
      setC(n=>{const L=(n.rel||[]).slice();let k=L.findIndex(r=>r.pnj===p.id);if(k<0){L.push({id:uid('r'),pnj:p.id,niv:'neutre',date:now,jauges:[]});k=L.length-1;}
        const J={id:uid('j'),obj,taille:t,ouv:now,cases:0,hist:[]};if(df!=null&&!isNaN(df))J.diff=df;L[k]={...L[k],...(note?{note}:{}),jauges:[...(L[k].jauges||[]),J]};n.rel=L;});S.dlg=null;toast('Jauge ouverte');}}
  else if(a==='relEd'){const r=(cc.rel||[]).find(x=>x.id===d.id);if(!r)return true;S.dlg={kind:'relEd',cid:cc.id,id:r.id,f:{note:r.note||''}};}
  else if(a==='relEdSave'){setC(n=>{n.rel=(n.rel||[]).map(r=>r.id!==g.id?r:{...r,note:(g.f.note||'').trim()});});S.dlg=null;toast('Enregistré');}
  else if(a==='relDel'){if(!g.conf){g.conf=true;render();return true;}setC(n=>{n.rel=(n.rel||[]).filter(x=>x.id!==g.id);});S.dlg=null;}
  else if(a==='relGrp'){const r=d.id&&(cc.rel||[]).find(x=>x.id===d.id);S.dlg={kind:'relGrp',cid:cc.id,id:r?r.id:null,f:r?{nom:r.nom||'',orig:r.orig||'',note:r.note||''}:{nom:'',orig:'',note:''}};}
  else if(a==='relGrpSave'){const nom=(g.f.nom||'').trim();if(!nom){g.err='L\'intitulé est obligatoire.';render();return true;}
    setC(n=>{const L=(n.rel||[]).slice(),v={nom,orig:(g.f.orig||'').trim(),note:(g.f.note||'').trim()},k=L.findIndex(r=>r.id===g.id);if(k>=0)L[k]={...L[k],...v};else L.push({id:uid('r'),grp:true,niv:'contact',date:now,...v});n.rel=L;});S.dlg=null;toast('Enregistré');}
  else if(a==='relAddS'||a==='relOAdd'){const inp=document.querySelector(`[data-rs="${CSS.escape(d.j)}"]`),k=parseInt(inp&&inp.value,10);if(!(k>0)){if(inp)inp.focus();return true;}
    const up=j=>j.id!==d.j?j:{...j,cases:Math.min(j.taille,(j.cases||0)+k),hist:[...(j.hist||[]),{d:now,n:k}]};
    setC(n=>{if(a==='relOAdd')n.jauges=(n.jauges||[]).map(up);else n.rel=(n.rel||[]).map(r=>r.id!==d.id?r:{...r,jauges:(r.jauges||[]).map(up)});});toast('+'+k+' succès');}
  else if(a==='relVal'){let msg='';setC(n=>{n.rel=(n.rel||[]).map(r=>{if(r.id!==d.id)return r;const j=(r.jauges||[]).find(x=>x.id===d.j);if(!j||(j.cases||0)<j.taille)return r;const p=r.pnj&&S.chars[r.pnj];msg=((p&&p.court)||r.nom||'Le PNJ')+' devient '+REL_NIV[REL_OBJ[j.obj][1]].toLowerCase();return {...r,niv:REL_OBJ[j.obj][1],jauges:(r.jauges||[]).filter(x=>x.id!==d.j)};});});if(msg)toast(msg);}
  else if(a==='relJDel'){if(!confirm('Fermer cette jauge sans changer la relation ?'))return true;setC(n=>{n.rel=(n.rel||[]).map(r=>r.id!==d.id?r:{...r,jauges:(r.jauges||[]).filter(j=>j.id!==d.j)}).filter(r=>!(r.niv==='neutre'&&!(r.jauges||[]).length));});}
  else if(a==='relOJ'){S.dlg={kind:'relOJ',cid:cc.id,f:{nom:'',taille:'',diff:''}};}
  else if(a==='relOSave'){const nom=(g.f.nom||'').trim(),t=parseInt(g.f.taille,10);if(!nom||!(t>0)){g.err='Intitulé et taille de la jauge obligatoires.';render();return true;}
    setC(n=>{const J={id:uid('j'),nom,taille:t,ouv:now,cases:0,hist:[]};if(g.f.diff!=='')J.diff=+g.f.diff;n.jauges=[...(n.jauges||[]),J];});S.dlg=null;toast('Jauge ouverte');}
  else if(a==='relOVal'){setC(n=>{n.jauges=(n.jauges||[]).map(j=>j.id===d.j&&(j.cases||0)>=j.taille?{...j,done:true,fin:now}:j);});toast('Jauge validée');}
  else if(a==='relODel'){if(!confirm('Retirer cette jauge ?'))return true;setC(n=>{n.jauges=(n.jauges||[]).filter(j=>j.id!==d.j);});}
  render();return true;}
function shInput(t){if(relpInput(t))return true;if(t.dataset.dk!==undefined&&S.dlg&&S.dlg.f&&SH_DLG.has(S.dlg.kind)){S.dlg.f[t.dataset.dk]=t.value;if(t.tagName==='SELECT'&&t.dataset.dk==='pnj'){S.dlg.err='';render();}return true;}return false;}

/* ---------- Lot C (25/11/2026) : assistant de création de personnage (préfixe cw) ----------
   Écran plein écran S.view='crea' (S.cwId, S.cwStep) ; brouillons dans S.brouillons (collection brouillons) ; règles dans engine.js (cr*). */
const cwB=()=>S.brouillons&&S.brouillons[S.cwId];
const cwSee=b=>!!b&&!S.visit&&!!ME&&(isGest()||b.par===ME);
const cwCanEd=b=>cwSee(b)&&(isGest()||b.statut!=='attente');
const cwList=()=>Object.values(S.brouillons||{}).filter(cwSee).sort((a,b)=>(a.cree||'').localeCompare(b.cree||''));
function cwSave(b){b.maj=new Date().toISOString();S.brouillons={...(S.brouillons||{}),[b.id]:b};S.cwSaved=true;persist('brouillons/'+b.id,b);}
function cwUpd(fn){const b0=cwB();if(!cwCanEd(b0))return false;const b=clone(b0);b.d=b.d||{};const r=fn(b.d,b);if(r===false)return false;cwSave(b);return true;}
function cwNew(kind){if(!ME||S.visit||!S.players[ME])return;const id='br-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),now=new Date().toISOString();
  const b={id,kind:kind==='feal'?'feal':'pj',par:ME,cree:now,maj:now,etape:0,statut:'brouillon',d:{ident:{owner:isGest()?'':ME}}};cwSave(b);cwGoTo(id,0);}
function cwGoTo(id,step){navClear();S.view='crea';S.cwId=id;S.cwStep=step||0;S.dlg=null;S.sheet=null;S.cwSaved=false;window.scrollTo(0,0);}
const cwMeta=(b,X)=>{const I=(b.d||{}).ident||{};return (b.kind==='feal'?'Nouveau féal':'Nouveau PJ')+((I.court||'').trim()?' · '+I.court.trim():'');};
/* ---------- Écran de l'assistant ---------- */
const cwChip=(act,attrs,on,lab,dis)=>`<button type="button" class="chip" data-act="${act}" ${attrs} aria-pressed="${!!on}"${dis?' disabled':''}>${lab}</button>`;
const cwSec=(t,body,sub)=>`<section class="card cwsec"><h3>${t}</h3>${sub?`<p class="muted small">${sub}</p>`:''}${body}</section>`;
const cwInfo=t=>`<p class="cwinfo">${t}</p>`;
const cwStepper=(f,k,v,mn,mx,lab)=>`<span class="cwstp"><button type="button" data-act="cwInc" data-f="${f}" data-k="${esc(k)}" data-dv="-1" aria-label="Moins : ${esc(lab)}"${v<=mn?' disabled':''}>−</button><b class="num">${v}</b><button type="button" data-act="cwInc" data-f="${f}" data-k="${esc(k)}" data-dv="1" aria-label="Plus : ${esc(lab)}"${v>=mx?' disabled':''}>+</button></span>`;
const cwTxt=(path,v,lab,ph,ta)=>`<div class="field"><label for="cw-${esc(path)}">${lab}</label>${ta?`<textarea id="cw-${esc(path)}" rows="${ta}" data-cwf="${esc(path)}" placeholder="${esc(ph||'')}">${esc(v||'')}</textarea>`:`<input id="cw-${esc(path)}" type="text" data-cwf="${esc(path)}" value="${esc(v||'')}" placeholder="${esc(ph||'')}" autocomplete="off">`}</div>`;
const cwCnt=(lab,v,mx)=>`<div class="cwcnt${v===mx?' ok':v>mx?' bad':''}"><span>${lab}</span><b class="num">${typeof v==='number'?ppFmt(v):v} / ${ppFmt(mx)}</b></div>`;
function viewCrea(){const b=cwB();
  if(!b||!cwSee(b)){S.view='team';return `<div class="card empty">Ce brouillon n'existe plus ou n'est pas visible.</div>`;}
  const st=crSteps(b),i=Math.max(0,Math.min(S.cwStep||0,st.length-1)),k=st[i][0],ck=crCheck(b),cur=ck[k]||{ok:true,manque:[],avert:[]},E=cwCanEd(b);
  let h=`<div class="cwhead"><div class="cwtop"><span class="small">${S.cwSaved?'Brouillon enregistré':b.statut==='attente'?'Envoyé au MJ':'Brouillon'}</span><button type="button" class="cwx" data-act="cwQuit" aria-label="Quitter l'assistant (le brouillon est gardé)">✕</button></div>
    <h1>${esc(cwMeta(b))}</h1><span class="small">Étape ${i+1} / ${st.length} · ${esc(st[i][1])}</span><div class="cwbar"><i style="width:${Math.round(100*(i+1)/st.length)}%"></i></div>
    <div class="cwdots" role="list">${st.map((s,j)=>{const rch=j<=Math.max(b.etape||0,i),ok=(ck[s[0]]||{}).ok&&j!==i&&rch;return `<button type="button" role="listitem" data-act="cwGo" data-i="${j}" class="${j===i?'on':''}${ok?' ok':''}${rch?'':' off'}" aria-label="Étape ${j+1} : ${esc(s[1])}${ok?' (complète)':''}" title="${esc(s[1])}"${rch?'':' disabled'}>${ok?'✓':j+1}</button>`;}).join('')}</div></div>`; /* UX1 : étapes non atteintes inactives */
  h+=cwFxBox(b);
  if(b.com&&b.statut==='brouillon')h+=`<div class="cwcom"><b>Message du MJ</b><div>${esc(b.com)}</div></div>`;
  if(b.statut==='attente')h+=`<div class="cwcom att"><b>En attente de validation par le MJ.</b>${isGest()?`<div class="actions"><button class="btn pri" data-act="cwValOpen">Valider ou renvoyer</button></div>`:'<div class="small">La fiche ne peut plus être modifiée ; le MJ peut la renvoyer en brouillon.</div>'}</div>`;
  if(S.cwMsg)h+=`<div class="cwcom" role="status">${esc(S.cwMsg)}</div>`;
  h+=k==='recap'?'':cur.ok?`<p class="cwst ok">✓ Étape complète</p>`:`<p class="cwst todo" role="status">À compléter : ${esc(cur.manque.join(' ; '))}</p>`;
  for(const a of cur.avert||[])h+=`<p class="cwst warn">⚠ ${esc(a)}</p>`;
  h+=`<fieldset class="cwbody"${E?'':' disabled'}>`+cwStep(b,k,ck)+`</fieldset>`;
  h+=`<div class="cwfoot">${i>0?`<button class="btn" data-act="cwGo" data-i="${i-1}">‹ Précédente</button>`:''}${i<st.length-1?`<button class="btn pri" data-act="cwGo" data-i="${i+1}">Suivante ›</button>`:''}</div>`;
  return `<div class="cwiz">${h}</div>`;}
function cwStep(b,k,ck){const d=b.d||{},X=crX(d),R=crRules(),fe=b.kind==='feal';
  if(k==='race'){let h=''; /* UX1 : PJ ou féal se choisit au « + » de la liste */
    if(fe){const L=pjIds().map(id=>S.chars[id]).filter(c=>actif(c)&&(isGest()||owners(c).some(p=>p.id===ME)));
      h+=cwSec('Rattachement',L.length?`<div class="chips cwchips">${L.map(c=>cwChip('cwSet',`data-p="pj" data-v="${esc(c.id)}"`,d.pj===c.id,esc(c.court))).join('')}</div>`:'<p class="muted small">Aucun PJ actif à rattacher.</p>','Le féal est un humain, au rang Larbin, toujours visible de toute la table.');
      return h+cwInfo(`Féal : ${R.fealC3} caractéristiques à 3 et ${R.fealC2} à 2 ; ${R.fealProf} points de profils (${R.fealProfMax} au plus par profil) ; ${R.trFeal} traits. Pas de compétences, d'atouts, de capacités ni de pouvoirs.`);}
    /* UX1 : 3 listes déroulantes, une seule race en tout ; exotiques proposées */
    const RL=crRaceList();let rh='';
    for(const [f,l] of [['trad','Fée traditionnelle'],['mod','Fée moderne'],['exo','Fée exotique']]){const L=RL.filter(o=>f==='exo'?o.cr.fam!=='trad'&&o.cr.fam!=='mod':o.cr.fam===f);if(!L.length)continue;const on=L.some(o=>o.x.sing===d.race);
      rh+=`<div class="field cwrsel${on?' on':''}"><label for="cwr-${f}">${l} · ${L.length}</label><select id="cwr-${f}" data-cwrace="1"><option value="">—</option>${L.map(o=>`<option value="${esc(o.x.sing)}"${d.race===o.x.sing?' selected':''}>${esc(raceNm(o.x))}</option>`).join('')}</select></div>`;}
    if(X)rh+=`<p class="small">Race choisie : <b>${esc(raceNm(X.x))}</b> · ${lk({t:'race',id:X.cr.id},'Aperçu')}</p>`;
    h=cwSec('Race',rh||'<p class="muted small">Aucune race disponible (caractéristiques à renseigner dans Univers › Races).</p>','Races visibles dont les caractéristiques sont renseignées.');
    if(X){const x=X.x,mins=CARACS.reduce((t,c)=>t+crCarLim({},X,c).min,0),pred=crPredList(d,X).map(p=>p.alt?p.alt.join(' ou '):p.nom),av=(x.av||[]).filter(e=>e&&e[0]).map(e=>e[0]),dv=(x.dv||[]).filter(e=>e&&e[0]).map(e=>e[0]);
      h+=cwSec(esc(raceNm(x))+' — aperçu',`<p class="small">${esc(NATF[X.cr.fam]||'')}${x.taille?' · taille : '+esc(x.taille):''} · minima ${mins} · prédilection : ${esc(pred.join(', ')||'—')}</p>${av.length?`<p class="small"><b>Avantages :</b> ${esc(av.join(', '))}</p>`:''}${dv.length?`<p class="small"><b>Désavantages :</b> ${esc(dv.join(', '))}</p>`:''}<p class="small">Avantages et désavantages acquis d'office. ${lk({t:'race',id:X.cr.id},'Ouvrir la fiche de race')}</p>`);
      const T=crRaceTraits(X);h+=cwSec('Trait de caractère de la race',T.length?`<div class="chips cwchips">${T.map(t=>cwChip('cwSet',`data-p="traitRace" data-v="${esc(t)}"`,d.traitRace===t,esc(t))).join('')}</div>`:cwTxt('traitRace',d.traitRace,'Trait','Aucun trait saisi pour cette race : saisie libre'));}
    return h+cwInfo(`Féerie ${R.feStart}, Masque ${R.maStart} et Tricherie ${Math.floor((R.feStart+R.maStart)/2)} sont fixés d'office pour un PJ.`);}
  if(k==='cap'){if(!X)return cwInfo('Choisis d\'abord une race (étape 1).');const x=X.x,L=x.choix||[],ch=crChoix(d,X);
    let h=cwSec('Capacités acquises',(x.cap||[]).filter(e=>e&&e[0]).map(e=>`<div class="cwrow"><span>${capLk(e)}${e[1]?`<span class="muted small" style="display:block">${esc(e[1])}</span>`:''}</span><span class="pill good">acquise</span></div>`).join('')||'<p class="muted small">Aucune capacité saisie pour cette race.</p>');
    h+=cwSec('Choix définitif',L.length?`<div class="chips cwchips">${L.map((o,j)=>cwChip('cwSet',`data-p="capx" data-v="${j}" data-n="1"`,ch&&ch.i===j,esc(o[0]==='acc'?o[1]+' '+accW(o[1]):choixFull(o)),L.length===1)).join('')}</div>${L.length===1?'<p class="muted small">Une seule option : attribuée d\'office.</p>':''}`:'<p class="muted small">Aucun choix pour cette race.</p>','Définitif : ne pourra plus être changé après validation. Une caractéristique accrue gagne +1 au-delà du maximum.');
    return h;}
  if(k==='pw'){if(!X)return cwInfo('Choisis d\'abord une race (étape 1).');const x=X.x,sl=pwSlots(x),P=d.pw||[],full=P.length>=R.feStart;
    const row=j=>{const id=sl[j];if(!id)return `<div class="cwrow off"><span class="muted">${PW_LAB[j]} · emplacement vide</span></div>`;if(id==='?')return `<div class="cwrow off"><span class="muted">${PW_LAB[j]} · pouvoir inconnu (le MJ le dévoilera)</span></div>`;
      const on=P.some(o=>o.i===j),see=isGest()||pwVisible(X.cr,x,j),nm=see?pwFull(x,j):'Pouvoir scellé',p=pwCat(id);
      return `<div class="cwrow"><span><b>${esc(nm)}</b> <span class="muted small">· ${PW_LAB[j].toLowerCase()}</span>${see&&p.desc?`<span class="muted small" style="display:block">${esc(p.desc)}</span>`:''}</span>${cwChip('cwPw',`data-i="${j}" data-id="${esc(id)}"`,on,on?'✓ choisi':'Choisir',!on&&full)}</div>`;};
    return cwSec(`Pouvoirs · ${P.length} / ${R.feStart}`,[0,1,2,3,4,5].map(row).join(''),`Autant de pouvoirs que le rang de Féerie (${R.feStart}), parmi les emplacements masqués et démasqués de la race.`)+cwInfo(`Féerie ${R.feStart} · Masque ${R.maStart} · Tricherie ${Math.floor((R.feStart+R.maStart)/2)} (fixés).`);}
  if(k==='at'){const A=d.atouts||[],full=A.length>=R.atStart,x=X&&X.x,r=X&&RACES[X.x.sing];
    const lst=(x?(x.at||[]).filter(e=>e&&e[0]):[]).concat([[TYP,r&&r.t&&r.t.length?'offre '+r.t.map(t=>t[0]+' ('+t[1]+')').join(', '):'offre 2 spécialités typiques']]);
    let h=cwSec(`Atouts de la race · ${A.length} / ${R.atStart}`,lst.map(([n,ds])=>{const on=A.some(a=>a.nom===n);return `<div class="cwrow"><span><b>${esc(n)}</b>${ds?`<span class="muted small" style="display:block">${esc(ds)}</span>`:''}</span>${cwChip('cwAt',`data-nom="${esc(n)}"`,on,on?'✓ choisi':'Choisir',!on&&full)}</div>`;}).join(''),x?'':'Choisis d\'abord une race pour voir ses atouts.');
    const lib=A.filter(a=>a.src==='libre');
    h+=cwSec('Autre atout',lib.map(a=>`<div class="cwrow"><span>${esc(a.nom)}</span><button type="button" class="chip" data-act="cwAtDel" data-nom="${esc(a.nom)}" aria-label="Retirer ${esc(a.nom)}">✕</button></div>`).join('')+(full?'':`<div class="cwadd"><input type="text" data-cwt="at" value="${esc((S.cwTmp||{}).at||'')}" placeholder="Nom de l'atout" aria-label="Autre atout" autocomplete="off"><button type="button" class="btn" data-act="cwAtAdd">Ajouter</button></div>`),'Saisie libre, hors liste de la race.');
    return h;}
  if(k==='car'){if(fe){const V=d.fealCar||{},n3=Object.values(V).filter(v=>+v===3).length,n2=Object.values(V).filter(v=>+v===2).length;
      return `<div class="cwcnts">${cwCnt('À 3',n3,R.fealC3)}${cwCnt('À 2',n2,R.fealC2)}</div>`+cwSec('Caractéristiques',CARACS.map(c=>{const v=+V[c]||0;return `<div class="cwrow"><span>${esc(c)}</span><span class="seg sm cwseg">${[['3','3'],['2','2']].map(([o,l])=>`<button type="button" data-act="cwFeCar" data-k="${esc(c)}" data-v="${o}" aria-pressed="${String(v)===o}"${String(v)!==o&&(o==='3'?n3>=R.fealC3:n2>=R.fealC2)?' disabled':''}>${l}</button>`).join('')}</span></div>`;}).join(''),'Répartition fixe : le joueur choisit lesquelles.');}
    if(!X)return cwInfo('Choisis d\'abord une race (étape 1).');const u=crCarUsed(d,X),ch=crChoix(d,X);
    let h=`<div class="cwcnts">${cwCnt('Points répartis',u,R.carLib)}</div>`+cwInfo(`Minima de la race + ${R.carLib} points ; plafond ${R.carMax} (ou maximum de la race s'il est plus bas).`);
    h+=cwSec('Caractéristiques',CARACS.map(c=>{const l=crCarLim(d,X,c),v=crCarVal(d,X,c),acc=ch&&ch.t==='acc'&&ch.nom===c;return `<div class="cwrow"><span>${esc(c)}<span class="muted small" style="display:block">min ${l.min} · max ${l.max}${acc?' · accrue +1 (démasqué)':''}</span></span>${cwStepper('car',c,v,l.min,l.max,c)}</div>`;}).join(''));
    if(crTroll(X))h+=cwSec('Ajustement du troll',`<label class="cwck"><input type="checkbox" data-cwck="troll"${d.troll?' checked':''}> Constitution max −1, Esprit max +1</label>`,'Facultatif.');
    const con=crCarVal(d,X,'Constitution'),es=Math.max(0,crCarVal(d,X,'Esprit')-R.espSeuil),ct=Math.max(0,crCarVal(d,X,'Prestance')-R.ctcSeuil);
    return h+cwInfo(`PdV ${9+3*con+(ch&&ch.t==='acc'&&ch.nom==='Constitution'?3:0)} · bonus d'Esprit : ${es} point${es>1?'s':''} (Érudit ou Savant) · Prestance : ${ct} point${ct>1?'s':''} de Contact.`);}
  if(k==='prof'){if(fe){const P=d.fealProf||{},tot=PROFILS.reduce((t,p)=>t+(+P[p]||0),0),T=d.traits||{},hi=Math.max(0,...PROFILS.map(p=>+P[p]||0)),top=PROFILS.filter(p=>hi>0&&(+P[p]||0)===hi);
      let h=`<div class="cwcnts">${cwCnt('Points de profils',tot,R.fealProf)}</div>`+cwSec('Profils',PROFILS.map(p=>`<div class="cwrow"><span>${esc(profLab(p))}</span>${cwStepper('fealProf',p,+P[p]||0,0,Math.min(R.fealProfMax,(+P[p]||0)+R.fealProf-tot),profLab(p))}</div>`).join(''),`${R.fealProf} points, ${R.fealProfMax} au plus par profil.`);
      const tp=T.maj&&top.includes(T.maj.p)?T.maj.p:top[0];
      h+=cwSec('Trait du profil le plus haut',top.length?(top.length>1?`<div class="chips cwchips">${top.map(p=>cwChip('cwFeTrP',`data-v="${p}"`,tp===p,esc(profLab(p)))).join('')}</div>`:'')+`<div class="chips cwchips">${prOf(tp).traits.map(t=>cwChip('cwFeTr',`data-p="${tp}" data-v="${esc(t)}"`,T.maj&&T.maj.p===tp&&T.maj.n===t,esc(t))).join('')}</div>`:'<p class="muted small">Répartis d\'abord les points.</p>');
      return h+cwSec('Trait libre',cwTxt('traits.libre',T.libre,'Trait libre'));}
    const T=d.traits||{},tr=(p,f)=>{const L=prOf(p).traits||[];return L.length?`<div class="chips cwchips">${L.map(t=>cwChip('cwSet',`data-p="traits.${f}" data-v="${esc(t)}"`,T[f]===t,esc(t))).join('')}</div>`:cwTxt('traits.'+f,T[f],'Trait');};
    let h=cwSec(`Profil majeur (+${R.profMaj})`,`<div class="chips cwchips">${PROFILS.map(p=>cwChip('cwSet',`data-p="maj" data-v="${p}"`,d.maj===p,esc(profLab(p)),d.min===p)).join('')}</div>${d.maj?'<p class="cwgl">Trait du profil majeur</p>'+tr(d.maj,'maj'):''}`,`+${R.profMaj} à toutes ses compétences ; +${R.ppMaj} PP.`);
    h+=cwSec(`Profil mineur (+${R.profMin})`,`<div class="chips cwchips">${PROFILS.map(p=>cwChip('cwSet',`data-p="min" data-v="${p}"`,d.min===p,esc(profLab(p)),d.maj===p)).join('')}</div>${d.min?'<p class="cwgl">Trait du profil mineur</p>'+tr(d.min,'min'):''}`,`+${R.profMin} à toutes ses compétences ; +${R.ppMin} PP.`);
    return h+cwSec('Trait libre',cwTxt('traits.libre',T.libre,'Trait libre'),`${R.trPJ} traits en tout : race, profil majeur, profil mineur, libre.`);}
  if(k==='comp'){if(!d.maj||!d.min)return cwInfo('Choisis d\'abord les profils majeur et mineur (étape 6).');return cwComp(b,d,X,R);}
  if(k==='pp'){if(!d.maj||!d.min)return cwInfo('Choisis d\'abord les profils majeur et mineur (étape 6).');return cwPPStep(b,d,X,R);}
  if(k==='id'){const I=d.ident||{},G=isGest(),pl=playersSorted().filter(p=>!p.parti),n=I.naiss||{},S0=d.situ||{};
    let h=cwSec('Identité',cwTxt('ident.court',I.court,'Nom court (obligatoire)','ex. Aël')+cwTxt('ident.nom',I.nom,'Nom complet (facultatif)')+
      `<div class="field"><label>Genre (facultatif)</label><div class="seg cwseg">${[['','—'],['m','Masculin'],['f','Féminin']].map(([v,l])=>`<button type="button" data-act="cwSet" data-p="ident.genre" data-v="${v}" aria-pressed="${(I.genre||'')===v}">${l}</button>`).join('')}</div></div>`+
      `<div class="field"><label for="cw-own">Joueur (obligatoire)</label>${G?`<select id="cw-own" data-cwf="ident.owner"><option value="">— choisir —</option>${pl.map(p=>`<option value="${esc(p.id)}"${I.owner===p.id?' selected':''}>${esc(p.nom)}</option>`).join('')}</select>`:`<div class="inp ro">${esc((S.players[I.owner]||{}).nom||'')}</div>`}</div>`+
      `<div class="field"><label>Date de naissance dans le jeu (facultatif)</label><div class="frow cwnaiss">${[['j','Jour',2],['m','Mois',2],['a','Année',4]].map(([f,l,w])=>`<input type="number" inputmode="numeric" data-cwf="ident.naiss.${f}" data-num="1" value="${esc(n[f]||'')}" placeholder="${l}" aria-label="${l}" style="max-width:${w*22+30}px">`).join('')}</div></div>`+
      `<div class="field"><label>Portrait (facultatif)</label>${(S.ptr||{})[b.id]?`<span class="tph" style="width:56px;height:56px;border-radius:50%;overflow:hidden;display:inline-block;vertical-align:middle;margin-right:8px"><img src="${S.ptr[b.id]}" alt="" style="width:100%;height:100%;object-fit:cover"></span>`:''}<label class="addimg">${(S.ptr||{})[b.id]?'Changer':'+ Image'}<input type="file" accept="image/*" data-ptrfile="${esc(b.id)}" hidden></label></div>`);
    const F=d.situF||{},pick=(k,l,flt)=>{const L=fiSort(fiAll().filter(x=>flt(x)&&fiSee(x)));if(!L.length)return '';const sel=(F[k]||[]).filter(id=>S.fiches[id]);return `<div class="field"><label for="cws-${k}">${l}</label>${sel.length?`<div class="chips cwchips">${sel.map(id=>cwChip('cwSitF',`data-k="${k}" data-v="${esc(id)}"`,true,esc(S.fiches[id].nom)+' ✕')).join('')}</div>`:''}<select id="cws-${k}" data-cwsitf="${k}"><option value="">Ajouter…</option>${L.filter(x=>!sel.includes(x.id)).map(x=>`<option value="${esc(x.id)}">${esc(x.nom)}</option>`).join('')}</select></div>`;}; /* UX1 : liste déroulante */
    return h+cwSec('Situation (facultatif)',pick('fiefs','Fiefs',x=>fiIsFief(x))+pick('familles','Familles',x=>x.genre==='famille')+pick('orgs','Organisations',x=>x.genre==='org')+pick('lieux','Lieux',x=>x.genre==='lieu'&&!fiIsFief(x))+cwTxt('situ.titres',S0.titres,'Titres','Une entrée par ligne',2)+cwTxt('situ.poss',S0.poss,'Possessions courantes','Une entrée par ligne',2)+cwTxt('situ.possN',S0.possN,'Possessions notables','Une entrée par ligne',2),'Choix parmi les fiches de l\'univers ; titres et possessions en texte.');}
  if(k==='recap')return cwRecap(b,ck);
  return '';}
/* Étape Compétences : groupées par profil (majeur, mineur, autres repliés), spécialités dépliables, futiles à part */
function cwComp(b,d,X,R){const P=crPts(d,X),F=S.cwFold||{},cP=(d.pp||[]).length?cwPreview(b):null,jt=n=>cP?ppJetChips(cP,n):'';let h=`<div class="cwcnts">${cwCnt('Utiles',P.util,P.utilMax)}${cwCnt('Futiles',P.fut,P.futMax)}${P.espMax?cwCnt('Esprit',P.esp,P.espMax):''}</div>`;
  h+=cwInfo(`Plafond à la création : ${R.compMaxN}, ou ${R.compMaxP} en prédilection. Touche une compétence pour ses spécialités (${R.ptsSpec} pt, Mauvaise main ${R.ptsMM}).${P.espMax?` Bonus d'Esprit : ${P.espMax} point${P.espMax>1?'s':''} gratuits en Érudit ou Savant.`:''}`);
  const typ=(d.atouts||[]).some(a=>a.nom===TYP),r=X&&RACES[X.x.sing],off=k=>[...((r&&r.sp)||[]).filter(e=>'comp:'+e[1]===k).map(e=>[e[0],'Offerte · race']),...(typ?((r&&r.t)||[]).filter(e=>'comp:'+e[1]===k).map(e=>[e[0],'Offerte · atout']):[])];
  const spx=(key,cat)=>{if(!(S.cwSp||{})[key])return '';const mine=(d.specs||[]).map((s,i)=>[s,i]).filter(([s])=>s.key===key),O=off(key);
    let x=O.map(([n,l])=>`<div class="cwsp"><span>${esc(n)}</span><span class="muted small">${l}</span></div>`).join('')+mine.map(([s,i])=>`<div class="cwsp"><span>${esc(s.nom)}${s.mm?' <small class="muted">(Mauvaise main)</small>':''}</span><button type="button" class="chip" data-act="cwSpDel" data-i="${i}" aria-label="Retirer ${esc(s.nom)}">✕ ${crSpecCost(s)} pt</button></div>`).join('');
    const C=(cat||[]).filter(e=>e[0]!=='Langue : '&&!mine.some(([s])=>nrmS(s.nom)===nrmS(e[0]))&&!O.some(o=>nrmS(o[0])===nrmS(e[0])));
    x+=`<div class="cwadd">${C.length?`<select data-cwt="spsel:${esc(key)}" aria-label="Spécialité du livre"><option value="">— spécialité du livre —</option>${C.map(e=>`<option${((S.cwTmp||{})['spsel:'+key])===e[0]?' selected':''}>${esc(e[0])}</option>`).join('')}</select>`:''}<input type="text" data-cwt="sp:${esc(key)}" value="${esc((S.cwTmp||{})['sp:'+key]||'')}" placeholder="ou autre spécialité" aria-label="Autre spécialité" autocomplete="off"><button type="button" class="btn" data-act="cwSpAdd" data-k="${esc(key)}">+ Ajouter</button></div>`;
    return `<div class="cwspx">${x}</div>`;};
  const row=c=>{const key='comp:'+c.nom,o=!!(S.cwSp||{})[key],n=(d.specs||[]).filter(s=>s.key===key).length+off(key).length;
    return `<div class="cwcomp"><div class="cwrow"><button type="button" class="cwdep" data-act="cwSpOpen" data-k="${esc(key)}" aria-expanded="${o}" aria-label="Spécialités de ${esc(c.nom)}">${o?'▴':'▾'}</button><span class="cwcn">${esc(c.nom)}${n?` <small class="pill">${n} spé.</small>`:''}<span class="muted small" style="display:block">départ ${c.start}${c.pred?' · préd.':''} · max ${c.cap}</span></span>${cwStepper('comps',c.nom,c.cur,c.start,c.cap,c.nom)}</div>${jt(c.nom)?`<div class="ppjets">${jt(c.nom)}</div>`:''}${spx(key,CATSPEC[c.nom])}</div>`;};
  const blk=(p,lab)=>cwSec(`${esc(profLab(p))} · ${lab} <small class="muted">rang ${crRank(P.C,p)}</small>`,P.C.filter(c=>c.prof===p).map(row).join(''));
  h+=blk(d.maj,'majeur')+blk(d.min,'mineur');
  const oth=PROFILS.filter(p=>p!==d.maj&&p!==d.min);
  h+=`<section class="card cwsec"><h3>Autres profils</h3>${oth.map(p=>{const o=!!F[p],pred=P.C.filter(c=>c.prof===p&&c.pred).map(c=>c.nom);return `<div class="cwrow"><span>${esc(profLab(p))} <small class="muted">rang ${crRank(P.C,p)}</small>${pred.length?`<span class="muted small" style="display:block">prédilection : ${esc(pred.join(', '))}</span>`:''}</span><button type="button" class="chip" data-act="cwFold" data-k="${p}" aria-expanded="${o}">${o?'Replier':'Déplier'}</button></div>${o?P.C.filter(c=>c.prof===p).map(row).join(''):''}`;}).join('')}</section>`;
  const xy=crPredList(d,X).filter(e=>e.alt);
  if(xy.length)h+=cwSec('Choix « X ou Y » de la race',xy.map(e=>`<div class="chips cwchips">${e.alt.map(n=>cwChip('cwXY',`data-k="${esc(e.key)}" data-v="${esc(n)}"`,e.nom===n,esc(n))).join('')}</div>`).join(''),'Définitif à la validation.');
  let fh='';for(const f of P.F){const key='fut:'+f.k;
    const head=f.alt?`<div class="chips cwchips">${f.alt.map(n=>cwChip('cwXY',`data-k="${esc(f.key)}" data-v="${esc(n)}"`,f.nom===n,esc(n))).join('')}</div>`:f.libre?`<input type="text" data-cwf="futN.${f.j}" value="${esc(f.nom)}" placeholder="${esc(f.lab)}" aria-label="${esc(f.lab)}" autocomplete="off">`:f.own?`<input type="text" data-cwf="futL.${f.k.slice(1)}.nom" value="${esc(f.nom)}" placeholder="Nom de la futile" aria-label="Nom de la futile" autocomplete="off">`:'';
    const o=!!(S.cwSp||{})[key];
    fh+=`<div class="cwcomp"><div class="cwrow"><button type="button" class="cwdep" data-act="cwSpOpen" data-k="${esc(key)}" aria-expanded="${o}" aria-label="Spécialités">${o?'▴':'▾'}</button><span class="cwcn">${esc(f.nom||'(à nommer)')}<span class="muted small" style="display:block">départ ${f.start}${f.pred?' · préd.':''} · max ${f.cap}</span>${head}</span>${cwStepper(f.own?'futL':'futV',f.k,f.cur,f.start,f.cap,f.nom||'futile')}${f.own?`<button type="button" class="chip" data-act="cwFutDel" data-i="${f.k.slice(1)}" aria-label="Retirer">✕</button>`:''}</div>${f.nom&&jt(f.nom)?`<div class="ppjets">${jt(f.nom)}</div>`:''}${spx(key,[])}</div>`;}
  fh+=`<div class="cwadd"><button type="button" class="btn" data-act="cwFutAdd">+ Ajouter une futile</button></div>`;
  h+=cwSec(`Compétences futiles · ${R.ptsFut} points`,fh,((X&&X.x.spf)||[]).length?'Spécialités futiles offertes par la race : '+esc(X.x.spf.map(e=>e[0]).join(', '))+'.':'');
  return h+cwSec('Fixées d\'office',`<div class="cwrow"><span>Féerie</span><b>${R.feStart}</b></div><div class="cwrow"><span>Masque</span><b>${R.maStart}</b></div>`);}
/* Étape PP et Fortune : un bloc par profil doté de PP, achats dans le tableau du profil (fenêtre cwPP) */
function cwPPStep(b,d,X,R){const Q=crPP(d,X);
  let h=`<div class="cwcnts">${Q.ctcMax?cwCnt('Contact',Q.ctc,Q.ctcMax):''}${Q.langMax?cwCnt('Langues',Q.lang,Q.langMax):''}<div class="cwcnt"><span>Fortune</span><b class="num">${Q.fort}${FORTUNE[Q.fort]?' · '+esc(FORTUNE[Q.fort][0]):''}</b></div></div>`;
  {const src=Q.fortRaceSrc.concat(Q.items.filter(it=>it.e.rub==='A'&&(it.e.opt==='p'&&it.e.fort!=null||it.e.opt==='s'&&it.e.fortS!=null)).map(it=>it.e.nom+' '+(it.e.opt==='p'?it.e.fort+' (principale)':'+'+it.e.fortS+' (secondaire)')));
    if(src.length)h+=`<p class="muted small cwfxs">Fortune : dont ${esc(src.join(', '))}</p>`;}
  h+=cwInfo(`PP d'un profil = son rang (+${R.ppMaj} majeur, +${R.ppMin} mineur), à dépenser dans son tableau. Points de Contact : contacts seulement ; points de langue : langues seulement (${R.langCult} par rang de Culture). Activité principale : Fortune et spécialité offerte.`);
  for(const p of PROFILS){const L=Q.items.map((it,i)=>[it,i]).filter(([it])=>it.e.prof===p);if(!Q.av[p]&&!L.length)continue;const rest=Q.av[p]-Q.sp[p];
    h+=cwSec(`${esc(profLab(p))} <small class="muted">${p===d.maj?'majeur · ':p===d.min?'mineur · ':''}rang ${Q.rk[p]}</small>`,`<div class="cwrow"><span>PP</span><b class="num${rest<0?' bad':''}">${ppFmt(Q.sp[p])} / ${ppFmt(Q.av[p])}</b></div>`+
      L.map(([it,i])=>{const e=it.e,src=[it.ctc?ppFmt(it.ctc)+' Contact':'',it.lang?ppFmt(it.lang)+' langue':''].filter(Boolean).join(' + ');return `<div class="cwrow"><span><b>${esc(e.nom)}</b>${e.opt?` <small class="muted">(${esc(PPOPT[e.opt]||'')})</small>`:''}<span class="muted small" style="display:block">${ppFmt(e.cost)} PP${src?' dont '+src:''}${e.rub==='A'&&e.opt==='p'&&e.fort!=null?' · Fortune '+e.fort:''}${e.rub==='A'&&e.opt==='s'&&e.fortS!=null?' · Fortune +'+e.fortS:''}${e.rub==='A'&&e.opt==='p'&&e.spec?' · spécialité '+esc(e.spec)+' offerte':''}${e.prec?' · '+esc(e.prec):''}</span></span><button type="button" class="chip" data-act="cwPPDel" data-i="${i}" aria-label="Retirer ${esc(e.nom)}">✕</button></div>`;}).join('')+
      `<div class="cwadd"><button type="button" class="btn" data-act="cwPPOpen" data-v="${p}">Acheter dans le tableau</button></div>`);}
  return h;}
/* Fenêtre d'achat (tableau du profil), sur l'aperçu de la fiche : prérequis, coûts selon la nature de la race */
function cwPPSheet(g){const b=S.brouillons&&S.brouillons[g.bid];if(!b||!cwCanEd(b))return '';const d=b.d||{},X=crX(d),Q=crPP(d,X),c=cwPreview(b),p=g.prof,rest=Q.av[p]-Q.sp[p],q=nrm(g.q||'');
  const hasPrin=(d.pp||[]).some(e=>e.rub==='A'&&e.opt==='p');
  if(g.sel){const e=ppEls()[g.sel];if(!e){g.sel=null;return cwPPSheet(g);}const k=e.cost||{},cost=ppCost(e,g.opt,c),miss=ppPreMiss(e,c),pool=e.rub==='C'?Q.ctcMax-Q.ctc:e.rub==='L'?Q.langMax-Q.lang:0;
    let opt='';if(e.rub==='A')opt=`<div class="field"><label>Activité</label>${pfSeg('cwPPOpt',g.opt,[['p','Principale'],['s','Secondaire']])}${hasPrin&&g.opt==='p'?'<div class="bad small">Une activité principale est déjà choisie : elle sera remplacée.</div>':''}</div>`;
    else if(k.k==='hf'&&k.a!=null&&k.b!=null)opt=`<div class="field"><label>Le contact est</label>${pfSeg('cwPPOpt',g.opt,[['h','Humain'],['f','Fée']])}</div>`;
    else if(k.k==='tm'&&isExoF(c))opt=`<div class="field"><label>Coût appliqué</label>${pfSeg('cwPPOpt',g.opt==='t'?'t':'m',[['m','Fée moderne'],['t','Fée traditionnelle']])}</div>`;
    const ok=!miss.length&&cost<=rest+pool;
    return sheetW('Confirmer un achat',`<div class="shd"><h2>${esc(e.nom)}</h2></div><div class="muted small">${esc(profLab(p))} · ${esc((PP_RUB.find(r=>r[0]===e.rub)||[])[1]||'')}</div>${opt}
      <div class="calc"><span>Coût</span><b>${esc(ppFmt(cost))} PP</b>${pool>0?`<span>${e.rub==='C'?'Points de Contact':'Points de langue'} disponibles</span><b>${esc(ppFmt(pool))}</b>`:''}<span>PP ${esc(profLab(p))} restants</span><b>${esc(ppFmt(rest))}</b></div>
      ${e.prec?`<div class="muted small">${esc(e.prec)}</div>`:''}${miss.length?`<div class="bad small">Prérequis manquant : ${miss.map(ppPreTxt).map(esc).join(', ')}.</div>`:''}${cost>rest+pool?'<div class="bad small">PP insuffisants.</div>':''}
      <div class="field"><label for="cwppp">Précision <span class="muted small">(facultatif)</span></label><input id="cwppp" type="text" data-cwt="ppPrec" value="${esc(g.prec||'')}" autocomplete="off"></div>
      <div class="actions"><button class="btn" data-act="cwPPBack">Retour</button><button class="btn pri" data-act="cwPPOk"${ok?'':' disabled'}>Ajouter</button></div>`);}
  /* Recette lot C : panier commun avec l'achat en jeu */
  const ctx=cwPPCtx(b,g);if(g.step==='cart')return ppCartSheet(g,ctx,'Points de personnage');
  const rows=ppRows(c,p).filter(([,e])=>!e.nocrea&&!e.titre);
  let h=`<div class="shd" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2>${esc(profLab(p))}</h2><span class="ppf"><small>PP</small>${esc(ppFmt(rest))}</span></div>
    <div class="field"><input type="search" data-cwt="ppq" value="${esc(g.q||'')}" placeholder="Rechercher dans le tableau…" aria-label="Rechercher dans le tableau"></div>${pfSeg('cwPPRub',g.rub,[['all','Tout'],...PP_RUB.map(r=>[r[0],r[2]])])}`;
  h+=ppCartList(g,ctx,rows);
  return sheetW('Points de personnage',h+`<div class="muted small" style="margin-top:6px">Coche les éléments puis « Valider ». Les éléments marqués « pas à la création » ne sont pas proposés.</div><div class="actions"><button class="btn" data-act="closeSheet">Fermer</button></div>`+(g._bar||''));}
/* Contexte du panier dans l'assistant : PP restants du profil, points de Contact et de langue, activités déjà choisies (remplacées) */
function cwPPCtx(b,g){const d=b.d||{},X=crX(d),Q=crPP(d,X),c=cwPreview(b),p=g.prof,owned={};for(const e of d.pp||[])owned[e.el]=(owned[e.el]||[]).concat(e);
  const act=o=>{const j=Q.items.find(it=>it.e.rub==='A'&&it.e.opt===o);return j?{nom:j.e.nom,x:{id:j.e.el,prof:j.e.prof,rub:'A',opt:o,fort:j.e.fort,fortS:j.e.fortS},refund:j.e.prof===p?j.prof:0}:null;};
  return {c,prof:p,have:Q.av[p]-Q.sp[p],pool:{C:Q.ctcMax-Q.ctc,L:Q.langMax-Q.lang},owned,actP:act('p'),actS:act('s'),crea:true,pfx:'cwPP',ov:false,fort0:Q.fort,
    fortAfter:cart=>{const D=cwCartApply(clone(d),cart,c,p);return crPP(D,X).fort;}};}
/* Ajout du panier au brouillon : une activité principale (ou secondaire) remplace la précédente */
function cwCartApply(D,cart,c,prof){let L=(D.pp||[]).slice();
  for(const k of cart){const e=ppEls()[k.id];if(!e)continue;const opt=e.rub==='A'||(e.cost&&e.cost.k==='hf')?k.opt:(e.cost&&e.cost.k==='tm'&&isExoF(c)?(k.opt==='t'?'t':'m'):''),it={el:k.id,prof,rub:e.rub,nom:e.nom,opt,cost:ppCost(e,opt,c)};
    if((k.prec||'').trim())it.prec=k.prec.trim();if(e.rub==='A'){if(e.fortP!=null)it.fort=e.fortP;if(e.fortS!=null)it.fortS=e.fortS;if(e.spec)it.spec=e.spec;L=L.filter(x=>!(x.rub==='A'&&x.opt===opt));}
    L.push(it);}
  D.pp=L;return D;}
/* Encart « Le personnage à ce stade » (25/11/2026) : sous l'en-tête, recalculé à chaque choix sur l'aperçu de la fiche (même calcul que le récapitulatif et la fiche validée) */
const CW_DER=['Esquive','Parade','Résistance physique','Résistance psychique','Base mêlée','Base tir'];
function cwVals(b){const c=cwPreview(b),v={};for(const k of CARACS)v[k]=lv(c,'carac:'+k);
  if(b.kind==='feal'){for(const p of PROFILS)v['prof:'+p]=lv(c,'prof:'+p);return {c,v,fs:[]};}
  for(const [n,x] of derived(c,'m'))v[n]=x;v.Fortune=lv(c,'fortune');
  return {c,v,fs:fxIntSrc(c,'fortune').concat(ppFortSrc(c))};}
/* Dernier changement : comparaison avec les valeurs du précédent affichage du même brouillon */
function cwDiff(b,o){const s=S.cwSnap;
  if(!s||s.id!==b.id){S.cwSnap={id:b.id,v:o.v,fs:o.fs};S.cwLast=null;return null;}
  const ch=Object.keys(o.v).filter(k=>o.v[k]!==s.v[k]);
  if(ch.length){const nw=o.fs.filter(x=>!s.fs.includes(x)).map(x=>x.replace(/^[+−-]?\d+\s+/,'').replace(/\s+[+−-]?\d+(\s*\(.*\))?$/,''));
    const t=ch.slice(0,3).map(k=>(k.startsWith('prof:')?profLab(k.slice(5)):k)+' '+sgn(o.v[k]-s.v[k])).join(', ')+(ch.length>3?'…':'')+(nw.length?' · '+nw.join(', '):'');
    S.cwLast={id:b.id,t,keys:ch};S.cwSnap={id:b.id,v:o.v,fs:o.fs};}
  return S.cwLast&&S.cwLast.id===b.id?S.cwLast:null;}
function cwFxBox(b){let o;try{o=cwVals(b);}catch(e){console.error(e);return '';}
  const fe=b.kind==='feal',L=cwDiff(b,o),hi=k=>L&&L.keys.includes(k)?' hi':'',c=o.c,op=!!S.cwOpen;
  const tile=(n,lab,v)=>`<div class="cwfxt${hi(n)}"><span>${esc(lab)}</span><b class="num">${v}</b></div>`;
  let h=`<section class="cwfx2" aria-label="Le personnage à ce stade"><div class="cwfxh2"><span class="muted small">À ce stade${fe?'':` : PdV <b class="num${hi('PdV')}">${o.v.PdV}</b> · Initiative <b class="num${hi('Initiative')}">${o.v.Initiative}</b> · Fortune <b class="num${hi('Fortune')}">${o.v.Fortune}</b>`}</span><button type="button" class="lnk" data-act="cwFx" aria-expanded="${op}">${op?'Replier ▴':'Détail ▾'}</button></div>`; /* UX1 : une ligne */
  if(L&&L.t)h+=`<p class="cwfxl" role="status">Dernier changement : ${esc(L.t)}</p>`;
  if(op){const grid=(t,sub,ks,lab)=>`<div class="cwfxb"><div class="cwgl">${t}${sub?` <small>· ${sub}</small>`:''}</div><div class="cwfxg">${ks.map(k=>tile(k,lab?lab(k):k,o.v[k])).join('')}</div></div>`;
    if(fe)h+=grid('Caractéristiques','',CARACS)+grid('Profils','',PROFILS.map(p=>'prof:'+p),k=>profLab(k.slice(5)));
    else{const d=b.d||{},X=crX(d),R=crRules(),esp=X?Math.max(0,crCarVal(d,X,'Esprit')-R.espSeuil):0,J=fxOf(c).filter(e=>e.t==='jet'),fs=o.fs;
      const row=(n,v,f)=>`<div class="cwrow"><span>${esc(n)}<span class="muted small" style="display:block">${esc(f)}</span></span><b class="num">${v}</b></div>`;
      h+=grid('Autres valeurs dérivées','forme masquée',CW_DER)+grid('Caractéristiques','',CARACS);
      h+=`<div class="cwfxb"><div class="cwgl">Valeurs calculées</div>${row('Points de vie',o.v.PdV,derFormula(c,'m','PdV').replace(/^PdV : /,''))}${row('Initiative',o.v.Initiative,derFormula(c,'m','Initiative').replace(/^Initiative : /,''))}${row('Fortune',o.v.Fortune,fs.length?'dont '+fs.join(', '):'aucune source pour l\'instant (pas de rang de départ)')}${row('Bonus d\'Esprit',esp+' point'+(esp>1?'s':''),'compétences d\'Érudit ou de Savant')}</div>`;
      h+=`<div class="cwfxb"><div class="cwgl">Bonus de circonstance <small>· affichés, jamais ajoutés</small></div>${J.length?J.map(e=>`<div class="cwfxj">${fxChip(e)} ${e.txt?esc(e.txt)+' ':''}<span class="muted small">· ${esc(e.src)}</span></div>`).join(''):'<p class="muted small cwfxs">Aucun pour l\'instant.</p>'}</div>`;}}
  return h+'</section>';}
/* Aperçu de la fiche (récapitulatif, prérequis) */
function cwPreview(b){try{return fxSync(crBuild(b,{id:'apercu-'+b.id}).c);}catch(e){console.error(e);return newChar('apercu','Aperçu','Aperçu','PJ');}}
function cwRecap(b,ck){const st=crSteps(b),todo=st.filter(s=>s[0]!=='recap'&&!(ck[s[0]]||{}).ok),av=st.flatMap(s=>((ck[s[0]]||{}).avert||[]));
  let h=todo.length?cwSec('À compléter',todo.map(s=>`<div class="cwrow"><span><b>${esc(s[1])}</b><span class="muted small" style="display:block">${esc(ck[s[0]].manque.join(' ; '))}</span></span><button type="button" class="chip" data-act="cwGo" data-i="${st.indexOf(s)}">Ouvrir</button></div>`).join('')):`<p class="cwst ok">✓ Toutes les étapes sont complètes</p>`;
  for(const a of av)h+=`<p class="cwst warn">⚠ ${esc(a)}</p>`;
  h+=cwSec('Résumé',crSummary(b).map(([t,v,k])=>{const j=st.findIndex(s=>s[0]===k);return `<div class="cwrow"><span><b>${esc(t)}</b><span class="small" style="display:block">${esc(v||'—')}</span></span>${j>=0?`<button type="button" class="chip" data-act="cwGo" data-i="${j}">Modifier</button>`:''}</div>`;}).join(''));
  if(b.kind!=='feal'){const c=cwPreview(b),D=derived(c,'m');
    h+=cwSec('Valeurs calculées',`<div class="fgrid">${D.filter(([n])=>['PdV','Esquive','Parade','Résistance physique','Résistance psychique'].includes(n)).map(([n,v])=>`<div class="fr"><span>${esc(n)}</span><b class="num">${v}</b></div>`).join('')}<div class="fr"><span>Tricherie</span><b class="num">${tricherie(c)}</b></div><div class="fr"><span>Fortune</span><b class="num">${lv(c,'fortune')}${FORTUNE[lv(c,'fortune')]?' · '+esc(FORTUNE[lv(c,'fortune')][0]):''}</b></div></div>`,'Forme masquée.');
    const J=COMPS_ALL.concat((c.futiles||[]).map(f=>f.nom).filter(Boolean)).map(n=>[n,ppJetChips(c,n)]).filter(x=>x[1]);if(J.length)h+=cwSec('Bonus de circonstance',J.map(([n,x])=>`<div class="cwrow"><span>${esc(n)}</span><span class="ppjets">${x}</span></div>`).join(''),'Achats en PP : affichés, jamais ajoutés au score.');}
  const ok=!todo.length;
  if(b.statut!=='attente')h+=`<div class="cwsend"><button class="btn pri cta" data-act="cwSend"${ok?'':' disabled'}>Envoyer au MJ</button>${ok?'':'<p class="muted small">Disponible quand toutes les étapes sont complètes.</p>'}</div>`;
  if(cwSee(b))h+=`<div class="cwsend">${S.cwDelAsk?`<p class="small">Supprimer ce brouillon ? Rien n'est gardé.</p><div class="actions"><button class="btn" data-act="cwDelNo">Garder</button><button class="btn" style="color:var(--bad)" data-act="cwDelOk">Supprimer le brouillon</button></div>`:`<button class="btn ghost" data-act="cwDel">Supprimer le brouillon</button>`}</div>`;
  return h;}
/* Suppression d'un brouillon : la personne qui crée et la gestion, quel que soit le statut (le signalement « Fiche à valider » disparaît avec lui) */
function cwDelete(b){const B={...S.brouillons};delete B[b.id];S.brouillons=B;persistDel('brouillons/'+b.id);}
function cwDlgSheet(g){const b=S.brouillons&&S.brouillons[g.bid];if(!b||!cwSee(b))return '';const nm=((b.d||{}).ident||{}).court||'';
  if(g.kind==='cwQuit')return sheetW("Quitter l'assistant",`<div class="shd"><h2>Quitter l'assistant</h2></div>
    <button type="button" class="cwopt" data-act="cwQuitKeep"><b>Garder le brouillon</b><span class="muted small">Reprendre plus tard depuis sa tuile</span></button>
    <button type="button" class="cwopt bad" data-act="cwAbandon"><b>Abandonner la création</b><span class="small">Le brouillon est supprimé définitivement</span></button>
    <div class="actions"><button class="btn" data-act="closeSheet">Continuer la création</button></div>`);
  return sheetW('Supprimer le brouillon',`<div class="shd"><h2>Supprimer le brouillon ?</h2></div><p class="small">Le brouillon ${nm.trim()?'de <b>'+esc(nm.trim())+'</b> ':''}sera supprimé définitivement.${b.statut==='attente'?' Il était en attente de validation : le signalement « Fiche à valider » disparaît aussi.':''}</p>
    <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn" style="color:var(--bad);border-color:var(--bad)" data-act="cwDelGo">Supprimer</button></div>`);}
/* Validation par le MJ */
function cwValSheet(g){const b=S.brouillons&&S.brouillons[g.bid];if(!b||!isGest())return '';
  return sheetW('Validation',`<div class="shd"><h2>${esc(cwMeta(b))}</h2></div><div class="muted small">Par ${esc((S.players[b.par]||{}).nom||'?')} · envoyé le ${fmtDate((b.envoye||'').slice(0,10))}</div>
    ${crSummary(b).map(([t,v])=>`<div class="small" style="margin:4px 0"><b>${esc(t)}</b> : ${esc(v||'—')}</div>`).join('')}
    ${b.kind==='feal'?'':`<div class="field"><label for="cwxp">XP de départ</label><input id="cwxp" type="number" min="0" inputmode="numeric" data-cwt="valxp" value="${esc(g.xp)}" style="max-width:120px"></div>`}
    <div class="field"><label for="cwcom">Commentaire <span class="muted small">(affiché en tête de l'assistant en cas de renvoi)</span></label><textarea id="cwcom" rows="3" data-cwt="valcom">${esc(g.com||'')}</textarea></div>
    ${crSendable(b)?'':'<div class="bad small">Des étapes ne sont plus complètes : renvoyer en brouillon.</div>'}
    <div class="actions"><button class="btn" data-act="closeSheet">Fermer</button><button class="btn" data-act="cwBackDraft">Renvoyer en brouillon</button><button class="btn pri" data-act="cwValOk"${crSendable(b)?'':' disabled'}>Valider la fiche</button></div>`);}
function cwValidate(g){const b=S.brouillons&&S.brouillons[g.bid];if(!b||!isGest()||!crSendable(b))return;const court=((b.d.ident||{}).court||'').trim();
  let id=slug(court);while(S.chars[id])id=slug(court);
  const {c,ev}=crBuild(b,{id,xp:b.kind==='feal'?0:g.xp});c.par=b.par||'';for(const x of (c.achats||[]))if(x.ppel)ctcLinkX(x.ppel); /* correctif 26/11 : contacts reliés aux PNJ */c.cree=c.cree||new Date().toISOString();
  saveChar(c);
  if(S.ptr&&S.ptr[b.id]){const im=S.ptr[b.id];S.ptr={...S.ptr,[id]:im};persist('portraits/'+id,{img:im,t:Date.now()});persistDel('portraits/'+b.id);S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});} /* UX1 : portrait choisi à l'étape 9 */
  const ow=b.kind==='feal'?'':(b.d.ident||{}).owner;if(ow&&S.players[ow]){const p=clone(S.players[ow]);if(!(p.persos||[]).includes(id)){p.persos=[...(p.persos||[]),id];savePlayer(p);}}
  if(ev)saveEvents([...S.events,ev]);
  const B={...S.brouillons};delete B[b.id];S.brouillons=B;persistDel('brouillons/'+b.id);
  S.dlg=null;navClear();S.view='sheet';S.sel=id;S.shTab=b.kind==='feal'?'por':'prog';window.scrollTo(0,0);render();setTimeout(()=>toast('Fiche validée'),0);}
/* Actions ; renvoie true si traitée */
function cwAct(a,d){if(!/^cw/.test(a))return false;const g=S.dlg;
  const redraw=()=>{S._force=true;render();return true;};
  if(a==='cwNew'){cwNew(d.v);return redraw();}
  if(a==='cwFx'){S.cwOpen=!S.cwOpen;return redraw();}
  if(a==='cwOpen'){const b=S.brouillons&&S.brouillons[d.id];if(!cwSee(b))return true;cwGoTo(b.id,Math.min(b.etape||0,crSteps(b).length-1));S.cwMsg='';return redraw();}
  /* Recette lot C : ✕ Quitter propose de garder le brouillon ou d'abandonner la création (suppression, avec confirmation) */
  if(a==='cwQuit'){const b=cwB();if(b&&cwSee(b)){S.dlg={kind:'cwQuit',bid:b.id};return redraw();}a='cwQuitKeep';}
  if(a==='cwQuitKeep'){S.dlg=null;S.view='team';S.teamSel='pj';S.cwMsg='';S.cwDelAsk=false;window.scrollTo(0,0);return redraw();}
  if(a==='cwAbandon'){const b=g&&g.kind==='cwQuit'&&S.brouillons[g.bid];if(!b)return true;S.dlg={kind:'cwDel',bid:b.id,quit:true};return redraw();}
  if(a==='cwDelAsk'){const b=S.brouillons&&S.brouillons[d.id];if(!cwSee(b))return true;S.dlg={kind:'cwDel',bid:b.id};return redraw();}
  if(a==='cwDelGo'){const b=g&&g.kind==='cwDel'&&S.brouillons[g.bid];if(!b||!cwSee(b))return true;cwDelete(b);S.dlg=null;if(S.view==='crea'&&S.cwId===b.id){S.view='team';S.teamSel='pj';window.scrollTo(0,0);}setTimeout(()=>toast('Brouillon supprimé'),0);return redraw();}
  if(a==='cwGo'){const b=cwB();if(!b)return true;S.cwStep=Math.max(0,Math.min(+d.i,crSteps(b).length-1));S.cwMsg='';S.cwDelAsk=false;
    if(cwCanEd(b)&&S.cwStep>(b.etape||0)){const n=clone(b);n.etape=S.cwStep;cwSave(n);} /* UX1 : étape la plus avancée atteinte */window.scrollTo(0,0);return redraw();}
  if(a==='cwValOpen'){if(!isGest())return true;S.dlg={kind:'cwVal',bid:S.cwId,xp:String(crRules().xpStart),com:''};return redraw();}
  if(a==='cwValOk'){if(g&&g.kind==='cwVal')cwValidate(g);return true;}
  if(a==='cwBackDraft'){if(!g||g.kind!=='cwVal'||!isGest())return true;const b0=S.brouillons[g.bid];if(!b0)return true;const b=clone(b0);b.statut='brouillon';b.com=(g.com||'').trim();cwSave(b);S.dlg=null;setTimeout(()=>toast('Renvoyé en brouillon'),0);return redraw();}
  if(a==='cwPPRub'&&g&&g.kind==='cwPP'){g.rub=d.v;return redraw();}
  if(/^cwPP(Tg|CGo|CBack|COpt|CDel|CBuy)$/.test(a)&&g&&g.kind==='cwPP'){const b=cwB();if(!b||!cwCanEd(b))return true;const ctx=cwPPCtx(b,g);
    if(a==='cwPPCBuy'){const K=ppCartCalc(ctx,g.cart||[]);if(!K.items.length||ppCartErr(ctx,K).length)return true;const c=ctx.c;cwUpd(D=>{cwCartApply(D,g.cart,c,g.prof);});
      const n=K.items.length;S.dlg=null;setTimeout(()=>toast(n>1?n+' éléments ajoutés':'Ajouté'),0);return redraw();}
    ppCartAct(a,d,g,ctx);return redraw();}
  if(a==='cwPPPick'&&g&&g.kind==='cwPP'){const e=ppEls()[d.id];if(!e)return true;g.sel=d.id;g.prec='';const b=cwB(),hp=((b&&b.d.pp)||[]).some(x=>x.rub==='A'&&x.opt==='p');g.opt=e.rub==='A'?(hp?'s':'p'):(e.cost&&e.cost.k==='hf'?(e.cost.a==null?'f':'h'):(e.cost&&e.cost.k==='tm'?'m':''));return redraw();}
  if(a==='cwPPBack'&&g&&g.kind==='cwPP'){g.sel=null;return redraw();}
  if(a==='cwPPOpt'&&g&&g.kind==='cwPP'){g.opt=d.v;return redraw();}
  if(a==='cwPPOk'&&g&&g.kind==='cwPP'){const e=ppEls()[g.sel],b=cwB();if(!e||!b)return true;const c=cwPreview(b),cost=ppCost(e,g.opt,c);if(ppPreMiss(e,c).length)return true;
    const opt=e.rub==='A'||(e.cost&&e.cost.k==='hf')?g.opt:(e.cost&&e.cost.k==='tm'&&isExoF(c)?(g.opt==='t'?'t':'m'):''),it={el:g.sel,prof:g.prof,rub:e.rub,nom:e.nom,opt,cost};
    if((g.prec||'').trim())it.prec=g.prec.trim();if(e.rub==='A'){if(e.fortP!=null)it.fort=e.fortP;if(e.fortS!=null)it.fortS=e.fortS;if(e.spec)it.spec=e.spec;}
    cwUpd(D=>{let L=(D.pp||[]).slice();if(opt==='p'&&e.rub==='A')L=L.map(x=>x.rub==='A'&&x.opt==='p'?{...x,opt:'s'}:x);L.push(it);D.pp=L;});S.dlg=null;setTimeout(()=>toast('Ajouté'),0);return redraw();}
  if(S.visit)return true;const b=cwB();if(!b)return true;
  if(a==='cwDel'){S.cwDelAsk=true;return redraw();}if(a==='cwDelNo'){S.cwDelAsk=false;return redraw();}
  if(a==='cwDelOk'){if(!cwSee(b))return true;cwDelete(b);S.cwDelAsk=false;S.view='team';S.teamSel='pj';setTimeout(()=>toast('Brouillon supprimé'),0);return redraw();}
  if(a==='cwSend'){if(!cwCanEd(b)||!crSendable(b))return true;const n=clone(b);n.statut='attente';n.envoye=new Date().toISOString();cwSave(n);S.view='team';S.teamSel='pj';window.scrollTo(0,0);setTimeout(()=>toast('Envoyé au MJ'),0);return redraw();}
  if(a==='cwSpOpen'){S.cwSp={...(S.cwSp||{}),[d.k]:!(S.cwSp||{})[d.k]};return redraw();}
  if(a==='cwFold'){S.cwFold={...(S.cwFold||{}),[d.k]:!(S.cwFold||{})[d.k]};return redraw();}
  if(a==='cwPPOpen'){if(!cwCanEd(b))return true;S.dlg={kind:'cwPP',bid:b.id,prof:d.v,rub:'all',q:'',sel:null};return redraw();}
  if(!cwCanEd(b))return true;S.cwMsg='';
  if(a==='cwSitF'){if(!cwUpd(b=>{const F=b.d.situF=b.d.situF||{},L=F[d.k]||[];F[d.k]=L.includes(d.v)?L.filter(x=>x!==d.v):[...L,d.v];}))return true;return redraw();}
  if(a==='cwKind'){const k=d.v==='feal'?'feal':'pj';if(b.kind!==k){const n=clone(b);n.kind=k;cwSave(n);}return redraw();}
  if(a==='cwRace'){cwUpd(D=>{const r=crRaceSet(D,d.v);Object.keys(D).forEach(x=>delete D[x]);Object.assign(D,r.d);if(r.lost.length)S.cwMsg='Race changée : '+r.lost.join(', ')+' retirés (choix de l\'ancienne race).';});return redraw();}
  if(a==='cwSet'){cwUpd(D=>{cwPath(D,d.p,d.n?+d.v:d.v);if(d.p==='maj'||d.p==='min'){const t={...(D.traits||{})};t[d.p]='';D.traits=t;}});return redraw();}
  if(a==='cwPw'){cwUpd(D=>{const L=(D.pw||[]).slice(),i=+d.i,j=L.findIndex(o=>o.i===i);if(j>=0)L.splice(j,1);else if(L.length<crRules().feStart)L.push({i,id:d.id});else return false;D.pw=L;});return redraw();}
  if(a==='cwAt'){cwUpd(D=>{const L=(D.atouts||[]).slice(),j=L.findIndex(x=>x.nom===d.nom);if(j>=0)L.splice(j,1);else if(L.length<crRules().atStart)L.push({nom:d.nom,src:'race'});else return false;D.atouts=L;});return redraw();}
  if(a==='cwAtAdd'){const v=((S.cwTmp||{}).at||'').trim();if(!v)return true;cwUpd(D=>{const L=(D.atouts||[]).slice();if(L.length>=crRules().atStart||L.some(x=>nrmA(x.nom)===nrmA(v)))return false;L.push({nom:v,src:'libre'});D.atouts=L;});S.cwTmp={...(S.cwTmp||{}),at:''};return redraw();}
  if(a==='cwAtDel'){cwUpd(D=>{D.atouts=(D.atouts||[]).filter(x=>x.nom!==d.nom);});return redraw();}
  if(a==='cwInc'){const dv=+d.dv,f=d.f,k=d.k;cwUpd(D=>{const X=crX(D);
      if(f==='car'){const l=crCarLim(D,X,k),v=crCarVal(D,X,k)+dv;if(v<l.min||v>l.max)return false;D.car={...(D.car||{}),[k]:v};}
      else if(f==='comps'){const c=crComps(D,X).find(x=>x.nom===k);if(!c)return false;const v=c.cur+dv;if(v<c.start||v>c.cap)return false;D.comps={...(D.comps||{}),[k]:v};}
      else if(f==='futV'){const x=crFutAll(D,X).find(y=>y.k===k);if(!x)return false;const v=x.cur+dv;if(v<x.start||v>x.cap)return false;D.futV={...(D.futV||{}),[k]:v};}
      else if(f==='futL'){const i=+k.slice(1),L=(D.futL||[]).slice(),x=L[i];if(!x)return false;const v=(+x.cur||0)+dv;if(v<0||v>crRules().compMaxN)return false;L[i]={...x,cur:v};D.futL=L;}
      else if(f==='fealProf'){const R=crRules(),P={...(D.fealProf||{})},v=(+P[k]||0)+dv,tot=PROFILS.reduce((t,p)=>t+(+P[p]||0),0)+dv;if(v<0||v>R.fealProfMax||tot>R.fealProf)return false;P[k]=v;D.fealProf=P;}
      else return false;});return redraw();}
  if(a==='cwFeCar'){cwUpd(D=>{const V={...(D.fealCar||{})};if(String(V[d.k])===d.v)delete V[d.k];else V[d.k]=+d.v;D.fealCar=V;});return redraw();}
  if(a==='cwFeTrP'){cwUpd(D=>{D.traits={...(D.traits||{}),maj:{p:d.v,n:''}};});return redraw();}
  if(a==='cwFeTr'){cwUpd(D=>{D.traits={...(D.traits||{}),maj:{p:d.p,n:d.v}};});return redraw();}
  if(a==='cwXY'){cwUpd(D=>{D.xy={...(D.xy||{}),[d.k]:d.v};});return redraw();}
  if(a==='cwFutAdd'){cwUpd(D=>{D.futL=[...(D.futL||[]),{nom:'',cur:0}];});return redraw();}
  if(a==='cwFutDel'){cwUpd(D=>{const i=+d.i;D.futL=(D.futL||[]).filter((x,j)=>j!==i);D.specs=(D.specs||[]).filter(s=>(s.key||'')!=='fut:l'+i).map(s=>{const m=(s.key||'').match(/^fut:l(\d+)$/);return m&&+m[1]>i?{...s,key:'fut:l'+(+m[1]-1)}:s;});});return redraw();}
  if(a==='cwSpAdd'){const T=S.cwTmp||{},nom=((T['sp:'+d.k]||'').trim()||(T['spsel:'+d.k]||'').trim());if(!nom)return true;
    cwUpd(D=>{const L=(D.specs||[]).slice();if(L.some(s=>s.key===d.k&&nrmS(s.nom)===nrmS(nom)))return false;L.push({key:d.k,nom,mm:nrm(nom)==='mauvaise main'});D.specs=L;});S.cwTmp={...T,['sp:'+d.k]:'',['spsel:'+d.k]:''};return redraw();}
  if(a==='cwSpDel'){cwUpd(D=>{D.specs=(D.specs||[]).filter((s,i)=>i!==+d.i);});return redraw();}
  if(a==='cwPPDel'){cwUpd(D=>{D.pp=(D.pp||[]).filter((x,i)=>i!==+d.i);});return redraw();}
  return true;}
function cwPath(o,path,v){const ks=path.split('.');for(let i=0;i<ks.length-1;i++){const k=ks[i],nx=ks[i+1],arr=/^\d+$/.test(nx);o[k]=o[k]&&typeof o[k]==='object'?(Array.isArray(o[k])?o[k].slice():{...o[k]}):(arr?[]:{});o=o[k];}o[ks[ks.length-1]]=v;}
/* Saisies : texte enregistré à la sortie du champ ; listes déroulantes et cases tout de suite */
function cwInput(t,ev){const ds=t.dataset;
  if(ds.cwt!==undefined){S.cwTmp={...(S.cwTmp||{}),[ds.cwt]:t.value};const g=S.dlg;
    if(g&&g.kind==='cwPP'){if(ds.cwt==='ppq'){g.q=t.value;if(ev==='input'){S._force=true;renderSheet();const i=document.querySelector('#sheetRoot [data-cwt="ppq"]');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}}}if(ds.cwt==='ppPrec')g.prec=t.value;}
    if(g&&g.kind==='cwVal'){if(ds.cwt==='valxp')g.xp=t.value;if(ds.cwt==='valcom')g.com=t.value;}
    return true;}
  if(ds.cwck!==undefined){if(ev!=='change')return true;cwUpd(D=>{D[ds.cwck]=!!t.checked;});S._force=true;render();return true;}
  if(ds.cwf===undefined)return false;const b0=cwB();if(!cwCanEd(b0))return true;
  const v=ds.num?(t.value===''?'':+t.value):t.value;
  if(ev==='input'&&t.tagName!=='SELECT'){const b=clone(b0);b.d=b.d||{};cwPath(b.d,ds.cwf,v);S.brouillons={...S.brouillons,[b.id]:b};S.cwPend=b;return true;}
  const b=clone(b0);b.d=b.d||{};cwPath(b.d,ds.cwf,v);S.cwPend=null;cwSave(b);S._force=true;render();return true;}
