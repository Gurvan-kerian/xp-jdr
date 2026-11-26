/* Lot 5 b (26/11/2026) : familles.
   Usage : node tests/lot5b.test.js [docs.json] [import-familles.json] — sans argument, données inventées construites ici.
   1. Calculs : arbre (branches puis vassales), membres (branche comprise, vassale exclue), Situation « par sa branche », en-tête,
      vassales sans fiche (+ Fiche), membres depuis la fiche, rattachement par nom, suppression, droits, import (appartenances).
   2. Navigateur : liste, fiche, Situation, fenêtres ; tour des écrans sans erreur (gestion puis joueur). */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp,setDocs}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-26T19:00:00.000Z';
const EYE={desc:true,sait:true,terr:true,mem:true,vas:true};
const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',kanka:'',vis:'rev',eye:EYE,desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan','kerian']},
    'chars/kerian':ch('kerian','Kerian','PJ',{race:'Elfe',traits:[],situ:{familles:[{id:'k1',nom:'Aldébard Trieste',f:'tri'}]}}),
    'chars/sloan':ch('sloan','Sloan','PJ',{race:'Elfe',traits:[],genre:'f',situ:{familles:[{id:'s1',nom:'Frédon'}]}}),
    'chars/swen':ch('swen','Swen VI','PNJ',{race:'Elfe',rang:'Cador',situ:{familles:[{id:'w1',nom:'Aldébard',f:'ald'},{id:'w2',nom:'Frédon',f:'fre'}]}}),
    'chars/gavin':ch('gavin','Gavin Alicarne','PNJ',{race:'Elfe',rang:'Cador',situ:{familles:[{id:'g1',nom:'Alicarne',f:'ali'}]}}),
    'chars/oria':ch('oria','Oriande Alicarne','PNJ',{race:'Elfe',rang:'Cador',genre:'f',situ:{familles:[{id:'o1',nom:'Alicarne',f:'ali'}]}}),
    'fiches/ald':fi('ald','famille','Aldébard',{type:'Majeure',devise:'Plus haut que tous',race:'Elfe',speci:'Royauté',terr:'Italie et sud de l\'Europe',vasx:[{id:'v1',nom:'Dalembard'}]}),
    'fiches/tri':fi('tri','famille','Aldébard Trieste',{type:'Branche',parent:'ald'}),
    'fiches/ali':fi('ali','famille','Alicarne',{type:'Mineure',parent:'ald',devise:"Par l'esprit, non par l'épée"}),
    'fiches/fre':fi('fre','famille','Frédon',{type:'Majeure'}),
    'fiches/pel':fi('pel','famille','Pellinore',{type:'Mineure',parent:'fre',vis:'prep',eye:{}}),
    'fiches/mod':fi('mod','lieu','Modène',{type:'Ville',orgs:[{id:'y1',f:'ali',nom:'Alicarne'}]}),
    'gains/all':{events:[]}};}
const docsPath=process.argv[2],impPath=process.argv[3];const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();

console.log('1. Calculs');
{const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','planning','donnees']),r=c=>app.run(c);
  setDocs(app,docsPath?DOCS:demoDocs());
  r(`toast=function(){};S.fiches={};for(const k in __docs)if(k.startsWith('fiches/'))S.fiches[k.slice(7)]=JSON.parse(JSON.stringify(__docs[k]));S.fichesReady=true;S.ptr={};`);
  r(`ME='lorenzo';S.edit=true;S.visit=false;S.asPlayer=false;`);
  if(!docsPath){
    /* arbre */
    r(`S.fiTree={ald:true};`);{const h=r(`fiListBody('famille')`),i=x=>h.indexOf(x);
      ok(i('Aldébard Trieste')>0&&i('Aldébard Trieste')<i('Alicarne'),'liste : branche avant vassale');
      ok(/Majeure · 1 branche · 1 vassale/.test(h)&&/Mineure · vassale/.test(h)&&/>Branche</.test(h),'liste : sous-titres (majeure, vassale, branche)');}
    ok(r(`faUp(S.fiches.tri).map(x=>x.id).join()`)==='ald'&&r(`faUp(S.fiches.ali).length`)===0,'branche → famille mère ; vassale → rien');
    /* membres */
    {const L=r(`JSON.stringify(faMembers(S.fiches.ald).map(m=>[m.key,m.br&&m.br.id]))`);
      ok(L==='[["kerian","tri"],["swen",null]]','Aldébard : Kerian par sa branche, Swen en direct ; Alicarne (vassale) exclue');}
    {const h=r(`faBlocks(S.fiches.ald)`);ok(/Branche · Aldébard Trieste/.test(h)&&/Kerian/.test(h)&&/Dalembard/.test(h)&&/Lieux liés|Territoires/.test(h),'blocs : groupe de branche, vassale sans fiche, territoires');
      ok(/aussi Frédon/.test(h),'membre dans deux familles : « aussi Frédon »');}
    ok(/Modène/.test(r(`faBlocks(S.fiches.ali)`)),'Territoires : lieu lié calculé (bloc Organisations et familles du lieu)');
    {const h=r(`faHeadKv(S.fiches.ald)`)+r(`faSub(S.fiches.tri).join('')`)+r(`faSub(S.fiches.ali).join('')`);ok(/Plus haut que tous/.test(h)&&/Royauté/.test(h)&&/branche de/.test(h)&&/vassale de/.test(h),'en-tête : devise, race, spécificité, branche de / vassale de');}
    /* Situation */
    {const h=r(`faSitRows(S.chars.kerian).join('')`);ok(/Aldébard Trieste/.test(h)&&/par sa branche/.test(h)&&/>Branche</.test(h),'Situation de Kerian : Aldébard · par sa branche');}
    ok(!/par sa branche/.test(r(`faSitRows(S.chars.gavin).join('')`)),'Situation de Gavin (vassale) : pas d\'appartenance au suzerain');
    ok(/Frédon/.test(r(`viewSituation(S.chars.sloan)`)),'Situation d\'un PJ : bloc Familles');
    /* vassale sans fiche → fiche */
    r(`S.fi='ald';faAct('faVasF',{i:'v1'});`);{const x=r(`JSON.stringify(Object.values(S.fiches).find(f=>f.nom==='Dalembard'))`);
      ok(/"type":"Mineure"/.test(x)&&/"parent":"ald"/.test(x)&&!r(`(S.fiches.ald.vasx||[]).length`),'« + Fiche » : Dalembard créée (Mineure, vassale), nom retiré');}
    r(`faAct('faVas',{});S.dlg.nom='Hastain';faAct('faVasSave',{});`);ok(r(`S.fiches.ald.vasx.some(y=>y.nom==='Hastain')`),'+ Nom sans fiche');
    r(`faAct('faVas',{});S.dlg.nom='hastain';faAct('faVasSave',{});`);ok(/Déjà/.test(r(`S.dlg.err`)),'doublon refusé');r(`S.dlg=null;`);
    /* membres depuis la fiche */
    r(`S.fi='fre';faAct('faMem',{k:''});S.dlg.cid='sloan';S.dlg.note='par sa mère';faAct('faMemSave',{});`);
    ok(r(`S.chars.sloan.situ.familles.length===1&&S.chars.sloan.situ.familles[0].f==='fre'&&S.chars.sloan.situ.familles[0].note==='par sa mère'`),'+ Membre : ligne en texte du même nom reliée (pas de doublon)');
    r(`faAct('faMem',{k:''});S.dlg.nom='Aodren';faAct('faMemSave',{});`);ok(r(`S.fiches.fre.mbx.some(x=>x.nom==='Aodren')`),'+ Membre en texte');
    r(`faAct('faMem',{k:'sloan'});faAct('faMemDel',{});faAct('faMemDel',{});`);ok(!r(`(S.chars.sloan.situ.familles||[]).length`),'retrait d\'un membre : ligne retirée de la Situation');
    /* rattachement par nom */
    r(`S.chars.sloan.situ.familles=[{id:'s2',nom:'Frédon'}];`);ok(r(`fi6RattCands().some(x=>x.c.id==='sloan'&&x.k==='familles'&&x.x.id==='fre')`),'rattachement par nom : Frédon (texte) → fiche');
    /* droits */
    r(`S.fi='ald';ogAct('fiOEyeM',{k:'swen'});ME='anne';S.edit=false;`);
    {const h=r(`faBlocks(S.fiches.ald)`);ok(!/Swen/.test(h)&&/Kerian/.test(h),'joueur : membre masqué absent');}
    ok(!/Pellinore/.test(r(`fiListBody('famille')`)),'joueur : famille préparée invisible');
    ok(r(`fiCanEd(S.fiches.ald)`)&&/data-act="faMem"/.test(r(`faBlocks(S.fiches.ald)`)),'joueur : peut compléter une famille révélée (principe du 25/11)');
    r(`S.visit=true;`);ok(!/data-act="faMem"/.test(r(`faBlocks(S.fiches.ald)`)),'Visiteur : lecture seule');r(`S.visit=false;ME='lorenzo';S.edit=true;`);
    /* suppression */
    r(`fiRemove('tri');`);ok(r(`S.chars.kerian.situ.familles[0].nom==='Aldébard Trieste'&&!S.chars.kerian.situ.familles[0].f`),'suppression : Situation repassée en texte');
    /* import : appartenances */
    {r(`S.chars.kerian.situ.familles=[{id:'k1',nom:'Aldébard Trieste'},{id:'k2',nom:'Aldébard'}];S.fiches.tri=${JSON.stringify(demoDocs()['fiches/tri'])};`);
      const F={format:'xp-import',v:1,genre:'famille',items:[{id:'tri',data:{nom:'Aldébard Trieste',type:'Branche',parent:'ald'}},{id:'ald',data:{nom:'Aldébard',type:'Majeure'}}],membres:[{c:'kerian',o:'tri'},{c:'kerian',o:'ald'},{c:'absent',o:'ald'}]};
      const M=r(`(()=>{const M=kkFamMem(${JSON.stringify(F)},false);for(const n of M.save)S.chars[n.id]=n;return JSON.stringify({n:M.n,ko:M.ko.length,L:S.chars.kerian.situ.familles})})()`);
      ok(/"n":1/.test(M)&&/"ko":1/.test(M)&&/"f":"tri"/.test(M)&&!/"nom":"Aldébard"[,}]/.test(M),'import : branche reliée, famille mère (doublon Kanka) retirée, personnage absent compté');
      ok(r(`kkFamMem(${JSON.stringify(F)},true).n`)===0,'import : relance sans effet');}
  }
  if(impPath){const F=JSON.parse(fs.readFileSync(impPath,'utf8'));r(`S.kk={step:'apercu',F:${JSON.stringify(F)},nomF:'f',mode:'maj'};kkPlan();`);
    ok(r(`S.kk.plan.length`)===F.items.length&&r(`S.kk.plan.every(x=>x.act==='new'||x.act==='same'||x.act==='maj')`),'fichier d\'import : '+F.items.length+' familles dans l\'aperçu');
    ok(r(`S.kk.mem.n`)>0&&r(`S.kk.mem.ko.length`)===0,'fichier d\'import : '+r(`S.kk.mem.n`)+' Situations complétées, aucun personnage absent');
    ok(/Aperçu/.test(r(`kkView()`)),'fichier d\'import : écran d\'aperçu');}
}
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.jpg':'image/jpeg'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
  s.listen(0,()=>res(s));});}
function fakeDb(docs){const rows=Object.entries(docs).map(([k,data])=>{const [coll,id]=k.split('/');return {coll,id,data};});
  const J=(route,b)=>route.fulfill({status:200,contentType:'application/json',body:b===undefined?'':JSON.stringify(b)});
  return {rows,get:k=>{const [c,i]=k.split('/');const x=rows.find(r=>r.coll===c&&r.id===i);return x&&x.data;},async handle(route){const fn=route.request().url().split('/rpc/')[1];const a=JSON.parse(route.request().postData()||'{}');
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
const DBGR=process.env.DBG;
(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));
  try{
    if(!docsPath){
      console.log('2. Gestion');
      {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
        await page.evaluate(()=>{S.edit=true;S.view='univers';S.uni='famille';S.fi=null;S.fiTree={ald:true};render();});let t=await txt(page);
        ok(/Aldébard/.test(t)&&/Aldébard Trieste/.test(t)&&/Alicarne/.test(t),'liste des familles en arbre');
        await page.evaluate(()=>{S.fi='ald';render();});t=await txt(page);
        ok(/Présentation|Territoires/i.test(t)&&/Membres/i.test(t)&&/Vassales et branches/i.test(t)&&/Plus haut que tous/.test(t),'fiche Aldébard : en-tête et blocs');
        await click(page,'[data-act="faMem"][data-k=""]');await fill(page,'cid','gavin');await wait(page);let sh=await sheet(page);ok(/Note/i.test(sh)&&!/Ou en texte libre/i.test(sh),'fenêtre Membre : personnage choisi');
        await click(page,'[data-act="faMemSave"]');await page.waitForTimeout(300);
        ok(((db.get('chars/gavin').situ||{}).familles||[]).some(e=>e.f==='ald'),'membre ajouté depuis la fiche : enregistré dans la Situation');
        await click(page,'[data-act="fiHead"]');await wait(page);sh=await sheet(page);ok(/Devise/i.test(sh)&&/Race dominante/i.test(sh)&&/Spécificité/i.test(sh)&&/Suzerain/i.test(sh),'fenêtre d\'en-tête : devise, race, spécificité, suzerain');
        await fill(page,'devise','Toujours plus haut');await click(page,'[data-act="fiHeadSave"]');await page.waitForTimeout(300);ok(db.get('fiches/ald').devise==='Toujours plus haut','en-tête enregistré');
        await page.evaluate(()=>{S.view='sheet';S.sel='kerian';S.shTab='situ';render();});t=await txt(page);ok(/par sa branche/.test(t),'Situation de Kerian : famille par sa branche');
        await click(page,'[data-act="situEd"][data-k="familles"]:not([data-i])');await wait(page);sh=await page.evaluate(()=>(document.getElementById('sheetRoot')||document.body).innerText);ok(/Fiche/i.test(sh)&&/Aldébard/.test(sh),'fenêtre Situation › Famille : fiche proposée');
        await page.evaluate(()=>{S.dlg=null;render();});
        ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    }
    console.log('3. Tour des écrans (gestion puis joueur)');
    const PL=Object.entries(DOCS).filter(([k])=>k.startsWith('players/')).map(([,p])=>p).filter(p=>!p.parti);
    const MES=docsPath?[PL.find(p=>p.role==='MJ'||p.gestion),PL.find(p=>!(p.role==='MJ'||p.gestion)&&(p.persos||[]).length)].filter(Boolean).map(p=>p.id):['lorenzo','anne'];
    const CH=Object.values(DOCS).filter(x=>x&&x.court&&x.type).map(x=>x.id),FI=Object.values(DOCS).filter(x=>x&&x.genre==='famille').map(x=>x.id);
    let FI2=FI;
    for(const me of MES){const {page,errs,ctx}=await open(browser,base,db,me);
      if(impPath&&me===MES[0]){const F=JSON.parse(fs.readFileSync(impPath,'utf8'));
        await page.evaluate(F=>{S.view='params';S.ptab='donnees';S.kk={step:'apercu',F,nomF:'import-familles.json',mode:'maj'};kkPlan();render();kkRun();},F);
        await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:120000});const rep=await page.evaluate(()=>JSON.stringify(S.kk.rep));
        ok(/"nNew":22/.test(rep)&&/"nMem":39/.test(rep)&&/"imgOk":18/.test(rep)&&/"err":\[\]/.test(rep),'import complet simulé : 22 fiches, 39 Situations, 18 blasons'+(DBGR?' '+rep:''));
        FI2=db.rows.filter(r=>r.coll==='fiches'&&r.data.genre==='famille').map(r=>r.id);
        const k=await page.evaluate(()=>JSON.stringify((S.chars.kerian.situ||{}).familles));ok(/Aldébard Trieste/.test(k)&&!/"nom":"Aldébard"/.test(k),'Kerian : branche seule après import');
        await page.evaluate(()=>{S.view='sheet';S.sel='kerian';S.shTab='situ';render();});ok(/par sa branche/.test(await txt(page)),'Situation de Kerian : Aldébard par sa branche');
        await page.evaluate(F=>{S.kk={step:'apercu',F,nomF:'f',mode:'maj'};kkPlan();},F);ok(await page.evaluate(()=>S.kk.plan.every(x=>x.act==='same')&&S.kk.mem.n===0),'relance : rien à faire');await page.evaluate(()=>{S.kk=null;});}
      for(const st of [{view:'univers',uni:'famille'},{view:'params',ptab:'donnees'},...FI2.map(id=>({view:'univers',uni:'famille',fi:id})),...CH.map(id=>({view:'sheet',sel:id,shTab:'situ'}))])
        await page.evaluate(o=>{S.fi=null;S.dlg=null;Object.assign(S,o);render();},st);
      for(const id of FI2.slice(0,4))for(const k of ['faMem','faVas','fiHead'])await page.evaluate(([id,k])=>{S.view='univers';S.uni='famille';S.fi=id;S.dlg=null;render();try{fiAct(k,{k:'',i:''});}catch(e){console.error(e.message);}},[id,k]);
      await page.evaluate(()=>{S.dlg=null;render();});
      ok(errs.length===0,me+' : aucune erreur sur tous les écrans'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})();
