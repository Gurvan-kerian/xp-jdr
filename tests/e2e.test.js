/* Test de bout en bout dans un vrai navigateur (Playwright), avec un Supabase simulé.
   Usage : node tests/e2e.test.js [docs.json]
   Les données viennent de tests/fixtures/donnees-anonymisees.json (copie des données réelles, noms des joueurs remplacés). */
const fs=require('fs'),path=require('path'),http=require('http');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
const docsPath=process.argv[2]||path.join(__dirname,'fixtures','donnees-anonymisees.json');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.jpg':'image/jpeg'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const f=path.join(ROOT,u==='/'?'index.html':u);
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
  s.listen(0,()=>res(s));});}
/* Supabase simulé : une table de documents (coll, id, data) */
function fakeDb(docs){const rows=Object.entries(docs).map(([k,data])=>{const [coll,id]=k.split('/');return {coll,id,data};});const writes=[];
  return {rows,writes,get:k=>{const [c,i]=k.split('/');const r=rows.find(x=>x.coll===c&&x.id===i);return r&&r.data;},
    async handle(route){const fn=route.request().url().split('/rpc/')[1];const a=JSON.parse(route.request().postData()||'{}');
      if(fn==='xp_list')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(rows)});
      if(fn==='xp_set'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);const r={coll:a.p_coll,id:a.p_id,data:a.p_data};if(i>=0)rows[i]=r;else rows.push(r);writes.push(a.p_coll+'/'+a.p_id);return route.fulfill({status:200,contentType:'application/json',body:''});}
      if(fn==='xp_delete'){const i=rows.findIndex(x=>x.coll===a.p_coll&&x.id===a.p_id);if(i>=0)rows.splice(i,1);writes.push('-'+a.p_coll+'/'+a.p_id);return route.fulfill({status:200,body:''});}
      if(fn==='xp_portraits')return route.fulfill({status:200,contentType:'application/json',body:'[]'});
      return route.fulfill({status:404,body:'absent du Supabase simulé'});}};}
const stable=v=>Array.isArray(v)?'['+v.map(stable).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}':JSON.stringify(v);
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
async function open(browser,base,db,me){const ctx=await browser.newContext();const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|service ?worker/i.test(m.text()))errs.push(m.text());});
  await page.route('**/rest/v1/rpc/**',r=>db.handle(r));db.notifs=db.notifs||[];await page.route('**/functions/v1/notify',r=>{try{db.notifs.push(JSON.parse(r.request().postData()||'{}'));}catch(e){}return r.fulfill({status:200,contentType:'application/json',body:'{"sent":0}'});});await page.route(/fonts\.(googleapis|gstatic)/,r=>r.fulfill({status:200,body:''}));
  await page.addInitScript(([me])=>{localStorage.setItem('xp.code','test');localStorage.setItem('xp.me',me);},[me]);
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady);await page.waitForTimeout(300);
  return {page,errs,ctx};}
(async()=>{
  const docs=JSON.parse(fs.readFileSync(docsPath,'utf8'));const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  const browser=await chromium.launch();
  try{
    console.log('1. Joueur sans droits de gestion, données en version 0');
    {const db=fakeDb(JSON.parse(JSON.stringify(docs)));const {page,errs,ctx}=await open(browser,base,db,'peter');
      const t=await page.textContent('#app');ok(/Mise à jour en attente/.test(t),'bandeau « Mise à jour en attente »');
      ok(!(await page.$('[data-act="migRun"]')),'pas de bouton de mise à jour');
      ok(await page.evaluate(()=>writesLocked()),'appli en lecture seule');
      ok(!errs.length,'aucune erreur dans la console'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    console.log('2. Gestion : lancer la mise à jour');
    const db=fakeDb(JSON.parse(JSON.stringify(docs)));const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
    let t=await page.textContent('#app');ok(/Mise à jour des données disponible \(version 0 → 1\)/.test(t),'carte « Mise à jour des données disponible (version 0 → 1) »');
    ok(/As-tu fait ta sauvegarde/.test(t),'rappel de la sauvegarde');
    const n0=db.writes.length;ok(n0===0,'aucune écriture avant le lancement');
    await page.click('[data-act="migRun"]');await page.waitForFunction(()=>S.migDone||S.migErr,null,{timeout:15000});
    ok(await page.evaluate(()=>!S.migErr),'mise à jour terminée sans erreur');
    ok(db.get('meta/schema')&&db.get('meta/schema').v===1,'version 1 enregistrée dans Supabase');
    ok(db.writes[db.writes.length-1]==='meta/schema','meta/schema écrit en dernier');
    ok(!!db.get('meta/capacites'),'catalogue des capacités enregistré');
    t=await page.textContent('#app');ok(/Mise à jour des données terminée/.test(t),'carte de fin de mise à jour');
    console.log('3. Après la mise à jour');
    ok(await page.evaluate(()=>!writesLocked()&&modelV1()),'écritures de nouveau autorisées, modèle 1 actif');
    const pdv=await page.evaluate(()=>[derived(S.chars.massetoc,'m')[0][1],derived(S.chars.massetoc,'d')[0][1]]);ok(pdv[0]===27&&pdv[1]===27,'Masse Toc : 27 PdV sous les deux formes ('+pdv+')');
    await page.click('[data-act="goDonnees"]');t=await page.textContent('#app');
    ok(/Version des données\s*1/.test(t),'Paramètres › Données : version 1');ok(/Journal de gestion/.test(t),'journal des signalements affiché');
    ok(await page.$$eval('.ui-sigr',l=>l.length)>0,'signalements listés');
    const tabs=await page.$$eval('[data-act="ptab"]',l=>l.map(b=>b.textContent));ok(!tabs.includes('Bonus')&&tabs.includes('Données'),'onglet Bonus retiré, onglet Données présent');
    /* ajout d'un signalement manuel */
    await page.click('[data-act="sigNew"]');await page.selectOption('[data-sig="t"]','race');await page.selectOption('[data-sig="id"]','loups-garous');
    await page.fill('[data-sig="champ"]','Vision');await page.fill('[data-sig="note"]','Nyctalopie = Vision nocturne ?');await page.click('[data-act="sigAdd"]');
    await page.waitForTimeout(300);ok((db.get('meta/signalements').list||[]).some(s=>s.note==='Nyctalopie = Vision nocturne ?'),'signalement manuel enregistré');
    /* éditeur de race : ouvrir et enregistrer sans rien changer */
    const before=stable(db.get('meta/races'));await page.evaluate(()=>{S.view='univers';S.uni='creatures';S.rf=rfDraft('trolls');render();});
    await page.click('[data-act="rfSave"]');await page.waitForTimeout(400);
    ok(stable(db.get('meta/races'))===before,'fiche Troll enregistrée sans changement : données identiques');
    await page.evaluate(()=>{S.rf=null;S.view='sheet';S.sel='kerian';render();});t=await page.textContent('#app');ok(/Kerian/.test(t),'fiche de Kerian affichée');
    await page.evaluate(()=>{S.view='params';S.ptab='pouvoirs';render();});ok(await page.$$eval('.lrow',l=>l.length)>=70,'catalogue des pouvoirs affiché');
    /* tour de l'appli : chaque écran s'affiche sans erreur, en gestion puis comme un joueur */
    const tourErr=await page.evaluate(()=>{const bad=[];const tryV=(lab,f)=>{try{f();render();renderSheet();}catch(e){bad.push(lab+' : '+e.message);}};
      for(const asP of [false,true]){S.asPlayer=asP;const who=asP?'joueur':'gestion';
        for(const v of ['home','gains','team','planning','players','rules'])tryV(who+' '+v,()=>{S.rf=null;S.view=v;});
        for(const id in S.chars)for(const t of ['prog','full'])tryV(who+' fiche '+id+' '+t,()=>{S.view='sheet';S.sel=id;S.shTab=t;S.pwOpen={[id]:true};});
        tryV(who+' secrets',()=>{S.view='univers';S.uni='secrets';});tryV(who+' races',()=>{S.view='univers';S.uni='creatures';S.rf=null;});
        for(const cr of S.creatures)tryV(who+' race '+cr.id,()=>{S.view='univers';S.uni='creatures';S.rf=rfDraft(cr.id);});
        for(const t of PARAM_TABS.map(x=>x[0]))tryV(who+' paramètres '+t,()=>{S.rf=null;S.view='params';S.ptab=t;});
        for(const id of Object.keys(S.pouvoirs).slice(0,10))tryV(who+' pouvoir '+id,()=>{const p=pwCat(id);S.dlg={kind:'pwEdit',id,nom:p.nom,desc:p.desc||'',fx:clone(p.fx||[]),fxEd:null};});
        S.dlg=null;}
      S.asPlayer=false;S.view='home';S.rf=null;render();return bad;});
    ok(!tourErr.length,'tous les écrans s\'affichent sans erreur ('+(tourErr.length?tourErr.slice(0,5).join(' | '):'gestion et joueur')+')');
    ok(!errs.length,'aucune erreur dans la console'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();
    console.log('4. Rechargement après mise à jour');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');const t=await page.textContent('#app');ok(!/Mise à jour des données disponible/.test(t),'plus de carte de mise à jour');
      const nw=db.writes.length;await page.waitForTimeout(800);ok(db.writes.length===nw,'aucune écriture au chargement');ok(!errs.length,'aucune erreur dans la console'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    console.log('5. Lot 2 « Confort et secrets »');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');let t;
      ok(await page.$$eval('#bnav button svg',l=>l.length)===5,'barre du bas : 5 pictos');
      t=await page.textContent('#app');ok(/complément des éléments de lore présents sur le Kanka/.test(t),'message d\'accueil');
      ok(await page.$eval('.hmsg a',a=>a.href)==='https://app.kanka.io/w/350361','lien Kanka de la campagne sur le mot « Kanka »');
      await page.evaluate(()=>{S.view='sheet';S.sel='kerian';S.shTab='full';render();});await page.reload();await page.waitForFunction(()=>typeof S!=='undefined'&&S.playersReady&&S.racesReady);await page.waitForTimeout(300);
      ok(await page.evaluate(()=>S.view==='sheet'&&S.sel==='kerian'&&S.shTab==='full'),'rechargement : même page et même onglet');
      t=await page.textContent('.shrace');ok(/Elfe · Ordinaire/.test(t),'rang à côté de la race ('+t.trim()+')');
      ok(/search\?q=Kerian/.test(await page.$eval('.shname .kk',a=>a.href)),'bouton Kanka du personnage : recherche sur le nom');
      const f=await page.evaluate(()=>derFormula(S.chars.kerian,'m','Esquive'));ok(/^Esquive : 5 \+ AGI \(\d+\) \+ Mouvement \(\d+\)/.test(f),'détail du calcul : '+f);
      await page.evaluate(()=>{S.shTab='prog';render();});t=await page.textContent('.goal');ok(/Rang (Profond|Légendaire)/.test(t),'encart de rang : '+t.replace(/\s+/g,' ').trim());
      const rdy=await page.evaluate(()=>{const c=clone(S.chars.kerian);c.feerie.cur=Math.max(c.feerie.cur,7);c.atout.cur=Math.max(c.atout.cur,4);const r=ref(c,'carac:Agilité');r.o.cur=Math.max(r.o.cur||0,6);const pr=(c.profils||[]).flatMap(p=>p.comps||[]).find(x=>x.max>=7);if(pr)pr.cur=Math.max(pr.cur||0,6);const S0=S.chars.kerian;S.chars.kerian=c;S.shTab='prog';S.view='sheet';S.sel='kerian';render();const txt=document.querySelector('.goal').textContent;S.chars.kerian=S0;render();return {r:rangInfo(c).ready,txt};});
      ok(rdy.r&&/Acquérir le pouvoir profond/.test(rdy.txt)&&/Atouts ✓/.test(rdy.txt),'critères réunis : '+rdy.txt.replace(/\s+/g,' ').trim());
      /* Paramètres : nouveaux libellés */
      await page.evaluate(()=>{S.view='params';S.ptab='couts';render();});const tabs=await page.$$eval('[data-act="ptab"]',l=>l.map(b=>b.textContent));
      ok(tabs.join('|')==='Ratios|Rang PJ|Création|Rangs de PNJ|XP Groupe|Pouvoirs|Données','libellés des onglets : '+tabs.join(', '));
      /* case « inconnu » : le MJ nomme le pouvoir légendaire du Troll, visible par la table */
      await page.evaluate(()=>{S.view='univers';S.uni='creatures';S.rf=rfDraft('trolls');S.rf.pw[7]=['Rage des montagnes',false,''];render();});
      const eyeL=await page.evaluate(()=>{const cr=S.creatures.find(c=>c.id==='trolls');const e=eyeOf(cr,raceRec(cr));return !!(e.fiche&&e.pw[7]);});
      await page.click('[data-act="rfSave"]');await page.waitForTimeout(200);
      ok(!eyeL||!!(await page.$('[data-act="rfUnkKeep"]')),'avertissement « Garder ce pouvoir inconnu ? »');
      if(eyeL)await page.click('[data-act="rfUnkKeep"]');await page.waitForTimeout(400);
      const tr=db.get('meta/races').byId.trolls;ok(tr.pw.l&&tr.pwi[7]===true,'pouvoir nommé et case « inconnu » cochée ('+tr.pw.l+')');
      ok(await page.evaluate(()=>{S.asPlayer=true;const v=pwShown(raceRec(S.creatures.find(c=>c.id==='trolls')),7);S.asPlayer=false;return v;})==='Inconnu','la table lit « Inconnu »');
      /* rôle MJ : non modifiable, droits de gestion d'office */
      ok(await page.evaluate(()=>lastMJ(S.players['christophe-zzvy'])&&hasGest(S.players['christophe-zzvy'])),'MJ : rôle verrouillé, gestion d\'office');
      /* consigner : masqué, sans session */
      const sn=await page.evaluate(()=>{const s=S.secrets.find(x=>!x.titre&&(x.slots.h||[]).some(y=>!y));S.view='univers';S.uni='secrets';S.sec=s.n;render();return s.n;});
      await page.click('[data-act="secAdd"]');t=await page.textContent('#sheetRoot');ok(!/Session de rattachement/.test(t)&&!/Préparer sans dévoiler/.test(t),'consigner : ni session ni case « préparer »');
      await page.click('[data-act="sxKind"][data-k="h"]');await page.fill('#sxt','Indice préparé par le MJ');await page.click('[data-act="sxOk"]');await page.waitForTimeout(300);
      const sh=db.get('meta/secrets').list.find(x=>x.n===sn).slots.h.find(x=>x&&x.txt==='Indice préparé par le MJ');ok(sh&&sh.hid===true,'élément consigné masqué');
      ok(!errs.length,'aucune erreur dans la console'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();
      /* joueur : propose un titre puis un indice */
      const P=await open(browser,base,db,'peter');await P.page.evaluate(n=>{S.view='univers';S.uni='secrets';S.sec=n;render();},sn);
      ok(!(await P.page.$('[data-act="secAdd"]')),'joueur : pas de bouton « Consigner »');
      await P.page.click('[data-act="propNew"]');await P.page.fill('#sxt','Le Dit des stèles');await P.page.click('[data-act="propSend"]');await P.page.waitForTimeout(300);
      await P.page.click('[data-act="propNew"]');await P.page.click('[data-act="propK"][data-v="h"]');await P.page.fill('#sxt','Les stèles sont gravées');await P.page.click('[data-act="propSend"]');await P.page.waitForTimeout(300);
      const props=db.get('meta/secrets').props;ok(props.length===2&&props.every(x=>x.st==='att'&&x.by==='peter'),'deux propositions en attente');
      ok(/Ta proposition est en attente/.test(await P.page.textContent('#app')),'encart « Ta proposition est en attente »');
      ok(db.notifs.filter(x=>x.kind==='secProp').length===2,'notification au MJ envoyée');
      ok(!P.errs.length,'aucune erreur (joueur)'+(P.errs.length?' : '+P.errs.join(' | '):''));await P.ctx.close();
      /* MJ : pastilles, rejet du titre, confirmation de l'indice */
      const M=await open(browser,base,db,'christophe-zzvy');
      ok((await M.page.textContent('#bnav'))&&await M.page.evaluate(()=>propBadge())===2,'pastille sur Univers : 2');
      await M.page.evaluate(n=>{S.view='univers';S.uni='secrets';S.sec=n;render();},sn);
      const ids=await M.page.$$eval('[data-act="propRej"]',l=>l.map(b=>b.dataset.id));ok(ids.length===2,'deux propositions affichées au MJ');
      const pT=props.find(x=>x.k==='titre'),pH=props.find(x=>x.k==='h');
      await M.page.click(`[data-act="propRej"][data-id="${pT.id}"]`);await M.page.waitForTimeout(300);
      ok(db.get('meta/secrets').props.find(x=>x.id===pT.id).st==='rej','titre rejeté');ok(db.notifs.some(x=>x.kind==='secRej'&&x.propId===pT.id),'notification de rejet');
      await M.page.click(`[data-act="propOk"][data-id="${pH.id}"]`);t=await M.page.textContent('#sheetRoot');
      ok(/Rattaché à/.test(t)&&/changer/.test(t),'révélation : dernière session proposée avec « changer »');ok(/La table gagne 1 XP de groupe/.test(t),'XP annoncée avant confirmation');
      await M.page.click('[data-act="rvPick"]');await M.page.click('[data-act="rvOk"]');await M.page.waitForTimeout(400);
      const D=db.get('meta/secrets'),sx=D.list.find(x=>x.n===sn),pr=D.props.find(x=>x.id===pH.id);
      ok(pr.st==='ok'&&sx.slots.h[pr.i]&&!sx.slots.h[pr.i].hid,'indice dévoilé, proposition confirmée');
      const ev=db.get('gains/all').events.find(e=>e.secret&&e.secret.n===sn&&e.secret.k==='h'&&e.secret.i===pr.i);ok(ev&&ev.sessionId,'ligne d\'XP rattachée à une session');
      ok(db.notifs.some(x=>x.kind==='secRev'&&x.propId===pH.id&&x.xp===1),'notification de révélation');
      const tour=await M.page.evaluate(()=>{const bad=[];for(const asP of [false,true]){S.asPlayer=asP;for(const s of S.secrets){try{S.view='univers';S.uni='secrets';S.sec=s.n;render();}catch(e){bad.push(s.n+' '+e.message);}}}S.asPlayer=false;return bad;});
      ok(!tour.length,'tous les secrets s\'affichent'+(tour.length?' : '+tour.join(' | '):''));
      ok(!M.errs.length,'aucune erreur (MJ)'+(M.errs.length?' : '+M.errs.join(' | '):''));await M.ctx.close();}
    console.log('6. Données trop anciennes : la mise à jour s\'arrête sans rien enregistrer');
    {const old=JSON.parse(JSON.stringify(docs));delete old['meta/races'].byId.humain.kk;const db2=fakeDb(old);const {page,errs,ctx}=await open(browser,base,db2,'lorenzo');
      await page.click('[data-act="migRun"]');await page.waitForFunction(()=>S.migErr||S.migDone,null,{timeout:15000});const t=await page.textContent('#app');
      ok(/s'est arrêtée sans rien enregistrer/.test(t)&&/17\/11/.test(t),'message d\'erreur clair avec l\'élément en cause');ok(db2.writes.length===0,'aucune écriture');
      ok(!!(await page.$('[data-act="migRun"]')),'bouton « Relancer la mise à jour » proposé');await ctx.close();}
  }finally{await browser.close();srv.close();}
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert.');process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(1);});
