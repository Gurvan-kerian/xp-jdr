/* Lot 4 « Finitions » (28/11/2026). Usage : node tests/ux4.test.js — données inventées.
   Alias en texte libre, commentaires personnels sur la fiche PNJ, pictos d'alerte pour qui peut traiter, ordre manuel des entrées,
   titre ↔ fief, Paramètres › Cartes (catégories) et Listes de valeurs (menu Genre). */
const fs=require('fs'),path=require('path'),http=require('http');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-27T09:00:00.000Z';
function demoDocs(){const ch=(id,court,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},"PJ")`),...o});
  const pnj=(id,nom,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(nom)},${JSON.stringify(nom)},"PNJ")`),vis:'rev',...o});
  const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',vis:'rev',eye:{desc:true,sait:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
  const ent=(id,nom,a,m,j)=>({id,nom,dj:{a,m,j},txt:'Texte '+nom,pc:'sloan',cree:now});
  const EYE={fiche:true,por:true,car:true,cap:true,av:true,dv:true,pred:true,fut:true,sp:true,at:true,typ:true,pw:[true,true,true,true,true,true,true,true]};
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:['kerian']},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'players/paul':{id:'paul',nom:'Paul',role:'Joueur',persos:[]},
    'chars/kerian':ch('kerian','Kerian',{situ:{titres:[{id:'st1',nom:"Comte de Ville d'Avray"}],fiefs:[{id:'sf1',nom:"Ville d'Avray",f:'vda',titre:'st1'}]}}),
    'chars/sloan':ch('sloan','Sloan',{race:'Elfe',situ:{fiefs:[{id:'sf2',nom:"Ville d'Avray",f:'vda'}]}}),
    'chars/wag':pnj('wag','Henriette Loubet',{race:'Humain',surnom:'la marquise de Wagram',sait:[]}),
    'chars/prep':pnj('prep','Inconnu',{race:'Humain',vis:'prep'}),
    'fiches/vda':fi('vda','lieu',"Ville D'Avray et Sèvres",{type:'Fief',eye:{desc:true,sait:true,fief:true},fief:{feerie:''}}),
    'fiches/c1':fi('c1','carte','Paris',{iw:100,ih:100}),
    'fiches/r1':fi('r1','rep','Opéra',{carte:'c1',x:.5,y:.5,cat:'dem'}),
    'journaux/q1':{id:'q1',genre:'quete',type:'groupe',perso:'sloan',parts:['sloan','kerian'],nom:"La Cité d'Ys",pub:true,statut:'cours',cree:now,ent:[ent('e1','Un',1900,3,2),ent('e2','Deux',1900,3,9),ent('e3','Trois',1900,4,1)]},
    'meta/cartes':{cats:[{id:'pub',nom:'Lieu public',coul:'#3a7ca5'},{id:'dem',nom:'Demeure',coul:'#8a5a44'},{id:'vide',nom:'Vide',coul:'#123456'}],moy:[{id:'p',nom:'À pied',v:5}]},
    'meta/signalements':{list:[{id:'sg1',obj:{t:'race',id:'elfes'},champ:'Description',statut:'completer',note:'',date:'2026-11-20',by:'lorenzo',ok:false},{id:'sg2',obj:{t:'race',id:'cache'},champ:'Traits',statut:'completer',note:'',date:'2026-11-20',by:'lorenzo',ok:false}]},
    'gains/all':{events:[]},'meta/secrets':{list:[],props:[],lot:[]},'meta/pouvoirs':{byId:{}},
    'meta/creatures':{list:[{id:'elfes',nom:'Elfes',fam:'trad',done:true},{id:'cache',nom:'Cachés',fam:'trad',done:false}]},
    'meta/races':{byId:{elfes:{sing:'Elfe',plur:'Elfes',car:{},cap:[],traits:[],eye:EYE},cache:{sing:'Caché',plur:'Cachés',car:{},cap:[],traits:[],eye:{fiche:false}}}}};}
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
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady,null,{timeout:60000});await page.waitForTimeout(600);
  await page.evaluate(()=>{S.fichesReady=true;S.id&&(S.id.state='ok');S.view='home';render();});
  return {page,errs,ctx};}
const E=(page,js,arg)=>page.evaluate(js,arg);
const go=(page,js)=>page.evaluate(js=>{eval(js);S._force=true;render();return document.getElementById('app').innerText;},js);

(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));
  try{
    console.log('1. PNJ : alias en texte libre, commentaires personnels (joueur)');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      await go(page,"navGo({t:'perso',id:'wag'})");
      await page.click('[data-act=pcOpen]');await page.waitForTimeout(200);
      ok(await E(page,()=>!!document.querySelector('[data-cf=aka]')),'fenêtre Identité : champ « Aussi connu sous »');
      await page.fill('[data-cf=aka]',' la marquise de Wagram ,  Véritas ,');await page.dispatchEvent('[data-cf=aka]','change');await page.waitForTimeout(300);
      ok(db.get('chars/wag').aka==='la marquise de Wagram, Véritas','alias enregistrés, nettoyés');
      let t=await go(page,"S.dlg=null;navGo({t:'perso',id:'wag'})");
      ok(/Aussi connu sous : la marquise de Wagram, Véritas/.test(t),'alias affichés sous le nom');
      ok(await E(page,()=>/Henriette/.test(JSON.stringify(srRun('veritas').N))),'recherche par alias');
      ok(/Compléter[\s\S]*Commentaire personnel/.test(t),'« + Commentaire personnel » dans Compléter');
      await page.click('.ux2cb[data-act=pnCom], [data-act=pnCom]');await page.waitForTimeout(200);
      await page.evaluate(()=>{document.getElementById('fiEd').innerHTML='Je ne lui fais pas confiance.';});await page.click('[data-act=pnTxtSave]');await page.waitForTimeout(300);
      const cm=db.get('chars/wag').com||[];ok(cm.length===1&&cm[0].par==='anne'&&cm[0].pc==='sloan','commentaire signé (Anne, Sloan)');
      t=await go(page,"navGo({t:'perso',id:'wag'})");ok(/Commentaires personnels/i.test(t)&&/Anne \(Sloan\)/.test(t),'bloc affiché, signé');
      ok(await E(page,()=>document.querySelectorAll('[data-act=pnCom][data-i]:not([data-i=""])').length===1),'crayon sur son commentaire');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
    {const {page,errs,ctx}=await open(browser,base,db,'paul');
      await go(page,"navGo({t:'perso',id:'wag'})");
      ok(await E(page,()=>document.querySelectorAll('[data-act=pnCom][data-i]:not([data-i=""])').length===0),'autre joueur : pas de crayon sur le commentaire d\'Anne');
      ok(await E(page,()=>{const c=S.chars.wag;return !pnComCan(c.com[0]);}),'autre joueur : modification refusée');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      await go(page,"navGo({t:'perso',id:'wag'})");
      ok(await E(page,()=>pnComCan(S.chars.wag.com[0])),'MJ : peut modifier tous les commentaires');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}

    console.log('2. Pictos d\'alerte (joueur, sans mode édition)');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      await go(page,"S.view='univers';S.uni='creatures';S.fi=null;S.rf=null");
      ok(await E(page,()=>{const b=document.querySelector('[data-act=rfOpen][data-id=elfes]');return !!b&&!!b.querySelector('.ui-sig');}),'⚠ sur Elfe dans la liste');
      ok(await E(page,()=>sigOpenFor('race','cache').length===0),'race invisible : pas de ⚠');
      await go(page,"navGo({t:'race',id:'elfes'})");
      await page.click('[data-act=sigPop]');await page.waitForTimeout(200);
      let t=await E(page,()=>document.body.innerText);ok(/Description · À compléter/.test(t),'encart : motif');
      await page.click('[data-act=sigGo]');await page.waitForTimeout(200);
      ok(await E(page,()=>S.view==='todo'&&S.atF==='sig'),'« Ouvrir dans À traiter »');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      await E(page,()=>{S.visit=true;});
      ok(await E(page,()=>sigOpenFor('race','elfes').length===0||!isUser()),'Visiteur : pas de ⚠');
      await ctx.close();}

    console.log('3. Ordre manuel des entrées');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      await go(page,"navGo({t:'jour',id:'q1'})");
      ok(await E(page,()=>!document.querySelector('[data-act=jrMv]')),'flèches cachées hors modification');
      await page.click('[data-act=jrEm]');await page.waitForTimeout(200);
      ok(await E(page,()=>document.querySelectorAll('[data-act=jrMv]').length===6),'↑ ↓ sur chaque entrée');
      await page.click('[data-act=jrMv][data-e=e3][data-v="-1"]');await page.waitForTimeout(300);
      let q=db.get('journaux/q1');ok(q.man===true&&q.ent.map(e=>e.id).join()==='e1,e3,e2','Trois monte : ordre manuel enregistré');
      let t=await go(page,"navGo({t:'jour',id:'q1'})");ok(/Ordre manuel/.test(t)&&/Trier par date/.test(t),'« Ordre manuel · Trier par date »');
      await page.click('[data-act=jrSortD]');await page.waitForTimeout(300);
      q=db.get('journaux/q1');ok(!q.man&&await E(page,()=>jrEntSorted(S.jour.q1).map(e=>e.id).join()==='e1,e2,e3'),'retour au tri par date');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}

    console.log('4. Titre ↔ fief');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      let t=await go(page,"navGo({t:'perso',id:'kerian'});S.shTab='situ'");
      ok(await E(page,()=>{const b=document.querySelector('#cb-titres .lk[data-t=fiche][data-id=vda]');return !!b&&/Comte de Ville d'Avray/.test(b.textContent);}),'titre = lien vers la fiche du fief');
      ok(/Fief : Ville D'Avray et Sèvres/.test(t)&&!await E(page,()=>!!document.querySelector('#cb-titres .sfief')),'« Fief : … » sous le titre, une ligne');
      t=await go(page,"navGo({t:'fiche',id:'vda'})");
      ok(/Kerian\s*›?\s*· Comte de Ville d'Avray/.test(t),'fiche du fief : titre du détenteur');
      ok(/Sloan/.test(t)&&!/Sloan\s*›?\s*·/.test(t),'détenteur sans titre : nom seul');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}

    console.log('5. Réglages : Cartes et Listes de valeurs (MJ, mode édition)');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      let t=await go(page,"S.edit=true;S.view='params';S.ptab='cartes'");
      ok(await E(page,()=>document.querySelectorAll('.capr2').length===3&&!document.querySelector('[data-cap=into]')),'lignes : nom, nombre, crayon (plus de menu Supprimer…)');
      ok(/1 repère/.test(t)&&/Lieu public/.test(t),'nom en entier et nombre de repères');
      await page.click('[data-act=caPdCat][data-i="2"]');await page.waitForTimeout(200);
      ok(await E(page,()=>!!document.querySelector('[data-act=caPdCatDel]')),'catégorie sans repère : corbeille');
      await page.click('[data-act=caPdCatDel]');await page.waitForTimeout(200);
      await page.click('[data-act=caPdCat][data-i="1"]');await page.waitForTimeout(200);
      ok(await E(page,()=>!document.querySelector('[data-act=caPdCatDel]')),'catégorie utilisée : pas de corbeille');
      await page.click('.sheet [data-act=caPdMv][data-v="-1"]');await page.waitForTimeout(200);
      await page.selectOption('#caCi','pub');await page.waitForTimeout(200);
      ok(await E(page,()=>!S.dlg&&S.caPd.cats.length===1),'fusion : fenêtre fermée, catégorie retirée du brouillon');
      await page.click('[data-act=caPdSave]');await page.waitForTimeout(300);
      ok(db.get('meta/cartes').cats.map(c=>c.id).join()==='pub'&&db.get('fiches/r1').cat==='pub','enregistré : repère passé dans « Lieu public »');
      // ordre par glisser
      await E(page,()=>{S.caPd=null;S.caCfg={...S.caCfg,cats:[{id:'a',nom:'A',coul:'#111111'},{id:'b',nom:'B',coul:'#222222'},{id:'c',nom:'C',coul:'#333333'}]};S._force=true;render();});
      const h=await page.$('[data-cadrag="0"]'),r2=await (await page.$('.capr2:nth-child(3)')).boundingBox(),b0=await h.boundingBox();
      await page.mouse.move(b0.x+5,b0.y+5);await page.mouse.down();await page.mouse.move(b0.x+5,r2.y+r2.height-2,{steps:6});await page.mouse.up();await page.waitForTimeout(200);
      ok(await E(page,()=>S.caPd.cats.map(c=>c.id).join()!=='a,b,c'),'glisser ⋮⋮ change l\'ordre ('+await E(page,()=>S.caPd.cats.map(c=>c.id).join())+')');
      t=await go(page,"S.caPd=null;S.view='params';S.ptab='listes';S.fiLv='lieu'");
      ok(await E(page,()=>!!document.querySelector('select[data-filv]')&&!document.querySelector('.fiseg')),'menu « Genre : … ▾ »');
      await page.selectOption('select[data-filv]','carte');await page.waitForTimeout(200);
      ok(await E(page,()=>S.fiLv==='carte'),'changer de genre');
      ok(!/Renommer ou fusionner<\/button>/.test(await E(page,()=>document.getElementById('app').innerHTML)),'crayon seul par ligne');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}

    console.log('6. Ajustements : Compléter en haut, Mentions, intertitres, chemin des lieux');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      await E(page,()=>{const c=clone(S.chars.wag);c.por={desc:'Voir @[fiche:vda|Ville]'};c.situ={lieux:[{id:'l1',nom:'Cartoucherie',f:'cart',nats:['res']}]};S.chars.wag=c;
        S.fiches.cart={id:'cart',genre:'lieu',nom:'Cartoucherie',type:'',parent:'vda',vis:'rev',eye:{},desc:'Tenue par @[perso:wag|Henriette]',sait:[],notes:'',par:'lorenzo',cree:'2026-11-01',modif:'2026-11-01'};
        S.fiches.vda={...S.fiches.vda,desc:'Fief de @[perso:wag|Henriette]'};
        for(let i=0;i<7;i++)S.fiches['ev'+i]={id:'ev'+i,genre:'evenement',nom:'Év '+i,type:'Scénario',n:i+1,vis:'rev',desc:'Avec @[perso:wag|H]',debut:{a:1900,m:1,j:i+1},pj:[],par:'lorenzo',cree:'2026-11-01',modif:'2026-11-01'};});
      let t=await go(page,"localStorage.removeItem('xp.mgOpen');navGo({t:'perso',id:'wag'})");
      ok(await E(page,()=>!!document.querySelector('.ux2top [data-act=compMenu]')),'« + » Compléter dans l\'en-tête');
      ok(await E(page,()=>{const L=fiMentions('perso','wag').map(m=>m.o.id);return L.includes('vda')&&L.includes('cart');}),'mentions brutes : Ville et Cartoucherie');
      ok(await E(page,()=>{const m=document.querySelector('#fb-pn-ment');return !!m&&!/Cartoucherie|Ville D'Avray/.test(m.textContent);}),'doublons retirés (lieu de la Situation, lien de la Description)');
      ok(await E(page,()=>{const d=[...document.querySelectorAll('details.mgrp')];const ev=d.find(x=>x.dataset.mg==='Événements');return !!ev&&!ev.open&&/7/.test(ev.querySelector('summary').textContent);}),'groupe de 7 événements replié, avec son nombre');
      ok(/Ville D'Avray et Sèvres › Cartoucherie/.test(t)&&await E(page,()=>getComputedStyle(document.querySelector('.lpath .lk'),'::after').content==='none'),'chemin des lieux : un seul chevron');
      ok(await E(page,()=>getComputedStyle(document.querySelector('#fb-pn-situ .fimg')).color!==getComputedStyle(document.querySelector('.muted')).color),'intertitre en couleur');
      await page.click('.ux2top [data-act=compMenu]');await page.waitForTimeout(200);
      ok(await E(page,()=>!!document.querySelector('.ux4cpm')&&/Occupation/.test(document.querySelector('.ux4cpm').textContent)),'menu ouvert : blocs à compléter');
      ok(await E(page,()=>[...document.querySelectorAll('.ux2comp')].some(c=>/Compléter :/.test(c.textContent))),'barre du bas gardée');
      await page.click('.ux4cpm [data-act=pnTxt][data-b=occ]');await page.waitForTimeout(200);
      ok(await E(page,()=>!S.compMenu&&S.dlg&&S.dlg.b==='occ'),'choisir une entrée ferme le menu et ouvre la fenêtre');
      await E(page,()=>{S.dlg=null;});await go(page,"navGo({t:'perso',id:'wag'})");
      await page.click('.ux2top [data-act=compMenu]');await page.waitForTimeout(150);await page.click('.ux4cpbg',{position:{x:5,y:600}});await page.waitForTimeout(150);
      ok(await E(page,()=>!S.compMenu&&!document.querySelector('.ux4cpm')),'clic à côté : menu fermé');
      await page.click('details.mgrp[data-mg="Événements"] summary');await page.waitForTimeout(150);
      ok(await E(page,()=>JSON.parse(localStorage.getItem('xp.mgOpen')||'{}')['Événements']===true),'repli mémorisé');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ exception : '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert.');process.exit(fails?1:0);
})();
