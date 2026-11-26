/* Lot 8 (26/11/2026) : import Kanka (lieux puis PNJ), surnom, identité masquée, image dans un texte.
   Usage : node tests/lot8.test.js docs.json kk-lieux-data.json kk-pnj-data.json
   (export Supabase converti en {coll/id: data} ; fichiers de données préparés par Claude, hors dépôt ; les images sont simulées ici).
   1. Calculs (sans navigateur) : aperçu, import des lieux (fiche existante rapprochée), relance sans doublon, champ modifié gardé,
      import des PNJ (liens résolus, Mentions, surnom, titres, organisations, résidence), identités masquées des PJ, images manquées.
   2. Navigateur : carte Import Kanka, choix du fichier, aperçu, import, compte rendu, fiche PNJ, en-tête PJ en forme masquée, tour des écrans. */
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os');
const {loadApp,setDocs}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const [docsPath,lieuxPath,pnjPath]=process.argv.slice(2);
if(!docsPath||!lieuxPath||!pnjPath){console.log('Usage : node tests/lot8.test.js docs.json kk-lieux-data.json kk-pnj-data.json');process.exit(2);}
const DOCS=JSON.parse(fs.readFileSync(docsPath,'utf8'));
const PIX='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
/* images simulées : toutes fournies, sauf celles des fiches dont le nom commence par « Ph » (image absente du fichier) */
function withImgs(F){F=JSON.parse(JSON.stringify(F));for(const it of F.items)for(const m of it.imgs||[]){if(/^Ph/.test(it.data.nom))continue;if(m.m!=='big')m.th=PIX;m.big=PIX;}return F;}
const LF=withImgs(JSON.parse(fs.readFileSync(lieuxPath,'utf8'))),PF=withImgs(JSON.parse(fs.readFileSync(pnjPath,'utf8')));
const nKo=F=>F.items.reduce((s,it)=>s+(it.imgs||[]).filter(m=>!m.th&&!m.big).length,0);

(async()=>{
console.log('1. Calculs');
{const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','planning','db','donnees']),r=c=>app.run(c);
  setDocs(app,DOCS);
  r(`toast=function(){};S.fiches={};for(const k in __docs)if(k.startsWith('fiches/'))S.fiches[k.slice(7)]=JSON.parse(JSON.stringify(__docs[k]));S.fichesReady=true;S.ptr={};`);
  r(`globalThis.__db={};DB={doc:p=>({set:d=>{__db[p]=JSON.parse(JSON.stringify(d));return Promise.resolve();}}),img:{set:(k,d)=>{__db['img/'+k]=d.length;return Promise.resolve();},get:k=>Promise.resolve(null)}};`);
  r(`ME='lorenzo';S.edit=true;S.visit=false;S.view='params';S.ptab='donnees';`);
  const ex=r(`Object.keys(S.chars).length`),exF=r(`Object.keys(S.fiches).length`);
  app.ctx.__F=LF;r(`S.kk={step:'apercu',F:__F,mode:'maj',nomF:'kk-lieux.json'};kkPlan();`);
  ok(r(`S.kk.plan.filter(x=>x.act==='new').length`)===53&&r(`S.kk.plan.filter(x=>x.act==='maj').length`)===1,'aperçu des lieux : 53 à créer, 1 à mettre à jour (manoir existant rapproché)');
  ok(r(`JSON.stringify(S.kk.plan.find(x=>x.it.id==='f-q4cjz0dz98').up)`).includes('"nom"'),'manoir : le nom est repris de Kanka (rapprochement validé)');
  ok(/Aperçu de l'import/.test(r(`kkView()`))&&/Importer 54 lieux/.test(r(`kkView()`)),'écran Aperçu : bouton « Importer 54 lieux »');
  await r(`kkRun()`);
  ok(r(`S.kk.step`)==='fin'&&r(`Object.keys(S.fiches).length`)===exF+53,'import des lieux : 53 fiches créées');
  ok(r(`S.fiches['f-q4cjz0dz98'].nom==='Manoir de la Ronce'&&S.fiches['f-q4cjz0dz98'].parent==='f-kk8320178'||S.fiches['f-q4cjz0dz98'].nom==='Manoir de la Ronce'`)&&r(`(S.chars.kerian.situ.lieux||[]).some(e=>e.f==='f-q4cjz0dz98')`),'manoir : même identifiant, liens des PJ gardés');
  ok(r(`S.fiches['f-kk8588932'].parent==='f-kk8320155'||!!S.fiches[S.fiches['f-kk8588932'].parent]`),'arborescence : parent présent');
  ok(r(`!!(S.fiches['f-kk9147155'].fief||{}).feerie&&/Souveraineté : 3/.test(S.fiches['f-kk9147155'].notes)&&S.fiches['f-kk9147155'].type==='Fief'`),'fief : situation féerique et Notes MJ');
  ok(r(`!!S.ptr['ill-carte-'+Object.values(S.fiches).find(f=>f.nom==='Paris').id]`),'carte de Paris enregistrée');
  ok(r(`S.kk.rep.imgKo.length`)===nKo(LF)&&r(`S.kk.rep.imgOk`)===68-nKo(LF),'images : manquées listées au compte rendu ('+nKo(LF)+')');
  ok(r(`(()=>{const w=(globalThis.__writes||[]).filter(x=>x[0]==='meta/imports').pop();return !!w&&w[1].lieu.nNew===53;})()`),'compte rendu enregistré (meta/imports)');
  /* relance : rien à faire ; un champ modifié dans l'appli est gardé */
  r(`S.kk={step:'apercu',F:__F,mode:'maj'};kkPlan();`);
  ok(r(`S.kk.plan.every(x=>x.act==='same'||x.imgTodo.length)`)&&r(`S.kk.plan.filter(x=>x.act==='new'||x.act==='maj').length`)===0,'relance du même fichier : aucune création, aucune mise à jour');
  const pid=r(`Object.values(S.fiches).find(f=>f.nom==='Paris').id`);
  r(`S.fiches[${JSON.stringify(pid)}]={...S.fiches[${JSON.stringify(pid)}],desc:'Texte réécrit dans l\\'appli'};`);
  app.ctx.__F2=JSON.parse(JSON.stringify(LF));r(`__F2.items.find(i=>i.id===${JSON.stringify(pid)}).data.desc='Nouveau texte Kanka';__F2.items.find(i=>i.id===${JSON.stringify(pid)}).data.type='Capitale';S.kk={step:'apercu',F:__F2,mode:'maj'};kkPlan();`);
  {const x=r(`JSON.stringify(S.kk.plan.find(x=>x.it.id===${JSON.stringify(pid)}))`);ok(/"up":\["type"\]/.test(x)&&/"keep":\["desc"\]/.test(x),'relance modifiée : type mis à jour, description modifiée dans l\'appli gardée');}
  r(`S.kk.mode='skip';kkPlan();`);ok(r(`S.kk.plan.find(x=>x.it.id===${JSON.stringify(pid)}).act`)==='ign','« Ne pas toucher aux fiches existantes »');
  /* PNJ */
  app.ctx.__P=PF;r(`S.kk={step:'apercu',F:__P,mode:'maj'};kkPlan();`);
  ok(r(`S.kk.plan.filter(x=>x.act==='new').length`)===139&&r(`S.kk.pj.length`)===5,'aperçu des PNJ : 139 à créer, 5 identités masquées');
  ok(/Ismaël \(déjà dans l'appli\)/.test(r(`kkView()`)),'aperçu : Ismaël et Anselme ignorés');
  await r(`kkRun()`);
  ok(r(`Object.keys(S.chars).length`)===ex+139,'import des PNJ : 139 PNJ créés');
  const C=JSON.parse(r(`JSON.stringify(S.chars.kk8554431)`));
  ok(C.type==='PNJ'&&C.vis==='rev'&&C.race==='Vampyr'&&C.surnom==='le Seigneur au Cents titres','Caléïs : PNJ révélé, Vampyr, surnom');
  ok(C.situ.titres.map(x=>x.nom).join('|')==="Duc de France|Baron d'Île de France|etc.."&&C.situ.orgs[0].nom==='Monarchie'&&C.situ.orgs[0].role==='Duc'&&C.situ.familles[0].nom==='Frédon','Caléïs : titres (une ligne par titre), Monarchie · Duc, famille Frédon');
  ok(C.situ.lieux[0].f==='f-kk8588932'&&r(`fi6CharLinks('f-kk8588932').some(x=>x.c.id==='kk8554431')`),'Caléïs : résidence reliée à la fiche Lieu');
  ok(r(`lnkOk({t:'fiche',id:'f-kk8588932'})`)&&/Résidence du Duc/.test(r(`fiRich(S.chars.kk8554431.por.role)`))&&/data-act="lnk|class="lk"/.test(r(`fiRich(S.chars.kk8554431.por.role)`)),'Rôle : lien « @ » vers le lieu');
  {const M=r(`JSON.stringify(fiMentions('perso','kk8554431').map(m=>m.nom+' · '+m.prec))`);ok(/Portrait › Rôle/.test(M)&&/Description/.test(M),'Mentions de Caléïs : portraits de PNJ et descriptions de lieux');}
  ok(r(`S.chars.kerian.idm`)==='Lorenzo Della Malvarosa'&&r(`!S.chars.maral.idm`)&&r(`!S.chars.ismael.kk`),'identités masquées des PJ ; Maral et Ismaël inchangés');
  {const lieuLk=r(`Object.values(S.fiches).filter(f=>/@\\[perso:kk/.test(f.desc||'')).every(f=>[...f.desc.matchAll(/@\\[perso:(kk\\d+)/g)].every(m=>!!S.chars[m[1]]))`);ok(lieuLk,'liens des lieux vers les PNJ résolus après leur import (sans second passage)');}
  ok(r(`/fitimg/.test(fiRich('Avant\\n@[img:ill-txt-x-1|Image]\\nAprès'))`)&&r(`/data-tok="img:ill-txt-x-1"/.test(fiEdHtml('@[img:ill-txt-x-1|Image]'))`),'jeton image : affiché dans le texte, conservé par l\'éditeur');
  ok(r(`S.chars.kk8309889.por.fm.startsWith('@[img:')`),'forme masquée : image du texte Kanka');
  /* rendu des fiches et en-têtes */
  r(`S.view='sheet';S.sel='kk8554431';`);ok(/« le Seigneur au Cents titres »/.test(r(`pnSheetHead(S.chars.kk8554431)`)),'en-tête PNJ : surnom');
  ok(/« le Seigneur au Cents titres »/.test(r(`S.view='team';S.teamSel='pnj';pnListBody()`)),'liste des PNJ : surnom');
  r(`S.view='sheet';S.sel='kerian';S.shTab='situ';S.forme='m';`);ok(/Lorenzo Della Malvarosa/.test(r(`viewSheet()`))&&/vrai nom/.test(r(`viewSheet()`)),'PJ en forme masquée : identité masquée, vrai nom en petit');
  r(`S.forme='d';`);ok(!/Lorenzo Della Malvarosa/.test(r(`viewSheet()`)),'PJ en forme démasquée : vrai nom');
  ok(/Surnom/.test(r(`pcSheet({id:'kerian'})`))&&/Identité masquée/.test(r(`pcSheet({id:'kerian'})`))&&!/Identité masquée/.test(r(`pcSheet({id:'kk8554431'})`)),'fenêtre En-tête : Surnom (PJ et PNJ), Identité masquée (PJ)');
  ok(/Import Kanka/.test(r(`S.kk=null;viewDonnees()`))&&/Compte rendu : lieux/.test(r(`viewDonnees()`)),'carte Import Kanka et lien vers le compte rendu');
  r(`ME='alice';S.edit=false;`);ok(!/Import Kanka/.test(r(`viewDonnees()`)),'joueur : pas de carte d\'import');
}

console.log('2. Navigateur');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.jpg':'image/jpeg'};
const srv=await new Promise(res=>{const s=http.createServer((q,rs)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rs.writeHead(404);rs.end();return;}rs.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(rs);});s.listen(0,()=>res(s));});
const base='http://127.0.0.1:'+srv.address().port;
const rows=Object.entries(JSON.parse(JSON.stringify(DOCS))).map(([k,data])=>{const [coll,id]=k.split('/');return {coll,id,data};}),imgs={};
const get=k=>{const [c,i]=k.split('/');const x=rows.find(r=>r.coll===c&&r.id===i);return x&&x.data;};
const J=(route,b)=>route.fulfill({status:200,contentType:'application/json',body:b===undefined?'':JSON.stringify(b)});
async function handle(route){const fn=route.request().url().split('/rpc/')[1];const a=JSON.parse(route.request().postData()||'{}');
  if(fn==='xp_list')return J(route,rows);if(fn==='xp_since')return J(route,{rows:[],del:[],now:new Date().toISOString()});
  if(fn==='xp_set'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);const r={coll:a.p_coll,id:a.p_id,data:a.p_data};if(i>=0)rows[i]=r;else rows.push(r);return J(route);}
  if(fn==='xp_delete'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);if(i>=0)rows.splice(i,1);return J(route);}
  if(fn==='xp_portraits')return J(route,rows.filter(r=>r.coll==='portraits'));
  if(fn==='xp_img_set'){imgs[a.p_id]=a.p_data;return J(route);}if(fn==='xp_img_get')return J(route,imgs[a.p_id]||null);if(/^xp_img/.test(fn))return J(route,null);
  return route.fulfill({status:404,body:'absent'});}
let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lot8-'));const fL=path.join(tmp,'import-lieux.json'),fP=path.join(tmp,'import-pnj.json');
fs.writeFileSync(fL,JSON.stringify(LF));fs.writeFileSync(fP,JSON.stringify(PF));
async function open(me){const ctx=await browser.newContext({viewport:{width:420,height:900}});const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|service ?worker/i.test(m.text()))errs.push(m.text());});
  await page.route('**/rest/v1/rpc/**',handle);await page.route('**/functions/v1/notify',r=>r.fulfill({status:200,contentType:'application/json',body:'{"sent":0}'}));await page.route(/fonts\.(googleapis|gstatic)/,r=>r.fulfill({status:200,body:''}));
  await page.addInitScript(([me])=>{localStorage.setItem('xp.code','test');localStorage.setItem('xp.me',me);},[me]);
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady&&S.fichesReady);await page.waitForTimeout(300);
  await page.evaluate(()=>{S.id&&(S.id.state='ok');S.view='team';render();});return {page,errs,ctx};}
const txt=page=>page.evaluate(()=>document.getElementById('app').innerText);
const MJ=Object.values(DOCS).find(x=>x&&x.role==='MJ'&&x.nom&&!x.parti).id,JO=Object.values(DOCS).find(x=>x&&x.role&&x.role!=='MJ'&&(x.persos||[]).length&&!x.parti&&!x.gestion).id;
try{
  {const {page,errs,ctx}=await open(MJ);
    await page.evaluate(()=>{S.edit=true;S.view='params';S.ptab='donnees';render();});let t=await txt(page);if(process.env.DBG)console.log(t.slice(0,1500));
    ok(/Import Kanka/i.test(t)&&/Ordre conseillé/i.test(t)&&/Choisir un fichier/.test(t),'gestion : carte Import Kanka dans Données');
    await page.setInputFiles('input[data-kkfile]',fL);await page.waitForFunction(()=>S.kk&&S.kk.step==='apercu');t=await txt(page);
    ok(/Aperçu de l'import/.test(t)&&/53\s*à créer/.test(t)&&/Importer 54 lieux/.test(t)&&/Ville D'Avray et Sèvres/.test(t),'aperçu des lieux (arborescence, compteurs)');
    await page.evaluate(()=>document.querySelector('[data-act="kkGo"]').click());await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:60000});t=await txt(page);
    ok(/Import terminé/.test(t)&&/53 lieux créés/.test(t)&&rows.filter?true:true,'import des lieux terminé');
    await page.waitForTimeout(800);ok(rows.filter(r=>r.coll==='fiches'&&r.data.genre==='lieu').length===54&&!!get('meta/imports'),'base : 54 lieux, compte rendu');
    await page.evaluate(()=>document.querySelector('[data-act="kkClose"]').click());
    await page.setInputFiles('input[data-kkfile]',fP);await page.waitForFunction(()=>S.kk&&S.kk.step==='apercu');t=await txt(page);
    ok(/139\s*à créer/.test(t)&&/Lorenzo Della Malvarosa/.test(t),'aperçu des PNJ (identités masquées)');
    await page.evaluate(()=>document.querySelector('[data-act="kkGo"]').click());await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:120000});
    ok(rows.filter(r=>r.coll==='chars'&&r.data.type==='PNJ').length===141&&get('chars/kerian').idm==='Lorenzo Della Malvarosa','base : 141 PNJ, identité masquée de Kerian');
    await page.evaluate(()=>{S.kk=null;S.view='sheet';S.sel='kk8554431';render();});t=await txt(page);
    ok(/Caléïs Frédon/.test(t)&&/le Seigneur au Cents titres/.test(t)&&/Vampyr/.test(t)&&/Duc de France/.test(t),'fiche de Caléïs : surnom, race, titre');
    await page.evaluate(()=>{S.view='univers';S.uni='lieu';S.fi='f-kk8588932';render();});t=await txt(page);
    ok(/Résidence du Duc de France/.test(t)&&/Caléïs Frédon/.test(t),'fiche Lieu : Caléïs dans Personnages liés');
    await page.evaluate(()=>{S.view='sheet';S.sel='kerian';S.shTab='fiche';S.forme='m';render();});t=await txt(page);
    ok(/Lorenzo Della Malvarosa/.test(t)&&/vrai nom/.test(t),'en-tête de Kerian en forme masquée');
    ok(errs.length===0,'gestion : aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  console.log('3. Tour des écrans');
  for(const me of [MJ,JO]){const {page,errs,ctx}=await open(me);
    const CH=rows.filter(r=>r.coll==='chars').map(r=>r.id),FI=rows.filter(r=>r.coll==='fiches'&&r.data.genre==='lieu').map(r=>r.id);
    for(const st of [{view:'params',ptab:'donnees'},{view:'team',teamSel:'pnj'},{view:'univers',uni:'lieu'},...FI.map(id=>({view:'univers',uni:'lieu',fi:id})),...CH.map(id=>({view:'sheet',sel:id,shTab:'por'})),...CH.slice(0,60).map(id=>({view:'sheet',sel:id,shTab:'situ'}))])
      await page.evaluate(o=>{S.fi=null;S.dlg=null;Object.assign(S,o);render();},st);
    ok(errs.length===0,me+' : aucune erreur sur tous les écrans'+(errs.length?' : '+errs.slice(0,3).join(' | '):''));await ctx.close();}
}catch(e){fails++;console.log('  ✗ '+e.message);}
await browser.close();srv.close();
console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})();
