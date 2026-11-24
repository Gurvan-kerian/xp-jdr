/* La belle appli — Pouvoirs et capacités naturelles : catalogues (Univers › Pouvoirs et capacités depuis le lot 2 bis), sous-types, illustrations, choix des pouvoirs sur la fiche */
/* ---------- Éditeur d'effets générique (catalogue, emplacement de pouvoir d'une fiche de race) ---------- */
function fxCtx(k){if(k==='dlg')return S.dlg;if(k==='var')return S.dlg&&S.dlg.vEd;if(k&&k.startsWith('pw:')&&S.rf&&S.rf.pwx)return S.rf.pwx[+k.slice(3)];return null;}
const fxOkEd=e=>e.t==='rap'?(e.txt||'').trim():e.t==='perm'?e.cible&&+e.val:+e.val;
function fxBox(k,ctx){const L=ctx.fx||[],ed=ctx.fxEd;
  let h=`<div class="fxl">${L.map((e,j)=>fxChip(e,`<button data-act="fxcDel" data-c="${k}" data-j="${j}" aria-label="Retirer l'effet">✕</button>`)).join('')||'<span class="muted small">Aucun effet.</span>'}${ed?'':`<button class="fxadd" data-act="fxcNew" data-c="${k}">+ Effet</button>`}</div>`;
  if(!ed)return h;
  const seg=(act,cur,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button data-act="${act}" data-c="${k}" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join('')}</div>`;
  const opt=(v,l,cur)=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc(l)}</option>`;
  let body='';
  if(ed.t==='perm')body=`<div class="lab">Valeur modifiée</div><div class="f"><select data-fxcf="cible" data-c="${k}" aria-label="Valeur modifiée"><option value="">— choisir —</option><optgroup label="Caractéristiques">${CARCOL.map(c=>opt('car:'+c,c,ed.cible)).join('')}</optgroup><optgroup label="Compétences">${COMPS_ALL.map(c=>opt('comp:'+c,c,ed.cible)).join('')}</optgroup><optgroup label="Valeurs dérivées">${FX_DER.map(c=>opt('der:'+c,c,ed.cible)).join('')}</optgroup>${opt('fortune','Fortune',ed.cible)}</select><input type="number" data-fxcf="val" data-c="${k}" value="${esc(ed.val)}" style="max-width:70px" aria-label="Valeur"></div>`;
  else if(ed.t==='jet')body=`<div class="lab">Jet concerné et valeur</div><div class="f"><select data-fxcf="cible" data-c="${k}" aria-label="Jet concerné">${opt('','Jet en situation',ed.cible)}<optgroup label="Compétences">${COMPS_ALL.map(c=>opt(c,c,ed.cible)).join('')}</optgroup><optgroup label="Caractéristiques">${CARCOL.map(c=>opt(c,c,ed.cible)).join('')}</optgroup></select><input type="number" data-fxcf="val" data-c="${k}" value="${esc(ed.val)}" style="max-width:70px" aria-label="Valeur"></div><div class="f" style="margin-top:6px"><input type="text" data-fxcf="txt" data-c="${k}" value="${esc(ed.txt)}" placeholder="Condition" aria-label="Condition"></div>`;
  else body=`<div class="lab">Texte du rappel</div><div class="f"><input type="text" data-fxcf="txt" data-c="${k}" value="${esc(ed.txt)}" aria-label="Texte du rappel"></div>`;
  return h+`<div class="fxed"><div class="lab" style="margin-top:0">Sorte d'effet</div>${seg('fxcT',ed.t,[['perm','Permanent'],['jet','Jet'],['rap','Rappel']])}${body}<div class="lab">Quand</div>${seg('fxcQ',fxQ(ed.quand),[['m','Masqué'],['d','Démasqué']])}
    <div class="actions" style="margin-top:10px"><button class="btn ghost" data-act="fxcCancel" data-c="${k}">Annuler</button><button class="btn pri" data-act="fxcAdd" data-c="${k}"${fxOkEd(ed)?'':' disabled'}>Ajouter</button></div>
    <div class="hint"><b>Masqué</b> : valable sous les deux formes. <b>Démasqué</b> : seulement en forme démasquée.</div></div>`;}
function fxcAct(a,d){const ctx=fxCtx(d.c);if(!ctx)return;
  if(a==='fxcNew')ctx.fxEd={t:'perm',cible:'',val:'',txt:'',quand:'m'};
  else if(a==='fxcCancel')ctx.fxEd=null;
  else if(a==='fxcT'){ctx.fxEd.t=d.v;ctx.fxEd.cible='';}
  else if(a==='fxcQ')ctx.fxEd.quand=d.v;
  else if(a==='fxcAdd'){const e=ctx.fxEd;if(!e||!fxOkEd(e))return;const f={t:e.t,cible:e.t==='rap'?'':e.cible,val:e.t==='rap'?0:Math.round(+e.val||0),txt:e.t==='perm'?'':(e.txt||'').trim(),quand:fxQ(e.quand)};ctx.fx=[...(ctx.fx||[]),f];ctx.fxEd=null;ctx.dirty=true;}
  else if(a==='fxcDel'){const L=(ctx.fx||[]).slice();L.splice(+d.j,1);ctx.fx=L;ctx.dirty=true;}}
/* ---------- Lot 3 : référentiel des pouvoirs et des capacités naturelles ----------
   Un « élément » = un pouvoir (k='pw', meta/pouvoirs) ou une capacité naturelle (k='cap', meta/capacites).
   Sous-type = variante (champ var des données) : nom + effets propres, qui s'ajoutent aux effets communs. */
const elMap=k=>(k==='pw'?S.pouvoirs:S.capacites)||{};
const elSaveMap=(k,M)=>k==='pw'?savePouvoirs(M):saveCapacites(M);
/* ---------- Usages ---------- */
function pwUses(id){const out=[];for(const cr of raceCres()){const x=raceRec(cr),sl=pwSlots(x);sl.forEach((v,i)=>{if(v===id)out.push({cr,x,i,q:pwPrec(x,i)});});}return out;}
const pwCharsUsing=id=>Object.values(S.chars).filter(c=>(c.pw||[]).some(o=>o.id===id));
/* Usages d'un élément par les races : {cr, nom de la race, vid (sous-type retenu), e (entrée de capacité enregistrée)} */
function elUses(k,id){const out=[];
  if(k==='pw'){for(const u of pwUses(id)){const r=S.races&&S.races[u.cr.id];out.push({cr:u.cr,nom:u.x.sing,vid:(r&&!isLegacyRace(r)&&(r.pwv||[])[u.i])||'',vnom:u.q,i:u.i});}return out;}
  for(const cr of raceCres()){const r=S.races&&S.races[cr.id];if(!r||r.hum||isLegacyRace(r))continue;const nom=raceRec(cr).sing;
    (r.cap||[]).forEach((e,j)=>{if(e&&e.id===id)out.push({cr,nom,vid:e.v||'',e,j});});
    (r.choix||[]).forEach(c=>{if(c[0]==='cap'&&c[1]===id)out.push({cr,nom,vid:c[2]||'',choix:true});});}
  return out;}
const elRaceNames=L=>[...new Set(L.map(u=>u.nom))];
/* Races qui doivent préciser le sous-type et ne l'ont pas fait */
const elMissing=(k,id,el)=>el&&el.prec?elRaceNames(elUses(k,id).filter(u=>!u.choix&&!u.vid&&!u.vnom)):[];
/* Capacités : races dont les effets ou la description diffèrent du catalogue (gardés propres à la race) */
const capDiffs=id=>elUses('cap',id).filter(u=>u.e&&!u.e.keep&&(u.e.fx||u.e.d!=null));
function elVarUses(k,id,vid){const L=elRaceNames(elUses(k,id).filter(u=>u.vid===vid));
  if(k==='pw')for(const c of Object.values(S.chars))if((c.pw||[]).some(o=>o.id===id&&o.v===vid))L.push(c.court);return L;}
/* ---------- Lot 2 bis (24/11/2026) : catalogue dans Univers › Pouvoirs et capacités ----------
   Un élément est visible dès qu'il est révélé pour au moins une race ; seules ces races (et leurs sous-types) sont montrées.
   La gestion hors mode édition voit comme un joueur ; en mode édition, tout le catalogue (non révélé grisé). */
function elUseSeen(k,u){const x=raceRec(u.cr);if(!x)return false;const e=eyeOf(u.cr,x),mine=myRace(x.sing);if(!(e.fiche||mine))return false;
  return k==='pw'?!!(e.pw||[])[u.i]&&!pwUnk(x,u.i):(mine||!!e.cap);}
const elSeenUses=(k,id)=>elUses(k,id).filter(u=>elUseSeen(k,u));
function uniPwSum(){if(!S.pouvoirsReady&&!S.pouvoirs)return 'chargement…';const n=k=>Object.keys(elMap(k)).filter(id=>canEdit()||elSeenUses(k,id).length).length;
  return canEdit()?`${n('pw')} pouvoirs · ${n('cap')} capacités`:`${n('pw')} pouvoirs · ${n('cap')} capacités connus`;}
function viewUniPw(){const k=S.pcat==='cap'?'cap':'pw',pw=k==='pw',E=canEdit();
  let h=`<div class="seg" role="group" aria-label="Catalogue" style="margin-bottom:10px">${[['pw','Pouvoirs'],['cap','Capacités naturelles']].map(([v,l])=>`<button type="button" data-act="pcat" data-v="${v}" aria-pressed="${k===v}">${l}</button>`).join('')}</div>`;
  if(E)return h+viewElCat(k);
  const M=elMap(k),qv=pw?(S.pq||''):(S.cq||''),q=nrm(qv),f=pw?(S.pwf||'all'):'all';
  const L=Object.entries(M).map(([id,el])=>({id,el,u:elSeenUses(k,id)})).filter(r=>r.u.length)
    .filter(r=>(!q||nrm(r.el.nom).includes(q)||r.u.some(u=>nrm(raceNm(raceRec(u.cr))).includes(q)))&&(f==='all'||pwCatK(r.el)===f)).sort((a,b)=>a.el.nom.localeCompare(b.el.nom,'fr'));
  const row=r=>{const el=r.el,meta=[];if(pw){meta.push(CAT_L[pwCatK(el)]);const n=pwNat(r.id);if(n)meta.push(NAT_L[n]);}else if(el.type)meta.push(TYPE_L[el.type]||el.type);
    const races=[...new Set(r.u.map(u=>raceNm(raceRec(u.cr))))];
    return `<div class="lrw">${illOf(k,r.id)?illThumb(k,r.id,36):`<span class="illslot" style="width:36px;height:36px"></span>`}<button class="lrow" data-act="consOpen" data-k="${k}" data-id="${esc(r.id)}"><span class="lm"><span class="lt">${esc(el.nom)}</span><span class="ls">${meta.filter(Boolean).map(esc).join(' · ')}${races.length?' · '+races.map(esc).join(' · '):''}</span></span><span class="chev">›</span></button></div>`;};
  return h+`<div class="card"><h3 class="rs" style="margin-top:0">${pw?'Pouvoirs connus':'Capacités naturelles connues'} <span class="muted small" style="text-transform:none;letter-spacing:0">${Object.keys(M).filter(id=>elSeenUses(k,id).length).length}</span></h3>
    ${pw?`<div class="seg" style="margin-bottom:8px" role="group" aria-label="Catégorie">${[['all','Tous'],['ordinaire','Ordinaires'],['profond','Profonds'],['legendaire','Légendaires']].map(([v,l])=>`<button data-act="elFilt" data-v="${v}" aria-pressed="${f===v}">${l}</button>`).join('')}</div>`:''}
    <input type="search" data-pq="${k}" value="${esc(qv)}" placeholder="${pw?'Rechercher un pouvoir, une race…':'Rechercher une capacité, une race…'}" aria-label="${pw?'Rechercher un pouvoir':'Rechercher une capacité'}" style="width:100%;margin-bottom:6px">
    ${L.map(row).join('')||`<div class="muted small">${q||f!=='all'?'Aucun résultat.':pw?'Aucun pouvoir connu pour l\'instant.':'Aucune capacité connue pour l\'instant.'}</div>`}</div>
    <div class="muted small" style="margin-top:8px">Seuls les ${pw?'pouvoirs':'capacités'} révélé${pw?'s':'es'} pour au moins une race apparaissent, avec ces races seulement.</div>`;}
/* ---------- Catalogue complet (gestion en mode édition, Univers › Pouvoirs et capacités) ---------- */
function viewElCat(k){if(!canEdit())return `<div class="card"><div class="muted">Réservé aux personnes ayant les droits de gestion.</div></div>`;
  const pw=k==='pw',M=elMap(k),qv=pw?(S.pq||''):(S.cq||''),q=nrm(qv),f=pw?(S.pwf||'all'):'all';
  const vf=S.elVis||'all',L=Object.entries(M).map(([id,el])=>({id,el,u:elUses(k,id)})).filter(r=>(!q||nrm(r.el.nom).includes(q))&&(f==='all'||pwCatK(r.el)===f)&&(vf==='all'||(vf==='rev')===!!elSeenUses(k,r.id).length)).sort((a,b)=>a.el.nom.localeCompare(b.el.nom,'fr'));
  const row=r=>{const el=r.el,nv=(el.var||[]).length,nf=(el.fx||[]).length,miss=elMissing(k,r.id,el),races=elRaceNames(r.u),warn=[];
    const meta=[];if(pw){meta.push(CAT_L[pwCatK(el)]);const n=pwNat(r.id);if(n)meta.push(NAT_L[n]);}if(el.type)meta.push(TYPE_L[el.type]||el.type);
    if(nv)meta.push(nv+' sous-type'+(nv>1?'s':''));else if(nf)meta.push(nf+' effet'+(nf>1?'s':''));
    const todo=[];if(pw&&!pwNat(r.id))todo.push('nature');if(!el.type)todo.push('type');if(todo.length)warn.push(todo.join(' et ')+' à compléter');
    if(miss.length)warn.push('sous-type manquant ('+miss.join(', ')+')');
    if(!pw){const dd=capDiffs(r.id);if(dd.length)warn.push('effets différents selon les races ('+elRaceNames(dd).join(', ')+')');}
    const sn=new Set(elSeenUses(k,r.id).map(u=>u.nom)),hid=!sn.size,rl=races.map(n=>sn.has(n)?esc(n):`<s>${esc(n)}</s>`);
    return `<div class="lrw${hid?' prep':''}">${illSlot(k,r.id,el.nom,36)}<button class="lrow" data-act="elEdit" data-k="${k}" data-id="${esc(r.id)}"><span class="lm"><span class="lt">${esc(el.nom)}${sigPicto(pw?'pouvoir':'capacite',r.id)}${hid?' <span class="prepb">non révélé</span>':''}</span><span class="ls">${meta.map(esc).join(' · ')}${races.length?' · '+rl.join(' · '):' · <span class="muted">aucune race</span>'}</span>${warn.length?`<span class="ls" style="color:var(--bad)">${warn.map(esc).join(' · ')}</span>`:''}</span><span class="chev">›</span></button></div>`;};
  return `<div class="card"><h3 class="rs" style="margin-top:0">${pw?'Catalogue des pouvoirs':'Capacités naturelles'} <span class="muted small" style="text-transform:none;letter-spacing:0">${Object.keys(M).length}</span></h3>
    ${pw?`<div class="seg" style="margin-bottom:8px" role="group" aria-label="Catégorie">${[['all','Tous'],['ordinaire','Ordinaires'],['profond','Profonds'],['legendaire','Légendaires']].map(([v,l])=>`<button data-act="elFilt" data-v="${v}" aria-pressed="${f===v}">${l}</button>`).join('')}</div>`:''}
    <div class="seg sm" style="margin-bottom:8px" role="group" aria-label="Visibilité">${[['all','Tous'],['rev','Révélés'],['prep','Non révélés']].map(([v,l])=>`<button data-act="elVis" data-v="${v}" aria-pressed="${vf===v}">${l}</button>`).join('')}</div>
    <input type="search" data-pq="${k}" value="${esc(qv)}" placeholder="${pw?'Rechercher un pouvoir…':'Rechercher une capacité…'}" aria-label="${pw?'Rechercher un pouvoir':'Rechercher une capacité'}" style="width:100%;margin-bottom:6px">
    ${L.map(row).join('')||`<div class="muted small">${pw?'Aucun pouvoir.':'Aucune capacité.'}</div>`}
    <div class="actions" style="margin-top:10px"><button class="btn" data-act="elEdit" data-k="${k}" data-id="">${pw?'+ Nouveau pouvoir':'+ Nouvelle capacité'}</button></div></div>
    <div class="muted small" style="margin-top:8px">${pw?'Chaque ligne montre la catégorie, la nature, le type, les sous-types ou effets, et les races qui utilisent le pouvoir.':'Pas de catégorie ni de nature : une capacité naturelle a seulement un type (actif ou passif).'} Le ⚠ reprend les signalements de Paramètres › Données.</div>`;}
/* ---------- Fiche d'un élément ---------- */
function elDraft(k,id){const el=id?elFull(elMap(k)[id]||{nom:id}):elFull({});
  const g={kind:'elEdit',k,id:id||null,nom:el.nom,desc:el.desc||'',type:el.type||'',prec:!!el.prec,fx:clone(el.fx||[]),fxEd:null,var:(el.var||[]).map(v=>({id:v.id,nom:v.nom,fx:clone(v.fx||[])})),vEd:null,hz:{},err:''};
  for(const f of EL_FIELDS)g[f]=el[f]||'';
  if(k==='pw'){g.cat=id?pwCatK(el):'';g.nat=el.nat||(id?pwNatGuess(id):'');}
  return g;}
function elEditSheet(g){const k=g.k,pw=k==='pw',u=g.id?elUses(k,g.id):[],races=elRaceNames(u),chs=pw&&g.id?pwCharsUsing(g.id):[],arm=S.confirm==='eldel:'+g.id;
  const seg=(f,opts)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-act="elSeg" data-f="${f}" data-v="${v}" aria-pressed="${g[f]===v}">${l}</button>`).join('')}</div>`;
  const req='<span style="color:var(--bad)">*</span>';
  const rules=(pw?EL_FIELDS:EL_FIELDS.filter(f=>f!=='act'));const RL={act:'Activation',cib:'Cible',dur:'Durée',por:'Portée',zon:"Zone d'effet",res:'Résistance'};
  const common=(g.fx||[]);
  let h=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${pw?'Pouvoir':'Capacité naturelle'}"><div class="in"><div class="shd"><h2>${g.id?esc(elMap(k)[g.id]&&elMap(k)[g.id].nom||g.nom):pw?'Nouveau pouvoir':'Nouvelle capacité'}</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>
    ${races.length?`<div class="muted small">${races.map(esc).join(' · ')}</div>`:''}
    <div class="field${elMiss(g,'nom')}"><label for="ele-n">Nom ${req}</label><input id="ele-n" type="text" data-pwe="nom" value="${esc(g.nom)}"></div>
    ${pw?`<div class="field${elMiss(g,'cat')}"><label>Catégorie ${req}</label>${seg('cat',PW_CATS)}</div><div class="field${elMiss(g,'nat')}"><label>Nature ${req}</label>${seg('nat',[['m','Masqué'],['d','Démasqué']])}</div>`:''}
    <div class="field${elMiss(g,'type')}"><label>Type ${req}</label>${seg('type',pw?EL_TYPES:EL_TYPES.filter(t=>t[0]!=='metamorphose'))}</div>
    <div class="field"><label>Illustration <span class="muted small">(facultatif)</span></label>${illEdit(k,g.id,g.nom)}</div>
    <div class="field"><label for="ele-d">Description générale <span class="muted small">(règles comprises, commune à toutes les races)</span></label><textarea id="ele-d" data-pwe="desc" rows="3">${esc(g.desc)}</textarea></div>
    <div class="lab2">Règles <span class="muted small" style="text-transform:none;letter-spacing:0">(facultatives, selon ce qui est utile)</span></div><div class="elrg">${rules.map(f=>`<label><span>${RL[f]}</span><input type="text" data-pwe="${f}" value="${esc(g[f])}" aria-label="${RL[f]}"></label>`).join('')}</div>
    <div class="lab2">Effets communs <span class="muted small" style="text-transform:none;letter-spacing:0">(toutes les races, tous les sous-types)</span></div>${fxBox('dlg',g)}
    <div class="optrow2"><span><b>Sous-type obligatoire</b><br><span class="muted small">chaque race doit préciser son sous-type</span></span><button class="tgb" data-act="elPrec" role="switch" aria-checked="${!!g.prec}" aria-label="Sous-type obligatoire"><span class="tg${g.prec?' on':''}"></span></button></div>
    <div class="lab2">Sous-types · ${g.var.length} <span class="muted small" style="text-transform:none;letter-spacing:0">(nom + effets propres, qui s'ajoutent aux effets communs)</span></div>`;
  g.var.forEach((v,i)=>{if(g.vEd&&g.vEd.i===i){h+=elVarEditor(g);return;}const us=g.id?elVarUses(k,g.id,v.id):[];
    h+=`<div class="elvar"><div class="row2"><b>${esc(v.nom)}</b><button class="lnk" data-act="elVEdit" data-i="${i}">Modifier</button></div>${(v.fx||[]).length?`<div class="fxl">${v.fx.map(e=>fxChip(e)).join('')}</div>`:''}<div class="muted small">Utilisé par : ${us.length?us.map(esc).join(', '):'aucune race'}</div></div>`;});
  if(g.vEd&&g.vEd.i<0)h+=elVarEditor(g);else if(!g.vEd)h+=`<div class="actions" style="margin-top:6px;justify-content:flex-start"><button class="btn ghost" data-act="elVNew">+ Ajouter un sous-type</button></div>`;
  const miss=g.id&&g.prec?elMissing(k,g.id,{prec:true}):[];
  if(miss.length)h+=`<div class="warn2">Sous-type obligatoire manquant : ${miss.map(esc).join(', ')} — à préciser sur leur fiche de race.</div>`;
  if(!pw&&g.id){const dd=capDiffs(g.id);if(dd.length){h+=`<div class="lab2">Effets différents selon les races</div><div class="muted small">Ces races ont gardé leurs propres effets ou leur propre description. Choisis pour chacune :</div>`;
    for(const x of dd){const id=x.cr.id,cur=g.hz[id]||'',vn=x.vid?(g.var.find(v=>v.id===x.vid)||{}).nom:'';
      h+=`<div class="elvar"><div class="row2"><b>${esc(x.nom)}</b><span class="muted small">${vn?'sous-type '+esc(vn):'effets propres'}</span></div>${x.e.fx?`<div class="fxl">${x.e.fx.map(e=>fxChip(e)).join('')||'<span class="muted small">aucun effet</span>'}</div>`:''}${x.e.d!=null?`<div class="small">Description propre : ${esc(x.e.d)}</div>`:''}
        <div class="seg" role="group" aria-label="Harmoniser ${esc(x.nom)}" style="margin-top:6px">${[['al','Aligner'],['ref','Référence'],['gar','Garder']].map(([v,l])=>`<button data-act="elHz" data-r="${esc(id)}" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join('')}</div></div>`;}
    h+=`<div class="muted small">Aligner : la race reprend les effets du catalogue. Référence : ses effets deviennent ceux du catalogue${''} (du sous-type s'il y en a un). Garder : elle garde ses effets propres, et le signalement se ferme.</div>`;}}
  if(races.length>1)h+=`<div class="warn2">Modifie cet élément pour les ${races.length} races qui l'ont. Le sous-type se règle dans chaque fiche de race.</div>`;
  h+=`${g.err?`<div class="pinerr" role="alert">${esc(g.err)}</div>`:''}
    <div class="muted small" style="margin-top:6px">${req} obligatoire : ${pw?'nom, catégorie, nature et type':'nom et type'}.</div>
    <div class="actions" style="margin-top:10px"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="elSave"${g.vEd?' disabled title="Valide d\'abord le sous-type en cours"':''}>Enregistrer</button></div>
    ${g.id?`<div class="danger2"><span>Zone sensible</span>${u.length||chs.length?`<span class="muted small">Suppression impossible : ${pw?'pouvoir':'capacité'} utilisé${pw?'':'e'}</span>`:arm?`<button class="lnk-bad" data-act="elDelOk">Confirmer la suppression</button>`:`<button class="lnk-bad" data-act="elDel">Supprimer ${pw?'le pouvoir':'la capacité'}</button>`}</div>`:''}</div></div>`;
  return h;}
function elVarEditor(g){const v=g.vEd,us=v.i>=0&&g.id?elVarUses(g.k,g.id,g.var[v.i].id):[];
  return `<div class="elvar ed"><div class="field"><label for="elv-n">Nom du sous-type</label><input id="elv-n" type="text" data-pwv="nom" value="${esc(v.nom)}"></div>
    <div class="lab2" style="margin-top:4px">Effets propres <span class="muted small" style="text-transform:none;letter-spacing:0">(s'ajoutent aux effets communs)</span></div>${fxBox('var',v)}
    ${(g.fx||[]).length?`<div class="muted small" style="margin-top:4px">Effets communs rappelés : ${g.fx.map(e=>esc(fxLabel(e))).join(' · ')}</div>`:''}
    ${v.i>=0?`<div class="muted small">Utilisé par : ${us.length?us.map(esc).join(', '):'aucune race'}</div>`:''}
    ${v.err?`<div class="pinerr">${esc(v.err)}</div>`:''}
    <div class="actions" style="margin-top:8px">${v.i>=0?(us.length?`<span class="muted small" style="margin-right:auto">Supprimer : impossible tant qu'il est utilisé</span>`:`<button class="lnk-bad" style="margin-right:auto" data-act="elVDel">Supprimer</button>`):''}<button class="btn ghost" data-act="elVCancel">Annuler</button><button class="btn pri" data-act="elVOk">Valider</button></div></div>`;}
const EL_ACTS=new Set(['elVis','elEdit','elSeg','elPrec','elVNew','elVEdit','elVCancel','elVOk','elVDel','elHz','elSave','elDel','elDelOk','elFilt']);
function elAct(a,d){const g=S.dlg;
  if(a==='elFilt'){S.pwf=d.v;return;}
  if(a==='elVis'){S.elVis=d.v;return;}
  if(a==='elEdit'){S.confirm=null;S.dlg=elDraft(d.k,d.id||null);return;}
  if(!g||g.kind!=='elEdit')return false;
  if(a==='elSeg'){g[d.f]=g[d.f]===d.v&&d.f!=='cat'?'':d.v;g.err='';}
  else if(a==='elPrec')g.prec=!g.prec;
  else if(a==='elVNew')g.vEd={i:-1,nom:'',fx:[],fxEd:null};
  else if(a==='elVEdit'){const v=g.var[+d.i];if(v)g.vEd={i:+d.i,nom:v.nom,fx:clone(v.fx||[]),fxEd:null};}
  else if(a==='elVCancel')g.vEd=null;
  else if(a==='elVOk'){const v=g.vEd,nom=(v.nom||'').trim();if(!nom){v.err='Le nom du sous-type est obligatoire.';return;}
    if(g.var.some((x,i)=>i!==v.i&&nrm(x.nom)===nrm(nom))){v.err='Un autre sous-type porte déjà ce nom.';return;}
    if(v.i>=0){g.var[v.i]={...g.var[v.i],nom,fx:clone(v.fx||[])};}else{const ids={};for(const x of g.var)ids[x.id]=1;g.var.push({id:freeId(ids,'v-'+slugOf(nom)),nom,fx:clone(v.fx||[])});}g.vEd=null;}
  else if(a==='elVDel'){const v=g.vEd;if(!v||v.i<0)return;if(g.id&&elVarUses(g.k,g.id,g.var[v.i].id).length)return;g.var.splice(v.i,1);g.vEd=null;}
  else if(a==='elHz'){g.hz[d.r]=g.hz[d.r]===d.v?'':d.v;}
  else if(a==='elDel')S.confirm='eldel:'+g.id;
  else if(a==='elDelOk'){const id=g.id;if(elUses(g.k,id).length||(g.k==='pw'&&pwCharsUsing(id).length))return;const M={...elMap(g.k)};delete M[id];elSaveMap(g.k,M);S.dlg=null;S.confirm=null;rebuildRaces();}
  else if(a==='elSave'){elSave();return false;}}
function elSave(){const g=S.dlg,k=g.k,pw=k==='pw',nom=(g.nom||'').trim();
  const miss=[],mf=[];if(!nom){miss.push('le nom');mf.push('nom');}if(pw&&!g.cat){miss.push('la catégorie');mf.push('cat');}if(pw&&!g.nat){miss.push('la nature');mf.push('nat');}if(!g.type){miss.push('le type');mf.push('type');}
  g.errF=mf;if(miss.length){g.err='Enregistrement impossible. À compléter : '+miss.join(', ')+'.';refuse();render();return;}
  const M0=elMap(k);if(Object.entries(M0).some(([id,x])=>id!==g.id&&nrm(x.nom)===nrm(nom))){g.err='Enregistrement impossible : '+(pw?'un pouvoir':'une capacité')+' porte déjà ce nom.';g.errF=['nom'];refuse();render();return;}
  let id=g.id;if(!id){id=freeId(M0,(pw?'pw-':'cap-')+slugOf(nom));}
  const old=elFull(M0[id]||{}),oldVar={};for(const v of old.var||[])oldVar[v.id]=v;
  const el={...old,nom,desc:(g.desc||'').trim(),type:g.type,prec:!!g.prec,fx:clone(g.fx||[]),var:g.var.map(v=>({id:v.id,nom:v.nom,desc:(oldVar[v.id]&&oldVar[v.id].desc)||'',fx:clone(v.fx||[])}))};
  for(const f of EL_FIELDS)el[f]=(g[f]||'').trim();
  if(pw){el.cat=g.cat;el.nat=g.nat;}
  const M={...M0,[id]:el};
  /* harmonisation des capacités (choix par race) */
  if(!pw&&g.id){let R=null;const base=elFull(el);
    for(const x of capDiffs(id)){const ch=g.hz[x.cr.id];if(!ch)continue;R=R||clone(S.races);const r=R[x.cr.id],e=r&&(r.cap||[])[x.j];if(!e||e.id!==id)continue;
      if(ch==='gar'){e.keep=true;continue;}
      if(ch==='ref'){if(e.fx){const v=e.v&&base.var.find(z=>z.id===e.v);if(v){const com=fxBare(base.fx);v.fx=fxNorm(e.fx.filter(f=>!com.includes(fxBare([f])[0])));}else base.fx=fxNorm(e.fx);}if(e.d!=null)base.desc=e.d;}
      delete e.fx;delete e.d;delete e.keep;}
    M[id]=base;if(R)saveRaces(R);}
  elSaveMap(k,M);S.dlg=g.back&&g.id?g.back:null;rebuildRaces();render();toast('Enregistré');}
/* ---------- Fiche de personnage : section dépliée sous Féerie ---------- */
function pwRows(c){if(isHum(c))return '';const cr=c.race&&S.creatures.find(x=>raceRec(x).sing===c.race);if(!cr)return '';
  const x=raceRec(cr),sl=pwSlots(x),open=!!(S.pwOpen&&S.pwOpen[c.id]),ed=canEditC(c),G=isGest(),tc=pwToChoose(c);
  let h=`<div class="pwl">`;
  for(let i=0;i<8;i++){const own=(c.pw||[]).find(o=>o.i===i),has=!!own,v=has||pwVisible(cr,x,i);
    const p=sl[i]&&sl[i]!=='?'?pwCat(sl[i]):null,vv=p&&varOf(p,(own&&own.v)||raceVarAt(x,i)),fl=p?[...(p.fx||[]),...((vv&&vv.fx)||[])]:[],fx=fl.length?`<small>${fl.map(e=>esc(fxLabel(e))+(fxQ(e.quand)==='d'?' · démasqué':'')).join(' · ')}</small>`:'';
    let name,right='';
    if(v&&p&&(has||G||!pwUnk(x,i))){name=`${pwLk(x,i,has?own.id:null)}${pwUnk(x,i)&&G?' <i class="muted">(inconnu pour la table)</i>':''}${fx}`;}else if(v&&pwUnk(x,i)){name='<i>Inconnu</i>';}else name='Pouvoir scellé';
    if(has)right=`<span class="okk">✓</span>${canEdit()&&own?(S.confirm==='pwr:'+c.id+':'+i?`<button class="lnk-bad" data-act="pwRemoveOk" data-id="${esc(c.id)}" data-i="${i}">Retirer ?</button>`:`<button class="xs" data-act="pwRemove" data-id="${esc(c.id)}" data-i="${i}" aria-label="Retirer le pouvoir">✕</button>`):''}`;
    else if(v&&p&&ed&&pwSlotOpen(c,i)&&(G||!pwUnk(x,i)))right=`<button class="chs" data-act="pwPick" data-id="${esc(c.id)}" data-i="${i}">Choisir</button>`;
    else if(i>=6&&!palierOk(c,i-6))right=`<span class="wait">palier ${i===6?'Profond':'Légendaire'}</span>`;
    h+=`<div class="pwi${has?' own':''}${v&&p||has?'':' seal'}"><span class="k">${PW_LAB[i]}</span><span class="n">${name}</span>${right}</div>`;}
  return h+`</div>`;}
/* Sous la ligne Féerie (Progression) : liste dépliée au toucher sur « Féerie », avec la correction de niveau */
function pwSection(c){if(isHum(c)||!(S.pwOpen&&S.pwOpen[c.id]))return '';const r=pwRows(c);return r?r+lvlLine(c,'feerie'):'';}
function pwPickSheet(g){const c=S.chars[g.id];if(!c)return null;const x=raceRecOf(c);if(!x)return null;const id=pwSlots(x)[g.i],p=pwCat(id),vv=varOf(p,raceVarAt(x,g.i)),pfx=[...(p.fx||[]),...((vv&&vv.fx)||[])];
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Choisir un pouvoir"><div class="in"><h2>Choisir « ${esc(pwFull(x,g.i))} » ?</h2><div class="muted">Pouvoir ${['masqué','masqué','masqué','masqué','démasqué','démasqué','profond','légendaire'][g.i]}</div>
    ${p.desc?`<div class="lab2">Description</div><div class="small">${esc(p.desc)}</div>`:''}
    ${illOf('pw',id)?`<div style="margin-top:8px">${illThumb('pw',id,64)}</div>`:''}
    ${pfx.length?`<div class="lab2">Effet${pfx.length>1?'s':''}</div><div class="fxl">${pfx.map(e=>fxChip(e)).join('')}</div>`:''}
    <div class="actions" style="margin-top:12px"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pwPickOk">Confirmer</button></div></div></div>`;}
function pwPickOk(){const g=S.dlg,c0=S.chars[g.id];if(!c0||!canEditC(c0)||!pwSlotOpen(c0,g.i))return;const x=raceRecOf(c0),id=pwSlots(x)[g.i];if(!id||id==='?'||(c0.pw||[]).some(o=>o.i===g.i))return;
  const c=clone(c0);c.pw=[...(c.pw||[]),{id,i:g.i,date:today(),v:raceVarAt(x,g.i)}];S.dlg=null;saveChar(c);}

const elMiss=(g,k)=>(g.errF||[]).includes(k)?' miss':'';
/* ---------- Lot 4 bis : fiche de consultation d'un pouvoir ou d'une capacité (lecture seule, la même pour tous) ---------- */
function consSheet(g){const pw=g.t==='pw',el=elFull(elMap(g.t)[g.id]||{});if(!el.nom)return null;
  const RL={act:'Activation',cib:'Cible',dur:'Durée',por:'Portée',zon:"Zone d'effet",res:'Résistance'},rules=(pw?EL_FIELDS:EL_FIELDS.filter(f=>f!=='act')).filter(f=>(el[f]||'').trim());
  const tags=[];if(pw){tags.push(CAT_L[pwCatK(el)]);const n=pwNat(g.id);if(n)tags.push(NAT_L[n]);}else tags.push('Capacité naturelle');if(el.type)tags.push(TYPE_L[el.type]||el.type);
  /* races qui l'utilisent : seulement celles (et les emplacements) que la personne voit */
  const E=canEdit(),uses=elUses(g.t,g.id).map(u=>({...u,seen:elUseSeen(g.t,u)})).filter(u=>E||u.seen);
  const vn=(u)=>{const v=u.vid&&varOf(el,u.vid);return v?v.nom:(u.vnom||'');};
  const where=u=>pw?(PW_LAB[u.i]||'').toLowerCase()+(u.i<6?' '+(u.i<4?u.i+1:u.i-3):''):u.choix?'choix définitif':'';
  const seenVar=new Set(uses.map(u=>u.vid).filter(Boolean));
  const vars=(el.var||[]).filter(v=>E||seenVar.has(v.id)),seenV=new Set(uses.filter(u=>u.seen).map(u=>u.vid).filter(Boolean));
  const fxL=L=>(L||[]).length?`<div class="fxl">${L.map(e=>fxChip(e)).join('')}</div>`:'';
  const nav=S.nav.length&&g.nav;
  let h=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet cons" role="dialog" aria-modal="true" aria-label="${esc(el.nom)}"><div class="in">
    ${nav?`<div style="margin-bottom:6px"><button type="button" class="navback" data-act="navBack"><span aria-hidden="true">‹</span> Retour</button></div>`:''}
    <div class="shd"><h2 class="rhd" style="margin:0"><span>${esc(el.nom)}</span></h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>
    ${illOf(pw?'pw':'cap',g.id)?`<div class="fibigw">${bigImg(illId(pw?'pw':'cap',g.id),illOf(pw?'pw':'cap',g.id),el.nom)}</div>`:''}
    <div class="tg3">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>
    ${el.desc?`<div class="small" style="white-space:pre-line">${esc(el.desc)}</div>`:''}
    ${rules.length?`<div class="rg2">${rules.map(f=>`<div><small>${RL[f]}</small>${esc(el[f])}</div>`).join('')}</div>`:''}
    ${(el.fx||[]).length?`<div class="lab2">Effets${vars.length?' communs':''}</div>${fxL(el.fx)}`:''}
    ${vars.length?`<div class="lab2">Sous-types</div>${vars.map(v=>`<div class="fi${E&&!seenV.has(v.id)?' prep':''}"><b>${esc(v.nom)}</b>${E&&!seenV.has(v.id)?' <span class="prepb">non révélé</span>':''}${fxL(v.fx)}</div>`).join('')}`:''}
    <div class="lab2">Races qui ${pw?'l\'utilisent':'la possèdent'}</div>${uses.length?uses.map(u=>`<div class="lkr${u.seen?'':' prep'}"><span>${lk({t:'race',id:u.cr.id},raceNm(raceRec(u.cr)))}${vn(u)?' <span class="muted">('+esc(vn(u))+')</span>':''}</span><span class="muted small">${u.seen?'':'<span class="prepb">non révélé</span> '}${esc(where(u))}</span></div>`).join(''):'<div class="muted small">Aucune race connue.</div>'}
    <div class="actions" style="margin-top:12px">${canEdit()?`<button class="btn" data-act="consEdit">${ICON.crayon} Modifier</button>`:''}<button class="btn pri" data-act="closeSheet">Fermer</button></div></div></div>`;
  return h;}
