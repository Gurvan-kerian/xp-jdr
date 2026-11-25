/* Lot 4 (25/11/2026) : PNJ v2, Bestiaire et ajustements.
   Usage : node tests/lot4.test.js [docs.json] — sans argument, données inventées (version 2) construites ici.
   1. Calculs (sans navigateur) : visibilité des PNJ préparés / révélés, féal, droits.
   2. Navigateur : Personnages PJ | PNJ, liste, fiche PNJ, création, alias, liens réciproques, Relations d'un PJ,
      Bestiaire, Univers sans l'entrée PNJ, session rattachée à un événement, traits et forme démasquée. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp,setDocs}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};

const GEN=loadApp(ROOT,['config','engine','modele']);
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/alice':{id:'alice',nom:'Alice',role:'Joueur',persos:['kerian']},
    'chars/kerian':ch('kerian','Kerian','PJ',{race:'Elfe',rel:[{id:'r1',pnj:'hector',niv:'contact',date:'2026-11-01'}],traits:[]}),
    'chars/hector':ch('hector','Hector Durvoy','PNJ',{race:'Gnome',rang:'Cador',situ:{orgs:[{id:'o1',nom:'Monarchie',role:'espion'}]}}),
    'chars/armand':ch('armand','Armand Lorgeril','PNJ',{race:'Elfe',vis:'prep',eye:{}}),
    'chars/ismael':ch('ismael','Ismaël','PNJ',{race:'Humain',pj:'kerian',pjDate:'2026-01-01'}),
    'gains/all':{events:[]}};}
const docsPath=process.argv[2];const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();

console.log('1. Calculs');
if(!docsPath){const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','planning']),r=c=>app.run(c);
  setDocs(app,demoDocs());
  r(`ME='alice';S.edit=false;`);
  ok(r(`vis(S.chars.hector)&&vis(S.chars.ismael)&&!vis(S.chars.armand)`),'joueur : PNJ sans réglage = révélé, féal visible, PNJ préparé invisible');
  ok(r(`ids().includes('hector')&&!ids().includes('armand')&&!relPnjs(S.chars.kerian).some(p=>p.id==='armand')`),'joueur : PNJ préparé absent des listes et des Relations');
  ok(r(`canEditC(S.chars.hector)&&canEditC(S.chars.ismael)&&canEditC(S.chars.kerian)`),'joueur : modifie un PNJ révélé, le féal de son PJ et son PJ');
  r(`ME='lorenzo';S.edit=false;`);
  ok(r(`vis(S.chars.armand)&&!canEditC(S.chars.hector)&&canEditC(S.chars.ismael)`),'gestion hors mode édition : voit le PNJ préparé ; PNJ en lecture, féal modifiable (actions de jeu)');
  r(`S.edit=true;`);ok(r(`canEditC(S.chars.hector)`),'gestion en mode édition : PNJ modifiable');
  ok(r(`JSON.stringify(shTabsOf(S.chars.hector).map(x=>x[0]))`)==='["por","situ","rel"]'&&r(`JSON.stringify(shTabsOf(S.chars.ismael).map(x=>x[0]))`)==='["por","situ","rel","prog"]','onglets : PNJ Portrait · Situation · Relations ; féal + Progression');
  ok(r(`shTabsOf(S.chars.kerian)[0][0]`)==='prog','PJ : onglets inchangés');
  ok(r(`pnBlkSee(S.chars.hector,'role')&&pnBlkSee(S.chars.hector,'orgs')`)&&r(`(ME='alice',!pnBlkSee(S.chars.hector,'autres')&&pnBlkSee(S.chars.hector,'orgs'))`),'PNJ existant : Portrait et Situation ouverts, Autres PNJ fermé');
  ok(r(`FI_G.bete&&FI_G.bete.noMj&&!FI_G.creatures`),'genre Bestiaire « bete », sans Notes MJ, distinct de « creatures »');
  ok(r(`(()=>{S.cal={date:{a:1900,m:5,j:9}};const f=chEvAuto({titre:'S12. La nuit des masques',type:'Scénario',pj:['kerian','x']});return f.num==='12.'&&f.nom==='La nuit des masques'&&f.type==='Scénario'&&f.pj.join()==='kerian'&&f.debut.j===9;})()`),'événement prérempli depuis une session (numéro, titre, type, PJ, date du jeu)');}

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
      let t=await txt(page);ok(/PJ · 1/.test(t)&&/PNJ · 2/.test(t),'sélecteur PJ · 1 | PNJ · 2 (le préparé ne compte pas)');
      await click(page,'[data-act="pnTeam"][data-v="pnj"]');await wait(page);t=await txt(page);
      ok(/Hector Durvoy/.test(t)&&/Ismaël/.test(t)&&!/Armand/.test(t),'liste des PNJ : préparé absent');
      ok(/Cador/.test(t)&&/Féal de Kerian/.test(t),'ligne : rang, féal');
      await page.evaluate(()=>{const i=document.querySelector('[data-pnq]');i.value='hec';i.dispatchEvent(new Event('input',{bubbles:true}));});
      t=await page.evaluate(()=>document.getElementById('pnRes').innerText);ok(/Hector/.test(t)&&!/Ismaël/.test(t),'recherche');
      await page.evaluate(()=>{const s=document.querySelector('[data-pnf="orgs"]');s.value='Monarchie';s.dispatchEvent(new Event('change',{bubbles:true}));});await wait(page);
      t=await txt(page);if(DBG)console.log(t);ok(/Monarchie · 1/i.test(t),'filtre Organisation (groupe au nom de la valeur)');
      await page.evaluate(()=>{S.pnF={};S.pnQ='';render();});
      await click(page,'[data-act="sel"][data-id="hector"]');await wait(page);t=await txt(page);
      ok(/Portrait/.test(t)&&/Situation/.test(t)&&/Relations/.test(t)&&!/Progrès/.test(t)&&!/XP dispo/.test(t),'fiche PNJ : Portrait, Situation, Relations ; ni Progrès ni bandeau XP');
      if(DBG)console.log(t);ok(/Rang\s*Cador/.test(t)&&/Mentions/i.test(t),'rang dans l\'en-tête, Mentions');
      ok(!(await page.$('.pchips')),'pas de rangée de médaillons sur une fiche PNJ non rattaché');
      await click(page,'[data-act="pnTxt"][data-b="role"]');await page.evaluate(()=>{const e=document.getElementById('fiEd');e.innerText='Espion de la Monarchie';e.dispatchEvent(new Event('input',{bubbles:true}));});
      await click(page,'[data-act="pnTxtSave"]');await wait(page);ok((db.get('chars/hector').por||{}).role==='Espion de la Monarchie','le joueur renseigne le Rôle d\'un PNJ révélé');
      /* création par un joueur */
      await page.evaluate(()=>{S.view='team';S.teamSel='pnj';render();});await click(page,'[data-act="pnNew"]');
      ok(!/Préparé/.test(await sheet(page)),'nouveau PNJ (joueur) : pas de choix de visibilité');
      await fill(page,'nom','Lucie Hastain');await click(page,'[data-act="pnCreate"]');await wait(page);
      const lu=db.all('chars').find(c=>c.court==='Lucie Hastain');ok(lu&&lu.type==='PNJ'&&lu.vis==='rev'&&lu.eye&&lu.eye.role,'PNJ créé par un joueur : révélé, blocs ouverts');
      /* relations du PJ */
      await page.evaluate(()=>{S.view='sheet';S.sel='kerian';S.shTab='rel';render();});await click(page,'[data-act="relNew"][data-niv="allie"]');
      t=await sheet(page);ok(/Lucie/.test(t)&&!/Armand/.test(t),'Relations d\'un PJ : PNJ préparé non proposé');await page.evaluate(()=>{S.dlg=null;render();});
      /* traits et forme */
      await page.evaluate(()=>{S.shTab='prog';render();});ok(!/Traits de caractère/i.test(await txt(page)),'onglet Progrès : plus de traits');
      await page.evaluate(()=>{S.shTab='fiche';render();});t=await txt(page);if(DBG)console.log(t);ok(/Traits de caractère/i.test(t)&&!!(await page.$('[data-act="trOpen"]')),'onglet Fiche : traits modifiables');
      ok(await page.evaluate(()=>{const b=document.querySelector('[data-act="forme"][data-v="d"]');return !!b&&b.getAttribute('aria-pressed')==='true';}),'forme démasquée par défaut');
      /* féal */
      await page.evaluate(()=>{S.sel='ismael';S.shTab='prog';render();});t=await txt(page);if(DBG)console.log(t);
      ok(await page.evaluate(()=>[...document.querySelectorAll('.pchips .pchip')].map(b=>b.dataset.id).join()==='kerian,ismael'),'médaillons : PJ puis PNJ rattachés en fin de liste');
      await page.evaluate(()=>{S.shTab='rel';render();});ok(/Féal de\s*Kerian/.test(await page.evaluate(()=>document.getElementById('app').innerText)),'PJ liés : « Féal de Kerian » pour le PNJ rattaché');
      await page.evaluate(()=>{S.shTab='prog';render();});t=await txt(page);
      ok(/Progression/i.test(t)&&/Valeurs dérivées/i.test(t)&&/XP dispo/i.test(t)&&/Caractéristiques/i.test(t),'féal : onglet Progression (valeurs dérivées, XP, caractéristiques)');
      ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}

    console.log('3. Gestion');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      await click(page,'[data-act="pnTeam"][data-v="pnj"]');await wait(page);let t=await txt(page);
      ok(/Armand/.test(t)&&/préparé/.test(t),'gestion : PNJ préparé listé avec « préparé »');
      ok(!(await page.$('[data-act="pnNew"]')),'hors mode édition : pas de « + Nouveau PNJ »');
      await page.evaluate(()=>{S.edit=true;render();});await click(page,'[data-act="pnNew"]');
      ok(/Préparé/.test(await sheet(page)),'mode édition : choix Préparé / Révélé');
      await fill(page,'nom','Le Corbeau');await click(page,'[data-act="pnCreate"]');await wait(page);
      const co=db.all('chars').find(c=>c.court==='Le Corbeau');ok(co&&co.vis==='prep'&&Object.keys(co.eye||{}).length===0,'PNJ créé par la gestion : préparé, blocs fermés');
      await click(page,'[data-act="pnEye"][data-k="fiche"]');await wait(page);ok(db.get('chars/'+co.id).vis==='rev','Révéler');
      /* PNJ humain féal non rattaché */
      await page.evaluate(()=>{const n=JSON.parse(JSON.stringify(S.chars[S.sel]));n.race='Humain';saveChar(n);S.dlg={kind:'pc',id:n.id};render();});
      await page.evaluate(()=>{const b=document.querySelector('[data-cfeal]');b.checked=true;b.dispatchEvent(new Event('change',{bubbles:true}));});await wait(page);
      ok(db.get('chars/'+co.id).feal===true,'case « Féal » d\'un PNJ humain non rattaché');
      await page.evaluate(()=>{S.dlg=null;render();});ok(/Humain · féal/.test(await txt(page)),'en-tête : « Humain · féal »');
      /* alias rattaché à Hector */
      await page.evaluate(()=>{S.sel='hector';S.shTab='por';render();});await click(page,'[data-act="pnFold"][data-k="pn-alias"]');await click(page,'[data-act="pnAlias"]');
      await click(page,'[data-act="pnSet"][data-k="mode"][data-v="old"]');await fill(page,'pnj',co.id);await click(page,'[data-act="pnAliasSave"]');await wait(page);
      const co2=db.get('chars/'+co.id);ok(co2.alias==='hector'&&co2.eye.idr===false,'alias rattaché, Identité réelle fermée');
      t=await txt(page);ok(/Alias/i.test(t)&&/Le Corbeau/.test(t)&&/identité cachée/.test(t),'bloc Alias du PNJ principal (état)');
      /* lien réciproque */
      await page.evaluate(()=>{S.shTab='rel';render();});await click(page,'[data-act="pnFold"][data-k="pn-autres"]');await click(page,'[data-act="pnLien"]');
      await fill(page,'pnj','armand');await fill(page,'lab','rival');await click(page,'[data-act="pnLienSave"]');await wait(page);
      ok((db.get('chars/hector').liens||[]).some(l=>l.pnj==='armand'&&l.rec)&&(db.get('chars/armand').liens||[]).some(l=>l.pnj==='hector'&&l.rec),'lien réciproque inscrit sur les deux fiches');
      t=await txt(page);ok(/PJ liés/i.test(t)&&/Kerian/.test(t)&&/Contact/.test(t),'PJ liés calculés depuis les Relations des PJ');
      /* Univers et Bestiaire */
      await page.evaluate(()=>{S.view='univers';S.uni='home';S.fi=null;render();});t=await txt(page);
      ok(/Bestiaire/.test(t)&&!/page Personnages/.test(t),'Univers : Bestiaire, plus d\'entrée PNJ');
      await click(page,'[data-act="uni"][data-v="bete"]');await click(page,'[data-act="fiNew"]');await fill(page,'nom','Vouivre');await click(page,'[data-act="fiCreate"]');await wait(page);
      const vo=db.all('fiches').find(f=>f.nom==='Vouivre');ok(vo&&vo.genre==='bete'&&vo.vis==='prep','créature créée (préparée par la gestion)');
      t=await txt(page);ok(/Ce que l'on sait/i.test(t)&&!/Notes MJ/i.test(t),'fiche Bestiaire : sans Notes MJ');
      /* session rattachée */
      await page.evaluate(()=>{S.cal={...(S.cal||{}),date:{a:1900,m:5,j:9}};S.view='gains';render();});await click(page,'[data-act="sessNew"]');
      if(DBG)console.log(await sheet(page));ok(/Événement de la Chronique/i.test(await sheet(page)),'nouvelle session Scénario : champ Événement');
      await page.evaluate(()=>{const s=document.querySelector('#sdt');s.value='Autre';s.dispatchEvent(new Event('input',{bubbles:true}));});await wait(page);
      ok(!/Événement de la Chronique/.test(await sheet(page)),'type Autre : pas de champ Événement');
      await page.evaluate(()=>{const s=document.querySelector('#sdt');s.value='Scénario';s.dispatchEvent(new Event('input',{bubbles:true}));});await wait(page);
      await page.evaluate(()=>{S.cal={...(S.cal||{}),date:{a:1900,m:5,j:9}};const i=document.querySelector('#sdi');i.value='S01. Le bal des masques';i.dispatchEvent(new Event('input',{bubbles:true}));});
      await click(page,'[data-act="sessCreate"]');await wait(page);
      const ev=(db.get('gains/all').events||[]).slice(-1)[0],f=ev&&ev.evt&&db.get('fiches/'+ev.evt);
      if(DBG)console.log(JSON.stringify(f));ok(f&&f.genre==='evenement'&&f.num==='01.'&&f.nom==='Le bal des masques'&&f.debut&&f.debut.j===9,'session créée avec son événement prérempli ('+(f&&f.num)+')');
      ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    }
    console.log('4. Tour des écrans (gestion puis joueur)');
    const PL=Object.entries(DOCS).filter(([k])=>k.startsWith('players/')).map(([,p])=>p).filter(p=>!p.parti);
    const MES=docsPath?[PL.find(p=>p.role==='MJ'||p.gestion),PL.find(p=>!(p.role==='MJ'||p.gestion)&&(p.persos||[]).length)].filter(Boolean).map(p=>p.id):['lorenzo','alice'];
    const CH=Object.values(DOCS).filter(x=>x&&x.court&&x.type).map(x=>x.id);
    for(const me of MES){const {page,errs,ctx}=await open(browser,base,db,me);
      for(const st of [{view:'home'},{view:'univers',uni:'home'},{view:'univers',uni:'creatures'},{view:'univers',uni:'pouvoirs'},{view:'univers',uni:'chron'},{view:'univers',uni:'bete'},{view:'team',teamSel:'pj'},{view:'team',teamSel:'pnj'},{view:'gains'},{view:'planning'},{view:'players'},
        ...CH.flatMap(id=>['prog','fiche','feer','rel','situ','jour','por'].map(t=>({view:'sheet',sel:id,shTab:t})))])
        await page.evaluate(o=>{Object.assign(S,o);S.fi=null;S.dlg=null;render();},st);
      for(const id of CH)await page.evaluate(id=>{S.dlg={kind:'pc',id};render();},id);for(const k of ['shFold','pnFold'])await page.evaluate(()=>{S.dlg=null;render();});await page.evaluate(()=>{S.dlg={kind:'newc'};render();});
      ok(errs.length===0,me+' : aucune erreur sur '+'tous les écrans'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})();
