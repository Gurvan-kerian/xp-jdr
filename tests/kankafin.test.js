/* Import Kanka (fin) (26/11/2026).
   Usage : node tests/kankafin.test.js [docs.json] [import-chronologie.json] [import-regles.json] [import-pnj-pouvoirs.json] — sans argument, données inventées.
   Règles en 2 sous-onglets (ligne Arts obscurs, notes en images, visionneuse précédente / suivante, édition par la gestion),
   Chronologies (frise, couleurs, séances de la Chronique, droits, fenêtres), bloc « Pouvoirs et capacités » des PNJ, import des 3 genres. */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-26T20:00:00.000Z';
const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',kanka:'',vis:'rev',eye:{desc:true,sait:true,pre:true,niv:true,sorts:true,prat:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
const GIF='data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  const ev=(id,num,nom,type,d)=>fi(id,'evenement',nom,{num,type,debut:d,duree:1,pj:[],lieux:''});
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'chars/sloan':ch('sloan','Sloan','PJ',{race:'Elfe'}),
    'chars/fab':ch('fab','Fabrice Cauteleux','PNJ',{vis:'rev',eye:{role:true,pw:true},por:{role:'Membre des Utopiens.'},pnpw:{pw:['pw-ref','pw-chu'],cap:['cap-pat']}}),
    'chars/cor':ch('cor','Cormac','PNJ',{vis:'rev',eye:{role:true},por:{role:'Petit frère.'},pnpw:{pw:['pw-coup']}}),
    'meta/pouvoirs':{byId:{'pw-ref':{nom:'Réflexe surhumain',desc:''},'pw-chu':{nom:'Chute indolore',desc:''},'pw-coup':{nom:"Coup d'œil",desc:''},'pw-cha':{nom:'Charme',desc:''}}},
    'meta/capacites':{byId:{'cap-pat':{nom:'Pattes de velours',desc:''},'cap-ail':{nom:'Ailes',desc:''}}},
    'fiches/mon':fi('mon','org','Monarchie'),
    'fiches/chr':fi('chr','chrono','Une histoire des fées',{desc:'La chronologie de la Féerie.',
      eres:[{id:'r4',nom:'Une si Belle Époque',deb:1895,fin:'',col:'vert',seances:true},{id:'r1',nom:'Les temps mythiques',deb:-7000,fin:660,col:'violet',seances:false},{id:'r3',nom:'Les temps modernes',deb:1725,fin:1895,col:'brique',seances:false}],
      els:[{id:'e2',era:'r1',nom:'Seconde Alliance',date:'',an:'',pos:2,txt:'Le règne arthurien.',rev:true},{id:'e1',era:'r1',nom:'Première Alliance',date:'',an:'',pos:1,txt:"Âge d'or.",rev:true},
        {id:'e5',era:'r3',nom:'Mort d’Aldébard IX',date:'1890',an:1890,txt:'Judicaëlle devient régente.',rev:true},{id:'e4',era:'r3',nom:'Révolution de Coton',date:'1795 - 1813',an:1795,txt:'Elle s’oppose à la @[fiche:mon|Monarchie].',rev:true},
        {id:'e6',era:'r3',nom:'Secret du MJ',date:'1800',an:1800,txt:'caché',rev:false},{id:'e7',era:'r4',nom:'Couronnement de Swen VI',date:'1895',an:1895,txt:'Swen est déclarée Reine.',rev:true}]}),
    'fiches/ev1':ev('ev1','01','À la vie, à la mort','Scénario',{a:1899,m:10,j:28}),
    'fiches/ev2':ev('ev2','[001]','La ronce','Interscénario',{a:1899,m:11,j:3}),
    'fiches/ev3':ev('ev3','(001)','Une visite','Vie du fief',{a:1900,m:2,j:11}),
    'fiches/ev4':ev('ev4','00','Avant','Scénario',{a:1880,m:1,j:1}),
    'fiches/rg1':{id:'rg1',genre:'regle',nom:'Manœuvres de combat',ord:2,imgs:['2','1'],kanka:'',vis:'rev'},
    'fiches/rg2':{id:'rg2',genre:'regle',nom:'La Fortune',ord:1,imgs:['1'],kanka:'',vis:'rev'},
    'portraits/ill-rg-rg1-1':{img:GIF,t:1},'portraits/ill-rg-rg1-2':{img:GIF,t:1},'portraits/ill-rg-rg2-1':{img:GIF,t:1},
    'gains/all':{events:[]}};}
const docsPath=process.argv[2],IMP=process.argv.slice(3);const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();
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
const rules=(page,tab,note)=>page.evaluate(([t,n])=>{S.view='rules';S.rgTab=t;S.rgNote=n||null;S.dlg=null;S._force=true;render();return document.getElementById('app').innerText;},[tab,note]);
const uni=(page,u,f)=>page.evaluate(([u,f])=>{S.view='univers';S.uni=u;S.fi=f||null;S.dlg=null;S._force=true;render();return document.getElementById('app').innerText;},[u,f]);
const pnj=(page,id)=>page.evaluate(id=>{S.view='sheet';S.sel=id;S.shTab='por';S.dlg=null;S._force=true;render();return document.getElementById('app').innerText;},id);
const vw=page=>page.evaluate(()=>{const v=document.getElementById('fiVw');return v?v.innerText+'|'+[...v.querySelectorAll('[data-vw="prev"],[data-vw="next"]')].map(b=>b.disabled?'0':'1').join(''):'';});
const SHOTS=process.env.SHOTS;
(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));
  try{
    if(!docsPath){
      console.log('1. Joueur : onglet Règles');
      {const {page,errs,ctx}=await open(browser,base,db,'anne');
        let t=await rules(page,'');ok(/Règles en images/.test(t)&&/Féerie/.test(t),'2 sous-onglets ; Règles par défaut');
        ok(/Rang PJ : éligibilité[\s\S]*Arts obscurs[\s\S]*compétences débloquées par le MJ sur prérequis de compétences/.test(t),'ligne Arts obscurs après « Rang PJ : éligibilité »');
        await click(page,'[data-act="rgTab"][data-v="img"]');await wait(page);t=await txt(page);
        ok(/La Fortune[\s\S]*1 image[\s\S]*Manœuvres de combat[\s\S]*2 images/.test(t),'Règles en images : notes dans l\'ordre, nombre d\'images');
        ok(!/\+ Une note/.test(t),'joueur : pas de création');
        await click(page,'[data-act="rgOpen"][data-id="rg1"]');await wait(page);t=await txt(page);ok(/Manœuvres de combat/.test(t)&&/2 images/.test(t)&&!/Ajouter une image/.test(t),'page de la note (lecture)');
        ok(await page.evaluate(()=>document.querySelectorAll('.rggrid .rgimg').length)===2,'2 vignettes');
        await click(page,'.rgimg[data-i="0"]');await wait(page);let v=await vw(page);ok(/1 \/ 2/.test(v)&&/\|01$/.test(v),'visionneuse : image 1, suivante active');
        await click(page,'#fiVw [data-vw="next"]');await wait(page);v=await vw(page);ok(/2 \/ 2/.test(v)&&/\|10$/.test(v),'image suivante, précédente active');
        await page.keyboard.press('ArrowLeft');await wait(page);v=await vw(page);ok(/1 \/ 2/.test(v),'flèche gauche : image précédente');
        await page.keyboard.press('Escape');await wait(page);ok(!(await vw(page)),'fermeture');
        await click(page,'[data-act="rgBack"]');await wait(page);ok(/La Fortune/.test(await txt(page)),'retour à la liste');
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'regles-images.png'),fullPage:true});
        console.log('2. Joueur : chronologie et PNJ');
        t=await uni(page,'home');ok(/Histoire/.test(t),'Univers : entrée Histoire (UX2)');
        t=await uni(page,'chrono');ok(/Une histoire des fées/.test(t),'liste des chronologies');
        t=await uni(page,'chrono','chr');
        ok(/temps mythiques[\s\S]*temps modernes[\s\S]*Belle Époque/i.test(t),'ères triées par début');
        ok(/Première Alliance[\s\S]*Seconde Alliance/.test(t),'éléments sans année : ordre de position');
        ok(/1795 - 1813[\s\S]*Révolution de Coton[\s\S]*1890[\s\S]*Mort/.test(t),'éléments triés par année, date affichée');
        ok(!/Secret du MJ/.test(t),'élément préparé invisible');
        ok(!/Ce que l'on sait/i.test(t),'pas de « Ce que l\'on sait »');
        ok(!/Judicaëlle devient régente/.test(t),'textes repliés par défaut');
        await click(page,'[data-act="ctAll"][data-v="1"]');await wait(page);t=await txt(page);ok(/Judicaëlle devient régente/.test(t)&&/Monarchie/.test(t),'Tout déplier');
        ok(await page.evaluate(()=>!!document.querySelector('.ctel .lk[data-id="mon"]')),'lien « @ » vers la Monarchie');
        await page.evaluate(()=>document.querySelectorAll('details.ctsd').forEach(d=>d.open=true));t=await txt(page);ok(/01[\s\S]*À la vie, à la mort/.test(t)&&!/La ronce/.test(t)&&!/Une visite/.test(t)&&!/Avant/.test(t),'séances de la Chronique : Scénarios seuls de l\'ère, repliées (UX2)');
        ok(await page.evaluate(()=>getComputedStyle(document.querySelector('.ctera.ctc-violet .ctdot')).backgroundColor)==='rgb(107, 79, 134)','couleur de l\'ère sur les points');
        ok(/\+ Un élément/.test(t)&&!/\+ Une ère/.test(t),'joueur : élément oui (fiche révélée), ère non');
        await click(page,'[data-act="ctTog"][data-i="e7"]');await wait(page);ok(!/Swen est déclarée Reine/.test(await txt(page)),'toucher un titre replie son texte');
        await page.evaluate(()=>{S.view='srch';S.srch={q:'arthurien',g:'all'};S._force=true;render();});ok(/Une histoire des fées/.test(await res(page)),'recherche : texte d\'un élément');
        t=await pnj(page,'fab');ok(/Pouvoirs et capacités[\s\S]*Réflexe surhumain[\s\S]*Chute indolore[\s\S]*Pattes de velours/i.test(t),'PNJ : bloc Pouvoirs et capacités');
        ok(await page.evaluate(()=>!!document.querySelector('.lk[data-t="pw"][data-id="pw-ref"]')&&!!document.querySelector('.lk[data-t="cap"][data-id="cap-pat"]')),'liens vers les fiches de pouvoir et de capacité');
        ok(await page.evaluate(()=>!![...document.querySelectorAll('.rblk')].find(s=>/Pouvoirs et capacités/i.test(s.innerText)).querySelector('.ibtn,[data-act="pnPw"]')),'joueur : modification (règle des fiches, PNJ révélé)');
        t=await pnj(page,'cor');ok(!/Coup d'œil/.test(t),'œil fermé : bloc caché au joueur');
        ok(errs.length===0,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
      console.log('3. Gestion : édition');
      {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
        await page.evaluate(()=>{S.edit=true;});
        let t=await rules(page,'img');ok(/\+ Une note/.test(t),'gestion : + Une note');
        await click(page,'[data-act="rgNoteEd"][data-id=""]');await wait(page);await page.fill('#rgNm','Tableaux de PP');await click(page,'[data-act="rgNoteSave"]');await wait(page,300);
        const nid=await page.evaluate(()=>S.rgNote);ok(!!nid&&db.get('fiches/'+nid).genre==='regle'&&db.get('fiches/'+nid).nom==='Tableaux de PP','note créée et ouverte');
        ok(/Ajouter une image/.test(await txt(page)),'bouton Ajouter une image');
        t=await rules(page,'img','rg1');ok(/Renommer, supprimer/.test(t),'note : renommer, supprimer');
        await click(page,'[data-act="rgMv"][data-k="ill-rg-rg1-2"][data-v="1"]');await wait(page,300);ok(db.get('fiches/rg1').imgs.join()==='1,2','ordre des images modifié');
        await click(page,'[data-act="rgDel"][data-k="ill-rg-rg1-2"]');await wait(page);await click(page,'[data-act="rgDelOk"][data-k="ill-rg-rg1-2"]');await wait(page,300);
        ok(db.get('fiches/rg1').imgs.join()==='1'&&!db.get('portraits/ill-rg-rg1-2'),'image retirée (vignette supprimée)');
        await rules(page,'img','rg2');await click(page,'[data-act="rgNoteEd"][data-id="rg2"]');await wait(page);await click(page,'[data-act="rgNoteDel"]');await wait(page);await click(page,'[data-act="rgNoteDelOk"]');await wait(page,300);
        ok(!db.get('fiches/rg2')&&!db.get('portraits/ill-rg-rg2-1'),'note supprimée avec ses images');
        t=await uni(page,'chrono','chr');ok(/\+ Une ère/.test(t)&&/Secret du MJ/.test(t),'gestion : + Une ère, élément préparé visible');
        await click(page,'[data-act="ctEra"][data-i=""]');await wait(page);let sh=await sheet(page);ok(/Nouvelle ère/i.test(sh)&&/Couleur/i.test(sh),'fenêtre de l\'ère');
        ok(await page.evaluate(()=>document.getElementById('ctEd').value)==='','début proposé : fin de la dernière ère (vide ici)');
        await page.fill('#ctEn','Aube de la Monarchie');await page.fill('#ctEd','660');await page.fill('#ctEf','1725');await click(page,'[data-act="ctCol"][data-v="laiton"]');await wait(page);await click(page,'[data-act="ctEraSave"]');await wait(page,300);
        let F=db.get('fiches/chr');const ne=F.eres.find(e=>e.nom==='Aube de la Monarchie');ok(ne&&ne.deb===660&&ne.fin===1725&&ne.col==='laiton'&&!ne.seances,'ère ajoutée');
        t=await txt(page);ok(/temps mythiques[\s\S]*Aube de la Monarchie[\s\S]*temps modernes/i.test(t),'nouvelle ère à sa place');
        await click(page,`[data-act="ctEl"][data-e="${ne.id}"]`);await wait(page);await page.fill('#ctNm','Le trône vénitien');await page.fill('#ctDt','1681');await page.fill('#ctAn','1681');
        await page.evaluate(()=>{const e=document.getElementById('fiEd');e.focus();document.execCommand('insertText',false,'Swen Ire installe le siège à Venise.');});await click(page,'[data-act="ctElSave"]');await wait(page,300);
        F=db.get('fiches/chr');const nel=F.els.find(x=>x.nom==='Le trône vénitien');ok(nel&&nel.era===ne.id&&nel.an===1681&&nel.date==='1681'&&/Venise/.test(nel.txt)&&nel.rev===false,'élément ajouté (préparé par la gestion)');
        await click(page,`[data-act="ctEye"][data-i="${nel.id}"]`);await wait(page,300);ok(db.get('fiches/chr').els.find(x=>x.id===nel.id).rev===true,'œil : élément révélé');
        await click(page,`[data-act="ctEra"][data-i="${ne.id}"]`);await wait(page);ok(/quand l'ère est vide/.test(await sheet(page)),'ère non vide : suppression impossible');
        await page.evaluate(()=>{S.dlg=null;});await click(page,'[data-act="ctEl"][data-i="e6"]');await wait(page);await click(page,'[data-act="ctElDel"]');await wait(page);await click(page,'[data-act="ctElDelOk"]');await wait(page,300);
        ok(!db.get('fiches/chr').els.some(x=>x.id==='e6'),'élément retiré');
        await click(page,'[data-act="ctEra"][data-i="r4"]');await wait(page);ok(await page.evaluate(()=>document.querySelector('#sheetRoot input[data-fin="seances"]').checked),'interrupteur séances coché');
        if(SHOTS){await page.evaluate(()=>{S.dlg=null;render();});await page.screenshot({path:path.join(SHOTS,'chronologie.png'),fullPage:true});}
        await page.evaluate(()=>{S.dlg=null;});t=await pnj(page,'cor');ok(/Pouvoirs et capacités/i.test(t)&&/Coup d'œil/.test(t),'gestion : bloc visible (œil fermé)');
        await click(page,'[data-act="pnPw"]');await wait(page);sh=await sheet(page);ok(/Coup d'œil/.test(sh)&&/Ajouter/i.test(sh),'fenêtre Pouvoirs et capacités');
        await page.selectOption('#pnPwA','cap:cap-ail');await wait(page);await click(page,'[data-act="pnPwX"][data-t="pw"][data-id="pw-coup"]');await wait(page);await click(page,'[data-act="pnPwSave"]');await wait(page,300);
        ok(JSON.stringify(db.get('chars/cor').pnpw)===JSON.stringify({pw:[],cap:['cap-ail']}),'pouvoir retiré, capacité ajoutée');
        console.log('4. Import (données inventées)');
        const Fc={format:'xp-import',v:1,genre:'chrono',date:'2026-11-26',items:[{id:'f-kk1',kanka:'https://app.kanka.io/w/350361/entities/1',data:{nom:'Chrono importée',type:'',kanka:'https://app.kanka.io/w/350361/entities/1',desc:'Texte',eres:[{id:'ra',nom:'Ère A',deb:1,fin:'',col:'vert',seances:true}],els:[{id:'ea',era:'ra',nom:'Élément A',date:'1',an:1,pos:1,txt:'x',rev:true}]},imgs:[{k:'ill-fiche-f-kk1',th:GIF,big:GIF}]}]};
        const Fr={format:'xp-import',v:1,genre:'regle',date:'2026-11-26',items:[{id:'f-kk2',kanka:'https://app.kanka.io/w/350361/entities/2',data:{nom:'Compétences',kanka:'https://app.kanka.io/w/350361/entities/2',imgs:['1','2'],ord:1},imgs:[{k:'ill-rg-f-kk2-1',th:GIF,big:GIF},{k:'ill-rg-f-kk2-2',th:GIF,big:GIF}]}]};
        const Fp={format:'xp-import',v:1,genre:'pnj',date:'2026-11-26',items:[{id:'fab',kanka:'',data:{nom:'Fabrice Cauteleux',pnpw:{pw:['pw-cha'],cap:[]},eye:{pw:true}}}]};
        for(const F of [Fc,Fr,Fp]){await page.evaluate(F=>{S.view='params';S.ptab='donnees';S.kk={step:'apercu',F,nomF:'f',mode:'maj'};kkPlan();S._force=true;render();},F);
          await page.evaluate(()=>kkRun());await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:30000});const rep=await page.evaluate(()=>S.kk.rep);
          ok(!rep.err.length&&!rep.imgKo.length,'import '+F.genre+' : '+rep.nNew+' créé(s), '+rep.nMaj+' mis à jour, '+rep.imgOk+' image(s)');}
        ok(db.get('fiches/f-kk1').els.length===1&&db.get('fiches/f-kk1').vis==='rev'&&!!db.get('portraits/ill-fiche-f-kk1'),'chronologie importée avec son image');
        ok(db.get('fiches/f-kk2').genre==='regle'&&!!db.get('portraits/ill-rg-f-kk2-2')&&!!db.imgs['ill-rg-f-kk2-2'],'règle en images importée (vignettes et grandes images)');
        ok(JSON.stringify(db.get('chars/fab').pnpw.pw)!==undefined,'import PNJ exécuté');
        t=await rules(page,'img');ok(/Compétences/.test(t),'règle importée visible dans Règles en images');
        ok(errs.length===0,'aucune erreur'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
    } else {
      console.log('Données réelles');
      const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      await page.evaluate(()=>{S.edit=true;});
      for(const f of IMP){const F=JSON.parse(fs.readFileSync(f,'utf8'));
        await page.evaluate(F=>{S.view='params';S.ptab='donnees';S.kk={step:'apercu',F,nomF:'f',mode:'maj'};kkPlan();S._force=true;render();},F);
        const P=await page.evaluate(()=>S.kk.plan.map(x=>x.act+':'+(x.up||[]).join('+')+':'+(x.keep||[]).join('+')));console.log('    aperçu '+F.genre+' : '+P.join(' | '));
        await page.evaluate(()=>kkRun());await page.waitForFunction(()=>S.kk&&S.kk.step==='fin',null,{timeout:60000});const rep=await page.evaluate(()=>S.kk.rep);
        ok(!rep.err.length&&!rep.imgKo.length,'import '+F.genre+' : '+rep.nNew+' créé(s), '+rep.nMaj+' mis à jour, '+rep.imgOk+' image(s)');}
      let t=await uni(page,'chrono','f-kk40537');if(IMP.length){ok(/Les temps mythiques[\s\S]*L'aube de la Monarchie[\s\S]*Les temps modernes[\s\S]*Une si Belle Époque/i.test(t),'chronologie réelle : 4 ères dans l\'ordre');
        await click(page,'[data-act="ctAll"][data-v="1"]');await wait(page);t=await txt(page);ok(/Monarchie/.test(t)&&/Machines ou Merveilles/.test(t),'textes, liens et séances');
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'chronologie-reelle.png'),fullPage:true});
        t=await rules(page,'img');ok(/Compétences et Spécialités[\s\S]*Manœuvres de combat[\s\S]*Tableaux de Points de Personnage[\s\S]*La Fortune/.test(t),'4 notes en images');
        if(SHOTS)await page.screenshot({path:path.join(SHOTS,'regles-reelles.png'),fullPage:true});
        t=await pnj(page,'kk8434259');ok(/Pouvoirs et capacités[\s\S]*Chute indolore/i.test(t)&&!/Pouvoirs :/.test(t),'Fabrice Cauteleux : bloc et Rôle nettoyé');
        t=await pnj(page,'kk9132700');ok(/Coup d'œil/.test(t),'Cormac : Coup d\'œil');}
      for(const c of db.rows.filter(r=>r.coll==='chars').map(r=>r.id).slice(0,400))await page.evaluate(id=>{S.view='sheet';S.sel=id;S.shTab='por';S._force=true;render();},c);
      await page.evaluate(()=>{S.view='rules';S.rgTab='';S._force=true;render();});
      ok(errs.length===0,'aucune erreur sur les données réelles'+(errs.length?' : '+errs.join(' | '):''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);})();
