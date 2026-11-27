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
  if(G&&S.tx&&S.tx.step)return txView(); /* tableur du référentiel */
  let h=`<div class="card"><h3 class="rs" style="margin-top:0">Données</h3>
    <div class="ui-kv"><span>Version des données</span><b>${v}</b><span>Version attendue par l'appli</span><b>${SCHEMA_V}</b><span>Dernière mise à jour</span><b>${sc.date?fmtDate(sc.date)+(sc.by&&S.players[sc.by]?' · '+esc(S.players[sc.by].nom):''):'—'}</b></div>
    ${S.migPending?`<div class="ui-small" style="margin-top:8px">Une mise à jour des données est en attente : voir la carte en haut de l'écran.</div>`:''}
    ${(sc.hist||[]).length?`<details class="ui-det"><summary>Historique des mises à jour</summary>${sc.hist.slice().reverse().map(x=>`<div class="ui-small"><b>Version ${x.v}</b> · ${fmtDate(x.date)}${(x.rep||[]).map(l=>`<div>${esc(l)}</div>`).join('')}</div>`).join('')}</details>`:''}</div>`;
  if(!G)return h+`<div class="card"><div class="muted">Le journal des signalements est réservé aux personnes ayant les droits de gestion.</div></div>`;
  h+=kkCard()+txCard(); /* lot 8 ; tableur du référentiel */
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
  if(/^tx/.test(a))return txAct(a,d); /* tableur du référentiel */
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
  if(t.dataset.txfile!==undefined){if(type==='change')txFile(t);return true;} /* tableur du référentiel */
  if(t.dataset.txg!==undefined){if(type==='change'){S.txSel=S.txSel||{};S.txSel[t.dataset.txg]=t.checked;return 'r';}return true;}
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
  journal:{un:'journal ou quête',pl:'journaux et quêtes',Pl:'Journaux et quêtes'},
  org:{un:'organisation',pl:'organisations',Pl:'Organisations',f:true},famille:{un:'famille',pl:'familles',Pl:'Familles',f:true},
  carte:{un:'carte',pl:'cartes',Pl:'Cartes',f:true},rep:{un:'repère',pl:'repères',Pl:'Repères des cartes'},
  pw:{un:'pouvoir',pl:'pouvoirs',Pl:'Pouvoirs'},cap:{un:'capacité naturelle',pl:'capacités naturelles',Pl:'Capacités naturelles',f:true},
  art:{un:'art obscur',pl:'arts obscurs',Pl:'Arts obscurs'},
  chrono:{un:'chronologie',pl:'chronologies',Pl:'Chronologies',f:true},regle:{un:'règle en images',pl:'règles en images',Pl:'Règles en images',f:true}}; /* import Kanka fin (26/11) */ /* arts obscurs (26/11) */ /* import des pouvoirs et capacités (26/11) */ /* lot Cartes */ /* lot 8 b : objets, créatures, événements, journaux et quêtes ; lot 5 a : organisations ; lot 5 b : familles */
const KK_FI=new Set(['lieu','objet','bete','evenement','org','famille','carte','rep','art','chrono','regle']); /* genres rangés dans « fiches » */
const KK_F={lieu:['nom','type','parent','kanka','desc','fief','notes'],
  pnj:['nom','court','surnom','race','genre','ageLib','statut','kanka','por.role','por.fm','situ.titres','situ.familles','situ.orgs','situ.lieux','situ.poss','pnpw','eye.pw'],
  objet:['nom','type','parent','kanka','desc','effet','crea','carac','det','lieu','uniq'],
  bete:['nom','type','kanka','desc','spec'],
  evenement:['num','nom','type','debut','duree','pj','lieux','kanka','desc'],
  journal:['nom','type','perso','parts','statut','pub','desc','kanka'],
  org:['nom','type','parent','kanka','desc','sait','prat','rangs','titres','rel','mbx'],
  famille:['nom','type','parent','suzT','kanka','desc','devise','race','speci','terr','vasx','mbx'],
  carte:['nom','type','parent','lieu','kanka','desc','iw','ih','ech'],rep:['nom','carte','x','y','cat','cib','note'],
  pw:['nom','type','act','cib','dur','por','res','zon','desc','kanka'],cap:['nom','type','act','cib','dur','por','res','zon','desc','kanka'],
  art:['nom','type','kanka','desc','comp','org','pre','max','cSort','nReq','niv'],
  chrono:['nom','type','kanka','desc','eres','els'],regle:['nom','kanka','imgs','ord']};
const KK_EL=new Set(['pw','cap']); /* genres rangés dans meta/pouvoirs et meta/capacites */
const KK_LABEL={comp:'compétence cachée',org:'organisation liée',pre:'prérequis',max:'rang maximum',cSort:'coût d\'un sort',nReq:'sorts requis',niv:'noms des niveaux',act:'activation',cib:'cible',dur:'durée',por:'portée',res:'résistance',zon:'zone'};
const kkLab=(g,p)=>((KK_EL.has(g)||g==='art')&&KK_LABEL[p])||KK_LAB[p]||p;
const KK_LAB={nom:'nom',type:'type',parent:'lieu parent',kanka:'lien Kanka',desc:'description',fief:'situation féerique',notes:'notes MJ',court:'nom court',surnom:'surnom',race:'race',genre:'genre',ageLib:'âge',statut:'statut',
  'por.role':'rôle','por.fm':'forme masquée','situ.titres':'titres','situ.familles':'familles','situ.orgs':'organisations','situ.lieux':'résidence et lieux','situ.poss':'possessions',
  effet:'effet',crea:'créateur',carac:'caractéristiques',det:'détenteurs',lieu:'emplacement',uniq:'unique',spec:'spécimens connus',num:'numéro',debut:'début',duree:'durée',pj:'PJ',lieux:'lieux',
  perso:'personnage',parts:'participants',statut:'statut',pub:'lecture',ent:'entrées',
  sait:"ce que l'on sait",prat:'pratiques',rangs:'rangs internes',titres:'titres cumulables',rel:'relations',mbx:'membres en texte',suzT:'suzerain en texte',devise:'devise',speci:'spécificité',terr:'territoires',vasx:'vassales sans fiche',iw:'largeur de l\'image',ih:'hauteur de l\'image',ech:'échelle',carte:'carte',x:'position',y:'position',cat:'catégorie',cib:'fiche rattachée',note:'note',pnpw:'pouvoirs et capacités','eye.pw':'visibilité des pouvoirs',eres:'ères',els:'éléments',imgs:'images',ord:'ordre'};
function kkHash(v){const s=stable(v===undefined||kkEmpty(v)?null:v);let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);}
const kkGet=(o,p)=>p.split('.').reduce((x,k)=>x==null?undefined:x[k],o);
function kkSet(o,p,v){const k=p.split('.');let x=o;for(let i=0;i<k.length-1;i++){x[k[i]]=Object.assign({},x[k[i]]||{});x=x[k[i]];}x[k[k.length-1]]=clone(v);}
const kkEmpty=v=>v==null||v===''||(Array.isArray(v)&&!v.length)||(typeof v==='object'&&!Array.isArray(v)&&Object.values(v).every(kkEmpty));
const kkEq=(a,b)=>stable(kkEmpty(a)?null:a)===stable(kkEmpty(b)?null:b);
function kkFind(g,it){if(KK_EL.has(g)){const M=(g==='pw'?S.pouvoirs:S.capacites)||{},id=M[it.id]?it.id:Object.keys(M).find(k=>(it.kanka&&M[k].kanka===it.kanka)||nrm(M[k].nom).replace(/œ/g,'oe')===nrm(it.data.nom).replace(/œ/g,'oe'));return id?{...M[id],id}:null;}
  if(KK_FI.has(g)){const f=S.fiches&&S.fiches[it.id];if(f)return f;return fiAll().find(x=>x.genre===g&&it.kanka&&x.kanka===it.kanka)||null;}
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
  K.pj=pj;K.mem=g==='org'?kkOrgMem(F,true):g==='famille'?kkFamMem(F,true):null;}
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
    <div class="kkord">${Object.keys(KK_G).map((g,i)=>`<div class="srow"><span>${i+1}. ${KK_G[g].Pl}</span>${last(g)}</div>`).join('')}</div>
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
  const nImg=P.reduce((s,x)=>s+x.imgTodo.length,0),nKo=P.reduce((s,x)=>s+x.imgKo.length,0),nOut=kkLinksOut(),todo=n('new')+n('maj')+(K.pj||[]).length+((K.mem&&K.mem.n)||0);
  let h=`<div class="kkhd"><button type="button" class="back" data-act="kkClose">✕ Annuler</button><h2 class="rs" style="margin:0">Aperçu de l'import</h2></div>`;
  h+=`<div class="muted small">Fichier <b>${esc(K.nomF||'')}</b> · préparé le ${fmtDate(F.date||'')} · ${esc(G.Pl)}</div>`;
  h+=`<div class="kknums"><div><b class="num kkok">${n('new')}</b><span>à créer</span></div><div><b class="num">${n('maj')}</b><span>à mettre à jour</span></div><div><b class="num">${n('same')+n('ign')+(F.ignores||[]).length}</b><span>à jour ou ignorées</span></div></div>`;
  const inf=[];if(nImg)inf.push([nImg,`image${nImg>1?'s':''} à enregistrer${nKo?` (dont ${nKo} absente${nKo>1?'s':''} du fichier)`:''}.`]);
  if(nOut)inf.push([nOut,`lien${nOut>1?'s':''} vers des fiches pas encore dans l'appli : affiché${nOut>1?'s':''} en texte, ${nOut>1?'ils deviendront des liens':'il deviendra un lien'} à leur import.`]);
  if((F.ignores||[]).length)inf.push([F.ignores.length,`ignoré${F.ignores.length>1?'s':''} : ${F.ignores.map(x=>x.nom+(x.pq?' ('+x.pq+')':'')).join(', ')}.`]);
  if(K.mem&&K.mem.n)inf.push([K.mem.n,`personnage${K.mem.n>1?'s':''} dont la Situation sera complétée (${g==='famille'?'familles reliées ; famille mère retirée quand la branche est indiquée':`organisations reliées, rang, rôle, supérieur${K.mem.t?` ; ${K.mem.t} titre${K.mem.t>1?'s':''} de la Monarchie`:''}`}). Ce qui a été saisi dans l'appli est gardé.`]);
  if(K.mem&&K.mem.ko.length)inf.push([K.mem.ko.length,`appartenance${K.mem.ko.length>1?'s':''} ignorée${K.mem.ko.length>1?'s':''} (personnage absent de l'appli).`]);
  if((K.pj||[]).length)inf.push([K.pj.length,`identité${K.pj.length>1?'s':''} masquée${K.pj.length>1?'s':''} de PJ à renseigner : ${K.pj.map(x=>esc(x.idm)+' ('+esc(S.chars[x.id].court)+')').join(', ')}.`]);
  h+=`<div class="card"><h3 class="rs" style="margin-top:0">À savoir avant de valider</h3>${inf.map(([a,b])=>`<div class="kkinf"><b class="num">${a}</b><span>${b}</span></div>`).join('')}${(F.infos||[]).map(t=>`<div class="kkinf"><b>·</b><span>${esc(t)}</span></div>`).join('')}</div>`;
  if(P.some(x=>x.ex))h+=`<div class="card"><div class="lab2">Fiches déjà dans l'appli</div>
    <label class="kkrad"><input type="radio" name="kkmode" data-kkmode value="maj"${K.mode==='maj'?' checked':''}> Mettre à jour les champs qui n'ont pas été modifiés dans l'appli</label>
    <label class="kkrad"><input type="radio" name="kkmode" data-kkmode value="skip"${K.mode==='skip'?' checked':''}> Ne pas toucher aux fiches existantes</label></div>`;
  const st=x=>x.act==='new'?'<span class="kkst kkok">nouveau</span>':x.act==='maj'?`<span class="kkst">mise à jour · ${x.up.map(p=>kkLab(g,p)).join(', ')}${x.keep.length?` <span class="muted">(gardé : ${x.keep.map(p=>kkLab(g,p)).join(', ')})</span>`:''}</span>`:x.act==='same'?'<span class="kkst muted">à jour</span>':`<span class="kkst muted">ignoré · ${esc(x.why||'')}</span>`;
  const row=(x,dep)=>`<div class="srow kkrow" style="padding-left:${6+dep*16}px"><span>${x.it.data.num?esc(x.it.data.num)+' ':''}${esc(x.it.data.nom||'')}${x.it.data.type?` <span class="muted">· ${esc(x.it.data.type)}</span>`:''}${x.imgKo.length?` <span class="kkko small">· ${x.imgKo.length} image${x.imgKo.length>1?'s':''} absente${x.imgKo.length>1?'s':''}</span>`:''}</span>${st(x)}</div>`;
  let det='';
  if(g==='lieu'||g==='objet'||g==='org'||g==='famille'){const by={};for(const x of P)(by[x.it.data.parent||'']=by[x.it.data.parent||'']||[]).push(x);const ids=new Set(P.map(x=>x.it.id));
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
  h+=`<div class="kkdone"><b>${r.nNew} ${r.nNew>1?G.pl+(G.f?' créées':' créés'):G.un+(G.f?' créée':' créé')}</b>${r.nMaj?` · ${r.nMaj} mis à jour`:''}${r.nPj?` · ${r.nPj} identité${r.nPj>1?'s':''} masquée${r.nPj>1?'s':''}`:''}${r.nMem?` · ${r.nMem} Situation${r.nMem>1?'s':''} complétée${r.nMem>1?'s':''}`:''} · ${r.imgOk} image${r.imgOk>1?'s':''} sur ${r.imgOk+(r.imgKo||[]).length} · ${fmtDate(r.date)}${r.by&&S.players[r.by]?' · '+esc(S.players[r.by].nom):''}</div>`;
  const ko=r.imgKo||[],er=r.err||[];
  if(ko.length||er.length)h+=`<div class="card"><h3 class="rs" style="margin-top:0">À reprendre</h3>${er.length?`<div class="kkinf"><b class="num kkko">${er.length}</b><span>enregistrement${er.length>1?'s':''} refusé${er.length>1?'s':''} : ${er.map(esc).join(', ')}. Relancer le même fichier.</span></div>`:''}${ko.length?`<div class="kkinf"><b class="num kkko">${ko.length}</b><span>image${ko.length>1?'s':''} non enregistrée${ko.length>1?'s':''} : ${ko.map(x=>esc(x.nom)+' ('+esc(x.lab)+')').join(', ')}. À ajouter à la main, ou relancer avec un nouveau fichier.</span></div>`:''}</div>`;
  const kkO=id=>KK_EL.has(r.genre)?(((r.genre==='pw'?S.pouvoirs:S.capacites)||{})[id]&&{o:{t:r.genre,id},n:((r.genre==='pw'?S.pouvoirs:S.capacites)||{})[id].nom}):KK_FI.has(r.genre)?(S.fiches[id]&&(S.fiches[id].genre==='rep'?{o:{t:'fiche',id:S.fiches[id].carte},n:S.fiches[id].nom}:{o:{t:'fiche',id},n:S.fiches[id].nom})):r.genre==='journal'?(S.jour&&S.jour[id]&&{o:{t:'jour',id},n:S.jour[id].nom}):(S.chars[id]&&{o:{t:'perso',id},n:S.chars[id].court||S.chars[id].nom});
  const L=(r.cree||[]).map(kkO).filter(Boolean);
  if(L.length)h+=`<details class="card kkdet"${L.length<=12?' open':''}><summary class="lab2">Fiches créées · ${L.length}</summary>${L.map(x=>`<div class="srow">${lk(x.o,x.n)}</div>`).join('')}</details>`;
  h+=`<div class="actions kkact"><button class="btn" data-act="kkClose">${fin?'Importer un autre fichier':'Retour'}</button><button class="btn pri" data-act="kkSee" data-g="${r.genre}">${r.genre==='journal'?'Voir les journaux de '+esc((S.chars[(((S.jour||{})[(r.cree||[])[0]])||{}).perso]||{}).court||'Kerian'):'Voir les '+G.pl}</button></div>`;
  return h;}
/* ---------- Actions ---------- */
function kkAct(a,d){if(!isGest())return true;
  if(a==='kkClose'){if(S.kk&&S.kk.step==='run')return true;S.kk=null;window.scrollTo(0,0);return true;}
  if(a==='kkRep'){const r=(S.kkImp||{})[d.g];if(r)S.kk={step:'rep',rep:r};window.scrollTo(0,0);return true;}
  if(a==='kkSee'){const r=(S.kk&&S.kk.rep)||(S.kkImp||{})[d.g]||{};S.kk=null;navClear();
    if(d.g==='carte'||d.g==='rep'){S.view='univers';S.uni='carte';S.fi=null;}
    else if(d.g==='lieu'||d.g==='objet'||d.g==='bete'||d.g==='org'||d.g==='famille'||d.g==='art'){S.view='univers';S.uni=d.g;S.fi=null;}
    else if(d.g==='evenement'){S.view='univers';S.uni='chron';S.fi=null;}
    else if(d.g==='chrono'){S.view='univers';S.uni='chrono';S.fi=null;}
    else if(d.g==='regle'){S.view='rules';S.rgTab='img';S.rgNote=null;}
    else if(KK_EL.has(d.g)){S.view='univers';S.uni='pouvoirs';S.pcat=d.g;S.fi=null;}
    else if(d.g==='journal'){const j=(S.jour||{})[(r.cree||[])[0]],pc=j&&S.chars[j.perso]?j.perso:'kerian';S.view='sheet';S.sel=pc;S.shTab='jour';S.jrSel='j';}
    else{S.view='team';S.teamSel='pnj';}window.scrollTo(0,0);return true;}
  if(a==='kkGo'){if(!S.kk||S.kk.step!=='apercu'||S.visit||writesLocked()||!DB)return true;kkRun();return true;}
  return true;}
async function kkRun(){const K=S.kk,F=K.F,g=F.genre,FL=KK_F[g],P=K.plan.filter(x=>x.act==='new'||x.act==='maj'||x.imgTodo.length);if(g==='org')K.mem=kkOrgMem(F,true);if(g==='famille')K.mem=kkFamMem(F,true);
  const now=new Date().toISOString(),rep={genre:g,date:today(),by:ME||'',nNew:0,nMaj:0,nPj:0,imgOk:0,imgKo:[],err:[],cree:[]};
  K.step='run';K.prog={f:0,nf:P.filter(x=>x.act==='new'||x.act==='maj').length+(K.pj||[]).length+((K.mem&&K.mem.n)||0),i:0,ni:P.reduce((s,x)=>s+x.imgTodo.length,0)};render();
  let ptr=false,elDirty=false;const tick=()=>{if(S.view==='params'&&S.ptab==='donnees')render();};
  for(const x of P){const it=x.it,ex=x.ex?kkFind(g,it):null;
    /* images d'abord : la fiche note celles qui sont enregistrées */
    const done=[];
    for(const m of x.imgTodo){try{
        if(!m.th&&!m.big)throw new Error('absente');
        if(m.big)await DB.img.set(m.k,m.big),FI_BIG[m.k]=m.big;
        if(m.th&&m.m!=='big'){await DB.doc('portraits/'+m.k).set({img:m.th,t:Date.now()});S.ptr={...(S.ptr||{}),[m.k]:m.th};ptr=true;}
        done.push(m.k);rep.imgOk++;}
      catch(e){rep.imgKo.push({nom:it.data.nom||it.id,lab:m.k.startsWith('ill-txt-')?'image du texte':m.k.startsWith('ill-carte-')?'carte':m.k.startsWith('ill-spec-')?'image du spécimen':m.k.startsWith('ill-rg-')?'image de la règle':g==='pnj'?'portrait':'image'});}
      K.prog.i++;tick();}
    if(x.act!=='new'&&x.act!=='maj'&&!done.length)continue;
    let o;
    if(!ex){o=KK_EL.has(g)?{id:it.id,...elFull({})}:KK_FI.has(g)?{id:it.id,genre:g,nom:'',type:'',parent:'',kanka:'',vis:'rev',eye:{desc:true,sait:true,fief:true,pers:true,orgs:true,obj:true,carte:true,effet:true,carac:true,det:true,rangs:true,prat:true,mem:true,lieux:true,rel:true,terr:true,vas:true,pre:true,niv:true,sorts:true,prat:true},desc:'',sait:[],notes:'',par:ME||'',cree:now}
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
    try{if(KK_EL.has(g)){const M=g==='pw'?S.pouvoirs:S.capacites,{id:_i,...el}=o;delete el.modif;const n={...(M||{}),[o.id]:elFull(el)};if(g==='pw')S.pouvoirs=n;else S.capacites=n;elDirty=true;}
      else if(KK_FI.has(g)){await DB.doc('fiches/'+o.id).set(o);S.fiches={...S.fiches,[o.id]:o};}
      else if(g==='journal'){await DB.doc('journaux/'+o.id).set(o);S.jour={...(S.jour||{}),[o.id]:o};}
      else{if(typeof fxSync==='function')o=fxSync(o);await DB.doc('chars/'+o.id).set(o);S.chars={...S.chars,[o.id]:o};}
      if(!ex){rep.nNew++;rep.cree.push(o.id);}else if(x.act==='maj')rep.nMaj++;}
    catch(e){console.error(e);rep.err.push(it.data.nom||it.id);}
    if(x.act==='new'||x.act==='maj')K.prog.f++;tick();}
  if((g==='org'||g==='famille')&&F.membres){const M=g==='org'?kkOrgMem(F,false):kkFamMem(F,false);for(const n of M.save){try{await DB.doc('chars/'+n.id).set(n);S.chars={...S.chars,[n.id]:n};rep.nMem=(rep.nMem||0)+1;}catch(e){rep.err.push(n.court||n.id);}K.prog.f++;tick();}}
  for(const x of K.pj||[]){const c=S.chars[x.id];if(c&&!(c.idm||'').trim()){const n=clone(c);n.idm=x.idm;try{await DB.doc('chars/'+n.id).set(n);S.chars={...S.chars,[n.id]:n};rep.nPj++;}catch(e){rep.err.push(c.court);}}K.prog.f++;tick();}
  if(elDirty){if(g==='pw')savePouvoirs(S.pouvoirs);else saveCapacites(S.capacites);} /* un seul enregistrement du catalogue */
  if(ptr){S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});}
  const R={...(S.kkImp||{}),[g]:rep};S.kkImp=R;persist('meta/imports',R);
  K.step='fin';K.rep=rep;render();setTimeout(()=>toast('Import terminé'),0);}
/* Lot 5 a : import des organisations — appartenances versées dans la Situation des personnages.
   F.membres : [{c (personnage), o (organisation), rang?, tit? (titre de la Monarchie), role?, sup? (personnage), fem? (titre au féminin)}].
   Ligne d'organisation : reliée par fiche ou par nom, complétée seulement là où elle est vide. Titre : ancienne ligne en texte du même rang
   complétée (domaine repris du texte « … de X »), sinon titre ajouté ; la ligne d'organisation qui ne disait que le rang est retirée.
   Genre « f » posé si vide et titre au féminin. Renvoie {n, t, ko, save:[personnages modifiés]}. */
function kkOrgMem(F,dry){const it={},out={n:0,t:0,ko:[],save:[]};for(const x of F.items||[])it[x.id]=x.data;const by={};
  for(const d of F.membres||[]){if(!S.chars[d.c]){out.ko.push(d);continue;}(by[d.c]=by[d.c]||[]).push(d);}
  const oN=id=>(S.fiches[id]&&S.fiches[id].nom)||(it[id]&&it[id].nom)||'',oR=id=>({rangs:(S.fiches[id]&&S.fiches[id].rangs)||(it[id]&&it[id].rangs)||[]});
  for(const [cid,L] of Object.entries(by)){const c=S.chars[cid],n=clone(c),s=n.situ={...(n.situ||{})};s.orgs=(s.orgs||[]).map(e=>({...e}));s.titres=(s.titres||[]).map(e=>({...e}));let nt=0;
    for(const d of L){const nom=oN(d.o),R=oR(d.o),same=e=>e.f===d.o||(!e.f&&nrm(e.nom)===nrm(nom));
      if(d.fem&&!n.genre)n.genre='f';
      if(d.tit){const r=R.rangs.find(x=>x.id===d.rang);if(!r)continue;
        s.orgs=s.orgs.filter(e=>!(same(e)&&(!(e.role||'').trim()||ogRFind(R,e.role)===r))); /* la ligne qui ne disait que le rang */
        if(s.titres.some(t=>t.f===d.o&&t.rang===d.rang))continue;
        const old=s.titres.find(t=>!t.f&&!t.rang&&ogRFind(R,t.nom)===r);
        if(old){old.f=d.o;old.rang=d.rang;if(d.sup&&!old.suz)old.suz={id:d.sup};const m=String(old.nom||'').match(/\sd(?:e |')(.+)$/i);if(m&&!old.dom){const l=fiAll().find(x=>x.genre==='lieu'&&nrm(x.nom)===nrm(m[1]));old.dom=l?{f:l.id,nom:l.nom}:{nom:m[1].trim()};}}
        else s.titres.push({id:uid('s'),date:today(),nom:n.genre==='f'&&r.f?r.f:r.m,f:d.o,rang:d.rang,...(d.sup?{suz:{id:d.sup}}:{})});nt++;continue;}
      const e=s.orgs.find(same);
      if(e){e.f=d.o;e.nom=nom;if(d.rang&&!e.rang)e.rang=d.rang;if(d.role&&(!(e.role||'').trim()||(d.raw&&e.role===d.raw)))e.role=d.role; /* rôle harmonisé si inchangé depuis Kanka */
        if(e.rang&&e.role&&(ogRFind(R,e.role)||{}).id===e.rang)delete e.role;if(d.sup&&!e.sup)e.sup={id:d.sup};}
      else s.orgs.push({id:uid('s'),date:today(),nom,f:d.o,...(d.rang?{rang:d.rang}:{}),...(d.role?{role:d.role}:{}),...(d.sup?{sup:{id:d.sup}}:{})});}
    if(!s.titres.length)delete s.titres;if(!s.orgs.length)delete s.orgs;if(!c.situ&&!Object.keys(s).length)delete n.situ;
    if(stableJ(n)!==stableJ(c)){out.n++;out.t+=nt;if(!dry)out.save.push(n);}}
  return out;}
/* Lot 5 b : import des familles — appartenances versées dans Situation › Familles.
   F.membres : [{c (personnage), o (famille)}]. Ligne reliée par fiche ou par nom identique, sinon ajoutée ; quand le personnage est dans
   une branche, la ligne de la famille mère (doublon Kanka) est retirée si elle n'a pas de note. Renvoie {n, t, ko, save}. */
function kkFamMem(F,dry){const it={},out={n:0,t:0,ko:[],save:[]};for(const x of F.items||[])it[x.id]=x.data;const by={};
  for(const d of F.membres||[]){if(!S.chars[d.c]){out.ko.push(d);continue;}(by[d.c]=by[d.c]||[]).push(d);}
  const fN=id=>(S.fiches[id]&&S.fiches[id].nom)||(it[id]&&it[id].nom)||'',fP=id=>{const x=S.fiches[id]||it[id];return x&&nrm(x.type)==='branche'?x.parent||'':'';};
  for(const [cid,L] of Object.entries(by)){const c=S.chars[cid],n=clone(c),s=n.situ={...(n.situ||{})};s.familles=(s.familles||[]).map(e=>({...e}));
    for(const d of L){const nom=fN(d.o),e=s.familles.find(y=>y.f===d.o||(!y.f&&nrm(y.nom)===nrm(nom)));
      if(e){e.f=d.o;e.nom=nom;}else s.familles.push({id:uid('s'),date:today(),nom,f:d.o});}
    for(const d of L){const p=fP(d.o);if(!p)continue;const pn=fN(p);s.familles=s.familles.filter(y=>!((y.f===p||(!y.f&&nrm(y.nom)===nrm(pn)))&&!(y.note||'').trim()));}
    if(!s.familles.length)delete s.familles;if(!c.situ&&!Object.keys(s).length)delete n.situ;
    if(stableJ(n)!==stableJ(c)){out.n++;if(!dry)out.save.push(n);}}
  return out;}
/* ---------- Tableur du référentiel (27/11/2026) : import-export .xlsx (spec-import-export-referentiel) ----------
   Genres : races, pouvoirs, capacités, tableaux de PP, PNJ, lieux, objets, familles, organisations ; un genre coché = tous ses éléments.
   Gestion, mode édition, écran d'au moins 1 024 px. Écriture : XML + zip sans compression ; lecture : zip + DecompressionStream('deflate-raw').
   Import : ID connu = mise à jour, ID vide = création, cellule vide = valeur gardée, « - » = champ effacé ; aucun élément supprimé.
   Onglets de détail : entrée absente du fichier = retirée (seulement pour les éléments présents dans l'onglet principal). */
const TX_W=1024,TX_WIDE=()=>typeof window!=='undefined'&&window.innerWidth>=TX_W;
/* ---------- Écriture .xlsx ---------- */
const TX_CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function txCrc(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=TX_CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function txZip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  for(const f of files){const nm=enc.encode(f.n),d=enc.encode(f.s),crc=txCrc(d);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nm.length,true);
    parts.push(new Uint8Array(h.buffer),nm,d);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cen.push(new Uint8Array(c.buffer),nm);off+=30+nm.length+d.length;}
  const cs=cen.reduce((s,a)=>s+a.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  const all=[...parts,...cen,new Uint8Array(e.buffer)],out=new Uint8Array(all.reduce((s,a)=>s+a.length,0));let p=0;for(const a of all){out.set(a,p);p+=a.length;}return out;}
const txX=s=>String(s??'').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F￾￿]/g,'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const txCol=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;};
const txColIdx=s=>{let n=0;for(const ch of s.toUpperCase())n=n*26+ch.charCodeAt(0)-64;return n-1;};
/* sh : {name, cols:[{h, w, ro, list}], rows:[[valeurs]]} */
function txSheetXml(sh){const C=sh.cols,R=[C.map(c=>c.h),...sh.rows];
  let x=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${C.map((c,i)=>`<col min="${i+1}" max="${i+1}" width="${c.w||18}" customWidth="1"/>`).join('')}</cols><sheetData>`;
  R.forEach((r,ri)=>{x+=`<row r="${ri+1}">`;(r||[]).forEach((v,ci)=>{const t=String(v??'');const s=ri===0?1:C[ci]&&C[ci].ro?2:3;if(!t&&s===3)return;
      x+=`<c r="${txCol(ci)}${ri+1}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${txX(t)}</t></is></c>`;});x+='</row>';});
  x+='</sheetData>';
  const dv=C.map((c,i)=>{const LL=typeof c.list==='function'?c.list():c.list;if(!LL||!LL.length)return '';const j=LL.join(',');if(j.length>250||LL.some(v=>/[,"]/.test(v)))return '';
    return `<dataValidation type="list" allowBlank="1" showErrorMessage="0" sqref="${txCol(i)}2:${txCol(i)}5000"><formula1>"${txX(j)}"</formula1></dataValidation>`;}).filter(Boolean);
  if(dv.length)x+=`<dataValidations count="${dv.length}">${dv.join('')}</dataValidations>`;
  return x+'</worksheet>';}
function txBook(sheets){const ns='http://schemas.openxmlformats.org',files=[];
  files.push({n:'[Content_Types].xml',s:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="${ns}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`});
  files.push({n:'_rels/.rels',s:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`});
  files.push({n:'xl/workbook.xml',s:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="${ns}/spreadsheetml/2006/main" xmlns:r="${ns}/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${txX(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`});
  files.push({n:'xl/_rels/workbook.xml.rels',s:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="${ns}/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="${ns}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="${ns}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`});
  files.push({n:'xl/styles.xml',s:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="${ns}/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D6B66"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEEAE3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="49" fontId="0" fillId="3" borderId="0" xfId="0" applyFill="1" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`});
  sheets.forEach((s,i)=>files.push({n:`xl/worksheets/sheet${i+1}.xml`,s:txSheetXml(s)}));
  return txZip(files);}
/* ---------- Lecture .xlsx ---------- */
async function txInflate(b){const s=new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return await new Response(s).text();}
async function txUnzip(buf){const u=new Uint8Array(buf),dv=new DataView(u.buffer,u.byteOffset,u.byteLength);let e=-1;
  for(let i=u.length-22;i>=Math.max(0,u.length-70000);i--)if(dv.getUint32(i,true)===0x06054b50){e=i;break;}
  if(e<0)throw new Error('zip');const n=dv.getUint16(e+10,true),out={},dec=new TextDecoder();let p=dv.getUint32(e+16,true);
  for(let k=0;k<n;k++){if(dv.getUint32(p,true)!==0x02014b50)throw new Error('zip');
    const m=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true),name=dec.decode(u.subarray(p+46,p+46+nl));
    const st=lo+30+dv.getUint16(lo+26,true)+dv.getUint16(lo+28,true),raw=u.subarray(st,st+cs);
    if(/\.(xml|rels)$/i.test(name))out[name]=m===0?dec.decode(raw):m===8?await txInflate(raw):null;
    p+=46+nl+xl+cl;}
  return out;}
/* Classeur lu : {nom d'onglet: [[cellules]]} (lignes et cellules vides : undefined) */
async function txReadBook(buf){const Z=await txUnzip(buf),P=s=>new DOMParser().parseFromString(s,'application/xml'),T=(d,n)=>[...d.getElementsByTagNameNS('*',n)];
  const wb=Z['xl/workbook.xml'];if(!wb)throw new Error('xlsx');const rels={},rx=Z['xl/_rels/workbook.xml.rels'];
  if(rx)for(const r of T(P(rx),'Relationship'))rels[r.getAttribute('Id')]=r.getAttribute('Target');
  const ss=Z['xl/sharedStrings.xml']?T(P(Z['xl/sharedStrings.xml']),'si').map(si=>T(si,'t').filter(t=>!(t.parentNode&&t.parentNode.localName==='rPh')).map(t=>t.textContent).join('')):[];
  const out={};
  for(const s of T(P(wb),'sheet')){const rid=s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||s.getAttribute('r:id');
    const tg=(rels[rid]||'').replace(/^\/?xl\//,'').replace(/^\//,''),xml=Z['xl/'+tg];if(!xml)continue;const rows=[];
    for(const r of T(P(xml),'row')){const ri=(+r.getAttribute('r')||rows.length+1)-1,L=rows[ri]=[];let ci=0;
      for(const c of [...r.children].filter(x=>x.localName==='c')){const ref=c.getAttribute('r');if(ref)ci=txColIdx(ref.replace(/\d+/g,''));
        const t=c.getAttribute('t'),v=T(c,'v')[0];let val='';
        if(t==='s')val=ss[+(v&&v.textContent)]??'';else if(t==='inlineStr')val=T(c,'t').map(x=>x.textContent).join('');
        else if(t==='b')val=v&&v.textContent==='1'?'oui':'non';else val=v?v.textContent:'';
        L[ci]=val;ci++;}}
    out[s.getAttribute('name')]=rows;}
  return out;}
/* ---------- Valeurs et liens ---------- */
const txNorm=v=>String(v??'').replace(/\r\n?/g,'\n').trim();
const txL=s=>String(s||'').split(';').map(x=>x.trim()).filter(Boolean);
const txJ=L=>(L||[]).map(x=>String(x??'').trim()).filter(Boolean).join(' ; ');
const txB=v=>v?'oui':'non';
const txBool=v=>{const k=nrm(v);return k==='oui'||k==='o'||k==='vrai'||k==='true'||k==='1'||k==='x'?true:k==='non'||k==='n'||k==='faux'||k==='false'||k==='0'?false:null;};
const txLab=(L,k)=>{const x=L.find(y=>y[0]===k);return x?x[1]:(k||'');};
const txKey=(L,v)=>{const x=L.find(y=>nrm(y[1])===nrm(v)||nrm(y[0])===nrm(v));return x?x[0]:undefined;};
const txNum=v=>{const n=+String(v).replace(',','.').replace(/\s/g,'');return Number.isFinite(n)?n:null;};
/* « Nom (note) » : la note est la dernière parenthèse */
function txParen(s){s=String(s||'').trim();if(!s.endsWith(')'))return {a:s,n:''};let d=0;for(let i=s.length-1;i>=0;i--){if(s[i]===')')d++;else if(s[i]==='('){d--;if(!d)return i?{a:s.slice(0,i).trim(),n:s.slice(i+1,-1).trim()}:{a:s,n:''};}}return {a:s,n:''};}
const txParenJ=(a,n)=>n?`${a} (${n})`:a;
const TX_FAM=[['trad','Traditionnelle'],['mod','Moderne'],['exo','Exotique']],TX_GEN=[['m','Masculin'],['f','Féminin']],TX_YN=['oui','non'];
const TX_FXT=[['perm','Permanent'],['jet','Jet'],['rap','Rappel']],TX_QD=[['m','Masqué'],['d','Démasqué']];
const TX_BAR=[['u','Unique'],['hf','Humain / fée'],['tm','Traditionnelle / moderne']];
const TX_SIT=[['titres','Titres','org'],['familles','Familles','famille'],['orgs','Organisations','org'],['fiefs','Fiefs','lieu'],['lieux','Lieux','lieu'],['poss','Possessions','objet']];
const TX_RD=[['cap','Capacité'],['av','Avantage'],['dv','Désavantage'],['at','Atout'],['choix','Choix définitif'],['typ','Spécialité typique'],['sp','Spécialité de prédilection'],['spf','Spécialité au choix']];
const TX_SLOT=['Pouvoir masqué 1','Pouvoir masqué 2','Pouvoir masqué 3','Pouvoir masqué 4','Pouvoir démasqué 1','Pouvoir démasqué 2','Pouvoir profond','Pouvoir légendaire'];
const TX_POR=[['acc','Accroche'],['app','Apparence'],['tai','Taille'],['sexe','Sexe'],['rep','Mode de reproduction'],['hab','Habitat'],['car','Caractère'],['cel','Figures célèbres']];
const txFiBy=(W,g,nom)=>{const k=nrm(nom);if(!k)return null;return Object.values(W.fi).find(f=>f&&f.genre===g&&nrm(f.nom)===k)||null;};
const txFiN=(W,id)=>(id&&W.fi[id]&&W.fi[id].nom)||'';
const txChN=(W,id)=>{const c=id&&W.ch[id];return c?(c.type==='PNJ'?(c.nom||c.court):(c.court||c.nom))||'':'';};
const txChBy=(W,nom)=>{const k=nrm(nom);if(!k)return null;const L=Object.values(W.ch);return L.find(c=>nrm(c.nom)===k)||L.find(c=>nrm(c.court)===k)||L.find(c=>nrm(c.surnom)===k)||null;};
const txRefG=(W,r)=>r?(r.id?txChN(W,r.id)||r.id:(r.nom||'')):'';
const txRefS=(W,v)=>{const c=txChBy(W,v);return c?{id:c.id}:{nom:v};};
const txElBy=(M,nom)=>{const k=nrm(nom).replace(/œ/g,'oe');if(!k)return '';return Object.keys(M).find(id=>nrm(M[id].nom).replace(/œ/g,'oe')===k)||'';};
const txRaceNames=W=>W.cre.map(cr=>W.races[cr.id]).filter(r=>r&&!r.hum).map(r=>r.sing).filter(Boolean);
function txRaceBy(W,v){const k=nrm(v);if(k===nrm(HUMAIN))return HUMAIN;for(const cr of W.cre){const r=W.races[cr.id];if(r&&!r.hum&&(nrm(r.sing)===k||nrm(r.fem)===k))return r.sing;}return null;}
const txCanon=(L,v)=>L.find(x=>nrm(x)===nrm(v))||null;
/* Effets : valeur visée */
function txFxCib(e){const c=e.cible||'';if(e.t==='rap')return '';if(e.t==='perm'){if(c==='fortune')return 'Fortune';const m=c.match(/^(car|comp|der):(.+)$/);return m?({car:'Caractéristique',comp:'Compétence',der:'Dérivée'})[m[1]]+' : '+m[2]:c;}
  return c.startsWith('fut:')?'Futile : '+c.slice(4):c;}
function txFxCibP(t,v,w){v=txNorm(v);if(t==='rap')return '';
  if(t==='perm'){if(nrm(v)==='fortune')return 'fortune';const m=v.match(/^(caract[ée]ristique|comp[ée]tence|d[ée]riv[ée]e)\s*:\s*(.+)$/i);let k=m?(/^car/i.test(m[1])?'car':/^comp/i.test(m[1])?'comp':'der'):'',n=m?m[2]:v;
    const tries=k?[[k,{car:CARCOL,comp:COMPS_ALL,der:FX_DER}[k]]]:[['car',CARCOL],['comp',COMPS_ALL],['der',FX_DER]];
    for(const [kk,L] of tries){const c=txCanon(L,n);if(c)return kk+':'+c;}w(`valeur visée « ${v} » inconnue`);return null;}
  if(!v)return '';const f=v.match(/^futile\s*:\s*(.+)$/i);if(f)return 'fut:'+f[1].trim();const c=txCanon(COMPS_ALL,v)||txCanon(CARCOL,v);if(c)return c;w(`jet « ${v} » inconnu`);return null;}
function txFxRow(e){return {'Sorte':txLab(TX_FXT,e.t),'Valeur visée':txFxCib(e),'Valeur':e.t==='rap'?'':String(e.val??''),'Condition ou texte':e.txt||'','Quand':txLab(TX_QD,fxQ(e.quand))};}
function txFxMk(key,c,w){const t=txKey(TX_FXT,c['Sorte']);if(!t){w(`sorte d'effet « ${c['Sorte']} » inconnue : effet ignoré`);return null;}
  const cible=txFxCibP(t,c['Valeur visée'],w);if(cible===null)return null;const val=t==='rap'?0:Math.round(txNum(c['Valeur']||0)||0),txt=t==='perm'?'':txNorm(c['Condition ou texte']);
  if(t==='perm'&&(!cible||!val)){w('effet permanent sans valeur visée ou sans valeur : ignoré');return null;}if(t==='rap'&&!txt){w('rappel sans texte : ignoré');return null;}
  return {id:key&&/^fx-/.test(key)?key:uid('fx'),t,cible,val,txt,quand:txKey(TX_QD,c['Quand'])||'m'};}
/* ---------- Colonnes ---------- */
const txTxt=(h,k,w)=>({h,w:w||24,get:o=>o[k]||'',set:(o,v)=>{o[k]=v;}});
const txRev=h=>({h:h||'Révélé',w:10,list:TX_YN,get:o=>txB(o.vis==='rev'),set:(o,v,x)=>{const b=txBool(v);if(b===null)return x.w(`« ${v} » : oui ou non attendu`);
  o.vis=b?'rev':'prep';if(x.isNew)o.eye=Object.fromEntries(fiEyeKeys(o).map(k=>[k,b]));}});
const txNomC=(g)=>({h:'Nom',w:28,nm:1,get:o=>o.nom||'',set:(o,v,x)=>{if(!v)return x.w('le nom ne peut pas être effacé');o.nom=v;}});
function txFiPar(h,g){return {h,w:26,get:(o,x)=>txFiN(x.W,o.parent),set:(o,v,x)=>{if(!v){o.parent='';return;}const f=txFiBy(x.W,g,v);if(!f||f.id===o.id)return x.w(`« ${v} » : fiche introuvable`);o.parent=f.id;}};}
const txFiList=(h,k,mk)=>({h,w:30,get:o=>txJ((o[k]||[]).map(e=>txParenJ(e.nom,e.note))),set:(o,v,x)=>{const old=o[k]||[],L=[];
  for(const s of txL(v)){const {a,n}=txParen(s),p=old.find(e=>nrm(e.nom)===nrm(a)&&!L.includes(e));const e=mk?mk(p,a,n,x):{...(p||{}),id:p?p.id:uid('x'),nom:a};if(!e)continue;if(n)e.note=n;else delete e.note;L.push(e);}
  if(L.length)o[k]=L;else delete o[k];}});
const txFiche=(g,lab,sh,extra)=>({g,lab,sh,fi:1,nmCol:'Nom',
  list:W=>Object.values(W.fi).filter(f=>f&&f.genre===g).sort((a,b)=>(a.nom||'').localeCompare(b.nom||'','fr',{sensitivity:'base'})).map(f=>f.id),
  get:(W,id)=>W.fi[id]&&W.fi[id].genre===g?W.fi[id]:null,name:o=>o.nom,
  mk:(W,nom)=>{const now=new Date().toISOString(),f={id:fiRid('f-'),genre:g,nom,type:'',parent:'',kanka:'',vis:'prep',eye:{},desc:'',sait:[],notes:'',par:ME||'',cree:now,modif:now};f.eye=Object.fromEntries(fiEyeKeys(f).map(k=>[k,false]));W.fi[f.id]=f;return f.id;},
  cols:[{h:'ID',ro:1,w:18,get:(o,x)=>x.id},txNomC(g),txTxt('Type','type',16),...extra,txTxt('Notes MJ','notes',40),txTxt('Kanka','kanka',30),txRev()]});
const TX_DEF={
  race:{g:'race',lab:'Races',sh:'Races',nmCol:['Nom masculin','Nom féminin'],
    list:W=>W.cre.filter(cr=>W.races[cr.id]&&!W.races[cr.id].hum).sort((a,b)=>(W.races[a.id].sing||a.nom).localeCompare(W.races[b.id].sing||b.nom,'fr')).map(cr=>cr.id),
    get:(W,id)=>{const cr=W.cre.find(c=>c.id===id),r=W.races[id];return cr&&r&&!r.hum?{id,cr,r}:null;},name:o=>o.r.sing||o.r.fem||o.cr.nom,
    mk:(W,nom)=>{let id=creSlug(nom)||('race-'+Date.now().toString(36));if(W.cre.some(c=>c.id===id)||W.races[id])id+='-'+Date.now().toString(36);
      W.cre.push({id,nom,fam:'trad',done:false});W.races[id]={sing:nom,car:null,acc:[],pred:[],fut:[],at:[],typ:[],sp:[],spf:[],cap:[],choix:[],av:[],dv:[],pw:{m:['','','',''],d:['',''],p:'',l:''},pwi:Array(8).fill(false),pwv:Array(8).fill(''),eye:eyeAll(false),kanka:''};return id;},
    skip:o=>isLegacyRace(o.r)?'fiche de race restée dans l\'ancien format : à ouvrir et enregistrer dans l\'appli':'',
    cols:[{h:'ID',ro:1,w:18,get:o=>o.id},
      {h:'Nom masculin',w:22,get:o=>o.r.sing||'',set:(o,v,x)=>{if(!v&&!o.r.fem)return x.w('il faut un nom masculin ou féminin');if(v&&txRaceNames(x.W).some(n=>n!==o.r.sing&&nrm(n)===nrm(v)))return x.w(`une autre race s'appelle déjà « ${v} »`);o.r.sing=v||o.r.fem;}},
      {h:'Nom féminin',w:22,get:o=>o.r.fem||'',set:(o,v)=>{if(v)o.r.fem=v;else delete o.r.fem;}},
      {h:'Nom affiché',w:12,list:TX_GEN.map(x=>x[1]),get:o=>o.r.nomP?txLab(TX_GEN,o.r.nomP):'',set:(o,v,x)=>{if(!v){delete o.r.nomP;return;}const k=txKey(TX_GEN,v);if(!k)return x.w(`« ${v} » : Masculin ou Féminin attendu`);o.r.nomP=k;}},
      {h:'Nom de la liste',w:22,get:o=>o.cr.nom||'',set:(o,v,x)=>{if(!v)return x.w('le nom de la liste ne peut pas être effacé');o.cr.nom=v;}},
      {h:'Famille',w:16,list:TX_FAM.map(x=>x[1]),get:o=>txLab(TX_FAM,o.cr.fam),set:(o,v,x)=>{const k=txKey(TX_FAM,v);if(!k)return x.w(`famille « ${v} » inconnue`);o.cr.fam=k;}},
      {h:'Découverte',ro:1,w:11,get:o=>txB(o.cr.done)},
      {h:'Révélée',w:10,list:TX_YN,get:o=>txB(eyeOf(o.cr,o.r).fiche),set:(o,v,x)=>{const b=txBool(v);if(b===null)return x.w(`« ${v} » : oui ou non attendu`);o.r.eye={...eyeOf(o.cr,o.r),fiche:b};}},
      {h:'Kanka',w:30,get:o=>o.r.kanka||'',set:(o,v)=>{o.r.kanka=v;}},
      ...TX_POR.map(([k,h])=>({h,w:k==='acc'||k==='app'||k==='car'?40:20,get:o=>(o.r.por||{})[k]||'',set:(o,v)=>{o.r.por={...(o.r.por||{}),[k]:v};}})),
      {h:'Traits de race',w:30,get:o=>txJ(o.r.traits),set:(o,v)=>{const L=txL(v);if(L.length)o.r.traits=L;else delete o.r.traits;}},
      ...CARCOL.flatMap(k=>[0,1].map(j=>({h:k+(j?' max':' min'),w:9,get:o=>o.r.car&&o.r.car[k]?String(o.r.car[k][j]??''):'',
        set:(o,v,x)=>{const n=txNum(v);if(!v||n===null||n<0||n>12||n!==Math.round(n))return x.w(`${k} : nombre entier de 0 à 12 attendu`);o.r.car=o.r.car||Object.fromEntries(CARCOL.map(c=>[c,[1,6]]));const a=(o.r.car[k]||[1,6]).slice();a[j]=n;o.r.car={...o.r.car,[k]:a};}}))),
      {h:'Caractéristiques accrues',w:26,get:o=>txJ(o.r.acc),set:(o,v,x)=>{const L=[];for(const s of txL(v)){const c=txCanon(CARCOL,s);if(c)L.push(c);else x.w(`caractéristique « ${s} » inconnue`);}o.r.acc=L;}},
      {h:'Compétences de prédilection',w:34,get:o=>txJ(o.r.pred),set:(o,v,x)=>{const L=[];for(const s of txL(v)){const c=txCanon(COMPS_ALL,s);if(c)L.push(c);else x.w(`compétence « ${s} » inconnue`);}o.r.pred=L;}},
      {h:'Compétences futiles',w:34,get:o=>txJ((o.r.fut||[]).map(f=>Array.isArray(f)?f.join(' ou '):f)),set:(o,v)=>{o.r.fut=txL(v).map(s=>{const p=s.split(/\s+ou\s+/).map(y=>y.trim()).filter(Boolean);return p.length>1?p:s;});}},
      ...TX_SLOT.map((h,i)=>({h,w:24,get:(o,x)=>{const id=pwSlots(o.r)[i],u=!!(o.r.pwi||[])[i];if(!id)return u?'?':'';const p=x.W.pw[id],vv=p&&varOf(elFull(p),(o.r.pwv||[])[i]);return (p?p.nom:id)+(vv?' ('+vv.nom+')':'')+(u?' [inconnu]':'');},
        set:(o,v,x)=>{let id='',vid='',u=false;v=txNorm(v);
          if(v==='?')u=true;else if(v){if(/\s*\[inconnu\]$/i.test(v)){u=true;v=v.replace(/\s*\[inconnu\]$/i,'');}
            id=txElBy(x.W.pw,v);if(!id){const {a,n}=txParen(v);id=txElBy(x.W.pw,a);if(id&&n){const P=x.W.pw[id]=elFull(x.W.pw[id]);const had=(P.var||[]).some(y=>nrm(y.nom)===nrm(n));vid=varIdByName(P,n,true);if(!had)x.w(`sous-type « ${n} » ajouté au pouvoir ${P.nom}`);}}
            if(!id)return x.w(`pouvoir « ${v} » introuvable`);}
          const S8=pwSlots(o.r);S8[i]=id;const I=(o.r.pwi||[]).concat(Array(8).fill(false)).slice(0,8),V=(o.r.pwv||[]).concat(Array(8).fill('')).slice(0,8);I[i]=u;V[i]=vid;
          o.r.pw={m:S8.slice(0,4),d:S8.slice(4,6),p:S8[6],l:S8[7]};o.r.pwi=I;o.r.pwv=V;}}))]},
  pw:{g:'pw',lab:'Pouvoirs',sh:'Pouvoirs',nmCol:'Nom',req:['Catégorie','Nature','Type'],
    list:W=>Object.keys(W.pw).sort((a,b)=>(W.pw[a].nom||'').localeCompare(W.pw[b].nom||'','fr')),get:(W,id)=>W.pw[id]||null,name:o=>o.nom,
    mk:(W,nom)=>{const id=freeId(W.pw,'pw-'+slugOf(nom));W.pw[id]=elFull({nom});return id;},cols:null},
  cap:{g:'cap',lab:'Capacités',sh:'Capacités',nmCol:'Nom',req:['Type'],
    list:W=>Object.keys(W.cap).sort((a,b)=>(W.cap[a].nom||'').localeCompare(W.cap[b].nom||'','fr')),get:(W,id)=>W.cap[id]||null,name:o=>o.nom,
    mk:(W,nom)=>{const id=freeId(W.cap,'cap-'+slugOf(nom));W.cap[id]=elFull({nom});return id;},cols:null},
  pp:{g:'pp',lab:'Tableaux de PP',sh:'Tableaux de PP',nmCol:'Nom',req:['Profil','Rubrique'],
    list:W=>Object.keys(W.pp).sort((a,b)=>(+a.replace(/\D/g,'')||0)-(+b.replace(/\D/g,'')||0)),get:(W,id)=>W.pp[id]||null,name:o=>o.nom,
    mk:(W,nom)=>{const n=Math.max(0,...Object.keys(W.pp).map(k=>+k.replace(/^pp-/,'')||0))+1,id='pp-'+n;W.pp[id]={prof:'',rub:'',nom,cost:{k:'u',a:0,b:null},excl:false,nocrea:false,fortP:null,fortS:null,spec:'',pre:[],prec:'',fx:[]};return id;},
    cols:[{h:'ID',ro:1,w:9,get:(o,x)=>x.id},
      {h:'Profil',w:14,list:()=>Object.keys(ppDef().P),get:o=>o.prof||'',set:(o,v,x)=>{const k=Object.keys(ppDef().P).find(p=>nrm(p)===nrm(v)||nrm(prOf(p).m)===nrm(v));if(!k)return x.w(`profil « ${v} » inconnu`);o.prof=k;}},
      {h:'Rubrique',w:24,list:PP_RUB.map(r=>r[1]),get:o=>txLab(PP_RUB,o.rub),set:(o,v,x)=>{const k=txKey(PP_RUB,v);if(!k)return x.w(`rubrique « ${v} » inconnue`);o.rub=k;}},
      {h:'Nom',w:40,nm:1,get:o=>o.nom||'',set:(o,v,x)=>{if(!v)return x.w('le nom ne peut pas être effacé');o.nom=v;}},
      {h:'Barème',w:20,list:TX_BAR.map(x=>x[1]),get:o=>txLab(TX_BAR,(o.cost||{}).k||'u'),set:(o,v,x)=>{const k=txKey(TX_BAR,v);if(!k)return x.w(`barème « ${v} » inconnu`);o.cost={...(o.cost||{a:0,b:null}),k};}},
      {h:'Coût',w:8,get:o=>String(((o.cost||{}).a)??''),set:(o,v,x)=>{const n=v?txNum(v):null;if(v&&n===null)return x.w(`coût « ${v} » : nombre attendu`);o.cost={k:'u',b:null,...(o.cost||{}),a:n};}},
      {h:'Coût 2',w:8,get:o=>String(((o.cost||{}).b)??''),set:(o,v,x)=>{const n=v?txNum(v):null;if(v&&n===null)return x.w(`coût 2 « ${v} » : nombre attendu`);o.cost={k:'u',a:0,...(o.cost||{}),b:n};}},
      {h:'Exclusif',w:10,list:TX_YN,get:o=>txB(o.excl),set:(o,v,x)=>{const b=txBool(v);if(b===null)return x.w(`« ${v} » : oui ou non attendu`);o.excl=b;}},
      {h:'Hors création',w:12,list:TX_YN,get:o=>txB(o.nocrea),set:(o,v,x)=>{const b=txBool(v);if(b===null)return x.w(`« ${v} » : oui ou non attendu`);o.nocrea=b;}},
      ...[['fortP','Fortune (principale)'],['fortS','Fortune (secondaire)']].map(([k,h])=>({h,w:12,get:o=>String(o[k]??''),set:(o,v,x)=>{const n=v?txNum(v):null;if(v&&n===null)return x.w(`${h} : nombre attendu`);o[k]=n;}})),
      txTxt('Spécialité offerte','spec',20),
      {h:'Prérequis',w:30,get:o=>txJ((o.pre||[]).map(p=>p.t==='spec'?'spécialité '+p.n:p.t==='fort'?'Fortune '+p.v:p.n+' '+p.v)),
        set:(o,v,x)=>{const L=[];for(const s of txL(v)){let m;if((m=s.match(/^sp[ée]cialit[ée]\s+(.+)$/i)))L.push({t:'spec',n:m[1].trim()});else if((m=s.match(/^fortune\s+(\d+)$/i)))L.push({t:'fort',v:+m[1]});
          else if((m=s.match(/^(.+?)\s+(\d+)$/))&&txCanon(COMPS_ALL,m[1]))L.push({t:'comp',n:txCanon(COMPS_ALL,m[1]),v:+m[2]});else x.w(`prérequis « ${s} » non reconnu`);}o.pre=L;}},
      txTxt('Précision','prec',40)]},
  pnj:{g:'pnj',lab:'PNJ',sh:'PNJ',nmCol:'Nom',
    list:W=>Object.values(W.ch).filter(c=>c&&c.type==='PNJ').sort((a,b)=>(a.nom||a.court||'').localeCompare(b.nom||b.court||'','fr',{sensitivity:'base'})).map(c=>c.id),
    get:(W,id)=>W.ch[id]&&W.ch[id].type==='PNJ'?W.ch[id]:null,name:o=>o.nom||o.court,
    mk:(W,nom)=>{const c=pnMake({nom,vis:'prep'});while(W.ch[c.id])c.id+='-'+Math.random().toString(36).slice(2,4);W.ch[c.id]=c;return c.id;},
    cols:[{h:'ID',ro:1,w:16,get:(o,x)=>x.id},
      {h:'Nom',w:30,nm:1,get:o=>o.nom||'',set:(o,v,x)=>{if(!v)return x.w('le nom ne peut pas être effacé');o.nom=v;if(x.isNew)o.court=v;}},
      txTxt('Nom court','court',18),txTxt('Surnom','surnom',16),
      {h:'Race',w:18,get:o=>o.race||'',set:(o,v,x)=>{if(!v){o.race='';return;}const r=txRaceBy(x.W,v);if(!r)return x.w(`race « ${v} » introuvable`);o.race=r;}},
      {h:'Genre',w:11,list:TX_GEN.map(x=>x[1]),get:o=>o.genre?txLab(TX_GEN,o.genre):'',set:(o,v,x)=>{if(!v){o.genre='';return;}const k=txKey(TX_GEN,v);if(!k)return x.w(`« ${v} » : Masculin ou Féminin attendu`);o.genre=k;}},
      txTxt('Âge','ageLib',10),
      {h:'Statut',w:10,list:Object.values(STATUTS),get:o=>STATUTS[o.statut||'actif']||'',set:(o,v,x)=>{const k=txKey(Object.entries(STATUTS),v);if(!k)return x.w(`statut « ${v} » inconnu`);o.statut=k;}},
      {h:'Rang',w:12,list:()=>pnjRangs(),get:o=>o.rang||'',set:(o,v,x)=>{if(!v){delete o.rang;return;}const k=txCanon(pnjRangs(),v);if(!k)return x.w(`rang « ${v} » inconnu`);o.rang=k;}},
      {h:'Féal',w:8,list:TX_YN,get:o=>txB(!!o.feal),set:(o,v,x)=>{const b=txBool(v);if(b===null)return x.w(`« ${v} » : oui ou non attendu`);if(b)o.feal=true;else delete o.feal;}},
      {h:'Rattaché à',ro:1,w:14,get:(o,x)=>o.pj?txChN(x.W,o.pj):''},
      ...PN_POR.map(([k,h])=>({h,w:40,get:o=>(o.por||{})[k]||'',set:(o,v)=>{o.por={...(o.por||{}),[k]:v};}})),
      txTxt('Kanka','kanka',30),
      {h:'Révélé',w:10,list:TX_YN,get:o=>txB(!!o.pj||!o.vis||o.vis==='rev'),set:(o,v,x)=>{if(o.pj)return;const b=txBool(v);if(b===null)return x.w(`« ${v} » : oui ou non attendu`);
        o.vis=b?'rev':'prep';if(b&&(!o.eye||!Object.keys(o.eye).length))o.eye={...PN_EYE0,autres:true};}}]},
  lieu:txFiche('lieu','Lieux','Lieux',[txFiPar('Lieu parent','lieu'),txTxt('Description','desc',60),
    {h:'Situation féerique',w:40,get:o=>(o.fief||{}).feerie||'',set:(o,v)=>{o.fief={...(o.fief||{}),feerie:v};}},
    txFiList('Organisations liées','orgs',(p,a,n,x)=>{const f=txFiBy(x.W,'org',a)||txFiBy(x.W,'famille',a),e={...(p||{}),id:p?p.id:uid('lo'),nom:f?f.nom:a};if(f)e.f=f.id;else{delete e.f;x.w(`« ${a} » : organisation ou famille introuvable, gardée en texte`);}return e;})]),
  objet:txFiche('objet','Objets','Objets',[
    {h:'Unique',w:9,list:TX_YN,get:o=>txB(o.uniq),set:(o,v,x)=>{const b=txBool(v);if(b===null)return x.w(`« ${v} » : oui ou non attendu`);o.uniq=b;}},
    {h:'Créateur',w:22,get:(o,x)=>txRefG(x.W,o.crea),set:(o,v,x)=>{if(!v){delete o.crea;return;}o.crea=txRefS(x.W,v);}},
    txFiPar('Collection','objet'),
    {h:'Emplacement',w:22,get:(o,x)=>o.lieu?(o.lieu.f?txFiN(x.W,o.lieu.f)||o.lieu.nom:o.lieu.nom)||'':'',set:(o,v,x)=>{if(!v){delete o.lieu;return;}const l=txFiBy(x.W,'lieu',v);o.lieu=l?{f:l.id,nom:l.nom}:{nom:v};}},
    {h:'Détenteurs',w:24,get:(o,x)=>txJ((o.det||[]).map(d=>txRefG(x.W,d))),set:(o,v,x)=>{const L=txL(v).map(s=>txRefS(x.W,s));if(o.uniq&&L.length>1)x.w('objet unique : un seul détenteur');if(L.length)o.det=L;else delete o.det;}},
    ...[['prix','Prix'],['taille','Taille'],['poids','Poids']].map(([k,h])=>({h,w:16,get:o=>(o.carac||{})[k]||'',set:(o,v)=>{o.carac={...(o.carac||{}),[k]:v};}})),
    txTxt('Description','desc',60),txTxt('Effet','effet',40)]),
  famille:txFiche('famille','Familles','Familles',[txFiPar('Suzerain ou famille mère','famille'),txTxt('Suzerain en texte','suzT',20),txTxt('Devise','devise',24),txTxt('Race dominante','race',16),
    txTxt('Spécificité','speci',30),txTxt('Territoires','terr',30),
    {h:'Vassales sans fiche',w:30,get:o=>txJ((o.vasx||[]).map(e=>e.nom)),set:(o,v)=>{const old=o.vasx||[],L=txL(v).map(s=>{const p=old.find(e=>nrm(e.nom)===nrm(s));return {id:p?p.id:uid('vx'),nom:s};});if(L.length)o.vasx=L;else delete o.vasx;}},
    txFiList('Membres en texte','mbx'),txTxt('Description','desc',60)]),
  org:txFiche('org','Organisations','Organisations',[txFiPar('Organisation mère','org'),
    {h:'Titres cumulables',w:12,list:TX_YN,get:o=>txB(!!o.titres),set:(o,v,x)=>{const b=txBool(v);if(b===null)return x.w(`« ${v} » : oui ou non attendu`);if(b)o.titres=true;else delete o.titres;}},
    {h:'Rangs internes',w:40,get:o=>txJ((o.rangs||[]).map(r=>txParenJ(r.f&&r.f!==r.m?r.m+' / '+r.f:r.m,r.note))),
      set:(o,v)=>{const old=o.rangs||[],L=[];for(const s of txL(v)){const {a,n}=txParen(s),[m,f]=a.split(/\s+\/\s+/).map(y=>(y||'').trim()),p=old.find(r=>nrm(r.m)===nrm(m)&&!L.includes(r));
        const r={...(p||{}),id:p?p.id:uid('rg'),m};if(f)r.f=f;else delete r.f;if(n)r.note=n;else delete r.note;L.push(r);}o.rangs=L;}},
    txFiList('Membres en texte','mbx'),txTxt('Description','desc',60),txTxt('Pratiques','prat',40)])};
/* Pouvoirs et capacités : mêmes colonnes (catégorie et nature : pouvoirs seulement) */
for(const g of ['pw','cap']){const pw=g==='pw',M=W=>pw?W.pw:W.cap,un=pw?'un autre pouvoir':'une autre capacité';
  TX_DEF[g].cols=[{h:'ID',ro:1,w:22,get:(o,x)=>x.id},
    {h:'Nom',w:26,nm:1,get:o=>o.nom||'',set:(o,v,x)=>{if(!v)return x.w('le nom ne peut pas être effacé');if(Object.entries(M(x.W)).some(([k,y])=>k!==x.id&&nrm(y.nom)===nrm(v)))return x.w(`${un} s'appelle déjà « ${v} »`);o.nom=v;}},
    ...(pw?[{h:'Catégorie',w:13,list:PW_CATS.map(c=>c[1]),get:o=>o.cat?txLab(PW_CATS,o.cat):'',set:(o,v,x)=>{const k=txKey(PW_CATS,v);if(!k)return x.w(`catégorie « ${v} » inconnue`);o.cat=k;}},
      {h:'Nature',w:11,list:['Masqué','Démasqué'],get:o=>NAT_L[o.nat]||'',set:(o,v,x)=>{const k=txKey([['m','Masqué'],['d','Démasqué']],v);if(!k)return x.w(`nature « ${v} » inconnue`);o.nat=k;}}]:[]),
    {h:'Type',w:14,list:EL_TYPES.map(t=>t[1]),get:o=>o.type?txLab(EL_TYPES,o.type):'',set:(o,v,x)=>{const k=txKey(EL_TYPES,v);if(!k)return x.w(`type « ${v} » inconnu`);o.type=k;}},
    {h:'Précision par race',w:12,list:TX_YN,get:o=>txB(o.prec),set:(o,v,x)=>{const b=txBool(v);if(b===null)return x.w(`« ${v} » : oui ou non attendu`);o.prec=b;}},
    ...[['act','Activation'],['cib','Cible'],['dur','Durée'],['por','Portée'],['zon','Zone'],['res','Résistance']].map(([k,h])=>txTxt(h,k,16)),
    txTxt('Description','desc',60),txTxt('Kanka','kanka',30)];}
/* ---------- Onglets de détail ---------- */
const txDC=(D,c)=>Object.fromEntries(D.vals.map(h=>[h,txNorm(c[h])]));
const txFxL=(L,att,out)=>{for(const e of L||[])out.push({key:e.id||'',c:{'Rattachement':att,...txFxRow(e)}});};
const TX_DET=[
  {sh:'Races – détail',gs:['race'],own:['ID race','Race'],kh:'ID ligne',vals:['Sorte','Nom','Compétence ou sous-type','Description ou note'],lists:{'Sorte':TX_RD.map(x=>x[1])},w:{'Nom':26,'Compétence ou sous-type':24,'Description ou note':50},
    rows:(W,g,o)=>{const r=o.r,C=W.cap,out=[],vn=(k,v)=>{const x=k&&varOf(elFull(k),v);return x?x.nom:'';};
      (r.cap||[]).forEach(e=>{const k=C[e.id];out.push({key:'cap:'+e.id,c:{'Sorte':'Capacité','Nom':k?k.nom:e.id,'Compétence ou sous-type':vn(k,e.v),'Description ou note':e.d??''}});});
      for(const t of ['av','dv','at'])(r[t]||[]).forEach(e=>out.push({key:e.id,c:{'Sorte':txLab(TX_RD,t),'Nom':e.nom||'','Description ou note':e.desc||''}}));
      (r.choix||[]).forEach((c,i)=>{const k=c[0]==='cap'&&C[c[1]];out.push({key:'choix'+i,c:{'Sorte':'Choix définitif','Nom':c[0]==='cap'?(k?k.nom:c[1]):c[1]||'','Compétence ou sous-type':c[0]==='cap'?vn(k,c[2]):''}});});
      (r.typ||[]).forEach((x,i)=>out.push({key:'typ'+i,c:{'Sorte':'Spécialité typique','Nom':Array.isArray(x)?x[0]:x,'Compétence ou sous-type':Array.isArray(x)?x[1]||'':''}}));
      for(const t of ['sp','spf'])(r[t]||[]).forEach((x,i)=>out.push({key:t+i,c:{'Sorte':txLab(TX_RD,t),'Nom':x[0]||'','Compétence ou sous-type':x[1]||'','Description ou note':x[2]||''}}));
      return out;},
    build:(W,g,o,M,w)=>{const r=o.r,C=W.cap,old={cap:r.cap||[],av:r.av||[],dv:r.dv||[],at:r.at||[]},N={cap:[],av:[],dv:[],at:[],choix:[],typ:[],sp:[],spf:[]};
      const capV=(id,q)=>{const K=C[id]=elFull(C[id]);if(!q)return '';const had=K.var.some(y=>nrm(y.nom)===nrm(q)),v=varIdByName(K,q,true);if(!had)w(`sous-type « ${q} » ajouté à la capacité ${K.nom}`);return v;};
      for(const m of M){const c=m.c,t=txKey(TX_RD,c['Sorte']),nom=c['Nom'],q=c['Compétence ou sous-type'],d=c['Description ou note'];
        if(!t){w(`sorte « ${c['Sorte']} » inconnue : ligne ignorée`);continue;}if(!nom){w('ligne sans nom : ignorée');continue;}
        if(t==='cap'){const id=txElBy(C,nom);if(!id){w(`capacité « ${nom} » introuvable : ligne ignorée`);continue;}const v=capV(id,q),pe=old.cap.find(e=>e&&e.id===id)||{},e={...pe,id,v};
          if(d&&d!==C[id].desc)e.d=d;else delete e.d;N.cap.push(e);}
        else if(t==='av'||t==='dv'||t==='at'){const pe=m.key&&old[t].find(e=>e.id===m.key),taken=Object.fromEntries([...old[t],...N[t]].map(e=>[e.id,1]));
          N[t].push({...(pe||{}),id:pe?pe.id:freeId(taken,t+'-'+slugOf(nom)),nom,desc:d,fx:pe?pe.fx||[]:[]});}
        else if(t==='choix'){const ca=txCanon(CARCOL,nom);if(ca){N.choix.push(['acc',ca]);continue;}const id=txElBy(C,nom);if(!id){w(`choix « ${nom} » : ni caractéristique ni capacité connue`);continue;}N.choix.push(['cap',id,capV(id,q)]);}
        else if(t==='typ')N.typ.push(q?[nom,q]:nom);
        else N[t].push([nom,q,d]);}
      Object.assign(r,N);}},
  {sh:'Sous-types',gs:['pw','cap'],glab:{pw:'Pouvoir',cap:'Capacité'},own:['ID élément','Élément'],kh:'ID sous-type',vals:['Nom','Description'],w:{'Nom':24,'Description':50},
    rows:(W,g,o)=>elFull(o).var.map(v=>({key:v.id,c:{'Nom':v.nom,'Description':v.desc||''}})),
    build:(W,g,o,M,w,id)=>{Object.assign(o,elFull(o));const old=o.var,L=[],ids={};
      for(const m of M){const nom=m.c['Nom'];if(!nom){w('sous-type sans nom : ignoré');continue;}const pe=m.key&&old.find(v=>v.id===m.key);for(const v of [...old,...L])ids[v.id]=1;
        L.push({id:pe?pe.id:freeId(ids,'v-'+slugOf(nom)),nom,desc:m.c['Description'],fx:pe?pe.fx||[]:[]});}
      for(const v of old)if(!L.some(x=>x.id===v.id)){const used=Object.values(W.races).some(r=>g==='pw'?pwSlots(r).some((p,i)=>p===id&&(r.pwv||[])[i]===v.id):(r.cap||[]).some(e=>e&&e.id===id&&e.v===v.id)||(r.choix||[]).some(c=>c[0]==='cap'&&c[1]===id&&c[2]===v.id));
        if(used){w(`sous-type « ${v.nom} » utilisé par une race : gardé`);L.push(v);}}
      o.var=L;}},
  {sh:'Effets',gs:['pw','cap','race','pp'],glab:{pw:'Pouvoir',cap:'Capacité',race:'Race',pp:'PP'},own:['ID élément','Élément'],kh:'ID effet',vals:['Rattachement','Sorte','Valeur visée','Valeur','Condition ou texte','Quand'],
    lists:{'Sorte':TX_FXT.map(x=>x[1]),'Quand':TX_QD.map(x=>x[1])},w:{'Rattachement':26,'Valeur visée':26,'Valeur':8,'Condition ou texte':40,'Quand':11},
    rows:(W,g,o)=>{const out=[];if(g==='pw'||g==='cap'){const e=elFull(o);txFxL(e.fx,'',out);for(const v of e.var)txFxL(v.fx,'Sous-type : '+v.nom,out);}
      else if(g==='pp')txFxL(o.fx,'',out);
      else{const r=o.r;for(const t of ['av','dv','at'])for(const e of r[t]||[])txFxL(e.fx,txLab(TX_RD,t)+' : '+e.nom,out);
        for(const e of r.cap||[])if(Array.isArray(e.fx))txFxL(e.fx,'Capacité : '+((W.cap[e.id]||{}).nom||e.id),out);}
      return out;},
    build:(W,g,o,M,w)=>{const G={};for(const m of M){const k=nrm(m.c['Rattachement']),e=txFxMk(m.key,m.c,w);if(e)(G[k]=G[k]||[]).push(e);}const used=new Set(),take=k=>{k=nrm(k);used.add(k);return G[k];};
      if(g==='pw'||g==='cap'){Object.assign(o,elFull(o));o.fx=take('')||[];for(const v of o.var)v.fx=take('Sous-type : '+v.nom)||[];}
      else if(g==='pp')o.fx=take('')||[];
      else{const r=o.r;for(const t of ['av','dv','at'])for(const e of r[t]||[])e.fx=take(txLab(TX_RD,t)+' : '+e.nom)||[];
        for(const e of r.cap||[]){const L=take('Capacité : '+((W.cap[e.id]||{}).nom||e.id));if(L)e.fx=L;else if(!(Array.isArray(e.fx)&&!e.fx.length))delete e.fx;}}
      for(const k of Object.keys(G))if(!used.has(k))w(`rattachement « ${G[k].length&&M.find(m=>nrm(m.c['Rattachement'])===k).c['Rattachement']} » inconnu : effets ignorés`);}},
  {sh:'PNJ – Situation',gs:['pnj'],own:['ID PNJ','PNJ'],kh:'ID ligne',vals:['Rubrique','Nom','Fiche liée','Rang','Rôle','Nature','Domaine','Suzerain ou supérieur','Note'],
    lists:{'Rubrique':TX_SIT.map(x=>x[1]),'Nature':Object.values(SITU_NAT)},w:{'Nom':30,'Fiche liée':22,'Note':30},
    rows:(W,g,c)=>{const out=[],s=c.situ||{};for(const [k,lab] of TX_SIT)for(const e of s[k]||[]){const org=(k==='titres'||k==='orgs')&&W.fi[e.f],rg=org&&(org.rangs||[]).find(x=>x.id===e.rang);
        out.push({key:e.id,c:{'Rubrique':lab,'Nom':e.nom||'','Fiche liée':txFiN(W,e.f),'Rang':rg?(c.genre==='f'&&rg.f?rg.f:rg.m):(e.rang||''),'Rôle':k==='orgs'?e.role||'':'','Nature':k==='lieux'?SITU_NAT[situNat(e)]||'':'',
          'Domaine':k==='titres'&&e.dom?(e.dom.f?txFiN(W,e.dom.f)||e.dom.nom:e.dom.nom)||'':'','Suzerain ou supérieur':k==='titres'?txRefG(W,e.suz):k==='orgs'?txRefG(W,e.sup):'','Note':e.note||''}});}
      return out;},
    build:(W,g,c,M,w)=>{const s0=c.situ||{},old=[].concat(...TX_SIT.map(([k])=>s0[k]||[])),N={};
      for(const m of M){const x=m.c,rub=TX_SIT.find(r=>nrm(r[1])===nrm(x['Rubrique'])||r[0]===x['Rubrique']);if(!rub){w(`rubrique « ${x['Rubrique']} » inconnue : ligne ignorée`);continue;}
        const [k,,gf]=rub,pe=m.key&&old.find(e=>e.id===m.key),e={...(pe||{}),id:pe?pe.id:uid('s'),date:(pe&&pe.date)||today(),nom:x['Nom']};
        const fl=x['Fiche liée']||(k!=='titres'?x['Nom']:''),f=fl&&txFiBy(W,gf,fl);if(f){e.f=f.id;if(!e.nom)e.nom=f.nom;}else{delete e.f;if(x['Fiche liée'])w(`« ${x['Fiche liée']} » : fiche introuvable`);}
        if(!e.nom){w('ligne sans nom : ignorée');continue;}
        if(k==='titres'||k==='orgs'){const v=x['Rang'],org=e.f&&W.fi[e.f];if(v){const r=org&&(org.rangs||[]).find(y=>nrm(y.m)===nrm(v)||nrm(y.f)===nrm(v)||y.id===v);if(r)e.rang=r.id;else w(`rang « ${v} » introuvable dans ${org?org.nom:'l\'organisation'}`);}else delete e.rang;}
        if(k==='orgs'){if(x['Rôle'])e.role=x['Rôle'];else delete e.role;if(x['Suzerain ou supérieur'])e.sup=txRefS(W,x['Suzerain ou supérieur']);else delete e.sup;}
        if(k==='titres'){const d=x['Domaine'];if(d){const l=txFiBy(W,'lieu',d);e.dom=l?{f:l.id,nom:l.nom}:{nom:d};}else delete e.dom;if(x['Suzerain ou supérieur'])e.suz=txRefS(W,x['Suzerain ou supérieur']);else delete e.suz;}
        if(k==='lieux'){const n=Object.keys(SITU_NAT).find(y=>nrm(SITU_NAT[y])===nrm(x['Nature'])||y===x['Nature'])||(x['Nature']?(w(`nature « ${x['Nature']} » inconnue : autre lieu`),'autre'):situNat(e));e.nat=n;e.res=n==='res';}
        if(x['Note'])e.note=x['Note'];else delete e.note;(N[k]=N[k]||[]).push(e);}
      const s={...s0};for(const [k] of TX_SIT){if(N[k])s[k]=N[k];else delete s[k];}c.situ=s;}},
  {sh:'Ce que l\'on sait',gs:['lieu','objet','famille','org'],glab:{lieu:'Lieu',objet:'Objet',famille:'Famille',org:'Organisation'},own:['ID fiche','Fiche'],kh:'ID entrée',vals:['Texte','Révélé'],lists:{'Révélé':TX_YN},w:{'Texte':70,'Révélé':10},
    rows:(W,g,f)=>(f.sait||[]).map(it=>({key:it.id,c:{'Texte':it.txt||'','Révélé':txB(it.rev)}})),
    build:(W,g,f,M,w)=>{const old=f.sait||[],now=new Date().toISOString();f.sait=M.filter(m=>m.c['Texte']).map(m=>{const pe=m.key&&old.find(x=>x.id===m.key),b=txBool(m.c['Révélé']);if(m.c['Révélé']&&b===null)w(`« ${m.c['Révélé']} » : oui ou non attendu`);
      return {...(pe||{id:uid('i'),par:ME||'',cree:now}),txt:m.c['Texte'],rev:b===null?!!(pe&&pe.rev):b};});}},
  {sh:'Org. – relations',gs:['org'],own:['ID organisation','Organisation'],kh:'ID relation',vals:['Organisation liée','Étiquette','Note'],w:{'Organisation liée':26,'Étiquette':18,'Note':40},
    rows:(W,g,f)=>(f.rel||[]).map(r=>({key:r.id,c:{'Organisation liée':r.f?txFiN(W,r.f)||r.nom:r.nom||'','Étiquette':r.lab||'','Note':r.note||''}})),
    build:(W,g,f,M,w)=>{const old=f.rel||[],L=[];for(const m of M){const n=m.c['Organisation liée'];if(!n){w('relation sans organisation : ignorée');continue;}const pe=m.key&&old.find(x=>x.id===m.key),o=txFiBy(W,'org',n),r={...(pe||{}),id:pe?pe.id:uid('r'),nom:o?o.nom:n,lab:m.c['Étiquette']};
      if(o)r.f=o.id;else{delete r.f;w(`« ${n} » : organisation introuvable, gardée en texte`);}if(m.c['Note'])r.note=m.c['Note'];else delete r.note;L.push(r);}
      if(L.length)f.rel=L;else delete f.rel;}}];
for(const D of TX_DET)D.lab=c=>D.vals.map(h=>c[h]).filter(Boolean).join(' · ');
const TX_ORD=['race','pw','cap','pp','pnj','lieu','objet','famille','org'],TX_PLAN=['pw','cap','race','pp','lieu','objet','famille','org','pnj'];
/* ---------- Export ---------- */
const txLive=()=>({pw:S.pouvoirs||{},cap:S.capacites||{},races:S.races||{},cre:S.creatures||[],pp:ppEls(),fi:S.fiches||{},ch:S.chars||{}});
function txSheets(sel){const W=txLive(),out=[];
  out.push({name:'Lisez-moi',cols:[{h:'Tableur du référentiel — La belle appli',w:140}],rows:[
    ['Exporté le '+fmtDate(today())+' · '+sel.map(g=>TX_DEF[g].lab).join(', ')],[''],
    ['Modifier : changer la cellule. Cellule vide = valeur gardée. « - » = champ effacé.'],
    ['Créer : ajouter une ligne sans ID (le nom suffit ; pouvoirs : catégorie, nature et type ; capacités : type ; PP : profil et rubrique). Révélé vide = préparé.'],
    ['Aucun élément n\'est supprimé par l\'import. Ne pas modifier les colonnes ID (fond gris).'],
    ['Listes : valeurs séparées par « ; ». Liens vers une autre fiche, un personnage, une race, un pouvoir : nom exact. Liens dans les textes : @[sorte:id|nom].'],
    ['Onglets de détail (Races – détail, Sous-types, Effets, PNJ – Situation, Ce que l\'on sait, Org. – relations) : une ligne par entrée, rattachée par l\'ID de l\'élément (ou son nom pour un élément créé dans le même fichier).'],
    ['   Ligne sans ID = entrée ajoutée ; ligne supprimée = entrée retirée ; l\'ordre des lignes donne l\'ordre de la liste.'],
    ['Races : Découverte (lecture seule) se règle dans l\'appli ; pouvoirs : « Nom », « Nom (sous-type) », « ? » = inconnu, « Nom [inconnu] » = caché aux joueurs.'],
    ['Effets › Valeur visée : « Caractéristique : X », « Compétence : X », « Dérivée : X », « Fortune » ; jet : compétence ou caractéristique, « Futile : X », vide = jet en situation.'],
    ['PP › Prérequis : « Culture 3 ; spécialité Avion ; Fortune 2 ». Relations entre organisations : chaque organisation garde sa propre ligne.'],
    ['Hors tableur : images, yeux par bloc, membres calculés, Mentions, scores des PNJ rattachés.'],[''],
    ['Importer : Paramètres › Données › Tableur du référentiel (ordinateur, mode édition). Un aperçu s\'affiche avant toute modification.']]});
  for(const g of sel){const D=TX_DEF[g];out.push({name:D.sh,cols:D.cols,rows:D.list(W).map(id=>{const o=D.get(W,id),x={W,id};return D.cols.map(c=>c.get(o,x));})});}
  for(const D of TX_DET){const gs=D.gs.filter(g=>sel.includes(g));if(!gs.length)continue;const multi=D.gs.length>1;
    const cols=[...(multi?[{h:'Genre',w:13,list:gs.map(g=>D.glab[g])}]:[]),{h:D.own[0],ro:1,w:18},{h:D.own[1],w:24},{h:D.kh,ro:1,w:16},...D.vals.map(h=>({h,w:(D.w||{})[h]||18,list:(D.lists||{})[h]}))];
    const rows=[];for(const g of gs){const D0=TX_DEF[g];for(const id of D0.list(W)){const o=D0.get(W,id);D.rows(W,g,o,id).forEach((x,i)=>rows.push([...(multi?[D.glab[g]]:[]),id,D0.name(o),x.key||('n'+i),...D.vals.map(h=>x.c[h]??'')]));}}
    out.push({name:D.sh,cols,rows});}
  return out;}
function txExport(){const sel=TX_ORD.filter(g=>(S.txSel||{})[g]);if(!sel.length)return;
  const blob=new Blob([txBook(txSheets(sel))],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='referentiel-'+today()+'.xlsx';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);toast('Tableur exporté');}
/* ---------- Import : calcul de l'aperçu (rien n'est enregistré) ---------- */
function txPlan(B){const W={pw:clone(S.pouvoirs||{}),cap:clone(S.capacites||{}),races:clone(S.races||{}),cre:clone(S.creatures||[]),pp:clone(ppEls()),fi:clone(S.fiches||{}),ch:clone(S.chars||{})};
  const P={W,warn:[],info:[],rec:{},own:{},sheets:[]},rec=(g,id,r,act)=>{const k=g+'|'+id;return P.rec[k]=P.rec[k]||{g,id,nom:'',r,act,ch:[]};};
  for(const g of TX_PLAN){const D=TX_DEF[g],rows=B[D.sh];if(!rows)continue;P.sheets.push(D.sh);txMainRun(P,D,rows,rec);}
  let nRen=0;for(const id of Object.keys(W.races)){const a=S.races&&S.races[id],b=W.races[id];if(a&&b&&a.sing&&b.sing&&a.sing!==b.sing)for(const c of Object.values(W.ch))if(c.race===a.sing){c.race=b.sing;nRen++;}}
  if(nRen)P.info.push(`${nRen} personnage${nRen>1?'s':''} suivr${nRen>1?'ont':'a'} le nouveau nom de sa race.`);
  for(const D of TX_DET){const rows=B[D.sh];if(!rows)continue;P.sheets.push(D.sh);txDetRun(P,D,rows,rec);}
  for(const x of Object.values(P.rec)){const D=TX_DEF[x.g],o=D.get(W,x.id);x.nom=o?D.name(o)||x.id:x.id;}
  P.list=TX_PLAN.flatMap(g=>Object.values(P.rec).filter(x=>x.g===g&&(x.act==='new'||x.ch.length)));
  return P;}
function txMainRun(P,D,rows,rec){const H=(rows[0]||[]).map(txNorm),ix=h=>H.indexOf(h),W=P.W,iId=ix('ID'),nmH=[].concat(D.nmCol),cols=D.cols.filter(c=>!c.ro&&ix(c.h)>=0);
  if(iId<0){P.warn.push({sh:D.sh,r:1,m:'colonne ID absente : onglet ignoré'});return;}
  const own=P.own[D.g]=P.own[D.g]||new Set(),T=[];
  for(let r=1;r<rows.length;r++){const R=rows[r]||[],cell=h=>ix(h)>=0?txNorm(R[ix(h)]):'',id=txNorm(R[iId]),nom=nmH.map(cell).find(v=>v&&v!=='-')||'',w=m=>P.warn.push({sh:D.sh,r:r+1,m});
    if(!id&&!nom){if(R.some(v=>txNorm(v)))w('ligne sans ID ni nom : ignorée');continue;}
    if(id){const o=D.get(W,id);if(!o){w(`ID « ${id} » inconnu : ligne ignorée (vide l'ID pour créer un élément)`);continue;}
      const sk=D.skip&&D.skip(o);if(sk){w(sk);continue;}if(own.has(id)){w(`ID « ${id} » en double : ligne ignorée`);continue;}T.push({r,R,id,isNew:false});own.add(id);}
    else{const miss=(D.req||[]).filter(h=>!cell(h)||cell(h)==='-');if(miss.length){w(`« ${nom} » : création impossible, à compléter : ${miss.join(', ')}`);continue;}
      const nid=D.mk(W,nom);T.push({r,R,id:nid,isNew:true});own.add(nid);}}
  for(const t of T){const o=D.get(W,t.id),rc=rec(D.g,t.id,t.r+1,t.isNew?'new':'maj'),x={W,id:t.id,isNew:t.isNew,w:m=>P.warn.push({sh:D.sh,r:t.r+1,m:`${D.name(o)||t.id} : ${m}`})};
    for(const c of cols){let v=txNorm(t.R[ix(c.h)]);if(!v)continue;if(v==='-')v='';const before=txNorm(c.get(o,x));if(v===before)continue;
      c.set(o,v,x);const after=txNorm(c.get(o,x));if(after!==before)rc.ch.push({c:c.h,av:before,ap:after,clr:!after});}}}
function txDetRun(P,D,rows,rec){const H=(rows[0]||[]).map(txNorm),ix=h=>H.indexOf(h),W=P.W,cell=(R,h)=>ix(h)>=0?txNorm(R[ix(h)]):'',[hId,hNm]=D.own,by={};
  if(ix(D.kh)<0||(ix(hId)<0&&ix(hNm)<0)){P.warn.push({sh:D.sh,r:1,m:'colonnes de rattachement absentes : onglet ignoré'});return;}
  for(let r=1;r<rows.length;r++){const R=rows[r]||[];if(!R.some(v=>txNorm(v)))continue;const w=m=>P.warn.push({sh:D.sh,r:r+1,m});
    const g=D.gs.length===1?D.gs[0]:txKey(Object.entries(D.glab),cell(R,'Genre'));if(!g){w('genre manquant ou inconnu : ligne ignorée');continue;}
    if(!P.own[g])continue;const D0=TX_DEF[g];let id=cell(R,hId);
    if(id&&!P.own[g].has(id)){w(D0.get(W,id)?`« ${id} » absent de l'onglet ${D0.sh} : ligne ignorée`:`élément « ${id} » inconnu : ligne ignorée`);continue;}
    if(!id){const nm=cell(R,hNm);id=[...P.own[g]].find(k=>{const o=D0.get(W,k);return o&&nrm(D0.name(o))===nrm(nm);})||'';if(!id){w(`élément « ${nm} » introuvable : ligne ignorée`);continue;}}
    (by[g+'|'+id]=by[g+'|'+id]||[]).push({r:r+1,R});}
  for(const g of D.gs){if(!P.own[g])continue;const D0=TX_DEF[g];
    for(const id of P.own[g]){const o=D0.get(W,id);if(!o)continue;
      const old=D.rows(W,g,o,id).map((x,i)=>({key:x.key||('n'+i),c:txDC(D,x.c)})),om=new Map(old.map(x=>[x.key,x])),M=[],usedK=new Set();
      for(const f of by[g+'|'+id]||[]){const key=cell(f.R,D.kh);let c,k=null;
        if(key&&om.has(key)&&!usedK.has(key)){k=key;usedK.add(key);c={...om.get(key).c};for(const h of D.vals){const v=cell(f.R,h);if(v==='-')c[h]='';else if(v)c[h]=v;}}
        else{c={};for(const h of D.vals){const v=cell(f.R,h);c[h]=v==='-'?'':v;}}
        if(D.vals.every(h=>!c[h]))continue;M.push({key:k,c,r:f.r});}
      if(M.length===old.length&&M.every((m,i)=>m.key===old[i].key&&stableJ(m.c)===stableJ(old[i].c)))continue;
      const nm=D0.name(o)||id;D.build(W,g,o,M,m=>P.warn.push({sh:D.sh,r:'',m:`${nm} : ${m}`}),id);
      const rc=rec(g,id,'','maj'),n0=rc.ch.length;
      for(const m of M){if(!m.key)rc.ch.push({c:D.sh,av:'',ap:D.lab(m.c),r:m.r,add:1});else{const a=om.get(m.key).c;if(stableJ(a)!==stableJ(m.c))rc.ch.push({c:D.sh,av:D.lab(a),ap:D.lab(m.c),r:m.r});}}
      for(const x of old)if(!M.some(m=>m.key===x.key))rc.ch.push({c:D.sh,av:D.lab(x.c),ap:'',del:1});
      if(rc.ch.length===n0)rc.ch.push({c:D.sh,av:'',ap:'ordre modifié'});}}}
/* ---------- Import : enregistrement ---------- */
function txCommit(P){const W=P.W,now=new Date().toISOString(),rep={date:today(),by:ME||'',nom:(S.tx&&S.tx.nomF)||'',n:{}};
  for(const x of P.list){const o=rep.n[x.g]=rep.n[x.g]||{c:0,m:0};if(x.act==='new')o.c++;else o.m++;}
  if(stableJ(W.pw)!==stableJ(S.pouvoirs||{}))savePouvoirs(W.pw);
  if(stableJ(W.cap)!==stableJ(S.capacites||{}))saveCapacites(W.cap);
  const rc=stableJ(W.races)!==stableJ(S.races||{}),cc=stableJ(W.cre)!==stableJ(S.creatures||[]);if(rc)saveRaces(W.races);if(cc)saveCreatures(W.cre);if(rc||cc)rebuildRaces();
  if(stableJ(W.pp)!==stableJ(ppEls()))prSaveDoc(d=>{d.el=W.pp;});
  for(const id of Object.keys(W.fi))if(stableJ(W.fi[id])!==stableJ((S.fiches||{})[id]||null))fiSave(W.fi[id],true);
  for(const id of Object.keys(W.ch))if(stableJ(W.ch[id])!==stableJ(S.chars[id]||null)){let c=W.ch[id];c.modif=now;if(typeof fxSync==='function')c=fxSync(c);S.chars[c.id]=c;persist('chars/'+c.id,c);}
  const R={...(S.kkImp||{}),xlsx:rep};S.kkImp=R;persist('meta/imports',R);return rep;}
const txRepTxt=R=>TX_ORD.filter(g=>R.n&&R.n[g]).map(g=>{const x=R.n[g];return TX_DEF[g].lab+' : '+[x.c?x.c+' créé'+(x.c>1?'s':''):'',x.m?x.m+' modifié'+(x.m>1?'s':''):''].filter(Boolean).join(', ');}).join(' · ')||'aucun changement';
/* ---------- Écrans ---------- */
function txCard(){if(!isGest())return '';const R=(S.kkImp||{}).xlsx,sel=S.txSel=S.txSel||{},n=TX_ORD.filter(g=>sel[g]).length,W=txLive();let body;
  if(!TX_WIDE())body=`<div class="txmsg"><b>Disponible sur ordinateur.</b> Ouvre l'appli sur un écran d'au moins ${TX_W} px de large.</div>`;
  else if(S.visit||writesLocked())body=`<div class="muted small" style="margin-top:8px">Export et import impossibles en lecture seule.</div>`;
  else if(!canEdit())body=`<div class="muted small" style="margin-top:8px">Passe en mode édition pour exporter ou importer.</div>`;
  else body=`<div class="txgrid"><div><div class="lab2">1. Exporter</div><div class="txsel">${TX_ORD.map(g=>`<label class="chk"><input type="checkbox" data-txg="${g}"${sel[g]?' checked':''}> ${TX_DEF[g].lab} <span class="muted small">${TX_DEF[g].list(W).length}</span></label>`).join('')}</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn" data-act="txAll">${n===TX_ORD.length?'Tout décocher':'Tout cocher'}</button><button class="btn pri" data-act="txExp"${n?'':' disabled'}>Exporter ${n} genre${n>1?'s':''} (.xlsx)</button></div></div>
    <div class="txcol2"><div class="lab2">2. Importer</div><label class="btn kkpick">Choisir un fichier .xlsx<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-txfile hidden></label>
      <div class="small muted" style="margin-top:8px">ID connu : mise à jour · sans ID : création · cellule vide : valeur gardée · « - » : champ effacé. Un aperçu s'affiche avant toute modification.</div>
      <div class="kkwarn small">Avant un import : faire une sauvegarde (export Supabase).</div></div></div>`;
  return `<div class="card txcard"><h3 class="rs" style="margin-top:0">Tableur du référentiel</h3><div class="small">Exporte des genres en .xlsx, modifie ou ajoute des lignes, puis réimporte le fichier. Rien n'est supprimé.</div>${body}${R?`<div class="small txlast"><b>Dernier import</b> · ${fmtDate(R.date)}${R.by&&S.players[R.by]?' · '+esc(S.players[R.by].nom):''} · ${esc(txRepTxt(R))}</div>`:''}</div>`;}
const txCut=s=>{s=String(s||'');return s.length>160?`<span title="${esc(s)}">${esc(s.slice(0,160))}…</span>`:esc(s);};
function txView(){const K=S.tx;
  if(K.step==='lecture')return `<div class="card"><div class="muted">Lecture de ${esc(K.nomF||'')}…</div></div>`;
  if(K.step==='err')return `<div class="card"><h3 class="rs" style="margin-top:0">Tableur du référentiel</h3><div class="pinerr">${esc(K.err)}</div><div class="actions"><button class="btn" data-act="txClose">Retour</button></div></div>`;
  if(K.step==='fin')return `<div class="kkhd"><button type="button" class="back" data-act="txClose">‹ Données</button><h2 class="rs" style="margin:0">Import terminé</h2></div><div class="kkdone"><b>${esc(txRepTxt(K.rep))}</b> · ${fmtDate(K.rep.date)}</div><div class="actions kkact"><button class="btn pri" data-act="txClose">Retour aux Données</button></div>`;
  const P=K.P,L=P.list,G=TX_PLAN.filter(g=>L.some(x=>x.g===g));
  let h=`<div class="kkhd"><button type="button" class="back" data-act="txClose">✕ Annuler</button><h2 class="rs" style="margin:0">Aperçu de l'import</h2></div>
    <div class="muted small">Fichier <b>${esc(K.nomF||'')}</b> · onglets lus : ${esc(P.sheets.join(', ')||'aucun')} · rien n'est encore modifié</div>`;
  h+=`<div class="txsum">${TX_PLAN.filter(g=>P.own[g]).map(g=>{const A=L.filter(x=>x.g===g),c=A.filter(x=>x.act==='new').length,m=A.length-c;
      return `<div><b>${TX_DEF[g].lab}</b><span>${[c?c+' créé'+(c>1?'s':''):'',m?m+' modifié'+(m>1?'s':''):''].filter(Boolean).join(' · ')||'aucun changement'}</span></div>`;}).join('')}${P.warn.length?`<div class="txko"><b>Points à voir</b><span>${P.warn.length}</span></div>`:''}</div>`;
  if(P.info.length)h+=`<div class="card">${P.info.map(t=>`<div class="kkinf"><b>·</b><span>${esc(t)}</span></div>`).join('')}</div>`;
  for(const g of G){const A=L.filter(x=>x.g===g);
    h+=`<details class="card kkdet" open><summary class="lab2">${TX_DEF[g].lab} · ${A.length}</summary><div class="txscroll"><table class="txtab"><thead><tr><th>Ligne</th><th>Élément</th><th>Champ</th><th>Avant</th><th>Après</th></tr></thead><tbody>${A.map(x=>{
      const C=x.ch.length?x.ch:[{c:'',av:'',ap:''}];return C.map((c,i)=>`<tr><td>${c.r||(i?'':x.r||'')}</td><td>${i?'':`<b>${esc(x.nom)}</b>${x.act==='new'?' <span class="kkst kkok">création</span>':''}`}</td><td>${esc(c.c)}</td><td class="txav">${txCut(c.av)}</td><td class="txap">${c.del?'<span class="kkko">retirée</span>':c.clr?'<span class="muted">(effacé)</span>':txCut(c.ap)}</td></tr>`).join('');}).join('')}</tbody></table></div></details>`;}
  if(P.warn.length)h+=`<div class="card txwarn"><h3 class="rs" style="margin-top:0">Points à voir</h3>${P.warn.map(x=>`<div class="kkinf"><b>·</b><span>${esc(x.sh)}${x.r?', ligne '+x.r:''} : ${esc(x.m)}</span></div>`).join('')}</div>`;
  h+=`<div class="actions kkact"><button class="btn" data-act="txClose">Annuler</button><button class="btn pri" data-act="txGo"${L.length?'':' disabled'}>${L.length?`Importer ${L.length} changement${L.length>1?'s':''}`:'Rien à importer'}</button></div>`;
  return h;}
function txFile(t){const f=t.files&&t.files[0];t.value='';if(!f||!isGest()||!canEdit())return;S.tx={step:'lecture',nomF:f.name};render();
  f.arrayBuffer().then(txReadBook).then(B=>{if(!TX_ORD.some(g=>B[TX_DEF[g].sh])&&!TX_DET.some(D=>B[D.sh]))throw new Error('vide');S.tx={step:'apercu',B,nomF:f.name,P:txPlan(B)};render();window.scrollTo(0,0);})
    .catch(e=>{console.error(e);S.tx={step:'err',err:"Ce fichier n'est pas un tableur du référentiel lisible (.xlsx exporté depuis l'appli)."};render();});}
function txAct(a,d){if(!isGest())return true;
  if(a==='txClose'){S.tx=null;window.scrollTo(0,0);return true;}
  if(a==='txAll'){const all=TX_ORD.every(g=>(S.txSel||{})[g]);S.txSel=Object.fromEntries(TX_ORD.map(g=>[g,!all]));return true;}
  if(a==='txExp'){if(canEdit()&&TX_WIDE())txExport();return true;}
  if(a==='txGo'){const K=S.tx;if(!K||K.step!=='apercu'||!canEdit()||S.visit||writesLocked())return true;const P=txPlan(K.B);S.tx={step:'fin',rep:txCommit(P)};window.scrollTo(0,0);setTimeout(()=>toast('Import terminé'),0);return true;}
  return true;}
