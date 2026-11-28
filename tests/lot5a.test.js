/* Lot 5 a (26/11/2026) : organisations.
   Usage : node tests/lot5a.test.js [docs.json] — sans argument, données inventées (version 2) construites ici.
   1. Calculs : rangs et formes féminines, titres cumulés (deux suzerains, le plus haut l'emporte), membres par rang et hiérarchie
      (boucle), appartenance par titre, Situation (fenêtres Organisation et Titre), membres en texte, relations réciproques,
      lieux, bonus « même organisation » par fiche, rattachement par nom, suppression, droits (joueur, Visiteur, membre masqué).
   2. Navigateur : fiche Organisation (onglets), Situation, jauge ; tour des écrans sans erreur. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp,setDocs}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-26T18:00:00.000Z';
const EYE={desc:true,sait:true,rangs:true,prat:true,mem:true,lieux:true,rel:true,orgs:true};
const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',kanka:'',vis:'rev',eye:EYE,desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
const R=(id,m,f,note)=>({id,m,...(f?{f}:{}),...(note?{note}:{})});
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/alice':{id:'alice',nom:'Alice',role:'Joueur',persos:['kerian']},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan','masse']},
    'chars/kerian':ch('kerian','Kerian','PJ',{race:'Elfe',traits:[],genre:'m',situ:{titres:[{id:'t1',nom:"Chevalier de Ville d'Avray"}],orgs:[{id:'o1',nom:'Métaphysiciens',role:'Postulant'}]}}),
    'chars/sloan':ch('sloan','Sloan','PJ',{race:'Elfe',traits:[],genre:'f',situ:{titres:[{id:'t2',f:'mon',rang:'r7',nom:'Dame de Sèvres',dom:{f:'sev',nom:'Sèvres'},suz:{id:'caleis'}},{id:'t3',f:'mon',rang:'r5',nom:'Comtesse',suz:{nom:'Angarade'},note:'Danemark'}]}}),
    'chars/masse':ch('masse','Masse Toc','PJ',{race:'Korrigan',traits:[],situ:{orgs:[{id:'o2',nom:'Druides',f:'dru',role:"Protecteur d'Avalon"}]}}),
    'chars/caleis':ch('caleis','Caléïs Frédon','PNJ',{race:'Elfe',rang:'Cador',genre:'m',situ:{titres:[{id:'t4',f:'mon',rang:'r2',nom:'Duc'}]}}),
    'chars/gut':ch('gut','Gutemberg','PNJ',{race:'Gnome',rang:'Cador',situ:{orgs:[{id:'o3',nom:'Druides',f:'dru',rang:'dr2'}]}}),
    'chars/kendall':ch('kendall','Kendall','PNJ',{race:'Gnome',rang:'Cador',situ:{orgs:[{id:'o4',nom:'Druides',f:'dru',role:'Saronide',sup:{id:'gut'}}]}}),
    'chars/alexis':ch('alexis','Alexis de Montsacré','PNJ',{race:'Elfe',rang:'Cador',situ:{orgs:[{id:'o5',nom:'Monarchie',f:'mon',role:'Bailli de France',sup:{id:'caleis'}}]}}),
    'chars/boa':ch('boa','Boa','PNJ',{race:'Elfe',rang:'Cador',situ:{orgs:[{id:'o6',nom:'Technologues',f:'tec',sup:{id:'bob'}}]}}),
    'chars/bob':ch('bob','Bob','PNJ',{race:'Elfe',rang:'Cador',situ:{orgs:[{id:'o7',nom:'Technologues',f:'tec',sup:{id:'boa'}}]}}),
    'fiches/mon':fi('mon','org','Monarchie',{type:'Gouvernement',titres:true,rangs:[R('r1','Roi','Reine'),R('r2','Duc','Duchesse'),R('r3','Vicomte','Vicomtesse','envoyé du roi'),R('r4','Baron','Baronne'),R('r5','Comte','Comtesse','héritier potentiel'),R('r6','Marquis','Marquise'),R('r7','Chevalier','Dame'),R('r8','Chevalier sans terre')]}),
    'fiches/gds':fi('gds','org','Gardiens du Silence',{type:'Administration',parent:'mon'}),
    'fiches/dru':fi('dru','org','Druides',{type:'Clergé',rangs:[R('dr1','Archidruide','','Samain'),R('dr2','Ovate','','Lugnasad'),R('dr3','Saronide','','Beltane'),R('dr4','Eubage','','Imbolc')],mbx:[{id:'mer',nom:"Merlin l'Enchanteur",rang:'dr1'}]}),
    'fiches/mom':fi('mom','org','Monarchomaques',{type:'Activiste'}),
    'fiches/tec':fi('tec','org','Technologues',{type:'Scientifique'}),
    'fiches/meta':fi('meta','org','Métaphysiciens',{type:'Chercheurs'}),
    'fiches/sec':fi('sec','org','Ordre caché',{type:'Ordre secret',vis:'prep',eye:{}}),
    'fiches/sev':fi('sev','lieu','Sèvres',{type:'Ville',eye:{...EYE}}),
    'fiches/aval':fi('aval','lieu','Avalon',{type:'Royaume',orgs:[{id:'y1',f:'dru',nom:'Druides',note:'portails gardés'}]}),
    'gains/all':{events:[]}};}
const docsPath=process.argv[2];const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();

console.log('1. Calculs');
if(!docsPath){const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','planning','donnees']),r=c=>app.run(c);
  setDocs(app,demoDocs());
  r(`toast=function(){};S.fiches={};for(const k in __docs)if(k.startsWith('fiches/'))S.fiches[k.slice(7)]=JSON.parse(JSON.stringify(__docs[k]));S.fichesReady=true;S.ptr={};`);
  r(`ME='lorenzo';S.edit=true;S.visit=false;S.asPlayer=false;`);
  /* titres */
  ok(r(`ogTitles(S.chars.sloan).map(x=>x.r.id).join()`)==='r5,r7','Sloan : deux titres triés par préséance (Comtesse avant Dame)');
  ok(r(`ogTitles(S.chars.kerian).map(x=>x.r.id+':'+ogTitL(x,S.chars.kerian)).join()`)==="r7:Chevalier de Ville d'Avray",'Kerian : ancien titre en texte reconnu (rang Chevalier), titre réel affiché (UX2)');
  ok(r(`ogRFind(S.fiches.mon,'titre de Chevalier sans terre').id`)==='r8','rang reconnu : « Chevalier sans terre » avant « Chevalier »');
  ok(r(`ogRL(ogRById(S.fiches.mon,'r7'),S.chars.sloan)`)==='Dame'&&r(`ogRL(ogRById(S.fiches.mon,'r8'),S.chars.sloan)`)==='Chevalier sans terre','forme féminine selon le genre (vide = masculin)');
  {const L=r(`JSON.stringify(ogMembers(S.fiches.mon).map(m=>[m.key,m.rk&&m.rk.id]))`);
    ok(L==='[["caleis","r2"],["sloan","r5"],["kerian","r7"],["alexis",null]]','Monarchie : membres triés par rang le plus haut, Alexis (rôle seul) en dernier');}
  ok(/Comtesse/.test(r(`ogSitRows(S.chars.sloan,'orgs').join('')`))&&/par ses titres/.test(r(`ogSitRows(S.chars.sloan,'orgs').join('')`)),'Situation › Organisations de Sloan : Monarchie · Comtesse (par ses titres)');
  {const h=r(`ogSitRows(S.chars.sloan,'titres').join('')`);ok(h.indexOf('Comtesse')<h.indexOf('Dame')&&/Sèvres/.test(h)&&/sous/.test(h)&&/Angarade/.test(h),'Situation › Titres : le plus haut en premier, domaine et suzerain');}
  {r(`S.ogView='tree';S.fiTab='mem';S.fi='mon';S.ogOpen={'mon|caleis':true};`);const h=r(`ogBlocks(S.fiches.mon,'mem')`);
    ok(/Hiérarchie/.test(h)&&/Sloan/.test(h)&&/aussi Comtesse/.test(h)&&/Alexis/.test(h)&&/Bailli de France/.test(h),'hiérarchie : Sloan sous Caléïs (« aussi Comtesse »), Alexis par son rôle');
    ok(h.indexOf('Dame de Sèvres')>0&&h.indexOf('Chevalier')>0,'hiérarchie : titre lié au suzerain affiché');}
  {r(`S.ogView='rang';`);const h=r(`ogBlocks(S.fiches.dru,'mem')`);const i=x=>h.indexOf(x);
    ok(i('Archidruide')<i('Ovate')&&i('Ovate')<i('Saronide')&&i('Saronide')<i('Autres rôles'),'Druides par rang : groupes dans l\'ordre des rangs internes, puis Autres rôles');
    ok(/Merlin/.test(h)&&/Kendall/.test(h)&&/sous/.test(h)&&/Protecteur d'Avalon|Protecteur d&#39;Avalon/.test(h),'Druides : membre en texte, rôle libre, supérieur');}
  {r(`S.ogView='tree';S.ogOpen={'tec|boa':true};`);const h=r(`ogBlocks(S.fiches.tec,'mem')`);ok(/Boa/.test(h)&&/Bob/.test(h),'boucle de supérieurs : membres remis à la racine, sans blocage');}
  r(`S.ogFold={'dru|rdr3':true};S.ogView='rang';`);ok(!/Kendall/.test(r(`ogBlocks(S.fiches.dru,'mem')`)),'groupe de rang replié');r(`S.ogFold={};`);
  /* fenêtre Titre depuis la Situation */
  r(`S.sel='kerian';ogAct('situEd',{k:'titres'});Object.assign(S.dlg,{rang:'r6',dlid:'sev',scid:'caleis'});ogAct('fiOSitSave',{});`);
  {const t=r(`JSON.stringify(S.chars.kerian.situ.titres.slice(-1)[0])`);ok(/"rang":"r6"/.test(t)&&/"f":"mon"/.test(t)&&/"suz":\{"id":"caleis"\}/.test(t)&&/Marquis de Sèvres/.test(t),'fenêtre Titre : Marquis de Sèvres sous Caléïs enregistré');}
  ok(r(`ogMembers(S.fiches.mon).find(m=>m.key==='kerian').rk.id`)==='r6','Kerian : rang le plus haut = Marquis');
  /* fenêtre Organisation depuis la Situation (rang, rôle, supérieur) */
  r(`S.sel='masse';ogAct('situEd',{k:'orgs',i:'o2'});Object.assign(S.dlg,{rang:'dr3',sup:'gut'});ogAct('fiOSitSave',{});`);
  {const e=r(`JSON.stringify(S.chars.masse.situ.orgs[0])`);ok(/"rang":"dr3"/.test(e)&&/"sup":\{"id":"gut"\}/.test(e)&&/Protecteur/.test(e),'fenêtre Organisation : rang, supérieur, rôle conservé');}
  r(`S.sel='masse';ogAct('situEd',{k:'orgs'});S.dlg.nom='Cercle du gui';ogAct('fiOSitSave',{});`);ok(r(`S.chars.masse.situ.orgs.some(e=>e.nom==='Cercle du gui'&&!e.f)`),'organisation en texte libre');
  r(`S.sel='masse';ogAct('situEd',{k:'orgs'});S.dlg.oid='dru';ogAct('fiOSitSave',{});`);ok(/Déjà membre/.test(r(`S.dlg.err`)),'doublon refusé');r(`S.dlg=null;`);
  /* membres depuis la fiche */
  r(`S.fi='dru';ogAct('fiOMem',{k:''});S.dlg.nom='Laelia';S.dlg.rang='dr4';ogAct('fiOMemSave',{});`);ok(r(`S.fiches.dru.mbx.some(x=>x.nom==='Laelia'&&x.rang==='dr4')`),'+ Membre en texte (Eubage)');
  r(`ogAct('fiOMem',{k:''});S.dlg.cid='caleis';S.dlg.role='Protecteur';ogAct('fiOMemSave',{});`);ok(r(`S.chars.caleis.situ.orgs.some(e=>e.f==='dru'&&e.role==='Protecteur')`),'+ Membre personnage : inscrit dans sa Situation');
  r(`ogAct('fiOMem',{k:'caleis'});ogAct('fiOMemDel',{});ogAct('fiOMemDel',{});`);ok(!r(`(S.chars.caleis.situ.orgs||[]).some(e=>e.f==='dru')`),'retrait d\'un membre : ligne retirée de la Situation');
  /* rangs */
  r(`S.fi='meta';ogAct('fiORangs',{});ogAct('fiORAdd',{});ogAct('fiORAdd',{});S.dlg.R[0].m='Membre';S.dlg.R[1].m='Président';ogAct('fiORMv',{i:1,d:-1});ogAct('fiORSave',{});`);
  ok(r(`S.fiches.meta.rangs.map(x=>x.m).join()`)==='Président,Membre','rangs : ajout et ordre (flèches)');
  r(`ogAct('fiORangs',{});ogAct('fiORAdd',{});S.dlg.R[2].m='membre';ogAct('fiORSave',{});`);ok(/même nom/.test(r(`S.dlg.err`)),'rangs : doublon refusé');r(`S.dlg=null;`);
  /* relations réciproques */
  r(`S.fi='mom';ogAct('fiORel',{i:''});S.dlg.oid='mon';S.dlg.lab='ennemis';ogAct('fiORelSave',{});`);
  ok(r(`S.fiches.mom.rel[0].f==='mon'&&S.fiches.mon.rel.some(y=>y.f==='mom'&&y.lab==='ennemis')`),'relation réciproque : ajoutée des deux côtés');
  r(`S.fi='mon';const y=S.fiches.mon.rel[0];y.lab='ennemis jurés';ogAct('fiORel',{i:y.id});S.dlg.lab='ennemis jurés';ogAct('fiORelSave',{});`);ok(r(`S.fiches.mon.rel[0].lab==='ennemis jurés'&&S.fiches.mom.rel[0].lab==='ennemis'`),'chaque côté garde son étiquette');
  r(`ogAct('fiORel',{i:S.fiches.mon.rel[0].id});ogAct('fiORelDel',{});ogAct('fiORelDel',{});`);ok(!(r(`(S.fiches.mon.rel||[]).length`))&&!(r(`(S.fiches.mom.rel||[]).length`)),'retrait d\'une relation : retirée des deux fiches');
  /* lieux */
  ok(/Avalon/.test(r(`ogBlocks(S.fiches.dru,'ctx')`)),'Contexte › Lieux : Avalon (bloc Organisations et familles du lieu)');
  r(`S.fi='dru';ogAct('fiOLieu',{});S.dlg.lid='sev';ogAct('fiOLieuSave',{});`);ok(r(`S.fiches.sev.orgs.some(y=>y.f==='dru')`),'+ Lieu : inscrit sur la fiche du lieu');
  /* bonus même organisation */
  ok(r(`ogCommon(S.chars.sloan,S.chars.caleis)`)==='Monarchie','même organisation par les titres (Sloan, Caléïs)');
  ok(r(`ogCommon(S.chars.masse,S.chars.kendall)`)==='Druides'&&r(`relOrgBonus(S.chars.masse,{pnj:'kendall'})`)===1,'bonus même organisation par fiche (Druides)');
  ok(r(`ogCommon(S.chars.masse,S.chars.boa)`)==='','pas d\'organisation commune');
  /* rattachement par nom */
  ok(r(`fi6RattCands().some(x=>x.c.id==='kerian'&&x.k==='orgs'&&x.x.id==='meta')`),'rattachement par nom : Métaphysiciens (texte) → fiche');
  /* masquage d'un membre, joueur, Visiteur */
  r(`S.fi='dru';ogAct('fiOEyeM',{k:'gut'});`);ok(r(`S.fiches.dru.mhid.includes('gut')`),'œil d\'un membre : masqué');
  r(`ME='alice';S.edit=false;`);ok(!/Gutemberg/.test(r(`ogBlocks(S.fiches.dru,'mem')`))&&/Kendall/.test(r(`ogBlocks(S.fiches.dru,'mem')`)),'joueur : membre masqué absent');
  ok(!r(`ogOrgs().filter(fiSee).some(x=>x.id==='sec')`),'joueur : organisation préparée invisible');
  ok(r(`fiCanEd(S.fiches.dru)`)&&/fiOMem/.test(r(`ogBlocks(S.fiches.dru,'mem')`)),'joueur : peut compléter une organisation révélée (principe du 25/11)');
  r(`S.visit=true;`);ok(!r(`fiCanEd(S.fiches.dru)`)&&!/data-act="fiOMem"/.test(r(`ogBlocks(S.fiches.dru,'mem')`)),'Visiteur : lecture seule');r(`S.visit=false;ME='lorenzo';S.edit=true;`);
  /* suppression */
  r(`fiRemove('mon');`);ok(r(`S.chars.sloan.situ.titres.every(t=>!t.f)&&S.chars.alexis.situ.orgs[0].nom==='Monarchie'&&!S.chars.alexis.situ.orgs[0].f`),'suppression : titres et organisations repassés en texte');
  r(`fiRemove('sev');`);ok(r(`S.chars.sloan.situ.titres.some(t=>t.dom&&!t.dom.f&&t.dom.nom==='Sèvres')`),'suppression d\'un lieu : domaine gardé en texte');
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
      console.log('2. Gestion');
      {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
        await page.evaluate(()=>{S.edit=true;S.view='univers';S.uni='org';S.fi=null;render();});let t=await txt(page);
        ok(/Monarchie/.test(t)&&/Druides/.test(t),'liste des organisations');
        await page.evaluate(()=>{S.fi='dru';S.fiTab='';render();});t=await txt(page);if(DBG)console.log(t);
        ok(/Présentation/.test(t)&&/Rangs internes/i.test(t)&&/Archidruide/.test(t)&&/Pratiques/i.test(t),'Druides › Présentation : rangs internes, pratiques');
        await click(page,'[data-act="fiOTab"][data-v="mem"]');await wait(page);t=await txt(page);if(DBG)console.log(t);
        ok(/Ovate/i.test(t)&&/Merlin/.test(t)&&/Masse Toc/.test(t),'Druides › Membres : groupes de rang');
        await click(page,'[data-act="fiOMem"][data-k=""]');await fill(page,'cid','kerian');await wait(page);let sh=await sheet(page);if(DBG)console.log('SHEET',sh);
        ok(/Rang/i.test(sh)&&/Supérieur/i.test(sh),'fenêtre Membre : rang, supérieur');
        await fill(page,'rang','dr4');await click(page,'[data-act="fiOMemSave"]');await page.waitForTimeout(300);
        ok(((db.get('chars/kerian').situ||{}).orgs||[]).some(e=>e.f==='dru'&&e.rang==='dr4'),'membre ajouté depuis la fiche : enregistré dans la Situation de Kerian');
        await click(page,'[data-act="fiOTab"][data-v="ctx"]');await wait(page);t=await txt(page);ok(/Lieux/i.test(t)&&/Avalon/.test(t)&&/Relations/i.test(t)&&!/Notes MJ/i.test(t),'Druides › Contexte : lieux, relations ; Notes MJ retirées (UX2)');
        await page.evaluate(()=>{S.fi='mon';S.fiTab='mem';S.ogView='tree';render();});t=await txt(page);if(DBG)console.log(t);
        ok(/Hiérarchie/.test(t)&&/Duc/i.test(t)&&/Caléïs/.test(t),'Monarchie › Membres : vue Hiérarchie');
        if(process.env.SHOTS){await page.evaluate(()=>{S.ogOpen={'mon|caleis':true};render();});await page.screenshot({path:process.env.SHOTS+'/hier.png',fullPage:true});await page.evaluate(()=>{S.fi='dru';S.fiTab='mem';render();});await page.screenshot({path:process.env.SHOTS+'/mem.png',fullPage:true});await page.evaluate(()=>{S.fiTab='';render();});await page.screenshot({path:process.env.SHOTS+'/pres.png',fullPage:true});await page.evaluate(()=>{S.fi='mon';S.fiTab='mem';S.ogView='tree';render();});}
        await page.evaluate(()=>{S.view='sheet';S.sel='sloan';S.shTab='situ';render();});t=await txt(page);if(DBG)console.log(t);
        ok(/Comtesse/.test(t)&&/Dame/.test(t)&&/par ses titres/.test(t),'Situation de Sloan : titres et Monarchie par ses titres');
        await click(page,'[data-act="situEd"][data-k="titres"]:not([data-i])');await wait(page);sh=await sheet(page);if(DBG)console.log('SHEET2',sh);ok(/Titre/i.test(sh)&&/Domaine/i.test(sh)&&/Suzerain/i.test(sh),'fenêtre Titre : titre, domaine, suzerain');
        await page.evaluate(()=>{S.dlg=null;render();});
        ok(errs.length===0,'aucune erreur JavaScript'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    }
    console.log('3. Tour des écrans (gestion puis joueur)');
    const PL=Object.entries(DOCS).filter(([k])=>k.startsWith('players/')).map(([,p])=>p).filter(p=>!p.parti);
    const MES=docsPath?[PL.find(p=>p.role==='MJ'||p.gestion),PL.find(p=>!(p.role==='MJ'||p.gestion)&&(p.persos||[]).length)].filter(Boolean).map(p=>p.id):['lorenzo','anne'];
    const CH=Object.values(DOCS).filter(x=>x&&x.court&&x.type).map(x=>x.id),FI=Object.values(DOCS).filter(x=>x&&x.genre==='org').map(x=>x.id);
    for(const me of MES){const {page,errs,ctx}=await open(browser,base,db,me);
      for(const st of [{view:'univers',uni:'org'},{view:'params',ptab:'donnees'},...FI.flatMap(id=>['','mem','ctx'].map(t=>({view:'univers',uni:'org',fi:id,fiTab:t}))),...FI.map(id=>({view:'univers',uni:'org',fi:id,fiTab:'mem',ogView:'tree'})),...CH.map(id=>({view:'sheet',sel:id,shTab:'situ'})),...CH.map(id=>({view:'sheet',sel:id,shTab:'rel'}))])
        await page.evaluate(o=>{S.fi=null;S.dlg=null;Object.assign(S,o);render();},st);
      for(const id of FI.slice(0,4))for(const k of ['fiORangs','fiORel','fiOLieu','fiOMem'])await page.evaluate(([id,k])=>{S.view='univers';S.uni='org';S.fi=id;S.dlg=null;render();try{fiAct(k,{k:'',i:''});}catch(e){console.error(e.message);}},[id,k]);
      await page.evaluate(()=>{S.dlg=null;render();});
      ok(errs.length===0,me+' : aucune erreur sur tous les écrans'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})();
