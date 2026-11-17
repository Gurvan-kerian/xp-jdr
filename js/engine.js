/* La belle appli — moteur de règles (coûts, races, spécialités, atouts, achats) */
/*ENGINE*/
const RULES={feerie:5,masque:4,carac:4,comp:3,fut:1,fortune:2,atout:8,spec:8,prof:12,carac12:12,specFut:2,mauvaiseMain:12};
const CARACS=['Agilité','Constitution','Force','Esprit','Perception','Précision','Prestance','Sang Froid'];
const NATURES=['Scénario','Groupe','Individuel'];
const PROFILS=['Aventurier','Combattant','Erudit','Gentleman','Roublard','Savant'];
const PROFCOMPS={Aventurier:['Conduite','Mouvement','Ressort','Survie'],Combattant:['Art de la guerre','Autorité','Mêlée','Tir'],Erudit:['Culture','Fortitude','Occultisme','Rhétorique'],Gentleman:['Classe','Entregent','Séduction','Sensibilité'],Roublard:['Comédie','Larçin','Discrétion','Monde du crime'],Savant:['Habiletés','Médecine','Observations','Sciences']};
const GAP=10;
const TYPES=['Scénario','Interscénario','Autre'];
const STARS=30;
const LABEL={feerie:'Féerie',masque:'Masque',fortune:'Fortune',atout:'Atouts féeriques',spec:'Spécialités'};
const STAGES=[{nom:'Profond',feerie:7,carac:6,comp:6,atout:4},{nom:'Légendaire',feerie:8,carac:7,comp:7,atout:5}];
let PALIER_MAX=7; /* seules les compétences dont le niveau max est ≥ 7 comptent pour Profond et Légendaire */
function lvlCost(kind,l){if(kind==='atout'||kind==='spec')return RULES[kind];if(kind==='carac'&&l===2)return RULES.carac12;return l*RULES[kind];}
function cum(kind,from,to){let s=0;for(let l=from+1;l<=to;l++)s+=lvlCost(kind,l);return s;}
function ref(c,key){
  const i=key.indexOf(':'),k=i<0?key:key.slice(0,i),n=i<0?'':key.slice(i+1);
  if(k==='feerie'||k==='masque'||k==='fortune'||k==='atout'||k==='spec'){const o=c[k];return o?{kind:k,nom:LABEL[k],o,max:k==='spec'?null:(k==='atout'&&c.type==='PJ'?Math.max(atoutListed(c),o.cur||0):o.max)}:null;}
  if(k==='carac'){const o=c.carac&&c.carac[n];return o?{kind:'carac',nom:n,o,max:maxFor(c,'carac',n,o)}:null;}
  if(k==='comp'){for(const p of c.profils||[])for(const x of p.comps||[])if(x.nom===n)return{kind:'comp',nom:n,o:x,max:maxFor(c,'comp',n,x)};return null;}
  if(k==='fut'){const x=(c.futiles||[]).find(f=>f.nom===n);return x?{kind:'fut',nom:n,o:x,max:maxFor(c,'fut',n,x)}:null;}
  if(k==='prof'){const x=(c.profils||[]).find(f=>f.nom===n);return x?{kind:'prof',nom:n,o:x,max:maxFor(c,'prof',n,x)}:null;}
  return null;
}
function lv(c,key){const r=ref(c,key);return r?(r.o.cur||0):0;}
function tricherie(c){return Math.floor((lv(c,'feerie')+lv(c,'masque'))/2);}
function derivedBase(c,forme){
  const A=n=>lv(c,'carac:'+n)+fxSum(c,'car:'+n,forme)[0]+(forme==='d'&&isAcc(c,'carac:'+n)?1:0);
  if(c.type==='PNJ'){const P=n=>lv(c,'prof:'+n);return [['PdV',9+A('Constitution')*3],['Esquive',5+A('Agilité')+P('Aventurier')],['Parade',5+A('Agilité')+P('Combattant')],['Résistance physique',5+A('Constitution')+P('Aventurier')],['Résistance psychique',5+A('Esprit')+P('Erudit')],['Initiative',P('Combattant')+Math.max(A('Sang Froid'),A('Perception'))],['Base mêlée',A('Agilité')+P('Combattant')],['Base tir',A('Précision')+P('Combattant')]];}
  const C=n=>lv(c,'comp:'+n)+fxSum(c,'comp:'+n,forme)[0],mb=Math.max(0,lv(c,'masque')-5);
  return [['PdV',9+A('Constitution')*3],['Esquive',5+A('Agilité')+C('Mouvement')],['Parade',5+A('Agilité')+C('Mêlée')],['Résistance physique',5+A('Constitution')+C('Ressort')+mb],['Résistance psychique',5+A('Esprit')+C('Fortitude')+mb],['Initiative',C('Art de la guerre')+Math.max(A('Sang Froid'),A('Perception'))],['Base mêlée',A('Agilité')+C('Mêlée')],['Base tir',A('Précision')+C('Tir')]];
}
function derived(c,forme){return derivedBase(c,forme).map(([n,v])=>{const b=(c.bonus&&c.bonus[n])||0,[fb,src]=fxSum(c,'der:'+n,forme);return [n,v+b+fb,b,src];});}
function rankOf(c,p){if(c.type==='PNJ')return p.cur||0;const cs=p.comps||[];return Math.floor(cs.reduce((s,x)=>s+(x.cur||0),0)/4);}
function nextRank(c,p){
  if(c.type==='PNJ'){const cur=p.cur||0;if(cur>=p.max)return null;return{cost:cum('prof',cur,cur+1),steps:[]};}
  const cs=p.comps.map(x=>({nom:x.nom,cur:x.cur||0,max:x.max}));
  let sum=cs.reduce((s,x)=>s+x.cur,0);const need=4*(Math.floor(sum/4)+1);let cost=0;const steps=[];
  while(sum<need){let b=null;for(const x of cs){if(x.cur>=x.max)continue;const k=lvlCost('comp',x.cur+1);if(!b||k<b.k)b={x,k};}
    if(!b)return null;cost+=b.k;steps.push(b.x.nom+' '+(b.x.cur+1));b.x.cur++;sum++;}
  return{cost,steps};
}
function sessTotal(events,sid,pj){let t=0;for(const e of events)if(e.id===sid||e.sessionId===sid)for(const en of e.entries)if(en.perso===pj)t+=en.montant;return t;}
/* Part d'un PNJ rattaché à un PJ : 50 % des gains du PJ dans la session s'il a participé, 25 % sinon, arrondi à l'inférieur.
   Ne s'applique qu'aux sessions datées à partir du jour du rattachement. */
function pnjShares(c,events){if(!c||c.type!=='PNJ'||!c.pj||!c.pjDate)return [];const out=[];
  for(const e of events){if(!e.session||e.rattrapage||e.reprise||(e.date||'')<c.pjDate)continue;const on=!!(e.pnj&&e.pnj[c.id]),pct=on?50:25,base=sessTotal(events,e.id,c.pj),m=Math.floor(base*pct/100);
    out.push({sess:e.id,on,pct,base,montant:m,nature:'PNJ ('+pct+' %)'});}return out;}
function gainsOf(c,events){const by={};let t=0;for(const e of events)for(const en of e.entries)if(en.perso===c.id){by[en.nature]=(by[en.nature]||0)+en.montant;t+=en.montant;}
  for(const sh of pnjShares(c,events))if(sh.montant){by[sh.nature]=(by[sh.nature]||0)+sh.montant;t+=sh.montant;}return{by,total:t};}
function spent(c){return (c.achats||[]).reduce((s,a)=>s+(a.cout||0),0);}
function planItems(c){const out=[];for(const key of Object.keys(c.plan||{})){const to=c.plan[key];const r=ref(c,key);if(!r)continue;const cur=r.o.cur||0;if(to>cur)out.push({key,nom:r.nom,kind:r.kind,from:cur,to,cost:cum(r.kind,cur,to)});}return out;}
function summary(c,events){const g=gainsOf(c,events).total,d=spent(c),dispo=g-d,pl=planItems(c),prevu=pl.reduce((s,x)=>s+x.cost,0);return{gains:g,spent:d,dispo,prevu,manque:Math.max(0,prevu-dispo),plan:pl};}
function bestOf(c,kind,keys,label,target){
  let best=0,cheap=null;
  for(const k of keys){const r=ref(c,k);if(!r||(kind==='comp'&&(r.max||0)<PALIER_MAX))continue;const cur=r.o.cur||0;best=Math.max(best,cur);if(cur>=target||r.max<target)continue;const cost=cum(kind,cur,target);if(!cheap||cost<cheap.cost)cheap={cost,nom:r.nom};}
  if(best>=target)return{label,cur:best,target,cost:0,via:null,blocked:false};
  return{label,cur:best,target,cost:cheap?cheap.cost:null,via:cheap?cheap.nom:null,blocked:!cheap};
}
function gaugesFor(c,st){
  const f=c.feerie,a=c.atout,ck=[];for(const p of c.profils||[])for(const x of p.comps||[])ck.push('comp:'+x.nom);
  return [
    {label:'Féerie',cur:f.cur,target:st.feerie,cost:f.cur>=st.feerie?0:cum('feerie',f.cur,st.feerie),via:null,blocked:f.max<st.feerie},
    bestOf(c,'carac',CARACS.map(n=>'carac:'+n),'Une caractéristique',st.carac),
    bestOf(c,'comp',ck,'Une compétence',st.comp),
    {label:'Atouts féeriques',cur:a.cur,target:st.atout,cost:a.cur>=st.atout?0:cum('atout',a.cur,st.atout),via:null,blocked:false}
  ];
}
function paliers(c){
  if(c.type!=='PJ')return null;
  for(const st of STAGES){const gs=gaugesFor(c,st);const ok=gs.every(g=>g.cost===0&&g.cur>=g.target);
    if(!ok)return{stage:st.nom,gauges:gs,total:gs.reduce((s,g)=>s+(g.cost||0),0),done:false,blocked:gs.some(g=>g.blocked)};}
  return{stage:'Légendaire',gauges:[],total:0,done:true,blocked:false};
}
const clone=o=>JSON.parse(JSON.stringify(o));
const AUTRES=['Domaine','Triche','PNJ'];
function autreTotal(c,nom){return (c.achats||[]).filter(a=>a.key==='autre:'+nom).reduce((s,a)=>s+(a.cout||0),0);}
function lastAutre(c,nom){const A=c.achats||[];for(let i=A.length-1;i>=0;i--)if(A[i].key==='autre:'+nom)return A[i];return null;}
function spendAutre(c,nom,pts,today){const n=clone(c);n.achats=n.achats||[];n.achats.push({id:'a'+Date.now().toString(36)+Math.floor(Math.random()*1e3),date:today,label:'Dépense · '+nom,cout:pts,key:'autre:'+nom});return n;}
function undoAutre(c,nom){const a=lastAutre(c,nom);if(!a)return null;const n=clone(c);n.achats=n.achats.filter(x=>x.id!==a.id);return{c:n,refund:a.cout||0};}
/* Fortune : [situation, revenu annuel, argent de poche, argent disponible par mois, modificateur Classe/Entregent] */
const FORTUNE=[['Invivable','moins de 300',5,50,-2],['Pauvre','500 à 800',15,150,-1],['Modeste','900 à 1 800',30,250,-1],['Moyenne','2 000 à 4 000',60,500,-1],['Aisée','5 000 à 8 000',100,750,0],['Confortable','9 000 à 12 000',200,1500,0],['À l\'abri','13 000 à 16 000',300,2500,0],['Opulente','16 000 à 20 000',400,4000,1],['Riche','21 000 à 30 000',600,6000,1],['Prospère','31 000 à 50 000',800,8000,1],['Florissante','51 000 à 75 000',1000,10000,1],['Fastueuse','76 000 à 100 000',2000,20000,2],['Richissime','110 000 à 150 000',3000,30000,2],['Scandaleuse','151 000 à 199 000',4000,40000,2],['Royale','200 000 à 250 000',5000,60000,2],['Inimaginable','250 000 et plus',7000,80000,3]];
const frs=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'\u202f')+'\u00a0F';
/* Spécialités possibles par compétence : [nom, caractéristiques, obligatoire] */
const CATSPEC={
 'Conduite':[['Équitation','AGI',1],["Conduite d'attelage",'AGI',1],["Conduite d'automobile",'PRÉC',1],['Navigation','PRÉC/PER',1],["Pilotage d'aéronefs",'PRÉC/PER',1]],
 'Ressort':[['Courage','SAN'],['Endurer','CON'],['Épreuves de force','FOR'],['Escalader','AGI'],['Lancer','PRÉC/FOR']],
 'Mouvement':[['Acrobatie','AGI',1],['Course','AGI/FOR/CON'],['Esquive','AGI'],['Nage','AGI/FOR/CON',1],['Vol','AGI']],
 'Survie':[['Chasse','PER'],['Vigilance','PER'],['Faune et flore','PER/ESP'],['Orientation','PER'],['Premiers soins','PRÉC']],
 'Art de la guerre':[['Embuscade','PER'],['Évaluer forces et faiblesses','PER/ESP'],['Initiative','SAN'],['Stratégie','ESP']],
 'Autorité':[['Commander','FOR/PRES'],['Hiérarchie','ESP'],['Intimider','FOR/PRES/SAN']],
 'Mêlée':[['Armes blanches légères','AGI/FOR'],['Armes blanches lourdes','AGI/FOR',1],['Armes naturelles','AGI/FOR'],['Fouet','AGI/FOR'],['Mauvaise main','AGI/FOR',1]],
 'Tir':[["Armes d'épaule",'PRÉC'],['Armes de poing','PRÉC'],['Armes à feu lourdes','PRÉC',1],['Armes de trait','PRÉC',1],['Mauvaise main','PRÉC',1]],
 'Culture':[['Archéologie','ESP'],["Connaissance d'Avalon",'ESP/PER',1],['Folklore féerique','ESP'],['Culture générale','ESP'],['Langue : ','ESP/PRES']],
 'Fortitude':[['Concentration','ESP'],['Contrer la magie','ESP'],['Maîtrise de soi','SAN'],['Résistance psychique','ESP']],
 'Occultisme':[['Connaissance du druidisme','ESP',1],['Connaissance de la faëomancie','ESP',1],['Connaissance de la nécromancie','ESP',1],['Connaissance de la théurgie','ESP',1],['Sciences occultes','ESP'],['Sixième sens','PER'],['Spiritisme','ESP/SAN',1]],
 'Rhétorique':[['Conversation','ESP/PRES'],['Diplomatie','ESP/PRES'],['Droit','ESP',1],['Orateur','PRES'],['Pédagogie','ESP/PRES'],['Persuader','ESP']],
 'Classe':[['Aplomb','PRES/SAN'],['Argent','ESP'],['Élégance','PRES'],['Étiquette','ESP'],['Flegme','PRES']],
 'Entregent':[['Beau monde','ESP'],['Bourgeoisie','ESP'],['Prolétariat','ESP'],['Campagne','ESP'],['Ville','ESP'],['Crédit','PRES'],['Politique','ESP']],
 'Séduction':[['Charmer','PRES/ESP'],['Appâts','PRES'],['Sympathie','PRES/ESP']],
 'Sensibilité':[['Intuition','PER'],['Inspiration','ESP'],['Psychologie','ESP/PER']],
 'Comédie':[['Déguisement','PRÉC'],['Jouer un rôle','PRES/SAN'],['Marchandage','PRES/ESP'],['Mentir','PRES/SAN']],
 'Discrétion':[['Anonymat','SAN'],['Camouflage','SAN'],['Déplacement silencieux','AGI'],["Dissimulation d'objets et d'armes",'PRÉC'],['Furtivité','AGI']],
 'Larçin':[['Crochetage','PRÉC'],['Trouver ce qui est caché','PER/ESP'],['Pièges','PER/PRÉC',1],['Pickpocket','PRÉC'],['Triche','PRÉC']],
 'Monde du crime':[['Assassinat','AGI/PRÉC/PER/ESP',1],['Connaissance de la pègre','ESP'],['Corruption','ESP/PRES'],['Faussaire','PRÉC',1]],
 'Habiletés':[['Artisanat','PRÉC',1],['Ingéniosité','ESP/PER'],['Explosifs','PRÉC/SAN',1],['Mécanique','PRÉC'],['Moyen improvisé','PER/AGI']],
 'Médecine':[['Autopsie','PRÉC/ESP',1],['Chirurgie','PRÉC',1],['Pharmacopée','ESP/PER',1],['Premiers soins','PRÉC']],
 'Observations':[['Examen','PER/ESP'],['Investigation','PER'],['Sociologie','ESP']],
 'Sciences':[['Analyse et déduction','ESP'],['Biologie','ESP'],['Faëologie','ESP/PER'],['Finance','ESP',1],['Invention','ESP/PRÉC',1],['Physique-chimie','ESP/PRÉC']]};
const LANGS=['anglais','allemand','celte','espagnol','flamand','italien','portugais','russe','arabe','berbere','hebreu','yiddish','turc','hindi','chinois','japonais','latin','grec ancien','grec','arameen','sanskrit','argot'];
const SPALIAS={'mensonge':'Mentir','arme a deux mains':'Armes blanches lourdes','armes a deux mains':'Armes blanches lourdes','epreuve de force':'Épreuves de force'};
const nrm=t=>(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
const nrmS=t=>nrm(t).split(' ').map(w=>w.length>3?w.replace(/s$/,''):w).join(' ');
/* Compétence (nom de l'appli) correspondant à un nom de spécialité, ou null */
function specComp(nom){const k=nrmS(SPALIAS[nrm(nom)]||nom);if(LANGS.includes(nrm(nom))||/^langue/.test(nrm(nom)))return 'Culture';
  for(const [c,l] of Object.entries(CATSPEC))for(const x of l)if(x[0]!=='Langue : '&&nrmS(x[0])===k)return c;return null;}
function specInfo(nom){const k=nrmS(SPALIAS[nrm(nom)]||nom);for(const l of Object.values(CATSPEC))for(const x of l)if(nrmS(x[0])===k)return x;if(LANGS.includes(nrm(nom))||/^langue/.test(nrm(nom)))return ['Langue','ESP/PRES'];return null;}
const specCost=(key,nom)=>key.startsWith('fut:')?RULES.specFut:nrm(nom)==='mauvaise main'?RULES.mauvaiseMain:RULES.spec;
/* Catalogue proposé pour une cible : compétence, profil de PNJ (union de ses compétences) ou futile (aucun) */
function specCatalog(key,c){if(key.startsWith('comp:')){const l=CATSPEC[key.slice(5)]||[];return c&&c.race==='Fouinard'&&key==='comp:Conduite'?l.concat([['Tous véhicules à moteur','PRÉC',1]]):l;}if(key.startsWith('prof:'))return (PROFCOMPS[key.slice(5)]||[]).flatMap(c=>CATSPEC[c]||[]);return [];}
function specsOf(c){return Array.isArray(c.specs)?c.specs:[];}
const specAnon=c=>Math.max(0,(c.spec&&c.spec.cur||0)-specsOf(c).length);
const specToAttach=c=>specAnon(c)+specsOf(c).filter(x=>!x.cible).length;
/* Reprise : rattache les spécialités déjà nommées quand le nom correspond au livre */
function migrateSpecs(c){if(Array.isArray(c.specs))return c;const seen=new Set(),out=[];
  for(const nom of nameList(c,'spec')){const k=nrm(nom);if(!nom||seen.has(k))continue;seen.add(k);const comp=specComp(nom);let cible=null;
    if(comp){if(c.type==='PNJ'){const pr=(c.profils||[]).find(p=>(PROFCOMPS[p.nom]||[]).includes(comp));if(pr)cible='prof:'+pr.nom;}else if(ref(c,'comp:'+comp))cible='comp:'+comp;}
    out.push({nom,cible});}
  c.specs=out;if(c.spec&&(c.spec.cur||0)<out.length)c.spec.cur=out.length;return c;}
/* Référentiel des races : données maîtresses dans meta/races (byId, clé = id de créature), amorcées depuis le tableur « Synthèse des races » */
const CARCOL=['Agilité','Constitution','Force','Précision','Esprit','Perception','Prestance','Sang Froid'];
const COMPS_ALL=['Conduite','Mouvement','Ressort','Survie','Art de la guerre','Autorité','Mêlée','Tir','Culture','Fortitude','Occultisme','Rhétorique','Classe','Entregent','Séduction','Sensibilité','Comédie','Larçin','Discrétion','Monde du crime','Habiletés','Médecine','Observations','Sciences'];
/* Structures dérivées (clé = nom de race au singulier) */
let RACES={},CARMAX={},PRED={},PREDFUT={},ACCRU={};
/* Spécialités de prédilection (colonnes T et U du tableau des races) : [nom, compétence, note] */
for(const k in SP_SEED)if(RACE_SEED[k])Object.assign(RACE_SEED[k],SP_SEED[k]);
for(const k in RACE_DOC)if(RACE_SEED[k])Object.assign(RACE_SEED[k],JSON.parse(JSON.stringify(RACE_DOC[k])));
/* Humain : réservé aux PNJ, hors féerie (caracs 1 à 6, profils et compétences max 6) */
const HUMAIN='Humain',HUM_ID='humain',HUM_SEED={sing:HUMAIN,hum:true,car:Object.fromEntries(CARCOL.map(k=>[k,[1,6]]))};
const humRec=()=>(S.racesReady&&S.races&&S.races[HUM_ID])||HUM_SEED;
const isHum=c=>!!c&&c.type==='PNJ'&&c.race===HUMAIN;
const humCar=nom=>{const x=humRec().car||{};return x[nom]||[1,6];};
const singOf=n=>(n||'').split(' ').map(w=>w.length>3&&/s$/.test(w)&&!/x$/.test(w)?w.slice(0,-1):w).join(' ').replace(/s-/g,'-');
function raceRules(){return S.racesReady&&S.races?S.races:RACE_SEED;}
function raceCres(){return S.creaturesReady?S.creatures:CREATURES_SEED;}
function raceRec(cr){const x=raceRules()[cr.id];return x||{sing:singOf(cr.nom),car:null,acc:[],pred:[],fut:[],at:[],typ:[],sp:[],spf:[],cap:[],choix:[],av:[],dv:[],pw:{m:[],d:[],p:'',l:''}};}
/* Caractéristiques accrues possibles = options « accrue » du choix définitif (à défaut, l'ancienne liste) */
const accOf=x=>{const c=(x&&x.choix)||[];return c.length?c.filter(o=>o[0]==='acc').map(o=>o[1]):((x&&x.acc)||[]);};
/* Pouvoirs : 4 masqués, 2 démasqués, 1 profond, 1 légendaire ; '?' = inconnu en jeu */
const PWN={m:4,d:2};
const pwSlots=x=>{const p=(x&&x.pw)||{};return [...Array(4)].map((_,i)=>(p.m||[])[i]||'').concat([...Array(2)].map((_,i)=>(p.d||[])[i]||''),[p.p||'',p.l||'']);};
const pwCat=id=>(S.pouvoirs&&S.pouvoirs[id])||POUVOIRS_SEED[id]||{nom:id};
const pwName=id=>id==='?'?'Inconnu':!id?'':pwCat(id).nom;
/* Précision propre à la race (ex. Communication (animale)) ; obligatoire pour un pouvoir du catalogue marqué « prec » */
const pwPrec=(x,i)=>((x&&x.pwq)||[])[i]||'';
const pwFull=(x,i)=>{const id=pwSlots(x)[i];if(!id||id==='?')return pwName(id);const q=pwPrec(x,i);return pwName(id)+(q?' ('+q+')':pwCat(id).prec?' (précision à compléter)':'');};
const carOk=x=>!!(x&&x.car&&CARCOL.every(k=>x.car[k]&&x.car[k][0]!==''&&x.car[k][0]!=null&&x.car[k][1]!==''&&x.car[k][1]!=null));
function rebuildRaces(){RACES={};CARMAX={};PRED={};PREDFUT={};ACCRU={};
  for(const cr of raceCres()){const x=raceRec(cr),n=x.sing;if(!n)continue;
    RACES[n]={a:(x.at||[]).filter(a=>a&&a[0]),t:(x.typ||[]).filter(t=>t&&t[0]&&t[1]),sp:(x.sp||[]).filter(e=>e&&e[0]),spf:(x.spf||[]).filter(e=>e&&e[0]),cre:cr.id};
    if(carOk(x))CARMAX[n]=CARCOL.map(k=>[+x.car[k][0]||0,+x.car[k][1]]);
    if((x.pred||[]).length)PRED[n]=x.pred;if((x.fut||[]).length)PREDFUT[n]=x.fut;const ac=accOf(x);if(ac.length)ACCRU[n]=ac;}}
function raceBlocks(x){x=x||{};return [['Caractéristiques',carOk(x)],['Capacités naturelles et choix définitif',(x.cap||[]).length>0&&(x.choix||[]).length>0],['Avantages et désavantages',(x.av||[]).length>0&&(x.dv||[]).length>0],['Compétences utiles de prédilection',(x.pred||[]).length>0],['Compétences futiles de prédilection',(x.fut||[]).length>0],['Atouts féeriques',(x.at||[]).some(a=>a&&a[0])],['Spécialités typiques',(x.typ||[]).filter(t=>t&&t[0]).length>=2],['Pouvoirs',pwSlots(x).every(v=>v)]];}
function raceStatus(cr,x){const b=raceBlocks(x),n=b.filter(v=>v[1]).length;if(cr&&cr.done&&n<b.length)return 'todo';return n===0?'no':n===b.length?'ok':'mid';}
/* Mise en place ponctuelle : capacités, choix définitif, avantages, désavantages et pouvoirs repris du doc « Fiches de race » ;
   pour une race découverte, un pouvoir absent du doc devient « Inconnu » */
function fixRaceDoc(){if(!S.racesReady||!S.creaturesReady||!S.pouvoirsReady||!S.races)return;let ch=false;
  for(const k in RACE_DOC){const r=S.races[k];if(!r||r.doc)continue;const d=clone(RACE_DOC[k]),cr=S.creatures.find(c=>c.id===k);
    if(cr&&cr.done){while(d.pw.m.length<4)d.pw.m.push('?');while(d.pw.d.length<2)d.pw.d.push('?');if(!d.pw.p)d.pw.p='?';if(!d.pw.l)d.pw.l='?';}
    const ac=accOf(d);S.races={...S.races,[k]:{...r,...d,acc:ac.length?ac:(r.acc||[]),doc:1}};ch=true;}
  if(ch){persist('meta/races',{byId:S.races});rebuildRaces();render();}}
const RST={no:'Vide',mid:'Partielle',ok:'Remplie',todo:'À compléter'};
const playedBy=sing=>Object.values(S.chars).filter(c=>c.type==='PJ'&&c.race&&c.race===sing);
/* Résout les choix « X ou Y » : choix enregistré sur le personnage, sinon d'après la fiche (max 7, sinon présent, sinon le premier) */
function predGuess(list,items){return (list||[]).filter(Array.isArray).map(e=>{const has=n=>items.find(x=>nrm(x.nom)===nrm(n));const m7=e.find(n=>{const x=has(n);return x&&(x.max||0)>=7;});return [e.join('|'),m7||e.find(n=>has(n))||e[0]];});}
function predOf(c,list,items){const has=n=>items.find(x=>nrm(x.nom)===nrm(n));return (list||[]).map(e=>{if(!Array.isArray(e))return e;const k=e.join('|');if(c.choix&&c.choix[k])return c.choix[k];const m7=e.find(n=>{const x=has(n);return x&&(x.max||0)>=7;});return m7||e.find(n=>has(n))||e[0];}).map(nrm);}
function maxFor(c,kind,nom,o){if(isHum(c)){if(kind==='carac'){const v=humCar(nom)[1];return v===''||v==null?o.max:+v;}return kind==='comp'||kind==='prof'?6:o.max;}
  if(c.type!=='PJ')return o.max;
  if(kind==='carac'){const t=CARMAX[c.race];const i=CARCOL.indexOf(nom);if(!(t&&i>=0))return o.max;let m=t[i][1];if(c.ajust){if(c.ajust.moins===nom)m--;if(c.ajust.plus===nom)m++;}return m;}
  if(kind==='comp'){if(!PRED[c.race])return o.max;const all=(c.profils||[]).flatMap(p=>p.comps||[]);return predOf(c,PRED[c.race],all).includes(nrm(nom))?7:6;}
  if(kind==='fut'){if(!PREDFUT[c.race])return o.max;return predOf(c,PREDFUT[c.race],c.futiles||[]).includes(nrm(nom))?7:6;}
  return o.max;}
const minFor=(c,nom)=>{if(isHum(c)){const v=humCar(nom)[0];return v===''||v==null?1:+v;}const t=CARMAX[c.race],i=CARCOL.indexOf(nom);return t&&i>=0?t[i][0]:0;};
/* Mise en place ponctuelle du référentiel : choix « X ou Y » figés, ajustement de Masse Toc, coquille « Astronimie » de Maral */
function fixRef(){for(const c0 of Object.values(S.chars)){if(c0.type!=='PJ'||c0.refFix||!c0.race)continue;const c=clone(c0);
    if(c.id==='maral')for(const f of c.futiles||[])if(f.nom==='Astronimie')f.nom='Astronomie';
    c.choix={...(c.choix||{})};const all=(c.profils||[]).flatMap(p=>p.comps||[]);
    for(const [k,v] of predGuess(PRED[c.race],all))if(!c.choix[k])c.choix[k]=v;
    for(const [k,v] of predGuess(PREDFUT[c.race],c.futiles||[]))if(!c.choix[k])c.choix[k]=v;
    if(c.id==='massetoc'&&!c.ajust)c.ajust={moins:'Constitution',plus:'Esprit'};
    c.refFix=true;saveChar(c);}}
/* Mise en place ponctuelle : Ismaël et Anselme sont humains ; Ismaël reçoit Équitation (offerte, rattachée à Aventurier) */
function fixHumain(){for(const id of ['ismael','anselme']){const c0=S.chars[id];if(!c0||c0.type!=='PNJ'||c0.humFix)continue;const c=clone(c0);if(!c.race)c.race=HUMAIN;
    if(id==='ismael'){c.spec=c.spec||{cur:0};c.specs=specsOf(c).slice();if(!c.specs.some(x=>nrmS(x.nom)==='equitation')){c.specs.push({nom:'Équitation',cible:'prof:Aventurier',offert:true});c.spec.cur=(c.spec.cur||0)+1;}}
    c.humFix=true;saveChar(c);}}
/* Création d'un PJ : au premier choix de race, ajoute gratuitement ses spécialités de prédilection */
function grantPredSp(c){c.spPred=true;const r=RACES[c.race];if(!r)return c;c.spec=c.spec||{cur:0};c.specs=specsOf(c).slice();c.achats=c.achats||[];
  const add=(nom,cible)=>{const from=c.spec.cur||0,id='a'+Date.now().toString(36)+Math.floor(Math.random()*1e6),choix=/au choix/i.test(nom);c.spec.cur=from+1;
    c.achats.push({id,date:today(),label:`Spécialité (${choix?nom+' : à préciser':nom}) · offerte (prédilection de race)`,cout:0,key:'spec',from,to:from+1});
    if(!choix)c.specs.push({nom,cible,achat:id,pred:1});};
  for(const [nom,comp] of r.sp||[])add(nom,'comp:'+comp);
  for(const [nom] of r.spf||[])add(nom,null);
  return c;}
const RACE0={kerian:'Elfe',massetoc:'Troll',sloan:'Fleur de métal',theodule:'Fouinard',rowen:'Bastet',maral:'Djinn'};
const TYP='Spécialités typiques';
const nrmA=t=>nrmS(t).replace(/y/g,'i').replace(/-/g,' ').replace(/\s+/g,' ');
const isTyp=n=>/^(spe|specialite)\.? ?typique/.test(nrm(n).replace(/s /g,' ').replace(/s$/,''));
function raceList(c){const r=RACES[c.race];return r?r.a.map(x=>x[0]).concat([TYP]):[TYP];}
function atoutsOf(c){return Array.isArray(c.atouts)?c.atouts:[];}
const atoutAnon=c=>Math.max(0,(c.atout&&c.atout.cur||0)-atoutsOf(c).length);
function atoutListed(c){const rl=raceList(c).map(nrmA);return rl.length+atoutsOf(c).filter(x=>!(isTyp(x.nom)&&rl.includes(nrmA(TYP)))&&!rl.includes(nrmA(x.nom))).length;}
function migrateAtouts(c){if(c.type!=='PJ')return c;if(!c.race&&RACE0[c.id])c.race=RACE0[c.id];if(Array.isArray(c.atouts))return c;const seen=new Set(),out=[];
  for(const nom of nameList(c,'atout')){const k=nrmA(nom);if(!nom||seen.has(k))continue;seen.add(k);out.push({nom:isTyp(nom)?TYP:(RACES[c.race]&&RACES[c.race].a.find(x=>nrmA(x[0])===k)||[nom])[0]});}
  c.atouts=out;if(c.atout&&(c.atout.cur||0)<out.length)c.atout.cur=out.length;return c;}
/* Spécialités typiques : à l'acquisition, ajoute les deux spécialités de la race (ou 2 à rattacher si la race n'en a pas) */
function grantTyp(n,entry){const r=RACES[n.race];n.spec=n.spec||{cur:0};n.specs=specsOf(n).slice();entry.typ=[];
  if(r&&r.t&&r.t.length){for(const [sp,comp] of r.t){if(n.specs.some(x=>nrmS(x.nom)===nrmS(sp)))continue;n.specs.push({nom:sp,cible:'comp:'+comp,offert:true,typ:1});n.spec.cur=(n.spec.cur||0)+1;entry.typ.push(sp);}}
  else{n.spec.cur=(n.spec.cur||0)+2;entry.typAnon=2;}}
function revokeTyp(n,entry){if(!entry)return;n.specs=specsOf(n).slice();for(const sp of entry.typ||[]){const i=n.specs.findIndex(x=>x.typ&&nrmS(x.nom)===nrmS(sp));if(i>=0){const ac=n.specs[i].achat;if(ac&&n.achats)n.achats=n.achats.filter(x=>x.id!==ac);n.specs.splice(i,1);n.spec.cur=Math.max(0,(n.spec.cur||0)-1);}}
  if(entry.typAnon)n.spec.cur=Math.max(n.specs.length,(n.spec.cur||0)-entry.typAnon);}
/* Correction ponctuelle (16/11/2026) : Kerian avait l'atout Spécialités typiques sans ses deux spécialités d'elfe */
function fixTypKerian(){const c0=S.chars.kerian;if(!c0||c0.fixTypK||c0.race!=='Elfe')return;const e0=atoutsOf(c0).find(x=>isTyp(x.nom));if(!e0)return;
  const c=clone(c0);c.spec=c.spec||{cur:0};c.specs=specsOf(c).slice();c.achats=c.achats||[];const e=c.atouts.find(x=>isTyp(x.nom));e.typ=e.typ||[];
  for(const [sp,comp] of RACES.Elfe.t){if(c.specs.some(x=>nrmS(x.nom)===nrmS(sp)))continue;const from=c.spec.cur||0,id='a'+Date.now().toString(36)+Math.floor(Math.random()*1e3)+sp.length;c.spec.cur=from+1;
    c.achats.push({id,date:today(),label:`Spécialité (${sp}) · offerte par Spécialités typiques`,cout:0,key:'spec',from,to:from+1});c.specs.push({nom:sp,cible:'comp:'+comp,achat:id,typ:1});e.typ.push(sp);}
  c.fixTypK=true;saveChar(c);}
/* Remise à plat ponctuelle (16/11/2026) : ne garder, en nombre et en nom, que les spécialités et atouts présents dans l'historique des achats */
function fromJournal(c,re){const named=[];let anon=0;for(const a of c.achats||[]){const l=(a.label||'').trim();if(!re.test(l))continue;const m=/\(([^)]*)\)/.exec(l);
    if(m&&/^\s*\d+\s*(→|->)\s*\d+\s*$/.test(m[1])){const [x,y]=m[1].split(/→|->/).map(v=>+v);anon+=Math.max(0,y-x);}else if(m&&m[1].trim())named.push({nom:m[1].trim(),achat:a.id});else anon+=1;}
  return{named,anon};}
function renameVM(){for(const c0 of Object.values(S.chars)){if(c0.race!=='Fouinard')continue;const sl=specsOf(c0);const i=sl.findIndex(x=>/^vehicules? a moteur$/.test(nrm(x.nom)));if(i<0)continue;
    const c=clone(c0);c.specs=sl.slice();c.specs[i]={...c.specs[i],nom:'Tous véhicules à moteur'};const ac=c.specs[i].achat&&(c.achats||[]).find(x=>x.id===c.specs[i].achat);if(ac)ac.label='Spécialité (Tous véhicules à moteur)';saveChar(c);}}
function resetSA(){for(const c0 of Object.values(S.chars)){if(c0.resetSA)continue;const c=clone(c0);
    const sp=fromJournal(c,/^sp[ée]cialit[ée]s?(?=\s|\(|$)/i);c.specs=sp.named.map(x=>({nom:x.nom,cible:null,achat:x.achat}));c.spec={...(c.spec||{}),cur:sp.named.length+sp.anon};
    if(c.type==='PJ'){const at=fromJournal(c,/^atouts?\s+f[ée]eriques?(?=\s|\(|$)/i),rl=RACES[c.race]?RACES[c.race].a:[];
      c.atouts=at.named.map(x=>({nom:isTyp(x.nom)?TYP:((rl.find(r=>nrmA(r[0])===nrmA(x.nom))||[x.nom])[0]),achat:x.achat}));c.atout={...(c.atout||{}),cur:at.named.length+at.anon};}
    c.noms={...(c.noms||{}),spec:[],atout:[]};c.resetSA=true;saveChar(c);}}
function buyAtout(c,nom,today){const n=clone(c);n.atout=n.atout||{cur:0};const from=n.atout.cur||0;n.atout.cur=from+1;const id='a'+Date.now().toString(36)+Math.floor(Math.random()*1e3);
  n.achats=n.achats||[];n.achats.push({id,date:today,label:`Atout féerique (${nom})`,cout:RULES.atout,key:'atout',from,to:from+1});const e={nom,achat:id};if(nom===TYP)grantTyp(n,e);n.atouts=[...atoutsOf(n),e];return n;}
/* Points de personnage : atteindre le rang N d'un profil ajoute N PP (à partir de maintenant) */
const tri=r=>r*(r+1)/2;
function ppSync(before,n){if(n.type!=='PJ')return n;for(const p of n.profils||[]){const o=(before.profils||[]).find(x=>x.nom===p.nom);if(!o)continue;const r0=rankOf(before,o),r1=rankOf(n,p);if(r0===r1)continue;
  const v=p.note==null||p.note===''?0:+p.note;if(isNaN(v))continue;p.note=v+(tri(r1)-tri(r0));}return n;}
const ppFmt=v=>String(v).replace('.',',');
const NOMRE=/^\s*(atouts?\s+f[ée]eriques?|sp[ée]cialit[ée]s?)\s*\((.+)\)\s*$/i;
function nameList(c,kind){const out=[];for(const a of c.achats||[]){const m=NOMRE.exec(a.label||'');if(!m)continue;const k=/^atout/i.test(m[1])?'atout':'spec';const n=m[2].trim();if(k!==kind||/^\d+\s*(→|->)\s*\d+$/.test(n))continue;out.push(n);}return out.concat((c.noms&&c.noms[kind])||[]);}
function normNoms(c){for(const k of ['atout','spec']){if(c[k]){const n=nameList(c,k).length;if((c[k].cur||0)<n)c[k].cur=n;}}return migrateAtouts(migrateSpecs(c));}
function buy(c,key,to,today,nom){
  const n=clone(c),r=ref(n,key),from=r.o.cur||0,cost=cum(r.kind,from,to);r.o.cur=to;
  const label=nom?(r.kind==='atout'?`Atout féerique (${nom})`:`Spécialité (${nom})`):(r.kind==='atout'||r.kind==='spec')?`${r.nom} (${from}→${to})`:`${r.nom} ${to}`;
  const aid='a'+Date.now().toString(36)+Math.floor(Math.random()*1e3);n.achats=n.achats||[];n.achats.push({id:aid,date:today,label,cout:cost,key,from,to});
  if(nom&&r.kind==='spec')n.specs=[...specsOf(n),{nom,cible:null,achat:aid}];
  if(nom&&r.kind==='atout'&&n.type==='PJ'){const nm=isTyp(nom)?TYP:nom,e={nom:nm,achat:aid};if(nm===TYP)grantTyp(n,e);n.atouts=[...atoutsOf(n),e];}
  if(n.plan&&n.plan[key]!==undefined&&n.plan[key]<=to)delete n.plan[key];
  return ppSync(c,n);
}
function buySpec(c,key,nom,cost,today){const n=clone(c);n.spec=n.spec||{cur:0};const from=n.spec.cur||0;n.spec.cur=from+1;const id='a'+Date.now().toString(36)+Math.floor(Math.random()*1e3);
  n.achats=n.achats||[];n.achats.push({id,date:today,label:`Spécialité (${nom})`,cout:cost,key:'spec',from,to:from+1});n.specs=[...specsOf(n),{nom,cible:key,achat:id}];return n;}
function canUndo(c,a){if(!a||!a.key)return false;const r=ref(c,a.key);return !!r&&(r.o.cur||0)===a.to;}
function lastBuy(c,key){const r=ref(c,key);if(!r)return null;const cur=r.o.cur||0;const A=c.achats||[];
  if(r.kind==='atout'||r.kind==='spec'){if(cur<1)return null;for(let i=A.length-1;i>=0;i--)if(A[i].key===key&&A[i].from<A[i].to)return A[i];return null;}
 for(let i=A.length-1;i>=0;i--){const a=A[i];if(a.key===key&&a.to===cur&&a.from<cur)return a;}return null;}
function undoLevel(c,key){const a=lastBuy(c,key);if(!a)return null;const n=clone(c),r=ref(n,key),cur=r.o.cur||0,na=n.achats.find(x=>x.id===a.id);let refund;
  if(a.to-a.from<=1){refund=na.cout||0;n.achats=n.achats.filter(x=>x.id!==a.id);}
  else{refund=Math.min(na.cout||0,lvlCost(r.kind,cur));na.cout=(na.cout||0)-refund;na.to=cur-1;na.label=(r.kind==='atout'||r.kind==='spec')?`${r.nom} (${na.from}→${na.to})`:`${r.nom} ${na.to}`;}
  r.o.cur=cur-1;if(r.kind==='spec'&&Array.isArray(n.specs))n.specs=n.specs.filter(x=>x.achat!==a.id);if(r.kind==='atout'&&Array.isArray(n.atouts)){const e=n.atouts.find(x=>x.achat===a.id);if(e){revokeTyp(n,e);n.atouts=n.atouts.filter(x=>x!==e);}}return{c:ppSync(c,n),refund,from:cur,to:cur-1};}
function undo(c,id){const n=clone(c),a=(n.achats||[]).find(x=>x.id===id);if(!a||!canUndo(n,a))return n;ref(n,a.key).o.cur=a.from;n.achats=n.achats.filter(x=>x.id!==id);return ppSync(c,n);}

function cancelAchat(c,id){const n=clone(c),a=(n.achats||[]).find(x=>x.id===id);if(!a)return{c:n,reverted:false};let rev=false;if(a.key){const r=ref(n,a.key);if(r&&(r.kind==='atout'||r.kind==='spec')){if((r.o.cur||0)>0){r.o.cur=r.o.cur-1;rev=true;}}else if(r&&(r.o.cur||0)===a.to){r.o.cur=a.from;rev=true;}}if(a.key==='spec'&&Array.isArray(n.specs))n.specs=n.specs.filter(x=>x.achat!==id);
  if(a.key==='atout'&&Array.isArray(n.atouts)){const e=n.atouts.find(x=>x.achat===id);if(e){revokeTyp(n,e);n.atouts=n.atouts.filter(x=>x!==e);}}
  if((a.key||'').startsWith('pp:')){const p=(n.profils||[]).find(x=>x.nom===a.key.slice(3));if(p){const v=p.note==null||p.note===''?0:+p.note;if(!isNaN(v))p.note=v+(+a.pp||0);}rev=true;}
  n.achats=n.achats.filter(x=>x.id!==id);return{c:ppSync(c,n),reverted:rev};}
function editAchat(c,id,p){const n=clone(c),a=(n.achats||[]).find(x=>x.id===id);if(a){if(p.label!==undefined)a.label=p.label;if(p.cout!==undefined)a.cout=p.cout;if(p.date!==undefined)a.date=p.date||null;}return n;}
/* Rattrapage : XP à attribuer pour rejoindre le PJ juste devant (parmi ceux comptés dans la moyenne) */
function rattrapage(rows,r){const up=rows.filter(x=>(x.c.statut||'actif')==='actif'&&!x.c.cache&&!x.c.horsMoyenne&&x.total>r.total).sort((a,b)=>a.total-b.total)[0];return up?{c:up.c,total:up.total,montant:up.total-r.total}:null;}
function gainsTable(list,events){
  const part=list.filter(c=>(c.statut||'actif')==='actif'&&!c.cache&&!c.horsMoyenne);
  const avg=part.length?part.reduce((s,c)=>s+gainsOf(c,events).total,0)/part.length:0;
  return{avg,rows:list.map(c=>{const g=gainsOf(c,events),act=(c.statut||'actif')==='actif'&&!c.horsMoyenne;return{c,total:g.total,by:g.by,delta:g.total-avg,alert:act&&avg>0&&g.total<=avg-GAP};})};
}
function newChar(id,court,nom,type){
  const caracs=Object.fromEntries(CARACS.map(n=>[n,{max:6,cur:1}]));
  const base={id,court,nom:nom||court,type,statut:'actif',carac:caracs,spec:{cur:0},plan:{},achats:[]};
  base.fx=true; /* moteur de bonus actif pour les personnages créés à partir de l'étape 5 */
  if(type==='PNJ'){base.profils=PROFILS.map(n=>({nom:n,max:6,cur:0,subs:[]}));return base;}
  base.feerie={max:8,cur:PRM.fmStart};base.masque={max:9,cur:PRM.fmStart};base.creation=true;base.fortune={max:15,cur:0};base.atout={max:8,cur:0};
  base.profils=PROFILS.map(n=>({nom:n,max:6,note:null,comps:PROFCOMPS[n].map(x=>({nom:x,max:6,cur:0}))}));base.futiles=[];
  return base;
}
function evType(e){if(e.type)return e.type;const t=e.titre||'';if(/^\s*\[\s*int/i.test(t))return 'Interscénario';if(/epilogue/i.test(t))return 'Autre';if(/^\s*S\.?\s*\d/i.test(t))return 'Scénario';return 'Autre';}
function scenarioCount(events){return events.filter(e=>evType(e)==='Scénario').length;}
function starCount(events,delta){return Math.max(0,Math.min(STARS,scenarioCount(events)+(delta||0)));}
/*ENDENGINE*/


/* ---------- Yeux (visibilité) des fiches de race ----------
   eye = {fiche, car, cap, av, dv, pred, fut, at, typ, sp : bool, pw : [8 bool]} ; fermé = visible par la gestion seulement.
   Fiche complète (+1 XP de groupe) quand tous les yeux sont ouverts. */
const EYE_BLOCKS=[['car','Caractéristiques'],['cap','Capacités naturelles'],['av','Avantages féeriques'],['dv','Désavantages féeriques'],['pred','Compétences utiles de prédilection'],['fut','Compétences futiles de prédilection'],['at','Atouts féeriques'],['typ','Spécialités typiques'],['sp','Spécialités de prédilection']];
const PW_LAB=['Masqué','Masqué','Masqué','Masqué','Démasqué','Démasqué','Profond','Légendaire'];
const eyeAll=v=>{const e={fiche:v,pw:[v,v,v,v,v,v,v,v]};for(const [k] of EYE_BLOCKS)e[k]=v;return e;};
const eyeOf=(cr,x)=>(x&&x.eye)?x.eye:eyeAll(!!(cr&&cr.done));
const eyeFull=e=>!!e.fiche&&EYE_BLOCKS.every(([k])=>e[k])&&[0,1,2,3,4,5,6,7].every(i=>(e.pw||[])[i]);
const eyeCount=e=>{const l=[e.fiche,...EYE_BLOCKS.map(([k])=>e[k]),...[0,1,2,3,4,5,6,7].map(i=>(e.pw||[])[i])];return [l.filter(Boolean).length,l.length];};
/* Le joueur qui joue cette race voit toute la fiche, sauf les pouvoirs profond et légendaire tant qu'ils sont fermés */
const myRace=sing=>!!ME&&!!S.players[ME]&&(S.players[ME].persos||[]).some(id=>S.chars[id]&&S.chars[id].race===sing);
const raceVisible=(cr,x)=>isGest()||eyeOf(cr,x).fiche||myRace(x.sing);
const blockVisible=(cr,x,k)=>isGest()||myRace(x.sing)||(eyeOf(cr,x).fiche&&eyeOf(cr,x)[k]);
/* Pouvoirs : l'œil s'applique à tous, joueur de la race compris (le MJ dévoile le pouvoir choisi) */
const pwVisible=(cr,x,i)=>isGest()||((myRace(x.sing)||eyeOf(cr,x).fiche)&&!!(eyeOf(cr,x).pw||[])[i]);
/* Mise en place ponctuelle : races déjà découvertes = tous les yeux ouverts (sans nouvelle XP), les autres fermés */
function fixEyes(){if(!S.racesReady||!S.creaturesReady||!S.races)return;let ch=false;const R={...S.races};
  for(const cr of S.creatures){const r=R[cr.id];if(r&&!r.eye){R[cr.id]={...r,eye:eyeAll(!!cr.done)};ch=true;}}
  if(ch){S.races=R;persist('meta/races',{byId:R});render();}}
/* Ouvre ou ferme un œil ; k = 'fiche' | bloc | 'pw' (avec i) | 'all'. Gère le passage à « complète » et la ligne d'XP. */
function raceEyeSet(id,k,i,open,sid){
  const cr0=S.creatures.find(c=>c.id===id);if(!cr0)return;const x0=raceRec(cr0),before=eyeOf(cr0,x0),e=clone(before);
  if(k==='all'){Object.assign(e,eyeAll(open));}else if(k==='pw'){e.pw=(e.pw||[]).slice();e.pw[i]=open;}else e[k]=open;
  const wasFull=eyeFull(before),isFull=eyeFull(e);
  const base=S.races[id]||{sing:x0.sing,car:null,acc:[],pred:[],fut:[],at:[],typ:[]};
  S.races={...S.races,[id]:{...base,eye:e}};persist('meta/races',{byId:S.races});
  if(wasFull===isFull){rebuildRaces();render();return;}
  const list=clone(S.creatures),c=list.find(x=>x.id===id);let evs=S.events;
  if(isFull){c.done=true;c.date=today();const t=allPJ();if(t.length){const ne={id:'g'+Date.now().toString(36)+'-c',date:c.date,titre:c.nom+' complété',type:CRE_TYPE,creature:{id},entries:t.map(p=>({perso:p,nature:'Groupe',montant:+PRM.creXP||1}))};if(sid&&sessById(sid))ne.sessionId=sid;evs=[...evs,ne];}}
  else{c.done=false;delete c.date;evs=evs.filter(ev=>!(ev.creature&&ev.creature.id===id));}
  saveCreatures(list);if(evs!==S.events)saveEvents(evs);else render();}
const eyeBtn=(act,attrs,open,label)=>`<button class="eye ${open?'on':'off'}" data-act="${act}" ${attrs} aria-pressed="${!!open}" title="${open?'Visible par toute la table':'Visible seulement par la gestion'}" aria-label="${esc(label)} : ${open?'visible par toute la table':'visible par la gestion seulement'}">${open?EYE_O:EYE_C}</button>`;
const EYE_O='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_C='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
/* ---------- Moteur de bonus : effets des capacités, avantages, désavantages et atouts ----------
   Effet = {t:'perm'|'jet'|'rap', cible, val, txt, quand:'m'|'d'} rangé dans x.fx['type:nom normalisé'].
   Permanent : ajouté à la valeur (seulement pour les personnages créés avec le moteur, c.fx) ; Jet : affiché, non ajouté ; Rappel : texte. */
const FX_T={perm:'Permanent',jet:'Jet',rap:'Rappel'};
/* Masqué = valable sous les deux formes ; démasqué = seulement démasqué (l'ancien « toujours » vaut masqué) */
const fxQ=q=>q==='d'?'d':'m';
const FX_Q={m:'masqué',d:'démasqué',tj:'masqué'};
const FX_DER=['PdV','Esquive','Parade','Résistance physique','Résistance psychique','Initiative','Base mêlée','Base tir'];
const FX_KIND={cap:'Capacité',av:'Avantage',dv:'Désavantage',at:'Atout',pw:'Pouvoir'};
const fxKey=(k,n)=>k+':'+nrm(n);
const fxTarget=c=>!c?'':c==='fortune'?'Fortune':c.replace(/^(car|comp|der):/,'');
const sgn=v=>(v>0?'+':v<0?'−':'')+Math.abs(v);
const fxLabel=e=>e.t==='rap'?e.txt:e.t==='perm'?fxTarget(e.cible)+' '+sgn(e.val):(e.cible||'Jet')+' '+sgn(e.val);
function raceRecOf(c){const cr=c&&c.race&&S.creatures.find(x=>raceRec(x).sing===c.race);return cr?raceRec(cr):null;}
/* Effets du personnage : race (capacités, avantages, désavantages) + atouts qu'il a pris */
function fxOf(c){const x=raceRecOf(c);if(!x)return [];const out=[],has=new Set(atoutsOf(c).map(a=>nrmA(a.nom)));
  if(x.fx)for(const k of ['cap','av','dv','at'])for(const e of (x[k]||[])){if(!e||!e[0])continue;if(k==='at'&&!has.has(nrmA(e[0])))continue;
    for(const f of (x.fx[fxKey(k,e[0])]||[]))out.push({...f,src:e[0],kind:k});}
  for(const id of pwOwnedIds(c,x)){const p=pwCat(id);for(const f of (p.fx||[]))out.push({...f,src:p.nom,kind:'pw'});}
  return out;}
const fxOn=(e,forme)=>fxQ(e.quand)==='m'||(forme||'m')==='d';
/* Valeurs qui s'achètent : un bonus permanent « toujours » est intégré à la valeur enregistrée (le coût XP se calcule avec lui) */
const fxPurch=cible=>cible==='fortune'||/^(car|comp):/.test(cible);
const fxInteg=e=>e.t==='perm'&&fxQ(e.quand)==='m'&&fxPurch(e.cible);
/* Bonus ajouté à l'affichage (valeurs calculées, ou bonus lié à une forme) */
function fxSum(c,cible,forme){if(!c.fx)return [0,[]];let s=0;const src=[];for(const e of fxOf(c))if(e.t==='perm'&&e.cible===cible&&fxOn(e,forme)&&!fxInteg(e)){s+=+e.val||0;src.push(sgn(e.val)+' '+e.src);}return [s,src];}
/* Origine des bonus intégrés à une valeur enregistrée */
function fxIntSrc(c,cible){if(!c.fx)return [];return fxOf(c).filter(e=>fxInteg(e)&&e.cible===cible).map(e=>sgn(e.val)+' '+e.src);}
const fxRefKey=cible=>cible==='fortune'?'fortune':cible.startsWith('car:')?'carac:'+cible.slice(4):'comp:'+cible.slice(5);
const fxIntKey=e=>e.kind+'|'+nrm(e.src)+'|'+e.cible;
/* Tient à jour les bonus intégrés d'un personnage du moteur : ajoute ce qui est nouveau, retire ce qui a disparu */
function fxSync(c0){if(!c0||!c0.fx)return c0;const want={};for(const e of fxOf(c0))if(fxInteg(e))want[fxIntKey(e)]=(want[fxIntKey(e)]||0)+(+e.val||0);
  const had=c0.fxInt||{},keys=new Set([...Object.keys(want),...Object.keys(had)]);let c=null;
  for(const k of keys){const d=(want[k]||0)-(had[k]||0);if(!d)continue;if(!c)c=clone(c0);const r=ref(c,fxRefKey(k.split('|')[2]));if(r&&r.o)r.o.cur=Math.max(0,(r.o.cur||0)+d);}
  if(!c&&JSON.stringify(had)===JSON.stringify(want))return c0;c=c||clone(c0);c.fxInt=want;return c;}
/* Mise en place ponctuelle : effets préremplis (à vérifier) sur les races qui n'en ont pas encore */
function fixFx(){if(!S.racesReady||!S.races)return;let ch=false;const R={...S.races};
  for(const k in FX_SEED){const r=R[k];if(!r||r.fxv)continue;R[k]={...r,fx:{...clone(FX_SEED[k]),...(r.fx||{})},fxv:1};ch=true;}
  if(ch){S.races=R;persist('meta/races',{byId:R});render();}}

/* ---------- Paramètres (écran Paramètres, droits de gestion) ----------
   meta/params = {versions:[{date, v:{...}}]} ; la version active est la plus récente dont la date d'effet est passée. */
const PARAM_TABS=[['couts','Coûts XP'],['paliers','Paliers'],['creation','Création'],['pnj','Rangs de PNJ'],['table','Table'],['bonus','Bonus'],['pouvoirs','Pouvoirs']];
const PARAM_DEF={
 couts:[['feerie','Féerie : (niveau suivant) ×',5],['masque','Masque : (niveau suivant) ×',4],['carac','Caractéristique : (niveau suivant) ×',4],['carac12','Caractéristique : passage de 1 à 2',12],['comp','Compétence : (niveau suivant) ×',3],['fut','Compétence futile : (niveau suivant) ×',1],['fortune','Fortune : (niveau suivant) ×',2],['atout','Atout féerique',8],['spec','Spécialité',8],['specFut','Spécialité futile',2],['mauvaiseMain','Mauvaise main',12],['prof','Profil de PNJ : (niveau suivant) ×',12]],
 paliers:[['p1feerie','Profond : Féerie',7],['p1carac','Profond : une caractéristique à',6],['p1comp','Profond : une compétence à',6],['p1atout','Profond : atouts féeriques',4],['p2feerie','Légendaire : Féerie',8],['p2carac','Légendaire : une caractéristique à',7],['p2comp','Légendaire : une compétence à',7],['p2atout','Légendaire : atouts féeriques',5],['palierMax','Compétences prises en compte : niveau max d\'au moins',7]],
 creation:[['carTot','Total de caractéristiques (PJ, minima compris)',26],['carMax','Plafond des caractéristiques à la création',5],['compMax','Plafond des compétences à la création (profils et prédilection compris)',5],['atStart','Atouts féeriques de départ',2],['fmStart','Féerie et Masque de départ',3],['profMaj','Rang du profil majeur',2],['profMin','Rang du profil mineur',1],['predBonus','Bonus de prédilection (rangs)',2],['ptsUtil','Points de compétence libres',18,1],['ptsFut','Points de compétences futiles libres',12,1],['ptsSpec','Coût d\'une spécialité (points de création)',1,1],['ptsMM','Coût de Mauvaise main (points de création)',2,1],['langCult','Langues offertes par rang de Culture',1],['ppBareme','Barème des PP de création','1, 3, 6, 10, 15',1]],
 table:[['creXP','XP de groupe par fiche de race complète',1],['secTitre','Secret : titre',1],['secVM','Secret : vérité majeure',3],['secVmin','Secret : vérité mineure',2],['secH','Secret : indice',1],['secBonus','Secret : bonus du secret complété',4]]};
const PNJ_DEF=[{nom:'Larbin',car:20,prof:5}];
function paramDefaults(){const v={};for(const t in PARAM_DEF)for(const [k,,d] of PARAM_DEF[t])v[k]=d;v.pnj=clone(PNJ_DEF);return v;}
let PRM=paramDefaults();
function paramActive(){const L=((S.params&&S.params.versions)||[]).filter(x=>x.date<=today()).sort((a,b)=>a.date.localeCompare(b.date));return {...paramDefaults(),...(L.length?L[L.length-1].v:{})};}
function applyParams(){PRM=paramActive();for(const [k] of PARAM_DEF.couts)if(PRM[k]!==''&&PRM[k]!=null)RULES[k]=+PRM[k];
  for(const [i,p] of [[0,'p1'],[1,'p2']])for(const f of ['feerie','carac','comp','atout'])if(PRM[p+f]!==''&&PRM[p+f]!=null)STAGES[i][f]=+PRM[p+f];if(PRM.palierMax)PALIER_MAX=+PRM.palierMax;
  if(typeof SKIND!=='undefined'){SKIND.titre.pts=+PRM.secTitre;SKIND.vm.pts=+PRM.secVM;SKIND.vmin.pts=+PRM.secVmin;SKIND.h.pts=+PRM.secH;SEC_BONUS=+PRM.secBonus;}}
/* Après chargement : remet à jour les bonus intégrés des personnages du moteur (si une fiche de race a changé) */
function fxSyncAll(){if(!S.ready||!S.racesReady||!S.creaturesReady)return;for(const c of Object.values(S.chars)){if(!c.fx)continue;const n=fxSync(c);if(n!==c){S.chars[n.id]=n;persist('chars/'+n.id,n);}}}
/* Mise en place ponctuelle : « Communication animale et végétale » et sa variante Troll deviennent « Communication » + précision par race */
function fixComm(){if(!S.racesReady||!S.pouvoirsReady||!S.races||!S.pouvoirs)return;const OLD={'pw-communication-animale-et-vegetale':'animale et végétale','pw-communication-animale-et-vegetale-animale-uniquement':'animale'};
  if(!Object.keys(OLD).some(k=>S.pouvoirs[k]))return;const R={...S.races};
  for(const k in R){const r=R[k];if(!r||!r.pw)continue;const sl=pwSlots(r);if(!sl.some(x=>OLD[x]))continue;const q=((r.pwq||[]).concat(Array(8).fill(''))).slice(0,8);
    sl.forEach((x,i)=>{if(OLD[x]){if(!q[i])q[i]=OLD[x];sl[i]='pw-communication';}});
    R[k]={...r,pw:{m:sl.slice(0,4).filter((x,i)=>x||i<(r.pw.m||[]).length),d:sl.slice(4,6).filter((x,i)=>x||i<(r.pw.d||[]).length),p:sl[6],l:sl[7]},pwq:q};}
  const P={...S.pouvoirs};for(const k in OLD)delete P[k];P['pw-communication']={nom:'Communication',prec:true};
  S.pouvoirs=P;persist('meta/pouvoirs',{byId:P});S.races=R;persist('meta/races',{byId:R});rebuildRaces();render();}
/* Mise en place ponctuelle : « toujours » devient « masqué » ; Laideur incommodante (gnome) : −1 masqué + −1 démasqué (= −2 démasqué) */
function fixFxQ(){if(!S.racesReady||!S.races)return;let ch=false;const R=clone(S.races);
  for(const k in R){const fx=R[k].fx;if(!fx)continue;for(const key in fx)for(const e of fx[key])if(e.quand==='tj'){e.quand='m';ch=true;}
    if(k==='gnomes'&&!R[k].fxq){const L=fx['dv:laideur incommodante'];if(L){const d=L.find(e=>e.quand==='d'&&+e.val===-2);if(d&&L.some(e=>e.quand==='m'&&+e.val===-1)){d.val=-1;ch=true;}}R[k].fxq=1;ch=true;}}
  if(ch){S.races=R;persist('meta/races',{byId:R});render();}}

/* ---------- Pouvoirs du personnage ----------
   c.pw = [{id, i, date}] : i = emplacement de la race (0-3 masqués, 4-5 démasqués) ; profond (6) et légendaire (7) viennent des paliers. */
function palierOk(c,k){if(!c||c.type!=='PJ')return false;for(let j=0;j<=k;j++){const st=STAGES[j];if(lv(c,'feerie')<st.feerie)return false;if(!gaugesFor(c,st).every(g=>g.cost===0&&g.cur>=g.target))return false;}return true;}
function pwOwnedIds(c){return (c.pw||[]).map(o=>o.id);}
const pwChoiceMax=c=>Math.min(lv(c,'feerie')||0,6);
const pwHas=(c,i)=>(c.pw||[]).some(o=>o.i===i);
/* Emplacement i ouvert au choix : rangs 1 à 6 pour les masqués et démasqués ; profond et légendaire une fois leur palier atteint (choisis à la main, comme les autres) */
const pwSlotOpen=(c,i)=>i<6?(c.pw||[]).filter(o=>o.i<6).length<pwChoiceMax(c):palierOk(c,i-6);
const pwToChoose=c=>Math.max(0,pwChoiceMax(c)-(c.pw||[]).filter(o=>o.i<6).length)+[6,7].filter(i=>!pwHas(c,i)&&palierOk(c,i-6)).length;
