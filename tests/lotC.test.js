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
    for(let i=0;i<2;i++)await click(page,'[data-act="cwInc"][data-f="car"][data-k="Agilité"][data-dv="1"]');
    ok(await page.evaluate(()=>crCarUsed(cwB().d,crX(cwB().d))===2&&/8 points à répartir/.test(document.querySelector('.cwst').textContent)),'caractéristiques : + / − et compteur');
    await page.evaluate(()=>{S.cwStep=6;render();});ok(await page.evaluate(()=>/profils/.test(document.querySelector('.cwbody').textContent)),'compétences : demande d\'abord les profils');
    await page.evaluate(()=>{S.cwStep=9;render();});ok(await page.evaluate(()=>document.querySelector('[data-act="cwSend"]').disabled),'récapitulatif : envoi bloqué tant qu\'il manque des étapes');
    await click(page,'[data-act="cwQuit"]');ok(await page.evaluate(()=>S.view==='team'&&!!document.querySelector('.cwtile')),'✕ : retour à Personnages, tuile « Brouillon · reprendre »');
    /* brouillon complet, envoi */
    await page.evaluate(B=>{const b=JSON.parse(JSON.stringify(cwList()[0]));b.d=B;cwSave(b);S.cwId=b.id;S.view='crea';S.cwStep=9;render();},r(`JSON.parse(JSON.stringify(B.d))`));
    await SHOT(page,'10-recap');await page.evaluate(()=>{S.cwStep=6;S.cwSp={'comp:Classe':true};render();});await SHOT(page,'7-comp');await page.evaluate(()=>{S.cwStep=7;render();});await SHOT(page,'8-pp');await page.evaluate(()=>{S.cwStep=9;render();});
    ok(await page.evaluate(()=>!document.querySelector('[data-act="cwSend"]').disabled&&/PdV/.test(document.querySelector('.cwbody').textContent)),'récapitulatif : valeurs calculées, envoi possible');
    await page.evaluate(()=>{S.cwStep=7;render();});await click(page,'[data-act="cwPPOpen"][data-v="Gentleman"]');
    ok(await page.evaluate(()=>S.dlg&&S.dlg.kind==='cwPP'&&!!document.querySelector('#sheetRoot .ppl')),'PP : tableau d\'achat du profil');await click(page,'#sheetRoot .actions [data-act="closeSheet"]');
    await page.evaluate(()=>{S.cwStep=9;render();});await click(page,'[data-act="cwSend"]');
    ok(db.all('brouillons')[0].statut==='attente','envoi au MJ : statut « en attente »');
    await SHOT(page,'team');ok(await page.evaluate(()=>/En attente de validation/.test(document.querySelector('.cwtile').textContent)),'tuile « En attente de validation »');
    ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  {const {page,errs,ctx}=await open(browser,base,db,'bob');ok(await page.evaluate(()=>!document.querySelector('.cwtile')),'autre joueur : ne voit pas le brouillon');await ctx.close();}
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
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
