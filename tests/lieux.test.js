/* Lot 2 bis (28/11/2026) : chemin des lieux et natures cumulables. Usage : node tests/lieux.test.js — données inventées. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-27T09:00:00.000Z';
function demoDocs(){const ch=(id,court,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},"PJ")`),...o});
  const pnj=(id,nom,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(nom)},${JSON.stringify(nom)},"PNJ")`),vis:'rev',...o});
  const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',vis:'rev',eye:{desc:true,sait:true,pers:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:['kerian']},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'chars/kerian':ch('kerian','Kerian',{situ:{lieux:[{id:'sk1',nom:'Atelier',f:'f-d'}]}}),'chars/sloan':ch('sloan','Sloan',{}),
    'chars/adele':pnj('adele','Adèle Grisemain',{situ:{lieux:[{id:'sa1',nom:'Cartoucherie',f:'f-cart',nat:'res',res:true}]}}),
    'meta/creatures':{list:[]},'meta/races':{byId:{}},
    'fiches/f-vda':fi('f-vda','lieu','Ville D\'Avray et Sèvres',{type:'Fief'}),
    'fiches/f-cart':fi('f-cart','lieu','Cartoucherie',{type:'Usine',parent:'f-vda'}),
    'fiches/f-a':fi('f-a','lieu','France',{}),'fiches/f-b':fi('f-b','lieu','Paris',{parent:'f-a'}),'fiches/f-c':fi('f-c','lieu','Montmartre',{parent:'f-b'}),'fiches/f-d':fi('f-d','lieu','Atelier',{parent:'f-c'}),
    'fiches/f-prep':fi('f-prep','lieu','Cité cachée',{vis:'prep'}),'fiches/f-sous':fi('f-sous','lieu','Crypte',{parent:'f-prep'}),
    'gains/all':{events:[]}};}
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
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));
  try{
    console.log('1. Chemin et nature (PNJ)');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      let t=await page.evaluate(()=>{navGo({t:'perso',id:'adele'});S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Ville D'Avray et Sèvres › Cartoucherie/.test(t),'chemin : Ville D\'Avray et Sèvres › Cartoucherie');ok(/Cartoucherie · résidence/.test(t),'ancienne nature lue : résidence');
      await page.click('[data-act="situEd"][data-k="lieux"]');await wait(page);let s=await sheet(page);
      ok(/Résidence/.test(s)&&/Propriétaire/.test(s)&&/Travail/.test(s)&&await page.$('#sheetRoot input[placeholder="autre, à préciser"]')!==null,'fenêtre : 3 cases + champ libre');
      ok(await page.$eval('#sheetRoot [data-act="situNatT"][data-v="res"]',b=>b.getAttribute('aria-pressed'))==='true','Résidence cochée');
      await page.click('#sheetRoot [data-act="situNatT"][data-v="trav"]');await wait(page,150);
      await fill(page,'#sheetRoot input[placeholder="autre, à préciser"]','client régulier');
      await page.click('#sheetRoot [data-act="situSave"]');await wait(page,400);
      let e=db.get('chars/adele').situ.lieux[0];ok(JSON.stringify(e.nats)==='["res","trav"]'&&e.natx==='client régulier'&&e.res===true&&e.nat==='res','enregistré : résidence + travail + texte, res gardé');
      t=await txt(page);ok(/Cartoucherie · résidence, travail, client régulier/.test(t),'affichage cumulé');
      await page.click('[data-act="situEd"][data-k="lieux"]');await wait(page);
      await page.click('#sheetRoot [data-act="situNatT"][data-v="res"]');await page.click('#sheetRoot [data-act="situNatT"][data-v="trav"]');await wait(page,150);
      await fill(page,'#sheetRoot input[placeholder="autre, à préciser"]','');await page.click('#sheetRoot [data-act="situSave"]');await wait(page,300);
      ok(/Coche au moins une nature/.test(await sheet(page)),'refus sans nature ni texte');
      await fill(page,'#sheetRoot input[placeholder="autre, à préciser"]','y est née');await page.click('#sheetRoot [data-act="situSave"]');await wait(page,400);
      e=db.get('chars/adele').situ.lieux[0];ok(e.nats.length===0&&e.natx==='y est née'&&e.res===false&&e.nat==='autre','texte libre seul');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
    console.log('2. Chemin long et lieu préparé');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      const r=await page.evaluate(()=>({long:lieuPath('f-d').map(p=>p.nom).join('>'),h:lieuPathH('f-d').replace(/<[^>]+>/g,''),prep:lieuPath('f-sous').length}));
      ok(r.long==='France>Paris>Montmartre','parents dans l\'ordre');ok(/France › … › Montmartre › /.test(r.h),'au-delà de 2 parents : premier › … › dernier');ok(r.prep===0,'parent préparé masqué pour un joueur');
      let t=await page.evaluate(()=>{navGo({t:'perso',id:'kerian'});S.shTab='situ';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/France › … › Montmartre › Atelier/.test(t),'fiche PJ : chemin dans la Situation');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
    console.log('3. Fiche du lieu');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      let t=await page.evaluate(()=>{S.edit=true;navGo({t:'fiche',id:'f-cart'});S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Adèle Grisemain · y est née/.test(t),'personnage lié avec sa nature');
      await page.click('[data-act="fi6Lk"][data-m="pers"]');await wait(page);
      await page.selectOption('#fi6-cid','sloan');await page.click('#sheetRoot [data-act="fi6Nat"][data-v="prop"]');await page.click('#sheetRoot [data-act="fi6Nat"][data-v="trav"]');await wait(page,150);
      await page.click('#sheetRoot [data-act="fi6LkSave"]');await wait(page,400);
      const e=(db.get('chars/sloan').situ||{}).lieux||[];ok(e.length===1&&JSON.stringify(e[0].nats)==='["prop","trav"]'&&e[0].res===false,'lien ajouté depuis le lieu : propriétaire + travail');
      t=await txt(page);ok(/Sloan · propriétaire, travail/.test(t),'affiché sur la fiche du lieu');
      await page.click('[data-act="fi6Lk"][data-m="pers"]');await wait(page);await page.selectOption('#fi6-cid','sloan');await page.click('#sheetRoot [data-act="fi6LkSave"]');await wait(page,300);
      ok(/existe déjà/.test(await sheet(page)),'doublon refusé');
      const x=await page.evaluate(()=>{const W={fi:S.fiches};const D=TX_DET.find(d=>d.sh==='PNJ – Situation');const r=D.rows(W,{},S.chars.adele);return r[0].c['Nature'];});
      ok(x==='y est née','tableur : nature exportée');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
  }catch(e){fails++;console.log('ERREUR',e);}
  await browser.close();srv.close();console.log(fails?`\n${fails} échec(s)`:'\nTout est vert.');process.exit(fails?1:0);})();
