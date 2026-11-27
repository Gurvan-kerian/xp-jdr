/* La belle appli — Planning et prochaines dates */
/* ---------- Planning (menu ≡) ---------- */
const PJOURS=['dim','lun','mar','mer','jeu','ven','sam'],PJOURSL=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const PMOIS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const pkey=(y,m,d,sl)=>''+y+String(m+1).padStart(2,'0')+String(d).padStart(2,'0')+sl;
const planPlayers=()=>playersSorted().filter(p=>!p.parti);
const isPref=(wd,sl)=>(wd===6&&sl==='S')||(wd===0&&sl==='J');
function planCount(y,m,d,sl){const P=planPlayers(),k=pkey(y,m,d,sl);return{n:P.filter(p=>p.dispo&&p.dispo[k]).length,who:P.filter(p=>p.dispo&&p.dispo[k]).map(p=>p.nom),total:P.length};}
function viewPlanning(){
  const P=S.plan,y=P.y,m=P.m,nd=new Date(y,m+1,0).getDate(),pl=planPlayers(),T=pl.length;
  if(P.view!=='com'&&P.view!=='dispo')P.view='com';
  {const x=S.plDate&&S.dates.find(z=>z.id===S.plDate);if(x)return plDateView(x);}
  let h=`<div class="pghead"><h2>Planning</h2>${isUser()?`<button type="button" class="pbtn big" data-act="dPropose" aria-label="Proposer une date">+</button>`:''}</div><div class="subtabs" role="group" aria-label="Vues du planning" style="max-width:520px">${[['com','Prochaines dates'],['dispo','Disponibilités']].map(([k,l])=>`<button data-act="planView" data-v="${k}" aria-pressed="${P.view===k}">${l}</button>`).join('')}</div>`;
  if(P.view==='com')return h+viewNextDates();
  const aide='Touche ☀ (journée) ou ☾ (soirée) pour te dire libre ; un second toucher l\'enlève. Week-ends teintés, ★ = créneau préféré (samedi soir, dimanche journée). À droite : qui est libre, journée puis soirée ; toucher le jour ou les jauges pour le détail.';
  h+=`<div class="pmonth"><button data-act="planMonth" data-d="-1" aria-label="Mois précédent">‹</button><b>${PMOIS[m].replace(/^./,c=>c.toUpperCase())} ${y}</b><button data-act="planMonth" data-d="1" aria-label="Mois suivant">›</button><button type="button" class="qbtn" data-act="planHelp" aria-expanded="${!!S.planHelp}" aria-label="Aide">?</button></div>${S.planHelp?`<div class="qtip2">${aide}</div>`:''}`;
  if(!T)return h+`<div class="card empty">Aucun joueur.</div>`;
  const me=ME&&S.players[ME]&&!S.players[ME].parti?S.players[ME]:null;
  h+=`<div class="only-ph pdays2">`;
  for(let d=1;d<=nd;d++){const wd=new Date(y,m,d).getDay(),we=wd===0||wd===6,dk=pkey(y,m,d,'');
    const b=sl=>{const k=pkey(y,m,d,sl),on=!!(me&&me.dispo&&me.dispo[k]),pf=isPref(wd,sl);return `<button type="button" class="pslot2${on?' on':''}${pf?' pref':''}" data-act="planSet" data-p="${me?me.id:''}" data-k="${k}" aria-pressed="${on}" aria-label="${PJOURSL[wd]} ${d}, ${sl==='J'?'journée':'soirée'}${pf?', créneau préféré':''}"${me?'':' disabled'}>${sl==='J'?'☀':'☾'}${pf?'<small>★</small>':''}</button>`;};
    const gauge=sl=>{const c=planCount(y,m,d,sl).n;return `<span class="pg2${c===T?' full':''}"><i style="width:${Math.round(c/T*100)}%"></i></span><small>${c}/${T}</small>`;};
    h+=`<div class="pday2${we?' we':''}${wd===1&&d>1?' wk':''}"><button type="button" class="pdl" data-act="plWho" data-k="${dk}">${PJOURS[wd]} <b>${d}</b></button>${b('J')}${b('S')}<button type="button" class="pgg" data-act="plWho" data-k="${dk}" aria-label="Qui est libre le ${PJOURSL[wd]} ${d}"><span>${gauge('J')}</span><span>${gauge('S')}</span></button></div>`;}
  h+=`</div>`;
  h+=`<div class="only-pc pgrid card" style="padding:0"><table><thead><tr><th rowspan="2" style="text-align:left">Date</th>${pl.map(p=>`<th colspan="2">${esc(p.nom)}</th>`).join('')}<th colspan="2">Libres</th></tr><tr>${pl.map(()=>'<th>☀</th><th>☾</th>').join('')}<th>☀</th><th>☾</th></tr></thead><tbody>`;
  for(let d=1;d<=nd;d++){const wd=new Date(y,m,d).getDay(),we=wd===0||wd===6;
    h+=`<tr class="${we?'we':''}${wd===1&&d>1?' wk':''}"><td class="pd3"><button type="button" class="lnk" data-act="plWho" data-k="${pkey(y,m,d,'')}">${PJOURS[wd]} ${d}</button></td>`+pl.map(p=>['J','S'].map(sl=>{const k=pkey(y,m,d,sl),on=!!(p.dispo&&p.dispo[k]);return `<td class="${isPref(wd,sl)?'pf':''}"><button class="pbox${on?' on':''}" role="checkbox" aria-checked="${on}" aria-label="${esc(p.nom)}, ${PJOURSL[wd]} ${d}, ${sl==='J'?'journée':'soirée'}" data-act="planSet" data-p="${p.id}" data-k="${k}"${isUser()?'':' disabled'}>${on?'✓':''}</button></td>`;}).join('')).join('')+
      ['J','S'].map(sl=>{const c=planCount(y,m,d,sl).n;return `<td><span class="pill${c===T?' good':''}">${c}/${T}</span></td>`;}).join('')+`</tr>`;}
  return h+`</tbody></table></div>`;
}
/* UX1 : fenêtre « Qui est libre » d'un jour */
function plWhoSheet(g){const k=g.k,y=+k.slice(0,4),m=+k.slice(4,6)-1,d=+k.slice(6,8),wd=new Date(y,m,d).getDay(),pl=planPlayers(),T=pl.length,iso=k.slice(0,4)+'-'+k.slice(4,6)+'-'+k.slice(6,8);
  const blk=sl=>{const c=planCount(y,m,d,sl),no=pl.filter(p=>!(p.dispo&&p.dispo[pkey(y,m,d,sl)]));return `<div class="xpnat"><div class="xpnh"><span>${sl==='J'?'☀ Journée':'☾ Soirée'}${isPref(wd,sl)?' ★':''}</span><span class="muted small">${c.n}/${T}</span></div><div class="small"><b>Libres</b> · ${c.n?esc(c.who.join(', ')):'personne'}</div><div class="small muted"><b>Pas libres</b> · ${no.length?esc(no.map(p=>p.nom).join(', ')):'personne'}</div>${isUser()&&iso>=today()?`<button type="button" class="lnk" data-act="dPropose" data-date="${iso}" data-sl="${sl}">Proposer cette date</button>`:''}</div>`;};
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Qui est libre"><div class="in"><div class="blkhd"><h2 style="flex:1;margin:0">${capi(PJOURSL[wd])} ${d} ${PMOIS[m]}</h2><button type="button" class="ibtn sm" data-act="closeSheet" aria-label="Fermer">✕</button></div>${blk('J')}${blk('S')}</div></div>`;}
/* UX1 : page d'une date */
function plFree(x){const pl=planPlayers(),sl=slotsOf(x);return pl.filter(p=>sl.every(s=>{const [iso,l]=s.split('|'),[yy,mm,dd]=iso.split('-').map(Number);return p.dispo&&p.dispo[pkey(yy,mm-1,dd,l)];}));}
function plDateView(x){const pl=planPlayers(),F=plFree(x),N=pl.filter(p=>!F.includes(p)),armed=S.confirm==='du:'+x.id;
  let o=crumb(['Planning','data-act="plClose"'],[dTitle(x)]);
  o+=`<div class="ttlrow"><div class="ttl"><h2 class="xph">${dTitle(x)}</h2><div class="muted small">${dSub(x)} · ${esc(x.type||'Scénario')} · ${x.status==='valid'?'validée':'proposée'}</div></div></div>`;
  o+=`<section class="card xpsec"><div class="blkhd"><h3>Libres · ${F.length}/${pl.length}</h3></div><div class="rsp">${F.map(p=>`<span class="rp ok">${esc(p.nom)}</span>`).join('')||'<span class="muted small">personne</span>'}</div><div class="blkhd" style="margin-top:10px"><h3>Pas libres</h3></div><div class="rsp">${N.map(p=>`<span class="rp no">${esc(p.nom)}</span>`).join('')||'<span class="muted small">personne</span>'}</div>${x.note?`<div style="font-style:italic;margin-top:8px">« ${esc(x.note)} »</div>`:''}</section>`;
  if(x.status==='valid')o+=`<div class="muted small" style="margin:8px 0">Toute la table a été prévenue.</div>`;
  if(isGest()&&x.status==='valid')o+=armed?`<div class="delconf" role="alert"><span><b>Annuler la validation ?</b> La date redevient une proposition.</span><div class="acts"><button type="button" class="btn" data-act="plUnNo">Garder</button><button type="button" class="btn danger" data-act="dUnvalid" data-id="${x.id}">Annuler la validation</button></div></div>`:`<button type="button" class="btn" data-act="plUnAsk" data-id="${x.id}">Annuler la validation</button>`;
  return o;}

/* ---------- Prochaines dates ---------- */
const todayKey=()=>today().replace(/-/g,'');
const dkey=d=>d.replace(/-/g,'');
const fmtLong=(iso,sl)=>{const [y,m,d]=iso.split('-').map(Number),wd=new Date(y,m-1,d).getDay();if(sl==='WE'||(sl===undefined&&false))return 'Week-end du '+d+' '+PMOIS[m-1];return PJOURSL[wd].replace(/^./,c=>c.toUpperCase())+' '+d+' '+PMOIS[m-1]+(sl?' · '+(sl==='J'?'journée':'soirée'):'');};
const slLabel=sl=>sl==='WE'?'Samedi soir et dimanche journée':sl==='J'?'Journée':'Soirée';
const isoAdd=(iso,n)=>{const [y,m,d]=iso.split('-').map(Number),t=new Date(y,m-1,d+n);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};
/* Une date = un créneau ou une plage de créneaux consécutifs (date/sl → endDate/endSl). 'WE' = ancien format samedi soir → dimanche journée */
const norm=x=>x.sl==='WE'?{date:x.date,sl:'S',endDate:isoAdd(x.date,1),endSl:'J'}:{date:x.date,sl:x.sl,endDate:x.endDate||x.date,endSl:x.endSl||x.sl};
const isRange=x=>{const n=norm(x);return n.endDate!==n.date||n.endSl!==n.sl;};
const dEnd=x=>norm(x).endDate;
const wdOf=iso=>new Date(iso+'T12:00').getDay();
const capi=t=>t.replace(/^./,c=>c.toUpperCase());
function dTitle(x){const n=norm(x);if(!isRange(x))return fmtLong(n.date);
  if(n.date===n.endDate)return fmtLong(n.date);
  const [,m1,d1]=n.date.split('-').map(Number),[,m2,d2]=n.endDate.split('-').map(Number);
  if(wdOf(n.date)===6&&n.sl==='S'&&n.endDate===isoAdd(n.date,1)&&n.endSl==='J')return 'Week-end du '+d1+' '+PMOIS[m1-1];
  return 'Du '+PJOURSL[wdOf(n.date)]+' '+d1+(m1!==m2?' '+PMOIS[m1-1]:'')+' au '+PJOURSL[wdOf(n.endDate)]+' '+d2+' '+PMOIS[m2-1];}
function dSub(x){const n=norm(x);if(!isRange(x))return n.sl==='J'?'Journée':'Soirée';
  if(n.date===n.endDate)return 'Journée et soirée';
  const a=PJOURSL[wdOf(n.date)]+(n.sl==='J'?' journée':' soir'),b=PJOURSL[wdOf(n.endDate)]+(n.endSl==='J'?' journée':' soir');
  return capi(a)+(slotsOf(x).length===2?' et ':' → ')+b;}
function dLine(x){const n=norm(x);if(!isRange(x))return fmtLong(n.date,n.sl);return n.date===n.endDate?fmtLong(n.date)+' · journée et soirée':dTitle(x);}
function slotsOf(x){const n=norm(x),out=[];let d=n.date,sl=n.sl;for(let i=0;i<400;i++){out.push(d+'|'+sl);if(d===n.endDate&&sl===n.endSl)break;if(sl==='J')sl='S';else{sl='J';d=isoAdd(d,1);}}return out;}
const futDates=()=>S.dates.filter(x=>dEnd(x)>=today()).sort((a,b)=>(a.date+a.sl).localeCompare(b.date+b.sl));
const validDates=()=>futDates().filter(x=>x.status==='valid');
const propDates=()=>futDates().filter(x=>x.status!=='valid');
const isMJ=p=>p&&p.role==='MJ'&&!p.parti;
/* Portrait : le joueur du personnage et le MJ (d'ici la version finale, toute la gestion), hors mode édition */
const canPortrait=c=>!!c&&isUser()&&vis(c); /* UX1 */
const mjRefus=x=>Object.values(S.players).some(p=>isMJ(p)&&(p.rep||{})[x.id]==='no');
const openProps=()=>propDates().filter(x=>!mjRefus(x));
function saveDates(list){S.dates=list;persist('meta/planning',{dates:list,ecartes:S.dEcart||[]});render();}
/* UX1 : dates validées passées sans session ce jour-là (rappel « Créer la session ») */
const plPast=()=>S.dates.filter(x=>x.status==='valid'&&dEnd(x)<today()&&!(S.dEcart||[]).includes(x.id)&&!sessList().some(e=>e.date&&e.date>=x.date&&e.date<=dEnd(x))).sort((a,b)=>b.date.localeCompare(a.date));
function plTodo(){if(!isUser())return '';const L=plPast();if(!L.length)return '';
  return `<section class="card xpsec htodo"><div class="blkhd"><h3>À traiter</h3></div>${L.map(x=>`<div class="xprow" style="flex-wrap:wrap;padding:4px 0"><span class="cmain">La partie du ${esc(fmtLong(x.date).replace(/^./,c=>c.toLowerCase()))} est passée</span><button type="button" class="btn pri" data-act="plMkSess" data-id="${x.id}">Créer la session</button><button type="button" class="btn ghost" data-act="plEcart" data-id="${x.id}">Écarter</button></div>`).join('')}</section>`;}
function freeSlots(){const pl=planPlayers(),T=pl.length,out=[];if(!T)return out;const t=new Date();
  const used=new Set();for(const x of S.dates)for(const k of slotsOf(x))used.add(k);
  /* créneaux consécutifs libres pour toute la table → une seule date (plage) */
  let run=null;const close=()=>{if(run){out.push(run);run=null;}};
  for(let i=0;i<=90;i++){const dt=new Date(t.getFullYear(),t.getMonth(),t.getDate()+i),y=dt.getFullYear(),m=dt.getMonth(),d=dt.getDate(),wd=dt.getDay();
    const iso=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    for(const sl of ['J','S']){const free=pl.every(p=>p.dispo&&p.dispo[pkey(y,m,d,sl)])&&!used.has(iso+'|'+sl);
      if(!free){close();continue;}
      if(!run)run={date:iso,sl,endDate:iso,endSl:sl,pf:isPref(wd,sl)};else{run.endDate=iso;run.endSl=sl;run.pf=run.pf||isPref(wd,sl);}}}
  close();
  return out.sort((a,b)=>(b.pf-a.pf)||(a.date+a.sl).localeCompare(b.date+b.sl));}
const dIcon=x=>{const r=isRange(x),n=norm(x);return `<span class="pi"${r?' style="font-size:15px"':''}>${r?(n.sl==='J'?'☀☾':'☾☀'):n.sl==='J'?'☀':'☾'}</span>`;};
function viewNextDates(){
  if(!S.datesReady)return `<div class="card empty">Chargement…</div>`;
  const pl=planPlayers(),T=pl.length,me=ME&&S.players[ME]?S.players[ME]:null;
  const V=validDates();
  let h=`<section class="card xpsec"><div class="blkhd"><h3>Dates validées</h3></div>${V.map(x=>`<button type="button" class="crow" data-act="plOpen" data-id="${x.id}">${dIcon(x)}<span class="cmain"><span class="t">${dTitle(x)}</span><span class="s">${dSub(x)} · ${esc(x.type||'Scénario')}</span></span><span class="muted small">${plFree(x).length}/${T} libres</span><span class="chev" aria-hidden="true">›</span></button>`).join('')||'<div class="muted small">Aucune date validée pour l\'instant.</div>'}</section>`;
  const F=freeSlots();
  if(F.length)h+=`<h3 class="nd-h brass">★ Toute la table est libre</h3><div class="muted small" style="margin-bottom:8px">Calculé à partir des disponibilités des 3 prochains mois, créneaux préférés en premier.</div>`;
  h+=F.map(x=>`<div class="pcom${x.pf?' pref':''}"><div class="pcrow">${dIcon(x)}<span style="flex:1"><b>${dTitle(x)}</b>${x.pf?' <span class="pst">★</span>':''}<br><span class="muted small">${dSub(x)} · toute la table (${T}/${T})</span></span><button class="btn pri" data-act="dValidFree" data-date="${x.date}" data-sl="${x.sl}" data-end="${x.endDate}" data-endsl="${x.endSl}">Valider</button></div></div>`).join('');
  h+=`<h3 class="nd-h">Dates proposées</h3>`;
  h+=propDates().map(x=>{
    const R=pl.map(p=>({p,r:(p.rep||{})[x.id]||null}));
    const nok=R.filter(r=>r.r==='ok').length,nno=R.filter(r=>r.r==='no').length,nq=T-nok-nno;
    const mine=me?((me.rep||{})[x.id]||null):null,by=S.players[x.by];
    const armed=S.confirm==='dd:'+x.id,ref=mjRefus(x);
    return `<div class="pcom prop${ref?' refused':''}"><div class="pcrow">${dIcon(x)}<span style="flex:1"><b>${dTitle(x)}</b><br><span class="muted small">${dSub(x)} · ${esc(x.type||'Scénario')}${by?' · proposée par '+esc(by.nom):''}</span></span><span class="pill${ref?' bad':''}">${ref?'Refusée':'Proposée'}</span></div>${ref?'<div class="small" style="color:var(--bad);margin-top:6px">Le MJ n\'est pas disponible sur ce créneau.</div>':''}
      ${x.note?`<div style="font-style:italic;margin:6px 0">« ${esc(x.note)} »</div>`:''}
      <div class="rsp">${R.map(({p,r})=>`<span class="rp ${r||'q'}">${r==='ok'?'✓':r==='no'?'✗':'?'} ${esc(p.nom)}</span>`).join('')}</div>
      <div class="small" style="margin:6px 0">${nok} accepte${nok>1?'nt':''} · ${nno} décline${nno>1?'nt':''} · ${nq} sans réponse</div>
      <div class="pcact">${me?`<button class="btn${mine==='ok'?' sel':''}" aria-pressed="${mine==='ok'}" data-act="dRep" data-id="${x.id}" data-r="ok">✓ J'accepte</button><button class="btn${mine==='no'?' sel':''}" aria-pressed="${mine==='no'}" data-act="dRep" data-id="${x.id}" data-r="no">✗ Je décline</button>`:''}<button class="btn pri" data-act="dValid" data-id="${x.id}"${ref?' disabled':''}>Valider</button></div>
      <div class="pcact" style="margin-top:4px"><button class="btn ghost" style="${armed?'color:var(--bad)':''}" data-act="dDel" data-id="${x.id}">${armed?'Confirmer la suppression':'Supprimer la proposition'}</button></div></div>`;}).join('')||'<div class="muted">Aucune proposition en cours.</div>';
  return h;
}
function dateSheet(g){
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Proposer une date"><div class="in"><h2>Proposer une date</h2>
    <div class="field"><label for="pdd">Date</label><input id="pdd" type="date" data-pd="date" min="${today()}" value="${esc(g.date)}"></div>
    <div class="field"><label>Créneau</label><div style="display:flex;gap:8px"><button class="pslot${g.sl==='J'?' on':''}" data-act="pdSl" data-sl="J" aria-pressed="${g.sl==='J'}">☀ Journée</button><button class="pslot${g.sl==='S'?' on':''}" data-act="pdSl" data-sl="S" aria-pressed="${g.sl==='S'}">☾ Soirée</button></div></div>
    <div class="field"><label for="pdt">Type</label><select id="pdt" data-pd="type">${TYPES.map(t=>`<option${t===g.type?' selected':''}>${t}</option>`).join('')}</select></div>
    <div class="field"><label for="pdn">Note (facultatif)</label><input id="pdn" type="text" data-pd="note" autocomplete="off" value="${esc(g.note)}" placeholder="ex. pour boucler l'enquête"></div>
    <div class="muted small">Toute la table la voit et peut accepter ou décliner.${ME&&S.players[ME]?' Tu acceptes automatiquement ta propre proposition.':''}</div>
    <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pdOk"${g.date&&g.date>=today()?'':' disabled'}>Proposer</button></div></div></div>`;
}
