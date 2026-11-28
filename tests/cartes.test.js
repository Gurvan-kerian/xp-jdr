/* Lot Cartes interactives (26/11/2026).
   Usage : node tests/cartes.test.js [docs.json] [import-cartes.json] [import-reperes.json] — sans argument, données inventées construites ici.
   1. Calculs : distances et durées, visibilité (carte, repère préparé, cible cachée), droits (joueur, Visiteur), repères et trajets
      (pose, modification, suppression), nouvelle catégorie, suppressions en cascade, bloc « Sur la carte », Paramètres, import.
   2. Navigateur : liste, carte (pastilles, bulle, gestes), modes (repère, trajet, règle, échelle), fenêtres ; tour des écrans sans erreur. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp,setDocs}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-26T20:00:00.000Z';
const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',kanka:'',vis:'rev',eye:{desc:true,sait:true,pers:true,orgs:true,obj:true,carte:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'chars/sloan':ch('sloan','Sloan','PJ',{race:'Elfe',traits:[]}),
    'chars/ismael':ch('ismael','Ismael','PNJ',{race:'Elfe',rang:'Cador'}),
    'chars/cache':ch('cache','Inconnu','PNJ',{race:'Elfe',rang:'Cador',vis:'prep'}),
    'fiches/paris':fi('paris','lieu','Paris',{type:'Ville'}),
    'fiches/cercle':fi('cercle','lieu','Cercle de jeu',{parent:'paris'}),
    'fiches/secret':fi('secret','lieu','Repaire secret',{vis:'prep',eye:{}}),
    'fiches/cp':fi('cp','carte','Paris',{type:'Ville',lieu:'paris',iw:2000,ih:1000,ech:{ax:0,ay:0.5,bx:0.5,by:0.5,l:5,u:'km'}}),
    'fiches/cq':fi('cq','carte','Montmartre',{parent:'cp',iw:1000,ih:1000}),
    'fiches/cz':fi('cz','carte','Carte préparée',{vis:'prep',eye:{}}),
    'fiches/r1':{id:'r1',genre:'rep',carte:'cp',x:.5,y:.5,nom:'Cercle',cat:'pub',cib:{s:'fiche',id:'cercle'},note:'Tenu par @[perso:ismael|Ismael]',vis:'rev',par:'lorenzo'},
    'fiches/r2':{id:'r2',genre:'rep',carte:'cp',x:.2,y:.2,nom:'Repaire',cat:'dan',cib:{s:'fiche',id:'secret'},vis:'rev',par:'lorenzo'},
    'fiches/r3':{id:'r3',genre:'rep',carte:'cp',x:.3,y:.3,nom:'Préparé',cat:'fee',vis:'prep',par:'lorenzo'},
    'fiches/r4':{id:'r4',genre:'rep',carte:'cp',x:.6,y:.1,nom:'Ismael',cat:'pub',cib:{s:'perso',id:'ismael'},vis:'rev',par:'lorenzo'},
    'fiches/r5':{id:'r5',genre:'rep',carte:'cp',x:.7,y:.2,nom:'Montmartre',cat:'pub',cib:{s:'carte',id:'cq'},vis:'rev',par:'lorenzo'},
    'fiches/r6':{id:'r6',genre:'rep',carte:'cz',x:.5,y:.5,nom:'Sur carte préparée',cat:'pub',vis:'rev',par:'lorenzo'},
    'fiches/t1':{id:'t1',genre:'traj',carte:'cp',pts:[[0,0],[0.25,0]],nom:'Ligne droite',coul:'#1d6b66',vis:'rev',par:'anne'},
    'gains/all':{events:[]}};}
const docsPath=process.argv[2],impC=process.argv[3],impR=process.argv[4];const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();

console.log('1. Calculs');
{const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','planning','parametres','donnees']),r=c=>app.run(c);
  setDocs(app,docsPath?DOCS:demoDocs());
  r(`toast=function(){};persistDel=function(){};S.fiches={};for(const k in __docs)if(k.startsWith('fiches/'))S.fiches[k.slice(7)]=JSON.parse(JSON.stringify(__docs[k]));S.fichesReady=true;S.ptr={};S.caCfg=__docs['meta/cartes']||null;window.scrollTo=()=>{};S.nav=S.nav||[];`);
  r(`ME='lorenzo';S.edit=true;S.visit=false;S.asPlayer=false;`);
  if(!docsPath){
    /* distances : 0,5 de largeur sur 2000 px = 1000 px = 5 km → 5 m/px */
    ok(Math.abs(r(`caMpp(S.fiches.cp)`)-5)<1e-9,'échelle : 5 m par pixel');
    ok(r(`caLen(S.fiches.cp,[[0,0],[0.25,0]])`)===2500&&r(`caDist(2500)`)==='2,5 km'&&r(`caDist(436)`)==='440 m','distance d\'un trajet et affichage (km, m arrondis à 10)');
    ok(r(`caDur(2500,5)`)==='30 min'&&r(`caDur(12000,5)`)==='2 h 24'&&r(`caDur(6000,6)`)==='1 h','durée = distance ÷ vitesse');
    ok(r(`caLen(S.fiches.cq,[[0,0],[1,1]])`)===null,'carte sans échelle : pas de distance');
    ok(r(`caDurs(2500).map(x=>x[0]+':'+x[2]).join()`)==='À pied:30 min,À cheval:13 min,Fiacre:10 min,Automobile:6 min','durées pour les 4 moyens de départ');
    /* gestion : tout voir */
    ok(r(`caReps('cp').length`)===5,'gestion : 5 repères visibles sur Paris (préparé compris)');
    ok(/Ville · 1 sous-carte · 5 repères · 1 trajet · échelle/.test(r(`caListSub(S.fiches.cp,[S.fiches.cq])`)),'liste : sous-titre de la carte');
    r(`uniPwSum=()=>''`);ok(/Cartes/.test(r(`fiUniHome()`)),'Univers : entrée Cartes');
    /* joueur */
    r(`ME='anne';S.edit=false;`);
    ok(r(`caReps('cp').map(x=>x.id).join()`)==='r1,r4,r5','joueur : repère préparé et repère vers une fiche cachée masqués');
    ok(!r(`fiSee(S.fiches.cz)`)&&!r(`caRepSee(S.fiches.r6)`),'joueur : carte préparée et ses repères invisibles');
    r(`S.fiTree={cp:true};`);ok(!/Carte préparée/.test(r(`fiListBody('carte')`))&&/Montmartre/.test(r(`fiListBody('carte')`)),'joueur : liste des cartes');
    r(`S.fi='cp';S.uni='carte';S.caPan=true;S.caPt='traj';`);{const h=r(`fiFicheView(S.fiches.cp)`);
      ok(/id="caMap"/.test(h)&&/data-capin="r1"/.test(h)&&!/data-capin="r2"/.test(h)&&/Ligne droite/.test(h)&&/2,5 km/.test(h),'fiche Carte : visionneuse, pastilles, trajet avec distance');
      ok(/data-act="caAdd"/.test(h)&&/data-act="caTrNew"/.test(h)&&/data-act="caRegle"/.test(h)&&!/data-act="caEchGo"/.test(h),'joueur : + Repère, Trajet, Règle ; pas d\'Échelle');}
    r(`S.caSel='r5';`);ok(/Ouvrir la sous-carte/.test(r(`caMapHtml(S.fiches.cp)`))&&/data-act="caRepEd"/.test(r(`caMapHtml(S.fiches.cp)`)),'bulle d\'un repère vers une sous-carte ; ✎ pour le joueur');r(`S.caSel=null;`);
    /* pose d'un repère par un joueur */
    r(`caAct('caAdd',{});`);ok(r(`S.caMode`)==='rep','+ Repère : mode pose');
    r(`caClick(S.fiches.cp,.4,.6);`);ok(r(`S.dlg&&S.dlg.kind`)==='caRep'&&r(`S.dlg.cat`)==='jou','clic : fenêtre Nouveau repère, catégorie « Repère de joueur » par défaut');
    r(`S.dlg.ty='libre';S.dlg.nom='Planque';S.dlg.nc=true;S.dlg.ncn='Planques';S.dlg.ncc='#123456';S.dlg.txt='Sous le pont';caAct('caRepSave',{});`);
    {const x=r(`JSON.stringify(Object.values(S.fiches).find(f=>f.genre==='rep'&&f.nom==='Planque'))`);const cat=r(`(caCfg().cats.find(c=>c.nom==='Planques')||{}).id`);
      ok(!!cat&&x.includes('"cat":"'+cat+'"')&&/"vis":"rev"/.test(x)&&/"par":"anne"/.test(x)&&/"x":0.4/.test(x)&&!/"cib"/.test(x),'repère libre posé par un joueur, avec une nouvelle catégorie');}
    /* rattaché, création de fiche à la volée */
    r(`caRepOpen(S.fiches.cp,null,.1,.9);S.dlg.ty='lieu';S.dlg.cid2='__new';S.dlg.nom='Bar du coin';caAct('caRepSave',{});`);
    {const L=r(`Object.values(S.fiches).find(f=>f.genre==='lieu'&&f.nom==='Bar du coin')`);ok(!!L&&L.vis==='rev'&&r(`Object.values(S.fiches).some(f=>f.genre==='rep'&&f.cib&&f.cib.id===${JSON.stringify(L&&L.id)})`),'« Créer une fiche du nom du repère » : lieu créé (révélé) et rattaché');}
    r(`caRepOpen(S.fiches.cp,null,.1,.9);S.dlg.ty='lieu';S.dlg.cid2='';caAct('caRepSave',{});`);ok(/Choisis/.test(r(`S.dlg.err`)),'repère rattaché sans fiche : refusé');r(`S.dlg=null;`);
    /* modification et suppression par un joueur (visible = modifiable) */
    r(`caAct('caRepEd',{id:'r1'});S.dlg.nom='Cercle de Wagram';caAct('caRepSave',{});`);ok(r(`S.fiches.r1.nom`)==='Cercle de Wagram'&&r(`S.fiches.r1.par`)==='lorenzo','joueur : modifie un repère du MJ');
    r(`caAct('caMove',{id:'r1'});caClick(S.fiches.cp,.55,.45);`);ok(r(`S.fiches.r1.x`)===.55&&r(`S.fiches.r1.y`)===.45,'déplacer un repère');
    r(`caAct('caRepEd',{id:'r4'});caAct('caRepDel',{});caAct('caRepDelOk',{});`);ok(!r(`S.fiches.r4`),'joueur : supprime un repère (décision du 26/11)');
    /* trajet */
    r(`caAct('caTrNew',{});caClick(S.fiches.cp,0,.5);caClick(S.fiches.cp,.5,.5);caClick(S.fiches.cp,.5,.9);`);
    ok(/Tracé en cours/.test(r(`caModeBar(S.fiches.cp)`))&&/5 km/.test(r(`caTrPanel(S.fiches.cp)`)),'tracé : distance en direct');
    r(`caAct('caUndo',{});caAct('caTrEnd',{});S.dlg.nom='Vers le pont';caAct('caTrSave',{});`);
    {const t=r(`Object.values(S.fiches).find(f=>f.genre==='traj'&&f.nom==='Vers le pont')`);ok(!!t&&t.pts.length===2&&t.par==='anne','trajet enregistré (↶ a retiré le dernier point)');}
    r(`caAct('caTrEd',{id:'t1'});caAct('caTrDel',{});caAct('caTrDelOk',{});`);ok(!r(`S.fiches.t1`),'joueur : supprime un trajet');
    /* règle */
    r(`caAct('caRegle',{});caClick(S.fiches.cp,0,0);caClick(S.fiches.cp,0.1,0);`);ok(/1 km/.test(r(`caModeBar(S.fiches.cp)`)),'règle : 1 km');r(`caAct('caCancel',{});`);
    ok(!r(`(globalThis.__writes||[]).some(w=>/regle/.test(JSON.stringify(w)))`),'règle : rien d\'enregistré');
    /* Visiteur */
    r(`S.visit=true;`);{const h=r(`fiFicheView(S.fiches.cp)`);ok(!/data-act="caAdd"/.test(h)&&/data-act="caRegle"/.test(h),'Visiteur : règle seulement');
      r(`caAct('caAdd',{});`);ok(!r(`S.caMode`),'Visiteur : pas de pose');}r(`S.visit=false;`);
    /* Sur la carte */
    {const h=r(`caOnMap('fiche','cercle')`);ok(/Sur la carte/.test(h)&&/data-rid="r1"/.test(h),'fiche visée : bloc « Sur la carte »');}
    {const h=r(`caOnMap('fiche','paris')`);ok(/carte de ce lieu/.test(h),'lieu associé : la carte s\'affiche sur la fiche du lieu');}
    r(`S.fiches.paris.eye.carte=true;S.ptr['ill-carte-paris']='data:x';`);ok(!/>Carte</.test(r(`fi6Blocks(S.fiches.paris)`)),'lieu avec une fiche Carte : ancien bloc Carte masqué');
    r(`caAct('caPlace',{t:'fiche',id:'cercle'});S.dlg.carte='cq';caAct('caPlaceGo',{});`);ok(r(`S.caMode`)==='rep'&&r(`S.fi`)==='cq'&&r(`S.caTmp.pre.id`)==='cercle','« + Placer sur une carte » : la carte s\'ouvre en mode pose, fiche présélectionnée');
    r(`caClick(S.fiches.cq,.5,.5);`);ok(r(`S.dlg.cid2`)==='cercle'&&r(`S.dlg.ty`)==='lieu','fenêtre préremplie');r(`S.dlg=null;S.fi='cp';`);
    /* gestion : échelle, œil, Paramètres */
    r(`ME='lorenzo';S.edit=true;caAct('caEchGo',{});caClick(S.fiches.cp,0,0);caClick(S.fiches.cp,0,1);`);ok(r(`S.dlg.kind`)==='caEch','échelle : fenêtre après deux points');
    r(`S.dlg.l='2';S.dlg.u='km';caAct('caEchSave',{});`);ok(Math.abs(r(`caMpp(S.fiches.cp)`)-2)<1e-9,'échelle enregistrée (1000 px = 2 km)');
    r(`caAct('caRepEd',{id:'r1'});S.dlg.vis='prep';caAct('caRepSave',{});`);ok(r(`S.fiches.r1.vis`)==='prep','gestion : repère préparé');
    {const h=r(`caParams()`);ok(/Catégories de repère/.test(h)&&/Moyens de déplacement/.test(h)&&/Fiacre/.test(h),'Paramètres › Cartes');}
    r(`S.caPd.moy[2].v=10;S.caPd.cats=S.caPd.cats.filter(c=>c.id!=='dan');S.caPd.merge=[['dan','pub']];caParamAct('caPdSave',{});`);
    ok(r(`caCfg().moy[2].v`)===10&&r(`S.fiches.r2.cat`)==='pub','Paramètres : vitesse modifiée, catégorie fusionnée (repères reclassés)');
    /* suppressions */
    r(`fiRemove('cercle');`);ok(!r(`S.fiches.r1.cib`)&&r(`S.fiches.r1.nom`)==='Cercle de Wagram','fiche visée supprimée : repère libre, nom gardé');
    r(`fiRemove('cq');`);ok(!r(`S.fiches.r5.cib`),'sous-carte supprimée : repère libre');
    r(`fiRemove('cp');`);ok(!Object.values(r(`S.fiches`)).some(f=>f.carte==='cp'),'carte supprimée : repères et trajets supprimés');
  }
  if(impC){for(const p of [impC,impR].filter(Boolean)){const F=JSON.parse(fs.readFileSync(p,'utf8'));r(`S.kk={step:'apercu',F:${JSON.stringify(F)},nomF:'f',mode:'maj'};kkPlan();`);
      ok(r(`S.kk.plan.length`)===F.items.length&&r(`S.kk.plan.every(x=>x.act==='new'||x.act==='same'||x.act==='maj')`),'fichier '+path.basename(p)+' : '+F.items.length+' éléments dans l\'aperçu');
      ok(/Aperçu/.test(r(`kkView()`)),'fichier '+path.basename(p)+' : écran d\'aperçu');
      if(F.genre==='rep')ok(F.items.every(i=>!i.data.cib||r(`!!S.fiches[${JSON.stringify(i.data.cib.id)}]`)),'repères : toutes les fiches rattachées existent');}}
}
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.jpg':'image/jpeg'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
  s.listen(0,()=>res(s));});}
function fakeDb(docs){const rows=Object.entries(docs).map(([k,data])=>{const [coll,id]=k.split('/');return {coll,id,data};}),imgs={};
  const J=(route,b)=>route.fulfill({status:200,contentType:'application/json',body:b===undefined?'':JSON.stringify(b)});
  return {rows,imgs,get:k=>{const [c,i]=k.split('/');const x=rows.find(r=>r.coll===c&&r.id===i);return x&&x.data;},async handle(route){const fn=route.request().url().split('/rpc/')[1];const a=JSON.parse(route.request().postData()||'{}');
    if(fn==='xp_list')return J(route,rows);
    if(fn==='xp_since')return J(route,{rows:[],del:[],now:new Date().toISOString()});
    if(fn==='xp_set'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);const r={coll:a.p_coll,id:a.p_id,data:a.p_data};if(i>=0)rows[i]=r;else rows.push(r);return J(route);}
    if(fn==='xp_delete'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);if(i>=0)rows.splice(i,1);return J(route);}
    if(fn==='xp_portraits')return J(route,rows.filter(r=>r.coll==='portraits'));
    if(fn==='xp_img_set'){imgs[a.p_id]=a.p_data;return J(route);}
    if(fn==='xp_img_get')return J(route,imgs[a.p_id]||null);
    if(/^xp_img/.test(fn))return J(route,null);
    return route.fulfill({status:404,body:'absent'});}};}
async function open(browser,base,db,me,vp){const ctx=await browser.newContext({viewport:vp||{width:420,height:900},hasTouch:true});const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|service ?worker/i.test(m.text()))errs.push(m.text());});
  await page.route('**/rest/v1/rpc/**',r=>db.handle(r));await page.route('**/functions/v1/notify',r=>r.fulfill({status:200,contentType:'application/json',body:'{"sent":0}'}));await page.route(/fonts\.(googleapis|gstatic)/,r=>r.fulfill({status:200,body:''}));
  await page.addInitScript(([me])=>{localStorage.setItem('xp.code','test');localStorage.setItem('xp.me',me);},[me]);
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady&&S.fichesReady!==undefined);await page.waitForTimeout(300);
  await page.evaluate(()=>{S.fichesReady=true;S.id&&(S.id.state='ok');S.view='team';render();});
  return {page,errs,ctx};}
const click=(page,sel)=>page.evaluate(s=>{const b=document.querySelector(s);if(!b)throw new Error('absent : '+s);b.click();},sel);
const fill=(page,fin,v)=>page.evaluate(([k,v])=>{const el=document.querySelector(`#sheetRoot [data-fin="${k}"]`);if(!el)throw new Error('champ absent : '+k);el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));},[fin,v]);
const txt=page=>page.evaluate(()=>document.getElementById('app').innerText);
const sheet=page=>page.evaluate(()=>(document.getElementById('sheetRoot')||{}).innerText||'');
const wait=(page,n)=>page.waitForTimeout(n||200);
const SHOTS=process.env.SHOTS;
(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));
  try{
    if(!docsPath){
      console.log('2. Navigateur');
      {const {page,errs,ctx}=await open(browser,base,db,'anne');
        await page.evaluate(()=>{S.view='univers';S.uni='home';render();});ok(/Cartes/.test(await txt(page)),'Univers : entrée Cartes');
        await page.evaluate(()=>{S.uni='carte';S.fi=null;S.fiTree={cp:true};render();});let t=await txt(page);ok(/Paris/.test(t)&&/Montmartre/.test(t)&&!/Carte préparée/.test(t),'liste des cartes (joueur)');
        await page.evaluate(()=>{S.fi='cp';S.caPan=true;S.caPt='traj';render();});t=await txt(page);ok(/Repères/i.test(t)&&/Trajets/i.test(t)&&/Ligne droite/.test(t),'fiche Carte : panneau Repères / Trajets (UX2)');await page.evaluate(()=>{S.caPt='rep';render();});
        const BOX=()=>page.evaluate(()=>{const b=document.querySelector('#caMap .cain').getBoundingClientRect(),m=document.getElementById('caMap').getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,mw:m.width,mh:m.height,mx:m.x,my:m.y};});let box=await BOX();
        ok(box.mh>=290&&box.mw>300,'visionneuse affichée ('+Math.round(box.mw)+' × '+Math.round(box.mh)+')');
        const v0=await page.evaluate(()=>JSON.stringify(CA_V.cp));
        await page.mouse.move(box.mx+200,box.my+150);await page.mouse.down();await page.mouse.move(box.mx+260,box.my+190,{steps:5});await page.mouse.up();await wait(page);
        const v1=await page.evaluate(()=>CA_V.cp);ok(Math.round(v1.x-JSON.parse(v0).x)===60,'glisser : la carte se déplace');
        await page.mouse.move(box.mx+200,box.my+150);await page.mouse.wheel(0,-300);await wait(page);ok(await page.evaluate(z=>CA_V.cp.z>z,v1.z),'molette : zoom');
        await click(page,'[data-act="caZoom"][data-v="-1"]');
        const pin=await page.evaluate(()=>{const b=document.querySelector('[data-capin="r1"]').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};});
        await page.mouse.click(pin.x,pin.y);await wait(page);ok(/Cercle/.test(await page.evaluate(()=>(document.querySelector('.cabub')||{}).innerText||'')),'clic sur une pastille : bulle');
        await click(page,'[data-act="caAdd"]');await wait(page);ok(/Nouveau repère/.test(await txt(page)),'+ Repère : bandeau');box=await BOX();
        if(process.env.DBG)console.log(JSON.stringify(box));await page.mouse.click(box.x+box.w*.3,box.y+box.h*.7);await wait(page,300);if(process.env.DBG)console.log(await page.evaluate(()=>JSON.stringify({m:S.caMode,t:S.caTmp,d:S.dlg&&S.dlg.kind,busy:CA_BUSY,v:CA_V.cp,sy:window.scrollY,b:JSON.stringify(document.getElementById('caMap').getBoundingClientRect())})));let sh=await sheet(page);ok(/Rattacher à/i.test(sh)&&/Catégorie/i.test(sh),'clic sur la carte : fenêtre du repère');
        await click(page,'[data-act="caTy"][data-v="libre"]');await fill(page,'nom','Rendez-vous');await click(page,'[data-act="caRepSave"]');await wait(page,400);
        ok(db.rows.some(x=>x.coll==='fiches'&&x.data.genre==='rep'&&x.data.nom==='Rendez-vous'),'repère enregistré');
        await click(page,'[data-act="caTrNew"]');await wait(page);box=await BOX();for(const [dx,dy] of [[.1,.1],[.4,.2],[.6,.8]])await page.mouse.click(box.x+box.w*dx,box.y+box.h*dy),await wait(page,120);
        t=await txt(page);ok(/3 points/.test(t)&&/À pied/.test(t),'tracé : points et durées');
        await click(page,'[data-act="caTrEnd"]');await wait(page);await fill(page,'nom','Itinéraire');await click(page,'[data-act="caTrSave"]');await wait(page,400);
        ok(db.rows.some(x=>x.coll==='fiches'&&x.data.genre==='traj'&&x.data.nom==='Itinéraire'&&x.data.pts.length===3),'trajet enregistré');
        await click(page,'[data-act="caFull"]');await wait(page);ok(await page.evaluate(()=>document.getElementById('caMap').classList.contains('full')),'plein écran');
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'carte-plein-ecran.png')});
        await click(page,'[data-act="caFull"]');await wait(page);
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'carte-joueur.png'),fullPage:true});
        await page.evaluate(()=>{S.fi='cercle';S.uni='lieu';render();});ok(/Sur la carte/i.test(await txt(page)),'fiche Lieu : bloc Sur la carte');
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'lieu-sur-la-carte.png'),fullPage:true});
        ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
      {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
        await page.evaluate(()=>{S.edit=true;S.view='univers';S.uni='carte';S.fi='cp';render();});
        await click(page,'[data-act="caEchGo"]');await page.waitForTimeout(150);const box=await page.evaluate(()=>{const b=document.querySelector('#caMap .cain').getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};});
        await page.mouse.click(box.x+box.w*.2,box.y+box.h*.5);await wait(page,120);await page.mouse.click(box.x+box.w*.7,box.y+box.h*.5);await wait(page,300);
        ok(/Échelle de Paris/.test(await sheet(page)),'gestion : fenêtre Échelle');await fill(page,'l','3');await click(page,'[data-act="caEchSave"]');await wait(page,300);
        ok(!!(db.get('fiches/cp').ech||{}).l,'échelle enregistrée');
        await page.evaluate(()=>{S.view='params';S.ptab='cartes';render();});ok(/Catégories de repère/i.test(await txt(page)),'Paramètres › Cartes');
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'parametres-cartes.png'),fullPage:true});
        await page.evaluate(()=>{S.view='params';S.ptab='';render();});ok(/Cartes/.test(await txt(page)),'Paramètres : entrée Cartes');
        ok(errs.length===0,'gestion : aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    }
    console.log('3. Tour des écrans (gestion puis joueur)');
    const PL=Object.entries(DOCS).filter(([k])=>k.startsWith('players/')).map(([,p])=>p).filter(p=>!p.parti);
    const MES=docsPath?[PL.find(p=>p.role==='MJ'||p.gestion),PL.find(p=>!(p.role==='MJ'||p.gestion)&&(p.persos||[]).length)].filter(Boolean).map(p=>p.id):['lorenzo','anne'];
    for(const me of MES){const {page,errs,ctx}=await open(browser,base,db,me,{width:1000,height:900});
      if(impC&&me===MES[0]){for(const p of [impC,impR].filter(Boolean)){const F=JSON.parse(fs.readFileSync(p,'utf8'));
          await page.evaluate(F=>{S.view='params';S.ptab='donnees';S.kk={step:'apercu',F,nomF:'f.json',mode:'maj'};kkPlan();render();kkRun();},F);
          await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:120000});const rep=await page.evaluate(()=>JSON.stringify(S.kk.rep));
          ok(rep.includes('"nNew":'+F.items.length+',')&&/"err":\[\]/.test(rep)&&/"imgKo":\[\]/.test(rep),'import simulé '+path.basename(p)+' : '+F.items.length+' créés');
          await page.evaluate(F=>{S.kk={step:'apercu',F,nomF:'f',mode:'maj'};kkPlan();},F);ok(await page.evaluate(()=>S.kk.plan.every(x=>x.act==='same')),'relance : rien à faire');await page.evaluate(()=>{S.kk=null;});}
        await page.evaluate(()=>{S.view='univers';S.uni='carte';S.fi='f-kk8479461';render();});await page.waitForTimeout(500);
        ok(await page.evaluate(()=>document.querySelectorAll('[data-capin]').length)===19,'Paris importé : 19 repères');
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'paris-importe.png')});}
      const FI=db.rows.filter(r=>r.coll==='fiches'&&['carte','lieu'].includes(r.data.genre)).map(r=>r.id).slice(0,80),CH=db.rows.filter(r=>r.coll==='chars').map(r=>r.id).slice(0,40);
      for(const st of [{view:'univers',uni:'carte'},{view:'univers',uni:'home'},...FI.map(id=>({view:'univers',uni:(db.get('fiches/'+id)||{}).genre,fi:id})),...CH.map(id=>({view:'sheet',sel:id,shTab:'situ'}))])
        await page.evaluate(o=>{S.fi=null;S.dlg=null;S.caMode=null;Object.assign(S,o);if(typeof fiSee==='function'&&S.fi&&!fiSee(S.fiches[S.fi]))S.fi=null;render();},st);
      await page.evaluate(()=>{S.dlg=null;render();});
      ok(errs.length===0,me+' : aucune erreur sur tous les écrans'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})();
