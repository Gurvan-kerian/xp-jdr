/* La belle appli — démarrage et écoute des données partagées
   Aucune donnée de jeu n'est créée ici : le code lit ce qui est dans Supabase.
   La version des données (meta/schema) est contrôlée une fois tout chargé (schemaCheck). */
function afterLoad(){schemaCheck();if(modelV1()&&!writesLocked())fxSyncAll();rebuildRaces();render();}
function start(){
  render();
  const timer=setTimeout(()=>{if(!S.ready&&!S.gate){setSync('err','Données injoignables pour l\'instant');}},10000);
  getDb().then(db=>{
    if(!db){setSync('local');S.ready=true;render();return;}
    DB=db;
    const on=(path,f)=>db.doc(path).onSnapshot(snap=>{if(snap.metadata.hasPendingWrites)return;f(snap.data());afterLoad();},()=>{});
    db.collection('chars').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const m={};snap.docs.forEach(d=>{const x=d.data();if(x)m[d.id]=normNoms(x);});
      S.chars=m;S.ready=true;clearTimeout(timer);if(!snap.metadata.fromCache)setSync('ok');afterLoad();
    },e=>{setSync('err','Lecture impossible');});
    db.collection('players').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const m={};snap.docs.forEach(d=>{const x=d.data();if(x)m[d.id]=x;});
      S.players=m;S.playersReady=true;afterLoad();idInit();
    },()=>{});
    on('meta/schema',x=>{S.schema=x||null;S.schemaReady=true;});
    on('meta/heritage',x=>{S.heritage={score:x&&x.score!=null?x.score:'',delta:(x&&x.delta)||0};});
    on('meta/secrets',x=>{S.secretsDoc=x||null;S.secrets=(x&&Array.isArray(x.list))?x.list:[];S.secretProps=(x&&x.props)||[];S.secretsReady=true;});
    on('meta/planning',x=>{S.dates=(x&&Array.isArray(x.dates))?x.dates:[];S.datesReady=true;});
    on('meta/params',x=>{S.params=x&&x.versions?x:{versions:[]};S.paramsReady=true;applyParams();});
    on('meta/pouvoirs',x=>{S.pouvoirs=(x&&x.byId)||{};S.pouvoirsReady=true;});
    on('meta/capacites',x=>{S.capacites=(x&&x.byId)||{};S.capReady=true;});
    on('meta/signalements',x=>{S.signalDoc=x||null;});
    on('meta/creatures',x=>{S.creatures=(x&&Array.isArray(x.list))?x.list:[];S.creaturesReady=true;});
    on('meta/profils',x=>{S.profils=x&&x.byId?x:null;S.profilsReady=true;applyProfils();});
    on('meta/races',x=>{S.races=(x&&x.byId)||{};S.racesReady=true;});
    db.doc('meta/portraits').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const x=snap.data(),v=x&&x.v||0;if(S.ptrV===v&&S.ptr)return;S.ptrV=v;
      db.portraits().then(rows=>{const m={};for(const r of rows||[])if(r&&r.data&&r.data.img)m[r.id]=r.data.img;S.ptr=m;render();}).catch(()=>{});
    },()=>{});
    db.collection('journaux').onSnapshot(snap=>{if(snap.metadata.hasPendingWrites)return;const m={};snap.docs.forEach(d=>{const x=d.data();if(x)m[d.id]=x;});S.jour=m;S.jourReady=true;afterLoad();},()=>{}); /* lot 2 : une ligne par journal ou quête */
    on('meta/relations',x=>{S.relp=x||{};});
    db.collection('fiches').onSnapshot(snap=>{if(snap.metadata.hasPendingWrites)return;const m={};snap.docs.forEach(d=>{const x=d.data();if(x)m[d.id]=x;});S.fiches=m;S.fichesReady=true;render();},()=>{}); /* lot 1 */
    on('gains/all',x=>{S.events=(x&&x.events)||[];S.eventsReady=true;});
  }).catch(()=>{setSync('local');S.ready=true;render();});
}
rebuildRaces();
start();
