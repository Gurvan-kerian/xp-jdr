/* Arts obscurs (26/11/2026).
   Usage : node tests/arts.test.js [docs.json] [import-arts.json] — sans argument, données inventées construites ici.
   Navigateur : fiche d'art (blocs, sorts, niveaux), onglet Progrès (section invisible par défaut, déblocage par la gestion, rangs, montée bloquée sans sorts,
   apprendre un sort, annulation), Paramètres › Référentiel › Arts obscurs, recherche ; import Kanka des arts (fichier réel). */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-26T20:00:00.000Z';
const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',kanka:'',vis:'rev',eye:{desc:true,sait:true,pre:true,niv:true,sorts:true,prat:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  const sl=ch('sloan','Sloan','PJ',{race:'Elfe',traits:[],profils:[{nom:'Aventurier',note:0,comps:[{nom:'Survie',cur:4,max:6},{nom:'Mouvement',cur:1,max:6}]},{nom:'Erudit',note:0,comps:[{nom:'Occultisme',cur:4,max:6},{nom:'Culture',cur:0,max:6}]}],specs:[{nom:'Connaissance du druidisme',cible:'comp:Occultisme'}]});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'chars/sloan':sl,
    'fiches/org':fi('org','org','Druides'),
    'fiches/dru':fi('dru','art','Druidisme',{desc:"Communion avec l'Awen.",org:'org',comp:true,pre:[{t:'comp',n:'Survie',r:4,sp:''},{t:'comp',n:'Occultisme',r:4,sp:'Druidisme'}],max:7,cSort:5,nReq:2,niv:['Eubage','Saronide','Ovate','Archidruide'],
      sorts:[{id:'s1',nom:'Philtre de guérison',niv:1,type:'actif',act:'1 minute',desc:'Soigne.'},{id:'s2',nom:'Philtre de purification',niv:1,type:'actif'},{id:'s3',nom:'Semence de vigueur',niv:2,type:'passif'}]}),
    'fiches/nec':fi('nec','art','Nécromancie',{comp:true,pre:[{t:'comp',n:'Médecine',r:4,sp:''}]}),
    'fiches/spi':fi('spi','art','Spiritisme',{comp:false,desc:'Esprits des morts.'}),
    'gains/all':{events:[{id:'e1',titre:'S1',date:'2026-11-01',type:'Scénario',entries:[{perso:'sloan',nature:'Scénario',montant:100}]}]}};}
const docsPath=process.argv[2],impF=process.argv[3];const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();
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
const prog=page=>page.evaluate(()=>{S.view='sheet';S.sel='sloan';S.shTab='prog';S.dlg=null;S._force=true;render();return document.getElementById('app').innerText;});
const sheet=page=>page.evaluate(()=>(document.getElementById('sheetRoot')||{}).innerText||'');
const click=(page,sel)=>page.evaluate(s=>{const b=document.querySelector(s);if(!b)throw new Error('absent : '+s);b.click();},sel);
const SHOTS=process.env.SHOTS;
(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));
  try{
    if(!docsPath){
      console.log('1. Joueur avant déblocage');
      {const {page,errs,ctx}=await open(browser,base,db,'anne');
        let t=await prog(page);ok(!/Arts obscurs/i.test(t),'section Arts obscurs absente par défaut');
        ok(!/prérequis atteints/.test(t),'joueur : pas d\'encart de déblocage');
        await page.evaluate(()=>{S.view='univers';S.uni='home';render();});ok(/Arts obscurs/.test(await txt(page)),'Univers : entrée Arts obscurs');
        await page.evaluate(()=>{S.uni='art';S.fi=null;render();});t=await txt(page);ok(/Druidisme/.test(t)&&/Spiritisme/.test(t)&&!/Nouvel art obscur/.test(t),'liste des arts ; pas de création pour un joueur');
        await page.evaluate(()=>{S.fi='dru';render();});t=await txt(page);
        ok(/compétence cachée/.test(t)&&/Druides/.test(t),'fiche : sous-titre (compétence, organisation)');
        ok(/Survie 4/.test(t)&&/Occultisme 4 \(spécialité Druidisme\)/.test(t),'bloc Prérequis');
        ok(/Eubage/.test(t)&&/Archidruide/.test(t)&&/Apprenti/i.test(t),'bloc Niveaux (noms propres et communs)');
        ok(/Philtre de guérison/.test(t)&&/Semence de vigueur/.test(t)&&!/\+ Sort/.test(t),'bloc Sorts par niveau ; pas d\'ajout pour un joueur');
        await click(page,'[data-act="aoSortOpen"][data-s="s1"]');await wait(page);let sh=await sheet(page);ok(/Philtre de guérison/.test(sh)&&/Mise en œuvre/.test(sh)&&/5 XP/.test(sh),'fenêtre du sort');
        await page.evaluate(()=>{S.dlg=null;S.fi='spi';render();});t=await txt(page);ok(/sans compétence/.test(t)&&!/Prérequis/i.test(t)&&!/Sorts/i.test(t),'Spiritisme : sans blocs de compétence');
        ok(errs.length===0,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
      console.log('2. Gestion : déblocage');
      {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
        let t=await prog(page);ok(/Arts obscurs/i.test(t)&&/Druidisme : prérequis atteints/.test(t)&&!/Nécromancie : prérequis/.test(t),'gestion : encart pour Druidisme seulement (prérequis atteints)');
        await click(page,'[data-act="aoUnlock"][data-f="dru"]');await wait(page,400);
        ok(!!db.get('chars/sloan').arts&&db.get('chars/sloan').arts.dru.cur===0,'déblocage enregistré (rang 0)');
        await page.evaluate(()=>{S.edit=true;S.view='params';S.ptab='arts';S._force=true;render();});t=await txt(page);
        ok(/Compétence cachée/.test(t)&&/Prérequis/.test(t)&&/Rang maximum/.test(t)&&/Sorts requis pour monter/.test(t),'Paramètres › Référentiel › Arts obscurs');
        await page.evaluate(()=>{S.aoPd.cSort=6;aoParamAct('aoPSave',{});});await wait(page,300);ok(db.get('fiches/dru').cSort===6,'réglage enregistré (coût d\'un sort)');
        await page.evaluate(()=>{S.aoPd=null;aoParams();S.aoPd.cSort=5;aoParamAct('aoPSave',{});});await wait(page,300);
        await page.evaluate(()=>{S.view='univers';S.uni='art';S.fi='dru';S._force=true;render();});
        await click(page,'[data-act="aoSortEd"][data-s=""]');await wait(page);
        await page.evaluate(()=>{const g=S.dlg;g.nom='Amulette de Lugnasad';g.niv=3;aoAct('aoSortSave',{});});await wait(page,300);
        ok(db.get('fiches/dru').sorts.some(x=>x.nom==='Amulette de Lugnasad'&&x.niv===3),'nouveau sort enregistré');
        ok(errs.length===0,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
      console.log('3. Joueur après déblocage');
      {const {page,errs,ctx}=await open(browser,base,db,'anne');
        let t=await prog(page);ok(/Arts obscurs/i.test(t)&&/Druidisme/.test(t)&&!/Nécromancie/.test(t),'section visible avec le seul art débloqué');
        const order=await page.evaluate(()=>{const H=[...document.querySelectorAll('#app h2, #app .rbt .t')].map(h=>h.textContent.trim());return H.indexOf('Capacités féeriques')<H.indexOf('Arts obscurs')&&H.indexOf('Arts obscurs')<H.indexOf('Ressources générales');});ok(order,'placée entre Capacités féeriques et Ressources générales');
        for(let i=0;i<2;i++){await click(page,'[data-act="quick"][data-key="art:dru"]');await wait(page);await page.evaluate(()=>{const b=document.querySelector('#sheetRoot .btn.pri');b&&b.click();});await wait(page,300);}
        ok(db.get('chars/sloan').arts.dru.cur===2,'rangs 1 et 2 achetés (comme une compétence)');
        ok(db.get('chars/sloan').achats.filter(a=>a.key==='art:dru').reduce((s,a)=>s+a.cout,0)===9,'coût : 3 + 6 XP');
        t=await prog(page);ok(/2 sorts Eubage requis \(0\/2\)/.test(t),'rang 3 bloqué sans 2 sorts d\'Eubage');
        ok(await page.evaluate(()=>document.querySelector('[data-act="quick"][data-key="art:dru"]').disabled),'bouton d\'achat désactivé');
        for(const s of ['s1','s2']){await click(page,'[data-act="aoLearn"]');await wait(page);await page.evaluate(s=>aoAct('aoPick',{s}),s);await page.evaluate(()=>aoAct('aoLearnOk',{}));await wait(page,300);}
        ok(db.get('chars/sloan').arts.dru.sorts.join()==='s1,s2','2 sorts appris');ok(db.get('chars/sloan').achats.filter(a=>/^aosort:/.test(a.key)).length===2,'achats de sorts dans l\'historique');
        t=await prog(page);ok(!/requis/.test(t)&&/sorts Eubage ✓/.test(t),'rang 3 accessible');
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'arts-progres.png'),fullPage:true});
        const a2=db.get('chars/sloan').achats.find(a=>a.key==='aosort:dru:s2');await page.evaluate(id=>{const c=cancelAchat(S.chars.sloan,id).c;saveChar(c);},a2.id);await wait(page,300);
        ok(db.get('chars/sloan').arts.dru.sorts.join()==='s1','annuler l\'achat d\'un sort le retire');
        await page.evaluate(()=>{S.view='univers';S.uni='art';S.fi='dru';S._force=true;render();});ok(/Sloan/.test(await txt(page)),'bloc Pratiquants');
        await page.evaluate(()=>{S.view='srch';S.srch={q:'amulette',g:'all'};S._force=true;render();});ok(/Amulette de Lugnasad/.test(await res(page)),'recherche : sort trouvé');
        ok(errs.length===0,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    } else {
      console.log('Données réelles');
      const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      if(impF){const F=JSON.parse(fs.readFileSync(impF,'utf8'));
        await page.evaluate(F=>{S.edit=true;S.view='params';S.ptab='donnees';S.kk={step:'apercu',F,nomF:'f',mode:'maj'};kkPlan();S._force=true;render();},F);
        ok(await page.evaluate(()=>S.kk.plan.filter(x=>x.act==='new').length)===F.items.length,'aperçu : '+F.items.length+' arts à créer');
        await page.evaluate(()=>kkRun());await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:60000});
        const rep=await page.evaluate(()=>S.kk.rep);ok(!rep.err.length&&!rep.imgKo.length&&rep.nNew===F.items.length,'import simulé : '+rep.nNew+' créés, '+rep.imgOk+' images');
        await page.evaluate(()=>{S.kk=null;S.view='univers';S.uni='art';S.fi='f-kk8608299';S._force=true;render();});const t=await txt(page);
        ok(/Eubage/.test(t)&&/Druides/.test(t)&&/Survie 4/.test(t),'Druidisme importé : niveaux, organisation, prérequis');
        await page.evaluate(()=>{S.fi='f-kk8608297';render();});ok(/Discipulus/.test(await txt(page))&&/Nécromanciens/.test(await txt(page)),'Nécromancie importée');}
      for(const c of db.rows.filter(r=>r.coll==='chars'&&r.data.type==='PJ').map(r=>r.id))await page.evaluate(id=>{S.view='sheet';S.sel=id;S.shTab='prog';S._force=true;render();},c);
      await page.evaluate(()=>{S.view='params';S.ptab='arts';S._force=true;render();});
      ok(errs.length===0,'aucune erreur sur les fiches réelles'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})();
