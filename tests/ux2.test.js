/* Lot 2 « Nettoyage UX 2 : Univers » (28/11/2026). Usage : node tests/ux2.test.js — données inventées.
   Accueil en 4 groupes, liste (« + », tri gardé), fiche commune (œil unique, À révéler, Compléter, Notes MJ retirées), PNJ sur une page, élision, famille > 8 membres. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-27T09:00:00.000Z';
function demoDocs(){const ch=(id,court,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},"PJ")`),...o});
  const pnj=(id,nom,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(nom)},${JSON.stringify(nom)},"PNJ")`),vis:'rev',...o});
  const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',vis:'rev',eye:{desc:true,sait:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
  const D={'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:['kerian']},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'chars/kerian':ch('kerian','Kerian',{}),'chars/sloan':ch('sloan','Sloan',{}),
    'chars/alexis':pnj('alexis','Alexis de Montsacré',{race:'Elfe',por:{role:'Bailli de France, homme de devoir.',fm:'@[img:ill-txt-alexis-1|Image]'},situ:{titres:[{id:'t1',nom:'Duc de Allemagne',f:'f-mon',dom:{nom:'Allemagne'}}],orgs:[{id:'o1',f:'f-mon',nom:'Monarchie'}]}}),
    'meta/creatures':{list:[{id:'elfes',nom:'Elfes',fam:'trad',done:true}]},
    'meta/races':{byId:{elfes:{sing:'Elfe',plur:'Elfes',car:{},traits:['Hautain'],eye:{fiche:true,por:true,car:true}}}},
    'fiches/f-paris':fi('f-paris','lieu','Paris',{type:'Ville',desc:'Capitale.',notes:'Vieille note MJ'}),
    'fiches/f-lapin':fi('f-lapin','lieu','Le Lapin agile',{type:'Cabaret',parent:'f-paris'}),
    'fiches/f-tapis':fi('f-tapis','objet','Tapis volant',{desc:'Tapis oriental.',sait:[{id:'i1',txt:'Il en existe deux.',rev:false,par:'lorenzo',cree:now},{id:'i2',txt:'Il lévite.',rev:true,par:'anne',cree:now}]}),
    'fiches/f-prep':fi('f-prep','lieu','Phéacie',{vis:'prep',desc:'Secret.'}),
    'fiches/f-mon':fi('f-mon','org','Monarchie',{type:'Gouvernement'}),
    'fiches/f-fam':fi('f-fam','famille','Frédon',{type:'Majeure'}),
    'gains/all':{events:[{id:'s1',session:true,titre:'Partie',type:'Scénario',date:'2026-11-20',entries:[]}]},
    'meta/secrets':{list:[{n:1,titre:'Alliance',titrePts:1,slots:{vm:[{txt:'Vérité A',pts:3,hid:true},{txt:'Vérité B',pts:3,date:'2026-11-01'}],vmin:[],h:[null]}}],props:[]}};
  for(let i=1;i<=10;i++)D['chars/m'+i]=pnj('m'+i,'Membre '+i,{situ:{familles:[{id:'fa'+i,f:'f-fam',nom:'Frédon'}]}});
  return D;}
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
    console.log('1. Accueil et listes (joueur)');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      let t=await E(page,()=>{S.view='univers';S.uni='home';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Récit/i.test(t)&&/Société/i.test(t)&&/Monde/i.test(t)&&/Féerie/i.test(t),'accueil en 4 groupes');
      ok(/Histoire/.test(t)&&!/Chronologies/.test(t),'« Chronologies » devient « Histoire »');
      t=await E(page,()=>{S.uni='lieu';S.fi=null;S._force=true;render();return document.getElementById('app').innerText;});
      ok(await E(page,()=>!!document.querySelector('.pghead [data-act="fiNew"]')&&!document.querySelector('.cta[data-act="fiNew"]')),'« + » dans l\'en-tête de la liste');
      ok(!/Phéacie/.test(t),'fiche préparée invisible du joueur');
      await E(page,()=>{uniSortSet('lieu','rec');});ok(await E(page,()=>uniSortOf('lieu'))==='rec','tri gardé par liste');
      console.log('2. Fiche commune (joueur)');
      t=await E(page,()=>{S.fi='f-tapis';S.uni='objet';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Il lévite/.test(t)&&!/Il en existe deux/.test(t),'« À révéler » invisible du joueur, « Ce que l\'on sait » visible');
      ok(/ajouté par Anne/.test(t),'élément signé');
      t=await E(page,()=>{S.fi='f-paris';S.uni='lieu';S._force=true;render();return document.getElementById('app').innerText;});
      ok(!/Notes MJ/.test(t)&&/Compléter/.test(t),'Notes MJ absentes, barre « Compléter »');
      ok(!/calculé/.test(t)&&!/Modifier/.test(t),'plus de « calculé » ni de « Modifier » en toutes lettres');
      console.log('3. PNJ sur une page');
      t=await E(page,()=>{navGo({t:'perso',id:'alexis'});S._force=true;render();return document.getElementById('app').innerText;});
      ok(!/Portrait\s*\n\s*Situation\s*\n\s*Relations/.test(t)&&/Description/i.test(t)&&/Bailli de France/.test(t),'PNJ sans onglets, Rôle affiché en Description');
      ok(/Forme/i.test(t)&&/Démasquée/.test(t),'bloc Forme avec interrupteur');
      ok(/Duc d'Allemagne/.test(t),'élision du titre');
      console.log('4. Famille');
      t=await E(page,()=>{S.view='univers';S.uni='famille';S.fi='f-fam';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Voir les 4 autres/.test(t),'famille > 8 membres : 6 + « Voir les n autres »');
      ok(!errs.length,'aucune erreur ('+errs.join(' | ')+')');await ctx.close();}
    console.log('5. Révélation (MJ)');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      let t=await E(page,()=>{S.view='univers';S.uni='objet';S.fi='f-tapis';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/À révéler/i.test(t)&&/Il en existe deux/.test(t),'bloc « À révéler » pour le MJ');
      await E(page,()=>document.querySelector('[data-act="fiRevIt"]').click());await wait(page,300);
      ok(await E(page,()=>S.fiches['f-tapis'].sait.find(x=>x.id==='i1').rev===true),'« Révéler » passe l\'élément dans « Ce que l\'on sait »');
      t=await E(page,()=>{S.uni='lieu';S.fi='f-prep';S._force=true;render();return document.getElementById('app').innerText;});
      await E(page,()=>document.querySelector('[data-act="fiEye"][data-k="fiche"]').click());await wait(page,200);
      ok(/Révéler la fiche \?/.test(await txt(page)),'révéler une fiche : confirmation en ligne');
      await E(page,()=>document.querySelector('[data-act="fiRevOk"]').click());await wait(page,200);
      ok(await E(page,()=>S.fiches['f-prep'].vis)==='rev','fiche révélée');
      ok(!errs.length,'aucune erreur ('+errs.join(' | ')+')');await ctx.close();}
    console.log('6. Chronique (MJ) : un seul « + », Rendez-vous');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      let t=await E(page,()=>{S.view='univers';S.uni='chron';S.fi=null;S._force=true;render();return document.getElementById('app').innerText;});
      ok(await E(page,()=>!!document.querySelector('.pghead [data-act="chEvNew"]')&&!document.querySelector('[data-act="chAgNew"]')),'un seul « + » dans l\'en-tête');
      ok(/Filtres/.test(t)&&/Fêtes/.test(t),'« Filtres ▾ » et « Fêtes › »');
      await E(page,()=>document.querySelector('.pghead [data-act="chEvNew"]').click());await wait(page,150);
      ok(await E(page,()=>!!document.querySelector('[data-act="chSet"][data-k="type"][data-v="Rendez-vous"]')),'type Rendez-vous dans la fenêtre');
      await E(page,()=>document.querySelector('[data-act="chSet"][data-k="type"][data-v="Rendez-vous"]').click());await wait(page,150);
      ok(await E(page,()=>S.dlg&&S.dlg.kind==='chAg'),'Rendez-vous : fenêtre de rendez-vous');
      await E(page,()=>{S.dlg=null;render();});
      console.log('7. Lot de révélations');
      await E(page,()=>{window._n=[];notify=p=>window._n.push(p);S.view='univers';S.uni='secrets';S.sec=1;S._force=true;render();});
      ok(/Vérité A/.test(await txt(page))&&await E(page,()=>!!document.querySelector('[data-act="secRevAsk"]')),'MJ : élément préparé avec « Révéler »');
      await E(page,()=>document.querySelector('[data-act="secRevAsk"]').click());await wait(page,150);
      ok(/Valider \(1\) et notifier/.test(await E(page,()=>document.getElementById('sheetRoot').innerText)),'fenêtre à 3 boutons');
      await E(page,()=>document.querySelector('[data-act="lotAdd"][data-v="more"]').click());await wait(page,300);
      ok(await E(page,()=>secLot().length===1&&!!document.querySelector('.lotban')),'élément en attente, bandeau');
      ok(await E(page,()=>S.secrets[0].slots.vm[0].hid===true),'en attente : toujours invisible des joueurs');
      await E(page,()=>document.querySelector('[data-act="lotOpen"]').click());await wait(page,150);
      ok(/7 XP/.test(await E(page,()=>document.getElementById('sheetRoot').innerText)),'récapitulatif : total d\'XP, bonus du secret complété compris');
      await E(page,()=>document.querySelector('[data-act="lotOk"]').click());await wait(page,400);
      ok(await E(page,()=>!S.secrets[0].slots.vm[0].hid&&secLot().length===0&&S.events.some(e=>e.secret&&e.secret.n===1&&e.secret.k==='vm')),'validation : révélé, XP au journal, lot vidé');
      ok(await E(page,()=>window._n.length===1&&window._n[0].kind==='secRev'&&Array.isArray(window._n[0].lot)),'une seule notification « secRev » pour le lot');
      ok(!errs.length,'aucune erreur ('+errs.join(' | ')+')');await ctx.close();}
  }catch(e){fails++;console.log('ERREUR',e);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);
})();
