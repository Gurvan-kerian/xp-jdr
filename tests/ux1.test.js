/* Lot 1 « Nettoyage UX 1 » (28/11/2026).
   Usage : node tests/ux1.test.js — données inventées.
   En-tête et barre du bas, menu « Plus », fil d'Ariane, liseré du mode édition, droits, XP (bilan, sessions, numérotation, suppression liée),
   Planning (2 vues, qui est libre, rappel), Personnages (groupes, féaux), Rang d'héritage par événement, Progrès, Situation,
   assistant (pastilles, 3 listes, exotiques), Carnets (aidants). */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-27T09:00:00.000Z';
const race=(sing,o)=>({sing,plur:sing+'s',car:o.car||{},traits:['Hautain'],eye:{fiche:true,por:true,car:true}});
function demoDocs(){const ch=(id,court,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},"PJ")`),...o});
  const CAR={'Agilité':[1,7],'Esprit':[1,7],'Perception':[1,7],'Prestance':[1,7],'Précision':[1,7],'Constitution':[1,7],'Force':[1,7],'Sang Froid':[1,7]};
  const ev=(id,nom,type,n)=>({id,genre:'evenement',vis:'rev',eye:{desc:true,sait:true},nom,type,n,num:'',pj:[],desc:'',notes:'',par:'lorenzo',cree:now,duree:1});
  const se=(id,date,evt,titre,type)=>({id,session:true,date,titre,type,evt,pj:['kerian','sloan','theo'],entries:['kerian','sloan','theo'].map(p=>({perso:p,nature:'Scénario',montant:type==='Scénario'?10:5}))});
  const kerian=ch('kerian','Kerian',{race:'Elfe',situ:{titres:[{id:'t1',nom:'Chevalier'}],fiefs:[{id:'sf1',nom:'Ville d\'Avray',titre:'t1'},{id:'sf2',nom:'Sèvres'}]}});
  kerian.carac=kerian.carac||{};
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:['kerian']},
    'players/chris':{id:'chris',nom:'Chris',role:'Joueur',gestion:true,persos:[]},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'players/bob':{id:'bob',nom:'Bob',role:'Joueur',persos:['theo']},
    'chars/kerian':kerian,'chars/sloan':ch('sloan','Sloan',{}),'chars/theo':ch('theo','Théodule',{}),
    'chars/ismael':{...GEN.run(`newChar("ismael","Ismaël","Ismaël","PNJ")`),race:'Humain',pj:'kerian'},
    'meta/creatures':{list:[{id:'elfes',nom:'Elfes',fam:'trad',done:true},{id:'djinns',nom:'Djinns',fam:'mod',done:true},{id:'smogs',nom:'Smogs',fam:'exo',done:true}]},
    'meta/races':{byId:{elfes:race('Elfe',{car:CAR}),djinns:race('Djinn',{car:CAR}),smogs:race('Smog',{car:CAR})}},
    'meta/heritage':{score:'6',delta:-2},
    'meta/planning':{dates:[{id:'dpast',date:'2026-01-10',sl:'S',type:'Scénario',status:'valid',by:'lorenzo'},{id:'dfut',date:'2027-02-06',sl:'S',type:'Scénario',status:'valid',by:'lorenzo'}]},
    'fiches/e1':ev('e1','Ouverture','Scénario',1),'fiches/e2':ev('e2','Suite','Scénario',2),'fiches/i1':ev('i1','Entre-deux','Interscénario',1),
    'journaux/q1':{id:'q1',genre:'quete',type:'perso',perso:'kerian',parts:['kerian'],aides:['theo'],nom:'Cité d\'Ys',pub:false,statut:'cours',ent:[],cree:now},
    'gains/all':{events:[se('s1','2026-10-01','e1','','Scénario'),se('s2','2026-10-08','e1','Épilogue','Scénario'),se('s3','2026-10-15','e2','','Scénario'),se('s4','2026-10-20','i1','','Interscénario'),
      {id:'s5',session:true,date:'2026-10-21',titre:'Quiz',type:'Autre',pj:['kerian'],entries:[{perso:'kerian',nature:'Individuel',montant:1}]}]}};}
const DOCS=demoDocs();
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.jpg':'image/jpeg'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
  s.listen(0,()=>res(s));});}
function fakeDb(docs){const rows=Object.entries(docs).map(([k,data])=>{const i=k.indexOf('/');return {coll:k.slice(0,i),id:k.slice(i+1),data};});
  const J=(route,b)=>route.fulfill({status:200,contentType:'application/json',body:b===undefined?'':JSON.stringify(b)});
  return {rows,get:k=>{const i=k.indexOf('/');const x=rows.find(r=>r.coll===k.slice(0,i)&&r.id===k.slice(i+1));return x&&x.data;},async handle(route){const fn=route.request().url().split('/rpc/')[1];const a=JSON.parse(route.request().postData()||'{}');
    if(fn==='xp_list')return J(route,rows);
    if(fn==='xp_since')return J(route,{rows:[],del:[],now:new Date().toISOString()});
    if(fn==='xp_set'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);const r={coll:a.p_coll,id:a.p_id,data:a.p_data};if(i>=0)rows[i]=r;else rows.push(r);return J(route);}
    if(fn==='xp_delete'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);if(i>=0)rows.splice(i,1);return J(route);}
    if(fn==='xp_portraits')return J(route,rows.filter(r=>r.coll==='portraits'));
    if(/^xp_img/.test(fn))return J(route,null);
    return route.fulfill({status:404,body:'absent'});}};}
async function open(browser,base,db,me,vp){const ctx=await browser.newContext({viewport:vp||{width:420,height:900}});const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|service ?worker/i.test(m.text()))errs.push(m.text());});
  await page.route('**/rest/v1/rpc/**',r=>db.handle(r));await page.route('**/functions/v1/notify',r=>r.fulfill({status:200,contentType:'application/json',body:'{"sent":0}'}));await page.route(/fonts\.(googleapis|gstatic)/,r=>r.fulfill({status:200,body:''}));
  await page.addInitScript(([me])=>{localStorage.setItem('xp.code','test');localStorage.setItem('xp.me',me);},[me]);
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady,null,{timeout:60000});await page.waitForTimeout(400);
  await page.evaluate(()=>{S.fichesReady=true;S.id&&(S.id.state='ok');S.view='team';render();});
  return {page,errs,ctx};}
const wait=(page,n)=>page.waitForTimeout(n||250);
const txt=page=>page.evaluate(()=>document.getElementById('app').innerText);
const sheet=page=>page.evaluate(()=>{const r=document.getElementById('sheetRoot');return r?r.innerText:'';});
const gest=(page,fid)=>page.evaluate(fid=>{S.fiTab='gest';navGo({t:'fiche',id:fid});S._force=true;render();return document.getElementById('app').innerText;},fid);
const fill=async(page,sel,v)=>{await page.fill(sel,String(v));await page.dispatchEvent(sel,'input');};

(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));const E=(page,js,arg)=>page.evaluate(js,arg);
  try{
    console.log('1. Navigation (MJ, téléphone)');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      const h=await E(page,()=>Math.round(document.querySelector('header.top').getBoundingClientRect().height));ok(h<=56,'en-tête ≤ 56 px ('+h+')');
      ok(await E(page,()=>document.querySelectorAll('.bnav button, .bnav a').length)===6,'barre du bas : 6 entrées');
      const m=await E(page,()=>{S.dlg={kind:'menu'};S._force=true;render();return document.getElementById('sheetRoot').innerText;});ok(/Paramètres/.test(m)&&/Voir comme un joueur/.test(m)&&/Se déconnecter/.test(m),'menu « Plus » du MJ');
      await E(page,()=>{S.dlg=null;S.edit=true;render();});ok(await E(page,()=>document.body.classList.contains('edmode')),'liseré du mode édition');
      await E(page,()=>{S.edit=false;render();});
      console.log('2. XP');
      let t=await E(page,()=>{S.view='gains';S.xpSess=null;S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Bilan/i.test(t)&&/Sessions · 5/i.test(t),'page XP : Bilan et Sessions');
      ok(await E(page,()=>scenarioCount(S.events))===2,'Rang d\'héritage : une étoile par événement Scénario joué (2)');
      ok(await E(page,()=>xpNextN('Scénario'))===3&&await E(page,()=>xpNextN('Interscénario'))===2,'numérotation : plus grand + 1 par type');
      ok(await E(page,()=>chSessHead(sessById('s2')).t)==='Ouverture — Épilogue','titre de session = événement + suffixe');
      await page.click('[data-act="xpOpen"][data-id="s3"]');await wait(page);
      ok(await E(page,()=>!!document.querySelector('.crumb')&&/XP/.test(document.querySelector('.crumb').innerText)),'session ouverte : fil d\'Ariane');
      await E(page,()=>{S.dlg={kind:'sn',type:'Scénario',titre:'',evNom:'Nouvelle affaire',evt:'__new',date:'2026-11-28',pj:['kerian']};render();});
      await page.click('[data-act="sessCreate"]');await wait(page,400);
      const ns=await E(page,()=>{const e=S.events.find(x=>x.date==='2026-11-28');const f=e&&S.fiches[e.evt];return f?{n:f.n,type:f.type,nom:f.nom}:null;});
      ok(ns&&ns.n===3&&ns.type==='Scénario'&&ns.nom==='Nouvelle affaire','nouvelle session rattachée à un nouvel événement n° 3');
      const sid=await E(page,()=>S.events.find(x=>x.date==='2026-11-28').id);
      await E(page,sid=>{S.view='gains';S.xpSess=sid;S._force=true;render();},sid);await page.click('[data-act="xpDelAsk"]');await wait(page);
      ok(await E(page,()=>!!document.querySelector('.delconf')),'confirmation en ligne');
      await page.click('[data-act="xpDelOk"]');await wait(page,400);
      ok(await E(page,sid=>!S.events.some(x=>x.id===sid)&&!Object.values(S.fiches).some(f=>f.nom==='Nouvelle affaire'),sid),'suppression : session et son événement seul');
      console.log('3. Planning');
      t=await E(page,()=>{S.view='planning';S.plan.view='com';S.plDate=null;S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Prochaines dates/i.test(t)&&/Disponibilités/i.test(t)&&/Dates validées/i.test(t),'Planning : 2 vues, dates validées');
      await E(page,()=>{S.plan.view='dispo';S.plan.y=2027;S.plan.m=1;S._force=true;render();});await page.click('.pdays2 [data-act="plWho"]');await wait(page);
      ok(/Libres/.test(await sheet(page))&&/Pas libres/.test(await sheet(page)),'fenêtre « Qui est libre »');
      t=await E(page,()=>{S.dlg=null;S.view='home';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/À traiter/i.test(t)&&/est passée/.test(t),'rappel « Créer la session » pour une date validée passée');
      await page.click('[data-act="plEcart"]');await wait(page,300);ok(!/est passée/.test(await txt(page))&&(db.get('meta/planning').ecartes||[]).includes('dpast'),'« Écarter » mémorisé');
      console.log('4. Personnages');
      t=await E(page,()=>{S.view='team';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Rang d'héritage 6/.test(t)&&/★ 2 \/ 30/.test(t),'ligne Rang d\'héritage (score, étoiles)');
      ok(/Féal · Ismaël/.test(t),'féal sous son PJ');
      t=await E(page,()=>{S.view='sheet';S.sel='kerian';S.shTab='prog';S._force=true;render();return document.getElementById('app').innerText;});
      ok(await E(page,()=>!!document.querySelector('.shtop .crumb')),'fiche : fil d\'Ariane');
      ok(/Carnets/.test(t),'onglet « Carnets »');
      await E(page,()=>{S.shFold={...(S.shFold||{}),'pg-comp':false};const c=S.chars.kerian;c.profils[0].note=3;S._force=true;render();});
      ok(await E(page,()=>!!document.querySelector('.ppban')&&!!document.querySelector('.ppgold')),'PP disponibles mis en évidence');
      t=await E(page,()=>{S.shTab='situ';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Titres et fiefs/i.test(t)&&await E(page,()=>!!document.querySelector('.sfief')),'Situation : fief sous son titre');
      await ctx.close();ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));}
    console.log('5. Joueur');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      const m=await E(page,()=>{S.dlg={kind:'menu'};S._force=true;render();return document.getElementById('sheetRoot').innerText;});ok(!/Paramètres/.test(m),'menu « Plus » du joueur sans Paramètres');
      const t=await E(page,()=>{S.dlg=null;S.view='team';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Mes personnages/i.test(t)&&/La troupe/i.test(t),'groupes Mes personnages / La troupe');
      ok(await E(page,()=>canEditC(S.chars.kerian)&&!isGest()&&!isTech()),'droits : personnage visible modifiable, sans gestion');
      await ctx.close();ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));}
    console.log('6. Carnets : aidant');
    {const {page,errs,ctx}=await open(browser,base,db,'bob');
      let t=await E(page,()=>{S.view='sheet';S.sel='theo';S.shTab='jour';S.jrSel='q';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Quêtes où il aide/i.test(t)&&/Cité d'Ys/.test(t),'la quête aidée apparaît dans les Carnets de l\'aidant');
      ok(await E(page,()=>jrCanEd(S.jour.q1)),'l\'aidant peut écrire');
      await page.click('[data-act="jrOpen"][data-j="q1"]');await wait(page);
      ok(await E(page,()=>!!document.querySelector('.crumb')),'quête ouverte : fil d\'Ariane');
      await ctx.close();ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));}
    console.log('7. Assistant');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      await E(page,()=>{cwNew('pj');render();});await wait(page);
      ok(await E(page,()=>document.querySelectorAll('.cwdots button[disabled]').length)===9,'pastilles des étapes non atteintes inactives');
      ok(await E(page,()=>document.querySelectorAll('select[data-cwrace]').length)===3,'race : 3 listes déroulantes');
      ok(await E(page,()=>crRaceList().some(o=>o.x.sing==='Smog')),'race exotique proposée');
      await E(page,()=>{const s=document.querySelector('#cwr-exo');s.value='Smog';s.dispatchEvent(new Event('change',{bubbles:true}));});await wait(page,300);
      ok(await E(page,()=>cwB().d.race)==='Smog','choix dans la liste exotique');
      await ctx.close();ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));}
  }catch(e){console.error(e);fails++;}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert.');process.exit(fails?1:0);
})();
