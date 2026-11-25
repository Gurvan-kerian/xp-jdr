/* La belle appli — vues : XP, personnages, joueurs, règles */
/* --- vues --- */
const kankaBtn=(lien,nom,lab)=>`<a class="kk" href="${esc(kankaHref(lien,nom))}" target="_blank" rel="noopener" aria-label="${esc(lab)}${lien?'':' (recherche sur le nom)'}" title="${lien?'Ouvrir la fiche Kanka':'Rechercher sur Kanka'}">${ICON.kanka}</a>`;
function teamCard(c){
  const s=summary(c,S.events),p=rangInfo(c),off=!actif(c);
  let stage='';
  if(p&&!off){stage=p.done?`<span class="pill good">Légendaire atteint</span>`:`<span class="pill acc">${p.next} : ${p.blocked?'hors de portée':p.ready?'pouvoir à acquérir':p.total+' XP'}</span>`;}
  const plan=off?`<span class="pill">${STATUTS[c.statut]||''}</span>`:s.prevu?`${s.manque?`<span class="pill bad">Il manque ${s.manque}</span>`:''}<span class="pill plan">Prévu ${s.prevu}</span>`:`<span class="pill">Rien de prévu</span>`;
  const img=portrait(c);
  return `<button class="card team${off?' off':''}" data-act="sel" data-id="${c.id}"><span class="thead"><span class="tph">${img?`<img src="${img}" alt="">`:`<span class="ini">${esc((c.court||'?').slice(0,1))}</span>`}</span><span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="nm">${esc(c.court)}</span><span class="small" style="color:var(--accent);font-weight:600">${[c.race,rangOf(c)].filter(Boolean).map(esc).join(' · ')}</span><span class="muted small">${whoLine(c)}${c.cache?' · masqué aux autres':''}</span></span></span>
    <span class="big num">${s.dispo}</span><span class="muted small">XP disponibles · ${s.gains} gagnés, ${s.spent} dépensés</span>
    <span style="display:flex;gap:6px;flex-wrap:wrap">${plan}${stage}</span></button>`;
}
function heritageCard(){
  const auto=scenarioCount(S.events),n=starCount(S.events,S.heritage.delta),adj=n-auto;
  let st='';for(let i=1;i<=STARS;i++)st+=`<button class="star${i<=n?' on':''}" data-act="star" data-n="${i}" aria-pressed="${i<=n}" aria-label="Étoile ${i} sur ${STARS}">${i<=n?'★':'☆'}</button>`;
  return `<div class="card"><div class="prof-head"><b style="font-family:var(--font-display);font-size:18px">Rang d'héritage</b><span class="pill plan">${n} / ${STARS} étoiles</span></div><div class="frow" style="margin-bottom:6px"><div class="field"><label for="hs">Score</label><input id="hs" type="number" inputmode="numeric" data-her="score" value="${esc(S.heritage.score)}"></div></div><div class="stars">${st}</div><div class="muted small" style="margin-top:6px">Une étoile se remplit à chaque gain de type Scénario (${auto} joués). Touche une étoile pour corriger à la main${adj?' · ajusté de '+(adj>0?'+':'')+adj:''}.${adj?' <button class="btn ghost" style="padding:2px 8px" data-act="starReset">Annuler l\'ajustement</button>':''}</div></div>`;
}
function viewTeam(){
  const hc=heritageCard();
  if(!ids().length&&!fiCanNew())return hc+emptyState();
  /* lot 4 : sélecteur PJ | PNJ ; PNJ en liste (fiches.js, pnListView) */
  const P=pjIds(),N=ids().filter(i=>S.chars[i].type==='PNJ'),sel=S.teamSel==='pnj'?'pnj':'pj';
  let h=`<h2 style="margin-top:4px">Personnages</h2><div class="seg teamseg" role="group" aria-label="PJ ou PNJ">${[['pj','PJ · '+P.length],['pnj','PNJ · '+N.length]].map(([v,l])=>`<button type="button" data-act="pnTeam" data-v="${v}" aria-pressed="${sel===v}">${l}</button>`).join('')}</div>`;
  if(sel==='pnj')return h+pnListView();
  const act=P.filter(i=>actif(S.chars[i])),arc=P.filter(i=>!actif(S.chars[i]));
  h+=hc+`<div class="grid">${act.map(i=>teamCard(S.chars[i])).join('')}</div>`;
  if(arc.length)h+=`<h2>Archives</h2><div class="grid">${arc.map(i=>teamCard(S.chars[i])).join('')}</div>`;
  return h;
}
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
function canBuyKey(c,key,dispo){const r=ref(c,key);if(!r)return false;const cu=r.o.cur||0;if(r.max!=null&&cu>=r.max)return false;return lvlCost(r.kind,cu+1)<=dispo;}
const GSHORT={'Féerie':'Féerie','Une caractéristique':'Caract.','Une compétence':'Comp.','Atouts féeriques':'Atouts'};
function goalBlock(c,s){const p=rangInfo(c);if(!p)return '';const open=!!(S.goalOpen&&S.goalOpen[c.id]);
  if(p.done)return `<div class="goal done"><b>Rang Légendaire</b> · atteint</div>`;
  const sum=p.gauges.map(g=>{const ok=g.cost===0&&g.cur>=g.target;return `${GSHORT[g.label]||g.label} ${ok?'✓':g.cur+'/'+g.target}`;}).join(' · ');
  const etat=p.blocked?'maximum trop bas':p.ready?'Acquérir le pouvoir '+p.next.toLowerCase():p.total+' XP restants';
  let h=`<button class="goal${p.ready?' ready':''}" data-act="goalToggle" data-id="${esc(c.id)}" aria-expanded="${open}"><span><b>Rang ${esc(p.next)}</b> · ${etat}</span><span class="gg">${esc(sum)} ${open?'▴':'▾'}</span></button>`;
  if(!open)return h;
  h+=`<div class="card goald"><div class="muted small" style="margin-bottom:6px">${p.ready?`Les quatre critères sont réunis : il reste à acquérir le pouvoir ${p.next.toLowerCase()} (Capacités féeriques › Féerie). Le MJ le dévoile.`:'Il faut réunir les quatre critères.'}</div>`+p.gauges.map(g=>{const done=g.cost===0&&g.cur>=g.target;
    return `<div class="gauge${done?' done':''}"><span>${esc(g.label)}${g.via?`<br><span class="muted small">le moins cher : ${esc(g.via)}</span>`:''}</span>${bar(g.cur,g.target)}<span class="lv">${g.cur}<small>/${g.target}</small> <span class="pill ${done?'good':g.blocked?'bad':''}">${done?'OK':g.blocked?'max trop bas':g.cost+' XP'}</span></span></div>`;}).join('');
  if(!p.ready){h+=`<div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)"><b>Total restant</b><b class="num">${p.blocked?'—':p.total+' XP'}</b></div>`;
    if(!p.blocked)h+=`<div class="muted small">${p.total<=s.dispo?'Finançable avec les XP disponibles.':'Il manque '+(p.total-s.dispo)+' XP par rapport au solde disponible.'}</div>`;}
  return h+`</div>`;}
function viewSheet(){
  if(!ids().length)return emptyState();
  const id=S.sel&&S.chars[S.sel]&&vis(S.chars[S.sel])?S.sel:ids()[0];S.sel=id;const c=S.chars[id],s=summary(c,S.events);
  if(c.type==='PNJ')return pnSheetHead(c,s)+pnSheetBody(c,s,id); /* lot 4 : fiche PNJ (fiches.js) */
  const chips=pjIds().map(i=>{const c=S.chars[i],img=portrait(c);return `<button class="pchip" data-act="sel" data-id="${i}" aria-pressed="${i===id}" aria-label="${esc(c.court)}"><span class="ph">${img?`<img src="${img}" alt="">`:`<span class="ini">${esc((c.court||'?').slice(0,1))}</span>`}</span><span class="pn">${esc(c.court)}</span></button>`;}).join('');
  let h=`<button class="back" data-act="tab" data-v="team"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Tous les personnages</button><div class="pchips">${chips}</div>`;
  /* Lot 2 bis : médaillon du portrait dans l'en-tête (✎ pour le joueur du personnage et la gestion) */
  {const im=portrait(c),inner=im?`<img src="${im}" alt="">`:`<span class="ini">${esc((c.court||'?').slice(0,1))}</span>`;
   h+=`<div class="shhd">${canPortrait(c)?`<label class="shmed ed" aria-label="Changer le portrait de ${esc(c.court)}">${inner}<span class="pen" aria-hidden="true">✎</span><input type="file" accept="image/*" data-ptrfile="${esc(c.id)}" hidden></label>`:`<span class="shmed">${inner}</span>`}`;}
  h+=`<div style="margin-bottom:10px;flex:1;min-width:0"><div class="shname"><span>${esc(c.nom)}</span>${kankaBtn(c.kanka,c.nom||c.court,'Fiche Kanka de '+(c.court||c.nom))}</div><div class="shrace">${c.race?`<span class="rc">${raceLk(c)}</span> · `:''}<span class="rg">${esc(rangOf(c))}</span>${natfOf(c)?` · <span class="rg">${esc(NATF[natfOf(c)])}</span>`:''}</div><div class="muted small">${whoLineL(c)}${actif(c)?'':' · '+(STATUTS[c.statut]||'')}${c.cache?' · masqué aux autres':''}</div>${fealLine(c)}</div></div>`;
  /* Bandeau XP qui reste visible */
  h+=`<div class="xpbar"><div class="xpd"><b class="num">${s.dispo}</b><span>XP dispo</span></div><div class="xpo"><span><b class="num">${s.prevu}</b> prévu</span><span class="${s.manque?'bad':''}"><b class="num">${s.manque}</b> manque</span></div><div class="xpm">${s.gains} gagnés · ${s.spent} dépensés</div></div>`;
  const tab=shTabOf(c);
  h+=shTabsBar(c,tab);
  if(tab!=='prog')return h+viewSheetTab(c,tab);
  return h+viewProg(c,s,id);}
/* Onglet Progrès (PJ) et Progression (féal, lot 4) */
function viewProg(c,s,id){let h='';
  if(c.type==='PNJ'){
    const f=S.pnjForm;
    h+=`<h2>Ajouter des XP</h2><div class="card"><div class="frow"><div class="field"><label for="px">Intitulé</label><input id="px" type="text" data-pnj="titre" placeholder="ex. S12. Titre du scénario" value="${esc(f.titre)}"></div><div class="field"><label for="pm">XP</label><input id="pm" type="number" inputmode="numeric" min="0" data-pnj="montant" value="${esc(f.montant)}"></div></div><button class="btn pri" data-act="pnjXp"${f.titre.trim()&&+f.montant>0?'':' disabled'}>Ajouter à ${esc(c.court)}</button></div>`;
  }
  if(c.type==='PJ')h+=goalBlock(c,s);
  const OB=!!S.onlyBuy,ir=key=>OB&&!canBuyKey(c,key,s.dispo)?'':itemRow(c,key,s.dispo),none='<div class="muted small" style="padding:6px 2px">Rien d\'achetable ici pour l\'instant.</div>';
  const card=(t,inner)=>`<h2>${t}</h2><div class="card">${inner||none}</div>`;
  h+=`<div class="flt"><span>Achetable maintenant</span><button class="tgb" data-act="onlyBuy" role="switch" aria-checked="${OB}" aria-label="Afficher seulement ce qui est achetable maintenant"><span class="tg${OB?' on':''}"></span></button></div>`;
  if(c.type==='PJ'){
    const fe=ir('feerie');
    h+=card('Capacités féeriques',fe+(fe?pwSection(c):'')+ir('masque')+(OB?'':staticRow('Tricherie',tricherie(c),'calculée'))+ir('atout'));
    const fo=ir('fortune');
    h+=card('Ressources générales',fo?fo+(()=>{const src=fxIntSrc(c,'fortune').concat(ppFortSrc(c));return src.length?`<div class="muted small fxnote">Fortune : dont ${src.map(esc).join(', ')}</div>`:'';})():'');
  }
  h+=card('Caractéristiques',CARACS.map(n=>{const r=ir('carac:'+n);return r?r+(()=>{const src=fxIntSrc(c,'car:'+n);return src.length?`<div class="muted small fxnote">${esc(n)} : dont ${src.map(esc).join(', ')}</div>`:'';})():'';}).join(''));
  if(!OB&&c.type==='PNJ')h+=traitsCard(c); /* lot 4 : traits des PJ sur l'onglet Fiche seulement */
  h+=`<h2>${c.type==='PNJ'?'Profils':'Compétences'}</h2>`;
  if(c.type==='PJ'){const sp=ir('spec');if(sp)h+=`<div class="card" style="margin-bottom:10px">${sp}${specBlock(c)}</div>`;}
  let anyP=false;
  for(const pr of c.profils||[]){
    const rk=rankOf(c,pr),nr=nextRank(c,pr);
    let body='';
    if(c.type==='PJ'){body=(pr.comps||[]).map(x=>ir('comp:'+x.nom)).join('');if(OB&&!body)continue;
      body+=nr?`<div class="muted small" style="padding-top:6px">Rang ${rk+1} : <b class="num">${nr.cost} XP</b> (${esc(nr.steps.join(', '))})</div>`:`<div class="muted small" style="padding-top:6px">Rang suivant hors de portée (maxima atteints).</div>`;}
    else{body=ir('prof:'+pr.nom);if(OB&&!body)continue;if(pr.subs&&pr.subs.length)body+=`<div class="tags">${pr.subs.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`;}
    anyP=true;
    if(c.type==='PJ'&&rk>=4)body=titreLine(c,pr)+body;
    h+=`<div class="card" style="margin-bottom:10px"><div class="prof-head"><b>${esc(profLab(pr.nom,c))}</b><span style="display:flex;gap:8px;align-items:center"><span class="pill acc">rang ${rk}</span>`+
      (c.type==='PJ'?`<button class="ppf${ppHave(pr)>0?' on':''}" data-act="ppOpen" data-prof="${esc(pr.nom)}" aria-label="Points de personnage ${esc(profLab(pr.nom,c))} : ${pr.note??0}"><small>PP</small>${esc(ppFmt(pr.note??0))}</button>`:'')+`</span></div>${body}</div>`;
  }
  if(OB&&!anyP)h+=`<div class="card">${none}</div>`;
  if(c.type==='PNJ'){const sp=ir('spec');if(sp)h+=`<div class="card" style="margin-top:10px">${sp}${specBlock(c)}</div>`;}
  if(c.type==='PJ'){
    const fu=(c.futiles||[]).map(f=>ir('fut:'+f.nom)).join('');
    h+=`<h2>Compétences futiles</h2><div class="card">`+(fu||(OB?none:'<div class="muted">Aucune.</div>'));
    if(!OB){if(S.futForm.open)h+=`<div class="frow" style="margin-top:10px"><div class="field"><label for="fn">Nom</label><input id="fn" type="text" data-fut="nom" value="${esc(S.futForm.nom)}"></div><div class="field"><label for="fm">Niveau max</label><input id="fm" type="number" min="1" max="12" data-fut="max" value="${esc(S.futForm.max)}"></div></div><div class="actions"><button class="btn pri" data-act="futSave">Ajouter</button><button class="btn" data-act="futCancel">Annuler</button></div>`;
    else h+=`<div style="margin-top:10px"><button class="btn" data-act="futOpen">+ Ajouter une compétence futile</button></div>`;}
    h+=`</div>`;
    const pnjs=pnjOf(c);
    h+=`<h2>Autres dépenses</h2><div class="card">`+AUTRES.filter(n=>n!=='PNJ'||pnjs.length).map(n=>`<div class="irow" style="grid-template-columns:minmax(0,1fr) 60px"><button class="rmain" data-act="openAutre" data-nom="${n}" style="grid-template-columns:minmax(0,1fr) auto"><span class="nm">${autreLab(n)}${n==='PNJ'?`<span class="nsub">vers ${pnjs.map(x=>esc(x.court)).join(', ')}</span>`:n==='Domaine'?'<span class="nsub">transfert</span>':''}</span><span class="lv">${autreTotal(c,n)}<small> XP</small></span></button><button class="plus${s.dispo>0?' ok':''}" data-act="autrePlus" data-nom="${n}"${s.dispo>0?'':' disabled'} aria-label="Dépenser des XP en ${autreLab(n)}">+</button></div>`).join('')+`</div>`;
  }
  const ach=[...(c.achats||[])].reverse();
  h+=`<h2>Historique des achats</h2><div class="card"><div class="muted small" style="margin-bottom:6px">${ach.length} achats · ${s.spent} XP dépensés · touche un achat pour le modifier ou l'annuler</div>`;
  const shown=S.hist[id]?ach:ach.slice(0,3);
  h+=shown.map(a=>`<button class="row" style="grid-template-columns:minmax(0,1fr) auto" data-act="achatEdit" data-id="${a.id}"><span><span class="t" style="font-weight:600">${a.ppNP?esc(a.label.replace(/non précisé$/,'')).concat('<i style="font-weight:400">non précisé</i>'):esc(a.label)}</span><br><span class="muted small">${a.date?fmtDate(a.date):'importé du tableur'}${a.motif?' · '+esc(a.motif):''}</span></span><span class="nx">${a.cout} XP</span></button>`).join('')||'<div class="muted">Aucun achat.</div>';
  if(ach.length>3)h+=`<div style="margin-top:8px"><button class="btn ghost" data-act="histToggle">${S.hist[id]?'Réduire':'Tout afficher ('+ach.length+')'}</button></div>`;
  h+=`</div>`;
  return h;
}
/* Onglet « Fiche complète » : consultation, sans achat */
function viewSheetFull(c){const fm=S.forme||'d',fxl=fxOf(c),x=raceRecOf(c),fee=c.type==='PJ'&&!isHum(c);let h='';
  const val=n=>`<b class="num">${n}</b>`,row=(a,b)=>`<div class="fr"><span>${a}</span>${val(b)}</div>`;
  const fxLines=(k,nom)=>fxl.filter(e=>e.kind===k&&nrmA(e.src)===nrmA(nom)).map(e=>`<div class="fxs${fxOn(e,fm)?'':' off'}">Effet : ${esc(fxLabel(e))}${fxQ(e.quand)==='d'?' · démasqué seulement':''}${e.t!=='rap'&&e.txt?' · '+esc(e.txt):''}</div>`).join('');
  const item=(nom,desc,fx)=>`<div class="fi"><b>${esc(nom)}</b>${desc?`<div class="s">${esc(desc)}</div>`:''}${fx||''}</div>`;
  const spl=key=>{const L=specsOf(c).filter(y=>y.cible===key);return L.length?`<div class="fsp">${L.map(y=>{const i=specInfo(y.nom);return esc(y.nom)+(i&&i[2]?'*':'');}).join(', ')}</div>`:'';};
  if(!isHum(c))h+=`<div class="formesw"><span class="muted small">Forme</span><div class="seg sm" role="group" aria-label="Forme du personnage">${[['m','Masquée'],['d','Démasquée']].map(([v,l])=>`<button data-act="forme" data-v="${v}" aria-pressed="${fm===v}">${l}</button>`).join('')}</div></div>`;
  h+=`<h2>Caractéristiques dérivées</h2><div class="dg">`+derived(c,fm).map(([n,v,b,src])=>{const tip=derFormula(c,fm,n);
    const ab=(src||[]).map(y=>{const m=y.match(/^([+−-]?\d+)\s+(.*)$/);return m?m[1]+' '+m[2].slice(0,4)+'.':y;}).join(' ');
    return `<button class="dt" data-act="derTip" data-n="${esc(n)}" title="${esc(tip)}" aria-label="${esc(tip)} : ${v}">${derIco(n)}<b class="num">${v}</b>${ab?`<small>${esc(ab)}</small>`:''}${S.derTip===n?`<span class="dtip" role="tooltip">${esc(tip)}</span>`:''}</button>`;}).join('')+`</div>`;
  if(fee){const own=c.pw||[],pal=own.some(o=>o.i===7)?'Légendaire':own.some(o=>o.i===6)?'Profond':'';
    let b=(pal?`<div class="muted small" style="padding-bottom:4px">Palier ${pal}</div>`:'')+row('Féerie',lv(c,'feerie'))+row('Masque',lv(c,'masque'))+row('Tricherie',tricherie(c));
    if(x&&own.length){b+=`<div class="muted small" style="margin-top:8px">Pouvoirs</div>`+[...own].sort((a,z)=>a.i-z.i).map(o=>{const p=pwCat(o.id),v=varOf(p,o.v||raceVarAt(x,o.i)),meta=[pwNat(o.id)?NAT_L[pwNat(o.id)].toLowerCase():'',p.type?TYPE_L[p.type]||p.type:''].filter(Boolean).join(' · ');
      const fl=(L,t)=>(L||[]).map(e=>`<div class="fxs${fxOn(e,fm)?'':' off'}">Effet : ${esc(fxLabel(e))}${fxQ(e.quand)==='d'?' · démasqué seulement':''}${v?` <span class="muted">· ${t}</span>`:''}</div>`).join('');
      return `<div class="fi fil">${illThumb('pw',o.id,48)}<div><b>${pwLk(x,o.i,o.id)}</b>${meta?` <span class="muted small">${esc(meta)}</span>`:''}${p.desc?`<div class="s">${esc(p.desc)}</div>`:''}${fl(p.fx,'commun')}${v?fl(v.fx,'sous-type'):''}</div></div>`;}).join('');}
    h+=`<h2>Capacités féeriques</h2><div class="card">${b}</div>`;}
  if(x&&c.type==='PJ'){
    const av=(x.av||[]).filter(e=>e&&e[0]),dv=(x.dv||[]).filter(e=>e&&e[0]);
    if(av.length||dv.length)h+=`<h2>Avantages et désavantages</h2><div class="card">${av.length?`<div class="fsub">Avantages</div>`+av.map(e=>item(e[0],e[1],fxLines('av',e[0]))).join(''):''}${dv.length?`<div class="fsub">Désavantages</div>`+dv.map(e=>item(e[0],e[1],fxLines('dv',e[0]))).join(''):''}</div>`;
    const cap=(x.cap||[]).filter(e=>e&&e[0]).map(e=>{const cid=capIdByName(S.capacites||{},e[0]),th=cid?illThumb('cap',cid,48):'',nm=capLk(e);return th?`<div class="fi fil">${th}<div><b>${nm}</b>${e[1]?`<div class="s">${esc(e[1])}</div>`:''}${fxLines('cap',e[0])}</div></div>`:`<div class="fi"><b>${nm}</b>${e[1]?`<div class="s">${esc(e[1])}</div>`:''}${fxLines('cap',e[0])}</div>`;}).join('')+(c.accru?`<div class="fi"><b>${esc(c.accru)} ${accW(c.accru)}</b><div class="fxs${fm==='d'?'':' off'}">Effet : ${esc(c.accru)} +1 · démasqué seulement</div></div>`:'');
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
function slp(l,cs){if(l.nature==='Scénario')return presents(cs);if(l.nature==='Groupe')return allPJ();const pr=presents(cs);return (l.persos||[]).filter(p=>pr.includes(p));}
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
const sessLabel=e=>e?esc(e.titre)+(e.date?' · '+fmtDate(e.date):e.textuelle?' · Session textuelle':''):'';
const sessChildren=id=>S.events.filter(e=>e.sessionId===id);
function sessOptions(sel,req){return (req&&sessList().length?'':`<option value="">Aucune session</option>`)+sessList().map(e=>`<option value="${e.id}"${e.id===sel?' selected':''}>${sessLabel(e)}</option>`).join('');}
function pnjAttached(){return Object.values(S.chars).filter(c=>c.type==='PNJ'&&c.pj&&S.chars[c.pj]&&vis(c)).sort((a,b)=>(a.court||'').localeCompare(b.court||''));}
function viewGains(){
  if(!ids().length)return emptyState();
  if(S.form.editId)return viewLegacyForm()+gainsTableAndJournal();
  const cs=curSession(),L=sessList();
  let h=`<h2 style="margin-top:4px">Session de jeu</h2><div class="card" style="display:flex;flex-direction:column;gap:10px">`;
  if(cs){h+=`<div class="field"><label for="cur-s">Session</label><select id="cur-s" data-cursess="1">${L.map(e=>`<option value="${e.id}"${e.id===cs.id?' selected':''}>${sessLabel(e)} · ${esc(evType(e))}</option>`).join('')}</select></div>`;}
  else h+=`<div class="muted">Aucune session pour l'instant. Crée la première pour y ajouter de l'XP.</div>`;
  h+=`<div class="actions">${cs?`<button class="btn" data-act="sessEdit">Modifier la session</button>`:''}<button class="btn pri" data-act="sessNew">+ Nouvelle session</button></div></div>`;
  if(cs){
    const f=S.form,formChars=pjIds().filter(i=>actif(S.chars[i]));
    h+=`<h2>Ajouter de l'XP à la session</h2><div class="card">`;
    const pr=orderPJ(presents(cs)),nmL=a=>a.filter(i=>vis(S.chars[i])).map(i=>esc(S.chars[i].court)).join(', ');
    f.lines.forEach((ln,i)=>{
      h+=`<div style="${i?'border-top:1px solid var(--line);padding-top:10px;margin-top:10px':''}"><div class="frow"><div class="field"><label for="gn${i}">Nature</label><select id="gn${i}" data-l="${i}" data-k="nature">${NATURES.map(n=>`<option${n===ln.nature?' selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label for="gm${i}">XP par personnage</label><input id="gm${i}" type="number" inputmode="numeric" min="0" data-l="${i}" data-k="montant" value="${esc(ln.montant)}"></div></div>`;
      if(ln.nature==='Scénario')h+=`<div class="muted small" style="margin:6px 0 4px">${pr.length?`Attribuée aux PJ présents : ${nmL(pr)}.`:'Aucun PJ présent : coche-les dans « Modifier la session ».'}</div>`;
      else if(ln.nature==='Groupe')h+=`<div class="muted small" style="margin:6px 0 4px">Attribuée à tous les PJ actifs (${allPJ().length}).</div>`;
      else{const sel=slp(ln,cs);h+=`<div class="chips" style="flex-wrap:wrap;overflow:visible;margin-top:6px">${pr.filter(id=>vis(S.chars[id])).map(id=>`<button class="chip" data-act="slChar" data-l="${i}" data-id="${id}" aria-pressed="${sel.includes(id)}">${esc(S.chars[id].court)}</button>`).join('')}</div><div class="muted small" style="margin-top:4px">${pr.length?'Seuls les PJ présents sont proposés.':'Aucun PJ présent : coche-les dans « Modifier la session ».'}</div>`;}
      h+=f.lines.length>1?`<div class="actions" style="margin-bottom:4px"><button class="btn ghost" data-act="lineDel" data-l="${i}">Retirer la ligne</button></div>`:'';
      h+=`</div>`;
    });
    const valid=f.lines.some(l=>+l.montant>0&&slp(l,cs).length);
    h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="lineAdd">+ Autre nature</button><button class="btn pri" data-act="sessAdd"${valid?'':' disabled'}>Ajouter à la session</button></div>`;
    const P=pnjAttached();
    if(P.length){
      h+=`<div class="pnjbox"><h3>PNJ · part calculée sur la session</h3>`+P.map(c=>{const sh=pnjShares(c,S.events).find(x=>x.sess===cs.id),pj=S.chars[c.pj];
        if(!sh)return `<div class="prow"><span class="pn"><b>${esc(c.court)}</b> <span class="muted">· ${esc(pj.court)} · rattaché après cette session</span></span></div>`;
        return `<div class="prow"><span class="pn"><b>${esc(c.court)}</b> <span class="muted">· ${esc(pj.court)} · ${sh.pct} % de ${sh.base}</span></span><span class="pv num">+${sh.montant}</span><button class="tgl" role="switch" aria-checked="${sh.on}" aria-label="${esc(c.court)} a participé activement" data-act="pnjToggle" data-id="${c.id}"><i></i></button></div>`;}).join('')+
        `<div class="muted small" style="margin-top:6px">Interrupteur : a participé activement (50 %), sinon 25 %. Arrondi à l'inférieur, mis à jour automatiquement si un gain est rattaché plus tard.</div></div>`;
    }
    h+=`</div>`;
  }
  return h+gainsTableAndJournal();
}
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
      if(!open)return `<div class="sess"><div class="shead stog" data-act="sessToggle" data-id="${e.id}" role="button" tabindex="0" aria-expanded="false"><span class="chev" aria-hidden="true">›</span><div style="min-width:0"><div class="t" style="font-size:17px">${esc(e.titre)}</div><div class="muted small">${[e.date?fmtDate(e.date):e.textuelle?'Session textuelle':'',esc(evType(e))].filter(Boolean).join(' · ')}</div>${(()=>{const pr=orderPJ(presents(e)).filter(i=>vis(S.chars[i]));return pr.length?`<div class="muted small" style="margin-top:2px">👥 ${pr.map(i=>esc(S.chars[i].court)).join(', ')}</div>`:'';})()}${chSessLine(e)}</div></div></div>`;
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
      body+=kids.map(k=>{const ents=k.entries.filter(en=>pv(en.perso));if(!ents.length)return '';const g=grpTags(ents);return `<div class="sline"><div style="min-width:0"><div>${jTitle(k)}</div><div class="tags">${Object.keys(g).map(x=>`<span class="pill acc">${esc(x)}</span><span class="muted small">${g[x].length===allPJ().length?'tous les PJ actifs':esc(g[x].join(', '))}</span>`).join(' ')}</div></div><span class="locked" style="max-width:110px;text-align:right">Se corrige depuis Univers › ${k.creature?'Races':'Secrets'}</span></div>`;}).join('');
      {const pn=[];let calc=false,rep=false;
        for(const en of e.entries){const ch=S.chars[en.perso];if(!ch||ch.type!=='PNJ'||!vis(ch)||!en.montant)continue;const x=pn.find(y=>y.id===en.perso&&y.n===en.nature);if(x)x.m+=en.montant;else pn.push({id:en.perso,n:en.nature,m:en.montant});rep=true;}
        for(const c of Object.values(S.chars)){if(c.type!=='PNJ'||!vis(c))continue;const sh=pnjShares(c,S.events).find(x=>x.sess===e.id);if(sh&&sh.montant){pn.push({id:c.id,n:sh.nature,m:sh.montant});calc=true;}}
        if(pn.length)body+=`<div class="nb"><div class="nbh"><b>PNJ</b><span class="locked" style="text-align:right">${calc&&rep?'Calculée ou reprise':calc?'Calculée automatiquement':'Reprise de l\'ancien journal'}</span></div><div class="nbl">${pn.map(x=>{const m=(x.n||'').match(/\((\d+) %\)/);return `<div>${esc(S.chars[x.id].court)} <span class="xpn">+${x.m}</span>${m?' ('+m[1]+' %)':''}</div>`;}).join('')}</div></div>`;}
      const blocked=kids.filter(k=>!(k.secret&&k.secret.k==='bonus')).length;
      return `<div class="sess open"><div class="shead stog" data-act="sessToggle" data-id="${e.id}" role="button" tabindex="0" aria-expanded="true"><span class="chev" aria-hidden="true">›</span><div style="min-width:0"><div class="t" style="font-size:17px">${esc(e.titre)}</div><div class="muted small">${[e.date?fmtDate(e.date):e.textuelle?'Session textuelle':'',esc(evType(e))].filter(Boolean).join(' · ')}</div>${(()=>{const pr=orderPJ(presents(e)).filter(i=>vis(S.chars[i]));return pr.length?`<div class="muted small" style="margin-top:2px">👥 ${pr.map(i=>esc(S.chars[i].court)).join(', ')}</div>`:'';})()}${chSessLine(e)}</div><button class="btn ghost" style="padding:4px 10px;flex:none" data-act="sessEditId" data-id="${e.id}">Modifier</button></div>${body||'<div class="muted small" style="padding:6px 0">Aucun gain pour l\'instant.</div>'}${blocked?`<div class="muted small" style="margin-top:6px">Suppression impossible tant que ${blocked} découverte${blocked>1?'s sont rattachées':' est rattachée'} à cette session.</div>`:''}</div>`;
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
  const pl=playersSorted(),tab=S.pTab||'joueurs',G=isGest();
  const me=S.players[ME],CHG='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
  const pushOk=pushOK()&&me&&Notification.permission!=='denied';
  let h=`<h2 style="margin-top:4px">Joueurs</h2><div class="card me2"><div style="min-width:0"><div class="muted small" style="white-space:nowrap">Sur cet appareil</div><b style="font-size:17px">${S.visit?'Visiteur':me?esc(me.nom):'—'}</b></div><div class="me2r">${pushOk?`<button class="nsw" data-act="${S.pushSub?'pushOff':'pushOn'}" role="switch" aria-checked="${!!S.pushSub}" aria-label="Notifications sur cet appareil" title="Notifications sur cet appareil"><span aria-hidden="true">🔔</span><span class="tg${S.pushSub?' on':''}"></span></button>`:''}<button class="icb" data-act="meOpen" title="Changer d'identité" aria-label="Changer d'identité">${CHG}</button></div></div>`;
  if(S.pushMsg||(!pushOK()&&me))h+=`<div class="muted small" style="margin:6px 4px 0">${S.pushMsg?esc(S.pushMsg):isIOS()&&!isStandalone()?'Notifications : sur iPhone, ajoute d\'abord l\'appli à l\'écran d\'accueil.':'Notifications non disponibles sur ce navigateur.'}</div>`;
  else if(me&&pushOK()&&Notification.permission==='denied')h+=`<div class="muted small" style="margin:6px 4px 0">Notifications bloquées pour ce site : autorise-les dans les réglages du navigateur.</div>`;
  const vc=ids().map(i=>S.chars[i]);
  h+=`<div class="seg2" role="group" aria-label="Affichage"><button data-act="pTab" data-v="joueurs" aria-pressed="${tab==='joueurs'}">Joueurs (${pl.filter(p=>!p.parti).length})</button><button data-act="pTab" data-v="perso" aria-pressed="${tab==='perso'}">Personnages (${vc.length})</button></div>`;
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
    if(ME&&!S.visit)h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="newCOpen">+ Nouveau personnage</button></div>`;
  }
  return h;
}
/* Droits dans l'onglet Joueurs : chacun sa fiche et ses personnages ; le reste avec les droits de gestion */
const canEditP=p=>!!p&&!S.visit&&(isGest()||p.id===ME);
const canEditC=c=>!!c&&!S.visit&&(c.type!=='PNJ'?(isGest()||owners(c).some(p=>p.id===ME))
  :isFeal(c)?(isGest()||owners(S.chars[c.pj]).some(p=>p.id===ME)) /* lot 4 : féal = joueur de son PJ et gestion */
  :(canEdit()||(!isGest()&&!!ME&&pnRev(c)))); /* lot 4 : PNJ = règle des fiches */
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
    <div class="field"><label for="cs-${c.id}">Statut</label>${ed?`<select id="cs-${c.id}" data-cf="statut" data-id="${c.id}">${Object.entries(STATUTS).map(([k,v])=>`<option value="${k}"${(c.statut||'actif')===k?' selected':''}>${v}</option>`).join('')}</select>`:ro(STATUTS[c.statut||'actif'])}</div>
    <div class="field"><label for="cr-${c.id}">Race</label>${ed&&(c.type==='PNJ'||!c.race)?`<select id="cr-${c.id}" data-cf="race" data-id="${c.id}"><option value="">— à préciser —</option>${(c.type==='PNJ'?pnRaces():Object.keys(RACES).sort((a,b)=>a.localeCompare(b,'fr'))).map(r=>`<option${r===c.race?' selected':''}>${esc(r)}</option>`).join('')}</select>`:ro(esc(c.race?raceLabel(c):'—'))}</div>
    <div class="field"><label for="cgn-${c.id}">Genre</label>${ed?`<select id="cgn-${c.id}" data-cf="genre" data-id="${c.id}">${[['','— à préciser —'],['m','Masculin'],['f','Féminin']].map(([v,l])=>`<option value="${v}"${(c.genre||'')===v?' selected':''}>${l}</option>`).join('')}</select>`:ro(c.genre==='f'?'Féminin':c.genre==='m'?'Masculin':'—')}</div>
    ${c.type==='PNJ'?`<div class="field"><label for="crg-${c.id}">Rang</label>${ed?`<select id="crg-${c.id}" data-cf="rang" data-id="${c.id}">${[...new Set([...pnjRangs(),rangOf(c)])].map(r=>`<option${rangOf(c)===r?' selected':''}>${esc(r)}</option>`).join('')}</select>`:ro(esc(rangOf(c)))}</div>`:`<div class="field"><label>Rang</label>${ro(esc(rangOf(c)))}</div>`}
    ${canEdit()?`<div class="field" style="grid-column:1/-1"><label for="ck-${c.id}">Lien Kanka <span class="muted small">(facultatif : sans lien, le livre ouvre la recherche sur le nom)</span></label><input id="ck-${c.id}" type="url" inputmode="url" data-cf="kanka" data-id="${c.id}" value="${esc(c.kanka||'')}" placeholder="https://app.kanka.io/w/350361/entities/…" autocomplete="off"></div>`:''}
    ${c.type==='PJ'?`<div class="field" style="grid-column:1/-1"><label for="co-${c.id}">Joué par</label>${ed?`<select id="co-${c.id}" data-owner="${c.id}"><option value="">— personne —</option>${playersSorted().filter(p=>!p.parti||ow.some(o=>o.id===p.id)).map(p=>`<option value="${p.id}"${ow[0]&&ow[0].id===p.id?' selected':''}>${esc(p.nom)}</option>`).join('')}</select>`:ro(ow.map(p=>esc(p.nom)).join(', ')||'—')}</div>`:`<div class="field" style="grid-column:1/-1"><label for="cp-${c.id}">Rattaché au PJ</label>${ed?`<select id="cp-${c.id}" data-cf="pj" data-id="${c.id}"><option value="">— aucun —</option>${Object.values(S.chars).filter(x=>x.type==='PJ').sort((a,b)=>(a.court||'').localeCompare(b.court||'')).map(x=>`<option value="${x.id}"${c.pj===x.id?' selected':''}>${esc(x.court)}</option>`).join('')}</select>`:ro(c.pj&&S.chars[c.pj]?esc(S.chars[c.pj].court):'—')}</div>`}</div>`;
  if(g.own!==undefined){const np=S.players[g.own];h+=`<div class="confirm2"><div><b>Confier ${esc(c.court)} à ${np?esc(np.nom):'personne'} ?</b></div><div class="muted small">${ow.length?esc(ow.map(p=>p.nom).join(', '))+' ne le verra plus dans ses personnages.':''}${np?' '+esc(np.nom)+' pourra le modifier.':' Le personnage n\'aura plus de joueur.'}</div><div class="actions"><button class="btn ghost" data-act="ownNo">Annuler</button><button class="btn pri" data-act="ownOk">Confirmer</button></div></div>`;}
  let o='';
  if(ed&&c.type==='PJ')o+=opt('Masquer aux autres',`<button class="tgb" data-act="cHide" data-id="${c.id}" role="switch" aria-checked="${!!c.cache}" aria-label="Masquer aux autres"><span class="tg${c.cache?' on':''}"></span></button>`);
  if(ed&&c.type==='PJ')o+=opt('Exclure de la moyenne d\'XP',`<button class="tgb" data-act="cMoy" data-id="${c.id}" role="switch" aria-checked="${!!c.horsMoyenne}" aria-label="Exclure de la moyenne d'XP"><span class="tg${c.horsMoyenne?' on':''}"></span></button>`);
  if(canPortrait(c))o+=opt('Portrait',`<span style="display:flex;gap:6px"><label class="btn ghost" style="cursor:pointer">Changer<input type="file" accept="image/*" data-ptrfile="${c.id}" hidden></label>${own?`<button class="btn ghost" data-act="ptrDel" data-id="${c.id}">Retirer</button>`:''}</span>`);
  if(o)h+=`<div class="grp2">Options</div>${o}`;
  h+=`<div class="actions" style="margin-top:12px"><button class="btn pri" data-act="pcSheetGo" data-id="${c.id}">Ouvrir la fiche ›</button></div>`;
  if(G)h+=`<div class="danger2"><span>Zone sensible</span><button class="lnk-bad" data-act="cDel" data-id="${c.id}">Supprimer le personnage</button></div>`;
  return h+`</div></div>`;}
function newPSheet(){return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Nouveau joueur"><div class="in"><div class="shd"><h2>Nouveau joueur</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div><div class="frow"><div class="field"><label for="np-n">Nom</label><input id="np-n" type="text" data-np="nom" value="${esc(S.newP.nom)}"></div><div class="field"><label for="np-r">Rôle</label><select id="np-r" data-np="role">${['Joueur','MJ'].map(r=>`<option${S.newP.role===r?' selected':''}>${r}</option>`).join('')}</select></div></div><div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="addP">Ajouter</button></div></div></div>`;}
function newCSheet(){const pl=playersSorted().filter(p=>!p.parti),G=isGest();if(!G&&!S.newC.owner)S.newC.owner=ME||'';
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Nouveau personnage"><div class="in"><div class="shd"><h2>Nouveau personnage</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div><div class="frow"><div class="field"><label for="nc-c">Nom court</label><input id="nc-c" type="text" data-nc="court" value="${esc(S.newC.court)}"></div><div class="field"><label for="nc-n">Nom complet</label><input id="nc-n" type="text" data-nc="nom" value="${esc(S.newC.nom)}"></div><div class="field"><label for="nc-t">Type</label><select id="nc-t" data-nc="type"><option value="PJ"${S.newC.type==='PJ'?' selected':''}>PJ</option></select></div><div class="field"><label for="nc-o">Joueur</label>${G?`<select id="nc-o" data-nc="owner"><option value="">— aucun —</option>${pl.map(p=>`<option value="${p.id}"${S.newC.owner===p.id?' selected':''}>${esc(p.nom)}</option>`).join('')}</select>`:`<div class="ro2">${esc((S.players[ME]||{}).nom||'—')}</div>`}</div></div><div class="muted small" style="margin-bottom:8px">La fiche démarre à zéro. L'assistant de création remplacera bientôt ce formulaire.</div><div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="addC">Créer</button></div></div></div>`;}
function viewRules(){
  const rows=[['Féerie',`(niveau suivant) × ${RULES.feerie}`],['Masque',`(niveau suivant) × ${RULES.masque}`],['Tricherie','moyenne Féerie/Masque, arrondie à l\'inférieur (calculée)'],['Caractéristique',`(niveau suivant) × ${RULES.carac}, sauf 1→2 qui coûte ${RULES.carac12}`],['Compétence',`(niveau suivant) × ${RULES.comp}`],['Compétence futile',`(niveau suivant) × ${RULES.fut}`],['Fortune',`(niveau suivant) × ${RULES.fortune} ; le détail donne la situation, l\'argent de poche, l\'argent disponible par mois et le modificateur de Classe et Entregent. Dépenser plus du double du mois en moins de deux mois fait perdre un rang`],['Atout féerique',`${RULES.atout} points par atout. Chaque race propose 4 atouts, plus « Spécialités typiques » qui offre les 2 spécialités typiques de la race (ou 2 spécialités à choisir). Le compteur affiche acquis / listés (un atout ajouté à la main compte dans les listés). Pas d'atout pour les humains`],['Spécialité',`${RULES.spec} points (${RULES.mauvaiseMain} pour Mauvaise main, ${RULES.specFut} pour une compétence futile). Elle se rattache à une compétence (à un profil pour un PNJ), donne +1 et ne demande aucun rang ; * = obligatoire pour agir dans ce domaine. Tant que des spécialités comptées restent à rattacher, en choisir une est gratuit`],['Points de personnage (PP)','atteindre le rang N d\'un profil ajoute N PP sur ce profil (automatique depuis le 16/11/2026). Toucher « PP » pour en dépenser : la dépense est inscrite dans l\'historique des achats et peut être annulée'],['Profil d\'un PNJ',`(niveau suivant) × ${RULES.prof}, soit quatre compétences à la fois`],['Rang de profil (PJ)','moyenne arrondie à l\'inférieur des quatre compétences'],['Masque et résistances','+1 de résistance physique et psychique par niveau de Masque au-delà de 5'],['Palier Profond',`Féerie ${STAGES[0].feerie}, une caractéristique ${STAGES[0].carac}, une compétence ${STAGES[0].comp}, ${STAGES[0].atout} atouts féeriques`],['Palier Légendaire',`Féerie ${STAGES[1].feerie}, une caractéristique ${STAGES[1].carac}, une compétence ${STAGES[1].comp}, ${STAGES[1].atout} atouts féeriques (après Profond)`],['Caractéristique accrue','une seule par personnage : +1 au score, au-delà du maximum (ex. Esprit 6/9 devient 7/10). Le coût d\'évolution et les paliers Profond et Légendaire se calculent sur la base, sans le bonus. Se coche dans le détail de la caractéristique'],['Rang PJ : éligibilité',`seules les compétences dont le niveau max est de ${PALIER_MAX} ou plus comptent pour Profond et Légendaire`],['Autres dépenses','Fief, Triche, PNJ : montant libre, sans maximum ni évolution'],['Rang d\'héritage','une étoile par gain de type Scénario (30 au maximum), corrigeable à la main'],['Secrets de l\'univers','titre +1, indice +1, vérité mineure +2, vérité majeure +3 ; +4 quand toutes les vérités majeures d\'un secret sont découvertes. XP de nature Groupe pour tous les PJ actifs, inscrite au journal d\'XP (type « Secret de l\'univers »)'],['Races de l\'univers','+1 quand toutes nos connaissances sur une race sont réunies (fiche complète). XP de nature Groupe pour tous les PJ actifs, inscrite au journal d\'XP (type « Race de l\'univers »)'],['Sessions de jeu','chaque gain d\'XP est saisi dans une session (type, intitulé, date) ; les secrets et les races complétées peuvent y être rattachés. Une session ne peut être supprimée tant que des découvertes y sont rattachées'],['Part des PNJ','PNJ rattaché à un PJ : 50 % des gains du PJ dans la session s\'il a participé activement, 25 % sinon, arrondi à l\'inférieur ; sessions datées à partir du rattachement'],['Planning','chaque joueur coche ses disponibilités en journée et en soirée ; créneaux préférés : samedi soir et dimanche journée. « Prochaines dates » : dates validées, créneaux où toute la table est libre, dates proposées que chacun accepte ou décline ; la prochaine date validée s\'affiche sur l\'accueil. Si un MJ décline une proposition, elle est refusée et ne peut pas être validée. Des créneaux consécutifs libres pour toute la table (par exemple samedi soir et dimanche journée) forment une seule date'],['Alerte de gains','PJ actif dont le total est inférieur d\'au moins '+GAP+' XP à la moyenne du groupe'],['Rattrapage d\'XP','sur la ligne d\'un PJ en alerte, la flèche ↑ ouvre une attribution pré-remplie (type Autre, nature Individuel, date du jour) du nombre d\'XP qui le ramène au total du PJ juste devant. Rien n\'est attribué automatiquement, tout reste modifiable. Hors session de jeu, sans part pour les PNJ rattachés']];
  return `<h2 style="margin-top:4px">Règles appliquées</h2><div class="card">${rows.map(r=>`<div class="ev"><div class="t" style="min-width:140px">${esc(r[0])}</div><div class="muted" style="text-align:right">${esc(r[1])}</div></div>`).join('')}</div>
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
    h+=`<div class="fsub">${l}</div>`+L.map(a=>{const x=a.ppel,bits=[PPOPT[x.opt]||'',x.fort!=null?'Fortune '+x.fort:'',x.fortS!=null?'Fortune +'+x.fortS:'',x.spec?'spécialité '+x.spec:'',x.prec||''].filter(Boolean);
      const fx=fxOf(c).filter(e=>e.kind==='pp'&&e.src===x.nom);return `<div class="fi"><b>${esc(x.nom)}</b>${bits.length?` <span class="muted small">· ${bits.map(esc).join(' · ')}</span>`:''}${fx.map(e=>`<div class="fxs">Effet : ${esc(fxLabel(e))}${e.t!=='rap'&&e.txt?' · '+esc(e.txt):''}</div>`).join('')}</div>`;}).join('');}
  if(free.length)h+=`<div class="fsub">Autres dépenses de PP</div>`+free.map(a=>`<div class="fi"><span class="small">${esc(a.label)}</span></div>`).join('');
  if(!B.length&&!free.length)h+='<div class="muted small" style="margin-top:6px">Aucune acquisition en points de personnage.</div>';
  const fo=B.filter(a=>a.ppel.fort!=null||a.ppel.fortS!=null);
  if(fo.length)h+=`<div class="muted small" style="margin-top:8px">Fortune ${lv(c,'fortune')} · indicatif : ${fo.map(a=>esc(a.ppel.nom)+' '+(a.ppel.fort!=null?a.ppel.fort:'+'+a.ppel.fortS)).join(' + ')}. La Fortune enregistrée ne change pas.</div>`;
  return h+'</div>';}

const ppFortSrc=c=>c.type==='PJ'?ppBought(c).filter(a=>a.ppel.fort!=null||a.ppel.fortS!=null).map(a=>a.ppel.nom+' '+(a.ppel.fort!=null?a.ppel.fort+' (principale)':'+'+a.ppel.fortS+' (secondaire)')):[];

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
const SH_TABS=[['prog','Progrès'],['fiche','Fiche'],['feer','Féerie'],['rel','Relations'],['situ','Situation'],['jour','Chronique']]; /* lot 2 : l'onglet Journaux devient « Chronique » (Quêtes / Journaux ; Feuilleton au lot 3) */
const shHasFee=c=>c.type==='PJ'&&!isHum(c);
const PN_TABS=[['por','Portrait'],['situ','Situation'],['rel','Relations']]; /* lot 4 : fiche PNJ ; féal : + Progression */
const shTabsOf=c=>c.type==='PNJ'?(isFeal(c)?PN_TABS.concat([['prog','Progression']]):PN_TABS):SH_TABS.filter(([k])=>k!=='feer'||shHasFee(c));
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
const ppBits=x=>[PPOPT[x.opt]||'',x.fort!=null?'Fortune '+x.fort:'',x.fortS!=null?'Fortune +'+x.fortS:'',x.spec?'spécialité '+x.spec:'',x.prec||''].filter(Boolean).join(' · ');
const ppLinesOf=(c,r)=>ppBought(c).filter(a=>a.ppel.rub===r).map(a=>`<div class="srow"><span><b>${esc(a.ppel.nom)}</b>${ppBits(a.ppel)?`<span class="d">${esc(ppBits(a.ppel))}</span>`:''}</span>${srcChip('pp')}</div>`);
/* ---------- Lot 2 bis (24/11/2026) : illustration de l'onglet Fiche ----------
   PJ fée : une illustration par forme, selon le sélecteur, distinctes du portrait (cartes, médaillons) ; autres personnages : le portrait seul.
   Illustration manquante : cadre vide (avec « Ajouter » pour le joueur du personnage et la gestion). */
const illMasqId=c=>'ill-masque-'+c.id,illDemId=c=>'ill-demasque-'+c.id;
function shIllu(c,fm){const two=c.type==='PJ'&&!isHum(c),mq=two&&fm!=='d',id=two?(mq?illMasqId(c):illDemId(c)):c.id,src=two?((S.ptr&&S.ptr[id])||null):portrait(c);
  const lab=two?(mq?'forme masquée':'forme démasquée'):'',full=c.court+(lab?' · '+lab:''),can=canPortrait(c);
  const inp=`<input type="file" accept="image/*" data-ptrfile="${esc(id)}" data-plab="${esc(full)}" hidden>`;
  if(src)return `<div class="fibigw shill">${bigImg(id,src,full)}${can?`<div style="margin-top:6px"><label class="edl" style="cursor:pointer">${ICON.crayon} Changer l'illustration${lab?' ('+esc(lab)+')':''}${inp}</label></div>`:''}</div>`;
  return `<div class="fibigw shill">${can?`<label class="fibig vide" aria-label="Ajouter l'illustration${lab?' ('+esc(lab)+')':''}"><span aria-hidden="true">+</span>Ajouter l'illustration${lab?'<br>('+esc(lab)+')':''}${inp}</label>`:`<span class="fibig vide" role="img" aria-label="Pas d'illustration"></span>`}</div>`;}
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
  if(!isHum(c))h+=`<div class="formesw"><span class="muted small">Forme</span><div class="seg sm" role="group" aria-label="Forme du personnage">${[['m','Masquée'],['d','Démasquée']].map(([v,l])=>`<button data-act="forme" data-v="${v}" aria-pressed="${fm===v}">${l}</button>`).join('')}</div></div>`;
  if(tab==='fiche')h+=shIllu(c,fm)+chAgeBlk(c); /* lot 2 bis ; lot 3 : âge */
  if(tab==='fiche'){
    const T=traitsOf(c);
    h+=cBlk('trt','Traits de caractère',T.length?String(T.length):'',T.length?`<div class="fxl">${T.map(([n,s])=>`<span class="rchip">${esc(n)} <small class="muted">· ${esc(s)}</small></span>`).join('')}</div>`:shNone,canEditC(c)?`<div class="relbtns"><button type="button" class="addl" data-act="trOpen" data-id="${esc(c.id)}">${ICON.crayon} Modifier les traits</button></div>`:''); /* lot 4 : modifiables ici seulement */
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
  h+=cBlk('pw','Pouvoirs',`${own.length} sur 8`,pw||'<div class="muted small">Aucun pouvoir choisi.</div>');
  if(x){const av=(x.av||[]).filter(e=>e&&e[0]),dv=(x.dv||[]).filter(e=>e&&e[0]);
    h+=cBlk('avdv','Avantages et désavantages',`${av.length} + ${dv.length}`,(av.length?`<div class="fsub">Avantages</div>`+av.map(e=>item(e[0],e[1],fxLines('av',e[0]))).join(''):'')+(dv.length?`<div class="fsub">Désavantages</div>`+dv.map(e=>item(e[0],e[1],fxLines('dv',e[0]))).join(''):'')||shNone);
    const capL=(x.cap||[]).filter(e=>e&&e[0]);
    const cap=capL.map(e=>{const cid=capIdByName(S.capacites||{},e[0]),th=cid?illThumb('cap',cid,48):'',nm=capLk(e);return th?`<div class="fi fil">${th}<div><b>${nm}</b>${e[1]?`<div class="s">${esc(e[1])}</div>`:''}${fxLines('cap',e[0])}</div></div>`:`<div class="fi"><b>${nm}</b>${e[1]?`<div class="s">${esc(e[1])}</div>`:''}${fxLines('cap',e[0])}</div>`;}).join('')+(c.accru?`<div class="fi"><b>${esc(c.accru)} ${accW(c.accru)}</b><div class="fxs${fm==='d'?'':' off'}">Effet : ${esc(c.accru)} +1 · démasqué seulement</div></div>`:'');
    h+=cBlk('cap','Capacités naturelles',String(capL.length+(c.accru?1:0)),cap||shNone);
    const at=atoutsOf(c).filter(a=>a&&a.nom);
    h+=cBlk('at','Atouts féeriques',String(at.length),at.map(a=>{const d=(x.at||[]).find(e=>e&&nrmA(e[0])===nrmA(a.nom));
      /* lot 4 : sous l'atout « Spécialités typiques », les 2 spécialités de la race (fiche de race, onglet Création) */
      const ty=isTyp(a.nom)?((RACES[c.race]||{}).t||[]).filter(e=>e&&e[0]):null;
      const tyH=ty?`<div class="fsp">${ty.length?ty.map(([sp,cp])=>esc(sp)+(cp?` <span class="muted">(${esc(cp)})</span>`:'')).join(', '):'<span class="muted">2 spécialités à rattacher</span>'}</div>`:'';
      return item(a.nom,d&&d[1],fxLines('at',a.nom)+tyH);}).join('')||shNone);}
  return h;}
/* ---------- Situation ---------- */
const SITU=[['titres','Titres','Titre obtenu en jeu'],['fiefs','Fiefs','Fief'],['familles','Familles','Famille'],['orgs','Organisations','Organisation'],['poss','Possessions courantes','Possession'],['possN','Possessions notables','Possession notable'],['lieux','Résidence et lieux','Lieu']]; /* lot 4 : « lieux » pour les PNJ seulement */
const situOf=c=>c.situ||{};
function situRows(c,k){const E=canEditC(c);return (situOf(c)[k]||[]).map(e=>`<div class="srow"><span><b>${esc(e.nom)}</b>${k==='orgs'&&e.role?` <span class="muted">· ${esc(e.role)}</span>`:''}${e.note?`<span class="d">${esc(e.note)}</span>`:''}</span>${srcChip('jeu')}${E?`<button type="button" class="ibtn" data-act="situEd" data-k="${k}" data-i="${esc(e.id)}" aria-label="Modifier ${esc(e.nom)}">✎</button>`:''}</div>`);}
function viewSituation(c){let h='';const E=canEditC(c),add=(k,l)=>E?`<button type="button" class="addl" data-act="situEd" data-k="${k}">+ ${l}</button>`:'';
  if(c.type==='PJ'){const f=lv(c,'fortune'),F=FORTUNE[f];h+=`<div class="fortl"><span>Fortune${F?` · <b>${esc(F[0])}</b> <span class="muted small">(${esc(F[1])})</span>`:''}</span><b class="num">${f}</b></div>`;}
  const B=[],A=ppLinesOf(c,'A');B.push({e:!A.length,h:cBlk('act','Activités',A.length?String(A.length):'',A.join('')||shNone,'',!A.length)});
  for(const [k,l,al] of SITU){if(k==='lieux')continue;let rows=situRows(c,k);
    if(k==='titres')rows=ppLinesOf(c,'T').concat(rows);
    if(k==='poss')rows=ppLinesOf(c,'E').concat(rows);
    B.push({e:!rows.length,h:cBlk(k,l,rows.length?String(rows.length):'',rows.join('')||shNone,add(k,al),!rows.length)});}
  return h+shOrder(B);}
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
function relsOf(c){const R=(c.rel||[]).filter(r=>r.pnj||r.grp).map(r=>({...r}));
  for(const a of ppBought(c).filter(a=>a.ppel.rub==='C'))R.push({id:'pp:'+a.id,virt:true,nom:a.ppel.nom+(a.ppel.prec?' ('+a.ppel.prec+')':''),niv:'contact',src:'pp',note:ppBits(a.ppel)});
  for(const f of Object.values(S.chars).filter(f=>f.pj===c.id&&vis(f)))if(!R.some(r=>r.pnj===f.id&&r.niv==='allie'))R.push({id:'feal:'+f.id,pnj:f.id,virt:true,niv:'allie',src:'feal'});
  return R;}
function relOrgBonus(c,r){const p=r.pnj&&S.chars[r.pnj];if(!p)return 0;const a=(situOf(c).orgs||[]).map(o=>nrm(o.nom)),b=(situOf(p).orgs||[]).map(o=>nrm(o.nom));return a.some(n=>n&&b.includes(n))?(relP().bonusOrg!=null&&relP().bonusOrg!==''?+relP().bonusOrg:1):0;}
const relName=r=>{const p=r.pnj&&S.chars[r.pnj];return p&&vis(p)?lk({t:'perso',id:p.id},p.court||p.nom):`<b>${esc(r.nom||(p&&(p.court||p.nom))||'?')}</b>`;};
const pbar=(f,n)=>`<span class="pbar" role="img" aria-label="${f} succès sur ${n}"><i style="width:${n?Math.min(100,Math.round(100*f/n)):0}%"></i></span>`;
function jaugeBox(c,E,j,head,acts){const full=(j.cases||0)>=j.taille;
  return `<div class="pend${j.done?' done':''}">${head}<div class="pbw">${pbar(j.cases||0,j.taille)}<small>${j.cases||0} / ${j.taille}${j.diffShow!=null?` · difficulté ${j.diffShow}`:''}</small></div>${j.done?'<div class="muted small">Jauge terminée.</div>':''}
    ${E&&!j.done?(full?`<div class="relbtns"><button type="button" class="btn pri sm" data-act="${acts.val}" data-id="${esc(acts.id||'')}" data-j="${esc(j.id)}">Valider${acts.valLab?' : '+acts.valLab:''}</button></div>`
      :`<div class="relbtns sx"><label class="small" for="rs-${esc(j.id)}">Succès</label><input id="rs-${esc(j.id)}" class="sxi" type="number" min="0" inputmode="numeric" data-rs="${esc(j.id)}" placeholder="0"><button type="button" class="btn pri sm" data-act="${acts.add}" data-id="${esc(acts.id||'')}" data-j="${esc(j.id)}">Ajouter</button>${acts.del?`<button type="button" class="btn ghost sm jclose" data-act="${acts.del}" data-id="${esc(acts.id||'')}" data-j="${esc(j.id)}">Fermer la jauge</button>`:''}</div>`)
      :E&&j.done&&acts.del?`<div class="relbtns"><button type="button" class="btn ghost sm" data-act="${acts.del}" data-id="${esc(acts.id||'')}" data-j="${esc(j.id)}">Retirer</button></div>`:''}</div>`;}
function relRow(c,r,E){const rk=relRang(r);
  const sub=r.grp?`<span class="srcb j">contact de groupe</span>${r.orig?' · '+esc(r.orig):''}`:r.src==='pp'?srcChip('pp'):r.src==='feal'?srcChip('feal'):'';
  return `<div class="relr"><div class="relh"><span>${relName(r)}${rk?` <span class="muted small">· ${esc(rk)}</span>`:''}</span><span class="rr"><span class="lvl ${r.niv}">${REL_NIV[r.niv]||''}</span>${E&&!r.virt?`<button type="button" class="ibtn" data-act="${r.grp?'relGrp':'relEd'}" data-id="${esc(r.id)}" aria-label="Modifier">✎</button>`:''}</span></div>${sub||r.note?`<div class="muted small">${sub}${sub&&r.note?' · ':''}${r.note?esc(r.note):''}</div>`:''}</div>`;}
function viewRelations(c){const R=relsOf(c),E=canEditC(c);let h='';
  const pend=obj=>R.flatMap(r=>(r.jauges||[]).filter(j=>j.obj===obj).map(j=>{const bo=relOrgBonus(c,r),d=j.diff!=null&&j.diff!==''?+j.diff:relDiff(relRang(r),obj);
    return jaugeBox(c,E,{...j,diffShow:d!=null?d-bo:null},`<div class="relh"><span>${relName(r)} <span class="muted small">· ${esc(relRang(r))}</span></span><span class="tagp">en cours ${REL_OBJ[obj][2]}</span></div>${bo?`<div class="muted small">dont même organisation −${bo}</div>`:''}`,{id:r.id,add:'relAddS',del:'relJDel',val:'relVal',valLab:'devient '+REL_OBJ[obj][3].toLowerCase()});})).join('');
  const sec=(k,t,niv,obj,btns)=>{const L=R.filter(r=>r.niv===niv),P=obj?pend(obj):'',n=L.length;
    const em=!n&&!P;return {e:em,h:cBlk('rel-'+k,t,(n?String(n):'')+(P?(n?' + ':'')+'jauge en cours':''),(L.map(r=>relRow(c,r,E)).join('')||(P?'':shNone))+P,E?`<div class="relbtns">${btns}</div>`:'',em)};};
  const B=[];
  B.push(sec('contact','Contacts','contact','contact','<button type="button" class="addl" data-act="relNew" data-niv="contact">+ Contact</button><button type="button" class="addl" data-act="relGrp">+ Contact de groupe</button>'));
  B.push(sec('allie','Alliés','allie','allie','<button type="button" class="addl" data-act="relNew" data-niv="allie">+ Allié</button>'));
  B.push(sec('ennemi','Ennemis','ennemi',null,'<button type="button" class="addl" data-act="relNew" data-niv="ennemi">+ Ennemi</button>'));
  const O=c.jauges||[],QJ=jrRelJauges(c),nO=O.length+QJ.length; /* lot 2 : jauges de recherche des quêtes */
  B.push({e:!nO,h:cBlk('rel-autres','Autres jauges',nO?String(nO):'',QJ.join('')+O.map(j=>jaugeBox(c,E,{...j,diffShow:j.diff!==''&&j.diff!=null?+j.diff:null},`<div class="relh"><span><b>${esc(j.nom)}</b></span></div>`,{add:'relOAdd',del:'relODel',val:'relOVal'})).join('')||(QJ.length?'':shNone),E?`<div class="relbtns"><button type="button" class="addl" data-act="relOJ">+ Autre jauge</button></div>`:'',!nO)});
  h+=shOrder(B);
  h+=`<div class="muted small" style="margin-top:4px">Jauges : ouvertes à la demande du joueur ; après un jet fait à la table, on ajoute les succès (plusieurs d'un coup). Jauge pleine : « Valider ». Aucun coût en XP ni en PP.</div>`;
  return h;}
/* ---------- Journaux : remplacés au lot 2 par l'onglet Chronique (fiches.js, jrView) ---------- */
/* ---------- Fenêtres et actions des onglets Relations et Situation ---------- */
const SH_DLG=new Set(['situEd','relEd','relNew','relGrp','relOJ']);
const dlgHead=(t,sub)=>`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(t)}"><div class="in"><div class="shd"><h2 style="margin:0">${esc(t)}</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>${sub?`<div class="muted small" style="margin-bottom:8px">${sub}</div>`:''}`;
const fld=(k,l,v,ta)=>`<div class="field"><label for="dk-${k}">${l}</label>${ta?`<textarea id="dk-${k}" rows="${ta}" data-dk="${k}">${esc(v||'')}</textarea>`:`<input id="dk-${k}" type="${['taille','n','diff'].includes(k)?'number':'text'}"${['taille','n','diff'].includes(k)?' min="0" inputmode="numeric"':''} data-dk="${k}" value="${esc(v==null?'':v)}">`}</div>`;
const segF=(k,v,opts,l)=>`<div class="field"><label>${l}</label><div class="seg" role="group" aria-label="${esc(l)}">${opts.map(([o,t])=>`<button type="button" data-act="dlgSet" data-k="${k}" data-v="${o}" aria-pressed="${v===o}">${t}</button>`).join('')}</div></div>`;
const dlgFoot=(del,ok)=>`${S.dlg&&S.dlg.err?`<div class="bad small" role="alert">${esc(S.dlg.err)}</div>`:''}<div class="actions" style="margin-top:12px">${del?`<button class="btn ghost" data-act="${del}" style="margin-right:auto">${S.dlg&&S.dlg.conf?'Confirmer le retrait':'Retirer'}</button>`:''}<button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="${ok}">Enregistrer</button></div></div></div>`;
function shDlgSheet(g){const c=S.chars[g.cid];if(!c)return null;const f=g.f;
  if(g.kind==='situEd'){const L=SITU.find(s=>s[0]===g.k);return dlgHead((g.i?'Modifier : ':'Ajouter : ')+L[2].toLowerCase(),esc(c.court))+fld('nom','Nom',f.nom)+(g.k==='orgs'?fld('role','Rôle dans l\'organisation',f.role):'')+(g.k==='lieux'?segF('res',f.res?'1':'0',[['1','Résidence'],['0','Autre lieu']],'Nature'):'')+fld('note','Note',f.note,2)+(['fiefs','familles','orgs'].includes(g.k)?'<div class="muted small">Le lien vers la fiche viendra quand ces fiches existeront.</div>':'')+dlgFoot(g.i?'situDel':'','situSave');}
  if(g.kind==='relNew'){const pn=relPnjs(c).filter(p=>!(c.rel||[]).some(r=>r.pnj===p.id&&r.niv===g.niv)),p=f.pnj&&S.chars[f.pnj],rk=p?rangOf(p):'',obj=REL_OBJ[g.niv]?g.niv:null;
    const miss=obj&&p&&(relTaille(rk,obj)==null||relDiff(rk,obj)==null);
    return dlgHead('Ajouter : '+REL_NIV[g.niv].toLowerCase(),esc(c.court))+`<div class="field"><label for="dk-pnj">PNJ (liste de l'appli)</label><select id="dk-pnj" data-dk="pnj"><option value="">— choisir —</option>${pn.map(x=>`<option value="${esc(x.id)}"${f.pnj===x.id?' selected':''}>${esc(x.court||x.nom)}</option>`).join('')}</select></div>`
      +(p?`<div class="field"><label>Rang (repris de sa fiche)</label><div class="inp ro">${esc(rk||'—')}</div></div>`:'')+fld('note','Note',f.note,2)
      +(obj&&p?(miss?`<div class="muted small">Jauge ${REL_OBJ[obj][3].toLowerCase()} pour le rang ${esc(rk)} pas encore réglée dans les Paramètres : saisis-la pour ouvrir une jauge.</div><div style="display:flex;gap:8px"><div style="flex:1">${fld('taille','Jauge (cases)',f.taille)}</div><div style="flex:1">${fld('diff','Difficulté',f.diff)}</div></div>`:`<div class="muted small">Ouvrir une jauge : ${relTaille(rk,obj)} cases, difficulté ${relDiff(rk,obj)} (Paramètres, ${esc(rk)} · ${REL_OBJ[obj][3]}).</div>`):'')
      +`${g.err?`<div class="bad small" role="alert">${esc(g.err)}</div>`:''}<div class="actions" style="margin-top:12px"><button class="btn ghost" data-act="closeSheet">Annuler</button>${obj?`<button class="btn" data-act="relNewJ">Ouvrir une jauge</button>`:''}<button class="btn pri" data-act="relNewSave">Enregistrer</button></div></div></div>`;}
  if(g.kind==='relEd'){const r=(c.rel||[]).find(x=>x.id===g.id);if(!r)return null;return dlgHead(REL_NIV[r.niv]||'Relation',esc(r.pnj&&S.chars[r.pnj]?S.chars[r.pnj].court:r.nom||''))+fld('note','Note',f.note,2)+dlgFoot('relDel','relEdSave');}
  if(g.kind==='relGrp')return dlgHead(g.id?'Contact de groupe':'Nouveau contact de groupe',esc(c.court))+fld('nom','Intitulé (ex. Les druides)',f.nom)+fld('orig','Origine (ex. atout Ami des druides)',f.orig)+fld('note','Note',f.note,2)+dlgFoot(g.id?'relDel':'','relGrpSave');
  if(g.kind==='relOJ')return dlgHead('Autre jauge',esc(c.court))+fld('nom','Intitulé',f.nom)+`<div style="display:flex;gap:8px"><div style="flex:1">${fld('taille','Jauge (cases)',f.taille)}</div><div style="flex:1">${fld('diff','Difficulté',f.diff)}</div></div>`+dlgFoot('','relOSave');
  return null;}
function shCharAct(a,d){if(relpAct(a))return true;const c=S.chars[S.sel];
  if(a==='shFold'){S.shFold={...(S.shFold||{}),[d.k]:!shFolded(d.k,d.e==='1')};render();return true;}
  if(a==='dlgSet'&&S.dlg&&S.dlg.f){S.dlg.f[d.k]=d.k==='pub'||d.k==='res'?d.v==='1':d.v;render();return true;}
  const OPEN=['situEd','relNew','relEd','relGrp','relOJ','relAddS','relOAdd','relVal','relJDel','relOVal','relODel'],SAVE=['situSave','situDel','relNewSave','relNewJ','relEdSave','relDel','relGrpSave','relOSave'];
  if(!OPEN.includes(a)&&!SAVE.includes(a))return false;
  const cc=OPEN.includes(a)?c:S.chars[S.dlg&&S.dlg.cid];if(!cc||!canEditC(cc))return true;
  const now=today(),g=S.dlg;
  const setC=fn=>{const n=clone(cc);fn(n);saveChar(n);};
  if(a==='situEd'){const e=d.i&&(situOf(cc)[d.k]||[]).find(x=>x.id===d.i);S.dlg={kind:'situEd',cid:cc.id,k:d.k,i:d.i||null,f:e?{nom:e.nom,role:e.role||'',note:e.note||'',res:!!e.res}:{nom:'',role:'',note:'',res:false}};}
  else if(a==='situSave'){const nom=(g.f.nom||'').trim();if(!nom){g.err='Le nom est obligatoire.';render();return true;}
    setC(n=>{const s=n.situ={...(n.situ||{})},L=(s[g.k]||[]).slice(),v={nom,...((g.f.role||'').trim()&&g.k==='orgs'?{role:g.f.role.trim()}:{}),...((g.f.note||'').trim()?{note:g.f.note.trim()}:{}),...(g.k==='lieux'&&g.f.res?{res:true}:{})};
      const i=L.findIndex(x=>x.id===g.i);if(i>=0)L[i]={...L[i],...v,role:v.role,note:v.note,res:v.res};else L.push({id:uid('s'),date:now,...v});s[g.k]=L;});S.dlg=null;toast('Enregistré');}
  else if(a==='situDel'){if(!g.conf){g.conf=true;render();return true;}setC(n=>{const s=n.situ={...(n.situ||{})};s[g.k]=(s[g.k]||[]).filter(x=>x.id!==g.i);});S.dlg=null;}
  else if(a==='relNew'){S.dlg={kind:'relNew',cid:cc.id,niv:d.niv,f:{pnj:'',note:'',taille:'',diff:''}};}
  else if(a==='relNewSave'||a==='relNewJ'){const f=g.f,p=f.pnj&&S.chars[f.pnj];if(!p){g.err='Choisis un PNJ dans la liste.';render();return true;}
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
