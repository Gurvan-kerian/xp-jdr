/* La belle appli — Paramètres (règles chiffrées, rangs de PNJ, barèmes) */
function pDraft(){if(!S.pd){const v=clone(PRM);S.pd={date:today(),v};}return S.pd;}
function viewParams(){if(!S.paramsReady)return `<h2 style="margin-top:4px">Paramètres</h2><div class="card empty">Chargement…</div>`;
  const tab=S.ptab||'creation',G=isGest(),g=pDraft();
  let h=`<h2 style="margin-top:4px">Paramètres</h2><div class="ptabs" role="group" aria-label="Sections">${PARAM_TABS.map(([k,l])=>`<button data-act="ptab" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`;
  if(tab==='donnees')return h+viewDonnees();
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
