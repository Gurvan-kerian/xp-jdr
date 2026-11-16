/* La belle appli — Référentiel des races */
/* --- Référentiel › Races --- */
function viewRef(){if(!S.creaturesReady||!S.racesReady||!S.pouvoirsReady)return `<h2 style="margin-top:4px">Référentiel</h2><div class="card empty">Chargement…</div>`;if(!S.rf)return refList();
  let h=S.rf.hum?refHum():refSheet();
  if(!isGest()){const i=h.indexOf('<div class="card"'),k=h.indexOf('>',i)+1,e=h.lastIndexOf('</div>');
    if(i>=0&&e>k)h=h.slice(0,k)+'<div class="rolock">Lecture seule : la modification du Référentiel est réservée aux personnes ayant les droits de gestion.</div><fieldset disabled class="ro">'+h.slice(k,e)+'</fieldset>'+h.slice(e);}
  return h;}
function refRows(){return S.creatures.map(cr=>{const x=raceRec(cr);return {cr,x,st:raceStatus(cr,x),pj:playedBy(x.sing)};}).sort((a,b)=>a.x.sing.localeCompare(b.x.sing,'fr'));}
function refList(){const all=refRows(),q=nrm(S.rfq||''),f=S.rff||'all',fm=S.rffam||'';
  const cnt=k=>all.filter(r=>k==='todo'?r.st==='todo':k==='pj'?r.pj.length:k==='dec'?r.cr.done:true).length;
  const L=all.filter(r=>(!q||nrm(r.x.sing).includes(q)||nrm(r.cr.nom).includes(q))&&(f==='all'||(f==='todo'&&r.st==='todo')||(f==='pj'&&r.pj.length)||(f==='dec'&&r.cr.done))&&(!fm||r.cr.fam===fm));
  const F={trad:'traditionnelle',mod:'moderne',exo:'exotique'};
  let h=`<h2 style="margin-top:4px">Référentiel › Races</h2><div class="card"><div class="rsearch"><input type="search" data-rfq="1" placeholder="Rechercher une race…" aria-label="Rechercher une race" value="${esc(S.rfq||'')}" autocomplete="off">${isGest()?'<button class="btn" style="white-space:nowrap;padding:6px 12px" data-act="rfNew">+ Nouvelle</button>':''}</div>
  <div class="flt">${[['all','Toutes'],['todo','À compléter'],['pj','Jouées'],['dec','Découvertes']].map(([k,l])=>`<button data-act="rfFlt" data-v="${k}" aria-pressed="${f===k}">${l} (${cnt(k)})</button>`).join('')}</div>
  <div class="flt">${CFAM.map(([k,l])=>`<button data-act="rfFam" data-v="${k}" aria-pressed="${fm===k}">${l}</button>`).join('')}</div>
  <div class="rl">${L.map(r=>`<button class="r${r.cr.done?' dec':''}" data-act="rfOpen" data-id="${esc(r.cr.id)}"><span><b>${esc(r.x.sing)}</b>${r.pj.length?` <span class="rpj">· ${r.pj.map(c=>esc(c.court)).join(', ')}</span>`:''}<small>${F[r.cr.fam]||''}${r.cr.done?' · <span class="rdot">✓ découverte</span>':''}</small></span><span class="rst ${r.st}">${RST[r.st]}</span><span style="color:var(--accent);font-size:18px">›</span></button>`).join('')||'<div class="muted" style="padding:8px">Aucune race.</div>'}${f==='all'&&!fm&&(!q||nrm(HUMAIN).includes(q))?(()=>{const pn=Object.values(S.chars).filter(isHum);return `<div class="rsep">Hors féerie</div><button class="r" data-act="rfHum"><span><b>${HUMAIN}</b>${pn.length?` <span class="rpj">· ${pn.map(c=>esc(c.court)).join(', ')}</span>`:''}<small>réservé aux PNJ</small></span><span></span><span style="color:var(--accent);font-size:18px">›</span></button>`;})():''}</div></div>`;
  return h;}
function refHum(){const g=S.rf,pn=Object.values(S.chars).filter(isHum);
  return `<h2 style="margin-top:4px">Référentiel › Races</h2><div style="margin-bottom:8px"><button class="btn ghost" style="white-space:nowrap" data-act="rfBack">‹ Liste</button></div>
  <div class="card"><h2 style="margin:0 0 4px">${HUMAIN}</h2><div class="muted small">Hors féerie · réservé aux PNJ${pn.length?' · '+pn.map(c=>esc(c.court)).join(', '):''}</div>
    <h3 class="rs">Caractéristiques</h3><table class="ct"><tr><th></th><th>Min</th><th>Max</th></tr>${CARCOL.map(k=>`<tr><td>${k}</td><td><input type="number" min="0" max="12" data-rfc="${k}" data-m="0" value="${esc(g.car[k][0])}" aria-label="${k} minimum"></td><td><input type="number" min="0" max="12" data-rfc="${k}" data-m="1" value="${esc(g.car[k][1])}" aria-label="${k} maximum"></td></tr>`).join('')}</table>
    <h3 class="rs">Règles fixes</h3><ul class="small" style="margin:4px 0 0;padding-left:18px;line-height:1.6"><li>Profils et compétences : maximum 6.</li><li>Spécialités : mêmes règles que pour les fées.</li><li>Pas de caractéristique accrue, pas de compétence de prédilection, pas de compétence futile, pas d'atout féerique.</li></ul>
    <div class="actions" style="margin-top:14px"><button class="btn pri" data-act="rfHumSave">Enregistrer</button></div>${g.saved?'<div class="small muted" style="margin-top:6px">Enregistré.</div>':''}</div>`;}
function rfDraft(id){const cr=S.creatures.find(c=>c.id===id);const x=cr?clone(raceRec(cr)):{sing:'',car:null,acc:[],pred:[],fut:[],at:[],typ:[],cap:[],choix:[],av:[],dv:[],pw:{m:[],d:[],p:'',l:''}};
  const sl=id=>id==='?'?['',true]:[pwName(id),false],pw=pwSlots(x).map(sl);
  const car={};for(const k of CARCOL){const v=x.car&&x.car[k];car[k]=[v?v[0]:'',v?v[1]:''];}
  const typ=(x.typ||[]).slice(0,2);while(typ.length<2)typ.push(['','']);
  return {id:cr?cr.id:null,sing:x.sing||'',plur:cr?cr.nom:'',fam:cr?cr.fam:'trad',car,acc:x.acc||[],pred:x.pred||[],fut:x.fut||[],at:(x.at||[]).map(a=>[a[0],a[1]||'']),typ,sp:(x.sp||[]).map(e=>[e[0]||'',e[1]||'',e[2]||'']),spf:(x.spf||[]).map(e=>[e[0]||'',e[1]||'',e[2]||'']),cap:(x.cap||[]).map(a=>[a[0]||'',a[1]||'']),choix:clone((x.choix&&x.choix.length)?x.choix:(x.acc||[]).map(c=>['acc',c])),av:(x.av||[]).map(a=>[a[0]||'',a[1]||'']),dv:(x.dv||[]).map(a=>[a[0]||'',a[1]||'']),pw,ca:'acc',cb:'',pa:'',pb:'',fa:'',fb:'',confirm:false};}
function rfRec(g){const car={};let any=false;for(const k of CARCOL){const a=g.car[k];car[k]=[a[0]===''?'':+a[0],a[1]===''?'':+a[1]];if(a[0]!==''||a[1]!=='')any=true;}
  const pr=(g.pw||[]).map(s=>s[1]?'?':(s[0]||'').trim()),two=l=>(l||[]).filter(a=>(a[0]||'').trim()).map(a=>[a[0].trim(),(a[1]||'').trim()]);
  return {doc:1,cap:two(g.cap),choix:clone(g.choix||[]),av:two(g.av),dv:two(g.dv),pw:{m:pr.slice(0,4),d:pr.slice(4,6),p:pr[6]||'',l:pr[7]||''},sing:g.sing.trim(),car:any?car:null,acc:(g.choix||[]).filter(o=>o[0]==='acc').map(o=>o[1]),pred:clone(g.pred),fut:clone(g.fut),at:g.at.filter(a=>(a[0]||'').trim()).map(a=>[a[0].trim(),(a[1]||'').trim()]),typ:g.typ.filter(t=>(t[0]||'').trim()).map(t=>[t[0].trim(),t[1]||'']),sp:(g.sp||[]).filter(e=>(e[0]||'').trim()).map(e=>[e[0].trim(),e[1]||'',(e[2]||'').trim()]),spf:(g.spf||[]).filter(e=>(e[0]||'').trim()).map(e=>[e[0].trim(),(e[1]||'').trim(),(e[2]||'').trim()])};}
function refSheet(){const g=S.rf,cr=g.id&&S.creatures.find(c=>c.id===g.id),rec=rfRec(g),st=raceStatus(cr,rec),pj=playedBy(g.sing.trim()),F={trad:'Traditionnelle',mod:'Moderne',exo:'Exotique'};
  const chip=(e,k,i)=>Array.isArray(e)?`<span class="rchip grp"><b>au choix</b> ${e.map(esc).join(' <span class="muted">ou</span> ')}<button data-act="rfPredDel" data-k="${k}" data-i="${i}" aria-label="Retirer">✕</button></span>`:`<span class="rchip">${esc(e)}<button data-act="rfPredDel" data-k="${k}" data-i="${i}" aria-label="Retirer ${esc(e)}">✕</button></span>`;
  const copt=(v,none)=>(none?`<option value="">${none}</option>`:'')+COMPS_ALL.map(c=>`<option${v===c?' selected':''}>${esc(c)}</option>`).join('');
  const others=refRows();
  let h=`<h2 style="margin-top:4px">Référentiel › Races</h2><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px"><button class="btn ghost" style="white-space:nowrap" data-act="rfBack">‹ Liste</button>${g.id?`<select data-rfjump="1" aria-label="Aller à une autre race" style="padding:7px 10px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:inherit;font:inherit;min-width:0">${others.map(r=>`<option value="${esc(r.cr.id)}"${r.cr.id===g.id?' selected':''}>${esc(r.x.sing)}</option>`).join('')}</select>`:''}</div>`;
  h+=`<div class="card"${cr&&cr.done?' style="box-shadow:inset 3px 0 0 var(--brass)"':''}><h2 style="margin:0 0 4px">${esc(g.sing||'Nouvelle race')}</h2><div class="muted small">${F[g.fam]||''}${cr&&cr.done?' · <span class="rdot">✓ découverte</span>':''} · <span class="rst ${st}">${RST[st]}</span>${pj.length?' · jouée par '+pj.map(c=>esc(c.court)).join(', '):''}${cr?` · <a href="#" data-act="rfUni">voir dans Univers</a>`:''}</div>
    <div class="rchk">${raceBlocks(rec).map(([l,ok])=>`<div class="${ok?'':'ko'}">${ok?'✓':'✗'} ${l}</div>`).join('')}</div>
    <h3 class="rs">Identité</h3><div class="frow"><div class="field"><label for="rfs">Nom (singulier)</label><input id="rfs" type="text" data-rfk="sing" value="${esc(g.sing)}" autocomplete="off"></div><div class="field"><label for="rfp">Nom dans l'Univers (pluriel)</label><input id="rfp" type="text" data-rfk="plur" value="${esc(g.plur)}" autocomplete="off"></div><div class="field"><label for="rff">Famille</label><select id="rff" data-rfk="fam">${CFAM.map(([k])=>`<option value="${k}"${g.fam===k?' selected':''}>${F[k]}</option>`).join('')}</select></div></div>
    <h3 class="rs">Caractéristiques</h3><table class="ct"><tr><th></th><th>Min</th><th>Max</th></tr>${CARCOL.map(k=>`<tr><td>${k}</td><td><input type="number" min="0" max="12" data-rfc="${k}" data-m="0" value="${esc(g.car[k][0])}" aria-label="${k} minimum"></td><td><input type="number" min="0" max="12" data-rfc="${k}" data-m="1" value="${esc(g.car[k][1])}" aria-label="${k} maximum"></td></tr>`).join('')}</table><div class="muted small">Les caractéristiques qui peuvent être accrues se règlent dans le choix définitif des capacités naturelles.</div>
    <h3 class="rs">Compétences utiles de prédilection (max 7)</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${g.pred.map((e,i)=>chip(e,'pred',i)).join('')||'<span class="muted small">Aucune.</span>'}</div>
    <div class="radd"><select data-rfk="pa" aria-label="Compétence">${copt(g.pa,'— compétence —')}</select><span class="muted small">ou</span><select data-rfk="pb" aria-label="Au choix avec">${copt(g.pb,'— seule —')}</select><button class="btn" data-act="rfPredAdd" data-k="pred">Ajouter</button></div>
    <h3 class="rs">Compétences futiles de prédilection</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${g.fut.map((e,i)=>chip(e,'fut',i)).join('')||'<span class="muted small">Aucune.</span>'}</div>
    <div class="radd"><input type="text" data-rfk="fa" placeholder="Compétence futile" value="${esc(g.fa)}" style="flex:1"><span class="muted small">ou</span><input type="text" data-rfk="fb" placeholder="(au choix, facultatif)" value="${esc(g.fb)}" style="flex:1"><button class="btn" data-act="rfPredAdd" data-k="fut">Ajouter</button></div>
    <h3 class="rs">Atouts féeriques</h3><div class="rgrid">${g.at.map((a,i)=>`<input type="text" data-rfat="${i}" data-p="0" value="${esc(a[0])}" placeholder="Nom" aria-label="Nom de l'atout"><input type="text" data-rfat="${i}" data-p="1" value="${esc(a[1])}" placeholder="Description" aria-label="Description de l'atout"><button class="x" data-act="rfAtDel" data-i="${i}" aria-label="Retirer l'atout">✕</button>`).join('')}</div><div class="radd"><button class="btn" data-act="rfAtAdd">+ Ajouter un atout</button></div>
    <h3 class="rs">Spécialités typiques</h3><div class="rgrid" style="grid-template-columns:1fr 1fr">${g.typ.map((t,i)=>`<input type="text" data-rft="${i}" data-p="0" value="${esc(t[0])}" placeholder="Spécialité" aria-label="Spécialité typique ${i+1}"><select data-rft="${i}" data-p="1" aria-label="Compétence de la spécialité ${i+1}">${copt(t[1],'— compétence —')}</select>`).join('')}</div>
    <h3 class="rs">Spécialités de prédilection</h3><div class="muted small">Offertes à la création d'un personnage de cette race. Un nom contenant « au choix » est précisé par le joueur.</div>
    ${[['sp','Utiles'],['spf','Futiles']].map(([k,l])=>`<div class="small" style="margin:8px 0 4px"><b>${l}</b></div><div class="rgrid" style="grid-template-columns:1.3fr 1fr 1fr auto">${(g[k]||[]).map((e,i)=>`<input type="text" data-rfsp="${k}" data-i="${i}" data-p="0" value="${esc(e[0])}" placeholder="Spécialité" aria-label="Spécialité ${l.toLowerCase()} ${i+1}">${k==='sp'?`<select data-rfsp="sp" data-i="${i}" data-p="1" aria-label="Compétence de la spécialité ${i+1}">${copt(e[1],'— compétence —')}</select>`:`<input type="text" data-rfsp="spf" data-i="${i}" data-p="1" value="${esc(e[1])}" placeholder="Compétence futile" aria-label="Compétence futile de la spécialité ${i+1}">`}<input type="text" data-rfsp="${k}" data-i="${i}" data-p="2" value="${esc(e[2])}" placeholder="Note (facultatif)" aria-label="Note de la spécialité ${i+1}"><button class="x" data-act="rfSpDel" data-k="${k}" data-i="${i}" aria-label="Retirer la spécialité">✕</button>`).join('')||'<span class="muted small" style="grid-column:1/-1">Aucune.</span>'}</div><button class="btn ghost" style="margin-top:4px;padding:4px 10px" data-act="rfSpAdd" data-k="${k}">+ Ajouter</button>`).join('')}
    ${rfNewBlocks(g)}
    <div class="actions" style="margin-top:14px"><button class="btn pri" data-act="rfSave"${g.sing.trim()?'':' disabled'}>Enregistrer la race</button>${g.id?(g.confirm?`<button class="btn" style="color:var(--bad)" data-act="rfDelOk">Confirmer la suppression</button>`:`<button class="btn ghost" data-act="rfDel">Supprimer</button>`):''}</div>
    ${g.err?`<div class="small" role="alert" style="color:var(--bad);margin-top:6px">${esc(g.err)}</div>`:''}</div>`;
  return h;}
function viewCreatures(){
  if(!S.creaturesReady)return `<div class="card empty">Chargement des créatures…</div>`;
  const L=S.creatures,n=L.filter(c=>c.done).length;
  let h=`<div class="card secsum"><div style="display:flex;align-items:baseline;gap:10px"><span class="big num">${n}</span><span>XP de groupe<br>issue des créatures</span></div><div class="muted small" style="text-align:right">${n} complète${n>1?'s':''} sur ${L.length}<br>1 XP par créature complète</div></div>`;
  for(const [f,lab] of CFAM){
    const items=L.filter(c=>c.fam===f).sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
    h+=`<h2>${lab}</h2><div class="card" style="padding:2px 12px">`+(items.map(c=>`<div class="crow${c.done?' done':''}"><button class="cname" data-act="creEdit" data-id="${esc(c.id)}">${esc(c.nom)}${c.done?'<small>Complète · +1 XP</small>':''}</button><button class="ccheck" data-act="creToggle" data-id="${esc(c.id)}" role="checkbox" aria-checked="${!!c.done}" aria-label="${esc(c.nom)} : ${c.done?'complète':'à compléter'}">${c.done?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':''}</button></div>`).join('')||'<div class="muted" style="padding:12px 0">Aucune créature pour l\'instant.</div>')+`</div>`;
  }
  h+=`<button class="btn pri cta" data-act="creAdd">+ Ajouter une créature</button>`;
  return h;
}
function creSheet(g){
  const head=(t,sub)=>`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(t)}"><div class="in"><div><h2>${esc(t)}</h2>${sub?`<div class="muted small">${sub}</div>`:''}</div>`;
  const famPick=`<div class="field"><label>Famille</label><div class="kinds">${CFAM.map(([f,l])=>`<button class="kind" data-act="creFam" data-f="${f}" aria-pressed="${g.fam===f}"><span>${l}</span></button>`).join('')}</div></div>`;
  const nameField=`<div class="field"><label for="crn">Nom de la créature</label><input id="crn" type="text" data-cr="1" autocomplete="off" value="${esc(g.nom)}"></div>`;
  g.nom=g.nom||'';const dup=g.nom.trim()&&S.creatures.some(c=>c.id!==g.id&&c.nom.toLowerCase()===g.nom.trim().toLowerCase());
  const warn=`<div class="small" id="crdup" style="color:var(--bad)${dup?'':';display:none'}">Cette créature est déjà dans la liste.</div>`;
  if(g.kind==='ca')return head('Nouvelle créature','Ajoutée à la liste, sans XP : le point viendra quand elle sera complète.')+nameField+warn+famPick+`<div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="creAddOk"${g.nom.trim()&&!dup?'':' disabled'}>Ajouter</button></div></div></div>`;
  const c=S.creatures.find(x=>x.id===g.id);if(!c)return null;
  const n=allPJ().length;
  if(g.kind==='ct'){
    if(!c.done)return head(c.nom+' complète ?','Toutes nos connaissances sur cette créature sont réunies.')+`<div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div><div class="calc"><span>XP de groupe, par PJ actif</span><b>+1</b><span style="grid-column:1/3" class="small muted">Ajouté au journal d'XP : « ${esc(c.nom)} complété », nature Groupe, ${n} PJ actif${n>1?'s':''}.</span></div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="creToggleOk">Marquer comme complète</button></div></div></div>`;
    return head('Décocher '+c.nom+' ?','')+`<div class="muted">${c.date?'La créature redevient à compléter : la ligne « '+esc(c.nom)+' complété » est retirée du journal d\'XP (−1 XP de groupe).':'Cette créature a été cochée dans le tableur : il n\'y a pas de ligne au journal à retirer, seul le compteur change.'}</div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn" style="color:var(--bad)" data-act="creToggleOk">Décocher</button></div></div></div>`;
  }
  /* ce : modifier */
  const rlink=`<div><button class="btn ghost" data-act="rfOpen" data-id="${esc(c.id)}">Règles de la race ›</button></div>`;
  if(c.done){const ev=creEv(c.id);return head(c.nom,'Complète'+(c.date?' depuis le '+fmtDate(c.date):'')+' · +1 XP')+rlink+(ev?`<div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div>`:'')+`<div class="muted small">Pour la renommer ou la supprimer, décoche-la d'abord.</div><div class="actions"><button class="btn" data-act="closeSheet">Fermer</button>${ev?'<button class="btn pri" data-act="creSess">Enregistrer</button>':''}</div></div></div>`;}
  return head('Modifier la créature','')+nameField+warn+famPick+rlink+`<div class="actions"><button class="btn pri" data-act="creSave"${g.nom.trim()&&!dup?'':' disabled'}>Enregistrer</button>${g.confirm?`<button class="btn" style="color:var(--bad)" data-act="creDelOk">Confirmer la suppression</button>`:`<button class="btn" data-act="creDel">Supprimer</button>`}<button class="btn ghost" data-act="closeSheet">Fermer</button></div></div></div>`;
}
function saveCreatures(list){S.creatures=list;persist('meta/creatures',{list});}
function creSlug(n){return slug(n);}
function creToggle(id,sid){
  const list=clone(S.creatures),c=list.find(x=>x.id===id);if(!c)return;let evs=S.events;
  if(!c.done){c.done=true;c.date=today();const t=allPJ();if(t.length){const ne={id:'g'+Date.now().toString(36)+'-c',date:c.date,titre:c.nom+' complété',type:CRE_TYPE,creature:{id},entries:t.map(p=>({perso:p,nature:'Groupe',montant:1}))};if(sid&&sessById(sid))ne.sessionId=sid;evs=[...evs,ne];}}
  else{c.done=false;delete c.date;evs=evs.filter(e=>!(e.creature&&e.creature.id===id));}
  saveCreatures(list);if(evs!==S.events)saveEvents(evs);else render();
}


/* Fiche de race : capacités naturelles, choix définitif, avantages, désavantages, pouvoirs */
const PWG=[['Masqués',0,4,''],['Démasqués',4,6,''],['Profond',6,7,' · accessible au palier Profond'],['Légendaire',7,8,' · accessible au palier Légendaire']];
function pwIdByName(nm){const k=nrm(nm);for(const [id,p] of Object.entries(S.pouvoirs||{}))if(nrm(p.nom)===k)return id;return null;}
function pwOthers(nm,selfId){if(!nm)return [];const id=pwIdByName(nm);if(!id)return [];const out=[];
  for(const cr of raceCres()){if(cr.id===selfId)continue;const x=raceRec(cr);if(pwSlots(x).includes(id))out.push(x.sing);}return out;}
function rfNewBlocks(g){
  const rows=(k,lab,ph)=>`<div class="rgrid" style="grid-template-columns:1fr 1.4fr auto">${(g[k]||[]).map((a,i)=>`<input type="text" data-rf2="${k}" data-i="${i}" data-p="0" value="${esc(a[0])}" placeholder="${ph}" aria-label="${lab} ${i+1}"><input type="text" data-rf2="${k}" data-i="${i}" data-p="1" value="${esc(a[1])}" placeholder="Effet (facultatif)" aria-label="Effet ${i+1}"><button class="x" data-act="rf2Del" data-k="${k}" data-i="${i}" aria-label="Retirer">✕</button>`).join('')||'<span class="muted small" style="grid-column:1/-1">Aucun.</span>'}</div><div class="radd"><button class="btn" data-act="rf2Add" data-k="${k}">+ Ajouter</button></div>`;
  const ch=(g.choix||[]).map((o,i)=>`<span class="rchip${o[0]==='acc'?' grp':''}">${o[0]==='acc'?'<b>accrue</b> ':''}${esc(o[1])}<button data-act="rfChDel" data-i="${i}" aria-label="Retirer">✕</button></span>`).join('')||'<span class="muted small">Aucune option.</span>';
  const others=new Set((g.choix||[]).filter(o=>o[0]==='acc').map(o=>o[1]));
  let h=`<h3 class="rs">Capacités naturelles</h3>${rows('cap','Capacité','Capacité')}
    <div class="small" style="margin:8px 0 4px"><b>Choix définitif</b> <span class="muted">(une seule option à la création)</span></div><div style="display:flex;flex-wrap:wrap;gap:6px">${ch}</div>
    <div class="radd"><select data-rfk="ca" aria-label="Type d'option"><option value="acc"${g.ca==='acc'?' selected':''}>Caractéristique accrue</option><option value="cap"${g.ca==='cap'?' selected':''}>Capacité</option></select>${g.ca==='cap'?`<input type="text" data-rfk="cb" value="${esc(g.cb)}" placeholder="Capacité" style="flex:1">`:`<select data-rfk="cb" aria-label="Caractéristique"><option value="">— caractéristique —</option>${CARCOL.filter(c=>!others.has(c)).map(c=>`<option${g.cb===c?' selected':''}>${c}</option>`).join('')}</select>`}<button class="btn" data-act="rfChAdd">Ajouter</button></div>
    <h3 class="rs">Avantages féeriques</h3>${rows('av','Avantage','Avantage')}
    <h3 class="rs">Désavantages féeriques</h3>${rows('dv','Désavantage','Désavantage')}`;
  const n=(g.pw||[]).filter(s=>s[1]||(s[0]||'').trim()).length;
  h+=`<h3 class="rs">Pouvoirs <span class="muted small" style="text-transform:none;letter-spacing:0;font-family:inherit">${n} / 8</span></h3><datalist id="pwcat">${Object.values(S.pouvoirs||{}).map(p=>p.nom).sort((a,b)=>a.localeCompare(b,'fr')).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`;
  for(const [lab,a,b,sub] of PWG){h+=`<div class="small" style="margin:8px 0 4px"><b>${lab}</b><span class="muted">${sub}</span></div>`;
    for(let i=a;i<b;i++){const s=g.pw[i]||['',false],ot=s[1]?[]:pwOthers(s[0],g.id);
      h+=`<div class="pwrow"><input type="text" list="pwcat" data-rfpw="${i}" value="${esc(s[1]?'':s[0])}" placeholder="${s[1]?'Inconnu (à nommer plus tard)':'Pouvoir'}"${s[1]?' disabled':''} aria-label="${lab} ${i-a+1}"><button class="btn ghost pwunk" data-act="rfPwUnk" data-i="${i}" aria-pressed="${!!s[1]}" title="Pouvoir inconnu en jeu">Inconnu</button></div>${ot.length?`<div class="muted small pwalso">aussi : ${ot.map(esc).join(', ')}</div>`:''}`;}}
  h+=`<div class="muted small" style="margin-top:6px">Un pouvoir commun à plusieurs races n'est saisi qu'une fois : en tapant un nom, l'appli propose les pouvoirs déjà connus.</div>`;
  return h;}
/* À l'enregistrement : noms de pouvoirs → identifiants du catalogue (création des nouveaux) */
function pwToIds(pw){let cat={...(S.pouvoirs||{})},ch=false;
  const one=nm=>{if(!nm||nm==='?')return nm;let id=pwIdByNameIn(cat,nm);if(id)return id;
    id='pw-'+(nrm(nm).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x');while(cat[id])id+='-'+Math.random().toString(36).slice(2,5);cat[id]={nom:nm};ch=true;return id;};
  const out={m:pw.m.map(one),d:pw.d.map(one),p:one(pw.p),l:one(pw.l)};
  if(ch){S.pouvoirs=cat;persist('meta/pouvoirs',{byId:cat});}return out;}
function pwIdByNameIn(cat,nm){const k=nrm(nm);for(const [id,p] of Object.entries(cat))if(nrm(p.nom)===k)return id;return null;}
