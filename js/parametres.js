/* La belle appli — Paramètres (règles chiffrées, rangs de PNJ, barèmes) */
function pDraft(){if(!S.pd){const v=clone(PRM);S.pd={date:today(),v};}return S.pd;}
function viewParams(){if(!S.paramsReady)return `<h2 style="margin-top:4px">Paramètres</h2><div class="card empty">Chargement…</div>`;
  const tab=S.ptab||'creation',G=isGest(),g=pDraft();
  let h=`<h2 style="margin-top:4px">Paramètres</h2><div class="ptabs" role="group" aria-label="Sections">${PARAM_TABS.map(([k,l])=>`<button data-act="ptab" data-v="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>`;
  if(tab==='donnees')return h+viewDonnees();
  if(tab==='pouvoirs')return h+viewElCat('pw');
  if(tab==='capacites')return h+viewElCat('cap');
  if(tab==='profils')return h+viewProfils();
  const conf='<span class="tagc">à confirmer</span>';
  const row=([k,l,,c])=>`<div class="pr2"><label for="p-${k}">${esc(l)} ${c?conf:''}</label><span class="pv">${k==='ppBareme'?`<select id="p-${k}" data-pv="${k}">${['1, 3, 6, 10, 15','1, 4, 10, 20, 35'].map(o=>`<option${g.v[k]===o?' selected':''}>${o}</option>`).join('')}</select>`:`<input id="p-${k}" type="number" min="0" data-pv="${k}" value="${esc(g.v[k])}">`}</span></div>`;
  const T={couts:'Ratios',paliers:'Rang PJ : conditions Profond et Légendaire',creation:'Règles de création',pnj:'Rangs de PNJ',table:'XP Groupe'};
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
/* ---------- Lot 4 : Paramètres › Profils ---------- */
function viewProfils(){const G=isGest(),E=ppEls(),n={};for(const e of Object.values(E))n[e.prof]=(n[e.prof]||0)+1;
  return `<div class="card"><h3 class="rs" style="margin-top:0">Profils <span class="muted small">6</span></h3>${G?'':'<div class="rolock">Lecture seule : réservé aux personnes ayant les droits de gestion.</div>'}
  <div class="prl">${PROFILS.map(p=>{const x=prOf(p);return `<button class="prr" data-act="pfOpen" data-p="${esc(p)}"><span><b>${esc(x.m)}${x.f&&x.f!==x.m?' / '+esc(x.f):''}</b><small>${PROFCOMPS[p].map(esc).join(' · ')}</small><small>Tableau de PP : ${n[p]||0} éléments · Traits : ${x.traits.map(esc).join(', ')||'—'}</small></span><span aria-hidden="true">›</span></button>`;}).join('')}</div></div>
  <div class="muted small" style="margin-top:10px">Les 6 profils et leurs compétences sont fixes. Noms, traits, spécialités, titre et tableau de points de personnage se modifient ici.</div>`;}
const PF_KINDS=new Set(['pfEd','ppEl','ppBuy','traits','riEye']);
const PF_ACTS=new Set(['pfOpen','pfTab','pfRub','pfTrDel','pfTrAdd','pfSpEd','pfSpAdd','pfSpDel','pfSpOk','pfSpCancel','pfSave','ppElOpen','ppElNew','ppElBack','ppElSeg','ppElTg','ppPreNew','ppPreT','ppPreOk','ppPreDel','ppPreCancel','ppElSave','ppElDel','ppElDelOk',
  'ppRub','ppPick','ppTitre','ppOther','ppBack','ppOpt','ppOv','ppBuyOk','trOpen','trNat','trSave']);
function pfDraft(p){const x=prOf(p),sp={};for(const k of PROFCOMPS[p])sp[k]=clone(CATSPEC[k]||[]);
  return {kind:'pfEd',p,tab:'prof',rub:'A',m:x.m||'',f:x.f||'',traits:x.traits.slice(),tnew:'',specs:sp,spEd:null,tnom:x.titre.nom,tdesc:x.titre.desc||'',fx:clone(x.titre.fx||[]),fxEd:null,err:''};}
const sheetW=(lab,inner)=>`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(lab)}"><div class="in">${inner}</div></div>`;
const pfSeg=(act,cur,opts,ex='')=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-act="${act}" data-v="${v}"${ex} aria-pressed="${cur===v}">${l}</button>`).join('')}</div>`;
function pfSheet(g){if(g.kind==='pfEd')return pfEdSheet(g);if(g.kind==='ppEl')return ppElSheet(g);if(g.kind==='ppBuy')return ppBuySheet(g);if(g.kind==='traits')return traitsSheet(g);if(g.kind==='riEye')return riEyeSheet(g);return '';}
function pfEdSheet(g){const G=isGest(),p=g.p;let h=`<div class="shd"><h2>${esc(g.m||p)}${g.f&&g.f!==g.m?' / '+esc(g.f):''}</h2></div>${pfSeg('pfTab',g.tab,[['prof','Profil'],['tab','Tableau de PP']])}`;
  if(g.spEd){const e=g.spEd;return sheetW('Spécialités',`<div class="shd"><h2>Spécialités · ${esc(e.comp)}</h2></div><div class="muted small">Nom, caractéristique associée, et case cochée si la spécialité est réservée (à justifier).</div>
    ${e.list.map((x,i)=>`<div class="spr"><input type="text" data-pfs="${i}" data-c="0" value="${esc(x[0]||'')}" aria-label="Nom"><input type="text" data-pfs="${i}" data-c="1" value="${esc(x[1]||'')}" aria-label="Caractéristique" style="max-width:110px"><label class="small"><input type="checkbox" data-pfs="${i}" data-c="2"${x[2]?' checked':''}> réservée</label><button class="btn ghost" data-act="pfSpDel" data-i="${i}" aria-label="Retirer">✕</button></div>`).join('')||'<div class="muted small">Aucune spécialité.</div>'}
    <button class="btn ghost" data-act="pfSpAdd">+ Spécialité</button><div class="actions"><button class="btn" data-act="pfSpCancel">Annuler</button><button class="btn pri" data-act="pfSpOk">Valider</button></div>`);}
  if(g.tab==='tab'){const E=ppEls(),L=Object.entries(E).filter(([,e])=>e.prof===p&&e.rub===g.rub);
    h+=`<div style="margin-top:10px">${pfSeg('pfRub',g.rub,PP_RUB.map(r=>[r[0],r[2]]))}</div><h3 class="rs">${esc(PP_RUB.find(r=>r[0]===g.rub)[1])}</h3>
    <div class="ppl">${L.map(([id,e])=>`<button class="ppi" data-act="ppElOpen" data-id="${esc(id)}"><span>${esc(e.nom)}${e.excl?' <span class="tagc">profil</span>':''}${e.nocrea?' <span class="tagc">pas à la création</span>':''}${e.rub==='A'&&e.fortP!=null?`<small> · Fortune ${e.fortP}${e.fortS!=null?' ou +'+e.fortS+' si secondaire':''}</small>`:''}${(e.pre||[]).length?`<small> · ${e.pre.map(ppPreTxt).map(esc).join(', ')}</small>`:''}</span><b class="num">${esc(ppCostTxt(e))}</b></button>`).join('')||'<div class="muted small">Aucun élément.</div>'}</div>
    ${G?'<button class="btn ghost" data-act="ppElNew" style="margin-top:8px">+ Élément</button>':''}
    <div class="muted small" style="margin-top:8px">Deux coûts : contact humain / fée, ou fée traditionnelle / moderne pour les titres. Le titre du profil a sa carte dans l'onglet Profil.</div>
    <div class="actions"><button class="btn" data-act="closeSheet">Fermer</button></div>`;
    return sheetW('Profil '+p,h);}
  h+=`<fieldset class="pf"${G?'':' disabled'}><div class="frow"><div class="field"><label for="pfm">Nom (masculin)</label><input id="pfm" type="text" data-pfe="m" value="${esc(g.m)}"></div><div class="field"><label for="pff">Nom (féminin)</label><input id="pff" type="text" data-pfe="f" value="${esc(g.f)}"></div></div>
    <div class="lab2">Traits de caractère saillants <span class="muted small" style="text-transform:none;letter-spacing:0">(liste proposée à la création)</span></div>
    <div class="fxl">${g.traits.map((x,i)=>`<span class="rchip">${esc(x)}${G?`<button data-act="pfTrDel" data-i="${i}" aria-label="Retirer ${esc(x)}">✕</button>`:''}</span>`).join('')||'<span class="muted small">Aucun.</span>'}</div>
    ${G?`<div class="radd"><input type="text" data-pfe="tnew" value="${esc(g.tnew)}" placeholder="Nouveau trait…" aria-label="Nouveau trait"><button class="btn" data-act="pfTrAdd">Ajouter</button></div>`:''}
    <div class="lab2">Compétences · 4</div>${PROFCOMPS[p].map(k=>`<div class="pfc"><span><b>${esc(k)}</b><small>Spécialités : ${(g.specs[k]||[]).map(x=>esc(x[0])+(x[2]?'*':'')).join(' · ')||'—'}</small></span>${G?`<button class="btn ghost" data-act="pfSpEd" data-k="${esc(k)}">Modifier</button>`:''}</div>`).join('')}
    <div class="card ptc"><div class="prof-head"><b>${ICON.medaille||''} ${esc(g.tnom||titreDef(p))}</b><span class="pill acc">${PPT_COST} PP</span></div>
    <div class="frow"><div class="field"><label for="pft">Nom</label><input id="pft" type="text" data-pfe="tnom" value="${esc(g.tnom)}"></div><div class="field"><label>Condition</label><div class="muted" style="padding-top:8px">${PPT_PTS} points de compétences dans le profil</div></div></div>
    <div class="field"><label for="pfd">Bonus accordés</label><textarea id="pfd" rows="2" data-pfe="tdesc">${esc(g.tdesc)}</textarea></div>
    <div class="lab2">Effets</div>${G?fxBox('dlg',g):(g.fx||[]).map(e=>fxChip(e)).join('')||'<span class="muted small">Aucun effet.</span>'}</div></fieldset>
    ${g.err?`<div class="bad small">${esc(g.err)}</div>`:''}
    <div class="actions"><button class="btn" data-act="closeSheet">${G?'Annuler':'Fermer'}</button>${G?'<button class="btn pri" data-act="pfSave">Enregistrer</button>':''}</div>`;
  return sheetW('Profil '+p,h);}
function ppElDraft(id,prof,rub,back){const e=id?ppEls()[id]:{prof,rub,nom:'',cost:{k:'u',a:null,b:null},excl:false,nocrea:false,fortP:null,fortS:null,spec:'',pre:[],prec:'',fx:[]};
  const k=e.cost||{k:'u'};return {kind:'ppEl',id:id||null,prof:e.prof,rub:e.rub,nom:e.nom,ck:k.k,ca:k.a==null?'':String(k.a),cb:k.b==null?'':String(k.b),excl:!!e.excl,crea:!e.nocrea,
    fortP:e.fortP==null?'':String(e.fortP),fortS:e.fortS==null?'':String(e.fortS),spec:e.spec||'',pre:clone(e.pre||[]),preEd:null,prec:e.prec||'',fx:clone(e.fx||[]),fxEd:null,err:'',del:false,back};}
function ppElSheet(g){const G=isGest(),req='<span style="color:var(--bad)">*</span>',tg=(f,on,lab,sub)=>`<div class="tgrow"><span>${lab}<small class="muted"> ${sub}</small></span><button class="tgb" data-act="ppElTg" data-f="${f}" role="switch" aria-checked="${on}" aria-label="${esc(lab)}"><span class="tg${on?' on':''}"></span></button></div>`;
  const ck=g.ck,lab2=ck==='hf'?['Humain','Fée']:ck==='tm'?['Traditionnelle','Moderne']:['Coût',''];
  const pe=g.preEd,copt=v=>COMPS_ALL.map(c=>`<option${v===c?' selected':''}>${esc(c)}</option>`).join(''),popt=v=>PROFILS.map(p=>`<option value="${p}"${v===p?' selected':''}>${esc(prOf(p).m)}</option>`).join('');
  let h=`<div class="shd"><h2>${esc(g.id?g.nom||'Élément':'Nouvel élément')}</h2></div><div class="muted small">${esc(prOf(g.prof).m)} · tableau de points de personnage</div><fieldset class="pf"${G?'':' disabled'}>
  <div class="field"><label for="ppen">Nom ${req}</label><input id="ppen" type="text" data-ppe="nom" value="${esc(g.nom)}"></div>
  <div class="field"><label for="pper">Rubrique ${req}</label><select id="pper" data-ppe="rub">${PP_RUB.map(r=>`<option value="${r[0]}"${g.rub===r[0]?' selected':''}>${esc(r[1])}</option>`).join('')}</select></div>
  <div class="field"><label>Coût en PP ${req}</label>${pfSeg('ppElSeg',ck,[['u','Coût unique'],['hf','Humain / fée'],['tm','Trad. / moderne']],' data-f="ck"')}
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
  ${g.err?`<div class="bad small">${esc(g.err)}</div>`:''}
  ${g.del?`<div class="card" style="border-color:var(--bad)"><div class="small">Supprimer cet élément du tableau ? Les achats déjà faits restent sur les fiches.</div><div class="actions"><button class="btn" data-act="ppElDel">Garder</button><button class="btn pri" data-act="ppElDelOk">Supprimer</button></div></div>`:''}
  <div class="actions"><button class="btn" data-act="ppElBack">${G?'Annuler':'Retour'}</button>${G&&g.id?'<button class="btn ghost" data-act="ppElDel">Supprimer</button>':''}${G?'<button class="btn pri" data-act="ppElSave">Enregistrer</button>':''}</div>`;
  return sheetW('Élément du tableau',h);}
function ppElSave(g){const nom=(g.nom||'').trim(),num=v=>v===''||v==null?null:+String(v).replace(',','.');const a=num(g.ca),b=num(g.cb),miss=[];
  if(!nom)miss.push('le nom');if(g.ck==='u'&&(a==null||isNaN(a)))miss.push('le coût');if(g.ck==='hf'&&a==null&&b==null)miss.push('au moins un coût');if(g.ck==='tm'&&(a==null||b==null))miss.push('les deux coûts');
  if(miss.length){g.err='À compléter : '+miss.join(', ')+'.';return false;}
  const e={prof:g.prof,rub:g.rub,nom,cost:{k:g.ck,a,b:g.ck==='u'?null:b},excl:!!g.excl,nocrea:!g.crea,fortP:g.rub==='A'?num(g.fortP):null,fortS:g.rub==='A'?num(g.fortS):null,spec:g.rub==='A'?(g.spec||'').trim():'',pre:clone(g.pre),prec:(g.prec||'').trim(),fx:clone(g.fx||[])};
  prSaveDoc(d=>{let id=g.id;if(!id){id=freeId(d.el,'pp-'+slugOf(nom));}d.el[id]=e;});return true;}
/* Achat dans le tableau du profil */
function ppRows(c,prof){const E=ppEls(),own=[],oth=[];for(const [id,e] of Object.entries(E)){if(e.prof===prof)own.push([id,e]);else if(e.rub==='A'&&!e.excl)oth.push([id,e]);}return own.concat(oth);}
function ppBuySheet(g){const c=S.chars[g.cid],pr=c&&(c.profils||[]).find(x=>x.nom===g.prof);if(!pr)return '';
  if(g.sel)return ppConfirmSheet(g,c,pr);
  const have=ppHave(pr),rk=rankOf(c,pr),q=nrm(g.q||''),bought={};for(const a of ppBought(c))bought[a.ppel.id]=(bought[a.ppel.id]||[]).concat(a.ppel);
  const P=prOf(g.prof),tid='titre:'+g.prof,sum=ppSum(c,pr);
  let h=`<div class="shd" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2>${esc(profLab(g.prof,c))}</h2><span class="ppf" aria-label="PP disponibles"><small>PP</small>${esc(ppFmt(have))}</span></div>
  <div class="muted small">${esc(c.court)} dépense ses PP ${esc(profLab(g.prof,c))} dans ce tableau uniquement.</div>`;
  if(rk>=4){const got=bought[tid],ok=!got&&sum>=PPT_PTS&&have>=PPT_COST;h+=`<div class="card ptc"><div class="prof-head"><b>${ICON.medaille||''} ${esc(P.titre.nom)}</b>${got?'<span class="pill acc">acquis</span>':`<button class="btn${ok?' pri':''}" data-act="ppTitre"${ok?'':' disabled'}>${PPT_COST} PP</button>`}</div><div class="muted small">${sum} / ${PPT_PTS} points de compétences · ${esc(ppFmt(have))} / ${PPT_COST} PP${P.titre.desc?' · '+esc(P.titre.desc):''}</div></div>`;}
  h+=`<div class="field"><input type="search" data-ppb="q" value="${esc(g.q||'')}" placeholder="Rechercher dans le tableau…" aria-label="Rechercher dans le tableau"></div>${pfSeg('ppRub',g.rub,[['all','Tout'],...PP_RUB.map(r=>[r[0],r[2]])])}`;
  const rows=ppRows(c,g.prof).filter(([,e])=>(g.rub==='all'||e.rub===g.rub)&&(!q||nrm(e.nom).includes(q)));
  for(const r of PP_RUB){const L=rows.filter(([,e])=>e.rub===r[0]);if(!L.length)continue;
    h+=`<h3 class="rs">${esc(r[1])}</h3><div class="ppl">${L.map(([id,e])=>{const got=bought[id],miss=ppPreMiss(e,c),cost=ppCostMin(e,c),off=cost>have,mine=e.prof===g.prof;
      const sub=[e.rub==='A'&&e.fortP!=null?'Fortune '+e.fortP:'',mine?'':profLab(e.prof),e.nocrea?'pas à la création':''].filter(Boolean).join(' · ');
      if(got&&e.rub!=='L')return `<div class="ppi got"><span>${esc(e.nom)} <small>· ✓ ${got.map(x=>esc(PPOPT[x.opt]||'acquis')).join(', ')}</small></span><b class="small">acquis</b></div>`;
      return `<button class="ppi${off?' off':''}" data-act="ppPick" data-id="${esc(id)}"${off?' disabled':''}><span>${esc(e.nom)}${sub?` <small>· ${esc(sub)}</small>`:''}${miss.length?` <small class="bad">· ${miss.map(ppPreTxt).map(esc).join(', ')} requis</small>`:''}${got?` <small>· ✓ ×${got.length}</small>`:''}</span><b class="num">${esc(ppCostTxt(e))}</b></button>`;}).join('')}</div>`;}
  if(!rows.length)h+='<div class="muted small" style="margin:10px 0">Aucun élément.</div>';
  h+=`<button class="ppi oth" data-act="ppOther"><span>+ Autre achat <small>· saisie libre : intitulé et coût</small></span></button>
  <div class="muted small" style="margin-top:6px">Grisé : trop cher pour la réserve. Atteindre le rang N de ce profil ajoute N PP automatiquement.</div><div class="actions"><button class="btn" data-act="closeSheet">Fermer</button></div>`;
  return sheetW('Points de personnage',h);}
function ppSelEl(g,c){if(g.sel==='titre'){const P=prOf(g.prof);return {prof:g.prof,rub:'T',nom:P.titre.nom,cost:{k:'u',a:PPT_COST},pre:[],titre:true,prec:P.titre.desc||''};}return ppEls()[g.sel];}
function ppConfirmSheet(g,c,pr){const have=ppHave(pr);
  if(g.sel==='other'){const n=+String(g.ocost||'').replace(',','.')||0,ok=n>0&&(g.olab||'').trim();
    return sheetW('Autre achat',`<div class="shd"><h2>Autre achat</h2></div><div class="muted small">${esc(c.court)} · ${esc(profLab(g.prof,c))}</div>
    <div class="field"><label for="ppol">Intitulé</label><input id="ppol" type="text" data-ppb="olab" value="${esc(g.olab||'')}" autocomplete="off"></div>
    <div class="field"><label for="ppoc">Coût en PP</label><input id="ppoc" type="number" step="0.5" min="0" inputmode="decimal" data-ppb="ocost" value="${esc(g.ocost||'')}" style="max-width:140px"></div>
    <div class="calc"><span>PP disponibles</span><b>${esc(ppFmt(have))}</b></div>
    <div class="muted small">L'achat est inscrit dans l'historique et peut y être annulé.</div><div class="actions"><button class="btn" data-act="ppBack">Retour</button><button class="btn pri" data-act="ppBuyOk"${ok?'':' disabled'}>Acheter</button></div>`);}
  const e=ppSelEl(g,c);if(!e){g.sel=null;return ppBuySheet(g);}
  const k=e.cost||{},miss=ppPreMiss(e,c),G=isGest(),prin=ppBought(c).find(a=>a.ppel.opt==='p'&&a.ppel.rub==='A');
  let opt='';if(e.rub==='A')opt=`<div class="field"><label>Activité</label>${pfSeg('ppOpt',g.opt,[['p','Principale'],['s','Secondaire']])}${prin?`<div class="muted small">${esc(c.court)} a déjà une activité principale (${esc(prin.ppel.nom)}).</div>`:''}</div>`;
  else if(k.k==='hf'&&k.a!=null&&k.b!=null)opt=`<div class="field"><label>Le contact est</label>${pfSeg('ppOpt',g.opt,[['h','Humain'],['f','Fée']])}</div>`;
  const cost=ppCost(e,g.opt,c),eff=e.rub==='A'?(g.opt==='p'?(e.fortP!=null?'Fortune '+e.fortP:'')+(e.spec?(e.fortP!=null?' · ':'')+'spécialité '+e.spec+' offerte':''):(e.fortS!=null?'Fortune +'+e.fortS:'')):'';
  const nat=k.k==='tm'?natfOf(c):'',blocked=miss.length&&!(G&&g.ov),ok=cost<=have&&!blocked;
  return sheetW('Confirmer un achat',`<div class="shd"><h2>${esc(e.nom)}</h2></div><div class="muted small">${esc(profLab(g.prof,c))} · ${esc((PP_RUB.find(r=>r[0]===e.rub)||[])[1]||'')}</div>${opt}
  ${k.k==='tm'?`<div class="muted small">Coût selon la nature du personnage : ${nat?esc(NATF[nat]):'non renseignée (coût de fée traditionnelle)'}.</div>`:''}
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
    c.achats.push({id:aid,date:today(),label:`PP ${g.prof} - ${ppFmt(n)} - ${lab}`,cout:0,key:'pp:'+g.prof,pp:n});S.dlg=null;saveChar(c);return;}
  const e=ppSelEl(g,c0);if(!e)return;const cost=ppCost(e,g.opt,c0);if(cost>have)return;if(ppPreMiss(e,c0).length&&!(isGest()&&g.ov))return;
  const opt=e.rub==='A'||(e.cost&&e.cost.k==='hf')?g.opt:'',prec=(g.prec||'').trim();pr.note=have-cost;
  const x={id:g.sel==='titre'?'titre:'+g.prof:g.sel,prof:g.prof,rub:e.rub,nom:e.nom,opt};if(e.titre)x.titre=true;if(prec)x.prec=prec;
  if(e.rub==='A'){if(opt==='p'&&e.fortP!=null)x.fort=e.fortP;if(opt==='s'&&e.fortS!=null)x.fortS=e.fortS;if(opt==='p'&&e.spec)x.spec=e.spec;}
  c.achats.push({id:aid,date:today(),label:`PP ${g.prof} - ${ppFmt(cost)} - ${e.nom}${opt?' ('+PPOPT[opt]+')':''}${prec?' : '+prec:''}`,cout:0,key:'pp:'+g.prof,pp:cost,ppel:x});
  if(x.spec&&!specsOf(c).some(s=>nrmS(s.nom)===nrmS(x.spec))){const cp=specComp(x.spec);c.spec=c.spec||{cur:0};c.spec.cur=(c.spec.cur||0)+1;c.specs=[...specsOf(c),{nom:x.spec,cible:cp?'comp:'+cp:null,offert:true,ppa:aid}];}
  S.dlg=null;saveChar(c);}
/* Traits de caractère et nature féerique */
function trDraft(c){const t=c.traits||{},[mj,mn]=profMajMin(c);return {kind:'traits',cid:c.id,natf:c.natf||natfOf(c),race:t.race||'',majP:(t.maj&&t.maj.p)||mj||'',maj:(t.maj&&t.maj.n)||'',minP:(t.min&&t.min.p)||mn||'',min:(t.min&&t.min.n)||'',libre:t.libre||''};}
function traitsSheet(g){const c=S.chars[g.cid];if(!c)return '';const hum=isHum(c),rs=raceStoredOf(c),rt=(rs&&rs.traits)||[];
  const sel=(f,list,cur)=>{const L=list.slice();if(cur&&!L.includes(cur))L.unshift(cur);return `<select data-trf="${f}"><option value="">—</option>${L.map(x=>`<option${x===cur?' selected':''}>${esc(x)}</option>`).join('')}</select>`;};
  const psel=(f,cur)=>`<select data-trf="${f}" aria-label="Profil">${(c.profils||[]).map(p=>`<option value="${esc(p.nom)}"${p.nom===cur?' selected':''}>${esc(profLab(p.nom,c))}</option>`).join('')}</select>`;
  const prow=(k,lab)=>`<div class="field"><label>${lab}</label><div class="frow">${psel(k+'P',g[k+'P'])}${sel(k,g[k+'P']?prOf(g[k+'P']).traits:[],g[k])}</div></div>`;
  return sheetW('Traits',`<div class="shd"><h2>Traits de ${esc(c.court)}</h2></div>
  ${hum?'<div class="muted small">Féal : 2 traits, celui du profil le plus haut (au choix s\'il y a égalité) et un trait libre. Pas de nature féerique.</div>':`<div class="field"><label>Nature féerique</label>${pfSeg('trNat',g.natf,[['trad','Traditionnelle'],['mod','Moderne']])}<div class="muted small">Fixe le coût des titres et statuts dans les tableaux de PP.</div></div>
  <div class="field"><label>Trait de race${c.race?' ('+esc(c.race)+')':''}</label>${rt.length||g.race?sel('race',rt,g.race):'<div class="muted small">Aucun trait saisi pour cette race (fiche de race, onglet Informations).</div>'}</div>`}
  ${prow('maj',hum?'Trait du profil le plus haut':'Trait de profil majeur')}${hum?'':prow('min','Trait de profil mineur')}
  <div class="field"><label for="trl">Trait libre</label><input id="trl" type="text" data-trf="libre" value="${esc(g.libre)}" autocomplete="off"></div>
  <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="trSave">Enregistrer</button></div>`);}
function pfAct(a,d,t){const g=S.dlg,G=isGest();
  if(a==='pfOpen'){S.dlg=pfDraft(d.p);return;}
  if(a==='trOpen'){const c=S.chars[d.id||S.sel];if(!canEditC(c))return false;S.dlg=trDraft(c);return;}
  if(!g)return false;
  if(g.kind==='traits'){if(a==='trNat')g.natf=g.natf===d.v?'':d.v;
    else if(a==='trSave'){const c0=S.chars[g.cid];if(!canEditC(c0))return false;const c=clone(c0),hum=isHum(c);if(!hum&&g.natf)c.natf=g.natf;else delete c.natf;
      const tr={};if(!hum&&g.race)tr.race=g.race;if(g.maj)tr.maj={p:g.majP,n:g.maj};if(!hum&&g.min)tr.min={p:g.minP,n:g.min};if(g.libre.trim())tr.libre=g.libre.trim();c.traits=tr;S.dlg=null;saveChar(c);return false;}
    return;}
  if(g.kind==='ppBuy'){
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
    else if(a==='pfSave'){const m=(g.m||'').trim();if(!m){g.err='Le nom masculin est obligatoire.';return;}
      prSaveDoc(dd=>{const sp={};for(const k of PROFCOMPS[g.p])if(JSON.stringify(g.specs[k]||[])!==JSON.stringify(CATSPEC0[k]||[]))sp[k]=clone(g.specs[k]);
        dd.byId[g.p]={m,f:(g.f||'').trim()||m,traits:g.traits.slice(),specs:sp,titre:{nom:(g.tnom||'').trim()||titreDef(g.p),desc:(g.tdesc||'').trim(),fx:clone(g.fx||[])}};});S.dlg=null;}
    else if(a==='ppElOpen')S.dlg=ppElDraft(d.id,null,null,g);else if(a==='ppElNew')S.dlg=ppElDraft(null,g.p,g.rub,g);
    return;}
  if(g.kind==='ppEl'){
    if(a==='ppElBack'){S.dlg=g.back||null;}else if(a==='ppElSeg')g.ck=d.v;else if(a==='ppElTg')g[d.f]=!g[d.f];
    else if(a==='ppPreNew')g.preEd={t:'comp',n:COMPS_ALL[0],v:'3'};else if(a==='ppPreT'){g.preEd.t=d.v;g.preEd.n=d.v==='comp'?COMPS_ALL[0]:d.v==='prof'?PROFILS[0]:'';}
    else if(a==='ppPreCancel')g.preEd=null;else if(a==='ppPreDel')g.pre.splice(+d.i,1);
    else if(a==='ppPreOk'){const p=g.preEd,x=p.t==='spec'?{t:'spec',n:(p.n||'').trim()}:p.t==='fort'?{t:'fort',v:+p.v||0}:{t:p.t,n:p.n,v:+p.v||0};if(p.t==='spec'&&!x.n)return;g.pre.push(x);g.preEd=null;}
    else if(a==='ppElDel')g.del=!g.del;else if(a==='ppElDelOk'){if(g.id)prSaveDoc(dd=>{delete dd.el[g.id];});S.dlg=g.back||null;}
    else if(a==='ppElSave'){if(ppElSave(g)){S.dlg=g.back||null;if(S.dlg&&S.dlg.kind==='pfEd')S.dlg.rub=g.rub;}}
    return;}
  return false;}
function pfRO(a,d,g){if(g.kind==='pfEd'){if(a==='pfTab')g.tab=d.v;else if(a==='pfRub')g.rub=d.v;else if(a==='ppElOpen')S.dlg=ppElDraft(d.id,null,null,g);}else if(g.kind==='ppEl'&&a==='ppElBack')S.dlg=g.back||null;}
function pfInput(t,ev){const g=S.dlg;if(!g)return false;const D=t.dataset;
  if(D.pfe!==undefined&&g.kind==='pfEd'){g[D.pfe]=t.value;g.err='';return true;}
  if(D.pfs!==undefined&&g.kind==='pfEd'&&g.spEd){const r=g.spEd.list[+D.pfs];if(r){if(D.c==='2')r[2]=t.checked?1:0;else r[+D.c]=t.value;}return true;}
  if(D.ppe!==undefined&&g.kind==='ppEl'){g[D.ppe]=t.value;g.err='';if(D.ppe==='rub'&&ev==='change'){S._force=true;render();}return true;}
  if(D.ppp!==undefined&&g.kind==='ppEl'&&g.preEd){g.preEd[D.ppp]=t.value;return true;}
  if(D.trf!==undefined&&g.kind==='traits'){g[D.trf]=t.value;if(ev==='change'&&/P$/.test(D.trf)){g[D.trf.slice(0,-1)]='';S._force=true;render();}return true;}
  if(D.ppb!==undefined&&g.kind==='ppBuy'){g[D.ppb]=t.value;
    if(D.ppb==='q'&&ev==='input'){S._force=true;render();const el=document.querySelector('[data-ppb="q"]');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}}
    else if((D.ppb==='olab'||D.ppb==='ocost')){const b=q0('#sheetRoot [data-act="ppBuyOk"]');if(b)b.disabled=!((+String(g.ocost||'').replace(',','.')||0)>0&&(g.olab||'').trim());}
    return true;}
  return false;}
