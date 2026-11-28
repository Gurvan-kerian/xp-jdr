/* Lot 6 (25/11/2026) : lieux et objets.
   Usage : node tests/lot6.test.js [docs.json] — sans argument, données inventées (version 2) construites ici.
   1. Calculs (sans navigateur) : visibilité, arborescence, liens dans les deux sens (fief, résident / propriétaire, détenteur,
      emplacement, collection), objet unique, Mentions, suppression, rattachement par nom, Visiteur.
   2. Navigateur : fiche Lieu (gestion, joueur), ajout d'un résident depuis le lieu, fiche Objet, Situation d'un PJ,
      liste des objets, Données ; tour des écrans sans erreur. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp,setDocs}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};

const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-25T20:00:00.000Z';
const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',kanka:'',vis:'rev',eye:{desc:true,sait:true,fief:true,pers:true,orgs:true,obj:true,carte:true,effet:true,carac:true,det:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/alice':{id:'alice',nom:'Alice',role:'Joueur',persos:['kerian']},
    'chars/kerian':ch('kerian','Kerian','PJ',{race:'Elfe',traits:[],situ:{fiefs:[{id:'s1',nom:"Ville d'Avray et Sèvres"}],possN:[{id:'s2',nom:'La lanterne'}]}}),
    'chars/hector':ch('hector','Hector Durvoy','PNJ',{race:'Gnome',rang:'Cador'}),
    'chars/armand':ch('armand','Armand Lorgeril','PNJ',{race:'Elfe',vis:'prep',eye:{}}),
    'fiches/paris':fi('paris','lieu','Paris',{type:'Ville'}),
    'fiches/montm':fi('montm','lieu','Montmartre',{type:'Quartier',parent:'paris'}),
    'fiches/lavoir':fi('lavoir','lieu','Le Bateau-Lavoir',{type:'Atelier',parent:'montm',vis:'prep',eye:{}}),
    'fiches/cave':fi('cave','lieu','La cave secrète',{type:'Cave',parent:'lavoir'}),
    'fiches/fva':fi('fva','lieu',"Ville d'Avray et Sèvres",{type:'Fief'}),
    'fiches/coll':fi('coll','objet','Collection privée de Kerian',{type:'Collection',uniq:true}),
    'fiches/compas':fi('compas','objet',"Le compas d'Ys",{type:'Instrument',uniq:true,parent:'coll'}),
    'fiches/lant':fi('lant','objet','La lanterne',{type:'Lampe'}),
    'gains/all':{events:[]}};}
const docsPath=process.argv[2];const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();

console.log('1. Calculs');
if(!docsPath){const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','planning','donnees']),r=c=>app.run(c);
  setDocs(app,demoDocs());
  r(`toast=function(){};S.fiches={};for(const k in __docs)if(k.startsWith('fiches/'))S.fiches[k.slice(7)]=JSON.parse(JSON.stringify(__docs[k]));S.fichesReady=true;S.ptr={};`);
  r(`ME='alice';S.edit=false;S.visit=false;`);
  ok(r(`!fiSee(S.fiches.lavoir)&&fiSee(S.fiches.cave)&&fiCanEd(S.fiches.paris)`),'joueur : lieu préparé invisible, lieu révélé modifiable (principe du 25/11)');
  {const h=r(`S.fiQ='';S.fiTy='';fiListBody('lieu')`);const row=h.split('class="firow').find(x=>x.includes('La cave secrète'));
    ok(!!row&&/padding-left:0px/.test(row)&&!/Bateau-Lavoir/.test(h),'joueur : lieu révélé au parent préparé affiché à la racine');}
  ok(r(`JSON.stringify(fiEyeKeys(S.fiches.fva))`)==='["desc","sait","fief","pers","orgs","obj","carte"]'&&!r(`fiEyeKeys(S.fiches.paris).includes('fief')`),'yeux : bloc Fief seulement pour un lieu de type Fief');
  /* rattachement par nom (gestion) */
  r(`ME='lorenzo';S.edit=true;`);
  ok(r(`fi6RattCands().length`)===2,'rattachement : 2 propositions (fief texte, possession notable = objet)');
  r(`fi6RattAct('fi6RtAll',{})`);
  ok(r(`S.chars.kerian.situ.fiefs[0].f==='fva'`),'rattachement : la ligne Fiefs de Kerian est reliée à la fiche');
  ok(r(`(S.fiches.lant.det||[]).some(x=>x.id==='kerian')&&!(S.chars.kerian.situ.possN||[]).length`),'rattachement : possession texte → Kerian détenteur de l\'objet (ligne texte retirée)');
  ok(r(`fi6RattCands().length`)===0,'rattachement : plus de proposition');
  /* fief et onglet Gestion */
  ok(r(`fi6CharLinks('fva').some(x=>x.c.id==='kerian'&&x.nat==='fief')&&!!fi6Tabs(S.fiches.fva)`),'fief : détenteur PJ affiché sur le lieu, onglets Fiche | Gestion');
  ok(r(`S.fiTab='gest';S.fi='fva';/Arrive au lot 7/.test(fiFicheView(S.fiches.fva))`),'onglet Gestion : « Arrive au lot 7 »');r(`S.fiTab='';`);
  /* joueur : ajout d'un propriétaire depuis le lieu */
  r(`ME='alice';S.edit=false;S.fi='paris';fi6Act('fi6Lk',{m:'pers',n:'prop'});S.dlg.cid='hector';fi6Act('fi6LkSave',{});`);
  const hl=r(`JSON.stringify((S.chars.hector.situ||{}).lieux||[])`);
  ok(/"f":"paris"/.test(hl)&&/"nat":"prop"/.test(hl),'joueur : « + Propriétaire » sur Paris inscrit le lien dans la Situation d\'Hector');
  ok(r(`fi6CharLinks('paris').some(x=>x.c.id==='hector'&&x.nat==='prop')`)&&/Propriétaires/.test(r(`fi6Blocks(S.fiches.paris)`)),'fiche Paris : Hector dans Personnages liés › Propriétaires');
  ok(/Hector Durvoy/.test(r(`fiMentionsHtml(fiMentions('fiche','paris'))`)),'Mentions de Paris : Hector (Situation)');
  r(`fi6Act('fi6Lk',{m:'pers',n:'res'});`);ok(!r(`fi6CV().some(c=>c.id==='armand')`)&&!/Armand/.test(r(`fiSheet(S.dlg)`)),'joueur : PNJ préparé non proposé');r(`S.dlg=null;`);
  {const sid=r(`S.chars.hector.situ.lieux[0].id`);r(`fi6Act('fi6Unlk',{m:'ch',c:'hector',k:'lieux',s:${JSON.stringify(sid)}})`);ok(!r(`fi6CharLinks('paris').length`),'retrait du lien depuis le lieu : retiré de la Situation');}
  /* objet unique, détenteurs, emplacement */
  r(`S.fi='compas';fi6Act('fi6Lk',{m:'det'});S.dlg.cid='kerian';fi6Act('fi6LkSave',{});fi6Act('fi6Lk',{m:'det'});S.dlg.cid='hector';`);
  ok(/ne le détiendra plus/.test(r(`fiSheet(S.dlg)`)),'objet unique : avertissement avant de changer de détenteur');
  r(`fi6Act('fi6LkSave',{})`);ok(r(`S.fiches.compas.det.length===1&&S.fiches.compas.det[0].id==='hector'`),'objet unique : le nouveau détenteur remplace l\'ancien');
  ok(r(`fi6ObjsOf('hector').some(o=>o.id==='compas')&&situObjRows(S.chars.hector).join('').includes('compas')`),'Situation › Possessions d\'Hector : le compas (calculé)');
  r(`fi6Act('fi6Lk',{m:'emp'});S.dlg.lid='montm';fi6Act('fi6LkSave',{});`);
  ok(/Le compas d/.test(r(`fi6Blocks(S.fiches.montm)`))&&/emplacement/.test(r(`fiMentionsHtml(fiMentions('fiche','montm'))`)),'emplacement : objet présent à Montmartre, Mentions');
  ok(/Collection privée/.test(r(`fi6Blocks(S.fiches.compas)`))&&/Le compas/.test(r(`fi6Blocks(S.fiches.coll)`)),'collection : « Fait partie de » et Objets contenus');
  /* Situation : possession avec fiche */
  r(`S.dlg={kind:'situEd',cid:'kerian',k:'poss',i:null,f:{nom:'',f:'paris'}};situSaveF(S.chars.kerian,S.dlg);`);
  ok(r(`(S.chars.kerian.situ.lieux||[]).some(e=>e.f==='paris'&&e.nat==='prop')`),'Possession « Paris » (lieu) → Résidence et lieux, propriétaire');
  /* suppression */
  r(`ME='lorenzo';S.edit=true;fiRemove('montm');`);
  ok(r(`S.fiches.lavoir.parent==='paris'&&S.fiches.compas.lieu&&!S.fiches.compas.lieu.f&&S.fiches.compas.lieu.nom==='Montmartre'`),'suppression d\'un lieu : lieux contenus remontés, emplacement repassé en texte');
  r(`fiRemove('paris');`);ok(r(`(S.chars.kerian.situ.lieux||[]).every(e=>!e.f&&e.nom==='Paris')`),'suppression : la Situation garde le nom en texte');
  r(`fiRemove('coll');`);ok(r(`S.fiches.compas.parent===''`),'suppression d\'une collection : objets contenus détachés');
  /* Visiteur */
  r(`ME='alice';S.edit=false;S.visit=true;`);ok(!r(`fiCanEd(S.fiches.fva)`)&&!/data-act="fi6Lk"/.test(r(`fi6Blocks(S.fiches.fva)`)),'Visiteur : lecture seule');r(`S.visit=false;`);
}
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.jpg':'image/jpeg'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
  s.listen(0,()=>res(s));});}
function fakeDb(docs){const rows=Object.entries(docs).map(([k,data])=>{const [coll,id]=k.split('/');return {coll,id,data};});
  const J=(route,b)=>route.fulfill({status:200,contentType:'application/json',body:b===undefined?'':JSON.stringify(b)});
  return {rows,get:k=>{const [c,i]=k.split('/');const x=rows.find(r=>r.coll===c&&r.id===i);return x&&x.data;},all:c=>rows.filter(r=>r.coll===c).map(r=>r.data),async handle(route){const fn=route.request().url().split('/rpc/')[1];const a=JSON.parse(route.request().postData()||'{}');
    if(fn==='xp_list')return J(route,rows);
    if(fn==='xp_since')return J(route,{rows:[],del:[],now:new Date().toISOString()});
    if(fn==='xp_set'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);const r={coll:a.p_coll,id:a.p_id,data:a.p_data};if(i>=0)rows[i]=r;else rows.push(r);return J(route);}
    if(fn==='xp_delete'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);if(i>=0)rows.splice(i,1);return J(route);}
    if(fn==='xp_portraits')return J(route,[]);
    if(/^xp_img/.test(fn))return J(route,null);
    return route.fulfill({status:404,body:'absent'});}};}
async function open(browser,base,db,me){const ctx=await browser.newContext({viewport:{width:420,height:900}});const page=await ctx.newPage();const errs=[];
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
const wait=page=>page.waitForTimeout(200);


const DBG=process.env.DBG;
(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));
  try{
    if(!docsPath){
      console.log('2. Joueur');
      {const {page,errs,ctx}=await open(browser,base,db,'alice');
        await page.evaluate(()=>{S.view='univers';S.uni='lieu';S.fi=null;render();});let t=await txt(page);
        ok(/Paris/.test(t)&&/La cave secrète/.test(t)&&!/Bateau-Lavoir/.test(t),'liste des lieux (joueur) : préparé absent, enfant remonté');
        await page.evaluate(()=>{S.fi='paris';render();});t=await txt(page);if(DBG)console.log(t);
        ok(/Lieux contenus/i.test(t)&&/Compléter/.test(t)&&/Personnage lié/i.test(t)&&!/Objets présents/i.test(t)&&!/Pas de carte/.test(t)&&!/Notes MJ/i.test(t),'fiche Lieu (joueur) : blocs remplis, vides dans « Compléter », sans Notes MJ (UX2)');
        await click(page,'[data-act="fi6Lk"][data-m="pers"][data-n="res"]');await fill(page,'cid','kerian');await click(page,'[data-act="fi6LkSave"]');await page.waitForTimeout(300);
        ok(((db.get('chars/kerian').situ||{}).lieux||[]).some(e=>e.f==='paris'&&e.nat==='res'),'joueur : « + Résident » enregistré dans la Situation de Kerian');
        await page.evaluate(()=>{S.view='sheet';S.sel='kerian';S.shTab='situ';render();});t=await txt(page);if(DBG)console.log(t);
        ok(/Résidence et lieux/i.test(t)&&/Paris/.test(t)&&/· résidence/.test(t),'Situation de Kerian : Résidence et lieux (Paris, résidence)');
        await page.evaluate(()=>{S.view='univers';S.uni='objet';S.fi=null;render();});t=await txt(page);
        ok(/Collection privée/.test(t)&&/Uniques/.test(t),'liste des objets : collections, filtre Uniques');
        await page.evaluate(()=>{S.fi='compas';render();});t=await txt(page);
        ok(/Effet/i.test(t)&&/Caractéristiques/i.test(t)&&/Détenteur et emplacement/i.test(t)&&/Fait partie de/i.test(t)&&/Unique/i.test(t),'fiche Objet : Effet, Caractéristiques, Détenteur et emplacement, collection, Unique');
        ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
      console.log('3. Gestion');
      {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
        await page.evaluate(()=>{S.edit=true;S.view='univers';S.uni='lieu';S.fi='fva';render();});let t=await txt(page);if(DBG)console.log(t);
        ok(/Fief/i.test(t)&&/Situation féerique/i.test(t)&&!/sur 7 visibles/i.test(t),'fief (gestion) : bloc Fief ; un seul œil de fiche (UX2)');
        await page.evaluate(()=>{S.fi='lavoir';render();});t=await txt(page);ok(await page.evaluate(()=>!!document.querySelector('.ibtn.prepi[data-act="fiEye"][data-k="fiche"]')),'lieu préparé : œil barré dans l\'en-tête (UX2)');
        await page.evaluate(()=>{S.view='params';S.ptab='donnees';render();});t=await txt(page);ok(/Rattachement par nom/i.test(t),'Paramètres › Données : rattachement par nom');
        ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    }
    console.log('4. Tour des écrans (gestion puis joueur)');
    const PL=Object.entries(DOCS).filter(([k])=>k.startsWith('players/')).map(([,p])=>p).filter(p=>!p.parti);
    const MES=docsPath?[PL.find(p=>p.role==='MJ'||p.gestion),PL.find(p=>!(p.role==='MJ'||p.gestion)&&(p.persos||[]).length)].filter(Boolean).map(p=>p.id):['lorenzo','alice'];
    const CH=Object.values(DOCS).filter(x=>x&&x.court&&x.type).map(x=>x.id),FI=Object.values(DOCS).filter(x=>x&&x.genre&&['lieu','objet'].includes(x.genre)).map(x=>x.id);
    for(const me of MES){const {page,errs,ctx}=await open(browser,base,db,me);
      for(const st of [{view:'univers',uni:'lieu'},{view:'univers',uni:'objet'},{view:'params',ptab:'donnees'},...FI.map(id=>({view:'univers',uni:'lieu',fi:id})),...CH.map(id=>({view:'sheet',sel:id,shTab:'situ'}))])
        await page.evaluate(o=>{S.fi=null;S.dlg=null;Object.assign(S,o);render();},st);
      for(const id of FI)for(const m of ['pers','fief','det','emp'])await page.evaluate(([id,m])=>{S.fi=id;S.view='univers';S.dlg={kind:'fi6Lk',fid:id,m,nat:'res',cid:'',nom:'',lid:'',_k:'t'};render();},[id,m]);
      await page.evaluate(()=>{S.dlg=null;render();});
      ok(errs.length===0,me+' : aucune erreur sur tous les écrans'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})();
