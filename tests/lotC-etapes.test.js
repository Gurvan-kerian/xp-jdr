/* Lot C (25/11/2026) : calculs de la création étape par étape, sur les vraies races (export Supabase en argument).
   Usage : node tests/lotC-etapes.test.js chemin/vers/donnees-v2.json
   Vérifie, après chaque étape, l'encart « Le personnage à ce stade » (PdV, Initiative, Fortune, bonus de circonstance),
   la Fortune de l'étape PP (crPP) et la fiche validée : même calcul partout, rien d'oublié ni de compté deux fois. */
const fs=require('fs'),path=require('path');
const {loadApp,setDocs}=require('./harness.js');
const ROOT=path.join(__dirname,'..'),SRC=process.argv[2];
if(!SRC||!fs.existsSync(SRC)){console.log('Export manquant : node tests/lotC-etapes.test.js chemin/vers/donnees-v2.json');process.exit(2);}
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','referentiel','pouvoirs','planning','parametres','donnees']),r=c=>app.run(c);
const D=JSON.parse(fs.readFileSync(SRC,'utf8'));setDocs(app,D);app.ctx.__prof=D['meta/profils']||null;
r(`S.profils=__prof;S.profilsReady=true;applyProfils();S.brouillons={};ME='test';S.edit=false;S.cwSnap=null;S.cwLast=null;`);
/* Valeurs à l'étape courante : encart (aperçu de la fiche), étape PP, fiche validée */
const V=()=>JSON.parse(r(`(()=>{const o=cwVals(B),Q=crPP(B.d,crX(B.d)),c=fxSync(crBuild(B,{id:'t-'+B.id}).c);
  return JSON.stringify({pdv:o.v.PdV,ini:o.v.Initiative,fort:o.v.Fortune,ppFort:Q.fort,valFort:lv(c,'fortune'),valIni:derived(c,'m').find(x=>x[0]==='Initiative')[1],
    jets:fxOf(o.c).filter(e=>e.t==='jet').map(e=>e.src),src:o.fs});})()`));
const NEW=(race,id)=>r(`B={id:${JSON.stringify(id)},kind:'pj',par:'test',statut:'brouillon',d:{race:${JSON.stringify(race)},ident:{owner:'test',court:'Essai'}}};S.cwSnap=null;S.cwLast=null;true`);
const carMin=k=>r(`crCarLim(B.d,crX(B.d),${JSON.stringify(k)}).min`);
const same=(v,m)=>ok(v.fort===v.ppFort&&v.fort===v.valFort,`${m} : encart ${v.fort}, étape PP ${v.ppFort}, fiche validée ${v.valFort}`);

console.log('1. Elfe : Manoir somptueux, caractéristiques, activité principale');
NEW('Elfe','e1');
let v=V(),sf=carMin('Sang Froid'),pe=carMin('Perception'),co=carMin('Constitution');
ok(v.pdv===9+3*co,`race : PdV = 9 + 3 × Constitution ${co} = ${v.pdv}`);
ok(v.ini===Math.max(sf,pe),`race : Initiative = max(Sang Froid, Perception) = ${v.ini}`);
ok(v.fort===0,'race : Fortune 0 (pas de rang de départ)');same(v,'race');
ok(v.jets.includes('Présomptueux'),'bonus de circonstance de la race affiché (Présomptueux)');
r(`cwFxBox(B);B.d.atouts=[{nom:'Manoir somptueux',src:'race'}];`);
v=V();ok(v.fort===2,'atouts : Manoir somptueux → Fortune 2');same(v,'atouts');
ok(v.src.some(s=>/Manoir somptueux/.test(s)),'source de la Fortune affichée : Manoir somptueux');
ok(/Dernier changement : Fortune \+2 · Manoir somptueux/.test(r(`cwFxBox(B)`)),'encart : « Dernier changement : Fortune +2 · Manoir somptueux »');
r(`B.d.car={'Constitution':${co+2},'Perception':${pe+1}};`);
v=V();ok(v.pdv===9+3*(co+2),`caractéristiques : Constitution +2 → PdV ${v.pdv}`);
ok(v.ini===Math.max(sf,pe+1)&&v.valIni===v.ini,`caractéristiques : Perception +1 → Initiative ${v.ini} (fiche validée ${v.valIni})`);
ok(/PdV \+6/.test(r(`cwFxBox(B)`)),'encart : changement des PdV signalé');
r(`B.d.maj='Erudit';B.d.min='Aventurier';`);
v=V();ok(v.fort===2,'profils : Fortune inchangée');same(v,'profils');
r(`(()=>{const e=ppEls()['pp-141'];B.d.pp=[{el:'pp-141',prof:'Erudit',rub:'A',nom:e.nom,opt:'p',cost:e.cost.a,fort:e.fortP,spec:e.spec||''}];})()`);
v=V();ok(v.fort===6,'PP : Manoir +2 et archéologue (principale) 4 → Fortune 6');same(v,'PP');
ok(v.src.some(s=>/archéologue/.test(s))&&v.src.some(s=>/Manoir/.test(s)),'sources : Manoir somptueux et archéologue');
ok(/Manoir somptueux/.test(r(`cwPPStep(B,B.d,crX(B.d),crRules())`)),'étape PP : sources de la Fortune affichées');
r(`B.d.atouts=[];`);v=V();ok(v.fort===4,'retour aux atouts, Manoir retiré → Fortune 4');same(v,'retour en arrière');

console.log('2. Fortune des atouts et avantages des autres races');
for(const [race,patch,lab] of [['Fouinard',`B.d.atouts=[{nom:'Brevets',src:'race'}]`,'atout Brevets'],['Vampyr',`B.d.atouts=[{nom:'Fortune immobilière',src:'race'}]`,'atout Fortune immobilière'],['Korrigan','0','avantage Trésor précieux, dès la race']]){
  NEW(race,'r-'+race);r(patch);v=V();ok(v.fort===2,`${race} : ${lab} → Fortune 2`);same(v,race);}

console.log('3. Initiative des effets de race et d\'atouts');
NEW('Fée électricité','fe');v=V();
ok(v.ini===Math.max(carMin('Sang Froid'),carMin('Perception'))+1&&v.valIni===v.ini,`Fée électricité : avantage Vivacité → Initiative ${v.ini}`);
NEW('Phénix','ph');const i0=V().ini;r(`B.d.atouts=[{nom:'Rapière ancestrale',src:'race'}]`);v=V();
ok(v.ini===i0+1&&v.valIni===v.ini,`Phénix : atout Rapière ancestrale → Initiative ${i0} → ${v.ini}`);

console.log('4. Féal');
r(`B={id:'f1',kind:'feal',par:'test',statut:'brouillon',d:{fealCar:{'Agilité':3,'Esprit':3},fealProf:{Aventurier:2},ident:{court:'Ismaël'}}};S.cwSnap=null;`);
const h=r(`S.cwOpen=true;cwFxBox(B)`);r(`S.cwOpen=false;`);
ok(/Caractéristiques/.test(h)&&/Profils/.test(h)&&!/Fortune/.test(h)&&!/Initiative/.test(h),'féal : caractéristiques et profils seulement');

console.log(fails?`\n${fails} échec(s)`:'\nTout est passé');process.exit(fails?1:0);
