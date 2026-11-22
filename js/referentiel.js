/* La belle appli — Référentiel des races */
/* --- Référentiel › Races --- */
function viewRef(){if(!S.creaturesReady||!S.racesReady||!S.pouvoirsReady)return `<div class="card empty">Chargement…</div>`;if(!S.rf)return viewRaces();
  /* Lot 4 bis : consultation par défaut ; l'éditeur seulement en mode édition (« Modifier la fiche ») ou pour une nouvelle race */
  if(!S.rf.hum&&S.rf.id&&!(canEdit()&&S.rfEd))return refRead();
  if(!S.rf.hum&&!canEdit()){S.rf=null;S.rfEd=false;return viewRaces();}
  let h=S.rf.hum?refHum():S.rf.id&&S.rfBlk?rfBlkOnly(refSheet(),S.rfBlk):refSheet();
  if(!S.rf.hum&&S.rf.id)h=h.replace('data-act="rfBack">‹ Races</button>','data-act="rfBack">‹ Races</button><button class="btn ghost" style="white-space:nowrap" data-act="rfEdOff">Terminer la modification</button>');
  if(!canEdit()){const i=h.indexOf('<div class="card"'),k=h.indexOf('>',i)+1,e=h.lastIndexOf('</div>');
    if(i>=0&&e>k)h=h.slice(0,k)+'<div class="rolock">Lecture seule : la modification des races est réservée aux personnes ayant les droits de gestion.</div><fieldset disabled class="ro">'+h.slice(k,e)+'</fieldset>'+h.slice(e);}
  return h;}
function refRows(){return S.creatures.map(cr=>{const x=raceRec(cr);return {cr,x,st:raceStatus(cr,x),pj:playedBy(x.sing)};}).filter(r=>raceVisible(r.cr,r.x)).sort((a,b)=>a.x.sing.localeCompare(b.x.sing,'fr'));}
function refList(){const all=refRows(),q=nrm(S.rfq||''),f=S.rff||'all',fm=S.rffam||'';
  const cnt=k=>all.filter(r=>k==='todo'?r.st==='todo':k==='pj'?r.pj.length:k==='dec'?r.cr.done:true).length;
  const L=all.filter(r=>(!q||nrm(r.x.sing).includes(q)||nrm(r.cr.nom).includes(q))&&(f==='all'||(f==='todo'&&r.st==='todo')||(f==='pj'&&r.pj.length)||(f==='dec'&&r.cr.done))&&(!fm||r.cr.fam===fm));
  const F={trad:'traditionnelle',mod:'moderne',exo:'exotique'};
  let h=`<div class="card"><div class="rsearch"><input type="search" data-rfq="1" placeholder="Rechercher une race…" aria-label="Rechercher une race" value="${esc(S.rfq||'')}" autocomplete="off">${canEdit()?'<button class="btn" style="white-space:nowrap;padding:6px 12px" data-act="rfNew">+ Nouvelle</button>':''}</div>
  <div class="flt">${[['all','Toutes'],['todo','À compléter'],['pj','Jouées'],['dec','Découvertes']].map(([k,l])=>`<button data-act="rfFlt" data-v="${k}" aria-pressed="${f===k}">${l} (${cnt(k)})</button>`).join('')}</div>
  <div class="flt">${CFAM.map(([k,l])=>`<button data-act="rfFam" data-v="${k}" aria-pressed="${fm===k}">${l}</button>`).join('')}</div>
  <div class="rl">${L.map(r=>`<button class="r${r.cr.done?' dec':''}" data-act="rfOpen" data-id="${esc(r.cr.id)}"><span><b>${esc(raceNm(r.x))}${esc(raceNmOther(r.x))}</b>${sigPicto('race',r.cr.id)}${r.pj.length?` <span class="rpj">· ${r.pj.map(c=>esc(c.court)).join(', ')}</span>`:''}<small>${F[r.cr.fam]||''}${r.cr.done?' · <span class="rdot">✓ découverte</span>':''}</small></span>${isGest()?`<span class="rst ${r.st}">${RST[r.st]}</span>`:'<span></span>'}<span style="color:var(--accent);font-size:18px">›</span></button>`).join('')||'<div class="muted" style="padding:8px">Aucune race.</div>'}${f==='all'&&!fm&&(!q||nrm(HUMAIN).includes(q))?(()=>{const pn=Object.values(S.chars).filter(isHum);return `<div class="rsep">Hors féerie</div><button class="r" data-act="rfHum"><span><b>${HUMAIN}</b>${pn.length?` <span class="rpj">· ${pn.map(c=>esc(c.court)).join(', ')}</span>`:''}<small>réservé aux PNJ</small></span><span></span><span style="color:var(--accent);font-size:18px">›</span></button>`;})():''}</div></div>`;
  return h;}
function refHum(){const g=S.rf,pn=Object.values(S.chars).filter(isHum);
  return `<div style="margin-bottom:8px"><button class="btn ghost" style="white-space:nowrap" data-act="rfBack">‹ Races</button></div>
  <div class="card"><h2 style="margin:0 0 4px">${HUMAIN}</h2><div class="muted small">Hors féerie · réservé aux PNJ${pn.length?' · '+pn.map(c=>esc(c.court)).join(', '):''}</div>
    <h3 class="rs">Caractéristiques</h3><table class="ct"><tr><th></th><th>Min</th><th>Max</th></tr>${CARCOL.map(k=>`<tr><td>${k}</td><td><input type="number" min="0" max="12" data-rfc="${k}" data-m="0" value="${esc(g.car[k][0])}" aria-label="${k} minimum"></td><td><input type="number" min="0" max="12" data-rfc="${k}" data-m="1" value="${esc(g.car[k][1])}" aria-label="${k} maximum"></td></tr>`).join('')}</table>
    <h3 class="rs">Règles fixes</h3><ul class="small" style="margin:4px 0 0;padding-left:18px;line-height:1.6"><li>Profils et compétences : maximum 6.</li><li>Spécialités : mêmes règles que pour les fées.</li><li>Pas de caractéristique accrue, pas de compétence de prédilection, pas de compétence futile, pas d'atout féerique.</li></ul>
    <div class="actions" style="margin-top:14px"><button class="btn pri" data-act="rfHumSave">Enregistrer</button></div>${g.saved?'<div class="small muted" style="margin-top:6px">Enregistré.</div>':''}</div>`;}
const raceFem=x=>x&&(x.fem||'').trim()&&nrm(x.fem)!==nrm(x.sing)?' · '+x.fem.trim():'';
const rfTitle=g=>`<h2 class="rhd" style="margin:0 0 4px">${illThumb('race',g.id,56)}<span>${esc(raceNm(g)||'Nouvelle race')}${esc(raceNmOther(g))}</span>${g.id&&raceNm(g)?kankaBtn(g.kanka,raceNm(g),'Fiche Kanka : '+g.sing):''}</h2>`;
function rfDraft(id){const cr=S.creatures.find(c=>c.id===id);const x=cr?clone(raceRec(cr)):{sing:'',car:null,acc:[],pred:[],fut:[],at:[],typ:[],cap:[],choix:[],av:[],dv:[],pw:{m:[],d:[],p:'',l:''}};
  const sl=(id,i)=>id==='?'?['',true,pwPrec(x,i)]:[pwName(id),!!((x.pwu||[])[i]),pwPrec(x,i)],pw=pwSlots(x).map(sl);
  const car={};for(const k of CARCOL){const v=x.car&&x.car[k];car[k]=[v?v[0]:'',v?v[1]:''];}
  const typ=(x.typ||[]).slice(0,2);while(typ.length<2)typ.push(['','']);
  return {id:cr?cr.id:null,kanka:x.kanka||'',sing:x.mVide?'':(x.sing||''),fem:x.fem||'',nomP:x.nomP==='f'?'f':'m',pwn:{},fam:cr?cr.fam:'trad',car,acc:x.acc||[],pred:x.pred||[],fut:x.fut||[],at:(x.at||[]).map(a=>[a[0],a[1]||'']),typ,sp:(x.sp||[]).map(e=>[e[0]||'',e[1]||'',e[2]||'']),spf:(x.spf||[]).map(e=>[e[0]||'',e[1]||'',e[2]||'']),cap:(x.cap||[]).map(a=>[a[0]||'',a[1]||'',a[2]||'']),choix:clone((x.choix&&x.choix.length)?x.choix:(x.acc||[]).map(c=>['acc',c])),av:(x.av||[]).map(a=>[a[0]||'',a[1]||'']),dv:(x.dv||[]).map(a=>[a[0]||'',a[1]||'']),pw,fx:clone(x.fx||{}),fxEd:null,ca:'acc',cb:'',pa:'',pb:'',fa:'',fb:'',confirm:false};}
function rfRec(g){const car={};let any=false;for(const k of CARCOL){const a=g.car[k];car[k]=[a[0]===''?'':+a[0],a[1]===''?'':+a[1]];if(a[0]!==''||a[1]!=='')any=true;}
  const pr=(g.pw||[]).map(s=>(s[0]||'').trim()||(s[1]?'?':'')),two=l=>(l||[]).filter(a=>(a[0]||'').trim()).map(a=>[a[0].trim(),(a[1]||'').trim()]);
  return {doc:1,...((g.fem||'').trim()?{fem:g.fem.trim()}:{}),...(g.nomP==='f'&&(g.fem||'').trim()?{nomP:'f'}:{}),...(!g.sing.trim()&&(g.fem||'').trim()?{mVide:1}:{}),kanka:/^https?:\/\//.test((g.kanka||'').trim())?(g.kanka||'').trim():'',pwu:(g.pw||[]).map(s=>!!s[1]),pwq:(g.pw||[]).map(s=>(s[2]||'').trim()),fx:clone(g.fx||{}),fxv:1,cap:(g.cap||[]).filter(a=>(a[0]||'').trim()).map(a=>[a[0].trim(),(a[1]||'').trim(),(a[2]||'').trim()]),choix:clone(g.choix||[]),av:two(g.av),dv:two(g.dv),pw:{m:pr.slice(0,4),d:pr.slice(4,6),p:pr[6]||'',l:pr[7]||''},sing:g.sing.trim()||(g.fem||'').trim(),car:any?car:null,acc:(g.choix||[]).filter(o=>o[0]==='acc').map(o=>o[1]),pred:clone(g.pred),fut:clone(g.fut),at:g.at.filter(a=>(a[0]||'').trim()).map(a=>[a[0].trim(),(a[1]||'').trim()]),typ:g.typ.filter(t=>(t[0]||'').trim()).map(t=>[t[0].trim(),t[1]||'']),sp:(g.sp||[]).filter(e=>(e[0]||'').trim()).map(e=>[e[0].trim(),e[1]||'',(e[2]||'').trim()]),spf:(g.spf||[]).filter(e=>(e[0]||'').trim()).map(e=>[e[0].trim(),(e[1]||'').trim(),(e[2]||'').trim()])};}
function refSheet(){const g=S.rf,cr=g.id&&S.creatures.find(c=>c.id===g.id),rec=rfRec(g),st=raceStatus(cr,rec),pj=playedBy(rec.sing),F={trad:'Traditionnelle',mod:'Moderne',exo:'Exotique'};
  const chip=(e,k,i)=>Array.isArray(e)?`<span class="rchip grp"><b>au choix</b> ${e.map(esc).join(' <span class="muted">ou</span> ')}<button data-act="rfPredDel" data-k="${k}" data-i="${i}" aria-label="Retirer">✕</button></span>`:`<span class="rchip">${esc(e)}<button data-act="rfPredDel" data-k="${k}" data-i="${i}" aria-label="Retirer ${esc(e)}">✕</button></span>`;
  const copt=(v,none)=>(none?`<option value="">${none}</option>`:'')+COMPS_ALL.map(c=>`<option${v===c?' selected':''}>${esc(c)}</option>`).join('');
  const others=refRows();
  let h=`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px"><button class="btn ghost" style="white-space:nowrap" data-act="rfBack">‹ Races</button>${g.id?`<select data-rfjump="1" aria-label="Aller à une autre race" style="padding:7px 10px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:inherit;font:inherit;min-width:0">${others.map(r=>`<option value="${esc(r.cr.id)}"${r.cr.id===g.id?' selected':''}>${esc(r.x.sing)}</option>`).join('')}</select>`:''}</div>`;
  h+=`<div class="card"${cr&&cr.done?' style="box-shadow:inset 3px 0 0 var(--brass)"':''}>${rfTitle(g)}<div class="muted small">${F[g.fam]||''} · <span class="rst ${st}">${RST[st]}</span>${pj.length?' · jouée par '+pj.map(c=>esc(c.court)).join(', '):''}</div>
    <div class="rchk">${raceBlocks(rec).map(([l,ok])=>`<div class="${ok?'':'ko'}">${ok?'✓':'✗'} ${l}</div>`).join('')}</div>
    <h3 class="rs">Identité</h3><div class="frow"><div class="field"><label for="rfs">Nom (masculin) <span class="muted small">(peut rester vide si le féminin est rempli)</span></label><input id="rfs" type="text" data-rfk="sing" value="${esc(g.sing)}" autocomplete="off"></div><div class="field"><label for="rfp">Nom (féminin) <span class="muted small">(vide : le masculin s'affiche)</span></label><input id="rfp" type="text" data-rfk="fem" value="${esc(g.fem||'')}" autocomplete="off"></div><div class="field"><label>Nom affiché en premier</label><div class="seg" role="group" aria-label="Nom affiché en premier">${[['m','Masculin'],['f','Féminin']].map(([v,l])=>`<button type="button" data-act="rfNomP" data-v="${v}" aria-pressed="${(g.nomP||'m')===v}">${l}</button>`).join('')}</div></div><div class="field"><label for="rff">Famille</label><select id="rff" data-rfk="fam">${CFAM.map(([k])=>`<option value="${k}"${g.fam===k?' selected':''}>${F[k]}</option>`).join('')}</select></div><div class="field" style="grid-column:1/-1"><label for="rfk">Lien Kanka <span class="muted small">(facultatif : sans lien, le livre ouvre la recherche sur le nom)</span></label><input id="rfk" type="url" inputmode="url" data-rfk="kanka" value="${esc(g.kanka||'')}" placeholder="https://app.kanka.io/w/350361/entities/…" autocomplete="off"></div><div class="field" style="grid-column:1/-1"><label>Illustration <span class="muted small">(facultatif)</span></label>${illEdit('race',g.id,g.sing)}</div></div>
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
    ${g.unkAsk?rfUnkBox(g):''}<div class="actions" style="margin-top:14px">${(g.sing.trim()||(g.fem||'').trim())?'':'<div class="bad small" role="status" style="flex-basis:100%">Renseigne au moins un nom (masculin ou féminin) pour enregistrer.</div>'}<button class="btn pri" data-act="rfSave"${(g.sing.trim()||(g.fem||'').trim())?'':' disabled'}>Enregistrer la race</button>${g.id?(g.confirm?`<button class="btn" style="color:var(--bad)" data-act="rfDelOk">Confirmer la suppression</button>`:`<button class="btn ghost" data-act="rfDel">Supprimer</button>`):''}</div>
    ${g.err?`<div class="small" role="alert" style="color:var(--bad);margin-top:6px">${esc(g.err)}</div>`:''}</div>`;
  return g.id&&cr?rfEyes(h,cr):h;}
function viewCreatures(){
  if(!S.creaturesReady)return `<div class="card empty">Chargement des races…</div>`;
  const L=S.creatures,n=L.filter(c=>c.done).length;
  let h=`<div class="card secsum"><div style="display:flex;align-items:baseline;gap:10px"><span class="big num">${n}</span><span>XP de groupe<br>issue des races</span></div><div class="muted small" style="text-align:right">${n} complète${n>1?'s':''} sur ${L.length}<br>1 XP par race complète</div></div>`;
  for(const [f,lab] of CFAM){
    const items=L.filter(c=>c.fam===f).sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));
    h+=`<h2>${lab}</h2><div class="card" style="padding:2px 12px">`+(items.map(c=>`<div class="crow${c.done?' done':''}"><button class="cname" data-act="creEdit" data-id="${esc(c.id)}">${esc(c.nom)}${c.done?'<small>Complète · +1 XP</small>':''}</button><button class="ccheck" data-act="creToggle" data-id="${esc(c.id)}"${isGest()?'':' disabled title="Réservé à la gestion"'} role="checkbox" aria-checked="${!!c.done}" aria-label="${esc(c.nom)} : ${c.done?'complète':'à compléter'}">${c.done?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':''}</button></div>`).join('')||'<div class="muted" style="padding:12px 0">Aucune race pour l\'instant.</div>')+`</div>`;
  }
  h+=`<button class="btn pri cta" data-act="creAdd">+ Ajouter une race</button>`;
  return h;
}
function creSheet(g){
  const head=(t,sub)=>`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(t)}"><div class="in"><div><h2>${esc(t)}</h2>${sub?`<div class="muted small">${sub}</div>`:''}</div>`;
  const famPick=`<div class="field"><label>Famille</label><div class="kinds">${CFAM.map(([f,l])=>`<button class="kind" data-act="creFam" data-f="${f}" aria-pressed="${g.fam===f}"><span>${l}</span></button>`).join('')}</div></div>`;
  const nameField=`<div class="field"><label for="crn">Nom de la race</label><input id="crn" type="text" data-cr="1" autocomplete="off" value="${esc(g.nom)}"></div>`;
  g.nom=g.nom||'';const dup=g.nom.trim()&&S.creatures.some(c=>c.id!==g.id&&c.nom.toLowerCase()===g.nom.trim().toLowerCase());
  const warn=`<div class="small" id="crdup" style="color:var(--bad)${dup?'':';display:none'}">Cette race est déjà dans la liste.</div>`;
  if(g.kind==='ca')return head('Nouvelle race','Ajoutée à la liste, sans XP : le point viendra quand elle sera complète.')+nameField+warn+famPick+`<div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="creAddOk"${g.nom.trim()&&!dup?'':' disabled'}>Ajouter</button></div></div></div>`;
  const c=S.creatures.find(x=>x.id===g.id);if(!c)return null;
  const n=allPJ().length;
  if(g.kind==='ct'){
    if(!c.done)return head(c.nom+' complète ?','Toutes nos connaissances sur cette race sont réunies : tous les éléments de sa fiche de race deviennent visibles par la table.')+`<div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div><div class="calc"><span>XP de groupe, par PJ actif</span><b>+1</b><span style="grid-column:1/3" class="small muted">Ajouté au journal d'XP : « ${esc(c.nom)} complété », nature Groupe, ${n} PJ actif${n>1?'s':''}.</span></div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="creToggleOk">Marquer comme complète</button></div></div></div>`;
    return head('Décocher '+c.nom+' ?','La fiche de race est masquée (œil de la fiche fermé) : seuls les joueurs de cette race et la gestion la voient encore.')+`<div class="muted">${c.date?'La race redevient à compléter : la ligne « '+esc(c.nom)+' complété » est retirée du journal d\'XP (−1 XP de groupe).':'Cette race a été cochée dans le tableur : il n\'y a pas de ligne au journal à retirer, seul le compteur change.'}</div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn" style="color:var(--bad)" data-act="creToggleOk">Décocher</button></div></div></div>`;
  }
  /* ce : modifier */
  const rlink=`<div><button class="btn ghost" data-act="rfOpen" data-id="${esc(c.id)}">Règles de la race ›</button></div>`;
  if(c.done){const ev=creEv(c.id);return head(c.nom,'Complète'+(c.date?' depuis le '+fmtDate(c.date):'')+' · +1 XP')+rlink+(ev?`<div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div>`:'')+`<div class="muted small">Pour la renommer ou la supprimer, décoche-la d'abord.</div><div class="actions"><button class="btn" data-act="closeSheet">Fermer</button>${ev?'<button class="btn pri" data-act="creSess">Enregistrer</button>':''}</div></div></div>`;}
  return head('Modifier la race','')+nameField+warn+famPick+rlink+`<div class="actions"><button class="btn pri" data-act="creSave"${g.nom.trim()&&!dup?'':' disabled'}>Enregistrer</button>${g.confirm?`<button class="btn" style="color:var(--bad)" data-act="creDelOk">Confirmer la suppression</button>`:`<button class="btn" data-act="creDel">Supprimer</button>`}<button class="btn ghost" data-act="closeSheet">Fermer</button></div></div></div>`;
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
  for(const cr of raceCres()){if(cr.id===selfId)continue;const x=raceRec(cr),i=pwSlots(x).indexOf(id);if(i>=0){const q=pwPrec(x,i);out.push(x.sing+(q?' ('+q+')':''));}}return out;}
function rfNewBlocks(g){
  const capV=(nm,i)=>{const id=nm&&capIdByName(S.capacites||{},nm),k2=id&&capOf(id);return {k2,dl:k2&&(k2.var||[]).length?`<datalist id="capv${i}">${k2.var.map(v=>`<option value="${esc(v.nom)}">`).join('')}</datalist>`:''};};
  const rows=(k,lab,ph)=>`${k==='cap'?`<datalist id="capcat">${Object.values(S.capacites||{}).map(x=>x.nom).sort((a,b)=>a.localeCompare(b,'fr')).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`:''}<div class="rgrid" style="grid-template-columns:${k==='cap'?'1fr .8fr 1.4fr auto':'1fr 1.4fr auto'}">${(g[k]||[]).map((a,i)=>{const cv=k==='cap'?capV((a[0]||'').trim(),i):null;return `<input type="text"${k==='cap'?' list="capcat"':''} data-rf2="${k}" data-i="${i}" data-p="0" value="${esc(a[0])}" placeholder="${ph}" aria-label="${lab} ${i+1}">${k==='cap'?`${cv.dl}<input type="text"${cv.dl?` list="capv${i}"`:''} data-rf2="cap" data-i="${i}" data-p="2" value="${esc(a[2]||'')}" placeholder="${cv.k2&&cv.k2.prec?'Sous-type *':'Sous-type'}" aria-label="Sous-type de la capacité ${i+1}"${cv.k2&&cv.k2.prec&&!(a[2]||'').trim()?' class="need"':''}>`:''}<input type="text" data-rf2="${k}" data-i="${i}" data-p="1" value="${esc(a[1])}" placeholder="${k==='cap'?'Description (facultatif)':'Effet (facultatif)'}" aria-label="${k==='cap'?'Description':'Effet'} ${i+1}"><button class="x" data-act="rf2Del" data-k="${k}" data-i="${i}" aria-label="Retirer">✕</button>${fxLine(g,k,a[0])}`;}).join('')||'<span class="muted small" style="grid-column:1/-1">Aucun.</span>'}</div><div class="radd"><button class="btn" data-act="rf2Add" data-k="${k}">+ Ajouter</button></div>`;
  const ch=(g.choix||[]).map((o,i)=>`<span class="rchip${o[0]==='acc'?' grp':''}">${o[0]==='acc'?'<b>accrue</b> ':''}${esc(choixFull(o))}<button data-act="rfChDel" data-i="${i}" aria-label="Retirer">✕</button></span>`).join('')||'<span class="muted small">Aucune option.</span>';
  const others=new Set((g.choix||[]).filter(o=>o[0]==='acc').map(o=>o[1]));
  let h=`<h3 class="rs">Capacités naturelles</h3>${rows('cap','Capacité','Capacité')}
    <div class="small" style="margin:8px 0 4px"><b>Choix définitif</b> <span class="muted">(une seule option à la création)</span></div><div style="display:flex;flex-wrap:wrap;gap:6px">${ch}</div>
    <div class="radd"><select data-rfk="ca" aria-label="Type d'option"><option value="acc"${g.ca==='acc'?' selected':''}>Caractéristique accrue</option><option value="cap"${g.ca==='cap'?' selected':''}>Capacité</option></select>${g.ca==='cap'?`<input type="text" list="capcat" data-rfk="cb" value="${esc(g.cb)}" placeholder="Capacité (sous-type)" style="flex:1">`:`<select data-rfk="cb" aria-label="Caractéristique"><option value="">— caractéristique —</option>${CARCOL.filter(c=>!others.has(c)).map(c=>`<option${g.cb===c?' selected':''}>${c}</option>`).join('')}</select>`}<button class="btn" data-act="rfChAdd">Ajouter</button></div>
    <h3 class="rs">Avantages féeriques</h3>${rows('av','Avantage','Avantage')}
    <h3 class="rs">Désavantages féeriques</h3>${rows('dv','Désavantage','Désavantage')}`;
  const n=(g.pw||[]).filter(s=>s[1]||(s[0]||'').trim()).length;
  const okIn=(gi,id,p)=>gi<2?pwCatK(p)==='ordinaire'&&(!pwNat(id)||pwNat(id)===(gi?'d':'m')):pwCatK(p)===(gi===2?'profond':'legendaire');
  const dls=[0,1,2,3].map(gi=>`<datalist id="pwcat${gi}">${Object.entries(S.pouvoirs||{}).filter(([id,p])=>okIn(gi,id,p)).map(([id,p])=>p.nom).sort((a,b)=>a.localeCompare(b,'fr')).map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`).join('');
  const SUBL=['pouvoirs ordinaires masqués','pouvoirs ordinaires démasqués','pouvoirs profonds uniquement','pouvoirs légendaires uniquement'];
  h+=`<h3 class="rs">Pouvoirs <span class="muted small" style="text-transform:none;letter-spacing:0;font-family:inherit">${n} / 8</span></h3>${dls}`;
  for(const [lab,a,b,sub] of PWG){const gi=a<4?0:a<6?1:a===6?2:3;h+=`<div class="small" style="margin:8px 0 4px"><b>${lab}</b><span class="muted"> · ${SUBL[gi]}${sub}</span></div>`;
    for(let i=a;i<b;i++){const s=g.pw[i]||['',false],nm=(s[0]||'').trim(),ot=s[1]?[]:pwOthers(s[0],g.id);
      const cid=nm?pwIdByName(nm):null,p=cid?pwCat(cid):null,need=p&&p.prec&&!(s[2]||'').trim(),bad=rfPwBad(g,i);
      const vl=p&&(p.var||[]).length?`<datalist id="pwv${i}">${p.var.map(v=>`<option value="${esc(v.nom)}">`).join('')}</datalist>`:'';
      let nb='';if(nm&&!cid){const nn=(g.pwn||{})[i]||{},sg=(f,opts,cur)=>`<div class="seg sm" role="group">${opts.map(([v,l])=>`<button data-act="rfPwN" data-i="${i}" data-f="${f}" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join('')}</div>`;
        nb=`<div class="pwnew"><b>Nouveau pouvoir</b><div class="small">« ${esc(nm)} » n'existe pas dans le catalogue : il y sera créé comme pouvoir <b>${CAT_L[SLOT_CAT(i)]}</b>${i<6?', '+NAT_L[SLOT_NAT(i)].toLowerCase():''}. Compléter :</div>${i>=6?`<div class="lab2">Nature <span style="color:var(--bad)">*</span></div>${sg('nat',[['m','Masqué'],['d','Démasqué']],nn.nat)}`:''}<div class="lab2">Type <span style="color:var(--bad)">*</span></div>${sg('type',EL_TYPES,nn.type)}</div>`;}
      h+=`<div class="pwrow"><input type="text" list="pwcat${gi}" data-rfpw="${i}" value="${esc(s[0])}" placeholder="${s[1]?'Inconnu (nom facultatif)':['Pouvoir ordinaire masqué…','Pouvoir ordinaire démasqué…','Pouvoir profond…','Pouvoir légendaire…'][gi]}" aria-label="${lab} ${i-a+1}"><button class="btn ghost pwunk" data-act="rfPwUnk" data-i="${i}" aria-pressed="${!!s[1]}" title="Case « inconnu » : la table voit « Inconnu », nom rempli ou non">${s[1]?'✓ ':''}Inconnu</button><button class="btn ghost pwunk" data-act="rfPwOpen" data-i="${i}" aria-expanded="${g.pwOpen===i}" title="Description et effets" aria-label="Description et effets">${g.pwOpen===i?'▴':'▾'}</button>${rfPwEye(g,i,lab)}</div>${bad?`<div class="small" style="color:var(--bad)">${esc(bad)}</div>`:''}${nb}<div class="pwq">${vl}<input type="text"${vl?` list="pwv${i}"`:''} data-rfpwq="${i}" value="${esc(s[2]||'')}" placeholder="${p&&p.prec?'Sous-type (obligatoire pour ce pouvoir)':'Sous-type (facultatif)'}" aria-label="Sous-type du pouvoir ${lab} ${i-a+1}"${need?' class="need"':''}>${need?'<span class="small" style="color:var(--bad)">sous-type à compléter</span>':''}</div>${ot.length?`<div class="muted small pwalso">aussi : ${ot.map(esc).join(', ')}</div>`:''}${g.pwOpen===i&&g.pwx&&g.pwx[i]?`<div class="pwx"><div class="lab2" style="margin-top:0">Description (commune)</div><textarea data-rfpwd="${i}" rows="3" aria-label="Description du pouvoir">${esc(g.pwx[i].desc)}</textarea><div class="lab2">Effets (communs)</div>${fxBox('pw:'+i,g.pwx[i])}${ot.length?`<div class="warn2">Partagé : modifie aussi ${ot.map(esc).join(', ')}.</div>`:''}<div class="muted small">Enregistré avec la race. Catégorie, nature, type, règles et sous-types : Paramètres › Pouvoirs.</div></div>`:''}`;}}
  h+=`<div class="muted small" style="margin-top:6px">Un pouvoir commun à plusieurs races n'est saisi qu'une fois : en tapant un nom, l'appli propose les pouvoirs connus de la bonne catégorie. Un nom inconnu crée le pouvoir dans la catégorie de l'emplacement ; un sous-type nouveau est créé dans le catalogue.</div>`;
  return h;}
/* Lot 2 : emplacements visibles par la table, vides jusqu'ici, qui reçoivent un nom sans la case « inconnu » */
function rfUnkAsk(g){const cr=g.id&&S.creatures.find(c=>c.id===g.id);if(!cr)return [];const x=raceRec(cr),e=eyeOf(cr,x),sl=pwSlots(x),out=[];
  for(let i=0;i<8;i++){const s=g.pw[i]||['',false],was=sl[i]&&sl[i]!=='?';if(e.fiche&&(e.pw||[])[i]&&!was&&(s[0]||'').trim()&&!s[1])out.push(i);}return out;}
function rfUnkBox(g){const L=g.unkAsk.map(i=>`${PW_LAB[i]} : ${(g.pw[i][0]||'').trim()}`);
  return `<div class="confirm2" role="alertdialog" aria-label="Garder ce pouvoir inconnu ?"><b>Garder ${L.length>1?'ces pouvoirs inconnus':'ce pouvoir inconnu'} ?</b><div class="muted small">${L.map(esc).join(' · ')}</div><div class="small" style="margin-top:4px">${L.length>1?'Ces emplacements sont visibles':'Ce pouvoir est visible'} par la table : son nom sera révélé.</div><div class="actions"><button class="btn ghost" data-act="rfUnkCancel">Annuler</button><button class="btn" data-act="rfUnkReveal">Révéler le nom</button><button class="btn pri" data-act="rfUnkKeep">Garder inconnu</button></div></div>`;}
/* À l'enregistrement : noms de pouvoirs → identifiants du catalogue (création des nouveaux) */
function pwToIds(pw,pwn){let cat={...(S.pouvoirs||{})},ch=false;
  const one=(nm,i)=>{if(!nm||nm==='?')return nm;let id=pwIdByNameIn(cat,nm);if(id)return id;const nn=(pwn||{})[i]||{};
    id='pw-'+(nrm(nm).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x');while(cat[id])id+='-'+Math.random().toString(36).slice(2,5);cat[id]={nom:nm,cat:SLOT_CAT(i),nat:i<6?SLOT_NAT(i):(nn.nat||''),type:nn.type||''};ch=true;return id;};
  const out={m:pw.m.map((x,j)=>one(x,j)),d:pw.d.map((x,j)=>one(x,4+j)),p:one(pw.p,6),l:one(pw.l,7)};
  if(ch)savePouvoirs(cat);return out;}
/* Contrôle d'un emplacement modifié : catégorie et nature du pouvoir, champs du nouveau pouvoir */
function rfPwBad(g,i){const s=g.pw[i]||['',false],nm=(s[0]||'').trim();if(!nm)return '';const cid=pwIdByName(nm);
  const cr=g.id&&S.creatures.find(c=>c.id===g.id),saved=cr?pwSlots(raceRec(cr))[i]:'';
  if(cid){if(cid===saved)return '';const p=pwCat(cid);if(pwCatK(p)!==SLOT_CAT(i))return `« ${p.nom} » est un pouvoir ${CAT_L[pwCatK(p)].toLowerCase()} : il ne peut pas occuper cet emplacement (${CAT_L[SLOT_CAT(i)].toLowerCase()}).`;
    const n=i<6?pwNat(cid):'';if(n&&n!==SLOT_NAT(i))return `« ${p.nom} » est un pouvoir ${NAT_L[n].toLowerCase()} : il ne peut pas occuper un emplacement ${NAT_L[SLOT_NAT(i)].toLowerCase()}.`;return '';}
  const nn=(g.pwn||{})[i]||{};if((i>=6&&!nn.nat)||!nn.type)return '';return '';}
function rfPwCheck(g){for(let i=0;i<8;i++){const b=rfPwBad(g,i);if(b)return b;const s=g.pw[i]||['',false],nm=(s[0]||'').trim();
    if(nm&&!pwIdByName(nm)){const nn=(g.pwn||{})[i]||{};if((i>=6&&!nn.nat)||!nn.type)return `Nouveau pouvoir « ${nm} » (${PW_LAB[i].toLowerCase()}) : indique sa ${i>=6&&!nn.nat?'nature et son ':''}type.`;}}return '';}
function pwIdByNameIn(cat,nm){const k=nrm(nm);for(const [id,p] of Object.entries(cat))if(nrm(p.nom)===k)return id;return null;}

/* Yeux sur la fiche (gestion) */
function rfPwEye(g,i,lab){const cr=g.id&&S.creatures.find(c=>c.id===g.id);if(!cr)return '';const x=raceRec(cr),e=eyeOf(cr,x),saved=pwSlots(x)[i];
  if(!saved)return `<button class="eye off" disabled title="Enregistrer d'abord un pouvoir (ou « Inconnu »)" aria-label="Œil indisponible : emplacement vide">${EYE_C}</button>`;
  return eyeBtn('eye',`data-id="${esc(cr.id)}" data-k="pw" data-i="${i}"`,(e.pw||[])[i],'Pouvoir '+lab+' : '+pwFull(x,i));}
function rfEyes(h,cr){const x=raceRec(cr),e=eyeOf(cr,x),[n,t]=eyeCount(e),full=eyeFull(e);
  const HD={car:'Caractéristiques',cap:'Capacités naturelles',av:'Avantages féeriques',dv:'Désavantages féeriques',pred:'Compétences utiles de prédilection (max 7)',fut:'Compétences futiles de prédilection',at:'Atouts féeriques',typ:'Spécialités typiques',sp:'Spécialités de prédilection'};
  for(const [k,l] of EYE_BLOCKS){const o=`<h3 class="rs">${HD[k]}</h3>`;h=h.replace(o,`<h3 class="rs rse"><span>${HD[k]}</span>${eyeBtn('eye',`data-id="${esc(cr.id)}" data-k="${k}"`,e[k],l)}</h3>`);}
  const o=rfTitle(S.rf);
  const sw=`<button class="cpl${full?' on':''}" data-act="raceFull" data-id="${esc(cr.id)}" role="switch" aria-checked="${full}"${full?' aria-disabled="true" title="Pour la défaire, referme un œil"':' title="Ouvre d\'un coup tous les yeux de la fiche"'}><span class="tg${full?' on':''}"></span><small>Fiche complète</small></button>`;
  h=h.replace(o,`<div class="hd2"><div style="min-width:0">${o}`);
  /* fin du bloc d'en-tête : après la ligne de sous-titre */
  const k0=h.indexOf('<div class="muted small">',h.indexOf('<div class="hd2">')),k1=h.indexOf('</div>',k0)+6;
  h=h.slice(0,k1)+`<div class="vis ${e.fiche?'v':'c'}">● ${e.fiche?'Fiche visible par la table':'Fiche cachée aux joueurs'}</div></div>${sw}</div>`+h.slice(k1);
  const bar=`<div class="eyebar${full?' full':''}"><span>${full?'★ Fiche complète : visible en entier par toute la table':`Visibilité : ${n} élément${n>1?'s':''} sur ${t} ouvert${n>1?'s':''}`}</span><span class="eyeleg">${EYE_O} toute la table · ${EYE_C} gestion seule</span></div>`;
  const k=h.indexOf('<div class="rchk">');return k>=0?h.slice(0,k)+bar+h.slice(k):h;}
/* Lecture joueur : seuls les éléments dévoilés (ou toute sa propre race, hors pouvoirs profond et légendaire) */
/* ---------- Fiche de race en consultation : 4 onglets (Portrait, Nature, Pouvoirs, Création), blocs repliables ---------- */
const RTABS=[['por','Portrait'],['nat','Nature'],['pw','Pouvoirs'],['cre','Création']];
const rTab=()=>RTABS.some(t=>t[0]===S.rfTab)?S.rfTab:'por';
const raceTabs=()=>`<div class="tabs4" role="group" aria-label="Parties de la fiche de race">${RTABS.map(([k,l])=>`<button type="button" data-act="rfTab" data-v="${k}" aria-pressed="${rTab()===k}">${l}</button>`).join('')}</div>`;
const RFOLD0={cel:true,pcs:true};
const rfFolded=k=>{const f=(S.rfFold||{})[k];return f==null?!!RFOLD0[k]:f;};
/* Un bloc : en-tête (titre, résumé, « Modifier » en mode édition, œil pour la gestion) et contenu repliable */
function rBlk(k,title,sum,body,o){o=o||{};const fold=rfFolded(k),id='rb-'+k;
  const ed=o.edit&&canEdit()?`<button type="button" class="edl" data-act="rfEdBlk" data-b="${o.edit}">${ICON.crayon} Modifier</button>`:'';
  return `<section class="rblk"><div class="rbh"><button type="button" class="rbt" data-act="rfFold" data-k="${k}" aria-expanded="${!fold}" aria-controls="${id}"><span class="tt"><span class="t">${title}</span>${sum?`<span class="n">${sum}</span>`:''}</span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button>${ed}${o.eye||''}</div>${fold?'':`<div class="rbb" id="${id}">${body}</div>`}</section>`;}
function refRead(){const g=S.rf,cr=g.id&&S.creatures.find(c=>c.id===g.id);if(!cr){S.rf=null;return viewRaces();}
  const x=raceRec(cr),r=S.races[cr.id]||{},F={trad:'Fée traditionnelle',mod:'Fée moderne',exo:'Fée exotique'},mine=myRace(x.sing);
  if(!raceVisible(cr,x)){S.rf=null;return viewRaces();}
  const G=isGest(),E=canEdit(),e=eyeOf(cr,x),full=eyeFull(e),[n,t]=eyeCount(e),tab=rTab();
  const seal='<div class="sealedbox">Pas encore découvert.</div>',none='<span class="muted small">—</span>';
  const eyeK=(k,lab)=>G?eyeBtn('eye',`data-id="${esc(cr.id)}" data-k="${k}"`,eyeIsOpen(e,k,0),lab):'';
  const vis=k=>blockVisible(cr,x,k),por=r.por||{},pv=porVisible(cr,x);
  const pc=Object.values(S.chars).filter(c=>c.race===x.sing&&vis0(c)).sort((a,z)=>(a.type===z.type?0:a.type==='PJ'?-1:1)||(a.court||'').localeCompare(z.court||''));
  const pjs=pc.filter(c=>c.type==='PJ');
  const fxs=(k,nm)=>{const L=(x.fx&&x.fx[fxKey(k,nm)])||[];return L.length?`<div class="fxl">${L.map(f=>fxChip(f)).join('')}</div>`:'';};
  const items=(l,k,sign)=>{const L=(l||[]).filter(a=>a&&a[0]);return L.length?L.map(a=>`<div class="rit">${sign?`<span class="pm ${sign}" aria-hidden="true">${sign==='p'?'+':'−'}</span>`:''}<div><b>${k==='cap'?capLk(a):esc(a[0])}</b>${a[1]?`<div class="d">${esc(a[1])}</div>`:''}${fxs(k,a[0])}</div></div>`).join(''):none;};
  /* en-tête */
  let h=`<div class="rtop"><button class="btn ghost" style="white-space:nowrap" data-act="rfBack">‹ Races</button>${E?`<button class="btn" style="white-space:nowrap" data-act="rfEdOn">${ICON.crayon} Modifier toute la fiche</button>`:''}</div>
  <div class="card rhead"><div class="rhd2">${illThumb('race',cr.id,56)}<div style="flex:1;min-width:0"><h2 class="rn2">${esc(raceNm(x))}<small>${esc(raceNmOther(x))}</small></h2><div class="muted small">${F[cr.fam]||''}${cr.done?' · <span class="rdot">✓ fiche complète</span>':''}${mine?' · ta race':''}${pjs.length?' · '+pjs.map(c=>lk({t:'perso',id:c.id},c.court)).join(', '):''}</div></div>${kankaBtn(x.kanka,x.sing,'Fiche Kanka : '+x.sing)}</div>
  ${pv&&(por.acc||'').trim()?`<div class="racc">${esc(por.acc)}</div>`:''}${E?`<div style="margin-top:6px"><button type="button" class="edl" data-act="rfEdBlk" data-b="id">${ICON.crayon} Nom, famille, Kanka</button></div>`:''}`;
  if(G)h+=`<div class="hd2" style="margin-top:8px"><div class="vis ${e.fiche?'v':'c'}" style="display:flex;align-items:center;gap:6px">${eyeBtn('eye',`data-id="${esc(cr.id)}" data-k="fiche"`,e.fiche,'Fiche '+x.sing)} ${e.fiche?'Fiche visible par la table':'Fiche cachée aux joueurs'}</div><button class="cpl${full?' on':''}" data-act="raceFull" data-id="${esc(cr.id)}" role="switch" aria-checked="${full}"${full?' aria-disabled="true"':''}><span class="tg${full?' on':''}"></span><small>Fiche complète</small></button></div>
    <div class="rgau"><span>Visibilité</span><span class="gau"><i style="width:${Math.round(100*n/t)}%"></i></span><b>${n} / ${t}</b></div>`;
  h+=`</div>${raceTabs()}`;
  /* onglets */
  if(tab==='por'){
    if(G)h+=`<div class="rporv">${eyeBtn('eye',`data-id="${esc(cr.id)}" data-k="por"`,!!e.por,'Portrait')} <span class="small">${e.por?'Portrait visible par la table':'Portrait caché aux joueurs'} <span class="muted">(sans effet sur l'XP)</span></span></div>`;
    if(E&&S.rfPor)h+=rPorForm();
    else if(!pv)h+=seal;
    else{const kv=(l,v)=>(v||'').trim()?`<div class="rkv"><span>${l}</span><div>${esc(v)}</div></div>`:'';
      const desc=kv('Apparence',por.app)+kv('Taille',por.tai)+kv('Sexe',por.sexe)+kv('Reproduction',por.rep)+kv('Habitat privilégié',por.hab);
      const ed={edit:'por'};
      h+=rBlk('desc','Description','',desc||none,ed)+rBlk('carac','Caractère','',(por.car||'').trim()?`<div class="small" style="white-space:pre-line">${esc(por.car)}</div>`:none,ed);
      const cel=(por.cel||'').split(/\s*;\s*/).map(s=>s.trim()).filter(Boolean);
      h+=rBlk('cel','Figures célèbres',cel.length?String(cel.length):'',cel.length?`<ul class="rdl">${cel.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`:none,ed);}
    const I=(r.infos||[]).filter(i=>G||!i.cache);
    if(E)h+=rBlk('inf','Informations complémentaires',String((r.infos||[]).length),rInfEdit(r));
    else if(I.length)h+=rBlk('inf','Informations complémentaires',String(I.length),I.map(i=>`<div class="fi"><b>${esc(i.lab||'')}</b>${i.cache?' <span class="tag2">masquée</span>':''}<div class="s">${esc(i.txt||'')}</div></div>`).join(''));
    h+=rBlk('pcs','Personnages de cette race',String(pc.length),pc.length?pc.map(c=>`<div class="lkr"><span>${lk({t:'perso',id:c.id},c.court)}</span><span class="muted small">${c.type}${c.type==='PJ'&&owners(c).length?' · '+esc(owners(c).map(p=>p.nom).join(', ')):''}${c.cache?' · masqué':''}</span></div>`).join(''):none);}
  else if(tab==='nat'){
    const ch=(x.choix||[]).length?`<div class="sub2">Choix définitif (une seule option)</div><div style="display:flex;flex-wrap:wrap;gap:6px">${x.choix.map(o=>`<span class="rchip${o[0]==='acc'?' grp':''}">${o[0]==='acc'?'<b>accrue</b> '+esc(choixFull(o)):capLk([o[1],'',o[2]])}</span>`).join('')}</div>`:'';
    const nb=k=>String(((x[k]||[]).filter(a=>a&&a[0])).length);
    h+=rBlk('av','Avantages',nb('av'),vis('av')?items(x.av,'av','p'):seal,{edit:'av',eye:eyeK('av','Avantages féeriques')});
    h+=rBlk('dv','Désavantages',nb('dv'),vis('dv')?items(x.dv,'dv','n'):seal,{edit:'dv',eye:eyeK('dv','Désavantages féeriques')});
    h+=rBlk('cap','Capacités naturelles',nb('cap')+((x.choix||[]).length?' + choix':''),vis('cap')?items(x.cap,'cap')+ch:seal,{edit:'cap',eye:eyeK('cap','Capacités naturelles')});}
  else if(tab==='pw'){const sl=pwSlots(x);
    for(const [lab,a,b] of PWG){let body='',kn=0;
      for(let i=a;i<b;i++){const v=pwVisible(cr,x,i),u=pwUnk(x,i);if(v&&sl[i]&&sl[i]!=='?'&&(G||!u))kn++;
        body+=`<div class="rslot${v?'':' hid'}"><span>${v?(u&&!G?'<span class="mq-unk">Inconnu</span>':sl[i]&&sl[i]!=='?'?pwLk(x,i)+(u?' <i class="muted small">(inconnu pour la table)</i>':''):u?'<span class="mq-unk">Inconnu</span>':'<span class="mq-unk">—</span>'):'<span class="mq-unk">Scellé</span>'}</span>${G?rfPwEye(S.rf,i,PW_LAB[i]):''}</div>`;}
      h+=rBlk('pw'+a,lab,`${kn} / ${b-a}`,body,{edit:'pw'});}}
  else{/* Création */
    const C=x.car;h+=rBlk('car','Caractéristiques','min – max',vis('car')?(C?`<div class="rcg">${CARCOL.map(k=>{const v=C[k]||['',''];return `<div><span>${k}</span><b>${esc(v[0])} – ${esc(v[1])}</b></div>`;}).join('')}</div>`:none):seal,{edit:'car',eye:eyeK('car','Caractéristiques')});
    const T=r.traits||[];
    h+=rBlk('tr','Traits de caractère de la race',T.length?'1 à choisir':'',(T.length?`<div class="rtl">${T.map((t2,i)=>`<div class="rtr"><i aria-hidden="true"></i><span>${esc(t2)}</span>${E?`<button class="lnk-bad" data-act="rfTrDel" data-i="${i}" aria-label="Retirer ${esc(t2)}">✕</button>`:''}</div>`).join('')}</div><div class="muted small">Le trait de race du personnage est pris dans cette liste.</div>`:none)+(E?`<div class="radd"><input type="text" data-rftr="1" value="${esc(S.rfTrNew||'')}" placeholder="Nouveau trait…" aria-label="Nouveau trait"><button class="btn" data-act="rfTrAdd">Ajouter</button></div>`:''));
    h+=rBlk('comp','Compétences de prédilection','par profil',rCompBlock(x,G,vis),{edit:'comp',eye:eyeK('comp','Compétences de prédilection')});
    const at=(x.at||[]).filter(a=>a&&a[0]),ty=(x.typ||[]).filter(t2=>t2&&t2[0]);
    let ab=vis('at')?at.map(a=>`<div class="rit"><div><b>${esc(a[0])}</b>${a[1]?`<div class="d">${esc(a[1])}</div>`:''}${fxs('at',a[0])}</div></div>`).join(''):seal;
    if(ty.length&&(vis('typ')))ab+=`<div class="rit"><div><b>${TYP}</b><div class="d">${ty.map(t2=>esc(t2[0])+(t2[1]?' (dans '+esc(t2[1])+')':'')).join(' et ')}</div></div></div>`;
    const na=at.length+(ty.length?1:0);
    h+=rBlk('at','Atouts féeriques',na?`2 à choisir parmi ${na}`:'',na?ab:(vis('at')?none:seal),{edit:'atyp',eye:eyeK('atyp','Atouts féeriques')});}
  return h;}
const vis0=c=>vis(c);
/* Compétences de prédilection regroupées par profil, avec leurs spécialités offertes */
function rCompBlock(x,G,vis){const sg=v=>nrm(v).replace(/s$/,''),prof=c=>{const k=sg(Array.isArray(c)?c[0]:c);for(const [p,L] of Object.entries(PROFCOMPS))if(L.some(z=>sg(z)===k))return p;return 'Autres';};
  const nm=c=>Array.isArray(c)?c.map(esc).join(' <i class="muted">ou</i> '):esc(c);
  const sp=(vis('sp')?(x.sp||[]):[]).filter(e=>e&&e[0]),spf=(vis('sp')?(x.spf||[]):[]).filter(e=>e&&e[0]),used=new Set();
  const spOf=(c,L)=>{const names=(Array.isArray(c)?c:[c]).map(nrm);return L.map((e,i)=>[e,i]).filter(([e])=>names.includes(nrm(e[1]||''))).map(([e,i])=>{used.add(L===sp?'u'+i:'f'+i);return 'spécialité offerte : '+esc(e[0])+(e[2]?' ('+esc(e[2])+')':'');});};
  const row=(c,L)=>{const s=spOf(c,L);return `<div class="rcomp"><span>${nm(c)}${Array.isArray(c)?' <span class="muted small">au choix</span>':''}${s.length?`<span class="sp">${s.join(' · ')}</span>`:''}</span></div>`;};
  let h='';
  if(vis('pred')){const grp={};for(const c of (x.pred||[]))(grp[prof(c)]=grp[prof(c)]||[]).push(c);
    for(const p of [...Object.keys(PROFCOMPS),'Autres'])if(grp[p])h+=`<div class="rgrp">${p==='Erudit'?'Érudit':p}</div>`+grp[p].map(c=>row(c,sp)).join('');}
  else h+='<div class="sealedbox">Compétences utiles : pas encore découvertes.</div>';
  if(vis('fut')){if((x.fut||[]).length)h+=`<div class="rgrp">Futiles</div>`+x.fut.map(c=>row(c,spf)).join('');}
  else h+='<div class="sealedbox">Compétences futiles : pas encore découvertes.</div>';
  const rest=[...sp.map((e,i)=>['u'+i,e]),...spf.map((e,i)=>['f'+i,e])].filter(([k])=>!used.has(k));
  if(rest.length)h+=`<div class="rgrp">Autres spécialités offertes</div>`+rest.map(([,e])=>`<div class="rcomp"><span>${esc(e[0])}${e[1]?' <span class="muted small">('+esc(e[1])+')</span>':''}</span></div>`).join('');
  return h||'<span class="muted small">—</span>';}
/* Portrait : formulaire (mode édition) */
const POR_F=[['acc','Accroche (une ou deux phrases, en tête de fiche)',1],['app','Apparence',1],['tai','Taille',0],['sexe','Sexe',0],['rep','Mode de reproduction',0],['hab','Habitat privilégié',1],['car','Caractère',1],['cel','Figures célèbres (séparées par « ; »)',1]];
function rPorForm(){const d=S.rfPor||{};return `<section class="rblk"><div class="rbh"><span class="rbt"><span class="t">Portrait</span></span></div><div class="rbb">${POR_F.map(([k,l,ta])=>`<div class="field"><label for="rpor-${k}">${l}</label>${ta?`<textarea id="rpor-${k}" rows="2" data-rfpor="${k}">${esc(d[k]||'')}</textarea>`:`<input id="rpor-${k}" type="text" data-rfpor="${k}" value="${esc(d[k]||'')}">`}</div>`).join('')}<div class="actions"><button class="btn ghost" data-act="rfPorCancel">Annuler</button><button class="btn pri" data-act="rfPorSave">Enregistrer</button></div></div></section>`;}
function rInfEdit(r){return (r.infos||[]).map((i,k)=>`<div class="rinf"><div class="frow"><div class="field"><label for="ril${k}">Intitulé</label><input id="ril${k}" type="text" data-rfi="${k}" data-f="lab" value="${esc(i.lab||'')}"></div><div style="display:flex;gap:6px;align-items:flex-end">${eyeBtn('riEye',`data-i="${k}"`,!i.cache,i.lab||'Information')}<button class="btn ghost" data-act="rfInfDel" data-i="${k}" aria-label="Supprimer l'information">✕</button></div></div>
    <div class="field"><label for="rit${k}">Texte</label><textarea id="rit${k}" rows="2" data-rfi="${k}" data-f="txt">${esc(i.txt||'')}</textarea></div></div>`).join('')+`<button class="btn ghost" data-act="rfInfAdd">+ Information</button>`;}

/* Confirmation d'un œil de fiche de race */
function eyeRaceSheet(g){const cr=S.creatures.find(c=>c.id===g.id);if(!cr)return null;const x=raceRec(cr),e=eyeOf(cr,x),e2=clone(e);
  if(g.k==='all')Object.assign(e2,eyeAll(true));else eyeApply(e2,g.k,g.i,g.open);
  const wasFull=eyeFull(e),isFull=eyeFull(e2),[n2,t]=eyeCount(e2),np=allPJ().length;
  const nClosed=eyeCount(e)[1]-eyeCount(e)[0];
  if(g.k==='all')return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Confirmation"><div class="in"><div><h2>Marquer « ${esc(x.sing)} » comme complète ?</h2><div class="muted">${nClosed===1?'Le dernier élément encore fermé devient visible':`Les ${nClosed} éléments encore fermés deviennent visibles`} par toute la table${e.fiche?'':', y compris la fiche dans la liste'}.</div></div><div class="xpbox">★ +${+PRM.creXP||1} XP de groupe pour ${np} PJ actif${np>1?'s':''} (journal : « ${esc(cr.nom)} complété », Race de l'univers).</div><div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div><div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="eyeOk">Confirmer</button></div></div></div>`;
  const lab=g.k==='fiche'?'Fiche '+x.sing:g.k==='pw'?'Pouvoirs › '+(pwSlots(x)[g.i]==='?'?'Inconnu ('+PW_LAB[g.i].toLowerCase()+')':pwFull(x,g.i)):(EYE_LABELS[g.k]||(EYE_BLOCKS.find(b=>b[0]===g.k)||[,g.k])[1]);
  const txt=g.open?(g.k==='fiche'?`La fiche ${esc(x.sing)} apparaîtra dans Univers › Races pour toute la table, avec les éléments déjà dévoilés.`:`Cet élément de la fiche <b>${esc(x.sing)}</b> deviendra visible par toute la table${e.fiche?'':', dès que la fiche elle-même sera dévoilée'}.`)
    :(g.k==='fiche'?`La fiche ${esc(x.sing)} ne sera plus visible que par la gestion et par les joueurs de cette race.`:`Cet élément ne sera plus visible que par les personnes ayant les droits de gestion${g.k==='pw'&&g.i<6?' (et par les joueurs de cette race)':''}.`);
  let xp;
  if(isFull&&!wasFull)xp=`<div class="xpbox">★ La fiche ${esc(x.sing)} devient complète : +1 XP de groupe pour ${np} PJ actif${np>1?'s':''} (journal : « ${esc(cr.nom)} complété », Race de l'univers).</div><div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div>`;
  else if(wasFull&&!isFull)xp=`<div class="xpbox neg">⚠ La fiche ${esc(x.sing)} n'est plus complète : −1 XP de groupe pour les PJ actifs${cr.date?' (ligne retirée du journal)':' (reprise du tableur : pas de ligne au journal, seul le compteur change)'}.</div>`;
  else xp=`<div class="muted small">Pas d'effet sur l'XP${isFull?'':` : ${t-n2} élément${t-n2>1?'s':''} encore fermé${t-n2>1?'s':''} avant la fiche complète`}.</div>`;
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Confirmation"><div class="in"><div><h2>${g.open?'Dévoiler':'Masquer'} « ${esc(lab)} » ?</h2><div class="muted">${txt}</div></div>${xp}<div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="eyeOk">Confirmer</button></div></div></div>`;}

/* Effets (moteur de bonus) sous chaque capacité, avantage, désavantage et atout */
function fxChip(e,del){const cls=e.t==='rap'?'note':e.t==='perm'?'calc':(+e.val<0?'neg':'jet');
  return `<span class="bn ${cls}" title="${esc(FX_T[e.t]+(e.txt&&e.t!=='rap'?' · '+e.txt:'')+' · '+FX_Q[fxQ(e.quand)])}">${esc(fxLabel(e))}${fxQ(e.quand)==='d'?` <small>· démasqué</small>`:''}${del||''}</span>`;}
function fxLine(g,k,name){if(!(name||'').trim())return '';const key=fxKey(k,name),L=(g.fx&&g.fx[key])||[],ed=g.fxEd&&g.fxEd.key===key?g.fxEd:null;
  let h=`<div class="fxl">${L.map((e,j)=>fxChip(e,`<button data-act="rfFxDel" data-key="${esc(key)}" data-j="${j}" aria-label="Retirer l'effet">✕</button>`)).join('')}${ed?'':`<button class="fxadd" data-act="rfFxNew" data-k="${k}" data-n="${esc(name)}">+ Effet</button>`}</div>`;
  if(ed){const seg=(act,cur,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button data-act="${act}" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join('')}</div>`;
    const opt=(v,l,cur)=>`<option value="${esc(v)}"${cur===v?' selected':''}>${esc(l)}</option>`;
    let body='';
    if(ed.t==='perm')body=`<div class="lab">Valeur modifiée</div><div class="f"><select data-rffx="cible" aria-label="Valeur modifiée"><option value="">— choisir —</option><optgroup label="Caractéristiques">${CARCOL.map(c=>opt('car:'+c,c,ed.cible)).join('')}</optgroup><optgroup label="Compétences">${COMPS_ALL.map(c=>opt('comp:'+c,c,ed.cible)).join('')}</optgroup><optgroup label="Valeurs dérivées">${FX_DER.map(c=>opt('der:'+c,c,ed.cible)).join('')}</optgroup>${opt('fortune','Fortune',ed.cible)}</select><input type="number" data-rffx="val" value="${esc(ed.val)}" style="max-width:70px" aria-label="Valeur"></div>`;
    else if(ed.t==='jet')body=`<div class="lab">Jet concerné et valeur</div><div class="f"><select data-rffx="cible" aria-label="Jet concerné">${opt('','Jet en situation',ed.cible)}<optgroup label="Compétences">${COMPS_ALL.map(c=>opt(c,c,ed.cible)).join('')}</optgroup><optgroup label="Caractéristiques">${CARCOL.map(c=>opt(c,c,ed.cible)).join('')}</optgroup></select><input type="number" data-rffx="val" value="${esc(ed.val)}" style="max-width:70px" aria-label="Valeur"></div><div class="f" style="margin-top:6px"><input type="text" data-rffx="txt" value="${esc(ed.txt)}" placeholder="Condition (ex. pour se cacher dans l'obscurité)" aria-label="Condition"></div>`;
    else body=`<div class="lab">Texte du rappel</div><div class="f"><input type="text" data-rffx="txt" value="${esc(ed.txt)}" placeholder="ex. Immunité à l'électricité" aria-label="Texte du rappel"></div>`;
    const ok=ed.t==='rap'?(ed.txt||'').trim():ed.t==='perm'?ed.cible&&+ed.val:+ed.val;
    h+=`<div class="fxed"><div style="font-weight:600;font-size:14px">Nouvel effet de « ${esc(name)} »</div><div class="lab">Sorte d'effet</div>${seg('rfFxT',ed.t,[['perm','Permanent'],['jet','Jet'],['rap','Rappel']])}${body}<div class="lab">Quand</div>${seg('rfFxQ',fxQ(ed.quand),[['m','Masqué'],['d','Démasqué']])}
      <div class="actions" style="margin-top:10px"><button class="btn ghost" data-act="rfFxCancel">Annuler</button><button class="btn pri" data-act="rfFxAdd"${ok?'':' disabled'}>Ajouter</button></div>
      <div class="hint"><b>Permanent</b> : ajouté à la valeur sur la fiche des personnages créés à partir de maintenant. <b>Jet</b> : bonus ou malus à un type de jet, affiché sur la fiche mais pas ajouté aux rangs. <b>Rappel</b> : texte seul. Pense ensuite à « Enregistrer la race ».</div></div>`;}
  return `<div style="grid-column:1/-1">${h}</div>`;}

/* ---------- Univers › Races : liste par famille, œil de fiche (gestion), compteur d'XP ---------- */
function viewRaces(){if(!S.creaturesReady||!S.racesReady||!S.pouvoirsReady)return `<div class="card empty">Chargement des races…</div>`;
  if(S.rf){if(S.rf.hum)return viewRef();return viewRef();}
  const G=isGest(),rows=refRows(),n=S.creatures.filter(c=>c.done).length,xp=+PRM.creXP||1;
  let h=`<div class="card secsum"><div style="display:flex;align-items:baseline;gap:10px"><span class="big num">${n*xp}</span><span>XP de groupe<br>issue des races</span></div><div class="muted small" style="text-align:right">${n} complète${n>1?'s':''} sur ${S.creatures.length}<br>${xp} XP par fiche complète</div></div>`;
  if(G)h+=`<div class="muted small" style="margin:8px 2px">L'œil de la liste rend la fiche visible par toute la table ; elle s'ouvre alors avec les seuls éléments dévoilés.</div>`;
  for(const [f,lab] of CFAM){const L=rows.filter(r=>r.cr.fam===f);if(!L.length)continue;
    h+=`<h2>${lab}</h2><div class="card" style="padding:2px 12px">`+L.map(r=>{const e=eyeOf(r.cr,r.x),[o,t]=eyeCount(e),full=eyeFull(e);
      const pill=full?'<span class="rst ok">★ Complète</span>':G?(e.fiche?`<span class="rst mid">${o} / ${t}</span>`:'<span class="rst no">Cachée</span>'):'<span></span>';
      return `<div class="lr lri">${illSlot('race',r.cr.id,r.x.sing,36)}<button class="nm" data-act="rfOpen" data-id="${esc(r.cr.id)}"><b>${esc(raceNm(r.x))}${esc(raceNmOther(r.x))}</b>${r.pj.length?` <span class="rpj">· ${r.pj.map(c=>esc(c.court)).join(', ')}</span>`:''}</button>${pill}${G?eyeBtn('eye',`data-id="${esc(r.cr.id)}" data-k="fiche"`,e.fiche,'Fiche '+r.x.sing):'<span></span>'}</div>`;}).join('')+`</div>`;}
  if(!rows.length)h+=`<div class="card empty" style="margin-top:12px">Aucune race découverte pour l'instant.</div>`;
  const pn=Object.values(S.chars).filter(isHum);
  h+=`<h2>Hors féerie</h2><div class="card" style="padding:2px 12px"><div class="lr"><button class="nm" data-act="rfHum"><b>${HUMAIN}</b>${pn.length?` <span class="rpj">· ${pn.map(c=>esc(c.court)).join(', ')}</span>`:''}</button><span class="muted small">règles</span><span></span></div></div>`;
  if(canEdit())h+=`<div class="actions" style="margin-top:12px"><button class="btn pri cta" data-act="rfNew">+ Nouvelle race</button></div>`;
  return h;}
/* ---------- Lot 4 : fiche de race, onglet Informations (traits de caractère, informations libres) ---------- */
const RI_ACTS=new Set(['rfTab','rfTrAdd','rfTrDel','rfInfAdd','rfInfDel','riEye','riEyeOk','rfFold','rfEdBlk','rfPorSave','rfPorCancel']);
function raceInfoSave(id,fn){const r0=S.races[id];if(!r0)return false;const r=clone(r0);fn(r);saveRaces({...S.races,[id]:r});return true;}
function riAct(a,d){const g=S.rf;if(!g)return false;if(a==='rfTab'){S.rfTab=d.v;return;}
  if(a==='rfFold'){S.rfFold={...(S.rfFold||{}),[d.k]:!rfFolded(d.k)};return;}
  if(!canEdit())return false;const id=g.id;
  if(a==='rfEdBlk'){if(d.b==='por'){S.rfPor={...((S.races[id]||{}).por||{})};S.edDirty=false;return;}S.rf=rfDraft(id);S.rfEd=true;S.rfBlk=d.b;S.edDirty=false;window.scrollTo(0,0);return;}
  if(a==='rfPorCancel'){S.rfPor=null;S.edDirty=false;return;}
  if(a==='rfPorSave'){const d2=S.rfPor||{},o={};for(const [k] of POR_F){const v=(d2[k]||'').trim();if(v)o[k]=v;}raceInfoSave(id,r=>{r.por=o;});S.rfPor=null;setTimeout(()=>toast('Enregistré'),0);return;}
  if(a==='rfTrAdd'){const v=(S.rfTrNew||'').trim();if(!v)return;raceInfoSave(id,r=>{r.traits=r.traits||[];if(!r.traits.some(x=>nrm(x)===nrm(v)))r.traits.push(v);});S.rfTrNew='';}
  else if(a==='rfTrDel')raceInfoSave(id,r=>{r.traits=(r.traits||[]).filter((x,i)=>i!==+d.i);});
  else if(a==='rfInfAdd')raceInfoSave(id,r=>{r.infos=[...(r.infos||[]),{id:'i'+Date.now().toString(36),lab:'',txt:'',cache:true}];});
  else if(a==='rfInfDel')raceInfoSave(id,r=>{r.infos=(r.infos||[]).filter((x,i)=>i!==+d.i);});
  else if(a==='riEye'){const i=((S.races[id]||{}).infos||[])[+d.i];if(!i)return;S.dlg={kind:'riEye',id,i:+d.i,open:!!i.cache};}
  else if(a==='riEyeOk'){const e=S.dlg;S.dlg=null;if(e&&e.kind==='riEye')raceInfoSave(e.id,r=>{const i=(r.infos||[])[e.i];if(i)i.cache=!e.open;});}}
function riInput(t,ev){const D=t.dataset;if(D.rfpor!==undefined&&S.rfPor){S.rfPor[D.rfpor]=t.value;return true;}if(D.rftr!==undefined){S.rfTrNew=t.value;return true;}
  if(D.rfi!==undefined&&S.rf){if(ev==='change'&&canEdit())raceInfoSave(S.rf.id,r=>{const i=(r.infos||[])[+D.rfi];if(i)i[D.f]=t.value.trim();});return true;}return false;}
const riEyeSheet=g=>{const i=((S.races[g.id]||{}).infos||[])[g.i]||{};return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Confirmation"><div class="in"><div><h2>${g.open?'Rendre visible':'Masquer'} « ${esc(i.lab||'Information')} » ?</h2></div><div class="muted small">${g.open?'Toute la table pourra lire cette information.':'Seules les personnes ayant les droits de gestion la verront.'}</div><div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="riEyeOk">Confirmer</button></div></div></div>`;};
/* Mode édition : « Modifier » d'un bloc n'ouvre que ce bloc de l'éditeur (mêmes champs, même enregistrement) */
const RF_BLK={id:['Identité'],car:['Caractéristiques'],comp:['Compétences utiles','Compétences futiles','Spécialités de prédilection'],atyp:['Atouts féeriques','Spécialités typiques'],cap:['Capacités naturelles'],av:['Avantages féeriques'],dv:['Désavantages féeriques'],pw:['Pouvoirs']};
function rfBlkOnly(h,b){const keep=RF_BLK[b];if(!keep)return h;const end=h.indexOf('<div class="actions" style="margin-top:14px">');const unk=h.lastIndexOf('<div class="rfunk',end);const stop=unk>0&&unk<end?unk:end;if(end<0)return h;
  const first=h.indexOf('<h3 class="rs');if(first<0||first>stop)return h;
  const parts=h.slice(first,stop).split(/(?=<h3 class="rs)/),title=p=>p.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  let head=h.slice(0,first);const ck=head.indexOf('<div class="rchk">');if(ck>=0){const ce=head.indexOf('</div></div>',ck);/* liste ✓/✗ retirée en édition d'un bloc */if(ce>0)head=head.slice(0,ck)+head.slice(ce+12);}
  return head+parts.filter(p=>keep.some(k=>title(p).startsWith(k))).join('')+h.slice(stop);}
