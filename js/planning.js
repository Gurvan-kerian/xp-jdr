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
  let h=`<h2 style="margin-top:4px">Planning</h2><div class="subtabs" role="group" aria-label="Vues du planning" style="max-width:520px">${[['mes','Mes dispos'],['tous','Tout le monde'],['com','Prochaines dates']].map(([k,l])=>`<button data-act="planView" data-v="${k}" aria-pressed="${P.view===k}">${l}</button>`).join('')}</div>`;
  if(P.view==='com')return h+viewNextDates();
  h+=`<div class="pmonth"><button data-act="planMonth" data-d="-1" aria-label="Mois précédent">‹</button><b>${PMOIS[m].replace(/^./,c=>c.toUpperCase())} ${y}</b><button data-act="planMonth" data-d="1" aria-label="Mois suivant">›</button></div>`;
  if(!T)return h+`<div class="card empty">Aucun joueur : ajoute-les dans l'onglet Joueurs.</div>`;
  if(P.view==='mes'){
    const me=ME&&S.players[ME]&&!S.players[ME].parti?S.players[ME]:null;
    h+=`<div class="card" style="display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:10px"><label for="pme" class="small" style="white-space:nowrap">Je suis</label><select id="pme" data-me="1" style="flex:1"><option value="">— choisir —</option>${pl.map(p=>`<option value="${p.id}"${me&&me.id===p.id?' selected':''}>${esc(p.nom)}</option>`).join('')}</select></div>`;
    if(!me)return h+`<div class="card empty">Choisis ton nom pour remplir tes disponibilités.</div>`;
    const aide='Touche un créneau pour te dire disponible ; un second toucher l\'enlève. Week-ends en orangé, ★ = créneau préféré (samedi soir, dimanche journée). À droite : dispos de la table, journée puis soirée.';
    h+=`<div class="phelp"><button class="qhelp" data-act="planHelp" aria-expanded="${!!S.planHelp}" aria-label="Aide : comment remplir mes dispos">?</button>${S.planHelp?`<div class="qtip" role="note">${aide}</div>`:''}<span class="muted small phl">${aide}</span></div><div class="pdays">`;
    for(let d=1;d<=nd;d++){const wd=new Date(y,m,d).getDay(),we=wd===0||wd===6;
      const b=sl=>{const k=pkey(y,m,d,sl),on=!!(me.dispo&&me.dispo[k]),pf=isPref(wd,sl);return `<button class="pslot${on?' on':''}${pf?' pref':''}" data-act="planSet" data-p="${me.id}" data-k="${k}" aria-pressed="${on}" aria-label="${sl==='J'?'Journée':'Soirée'}${pf?', créneau préféré':''}"><span class="pslic" aria-hidden="true">${sl==='J'?ICON.soleil:ICON.lune}</span><span class="psll" aria-hidden="true">${sl==='J'?'☀ Journée':'☾ Soirée'}</span>${pf?'<span aria-hidden="true"> ★</span>':''}</button>`;};
      const cj=planCount(y,m,d,'J').n,cs=planCount(y,m,d,'S').n;
      h+=`<div class="pday${we?' we':''}${wd===1&&d>1?' wk':''}"><span class="pd"><small>${PJOURS[wd]}</small><b>${d}</b></span>${b('J')}${b('S')}<span class="pc">${cj}/${T}<br>${cs}/${T}</span></div>`;}
    return h+`</div>`;
  }
  if(P.view==='tous'){
    /* liste (téléphone) */
    h+=`<div class="plist">`;
    for(let d=1;d<=nd;d++){const wd=new Date(y,m,d).getDay(),we=wd===0||wd===6,J=planCount(y,m,d,'J'),Sx=planCount(y,m,d,'S'),open=P.open===pkey(y,m,d,'');
      const gauge=c=>`<span class="pg">${Array.from({length:T},(_,i)=>`<i class="${i<c.n?(c.n===T?'full':'on'):''}"></i>`).join('')}</span>`;
      const star=(wd===6&&Sx.n===T)||(wd===0&&J.n===T);
      h+=`<div class="prow2${we?' we':''}${open?' open':''}${wd===1&&d>1?' wk':''}"><button class="phead" data-act="planOpen" data-k="${pkey(y,m,d,'')}" aria-expanded="${open}"><span class="pd2"><small>${PJOURS[wd]}</small> <b>${d}</b></span><span class="pgs"><span>☀ ${gauge(J)} <small>${J.n}/${T}</small></span><span>☾ ${gauge(Sx)} <small>${Sx.n}/${T}</small></span></span><span class="pst">${star?'★':''}</span></button>${open?`<div class="pwho"><div><b>☀ Journée</b> · ${J.n===T?'tout le monde':esc(J.who.join(', '))||'personne'}</div><div><b>☾ Soirée</b> · ${Sx.n===T?'tout le monde':esc(Sx.who.join(', '))||'personne'}</div></div>`:''}</div>`;}
    h+=`</div>`;
    /* grille (ordinateur) */
    h+=`<div class="pgrid card" style="padding:0"><table><thead><tr><th rowspan="2" style="text-align:left">Date</th>${pl.map(p=>`<th colspan="2">${esc(p.nom)}</th>`).join('')}<th rowspan="2">Dispos</th></tr><tr>${pl.map(()=>'<th>☀</th><th>☾</th>').join('')}</tr></thead><tbody>`;
    for(let d=1;d<=nd;d++){const wd=new Date(y,m,d).getDay(),we=wd===0||wd===6;
      h+=`<tr class="${we?'we':''}${wd===1&&d>1?' wk':''}"><td class="pd3">${PJOURS[wd]} ${d}</td>`+pl.map(p=>['J','S'].map(sl=>{const k=pkey(y,m,d,sl),on=!!(p.dispo&&p.dispo[k]);return `<td class="${isPref(wd,sl)?'pf':''}"><button class="pbox${on?' on':''}" role="checkbox" aria-checked="${on}" aria-label="${esc(p.nom)}, ${PJOURSL[wd]} ${d}, ${sl==='J'?'journée':'soirée'}" data-act="planSet" data-p="${p.id}" data-k="${k}">${on?'✓':''}</button></td>`;}).join('')).join('')+
        `<td style="white-space:nowrap">${['J','S'].map(sl=>{const c=planCount(y,m,d,sl).n;return `<span class="pill${c===T?' good':''}">${sl==='J'?'☀':'☾'} ${c}/${T}</span>`;}).join(' ')}</td></tr>`;}
    return h+`</tbody></table></div>`;
  }
  return h+viewNextDates();
}

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
const canPortrait=c=>!!(ME&&S.players[ME]&&!S.visit&&(isMJ(S.players[ME])||isGest()||owners(c).some(p=>p.id===ME)||(c.type==='PNJ'&&canEditC(c))));
const mjRefus=x=>Object.values(S.players).some(p=>isMJ(p)&&(p.rep||{})[x.id]==='no');
const openProps=()=>propDates().filter(x=>!mjRefus(x));
function saveDates(list){S.dates=list;persist('meta/planning',{dates:list});render();}
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
  let h=`<h3 class="nd-h good">✓ Dates validées</h3>`;
  const V=validDates();
  h+=V.map(x=>`<div class="pcom pref"><div class="pcrow">${dIcon(x)}<span style="flex:1"><b>${dTitle(x)}</b><br><span class="muted small">${dSub(x)} · ${esc(x.type||'Scénario')}${x.note?' · '+esc(x.note):''}</span></span><span class="pill good">Validée</span></div><div class="pcact"><button class="btn ghost" data-act="dUnvalid" data-id="${x.id}">Annuler la validation</button></div></div>`).join('')||'<div class="muted" style="margin-bottom:8px">Aucune date validée pour l\'instant.</div>';
  h+=`<h3 class="nd-h brass">★ Toute la table est libre</h3><div class="muted small" style="margin-bottom:8px">Calculé à partir des disponibilités des 3 prochains mois, créneaux préférés en premier.</div>`;
  const F=freeSlots();
  h+=F.map(x=>`<div class="pcom${x.pf?' pref':''}"><div class="pcrow">${dIcon(x)}<span style="flex:1"><b>${dTitle(x)}</b>${x.pf?' <span class="pst">★</span>':''}<br><span class="muted small">${dSub(x)} · toute la table (${T}/${T})</span></span><button class="btn pri" data-act="dValidFree" data-date="${x.date}" data-sl="${x.sl}" data-end="${x.endDate}" data-endsl="${x.endSl}">Valider</button></div></div>`).join('')||'<div class="muted" style="margin-bottom:8px">Aucun créneau où toute la table est libre.</div>';
  h+=`<h3 class="nd-h">Dates proposées</h3><button class="btn pri" style="width:100%;margin-bottom:10px" data-act="dPropose">+ Proposer une date</button>`;
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
