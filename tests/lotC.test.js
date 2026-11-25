/* Lot C (25/11/2026) : création de personnage (assistant).
   Usage : node tests/lotC.test.js — données inventées (version 2) construites ici.
   1. Calculs (sans navigateur) : étapes, caractéristiques, compétences, PP, complétude, retour en arrière, construction de la fiche, féal.
   2. Navigateur : tuile « + Nouveau PJ », assistant, brouillon, retour du téléphone, envoi, validation par le MJ, bouton PNJ en haut. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp,setDocs}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const CAR=(o)=>Object.fromEntries(['Agilité','Constitution','Force','Précision','Esprit','Perception','Prestance','Sang Froid'].map(k=>[k,o[k]||[1,5]]));
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  const race=(sing,o)=>({sing,fem:'',car:CAR(o.car||{}),cap:[{id:'cap-vision',v:''}],choix:o.choix||[['acc','Agilité'],['cap','cap-vol','']],av:[{id:'av-1',nom:'Grâce',desc:'',fx:[]}],dv:[{id:'dv-1',nom:'Fragile',desc:'',fx:[]}],
    at:[{id:'at-1',nom:'Beauté surnaturelle',desc:'',fx:[]},{id:'at-2',nom:'Pas léger',desc:'',fx:[]}],typ:[['Étiquette','Classe'],['Élégance','Classe']],sp:[['Beau monde','Entregent']],spf:[],
    pred:o.pred||['Classe','Entregent','Sensibilité',['Culture','Occultisme'],'Rhétorique'],fut:[['Danse','Chant'],'Une compétence artistique au choix'],
    pw:{m:['pw-a','pw-b','pw-c','pw-d'],d:['pw-e','pw-f'],p:'',l:''},pwi:[],pwv:[],traits:o.traits||['Hautain','Rêveur'],kanka:'',
    eye:{fiche:true,por:true,car:true,cap:true,av:true,dv:true,pred:true,fut:true,at:true,typ:true,sp:true,pw:[true,true,true,true,true,true,true,true]}});
  const P={};for(const [i,n] of ['Charme','Invisibilité','Illusion','Sommeil','Lumière','Envol'].entries())P['pw-'+'abcdef'[i]]={nom:n,desc:'',fx:[],var:[],type:'actif',nat:i<4?'m':'d'};
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/alice':{id:'alice',nom:'Alice',role:'Joueur',persos:['kerian']},
    'players/bob':{id:'bob',nom:'Bob',role:'Joueur',persos:[]},
    'chars/kerian':ch('kerian','Kerian','PJ',{race:'Elfe',traits:{}}),
    'meta/creatures':{list:[{id:'elfes',nom:'Elfes',fam:'trad',done:true},{id:'trolls',nom:'Trolls',fam:'trad',done:true},{id:'smogs',nom:'Smogs',fam:'exo',done:true}]},
    'meta/races':{byId:{elfes:race('Elfe',{car:{'Agilité':[3,7],'Esprit':[3,7],'Perception':[3,7],'Prestance':[3,7],'Précision':[2,7],'Constitution':[1,4],'Force':[1,3],'Sang Froid':[1,6]}}),
      trolls:race('Troll',{car:{'Constitution':[3,7],'Force':[3,7],'Esprit':[1,4]},pred:['Ressort','Mêlée','Survie','Autorité','Mouvement'],traits:['Bourru']}),smogs:race('Smog',{})}},
    'meta/pouvoirs':{byId:P},'meta/capacites':{byId:{'cap-vision':{nom:'Vision nocturne',desc:'',fx:[]},'cap-vol':{nom:'Vol',desc:'',fx:[]}}},
    'gains/all':{events:[]}};}

console.log('1. Calculs');
const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','planning','parametres','donnees']),r=c=>app.run(c);
setDocs(app,demoDocs());r(`S.brouillons={};ME='alice';S.edit=false;`);
ok(r(`crSteps({kind:'pj'}).map(s=>s[0]).join()`)==='race,cap,pw,at,car,prof,comp,pp,id,recap','PJ : 10 étapes dans l\'ordre du livre');
ok(r(`crSteps({kind:'feal'}).map(s=>s[0]).join()`)==='race,car,prof,id,recap','féal : 5 étapes');
ok(r(`JSON.stringify(crRaceList().map(o=>o.x.sing))`)==='["Elfe","Troll"]','races proposées : traditionnelles et modernes, exotiques exclues');
r(`B={id:'b1',kind:'pj',par:'alice',statut:'brouillon',d:{race:'Elfe',ident:{owner:'alice'}}};X=crX(B.d);`);
ok(r(`crCarUsed(B.d,X)===0&&crCarLim(B.d,X,'Agilité').max===5&&crCarLim(B.d,X,'Force').max===3`),'caractéristiques : départ aux minima, plafond 5 (ou maximum de race plus bas)');
ok(r(`crCheck(B).car.manque[0]`)==='10 points à répartir','10 points à répartir au-dessus des minima');
r(`B.d.car={'Agilité':5,'Esprit':5,'Prestance':5,'Précision':4,'Constitution':3};`);
ok(r(`crCarUsed(B.d,X)`)===10&&r(`crCheck(B).car.ok`),'minima elfe + 10 : étape complète');
r(`B2={kind:'pj',d:{race:'Troll'}};X2=crX(B2.d);`);ok(r(`crCarLim(B2.d,X2,'Esprit').max===4&&(B2.d.troll=true,crCarLim(B2.d,X2,'Esprit').max===5&&crCarLim(B2.d,X2,'Constitution').max===5)`),'troll : ajustement facultatif (Esprit max +1, Constitution max −1)');
r(`B.d.capx=0;`);ok(r(`crChoix(B.d,X).t==='acc'&&crCheck(B).cap.ok`),'choix définitif : caractéristique accrue');
r(`B.d.maj='Gentleman';B.d.min='Erudit';B.d.traits={maj:'Élégant',min:'Curieux',libre:'Têtu'};B.d.traitRace='Hautain';`);
ok(r(`(()=>{const C=crComps(B.d,X);const g=n=>C.find(c=>c.nom===n);return g('Classe').start===4&&g('Classe').cap===5&&g('Séduction').start===2&&g('Séduction').cap===4&&g('Fortitude').start===1&&g('Mêlée').start===0;})()`),'rangs de départ : majeur +2, mineur +1, prédilection +2 ; plafond 4 ou 5');
ok(r(`crPts(B.d,X).espMax`)===2,'bonus d\'Esprit : Esprit 5 − 3 = 2 points (Érudit ou Savant)');
ok(r(`crCheck(B).comp.manque.some(m=>/Culture ou Occultisme/.test(m))`),'choix « X ou Y » de la race obligatoire');
r(`B.d.xy={'Culture|Occultisme':'Culture','Danse|Chant':'Danse'};B.d.futN={1:'Peinture'};
  B.d.comps={'Classe':5,'Entregent':5,'Séduction':4,'Sensibilité':5,'Culture':5,'Fortitude':3,'Occultisme':3,'Rhétorique':4,'Mouvement':2,'Médecine':2};
  B.d.futV={r0:5,r1:5};B.d.futL=[{nom:'Jeux',cur:3}];B.d.specs=[{key:'comp:Classe',nom:'Argent'},{key:'fut:l0',nom:'Échecs'}];`);
ok(r(`JSON.stringify((({util,esp,fut})=>[util,esp,fut])(crPts(B.d,X)))`)==='[15,2,10]'&&r(`crCheck(B).comp.ok`),'compétences : 15 utiles, 10 futiles, Esprit 2 (spécialités comprises)');
ok(r(`(()=>{const C=crComps(B.d,X);return crRank(C,'Gentleman')===4&&crRank(C,'Erudit')===3;})()`),'rang d\'un profil = moyenne de ses compétences, arrondie à l\'inférieur');
ok(r(`(()=>{const Q=crPP(B.d,X);return Q.av.Gentleman===12&&Q.av.Erudit===7&&Q.ctcMax===4&&Q.langMax===5;})()`),'PP = rang + 8 / + 4 ; Contact (Prestance, Entregent) ; langues (Culture)');
r(`E=ppEls();ACT=Object.entries(E).find(([id,e])=>e.prof==='Gentleman'&&e.rub==='A'&&e.fortP>0&&e.cost.a>=5&&!e.nocrea&&!(e.pre||[]).length);CT=Object.entries(E).filter(([id,e])=>e.prof==='Gentleman'&&e.rub==='C'&&e.cost.a!=null&&e.cost.a<=2&&!e.nocrea&&!(e.pre||[]).length);LG=Object.entries(E).find(([id,e])=>e.rub==='L'&&!e.nocrea);`);
ok(r(`!!ACT&&!!LG&&CT.length>0`),'tableaux de PP : activité, contact et langue trouvés');
r(`B.d.pp=[{el:ACT[0],prof:'Gentleman',rub:'A',nom:ACT[1].nom,opt:'p',cost:ACT[1].cost.a,fort:ACT[1].fortP,spec:ACT[1].spec||''}];`);
ok(r(`crCheck(B).pp.manque.some(m=>/Contact/.test(m))&&crCheck(B).pp.manque.some(m=>/langue/.test(m))`),'PP : points de Contact et de langue à placer');
r(`(()=>{let need=4;for(const [id,e] of CT){if(need<=0)break;if(e.cost.a>need)continue;B.d.pp.push({el:id,prof:e.prof,rub:'C',nom:e.nom,opt:e.cost.k==='hf'?'h':'',cost:e.cost.a});need-=e.cost.a;}for(let i=0;i<5;i++)B.d.pp.push({el:LG[0],prof:LG[1].prof,rub:'L',nom:LG[1].nom,opt:'',cost:LG[1].cost.a||1});})();`);
ok(r(`(()=>{const Q=crPP(B.d,X);return Q.ctc===Q.ctcMax&&Q.lang>=Math.min(5,Q.langMax);})()`),'Contact et langues payés en premier par leurs points');
ok(r(`crCheck(B).pp.avert.length>0&&!crCheck(B).pp.manque.some(m=>/PP/.test(m)&&/trop/.test(m))`),'PP restants : avertissement seulement');
r(`B.d.pw=[{i:0,id:'pw-a'},{i:1,id:'pw-b'},{i:4,id:'pw-e'}];B.d.atouts=[{nom:'Beauté surnaturelle',src:'race'},{nom:TYP,src:'race'}];`);
ok(r(`Object.entries(crCheck(B)).filter(([k,v])=>!v.ok).map(([k])=>k).join()`)==='id,recap','toutes les étapes complètes sauf identité');
r(`B.d.ident={court:'Aël',owner:'alice'};`);ok(r(`crSendable(B)`),'envoi au MJ possible quand tout est complet');
r(`B.d.ident.court='';`);ok(r(`!crSendable(B)&&crCheck(B).id.manque[0]==='nom court'`),'nom court obligatoire ; date de naissance, genre et Situation facultatifs');r(`B.d.ident.court='Aël';`);
/* retour en arrière */
r(`B3=JSON.parse(JSON.stringify(B));B3.d.maj='Roublard';`);ok(r(`!crCheck(B3).pp.ok&&B3.d.pp.length===B.d.pp.length`),'retour en arrière : profil majeur changé → PP « À compléter », achats conservés');
r(`RS=crRaceSet(B.d,'Troll');`);ok(r(`RS.d.pw.length===0&&RS.d.atouts.length===0&&RS.lost.includes('pouvoirs')&&RS.d.maj==='Gentleman'`),'changement de race : pouvoirs et atouts de la race retirés avec message, le reste gardé');
/* construction */
r(`OUT=crBuild(B,{id:'ael',xp:5});C=fxSync(OUT.c);`);
ok(r(`C.type==='PJ'&&C.race==='Elfe'&&C.carac['Agilité'].cur===5&&C.accru==='Agilité'&&lv(C,'feerie')===3&&lv(C,'masque')===4`),'fiche : race, caractéristiques, accrue, Féerie 3 et Masque 4');
ok(r(`lv(C,'comp:Classe')===5&&C.futiles.length===3&&C.choix['Culture|Occultisme']==='Culture'`),'fiche : compétences, futiles, choix X/Y');
ok(r(`C.traits.race==='Hautain'&&C.traits.maj.p==='Gentleman'&&C.traits.min.n==='Curieux'&&C.traits.libre==='Têtu'`),'fiche : 4 traits au format existant');
ok(r(`C.pw.length===3&&C.atouts.length===2&&specsOf(C).some(s=>s.nom==='Étiquette'&&s.typ)&&specsOf(C).some(s=>s.nom==='Beau monde'&&s.pred)&&specsOf(C).some(s=>s.nom==='Argent'&&s.cible==='comp:Classe')`),'fiche : pouvoirs, atouts, spécialités typiques, de prédilection et achetées');
ok(r(`spent(C)===0&&C.achats.every(a=>!a.cout)`),'fiche : 0 XP dépensée à la création');
ok(r(`(()=>{const Q=crPP(B.d,X);return C.profils.find(p=>p.nom==='Gentleman').note===Q.av.Gentleman-Q.sp.Gentleman&&ppBought(C).length===B.d.pp.length&&lv(C,'fortune')===ACT[1].fortP;})()`),'fiche : achats en PP (profil débité), Fortune de l\'activité principale');
ok(r(`C.crea&&C.crea.etapes.length>5&&OUT.ev&&OUT.ev.entries[0].montant===5&&OUT.ev.entries[0].perso==='ael'`),'fiche : section « Création » et XP de départ au journal');
ok(r(`(()=>{const D=Object.fromEntries(derived(C,'m').map(x=>[x[0],x[1]]));return D['PdV']===9+3*3&&D['Esquive']===5+5+lv(C,'comp:Mouvement')&&D['Résistance psychique']===5+5+lv(C,'comp:Fortitude');})()`),'PdV, Esquive, Résistance calculées');
/* féal */
r(`F={id:'f1',kind:'feal',par:'alice',d:{pj:'kerian',fealCar:{'Agilité':3,'Force':3,'Esprit':3,'Perception':3,'Constitution':2,'Précision':2,'Prestance':2,'Sang Froid':2},fealProf:{Aventurier:3,Combattant:2},traits:{maj:{p:'Aventurier',n:'Audacieux'},libre:'Fidèle'},ident:{court:'Ismaël II',owner:'alice'}}};`);
ok(r(`crSendable(F)`),'féal : 4 à 3, 4 à 2 ; 5 points de profils, 3 au plus ; 2 traits');
r(`F.d.fealProf={Aventurier:4,Combattant:1};`);ok(r(`!crCheck(F).prof.ok`),'féal : plus de 3 dans un profil refusé');r(`F.d.fealProf={Aventurier:3,Combattant:2};`);
r(`FC=crBuild(F,{id:'ism2'}).c;`);ok(r(`FC.type==='PNJ'&&FC.race==='Humain'&&FC.pj==='kerian'&&FC.rang==='Larbin'&&lv(FC,'prof:Aventurier')===3&&isHum(FC)`),'féal : PNJ humain, rang Larbin, rattaché, profils');
/* brouillons */
r(`S.brouillons={b1:B};`);ok(r(`cwSee(B)&&(ME='bob',!cwSee(B))&&(ME='lorenzo',cwSee(B))`),'brouillon : visible de son auteur et de la gestion seulement');
r(`ME='alice';S.visit=true;`);ok(r(`!cwSee(B)`),'brouillon : jamais en mode Visiteur');r(`S.visit=false;`);
ok(r(`!Object.keys(S.chars).includes('b1')&&gainsTable(Object.values(S.chars),S.events).rows.length===1`),'brouillon : hors des personnages et des moyennes');
r(`B.statut='attente';ME='lorenzo';`);ok(r(`sigAuto().some(s=>s.obj.t==='brouillon'&&s.statut==='valider')`),'fiche envoyée : signalement « Fiche à valider » pour la gestion');

const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.jpg':'image/jpeg'};
function serve(){return new Promise(res=>{const s=http.createServer((q,rr)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rr.writeHead(404);rr.end();return;}rr.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(rr);});s.listen(0,()=>res(s));});}
function fakeDb(docs){const rows=Object.entries(docs).map(([k,data])=>{const [coll,id]=k.split('/');return {coll,id,data};});
  const J=(route,b)=>route.fulfill({status:200,contentType:'application/json',body:b===undefined?'':JSON.stringify(b)});
  return {rows,get:k=>{const [c,i]=k.split('/');const x=rows.find(r=>r.coll===c&&r.id===i);return x&&x.data;},all:c=>rows.filter(r=>r.coll===c).map(r=>r.data),async handle(route){const fn=route.request().url().split('/rpc/')[1];const a=JSON.parse(route.request().postData()||'{}');
    if(fn==='xp_list')return J(route,rows);if(fn==='xp_since')return J(route,{rows:[],del:[],now:new Date().toISOString()});
    if(fn==='xp_set'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);const r={coll:a.p_coll,id:a.p_id,data:a.p_data};if(i>=0)rows[i]=r;else rows.push(r);return J(route);}
    if(fn==='xp_delete'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);if(i>=0)rows.splice(i,1);return J(route);}
    if(fn==='xp_portraits')return J(route,[]);if(/^xp_img/.test(fn))return J(route,null);return route.fulfill({status:404,body:'absent'});}};}
async function open(browser,base,db,me){const ctx=await browser.newContext({viewport:{width:420,height:900}});const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|service ?worker/i.test(m.text()))errs.push(m.text());});
  await page.route('**/rest/v1/rpc/**',r=>db.handle(r));await page.route('**/functions/v1/notify',r=>r.fulfill({status:200,contentType:'application/json',body:'{"sent":0}'}));await page.route(/fonts\.(googleapis|gstatic)/,r=>r.fulfill({status:200,body:''}));
  await page.addInitScript(([me])=>{localStorage.setItem('xp.code','test');localStorage.setItem('xp.me',me);},[me]);
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady);await page.waitForTimeout(300);
  await page.evaluate(()=>{S.id&&(S.id.state='ok');S.view='team';S.teamSel='pj';render();});return {page,errs,ctx};}
const SHOT=async(p,n)=>{if(process.env.SHOTS)await p.screenshot({path:path.join(process.env.SHOTS,n+'.png'),fullPage:true});};
const click=async(p,sel)=>{await p.click(sel);await p.waitForTimeout(120);};

console.log('1 bis. Recette (25/11) : effets des éléments de PP, Fortune, panier');
r(`toast=function(){};S.profils=null;S.signalDoc=null;ME='lorenzo';`);
ok(r(`JSON.stringify(ppFxGuess('fusil de chasse stylisé','Classe +1 quand pertinent et très robuste').fx)`)==='[{"t":"jet","cible":"Classe","val":1,"txt":"quand pertinent et très robuste","quand":"m"}]','précision « Classe +1 quand pertinent » → Jet Classe +1 avec sa condition');
ok(r(`ppFxGuess('revolver','Pipe sculptée : +1 en Classe si fumée',['revolver','pipe sculptée']).fx.length===0&&ppFxGuess('pipe sculptée','Pipe sculptée : +1 en Classe si fumée',['revolver','pipe sculptée']).fx[0].txt==='si fumée'`),'ligne à plusieurs objets : l\'effet ne va qu\'à l\'objet nommé');
ok(r(`(()=>{const g=ppFxGuess('grande bibliothèque','Fortune +1 (Culture +1 quand consultée)').fx;return g.length===2&&g[0].t==='perm'&&g[0].cible==='fortune'&&g[1].cible==='Culture';})()`),'« Fortune +1 (Culture +1 …) » → Permanent Fortune + Jet Culture');
ok(r(`ppFxGuess('une antique médaille prisée','Médaille : +1 en Autorité ou Entregent auprès des soldats',['une arme à feu lourde','une antique médaille prisée']).fx.map(f=>f.cible).join()`)==='Autorité,Entregent','« +1 en Autorité ou Entregent » → deux Jets');
ok(r(`ppFxGuess('kit de jeu truqué','Kit truqué : +2 en Jeu ; déguisement : +1 en Comédie',['kit de jeu truqué','kit de déguisement']).amb[0]`)==='+2 en Jeu','cible inconnue (futile) : non reconnue, à signaler');
const nPlan=r(`ppFxPlan().length`);ok(nPlan>=20,'préremplissage : '+nPlan+' éléments concernés');
r(`PRE=ppFxPrefill();`);ok(r(`PRE.fx>=20&&ppFxPlan().length===0&&Object.values(ppEls()).some(e=>e.fxAuto)`),'préremplissage : effets écrits ('+r('PRE.fx')+'), rien à refaire ensuite');
ok(r(`sigStored().filter(x=>x.obj.t==='ppel').length===PRE.amb&&PRE.amb>0`),'cas non reconnus signalés dans Paramètres › Données ('+r('PRE.amb')+')');
r(`ART=Object.entries(ppEls()).find(([,e])=>nrm(e.nom)==="collection d'art");FUS=Object.entries(ppEls()).find(([,e])=>/^fusil de chasse/.test(nrm(e.nom)));
  ACTS=Object.entries(ppEls()).filter(([,e])=>e.prof==='Gentleman'&&e.rub==='A'&&e.fortP!=null&&!(e.pre||[]).length).sort((a,b)=>a[1].fortP-b[1].fortP);`);
ok(r(`!!ART&&ppFxFort({id:ART[0]})===1&&ACTS.length>=2&&ACTS[0][1].fortP<ACTS[ACTS.length-1][1].fortP`),'« collection d\'art » : Fortune +1');
ok(r(`(()=>{const D=JSON.parse(JSON.stringify(B.d)),f0=crPP(D,X).fort;D.pp.push({el:ART[0],prof:'Gentleman',rub:'E',nom:ART[1].nom,opt:'',cost:3});return crPP(D,X).fort===f0+1;})()`),'création : « Fortune +1 » ajouté à la Fortune calculée');
ok(r(`(()=>{const D={pp:[{el:ACTS[0][0],prof:'Gentleman',rub:'A',nom:'x',opt:'p',cost:1},{el:'z',prof:'Gentleman',rub:'A',nom:'y',opt:'s',cost:1}]};cwCartApply(D,[{id:ACTS[ACTS.length-1][0],opt:'p',prec:''}],S.chars.kerian,'Gentleman');return D.pp.length===2&&D.pp.filter(x=>x.opt==='p').length===1&&D.pp.some(x=>x.el===ACTS[ACTS.length-1][0]);})()`),'création : une nouvelle activité principale remplace l\'ancienne');
/* en jeu */
r(`(()=>{const c=S.chars.kerian;c.profils.find(p=>p.nom==='Gentleman').note=30;c.fortune.cur=2;c.achats=[];})();
  S.cal={date:{a:1902,m:3,j:12}};G1={kind:'ppBuy',cid:'kerian',prof:'Gentleman',rub:'all',q:'',cart:[{id:ACTS[0][0],opt:'p',prec:''},{id:ART[0],opt:'',prec:''},{id:FUS?FUS[0]:ART[0],opt:'',prec:'Purdey'}]};`);
const fP0=r(`ACTS[0][1].fortP`),fP1=r(`ACTS[ACTS.length-1][1].fortP`);
r(`ppCartBuy(G1);K1=S.chars.kerian;`);
ok(r(`K1.achats.length===3&&K1.achats.every(a=>a.ppel&&a.ppel.debut&&a.ppel.debut.a===1902)`),'panier en jeu : une ligne d\'achat par élément, date du jeu');
ok(r(`K1.fortune.cur`)===Math.max(2,fP0)+1,'Fortune : activité principale (au moins sa valeur) + « Fortune +1 » ('+r('K1.fortune.cur')+')');
ok(r(`K1.profils.find(p=>p.nom==='Gentleman').note===30-K1.achats.reduce((t,a)=>t+a.pp,0)`),'PP du profil débités du total du panier');
ok(!r(`FUS`)||r(`/fusil/.test(ppJetChips(K1,'Classe'))&&ppJetChips(K1,'Entregent')===''`),'bonus de circonstance affiché sur la compétence concernée seulement');
const f1=r(`K1.fortune.cur`);
r(`ppCartBuy({kind:'ppBuy',cid:'kerian',prof:'Gentleman',rub:'all',q:'',cart:[{id:ACTS[ACTS.length-1][0],opt:'p',prec:''}]});K2=S.chars.kerian;OLD=K2.achats.find(a=>a.ppel.id===ACTS[0][0]);NEW=K2.achats.find(a=>a.ppel.id===ACTS[ACTS.length-1][0]);`);
ok(r(`!!OLD.ppel.fin&&OLD.ppel.finT==='remp'&&NEW.remp===OLD.id`),'changement d\'activité principale : l\'ancienne est terminée (date du jeu)');
ok(r(`K2.fortune.cur`)===Math.min(15,f1+(fP1-fP0)),'changement d\'activité : Fortune ajustée de la différence');
ok(r(`/jusqu&#39;au/.test(ppLinesOf(K2,'A').join(''))&&/depuis le/.test(ppLinesOf(K2,'A').join(''))&&/srow end/.test(ppLinesOf(K2,'A').join(''))`),'Situation : ancienne activité grisée « jusqu\'au », nouvelle « depuis le »');
r(`K3=cancelAchat(K2,NEW.id).c;`);ok(r(`K3.fortune.cur===${f1}&&!K3.achats.find(a=>a.id===OLD.id).ppel.fin`),'annulation de l\'achat : Fortune rétablie, ancienne activité remise en cours');
r(`S.chars.kerian=K3;AB=K3.achats.find(a=>a.ppel.id===ART[0]);ppAbandon({kind:'ppAb',cid:'kerian',aid:AB.id});K4=S.chars.kerian;`);
ok(r(`K4.fortune.cur===${f1}-1&&K4.achats.find(a=>a.id===AB.id).ppel.finT==='ab'`),'abandon : bonus de Fortune retiré, pas de remboursement, élément gardé « terminé »');
ok(r(`(()=>{const ctx=ppCtxGame(K4,K4.profils.find(p=>p.nom==='Gentleman'),{prof:'Gentleman'});const K=ppCartCalc(ctx,[{id:ACTS[0][0],opt:'p'},{id:ACTS[ACTS.length-1][0],opt:'p'}]);return ppCartErr(ctx,K).some(e=>/principale/.test(e));})()`),'panier : deux activités principales refusées');
(async()=>{
  console.log('2. Navigateur');const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch({executablePath:fs.existsSync('/usr/bin/google-chrome')?undefined:undefined,args:['--no-sandbox']}).catch(()=>chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']}));
  const db=fakeDb(demoDocs());
  {const {page,errs,ctx}=await open(browser,base,db,'alice');
    ok(await page.evaluate(()=>{const g=document.querySelector('#app .grid');return !!g&&g.lastElementChild.matches('[data-act="cwNew"]');}),'Personnages › PJ : tuile « + Nouveau PJ » en fin de grille');
    await click(page,'[data-act="cwNew"]');
    ok(await page.evaluate(()=>S.view==='crea'&&document.body.classList.contains('crea')&&getComputedStyle(document.querySelector('.bnav')).display==='none'),'assistant en plein écran');
    ok(await page.evaluate(()=>/Étape 1 \/ 10/.test(document.querySelector('.cwhead').textContent)),'en-tête « Étape 1 / 10 »');
    await click(page,'[data-act="cwRace"][data-v="Elfe"]');await SHOT(page,'1-race');await click(page,'[data-act="cwSet"][data-p="traitRace"][data-v="Hautain"]');
    ok(await page.evaluate(()=>/Étape complète/.test(document.querySelector('.cwst').textContent)),'étape 1 complète (race et trait)');
    ok(db.all('brouillons').length===1&&db.all('brouillons')[0].d.race==='Elfe','brouillon enregistré dans la collection brouillons');
    await click(page,'.cwfoot .btn.pri');ok(await page.evaluate(()=>S.cwStep===1),'Suivante › : étape 2');
    await click(page,'.cwfoot .btn.pri');await click(page,'.cwfoot .btn.pri');
    await page.goBack();await page.waitForTimeout(250);ok(await page.evaluate(()=>S.view==='crea'&&S.cwStep===2),'retour du téléphone : étape précédente');
    await page.evaluate(()=>{S.cwStep=4;render();});
    for(let i=0;i<2;i++){await click(page,'[data-act="cwInc"][data-f="car"][data-k="Agilité"][data-dv="1"]');await page.waitForTimeout(200);}
    ok(await page.evaluate(()=>crCarUsed(cwB().d,crX(cwB().d))===2&&/8 points à répartir/.test(document.querySelector('.cwst').textContent)),'caractéristiques : + / − et compteur');
    await page.evaluate(()=>{S.cwStep=6;render();});ok(await page.evaluate(()=>/profils/.test(document.querySelector('.cwbody').textContent)),'compétences : demande d\'abord les profils');
    await page.evaluate(()=>{S.cwStep=9;render();});ok(await page.evaluate(()=>document.querySelector('[data-act="cwSend"]').disabled),'récapitulatif : envoi bloqué tant qu\'il manque des étapes');
    await click(page,'[data-act="cwQuit"]');ok(await page.evaluate(()=>S.dlg&&S.dlg.kind==='cwQuit'&&!!document.querySelector('#sheetRoot [data-act="cwAbandon"]')),'✕ : choix « Garder le brouillon » / « Abandonner la création »');await SHOT(page,'r-quit');
    await click(page,'[data-act="cwQuitKeep"]');ok(await page.evaluate(()=>S.view==='team'&&!!document.querySelector('.cwtile')),'garder : retour à Personnages, tuile « Brouillon · reprendre »');
    /* brouillon complet, envoi */
    await page.evaluate(B=>{const b=JSON.parse(JSON.stringify(cwList()[0]));b.d=B;cwSave(b);S.cwId=b.id;S.view='crea';S.cwStep=9;render();},r(`JSON.parse(JSON.stringify(B.d))`));
    await SHOT(page,'10-recap');await page.evaluate(()=>{S.cwStep=6;S.cwSp={'comp:Classe':true};render();});await SHOT(page,'7-comp');await page.evaluate(()=>{S.cwStep=7;render();});await SHOT(page,'8-pp');await page.evaluate(()=>{S.cwStep=9;render();});
    ok(await page.evaluate(()=>!document.querySelector('[data-act="cwSend"]').disabled&&/PdV/.test(document.querySelector('.cwbody').textContent)),'récapitulatif : valeurs calculées, envoi possible');
    await page.evaluate(()=>{S.cwStep=7;render();});await click(page,'[data-act="cwPPOpen"][data-v="Gentleman"]');
    ok(await page.evaluate(()=>S.dlg&&S.dlg.kind==='cwPP'&&!!document.querySelector('#sheetRoot .ppl')),'PP : tableau d\'achat du profil');
    ok(await page.evaluate(()=>S.ppAch!==false&&document.querySelector('#sheetRoot [data-act="ppAch"]').getAttribute('aria-pressed')==='true'&&!!document.querySelector('#sheetRoot .ppbar [data-act="cwPPCGo"][disabled]')),'panier : filtre « Achetables » actif par défaut, « Valider » inactif panier vide');
    const n0=await page.evaluate(()=>(cwB().d.pp||[]).length);
    await page.evaluate(()=>{S.ppAch=false;render();});
    ok(await page.evaluate(()=>!!document.querySelector('#sheetRoot .ppck.off[disabled]')),'éléments trop chers ou déjà choisis : grisés');
    await page.evaluate(()=>{S.ppAch=true;render();});
    const ids=await page.evaluate(()=>[...document.querySelectorAll('#sheetRoot .ppck:not([disabled])')].map(b=>b.dataset.id).filter(id=>ppEls()[id].rub==='E').slice(0,2));
    for(const id of ids)await click(page,`#sheetRoot [data-act="cwPPTg"][data-id="${id}"]`);await SHOT(page,'r-panier');
    ok(await page.evaluate(n=>new RegExp(n+' éléments').test(document.querySelector('#sheetRoot .ppbar').textContent),ids.length),'panier : bandeau « '+ids.length+' éléments · total · reste »');
    await click(page,'#sheetRoot [data-act="cwPPCGo"]');await SHOT(page,'r-recap');ok(await page.evaluate(()=>document.querySelectorAll('#sheetRoot .ppln').length===S.dlg.cart.length&&/Mon panier/.test(document.querySelector('#sheetRoot').textContent)),'Valider : récapitulatif du panier');
    await click(page,'#sheetRoot [data-act="cwPPCBuy"]');ok(await page.evaluate(([n,k])=>!S.dlg&&(cwB().d.pp||[]).length===n+k,[n0,ids.length]),'Acheter : éléments ajoutés au brouillon d\'un coup');
    await page.evaluate(()=>{S.cwStep=9;render();});await click(page,'[data-act="cwSend"]');
    ok(db.all('brouillons')[0].statut==='attente','envoi au MJ : statut « en attente »');
    await SHOT(page,'team');ok(await page.evaluate(()=>/En attente de validation/.test(document.querySelector('.cwtile').textContent)),'tuile « En attente de validation »');
    ok(await page.evaluate(()=>!!document.querySelector('.cwtw [data-act="cwDelAsk"]')),'tuile en attente : « Supprimer » pour le joueur');
    ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  {const {page,errs,ctx}=await open(browser,base,db,'bob');ok(await page.evaluate(()=>!document.querySelector('.cwtile')),'autre joueur : ne voit pas le brouillon');await ctx.close();}
  {const {page,errs,ctx}=await open(browser,base,db,'bob');await click(page,'[data-act="cwNew"]');const n=db.all('brouillons').length;
    await click(page,'[data-act="cwQuit"]');await click(page,'[data-act="cwAbandon"]');ok(await page.evaluate(()=>S.dlg&&S.dlg.kind==='cwDel'&&/définitivement/.test(document.querySelector('#sheetRoot').textContent)),'abandonner : confirmation demandée');
    await click(page,'[data-act="cwDelGo"]');ok(db.all('brouillons').length===n-1&&await page.evaluate(()=>S.view==='team'),'abandonner : brouillon supprimé, retour à Personnages');
    await click(page,'[data-act="cwNew"]');await click(page,'[data-act="cwQuit"]');await click(page,'[data-act="cwQuitKeep"]');await click(page,'.cwtw [data-act="cwDelAsk"]');await SHOT(page,'r-del');await click(page,'[data-act="cwDelGo"]');
    ok(db.all('brouillons').length===n-1,'tuile : « Supprimer » avec confirmation');ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
    await click(page,'.cwtile');await click(page,'[data-act="cwValOpen"]');
    ok(await page.evaluate(()=>S.dlg&&S.dlg.kind==='cwVal'),'MJ : fenêtre de validation');
    await page.fill('#cwcom','Revois le trait libre');await page.dispatchEvent('#cwcom','input');await click(page,'[data-act="cwBackDraft"]');
    ok(db.all('brouillons')[0].statut==='brouillon'&&db.all('brouillons')[0].com==='Revois le trait libre','renvoi en brouillon avec commentaire');
    await page.evaluate(()=>{const b=JSON.parse(JSON.stringify(cwList()[0]));b.statut='attente';cwSave(b);render();});
    await click(page,'[data-act="cwValOpen"]');await page.fill('#cwxp','5');await page.dispatchEvent('#cwxp','input');await click(page,'[data-act="cwValOk"]');await page.waitForTimeout(400);
    const pj=db.all('chars').find(c=>c.court==='Aël');
    ok(!!pj&&pj.type==='PJ'&&pj.crea&&db.all('brouillons').length===0,'validation : fiche créée, section Création, brouillon supprimé');
    ok(!!pj&&db.get('players/alice').persos.includes(pj.id),'validation : PJ rattaché au joueur');
    ok(!!pj&&(db.get('gains/all').events||[]).some(e=>e.entries.some(x=>x.perso===pj.id&&x.montant===5)),'validation : XP de départ au journal');
    ok(await page.evaluate(()=>S.view==='sheet'),'validation : ouvre la fiche créée');
    await page.evaluate(()=>{S.view='team';S.teamSel='pnj';S.edit=true;render();});
    ok(await page.evaluate(()=>{const a=document.querySelector('#app [data-act="pnNew"]'),s=document.querySelector('#app [data-pnq]');return !!a&&!!s&&(a.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_FOLLOWING)>0;}),'Personnages › PNJ : « + Nouveau PNJ » en haut de la liste');
    await page.evaluate(()=>{S.edit=true;render();});await click(page,'#app [data-act="pnNew"]');
    ok(await page.evaluate(()=>!document.querySelector('#sheetRoot [data-k="pj"],#sheetRoot select[data-fin="pj"]')&&/assistant/.test(document.querySelector('#sheetRoot').textContent)),'nouveau PNJ : sans option de rattachement (le féal passe par l\'assistant)');
    ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
    await page.evaluate(()=>{S.edit=true;S.view='params';render();ppFxPrefill();const c=JSON.parse(JSON.stringify(S.chars.kerian));c.profils.find(p=>p.nom==='Gentleman').note=20;c.fortune.cur=2;c.achats=[];saveChar(c);S.cal=S.cal||{};S.cal.date={a:1902,m:3,j:12};S.view='sheet';S.sel='kerian';S.shTab='prog';render();});
    await click(page,'#app [data-act="ppOpen"][data-prof="Gentleman"]');
    const pick=await page.evaluate(()=>{const E=ppEls(),f=n=>Object.keys(E).find(id=>E[id].prof==='Gentleman'&&n(E[id]));return [f(e=>e.rub==='A'&&e.fortP>=3&&!(e.pre||[]).length&&e.cost.a<=6),f(e=>nrm(e.nom)==="collection d'art"),f(e=>/^tabatiere/.test(nrm(e.nom)))];});
    for(const id of pick)await click(page,`#sheetRoot [data-act="ppTg"][data-id="${id}"]`);
    await click(page,'#sheetRoot [data-act="ppCGo"]');await SHOT(page,'r-jeu-recap');
    ok(await page.evaluate(()=>/Fortune 2 →/.test(document.querySelector('#sheetRoot').textContent)),'en jeu : récapitulatif avec la Fortune avant → après');
    await click(page,'#sheetRoot [data-act="ppCBuy"]');
    ok(await page.evaluate(()=>!S.dlg&&S.chars.kerian.achats.length===3&&S.chars.kerian.fortune.cur>2),'en jeu : 3 achats d\'un coup, Fortune de la fiche montée');
    ok(await page.evaluate(()=>/Classe|tabati/.test((document.querySelector('#app .ppjets')||{}).textContent||'')),'onglet Progrès : bonus de circonstance sous la compétence');await SHOT(page,'r-prog');
    await page.evaluate(()=>{S.shTab='situ';render();});await SHOT(page,'r-situ');
    const f0=await page.evaluate(()=>S.chars.kerian.fortune.cur);
    await click(page,'#app [data-act="ppAb"]');await click(page,'#sheetRoot [data-act="ppAbOk"]');
    ok(await page.evaluate(f=>S.chars.kerian.fortune.cur===f-1&&!!document.querySelector('#app .srow.end'),f0),'Situation : « Abandonner / retirer » retire le bonus, élément grisé');await SHOT(page,'r-situ2');
    ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
