/* La belle appli — démarrage et écoute des données partagées */
/* --- données partagées --- */
function start(){
  render();
  const timer=setTimeout(()=>{if(!S.ready&&!S.gate){setSync('err','Données injoignables pour l\'instant');}},10000);
  getDb().then(db=>{
    if(!db){setSync('local');S.ready=true;render();return;}
    DB=db;
    db.collection('chars').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const m={};snap.docs.forEach(d=>{const x=d.data();if(x)m[d.id]=normNoms(x);});
      S.chars=m;S.ready=true;clearTimeout(timer);if(!snap.metadata.fromCache)setSync('ok');render();
      fixTypKerian();resetSA();renameVM();fixRef();fixHumain();
    },e=>{setSync('err','Lecture impossible');});
    db.collection('players').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const m={};snap.docs.forEach(d=>{const x=d.data();if(x)m[d.id]=x;});
      S.players=m;render();fixGestion();
    },()=>{});
    db.doc('meta/heritage').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const x=snap.data();S.heritage={score:x&&x.score!=null?x.score:'',delta:(x&&x.delta)||0};render();
    },()=>{});
    db.doc('meta/secrets').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const x=snap.data();
      if(x&&Array.isArray(x.list)&&x.list.length){S.secrets=x.list;S.secretsFix1=!!x.fix1;}
      else{S.secrets=clone(SECRETS_SEED);S.secretsFix1=true;persist('meta/secrets',{list:S.secrets,fix1:true});}
      S.secretsReady=true;fixOnce();render();
    },()=>{});
    db.doc('meta/planning').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const x=snap.data();S.dates=(x&&Array.isArray(x.dates))?x.dates:[];S.datesReady=true;render();
    },()=>{});
    db.doc('meta/pouvoirs').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const x=snap.data();if(x&&x.byId)S.pouvoirs=x.byId;else{S.pouvoirs=clone(POUVOIRS_SEED);persist('meta/pouvoirs',{byId:S.pouvoirs});}
      S.pouvoirsReady=true;render();fixRaceDoc();
    },()=>{});
    db.doc('meta/creatures').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const x=snap.data();
      if(x&&Array.isArray(x.list))S.creatures=x.list;
      else{S.creatures=clone(CREATURES_SEED);persist('meta/creatures',{list:S.creatures});}
      S.creaturesReady=true;rebuildRaces();render();fixRaceDoc();
    },()=>{});
    db.doc('meta/races').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const x=snap.data();
      let ch=false;if(x&&x.byId)S.races=x.byId;else{S.races=clone(RACE_SEED);ch=true;}
      if(!S.races[HUM_ID]){S.races={...S.races,[HUM_ID]:clone(HUM_SEED)};ch=true;}
      for(const k in SP_SEED){const r=S.races[k];if(r&&r.sp===undefined){S.races={...S.races,[k]:{...r,...clone(SP_SEED[k])}};ch=true;}}
      if(ch)persist('meta/races',{byId:S.races});
      S.racesReady=true;rebuildRaces();render();fixRaceDoc();
    },()=>{});
    db.doc('meta/portraits').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const x=snap.data(),v=x&&x.v||0;if(S.ptrV===v&&S.ptr)return;S.ptrV=v;
      db.portraits().then(rows=>{const m={};for(const r of rows||[])if(r&&r.data&&r.data.img)m[r.id]=r.data.img;S.ptr=m;render();}).catch(()=>{});
    },()=>{});
    db.doc('gains/all').onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      const x=snap.data();S.events=(x&&x.events)||[];S.eventsReady=true;fixOnce();render();
    },()=>{});
  }).catch(()=>{setSync('local');S.ready=true;render();});
}
rebuildRaces();
start();
