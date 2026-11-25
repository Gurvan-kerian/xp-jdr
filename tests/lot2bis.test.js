/* Lot 2 bis (24/11/2026) : pouvoirs et capacités dans Univers, image entière sur les fiches, illustration masquée des PJ, filtre « Achetables ».
   Usage : node tests/lot2bis.test.js [docs.json] — données déjà en version 2 (export Supabase converti au format coll/id → data). */
const fs=require('fs'),path=require('path'),http=require('http');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
const docsPath=process.argv[2]||path.join(__dirname,'fixtures','donnees-v2.json');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.jpg':'image/jpeg'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
  s.listen(0,()=>res(s));});}
const GIF='data:image/gif;base64,R0lGODlhAQABAAAAACw=';
function fakeDb(docs){const rows=Object.entries(docs).map(([k,data])=>{const [coll,id]=k.split('/');return {coll,id,data};});const imgs={},asked=[];
  const J=(route,b)=>route.fulfill({status:200,contentType:'application/json',body:b===undefined?'':JSON.stringify(b)});
  return {rows,imgs,asked,async handle(route){const fn=route.request().url().split('/rpc/')[1];const a=JSON.parse(route.request().postData()||'{}');
    if(fn==='xp_list')return J(route,rows);
    if(fn==='xp_since')return J(route,{rows:[],del:[],now:new Date().toISOString()});
    if(fn==='xp_set'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);const r={coll:a.p_coll,id:a.p_id,data:a.p_data};if(i>=0)rows[i]=r;else rows.push(r);return J(route);}
    if(fn==='xp_delete'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);if(i>=0)rows.splice(i,1);return J(route);}
    if(fn==='xp_portraits')return J(route,[]);
    if(fn==='xp_img_get'){asked.push(a.p_id);return J(route,imgs[a.p_id]||null);}
    if(fn==='xp_img_set'){imgs[a.p_id]=a.p_data;return J(route);}
    if(fn==='xp_img_del'){delete imgs[a.p_id];return J(route);}
    return route.fulfill({status:404,body:'absent'});}};}
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
async function open(browser,base,db,me){const ctx=await browser.newContext({viewport:{width:420,height:900}});const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|service ?worker/i.test(m.text()))errs.push(m.text());});
  await page.route('**/rest/v1/rpc/**',r=>db.handle(r));await page.route('**/functions/v1/notify',r=>r.fulfill({status:200,contentType:'application/json',body:'{"sent":0}'}));await page.route(/fonts\.(googleapis|gstatic)/,r=>r.fulfill({status:200,body:''}));
  await page.addInitScript(([me])=>{localStorage.setItem('xp.code','test');localStorage.setItem('xp.me',me);},[me]);
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady);await page.waitForTimeout(300);
  return {page,errs,ctx};}
/* Nombre d'éléments que doit voir la personne : calcul indépendant à partir des yeux des races */
const expected=k=>{const M=(k==='pw'?S.pouvoirs:S.capacites)||{};let n=0;for(const id in M){if(elUses(k,id).some(u=>{const x=raceRec(u.cr),e=eyeOf(u.cr,x),mine=myRace(x.sing);if(!(e.fiche||mine))return false;return k==='pw'?!!(e.pw||[])[u.i]&&!pwUnk(x,u.i):(mine||!!e.cap);}))n++;}return [n,Object.keys(M).length];};
(async()=>{
  const docs=JSON.parse(fs.readFileSync(docsPath,'utf8'));const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch();
  try{
    console.log('A. Pouvoirs et capacités dans Univers — joueur');
    {const db=fakeDb(JSON.parse(JSON.stringify(docs)));const {page,errs,ctx}=await open(browser,base,db,'peter');
      await page.evaluate(()=>{S.view='univers';S.uni='home';render();});
      const home=await page.textContent('#app');ok(/Peuples[\s\S]*Races[\s\S]*Pouvoirs et capacités[\s\S]*Bestiaire/.test(home),'entrée « Pouvoirs et capacités » dans Peuples, après Races (puis Bestiaire, lot 4)');
      await page.click('[data-act="uni"][data-v="pouvoirs"]');
      for(const k of ['pw','cap']){await page.evaluate(k=>{S.pcat=k;S.pq='';S.cq='';S.pwf='all';render();},k);
        const [n,tot]=await page.evaluate(`(${expected.toString()})('${k}')`);const shown=await page.$$eval('[data-act="consOpen"]',l=>l.length);
        ok(shown===n&&(k==='cap'||n<tot),`${k==='pw'?'pouvoirs':'capacités'} : ${shown} visibles sur ${tot} (attendu ${n})`);}
      await page.evaluate(()=>{S.pcat='pw';render();});
      ok(!(await page.$('[data-act="elEdit"]'))&&!(await page.$('[data-act="elVis"]')),'joueur : pas d\'édition ni de filtre de visibilité');
      const first=await page.$('[data-act="consOpen"]');await first.click();await page.waitForSelector('.sheet.cons');
      const bad=await page.evaluate(()=>{const g=S.dlg;return elUses(g.t,g.id).filter(u=>!elUseSeen(g.t,u)).map(u=>raceNm(raceRec(u.cr))).filter(n=>[...document.querySelectorAll('.sheet.cons .lkr')].some(e=>e.textContent.includes(n)));});
      ok(!bad.length,'fiche : seules les races où le pouvoir est révélé'+(bad.length?' ('+bad.join(', ')+')':''));
      ok(!(await page.$('.sheet.cons [data-act="consEdit"]')),'fiche : pas de « Modifier » pour un joueur');
      await page.evaluate(()=>{S.dlg=null;S.view='univers';S.uni='pouvoirs';S.pq='zzzz';render();});ok(/Aucun résultat/.test(await page.textContent('#app')),'recherche sans résultat');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}

    console.log('A. Gestion hors / en mode édition, Paramètres');
    {const db=fakeDb(JSON.parse(JSON.stringify(docs)));const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      ok(await page.evaluate(()=>isGest()),'lorenzo a les droits de gestion');
      await page.evaluate(()=>{S.edit=false;S.view='univers';S.uni='pouvoirs';S.pcat='pw';S.pq='';render();});
      const [n,tot]=await page.evaluate(`(${expected.toString()})('pw')`);const shown=await page.$$eval('[data-act="consOpen"]',l=>l.length);
      ok(shown===n,`hors mode édition : vue joueur (${shown} / attendu ${n})`);
      await page.evaluate(()=>{S.edit=true;S.elVis='all';render();});const all=await page.$$eval('[data-act="elEdit"][data-k="pw"][data-id]:not([data-id=""])',l=>l.length);
      ok(all===tot,`mode édition : tout le catalogue (${all} / ${tot})`);
      const prep=await page.$$eval('.lrw.prep',l=>l.length);ok(prep===tot-n,`non révélés grisés (${prep})`);
      await page.evaluate(()=>{S.elVis='prep';render();});ok(await page.$$eval('[data-act="elEdit"][data-k="pw"][data-id]:not([data-id=""])',l=>l.length)===tot-n,'filtre « Non révélés »');
      await page.evaluate(()=>{S.elVis='all';const id=Object.keys(S.pouvoirs).find(i=>elUses('pw',i).some(u=>!elUseSeen('pw',u)));S.dlg={kind:'cons',t:'pw',id};render();});
      ok(!!(await page.$('.sheet.cons .lkr.prep')),'fiche en mode édition : races non révélées grisées');ok(!!(await page.$('.sheet.cons [data-act="consEdit"]')),'fiche en mode édition : « Modifier »');
      await page.click('.sheet.cons [data-act="consEdit"]');ok(await page.evaluate(()=>S.dlg&&S.dlg.kind==='elEdit'),'« Modifier » ouvre l\'éditeur actuel');
      await page.evaluate(()=>{S.dlg=null;S.edit=true;S.view='params';S.ptab='';render();});const tabs=await page.$$eval('[data-act="ptab"]',l=>l.map(b=>b.textContent));
      ok(!tabs.some(t=>/Pouvoirs et capacités/.test(t))&&tabs.length===7,'Paramètres : entrée retirée ('+tabs.length+' entrées)');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}

    console.log('B / C. Images entières et illustration masquée');
    {const db=fakeDb(JSON.parse(JSON.stringify(docs)));const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      const rid=await page.evaluate(()=>raceCres()[0].id);db.imgs['ill-race-'+rid]=GIF;
      await page.evaluate(([rid,G])=>{S.ptr={...(S.ptr||{}),['ill-race-'+rid]:G};S.edit=false;navGo({t:'race',id:rid});render();},[rid,GIF]);await page.waitForTimeout(300);
      ok(!!(await page.$('.rhead .fibig img')),'fiche de race : image entière dans l\'en-tête');
      ok(db.asked.includes('ill-race-'+rid),'grande image demandée à l\'ouverture de la fiche');
      await page.click('.rhead .fibig');ok(!!(await page.$('#fiVw')),'clic : visionneur plein écran');await page.keyboard.press('Escape');await page.evaluate(()=>fiViewerClose());
      await page.evaluate(([rid])=>{S.view='univers';S.uni='creatures';S.rf=null;render();},[rid]);ok(!(await page.$('#app .fibig')),'liste des races : pas d\'agrandissement');
      const pid=await page.evaluate(()=>Object.keys(S.pouvoirs)[0]);await page.evaluate(([pid,G])=>{S.ptr={...S.ptr,['ill-pw-'+pid]:G};S.dlg={kind:'cons',t:'pw',id:pid};render();},[pid,GIF]);
      ok(!!(await page.$('.sheet.cons .fibig img')),'fiche de pouvoir : image entière');
      await page.evaluate(()=>{S.dlg=null;S.view='sheet';S.sel='kerian';S.shTab='fiche';S.forme='d';render();});await page.waitForTimeout(200);
      ok(!!(await page.$('.shill label.fibig.vide input[data-ptrfile="ill-demasque-kerian"]')),'PJ démasqué sans illustration : cadre vide (le portrait reste à part)');
      ok(!!(await page.$('.shhd label.shmed.ed input[data-ptrfile="kerian"]')),'en-tête : médaillon du portrait avec ✎');
      await page.evaluate(G=>{S.ptr={...S.ptr,'ill-demasque-kerian':G};render();},GIF);
      ok(!!(await page.$('.shill .fibig img[data-big="ill-demasque-kerian"]')),'PJ démasqué : illustration démasquée en entier');
      await page.evaluate(()=>{S.forme='m';render();});
      ok(!!(await page.$('.shill label.fibig.vide input[data-ptrfile="ill-masque-kerian"]')),'PJ masqué sans illustration : cadre vide avec « Ajouter »');
      await page.evaluate(G=>{S.ptr={...S.ptr,'ill-masque-kerian':G};render();},GIF);
      ok(!!(await page.$('.shill .fibig img[data-big="ill-masque-kerian"]')),'PJ masqué : illustration masquée');
      await page.evaluate(()=>{S.sel='ismael';S.shTab='fiche';render();});
      ok(!(await page.$('.formesw'))&&!!(await page.$('.pnhead .shmed')),'PNJ (lot 4) : portrait dans l\'en-tête, sans sélecteur de forme');
      await page.evaluate(()=>{const p=ME;ME='peter';render();window.__m=!!document.querySelector('.shhd label.shmed');ME=p;render();});ok(!(await page.evaluate(()=>window.__m)),'autre joueur : médaillon sans ✎');
      await page.evaluate(()=>{S.view='team';S.sel=null;render();});ok(!(await page.$('#app .fibig')),'cartes des personnages : pas d\'agrandissement');
      /* enregistrement : la grande image est gardée pour un portrait de personnage */
      await page.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=40;cv.height=60;cv.getContext('2d').fillRect(0,0,40,60);const G=cv.toDataURL('image/png');const im=new Image();await new Promise(r=>{im.onload=r;im.onerror=r;im.src=G;setTimeout(r,2000);});window._ptrImg=im;S.dlg={kind:'ptr',cid:'ill-masque-kerian',lab:'',back:null,src:G,w:1,h:1,base:220,z:1,x:20,y:20};const b=document.createElement('button');b.dataset.act='ptrSave';document.body.appendChild(b);b.click();b.remove();});
      await page.waitForTimeout(300);ok(!!db.imgs['ill-masque-kerian'],'image complète enregistrée pour une illustration de personnage');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}

    console.log('E. Filtre « Achetables »');
    {const db=fakeDb(JSON.parse(JSON.stringify(docs)));const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      const prof=await page.evaluate(()=>{const c=S.chars.kerian;return (c.profils||[]).map(p=>p.nom).find(n=>ppRows(c,n).length);});
      await page.evaluate(p=>{S.view='sheet';S.sel='kerian';S.ppAch=false;S.dlg={kind:'ppBuy',cid:'kerian',prof:p,rub:'all',q:'',sel:null};render();},prof);
      const n0=await page.$$eval('#sheetRoot .ppi:not(.oth)',l=>l.length);const chip=await page.textContent('#sheetRoot [data-act="ppAch"]');const nOk=+(chip.match(/(\d+)/)||[])[1];
      ok(/Achetables/.test(chip)&&n0>0,`puce « ${chip.trim()} », ${n0} lignes`);
      ok(await page.$$eval('#sheetRoot .ppw.no .why',l=>l.length)>0||nOk===n0,'lignes non achetables grisées avec leur raison');
      await page.click('#sheetRoot [data-act="ppAch"]');const n1=await page.$$eval('#sheetRoot .ppi:not(.oth)',l=>l.length);
      ok(n1===nOk&&await page.$$eval('#sheetRoot .ppi:not(.oth)',l=>l.every(e=>e.classList.contains('ok'))),`filtre allumé : ${n1} achetables`);
      ok(!!(await page.$('#sheetRoot [data-act="ppOther"]')),'ligne « Autre achat » toujours visible');
      await page.evaluate(()=>{S.dlg={...S.dlg};render();});ok(await page.evaluate(()=>S.ppAch===true),'choix gardé pendant la session');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.error(e);}
  finally{await browser.close();srv.close();}
  console.log(fails?`\n${fails} échec(s)`:'\nTous les tests passent.');process.exit(fails?1:0);})();
