/* La belle appli — Paramètres (règles chiffrées, rangs de PNJ, barèmes) */
function pDraft(){if(!S.pd){const v=clone(PRM);S.pd={date:today(),v};}return S.pd;}
/* ---------- Paramètres réorganisés (23/11/2026) : accueil en liste groupée, entrées regroupées ---------- */
const PUI={carLib:['au-dessus des minima de la race','points'],carMax:['valeur maximale d\'une caractéristique','rang'],feStart:['','rang'],maStart:['','rang'],atStart:['choisis dans la liste de la race','atouts'],profMaj:['ajouté à chaque compétence du profil','rangs'],profMin:['ajouté à chaque compétence du profil','rang'],predBonus:['compétences de prédilection de la race','rangs'],ptsUtil:['à répartir dans les compétences','points'],ptsFut:['à répartir dans les futiles','points'],compMaxN:['compétence ordinaire, à la création','rang'],compMaxP:['à la création','rang'],ptsSpec:['coût en points de création','point'],ptsMM:['coût en points de création','points'],espSeuil:['1 point gratuit en Érudit ou Savant par rang au-delà','rang'],ctcSeuil:['1 point de Contact par rang au-delà','rang'],langCult:['offertes à la création','langue'],ppMaj:['en plus des PP du rang du profil','PP'],ppMin:['en plus des PP du rang du profil','PP'],trPJ:['race, majeur, mineur, libre','traits'],trFeal:['profil le plus haut, libre','traits'],xpStart:['le MJ peut en accorder à la validation','XP'],fealC3:['le joueur choisit lesquelles','carac.'],fealC2:['','carac.'],fealProf:['','points'],fealProfMax:['','points'],prof:['profil de PNJ : (niveau suivant) ×','XP']};
const CRE_BL=[['1. Caractéristiques',v=>`${v.carLib} points · plafond ${v.carMax}`,['carLib','carMax']],['2. Féerie, Masque, atouts',v=>`${v.feStart} · ${v.maStart} · ${v.atStart}`,['feStart','maStart','atStart']],['3. Profils et compétences',v=>`${v.ptsUtil} + ${v.ptsFut} points`,['profMaj','profMin','predBonus','ptsUtil','ptsFut','compMaxN','compMaxP','ptsSpec','ptsMM']],['4. Bonus des caractéristiques',()=>'Esprit · Contact · langues',['espSeuil','ctcSeuil','langCult']],['5. Points de personnage',v=>`rang + ${v.ppMaj} / + ${v.ppMin}`,['ppMaj','ppMin']],['6. Traits de caractère',v=>`${v.trPJ} · féal ${v.trFeal}`,['trPJ','trFeal']],['7. Fin de création',v=>`XP ${v.xpStart} · validation MJ`,['xpStart']]];
const pLab=k=>{for(const t in PARAM_DEF){const r=PARAM_DEF[t].find(x=>x[0]===k);if(r)return r[1];}return k;};
const pRow=(g,k,lab)=>{const u=PUI[k]||['',''];return `<div class="pr3"><label class="l" for="p-${k}"><b>${esc(lab||pLab(k))}</b>${u[0]?`<small>${esc(u[0])}</small>`:''}</label><span class="v"><input id="p-${k}" type="number" min="0" data-pv="${k}" value="${esc(g.v[k]??'')}"><span class="u">${esc(u[1])}</span></span></div>`;};
const pVerDate=()=>{const L=((S.params&&S.params.versions)||[]).filter(x=>x.date<=today()).sort((a,b)=>a.date.localeCompare(b.date));return L.length?L[L.length-1].date:null;};
function creResume(v){return `<div class="presume"><b>Un PJ démarre avec</b><ul><li>minima de sa race + ${esc(v.carLib)} points de caractéristiques (plafond ${esc(v.carMax)})</li><li>Féerie ${esc(v.feStart)} · Masque ${esc(v.maStart)} · ${esc(v.atStart)} atouts féeriques</li><li>profil majeur +${esc(v.profMaj)}, mineur +${esc(v.profMin)}, prédilection +${esc(v.predBonus)}</li><li>${esc(v.ptsUtil)} points utiles + ${esc(v.ptsFut)} futiles (plafond ${esc(v.compMaxN)}, ${esc(v.compMaxP)} en prédilection)</li><li>PP = rang de chaque profil, + ${esc(v.ppMaj)} majeur, + ${esc(v.ppMin)} mineur</li><li>${esc(v.trPJ)} traits de caractère · ${esc(v.xpStart)} XP de départ</li></ul></div>`;}
/* UX3 (28/11/2026) : 8 entrées, sections repliées, barre « Annuler · Enregistrer » qui apparaît à la modification */
const P_DATED=['creation','couts','fief','pnj'];
function viewParamHome(g){const v=g.v,d=pVerDate(),sc=S.schemaV||0;
  const SUM={creation:`minima + ${v.carLib} · Féerie ${v.feStart} · Masque ${v.maStart} · ${v.ptsUtil} + ${v.ptsFut} points`,couts:`Féerie ${v.feerie} · Carac. ${v.carac} · Comp. ${v.comp} · XP de groupe · arts obscurs`,fief:`caractéristique × ${v.fgCc} · ressource ${v.fgCr} XP · population`,pnj:(pnjRangs().join(' → ')||'rangs')+' · jauges de relation',profils:'6 profils · tableaux de PP · traits · titres',donnees:`Données v${sc}${sc===SCHEMA_V?' · à jour':''} · tableur · import Kanka`,listes:'types de lieu, d\'organisation, de famille, d\'objet',cartes:caCfg().cats.length+' catégories de repère · '+caCfg().moy.length+' moyens de déplacement'};
  const IC={cartes:FI_IC.carte,creation:'<path d="M12 5v14M5 12h14"/>',couts:'<path d="M4 18l5-5 4 3 7-8"/><path d="M15 8h5v5"/>',fief:'<path d="M3 21h18M5 21V10l7-5 7 5v11M10 21v-5h4v5"/>',pnj:'<circle cx="8.5" cy="9" r="3"/><circle cx="16" cy="10" r="2.5"/><path d="M3.5 19c.8-3 3-4.5 5-4.5s4.2 1.5 5 4.5M14 15.2c2.6-.4 4.6.9 5.5 3.8"/>',profils:'<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',listes:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',donnees:'<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>'};
  return `<h2 style="margin-top:4px">Paramètres</h2>${d?`<div class="muted small" style="margin-bottom:6px">Coûts et gains datés · en vigueur depuis le ${fmtDate(d)}</div>`:''}`+PARAM_HOME.map(([gl,L])=>`<div class="pgrp">${gl}</div><div class="plst">${L.map(([k,l])=>`<button type="button" class="pli" data-act="ptab" data-v="${k}"><span class="pic" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg></span><span class="ptx"><b>${l}</b><small>${esc(SUM[k])}</small></span><span aria-hidden="true" class="pch">›</span></button>`).join('')}</div>`).join('');}
/* Menu « Versions ▾ » : historique des versions et valeurs par défaut */
function pVersMenu(){const vers=((S.params&&S.params.versions)||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)),T=isTech()&&canEdit();
  return `<details class="pvers"><summary class="btn ghost">Versions ▾</summary><div class="pvm">${vers.map(x=>`<div class="small">${fmtDate(x.date)}${x.date>today()?' <span class="muted">(à venir)</span>':x.date===pVerDate()?' <span class="muted">(en vigueur)</span>':''}</div>`).join('')||'<div class="muted small">Aucune version enregistrée.</div>'}${T?`<button type="button" class="btn ghost" data-act="pDef" style="margin-top:6px">Valeurs par défaut</button>`:''}</div></details>`;}
/* Barre d'enregistrement : cachée tant que rien n'a changé */
function pSaveBar(g){return `<div class="psave"${S.pDirty?'':' hidden'} role="region" aria-label="Enregistrer les réglages"><label class="small">À partir du <input type="date" data-pdate="1" value="${esc(g.date)}" aria-label="Date d'effet"></label><span style="flex:1"></span><button type="button" class="btn ghost" data-act="pCancel">Annuler</button><button type="button" class="btn pri" data-act="pSave">Enregistrer</button></div>`;}
function pDirtyOn(){S.pDirty=true;S.psaved=false;const b=document.querySelector('.psave');if(b)b.hidden=false;}
function viewParams(){if(!S.paramsReady)return `<h2 style="margin-top:4px">Paramètres</h2><div class="card empty">Chargement…</div>`;
  if(PARAM_OLD[S.ptab])S.ptab=PARAM_OLD[S.ptab];
  const tab=S.ptab||'',G=isTech()&&canEdit(),g=pDraft();
  if(!tab||!PARAM_TABS.some(t=>t[0]===tab))return viewParamHome(g);
  const dated=P_DATED.includes(tab);
  let h=`${crumb(['Paramètres','data-act="ptab" data-v=""'],[''])}<div class="pghead"><h2 style="margin:4px 0 0;flex:1">${(PARAM_TABS.find(t=>t[0]===tab)||[,''])[1]}</h2>${dated?pVersMenu():''}</div>`;
  if(tab==='donnees')return h+viewDonnees();
  if(tab==='listes')return h+fiListes();
  if(tab==='cartes')return h+caParams(); /* lot Cartes */
  if(tab==='profils')return h+viewProfils();
  const v=g.v,rows=K=>K.map(r=>pRow(g,r[0])).join('');let body='';
  if(tab==='creation')body=creResume(v)+CRE_BL.map(([t,f,K],i)=>cBlk('pc'+i,t,f(v),K.map(k=>pRow(g,k)).join('')+(i===6?'<div class="muted small" style="margin-top:6px">Validation des nouvelles fiches : par le MJ seul.</div>':i===4?'<div class="muted small" style="margin-top:6px">PP de création non dépensés : perdus. Points de Contact : uniquement pour acheter un contact.</div>':''))).join('');
  else if(tab==='couts')body=cBlk('pu-c','Progression des PJ',`Féerie ${v.feerie} · Masque ${v.masque} · Carac. ${v.carac} · Comp. ${v.comp}`,rows(PARAM_DEF.couts.filter(r=>r[0]!=='prof')))
    +cBlk('pu-p','Paliers Profond et Légendaire',`Profond : Féerie ${v.p1feerie} · Légendaire : Féerie ${v.p2feerie} · seuil ${v.palierMax}`,rows(PARAM_DEF.paliers))
    +cBlk('pu-t','XP de groupe',`secret : titre ${v.secTitre} · indice ${v.secH} · mineure ${v.secVmin} · majeure ${v.secVM} · complété ${v.secBonus} · race ${v.creXP}`,rows(PARAM_DEF.table))
    +cBlk('pu-a','Arts obscurs',`sort ${v.aoSort} XP · rang maximum ${v.aoMax} · ${v.aoReq} sorts requis`,rows(PARAM_DEF.arts)+`<div class="muted small" style="margin-top:6px">Rang d'un art : au prix d'une compétence. Sorts requis : du niveau inférieur, pour atteindre les rangs 3, 5 et 7. Prérequis, organisation et niveaux : sur la fiche de l'art (mode édition).</div>`);
  else if(tab==='fief')body=cBlk('pu-f','Coûts',`caractéristique : nouveau score × ${v.fgCc} XP · ressource ${v.fgCr} XP`,rows(PARAM_DEF.fief))+(typeof fgParams==='function'?fgParams():'');
  else if(tab==='pnj')body=cBlk('pn-r','Rangs de PNJ',String((v.pnj||[]).length),`<div class="muted small" style="margin-bottom:6px">Points de caractéristiques au total (minima compris) et points à répartir dans les profils, par rang.</div><div class="pnjg"><span class="muted small">Rang</span><span class="muted small">Caract.</span><span class="muted small">Profils</span><span></span>${(g.v.pnj||[]).map((r,i)=>`<input type="text" data-prk="${i}" data-pk="nom" value="${esc(r.nom)}" aria-label="Nom du rang"><input type="number" min="0" data-prk="${i}" data-pk="car" value="${esc(r.car)}" aria-label="Caractéristiques"><input type="number" min="0" data-prk="${i}" data-pk="prof" value="${esc(r.prof)}" aria-label="Profils"><button class="x" data-act="pnjDel" data-i="${i}" aria-label="Retirer le rang">✕</button>`).join('')}</div><div class="radd"><button class="btn" data-act="pnjAdd">+ Ajouter un rang</button></div>`)
      +cBlk('pn-f','Féal (PNJ rattaché à un PJ)','humain · Larbin','<div class="muted small" style="margin-bottom:4px">Toujours humain, rang Larbin, sans atouts, capacités ni pouvoirs. Un PNJ peut devenir féal.</div>'+rows(PARAM_DEF.feal))
      +cBlk('pn-j','Jauges de relation','jauge et difficulté par rang',viewRelParams());
  else body=rows(PARAM_DEF[tab]||[]);
  h+=`<fieldset class="pf"${G?'':' disabled'}>${body}</fieldset>${S.psaved?'<div class="small muted" style="margin-top:6px">Enregistré.</div>':''}`;
  if(G)h+=pSaveBar(g);
  return h;}
/* ---------- Lot 4 : Paramètres › Profils ---------- */
function viewProfils(){const G=isGest(),E=ppEls(),n={};for(const e of Object.values(E))n[e.prof]=(n[e.prof]||0)+1;
  return `<div class="card"><h3 class="rs" style="margin-top:0">Profils <span class="muted small">6</span></h3>${G?'':'<div class="rolock">Lecture seule : réservé aux personnes ayant les droits de gestion.</div>'}
  <div class="prl">${PROFILS.map(p=>{const x=prOf(p);return `<button class="prr" data-act="pfOpen" data-p="${esc(p)}"><span><b>${esc(x.m)}${x.f&&x.f!==x.m?' / '+esc(x.f):''}</b><small>${PROFCOMPS[p].map(esc).join(' · ')}</small><small>Tableau de PP : ${n[p]||0} éléments · Traits : ${x.traits.map(esc).join(', ')||'—'}</small></span><span aria-hidden="true">›</span></button>`;}).join('')}</div></div>
  ${G&&ppFxPlan().length?`<div class="card" style="margin-top:10px"><b>Effets des éléments du tableau de PP</b><div class="muted small">${ppFxPlan().length} éléments ont un bonus dans leur précision (« Fortune +1 », « +1 en Classe si… ») mais aucun effet. Préremplir : Permanent pour la Fortune, Jet pour les compétences ; les cas non reconnus sont signalés dans Paramètres › Données. À faire après une sauvegarde.</div><div class="actions"><button class="btn pri" data-act="ppFxPre">Préremplir les effets</button></div></div>`:''}
  <div class="muted small" style="margin-top:10px">Les 6 profils et leurs compétences sont fixes. Noms, traits, spécialités, titre et tableau de points de personnage se modifient ici.</div>`;}
const PF_KINDS=new Set(['pfEd','ppEl','ppBuy','traits','riEye','ppAb']);
const PF_ACTS=new Set(['pfOpen','pfTab','pfRub','pfTrDel','pfTrAdd','pfSpEd','pfSpAdd','pfSpDel','pfSpOk','pfSpCancel','pfSave','ppElOpen','ppElNew','ppElBack','ppElSeg','ppElTg','ppPreNew','ppPreT','ppPreOk','ppPreDel','ppPreCancel','ppElSave','ppElDel','ppElDelOk',
  'ppRub','ppAch','ppPick','ppTitre','ppOther','ppBack','ppOpt','ppOv','ppBuyOk','trOpen','trSave','ppTg','ppCGo','ppCBack','ppCOpt','ppCDel','ppCBuy','ppAb','ppAbOk','ppFxPre']);
const PP_CART_ACTS=new Set(['ppTg','ppCGo','ppCBack','ppCOpt','ppCDel','ppCBuy']);
function pfDraft(p){const x=prOf(p),sp={};for(const k of PROFCOMPS[p])sp[k]=clone(CATSPEC[k]||[]);
  return {kind:'pfEd',p,tab:'prof',rub:'A',m:x.m||'',f:x.f||'',traits:x.traits.slice(),tnew:'',specs:sp,spEd:null,tnom:x.titre.nom,tdesc:x.titre.desc||'',fx:clone(x.titre.fx||[]),fxEd:null,err:''};}
const sheetW=(lab,inner)=>`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(lab)}"><div class="in">${inner}</div></div>`;
const pfSeg=(act,cur,opts,ex='')=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-act="${act}" data-v="${v}"${ex} aria-pressed="${cur===v}">${l}</button>`).join('')}</div>`;
function pfSheet(g){if(g.kind==='pfEd')return pfEdSheet(g);if(g.kind==='ppEl')return ppElSheet(g);if(g.kind==='ppBuy')return ppBuySheet(g);if(g.kind==='traits')return traitsSheet(g);if(g.kind==='riEye')return riEyeSheet(g);if(g.kind==='ppAb')return ppAbSheet(g);return '';}
function pfEdSheet(g){const G=isGest(),p=g.p;let h=`<div class="shd"><h2>${esc(g.m||p)}${g.f&&g.f!==g.m?' / '+esc(g.f):''}</h2></div>${pfSeg('pfTab',g.tab,[['prof','Profil'],['tab','Tableau de PP']])}`;
  if(g.spEd){const e=g.spEd;return sheetW('Spécialités',`<div class="shd"><h2>Spécialités · ${esc(e.comp)}</h2></div><div class="muted small">Nom, caractéristique associée, et case cochée si la spécialité est réservée (à justifier).</div>
    ${e.list.map((x,i)=>`<div class="spr"><input type="text" data-pfs="${i}" data-c="0" value="${esc(x[0]||'')}" aria-label="Nom"><input type="text" data-pfs="${i}" data-c="1" value="${esc(x[1]||'')}" aria-label="Caractéristique" style="max-width:110px"><label class="small"><input type="checkbox" data-pfs="${i}" data-c="2"${x[2]?' checked':''}> réservée</label><button class="btn ghost" data-act="pfSpDel" data-i="${i}" aria-label="Retirer">✕</button></div>`).join('')||'<div class="muted small">Aucune spécialité.</div>'}
    <button class="btn ghost" data-act="pfSpAdd">+ Spécialité</button><div class="actions"><button class="btn" data-act="pfSpCancel">Annuler</button><button class="btn pri" data-act="pfSpOk">Valider</button></div>`);}
  if(g.tab==='tab'){const E=ppEls(),L=Object.entries(E).filter(([,e])=>e.prof===p&&e.rub===g.rub);
    h+=`<div style="margin-top:10px">${pfSeg('pfRub',g.rub,PP_RUB.map(r=>[r[0],r[2]]))}</div><h3 class="rs">${esc(PP_RUB.find(r=>r[0]===g.rub)[1])}</h3>
    <div class="ppl">${L.map(([id,e])=>`<button class="ppi" data-act="ppElOpen" data-id="${esc(id)}"><span>${esc(e.nom)}${e.excl?' <b title="Réservé au profil">*</b>':''}${e.nocrea?' <span class="tagc">pas à la création</span>':''}${e.rub==='A'&&e.fortP!=null?`<small> · Fortune ${e.fortP}${e.fortS!=null?' ou +'+e.fortS+' si secondaire':''}</small>`:''}${(e.pre||[]).length?`<small> · ${e.pre.map(ppPreTxt).map(esc).join(', ')}</small>`:''}</span><b class="num">${esc(ppCostTxt(e))}</b></button>`).join('')||'<div class="muted small">Aucun élément.</div>'}</div>
    ${G?'<button class="btn ghost" data-act="ppElNew" style="margin-top:8px">+ Élément</button>':''}
    <div class="muted small" style="margin-top:8px">* réservé à ce profil. Deux coûts : contact humain / fée, ou fée traditionnelle / moderne pour les titres. Le titre du profil a sa carte dans l'onglet Profil.</div>
    <div class="actions"><button class="btn" data-act="closeSheet">Fermer</button></div>`;
    return sheetW('Profil '+p,h);}
  h+=`<fieldset class="pf"${G?'':' disabled'}><div class="frow"><div class="field${elMiss(g,'m')}"><label for="pfm">Nom (masculin)</label><input id="pfm" type="text" data-pfe="m" value="${esc(g.m)}"></div><div class="field"><label for="pff">Nom (féminin)</label><input id="pff" type="text" data-pfe="f" value="${esc(g.f)}"></div></div>
    <div class="lab2">Traits de caractère <span class="muted small" style="text-transform:none;letter-spacing:0">(liste proposée à la création)</span></div>
    <div class="fxl">${g.traits.map((x,i)=>`<span class="rchip">${esc(x)}${G?`<button data-act="pfTrDel" data-i="${i}" aria-label="Retirer ${esc(x)}">✕</button>`:''}</span>`).join('')||'<span class="muted small">Aucun.</span>'}</div>
    ${G?`<div class="radd"><input type="text" data-pfe="tnew" value="${esc(g.tnew)}" placeholder="Nouveau trait…" aria-label="Nouveau trait"><button class="btn" data-act="pfTrAdd">Ajouter</button></div>`:''}
    <div class="lab2">Compétences · 4</div>${PROFCOMPS[p].map(k=>`<div class="pfc"><span><b>${esc(k)}</b><small>Spécialités : ${(g.specs[k]||[]).map(x=>esc(x[0])+(x[2]?'*':'')).join(' · ')||'—'}</small></span>${G?`<button class="btn ghost" data-act="pfSpEd" data-k="${esc(k)}">Modifier</button>`:''}</div>`).join('')}
    <div class="card ptc"><div class="prof-head"><b>${ICON.medaille||''} ${esc(g.tnom||titreDef(p))}</b><span class="pill acc">${PPT_COST} PP</span></div>
    <div class="frow"><div class="field"><label for="pft">Nom</label><input id="pft" type="text" data-pfe="tnom" value="${esc(g.tnom)}"></div><div class="field"><label>Condition</label><div class="muted" style="padding-top:8px">${PPT_PTS} points de compétences dans le profil</div></div></div>
    <div class="field"><label for="pfd">Bonus accordés</label><textarea id="pfd" rows="2" data-pfe="tdesc">${esc(g.tdesc)}</textarea></div>
    <div class="lab2">Effets</div>${G?fxBox('dlg',g):(g.fx||[]).map(e=>fxChip(e)).join('')||'<span class="muted small">Aucun effet.</span>'}</div></fieldset>
    ${g.err?`<div class="bad small" role="alert">${esc(g.err)}</div>`:''}
    <div class="actions"><button class="btn" data-act="closeSheet">${G?'Annuler':'Fermer'}</button>${G?'<button class="btn pri" data-act="pfSave">Enregistrer</button>':''}</div>`;
  return sheetW('Profil '+p,h);}
function ppElDraft(id,prof,rub,back){const e=id?ppEls()[id]:{prof,rub,nom:'',cost:{k:'u',a:null,b:null},excl:false,nocrea:false,fortP:null,fortS:null,spec:'',pre:[],prec:'',fx:[]};
  const k=e.cost||{k:'u'};return {kind:'ppEl',id:id||null,prof:e.prof,rub:e.rub,nom:e.nom,ck:k.k,ca:k.a==null?'':String(k.a),cb:k.b==null?'':String(k.b),excl:!!e.excl,crea:!e.nocrea,
    fortP:e.fortP==null?'':String(e.fortP),fortS:e.fortS==null?'':String(e.fortS),spec:e.spec||'',pre:clone(e.pre||[]),preEd:null,prec:e.prec||'',fx:clone(e.fx||[]),fxEd:null,err:'',del:false,back};}
function ppElSheet(g){const G=isGest(),req='<span style="color:var(--bad)">*</span>',tg=(f,on,lab,sub)=>`<div class="tgrow"><span>${lab}<small class="muted"> ${sub}</small></span><button class="tgb" data-act="ppElTg" data-f="${f}" role="switch" aria-checked="${on}" aria-label="${esc(lab)}"><span class="tg${on?' on':''}"></span></button></div>`;
  const ck=g.ck,lab2=ck==='hf'?['Humain','Fée']:ck==='tm'?['Traditionnelle','Moderne']:['Coût',''];
  const pe=g.preEd,copt=v=>COMPS_ALL.map(c=>`<option${v===c?' selected':''}>${esc(c)}</option>`).join(''),popt=v=>PROFILS.map(p=>`<option value="${p}"${v===p?' selected':''}>${esc(prOf(p).m)}</option>`).join('');
  let h=`<div class="shd"><h2>${esc(g.id?g.nom||'Élément':'Nouvel élément')}</h2></div><div class="muted small">${esc(prOf(g.prof).m)} · tableau de points de personnage</div><fieldset class="pf"${G?'':' disabled'}>
  <div class="field${elMiss(g,'nom')}"><label for="ppen">Nom ${req}</label><input id="ppen" type="text" data-ppe="nom" value="${esc(g.nom)}"></div>
  <div class="field"><label for="pper">Rubrique ${req}</label><select id="pper" data-ppe="rub">${PP_RUB.map(r=>`<option value="${r[0]}"${g.rub===r[0]?' selected':''}>${esc(r[1])}</option>`).join('')}</select></div>
  <div class="field${elMiss(g,'cost')}"><label>Coût en PP ${req}</label>${pfSeg('ppElSeg',ck,[['u','Coût unique'],['hf','Humain / fée'],['tm','Trad. / moderne']],' data-f="ck"')}
  <div class="frow" style="margin-top:6px"><div class="field"><label for="ppca">${lab2[0]}</label><input id="ppca" type="number" step="0.5" min="0" inputmode="decimal" data-ppe="ca" value="${esc(g.ca)}"></div>${ck!=='u'?`<div class="field"><label for="ppcb">${lab2[1]}</label><input id="ppcb" type="number" step="0.5" min="0" inputmode="decimal" data-ppe="cb" value="${esc(g.cb)}"></div>`:''}</div>
  ${ck==='hf'?'<div class="muted small">Laisser une case vide si le contact n\'existe qu\'en humain ou qu\'en fée.</div>':''}</div>
  ${tg('excl',g.excl,'Réservé au profil','seul un '+prOf(g.prof).m+' peut le prendre')}${tg('crea',g.crea,'Achetable à la création','non pour les prototypes et certains titres')}
  <div class="lab2">Prérequis</div><div class="fxl">${g.pre.map((x,i)=>`<span class="rchip">${esc(ppPreTxt(x))}${G?`<button data-act="ppPreDel" data-i="${i}" aria-label="Retirer">✕</button>`:''}</span>`).join('')}${G&&!pe?'<button class="fxadd" data-act="ppPreNew">+ Prérequis</button>':''}${!g.pre.length&&!G?'<span class="muted small">Aucun.</span>':''}</div>
  ${pe?`<div class="fxed">${pfSeg('ppPreT',pe.t,[['comp','Compétence'],['prof','Profil'],['fort','Fortune'],['spec','Spécialité']])}<div class="frow" style="margin-top:6px">${pe.t==='comp'?`<div class="field"><label>Compétence</label><select data-ppp="n">${copt(pe.n)}</select></div>`:pe.t==='prof'?`<div class="field"><label>Profil</label><select data-ppp="n">${popt(pe.n)}</select></div>`:pe.t==='spec'?`<div class="field"><label>Spécialité</label><input type="text" data-ppp="n" value="${esc(pe.n)}"></div>`:''}${pe.t!=='spec'?`<div class="field"><label>${pe.t==='prof'?'Rang minimum':'Minimum'}</label><input type="number" min="0" max="15" data-ppp="v" value="${esc(pe.v)}"></div>`:''}</div>
    <div class="actions"><button class="btn" data-act="ppPreCancel">Annuler</button><button class="btn pri" data-act="ppPreOk">Ajouter</button></div></div>`:''}
  ${g.rub==='A'?`<div class="lab2">Effets de l'activité</div><div class="frow"><div class="field"><label for="ppfp">Fortune (activité principale)</label><input id="ppfp" type="number" min="0" max="15" data-ppe="fortP" value="${esc(g.fortP)}"></div><div class="field"><label for="ppfs">Fortune (activité secondaire) +</label><input id="ppfs" type="number" min="0" max="5" data-ppe="fortS" value="${esc(g.fortS)}"></div></div>
  <div class="field"><label for="ppsp">Spécialité offerte (activité principale)</label><input id="ppsp" type="text" data-ppe="spec" value="${esc(g.spec)}" list="ppspl" autocomplete="off"><datalist id="ppspl">${Object.values(CATSPEC).flat().map(x=>`<option value="${esc(x[0])}">`).join('')}</datalist></div>`:''}
  <div class="lab2">Autres effets</div>${G?fxBox('dlg',g):(g.fx||[]).map(e=>fxChip(e)).join('')||'<span class="muted small">Aucun effet.</span>'}
  <div class="field"><label for="ppep">Précision <span class="muted small">(facultatif)</span></label><textarea id="ppep" rows="2" data-ppe="prec">${esc(g.prec)}</textarea></div></fieldset>
  ${g.err?`<div class="bad small" role="alert">${esc(g.err)}</div>`:''}
  ${g.del?`<div class="card" style="border-color:var(--bad)"><div class="small">Supprimer cet élément du tableau ? Les achats déjà faits restent sur les fiches.</div><div class="actions"><button class="btn" data-act="ppElDel">Garder</button><button class="btn pri" data-act="ppElDelOk">Supprimer</button></div></div>`:''}
  <div class="actions"><button class="btn" data-act="ppElBack">${G?'Annuler':'Retour'}</button>${G&&g.id?'<button class="btn ghost" data-act="ppElDel">Supprimer</button>':''}${G?'<button class="btn pri" data-act="ppElSave">Enregistrer</button>':''}</div>`;
  return sheetW('Élément du tableau',h);}
function ppElSave(g){const nom=(g.nom||'').trim(),num=v=>v===''||v==null?null:+String(v).replace(',','.');const a=num(g.ca),b=num(g.cb),miss=[];
  if(!nom)miss.push('le nom');if(g.ck==='u'&&(a==null||isNaN(a)))miss.push('le coût');if(g.ck==='hf'&&a==null&&b==null)miss.push('au moins un coût');if(g.ck==='tm'&&(a==null||b==null))miss.push('les deux coûts');
  g.errF=[!nom&&'nom',miss.some(m=>/coût/.test(m))&&'cost'].filter(Boolean);if(miss.length){g.err='Enregistrement impossible. À compléter : '+miss.join(', ')+'.';refuse();return false;}
  const e={prof:g.prof,rub:g.rub,nom,cost:{k:g.ck,a,b:g.ck==='u'?null:b},excl:!!g.excl,nocrea:!g.crea,fortP:g.rub==='A'?num(g.fortP):null,fortS:g.rub==='A'?num(g.fortS):null,spec:g.rub==='A'?(g.spec||'').trim():'',pre:clone(g.pre),prec:(g.prec||'').trim(),fx:clone(g.fx||[])};
  prSaveDoc(d=>{let id=g.id;if(!id){id=freeId(d.el,'pp-'+slugOf(nom));}d.el[id]=e;});return true;}
/* Achat dans le tableau du profil */
function ppRows(c,prof){return Object.entries(ppEls()).filter(([,e])=>e.prof===prof);}
const ppStar=e=>e.excl?' *':'';
function ppBuySheet(g){const c=S.chars[g.cid],pr=c&&(c.profils||[]).find(x=>x.nom===g.prof);if(!pr)return '';
  if(g.sel)return ppConfirmSheet(g,c,pr);
  if(g.step==='cart')return ppCartSheet(g,ppCtxGame(c,pr,g),'Points de personnage');
  const have=ppHave(pr),rk=rankOf(c,pr),q=nrm(g.q||''),bought={};for(const a of ppBought(c))bought[a.ppel.id]=(bought[a.ppel.id]||[]).concat(a.ppel);
  const P=prOf(g.prof),tid='titre:'+g.prof,sum=ppSum(c,pr);
  let h=`<div class="shd" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2>${esc(profLab(g.prof,c))}</h2><span class="ppf" aria-label="PP disponibles"><small>PP</small>${esc(ppFmt(have))}</span></div>
  <div class="muted small">${esc(c.court)} dépense ses PP ${esc(profLab(g.prof,c))} dans ce tableau uniquement.</div>`;
  if(rk>=4){const got=bought[tid],ok=!got&&sum>=PPT_PTS&&have>=PPT_COST;h+=`<div class="card ptc"><div class="prof-head"><b>${ICON.medaille||''} ${esc(P.titre.nom)}</b>${got?'<span class="pill acc">acquis</span>':`<button class="btn${ok?' pri':''}" data-act="ppTitre"${ok?'':' disabled'}>${PPT_COST} PP</button>`}</div><div class="muted small">${sum} / ${PPT_PTS} points de compétences · ${esc(ppFmt(have))} / ${PPT_COST} PP${P.titre.desc?' · '+esc(P.titre.desc):''}</div></div>`;}
  h+=`<div class="field"><input type="search" data-ppb="q" value="${esc(g.q||'')}" placeholder="Rechercher dans le tableau…" aria-label="Rechercher dans le tableau"></div><div class="field" style="display:flex;align-items:center;gap:8px"><label for="pprub" style="margin:0">Catégorie</label><select id="pprub" data-pprub="1" style="flex:1">${[['all','Tout'],...PP_RUB.map(r=>[r[0],r[2]])].map(([v,l])=>`<option value="${v}"${g.rub===v?' selected':''}>${esc(l)}</option>`).join('')}</select></div>`; /* UX1 : menu au lieu des boutons */
  /* Recette lot C : panier (cases à cocher, bandeau « Valider »), éléments trop chers grisés, filtre « Achetables » actif par défaut */
  const ctx=ppCtxGame(c,pr,g);h+=ppCartList(g,ctx,ppRows(c,g.prof));
  h+=`<button class="ppi oth" data-act="ppOther"><span>+ Autre achat <small>· saisie libre : intitulé et coût</small></span></button>
  <div class="muted small" style="margin-top:6px">* réservé à ce profil. Coche les éléments puis « Valider ». Grisé : pas achetable pour l'instant (raison en petit). Atteindre le rang N de ce profil ajoute N PP automatiquement.</div><div class="actions"><button class="btn" data-act="closeSheet">Fermer</button></div>`+(g._bar||'');
  return sheetW('Points de personnage',h);}
/* ---------- Recette du lot C (25/11/2026) : panier d'achats en PP, commun au jeu (ppBuy) et à l'assistant (cwPP) ----------
   g.cart=[{id,opt,prec}] ; g.step='cart' = récapitulatif. ctx = {c, prof, have, pool:{C,L}, owned:{id:[…]}, actP, actS, crea, pfx, ov, fort0}. */
function ppCtxGame(c,pr,g){const owned={};for(const a of ppBought(c))if(!a.ppel.fin)owned[a.ppel.id]=(owned[a.ppel.id]||[]).concat(a.ppel);
  const P=ppActOf(c,'p'),Sx=ppActOf(c,'s');return {c,prof:g.prof,have:ppHave(pr),pool:{C:0,L:0},owned,actP:P&&{nom:P.ppel.nom,x:P.ppel,aid:P.id},actS:Sx&&{nom:Sx.ppel.nom,x:Sx.ppel,aid:Sx.id},crea:false,pfx:'pp',ov:canEdit(),fort0:lv(c,'fortune')};}
function ppCartDefOpt(e,ctx,cart){if(e.rub==='A')return ctx.actP||cart.some(x=>x.opt==='p'&&(ppEls()[x.id]||{}).rub==='A')?'s':'p';
  const k=e.cost||{};if(k.k==='hf')return k.a==null?'f':'h';if(k.k==='tm'&&isExoF(ctx.c))return 'm';return '';}
/* Coût de chaque ligne : points de Contact et de langue d'abord (création), le reste en PP du profil */
function ppCartCalc(ctx,cart){let pc=ctx.pool.C||0,pl=ctx.pool.L||0,tot=0,sum=0;const items=[];
  for(const it of cart){const e=ppEls()[it.id];if(!e)continue;const cost=ppCost(e,it.opt,ctx.c);let rest=cost,u=0;
    if(e.rub==='C'){u=Math.min(rest,pc);pc-=u;rest-=u;}else if(e.rub==='L'){u=Math.min(rest,pl);pl-=u;rest-=u;}
    tot+=rest;sum+=cost;items.push({it,e,cost,pp:rest,pool:u});}
  for(const o of ['p','s']){const old=o==='p'?ctx.actP:ctx.actS;if(old&&old.refund&&items.some(k=>k.e.rub==='A'&&k.it.opt===o))tot-=old.refund;} /* création : l'activité remplacée rend ses PP */
  return {items,tot,sum,rest:ctx.have-tot,pc,pl};}
/* Part de Fortune de chaque ligne (en jeu : ajustement de la Fortune de la fiche) */
const ppCartX=(id,e,opt,prof)=>{const x={id,prof:prof||e.prof,rub:e.rub,nom:e.nom,opt};if(e.rub==='A'){if(opt==='p'&&e.fortP!=null)x.fort=e.fortP;if(opt==='s'&&e.fortS!=null)x.fortS=e.fortS;if(opt==='p'&&e.spec)x.spec=e.spec;}return x;};
function ppFortStep(cur,max,x,old){let d;if(x.rub==='A'&&(x.opt==='p'||x.opt==='s')){d=old?ppElFort(x)-ppElFort(old):x.opt==='p'?Math.max(0,(+x.fort||0)-cur)+ppFxFort(x):ppElFort(x);}else d=ppElFort(x);
  const n=Math.max(0,Math.min(max,cur+d));return {d:n-cur,cur:n};}
function ppCartErr(ctx,K){const A=K.items.filter(x=>x.e.rub==='A'),err=[];
  if(A.filter(x=>x.it.opt==='p').length>1)err.push('Une seule activité principale.');if(A.filter(x=>x.it.opt==='s').length>1)err.push('Une seule activité secondaire.');
  if(K.rest<0)err.push('PP insuffisants.');if(!ctx.ov&&K.items.some(x=>ppPreMiss(x.e,ctx.c).length))err.push('Prérequis manquant.');return err;}
const ppFxChips=x=>ppElFx(x).filter(f=>f.t!=='rap'||f.txt).map(f=>`<span class="bn ${f.t==='jet'?'jet':f.t==='perm'?'calc':'note'}">${esc(fxLabel(f))}${f.t==='jet'&&f.txt?' · '+esc(f.txt):''}</span>`).join('');
function ppCartList(g,ctx,all0){const c=ctx.c,P=ctx.pfx,cart=g.cart||(g.cart=[]),K=ppCartCalc(ctx,cart),q=nrm(g.q||''),fa=S.ppAch!==false,inC=id=>cart.findIndex(x=>x.id===id);
  const st=([id,e])=>{const i=inC(id),got=ctx.owned[id]&&e.rub!=='L',miss=ppPreMiss(e,c),avail=K.rest+(e.rub==='C'?K.pc:e.rub==='L'?K.pl:0),dear=i<0&&ppCostMin(e,c)>avail;
    const why=[got?(ctx.crea?'déjà choisi':'déjà possédé'):'',dear?'PP insuffisants (reste '+ppFmt(Math.max(0,avail))+')':'',miss.length?'prérequis : '+miss.map(ppPreTxt).join(', ')+(ctx.ov?' (passer outre : gestion)':''):''].filter(Boolean).join(' · ');
    const dis=i<0&&(got||dear||(miss.length&&!ctx.ov));return {id,e,i,got,miss,dis,ok:i>=0||(!dis&&!miss.length),why};};
  const all=all0.filter(([,e])=>(g.rub==='all'||e.rub===g.rub)&&(!q||nrm(e.nom).includes(q))).map(st),nOk=all.filter(x=>x.ok&&x.i<0).length;
  let h=`<div style="display:flex;justify-content:flex-end;margin:4px 0 2px"><button type="button" class="chip" data-act="ppAch" aria-pressed="${fa}">Achetables · ${nOk}</button></div>`;
  const rows=fa?all.filter(x=>x.ok):all;
  for(const r of PP_RUB){const L=rows.filter(x=>x.e.rub===r[0]);if(!L.length)continue;
    h+=`<h3 class="rs">${esc(r[1])}</h3><div class="ppl">${L.map(x=>{const e=x.e,on=x.i>=0,sub=[e.rub==='A'&&e.fortP!=null?'Fortune '+e.fortP+(e.fortS!=null?' (secondaire +'+e.fortS+')':''):'',e.nocrea&&!ctx.crea?'pas à la création':''].filter(Boolean).join(' · ');
      return `<button type="button" class="ppi ppw ppck${on?' sel':''}${x.dis?' off':''}${x.ok?' ok':' no'}" role="checkbox" aria-checked="${on}" data-act="${P}Tg" data-id="${esc(x.id)}"${x.dis?' disabled':''}><span class="ppbox" aria-hidden="true">${on?'✓':''}</span><span class="ppt">${esc(e.nom+ppStar(e))}${sub?` <small>· ${esc(sub)}</small>`:''}${(e.fx||[]).length?`<span class="ppfx">${ppFxChips({id:x.id})}</span>`:''}${x.why?`<span class="why">${esc(x.why)}</span>`:''}</span><b class="num">${esc(ppCostTxt(e))}</b></button>`;}).join('')}</div>`;}
  if(!rows.length)h+=`<div class="muted small" style="margin:10px 0">${fa&&all.length?'Aucun élément achetable pour l\'instant.':'Aucun élément.'}</div>`;
  g._bar=`<div class="ppbar" role="status"><span><b>${cart.length} élément${cart.length>1?'s':''}</b><small>Total ${esc(ppFmt(K.sum))} PP · reste ${esc(ppFmt(K.rest))}</small></span><button type="button" class="btn" data-act="${P}CGo"${cart.length?'':' disabled'}>Valider</button></div>`;
  return h;}
/* Récapitulatif du panier : options, précision, effets, Fortune avant → après */
function ppCartSheet(g,ctx,lab){const c=ctx.c,P=ctx.pfx,cart=g.cart||[],K=ppCartCalc(ctx,cart),err=ppCartErr(ctx,K);
  let f=ctx.fort0,fmax=(c.fortune&&c.fortune.max)||15;const fr=ctx.crea?ctx.fortAfter(cart):null;
  const lines=K.items.map((k,i)=>{const e=k.e,it=k.it,x=ppCartX(it.id,e,it.opt,ctx.prof),kc=e.cost||{},miss=ppPreMiss(e,c);let opt='',warn=[];
    if(e.rub==='A')opt=pfSeg(P+'COpt',it.opt,[['p','Principale'],['s','Secondaire']],` data-i="${i}"`);
    else if(kc.k==='hf'&&kc.a!=null&&kc.b!=null)opt=pfSeg(P+'COpt',it.opt,[['h','Humain'],['f','Fée']],` data-i="${i}"`);
    else if(kc.k==='tm'&&isExoF(c))opt=pfSeg(P+'COpt',it.opt==='t'?'t':'m',[['m','Fée moderne'],['t','Fée traditionnelle']],` data-i="${i}"`);
    const old=e.rub==='A'?(it.opt==='p'?ctx.actP:it.opt==='s'?ctx.actS:null):null;
    if(old)warn.push('Remplace '+old.nom+' (activité '+(it.opt==='p'?'principale':'secondaire')+')');
    if(!ctx.crea){const r=ppFortStep(f,fmax,x,old&&old.x);if(r.d)warn.push('Fortune '+f+' → '+r.cur+' ('+sgn(r.d)+')');f=r.cur;}
    if(miss.length)warn.push('Prérequis manquant : '+miss.map(ppPreTxt).join(', ')+(ctx.ov?' (passer outre : gestion)':''));
    const bits=[e.rub==='A'&&it.opt==='p'&&e.fortP!=null?'Fortune '+e.fortP:'',e.rub==='A'&&it.opt==='s'&&e.fortS!=null?'Fortune +'+e.fortS:'',e.rub==='A'&&it.opt==='p'&&e.spec?'spécialité '+e.spec+' offerte':'',k.pool?ppFmt(k.pool)+(e.rub==='C'?' pt de Contact':' pt de langue'):''].filter(Boolean);
    return `<div class="ppln"><div class="pplt"><b>${esc(e.nom)}</b><span class="num">${esc(ppFmt(k.cost))} PP</span><button type="button" class="ibtn" data-act="${P}CDel" data-i="${i}" aria-label="Retirer ${esc(e.nom)} du panier">✕</button></div>
      ${opt}${bits.length?`<div class="muted small">${esc(bits.join(' · '))}</div>`:''}${(e.fx||[]).length?`<div>${ppFxChips({id:it.id})}</div>`:''}${e.prec?`<div class="muted small">${esc(e.prec)}</div>`:''}${warn.map(w=>`<div class="small ppwarn">${esc(w)}</div>`).join('')}
      <input type="text" data-ppcart="${i}" value="${esc(it.prec||'')}" placeholder="${e.rub==='C'?'Nom du PNJ':'Précision (facultatif)'}" aria-label="${e.rub==='C'?'Nom du PNJ':'Précision'} : ${esc(e.nom)}" autocomplete="off"${e.rub==='C'?' list="ctcdl"':''}>${e.rub==='C'?`<div class="muted small">${ctx.crea?'À la validation de la fiche, ':''}relié au PNJ de ce nom ; s'il n'existe pas, sa fiche est créée (nom seul).</div>`:''}</div>`;}).join('')+(K.items.some(k=>k.e.rub==='C')?`<datalist id="ctcdl">${Object.values(S.chars).filter(p=>p.type==='PNJ'&&vis(p)).map(p=>`<option value="${esc(p.court||p.nom)}">`).join('')}</datalist>`:'');
  const f1=ctx.crea?fr:f;
  return sheetW(lab,`<div class="shd" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2>Mon panier · ${esc(profLab(ctx.prof,c))}</h2><span class="ppf"><small>Total</small>${esc(ppFmt(K.sum))}</span></div>
    ${lines||'<div class="muted small">Panier vide.</div>'}
    <div class="calc"><span>Total</span><b>${esc(ppFmt(K.sum))} PP${K.sum!==K.tot?' (dont '+esc(ppFmt(K.sum-K.tot))+' en points de Contact / langue)':''}</b><span>Fortune</span><b>${ctx.fort0}${f1!==ctx.fort0?' → '+f1:''}</b><span>Reste après achat</span><b>${esc(ppFmt(K.rest))} PP ${esc(profLab(ctx.prof,c))}</b></div>
    ${err.map(x=>`<div class="bad small">${esc(x)}</div>`).join('')}
    ${ctx.crea?'':'<div class="muted small">Chaque achat est inscrit dans l\'historique et peut y être annulé (la Fortune est alors rétablie).</div>'}
    <div class="actions"><button class="btn" data-act="${P}CBack">Retour</button><button class="btn pri" data-act="${P}CBuy"${cart.length&&!err.length?'':' disabled'}>Acheter</button></div>`);}
/* Actions communes du panier ; renvoie true si traitée */
function ppCartAct(a,d,g,ctx){const P=ctx.pfx,cart=g.cart||(g.cart=[]);
  if(a===P+'Tg'){const e=ppEls()[d.id];if(!e)return true;const i=cart.findIndex(x=>x.id===d.id);if(i>=0)cart.splice(i,1);else cart.push({id:d.id,opt:ppCartDefOpt(e,ctx,cart),prec:''});return true;}
  if(a===P+'CGo'){if(cart.length)g.step='cart';return true;}
  if(a===P+'CBack'){g.step='';return true;}
  if(a===P+'COpt'){const it=cart[+d.i];if(it)it.opt=d.v;return true;}
  if(a===P+'CDel'){cart.splice(+d.i,1);if(!cart.length)g.step='';return true;}
  return false;}
/* Achat en jeu : une ligne d'achat par élément, Fortune ajustée, activité remplacée marquée terminée */
function ppCartBuy(g){const c0=S.chars[g.cid];if(!c0||!canEditC(c0))return;const pr0=(c0.profils||[]).find(x=>x.nom===g.prof);if(!pr0)return;
  const ctx=ppCtxGame(c0,pr0,g),K=ppCartCalc(ctx,g.cart||[]);if(!K.items.length||ppCartErr(ctx,K).length)return;
  const c=clone(c0),pr=(c.profils||[]).find(x=>x.nom===g.prof),dt=today(),gd=typeof chNow==='function'?chNow():null;c.achats=c.achats||[];c.fortune=c.fortune||{max:15,cur:0};
  let fcur=c.fortune.cur||0;const fmax=c.fortune.max||15;
  K.items.forEach((k,j)=>{const e=k.e,it=k.it,x=ppCartX(it.id,e,it.opt,g.prof),prec=(it.prec||'').trim(),aid='a'+Date.now().toString(36)+j+Math.floor(Math.random()*1e3);if(prec)x.prec=prec;ctcLinkX(x);if(gd)x.debut=gd;
    const oldA=e.rub==='A'&&(it.opt==='p'||it.opt==='s')?c.achats.find(a=>a.ppel&&a.ppel.rub==='A'&&a.ppel.opt===it.opt&&!a.ppel.fin):null;
    const r=ppFortStep(fcur,fmax,x,oldA&&oldA.ppel);fcur=r.cur;
    const a={id:aid,date:dt,label:`PP ${g.prof} - ${ppFmt(k.cost)} - ${e.nom}${x.opt?' ('+PPOPT[x.opt]+')':''}${prec?' : '+prec:''}`,cout:0,key:'pp:'+g.prof,pp:k.cost,ppel:x};
    if(r.d)a.fortD=r.d;if(oldA){oldA.ppel.fin=gd||{};oldA.ppel.finT='remp';a.remp=oldA.id;}
    c.achats.push(a);
    if(x.spec&&!specsOf(c).some(s=>nrmS(s.nom)===nrmS(x.spec))){const cp=specComp(x.spec);c.spec=c.spec||{cur:0};c.spec.cur=(c.spec.cur||0)+1;c.specs=[...specsOf(c),{nom:x.spec,cible:cp?'comp:'+cp:null,offert:true,ppa:aid}];}});
  pr.note=ppHave(pr)-K.tot;c.fortune.cur=fcur;S.dlg=null;saveChar(c);toast(K.items.length>1?K.items.length+' achats enregistrés':'Achat enregistré');}
/* Abandon / retrait d'un titre ou d'un élément « Fortune +x » : bonus retiré, pas de remboursement, gardé grisé « jusqu'au … » */
function ppAbSheet(g){const c=S.chars[g.cid],a=c&&(c.achats||[]).find(x=>x.id===g.aid);if(!a||!a.ppel||a.ppel.fin||!canEditC(c))return '';const x=a.ppel,v=ppElFort(x),f=lv(c,'fortune'),f1=Math.max(0,f-v),gd=typeof chNow==='function'?chNow():null;
  return sheetW('Abandonner',`<div class="shd"><h2>Abandonner / retirer</h2></div><p class="small">« ${esc(x.nom)} »${v?` : Fortune ${f} → ${f1}`:''}. Aucun PP n'est rendu. L'élément reste affiché, grisé, ${gd?"jusqu'au "+esc(chDateTxt(gd))+' (date du jeu)':'avec la mention « abandonné » (pas de date du jeu)'}.</p>
    <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="ppAbOk">Abandonner</button></div>`);}
function ppAbandon(g){const c0=S.chars[g.cid];if(!canEditC(c0))return;const c=clone(c0),a=(c.achats||[]).find(x=>x.id===g.aid);if(!a||!a.ppel||a.ppel.fin)return;
  const v=ppElFort(a.ppel);c.fortune=c.fortune||{max:15,cur:0};const f=c.fortune.cur||0,n=Math.max(0,f-v);c.fortune.cur=n;
  a.ppel.fin=(typeof chNow==='function'&&chNow())||{};a.ppel.finT='ab';if(f-n)a.ppel.finD=f-n;S.dlg=null;saveChar(c);toast('Abandonné');}
function ppSelEl(g,c){if(g.sel==='titre'){const P=prOf(g.prof);return {prof:g.prof,rub:'T',nom:P.titre.nom,cost:{k:'u',a:PPT_COST},pre:[],titre:true,prec:P.titre.desc||''};}return ppEls()[g.sel];}
function ppConfirmSheet(g,c,pr){const have=ppHave(pr);
  if(g.sel==='other'){const n=+String(g.ocost||'').replace(',','.')||0,ok=n>0&&(g.olab||'').trim();
    return sheetW('Autre achat',`<div class="shd"><h2>Autre achat</h2></div><div class="muted small">${esc(c.court)} · ${esc(profLab(g.prof,c))}</div>
    <div class="field"><label for="ppol">Intitulé</label><input id="ppol" type="text" data-ppb="olab" value="${esc(g.olab||'')}" autocomplete="off"></div>
    <div class="field"><label for="ppoc">Coût en PP</label><input id="ppoc" type="number" step="0.5" min="0" inputmode="decimal" data-ppb="ocost" value="${esc(g.ocost||'')}" style="max-width:140px"></div>
    <div class="calc"><span>PP disponibles</span><b>${esc(ppFmt(have))}</b></div>
    <div class="muted small">L'achat est inscrit dans l'historique et peut y être annulé.</div><div class="actions"><button class="btn" data-act="ppBack">Retour</button><button class="btn pri" data-act="ppBuyOk"${ok?'':' disabled'}>Acheter</button></div>`);}
  const e=ppSelEl(g,c);if(!e){g.sel=null;return ppBuySheet(g);}
  const k=e.cost||{},miss=ppPreMiss(e,c),G=canEdit(),prin=ppBought(c).find(a=>a.ppel.opt==='p'&&a.ppel.rub==='A');
  let opt='';if(e.rub==='A')opt=`<div class="field"><label>Activité</label>${pfSeg('ppOpt',g.opt,[['p','Principale'],['s','Secondaire']])}${prin?`<div class="muted small">${esc(c.court)} a déjà une activité principale (${esc(prin.ppel.nom)}).</div>`:''}</div>`;
  else if(k.k==='hf'&&k.a!=null&&k.b!=null)opt=`<div class="field"><label>Le contact est</label>${pfSeg('ppOpt',g.opt,[['h','Humain'],['f','Fée']])}</div>`;
  else if(k.k==='tm'&&isExoF(c))opt=`<div class="field"><label>Coût appliqué <span class="muted small">(race exotique)</span></label>${pfSeg('ppOpt',g.opt==='t'?'t':'m',[['m','Fée moderne'],['t','Fée traditionnelle']])}</div>`;
  const cost=ppCost(e,g.opt,c),eff=e.rub==='A'?(g.opt==='p'?(e.fortP!=null?'Fortune '+e.fortP:'')+(e.spec?(e.fortP!=null?' · ':'')+'spécialité '+e.spec+' offerte':''):(e.fortS!=null?'Fortune +'+e.fortS:'')):'';
  const nat=k.k==='tm'?natfOf(c):'',blocked=miss.length&&!(G&&g.ov),ok=cost<=have&&!blocked;
  return sheetW('Confirmer un achat',`<div class="shd"><h2>${esc(e.nom)}</h2></div><div class="muted small">${esc(profLab(g.prof,c))} · ${esc((PP_RUB.find(r=>r[0]===e.rub)||[])[1]||'')}</div>${opt}
  ${k.k==='tm'?`<div class="muted small">Coût selon la nature de la race : ${nat?esc(NATF[nat]):isExoF(c)?'exotique (coût de fée moderne par défaut, traditionnel au cas par cas)':'non définie (coût de fée traditionnelle)'}.</div>`:''}
  <div class="calc"><span>Coût</span><b>${esc(ppFmt(cost))} PP</b>${eff?`<span>Effet</span><b>${esc(eff)}</b>`:''}<span>Reste après l'achat</span><b>${esc(ppFmt(have-cost))} PP ${esc(profLab(g.prof,c))}</b></div>
  ${e.prec&&!e.titre?`<div class="muted small">${esc(e.prec)}</div>`:''}
  ${miss.length?`<div class="bad small">Prérequis manquant : ${miss.map(ppPreTxt).map(esc).join(', ')}.</div>${G?`<div class="tgrow"><span>Passer outre <small class="muted">(gestion)</small></span><button class="tgb" data-act="ppOv" role="switch" aria-checked="${!!g.ov}" aria-label="Passer outre"><span class="tg${g.ov?' on':''}"></span></button></div>`:''}`:''}
  ${cost>have?'<div class="bad small">PP insuffisants.</div>':''}
  <div class="field"><label for="ppbp">Précision <span class="muted small">(facultatif)</span></label><input id="ppbp" type="text" data-ppb="prec" value="${esc(g.prec||'')}" autocomplete="off"></div>
  <div class="muted small">L'achat est inscrit dans l'historique et peut y être annulé.</div>
  <div class="actions"><button class="btn" data-act="ppBack">Retour</button><button class="btn pri" data-act="ppBuyOk"${ok?'':' disabled'}>Acheter</button></div>`);}
function ppBuyOk(g){const c0=S.chars[g.cid];if(!c0)return;const c=clone(c0),pr=(c.profils||[]).find(x=>x.nom===g.prof);if(!pr)return;const have=ppHave(pr);
  const aid='a'+Date.now().toString(36)+Math.floor(Math.random()*1e3);c.achats=c.achats||[];
  if(g.sel==='other'){const n=+String(g.ocost||'').replace(',','.')||0,lab=(g.olab||'').trim();if(n<=0||!lab)return;pr.note=have-n;
    c.achats.push({id:aid,date:today(),label:`PP ${g.prof} - ${ppFmt(n)} - ${lab}`,cout:0,key:'pp:'+g.prof,pp:n});S.dlg=null;saveChar(c);toast('Achat enregistré');return;}
  const e=ppSelEl(g,c0);if(!e)return;const cost=ppCost(e,g.opt,c0);if(cost>have)return;if(ppPreMiss(e,c0).length&&!(canEdit()&&g.ov))return;
  const opt=e.rub==='A'||(e.cost&&e.cost.k==='hf')?g.opt:(e.cost&&e.cost.k==='tm'&&isExoF(c0)?(g.opt==='t'?'t':'m'):''),prec=(g.prec||'').trim();pr.note=have-cost;
  const x={id:g.sel==='titre'?'titre:'+g.prof:g.sel,prof:g.prof,rub:e.rub,nom:e.nom,opt};if(e.titre)x.titre=true;if(prec)x.prec=prec;ctcLinkX(x);
  if(e.rub==='A'){if(opt==='p'&&e.fortP!=null)x.fort=e.fortP;if(opt==='s'&&e.fortS!=null)x.fortS=e.fortS;if(opt==='p'&&e.spec)x.spec=e.spec;}
  const gd=typeof chNow==='function'?chNow():null;if(gd)x.debut=gd;c.fortune=c.fortune||{max:15,cur:0};const f0=c.fortune.cur||0,fd=Math.max(0,Math.min(c.fortune.max||15,f0+ppElFort(x)))-f0;c.fortune.cur=f0+fd; /* recette lot C */
  c.achats.push({id:aid,date:today(),label:`PP ${g.prof} - ${ppFmt(cost)} - ${e.nom}${opt?' ('+PPOPT[opt]+')':''}${prec?' : '+prec:''}`,cout:0,key:'pp:'+g.prof,pp:cost,ppel:x,...(fd?{fortD:fd}:{})});
  if(x.spec&&!specsOf(c).some(s=>nrmS(s.nom)===nrmS(x.spec))){const cp=specComp(x.spec);c.spec=c.spec||{cur:0};c.spec.cur=(c.spec.cur||0)+1;c.specs=[...specsOf(c),{nom:x.spec,cible:cp?'comp:'+cp:null,offert:true,ppa:aid}];}
  S.dlg=null;saveChar(c);toast('Achat enregistré');}
/* Traits de caractère et nature féerique */
function trDraft(c){const t=c.traits||{},[mj,mn]=profMajMin(c);return {kind:'traits',cid:c.id,natf:c.natf||natfOf(c),race:t.race||'',majP:(t.maj&&t.maj.p)||mj||'',maj:(t.maj&&t.maj.n)||'',minP:(t.min&&t.min.p)||mn||'',min:(t.min&&t.min.n)||'',libre:t.libre||''};}
function traitsSheet(g){const c=S.chars[g.cid];if(!c)return '';const hum=isHum(c),rs=raceStoredOf(c),rt=(rs&&rs.traits)||[];
  const sel=(f,list,cur)=>{const L=list.slice();if(cur&&!L.includes(cur))L.unshift(cur);return `<select data-trf="${f}"><option value="">—</option>${L.map(x=>`<option${x===cur?' selected':''}>${esc(x)}</option>`).join('')}</select>`;};
  const psel=(f,cur)=>`<select data-trf="${f}" aria-label="Profil">${(c.profils||[]).map(p=>`<option value="${esc(p.nom)}"${p.nom===cur?' selected':''}>${esc(profLab(p.nom,c))}</option>`).join('')}</select>`;
  const prow=(k,lab)=>`<div class="field"><label>${lab}</label><div class="frow">${psel(k+'P',g[k+'P'])}${sel(k,g[k+'P']?prOf(g[k+'P']).traits:[],g[k])}</div></div>`;
  return sheetW('Traits',`<div class="shd"><h2>Traits de ${esc(c.court)}</h2></div>
  ${hum?'<div class="muted small">Féal : 2 traits, celui du profil le plus haut (au choix s\'il y a égalité) et un trait libre. Pas de nature féerique.</div>':`<div class="field"><label>Nature féerique</label><div>${natfOf(c)?esc(NATF[natfOf(c)]):'non définie par la race'}</div><div class="muted small">Reprise de la famille de la race (Univers › Races) ; fixe le coût des titres et statuts.</div></div>
  <div class="field"><label>Trait de race${c.race?' ('+esc(c.race)+')':''}</label>${rt.length||g.race?sel('race',rt,g.race):'<div class="muted small">Aucun trait saisi pour cette race (fiche de race, onglet Informations).</div>'}</div>`}
  ${prow('maj',hum?'Trait du profil le plus haut':'Trait de profil majeur')}${hum?'':prow('min','Trait de profil mineur')}
  <div class="field"><label for="trl">Trait libre</label><input id="trl" type="text" data-trf="libre" value="${esc(g.libre)}" autocomplete="off"></div>
  <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="trSave">Enregistrer</button></div>`);}
function pfAct(a,d,t){const g=S.dlg,G=isGest();
  if(a==='pfOpen'){S.dlg=pfDraft(d.p);return;}
  if(a==='trOpen'){const c=S.chars[d.id||S.sel];if(!canEditC(c))return false;S.dlg=trDraft(c);return;}
  if(a==='ppAb'){const c=S.chars[d.id];if(!canEditC(c))return false;S.dlg={kind:'ppAb',cid:c.id,aid:d.a};return;}
  if(a==='ppFxPre'){if(!isGest())return false;const r=ppFxPrefill();toast(r.n?r.fx+' effet'+(r.fx>1?'s':'')+' prérempli'+(r.fx>1?'s':'')+(r.amb?' · '+r.amb+' élément'+(r.amb>1?'s':'')+' signalé'+(r.amb>1?'s':'')+' (Paramètres › Données)':''):'Rien à préremplir');return;}
  if(a==='ppAbOk'&&g&&g.kind==='ppAb'){ppAbandon(g);return false;}
  if(!g)return false;
  if(a==='ppAch'&&(g.kind==='ppBuy'||g.kind==='cwPP')){S.ppAch=S.ppAch===false;return;}
  if(g.kind==='traits'){if(a==='trSave'){const c0=S.chars[g.cid];if(!canEditC(c0))return false;const c=clone(c0),hum=isHum(c);
      const tr={};if(!hum&&g.race)tr.race=g.race;if(g.maj)tr.maj={p:g.majP,n:g.maj};if(!hum&&g.min)tr.min={p:g.minP,n:g.min};if(g.libre.trim())tr.libre=g.libre.trim();c.traits=tr;S.dlg=null;saveChar(c);toast('Traits enregistrés');return false;}
    return;}
  if(g.kind==='ppBuy'){
    if(PP_CART_ACTS.has(a)){const c=S.chars[g.cid],pr=c&&(c.profils||[]).find(x=>x.nom===g.prof);if(!pr)return;if(a==='ppCBuy'){ppCartBuy(g);return false;}ppCartAct(a,d,g,ppCtxGame(c,pr,g));return;}
    if(a==='ppRub')g.rub=d.v;else if(a==='ppPick'){const e=ppEls()[d.id];if(!e)return;const c=S.chars[g.cid];g.sel=d.id;g.prec='';g.ov=false;g.opt=e.rub==='A'?(ppBought(c).some(x=>x.ppel.opt==='p'&&x.ppel.rub==='A')?'s':'p'):(e.cost&&e.cost.k==='hf'?(e.cost.a==null?'f':'h'):'');}
    else if(a==='ppTitre'){g.sel='titre';g.opt='';g.prec='';g.ov=false;}else if(a==='ppOther'){g.sel='other';g.olab='';g.ocost='';}
    else if(a==='ppBack')g.sel=null;else if(a==='ppOpt')g.opt=d.v;else if(a==='ppOv'){if(G)g.ov=!g.ov;}
    else if(a==='ppBuyOk'){if(!canEditC(S.chars[g.cid]))return false;ppBuyOk(g);return false;}
    return;}
  if(!G)return a==='pfTab'||a==='pfRub'||a==='ppElOpen'||a==='ppElBack'?pfRO(a,d,g):false;
  if(g.kind==='pfEd'){
    if(a==='pfTab')g.tab=d.v;else if(a==='pfRub')g.rub=d.v;
    else if(a==='pfTrDel')g.traits.splice(+d.i,1);else if(a==='pfTrAdd'){const v=(g.tnew||'').trim();if(v&&!g.traits.some(x=>nrm(x)===nrm(v)))g.traits.push(v);g.tnew='';}
    else if(a==='pfSpEd')g.spEd={comp:d.k,list:clone(g.specs[d.k]||[])};else if(a==='pfSpAdd')g.spEd.list.push(['','']);else if(a==='pfSpDel')g.spEd.list.splice(+d.i,1);
    else if(a==='pfSpCancel')g.spEd=null;else if(a==='pfSpOk'){g.specs[g.spEd.comp]=g.spEd.list.filter(x=>(x[0]||'').trim()).map(x=>{const r=[x[0].trim(),(x[1]||'').trim()];if(x[2])r.push(1);return r;});g.spEd=null;}
    else if(a==='pfSave'){const m=(g.m||'').trim();if(!m){g.err='Enregistrement impossible : le nom masculin est obligatoire.';g.errF=['m'];refuse();return;}
      prSaveDoc(dd=>{const sp={};for(const k of PROFCOMPS[g.p])if(JSON.stringify(g.specs[k]||[])!==JSON.stringify(CATSPEC0[k]||[]))sp[k]=clone(g.specs[k]);
        dd.byId[g.p]={m,f:(g.f||'').trim()||m,traits:g.traits.slice(),specs:sp,titre:{nom:(g.tnom||'').trim()||titreDef(g.p),desc:(g.tdesc||'').trim(),fx:clone(g.fx||[])}};});S.dlg=null;toast('Profil enregistré');}
    else if(a==='ppElOpen')S.dlg=ppElDraft(d.id,null,null,g);else if(a==='ppElNew')S.dlg=ppElDraft(null,g.p,g.rub,g);
    return;}
  if(g.kind==='ppEl'){
    if(a==='ppElBack'){S.dlg=g.back||null;}else if(a==='ppElSeg')g.ck=d.v;else if(a==='ppElTg')g[d.f]=!g[d.f];
    else if(a==='ppPreNew')g.preEd={t:'comp',n:COMPS_ALL[0],v:'3'};else if(a==='ppPreT'){g.preEd.t=d.v;g.preEd.n=d.v==='comp'?COMPS_ALL[0]:d.v==='prof'?PROFILS[0]:'';}
    else if(a==='ppPreCancel')g.preEd=null;else if(a==='ppPreDel')g.pre.splice(+d.i,1);
    else if(a==='ppPreOk'){const p=g.preEd,x=p.t==='spec'?{t:'spec',n:(p.n||'').trim()}:p.t==='fort'?{t:'fort',v:+p.v||0}:{t:p.t,n:p.n,v:+p.v||0};if(p.t==='spec'&&!x.n)return;g.pre.push(x);g.preEd=null;}
    else if(a==='ppElDel')g.del=!g.del;else if(a==='ppElDelOk'){if(g.id)prSaveDoc(dd=>{delete dd.el[g.id];});S.dlg=g.back||null;}
    else if(a==='ppElSave'){if(ppElSave(g)){S.dlg=g.back||null;if(S.dlg&&S.dlg.kind==='pfEd')S.dlg.rub=g.rub;toast('Élément enregistré');}}
    return;}
  return false;}
function pfRO(a,d,g){if(g.kind==='pfEd'){if(a==='pfTab')g.tab=d.v;else if(a==='pfRub')g.rub=d.v;else if(a==='ppElOpen')S.dlg=ppElDraft(d.id,null,null,g);}else if(g.kind==='ppEl'&&a==='ppElBack')S.dlg=g.back||null;}
function pfInput(t,ev){const g=S.dlg;if(!g)return false;const D=t.dataset;
  if(D.pfe!==undefined&&g.kind==='pfEd'){g[D.pfe]=t.value;g.err='';return true;}
  if(D.pfs!==undefined&&g.kind==='pfEd'&&g.spEd){const r=g.spEd.list[+D.pfs];if(r){if(D.c==='2')r[2]=t.checked?1:0;else r[+D.c]=t.value;}return true;}
  if(D.ppe!==undefined&&g.kind==='ppEl'){g[D.ppe]=t.value;g.err='';if(D.ppe==='rub'&&ev==='change'){S._force=true;render();}return true;}
  if(D.ppp!==undefined&&g.kind==='ppEl'&&g.preEd){g.preEd[D.ppp]=t.value;return true;}
  if(D.trf!==undefined&&g.kind==='traits'){g[D.trf]=t.value;if(ev==='change'&&/P$/.test(D.trf)){g[D.trf.slice(0,-1)]='';S._force=true;render();}return true;}
  if(D.ppcart!==undefined&&(g.kind==='ppBuy'||g.kind==='cwPP')){const it=(g.cart||[])[+D.ppcart];if(it)it.prec=t.value;return true;}
  if(D.ppb!==undefined&&g.kind==='ppBuy'){g[D.ppb]=t.value;
    if(D.ppb==='q'&&ev==='input'){S._force=true;render();const el=document.querySelector('[data-ppb="q"]');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}}
    else if((D.ppb==='olab'||D.ppb==='ocost')){const b=q0('#sheetRoot [data-act="ppBuyOk"]');if(b)b.disabled=!((+String(g.ocost||'').replace(',','.')||0)>0&&(g.olab||'').trim());}
    return true;}
  return false;}
/* ---------- Paramètres › Relations : jauges (taille et difficulté par rang du PNJ et par objectif) ---------- */
function viewRelParams(){const d=S.relpD||(S.relpD=clone(S.relp||{})),R=pnjRangs(),O=['contact','allie'],E=canEdit(),L={contact:'Contact',allie:'Allié'};
  const cell=(t,r,o)=>{const v=((d[t]||{})[r]||{})[o];return `<td><input type="number" min="0" inputmode="numeric" data-rpk="${t}|${esc(r)}|${o}" value="${v==null?'':esc(v)}" aria-label="${t==='taille'?'Jauge':'Difficulté'} ${L[o]} ${esc(r)}"${E?'':' disabled'}></td>`;};
  return `<div class="tscroll"><table class="rpt"><thead><tr><th rowspan="2">Rang</th>${O.map(o=>`<th colspan="2" class="gh">${L[o]}</th>`).join('')}</tr><tr>${O.map(()=>'<th class="gs">jauge</th><th>difficulté</th>').join('')}</tr></thead><tbody>${R.map(r=>`<tr><th>${esc(r)}</th>${O.map(o=>cell('taille',r,o).replace('<td>','<td class="gs">')+cell('diff',r,o)).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="muted small" style="margin-top:6px">Jauge = nombre de cases. Contact : neutre vers contact · Allié : contact vers allié. Case vide : la valeur se saisit à l'ouverture de la jauge.</div>
    <div class="pr3"><label class="l" for="rp-bo"><b>Bonus « même organisation »</b><small>diminue la difficulté</small></label><span class="v"><input id="rp-bo" type="number" min="0" data-rpk="bonusOrg" value="${d.bonusOrg==null?1:esc(d.bonusOrg)}"${E?'':' disabled'}><span class="u">point</span></span></div>
`;}
function relpInput(t){const k=t.dataset.rpk;if(k===undefined)return false;const d=S.relpD||(S.relpD=clone(S.relp||{}));const v=t.value===''?null:+t.value;
  if(k==='bonusOrg')d.bonusOrg=v;else{const [a,r,o]=k.split('|');d[a]={...(d[a]||{})};d[a][r]={...(d[a][r]||{})};if(v==null)delete d[a][r][o];else d[a][r][o]=v;}
  S.relpDirty=true;pDirtyOn();return true;}
function relpAct(a){if(a!=='relpSave')return false;if(!canEdit())return true;S.relp=clone(S.relpD||{});S.relpDirty=false;persist('meta/relations',S.relp);render();toast('Enregistré');return true;}
