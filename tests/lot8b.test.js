/* Lot 8 b (26/11/2026) : import Kanka des objets, créatures, événements, journaux et quêtes ; Bestiaire › Spécimens connus ; image des événements.
   Usage : node tests/lot8b.test.js docs.json import-objets.json import-creatures.json import-evenements.json import-journaux.json
   (export Supabase converti en {coll/id: data} ; fichiers d'import préparés par Claude, hors dépôt ; images simulées ici). Sans navigateur. */
const fs=require('fs'),path=require('path');
const {loadApp,setDocs}=require('./harness.js');
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const A=process.argv.slice(2);
if(A.length<5){console.log('Usage : node tests/lot8b.test.js docs.json import-objets.json import-creatures.json import-evenements.json import-journaux.json');process.exit(2);}
const DOCS=JSON.parse(fs.readFileSync(A[0],'utf8'));
const PIX='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const load=p=>{const F=JSON.parse(fs.readFileSync(p,'utf8'));for(const it of F.items)for(const m of it.imgs||[]){if(m.m!=='big')m.th=PIX;m.big=PIX;}return F;};
const [OF,CF,EF,JF]=A.slice(1).map(load);

(async()=>{
const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','referentiel','parametres','planning','db','donnees']),r=c=>app.run(c);
setDocs(app,DOCS);
r(`toast=function(){};confirm=function(){return true;};S.fiches={};for(const k in __docs)if(k.startsWith('fiches/'))S.fiches[k.slice(7)]=JSON.parse(JSON.stringify(__docs[k]));S.fichesReady=true;S.ptr={};`);
r(`globalThis.__db={};DB={doc:p=>({set:d=>{__db[p]=JSON.parse(JSON.stringify(d));return Promise.resolve();}}),img:{set:(k,d)=>{__db['img/'+k]=d.length;return Promise.resolve();},get:k=>Promise.resolve(null)}};`);
r(`ME='christophe-zzvy';S.edit=true;S.visit=false;S.view='params';S.ptab='donnees';`);
const plan=(F,nom)=>{app.ctx.__F=F;r(`S.kk={step:'apercu',F:__F,mode:'maj',nomF:${JSON.stringify(nom)}};kkPlan();`);return {nw:r(`S.kk.plan.filter(x=>x.act==='new').length`),mj:r(`S.kk.plan.filter(x=>x.act==='maj').length`)};};
const nF=g=>r(`Object.values(S.fiches).filter(f=>f.genre===${JSON.stringify(g)}).length`);

console.log('1. Carte');
{const h=r(`kkCard()`);ok(['Lieux','PNJ','Objets','Créatures','Événements','Journaux et quêtes'].every(t=>h.includes(t)),'carte : ordre conseillé avec les 6 genres');}

console.log('2. Objets');
{const o0=nF('objet'),p=plan(OF,'import-objets.json');ok(p.nw===46&&p.mj===0,'aperçu : 46 objets à créer');
  ok(/Importer 46 objets/.test(r(`kkView()`)),'bouton « Importer 46 objets »');
  await r(`kkRun()`);ok(nF('objet')===o0+46&&r(`S.kk.rep.imgOk`)===46,'46 objets créés, 46 images');
  const col=r(`Object.values(S.fiches).find(f=>f.genre==='objet'&&/^Collection priv/.test(f.nom)).id`);
  ok(r(`fiAll().filter(f=>f.parent===${JSON.stringify(col)}).length`)===5,'collection : 5 objets contenus');
  ok(r(`Object.values(S.fiches).filter(f=>f.genre==='objet'&&(f.det||[]).some(x=>x.id==='kerian')).length`)===5,'Kerian détenteur de 5 objets');
  ok(r(`Object.values(S.fiches).filter(f=>f.genre==='objet'&&f.uniq).length`)===12,'12 objets uniques');
  ok(r(`(()=>{const f=Object.values(S.fiches).find(f=>f.nom==='Démasqueur');return /photographie simultanément/.test(f.effet)&&!/Effet\\s*:/.test(f.desc)&&f.crea&&!!S.chars[f.crea.id];})()`),'Démasqueur : Effet à part, créateur relié');
  ok(r(`(()=>{const f=Object.values(S.fiches).find(f=>f.nom==='Fresque');return !!f.lieu&&!!S.fiches[f.lieu.f]&&fi6Blocks(S.fiches[f.lieu.f]).includes('Fresque');})()`),'Fresque : emplacement Tour Fréhel, visible sur le lieu');
  plan(OF,'import-objets.json');ok(r(`S.kk.plan.every(x=>x.act==='same')`),'relance : rien à refaire (pas de doublon)');}

console.log('3. Créatures et spécimens');
{const b0=nF('bete'),p=plan(CF,'import-creatures.json');ok(p.nw===10,'aperçu : 10 créatures à créer');
  await r(`kkRun()`);ok(nF('bete')===b0+10,'10 créatures créées');
  const gid=r(`Object.values(S.fiches).find(f=>f.genre==='bete'&&f.nom==='Griffon').id`);app.ctx.__g=gid;
  ok(r(`(S.fiches[__g].spec||[]).length===1&&S.fiches[__g].spec[0].nom==='Briseciel'&&!!S.ptr[illId('spec',S.fiches[__g].spec[0].id)]`),'Griffon : spécimen Briseciel avec image');
  ok(!r(`Object.values(S.fiches).some(f=>f.nom==='Briseciel')`),'pas de fiche Briseciel');
  ok(r(`Object.values(S.fiches).find(f=>f.nom==='Animaux mythiques').type`)==='Groupe','« Animaux mythiques » : type Groupe');
  ok(/Habitat : @\[fiche:/.test(r(`Object.values(S.fiches).find(f=>f.nom==='Vouivre').desc`)),'Vouivre : ligne Habitat reliée');
  r(`S.view='univers';S.uni='bete';S.fi=__g;`);
  ok(/Spécimens connus/.test(r(`fiFicheView(S.fiches[__g])`))&&/Briseciel/.test(r(`fiFicheView(S.fiches[__g])`)),'fiche Griffon : bloc Spécimens connus');
  ok(/Spécimens connus/.test(r(`fiMentionsHtml(fiMentions('perso','kk8461357'))`)),'Mentions de Muirenn : Spécimens connus');
  /* gestion : œil, ajout */
  const sid=r(`S.fiches[__g].spec[0].id`);app.ctx.__s=sid;
  r(`fiAct('fiEye',{k:'spec',i:__s})`);ok(r(`S.fiches[__g].spec[0].rev`)===false,'gestion en mode édition : œil du spécimen refermé');
  r(`ME='anne';S.edit=false;`);ok(!/Briseciel/.test(r(`fiFicheView(S.fiches[__g])`)),'joueur : spécimen préparé invisible');
  r(`fiAct('fiSpec',{i:''});S.dlg.nom='Plume-d\\'or';S.dlg.txt='Vu à @[fiche:f-kk8367987|Avalon]';fiAct('fiSpecSave',{});`);
  ok(r(`S.fiches[__g].spec.some(x=>x.nom==="Plume-d'or"&&x.rev)`),'joueur : ajoute un spécimen, visible de toute la table');
  ok(/Plume-d'or|Plume-d&#39;or/.test(r(`fiFicheView(S.fiches[__g])`)),'joueur : le voit sur la fiche');
  r(`fiAct('fiSpec',{i:S.fiches[__g].spec.find(x=>x.rev).id});fiAct('fiSpecDel',{});fiAct('fiSpecDelOk',{});`);
  ok(r(`S.fiches[__g].spec.length`)===1,'retrait d\'un spécimen');
  r(`ME='christophe-zzvy';S.edit=true;fiAct('fiEye',{k:'spec',i:__s});`);}

console.log('4. Événements');
{const e0=nF('evenement'),p=plan(EF,'import-evenements.json');ok(p.nw===3&&p.mj===34,'aperçu : 3 à créer (Vie du fief), 34 à mettre à jour');
  const id19=r(`Object.values(S.fiches).find(f=>f.genre==='evenement'&&/019/.test(f.num)).id`),d19=r(`S.fiches[${JSON.stringify(id19)}].desc`);
  const id01=r(`Object.values(S.fiches).find(f=>f.genre==='evenement'&&f.type==='Scénario'&&/^0?1\\b/.test(f.num.replace(/\\D+$/,''))).id`);app.ctx.__e1=id01;
  const pj01=r(`JSON.stringify(S.fiches[__e1].pj)`),deb01=r(`JSON.stringify(S.fiches[__e1].debut)`);
  await r(`kkRun()`);ok(nF('evenement')===e0+3,'3 événements Vie du fief créés');
  ok(r(`Object.values(S.fiches).filter(f=>f.genre==='evenement'&&f.type==='Vie du fief').every(f=>JSON.stringify(f.pj)==='["kerian","sloan"]'&&f.debut&&f.debut.a===1900)`),'Vie du fief : Kerian et Sloan, date reprise');
  ok(r(`S.fiches[${JSON.stringify(id19)}].desc`)===d19,'[019] : résumé de l\'appli gardé');
  ok(/@\[/.test(r(`S.fiches[__e1].desc`))&&r(`JSON.stringify(S.fiches[__e1].pj)`)===pj01&&r(`JSON.stringify(S.fiches[__e1].debut)`)===deb01,'01 : résumé avec liens, PJ et dates gardés');
  ok(r(`Object.values(S.fiches).filter(f=>f.genre==='evenement'&&(f.lieux||'').includes('@[')).length`)>=25,'lieux reliés sur les événements');
  r(`S.view='univers';S.uni='evenement';S.fi=__e1;`);ok(/fithumb/.test(r(`chEvView(S.fiches[__e1])`))&&/kanka/i.test(r(`chEvView(S.fiches[__e1])`)),'fiche Événement : image et lien Kanka');
  plan(EF,'import-evenements.json');ok(r(`S.kk.plan.every(x=>x.act==='same')`),'relance : rien à refaire');}

console.log('5. Journaux et quêtes');
{const j0=r(`Object.keys(S.jour).length`),n0=r(`S.jour['j-5kplcwivox'].ent.length`),p=plan(JF,'import-journaux.json');
  ok(p.nw===21&&p.mj===1,'aperçu : 21 à créer, 1 à compléter (Discussion de bal de Kerian)');
  await r(`kkRun()`);ok(r(`Object.keys(S.jour).length`)===j0+21,'21 journaux et quêtes créés');
  ok(r(`S.jour['j-5kplcwivox'].ent.length`)===n0+1&&r(`S.jour['j-5kplcwivox'].ent.some(e=>/Rapha/.test(e.nom)&&/R[ée]ponse/.test(e.nom))`)&&r(`S.jour['j-5kplcwivox'].nom`)==='Discussion de bal','Discussion de bal : une seule entrée ajoutée, nom gardé');
  ok(r(`Object.values(S.jour).filter(j=>j.genre==='quete'&&j.perso==='kerian'&&j.statut==='cours').length`)>=3,'3 quêtes de Kerian en cours');
  ok(r(`Object.values(S.jour).filter(j=>/^j-kk/.test(j.id)).every(j=>j.pub===true)`),'lecture : toute la table');
  r(`ME='anne';S.edit=false;`);ok(r(`jrAll().filter(j=>jrCanRead(j)&&j.perso==='kerian').length`)>=7,'autre joueur : lit les journaux de Kerian');
  r(`ME='christophe-zzvy';S.edit=true;`);
  plan(JF,'import-journaux.json');ok(r(`S.kk.plan.every(x=>x.act==='same')`),'relance : rien à refaire');}

console.log('6. Compte rendu');
{const R=r(`JSON.stringify(Object.keys(S.kkImp||{}))`);ok(['objet','bete','evenement','journal'].every(g=>R.includes(g)),'compte rendu par genre');
  r(`S.kk={step:'rep',rep:S.kkImp.journal};`);ok(/Voir les journaux/.test(r(`kkView()`)),'compte rendu journaux : « Voir les journaux de … »');}

console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
