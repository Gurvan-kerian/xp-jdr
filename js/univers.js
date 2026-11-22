/* La belle appli — Univers : secrets et créatures */
/* ---------- Univers › Secrets ---------- */
const ICON={
  crayon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  ref:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/><path d="M12 13h6M12 16h6"/></svg>',
  xp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
  perso:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>',
  univers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4a8 8 0 1 0 5 13.5A7 7 0 0 1 15 4z"/><path d="M18 3v4M16 5h4"/></svg>',
  equipe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M3 20c1-3.5 3.5-5 6-5s5 1.5 6 5"/><path d="M15.5 14.6c2.6-.3 4.6 1.2 5.5 4.4"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  joueurs:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3.5"/><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  regles:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9 8h6"/></svg>',
  medaille:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.5l4 6.5 4-6.5"/><circle cx="12" cy="15" r="6"/><path d="M12 11.6l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/></svg>',
  masque:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5c5 1.6 11 1.6 16 0v6.5c0 5-3.6 8.5-8 8.5s-8-3.5-8-8.5z"/><path d="M7.5 10.5c.8-.8 2-.8 2.8 0M13.7 10.5c.8-.8 2-.8 2.8 0"/><path d="M9 14.5c1.7 1.6 4.3 1.6 6 0"/></svg>',
  livre:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5C9.5 4.8 6.5 4.3 3 4.7V18c3.5-.4 6.5.1 9 1.8 2.5-1.7 5.5-2.2 9-1.8V4.7c-3.5-.4-6.5.1-9 1.8z"/><path d="M12 6.5v13.3"/></svg>',
  calp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/><path d="M9 14.5l2 2 4-4"/></svg>',
  groupe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.8-5.2 6.5-5.2s5.5 1.7 6.5 5.2"/><circle cx="17" cy="9" r="2.8"/><path d="M16 14.5c2.5 0 4.6 1.3 5.5 4"/></svg>',
  de:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5l8.5 8.2L12 21.5 3.5 10.7z" fill="currentColor" fill-opacity=".14"/><path d="M12 2.5l-3.6 9.3L12 14.2l3.6-2.4z" fill="currentColor" fill-opacity=".35"/><path d="M3.5 10.7l4.9 1.1M20.5 10.7l-4.9 1.1M12 14.2v7.3"/></svg>',
  baguette:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20.5L14.5 10"/><path d="M17 3l.9 2.3 2.3.9-2.3.9L17 9.4l-.9-2.3-2.3-.9 2.3-.9z"/><path d="M20.5 11v2M19.5 12h2"/></svg>',
  soleil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
  lune:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  kanka:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2z"/><path d="M5 19.5a2 2 0 0 0 2 2h12v-4"/></svg>'
};
const SEC_TYPE="Secret de l'univers";
let SEC_BONUS=4;
const SKIND={titre:{nom:'Titre',pts:1},vm:{nom:'Vérité majeure',pl:'Vérités majeures',pts:3,g:'◆',o:'◇'},vmin:{nom:'Vérité mineure',pl:'Vérités mineures',pts:2,g:'●',o:'○'},h:{nom:'Indice',pl:'Indices',pts:1,g:'■',o:'□'}};
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII'];
/* Contenu repris du tableur « Secrets d'Héritiers » : emplacements fixes, null = encore scellé */
/* Œil : un élément préparé par la gestion porte hid:true (titre : titreHid) ; il ne compte ni pour l'XP ni pour les joueurs */
const sVis=x=>!!x&&!x.hid;
const titreVis=s=>!!s.titre&&!s.titreHid;
const secLabel=(s,all)=>'Secret '+(ROMAN[s.n-1]||s.n)+((all?s.titre:titreVis(s))?' - '+s.titre:'');
const secCount=(s,k)=>{const a=(s.slots&&s.slots[k])||[];return [a.filter(sVis).length,a.length];};
const secHid=(s,k)=>((s.slots&&s.slots[k])||[]).filter(x=>x&&x.hid).length;
const secFree=(s,k)=>k==='titre'?(s.titre?0:1):((s.slots&&s.slots[k])||[]).filter(x=>!x).length;
const secComplete=s=>{const [f,t]=secCount(s,'vm');return t>0&&f===t;};
function secPts(s){let p=titreVis(s)?(s.titrePts||1):0;for(const k of ['vm','vmin','h'])for(const x of (s.slots[k]||[]))if(sVis(x))p+=x.pts||0;if(s.bonus)p+=SEC_BONUS;return p;}
function secPips(s,k){const [f,t]=secCount(s,k),K=SKIND[k];return t?K.g.repeat(f)+K.o.repeat(t-f):'—';}
const secById=n=>S.secrets.find(s=>s.n===n);
function viewUnivers(){
  let h=`<div class="subtabs" role="group" aria-label="Sections de l'univers"><button data-act="uni" data-v="secrets" aria-pressed="${S.uni!=='creatures'}">Secrets${propBadge()?`<span class="bdg" aria-label="${propBadge()} proposition${propBadge()>1?'s':''} en attente">${propBadge()}</span>`:''}</button><button data-act="uni" data-v="creatures" aria-pressed="${S.uni==='creatures'}">Races</button></div>`;
  if(S.uni==='creatures')return h+viewRaces();
  if(!S.secretsReady)return h+`<div class="card empty">Chargement des secrets…</div>`;
  const s=S.sec!=null&&secById(S.sec);
  return h+(s?viewSecret(s):viewSecretList());
}
function viewSecretList(){
  const L=S.secrets,tot=L.reduce((a,s)=>a+secPts(s),0),nt=L.filter(titreVis).length,nb=L.filter(s=>s.bonus).length,f=S.secFilter||'all';
  let h=`<div class="card secsum"><div style="display:flex;align-items:baseline;gap:10px"><span class="big num">${tot}</span><span>XP de groupe<br>issue des secrets</span></div><div class="muted small" style="text-align:right">${nt}/${L.length} titres<br>${nb} bonus de secret complété</div></div>`;
  h+=`<div class="chips" style="margin-top:12px">${[['all','Tous',L.length],['open','Révélés',nt],['sealed','Scellés',L.length-nt]].map(([k,l,n])=>`<button class="chip" data-act="secFilter" data-v="${k}" aria-pressed="${f===k}">${l} · ${n}</button>`).join('')}</div>`;
  h+=`<div class="legend"><span><span class="g-vm">◆</span> vérité majeure +3</span><span><span class="g-vmin">●</span> mineure +2</span><span><span class="g-h">■</span> indice +1</span><span>titre +1 · bonus +${SEC_BONUS}</span></div>`;
  const shown=L.filter(s=>f==='all'||(f==='open'?titreVis(s):!titreVis(s)));
  h+=`<div class="secgrid">`+shown.map(s=>{
    const row=k=>{const [a,t]=secCount(s,k);return `<span class="pp"><span class="g-${k}" aria-hidden="true">${secPips(s,k)}</span><span class="muted">${t?a+'/'+t:''}</span></span>`;};
    const nh=isGest()?['vm','vmin','h'].reduce((a,k)=>a+secHid(s,k),0)+(s.titre&&s.titreHid?1:0):0,tv=titreVis(s)||(isGest()&&s.titre);
    return `<button class="card sec${titreVis(s)?'':' sealed'}" data-act="secOpen" data-n="${s.n}" aria-label="${esc(secLabel(s))}, ${secPts(s)} XP"><span class="hd"><span class="rn">${ROMAN[s.n-1]}${isGest()&&propsOf(s.n).some(p=>p.st==='att')?`<span class="bdg" aria-label="proposition en attente">${propsOf(s.n).filter(p=>p.st==='att').length}</span>`:''}</span><span class="num">${secPts(s)} XP</span></span><span class="tt">${tv?esc(s.titre)+(titreVis(s)?'':' <span class="muted small">(caché)</span>'):'Titre à découvrir'}</span>${row('vm')}${row('vmin')}${row('h')}${s.bonus?'<span class="small done">Bonus remporté</span>':''}${nh?`<span class="small muted">${EYE_C} ${nh} élément${nh>1?'s':''} préparé${nh>1?'s':''}, caché${nh>1?'s':''}</span>`:''}</button>`;
  }).join('')+`</div>`;
  return h;
}
function viewSecret(s){
  const [vf,vt]=secCount(s,'vm');
  let h=`<button class="back" data-act="secBack"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Tous les secrets</button>`;
  h+=`<div class="sechead" id="seck-titre"><div><div class="rn">SECRET ${ROMAN[s.n-1]}</div><h2>${titreVis(s)||(isGest()&&s.titre)?esc(s.titre):'<span class="muted">Titre à découvrir</span>'}</h2></div><span class="pts num">${secPts(s)} XP</span></div>`;
  const tEye=isGest()&&s.titre?eyeBtn('eye',`data-t="sec" data-n="${s.n}" data-k="titre" data-i="0"`,!s.titreHid,'Titre du secret'):'';
  h+=titreVis(s)||(isGest()&&s.titre)?`<div class="fwrap${s.titreHid?' hid':''}"><${canEdit()?'button':'div'} class="found" style="padding-top:2px"${canEdit()?' data-act="secEntry" data-k="titre" data-i="0"':''}><span class="muted small">${s.titreHid?'Titre préparé, caché · +'+(s.titrePts||1)+' XP au dévoilement':'Titre découvert · +'+(s.titrePts||1)+' XP'}</span></${canEdit()?'button':'div'}>${tEye}</div>`:`<div class="muted small">Le titre n'est pas encore connu (+1 XP).</div>`;
  h+=propBlocks(s);
  if(vt){h+=`<div class="card" style="margin-top:14px"><div class="prof-head"><b>Bonus du secret complété</b><span class="pill ${s.bonus?'good':'plan'}">+${SEC_BONUS}</span></div><div class="bgauge" style="grid-template-columns:repeat(${vt},minmax(0,1fr))">${Array.from({length:vt},(_,i)=>`<i class="${i<vf?'on':''}"></i>`).join('')}</div><div class="muted small">${s.bonus?'Remporté : toutes les vérités majeures sont découvertes.':`${vf} vérité${vf>1?'s':''} majeure${vf>1?'s':''} sur ${vt}. Encore ${vt-vf} pour remporter le bonus.`}</div></div>`;}
  for(const k of ['vm','vmin','h']){
    const a=s.slots[k]||[];if(!a.length)continue;const [f,t]=secCount(s,k),K=SKIND[k];
    h+=`<div class="sk" id="seck-${k}"><h3><span class="g-${k}">${K.g}</span> ${K.pl}</h3><span class="muted small">${f}/${t} · ${K.pts} XP ${k==='h'?'chacun':'chacune'}</span></div>`;
    const G=isGest(),E=canEdit(),found=a.map((x,i)=>x&&(G||!x.hid)?`<div class="fwrap${x.hid?' hid':''}" id="secel-${k}-${i}"><${E?'button':'div'} class="found"${E?` data-act="secEntry" data-k="${k}" data-i="${i}"`:''}>${esc(x.txt)}<small>${x.hid?'Caché · +'+x.pts+' XP au dévoilement':'+'+x.pts+' XP'+(x.date?' · '+fmtDate(x.date):'')}</small></${E?'button':'div'}>${G?eyeBtn('eye',`data-t="sec" data-n="${s.n}" data-k="${k}" data-i="${i}"`,!x.hid,K.nom):''}</div>`:'').join('');
    if(found)h+=`<div class="card" style="padding:2px 12px">${found}</div>`;
    const sl=G?a.filter(x=>!x).length:t-f;
    if(sl)h+=`<div class="sealedbox">${sl===1?`${k==='h'?'1 indice encore scellé':'1 '+K.nom.toLowerCase()+' encore scellée'}`:`${sl} ${K.pl.toLowerCase()} encore ${k==='h'?'scellés':'scellées'}`}</div>`;
  }
  if(isGest()){const any=['titre','vm','vmin','h'].some(k=>secFree(s,k));
    h+=`<button class="btn pri cta" data-act="secAdd"${any?'':' disabled'}>${any?'+ Consigner une découverte':'Tout est consigné'}</button>`;}
  else{const ks=propKinds(s);h+=`<button class="btn pri cta" data-act="propNew"${ks.length&&ME&&!S.visit?'':' disabled'}>${ks.length?'+ Proposer une découverte':'Plus rien à proposer'}</button>`;}
  return h;
}
/* ---------- Lot 2 : propositions de découverte (joueurs → MJ) ----------
   meta/secrets.props = [{id, n, k:'titre'|'h', txt, by, at (date et heure ISO), st:'att'|'rej'|'ok', dec?, i?}] */
const PROP_K={titre:'un titre',h:'un indice'};
const propsOf=n=>(S.secretProps||[]).filter(p=>p.n===n);
const propsAtt=()=>(S.secretProps||[]).filter(p=>p.st==='att'&&secById(p.n));
const propBadge=()=>isGest()?propsAtt().length:0;
/* Un titre se propose tant qu'il n'est pas dévoilé ; un indice tant que tous ne le sont pas. Les vérités ne se proposent pas. */
function propKinds(s){const out=[];if(!titreVis(s))out.push('titre');const a=(s.slots&&s.slots.h)||[];if(a.some(x=>!sVis(x)))out.push('h');return out;}
const plNom=id=>(S.players[id]&&S.players[id].nom)||'Quelqu\'un';
const fmtAt=iso=>{if(!iso)return '';const d=new Date(iso);if(isNaN(d))return '';return 'Le '+String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+' à '+d.getHours()+' h '+String(d.getMinutes()).padStart(2,'0');};
function saveProps(list){S.secretProps=list;S.secretsDoc={...(S.secretsDoc||{}),list:S.secrets,props:list};persist('meta/secrets',S.secretsDoc);render();}
function propBlocks(s){const G=isGest(),L=propsOf(s.n);let h='';
  if(G){for(const p of L.filter(x=>x.st==='att'))h+=`<div class="card propc" role="group" aria-label="Proposition en attente"><div class="lab2" style="margin-top:0">Proposition en attente</div><div><b>${esc(plNom(p.by))}</b> propose <button type="button" class="lk" data-act="secJump" data-k="${p.k==='titre'?'titre':'h'}">${PROP_K[p.k]}</button> :</div><div class="propt">« ${esc(p.txt)} »</div><div class="muted small">${fmtAt(p.at)}</div><div class="actions"><button class="btn" data-act="propRej" data-id="${esc(p.id)}">Rejeter</button><button class="btn pri" data-act="propOk" data-id="${esc(p.id)}">Confirmer</button></div></div>`;}
  else if(ME){for(const p of L.filter(x=>x.by===ME&&(x.st==='att'||x.st==='rej')))h+=`<div class="card propc${p.st==='rej'?' rej':''}"><div class="lab2" style="margin-top:0">${p.st==='att'?'Ta proposition est en attente':'Ta proposition a été rejetée'}</div><div class="small">${p.k==='titre'?'Titre':'Indice'} proposé ${p.at?'le '+fmtDate((p.at||'').slice(0,10)):''} : « ${esc(p.txt)} »</div>${p.st==='rej'?`<div class="actions"><button class="btn ghost" data-act="propHide" data-id="${esc(p.id)}">Effacer</button></div>`:''}</div>`;}
  return h;}
function propSheet(g){const s=secById(g.n);if(!s)return null;const ks=propKinds(s);if(!ks.includes(g.k))g.k=ks[0];if(!g.k)return null;
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Proposer une découverte"><div class="in"><div><h2>Proposer une découverte</h2><div class="muted small">${esc(secLabel(s))} · le MJ reçoit ta proposition et la confirme ou la rejette.</div></div>
    ${ks.length>1?`<div class="seg" role="group" aria-label="Nature de la proposition">${ks.map(k=>`<button data-act="propK" data-v="${k}" aria-pressed="${g.k===k}">${k==='titre'?'Un titre':'Un indice'}</button>`).join('')}</div>`:`<div class="small"><b>${g.k==='titre'?'Un titre':'Un indice'}</b></div>`}
    <div class="field"><label for="sxt">Ta proposition</label>${g.k==='titre'?`<input id="sxt" type="text" data-sx="1" autocomplete="off" value="${esc(g.txt)}">`:`<textarea id="sxt" data-sx="1">${esc(g.txt)}</textarea>`}</div>
    <div class="muted small">Les vérités ne se proposent pas.</div>
    <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="propSend"${g.txt.trim()?'':' disabled'}>Envoyer</button></div></div></div>`;}
/* Confirmation par le MJ : choisir l'élément dévoilé et la session (la dernière par défaut, « changer ») */
function revSheet(g){const p=(S.secretProps||[]).find(x=>x.id===g.id),s=p&&secById(p.n);if(!s||p.st!=='att')return null;
  const np=allPJ().length,L=sessList(),ses=sessById(g.sess);let body='';
  if(p.k==='titre'){body=`<div class="field"><label for="rvt">Titre révélé</label><input id="rvt" type="text" data-rvt="1" autocomplete="off" value="${esc(g.txt)}"></div>${s.titre&&s.titreHid?'<div class="muted small">Titre préparé par le MJ, prérempli : tu peux garder le sien ou celui du joueur.</div>':''}`;}
  else{const a=s.slots.h||[],hid=a.map((x,i)=>[x,i]).filter(([x])=>x&&x.hid),free=a.some(x=>!x);
    body=`<div class="field"><label>Indice à dévoiler (${a.filter(x=>!sVis(x)).length} encore scellé${a.filter(x=>!sVis(x)).length>1?'s':''})</label><div class="rvl">`+hid.map(([x,i])=>`<button class="rvo" data-act="rvPick" data-v="${i}" aria-pressed="${g.pick===String(i)}"><span class="rd" aria-hidden="true"></span><span>Indice ${i+1} · ${esc(x.txt.length>60?x.txt.slice(0,60)+'…':x.txt)}</span></button>`).join('')+(free?`<button class="rvo" data-act="rvPick" data-v="new" aria-pressed="${g.pick==='new'}"><span class="rd" aria-hidden="true"></span><span>Nouvel indice, avec le texte du joueur</span></button>`:'')+`</div></div>${g.pick==='new'?`<div class="field"><label for="rvt">Texte de l'indice</label><textarea id="rvt" data-rvt="1">${esc(g.txt)}</textarea></div>`:''}`;}
  const pts=SKIND[p.k].pts,ok=(p.k==='titre'||g.pick)&&(p.k!=='titre'&&g.pick!=='new'||(g.txt||'').trim());
  const sess=L.length?(g.chg?`<div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess,true)}</select></div>`:`<div class="rvs">Rattaché à : <b>${ses?sessLabel(ses):'—'}</b> <button class="lnk" data-act="rvChg">changer</button></div>`):'<div class="muted small">Aucune session : la découverte ne sera rattachée à aucune session.</div>';
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Révéler"><div class="in"><div><h2>Révéler ${p.k==='titre'?'le titre':'un indice'}</h2><div class="muted small">${esc(secLabel(s,true))}</div></div>
    <div class="xpbox" style="background:var(--surface2)">${esc(plNom(p.by))} propose : « ${esc(p.txt)} ».</div>${body}${sess}
    <div class="xpbox">★ La table gagne ${pts} XP de groupe (${np} PJ actif${np>1?'s':''}).</div>
    <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="rvOk"${ok?'':' disabled'}>Révéler</button></div></div></div>`;}
function propSend(){const g=S.dlg,s=g&&secById(g.n),txt=((g&&g.txt)||'').trim();if(!s||!txt||!ME||!propKinds(s).includes(g.k))return;
  const p={id:'pr'+Date.now().toString(36)+Math.floor(Math.random()*1e3),n:s.n,k:g.k,txt,by:ME,at:new Date().toISOString(),st:'att'};
  S.dlg=null;saveProps([...(S.secretProps||[]),p]);notify({kind:'secProp',propId:p.id,from:ME});}
function propReject(id){if(!isGest())return;const L=clone(S.secretProps||[]),p=L.find(x=>x.id===id);if(!p||p.st!=='att')return;p.st='rej';p.dec=today();saveProps(L);notify({kind:'secRej',propId:id,from:ME});}
function propReveal(){const g=S.dlg;if(!isGest()||!g)return;const L=clone(S.secretProps||[]),p=L.find(x=>x.id===g.id),s=p&&secById(p.n);if(!s||p.st!=='att')return;
  const txt=(g.txt||'').trim(),sid=g.sess||'';let i=0;
  if(p.k==='titre'){if(!txt)return;}else{if(!g.pick)return;if(g.pick==='new'){if(!txt)return;i=(s.slots.h||[]).findIndex(x=>!x);if(i<0)return;}else i=+g.pick;}
  p.st='ok';p.dec=today();p.i=i;S.secretProps=L;S.dlg=null;
  if(p.k==='titre'){if(s.titre&&s.titreHid){if(txt!==s.titre)secEdit(s.n,'titre',0,txt);secEyeSet(s.n,'titre',0,true,sid);}else if(!s.titre)secConsign(s.n,'titre',txt,sid,false);else saveProps(L);}
  else if(g.pick==='new')secConsign(s.n,'h',txt,sid,false);else secEyeSet(s.n,'h',i,true,sid);
  notify({kind:'secRev',propId:p.id,from:ME,xp:SKIND[p.k].pts});}
function secGainPreview(s,k){const p=SKIND[k].pts;const bonus=k==='vm'&&!s.bonus&&secCount(s,'vm')[1]-secCount(s,'vm')[0]===1;return{p,bonus,total:p+(bonus?SEC_BONUS:0)};}
function secSheet(g){
  const s=secById(g.n);if(!s)return null;
  if(g.kind==='sx'){
    const kinds=['titre','vm','vmin','h'].filter(k=>k==='titre'?!s.titre:secCount(s,k)[1]>0);
    
    return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Nouvelle découverte"><div class="in"><div><h2>Nouvelle découverte</h2><div class="muted small">${esc(secLabel(s))}</div></div>
      <div class="field"><label>Nature de la découverte</label><div class="kinds">${kinds.map(k=>{const fr=secFree(s,k),t=k==='titre'?1:secCount(s,k)[1];return `<button class="kind" data-act="sxKind" data-k="${k}" aria-pressed="${g.k===k}"${fr?'':' disabled'}><span>${k==='titre'?'':`<span class="g-${k}">${SKIND[k].g}</span> `}${SKIND[k].nom}<small>${fr?fr+' emplacement'+(fr>1?'s':'')+' libre'+(fr>1?'s':'')+' sur '+t:'tout est découvert'}</small></span><b>+${SKIND[k].pts}</b></button>`;}).join('')}</div></div>
      <div class="field"><label for="sxt">${g.k==='titre'?'Titre du secret':'Ce que nous avons appris'}</label>${g.k==='titre'?`<input id="sxt" type="text" data-sx="1" autocomplete="off" value="${esc(g.txt)}">`:`<textarea id="sxt" data-sx="1">${esc(g.txt)}</textarea>`}</div>
      <div class="muted small">L'élément consigné reste masqué (œil fermé) jusqu'à sa révélation : pas d'XP pour l'instant. À la révélation, il se rattache à une session (la dernière par défaut) et rapporte +${SKIND[g.k].pts} XP de groupe à chaque PJ actif.</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="sxOk"${g.txt.trim()?'':' disabled'}>Consigner</button></div></div></div>`;
  }
  const x=g.k==='titre'?{txt:s.titre,pts:s.titrePts||1}:(s.slots[g.k]||[])[g.i];if(!x)return null;
  const xh=g.k==='titre'?s.titreHid:x.hid,lost=xh?0:x.pts+(g.k==='vm'&&s.bonus?SEC_BONUS:0);
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Modifier la découverte"><div class="in"><div><h2>${SKIND[g.k].nom}</h2><div class="muted small">${esc(secLabel(s))} · +${x.pts} XP</div></div>
    <div class="field"><label for="sxt">Texte</label>${g.k==='titre'?`<input id="sxt" type="text" data-sx="1" autocomplete="off" value="${esc(g.txt)}">`:`<textarea id="sxt" data-sx="1">${esc(g.txt)}</textarea>`}</div>
    ${secEv(g.n,g.k,g.i)?`<div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess)}</select></div>`:'<div class="muted small">Reprise du tableur : pas de ligne d\'XP, donc pas de session.</div>'}
    <div class="muted small">${g.confirm?(xh?'Cet élément est caché : le retirer ne change pas l\'XP.':`Retirer cette découverte enlève ${lost} XP de groupe${g.k==='vm'&&s.bonus?' (bonus du secret compris)':''} et les lignes correspondantes du journal d'XP. Les découvertes reprises du tableur n'ont pas de ligne dans le journal.`):'Modifier le texte ne change pas l\'XP.'}</div>
    <div class="actions"><button class="btn pri" data-act="seSave"${g.txt.trim()?'':' disabled'}>Enregistrer</button>${g.confirm?`<button class="btn" style="color:var(--bad)" data-act="seDelOk">Confirmer le retrait</button>`:`<button class="btn" data-act="seDel">Retirer la découverte</button>`}<button class="btn ghost" data-act="closeSheet">Fermer</button></div></div></div>`;
}
function saveSecrets(list){S.secrets=list;S.secretsDoc={...(S.secretsDoc||{}),list,props:S.secretProps||[]};persist('meta/secrets',S.secretsDoc);}
function secEvent(n,k,i,montant,titre,date,sid){const t=allPJ();if(!t.length)return null;const e={id:'g'+Date.now().toString(36)+'-s'+n+k+i,date,titre,type:SEC_TYPE,secret:{n,k,i},entries:t.map(p=>({perso:p,nature:'Groupe',montant}))};if(sid&&sessById(sid))e.sessionId=sid;return e;}
const secEv=(n,k,i)=>S.events.find(e=>e.secret&&e.secret.n===n&&e.secret.k===k&&e.secret.i===i);
const creEv=id=>S.events.find(e=>e.creature&&e.creature.id===id);
function secConsign(n,k,txt,sid,hid){
  const list=clone(S.secrets),s=list.find(x=>x.n===n);if(!s||!txt||!secFree(s,k))return;
  const d=today(),evs=[...S.events];let ev;
  if(hid){if(k==='titre'){s.titre=txt;s.titrePts=SKIND.titre.pts;s.titreHid=true;}else{const i=s.slots[k].findIndex(x=>!x);s.slots[k][i]={txt,pts:SKIND[k].pts,hid:true};}saveSecrets(list);render();return;}
  if(k==='titre'){s.titre=txt;s.titrePts=SKIND.titre.pts;ev=secEvent(n,'titre',0,SKIND.titre.pts,secLabel(s),d,sid);if(ev)evs.push(ev);}
  else{const i=s.slots[k].findIndex(x=>!x);s.slots[k][i]={txt,pts:SKIND[k].pts,date:d};ev=secEvent(n,k,i,SKIND[k].pts,secLabel(s),d,sid);if(ev)evs.push(ev);
    if(k==='vm'&&!s.bonus&&secComplete(s)){s.bonus=true;const b=secEvent(n,'bonus',0,SEC_BONUS,secLabel(s)+' (bonus secret complété)',d,sid);if(b){b.trigger={k,i};evs.push(b);}}}
  saveSecrets(list);saveEvents(evs);
}
function secRemove(n,k,i){
  const list=clone(S.secrets),s=list.find(x=>x.n===n);if(!s)return;
  const drop=[[k,k==='titre'?0:i]];
  if(k==='titre'){s.titre=null;delete s.titrePts;delete s.titreHid;}else s.slots[k][i]=null;
  if(k==='vm'&&s.bonus){s.bonus=false;drop.push(['bonus',0]);}
  const evs=S.events.filter(e=>!(e.secret&&e.secret.n===n&&drop.some(([dk,di])=>e.secret.k===dk&&e.secret.i===di)));
  saveSecrets(list);saveEvents(evs);
}
function secEdit(n,k,i,txt){const list=clone(S.secrets),s=list.find(x=>x.n===n);if(!s||!txt)return;if(k==='titre')s.titre=txt;else if(s.slots[k][i])s.slots[k][i].txt=txt;saveSecrets(list);render();}

/* ---------- Univers › Créatures ---------- */
const CRE_TYPE="Créature de l'univers";
const CFAM=[['trad','Traditionnelles'],['mod','Modernes'],['exo','Exotiques']];
/* Reprise du tableur : les créatures cochées l'ont été avant l'appli, leur XP est déjà au journal */

/* Œil d'un élément de secret : ouvrir = dévoiler avec l'XP (et le bonus si c'est la dernière vérité majeure) ; fermer = cacher et retirer l'XP */
function secEyeSet(n,k,i,open,sid){
  const list=clone(S.secrets),s=list.find(x=>x.n===n);if(!s)return;const d=today();let evs=[...S.events];
  if(open){
    if(k==='titre'){if(!s.titre||!s.titreHid)return;delete s.titreHid;const ev=secEvent(n,'titre',0,s.titrePts||1,secLabel(s),d,sid);if(ev)evs.push(ev);}
    else{const x=s.slots[k][i];if(!x||!x.hid)return;delete x.hid;x.date=d;const ev=secEvent(n,k,i,x.pts,secLabel(s),d,sid);if(ev)evs.push(ev);
      if(k==='vm'&&!s.bonus&&secComplete(s)){s.bonus=true;const b=secEvent(n,'bonus',0,SEC_BONUS,secLabel(s)+' (bonus secret complété)',d,sid);if(b){b.trigger={k,i};evs.push(b);}}}
  }else{
    const drop=[[k,k==='titre'?0:i]];
    if(k==='titre'){if(!s.titre||s.titreHid)return;s.titreHid=true;}
    else{const x=s.slots[k][i];if(!x||x.hid)return;x.hid=true;delete x.date;if(k==='vm'&&s.bonus){s.bonus=false;drop.push(['bonus',0]);}}
    evs=evs.filter(e=>!(e.secret&&e.secret.n===n&&drop.some(([dk,di])=>e.secret.k===dk&&e.secret.i===di)));
  }
  saveSecrets(list);saveEvents(evs);}
function eyeSecSheet(g){const s=secById(g.n);if(!s)return null;const x=g.k==='titre'?{txt:s.titre,pts:s.titrePts||1,date:!s.titreHid}:s.slots[g.k][g.i];if(!x)return null;
  const K=SKIND[g.k],np=allPJ().length,lab=K.nom+(g.k==='titre'?'':' : '+(x.txt.length>40?x.txt.slice(0,40)+'…':x.txt));
  let xp;
  if(g.open){const [f,t]=secCount(s,'vm'),bonus=g.k==='vm'&&!s.bonus&&t-f===1,tot=x.pts+(bonus?SEC_BONUS:0);
    xp=`<div class="xpbox">★ +${tot} XP de groupe pour ${np} PJ actif${np>1?'s':''}${bonus?` (dont le bonus du secret complété, +${SEC_BONUS})`:''}. Journal : « ${esc(g.k==='titre'?'Secret '+ROMAN[s.n-1]+' - '+s.titre:secLabel(s))} », ${SEC_TYPE}.</div><div class="field"><label for="sxs">Session de rattachement</label><select id="sxs" data-sxs="1">${sessOptions(g.sess,true)}</select></div>`;}
  else{const lost=x.pts+(g.k==='vm'&&s.bonus?SEC_BONUS:0),ev=secEv(s.n,g.k,g.k==='titre'?0:g.i);
    xp=`<div class="xpbox neg">⚠ −${lost} XP de groupe pour les PJ actifs${g.k==='vm'&&s.bonus?' (bonus du secret compris)':''}${ev?' : ligne retirée du journal':' (reprise du tableur : pas de ligne au journal, seul le compteur change)'}.</div>`;}
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Confirmation"><div class="in"><div><h2>${g.open?'Dévoiler':'Masquer'} « ${esc(lab)} » ?</h2><div class="muted small">${esc(secLabel(s,true))}</div><div class="muted" style="margin-top:6px">${g.open?'L\'élément deviendra visible par toute la table.':'L\'élément ne sera plus visible que par les personnes ayant les droits de gestion. Son texte est conservé.'}</div></div>${xp}<div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="eyeOk">Confirmer</button></div></div></div>`;}
