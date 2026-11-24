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
  perso:'<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/>'
};
/* Genres de fiche */
const FI_G={
  lieu:{pl:'Lieux',un:'lieu',nv:'Nouveau lieu',cnt:n=>n+' lieu'+(n>1?'x':''),arbo:true,par:'Lieu parent',sub:'lieu contenu',tl:'Types de lieu'},
  org:{pl:'Organisations',un:'organisation',nv:'Nouvelle organisation',cnt:n=>n+' organisation'+(n>1?'s':''),arbo:true,par:'Organisation parente',sub:'organisation contenue',tl:"Types d'organisation"},
  famille:{pl:'Familles',un:'famille',nv:'Nouvelle famille',cnt:n=>n+' famille'+(n>1?'s':''),tl:'Types de famille'},
  objet:{pl:'Objets',un:'objet',nv:'Nouvel objet',cnt:n=>n+' objet'+(n>1?'s':''),tl:"Types d'objet"}
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
  fiBigDel(ill);}

/* ---------- Types (listes de valeurs calculées à partir des fiches) ---------- */
function fiTypes(g,all){if(g==='jour')return jrTypes();const m={};for(const f of fiAll())if(f.genre===g&&(all||fiSee(f))){const t=(f.type||'').trim();if(t)m[t]=(m[t]||0)+1;}
  return Object.entries(m).sort((a,b)=>a[0].localeCompare(b[0],'fr',{sensitivity:'base'}));}
function fiTypApply(g,from,to){to=(to||'').trim();if(!to||to===from)return;
  if(g==='jour'){for(const j of jrAll())if(j.genre==='journal'&&(j.type||'').trim()===from){const n=clone(j);n.type=to;jrSave(n,true);}render();return;}
  for(const f of fiAll())if(f.genre===g&&(f.type||'').trim()===from){const n=clone(f);n.type=to;fiSave(n,true);}render();}

/* ---------- Textes : jetons « @ », lecture et éditeur ---------- */
const FI_TOK=/@\[(perso|race|secret|fiche):([^|\]]+)\|([^\]]*)\]/g;
const fiTokObj=(t,id)=>t==='secret'?{t:'secret',n:+id}:{t,id};
function fiTokName(t,id){
  if(t==='perso'){const c=S.chars[id];return c?(c.court||c.nom):'';}
  if(t==='race'){const cr=crById(id);return cr?raceNm(raceRec(cr)):'';}
  if(t==='secret'){const s=secById(+id);return s?secLabel(s):'';}
  if(t==='fiche'){const f=S.fiches[id];return f?f.nom:'';}
  return '';}
const fiTokClean=s=>String(s||'').replace(/[\]|\n]/g,' ').trim();
function fiInline(s){let out='',last=0;s=String(s||'');
  s.replace(FI_TOK,(m,t,id,nom,i)=>{out+=esc(s.slice(last,i));const o=fiTokObj(t,id);out+=lnkOk(o)?lk(o,fiTokName(t,id)||nom):`<span class="nolk">${esc(nom)}</span>`;last=i+m.length;return m;});
  return out+esc(s.slice(last));}
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
    if(isGest()&&fiHas(F.notes,t,id))hits.push('Notes MJ');
    if(t==='fiche'&&F.parent===id)hits.push((FI_G[F.genre]||{}).sub||'fiche contenue');
    if(hits.length)out.push({grp:ev?'Événements':'Fiches',o:{t:'fiche',id:F.id},nom:F.genre==='evenement'&&(F.num||'').trim()?F.num.trim()+' '+F.nom:F.nom,prec:hits.join(', '),d:ev&&F.debut&&F.debut.a?jrDjIso(F.debut):(F.dj||F.modif||F.cree||'')});}
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
  const npnj=ids().filter(i=>S.chars[i].type==='PNJ').length;
  const row=(act,v,ic,l,sum,bdg)=>`<button type="button" class="pli" data-act="${act}" data-v="${v}"><span class="pic">${FI_SVG(FI_IC[ic])}</span><span class="ptx"><b>${l}${bdg?` <span class="bdg" aria-label="${bdg} en attente">${bdg}</span>`:''}</b><small>${esc(sum)}</small></span><span aria-hidden="true" class="pch">›</span></button>`;
  const grp=(t,rows)=>`<div class="pgrp">${t}</div><div class="plst">${rows.join('')}</div>`;
  return `<h2 style="margin-top:4px">Univers</h2>`
    +grp('Récit',[row('uni','chron','chron','Chronique',chUniSum()),row('uni','secrets','secrets','Secrets',sec,np)]) /* lot 3 */
    +grp('Peuples',[row('uni','creatures','races','Races',rac),row('uni','pouvoirs','pouvoirs','Pouvoirs et capacités',uniPwSum()),row('tab','team','pnj','PNJ',pl(npnj,'PNJ','PNJ')+' · page Personnages'),row('uni','famille','famille','Familles',cnt('famille')),row('uni','org','org','Organisations',cnt('org'))])
    +grp('Lieux et choses',[row('uni','lieu','lieu','Lieux',cnt('lieu')),row('uni','objet','objet','Objets',cnt('objet'))]);}
/* lot 3 : résumé de l'entrée Chronique */
function chUniSum(){if(!S.fichesReady)return 'chargement…';const n=chEvs().length,d=chNow();return (n?n+' événement'+(n>1?'s':''):'aucun événement pour l\'instant')+(d?' · '+chDateTxt(d):'');}
const fiUniBack=()=>`<button class="back" data-act="uni" data-v="home">${FI_BACK}Univers</button>`;

/* ---------- Liste d'un genre : recherche, filtre par type, arborescence ---------- */
function fiListView(g){const Gm=FI_G[g],T=fiTypes(g);if(S.fiTy&&!T.some(t=>t[0]===S.fiTy))S.fiTy='';
  let h=fiUniBack()+`<h2 style="margin-top:2px">${Gm.pl}</h2>`;
  if(!S.fichesReady)return h+`<div class="card empty">Chargement…</div>`;
  h+=`<div class="fisrch"><input type="search" data-fiq="1" value="${esc(S.fiQ)}" placeholder="Rechercher (nom, type)" aria-label="Rechercher dans les ${Gm.pl.toLowerCase()}" autocomplete="off"></div>`;
  if(T.length)h+=`<div class="chips fichips">${[['','Tous']].concat(T.map(t=>[t[0],t[0]])).map(([v,l])=>`<button class="chip" data-act="fiTy" data-v="${esc(v)}" aria-pressed="${(S.fiTy||'')===v}">${esc(l)}</button>`).join('')}</div>`;
  h+=`<div id="fiRes">${fiListBody(g)}</div>`;
  if(fiCanNew())h+=`<button class="btn pri cta" data-act="fiNew" data-g="${g}">+ ${Gm.nv}</button>`;
  return h;}
function fiListBody(g){const Gm=FI_G[g],L=fiAll().filter(f=>f.genre===g&&fiSee(f)),q=nrm(S.fiQ),ty=S.fiTy||'';
  if(!L.length)return `<div class="card empty">Aucune fiche pour l'instant.${fiCanNew()?' Crée la première avec le bouton ci-dessous.':''}</div>`;
  const tag=f=>f.vis!=='rev'?' <span class="tag2">préparé</span>':'';
  const th=f=>{const s=illOf('fiche',f.id);return s?`<img class="illt" src="${s}" alt="" style="width:30px;height:30px">`:`<span class="fiic" aria-hidden="true">${FI_SVG(FI_IC[g],16)}</span>`;};
  const line=(f,sub,depth,tog)=>`<div class="firow${f.vis!=='rev'?' prep':''}" style="padding-left:${6+depth*18}px">${tog||'<span class="fitog0"></span>'}<button type="button" class="fili" data-act="fiOpen" data-id="${esc(f.id)}">${th(f)}<span class="fitx"><b>${esc(f.nom)}${tag(f)}</b><small>${esc(sub)}</small></span></button></div>`;
  if(q||ty||!Gm.arbo){const R=fiSort(L.filter(f=>(!ty||(f.type||'').trim()===ty)&&(!q||nrm(f.nom).includes(q)||nrm(f.type).includes(q))));
    if(!R.length)return `<div class="card empty">Aucune fiche ne correspond.</div>`;
    return `<div class="filst">${R.map(f=>{const p=Gm.arbo?fiPath(f).filter(fiSee).map(x=>x.nom).join(' › '):'';return line(f,[f.type,p].filter(Boolean).join(' · '),0);}).join('')}</div>`;}
  const ids0=new Set(L.map(f=>f.id)),roots=fiSort(L.filter(f=>!f.parent||!ids0.has(f.parent)));
  const rec=(f,depth)=>{const K=fiSort(fiKidsOf(f.id,L)),n=fiDesc(f.id,L),op=S.fiTree[f.id]!=null?S.fiTree[f.id]:false;
    const tog=K.length?`<button type="button" class="fitog" data-act="fiTree" data-id="${esc(f.id)}" aria-expanded="${op}" aria-label="${op?'Replier':'Déplier'} ${esc(f.nom)}">${op?'⌄':'›'}</button>`:'';
    return line(f,[f.type,K.length?n+' contenu'+(n>1?'s':''):''].filter(Boolean).join(' · '),depth,tog)+(op?K.map(k=>rec(k,depth+1)).join(''):'');};
  return `<div class="filst">${roots.map(f=>rec(f,0)).join('')}</div>`;}

/* ---------- La fiche ---------- */
const fiFolded=k=>!!(S.fiFold||{})[k];
function fiBlk(k,title,sum,body,o){o=o||{};const fold=fiFolded(k),id='fb-'+k;
  const ed=o.edit?`<button type="button" class="edl" data-act="${o.edit}"${o.ea||''}>${ICON.crayon} Modifier</button>`:'';
  return `<section class="rblk${o.hid?' fihid':''}"><div class="rbh"><button type="button" class="rbt" data-act="fiFold" data-k="${k}" aria-expanded="${!fold}" aria-controls="${id}"><span class="tt"><span class="t">${title}</span>${sum!==''&&sum!=null?`<span class="n">${sum}</span>`:''}</span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button>${ed}${o.eye||''}</div>${fold?'':`<div class="rbb" id="${id}">${body}</div>`}</section>`;}
function fiFicheView(f){
  const G=isGest(),E=canEdit(),ed=fiCanEd(f),Gm=FI_G[f.genre]||FI_G.lieu,e=fiEyeOf(f);
  let h=`<button class="back" data-act="fiBack">${FI_BACK}${Gm.pl}</button>`;
  if(G){if(f.vis!=='rev')h+=`<div class="fivis prep"><span class="fivi" aria-hidden="true">${EYE_C}</span><span class="fivt"><b>Fiche préparée</b> · invisible des joueurs</span><button class="btn pri" data-act="fiReveal">Révéler</button></div>`;
    else{const n=['desc','sait'].filter(k=>e[k]).length;h+=`<div class="fivis">${eyeBtn('fiEye','data-k="fiche"',true,'Fiche '+f.nom)}<span class="fivt"><b>Fiche révélée</b> · ${n} bloc${n>1?'s':''} sur 2 visible${n>1?'s':''}</span></div>`;}}
  const img=illOf('fiche',f.id),path=fiPath(f);
  const sub=[f.type?esc(f.type):'',path.length?path.map(x=>fiSee(x)?lk({t:'fiche',id:x.id},x.nom):`<span class="nolk">${esc(x.nom)}</span>`).join(' › '):''].filter(Boolean).join(' · ');
  h+=`<div class="card fihead"><div class="fihd">${img?`<button type="button" class="fithumb" data-act="fiImg" data-id="${esc(illId('fiche',f.id))}" aria-label="Agrandir l'image de ${esc(f.nom)}"><img src="${img}" alt=""></button>`:`<span class="fithumb vide" aria-hidden="true">${FI_SVG(FI_IC[f.genre],26)}</span>`}<div style="flex:1;min-width:0"><h2 class="finm">${esc(f.nom)}</h2>${sub?`<div class="muted small">${sub}</div>`:''}</div>${f.kanka?kankaBtn(f.kanka,f.nom,'Fiche Kanka : '+f.nom):''}</div>
    ${ed?`<div style="margin-top:8px"><button type="button" class="edl" data-act="fiHead">${ICON.crayon} Nom, type${Gm.arbo?', '+Gm.par.toLowerCase():''}, image, Kanka</button></div>`:''}</div>`;
  /* Description */
  if(fiBlkSee(f,'desc')&&((f.desc||'').trim()||ed))
    h+=fiBlk('desc','Description','',(f.desc||'').trim()?fiRich(f.desc):'<div class="muted small">Pas encore de description.</div>',{edit:ed?'fiEd':'',ea:' data-b="desc"',hid:G&&!e.desc,eye:G?eyeBtn('fiEye','data-k="desc"',!!e.desc,'Description'):''});
  /* Ce que l'on sait : un œil par élément */
  if(fiBlkSee(f,'sait')){const A=(f.sait||[]),V=A.filter(it=>fiItSee(f,it)),nr=A.filter(it=>it.rev).length;
    if(V.length||ed){const rows=V.map(it=>`<div class="fiit${it.rev?'':' fihid'}"><div class="fiitx">${fiRich(it.txt)}</div>${ed?`<button type="button" class="fiedi" data-act="fiItem" data-i="${esc(it.id)}" aria-label="Modifier l'élément">${ICON.crayon}</button>`:''}${G?eyeBtn('fiEye',`data-k="item" data-i="${esc(it.id)}"`,!!it.rev,"Élément de « Ce que l'on sait »"):''}</div>`).join('');
      h+=fiBlk('sait',"Ce que l'on sait",G?`${nr} / ${A.length} révélé${nr>1?'s':''}`:String(V.length||''),(rows||'<div class="muted small">Rien pour l\'instant.</div>')+(ed?`<div class="radd"><button class="btn" data-act="fiItem" data-i="">+ Un élément</button></div>`:''),{hid:G&&!e.sait,eye:G?eyeBtn('fiEye','data-k="sait"',!!e.sait,"Ce que l'on sait"):''});}}
  /* Notes MJ : gestion seule, jamais révélées */
  if(G&&((f.notes||'').trim()||E))h+=fiBlk('notes','Notes MJ','jamais révélées',(f.notes||'').trim()?fiRich(f.notes):'<div class="muted small">Aucune note.</div>',{edit:E?'fiEd':'',ea:' data-b="notes"',hid:true});
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
const FI_DLG=new Set(['fiNew','fiHead','fiTxt','fiTyp','jrHead','jrEnt','jrJg']);
const FI_ED=new Set(['fiTxt','jrHead','jrEnt']); /* fenêtres avec l'éditeur « @ » (lot 2 : journaux et quêtes) */
let FI_K=0;
function fiOpenDlg(g){g._k='fd'+(++FI_K);S.dlg=g;S._fiRedraw=true;}
/* Les fenêtres de fiche ne sont pas redessinées pendant la saisie (synchronisation toutes les 5 s) */
function fiSheetHook(g,root){if(!FI_DLG.has(g.kind))return false;
  const ae=document.activeElement,typing=ae&&root.contains(ae)&&(/INPUT|TEXTAREA|SELECT/.test(ae.tagName)||ae.isContentEditable);
  if(!S._fiRedraw&&typing&&root.querySelector(`[data-fidlg="${g._k}"]`))return true;
  S._fiRedraw=false;const html=fiSheet(g);if(!html){S.dlg=null;root.innerHTML='';return true;}root.innerHTML=html;
  if(g.kind==='fiTxt'){const ed=document.getElementById('fiEd');if(ed&&!g._foc){g._foc=true;ed.focus();const r=document.createRange();r.selectNodeContents(ed);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);}}
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
      <div class="field"><label for="fiKk">Lien Kanka</label><input id="fiKk" type="url" data-fin="kanka" value="${esc(g.kanka)}" placeholder="https://app.kanka.io/…" autocomplete="off"></div>
      <div class="field"><label>Image</label>${illEdit('fiche',f.id,f.nom)}<div class="muted small" style="margin-top:4px">Une vignette carrée et l'image entière en grand (visible d'un clic sur la vignette).</div></div>
      ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fiHeadSave"${(g.nom||'').trim()?'':' disabled'}>Enregistrer</button></div>
      ${canEdit()?`<div class="fidel">${g.confirm?`<div class="muted small">Supprimer définitivement « ${esc(f.nom)} » ? Les liens vers cette fiche deviendront du texte simple${fiKidsOf(f.id).length?' et les fiches contenues remonteront d\'un niveau':''}.</div><div class="actions"><button class="btn ghost" data-act="fiDelNo">Garder</button><button class="btn" style="color:var(--bad)" data-act="fiDelOk">Supprimer</button></div>`:`<button class="btn ghost" style="color:var(--bad)" data-act="fiDel">Supprimer la fiche</button>`}</div>`:''}`);}
  if(g.kind==='fiTxt'){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;if(g.b==='notes'&&!canEdit())return null;
    const it=g.b==='item'&&g.iid?(f.sait||[]).find(x=>x.id===g.iid):null;if(g.b==='item'&&g.iid&&!it)return null;
    const tt=g.b==='desc'?'Description':g.b==='notes'?'Notes MJ':it?"Ce que l'on sait":"Ce que l'on sait : nouvel élément";
    const canDel=it&&(canEdit()||it.par===ME);
    return fiShell(g,'Modifier : '+tt,`<div><h2>Modifier : ${tt}</h2><div class="muted small">${esc(f.nom)}</div></div>
      <div class="fiedw"><div id="fiEd" class="fied" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(tt)}" spellcheck="true">${fiEdHtml(g.txt)}</div><div id="fiSug" class="fisug" role="listbox" hidden></div></div>
      <div class="muted small">Tape <b>@</b> puis quelques lettres pour lier une fiche ; flèches + Entrée, ou un clic. Une ligne qui commence par « - » devient une liste.${g.b==='item'&&!it?(isGest()?' L\'élément sera préparé (œil fermé).':' L\'élément sera visible par toute la table.'):''}</div>
      <div class="actions">${canDel?(g.confirm?`<button class="btn" style="color:var(--bad)" data-act="fiItDelOk">Confirmer le retrait</button>`:`<button class="btn ghost" data-act="fiItDel">Retirer l'élément</button>`):''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fiTxtSave">Enregistrer</button></div>`);}
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
  const q=m[1].replace(/ /g,' '),items=fiSugList(q);if(!items.length&&/\s$/.test(q)){fiAtClose();return;}
  FI_AT={node:n,start:r.startOffset-m[1].length-1,q,items,sel:0};fiAtPaint();}
function fiAtPaint(){const box=document.getElementById('fiSug');if(!box)return;if(!FI_AT){box.hidden=true;box.innerHTML='';return;}
  const q=FI_AT.q.trim(),hl=s=>{if(!q)return esc(s);const i=nrm(s).indexOf(nrm(q));return i<0?esc(s):esc(s.slice(0,i))+'<b>'+esc(s.slice(i,i+q.length))+'</b>'+esc(s.slice(i+q.length));};
  box.hidden=false;box.innerHTML=`<div class="fisugh">${q?`Fiches correspondant à « ${esc(q)} »`:'Fiches'}</div>`+(FI_AT.items.length?FI_AT.items.map((x,i)=>`<button type="button" class="fisugi" role="option" data-act="fiSug" data-i="${i}" aria-selected="${i===FI_AT.sel}"><span>${hl(x.nom)}</span><small>${esc(x.kind)}${x.prep?' · <i>préparé</i>':''}</small></button>`).join(''):'<div class="muted small" style="padding:6px 10px">Aucune fiche ne correspond.</div>');}
function fiAtPick(i){const x=FI_AT&&FI_AT.items[i],ed=document.getElementById('fiEd');if(!x||!ed)return;const n=FI_AT.node;if(!n||!n.parentNode||!ed.contains(n)){fiAtClose();return;}
  let end=n.nodeValue.length;const s=window.getSelection();if(s&&s.rangeCount&&s.getRangeAt(0).startContainer===n)end=s.getRangeAt(0).startOffset;
  const rg=document.createRange();rg.setStart(n,Math.max(0,FI_AT.start));rg.setEnd(n,Math.max(FI_AT.start,end));rg.deleteContents();
  const box=document.createElement('span');box.innerHTML=fiTagHtml(x.t,x.id,x.nom,fiTokStore(x.t,x.id,x.nom));const tag=box.firstChild,sp=document.createTextNode(' ');
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
  if(a==='uni'){S.uni=d.v||'home';S.chPage=null;S.sec=null;S.rf=null;S.fi=null;S.fiQ='';S.fiTy='';window.scrollTo(0,0);render();return true;}
  if(a==='fiOpen'){const f=S.fiches[d.id];if(!fiSee(f))return true;S.fi=f.id;S.uni=f.genre;window.scrollTo(0,0);render();return true;}
  if(a==='fiBack'){if(S.nav.length){navBack();return true;}S.fi=null;window.scrollTo(0,0);render();return true;}
  if(a==='fiFold'){S.fiFold={...S.fiFold,[d.k]:!fiFolded(d.k)};render();return true;}
  if(a==='fiTree'){S.fiTree={...S.fiTree,[d.id]:!S.fiTree[d.id]};render();return true;}
  if(a==='fiTy'){S.fiTy=d.v||'';render();return true;}
  if(a==='fiLv'){S.fiLv=d.v;render();return true;}
  if(a==='fiImg'){if(d.cid){const c=S.chars[d.cid];fiViewer(c&&portrait(c),d.cid,c&&c.court);return true;}
    const src=S.ptr&&S.ptr[d.id];const f=S.fiches[String(d.id).replace(/^ill-fiche-/,'')];fiViewer(src,d.id,f?f.nom:'');return true;}
  if(a==='fiBig'){fiViewer(FI_BIG[d.id]||d.src,d.id,d.lab);return true;}
  if(a==='fiSug'){fiAtPick(+d.i);return true;}
  if(a==='closeSheet'&&S.dlg&&FI_DLG.has(S.dlg.kind)){FI_AT=null;return false;}
  if(!/^fi[A-Z]/.test(a))return false;
  if(S.visit)return true;
  const f=S.fi&&S.fiches[S.fi];
  if(a==='fiNew'){if(!fiCanNew()||!FI_G[d.g])return true;const cur=f&&f.genre===d.g?f.id:'';fiOpenDlg({kind:'fiNew',genre:d.g,nom:'',type:'',parent:FI_G[d.g].arbo?cur:'',vis:canEdit()?'prep':'rev'});render();return true;}
  if(a==='fiVis'){if(S.dlg&&S.dlg.kind==='fiNew'&&canEdit()){S.dlg.vis=d.v==='rev'?'rev':'prep';S._fiRedraw=true;render();}return true;}
  if(a==='fiCreate'){const g=S.dlg;if(!g||g.kind!=='fiNew'||!fiCanNew())return true;const nom=(g.nom||'').trim();if(!nom)return true;
    const gest=canEdit(),rev=gest?g.vis==='rev':true,now=new Date().toISOString();
    const nf={id:fiRid('f-'),genre:g.genre,nom,type:(g.type||'').trim(),parent:FI_G[g.genre].arbo&&g.parent&&S.fiches[g.parent]?g.parent:'',kanka:'',vis:rev?'rev':'prep',eye:{desc:rev,sait:rev},desc:'',sait:[],notes:'',par:ME||'',cree:now,modif:now};
    S.dlg=null;S.fi=nf.id;S.uni=nf.genre;S.fiQ='';S.fiTy='';fiSave(nf);window.scrollTo(0,0);setTimeout(()=>toast('Fiche créée'),0);return true;}
  if(a==='fiReveal'){if(!f||!isGest())return true;const n=clone(f);n.vis='rev';fiSave(n);return true;}
  if(a==='fiEye'){if(!f||!isGest())return true;const n=clone(f),e={...fiEyeOf(n)};let open;
    if(d.k==='fiche'){open=n.vis!=='rev';if(!open&&!canEdit())return true;n.vis=open?'rev':'prep';}
    else if(d.k==='desc'||d.k==='sait'){open=!e[d.k];if(!open&&!canEdit())return true;e[d.k]=open;n.eye=e;}
    else if(d.k==='item'){const it=(n.sait||[]).find(x=>x.id===d.i);if(!it)return true;open=!it.rev;if(!open&&!canEdit())return true;it.rev=open;}
    else return true;fiSave(n);return true;}
  if(a==='fiHead'){if(!fiCanEd(f))return true;fiOpenDlg({kind:'fiHead',id:f.id,nom:f.nom,type:f.type||'',parent:f.parent||'',kanka:f.kanka||''});render();return true;}
  if(a==='fiHeadSave'){const g=S.dlg,x=g&&S.fiches[g.id];if(!x||!fiCanEd(x))return true;const nom=(g.nom||'').trim(),kk=(g.kanka||'').trim();
    if(!nom)return true;if(kk&&!/^https?:\/\//.test(kk)){g.err='Le lien Kanka doit commencer par https://';S._fiRedraw=true;render();return true;}
    const n=clone(x);n.nom=nom;n.type=(g.type||'').trim();n.kanka=kk;
    if(FI_G[x.genre].arbo){const p=g.parent&&S.fiches[g.parent];n.parent=p&&p.id!==x.id&&!fiPath(p).some(q=>q.id===x.id)?p.id:'';}
    S.dlg=null;fiSave(n);setTimeout(()=>toast('Fiche enregistrée'),0);return true;}
  if(a==='fiDel'){if(S.dlg&&S.dlg.kind==='fiHead'&&canEdit()){S.dlg.confirm=true;S._fiRedraw=true;render();}return true;}
  if(a==='fiDelNo'){if(S.dlg){S.dlg.confirm=false;S._fiRedraw=true;render();}return true;}
  if(a==='fiDelOk'){const g=S.dlg;if(!g||g.kind!=='fiHead'||!canEdit())return true;const x=S.fiches[g.id];S.dlg=null;if(x){S.fi=null;fiRemove(x.id);}render();setTimeout(()=>toast('Fiche supprimée'),0);return true;}
  if(a==='fiEd'){if(!fiCanEd(f))return true;if(d.b==='notes'&&!canEdit())return true;fiOpenDlg({kind:'fiTxt',fid:f.id,b:d.b,txt:d.b==='notes'?(f.notes||''):(f.desc||'')});render();return true;}
  if(a==='fiItem'){if(!fiCanEd(f))return true;const it=d.i?(f.sait||[]).find(x=>x.id===d.i):null;if(d.i&&!it)return true;fiOpenDlg({kind:'fiTxt',fid:f.id,b:'item',iid:it?it.id:'',txt:it?it.txt:''});render();return true;}
  if(a==='fiItDel'){if(S.dlg&&S.dlg.kind==='fiTxt'){S.dlg.confirm=true;S._fiRedraw=true;render();}return true;}
  if(a==='fiItDelOk'){const g=S.dlg,x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const it=(x.sait||[]).find(y=>y.id===g.iid);if(!it||!(canEdit()||it.par===ME))return true;
    const n=clone(x);n.sait=n.sait.filter(y=>y.id!==g.iid);S.dlg=null;fiSave(n);return true;}
  if(a==='fiTxtSave'){const g=S.dlg,x=g&&S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||'');
    const n=clone(x);
    if(g.b==='desc')n.desc=txt;
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
