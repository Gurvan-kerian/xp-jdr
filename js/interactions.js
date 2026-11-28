/* La belle appli — interactions (clics, saisies) */
/* --- interactions --- */
function ptrClamp(g){const s2=g.base*g.z;g.x=Math.min(20,Math.max(240-g.w*s2,g.x));g.y=Math.min(20,Math.max(240-g.h*s2,g.y));}
function ptrPaint(){const g=S.dlg,im=document.getElementById('ptrImg');if(!g||!im)return;const s2=g.base*g.z;im.style.left=g.x+'px';im.style.top=g.y+'px';im.style.width=g.w*s2+'px';im.style.height=g.h*s2+'px';}
(function(){let drag=null;
  document.addEventListener('pointerdown',ev=>{const st=ev.target.closest&&ev.target.closest('#ptrStage');if(!st||!S.dlg||S.dlg.kind!=='ptr')return;drag={x:ev.clientX,y:ev.clientY,gx:S.dlg.x,gy:S.dlg.y};st.setPointerCapture&&st.setPointerCapture(ev.pointerId);ev.preventDefault();});
  document.addEventListener('pointermove',ev=>{if(!drag||!S.dlg||S.dlg.kind!=='ptr')return;S.dlg.x=drag.gx+ev.clientX-drag.x;S.dlg.y=drag.gy+ev.clientY-drag.y;ptrClamp(S.dlg);ptrPaint();});
  document.addEventListener('pointerup',()=>{drag=null;});document.addEventListener('pointercancel',()=>{drag=null;});})();
function setCache(c,v){const n=clone(c);n.cache=v;S.chars[n.id]=n;persist('chars/'+n.id,n);}
document.addEventListener('click',ev=>{
  if(S.gate)return;
  const t=ev.target.closest('[data-act]');if(!t)return;
  let a=t.dataset.act;const d=t.dataset;S._force=true;
  if((a==='rfUnkKeep'||a==='rfUnkReveal')&&S.rf&&S.rf.unkAsk){if(a==='rfUnkKeep')for(const i of S.rf.unkAsk)S.rf.pw[i][1]=true;S.rf.unkOk=true;delete S.rf.unkAsk;a='rfSave';}
  else if(a==='rfUnkCancel'&&S.rf){delete S.rf.unkAsk;render();return;}
  if(rfLeaveAsk(a,d,ev))return;
  if(fiAct(a,d))return; /* lot 1 : fiches de l'Univers */
  if(cwAct(a,d))return; /* lot C : assistant de création */
  if(shCharAct(a,d))return; /* fiche de personnage : Relations, Situation, Journaux */ /* lot 4 bis : éditeur de race avec changements non enregistrés */
  if(S.rfEd&&S.rf&&/^rf/.test(a)&&!/^(rfSave|rfEdOn|rfEdOff|rfBack|rfOpen|rfTab|rfHum|rfNew|rfUnkCancel|rfFold|rfEdBlk|rfPorSave|rfPorCancel)$/.test(a))S.edDirty=true;
  if(socleAct(a,d,t)){render();return;}
  if(lnkAct(a,d))return; /* lot 4 bis : liens, retour, mode édition */
  if(a==='planHelp'){S.planHelp=!S.planHelp;render();return;}
  const cur=()=>S.chars[S.sheet&&S.sheet.id];
  if(/^(rfSave|rfDel|rfDelOk|rfHumSave|rfNew|rfPredAdd|rfPredDel|rfAtAdd|rfAtDel|rfSpAdd|rfSpDel|rf2Add|rf2Del|rfChAdd|rfChDel|rfPwUnk|rfFxNew|rfFxDel|rfFxT|rfFxQ|rfFxAdd|rfFxCancel|rfPwOpen|rfNomP)$/.test(a)&&!canRaceEd(S.rf&&S.rf.id))return; /* correctif UX3 : joueurs sur une race entièrement révélée */ /* Référentiel : modification réservée à la gestion */
  if(S.visit&&!VISIT_OK.has(a))return; /* visiteur : lecture seule */
  const toUni=a==='tab'&&d.v==='univers';
  if(a==='tab'&&d.v==='ref'){d.v='univers';S.uni='creatures';}
  if(a==='tab'&&d.v==='players')pinRefresh();
  if(a==='tab'){ev.preventDefault();navClear();if(d.v==='gains'){S.xpSess=null;S.xpDel=null;}if(d.v==='planning')S.plDate=null;S.rfEd=false;S.rfBlk=null;S.rfPor=null;if(d.v==='univers')S.sec=null;if(toUni){S.uni='home';S.fi=null;}if(d.v==='ref')S.rf=null;if(d.pv)S.plan.view=d.pv;S.view=d.v;S.sheet=null;S.asheet=null;S.dlg=null;S.confirm=null;window.scrollTo(0,0);}
  else if(a==='sel'){S.sel=d.id;S.shPick=false;S.nameForm={kind:null,nom:''};S.view='sheet';S.sheet=null;S.futForm.open=false;window.scrollTo(0,0);}
  else if(a==='open'){const c=S.chars[S.sel],r=ref(c,d.key);const cu=r.o.cur||0;const pl=(c.plan||{})[d.key];S.sheet={id:c.id,key:d.key,to:pl&&pl>cu?pl:cu+1,fix:false,fixCur:cu,fixMax:r.max,sp:{}};}
  else if(a==='closeSheet'&&S.dlg&&S.dlg.nav){navBack();return;}
  else if(a==='closeSheet'&&S.dlg&&S.dlg.kind==='elEdit'&&S.dlg.back){S.dlg=S.dlg.back;}
  else if(a==='closeSheet'&&S.dlg&&S.dlg.kind==='ptr'&&S.dlg.back){S.dlg=S.dlg.back;window._ptrImg=null;}
  else if(a==='closeSheet'){S.sheet=null;S.asheet=null;S.dlg=null;if(S.id.state==='ok')S.pinF=null;}
  else if(a==='menu'){S.dlg={kind:'menu'};}
  else if(a==='xpOpen'){S.xpSess=d.id;S.xpDel=null;S.curSess=d.id;window.scrollTo(0,0);}
  else if(a==='xpClose'){S.xpSess=null;S.xpDel=null;}
  else if(a==='xpDet'){S.xpDet=S.xpDet||{};S.xpDet[d.id]=!S.xpDet[d.id];}
  else if(a==='xpHelp'){S.xpHelp=S.xpHelp||{};S.xpHelp[d.k]=!S.xpHelp[d.k];}
  else if(a==='xpFo'){S.xpFo=!S.xpFo;}
  else if(a==='xpFt'){const F=S.xpF||(S.xpF={t:[],p:''});F.t=F.t.includes(d.v)?F.t.filter(x=>x!==d.v):[...F.t,d.v];}
  else if(a==='xpFp'){const F=S.xpF||(S.xpF={t:[],p:''});F.p=d.v||'';}
  else if(a==='xpDelAsk'){S.xpDel=d.id;S.xpDelEv=true;}
  else if(a==='xpDelNo'){S.xpDel=null;}
  else if(a==='xpDelOk'){const e=sessById(d.id);if(!e||!isUser())return;if(sessChildren(e.id).filter(k=>!(k.secret&&k.secret.k==='bonus')).length)return;
    const f=e.evt&&S.fiches[e.evt],alone=f&&!sessList().some(x=>x.evt===f.id&&x.id!==e.id);S.xpDel=null;S.xpSess=null;if(S.curSess===e.id)S.curSess=null;
    if(alone&&S.xpDelEv)fiRemove(f.id);saveEvents(S.events.filter(x=>x.id!==e.id));return;}
  else if(a==='xpAddOpen'){S.curSess=d.id;S.form={titre:'',type:'Scénario',date:today(),lines:[{nature:'Scénario',montant:'',persos:null}]};S.dlg={kind:'xpAdd',sid:d.id};}
  else if(a==='xpEvGo'){S.xpSess=null;navGo({t:'fiche',id:d.id});}
  else if(a==='themeToggle'){const tb=document.getElementById('themeBtn');if(tb)tb.click();}
  else if(a==='pushOn'){pushEnable();return;}
  else if(a==='pushOff'){pushDisable();return;}
  else if(a==='setMe'){const old=ME;ME=d.id;try{localStorage.setItem('xp.me',ME);}catch(e){}S.dlg=null;S._force=true;
    if(S.pushSub&&old!==ME){const js=S.pushSub.toJSON(),ep=js.endpoint;for(const pp of Object.values(S.players)){if(pp.id!==ME&&(pp.push||[]).some(x=>x.endpoint===ep)){const n=clone(pp);n.push=n.push.filter(x=>x.endpoint!==ep);savePlayer(n);}}
      const me=S.players[ME];if(me&&!(me.push||[]).some(x=>x.endpoint===ep)){const n=clone(me);n.push=[...(n.push||[]),{endpoint:ep,keys:js.keys}];savePlayer(n);}}}
  else if(a==='pTab'){S.pTab=d.v;}
  else if(/^fxc/.test(a)){if(!canEdit()&&!(S.rf&&canRaceEd(S.rf.id))&&!(S.dlg&&S.dlg.kind==='elEdit'&&canElEd(S.dlg.k,S.dlg.id||'')))return;fxcAct(a,d);}
  else if(EL_ACTS.has(a)){if(!canEdit()&&a!=='elFilt'&&!(refUser()&&(a!=='elEdit'||canElEd(d.k,d.id||''))&&!(a==='elDelOk'&&S.dlg&&S.dlg.id&&elUses(S.dlg.k,S.dlg.id).some(u=>!elUseSeen(S.dlg.k,u)))))return;if(elAct(a,d)===false)return;}
  else if(a==='pwToggle'){S.pwOpen={...(S.pwOpen||{}),[d.id]:!(S.pwOpen||{})[d.id]};}
  else if(a==='pwPick'){if(!canEditC(S.chars[d.id]))return;S.dlg={kind:'pwPick',id:d.id,i:+d.i};}
  else if(a==='pwPickOk'){pwPickOk();return;}
  else if(a==='pwRemove'){if(!canEdit())return;S.confirm='pwr:'+d.id+':'+d.i;}
  else if(a==='pwRemoveOk'){if(!canEdit())return;const c=clone(S.chars[d.id]);c.pw=(c.pw||[]).filter(o=>o.i!==+d.i);S.confirm=null;saveChar(c);return;}
  else if(a==='rfPwOpen'){const i=+d.i;S.rf.pwOpen=S.rf.pwOpen===i?null:i;S.rf.pwx=S.rf.pwx||{};if(S.rf.pwOpen!=null&&!S.rf.pwx[i]){const id=pwIdByName(S.rf.pw[i][0]||'');const p=id?pwCat(id):{};S.rf.pwx[i]={desc:p.desc||'',fx:clone(p.fx||[]),fxEd:null,dirty:false};}}
  else if(a==='plOpen'){S.confirm=null;S.dlg={kind:'pl',id:d.pid};pinRefresh();}
  else if(a==='pcOpen'){S.dlg={kind:'pc',id:d.id,sh:!!d.sh};}
  else if(a==='shPick'){S.shPick=!S.shPick;}
  else if(a==='xpdOpen'){S.dlg={kind:'xpd',id:d.id};}
  else if(a==='xpdHist'){S.dlg=null;S.sel=d.id;S.shTab='prog';S.shFold={...(S.shFold||{}),'pg-hist':false};setTimeout(()=>{const e=document.getElementById('pg-hist');if(e)e.scrollIntoView({block:'start'});},60);}
  else if(a==='fgRo'){S.fgRo={...(S.fgRo||{}),[d.rid]:!(S.fgRo||{})[d.rid]};}
  else if(a==='pwF'){S.pwF={...(S.pwF||{}),[d.k]:!(S.pwF||{})[d.k]};}
  else if(a==='rkOpen'){S.rkOpen={...(S.rkOpen||{}),[d.k]:!(S.rkOpen||{})[d.k]};}
  else if(a==='pnjXpOpen'){S.dlg={kind:'pnjXp'};}
  else if(a==='pcSheetGo'){S.dlg=null;S.view='sheet';S.sel=d.id;window.scrollTo(0,0);}
  else if(a==='newPOpen'){if(!isGest())return;S.dlg={kind:'newp'};}
  else if(a==='ownNo'){if(S.dlg)delete S.dlg.own;}
  else if(a==='ownOk'){const g=S.dlg,c=S.chars[g.id];if(!c||!canEditC(c))return;const np=g.own;delete g.own;
    for(const p of Object.values(S.players)){const has=(p.persos||[]).includes(c.id);if(has&&p.id!==np){const n=clone(p);n.persos=n.persos.filter(x=>x!==c.id);savePlayer(n);}if(!has&&p.id===np){const n=clone(p);n.persos=[...(n.persos||[]),c.id];savePlayer(n);}}
    if(!canEditC(S.chars[c.id]))S.dlg=null;}
  else if(a==='meOpen'){S.pinF=null;S.dlg={kind:'me'};pinRefresh();}
  else if(a==='idPick'){idPick(d.id);return;}
  else if(a==='idVisit'){idVisit();return;}
  else if(a==='idBack'){if(BY)idSwitchAs(BY);return;}
  else if(a==='pinKey'){pinKey(d.k);return;}
  else if(a==='pinBack'){S.pinF=null;}
  else if(a==='pinReset'){if(!isGest())return;S.confirm='pin:'+d.pid;}
  else if(a==='pinResetOk'){if(!isGest())return;pinReset(d.pid);return;}
  else if(a==='dPropose'){S.dlg={kind:'pd',date:d.date||'',sl:d.sl||'S',type:'Scénario',note:''};}
  else if(a==='herOpen'){S.dlg={kind:'her'};}
  else if(a==='teamNew'){S.dlg={kind:'teamNew'};}
  else if(a==='plEcart'){S.dEcart=[...(S.dEcart||[]),d.id];saveDates(S.dates);return;}
  else if(a==='plMkSess'){const x=S.dates.find(z=>z.id===d.id);if(!x)return;const ty=TYPES.includes(x.type)?x.type:'Scénario',L=xpEvOf(ty);S.dlg={kind:'sn',type:ty,titre:'',evNom:'',evt:ty==='Vie du fief'||ty==='Autre'?'':L[0]?L[0].id:'__new',date:x.date,pj:allPJ()};}
  else if(a==='plWho'){S.dlg={kind:'plWho',k:d.k};}
  else if(a==='plOpen'){S.plDate=d.id;S.confirm=null;window.scrollTo(0,0);}
  else if(a==='plClose'){S.plDate=null;S.confirm=null;}
  else if(a==='plUnAsk'){S.confirm='du:'+d.id;}
  else if(a==='plUnNo'){S.confirm=null;}
  else if(a==='pdSl'){S.dlg.sl=d.sl;}
  else if(a==='pdOk'){const g=S.dlg;if(!g.date||g.date<today())return;S.dlg=null;const x={id:'d'+Date.now().toString(36),date:g.date,sl:g.sl,type:g.type,note:(g.note||'').trim(),by:ME||null,status:'prop'};
    if(ME&&S.players[ME]){const pl=clone(S.players[ME]);pl.rep={...(pl.rep||{}),[x.id]:'ok'};savePlayer(pl);}saveDates([...S.dates,x]);setTimeout(()=>notify({kind:'prop',dateId:x.id,from:ME||null}),2500);return;}
  else if(a==='dValidFree'){const x={id:'d'+Date.now().toString(36),date:d.date,sl:d.sl,type:'Scénario',note:'',by:ME||null,status:'valid'};if(d.end&&(d.end!==d.date||d.endsl!==d.sl)){x.endDate=d.end;x.endSl=d.endsl;}saveDates([...S.dates,x]);setTimeout(()=>notify({kind:'valid',dateId:x.id,from:ME}),2500);return;}
  else if(a==='dValid'){const x0=S.dates.find(x=>x.id===d.id);if(x0&&mjRefus(x0))return;saveDates(S.dates.map(x=>x.id===d.id?{...x,status:'valid'}:x));setTimeout(()=>notify({kind:'valid',dateId:d.id,from:ME}),2500);return;}
  else if(a==='dUnvalid'){S.confirm=null;saveDates(S.dates.map(x=>x.id===d.id?{...x,status:'prop'}:x));return;}
  else if(a==='dDel'){const k='dd:'+d.id;if(S.confirm!==k){S.confirm=k;}else{S.confirm=null;saveDates(S.dates.filter(x=>x.id!==d.id));return;}}
  else if(a==='dRep'){if(!ME||!S.players[ME])return;const pl=clone(S.players[ME]);pl.rep={...(pl.rep||{})};const was=pl.rep[d.id];if(was===d.r)delete pl.rep[d.id];else pl.rep[d.id]=d.r;savePlayer(pl);
    if(isMJ(pl)&&pl.rep[d.id]==='no'&&was!=='no')setTimeout(()=>notify({kind:'refus',dateId:d.id,from:ME}),2500);return;}
  else if(a==='planView'){S.plan.view=d.v;}
  else if(a==='planMonth'){let m=S.plan.m+(+d.d),y=S.plan.y;if(m<0){m=11;y--;}if(m>11){m=0;y++;}S.plan.m=m;S.plan.y=y;S.plan.open=null;}
  else if(a==='planOpen'){S.plan.open=S.plan.open===d.k?null:d.k;}
  else if(a==='planSet'){const p0=S.players[d.p];if(!p0||!isUser())return;const pl=clone(p0);pl.dispo=pl.dispo||{};if(pl.dispo[d.k])delete pl.dispo[d.k];else pl.dispo[d.k]=true;savePlayer(pl);return;}
  else if(a==='natEdit'){const e=sessById(d.id);if(!e)return;const vals={};for(const en of e.entries){const ch=S.chars[en.perso];if(ch&&ch.type==='PJ'&&vis(ch)&&en.nature===d.n)vals[en.perso]=(vals[en.perso]||0)+en.montant;}
    const one=d.n==='Scénario'||d.n==='Groupe',vs=Object.values(vals).filter(Boolean);
    S.dlg={kind:'ne',id:d.id,n:d.n,vals,one,m:one&&vs.length?String(modeOf(vs)):'',mixed:one&&new Set(vs).size>1};}
  else if(a==='natSave'){const g=S.dlg,e=sessById(g.id);if(!e)return;S.dlg=null;let list,add;
    if(g.one){const m=Math.max(0,Math.floor(+g.m||0)),tg=natTargets(e,g.n);list=pjIds().filter(i=>S.chars[i].type==='PJ');add=m>0?tg.map(i=>({perso:i,nature:g.n,montant:m})):[];}
    else{list=natList(e,g);add=list.map(i=>({perso:i,nature:g.n,montant:Math.max(0,Math.floor(+g.vals[i]||0))})).filter(x=>x.montant>0);}
    const keep=e.entries.filter(en=>!(en.nature===g.n&&list.includes(en.perso)));
    saveEvents(S.events.map(x=>x.id===g.id?{...x,entries:[...keep,...add]}:x));return;}
  else if(a==='sessToggle'){S.jOpen=S.jOpen||{};const e=sessById(d.id);const first=[...S.events].reverse().find(x=>x.session&&(!x.sessionId||!sessById(x.sessionId)));const was=d.id in S.jOpen?S.jOpen[d.id]:e===first;S.jOpen[d.id]=!was;}
  else if(a==='ratOpen'){const list=pjIds().map(i=>S.chars[i]),gt=gainsTable(list,S.events),r=gt.rows.find(x=>x.c.id===d.id);if(!r)return;const rt=rattrapage(gt.rows,r);if(!rt)return;
    S.dlg={kind:'rat',id:d.id,type:'Autre',titre:"Rattrapage d'XP pour "+r.c.court,date:today(),nature:'Individuel',montant:String(rt.montant),who:[d.id],total:r.total,ecart:Math.round(gt.avg-r.total),avg:Math.round(gt.avg*10)/10,base:rt.montant,cible:rt.c.court,cibleTotal:rt.total};}
  else if(a==='ratChar'){const w=S.dlg.who;S.dlg.who=w.includes(d.id)?w.filter(x=>x!==d.id):[...w,d.id];}
  else if(a==='ratOk'){const g=S.dlg,t=(g.titre||'').trim(),n=Math.floor(+g.montant||0);if(!t||n<=0||!g.who.length)return;S.dlg=null;
    const e={id:'g'+Date.now().toString(36),session:true,rattrapage:true,date:g.date||today(),titre:t,type:g.type||'Autre',entries:g.who.map(p=>({perso:p,nature:g.nature||'Individuel',montant:n})),pnj:{},pj:[...g.who]};saveEvents([...S.events,e]);return;}
  else if(a==='sessNew'){const L=xpEvOf('Scénario');S.dlg={kind:'sn',type:'Scénario',titre:'',evNom:'',evt:L[0]?L[0].id:'__new',date:today(),pj:allPJ()};}
  else if(a==='sdPj'){const w=S.dlg.pj||[];S.dlg.pj=w.includes(d.id)?w.filter(x=>x!==d.id):[...w,d.id];}
  else if(a==='sessEdit'||a==='sessEditId'){const e=a==='sessEdit'?curSession():sessById(d.id);if(!e)return;S.dlg={kind:'sm',id:e.id,type:evType(e),titre:e.titre||'',date:e.date||'',confirm:false,pj:presents(e)};}
  else if(a==='sessCreate'){const g=S.dlg;if(!g||!sdOk(g))return;S.dlg=null;const t=(g.titre||'').trim(),e={id:'g'+Date.now().toString(36),session:true,date:g.date||today(),titre:t,type:g.type||'Scénario',entries:[],pnj:{},pj:g.pj||[]};
    /* UX1 : toute session hors « Autre » est rattachée à un événement du même type ; nouvel événement numéroté automatiquement (entier, max + 1) */
    if(xpLinked(e.type)&&g.evt){const x=g.evt&&g.evt!=='__new'&&S.fiches[g.evt];if(x)e.evt=x.id;else{const f=chEvAuto(e);f.nom=(g.evNom||'').trim();f.type=e.type;f.n=xpNextN(e.type);f.num='';S.fiches={...S.fiches,[f.id]:f};fiSave(f,true);e.evt=f.id;}}
    S.curSess=e.id;S.xpSess=e.id;saveEvents([...S.events,e]);return;}
  else if(a==='sessSave'){const g=S.dlg;if(!g||!sdOk(g))return;const t=(g.titre||'').trim();S.dlg=null;const pj=g.pj||[];
    saveEvents(S.events.map(e=>{if(e.id!==g.id)return e;const ch=pjIds();let en=e.entries;
      const sc=en.filter(x=>x.nature==='Scénario'&&x.montant&&ch.includes(x.perso));
      if(sc.length){const m=+modeOf(sc.map(x=>x.montant));en=en.filter(x=>!(x.nature==='Scénario'&&ch.includes(x.perso)&&!pj.includes(x.perso)));
        for(const p of pj)if(!en.some(x=>x.nature==='Scénario'&&x.perso===p))en=[...en,{perso:p,nature:'Scénario',montant:m}];}
      const r={...e,titre:t,type:g.type,date:g.date||e.date,pj,entries:en};
      if(r.evt&&g.type!==evType(e)){const ev=S.fiches[r.evt],seul=ev&&!S.events.some(x=>x.session&&x.evt===ev.id&&x.id!==e.id);
        /* UX2 : l'événement de cette seule session suit le type (numéro suivant du nouveau type) ; partagé : la session s'en détache (UX1) */
        if(seul){const n=clone(ev);n.type=g.type;n.num='';if(CH_TCL[g.type])n.n=xpNextN(g.type);else delete n.n;fiSave(n,true);}else delete r.evt;}
      return r;}));return;}
  else if(a==='sessDel'){if(!sessChildren(S.dlg.id).length)S.dlg.confirm=true;}
  else if(a==='sessDelOk'){const id=S.dlg.id;S.dlg=null;if(sessChildren(id).length){render();return;}if(S.curSess===id)S.curSess=null;saveEvents(S.events.filter(e=>e.id!==id));return;}
  else if(a==='sessAdd'){const cs=curSession();if(!cs)return;const add=[];for(const l of S.form.lines){const m=+l.montant;if(m>0)for(const pp of slp(l,cs))add.push({perso:pp,nature:l.nature,montant:m});}if(!add.length)return;
    S.form={titre:'',type:'Scénario',date:today(),lines:[{nature:'Scénario',montant:'',persos:null}]};if(S.dlg&&S.dlg.kind==='xpAdd')S.dlg=null;saveEvents(S.events.map(e=>e.id===cs.id?{...e,entries:[...e.entries,...add]}:e));return;}
  else if(a==='pnjToggle'){if(d.s)S.curSess=d.s;const cs=curSession();if(!cs)return;const pn={...(cs.pnj||{})};pn[d.id]=!pn[d.id];saveEvents(S.events.map(e=>e.id===cs.id?{...e,pnj:pn}:e));return;}
  else if(a==='sessLineDel'){const key='l:'+d.id+':'+d.k;if(S.confirm!==key){S.confirm=key;}else{S.confirm=null;const [n,m]=d.k.split('|');saveEvents(S.events.map(e=>e.id===d.id?{...e,entries:e.entries.filter(en=>!(en.nature===n&&String(en.montant)===m&&pjIds().includes(en.perso)))}:e));return;}}
  else if(a==='creAdd'){S.dlg={kind:'ca',nom:'',fam:'trad'};}
  else if(a==='creFam'){S.dlg.fam=d.f;}
  else if(a==='creAddOk'){const g=S.dlg,nom=(g.nom||'').trim();if(!nom||S.creatures.some(c=>c.nom.toLowerCase()===nom.toLowerCase()))return;S.dlg=null;saveCreatures([...clone(S.creatures),{id:creSlug(nom),nom,fam:g.fam,done:false}]);render();return;}
  else if(a==='eye'){if(!isGest())return;const sess=(sessList()[0]||{}).id||'';
    if(d.t==='sec'){const s=secById(+d.n);if(!s)return;const x=d.k==='titre'?null:s.slots[d.k][+d.i];const cur=d.k==='titre'?!s.titreHid:!!(x&&!x.hid);if(cur&&!canEdit())return;S.dlg={kind:'eye',t:'sec',n:+d.n,k:d.k,i:+d.i||0,open:!cur,sess};}
    else{const cr=S.creatures.find(c=>c.id===d.id);if(!cr)return;const e=eyeOf(cr,raceRec(cr)),cur=eyeIsOpen(e,d.k,+d.i||0);if(cur&&!canEdit())return;S.dlg={kind:'eye',t:'race',id:d.id,k:d.k,i:+d.i||0,open:!cur,sess};}}
  else if(a==='eyeOk'){const g=S.dlg;S.dlg=null;if(!isGest()||(!g.open&&!canEdit())){render();return;}if(g.t==='sec')secEyeSet(g.n,g.k,g.i,g.open,g.sess);else raceEyeSet(g.id,g.k,g.i,g.open,g.sess);return;}
  else if(a==='creToggle'){if(!isGest())return;S.dlg={kind:'ct',id:d.id,sess:(sessList()[0]||{}).id||''};}
  else if(a==='creToggleOk'){if(!isGest())return;const g=S.dlg;S.dlg=null;creToggle(g.id,g.sess);return;}
  else if(a==='creEdit'){const c=S.creatures.find(x=>x.id===d.id);if(!c)return;const ev=creEv(c.id);S.dlg={kind:'ce',id:c.id,nom:c.nom,fam:c.fam,confirm:false,sess:ev?(ev.sessionId||''):''};}
  else if(a==='creSess'){const g=S.dlg;S.dlg=null;const ev=creEv(g.id);if(!ev){render();return;}const sid=g.sess&&sessById(g.sess)?g.sess:undefined;saveEvents(S.events.map(e=>{if(e!==ev)return e;const x={...e};if(sid)x.sessionId=sid;else delete x.sessionId;return x;}));return;}
  else if(a==='creSave'){const g=S.dlg,nom=(g.nom||'').trim();if(!nom||S.creatures.some(c=>c.id!==g.id&&c.nom.toLowerCase()===nom.toLowerCase()))return;S.dlg=null;saveCreatures(clone(S.creatures).map(c=>c.id===g.id&&!c.done?{...c,nom,fam:g.fam}:c));render();return;}
  else if(a==='creDel'){S.dlg.confirm=true;}
  else if(a==='creDelOk'){const id=S.dlg.id,cr=S.creatures.find(c=>c.id===id);S.dlg=null;if(cr&&playedBy(raceRec(cr).sing).length){alert('Cette race est jouée par un personnage : elle ne peut pas être supprimée.');return;}saveCreatures(S.creatures.filter(c=>!(c.id===id&&!c.done)));if(cr&&!cr.done&&S.races&&S.races[id]){const m={...S.races};delete m[id];S.races=m;persist('meta/races',{byId:m});rebuildRaces();}render();return;}
  else if(a==='uni'){S.uni=d.v;S.sec=null;S.rf=null;if(/^(pw|cap):/.test(S.fi||''))S.fi=null;}
  else if(a==='secFilter'){S.secFilter=d.v;}
  else if(a==='secOpen'){S.sec=+d.n;window.scrollTo(0,0);}
  else if(a==='secBack'){S.sec=null;}
  else if(a==='secAdd'){if(!isGest())return;const s=secById(S.sec);if(!s)return;const k=!s.titre?'titre':['vm','vmin','h'].find(x=>secFree(s,x));if(!k)return;S.dlg={kind:'sx',n:s.n,k,txt:'',sess:(sessList()[0]||{}).id||''};}
  else if(a==='sxKind'){S.dlg.k=d.k;}
  else if(a==='sxOk'){const g=S.dlg,txt=(g.txt||'').trim();S.dlg=null;if(txt&&isGest())secConsign(g.n,g.k,txt,'',true);else render();return;}
  else if(a==='propNew'){const s=secById(S.sec);if(!s||!ME||S.visit)return;const ks=propKinds(s);if(!ks.length)return;S.dlg={kind:'pp2',n:s.n,k:ks[0],txt:''};}
  else if(a==='propK'){if(S.dlg&&S.dlg.kind==='pp2'){S.dlg.k=d.v;}}
  else if(a==='propSend'){propSend();return;}
  else if(a==='propRej'){propReject(d.id);return;}
  else if(a==='propHide'){const L=(S.secretProps||[]).map(x=>x.id===d.id&&x.by===ME&&x.st==='rej'?{...x,st:'vu'}:x);saveProps(L);return;}
  else if(a==='propOk'){if(!isGest())return;const p=(S.secretProps||[]).find(x=>x.id===d.id),s=p&&secById(p.n);if(!s)return;
    const hid=(s.slots.h||[]).map((x,i)=>x&&x.hid?i:-1).filter(i=>i>=0);
    S.dlg={kind:'rv',id:p.id,sess:(sessList()[0]||{}).id||'',chg:false,txt:p.k==='titre'?(s.titre&&s.titreHid?s.titre:p.txt):p.txt,pick:p.k==='titre'?'':(hid.length?'':((s.slots.h||[]).some(x=>!x)?'new':''))};}
  else if(a==='rvPick'){if(S.dlg&&S.dlg.kind==='rv')S.dlg.pick=d.v;}
  else if(a==='rvChg'){if(S.dlg&&S.dlg.kind==='rv')S.dlg.chg=true;}
  else if(a==='rvOk'){propReveal();return;}
  else if(a==='secRevAsk'){if(!isGest())return;S.dlg={kind:'lotw',n:+d.n,k:d.k,i:+d.i||0};}
  else if(a==='lotAdd'){const g=S.dlg;if(!isGest()||!g||g.kind!=='lotw')return;const L=inLot(g.n,g.k,g.i)?secLot():[...secLot(),{id:'lt'+Date.now().toString(36),n:g.n,k:g.k,i:g.i}];
    S.dlg=d.v==='go'?{kind:'lotr',sess:(sessList()[0]||{}).id||'',chg:false}:null;saveLot(L);if(d.v!=='go')setTimeout(()=>toast('Ajouté aux révélations en attente'),0);return;}
  else if(a==='lotOpen'){if(!isGest())return;S.dlg={kind:'lotr',sess:(sessList()[0]||{}).id||'',chg:false};}
  else if(a==='lotChg'){if(S.dlg&&S.dlg.kind==='lotr')S.dlg.chg=true;}
  else if(a==='lotRm'){if(!isGest())return;const L=secLot().filter(x=>x.id!==d.id);if(!L.length)S.dlg=null;saveLot(L);return;}
  else if(a==='lotClr'){if(!isGest())return;saveLot([]);setTimeout(()=>toast('Révélations en attente annulées'),0);return;}
  else if(a==='lotOk'){lotApply();return;}
  else if(a==='secEntry'){if(!canEdit())return;const s=secById(S.sec);if(!s)return;const x=d.k==='titre'?s.titre:(s.slots[d.k][+d.i]||{}).txt;const ev0=secEv(s.n,d.k,+d.i);S.dlg={kind:'se',n:s.n,k:d.k,i:+d.i,txt:x||'',confirm:false,sess:ev0?(ev0.sessionId||''):''};}
  else if(a==='seSave'){if(!canEdit())return;const g=S.dlg,txt=(g.txt||'').trim();S.dlg=null;if(!txt){render();return;}
    const ev0=secEv(g.n,g.k,g.i);if(ev0&&(ev0.sessionId||'')!==(g.sess||'')){const sid=g.sess&&sessById(g.sess)?g.sess:undefined;
      saveEvents(S.events.map(e=>{const mv=e===ev0||(e.secret&&e.secret.n===g.n&&e.secret.k==='bonus'&&e.trigger&&e.trigger.k===g.k&&e.trigger.i===g.i);if(!mv)return e;const x={...e};if(sid)x.sessionId=sid;else delete x.sessionId;return x;}));}
    secEdit(g.n,g.k,g.i,txt);return;}
  else if(a==='seDel'){if(!canEdit())return;S.dlg.confirm=true;}
  else if(a==='seDelOk'){if(!canEdit())return;const g=S.dlg;S.dlg=null;secRemove(g.n,g.k,g.i);return;}
  else if(a==='autrePlus'){S.dlg={kind:'a',id:S.sel,nom:d.nom,pts:''};}
  else if(a==='openAutre'){S.dlg={kind:'u',id:S.sel,nom:d.nom};}
  else if(a==='nameOpen'){S.nameForm={kind:d.kind,nom:''};}
  else if(a==='nameClose'){S.nameForm={kind:null,nom:''};}
  else if(a==='nameAdd'){const k=S.nameForm.kind,nom=S.nameForm.nom.trim(),c0=S.chars[S.sel];if(!k||!nom||!c0)return;const c=clone(c0);if(k==='atout'&&c.atout.max!=null&&(c.atout.cur||0)>=c.atout.max)return;c.noms=c.noms||{atout:[],spec:[]};c.noms[k]=c.noms[k]||[];c.noms[k].push(nom);c[k].cur=(c[k].cur||0)+1;S.nameForm.nom='';saveChar(c);return;}
  else if(a==='nameDel'){const c=clone(S.chars[S.sel]),k=d.kind;if(!c.noms||!c.noms[k])return;c.noms[k].splice(+d.i,1);c[k].cur=Math.max(0,(c[k].cur||0)-1);saveChar(c);return;}
  else if(a==='heart'){const c=clone(S.chars[S.sel]),r=ref(c,d.key);if(!r)return;const cu=r.o.cur||0;c.plan=c.plan||{};if((c.plan[d.key]||0)>cu)delete c.plan[d.key];else if(r.max==null||cu<r.max)c.plan[d.key]=cu+1;saveChar(c);return;}
  else if(a==='quick'){const c=S.chars[S.sel],r=c&&ref(c,d.key);if(!r)return;const cu=r.o.cur||0;if(r.max!=null&&cu>=r.max)return;if(r.kind==='art'&&aoGate(c,d.key,cu+1))return;if(lvlCost(r.kind,cu+1)>summary(c,S.events).dispo)return;S.dlg={kind:'b',id:c.id,key:d.key,from:cu,nom:''};}
  else if(a==='undoLvl'){const u=undoLevel(cur(),S.sheet.key);S.sheet=null;if(u)saveChar(u.c);return;}
  else if(a==='step'){S.sheet.to+= +d.d;}
  else if(a==='specToggle'){S.specOpen=S.specOpen||{};const k=S.sel+'|'+d.key;S.specOpen[k]=!S.specOpen[k];}
  else if(a==='spBuy'||a==='spBuyO'){const c0=S.chars[S.sel];if(!c0)return;const key=d.key;let nom=a==='spBuy'?d.nom:((S.spOther||{})[c0.id+'|'+key]||'').trim();if(!nom)return;
    if(key==='comp:Culture'&&a==='spBuyO'&&LANGS.includes(nrm(nom)))nom='Langue : '+nom;
    if(specsOf(c0).some(x=>x.cible===key&&nrmS(x.nom)===nrmS(nom)))return;
    let c;if(specAnon(c0)>0){c=clone(c0);c.specs=[...specsOf(c),{nom,cible:key}];}
    else{const k=specCost(key,nom);if(k>summary(c0,S.events).dispo)return;c=buySpec(c0,key,nom,k,today());}
    if(a==='spBuyO'&&S.spOther)delete S.spOther[c0.id+'|'+key];saveChar(c);return;}
  else if(a==='rfOpen'){S.dlg=null;S.view='univers';S.uni='creatures';S.rf=rfDraft(d.id);S.rfEd=false;S.rfBlk=null;S.rfPor=null;window.scrollTo(0,0);}
  else if(a==='rfNew'){if(!canRaceEd(null))return;S.rf=rfDraft(null);S.rfEd=true;S.edDirty=false;window.scrollTo(0,0);}
  else if(a==='raceFull'){if(!isGest())return;const cr=S.creatures.find(c=>c.id===d.id);if(!cr||raceAllOpen(cr))return;S.dlg={kind:'eye',t:'race',id:d.id,k:'all',i:0,open:true,sess:(sessList()[0]||{}).id||''};}
  else if(a==='rfBack'){S.rf=null;S.rfEd=false;S.rfBlk=null;S.rfPor=null;}
  else if(a==='rfFlt'){S.rff=d.v;}
  else if(a==='rfFam'){S.rffam=S.rffam===d.v?'':d.v;}
  else if(a==='rfUni'){ev.preventDefault();S.view='univers';S.uni='creatures';S.rf=null;}
  else if(a==='rfPredDel'){S.rf[d.k].splice(+d.i,1);}
  else if(a==='rfPredAdd'){const g=S.rf;if(d.k==='pred'){if(!g.pa)return;g.pred.push(g.pb&&g.pb!==g.pa?[g.pa,g.pb]:g.pa);g.pa='';g.pb='';}else{const x=(g.fa||'').trim(),y=(g.fb||'').trim();if(!x)return;g.fut.push(y?[x,y]:x);g.fa='';g.fb='';}}
  else if(a==='rfAtAdd'){S.rf.at.push(['','']);}
  else if(a==='forme'){S.forme=d.v;}
  else if(a==='shTab'){S.shTab=d.v;S.derTip=null;}
  else if(a==='onlyBuy'){S.onlyBuy=!S.onlyBuy;}
  else if(a==='goalToggle'){S.goalOpen={...(S.goalOpen||{}),[d.id]:!(S.goalOpen||{})[d.id]};}
  else if(a==='derTip'){S.derTip=S.derTip===d.n?null:d.n;}
  else if(a==='gainOn'){if(S.dlg){S.dlg.gain=true;if(S.dlg.sess===undefined)S.dlg.sess=(sessList()[0]||{}).id||'';}}
  else if(a==='gainOff'){if(S.dlg)S.dlg.gain=false;}
  else if(a==='gainOk'){const g=S.dlg,c=S.chars[g.id],r=c&&ref(c,g.key),nm=(g.nom||'').trim(),named=r&&(r.kind==='atout'||r.kind==='spec');
    if(!r||!g.sess||(named&&!nm)||(r.o.cur||0)!==g.from||(r.max!=null&&g.from>=r.max))return;
    const n=buy(c,g.key,g.from+1,today(),named?nm:undefined),A=n.achats[n.achats.length-1];A.cout=0;A.gain=true;A.label='Gain en jeu · '+A.label;if((g.motif||'').trim())A.motif=g.motif.trim();A.sessionId=g.sess;S.dlg=null;saveChar(n);return;}
  else if(a==='ptab'){S.ptab=d.v||'';S.psaved=false;S.relpD=null;S.relpDirty=false;S.pDirty=false;S.pd=null;S.fgPd=null;window.scrollTo(0,0);}
  else if(a==='pcat'){S.pcat=d.v;}
  else if(a==='pCancel'){S.pd=null;S.fgPd=null;S.relpD=null;S.relpDirty=false;S.pDirty=false;}
  else if(a==='pSave'){if(!isTech()||!canEdit())return;const g=S.pd;if(!g||!g.date)return;if(S.fgPd&&typeof fgParamAct==='function')fgParamAct('fgPSave',{});if(S.relpDirty&&typeof relpAct==='function')relpAct('relpSave');S.pDirty=false;const v={...g.v};delete v.ppBareme;delete v.fmStart; /* anciennes clés (nettoyage du 27/11) */for(const t in PARAM_DEF)for(const [k] of PARAM_DEF[t])if(v[k]!=='')v[k]=+v[k];v.pnj=(v.pnj||[]).filter(r=>(r.nom||'').trim()).map(r=>({nom:r.nom.trim(),car:r.car===''?'':+r.car,prof:r.prof===''?'':+r.prof}));
    const L=((S.params&&S.params.versions)||[]).filter(x=>x.date!==g.date);L.push({date:g.date,v});S.params={versions:L};persist('meta/params',S.params);applyParams();S.pd=null;S.psaved=true;}
  else if(a==='pDef'){if(!isTech()||!canEdit())return;pDraft().v=paramDefaults();S.psaved=false;S.pDirty=true;}
  else if(a==='pnjAdd'){if(!isTech()||!canEdit())return;S.pDirty=true;pDraft().v.pnj=[...(S.pd.v.pnj||[]),{nom:'',car:'',prof:''}];}
  else if(a==='pnjDel'){if(!isTech()||!canEdit())return;S.pDirty=true;S.pd.v.pnj.splice(+d.i,1);}
  else if(a==='rfFxNew'){S.rf.fxEd={key:fxKey(d.k,d.n),t:'perm',cible:'',val:'',txt:'',quand:'m'};}
  else if(a==='rfFxCancel'){S.rf.fxEd=null;}
  else if(a==='rfFxT'){const e=S.rf.fxEd;e.t=d.v;e.cible='';}
  else if(a==='rfFxQ'){S.rf.fxEd.quand=d.v;}
  else if(a==='rfFxAdd'){const e=S.rf.fxEd;if(!e)return;const f={t:e.t,cible:e.t==='rap'?'':e.cible,val:e.t==='rap'?0:Math.round(+e.val||0),txt:(e.txt||'').trim(),quand:e.quand};if(f.t==='perm')f.txt='';
    S.rf.fx={...S.rf.fx,[e.key]:[...(S.rf.fx[e.key]||[]),f]};S.rf.fxEd=null;}
  else if(a==='rfFxDel'){const L=(S.rf.fx[d.key]||[]).slice();L.splice(+d.j,1);S.rf.fx={...S.rf.fx,[d.key]:L};}
  else if(a==='rf2Add'){S.rf[d.k].push(d.k==='cap'?['','','']:['','']);}
  else if(a==='rf2Del'){S.rf[d.k].splice(+d.i,1);}
  else if(a==='rfChAdd'){const g=S.rf,v=(g.cb||'').trim();if(!v)return;const mm=g.ca==='cap'&&v.match(/^(.*?)\s*\((.*)\)$/),o2=mm?['cap',mm[1].trim(),mm[2].trim()]:[g.ca,v];if(!g.choix.some(o=>o[0]===o2[0]&&nrm(choixFull(o))===nrm(choixFull(o2))))g.choix.push(o2);g.cb='';}
  else if(a==='rfChDel'){S.rf.choix.splice(+d.i,1);}
  else if(a==='rfPwUnk'){const s=S.rf.pw[+d.i];s[1]=!s[1];}
  else if(a==='rfSpAdd'){(S.rf[d.k]=S.rf[d.k]||[]).push(['','','']);}
  else if(a==='rfSpDel'){S.rf[d.k].splice(+d.i,1);}
  else if(a==='rfHum'){S.dlg=null;S.view='univers';S.uni='creatures';const x=humRec(),car={};for(const k of CARCOL){const v=x.car&&x.car[k];car[k]=[v?v[0]:'',v?v[1]:''];}S.rf={hum:true,car};window.scrollTo(0,0);}
  else if(a==='rfHumSave'){const g=S.rf,car={};for(const k of CARCOL){const v=g.car[k];car[k]=[v[0]===''?1:+v[0],v[1]===''?6:+v[1]];}S.races={...S.races,[HUM_ID]:{sing:HUMAIN,hum:true,car}};persist('meta/races',{byId:S.races});g.saved=true;}
  else if(a==='rfAtDel'){S.rf.at.splice(+d.i,1);}
  else if((a==='rfDel'||a==='rfDelOk')&&!canRaceFull(S.rf&&S.rf.id))return; /* race en partie masquée : suppression au MJ et à la gestion */
  else if(a==='rfDel'){const g=S.rf,cr=S.creatures.find(c=>c.id===g.id);if(cr&&cr.done){g.err='Cette fiche de race est complète : elle ne peut pas être supprimée.';}else if(playedBy(raceRec(cr||{}).sing||'').length){g.err='Cette race est jouée par un personnage : elle ne peut pas être supprimée.';}else{g.err='';g.confirm=true;}}
  else if(a==='rfDelOk'){const id=S.rf.id;S.rf=null;saveCreatures(S.creatures.filter(c=>c.id!==id));const m={...S.races};delete m[id];S.races=m;persist('meta/races',{byId:m});rebuildRaces();}
  else if(a==='rfSave'&&S.rf&&!S.rf.hum&&rfPwCheck(S.rf)){S.rf.err='Enregistrement impossible. '+rfPwCheck(S.rf);refuse();}
  else if(a==='rfNomP'&&S.rf){S.rf.nomP=d.v;S.edDirty=true;}
  else if(a==='rfPwN'&&S.rf){const o=(S.rf.pwn=S.rf.pwn||{})[d.i]=(S.rf.pwn||{})[d.i]||{};o[d.f]=o[d.f]===d.v?'':d.v;S.rf.err='';}
  else if(a==='rfSave'&&S.rf&&!S.rf.unkOk&&rfUnkAsk(S.rf).length){S.rf.unkAsk=rfUnkAsk(S.rf);}
  else if(a==='rfSave'){const g=S.rf;delete g.unkOk;const rec=rfRec(g),sing=rec.sing,plur=((g.id&&S.creatures.find(c=>c.id===g.id))||{}).nom||sing;if(!sing)return;rec.pw=pwToIds(rec.pw,g.pwn);if(g.pwx){const ids=pwSlots(rec);let ch=false;const P={...S.pouvoirs};for(const k in g.pwx){const x=g.pwx[k],id=ids[+k];if(x&&x.dirty&&id&&id!=='?'&&P[id]){P[id]={...P[id],desc:(x.desc||'').trim(),fx:clone(x.fx||[])};ch=true;}}if(ch)savePouvoirs(P);}
    if(refRows().some(r=>r.cr.id!==g.id&&nrm(r.x.sing)===nrm(sing))){g.err='Une autre race porte déjà ce nom.';render();return;}
    let list=clone(S.creatures),id=g.id;
    if(!id){id=creSlug(plur)||('race-'+Date.now().toString(36));if(list.some(c=>c.id===id))id+='-'+Date.now().toString(36);list.push({id,nom:plur,fam:g.fam,done:false});if(!isGest())rec.eye=eyeAll(true); /* créée par un joueur : visible de toute la table */}
    else{const cr=list.find(c=>c.id===id);if(cr){cr.fam=g.fam;}}
    {const pv=S.races[id]||{};for(const k of ['traits','infos','por'])if(pv[k])rec[k]=pv[k];}const old=S.races[id]&&S.races[id].sing;rec.eye=(S.races[id]&&S.races[id].eye)||eyeAll(false);saveRaceView(id,rec);saveCreatures(list);rebuildRaces();
    if(old&&old!==sing)for(const c of Object.values(S.chars))if(c.race===old){const n=clone(c);n.race=sing;saveChar(n);}
    S.rf=rfDraft(id);S.rf.err='';S.rf.saved=true;if(S.rfBlk){S.rfEd=false;S.rfBlk=null;}setTimeout(()=>toast('Race enregistrée'),0);}
  else if(a==='ptrSave'){const g=S.dlg,im=window._ptrImg;if(!g||!im)return;const s2=g.base*g.z,cv=document.createElement('canvas');cv.width=cv.height=256;
    const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,256,256);cx.drawImage(im,(20-g.x)/s2,(20-g.y)/s2,220/s2,220/s2,0,0,256,256);
    let q=.82,data=cv.toDataURL('image/jpeg',q);while(data.length>60000&&q>.4){q-=.1;data=cv.toDataURL('image/jpeg',q);}
    fiBigSave(g.cid,im);S.ptr={...(S.ptr||{}),[g.cid]:data};S.dlg=g.back||null;window._ptrImg=null;persist('portraits/'+g.cid,{img:data,t:Date.now()});S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});render();return;}
  else if(a==='ptrDel'){if(!S.ptr||!S.ptr[d.id])return;fiBigDel(d.id);const m={...S.ptr};delete m[d.id];S.ptr=m;persistDel('portraits/'+d.id);S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});}
  else if(a==='atBuy'||a==='atBuyO'){const c0=S.chars[S.sel];if(!c0)return;let nom=a==='atBuy'?d.nom:((S.spOther||{})[c0.id+'|atout']||'').trim();if(!nom)return;if(isTyp(nom))nom=TYP;
    if(atoutsOf(c0).some(x=>nrmA(x.nom)===nrmA(nom)))return;let c;
    if(atoutAnon(c0)>0){c=clone(c0);const e={nom};if(nom===TYP)grantTyp(c,e);c.atouts=[...atoutsOf(c),e];}
    else{if(RULES.atout>summary(c0,S.events).dispo)return;c=buyAtout(c0,nom,today());}
    if(a==='atBuyO'&&S.spOther)delete S.spOther[c0.id+'|atout'];saveChar(c);return;}
  else if(a==='atCancel'){const c=S.chars[S.sel],e=atoutsOf(c)[+d.i];if(!e)return;S.dlg={kind:'atc',cid:c.id,i:+d.i};}
  else if(a==='atCancelOk'){const g=S.dlg,c0=S.chars[g.cid],e=atoutsOf(c0)[g.i];S.dlg=null;if(!e)return;
    if(e.achat&&(c0.achats||[]).some(x=>x.id===e.achat)){saveChar(cancelAchat(c0,e.achat).c);return;}
    const c=clone(c0);c.atouts=atoutsOf(c).slice();const ce=c.atouts[g.i];revokeTyp(c,ce);c.atouts.splice(g.i,1);saveChar(c);return;}
  else if(a==='spAttach'){const c=clone(S.chars[S.sel]);c.specs=specsOf(c).slice();const e=c.specs[+d.i];if(!e)return;c.specs[+d.i]={...e,cible:d.key};saveChar(c);return;}
  else if(a==='spCancel'){const c=S.chars[S.sel],e=specsOf(c)[+d.i];if(!e)return;S.dlg={kind:'spc',cid:c.id,i:+d.i};}
  else if(a==='spCancelOk'){const g=S.dlg,c0=S.chars[g.cid],e=specsOf(c0)[g.i];S.dlg=null;if(!e)return;
    if(e.achat&&(c0.achats||[]).some(x=>x.id===e.achat)){saveChar(cancelAchat(c0,e.achat).c);return;}
    const c=clone(c0);c.specs=specsOf(c).slice();if(e.offert){c.spec.cur=Math.max(0,(c.spec.cur||0)-1);c.specs.splice(g.i,1);}else c.specs[g.i]={nom:e.nom,cible:null};saveChar(c);return;}
  else if(a==='undoK'){const u=undoLevel(S.chars[S.sel],d.key);if(u)saveChar(u.c);return;}
  else if(a==='fixOpen'){const c=S.chars[S.sel],r=ref(c,d.key);if(!r)return;const cu=r.o.cur||0;S.sheet={id:c.id,key:d.key,to:cu+1,fix:true,fixCur:cu,fixMax:r.max,sp:{}};}
  else if(a==='spPick'){S.sheet.sp={...(S.sheet.sp||{}),pick:d.v};}
  else if(a==='specAdd'){const sh=S.sheet,c0=S.chars[sh.id],sp=sh.sp||{},pick=sp.pick||'';if(!c0||!pick)return;const sl=specsOf(c0);
    const isNamed=pick.startsWith('n:'),nom=isNamed?(sl[+pick.slice(2)]||{}).nom:pick.startsWith('c:')?pick.slice(2):pick==='l:'?(sp.txt&&sp.txt.trim()?'Langue : '+sp.txt.trim():''):(sp.txt||'').trim();if(!nom)return;
    let c=clone(c0);c.specs=specsOf(c).slice();
    if(isNamed)c.specs[+pick.slice(2)]={...c.specs[+pick.slice(2)],cible:sh.key};
    else if(sp.off){c.spec=c.spec||{cur:0};c.spec.cur=(c.spec.cur||0)+1;c.specs.push({nom,cible:sh.key,offert:true});}
    else if(specAnon(c0)>0)c.specs.push({nom,cible:sh.key});
    else{const cost=specCost(sh.key,nom);if(cost>summary(c0,S.events).dispo)return;c=buySpec(c0,sh.key,nom,cost,today());}
    sh.sp={};saveChar(c);return;}
  else if(a==='specDel'){const c0=S.chars[S.sheet.id],e=specsOf(c0)[+d.i];if(!e)return;
    if(e.achat&&(c0.achats||[]).some(x=>x.id===e.achat)){saveChar(cancelAchat(c0,e.achat).c);return;}
    const c=clone(c0);c.specs=specsOf(c).slice();
    if(e.offert){c.spec.cur=Math.max(0,(c.spec.cur||0)-1);c.specs.splice(+d.i,1);}else c.specs[+d.i]={nom:e.nom,cible:null};
    saveChar(c);return;}
  else if(a==='ppOpen'){S.dlg={kind:'ppBuy',cid:S.sel,prof:d.prof,rub:'all',q:'',sel:null};}
  else if(RI_ACTS.has(a)){if(riAct(a,d)===false)return;}
  else if(PF_ACTS.has(a)){if(pfAct(a,d,t)===false)return;}
  else if(a==='ppSave'){const g=S.dlg,c0=S.chars[g.cid];if(!c0)return;const n=+String(g.spent).replace(',','.')||0;if(n<=0)return;const c=clone(c0),pr=c.profils.find(x=>x.nom===g.prof);if(!pr)return;
    const have=pr.note==null||pr.note===''?0:+pr.note;if(isNaN(have))return;pr.note=have-n;const why=(g.why||'').trim();
    c.achats=c.achats||[];c.achats.push({id:'a'+Date.now().toString(36)+Math.floor(Math.random()*1e3),date:today(),label:`PP ${g.prof} - ${ppFmt(n)} - ${why||'non précisé'}`,cout:0,key:'pp:'+g.prof,pp:n,ppNP:!why});
    S.dlg=null;saveChar(c);return;}
  else if(a==='fixToggle'){S.sheet.fix=!S.sheet.fix;}
  else if(a==='fixApply'){const n=clone(cur()),r=ref(n,S.sheet.key);const v=Math.max(r.kind==='carac'?minFor(n,r.nom):(r.kind==='feerie'||r.kind==='masque')&&n.type==='PJ'?3:0,Math.floor(+S.sheet.fixCur));if(!isNaN(v))r.o.cur=v;S.sheet=null;saveChar(n);return;}
  else if(a==='buy'){const c=cur(),n=buy(c,S.sheet.key,S.sheet.to,today());S.sheet=null;saveChar(n);return;}
  else if(a==='plan'){const c=clone(cur());c.plan=c.plan||{};c.plan[S.sheet.key]=S.sheet.to;S.sheet=null;saveChar(c);return;}
  else if(a==='unplanSheet'||a==='unplan'){const c=clone(S.chars[S.sheet?S.sheet.id:S.sel]);const k=a==='unplan'?d.key:S.sheet.key;delete c.plan[k];S.sheet=null;saveChar(c);return;}
  else if(a==='achatEdit'){const x=(S.chars[S.sel].achats||[]).find(y=>y.id===d.id);S.asheet={cid:S.sel,id:d.id,label:x.label,cout:x.cout,date:x.date||'',confirm:false};}
  else if(a==='achatSave'){const as=S.asheet;const n=editAchat(S.chars[as.cid],as.id,{label:String(as.label).trim()||'(sans libellé)',cout:Math.max(0,Math.round(+as.cout||0)),date:as.date});S.asheet=null;saveChar(n);return;}
  else if(a==='achatCancel'){S.asheet.confirm=true;}
  else if(a==='achatCancelOk'){const as=S.asheet;const x=(S.chars[as.cid].achats||[]).find(y=>y.id===as.id);const r=cancelAchat(S.chars[as.cid],as.id);S.asheet=null;saveChar(r.c);if(x&&x.xfer)saveEvents(S.events.filter(e=>e.id!==x.xfer));return;}
  else if(a==='histToggle')S.hist[S.sel]=!S.hist[S.sel];
  else if(a==='futOpen')S.futForm={open:true,nom:'',max:'6'};
  else if(a==='futCancel')S.futForm.open=false;
  else if(a==='futSave'){const nom=S.futForm.nom.trim();if(nom){const c=clone(S.chars[S.sel]);c.futiles=c.futiles||[];c.futiles.push({nom,max:Math.max(1,+S.futForm.max||6),cur:0});S.futForm={open:false,nom:'',max:'6'};saveChar(c);return;}}
  else if(a==='pnjXp'){const f=S.pnjForm,m=+f.montant;if(f.titre.trim()&&m>0){const e={id:'g'+Date.now().toString(36),date:today(),titre:f.titre.trim(),type:'Autre',entries:[{perso:S.sel,nature:'Individuel',montant:m}]};S.pnjForm={titre:'',montant:''};if(S.dlg&&S.dlg.kind==='pnjXp')S.dlg=null;saveEvents([...S.events,e]);return;}}
  else if(a==='slChar'){const l=S.form.lines[+d.l];const cp=l.persos||[];l.persos=cp.includes(d.id)?cp.filter(x=>x!==d.id):[...cp,d.id];}
  else if(a==='lineChar'){const l=S.form.lines[+d.l];if(lockedLine(l))return;const cp=lp(l);l.persos=cp.includes(d.id)?cp.filter(x=>x!==d.id):[...cp,d.id];}
  else if(a==='lineAll'){S.form.lines[+d.l].persos=allPJ();}
  else if(a==='lineNone')S.form.lines[+d.l].persos=[];
  else if(a==='lineAdd')S.form.lines.push({nature:'Individuel',montant:'',persos:null});
  else if(a==='lineDel')S.form.lines.splice(+d.l,1);
  else if(a==='gainSave'){
    const f=S.form,entries=[];for(const l of f.lines){const m=+l.montant;if(m>0)for(const p of lp(l))entries.push({perso:p,nature:l.nature,montant:m});}
    if(f.editId){const all=entries.concat(f.keep||[]);
      if(f.titre.trim()&&all.length){const evs=S.events.map(x=>x.id===f.editId?{...x,date:f.date||x.date||today(),titre:f.titre.trim(),type:f.type||'Scénario',entries:all}:x);
        S.form={titre:'',type:'Scénario',date:today(),lines:[{nature:'Scénario',montant:'',persos:null}]};saveEvents(evs);window.scrollTo(0,document.body.scrollHeight);return;}
    }
    else if(f.titre.trim()&&entries.length){const e={id:'g'+Date.now().toString(36),date:f.date||today(),titre:f.titre.trim(),type:f.type||'Scénario',entries};S.form={titre:'',type:'Scénario',date:today(),lines:[{nature:'Scénario',montant:'',persos:null}]};saveEvents([...S.events,e]);return;}
  }
  else if(a==='gainEdit'){const e=S.events.find(x=>x.id===d.id);if(e){
    const rep=new Set(pjIds().filter(i=>actif(S.chars[i])));const lines=[],keep=[];
    for(const en of e.entries){if(!rep.has(en.perso)){keep.push(en);continue;}
      let l=lines.find(x=>x.nature===en.nature&&+x.montant===+en.montant);if(!l){l={nature:en.nature,montant:String(en.montant),persos:[]};lines.push(l);}l.persos.push(en.perso);}
    if(!lines.length)lines.push({nature:'Scénario',montant:'',persos:null});
    S.form={editId:e.id,keep,titre:e.titre,type:evType(e),date:e.date||today(),lines};window.scrollTo(0,0);}}
  else if(a==='gainCancel'){S.form={titre:'',type:'Scénario',date:today(),lines:[{nature:'Scénario',montant:'',persos:null}]};}
  else if(a==='gainDel')S.dlg={kind:'g',id:d.id};
  else if(a==='assign'){if(!isGest())return;const p=clone(S.players[d.pid]);p.persos=p.persos||[];p.persos=p.persos.includes(d.id)?p.persos.filter(x=>x!==d.id):[...p.persos,d.id];savePlayer(p);return;}
  else if(a==='hideAll'){const p=S.players[d.pid];const mine=ids().map(i=>S.chars[i]).filter(c=>(p.persos||[]).includes(c.id));const target=!mine.every(c=>c.cache);mine.forEach(c=>setCache(c,target));}
  else if(a==='cHide'){if(!canEditC(S.chars[d.id]))return;setCache(S.chars[d.id],!S.chars[d.id].cache);}
  else if(a==='cMoy'){if(!canEditC(S.chars[d.id]))return;const n=clone(S.chars[d.id]);n.horsMoyenne=!n.horsMoyenne;saveChar(n);return;}
  else if(a==='gestToggle'){if(!isGest()||(S.players[d.pid]||{}).role==='MJ')return;const p=clone(S.players[d.pid]);if(hasGest(p)&&gestCount()<=1)return;p.gestion=!hasGest(p);savePlayer(p);return;}
  else if(a==='asPlayer'){S.asPlayer=true;S.rf=null;window.scrollTo(0,0);}
  else if(a==='asPlayerOff'){S.asPlayer=false;}
  else if(a==='partiToggle'){if(!isGest()||lastMJ(S.players[d.pid]))return; /* UX3 : MJ seulement */const p=clone(S.players[d.pid]);p.parti=!p.parti;savePlayer(p);return;}
  else if(a==='pDel'){if(!isGest())return;S.dlg={kind:'p',id:d.pid};}
  else if(a==='cDel'){if(!isGest())return;S.dlg={kind:'c',id:d.id};}
  else if(a==='logout'){try{localStorage.removeItem('xp.code');}catch(e){}location.reload();return;}
  else if(a==='dlgOk'){const g=S.dlg;S.dlg=null;
    if(g.kind==='a'){const c=S.chars[g.id],p=Math.floor(+g.pts);if(!(c&&p>=1&&p<=summary(c,S.events).dispo)){render();return;}
      let n=spendAutre(c,g.nom,p,today());const A=n.achats[n.achats.length-1];
      if(g.nom==='PNJ'){const L=pnjOf(c),to=L.length===1?L[0].id:g.pnj;const pn=S.chars[to];if(!pn||pn.pj!==c.id){render();return;}
        const ev={id:'g'+Date.now().toString(36)+'-x',date:today(),titre:'Transfert de '+c.court,type:'Autre',entries:[{perso:pn.id,nature:'Transfert',montant:p}]};
        A.label='Dépense · PNJ → '+pn.court;A.xfer=ev.id;saveChar(n);saveEvents([...S.events,ev]);return;}
      if(g.nom==='Domaine'){A.label='Dépense · Fief (transfert)';A.dom=true;const fx=typeof fgDefOf==='function'?(g.fief&&fgFiefsOf(c).includes(g.fief)?g.fief:fgDefOf(c)):null;if(fx)A.fief=fx;} /* lot 7 : fief crédité */
      saveChar(n);return;}
    if(g.kind==='u'){const c=S.chars[g.id],l=c&&lastAutre(c,g.nom),u=c&&undoAutre(c,g.nom);if(u){saveChar(u.c);if(l&&l.xfer)saveEvents(S.events.filter(e=>e.id!==l.xfer));}else render();return;}
    if(g.kind==='b'){const c=S.chars[g.id],r=c&&ref(c,g.key),nm=(g.nom||'').trim(),named=r&&(r.kind==='atout'||r.kind==='spec');if(r&&(!named||nm)&&(r.o.cur||0)===g.from&&lvlCost(r.kind,g.from+1)<=summary(c,S.events).dispo&&(r.max==null||g.from<r.max))saveChar(buy(c,g.key,g.from+1,today(),named?nm:undefined));else render();return;}if(g.kind==='c')removeChar(g.id);else if(g.kind==='p')removePlayer(g.id);else if(g.kind==='g')saveEvents(S.events.filter(e=>e.id!==g.id));return;}
  else if(a==='addP'){if(!isGest())return;const n=S.newP.nom.trim();if(n){const p={id:slug(n),nom:n,role:S.newP.role,parti:false,persos:[]};S.newP={nom:'',role:'Joueur'};S.dlg=null;savePlayer(p);return;}}
  render();
});
const q0=s=>document.querySelector(s);
document.addEventListener('keydown',ev=>{const t=ev.target;if(S.pinF&&(/^[0-9]$/.test(ev.key)||ev.key==='Backspace')&&!(t&&/INPUT|TEXTAREA|SELECT/.test(t.tagName))){ev.preventDefault();pinKey(ev.key==='Backspace'?'del':ev.key);return;}if((ev.key==='Enter'||ev.key===' ')&&t.getAttribute&&t.getAttribute('role')==='button'&&t.dataset.act){ev.preventDefault();t.click();}});
document.addEventListener('input',ev=>{
  if(editorOpen())S.edDirty=true;
  if(shInput(ev.target))return;
  if(cwInput(ev.target,'input'))return; /* lot C */
  if(socleInput(ev.target,'input'))return;
  const t=ev.target;
  if(t.dataset.f){S.form[t.dataset.f]=t.value;}
  else if(t.dataset.l!==undefined){S.form.lines[+t.dataset.l][t.dataset.k]=t.value;}
  else if(t.dataset.fut){S.futForm[t.dataset.fut]=t.value;}
  else if(t.dataset.pnj){S.pnjForm[t.dataset.pnj]=t.value;}
  else if(t.dataset.np){S.newP[t.dataset.np]=t.value;}
  else if(t.dataset.as){S.asheet[t.dataset.as]=t.value;}
  else if(t.dataset.sh){S.sheet[t.dataset.sh]=t.value;}
  else if(t.dataset.sxh!==undefined&&S.dlg){S.dlg.hid=t.checked;S._force=true;render();}
  else if(t.dataset.ptrz!==undefined&&S.dlg&&S.dlg.kind==='ptr'){const g=S.dlg,s0=g.base*g.z,cx=(130-g.x)/s0,cy=(130-g.y)/s0;g.z=+t.value;const s1=g.base*g.z;g.x=130-cx*s1;g.y=130-cy*s1;ptrClamp(g);ptrPaint();}
  else if(t.dataset.rfq!==undefined){S.rfq=t.value;S._force=true;const pos=t.selectionStart;render();const i=q0('[data-rfq]');if(i){i.focus();try{i.setSelectionRange(pos,pos);}catch(e){}}}
  else if(t.dataset.rfk!==undefined&&S.rf){S.rf[t.dataset.rfk]=t.value;if(t.dataset.rfk==='sing'||t.dataset.rfk==='fem'){const b=q0('[data-act="rfSave"]');if(b)b.disabled=!((S.rf.sing||'').trim()||(S.rf.fem||'').trim());}}
  else if(t.dataset.rfc!==undefined&&S.rf){S.rf.car[t.dataset.rfc][+t.dataset.m]=t.value;}
  else if(t.dataset.fxcf!==undefined){const ctx=fxCtx(t.dataset.c);if(ctx&&ctx.fxEd){const f=t.dataset.fxcf;if(f==='fut'){const v=t.value.trim();if(v)ctx.fxEd.cible='fut:'+v;else if(/^fut:/.test(ctx.fxEd.cible||''))ctx.fxEd.cible='';}else ctx.fxEd[f]=t.value; /* recette lot C : Jet sur une compétence futile (cible « fut:Nom ») */const b=document.querySelector(`[data-act="fxcAdd"][data-c="${t.dataset.c}"]`);if(b)b.disabled=!fxOkEd(ctx.fxEd);}}
  else if(t.dataset.pwe!==undefined&&S.dlg){S.dlg[t.dataset.pwe]=t.value;S.dlg.err='';}
  else if(t.dataset.pwv!==undefined&&S.dlg&&S.dlg.vEd){S.dlg.vEd[t.dataset.pwv]=t.value;S.dlg.vEd.err='';}
  else if(t.dataset.pq!==undefined){if(t.dataset.pq==='cap')S.cq=t.value;else S.pq=t.value;S._force=true;render();const el=document.querySelector('[data-pq]');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}}
  else if(t.dataset.rfpwd!==undefined&&S.rf&&S.rf.pwx){const x=S.rf.pwx[+t.dataset.rfpwd];if(x){x.desc=t.value;x.dirty=true;}}
  else if(t.dataset.pv!==undefined){pDraft().v[t.dataset.pv]=t.value;pDirtyOn();}
  else if(t.dataset.pdate!==undefined){pDraft().date=t.value;}
  else if(t.dataset.prk!==undefined){pDraft().v.pnj[+t.dataset.prk][t.dataset.pk]=t.value;pDirtyOn();}
  else if(t.dataset.rffx!==undefined&&S.rf&&S.rf.fxEd){S.rf.fxEd[t.dataset.rffx]=t.value;const e=S.rf.fxEd,ok=e.t==='rap'?(e.txt||'').trim():e.t==='perm'?e.cible&&+e.val:+e.val,b=q0('[data-act="rfFxAdd"]');if(b)b.disabled=!ok;}
  else if(t.dataset.rf2!==undefined&&S.rf){S.rf[t.dataset.rf2][+t.dataset.i][+t.dataset.p]=t.value;}
  else if(t.dataset.rfpw!==undefined&&S.rf){S.rf.pw[+t.dataset.rfpw][0]=t.value;}
  else if(t.dataset.rfpwq!==undefined&&S.rf){S.rf.pw[+t.dataset.rfpwq][2]=t.value;}
  else if(t.dataset.rfat!==undefined&&S.rf){S.rf.at[+t.dataset.rfat][+t.dataset.p]=t.value;}
  else if(t.dataset.rfsp!==undefined&&S.rf){S.rf[t.dataset.rfsp][+t.dataset.i][+t.dataset.p]=t.value;}
  else if(t.dataset.rft!==undefined&&S.rf){S.rf.typ[+t.dataset.rft][+t.dataset.p]=t.value;}
  else if(t.dataset.ato!==undefined){S.spOther=S.spOther||{};S.spOther[S.sel+'|atout']=t.value;}
  else if(t.dataset.spo!==undefined){S.spOther=S.spOther||{};S.spOther[S.sel+'|'+t.dataset.spo]=t.value;}
  else if(t.dataset.spt!==undefined&&S.sheet){S.sheet.sp={...(S.sheet.sp||{}),txt:t.value};const b=q0('#sheetRoot [data-act="specAdd"]');if(b){const nm=t.value.trim();b.disabled=!nm;}}
  else if(t.dataset.ppv!==undefined&&S.dlg&&S.dlg.kind==='pp'){S.dlg[t.dataset.ppv]=t.value;if(t.dataset.ppv==='spent'){const c=S.chars[S.dlg.cid],pr=c&&c.profils.find(x=>x.nom===S.dlg.prof),have=pr&&pr.note!=null&&pr.note!==''?+pr.note:0,n=+String(t.value).replace(',','.')||0,b=q0('#sheetRoot [data-act="ppSave"]'),inf=q0('#ppinfo');if(b)b.disabled=!(n>0);if(inf)inf.innerHTML=(n>0&&!isNaN(have)?`Il restera ${esc(ppFmt(have-n))} PP. `:'')+`Atteindre le rang N de ce profil ajoute N PP automatiquement. La dépense est inscrite dans l'historique des achats et peut y être annulée.`;}}
  else if(pfInput(t,'input')||riInput(t,'input')){}
  else if(t.dataset.nm!==undefined){S.nameForm.nom=t.value;}
  else if(t.dataset.dn!==undefined){S.dlg.nom=t.value;}
  else if(t.dataset.dp!==undefined){S.dlg.pts=t.value;}
  else if(t.dataset.dpn!==undefined&&S.dlg){S.dlg.pnj=t.value;S._force=true;render();}
  else if(t.dataset.gm!==undefined&&S.dlg){S.dlg.motif=t.value;}
  else if(t.dataset.pd!==undefined&&S.dlg){S.dlg[t.dataset.pd]=t.value;if(t.dataset.pd==='date'){const b=q0('#sheetRoot [data-act="pdOk"]');if(b)b.disabled=!(t.value&&t.value>=today());}}
  else if(t.dataset.nv!==undefined&&S.dlg&&S.dlg.kind==='ne'){S.dlg.vals[t.dataset.nv]=t.value;}
  else if(t.dataset.nem!==undefined&&S.dlg&&S.dlg.kind==='ne'){S.dlg.m=t.value;}
  else if(t.dataset.sd!==undefined&&S.dlg){S.dlg[t.dataset.sd]=t.value;if(S.dlg.kind==='sn'&&t.dataset.sd==='type'){const L=xpEvOf(t.value);S.dlg.evt=t.value==='Vie du fief'?'':L[0]?L[0].id:'__new';S._force=true;render();return;}if((S.dlg.kind==='sn'&&t.dataset.sd==='evt')||(S.dlg.kind==='sm'&&t.dataset.sd==='type')){S._force=true;render();return;}if(t.dataset.sd==='titre'||t.dataset.sd==='evNom'){const b=q0('#sheetRoot [data-act="sessCreate"],#sheetRoot [data-act="sessSave"]');if(b)b.disabled=!sdOk(S.dlg);}if(S.dlg.kind==='rat'){const g=S.dlg,b=q0('#sheetRoot [data-act="ratOk"]'),n=Math.floor(+g.montant||0);if(b){b.disabled=!(n>0&&g.who.length&&(g.titre||'').trim());b.textContent='Attribuer '+n+' XP';}}}
  else if(t.dataset.sxs!==undefined&&S.dlg){S.dlg.sess=t.value;if(S.dlg.gain){S._force=true;render();}}
  else if(t.dataset.cr!==undefined&&S.dlg){S.dlg.nom=t.value;const v=t.value.trim(),dup=!!v&&S.creatures.some(c=>c.id!==S.dlg.id&&c.nom.toLowerCase()===v.toLowerCase());const b=q0('#sheetRoot [data-act="creAddOk"],#sheetRoot [data-act="creSave"]');if(b)b.disabled=!v||dup;const w=document.getElementById('crdup');if(w)w.style.display=dup?'':'none';}
  else if(t.dataset.sx!==undefined&&S.dlg){S.dlg.txt=t.value;const b=q0('#sheetRoot [data-act="sxOk"],#sheetRoot [data-act="seSave"],#sheetRoot [data-act="propSend"]');if(b)b.disabled=!t.value.trim();}
  else if(t.dataset.rvt!==undefined&&S.dlg&&S.dlg.kind==='rv'){S.dlg.txt=t.value;const b=q0('#sheetRoot [data-act="rvOk"]');if(b)b.disabled=!t.value.trim();}
  const q=s=>document.querySelector(s);
  if(t.dataset.k==='montant'){const b=q('[data-act="sessAdd"]');if(b){const cs=curSession();b.disabled=!(cs&&S.form.lines.some(l=>+l.montant>0&&slp(l,cs).length));}}
  if(t.dataset.f==='titre'||t.dataset.k==='montant'){const b=q('[data-act="gainSave"]');if(b){const f=S.form;b.disabled=!(f.titre.trim()&&(f.lines.some(l=>+l.montant>0&&lp(l).length)||(f.editId&&(f.keep||[]).length)));}}
  if(t.dataset.pnj){const b=q('[data-act="pnjXp"]');if(b)b.disabled=!(S.pnjForm.titre.trim()&&+S.pnjForm.montant>0);}
  if(t.dataset.nm!==undefined){const b=q('[data-act="nameAdd"]');if(b)b.disabled=!S.nameForm.nom.trim()||b.dataset.full==='1';}
  if(t.dataset.dp!==undefined){const c=S.chars[S.dlg.id],dispo=summary(c,S.events).dispo,p=Math.floor(+t.value)||0,b=q('#sheetRoot [data-act="dlgOk"]'),af=document.getElementById('dafter');if(b)b.disabled=!(p>=1&&p<=dispo&&(S.dlg.nom!=='PNJ'||pnjOf(c).length===1||S.dlg.pnj));if(af)af.textContent=(dispo-p)+' XP';document.querySelectorAll('#sheetRoot [data-xn]').forEach(x=>x.textContent=p||'…');}
  if(t.dataset.dn!==undefined){const b=q('[data-act="dlgOk"]');if(b)b.disabled=!(S.dlg.nom||'').trim();}
  if(t.dataset.np){const b=q('[data-act="addP"]');if(b)b.disabled=!S.newP.nom.trim();}
});
document.addEventListener('change',ev=>{
  {const t0=ev.target;if(t0&&t0.dataset&&t0.dataset.cwsitf&&t0.value){cwAct('cwSitF',{k:t0.dataset.cwsitf,v:t0.value});return;}}
  {const t0=ev.target;if(t0&&t0.dataset&&t0.dataset.cwrace&&t0.value){cwAct('cwRace',{v:t0.value});return;}}
  {const t0=ev.target;if(t0&&t0.dataset&&t0.dataset.pprub&&S.dlg){S.dlg.rub=t0.value;S._force=true;render();return;}}
  {const t0=ev.target;if(t0&&t0.dataset&&t0.dataset.xpdelev){S.xpDelEv=t0.checked;return;}}
  if(editorOpen())S.edDirty=true;
  const t=ev.target;S._force=true;
  if(cwInput(t,'change'))return; /* lot C */
  {const sr=socleInput(t,'change');if(sr){if(sr==='r')render();return;}}
  if(t.dataset.cursess){S.curSess=t.value;render();}
  else if(t.dataset.spoff!==undefined&&S.sheet){S.sheet.sp={...(S.sheet.sp||{}),off:t.checked};renderSheet();}
  else if(t.dataset.acc!==undefined&&S.sheet){const c=clone(S.chars[S.sheet.id]);if(t.checked){if(c.accru&&c.accru!==t.dataset.acc){t.checked=false;return;}c.accru=t.dataset.acc;}else if(c.accru===t.dataset.acc)c.accru=null;saveChar(c);}
  else if(t.dataset.her){if(!isTech())return;S.heritage={score:t.value,delta:0};persist('meta/heritage',S.heritage);}
  else if(t.dataset.note!==undefined){const c=clone(S.chars[S.sel]);const p=c.profils.find(x=>x.nom===t.dataset.note);const v=t.value.trim();p.note=v===''?null:(isNaN(+v)?v:+v);saveChar(c);}
  else if(t.dataset.k==='nature'){S.form.lines[+t.dataset.l].persos=null;render();}
  else if(t.dataset.k==='fief'&&t.dataset.l!==undefined){S.form.lines[+t.dataset.l].fief=t.value;render();} /* lot 7 */
  else if(t.dataset.me&&!pinOn()){ME=t.value||null;try{if(ME)localStorage.setItem('xp.me',ME);else localStorage.removeItem('xp.me');}catch(e){}render();}
  else if(t.dataset.owner){if(S.dlg&&S.dlg.kind==='pc'){S.dlg.own=t.value||'';render();}}
  else if(t.dataset.pf){if(!canEditP(S.players[t.dataset.pid])||(t.dataset.pf==='role'&&(!isGest()||lastMJ(S.players[t.dataset.pid]))))return;const p=clone(S.players[t.dataset.pid]);p[t.dataset.pf]=t.dataset.pf==='nom'?(t.value.trim()||p.nom):t.value;savePlayer(p);}
  else if(t.dataset.rfa!==undefined&&S.rf){const k=t.dataset.rfa,a=S.rf.acc;S.rf.acc=t.checked?(a.includes(k)?a:[...a,k]):a.filter(x=>x!==k);render();}
  else if(t.dataset.rfjump!==undefined){S.rf=rfDraft(t.value);render();}
  else if(t.dataset.rfk==='ca'&&S.rf){S.rf.ca=t.value;S.rf.cb='';render();}
  else if(t.dataset.rfpw!==undefined&&S.rf){S.rf.pw[+t.dataset.rfpw][0]=t.value;render();}
  else if(t.dataset.rfpwq!==undefined&&S.rf){S.rf.pw[+t.dataset.rfpwq][2]=t.value;render();}
  else if((t.dataset.rfk==='fam'||t.dataset.rfk==='pa'||t.dataset.rfk==='pb'||t.dataset.rft!==undefined)&&S.rf){if(t.dataset.rft!==undefined)S.rf.typ[+t.dataset.rft][+t.dataset.p]=t.value;else S.rf[t.dataset.rfk]=t.value;render();}
  else if(t.dataset.ptrfile){const f=t.files&&t.files[0],cid=t.dataset.ptrfile,lab=t.dataset.plab||'',back=S.dlg&&S.dlg.kind!=='ptr'?S.dlg:null;t.value='';if(!f)return;const rd=new FileReader();
    rd.onload=()=>{const im=new Image();im.onload=()=>{window._ptrImg=im;const w=im.naturalWidth,h=im.naturalHeight,base=Math.max(220/w,220/h);S.dlg={kind:'ptr',cid,lab,back,src:rd.result,w,h,base,z:1,x:130-w*base/2,y:130-h*base/2};S._force=true;render();};im.src=rd.result;};rd.readAsDataURL(f);}
  else if(t.dataset.cf&&!canEditC(S.chars[t.dataset.id])){render();}
  else if(pfInput(t,'change')||riInput(t,'change')){}
  else if(t.dataset.cf==='race'){if(S.chars[t.dataset.id].race&&!canEdit()&&S.chars[t.dataset.id].type!=='PNJ')return;let c=clone(S.chars[t.dataset.id]);c.race=t.value||null;if(c.race&&c.creation&&!c.spPred)c=grantPredSp(c);saveChar(c);}
  else if(t.dataset.cf==='kanka'){if(!canEdit())return;const c=clone(S.chars[t.dataset.id]);const v=t.value.trim();if(v&&!/^https?:\/\//.test(v)){render();return;}c.kanka=v;saveChar(c);}
  else if(t.dataset.cfeal){const c0=S.chars[t.dataset.cfeal];if(!c0||!canEditC(c0))return;const c=clone(c0);if(t.checked)c.feal=true;else delete c.feal;saveChar(c);} /* lot 4 : PNJ humain féal non rattaché */
  else if(t.dataset.cf==='pj'){const c=clone(S.chars[t.dataset.id]);const v=t.value||null;if(v!==(c.pj||null)){c.pj=v;c.pjDate=v?today():null;}saveChar(c);}
  else if(t.dataset.cf){const c=clone(S.chars[t.dataset.id]);const k=t.dataset.cf;c[k]=k==='statut'||k==='genre'?t.value:k==='aka'?t.value.split(',').map(x=>x.trim()).filter(Boolean).join(', '):k==='surnom'||k==='idm'?t.value.trim():(t.value.trim()||c[k]);saveChar(c);} /* lot 8 : surnom et identité masquée effaçables */
  else if(t.dataset.np==='role'){render();}
});
document.addEventListener('focusout',()=>{setTimeout(()=>{if(S.dirty&&!(document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))){S._force=true;render();}},60);});


