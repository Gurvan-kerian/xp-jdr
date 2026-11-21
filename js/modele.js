/* La belle appli — modèle de données (version 1 du Socle)
   Référentiel unique avec identifiants fixes :
   - meta/pouvoirs   {byId:{id:{nom, desc, cat, type, prec, act, cib, dur, por, res, kanka, fx:[effet], var:[variante]}}}
   - meta/capacites  {byId:{id:{nom, desc, type, prec, act, cib, dur, por, res, kanka, fx:[effet], var:[variante]}}}
   - variante        {id, nom, desc, fx:[effet]}
   - effet           {id, t:'perm'|'jet'|'rap', cible, val, txt, quand:'m'|'d'}
   - meta/races      {byId:{id:{sing, car, choix:[['acc',carac]|['cap',capId,varId]], cap:[{id, v, d?, fx?}],
                       av|dv|at:[{id, nom, desc, fx}], pw:{m,d,p,l}, pwv:[8 id de variante], pwi:[8 inconnu], eye, kanka, …}}}
   Les écrans actuels lisent une « vue » de chaque race dans l'ancienne forme (noms au lieu d'identifiants),
   et enregistrent par saveRaceView, qui retraduit en identifiants. Rien d'autre ne lit le stockage directement. */

/* ---------- Identifiants ---------- */
const uid=p=>p+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const slugOf=s=>nrm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'x';
function freeId(map,base){let id=base;while(map[id])id=base+'-'+Math.random().toString(36).slice(2,5);return id;}
/* Effets : chacun reçoit un identifiant fixe (le suivi des bonus intégrés s'y rattache) */
const fxNorm=L=>(L||[]).map(e=>e&&e.id?e:{...e,id:uid('fx')});
const stableJ=v=>Array.isArray(v)?'['+v.map(stableJ).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stableJ(v[k])).join(',')+'}':JSON.stringify(v);
const fxBare=L=>(L||[]).map(e=>stableJ({t:e.t,cible:e.cible||'',val:+e.val||0,txt:e.txt||'',quand:fxQ(e.quand)}));
const fxSame=(a,b)=>fxBare(a).join('|')===fxBare(b).join('|');
const PW_CATS=[['ordinaire','Ordinaire'],['profond','Profond'],['legendaire','Légendaire']];
const EL_TYPES=[['actif','Actif'],['passif','Passif'],['metamorphose','Métamorphose']];
const EL_FIELDS=['act','cib','dur','por','res'];
/* Un élément du référentiel (pouvoir ou capacité) complété de ses champs fixes */
function elFull(x){const o={nom:'',desc:'',type:'',prec:false,kanka:'',...x};for(const k of EL_FIELDS)if(o[k]==null)o[k]='';o.fx=fxNorm(o.fx);o.var=(o.var||[]).map(v=>({id:v.id,nom:v.nom||'',desc:v.desc||'',fx:fxNorm(v.fx)}));return o;}
const varOf=(el,vid)=>vid&&el&&(el.var||[]).find(v=>v.id===vid)||null;
function varIdByName(el,nom,create){if(!el||!(nom||'').trim())return '';const k=nrm(nom);const v=(el.var||[]).find(x=>nrm(x.nom)===k);if(v)return v.id;if(!create)return '';
  const ids={};for(const x of el.var||[])ids[x.id]=1;const id=freeId(ids,'v-'+slugOf(nom));el.var=[...(el.var||[]),{id,nom:nom.trim(),desc:'',fx:[]}];return id;}
const capCat=()=>(S.capacites||{});
const capOf=id=>capCat()[id]||null;
function capIdByName(C,nom){const k=nrm(nom);for(const id in C)if(nrm(C[id].nom)===k)return id;return null;}

/* ---------- Vue d'une race (ancienne forme, lue par les écrans) ---------- */
const LEGACY_MARKS=['doc','fxv','fxq','kk'];
/* Race restée dans l'ancien format (enregistrée par un appareil sur l'ancienne version) : lue telle quelle */
const isLegacyRace=r=>!!r&&!r.hum&&('pwq' in r||(r.cap||[]).some(a=>Array.isArray(a))||['av','dv','at'].some(t=>(r[t]||[]).some(a=>Array.isArray(a))));
function raceView(r,P,C){
  if(!r||r.hum||isLegacyRace(r))return r;
  const o={...r},fx={};delete o.pwi;
  const slots=pwSlots(r),pwi=r.pwi||[],pwv=(r.pwv||[]).concat(Array(8).fill('')).slice(0,8);
  const sl=slots.map((id,i)=>!id&&pwi[i]?'?':id);
  o.pw={m:sl.slice(0,4),d:sl.slice(4,6),p:sl[6],l:sl[7]};o.pwv=pwv;o.pwu=slots.map((id,i)=>!!pwi[i]);
  o.pwq=sl.map((id,i)=>{const v=id&&id!=='?'&&varOf(P[id],pwv[i]);return v?v.nom:'';});
  o.cap=(r.cap||[]).map(e=>{const k=C[e.id]||{nom:e.id,desc:''},v=varOf(k,e.v),L=e.fx?e.fx:[...(k.fx||[]),...((v&&v.fx)||[])];
    if(L.length)fx[fxKey('cap',k.nom)]=L;return [k.nom,e.d!=null?e.d:(k.desc||''),v?v.nom:''];});
  for(const t of ['av','dv','at'])o[t]=(r[t]||[]).map(e=>{if((e.fx||[]).length)fx[fxKey(t,e.nom)]=e.fx;return [e.nom,e.desc||''];});
  o.choix=(r.choix||[]).map(c=>{if(c[0]!=='cap')return c;const k=C[c[1]],v=varOf(k,c[2]);return ['cap',k?k.nom:c[1],v?v.nom:''];});
  o.fx=fx;return o;}
/* Vues de toutes les races, recalculées seulement quand les données changent */
let _rv={r:null,p:null,c:null,v:null};
function racesView(){if(!S.races)return {};
  if(_rv.r!==S.races||_rv.p!==S.pouvoirs||_rv.c!==S.capacites){const P=S.pouvoirs||{},C=S.capacites||{},V={};for(const k in S.races)V[k]=raceView(S.races[k],P,C);_rv={r:S.races,p:S.pouvoirs,c:S.capacites,v:V};}
  return _rv.v;}
const modelV1=()=>(S.schemaV||0)>=1;

/* ---------- Retour d'une vue vers le stockage ----------
   rec = race dans l'ancienne forme (éditeur) ; prev = race enregistrée ; P, C = catalogues (modifiés sur place s'il faut créer un élément ou une variante).
   Les avantages, désavantages et atouts gardent leur identifiant tant que leur nom ou leur place ne change pas. */
function raceFromView(rec,prev,P,C){
  prev=prev||{};const fx=rec.fx||{},r={...rec};for(const k of ['pwq','fx','pwu'])delete r[k];
  /* marqueurs des anciennes mises en place : gardés tels qu'ils étaient (un appareil resté sur l'ancienne version ne les relance pas) */
  for(const k of LEGACY_MARKS){if(prev[k]!=null)r[k]=prev[k];else delete r[k];}
  /* capacités */
  const capOne=(nom,desc,vn)=>{let id=capIdByName(C,nom);if(!id){id=freeId(C,'cap-'+slugOf(nom));C[id]=elFull({nom:nom.trim(),desc:(desc||'').trim()});}
    const k=C[id]=elFull(C[id]);const v=varIdByName(k,vn,true);return {id,v,k};};
  r.cap=(rec.cap||[]).filter(a=>a&&(a[0]||'').trim()).map(a=>{const {id,v,k}=capOne(a[0],a[1],a[2]),e={id,v},d=(a[1]||'').trim();
    if(d&&!k.desc)k.desc=d;else if(d&&d!==k.desc)e.d=d;
    const L=fxNorm(fx[fxKey('cap',a[0])]),base=[...k.fx,...((varOf(k,v)||{}).fx||[])];if(!fxSame(L,base))e.fx=L;return e;});
  r.choix=(rec.choix||[]).map(c=>{if(c[0]!=='cap')return c;const {id,v}=capOne(c[1],'',c[2]);return ['cap',id,v];});
  /* avantages, désavantages, atouts */
  for(const t of ['av','dv','at']){const old=Array.isArray(prev[t])?prev[t].filter(e=>e&&typeof e==='object'&&!Array.isArray(e)):[],used=new Set(),names=new Set((rec[t]||[]).map(a=>nrm(a&&a[0])));
    r[t]=(rec[t]||[]).filter(a=>a&&(a[0]||'').trim()).map((a,i)=>{const nom=a[0].trim();
      let o=old.find(e=>!used.has(e.id)&&nrm(e.nom)===nrm(nom));
      if(!o){const p=old[i];if(p&&!used.has(p.id)&&!names.has(nrm(p.nom)))o=p;}
      const taken={};for(const e of old)taken[e.id]=1;for(const x of used)taken[x]=1;
      const id=o?o.id:freeId(taken,t+'-'+slugOf(nom));used.add(id);return {id,nom,desc:(a[1]||'').trim(),fx:fxNorm(fx[fxKey(t,nom)])};});}
  /* pouvoirs : « ? » = case inconnu ; précision = variante du pouvoir */
  const sl=pwSlots(rec),pwi=sl.map((x,i)=>x==='?'||(!!x&&!!(rec.pwu||[])[i])),ids=sl.map(x=>x==='?'?'':x),q=rec.pwq||[];
  r.pw={m:ids.slice(0,4),d:ids.slice(4,6),p:ids[6]||'',l:ids[7]||''};r.pwi=pwi;
  r.pwv=ids.map((id,i)=>{if(!id||!P[id]||!(q[i]||'').trim())return '';P[id]=elFull(P[id]);return varIdByName(P[id],q[i],true);});
  if(r.kanka==null)r.kanka=prev.kanka!=null?prev.kanka:'';
  for(const k of ['sp','spf'])if(!Array.isArray(r[k]))r[k]=[];
  return r;}

/* ---------- Enregistrement ---------- */
function savePouvoirs(P){const n={};for(const id in P)n[id]=modelV1()?elFull(P[id]):P[id];S.pouvoirs=n;persist('meta/pouvoirs',{byId:n});}
function saveCapacites(C){const n={};for(const id in C)n[id]=elFull(C[id]);S.capacites=n;persist('meta/capacites',{byId:n});}
function saveRaces(R){S.races=R;persist('meta/races',{byId:R});}
/* Enregistre une race saisie dans l'ancienne forme (éditeur de fiche de race) */
function saveRaceView(id,rec){
  if(!modelV1()){saveRaces({...S.races,[id]:rec});return;}
  const P=clone(S.pouvoirs||{}),C=clone(S.capacites||{}),p0=JSON.stringify(P),c0=JSON.stringify(C);
  const r=raceFromView(rec,S.races[id],P,C);
  if(JSON.stringify(P)!==p0)savePouvoirs(P);if(JSON.stringify(C)!==c0)saveCapacites(C);
  saveRaces({...S.races,[id]:r});}
/* Variante de pouvoir retenue pour un emplacement de la race (id) */
const raceVarAt=(x,i)=>((x&&x.pwv)||[])[i]||'';

/* ---------- Effets d'un personnage (modèle version 1) ----------
   Race : capacités (effets propres à la race, sinon effets communs + variante), avantages, désavantages, atouts pris ;
   pouvoirs choisis : effets communs + effets de la variante. Chaque effet garde son identifiant. */
function fxListV1(c,r,P,C){const out=[];if(!c||!r)return out;
  if(isLegacyRace(r)){const has=new Set(atoutsOf(c).map(a=>nrmA(a.nom)));
    if(r.fx)for(const k of ['cap','av','dv','at'])for(const e of (r[k]||[])){if(!e||!e[0]||(k==='at'&&!has.has(nrmA(e[0]))))continue;for(const f of (r.fx[fxKey(k,e[0])]||[]))out.push({...f,src:e[0],kind:k});}
    for(const o of c.pw||[]){const p=P[o.id];if(p)for(const f of p.fx||[])out.push({...f,src:p.nom,kind:'pw'});}return out;}
  for(const e of r.cap||[]){const k=C[e.id];if(!k)continue;const v=varOf(k,e.v),L=e.fx?e.fx:[...(k.fx||[]),...((v&&v.fx)||[])];for(const f of L)out.push({...f,src:k.nom,kind:'cap'});}
  for(const t of ['av','dv'])for(const e of r[t]||[])for(const f of e.fx||[])out.push({...f,src:e.nom,kind:t});
  const A=atoutsOf(c),rid=new Set(A.map(a=>a.rid).filter(Boolean)),nm=new Set(A.map(a=>nrmA(a.nom)));
  for(const e of r.at||[]){if(!(rid.has(e.id)||nm.has(nrmA(e.nom))))continue;for(const f of e.fx||[])out.push({...f,src:e.nom,kind:'at'});}
  const sl=pwSlots(r);
  for(const o of c.pw||[]){const p=P[o.id];if(!p)continue;const v=varOf(p,o.v||(sl[o.i]===o.id?((r.pwv||[])[o.i]||''):''));for(const f of [...(p.fx||[]),...((v&&v.fx)||[])])out.push({...f,src:p.nom,kind:'pw'});}
  return out;}
/* Race enregistrée (modèle 1) d'un personnage */
function raceStoredOf(c){if(!c||!c.race||!S.races)return null;const cr=(S.creatures||[]).find(x=>{const r=S.races[x.id];return r&&r.sing===c.race;});return cr?S.races[cr.id]:null;}
