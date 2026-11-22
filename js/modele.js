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
const EL_FIELDS=['act','cib','dur','por','zon','res'];
/* Un élément du référentiel (pouvoir ou capacité) complété de ses champs fixes */
function elFull(x){const o={nom:'',desc:'',type:'',prec:false,kanka:'',...x};if(o.nat==null)o.nat='';for(const k of EL_FIELDS)if(o[k]==null)o[k]='';o.fx=fxNorm(o.fx);o.var=(o.var||[]).map(v=>({id:v.id,nom:v.nom||'',desc:v.desc||'',fx:fxNorm(v.fx)}));return o;}
const varOf=(el,vid)=>vid&&el&&(el.var||[]).find(v=>v.id===vid)||null;
function varIdByName(el,nom,create){if(!el||!(nom||'').trim())return '';const k=nrm(nom);const v=(el.var||[]).find(x=>nrm(x.nom)===k);if(v)return v.id;if(!create)return '';
  const ids={};for(const x of el.var||[])ids[x.id]=1;const id=freeId(ids,'v-'+slugOf(nom));el.var=[...(el.var||[]),{id,nom:nom.trim(),desc:'',fx:[]}];return id;}
const capCat=()=>(S.capacites||{});
const capOf=id=>capCat()[id]||null;
function capIdByName(C,nom){const k=nrm(nom);for(const id in C)if(nrm(C[id].nom)===k)return id;return null;}

/* ---------- Lot 3 : catégorie, nature, type ; illustrations ---------- */
const SLOT_CAT=i=>i<6?'ordinaire':i===6?'profond':'legendaire';
const SLOT_NAT=i=>i<4?'m':i<6?'d':'';
const NAT_L={m:'Masqué',d:'Démasqué'},CAT_L={ordinaire:'Ordinaire',profond:'Profond',legendaire:'Légendaire'},TYPE_L={actif:'Actif',passif:'Passif',metamorphose:'Métamorphose'};
const pwCatK=p=>(p&&p.cat)||'ordinaire';
/* Nature d'un pouvoir : enregistrée, sinon déduite des emplacements de race quand elle est unique (masqués 1-4, démasqués 1-2) */
function pwNatGuess(id){const s=new Set();for(const cr of raceCres()){const x=raceRec(cr);pwSlots(x).forEach((v,i)=>{if(v===id&&i<6)s.add(SLOT_NAT(i));});}return s.size===1?[...s][0]:'';}
const pwNat=id=>{const p=S.pouvoirs&&S.pouvoirs[id];return (p&&p.nat)||pwNatGuess(id);};
/* Illustrations : rangées comme les portraits (collection portraits), identifiant ill-<sorte>-<id> */
const illId=(t,id)=>'ill-'+t+'-'+id;
const illOf=(t,id)=>(id&&S.ptr&&S.ptr[illId(t,id)])||null;
const illThumb=(t,id,sz)=>{const s=illOf(t,id);return s?`<img class="illt" src="${s}" alt="" style="width:${sz}px;height:${sz}px">`:'';};
function illEdit(t,id,lab){if(!id)return `<div class="muted small">Enregistre d'abord pour ajouter une illustration.</div>`;const s=illOf(t,id);
  return `<div class="illed">${s?`<img class="illt" src="${s}" alt="" style="width:64px;height:64px">`:'<span class="illph" aria-hidden="true">+</span>'}<span style="display:flex;gap:6px;flex-wrap:wrap"><label class="btn ghost" style="cursor:pointer">${s?'Changer':'Ajouter une image'}<input type="file" accept="image/*" data-ptrfile="${illId(t,id)}" data-plab="${esc(lab||'')}" hidden></label>${s?`<button class="btn ghost" data-act="ptrDel" data-id="${illId(t,id)}">Retirer</button>`:''}</span></div>`;}

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
    const L=fxNorm(fx[fxKey('cap',a[0])]),base=[...k.fx,...((varOf(k,v)||{}).fx||[])];if(!fxSame(L,base))e.fx=L;
    const pe=(prev.cap||[]).find(z=>z&&!Array.isArray(z)&&z.id===id);if(pe&&pe.keep&&(e.fx||e.d!=null))e.keep=true;return e;});
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

/* ---------- Lot 4 : tableaux de points de personnage (transcription des 6 tableaux du livre, valeurs par défaut) ----------
   Une ligne : rubrique | coût | marques | noms (séparés par ;, * = réservé au profil) | prérequis | précision.
   Coût : 2, 0.5, h1f2 (contact humain / fée), t1m2 (fée traditionnelle / moderne). Marques : P4 Fortune de l'activité principale, S1 Fortune + 1 en secondaire, ! pas à la création. */
const PPTAB_SRC=`#Aventurier|Aventurière|Audacieux;Curieux;Intrépide;Rebelle;Tenace
A|0|P0|philanthrope*;alpiniste*;voyageur*;touriste*;chasseur (dilettante)*;globe-trotter*||
A|2|P3|garde-forestier;trappeur;dresseur;guide;chauffeur;braconnier;chasseur (profession)||
A|3|P4S1|anthropologue;archéologue;cartographe|comp:Culture:3|
A|3|P4S1|chasseur de trésors*;explorateur*;navigateur*||
A|4|P5|antiquaire d'antiquités exotiques;rentier d'une exploitation coloniale||
A|5|P6|business florissant d'import-export;exploitant d'un navire de transport international||
A|6|P7|exploitant principal d'un comptoir colonial;ancien gouverneur d'une colonie||Gouverneur : 40 ans ou plus
E|0.5||lampe à acétylène;paire de jumelles pliantes;paquetage d'expédition;une arme blanche légère ou un fouet et une arme de poing au choix;un fusil d'usage courant;permis de chasse ou de pêche;canasson;vélocipède||
E|1||fusil de chasse ou arme blanche stylisé(e) unique||Classe +1 quand pertinent et très robuste
E|1||petit appartement parisien;petite résidence secondaire à la campagne ou à l'étranger;petit terrain de chasse personnel;pur-sang arabe;voiturette Renault type A;attelage;animal dressé (familier)||
E|2||trésor découvert;grand domaine forestier ou montagnard exploité||+1 en Fortune
E|2||carnet d'adresses dans 3 villes au choix du type Le Caire, Athènes et Istanbul||+1 en Entregent dans ces villes
E|3||site archéologique découvert en Afrique du Nord||Fortune +1 et ancrage social parmi les colons
E|3||grand voilier à coque en fer avec son équipage||Compte comme un Contact collectif
E|3||grand manoir retiré à la campagne avec vaste domaine sauvage privé||Territoire de chasse discret et boisé
L|1||1 langue au choix||Anglais, Allemand, Celte (langue officielle d'Avalon et des cours féeriques), Espagnol, Flamand, Italien, Portugais, Russe, etc.
L|1||1 langue rare au choix||Arabe, Hébreu, Yiddish, Turc, Hindi, Chinois, Japonais, etc.
C|h1f2||antiquaire ou conservateur de musée intéressé et peu scrupuleux pour obtenir des pièces rares;archéologue ou géographe brillant mais ventripotent qui peine sur le terrain;exploratrice enthousiaste qui a voyagé partout||
C|h3||amant(e) éperdu(e)||Allié(e) humain(e) / Féal de rang Larbin, très fidèle, prêt à mourir pour son maître
C|h2f3||grand diplomate quinquagénaire au vaste réseau;marchand globe-trotter collectionneur d'objets rares||
C|3||druidesse de Brocéliande sérieuse mais inexpérimentée;Kendall, druide farfadet du bois de Vincennes||
C|3||Sidonie Toinard, bastet antiquaire intéressée par la magie;Élodie Dumoulin, archéologue Féale au Caire||
C|3||Gaëlane Oberenn, louve-garou Chevalière de Salisbury;Kamal Abbas, phénix Duc d'Égypte au Caire||
T|t1m2||famille féerique noble mineure||Voir la liste des noms de famille en annexe p. 122
T|t2m3||titre de Chevalier sans terre||Allégeance à une famille majeure en France ou en Europe (voir annexe)
T|t3m2||membre secret des Monarchomaques||Statut dangereux au sein de la Monarchie
T|t5m6||Vicomte de la Reine en France||Titre honorifique et diplomatique = émissaire de Swen VI en France
T|t6m7|!|titre de Marquis d'un territoire d'outre-mer||Fortune +1, allégeance à déterminer
#Gentleman|Lady|Causeur;Courtois;Esthète;Flegmatique;Hautain
A|0|P0|dandy*|fort:4|
A|0|P0|amateur d'art*;artiste dilettante*;touriste*||Amateur d'art : japonisme, impressionnisme, classicisme, musique, sculpture, etc.
A|2|P4S1|courtisane ou gigolo;critique d'art;artiste en devenir||
A|3|P5|artiste talentueux;courtisane très courtisée;galeriste d'art;propriétaire d'une boutique;propriétaire de thermes;rentier||Boutique : bijoux, chapeaux, mode, parfums, etc.
A|4|P6|commerçant aisé;courtier en bourse;gros rentier;propriétaire terrien;petit industriel||
A|5|P7|aristocrate avec importantes rentes agricoles ou foncières;banquier prospère||
A|6|P8|petit capitaine d'industrie;propriétaire d'un grand magasin||
A|7|P9|ancienne et riche famille aristocratique;entrepreneur immobilier||
E|0.5||canne-épée ou rapière;revolver de poche;jumelles d'ivoire pliantes pour l'opéra;tabatière en bois précieux ornementée ou miroir de poche luxueux;chevalière avec les armoiries de sa famille||Tabatière ou miroir : +1 en Classe si exhibé
E|1||petit appartement parisien;3 cartes de membre dans des clubs select européens||Jockey Club à Paris
E|1||bague à poison et divers poisons;carrosse luxueux;automobile en vogue en 1900;garde-robe de luxe||
E|2||grand hôtel particulier parisien;manoir et splendide domaine en région parisienne||
E|3||collection d'art;coffret à bijoux;petite rente||Fortune +1
E|3||carnet d'adresses fourni dans 3 capitales européennes;carnet d'adresses dans la noblesse féerique européenne||+1 en Entregent dans ces cercles
L|1||1 langue au choix||Anglais, Allemand, Celte (langue officielle d'Avalon et des cours féeriques), Espagnol, Flamand, Italien, Portugais, Russe, etc.
L|1||1 langue rare au choix||Arabe, Berbère, Hébreu, Yiddish, Turc, Hindi, Chinois, Japonais, etc.
C|h1f2||ami(e) galeriste ou modiste qui adore les cancans;demi-mondaine qui fréquente le gratin||
C|h2||haut fonctionnaire maladroit en société féru de dîners mondains;riche entrepreneur parvenu qui veut s'intégrer à l'aristocratie;domestique Féal Allié de rang Larbin||
C|h2f3||aristocrate très riche, passionné(e) d'art et ennuyé(e) par tout le reste;dame tenant un salon mondain;veuve d'un riche bourgeois qui organise des soirées||Salon littéraire, artistique, aristocrate ou bourgeois
C|3||Mathurin Gobineau (Goldéron), léporide commissaire-priseur à Drouot;Mme Loraux, elfe taulière du Vénus||
C|3||Tyronoe Frédon, fleur de métal Chevalière de Montmartre, tenancière de la fumerie d'opium le Delicius||
C|3||Ewynn Vauthier, elfe couturier officiel de la Cour de Paris;Oriande Alicarne, elfe Marquise de Modène||
C|3||Orféo Frédon de Bécon, incube riche aux innombrables conquêtes;Brénin Frédon, Comte vampyr (17e)||
T|t0m1||famille féerique noble mineure||Voir la liste des noms de famille en annexe p. 122
T|t1m2||titre de Chevalier sans terre||Allégeance à une famille majeure en France ou en Europe (voir annexe)
T|t3m4||titre de Chevalier d'une petite ville||Allégeance Frédon, avec un petit territoire, Fortune +1
T|t4m5||titre de Comte de la famille Frédon ou Aldébard||Titre honorifique, sans territoire
T|t5m6||titre de Vicomte de la Reine Swen VI en France||Titre honorifique et diplomatique
T|t6m7|!|titre de Marquis de France||Avec un territoire secondaire, Fortune +1
#Erudit|Érudite|Austère;Inspiré;Libre-penseur;Spirituel;Traditionaliste
A|0|P0|collectionneur de livres rares*;écrivain ou poète dilettante*;historien amateur*;occultiste amateur*||
A|2|P3|bureaucrate obscur;étudiant;instituteur;poète maudit;prêtre défroqué||
A|3|P4S1|archéologue;clerc;critique littéraire*;député intermittent;essayiste;journaliste;médium*;philosophe*;prêtre en mission hors de son diocèse;professeur d'université||
A|4|P5|cabinet d'avocat ou office notarial||
A|4|P5S1|auteur à succès*;éditeur*;rentier*||
A|5|P6S2|gros rentier;possesseur de plusieurs cabinets d'avocats||
E|0.5||canne-épée;revolver;pipe sculptée;planche de ouija;livre fétiche en édition rare||Pipe sculptée : +1 en Classe si fumée
E|1||appartement parisien;bibliothèque occulte;carte approximative d'Avalon;fiacre personnel;amulette protectrice occulte||Bibliothèque : +1 en Sciences occultes quand consultée ; amulette : +1 en Résistance psychique
E|2||petit manoir retiré dans la banlieue proche d'une grande ville;belle résidence secondaire à la campagne||
E|2||baguette de sourcier permettant d'aller à Avalon depuis une forêt||Test d'Occultisme + PER SD 16
E|3||grande bibliothèque personnelle de livres rares||Fortune +1 (Culture +1 quand consultée)
L|1||1 langue ancienne au choix||Araméen, Celte (langue officielle d'Avalon et des cours féeriques), Grec ancien, Latin, Sanskrit, etc.
L|1||1 langue européenne au choix||Anglais, Allemand, Espagnol, Flamand, Italien, Portugais, Russe, etc.
L|1||1 langue rare au choix||Arabe, Turc, Hindi, Chinois, Japonais, etc.
C|h1f2||bouquiniste affable des quais de Seine au courant des rumeurs de la rue;bibliothécaire austère mais incollable||
C|h2f3||ami membre d'une société secrète;professeur d'université influent mais coureur de jupons;philosophe excentrique aux théories farfelues||Société secrète : franc-maçonnerie, société théosophique, Golden Dawn, Rose-Croix, etc.
C|2||Féal(e) secrétaire dévoué(e) ébloui(e) par le génie de son maître;Nadja, diseuse de bonne aventure||Féal(e) : Allié humain
C|h1f2||personnage noble avec qui l'Héritier entretient une relation épistolaire platonique passionnée||
C|3||Sivno Gwylln, korrigan collectionneur de livres rares;Sidonie Toinard, bastet antiquaire intéressée par la magie||
C|3||Esprit Hatzfeld, spirite membre des Métaphysiciens||
C|3||revenant|comp:Occultisme:2,spec:Spiritisme|Sa Volonté + Humeur = 8 avec répartition libre (voir Un Livret pour les Doctes p. 21)
C|3||Tugdual Malefroy de Pierrefonds, gargouille et historien;Léonide Grotius, golem vieux bouquiniste des quais||
C|3||Auguste de l'Empoing Rocaille, président des Métaphysiciens|prof:Erudit:3|
C|3||Gutemberg, druide officiel de la cour de Caléïs Frédon;Taliesin, korrigan et barde errant d'Avalon||Taliesin : pas à Paris
T|t1m2||famille féerique noble mineure||Voir la liste des noms de famille en annexe p. 122
T|1||membre d'une société secrète||Franc-maçonnerie, Rose-Croix, société théosophique, Golden Dawn, etc.
T|t2m3||titre de Chevalier sans terre||Allégeance à une famille majeure en France ou en Europe (voir annexe)
T|2||membre des Métaphysiciens|comp:Culture:2,comp:Occultisme:2|
T|3||membre secret des Croisés païens|comp:Culture:2,comp:Occultisme:2|
T|t4m5||titre de Comte de la famille Frédon ou Aldébard||Titre honorifique, sans territoire
#Roublard|Roublarde|Boute-en-train;Intéressé;Malin;Narquois;Patibulaire
A|0|P1|chiffonnier des bas-fonds;mendiant||
A|0|P0|joueur*;comédien amateur*;écumeur de bistrots*||
A|1|P3|apache;comédien professionnel;conducteur;malfrat;pickpocket;saltimbanque||
A|3|P4S1|cambrioleur*;charlatan*;courtisane*;escroc*;espion*;receleur*;tueur à gages*||
A|4|P4|directeur d'une troupe d'acteurs||Avec Contact collectif dans le monde du spectacle
A|4|P5S1|propriétaire d'un théâtre;propriétaire d'une maison de passe;propriétaire d'une fumerie d'opium;réseau de bookmakers clandestins||
A|5|P6S2|propriétaire d'un abattoir*;réseau de contrebande*||Contrebande : alcool, drogues, art, bijoux, etc.
A|6|P6|réseau de contrebande d'armes||Accès gratuit à toutes les armes prohibées
E|0.5||arme blanche légère ou fouet et révolver courant;parapluie thrace;kit de jeu;attelage basique||Kit de jeu : dés, cartes, etc.
E|1||kit de jeu truqué;kit de déguisement||Kit truqué : +2 en Jeu ; déguisement : +1 en Comédie (Déguisement)
E|1||kit de désamorçage des pièges;kit de crochetage;lunettes d'obscurité;mallette de poisons;planque sûre||Kits : +1 en Larcin (Pièges, Crochetage) ; planque dans les égouts, les carrières souterraines, la Zone ou la banlieue
E|2||petit appartement parisien;gros attelage pour du matériel avec conducteur;automobile 4 personnes (sans chauffeur);pied-à-terre discret à la campagne ou en banlieue;5 faux papiers d'identité très crédibles||
L|1||Argot||Permet de parler sans être compris : argot populaire, argot gobelin (disgracieux pour certaines fées)
C|h1f2||un informateur;prostitué(e) au grand cœur||Informateur : chiffonnier, mendiant ou gamin des rues très débrouillard ; prostitué(e) connaissant les ragots de la rue et les gentlemen des maisons closes ; fée : paria
C|h1f2||acteur ou actrice célèbre mais complètement has been||A des entrées dans le monde du spectacle
C|h2f3||un leader d'une petite bande de jeunes Apaches||Voyous parisiens ; identité secrète si c'est une fée
C|h2f3||un baron de la pègre parisienne ou d'une autre grande ville||Amateur de grands crus et de bonne chère
C|3||Trivelin, gremelin prévôt de la Brigade du Silence des Halles;La Tentatrice, succube taulière du 7e péché||
C|3||Gregor Shamrock, farfadet jovial, tenancier de l'estaminet La Fée verte;Léoncie Melliflue, farfadette productrice de liqueur de berthaniel à Asnières;Casimir Belleguarrigue, ogre héros des Monarchomaques||
C|3||Tyronoe Frédon, fleur de métal Chevalière de Montmartre, tenancière de la fumerie d'opium le Delicius||
C|3||Bob du Terminus, orc marchand d'armes pourvoyeur des Sicaires;Mama Lafayette, gobeline tenant un mont-de-piété qui sert de relais aux Sicaires;Hans l'empoisonneur, smog tortionnaire pour les Sicaires et le Duc||Coût 1 pour un membre des Sicaires
C|3||Wrtzk (dit Lulu), gobelin trafiquant et bookmaker du côté de l'hippodrome d'Enghien;Deirdre Malizia, Marquise de Monte-Carlo, propriétaire du cercle de jeu Wagram||
C|3||Natalya Marcès, gargouille Monarchomaque anarchiste et idéaliste;Grégoire de Belleville, phénix mafieux||
T|t1m2||famille féerique noble mineure||Voir la liste des noms de famille en annexe p. 122
T|2||informateur des Gardiens du Silence||A de bons rapports avec la police féerique
T|t2m1||membre secret des Monarchomaques||Statut dangereux au sein de la Monarchie
T|2||espion des Aldébard, des Gwestiniog ou des Carwent;espion des Frédon;espion des druides||Statut dangereux (à la cour de France ; chez les autres familles majeures)
T|4||membre solo des Sicaires||Guilde des assassins d'élite de la Féerie : Fortune +1, armes et ressources gratuites, mais contrats à honorer régulièrement
#Combattant|Combattante|Combatif;Endurci;Martial;Protecteur;Sanguin
A|0|P0|anarchiste*;chasseur*;collectionneur d'armes*;duelliste*;escrimeur ou tireur amateur*;pompier volontaire*;pugiliste amateur*||
A|1||ex-fantassin*;ex-marin*;ex-cavalier*;ex-policier*;vétéran des guerres coloniales||Spécialité Armée / Marine / Police dans Autorité ou Entregent
A|2|P3S1|ex-capitaine de cavalerie*;ex-officier militaire d'armée de terre ou de mer*;ex-commissaire de police||Spécialité Armée / Marine / Police dans Autorité ou Entregent, avec une pension
A|2||fin stratège*||Spécialité Stratégie dans Art de la guerre, aucun rang de Fortune
A|2|P3|apache;garde-chasse;garde du corps;homme de main;Hercule de foire;malfrat||
A|3|P4S1|maître d'armes;mercenaire*;tueur à gages*;estafier d'un riche aristocrate||
A|5|P4|protecteur d'Avalon avec forêt attitrée||+ ami des druides = Contact collectif. Veille à éloigner les intrus des chemins forestiers menant au pays des fées, prête main-forte aux druides ; liens privilégiés avec les druides et accès facilité à Avalon
A|6|P5|chef d'une troupe de 3 mercenaires ou gardes humains de rang Larbin||Contact collectif
A|6|P6|marchand ou contrebandier d'armes||Accès à toutes les armes prohibées
E|0.5||panoplie d'armes;un vieil uniforme;permis de chasse;carte d'un club de tir ou d'escrime||Panoplie : 5 au choix parmi les armes de poing, d'épaule et armes blanches libres ou contrôlées et armes de traits
E|1||arme blanche ancestrale ou à feu courante d'un grand armurier||Classe +1 quand pertinent et très robuste
E|1||une arme à feu lourde;une antique médaille prisée||Médaille : +1 en Autorité ou Entregent auprès des soldats
E|1||petit appartement parisien;attelage de transport;terrain privé et discret pour stocker armes et explosifs et s'entraîner au tir;stock confortable de munitions;petit stock d'explosifs||
E|1||gilet pare-balles en lin (rare);plastron de cuir (peu discret);cotte de mailles (très peu discret)||
E|2||gilet pare-balles en soie (très rare et cher);cuirasse d'officier de cavalerie (avec uniforme militaire)||
E|3||grand voilier à coque en fer avec son équipage||Compte comme un contact collectif
E|3||manoir retiré à la campagne avec vaste domaine sauvage privé||Grand territoire de chasse discret et boisé
C|h1f2||anarchiste illuminé, sans peur, spécialiste des explosifs;camarade de combat revenu gravement blessé du front;policier vénal et peu regardant;soldat, ancien subalterne dans l'infanterie ou la marine, loyal mais alcoolique||Camarade : sauvé par l'Héritier, compétent mais amputé d'un membre (= allié humain)
C|3||Anatole Ragon, commissaire de police obèse connaissant l'existence des Fées||
C|f3||Monarchomaque (fée au choix) dont l'allégeance est secrète;Casimir Bellegarrigue, ogre monarchomaque||
C|h2f3||Protagoniste très haut gradé dans une armée ou police européenne||
C|3||Azazel, ange armurier misanthrope, à la Courneuve;Ludmila Thorne, trollesse videuse à la Fée verte||
C|3||Bob du Terminus, orc marchand d'armes, pourvoyeur des Sicaires;Mama Lafayette, gobeline tenant un Relais||Coût 1 pour un membre des Sicaires
C|3||Jacob Zehnacker, commissaire de l'Île de la Cité et ange prévôt d'une Brigade de Gardiens du Silence||
C|4||Alexis de Montsacré, loup-garou, bailli du Duc de France;Tiburce Froidefond, ogre Condottiere des Sicaires||
T|t1m2||famille féerique noble mineure||Voir la liste des noms de famille en annexe p. 122
T|t2m3||titre de Chevalier sans terre||Allégeance à une famille majeure en France ou en Europe (voir annexe)
T|3||brigadier des Gardiens du Silence du Duc de France||
T|t3m2||membre secret des Monarchomaques||Statut dangereux, incompatible avec brigadier des Gardiens du Silence
T|4||membre solo des Sicaires||Guilde des assassins d'élite de la Féerie : Fortune +1
#Savant|Savante|Cérébral;Critique;Ingénieux;Méthodique;Pragmatique
A|0|P0|amateur de nouvelles technologies*;bricoleur*;scientifique amateur*||
A|2|P3|étudiant en sciences;infirmier;ouvrier technicien;mécanicien;laborantin;réparateur||
A|3|P4|architecte;chimiste;ingénieur;physicien;professeur d'université||
A|3|P4S1|inventeur*;détenteur d'un lucratif brevet d'invention*||
A|4|P5|courtier en bourse||
A|4|P5|pharmacien;cabinet de médecin;établissement de bains médicinaux||Avec accès aux drogues et médicaments en usage
A|5|P6|industriel aisé propriétaire d'une usine ou d'une mine||
A|8|P9|capitaine d'industrie dans la chimie, le parfum ou la construction automobile||
E|0.5||lampe à acétylène;mallette de médecin;outils professionnels||Outils : +1 en Habiletés (Mécanique)
E|1||lunettes d'obscurité (rare);mallette de drogues, poisons et remèdes;masque à gaz;phonographe;vélocipède pliable et léger de la Communauté technologique||Phonographe : permet d'enregistrer et rejouer des sons
E|1||petit appartement parisien;bibliothèque scientifique personnelle;petit laboratoire ou atelier personnel dans sa spécialité;automobile rapide typique de 1900||Bibliothèque : +1 en Sciences quand on l'utilise
E|1||montgolfière||4 personnes maximum, suit la direction du vent
E|3||dirigeable||8 personnes maximum
E|3|!|prototype d'avion|comp:Sciences:6,spec:Avion|2 places ; spécialité Avion en Conduite
E|4|!|prototype de sous-marin|comp:Sciences:6,spec:Sous-marin|6 personnes ; spécialité Sous-marin en Conduite
C|1||professeur ou étudiant (humain) à la timidité maladive mais brillant en sciences;Protagoniste Faux-Semblant rival dans sa spécialité;jeune physicienne prometteuse étudiant la radioactivité ou la biologie moléculaire||
C|2||Féal(e) assistant(e) maladroit(e) mais complètement dévoué(e)||= Allié humain
C|2||Bob du Terminus, orc marchand d'armes en lien avec les Sicaires et les Technologues||
C|h2f3||industriel bourgeois riche et arrogant mais influençable;jeune inventeuse de génie frustrée de ne pas être reconnue;fée espionnant les chercheurs humains les plus prometteurs pour le compte des Technologues||Inventeuse dont le professeur spolie les inventions ; fée : gremelin, fleur de métal, protys, etc.
C|3||fouinard, smog ou fée électricité savant fou solitaire et excentrique||Domaine d'expertise à déterminer
C|3||Ernest Pommardin, léporide médecin, membre des Métaphysiciens;Charles-Victor Rivière, bastet et médecin aliéniste des fées;Emmanuel Bernstein, loup-garou biologiste et médecin, Métaphysicien et Technologue||
C|3||Frida Märker, fée électricité à l'École supérieure d'électricité, spécialiste d'électromancie||
C|3||Ferdinand Destouches, fouinard ingénieur de génie fréquentant le hangar des Technologues à Billancourt||
T|t1m2||famille féerique noble mineure||Voir la liste des noms de famille en annexe p. 122
T|t2m3||titre de Chevalier sans terre||Allégeance à une famille majeure en France ou en Europe (voir annexe)
T|t3m2||membre des Technologues|comp:Sciences:3|Accès aux armes et inventions de la Communauté
T|t3m2||sympathisant secret des nécromanciens humanistes ou aristocrates|comp:Médecine:3|`;
const PP_RUB=[['A','Activités et Fortune','Activ.'],['E','Équipement et possessions','Équip.'],['L','Langues','Lang.'],['C','Contacts','Contacts'],['T','Famille, titres et statuts','Famille']];
function ppCostParse(c){c=(c||'').trim();let m;if((m=c.match(/^h([\d.]*)f?([\d.]*)$/)))return {k:'hf',a:m[1]===''?null:+m[1],b:m[2]===''?null:+m[2]};
  if((m=c.match(/^f([\d.]+)$/)))return {k:'hf',a:null,b:+m[1]};if((m=c.match(/^t([\d.]+)m([\d.]+)$/)))return {k:'tm',a:+m[1],b:+m[2]};return {k:'u',a:+c||0,b:null};}
function ppParse(){const P={},K={};let cur=null,n=0;
  for(const ln of PPTAB_SRC.split('\n')){if(!ln.trim())continue;
    if(ln[0]==='#'){const [p,f,tr]=ln.slice(1).split('|');cur=p;P[p]={m:p==='Erudit'?'Érudit':p,f,traits:tr.split(';'),titre:{nom:'',desc:'',fx:[]}};continue;}
    const [r,c,fl,names,pre,prec]=ln.split('|'),fP=(fl||'').match(/P(\d+)/),fS=(fl||'').match(/S(\d+)/);
    const pr=(pre||'').split(',').filter(Boolean).map(x=>{const [t,a,b]=x.split(':');return t==='spec'?{t,n:a}:t==='fort'?{t,v:+a}:{t,n:a,v:+b};});
    for(let nm of names.split(';')){const ex=/\*$/.test(nm.trim());nm=nm.trim().replace(/\*$/,'');
      K['pp-'+(++n)]={prof:cur,rub:r,nom:nm,cost:ppCostParse(c),excl:ex,nocrea:(fl||'').includes('!'),fortP:fP?+fP[1]:null,fortS:fS?+fS[1]:null,spec:'',pre:clone(pr),prec:prec||'',fx:[]};}}
  const SP={'archéologue':'Archéologie','navigateur':'Navigation','fin stratège':'Stratégie','pickpocket':'Pickpocket','chasseur (profession)':'Chasse'};
  for(const e of Object.values(K))if(e.rub==='A'&&SP[e.nom])e.spec=SP[e.nom];
  return {P,K};}
/* Profils (lot 4) : meta/profils = {byId:{Aventurier:{m,f,traits:[],specs:{compétence:[[nom,carac,réservée]]},titre:{nom,desc,fx}}}, el:{id:{prof,rub,nom,cost,excl,nocrea,fortP,fortS,spec,pre,prec,fx}}}.
   Document absent : valeurs par défaut (tableaux du livre). Les 6 profils et leurs compétences restent fixes. */
let PP_DEF=null;const ppDef=()=>PP_DEF||(PP_DEF=ppParse());
const CATSPEC0=JSON.parse(JSON.stringify(CATSPEC));
const PPT_COST=9,PPT_PTS=22;
const prDoc=()=>{const x=typeof S!=='undefined'&&S.profils;return x&&x.byId?x:null;};
const titreDef=p=>{const m=(ppDef().P[p]||{}).m||p;return 'Titre '+(/^[aeiouyéèêâîô]/i.test(m)?"d'":'de ')+m;};
function prOf(p){const d=ppDef().P[p]||{m:p,f:p,traits:[]},x=((prDoc()||{}).byId||{})[p]||{};const r={...d,...x};
  r.titre={nom:'',desc:'',fx:[],...(x.titre||{})};if(!r.titre.nom)r.titre.nom=titreDef(p);r.traits=r.traits||[];return r;}
function ppEls(){const d=prDoc();return d&&d.el?d.el:ppDef().K;}
const profLab=(nom,c)=>{const p=prOf(nom);return c&&c.genre==='f'?(p.f||p.m):p.m;};
function applyProfils(){for(const k in CATSPEC0)CATSPEC[k]=JSON.parse(JSON.stringify(CATSPEC0[k]));const d=prDoc();if(!d)return;
  for(const p of Object.values(d.byId||{}))for(const [k,l] of Object.entries((p&&p.specs)||{}))if(Array.isArray(l))CATSPEC[k]=JSON.parse(JSON.stringify(l));}
function prSaveDoc(fn){const d=prDoc()?clone(S.profils):{byId:{},el:clone(ppDef().K)};if(!d.el)d.el=clone(ppDef().K);d.byId=d.byId||{};fn(d);S.profils=d;applyProfils();persist('meta/profils',d);}
/* Coûts, prérequis, achats */
function ppCost(e,opt,c){const k=e.cost||{k:'u',a:0};if(k.k==='hf')return opt==='f'?(k.b??k.a):(k.a??k.b);if(k.k==='tm')return c&&natfOf(c)==='mod'?k.b:k.a;return k.a||0;}
function ppCostMin(e,c){const k=e.cost||{};return k.k==='hf'?Math.min(...[k.a,k.b].filter(v=>v!=null)):ppCost(e,'',c);}
function ppCostTxt(e){const k=e.cost||{},f=v=>v==null?'—':ppFmt(v);return k.k==='hf'?(k.a==null?f(k.b)+' (fée)':k.b==null?f(k.a)+' (humain)':f(k.a)+' / '+f(k.b)):k.k==='tm'?f(k.a)+' / '+f(k.b):f(k.a);}
const PPOPT={p:'principale',s:'secondaire',h:'humain',f:'fée'};
const compCur=(c,n)=>{for(const pr of c.profils||[])for(const x of pr.comps||[])if(nrm(x.nom)===nrm(n))return x.cur||0;return 0;};
const ppSum=(c,pr)=>(pr.comps||[]).reduce((s,x)=>s+(x.cur||0),0);
const ppHave=pr=>{const v=pr.note==null||pr.note===''?0:+pr.note;return isNaN(v)?0:v;};
function ppPreTxt(p){return p.t==='spec'?'spécialité '+p.n:p.t==='fort'?'Fortune '+p.v:p.t==='prof'?profLab(p.n)+' rang '+p.v:p.n+' '+p.v;}
function ppPreMiss(e,c){return (e.pre||[]).filter(p=>{if(p.t==='spec')return !specsOf(c).some(s=>nrmS(s.nom)===nrmS(p.n));if(p.t==='fort')return ((c.fortune&&c.fortune.cur)||0)<p.v;
  if(p.t==='prof'){const pr=(c.profils||[]).find(x=>x.nom===p.n);return !pr||rankOf(c,pr)<p.v;}return compCur(c,p.n)<p.v;});}
const ppBought=c=>(c.achats||[]).filter(a=>a.ppel);
function ppFx(c){const out=[];if(!c||!(c.achats||[]).length)return out;const E=ppEls();
  for(const a of c.achats){const x=a.ppel;if(!x)continue;const fx=x.titre?prOf(x.prof).titre.fx:(E[x.id]||{}).fx;for(const f of fx||[])if(!fxInteg(f))out.push({...f,src:x.nom,kind:'pp'});}return out;}
/* Traits de caractère : c.traits={race,maj:{p,n},min:{p,n},libre} ; féal (humain) : maj et libre seulement */
function profMajMin(c){const L=(c.profils||[]).slice().sort((a,b)=>rankOf(c,b)-rankOf(c,a)||ppSum(c,b)-ppSum(c,a));return [L[0]&&L[0].nom,L[1]&&L[1].nom];}
function traitsOf(c){const t=c.traits||{},out=[];if(!isHum(c)&&t.race)out.push([t.race,'race']);for(const k of isHum(c)?['maj']:['maj','min'])if(t[k]&&t[k].n)out.push([t[k].n,profLab(t[k].p,c)]);if(t.libre)out.push([t.libre,'libre']);return out;}
const NATF={trad:'fée traditionnelle',mod:'fée moderne'};
function natfOf(c){if(isHum(c))return '';if(c.natf)return c.natf;const cr=c.race&&(S.creatures||[]).find(x=>raceRec(x).sing===c.race);return cr&&(cr.fam==='trad'||cr.fam==='mod')?cr.fam:'';}
