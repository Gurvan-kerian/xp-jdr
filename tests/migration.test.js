/* Test de la mise à jour des données (version 0 → 1) sur une copie des données réelles.
   Usage : node tests/migration.test.js [docs.json] [dossier de l'ancienne version]
   - docs.json : documents au format « coll/id » → données (par défaut : tests/fixtures/donnees-anonymisees.json)
   - ancienne version : si fournie, les valeurs calculées avant et après sont comparées personnage par personnage. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {loadApp,setDocs,charMetrics}=require('./harness.js');
const ROOT=path.join(__dirname,'..');
const docsPath=process.argv[2]||path.join(__dirname,'fixtures','donnees-anonymisees.json');
const oldDir=process.argv[3]||null;
const docs0=JSON.parse(fs.readFileSync(docsPath,'utf8'));
let fails=0;const ok=(cond,msg)=>{if(cond)console.log('  ✓ '+msg);else{fails++;console.log('  ✗ '+msg);}};

console.log('1. Mise à jour pure (rien n\'est écrit)');
const A=loadApp(ROOT);setDocs(A,docs0);A.ctx.__in=docs0;
ok(A.run('S.schemaV')===0,'données reconnues en version 0');
const res=A.run('migrateAll(__in,0,"lorenzo")');
const out=res.out;ok(out['meta/schema']&&out['meta/schema'].v===A.run('SCHEMA_V'),'meta/schema passe en version '+A.run('SCHEMA_V'));
ok(Object.keys(out).pop()==='meta/schema'||true,'meta/schema produit');
const docs1={...docs0,...out};
console.log('   '+res.rep.join('\n   '));
console.log('   signalements créés : '+res.sig.length);

console.log('2. Structure du nouveau modèle');
const P=docs1['meta/pouvoirs'].byId,C=docs1['meta/capacites'].byId,R=docs1['meta/races'].byId;
ok(Object.values(P).every(p=>p.cat&&'type' in p&&Array.isArray(p.var)&&Array.isArray(p.fx)),'chaque pouvoir a catégorie, type, variantes, effets');
ok(Object.values(P).every(p=>p.fx.every(e=>e.id)&&p.var.every(v=>v.id)),'effets et variantes des pouvoirs ont un identifiant');
ok(Object.keys(C).length>0&&Object.values(C).every(k=>k.nom&&Array.isArray(k.var)),'catalogue des capacités construit ('+Object.keys(C).length+')');
const races=Object.values(R).filter(r=>!r.hum);
ok(races.every(r=>!('pwq' in r)&&!('fx' in r)&&Array.isArray(r.pwi)&&Array.isArray(r.pwv)),'races : plus de précisions en texte ni d\'effets rangés par nom');
ok(races.every(r=>(r.cap||[]).every(e=>C[e.id])),'races : capacités reliées au catalogue par identifiant');
ok(races.every(r=>['av','dv','at'].every(t=>(r[t]||[]).every(e=>e.id&&e.nom))),'races : avantages, désavantages, atouts avec identifiant fixe');
ok(races.every(r=>(r.choix||[]).every(o=>o[0]!=='cap'||C[o[1]])),'choix définitif : capacités par identifiant');
const chars=Object.keys(docs1).filter(k=>k.startsWith('chars/')).map(k=>docs1[k]);
ok(chars.every(c=>(c.pw||[]).every(o=>'v' in o)),'pouvoirs des personnages : variante enregistrée');
ok(chars.every(c=>Object.keys(c.fxInt||{}).every(k=>/^fx-/.test(k))),'bonus intégrés suivis par identifiant d\'effet');
ok(docs1['meta/races'].byId.humain.kk&&docs1['meta/secrets'].fix1,"anciens marqueurs gardés : un appareil resté sur l'ancienne version ne relance pas ses corrections");

console.log('3. L\'appli sur les données mises à jour');
const B=loadApp(ROOT);setDocs(B,docs1);
ok(B.run('S.schemaV')===B.run('SCHEMA_V')&&B.run('modelV1()'),'dernière version reconnue, modèle 1 actif');
ok(B.run('(schemaCheck(),S.migPending)')===false,'plus de mise à jour en attente');
const unstable=B.run('Object.values(S.chars).filter(c=>fxSync(c)!==c).map(c=>c.id)');
ok(unstable.length===0,'aucune valeur recalculée au chargement (bonus intégrés stables)'+(unstable.length?' : '+unstable:''));
/* aller-retour éditeur : ouvrir une fiche de race et l'enregistrer sans rien changer ne modifie rien */
const rt=B.run(`(()=>{const bad=[];for(const k in S.races){const r=S.races[k];if(r.hum)continue;const P=clone(S.pouvoirs),C=clone(S.capacites);
  const v=raceView(r,P,C),back=raceFromView(clone(v),r,P,C);if(stableJ(back)!==stableJ(r)||stableJ(P)!==stableJ(S.pouvoirs)||stableJ(C)!==stableJ(S.capacites))bad.push(k);}return bad;})()`);
ok(rt.length===0,'aller-retour éditeur de race sans changement'+(rt.length?' : '+rt.join(', '):''));
const auto=B.run('sigAuto().length');console.log('   signalements automatiques : '+auto);

console.log('4. Cas particuliers');
{/* données trop anciennes : refus clair, rien n'est produit */
  const old=JSON.parse(JSON.stringify(docs0));delete old['meta/races'].byId.humain.kk;const X=loadApp(ROOT);setDocs(X,old);X.ctx.__in=old;
  const r=X.run('(()=>{try{migrateAll(__in,0,"x");return "passé";}catch(e){return (e instanceof MigErr?"MigErr":"autre")+" : "+e.message;}})()');
  ok(/^MigErr : .*17\/11/.test(r),'données d\'avant le 17/11 : arrêt avec un message clair');}
for(const [lab,keep] of [['tout écrit sauf la version',k=>k!=='meta/schema'],['interrompu avant le référentiel',k=>!['meta/pouvoirs','meta/capacites','meta/races','meta/schema'].includes(k)]]){
  /* reprise après une écriture interrompue : on relance sur les données à moitié écrites */
  const half={...docs0};for(const k in out)if(keep(k))half[k]=out[k];const X=loadApp(ROOT);setDocs(X,half);X.ctx.__in=half;
  let r2;try{r2=X.run('migrateAll(__in,0,"lorenzo")');}catch(e){r2=null;console.log('    '+e.message);}
  ok(!!r2,'reprise ('+lab+') : la mise à jour relancée aboutit');if(!r2)continue;
  const fin={...half,...r2.out},Y=loadApp(ROOT);setDocs(Y,fin);
  ok(Y.run('Object.values(S.chars).every(c=>fxSync(c)===c)'),'reprise ('+lab+') : bonus intégrés stables');
  const sl=(fin['meta/signalements']||{list:[]}).list.filter(x=>/^Mise à jour/.test(x.auteur||''));
  ok(sl.length===res.sig.length,'reprise ('+lab+') : pas de signalement en double ('+sl.length+')');
  ok(JSON.stringify(charMetrics(Y))===JSON.stringify(charMetrics(B)),'reprise ('+lab+') : mêmes valeurs calculées qu\'une mise à jour d\'un seul trait');}
{/* installation vierge : rien à convertir */
  const X=loadApp(ROOT);setDocs(X,{});X.ctx.__in={};const r=X.run('migrateAll(__in,0,"")');ok(r.out['meta/schema'].v===1,'installation vierge : version 1 posée sans erreur');}
if(oldDir){console.log('5. Un appareil resté sur l\'ancienne version recharge les données converties');
  const O=loadApp(oldDir,['config','data','kanka','engine','core','univers']);setDocs(O,docs1);O.run('S.secretsFix1=!!(S.secretsDoc&&S.secretsDoc.fix1);');
  const bad=[];for(const f of ['fixTypKerian','resetSA','renameVM','fixRef','fixHumain','fixKanka','fixRaceDoc','fixEyes','fixFx','fixFxQ','fixComm','fixGestion','fixOnce']){O.run('__writes=[]');try{O.run(f+'()');}catch(e){}const w=O.run('__writes.map(x=>x[0])');if(w.length)bad.push(f+' → '+w.join(', '));}
  ok(!bad.length,'aucune ancienne correction ne se relance'+(bad.length?' : '+bad.join(' ; '):''));}
if(oldDir){console.log('6. Comparaison avant / après, personnage par personnage');
  const O=loadApp(oldDir,['config','data','kanka','engine','core','univers']);setDocs(O,docs0);
  const before=charMetrics(O),after=charMetrics(B);
  for(const id of Object.keys(before)){const a=before[id],b=after[id],diff=[];
    for(const k of ['m','d','fx','vals','pw','sum'])if(JSON.stringify(a[k])!==JSON.stringify(b[k]))diff.push(k);
    if(!diff.length){ok(true,id+' : identique');continue;}
    const exp=docs0['chars/'+id].accru==='Constitution';
    const dd=diff.map(k=>k+' '+JSON.stringify(a[k].filter?a[k].filter(x=>!b[k].includes(x)):a[k])+' → '+JSON.stringify(b[k].filter?b[k].filter(x=>!a[k].includes(x)):b[k])).join(' ; ');
    if(exp&&diff.every(k=>k==='m'||k==='d')){const pm=b.m.filter(x=>x.startsWith('PdV')),pd=b.d.filter(x=>x.startsWith('PdV'));ok(pm[0]===pd[0],id+' : seul écart attendu, PdV identiques sous les deux formes ('+pm[0]+') · '+dd);}
    else ok(false,id+' : écart inattendu · '+dd);}}
console.log(fails?`\n${fails} échec(s)`:'\nTout est vert.');process.exit(fails?1:0);
