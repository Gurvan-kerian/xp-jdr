/* Lot 7 — Fief géré (27/11/2026). Préfixe fg.
   Fiche Lieu de type Fief : onglet Gestion (traits, caractéristiques, population et territoire, ressources, historique),
   XP du fief (reçue : transferts et contributions des PJ, sessions de nature « Fief » ; dépensée : achats, dépenses antérieures),
   achats avec contributions des PJ, saisie libre en mode édition, règles et réglages dans Règles › Gestion de fief.
   Données : fiche.gest = {car:{sou,org,inf,fee}, pop, taille, eco, traits:[], res:[{id,nom,av,fx}], hist:[{id,date,t:'achat'|'ant',lab,cout,k,from,to,rid,par}]} ;
   achat du PJ key 'autre:Domaine' + fief (+ grp = ligne d'achat du fief pour une contribution) ; entrée de session {perso:'fief:<id>', nature:'Fief'} ;
   réglages meta/fiefs → S.fgCfg. Détail : claude/spec-lot7-fief.md */
const FG_CAR=[['sou','Souveraineté','Imposer, contraindre, forcer'],['org','Organisation','Réseaux, information, logistique'],['inf','Influence','Relations, cercles sociaux'],['fee','Féerie','Ressources magiques exploitées']];
const FG_DEF={cc:4,cr:16,max:10,nt:2,
  tailles:[['Manoir / Domaine',0],['Village',0],['Petite ville',1],['Ville',2],['Grande ville',3],['Région',4],['Territoire majeur',5]].map(([n,m])=>({n,m})),
  etats:[['Très déficitaire',-2],['Fragile',-1],['Équilibre',0],['Prospère',1],['Florissant',2]].map(([n,m])=>({n,m})),
  pop:[['0 à 2',-1],['3 à 5',-1],['6 à 9',-1],['10 à 14',0],['15 à 25',0],['26 à 60',1],['61 à 150',1],['151 à 400',2],['401 à 1 000',2],['1 001 à 3 000',3],['plus de 3 000',3]].map(([n,m])=>({n,m}))};
function fgCfg(){const x=S.fgCfg||{},o=clone(FG_DEF);for(const k of ['cc','cr','max','nt'])if(x[k]!=null&&x[k]!==''&&!isNaN(+x[k]))o[k]=+x[k];
  for(const k of ['tailles','etats','pop'])if(Array.isArray(x[k])&&x[k].length)o[k]=clone(x[k]);return o;}
const fgSg=m=>{m=+m||0;return m>0?'+'+m:m<0?'−'+(-m):'0';};
const fgMod=(L,n)=>{const x=L.find(y=>y.n===n);return x?+x.m||0:null;};
/* Détenteurs PJ, fiefs gérés, fiefs d'un PJ, fief par défaut d'un ancien transfert */
const fgHolders=fid=>Object.values(S.chars||{}).filter(c=>c.type==='PJ'&&((c.situ||{}).fiefs||[]).some(e=>e.f===fid));
const fgFiefs=()=>fiAll().filter(f=>fiIsFief(f)&&fgHolders(f.id).length).sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
const fgFiefsOf=c=>[...new Set(((c&&c.situ||{}).fiefs||[]).map(e=>e.f).filter(f=>f&&S.fiches[f]&&fiIsFief(S.fiches[f])))];
function fgDefOf(c){const L=fgFiefsOf(c);if(L.length===1)return L[0];if(!L.length){const A=fgFiefs();if(A.length===1)return A[0].id;}return null;}
const fgG=f=>{const g=(f&&f.gest)||{};return {car:{sou:0,org:0,inf:0,fee:0,...(g.car||{})},pop:+g.pop||0,taille:g.taille||'',eco:g.eco||'',traits:(g.traits||[]).filter(t=>(t||'').trim()),res:g.res||[],hist:g.hist||[]};};
/* XP du fief */
function fgXp(fid){const rec=[],dep=[];
  for(const c of Object.values(S.chars||{}))if(c.type==='PJ')for(const a of c.achats||[])if(a.key==='autre:Domaine'&&(a.fief||fgDefOf(c))===fid)rec.push({date:a.date||'',lab:(a.grp?'Contribution · ':'Transfert · ')+(c.court||c.nom),m:+a.cout||0});
  for(const e of S.events||[])for(const en of e.entries||[])if(en.perso==='fief:'+fid&&en.montant)rec.push({date:e.date||'',lab:'Session · '+(e.titre||''),m:+en.montant||0});
  for(const h of fgG(S.fiches[fid]).hist)dep.push({date:h.date||'',lab:h.lab,m:+h.cout||0,h});
  const r=rec.reduce((s,x)=>s+x.m,0),d=dep.reduce((s,x)=>s+x.m,0);return {rec,dep,recu:r,depense:d,solde:r-d};}
/* Droits : achats par les joueurs des PJ détenteurs et la gestion ; contributions : les PJ que l'on peut modifier */
const fgCan=f=>!!f&&isUser()&&fiSee(f); /* UX1 : achats du fief ouverts à tout joueur qui voit le fief */
const fgCtbs=fid=>fgHolders(fid).filter(c=>actif(c)&&vis(c)&&!S.visit&&(isGest()||owners(c).some(p=>p.id===ME))).sort((a,b)=>(a.court||'').localeCompare(b.court||'','fr'));
const fgNm=c=>c.court||c.nom||c.id;

/* ---------- Onglet Gestion ---------- */
function fgView(f){const g=fgG(f),C=fgCfg(),X=fgXp(f.id),can=fgCan(f),E=canEdit(),Hd=fgHolders(f.id),fid=esc(f.id),Hp=S.xpHelp||{};
  const q=(k)=>`<button type="button" class="qbtn" data-act="xpHelp" data-k="${k}" aria-label="Aide">?</button>`,tip=(k,t)=>Hp[k]?`<div class="qtip2">${t}</div>`:'';
  /* UX1 (28/11/2026) : bandeau, sections repliables au modèle du Progrès */
  let h=`<div class="fgban"><div class="fgsol"><b class="num">${X.solde}</b><small>XP du fief</small></div><div class="cmain small"><div>${X.recu} reçus · ${X.depense} dépensés</div><div class="muted">Détenu par ${Hd.map(c=>lk({t:'perso',id:c.id},fgNm(c))).join(', ')}</div></div>${q('fgxp')}</div>`+tip('fgxp',`L'XP du fief vient des sessions (nature « Fief ») et des transferts des PJ. Un achat se paie d'abord sur l'XP du fief, puis par les PJ liés au fief.`);
  if(E)h+=`<div class="blkhd" style="justify-content:flex-end;margin:0 0 6px"><button type="button" class="ibtn sm" data-act="fgEd" data-fid="${fid}" aria-label="Modifier la gestion">${ICON.crayon}</button></div>`;
  const L1=[],L2=[];
  L1.push(cBlk('fg-tr','Traits',String(g.traits.length),(g.traits.length?`<div class="fgtr">${g.traits.map(t=>`<span class="fgtrait">${esc(t)}</span>`).join('')}</div>`:'<span class="muted small">Aucun trait.</span>')+`<div class="blkhd" style="justify-content:flex-end">${q('fgtr')}</div>`+tip('fgtr','+1 au test quand le trait est pertinent.')));
  L1.push(cBlk('fg-car','Caractéristiques','',FG_CAR.map(([k,nom,ds])=>{const v=+g.car[k]||0,atMax=v>=C.max,cost=(v+1)*C.cc,ok=can&&!atMax;
    return `<div class="irow fgrow${atMax?' max':ok?' can':''}"><div class="rmain"><span class="nm">${nom}</span>${bar(v,C.max)}<span class="lv">${v}<small>/${C.max}</small></span></div><button type="button" class="ibtn sm" data-act="xpHelp" data-k="fgc-${k}" aria-label="Description de ${nom}">?</button>${atMax?'<span class="pill plan">★ max</span>':`<button class="plus${ok?' ok':''}" data-act="fgBuy" data-fid="${fid}" data-k="car:${k}"${ok?'':' disabled'} aria-label="Monter ${nom} à ${v+1} pour ${cost} XP">+<small>${cost}</small></button>`}</div>${Hp['fgc-'+k]?`<div class="qtip2">${ds}</div>`:''}`;}).join('')+`<div class="muted small" style="margin-top:6px">Coût : nouveau score × ${C.cc} XP.</div>`));
  const p=Math.max(0,Math.min(g.pop,C.pop.length-1)),pp=C.pop[p]||{n:'',m:0},mt=fgMod(C.tailles,g.taille),me=fgMod(C.etats,g.eco);
  const row=(l,v,m)=>v?`<div class="xprow"><span class="cmain">${l}</span><span>${esc(v)}</span>${m!=null?`<span class="pill">${fgSg(m)}</span>`:''}</div>`:'';
  L1.push(cBlk('fg-pop','Population et territoire','',`<div class="irow fgrow"><div class="rmain"><span class="nm">Population<span class="nsub">${esc(pp.n)} · ${fgSg(pp.m)}</span></span>${bar(g.pop,C.max)}<span class="lv">${g.pop}<small>/${C.max}</small></span></div><span></span><span></span></div>`+row('Taille',g.taille,mt)+row('État économique',g.eco,me)));
  const RO=S.fgRo||{};
  L2.push(cBlk('fg-res','Ressources',String(g.res.length),(g.res.map(r=>{const o=!!RO[r.id];return `<div class="fgres"><div class="fgresh"><button type="button" class="lnk fgrt" data-act="fgRo" data-rid="${esc(r.id)}" aria-expanded="${o}">${esc(r.nom)} ${o?'⌄':'›'}</button>${E&&o?`<button type="button" class="ibtn sm" data-act="fgRes" data-fid="${fid}" data-rid="${esc(r.id)}" aria-label="Modifier ${esc(r.nom)}">${ICON.crayon}</button>`:''}</div>${o&&r.av?`<div class="small">${esc(r.av)}</div>`:''}${o&&r.fx?`<div class="small fgfx">Effet : ${esc(r.fx)}</div>`:''}</div>`;}).join('')||'<div class="muted small">Aucune ressource.</div>')+
    `<div class="xprow" style="margin-top:6px"><span class="cmain">Nouvelle ressource : ${C.cr} XP</span>${can?`<button class="pbtn" data-act="fgBuy" data-fid="${fid}" data-k="res" aria-label="Créer une ressource pour ${C.cr} XP">+</button>`:''}</div>${E?`<button class="lnk" data-act="fgRes" data-fid="${fid}">Ajouter sans XP</button>`:''}`));
  const Lh=[...X.rec.map(x=>({...x,s:1})),...X.dep.map(x=>({...x,s:-1}))].sort((a,b)=>(b.date||'').localeCompare(a.date||'')),all=!!(S.fgAll&&S.fgAll[f.id]),sh=all?Lh:Lh.slice(0,5);
  const last=[...g.hist].reverse().find(x=>x.t==='achat'),lastIs=x=>last&&x.h&&x.h.id===last.id&&g.hist[g.hist.length-1].id===last.id;
  L2.push(cBlk('fg-hist','Historique',String(Lh.length),(sh.map(x=>`<div class="ev"><div style="min-width:0"><div class="t">${esc(x.lab)}</div><div class="muted small">${x.date?fmtDate(x.date):'sans date'}</div></div><span style="display:flex;gap:6px;align-items:center;flex:none">${can&&lastIs(x)?`<button class="btn ghost" style="padding:4px 10px" data-act="fgUndo" data-fid="${fid}">Annuler</button>`:''}<span class="pill${x.s>0?' fgin':''}">${x.s>0?'+':'−'}${x.m} XP</span></span></div>`).join('')||'<div class="muted small">Aucun mouvement.</div>')+
    (Lh.length>5?`<div class="actions"><button class="btn" data-act="fgAll" data-fid="${fid}">${all?'Réduire':'Tout afficher ('+Lh.length+')'}</button></div>`:'')));
  return h+`<div class="pg2col"><div>${L1.join('')}</div><div>${L2.join('')}</div></div>`;}

/* ---------- Achat : caractéristique ou ressource, contributions des PJ ---------- */
function fgBuySt(g){const f=S.fiches[g.fid],G=fgG(f),C=fgCfg(),X=fgXp(g.fid);let cost,lab,from;
  if(g.k==='res'){cost=C.cr;lab='Créer une ressource';}else{const k=g.k.slice(4),c=FG_CAR.find(x=>x[0]===k);from=+G.car[k]||0;cost=(from+1)*C.cc;lab=`Monter ${c?c[1]:k}`;}
  const fromF=Math.max(0,Math.min(X.solde,cost)),need=cost-fromF;let sum=0,err='';
  for(const c of fgCtbs(g.fid)){const v=Math.floor(+((g.ctb||{})[c.id])||0);if(v<0){err='Montant négatif.';continue;}if(v>summary(c,S.events).dispo)err=`${fgNm(c)} n'a pas assez d'XP disponible.`;sum+=v;}
  if(!err&&sum!==need)err=sum<need?`Il manque ${need-sum} XP.`:`${sum-need} XP de trop.`;
  if(!err&&g.k==='res'&&!(g.nom||'').trim())err='Donne un nom à la ressource.';
  if(!err&&g.k!=='res'&&from>=C.max)err='Score maximum atteint.';
  return {cost,lab,from,fromF,need,sum,err,ok:!err};}
function fgBuyOk(g){const f=S.fiches[g.fid];if(!fgCan(f))return;const st=fgBuySt(g);if(!st.ok)return;
  const n=clone(f),G=n.gest=n.gest||{},hid=uid('fh'),d=today();G.hist=G.hist||[];
  for(const c of fgCtbs(f.id)){const v=Math.floor(+((g.ctb||{})[c.id])||0);if(v<=0)continue;const x=clone(S.chars[c.id]);x.achats=x.achats||[];
    x.achats.push({id:'a'+Date.now().toString(36)+Math.floor(Math.random()*1e3),date:d,label:'Dépense · Fief (contribution)',cout:v,key:'autre:Domaine',dom:true,fief:f.id,grp:hid});saveChar(x);}
  if(g.k==='res'){const rid=uid('fr');G.res=[...(G.res||[]),{id:rid,nom:g.nom.trim(),av:(g.av||'').trim(),fx:(g.fx||'').trim()}];G.hist.push({id:hid,date:d,t:'achat',k:'res',rid,lab:'Ressource · '+g.nom.trim(),cout:st.cost,par:ME||''});}
  else{const k=g.k.slice(4),c=FG_CAR.find(x=>x[0]===k);G.car={...fgG(f).car,...(G.car||{}),[k]:st.from+1};G.hist.push({id:hid,date:d,t:'achat',k:g.k,from:st.from,to:st.from+1,lab:`${c[1]} ${st.from} → ${st.from+1}`,cout:st.cost,par:ME||''});}
  S.dlg=null;fiSave(n);}
function fgUndoOk(fid){const f=S.fiches[fid];if(!fgCan(f))return;const n=clone(f),G=n.gest||{},H=G.hist||[],l=H[H.length-1];if(!l||l.t!=='achat')return;
  if(l.k==='res')G.res=(G.res||[]).filter(r=>r.id!==l.rid);else if(l.k&&l.k.startsWith('car:'))G.car={...(G.car||{}),[l.k.slice(4)]:l.from};
  G.hist=H.slice(0,-1);
  for(const c of Object.values(S.chars))if((c.achats||[]).some(a=>a.grp===l.id)){const x=clone(c);x.achats=x.achats.filter(a=>a.grp!==l.id);saveChar(x);}
  S.dlg=null;fiSave(n);}

/* ---------- Fenêtres ---------- */
function fgSheet(g){const f=S.fiches[g.fid];if(!f||!fiIsFief(f))return null;const C=fgCfg(),G=fgG(f);
  const inp=(id,k,v,lab,o)=>`<div class="field"${o&&o.w?` style="${o.w}"`:''}><label for="${id}">${lab}</label><input id="${id}" type="${o&&o.num?'number':'text'}"${o&&o.num?' inputmode="numeric" min="0"':''} data-fgi="${k}" value="${esc(v==null?'':String(v))}" autocomplete="off"></div>`;
  if(g.kind==='fgBuy'){if(!fgCan(f))return null;const st=fgBuySt(g),X=fgXp(f.id),L=fgCtbs(f.id);
    const sub=g.k==='res'?`${esc(f.nom)} · ${st.cost} XP`:`${esc(st.lab.replace(/^Monter /,''))} ${st.from} → ${st.from+1} · ${st.cost} XP (${st.from+1} × ${C.cc})`;
    return fiShell(g,st.lab,`<div><h2>${st.lab}</h2><div class="muted small">${sub}</div></div>
      ${g.k==='res'?inp('fgRn','nom',g.nom,'Nom')+inp('fgRa','av',g.av,'Avantage')+inp('fgRf','fx',g.fx,'Effet'):''}
      <div class="calc"><span>Coût</span><b>${st.cost} XP</b><span>Pris sur l'XP du fief (solde ${X.solde})</span><b>${st.fromF} XP</b></div>
      ${st.need?`<div class="fimg">Contributions des PJ · sur leur XP</div>${L.map(c=>`<div class="frow" style="align-items:center"><label for="fgc-${esc(c.id)}" style="flex:1"><b>${esc(fgNm(c))}</b> <span class="muted small">· ${summary(c,S.events).dispo} XP disponibles</span></label><input id="fgc-${esc(c.id)}" type="number" inputmode="numeric" min="0" data-fgc="${esc(c.id)}" value="${esc(String((g.ctb||{})[c.id]||''))}" style="width:90px" autocomplete="off"></div>`).join('')||'<div class="muted small">Aucun PJ lié au fief ne peut contribuer.</div>'}`:''}
      <div class="xpbox" id="fgTot">${fgTotTxt(st)}</div>
      ${st.need?'<div class="muted small">Chaque contribution s\'inscrit dans l\'historique du PJ (« Fief ») et dans celui du fief.</div>':''}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fgBuyOk"${st.ok?'':' disabled'}>Acheter</button></div>`);}
  if(g.kind==='fgUndo'){if(!fgCan(f))return null;const l=G.hist[G.hist.length-1];if(!l||l.t!=='achat')return null;const n=Object.values(S.chars).reduce((s,c)=>s+(c.achats||[]).filter(a=>a.grp===l.id).length,0);
    return fiShell(g,'Annuler un achat',`<div><h2>Annuler l'achat</h2><div class="muted small">${esc(f.nom)}</div></div><div>${esc(l.lab)} · ${l.cout} XP${l.date?' du '+fmtDate(l.date):''}.</div><div class="muted small">${l.k==='res'?'La ressource est retirée':'La caractéristique revient à '+l.from}${n?` ; les ${n} contribution${n>1?'s':''} des PJ ${n>1?'sont rendues':'est rendue'}`:''}.</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Fermer</button><button class="btn pri" data-act="fgUndoOk">Annuler l'achat</button></div>`);}
  if(g.kind==='fgEd'){if(!canEdit())return null;
    return fiShell(g,'Modifier la gestion',`<div><h2>Modifier la gestion</h2><div class="muted small">${esc(f.nom)} · mode édition · saisie libre, sans XP</div></div>
      <div class="fimg">Caractéristiques et population (0 à ${C.max})</div>
      <div class="fggrid">${FG_CAR.map(([k,nom])=>inp('fge-'+k,'car_'+k,g['car_'+k],nom,{num:1})).join('')}${inp('fge-pop','pop',g.pop,'Population féerique',{num:1})}</div>
      <div class="fggrid"><div class="field"><label for="fge-t">Taille</label><select id="fge-t" data-fgi="taille"><option value="">—</option>${C.tailles.map(x=>`<option value="${esc(x.n)}"${x.n===g.taille?' selected':''}>${esc(x.n)} (${fgSg(x.m)})</option>`).join('')}</select></div>
      <div class="field"><label for="fge-e">État économique</label><select id="fge-e" data-fgi="eco"><option value="">—</option>${C.etats.map(x=>`<option value="${esc(x.n)}"${x.n===g.eco?' selected':''}>${esc(x.n)} (${fgSg(x.m)})</option>`).join('')}</select></div></div>
      <div class="fimg">Traits</div><div class="fggrid">${Array.from({length:Math.max(C.nt,(g.traits||[]).length)},(_,i)=>`<div class="field"><label for="fge-tr${i}">Trait ${i+1}</label><input id="fge-tr${i}" type="text" data-fgt="${i}" value="${esc((g.traits||[])[i]||'')}" autocomplete="off"></div>`).join('')}</div>
      <div class="muted small" id="fgEdErr">${esc(fgEdErr(g,C)||'')}</div>
      <div class="muted small">Les ressources se modifient avec ✎ dans l'onglet Gestion. Les achats en jeu passent par « + ».</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fgEdOk">Enregistrer</button></div>`);}
  if(g.kind==='fgRes'){if(!canEdit())return null;
    return fiShell(g,'Ressource',`<div><h2>${g.rid?'Modifier la ressource':'Nouvelle ressource'}</h2><div class="muted small">${esc(f.nom)} · sans XP</div></div>
      ${inp('fgRn','nom',g.nom,'Nom')}${inp('fgRa','av',g.av,'Avantage')}${inp('fgRf','fx',g.fx,'Effet')}
      <div class="actions">${g.rid?`<button class="btn ghost" data-act="fgResDel">${g.del?'Confirmer la suppression':'Supprimer'}</button>`:''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fgResOk">Enregistrer</button></div>`);}
  return null;}
const fgTotTxt=st=>`${st.fromF+st.sum} / ${st.cost} XP ${st.ok?'✓':'· '+st.err}`; /* UX1 */
function fgEdErr(g,C){for(const k of [...FG_CAR.map(x=>'car_'+x[0]),'pop']){const v=String(g[k]??'').trim();if(v===''||isNaN(+v)||+v<0||+v>C.max||Math.floor(+v)!==+v)return `Les scores vont de 0 à ${C.max}.`;}return '';}
['fgBuy','fgUndo','fgEd','fgRes'].forEach(k=>FI_DLG.add(k));
document.addEventListener('input',ev=>{const t=ev.target;if(!t||!t.dataset||!S.dlg||!/^fg[A-Z]/.test(S.dlg.kind||''))return;const g=S.dlg;
  if(t.dataset.fgi!==undefined)g[t.dataset.fgi]=t.value;else if(t.dataset.fgc!==undefined){g.ctb={...(g.ctb||{}),[t.dataset.fgc]:t.value};}else if(t.dataset.fgt!==undefined){g.traits=[...(g.traits||[])];g.traits[+t.dataset.fgt]=t.value;}else return;
  if(g.kind==='fgBuy'){const st=fgBuySt(g),e=document.getElementById('fgTot'),b=document.querySelector('#sheetRoot [data-act="fgBuyOk"]');if(e)e.textContent=fgTotTxt(st);if(b)b.disabled=!st.ok;}
  if(g.kind==='fgEd'){const e=document.getElementById('fgEdErr');if(e)e.textContent=fgEdErr(g,fgCfg());}});
document.addEventListener('change',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.dfi!==undefined&&S.dlg&&S.dlg.kind==='a'){S.dlg.fief=t.value;S._force=true;render();}});

/* ---------- Actions ---------- */
function fgAct(a,d){
  if(a==='fgAll'){S.fgAll={...(S.fgAll||{}),[d.fid]:!(S.fgAll||{})[d.fid]};render();return true;}
  if(a==='fgBuy'){const f=S.fiches[d.fid];if(!fgCan(f))return true;fiOpenDlg({kind:'fgBuy',fid:d.fid,k:d.k,ctb:{},nom:'',av:'',fx:''});render();return true;}
  if(a==='fgBuyOk'){const g=S.dlg;if(g&&g.kind==='fgBuy')fgBuyOk(g);render();return true;}
  if(a==='fgUndo'){fiOpenDlg({kind:'fgUndo',fid:d.fid});render();return true;}
  if(a==='fgUndoOk'){const g=S.dlg;if(g&&g.kind==='fgUndo')fgUndoOk(g.fid);render();return true;}
  if(a==='fgEd'){const f=S.fiches[d.fid];if(!f||!canEdit())return true;const G=fgG(f),g={kind:'fgEd',fid:f.id,pop:String(G.pop),taille:G.taille,eco:G.eco,traits:[...((f.gest||{}).traits||[])]};for(const [k] of FG_CAR)g['car_'+k]=String(+G.car[k]||0);fiOpenDlg(g);render();return true;}
  if(a==='fgEdOk'){const g=S.dlg,f=g&&S.fiches[g.fid];if(!f||!canEdit()||g.kind!=='fgEd')return true;const C=fgCfg();if(fgEdErr(g,C)){S._fiRedraw=true;render();return true;}
    const n=clone(f),G=n.gest={...(n.gest||{})};G.car={};for(const [k] of FG_CAR)G.car[k]=+g['car_'+k];G.pop=+g.pop;G.taille=g.taille||'';G.eco=g.eco||'';G.traits=(g.traits||[]).map(x=>(x||'').trim()).filter(Boolean);
    S.dlg=null;fiSave(n);return true;}
  if(a==='fgRes'){const f=S.fiches[d.fid];if(!f||!canEdit())return true;const r=d.rid?fgG(f).res.find(x=>x.id===d.rid):null;fiOpenDlg({kind:'fgRes',fid:f.id,rid:r?r.id:'',nom:r?r.nom:'',av:r?r.av||'':'',fx:r?r.fx||'':''});render();return true;}
  if(a==='fgResOk'||a==='fgResDel'){const g=S.dlg,f=g&&S.fiches[g.fid];if(!f||!canEdit()||g.kind!=='fgRes')return true;
    if(a==='fgResDel'&&!g.del){g.del=true;S._fiRedraw=true;render();return true;}
    const n=clone(f),G=n.gest={...(n.gest||{})},R=[...(G.res||[])];
    if(a==='fgResDel')G.res=R.filter(x=>x.id!==g.rid);
    else{const nom=(g.nom||'').trim();if(!nom)return true;const o={id:g.rid||uid('fr'),nom,av:(g.av||'').trim(),fx:(g.fx||'').trim()};const i=R.findIndex(x=>x.id===o.id);if(i>=0)R[i]={...R[i],...o};else R.push(o);G.res=R;}
    S.dlg=null;fiSave(n);return true;}
  if(a==='fgSessDel'){const key='fg:'+d.id+':'+d.f;if(S.confirm!==key){S.confirm=key;render();return true;}S.confirm=null;
    saveEvents(S.events.map(e=>e.id===d.id?{...e,entries:e.entries.filter(en=>en.perso!=='fief:'+d.f)}:e));return true;}
  if(/^fgP/.test(a))return fgParamAct(a,d);
  return false;}

/* ---------- XP : session (nature « Fief ») et transfert ---------- */
/* Fief d'une ligne de saisie : celui choisi, sinon le seul fief géré */
function fgLineFief(l){const L=fgFiefs();if(l.fief&&L.some(f=>f.id===l.fief))return l.fief;return L.length===1?L[0].id:'';}
function fgFormLine(ln,i){const L=fgFiefs(),id=fgLineFief(ln);
  return (L.length>1?`<div class="field" style="margin-top:6px"><label for="gf${i}">Fief crédité</label><select id="gf${i}" data-l="${i}" data-k="fief"><option value="">— choisir —</option>${L.map(f=>`<option value="${esc(f.id)}"${f.id===id?' selected':''}>${esc(f.nom)}</option>`).join('')}</select></div>`:'')+
    `<div class="muted small" style="margin:6px 0 4px">${id?`Créditée directement à ${esc(S.fiches[id].nom)} · hors calculs des PJ (disponible, moyenne, rattrapage).`:'Choisis le fief crédité.'}</div>`;}
/* Journal d'une session : lignes « Fief » */
function fgSessBlock(e){const by={};for(const en of e.entries||[])if(typeof en.perso==='string'&&en.perso.startsWith('fief:')&&en.montant){const f=en.perso.slice(5);by[f]=(by[f]||0)+(+en.montant||0);}
  return Object.entries(by).map(([fid,m])=>{const f=S.fiches[fid],key='fg:'+e.id+':'+fid;
    return `<div class="nb"><div class="nbh"><span class="nt"><b>Fief</b><span class="xpn">+${m}</span></span>${S.visit?'':`<button class="btn ghost" style="padding:4px 10px;flex:none" data-act="fgSessDel" data-id="${esc(e.id)}" data-f="${esc(fid)}">${S.confirm===key?'Confirmer':'Retirer'}</button>`}</div><div class="nbl"><span class="muted small">${f?(fiSee(f)?lk({t:'fiche',id:f.id},f.nom):esc(f.nom)):'fief supprimé'}</span></div></div>`;}).join('');}
/* Fenêtre « Dépenser en Fief » (transfert) */
function fgXferHtml(c,g,p){const L=fgFiefsOf(c),id=g.fief&&L.includes(g.fief)?g.fief:fgDefOf(c);
  return (L.length>1?`<div class="field"><label for="dfi">Vers le fief</label><select id="dfi" data-dfi="1">${L.map(x=>`<option value="${esc(x)}"${x===id?' selected':''}>${esc(S.fiches[x].nom)}</option>`).join('')}</select></div>`:'')+
    `<div class="xpbox">→ <span data-xn>${p||'…'}</span> XP transférés ${id?'à '+esc(S.fiches[id].nom):'au fief (aucun fief relié à ce PJ)'}.</div>`;}

/* ---------- Règles › Gestion de fief (texte et réglages) ---------- */
function fgRules(){const C=fgCfg(),E=canEdit(),ts=C.tailles.map(x=>`${x.n} ${fgSg(x.m)}`).join(' ; '),es=C.etats.map(x=>`${fgSg(x.m)} ${x.n.toLowerCase()}`).join(', ');
  const rows=[['Principe','Le fief représente l\'influence féerique exercée sur un territoire : réseaux, relais, lieux, personnes et ressources que l\'on contrôle ou manipule.'],
    ['Caractéristiques',`Souveraineté (imposer, contraindre, forcer), Organisation (réseaux, information, logistique), Influence (relations, cercles sociaux), Féerie (ressources magiques exploitées), notées sur ${C.max}.`],
    ['Population féerique','Présence féerique active dans le fief ; donne un modificateur (table ci-dessous).'],
    ['Taille',ts+' ; bonus si l\'ampleur du fief est pertinente.'],['État économique',es+'.'],
    ['Traits',`${C.nt} adjectifs décrivent la nature du fief ; +1 au test quand un trait est pertinent.`],
    ['Ressources','Ce que le fief peut concrètement utiliser : +2 dans une situation précise, une relance ou une capacité spécifique.'],
    ['Action de fief','Un PJ agit : compétence du PJ + caractéristique du fief + modificateurs (trait, ressource, habitants, taille, état économique, situation) + d10, contre une difficulté fixée par le MJ.'],
    ['Résultats','Réussite : résoudre le problème, obtenir un avantage, améliorer une relation… Réussite critique : 2 effets ou récupération d\'un effort. Échec : le problème persiste, complication. Échec critique : aggravation, perte de caractéristique, crise.'],
    ['Effort du fief','+2 au test contre 1 point perdu dans une caractéristique pertinente, récupéré après 2 interludes. Se note à la main (pas de suivi dans l\'appli).'],
    ['Interlude','2 actions au plus ; le reste évolue sans vous. Sans action régulière, les problèmes empirent, le fief se dégrade, le contrôle peut se perdre.'],
    ['Progression',`Caractéristique : nouveau score × ${C.cc} XP. Ressource : ${C.cr} XP. Plusieurs PJ peuvent contribuer avec leur XP.`],
    ['XP du fief','Sessions avec la nature « Fief » (résolution de problèmes, scénarios, actions marquantes, implication) et transferts des PJ ; hors calculs des PJ.']];
  const MOD=[['Relais et délégation','Relais −1 ; peu fiable −2 ; contesté −3 ; aucun relais local −4 ; relais parfaitement adapté : annule le malus.'],['Personnalités notables','Soutien +1 ; figure dominante +2 ; opposition −2 ; opposition d\'une figure majeure −3.'],['Position des interlocuteurs','Vassaux, alliés +1 ; neutres 0 ; rivaux −1 à −2 ; ennemi −3 à −5.'],['Intensité de la situation','Favorable ou maîtrisée +1 à +2 ; enjeu important −1 ; tendue −2 ; crise ouverte −3 ; crise majeure −5 ; désespérée −6.'],['Cohérence avec le fief','Dans ses intérêts +1 ; le renforce clairement +2 ; risquée pour l\'équilibre −2 ; met le fief en danger : au jugement du MJ.']];
  const DIF=[['Souveraineté','10 impressionner des voisins, affirmer sa présence ; 15 faire respecter une décision impopulaire, mater des troubles ; 20 écraser une révolte de vassaux ; 25 mener une guerre locale ; 30 imposer une domination totale.'],['Organisation','10 gérer une crise locale ; 15 une crise économique touchant une partie du fief ; 20 une opération financière d\'ampleur ; 25 réorganiser toutes les structures ; 30 restaurer l\'ordre après une catastrophe majeure.'],['Influence','10 obtenir une faveur dans un cercle social ; 15 négocier une alliance ; 20 imposer un compromis ; 25 un traité d\'alliance durable ; 30 un traité de loyauté éternelle.'],['Féerie','10 recherches occultes simples ; 15 faire appel à des druides ou des spirites reconnus ; 20 à des sorciers illégaux, exploiter un lieu surnaturel ; 25 gérer une crise magique d\'ampleur ; 30 transformer durablement un lieu, altérer le réel.'],['Lecture rapide','10 action locale significative ; 15 enjeu réel pour le fief ; 20 crise ou pratique risquée ; 25 transformation majeure ; 30 événement.']];
  const ev=(a,b)=>`<div class="ev"><div class="t" style="min-width:120px">${esc(a)}</div><div class="muted" style="text-align:right">${esc(b)}</div></div>`;
  let h=`<h2>Gestion de fief</h2><div class="card">${rows.map(r=>ev(r[0],r[1])).join('')}</div>`;
  h+=cBlk('fg-pop','Population féerique',C.pop.length+' niveaux',`<div class="fgpop"><b>Score</b><b>Fées</b><b>Modif.</b>${C.pop.map((x,i)=>`<span>${i}</span><span>${esc(x.n)}</span><span>${fgSg(x.m)}</span>`).join('')}</div>`);
  h+=cBlk('fg-mod','Modificateurs','5 rubriques',MOD.map(r=>ev(r[0],r[1])).join(''));
  h+=cBlk('fg-dif','Exemples de difficultés','10 à 30',DIF.map(r=>ev(r[0],r[1])).join(''));
  if(E)h+=fgParams();
  return h;}
/* Réglages des fiefs (gestion, mode édition) : brouillon S.fgPd, enregistré dans meta/fiefs */
function fgParams(){if(!S.fgPd)S.fgPd=fgCfg();const P=S.fgPd;
  const num=(k,l,dsc)=>`<div class="frow" style="align-items:center"><label for="fgp-${k}" style="flex:1"><b>${l}</b><span class="muted small"> · ${dsc}</span></label><input id="fgp-${k}" type="number" inputmode="numeric" min="0" data-fgp="${k}" value="${esc(String(P[k]))}" style="width:80px"></div>`;
  const list=(k,t,add)=>`<div class="fimg">${t}</div>`+P[k].map((x,i)=>`<div class="frow fgpl" style="align-items:center"><input type="text" aria-label="Libellé" data-fgp="${k}" data-i="${i}" data-f="n" value="${esc(x.n)}" style="flex:1"><input type="number" aria-label="Modificateur" data-fgp="${k}" data-i="${i}" data-f="m" value="${esc(String(x.m))}" style="width:70px">${add?`<button type="button" class="ibtn" data-act="fgPDel" data-k="${k}" data-i="${i}" aria-label="Retirer ${esc(x.n)}">✕</button>`:''}</div>`).join('')+(add?`<div class="radd"><button class="btn" data-act="fgPAdd" data-k="${k}">+ Ajouter</button></div>`:'');
  return cBlk('fg-par','Réglages des fiefs','mode édition',num('cc','Caractéristique','XP = nouveau score × ce nombre')+num('cr','Ressource','XP pour créer une ressource')+num('max','Score maximum','caractéristiques et population')+num('nt','Traits','nombre de traits par fief')+
    list('tailles','Tailles',1)+list('etats','États économiques',1)+list('pop','Population féerique (score 0 à '+(P.pop.length-1)+' : fées, modificateur)',0)+
    `<div class="actions"><button class="btn" data-act="fgPReset">Annuler les changements</button><button class="btn pri" data-act="fgPSave">Enregistrer</button></div>`);}
function fgParamAct(a,d){if(!canEdit())return true;const P=S.fgPd||(S.fgPd=fgCfg());
  if(a==='fgPAdd')P[d.k].push({n:'',m:0});else if(a==='fgPDel')P[d.k].splice(+d.i,1);else if(a==='fgPReset')S.fgPd=null;
  else if(a==='fgPSave'){const o={cc:Math.max(0,Math.floor(+P.cc||0)),cr:Math.max(0,Math.floor(+P.cr||0)),max:Math.max(1,Math.floor(+P.max||10)),nt:Math.max(0,Math.floor(+P.nt||0))};
    for(const k of ['tailles','etats','pop'])o[k]=P[k].filter(x=>(x.n||'').trim()||k==='pop').map(x=>({n:(x.n||'').trim(),m:Math.round(+x.m||0)}));
    S.fgCfg=o;S.fgPd=null;persist('meta/fiefs',o);}
  render();return true;}
document.addEventListener('input',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.fgp===undefined||!S.fgPd)return;const P=S.fgPd,k=t.dataset.fgp;
  if(t.dataset.i===undefined)P[k]=t.value;else{const x=P[k][+t.dataset.i];if(x)x[t.dataset.f]=t.dataset.f==='m'?t.value:t.value;}});
