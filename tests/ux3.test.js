/* Lot 3 « Nettoyage UX 3 : Accueil, gestion et réglages » (28/11/2026). Usage : node tests/ux3.test.js — données inventées.
   Accueil en tableau de bord, page « À traiter » selon les droits, Règles en sections, Paramètres à 8 entrées (barre d'enregistrement,
   coûts du fief et des arts obscurs datés), réglages d'un art sur sa fiche, Joueurs, texte d'accueil. */
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
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:['kerian']},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'players/paul':{id:'paul',nom:'Paul',role:'Joueur',persos:[],gestion:true},
    'players/zoe':{id:'zoe',nom:'Zoé',role:'Joueur',persos:[],parti:true},
    'chars/kerian':ch('kerian','Kerian',{}),'chars/sloan':ch('sloan','Sloan',{}),
    'chars/ismael':pnj('ismael','Ismaël',{race:'Humain',pj:'kerian',feal:true}),
    'fiches/f-paris':fi('f-paris','lieu','Paris',{type:'Ville',modif:'2026-11-27T10:00:00.000Z',par:'anne'}),
    'fiches/f-art':fi('f-art','art','Faëomancie',{comp:true,pre:[],niv:['','','',''],max:9,cSort:12,nReq:4}),
    'fiches/f-prep':fi('f-prep','lieu','Phéacie',{vis:'prep'}),
    'brouillons/b1':{id:'b1',kind:'pj',par:'anne',statut:'attente',etape:9,d:{ident:{court:'Félicien'}}},
    'meta/planning':{dates:[{id:'d1',date:'2026-11-21',sl:'S',status:'valid',type:'Scénario',by:'lorenzo'}],ecartes:[]},
    'meta/pouvoirs':{byId:{'pw-x':{nom:'Lévitation',desc:''}}},
    'gains/all':{events:[]},
    'meta/secrets':{list:[{n:1,titre:'Alliance',titrePts:1,slots:{vm:[{txt:'Vérité A',pts:3,hid:true}],vmin:[],h:[]}}],props:[],lot:[{id:'l1',n:1,k:'vm',i:0}]}};}
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
    console.log('1. Accueil (joueur)');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      const t=await go(page,"S.view='home'");
      ok(/Prochaine partie/i.test(t),'bandeau Temps');
      ok(/Mes personnages/.test(t)&&/Sloan/.test(t)&&!/Kerian/.test(t)&&/Félicien/.test(t)&&/Voir ›/.test(t),'« Mes personnages » : son PJ et son brouillon en attente');
      ok(await E(page,()=>!!document.querySelector('details.hmblk[data-hm="at"]')),'bloc « À traiter » pour le joueur (session à créer)');
      ok(await E(page,()=>atItems().some(x=>x.plan)&&!atItems().some(x=>x.rub==='rev'||x.rub==='perso')),'joueur : session à créer, ni révélations ni brouillons');
      ok(await E(page,()=>!document.querySelector('details.hmblk[data-hm="at"]').open),'« À traiter » replié au téléphone');
      ok(/Paris/.test(await E(page,()=>document.querySelector('[data-hm="nv"]').textContent)),'« Nouveautés » : fiche révélée');
      ok(!/Phéacie/.test(t),'fiche préparée absente des nouveautés');
      ok(!await E(page,()=>!!document.querySelector('.htile2')),'tuiles supprimées');
      ok(/éléments ludiques/.test(t),'texte d\'accueil par défaut');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}

    console.log('2. Accueil et « À traiter » (MJ)');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      let t=await go(page,"S.view='home'");
      ok(/Mon personnage/.test(t)&&/Féal · Ismaël/.test(t),'féal sous son PJ (titre au singulier : un seul PJ)');
      const A=await E(page,()=>atItems().map(x=>x.rub));
      ok(A.includes('rev')&&A.includes('perso')&&A.includes('sess'),'MJ : révélations, brouillon, session');
      t=await go(page,"S.view='todo'");
      ok(/Révélations/.test(t)&&/Brouillon à valider · Félicien/.test(t),'page « À traiter » : rubriques');
      ok(/Lévitation/.test(t),'signalement sur un pouvoir : visible du MJ');
      t=await go(page,"S.atF='sess'");
      ok(!/Félicien/.test(t)&&/Créer la session/.test(t),'filtre par rubrique');
      t=await go(page,"S.atF='';S.edit=true;S.view='home'");
      ok(await E(page,()=>!!document.querySelector('[data-act="hmTxt"]')),'crayon du texte d\'accueil en mode édition');
      await E(page,()=>{S.dlg={kind:'hmTxt',txt:''};render();});
      await page.click('#sheetRoot [data-act="hmTxtSave"]');await page.waitForTimeout(300);
      ok(db.get('meta/accueil')&&db.get('meta/accueil').txt==='','texte d\'accueil vidé, enregistré');
      t=await go(page,"S.edit=false;S.view='home'");
      ok(!/éléments ludiques/.test(t),'texte vide : masqué');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}

    console.log('3. « À traiter » : droits des signalements');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      const t=await go(page,"S.view='todo'");
      ok(!/Lévitation/.test(t),'joueur : pas de signalement sur un pouvoir (référentiel)');
      ok(await E(page,()=>atSigSee({obj:{t:'perso',id:'sloan'},champ:'Spécialités'})),'joueur : signalement sur un personnage visible');
      ok(!await E(page,()=>atSigSee({obj:{t:'ppel',id:'x'},champ:'Effet'})),'joueur : pas d\'élément de PP');
      await ctx.close();}
    {const {page,ctx}=await open(browser,base,db,'paul');
      ok(await E(page,()=>atSigSee({obj:{t:'ppel',id:'x'},champ:'Effet'})&&!atItems().some(x=>x.rub==='perso'||x.rub==='rev')),'gestion : éléments de PP, sans brouillons ni révélations');
      await ctx.close();}

    console.log('4. Règles et recherche');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      let t=await go(page,"S.view='rules'");
      ok(['Barèmes d\'XP','Points de personnage','Profils et points de personnage','Récompenses','Gestion de fief','Pages du livre'].every(x=>t.toLowerCase().includes(x.toLowerCase())),'6 sections');
      ok(!/Rattrapage|Alerte de gains|Changer de code/.test(t)&&!await E(page,()=>!!document.querySelector('.rgtabs')),'fonctionnement de l\'appli, bas de page et sous-onglets retirés');
      t=await go(page,"S.shFold={'rg-b':false}");
      ok(/5 XP × niveau visé/.test(t)&&/Féerie 3 → 4 : 20 XP/.test(t),'formule en clair avec exemple');
      t=await go(page,"S.view='srch';S.srch={q:'tricherie',g:'all',more:false}");
      ok(/Tricherie/.test(t)&&/Règles/.test(t),'recherche globale : genre Règles');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}

    console.log('5. Paramètres, arts obscurs, fief');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      let t=await go(page,"S.edit=true;S.view='params';S.ptab=''");
      ok(await E(page,()=>document.querySelectorAll('.pli').length)===8,'8 entrées');
      ok(!/Arts obscurs/.test(t)&&/Coûts et gains d'XP/.test(t)&&/Fief/.test(t),'arts obscurs retiré, Coûts et Fief présents');
      t=await go(page,"S.ptab='arts'");
      ok(/Coûts et gains d'XP/.test(t)&&/Arts obscurs/i.test(t),'ancienne entrée redirigée vers Coûts et gains d\'XP');
      ok(await E(page,()=>document.querySelector('.psave').hidden),'barre d\'enregistrement cachée sans modification');
      ok(await E(page,()=>aoCSort(S.fiches['f-art'])===5&&aoMax(S.fiches['f-art'])===7),'arts : chiffres de Paramètres (champs de la fiche ignorés)');
      await E(page,()=>{S.shFold={'pu-a':false};S._force=true;render();});
      await page.fill('[data-pv="aoSort"]','6');await page.dispatchEvent('[data-pv="aoSort"]','input');
      ok(await E(page,()=>!document.querySelector('.psave').hidden),'barre visible dès la modification');
      await page.click('.psave [data-act="pSave"]');await page.waitForTimeout(300);
      ok(await E(page,()=>aoCSort(S.fiches['f-art'])===6),'coût d\'un sort enregistré (version datée)');
      ok((db.get('meta/params').versions||[]).some(v=>v.v.aoSort===6),'version écrite dans meta/params');
      t=await go(page,"S.ptab='fief';S.shFold={'pu-f':false}");
      ok(await E(page,()=>fgCfg().cc===PRM.fgCc&&fgCfg().cr===PRM.fgCr),'fief : coûts lus dans Paramètres');
      ok(/Population féerique/i.test(t),'fief : réglages descriptifs');
      t=await go(page,"S.view='rules';S.shFold={'rg-f':false}");
      ok(!/Réglages des fiefs/.test(t),'plus de réglages dans Règles › Gestion de fief');
      t=await go(page,"S.view='univers';S.uni='art';S.fi='f-art'");
      ok(/Réglages de l'art/i.test(t)&&/Prérequis/i.test(t),'réglages de l\'art sur sa fiche (mode édition)');
      t=await go(page,"S.edit=false");
      ok(!/Réglages de l'art/i.test(t),'réglages de l\'art masqués hors mode édition');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
    {const {page,ctx}=await open(browser,base,db,'paul');
      await E(page,()=>editToggle());
      ok(await E(page,()=>S.edit===true),'gestion : mode édition accessible');
      await ctx.close();}

    console.log('6. Joueurs');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo');
      let t=await go(page,"S.view='players'");
      ok(!/Sur cet appareil/.test(t),'carte « Sur cet appareil » retirée');
      ok(/Aucun personnage/.test(t),'« Aucun personnage »');
      ok(await E(page,()=>!!document.querySelector('details.plgone'))&&/Partis de la table · 1/.test(t),'partis de la table regroupés en bas');
      ok(await E(page,()=>!!document.querySelector('.pghead [data-act="newPOpen"]')),'« + » dans l\'en-tête');
      await E(page,()=>{S.dlg={kind:'pl',id:'anne'};render();});
      const sh=await E(page,()=>document.getElementById('sheetRoot').innerHTML);
      ok(/data-act="pDel"/.test(sh)&&!/Zone sensible/.test(sh),'corbeille dans le titre, plus de zone sensible');
      ok(!/Voir comme un joueur/.test(sh),'« Voir comme un joueur » retiré de la fenêtre');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
    {const {page,ctx}=await open(browser,base,db,'anne');
      await E(page,()=>{S.view='players';S.dlg={kind:'pl',id:'anne'};render();});
      ok(!/partiToggle/.test(await E(page,()=>document.getElementById('sheetRoot').innerHTML)),'« Parti de la table » réservé au MJ');
      await ctx.close();}

    console.log('8. Pouvoirs, capacités et races ouverts aux joueurs (correctif)');
    {const {page,errs,ctx}=await open(browser,base,db,'anne');
      ok(await E(page,()=>canElEd('pw','')&&!canElEd('pw','pw-x')&&canRaceEd(null)),'joueur : créer oui ; pouvoir non visible : non');
      const t=await go(page,"S.view='univers';S.uni='pouvoirs';S.fi=null");
      ok(await E(page,()=>!!document.querySelector('.pghead [data-act="elEdit"]')),'« + » de Pouvoirs et capacités pour le joueur');
      await E(page,()=>{S.dlg=elDraft('pw',null);Object.assign(S.dlg,{nom:'Vol plané',type:'actif',cat:'ordinaire',nat:'m'});elSave();});await page.waitForTimeout(400);
      const P=db.get('meta/pouvoirs').byId,id=Object.keys(P).find(k=>P[k].nom==='Vol plané');
      ok(!!id&&P[id].rev===true,'pouvoir créé par un joueur : révélé');
      ok(await E(page,id=>elSeen('pw',id)&&canElEd('pw',id),id),'visible et modifiable par les joueurs');
      ok(await E(page,()=>atSigSee({obj:{t:'pouvoir',id:'pw-x'},champ:'Type'})===false),'signalement sur un pouvoir non visible : pas pour le joueur');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}

    console.log('7. Ordinateur');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo',{width:1280,height:800});
      await go(page,"S.view='home'");
      ok(await E(page,()=>[...document.querySelectorAll('details.hmblk')].every(d=>d.open)),'blocs ouverts sur ordinateur');
      ok(await E(page,()=>{const n=document.querySelector('nav.tabs');return !!n&&getComputedStyle(n).display!=='none';}),'navigation visible sur l\'accueil');
      ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
  }catch(e){fails++;console.log('  ✗ exception : '+e.message);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est vert.');process.exit(fails?1:0);
})();
