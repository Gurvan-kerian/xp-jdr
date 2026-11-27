/* Lot 7 — Fief géré (27/11/2026).
   Usage : node tests/fief.test.js [docs.json] — sans argument, données inventées ; avec un export : affichage du fief réel (onglet Gestion, Règles).
   Onglet Gestion (XP du fief, blocs), achat avec contributions des PJ, annulation, saisie libre (mode édition), ressources,
   nature d'XP « Fief » dans une session, transfert depuis la fiche du PJ, Règles › Gestion de fief et réglages. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-27T09:00:00.000Z';
function demoDocs(){const ch=(id,court,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},"PJ")`),...o});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:['kerian']},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'players/bob':{id:'bob',nom:'Bob',role:'Joueur',persos:['theo']},
    'chars/kerian':ch('kerian','Kerian',{situ:{fiefs:[{id:'sf1',nom:'Ville d\'Avray',f:'vda'}]},achats:[{id:'ak1',key:'autre:Domaine',label:'Dépense · Domaine',cout:2,date:'2026-11-14'}]}),
    'chars/sloan':ch('sloan','Sloan',{situ:{fiefs:[{id:'sf2',nom:'Ville d\'Avray',f:'vda'}]},achats:[{id:'as1',key:'autre:Domaine',label:'Dépense · Domaine',cout:2,date:'2026-11-14'}]}),
    'chars/theo':ch('theo','Théodule',{}),
    'fiches/vda':{id:'vda',genre:'lieu',nom:'Ville D\'Avray et Sèvres',type:'Fief',parent:'',kanka:'',vis:'rev',eye:{desc:true,sait:true,fief:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,
      fief:{feerie:'Zone périphérique.'},gest:{car:{sou:3,org:3,inf:4,fee:3},pop:4,taille:'Petite ville',eco:'Équilibre',traits:['Naturel','Bourgeois'],
        res:[{id:'r1',nom:'Réseau de domestiques',av:'Savoir quelque chose.',fx:'une relance'}],hist:[{id:'h0',date:'2026-11-14',t:'ant',lab:'Dépenses antérieures (détail à venir)',cout:4}]}},
    'gains/all':{events:[{id:'s1',session:true,date:'2026-11-20',titre:'S01. Ouverture',type:'Scénario',pj:['kerian','sloan','theo'],entries:['kerian','sloan','theo'].map(p=>({perso:p,nature:'Scénario',montant:40}))}]}};}
const docsPath=process.argv[2];const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();
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
    if(docsPath){const fid=Object.keys(DOCS).find(k=>k.startsWith('fiches/')&&DOCS[k].genre==='lieu'&&/^fief$/i.test(DOCS[k].type||'')).slice(7);
      console.log('Données réelles : fief '+fid);const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      const t=await page.evaluate(fid=>{S.fiTab='gest';navGo({t:'fiche',id:fid});S._force=true;render();return {app:document.getElementById('app').innerText,tabs:!!document.querySelector('.fi6tabs'),x:fgXp(fid)};},fid);
      console.log('  onglets Gestion : '+t.tabs+' · XP '+JSON.stringify({recu:t.x.recu,dep:t.x.depense,solde:t.x.solde}));
      const r=await page.evaluate(()=>{S.view='rules';S.rgTab='';S._force=true;render();return document.getElementById('app').innerText;});ok(/Gestion de fief/i.test(r),'Règles › Gestion de fief');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}else{

    console.log('1. Onglet Gestion');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');let t=await gest(page,'vda');
      ok(/0\s*XP du fief/i.test(t)&&/4\s*reçus/.test(t)&&/4\s*dépensés/.test(t),'bandeau : solde 0, 4 reçus, 4 dépensés');
      const T=t.toUpperCase();let at=0;const ord=['\nTRAITS\n','\nCARACTÉRISTIQUES\n','\nPOPULATION ET TERRITOIRE\n','\nRESSOURCES\n','\nHISTORIQUE DU FIEF\n'].map(x=>{const i=T.indexOf(x,at);at=i<0?at:i;return i;});ok(ord.every((x,i)=>x>=0&&(!i||x>ord[i-1])),'blocs dans l\'ordre Traits, Caractéristiques, Population, Ressources, Historique');
      ok(/Naturel/.test(t)&&/Bourgeois/.test(t),'traits');ok(/Influence/.test(t)&&/Féerie/.test(t)&&!/Diplomatie/.test(t),'noms de la feuille de fief');
      ok(/15 à 25 fées conscientes · modificateur 0/.test(t)&&/Petite ville/.test(t),'population et taille');
      ok(/Transfert · Kerian/.test(t)&&/Transfert · Sloan/.test(t)&&/Dépenses antérieures/.test(t),'historique : transferts et dépenses antérieures');
      ok(await page.$('[data-act="fgBuy"][data-k="car:inf"] small')!==null&&/20/.test(await page.$eval('[data-act="fgBuy"][data-k="car:inf"]',e=>e.innerText)),'Influence 4 → 5 : 20 XP');

      console.log('2. Achat avec contributions');
      await page.click('[data-act="fgBuy"][data-k="car:inf"]');await wait(page);let s=await sheet(page);
      ok(/Monter Influence/.test(s)&&/Kerian/.test(s)&&/Sloan/.test(s)&&!/Théodule/.test(s),'fenêtre : contributions des seuls PJ liés au fief (gestion)');
      ok(await page.$eval('#sheetRoot [data-act="fgBuyOk"]',b=>b.disabled),'validation bloquée tant qu\'il manque des XP');
      await fill(page,'#fgc-kerian',10);await fill(page,'#fgc-sloan',10);await wait(page,100);
      ok(!(await page.$eval('#sheetRoot [data-act="fgBuyOk"]',b=>b.disabled))&&/= 20 \/ 20 XP ✓/.test(await sheet(page)),'total 0 + 20 = 20');
      await page.click('#sheetRoot [data-act="fgBuyOk"]');await wait(page,400);
      let f=db.get('fiches/vda'),k=db.get('chars/kerian');
      ok(f.gest.car.inf===5&&f.gest.hist.length===2&&f.gest.hist[1].cout===20,'fief : Influence 5, achat de 20 XP');
      ok(k.achats.some(a=>a.grp===f.gest.hist[1].id&&a.cout===10&&a.fief==='vda'),'contribution inscrite chez Kerian');
      t=await gest(page,'vda');ok(/0\s*XP du fief/i.test(t)&&/24\s*reçus/.test(t)&&/24\s*dépensés/.test(t),'XP du fief : 24 reçus, 24 dépensés');

      console.log('3. Annulation');
      await page.click('[data-act="fgUndo"]');await wait(page);await page.click('#sheetRoot [data-act="fgUndoOk"]');await wait(page,400);
      f=db.get('fiches/vda');k=db.get('chars/kerian');ok(f.gest.car.inf===4&&f.gest.hist.length===1&&!k.achats.some(a=>a.grp),'retour à Influence 4, contributions rendues');

      console.log('4. Ressource achetée');
      await gest(page,'vda');await page.click('[data-act="fgBuy"][data-k="res"]');await wait(page);
      await fill(page,'#fgRn','Salons bourgeois');await fill(page,'#fgRf','+2 interactions bourgeoises');ok(await page.$('#fgc-theo')===null,'PJ non lié : pas de contribution');await fill(page,'#fgc-kerian',16);await wait(page,100);
      await page.click('#sheetRoot [data-act="fgBuyOk"]');await wait(page,400);f=db.get('fiches/vda');
      ok(f.gest.res.length===2&&f.gest.res[1].nom==='Salons bourgeois'&&db.get('chars/kerian').achats.some(a=>a.cout===16&&a.grp),'ressource créée, payée par Kerian');

      console.log('5. Mode édition');
      await page.evaluate(()=>{S.edit=true;});t=await gest(page,'vda');ok(/Modifier la gestion/.test(t)&&/Ajouter une ressource \(sans XP\)/.test(t),'boutons du mode édition');
      await page.click('[data-act="fgEd"]');await wait(page);await fill(page,'#fge-sou',11);await wait(page,100);ok(/de 0 à 10/.test(await sheet(page)),'score > 10 refusé');
      await fill(page,'#fge-sou',5);await fill(page,'#fge-tr1','Mondain');await page.selectOption('#fge-e','Prospère');await page.dispatchEvent('#fge-e','input');await page.click('#sheetRoot [data-act="fgEdOk"]');await wait(page,400);
      f=db.get('fiches/vda');ok(f.gest.car.sou===5&&f.gest.traits[1]==='Mondain'&&f.gest.eco==='Prospère','saisie libre enregistrée');
      await page.click('[data-act="fgRes"][data-rid="r1"]');await wait(page);await page.click('#sheetRoot [data-act="fgResDel"]');await wait(page);await page.click('#sheetRoot [data-act="fgResDel"]');await wait(page,400);
      ok(!db.get('fiches/vda').gest.res.some(r=>r.id==='r1'),'ressource supprimée (sans XP)');

      console.log('6. Règles › Gestion de fief');
      t=await page.evaluate(()=>{S.view='rules';S.rgTab='';S._force=true;render();return document.getElementById('app').innerText;});
      ok(/Gestion de fief/i.test(t)&&/nouveau score × 4 XP/.test(t)&&/Effort du fief/.test(t)&&/Réglages des fiefs/i.test(t),'règles et réglages (mode édition)');
      await fill(page,'#fgp-cc',5);await page.click('[data-act="fgPSave"]');await wait(page,400);ok(db.get('meta/fiefs')&&db.get('meta/fiefs').cc===5,'réglage enregistré (meta/fiefs)');
      t=await gest(page,'vda');ok(/\+\s*25/.test(await page.$eval('[data-act="fgBuy"][data-k="car:inf"]',e=>e.innerText.replace(/\s+/g,' '))),'coût recalculé : 5 × 5 = 25');

      console.log('7. Nature « Fief » dans une session');
      await page.evaluate(()=>{S.edit=false;S.view='gains';S.curSess='s1';S._force=true;render();});await wait(page);
      ok(await page.$eval('#gn0',s=>[...s.options].some(o=>o.value==='Fief')),'nature « Fief » proposée');
      await page.selectOption('#gn0','Fief');await page.dispatchEvent('#gn0','input');await page.dispatchEvent('#gn0','change');await wait(page);
      t=await txt(page);ok(/XP au fief/i.test(t)&&/Créditée directement à Ville D'Avray/.test(t)&&!(await page.$('#gf0')),'un seul fief : choisi d\'office, pas de liste');
      await fill(page,'#gm0',3);await page.click('[data-act="sessAdd"]');await wait(page,400);
      const ev=db.get('gains/all').events.find(e=>e.id==='s1');ok(ev.entries.some(e=>e.perso==='fief:vda'&&e.nature==='Fief'&&e.montant===3),'entrée de session versée au fief');
      t=await txt(page);ok(/Fief\s*\+3/.test(t),'journal de la session : ligne Fief');
      const gk=await page.evaluate(()=>summary(S.chars.kerian,S.events).gains);ok(gk===40,'gains des PJ inchangés');
      t=await gest(page,'vda');ok(/Session · S01/.test(t),'historique du fief : session');

      console.log('8. Transfert depuis la fiche du PJ');
      await page.evaluate(()=>{navGo({t:'perso',id:'kerian'});S.shTab='prog';S._force=true;render();});await wait(page);
      await page.click('[data-act="autrePlus"][data-nom="Domaine"]');await wait(page);s=await sheet(page);ok(/transférés à Ville D'Avray/.test(s),'fenêtre : fief nommé');
      await fill(page,'#dp',2);await page.click('#sheetRoot [data-act="dlgOk"]');await wait(page,400);
      ok(db.get('chars/kerian').achats.filter(a=>a.key==='autre:Domaine').pop().fief==='vda','transfert rattaché au fief');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}

    console.log('9. Droits');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');let t=await gest(page,'vda');
      ok(!!(await page.$('[data-act="fgBuy"]:not([disabled])'))&&!(await page.$('[data-act="fgEd"]')),'joueuse d\'un détenteur : achat, pas d\'édition');
      await page.click('[data-act="fgBuy"][data-k="car:org"]');await wait(page);const s=await sheet(page);ok(/Sloan/.test(s)&&!/Kerian/.test(s.split('Contributions')[1]||''),'contributions : ses PJ seulement');
      await ctx.close();
      const B=await open(browser,base,db,'bob');await gest(B.page,'vda');ok(!(await B.page.$('[data-act="fgBuy"]:not([disabled])')),'joueur sans PJ détenteur : lecture seule');await B.ctx.close();}
  }}catch(e){fails++;console.log('  ✗ exception : '+(e&&e.stack||e));}
  await browser.close();srv.close();console.log(fails?`\n${fails} échec(s)`:'\nTout est vert.');process.exit(fails?1:0);})();
