/* La belle appli — lot 3 (24/11/2026) : Chronique et calendrier
   Événements : collection « fiches », genre 'evenement' :
     {id:'f-…', genre:'evenement', nom (titre), num (texte tel quel), type ('Scénario'|'Interscénario'|'Vie du fief'),
      debut:{a,m,j?} (jour facultatif = période floue), duree (jours), pj:[personnages], lieux (texte, jetons « @ »),
      desc (résumé), notes (Notes MJ), vis:'rev', eye:{desc,sait}, par, cree, modif}
   Agenda : collection « fiches », genre 'agenda' : {id, genre:'agenda', nom, debut:{a,m,j}, duree, desc (note), vis:'rev', par, cree, modif}
   Calendrier : document meta/calendrier : {date:{a,m,j}, fetes:[{id, nom, mode:'fixe'|'calc', m, j, calc (0 à 3), nbj, desc, vis, surch:{<année>:{m,j}}}]}
   Personnage : naiss {a, m?, j?, env?}, ageLib (PNJ). Session du journal d'XP : evt (identifiant de l'événement).
   Vrai calendrier grégorien ; lune : cycle synodique moyen ; solstices et équinoxes : formule de Meeus (années 1000 à 3000). */
S.cal=null;S.calReady=false;S.chV='liste';S.chTy='tout';S.chTs=[];S.chFo=false;S.chPj=[];S.chM=null;S.chDay=null;S.chPage=null;S.chRat=null;

/* ---------- Dates ---------- */
const CH_TYPES=['Scénario','Interscénario','Vie du fief','Autre']; /* UX2 : type Autre ; Rendez-vous = genre agenda */
const chCl=f=>CH_TCL[f.type]||'au';
const CH_TYP2=['Scénario','Interscénario','Vie du fief','Rendez-vous','Autre']; /* ordre de la fenêtre de création */
const CH_TF=[['sc','Scénarios'],['in','Interscénarios'],['fi','Vie du fief'],['au','Autres'],['ag','Rendez-vous']];
const CH_TCL={'Scénario':'sc','Interscénario':'in','Vie du fief':'fi'};
/* Numérotation affichée (26/11) : numéro seul, la couleur dit le type (Scénario 2 chiffres, autres 3) */
const chPad=(t,n)=>String(n).padStart(t==='Scénario'?2:3,'0');
function chNumOf(f){const x=chEvNum(f);return x?chPad(x.type,x.n):(f.num||'').trim();}
function chSessHead(e){const sn=chSessNum(e),ty=sn?sn.type:evType(e);let t=e.titre||'';
  if(sn)t=t.replace(sn.type==='Interscénario'?CH_RE_I:sn.type==='Scénario'?CH_RE_S:CH_RE_F,'').replace(/^\s*[.:\-–—]?\s*/,'');
  /* UX1 : la session porte le titre de son événement, suivi de son suffixe libre (« Épilogue », « Partie 2 ») */
  const f=e.evt&&S.fiches&&S.fiches[e.evt];if(f&&f.nom&&!CH_RE_S.test(e.titre||'')&&!CH_RE_I.test(e.titre||'')&&!CH_RE_F.test(e.titre||''))t=f.nom+(t?' — '+t:'');
  return {cl:CH_TCL[ty]||'',num:sn?chPad(sn.type,sn.n):'',t:t||e.titre||''};}
function chSessT(e){const h=chSessHead(e);return (h.num?`<span class="chsn ${h.cl}">${esc(h.num)}</span> `:'')+esc(h.t);}
const CH_JSC=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
const chOk=d=>!!d&&d.a>0&&d.m>=1&&d.m<=12;
const chDim=(a,m)=>new Date(Date.UTC(a,m,0)).getUTCDate();
const chUTC=d=>Date.UTC(d.a,d.m-1,d.j||1);
const chFrom=t=>{const x=new Date(t);return {a:x.getUTCFullYear(),m:x.getUTCMonth()+1,j:x.getUTCDate()};};
const chAdd=(d,n)=>chFrom(Date.UTC(d.a,d.m-1,(d.j||1)+n));
const chAddM=(d,n)=>{const t=new Date(Date.UTC(d.a,d.m-1+n,1)),a=t.getUTCFullYear(),m=t.getUTCMonth()+1;return {a,m,j:Math.min(d.j||1,chDim(a,m))};};
const chKey=d=>chOk(d)?d.a*10000+d.m*100+(d.j||0):null;
const chDays=(d1,d2)=>Math.round((chUTC(d2)-chUTC(d1))/864e5);
const chDow=d=>new Date(chUTC(d)).getUTCDay();
const chJ=j=>j===1?'1er':String(j);
const chMo=m=>JR_MOIS[m-1]||'';
function chDateTxt(d,noYear){if(!chOk(d))return '';if(!d.j)return chMo(d.m)+(noYear?'':' '+d.a);return JR_JS[chDow(d)]+' '+chJ(d.j)+' '+chMo(d.m)+(noYear?'':' '+d.a);}
const chEnd=(d,n)=>chOk(d)&&d.j&&(n||1)>1?chAdd(d,(n||1)-1):d;
/* « du lundi 30 avril au jeudi 3 mai 1900 » ; « courant mars 1900 » */
function chRangeTxt(d,n){if(!chOk(d))return 'Sans date';if(!d.j)return 'courant '+chMo(d.m)+' '+d.a;n=n||1;if(n<=1)return chDateTxt(d);
  const e=chEnd(d,n);return 'du '+chDateTxt(d,e.a===d.a)+' au '+chDateTxt(e);}
/* Forme courte pour les listes : « 30 avril – 3 mai » */
function chRangeShort(d,n){if(!chOk(d))return '';if(!d.j)return 'courant '+chMo(d.m);n=n||1;const e=chEnd(d,n);
  if(n<=1)return chJ(d.j)+' '+chMo(d.m);if(e.m===d.m&&e.a===d.a)return chJ(d.j)+' – '+chJ(e.j)+' '+chMo(d.m);return chJ(d.j)+' '+chMo(d.m)+' – '+chJ(e.j)+' '+chMo(e.m);}
/* Lune : âge en jours dans le cycle (nouvelle lune de référence : 6 janvier 2000, 18 h 14 TU) */
const CH_SYN=29.530588853,CH_NL=Date.UTC(2000,0,6,18,14);
const chMoonAge=d=>{const x=((Date.UTC(d.a,d.m-1,d.j,12)-CH_NL)/864e5)%CH_SYN;return x<0?x+CH_SYN:x;};
const CH_PH=[['nl','○','Nouvelle lune'],['pq','◐','Premier quartier'],['pl','●','Pleine lune'],['dq','◑','Dernier quartier']];
/* Phase marquée sur un jour : le jour le plus proche de chaque phase (un seul jour par phase) */
function chPhase(d){const ag=chMoonAge(d);for(let k=0;k<4;k++){const t=k*CH_SYN/4;let x=ag-t;if(x<-CH_SYN/2)x+=CH_SYN;if(x>CH_SYN/2)x-=CH_SYN;if(x>=-.5&&x<.5)return CH_PH[k];}return null;}
/* Équinoxes et solstices (Meeus, Astronomical Algorithms, chap. 27) : 0 printemps, 1 été, 2 automne, 3 hiver */
function chSeason(y,k){const Y=(y-2000)/1000,C=[[2451623.80984,365242.37404,.05169,-.00411,-.00057],[2451716.56767,365241.62603,.00325,.00888,-.0003],[2451810.21715,365242.01767,-.11575,.00337,.00078],[2451900.05952,365242.74049,-.06223,-.00823,.00032]][k];
  const J0=C[0]+C[1]*Y+C[2]*Y*Y+C[3]*Y**3+C[4]*Y**4,T=(J0-2451545)/36525,W=(35999.373*T-2.47)*Math.PI/180,dl=1+.0334*Math.cos(W)+.0007*Math.cos(2*W);
  const A=[485,203,199,182,156,136,77,74,70,58,52,50,45,44,29,18,17,16,14,12,12,12,9,8],B=[324.96,337.23,342.08,27.85,73.14,171.52,222.54,296.72,243.58,119.81,297.17,21.02,247.54,325.15,60.93,155.12,288.79,198.04,199.76,95.39,287.11,320.81,227.73,15.45],
    Cc=[1934.136,32964.467,20.186,445267.112,45036.886,22518.443,65928.934,3034.906,9037.513,33718.147,150.678,2281.226,29929.562,31555.956,4443.417,67555.328,4562.452,62894.029,31436.921,14577.848,31931.756,34777.259,1222.114,16859.074];
  let s=0;for(let i=0;i<24;i++)s+=A[i]*Math.cos((B[i]+Cc[i]*T)*Math.PI/180);const jde=J0+.00001*s/dl;
  return chFrom(Date.UTC(2000,0,1,12)+(jde-2451545)*864e5+9*6e4);} /* heure de Paris (méridien, ~9 min) */

/* ---------- Date actuelle du jeu ---------- */
const chNow=()=>{const d=S.cal&&S.cal.date;return chOk(d)&&d.j?d:null;};
function chCalSave(c){S.cal=clone(c);persist('meta/calendrier',S.cal);render();}

/* ---------- Fêtes ---------- */
const CH_CALC=[['Équinoxe de printemps','équinoxe'],['Solstice d\'été','solstice'],['Équinoxe d\'automne','équinoxe'],['Solstice d\'hiver','solstice']];
const CH_FETES0=[{id:'imbolc',nom:'Imbolc',mode:'fixe',m:2,j:1,nbj:2},{id:'ostara',nom:'Ostara',mode:'calc',calc:0,nbj:1},{id:'beltane',nom:'Beltane',mode:'fixe',m:4,j:30,nbj:2},{id:'litha',nom:'Litha',mode:'calc',calc:1,nbj:1},
  {id:'lugnasad',nom:'Lugnasad',mode:'fixe',m:8,j:1,nbj:1},{id:'mabon',nom:'Mabon',mode:'calc',calc:2,nbj:1},{id:'samain',nom:'Samain',mode:'fixe',m:10,j:31,nbj:2},{id:'yule',nom:'Yule',mode:'calc',calc:3,nbj:1}].map(f=>({desc:'',vis:true,surch:{},...f}));
const chFetes=()=>(S.cal&&Array.isArray(S.cal.fetes)?S.cal.fetes:CH_FETES0);
const chFeSee=f=>isGest()||f.vis!==false;
function chFeDate(f,a){const s=f.surch&&f.surch[a];if(s&&s.m&&s.j)return {a,m:s.m,j:s.j};if(f.mode==='calc')return chSeason(a,f.calc||0);return {a,m:f.m||1,j:Math.min(f.j||1,chDim(a,f.m||1))};}
const chFeOrd=f=>{const d=chFeDate(f,1900);return d.m*100+d.j;};

/* ---------- Événements, agenda, anniversaires ---------- */
const chEvs=()=>Object.values(S.fiches||{}).filter(f=>f&&f.genre==='evenement');
const chAgs=()=>Object.values(S.fiches||{}).filter(f=>f&&f.genre==='agenda');
const chCanEv=()=>!S.visit&&(isGest()||!!ME);
const chCanAg=f=>!!f&&!S.visit&&(isGest()||(!!ME&&f.par===ME));
const chLast=()=>chEvs().filter(f=>chOk(f.debut)).sort((a,b)=>chKey(b.debut)-chKey(a.debut))[0]||null;
const chEvLab=f=>((f.num||'').trim()?f.num.trim()+' ':'')+(f.nom||'');
/* Âge et naissance */
function chAge(n,now){if(!n||!(n.a>0)||!now)return null;let y=now.a-n.a;if(n.m&&(now.m<n.m||(now.m===n.m&&n.j&&now.j<n.j)))y--;return y;}
const chNe=c=>c&&c.genre==='f'?'née':'né';
function chNaissTxt(c){const n=c.naiss;if(!n||!(n.a>0))return '';const ne=chNe(c);
  if(n.j&&n.m)return ne+' le '+chJ(n.j)+' '+chMo(n.m)+' '+n.a;if(n.m)return ne+' en '+chMo(n.m)+' '+n.a;return ne+(n.env?' vers ':' en ')+n.a;}
function chAgeTxt(c){const n=c.naiss,now=chNow();if(n&&n.a>0){const y=chAge(n,now),b=chNaissTxt(c);if(y==null||y<0)return {age:'',naiss:b};return {age:(n.env?'environ ':'')+y+' an'+(y>1?'s':''),naiss:b};}
  const L=(c.ageLib||'').trim();return L&&c.type==='PNJ'?{age:L,naiss:'',lib:true}:null;}
const chAnnivChars=()=>Object.values(S.chars).filter(c=>c&&vis(c)&&c.naiss&&c.naiss.a>0&&c.naiss.m&&c.naiss.j);

/* Éléments du calendrier sur une période [d1, d2] (clés incluses) : événements, agenda, fêtes, anniversaires */
function chItems(o){o=o||{};const out=[],k1=o.from?chKey(o.from):-Infinity,k2=o.to?chKey(o.to):Infinity,T=S.chTs||[],ty=T.length?'x':'tout',pj=S.chPj||[];
  const inR=(d,e)=>{const a=chKey(d),b=chKey(e);return b>=k1&&a<=k2;};
  for(const f of chEvs()){if(T.length&&!T.includes(chCl(f)))continue;if(pj.length&&!(f.pj||[]).some(x=>pj.includes(x)))continue;
    if(!chOk(f.debut)){if(o.nodate)out.push({k:'ev',f,d:null});continue;}
    const d=f.debut,e=d.j?chEnd(d,f.duree):{a:d.a,m:d.m,j:chDim(d.a,d.m)},s=d.j?d:{a:d.a,m:d.m,j:1};if(inR(s,e))out.push({k:'ev',f,d,e,s,flou:!d.j});}
  if(pj.length||(T.length&&!T.includes('ag')))return out;
  for(const f of chAgs()){if(!chOk(f.debut)||!f.debut.j)continue;const e=chEnd(f.debut,f.duree);if(inR(f.debut,e))out.push({k:'ag',f,d:f.debut,e,s:f.debut});}
  if(T.length||!o.from||!o.to)return out;
  for(let a=o.from.a;a<=o.to.a;a++){
    for(const fe of chFetes()){if(!chFeSee(fe))continue;const d=chFeDate(fe,a),e=chEnd(d,fe.nbj);if(inR(d,e))out.push({k:'fe',fe,d,e,s:d,a});}
    for(const c of chAnnivChars()){const n=c.naiss;if(n.a>a)continue;const d={a,m:n.m,j:Math.min(n.j,chDim(a,n.m))};if(inR(d,d))out.push({k:'an',c,d,e:d,s:d,age:a-n.a});}}
  return out;}
const chSortDesc=(x,y)=>(chKey(y.flou?{...y.d,j:32}:y.d)-chKey(x.flou?{...x.d,j:32}:x.d))||String((y.f&&y.f.num)||'').localeCompare(String((x.f&&x.f.num)||''),'fr',{numeric:true});

/* ---------- Petits morceaux d'affichage ---------- */
const CH_SAB=FI_SVG(FI_IC.chron,16);
const chTag=(t,l)=>`<span class="chk ${t}">${esc(l)}</span>`;
const chEvTag=f=>chTag(CH_TCL[f.type]||'in',f.type||'Événement');
function chMed(c,on,act){const im=portrait(c);return `<button type="button" class="chpc${on?' on':''}" data-act="${act}" data-v="${esc(c.id)}" aria-pressed="${!!on}" aria-label="${esc(c.court||c.nom)}" title="${esc(c.court||c.nom)}">${im?`<img src="${im}" alt="">`:esc((c.court||'?').slice(0,1))}</button>`;}
const chAv=id=>{const c=S.chars[id];if(!c||!vis(c))return '';const im=portrait(c);return `<span class="chav" title="${esc(c.court)}">${im?`<img src="${im}" alt="">`:esc((c.court||'?').slice(0,1))}</span>`;};
const chPJs=()=>pjIds().map(i=>S.chars[i]).filter(c=>c&&actif(c));
function chRow(it){
  if(it.k==='ev'){const f=it.f,d=it.d;
    return `<button type="button" class="chrow ux2ch" data-act="chOpen" data-id="${esc(f.id)}"><span class="chdd">${d?(d.j?`<small>${CH_JSC[chDow(d)]}</small><b>${d.j}</b>`:`<small>${esc(chMo(d.m).slice(0,4))}.</small><b>—</b>`):'<b>?</b>'}</span><span class="chpil ${chCl(f)}" title="${esc(f.type||'Événement')}">${esc(chNumOf(f)||'')}</span><span class="chtx"><b>${esc(f.nom)}</b><small>${esc(d?chRangeShort(d,f.duree):'sans date')}</small></span></button>`;}
  if(it.k==='ag'){const f=it.f,p=S.players[f.par];
    return `<button type="button" class="chrow ag" data-act="chOpen" data-id="${esc(f.id)}"><span class="chdd"><small>${CH_JSC[chDow(it.d)]}</small><b>${it.d.j}</b></span><span class="chpil ag" title="Rendez-vous"></span><span class="chtx"><b>${esc(f.nom)}</b><small>${esc((f.duree||1)>1?chRangeShort(it.d,f.duree):'Rendez-vous')}</small></span></button>`;}
  if(it.k==='fe'){const fe=it.fe;
    return `<button type="button" class="chrow fe${fe.vis===false?' prep':''}" data-act="chFeOpen" data-id="${esc(fe.id)}" data-a="${it.a}"><span class="chdd"><small>${CH_JSC[chDow(it.d)]}</small><b>${it.d.j}</b></span><span class="chtx"><b>${esc(fe.nom)}</b> ${chTag('fe','Fête')}<small>${esc(chRangeShort(it.d,fe.nbj))}</small></span></button>`;}
  if(it.k==='an'){const c=it.c;
    return `<button type="button" class="chrow an" data-act="lnk" data-t="perso" data-id="${esc(c.id)}"><span class="chdd"><small>${CH_JSC[chDow(it.d)]}</small><b>${it.d.j}</b></span><span class="chtx"><b>Anniversaire de ${esc(c.court||c.nom)}</b>${!c.naiss.env&&it.age>0?' '+chTag('an',it.age+' an'+(it.age>1?'s':'')):' '+chTag('an','Anniversaire')}</span></button>`;}
  return '';}

/* ---------- Univers › Chronique ---------- */
function chUniView(){
  if(S.uni==='evenement'||S.uni==='agenda'){const f=S.fi&&S.fiches[S.fi];
    if(!f){if(S.fichesReady){S.fi=null;S.uni='chron';}else return `<div class="card empty">Chargement…</div>`;}
    else return f.genre==='agenda'?chAgView(f):chEvView(f);}
  if(S.chPage==='fetes')return chFetesView();
  if(S.chPage==='ratt'&&chRatCan())return chRattView();
  S.chPage=null;return chView();}
function chNowLine(){const n=chNow(),E=canEdit();
  return `<div class="chnow ux2now"><span>${n?`Nous sommes le <b>${esc(chDateTxt(n))}</b>`:E?'<span class="muted">Date du jeu pas encore réglée</span>':''}</span>${E?`<button type="button" class="ibtn sm" data-act="chNowEd" aria-label="Régler la date du jeu">${ICON.crayon}</button>`:''}<span class="ux2sp"></span><button type="button" class="lnk" data-act="chPage" data-v="fetes">Fêtes ›</button></div>`;}
function chView(){
  let h=fiUniBack()+`<div class="pghead"><h2>Chronique</h2>${chCanEv()?`<button type="button" class="pbtn big" data-act="chEvNew" aria-label="Ajouter à la Chronique">+</button>`:''}</div>`;
  if(!S.fichesReady)return h+`<div class="card empty">Chargement…</div>`;
  h+=chNowLine();
  if(chRatCan()){const n=chRattProps().filter(r=>r.ev).length;if(n)h+=`<button type="button" class="chratt" data-act="chPage" data-v="ratt">Rattachements à vérifier <span class="bdg">${n}</span></button>`;}
  const T=S.chTs||[],P=S.chPj||[],nf=T.length+P.length;
  const nEv=chItems({nodate:true}).filter(it=>it.k==='ev'||it.k==='ag').length;
  h+=`<div class="ux2tb chbar"><div class="seg chsw" role="group" aria-label="Affichage">${[['liste','Liste'],['mois','Mois']].map(([v,l])=>`<button type="button" data-act="chV" data-v="${v}" aria-pressed="${S.chV===v}">${l}</button>`).join('')}</div>
    <details class="ux2flt chflt"${S.chFo?' open':''}><summary class="${nf?'on':''}">Filtres${nf?' · '+nf:''} ▾</summary><div class="ux2fltb">
      <div class="fimg">Types</div><div class="chtys">${CH_TF.map(([v,l])=>`<label class="chtyc"><input type="checkbox" data-chty="${v}"${T.includes(v)?' checked':''}><span class="chpil ${v}"></span>${l}</label>`).join('')}</div>
      <div class="fimg">PJ présents</div><div class="chpcs" role="group" aria-label="Filtrer par PJ">${chPJs().map(c=>chMed(c,P.includes(c.id),'chPj')).join('')}</div>
      <div class="acts"><button type="button" class="btn" data-act="chFltOff">Tout effacer</button><button type="button" class="btn pri" data-act="chFltGo">Voir ${nEv} élément${nEv>1?'s':''}</button></div></div></details></div>`;
  h+=S.chV==='mois'?chMonth():chList();
  return h;}
function chList(){const now=chNow(),ty=(S.chTs||[]).length?'x':'tout',pjf=(S.chPj||[]).length;
  let from=null,to=null;if(now){from={a:now.a,m:now.m,j:1};const nx=chAddM(from,1);to={a:nx.a,m:nx.m,j:chDim(nx.a,nx.m)};}
  const all=chItems({nodate:true}).filter(it=>it.k==='ev'||it.k==='ag');
  const extra=from&&!pjf&&!(S.chTs||[]).length?chItems({from,to}).filter(it=>it.k==='fe'||it.k==='an'):[];
  const L=[...all,...extra],nd=L.filter(it=>!it.d),D=L.filter(it=>it.d).sort(chSortDesc);
  if(!L.length)return `<div class="card empty">${ty!=='tout'||pjf?'Rien ne correspond à ces filtres.':'Aucun événement pour l\'instant.'+(chCanEv()?' Ajoute le premier avec « + ».':'')}</div>`;
  const G=[];for(const it of D){const k=it.d.a*100+it.d.m;let g=G.find(x=>x.k===k);if(!g){g={k,a:it.d.a,m:it.d.m,L:[]};G.push(g);}g.L.push(it);}
  const nk=now?now.a*100+now.m:null;if(now&&!G.some(g=>g.k===nk)){G.push({k:nk,a:now.a,m:now.m,L:[]});G.sort((x,y)=>y.k-x.k);}
  const nowKey=now?chKey(now):null,line=`<div class="chnowl" role="separator"><span>aujourd'hui · ${esc(CH_JSC[chDow(now||{a:2000,m:1,j:1})]+' '+(now?now.j:''))}</span></div>`;
  let h='';
  for(const g of G){let rows='',put=false;
    for(const it of g.L){const k=it.flou?chKey({...it.d,j:32}):chKey(it.d);if(g.k===nk&&!put&&k<=nowKey){rows+=line;put=true;}rows+=chRow(it);}
    if(g.k===nk&&!put)rows+=line;
    h+=`<div class="chmo"><span>${esc(chMo(g.m).replace(/^./,c=>c.toUpperCase())+' '+g.a)}</span><small>${g.L.length||''}</small></div><div class="chlst">${rows}</div>`;}
  if(nd.length)h+=`<div class="chmo"><span>Sans date</span><small>${nd.length}</small></div><div class="chlst">${nd.map(chRow).join('')}</div>`;
  return h;}
function chMonth(){const now=chNow();if(!S.chM){const b=now||chLast()&&chLast().debut||{a:1900,m:1};S.chM={a:b.a,m:b.m};}
  const M=S.chM,first={a:M.a,m:M.m,j:1},dim=chDim(M.a,M.m),off=(chDow(first)+6)%7,start=chAdd(first,-off),cells=Math.ceil((off+dim)/7)*7,end=chAdd(start,cells-1);
  const its=chItems({from:start,to:end}),flou=its.filter(it=>it.flou&&it.d.m===M.m&&it.d.a===M.a),span=its.filter(it=>!it.flou);
  span.sort((x,y)=>chKey(x.s)-chKey(y.s)||chDays(y.s,y.e)-chDays(x.s,x.e));
  /* une ligne (piste) par élément, gardée d'un jour à l'autre */
  const lanes=[];for(const it of span){let l=0;while(lanes[l]&&lanes[l].some(o=>!(chKey(o.e)<chKey(it.s)||chKey(o.s)>chKey(it.e))))l++;(lanes[l]=lanes[l]||[]).push(it);it.l=l;}
  const nk=now?chKey(now):null,sel=S.chDay;
  let h=`<div class="chmhd"><button type="button" class="chmn" data-act="chMo" data-v="-1" aria-label="Mois précédent">‹</button><b>${esc(chMo(M.m).replace(/^./,c=>c.toUpperCase())+' '+M.a)}</b><button type="button" class="chmn" data-act="chMo" data-v="1" aria-label="Mois suivant">›</button></div>`;
  if(now&&(now.a!==M.a||now.m!==M.m))h+=`<div style="text-align:center;margin:-4px 0 6px"><button type="button" class="lk" data-act="chMo" data-v="0">Revenir au mois du jeu</button></div>`;
  h+=`<div class="chcal" role="grid" aria-label="${esc(chMo(M.m)+' '+M.a)}">`+['L','M','M','J','V','S','D'].map(x=>`<div class="chwd" aria-hidden="true">${x}</div>`).join('');
  for(let i=0;i<cells;i++){const d=chAdd(start,i),k=chKey(d),out=d.m!==M.m,we=i%7>=5,ph=chPhase(d),wk=i%7===0;
    const here=span.filter(it=>chKey(it.s)<=k&&chKey(it.e)>=k),maxl=here.reduce((m,it)=>Math.max(m,it.l),-1);
    let bars='';for(let l=0;l<=Math.min(maxl,2);l++){const it=here.find(x=>x.l===l);if(!it){bars+='<i class="chb vide"></i>';continue;}
      const st=chKey(it.s)===k,en=chKey(it.e)===k,lab=st||wk;const t=it.k==='ev'?chCl(it.f):it.k;
      const nm=it.k==='ev'?(chNumOf(it.f)||it.f.nom):it.k==='ag'?it.f.nom:it.k==='fe'?it.fe.nom:(it.c.court||'');
      bars+=`<i class="chb ${t}${st?' st':''}${en?' en':''}">${lab?esc(nm):'&nbsp;'}</i>`;}
    if(maxl>2)bars+=`<i class="chmore">+${here.filter(x=>x.l>2).length}</i>`;
    h+=`<button type="button" class="chc${out?' o':''}${we?' we':''}${k===nk?' now':''}${k===sel?' sel':''}" data-act="chDay" data-v="${k}" aria-label="${esc(chDateTxt(d))}${here.length?', '+here.length+' élément'+(here.length>1?'s':''):''}"><span class="chn">${d.j}</span>${ph?`<span class="chph" title="${ph[2]}" aria-hidden="true">${ph[1]}</span>`:''}${bars}</button>`;}
  h+=`</div><div class="chleg"><span><i class="sc"></i>Scénario</span><span><i class="in"></i>Interscénario</span><span><i class="fi"></i>Vie du fief</span><span><i class="au"></i>Autre</span><span><i class="ag"></i>Rendez-vous</span><span><i class="fe"></i>Fête</span><span><i class="an"></i>Anniversaire</span><span>○ ◐ ● ◑ lune</span></div>`;
  if(flou.length)h+=`<div class="chmo"><span>Courant ${esc(chMo(M.m))}</span><small>${flou.length}</small></div><div class="chlst">${flou.map(chRow).join('')}</div>`;
  const sk=sel;
  if(sk){const L=span.filter(it=>chKey(it.s)<=sk&&chKey(it.e)>=sk),d={a:Math.floor(sk/10000),m:Math.floor(sk/100)%100,j:sk%100},ph=chPhase(d);
    h+=`<div class="chmo"><span>${esc(chDateTxt(d).replace(/^./,c=>c.toUpperCase()))}</span><small>${ph?esc(ph[2]):''}</small></div>`+(L.length?`<div class="chlst">${L.map(chRow).join('')}</div>`:`<div class="muted small" style="padding:4px 2px">Rien ce jour-là.</div>`);}
  return h;}

/* ---------- Fiche Événement ---------- */
function chEvView(f){const ed=chCanEv(),comp=[];
  let h=`<div class="ux2top">${crumb(CR_UNI,['Chronique','data-act="chBack"'],[esc(f.nom)])}<span class="ux2sp"></span>${ed?`<button type="button" class="ibtn" data-act="chEvEd" aria-label="Modifier l'événement">${ICON.crayon}</button>`:''}</div>`;
  const P=(f.pj||[]).map(id=>S.chars[id]).filter(c=>c&&vis(c));
  const im=illOf('fiche',f.id);
  h+=`<div class="card fihead chhead">${im?`<div class="chimg"><button type="button" class="fithumb" data-act="fiImg" data-id="${esc(illId('fiche',f.id))}" aria-label="Agrandir l'image de ${esc(f.nom)}"><img src="${im}" alt=""></button></div>`:''}<div class="chhm"><span class="chpil ${chCl(f)}">${esc(chNumOf(f)||'')}</span><span class="muted small">${esc(f.type||'Événement')}</span></div><h2 class="finm">${esc(f.nom)}</h2>
    <div class="small">${esc(chRangeTxt(f.debut,f.duree))}</div>
    ${P.length?`<div class="chpjs">${P.map(c=>{const ip=portrait(c);return `<button type="button" class="chpjp" data-act="lnk" data-t="perso" data-id="${esc(c.id)}">${ip?`<img src="${ip}" alt="">`:''}${esc(c.court||c.nom)}</button>`;}).join('')}</div>`:''}
    ${(f.lieux||'').trim()?`<div class="chkv"><span>Lieux</span><div>${fiInline(f.lieux)}</div></div>`:''}</div>`;
  if((f.desc||'').trim())h+=fiBlk('ev-desc','Résumé','',fiClamp(f.id+':desc',fiRich(f.desc)),{edit:ed?'chTxt':'',ea:' data-b="desc"'});else if(ed)comp.push(['Résumé','chTxt',' data-b="desc"']);
  h+=caOnMap('fiche',f.id);
  const S2=chSessOf(f.id);
  if(S2.length)h+=fiBlk('ev-xp','Sessions et XP',String(S2.length),S2.map(e=>{const by={};for(const en of e.entries||[]){const c=S.chars[en.perso];if(!c||c.type!=='PJ'||!vis(c)||!en.montant)continue;by[c.id]=(by[c.id]||0)+en.montant;}
    const xp=orderPJ(Object.keys(by)).map(id=>esc(S.chars[id].court)+' <b class="xpn">+'+by[id]+'</b>').join(' · ');
    return `<div class="chses"><div><b>${chSessT(e)}</b><div class="muted small">${[e.date?fmtDate(e.date):e.textuelle?'Session textuelle':'',esc(evType(e))].filter(Boolean).join(' · ')}</div></div><div class="small">${xp||'<span class="muted">pas d\'XP</span>'}</div></div>`;}).join(''));
  const M=fiMentDedup(fiMentions('fiche',f.id),h); /* lot 4 : sans ce qui est déjà lié plus haut */
  if(M.length)h+=fiBlk('ment','Mentions',String(M.length),fiMentionsHtml(M));
  return h+fiComp(comp);}
const chSessOf=id=>S.events.filter(e=>e.session&&e.evt===id);
function chAgView(f){const p=S.players[f.par];
  let h=`<div class="ux2top">${crumb(CR_UNI,['Chronique','data-act="chBack"'],[esc(f.nom)])}<span class="ux2sp"></span>${chCanAg(f)?`<button type="button" class="ibtn" data-act="chAgEd" aria-label="Modifier le rendez-vous">${ICON.crayon}</button>`:''}</div>`;
  h+=`<div class="card fihead chhead"><div class="chhm"><span class="chpil ag"></span><span class="muted small">Rendez-vous</span></div><h2 class="finm">${esc(f.nom)}</h2><div class="small">${esc(chRangeTxt(f.debut,f.duree))}</div>${p?`<div class="muted small" style="margin-top:4px">Ajouté par ${esc(p.nom)}</div>`:''}
    ${(f.desc||'').trim()?`<div style="margin-top:8px">${fiRich(f.desc)}</div>`:''}
</div>`;
  return h;}

/* ---------- Fêtes ---------- */
function chFetesView(){const E=canEdit(),a=(chNow()||{a:new Date().getFullYear()}).a,L=chFetes().filter(chFeSee).slice().sort((x,y)=>chFeOrd(x)-chFeOrd(y));
  let h=crumb(CR_UNI,['Chronique','data-act="chPage" data-v=""'],[''])+`<h2 style="margin-top:2px">Fêtes</h2>`;
  h+=`<div class="plst">${L.map(f=>{const d=chFeDate(f,a),sub=(f.mode==='calc'?CH_CALC[f.calc||0][1]+' · ':'')+chRangeShort(d,f.nbj)+' en '+a+(f.surch&&f.surch[a]?' (date modifiée)':'');
    return `<div class="chfer${f.vis===false?' prep':''}"><button type="button" class="pli" data-act="chFeOpen" data-id="${esc(f.id)}" data-a="${a}"><span class="ptx"><b>${esc(f.nom)}</b><small>${esc(sub)}</small></span><span aria-hidden="true" class="pch">›</span></button>${isGest()?eyeBtn('chFeEye',`data-id="${esc(f.id)}"`,f.vis!==false,'Fête '+f.nom):''}</div>`;}).join('')}</div>`;
  if(E)h+=`<button type="button" class="addl" data-act="chFeNew">+ Nouvelle fête</button>`;
  h+=`<div class="muted small" style="margin-top:8px">${E?'Fête cachée (œil fermé) : visible de la gestion seulement. ':''}Solstices et équinoxes : date calculée chaque année ; les autres fêtes reviennent à la même date.${E?'':' Les fêtes se modifient en mode édition.'}</div>`;
  return h;}

/* ---------- Rattachements des sessions du journal d'XP ---------- */
const CH_RE_S=/^\s*S\.?\s*0*(\d+)/i,CH_RE_I=/^\s*\[\s*Int\.?\s*0*(\d+)\s*\]/i,CH_RE_F=/^\s*\(\s*0*(\d+)\s*\)/;
/* lot 4 : événement prérempli à partir d'une session (numéro tiré de l'intitulé, titre, type, PJ présents, date du jeu actuelle) */
function chEvAuto(e){const sn=chSessNum(e),p=n=>String(n).padStart(3,'0');
  const num=sn?(sn.type==='Scénario'?String(sn.n).padStart(2,'0')+'.':sn.type==='Interscénario'?'['+p(sn.n)+']':'('+p(sn.n)+')'):'';
  const nom=String(e.titre||'').replace(CH_RE_I,'').replace(CH_RE_S,'').replace(CH_RE_F,'').replace(/^\s*\.\s*/,'').trim()||String(e.titre||'').trim()||'Événement';
  const ty=sn?sn.type:(e.type||evType(e)),n=chNow(),now=new Date().toISOString();
  const f={id:fiRid('f-'),genre:'evenement',vis:'rev',eye:{desc:true,sait:true},desc:'',notes:'',par:ME||'',cree:now,nom,num,type:CH_TYPES.includes(ty)?ty:'Interscénario',duree:1,pj:(e.pj||[]).filter(id=>S.chars[id]),lieux:''};
  if(n)f.debut={a:n.a,m:n.m,j:n.j};return f;}
const chEvOpts=()=>chEvs().slice().sort((a,b)=>(chKey(b.debut)||0)-(chKey(a.debut)||0)||String(b.num||'').localeCompare(String(a.num||'')));
function chSessNum(e){{const f=e.evt&&S.fiches&&S.fiches[e.evt];const x=f&&chEvNum(f);if(x)return x;}const t=e.titre||'';let m=t.match(CH_RE_I);if(m)return {type:'Interscénario',n:+m[1]};m=t.match(CH_RE_S);if(m)return {type:'Scénario',n:+m[1]};m=t.match(CH_RE_F);if(m)return {type:'Vie du fief',n:+m[1]};return null;}
function chEvNum(f){if(f&&f.n>0&&CH_TCL[f.type])return {type:f.type,n:+f.n}; /* UX1 : numéro entier par type */
  const t=(f.num||'').trim();let m=t.match(/^\[\s*0*(\d+)\s*\]/);if(m)return {type:'Interscénario',n:+m[1]};m=t.match(/^\(\s*0*(\d+)\s*\)/);if(m)return {type:'Vie du fief',n:+m[1]};m=t.match(/^0*(\d+)\s*\.?$/);if(m)return {type:'Scénario',n:+m[1]};return null;}
const chBare=t=>nrm(String(t||'').replace(CH_RE_I,'').replace(CH_RE_S,'').replace(/^\s*\.\s*/,'').replace(/\s*[—–-]\s*[ée]pilogue.*$/i,'').replace(/\s*part\.?\s*\d+\s*$/i,'').replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/g,' ').trim());
/* UX3 : rattacher une session est ouvert à tout joueur identifié (les joueurs créent les sessions) */
const chRatCan=()=>isUser()&&!S.visit;
function chRattProps(){const E=chEvs(),out=[];
  for(const e of S.events){if(!e.session||e.rattrapage)continue;if(e.evt&&S.fiches[e.evt])continue;
    const sn=chSessNum(e);let ev=null;
    if(sn)ev=E.find(f=>{const x=chEvNum(f);return x&&x.type===sn.type&&x.n===sn.n;})||null;
    if(!ev){const b=chBare(e.titre);if(b)ev=E.find(f=>chBare(f.nom)===b)||null;}
    out.push({e,sn,ev});}
  return out;}
function chRattView(){const R=chRattProps();if(!S.chRat)S.chRat={sel:{},chk:{}};const st=S.chRat,E=chEvs().slice().sort((a,b)=>(chKey(a.debut)||0)-(chKey(b.debut)||0));
  let h=crumb(CR_UNI,['Chronique','data-act="chPage" data-v=""'],[''])+`<h2 style="margin-top:2px">Rattachements proposés</h2>
    <div class="muted small" style="margin-bottom:8px">Sessions du journal d'XP sans événement. Rapprochement par numéro (« S03. » ↔ « 03. », « [Int. 012] » ↔ « [012] »), sinon par titre. Rien n'est rattaché sans validation.</div>`;
  if(!R.length)return h+`<div class="card empty">Toutes les sessions sont rattachées.</div>`;
  const opts=sel=>`<option value="">— aucun —</option>`+E.map(f=>`<option value="${esc(f.id)}"${f.id===sel?' selected':''}>${esc(chEvLab(f))}</option>`).join('');
  h+=`<div class="card chrat">`+R.map(r=>{const id=r.e.id,sel=id in st.sel?st.sel[id]:(r.ev?r.ev.id:''),chk=id in st.chk?st.chk[id]:!!r.ev;
    return `<div class="chratr"><label class="chratc"><input type="checkbox" data-chrk="${esc(id)}"${chk&&sel?' checked':''}${sel?'':' disabled'} aria-label="Rattacher ${esc(r.e.titre)}"></label><div class="chratt"><b>${esc(r.e.titre)}</b><div class="muted small">${[r.e.date?fmtDate(r.e.date):'',esc(evType(r.e))].filter(Boolean).join(' · ')}</div>
      <select data-chrs="${esc(id)}" aria-label="Événement pour ${esc(r.e.titre)}">${opts(sel)}</select>${!r.ev?`<button type="button" class="addl" data-act="chEvFromS" data-id="${esc(id)}">Créer l'événement</button>`:''}</div></div>`;}).join('')+`</div>`;
  const n=R.filter(r=>{const id=r.e.id,sel=id in st.sel?st.sel[id]:(r.ev?r.ev.id:''),chk=id in st.chk?st.chk[id]:!!r.ev;return chk&&sel;}).length;
  h+=`<div class="actions"><button class="btn" data-act="chPage" data-v="">Plus tard</button><button class="btn pri" data-act="chRatOk"${n?'':' disabled'}>Valider les ${n} coché${n>1?'s':''}</button></div>`;
  return h;}
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset||!S.chRat)return;
  if(t.dataset.chrs!==undefined){S.chRat.sel[t.dataset.chrs]=t.value;if(t.value)S.chRat.chk[t.dataset.chrs]=true;S._force=true;render();}
  else if(t.dataset.chrk!==undefined){S.chRat.chk[t.dataset.chrk]=t.checked;S._force=true;render();}});

/* ---------- Ligne de session (journal d'XP) ---------- */
function chSessLine(e){const f=e.evt&&S.fiches[e.evt],E=canEdit();if(!f&&!E)return '';
  return `<div class="chsl${f&&CH_TCL[f.type]?' '+CH_TCL[f.type]:''}">${f?`${CH_SAB} ${lk({t:'fiche',id:f.id},(chNumOf(f)?chNumOf(f)+' · ':'')+(f.nom||''))}`:''}${E?` <button type="button" class="chslb" data-act="chRat" data-id="${esc(e.id)}">${f?'changer':'Rattacher à un événement'}</button>`:''}</div>`;}

/* ---------- Fiche de personnage : âge (onglet Fiche) et Feuilleton (onglet Chronique) ---------- */
function chAgeBlk(c){const t=chAgeTxt(c),ed=canEditC(c);if(!t&&!ed)return '';
  const line=t?`<b>${esc(t.age||'')}</b>${t.age&&t.naiss?' <span class="muted">· </span>':''}${t.naiss?`<span class="muted">${esc(t.naiss)}</span>`:''}`:'';
  return `<div class="chage">${t?`<span class="chagel">Âge</span><span class="chagev">${line}</span>${ed?`<button type="button" class="ibtn" data-act="chNa" data-id="${esc(c.id)}" aria-label="Modifier l'âge">✎</button>`:''}`:`<button type="button" class="addl" style="margin-top:0" data-act="chNa" data-id="${esc(c.id)}">+ Âge</button>`}</div>`;}
function chFeuil(c){const L=chEvs().filter(f=>(f.pj||[]).includes(c.id)).sort((a,b)=>(chKey(b.debut)||0)-(chKey(a.debut)||0));
  if(!L.length)return `<div class="muted small" style="padding:6px 2px">Aucun événement pour l'instant.</div>`;
  const ex=t=>String(t||'').split('\n').filter(l=>!/^\s*(@\[perso:[^\]]*\]\s*)+$/.test(l)).join('\n').replace(FI_TOK,(m,ty,id,nom)=>nom).replace(/\s+/g,' ').trim(); /* UX1 : sans la ligne des joueurs / personnages venue de Kanka */
  return `<div class="muted small" style="margin:2px 0 6px">${L.length} événement${L.length>1?'s':''} vécu${L.length>1?'s':''} · du plus récent au plus ancien</div><div class="card chfeu">`+L.map(f=>{const oth=(f.pj||[]).filter(x=>x!==c.id).map(x=>S.chars[x]).filter(x=>x&&vis(x)).map(x=>x.court);
    return `<button type="button" class="chfu" data-act="lnk" data-t="fiche" data-id="${esc(f.id)}"><span class="chsq ${CH_TCL[f.type]||''}">${esc(chNumOf(f)||'—')}</span><span class="chtx"><b>${esc(f.nom)}</b><small>${esc([chOk(f.debut)?chRangeShort(f.debut,f.duree)+' '+f.debut.a:'sans date',oth.length?'avec '+oth.join(', '):'seul'].join(' · '))}</small>${(f.desc||'').trim()?`<span class="chex">${esc(ex(f.desc))}</span>`:''}</span></button>`;}).join('')+`</div>`;}

/* ---------- Accueil : bandeau « Dans le jeu » ---------- */
function chHomeBits(){const now=chNow();if(!now)return null;const B=[];
  for(let i=0;i<=2;i++){const d=chAdd(now,i),ph=chPhase(d);if(ph&&ph[0]!=='nl'){B.push(ph[2]+(i===0?' aujourd\'hui':i===1?' demain':' dans 2 jours'));break;}}
  let best=null;for(const f of chFetes()){if(!chFeSee(f)||f.vis===false)continue;for(const a of [now.a,now.a+1]){const d=chFeDate(f,a),e=chEnd(d,f.nbj);if(chKey(e)<chKey(now))continue;const n=Math.max(0,chDays(now,d));if(!best||n<best.n)best={f,n};break;}}
  if(best)B.push(best.f.nom+(best.n===0?' aujourd\'hui':best.n===1?' demain':' dans '+best.n+' jours'));
  let an=null;for(const c of chAnnivChars()){for(const a of [now.a,now.a+1]){const d={a,m:c.naiss.m,j:Math.min(c.naiss.j,chDim(a,c.naiss.m))};const n=chDays(now,d);if(n<0)continue;if(n<=30&&(!an||n<an.n))an={c,n,d};break;}}
  if(an)B.push('Anniversaire de '+(an.c.court||an.c.nom)+(an.n===0?' aujourd\'hui':an.n===1?' demain':' le '+chJ(an.d.j)));
  return {now,B:B.slice(0,3)};}

/* ---------- Fenêtres ---------- */
['chEv','chTxt','chAg','chNow','chFe','chFeV','chNa','chRatS'].forEach(k=>FI_DLG.add(k));
['chEv','chTxt','chAg','chFe'].forEach(k=>FI_ED.add(k));
const chDateFields=(g,p,lab,req)=>`<div class="field"><span class="flab">${lab}</span><div class="jrdt"><input type="number" min="1" max="31" inputmode="numeric" data-fin="${p}j" value="${esc(g[p+'j']||'')}" aria-label="Jour" placeholder="jour"><select data-fin="${p}m" aria-label="Mois"><option value="">— mois —</option>${JR_MOIS.map((m,i)=>`<option value="${i+1}"${String(g[p+'m'])===String(i+1)?' selected':''}>${m}</option>`).join('')}</select><input type="number" min="1" inputmode="numeric" data-fin="${p}a" value="${esc(g[p+'a']||'')}" aria-label="Année" placeholder="année"></div><div class="muted small" data-chprev="${p}">${esc(chPrevTxt(g,p,req))}</div></div>`;
function chDateOf(g,p){const a=parseInt(g[p+'a'],10),m=parseInt(g[p+'m'],10),j=parseInt(g[p+'j'],10);if(!(a>0)||!(m>=1&&m<=12))return null;const o={a,m};if(j>0)o.j=j;return o;}
function chPrevTxt(g,p,req){const d=chDateOf(g,p);if(!d)return req||'';if(d.j&&d.j>chDim(d.a,d.m))return 'Ce jour n\'existe pas dans ce mois.';return chDateTxt(d).replace(/^./,c=>c.toUpperCase());}
const chEdField=(g,lab,hint)=>`<div class="field"><span class="flab">${lab}</span><div class="fiedw"><div id="fiEd" class="fied jrfied" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(lab.replace(/<[^>]+>/g,''))}" spellcheck="true">${fiEdHtml(g.txt)}</div><div id="fiSug" class="fisug" role="listbox" hidden></div></div><div class="muted small">${hint||'Tape <b>@</b> pour lier une fiche ; une ligne qui commence par « - » devient une liste.'}</div></div>`;
const chErr=g=>g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:'';
const chSeg=(k,v,opts,l)=>`<div class="field"><span class="flab">${l}</span><div class="seg" role="group" aria-label="${esc(l)}">${opts.map(([o,t])=>`<button type="button" data-act="chSet" data-k="${k}" data-v="${esc(o)}" aria-pressed="${String(v)===String(o)}">${t}</button>`).join('')}</div></div>`;
function chSheet(g){
  if(g.kind==='chEv'){const f=g.id&&S.fiches[g.id];if(!chCanEv()||(g.id&&!f))return null;const pjs=Object.values(S.chars).filter(c=>c.type==='PJ'&&((vis(c)&&actif(c))||g.pj.includes(c.id)));
    return fiShell(g,f?'Modifier l\'événement':'Ajouter à la Chronique',`<h2>${f?'Modifier l\'événement':'Ajouter à la Chronique'}</h2>
      ${f&&canEdit()&&CH_TCL[g.type]&&g.type===f.type?`<div class="chnf"><div class="field"><label for="chNum">Numéro</label><input id="chNum" type="text" inputmode="numeric" data-fin="num" value="${esc(g.num)}" autocomplete="off"></div><div class="field"><label for="jrNm">Titre</label><input id="jrNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div></div>`:`<div class="field"><label for="jrNm">Titre</label><input id="jrNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div>${CH_TCL[g.type]&&(!f||g.type!==f.type)&&!g.sess?`<div class="muted small">Numéro attribué automatiquement : ${esc(chPad(g.type,xpNextN(g.type)))}</div>`:''}`}
      ${chSeg('type',g.type,(f?CH_TYPES:CH_TYP2).map(t=>[t,t]),'Type')}
      ${chDateFields(g,'d','Début <span class="muted">— le jour peut rester vide (période floue)</span>','')}
      <div class="field"><label for="chDu">Durée en jours</label><div class="chdu"><input id="chDu" type="number" min="1" inputmode="numeric" data-fin="duree" value="${esc(g.duree)}"><span class="muted small" data-chprev="fin">${esc(chFinTxt(g))}</span></div></div>
      <div class="field"><span class="flab">PJ impliqués</span><div class="jrparts">${pjs.map(c=>{const on=g.pj.includes(c.id);return `<button type="button" class="jrpc${on?' on':''}" data-act="chPjT" data-v="${esc(c.id)}" aria-pressed="${on}">${esc(c.court||c.nom)}</button>`;}).join('')}</div></div>
      ${chEdField(g,'Lieux <span class="muted">— facultatif</span>','Tape <b>@</b> pour lier une fiche Lieu, ou écris simplement le nom.')}
      ${f?`<div class="field"><label>Image</label>${illEdit('fiche',f.id,f.nom)}</div>`:''}
      ${chErr(g)}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="chEvSave">${f?'Enregistrer':'Créer'}</button></div>
      ${f?`<div class="fidel">${g.confirm?`<div class="muted small">Supprimer définitivement « ${esc(f.nom)} » ? Les liens vers cet événement deviendront du texte simple et les sessions rattachées perdront leur lien.</div><div class="actions"><button class="btn ghost" data-act="chSet" data-k="confirm" data-v="">Garder</button><button class="btn" style="color:var(--bad)" data-act="chEvDelOk">Supprimer</button></div>`:`<button class="btn ghost" style="color:var(--bad)" data-act="chSet" data-k="confirm" data-v="1">Supprimer l'événement</button>`}</div>`:''}`);}
  if(g.kind==='chTxt'){const f=S.fiches[g.fid];if(!f||!chCanEv()||(g.b==='notes'&&!isGest()))return null;const tt=g.b==='notes'?'Notes MJ':'Résumé';
    return fiShell(g,'Modifier : '+tt,`<div><h2>Modifier : ${tt}</h2><div class="muted small">${esc(chEvLab(f))}</div></div>
      <div class="fiedw"><div id="fiEd" class="fied" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${tt}" spellcheck="true">${fiEdHtml(g.txt)}</div><div id="fiSug" class="fisug" role="listbox" hidden></div></div>
      <div class="muted small">Tape <b>@</b> puis quelques lettres pour lier une fiche ; une ligne qui commence par « - » devient une liste.</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="chTxtSave">Enregistrer</button></div>`);}
  if(g.kind==='chAg'){const f=g.id&&S.fiches[g.id];if(g.id?!chCanAg(f):!chCanEv())return null;
    return fiShell(g,f?'Rendez-vous':'Nouveau rendez-vous',`<h2>${f?'Modifier le rendez-vous':'Ajouter à la Chronique'}</h2>${f?'':chSeg('type','Rendez-vous',CH_TYP2.map(t=>[t,t]),'Type')}
      <div class="field"><label for="jrNm">Titre</label><input id="jrNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div>
      ${chDateFields(g,'d','Date','Jour, mois et année')}
      ${chSeg('plus',g.plus?'1':'',[['','Un jour'],['1','Plusieurs jours']],'Durée')}
      ${g.plus?chDateFields(g,'f','Jusqu\'au','Date de fin'):''}
      ${chEdField(g,'Note <span class="muted">— facultative</span>')}
      <div class="muted small">Visible par toute la table. Modifiable par ${f&&f.par!==ME?'son auteur':'toi'} et le MJ.</div>
      ${chErr(g)}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="chAgSave">${f?'Enregistrer':'Ajouter'}</button></div>
      ${f?`<div class="fidel">${g.confirm?`<div class="actions"><button class="btn ghost" data-act="chSet" data-k="confirm" data-v="">Garder</button><button class="btn" style="color:var(--bad)" data-act="chAgDelOk">Supprimer</button></div>`:`<button class="btn ghost" style="color:var(--bad)" data-act="chSet" data-k="confirm" data-v="1">Supprimer de l'agenda</button>`}</div>`:''}`);}
  if(g.kind==='chNow'){if(!canEdit())return null;const last=chLastEnd();
    return fiShell(g,'Date actuelle du jeu',`<h2>Date actuelle du jeu</h2>
      ${chDateFields(g,'d','Date','Jour, mois et année')}
      <div class="field"><span class="flab">Avancer</span><div class="chstep"><button type="button" class="chip" data-act="chNowAdd" data-v="1">+1 jour</button><button type="button" class="chip" data-act="chNowAdd" data-v="7">+1 semaine</button><button type="button" class="chip" data-act="chNowAdd" data-v="m">+1 mois</button>${last?`<button type="button" class="chip" data-act="chNowAdd" data-v="last">Fin du dernier événement</button>`:''}</div>${last?`<div class="muted small" style="margin-top:4px">Fin du dernier événement : ${esc(chDateTxt(last.d))} (${esc(chEvLab(last.f))}).</div>`:''}</div>
      ${chErr(g)}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="chNowSave">Enregistrer</button></div>`);}
  if(g.kind==='chFeV'){const f=chFetes().find(x=>x.id===g.id);if(!f||!chFeSee(f))return null;const d=chFeDate(f,g.a);
    return fiShell(g,f.nom,`<h2>${esc(f.nom)}</h2><div class="small"><b>${esc(chRangeTxt(d,f.nbj))}</b></div>${(f.desc||'').trim()?fiRich(f.desc):''}<div class="muted small">Fête · tous les ans${f.mode==='calc'?' · '+CH_CALC[f.calc||0][0].toLowerCase():''}${f.vis===false?' · cachée aux joueurs':''}</div>
      <div class="actions">${canEdit()?`<button class="btn" data-act="chFeEd" data-id="${esc(f.id)}" data-a="${g.a}">${ICON.crayon} Modifier</button>`:''}<button class="btn" data-act="closeSheet">Fermer</button></div>`);}
  if(g.kind==='chFe'){if(!canEdit())return null;const f=g.id&&chFetes().find(x=>x.id===g.id);const calc=g.mode==='calc',cd=calc?chSeason(+g.a,+g.calc||0):null;
    return fiShell(g,f?'Fête':'Nouvelle fête',`<h2>${f?esc(f.nom):'Nouvelle fête'}</h2>
      <div class="field"><label for="jrNm">Nom</label><input id="jrNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div>
      ${chSeg('mode',g.mode,[['fixe','Date fixe'],['calc','Calculée']],'Date')}
      ${calc?`<div class="field"><label for="chCa">Calcul</label><select id="chCa" data-fin="calc">${CH_CALC.map(([l],i)=>`<option value="${i}"${String(g.calc)===String(i)?' selected':''}>${l}</option>`).join('')}</select><div class="muted small">En ${g.a} : ${esc(chDateTxt(cd))}.</div></div>
        <div class="field"><span class="flab">Remplacer la date en ${g.a} <span class="muted">— facultatif</span></span><div class="jrdt"><input type="number" min="1" max="31" inputmode="numeric" data-fin="sj" value="${esc(g.sj)}" aria-label="Jour" placeholder="jour"><select data-fin="sm" aria-label="Mois"><option value="">— mois —</option>${JR_MOIS.map((m,i)=>`<option value="${i+1}"${String(g.sm)===String(i+1)?' selected':''}>${m}</option>`).join('')}</select></div><div class="muted small">Vide : date calculée.</div></div>`
       :`<div class="field"><span class="flab">Jour et mois</span><div class="jrdt"><input type="number" min="1" max="31" inputmode="numeric" data-fin="j" value="${esc(g.j)}" aria-label="Jour" placeholder="jour"><select data-fin="m" aria-label="Mois"><option value="">— mois —</option>${JR_MOIS.map((m,i)=>`<option value="${i+1}"${String(g.m)===String(i+1)?' selected':''}>${m}</option>`).join('')}</select></div></div>`}
      <div class="field"><label for="chNb">Nombre de jours</label><input id="chNb" type="number" min="1" inputmode="numeric" data-fin="nbj" value="${esc(g.nbj)}"></div>
      ${chEdField(g,'Description <span class="muted">— facultative</span>')}
      ${chErr(g)}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="chFeSave">Enregistrer</button></div>
      ${f?`<div class="fidel">${g.confirm?`<div class="actions"><button class="btn ghost" data-act="chSet" data-k="confirm" data-v="">Garder</button><button class="btn" style="color:var(--bad)" data-act="chFeDelOk">Supprimer</button></div>`:`<button class="btn ghost" style="color:var(--bad)" data-act="chSet" data-k="confirm" data-v="1">Supprimer la fête</button>`}</div>`:''}`);}
  if(g.kind==='chNa'){const c=S.chars[g.cid];if(!c||!canEditC(c))return null;const pnj=c.type==='PNJ',lib=pnj&&g.lib;
    return fiShell(g,'Âge de '+(c.court||c.nom),`<h2>Âge · ${esc(c.court||c.nom)}</h2>
      ${pnj?chSeg('lib',lib?'1':'',[['','Date de naissance'],['1','Âge libre']],'Saisie'):''}
      ${lib?`<div class="field"><label for="chAl">Âge</label><input id="chAl" type="text" data-fin="ageLib" value="${esc(g.ageLib)}" placeholder="la quarantaine" autocomplete="off"></div>`
        :`${chDateFields(g,'n','Date de naissance <span class="muted">— jour et mois facultatifs</span>','')}${chSeg('env',g.env?'1':'',[['','Exacte'],['1','Environ (« vers »)']],'Précision')}${chNow()?'':'<div class="muted small">Date du jeu pas encore réglée : l\'âge s\'affichera quand elle le sera.</div>'}`}
      ${chErr(g)}
      <div class="actions">${c.naiss||c.ageLib?`<button class="btn ghost" style="margin-right:auto" data-act="chNaDel">Effacer</button>`:''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="chNaSave">Enregistrer</button></div>`);}
  if(g.kind==='chRatS'){if(!chRatCan())return null;const e=S.events.find(x=>x.id===g.sid);if(!e)return null;const E=chEvs().slice().sort((a,b)=>(chKey(a.debut)||0)-(chKey(b.debut)||0));
    return fiShell(g,'Rattacher la session',`<h2>Rattacher la session</h2><div class="muted small">${esc(e.titre)}</div>
      <div class="field"><label for="chRe">Événement</label><select id="chRe" data-fin="evt"><option value="">— aucun —</option>${E.map(f=>`<option value="${esc(f.id)}"${f.id===g.evt?' selected':''}>${esc(chEvLab(f))}</option>`).join('')}</select></div>
      <div class="muted small">Plusieurs sessions peuvent être rattachées au même événement (épilogue, Part.1 / Part.2).</div>
      <div><button type="button" class="addl" style="margin-top:0" data-act="chEvFromS" data-id="${esc(e.id)}" data-stay="1">+ Créer un nouvel événement</button><div class="muted small" style="margin-top:4px">Prérempli avec le titre, le numéro, le type et les PJ présents ; la session y sera rattachée.</div></div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="chRatSave">Enregistrer</button></div>`);}
  return null;}
function chFinTxt(g){const d=chDateOf(g,'d'),n=parseInt(g.duree,10)||1;if(!d||!d.j)return n>1?n+' jours':'';if(n<=1)return 'un jour';return 'jusqu\'au '+chDateTxt(chEnd(d,n));}
function chLastEnd(){let best=null;for(const f of chEvs()){if(!chOk(f.debut)||!f.debut.j)continue;const e=chEnd(f.debut,f.duree);if(!best||chKey(e)>chKey(best.d))best={f,d:e};}return best;}
/* Aperçus pendant la saisie */
function chPrevUpd(){const g=S.dlg;if(!g||!/^ch/.test(g.kind))return;document.querySelectorAll('#sheetRoot [data-chprev]').forEach(el=>{const p=el.dataset.chprev;el.textContent=p==='fin'?chFinTxt(g):chPrevTxt(g,p,'');});}
document.addEventListener('input',chPrevUpd);document.addEventListener('change',chPrevUpd);

/* ---------- Clics ---------- */
function chGo(id){const f=S.fiches[id];if(!f)return;S.fi=f.id;S.uni=f.genre;S.view='univers';window.scrollTo(0,0);render();}
function chAct(a,d){
  const redraw=()=>{S._fiRedraw=true;render();},g=S.dlg,now=new Date().toISOString();
  if(a==='chHome'){navClear();S.view='univers';S.uni='chron';S.fi=null;S.chPage=null;S.chV='mois';S.chM=null;S.chDay=chNow()?chKey(chNow()):null;window.scrollTo(0,0);render();return true;}
  if(a==='chV'){S.chV=d.v==='mois'?'mois':'liste';if(S.chV==='mois'&&!S.chDay&&chNow())S.chDay=chKey(chNow());render();return true;}
  if(a==='chTy'){S.chTy=d.v||'tout';render();return true;}
  if(a==='chFltOff'){S.chTs=[];S.chPj=[];render();return true;}
  if(a==='chFltGo'){S.chFo=false;render();return true;}
  if(a==='chPj'){const L=S.chPj||[];S.chPj=L.includes(d.v)?L.filter(x=>x!==d.v):[...L,d.v];render();return true;}
  if(a==='chMo'){const n=+d.v;if(n===0){S.chM=null;S.chDay=chNow()?chKey(chNow()):null;}else{const x=chAddM({a:S.chM.a,m:S.chM.m,j:1},n);S.chM={a:x.a,m:x.m};S.chDay=null;}render();return true;}
  if(a==='chDay'){const k=+d.v;S.chDay=S.chDay===k?null:k;render();return true;}
  if(a==='chOpen'){chGo(d.id);return true;}
  if(a==='chBack'){if(S.nav.length){navBack();return true;}S.fi=null;S.uni='chron';window.scrollTo(0,0);render();return true;}
  if(a==='chPage'){S.chPage=d.v||null;if(S.chPage==='ratt')S.chRat=null;window.scrollTo(0,0);render();return true;}
  if(a==='chFeOpen'){fiOpenDlg({kind:'chFeV',id:d.id,a:+d.a||(chNow()||{a:new Date().getFullYear()}).a});render();return true;}
  if(S.visit)return true;
  if(a==='chSet'&&g&&d.k==='type'&&!g.id&&(g.kind==='chEv'||g.kind==='chAg')){
    if(g.kind==='chEv'&&d.v==='Rendez-vous'){S.dlg={kind:'chAg',id:'',nom:g.nom||'',dj:g.dj||'',dm:g.dm||'',da:g.da||'',plus:'',fj:'',fm:'',fa:'',txt:''};redraw();return true;}
    if(g.kind==='chAg'&&d.v!=='Rendez-vous'){S.dlg={kind:'chEv',id:'',num:'',nom:g.nom||'',type:d.v,dj:g.dj||'',dm:g.dm||'',da:g.da||'',duree:'1',pj:[],txt:''};redraw();return true;}}
  if(a==='chSet'){if(g&&/^ch/.test(g.kind)){g[d.k]=d.v;if(d.k==='confirm')g.confirm=!!d.v;redraw();}return true;}
  /* Événements */
  if(a==='chEvNew'){if(!chCanEv())return true;const n=chNow();fiOpenDlg({kind:'chEv',id:'',num:'',nom:'',type:'Interscénario',dj:n?String(n.j):'',dm:n?String(n.m):'',da:n?String(n.a):'',duree:'1',pj:[],txt:''});render();return true;}
  if(a==='chEvFromS'){if(!canEdit())return true;const e=S.events.find(x=>x.id===d.id);if(!e)return true;const sn=chSessNum(e),p=n=>String(n).padStart(3,'0');
    const num=sn?(sn.type==='Scénario'?String(sn.n).padStart(2,'0')+'.':sn.type==='Interscénario'?'['+p(sn.n)+']':'('+p(sn.n)+')'):'';
    const nom=String(e.titre||'').replace(CH_RE_I,'').replace(CH_RE_S,'').replace(CH_RE_F,'').replace(/^\s*\.\s*/,'').replace(/\s*[—–-]\s*[ée]pilogue.*$/i,'').replace(/\s*part\.?\s*\d+\s*$/i,'').trim();
    const ty=sn?sn.type:evType(e);fiOpenDlg({kind:'chEv',id:'',num,nom,type:CH_TYPES.includes(ty)?ty:'Interscénario',dj:'',dm:'',da:'',duree:'1',pj:orderPJ(presents(e)),txt:'',sess:e.id,stay:d.stay==='1'});render();return true;}
  if(a==='chEvEd'){const f=S.fiches[S.fi];if(!f||!chCanEv())return true;const b=f.debut||{};fiOpenDlg({kind:'chEv',id:f.id,num:f.n?String(f.n):(f.num||''),nom:f.nom||'',type:f.type||'Interscénario',dj:b.j?String(b.j):'',dm:b.m?String(b.m):'',da:b.a?String(b.a):'',duree:String(f.duree||1),pj:(f.pj||[]).slice(),txt:f.lieux||''});render();return true;}
  if(a==='chPjT'){if(g&&g.kind==='chEv'){g.pj=g.pj.includes(d.v)?g.pj.filter(x=>x!==d.v):[...g.pj,d.v];redraw();}return true;}
  if(a==='chEvSave'){if(!g||g.kind!=='chEv'||!chCanEv())return true;const nom=(g.nom||'').trim();if(!nom){g.err='Le titre est obligatoire.';redraw();return true;}
    const any=['dj','dm','da'].some(k=>String(g[k]||'').trim()),db=chDateOf(g,'d');
    if(any&&!db){g.err='Début : indique au moins le mois et l\'année (le jour est facultatif).';redraw();return true;}
    if(db&&db.j&&db.j>chDim(db.a,db.m)){g.err='Ce jour n\'existe pas dans ce mois.';redraw();return true;}
    const du=Math.max(1,parseInt(g.duree,10)||1),ed=document.getElementById('fiEd'),lieux=ed?fiSer(ed):(g.txt||'');
    const pj=g.pj.filter(id=>S.chars[id]),type=CH_TYPES.includes(g.type)?g.type:'Interscénario';
    let f;if(g.id){const x=S.fiches[g.id];if(!x)return true;f=clone(x);}else f={id:fiRid('f-'),genre:'evenement',vis:'rev',eye:{desc:true,sait:true},desc:'',notes:'',par:ME||'',cree:now};
    f.nom=nom;f.num=(g.num||'').trim();f.type=type;{const old=g.id&&S.fiches[g.id],nn=parseInt(String(f.num).replace(/\D/g,''),10);f.num='';
      /* UX2 : numéro automatique (plus grand du type + 1) ; corrigeable en mode édition ; changement de type = numéro suivant du nouveau type */
      if(!CH_TCL[type])delete f.n;
      else if(old&&old.type===type)f.n=canEdit()&&nn>0?nn:(old.n||nn||xpNextN(type));
      else if(!old&&g.sess&&nn>0)f.n=nn; /* rattachement d'une ancienne session : numéro repris de son titre */
      else f.n=xpNextN(type);}f.duree=du;f.pj=pj;f.lieux=lieux;if(db)f.debut=db;else delete f.debut;
    S.dlg=null;FI_AT=null;S.fiches={...S.fiches,[f.id]:f};fiSave(f,true);
    if(g.sess&&canEdit()){saveEvents(S.events.map(e=>e.id===g.sess?{...e,evt:f.id}:e));}
    if(!g.id&&!g.stay){S.fi=f.id;S.uni='evenement';S.view='univers';window.scrollTo(0,0);} /* créé depuis le journal d'XP : on y reste */
    render();setTimeout(()=>toast(g.id?'Événement enregistré':'Événement créé'),0);return true;}
  if(a==='chEvDelOk'){if(!g||g.kind!=='chEv'||!chCanEv())return true;const x=S.fiches[g.id];S.dlg=null;if(x){S.fi=null;S.uni='chron';fiRemove(x.id);}render();setTimeout(()=>toast('Événement supprimé'),0);return true;}
  if(a==='chTxt'){const f=S.fiches[S.fi];if(!f||!chCanEv()||(d.b==='notes'&&!isGest()))return true;fiOpenDlg({kind:'chTxt',fid:f.id,b:d.b==='notes'?'notes':'desc',txt:d.b==='notes'?(f.notes||''):(f.desc||'')});render();return true;}
  if(a==='chTxtSave'){if(!g||g.kind!=='chTxt')return true;const x=S.fiches[g.fid];if(!x||!chCanEv()||(g.b==='notes'&&!isGest()))return true;const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||'');
    const n=clone(x);if(g.b==='notes')n.notes=txt;else n.desc=txt;FI_AT=null;S.dlg=null;fiSave(n);return true;}
  /* Agenda */
  if(a==='chAgNew'){if(!chCanEv())return true;const n=chNow();fiOpenDlg({kind:'chAg',id:'',nom:'',dj:n?String(n.j):'',dm:n?String(n.m):'',da:n?String(n.a):'',plus:'',fj:'',fm:'',fa:'',txt:''});render();return true;}
  if(a==='chAgEd'){const f=S.fiches[S.fi];if(!chCanAg(f))return true;const b=f.debut||{},e=chEnd(b,f.duree),pl=(f.duree||1)>1;
    fiOpenDlg({kind:'chAg',id:f.id,nom:f.nom||'',dj:String(b.j||''),dm:String(b.m||''),da:String(b.a||''),plus:pl?'1':'',fj:pl?String(e.j):'',fm:pl?String(e.m):'',fa:pl?String(e.a):'',txt:f.desc||''});render();return true;}
  if(a==='chAgSave'){if(!g||g.kind!=='chAg')return true;const x=g.id&&S.fiches[g.id];if(g.id?!chCanAg(x):!chCanEv())return true;
    const nom=(g.nom||'').trim(),db=chDateOf(g,'d');if(!nom){g.err='Le titre est obligatoire.';redraw();return true;}
    if(!db||!db.j||db.j>chDim(db.a,db.m)){g.err='Date : jour, mois et année.';redraw();return true;}
    let du=1;if(g.plus){const fe=chDateOf(g,'f');if(!fe||!fe.j||fe.j>chDim(fe.a,fe.m)){g.err='Date de fin : jour, mois et année.';redraw();return true;}du=chDays(db,fe)+1;if(du<1){g.err='La date de fin est avant le début.';redraw();return true;}}
    const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||'');
    const f=x?clone(x):{id:fiRid('f-'),genre:'agenda',vis:'rev',eye:{desc:true,sait:true},par:ME||'',cree:now};f.nom=nom;f.debut=db;f.duree=du;f.desc=txt;
    S.dlg=null;FI_AT=null;fiSave(f);setTimeout(()=>toast(x?'Enregistré':'Rendez-vous ajouté'),0);return true;}
  if(a==='chAgDelOk'){if(!g||g.kind!=='chAg')return true;const x=S.fiches[g.id];if(!chCanAg(x))return true;S.dlg=null;S.fi=null;S.uni='chron';fiRemove(x.id);render();setTimeout(()=>toast('Rendez-vous supprimé'),0);return true;}
  /* Date du jeu */
  if(a==='chNowEd'){if(!canEdit())return true;const n=chNow()||{};fiOpenDlg({kind:'chNow',dj:String(n.j||''),dm:String(n.m||''),da:String(n.a||'')});render();return true;}
  if(a==='chNowAdd'){if(!g||g.kind!=='chNow')return true;let x=chDateOf(g,'d');if(d.v==='last'){const l=chLastEnd();if(l)x=l.d;}else if(x&&x.j){x=d.v==='m'?chAddM(x,1):chAdd(x,+d.v);}
    if(x&&x.j){g.dj=String(x.j);g.dm=String(x.m);g.da=String(x.a);g.err='';}redraw();return true;}
  if(a==='chNowSave'){if(!g||g.kind!=='chNow'||!canEdit())return true;const x=chDateOf(g,'d');if(!x||!x.j||x.j>chDim(x.a,x.m)){g.err='Indique le jour, le mois et l\'année.';redraw();return true;}
    S.dlg=null;const c=clone(S.cal||{});c.date={a:x.a,m:x.m,j:x.j};if(!Array.isArray(c.fetes))c.fetes=clone(CH_FETES0);chCalSave(c);S.chM=null;setTimeout(()=>toast('Date du jeu enregistrée'),0);return true;}
  /* Fêtes */
  if(a==='chFeEye'){if(!isGest())return true;const c=clone(S.cal||{});c.fetes=clone(chFetes());const f=c.fetes.find(x=>x.id===d.id);if(!f)return true;if(f.vis!==false&&!canEdit()){toast('Cacher une fête : en mode édition');return true;}f.vis=f.vis===false;chCalSave(c);return true;}
  if(a==='chFeNew'||a==='chFeEd'){if(!canEdit())return true;const f=a==='chFeEd'&&chFetes().find(x=>x.id===d.id),yr=+d.a||(chNow()||{a:new Date().getFullYear()}).a,s=f&&f.surch&&f.surch[yr];
    fiOpenDlg({kind:'chFe',id:f?f.id:'',nom:f?f.nom:'',mode:f?f.mode:'fixe',calc:f?String(f.calc||0):'0',m:f&&f.m?String(f.m):'',j:f&&f.j?String(f.j):'',nbj:String(f?f.nbj||1:1),a:yr,sm:s?String(s.m):'',sj:s?String(s.j):'',txt:f?f.desc||'':''});render();return true;}
  if(a==='chFeSave'){if(!g||g.kind!=='chFe'||!canEdit())return true;const nom=(g.nom||'').trim();if(!nom){g.err='Le nom est obligatoire.';redraw();return true;}
    const c=clone(S.cal||{});c.fetes=clone(chFetes());let f=g.id&&c.fetes.find(x=>x.id===g.id);if(!f){f={id:fiRid('fe-'),vis:true,surch:{}};c.fetes.push(f);}
    f.nom=nom;f.mode=g.mode==='calc'?'calc':'fixe';f.nbj=Math.max(1,parseInt(g.nbj,10)||1);
    if(f.mode==='fixe'){const m=parseInt(g.m,10),j=parseInt(g.j,10);if(!(m>=1&&m<=12)||!(j>=1&&j<=chDim(2000,m))){g.err='Indique le jour et le mois.';redraw();return true;}f.m=m;f.j=j;delete f.calc;}
    else{f.calc=Math.min(3,Math.max(0,parseInt(g.calc,10)||0));const sm=parseInt(g.sm,10),sj=parseInt(g.sj,10);f.surch={...(f.surch||{})};
      if(sm>=1&&sm<=12&&sj>=1&&sj<=chDim(+g.a,sm))f.surch[g.a]={m:sm,j:sj};else if(String(g.sm||g.sj||'').trim()){g.err='Date remplacée : jour et mois.';redraw();return true;}else delete f.surch[g.a];}
    const ed=document.getElementById('fiEd');f.desc=ed?fiSer(ed):(g.txt||'');S.dlg=null;FI_AT=null;chCalSave(c);setTimeout(()=>toast('Fête enregistrée'),0);return true;}
  if(a==='chFeDelOk'){if(!g||g.kind!=='chFe'||!canEdit())return true;const c=clone(S.cal||{});c.fetes=clone(chFetes()).filter(x=>x.id!==g.id);S.dlg=null;chCalSave(c);setTimeout(()=>toast('Fête supprimée'),0);return true;}
  if(a==='chFeV')return true;
  /* Âge */
  if(a==='chNa'){const c=S.chars[d.id];if(!canEditC(c))return true;const n=c.naiss||{};fiOpenDlg({kind:'chNa',cid:c.id,lib:c.type==='PNJ'&&!c.naiss&&!!(c.ageLib||'').trim(),nj:String(n.j||''),nm:String(n.m||''),na:String(n.a||''),env:n.env?'1':'',ageLib:c.ageLib||''});render();return true;}
  if(a==='chNaSave'){if(!g||g.kind!=='chNa')return true;const c=S.chars[g.cid];if(!canEditC(c))return true;const n=clone(c);
    if(c.type==='PNJ'&&g.lib){const L=(g.ageLib||'').trim();if(!L){g.err='Indique l\'âge.';redraw();return true;}n.ageLib=L;delete n.naiss;}
    else{const a2=parseInt(g.na,10),m=parseInt(g.nm,10),j=parseInt(g.nj,10);if(!(a2>0)){g.err='L\'année est obligatoire.';redraw();return true;}
      if(String(g.nj||'').trim()&&!(m>=1&&m<=12)){g.err='Un jour sans mois ne suffit pas : indique le mois.';redraw();return true;}
      const o={a:a2};if(m>=1&&m<=12){o.m=m;if(j>0){if(j>chDim(a2,m)){g.err='Ce jour n\'existe pas dans ce mois.';redraw();return true;}o.j=j;}}if(g.env)o.env=true;n.naiss=o;delete n.ageLib;}
    S.dlg=null;saveChar(n);setTimeout(()=>toast('Enregistré'),0);return true;}
  if(a==='chNaDel'){if(!g||g.kind!=='chNa')return true;const c=S.chars[g.cid];if(!canEditC(c))return true;const n=clone(c);delete n.naiss;delete n.ageLib;S.dlg=null;saveChar(n);return true;}
  /* Rattachements */
  if(a==='chRat'){if(!chRatCan())return true;const e=S.events.find(x=>x.id===d.id);if(!e)return true;fiOpenDlg({kind:'chRatS',sid:e.id,evt:e.evt&&S.fiches[e.evt]?e.evt:''});render();return true;}
  if(a==='chRatSave'){if(!g||g.kind!=='chRatS'||!chRatCan())return true;const v=g.evt&&S.fiches[g.evt]?g.evt:'';S.dlg=null;
    saveEvents(S.events.map(e=>{if(e.id!==g.sid)return e;const n={...e};if(v)n.evt=v;else delete n.evt;return n;}));setTimeout(()=>toast(v?'Session rattachée':'Rattachement retiré'),0);return true;}
  if(a==='chRatOk'){if(!chRatCan()||!S.chRat)return true;const st=S.chRat,R=chRattProps(),m={};
    for(const r of R){const id=r.e.id,sel=id in st.sel?st.sel[id]:(r.ev?r.ev.id:''),chk=id in st.chk?st.chk[id]:!!r.ev;if(chk&&sel&&S.fiches[sel])m[id]=sel;}
    const n=Object.keys(m).length;if(!n)return true;S.chRat=null;S.chPage=null;saveEvents(S.events.map(e=>m[e.id]?{...e,evt:m[e.id]}:e));setTimeout(()=>toast(n+' session'+(n>1?'s':'')+' rattachée'+(n>1?'s':'')),0);return true;}
  return true;}

/* UX2 : filtres de la Chronique (types à cocher ; volet gardé ouvert d'un rendu à l'autre) */
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.chty===undefined)return;const v=t.dataset.chty,L=S.chTs||[];S.chTs=t.checked?[...new Set([...L,v])]:L.filter(x=>x!==v);S.chFo=true;render();});
document.addEventListener('toggle',ev=>{const t=ev.target;if(t&&t.classList&&t.classList.contains('chflt'))S.chFo=t.open;},true);
