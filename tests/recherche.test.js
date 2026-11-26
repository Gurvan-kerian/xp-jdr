/* Recherche globale + import des pouvoirs et capacités (26/11/2026).
   Usage : node tests/recherche.test.js [docs.json] [import-pouvoirs.json ...] — sans argument, données inventées construites ici.
   1. Navigateur (joueur) : loupe, écran Recherche, noms et textes, accents, visibilité, filtres, aucun résultat, Ctrl + K, Échap, ouverture d'un résultat.
   2. Navigateur (gestion) : fiche préparée trouvée avec l'étiquette, Notes MJ ; import des pouvoirs « ajout seulement ». */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-26T20:00:00.000Z';
const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',kanka:'',vis:'rev',eye:{desc:true,sait:true,pers:true,orgs:true,obj:true,carte:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
const PX='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'chars/sloan':ch('sloan','Sloan','PJ',{race:'Elfe',traits:[]}),
    'chars/ismael':ch('ismael','Ismaël','PNJ',{race:'Elfe',rang:'Cador',surnom:'le Veilleur',por:{role:"Gardien du passage vers l'Hiver"}}),
    'chars/cache':ch('cache','Inconnu','PNJ',{race:'Elfe',rang:'Cador',vis:'prep'}),
    'fiches/hiver':fi('hiver','lieu',"Pays d'Hiver",{type:'Royaume'}),
    'fiches/jardin':fi('jardin','lieu',"Jardin d'hiver",{type:'Lieu public'}),
    'fiches/bois':fi('bois','lieu','Bois de Boulogne',{desc:"Un passage vers l'@[fiche:hiver|Pays d'Hiver] s'ouvrirait près de la cascade.",notes:'Brocéliande en secret'}),
    'fiches/cour':fi('cour','org',"Cour d'Hiver",{vis:'prep',eye:{}}),
    'fiches/glace':fi('glace','objet','Épée de glace',{desc:'Forgée en Brocéliande.'}),
    'meta/pouvoirs':{byId:{'pw-charme':{nom:'Charme',desc:'Texte de l\'appli',type:'',act:'',cib:'',dur:'',por:'',res:'',zon:'',kanka:'',prec:false,fx:[],var:[],cat:'ordinaire',nat:''}}},
    'meta/capacites':{byId:{'cap-ailes':{nom:'Ailes',desc:'',type:'passif',act:'',cib:'',dur:'',por:'',res:'',zon:'',kanka:'',prec:false,fx:[],var:[],nat:''}}},
    'portraits/ill-cap-cap-ailes':{img:'ANCIENNE',t:1},
    'gains/all':{events:[]}};}
const docsPath=process.argv[2],impF=process.argv.slice(3);const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();
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
const txt=page=>page.evaluate(()=>document.getElementById('app').innerText);
const res=page=>page.evaluate(()=>(document.getElementById('srchRes')||{}).innerText||'');
const wait=(page,n)=>page.waitForTimeout(n||200);
const type=async(page,v)=>{await page.fill('#srchQ',v);await wait(page,150);};
const SHOTS=process.env.SHOTS;
(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));
  try{
    if(!docsPath){
      console.log('1. Navigateur (joueur)');
      {const {page,errs,ctx}=await open(browser,base,db,'anne');
        ok(await page.evaluate(()=>!!document.getElementById('srBtn')&&!document.getElementById('srBtn').hidden),'loupe dans l\'en-tête');
        await page.click('#srBtn');await wait(page);
        ok(await page.evaluate(()=>S.view==='srch'&&document.activeElement&&document.activeElement.id==='srchQ'),'loupe : écran Recherche, curseur dans la barre');
        ok(/Tape au moins 2 lettres/.test(await res(page)),'avant de taper : aide');
        await type(page,'h');ok(/Tape au moins 2 lettres/.test(await res(page)),'1 lettre : pas de résultat');
        await type(page,'HIVER');let t=await res(page);
        ok(/Dans les noms · 2/.test(t)&&/Pays d'Hiver/.test(t)&&/Jardin d'hiver/.test(t),'noms trouvés sans tenir compte des majuscules');
        ok(!/Cour d'Hiver/.test(t),'fiche préparée : absente pour un joueur');
        ok(/Dans les textes/.test(t)&&/Bois de Boulogne/.test(t)&&/Description/.test(t)&&/Ismaël/.test(t)&&/Portrait › Rôle/.test(t),'textes : extrait et emplacement (description, Portrait du PNJ)');
        ok(await page.evaluate(()=>/<mark>Hiver<\/mark>/.test(document.getElementById('srchRes').innerHTML)),'mot surligné dans l\'extrait');
        ok(await page.evaluate(()=>document.activeElement&&document.activeElement.id==='srchQ'),'la saisie garde le curseur');
        await type(page,'broceliande');t=await res(page);ok(/Épée de glace/.test(t)&&!/Notes MJ/.test(t),'accents ignorés ; Notes MJ jamais pour un joueur');
        await type(page,'veilleur');if(process.env.DBG)console.log(await res(page),await page.evaluate(()=>JSON.stringify(S.chars.ismael.surnom)));{const h=await page.evaluate(()=>document.getElementById('srchRes').innerHTML);ok(/<b>Ismaël<\/b>/.test(h)&&/« le <mark>Veilleur<\/mark> »/.test(h),'surnom trouvé (nom principal affiché)');}
        await type(page,'hiver');await page.evaluate(()=>document.querySelector('[data-act="srG"][data-v="lieu"]').click());await wait(page);t=await res(page);
        ok(/Pays d'Hiver/.test(t)&&!/Ismaël/.test(t),'filtre Lieux');
        await type(page,'ismael');t=await res(page);ok(/Aucun résultat dans « Lieux »/.test(t)&&/Chercher dans tout l'univers/.test(t),'filtre sans résultat : message et bouton');
        await page.evaluate(()=>document.querySelector('[data-act="srG"][data-v="all"]').click());await wait(page);ok(/Ismaël/.test(await res(page)),'chercher dans tout l\'univers');
        await type(page,'zzzz');ok(/Rien pour « zzzz »/.test(await res(page)),'aucun résultat');
        if(SHOTS){await type(page,'hiver');await page.evaluate(()=>{S.srch.g='all';srPaint();});await page.screenshot({path:path.join(SHOTS,'recherche-resultats.png'),fullPage:true});}
        await type(page,'pays');await page.evaluate(()=>document.querySelector('#srchRes [data-act="lnk"][data-id="hiver"]').click());await wait(page,300);
        ok(await page.evaluate(()=>S.view==='univers'&&S.fi==='hiver'),'clic : la fiche s\'ouvre');ok(/depuis Recherche/.test(await txt(page)),'barre « ‹ Retour depuis Recherche »');
        await page.evaluate(()=>history.back());await wait(page,400);ok(await page.evaluate(()=>S.view==='srch'&&document.getElementById('srchQ').value==='pays'),'retour : la recherche est retrouvée');
        await page.evaluate(()=>{S.srch.q='';render();});await wait(page);t=await res(page);if(process.env.DBG)console.log(t);ok(/Recherches récentes/i.test(t)&&/pays/.test(t)&&/Ouverts récemment/i.test(t)&&/Pays d'Hiver/.test(t),'recherches récentes et fiches ouvertes');
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'recherche-ouverte.png'),fullPage:true});
        await page.keyboard.press('Escape');await wait(page,400);ok(await page.evaluate(()=>S.view!=='srch'),'Échap : ferme la recherche');
        await page.evaluate(()=>{S.view='team';render();document.activeElement&&document.activeElement.blur();});await page.keyboard.press('Control+k');await wait(page);ok(await page.evaluate(()=>S.view==='srch'),'Ctrl + K : ouvre la recherche');
        await page.evaluate(()=>{S.view='team';render();document.activeElement&&document.activeElement.blur();});await page.keyboard.press('/');await wait(page);ok(await page.evaluate(()=>S.view==='srch'),'« / » : ouvre la recherche');
        ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
      console.log('2. Navigateur (gestion)');
      {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
        await page.evaluate(()=>srOpen());await wait(page);await type(page,'hiver');let t=await res(page);
        ok(/Cour d'Hiver/.test(t)&&/préparée/i.test(t),'gestion : fiche préparée trouvée avec l\'étiquette');
        await type(page,'broceliande');ok(/Notes MJ/.test(await res(page)),'gestion : Notes MJ');
        /* import des pouvoirs : ajout seulement */
        const F={format:'xp-import',v:1,genre:'pw',date:'2026-11-26',items:[{id:'pw-charme',kanka:'https://app.kanka.io/w/350361/entities/1',data:{nom:'Charme',kanka:'https://app.kanka.io/w/350361/entities/1',type:'actif',act:'Féérie + Prestance',desc:'Texte Kanka'},imgs:[{k:'ill-pw-pw-charme',th:PX,big:PX}]}]};
        await page.evaluate(F=>{S.view='params';S.ptab='donnees';S.edit=true;S.kk={step:'apercu',F,nomF:'f.json',mode:'maj'};kkPlan();S._force=true;render();},F);
        t=await txt(page);if(process.env.DBG)console.log(t.slice(0,1500));ok(/à mettre à jour/.test(t)&&/activation/.test(t)&&/gardé : description/.test(t),'aperçu : champs vides ajoutés, description gardée');
        await page.evaluate(()=>kkRun());await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:30000});
        const p=await page.evaluate(()=>S.pouvoirs['pw-charme']);ok(p.act==='Féérie + Prestance'&&p.type==='actif'&&p.desc==='Texte de l\'appli'&&/entities\/1$/.test(p.kanka),'import : activation, type et lien ajoutés ; description inchangée');
        await wait(page,400);const sv=db.get('meta/pouvoirs');ok(sv&&sv.byId['pw-charme'].act==='Féérie + Prestance','catalogue enregistré');
        ok(await page.evaluate(()=>!!S.ptr['ill-pw-pw-charme'])&&!!db.imgs['ill-pw-pw-charme'],'illustration enregistrée (vignette et grande image)');
        const G={format:'xp-import',v:1,genre:'cap',date:'2026-11-26',items:[{id:'cap-ailes',kanka:'https://app.kanka.io/w/350361/entities/2',data:{nom:'Ailes',kanka:'https://app.kanka.io/w/350361/entities/2',type:'actif',desc:'Ailes de Kanka'},imgs:[{k:'ill-cap-cap-ailes',th:PX,big:PX}]}]};
        await page.evaluate(F=>{S.kk={step:'apercu',F,nomF:'g.json',mode:'maj'};kkPlan();},G);
        if(process.env.DBG)console.log(await page.evaluate(()=>JSON.stringify({i:S.kk.plan[0].imgTodo.length,u:S.kk.plan[0].up,k:S.kk.plan[0].keep,a:S.kk.plan[0].act})));ok(await page.evaluate(()=>S.kk.plan[0].imgTodo.length===0&&S.kk.plan[0].up.slice().sort().join()==='desc,kanka'&&S.kk.plan[0].keep.join()==='type'),'capacité : illustration existante gardée, type gardé, description vide remplie');
        await page.evaluate(()=>kkRun());await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:30000});
        ok(await page.evaluate(()=>S.capacites['cap-ailes'].desc==='Ailes de Kanka'&&S.ptr['ill-cap-cap-ailes']==='ANCIENNE'),'capacité importée sans toucher à l\'illustration');
        await page.evaluate(F=>{S.kk={step:'apercu',F,nomF:'f',mode:'maj'};kkPlan();},F);ok(await page.evaluate(()=>S.kk.plan.every(x=>x.act==='same'&&!x.imgTodo.length)),'relance : rien à faire');
        await page.evaluate(()=>{S.kk={step:'rep',rep:S.kkImp.pw};S._force=true;render();});ok(/Pouvoirs/.test(await txt(page)),'compte rendu');
        await page.evaluate(()=>{S.kk=null;S.view='univers';S.uni='pouvoirs';S._force=true;render();});ok(/Charme/.test(await txt(page)),'catalogue affiché');
        ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    } else {
      console.log('Données réelles');
      const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      for(const q of ['x','paris','hiver','kerian','fee','charme','broceliande','hiver'])await page.evaluate(q=>{S.view='srch';S.srch={q,g:'all',more:true};S._force=true;render();},q);
      ok(/Dans les noms/.test(await res(page)),'recherche sur les données réelles');
      for(const p of impF){const F=JSON.parse(fs.readFileSync(p,'utf8'));await page.evaluate(F=>{S.edit=true;S.kk={step:'apercu',F,nomF:'f',mode:'maj'};kkPlan();},F);
        const n=await page.evaluate(()=>({n:S.kk.plan.length,neu:S.kk.plan.filter(x=>x.act==='new').length,maj:S.kk.plan.filter(x=>x.act==='maj').length,img:S.kk.plan.reduce((s,x)=>s+x.imgTodo.length,0),keep:S.kk.plan.filter(x=>x.keep&&x.keep.length).length}));
        ok(n.n===F.items.length&&n.neu===0,path.basename(p)+' : '+n.n+' éléments, '+n.maj+' à compléter, '+n.img+' images, '+n.keep+' avec champs gardés, aucun créé');
        await page.evaluate(()=>kkRun());await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:120000});
        const rep=await page.evaluate(()=>S.kk.rep);ok(!rep.err.length&&!rep.imgKo.length,path.basename(p)+' : import simulé sans erreur');}
      for(const s of [{view:'univers',uni:'pouvoirs'},{view:'srch'}])await page.evaluate(o=>{S.kk=null;Object.assign(S,o);S._force=true;render();},s);
      ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})();
