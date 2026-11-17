/* La belle appli — Paramètres (règles chiffrées, rangs de PNJ, barèmes) et entrée des personnages existants dans le moteur de bonus */
function pDraft(){if(!S.pd){const v=clone(PRM);S.pd={date:today(),v};}return S.pd;}
function viewParams(){if(!S.paramsReady)return `<h2 style="margin-top:4px">Paramètres</h2><div class="card empty">Chargement…</div>`;
  const tab=S.ptab||'creation',G=isGest(),g=pDraft();
  let h=`<h2 style="margin-top:4px">Paramètres</h2><div class="ptabs" role="group" aria-label="Sections">${PARAM_TABS.map(([k,l])=>`<button data-act="ptab" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`;
  if(tab==='bonus')return h+viewFxFix();
  if(tab==='pouvoirs')return h+viewPwCat();
  const conf='<span class="tagc">à confirmer</span>';
  const row=([k,l,,c])=>`<div class="pr2"><label for="p-${k}">${esc(l)} ${c?conf:''}</label><span class="pv">${k==='ppBareme'?`<select id="p-${k}" data-pv="${k}">${['1, 3, 6, 10, 15','1, 4, 10, 20, 35'].map(o=>`<option${g.v[k]===o?' selected':''}>${o}</option>`).join('')}</select>`:`<input id="p-${k}" type="number" min="0" data-pv="${k}" value="${esc(g.v[k])}">`}</span></div>`;
  const T={couts:'Coûts en XP',paliers:'Paliers Profond et Légendaire',creation:'Règles de création',pnj:'Rangs de PNJ',table:'XP de la table'};
  let body='';
  if(tab==='pnj'){body=`<div class="muted small" style="margin-bottom:6px">Points de caractéristiques au total (minima compris) et points à répartir dans les profils, par rang.</div><div class="pnjg"><span class="muted small">Rang</span><span class="muted small">Caract.</span><span class="muted small">Profils</span><span></span>${(g.v.pnj||[]).map((r,i)=>`<input type="text" data-prk="${i}" data-pk="nom" value="${esc(r.nom)}" aria-label="Nom du rang"><input type="number" min="0" data-prk="${i}" data-pk="car" value="${esc(r.car)}" aria-label="Caractéristiques"><input type="number" min="0" data-prk="${i}" data-pk="prof" value="${esc(r.prof)}" aria-label="Profils"><button class="x" data-act="pnjDel" data-i="${i}" aria-label="Retirer le rang">✕</button>`).join('')}</div><div class="radd"><button class="btn" data-act="pnjAdd">+ Ajouter un rang</button></div><div class="muted small" style="margin-top:6px">Connu : Larbin. Pointure, Cador et les autres rangs restent ${conf}.</div>`;}
  else body=PARAM_DEF[tab].map(row).join('');
  const vers=((S.params&&S.params.versions)||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
  h+=`<div class="card"><h3 class="rs" style="margin-top:0">${T[tab]}</h3>${G?'':'<div class="rolock">Lecture seule : réservé aux personnes ayant les droits de gestion.</div>'}<fieldset class="pf"${G?'':' disabled'}>${body}
    <div class="lab2">Date d'effet des modifications</div><input type="date" data-pdate="1" value="${esc(g.date)}" aria-label="Date d'effet">
    <div class="muted small" style="margin-top:6px">Une modification ne s'applique qu'à partir de sa date d'effet ; l'historique des personnages n'est pas recalculé.</div>
    ${G?`<div class="actions" style="margin-top:12px"><button class="btn pri" data-act="pSave">Enregistrer</button><button class="btn ghost" data-act="pDef">Valeurs par défaut</button></div>`:''}</fieldset>
    ${S.psaved?'<div class="small muted" style="margin-top:6px">Enregistré.</div>':''}
    ${vers.length?`<div class="muted small" style="margin-top:8px">Versions : ${vers.map(x=>fmtDate(x.date)+(x.date>today()?' (à venir)':'')).join(' · ')}</div>`:''}</div>
  <div class="muted small" style="margin-top:10px">Les valeurs s'appliquent à tous les onglets. Les autres joueurs les voient ici et dans Règles, en lecture seule.</div>`;
  return h;}
/* Bonus : faire entrer les personnages existants dans le moteur, après vérification */
function fxFixRows(){return Object.values(S.chars).filter(c=>!c.fx&&!['decede','retire'].includes(c.statut)).map(c=>{const L=fxOf(c);return {c,I:L.filter(fxInteg),D:L.filter(e=>e.t==='perm'&&!fxInteg(e)),n:L.length};});}
function viewFxFix(){if(!isGest())return `<div class="card"><div class="muted">Réservé aux personnes ayant les droits de gestion.</div></div>`;
  const rows=fxFixRows(),todo=rows.filter(r=>r.I.length||r.D.length),rest=rows.filter(r=>!r.I.length&&!r.D.length),ch=S.pfix=S.pfix||{};
  let h=`<div class="card"><h3 class="rs" style="margin-top:0">Personnages existants</h3><div class="muted small">Ces personnages ont été créés avant le moteur de bonus. Vérifie chaque ligne, puis active le moteur pour le personnage : rien ne change avant.</div>`;
  if(!todo.length)h+=`<div class="muted" style="margin-top:8px">Aucun personnage n'a de bonus permanent à vérifier.</div>`;
  for(const {c,I,D} of todo){const x=ch[c.id]=ch[c.id]||{};
    h+=`<div class="fxfix"><div class="hd"><b>${esc(c.court)}</b><span class="muted small">${esc(c.race||'')}</span></div>`;
    for(const e of I){const k=fxIntKey(e),r=ref(c,fxRefKey(e.cible)),cur=(r&&r.o&&r.o.cur)||0,v=x[k]||'in';
      h+=`<div class="fxq"><div>${fxChip(e)} <b>${esc(e.src)}</b> · ${esc(fxTarget(e.cible))} enregistrée : <b>${cur}</b></div><div class="seg sm"><button data-act="pfix" data-id="${esc(c.id)}" data-k="${esc(k)}" data-v="in" aria-pressed="${v==='in'}">Déjà compris (${cur})</button><button data-act="pfix" data-id="${esc(c.id)}" data-k="${esc(k)}" data-v="add" aria-pressed="${v==='add'}">À ajouter (→ ${cur+(+e.val||0)})</button></div></div>`;}
    for(const e of D){const n=e.cible.replace(/^der:/,''),man=(c.bonus&&c.bonus[n])||0,k='rm|'+n,v=x[k]??(man===+e.val?'rm':'keep');
      h+=`<div class="fxq"><div>${fxChip(e)} <b>${esc(e.src)}</b> · ajouté à l'affichage${fxQ(e.quand)==='d'?' en forme démasquée':''}</div>${man?`<div class="small">Bonus manuel déjà présent sur la fiche : ${sgn(man)}</div><div class="seg sm"><button data-act="pfix" data-id="${esc(c.id)}" data-k="${esc(k)}" data-v="rm" aria-pressed="${v==='rm'}">Retirer le manuel (doublon)</button><button data-act="pfix" data-id="${esc(c.id)}" data-k="${esc(k)}" data-v="keep" aria-pressed="${v==='keep'}">Garder les deux</button></div>`:''}</div>`;}
    h+=`<div class="actions" style="margin-top:6px"><button class="btn pri" data-act="fxActivate" data-id="${esc(c.id)}">Activer le moteur pour ${esc(c.court)}</button></div></div>`;}
  h+=`</div>`;
  if(rest.length)h+=`<div class="card" style="margin-top:12px"><div><b>${rest.length} autre${rest.length>1?'s':''} personnage${rest.length>1?'s':''}</b> sans bonus permanent à vérifier : ${rest.map(r=>esc(r.c.court)).join(', ')}.</div><div class="muted small" style="margin-top:4px">Activer le moteur ne change aucune valeur aujourd'hui ; les bonus des atouts qu'ils prendront ensuite seront appliqués automatiquement.</div><div class="actions" style="margin-top:8px"><button class="btn" data-act="fxActivateRest">Activer pour ces personnages</button></div></div>`;
  return h;}
function fxActivate(id){const c0=S.chars[id];if(!c0||c0.fx)return;const c=clone(c0),x=(S.pfix||{})[id]||{},fi={};
  for(const e of fxOf(c0)){if(fxInteg(e)){const k=fxIntKey(e),v=+e.val||0;if((x[k]||'in')==='add'){const r=ref(c,fxRefKey(e.cible));if(r&&r.o)r.o.cur=(r.o.cur||0)+v;}fi[k]=(fi[k]||0)+v;}
    else if(e.t==='perm'){const n=e.cible.replace(/^der:/,''),man=(c.bonus&&c.bonus[n])||0,k='rm|'+n;if(man&&(x[k]??(man===+e.val?'rm':'keep'))==='rm'){delete c.bonus[n];}}}
  c.fx=true;c.fxInt=fi;saveChar(c);}
