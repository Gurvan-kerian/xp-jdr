/* Tableur du référentiel (27/11/2026) : import-export .xlsx.
   Usage : node tests/tableur.test.js [docs.json] — sans argument, données inventées.
   Carte (ordinateur / téléphone, mode édition), export de tous les genres, relecture sans changement (aller-retour), relecture d'un fichier
   réenregistré par un tableur (openpyxl : chaînes partagées, compression), modifications et créations, onglets de détail, aperçu, enregistrement. */
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{execFileSync}=require('child_process');
const {loadApp}=require('./harness.js');
let chromium;try{({chromium}=require('playwright'));}catch(e){({chromium}=require('/opt/npm-tools/node_modules/playwright'));}
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const GEN=loadApp(ROOT,['config','engine','modele']);
const now='2026-11-27T09:00:00.000Z';
const fi=(id,genre,nom,o)=>({id,genre,nom,type:'',parent:'',kanka:'',vis:'rev',eye:{desc:true,sait:true},desc:'',sait:[],notes:'',par:'lorenzo',cree:now,modif:now,...o});
function demoDocs(){const ch=(id,court,type,o)=>({...GEN.run(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
  const F8=Array(8).fill(false),E8=Array(8).fill('');
  return {'meta/schema':{v:2},
    'players/lorenzo':{id:'lorenzo',nom:'Lorenzo',role:'MJ',persos:[]},
    'players/anne':{id:'anne',nom:'Anne',role:'Joueur',persos:['sloan']},
    'chars/sloan':ch('sloan','Sloan','PJ',{race:'Elfe'}),
    'chars/fab':ch('fab','Fabrice','PNJ',{nom:'Fabrice Cauteleux',vis:'rev',eye:{role:true},race:'Elfe',genre:'m',statut:'actif',por:{role:'Membre des Utopiens.',fm:''},
      situ:{orgs:[{id:'s1',nom:'Monarchie',f:'mon',rang:'r2',role:'Prévôt'}],lieux:[{id:'s2',nom:'Paris',f:'par',nat:'res',res:true}]}}),
    'meta/creatures':{list:[{id:'elfes',fam:'trad',nom:'Elfes',done:true},{id:'ondines',fam:'trad',nom:'Ondines',done:false}]},
    'meta/races':{byId:{elfes:{sing:'Elfe',car:{Force:[1,5],Esprit:[2,6],'Agilité':[3,7],Prestance:[3,7],Perception:[2,6],'Précision':[2,6],'Sang Froid':[1,5],Constitution:[1,5]},
        acc:['Agilité'],pred:['Culture'],fut:[['Danse','Jeux'],'Poésie'],at:[{id:'at-grace',nom:'Grâce',desc:'élégance',fx:[]}],
        av:[{id:'av-belle',nom:'Belle mine',desc:'+2 en séduction',fx:[{t:'jet',id:'fx-a1',txt:'aux tentatives de séduction',val:2,cible:'Séduction',quand:'m'}]}],dv:[],
        typ:[['Beau monde','Entregent'],'Héraldique'],sp:[['Élégance','Classe','']],spf:[],cap:[{id:'cap-ail',v:'v-ret'}],choix:[['acc','Agilité'],['cap','cap-ail','']],
        pw:{m:['pw-cha','','',''],d:['pw-ref',''],p:'',l:''},pwi:F8,pwv:E8,eye:{fiche:true},kanka:'',por:{acc:'Les Elfes sont gracieux.'},traits:['Fier','Raffiné']},
      ondines:{sing:'Ondin',fem:'Ondine',nomP:'f',car:null,acc:[],pred:[],fut:[],at:[],av:[],dv:[],typ:[],sp:[],spf:[],cap:[],choix:[],pw:{m:['','','',''],d:['',''],p:'',l:''},pwi:F8,pwv:E8,eye:{fiche:false},kanka:''}}},
    'meta/pouvoirs':{byId:{'pw-cha':{nom:'Charme',desc:'La cible tombe amoureuse.',cat:'ordinaire',nat:'m',type:'actif',prec:false,act:'Féerie',cib:'1',dur:'1 jour',por:'conversation',res:'psychique',zon:'',kanka:'',fx:[],var:[]},
      'pw-ref':{nom:'Réflexe surhumain',desc:'',cat:'ordinaire',nat:'d',type:'passif',prec:false,fx:[{t:'perm',id:'fx-r1',cible:'der:Initiative',val:1,txt:'',quand:'d'}],var:[]}}},
    'meta/capacites':{byId:{'cap-ail':{nom:'Ailes',desc:'Véritables ailes.',type:'passif',prec:true,fx:[{t:'rap',id:'fx-c1',cible:'',val:0,txt:'−2 en Discrétion',quand:'m'}],var:[{id:'v-ret',nom:'rétractiles',desc:'',fx:[]}]}}},
    'fiches/par':fi('par','lieu','Paris',{type:'Ville',orgs:[{id:'lo1',f:'mon',nom:'Monarchie',note:'cour'}]}),
    'fiches/tou':fi('tou','lieu','Tour Fréhel',{parent:'par',sait:[{id:'i1',txt:'Une tour engloutie.',rev:true}]}),
    'fiches/obj':fi('obj','objet','Tube acoustique',{uniq:true,det:[{id:'sloan'}],lieu:{f:'tou',nom:'Tour Fréhel'},carac:{taille:'20 cm'},crea:{nom:'Inconnu'}}),
    'fiches/ald':fi('ald','famille','Aldébard',{type:'Majeure',devise:'Plus haut que tous',race:'Elfe',vasx:[{id:'vx1',nom:'Hammerstein'}]}),
    'fiches/mon':fi('mon','org','Monarchie',{type:'Gouvernement',titres:true,rangs:[{id:'r1',m:'Roi',f:'Reine',note:'monde'},{id:'r2',m:'Duc',f:'Duchesse',note:'pays'}]}),
    'fiches/uto':fi('uto','org','Monarchomaques',{type:'Activiste',rel:[{id:'rl1',f:'mon',nom:'Monarchie',lab:'ennemis'}],vis:'prep'}),
    'gains/all':{events:[]}};}
const docsPath=process.argv[2];const DOCS=docsPath?JSON.parse(fs.readFileSync(docsPath,'utf8')):demoDocs();
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
    if(fn==='xp_portraits')return J(route,rows.filter(r=>r.coll==='portraits'));
    if(/^xp_img/.test(fn))return J(route,null);
    return route.fulfill({status:404,body:'absent'});}};}
async function open(browser,base,db,me,vp){const ctx=await browser.newContext({viewport:vp||{width:1280,height:900},acceptDownloads:true});const page=await ctx.newPage();const errs=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|service ?worker/i.test(m.text()))errs.push(m.text());});
  await page.route('**/rest/v1/rpc/**',r=>db.handle(r));await page.route('**/functions/v1/notify',r=>r.fulfill({status:200,contentType:'application/json',body:'{"sent":0}'}));await page.route(/fonts\.(googleapis|gstatic)/,r=>r.fulfill({status:200,body:''}));
  await page.addInitScript(([me])=>{localStorage.setItem('xp.code','test');localStorage.setItem('xp.me',me);},[me]);
  await page.goto(base+'/index.html');await page.waitForFunction(()=>typeof S!=='undefined'&&S.schemaReady&&S.playersReady&&S.racesReady&&S.fichesReady!==undefined);await page.waitForTimeout(300);
  await page.evaluate(()=>{S.fichesReady=true;S.id&&(S.id.state='ok');S.view='team';render();});
  return {page,errs,ctx};}
const wait=(page,n)=>page.waitForTimeout(n||200);
const donnees=page=>page.evaluate(()=>{S.view='params';S.ptab='donnees';S.dlg=null;S._force=true;render();return document.getElementById('app').innerText;});
const ALL=['race','pw','cap','pp','pnj','lieu','objet','famille','org'];
/* Fonctions de la page : export → octets, relecture, modification des lignes */
const HELP=`window.__T={
  bytes:sel=>Array.from(txBook(txSheets(sel))),
  read:async a=>txReadBook(new Uint8Array(a).buffer),
  plan:B=>{const P=txPlan(B);return {list:P.list.map(x=>({g:x.g,id:x.id,nom:x.nom,act:x.act,ch:x.ch.map(c=>[c.c,c.av,c.ap,c.del?'del':c.add?'add':''])})),warn:P.warn.map(w=>w.sh+' '+w.r+' '+w.m),info:P.info};},
  ix:(B,sh,h)=>B[sh][0].indexOf(h),
  set:(B,sh,id,h,v)=>{const R=B[sh].find((r,i)=>i&&r&&r[0]===id)||B[sh].find((r,i)=>i&&r&&r.includes(id));R[__T.ix(B,sh,h)]=v;},
  add:(B,sh,o)=>{const R=[];for(const k in o)R[__T.ix(B,sh,k)]=o[k];B[sh].push(R);},
  del:(B,sh,f)=>{B[sh]=B[sh].filter((r,i)=>!i||!r||!f(r));}};`;
(async()=>{
  const srv=await serve(),base='http://127.0.0.1:'+srv.address().port;
  let browser;try{browser=await chromium.launch();}catch(e){browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});}
  const db=fakeDb(JSON.parse(JSON.stringify(DOCS)));
  try{
    console.log('1. Carte « Tableur du référentiel »');
    {const {page,errs,ctx}=await open(browser,base,db,'lorenzo',{width:420,height:900});
      await page.evaluate(()=>{S.edit=true;});let t=await donnees(page);ok(/Tableur du référentiel/i.test(t)&&/Disponible sur ordinateur/.test(t),'téléphone : message à la place des boutons');
      ok(!(await page.$('[data-act="txExp"]')),'téléphone : pas de bouton Exporter');ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs[0]:''));await ctx.close();}
    const {page,errs,ctx}=await open(browser,base,db,'lorenzo');await page.evaluate(HELP);
    await page.evaluate(()=>{S.edit=true;});let t=await donnees(page);
    ok(await page.evaluate(()=>document.querySelectorAll('.txcard input[data-txg]').length)===9,'9 cases à cocher');
    ok(await page.evaluate(()=>document.querySelector('[data-act="txExp"]').disabled),'Exporter désactivé sans case cochée');
    await page.click('.txcard input[data-txg="pw"]');await wait(page);ok(/Exporter 1 genre/.test(await page.evaluate(()=>document.querySelector('[data-act="txExp"]').innerText)),'1 genre coché');
    await page.click('[data-act="txAll"]');await wait(page);if(process.env.SHOTS)await page.screenshot({path:path.join(process.env.SHOTS,'carte.png'),fullPage:true});ok(/Exporter 9 genres/.test(await page.evaluate(()=>document.querySelector('[data-act="txExp"]').innerText)),'Tout cocher');
    const [dl]=await Promise.all([page.waitForEvent('download'),page.click('[data-act="txExp"]')]);ok(/^referentiel-\d{4}-\d\d-\d\d\.xlsx$/.test(dl.suggestedFilename()),'téléchargement '+dl.suggestedFilename());
    const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'tx-'));const fx=path.join(tmp,'export.xlsx');await dl.saveAs(fx);

    console.log('2. Fichier exporté');
    let B=await page.evaluate(async a=>__T.read(a),Array.from(fs.readFileSync(fx)));
    const names=Object.keys(B);ok(['Lisez-moi','Races','Pouvoirs','Capacités','Tableaux de PP','PNJ','Lieux','Objets','Familles','Organisations','Races – détail','Sous-types','Effets','PNJ – Situation','Ce que l\'on sait','Org. – relations'].every(n=>names.includes(n)),'16 onglets : '+names.join(', '));
    let only=await page.evaluate(async()=>Object.keys(await __T.read(__T.bytes(['race']))));ok(only.join('|')==='Lisez-moi|Races|Races – détail|Effets','Races seules : Lisez-moi, Races, Races – détail, Effets');
    let py='';try{py=execFileSync('python3',['-c',`import openpyxl,sys
wb=openpyxl.load_workbook(sys.argv[1])
print(len(wb.sheetnames),wb['Pouvoirs'].max_row-1,wb['Pouvoirs']['B1'].value,wb['Pouvoirs'].freeze_panes)
wb.save(sys.argv[2])`,fx,path.join(tmp,'resave.xlsx')]).toString().trim();}catch(e){py='erreur '+e.message;}
    const nPw=await page.evaluate(()=>Object.keys(S.pouvoirs).length);
    ok(py.startsWith('16 '+nPw+' Nom A2'),'ouvert par un tableur (openpyxl) : '+py);

    console.log('3. Aller-retour sans modification');
    let P=await page.evaluate(B=>__T.plan(B),B);ok(P.list.length===0,'aucun changement'+(P.list.length?' : '+JSON.stringify(P.list.slice(0,3)):''));ok(P.warn.length===0,'aucun point à voir'+(P.warn.length?' : '+P.warn.slice(0,3).join(' | '):''));
    if(fs.existsSync(path.join(tmp,'resave.xlsx'))){const B2=await page.evaluate(async a=>__T.read(a),Array.from(fs.readFileSync(path.join(tmp,'resave.xlsx'))));const P2=await page.evaluate(B=>__T.plan(B),B2);
      ok(P2.list.length===0&&P2.warn.length===0,'fichier réenregistré (chaînes partagées, compression) : aucun changement'+(P2.list.length?' : '+JSON.stringify(P2.list.slice(0,2)):'')+(P2.warn.length?' | '+P2.warn[0]:''));}

    let lo='';try{execFileSync('soffice',['--headless','--convert-to','xlsx','--outdir',path.join(tmp,'lo'),fx],{stdio:'ignore',timeout:90000});lo=path.join(tmp,'lo','export.xlsx');}catch(e){}
    if(lo&&fs.existsSync(lo)){const B3=await page.evaluate(async a=>__T.read(a),Array.from(fs.readFileSync(lo)));const P3=await page.evaluate(B=>__T.plan(B),B3);
      ok(P3.list.length===0&&P3.warn.length===0,'fichier réenregistré par LibreOffice : aucun changement'+(P3.list.length?' : '+JSON.stringify(P3.list.slice(0,2)):'')+(P3.warn.length?' | '+P3.warn[0]:''));}
    else console.log('  (LibreOffice absent : relecture non testée)');
    if(!docsPath){
      console.log('4. Modifications et créations');
      B=await page.evaluate(B=>{const T=__T;
        T.set(B,'Pouvoirs','pw-cha','Durée','1 scène');T.set(B,'Pouvoirs','pw-cha','Portée','-');
        T.add(B,'Pouvoirs',{'Nom':'Brume d\'oubli','Catégorie':'Profond','Nature':'Masqué','Type':'Actif','Description':'Efface un souvenir.'});
        T.add(B,'Pouvoirs',{'Nom':'Sans type','Catégorie':'Profond','Nature':'Masqué'});
        T.add(B,'Pouvoirs',{'ID':'pw-inconnu','Nom':'X'});
        T.add(B,'Effets',{'Genre':'Pouvoir','Élément':'Brume d\'oubli','Sorte':'Permanent','Valeur visée':'Caractéristique : Force','Valeur':'1','Quand':'Masqué'});
        T.del(B,'Effets',r=>r.includes('fx-r1'));
        T.add(B,'Sous-types',{'Genre':'Capacité','ID élément':'cap-ail','Élément':'Ailes','Nom':'membraneuses','Description':'de chauve-souris'});
        T.set(B,'Races','elfes','Accroche','Les Elfes sont fiers.');T.set(B,'Races','elfes','Pouvoir masqué 2','Brume d\'oubli');T.set(B,'Races','elfes','Force max','6');
        T.set(B,'Races – détail','at-grace','Description ou note','élégance naturelle');
        T.add(B,'Races – détail',{'ID race':'elfes','Race':'Elfe','Sorte':'Désavantage','Nom':'Hautain','Description ou note':'−1 en Entregent'});
        T.add(B,'Races',{'Nom masculin':'Gnome','Nom de la liste':'Gnomes','Famille':'Moderne','Révélée':'non'});
        T.set(B,'Tableaux de PP','pp-1','Coût','2');
        T.add(B,'PNJ',{'Nom':'Jean Valjean','Race':'Elfe','Genre':'Masculin','Statut':'Actif','Révélé':'oui','Rôle':'Ancien forçat.'});
        T.add(B,'PNJ – Situation',{'PNJ':'Jean Valjean','Rubrique':'Organisations','Nom':'Monarchie','Rang':'Duc','Rôle':'Bailli'});
        T.set(B,'PNJ – Situation','s2','Nature','propriétaire');
        T.set(B,'PNJ','fab','Race','Inconnue');
        T.set(B,'Lieux','tou','Lieu parent','-');T.set(B,'Lieux','par','Organisations liées','Monarchie (cour) ; Monarchomaques');
        T.add(B,'Ce que l\'on sait',{'Genre':'Lieu','ID fiche':'par','Fiche':'Paris','Texte':'La Ville Lumière.','Révélé':'oui'});
        T.set(B,'Organisations','mon','Rangs internes','Roi / Reine (monde) ; Duc / Duchesse (pays) ; Baron / Baronne');
        T.set(B,'Org. – relations','rl1','Étiquette','adversaires');
        T.add(B,'Objets',{'Nom':'Globe Herzog','Unique':'oui','Créateur':'Fabrice Cauteleux','Emplacement':'Paris','Révélé':'oui'});
        return B;},B);
      P=await page.evaluate(B=>__T.plan(B),B);const g=(gg,nom)=>P.list.find(x=>x.g===gg&&x.nom===nom)||{ch:[]},has=(x,c,ap)=>x.ch.some(y=>y[0]===c&&(ap===undefined||y[2]===ap));
      ok(has(g('pw','Charme'),'Durée','1 scène')&&g('pw','Charme').ch.some(y=>y[0]==='Portée'&&y[2]===''),'pouvoir : champ modifié, champ effacé par « - »');
      ok(g('pw','Brume d\'oubli').act==='new','pouvoir créé');ok(!P.list.some(x=>x.nom==='Sans type'),'création refusée sans type');
      ok(P.warn.some(w=>/pw-inconnu/.test(w)),'ID inconnu signalé');ok(P.warn.some(w=>/Sans type.*Type/.test(w)),'champ obligatoire signalé');
      ok(has(g('pw','Brume d\'oubli'),'Effets'),'effet ajouté au pouvoir créé');ok(g('pw','Réflexe surhumain').ch.some(y=>y[0]==='Effets'&&y[3]==='del'),'effet retiré');
      ok(has(g('cap','Ailes'),'Sous-types'),'sous-type ajouté');
      const el=g('race','Elfe');ok(has(el,'Accroche')&&has(el,'Pouvoir masqué 2',"Brume d'oubli")&&has(el,'Force max','6'),'race : textes, emplacement de pouvoir, caractéristique');
      ok(el.ch.filter(y=>y[0]==='Races – détail').length===2,'race : 1 ligne modifiée, 1 ajoutée');ok(g('race','Gnome').act==='new','race créée');
      ok(has(g('pp','philanthrope'),'Coût','2'),'PP : coût');
      const jv=g('pnj','Jean Valjean');ok(jv.act==='new'&&has(jv,'Rôle')&&has(jv,'PNJ – Situation'),'PNJ créé avec sa Situation');
      ok(P.warn.some(w=>/race « Inconnue » introuvable/.test(w)),'race introuvable signalée');ok(has(g('pnj','Fabrice Cauteleux'),'PNJ – Situation'),'Situation : nature modifiée');
      ok(has(g('lieu','Tour Fréhel'),'Lieu parent',''),'lieu parent effacé');ok(has(g('lieu','Paris'),'Organisations liées')&&has(g('lieu','Paris'),'Ce que l\'on sait'),'lieu : organisations liées, « Ce que l\'on sait »');
      ok(has(g('org','Monarchie'),'Rangs internes'),'rangs internes');ok(has(g('org','Monarchomaques'),'Org. – relations'),'relation modifiée');
      ok(g('objet','Globe Herzog').act==='new','objet créé');
      console.log('5. Aperçu');
      await page.evaluate(B=>{S.tx={step:'apercu',B,nomF:'essai.xlsx',P:txPlan(B)};},B);t=await donnees(page);
      if(process.env.SHOTS)await page.screenshot({path:path.join(process.env.SHOTS,'apercu.png'),fullPage:true});ok(/Aperçu de l'import/.test(t)&&/essai\.xlsx/.test(t)&&/Points à voir/.test(t),'écran d\'aperçu');ok(/1 jour/.test(t)&&/1 scène/.test(t),'avant / après');ok(/retirée/.test(t),'entrée retirée affichée');
      const n=await page.evaluate(()=>S.tx.P.list.length);ok(new RegExp('Importer '+n+' changements').test(t),'bouton Importer '+n+' changements');
      console.log('6. Enregistrement');
      await page.click('[data-act="txGo"]');await wait(page,1200);t=await page.evaluate(()=>document.getElementById('app').innerText);ok(/Import terminé/.test(t),'import terminé');
      const pw=db.get('meta/pouvoirs').byId,bid=Object.keys(pw).find(k=>pw[k].nom==='Brume d\'oubli');
      ok(pw['pw-cha'].dur==='1 scène'&&pw['pw-cha'].por==='','pouvoir enregistré');ok(bid&&pw[bid].cat==='profond'&&pw[bid].nat==='m'&&pw[bid].fx.length===1&&pw[bid].fx[0].cible==='car:Force','pouvoir créé avec son effet');
      ok(pw['pw-ref'].fx.length===0,'effet retiré enregistré');ok(db.get('meta/capacites').byId['cap-ail'].var.length===2,'sous-type enregistré');
      const ra=db.get('meta/races').byId;ok(ra.elfes.por.acc==='Les Elfes sont fiers.'&&ra.elfes.pw.m[1]===bid&&ra.elfes.car.Force[1]===6,'race enregistrée');
      ok(ra.elfes.at[0].desc==='élégance naturelle'&&ra.elfes.dv.length===1&&ra.elfes.av[0].fx.length===1,'race : détail enregistré, effets gardés');
      const gn=db.get('meta/creatures').list.find(c=>c.nom==='Gnomes');ok(gn&&ra[gn.id]&&ra[gn.id].sing==='Gnome'&&gn.fam==='mod'&&ra[gn.id].eye.fiche===false,'race créée (préparée)');
      ok(db.get('meta/profils').el['pp-1'].cost.a===2,'PP enregistré');
      const jvc=db.rows.find(r=>r.coll==='chars'&&r.data.nom==='Jean Valjean');ok(jvc&&jvc.data.vis==='rev'&&jvc.data.race==='Elfe'&&jvc.data.situ.orgs[0].f==='mon'&&jvc.data.situ.orgs[0].rang==='r2'&&jvc.data.situ.orgs[0].role==='Bailli','PNJ créé (révélé, race, Situation reliée)');
      ok(db.get('chars/fab').situ.lieux[0].nat==='prop'&&db.get('chars/fab').race==='Elfe','Situation modifiée, race introuvable gardée');
      ok(db.get('fiches/tou').parent===''&&db.get('fiches/par').sait.length===1&&db.get('fiches/par').orgs.length===2&&db.get('fiches/par').orgs[1].f==='uto','lieux enregistrés');
      ok(db.get('fiches/mon').rangs.length===3&&db.get('fiches/mon').rangs[0].id==='r1'&&db.get('fiches/uto').rel[0].lab==='adversaires','organisations enregistrées');
      const gl=db.rows.find(r=>r.coll==='fiches'&&r.data.nom==='Globe Herzog');ok(gl&&gl.data.vis==='rev'&&gl.data.crea.id==='fab'&&gl.data.lieu.f==='par'&&gl.data.eye.desc===true,'objet créé');
      await page.evaluate(()=>{S.tx=null;});ok(/Dernier import/.test(await donnees(page)),'carte : dernier import');
      B=await page.evaluate(async()=>__T.read(__T.bytes(['race','pw','cap','pp','pnj','lieu','objet','famille','org'])));P=await page.evaluate(B=>__T.plan(B),B);
      ok(P.list.length===0&&P.warn.length===0,'nouvel aller-retour sans changement'+(P.list.length?' : '+JSON.stringify(P.list.slice(0,2)):'')+(P.warn.length?' | '+P.warn[0]:''));}
    ok(!errs.length,'aucune erreur'+(errs.length?' : '+errs.slice(0,3).join(' | '):''));
    await ctx.close();
  }catch(e){fails++;console.log('  ✗ '+e.stack);}
  await browser.close();srv.close();
  console.log(fails?`\n${fails} échec(s)`:'\nTout est bon');process.exit(fails?1:0);})();
