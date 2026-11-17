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
  const a=t.dataset.act,d=t.dataset;S._force=true;
  const cur=()=>S.chars[S.sheet&&S.sheet.id];
  if(/^(rfSave|rfDel|rfDelOk|rfHumSave|rfNew|rfPredAdd|rfPredDel|rfAtAdd|rfAtDel|rfSpAdd|rfSpDel|rf2Add|rf2Del|rfChAdd|rfChDel|rfPwUnk|rfFxNew|rfFxDel|rfFxT|rfFxQ|rfFxAdd|rfFxCancel|rfPwOpen)$/.test(a)&&!isGest())return; /* Référentiel : modification réservée à la gestion */
  if(S.visit&&!VISIT_OK.has(a))return; /* visiteur : lecture seule */
  if(a==='tab'&&d.v==='ref'){d.v='univers';S.uni='creatures';}
  if(a==='tab'&&d.v==='players')pinRefresh();
  if(a==='tab'){ev.preventDefault();if(d.v==='univers')S.sec=null;if(d.v==='ref')S.rf=null;if(d.pv)S.plan.view=d.pv;S.view=d.v;S.sheet=null;S.asheet=null;S.dlg=null;S.confirm=null;window.scrollTo(0,0);}
  else if(a==='sel'){S.sel=d.id;S.nameForm={kind:null,nom:''};S.view='sheet';S.sheet=null;S.futForm.open=false;window.scrollTo(0,0);}
  else if(a==='open'){const c=S.chars[S.sel],r=ref(c,d.key);const cu=r.o.cur||0;const pl=(c.plan||{})[d.key];S.sheet={id:c.id,key:d.key,to:pl&&pl>cu?pl:cu+1,fix:false,fixCur:cu,fixMax:r.max,sp:{}};}
  else if(a==='closeSheet'){S.sheet=null;S.asheet=null;S.dlg=null;if(S.id.state==='ok')S.pinF=null;}
  else if(a==='menu'){S.dlg={kind:'menu'};}
  else if(a==='pushOn'){pushEnable();return;}
  else if(a==='pushOff'){pushDisable();return;}
  else if(a==='setMe'){const old=ME;ME=d.id;try{localStorage.setItem('xp.me',ME);}catch(e){}S.dlg=null;S._force=true;
    if(S.pushSub&&old!==ME){const js=S.pushSub.toJSON(),ep=js.endpoint;for(const pp of Object.values(S.players)){if(pp.id!==ME&&(pp.push||[]).some(x=>x.endpoint===ep)){const n=clone(pp);n.push=n.push.filter(x=>x.endpoint!==ep);savePlayer(n);}}
      const me=S.players[ME];if(me&&!(me.push||[]).some(x=>x.endpoint===ep)){const n=clone(me);n.push=[...(n.push||[]),{endpoint:ep,keys:js.keys}];savePlayer(n);}}}
  else if(a==='pTab'){S.pTab=d.v;}
  else if(/^fxc/.test(a)){if(!isGest())return;fxcAct(a,d);}
  else if(a==='pwEdit'){if(!isGest())return;const p=d.id?pwCat(d.id):null;S.confirm=null;S.dlg={kind:'pwEdit',id:d.id||null,nom:p?p.nom:'',desc:p&&p.desc||'',fx:clone(p&&p.fx||[]),fxEd:null};}
  else if(a==='pwSave'){if(!isGest())return;pwSave();return;}
  else if(a==='pwDel'){if(!isGest())return;S.confirm='pwdel:'+S.dlg.id;}
  else if(a==='pwDelOk'){if(!isGest())return;const id=S.dlg.id;if(pwUses(id).length||pwCharsUsing(id).length)return;const P={...S.pouvoirs};delete P[id];S.pouvoirs=P;persist('meta/pouvoirs',{byId:P});S.dlg=null;S.confirm=null;}
  else if(a==='pwToggle'){S.pwOpen={...(S.pwOpen||{}),[d.id]:!(S.pwOpen||{})[d.id]};}
  else if(a==='pwPick'){if(!canEditC(S.chars[d.id]))return;S.dlg={kind:'pwPick',id:d.id,i:+d.i};}
  else if(a==='pwPickOk'){pwPickOk();return;}
  else if(a==='pwRemove'){if(!isGest())return;S.confirm='pwr:'+d.id+':'+d.i;}
  else if(a==='pwRemoveOk'){if(!isGest())return;const c=clone(S.chars[d.id]);c.pw=(c.pw||[]).filter(o=>o.i!==+d.i);S.confirm=null;saveChar(c);return;}
  else if(a==='rfPwOpen'){const i=+d.i;S.rf.pwOpen=S.rf.pwOpen===i?null:i;S.rf.pwx=S.rf.pwx||{};if(S.rf.pwOpen!=null&&!S.rf.pwx[i]){const id=pwIdByName(S.rf.pw[i][0]||'');const p=id?pwCat(id):{};S.rf.pwx[i]={desc:p.desc||'',fx:clone(p.fx||[]),fxEd:null,dirty:false};}}
  else if(a==='plOpen'){S.confirm=null;S.dlg={kind:'pl',id:d.pid};pinRefresh();}
  else if(a==='pcOpen'){S.dlg={kind:'pc',id:d.id};}
  else if(a==='pcSheetGo'){S.dlg=null;S.view='sheet';S.sel=d.id;window.scrollTo(0,0);}
  else if(a==='newPOpen'){if(!isGest())return;S.dlg={kind:'newp'};}
  else if(a==='newCOpen'){S.newC={...S.newC,owner:isGest()?S.newC.owner:(ME||'')};S.dlg={kind:'newc'};}
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
  else if(a==='dPropose'){S.dlg={kind:'pd',date:'',sl:'S',type:'Scénario',note:''};}
  else if(a==='pdSl'){S.dlg.sl=d.sl;}
  else if(a==='pdOk'){const g=S.dlg;if(!g.date||g.date<today())return;S.dlg=null;const x={id:'d'+Date.now().toString(36),date:g.date,sl:g.sl,type:g.type,note:(g.note||'').trim(),by:ME||null,status:'prop'};
    if(ME&&S.players[ME]){const pl=clone(S.players[ME]);pl.rep={...(pl.rep||{}),[x.id]:'ok'};savePlayer(pl);}saveDates([...S.dates,x]);setTimeout(()=>notify({kind:'prop',dateId:x.id,from:ME||null}),2500);return;}
  else if(a==='dValidFree'){const x={id:'d'+Date.now().toString(36),date:d.date,sl:d.sl,type:'Scénario',note:'',by:ME||null,status:'valid'};if(d.end&&(d.end!==d.date||d.endsl!==d.sl)){x.endDate=d.end;x.endSl=d.endsl;}saveDates([...S.dates,x]);return;}
  else if(a==='dValid'){const x0=S.dates.find(x=>x.id===d.id);if(x0&&mjRefus(x0))return;saveDates(S.dates.map(x=>x.id===d.id?{...x,status:'valid'}:x));return;}
  else if(a==='dUnvalid'){saveDates(S.dates.map(x=>x.id===d.id?{...x,status:'prop'}:x));return;}
  else if(a==='dDel'){const k='dd:'+d.id;if(S.confirm!==k){S.confirm=k;}else{S.confirm=null;saveDates(S.dates.filter(x=>x.id!==d.id));return;}}
  else if(a==='dRep'){if(!ME||!S.players[ME])return;const pl=clone(S.players[ME]);pl.rep={...(pl.rep||{})};const was=pl.rep[d.id];if(was===d.r)delete pl.rep[d.id];else pl.rep[d.id]=d.r;savePlayer(pl);
    if(isMJ(pl)&&pl.rep[d.id]==='no'&&was!=='no')setTimeout(()=>notify({kind:'refus',dateId:d.id,from:ME}),2500);return;}
  else if(a==='planView'){S.plan.view=d.v;}
  else if(a==='planMonth'){let m=S.plan.m+(+d.d),y=S.plan.y;if(m<0){m=11;y--;}if(m>11){m=0;y++;}S.plan.m=m;S.plan.y=y;S.plan.open=null;}
  else if(a==='planOpen'){S.plan.open=S.plan.open===d.k?null:d.k;}
  else if(a==='planSet'){const p0=S.players[d.p];if(!p0)return;const pl=clone(p0);pl.dispo=pl.dispo||{};if(pl.dispo[d.k])delete pl.dispo[d.k];else pl.dispo[d.k]=true;savePlayer(pl);return;}
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
  else if(a==='sessNew'){S.dlg={kind:'sn',type:'Scénario',titre:sessPrefix('Scénario'),date:today(),pj:allPJ()};}
  else if(a==='sdPj'){const w=S.dlg.pj||[];S.dlg.pj=w.includes(d.id)?w.filter(x=>x!==d.id):[...w,d.id];}
  else if(a==='sessEdit'||a==='sessEditId'){const e=a==='sessEdit'?curSession():sessById(d.id);if(!e)return;S.dlg={kind:'sm',id:e.id,type:evType(e),titre:e.titre||'',date:e.date||'',confirm:false,pj:presents(e)};}
  else if(a==='sessCreate'){const g=S.dlg,t=(g.titre||'').trim();if(!t)return;S.dlg=null;const e={id:'g'+Date.now().toString(36),session:true,date:g.date||today(),titre:t,type:g.type||'Scénario',entries:[],pnj:{},pj:g.pj||[]};S.curSess=e.id;saveEvents([...S.events,e]);return;}
  else if(a==='sessSave'){const g=S.dlg,t=(g.titre||'').trim();if(!t)return;S.dlg=null;const pj=g.pj||[];
    saveEvents(S.events.map(e=>{if(e.id!==g.id)return e;const ch=pjIds();let en=e.entries;
      const sc=en.filter(x=>x.nature==='Scénario'&&x.montant&&ch.includes(x.perso));
      if(sc.length){const m=+modeOf(sc.map(x=>x.montant));en=en.filter(x=>!(x.nature==='Scénario'&&ch.includes(x.perso)&&!pj.includes(x.perso)));
        for(const p of pj)if(!en.some(x=>x.nature==='Scénario'&&x.perso===p))en=[...en,{perso:p,nature:'Scénario',montant:m}];}
      return {...e,titre:t,type:g.type,date:g.date||e.date,pj,entries:en};}));return;}
  else if(a==='sessDel'){if(!sessChildren(S.dlg.id).length)S.dlg.confirm=true;}
  else if(a==='sessDelOk'){const id=S.dlg.id;S.dlg=null;if(sessChildren(id).length){render();return;}if(S.curSess===id)S.curSess=null;saveEvents(S.events.filter(e=>e.id!==id));return;}
  else if(a==='sessAdd'){const cs=curSession();if(!cs)return;const add=[];for(const l of S.form.lines){const m=+l.montant;if(m>0)for(const pp of slp(l,cs))add.push({perso:pp,nature:l.nature,montant:m});}if(!add.length)return;
    S.form={titre:'',type:'Scénario',date:today(),lines:[{nature:'Scénario',montant:'',persos:null}]};saveEvents(S.events.map(e=>e.id===cs.id?{...e,entries:[...e.entries,...add]}:e));return;}
  else if(a==='pnjToggle'){const cs=curSession();if(!cs)return;const pn={...(cs.pnj||{})};pn[d.id]=!pn[d.id];saveEvents(S.events.map(e=>e.id===cs.id?{...e,pnj:pn}:e));return;}
  else if(a==='sessLineDel'){const key='l:'+d.id+':'+d.k;if(S.confirm!==key){S.confirm=key;}else{S.confirm=null;const [n,m]=d.k.split('|');saveEvents(S.events.map(e=>e.id===d.id?{...e,entries:e.entries.filter(en=>!(en.nature===n&&String(en.montant)===m&&pjIds().includes(en.perso)))}:e));return;}}
  else if(a==='creAdd'){S.dlg={kind:'ca',nom:'',fam:'trad'};}
  else if(a==='creFam'){S.dlg.fam=d.f;}
  else if(a==='creAddOk'){const g=S.dlg,nom=(g.nom||'').trim();if(!nom||S.creatures.some(c=>c.nom.toLowerCase()===nom.toLowerCase()))return;S.dlg=null;saveCreatures([...clone(S.creatures),{id:creSlug(nom),nom,fam:g.fam,done:false}]);render();return;}
  else if(a==='eye'){if(!isGest())return;const sess=(sessList()[0]||{}).id||'';
    if(d.t==='sec'){const s=secById(+d.n);if(!s)return;const x=d.k==='titre'?null:s.slots[d.k][+d.i];const cur=d.k==='titre'?!s.titreHid:!!(x&&!x.hid);S.dlg={kind:'eye',t:'sec',n:+d.n,k:d.k,i:+d.i||0,open:!cur,sess};}
    else{const cr=S.creatures.find(c=>c.id===d.id);if(!cr)return;const e=eyeOf(cr,raceRec(cr)),cur=d.k==='pw'?!!(e.pw||[])[+d.i]:!!e[d.k];S.dlg={kind:'eye',t:'race',id:d.id,k:d.k,i:+d.i||0,open:!cur,sess};}}
  else if(a==='eyeOk'){const g=S.dlg;S.dlg=null;if(!isGest()){render();return;}if(g.t==='sec')secEyeSet(g.n,g.k,g.i,g.open,g.sess);else raceEyeSet(g.id,g.k,g.i,g.open,g.sess);return;}
  else if(a==='creToggle'){if(!isGest())return;S.dlg={kind:'ct',id:d.id,sess:(sessList()[0]||{}).id||''};}
  else if(a==='creToggleOk'){if(!isGest())return;const g=S.dlg;S.dlg=null;creToggle(g.id,g.sess);return;}
  else if(a==='creEdit'){const c=S.creatures.find(x=>x.id===d.id);if(!c)return;const ev=creEv(c.id);S.dlg={kind:'ce',id:c.id,nom:c.nom,fam:c.fam,confirm:false,sess:ev?(ev.sessionId||''):''};}
  else if(a==='creSess'){const g=S.dlg;S.dlg=null;const ev=creEv(g.id);if(!ev){render();return;}const sid=g.sess&&sessById(g.sess)?g.sess:undefined;saveEvents(S.events.map(e=>{if(e!==ev)return e;const x={...e};if(sid)x.sessionId=sid;else delete x.sessionId;return x;}));return;}
  else if(a==='creSave'){const g=S.dlg,nom=(g.nom||'').trim();if(!nom||S.creatures.some(c=>c.id!==g.id&&c.nom.toLowerCase()===nom.toLowerCase()))return;S.dlg=null;saveCreatures(clone(S.creatures).map(c=>c.id===g.id&&!c.done?{...c,nom,fam:g.fam}:c));render();return;}
  else if(a==='creDel'){S.dlg.confirm=true;}
  else if(a==='creDelOk'){const id=S.dlg.id,cr=S.creatures.find(c=>c.id===id);S.dlg=null;if(cr&&playedBy(raceRec(cr).sing).length){alert('Cette race est jouée par un personnage : elle ne peut pas être supprimée.');return;}saveCreatures(S.creatures.filter(c=>!(c.id===id&&!c.done)));if(cr&&!cr.done&&S.races&&S.races[id]){const m={...S.races};delete m[id];S.races=m;persist('meta/races',{byId:m});rebuildRaces();}render();return;}
  else if(a==='uni'){S.uni=d.v;S.sec=null;S.rf=null;}
  else if(a==='secFilter'){S.secFilter=d.v;}
  else if(a==='secOpen'){S.sec=+d.n;window.scrollTo(0,0);}
  else if(a==='secBack'){S.sec=null;}
  else if(a==='secAdd'){const s=secById(S.sec);if(!s)return;const k=!s.titre?'titre':['vm','vmin','h'].find(x=>secFree(s,x));if(!k)return;S.dlg={kind:'sx',n:s.n,k,txt:'',sess:(sessList()[0]||{}).id||''};}
  else if(a==='sxKind'){S.dlg.k=d.k;}
  else if(a==='sxOk'){const g=S.dlg,txt=(g.txt||'').trim();S.dlg=null;if(txt)secConsign(g.n,g.k,txt,g.sess,!!g.hid&&isGest());else render();return;}
  else if(a==='secEntry'){const s=secById(S.sec);if(!s)return;const x=d.k==='titre'?s.titre:(s.slots[d.k][+d.i]||{}).txt;const ev0=secEv(s.n,d.k,+d.i);S.dlg={kind:'se',n:s.n,k:d.k,i:+d.i,txt:x||'',confirm:false,sess:ev0?(ev0.sessionId||''):''};}
  else if(a==='seSave'){const g=S.dlg,txt=(g.txt||'').trim();S.dlg=null;if(!txt){render();return;}
    const ev0=secEv(g.n,g.k,g.i);if(ev0&&(ev0.sessionId||'')!==(g.sess||'')){const sid=g.sess&&sessById(g.sess)?g.sess:undefined;
      saveEvents(S.events.map(e=>{const mv=e===ev0||(e.secret&&e.secret.n===g.n&&e.secret.k==='bonus'&&e.trigger&&e.trigger.k===g.k&&e.trigger.i===g.i);if(!mv)return e;const x={...e};if(sid)x.sessionId=sid;else delete x.sessionId;return x;}));}
    secEdit(g.n,g.k,g.i,txt);return;}
  else if(a==='seDel'){S.dlg.confirm=true;}
  else if(a==='seDelOk'){const g=S.dlg;S.dlg=null;secRemove(g.n,g.k,g.i);return;}
  else if(a==='autrePlus'){S.dlg={kind:'a',id:S.sel,nom:d.nom,pts:''};}
  else if(a==='openAutre'){S.dlg={kind:'u',id:S.sel,nom:d.nom};}
  else if(a==='nameOpen'){S.nameForm={kind:d.kind,nom:''};}
  else if(a==='nameClose'){S.nameForm={kind:null,nom:''};}
  else if(a==='nameAdd'){const k=S.nameForm.kind,nom=S.nameForm.nom.trim(),c0=S.chars[S.sel];if(!k||!nom||!c0)return;const c=clone(c0);if(k==='atout'&&c.atout.max!=null&&(c.atout.cur||0)>=c.atout.max)return;c.noms=c.noms||{atout:[],spec:[]};c.noms[k]=c.noms[k]||[];c.noms[k].push(nom);c[k].cur=(c[k].cur||0)+1;S.nameForm.nom='';saveChar(c);return;}
  else if(a==='nameDel'){const c=clone(S.chars[S.sel]),k=d.kind;if(!c.noms||!c.noms[k])return;c.noms[k].splice(+d.i,1);c[k].cur=Math.max(0,(c[k].cur||0)-1);saveChar(c);return;}
  else if(a==='heart'){const c=clone(S.chars[S.sel]),r=ref(c,d.key);if(!r)return;const cu=r.o.cur||0;c.plan=c.plan||{};if((c.plan[d.key]||0)>cu)delete c.plan[d.key];else if(r.max==null||cu<r.max)c.plan[d.key]=cu+1;saveChar(c);return;}
  else if(a==='quick'){const c=S.chars[S.sel],r=c&&ref(c,d.key);if(!r)return;const cu=r.o.cur||0;if(r.max!=null&&cu>=r.max)return;if(lvlCost(r.kind,cu+1)>summary(c,S.events).dispo)return;S.dlg={kind:'b',id:c.id,key:d.key,from:cu,nom:''};}
  else if(a==='undoLvl'){const u=undoLevel(cur(),S.sheet.key);S.sheet=null;if(u)saveChar(u.c);return;}
  else if(a==='step'){S.sheet.to+= +d.d;}
  else if(a==='specToggle'){S.specOpen=S.specOpen||{};const k=S.sel+'|'+d.key;S.specOpen[k]=!S.specOpen[k];}
  else if(a==='spBuy'||a==='spBuyO'){const c0=S.chars[S.sel];if(!c0)return;const key=d.key;let nom=a==='spBuy'?d.nom:((S.spOther||{})[c0.id+'|'+key]||'').trim();if(!nom)return;
    if(key==='comp:Culture'&&a==='spBuyO'&&LANGS.includes(nrm(nom)))nom='Langue : '+nom;
    if(specsOf(c0).some(x=>x.cible===key&&nrmS(x.nom)===nrmS(nom)))return;
    let c;if(specAnon(c0)>0){c=clone(c0);c.specs=[...specsOf(c),{nom,cible:key}];}
    else{const k=specCost(key,nom);if(k>summary(c0,S.events).dispo)return;c=buySpec(c0,key,nom,k,today());}
    if(a==='spBuyO'&&S.spOther)delete S.spOther[c0.id+'|'+key];saveChar(c);return;}
  else if(a==='rfOpen'){S.dlg=null;S.view='univers';S.uni='creatures';S.rf=rfDraft(d.id);window.scrollTo(0,0);}
  else if(a==='rfNew'){S.rf=rfDraft(null);window.scrollTo(0,0);}
  else if(a==='raceFull'){if(!isGest())return;const cr=S.creatures.find(c=>c.id===d.id);if(!cr||eyeFull(eyeOf(cr,raceRec(cr))))return;S.dlg={kind:'eye',t:'race',id:d.id,k:'all',i:0,open:true,sess:(sessList()[0]||{}).id||''};}
  else if(a==='rfBack'){S.rf=null;}
  else if(a==='rfFlt'){S.rff=d.v;}
  else if(a==='rfFam'){S.rffam=S.rffam===d.v?'':d.v;}
  else if(a==='rfUni'){ev.preventDefault();S.view='univers';S.uni='creatures';S.rf=null;}
  else if(a==='rfPredDel'){S.rf[d.k].splice(+d.i,1);}
  else if(a==='rfPredAdd'){const g=S.rf;if(d.k==='pred'){if(!g.pa)return;g.pred.push(g.pb&&g.pb!==g.pa?[g.pa,g.pb]:g.pa);g.pa='';g.pb='';}else{const x=(g.fa||'').trim(),y=(g.fb||'').trim();if(!x)return;g.fut.push(y?[x,y]:x);g.fa='';g.fb='';}}
  else if(a==='rfAtAdd'){S.rf.at.push(['','']);}
  else if(a==='forme'){S.forme=d.v;}
  else if(a==='ptab'){S.ptab=d.v;S.psaved=false;}
  else if(a==='pSave'){if(!isGest())return;const g=S.pd;if(!g||!g.date)return;const v={...g.v};for(const t in PARAM_DEF)for(const [k] of PARAM_DEF[t])if(k!=='ppBareme'&&v[k]!=='')v[k]=+v[k];v.pnj=(v.pnj||[]).filter(r=>(r.nom||'').trim()).map(r=>({nom:r.nom.trim(),car:r.car===''?'':+r.car,prof:r.prof===''?'':+r.prof}));
    const L=((S.params&&S.params.versions)||[]).filter(x=>x.date!==g.date);L.push({date:g.date,v});S.params={versions:L};persist('meta/params',S.params);applyParams();S.pd=null;S.psaved=true;}
  else if(a==='pDef'){if(!isGest())return;pDraft().v=paramDefaults();S.psaved=false;}
  else if(a==='pnjAdd'){if(!isGest())return;pDraft().v.pnj=[...(S.pd.v.pnj||[]),{nom:'',car:'',prof:''}];}
  else if(a==='pnjDel'){if(!isGest())return;S.pd.v.pnj.splice(+d.i,1);}
  else if(a==='pfix'){(S.pfix=S.pfix||{})[d.id]={...(S.pfix[d.id]||{}),[d.k]:d.v};}
  else if(a==='fxActivate'){if(!isGest())return;fxActivate(d.id);return;}
  else if(a==='fxActivateRest'){if(!isGest())return;for(const r of fxFixRows())if(!r.I.length&&!r.D.length)fxActivate(r.c.id);return;}
  else if(a==='rfFxNew'){S.rf.fxEd={key:fxKey(d.k,d.n),t:'perm',cible:'',val:'',txt:'',quand:'m'};}
  else if(a==='rfFxCancel'){S.rf.fxEd=null;}
  else if(a==='rfFxT'){const e=S.rf.fxEd;e.t=d.v;e.cible='';}
  else if(a==='rfFxQ'){S.rf.fxEd.quand=d.v;}
  else if(a==='rfFxAdd'){const e=S.rf.fxEd;if(!e)return;const f={t:e.t,cible:e.t==='rap'?'':e.cible,val:e.t==='rap'?0:Math.round(+e.val||0),txt:(e.txt||'').trim(),quand:e.quand};if(f.t==='perm')f.txt='';
    S.rf.fx={...S.rf.fx,[e.key]:[...(S.rf.fx[e.key]||[]),f]};S.rf.fxEd=null;}
  else if(a==='rfFxDel'){const L=(S.rf.fx[d.key]||[]).slice();L.splice(+d.j,1);S.rf.fx={...S.rf.fx,[d.key]:L};}
  else if(a==='rf2Add'){S.rf[d.k].push(['','']);}
  else if(a==='rf2Del'){S.rf[d.k].splice(+d.i,1);}
  else if(a==='rfChAdd'){const g=S.rf,v=(g.cb||'').trim();if(!v)return;if(!g.choix.some(o=>o[0]===g.ca&&nrm(o[1])===nrm(v)))g.choix.push([g.ca,v]);g.cb='';}
  else if(a==='rfChDel'){S.rf.choix.splice(+d.i,1);}
  else if(a==='rfPwUnk'){const s=S.rf.pw[+d.i];s[1]=!s[1];if(s[1])s[0]='';}
  else if(a==='rfSpAdd'){(S.rf[d.k]=S.rf[d.k]||[]).push(['','','']);}
  else if(a==='rfSpDel'){S.rf[d.k].splice(+d.i,1);}
  else if(a==='rfHum'){S.dlg=null;S.view='univers';S.uni='creatures';const x=humRec(),car={};for(const k of CARCOL){const v=x.car&&x.car[k];car[k]=[v?v[0]:'',v?v[1]:''];}S.rf={hum:true,car};window.scrollTo(0,0);}
  else if(a==='rfHumSave'){const g=S.rf,car={};for(const k of CARCOL){const v=g.car[k];car[k]=[v[0]===''?1:+v[0],v[1]===''?6:+v[1]];}S.races={...S.races,[HUM_ID]:{sing:HUMAIN,hum:true,car}};persist('meta/races',{byId:S.races});g.saved=true;}
  else if(a==='rfAtDel'){S.rf.at.splice(+d.i,1);}
  else if(a==='rfDel'){const g=S.rf,cr=S.creatures.find(c=>c.id===g.id);if(cr&&cr.done){g.err='Cette fiche de race est complète : elle ne peut pas être supprimée.';}else if(playedBy(raceRec(cr||{}).sing||'').length){g.err='Cette race est jouée par un personnage : elle ne peut pas être supprimée.';}else{g.err='';g.confirm=true;}}
  else if(a==='rfDelOk'){const id=S.rf.id;S.rf=null;saveCreatures(S.creatures.filter(c=>c.id!==id));const m={...S.races};delete m[id];S.races=m;persist('meta/races',{byId:m});rebuildRaces();}
  else if(a==='rfSave'){const g=S.rf,rec=rfRec(g),sing=rec.sing,plur=(g.plur||'').trim()||sing;if(!sing)return;rec.pw=pwToIds(rec.pw);if(g.pwx){const ids=pwSlots(rec);let ch=false;const P={...S.pouvoirs};for(const k in g.pwx){const x=g.pwx[k],id=ids[+k];if(x&&x.dirty&&id&&id!=='?'&&P[id]){P[id]={...P[id],desc:(x.desc||'').trim(),fx:clone(x.fx||[])};ch=true;}}if(ch){S.pouvoirs=P;persist('meta/pouvoirs',{byId:P});}}
    if(refRows().some(r=>r.cr.id!==g.id&&nrm(r.x.sing)===nrm(sing))){g.err='Une autre race porte déjà ce nom.';render();return;}
    let list=clone(S.creatures),id=g.id;
    if(!id){id=creSlug(plur)||('race-'+Date.now().toString(36));if(list.some(c=>c.id===id))id+='-'+Date.now().toString(36);list.push({id,nom:plur,fam:g.fam,done:false});}
    else{const cr=list.find(c=>c.id===id);if(cr){cr.nom=plur;cr.fam=g.fam;}}
    const old=S.races[id]&&S.races[id].sing;rec.eye=(S.races[id]&&S.races[id].eye)||eyeAll(false);S.races={...S.races,[id]:rec};persist('meta/races',{byId:S.races});saveCreatures(list);rebuildRaces();
    if(old&&old!==sing)for(const c of Object.values(S.chars))if(c.race===old){const n=clone(c);n.race=sing;saveChar(n);}
    S.rf=rfDraft(id);S.rf.err='';S.rf.saved=true;}
  else if(a==='ptrSave'){const g=S.dlg,im=window._ptrImg;if(!g||!im)return;const s2=g.base*g.z,cv=document.createElement('canvas');cv.width=cv.height=256;
    const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,256,256);cx.drawImage(im,(20-g.x)/s2,(20-g.y)/s2,220/s2,220/s2,0,0,256,256);
    let q=.82,data=cv.toDataURL('image/jpeg',q);while(data.length>60000&&q>.4){q-=.1;data=cv.toDataURL('image/jpeg',q);}
    S.ptr={...(S.ptr||{}),[g.cid]:data};S.dlg=null;window._ptrImg=null;persist('portraits/'+g.cid,{img:data,t:Date.now()});S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});render();return;}
  else if(a==='ptrDel'){if(!S.ptr||!S.ptr[d.id])return;const m={...S.ptr};delete m[d.id];S.ptr=m;persistDel('portraits/'+d.id);S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});}
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
  else if(a==='ppOpen'){S.dlg={kind:'pp',cid:S.sel,prof:d.prof,spent:'',why:''};}
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
  else if(a==='achatCancelOk'){const as=S.asheet;const r=cancelAchat(S.chars[as.cid],as.id);S.asheet=null;saveChar(r.c);return;}
  else if(a==='histToggle')S.hist[S.sel]=!S.hist[S.sel];
  else if(a==='futOpen')S.futForm={open:true,nom:'',max:'6'};
  else if(a==='futCancel')S.futForm.open=false;
  else if(a==='futSave'){const nom=S.futForm.nom.trim();if(nom){const c=clone(S.chars[S.sel]);c.futiles=c.futiles||[];c.futiles.push({nom,max:Math.max(1,+S.futForm.max||6),cur:0});S.futForm={open:false,nom:'',max:'6'};saveChar(c);return;}}
  else if(a==='pnjXp'){const f=S.pnjForm,m=+f.montant;if(f.titre.trim()&&m>0){const e={id:'g'+Date.now().toString(36),date:today(),titre:f.titre.trim(),type:'Autre',entries:[{perso:S.sel,nature:'Individuel',montant:m}]};S.pnjForm={titre:'',montant:''};saveEvents([...S.events,e]);return;}}
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
  else if(a==='gestToggle'){if(!isGest())return;const p=clone(S.players[d.pid]);if(hasGest(p)&&gestCount()<=1)return;p.gestion=!hasGest(p);savePlayer(p);return;}
  else if(a==='asPlayer'){S.asPlayer=true;S.rf=null;window.scrollTo(0,0);}
  else if(a==='asPlayerOff'){S.asPlayer=false;}
  else if(a==='partiToggle'){if(!canEditP(S.players[d.pid]))return;const p=clone(S.players[d.pid]);p.parti=!p.parti;savePlayer(p);return;}
  else if(a==='pDel'){if(!isGest())return;S.dlg={kind:'p',id:d.pid};}
  else if(a==='cDel'){if(!isGest())return;S.dlg={kind:'c',id:d.id};}
  else if(a==='logout'){try{localStorage.removeItem('xp.code');}catch(e){}location.reload();return;}
  else if(a==='dlgOk'){const g=S.dlg;S.dlg=null;
    if(g.kind==='a'){const c=S.chars[g.id],p=Math.floor(+g.pts);if(c&&p>=1&&p<=summary(c,S.events).dispo)saveChar(spendAutre(c,g.nom,p,today()));else render();return;}
    if(g.kind==='u'){const c=S.chars[g.id],u=c&&undoAutre(c,g.nom);if(u)saveChar(u.c);else render();return;}
    if(g.kind==='b'){const c=S.chars[g.id],r=c&&ref(c,g.key),nm=(g.nom||'').trim(),named=r&&(r.kind==='atout'||r.kind==='spec');if(r&&(!named||nm)&&(r.o.cur||0)===g.from&&lvlCost(r.kind,g.from+1)<=summary(c,S.events).dispo&&(r.max==null||g.from<r.max))saveChar(buy(c,g.key,g.from+1,today(),named?nm:undefined));else render();return;}if(g.kind==='c')removeChar(g.id);else if(g.kind==='p')removePlayer(g.id);else if(g.kind==='g')saveEvents(S.events.filter(e=>e.id!==g.id));return;}
  else if(a==='star'){const n=+d.n,auto=scenarioCount(S.events),cs=starCount(S.events,S.heritage.delta);const h={score:S.heritage.score,delta:(n===cs?n-1:n)-auto};S.heritage=h;persist('meta/heritage',h);}
  else if(a==='starReset'){S.heritage={score:S.heritage.score,delta:0};persist('meta/heritage',S.heritage);}
  else if(a==='addP'){if(!isGest())return;const n=S.newP.nom.trim();if(n){const p={id:slug(n),nom:n,role:S.newP.role,parti:false,persos:[]};S.newP={nom:'',role:'Joueur'};S.dlg=null;savePlayer(p);return;}}
  else if(a==='addC'){const f=S.newC,court=f.court.trim();if(!isGest())f.owner=ME||'';if(court){S.dlg=null;const c=newChar(slug(court),court,f.nom.trim(),f.type);S.newC={court:'',nom:'',type:'PJ',owner:f.owner};S.chars[c.id]=c;persist('chars/'+c.id,c);if(f.owner&&S.players[f.owner]){const p=clone(S.players[f.owner]);p.persos=[...(p.persos||[]),c.id];S.players[p.id]=p;persist('players/'+p.id,p);}render();return;}}
  render();
});
const q0=s=>document.querySelector(s);
document.addEventListener('keydown',ev=>{const t=ev.target;if(S.pinF&&(/^[0-9]$/.test(ev.key)||ev.key==='Backspace')&&!(t&&/INPUT|TEXTAREA|SELECT/.test(t.tagName))){ev.preventDefault();pinKey(ev.key==='Backspace'?'del':ev.key);return;}if((ev.key==='Enter'||ev.key===' ')&&t.getAttribute&&t.getAttribute('role')==='button'&&t.dataset.act){ev.preventDefault();t.click();}});
document.addEventListener('input',ev=>{
  const t=ev.target;
  if(t.dataset.f){S.form[t.dataset.f]=t.value;}
  else if(t.dataset.l!==undefined){S.form.lines[+t.dataset.l][t.dataset.k]=t.value;}
  else if(t.dataset.fut){S.futForm[t.dataset.fut]=t.value;}
  else if(t.dataset.pnj){S.pnjForm[t.dataset.pnj]=t.value;}
  else if(t.dataset.np){S.newP[t.dataset.np]=t.value;}
  else if(t.dataset.nc){S.newC[t.dataset.nc]=t.value;}
  else if(t.dataset.as){S.asheet[t.dataset.as]=t.value;}
  else if(t.dataset.sh){S.sheet[t.dataset.sh]=t.value;}
  else if(t.dataset.sxh!==undefined&&S.dlg){S.dlg.hid=t.checked;S._force=true;render();}
  else if(t.dataset.ptrz!==undefined&&S.dlg&&S.dlg.kind==='ptr'){const g=S.dlg,s0=g.base*g.z,cx=(130-g.x)/s0,cy=(130-g.y)/s0;g.z=+t.value;const s1=g.base*g.z;g.x=130-cx*s1;g.y=130-cy*s1;ptrClamp(g);ptrPaint();}
  else if(t.dataset.rfq!==undefined){S.rfq=t.value;S._force=true;const pos=t.selectionStart;render();const i=q0('[data-rfq]');if(i){i.focus();try{i.setSelectionRange(pos,pos);}catch(e){}}}
  else if(t.dataset.rfk!==undefined&&S.rf){S.rf[t.dataset.rfk]=t.value;if(t.dataset.rfk==='sing'){const b=q0('[data-act="rfSave"]');if(b)b.disabled=!t.value.trim();}}
  else if(t.dataset.rfc!==undefined&&S.rf){S.rf.car[t.dataset.rfc][+t.dataset.m]=t.value;}
  else if(t.dataset.fxcf!==undefined){const ctx=fxCtx(t.dataset.c);if(ctx&&ctx.fxEd){ctx.fxEd[t.dataset.fxcf]=t.value;const b=document.querySelector(`[data-act="fxcAdd"][data-c="${t.dataset.c}"]`);if(b)b.disabled=!fxOkEd(ctx.fxEd);}}
  else if(t.dataset.pwe!==undefined&&S.dlg){S.dlg[t.dataset.pwe]=t.value;S.dlg.err='';}
  else if(t.dataset.pq!==undefined){S.pq=t.value;S._force=true;render();const el=document.querySelector('[data-pq]');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);}}
  else if(t.dataset.rfpwd!==undefined&&S.rf&&S.rf.pwx){const x=S.rf.pwx[+t.dataset.rfpwd];if(x){x.desc=t.value;x.dirty=true;}}
  else if(t.dataset.pv!==undefined){pDraft().v[t.dataset.pv]=t.value;S.psaved=false;}
  else if(t.dataset.pdate!==undefined){pDraft().date=t.value;}
  else if(t.dataset.prk!==undefined){pDraft().v.pnj[+t.dataset.prk][t.dataset.pk]=t.value;}
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
  else if(t.dataset.nm!==undefined){S.nameForm.nom=t.value;}
  else if(t.dataset.dn!==undefined){S.dlg.nom=t.value;}
  else if(t.dataset.dp!==undefined){S.dlg.pts=t.value;}
  else if(t.dataset.pd!==undefined&&S.dlg){S.dlg[t.dataset.pd]=t.value;if(t.dataset.pd==='date'){const b=q0('#sheetRoot [data-act="pdOk"]');if(b)b.disabled=!(t.value&&t.value>=today());}}
  else if(t.dataset.nv!==undefined&&S.dlg&&S.dlg.kind==='ne'){S.dlg.vals[t.dataset.nv]=t.value;}
  else if(t.dataset.nem!==undefined&&S.dlg&&S.dlg.kind==='ne'){S.dlg.m=t.value;}
  else if(t.dataset.sd!==undefined&&S.dlg){if(t.dataset.sd==='type'&&S.dlg.kind==='sn'){const old=S.dlg.titre||'';if(!old.trim()||old===sessPrefix(S.dlg.type)){S.dlg.titre=sessPrefix(t.value);const i=q0('#sdi');if(i)i.value=S.dlg.titre;const b=q0('#sheetRoot [data-act="sessCreate"]');if(b)b.disabled=!S.dlg.titre.trim();}}S.dlg[t.dataset.sd]=t.value;if(t.dataset.sd==='titre'){const b=q0('#sheetRoot [data-act="sessCreate"],#sheetRoot [data-act="sessSave"]');if(b)b.disabled=!t.value.trim();}if(S.dlg.kind==='rat'){const g=S.dlg,b=q0('#sheetRoot [data-act="ratOk"]'),n=Math.floor(+g.montant||0);if(b){b.disabled=!(n>0&&g.who.length&&(g.titre||'').trim());b.textContent='Attribuer '+n+' XP';}}}
  else if(t.dataset.sxs!==undefined&&S.dlg){S.dlg.sess=t.value;}
  else if(t.dataset.cr!==undefined&&S.dlg){S.dlg.nom=t.value;const v=t.value.trim(),dup=!!v&&S.creatures.some(c=>c.id!==S.dlg.id&&c.nom.toLowerCase()===v.toLowerCase());const b=q0('#sheetRoot [data-act="creAddOk"],#sheetRoot [data-act="creSave"]');if(b)b.disabled=!v||dup;const w=document.getElementById('crdup');if(w)w.style.display=dup?'':'none';}
  else if(t.dataset.sx!==undefined&&S.dlg){S.dlg.txt=t.value;const b=q0('#sheetRoot [data-act="sxOk"],#sheetRoot [data-act="seSave"]');if(b)b.disabled=!t.value.trim();}
  const q=s=>document.querySelector(s);
  if(t.dataset.k==='montant'){const b=q('[data-act="sessAdd"]');if(b){const cs=curSession();b.disabled=!(cs&&S.form.lines.some(l=>+l.montant>0&&slp(l,cs).length));}}
  if(t.dataset.f==='titre'||t.dataset.k==='montant'){const b=q('[data-act="gainSave"]');if(b){const f=S.form;b.disabled=!(f.titre.trim()&&(f.lines.some(l=>+l.montant>0&&lp(l).length)||(f.editId&&(f.keep||[]).length)));}}
  if(t.dataset.pnj){const b=q('[data-act="pnjXp"]');if(b)b.disabled=!(S.pnjForm.titre.trim()&&+S.pnjForm.montant>0);}
  if(t.dataset.nm!==undefined){const b=q('[data-act="nameAdd"]');if(b)b.disabled=!S.nameForm.nom.trim()||b.dataset.full==='1';}
  if(t.dataset.dp!==undefined){const c=S.chars[S.dlg.id],dispo=summary(c,S.events).dispo,p=Math.floor(+t.value)||0,b=q('#sheetRoot [data-act="dlgOk"]'),af=document.getElementById('dafter');if(b)b.disabled=!(p>=1&&p<=dispo);if(af)af.textContent=(dispo-p)+' XP';}
  if(t.dataset.dn!==undefined){const b=q('[data-act="dlgOk"]');if(b)b.disabled=!(S.dlg.nom||'').trim();}
  if(t.dataset.np){const b=q('[data-act="addP"]');if(b)b.disabled=!S.newP.nom.trim();}
  if(t.dataset.nc){const b=q('[data-act="addC"]');if(b)b.disabled=!S.newC.court.trim();}
});
document.addEventListener('change',ev=>{
  const t=ev.target;S._force=true;
  if(t.dataset.cursess){S.curSess=t.value;render();}
  else if(t.dataset.spoff!==undefined&&S.sheet){S.sheet.sp={...(S.sheet.sp||{}),off:t.checked};renderSheet();}
  else if(t.dataset.acc!==undefined&&S.sheet){const c=clone(S.chars[S.sheet.id]);if(t.checked){if(c.accru&&c.accru!==t.dataset.acc){t.checked=false;return;}c.accru=t.dataset.acc;}else if(c.accru===t.dataset.acc)c.accru=null;saveChar(c);}
  else if(t.dataset.her){S.heritage={score:t.value,delta:S.heritage.delta};persist('meta/heritage',S.heritage);render();}
  else if(t.dataset.note!==undefined){const c=clone(S.chars[S.sel]);const p=c.profils.find(x=>x.nom===t.dataset.note);const v=t.value.trim();p.note=v===''?null:(isNaN(+v)?v:+v);saveChar(c);}
  else if(t.dataset.k==='nature'){S.form.lines[+t.dataset.l].persos=null;render();}
  else if(t.dataset.me&&!pinOn()){ME=t.value||null;try{if(ME)localStorage.setItem('xp.me',ME);else localStorage.removeItem('xp.me');}catch(e){}render();}
  else if(t.dataset.owner){if(S.dlg&&S.dlg.kind==='pc'){S.dlg.own=t.value||'';render();}}
  else if(t.dataset.pf){if(!canEditP(S.players[t.dataset.pid])||(t.dataset.pf==='role'&&!isGest()))return;const p=clone(S.players[t.dataset.pid]);p[t.dataset.pf]=t.dataset.pf==='nom'?(t.value.trim()||p.nom):t.value;savePlayer(p);}
  else if(t.dataset.rfa!==undefined&&S.rf){const k=t.dataset.rfa,a=S.rf.acc;S.rf.acc=t.checked?(a.includes(k)?a:[...a,k]):a.filter(x=>x!==k);render();}
  else if(t.dataset.rfjump!==undefined){S.rf=rfDraft(t.value);render();}
  else if(t.dataset.rfk==='ca'&&S.rf){S.rf.ca=t.value;S.rf.cb='';render();}
  else if(t.dataset.rfpw!==undefined&&S.rf){S.rf.pw[+t.dataset.rfpw][0]=t.value;render();}
  else if(t.dataset.rfpwq!==undefined&&S.rf){S.rf.pw[+t.dataset.rfpwq][2]=t.value;render();}
  else if((t.dataset.rfk==='fam'||t.dataset.rfk==='pa'||t.dataset.rfk==='pb'||t.dataset.rft!==undefined)&&S.rf){if(t.dataset.rft!==undefined)S.rf.typ[+t.dataset.rft][+t.dataset.p]=t.value;else S.rf[t.dataset.rfk]=t.value;render();}
  else if(t.dataset.ptrfile){const f=t.files&&t.files[0],cid=t.dataset.ptrfile;t.value='';if(!f)return;const rd=new FileReader();
    rd.onload=()=>{const im=new Image();im.onload=()=>{window._ptrImg=im;const w=im.naturalWidth,h=im.naturalHeight,base=Math.max(220/w,220/h);S.dlg={kind:'ptr',cid,src:rd.result,w,h,base,z:1,x:130-w*base/2,y:130-h*base/2};S._force=true;render();};im.src=rd.result;};rd.readAsDataURL(f);}
  else if(t.dataset.cf&&!canEditC(S.chars[t.dataset.id])){render();}
  else if(t.dataset.cf==='race'){if(S.chars[t.dataset.id].race&&!isGest())return;let c=clone(S.chars[t.dataset.id]);c.race=t.value||null;if(c.race&&c.creation&&!c.spPred)c=grantPredSp(c);saveChar(c);}
  else if(t.dataset.cf==='pj'){const c=clone(S.chars[t.dataset.id]);const v=t.value||null;if(v!==(c.pj||null)){c.pj=v;c.pjDate=v?today():null;}saveChar(c);}
  else if(t.dataset.cf){const c=clone(S.chars[t.dataset.id]);const k=t.dataset.cf;c[k]=k==='statut'?t.value:(t.value.trim()||c[k]);saveChar(c);}
  else if(t.dataset.np==='role'||t.dataset.nc==='type'||t.dataset.nc==='owner'){render();}
});
document.addEventListener('focusout',()=>{setTimeout(()=>{if(S.dirty&&!(document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))){S._force=true;render();}},60);});


