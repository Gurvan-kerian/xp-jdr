/* Compléments Kanka (27/11/2026) : liens vers la fiche de capacité « Caractéristique accrue ».
   Usage : node tests/accrue.test.js docs.json (export réel converti, comme les tests lot8 / lot8b).
   Fiche du PJ (Capacités naturelles), fiche de race (choix définitif), fiche de la capacité (races « choix définitif »),
   visibilité pour un joueur ; sans fiche de capacité : texte simple. */
const fs=require('fs'),path=require('path'),http=require('http');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const CAP={nom:'Caractéristique accrue',type:'passif',desc:'Un aspect de la fée dépasse les possibilités de son espèce.',fx:[],var:[],prec:false};
const docsPath=process.argv[2];if(!docsPath){console.log('Usage : node tests/accrue.test.js docs.json');process.exit(2);}
const DOCS=JSON.parse(fs.readFileSync(docsPath,'utf8'));
{const m=DOCS['meta/capacites']||(DOCS['meta/capacites']={byId:{}});if(!Object.values(m.byId).some(c=>c.nom===CAP.nom))m.byId['cap-caracteristique-accrue']=CAP;}
const PJ='theodule',RACE='fouinards',ME_G='lorenzo',ME_J='florent-4c30';
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.jpg':'image/jpeg'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
  s.listen(0,()=>res(s));});}
function fakeDb(docs){const rows=Object.entries(docs).map(([k,data])=>{const i=k.indexOf('/');return {coll:k.slice(0,i),id:k.slice(i+1),data};});
  const J=(route,b)=>route.fulfill({status:200,contentType:'application/json',body:b===undefined?'':JSON.stringify(b)});
  return {async handle(route){const fn=route.request().url().split('/rpc/')[1];
    if(fn==='xp_list')return J(route,rows);
    if(fn==='xp_since')return J(route,{rows:[],del:[],now:new Date().toISOString()});
    if(fn==='xp_portraits')return J(route,rows.filter(r=>r.coll==='portraits'));
    if(/^xp_(set|delete|img)/.test(fn))return J(route,null);
    return route.fulfill({status:404,body:'absent'});}};}
async function open(browser,base,db,me){const ctx=await browser.newContext({viewport:{width:420,height:900},hasTouch:true});const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  await page.route('**/rest/v1/rpc/**',r=>db.handle(r));await page.route('**/functions/v1/notify',r=>r.fulfill({status:200,contentType:'application/json',body:'{"sent":0}'}));await page.route(/fonts\.(googleapis|gstatic)/,r=>r.fulfill({status:200,body:''}));
  await page.addInitScript(([me])=>{localStorage.setItem('xp.code','test');localStorage.setItem('xp.me',me);},[me]);
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady);await page.waitForTimeout(300);
  await page.evaluate(()=>{S.fichesReady=true;S.id&&(S.id.state='ok');render();});
  return {page,errs,ctx};}
/* liens de capacité présents dans le HTML rendu, avec leur libellé */
const capLinks=(page,html)=>page.evaluate(h=>{const d=document.createElement('div');d.innerHTML=h;return [...d.querySelectorAll('button.lk')].map(b=>b.textContent.trim()+'|'+b.outerHTML);},html);
const pjCaps=page=>page.evaluate(id=>{S.forme='d';return ['fiche','feer'].map(t=>viewSheetTab(S.chars[id],t)).join('');},PJ);
(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  try{
    for(const [me,lab] of [[ME_G,'Gestion'],[ME_J,'Joueur du PJ']]){
      console.log(lab+' :');
      const {page,errs,ctx}=await open(browser,base,fakeDb(JSON.parse(JSON.stringify(DOCS))),me);
      const acc=await page.evaluate(id=>S.chars[id].accru,PJ);
      const lab2=acc+' '+(acc==='Esprit'||acc==='Sang Froid'?'accru':'accrue');
      const h=await page.evaluate(n=>accLk(n),acc);
      ok(/class="lk"/.test(h)&&h.includes(lab2),`accLk(« ${acc} ») = lien « ${lab2} »`);
      const L=await capLinks(page,await pjCaps(page));
      ok(L.some(x=>x.startsWith(lab2+'|')),'fiche du PJ : « '+lab2+' » est un lien');
      const rh=await page.evaluate(r=>{const x=S.races[r];return (x.choix||[]).filter(o=>o[0]==='acc').map(o=>accLk(o[1])).join('');},RACE);
      ok((rh.match(/class="lk"/g)||[]).length===(await page.evaluate(r=>(S.races[r].choix||[]).filter(o=>o[0]==='acc').length,RACE)),'fiche de race : chaque caractéristique accrue du choix définitif est un lien');
      const uses=await page.evaluate(()=>{const id=capIdByName(S.capacites,ACC_CAP);return elUses('cap',id).filter(u=>u.choix).map(u=>u.nom);});
      ok(uses.includes(await page.evaluate(r=>S.races[r].sing,RACE)),'fiche de capacité : la race figure en « choix définitif » ('+uses.length+' races)');
      const seen=await page.evaluate(()=>elSeen('cap',capIdByName(S.capacites,ACC_CAP)));
      ok(seen,'capacité connue de la personne');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' / '):''));
      await ctx.close();}
    console.log('Sans fiche de capacité :');
    const D2=JSON.parse(JSON.stringify(DOCS));for(const k in D2['meta/capacites'].byId)if(D2['meta/capacites'].byId[k].nom===CAP.nom)delete D2['meta/capacites'].byId[k];
    const {page,errs,ctx}=await open(browser,base,fakeDb(D2),ME_G);
    const h=await page.evaluate(()=>accLk('Esprit'));ok(!/class="lk"/.test(h)&&h.includes('Esprit accru'),'texte simple « Esprit accru »');
    const L=await capLinks(page,await pjCaps(page));ok(!L.some(x=>/accrue?\|/.test(x)),'fiche du PJ : pas de lien');
    ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' / '):''));await ctx.close();
  }catch(e){fails++;console.log('  ✗ '+e.stack);}
  await browser.close();srv.close();console.log(fails?`${fails} échec(s)`:'Tout est bon.');process.exit(fails?1:0);})();
