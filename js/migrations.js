/* La belle appli — version des données et migrations numérotées
   meta/schema = {v, date, by, hist:[{v, date, by}]} ; absent = version 0.
   Chaque étape est une fonction pure : (docs) → docs modifiés + signalements ; rien n'est écrit si elle échoue.
   Les écritures se font ensuite document par document, meta/schema en dernier : relancer reprend proprement. */
const SCHEMA_V=1;
class MigErr extends Error{constructor(msg,el){super(msg);this.el=el||'';}}

/* ---------- Étape 1 : version 0 → 1 (Socle) ---------- */
function migrateV1(D){
  const out={},sig=[],rep=[];const put=(k,v)=>{D[k]=v;out[k]=v;};
  const raw=D['meta/races']&&D['meta/races'].byId||{},P0=D['meta/pouvoirs']&&D['meta/pouvoirs'].byId||{};
  const chars=Object.keys(D).filter(k=>k.startsWith('chars/'));
  /* 1. Reprise de l'existant : les mises en place des versions précédentes doivent être passées */
  /* reprise après une interruption : les races (écrites en dernier, juste avant la version) sont déjà converties */
  const already=Object.values(raw).some(r=>r&&!r.hum&&(Array.isArray(r.pwi)||(r.cap||[]).some(a=>a&&!Array.isArray(a))));
  if(!already&&Object.keys(raw).some(k=>k!==HUM_ID)&&!(raw[HUM_ID]&&raw[HUM_ID].kk))
    throw new MigErr("Ces données datent d'avant l'harmonisation Kanka du 17/11 : installe d'abord la version du 17/11, ouvre l'appli une fois, puis reviens à celle-ci.",'Races');
  /* Les marqueurs des anciennes mises en place (doc, fxv, fxq, kk, refFix, humFix, fixTypK, resetSA, fix1) sont gardés :
     un appareil resté sur l'ancienne version ne relance pas ses corrections sur les données converties. */
  const R0=clone(raw);
  /* droits de gestion : si personne n'en a encore, le(s) MJ les reçoivent */
  const pl=Object.keys(D).filter(k=>k.startsWith('players/'));
  if(pl.length&&!pl.some(k=>'gestion' in D[k]))for(const k of pl){const p=clone(D[k]);p.gestion=p.role==='MJ';put(k,p);}
  /* secrets : la correction du 16/11 est passée ; place pour les propositions des joueurs */
  if(D['meta/secrets']&&!Array.isArray(D['meta/secrets'].props)){const s=clone(D['meta/secrets']);s.props=[];put('meta/secrets',s);}
  /* paramètres : première version datée (valeurs en vigueur), datée du premier gain enregistré */
  if(!(D['meta/params']&&(D['meta/params'].versions||[]).length)){const ev=(D['gains/all']&&D['gains/all'].events)||[],d0=ev.map(e=>e.date).filter(Boolean).sort()[0]||today();
    put('meta/params',{versions:[{date:d0,v:paramDefaults()}]});rep.push('Paramètres : première version datée du '+fmtDate(d0)+' (valeurs en vigueur).');}

  /* 2-4. Référentiel : pouvoirs (catégorie, type, variantes), capacités naturelles, identifiants des avantages, désavantages et atouts */
  const P={};for(const id in P0)P[id]=elFull(P0[id]);
  const C={};const C0=D['meta/capacites']&&D['meta/capacites'].byId||{};for(const id in C0)C[id]=elFull(C0[id]);
  const R={};for(const k in R0){const r=R0[k];if(!r||r.hum||already){R[k]=r;continue;}R[k]=raceFromView(r,r,P,C);}
  if(!already){
  /* capacités à variante obligatoire (structure validée le 17/11) */
  for(const id in C)if(['vision','crocs','griffes','sens decuple','dissimulation'].includes(nrm(C[id].nom)))C[id].prec=true;
  /* catégorie d'un pouvoir : d'après les emplacements où il est placé */
  const used={};for(const k in R){const r=R[k];if(!r||r.hum)continue;pwSlots(r).forEach((id,i)=>{if(id){(used[id]=used[id]||new Set()).add(i===6?'profond':i===7?'legendaire':'ordinaire');}});}
  for(const id in P){const u=[...(used[id]||[])];P[id].cat=P[id].cat||(u.length===1?u[0]:u.includes('legendaire')?'legendaire':u.includes('profond')?'profond':'ordinaire');
    if(u.length>1)sig.push({obj:{t:'pouvoir',id},champ:'Catégorie',statut:'valider',note:'Placé comme '+u.join(' et ')+' selon les races ; catégorie retenue : '+P[id].cat+'.'});}
  /* capacités : un même effet pour toutes les races d'une variante → rangé dans la variante ; sinon il reste propre à chaque race (à harmoniser) */
  const raceName=k=>R[k].sing||k;
  for(const cid in C){const ent=[];for(const k in R){const r=R[k];if(!r||r.hum)continue;for(const e of r.cap||[])if(e.id===cid)ent.push({k,e});}
    const anyVar=ent.some(x=>x.e.v);
    const groups={};for(const x of ent)(groups[x.e.v||'']=groups[x.e.v||'']||[]).push(x);
    for(const v in groups){const g=groups[v],L=g.map(x=>x.e.fx||[]),same=L.every(l=>fxSame(l,L[0]));
      if(same&&(v||!anyVar)){const tgt=v?varOf(C[cid],v):C[cid];tgt.fx=fxNorm(L[0]);for(const x of g)delete x.e.fx;}
      else if(!same){const vn=v?' ('+varOf(C[cid],v).nom+')':'';sig.push({obj:{t:'capacite',id:cid},champ:'Effets'+vn,statut:'valider',note:'Effets différents selon les races : '+g.map(x=>raceName(x.k)+' '+(x.e.fx||[]).length).join(', ')+'. Gardés propres à chaque race, à harmoniser.'});}
      else for(const x of g)if(!(x.e.fx||[]).length)delete x.e.fx;}
    for(const x of ent)if(x.e.d!=null)sig.push({obj:{t:'capacite',id:cid},champ:'Description',statut:'valider',note:'Description propre à la race '+raceName(x.k)+', différente de la description commune.'});}
  }else rep.push('Reprise après interruption : référentiel déjà converti.');

  /* personnages : variante du pouvoir choisi, atouts reliés par identifiant, kanka, bonus intégrés suivis par identifiant d'effet */
  const bySing={};for(const k in R)if(R[k]&&R[k].sing)bySing[R[k].sing]=R[k];
  for(const key of chars){const c=clone(D[key]),r=bySing[c.race]||null;let ch=false;
    if(c.kanka==null){c.kanka='';ch=true;}
    if(r&&!r.hum){const sl=pwSlots(r);
      c.pw=(c.pw||[]).map(o=>o.v!==undefined?o:{...o,v:sl[o.i]===o.id?((r.pwv||[])[o.i]||''):''});
      c.atouts=atoutsOf(c).map(a=>{if(isTyp(a.nom)||(a.rid&&(r.at||[]).some(e=>e.id===a.rid)))return a;const it=(r.at||[]).find(e=>nrmA(e.nom)===nrmA(a.nom));const b={...a};delete b.rid;return it?{...b,rid:it.id}:b;});ch=true;}
    /* Constitution accrue : règle fixe (PdV sous les deux formes) ; le bonus manuel qui la compensait est retiré */
    if(c.accru==='Constitution'&&c.bonus&&+c.bonus.PdV===3){c.bonus={...c.bonus};delete c.bonus.PdV;rep.push((c.court||c.id)+' : bonus manuel de +3 PdV retiré (Constitution accrue compte désormais sous les deux formes).');ch=true;}
    if(!c.fx){c.fx=true;sig.push({obj:{t:'perso',id:c.id},champ:'Moteur de bonus',statut:'confirmer',note:'Moteur activé par la mise à jour : vérifier les bonus permanents de la fiche.'});ch=true;}
    const want={};for(const e of fxListV1(c,r&&!r.hum?r:null,P,C))if(fxInteg(e))want[e.id+'|'+e.cible]=(want[e.id+'|'+e.cible]||0)+(+e.val||0);
    const sum=o=>{const m={};for(const k in o){const t=k.slice(k.lastIndexOf('|')+1);m[t]=(m[t]||0)+o[k];}return stableJ(m);};
    if(sum(want)!==sum(c.fxInt||{}))sig.push({obj:{t:'perso',id:c.id},champ:'Bonus intégrés',statut:'valider',note:'Les bonus intégrés ne correspondent pas aux effets actuels : valeurs gardées telles quelles, à vérifier.'});
    if(stableJ(want)!==stableJ(c.fxInt||{})){c.fxInt=want;ch=true;}
    if(ch)put(key,c);}
  put('meta/pouvoirs',{byId:P});put('meta/capacites',{byId:C});put('meta/races',{byId:R});
  rep.push(Object.keys(P).length+' pouvoirs, '+Object.keys(C).length+' capacités naturelles, '+Object.keys(R).filter(k=>R[k]&&!R[k].hum).length+' races converties.');
  return {out,sig,rep};}
const MIGRATIONS={1:migrateV1};

/* ---------- Toutes les étapes manquantes, dans l'ordre (pur : rien n'est écrit) ---------- */
function migrateAll(docs,from,by){const D=clone(docs),out={},sig=[],rep=[];
  for(let v=from+1;v<=SCHEMA_V;v++){const f=MIGRATIONS[v];if(!f)throw new MigErr('Étape '+v+' introuvable dans le code.');
    const r=f(D);Object.assign(out,r.out);sig.push(...r.sig);rep.push(...r.rep);}
  const now=today(),stamp=uid('s');
  if(sig.length){const L=((D['meta/signalements']&&D['meta/signalements'].list)||[]).slice();
    const seen=new Set(L.map(x=>x.auteur+'|'+stableJ(x.obj)+'|'+x.champ));
    for(const s of sig){const k='Mise à jour '+SCHEMA_V+'|'+stableJ(s.obj)+'|'+s.champ;if(seen.has(k))continue;seen.add(k);L.push({id:uid('sg'),date:now,by:by||'',auteur:'Mise à jour '+SCHEMA_V,ok:false,...s});}
    out['meta/signalements']={list:L};}
  const s0=D['meta/schema']||{};out['meta/schema']={v:SCHEMA_V,date:now,by:by||'',hist:[...(s0.hist||[]),{v:SCHEMA_V,date:now,by:by||'',rep}],stamp};
  return {out,sig,rep};}

/* ---------- Dans l'appli ---------- */
/* Photographie des données chargées, au format des documents enregistrés */
function snapshotDocs(){const D={};
  for(const id in S.chars)D['chars/'+id]=S.chars[id];for(const id in S.players)D['players/'+id]=S.players[id];
  D['meta/races']={byId:S.races||{}};D['meta/pouvoirs']={byId:S.pouvoirs||{}};if(S.capacites)D['meta/capacites']={byId:S.capacites};
  if(S.secretsDoc)D['meta/secrets']=S.secretsDoc;if(S.params&&(S.params.versions||[]).length)D['meta/params']=S.params;
  D['gains/all']={events:S.events||[]};if(S.schema)D['meta/schema']=S.schema;if(S.signalDoc)D['meta/signalements']=S.signalDoc;return D;}
/* Toutes les données nécessaires sont-elles chargées ? Calcule l'état de la version. */
function schemaCheck(){const ok=S.ready&&S.racesReady&&S.pouvoirsReady&&S.creaturesReady&&S.secretsReady&&S.paramsReady&&S.schemaReady&&S.capReady&&S.eventsReady&&S.playersReady;
  if(!ok)return;S.schemaV=(S.schema&&S.schema.v)||0;S.migPending=S.schemaV<SCHEMA_V;S.migAhead=S.schemaV>SCHEMA_V;}
const canMigrate=()=>isGest()||(S.playersReady&&gestCount()===0);
async function runMigration(){if(!S.migPending||S.migRunning||!DB||!canMigrate())return;
  S.migRunning=true;S.migErr=null;render();
  let res;try{res=migrateAll(snapshotDocs(),S.schemaV||0,ME||'');}
  catch(e){console.error(e);S.migRunning=false;S.migErr={msg:e.message||String(e),el:e.el||''};render();return;}
  /* ordre d'écriture : le référentiel en dernier (races juste avant la version) pour pouvoir reprendre après une interruption */
  const LAST=['meta/pouvoirs','meta/capacites','meta/races','meta/schema'];
  const keys=Object.keys(res.out).filter(k=>!LAST.includes(k)).concat(LAST.filter(k=>res.out[k]));
  for(const k of keys){try{await DB.doc(k).set(res.out[k]);}
    catch(e){console.error(e);S.migRunning=false;S.migErr={msg:"L'enregistrement s'est interrompu ("+k+"). Rien n'est perdu : relance la mise à jour, elle reprend où elle s'est arrêtée.",el:k};render();return;}}
  /* état local = données mises à jour */
  for(const k of keys){const v=res.out[k],[c,id]=k.split('/');
    if(c==='chars')S.chars[id]=v;else if(c==='players')S.players[id]=v;else if(k==='meta/races')S.races=v.byId;else if(k==='meta/pouvoirs')S.pouvoirs=v.byId;else if(k==='meta/capacites')S.capacites=v.byId;
    else if(k==='meta/secrets'){S.secretsDoc=v;S.secrets=v.list||[];S.secretProps=v.props||[];}else if(k==='meta/params'){S.params=v;applyParams();}else if(k==='meta/schema')S.schema=v;else if(k==='meta/signalements')S.signalDoc=v;}
  S.migRunning=false;S.migDone={rep:res.rep,n:res.sig.length};schemaCheck();rebuildRaces();render();}

/* Carte (gestion) ou bandeau (autres) tant que la mise à jour n'est pas faite */
function socleBanner(){
  if(S.migAhead)return `<div class="ui-band ui-warn" role="status"><b>Version de l'appli plus ancienne que les données.</b> Recharge la page pour obtenir la dernière version ; en attendant, l'appli est en lecture seule.</div>`;
  if(S.migDone&&!S.migPending)return `<div class="ui-card ui-ok" role="status"><b>Mise à jour des données terminée (version ${SCHEMA_V}).</b>${S.migDone.rep.map(l=>`<div class="ui-small">${esc(l)}</div>`).join('')}${S.migDone.n?`<div class="ui-small">${S.migDone.n} point${S.migDone.n>1?'s':''} à vérifier dans Paramètres › Données.</div>`:''}<div class="ui-act"><button class="btn" data-act="migSeen">Fermer</button>${S.migDone.n?`<button class="btn pri" data-act="goDonnees">Voir les points à vérifier</button>`:''}</div></div>`;
  if(!S.migPending)return '';
  if(!canMigrate())return `<div class="ui-band" role="status"><b>Mise à jour en attente.</b> La gestion doit lancer la mise à jour des données ; d'ici là, l'appli est en lecture seule.</div>`;
  const e=S.migErr;
  return `<div class="ui-card ui-mig" role="region" aria-label="Mise à jour des données"><b>Mise à jour des données disponible (version ${S.schemaV||0} → ${SCHEMA_V})</b>
    <div class="ui-small">Les données sont rangées dans le nouveau modèle : référentiel des pouvoirs et des capacités, identifiants fixes, effets suivis par identifiant. L'aspect de l'appli ne change pas.</div>
    <div class="ui-small"><b>As-tu fait ta sauvegarde ?</b> Si ce n'est pas le cas, fais-la avant de lancer. D'ici là, l'appli est en lecture seule pour tout le monde.</div>
    ${e?`<div class="ui-err" role="alert"><b>La mise à jour s'est arrêtée sans rien enregistrer${e.el?' (élément en cause : '+esc(e.el)+')':''}.</b><div>${esc(e.msg)}</div></div>`:''}
    <div class="ui-act"><button class="btn pri" data-act="migRun"${S.migRunning?' disabled':''}>${S.migRunning?'Mise à jour en cours…':e?'Relancer la mise à jour':'Lancer la mise à jour'}</button></div></div>`;}
/* Écritures refusées tant que la version des données n'est pas la bonne (sauf la mise à jour elle-même) */
const writesLocked=()=>!!(S.migPending||S.migAhead)&&!S.migRunning;
