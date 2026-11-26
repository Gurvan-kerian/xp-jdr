/* La belle appli — lot 1 (23/11/2026) : socle des fiches (lieux, organisations, familles, objets)
   Collection « fiches », une ligne par fiche :
   {id:'f-…', genre:'lieu'|'org'|'famille'|'objet', nom, type, parent, kanka, vis:'prep'|'rev', eye:{desc,sait},
    desc, sait:[{id, txt, rev, cree, par}], notes, par, cree, modif, dj}
   Liens « @ » : jeton @[sorte:id|nom] dans les textes (sorte = perso, race, secret, fiche).
   Mentions : calculées à partir des liens et des rattachements. Vignette : collection portraits (ill-fiche-<id>) ;
   grande image : table « images », chargée seulement à l'ouverture du visionneur. */
S.fiches={};S.fichesReady=false;if(S.fi===undefined)S.fi=null;S.fiQ='';S.fiTy='';S.fiFold={};S.fiTree={};S.fiLv='lieu';

const FI_SVG=(p,sz)=>`<svg width="${sz||18}" height="${sz||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const FI_IC={
  chron:'<path d="M5 3h14M5 21h14"/><path d="M6.5 3c0 4.5 2.2 6.6 4.4 8.3.6.4.6 1 0 1.4C8.7 14.4 6.5 16.5 6.5 21M17.5 3c0 4.5-2.2 6.6-4.4 8.3-.6.4-.6 1 0 1.4 2.2 1.7 4.4 3.8 4.4 8.3"/><path d="M9.2 19.2c.9-1.6 1.9-2.4 2.8-2.4s1.9.8 2.8 2.4z"/>', /* lot 3 : sablier, même trait que les autres pictos */
  secrets:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
  races:'<path d="M12 6.5C9.5 4.8 6.5 4.3 3 4.7V18c3.5-.4 6.5.1 9 1.8 2.5-1.7 5.5-2.2 9-1.8V4.7c-3.5-.4-6.5.1-9 1.8z"/><path d="M12 6.5v13.3"/>',
  pnj:'<path d="M4 5c5 1.6 11 1.6 16 0v6.5c0 5-3.6 8.5-8 8.5s-8-3.5-8-8.5z"/><path d="M7.5 10.5c.8-.8 2-.8 2.8 0M13.7 10.5c.8-.8 2-.8 2.8 0"/><path d="M9 14.5c1.7 1.6 4.3 1.6 6 0"/>',
  famille:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 11l3-3 3 3-3 3z"/>',
  org:'<path d="M5 21V4"/><path d="M5 4h12l-2.5 4 2.5 4H5"/>',
  lieu:'<path d="M3.5 11L12 4.5l8.5 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  objet:'<path d="M9 3h6"/><path d="M10 3v3.2C7 7.7 5.5 10 5.5 13a6.5 6.5 0 0 0 13 0c0-3-1.5-5.3-4.5-6.8V3"/>',
  pouvoirs:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M5 18.5h14"/>',
  perso:'<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/>',
  bete:'<path d="M4 15c2-6 6-9 11-9 2.5 0 4.5 1 5 3-1.5-.5-3 0-3.5 1.5L15 16c-1 2-3 3-5 3H6"/><path d="M15 9.5h.01"/><path d="M8 19l-1 2M11 19l-.5 2"/>'
};
/* Genres de fiche */
const FI_G={
  lieu:{pl:'Lieux',un:'lieu',nv:'Nouveau lieu',cnt:n=>n+' lieu'+(n>1?'x':''),arbo:true,par:'Lieu parent',sub:'lieu contenu',tl:'Types de lieu'},
  org:{pl:'Organisations',un:'organisation',nv:'Nouvelle organisation',cnt:n=>n+' organisation'+(n>1?'s':''),arbo:true,par:'Organisation parente',sub:'organisation contenue',tl:"Types d'organisation"},
  famille:{pl:'Familles',un:'famille',nv:'Nouvelle famille',cnt:n=>n+' famille'+(n>1?'s':''),arbo:true,par:'Suzerain (vassale) ou famille mère (branche)',sub:'vassale ou branche',tl:'Types de famille'}, /* lot 5 b : arbre des vassales et branches */
  objet:{pl:'Objets',un:'objet',nv:'Nouvel objet',cnt:n=>n+' objet'+(n>1?'s':''),arbo:true,par:'Fait partie de (collection)',sub:'objet contenu',tl:"Types d'objet"}, /* lot 6 : collections = parent */
  bete:{pl:'Bestiaire',un:'créature',nv:'Nouvelle créature',cnt:n=>n+' créature'+(n>1?'s':''),tl:'Types de créature',noMj:true} /* lot 4 (clé distincte de « creatures » = races) */
};
const FI_RES={lieu:['Fief']}; /* types réservés (le Fief déclenchera son bloc au lot 7) */
const FI_BACK='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
const fiRid=p=>p+Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,7);

/* ---------- Droits ----------
   Le MJ (gestion) voit tout ; les yeux sont réservés à la gestion (ouvrir : toujours ; refermer : mode édition).
   Joueur : voit les fiches et blocs révélés, crée (fiche révélée) et modifie directement une fiche révélée.
   Gestion : crée et modifie en mode édition ; seule à supprimer. Visiteur : lecture seule. */
const fiAll=()=>Object.values(S.fiches||{});
const fiSee=f=>!!f&&(isGest()||f.vis==='rev');
const fiEyeOf=f=>(f&&f.eye)||{};
const fiBlkSee=(f,k)=>fiSee(f)&&(isGest()||!!fiEyeOf(f)[k]);
const fiItSee=(f,it)=>!!it&&fiBlkSee(f,'sait')&&(isGest()||!!it.rev);
const fiCanEd=f=>!!f&&!S.visit&&(canEdit()||(!isGest()&&!!ME&&f.vis==='rev'));
const fiCanNew=()=>!S.visit&&(canEdit()||(!isGest()&&!!ME));
const fiSort=L=>L.sort((a,b)=>(a.nom||'').localeCompare(b.nom||'','fr',{sensitivity:'base'}));
const fiKidsOf=(id,L)=>(L||fiAll()).filter(x=>x.parent===id);
function fiPath(f){const p=[];let x=f,n=0;while(x&&x.parent&&n++<30){x=S.fiches[x.parent];if(x)p.unshift(x);}return p;}
function fiDesc(id,L){let n=0;for(const k of fiKidsOf(id,L))n+=1+fiDesc(k.id,L);return n;}
function fiSave(f,quiet){f=clone(f);f.modif=new Date().toISOString();S.fiches={...S.fiches,[f.id]:f};persist('fiches/'+f.id,f);if(!quiet)render();}
function fiRemove(id){const f=S.fiches[id];if(!f)return;
  for(const k of fiKidsOf(id)){const n=clone(k);n.parent=f.parent||'';fiSave(n,true);}
  const m={...S.fiches};delete m[id];S.fiches=m;persistDel('fiches/'+id);
  const ill=illId('fiche',id);if(S.ptr&&S.ptr[ill]){const p={...S.ptr};delete p[ill];S.ptr=p;persistDel('portraits/'+ill);S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});}
  fiBigDel(ill);fi6Unlink(f);}

/* ---------- Types (listes de valeurs calculées à partir des fiches) ---------- */
function fiTypes(g,all){if(g==='jour')return jrTypes();const m={};for(const f of fiAll())if(f.genre===g&&(all||fiSee(f))){const t=(f.type||'').trim();if(t)m[t]=(m[t]||0)+1;}
  return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0],'fr',{sensitivity:'base'}));}
function fiTypApply(g,from,to){to=(to||'').trim();if(!to||to===from)return;
  if(g==='jour'){for(const j of jrAll())if(j.genre==='journal'&&(j.type||'').trim()===from){const n=clone(j);n.type=to;jrSave(n,true);}render();return;}
  for(const f of fiAll())if(f.genre===g&&(f.type||'').trim()===from){const n=clone(f);n.type=to;fiSave(n,true);}render();}

/* ---------- Textes : jetons « @ », lecture et éditeur ---------- */
const FI_TOK=/@\[(perso|race|secret|fiche|img):([^|\]]+)\|([^\]]*)\]/g; /* lot 8 : img = image enregistrée dans l'appli (table images) */
const fiTokObj=(t,id)=>t==='secret'?{t:'secret',n:+id}:{t,id};
function fiTokName(t,id){
  if(t==='perso'){const c=S.chars[id];return c?(c.court||c.nom):'';}
  if(t==='race'){const cr=crById(id);return cr?raceNm(raceRec(cr)):'';}
  if(t==='secret'){const s=secById(+id);return s?secLabel(s):'';}
  if(t==='fiche'){const f=S.fiches[id];return f?f.nom:'';}
  return '';}
const fiTokClean=s=>String(s||'').replace(/[\]|\n]/g,' ').trim();
function fiInline(s){let out='',last=0;s=String(s||'');
  s.replace(FI_TOK,(m,t,id,nom,i)=>{out+=esc(s.slice(last,i));if(t==='img'){out+=fiImgTok(id,nom);last=i+m.length;return m;}const o=fiTokObj(t,id);out+=lnkOk(o)?lk(o,fiTokName(t,id)||nom):`<span class="nolk">${esc(nom)}</span>`;last=i+m.length;return m;});
  return out+esc(s.slice(last));}
/* Lot 8 : image dans un texte (grande image chargée à la demande, agrandissable) */
const FI_PIX='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
function fiImgTok(k,lab){const l=lab&&lab!=='Image'?lab:'';
  return `<button type="button" class="fibig fitimg" data-act="fiBig" data-id="${esc(k)}" data-src="${FI_PIX}" data-lab="${esc(l)}" aria-label="Agrandir l'image${l?' : '+esc(l):''}"><img src="${bigSrc(k,FI_PIX)}" data-big="${esc(k)}" alt="${esc(l)}"></button>`;}
/* Mise en forme conservée : paragraphes et listes (« - » en début de ligne) */
function fiRich(txt){const L=String(txt||'').split('\n');let h='',ul=false;
  for(const raw of L){const l=raw.trim(),li=/^[-•]\s+/.test(l);
    if(li){if(!ul){h+='<ul>';ul=true;}h+=`<li>${fiInline(l.replace(/^[-•]\s+/,''))}</li>`;continue;}
    if(ul){h+='</ul>';ul=false;}if(l)h+=`<p>${fiInline(l)}</p>`;}
  if(ul)h+='</ul>';return `<div class="firich">${h}</div>`;}
const fiHas=(txt,t,id)=>!!txt&&String(txt).includes('@['+t+':'+id+'|');
/* Étiquette d'un lien dans l'éditeur : nom seul, insécable, effacée d'un bloc */
function fiTagHtml(t,id,label,store){return `<span class="fitag" contenteditable="false" data-tok="${esc(t+':'+id)}" data-n="${esc(fiTokClean(store))}">${esc(label)}</span>`;}
function fiTokStore(t,id,nom){if(t==='secret'){const s=secById(+id);return s?'Secret '+(ROMAN[s.n-1]||s.n):nom;}return fiTokName(t,id)||nom;}
function fiEdHtml(txt){return String(txt||'').split('\n').map(line=>{let out='',last=0;
  line.replace(FI_TOK,(m,t,id,nom,i)=>{out+=esc(line.slice(last,i));const ok=lnkOk(fiTokObj(t,id));out+=fiTagHtml(t,id,ok?(fiTokName(t,id)||nom):nom,ok?fiTokStore(t,id,nom):nom);last=i+m.length;return m;});
  return out+esc(line.slice(last));}).join('<br>');}
/* Texte de l'éditeur → texte enregistré (jetons compris) */
function fiSer(el){let s='';
  const walk=n=>{for(const c of n.childNodes){
    if(c.nodeType===3){s+=c.nodeValue.replace(/ /g,' ');continue;}if(c.nodeType!==1)continue;
    if(c.dataset&&c.dataset.tok){const k=c.dataset.tok.indexOf(':');s+='@['+c.dataset.tok.slice(0,k)+':'+c.dataset.tok.slice(k+1)+'|'+fiTokClean(c.dataset.n||c.textContent)+']';continue;}
    if(c.tagName==='BR'){s+='\n';continue;}
    const blk=/^(DIV|P|LI|UL|OL)$/.test(c.tagName);if(blk&&s&&!s.endsWith('\n'))s+='\n';walk(c);if(blk&&s&&!s.endsWith('\n'))s+='\n';}};
  walk(el);return s.replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
/* Liste proposée après « @ » : PJ, PNJ, races, secrets, fiches visibles (la gestion voit aussi les fiches préparées) */
function fiSugList(q){const n=nrm(q),out=[],G=isGest();
  const add=(t,id,nom,kind,prep)=>{if(!nom)return;const k=nrm(nom);if(n&&!k.includes(n))return;out.push({t,id,nom,kind,prep,st:n&&k.startsWith(n)?0:1});};
  for(const c of Object.values(S.chars))if(vis(c))add('perso',c.id,c.court||c.nom,c.type==='PJ'?'PJ':'PNJ');
  for(const cr of raceCres()){const x=raceRec(cr);if(raceVisible(cr,x))add('race',cr.id,raceNm(x),'Race');}
  for(const s of S.secrets||[]){const r=ROMAN[s.n-1]||s.n,tt=titreVis(s)||(G&&s.titre);add('secret',String(s.n),'Secret '+r+(tt?' - '+s.titre:''),'Secret',G&&!!s.titre&&!titreVis(s));}
  for(const f of fiAll())if(fiSee(f)&&f.genre!=='agenda')add('fiche',f.id,f.genre==='evenement'?((f.num||'').trim()?f.num.trim()+' ':'')+f.nom:f.nom,f.genre==='evenement'?(f.type||'Événement'):(f.type||(FI_G[f.genre]||{}).un||'fiche'),f.vis!=='rev'); /* lot 3 : événements proposés, agenda exclu */
  return out.sort((a,b)=>a.st-b.st||a.nom.localeCompare(b.nom,'fr',{sensitivity:'base'})).slice(0,8);}

/* ---------- Mentions : liens « @ » et rattachements, filtrés selon ce que la personne peut lire ---------- */
const FI_MGRP=['Événements','Journaux et quêtes','Fiches','Personnages'];
function fiMentions(t,id){const out=[];
  for(const F of fiAll()){if(t==='fiche'&&F.id===id)continue;if(!fiSee(F))continue;const hits=[],ev=F.genre==='evenement'||F.genre==='agenda';
    if(ev&&t==='perso'&&(F.pj||[]).includes(id))hits.push('PJ impliqué'); /* lot 3 : événements et agenda */
    if(ev&&fiHas(F.lieux,t,id))hits.push('Lieux');
    if(fiHas(F.desc,t,id)&&fiBlkSee(F,'desc'))hits.push(F.genre==='evenement'?'Résumé':F.genre==='agenda'?'Note':'Description');
    if((F.sait||[]).some(it=>fiHas(it.txt,t,id)&&fiItSee(F,it)))hits.push("Ce que l'on sait");
    if((F.spec||[]).some(x=>fiHas(x.txt,t,id)&&fiSpecSee(x)))hits.push('Spécimens connus'); /* lot 8 b */
    if(isGest()&&fiHas(F.notes,t,id))hits.push('Notes MJ');
    if(t==='fiche'&&F.parent===id)hits.push((FI_G[F.genre]||{}).sub||'fiche contenue');
    if(F.genre==='objet'&&fiBlkSee(F,'det')){if(t==='fiche'&&F.lieu&&F.lieu.f===id)hits.push('emplacement');if(t==='perso'&&(F.det||[]).some(x=>x.id===id))hits.push('détenteur');} /* lot 6 */
    if(hits.length)out.push({grp:ev?'Événements':'Fiches',o:{t:'fiche',id:F.id},nom:F.genre==='evenement'&&(F.num||'').trim()?F.num.trim()+' '+F.nom:F.nom,prec:hits.join(', '),d:ev&&F.debut&&F.debut.a?jrDjIso(F.debut):(F.dj||F.modif||F.cree||'')});}
  for(const c of Object.values(S.chars||{})){if(c.type!=='PNJ'||(t==='perso'&&c.id===id)||!vis(c))continue; /* lot 8 : textes du Portrait des PNJ */
    const hits=PN_POR.filter(([k])=>fiHas((c.por||{})[k],t,id)&&pnBlkSee(c,k)).map(([,l])=>'Portrait › '+l);
    if(hits.length)out.push({grp:'Personnages',o:{t:'perso',id:c.id},nom:fiCN(c),prec:hits.join(', '),d:c.modif||c.cree||''});}
  if(t==='fiche')for(const x of fi6CharLinks(id))out.push({grp:'Personnages',o:{t:'perso',id:x.c.id},nom:fiCN(x.c),prec:'Situation · '+x.lab,d:x.c.modif||''}); /* lot 6 */
  /* lot 2 : descriptions et entrées des journaux et quêtes que la personne peut lire */
  for(const J of jrAll()){if(!jrCanRead(J))continue;const h=jrHost(J),nm=(h?(h.court||h.nom)+' › ':'')+J.nom;
    if(fiHas(J.desc,t,id))out.push({grp:'Journaux et quêtes',o:{t:'jour',id:J.id},nom:nm,prec:'description',d:J.cree||''});
    for(const e of J.ent||[])if(fiHas(e.txt,t,id))out.push({grp:'Journaux et quêtes',o:{t:'jour',id:J.id,i:e.id},nom:nm,prec:'« '+(e.nom||'Entrée')+' »',d:jrDjIso(e.dj)||e.cree||''});}
  return out.sort((a,b)=>String(a.d).localeCompare(String(b.d)));}
function fiMentionsHtml(L){if(!L.length)return '<div class="muted small">Aucune mention pour l\'instant.</div>';
  return FI_MGRP.filter(g=>L.some(m=>m.grp===g)).map(g=>`<div class="fimg">${g}</div>`+L.filter(m=>m.grp===g).map(m=>`<div class="fiml">${lk(m.o,m.nom)}<span class="muted small"> · ${esc(m.prec)}</span></div>`).join('')).join('');}

/* ---------- Univers : accueil en liste groupée ---------- */
function fiUniHome(){const G=isGest(),pl=(n,s,p)=>n+' '+(n>1?p:s);
  const cnt=g=>{const L=fiAll().filter(f=>f.genre===g),v=L.filter(fiSee).length,p=G?L.filter(f=>f.vis!=='rev').length:0;
    return S.fichesReady?(v?FI_G[g].cnt(v)+(p?' · '+pl(p,'préparée','préparées'):''):'aucune fiche pour l\'instant'):'chargement…';};
  const L=S.secrets||[],nt=L.filter(titreVis).length,np=propBadge();
  const sec=S.secretsReady?pl(L.length,'secret','secrets')+' · '+pl(nt,'titre révélé','titres révélés')+(np?' · '+pl(np,'proposition en attente','propositions en attente'):''):'chargement…';
  const rv=raceCres().filter(cr=>raceVisible(cr,raceRec(cr))),rd=rv.filter(cr=>cr.done).length;
  const rac=S.creaturesReady?pl(rv.length,'race','races')+(rd?' · '+pl(rd,'fiche complète','fiches complètes'):''):'chargement…';
  const row=(act,v,ic,l,sum,bdg)=>`<button type="button" class="pli" data-act="${act}" data-v="${v}"><span class="pic">${FI_SVG(FI_IC[ic])}</span><span class="ptx"><b>${l}${bdg?` <span class="bdg" aria-label="${bdg} en attente">${bdg}</span>`:''}</b><small>${esc(sum)}</small></span><span aria-hidden="true" class="pch">›</span></button>`;
  const grp=(t,rows)=>`<div class="pgrp">${t}</div><div class="plst">${rows.join('')}</div>`;
  return `<h2 style="margin-top:4px">Univers</h2>`
    +grp('Récit',[row('uni','chron','chron','Chronique',chUniSum()),row('uni','secrets','secrets','Secrets',sec,np)]) /* lot 3 */
    +grp('Peuples',[row('uni','creatures','races','Races',rac),row('uni','pouvoirs','pouvoirs','Pouvoirs et capacités',uniPwSum()),row('uni','bete','bete','Bestiaire',cnt('bete')),row('uni','famille','famille','Familles',cnt('famille')),row('uni','org','org','Organisations',cnt('org'))])
    +grp('Lieux et choses',[row('uni','lieu','lieu','Lieux',cnt('lieu')),row('uni','objet','objet','Objets',cnt('objet'))]);}
/* lot 3 : résumé de l'entrée Chronique */
function chUniSum(){if(!S.fichesReady)return 'chargement…';const n=chEvs().length,d=chNow();return (n?n+' événement'+(n>1?'s':''):'aucun événement pour l\'instant')+(d?' · '+chDateTxt(d):'');}
const fiUniBack=()=>`<button class="back" data-act="uni" data-v="home">${FI_BACK}Univers</button>`;

/* ---------- Liste d'un genre : recherche, filtre par type, arborescence ---------- */
function fiListView(g){const Gm=FI_G[g],T=fiTypes(g);if(S.fiTy&&!T.some(t=>t[0]===S.fiTy))S.fiTy='';
  let h=fiUniBack()+`<h2 style="margin-top:2px">${Gm.pl}</h2>`;
  if(!S.fichesReady)return h+`<div class="card empty">Chargement…</div>`;
  h+=`<div class="fisrch"><input type="search" data-fiq="1" value="${esc(S.fiQ)}" placeholder="Rechercher (nom, type)" aria-label="Rechercher dans les ${Gm.pl.toLowerCase()}" autocomplete="off"></div>`;
  if(T.length)h+=`<div class="chips fichips">${[['','Tous']].concat(T.map(t=>[t[0],t[0]])).map(([v,l])=>`<button class="chip" data-act="fiTy" data-v="${esc(v)}" aria-pressed="${(S.fiTy||'')===v}">${esc(l)}</button>`).join('')}${g==='objet'?`<button class="chip" data-act="fi6Uq" aria-pressed="${!!S.fiUq}">Uniques</button>`:''}</div>`;
  h+=`<div id="fiRes">${fiListBody(g)}</div>`;
  if(fiCanNew())h+=`<button class="btn pri cta" data-act="fiNew" data-g="${g}">+ ${Gm.nv}</button>`;
  return h;}
function fiListBody(g){const Gm=FI_G[g],L=fiAll().filter(f=>f.genre===g&&fiSee(f)&&!(g==='objet'&&S.fiUq&&!f.uniq)),q=nrm(S.fiQ),ty=S.fiTy||'';
  if(!L.length)return `<div class="card empty">Aucune fiche pour l'instant.${fiCanNew()?' Crée la première avec le bouton ci-dessous.':''}</div>`;
  const tag=f=>f.vis!=='rev'?' <span class="tag2">préparé</span>':'';
  const th=f=>{const s=illOf('fiche',f.id);return s?`<img class="illt" src="${s}" alt="" style="width:30px;height:30px">`:`<span class="fiic" aria-hidden="true">${FI_SVG(FI_IC[g],16)}</span>`;};
  const line=(f,sub,depth,tog)=>`<div class="firow${f.vis!=='rev'?' prep':''}" style="padding-left:${6+depth*18}px">${tog||'<span class="fitog0"></span>'}<button type="button" class="fili" data-act="fiOpen" data-id="${esc(f.id)}">${th(f)}<span class="fitx"><b>${esc(f.nom)}${tag(f)}</b><small>${esc(sub)}</small></span></button></div>`;
  if(q||ty||!Gm.arbo||(g==='objet'&&S.fiUq)){const R=fiSort(L.filter(f=>(!ty||(f.type||'').trim()===ty)&&(!q||nrm(f.nom).includes(q)||nrm(f.type).includes(q))));
    if(!R.length)return `<div class="card empty">Aucune fiche ne correspond.</div>`;
    return `<div class="filst">${R.map(f=>{const p=Gm.arbo?fiPath(f).filter(fiSee).map(x=>x.nom).join(' › '):'';return line(f,[f.type,p,fi6Hold(f)].filter(Boolean).join(' · '),0);}).join('')}</div>`;}
  const ids0=new Set(L.map(f=>f.id)),roots=fiSort(L.filter(f=>!f.parent||!ids0.has(f.parent)));
  const rec=(f,depth)=>{const K=g==='famille'?faKidOrd(fiKidsOf(f.id,L)):fiSort(fiKidsOf(f.id,L)),n=fiDesc(f.id,L),op=S.fiTree[f.id]!=null?S.fiTree[f.id]:false;
    const tog=K.length?`<button type="button" class="fitog" data-act="fiTree" data-id="${esc(f.id)}" aria-expanded="${op}" aria-label="${op?'Replier':'Déplier'} ${esc(f.nom)}">${op?'⌄':'›'}</button>`:'';
    return line(f,g==='famille'?faListSub(f,K):[f.type,K.length?n+' contenu'+(n>1?'s':''):'',fi6Hold(f)].filter(Boolean).join(' · '),depth,tog)+(op?K.map(k=>rec(k,depth+1)).join(''):'');};
  return `<div class="filst">${roots.map(f=>rec(f,0)).join('')}</div>`;}

/* ---------- La fiche ---------- */
const fiFolded=k=>!!(S.fiFold||{})[k];
function fiBlk(k,title,sum,body,o){o=o||{};const fold=fiFolded(k),id='fb-'+k;
  const ed=o.edit?`<button type="button" class="edl" data-act="${o.edit}"${o.ea||''}>${ICON.crayon} Modifier</button>`:'';
  return `<section class="rblk${o.hid?' fihid':''}"><div class="rbh"><button type="button" class="rbt" data-act="fiFold" data-k="${k}" aria-expanded="${!fold}" aria-controls="${id}"><span class="tt"><span class="t">${title}</span>${sum!==''&&sum!=null?`<span class="n">${sum}</span>`:''}</span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button>${ed}${o.eye||''}</div>${fold?'':`<div class="rbb" id="${id}">${body}</div>`}</section>`;}
/* Lot 8 b (26/11/2026) : Bestiaire › Spécimens connus — spec:[{id, nom, txt, rev, cree, par}], image illId('spec', id), un œil par spécimen */
const fiSpecSee=x=>!!x&&(isGest()||!!x.rev);
function fiSpecBlk(f,ed,G){const A=f.spec||[],V=A.filter(fiSpecSee),nr=A.filter(x=>x.rev).length;if(!V.length&&!ed)return '';
  const rows=V.map(x=>{const im=illOf('spec',x.id);return `<div class="fiit fispec${x.rev?'':' fihid'}">${im?`<button type="button" class="fithumb" data-act="fiImg" data-id="${esc(illId('spec',x.id))}" data-lab="${esc(x.nom)}" aria-label="Agrandir l'image de ${esc(x.nom)}"><img src="${im}" alt=""></button>`:''}<div class="fiitx"><b>${esc(x.nom)}</b>${(x.txt||'').trim()?`<div>${fiRich(x.txt)}</div>`:''}</div>${ed?`<button type="button" class="fiedi" data-act="fiSpec" data-i="${esc(x.id)}" aria-label="Modifier ${esc(x.nom)}">${ICON.crayon}</button>`:''}${G?eyeBtn('fiEye',`data-k="spec" data-i="${esc(x.id)}"`,!!x.rev,'Spécimen '+x.nom):''}</div>`;}).join('');
  return fiBlk('spec','Spécimens connus',G?`${nr} / ${A.length} révélé${nr>1?'s':''}`:String(V.length||''),(rows||'<div class="muted small">Aucun spécimen connu.</div>')+(ed?`<div class="radd"><button class="btn" data-act="fiSpec" data-i="">+ Un spécimen</button></div>`:''));}
function fiFicheView(f){
  const G=isGest(),E=canEdit(),ed=fiCanEd(f),Gm=FI_G[f.genre]||FI_G.lieu,e=fiEyeOf(f);
  let h=`<button class="back" data-act="fiBack">${FI_BACK}${Gm.pl}</button>`;
  if(G){if(f.vis!=='rev')h+=`<div class="fivis prep"><span class="fivi" aria-hidden="true">${EYE_C}</span><span class="fivt"><b>Fiche préparée</b> · invisible des joueurs</span><button class="btn pri" data-act="fiReveal">Révéler</button></div>`;
    else{const K=fiEyeKeys(f),n=K.filter(k=>e[k]).length;h+=`<div class="fivis">${eyeBtn('fiEye','data-k="fiche"',true,'Fiche '+f.nom)}<span class="fivt"><b>Fiche révélée</b> · ${n} bloc${n>1?'s':''} sur ${K.length} visible${n>1?'s':''}</span></div>`;}}
  const img=illOf('fiche',f.id),path=fiPath(f);
  const sub=[f.type?esc(f.type):'',...fi6Sub(f),...(f.genre==='famille'?faSub(f):[]),path.length&&f.genre!=='famille'?path.map(x=>fiSee(x)?lk({t:'fiche',id:x.id},x.nom):`<span class="nolk">${esc(x.nom)}</span>`).join(' › '):''].filter(Boolean).join(' · ');
  h+=`<div class="card fihead"><div class="fihd">${img?`<button type="button" class="fithumb" data-act="fiImg" data-id="${esc(illId('fiche',f.id))}" aria-label="Agrandir l'image de ${esc(f.nom)}"><img src="${img}" alt=""></button>`:`<span class="fithumb vide" aria-hidden="true">${FI_SVG(FI_IC[f.genre],26)}</span>`}<div style="flex:1;min-width:0"><h2 class="finm">${esc(f.nom)}</h2>${sub?`<div class="muted small">${sub}</div>`:''}${f.genre==='famille'?faHeadKv(f):''}</div>${f.kanka?kankaBtn(f.kanka,f.nom,'Fiche Kanka : '+f.nom):''}</div>
    ${ed?`<div style="margin-top:8px"><button type="button" class="edl" data-act="fiHead">${ICON.crayon} ${f.genre==='famille'?'Nom, type, suzerain, devise, race':'Nom, type'+(Gm.arbo?', '+Gm.par.toLowerCase():'')}${f.genre==='objet'?', unique, créateur':''}, image, Kanka</button></div>`:''}</div>`;
  const T6=fi6Tabs(f);if(T6){h+=T6;if(S.fiTab==='gest')return h+fi6Gest(f);} /* lot 6 : Fief rattaché à un PJ */
  const OT=f.genre==='org'?ogTab():'';if(OT)h+=ogTabsBar(OT); /* lot 5 a : onglets de l'organisation */
  /* Description */
  if((!OT||OT==='pres')&&fiBlkSee(f,'desc')&&((f.desc||'').trim()||ed))
    h+=fiBlk('desc',f.genre==='famille'?'Présentation':'Description','',(f.desc||'').trim()?fiRich(f.desc):'<div class="muted small">Pas encore de description.</div>',{edit:ed?'fiEd':'',ea:' data-b="desc"',hid:G&&!e.desc,eye:G?eyeBtn('fiEye','data-k="desc"',!!e.desc,'Description'):''});
  /* Ce que l'on sait : un œil par élément */
  if((!OT||OT==='pres')&&fiBlkSee(f,'sait')){const A=(f.sait||[]),V=A.filter(it=>fiItSee(f,it)),nr=A.filter(it=>it.rev).length;
    if(V.length||ed){const rows=V.map(it=>`<div class="fiit${it.rev?'':' fihid'}"><div class="fiitx">${fiRich(it.txt)}</div>${ed?`<button type="button" class="fiedi" data-act="fiItem" data-i="${esc(it.id)}" aria-label="Modifier l'élément">${ICON.crayon}</button>`:''}${G?eyeBtn('fiEye',`data-k="item" data-i="${esc(it.id)}"`,!!it.rev,"Élément de « Ce que l'on sait »"):''}</div>`).join('');
      h+=fiBlk('sait',"Ce que l'on sait",G?`${nr} / ${A.length} révélé${nr>1?'s':''}`:String(V.length||''),(rows||'<div class="muted small">Rien pour l\'instant.</div>')+(ed?`<div class="radd"><button class="btn" data-act="fiItem" data-i="">+ Un élément</button></div>`:''),{hid:G&&!e.sait,eye:G?eyeBtn('fiEye','data-k="sait"',!!e.sait,"Ce que l'on sait"):''});}}
  if(f.genre==='bete')h+=fiSpecBlk(f,ed,G); /* lot 8 b : spécimens connus */
  h+=fi6Blocks(f); /* lot 6 : blocs propres aux lieux et objets */
  if(OT)h+=ogBlocks(f,OT); /* lot 5 a */
  if(f.genre==='famille')h+=faBlocks(f); /* lot 5 b */
  if(OT&&OT!=='ctx')return h;
  /* Notes MJ : gestion seule, jamais révélées */
  if(G&&!Gm.noMj&&((f.notes||'').trim()||E))h+=fiBlk('notes','Notes MJ','jamais révélées',(f.notes||'').trim()?fiRich(f.notes):'<div class="muted small">Aucune note.</div>',{edit:E?'fiEd':'',ea:' data-b="notes"',hid:true});
  /* Mentions */
  const M=fiMentions('fiche',f.id);
  h+=fiBlk('ment','Mentions',M.length?M.length+' · mises à jour automatiquement':'',fiMentionsHtml(M));
  return h;}

/* ---------- Routage de l'Univers ---------- */
function fiUniView(){const f=S.fi&&S.fiches[S.fi];
  if(S.fi&&!f&&S.fichesReady)S.fi=null;
  if(f&&fiSee(f))return fiFicheView(f);
  if(f&&!fiSee(f)){S.fi=null;}
  if(S.fi&&!S.fichesReady)return `<div class="card empty">Chargement…</div>`;
  return fiListView(S.uni);}

/* ---------- Fenêtres ---------- */
const FI_DLG=new Set(['fiNew','fiHead','fiTxt','fiTyp','fiSpec','jrHead','jrEnt','jrJg']);
const FI_ED=new Set(['fiTxt','fiSpec','jrHead','jrEnt']); /* fenêtres avec l'éditeur « @ » (lot 2 : journaux et quêtes) */
let FI_K=0;
function fiOpenDlg(g){g._k='fd'+(++FI_K);S.dlg=g;S._fiRedraw=true;}
/* Les fenêtres de fiche ne sont pas redessinées pendant la saisie (synchronisation toutes les 5 s) */
function fiSheetHook(g,root){if(!FI_DLG.has(g.kind))return false;
  const ae=document.activeElement,typing=ae&&root.contains(ae)&&(/INPUT|TEXTAREA|SELECT/.test(ae.tagName)||ae.isContentEditable);
  if(!S._fiRedraw&&typing&&root.querySelector(`[data-fidlg="${g._k}"]`))return true;
  S._fiRedraw=false;const html=fiSheet(g);if(!html){S.dlg=null;root.innerHTML='';return true;}root.innerHTML=html;
  if(g.kind==='fiSpec'&&!g._foc){g._foc=true;const n=document.getElementById('fiSpN');if(n&&!n.value)n.focus();}
  else if(g.kind==='fiTxt'){const ed=document.getElementById('fiEd');if(ed&&!g._foc){g._foc=true;ed.focus();const r=document.createRange();r.selectNodeContents(ed);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);}}
  else if(/^jr/.test(g.kind)&&!g._foc){g._foc=true;const n=document.getElementById('jrNm');if(n&&!n.value)n.focus();}
  return true;}
const fiShell=(g,lab,body)=>`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(lab)}" data-fidlg="${g._k}"><div class="in">${body}</div></div>`;
function fiParOpts(g,cur,self){const L=fiSort(fiAll().filter(x=>x.genre===g&&fiSee(x)&&x.id!==self&&!(self&&fiPath(x).some(p=>p.id===self))));
  return `<option value="">— aucun —</option>`+L.map(x=>`<option value="${esc(x.id)}"${x.id===cur?' selected':''}>${esc(fiPath(x).filter(fiSee).map(p=>p.nom).concat([x.nom]).join(' › '))}${x.vis!=='rev'?' (préparé)':''}</option>`).join('');}
function fiTypeField(g,val){const T=fiTypes(g,isGest()),v=(val||'').trim(),known=!v||T.some(t=>t[0]===v);
  return `<div class="field"><label for="fiTy">Type</label><input id="fiTy" type="text" list="fiTyL" data-fin="type" value="${esc(val||'')}" autocomplete="off"><datalist id="fiTyL">${T.map(t=>`<option value="${esc(t[0])}">`).join('')}</datalist><div class="muted small" id="fiTyN"${known?' hidden':''}>Nouveau type : il s'ajoutera à la liste de valeurs.</div></div>`;}
function fiSheet(g){
  if(/^jr/.test(g.kind))return jrSheet(g); /* lot 2 */
  if(/^ch/.test(g.kind))return chSheet(g); /* lot 3 */
  if(/^pn/.test(g.kind))return pnSheet(g); /* lot 4 */
  if(/^fi6/.test(g.kind))return fi6Sheet(g); /* lot 6 */
  if(/^fiO/.test(g.kind))return ogSheet(g); /* lot 5 a */
  if(/^fa[A-Z]/.test(g.kind))return faSheet(g); /* lot 5 b */
  if(g.kind==='fiNew'){const Gm=FI_G[g.genre];if(!Gm||!fiCanNew())return null;
    return fiShell(g,Gm.nv,`<h2>${Gm.nv}</h2>
      <div class="field"><label for="fiNm">Nom</label><input id="fiNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div>
      ${fiTypeField(g.genre,g.type)}
      ${Gm.arbo?`<div class="field"><label for="fiPa">${Gm.par}</label><select id="fiPa" data-fin="parent">${fiParOpts(g.genre,g.parent,'')}</select></div>`:''}
      ${canEdit()?`<div class="field"><label>Visibilité</label><div class="seg" role="group" aria-label="Visibilité">${[['prep','Préparée'],['rev','Révélée']].map(([v,l])=>`<button type="button" data-act="fiVis" data-v="${v}" aria-pressed="${g.vis===v}">${l}</button>`).join('')}</div><div class="muted small" style="margin-top:6px">${g.vis==='prep'?'Préparée : rien n\'est montré aux joueurs tant que la fiche n\'est pas révélée.':'Révélée : la fiche et ses blocs sont visibles par toute la table.'}</div></div>`:'<div class="muted small">La fiche sera visible par toute la table.</div>'}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fiCreate"${(g.nom||'').trim()?'':' disabled'}>Créer</button></div>`);}
  if(g.kind==='fiHead'){const f=S.fiches[g.id];if(!f||!fiCanEd(f))return null;const Gm=FI_G[f.genre];
    return fiShell(g,'Modifier '+f.nom,`<h2>${esc(f.nom)}</h2>
      <div class="field"><label for="fiNm">Nom</label><input id="fiNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div>
      ${fiTypeField(f.genre,g.type)}
      ${Gm.arbo?`<div class="field"><label for="fiPa">${Gm.par}</label><select id="fiPa" data-fin="parent">${fiParOpts(f.genre,g.parent,f.id)}</select></div>`:''}
      ${f.genre==='objet'?fi6HeadFields(g):''}${f.genre==='famille'?faHeadFields(g):''}
      <div class="field"><label for="fiKk">Lien Kanka</label><input id="fiKk" type="url" data-fin="kanka" value="${esc(g.kanka)}" placeholder="https://app.kanka.io/…" autocomplete="off"></div>
      <div class="field"><label>Image</label>${illEdit('fiche',f.id,f.nom)}<div class="muted small" style="margin-top:4px">Une vignette carrée et l'image entière en grand (visible d'un clic sur la vignette).</div></div>
      ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fiHeadSave"${(g.nom||'').trim()?'':' disabled'}>Enregistrer</button></div>
      ${canEdit()?`<div class="fidel">${g.confirm?`<div class="muted small">Supprimer définitivement « ${esc(f.nom)} » ? Les liens vers cette fiche deviendront du texte simple${fiKidsOf(f.id).length?' et les fiches contenues remonteront d\'un niveau':''}.</div><div class="actions"><button class="btn ghost" data-act="fiDelNo">Garder</button><button class="btn" style="color:var(--bad)" data-act="fiDelOk">Supprimer</button></div>`:`<button class="btn ghost" style="color:var(--bad)" data-act="fiDel">Supprimer la fiche</button>`}</div>`:''}`);}
  if(g.kind==='fiTxt'){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;if(g.b==='notes'&&!canEdit())return null;
    const it=g.b==='item'&&g.iid?(f.sait||[]).find(x=>x.id===g.iid):null;if(g.b==='item'&&g.iid&&!it)return null;
    const tt=g.b==='desc'?(f.genre==='famille'?'Présentation':'Description'):g.b==='terr'?'Territoires':g.b==='notes'?'Notes MJ':g.b==='effet'?'Effet':g.b==='feerie'?'Situation féerique':g.b==='prat'?'Pratiques':it?"Ce que l'on sait":"Ce que l'on sait : nouvel élément";
    const canDel=it&&(canEdit()||it.par===ME);
    return fiShell(g,'Modifier : '+tt,`<div><h2>Modifier : ${tt}</h2><div class="muted small">${esc(f.nom)}</div></div>
      <div class="fiedw"><div id="fiEd" class="fied" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(tt)}" spellcheck="true">${fiEdHtml(g.txt)}</div><div id="fiSug" class="fisug" role="listbox" hidden></div></div>
      <div class="muted small">Tape <b>@</b> puis quelques lettres pour lier une fiche ; flèches + Entrée, ou un clic. Une ligne qui commence par « - » devient une liste.${g.b==='item'&&!it?(isGest()?' L\'élément sera préparé (œil fermé).':' L\'élément sera visible par toute la table.'):''}</div>
      <div class="actions">${canDel?(g.confirm?`<button class="btn" style="color:var(--bad)" data-act="fiItDelOk">Confirmer le retrait</button>`:`<button class="btn ghost" data-act="fiItDel">Retirer l'élément</button>`):''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fiTxtSave">Enregistrer</button></div>`);}
  if(g.kind==='fiSpec'){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;const it=g.iid?(f.spec||[]).find(x=>x.id===g.iid):null;if(g.iid&&!it)return null;
    return fiShell(g,'Spécimen connu',`<div><h2>${it?'Spécimen connu':'Nouveau spécimen'}</h2><div class="muted small">${esc(f.nom)}</div></div>
      <div class="field"><label for="fiSpN">Nom</label><input id="fiSpN" type="text" data-fin="nom" value="${esc(g.nom||'')}" autocomplete="off"></div>
      <div class="field"><label>Image</label>${illEdit('spec',g.sid,g.nom||f.nom)}</div>
      <div class="field"><label>Texte</label><div class="fiedw"><div id="fiEd" class="fied" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Texte du spécimen" spellcheck="true">${fiEdHtml(g.txt)}</div><div id="fiSug" class="fisug" role="listbox" hidden></div></div></div>
      <div class="muted small">Tape <b>@</b> pour lier une fiche.${it?'':isGest()?' Le spécimen sera préparé (œil fermé).':' Le spécimen sera visible par toute la table.'}</div>
      ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
      <div class="actions">${it?(g.confirm?`<button class="btn" style="color:var(--bad)" data-act="fiSpecDelOk">Confirmer le retrait</button>`:`<button class="btn ghost" data-act="fiSpecDel">Retirer</button>`):''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fiSpecSave">Enregistrer</button></div>`);}
  if(g.kind==='fiTyp'){if(!canEdit())return null;const T=fiTypes(g.genre,true),n=(T.find(t=>t[0]===g.type)||[,0])[1];
    const others=T.filter(t=>t[0]!==g.type),v=(g.nom||'').trim(),dup=others.some(t=>t[0]===v);
    return fiShell(g,'Type '+g.type,`<div><h2>${esc(g.type)}</h2><div class="muted small">${esc(fiGm(g.genre).tl)} · ${n} ${g.genre==='jour'?'journa'+(n>1?'ux':'l'):'fiche'+(n>1?'s':'')}</div></div>
      <div class="field"><label for="fiTn">Renommer</label><input id="fiTn" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"><div class="muted small" id="fiTyD"${dup?'':' hidden'}>Ce nom existe déjà : les deux types seront fusionnés.</div></div>
      ${others.length?`<div class="field"><label for="fiTi">Ou fusionner dans…</label><select id="fiTi" data-fin="into"><option value="">— choisir un type —</option>${others.map(t=>`<option value="${esc(t[0])}"${g.into===t[0]?' selected':''}>${esc(t[0])} (${t[1]})</option>`).join('')}</select></div>`:''}
      <div class="muted small">Met à jour ${g.genre==='jour'?'tous les journaux concernés':'toutes les fiches concernées'}.</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fiTypSave">Appliquer</button></div>`);}
  return null;}

/* ---------- Paramètres › Référentiel › Listes de valeurs ---------- */
const fiGm=g=>g==='jour'?JR_G:FI_G[g];
function fiListes(){const g=FI_G[S.fiLv]||S.fiLv==='jour'?S.fiLv:'lieu',T=fiTypes(g,true),E=canEdit(),R=FI_RES[g]||[],Gm=fiGm(g);
  let h=`<div class="seg fiseg" role="group" aria-label="Liste de valeurs">${[...Object.entries(FI_G),['jour',JR_G]].map(([k,x])=>`<button type="button" data-act="fiLv" data-v="${k}" aria-pressed="${g===k}">${x.pl}</button>`).join('')}</div>`;
  h+=`<div class="card"><h3 class="rs" style="margin-top:0">${esc(Gm.tl)} <span class="muted small">${T.length}</span></h3>`;
  h+=T.length?`<div class="filv">${T.map(([t,n])=>`<div class="filvr"><span><b>${esc(t)}</b><small>${n} ${n>1?Gm.pl.toLowerCase():Gm.un}${R.includes(t)?' · type spécial':''}</small></span>${E&&!R.includes(t)?`<button type="button" class="edl" data-act="fiTyp" data-g="${g}" data-v="${esc(t)}">${ICON.crayon} Renommer ou fusionner</button>`:''}</div>`).join('')}</div>`:(g==='jour'?'<div class="muted small">Aucun type pour l\'instant : les types se créent avec les journaux.</div>':'<div class="muted small">Aucun type pour l\'instant : les types se créent avec les fiches.</div>');
  return h+`</div><div class="muted small" style="margin-top:10px">Renommer ou fusionner met à jour ${g==='jour'?'tous les journaux concernés. Un type sans journal disparaît de la liste (les types de départ restent proposés à la saisie).':'toutes les fiches concernées. Un type sans fiche disparaît de la liste.'}${g==='lieu'?' « Fief » est réservé : il servira au bloc Fief (lot 7).':''}</div>`;}

/* ---------- Visionneur d'image plein écran (vignettes de fiche et portraits) ---------- */
const FI_BIG={};
function fiBigSave(ill,im){if(!im||!DB||!DB.img||S.visit||writesLocked())return;
  const w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,1600/Math.max(w,h)),cv=document.createElement('canvas');cv.width=Math.round(w*k);cv.height=Math.round(h*k);
  const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0,cv.width,cv.height);
  let q=.85,data=cv.toDataURL('image/jpeg',q);while(data.length>900000&&q>.45){q-=.1;data=cv.toDataURL('image/jpeg',q);}
  FI_BIG[ill]=data;DB.img.set(ill,data).catch(e=>{console.error(e);toast("Grande image non enregistrée (script SQL du lot 1 à installer)");});}
function fiBigDel(ill){delete FI_BIG[ill];if(DB&&DB.img&&!S.visit&&!writesLocked())DB.img.del(ill).catch(()=>{});}
let FI_VW=null;
function fiViewer(src,big,title){fiViewerClose();if(!src)return;
  const el=document.createElement('div');el.id='fiVw';el.className='fivw';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',title||'Image agrandie');
  el.innerHTML=`<div class="fivwh"><span class="fivwt">${esc(title||'')}</span><button type="button" class="fivwx" data-vw="x" aria-label="Fermer">✕</button></div><div class="fivws"><img alt="${esc(title||'')}" src="${src}" draggable="false"></div><div class="fivwz"><button type="button" data-vw="-" aria-label="Dézoomer">−</button><span data-vw="p">100 %</span><button type="button" data-vw="+" aria-label="Zoomer">+</button></div>`;
  document.body.appendChild(el);const img=el.querySelector('img');
  FI_VW={el,img,z:1,x:0,y:0,pts:new Map(),d0:0,z0:1,last:0,prev:document.activeElement};
  const paint=()=>{const v=FI_VW;if(!v)return;img.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.z})`;el.querySelector('[data-vw="p"]').textContent=Math.round(v.z*100)+' %';};
  const zoom=(z)=>{const v=FI_VW;v.z=Math.max(1,Math.min(8,z));if(v.z===1){v.x=0;v.y=0;}paint();};
  el.addEventListener('click',ev=>{const b=ev.target.closest('[data-vw]');if(!b){if(ev.target===el)fiViewerClose();return;}const k=b.dataset.vw;if(k==='x')fiViewerClose();else if(k==='+')zoom(FI_VW.z*1.4);else if(k==='-')zoom(FI_VW.z/1.4);});
  const st=el.querySelector('.fivws');
  st.addEventListener('wheel',ev=>{ev.preventDefault();zoom(FI_VW.z*(ev.deltaY<0?1.15:1/1.15));},{passive:false});
  st.addEventListener('dblclick',()=>zoom(1));
  st.addEventListener('pointerdown',ev=>{const v=FI_VW;st.setPointerCapture&&st.setPointerCapture(ev.pointerId);v.pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(v.pts.size===2){const [a,b]=[...v.pts.values()];v.d0=Math.hypot(a.x-b.x,a.y-b.y);v.z0=v.z;}
    else if(ev.pointerType!=='mouse'){const t=Date.now();if(t-v.last<300)zoom(1);v.last=t;}ev.preventDefault();});
  st.addEventListener('pointermove',ev=>{const v=FI_VW;if(!v||!v.pts.has(ev.pointerId))return;const p=v.pts.get(ev.pointerId);
    if(v.pts.size===2){v.pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});const [a,b]=[...v.pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(v.d0)zoom(v.z0*d/v.d0);return;}
    if(v.z>1){v.x+=ev.clientX-p.x;v.y+=ev.clientY-p.y;paint();}v.pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});});
  const up=ev=>{if(FI_VW)FI_VW.pts.delete(ev.pointerId);};st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
  el.querySelector('.fivwx').focus();
  if(big){if(FI_BIG[big])img.src=FI_BIG[big];else if(DB&&DB.img)DB.img.get(big).then(d=>{if(d&&typeof d==='string'){FI_BIG[big]=d;if(FI_VW&&FI_VW.img===img)img.src=d;}}).catch(()=>{});}}
function fiViewerClose(){if(!FI_VW)return;const p=FI_VW.prev;FI_VW.el.remove();FI_VW=null;if(p&&p.focus)try{p.focus();}catch(e){}}
/* Lot 2 bis (24/11/2026) : image entière sur les fiches Personnage, Race, Pouvoir, Capacité.
   La grande image (table images) est chargée à la demande ; en attendant, ou si elle n'existe pas (image d'avant le lot), la vignette. */
const FI_ASK=new Set();
function bigSrc(id,vign){if(FI_BIG[id])return FI_BIG[id];
  if(id&&!FI_ASK.has(id)&&typeof DB!=='undefined'&&DB&&DB.img){FI_ASK.add(id);DB.img.get(id).then(d=>{if(d&&typeof d==='string'){FI_BIG[id]=d;document.querySelectorAll('img[data-big]').forEach(im=>{if(im.dataset.big===id)im.src=d;});}}).catch(()=>{});}
  return vign;}
function bigImg(id,vign,lab){if(!vign)return '';
  return `<button type="button" class="fibig" data-act="fiBig" data-id="${esc(id)}" data-src="${esc(vign)}" data-lab="${esc(lab||'')}" aria-label="Agrandir l'image${lab?' : '+esc(lab):''}"><img src="${bigSrc(id,vign)}" data-big="${esc(id)}" alt=""></button>`;}

/* ---------- Saisie « @ » dans l'éditeur ---------- */
let FI_AT=null;
function fiAtClose(){if(!FI_AT)return;FI_AT=null;fiAtPaint();}
function fiAtCheck(){const s=window.getSelection();if(!s||!s.rangeCount||!s.isCollapsed){fiAtClose();return;}
  const r=s.getRangeAt(0),n=r.startContainer;if(n.nodeType!==3||!n.parentNode||!n.parentNode.closest||!n.parentNode.closest('#fiEd')){fiAtClose();return;}
  const before=n.nodeValue.slice(0,r.startOffset),m=before.match(/(?:^|[\s(«"' ])@([^@\n]{0,30})$/);
  if(!m||/\s{2}/.test(m[1])){fiAtClose();return;}
  let q=m[1].replace(/ /g,' '),items=fiSugList(q),after=0;if(!items.length&&/\s$/.test(q)){fiAtClose();return;}
  /* « @ » tapé juste devant un mot déjà écrit (24/11) : ce mot (jusqu'à 4 mots) sert de recherche et sera remplacé par le lien */
  if(!q){const nx=n.nodeValue.slice(r.startOffset).replace(/ /g,' '),w=nx.match(/^[^\s@.,;:!?»)\]]+(?:[ '’-][^\s@.,;:!?»)\]]+){0,3}/);
    if(w){const parts=w[0].split(/(?=[ '’-])/);for(let k=parts.length;k>=1;k--){const cand=parts.slice(0,k).join(''),L=fiSugList(cand);if(L.length&&(k===1||L.some(x=>nrm(x.nom).startsWith(nrm(cand))))){q=cand;items=L;after=cand.length;break;}}}}
  FI_AT={node:n,start:r.startOffset-m[1].length-1,q,items,sel:0,after};fiAtPaint();}
function fiAtPaint(){const box=document.getElementById('fiSug');if(!box)return;if(!FI_AT){box.hidden=true;box.innerHTML='';return;}
  const q=FI_AT.q.trim(),hl=s=>{if(!q)return esc(s);const i=nrm(s).indexOf(nrm(q));return i<0?esc(s):esc(s.slice(0,i))+'<b>'+esc(s.slice(i,i+q.length))+'</b>'+esc(s.slice(i+q.length));};
  box.hidden=false;box.innerHTML=`<div class="fisugh">${q?`Fiches correspondant à « ${esc(q)} »`:'Fiches'}</div>`+(FI_AT.items.length?FI_AT.items.map((x,i)=>`<button type="button" class="fisugi" role="option" data-act="fiSug" data-i="${i}" aria-selected="${i===FI_AT.sel}"><span>${hl(x.nom)}</span><small>${esc(x.kind)}${x.prep?' · <i>préparé</i>':''}</small></button>`).join(''):'<div class="muted small" style="padding:6px 10px">Aucune fiche ne correspond.</div>');}
function fiAtPick(i){const x=FI_AT&&FI_AT.items[i],ed=document.getElementById('fiEd');if(!x||!ed)return;const n=FI_AT.node;if(!n||!n.parentNode||!ed.contains(n)){fiAtClose();return;}
  let end=n.nodeValue.length;const s=window.getSelection();if(s&&s.rangeCount&&s.getRangeAt(0).startContainer===n)end=Math.min(n.nodeValue.length,s.getRangeAt(0).startOffset+(FI_AT.after||0));
  const nxc=n.nodeValue.charAt(end),noSp=!!FI_AT.after&&/^[\s\u00a0.,;:!?»)\]]$/.test(nxc); /* mot repris : pas d'espace en double ni devant la ponctuation */
  const rg=document.createRange();rg.setStart(n,Math.max(0,FI_AT.start));rg.setEnd(n,Math.max(FI_AT.start,end));rg.deleteContents();
  const box=document.createElement('span');box.innerHTML=fiTagHtml(x.t,x.id,x.nom,fiTokStore(x.t,x.id,x.nom));const tag=box.firstChild,sp=document.createTextNode(noSp?'':' ');
  rg.insertNode(sp);rg.insertNode(tag);const r2=document.createRange();r2.setStartAfter(sp);r2.collapse(true);
  ed.focus();const s2=window.getSelection();s2.removeAllRanges();s2.addRange(r2);FI_AT=null;fiAtPaint();if(S.dlg&&FI_ED.has(S.dlg.kind))S.dlg.txt=fiSer(ed);}

/* ---------- Événements du clavier et des saisies ---------- */
document.addEventListener('mousedown',ev=>{if(ev.target.closest&&ev.target.closest('.fisugi'))ev.preventDefault();});
document.addEventListener('keydown',ev=>{
  if(FI_VW&&ev.key==='Escape'){ev.preventDefault();fiViewerClose();return;}
  const t=ev.target;if(!t||t.id!=='fiEd')return;
  if(FI_AT&&FI_AT.items.length&&['ArrowDown','ArrowUp','Enter','Tab'].includes(ev.key)){ev.preventDefault();
    if(ev.key==='ArrowDown'){FI_AT.sel=(FI_AT.sel+1)%FI_AT.items.length;fiAtPaint();}else if(ev.key==='ArrowUp'){FI_AT.sel=(FI_AT.sel-1+FI_AT.items.length)%FI_AT.items.length;fiAtPaint();}else fiAtPick(FI_AT.sel);return;}
  if(FI_AT&&ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();fiAtClose();return;}
  if(ev.key==='Backspace'){const s=window.getSelection();if(!s||!s.rangeCount||!s.isCollapsed)return;const r=s.getRangeAt(0);let n=r.startContainer,o=r.startOffset,prev=null;
    if(n.nodeType===3&&o===0)prev=n.previousSibling;else if(n.nodeType===1&&o>0)prev=n.childNodes[o-1];
    if(prev&&prev.nodeType===1&&prev.dataset&&prev.dataset.tok){ev.preventDefault();prev.remove();if(S.dlg&&FI_ED.has(S.dlg.kind))S.dlg.txt=fiSer(t);fiAtClose();}}
},true);
document.addEventListener('paste',ev=>{const t=ev.target&&ev.target.closest&&ev.target.closest('#fiEd');if(!t)return;ev.preventDefault();const s=(ev.clipboardData&&ev.clipboardData.getData('text/plain'))||'';if(s)document.execCommand('insertText',false,s);});
document.addEventListener('input',ev=>{const t=ev.target;if(!t)return;
  if(t.id==='fiEd'){if(S.dlg&&FI_ED.has(S.dlg.kind))S.dlg.txt=fiSer(t);fiAtCheck();return;}
  if(t.dataset&&t.dataset.fiq!==undefined){S.fiQ=t.value;const r=document.getElementById('fiRes');if(r&&FI_G[S.uni])r.innerHTML=fiListBody(S.uni);return;}
  if(t.dataset&&t.dataset.fin!==undefined&&S.dlg&&FI_DLG.has(S.dlg.kind)){const g=S.dlg,k=t.dataset.fin;g[k]=t.type==='checkbox'?t.checked:t.value;
    const q=s=>document.querySelector('#sheetRoot '+s);
    if(k==='nom'){const b=q('[data-act="fiCreate"],[data-act="fiHeadSave"],[data-act="jrHeadSave"],[data-act="jrEntSave"]');if(b)b.disabled=!t.value.trim();
      if(g.kind==='fiTyp'){const e=q('#fiTyD');if(e)e.hidden=!fiTypes(g.genre,true).some(x=>x[0]!==g.type&&x[0]===t.value.trim());}}
    if(k==='type'){const e=q('#fiTyN'),gen=g.kind==='fiNew'?g.genre:(S.fiches[g.id]||{}).genre,v=t.value.trim();if(e)e.hidden=!v||fiTypes(gen,isGest()).some(x=>x[0]===v);}}
});
document.addEventListener('focusout',ev=>{if(ev.target&&ev.target.id==='fiEd')setTimeout(()=>{if(!document.activeElement||document.activeElement.id!=='fiEd')fiAtClose();},150);});

/* ---------- Clics ---------- */
function fiAct(a,d){
  if(/^jr[A-Z]/.test(a))return jrAct(a,d); /* lot 2 : journaux et quêtes */
  if(/^ch[A-Z]/.test(a))return chAct(a,d); /* lot 3 : chronique et calendrier */
  if(/^pn[A-Z]/.test(a))return pnAct(a,d); /* lot 4 : PNJ */
  if(a==='uni'){S.uni=d.v||'home';S.chPage=null;S.sec=null;S.rf=null;S.fi=null;S.fiQ='';S.fiTy='';window.scrollTo(0,0);render();return true;}
  if(a==='fiOpen'){const f=S.fiches[d.id];if(!fiSee(f))return true;S.fiTab='';S.fi=f.id;S.uni=f.genre;window.scrollTo(0,0);render();return true;}
  if(a==='fiBack'){if(S.nav.length){navBack();return true;}S.fi=null;window.scrollTo(0,0);render();return true;}
  if(a==='fiFold'){S.fiFold={...S.fiFold,[d.k]:!fiFolded(d.k)};render();return true;}
  if(a==='fiTree'){S.fiTree={...S.fiTree,[d.id]:!S.fiTree[d.id]};render();return true;}
  if(a==='fiTy'){S.fiTy=d.v||'';render();return true;}
  if(a==='fiLv'){S.fiLv=d.v;render();return true;}
  if(a==='fiImg'){if(d.cid){const c=S.chars[d.cid];fiViewer(c&&portrait(c),d.cid,c&&c.court);return true;}
    const src=S.ptr&&S.ptr[d.id];const f=S.fiches[String(d.id).replace(/^ill-fiche-/,'')];fiViewer(src,d.id,f?f.nom:(d.lab||''));return true;}
  if(a==='fiBig'){fiViewer(FI_BIG[d.id]||d.src,d.id,d.lab);return true;}
  if(a==='fiSug'){fiAtPick(+d.i);return true;}
  if(a==='closeSheet'&&S.dlg&&FI_DLG.has(S.dlg.kind)){FI_AT=null;return false;}
  if(/^fi6[A-Z]/.test(a))return fi6Act(a,d); /* lot 6 */
  if(/^fiO[A-Z]/.test(a)||(a==='situEd'&&(d.k==='orgs'||d.k==='titres')))return ogAct(a,d); /* lot 5 a */
  if(/^fa[A-Z]/.test(a))return faAct(a,d); /* lot 5 b */
  if(!/^fi[A-Z]/.test(a))return false;
  if(S.visit)return true;
  const f=S.fi&&S.fiches[S.fi];
  if(a==='fiNew'){if(!fiCanNew()||!FI_G[d.g])return true;const cur=f&&f.genre===d.g?f.id:'';fiOpenDlg({kind:'fiNew',genre:d.g,nom:'',type:'',parent:FI_G[d.g].arbo?cur:'',vis:canEdit()?'prep':'rev'});render();return true;}
  if(a==='fiVis'){if(S.dlg&&S.dlg.kind==='fiNew'&&canEdit()){S.dlg.vis=d.v==='rev'?'rev':'prep';S._fiRedraw=true;render();}return true;}
  if(a==='fiCreate'){const g=S.dlg;if(!g||g.kind!=='fiNew'||!fiCanNew())return true;const nom=(g.nom||'').trim();if(!nom)return true;
    const gest=canEdit(),rev=gest?g.vis==='rev':true,now=new Date().toISOString();
    const nf={id:fiRid('f-'),genre:g.genre,nom,type:(g.type||'').trim(),parent:FI_G[g.genre].arbo&&g.parent&&S.fiches[g.parent]?g.parent:'',kanka:'',vis:rev?'rev':'prep',eye:Object.fromEntries(['desc','sait'].concat(g.genre==='org'||g.genre==='famille'?FI6_EYE[g.genre]:[]).map(k=>[k,rev])),desc:'',sait:[],notes:'',par:ME||'',cree:now,modif:now};
    S.dlg=null;S.fi=nf.id;S.uni=nf.genre;S.fiQ='';S.fiTy='';fiSave(nf);window.scrollTo(0,0);setTimeout(()=>toast('Fiche créée'),0);return true;}
  if(a==='fiReveal'){if(!f||!isGest())return true;const n=clone(f);n.vis='rev';fiSave(n);return true;}
  if(a==='fiEye'){if(!f||!isGest())return true;const n=clone(f),e={...fiEyeOf(n)};let open;
    if(d.k==='fiche'){open=n.vis!=='rev';if(!open&&!canEdit())return true;n.vis=open?'rev':'prep';}
    else if(fiEyeKeys(n).includes(d.k)){open=!e[d.k];if(!open&&!canEdit())return true;e[d.k]=open;n.eye=e;}
    else if(d.k==='item'){const it=(n.sait||[]).find(x=>x.id===d.i);if(!it)return true;open=!it.rev;if(!open&&!canEdit())return true;it.rev=open;}
    else if(d.k==='spec'){const it=(n.spec||[]).find(x=>x.id===d.i);if(!it)return true;open=!it.rev;if(!open&&!canEdit())return true;it.rev=open;}
    else return true;fiSave(n);return true;}
  if(a==='fiHead'){if(!fiCanEd(f))return true;fiOpenDlg({kind:'fiHead',id:f.id,nom:f.nom,type:f.type||'',parent:f.parent||'',kanka:f.kanka||'',uniq:!!f.uniq,creaId:(f.crea||{}).id||'',creaNom:(f.crea||{}).id?'':((f.crea||{}).nom||''),devise:f.devise||'',race:f.race||'',speci:f.speci||'',suzT:f.suzT||''});render();return true;}
  if(a==='fiHeadSave'){const g=S.dlg,x=g&&S.fiches[g.id];if(!x||!fiCanEd(x))return true;const nom=(g.nom||'').trim(),kk=(g.kanka||'').trim();
    if(!nom)return true;if(kk&&!/^https?:\/\//.test(kk)){g.err='Le lien Kanka doit commencer par https://';S._fiRedraw=true;render();return true;}
    const n=clone(x);n.nom=nom;n.type=(g.type||'').trim();n.kanka=kk;if(x.genre==='objet')fi6HeadApply(n,g);
    if(FI_G[x.genre].arbo){const p=g.parent&&S.fiches[g.parent];n.parent=p&&p.id!==x.id&&!fiPath(p).some(q=>q.id===x.id)?p.id:'';}
    if(x.genre==='famille')faHeadApply(n,g); /* lot 5 b */
    S.dlg=null;fiSave(n);setTimeout(()=>toast('Fiche enregistrée'),0);return true;}
  if(a==='fiDel'){if(S.dlg&&S.dlg.kind==='fiHead'&&canEdit()){S.dlg.confirm=true;S._fiRedraw=true;render();}return true;}
  if(a==='fiDelNo'){if(S.dlg){S.dlg.confirm=false;S._fiRedraw=true;render();}return true;}
  if(a==='fiDelOk'){const g=S.dlg;if(!g||g.kind!=='fiHead'||!canEdit())return true;const x=S.fiches[g.id];S.dlg=null;if(x){S.fi=null;fiRemove(x.id);}render();setTimeout(()=>toast('Fiche supprimée'),0);return true;}
  if(a==='fiEd'){if(!fiCanEd(f))return true;if(d.b==='notes'&&!canEdit())return true;fiOpenDlg({kind:'fiTxt',fid:f.id,b:d.b,txt:d.b==='notes'?(f.notes||''):d.b==='effet'?(f.effet||''):d.b==='feerie'?((f.fief||{}).feerie||''):d.b==='prat'?(f.prat||''):d.b==='terr'?(f.terr||''):(f.desc||'')});render();return true;}
  if(a==='fiItem'){if(!fiCanEd(f))return true;const it=d.i?(f.sait||[]).find(x=>x.id===d.i):null;if(d.i&&!it)return true;fiOpenDlg({kind:'fiTxt',fid:f.id,b:'item',iid:it?it.id:'',txt:it?it.txt:''});render();return true;}
  if(a==='fiSpec'){if(!fiCanEd(f))return true;const it=d.i?(f.spec||[]).find(x=>x.id===d.i):null;if(d.i&&!it)return true;fiOpenDlg({kind:'fiSpec',fid:f.id,iid:it?it.id:'',sid:it?it.id:fiRid('s'),nom:it?it.nom:'',txt:it?(it.txt||''):''});render();return true;}
  if(a==='fiSpecDel'){if(S.dlg&&S.dlg.kind==='fiSpec'){S.dlg.confirm=true;S._fiRedraw=true;render();}return true;}
  if(a==='fiSpecDelOk'){const g=S.dlg,x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const n=clone(x);n.spec=(n.spec||[]).filter(y=>y.id!==g.iid);S.dlg=null;fiSave(n);return true;}
  if(a==='fiSpecSave'){const g=S.dlg,x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const nom=(g.nom||'').trim();if(!nom){g.err='Le nom est obligatoire.';S._fiRedraw=true;render();return true;}
    const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||''),n=clone(x);n.spec=n.spec||[];const it=g.iid&&n.spec.find(y=>y.id===g.iid);
    if(it){it.nom=nom;it.txt=txt;}else n.spec.push({id:g.sid,nom,txt,rev:!isGest(),cree:new Date().toISOString(),par:ME||''});
    FI_AT=null;S.dlg=null;fiSave(n);return true;}
  if(a==='fiItDel'){if(S.dlg&&S.dlg.kind==='fiTxt'){S.dlg.confirm=true;S._fiRedraw=true;render();}return true;}
  if(a==='fiItDelOk'){const g=S.dlg,x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const it=(x.sait||[]).find(y=>y.id===g.iid);if(!it||!(canEdit()||it.par===ME))return true;
    const n=clone(x);n.sait=n.sait.filter(y=>y.id!==g.iid);S.dlg=null;fiSave(n);return true;}
  if(a==='fiTxtSave'){const g=S.dlg,x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||'');
    const n=clone(x);
    if(g.b==='desc')n.desc=txt;
    else if(g.b==='effet')n.effet=txt;
    else if(g.b==='feerie')n.fief={...(n.fief||{}),feerie:txt};
    else if(g.b==='prat')n.prat=txt; /* lot 5 a */
    else if(g.b==='terr')n.terr=txt; /* lot 5 b */
    else if(g.b==='notes'){if(!canEdit())return true;n.notes=txt;}
    else if(g.b==='item'){n.sait=n.sait||[];if(g.iid){const it=n.sait.find(y=>y.id===g.iid);if(!it)return true;if(!txt){n.sait=n.sait.filter(y=>y.id!==g.iid);}else it.txt=txt;}
      else{if(!txt){S.dlg=null;render();return true;}n.sait.push({id:fiRid('i'),txt,rev:!isGest(),cree:new Date().toISOString(),par:ME||''});}}
    FI_AT=null;S.dlg=null;fiSave(n);return true;}
  if(a==='fiTyp'){if(!canEdit()||(FI_RES[d.g]||[]).includes(d.v))return true;fiOpenDlg({kind:'fiTyp',genre:d.g,type:d.v,nom:d.v,into:''});render();return true;}
  if(a==='fiTypSave'){const g=S.dlg;if(!g||g.kind!=='fiTyp'||!canEdit())return true;const to=(g.into||'').trim()||(g.nom||'').trim();S.dlg=null;
    if(to&&to!==g.type){fiTypApply(g.genre,g.type,to);setTimeout(()=>toast('Type mis à jour'),0);}else render();return true;}
  return false;}
/* Listes déroulantes des fenêtres de fiche */
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.fin===undefined||!S.dlg||!FI_DLG.has(S.dlg.kind))return;S.dlg[t.dataset.fin]=t.type==='checkbox'?t.checked:t.value;});

/* ---------- Lot 2 (23/11/2026) : journaux v2 et quêtes — onglet « Chronique » de la fiche de personnage ----------
   Collection « journaux », une ligne par journal ou quête :
   {id:'j-…', genre:'journal'|'quete', perso, parts:[personnages], nom, type (journal : liste de valeurs ; quête : 'perso'|'groupe'),
    statut (quête : 'cours'|'fin'|'aband'), desc, pub, ent:[{id, nom, txt, dj:{a,m,j?}, auteur, by, pc, cree, ecrit}],
    jauge (quête : {id, nom, taille, diff, cases, hist, ouv}), jaugesFinies:[…], par, cree, modif}
   Privé = joueurs des participants + gestion ; Public = toute la table. Les anciennes lignes journaux/<personnage> ({list})
   sont gardées et ignorées (reprises par la version des données 2). */
if(S.jrOpen===undefined)S.jrOpen=null;if(S.jrSel===undefined)S.jrSel=null;S.jrHl=null;
const JR_TY0=['Correspondance','Interactions','Opinion','Rumeurs','Notes de travail','Recherches et entretiens','Archives familiales'];
const JR_ST=[['cours','En cours'],['fin','Terminée'],['aband','Abandonnée']];
const JR_STG={cours:'En cours',fin:'Terminées',aband:'Abandonnées'};
const JR_MOIS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const JR_JS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const JR_G={pl:'Journaux',un:'journal',tl:'Types de journal'};
const jrAll=()=>Object.values(S.jour||{}).filter(j=>j&&(j.genre==='journal'||j.genre==='quete'));
const jrParts=j=>(j&&j.parts&&j.parts.length?j.parts:[j&&j.perso]).filter(Boolean);
const jrMine=j=>!!ME&&jrParts(j).some(id=>{const c=S.chars[id];return !!c&&owners(c).some(p=>p.id===ME);});
const jrCanEd=j=>!!j&&!S.visit&&(isGest()||jrMine(j));
const jrCanRead=j=>!!j&&(!!j.pub||jrCanEd(j));
const jrEntEd=(j,e)=>jrCanEd(j)&&!!e&&(isGest()||(!!ME&&e.by===ME));
const jrOf=c=>jrAll().filter(j=>jrParts(j).includes(c.id)&&jrCanRead(j));
const jrHost=j=>{if(!j)return null;const L=[j.perso,...jrParts(j)].map(id=>S.chars[id]).filter(c=>c&&vis(c));return L[0]||null;};
const jrByNom=(a,b)=>(a.nom||'').localeCompare(b.nom||'','fr',{sensitivity:'base'});
function jrTypes(){const m={};for(const j of jrAll())if(j.genre==='journal'){const t=(j.type||'').trim();if(t)m[t]=(m[t]||0)+1;}
  return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0],'fr',{sensitivity:'base'}));}
/* Dates du jeu : vrai calendrier ; jour facultatif (« novembre 1899 ») */
const jrDjKey=dj=>dj&&dj.a&&dj.m?dj.a*10000+dj.m*100+(dj.j||0):null;
function jrDjTxt(dj){if(!dj||!dj.a||!dj.m)return '';const mo=JR_MOIS[dj.m-1]||'';if(!dj.j)return mo+' '+dj.a;
  const w=new Date(Date.UTC(dj.a,dj.m-1,dj.j)).getUTCDay();return JR_JS[w]+' '+(dj.j===1?'1er':dj.j)+' '+mo+' '+dj.a;}
const jrDjIso=dj=>dj&&dj.a&&dj.m?`${dj.a}-${String(dj.m).padStart(2,'0')}-${String(dj.j||1).padStart(2,'0')}`:'';
/* Entrées : par date du jeu (la plus ancienne en haut), puis celles sans date dans l'ordre d'ajout */
function jrEntSorted(j){return (j.ent||[]).map((e,i)=>({e,i,k:jrDjKey(e.dj)})).sort((a,b)=>a.k!=null&&b.k!=null?a.k-b.k||a.i-b.i:a.k!=null?-1:b.k!=null?1:a.i-b.i).map(x=>x.e);}
function jrSave(j,quiet){j=clone(j);j.modif=new Date().toISOString();S.jour={...(S.jour||{}),[j.id]:j};persist('journaux/'+j.id,j);if(!quiet)render();return j;}
/* Modification à partir de la ligne la plus récente reçue (quête de groupe : plusieurs auteurs) */
function jrUpd(id,fn){const x=S.jour&&S.jour[id];if(!x)return null;const n=clone(x);if(fn(n)===false)return null;return jrSave(n);}

/* ---------- Vues ---------- */
const jrSw=(j,E)=>E?`<button type="button" class="jrsw${j.pub?' pub':''}" role="switch" aria-checked="${!!j.pub}" data-act="jrPub" data-j="${esc(j.id)}" aria-label="${esc(j.nom)} : ${j.pub?'public, lisible par toute la table':'privé'}"><i aria-hidden="true"></i>${j.pub?'Public':'Privé'}</button>`
  :`<span class="jrsw ro${j.pub?' pub':''}">${j.pub?'Public':'Privé'}</span>`;
const jrQType=j=>j.type==='groupe'?'De groupe':'Personnelle';
function jrCard(c,j){const n=(j.ent||[]).length,q=j.genre==='quete';
  const oth=jrParts(j).filter(id=>id!==c.id).map(id=>S.chars[id]).filter(x=>x&&vis(x)).map(x=>x.court||x.nom);
  const bits=[];if(q)bits.push(jrQType(j)+(j.type==='groupe'&&oth.length?' · avec '+oth.join(', '):''));
  bits.push(n+' entrée'+(n>1?'s':''));if(q&&j.jauge)bits.push('jauge '+(j.jauge.cases||0)+' / '+j.jauge.taille);
  return `<div class="jrc"><button type="button" class="jro" data-act="jrOpen" data-j="${esc(j.id)}"><span class="jic" aria-hidden="true">${esc((j.nom||'?').slice(0,1).toUpperCase())}</span><span class="jrt"><b>${esc(j.nom)}</b><span class="d">${!q&&j.type?`<span class="jrty">${esc(j.type)}</span> · `:''}${esc(bits.join(' · '))}</span></span></button>${jrSw(j,jrCanEd(j))}</div>`;}
function jrView(c){const L=jrOf(c),E=canEditC(c),open=S.jrOpen&&L.find(j=>j.id===S.jrOpen);
  if(open)return jrOpenView(c,open);
  const Q=L.filter(j=>j.genre==='quete'),J=L.filter(j=>j.genre==='journal').sort(jrByNom),sel=S.jrSel||(Q.length?'q':'j'),who=esc(c.court||c.nom);
  let h=`<div class="seg jrsel" role="group" aria-label="Quêtes, journaux ou feuilleton">${[['q','Quêtes'],['j','Journaux'],['f','Feuilleton']].map(([k,l])=>`<button type="button" data-act="jrSel" data-v="${k}" aria-pressed="${sel===k}">${l}</button>`).join('')}</div>`;
  if(sel==='f')return h+chFeuil(c); /* lot 3 : événements vécus par le personnage */
  if(sel==='q')h+=cBlk('jr-q','Quêtes de '+who,Q.length?String(Q.length):'',Q.length?['cours','fin','aband'].map(s=>{const G=Q.filter(j=>(j.statut||'cours')===s).sort(jrByNom);return `<div class="jrgh">${JR_STG[s]}</div>`+(G.map(j=>jrCard(c,j)).join('')||shNone);}).join(''):'<div class="muted small">Aucune quête.</div>',
    E?`<button type="button" class="addl" data-act="jrNew" data-g="quete">+ Nouvelle quête</button>`:'');
  else h+=cBlk('jr-j','Journaux de '+who,J.length?String(J.length):'',J.map(j=>jrCard(c,j)).join('')||'<div class="muted small">Aucun journal.</div>',
    E?`<button type="button" class="addl" data-act="jrNew" data-g="journal">+ Nouveau journal</button>`:'');
  if(E)h+=`<div class="muted small" style="margin-top:4px"><b>Privé</b> : le joueur du personnage (pour une quête de groupe, ceux des participants) et le MJ. <b>Public</b> : toute la table.</div>`;
  return h;}
/* Entrées repliables (24/11) : par défaut seule la plus récente est dépliée ; choix gardé pendant la session (S.jrEo) */
if(!S.jrEo)S.jrEo={};
const jrEntOpen=(e,last)=>e.id in S.jrEo?!!S.jrEo[e.id]:e.id===last;
function jrEntHtml(c,j,e,hl,open){const meta=[jrDjTxt(e.dj)],au=(e.auteur||'').trim(),pc=e.pc&&S.chars[e.pc];
  if(au)meta.push('auteur : '+au);else if(j.type==='groupe'&&pc)meta.push('par '+(pc.court||pc.nom));
  if(e.ecrit)meta.push('écrite le '+fmtDate(e.ecrit));const m=meta.filter(Boolean).join(' · ');
  return `<div class="jrent${hl?' hlx':''}${open?'':' fold'}" id="jre-${esc(e.id)}"><div class="eh"><button type="button" class="jreh" data-act="jrEo" data-e="${esc(e.id)}" aria-expanded="${!!open}"><span class="chev" aria-hidden="true">${open?'⌄':'›'}</span><span class="en">${esc(e.nom||'Entrée')}</span></button>${jrEntEd(j,e)?`<button type="button" class="ibtn" data-act="jrEnt" data-j="${esc(j.id)}" data-e="${esc(e.id)}" aria-label="Modifier l'entrée ${esc(e.nom||'')}">✎</button>`:''}</div>${m?`<div class="em">${esc(m)}</div>`:''}${open&&e.txt?fiRich(e.txt):''}</div>`;}
function jrOpenView(c,j){const q=j.genre==='quete',E=jrCanEd(j),k='jr-'+j.id,st=j.statut||'cours';
  const P=q&&j.type==='groupe'?`<div class="jrparts">${jrParts(j).map(id=>S.chars[id]).filter(Boolean).map(x=>`<span class="jrpc${x.id===c.id?' me':''}">${lk({t:'perso',id:x.id},x.court||x.nom)}</span>`).join('')}</div>`:'';
  let h=`<div style="margin-bottom:8px"><button type="button" class="btn ghost" data-act="jrBack">‹ ${q?'Quêtes':'Journaux'}</button></div>`;
  h+=`<div class="jrhd"><div class="jrnm">${esc(j.nom)}</div><div class="jrmt"><span class="jrty">${q?jrQType(j):esc(j.type||'Sans type')}</span>${jrSw(j,E)}${E?`<button type="button" class="edl jred" data-act="jrEd" data-j="${esc(j.id)}">${ICON.crayon} Modifier</button>`:''}</div>${P}`
    +(q?(E?`<div class="seg sm jrst" role="group" aria-label="Statut de la quête">${JR_ST.map(([v,l])=>`<button type="button" data-act="jrStat" data-j="${esc(j.id)}" data-v="${v}" aria-pressed="${st===v}">${l}</button>`).join('')}</div>`
      :`<div class="jrmt"><span class="jrstx ${st}">${(JR_ST.find(x=>x[0]===st)||JR_ST[0])[1]}</span></div>`):'')+`</div>`;
  if(j.desc||E)h+=cBlk(k+'-d','Description','',j.desc?fiRich(j.desc):shNone);
  if(q){const J=j.jauge,F=j.jaugesFinies||[];
    const box=J?jaugeBox(c,E,{...J,diffShow:J.diff!=null&&J.diff!==''?+J.diff:null},`<div class="relh"><span><b>${esc(J.nom)}</b></span></div>`,{id:j.id,add:'jrJgAdd',del:'jrJgDel',val:'jrJgVal'}):'';
    const fin=F.map(x=>jaugeBox(c,false,{...x,done:true},`<div class="relh"><span><b>${esc(x.nom)}</b></span><span class="muted small">validée${x.fin?' le '+fmtDate(x.fin):''}</span></div>`,{})).join('');
    if(J||F.length||E)h+=cBlk(k+'-g','Jauge de recherche',J?(J.cases||0)+' / '+J.taille:'',box+fin+(J?`<div class="muted small">Aussi dans Relations › Autres jauges${j.type==='groupe'?' de chaque participant':''}.</div>`:F.length?'':'<div class="muted small">Aucune jauge ouverte.</div>'),
      E&&!J?`<div class="relbtns"><button type="button" class="addl" data-act="jrJgNew" data-j="${esc(j.id)}">+ Jauge de recherche</button></div>`:'');}
  const ents=jrEntSorted(j),hl=S.jrHl,last=ents.length?ents[ents.length-1].id:'';if(hl)S.jrEo[hl]=true;
  const nOpen=ents.filter(e=>jrEntOpen(e,last)).length,all=ents.length>1?`<div class="jrall"><button type="button" class="lk" data-act="jrEoAll" data-j="${esc(j.id)}" data-v="${nOpen===ents.length?'0':'1'}">${nOpen===ents.length?'Tout replier':'Tout déplier'}</button></div>`:'';
  h+=cBlk(k+'-e','Entrées',ents.length?String(ents.length):'',ents.length?all+ents.map(e=>jrEntHtml(c,j,e,hl===e.id,jrEntOpen(e,last))).join(''):'<div class="muted small">Aucune entrée.</div>',
    E?`<button type="button" class="addl" data-act="jrEnt" data-j="${esc(j.id)}">+ Entrée</button>`:'');
  if(hl){S.jrHl=null;setTimeout(()=>{const el=document.getElementById('jre-'+hl);if(el&&el.scrollIntoView)el.scrollIntoView({block:'center'});},60);}
  return h;}
/* Relations › Autres jauges : jauges ouvertes des quêtes du personnage (succès et validation ; fermeture depuis la quête) */
function jrRelJauges(c){return jrOf(c).filter(j=>j.genre==='quete'&&j.jauge).sort(jrByNom).map(j=>{const J=j.jauge;
  return jaugeBox(c,jrCanEd(j),{...J,diffShow:J.diff!=null&&J.diff!==''?+J.diff:null},`<div class="relh"><span><b>${esc(J.nom)}</b></span></div><div class="small">Quête : <button type="button" class="lk" data-act="jrGo" data-j="${esc(j.id)}">${esc(j.nom)}</button></div>`,{id:j.id,add:'jrJgAdd',del:'',val:'jrJgVal'});});}

/* ---------- Fenêtres (même mécanique que les fenêtres de fiche : pas de redessin pendant la saisie) ---------- */
const jrDjOf=g=>{const a=parseInt(g.dj_a,10),m=parseInt(g.dj_m,10),d=parseInt(g.dj_j,10);if(!(a>0)||!(m>=1&&m<=12))return null;const o={a,m};if(d>0)o.j=d;return o;};
function jrSheet(g){const c=S.chars[g.cid];if(!c)return null;
  const err=g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:'';
  const ed=lab=>`<div class="field"><span class="flab">${lab}</span><div class="fiedw"><div id="fiEd" class="fied jrfied" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(lab.replace(/<[^>]+>/g,''))}" spellcheck="true">${fiEdHtml(g.txt)}</div><div id="fiSug" class="fisug" role="listbox" hidden></div></div><div class="muted small">Tape <b>@</b> pour lier une fiche ; une ligne qui commence par « - » devient une liste.</div></div>`;
  const seg=(k,v,opts,l)=>`<div class="field"><span class="flab">${l}</span><div class="seg" role="group" aria-label="${esc(l)}">${opts.map(([o,t])=>`<button type="button" data-act="jrSet" data-k="${k}" data-v="${o}" aria-pressed="${String(v)===o}">${t}</button>`).join('')}</div></div>`;
  if(g.kind==='jrHead'){const j=g.id&&S.jour[g.id];if(g.id?!jrCanEd(j):!canEditC(c))return null;const q=g.genre==='quete',grp=q&&g.qt==='groupe';
    const tt=j?(q?'Quête':'Journal'):(q?'Nouvelle quête':'Nouveau journal'),T=jrTypes(),sug=[...new Set([...T.map(t=>t[0]),...JR_TY0])].sort((a,b)=>a.localeCompare(b,'fr'));
    const pjs=Object.values(S.chars).filter(x=>x.type==='PJ'&&((actif(x)&&vis(x))||g.parts.includes(x.id))).sort((a,b)=>(a.court||a.nom||'').localeCompare(b.court||b.nom||'','fr'));
    return fiShell(g,tt,`<div><h2>${tt}</h2><div class="muted small">${esc(c.court||c.nom)}</div></div>
      <div class="field"><label for="jrNm">Nom</label><input id="jrNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div>
      ${q?seg('qt',g.qt,[['perso','Personnelle'],['groupe','De groupe']],'Type')
        :`<div class="field"><label for="jrTy">Type</label><input id="jrTy" type="text" list="jrTyL" data-fin="type" value="${esc(g.type)}" autocomplete="off"><datalist id="jrTyL">${sug.map(t=>`<option value="${esc(t)}">`).join('')}</datalist></div>`}
      ${grp?`<div class="field"><span class="flab">Participants</span><div class="jrparts">${pjs.map(x=>{const on=g.parts.includes(x.id),me=x.id===c.id;return `<button type="button" class="jrpc${on?' on':''}${me?' me':''}" data-act="jrPart" data-v="${esc(x.id)}" aria-pressed="${on}"${me?' disabled':''}>${esc(x.court||x.nom)}</button>`;}).join('')}</div><div class="muted small">${esc(c.court||c.nom)} en fait toujours partie. La quête s'affiche sur la fiche de chaque participant.</div></div>`:''}
      ${ed('Description <span class="muted">— facultative</span>')}
      ${seg('pub',g.pub?'1':'0',[['0','Privé'],['1','Public']],'Lecture')}
      <div class="muted small" style="margin-top:-4px">Privé : ${grp?'les participants':'le joueur du personnage'} et le MJ. Public : toute la table.</div>
      ${q&&!j?`<label class="jrck"><input type="checkbox" data-fin="jg"${g.jg?' checked':''}> Ouvrir une jauge de recherche</label>`:''}
      ${err}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="jrHeadSave"${(g.nom||'').trim()?'':' disabled'}>${j?'Enregistrer':'Créer'}</button></div>
      ${j?`<div class="fidel">${g.confirm?`<div class="muted small">Supprimer définitivement « ${esc(j.nom)} » et ses ${(j.ent||[]).length} entrée(s)${jrParts(j).length>1?', pour tous les participants':''} ?</div><div class="actions"><button class="btn ghost" data-act="jrDelNo">Garder</button><button class="btn" style="color:var(--bad)" data-act="jrDelOk">Supprimer</button></div>`:`<button class="btn ghost" style="color:var(--bad)" data-act="jrDel">Supprimer ${q?'la quête':'le journal'}</button>`}</div>`:''}`);}
  if(g.kind==='jrEnt'){const j=S.jour[g.j];if(!jrCanEd(j))return null;const e=g.e&&(j.ent||[]).find(x=>x.id===g.e);if(g.e&&!jrEntEd(j,e))return null;
    return fiShell(g,e?'Modifier l\'entrée':'Nouvelle entrée',`<div><h2>${e?'Modifier l\'entrée':'Nouvelle entrée'}</h2><div class="muted small">${esc(j.nom)}</div></div>
      <div class="field"><label for="jrNm">Nom</label><input id="jrNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div>
      <div class="field"><span class="flab">Date du jeu <span class="muted">— facultative ; le jour peut rester vide</span></span><div class="jrdt"><input type="number" min="1" max="31" inputmode="numeric" data-fin="dj_j" value="${esc(g.dj_j)}" aria-label="Jour" placeholder="jour"><select data-fin="dj_m" aria-label="Mois"><option value="">— mois —</option>${JR_MOIS.map((m,i)=>`<option value="${i+1}"${String(g.dj_m)===String(i+1)?' selected':''}>${m}</option>`).join('')}</select><input type="number" min="1" inputmode="numeric" data-fin="dj_a" value="${esc(g.dj_a)}" aria-label="Année" placeholder="année"></div><div class="muted small" id="jrDjP">${esc(jrDjTxt(jrDjOf(g)))}</div></div>
      <div class="field"><label for="jrAu">Auteur <span class="muted">— facultatif (ex. une lettre reçue)</span></label><input id="jrAu" type="text" data-fin="auteur" value="${esc(g.auteur)}" autocomplete="off"></div>
      ${ed('Texte')}
      ${err}
      <div class="actions">${e?(g.confirm?`<button class="btn" style="color:var(--bad);margin-right:auto" data-act="jrEntDelOk">Confirmer la suppression</button>`:`<button class="btn ghost" style="margin-right:auto" data-act="jrEntDel">Supprimer</button>`):''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="jrEntSave"${(g.nom||'').trim()?'':' disabled'}>Enregistrer</button></div>`);}
  if(g.kind==='jrJg'){const j=S.jour[g.j];if(!jrCanEd(j))return null;
    return fiShell(g,'Jauge de recherche',`<div><h2>Jauge de recherche</h2><div class="muted small">Quête : ${esc(j.nom)}</div></div>
      <div class="field"><label for="jrNm">Nom</label><input id="jrNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div>
      <div style="display:flex;gap:8px"><div class="field" style="flex:1"><label for="jrTa">Jauge (cases)</label><input id="jrTa" type="number" min="1" inputmode="numeric" data-fin="taille" value="${esc(g.taille)}"></div><div class="field" style="flex:1"><label for="jrDf">Difficulté <span class="muted">— facultative</span></label><input id="jrDf" type="number" min="0" inputmode="numeric" data-fin="diff" value="${esc(g.diff)}"></div></div>
      <div class="muted small">Une seule jauge ouverte à la fois par quête${j.type==='groupe'?', partagée par les participants':''}. Elle s'affiche aussi dans Relations › Autres jauges.</div>
      ${err}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="jrJgSave">Ouvrir</button></div>`);}
  return null;}

/* ---------- Clics ---------- */
function jrAct(a,d){
  if(a==='jrSel'){S.jrSel=d.v==='q'?'q':d.v==='f'?'f':'j';S.jrOpen=null;render();return true;}
  if(a==='jrOpen'){S.jrOpen=d.j;window.scrollTo(0,0);render();return true;}
  if(a==='jrBack'){S.jrOpen=null;render();return true;}
  if(a==='jrEo'){const j=S.jour&&S.jour[S.jrOpen];const L=j?jrEntSorted(j):[],last=L.length?L[L.length-1].id:'',e=L.find(x=>x.id===d.e);if(e)S.jrEo[e.id]=!jrEntOpen(e,last);render();return true;}
  if(a==='jrEoAll'){const j=S.jour&&S.jour[d.j];if(j)for(const e of j.ent||[])S.jrEo[e.id]=d.v==='1';render();return true;}
  if(a==='jrGo'){const j=S.jour&&S.jour[d.j];if(!jrCanRead(j))return true;S.shTab='jour';S.jrSel='q';S.jrOpen=j.id;window.scrollTo(0,0);render();return true;}
  if(S.visit)return true;
  const c=S.chars[S.sel],g=S.dlg,now=new Date().toISOString(),redraw=()=>{S._fiRedraw=true;render();};
  if(a==='jrPub'){const j=S.jour[d.j];if(!jrCanEd(j))return true;const n=jrUpd(j.id,x=>{x.pub=!x.pub;});if(n)toast(n.pub?'Public : visible par toute la table':'Privé');return true;}
  if(a==='jrStat'){const j=S.jour[d.j];if(!jrCanEd(j)||!JR_ST.some(x=>x[0]===d.v))return true;jrUpd(j.id,x=>{x.statut=d.v;});return true;}
  if(a==='jrNew'){if(!c||!canEditC(c))return true;fiOpenDlg({kind:'jrHead',cid:c.id,id:'',genre:d.g==='quete'?'quete':'journal',nom:'',type:'',qt:'perso',parts:[c.id],txt:'',pub:false,jg:false});render();return true;}
  if(a==='jrEd'){const j=S.jour[d.j];if(!c||!jrCanEd(j))return true;fiOpenDlg({kind:'jrHead',cid:c.id,id:j.id,genre:j.genre,nom:j.nom||'',type:j.genre==='journal'?(j.type||''):'',qt:j.type==='groupe'?'groupe':'perso',parts:jrParts(j).slice(),txt:j.desc||'',pub:!!j.pub});render();return true;}
  if(a==='jrSet'){if(g&&(g.kind==='jrHead')){g[d.k]=d.k==='pub'?d.v==='1':d.v;if(d.k==='qt'&&d.v==='groupe'&&!g.parts.includes(g.cid))g.parts=[g.cid,...g.parts];redraw();}return true;}
  if(a==='jrPart'){if(g&&g.kind==='jrHead'&&d.v!==g.cid){g.parts=g.parts.includes(d.v)?g.parts.filter(x=>x!==d.v):[...g.parts,d.v];redraw();}return true;}
  if(a==='jrHeadSave'){if(!g||g.kind!=='jrHead')return true;const cc=S.chars[g.cid],nom=(g.nom||'').trim();if(!cc||!nom)return true;
    const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||''),q=g.genre==='quete',grp=q&&g.qt==='groupe';
    const parts=grp?[...new Set([cc.id,...g.parts])].filter(id=>S.chars[id]):[cc.id];
    if(g.id){const j=S.jour[g.id];if(!jrCanEd(j))return true;S.dlg=null;FI_AT=null;
      jrUpd(j.id,x=>{x.nom=nom;x.desc=txt;x.pub=!!g.pub;if(q){x.type=grp?'groupe':'perso';x.parts=parts;if(!grp)x.perso=cc.id;}else x.type=(g.type||'').trim();});
      setTimeout(()=>toast('Enregistré'),0);return true;}
    if(!canEditC(cc))return true;
    const nj={id:fiRid('j-'),genre:q?'quete':'journal',perso:cc.id,parts,nom,type:q?(grp?'groupe':'perso'):(g.type||'').trim(),desc:txt,pub:!!g.pub,ent:[],par:ME||'',cree:now};
    if(q){nj.statut='cours';nj.jauge=null;nj.jaugesFinies=[];}
    S.jrOpen=nj.id;S.jrSel=q?'q':'j';FI_AT=null;
    if(q&&g.jg)fiOpenDlg({kind:'jrJg',cid:cc.id,j:nj.id,nom,taille:'',diff:''});else S.dlg=null;
    jrSave(nj);window.scrollTo(0,0);setTimeout(()=>toast(q?'Quête créée':'Journal créé'),0);return true;}
  if(a==='jrDel'){if(g&&g.kind==='jrHead'){g.confirm=true;redraw();}return true;}
  if(a==='jrDelNo'){if(g){g.confirm=false;redraw();}return true;}
  if(a==='jrDelOk'){const j=g&&g.kind==='jrHead'&&S.jour[g.id];if(!jrCanEd(j))return true;const m={...S.jour};delete m[j.id];S.jour=m;persistDel('journaux/'+j.id);
    S.dlg=null;S.jrOpen=null;render();setTimeout(()=>toast(j.genre==='quete'?'Quête supprimée':'Journal supprimé'),0);return true;}
  if(a==='jrEnt'){const j=S.jour[d.j];if(!c||!jrCanEd(j))return true;const e=d.e&&(j.ent||[]).find(x=>x.id===d.e);if(d.e&&!jrEntEd(j,e))return true;
    fiOpenDlg({kind:'jrEnt',cid:c.id,j:j.id,e:e?e.id:'',nom:e?e.nom||'':'',dj_j:e&&e.dj&&e.dj.j?String(e.dj.j):'',dj_m:e&&e.dj?String(e.dj.m||''):'',dj_a:e&&e.dj?String(e.dj.a||''):'',auteur:e?e.auteur||'':'',txt:e?e.txt||'':''});render();return true;}
  if(a==='jrEntSave'){if(!g||g.kind!=='jrEnt')return true;const j=S.jour[g.j];if(!jrCanEd(j))return true;const nom=(g.nom||'').trim();if(!nom)return true;
    const any=[g.dj_j,g.dj_m,g.dj_a].some(v=>String(v||'').trim()),dj=jrDjOf(g);
    if(any&&!dj){g.err='Date du jeu : indique au moins le mois et l\'année (le jour est facultatif).';redraw();return true;}
    if(dj&&dj.j){const max=new Date(Date.UTC(dj.a,dj.m,0)).getUTCDate();if(dj.j>max){g.err='Ce jour n\'existe pas dans ce mois.';redraw();return true;}}
    const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||''),au=(g.auteur||'').trim();
    if(g.e){const e=(j.ent||[]).find(x=>x.id===g.e);if(!jrEntEd(j,e))return true;}
    S.dlg=null;FI_AT=null;
    jrUpd(j.id,x=>{x.ent=x.ent||[];if(g.e){const e=x.ent.find(y=>y.id===g.e);if(!e)return false;e.nom=nom;e.txt=txt;e.auteur=au;if(dj)e.dj=dj;else delete e.dj;}
      else{const e={id:fiRid('e-'),nom,txt,auteur:au,by:ME||'',pc:g.cid,cree:now};if(dj)e.dj=dj;x.ent.push(e);}});
    setTimeout(()=>toast('Enregistré'),0);return true;}
  if(a==='jrEntDel'){if(g&&g.kind==='jrEnt'){g.confirm=true;redraw();}return true;}
  if(a==='jrEntDelOk'){if(!g||g.kind!=='jrEnt')return true;const j=S.jour[g.j],e=j&&(j.ent||[]).find(x=>x.id===g.e);if(!jrEntEd(j,e))return true;
    S.dlg=null;FI_AT=null;jrUpd(j.id,x=>{x.ent=(x.ent||[]).filter(y=>y.id!==g.e);});return true;}
  if(a==='jrJgNew'){const j=S.jour[d.j];if(!c||!jrCanEd(j)||j.jauge)return true;fiOpenDlg({kind:'jrJg',cid:c.id,j:j.id,nom:j.nom||'',taille:'',diff:''});render();return true;}
  if(a==='jrJgSave'){if(!g||g.kind!=='jrJg')return true;const j=S.jour[g.j];if(!jrCanEd(j))return true;const nom=(g.nom||'').trim(),t=parseInt(g.taille,10);
    if(!nom||!(t>0)){g.err='Nom et taille de la jauge obligatoires.';redraw();return true;}
    S.dlg=null;jrUpd(j.id,x=>{if(x.jauge)return false;const J={id:fiRid('jg-'),nom,taille:t,ouv:today(),cases:0,hist:[]};if(String(g.diff||'').trim()!=='')J.diff=+g.diff;x.jauge=J;});
    setTimeout(()=>toast('Jauge ouverte'),0);return true;}
  if(a==='jrJgAdd'){const j=S.jour[d.id];if(!jrCanEd(j))return true;const inp=document.querySelector(`[data-rs="${CSS.escape(d.j)}"]`),k=parseInt(inp&&inp.value,10);if(!(k>0)){if(inp)inp.focus();return true;}
    const n=jrUpd(j.id,x=>{if(!x.jauge||x.jauge.id!==d.j)return false;x.jauge.cases=Math.min(x.jauge.taille,(x.jauge.cases||0)+k);x.jauge.hist=[...(x.jauge.hist||[]),{d:today(),n:k,by:ME||''}];});
    if(n)toast('+'+k+' succès');return true;}
  if(a==='jrJgVal'){const j=S.jour[d.id];if(!jrCanEd(j))return true;
    const n=jrUpd(j.id,x=>{const J=x.jauge;if(!J||J.id!==d.j||(J.cases||0)<J.taille)return false;x.jaugesFinies=[...(x.jaugesFinies||[]),{...J,done:true,fin:today()}];x.jauge=null;});
    if(n)toast('Jauge validée');return true;}
  if(a==='jrJgDel'){const j=S.jour[d.id];if(!jrCanEd(j))return true;if(!confirm('Fermer cette jauge sans la valider ?'))return true;jrUpd(j.id,x=>{if(!x.jauge||x.jauge.id!==d.j)return false;x.jauge=null;});return true;}
  return true;}
/* Aperçu de la date du jeu pendant la saisie */
document.addEventListener('input',ev=>{const t=ev.target;if(!t||!t.dataset||!/^dj_/.test(t.dataset.fin||'')||!S.dlg||S.dlg.kind!=='jrEnt')return;const p=document.getElementById('jrDjP');if(p)p.textContent=jrDjTxt(jrDjOf(S.dlg));});
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset||!/^dj_/.test(t.dataset.fin||'')||!S.dlg||S.dlg.kind!=='jrEnt')return;const p=document.getElementById('jrDjP');if(p)p.textContent=jrDjTxt(jrDjOf(S.dlg));});

/* ---------- Lot 4 (25/11/2026) : PNJ v2 ----------
   Champs d'un PNJ (collection chars, type 'PNJ') : vis ('prep'|'rev', absent = révélé), eye {bloc:bool} (absent = Portrait et Situation ouverts),
   por {role, app, car, fm} (textes « @ »), alias (id du PNJ principal), liens [{id, pnj, lab, rec}], situ.lieux [{id, nom, note, res}].
   Féal (PNJ rattaché à un PJ) : toujours révélé, sans œil, onglet Progression. Droits : canEditC (vues.js). */
const PN_POR=[['role','Rôle'],['app','Apparence'],['car','Caractère'],['fm','Forme masquée']];
const PN_SIT=[['titres','Titres'],['familles','Familles'],['orgs','Organisations'],['lieux','Résidence et lieux'],['poss','Possessions']];
const PN_EYE0={role:true,app:true,car:true,fm:true,titres:true,familles:true,orgs:true,lieux:true,poss:true};
const pnEye=c=>(c&&c.eye)||PN_EYE0;
const pnBlkSee=(c,k)=>!!c&&vis(c)&&(isGest()||isFeal(c)||!!pnEye(c)[k]);
const pnMain=c=>c&&c.alias&&S.chars[c.alias]&&S.chars[c.alias].type==='PNJ'?S.chars[c.alias]:null;
const pnAliases=c=>Object.values(S.chars).filter(x=>x.type==='PNJ'&&x.alias===c.id&&x.id!==c.id).sort((a,b)=>(a.court||'').localeCompare(b.court||'','fr'));
const pnCanNew=()=>!S.visit&&(canEdit()||(!isGest()&&!!ME));
const pnHasFm=c=>!!c.race&&c.race!==HUMAIN;
const pnName=c=>c.court||c.nom||'?';
const pnFeal=c=>isFeal(c)||(!!c.feal&&c.race===HUMAIN); /* féal : humain favorable aux fées (rattaché ou non) */
const pnRaceTxt=c=>c.race?raceLabel(c)+(pnFeal(c)?' · féal':''):'';
const pnRaces=()=>[HUMAIN].concat(Object.keys(RACES).filter(r=>r!==HUMAIN).sort((a,b)=>a.localeCompare(b,'fr')));
/* Situation : rubriques d'un PNJ (les fiefs et possessions notables déjà saisis sont rangés dans Résidence et lieux / Possessions) */
const pnSitRows=(c,k)=>{const s=situOf(c),x=k==='lieux'?(s.fiefs||[]).map(e=>({...e,_k:'fiefs'})).concat((s.lieux||[]).map(e=>({...e,_k:'lieux'}))):k==='poss'?(s.poss||[]).map(e=>({...e,_k:'poss'})).concat((s.possN||[]).map(e=>({...e,_k:'possN'}))):(s[k]||[]).map(e=>({...e,_k:k}));return x;};
const pnSitNames=(c,k)=>pnBlkSee(c,k)?pnSitRows(c,k).map(e=>(e.nom||'').trim()).filter(Boolean):[];
const pnRes=c=>{const L=pnBlkSee(c,'lieux')?pnSitRows(c,'lieux'):[];const r=L.find(e=>e.res)||L[0];return r?r.nom:'';};
const pnFold=(k,empty)=>{const f=(S.fiFold||{})[k];return f==null?!!empty:f;};
function pnBlk(k,title,sum,body,o){o=o||{};const fold=pnFold(k,o.empty),id='fb-'+k;
  const ed=o.edit?`<button type="button" class="edl" data-act="${o.edit}"${o.ea||''}>${ICON.crayon} Modifier</button>`:'';
  return `<section class="rblk${o.hid?' fihid':''}"><div class="rbh"><button type="button" class="rbt" data-act="pnFold" data-k="${k}"${o.empty?' data-e="1"':''} aria-expanded="${!fold}" aria-controls="${id}"><span class="tt"><span class="t">${title}</span>${sum!==''&&sum!=null?`<span class="n">${sum}</span>`:''}</span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button>${ed}${o.eye||''}</div>${fold?'':`<div class="rbb" id="${id}">${body}</div>`}</section>`;}
const pnEyeB=(c,k,lab)=>isGest()&&!isFeal(c)?eyeBtn('pnEye',`data-k="${k}"`,!!pnEye(c)[k],lab):'';
const pnAv=c=>{const im=portrait(c);return `<span class="pnav">${im?`<img src="${im}" alt="">`:`<span class="ini">${esc(pnName(c).slice(0,1))}</span>`}</span>`;};

/* ---------- Personnages › PNJ : liste ---------- */
function pnListView(){const G=isGest(),F=S.pnF||{},all=ids().map(i=>S.chars[i]).filter(c=>c.type==='PNJ');
  const opts=k=>{const m={};for(const c of all)for(const n of (k==='lieux'?pnSitNames(c,'lieux'):pnSitNames(c,k)))m[n]=1;return Object.keys(m).sort((a,b)=>a.localeCompare(b,'fr'));};
  const sel=(k,l)=>{const O=opts(k),v=F[k]||'';if(!O.length&&!v)return '';return `<label class="pnchip${v?' on':''}"><span>${esc(v?l+' : '+v:l)}</span><span aria-hidden="true">${v?'✕':'▾'}</span><select data-pnf="${k}" aria-label="Filtrer par ${esc(l.toLowerCase())}"><option value="">${esc(l)} : tous</option>${O.map(o=>`<option${o===v?' selected':''}>${esc(o)}</option>`).join('')}</select></label>`;};
  let h=pnCanNew()?`<button class="btn pri cta pntop" data-act="pnNew">+ Nouveau PNJ</button>`:''; /* lot C : bouton en haut de la liste */
  h+=`<div class="fisrch"><input type="search" data-pnq="1" value="${esc(S.pnQ||'')}" placeholder="Rechercher un nom" aria-label="Rechercher un PNJ" autocomplete="off"></div>`;
  h+=`<div class="pnchips">${sel('familles','Famille')}${sel('orgs','Organisation')}${sel('lieux','Lieu')}${G?`<button type="button" class="chip" data-act="pnPrepF" aria-pressed="${!!S.pnPrep}">Préparés</button>`:''}</div>`;
  h+=`<div id="pnRes">${pnListBody()}</div>`;
  return h;}
function pnListBody(){const G=isGest(),F=S.pnF||{},q=nrm(S.pnQ||'');
  let L=ids().map(i=>S.chars[i]).filter(c=>c.type==='PNJ');
  if(!L.length)return `<div class="card empty">Aucun PNJ pour l'instant.</div>`;
  L=L.filter(c=>(!q||nrm(c.court).includes(q)||nrm(c.nom).includes(q)||nrm(c.surnom||'').includes(q))&&(!G||!S.pnPrep||!pnRev(c))&&['familles','orgs','lieux'].every(k=>!F[k]||pnSitNames(c,k).includes(F[k])));
  if(!L.length)return `<div class="card empty">Aucun PNJ ne correspond.</div>`;
  L.sort((a,b)=>pnName(a).localeCompare(pnName(b),'fr',{sensitivity:'base'}));
  const row=c=>{const m=pnMain(c),org=pnSitNames(c,'orgs')[0]||'',res=pnRes(c);
    const sub=G&&m?`<small class="pnreal">alias de ${esc(pnName(m))}${org?' · '+esc(org):''}</small>`:`<small>${esc([pnRaceTxt(c),isFeal(c)?'Féal de '+pnName(S.chars[c.pj]):org,res].filter(Boolean).join(' · '))}</small>`;
    const rk=!actif(c)?`<span class="pndead">${c.statut==='mort'?'† '+(c.genre==='f'?'morte':'mort'):esc(STATUTS[c.statut]||'')}</span>`:!pnRev(c)?'<span class="tag2">préparé</span>':`<span class="pnrk">${esc(rangOf(c))}</span>`;
    return `<button type="button" class="pnli${pnRev(c)?'':' prep'}" data-act="sel" data-id="${esc(c.id)}">${pnAv(c)}<span class="pntx"><b>${esc(pnName(c))}${(c.surnom||'').trim()?` <i class="pnsur">« ${esc(c.surnom.trim())} »</i>`:''}</b>${sub}</span>${rk}</button>`;};
  const fk=['familles','orgs','lieux'].find(k=>F[k]);
  if(fk)return `<div class="pgrp">${esc(F[fk])} · ${L.length}</div><div class="plst pnlst">${L.map(row).join('')}</div>`;
  const grp={};for(const c of L){const k=(nrm(pnName(c))[0]||'#').toUpperCase();(grp[k]=grp[k]||[]).push(c);}
  return Object.keys(grp).map(k=>`<div class="pgrp">${esc(k)}</div><div class="plst pnlst">${grp[k].map(row).join('')}</div>`).join('');}

/* ---------- Fiche PNJ : en-tête ---------- */
function pnSheetHead(c){const G=isGest(),fe=isFeal(c);
  let h=`<button class="back" data-act="pnBack">${FI_BACK}PNJ</button>`+(fe?shChips(c.id):'');
  if(G&&!fe){const e=pnEye(c),K=pnVisKeys(c),n=K.filter(k=>e[k]).length;
    h+=!pnRev(c)?`<div class="fivis prep"><span class="fivi" aria-hidden="true">${EYE_C}</span><span class="fivt"><b>Fiche préparée</b> · invisible des joueurs</span><button class="btn pri" data-act="pnEye" data-k="fiche">Révéler</button></div>`
      :`<div class="fivis">${eyeBtn('pnEye','data-k="fiche"',true,'Fiche '+pnName(c))}<span class="fivt"><b>Fiche révélée</b> · ${n} bloc${n>1?'s':''} sur ${K.length} visible${n>1?'s':''}</span></div>`;}
  const im=portrait(c),inner=im?`<img src="${im}" alt="">`:`<span class="ini">${esc(pnName(c).slice(0,1))}</span>`;
  const med=canPortrait(c)?`<label class="shmed ed" aria-label="Changer le portrait de ${esc(pnName(c))}">${inner}<span class="pen" aria-hidden="true">✎</span><input type="file" accept="image/*" data-ptrfile="${esc(c.id)}" hidden></label>`:im?`<button type="button" class="shmed" data-act="fiImg" data-cid="${esc(c.id)}" aria-label="Agrandir le portrait de ${esc(pnName(c))}">${inner}</button>`:`<span class="shmed">${inner}</span>`;
  const tit=pnSitNames(c,'titres')[0],fam=pnSitNames(c,'familles')[0],age=(typeof chAgeTxt==='function'&&chAgeTxt(c)||{}).age;
  const kv=[['Race',c.race?raceLk(c)+(pnFeal(c)?' · féal':''):''],['Titre',tit?esc(tit):''],['Famille',fam?esc(fam):''],['Rang',esc(rangOf(c))],['Âge',age?esc(age):''],['Statut',esc(STATUTS[c.statut||'actif']||'')]].filter(x=>x[1]);
  h+=`<div class="card pnhead"><div class="shhd">${med}<div style="flex:1;min-width:0"><div class="shname"><span>${esc(c.nom||c.court)}</span>${kankaBtn(c.kanka,c.nom||c.court,'Fiche Kanka de '+pnName(c))}</div>${(c.surnom||'').trim()?`<div class="shsur">« ${esc(c.surnom.trim())} »</div>`:''}${fe?`<div class="small pnfeal">Féal de ${lk({t:'perso',id:c.pj},pnName(S.chars[c.pj]))}</div>`:''}<div class="pnkv">${kv.map(([a,b])=>`<span>${a}</span><b>${b}</b>`).join('')}</div></div></div>${canEditC(c)?`<div style="margin-top:8px"><button type="button" class="edl" data-act="pcOpen" data-id="${esc(c.id)}">${ICON.crayon} En-tête</button></div>`:''}</div>`;
  return h;}
const pnVisKeys=c=>(c.alias?['idr']:[]).concat(PN_POR.filter(([k])=>k!=='fm'||pnHasFm(c)).map(x=>x[0]),PN_SIT.map(x=>x[0]),['autres']);

/* ---------- Fiche PNJ : onglets ---------- */
function pnSheetBody(c,s,id){const tab=shTabOf(c);let h=shTabsBar(c,tab);
  if(tab==='prog'){h+=`<div class="xpbar"><div class="xpd"><b class="num">${s.dispo}</b><span>XP dispo</span></div><div class="xpo"><span><b class="num">${s.prevu}</b> prévu</span><span class="${s.manque?'bad':''}"><b class="num">${s.manque}</b> manque</span></div><div class="xpm">${s.gains} gagnés · ${s.spent} dépensés</div></div>`;
    h+=cBlk('pn-der','Valeurs dérivées','',`<div class="fgrid">${derived(c,'m').map(([n,v])=>`<div class="fr"><span>${esc(n)}</span><b class="num">${v}</b></div>`).join('')}</div>`);
    return h+viewProg(c,s,id);}
  if(tab==='situ')h+=pnSitu(c);else if(tab==='rel')h+=pnRel(c);else h+=pnPortrait(c);
  const M=fiMentions('perso',c.id);
  h+=pnBlk('pn-ment','Mentions',M.length?String(M.length):'',fiMentionsHtml(M),{empty:!M.length});
  return h;}
function pnPortrait(c){const G=isGest(),E=canEditC(c),e=pnEye(c);let h='';
  const m=pnMain(c);
  if(m&&pnBlkSee(c,'idr'))h+=pnBlk('pn-idr','Identité réelle','',`Alias de ${lk({t:'perso',id:m.id},pnName(m))}`+(E?`<div class="relbtns"><button type="button" class="addl" data-act="pnAliasOff">Détacher de ${esc(pnName(m))}</button></div>`:''),{hid:G&&!e.idr,eye:pnEyeB(c,'idr','Identité réelle')});
  const A=pnAliases(c).filter(a=>G||(vis(a)&&pnBlkSee(a,'idr')));
  if(A.length||E){const st=a=>G?(!pnRev(a)?'<span class="tag2">préparé</span>':`<span class="muted small">révélé · identité ${pnEye(a).idr?'révélée':'cachée'}</span>`):'';
    h+=pnBlk('pn-alias','Alias',A.length?String(A.length):'',(A.map(a=>`<div class="srow"><span>${lk({t:'perso',id:a.id},pnName(a))}</span>${st(a)}</div>`).join('')||'<div class="muted small">Aucun alias.</div>')+(E?`<div class="relbtns"><button type="button" class="addl" data-act="pnAlias">+ Alias</button></div>`:''),{empty:!A.length});}
  const B=[];
  for(const [k,l] of PN_POR){if(k==='fm'&&!pnHasFm(c))continue;if(!pnBlkSee(c,k))continue;const t=((c.por||{})[k]||'').trim();if(!t&&!E&&!G)continue;
    B.push({e:!t,h:pnBlk('pn-'+k,l,'',t?fiRich(t):'<div class="muted small">Pas encore renseigné.</div>',{empty:!t,edit:E?'pnTxt':'',ea:` data-b="${k}"`,hid:G&&!isFeal(c)&&!e[k],eye:pnEyeB(c,k,l)})});}
  h+=shOrder(B);
  if(!h&&!G)h=`<div class="card"><span class="muted small">Rien de connu pour l'instant.</span></div>`;
  return h;}
function pnSitu(c){const G=isGest(),E=canEditC(c),e=pnEye(c),B=[];
  for(const [k,l] of PN_SIT){if(!pnBlkSee(c,k))continue;const OG=k==='orgs'||k==='titres'?ogSitRows(c,k):k==='familles'?faSitRows(c):null; /* lot 5 a ; lot 5 b */const R=OG||pnSitRows(c,k),nO=k==='poss'?fi6ObjsOf(c.id).length:0;if(!R.length&&!nO&&!E&&!G)continue;
    const rows=OG?OG.join(''):(k==='poss'?situObjRows(c).join(''):'')+R.map(x=>`<div class="srow"><span>${situNm(x)}${x._k==='orgs'&&x.role?` <span class="muted">· ${esc(x.role)}</span>`:''}${x._k==='lieux'&&situNat(x)!=='autre'?` <span class="muted">· ${SITU_NAT[situNat(x)]}</span>`:''}${x._k==='fiefs'?' <span class="muted">· fief</span>':''}${x.note?`<span class="d">${esc(x.note)}</span>`:''}</span>${E?`<button type="button" class="ibtn" data-act="situEd" data-k="${x._k}" data-i="${esc(x.id)}" aria-label="Modifier ${esc(x.nom)}">✎</button>`:''}</div>`).join('');
    const add=E?`<div class="relbtns"><button type="button" class="addl" data-act="situEd" data-k="${k}">+ ${({titres:'Titre',familles:'Famille',orgs:'Organisation',lieux:'Lieu',poss:'Possession'})[k]}</button></div>`:'';
    B.push({e:!R.length&&!nO,h:pnBlk('pn-'+k,l,R.length+nO?String(R.length+nO):'',(rows||shNone)+add,{empty:!R.length&&!nO,hid:G&&!isFeal(c)&&!e[k],eye:pnEyeB(c,k,l)})});}
  return shOrder(B)||(G?'':`<div class="card"><span class="muted small">Rien de connu pour l'instant.</span></div>`);}
function pnRel(c){const G=isGest(),E=canEditC(c),e=pnEye(c);let h='';
  /* PJ liés : calculés depuis les Relations des PJ */
  const fp=isFeal(c)&&vis(S.chars[c.pj])?S.chars[c.pj]:null;
  const P=(fp?[{pj:fp,r:{niv:'feal'}}]:[]).concat(pjIds().map(i=>S.chars[i]).filter(Boolean).flatMap(pj=>(pj.rel||[]).filter(r=>r.pnj===c.id&&!(fp&&pj.id===fp.id&&r.niv==='allie')).concat(relsOf(pj).filter(r=>r.src==='pp'&&r.pnj===c.id)).map(r=>({pj,r}))));
  const pl=P.map(({pj,r})=>{if(r.niv==='feal')return `<div class="srow"><span>Féal de ${lk({t:'perso',id:pj.id},pj.court)}</span></div>`;const J=(r.jauges||[]).filter(j=>!j.done);
    return `<div class="srow"><span>${lk({t:'perso',id:pj.id},pj.court)} <span class="muted">· ${esc(REL_NIV[r.niv]||r.niv||'')}</span>${r.src==='pp'?' <span class="muted small">(PP)</span>':''}${J.map(j=>`<span class="d">jauge ${esc(REL_OBJ[j.obj]?REL_OBJ[j.obj][2]:'')} : ${j.cases||0} / ${j.taille}</span>`).join('')}</span></div>`;}).join('');
  h+=pnBlk('pn-pjl','PJ liés',P.length?String(P.length):'',(pl||'<div class="muted small">Aucun PJ lié.</div>')+'<div class="muted small" style="margin-top:4px">Calculé depuis les Relations des PJ.</div>',{empty:!P.length});
  if(pnBlkSee(c,'autres')){const L=(c.liens||[]).filter(l=>{const p=S.chars[l.pnj];return p&&vis(p);});
    const rows=L.map(l=>{const p=S.chars[l.pnj];return `<div class="srow"><span>${lk({t:'perso',id:p.id},pnName(p))}${l.lab?` <span class="muted">· ${esc(l.lab)}</span>`:''} <span class="muted" title="${l.rec?'Lien réciproque':'Sens unique'}">${l.rec?'⇄':'→'}</span></span>${E?`<button type="button" class="ibtn" data-act="pnLien" data-i="${esc(l.id)}" aria-label="Modifier le lien avec ${esc(pnName(p))}">✎</button>`:''}</div>`;}).join('');
    h+=pnBlk('pn-autres','Autres PNJ',L.length?String(L.length):'',(rows||'<div class="muted small">Aucun lien.</div>')+(E?`<div class="relbtns"><button type="button" class="addl" data-act="pnLien">+ Lien avec un PNJ</button></div>`:''),{empty:!L.length,hid:G&&!isFeal(c)&&!e.autres,eye:pnEyeB(c,'autres','Autres PNJ')});}
  return h;}

/* ---------- Fenêtres ---------- */
['pnTxt','pnNew','pnLien','pnAlias'].forEach(k=>FI_DLG.add(k));FI_ED.add('pnTxt');
const pnSel=(k,v,L,lab)=>`<div class="field"><label for="pn-${k}">${lab}</label><select id="pn-${k}" data-fin="${k}">${L.map(([o,t])=>`<option value="${esc(o)}"${o===v?' selected':''}>${esc(t)}</option>`).join('')}</select></div>`;
const pnSeg=(k,v,L,lab)=>`<div class="field"><label>${lab}</label><div class="seg" role="group" aria-label="${esc(lab)}">${L.map(([o,t])=>`<button type="button" data-act="pnSet" data-k="${k}" data-v="${o}" aria-pressed="${v===o}">${t}</button>`).join('')}</div></div>`;
const pnErr=g=>g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:'';
function pnSheet(g){
  if(g.kind==='pnTxt'){const c=S.chars[g.cid];if(!c||!canEditC(c))return null;const tt=(PN_POR.find(x=>x[0]===g.b)||[,''])[1];
    return fiShell(g,'Modifier : '+tt,`<div><h2>Modifier : ${esc(tt)}</h2><div class="muted small">${esc(pnName(c))}</div></div>
      <div class="fiedw"><div id="fiEd" class="fied" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(tt)}" spellcheck="true">${fiEdHtml(g.txt)}</div><div id="fiSug" class="fisug" role="listbox" hidden></div></div>
      <div class="muted small">Tape <b>@</b> puis quelques lettres pour lier une fiche ; une ligne qui commence par « - » devient une liste.</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pnTxtSave">Enregistrer</button></div>`);}
  if(g.kind==='pnNew'){if(!pnCanNew())return null;const gest=canEdit();
    return fiShell(g,'Nouveau PNJ',`<h2>Nouveau PNJ</h2>${g.main?`<div class="muted small">Alias de ${esc(pnName(S.chars[g.main]||{}))}</div>`:''}
      <div class="field"><label for="pnNm">Nom</label><input id="pnNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div>
      <div class="frow">${pnSel('race',g.race,[['','— à préciser —']].concat(pnRaces().map(r=>[r,r])),'Race')}${pnSel('rang',g.rang,pnjRangs().map(r=>[r,r]),'Rang')}</div>
      ${g.main?'':'<div class="muted small">Un féal (PNJ rattaché à un PJ) se crée avec l\'assistant : Personnages › PJ › + Nouveau PJ.</div>'}
      ${gest&&!g.pj?pnSeg('vis',g.vis,[['prep','Préparé'],['rev','Révélé']],'Visibilité')+`<div class="muted small">${g.vis==='prep'?'Préparé : invisible des joueurs (listes, liens « @ », Relations) jusqu\'à la révélation.':'Révélé : visible par toute la table ; les blocs restent à ouvrir un par un.'}</div>`:!g.pj?'<div class="muted small">Le PNJ sera visible par toute la table.</div>':'<div class="muted small">Un féal est toujours visible par toute la table.</div>'}
      ${pnErr(g)}<div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pnCreate">Créer et ouvrir</button></div>`);}
  if(g.kind==='pnLien'){const c=S.chars[g.cid];if(!c||!canEditC(c))return null;const cur=g.i&&(c.liens||[]).find(l=>l.id===g.i),p=cur&&S.chars[cur.pnj];
    const L=Object.values(S.chars).filter(x=>x.type==='PNJ'&&x.id!==c.id&&vis(x)&&(cur?x.id===cur.pnj:!(c.liens||[]).some(l=>l.pnj===x.id))).sort((a,b)=>pnName(a).localeCompare(pnName(b),'fr'));
    return fiShell(g,'Lien avec un PNJ',`<h2>Lien avec un PNJ</h2><div class="muted small">${esc(pnName(c))}</div>
      ${cur?`<div class="field"><label>PNJ</label><div class="inp ro">${esc(p?pnName(p):'?')}</div></div>`:pnSel('pnj',g.pnj,[['','— choisir —']].concat(L.map(x=>[x.id,pnName(x)+(pnRev(x)?'':' (préparé)')])),'PNJ')}
      <div class="field"><label for="pnLb">Étiquette</label><input id="pnLb" type="text" data-fin="lab" value="${esc(g.lab)}" placeholder="ex. supérieur, rival, frère" autocomplete="off"></div>
      ${pnSeg('rec',g.rec,[['0','Sens unique'],['1','Lien réciproque']],'Sens')}<div class="muted small">Lien réciproque inscrit le lien sur les deux fiches.</div>
      ${pnErr(g)}<div class="actions">${cur?(g.confirm?`<button class="btn" style="color:var(--bad)" data-act="pnLienDelOk">Confirmer le retrait${cur.rec?' (des deux fiches)':''}</button>`:`<button class="btn ghost" data-act="pnLienDel">Retirer</button>`):''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pnLienSave">${cur?'Enregistrer':'Ajouter'}</button></div>`);}
  if(g.kind==='pnAlias'){const c=S.chars[g.cid];if(!c||!canEditC(c))return null;
    const L=Object.values(S.chars).filter(x=>x.type==='PNJ'&&x.id!==c.id&&!x.alias&&!isFeal(x)&&!pnAliases(x).length&&vis(x)).sort((a,b)=>pnName(a).localeCompare(pnName(b),'fr'));
    return fiShell(g,'Ajouter un alias',`<h2>Ajouter un alias</h2><div class="muted small">${esc(pnName(c))}</div>
      ${pnSeg('mode',g.mode,[['new','Nouvelle fiche'],['old','Fiche existante']],'Alias')}
      ${g.mode==='old'?pnSel('pnj',g.pnj,[['','— choisir —']].concat(L.map(x=>[x.id,pnName(x)+(pnRev(x)?'':' (préparé)')])),'PNJ existant'):`<div class="field"><label for="pnNm">Nom de l'alias</label><input id="pnNm" type="text" data-fin="nom" value="${esc(g.nom)}" autocomplete="off"></div><div class="muted small">Fiche préremplie (race, rang)${canEdit()?', préparée':''} ; son bloc « Identité réelle » reste fermé.</div>`}
      ${pnErr(g)}<div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pnAliasSave">${g.mode==='old'?'Rattacher':'Créer et ouvrir'}</button></div>`);}
  return null;}

/* ---------- Actions ---------- */
function pnSaveC(n){saveChar(n);}
function pnMake(o){let id=slug(o.nom)||'pnj';if(S.chars[id])id=id+'-'+Date.now().toString(36).slice(-4);
  const c=newChar(id,o.nom,o.nom,'PNJ');if(o.race)c.race=o.race;if(o.rang)c.rang=o.rang;
  if(o.pj){c.pj=o.pj;c.pjDate=today();}else{c.vis=o.vis;c.eye=o.vis==='rev'?{...PN_EYE0,autres:true}:{};} /* révélé : blocs ouverts (règle des fiches) ; préparé : blocs fermés */
  if(o.main)c.alias=o.main;c.par=ME||'';c.cree=new Date().toISOString();return c;}
function pnAct(a,d){
  const c=S.chars[S.sel],g=S.dlg;
  if(a==='pnTeam'){S.teamSel=d.v==='pnj'?'pnj':'pj';render();return true;}
  if(a==='pnBack'){if(S.nav.length){navBack();return true;}S.view='team';S.teamSel='pnj';window.scrollTo(0,0);render();return true;}
  if(a==='pnFold'){S.fiFold={...(S.fiFold||{}),[d.k]:!pnFold(d.k,d.e==='1')};render();return true;}
  if(a==='pnPrepF'){S.pnPrep=!S.pnPrep;render();return true;}
  if(a==='pnSet'){if(g&&FI_DLG.has(g.kind)){g[d.k]=d.v;if(d.k==='vis'||d.k==='mode')g.err='';S._fiRedraw=true;render();}return true;}
  if(S.visit)return true;
  if(a==='pnEye'){if(!c||c.type!=='PNJ'||!isGest()||isFeal(c))return true;const n=clone(c);let open;
    if(d.k==='fiche'){open=!pnRev(n);if(!open&&!canEdit())return true;n.vis=open?'rev':'prep';}
    else{const e={...pnEye(n)};open=!e[d.k];if(!open&&!canEdit())return true;e[d.k]=open;n.eye=e;}
    pnSaveC(n);setTimeout(()=>toast(open?'Visible par toute la table':'Caché aux joueurs'),0);return true;}
  if(a==='pnTxt'){if(!c||!canEditC(c))return true;fiOpenDlg({kind:'pnTxt',cid:c.id,b:d.b,txt:(c.por||{})[d.b]||''});render();return true;}
  if(a==='pnTxtSave'){const x=g&&S.chars[g.cid];if(!x||!canEditC(x))return true;const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||'');
    const n=clone(x);n.por={...(n.por||{}),[g.b]:txt};FI_AT=null;S.dlg=null;pnSaveC(n);return true;}
  if(a==='pnNew'){if(!pnCanNew())return true;const R=pnjRangs();fiOpenDlg({kind:'pnNew',nom:'',race:'',rang:R[0]||'Larbin',pj:'',vis:canEdit()?'prep':'rev'});render();return true;}
  if(a==='pnCreate'){if(!g||g.kind!=='pnNew'||!pnCanNew())return true;const nom=(g.nom||'').trim();if(!nom){g.err='Le nom est obligatoire.';S._fiRedraw=true;render();return true;}
    const nc=pnMake({nom,race:g.race,rang:g.rang,pj:'',vis:canEdit()?(g.vis==='rev'?'rev':'prep'):'rev'});
    S.dlg=null;S.chars[nc.id]=nc;persist('chars/'+nc.id,nc);S.view='sheet';S.sel=nc.id;S.shTab='por';window.scrollTo(0,0);render();setTimeout(()=>toast('PNJ créé'),0);return true;}
  if(a==='pnLien'){if(!c||!canEditC(c))return true;const cur=d.i&&(c.liens||[]).find(l=>l.id===d.i);fiOpenDlg({kind:'pnLien',cid:c.id,i:cur?cur.id:'',pnj:cur?cur.pnj:'',lab:cur?cur.lab||'':'',rec:cur&&!cur.rec?'0':'1'});render();return true;}
  if(a==='pnLienSave'||a==='pnLienDel'||a==='pnLienDelOk'){const x=g&&S.chars[g.cid];if(!x||!canEditC(x))return true;
    if(a==='pnLienDel'){g.confirm=true;S._fiRedraw=true;render();return true;}
    const cur=g.i&&(x.liens||[]).find(l=>l.id===g.i),pid=cur?cur.pnj:g.pnj,p=pid&&S.chars[pid];
    if(!p){g.err='Choisis un PNJ dans la liste.';S._fiRedraw=true;render();return true;}
    const lab=(g.lab||'').trim(),rec=g.rec==='1',n=clone(x),o=clone(p);n.liens=(n.liens||[]).slice();o.liens=(o.liens||[]).slice();
    const back=o.liens.findIndex(l=>l.pnj===x.id);
    if(a==='pnLienDelOk'){n.liens=n.liens.filter(l=>l.id!==g.i);if(cur&&cur.rec&&back>=0)o.liens.splice(back,1);}
    else{const v={id:cur?cur.id:uid('l'),pnj:p.id,lab,rec};if(cur)n.liens=n.liens.map(l=>l.id===cur.id?v:l);else n.liens.push(v);
      if(rec){if(back>=0)o.liens[back]={...o.liens[back],rec:true};else o.liens.push({id:uid('l'),pnj:x.id,lab,rec:true});}
      else if(cur&&cur.rec&&back>=0)o.liens[back]={...o.liens[back],rec:false};}
    S.dlg=null;S.chars[o.id]=o;persist('chars/'+o.id,o);pnSaveC(n);setTimeout(()=>toast('Enregistré'),0);return true;}
  if(a==='pnAlias'){if(!c||!canEditC(c))return true;fiOpenDlg({kind:'pnAlias',cid:c.id,mode:'new',nom:'',pnj:''});render();return true;}
  if(a==='pnAliasSave'){const x=g&&S.chars[g.cid];if(!x||!canEditC(x))return true;
    if(g.mode==='old'){const p=g.pnj&&S.chars[g.pnj];if(!p){g.err='Choisis un PNJ dans la liste.';S._fiRedraw=true;render();return true;}
      const n=clone(p);n.alias=x.id;n.eye={...pnEye(n),idr:false};S.dlg=null;S.chars[n.id]=n;persist('chars/'+n.id,n);render();setTimeout(()=>toast('Alias rattaché'),0);return true;}
    const nom=(g.nom||'').trim();if(!nom){g.err='Le nom est obligatoire.';S._fiRedraw=true;render();return true;}
    const nc=pnMake({nom,race:x.race||'',rang:x.rang||'',main:x.id,vis:canEdit()?'prep':'rev'});nc.eye={...nc.eye,idr:false};if(x.genre)nc.genre=x.genre;
    S.dlg=null;S.chars[nc.id]=nc;persist('chars/'+nc.id,nc);S.sel=nc.id;S.shTab='por';window.scrollTo(0,0);render();setTimeout(()=>toast('Alias créé'),0);return true;}
  if(a==='pnAliasOff'){if(!c||!canEditC(c)||!c.alias)return true;const n=clone(c);delete n.alias;pnSaveC(n);return true;}
  return false;}
/* Recherche et filtres de la liste des PNJ */
document.addEventListener('input',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.pnq!==undefined){S.pnQ=t.value;const r=document.getElementById('pnRes');if(r)r.innerHTML=pnListBody();}});
document.addEventListener('change',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.pnf!==undefined){S.pnF={...(S.pnF||{}),[t.dataset.pnf]:t.value};render();}});

/* ---------- Lot 6 (25/11/2026) : lieux et objets ----------
   Principe du 25/11 : ce qui est visible est modifiable par celui qui le voit (Visiteur : lecture) ; yeux réservés à la gestion.
   Liens enregistrés une seule fois, affichés des deux côtés :
   - personnage → lieu : c.situ.lieux [{id, nom, f, nat:'res'|'prop'|'autre', res}] et c.situ.fiefs [{id, nom, f}] ;
   - élément de PP relié à une fiche : c.ppLk {idAchat: idFiche} ;
   - objet : det [{id}|{nom}] (détenteurs ; un seul si uniq), lieu {f?, nom} (emplacement), parent = collection ;
   - lieu : fief {feerie}, orgs [{id, f?, nom, note}] ; carte = image ill-carte-<id>. */
const FI6_EYE={lieu:['fief','pers','orgs','obj','carte'],objet:['effet','carac','det']};
const fiIsFief=f=>!!f&&f.genre==='lieu'&&nrm(f.type)==='fief';
const fiEyeKeys=f=>['desc','sait'].concat((FI6_EYE[f&&f.genre]||[]).filter(k=>k!=='fief'||fiIsFief(f)));
const fiCN=c=>c?(c.type==='PNJ'&&typeof pnName==='function'?pnName(c):(c.court||c.nom||'?')):'?';
const SITU_NAT={res:'résidence',prop:'propriétaire',autre:'autre lieu'};
const situNat=e=>e.nat||(e.res?'res':'autre');
const fi6CV=()=>Object.values(S.chars||{}).filter(c=>vis(c)).sort((a,b)=>(a.type===b.type?0:a.type==='PJ'?-1:1)||fiCN(a).localeCompare(fiCN(b),'fr',{sensitivity:'base'}));
/* Un joueur ne voit le lien d'un PNJ que si le bloc correspondant de sa fiche est révélé */
const fi6CSee=(c,k)=>c.type!=='PNJ'||typeof pnBlkSee!=='function'||pnBlkSee(c,k);
/* Liens d'un personnage vers une fiche (Situation, éléments de PP) */
function fi6CharLinks(fid){const out=[];for(const c of fi6CV()){const s=c.situ||{};
    if(fi6CSee(c,'lieux')){for(const e of s.lieux||[])if(e.f===fid)out.push({c,nat:situNat(e),k:'lieux',sid:e.id,lab:SITU_NAT[situNat(e)]});
      for(const e of s.fiefs||[])if(e.f===fid)out.push({c,nat:'fief',k:'fiefs',sid:e.id,lab:'fief'});}
    if(fi6CSee(c,'poss'))for(const [a,x] of Object.entries(c.ppLk||{}))if(x===fid){const b=(c.achats||[]).find(y=>y.id===a);if(b&&b.ppel)out.push({c,nat:'prop',k:'pp',sid:a,lab:b.ppel.nom,pp:b.ppel.nom});}}
  return out;}
/* Objets détenus par un personnage (calculés depuis les objets) */
const fi6ObjsOf=cid=>fiSort(fiAll().filter(o=>o.genre==='objet'&&fiBlkSee(o,'det')&&(o.det||[]).some(x=>x.id===cid)));
const fi6Unlk=(m,o)=>`<button type="button" class="ibtn" data-act="fi6Unlk" data-m="${m}"${Object.entries(o).map(([k,v])=>` data-${k}="${esc(v)}"`).join('')} aria-label="Retirer ce lien">✕</button>`;
const fi6Ref=(f,nom)=>{const x=f&&S.fiches[f];return x&&fiSee(x)?lk({t:'fiche',id:x.id},x.nom):`<b>${esc(x?x.nom:(nom||''))}</b>`;};
const fi6Calc=()=>isGest()?' <span class="muted small">· calculé</span>':'';
function fi6Sub(f){if(f.genre!=='objet')return [];const o=[];if(f.uniq)o.push('<span class="tag2 uq">Unique</span>');
  const cr=f.crea||{},p=cr.id&&S.chars[cr.id];if(p||cr.nom)o.push('créé par '+(p&&vis(p)?lk({t:'perso',id:p.id},fiCN(p)):esc(p?fiCN(p):cr.nom)));return o;}
/* Fief : onglets Fiche | Gestion (Gestion : lot 7) quand un PJ en est détenteur */
function fi6Tabs(f){if(!fiIsFief(f)||!fiBlkSee(f,'fief')||!fi6CharLinks(f.id).some(x=>x.nat==='fief'&&x.c.type==='PJ'))return '';const t=S.fiTab==='gest'?'gest':'fiche';
  return `<div class="seg fi6tabs" role="group" aria-label="Onglets du fief">${[['fiche','Fiche'],['gest','Gestion']].map(([v,l])=>`<button type="button" data-act="fi6Tab" data-v="${v}" aria-pressed="${t===v}">${l}</button>`).join('')}</div>`;}
const fi6Gest=f=>`<div class="card"><b>Gestion du fief</b><div class="muted small" style="margin-top:4px">Arrive au lot 7 : caractéristiques du fief, taille, état économique, traits, ressources et XP de fief.</div></div>`;
function fi6Blocks(f){const G=isGest(),ed=fiCanEd(f),e=fiEyeOf(f),eye=(k,l)=>G?eyeBtn('fiEye',`data-k="${k}"`,!!e[k],l):'';let h='';
  const add=(act,lab,x)=>ed?`<div class="radd"><button class="btn" data-act="${act}"${x||''}>+ ${lab}</button></div>`:'';
  const none=t=>`<div class="muted small">${t}</div>`;
  if(f.genre==='lieu'){const L=fi6CharLinks(f.id);
    if(fiIsFief(f)&&fiBlkSee(f,'fief')){const D=L.filter(x=>x.nat==='fief'),fe=((f.fief||{}).feerie||'').trim();
      h+=fiBlk('fief','Fief',D.length?D.length+' détenteur'+(D.length>1?'s':''):'',`<div class="fimg">Détenteurs</div>${D.map(x=>`<div class="srow"><span>${lk({t:'perso',id:x.c.id},fiCN(x.c))}</span>${ed?fi6Unlk('ch',{c:x.c.id,k:x.k,s:x.sid}):''}</div>`).join('')||none('Aucun détenteur.')}${add('fi6Lk','Détenteur',' data-m="fief"')}
        <div class="fimg">Situation féerique</div>${fe?fiRich(fe):none('Rien pour l\'instant.')}${ed?`<div class="radd"><button type="button" class="edl" data-act="fiEd" data-b="feerie">${ICON.crayon} Modifier</button></div>`:''}`,{hid:G&&!e.fief,eye:eye('fief','Fief')});}
    const K=fiSort(fiKidsOf(f.id).filter(fiSee));
    if(K.length||ed)h+=fiBlk('cont','Lieux contenus'+fi6Calc(),K.length?String(K.length):'',K.map(x=>`<div class="srow"><span>${lk({t:'fiche',id:x.id},x.nom)}${x.type?` <span class="muted">· ${esc(x.type)}</span>`:''}${x.vis!=='rev'?' <span class="tag2">préparé</span>':''}</span></div>`).join('')+(K.length?'':none('Aucun lieu contenu.'))+add('fiNew','Lieu contenu',' data-g="lieu"'),{});
    if(fiBlkSee(f,'pers')){const P=L.filter(x=>x.nat!=='fief'),grp=(n,t)=>{const R=P.filter(x=>x.nat===n);return R.length?`<div class="fimg">${t}</div>`+R.map(x=>`<div class="srow"><span>${lk({t:'perso',id:x.c.id},fiCN(x.c))}${x.pp?` <span class="muted">· ${esc(x.pp)}</span> <span class="srcb">PP</span>`:''}</span>${ed?fi6Unlk('ch',{c:x.c.id,k:x.k,s:x.sid}):''}</div>`).join(''):'';};
      h+=fiBlk('pers','Personnages liés'+fi6Calc(),P.length?String(P.length):'',(grp('res','Résidents')+grp('prop','Propriétaires')+grp('autre','Autres')||none('Aucun personnage lié.'))+(ed?`<div class="radd">${[['res','Résident'],['prop','Propriétaire'],['autre','Autre lien']].map(([n,l])=>`<button class="btn" data-act="fi6Lk" data-m="pers" data-n="${n}">+ ${l}</button>`).join(' ')}</div>`:'')+'<div class="muted small" style="margin-top:4px">Repris de la Situation des personnages : un ajout ici s\'y inscrit aussi.</div>',{hid:G&&!e.pers,eye:eye('pers','Personnages liés')});}
    if(fiBlkSee(f,'orgs')){const O=f.orgs||[];if(O.length||ed)h+=fiBlk('orgs','Organisations et familles',O.length?String(O.length):'',(O.map(x=>`<div class="srow"><span>${fi6Ref(x.f,x.nom)}${x.note?`<span class="d">${esc(x.note)}</span>`:''}</span>${ed?`<button type="button" class="ibtn" data-act="fi6Org" data-i="${esc(x.id)}" aria-label="Modifier ${esc(x.nom)}">✎</button>`:''}</div>`).join('')||none('Aucune pour l\'instant.'))+add('fi6Org','Organisation ou famille'),{hid:G&&!e.orgs,eye:eye('orgs','Organisations et familles')});}
    if(fiBlkSee(f,'obj')){const O=fiSort(fiAll().filter(o=>o.genre==='objet'&&fiSee(o)&&fiBlkSee(o,'det')&&o.lieu&&o.lieu.f===f.id));
      if(O.length||ed)h+=fiBlk('obj','Objets présents'+fi6Calc(),O.length?String(O.length):'',O.map(o=>`<div class="srow"><span>${lk({t:'fiche',id:o.id},o.nom)}${o.type?` <span class="muted">· ${esc(o.type)}</span>`:''}</span></div>`).join('')+(O.length?'':none('Aucun objet.'))+'<div class="muted small" style="margin-top:4px">Objets dont l\'emplacement est ce lieu (à indiquer sur la fiche de l\'objet).</div>',{hid:G&&!e.obj,eye:eye('obj','Objets présents')});}
    if(fiBlkSee(f,'carte')){const src=illOf('carte',f.id);if(src||ed)h+=fiBlk('carte','Carte','',(src?`<div class="fibigw">${bigImg(illId('carte',f.id),src,'Carte : '+f.nom)}</div>`:none('Pas de carte.'))+(ed?`<div style="margin-top:6px">${illEdit('carte',f.id,'Carte : '+f.nom)}</div>`:''),{hid:G&&!e.carte,eye:eye('carte','Carte')});}}
  if(f.genre==='objet'){
    if(fiBlkSee(f,'effet')&&((f.effet||'').trim()||ed))h+=fiBlk('effet','Effet','',(f.effet||'').trim()?fiRich(f.effet):none('Effet non renseigné.'),{edit:ed?'fiEd':'',ea:' data-b="effet"',hid:G&&!e.effet,eye:eye('effet','Effet')});
    if(fiBlkSee(f,'carac')){const C=f.carac||{},R=[['prix','Prix'],['taille','Taille'],['poids','Poids']].filter(([k])=>(C[k]||'').trim());
      if(R.length||ed)h+=fiBlk('carac','Caractéristiques','',(R.length?`<div class="ui-kv">${R.map(([k,l])=>`<span>${l}</span><b>${esc(C[k])}</b>`).join('')}</div>`:none('Rien de renseigné.'))+'<div class="muted small" style="margin-top:4px">Prix narratif, sans lien avec la Fortune.</div>',{edit:ed?'fi6Car':'',hid:G&&!e.carac,eye:eye('carac','Caractéristiques')});}
    if(fiBlkSee(f,'det')){const D=(f.det||[]).map((x,i)=>{const c=x.id&&S.chars[x.id];return `<div class="srow"><span>${c&&vis(c)?lk({t:'perso',id:c.id},fiCN(c)):`<b>${esc(c?fiCN(c):x.nom)}</b>`}</span>${ed?fi6Unlk('det',{i}):''}</div>`;}).join('')
        +fi6CharLinks(f.id).filter(x=>x.k==='pp').map(x=>`<div class="srow"><span>${lk({t:'perso',id:x.c.id},fiCN(x.c))} <span class="muted">· ${esc(x.pp)}</span> <span class="srcb">PP</span></span>${ed?fi6Unlk('ch',{c:x.c.id,k:'pp',s:x.sid}):''}</div>`).join('');
      const lieu=f.lieu&&(f.lieu.f||f.lieu.nom),par=f.parent&&S.fiches[f.parent];
      h+=fiBlk('det','Détenteur et emplacement','',`<div class="fimg">${f.uniq?'Détenteur':'Détenteurs'}</div>${D||none('Aucun détenteur.')}${add('fi6Lk','Détenteur',' data-m="det"')}
        <div class="fimg">Emplacement</div>${lieu?`<div class="srow"><span>${fi6Ref(f.lieu.f,f.lieu.nom)}</span>${ed?fi6Unlk('emp',{}):''}</div>`:none('Non renseigné.')}${ed?`<div class="radd"><button class="btn" data-act="fi6Lk" data-m="emp">${lieu?'Changer l\'emplacement':'+ Emplacement'}</button></div>`:''}
        ${par&&fiSee(par)?`<div class="fimg">Fait partie de</div><div class="srow"><span>${lk({t:'fiche',id:par.id},par.nom)}</span></div>`:''}`,{hid:G&&!e.det,eye:eye('det','Détenteur et emplacement')});}
    const K=fiSort(fiKidsOf(f.id).filter(fiSee));
    if(K.length||ed)h+=fiBlk('ocont','Objets contenus'+fi6Calc(),K.length?String(K.length):'',K.map(x=>`<div class="srow"><span>${lk({t:'fiche',id:x.id},x.nom)}${x.type?` <span class="muted">· ${esc(x.type)}</span>`:''}${x.vis!=='rev'?' <span class="tag2">préparé</span>':''}</span></div>`).join('')+(K.length?'':none('Aucun objet contenu.'))+add('fiNew','Objet contenu',' data-g="objet"'),{});}
  return h;}
/* Fenêtre « Nom, type… » d'un objet : Unique, créateur */
function fi6HeadFields(g){const P=fi6CV().filter(c=>c.type==='PNJ');
  return `<div class="field"><label class="chk"><input type="checkbox" data-fin="uniq"${g.uniq?' checked':''}> Objet unique (un seul détenteur)</label></div>
    <div class="field"><label for="fi6Cr">Créateur</label><select id="fi6Cr" data-fin="creaId"><option value="">— texte libre ou aucun —</option>${P.map(c=>`<option value="${esc(c.id)}"${g.creaId===c.id?' selected':''}>${esc(fiCN(c))}</option>`).join('')}</select>
    <input type="text" data-fin="creaNom" value="${esc(g.creaNom||'')}" placeholder="ou en texte libre" aria-label="Créateur en texte libre" style="margin-top:6px" autocomplete="off"></div>`;}
function fi6HeadApply(n,g){n.uniq=!!g.uniq;const id=g.creaId&&S.chars[g.creaId]?g.creaId:'',nom=(g.creaNom||'').trim();n.crea=id?{id,nom:fiCN(S.chars[id])}:nom?{nom}:null;
  if(n.uniq&&(n.det||[]).length>1)n.det=n.det.slice(-1);}
/* ---------- Fenêtres ---------- */
['fi6Lk','fi6Org','fi6Car'].forEach(k=>FI_DLG.add(k));
const FI6_LK={pers:'Lien avec un personnage',fief:'Détenteur du fief',det:'Détenteur',emp:'Emplacement'};
function fi6Sheet(g){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;const sel=(k,L,v,lab,emp)=>`<div class="field"><label for="fi6-${k}">${lab}</label><select id="fi6-${k}" data-fin="${k}"><option value="">${emp||'— choisir —'}</option>${L.map(([o,t])=>`<option value="${esc(o)}"${o===v?' selected':''}>${esc(t)}</option>`).join('')}</select></div>`;
  const txt=(k,v,lab,ph)=>`<div class="field"><label for="fi6-${k}">${lab}</label><input id="fi6-${k}" type="text" data-fin="${k}" value="${esc(v||'')}"${ph?` placeholder="${esc(ph)}"`:''} autocomplete="off"></div>`;
  const foot=(ok,del)=>`${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}<div class="actions">${del?`<button class="btn ghost" style="margin-right:auto;color:var(--bad)" data-act="${del}">${g.conf?'Confirmer le retrait':'Retirer'}</button>`:''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="${ok}">Enregistrer</button></div>`;
  const CH=fi6CV().map(c=>[c.id,fiCN(c)+' · '+(c.type==='PJ'?'PJ':'PNJ')]);
  if(g.kind==='fi6Lk'){const t=FI6_LK[g.m];let b='';
    if(g.m==='pers')b=sel('cid',CH,g.cid,'Personnage')+`<div class="field"><label>Nature du lien</label><div class="seg" role="group" aria-label="Nature du lien">${[['res','Résidence'],['prop','Propriétaire'],['autre','Autre']].map(([v,l])=>`<button type="button" data-act="fi6Nat" data-v="${v}" aria-pressed="${g.nat===v}">${l}</button>`).join('')}</div></div><div class="muted small">Le lien s'inscrit aussi dans la Situation du personnage.</div>`;
    if(g.m==='fief')b=sel('cid',CH,g.cid,'Personnage')+`<div class="muted small">Le fief s'inscrit aussi dans la Situation du personnage.</div>`;
    if(g.m==='det'){const cur=(f.det||[])[0],cn=cur&&(cur.id?fiCN(S.chars[cur.id]):cur.nom);
      b=sel('cid',CH,g.cid,'Personnage','— aucun (texte libre) —')+txt('nom',g.nom,'Ou en texte libre')+(f.uniq&&cur?`<div class="muted small">Objet unique : ${esc(cn||'')} ne le détiendra plus.</div>`:'');}
    if(g.m==='emp'){const L=fiSort(fiAll().filter(x=>x.genre==='lieu'&&fiSee(x))).map(x=>[x.id,fiPath(x).filter(fiSee).map(p=>p.nom).concat([x.nom]).join(' › ')]);b=sel('lid',L,g.lid,'Lieu','— aucun (texte libre) —')+txt('nom',g.nom,'Ou en texte libre');}
    return fiShell(g,t,`<h2>${esc(t)}</h2><div class="muted small">${esc(f.nom)}</div>${b}${foot('fi6LkSave')}`);}
  if(g.kind==='fi6Org'){const L=fiSort(fiAll().filter(x=>(x.genre==='org'||x.genre==='famille')&&fiSee(x))).map(x=>[x.id,x.nom+' · '+(x.genre==='org'?'organisation':'famille')]);
    return fiShell(g,'Organisation ou famille',`<h2>Organisation ou famille</h2><div class="muted small">${esc(f.nom)}</div>${L.length?sel('oid',L,g.oid,'Fiche','— aucune (texte libre) —'):''}${txt('nom',g.nom,L.length?'Ou en texte libre':'Nom')}${txt('note',g.note,'Note','ex. surveille les lieux')}${foot('fi6OrgSave',g.i?'fi6OrgDel':'')}`);}
  if(g.kind==='fi6Car')return fiShell(g,'Caractéristiques',`<h2>Caractéristiques</h2><div class="muted small">${esc(f.nom)}</div>${txt('prix',g.prix,'Prix','ex. inestimable')}${txt('taille',g.taille,'Taille')}${txt('poids',g.poids,'Poids')}<div class="muted small">Prix narratif : aucun lien avec la Fortune.</div>${foot('fi6CarSave')}`);
  return null;}
/* Écrit un lien dans la fiche d'un personnage (principe du 25/11 : qui voit la fiche Lieu peut lier un personnage visible) */
function fi6SetC(cid,fn){const c=S.chars[cid];if(!c||!vis(c))return false;const n=clone(c);fn(n);S.chars[n.id]=n;persist('chars/'+n.id,n);return true;}
function fi6Act(a,d){if(/^fi6Rt/.test(a))return fi6RattAct(a,d);const f=S.fi&&S.fiches[S.fi],g=S.dlg;
  if(a==='fi6Tab'){S.fiTab=d.v==='gest'?'gest':'';render();return true;}
  if(a==='fi6Uq'){S.fiUq=!S.fiUq;render();return true;}
  if(S.visit)return true;
  if(a==='fi6Nat'){if(g&&g.kind==='fi6Lk'){g.nat=d.v;S._fiRedraw=true;render();}return true;}
  if(a==='fi6Lk'){if(!fiCanEd(f))return true;fiOpenDlg({kind:'fi6Lk',fid:f.id,m:d.m,nat:d.n||'res',cid:'',nom:'',lid:(f.lieu||{}).f||'',err:''});if(d.m==='emp'&&f.lieu&&!f.lieu.f)S.dlg.nom=f.lieu.nom||'';render();return true;}
  if(a==='fi6Org'){if(!fiCanEd(f))return true;const x=d.i&&(f.orgs||[]).find(y=>y.id===d.i);fiOpenDlg({kind:'fi6Org',fid:f.id,i:x?x.id:'',oid:x&&x.f||'',nom:x&&!x.f?x.nom:'',note:x?x.note||'':'',err:''});render();return true;}
  if(a==='fi6Car'){if(!fiCanEd(f))return true;const C=f.carac||{};fiOpenDlg({kind:'fi6Car',fid:f.id,prix:C.prix||'',taille:C.taille||'',poids:C.poids||''});render();return true;}
  const x=g&&S.fiches[g.fid];
  if(a==='fi6CarSave'){if(!x||!fiCanEd(x))return true;const n=clone(x);n.carac={prix:(g.prix||'').trim(),taille:(g.taille||'').trim(),poids:(g.poids||'').trim()};S.dlg=null;fiSave(n);return true;}
  if(a==='fi6OrgSave'||a==='fi6OrgDel'){if(!x||!fiCanEd(x))return true;const n=clone(x);n.orgs=(n.orgs||[]).slice();
    if(a==='fi6OrgDel'){if(!g.conf){g.conf=true;S._fiRedraw=true;render();return true;}n.orgs=n.orgs.filter(y=>y.id!==g.i);S.dlg=null;fiSave(n);return true;}
    const o=g.oid&&S.fiches[g.oid],nom=o?o.nom:(g.nom||'').trim();if(!nom){g.err='Choisis une fiche ou écris un nom.';S._fiRedraw=true;render();return true;}
    const v={f:o?o.id:'',nom,note:(g.note||'').trim()},i=n.orgs.findIndex(y=>y.id===g.i);if(i>=0)n.orgs[i]={...n.orgs[i],...v};else n.orgs.push({id:uid('o'),...v});S.dlg=null;fiSave(n);return true;}
  if(a==='fi6LkSave'){if(!x||!fiCanEd(x))return true;const err=t=>{g.err=t;S._fiRedraw=true;render();return true;};
    if(g.m==='pers'||g.m==='fief'){const c=g.cid&&S.chars[g.cid];if(!c||!vis(c))return err('Choisis un personnage.');
      const k=g.m==='fief'?'fiefs':'lieux',nat=g.nat||'res';
      if(((c.situ||{})[k]||[]).some(e=>e.f===x.id&&(k==='fiefs'||situNat(e)===nat)))return err('Ce lien existe déjà.');
      fi6SetC(c.id,n=>{const s=n.situ={...(n.situ||{})};s[k]=(s[k]||[]).concat([{id:uid('s'),date:today(),nom:x.nom,f:x.id,...(k==='lieux'?{nat,res:nat==='res'}:{})}]);});
      S.dlg=null;render();setTimeout(()=>toast('Lien ajouté'),0);return true;}
    if(g.m==='det'){const c=g.cid&&S.chars[g.cid],nom=(g.nom||'').trim();if(!c&&!nom)return err('Choisis un personnage ou écris un nom.');
      const n=clone(x),v=c?{id:c.id}:{nom};if((n.det||[]).some(y=>c?y.id===c.id:y.nom===nom))return err('Déjà détenteur.');n.det=n.uniq?[v]:(n.det||[]).concat([v]);S.dlg=null;fiSave(n);return true;}
    if(g.m==='emp'){const l=g.lid&&S.fiches[g.lid],nom=(g.nom||'').trim();const n=clone(x);n.lieu=l?{f:l.id,nom:l.nom}:nom?{nom}:null;S.dlg=null;fiSave(n);return true;}
    return true;}
  if(a==='fi6Unlk'){if(!fiCanEd(f))return true;
    if(d.m==='ch'){fi6SetC(d.c,n=>{if(d.k==='pp'){const m={...(n.ppLk||{})};delete m[d.s];n.ppLk=m;}else{const s=n.situ={...(n.situ||{})};s[d.k]=(s[d.k]||[]).filter(e=>e.id!==d.s);}});render();return true;}
    const n=clone(f);if(d.m==='det')n.det=(n.det||[]).filter((y,i)=>i!==+d.i);if(d.m==='emp')n.lieu=null;fiSave(n);return true;}
  return true;}
/* Suppression d'une fiche : les liens qui la visaient redeviennent du texte (nom gardé) */
function fi6Unlink(f){if(!f)return;const id=f.id;
  for(const c of Object.values(S.chars||{})){let ch=false;const n=clone(c),s=n.situ||{};
    for(const k of ['lieux','fiefs','poss','possN','orgs','titres','familles'])for(const e of s[k]||[])if(e.f===id){delete e.f;e.nom=e.nom||f.nom;ch=true;}
    for(const e of s.titres||[])if(e.dom&&e.dom.f===id){e.dom={nom:e.dom.nom||f.nom};ch=true;} /* lot 5 a */
    if(n.ppLk)for(const a of Object.keys(n.ppLk))if(n.ppLk[a]===id){delete n.ppLk[a];ch=true;}
    if(ch){S.chars[n.id]=n;persist('chars/'+n.id,n);}}
  for(const o of fiAll()){if(o.id===id)continue;let ch=false;const n=clone(o);
    if(n.lieu&&n.lieu.f===id){n.lieu={nom:n.lieu.nom||f.nom};ch=true;}
    for(const y of n.orgs||[])if(y.f===id){y.f='';ch=true;}
    for(const y of n.rel||[])if(y.f===id){y.f='';y.nom=y.nom||f.nom;ch=true;} /* lot 5 a */
    if(n.crea&&n.crea.id===id){n.crea={nom:n.crea.nom};ch=true;}
    if(ch)fiSave(n,true);}}

/* ---------- Situation : liens vers les fiches (PJ et PNJ) ---------- */
/* Nom d'une ligne de Situation : lien vers la fiche reliée si la personne la voit */
const situNm=e=>e.f&&S.fiches[e.f]?fi6Ref(e.f,e.nom):`<b>${esc(e.nom)}</b>`;
const situFk={fiefs:['lieu'],lieux:['lieu'],poss:['lieu','objet'],possN:['lieu','objet'],orgs:['org'],familles:['famille']}; /* lot 5 a : organisations ; lot 5 b : familles */
function situFField(k,v){const G=situFk[k];if(!G)return '';const L=fiSort(fiAll().filter(x=>G.includes(x.genre)&&fiSee(x)));
  return `<div class="field"><label for="dk-f">Fiche</label><select id="dk-f" data-dk="f"><option value="">— aucune (texte libre) —</option>${L.map(x=>`<option value="${esc(x.id)}"${x.id===v?' selected':''}>${esc((G.length>1?(x.genre==='lieu'?'Lieu · ':'Objet · '):'')+fiPath(x).filter(fiSee).map(p=>p.nom).concat([x.nom]).join(' › '))}</option>`).join('')}</select>${['poss','possN'].includes(k)?'<div class="muted small">Un objet choisi ici est inscrit sur la fiche de l\'objet (détenteur) ; un lieu, dans Résidence et lieux (propriétaire).</div>':''}</div>`;}
/* Lignes d'objets calculées (Possessions) */
const situObjRows=c=>fi6ObjsOf(c.id).map(o=>`<div class="srow"><span>${lk({t:'fiche',id:o.id},o.nom)}${o.type?` <span class="muted">· ${esc(o.type)}</span>`:''}</span><span class="srcb j">objet</span></div>`);
/* Enregistrement d'une ligne de Situation avec fiche (fenêtre situEd) : renvoie true si traité ici */
function situSaveF(cc,g){const fx=g.f.f&&S.fiches[g.f.f];if(!fx||!['poss','possN'].includes(g.k))return false;
  if(fx.genre==='objet'){const n=clone(fx);if(!(n.det||[]).some(y=>y.id===cc.id))n.det=n.uniq?[{id:cc.id}]:(n.det||[]).concat([{id:cc.id}]);fiSave(n,true);}
  else{const n=clone(cc),s=n.situ={...(n.situ||{})};if(!(s.lieux||[]).some(e=>e.f===fx.id&&situNat(e)==='prop'))s.lieux=(s.lieux||[]).concat([{id:uid('s'),date:today(),nom:fx.nom,f:fx.id,nat:'prop',res:false}]);saveChar(n);}
  if(g.i){const n=clone(S.chars[cc.id]),s=n.situ={...(n.situ||{})};s[g.k]=(s[g.k]||[]).filter(e=>e.id!==g.i);saveChar(n);}
  return true;}

/* ---------- Rattachement par nom (Paramètres › Données, gestion) ----------
   Lignes de Situation en texte (fiefs, lieux, possessions) et éléments de PP dont le nom est celui d'une fiche Lieu ou Objet. */
function fi6RattCands(){const out=[],F=fiAll().filter(x=>['lieu','objet','org','famille'].includes(x.genre)),by={};for(const x of F){const k=nrm(x.nom);if(k)(by[k]=by[k]||[]).push(x);}
  const ign=new Set(S.rtIgn||[]),pick=(nom,G)=>{const L=(by[nrm(nom)]||[]).filter(x=>G.includes(x.genre));return L.length===1?L[0]:null;};
  for(const c of Object.values(S.chars||{})){const s=c.situ||{};
    for(const [k,G] of Object.entries(situFk))for(const e of s[k]||[]){if(e.f||!(e.nom||'').trim())continue;const x=pick(e.nom,G);if(x){const key=c.id+'|'+k+'|'+e.id;if(!ign.has(key))out.push({key,c,k,e,x,lab:e.nom});}}
    for(const a of (c.achats||[]).filter(a=>a.ppel)){if((c.ppLk||{})[a.id])continue;const x=pick(a.ppel.nom,['lieu','objet']);if(x){const key=c.id+'|pp|'+a.id;if(!ign.has(key))out.push({key,c,k:'pp',e:{id:a.id},x,lab:a.ppel.nom});}}}
  return out;}
function fi6Ratt(r){const c=S.chars[r.c.id];if(!c)return;
  if(r.k==='pp'){const n=clone(c);n.ppLk={...(n.ppLk||{}),[r.e.id]:r.x.id};S.chars[n.id]=n;persist('chars/'+n.id,n);return;}
  if(['poss','possN'].includes(r.k)){situSaveF(c,{k:r.k,i:r.e.id,f:{f:r.x.id}});return;}
  const n=clone(c),s=n.situ={...(n.situ||{})};s[r.k]=(s[r.k]||[]).map(e=>e.id===r.e.id?{...e,f:r.x.id}:e);S.chars[n.id]=n;persist('chars/'+n.id,n);}
function fi6RattView(){if(!isGest())return '';const L=fi6RattCands();
  return `<div class="card"><h3 class="rs" style="margin-top:0">Rattachement par nom <span class="muted small" style="text-transform:none;letter-spacing:0">${L.length} proposition${L.length>1?'s':''}</span></h3>
    <div class="ui-small muted" style="margin-bottom:6px">Lignes de Situation saisies en texte (fiefs, lieux, possessions, éléments de PP) qui portent le nom d'une fiche Lieu, Objet, Organisation ou Famille. Rien n'est modifié sans validation.</div>
    ${L.map(r=>`<div class="srow"><span><b>${esc(fiCN(r.c))}</b> · ${esc(r.lab)} → ${lk({t:'fiche',id:r.x.id},r.x.nom)} <span class="muted small">(${r.x.genre==='lieu'?'lieu':r.x.genre==='org'?'organisation':r.x.genre==='famille'?'famille':'objet'})</span></span><span style="display:flex;gap:4px"><button class="btn ghost ui-xs" data-act="fi6RtNo" data-k="${esc(r.key)}">Ignorer</button><button class="btn ui-xs" data-act="fi6RtOk" data-k="${esc(r.key)}">Rattacher</button></span></div>`).join('')||'<div class="muted small">Aucune proposition.</div>'}
    ${L.length>1?`<div class="actions"><button class="btn pri" data-act="fi6RtAll">Tout rattacher</button></div>`:''}</div>`;}
function fi6RattAct(a,d){if(!/^fi6Rt/.test(a))return false;if(!isGest()||S.visit)return true;const L=fi6RattCands();
  if(a==='fi6RtNo'){S.rtIgn=[...(S.rtIgn||[]),d.k];}
  else if(a==='fi6RtOk'){const r=L.find(x=>x.key===d.k);if(r)fi6Ratt(r);toast('Rattaché');}
  else if(a==='fi6RtAll'){for(const r of L)fi6Ratt(r);toast(L.length+' rattachement'+(L.length>1?'s':''));}
  render();return true;}
/* Liste des objets : détenteur ou emplacement sous le nom */
function fi6Hold(o){if(o.genre!=='objet'||!fiBlkSee(o,'det'))return '';const d=(o.det||[])[0],c=d&&d.id&&S.chars[d.id];
  const h=d?(c?(vis(c)?fiCN(c):''):d.nom):'';const l=o.lieu&&(o.lieu.f?(S.fiches[o.lieu.f]&&fiSee(S.fiches[o.lieu.f])?S.fiches[o.lieu.f].nom:''):o.lieu.nom);
  return [h,l].filter(Boolean).join(' · ')+((o.det||[]).length>1?' (+'+((o.det||[]).length-1)+')':'')+(o.uniq?' · unique':'');}

/* ---------- Lot 5 a (26/11/2026) : Organisations ----------
   Fiche org : rangs [{id, m, f, note}] (du plus haut au plus bas niveau ; f = forme féminine), titres (true : rangs = titres cumulables,
   saisis dans Situation › Titres — Monarchie), prat (Pratiques), mbx [{id, nom, rang, role, sup, note}] (membres en texte),
   mhid [clé] (membres masqués : id du personnage ou « x:id » du membre en texte), rel [{id, f, nom, lab, note}] (relations).
   Personnage : situ.orgs [{id, nom, f, rang, role, sup:{id}|{nom}, note}] ; situ.titres [{id, nom, f, rang, dom:{f}|{nom}, suz:{id}|{nom}, note}].
   Membres calculés depuis la Situation (et les titres pour une organisation à titres) ; rang d'un membre = le plus haut. */
FI6_EYE.org=['rangs','prat','mem','lieux','rel'];
S.ogFold=S.ogFold||{};S.ogOpen=S.ogOpen||{};
const OG_TABS=[['pres','Présentation'],['mem','Membres'],['ctx','Contexte']];
const OG_LAB=['Alliés','Ennemis','Auxiliaires','Rivaux'];
const ogTab=()=>['mem','ctx'].includes(S.fiTab)?S.fiTab:'pres';
const ogTabsBar=t=>`<div class="seg ogtabs" role="group" aria-label="Onglets de l'organisation">${OG_TABS.map(([v,l])=>`<button type="button" data-act="fiOTab" data-v="${v}" aria-pressed="${t===v}">${l}</button>`).join('')}</div>`;
const ogRangs=o=>(o&&o.rangs)||[];
const ogRL=(r,c)=>!r?'':(c&&c.genre==='f'&&(r.f||'').trim()?r.f.trim():r.m);
const ogRIx=(o,r)=>r?ogRangs(o).findIndex(x=>x.id===r.id):-1;
/* Rang reconnu dans un texte (« Chevalier sans terre » avant « Chevalier ») */
function ogRFind(o,txt){const t=nrm(txt).replace(/^titre d[e'] ?/,'');if(!t)return null;let best=null,bl=0;
  for(const r of ogRangs(o))for(const v of [r.m,r.f]){const n=nrm(v);if(n&&(t===n||t.startsWith(n+' '))&&n.length>bl){best=r;bl=n.length;}}return best;}
const ogRById=(o,id)=>id?ogRangs(o).find(r=>r.id===id)||null:null;
const ogOrgs=()=>fiSort(fiAll().filter(x=>x.genre==='org'));
const ogTOrgs=()=>ogOrgs().filter(x=>x.titres);
/* Rang d'une ligne Situation › Organisations */
const ogLineR=(o,e)=>ogRById(o,e.rang)||(!o.titres?ogRFind(o,e.role):ogRFind(o,e.role));
/* Titres d'un personnage reliés à une organisation à titres (lignes saisies et titres achetés en PP), du plus haut au plus bas */
function ogTitles(c){const out=[],T=ogTOrgs();if(!T.length)return out;
  const find=(t,nom)=>{const o0=t.f&&S.fiches[t.f];for(const o of o0&&o0.titres?[o0]:T){const r=ogRById(o,t.rang)||ogRFind(o,nom);if(r)return {o,r};}return null;};
  for(const t of (c.situ||{}).titres||[]){const x=find(t,t.nom);if(x)out.push({t,...x,ix:ogRIx(x.o,x.r)});}
  for(const a of ppBought(c).filter(a=>a.ppel.rub==='T'&&!a.ppel.fin)){const x=find({},a.ppel.nom);if(x)out.push({t:{id:'pp:'+a.id,nom:a.ppel.nom,pp:true},...x,ix:ogRIx(x.o,x.r)});}
  return out.sort((a,b)=>a.ix-b.ix);}
const ogDomN=d=>!d?'':d.f&&S.fiches[d.f]?S.fiches[d.f].nom:(d.nom||'');
const ogDomH=d=>!d?'':d.f&&S.fiches[d.f]?fi6Ref(d.f,d.nom):esc(d.nom||'');
/* Libellé d'un titre : « Dame de Sèvres » */
const ogTitL=(x,c)=>x.t.pp?x.t.nom:ogRL(x.r,c)+(ogDomN(x.t.dom)?' de '+ogDomN(x.t.dom):'');
const ogPers=(ref)=>{if(!ref)return '';if(ref.id){const c=S.chars[ref.id];return c?(vis(c)?lk({t:'perso',id:c.id},fiCN(c)):esc(fiCN(c))):esc(ref.nom||'');}return esc(ref.nom||'');};
const ogPersN=ref=>!ref?'':ref.id&&S.chars[ref.id]?fiCN(S.chars[ref.id]):(ref.nom||'');
/* Membres d'une organisation */
function ogMembers(o,all){const M=new Map(),L=[],G=isGest(),hid=new Set(o.mhid||[]);
  const add=(key,base)=>{let m=M.get(key);if(!m){m={key,...base,rk:null,rix:1e9,roles:[],tits:[],sups:[],line:null,hid:hid.has(key)};M.set(key,m);L.push(m);}return m;};
  const rank=(m,r)=>{const i=ogRIx(o,r);if(r&&i>=0&&i<m.rix){m.rix=i;m.rk=r;}};
  for(const c of Object.values(S.chars||{})){if(!vis(c))continue;const s=c.situ||{};
    if(fi6CSee(c,'orgs'))for(const e of s.orgs||[]){if(e.f!==o.id)continue;const m=add(c.id,{c});m.line=e;const r=ogLineR(o,e);rank(m,r);
      const role=(e.role||'').trim();if(role&&!(r&&(!e.rang||ogRFind(o,role)===r)))m.roles.push(role); /* rôle qui n'est que le nom du rang : non répété */
      if(e.sup&&(e.sup.id||e.sup.nom))m.sups.push({...e.sup});}
    if(o.titres&&fi6CSee(c,'titres'))for(const x of ogTitles(c))if(x.o.id===o.id){const m=add(c.id,{c});m.tits.push(x);rank(m,x.r);if(x.t.suz&&(x.t.suz.id||x.t.suz.nom))m.sups.push({...x.t.suz,tit:x});}}
  for(const x of o.mbx||[]){const m=add('x:'+x.id,{x});const r=ogRById(o,x.rang)||ogRFind(o,x.role);rank(m,r);const role=(x.role||'').trim();if(role&&!(r&&(!x.rang||ogRFind(o,role)===r)))m.roles.push(role);if(x.sup&&(x.sup.id||x.sup.nom))m.sups.push({...x.sup});}
  const nm=m=>m.c?fiCN(m.c):m.x.nom;
  return L.filter(m=>all||G||!m.hid).sort((a,b)=>a.rix-b.rix||nm(a).localeCompare(nm(b),'fr',{sensitivity:'base'}));}
const ogMN=m=>m.c?fiCN(m.c):m.x.nom;
/* Groupes : rangs (dans l'ordre), autres rôles, sans rang */
function ogGroups(o,L){const out=[];ogRangs(o).forEach((r,i)=>{const R=L.filter(m=>m.rk&&m.rk.id===r.id);if(R.length)out.push({k:'r'+r.id,t:r.m+((r.f||'').trim()&&r.f.trim()!==r.m?' / '+r.f.trim():''),n:i+1,L:R});});
  const A=L.filter(m=>!m.rk&&m.roles.length),N=L.filter(m=>!m.rk&&!m.roles.length);
  if(A.length)out.push({k:'autres',t:'Autres rôles',L:A});if(N.length)out.push({k:'sans',t:o.titres?'Sans titre':'Sans rang',L:N});return out;}
/* Ligne d'un membre */
function ogMRow(o,m,o2){o2=o2||{};const G=isGest(),ed=fiCanEd(o),c=m.c;
  const name=c?(vis(c)?lk({t:'perso',id:c.id},fiCN(c)):`<b>${esc(fiCN(c))}</b>`):`<b>${esc(m.x.nom)}</b>`;
  const bits=[];
  if(o2.tit)bits.push(`<span class="ogrk">${esc(ogTitL(o2.tit,c))}</span>`);
  else if(o.titres&&m.tits.length)bits.push(`<span class="ogrk">${esc(ogTitL(m.tits[0],c))}</span>`);
  else if(m.rk&&o2.showRk)bits.push(`<span class="ogrk">${esc(ogRL(m.rk,c))}</span>`);
  const other=o2.tit?m.tits.filter(x=>x!==o2.tit):m.tits.slice(1);
  const sub=[...m.roles.map(r=>esc(r)),...other.map(x=>'aussi '+esc(ogTitL(x,c))+(x.t.suz?' · sous '+ogPers(x.t.suz):'')),
    ...(!o.titres&&!o2.tree&&m.sups.filter(x=>isGest()||!(o.mhid||[]).includes(x.id)).length?['sous '+m.sups.filter(x=>isGest()||!(o.mhid||[]).includes(x.id)).map(ogPers).join(', ')]:[]),...(o2.extSup?['sous '+o2.extSup]:[])];
  const tog=o2.kids?`<button type="button" class="ogtg" data-act="fiOOpen" data-k="${esc(o.id+'|'+m.key)}" aria-expanded="${!!o2.open}" aria-label="${o2.open?'Replier':'Déplier'} ${esc(ogMN(m))}">${o2.open?'⌄':'›'}</button>`:(o2.tree?'<span class="ogtg0"></span>':'');
  return `<div class="srow ogm${m.hid?' fihid':''}" style="padding-left:${(o2.d||0)*18}px"><span class="ogmn">${tog}<span>${name}${c&&c.type==='PJ'?' <span class="tag2">PJ</span>':''} ${bits.join(' ')}${o2.kids?` <span class="muted small">· ${o2.kids} sous ${c&&c.genre==='f'?'elle':'lui'}</span>`:''}${sub.length?`<span class="d">${sub.join(' · ')}</span>`:''}</span></span>`
    +(ed&&(m.x||m.line)?`<button type="button" class="ibtn" data-act="fiOMem" data-k="${esc(m.key)}" aria-label="Modifier ${esc(ogMN(m))}">✎</button>`:'')
    +(G?eyeBtn('fiOEyeM',`data-k="${esc(m.key)}"`,!m.hid,'Membre '+ogMN(m)):'')+`</div>`;}
function ogGrp(o,g,body){const k=o.id+'|'+g.k,fold=!!S.ogFold[k];
  return `<div class="oggrp"><button type="button" class="oggh" data-act="fiOFold" data-k="${esc(k)}" aria-expanded="${!fold}"><span class="c" aria-hidden="true">${fold?'›':'⌄'}</span>${g.n?`<span class="ogrk">${g.n}</span>`:''}<span>${esc(g.t)}</span><span class="n">${g.L.length}</span></button>${fold?'':body}</div>`;}
/* Vue Hiérarchie : racines groupées par rang, subordonnés dépliables, triés par niveau */
function ogTree(o,L){const by=new Map(L.map(m=>[m.key,m])),kids=new Map(),roots=[];
  for(const m of L){const P=m.sups.filter(s=>s.id&&by.has(s.id)&&s.id!==m.key);if(!P.length)roots.push(m);for(const s of P){if(!kids.has(s.id))kids.set(s.id,[]);kids.get(s.id).push({m,s});}}
  const seen=new Set();const reach=m=>{if(seen.has(m.key))return;seen.add(m.key);for(const k of kids.get(m.key)||[])reach(k.m);};roots.forEach(reach);
  for(const m of L)if(!seen.has(m.key)){roots.push(m);reach(m);} /* boucle de supérieurs : remis à la racine */
  const node=(m,d,s,path)=>{const K=(kids.get(m.key)||[]).filter(k=>!path.has(k.m.key)).sort((a,b)=>(a.s.tit?a.s.tit.ix:a.m.rix)-(b.s.tit?b.s.tit.ix:b.m.rix)||ogMN(a.m).localeCompare(ogMN(b.m),'fr',{sensitivity:'base'}));
    const k=o.id+'|'+m.key,op=!!S.ogOpen[k]&&K.length;const ext=m.sups.filter(x=>!(x.id&&by.has(x.id))&&!x.tit).map(ogPers).join(', ');
    let h=ogMRow(o,m,{d,tree:true,kids:K.length,open:op,tit:s&&s.tit,showRk:true,extSup:d===0&&ext?ext:''});
    if(op){const p2=new Set(path);p2.add(m.key);for(const x of K)h+=node(x.m,d+1,x.s,p2);}return h;};
  return ogGroups(o,roots).map(g=>ogGrp(o,g,g.L.map(m=>node(m,0,null,new Set([m.key]))).join(''))).join('');}
function ogBlocks(f,t){const G=isGest(),ed=fiCanEd(f),e=fiEyeOf(f),eye=(k,l)=>G?eyeBtn('fiEye',`data-k="${k}"`,!!e[k],l):'',none=x=>`<div class="muted small">${x}</div>`;let h='';
  const add=(act,lab,x)=>ed?`<div class="radd"><button class="btn" data-act="${act}"${x||''}>+ ${lab}</button></div>`:'';
  if(t==='pres'){
    if(fiBlkSee(f,'rangs')){const R=ogRangs(f);if(R.length||ed)h+=fiBlk('rangs','Rangs internes',R.length?String(R.length):'',
      (R.length?`<div class="muted small">${f.titres?'Ordre de préséance, du plus haut au plus bas. Titres cumulables (Situation › Titres) : le plus haut l\'emporte.':'Du plus haut au plus bas niveau.'}</div>`+R.map((r,i)=>`<div class="srow"><span><span class="ogrk">${i+1}</span> <b>${esc(r.m)}</b>${(r.f||'').trim()&&r.f.trim()!==r.m?' / <b>'+esc(r.f.trim())+'</b>':''}${r.note?`<span class="d">${esc(r.note)}</span>`:''}</span></div>`).join(''):none('Aucun rang.')),
      {edit:ed?'fiORangs':'',hid:G&&!e.rangs,eye:eye('rangs','Rangs internes')});}
    if(fiBlkSee(f,'prat')&&((f.prat||'').trim()||ed))h+=fiBlk('prat','Pratiques','',(f.prat||'').trim()?fiRich(f.prat):none('Rien pour l\'instant.'),{edit:ed?'fiEd':'',ea:' data-b="prat"',hid:G&&!e.prat,eye:eye('prat','Pratiques')});}
  if(t==='mem'){
    if(fiBlkSee(f,'mem')){const L=ogMembers(f),hasSup=L.some(m=>m.sups.some(s=>s.id)),v=hasSup&&S.ogView==='tree'?'tree':'rang';
      const bar=hasSup?`<div class="seg" role="group" aria-label="Affichage des membres">${[['rang','Par rang'],['tree','Hiérarchie']].map(([k,l])=>`<button type="button" data-act="fiOView" data-v="${k}" aria-pressed="${v===k}">${l}</button>`).join('')}</div>`:'';
      const body=!L.length?none('Aucun membre pour l\'instant.'):v==='tree'?ogTree(f,L):ogGroups(f,L).map(g=>ogGrp(f,g,g.L.map(m=>ogMRow(f,m)).join(''))).join('');
      h+=fiBlk('mem','Membres'+fi6Calc(),L.length?String(L.length):'',bar+body+(ed?`<div class="radd"><button class="btn" data-act="fiOMem" data-k="">+ Membre</button>${f.titres?' <button class="btn" data-act="fiOTit">+ Titre</button>':''}</div>`:'')
        +`<div class="muted small" style="margin-top:4px">Repris de la Situation des personnages${f.titres?' (organisations et titres)':''} ; un ajout ici s'y inscrit aussi.</div>`,{hid:G&&!e.mem,eye:eye('mem','Membres')});}
    const K=fiSort(fiKidsOf(f.id).filter(fiSee));
    if(K.length||ed)h+=fiBlk('osub','Sous-organisations'+fi6Calc(),K.length?String(K.length):'',K.map(x=>`<div class="srow"><span>${lk({t:'fiche',id:x.id},x.nom)}${x.type?` <span class="muted">· ${esc(x.type)}</span>`:''}${x.vis!=='rev'?' <span class="tag2">préparé</span>':''}</span><span class="muted small">${ogMembers(x).length} membre${ogMembers(x).length>1?'s':''}</span></div>`).join('')+(K.length?'':none('Aucune.'))+add('fiNew','Organisation contenue',' data-g="org"'),{});}
  if(t==='ctx'){
    if(fiBlkSee(f,'lieux')){const L=ogLieux(f);if(L.length||ed)h+=fiBlk('lieux','Lieux'+fi6Calc(),L.length?String(L.length):'',L.map(({l,y})=>`<div class="srow"><span>${lk({t:'fiche',id:l.id},l.nom)}${y.note?`<span class="d">${esc(y.note)}</span>`:''}</span>${ed&&fiCanEd(l)?`<button type="button" class="ibtn" data-act="fiOLieuX" data-l="${esc(l.id)}" data-i="${esc(y.id)}" aria-label="Retirer ce lieu">✕</button>`:''}</div>`).join('')+(L.length?'':none('Aucun lieu.'))+add('fiOLieu','Lieu')+'<div class="muted small" style="margin-top:4px">Lieux dont le bloc « Organisations et familles » cite cette organisation.</div>',{hid:G&&!e.lieux,eye:eye('lieux','Lieux')});}
    if(fiBlkSee(f,'rel')){const R=f.rel||[];if(R.length||ed)h+=fiBlk('rel','Relations',R.length?String(R.length):'',R.map(y=>`<div class="srow"><span>${fi6Ref(y.f,y.nom)} <span class="${/ennemi|rival/i.test(y.lab)?'ogtr':'ogtg2'}">${esc(y.lab||'')}</span>${y.note?`<span class="d">${esc(y.note)}</span>`:''}</span>${ed?`<button type="button" class="ibtn" data-act="fiORel" data-i="${esc(y.id)}" aria-label="Modifier la relation">✎</button>`:''}</div>`).join('')+(R.length?'':none('Aucune relation.'))+add('fiORel','Relation',' data-i=""'),{hid:G&&!e.rel,eye:eye('rel','Relations')});}}
  return h;}
const ogLieux=o=>fiSort(fiAll().filter(l=>l.genre==='lieu'&&fiSee(l)&&fiBlkSee(l,'orgs')&&(l.orgs||[]).some(y=>y.f===o.id))).map(l=>({l,y:(l.orgs||[]).find(y=>y.f===o.id)}));
/* ---------- Situation : Organisations et Titres ---------- */
function ogSitRows(c,k){const E=canEditC(c),btn=e=>E?`<button type="button" class="ibtn" data-act="situEd" data-k="${k}" data-i="${esc(e.id)}" aria-label="Modifier ${esc(e.nom||'')}">✎</button>`:'';
  if(k==='titres'){const T=ogTitles(c).filter(x=>!x.t.pp),ids=new Set(T.map(x=>x.t.id));
    return T.map(x=>`<div class="srow"><span><b>${esc(ogRL(x.r,c))}</b>${x.t.dom&&ogDomN(x.t.dom)?' de '+ogDomH(x.t.dom):''}${x.t.suz&&ogPersN(x.t.suz)?` <span class="muted">· sous ${ogPers(x.t.suz)}</span>`:''}${ogTOrgs().length>1?` <span class="muted">· ${fi6Ref(x.o.id)}</span>`:''}${x.t.note?`<span class="d">${esc(x.t.note)}</span>`:''}</span>${srcChip('jeu')}${btn(x.t)}</div>`)
      .concat(((c.situ||{}).titres||[]).filter(e=>!ids.has(e.id)).map(e=>`<div class="srow"><span><b>${esc(e.nom)}</b>${e.note?`<span class="d">${esc(e.note)}</span>`:''}</span>${srcChip('jeu')}${btn(e)}</div>`));}
  const L=(c.situ||{}).orgs||[],rows=L.map(e=>{const o=e.f&&S.fiches[e.f],r=o&&ogLineR(o,e),role=(e.role||'').trim(),showRole=role&&!(r&&(!e.rang||ogRFind(o,role)===r));
    return `<div class="srow"><span>${situNm(e)}${r?` <span class="muted">· ${esc(ogRL(r,c))}</span>`:''}${showRole?` <span class="muted">· ${esc(role)}</span>`:''}${e.sup&&ogPersN(e.sup)?` <span class="muted">· sous ${ogPers(e.sup)}</span>`:''}${e.note?`<span class="d">${esc(e.note)}</span>`:''}</span>${srcChip('jeu')}${btn(e)}</div>`;});
  const T=ogTitles(c),seen=new Set(L.map(e=>e.f).filter(Boolean));
  for(const o of [...new Set(T.map(x=>x.o))])if(!seen.has(o.id)&&fiSee(o)){const x=T.find(y=>y.o===o);rows.push(`<div class="srow"><span>${fi6Ref(o.id)} <span class="muted">· ${esc(ogRL(x.r,c))} (par ses titres)</span></span></div>`);}
  return rows;}
/* Organisations d'un personnage (clés de comparaison : fiche, sinon nom) */
function ogKeysOf(c){const m=new Map();for(const e of (c.situ||{}).orgs||[]){const o=e.f&&S.fiches[e.f];m.set(o?'f:'+o.id:'n:'+nrm(e.nom),o?o.nom:e.nom);}
  for(const x of ogTitles(c))m.set('f:'+x.o.id,x.o.nom);return m;}
function ogCommon(c,p){if(!c||!p)return '';const a=ogKeysOf(c),b=ogKeysOf(p);for(const [k,n] of a)if(k!=='n:'&&b.has(k))return n;return '';}
/* ---------- Fenêtres ---------- */
['fiORangs','fiOMem','fiOSit','fiORel','fiOLieu'].forEach(k=>FI_DLG.add(k));
const ogSel=(k,L,v,lab,emp,re)=>`<div class="field"><label for="og-${k}">${lab}</label><select id="og-${k}" data-fin="${k}"${re?' data-ogre="1"':''}>${emp!==false?`<option value="">${emp||'— choisir —'}</option>`:''}${L.map(([o,t])=>`<option value="${esc(o)}"${o===v?' selected':''}>${esc(t)}</option>`).join('')}</select></div>`;
const ogTxt=(k,v,lab,ph)=>`<div class="field"><label for="og-${k}">${lab}</label><input id="og-${k}" type="text" data-fin="${k}" value="${esc(v||'')}"${ph?` placeholder="${esc(ph)}"`:''} autocomplete="off"></div>`;
const ogFoot=(g,ok,del)=>`${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}<div class="actions">${del?`<button class="btn ghost" style="margin-right:auto;color:var(--bad)" data-act="${del}">${g.conf?'Confirmer le retrait':'Retirer'}</button>`:''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="${ok}">Enregistrer</button></div>`;
const ogCh=()=>fi6CV().map(c=>[c.id,fiCN(c)+' · '+(c.type==='PJ'?'PJ':'PNJ')]);
const ogRangOpts=(o,c)=>ogRangs(o).map((r,i)=>[r.id,(i+1)+'. '+(c?ogRL(r,c):r.m+((r.f||'').trim()&&r.f.trim()!==r.m?' / '+r.f.trim():''))]);
/* Choix du supérieur : membres de l'organisation (sauf soi) */
const ogSupOpts=(o,self)=>o?ogMembers(o,true).filter(m=>m.c&&m.key!==self).map(m=>[m.c.id,fiCN(m.c)+(m.rk?' · '+ogRL(m.rk,m.c):'')]):[];
function ogSheet(g){
  if(g.kind==='fiORangs'){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;
    return fiShell(g,'Rangs internes',`<h2>Rangs internes</h2><div class="muted small">${esc(f.nom)} · du plus haut au plus bas niveau</div>
      ${g.R.map((r,i)=>`<div class="ogrr"><span class="ogrk">${i+1}</span><input type="text" data-ogr="${i}|m" value="${esc(r.m)}" placeholder="Rang (masculin)" aria-label="Rang ${i+1}, forme masculine" autocomplete="off"><input type="text" data-ogr="${i}|f" value="${esc(r.f||'')}" placeholder="Féminin" aria-label="Rang ${i+1}, forme féminine" autocomplete="off"><input type="text" data-ogr="${i}|note" value="${esc(r.note||'')}" placeholder="Note" aria-label="Rang ${i+1}, note" autocomplete="off"><span class="ogra"><button type="button" class="ibtn" data-act="fiORMv" data-i="${i}" data-d="-1" aria-label="Monter"${i?'':' disabled'}>↑</button><button type="button" class="ibtn" data-act="fiORMv" data-i="${i}" data-d="1" aria-label="Descendre"${i<g.R.length-1?'':' disabled'}>↓</button><button type="button" class="ibtn" data-act="fiORX" data-i="${i}" aria-label="Retirer le rang">✕</button></span></div>`).join('')}
      <div class="radd"><button class="btn" data-act="fiORAdd">+ Un rang</button></div>
      <div class="field"><label class="chk"><input type="checkbox" data-fin="titres"${g.titres?' checked':''}> Titres cumulables (saisis dans Situation › Titres ; le plus haut l'emporte)</label></div>
      <div class="muted small">La forme féminine s'affiche pour les personnages de genre féminin. Un rang retiré n'efface rien chez les personnages (le texte reste).</div>${ogFoot(g,'fiORSave')}`);}
  if(g.kind==='fiORel'){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;const L=ogOrgs().filter(x=>x.id!==f.id&&fiSee(x)).map(x=>[x.id,x.nom]);
    return fiShell(g,'Relation',`<h2>Relation</h2><div class="muted small">${esc(f.nom)}</div>${ogSel('oid',L,g.oid,'Organisation liée')}${ogTxt('lab',g.lab,'Étiquette','ex. ennemis')}
      <div class="chips" style="margin-top:-4px">${OG_LAB.map(l=>`<button type="button" class="chip" data-act="fiORelLab" data-v="${esc(l.toLowerCase())}" aria-pressed="${nrm(g.lab)===nrm(l)}">${l}</button>`).join('')}</div>
      ${ogTxt('note',g.note,'Note')}${g.i?'<div class="muted small">Retirer la relation la retire aussi de l\'autre organisation.</div>':`<div class="field"><label class="chk"><input type="checkbox" data-fin="recip"${g.recip?' checked':''}> Réciproque : ajoutée aussi sur l'autre organisation</label></div>`}${ogFoot(g,'fiORelSave',g.i?'fiORelDel':'')}`);}
  if(g.kind==='fiOLieu'){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;const L=fiSort(fiAll().filter(x=>x.genre==='lieu'&&fiSee(x)&&fiCanEd(x)&&!(x.orgs||[]).some(y=>y.f===f.id))).map(x=>[x.id,fiPath(x).filter(fiSee).map(p=>p.nom).concat([x.nom]).join(' › ')]);
    return fiShell(g,'Lieu',`<h2>Lieu</h2><div class="muted small">${esc(f.nom)}</div>${ogSel('lid',L,g.lid,'Lieu')}${ogTxt('note',g.note,'Note','ex. quartier général')}<div class="muted small">Le lien s'inscrit aussi sur la fiche du lieu (Organisations et familles).</div>${ogFoot(g,'fiOLieuSave')}`);}
  if(g.kind==='fiOMem'){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;const ex=g.k&&g.k.startsWith('x:'),edC=g.k&&!ex;
    const c=g.cid&&S.chars[g.cid];
    return fiShell(g,'Membre',`<h2>${g.k?'Membre':'Nouveau membre'}</h2><div class="muted small">${esc(f.nom)}</div>
      ${edC?`<div class="field"><label>Personnage</label><div class="inp ro">${esc(c?fiCN(c):'')}</div></div>`:ex?'':ogSel('cid',ogCh(),g.cid,'Personnage','— aucun (texte libre) —',true)}
      ${ex||!g.cid?ogTxt('nom',g.nom,ex?'Nom':'Ou en texte libre'):''}
      ${!f.titres&&ogRangs(f).length?ogSel('rang',ogRangOpts(f,c),g.rang,'Rang','— aucun —'):''}
      ${ogTxt('role',g.role,'Rôle','ex. Bailli de France, Doyen')}
      ${ogSel('sup',ogSupOpts(f,g.cid||g.k),g.sup,f.titres?'Supérieur (hors titres)':'Supérieur','— aucun —')}
      ${ogTxt('note',g.note,'Note')}
      <div class="muted small">${ex?'Membre sans fiche personnage, gardé sur la fiche de l\'organisation.':'Inscrit dans la Situation du personnage (Organisations).'}${f.titres?' Les titres se saisissent avec « + Titre ».':''}</div>${ogFoot(g,'fiOMemSave',g.k?'fiOMemDel':'')}`);}
  if(g.kind==='fiOSit'){const c=S.chars[g.cid]||null;if(!g.pick&&(!c||!canEditC(c)))return null;const cn=c?esc(fiCN(c)):'';
    if(g.k==='titres'){const T=ogTOrgs().filter(fiSee),o=S.fiches[g.tf]||(T.length===1?T[0]:null);
      if(!T.length&&!g.i)return fiShell(g,'Titre',`<h2>Ajouter : titre</h2><div class="muted small">${cn}</div>${ogTxt('nom',g.nom,'Titre')}${ogTxt('note',g.note,'Note')}<div class="muted small">Aucune organisation à titres (case « Titres cumulables » des rangs internes, ex. Monarchie) : titre en texte libre.</div>${ogFoot(g,'fiOSitSave',g.i?'fiOSitDel':'')}`);
      const L=fiSort(fiAll().filter(x=>x.genre==='lieu'&&fiSee(x))).map(x=>[x.id,fiPath(x).filter(fiSee).map(p=>p.nom).concat([x.nom]).join(' › ')]);
      return fiShell(g,'Titre',`<h2>${g.i?'Modifier : titre':'Ajouter : titre'}</h2><div class="muted small">${cn}</div>
        ${g.pick?ogSel('cid',ogCh(),g.cid,'Personnage','— choisir —',true):''}
        ${T.length>1?ogSel('tf',T.map(x=>[x.id,x.nom]),g.tf,'Organisation','— choisir —',true):''}
        ${o?ogSel('rang',ogRangOpts(o,c),g.rang,'Titre','— choisir —'):''}
        ${g.i&&!g.rang&&g.nom?`<div class="muted small">Ancien texte : « ${esc(g.nom)} »</div>`:''}
        ${ogSel('dlid',L,g.dlid,'Domaine','— aucun (texte libre) —',true)}${g.dlid?'':ogTxt('dnom',g.dnom,'Ou domaine en texte libre','ex. Sèvres')}
        ${ogSel('scid',ogCh().filter(x=>!c||x[0]!==c.id),g.scid,'Suzerain','— aucun (texte libre) —',true)}${g.scid?'':ogTxt('snom',g.snom,'Ou suzerain en texte libre')}
        ${ogTxt('note',g.note,'Note')}<div class="muted small">Forme du titre selon le genre du personnage. Un titre vaut appartenance à ${o?esc(o.nom):'l\'organisation'}.</div>${ogFoot(g,'fiOSitSave',g.i?'fiOSitDel':'')}`);}
    const L=ogOrgs().filter(fiSee).map(x=>[x.id,fiPath(x).filter(fiSee).map(p=>p.nom).concat([x.nom]).join(' › ')]),o=g.oid&&S.fiches[g.oid];
    if(!c)return null;
    return fiShell(g,'Organisation',`<h2>${g.i?'Modifier : organisation':'Ajouter : organisation'}</h2><div class="muted small">${cn}</div>
      ${L.length?ogSel('oid',L,g.oid,'Fiche','— aucune (texte libre) —',true):''}${o?'':ogTxt('nom',g.nom,L.length?'Ou en texte libre':'Nom')}
      ${o&&!o.titres&&ogRangs(o).length?ogSel('rang',ogRangOpts(o,c),g.rang,'Rang','— aucun —'):''}
      ${o&&o.titres?'<div class="muted small">Rangs de cette organisation : saisis comme titres (Situation › Titres).</div>':''}
      ${ogTxt('role',g.role,'Rôle','ex. Doyen, Bailli de France')}
      ${o?ogSel('sup',ogSupOpts(o,c.id),g.sup,'Supérieur','— aucun —'):''}
      ${ogTxt('note',g.note,'Note')}${ogFoot(g,'fiOSitSave',g.i?'fiOSitDel':'')}`);}
  return null;}
/* Écrit une ligne de Situation d'un personnage */
function ogSetSitu(cid,k,id,v){return fi6SetC(cid,n=>{const s=n.situ={...(n.situ||{})},L=(s[k]||[]).slice(),i=id?L.findIndex(e=>e.id===id):-1;
  if(v===null){if(i>=0)L.splice(i,1);}else if(i>=0)L[i]=v;else L.push(v);s[k]=L;});}
const ogClean=v=>{for(const k of Object.keys(v))if(v[k]===''||v[k]==null)delete v[k];return v;};
function ogAct(a,d){const f=S.fi&&S.fiches[S.fi],g=S.dlg;
  if(a==='fiOTab'){S.fiTab=d.v==='pres'?'':d.v;render();return true;}
  if(a==='fiOView'){S.ogView=d.v;render();return true;}
  if(a==='fiOFold'){S.ogFold={...S.ogFold,[d.k]:!S.ogFold[d.k]};render();return true;}
  if(a==='fiOOpen'){S.ogOpen={...S.ogOpen,[d.k]:!S.ogOpen[d.k]};render();return true;}
  if(S.visit)return true;
  /* Situation d'un personnage : Organisations et Titres */
  if(a==='situEd'){const c=S.chars[S.sel];if(!c||!canEditC(c))return true;const e=d.i&&((c.situ||{})[d.k]||[]).find(x=>x.id===d.i);if(d.i&&!e)return true;
    if(d.k==='titres'){const x=e&&ogTitles(c).find(y=>y.t.id===e.id);fiOpenDlg({kind:'fiOSit',cid:c.id,k:'titres',i:e?e.id:'',tf:x?x.o.id:(e&&e.f)||'',rang:x?x.r.id:'',nom:e?e.nom:'',dlid:e&&e.dom&&e.dom.f||'',dnom:e&&e.dom&&!e.dom.f?e.dom.nom||'':'',scid:e&&e.suz&&e.suz.id||'',snom:e&&e.suz&&!e.suz.id?e.suz.nom||'':'',note:e?e.note||'':'',err:''});}
    else{const o=e&&e.f&&S.fiches[e.f],r=o&&ogLineR(o,e);fiOpenDlg({kind:'fiOSit',cid:c.id,k:'orgs',i:e?e.id:'',oid:o?o.id:'',nom:e&&!o?e.nom:'',rang:r&&!o.titres?r.id:'',role:e?(r&&!e.rang&&!o.titres?'':e.role||''):'',sup:e&&e.sup&&e.sup.id||'',note:e?e.note||'':'',err:''});}
    render();return true;}
  const err=t=>{g.err=t;S._fiRedraw=true;render();return true;};
  if(a==='fiOSitSave'||a==='fiOSitDel'){if(!g||g.kind!=='fiOSit')return true;const c=S.chars[g.cid];if(!c)return err('Choisis un personnage.');if(g.pick?!vis(c):!canEditC(c))return true;
    if(a==='fiOSitDel'){if(!g.conf){g.conf=true;S._fiRedraw=true;render();return true;}ogSetSitu(c.id,g.k,g.i,null);S.dlg=null;render();return true;}
    const old=g.i&&((c.situ||{})[g.k]||[]).find(x=>x.id===g.i);
    if(g.k==='titres'){const T=ogTOrgs().filter(fiSee),o=S.fiches[g.tf]||(T.length===1?T[0]:null),r=o&&ogRById(o,g.rang);
      let v;if(r){const dl=g.dlid&&S.fiches[g.dlid],dn=(g.dnom||'').trim(),sc=g.scid&&S.chars[g.scid],sn=(g.snom||'').trim();
        const dom=dl?{f:dl.id,nom:dl.nom}:dn?{nom:dn}:null,suz=sc?{id:sc.id}:sn?{nom:sn}:null;
        v=ogClean({...(old||{}),id:g.i||uid('s'),date:(old&&old.date)||today(),f:o.id,rang:r.id,nom:ogRL(r,c)+(dom?' de '+dom.nom:''),dom,suz,note:(g.note||'').trim()});}
      else{const nom=(g.nom||'').trim();if(!nom)return err(T.length?'Choisis un titre.':'Le titre est obligatoire.');if(T.length&&!g.i)return err('Choisis un titre.');v=ogClean({...(old||{}),id:g.i||uid('s'),date:(old&&old.date)||today(),nom,note:(g.note||'').trim()});}
      ogSetSitu(c.id,'titres',g.i,v);S.dlg=null;render();setTimeout(()=>toast('Enregistré'),0);return true;}
    const o=g.oid&&S.fiches[g.oid],nom=o?o.nom:(g.nom||'').trim();if(!nom)return err('Choisis une fiche ou écris un nom.');
    if(o&&!g.i&&((c.situ||{}).orgs||[]).some(e=>e.f===o.id))return err('Déjà membre de cette organisation.');
    const sc=o&&g.sup&&S.chars[g.sup];
    const v=ogClean({...(old||{}),id:g.i||uid('s'),date:(old&&old.date)||today(),nom,f:o?o.id:'',rang:o&&!o.titres&&ogRById(o,g.rang)?g.rang:'',role:(g.role||'').trim(),sup:sc?{id:sc.id}:null,note:(g.note||'').trim()});
    ogSetSitu(c.id,'orgs',g.i,v);S.dlg=null;render();setTimeout(()=>toast('Enregistré'),0);return true;}
  /* Fiche Organisation */
  if(a==='fiORangs'){if(!fiCanEd(f))return true;fiOpenDlg({kind:'fiORangs',fid:f.id,R:clone(ogRangs(f)),titres:!!f.titres,err:''});render();return true;}
  if(a==='fiORAdd'||a==='fiORX'||a==='fiORMv'){if(!g||g.kind!=='fiORangs')return true;const R=g.R,i=+d.i;
    if(a==='fiORAdd')R.push({id:fiRid('r'),m:'',f:'',note:''});else if(a==='fiORX')R.splice(i,1);else{const j=i+(+d.d);if(j>=0&&j<R.length)[R[i],R[j]]=[R[j],R[i]];}
    S._fiRedraw=true;render();return true;}
  if(a==='fiORSave'){const x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const R=g.R.map(r=>ogClean({id:r.id,m:(r.m||'').trim(),f:(r.f||'').trim(),note:(r.note||'').trim()})).filter(r=>r.m);
    if(new Set(R.map(r=>nrm(r.m))).size<R.length)return err('Deux rangs portent le même nom.');const n=clone(x);n.rangs=R;n.titres=!!g.titres;if(!n.titres)delete n.titres;S.dlg=null;fiSave(n);return true;}
  if(a==='fiORel'){if(!fiCanEd(f))return true;const y=d.i&&(f.rel||[]).find(z=>z.id===d.i);fiOpenDlg({kind:'fiORel',fid:f.id,i:y?y.id:'',oid:y?y.f||'':'',lab:y?y.lab||'':'',note:y?y.note||'':'',recip:true,err:''});render();return true;}
  if(a==='fiORelLab'){if(g&&g.kind==='fiORel'){g.lab=d.v;S._fiRedraw=true;render();}return true;}
  if(a==='fiORelSave'||a==='fiORelDel'){const x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const n=clone(x);n.rel=(n.rel||[]).slice();const cur=g.i&&n.rel.find(y=>y.id===g.i);
    if(a==='fiORelDel'){if(!g.conf){g.conf=true;S._fiRedraw=true;render();return true;}n.rel=n.rel.filter(y=>y.id!==g.i);const o2=cur&&cur.f&&S.fiches[cur.f];
      if(o2&&fiCanEd(o2)&&(o2.rel||[]).some(y=>y.f===x.id)){const m=clone(o2);m.rel=m.rel.filter(y=>y.f!==x.id);fiSave(m,true);}S.dlg=null;fiSave(n);return true;}
    const o2=g.oid&&S.fiches[g.oid];if(!o2)return err('Choisis une organisation.');const lab=(g.lab||'').trim();if(!lab)return err('Écris une étiquette (ex. ennemis).');
    const v={f:o2.id,nom:o2.nom,lab,note:(g.note||'').trim()};
    if(cur)Object.assign(cur,v);else{if(n.rel.some(y=>y.f===o2.id))return err('Une relation avec cette organisation existe déjà.');n.rel.push({id:uid('r'),...v});
      if(g.recip&&fiCanEd(o2)&&!(o2.rel||[]).some(y=>y.f===x.id)){const m=clone(o2);m.rel=(m.rel||[]).concat([{id:uid('r'),f:x.id,nom:x.nom,lab,note:v.note}]);fiSave(m,true);}}
    S.dlg=null;fiSave(n);return true;}
  if(a==='fiOLieu'){if(!fiCanEd(f))return true;fiOpenDlg({kind:'fiOLieu',fid:f.id,lid:'',note:'',err:''});render();return true;}
  if(a==='fiOLieuSave'){const x=g&&S.fiches[g.fid],l=g&&g.lid&&S.fiches[g.lid];if(!x||!fiCanEd(x))return true;if(!l||!fiCanEd(l))return err('Choisis un lieu.');
    const m=clone(l);m.orgs=(m.orgs||[]).concat([ogClean({id:uid('o'),f:x.id,nom:x.nom,note:(g.note||'').trim()})]);S.dlg=null;fiSave(m);return true;}
  if(a==='fiOLieuX'){const l=S.fiches[d.l];if(!f||!fiCanEd(f)||!l||!fiCanEd(l))return true;const m=clone(l);m.orgs=(m.orgs||[]).filter(y=>y.id!==d.i);fiSave(m);return true;}
  if(a==='fiOEyeM'){if(!f||!isGest())return true;const H=new Set(f.mhid||[]),open=H.has(d.k);if(!open&&!canEdit())return true;if(open)H.delete(d.k);else H.add(d.k);const n=clone(f);n.mhid=[...H];if(!n.mhid.length)delete n.mhid;fiSave(n);return true;}
  if(a==='fiOTit'){if(!fiCanEd(f)||!f.titres)return true;fiOpenDlg({kind:'fiOSit',pick:true,cid:'',k:'titres',i:'',tf:f.id,rang:'',nom:'',dlid:'',dnom:'',scid:'',snom:'',note:'',err:''});render();return true;}
  if(a==='fiOMem'){if(!fiCanEd(f))return true;let v={kind:'fiOMem',fid:f.id,k:d.k||'',cid:'',nom:'',rang:'',role:'',sup:'',note:'',err:''};
    if(d.k&&d.k.startsWith('x:')){const x=(f.mbx||[]).find(y=>'x:'+y.id===d.k);if(!x)return true;Object.assign(v,{nom:x.nom,rang:x.rang||'',role:x.role||'',sup:x.sup&&x.sup.id||'',note:x.note||''});}
    else if(d.k){const c=S.chars[d.k],e=c&&((c.situ||{}).orgs||[]).find(y=>y.f===f.id);if(!e)return true;const r=ogLineR(f,e);Object.assign(v,{cid:c.id,rang:r&&!f.titres?r.id:'',role:r&&!e.rang&&!f.titres?'':e.role||'',sup:e.sup&&e.sup.id||'',note:e.note||''});}
    fiOpenDlg(v);render();return true;}
  if(a==='fiOMemSave'||a==='fiOMemDel'){const x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const ex=g.k&&g.k.startsWith('x:');
    if(a==='fiOMemDel'&&!g.conf){g.conf=true;S._fiRedraw=true;render();return true;}
    const sc=g.sup&&S.chars[g.sup],rang=!x.titres&&ogRById(x,g.rang)?g.rang:'';
    if(ex||(!g.k&&!g.cid)){const n=clone(x);n.mbx=(n.mbx||[]).slice();const id=ex?g.k.slice(2):'';const i=n.mbx.findIndex(y=>y.id===id);
      if(a==='fiOMemDel'){n.mbx.splice(i,1);n.mhid=(n.mhid||[]).filter(k=>k!==g.k);S.dlg=null;fiSave(n);return true;}
      const nom=(g.nom||'').trim();if(!nom)return err('Choisis un personnage ou écris un nom.');
      const v=ogClean({id:id||uid('m'),nom,rang,role:(g.role||'').trim(),sup:sc?{id:sc.id}:null,note:(g.note||'').trim()});if(i>=0)n.mbx[i]=v;else n.mbx.push(v);S.dlg=null;fiSave(n);return true;}
    const c=S.chars[g.cid||g.k];if(!c||!vis(c))return err('Choisis un personnage.');const e=((c.situ||{}).orgs||[]).find(y=>y.f===x.id);
    if(a==='fiOMemDel'){if(e)ogSetSitu(c.id,'orgs',e.id,null);S.dlg=null;render();return true;}
    if(!g.k&&e)return err('Déjà membre de cette organisation.');
    const v=ogClean({...(e||{}),id:e?e.id:uid('s'),date:(e&&e.date)||today(),nom:x.nom,f:x.id,rang,role:(g.role||'').trim(),sup:sc?{id:sc.id}:null,note:(g.note||'').trim()});
    ogSetSitu(c.id,'orgs',e&&e.id,v);S.dlg=null;render();setTimeout(()=>toast('Membre enregistré'),0);return true;}
  return true;}
/* Saisies propres aux fenêtres d'organisation : lignes des rangs, listes qui redessinent la fenêtre */
document.addEventListener('input',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.ogr===undefined||!S.dlg||S.dlg.kind!=='fiORangs')return;const [i,k]=t.dataset.ogr.split('|');const r=S.dlg.R[+i];if(r)r[k]=t.value;});
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.ogre===undefined||!S.dlg||!/^fiO/.test(S.dlg.kind))return;S.dlg[t.dataset.fin]=t.value;if((t.dataset.fin==='cid'&&S.dlg.kind==='fiOMem')||t.dataset.fin==='oid'){S.dlg.sup='';S.dlg.rang='';}S._fiRedraw=true;render();});

/* ---------- Lot 5 b (26/11/2026) : Familles ----------
   Fiche famille : type Majeure / Mineure / Branche (réservés) ; parent = suzerain (vassale) ou famille mère (branche) ; suzT (suzerain en texte) ;
   devise, race (nom de race), speci (spécificité), terr (territoires), vasx [{id, nom}] (vassales sans fiche),
   mbx [{id, nom, note}] (membres en texte), mhid [clé] (membres masqués). Personnage : situ.familles [{id, nom, f, note}].
   Une branche fait partie de sa famille mère (ses membres en sont membres) ; une vassale non. */
FI6_EYE.famille=['terr','mem','vas'];
FI_RES.famille=['Majeure','Mineure','Branche'];
['faMem','faVas'].forEach(k=>FI_DLG.add(k));
const faIsBr=f=>!!f&&f.genre==='famille'&&nrm(f.type)==='branche';
/* Familles dont une fiche fait pleinement partie : remonte les branches */
function faUp(f){const out=[];let x=f,n=0;while(faIsBr(x)&&x.parent&&n++<20){x=S.fiches[x.parent];if(!x||x.genre!=='famille'||out.includes(x))break;out.push(x);}return out;}
/* Branches d'une famille (et branches de ses branches) */
function faBrs(f,seen){seen=seen||new Set([f.id]);const out=[];for(const k of fiSort(fiKidsOf(f.id).filter(x=>faIsBr(x)&&!seen.has(x.id)))){seen.add(k.id);out.push(k,...faBrs(k,seen));}return out;}
const faKidOrd=K=>fiSort(K.filter(faIsBr)).concat(fiSort(K.filter(x=>!faIsBr(x))));
function faListSub(f,K){const p=f.parent&&S.fiches[f.parent];if(faIsBr(f))return p?'Branche':(f.type||'');const b=K.filter(faIsBr).length,v=K.length-b;
  return [p||(f.suzT||'').trim()?(f.type?f.type+' · ':'')+'vassale':(f.type||''),b?b+' branche'+(b>1?'s':''):'',v?v+' vassale'+(v>1?'s':''):''].filter(Boolean).join(' · ');}
function faSub(f){const p=f.parent&&S.fiches[f.parent];
  if(p)return [(faIsBr(f)?'branche de ':'vassale de ')+(fiSee(p)?lk({t:'fiche',id:p.id},p.nom):`<span class="nolk">${esc(p.nom)}</span>`)];
  return (f.suzT||'').trim()?['vassale de '+esc(f.suzT.trim())]:[];}
function faHeadKv(f){const R=f.race&&typeof RACES!=='undefined'&&RACES[f.race],L=[];
  if((f.devise||'').trim())L.push(['Devise',`<i>« ${esc(f.devise.trim())} »</i>`]);
  if(f.race)L.push(['Race dominante',R&&R.cre?lk({t:'race',id:R.cre},f.race):esc(f.race)]);
  if((f.speci||'').trim())L.push(['Spécificité',esc(f.speci.trim())]);
  return L.length?`<div class="fakv">${L.map(([a,b])=>`<span class="muted">${a}</span><span>${b}</span>`).join('')}</div>`:'';}
function faHeadFields(g){const R=typeof pnRaces==='function'?pnRaces():[];
  return `${ogTxt('suzT',g.suzT,'Ou suzerain en texte (sans fiche)','ex. famille hors de l\'appli')}${ogTxt('devise',g.devise,'Devise')}
    <div class="field"><label for="og-race">Race dominante</label><select id="og-race" data-fin="race"><option value="">— aucune —</option>${R.concat(g.race&&!R.includes(g.race)?[g.race]:[]).map(r=>`<option value="${esc(r)}"${r===g.race?' selected':''}>${esc(r)}</option>`).join('')}</select></div>
    ${ogTxt('speci',g.speci,'Spécificité','ex. pouvoir et ambition')}<div class="muted small">Type « Branche » : ses membres font partie de la famille mère. Type « Mineure » rattaché à une famille : vassale (ses membres n'en font pas partie).</div>`;}
function faHeadApply(n,g){for(const k of ['devise','race','speci','suzT']){const v=(g[k]||'').trim();if(v)n[k]=v;else delete n[k];}if(n.parent)delete n.suzT;}
/* Membres : Situation › Familles reliée à la fiche ou à l'une de ses branches, puis membres en texte */
function faMembers(f,all){const G=isGest(),hid=new Set(f.mhid||[]),M=new Set(),out=[];
  for(const b of [f,...faBrs(f).filter(fiSee)])for(const c of Object.values(S.chars||{})){if(M.has(c.id)||!vis(c)||!fi6CSee(c,'familles'))continue;
    const e=((c.situ||{}).familles||[]).find(y=>y.f===b.id);if(!e)continue;M.add(c.id);out.push({key:c.id,c,e,br:b===f?null:b,hid:hid.has(c.id)});}
  for(const x of f.mbx||[])out.push({key:'x:'+x.id,x,br:null,hid:hid.has('x:'+x.id)});
  const nm=m=>m.c?fiCN(m.c):m.x.nom;
  return out.filter(m=>all||G||!m.hid).sort((a,b)=>nm(a).localeCompare(nm(b),'fr',{sensitivity:'base'}));}
function faMRow(f,m){const G=isGest(),ed=fiCanEd(f),c=m.c,nm=c?fiCN(c):m.x.nom,name=c?(vis(c)?lk({t:'perso',id:c.id},nm):`<b>${esc(nm)}</b>`):`<b>${esc(nm)}</b>`;
  const oth=c?((c.situ||{}).familles||[]).map(y=>y.f&&S.fiches[y.f]).filter(x=>x&&x.id!==f.id&&!(m.br&&x.id===m.br.id)&&fiSee(x)&&!faUp(x).some(u=>u.id===f.id)).map(x=>'aussi '+esc(x.nom)):[];
  const note=(m.e||m.x||{}).note,sub=(note?[esc(note)]:[]).concat(oth);
  return `<div class="srow ogm${m.hid?' fihid':''}"><span class="ogmn"><span>${name}${c&&c.type==='PJ'?' <span class="tag2">PJ</span>':''}${sub.length?`<span class="d">${sub.join(' · ')}</span>`:''}</span></span>`
    +(ed&&!m.br?`<button type="button" class="ibtn" data-act="faMem" data-k="${esc(m.key)}" aria-label="Modifier ${esc(nm)}">✎</button>`:'')
    +(G?eyeBtn('fiOEyeM',`data-k="${esc(m.key)}"`,!m.hid,'Membre '+nm):'')+`</div>`;}
function faBlocks(f){const G=isGest(),ed=fiCanEd(f),e=fiEyeOf(f),eye=(k,l)=>G?eyeBtn('fiEye',`data-k="${k}"`,!!e[k],l):'',none=x=>`<div class="muted small">${x}</div>`;let h='';
  if(fiBlkSee(f,'terr')){const L=ogLieux(f),t=(f.terr||'').trim();
    if(t||L.length||ed)h+=fiBlk('terr','Territoires',L.length?String(L.length):'',(t?fiRich(f.terr):'')
      +(L.length?`<div class="lab2" style="margin-top:6px">Lieux liés${fi6Calc()}</div>`+L.map(({l,y})=>`<div class="srow"><span>${lk({t:'fiche',id:l.id},l.nom)}${y.note?`<span class="d">${esc(y.note)}</span>`:''}</span>${ed&&fiCanEd(l)?`<button type="button" class="ibtn" data-act="fiOLieuX" data-l="${esc(l.id)}" data-i="${esc(y.id)}" aria-label="Retirer ce lieu">✕</button>`:''}</div>`).join(''):'')
      +(!t&&!L.length?none('Non renseigné.'):'')+(ed?`<div class="radd"><button class="btn" data-act="fiOLieu">+ Lieu</button></div>`:''),{edit:ed?'fiEd':'',ea:' data-b="terr"',hid:G&&!e.terr,eye:eye('terr','Territoires')});}
  if(fiBlkSee(f,'mem')){const L=faMembers(f),D=L.filter(m=>!m.br),grs=[];if(D.length)grs.push({k:'dir',t:f.nom,L:D});
    for(const b of faBrs(f).filter(fiSee)){const R=L.filter(m=>m.br===b);if(R.length)grs.push({k:'b'+b.id,t:'Branche · '+b.nom,L:R});}
    const body=!L.length?none('Aucun membre pour l\'instant.'):grs.length===1&&grs[0].k==='dir'?D.map(m=>faMRow(f,m)).join(''):grs.map(g=>ogGrp(f,g,g.L.map(m=>faMRow(f,m)).join(''))).join('');
    h+=fiBlk('mem','Membres'+fi6Calc(),L.length?String(L.length):'',body+(ed?`<div class="radd"><button class="btn" data-act="faMem" data-k="">+ Membre</button></div>`:'')
      +`<div class="muted small" style="margin-top:4px">Repris de la Situation des personnages${faBrs(f).length?', branches comprises':''} ; les membres des familles vassales n'en font pas partie.</div>`,{hid:G&&!e.mem,eye:eye('mem','Membres')});}
  if(fiBlkSee(f,'vas')){const K=fiKidsOf(f.id).filter(x=>x.genre==='famille'&&fiSee(x)),Br=fiSort(K.filter(faIsBr)),V=fiSort(K.filter(x=>!faIsBr(x))),X=f.vasx||[];
    if(K.length||X.length||ed){const row=x=>{const n=faMembers(x).length;return `<div class="srow"><span>${lk({t:'fiche',id:x.id},x.nom)}${x.type&&!faIsBr(x)?` <span class="muted">· ${esc(x.type)}</span>`:''}${x.vis!=='rev'?' <span class="tag2">préparée</span>':''}</span><span class="muted small">${n} membre${n>1?'s':''}</span></div>`;};
      let b='';if(Br.length)b+='<div class="lab2">Branches</div>'+Br.map(row).join('');if(V.length)b+='<div class="lab2">Vassales</div>'+V.map(row).join('');
      if(X.length)b+='<div class="lab2">Vassales sans fiche</div>'+X.map(x=>`<div class="srow"><span><b>${esc(x.nom)}</b></span>${ed?`<span style="display:flex;gap:4px">${fiCanNew()?`<button type="button" class="btn ghost ui-xs" data-act="faVasF" data-i="${esc(x.id)}">+ Fiche</button>`:''}<button type="button" class="ibtn" data-act="faVasX" data-i="${esc(x.id)}" aria-label="Retirer ${esc(x.nom)}">✕</button></span>`:''}</div>`).join('');
      h+=fiBlk('vas','Vassales et branches'+fi6Calc(),K.length+X.length?String(K.length+X.length):'',(b||none('Aucune.'))
        +(ed?`<div class="radd"><button class="btn" data-act="fiNew" data-g="famille">+ Nouvelle famille rattachée</button> <button class="btn" data-act="faVas">+ Nom sans fiche</button></div><div class="muted small" style="margin-top:4px">« + Fiche » crée la famille (Mineure, vassale de ${esc(f.nom)}) et retire le nom de la liste.</div>`:''),{hid:G&&!e.vas,eye:eye('vas','Vassales et branches')});}}
  return h;}
/* Situation › Familles : lignes saisies, puis familles mères des branches (ligne calculée) */
function faSitRows(c){const E=canEditC(c),L=(c.situ||{}).familles||[],have=new Set(L.map(e=>e.f).filter(Boolean));
  const rows=L.map(e=>{const x=e.f&&S.fiches[e.f];return `<div class="srow"><span>${situNm(e)}${x&&faIsBr(x)&&fiSee(x)?' <span class="tag2">Branche</span>':''}${e.note?`<span class="d">${esc(e.note)}</span>`:''}</span>${srcChip('jeu')}${E?`<button type="button" class="ibtn" data-act="situEd" data-k="familles" data-i="${esc(e.id)}" aria-label="Modifier ${esc(e.nom||'')}">✎</button>`:''}</div>`;});
  for(const e of L){const x=e.f&&S.fiches[e.f];for(const u of faUp(x))if(!have.has(u.id)){have.add(u.id);if(fiSee(u))rows.push(`<div class="srow"><span>${lk({t:'fiche',id:u.id},u.nom)} <span class="muted">· par sa branche</span></span></div>`);}}
  return rows;}
/* ---------- Fenêtres et actions ---------- */
function faSheet(g){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;
  if(g.kind==='faVas')return fiShell(g,'Vassale sans fiche',`<h2>Vassale sans fiche</h2><div class="muted small">${esc(f.nom)}</div>${ogTxt('nom',g.nom,'Nom')}<div class="muted small">Famille vassale qui n'a pas (encore) de fiche.</div>${ogFoot(g,'faVasSave')}`);
  if(g.kind==='faMem'){const ex=g.k&&g.k.startsWith('x:'),edC=g.k&&!ex,c=g.cid&&S.chars[g.cid];
    return fiShell(g,'Membre',`<h2>${g.k?'Membre':'Nouveau membre'}</h2><div class="muted small">${esc(f.nom)}</div>
      ${edC?`<div class="field"><label>Personnage</label><div class="inp ro">${esc(c?fiCN(c):'')}</div></div>`:ex?'':ogSel('cid',ogCh(),g.cid,'Personnage','— aucun (texte libre) —',true)}
      ${ex||!g.cid?ogTxt('nom',g.nom,ex?'Nom':'Ou en texte libre'):''}${ogTxt('note',g.note,'Note')}
      <div class="muted small">${ex||(!g.k&&!g.cid)?'Membre sans fiche personnage, gardé sur la fiche de la famille.':'Inscrit dans la Situation du personnage (Familles).'}</div>${ogFoot(g,'faMemSave',g.k?'faMemDel':'')}`);}
  return null;}
function faAct(a,d){const f=S.fi&&S.fiches[S.fi],g=S.dlg;if(S.visit)return true;
  const err=t=>{g.err=t;S._fiRedraw=true;render();return true;};
  if(a==='faVas'){if(!fiCanEd(f))return true;fiOpenDlg({kind:'faVas',fid:f.id,nom:'',err:''});render();return true;}
  if(a==='faVasSave'){const x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const nom=(g.nom||'').trim();if(!nom)return err('Écris un nom.');
    if((x.vasx||[]).some(y=>nrm(y.nom)===nrm(nom))||fiKidsOf(x.id).some(y=>nrm(y.nom)===nrm(nom)))return err('Déjà dans la liste.');
    const n=clone(x);n.vasx=(n.vasx||[]).concat([{id:uid('v'),nom}]);S.dlg=null;fiSave(n);return true;}
  if(a==='faVasX'){if(!fiCanEd(f))return true;const n=clone(f);n.vasx=(n.vasx||[]).filter(y=>y.id!==d.i);if(!n.vasx.length)delete n.vasx;fiSave(n);return true;}
  if(a==='faVasF'){if(!fiCanEd(f)||!fiCanNew())return true;const y=(f.vasx||[]).find(z=>z.id===d.i);if(!y)return true;const now=new Date().toISOString(),rev=canEdit()?f.vis==='rev':true;
    const nf={id:fiRid('f-'),genre:'famille',nom:y.nom,type:'Mineure',parent:f.id,kanka:'',vis:rev?'rev':'prep',eye:Object.fromEntries(['desc','sait'].concat(FI6_EYE.famille).map(k=>[k,rev])),desc:'',sait:[],notes:'',par:ME||'',cree:now,modif:now};
    const n=clone(f);n.vasx=n.vasx.filter(z=>z.id!==y.id);if(!n.vasx.length)delete n.vasx;fiSave(nf,true);fiSave(n);setTimeout(()=>toast('Fiche créée : '+y.nom),0);return true;}
  if(a==='faMem'){if(!fiCanEd(f))return true;const v={kind:'faMem',fid:f.id,k:d.k||'',cid:'',nom:'',note:'',err:''};
    if(d.k&&d.k.startsWith('x:')){const x=(f.mbx||[]).find(y=>'x:'+y.id===d.k);if(!x)return true;v.nom=x.nom;v.note=x.note||'';}
    else if(d.k){const c=S.chars[d.k],e=c&&((c.situ||{}).familles||[]).find(y=>y.f===f.id);if(!e)return true;v.cid=c.id;v.note=e.note||'';}
    fiOpenDlg(v);render();return true;}
  if(a==='faMemSave'||a==='faMemDel'){const x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const ex=g.k&&g.k.startsWith('x:');
    if(a==='faMemDel'&&!g.conf){g.conf=true;S._fiRedraw=true;render();return true;}
    if(ex||(!g.k&&!g.cid)){const n=clone(x);n.mbx=(n.mbx||[]).slice();const id=ex?g.k.slice(2):'',i=n.mbx.findIndex(y=>y.id===id);
      if(a==='faMemDel'){if(i>=0)n.mbx.splice(i,1);n.mhid=(n.mhid||[]).filter(k=>k!==g.k);if(!n.mhid.length)delete n.mhid;if(!n.mbx.length)delete n.mbx;S.dlg=null;fiSave(n);return true;}
      const nom=(g.nom||'').trim();if(!nom)return err('Choisis un personnage ou écris un nom.');const v=ogClean({id:id||uid('m'),nom,note:(g.note||'').trim()});if(i>=0)n.mbx[i]=v;else n.mbx.push(v);S.dlg=null;fiSave(n);return true;}
    const c=S.chars[g.cid||g.k];if(!c||!vis(c))return err('Choisis un personnage.');const L=(c.situ||{}).familles||[],e=L.find(y=>y.f===x.id);
    if(a==='faMemDel'){if(e)ogSetSitu(c.id,'familles',e.id,null);S.dlg=null;render();return true;}
    if(!g.k&&e)return err('Déjà membre de cette famille.');
    const base=e||L.find(y=>!y.f&&nrm(y.nom)===nrm(x.nom)); /* ligne en texte du même nom : reliée */
    const v=ogClean({...(base||{}),id:base?base.id:uid('s'),date:(base&&base.date)||today(),nom:x.nom,f:x.id,note:(g.note||'').trim()});
    ogSetSitu(c.id,'familles',base&&base.id,v);S.dlg=null;render();setTimeout(()=>toast('Membre enregistré'),0);return true;}
  return true;}
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.ogre===undefined||!S.dlg||S.dlg.kind!=='faMem')return;S.dlg[t.dataset.fin]=t.value;S._fiRedraw=true;render();});
