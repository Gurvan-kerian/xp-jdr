/* Lot 3 (24/11/2026) : Chronique et calendrier.
   Usage : node tests/lot3.test.js [docs.json] — données en version 2 (export Supabase converti au format coll/id → data).
   1. Calculs (sans navigateur) : dates, jours de la semaine, lune, solstices et équinoxes, âges, rapprochement des numéros.
   2. Navigateur : accueil et ordre des onglets, date du jeu, événements, vue mois, agenda, fêtes, âge, Feuilleton, rattachements. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
const docsPath=process.argv[2]||path.join(__dirname,'fixtures','donnees-v2.json');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};

console.log('1. Calculs');
{const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique']),r=c=>app.run(c);
  ok(r(`JSON.stringify([0,1,2,3].map(k=>chSeason(1900,k)))`)==='[{"a":1900,"m":3,"j":21},{"a":1900,"m":6,"j":21},{"a":1900,"m":9,"j":23},{"a":1900,"m":12,"j":22}]','solstices et équinoxes de 1900 (21 mars, 21 juin, 23 sept., 22 déc.)');
  ok(r(`chSeason(1899,0).j`)===20&&r(`chSeason(1901,1).j`)===22,'équinoxe de printemps 1899 le 20 mars, solstice d\'été 1901 le 22 juin');
  ok(r(`chDateTxt({a:1900,m:5,j:5})`)==='samedi 5 mai 1900'&&r(`chDateTxt({a:1899,m:11,j:18})`)==='samedi 18 novembre 1899','jours de la semaine (vrai calendrier)');
  ok(r(`chRangeTxt({a:1900,m:4,j:30},4)`)==='du lundi 30 avril au jeudi 3 mai 1900','période sur deux mois');
  ok(r(`chRangeTxt({a:1899,m:12,j:30},4)`)==='du samedi 30 décembre 1899 au mardi 2 janvier 1900','période sur deux années');
  ok(r(`chRangeTxt({a:1900,m:3},1)`)==='courant mars 1900','période floue');
  ok(r(`[...Array(31)].map((_,i)=>{const p=chPhase({a:1900,m:5,j:i+1});return p?(i+1)+p[0]:''}).filter(Boolean).join(' ')`)==='6pq 14pl 21dq 29nl','phases de la lune en mai 1900');
  ok(r(`chAge({a:1488,m:6,j:3},{a:1900,m:5,j:5})`)===411&&r(`chAge({a:1871,m:5,j:11},{a:1900,m:5,j:11})`)===29&&r(`chAge({a:1520},{a:1900,m:5,j:5})`)===380,'âges (avant / le jour de l\'anniversaire, année seule)');
  ok(r(`JSON.stringify([chSessNum({titre:'[Int. 024] X'}),chSessNum({titre:'S09. Y Part.2'}),chEvNum({num:'09.'}),chEvNum({num:'[024]'}),chEvNum({num:'(003)'})])`)==='[{"type":"Interscénario","n":24},{"type":"Scénario","n":9},{"type":"Scénario","n":9},{"type":"Interscénario","n":24},{"type":"Vie du fief","n":3}]','numéros des sessions et des événements');
  ok(r(`chBare('S01. A la vie à la mort — Épilogue')`)===r(`chBare('À la vie, à la mort')`),'rapprochement par titre (épilogue, accents, ponctuation)');}

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
async function open(browser,base,db,me,w){const ctx=await browser.newContext({viewport:{width:w||420,height:900}});const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|service ?worker/i.test(m.text()))errs.push(m.text());});
  await page.route('**/rest/v1/rpc/**',r=>db.handle(r));await page.route('**/functions/v1/notify',r=>r.fulfill({status:200,contentType:'application/json',body:'{"sent":0}'}));await page.route(/fonts\.(googleapis|gstatic)/,r=>r.fulfill({status:200,body:''}));
  await page.addInitScript(([me])=>{localStorage.setItem('xp.code','test');localStorage.setItem('xp.me',me);},[me]);
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady&&S.fichesReady!==undefined);await page.waitForTimeout(300);
  await page.evaluate(()=>{S.fichesReady=true;S.id&&(S.id.state='ok');});
  return {page,errs,ctx};}
const click=(page,sel)=>page.evaluate(s=>{const b=document.querySelector(s);if(!b)throw new Error('absent : '+s);b.click();},sel);
const fill=(page,fin,v)=>page.evaluate(([k,v])=>{const el=document.querySelector(`#sheetRoot [data-fin="${k}"]`);if(!el)throw new Error('champ absent : '+k);el.value=v;el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));},[fin,v]);
const txt=page=>page.evaluate(()=>document.getElementById('app').innerText);
const sheet=page=>page.evaluate(()=>(document.getElementById('sheetRoot')||{}).innerText||'');

(async()=>{
  const docs=JSON.parse(fs.readFileSync(docsPath,'utf8'));const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(docs)));
  try{
    console.log('2. Accueil et navigation (gestion, date du jeu pas encore réglée)');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo',1000);
      await page.evaluate(()=>{S.view='home';render();});
      const h=await page.evaluate(()=>[...document.querySelectorAll('.htile2 .hnm')].map(x=>x.textContent.trim()));
      ok(h.length===3&&/^Univers/.test(h[0])&&/^Personnages/.test(h[1])&&/^XP/.test(h[2]),'tuiles dans l\'ordre Univers, Personnages, XP');
      ok(!(await page.$('.hgame')),'sans date du jeu : pas de bandeau « Dans le jeu »');
      ok(!(await page.$('.hl')),'plus aucun libellé avec la classe de surbrillance (cadre doré)');
      const tabs=await page.evaluate(()=>[...document.querySelectorAll('#tabs button')].map(b=>b.textContent.trim()).slice(0,4).join(','));
      ok(/^Univers,Personnages,XP,Planning/.test(tabs),'onglets du haut : Univers, Personnages, XP, Planning ('+tabs+')');
      const bn=await page.evaluate(()=>[...document.querySelectorAll('#bnav button span')].map(b=>b.textContent.trim()).slice(0,4).join(','));
      ok(bn==='Univers,Personnages,XP,Planning','barre du bas : Univers, Personnages, XP, Planning');
      /* date du jeu, mode édition */
      await page.evaluate(()=>{S.edit=true;S.view='univers';S.uni='chron';render();});
      ok(/Date du jeu pas encore réglée/.test(await txt(page)),'Chronique : date pas réglée, bouton « Régler » en mode édition');
      await click(page,'[data-act="chNowEd"]');await fill(page,'dj','4');await fill(page,'dm','5');await fill(page,'da','1900');
      await click(page,'[data-act="chNowAdd"][data-v="1"]');ok(/Samedi 5 mai 1900/.test(await sheet(page)),'raccourci +1 jour (aperçu « Samedi 5 mai 1900 »)');
      await click(page,'[data-act="chNowSave"]');await page.waitForTimeout(150);
      const cal=db.get('meta/calendrier');ok(cal&&cal.date&&cal.date.j===5&&cal.date.m===5&&cal.fetes&&cal.fetes.length===8,'meta/calendrier enregistré (date + 8 fêtes)');
      await page.evaluate(()=>{S.edit=false;S.view='home';render();});
      const hb=await page.evaluate(()=>document.querySelector('.hgame')&&document.querySelector('.hgame').innerText);
      ok(hb&&/Samedi 5 mai 1900/.test(hb)&&/Premier quartier demain/.test(hb)&&/Litha dans 47 jours/.test(hb),'bandeau « Dans le jeu » : date, lune, prochaine fête');
      await click(page,'[data-act="chHome"]');ok(await page.evaluate(()=>S.view==='univers'&&S.uni==='chron'&&S.chV==='mois'),'clic sur le bandeau : Chronique, vue mois');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}

    console.log('3. Joueur : événement, résumé, liste, mois, Feuilleton');
    let evId;
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      await page.evaluate(()=>{S.view='univers';S.uni='home';render();});
      ok(/Récit[\s\S]*Chronique[\s\S]*Secrets/i.test(await txt(page)),'Univers : Chronique en tête du groupe Récit');
      await page.evaluate(()=>{S.uni='chron';S.chV='liste';render();});
      ok(/Nous sommes le samedi 5 mai 1900/.test(await txt(page)),'Chronique : date du jeu');
      await click(page,'[data-act="chEvNew"]');
      await fill(page,'num','[024]');await fill(page,'nom','Ce qui rêve sous la pierre');await fill(page,'dj','30');await fill(page,'dm','4');await fill(page,'da','1900');await fill(page,'duree','4');
      ok(/jusqu'au jeudi 3 mai 1900/.test(await sheet(page)),'aperçu de la fin (durée 4 jours)');
      await click(page,'[data-act="chPjT"][data-v="sloan"]');await click(page,'[data-act="chPjT"][data-v="kerian"]');
      await click(page,'[data-act="chEvSave"]');await page.waitForTimeout(150);
      evId=await page.evaluate(()=>S.fi);const ev=db.get('fiches/'+evId);
      ok(ev&&ev.genre==='evenement'&&ev.num==='[024]'&&ev.duree===4&&ev.debut.j===30&&ev.pj.join()==='sloan,kerian','événement enregistré dans fiches (genre evenement)');
      ok(/du lundi 30 avril au jeudi 3 mai 1900/.test(await txt(page)),'fiche : dates en clair');
      await click(page,'[data-act="chTxt"][data-b="desc"]');
      await page.evaluate(()=>{const ed=document.getElementById('fiEd');ed.textContent='Partis de Carnac à l\'aube.';ed.dispatchEvent(new Event('input',{bubbles:true}));});
      await click(page,'[data-act="chTxtSave"]');await page.waitForTimeout(100);
      ok(/Partis de Carnac/.test(await txt(page))&&!(await page.$('[data-act="chTxt"][data-b="notes"]')),'résumé modifié par un joueur ; pas de Notes MJ pour un joueur');
      await page.evaluate(()=>{S.fi=null;S.uni='chron';S.chV='liste';render();});
      const L=await txt(page);ok(/Mai 1900[\s\S]*aujourd'hui[\s\S]*Avril 1900[\s\S]*\[024\]/.test(L),'liste : mai (repère aujourd\'hui) puis avril avec l\'événement');
      ok(/Beltane/.test(L),'liste : fête du mois en cours');
      await click(page,'[data-act="chV"][data-v="mois"]');
      const m=await page.evaluate(()=>({bars:document.querySelectorAll('.chb.in').length,now:!!document.querySelector('.chc.now'),moon:document.querySelectorAll('.chph').length}));
      ok(m.bars>=4&&m.now&&m.moon===4,'vue mois : bande sur 4 jours, jour du jeu, 4 phases de lune');
      await click(page,'[data-act="chPj"][data-v="massetoc"]');ok(!(await page.$('.chb.in')),'filtre PJ : l\'événement disparaît pour Masse Toc');
      await page.evaluate(()=>{S.chPj=[];S.view='sheet';S.sel='sloan';S.shTab='jour';S.jrSel='f';render();});
      ok(/Ce qui rêve sous la pierre[\s\S]*avec Kerian/.test(await txt(page)),'Feuilleton de Sloan');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}

    console.log('4. Agenda, fêtes, âge');
    {const {page,errs,ctx}=await open(browser,base,db,'peter');
      await page.evaluate(()=>{S.view='univers';S.uni='chron';S.chV='liste';render();});
      await click(page,'[data-act="chAgNew"]');await fill(page,'nom','Bal de l\'Opéra');await fill(page,'dj','19');
      await click(page,'[data-act="chAgSave"]');await page.waitForTimeout(100);
      const ag=db.rows.find(r=>r.coll==='fiches'&&r.data.genre==='agenda');ok(ag&&ag.data.par==='peter'&&ag.data.debut.j===19,'agenda ajouté par un joueur');
      ok(/Bal de l'Opéra[\s\S]*Ajouté par Joe/.test(await txt(page)),'agenda dans la liste avec son auteur');
      await click(page,'[data-act="chPage"][data-v="fetes"]');const F=await txt(page);
      ok(/Litha[\s\S]*21 juin en 1900/.test(F)&&/Mabon[\s\S]*23 septembre en 1900/.test(F)&&(F.match(/en 1900/g)||[]).length===8,'8 fêtes, solstices et équinoxes calculés');
      await page.evaluate(()=>{S.view='sheet';S.sel='massetoc';S.shTab='fiche';render();});
      await click(page,'[data-act="chNa"]');await fill(page,'na','1871');await fill(page,'nm','5');await fill(page,'nj','11');
      await click(page,'[data-act="chNaSave"]');await page.waitForTimeout(100);
      ok(/28 ans · né le 11 mai 1871/.test(await txt(page)),'âge sur l\'onglet Fiche (28 ans au 5 mai 1900)');
      await page.evaluate(()=>{S.view='univers';S.uni='chron';S.chPage=null;S.chV='liste';render();});{const T=await txt(page);ok(/Anniversaire de Masse Toc[\s\S]*29 ans/.test(T),'anniversaire dans la Chronique');if(!/Anniversaire de Masse Toc/.test(T))console.log(T.slice(0,900));}
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      const ag=db.rows.find(r=>r.coll==='fiches'&&r.data.genre==='agenda');
      await page.evaluate(id=>{S.view='univers';S.uni='agenda';S.fi=id;render();},ag.id);
      ok(!(await page.$('[data-act="chAgEd"]')),'agenda d\'un autre joueur : pas de modification');
      ok(!errs.length,'aucune erreur');await ctx.close();}

    console.log('5. Rattachements (gestion, mode édition)');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      await page.evaluate(()=>{S.edit=true;S.view='univers';S.uni='chron';S.chPage='ratt';S.chRat=null;render();});
      const R=await txt(page);ok(/Rattachements proposés/.test(R)&&/\[Int\. 024\] Ce qui rêve sous la pierre/.test(R),'page des rattachements');
      const n=await page.evaluate(()=>document.querySelectorAll('[data-chrk]:checked').length);ok(n===1,'une proposition cochée ([Int. 024] ↔ [024])');
      ok(await page.$('[data-act="chEvFromS"]'),'« Créer l\'événement » pour une session numérotée sans événement');
      await click(page,'[data-act="chRatOk"]');await page.waitForTimeout(100);
      const s=db.get('gains/all').events.find(e=>/^\[Int\. 024\]/.test(e.titre));ok(s&&s.evt===evId,'session rattachée (gains/all)');
      await page.evaluate(id=>{S.uni='evenement';S.fi=id;render();},evId);ok(/Séances et XP[\s\S]*\[Int\. 024\]/i.test(await txt(page)),'fiche : bloc Séances et XP');
      await page.evaluate(()=>{S.view='gains';render();});ok(await page.$('.chsl .lk'),'journal d\'XP : lien vers l\'événement');
      {const sid=await page.evaluate(()=>{const e=S.events.find(x=>x.session&&/^S01\. /.test(x.titre)&&!x.evt);S.jOpen={[e.id]:true};render();return e.id;});
        await click(page,`[data-act="chRat"][data-id="${sid}"]`);await click(page,'[data-act="chEvFromS"][data-stay="1"]');
        const g=await page.evaluate(()=>({...S.dlg}));ok(g.kind==='chEv'&&g.num==='01.'&&g.nom==='A la vie à la mort'&&g.type==='Scénario'&&g.pj.length>0,'Rattacher › Créer : numéro, titre, type et PJ préremplis');
        await click(page,'[data-act="chEvSave"]');await page.waitForTimeout(150);
        const s1=db.get('gains/all').events.find(e=>e.id===sid),f=s1&&db.get('fiches/'+s1.evt);
        ok(f&&f.num==='01.'&&await page.evaluate(()=>S.view)==='gains','événement créé, session rattachée, on reste sur le journal d\'XP');}
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    console.log('6. Historique : retour du téléphone / page précédente');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      const st=()=>page.evaluate(()=>[S.view,S.uni||'',S.fi||'',S.sel||'',S.dlg?S.dlg.kind:''].join('|'));
      const back=async()=>{await page.evaluate(()=>history.back());await page.waitForTimeout(250);};
      await page.evaluate(()=>{S.view='home';render();});
      await click(page,'.htile2[data-v="univers"]');await click(page,'[data-act="uni"][data-v="chron"]');await click(page,'.chrow:not(.ag)[data-act="chOpen"]');
      const ev=await st();ok(/^univers\|evenement\|f-/.test(ev),'accueil → Univers → Chronique → événement');
      await click(page,'[data-act="chTxt"][data-b="desc"]');ok(/chTxt$/.test(await st()),'fenêtre ouverte');
      await back();ok(await st()===ev,'retour : la fenêtre se ferme, on reste sur l\'événement');
      await back();ok(/^univers\|chron\|\|/.test(await st()),'retour : Chronique');
      await back();ok(/^univers\|home\|/.test(await st()),'retour : Univers');
      await back();ok(/^home\|/.test(await st()),'retour : accueil');
      await page.evaluate(()=>history.forward());await page.waitForTimeout(250);ok(/^univers\|home\|/.test(await st()),'page suivante : Univers');
      await click(page,'[data-act="tab"][data-v="team"]');await page.evaluate(()=>{const b=document.querySelector('[data-act="sel"]');b&&b.click();});
      await page.evaluate(()=>{S.shTab='fiche';render();});await page.evaluate(()=>{S.shTab='rel';render();});
      await back();ok(/^team\|/.test(await st()),'les onglets d\'une fiche ne comptent pas comme une étape');
      await page.evaluate(()=>{S.view='univers';S.uni='chron';S.fi=null;S.chPage=null;render();});await page.evaluate(()=>window.scrollTo(0,0));
      await page.reload();await page.waitForFunction(()=>typeof S!=='undefined'&&S.playersReady);await page.waitForTimeout(400);await page.evaluate(()=>{S.id&&(S.id.state='ok');});
      await back();ok(/^team\|/.test(await st()),'après rechargement, retour : écran précédent');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ exception : '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);
})();
