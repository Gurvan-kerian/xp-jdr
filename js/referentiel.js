/* La belle appli — Référentiel des races */
/* --- Référentiel › Races --- */
function viewRef(){if(!S.creaturesReady||!S.racesReady||!S.pouvoirsReady)return `<h2 style="margin-top:4px">Référentiel</h2><div class="card empty">Chargement…</div>`;if(!S.rf)return refList();
  if(!S.rf.hum&&!isGest())return refRead();
  let h=S.rf.hum?refHum():refSheet();
  if(!isGest()){const i=h.indexOf('<div class="card"'),k=h.indexOf('>',i)+1,e=h.lastIndexOf('</div>');
    if(i>=0&&e>k)h=h.slice(0,k)+'<div class="rolock">Lecture seule : la modification du Référentiel est réservée aux personnes ayant les droits de gestion.</div><fieldset disabled class="ro">'+h.slice(k,e)+'</fieldset>'+h.slice(e);}
  return h;}
function refRows(){return S.creatures.map(cr=>{const x=raceRec(cr);return {cr,x,st:raceStatus(cr,x),pj:playedBy(x.sing)};}).filter(r=>raceVisible(r.cr,r.x)).sort((a,b)=>a.x.sing.localeCompare(b.x.sing,'fr'));}
function refList(){const all=refRows(),q=nrm(S.rfq||''),f=S.rff||'all',fm=S.rffam||'';
  const cnt=k=>all.filter(r=>k==='todo'?r.st==='todo':k==='pj'?r.pj.length:k==='dec'?r.cr.done:true).length;
  const L=all.filter(r=>(!q||nrm(r.x.sing).includes(q)||nrm(r.cr.nom).includes(q))&&(f==='all'||(f==='todo'&&r.st==='todo')||(f==='pj'&&r.pj.length)||(f==='dec'&&r.cr.done))&&(!fm||r.cr.fam===fm));
  const F={trad:'traditionnelle',mod:'moderne',exo:'exotique'};
  let h=`<h2 style="margin-top:4px">Référentiel › Races</h2><div class="card"><div class="rsearch"><input type="search" data-rfq="1" placeholder="Rechercher une race…" aria-label="Rechercher une race" value="${esc(S.rfq||'')}" autocomplete="off">${isGest()?'<button class="btn" style="white-space:nowrap;padding:6px 12px" data-act="rfNew">+ Nouvelle</button>':''}</div>
  <div class="flt">${[['all','Toutes'],['todo','À compléter'],['pj','Jouées'],['dec','Découvertes']].map(([k,l])=>`<button data-act="rfFlt" data-v="${k}" aria-pressed="${f===k}">${l} (${cnt(k)})</button>`).join('')}</div>
  <div class="flt">${CFAM.map(([k,l])=>`<button data-act="rfFam" data-v="${k}" aria-pressed="${fm===k}">${l}</button>`).join('')}</div>
  <div class="rl">${L.map(r=>`<button class="r${r.cr.done?' dec':''}" data-act="rfOpen" data-id="${esc(r.cr.id)}"><span><b>${esc(r.x.sing)}</b>${r.pj.length?` <span class="rpj">· ${r.pj.map(c=>esc(c.court)).join(', ')}</span>`:''}<small>${F[r.cr.fam]||''}${r.cr.done?' · <span class="rdot">✓ découverte</span>':''}</small></span>${isGest()?`<span class="rst ${r.st}">${RST[r.st]}</span>`:'<span></span>'}<span style="color:var(--accent);font-size:18px">›</span></button>`).join('')||'<div class="muted" style="padding:8px">Aucune race.</div>'}${f==='all'&&!fm&&(!q||nrm(HUMAIN).includes(q))?(()=>{const pn=Object.values(S.chars).filter(isHum);return `<div class="rsep">Hors féerie</div><button class="r" data-act="rfHum"><span><b>${HUMAIN}</b>${pn.length?` <span class="rpj">· ${pn.map(c=>esc(c.court)).join(', ')}</span>`:''}<small>réservé aux PNJ</small></span><span></span><span style="color:var(--accent);font-size:18px">›</span></button>`;})():''}</div></div>`;
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
  return {id:cr?cr.id:null,sing:x.sing||'',plur:cr?cr.nom:'',fam:cr?cr.fam:'trad',car,acc:x.acc||[],pred:x.pred||[],fut:x.fut||[],at:(x.at||[]).map(a=>[a[0],a[1]||'']),typ,sp:(x.sp||[]).map(e=>[e[0]||'',e[1]||'',e[2]||'']),spf:(x.spf||[]).map(e=>[e[0]||'',e[1]||'',e[2]||'']),cap:(x.cap||[]).map(a=>[a[0]||'',a[1]||'']),choix:clone((x.choix&&x.choix.length)?x.choix:(x.acc||[]).map(c=>['acc',c])),av:(x.av||[]).map(a=>[a[0]||'',a[1]||'']),dv:(x.dv||[]).map(a=>[a[0]||'',a[1]||'']),pw,fx:clone(x.fx||{}),fxEd:null,ca:'acc',cb:'',pa:'',pb:'',fa:'',fb:'',confirm:false};}
function rfRec(g){const car={};let any=false;for(const k of CARCOL){const a=g.car[k];car[k]=[a[0]===''?'':+a[0],a[1]===''?'':+a[1]];if(a[0]!==''||a[1]!=='')any=true;}
  const pr=(g.pw||[]).map(s=>s[1]?'?':(s[0]||'').trim()),two=l=>(l||[]).filter(a=>(a[0]||'').trim()).map(a=>[a[0].trim(),(a[1]||'').trim()]);
  return {doc:1,fx:clone(g.fx||{}),fxv:1,cap:two(g.cap),choix:clone(g.choix||[]),av:two(g.av),dv:two(g.dv),pw:{m:pr.slice(0,4),d:pr.slice(4,6),p:pr[6]||'',l:pr[7]||''},sing:g.sing.trim(),car:any?car:null,acc:(g.choix||[]).filter(o=>o[0]==='acc').map(o=>o[1]),pred:clone(g.pred),fut:clone(g.fut),at:g.at.filter(a=>(a[0]||'').trim()).map(a=>[a[0].trim(),(a[1]||'').trim()]),typ:g.typ.filter(t=>(t[0]||'').trim()).map(t=>[t[0].trim(),t[1]||'']),sp:(g.sp||[]).filter(e=>(e[0]||'').trim()).map(e=>[e[0].trim(),e[1]||'',(e[2]||'').trim()]),spf:(g.spf||[]).filter(e=>(e[0]||'').trim()).map(e=>[e[0].trim(),(e[1]||'').trim(),(e[2]||'').trim()])};}
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
    <h3 class="rs">Atouts féeriques</h3><div class="rgrid">${g.at.map((a,i)=>`<input type="text" data-rfat="${i}" data-p="0" value="${esc(a[0])}" placeholder="Nom" aria-label="Nom de l'atout"><input type="text" data-rfat="${i}" data-p="1" value="${esc(a[1])}" placeholder="Description" aria-label="Description de l'atout"><button class="x" data-act="rfAtDel" data-i="${i}" aria-label="Retirer l'atout">✕</button>${fxLine(g,'at',a[0])}`).join('')}</div><div class="radd"><button class="btn" data-act="rfAtAdd">+ Ajouter un atout</button></div>
    <h3 class="rs">Spécialités typiques</h3><div class="rgrid" style="grid-template-columns:1fr 1fr">${g.typ.map((t,i)=>`<input type="text" data-rft="${i}" data-p="0" value="${esc(t[0])}" placeholder="Spécialité" aria-label="Spécialité typique ${i+1}"><select data-rft="${i}" data-p="1" aria-label="Compétence de la spécialité ${i+1}">${copt(t[1],'— compétence —')}</select>`).join('')}</div>
    <h3 class="rs">Spécialités de prédilection</h3><div class="muted small">Offertes à la création d'un personnage de cette race. Un nom contenant « au choix » est précisé par le joueur.</div>
    ${[['sp','Utiles'],['spf','Futiles']].map(([k,l])=>`<div class="small" style="margin:8px 0 4px"><b>${l}</b></div><div class="rgrid" style="grid-template-columns:1.3fr 1fr 1fr auto">${(g[k]||[]).map((e,i)=>`<input type="text" data-rfsp="${k}" data-i="${i}" data-p="0" value="${esc(e[0])}" placeholder="Spécialité" aria-label="Spécialité ${l.toLowerCase()} ${i+1}">${k==='sp'?`<select data-rfsp="sp" data-i="${i}" data-p="1" aria-label="Compétence de la spécialité ${i+1}">${copt(e[1],'— compétence —')}</select>`:`<input type="text" data-rfsp="spf" data-i="${i}" data-p="1" value="${esc(e[1])}" placeholder="Compétence futile" aria-label="Compétence futile de la spécialité ${i+1}">`}<input type="text" data-rfsp="${k}" data-i="${i}" data-p="2" value="${esc(e[2])}" placeholder="Note (facultatif)" aria-label="Note de la spécialité ${i+1}"><button class="x" data-act="rfSpDel" data-k="${k}" data-i="${i}" aria-label="Retirer la spécialité">✕</button>`).join('')||'<span class="muted small" style="grid-column:1/-1">Aucune.</span>'}</div><button class="btn ghost" style="margin-top:4px;padding:4px 10px" data-act="rfSpAdd" data-k="${k}">+ Ajouter</button>`).join('')}
    ${rfNewBlocks(g)}
    <div class="actions" style="margin-top:14px"><button class="btn pri" data-act="rfSave"${g.sing.trim()?'':' disabled'}>Enregistrer la race</button>${g.id?(g.confirm?`<button class="btn" style="color:var(--bad)" data-act="rfDelOk">Confirmer la suppression</button>`:`<button class="btn ghost" data-act="rfDel">Supprimer</button>`):''}</div>
    ${g.err?`<div class="small" role="alert" style="color:var(--bad);margin-top:6px">${esc(g.err)}</div>`:''}</div>`;
  return g.id&&cr?rfEyes(h,cr):h;}
function viewCreatures(){
  if(!S.creaturesReady)return `<div class="card empty">Chargement des créatures…</div>`;
  const L=S.creatures,n=L.filter(c=>c.done).length;
  let h=`<div class="card secsum"><div style="display:flex;align-items:baseline;gap:10px"><span class="big num">${n}</span><span>XP de groupe<br>issue des créatures</span></div><div class="muted small" style="text-align:right">${n} complète${n>1?'s':''} sur ${L.length}<br>1 XP par créature complète</div></div>`;
  for(const [f,lab] of CFAM){
    const items=L.filter(c=>c.fam===f).sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
    h+=`<h2>${lab}</h2><div class="card" style="padding:2px 12px">`+(items.map(c=>`<div class="crow${c.done?' done':''}"><button class="cname" data-act="creEdit" data-id="${esc(c.id)}">${esc(c.nom)}${c.done?'<small>Complète · +1 XP</small>':''}</button><button class="ccheck" data-act="creToggle" data-id="${esc(c.id)}"${isGest()?'':' disabled title="Réservé à la gestion"'} role="checkbox" aria-checked="${!!c.done}" aria-label="${esc(c.nom)} : ${c.done?'complète':'à compléter'}">${c.done?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':''}</button></div>`).join('')||'<div class="muted" style="padding:12px 0">Aucune créature pour l\'instant.</div>')+`</div>`;
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
    if(!c.done)return head(c.nom+' complète ?','Toutes nos connaissances sur cette créature sont réunies : tous les éléments de sa fiche de race deviennent visibles par la table.')+`<div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div><div class="calc"><span>XP de groupe, par PJ actif</span><b>+1</b><span style="grid-column:1/3" class="small muted">Ajouté au journal d'XP : « ${esc(c.nom)} complété », nature Groupe, ${n} PJ actif${n>1?'s':''}.</span></div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="creToggleOk">Marquer comme complète</button></div></div></div>`;
    return head('Décocher '+c.nom+' ?','La fiche de race est masquée (œil de la fiche fermé) : seuls les joueurs de cette race et la gestion la voient encore.')+`<div class="muted">${c.date?'La créature redevient à compléter : la ligne « '+esc(c.nom)+' complété » est retirée du journal d\'XP (−1 XP de groupe).':'Cette créature a été cochée dans le tableur : il n\'y a pas de ligne au journal à retirer, seul le compteur change.'}</div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn" style="color:var(--bad)" data-act="creToggleOk">Décocher</button></div></div></div>`;
  }
  /* ce : modifier */
  const rlink=`<div><button class="btn ghost" data-act="rfOpen" data-id="${esc(c.id)}">Règles de la race ›</button></div>`;
  if(c.done){const ev=creEv(c.id);return head(c.nom,'Complète'+(c.date?' depuis le '+fmtDate(c.date):'')+' · +1 XP')+rlink+(ev?`<div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div>`:'')+`<div class="muted small">Pour la renommer ou la supprimer, décoche-la d'abord.</div><div class="actions"><button class="btn" data-act="closeSheet">Fermer</button>${ev?'<button class="btn pri" data-act="creSess">Enregistrer</button>':''}</div></div></div>`;}
  return head('Modifier la créature','')+nameField+warn+famPick+rlink+`<div class="actions"><button class="btn pri" data-act="creSave"${g.nom.trim()&&!dup?'':' disabled'}>Enregistrer</button>${g.confirm?`<button class="btn" style="color:var(--bad)" data-act="creDelOk">Confirmer la suppression</button>`:`<button class="btn" data-act="creDel">Supprimer</button>`}<button class="btn ghost" data-act="closeSheet">Fermer</button></div></div></div>`;
}
function saveCreatures(list){S.creatures=list;persist('meta/creatures',{list});}
function creSlug(n){return slug(n);}
function creToggle(id,sid){const c=S.creatures.find(x=>x.id===id);if(!c)return;
  /* Cocher = ouvrir tous les yeux de la fiche ; décocher = fermer l'œil de la fiche */
  if(!c.done)raceEyeSet(id,'all',0,true,sid);else raceEyeSet(id,'fiche',0,false,sid);
}


/* Fiche de race : capacités naturelles, choix définitif, avantages, désavantages, pouvoirs */
const PWG=[['Masqués',0,4,''],['Démasqués',4,6,''],['Profond',6,7,' · accessible au palier Profond'],['Légendaire',7,8,' · accessible au palier Légendaire']];
function pwIdByName(nm){const k=nrm(nm);for(const [id,p] of Object.entries(S.pouvoirs||{}))if(nrm(p.nom)===k)return id;return null;}
function pwOthers(nm,selfId){if(!nm)return [];const id=pwIdByName(nm);if(!id)return [];const out=[];
  for(const cr of raceCres()){if(cr.id===selfId)continue;const x=raceRec(cr);if(pwSlots(x).includes(id))out.push(x.sing);}return out;}
function rfNewBlocks(g){
  const rows=(k,lab,ph)=>`<div class="rgrid" style="grid-template-columns:1fr 1.4fr auto">${(g[k]||[]).map((a,i)=>`<input type="text" data-rf2="${k}" data-i="${i}" data-p="0" value="${esc(a[0])}" placeholder="${ph}" aria-label="${lab} ${i+1}"><input type="text" data-rf2="${k}" data-i="${i}" data-p="1" value="${esc(a[1])}" placeholder="Effet (facultatif)" aria-label="Effet ${i+1}"><button class="x" data-act="rf2Del" data-k="${k}" data-i="${i}" aria-label="Retirer">✕</button>${fxLine(g,k,a[0])}`).join('')||'<span class="muted small" style="grid-column:1/-1">Aucun.</span>'}</div><div class="radd"><button class="btn" data-act="rf2Add" data-k="${k}">+ Ajouter</button></div>`;
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
      h+=`<div class="pwrow"><input type="text" list="pwcat" data-rfpw="${i}" value="${esc(s[1]?'':s[0])}" placeholder="${s[1]?'Inconnu (à nommer plus tard)':'Pouvoir'}"${s[1]?' disabled':''} aria-label="${lab} ${i-a+1}"><button class="btn ghost pwunk" data-act="rfPwUnk" data-i="${i}" aria-pressed="${!!s[1]}" title="Pouvoir inconnu en jeu">Inconnu</button>${rfPwEye(g,i,lab)}</div>${ot.length?`<div class="muted small pwalso">aussi : ${ot.map(esc).join(', ')}</div>`:''}`;}}
  h+=`<div class="muted small" style="margin-top:6px">Un pouvoir commun à plusieurs races n'est saisi qu'une fois : en tapant un nom, l'appli propose les pouvoirs déjà connus.</div>`;
  return h;}
/* À l'enregistrement : noms de pouvoirs → identifiants du catalogue (création des nouveaux) */
function pwToIds(pw){let cat={...(S.pouvoirs||{})},ch=false;
  const one=nm=>{if(!nm||nm==='?')return nm;let id=pwIdByNameIn(cat,nm);if(id)return id;
    id='pw-'+(nrm(nm).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x');while(cat[id])id+='-'+Math.random().toString(36).slice(2,5);cat[id]={nom:nm};ch=true;return id;};
  const out={m:pw.m.map(one),d:pw.d.map(one),p:one(pw.p),l:one(pw.l)};
  if(ch){S.pouvoirs=cat;persist('meta/pouvoirs',{byId:cat});}return out;}
function pwIdByNameIn(cat,nm){const k=nrm(nm);for(const [id,p] of Object.entries(cat))if(nrm(p.nom)===k)return id;return null;}

/* Yeux sur la fiche (gestion) */
function rfPwEye(g,i,lab){const cr=g.id&&S.creatures.find(c=>c.id===g.id);if(!cr)return '';const x=raceRec(cr),e=eyeOf(cr,x),saved=pwSlots(x)[i];
  if(!saved)return `<button class="eye off" disabled title="Enregistrer d'abord un pouvoir (ou « Inconnu »)" aria-label="Œil indisponible : emplacement vide">${EYE_C}</button>`;
  return eyeBtn('eye',`data-id="${esc(cr.id)}" data-k="pw" data-i="${i}"`,(e.pw||[])[i],'Pouvoir '+lab+' : '+pwName(saved));}
function rfEyes(h,cr){const x=raceRec(cr),e=eyeOf(cr,x),[n,t]=eyeCount(e),full=eyeFull(e);
  const HD={car:'Caractéristiques',cap:'Capacités naturelles',av:'Avantages féeriques',dv:'Désavantages féeriques',pred:'Compétences utiles de prédilection (max 7)',fut:'Compétences futiles de prédilection',at:'Atouts féeriques',typ:'Spécialités typiques',sp:'Spécialités de prédilection'};
  for(const [k,l] of EYE_BLOCKS){const o=`<h3 class="rs">${HD[k]}</h3>`;h=h.replace(o,`<h3 class="rs rse"><span>${HD[k]}</span>${eyeBtn('eye',`data-id="${esc(cr.id)}" data-k="${k}"`,e[k],l)}</h3>`);}
  const o=`<h2 style="margin:0 0 4px">${esc(S.rf.sing||'Nouvelle race')}</h2>`;
  h=h.replace(o,`<div class="rse"><h2 style="margin:0 0 4px">${esc(S.rf.sing||'Nouvelle race')}</h2>${eyeBtn('eye',`data-id="${esc(cr.id)}" data-k="fiche"`,e.fiche,'Fiche '+x.sing)}</div>`);
  const bar=`<div class="eyebar${full?' full':''}"><span>${full?'★ Fiche complète : visible en entier par toute la table':`Visibilité : ${n} élément${n>1?'s':''} sur ${t} ouvert${n>1?'s':''}`}</span><span class="eyeleg">${EYE_O} toute la table · ${EYE_C} gestion seule</span></div>`;
  const k=h.indexOf('<div class="rchk">');return k>=0?h.slice(0,k)+bar+h.slice(k):h;}
/* Lecture joueur : seuls les éléments dévoilés (ou toute sa propre race, hors pouvoirs profond et légendaire) */
function refRead(){const g=S.rf,cr=g.id&&S.creatures.find(c=>c.id===g.id);if(!cr){S.rf=null;return refList();}
  const x=raceRec(cr),F={trad:'Traditionnelle',mod:'Moderne',exo:'Exotique'},mine=myRace(x.sing);
  if(!raceVisible(cr,x)){S.rf=null;return refList();}
  const seal='<div class="sealedbox">Pas encore découvert.</div>',none='<span class="muted small">—</span>';
  const sec=(k,title,body)=>`<h3 class="rs">${title}</h3>${blockVisible(cr,x,k)?body:seal}`;
  const chip=e=>Array.isArray(e)?`<span class="rchip grp"><b>au choix</b> ${e.map(esc).join(' <span class="muted">ou</span> ')}</span>`:`<span class="rchip">${esc(e)}</span>`;
  const chips=l=>(l||[]).length?`<div style="display:flex;flex-wrap:wrap;gap:6px">${l.map(chip).join('')}</div>`:none;
  const list=(l,k)=>(l||[]).filter(a=>a&&a[0]).length?`<ul class="rdl">${l.filter(a=>a&&a[0]).map(a=>{const fx=(x.fx&&x.fx[fxKey(k,a[0])])||[];return `<li><b>${esc(a[0])}</b>${a[1]?' : '+esc(a[1]):''}${fx.length?`<div class="fxl">${fx.map(e=>fxChip(e)).join('')}</div>`:''}</li>`;}).join('')}</ul>`:none;
  let h=`<h2 style="margin-top:4px">Référentiel › Races</h2><div style="margin-bottom:8px"><button class="btn ghost" style="white-space:nowrap" data-act="rfBack">‹ Liste</button></div>
  <div class="card"><h2 style="margin:0 0 4px">${esc(x.sing)}</h2><div class="muted small">${F[cr.fam]||''}${cr.done?' · <span class="rdot">✓ fiche complète</span>':''}${mine?' · ta race':''}</div>`;
  h+=sec('car','Caractéristiques',x.car?`<table class="ct"><tr><th></th><th>Min</th><th>Max</th></tr>${CARCOL.map(k=>{const v=x.car[k]||['',''];return `<tr><td>${k}</td><td class="num">${esc(v[0])}</td><td class="num">${esc(v[1])}</td></tr>`;}).join('')}</table>`:none);
  const ch=(x.choix||[]).length?`<div class="small" style="margin:8px 0 4px"><b>Choix définitif</b> <span class="muted">(une seule option)</span></div><div style="display:flex;flex-wrap:wrap;gap:6px">${x.choix.map(o=>`<span class="rchip${o[0]==='acc'?' grp':''}">${o[0]==='acc'?'<b>accrue</b> ':''}${esc(o[1])}</span>`).join('')}</div>`:'';
  h+=sec('cap','Capacités naturelles',list(x.cap,'cap')+ch);
  h+=sec('av','Avantages féeriques',list(x.av,'av'));
  h+=sec('dv','Désavantages féeriques',list(x.dv,'dv'));
  h+=sec('pred','Compétences utiles de prédilection',chips(x.pred));
  h+=sec('fut','Compétences futiles de prédilection',chips(x.fut));
  h+=sec('at','Atouts féeriques',list(x.at,'at'));
  h+=sec('typ','Spécialités typiques',(x.typ||[]).filter(t=>t&&t[0]).length?`<ul class="rdl">${x.typ.filter(t=>t&&t[0]).map(t=>`<li>${esc(t[0])}${t[1]?' <span class="muted">('+esc(t[1])+')</span>':''}</li>`).join('')}</ul>`:none);
  const spl=[...(x.sp||[]),...(x.spf||[])].filter(e=>e&&e[0]);
  h+=sec('sp','Spécialités de prédilection',spl.length?`<ul class="rdl">${spl.map(e=>`<li>${esc(e[0])}${e[1]?' <span class="muted">('+esc(e[1])+')</span>':''}</li>`).join('')}</ul>`:none);
  const sl=pwSlots(x);h+=`<h3 class="rs">Pouvoirs</h3>`;
  for(const [lab,a,b] of PWG){h+=`<div class="small" style="margin:8px 0 4px"><b>${lab}</b></div>`;
    for(let i=a;i<b;i++){const v=pwVisible(cr,x,i);h+=`<div class="mq-pw${v?'':' hid'}">${v?(sl[i]==='?'?'<span class="mq-unk">Inconnu</span>':sl[i]?esc(pwName(sl[i])):'<span class="mq-unk">—</span>'):'<span class="mq-unk">Scellé</span>'}</div>`;}}
  return h+`</div>`;}

/* Confirmation d'un œil de fiche de race */
function eyeRaceSheet(g){const cr=S.creatures.find(c=>c.id===g.id);if(!cr)return null;const x=raceRec(cr),e=eyeOf(cr,x),e2=clone(e);
  if(g.k==='pw'){e2.pw=(e2.pw||[]).slice();e2.pw[g.i]=g.open;}else e2[g.k]=g.open;
  const wasFull=eyeFull(e),isFull=eyeFull(e2),[n2,t]=eyeCount(e2),np=allPJ().length;
  const lab=g.k==='fiche'?'Fiche '+x.sing:g.k==='pw'?'Pouvoirs › '+(pwSlots(x)[g.i]==='?'?'Inconnu ('+PW_LAB[g.i].toLowerCase()+')':pwName(pwSlots(x)[g.i])):(EYE_BLOCKS.find(b=>b[0]===g.k)||[,g.k])[1];
  const txt=g.open?(g.k==='fiche'?`La fiche ${esc(x.sing)} apparaîtra dans le Référentiel pour toute la table, avec les éléments déjà dévoilés.`:`Cet élément de la fiche <b>${esc(x.sing)}</b> deviendra visible par toute la table${e.fiche?'':', dès que la fiche elle-même sera dévoilée'}.`)
    :(g.k==='fiche'?`La fiche ${esc(x.sing)} ne sera plus visible que par la gestion et par les joueurs de cette race.`:`Cet élément ne sera plus visible que par les personnes ayant les droits de gestion${g.k==='pw'&&g.i<6?' (et par les joueurs de cette race)':''}.`);
  let xp;
  if(isFull&&!wasFull)xp=`<div class="xpbox">★ La fiche ${esc(x.sing)} devient complète : +1 XP de groupe pour ${np} PJ actif${np>1?'s':''} (journal : « ${esc(cr.nom)} complété », ${CRE_TYPE}).</div><div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div>`;
  else if(wasFull&&!isFull)xp=`<div class="xpbox neg">⚠ La fiche ${esc(x.sing)} n'est plus complète : −1 XP de groupe pour les PJ actifs${cr.date?' (ligne retirée du journal)':' (reprise du tableur : pas de ligne au journal, seul le compteur change)'}.</div>`;
  else xp=`<div class="muted small">Pas d'effet sur l'XP${isFull?'':` : ${t-n2} élément${t-n2>1?'s':''} encore fermé${t-n2>1?'s':''} avant la fiche complète`}.</div>`;
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Confirmation"><div class="in"><div><h2>${g.open?'Dévoiler':'Masquer'} « ${esc(lab)} » ?</h2><div class="muted">${txt}</div></div>${xp}<div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="eyeOk">Confirmer</button></div></div></div>`;}

/* Effets (moteur de bonus) sous chaque capacité, avantage, désavantage et atout */
function fxChip(e,del){const cls=e.t==='rap'?'note':e.t==='perm'?'calc':(+e.val<0?'neg':'jet');
  return `<span class="bn ${cls}" title="${esc(FX_T[e.t]+(e.txt&&e.t!=='rap'?' · '+e.txt:'')+' · '+FX_Q[e.quand])}">${esc(fxLabel(e))}${e.quand!=='tj'?` <small>· ${FX_Q[e.quand]}</small>`:''}${del||''}</span>`;}
function fxLine(g,k,name){if(!(name||'').trim())return '';const key=fxKey(k,name),L=(g.fx&&g.fx[key])||[],ed=g.fxEd&&g.fxEd.key===key?g.fxEd:null;
  let h=`<div class="fxl">${L.map((e,j)=>fxChip(e,`<button data-act="rfFxDel" data-key="${esc(key)}" data-j="${j}" aria-label="Retirer l'effet">✕</button>`)).join('')}${ed?'':`<button class="fxadd" data-act="rfFxNew" data-k="${k}" data-n="${esc(name)}">+ Effet</button>`}</div>`;
  if(ed){const seg=(act,cur,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button data-act="${act}" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join('')}</div>`;
    const opt=(v,l,cur)=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc(l)}</option>`;
    let body='';
    if(ed.t==='perm')body=`<div class="lab">Valeur modifiée</div><div class="f"><select data-rffx="cible" aria-label="Valeur modifiée"><option value="">— choisir —</option><optgroup label="Caractéristiques">${CARCOL.map(c=>opt('car:'+c,c,ed.cible)).join('')}</optgroup><optgroup label="Compétences">${COMPS_ALL.map(c=>opt('comp:'+c,c,ed.cible)).join('')}</optgroup><optgroup label="Valeurs dérivées">${FX_DER.map(c=>opt('der:'+c,c,ed.cible)).join('')}</optgroup>${opt('fortune','Fortune',ed.cible)}</select><input type="number" data-rffx="val" value="${esc(ed.val)}" style="max-width:70px" aria-label="Valeur"></div>`;
    else if(ed.t==='jet')body=`<div class="lab">Jet concerné et valeur</div><div class="f"><select data-rffx="cible" aria-label="Jet concerné">${opt('','Jet en situation',ed.cible)}<optgroup label="Compétences">${COMPS_ALL.map(c=>opt(c,c,ed.cible)).join('')}</optgroup><optgroup label="Caractéristiques">${CARCOL.map(c=>opt(c,c,ed.cible)).join('')}</optgroup></select><input type="number" data-rffx="val" value="${esc(ed.val)}" style="max-width:70px" aria-label="Valeur"></div><div class="f" style="margin-top:6px"><input type="text" data-rffx="txt" value="${esc(ed.txt)}" placeholder="Condition (ex. pour se cacher dans l'obscurité)" aria-label="Condition"></div>`;
    else body=`<div class="lab">Texte du rappel</div><div class="f"><input type="text" data-rffx="txt" value="${esc(ed.txt)}" placeholder="ex. Immunité à l'électricité" aria-label="Texte du rappel"></div>`;
    const ok=ed.t==='rap'?(ed.txt||'').trim():ed.t==='perm'?ed.cible&&+ed.val:+ed.val;
    h+=`<div class="fxed"><div style="font-weight:600;font-size:14px">Nouvel effet de « ${esc(name)} »</div><div class="lab">Sorte d'effet</div>${seg('rfFxT',ed.t,[['perm','Permanent'],['jet','Jet'],['rap','Rappel']])}${body}<div class="lab">Quand</div>${seg('rfFxQ',ed.quand,[['tj','Toujours'],['m','Masquée'],['d','Démasquée']])}
      <div class="actions" style="margin-top:10px"><button class="btn ghost" data-act="rfFxCancel">Annuler</button><button class="btn pri" data-act="rfFxAdd"${ok?'':' disabled'}>Ajouter</button></div>
      <div class="hint"><b>Permanent</b> : ajouté à la valeur sur la fiche des personnages créés à partir de maintenant. <b>Jet</b> : bonus ou malus à un type de jet, affiché sur la fiche mais pas ajouté aux rangs. <b>Rappel</b> : texte seul. Pense ensuite à « Enregistrer la race ».</div></div>`;}
  return `<div style="grid-column:1/-1">${h}</div>`;}
