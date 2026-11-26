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
  if(G&&S.kk&&S.kk.step)return kkView(); /* lot 8 */
  let h=`<div class="card"><h3 class="rs" style="margin-top:0">Données</h3>
    <div class="ui-kv"><span>Version des données</span><b>${v}</b><span>Version attendue par l'appli</span><b>${SCHEMA_V}</b><span>Dernière mise à jour</span><b>${sc.date?fmtDate(sc.date)+(sc.by&&S.players[sc.by]?' · '+esc(S.players[sc.by].nom):''):'—'}</b></div>
    ${S.migPending?`<div class="ui-small" style="margin-top:8px">Une mise à jour des données est en attente : voir la carte en haut de l'écran.</div>`:''}
    ${(sc.hist||[]).length?`<details class="ui-det"><summary>Historique des mises à jour</summary>${sc.hist.slice().reverse().map(x=>`<div class="ui-small"><b>Version ${x.v}</b> · ${fmtDate(x.date)}${(x.rep||[]).map(l=>`<div>${esc(l)}</div>`).join('')}</div>`).join('')}</details>`:''}</div>`;
  if(!G)return h+`<div class="card"><div class="muted">Le journal des signalements est réservé aux personnes ayant les droits de gestion.</div></div>`;
  h+=kkCard(); /* lot 8 */
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
  if(/^kk/.test(a))return kkAct(a,d); /* lot 8 */
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
function socleInput(t,type){if(t.dataset.kkfile!==undefined){if(type==='change')kkFile(t);return true;} /* lot 8 */
  if(t.dataset.kkmode!==undefined){if(S.kk){S.kk.mode=t.value;kkPlan();}return 'r';}
  if(t.dataset.sig===undefined||!S.sigNew)return false;const k=t.dataset.sig;S.sigNew[k]=t.value;if(k==='t')S.sigNew.id='';
  if(type==='input'){S.dirty=true;return true;}return t.tagName==='SELECT'?'r':true;}

/* ---------- Lot 8 (26/11/2026) : import Kanka (gestion) ----------
   Fichier préparé par Claude : {format:'xp-import', v:1, source:'kanka', genre:'lieu'|'pnj', date, items:[{id, kanka, data, imgs:[{k, m, th?, big?, url}], force?}],
   pj:[{id, idm}], infos:[texte], ignores:[{nom, pq}]}. Fiche reconnue par son identifiant, sinon par son adresse Kanka.
   Relance : un champ n'est mis à jour que s'il n'a pas été modifié dans l'appli depuis le dernier import (empreinte kk.src).
   Images : vignette (collection portraits) et grande image (table images), fournies dans le fichier (Kanka refuse la récupération depuis l'appli).
   Compte rendu : meta/imports, dernier import par genre. */
const KK_G={lieu:{un:'lieu',pl:'lieux',Pl:'Lieux'},pnj:{un:'PNJ',pl:'PNJ',Pl:'PNJ'},
  objet:{un:'objet',pl:'objets',Pl:'Objets'},bete:{un:'créature',pl:'créatures',Pl:'Créatures'},evenement:{un:'événement',pl:'événements',Pl:'Événements'},
  journal:{un:'journal ou quête',pl:'journaux et quêtes',Pl:'Journaux et quêtes'}}; /* lot 8 b : objets, créatures, événements, journaux et quêtes */
const KK_FI=new Set(['lieu','objet','bete','evenement']); /* genres rangés dans « fiches » */
const KK_F={lieu:['nom','type','parent','kanka','desc','fief','notes'],
  pnj:['nom','court','surnom','race','genre','ageLib','statut','kanka','por.role','por.fm','situ.titres','situ.familles','situ.orgs','situ.lieux','situ.poss'],
  objet:['nom','type','parent','kanka','desc','effet','crea','carac','det','lieu','uniq'],
  bete:['nom','type','kanka','desc','spec'],
  evenement:['num','nom','type','debut','duree','pj','lieux','kanka','desc'],
  journal:['nom','type','perso','parts','statut','pub','desc','kanka']};
const KK_LAB={nom:'nom',type:'type',parent:'lieu parent',kanka:'lien Kanka',desc:'description',fief:'situation féerique',notes:'notes MJ',court:'nom court',surnom:'surnom',race:'race',genre:'genre',ageLib:'âge',statut:'statut',
  'por.role':'rôle','por.fm':'forme masquée','situ.titres':'titres','situ.familles':'familles','situ.orgs':'organisations','situ.lieux':'résidence et lieux','situ.poss':'possessions',
  effet:'effet',crea:'créateur',carac:'caractéristiques',det:'détenteurs',lieu:'emplacement',uniq:'unique',spec:'spécimens connus',num:'numéro',debut:'début',duree:'durée',pj:'PJ',lieux:'lieux',
  perso:'personnage',parts:'participants',statut:'statut',pub:'lecture',ent:'entrées'};
function kkHash(v){const s=stable(v===undefined||kkEmpty(v)?null:v);let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);}
const kkGet=(o,p)=>p.split('.').reduce((x,k)=>x==null?undefined:x[k],o);
function kkSet(o,p,v){const k=p.split('.');let x=o;for(let i=0;i<k.length-1;i++){x[k[i]]=Object.assign({},x[k[i]]||{});x=x[k[i]];}x[k[k.length-1]]=clone(v);}
const kkEmpty=v=>v==null||v===''||(Array.isArray(v)&&!v.length)||(typeof v==='object'&&!Array.isArray(v)&&Object.values(v).every(kkEmpty));
const kkEq=(a,b)=>stable(kkEmpty(a)?null:a)===stable(kkEmpty(b)?null:b);
function kkFind(g,it){if(KK_FI.has(g)){const f=S.fiches&&S.fiches[it.id];if(f)return f;return fiAll().find(x=>x.genre===g&&it.kanka&&x.kanka===it.kanka)||null;}
  if(g==='journal'){const j=S.jour&&S.jour[it.id];if(j)return j;return Object.values(S.jour||{}).find(x=>x&&it.kanka&&x.kanka===it.kanka)||null;}
  return (S.chars&&S.chars[it.id])||Object.values(S.chars||{}).find(c=>it.kanka&&c.kanka===it.kanka)||null;}
const kkName=(g,x)=>g==='pnj'?(x.court||x.nom):x.nom;
/* Journaux : entrées du fichier absentes (même kid ou même titre) */
const kkEntNew=(ex,it)=>(it.data.ent||[]).filter(e=>!((ex&&ex.ent)||[]).some(x=>(e.kid&&x.kid===e.kid)||nrm(x.nom)===nrm(e.nom)));
/* Lecture du fichier choisi */
function kkFile(t){const f=t.files&&t.files[0];t.value='';if(!f||!isGest())return;S.kk={step:'lecture',nomF:f.name};render();
  const rd=new FileReader();rd.onerror=()=>{S.kk={step:'err',err:'Lecture du fichier impossible.'};render();};
  rd.onload=()=>{let F=null;try{F=JSON.parse(rd.result);}catch(e){}
    if(!F||F.format!=='xp-import'||!KK_G[F.genre]||!Array.isArray(F.items)){S.kk={step:'err',err:"Ce fichier n'est pas un fichier d'import de l'appli."};render();return;}
    S.kk={step:'apercu',F,nomF:f.name,mode:'maj'};kkPlan();render();};
  rd.readAsText(f);}
/* Calcul de l'aperçu : pour chaque fiche, créer / mettre à jour (champs) / à jour / ignorer */
function kkPlan(){const K=S.kk,F=K.F,g=F.genre,FL=KK_F[g];
  K.plan=F.items.map(it=>{const ex=kkFind(g,it),imgs=(it.imgs||[]);
    const imgTodo=imgs.filter(m=>!kkImgDone(ex,m)),imgKo=imgTodo.filter(m=>!m.th&&!m.big);
    if(!ex)return {it,act:'new',imgTodo,imgKo};
    if(K.mode==='skip')return {it,ex,act:'ign',why:'déjà dans l\'appli',imgTodo:[],imgKo:[]};
    const src=(ex.kk&&ex.kk.src)||null,up=[],keep=[];
    for(const p of FL){const nv=kkGet(it.data,p);if(nv===undefined)continue;const cur=kkGet(ex,p);if(kkEq(cur,nv))continue;
      const free=src?(src[p]!==undefined&&kkHash(cur)===src[p])||(src[p]===undefined&&kkEmpty(cur)):(kkEmpty(cur)||(it.force||[]).includes(p));
      (free?up:keep).push(p);}
    if(g==='journal'&&kkEntNew(ex,it).length)up.push('ent');
    return {it,ex,act:up.length?'maj':'same',up,keep,imgTodo,imgKo};});
  const pj=(F.pj||[]).filter(x=>S.chars[x.id]&&!(S.chars[x.id].idm||'').trim()&&x.idm);
  K.pj=pj;}
function kkImgDone(ex,m){if(!ex)return false;if(m.m!=='big'&&S.ptr&&S.ptr[m.k])return true;return !!(ex.kk&&(ex.kk.img||[]).includes(m.k));}
/* Liens vers des fiches absentes de l'appli et du fichier : affichés en texte jusqu'à leur import */
function kkLinksOut(){const K=S.kk,F=K.F,ids=new Set(F.items.map(i=>i.id));let n=0;
  for(const it of F.items){const s=JSON.stringify(it.data);s.replace(/@\[(perso|fiche):([^|\]]+)\|/g,(m,t,id)=>{if(!ids.has(id)&&!(t==='perso'?S.chars[id]:S.fiches[id]))n++;return m;});}
  return n;}
/* ---------- Carte de l'écran Données ---------- */
function kkCard(){const R=(S.kkImp||{});
  const last=g=>{const r=R[g];if(!r)return `<span class="muted">pas encore importé</span>`;return `<span>${fmtDate(r.date)} · <b class="kkok">${r.nNew} créé${r.nNew>1?'s':''}</b>${r.nMaj?` · ${r.nMaj} mis à jour`:''}${(r.imgKo||[]).length?` · <span class="kkko">${r.imgKo.length} image${r.imgKo.length>1?'s':''} manquée${r.imgKo.length>1?'s':''}</span>`:''}</span>`;};
  return `<div class="card kkcard"><h3 class="rs" style="margin-top:0">Import Kanka</h3>
    <div class="small">Crée ou met à jour des fiches à partir d'un fichier préparé depuis Kanka. Chaque fiche garde son lien Kanka : relancer un import ne crée pas de doublon, et ce qui a été modifié dans l'appli depuis est gardé.</div>
    <div class="lab2" style="margin-top:10px">Ordre conseillé</div>
    <div class="kkord">${Object.keys(KK_G).map((g,i)=>`<div class="srow"><span>${i+1}. ${KK_G[g].Pl}</span>${last(g)}</div>`).join('')}<div class="srow muted"><span>Familles, organisations, cartes</span><span>à venir</span></div></div>
    ${S.visit||writesLocked()?'<div class="muted small">Import impossible en lecture seule.</div>':`<label class="btn pri kkpick">Choisir un fichier d'import (.json)<input type="file" accept=".json,application/json" data-kkfile hidden></label>`}
    ${Object.keys(R).filter(g=>KK_G[g]).length?`<div class="actions" style="justify-content:flex-start">${Object.keys(KK_G).filter(g=>R[g]).map(g=>`<button type="button" class="lnk" data-act="kkRep" data-g="${g}">Compte rendu : ${KK_G[g].pl} ›</button>`).join('')}</div>`:''}
    <div class="kkwarn small">Avant un import : faire une sauvegarde (export Supabase). Les fiches importées sont révélées : visibles de toute la table.</div></div>`;}
/* ---------- Écrans de l'import ---------- */
function kkView(){const K=S.kk;
  if(K.step==='lecture')return `<div class="card"><div class="muted">Lecture de ${esc(K.nomF||'')}…</div></div>`;
  if(K.step==='err')return `<div class="card"><h3 class="rs" style="margin-top:0">Import Kanka</h3><div class="pinerr">${esc(K.err)}</div><div class="actions"><button class="btn" data-act="kkClose">Retour</button></div></div>`;
  if(K.step==='run')return kkRunView();
  if(K.step==='fin')return kkRepView(K.rep,true);
  if(K.step==='rep')return kkRepView(K.rep,false);
  const F=K.F,g=F.genre,G=KK_G[g],P=K.plan,n=a=>P.filter(x=>x.act===a).length;
  const nImg=P.reduce((s,x)=>s+x.imgTodo.length,0),nKo=P.reduce((s,x)=>s+x.imgKo.length,0),nOut=kkLinksOut(),todo=n('new')+n('maj')+(K.pj||[]).length;
  let h=`<div class="kkhd"><button type="button" class="back" data-act="kkClose">✕ Annuler</button><h2 class="rs" style="margin:0">Aperçu de l'import</h2></div>`;
  h+=`<div class="muted small">Fichier <b>${esc(K.nomF||'')}</b> · préparé le ${fmtDate(F.date||'')} · ${esc(G.Pl)}</div>`;
  h+=`<div class="kknums"><div><b class="num kkok">${n('new')}</b><span>à créer</span></div><div><b class="num">${n('maj')}</b><span>à mettre à jour</span></div><div><b class="num">${n('same')+n('ign')+(F.ignores||[]).length}</b><span>à jour ou ignorées</span></div></div>`;
  const inf=[];if(nImg)inf.push([nImg,`image${nImg>1?'s':''} à enregistrer${nKo?` (dont ${nKo} absente${nKo>1?'s':''} du fichier)`:''}.`]);
  if(nOut)inf.push([nOut,`lien${nOut>1?'s':''} vers des fiches pas encore dans l'appli : affiché${nOut>1?'s':''} en texte, ${nOut>1?'ils deviendront des liens':'il deviendra un lien'} à leur import.`]);
  if((F.ignores||[]).length)inf.push([F.ignores.length,`ignoré${F.ignores.length>1?'s':''} : ${F.ignores.map(x=>x.nom+(x.pq?' ('+x.pq+')':'')).join(', ')}.`]);
  if((K.pj||[]).length)inf.push([K.pj.length,`identité${K.pj.length>1?'s':''} masquée${K.pj.length>1?'s':''} de PJ à renseigner : ${K.pj.map(x=>esc(x.idm)+' ('+esc(S.chars[x.id].court)+')').join(', ')}.`]);
  h+=`<div class="card"><h3 class="rs" style="margin-top:0">À savoir avant de valider</h3>${inf.map(([a,b])=>`<div class="kkinf"><b class="num">${a}</b><span>${b}</span></div>`).join('')}${(F.infos||[]).map(t=>`<div class="kkinf"><b>·</b><span>${esc(t)}</span></div>`).join('')}</div>`;
  if(P.some(x=>x.ex))h+=`<div class="card"><div class="lab2">Fiches déjà dans l'appli</div>
    <label class="kkrad"><input type="radio" name="kkmode" data-kkmode value="maj"${K.mode==='maj'?' checked':''}> Mettre à jour les champs qui n'ont pas été modifiés dans l'appli</label>
    <label class="kkrad"><input type="radio" name="kkmode" data-kkmode value="skip"${K.mode==='skip'?' checked':''}> Ne pas toucher aux fiches existantes</label></div>`;
  const st=x=>x.act==='new'?'<span class="kkst kkok">nouveau</span>':x.act==='maj'?`<span class="kkst">mise à jour · ${x.up.map(p=>KK_LAB[p]||p).join(', ')}${x.keep.length?` <span class="muted">(gardé : ${x.keep.map(p=>KK_LAB[p]||p).join(', ')})</span>`:''}</span>`:x.act==='same'?'<span class="kkst muted">à jour</span>':`<span class="kkst muted">ignoré · ${esc(x.why||'')}</span>`;
  const row=(x,dep)=>`<div class="srow kkrow" style="padding-left:${6+dep*16}px"><span>${x.it.data.num?esc(x.it.data.num)+' ':''}${esc(x.it.data.nom||'')}${x.it.data.type?` <span class="muted">· ${esc(x.it.data.type)}</span>`:''}${x.imgKo.length?` <span class="kkko small">· ${x.imgKo.length} image${x.imgKo.length>1?'s':''} absente${x.imgKo.length>1?'s':''}</span>`:''}</span>${st(x)}</div>`;
  let det='';
  if(g==='lieu'||g==='objet'){const by={};for(const x of P)(by[x.it.data.parent||'']=by[x.it.data.parent||'']||[]).push(x);const ids=new Set(P.map(x=>x.it.id));
    const walk=(pid,dep)=>(by[pid]||[]).sort((a,b)=>(a.it.data.nom||'').localeCompare(b.it.data.nom||'','fr')).map(x=>row(x,dep)+walk(x.it.id,dep+1)).join('');
    det=walk('',0)+P.filter(x=>x.it.data.parent&&!ids.has(x.it.data.parent)).map(x=>row(x,0)).join('');}
  else det=P.slice().sort((a,b)=>(a.it.data.nom||'').localeCompare(b.it.data.nom||'','fr',{sensitivity:'base'})).map(x=>row(x,0)).join('')+(F.ignores||[]).map(x=>`<div class="srow kkrow"><span>${esc(x.nom)}</span><span class="kkst muted">ignoré · ${esc(x.pq||'')}</span></div>`).join('');
  h+=`<details class="card kkdet"${P.length<=60?' open':''}><summary class="lab2">Détail · ${P.length} ${G.pl}</summary>${det}</details>`;
  h+=`<div class="actions kkact"><button class="btn" data-act="kkClose">Annuler</button><button class="btn pri" data-act="kkGo"${todo||nImg?'':' disabled'}>${todo?`Importer ${todo} ${todo>1?G.pl:G.un}`:nImg?'Enregistrer les images':'Rien à importer'}</button></div>`;
  return h;}
function kkRunView(){const K=S.kk,p=K.prog,pc=(a,b)=>b?Math.round(a*100/b):100;
  const bar=(lab,a,b)=>`<div class="kkbar"><div class="srow"><span>${lab}</span><span>${a} / ${b}${a>=b?' ✓':''}</span></div><div class="kkb"><span style="width:${pc(a,b)}%"></span></div></div>`;
  return `<h2 class="rs">Import en cours…</h2><div class="card">${bar('Fiches',p.f,p.nf)}${bar('Images',p.i,p.ni)}</div>
    <div class="kkwarn small">Garde cet écran ouvert jusqu'à la fin. Si l'import est interrompu, relance le même fichier : ce qui est déjà fait est reconnu.</div>`;}
function kkRepView(r,fin){if(!r)return '';const G=KK_G[r.genre]||KK_G.lieu;
  let h=`<div class="kkhd"><button type="button" class="back" data-act="kkClose">‹ Données</button><h2 class="rs" style="margin:0">${fin?'Import terminé':'Compte rendu · '+G.Pl}</h2></div>`;
  h+=`<div class="kkdone"><b>${r.nNew} ${r.nNew>1?G.pl+' créés':G.un+' créé'}</b>${r.nMaj?` · ${r.nMaj} mis à jour`:''}${r.nPj?` · ${r.nPj} identité${r.nPj>1?'s':''} masquée${r.nPj>1?'s':''}`:''} · ${r.imgOk} image${r.imgOk>1?'s':''} sur ${r.imgOk+(r.imgKo||[]).length} · ${fmtDate(r.date)}${r.by&&S.players[r.by]?' · '+esc(S.players[r.by].nom):''}</div>`;
  const ko=r.imgKo||[],er=r.err||[];
  if(ko.length||er.length)h+=`<div class="card"><h3 class="rs" style="margin-top:0">À reprendre</h3>${er.length?`<div class="kkinf"><b class="num kkko">${er.length}</b><span>enregistrement${er.length>1?'s':''} refusé${er.length>1?'s':''} : ${er.map(esc).join(', ')}. Relancer le même fichier.</span></div>`:''}${ko.length?`<div class="kkinf"><b class="num kkko">${ko.length}</b><span>image${ko.length>1?'s':''} non enregistrée${ko.length>1?'s':''} : ${ko.map(x=>esc(x.nom)+' ('+esc(x.lab)+')').join(', ')}. À ajouter à la main, ou relancer avec un nouveau fichier.</span></div>`:''}</div>`;
  const kkO=id=>KK_FI.has(r.genre)?(S.fiches[id]&&{o:{t:'fiche',id},n:S.fiches[id].nom}):r.genre==='journal'?(S.jour&&S.jour[id]&&{o:{t:'jour',id},n:S.jour[id].nom}):(S.chars[id]&&{o:{t:'perso',id},n:S.chars[id].court||S.chars[id].nom});
  const L=(r.cree||[]).map(kkO).filter(Boolean);
  if(L.length)h+=`<details class="card kkdet"${L.length<=12?' open':''}><summary class="lab2">Fiches créées · ${L.length}</summary>${L.map(x=>`<div class="srow">${lk(x.o,x.n)}</div>`).join('')}</details>`;
  h+=`<div class="actions kkact"><button class="btn" data-act="kkClose">${fin?'Importer un autre fichier':'Retour'}</button><button class="btn pri" data-act="kkSee" data-g="${r.genre}">${r.genre==='journal'?'Voir les journaux de '+esc((S.chars[(((S.jour||{})[(r.cree||[])[0]])||{}).perso]||{}).court||'Kerian'):'Voir les '+G.pl}</button></div>`;
  return h;}
/* ---------- Actions ---------- */
function kkAct(a,d){if(!isGest())return true;
  if(a==='kkClose'){if(S.kk&&S.kk.step==='run')return true;S.kk=null;window.scrollTo(0,0);return true;}
  if(a==='kkRep'){const r=(S.kkImp||{})[d.g];if(r)S.kk={step:'rep',rep:r};window.scrollTo(0,0);return true;}
  if(a==='kkSee'){const r=(S.kk&&S.kk.rep)||(S.kkImp||{})[d.g]||{};S.kk=null;navClear();
    if(d.g==='lieu'||d.g==='objet'||d.g==='bete'){S.view='univers';S.uni=d.g;S.fi=null;}
    else if(d.g==='evenement'){S.view='univers';S.uni='chron';S.fi=null;}
    else if(d.g==='journal'){const j=(S.jour||{})[(r.cree||[])[0]],pc=j&&S.chars[j.perso]?j.perso:'kerian';S.view='sheet';S.sel=pc;S.shTab='jour';S.jrSel='j';}
    else{S.view='team';S.teamSel='pnj';}window.scrollTo(0,0);return true;}
  if(a==='kkGo'){if(!S.kk||S.kk.step!=='apercu'||S.visit||writesLocked()||!DB)return true;kkRun();return true;}
  return true;}
async function kkRun(){const K=S.kk,F=K.F,g=F.genre,FL=KK_F[g],P=K.plan.filter(x=>x.act==='new'||x.act==='maj'||x.imgTodo.length);
  const now=new Date().toISOString(),rep={genre:g,date:today(),by:ME||'',nNew:0,nMaj:0,nPj:0,imgOk:0,imgKo:[],err:[],cree:[]};
  K.step='run';K.prog={f:0,nf:P.filter(x=>x.act==='new'||x.act==='maj').length+(K.pj||[]).length,i:0,ni:P.reduce((s,x)=>s+x.imgTodo.length,0)};render();
  let ptr=false;const tick=()=>{if(S.view==='params'&&S.ptab==='donnees')render();};
  for(const x of P){const it=x.it,ex=x.ex?kkFind(g,it):null;
    /* images d'abord : la fiche note celles qui sont enregistrées */
    const done=[];
    for(const m of x.imgTodo){try{
        if(!m.th&&!m.big)throw new Error('absente');
        if(m.big)await DB.img.set(m.k,m.big),FI_BIG[m.k]=m.big;
        if(m.th&&m.m!=='big'){await DB.doc('portraits/'+m.k).set({img:m.th,t:Date.now()});S.ptr={...(S.ptr||{}),[m.k]:m.th};ptr=true;}
        done.push(m.k);rep.imgOk++;}
      catch(e){rep.imgKo.push({nom:it.data.nom||it.id,lab:m.k.startsWith('ill-txt-')?'image du texte':m.k.startsWith('ill-carte-')?'carte':m.k.startsWith('ill-spec-')?'image du spécimen':g==='pnj'?'portrait':'image'});}
      K.prog.i++;tick();}
    if(x.act!=='new'&&x.act!=='maj'&&!done.length)continue;
    let o;
    if(!ex){o=KK_FI.has(g)?{id:it.id,genre:g,nom:'',type:'',parent:'',kanka:'',vis:'rev',eye:{desc:true,sait:true,fief:true,pers:true,orgs:true,obj:true,carte:true,effet:true,carac:true,det:true},desc:'',sait:[],notes:'',par:ME||'',cree:now}
        :g==='journal'?{id:it.id,genre:it.data.genre==='quete'?'quete':'journal',nom:'',type:'',perso:'',parts:[],pub:true,desc:'',ent:[],jaugesFinies:[],par:ME||'',cree:now}
        :Object.assign(newChar(it.id,it.data.court||it.data.nom,it.data.nom,'PNJ'),{vis:'rev',eye:{...PN_EYE0,autres:true},par:ME||'',cree:now});
      for(const p of FL){const v=kkGet(it.data,p);if(v!==undefined)kkSet(o,p,v);}
      o.kk={id:it.kanka||'',d:today(),src:Object.fromEntries(FL.filter(p=>kkGet(it.data,p)!==undefined).map(p=>[p,kkHash(kkGet(it.data,p))])),img:done};
      if(g==='journal')o.ent=clone(it.data.ent||[]);}
    else{o=clone(ex);const src={...((o.kk&&o.kk.src)||{})};
      for(const p of (x.act==='maj'?x.up:[])){if(p==='ent'){o.ent=[...(o.ent||[]),...clone(kkEntNew(o,it))];continue;}kkSet(o,p,kkGet(it.data,p));src[p]=kkHash(kkGet(it.data,p));}
      for(const p of FL){const v=kkGet(it.data,p);if(v!==undefined&&src[p]===undefined&&kkEq(kkGet(o,p),v))src[p]=kkHash(v);}
      o.kk={id:it.kanka||'',d:today(),src,img:[...new Set([...((o.kk&&o.kk.img)||[]),...done])]};}
    o.modif=now;
    try{if(KK_FI.has(g)){await DB.doc('fiches/'+o.id).set(o);S.fiches={...S.fiches,[o.id]:o};}
      else if(g==='journal'){await DB.doc('journaux/'+o.id).set(o);S.jour={...(S.jour||{}),[o.id]:o};}
      else{if(typeof fxSync==='function')o=fxSync(o);await DB.doc('chars/'+o.id).set(o);S.chars={...S.chars,[o.id]:o};}
      if(!ex){rep.nNew++;rep.cree.push(o.id);}else if(x.act==='maj')rep.nMaj++;}
    catch(e){console.error(e);rep.err.push(it.data.nom||it.id);}
    if(x.act==='new'||x.act==='maj')K.prog.f++;tick();}
  for(const x of K.pj||[]){const c=S.chars[x.id];if(c&&!(c.idm||'').trim()){const n=clone(c);n.idm=x.idm;try{await DB.doc('chars/'+n.id).set(n);S.chars={...S.chars,[n.id]:n};rep.nPj++;}catch(e){rep.err.push(c.court);}}K.prog.f++;tick();}
  if(ptr){S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});}
  const R={...(S.kkImp||{}),[g]:rep};S.kkImp=R;persist('meta/imports',R);
  K.step='fin';K.rep=rep;render();setTimeout(()=>toast('Import terminé'),0);}
