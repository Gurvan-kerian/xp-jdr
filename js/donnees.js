/* La belle appli — Paramètres › Données : version des données et journal de gestion des signalements
   Signalement = {id, obj:{t:'race'|'pouvoir'|'capacite'|'perso', id}, champ, statut:'completer'|'valider'|'confirmer', note, date, by, auteur, ok, okDate}
   - automatiques : calculés à partir des données (manques détectables) ; ils disparaissent seuls quand le champ est rempli ;
   - enregistrés (meta/signalements) : posés à la main par la gestion, ou par une mise à jour ; fermés à la main, gardés consultables.
   Visibles seulement par les personnes ayant les droits de gestion. */
const SIG_ST={completer:'À compléter',valider:'À valider',confirmer:'À confirmer'};
const SIG_RANK={confirmer:0,valider:1,completer:2};
const SIG_OBJ={race:'Race',pouvoir:'Pouvoir',capacite:'Capacité',perso:'Personnage',brouillon:'Fiche à valider',ppel:'Élément de PP'};
const SIG_ICO='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>';
/* Manques détectables, recalculés à chaque affichage */
function sigAuto(){if(!modelV1())return [];const out=[],add=(t,id,champ,statut,note)=>out.push({id:'auto:'+t+':'+id+':'+champ,auto:true,obj:{t,id},champ,statut,note:note||'',ok:false});
  /* lot C : fiche de création envoyée au MJ */
  for(const b of Object.values(S.brouillons||{}))if(b&&b.statut==='attente'){const I=(b.d||{}).ident||{};add('brouillon',b.id,'Fiche à valider','valider',(b.kind==='feal'?'Féal':'PJ')+' « '+((I.court||'').trim()||'?')+' », envoyé par '+((S.players[b.par]||{}).nom||'?')+' : Personnages › PJ, tuile « En attente de validation ».');}
  for(const [id,p] of Object.entries(S.pouvoirs||{})){if(!p.type)add('pouvoir',id,'Type','completer');if(!pwNat(id))add('pouvoir',id,'Nature','completer','Nature (masqué / démasqué) impossible à déduire des emplacements de race');if(!(p.desc||'').trim())add('pouvoir',id,'Description','completer');}
  for(const [id,k] of Object.entries(S.capacites||{})){if(!k.type)add('capacite',id,'Type','completer');if(!(k.desc||'').trim())add('capacite',id,'Description','completer');}
  for(const cr of S.creatures||[]){const r=S.races&&S.races[cr.id];if(!r||r.hum)continue;
    if(isLegacyRace(r)){add('race',cr.id,'Format','confirmer',"Fiche enregistrée par un appareil resté sur l'ancienne version : ouvre-la et enregistre-la pour la convertir.");continue;}
    pwSlots(r).forEach((id,i)=>{const p=id&&S.pouvoirs[id];if(p&&p.prec&&!((r.pwv||[])[i]))add('race',cr.id,'Pouvoir '+PW_LAB[i].toLowerCase()+' '+(i<4?i+1:i<6?i-3:'')+' › sous-type de '+p.nom,'completer','Sous-type obligatoire absent');});
    for(const e of r.cap||[]){const k=capOf(e.id);if(k&&k.prec&&!e.v)add('race',cr.id,'Capacité '+k.nom+' › sous-type','completer','Sous-type obligatoire absent');}}
  for(const c of Object.values(S.chars||{})){const n=specToAttach(c);if(n>0)add('perso',c.id,'Spécialités','completer',n+' spécialité'+(n>1?'s':'')+' non rattachée'+(n>1?'s':''));
    if(raceIncoh(c))add('perso',c.id,'Visibilité de la race','valider',(c.court||c.id)+' est visible de toute la table, mais la fiche '+c.race+' a encore des éléments fermés (hors pouvoirs) : les ouvrir, ou masquer le personnage.');}
  return out;}
const sigStored=()=>((S.signalDoc&&S.signalDoc.list)||[]);
const sigAll=()=>[...sigAuto(),...sigStored()];
const sigOpenFor=(t,id)=>canEdit()?sigAll().filter(s=>!s.ok&&s.obj&&s.obj.t===t&&s.obj.id===id):[];
/* Picto d'alerte, à côté de l'élément concerné (gestion seulement) */
function sigPicto(t,id){const L=sigOpenFor(t,id);if(!L.length)return '';
  return `<span class="ui-sig" role="img" title="${esc(L.map(s=>s.champ+' : '+SIG_ST[s.statut]).join(' · '))}" aria-label="${L.length} signalement${L.length>1?'s':''} : ${esc(L.map(s=>s.champ).join(', '))}">${SIG_ICO}</span>`;}
function sigObjName(o){if(!o)return '';if(o.t==='race'){const cr=(S.creatures||[]).find(c=>c.id===o.id),r=S.races&&S.races[o.id];return (r&&r.sing)||(cr&&cr.nom)||o.id;}
  if(o.t==='pouvoir')return (S.pouvoirs&&S.pouvoirs[o.id]&&S.pouvoirs[o.id].nom)||o.id;if(o.t==='capacite')return (capOf(o.id)||{}).nom||o.id;
  if(o.t==='perso')return (S.chars[o.id]&&S.chars[o.id].court)||o.id;if(o.t==='ppel'){const e=ppEls()[o.id];return e?e.nom:o.id;}if(o.t==='brouillon'){const b=S.brouillons&&S.brouillons[o.id];return (b&&((b.d||{}).ident||{}).court)||'Nouveau personnage';}return o.id;}
/* Ouvrir l'élément concerné : fiche de race, pouvoir, personnage ; une capacité ouvre la première race qui l'utilise */
/* Lot 4 bis : passe par le mécanisme commun des liens (pile du retour) ; pouvoir et capacité ouvrent leur fiche de consultation */
function sigOpenAttrs(o){if(!o)return '';const t={race:'race',pouvoir:'pw',capacite:'cap',perso:'perso'}[o.t];if(!t)return '';const L={t,id:o.id};return lnkOk(L)?lnkAttrs(L):'';}
function saveSignals(list){S.signalDoc={list};persist('meta/signalements',S.signalDoc);}

/* ---------- Écran Paramètres › Données ---------- */
function viewDonnees(){
  const v=S.schemaV||0,sc=S.schema||{},G=isGest();
  let h=`<div class="card"><h3 class="rs" style="margin-top:0">Données</h3>
    <div class="ui-kv"><span>Version des données</span><b>${v}</b><span>Version attendue par l'appli</span><b>${SCHEMA_V}</b><span>Dernière mise à jour</span><b>${sc.date?fmtDate(sc.date)+(sc.by&&S.players[sc.by]?' · '+esc(S.players[sc.by].nom):''):'—'}</b></div>
    ${S.migPending?`<div class="ui-small" style="margin-top:8px">Une mise à jour des données est en attente : voir la carte en haut de l'écran.</div>`:''}
    ${(sc.hist||[]).length?`<details class="ui-det"><summary>Historique des mises à jour</summary>${sc.hist.slice().reverse().map(x=>`<div class="ui-small"><b>Version ${x.v}</b> · ${fmtDate(x.date)}${(x.rep||[]).map(l=>`<div>${esc(l)}</div>`).join('')}</div>`).join('')}</details>`:''}</div>`;
  if(!G)return h+`<div class="card"><div class="muted">Le journal des signalements est réservé aux personnes ayant les droits de gestion.</div></div>`;
  const f=S.sigF=S.sigF||{st:'',t:'',res:false},all=sigAll();
  const L=all.filter(s=>(!f.st||s.statut===f.st)&&(!f.t||(s.obj&&s.obj.t===f.t))&&(f.res||!s.ok)).sort((a,b)=>(a.ok-b.ok)||(!!a.auto-!!b.auto)||(SIG_RANK[a.statut]-SIG_RANK[b.statut])||((SIG_OBJ[a.obj.t]||'').localeCompare(SIG_OBJ[b.obj.t]||''))||sigObjName(a.obj).localeCompare(sigObjName(b.obj),'fr'));
  const open=all.filter(s=>!s.ok).length;
  h+=`<div class="card"><h3 class="rs" style="margin-top:0">Journal de gestion <span class="muted small" style="text-transform:none;letter-spacing:0">${open} ouvert${open>1?'s':''}</span></h3>
    <div class="ui-small muted" style="margin-bottom:6px">Le picto ${SIG_ICO} signale un champ à compléter, valider ou confirmer. Les signalements automatiques disparaissent quand le champ est rempli ; ceux posés à la main se ferment avec « Résolu ». Les joueurs ne voient ni pictos ni journal.</div>
    <div class="flt">${[['','Tous'],...Object.entries(SIG_ST)].map(([k,l])=>`<button data-act="sigF" data-k="st" data-v="${k}" aria-pressed="${f.st===k}">${l}</button>`).join('')}</div>
    <div class="flt">${[['','Tous objets'],...Object.entries(SIG_OBJ)].map(([k,l])=>`<button data-act="sigF" data-k="t" data-v="${k}" aria-pressed="${f.t===k}">${l}</button>`).join('')}<button data-act="sigF" data-k="res" data-v="${f.res?'':'1'}" aria-pressed="${f.res}">Résolus</button></div>
    <div class="ui-sigl">${L.map(s=>{const at=sigOpenAttrs(s.obj);return `<div class="ui-sigr${s.ok?' ok':''}">
      <button class="ui-sigm" ${at||'disabled'}>${s.ok?'✓':SIG_ICO}<span><b>${esc(SIG_OBJ[s.obj.t]||'')} · ${esc(sigObjName(s.obj))}</b> › ${esc(s.champ)}<small>${esc(SIG_ST[s.statut]||'')}${s.note?' · '+esc(s.note):''}${s.auto?' · automatique':s.date?' · '+fmtDate(s.date)+(s.auteur?' · '+esc(s.auteur):s.by&&S.players[s.by]?' · '+esc(S.players[s.by].nom):''):''}${s.ok&&s.okDate?' · résolu le '+fmtDate(s.okDate):''}</small></span></button>
      ${s.auto?'':`<button class="btn ghost ui-xs" data-act="sigOk" data-id="${esc(s.id)}">${s.ok?'Rouvrir':'Résolu'}</button>`}</div>`;}).join('')||'<div class="muted small">Aucun signalement pour ce filtre.</div>'}</div>
    ${sigForm()}</div>`;
  return h+(typeof fi6RattView==='function'?fi6RattView():'');} /* lot 6 */
/* Ajout manuel d'un signalement sur n'importe quel élément */
function sigForm(){const g=S.sigNew;if(!g)return `<div class="actions" style="margin-top:10px"><button class="btn" data-act="sigNew">+ Signalement</button></div>`;
  const opts=g.t==='race'?(S.creatures||[]).filter(c=>S.races&&S.races[c.id]&&!S.races[c.id].hum).map(c=>[c.id,S.races[c.id].sing||c.nom]):g.t==='pouvoir'?Object.entries(S.pouvoirs||{}).map(([id,p])=>[id,p.nom]):g.t==='capacite'?Object.entries(S.capacites||{}).map(([id,k])=>[id,k.nom]):Object.values(S.chars||{}).map(c=>[c.id,c.court]);
  opts.sort((a,b)=>a[1].localeCompare(b[1],'fr'));
  return `<div class="ui-form"><div class="lab2">Nouveau signalement</div>
    <div class="frow"><div class="field"><label for="sg-t">Objet</label><select id="sg-t" data-sig="t">${Object.entries(SIG_OBJ).map(([k,l])=>`<option value="${k}"${g.t===k?' selected':''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="sg-id">Élément</label><select id="sg-id" data-sig="id"><option value="">—</option>${opts.map(([id,n])=>`<option value="${esc(id)}"${g.id===id?' selected':''}>${esc(n)}</option>`).join('')}</select></div></div>
    <div class="frow"><div class="field"><label for="sg-c">Champ</label><input id="sg-c" type="text" data-sig="champ" value="${esc(g.champ)}" placeholder="Variante de Vision"></div>
    <div class="field"><label for="sg-s">Statut</label><select id="sg-s" data-sig="statut">${Object.entries(SIG_ST).map(([k,l])=>`<option value="${k}"${g.statut===k?' selected':''}>${l}</option>`).join('')}</select></div></div>
    <div class="field"><label for="sg-n">Note (facultative)</label><input id="sg-n" type="text" data-sig="note" value="${esc(g.note)}" placeholder="Nyctalopie = Vision nocturne ?"></div>
    ${g.err?`<div class="pinerr">${esc(g.err)}</div>`:''}
    <div class="actions"><button class="btn ghost" data-act="sigCancel">Annuler</button><button class="btn pri" data-act="sigAdd">Ajouter</button></div></div>`;}

/* ---------- Actions ---------- */
function socleAct(a,d){
  if(a==='migRun'){runMigration();return true;}
  if(a==='migSeen'){S.migDone=null;return true;}
  if(a==='goDonnees'){if(!isGest())return true;S.edit=true;navClear();S.migDone=null;S.view='params';S.ptab='donnees';S.dlg=null;window.scrollTo(0,0);return true;}
  if(!/^sig/.test(a))return false;
  if(!isGest())return true;
  if(a==='sigF'){const f=S.sigF=S.sigF||{st:'',t:'',res:false};if(d.k==='res')f.res=!!d.v;else f[d.k]=d.v;}
  else if(a==='sigNew'){S.sigNew={t:'race',id:'',champ:'',statut:'completer',note:'',err:''};}
  else if(a==='sigCancel'){S.sigNew=null;}
  else if(a==='sigAdd'){const g=S.sigNew;if(!g)return true;if(!g.id||!(g.champ||'').trim()){g.err="Choisis l'élément et indique le champ concerné.";return true;}
    saveSignals([...sigStored(),{id:uid('sg'),obj:{t:g.t,id:g.id},champ:g.champ.trim(),statut:g.statut,note:(g.note||'').trim(),date:today(),by:ME||'',ok:false}]);S.sigNew=null;}
  else if(a==='sigOk'){saveSignals(sigStored().map(s=>s.id===d.id?{...s,ok:!s.ok,okDate:s.ok?null:today()}:s));}
  return true;}
/* Saisie dans le formulaire de signalement : 'r' = réafficher (listes), true = rien à réafficher */
function socleInput(t,type){if(t.dataset.sig===undefined||!S.sigNew)return false;const k=t.dataset.sig;S.sigNew[k]=t.value;if(k==='t')S.sigNew.id='';
  if(type==='input'){S.dirty=true;return true;}return t.tagName==='SELECT'?'r':true;}
