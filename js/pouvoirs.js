/* La belle appli — Pouvoirs : catalogue (Paramètres › Pouvoirs), description et effets communs, choix des pouvoirs sur la fiche */
/* ---------- Éditeur d'effets générique (catalogue, emplacement de pouvoir d'une fiche de race) ---------- */
function fxCtx(k){if(k==='dlg')return S.dlg;if(k&&k.startsWith('pw:')&&S.rf&&S.rf.pwx)return S.rf.pwx[+k.slice(3)];return null;}
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
/* ---------- Usages d'un pouvoir ---------- */
function pwUses(id){const out=[];for(const cr of raceCres()){const x=raceRec(cr),sl=pwSlots(x);sl.forEach((v,i)=>{if(v===id)out.push({cr,x,i,q:pwPrec(x,i)});});}return out;}
const pwCharsUsing=id=>Object.values(S.chars).filter(c=>(c.pw||[]).some(o=>o.id===id));
/* ---------- Paramètres › Pouvoirs ---------- */
function viewPwCat(){if(!isGest())return `<div class="card"><div class="muted">Réservé aux personnes ayant les droits de gestion.</div></div>`;
  const q=nrm(S.pq||''),L=Object.entries(S.pouvoirs||{}).map(([id,p])=>({id,p,u:pwUses(id)})).filter(r=>!q||nrm(r.p.nom).includes(q)).sort((a,b)=>a.p.nom.localeCompare(b.p.nom,'fr'));
  return `<div class="card"><h3 class="rs" style="margin-top:0">Catalogue des pouvoirs <span class="muted small" style="text-transform:none;letter-spacing:0">${Object.keys(S.pouvoirs||{}).length}</span></h3>
    <input type="search" data-pq="1" value="${esc(S.pq||'')}" placeholder="Rechercher un pouvoir…" aria-label="Rechercher un pouvoir" style="width:100%;margin-bottom:6px">
    ${L.map(r=>`<button class="lrow" data-act="pwEdit" data-id="${esc(r.id)}"><span class="lm"><span class="lt">${esc(r.p.nom)}${sigPicto('pouvoir',r.id)}</span><span class="ls">${r.u.length?r.u.map(u=>esc(u.x.sing)+(u.q?' ('+esc(u.q)+')':'')).join(' · '):'<span class="muted">aucune race (inutilisé)</span>'}${(r.p.fx||[]).length?' · '+r.p.fx.length+' effet'+(r.p.fx.length>1?'s':''):''}${r.p.desc?'':' · <span style="color:var(--bad)">description à compléter</span>'}</span></span><span class="chev">›</span></button>`).join('')||'<div class="muted small">Aucun pouvoir.</div>'}
    <div class="actions" style="margin-top:10px"><button class="btn" data-act="pwEdit" data-id="">+ Nouveau pouvoir</button></div></div>`;}
function pwEditSheet(g){const u=g.id?pwUses(g.id):[],chs=g.id?pwCharsUsing(g.id):[],arm=S.confirm==='pwdel:'+g.id;
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Pouvoir"><div class="in"><div class="shd"><h2>${g.id?esc(pwCat(g.id).nom):'Nouveau pouvoir'}</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>
    ${u.length?`<div class="muted small">${u.map(x=>esc(x.x.sing)+(x.q?' ('+esc(x.q)+')':'')).join(' · ')}</div>`:''}
    <div class="field"><label for="pwe-n">Nom</label><input id="pwe-n" type="text" data-pwe="nom" value="${esc(g.nom)}"></div>
    <div class="field"><label for="pwe-d">Description (commune à toutes les races)</label><textarea id="pwe-d" data-pwe="desc" rows="3">${esc(g.desc)}</textarea></div>
    <div class="lab2">Effets</div>${fxBox('dlg',g)}
    ${u.length>1?`<div class="warn2">Modifie ce pouvoir pour les ${u.length} races qui l'ont. La précision (animale, végétale…) se règle dans chaque fiche de race.</div>`:''}
    ${g.err?`<div class="pinerr">${esc(g.err)}</div>`:''}
    <div class="actions" style="margin-top:10px"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pwSave">Enregistrer</button></div>
    ${g.id?`<div class="danger2"><span>Zone sensible</span>${u.length||chs.length?`<span class="muted small">Suppression impossible : pouvoir utilisé</span>`:arm?`<button class="lnk-bad" data-act="pwDelOk">Confirmer la suppression</button>`:`<button class="lnk-bad" data-act="pwDel">Supprimer le pouvoir</button>`}</div>`:''}</div></div>`;}
function pwSave(){const g=S.dlg,nom=(g.nom||'').trim();if(!nom){g.err='Le nom est obligatoire.';render();return;}
  const dup=Object.entries(S.pouvoirs||{}).find(([id,p])=>id!==g.id&&nrm(p.nom)===nrm(nom));if(dup){g.err='Un pouvoir porte déjà ce nom.';render();return;}
  let id=g.id;if(!id){id='pw-'+(nrm(nom).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x');while(S.pouvoirs[id])id+='-'+Math.random().toString(36).slice(2,5);}
  savePouvoirs({...S.pouvoirs,[id]:{...(S.pouvoirs[id]||{}),nom,desc:(g.desc||'').trim(),fx:clone(g.fx||[])}});S.dlg=null;rebuildRaces();render();}
/* ---------- Fiche de personnage : section dépliée sous Féerie ---------- */
function pwRows(c){if(isHum(c))return '';const cr=c.race&&S.creatures.find(x=>raceRec(x).sing===c.race);if(!cr)return '';
  const x=raceRec(cr),sl=pwSlots(x),open=!!(S.pwOpen&&S.pwOpen[c.id]),ed=canEditC(c),G=isGest(),tc=pwToChoose(c);
  let h=`<div class="pwl">`;
  for(let i=0;i<8;i++){const own=(c.pw||[]).find(o=>o.i===i),has=!!own,v=has||pwVisible(cr,x,i);
    const p=sl[i]&&sl[i]!=='?'?pwCat(sl[i]):null,fx=p&&(p.fx||[]).length?`<small>${p.fx.map(e=>esc(fxLabel(e))+(fxQ(e.quand)==='d'?' · démasqué':'')).join(' · ')}</small>`:'';
    let name,right='';
    if(v&&p&&(has||G||!pwUnk(x,i))){name=`${esc(pwFull(x,i))}${pwUnk(x,i)&&G?' <i class="muted">(inconnu pour la table)</i>':''}${fx}`;}else if(v&&pwUnk(x,i)){name='<i>Inconnu</i>';}else name='Pouvoir scellé';
    if(has)right=`<span class="okk">✓</span>${G&&own?(S.confirm==='pwr:'+c.id+':'+i?`<button class="lnk-bad" data-act="pwRemoveOk" data-id="${esc(c.id)}" data-i="${i}">Retirer ?</button>`:`<button class="xs" data-act="pwRemove" data-id="${esc(c.id)}" data-i="${i}" aria-label="Retirer le pouvoir">✕</button>`):''}`;
    else if(v&&p&&ed&&pwSlotOpen(c,i)&&(G||!pwUnk(x,i)))right=`<button class="chs" data-act="pwPick" data-id="${esc(c.id)}" data-i="${i}">Choisir</button>`;
    else if(i>=6&&!palierOk(c,i-6))right=`<span class="wait">palier ${i===6?'Profond':'Légendaire'}</span>`;
    h+=`<div class="pwi${has?' own':''}${v&&p||has?'':' seal'}"><span class="k">${PW_LAB[i]}</span><span class="n">${name}</span>${right}</div>`;}
  return h+`</div>`;}
/* Sous la ligne Féerie (Progression) : liste dépliée au toucher sur « Féerie », avec la correction de niveau */
function pwSection(c){if(isHum(c)||!(S.pwOpen&&S.pwOpen[c.id]))return '';const r=pwRows(c);return r?r+lvlLine(c,'feerie'):'';}
function pwPickSheet(g){const c=S.chars[g.id];if(!c)return null;const x=raceRecOf(c);if(!x)return null;const id=pwSlots(x)[g.i],p=pwCat(id);
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Choisir un pouvoir"><div class="in"><h2>Choisir « ${esc(pwFull(x,g.i))} » ?</h2><div class="muted">Pouvoir ${['masqué','masqué','masqué','masqué','démasqué','démasqué','profond','légendaire'][g.i]}</div>
    ${p.desc?`<div class="lab2">Description</div><div class="small">${esc(p.desc)}</div>`:''}
    ${(p.fx||[]).length?`<div class="lab2">Effet${p.fx.length>1?'s':''}</div><div class="fxl">${p.fx.map(e=>fxChip(e)).join('')}</div>`:''}
    <div class="actions" style="margin-top:12px"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pwPickOk">Confirmer</button></div></div></div>`;}
function pwPickOk(){const g=S.dlg,c0=S.chars[g.id];if(!c0||!canEditC(c0)||!pwSlotOpen(c0,g.i))return;const x=raceRecOf(c0),id=pwSlots(x)[g.i];if(!id||id==='?'||(c0.pw||[]).some(o=>o.i===g.i))return;
  const c=clone(c0);c.pw=[...(c.pw||[]),{id,i:g.i,date:today(),v:raceVarAt(x,g.i)}];S.dlg=null;saveChar(c);}
