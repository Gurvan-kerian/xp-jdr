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
const fiBlkSee=(f,k)=>fiSee(f); /* UX2 : un seul œil par fiche (vis) ; les clés eye restent en base */
const fiItSee=(f,it)=>!!it&&fiSee(f)&&(isGest()||!!it.rev);
const fiCanEd=f=>!!f&&isUser()&&(isGest()||f.vis==='rev'); /* UX1 : contenu visible modifiable sans mode édition */
const fiCanNew=()=>!S.visit&&(canEdit()||(!isGest()&&!!ME));
const fiSort=L=>L.sort((a,b)=>(a.nom||'').localeCompare(b.nom||'','fr',{sensitivity:'base'}));
const fiKidsOf=(id,L)=>(L||fiAll()).filter(x=>x.parent===id);
function fiPath(f){const p=[];let x=f,n=0;while(x&&x.parent&&n++<30){x=S.fiches[x.parent];if(x)p.unshift(x);}return p;}
function fiDesc(id,L){let n=0;for(const k of fiKidsOf(id,L))n+=1+fiDesc(k.id,L);return n;}
function fiSave(f,quiet){f=clone(f);f.modif=new Date().toISOString();S.fiches={...S.fiches,[f.id]:f};persist('fiches/'+f.id,f);if(!quiet)render();}
function fiRemove(id){const f=S.fiches[id];if(!f)return;if(typeof caUnlink==='function')caUnlink('fiche',id); /* lot Cartes */
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
  for(const f of fiAll())if(fiSee(f)&&!['agenda','rep','traj','regle'].includes(f.genre))add('fiche',f.id,f.genre==='evenement'?((f.num||'').trim()?f.num.trim()+' ':'')+f.nom:f.nom,f.genre==='evenement'?(f.type||'Événement'):(f.type||(FI_G[f.genre]||{}).un||'fiche'),f.vis!=='rev'); /* lot 3 : événements proposés, agenda exclu */
  return out.sort((a,b)=>a.st-b.st||a.nom.localeCompare(b.nom,'fr',{sensitivity:'base'})).slice(0,8);}

/* ---------- Mentions : liens « @ » et rattachements, filtrés selon ce que la personne peut lire ---------- */
const FI_MGRP=['Événements','Journaux et quêtes','Fiches','Personnages'];
function fiMentions(t,id){const out=[];
  for(const F of fiAll()){if(t==='fiche'&&F.id===id)continue;if(!fiSee(F)||F.genre==='rep'||F.genre==='traj')continue;const hits=[],ev=F.genre==='evenement'||F.genre==='agenda';
    if(ev&&t==='perso'&&(F.pj||[]).includes(id))hits.push('PJ impliqué'); /* lot 3 : événements et agenda */
    if(ev&&fiHas(F.lieux,t,id))hits.push('Lieux');
    if(fiHas(F.desc,t,id)&&fiBlkSee(F,'desc'))hits.push(F.genre==='evenement'?'Résumé':F.genre==='agenda'?'Note':'Description');
    if((F.sait||[]).some(it=>fiHas(it.txt,t,id)&&fiItSee(F,it)))hits.push("Ce que l'on sait");
    if((F.spec||[]).some(x=>fiHas(x.txt,t,id)&&fiSpecSee(x)))hits.push('Spécimens connus'); /* lot 8 b */
    if((F.els||[]).some(x=>fiHas(x.txt,t,id)&&ctElSee(x)))hits.push('Histoire'); /* chronologies */
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
  const nv=(g,L)=>{const k=uniNewCount(g,L);return k?k:0;};
  const cnt=g=>{const L=fiAll().filter(f=>f.genre===g),V=L.filter(fiSee),v=V.length,p=G?L.filter(f=>f.vis!=='rev').length:0;
    return S.fichesReady?(v?FI_G[g].cnt(v)+(p?' · '+pl(p,'préparée','préparées'):''):'aucune fiche'):'chargement…';};
  const L=S.secrets||[],nt=L.filter(titreVis).length,np=propBadge();
  const sec=S.secretsReady?pl(L.length,'secret','secrets')+' · '+pl(nt,'titre révélé','titres révélés'):'chargement…';
  const rv=raceCres().filter(cr=>raceVisible(cr,raceRec(cr))),rd=rv.filter(cr=>cr.done).length;
  const rac=S.creaturesReady?pl(rv.length,'race','races')+(rd?' · '+pl(rd,'complète','complètes'):''):'chargement…';
  const pnjL=ids().map(i=>S.chars[i]).filter(c=>c&&c.type==='PNJ'&&vis(c));
  const row=(v,ic,l,sum,k,bdg)=>`<button type="button" class="pli ux2li" data-act="uni" data-v="${v}"><span class="pic">${FI_SVG(FI_IC[ic])}</span><span class="ptx"><b>${l}${bdg?` <span class="bdg" aria-label="${bdg} en attente">${bdg}</span>`:''}</b><small>${esc(sum)}${k?` · <span class="nouv">${k} nouveau${k>1?'x':''}</span>`:''}</small></span><span aria-hidden="true" class="pch">›</span></button>`;
  const fg=g=>nv(g,fiAll().filter(f=>f.genre===g&&fiSee(f)));
  const grp=(t,rows)=>`<div class="ux2grp"><div class="pgrp">${t}</div><div class="plst">${rows.join('')}</div></div>`;
  return `<div class="pghead"><h2>Univers</h2></div><div class="ux2home">`
    +grp('Récit',[row('chron','chron','Chronique',chUniSum(),nv('evenement',chEvs())),row('chrono','chrono','Histoire',cnt('chrono'),fg('chrono')),row('secrets','secrets','Secrets',sec,0,np)])
    +grp('Société',[row('pnj','pnj','PNJ',pnjL.length+' PNJ',nv('pnj',pnjL)),row('famille','famille','Familles',cnt('famille'),fg('famille')),row('org','org','Organisations',cnt('org'),fg('org'))])
    +grp('Monde',[row('lieu','lieu','Lieux',cnt('lieu'),fg('lieu')),row('carte','carte','Cartes',cnt('carte'),fg('carte')),row('objet','objet','Objets',cnt('objet'),fg('objet'))])
    +grp('Féerie',[row('creatures','races','Races',rac,0),row('pouvoirs','pouvoirs','Pouvoirs et capacités',uniPwSum(),0),row('art','art','Arts obscurs',cnt('art'),fg('art')),row('bete','bete','Bestiaire',cnt('bete'),fg('bete'))])+`</div>`;}
/* UX2 : nouveautés = éléments visibles révélés ou modifiés depuis la dernière visite de la liste (par navigateur) */
function uniSeen(){try{return JSON.parse(localStorage.getItem('xp.uniSeen')||'{}');}catch(e){return {};}}
function uniSeenSet(g){try{const m=uniSeen();m[g]=new Date().toISOString();localStorage.setItem('xp.uniSeen',JSON.stringify(m));}catch(e){}}
function uniNewCount(g,L){const t=uniSeen()[g];if(!t)return 0;return (L||[]).filter(x=>x&&((x.modif||x.cree||'')>t)).length;}
function uniSortOf(g){try{return (JSON.parse(localStorage.getItem('xp.uniSort')||'{}'))[g]||'az';}catch(e){return 'az';}}
function uniSortSet(g,v){try{const m=JSON.parse(localStorage.getItem('xp.uniSort')||'{}');m[g]=v;localStorage.setItem('xp.uniSort',JSON.stringify(m));}catch(e){}}
/* lot 3 : résumé de l'entrée Chronique */
function chUniSum(){if(!S.fichesReady)return 'chargement…';const n=chEvs().length,d=chNow();return (n?n+' événement'+(n>1?'s':''):'aucun événement pour l\'instant')+(d?' · '+chDateTxt(d):'');}
const fiUniBack=()=>crumb(CR_UNI,['']);

/* ---------- Liste d'un genre : recherche, filtre par type, arborescence ---------- */
function fiListView(g){const Gm=FI_G[g],T=fiTypes(g);if(S.fiTy&&!T.some(t=>t[0]===S.fiTy))S.fiTy='';
  const plus=fiCanNew()&&(g!=='art'||canEdit())?`<button type="button" class="pbtn big" data-act="fiNew" data-g="${g}" aria-label="${esc(Gm.nv)}">+</button>`:'';
  let h=fiUniBack()+`<div class="pghead"><h2>${Gm.pl}</h2>${plus}</div>`;
  if(!S.fichesReady)return h+`<div class="card empty">Chargement…</div>`;
  const so=uniSortOf(g);
  h+=`<div class="ux2tb"><input type="search" data-fiq="1" value="${esc(S.fiQ)}" placeholder="Filtrer les ${Gm.pl.toLowerCase()}" aria-label="Filtrer les ${Gm.pl.toLowerCase()}" autocomplete="off"><div class="ux2sel">`
    +(T.length?`<label class="ux2dd${S.fiTy?' on':''}"><span>Type :</span><select data-fity="1" aria-label="Type">${[['','Tous']].concat(T.map(t=>[t[0],t[0]])).map(([v,l])=>`<option value="${esc(v)}"${(S.fiTy||'')===v?' selected':''}>${esc(l)}</option>`).join('')}</select></label>`:'')
    +`<label class="ux2dd"><span>Tri :</span><select data-fiso="${g}" aria-label="Tri"><option value="az"${so==='az'?' selected':''}>A-Z</option><option value="rec"${so==='rec'?' selected':''}>Récents</option></select></label>`
    +(g==='objet'?`<button class="chip" data-act="fi6Uq" aria-pressed="${!!S.fiUq}">Uniques</button>`:'')
    +(isGest()?`<button class="chip" data-act="fiPrep" aria-pressed="${!!S.fiPrep}">Préparés seulement</button>`:'')+`</div></div>`;
  h+=`<div id="fiRes">${fiListBody(g)}</div>`;
  return h;}
function fiListBody(g){const Gm=FI_G[g],L=fiAll().filter(f=>f.genre===g&&fiSee(f)&&!(g==='objet'&&S.fiUq&&!f.uniq)&&!(S.fiPrep&&f.vis==='rev')),q=nrm(S.fiQ),ty=S.fiTy||'',so=uniSortOf(g);
  if(!L.length)return `<div class="card empty">${S.fiPrep?'Aucune fiche préparée.':'Aucune fiche pour l\'instant.'}</div>`;
  const tag=f=>f.vis!=='rev'?`<span class="ux2prep">${EYE_C}préparé</span>`:'';
  const th=f=>{const s=illOf('fiche',f.id);return s?`<img class="illt" src="${s}" alt="" style="width:36px;height:36px">`:`<span class="ux2nothumb" aria-hidden="true"></span>`;};
  const line=(f,sub,depth,tog)=>`<div class="firow ux2row${f.vis!=='rev'?' prep':''}" style="padding-left:${depth*22}px">${tog||'<span class="fitog0"></span>'}<button type="button" class="fili" data-act="fiOpen" data-id="${esc(f.id)}">${th(f)}<span class="fitx"><b>${esc(f.nom)}</b><small>${esc(sub)}</small></span>${tag(f)}</button></div>`;
  const subOf=(f,p)=>f.genre==='carte'?caListSub(f,null)+(p?' · '+p:''):[f.type,p,fi6Hold(f)].filter(Boolean).join(' · ');
  if(q||ty||so==='rec'||!Gm.arbo||(g==='objet'&&S.fiUq)||S.fiPrep){let R=L.filter(f=>(!ty||(f.type||'').trim()===ty)&&(!q||nrm(f.nom).includes(q)||nrm(f.type).includes(q)));
    R=so==='rec'?R.sort((a,b)=>((b.modif||b.cree||'')>(a.modif||a.cree||'')?1:-1)):fiSort(R);
    if(!R.length)return `<div class="card empty">Aucune fiche ne correspond.</div>`;
    return `<div class="filst">${R.map(f=>{const p=Gm.arbo?fiPath(f).filter(fiSee).map(x=>x.nom).join(' › '):'';return line(f,subOf(f,p),0);}).join('')}</div>`;}
  const ids0=new Set(L.map(f=>f.id)),roots=fiSort(L.filter(f=>!f.parent||!ids0.has(f.parent)));
  const rec=(f,depth)=>{const K=g==='famille'?faKidOrd(fiKidsOf(f.id,L)):fiSort(fiKidsOf(f.id,L)),n=fiDesc(f.id,L),op=S.fiTree[f.id]!=null?S.fiTree[f.id]:false;
    const tog=K.length?`<button type="button" class="fitog" data-act="fiTree" data-id="${esc(f.id)}" aria-expanded="${op}" aria-label="${op?'Replier':'Déplier'} ${esc(f.nom)}">${op?'⌄':'›'}</button>`:'';
    const un=Gm.un==='lieu'?'lieu':Gm.un;
    return line(f,g==='famille'?faListSub(f,K):g==='carte'?caListSub(f,K):[f.type,K.length?n+' '+(g==='lieu'?(n>1?'lieux':'lieu'):g==='objet'?(n>1?'objets':'objet'):(n>1?'éléments':'élément')):'',fi6Hold(f)].filter(Boolean).join(' · '),depth,tog)+(op?K.map(k=>rec(k,depth+1)).join(''):'');};
  return `<div class="filst">${roots.map(f=>rec(f,0)).join('')}</div>`;}
/* ---------- La fiche ---------- */
const fiFolded=k=>!!(S.fiFold||{})[k];
function fiBlk(k,title,sum,body,o){o=o||{};const fold=fiFolded(k),id='fb-'+k;
  const ed=o.edit?`<button type="button" class="ibtn sm" data-act="${o.edit}"${o.ea||''} aria-label="Modifier « ${esc(String(title).replace(/<[^>]+>/g,''))} »">${ICON.crayon}</button>`:'';
  const pl=o.plus&&!fold?`<div class="blkplus"><button type="button" class="pbtn" data-act="${o.plus}"${o.pa||''} aria-label="Ajouter">+</button></div>`:'';
  return `<section class="rblk${o.cls?' '+o.cls:''}"><div class="rbh"><button type="button" class="rbt" data-act="fiFold" data-k="${k}" aria-expanded="${!fold}" aria-controls="${id}"><span class="tt"><span class="t">${title}</span>${sum!==''&&sum!=null?`<span class="n">${sum}</span>`:''}</span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button>${ed}${o.keepEye?o.eye||'':''}</div>${pl}${fold?'':`<div class="rbb" id="${id}">${body}</div>`}</section>`;}
/* UX2 : texte long replié après 6 lignes */
function fiClamp(key,html){if(html.replace(/<[^>]+>/g,'').length<380)return html;const op=!!(S.fiMore||{})[key];return `<div class="ux2clamp${op?' op':''}">${html}</div><button type="button" class="lnk ux2more" data-act="fiMore" data-k="${esc(key)}">${op?'Réduire':'Lire la suite'}</button>`;}
/* UX2 : barre « Compléter » (blocs vides) */
function fiComp(L){L=L.filter(Boolean);if(!L.length)return '';return `<div class="ux2comp"><span class="muted small">Compléter :</span>${L.map(([lab,act,at,raw])=>raw||`<button type="button" class="ux2cb" data-act="${act}"${at||''}>+ ${lab}</button>`).join('')}</div>`;}
/* UX2 : en-tête de fiche commun (fil d'Ariane + œil MJ + crayon + corbeille, image, nom, sous-titre) */
function fiHeadUX2(f,crumbs,opt){opt=opt||{};const G=isGest(),ed=fiCanEd(f);
  const eye=G?(f.vis==='rev'?`<button type="button" class="ibtn" data-act="fiEye" data-k="fiche" aria-label="Fiche révélée : la préparer (masquer)" title="Fiche révélée">${EYE_O}</button>`:`<button type="button" class="ibtn prepi" data-act="fiEye" data-k="fiche" aria-label="Fiche préparée : la révéler" title="Fiche préparée">${EYE_C}</button>`):'';
  const pen=ed&&!opt.noPen?`<button type="button" class="ibtn" data-act="${opt.penAct||'fiHead'}" aria-label="Modifier la fiche">${ICON.crayon}</button>`:'';
  const del=canEdit()&&!opt.noDel?`<button type="button" class="ibtn del" data-act="fiDelAsk" aria-label="Supprimer la fiche">${ICON.corbeille}</button>`:'';
  let h=`<div class="ux2top">${crumb(...crumbs)}<span class="ux2sp"></span>${eye}${pen}${del}</div>`;
  if(S.fiRevAsk===f.id)h+=`<div class="delconf ux2conf"><div><b>Révéler la fiche ?</b> Elle devient visible de toute la table, avec tous ses blocs. « À révéler » reste caché.</div><div class="acts"><button class="btn" data-act="fiRevNo">Annuler</button><button class="btn pri" data-act="fiRevOk">Révéler</button></div></div>`;
  if(S.fiDelAsk===f.id)h+=`<div class="delconf"><div><b>Supprimer « ${esc(f.nom)} » ?</b> Ses sous-éléments sont rattachés à son parent.</div><div class="acts"><button class="btn" data-act="fiDelNo2">Annuler</button><button class="btn danger" data-act="fiDelOk2">Supprimer</button></div></div>`;
  return h;}
/* Lot 8 b (26/11/2026) : Bestiaire › Spécimens connus — spec:[{id, nom, txt, rev, cree, par}], image illId('spec', id), un œil par spécimen */
const fiSpecSee=x=>!!x&&(isGest()||!!x.rev);
function fiSpecBlk(f,ed,G){const A=f.spec||[],V=A.filter(fiSpecSee),nr=A.filter(x=>x.rev).length;if(!V.length&&!ed)return '';
  const rows=V.map(x=>{const im=illOf('spec',x.id);return `<div class="fiit fispec${x.rev?'':' fihid'}">${im?`<button type="button" class="fithumb" data-act="fiImg" data-id="${esc(illId('spec',x.id))}" data-lab="${esc(x.nom)}" aria-label="Agrandir l'image de ${esc(x.nom)}"><img src="${im}" alt=""></button>`:''}<div class="fiitx"><b>${esc(x.nom)}</b>${(x.txt||'').trim()?`<div>${fiRich(x.txt)}</div>`:''}</div>${ed?`<button type="button" class="fiedi" data-act="fiSpec" data-i="${esc(x.id)}" aria-label="Modifier ${esc(x.nom)}">${ICON.crayon}</button>`:''}${G?eyeBtn('fiEye',`data-k="spec" data-i="${esc(x.id)}"`,!!x.rev,'Spécimen '+x.nom):''}</div>`;}).join('');
  return fiBlk('spec','Spécimens connus',G?`${nr} / ${A.length} révélé${nr>1?'s':''}`:String(V.length||''),(rows||'<div class="muted small">Aucun spécimen connu.</div>')+(ed?`<div class="radd"><button class="btn" data-act="fiSpec" data-i="">+ Un spécimen</button></div>`:''));}
function fiFicheView(f){
  const G=isGest(),E=canEdit(),ed=fiCanEd(f),Gm=FI_G[f.genre]||FI_G.lieu;
  let h=fiHeadUX2(f,[CR_UNI,[Gm.pl,'data-act="fiBack"']]);
  const img=f.genre==='carte'?'':illOf('fiche',f.id),path=fiPath(f); /* UX2 : la carte n'est pas répétée en tête */
  const sub=[f.type?esc(f.type):'',...fi6Sub(f),...(f.genre==='famille'?faSub(f):[]),...(f.genre==='art'?aoSub(f):[]),path.length&&f.genre!=='famille'?path.map(x=>fiSee(x)?lk({t:'fiche',id:x.id},x.nom):`<span class="nolk">${esc(x.nom)}</span>`).join(' › '):''].filter(Boolean).join(' · ');
  const prep=f.vis!=='rev'?` <span class="ux2prep">${EYE_C}préparée</span>`:'';
  h+=`<div class="ux2hero${img?' img':''}">${img?`<button type="button" class="ux2heroimg" data-act="fiImg" data-id="${esc(illId('fiche',f.id))}" aria-label="Agrandir l'image de ${esc(f.nom)}"><img src="${img}" alt=""></button>`:''}<div class="ux2herot"><h2 class="finm">${esc(f.nom)}</h2>${sub||prep?`<div class="muted small">${sub}${prep}</div>`:''}${f.genre==='famille'?faHeadKv(f):''}${!img&&ed&&f.genre!=='carte'?`<button type="button" class="lnk" data-act="fiHead">+ Image</button>`:''}</div></div>`;
  if(f.genre==='carte')return h+caPage(f); /* lot Cartes ; UX2 : carte en premier, panneau */
  const T6=fi6Tabs(f);if(T6){h+=T6;if(S.fiTab==='gest')return h+(typeof fgView==='function'?fgView(f):fi6Gest(f));} /* lot 6 : Fief rattaché à un PJ */
  const OT=f.genre==='org'?ogTab():'';if(OT)h+=ogTabsBar(OT); /* lot 5 a : onglets de l'organisation */
  const comp=FI_CX=[];const pres=!OT||OT==='pres';
  /* Description */
  if(pres){if((f.desc||'').trim())h+=fiBlk('desc',f.genre==='famille'?'Présentation':'Description','',fiClamp(f.id+':desc',fiRich(f.desc)),{edit:ed?'fiEd':'',ea:' data-b="desc"'});
    else if(ed)comp.push([f.genre==='famille'?'Présentation':'Description','fiEd',' data-b="desc"']);}
  /* UX2 : Ce que l'on sait (révélé) puis À révéler (MJ) */
  if(pres&&f.genre!=='carte'&&f.genre!=='chrono'){const A=(f.sait||[]),V=A.filter(it=>it.rev),Hd=A.filter(it=>!it.rev);
    if(V.length)h+=fiBlk('sait',"Ce que l'on sait",String(V.length),V.map(it=>fiItRow(f,it,ed)).join(''),{plus:ed?'fiItem':'',pa:' data-i="" data-h="0"'});
    else if(ed)comp.push(["Ce que l'on sait",'fiItem',' data-i="" data-h="0"']);
    if(G){if(Hd.length)h+=fiBlk('arev','À révéler',String(Hd.length),`<div class="ux2arh">${EYE_C}Invisible des joueurs · un élément révélé passe dans « Ce que l'on sait »</div>`+Hd.map(it=>fiItRow(f,it,ed,true)).join(''),{plus:'fiItem',pa:' data-i="" data-h="1"',cls:'ux2arev'});
      else comp.push(['À révéler','fiItem',' data-i="" data-h="1"']);}}
  if(['lieu','org','objet'].includes(f.genre)&&pres)h+=caOnMap('fiche',f.id); /* lot Cartes */
  if(f.genre==='bete')h+=fiSpecBlk(f,ed,G); /* lot 8 b : spécimens connus */
  if(f.genre==='art'){h+=aoBlocks(f,ed,G);if(canEdit())h+=aoParams(f);} /* arts obscurs ; UX3 : réglages sur la fiche */
  if(f.genre==='chrono')h+=ctBlocks(f,ed,G); /* chronologies */
  h+=fi6Blocks(f); /* lot 6 : blocs propres aux lieux et objets */
  if(OT)h+=ogBlocks(f,OT); /* lot 5 a */
  if(f.genre==='famille')h+=faBlocks(f); /* lot 5 b */
  if(OT&&OT!=='ctx')return h+fiComp(comp);
  /* Mentions (UX2 : sans les fiches déjà listées dans la fiche) */
  const M=fiMentions('fiche',f.id).filter(m=>!(m.o&&m.o.t==='fiche'&&S.fiches[m.o.id]&&S.fiches[m.o.id].parent===f.id)&&!/^Situation · /.test(m.prec||'')); /* UX2 : sans ce que les blocs listent déjà */
  if(M.length)h+=fiBlk('ment','Mentions',String(M.length),fiMentionsHtml(M));
  h+=fiComp(comp);
  return h;}
/* UX2 : ligne d'élément de « Ce que l'on sait » / « À révéler » */
let FI_CX=[];
function fiItRow(f,it,ed,hid){const P=it.par&&S.players[it.par],by=P&&!isMJ(P)?` · ajouté par ${esc(P.nom)}`:'';
  const rv=it.revDj?`<span class="ux2rv">révélé</span> ${esc(typeof chDateTxt==='function'?chDateTxt(it.revDj):'')}`:'';
  const meta=(rv||by)?`<div class="ux2itm">${rv}${by}</div>`:'';
  return `<div class="fiit ux2it${hid?' ux2hid':''}"><div class="fiitx">${fiRich(it.txt)}${meta}${hid?`<div class="ux2rvb"><button type="button" class="btn pri sm" data-act="fiRevIt" data-i="${esc(it.id)}">${EYE_O} Révéler</button></div>`:''}</div>${ed?`<button type="button" class="fiedi" data-act="fiItem" data-i="${esc(it.id)}" aria-label="Modifier l'élément">${ICON.crayon}</button>`:''}</div>`;}

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
  if(/^ao[A-Z]/.test(g.kind))return aoSheet(g); /* arts obscurs */
  if(/^ct[A-Z]/.test(g.kind))return ctSheet(g); /* chronologies */
  if(/^rg[A-Z]/.test(g.kind))return rgSheet(g); /* règles en images */
  if(/^jr/.test(g.kind))return jrSheet(g); /* lot 2 */
  if(/^ch/.test(g.kind))return chSheet(g); /* lot 3 */
  if(/^pn/.test(g.kind))return pnSheet(g); /* lot 4 */
  if(/^fi6/.test(g.kind))return fi6Sheet(g); /* lot 6 */
  if(/^fiO/.test(g.kind))return ogSheet(g); /* lot 5 a */
  if(/^fa[A-Z]/.test(g.kind))return faSheet(g); /* lot 5 b */
  if(/^ca[A-Z]/.test(g.kind))return caSheet(g); /* lot Cartes */
  if(/^fg[A-Z]/.test(g.kind))return fgSheet(g); /* lot 7 : fiefs */
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
      ${f.genre==='objet'?fi6HeadFields(g):''}${f.genre==='famille'?faHeadFields(g):''}${f.genre==='carte'?caHeadFields(g):''}
      
      <div class="field"><label>Image</label>${illEdit('fiche',f.id,f.nom)}<div class="muted small" style="margin-top:4px">Une vignette carrée et l'image entière en grand (visible d'un clic sur la vignette).</div></div>
      ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="fiHeadSave"${(g.nom||'').trim()?'':' disabled'}>Enregistrer</button></div>
      ${canEdit()?`<div class="fidel">${g.confirm?`<div class="muted small">Supprimer définitivement « ${esc(f.nom)} » ? Les liens vers cette fiche deviendront du texte simple${fiKidsOf(f.id).length?' et les fiches contenues remonteront d\'un niveau':''}.${f.genre==='carte'?' Ses repères et trajets seront supprimés avec elle.':''}</div><div class="actions"><button class="btn ghost" data-act="fiDelNo">Garder</button><button class="btn" style="color:var(--bad)" data-act="fiDelOk">Supprimer</button></div>`:`<button class="btn ghost" style="color:var(--bad)" data-act="fiDel">Supprimer la fiche</button>`}</div>`:''}`);}
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
  const mf=/^ill-fiche-/.test(ill)&&S.fiches[ill.slice(10)],isMap=!!mf&&mf.genre==='carte'; /* lot Cartes : grande image jusqu'à 2600 px */
  const w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,(isMap?2600:1600)/Math.max(w,h)),cv=document.createElement('canvas');cv.width=Math.round(w*k);cv.height=Math.round(h*k);
  const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0,cv.width,cv.height);
  let q=.85,data=cv.toDataURL('image/jpeg',q);while(data.length>(isMap?3800000:900000)&&q>.45){q-=.1;data=cv.toDataURL('image/jpeg',q);}
  if(isMap&&(mf.iw!==cv.width||mf.ih!==cv.height)){const n=clone(mf);n.iw=cv.width;n.ih=cv.height;delete CA_V[mf.id];fiSave(n,true);}
  FI_BIG[ill]=data;DB.img.set(ill,data).catch(e=>{console.error(e);toast("Grande image non enregistrée (script SQL du lot 1 à installer)");});}
function fiBigDel(ill){delete FI_BIG[ill];if(DB&&DB.img&&!S.visit&&!writesLocked())DB.img.del(ill).catch(()=>{});}
let FI_VW=null;
function fiViewer(src,big,title,nav){const prev0=FI_VW&&FI_VW.prev;fiViewerClose(true);if(!src)return;
  const el=document.createElement('div');el.id='fiVw';el.className='fivw';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',title||'Image agrandie');
  el.innerHTML=`<div class="fivwh"><span class="fivwt">${esc(title||'')}</span><button type="button" class="fivwx" data-vw="x" aria-label="Fermer">✕</button></div><div class="fivws"><img alt="${esc(title||'')}" src="${src}" draggable="false"></div><div class="fivwz">${nav?`<button type="button" data-vw="prev" aria-label="Image précédente"${nav.i>0?'':' disabled'}>‹</button>`:''}<button type="button" data-vw="-" aria-label="Dézoomer">−</button><span data-vw="p">100 %</span><button type="button" data-vw="+" aria-label="Zoomer">+</button>${nav?`<button type="button" data-vw="next" aria-label="Image suivante"${nav.i<nav.L.length-1?'':' disabled'}>›</button>`:''}</div>`;
  document.body.appendChild(el);const img=el.querySelector('img');
  FI_VW={el,img,z:1,x:0,y:0,pts:new Map(),d0:0,z0:1,last:0,prev:nav&&prev0?prev0:document.activeElement,nav};
  const paint=()=>{const v=FI_VW;if(!v)return;img.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.z})`;el.querySelector('[data-vw="p"]').textContent=Math.round(v.z*100)+' %';};
  const zoom=(z)=>{const v=FI_VW;v.z=Math.max(1,Math.min(8,z));if(v.z===1){v.x=0;v.y=0;}paint();};
  el.addEventListener('click',ev=>{const b=ev.target.closest('[data-vw]');if(!b){if(ev.target===el)fiViewerClose();return;}const k=b.dataset.vw;if((k==='prev'||k==='next')&&nav){const j=nav.i+(k==='prev'?-1:1),o=nav.L[j];if(o&&S.ptr&&S.ptr[o.k])fiViewer(S.ptr[o.k],o.k,o.lab,{L:nav.L,i:j});return;}if(k==='x')fiViewerClose();else if(k==='+')zoom(FI_VW.z*1.4);else if(k==='-')zoom(FI_VW.z/1.4);});
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
function fiViewerClose(keep){if(!FI_VW)return;const p=FI_VW.prev;FI_VW.el.remove();FI_VW=null;if(!keep&&p&&p.focus)try{p.focus();}catch(e){}}
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
  if(FI_VW&&FI_VW.nav&&(ev.key==='ArrowLeft'||ev.key==='ArrowRight')){const b=FI_VW.el.querySelector(`[data-vw="${ev.key==='ArrowLeft'?'prev':'next'}"]`);if(b&&!b.disabled){ev.preventDefault();b.click();}return;}
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
  if(/^sr[A-Z]/.test(a)&&srAct(a,d))return true; /* recherche globale */
  if(/^ao[A-Z]/.test(a)){if(AO_PACT.has(a)){aoParamAct(a,d);render();return true;}if(aoAct(a,d))return true;} /* arts obscurs */
  if(/^ct[A-Z]/.test(a))return ctAct(a,d); /* chronologies */
  if(/^fg[A-Z]/.test(a)&&typeof fgAct==='function')return fgAct(a,d); /* lot 7 : fiefs */
  if(/^rg[A-Z]/.test(a))return rgAct(a,d); /* règles en images */
  if(/^jr[A-Z]/.test(a))return jrAct(a,d); /* lot 2 : journaux et quêtes */
  if(/^ch[A-Z]/.test(a))return chAct(a,d); /* lot 3 : chronique et calendrier */
  if(/^pn[A-Z]/.test(a))return pnAct(a,d); /* lot 4 : PNJ */
  if(a==='uni'){if(d.v&&d.v!=='home')uniSeenSet(d.v==='chron'?'evenement':d.v);S.fiPrep=false;S.uni=d.v||'home';S.chPage=null;S.sec=null;S.rf=null;S.fi=null;S.fiQ='';S.fiTy='';window.scrollTo(0,0);render();return true;}
  if(a==='fiOpen'){const f=S.fiches[d.id];if(!fiSee(f))return true;S.fiTab='';S.fi=f.id;S.uni=f.genre;window.scrollTo(0,0);render();return true;}
  if(a==='fiBack'){if(S.nav.length){navBack();return true;}S.fi=null;window.scrollTo(0,0);render();return true;}
  if(a==='fiFold'){S.fiFold={...S.fiFold,[d.k]:!fiFolded(d.k)};render();return true;}
  if(a==='fiTree'){S.fiTree={...S.fiTree,[d.id]:!S.fiTree[d.id]};render();return true;}
  if(a==='fiTy'){S.fiTy=d.v||'';render();return true;}
  if(a==='fiPrep'){S.fiPrep=!S.fiPrep;render();return true;}
  if(a==='fiMore'){S.fiMore={...(S.fiMore||{}),[d.k]:!(S.fiMore||{})[d.k]};render();return true;}
  if(a==='fiLv'){S.fiLv=d.v;render();return true;}
  if(a==='fiImg'){if(d.cid){const c=S.chars[d.cid];fiViewer(c&&portrait(c),d.cid,c&&c.court);return true;}
    const src=S.ptr&&S.ptr[d.id];const f=S.fiches[String(d.id).replace(/^ill-fiche-/,'')];fiViewer(src,d.id,f?f.nom:(d.lab||''));return true;}
  if(a==='fiBig'){fiViewer(FI_BIG[d.id]||d.src,d.id,d.lab);return true;}
  if(a==='fiSug'){fiAtPick(+d.i);return true;}
  if(a==='closeSheet'&&S.dlg&&FI_DLG.has(S.dlg.kind)){FI_AT=null;return false;}
  if(/^fi6[A-Z]/.test(a))return fi6Act(a,d); /* lot 6 */
  if(/^fiO[A-Z]/.test(a)||(a==='situEd'&&(d.k==='orgs'||d.k==='titres')))return ogAct(a,d); /* lot 5 a */
  if(a==='faAllT'){S.faAll={...(S.faAll||{}),[d.id]:!(S.faAll||{})[d.id]};render();return true;}
  if(/^fa[A-Z]/.test(a))return faAct(a,d); /* lot 5 b */
  if(/^ca[A-Z]/.test(a))return caAct(a,d); /* lot Cartes */
  if(!/^fi[A-Z]/.test(a))return false;
  if(S.visit)return true;
  const f=S.fi&&S.fiches[S.fi];
  if(a==='fiNew'){if(!fiCanNew()||!FI_G[d.g]||(d.g==='art'&&!canEdit()))return true;const cur=f&&f.genre===d.g?f.id:'';fiOpenDlg({kind:'fiNew',genre:d.g,nom:'',type:'',parent:FI_G[d.g].arbo?cur:'',vis:canEdit()?'prep':'rev'});render();return true;}
  if(a==='fiVis'){if(S.dlg&&S.dlg.kind==='fiNew'&&canEdit()){S.dlg.vis=d.v==='rev'?'rev':'prep';S._fiRedraw=true;render();}return true;}
  if(a==='fiCreate'){const g=S.dlg;if(!g||g.kind!=='fiNew'||!fiCanNew())return true;const nom=(g.nom||'').trim();if(!nom)return true;
    const gest=canEdit(),rev=gest?g.vis==='rev':true,now=new Date().toISOString();
    const nf={id:fiRid('f-'),genre:g.genre,nom,type:(g.type||'').trim(),parent:FI_G[g.genre].arbo&&g.parent&&S.fiches[g.parent]?g.parent:'',kanka:'',vis:rev?'rev':'prep',eye:Object.fromEntries(['desc','sait'].concat(g.genre==='org'||g.genre==='famille'?FI6_EYE[g.genre]:[]).map(k=>[k,rev])),desc:'',sait:[],notes:'',par:ME||'',cree:now,modif:now};
    S.dlg=null;S.fi=nf.id;S.uni=nf.genre;S.fiQ='';S.fiTy='';fiSave(nf);window.scrollTo(0,0);setTimeout(()=>toast('Fiche créée'),0);return true;}
  if(a==='fiDelAsk'){if(!f||!canEdit())return true;S.fiDelAsk=f.id;render();return true;}
  if(a==='fiDelNo2'){S.fiDelAsk=null;render();return true;}
  if(a==='fiDelOk2'){if(!f||!canEdit())return true;S.fiDelAsk=null;S.fi=null;fiRemove(f.id);render();setTimeout(()=>toast('Fiche supprimée'),0);return true;}
  if(a==='fiRevNo'){S.fiRevAsk=null;render();return true;}
  if(a==='fiRevOk'){if(!f||!isGest())return true;S.fiRevAsk=null;const n=clone(f);n.vis='rev';fiSave(n);return true;}
  if(a==='fiRevIt'){if(!f||!isGest())return true;const n=clone(f),it=(n.sait||[]).find(x=>x.id===d.i);if(!it)return true;it.rev=true;it.revDj=typeof chNow==='function'?chNow():null;fiSave(n);
    S.fiUndo={fid:f.id,iid:it.id};setTimeout(()=>toastAct("Révélé : ajouté à « Ce que l'on sait »",'Annuler','fiRevUndo'),0);return true;}
  if(a==='fiRevUndo'){const u=S.fiUndo,x=u&&S.fiches[u.fid];if(!x||!isGest())return true;const n=clone(x),it=(n.sait||[]).find(y=>y.id===u.iid);if(it){it.rev=false;delete it.revDj;fiSave(n);}S.fiUndo=null;return true;}
  if(a==='fiReveal'){if(!f||!isGest())return true;const n=clone(f);n.vis='rev';fiSave(n);return true;}
  if(a==='fiEye'){if(!f||!isGest())return true;const n=clone(f),e={...fiEyeOf(n)};let open;
    if(d.k==='fiche'){open=n.vis!=='rev';if(open){S.fiRevAsk=f.id;render();return true;}if(!canEdit()){toast('Mode édition requis pour préparer une fiche révélée');return true;}n.vis='prep';}
    else if(fiEyeKeys(n).includes(d.k)){open=!e[d.k];if(!open&&!canEdit())return true;e[d.k]=open;n.eye=e;}
    else if(d.k==='item'){const it=(n.sait||[]).find(x=>x.id===d.i);if(!it)return true;open=!it.rev;if(!open&&!canEdit())return true;it.rev=open;}
    else if(d.k==='spec'){const it=(n.spec||[]).find(x=>x.id===d.i);if(!it)return true;open=!it.rev;if(!open&&!canEdit())return true;it.rev=open;}
    else return true;fiSave(n);return true;}
  if(a==='fiHead'){if(!fiCanEd(f))return true;fiOpenDlg({kind:'fiHead',id:f.id,nom:f.nom,type:f.type||'',parent:f.parent||'',kanka:f.kanka||'',uniq:!!f.uniq,creaId:(f.crea||{}).id||'',creaNom:(f.crea||{}).id?'':((f.crea||{}).nom||''),devise:f.devise||'',race:f.race||'',speci:f.speci||'',suzT:f.suzT||'',lieu:f.lieu||''});render();return true;}
  if(a==='fiHeadSave'){const g=S.dlg,x=g&&S.fiches[g.id];if(!x||!fiCanEd(x))return true;const nom=(g.nom||'').trim(),kk=(g.kanka||'').trim();
    if(!nom)return true;if(kk&&!/^https?:\/\//.test(kk)){g.err='Le lien Kanka doit commencer par https://';S._fiRedraw=true;render();return true;}
    const n=clone(x);n.nom=nom;n.type=(g.type||'').trim();n.kanka=kk;if(x.genre==='objet')fi6HeadApply(n,g);
    if(FI_G[x.genre].arbo){const p=g.parent&&S.fiches[g.parent];n.parent=p&&p.id!==x.id&&!fiPath(p).some(q=>q.id===x.id)?p.id:'';}
    if(x.genre==='famille')faHeadApply(n,g); /* lot 5 b */
    if(x.genre==='carte'){const l=g.lieu&&S.fiches[g.lieu];n.lieu=l&&l.genre==='lieu'?l.id:'';} /* lot Cartes */
    S.dlg=null;fiSave(n);setTimeout(()=>toast('Fiche enregistrée'),0);return true;}
  if(a==='fiDel'){if(S.dlg&&S.dlg.kind==='fiHead'&&canEdit()){S.dlg.confirm=true;S._fiRedraw=true;render();}return true;}
  if(a==='fiDelNo'){if(S.dlg){S.dlg.confirm=false;S._fiRedraw=true;render();}return true;}
  if(a==='fiDelOk'){const g=S.dlg;if(!g||g.kind!=='fiHead'||!canEdit())return true;const x=S.fiches[g.id];S.dlg=null;if(x){S.fi=null;fiRemove(x.id);}render();setTimeout(()=>toast('Fiche supprimée'),0);return true;}
  if(a==='fiEd'){if(!fiCanEd(f))return true;if(d.b==='notes'&&!canEdit())return true;fiOpenDlg({kind:'fiTxt',fid:f.id,b:d.b,txt:d.b==='notes'?(f.notes||''):d.b==='effet'?(f.effet||''):d.b==='feerie'?((f.fief||{}).feerie||''):d.b==='prat'?(f.prat||''):d.b==='terr'?(f.terr||''):(f.desc||'')});render();return true;}
  if(a==='fiItem'){if(!fiCanEd(f))return true;const it=d.i?(f.sait||[]).find(x=>x.id===d.i):null;if(d.i&&!it)return true;fiOpenDlg({kind:'fiTxt',fid:f.id,b:'item',iid:it?it.id:'',txt:it?it.txt:'',hid:d.h==='1'});render();return true;}
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
      else{if(!txt){S.dlg=null;render();return true;}n.sait.push({id:fiRid('i'),txt,rev:!(isGest()&&g.hid),cree:new Date().toISOString(),par:ME||''});}}
    FI_AT=null;S.dlg=null;fiSave(n);return true;}
  if(a==='fiTyp'){if(!canEdit()||(FI_RES[d.g]||[]).includes(d.v))return true;fiOpenDlg({kind:'fiTyp',genre:d.g,type:d.v,nom:d.v,into:''});render();return true;}
  if(a==='fiTypSave'){const g=S.dlg;if(!g||g.kind!=='fiTyp'||!canEdit())return true;const to=(g.into||'').trim()||(g.nom||'').trim();S.dlg=null;
    if(to&&to!==g.type){fiTypApply(g.genre,g.type,to);setTimeout(()=>toast('Type mis à jour'),0);}else render();return true;}
  return false;}
/* Listes déroulantes des fenêtres de fiche */
/* UX2 : listes Type et Tri */
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset)return;if(t.dataset.fity!==undefined){S.fiTy=t.value||'';render();}else if(t.dataset.fiso!==undefined){uniSortSet(t.dataset.fiso,t.value);render();}});
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
const jrAides=j=>((j&&j.genre==='quete'&&j.type!=='groupe'&&j.aides)||[]).filter(id=>S.chars[id]);
const jrAidant=j=>!!ME&&jrAides(j).some(id=>owners(S.chars[id]).some(p=>p.id===ME));
const jrMine=j=>!!ME&&jrParts(j).some(id=>{const c=S.chars[id];return !!c&&owners(c).some(p=>p.id===ME);});
const jrCanEd=j=>!!j&&isUser()&&(isGest()||jrMine(j)||!!j.pub||jrAidant(j)); /* UX1 : visible = modifiable ; l'aidant ajoute ses entrées */
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
/* UX1 (28/11/2026) : lignes compactes, couleur laiton = personnelle, bleu = de groupe ; « + » dans l'en-tête ; aidants */
function jrCard(c,j){const n=(j.ent||[]).length,q=j.genre==='quete',st=j.statut||'cours';
  const cl=q?(j.type==='groupe'?'grp':'per'):'jou',bits=[];if(q)bits.push((JR_ST.find(x=>x[0]===st)||JR_ST[0])[1]);else if(j.type)bits.push(j.type);
  bits.push(n+' entrée'+(n>1?'s':''));if(q&&j.jauge)bits.push('jauge '+(j.jauge.cases||0)+' / '+j.jauge.taille);
  const A=jrAides(j).filter(id=>id!==c.id).map(id=>S.chars[id]).filter(x=>x&&vis(x)).map(x=>x.court);
  return `<button type="button" class="crow jrrow" data-act="jrOpen" data-j="${esc(j.id)}"><span class="jdot ${cl}" aria-hidden="true"></span><span class="cmain"><span class="t">${esc(j.nom)}</span><span class="s">${esc(bits.join(' · '))}${A.length?' · aidée par '+esc(A.join(', ')):''}</span></span><span class="muted small">${j.pub?'Public':'Privé'}</span><span class="chev" aria-hidden="true">›</span></button>`;}
function jrBlkP(k,title,sum,body,plus){const fold=shFolded(k,false);return `<section class="rblk"><div class="rbh"><button type="button" class="rbt" data-act="shFold" data-k="${k}" aria-expanded="${!fold}"><span class="tt"><span class="t">${title}</span>${sum!==''?`<span class="n">${sum}</span>`:''}</span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button>${plus||''}</div>${fold?'':`<div class="rbb">${body}</div>`}</section>`;}
const jrAideOf=c=>jrAll().filter(j=>jrAides(j).includes(c.id)&&!jrParts(j).includes(c.id)&&jrCanRead(j));
function jrView(c){const L=jrOf(c).concat(jrAideOf(c)),E=canEditC(c),open=S.jrOpen&&L.find(j=>j.id===S.jrOpen);
  if(open)return jrOpenView(c,open);
  const Q=jrOf(c).filter(j=>j.genre==='quete'),QA=jrAideOf(c).filter(j=>j.genre==='quete').sort(jrByNom),J=jrOf(c).filter(j=>j.genre==='journal').sort(jrByNom),sel=S.jrSel||(Q.length||QA.length?'q':'j'),who=esc(c.court||c.nom);
  const plus=g=>E?`<button type="button" class="pbtn" data-act="jrNew" data-g="${g}" aria-label="${g==='quete'?'Nouvelle quête':'Nouveau journal'}">+</button>`:'';
  let h=`<div class="seg jrsel" role="group" aria-label="Quêtes, journaux ou feuilleton">${[['q','Quêtes'],['j','Journaux'],['f','Feuilleton']].map(([k,l])=>`<button type="button" data-act="jrSel" data-v="${k}" aria-pressed="${sel===k}">${l}</button>`).join('')}</div>`;
  if(sel==='f')return h+chFeuil(c); /* lot 3 : événements vécus par le personnage */
  if(sel==='q'){h+=jrBlkP('jr-q','Quêtes de '+who,String(Q.length),Q.length?['cours','fin','aband'].map(s=>{const G=Q.filter(j=>(j.statut||'cours')===s).sort(jrByNom);return G.length?(s==='cours'?'':`<div class="jrgh">${JR_STG[s]}</div>`)+G.map(j=>jrCard(c,j)).join(''):'';}).join(''):'<div class="muted small">Aucune quête.</div>',plus('quete'));
    if(QA.length)h+=jrBlkP('jr-qa','Quêtes où il aide',String(QA.length),QA.map(j=>jrCard(c,j)).join(''),'');
    h+=`<div class="jrleg muted small"><span><i class="jdot per"></i> personnelle</span><span><i class="jdot grp"></i> de groupe</span><button type="button" class="qbtn" data-act="xpHelp" data-k="jr" aria-label="Aide">?</button></div>`;}
  else{h+=jrBlkP('jr-j','Journaux de '+who,String(J.length),J.map(j=>jrCard(c,j)).join('')||'<div class="muted small">Aucun journal.</div>',plus('journal'));
    h+=`<div class="jrleg muted small"><span style="flex:1"></span><button type="button" class="qbtn" data-act="xpHelp" data-k="jr" aria-label="Aide">?</button></div>`;}
  if((S.xpHelp||{}).jr)h+=`<div class="qtip2"><b>Privé</b> : le joueur du personnage (quête de groupe : ceux des participants ; quête aidée : ceux des aidants) et le MJ. <b>Public</b> : toute la table.</div>`;
  return h;}
/* Entrées repliables (24/11) : par défaut seule la plus récente est dépliée ; choix gardé pendant la session (S.jrEo) */
if(!S.jrEo)S.jrEo={};
const jrEntOpen=(e,last)=>e.id in S.jrEo?!!S.jrEo[e.id]:e.id===last;
function jrEntHtml(c,j,e,hl,open){const meta=[jrDjTxt(e.dj)],au=(e.auteur||'').trim(),pc=e.pc&&S.chars[e.pc];
  if(pc)meta.push('par '+(pc.court||pc.nom));if(au)meta.push('auteur : '+au); /* UX1 : entrée signée du PJ */
  if(e.ecrit)meta.push('écrite le '+fmtDate(e.ecrit));const m=meta.filter(Boolean).join(' · ');
  return `<div class="jrent${hl?' hlx':''}${open?'':' fold'}" id="jre-${esc(e.id)}"><div class="eh"><button type="button" class="jreh" data-act="jrEo" data-e="${esc(e.id)}" aria-expanded="${!!open}"><span class="chev" aria-hidden="true">${open?'⌄':'›'}</span><span class="en">${esc(e.nom||'Entrée')}</span></button>${S._jrEm&&jrEntEd(j,e)?`<button type="button" class="ibtn sm" data-act="jrEnt" data-j="${esc(j.id)}" data-e="${esc(e.id)}" aria-label="Modifier l'entrée ${esc(e.nom||'')}">${ICON.crayon}</button>`:''}</div>${m?`<div class="em">${esc(m)}</div>`:''}${open&&e.txt?fiRich(e.txt):''}</div>`;}
function jrOpenView(c,j){const q=j.genre==='quete',E=jrCanEd(j),k='jr-'+j.id,st=j.statut||'cours';
  const P=q&&j.type==='groupe'?`<div class="jrparts">${jrParts(j).map(id=>S.chars[id]).filter(Boolean).map(x=>`<span class="jrpc${x.id===c.id?' me':''}">${lk({t:'perso',id:x.id},x.court||x.nom)}</span>`).join('')}</div>`:'';
  const A=jrAides(j).map(id=>S.chars[id]).filter(x=>x&&vis(x)),H=S.chars[j.perso];
  let h=crumb(['Personnages','data-act="tab" data-v="team"'],[esc(c.court||c.nom),'data-act="jrBack"'],['Carnets','data-act="jrBack"']);
  h+=`<div class="jrhd"><div class="ttlrow"><div class="jrnm" style="flex:1"><span class="jdot ${q?(j.type==='groupe'?'grp':'per'):'jou'}" aria-hidden="true"></span> ${esc(j.nom)}</div>${E?`<button type="button" class="ibtn" data-act="jrEd" data-j="${esc(j.id)}" aria-label="Modifier">${ICON.crayon}</button>`:''}</div><div class="jrmt"><span class="jrty">${q?jrQType(j):esc(j.type||'Sans type')}</span>${jrSw(j,E)}</div>${P}${A.length?`<div class="small">${H&&H.id!==c.id?'Quête de '+lk({t:'perso',id:H.id},H.court)+' · ':''}aidée par ${A.map(x=>lk({t:'perso',id:x.id},x.court)).join(', ')}</div>`:''}`
    +(q?(E?`<div class="seg sm jrst" role="group" aria-label="Statut de la quête">${JR_ST.map(([v,l])=>`<button type="button" data-act="jrStat" data-j="${esc(j.id)}" data-v="${v}" aria-pressed="${st===v}">${l}</button>`).join('')}</div>`
      :`<div class="jrmt"><span class="jrstx ${st}">${(JR_ST.find(x=>x[0]===st)||JR_ST[0])[1]}</span></div>`):'')+`</div>`;
  if(j.desc)h+=cBlk(k+'-d','Description','',fiRich(j.desc)); /* UX1 : bloc vide masqué */
  if(q){const J=j.jauge,F=j.jaugesFinies||[];
    const box=J?jaugeBox(c,E,{...J,diffShow:J.diff!=null&&J.diff!==''?+J.diff:null},`<div class="relh"><span><b>${esc(J.nom)}</b></span></div>`,{id:j.id,add:'jrJgAdd',del:'jrJgDel',val:'jrJgVal'}):'';
    const fin=F.map(x=>jaugeBox(c,false,{...x,done:true},`<div class="relh"><span><b>${esc(x.nom)}</b></span><span class="muted small">validée${x.fin?' le '+fmtDate(x.fin):''}</span></div>`,{})).join('');
    if(J||F.length)h+=cBlk(k+'-g','Jauge de recherche',J?(J.cases||0)+' / '+J.taille:'',box+fin+(J?`<div class="muted small">Aussi dans Relations › Autres jauges${j.type==='groupe'?' de chaque participant':''}.</div>`:F.length?'':'<div class="muted small">Aucune jauge ouverte.</div>'),
      E&&!J?`<div class="relbtns"><button type="button" class="addl" data-act="jrJgNew" data-j="${esc(j.id)}">+ Jauge de recherche</button></div>`:'');}
  const ents=jrEntSorted(j),hl=S.jrHl,last=ents.length?ents[ents.length-1].id:'';if(hl)S.jrEo[hl]=true;
  const nOpen=ents.filter(e=>jrEntOpen(e,last)).length,all=ents.length>1?`<div class="jrall"><button type="button" class="lk" data-act="jrEoAll" data-j="${esc(j.id)}" data-v="${nOpen===ents.length?'0':'1'}">${nOpen===ents.length?'Tout replier':'Tout déplier'}</button></div>`:'';
  const em=!!(S.jrEm&&S.jrEm[j.id]);S._jrEm=em;
  h+=jrBlkP(k+'-e','Entrées',String(ents.length),(ents.length?all+ents.map(e=>jrEntHtml(c,j,e,hl===e.id,jrEntOpen(e,last))).join(''):'<div class="muted small">Aucune entrée.</div>')+(E&&!j.jauge&&q&&!(j.jaugesFinies||[]).length?`<div class="relbtns"><button type="button" class="addl" data-act="jrJgNew" data-j="${esc(j.id)}">+ Jauge de recherche</button></div>`:''),
    E?`${ents.length?`<button type="button" class="ibtn sm" data-act="jrEm" data-j="${esc(j.id)}" aria-pressed="${em}" aria-label="Modifier les entrées">${ICON.crayon}</button>`:''}<button type="button" class="pbtn" data-act="jrEnt" data-j="${esc(j.id)}" aria-label="Nouvelle entrée">+</button>`:'');
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
      ${q&&!grp&&j?`<div class="field"><span class="flab">Aidants <span class="muted">— facultatif</span></span><div class="jrparts">${pjs.filter(x=>x.id!==(g.hold||c.id)).map(x=>{const on=(g.aides||[]).includes(x.id);return `<button type="button" class="jrpc${on?' on':''}" data-act="jrAide" data-v="${esc(x.id)}" aria-pressed="${on}">${esc(x.court||x.nom)}</button>`;}).join('')}</div><div class="muted small">L'aidant voit la quête dans ses Carnets et y ajoute ses entrées.</div></div>`:''}
      ${grp?`<div class="field"><span class="flab">Participants</span><div class="jrparts">${pjs.map(x=>{const on=g.parts.includes(x.id)||(g.aides||[]).includes(x.id),me=x.id===(g.hold||c.id);return `<button type="button" class="jrpc${on?' on':''}${me?' me':''}" data-act="jrPart" data-v="${esc(x.id)}" aria-pressed="${on}"${me?' disabled':''}>${esc(x.court||x.nom)}</button>`;}).join('')}</div><div class="muted small">${esc(c.court||c.nom)} en fait toujours partie. La quête s'affiche sur la fiche de chaque participant.</div></div>`:''}
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
  if(a==='jrEd'){const j=S.jour[d.j];if(!c||!jrCanEd(j))return true;fiOpenDlg({kind:'jrHead',cid:c.id,id:j.id,genre:j.genre,nom:j.nom||'',type:j.genre==='journal'?(j.type||''):'',qt:j.type==='groupe'?'groupe':'perso',parts:jrParts(j).slice(),aides:jrAides(j).slice(),hold:j.perso||jrParts(j)[0]||c.id,txt:j.desc||'',pub:!!j.pub});render();return true;}
  if(a==='jrEm'){S.jrEm={...(S.jrEm||{}),[d.j]:!(S.jrEm||{})[d.j]};render();return true;}
  if(a==='jrAide'){if(g&&g.kind==='jrHead'&&d.v!==(g.hold||g.cid)){const L=g.aides||[];g.aides=L.includes(d.v)?L.filter(x=>x!==d.v):[...L,d.v];redraw();}return true;}
  if(a==='jrSet'){if(g&&(g.kind==='jrHead')){g[d.k]=d.k==='pub'?d.v==='1':d.v;if(d.k==='qt'&&d.v==='groupe'&&!g.parts.includes(g.cid))g.parts=[g.cid,...g.parts];redraw();}return true;}
  if(a==='jrPart'){if(g&&g.kind==='jrHead'&&d.v!==(g.hold||g.cid)){g.parts=g.parts.includes(d.v)?g.parts.filter(x=>x!==d.v):[...g.parts,d.v];redraw();}return true;}
  if(a==='jrHeadSave'){if(!g||g.kind!=='jrHead')return true;const cc=S.chars[g.cid],nom=(g.nom||'').trim();if(!cc||!nom)return true;
    const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||''),q=g.genre==='quete',grp=q&&g.qt==='groupe';
    /* UX1 : titulaire gardé ; aidants d'une quête personnelle ; passage groupe ↔ personnelle */
    const hold=g.hold||cc.id,ok=id=>!!S.chars[id];
    const parts=grp?[...new Set([hold,...g.parts,...(g.aides||[])])].filter(ok):[hold];
    const aides=grp?[]:[...new Set([...(g.aides||[]),...(g.parts||[])])].filter(id=>id!==hold&&ok(id));
    if(g.id){const j=S.jour[g.id];if(!jrCanEd(j))return true;S.dlg=null;FI_AT=null;
      jrUpd(j.id,x=>{x.nom=nom;x.desc=txt;x.pub=!!g.pub;if(q){x.type=grp?'groupe':'perso';x.parts=parts;if(!grp){x.perso=hold;if(aides.length)x.aides=aides;else delete x.aides;}else delete x.aides;}else x.type=(g.type||'').trim();});
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
const PN_EYE0={role:true,app:true,car:true,fm:true,pw:true,titres:true,familles:true,orgs:true,lieux:true,poss:true};
const pnEye=c=>(c&&c.eye)||PN_EYE0;
const pnBlkSee=(c,k)=>!!c&&vis(c)&&(isGest()||isFeal(c)||k!=='pw'||!!pnEye(c)[k]); /* UX2 : un seul œil par fiche, sauf le bloc Pouvoirs et capacités */
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
  const ed=o.edit?`<button type="button" class="ibtn sm" data-act="${o.edit}"${o.ea||''} aria-label="Modifier">${ICON.crayon}</button>`:'';
  return `<section class="rblk${o.hid?' fihid':''}"><div class="rbh"><button type="button" class="rbt" data-act="pnFold" data-k="${k}"${o.empty?' data-e="1"':''} aria-expanded="${!fold}" aria-controls="${id}"><span class="tt"><span class="t">${title}</span>${sum!==''&&sum!=null?`<span class="n">${sum}</span>`:''}</span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button>${ed}${o.eye||''}</div>${fold?'':`<div class="rbb" id="${id}">${body}</div>`}</section>`;}
const pnEyeB=(c,k,lab)=>isGest()&&!isFeal(c)?eyeBtn('pnEye',`data-k="${k}"`,!!pnEye(c)[k],lab):'';
const pnAv=c=>{const im=portrait(c);return `<span class="pnav">${im?`<img src="${im}" alt="">`:`<span class="ini">${esc(pnName(c).slice(0,1))}</span>`}</span>`;};

/* ---------- Personnages › PNJ : liste ---------- */
function pnListView(){const G=isGest(),F=S.pnF||{},all=ids().map(i=>S.chars[i]).filter(c=>c.type==='PNJ');
  const opts=k=>{const m={};for(const c of all)for(const n of (k==='lieux'?pnSitNames(c,'lieux'):pnSitNames(c,k)))m[n]=1;return Object.keys(m).sort((a,b)=>a.localeCompare(b,'fr'));};
  const sel=(k,l)=>{const O=opts(k),v=F[k]||'';if(!O.length&&!v)return '';return `<label class="pnchip${v?' on':''}"><span>${esc(v?l+' : '+v:l)}</span><span aria-hidden="true">${v?'✕':'▾'}</span><select data-pnf="${k}" aria-label="Filtrer par ${esc(l.toLowerCase())}"><option value="">${esc(l)} : tous</option>${O.map(o=>`<option${o===v?' selected':''}>${esc(o)}</option>`).join('')}</select></label>`;};
  const RK=[...new Set(all.map(c=>rangOf(c)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr')),RC=[...new Set(all.filter(c=>c.race).map(c=>c.race))].sort((a,b)=>a.localeCompare(b,'fr'));
  const sel2=(k,l,O)=>{const v=F[k]||'';return `<label class="ux2dd${v?' on':''}"><span>${l} :</span><select data-pnf="${k}" aria-label="${esc(l)}"><option value="">Tous</option>${O.map(o=>`<option${o===v?' selected':''}>${esc(o)}</option>`).join('')}</select></label>`;};
  const nf=['familles','orgs','lieux','rang','race'].filter(k=>F[k]).length;
  let h=`<div class="pghead"><h2>PNJ</h2>${pnCanNew()?`<button type="button" class="pbtn big" data-act="pnNew" aria-label="Nouveau PNJ">+</button>`:''}</div>`;
  h+=`<div class="ux2tb"><input type="search" data-pnq="1" value="${esc(S.pnQ||'')}" placeholder="Filtrer les PNJ" aria-label="Filtrer les PNJ" autocomplete="off">`
    +`<details class="ux2flt"${nf||S.pnFo?' open':''}><summary>Filtres${nf?' · '+nf:''} ▾</summary><div class="ux2sel">${sel2('rang','Rang',RK)}${sel2('race','Race',RC)}${sel2('familles','Famille',opts('familles'))}${sel2('orgs','Organisation',opts('orgs'))}${sel2('lieux','Lieu',opts('lieux'))}${G?`<button type="button" class="chip" data-act="pnPrepF" aria-pressed="${!!S.pnPrep}">Préparés seulement</button>`:''}</div></details></div>`;
  h+=`<div id="pnRes">${pnListBody()}</div>`;
  return h;}
function pnListBody(){const G=isGest(),F=S.pnF||{},q=nrm(S.pnQ||'');
  let L=ids().map(i=>S.chars[i]).filter(c=>c.type==='PNJ');
  if(!L.length)return `<div class="card empty">Aucun PNJ pour l'instant.</div>`;
  L=L.filter(c=>(!q||nrm(c.court).includes(q)||nrm(c.nom).includes(q)||nrm(c.surnom||'').includes(q))&&(!G||!S.pnPrep||!pnRev(c))&&['familles','orgs','lieux'].every(k=>!F[k]||pnSitNames(c,k).includes(F[k]))&&(!F.rang||rangOf(c)===F.rang)&&(!F.race||c.race===F.race));
  if(!L.length)return `<div class="card empty">Aucun PNJ ne correspond.</div>`;
  L.sort((a,b)=>pnName(a).localeCompare(pnName(b),'fr',{sensitivity:'base'}));
  const row=c=>{const m=pnMain(c),org=pnSitNames(c,'orgs')[0]||'',res=pnRes(c);
    const sub=G&&m?`<small class="pnreal">alias de ${esc(pnName(m))}${org?' · '+esc(org):''}</small>`:`<small>${esc([pnRaceTxt(c),isFeal(c)?'Féal de '+pnName(S.chars[c.pj]):org,res].filter(Boolean).join(' · '))}</small>`;
    const rk=!actif(c)?`<span class="pndead">${c.statut==='mort'?'† '+(c.genre==='f'?'morte':'mort'):esc(STATUTS[c.statut]||'')}</span>`:!pnRev(c)?`<span class="ux2prep">${EYE_C}préparé</span>`:'';
    return `<button type="button" class="pnli${pnRev(c)?'':' prep'}" data-act="sel" data-id="${esc(c.id)}">${pnAv(c)}<span class="pntx"><b>${esc(pnName(c))}${(c.surnom||'').trim()?` <i class="pnsur">« ${esc(c.surnom.trim())} »</i>`:''}</b>${sub}</span>${rk}</button>`;};
  const fk=['familles','orgs','lieux','rang','race'].find(k=>F[k]);
  if(fk)return `<div class="pgrp">${esc(F[fk])} · ${L.length}</div><div class="plst pnlst">${L.map(row).join('')}</div>`;
  const grp={};for(const c of L){const k=(nrm(pnName(c))[0]||'#').toUpperCase();(grp[k]=grp[k]||[]).push(c);}
  return Object.keys(grp).map(k=>`<div class="pgrp">${esc(k)}</div><div class="plst pnlst">${grp[k].map(row).join('')}</div>`).join('');}

/* ---------- Fiche PNJ : en-tête ---------- */
function pnSheetHead(c){const G=isGest(),fe=isFeal(c);if(!fe)return pnHeadUX2(c);
  let h=fe?'':crumb(CR_UNI,['PNJ','data-act="pnBack"'],[esc(c.court||c.nom)]);
  if(G&&!fe){const e=pnEye(c),K=pnVisKeys(c),n=K.filter(k=>e[k]).length;
    h+=!pnRev(c)?`<div class="fivis prep"><span class="fivi" aria-hidden="true">${EYE_C}</span><span class="fivt"><b>Fiche préparée</b> · invisible des joueurs</span><button class="btn pri" data-act="pnEye" data-k="fiche">Révéler</button></div>`
      :`<div class="fivis">${eyeBtn('pnEye','data-k="fiche"',true,'Fiche '+pnName(c))}<span class="fivt"><b>Fiche révélée</b> · ${n} bloc${n>1?'s':''} sur ${K.length} visible${n>1?'s':''}</span></div>`;}
  const im=portrait(c),inner=im?`<img src="${im}" alt="">`:`<span class="ini">${esc(pnName(c).slice(0,1))}</span>`;
  const med=canPortrait(c)?`<label class="shmed ed" aria-label="Changer le portrait de ${esc(pnName(c))}">${inner}<span class="pen" aria-hidden="true">✎</span><input type="file" accept="image/*" data-ptrfile="${esc(c.id)}" hidden></label>`:im?`<button type="button" class="shmed" data-act="fiImg" data-cid="${esc(c.id)}" aria-label="Agrandir le portrait de ${esc(pnName(c))}">${inner}</button>`:`<span class="shmed">${inner}</span>`;
  const tit=pnSitNames(c,'titres')[0],fam=pnSitNames(c,'familles')[0],age=(typeof chAgeTxt==='function'&&chAgeTxt(c)||{}).age;
  const kv=[['Race',c.race?raceLk(c)+(pnFeal(c)?' · féal':''):''],['Titre',tit?esc(tit):''],['Famille',fam?esc(fam):''],['Rang',esc(rangOf(c))],['Âge',age?esc(age):''],['Statut',esc(STATUTS[c.statut||'actif']||'')]].filter(x=>x[1]);
  h+=`<div class="card pnhead"><div class="shhd">${med}<div style="flex:1;min-width:0"><div class="shname"><span>${esc(c.nom||c.court)}</span>${kankaBtn(c.kanka,c.nom||c.court,'Fiche Kanka de '+pnName(c))}</div>${(c.surnom||'').trim()?`<div class="shsur">« ${esc(c.surnom.trim())} »</div>`:''}${fe?`<div class="small pnfeal">Féal de ${lk({t:'perso',id:c.pj},pnName(S.chars[c.pj]))}</div>`:''}<div class="pnkv">${kv.map(([a,b])=>`<span>${a}</span><b>${b}</b>`).join('')}</div></div></div>${canEditC(c)?`<div style="margin-top:8px"><button type="button" class="edl" data-act="pcOpen" data-id="${esc(c.id)}">${ICON.crayon} En-tête</button></div>`:''}</div>`;
  return h;}
const pnVisKeys=c=>(c.alias?['idr']:[]).concat(PN_POR.filter(([k])=>k!=='fm'||pnHasFm(c)).map(x=>x[0]),['pw'],PN_SIT.map(x=>x[0]),['autres']);


/* ---------- UX2 (28/11/2026) : PNJ sur une page ---------- */
function pnHeadUX2(c){const G=isGest(),E=canEditC(c);
  const eye=G?(pnRev(c)?`<button type="button" class="ibtn" data-act="pnEye" data-k="fiche" aria-label="Fiche révélée : la préparer">${EYE_O}</button>`:`<button type="button" class="ibtn prepi" data-act="pnEye" data-k="fiche" aria-label="Fiche préparée : la révéler">${EYE_C}</button>`):'';
  let h=`<div class="ux2top">${crumb(CR_UNI,['PNJ','data-act="pnBack"'])}<span class="ux2sp"></span>${eye}${E?`<button type="button" class="ibtn" data-act="pcOpen" data-id="${esc(c.id)}" aria-label="Modifier l'identité">${ICON.crayon}</button>`:''}</div>`;
  const im=portrait(c),inner=im?`<img src="${im}" alt="">`:`<span class="ini">${esc(pnName(c).slice(0,1))}</span>`;
  const med=im?`<button type="button" class="ux2pnav" data-act="fiImg" data-cid="${esc(c.id)}" aria-label="Agrandir le portrait de ${esc(pnName(c))}">${inner}</button>`:canPortrait(c)?`<label class="ux2pnav" aria-label="Ajouter un portrait">${inner}<input type="file" accept="image/*" data-ptrfile="${esc(c.id)}" hidden></label>`:`<span class="ux2pnav">${inner}</span>`;
  const tit=pnSitNames(c,'titres')[0],fam=pnSitNames(c,'familles')[0],age=(typeof chAgeTxt==='function'&&chAgeTxt(c)||{}).age,occ=((c.por||{}).occ||'').trim();
  const aka=pnAliases(c).filter(a=>G||(vis(a)&&pnBlkSee(a,'idr'))).map(a=>pnName(a));
  const kv=[['Race',c.race?raceLk(c)+(pnFeal(c)?' · féal':''):''],['Titre',tit?esc(elid(tit)):''],['Famille',fam?esc(fam):''],['Occupation',occ?esc(occ):''],['Rang',esc(rangOf(c))],['Âge',age?esc(age):''],['Statut',(c.statut||'actif')!=='actif'?esc(STATUTS[c.statut]||''):'']].filter(x=>x[1]);
  h+=`<section class="ux2pnid"><div class="ux2pnhd">${med}<div style="flex:1;min-width:0"><h2 class="finm">${esc(c.nom||c.court)}${(c.surnom||'').trim()?` <i class="pnsur">« ${esc(c.surnom.trim())} »</i>`:''}</h2>${aka.length?`<div class="muted small">Aussi connu sous : ${aka.map(esc).join(', ')}</div>`:''}${!pnRev(c)?`<span class="ux2prep">${EYE_C}préparé</span>`:''}</div></div><div class="pnkv ux2kv">${kv.map(([a,b])=>`<span>${a}</span><b>${b}</b>`).join('')}</div></section>`;
  return h;}
function pnDescOf(c){const p=c.por||{};return (p.desc||'').trim()||[p.role,p.app,p.car].map(x=>(x||'').trim()).filter(Boolean).join('\n\n');}
function pnPage(c){const G=isGest(),E=canEditC(c),comp=[];let h='';
  const m=pnMain(c);if(m&&pnBlkSee(c,'idr'))h+=fiBlk('pn-idr','Identité réelle','',`Alias de ${lk({t:'perso',id:m.id},pnName(m))}`+(E?`<div class="relbtns"><button type="button" class="addl" data-act="pnAliasOff">Détacher de ${esc(pnName(m))}</button></div>`:''));
  if(E&&!((c.por||{}).occ||'').trim())comp.push(['Occupation','pnTxt',' data-b="occ"']);
  const d=pnDescOf(c);if(d)h+=fiBlk('pn-desc','Description','',fiClamp(c.id+':desc',fiRich(d)),{edit:E?'pnTxt':'',ea:' data-b="desc"'});else if(E)comp.push(['Description','pnTxt',' data-b="desc"']);
  /* Ce que l'on sait / À révéler */
  const A=c.sait||[],V=A.filter(it=>it.rev),Hd=A.filter(it=>!it.rev);
  if(V.length)h+=fiBlk('pn-sait',"Ce que l'on sait",String(V.length),V.map(it=>fiItRow(c,it,E).replace(/data-act="fiItem"/g,'data-act="pnItem"')).join(''),{plus:E?'pnItem':'',pa:' data-i="" data-h="0"'});else if(E)comp.push(["Ce que l'on sait",'pnItem',' data-i="" data-h="0"']);
  if(G){if(Hd.length)h+=fiBlk('pn-arev','À révéler',String(Hd.length),`<div class="ux2arh">${EYE_C}Invisible des joueurs · un élément révélé passe dans « Ce que l'on sait »</div>`+Hd.map(it=>fiItRow(c,it,E,true).replace(/data-act="fiItem"/g,'data-act="pnItem"').replace(/data-act="fiRevIt"/g,'data-act="pnRevIt"')).join(''),{plus:'pnItem',pa:' data-i="" data-h="1"',cls:'ux2arev'});else comp.push(['À révéler','pnItem',' data-i="" data-h="1"']);}
  /* Forme : démasquée / masquée */
  const fm=((c.por||{}).fm||'').trim(),im=portrait(c);
  if(pnHasFm(c)&&fm){const msk=!!(S.pnFm||{})[c.id];
    h+=fiBlk('pn-fm','Forme','',`<div class="seg ux2seg" role="group" aria-label="Forme"><button type="button" data-act="pnFmT" data-v="0" aria-pressed="${!msk}">Démasquée</button><button type="button" data-act="pnFmT" data-v="1" aria-pressed="${msk}">Masquée</button></div><div class="ux2fm">${msk?fiRich(fm):im?`<button type="button" class="ux2heroimg" data-act="fiImg" data-cid="${esc(c.id)}" aria-label="Agrandir"><img src="${im}" alt=""></button>`:'<div class="muted small">Pas de portrait.</div>'}</div>`,{edit:E?'pnTxt':'',ea:' data-b="fm"'});}
  else if(E&&pnHasFm(c))comp.push(['Forme masquée','pnTxt',' data-b="fm"']);
  const PB=pnPwBlk(c,E,G,pnEye(c));if(PB&&!PB.e)h+=PB.h;else if(PB&&E)comp.push(['Pouvoirs et capacités','pnPw','']);
  /* Situation : organisations, titres, familles, lieux */
  const parts=[];for(const [k,l] of [['orgs','Organisations'],['titres','Titres'],['familles','Familles'],['lieux','Lieux']]){if(!pnBlkSee(c,k))continue;const OG=k==='orgs'||k==='titres'?ogSitRows(c,k):k==='familles'?faSitRows(c):null,R=OG||pnSitRows(c,k);if(!R.length)continue;
    const rows=OG?OG.join(''):R.map(x=>`<div class="srow"><span>${x._k==='lieux'?situLieuH(x):situNm(x)}${x._k==='fiefs'?' <span class="muted">· fief</span>':''}${x.note?`<span class="d">${esc(x.note)}</span>`:''}</span>${E?`<button type="button" class="ibtn sm" data-act="situEd" data-k="${x._k}" data-i="${esc(x.id)}" aria-label="Modifier ${esc(x.nom)}">${ICON.crayon}</button>`:''}</div>`).join('');
    parts.push(`<div class="fimg">${l}</div>${rows}`);}
  const adds=E?`<div class="ux2comp">${[['orgs','Organisation'],['titres','Titre'],['familles','Famille'],['lieux','Lieu']].map(([k,l])=>`<button type="button" class="ux2cb" data-act="situEd" data-k="${k}">+ ${l}</button>`).join('')}</div>`:'';
  if(parts.length)h+=fiBlk('pn-situ','Situation','',parts.join('')+adds);else if(E)comp.push(['Situation','situEd',' data-k="orgs"']);
  if(E&&!m&&!isFeal(c))comp.push(['Alias','pnAlias','']); /* rattacher un alias (identité secrète) */
  h+=caOnMap('perso',c.id);
  /* PJ liés */
  const fp=isFeal(c)&&vis(S.chars[c.pj])?S.chars[c.pj]:null;
  const P=pjIds().map(i=>S.chars[i]).filter(Boolean).flatMap(pj=>(pj.rel||[]).filter(r=>r.pnj===c.id).concat(relsOf(pj).filter(r=>r.src==='pp'&&r.pnj===c.id)).map(r=>({pj,r})));
  if(P.length)h+=fiBlk('pn-pjl','PJ liés',String(P.length),P.map(({pj,r})=>`<div class="srow"><span>${lk({t:'perso',id:pj.id},pj.court)} <span class="muted">· ${esc(REL_NIV[r.niv]||r.niv||'')}</span>${r.src==='pp'?' <span class="muted small">(PP)</span>':''}</span></div>`).join(''));
  const M=fiMentions('perso',c.id);if(M.length)h+=fiBlk('pn-ment','Mentions',String(M.length),fiMentionsHtml(M));
  return h+fiComp(comp);}
/* ---------- Fiche PNJ : onglets ---------- */
function pnSheetBody(c,s,id){if(!isFeal(c))return pnPage(c);const tab=shTabOf(c);let h=shTabsBar(c,tab);
  if(tab==='prog'){ /* UX1 : XP dans l'en-tête ; dérivées en icônes */
    h+=cBlk('pn-der','Valeurs dérivées','',`<div class="dg">${derived(c,'m').map(([n,v])=>`<span class="dt" title="${esc(n)}" aria-label="${esc(n)} : ${v}">${derIco(n)}<b class="num">${v}</b></span>`).join('')}</div>`);
    return h+viewProg(c,s,id);}
  if(tab==='situ')h+=pnSitu(c)+caOnMap('perso',c.id);else if(tab==='rel')h+=pnRel(c);else h+=pnPortrait(c); /* lot Cartes : Sur la carte */
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
  const PB=pnPwBlk(c,E,G,e);if(PB)B.push(PB); /* pouvoirs et capacités (import Kanka fin) */
  h+=shOrder(B);
  if(!h&&!G)h=`<div class="card"><span class="muted small">Rien de connu pour l'instant.</span></div>`;
  return h;}
function pnSitu(c){const G=isGest(),E=canEditC(c),e=pnEye(c),B=[];
  for(const [k,l] of PN_SIT){if(!pnBlkSee(c,k))continue;const OG=k==='orgs'||k==='titres'?ogSitRows(c,k):k==='familles'?faSitRows(c):null; /* lot 5 a ; lot 5 b */const R=OG||pnSitRows(c,k),nO=k==='poss'?fi6ObjsOf(c.id).length:0;if(!R.length&&!nO&&!E&&!G)continue;
    const rows=OG?OG.join(''):(k==='poss'?situObjRows(c).join(''):'')+R.map(x=>`<div class="srow"><span>${x._k==='lieux'?situLieuH(x):situNm(x)}${x._k==='orgs'&&x.role?` <span class="muted">· ${esc(x.role)}</span>`:''}${x._k==='fiefs'?' <span class="muted">· fief</span>':''}${x.note?`<span class="d">${esc(x.note)}</span>`:''}</span>${E?`<button type="button" class="ibtn" data-act="situEd" data-k="${x._k}" data-i="${esc(x.id)}" aria-label="Modifier ${esc(x.nom)}">✎</button>`:''}</div>`).join('');
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
  if(g.kind==='pnPw')return pnPwSheet(g); /* pouvoirs et capacités */
  if(g.kind==='pnTxt'){const c=S.chars[g.cid];if(!c||!canEditC(c))return null;const tt=({occ:'Occupation',desc:'Description',item:g.hid?'À révéler':"Ce que l'on sait"})[g.b]||(PN_POR.find(x=>x[0]===g.b)||[,''])[1];
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
  if(a==='pnFmT'){if(c)S.pnFm={...(S.pnFm||{}),[c.id]:d.v==='1'};render();return true;}
  if(a==='pnSet'){if(g&&FI_DLG.has(g.kind)){g[d.k]=d.v;if(d.k==='vis'||d.k==='mode')g.err='';S._fiRedraw=true;render();}return true;}
  if(S.visit)return true;
  if(a==='pnEye'){if(!c||c.type!=='PNJ'||!isGest()||isFeal(c))return true;const n=clone(c);let open;
    if(d.k==='fiche'){open=!pnRev(n);if(!open&&!canEdit())return true;n.vis=open?'rev':'prep';}
    else{const e={...pnEye(n)};open=!e[d.k];if(!open&&!canEdit())return true;e[d.k]=open;n.eye=e;}
    pnSaveC(n);setTimeout(()=>toast(open?'Visible par toute la table':'Caché aux joueurs'),0);return true;}
  if(a==='pnPw'){if(!c||!canEditC(c))return true;const P=pnPwOf(c);fiOpenDlg({kind:'pnPw',cid:c.id,pw:P.pw.slice(),cap:P.cap.slice()});render();return true;}
  if(a==='pnPwX'&&g&&g.kind==='pnPw'){if(d.t==='pw'||d.t==='cap')g[d.t]=g[d.t].filter(x=>x!==d.id);S._fiRedraw=true;render();return true;}
  if(a==='pnPwSave'&&g&&g.kind==='pnPw'){const x=S.chars[g.cid];if(!x||!canEditC(x))return true;const n=clone(x);if(g.pw.length||g.cap.length)n.pnpw={pw:g.pw.slice(),cap:g.cap.slice()};else delete n.pnpw;S.dlg=null;pnSaveC(n);setTimeout(()=>toast('Enregistré'),0);return true;}
  if(a==='pnTxt'){if(!c||!canEditC(c))return true;fiOpenDlg({kind:'pnTxt',cid:c.id,b:d.b,txt:d.b==='desc'?pnDescOf(c):(c.por||{})[d.b]||''});render();return true;}
  if(a==='pnItem'){if(!c||!canEditC(c))return true;const it=d.i?(c.sait||[]).find(x=>x.id===d.i):null;fiOpenDlg({kind:'pnTxt',cid:c.id,b:'item',iid:it?it.id:'',hid:d.h==='1',txt:it?it.txt:''});render();return true;}
  if(a==='pnRevIt'){if(!c||!isGest())return true;const n=clone(c),it=(n.sait||[]).find(x=>x.id===d.i);if(!it)return true;it.rev=true;it.revDj=typeof chNow==='function'?chNow():null;pnSaveC(n);setTimeout(()=>toast("Révélé : ajouté à « Ce que l'on sait »"),0);return true;}
  if(a==='pnTxtSave'){const x=g&&S.chars[g.cid];if(!x||!canEditC(x))return true;const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||'');
    const n=clone(x);if(g.b==='item'){n.sait=(n.sait||[]).slice();if(g.iid){const i=n.sait.findIndex(y=>y.id===g.iid);if(i>=0){if(txt)n.sait[i]={...n.sait[i],txt};else n.sait.splice(i,1);}}else if(txt)n.sait.push({id:fiRid('i'),txt,rev:!(isGest()&&g.hid),cree:new Date().toISOString(),par:ME||''});}
    else if(g.b==='occ')n.por={...(n.por||{}),occ:(ed?ed.innerText:txt).replace(/\s+/g,' ').trim()};
    else if(g.b==='desc'){n.por={...(n.por||{}),desc:txt};delete n.por.role;delete n.por.app;delete n.por.car;}
    else n.por={...(n.por||{}),[g.b]:txt};FI_AT=null;S.dlg=null;pnSaveC(n);return true;}
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
const fiEyeKeys=f=>(f&&f.genre==='chrono'?['desc']:['desc','sait']).concat((FI6_EYE[f&&f.genre]||[]).filter(k=>k!=='fief'||fiIsFief(f)));
const fiCN=c=>c?(c.type==='PNJ'&&typeof pnName==='function'?pnName(c):(c.court||c.nom||'?')):'?';
const SITU_NAT={res:'résidence',prop:'propriétaire',autre:'autre lieu'};
const situNat=e=>e.nat||(e.res?'res':'autre');
/* 28/11 (lot 2 bis) : natures cumulables (Résidence, Propriétaire, Travail) + texte libre ; e.nat / e.res gardés pour compatibilité */
const SITU_N3=[['res','Résidence','résidence'],['prop','Propriétaire','propriétaire'],['trav','Travail','travail']];
const situNats=e=>Array.isArray(e.nats)?e.nats.filter(n=>SITU_N3.some(x=>x[0]===n)):(n=>n==='autre'?[]:[n])(situNat(e));
const situNatX=e=>(e.natx||'').trim();
const situNatTxt=e=>situNats(e).map(n=>SITU_N3.find(x=>x[0]===n)[2]).concat(situNatX(e)?[situNatX(e)]:[]).join(', ');
const situNatV=(L,x)=>{const nats=SITU_N3.map(y=>y[0]).filter(n=>(L||[]).includes(n)),natx=(x||'').trim();return {nats,natx,nat:nats[0]||'autre',res:nats.includes('res')};};
/* Chemin d'un lieu : parents visibles, du plus haut au plus proche */
function lieuPath(id){const P=[];let p=id&&S.fiches[id],g=0;p=p&&p.parent&&S.fiches[p.parent];while(p&&p.genre==='lieu'&&g++<8){if(fiSee(p))P.unshift(p);p=p.parent&&S.fiches[p.parent];}return P;}
function lieuPathH(id){const P=lieuPath(id);if(!P.length)return '';const Q=P.length>2?[P[0],null,P[P.length-1]]:P;return `<span class="muted lpath">${Q.map(p=>p?lk({t:'fiche',id:p.id},p.nom):'…').join(' › ')} › </span>`;}
/* Ligne de Situation d'un lieu : chemin + nom + natures */
const situLieuH=e=>(e.f&&S.fiches[e.f]?lieuPathH(e.f):'')+situNm(e)+(situNatTxt(e)?` <span class="muted">· ${esc(situNatTxt(e))}</span>`:'');
const fi6CV=()=>Object.values(S.chars||{}).filter(c=>vis(c)).sort((a,b)=>(a.type===b.type?0:a.type==='PJ'?-1:1)||fiCN(a).localeCompare(fiCN(b),'fr',{sensitivity:'base'}));
/* Un joueur ne voit le lien d'un PNJ que si le bloc correspondant de sa fiche est révélé */
const fi6CSee=(c,k)=>c.type!=='PNJ'||typeof pnBlkSee!=='function'||pnBlkSee(c,k);
/* Liens d'un personnage vers une fiche (Situation, éléments de PP) */
function fi6CharLinks(fid){const out=[];for(const c of fi6CV()){const s=c.situ||{};
    if(fi6CSee(c,'lieux')){for(const e of s.lieux||[])if(e.f===fid)out.push({c,nat:situNat(e),k:'lieux',sid:e.id,lab:situNatTxt(e)||'lieu'});
      for(const e of s.fiefs||[])if(e.f===fid)out.push({c,nat:'fief',k:'fiefs',sid:e.id,lab:'fief'});}
    if(fi6CSee(c,'poss'))for(const [a,x] of Object.entries(c.ppLk||{}))if(x===fid){const b=(c.achats||[]).find(y=>y.id===a);if(b&&b.ppel)out.push({c,nat:'prop',k:'pp',sid:a,lab:b.ppel.nom,pp:b.ppel.nom});}}
  return out;}
/* Objets détenus par un personnage (calculés depuis les objets) */
const fi6ObjsOf=cid=>fiSort(fiAll().filter(o=>o.genre==='objet'&&fiBlkSee(o,'det')&&(o.det||[]).some(x=>x.id===cid)));
const fi6Unlk=(m,o)=>`<button type="button" class="ibtn" data-act="fi6Unlk" data-m="${m}"${Object.entries(o).map(([k,v])=>` data-${k}="${esc(v)}"`).join('')} aria-label="Retirer ce lien">✕</button>`;
const fi6Ref=(f,nom)=>{const x=f&&S.fiches[f];return x&&fiSee(x)?lk({t:'fiche',id:x.id},x.nom):`<b>${esc(x?x.nom:(nom||''))}</b>`;};
const fi6Calc=()=>''; /* UX2 : « calculé » retiré */
function fi6Sub(f){if(f.genre!=='objet')return [];const o=[];if(f.uniq)o.push('<span class="tag2 uq">Unique</span>');
  const cr=f.crea||{},p=cr.id&&S.chars[cr.id];if(p||cr.nom)o.push('créé par '+(p&&vis(p)?lk({t:'perso',id:p.id},fiCN(p)):esc(p?fiCN(p):cr.nom)));return o;}
/* Fief : onglets Fiche | Gestion (Gestion : lot 7) quand un PJ en est détenteur */
function fi6Tabs(f){if(!fiIsFief(f)||!fiBlkSee(f,'fief')||!fi6CharLinks(f.id).some(x=>x.nat==='fief'&&x.c.type==='PJ'))return '';const t=S.fiTab==='gest'?'gest':'fiche';
  return `<div class="seg fi6tabs" role="group" aria-label="Onglets du fief">${[['fiche','Fiche'],['gest','Gestion']].map(([v,l])=>`<button type="button" data-act="fi6Tab" data-v="${v}" aria-pressed="${t===v}">${l}</button>`).join('')}</div>`;}
const fi6Gest=f=>`<div class="card"><b>Gestion du fief</b><div class="muted small" style="margin-top:4px">Arrive au lot 7 : caractéristiques du fief, taille, état économique, traits, ressources et XP de fief.</div></div>`;
function fi6Blocks(f){const G=isGest(),ed=fiCanEd(f),e=fiEyeOf(f),eye=(k,l)=>G?eyeBtn('fiEye',`data-k="${k}"`,!!e[k],l):'';let h='';
  const add=(act,lab,x)=>ed?`<div class="blkplus"><button type="button" class="pbtn" data-act="${act}"${x||''} aria-label="Ajouter : ${esc(lab)}">+</button></div>`:'';const cx=(lab,act,at)=>{if(ed)FI_CX.push([lab,act,at]);};
  const none=t=>`<div class="muted small">${t}</div>`;
  if(f.genre==='lieu'){const L=fi6CharLinks(f.id);
    if(fiIsFief(f)&&fiBlkSee(f,'fief')){const D=L.filter(x=>x.nat==='fief'),fe=((f.fief||{}).feerie||'').trim();
      h+=fiBlk('fief','Fief',D.length?D.length+' détenteur'+(D.length>1?'s':''):'',`<div class="fimg">Détenteurs</div>${D.map(x=>`<div class="srow"><span>${lk({t:'perso',id:x.c.id},fiCN(x.c))}</span>${ed?fi6Unlk('ch',{c:x.c.id,k:x.k,s:x.sid}):''}</div>`).join('')||none('Aucun détenteur.')}${add('fi6Lk','Détenteur',' data-m="fief"')}
        <div class="fimg">Situation féerique</div>${fe?fiRich(fe):none('Rien pour l\'instant.')}${ed?`<div class="radd"><button type="button" class="edl" data-act="fiEd" data-b="feerie">${ICON.crayon} Modifier</button></div>`:''}`,{hid:G&&!e.fief,eye:eye('fief','Fief')});}
    const K=fiSort(fiKidsOf(f.id).filter(fiSee));
    if(!K.length)cx('Lieu contenu','fiNew',' data-g="lieu"');if(K.length)h+=fiBlk('cont','Lieux contenus'+fi6Calc(),K.length?String(K.length):'',K.map(x=>`<div class="srow"><span>${lk({t:'fiche',id:x.id},x.nom)}${x.type?` <span class="muted">· ${esc(x.type)}</span>`:''}${x.vis!=='rev'?' <span class="tag2">préparé</span>':''}</span></div>`).join('')+(K.length?'':none('Aucun lieu contenu.'))+add('fiNew','Lieu contenu',' data-g="lieu"'),{});
    if(fiBlkSee(f,'pers')&&!L.filter(x=>x.nat!=='fief').length)cx('Personnage lié','fi6Lk',' data-m="pers" data-n=""');
    if(fiBlkSee(f,'pers')&&L.filter(x=>x.nat!=='fief').length){const P=L.filter(x=>x.nat!=='fief').sort((a,b)=>fiCN(a.c).localeCompare(fiCN(b.c),'fr',{sensitivity:'base'}));
      h+=fiBlk('pers','Personnages liés'+fi6Calc(),P.length?String(P.length):'',(P.map(x=>`<div class="srow"><span>${lk({t:'perso',id:x.c.id},fiCN(x.c))}${x.pp?` <span class="muted">· propriétaire · ${esc(x.pp)}</span> <span class="srcb">PP</span>`:x.lab&&x.lab!=='lieu'?` <span class="muted">· ${esc(x.lab)}</span>`:''}</span>${ed?fi6Unlk('ch',{c:x.c.id,k:x.k,s:x.sid}):''}</div>`).join('')||none('Aucun personnage lié.'))+(ed?`<div class="radd"><button class="btn" data-act="fi6Lk" data-m="pers" data-n="">+ Personnage lié</button></div>`:'')+'',{hid:G&&!e.pers,eye:eye('pers','Personnages liés')});}
    if(fiBlkSee(f,'orgs')){const O=f.orgs||[];if(!O.length)cx('Organisation ou famille','fi6Org','');if(O.length)h+=fiBlk('orgs','Organisations et familles',O.length?String(O.length):'',(O.map(x=>`<div class="srow"><span>${fi6Ref(x.f,x.nom)}${x.note?`<span class="d">${esc(x.note)}</span>`:''}</span>${ed?`<button type="button" class="ibtn" data-act="fi6Org" data-i="${esc(x.id)}" aria-label="Modifier ${esc(x.nom)}">✎</button>`:''}</div>`).join('')||none('Aucune pour l\'instant.'))+add('fi6Org','Organisation ou famille'),{hid:G&&!e.orgs,eye:eye('orgs','Organisations et familles')});}
    if(fiBlkSee(f,'obj')){const O=fiSort(fiAll().filter(o=>o.genre==='objet'&&fiSee(o)&&fiBlkSee(o,'det')&&o.lieu&&o.lieu.f===f.id));
      if(O.length)h+=fiBlk('obj','Objets présents'+fi6Calc(),O.length?String(O.length):'',O.map(o=>`<div class="srow"><span>${lk({t:'fiche',id:o.id},o.nom)}${o.type?` <span class="muted">· ${esc(o.type)}</span>`:''}</span></div>`).join('')+(O.length?'':none('Aucun objet.'))+'',{hid:G&&!e.obj,eye:eye('obj','Objets présents')});}
    if(fiBlkSee(f,'carte')&&!caLieuHasMap(f.id)){const src=illOf('carte',f.id);if(!src&&ed)FI_CX.push(['Carte','','',`<label class="ux2cb" style="cursor:pointer">+ Carte<input type="file" accept="image/*" data-ptrfile="${illId('carte',f.id)}" data-plab="${esc('Carte : '+f.nom)}" hidden></label>`]);if(src)h+=fiBlk('carte','Carte','',(src?`<div class="fibigw">${bigImg(illId('carte',f.id),src,'Carte : '+f.nom)}</div>`:none('Pas de carte.'))+(ed?`<div style="margin-top:6px">${illEdit('carte',f.id,'Carte : '+f.nom)}</div>`:''),{hid:G&&!e.carte,eye:eye('carte','Carte')});}}
  if(f.genre==='objet'){
    if(!(f.effet||'').trim())cx('Effet','fiEd',' data-b="effet"');
    if(fiBlkSee(f,'effet')&&(f.effet||'').trim())h+=fiBlk('effet','Effet','',(f.effet||'').trim()?fiRich(f.effet):none('Effet non renseigné.'),{edit:ed?'fiEd':'',ea:' data-b="effet"',hid:G&&!e.effet,eye:eye('effet','Effet')});
    if(fiBlkSee(f,'carac')){const C=f.carac||{},R=[['prix','Prix'],['taille','Taille'],['poids','Poids']].filter(([k])=>(C[k]||'').trim());
      if(!R.length)cx('Caractéristiques','fi6Car','');if(R.length)h+=fiBlk('carac','Caractéristiques','',(R.length?`<div class="ui-kv">${R.map(([k,l])=>`<span>${l}</span><b>${esc(C[k])}</b>`).join('')}</div>`:none('Rien de renseigné.'))+'',{edit:ed?'fi6Car':'',hid:G&&!e.carac,eye:eye('carac','Caractéristiques')});}
    if(fiBlkSee(f,'det')){const D=(f.det||[]).map((x,i)=>{const c=x.id&&S.chars[x.id];return `<div class="srow"><span>${c&&vis(c)?lk({t:'perso',id:c.id},fiCN(c)):`<b>${esc(c?fiCN(c):x.nom)}</b>`}</span>${ed?fi6Unlk('det',{i}):''}</div>`;}).join('')
        +fi6CharLinks(f.id).filter(x=>x.k==='pp').map(x=>`<div class="srow"><span>${lk({t:'perso',id:x.c.id},fiCN(x.c))} <span class="muted">· ${esc(x.pp)}</span> <span class="srcb">PP</span></span>${ed?fi6Unlk('ch',{c:x.c.id,k:'pp',s:x.sid}):''}</div>`).join('');
      const lieu=f.lieu&&(f.lieu.f||f.lieu.nom),par=f.parent&&S.fiches[f.parent];
      if(!D&&!lieu&&!(par&&fiSee(par)))cx('Détenteur ou emplacement','fi6Lk',' data-m="det"');else h+=fiBlk('det','Détenteur et emplacement','',`<div class="fimg">${f.uniq?'Détenteur':'Détenteurs'}</div>${D||none('Aucun détenteur.')}${add('fi6Lk','Détenteur',' data-m="det"')}
        <div class="fimg">Emplacement</div>${lieu?`<div class="srow"><span>${fi6Ref(f.lieu.f,f.lieu.nom)}</span>${ed?fi6Unlk('emp',{}):''}</div>`:none('Non renseigné.')}${ed?`<div class="radd"><button class="btn" data-act="fi6Lk" data-m="emp">${lieu?'Changer l\'emplacement':'+ Emplacement'}</button></div>`:''}
        ${par&&fiSee(par)?`<div class="fimg">Fait partie de</div><div class="srow"><span>${lk({t:'fiche',id:par.id},par.nom)}</span></div>`:''}`,{hid:G&&!e.det,eye:eye('det','Détenteur et emplacement')});}
    const K=fiSort(fiKidsOf(f.id).filter(fiSee));
    if(!K.length)cx('Objet contenu','fiNew',' data-g="objet"');if(K.length)h+=fiBlk('ocont','Objets contenus'+fi6Calc(),K.length?String(K.length):'',K.map(x=>`<div class="srow"><span>${lk({t:'fiche',id:x.id},x.nom)}${x.type?` <span class="muted">· ${esc(x.type)}</span>`:''}${x.vis!=='rev'?' <span class="tag2">préparé</span>':''}</span></div>`).join('')+(K.length?'':none('Aucun objet contenu.'))+add('fiNew','Objet contenu',' data-g="objet"'),{});}
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
/* Champ « Nature du lien » : 3 cases cumulables + texte libre (28/11) */
function situNatField(L,x,act,attr){return `<div class="field"><label>Nature du lien</label><div class="seg" role="group" aria-label="Nature du lien">${SITU_N3.map(([v,l])=>`<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${L.includes(v)}">${l}</button>`).join('')}</div><input type="text" ${attr} value="${esc(x||'')}" placeholder="autre, à préciser" aria-label="Autre nature, à préciser" autocomplete="off" style="margin-top:6px"><div class="muted small" style="margin-top:4px">Cases cumulables ; le texte libre s'ajoute ou les remplace.</div></div>`;}
const FI6_LK={pers:'Lien avec un personnage',fief:'Détenteur du fief',det:'Détenteur',emp:'Emplacement'};
function fi6Sheet(g){const f=S.fiches[g.fid];if(!f||!fiCanEd(f))return null;const sel=(k,L,v,lab,emp)=>`<div class="field"><label for="fi6-${k}">${lab}</label><select id="fi6-${k}" data-fin="${k}"><option value="">${emp||'— choisir —'}</option>${L.map(([o,t])=>`<option value="${esc(o)}"${o===v?' selected':''}>${esc(t)}</option>`).join('')}</select></div>`;
  const txt=(k,v,lab,ph)=>`<div class="field"><label for="fi6-${k}">${lab}</label><input id="fi6-${k}" type="text" data-fin="${k}" value="${esc(v||'')}"${ph?` placeholder="${esc(ph)}"`:''} autocomplete="off"></div>`;
  const foot=(ok,del)=>`${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}<div class="actions">${del?`<button class="btn ghost" style="margin-right:auto;color:var(--bad)" data-act="${del}">${g.conf?'Confirmer le retrait':'Retirer'}</button>`:''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="${ok}">Enregistrer</button></div>`;
  const CH=fi6CV().map(c=>[c.id,fiCN(c)+' · '+(c.type==='PJ'?'PJ':'PNJ')]);
  if(g.kind==='fi6Lk'){const t=FI6_LK[g.m];let b='';
    if(g.m==='pers')b=sel('cid',CH,g.cid,'Personnage')+`${situNatField(g.nats||[],g.natx||'','fi6Nat','data-fin="natx"')}<div class="muted small">Le lien s'inscrit aussi dans la Situation du personnage.</div>`;
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
  if(a==='fi6Nat'){if(g&&g.kind==='fi6Lk'){const L=g.nats||[];g.nats=L.includes(d.v)?L.filter(x=>x!==d.v):L.concat([d.v]);S._fiRedraw=true;render();}return true;}
  if(a==='fi6Lk'){if(!fiCanEd(f))return true;fiOpenDlg({kind:'fi6Lk',fid:f.id,m:d.m,nats:d.n&&d.n!=='autre'?[d.n]:[],natx:'',cid:'',nom:'',lid:(f.lieu||{}).f||'',err:''});if(d.m==='emp'&&f.lieu&&!f.lieu.f)S.dlg.nom=f.lieu.nom||'';render();return true;}
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
      const k=g.m==='fief'?'fiefs':'lieux',nv=situNatV(g.nats,g.natx);
      if(((c.situ||{})[k]||[]).some(e=>e.f===x.id))return err('Ce lien existe déjà : modifie-le depuis la Situation du personnage.');
      if(k==='lieux'&&!nv.nats.length&&!nv.natx)return err('Coche au moins une nature ou précise le lien.');
      fi6SetC(c.id,n=>{const s=n.situ={...(n.situ||{})};s[k]=(s[k]||[]).concat([{id:uid('s'),date:today(),nom:x.nom,f:x.id,...(k==='lieux'?nv:{})}]);});
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
  else{const n=clone(cc),s=n.situ={...(n.situ||{})};const ex=(s.lieux||[]).find(e=>e.f===fx.id);if(ex){if(!situNats(ex).includes('prop'))s.lieux=s.lieux.map(e=>e===ex?{...e,...situNatV(situNats(e).concat(['prop']),situNatX(e))}:e);}else s.lieux=(s.lieux||[]).concat([{id:uid('s'),date:today(),nom:fx.nom,f:fx.id,...situNatV(['prop'],'')}]);saveChar(n);}
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
  return [h,l].filter(Boolean).join(' · ')+((o.det||[]).length>1?' (+'+((o.det||[]).length-1)+')':'')+(o.uniq?([h,l].filter(Boolean).length?' · ':'')+'unique':'');}

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
/* UX2 : élision « d'Allemagne », « d'Égypte » ; titre réel de la Situation d'abord */
const elid=t=>String(t||'').replace(/\b(de) ([aeiouyhàâäéèêëîïôöùûüAEIOUYHÀÂÉÈÊÎÔÛ])/g,"d'$2");
const deN=n=>(/^[aeiouyhàâäéèêëîïôöùûü]/i.test((n||'').trim())?"d'":'de ')+(n||'').trim();
const ogTitL=(x,c)=>x.t.pp?x.t.nom:((x.t.nom||'').trim()&&!/^(duc|duchesse|baron|baronne|comte|comtesse|marquis|marquise|vicomte|vicomtesse|chevalier|dame|roi|reine)$/i.test((x.t.nom||'').trim())?elid(x.t.nom.trim()):ogRL(x.r,c)+(ogDomN(x.t.dom)?' '+deN(ogDomN(x.t.dom)):''));
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
      (R.length?`<div class="ux2q"><button type="button" class="qbtn" data-act="xpHelp" data-k="rangs" aria-label="Aide">?</button></div>${(S.xpHelp||{}).rangs?`<div class="qtip2">${f.titres?'Ordre de préséance, du plus haut au plus bas. Titres cumulables (Situation › Titres) : le plus haut l\'emporte.':'Du plus haut au plus bas niveau.'}</div>`:''}`+R.map((r,i)=>`<div class="srow"><span><span class="ogrk">${i+1}</span> <b>${esc(r.m)}</b>${(r.f||'').trim()&&r.f.trim()!==r.m?' / <b>'+esc(r.f.trim())+'</b>':''}${r.note?`<span class="d">${esc(r.note)}</span>`:''}</span></div>`).join(''):none('Aucun rang.')),
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
function ogSitRows(c,k){const E=canEditC(c),btn=e=>E?`<button type="button" class="ibtn sm" data-act="situEd" data-k="${k}" data-i="${esc(e.id)}" aria-label="Modifier ${esc(e.nom||'')}">✎</button>`:'';
  if(k==='titres'){const T=ogTitles(c).filter(x=>!x.t.pp),ids=new Set(T.map(x=>x.t.id));
    return T.map(x=>`<div class="srow"><span><b>${esc(ogRL(x.r,c))}</b>${x.t.dom&&ogDomN(x.t.dom)?' '+deN(ogDomN(x.t.dom)).replace(/(de |d')$|(d'|de ).*/,'$1$2')+ogDomH(x.t.dom):''}${x.t.suz&&ogPersN(x.t.suz)?` <span class="muted">· sous ${ogPers(x.t.suz)}</span>`:''}${ogTOrgs().length>1?` <span class="muted">· ${fi6Ref(x.o.id)}</span>`:''}${x.t.note?`<span class="d">${esc(x.t.note)}</span>`:''}</span>${btn(x.t)}</div>`)
      .concat(((c.situ||{}).titres||[]).filter(e=>!ids.has(e.id)).map(e=>`<div class="srow"><span><b>${esc(elid(e.nom))}</b>${e.note?`<span class="d">${esc(e.note)}</span>`:''}</span>${btn(e)}</div>`));}
  const L=(c.situ||{}).orgs||[],rows=L.map(e=>{const o=e.f&&S.fiches[e.f],r=o&&ogLineR(o,e),role=(e.role||'').trim(),showRole=role&&!(r&&(!e.rang||ogRFind(o,role)===r));
    return `<div class="srow"><span>${situNm(e)}${r?` <span class="muted">· ${esc(ogRL(r,c))}</span>`:''}${showRole?` <span class="muted">· ${esc(role)}</span>`:''}${e.sup&&ogPersN(e.sup)?` <span class="muted">· sous ${ogPers(e.sup)}</span>`:''}${e.note?`<span class="d">${esc(e.note)}</span>`:''}</span>${btn(e)}</div>`;});
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
  const tit=c&&vis(c)?(((c.situ||{}).titres||[])[0]||{}).nom||'':'';
  return `<div class="srow ogm${m.hid?' fihid':''}"><span class="ogmn"><span>${name}${c&&c.type==='PJ'?' <span class="tag2">PJ</span>':''}${tit?` <span class="muted small">${esc(tit)}</span>`:''}${sub.length?`<span class="d">${sub.join(' · ')}</span>`:''}</span></span>`

    +(G?eyeBtn('fiOEyeM',`data-k="${esc(m.key)}"`,!m.hid,'Membre '+nm):'')+`</div>`;}
function faBlocks(f){const G=isGest(),ed=fiCanEd(f),e=fiEyeOf(f),eye=(k,l)=>G?eyeBtn('fiEye',`data-k="${k}"`,!!e[k],l):'',none=x=>`<div class="muted small">${x}</div>`;let h='';
  if(fiBlkSee(f,'terr')){const L=ogLieux(f),t=(f.terr||'').trim();
    if(t||L.length||ed)h+=fiBlk('terr','Territoires',L.length?String(L.length):'',(t?fiRich(f.terr):'')
      +(L.length?`<div class="lab2" style="margin-top:6px">Lieux liés${fi6Calc()}</div>`+L.map(({l,y})=>`<div class="srow"><span>${lk({t:'fiche',id:l.id},l.nom)}${y.note?`<span class="d">${esc(y.note)}</span>`:''}</span>${ed&&fiCanEd(l)?`<button type="button" class="ibtn" data-act="fiOLieuX" data-l="${esc(l.id)}" data-i="${esc(y.id)}" aria-label="Retirer ce lieu">✕</button>`:''}</div>`).join(''):'')
      +(!t&&!L.length?none('Non renseigné.'):'')+(ed?`<div class="radd"><button class="btn" data-act="fiOLieu">+ Lieu</button></div>`:''),{edit:ed?'fiEd':'',ea:' data-b="terr"',hid:G&&!e.terr,eye:eye('terr','Territoires')});}
  if(fiBlkSee(f,'mem')){const L=faMembers(f),D=L.filter(m=>!m.br),grs=[];if(D.length)grs.push({k:'dir',t:f.nom,L:D});
    for(const b of faBrs(f).filter(fiSee)){const R=L.filter(m=>m.br===b);if(R.length)grs.push({k:'b'+b.id,t:'Branche · '+b.nom,L:R});}
    const all=!!(S.faAll||{})[f.id],cut=g=>{const R=g.L.map(m=>faMRow(f,m));return !all&&R.length>8?R.slice(0,6).join('')+`<button type="button" class="lnk" data-act="faAllT" data-id="${esc(f.id)}">Voir les ${R.length-6} autres</button>`:R.join('');};
    const body=grs.length===1&&grs[0].k==='dir'?cut(grs[0]):grs.map(g=>ogGrp(f,g,cut(g))).join('');
    if(L.length)h+=fiBlk('mem','Membres',String(L.length),body,{plus:ed?'faMem':'',pa:' data-k=""'});else if(ed)FI_CX.push(['Membre','faMem',' data-k=""']);}
  if(fiBlkSee(f,'vas')){const K=fiKidsOf(f.id).filter(x=>x.genre==='famille'&&fiSee(x)),Br=fiSort(K.filter(faIsBr)),V=fiSort(K.filter(x=>!faIsBr(x))),X=f.vasx||[];
    if(!K.length&&!X.length&&ed)FI_CX.push(['Vassale ou branche','fiNew',' data-g="famille"']);
    if(K.length||X.length){const row=x=>{const n=faMembers(x).length;return `<div class="srow"><span>${lk({t:'fiche',id:x.id},x.nom)}${x.type&&!faIsBr(x)?` <span class="muted">· ${esc(x.type)}</span>`:''}${x.vis!=='rev'?' <span class="tag2">préparée</span>':''}</span>${n?`<span class="muted small">${n} membre${n>1?'s':''}</span>`:''}</div>`;};
      let b='';if(Br.length)b+='<div class="lab2">Branches</div>'+Br.map(row).join('');if(V.length)b+='<div class="lab2">Vassales</div>'+V.map(row).join('');
      if(X.length)b+='<div class="lab2">Vassales sans fiche</div>'+X.map(x=>`<div class="srow"><span><b>${esc(x.nom)}</b></span>${ed?`<span style="display:flex;gap:4px">${fiCanNew()?`<button type="button" class="btn ghost ui-xs" data-act="faVasF" data-i="${esc(x.id)}">+ Fiche</button>`:''}<button type="button" class="ibtn" data-act="faVasX" data-i="${esc(x.id)}" aria-label="Retirer ${esc(x.nom)}">✕</button></span>`:''}</div>`).join('');
      h+=fiBlk('vas','Vassales et branches'+fi6Calc(),K.length+X.length?String(K.length+X.length):'',(b||none('Aucune.'))
        +(ed?`<details class="ux2menu"><summary class="pbtn" aria-label="Ajouter une vassale ou une branche">+</summary><div class="ux2mi"><button type="button" data-act="fiNew" data-g="famille">Nouvelle famille vassale ou branche</button><button type="button" data-act="faVas">Nom seul (sans fiche)</button></div></details>`:''),{});}}
  return h;}
/* Situation › Familles : lignes saisies, puis familles mères des branches (ligne calculée) */
function faSitRows(c){const E=canEditC(c),L=(c.situ||{}).familles||[],have=new Set(L.map(e=>e.f).filter(Boolean));
  const rows=L.map(e=>{const x=e.f&&S.fiches[e.f];return `<div class="srow"><span>${situNm(e)}${x&&faIsBr(x)&&fiSee(x)?' <span class="tag2">Branche</span>':''}${e.note?`<span class="d">${esc(e.note)}</span>`:''}</span>${E?`<button type="button" class="ibtn" data-act="situEd" data-k="familles" data-i="${esc(e.id)}" aria-label="Modifier ${esc(e.nom||'')}">✎</button>`:''}</div>`;});
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

/* ---------- Lot Cartes interactives (26/11/2026) ----------
   Collection « fiches » :
   - carte : genre 'carte', image ill-fiche-<id> (vignette + grande image ≤ 2600 px), iw/ih (taille de l'image), parent (carte mère),
     lieu (fiche Lieu associée), ech {ax,ay,bx,by,l,u} (segment étalon en fractions de l'image, longueur, unité m|km|lieue) ;
   - rep (repère) : carte, x, y (fractions 0-1), nom, cat, cib {s:'fiche'|'perso'|'carte', id} (absent = libre), note, vis, par ;
   - traj (trajet) : carte, pts [[x,y]…], nom, coul, note, vis, par.
   Réglages : meta/cartes {cats:[{id,nom,coul}], moy:[{id,nom,v}]}.
   Principe du 25/11 : visible = modifiable (repères et trajets supprimés par qui les voit, Visiteur exclu) ; œil (préparer) : gestion ; échelle et Paramètres : gestion en mode édition. */
FI_G.carte={pl:'Cartes',un:'carte',nv:'Nouvelle carte',cnt:n=>n+' carte'+(n>1?'s':''),arbo:true,par:'Carte mère',sub:'sous-carte',tl:'Types de carte'};
FI_IC.carte='<path d="M3 6.5l6-3 6 3 6-3v14l-6 3-6-3-6 3z"/><path d="M9 3.5v14M15 6.5v14"/>';
const CA_SVG={lieu:FI_IC.lieu,pnj:FI_IC.perso,org:FI_IC.org,evenement:'<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.4l-5.1 2.9 1.1-5.8-4.3-4 5.8-.7z"/>',objet:FI_IC.objet,carte:FI_IC.carte,libre:'<circle cx="12" cy="12" r="4"/>'};
const CA_TY=[['lieu','Lieu'],['pnj','PNJ'],['org','Organisation'],['evenement','Événement'],['objet','Objet'],['carte','Sous-carte'],['libre','Libre']];
const CA_CATS0=[{id:'pub',nom:'Lieu public',coul:'#2f5f9e'},{id:'dem',nom:'Demeure',coul:'#7a4a12'},{id:'fee',nom:'Féerie',coul:'#6b3fa0'},{id:'dan',nom:'Danger',coul:'#b23a2a'},{id:'jou',nom:'Repère de joueur',coul:'#c26a00'}];
const CA_MOY0=[{id:'pied',nom:'À pied',v:5},{id:'cheval',nom:'À cheval',v:12},{id:'fiacre',nom:'Fiacre',v:15},{id:'auto',nom:'Automobile',v:25}];
const CA_COUL=['#1d6b66','#2f5f9e','#c26a00','#b23a2a','#2a2017','#6b3fa0','#7a4a12','#4d7a2a'];
const CA_UNIT={m:['mètres',1],km:['kilomètres',1000],lieue:['lieues',4000]};
['caRep','caTraj','caEch','caPlace'].forEach(k=>FI_DLG.add(k));FI_ED.add('caRep');
S.caMode=null;S.caTmp=null;S.caSel=null;S.caHid={};S.caQ='';S.caFull=false;S.caFocus=null;S.caPre=null;S.caPd=null;
S.fiFold={...(S.fiFold||{}),caon0:true};const CA_V={};let CA_BUSY=false,CA_PEND=false;
const caCfg=()=>({cats:(S.caCfg&&S.caCfg.cats&&S.caCfg.cats.length?S.caCfg.cats:CA_CATS0),moy:(S.caCfg&&Array.isArray(S.caCfg.moy)?S.caCfg.moy:CA_MOY0)});
const caCat=id=>{const C=caCfg().cats;return C.find(c=>c.id===id)||C[0]||{id:'',nom:'',coul:'#666'};};
const caIW=c=>(c&&c.iw)||1000,caIH=c=>(c&&c.ih)||1000;
/* ---------- Visibilité et droits ---------- */
const caIsMap=f=>!!f&&f.genre==='carte';
function caCibO(r){const b=r&&r.cib;if(!b||!b.id)return null;return b.s==='perso'?{t:'perso',id:b.id}:{t:'fiche',id:b.id};}
function caCibTy(r){const b=r&&r.cib;if(!b||!b.id)return 'libre';if(b.s==='perso')return 'pnj';if(b.s==='carte')return 'carte';const f=S.fiches[b.id];return f?f.genre:'libre';}
function caRepSee(r){if(!r||!fiSee(r))return false;const c=S.fiches[r.carte];if(!c||!fiSee(c))return false;const o=caCibO(r);return !o||isGest()||lnkOk(o);}
const caTrSee=t=>!!t&&fiSee(t)&&fiSee(S.fiches[t.carte]);
const caReps=cid=>fiSort(fiAll().filter(x=>x.genre==='rep'&&x.carte===cid&&caRepSee(x)));
const caTrajs=cid=>fiSort(fiAll().filter(x=>x.genre==='traj'&&x.carte===cid&&caTrSee(x)));
const caCanEd=x=>fiCanEd(x);
const caCibNom=r=>{const o=caCibO(r);if(!o)return r.nom;return o.t==='perso'?fiCN(S.chars[o.id]):((S.fiches[o.id]||{}).nom||r.nom);};
/* ---------- Distances et durées ---------- */
function caMpp(c){const e=c&&c.ech;if(!e||!(+e.l>0))return null;const px=Math.hypot((e.bx-e.ax)*caIW(c),(e.by-e.ay)*caIH(c));if(!px)return null;return (+e.l)*((CA_UNIT[e.u]||CA_UNIT.m)[1])/px;}
function caLen(c,P){const k=caMpp(c);if(!k||!P||P.length<2)return null;let s=0;for(let i=1;i<P.length;i++)s+=Math.hypot((P[i][0]-P[i-1][0])*caIW(c),(P[i][1]-P[i-1][1])*caIH(c));return s*k;}
const caDist=m=>m==null?'':m<1000?Math.max(10,Math.round(m/10)*10)+' m':(Math.round(m/100)/10).toLocaleString('fr-FR')+' km';
function caDur(m,v){if(m==null||!(+v>0))return '';const n=Math.max(1,Math.round(m/1000/(+v)*60));return n<60?n+' min':Math.floor(n/60)+' h'+(n%60?' '+String(n%60).padStart(2,'0'):'');}
const caDurs=m=>caCfg().moy.filter(x=>+x.v>0).map(x=>[x.nom,x.v,caDur(m,x.v)]);
/* ---------- Pastille d'un repère ---------- */
const caPinSvg=(ty,sz)=>`<svg width="${sz||15}" height="${sz||15}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CA_SVG[ty]||CA_SVG.libre}</svg>`;
const caDot=(r,cls)=>`<span class="capin ${cls||'mini'}${r.vis!=='rev'?' prep':''}" style="background:${esc(caCat(r.cat).coul)}" aria-hidden="true">${caPinSvg(caCibTy(r),12)}</span>`;
const caTyLab=ty=>(CA_TY.find(x=>x[0]===ty)||[,''])[1];
/* ---------- Liste des cartes (sous-titre) et accueil d'Univers ---------- */
function caListSub(f,K){const n=fiAll().filter(x=>x.genre==='rep'&&x.carte===f.id&&caRepSee(x)).length,t=fiAll().filter(x=>x.genre==='traj'&&x.carte===f.id&&caTrSee(x)).length;
  return [f.type,K&&K.length?K.length+' sous-carte'+(K.length>1?'s':''):'',n+' repère'+(n>1?'s':''),t?t+' trajet'+(t>1?'s':''):'',caMpp(f)?'échelle':'sans échelle'].filter(Boolean).join(' · ');}
/* ---------- Vue de la carte ---------- */
function caFit(c){const W0=Math.min(880,window.innerWidth||390)-(S.caFull?0:26),W=!S.caFull&&(window.innerWidth||390)>=1024?Math.round(W0*.64):W0,H=S.caFull?(window.innerHeight||700)-120:Math.round(Math.min(560,Math.max(300,(window.innerHeight||700)*.58)));
  const z=Math.min(W/caIW(c),H/caIH(c));return {W,H,z,x:(W-caIW(c)*z)/2,y:(H-caIH(c)*z)/2};}
function caView(c){let v=CA_V[c.id];const F=caFit(c);if(!v||v.full!==S.caFull){v=CA_V[c.id]={z:F.z,x:F.x,y:F.y,full:S.caFull,min:F.z*.8};}
  if(S.caFocus&&S.caFocus.cid===c.id){const z=Math.max(F.z*2.5,v.z);v.z=Math.min(z,4);v.x=F.W/2-S.caFocus.x*caIW(c)*v.z;v.y=F.H/2-S.caFocus.y*caIH(c)*v.z;S.caSel=S.caFocus.rid||S.caSel;S.caFocus=null;}
  return {v,F};}
function caBar(c,z){const mpp=caMpp(c);if(!mpp)return '';const m=110/z*mpp,p=Math.pow(10,Math.floor(Math.log10(m))),n=[1,2,5,10].map(k=>k*p).filter(k=>k<=m).pop()||p,px=n/mpp*z;return `<div class="cabar" aria-hidden="true"><span style="width:${Math.round(px)}px"></span>${caDist(n)}</div>`;}
function caMapHtml(c,tools){const {v,F}=caView(c),iw=caIW(c),ih=caIH(c),ill=illId('fiche',c.id),src=illOf('fiche',c.id),M=S.caMode&&S.caTmp&&S.caTmp.cid===c.id?S.caMode:null,T=S.caTmp||{};
  const R=caReps(c.id).filter(r=>!S.caHid[r.cat||caCfg().cats[0].id]),L=caTrajs(c.id),sel=R.find(r=>r.id===S.caSel);
  const pl=(P,col,cls,dash)=>P.length>1?`<polyline points="${P.map(p=>(p[0]*iw).toFixed(1)+','+(p[1]*ih).toFixed(1)).join(' ')}" fill="none" stroke="${esc(col)}" stroke-width="${cls?3:4}" stroke-linecap="round" stroke-linejoin="round"${dash?' stroke-dasharray="8 6"':''} vector-effect="non-scaling-stroke"/>`:'';
  let svg=L.filter(t=>!(M==='traj'&&T.tid===t.id)).map(t=>pl(t.pts||[],t.coul||'#1d6b66','',true)).join('');
  if(M==='traj'||M==='regle'||M==='ech')svg+=pl(T.pts||[],M==='ech'?'#8a4d12':M==='regle'?'#2a2017':(T.coul||'#1d6b66'),'x',M==='regle');
  const e=c.ech;if(canEdit()&&e&&M!=='ech'&&S.caEchSee)svg+=pl([[e.ax,e.ay],[e.bx,e.by]],'#8a4d12','x');
  const pts=(M==='traj'||M==='regle'||M==='ech')?(T.pts||[]).map((p,i)=>`<span class="capt${M==='ech'?' ech':''}" style="left:${(p[0]*iw).toFixed(1)}px;top:${(p[1]*ih).toFixed(1)}px">${M==='ech'?'AB'[i]||'':M==='traj'?i+1:''}</span>`).join(''):'';
  const pins=R.map(r=>`<button type="button" class="capin${r.id===S.caSel?' on':''}${r.vis!=='rev'?' prep':''}" data-capin="${esc(r.id)}" style="left:${(r.x*iw).toFixed(1)}px;top:${(r.y*ih).toFixed(1)}px;background:${esc(caCat(r.cat).coul)}" aria-label="${esc(r.nom)}">${caPinSvg(caCibTy(r))}</button>`).join('');
  const bub=sel&&!M?caBubble(c,sel):'';
  const bar=caBar(c,v.z);
  const img=src?`<img class="caimg" src="${bigSrc(ill,src)}" data-big="${esc(ill)}" alt="" draggable="false" style="width:${iw}px;height:${ih}px">`:`<div class="caimg vide" style="width:${iw}px;height:${ih}px"></div>`;
  return `<div class="camap${S.caFull?' full':''}${M?' mode':''}" id="caMap" data-cid="${esc(c.id)}" style="height:${F.H}px" role="application" aria-label="Carte ${esc(c.nom)} : glisser pour se déplacer, molette ou deux doigts pour zoomer">
    <div class="cain" style="width:${iw}px;height:${ih}px;transform:translate(${v.x}px,${v.y}px) scale(${v.z});--k:${(1/v.z).toFixed(4)}">${img}<svg class="casvg" width="${iw}" height="${ih}" viewBox="0 0 ${iw} ${ih}" aria-hidden="true">${svg}</svg>${pins}${pts}${bub}</div>
    ${src?'':`<div class="caempty muted small">Pas encore d'image${fiCanEd(c)?' : ✎ ci-dessus pour en ajouter une':''}.</div>`}
    <div class="cactl"><button type="button" class="ibtn" data-act="caZoom" data-v="1" aria-label="Zoomer">+</button><button type="button" class="ibtn" data-act="caZoom" data-v="-1" aria-label="Dézoomer">−</button><button type="button" class="ibtn" data-act="caFull" aria-label="${S.caFull?'Quitter le plein écran':'Plein écran'}">${S.caFull?'✕':'⛶'}</button></div>${bar}${tools||''}</div>`;}
function caBubble(c,r){const ty=caCibTy(r),o=caCibO(r),cat=caCat(r.cat),ed=caCanEd(r);
  return `<div class="cabub" style="left:${(r.x*caIW(c)).toFixed(1)}px;top:${(r.y*caIH(c)).toFixed(1)}px"><div class="cabin">
    <div class="cabh"><b>${esc(r.nom)}</b><button type="button" class="cabx" data-act="caSel" data-id="" aria-label="Fermer">✕</button></div>
    <div class="muted small">${esc(caTyLab(ty))} · <span class="cadotc" style="background:${esc(cat.coul)}"></span>${esc(cat.nom)}${r.vis!=='rev'?' · <i>préparé</i>':''}</div>
    ${(r.note||'').trim()?`<div class="small" style="margin-top:4px">${fiRich(r.note)}</div>`:''}
    <div class="cabact">${o?(ty==='carte'?`<button type="button" class="btn" data-act="caGo" data-id="${esc(o.id)}">Ouvrir la sous-carte</button>`:lk(o,'Ouvrir la fiche')):''}${ed?`<button type="button" class="ibtn" data-act="caRepEd" data-id="${esc(r.id)}" aria-label="Modifier ${esc(r.nom)}">✎</button><button type="button" class="ibtn" data-act="caMove" data-id="${esc(r.id)}" aria-label="Déplacer ${esc(r.nom)}" title="Déplacer">✥</button>`:''}</div></div></div>`;}
/* Bandeau des modes (pose d'un repère, trajet, règle, échelle) */
function caModeBar(c){const M=S.caMode,T=S.caTmp||{};if(!M||T.cid!==c.id)return '';
  const ann=`<button type="button" class="btn" data-act="caCancel">Annuler</button>`;
  if(M==='rep')return `<div class="caban"><span><b>Nouveau repère</b> · touche la carte à l'endroit voulu.</span>${ann}</div>`;
  if(M==='move')return `<div class="caban"><span><b>Déplacer « ${esc((S.fiches[T.rid]||{}).nom||'')} »</b> · touche le nouvel emplacement.</span>${ann}</div>`;
  if(M==='ech')return `<div class="caban"><span><b>Échelle</b> · touche les deux extrémités d'une distance connue (A puis B).</span>${ann}</div>`;
  const m=caLen(c,T.pts),mpp=caMpp(c);
  if(M==='regle')return `<div class="caban"><span><b>Règle</b> · ${(T.pts||[]).length<2?'touche deux points.':mpp?`<b class="num">${caDist(m)}</b>${caDurs(m)[0]?' · '+esc(caDurs(m)[0][0].toLowerCase())+' '+caDurs(m)[0][2]:''}`:'carte sans échelle : distance inconnue.'}</span><button type="button" class="btn" data-act="caCancel">✕ Fermer</button></div>`;
  return `<div class="caban"><span><b>Tracé en cours</b> · touche la carte pour ajouter un point.</span>${ann}</div>`;}
function caTrPanel(c){const T=S.caTmp||{};if(S.caMode!=='traj'||T.cid!==c.id)return '';const n=(T.pts||[]).length,m=caLen(c,T.pts),mpp=caMpp(c);
  return `<div class="card catrp"><div class="catrh"><span class="muted small">${n} point${n>1?'s':''}</span><b class="num">${mpp?(m!=null?caDist(m):'—'):'<span class="muted small">carte sans échelle</span>'}</b></div>
    ${mpp&&m!=null?caDurs(m).map(([nm,vv,d])=>`<div class="srow"><span>${esc(nm)} <span class="muted small">(${esc(String(vv))} km/h)</span></span><b>${d}</b></div>`).join(''):''}
    <div class="actions" style="justify-content:flex-start"><button type="button" class="btn" data-act="caUndo"${n?'':' disabled'}>↶ Dernier point</button><button type="button" class="btn pri" data-act="caTrEnd"${n>1?'':' disabled'}>Terminer</button></div></div>`;}
/* UX2 (28/11/2026) : carte en premier, outils posés sur la carte, panneau Repères / Trajets / Fiche */
function caPage(f){const ed=fiCanEd(f),N=fiCanNew(),R=caReps(f.id),L=caTrajs(f.id),mpp=caMpp(f),M=S.caMode;
  const tools=M?'':`<div class="catl">${N?`<button type="button" class="catb pri" data-act="caAdd">+ Repère</button><button type="button" class="catb" data-act="caTrNew">Trajet</button>`:''}<button type="button" class="catb" data-act="caRegle">Règle</button>${canEdit()?`<button type="button" class="catb" data-act="caEchGo">Échelle${mpp?' ✓':''}</button>`:''}</div>`;
  let h=`<div class="calay"><div class="camw">${caModeBar(f)}${caMapHtml(f,tools)}${caTrPanel(f)}</div>`;
  const used=new Set(R.map(r=>r.cat||caCfg().cats[0].id)),C=caCfg().cats.filter(c=>used.has(c.id));
  const aff=C.length?`<div class="caaff"><span class="muted small">Afficher :</span>${C.map(c=>`<button type="button" class="chip${S.caHid[c.id]?' off':''}" data-act="caCatTog" data-id="${esc(c.id)}" aria-pressed="${!S.caHid[c.id]}"><span class="cadotc" style="background:${esc(c.coul)}"></span>${esc(c.nom)}</button>`).join('')}</div>`:'';
  const op=S.caPan!==false&&S.caPan!==undefined?!!S.caPan:(window.innerWidth||390)>=1024,pt=S.caPt||'rep';
  let body='';
  if(op){body+=`<div class="seg capseg" role="group" aria-label="Panneau">${[['rep','Repères'],['traj','Trajets'],['fiche','Fiche']].map(([v,l])=>`<button type="button" data-act="caPt" data-v="${v}" aria-pressed="${pt===v}">${l}</button>`).join('')}</div>`;
    if(pt==='fiche'){const comp=[],lieu=f.lieu&&S.fiches[f.lieu];
      if((f.desc||'').trim())body+=fiBlk('desc','Description','',fiClamp(f.id+':desc',fiRich(f.desc)),{edit:ed?'fiEd':'',ea:' data-b="desc"'});else if(ed)comp.push(['Description','fiEd',' data-b="desc"']);
      if(lieu)body+=`<div class="srow"><span class="muted small">Lieu associé</span><span>${lk({t:'fiche',id:lieu.id},lieu.nom)}</span></div>`;
      body+=`<div class="srow"><span class="muted small">Échelle</span><span>${mpp?'réglée':'<span class="muted">non réglée</span>'}</span></div>`;
      const Mn=fiMentions('fiche',f.id);if(Mn.length)body+=fiBlk('ment','Mentions',String(Mn.length),fiMentionsHtml(Mn));
      body+=fiComp(comp);}
    else body+=`<div class="fisrch"><input type="search" data-caq="1" value="${esc(S.caQ)}" placeholder="Filtrer" aria-label="Filtrer" autocomplete="off"></div><div id="caRes">${caLists(f)}</div>`;}
  h+=`<div class="capan${op?' open':''}"><button type="button" class="capanh" data-act="caPan" aria-expanded="${op}"><span class="capgrip" aria-hidden="true"></span><span>Repères · ${R.length} · Trajets · ${L.length}</span><span class="chev" aria-hidden="true">${op?'⌄':'⌃'}</span></button>${aff}${body}</div></div>`;
  return h;}
function caFicheBlocks(f){if(!caIsMap(f))return '';const ed=fiCanEd(f),N=fiCanNew(),C=caCfg().cats,R=caReps(f.id),L=caTrajs(f.id),mpp=caMpp(f);
  let h=caModeBar(f)+caMapHtml(f)+caTrPanel(f);
  if(!S.caMode)h+=`<div class="catool">${N?`<button type="button" class="btn pri" data-act="caAdd">+ Repère</button><button type="button" class="btn" data-act="caTrNew">Trajet</button>`:''}<button type="button" class="btn" data-act="caRegle">Règle</button>${canEdit()?`<button type="button" class="btn" data-act="caEchGo">Échelle${mpp?' ✓':''}</button>`:''}</div>`;
  h+=`<div class="chips cachips" role="group" aria-label="Catégories affichées">${C.map(c=>`<button type="button" class="chip" data-act="caCatTog" data-id="${esc(c.id)}" aria-pressed="${!S.caHid[c.id]}"><span class="cadotc" style="background:${esc(c.coul)}"></span>${esc(c.nom)}</button>`).join('')}</div>`;
  h+=`<div class="fisrch"><input type="search" data-caq="1" value="${esc(S.caQ)}" placeholder="Rechercher un repère ou un trajet" aria-label="Rechercher un repère ou un trajet" autocomplete="off"></div><div id="caRes">${caLists(f)}</div>`;
  return h;}
function caLists(f){const q=nrm(S.caQ),R=caReps(f.id).filter(r=>!q||nrm(r.nom).includes(q)||nrm(caCibNom(r)).includes(q)),L=caTrajs(f.id).filter(t=>!q||nrm(t.nom).includes(q));
  const who=()=>''; /* UX2 : lignes sans l'auteur */
  const rr=r=>{const ty=caCibTy(r),o=caCibO(r);return `<div class="srow carow${r.vis!=='rev'?' fihid':''}">${caDot(r)}<button type="button" class="cali" data-act="caSel" data-id="${esc(r.id)}"><b>${esc(r.nom)}</b><small>${esc(caTyLab(ty))}${o&&caCibNom(r)!==r.nom?' · '+esc(caCibNom(r)):''} · ${esc(caCat(r.cat).nom)}${who(r)}${r.vis!=='rev'?' · préparé':''}</small></button>${o&&ty!=='carte'?`<button type="button" class="ibtn sm" ${lnkAttrs(o)} aria-label="Fiche de ${esc(caCibNom(r))}">›</button>`:''}</div>`;};
  const tr=t=>{const m=caLen(f,t.pts),D=m!=null?caDurs(m):[],best=D.length?D[D.length-1]:null;
    return `<div class="srow carow${t.vis!=='rev'?' fihid':''}"><svg width="24" height="10" aria-hidden="true"><line x1="1" y1="5" x2="23" y2="5" stroke="${esc(t.coul||'#1d6b66')}" stroke-width="3" stroke-dasharray="5 3"/></svg><button type="button" class="cali" data-act="caTrSel" data-id="${esc(t.id)}"><b>${esc(t.nom)}</b><small>${m!=null?caDist(m)+(D.length?' · '+esc(D[0][0].toLowerCase())+' '+D[0][2]+(best&&best!==D[0]?' · '+esc(best[0].toLowerCase())+' '+best[2]:''):''):'distance inconnue (carte sans échelle)'}${(t.note||'').trim()?' · '+esc(t.note):''}${who(t)}</small></button>${caCanEd(t)?`<button type="button" class="ibtn" data-act="caTrEd" data-id="${esc(t.id)}" aria-label="Modifier ${esc(t.nom)}">✎</button>`:''}</div>`;};
  if((S.caPt||'rep')==='traj')return `<div class="calst">${L.length?L.map(tr).join(''):'<div class="muted small">Aucun trajet'+(q?' ne correspond':'')+'.</div>'}</div>`;
  return `<div class="calst">${R.length?R.map(rr).join(''):'<div class="muted small">Aucun repère'+(q?' ne correspond':'')+'.</div>'}</div>`;}
/* ---------- « Sur la carte » : fiches visées par un repère (et cartes d'un lieu) ---------- */
function caThumb(c,x,y){const iw=caIW(c),ih=caIH(c),src=illOf('fiche',c.id),ill=illId('fiche',c.id),s=Math.max(.35,260/Math.max(iw,ih)*1.6);
  return `<span class="cathumb" aria-hidden="true">${src?`<img src="${bigSrc(ill,src)}" data-big="${esc(ill)}" alt="" style="width:${(iw*s).toFixed(0)}px;height:${(ih*s).toFixed(0)}px;left:calc(50% - ${(x*iw*s).toFixed(0)}px);top:calc(50% - ${(y*ih*s).toFixed(0)}px)">`:''}</span>`;}
function caOnMap(t,id){const R=fiAll().filter(r=>r.genre==='rep'&&r.cib&&r.cib.id===id&&(t==='perso'?r.cib.s==='perso':r.cib.s!=='perso')&&caRepSee(r));
  const own=t==='fiche'?fiSort(fiAll().filter(c=>caIsMap(c)&&c.lieu===id&&fiSee(c))):[];
  const anyMap=fiAll().some(c=>caIsMap(c)&&fiSee(c)),N=fiCanNew()&&anyMap&&(t!=='fiche'||['lieu','org','objet','evenement'].includes((S.fiches[id]||{}).genre));
  if(!R.length&&!own.length&&!N)return '';
  const rows=own.map(c=>`<div class="caon"><button type="button" class="caonb" data-act="caGo" data-id="${esc(c.id)}" aria-label="Ouvrir la carte ${esc(c.nom)}">${caThumb(c,.5,.5)}</button><div class="srow"><span>${lk({t:'fiche',id:c.id},c.nom)} <span class="muted small">· carte de ce lieu</span></span><button type="button" class="btn" data-act="caGo" data-id="${esc(c.id)}">Ouvrir la carte</button></div></div>`).join('')
    +R.map(r=>{const c=S.fiches[r.carte];return `<div class="caon"><button type="button" class="caonb" data-act="caGo" data-id="${esc(c.id)}" data-rid="${esc(r.id)}" aria-label="Ouvrir ${esc(c.nom)} sur ce repère">${caThumb(c,r.x,r.y)}<span class="capin" style="background:${esc(caCat(r.cat).coul)}">${caPinSvg(caCibTy(r))}</span></button><div class="srow"><span>${lk({t:'fiche',id:c.id},c.nom)} <span class="muted small">· ${esc(caCat(r.cat).nom)}</span></span><button type="button" class="btn" data-act="caGo" data-id="${esc(c.id)}" data-rid="${esc(r.id)}">Ouvrir la carte</button></div></div>`;}).join('');
  const n=R.length+own.length;
  return fiBlk(n?'caon':'caon0','Sur la carte'+fi6Calc(),n?String(n):'',(rows||'<div class="muted small">Pas encore placé sur une carte.</div>')+(N?`<div class="radd"><button class="btn" data-act="caPlace" data-t="${t}" data-id="${esc(id)}">+ Placer sur une carte</button></div>`:''),{});}
const caLieuHasMap=id=>fiAll().some(c=>caIsMap(c)&&c.lieu===id&&fiSee(c));
/* ---------- Fenêtres ---------- */
function caCibOpts(ty,cur,cid){let L=[];
  if(ty==='pnj')L=Object.values(S.chars||{}).filter(c=>c.type==='PNJ'&&vis(c)).map(c=>[c.id,fiCN(c)]);
  else if(ty==='carte')L=fiAll().filter(x=>caIsMap(x)&&fiSee(x)&&x.id!==cid).map(x=>[x.id,fiPath(x).filter(fiSee).map(p=>p.nom).concat([x.nom]).join(' › ')]);
  else L=fiAll().filter(x=>x.genre===ty&&fiSee(x)).map(x=>[x.id,ty==='evenement'&&(x.num||'').trim()?x.num.trim()+' '+x.nom:x.nom]);
  L.sort((a,b)=>a[1].localeCompare(b[1],'fr',{sensitivity:'base'}));
  const canNew=['lieu','org','objet','pnj'].includes(ty);
  return `<option value="">— choisir —</option>${canNew?`<option value="__new"${cur==='__new'?' selected':''}>＋ Créer une fiche du nom du repère</option>`:''}`+L.map(([v,t])=>`<option value="${esc(v)}"${v===cur?' selected':''}>${esc(t)}</option>`).join('');}
function caSheet(g){
  if(g.kind==='caRep'){const c=S.fiches[g.cid];if(!c)return null;const r=g.id&&S.fiches[g.id];if(g.id&&(!r||!caCanEd(r)))return null;if(!g.id&&!fiCanNew())return null;
    const C=caCfg().cats;
    return fiShell(g,r?'Repère':'Nouveau repère',`<div><h2>${r?'Repère':'Nouveau repère'}</h2><div class="muted small">${esc(c.nom)}</div></div>
      <div class="field"><span class="lab2">Rattacher à</span><div class="catys">${CA_TY.map(([k,l])=>`<button type="button" class="caty" data-act="caTy" data-v="${k}" aria-pressed="${g.ty===k}">${FI_SVG(CA_SVG[k],18)}<span>${l}</span></button>`).join('')}</div></div>
      ${g.ty!=='libre'?`<div class="field"><label for="caCib">${esc(caTyLab(g.ty))}</label><select id="caCib" data-fin="cid2">${caCibOpts(g.ty,g.cid2,c.id)}</select></div>`:''}
      <div class="field"><label for="caNm">Nom affiché sur la carte</label><input id="caNm" type="text" data-fin="nom" value="${esc(g.nom||'')}" autocomplete="off">${g.ty!=='libre'?'<div class="muted small">Vide : le nom de la fiche.</div>':''}</div>
      <div class="field"><span class="lab2">Catégorie</span><div class="cachips2">${C.map(x=>`<button type="button" class="chip" data-act="caCatPick" data-id="${esc(x.id)}" aria-pressed="${g.cat===x.id}"><span class="cadotc" style="background:${esc(x.coul)}"></span>${esc(x.nom)}</button>`).join('')}<button type="button" class="chip add" data-act="caCatNew" aria-pressed="${!!g.nc}">＋ Nouvelle catégorie</button></div>
        ${g.nc?`<div class="canc"><input type="text" data-fin="ncn" value="${esc(g.ncn||'')}" placeholder="Nom de la catégorie" aria-label="Nom de la nouvelle catégorie" autocomplete="off"><input type="color" data-fin="ncc" value="${esc(g.ncc||'#4d7a2a')}" aria-label="Couleur de la nouvelle catégorie"></div>`:''}</div>
      <div class="field"><span class="lab2">Note</span><div class="fiedw"><div id="fiEd" class="fied" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Note du repère" spellcheck="true">${fiEdHtml(g.txt||'')}</div><div id="fiSug" class="fisug" role="listbox" hidden></div></div><div class="muted small">Tape <b>@</b> pour lier une fiche.</div></div>
      ${isGest()?`<div class="field"><span class="lab2">Visibilité</span><div class="seg" role="group" aria-label="Visibilité">${[['prep','Préparé'],['rev','Visible']].map(([v,l])=>`<button type="button" data-act="caVis" data-v="${v}" aria-pressed="${g.vis===v}">${l}</button>`).join('')}</div></div>`:'<div class="muted small">Le repère sera visible par toute la table.</div>'}
      ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
      <div class="actions">${r?(g.confirm?`<button class="btn" style="color:var(--bad);margin-right:auto" data-act="caRepDelOk">Confirmer la suppression</button>`:`<button class="btn ghost" style="color:var(--bad);margin-right:auto" data-act="caRepDel">Supprimer</button>`):''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="caRepSave">Enregistrer</button></div>`);}
  if(g.kind==='caTraj'){const c=S.fiches[g.cid];if(!c)return null;const t=g.id&&S.fiches[g.id];if(g.id&&(!t||!caCanEd(t)))return null;if(!g.id&&!fiCanNew())return null;
    const m=caLen(c,g.pts);
    return fiShell(g,'Trajet',`<div><h2>${t?'Trajet':'Enregistrer le trajet'}</h2><div class="muted small">${esc(c.nom)} · ${(g.pts||[]).length} points${m!=null?' · '+caDist(m):''}</div></div>
      <div class="field"><label for="caTn">Nom</label><input id="caTn" type="text" data-fin="nom" value="${esc(g.nom||'')}" autocomplete="off"></div>
      <div class="field"><span class="lab2">Couleur</span><div class="casw">${CA_COUL.map(k=>`<button type="button" class="caswb" data-act="caCoul" data-v="${k}" style="background:${k}" aria-pressed="${g.coul===k}" aria-label="Couleur ${k}"></button>`).join('')}</div></div>
      <div class="field"><label for="caTt">Note</label><input id="caTt" type="text" data-fin="note" value="${esc(g.note||'')}" autocomplete="off"></div>
      ${isGest()?`<div class="field"><span class="lab2">Visibilité</span><div class="seg" role="group" aria-label="Visibilité">${[['prep','Préparé'],['rev','Visible']].map(([v,l])=>`<button type="button" data-act="caVis" data-v="${v}" aria-pressed="${g.vis===v}">${l}</button>`).join('')}</div></div>`:''}
      ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
      <div class="actions">${t?(g.confirm?`<button class="btn" style="color:var(--bad);margin-right:auto" data-act="caTrDelOk">Confirmer la suppression</button>`:`<button class="btn ghost" style="color:var(--bad);margin-right:auto" data-act="caTrDel">Supprimer</button>`):''}<button class="btn" data-act="caTrRedo">${t?'Retracer':'Reprendre le tracé'}</button><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="caTrSave">Enregistrer</button></div>`);}
  if(g.kind==='caEch'){const c=S.fiches[g.cid];if(!c||!canEdit())return null;
    return fiShell(g,'Échelle',`<div><h2>Échelle de ${esc(c.nom)}</h2><div class="muted small">Réglée une fois : elle sert à toutes les distances et durées de la carte.</div></div>
      <div style="display:flex;gap:8px;align-items:flex-end"><div class="field" style="flex:1"><label for="caEl">Longueur de A à B</label><input id="caEl" type="number" min="0" step="any" data-fin="l" value="${esc(g.l||'')}"></div>
      <div class="field" style="width:130px"><label for="caEu">Unité</label><select id="caEu" data-fin="u">${Object.entries(CA_UNIT).map(([k,[l]])=>`<option value="${k}"${g.u===k?' selected':''}>${l}</option>`).join('')}</select></div></div>
      <div class="muted small">Une lieue = 4 km.</div>
      ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
      <div class="actions">${c.ech?`<button class="btn ghost" style="color:var(--bad);margin-right:auto" data-act="caEchDel">Sans échelle</button>`:''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="caEchSave">Enregistrer</button></div>`);}
  if(g.kind==='caPlace'){const L=fiSort(fiAll().filter(c=>caIsMap(c)&&fiSee(c)));
    return fiShell(g,'Placer sur une carte',`<div><h2>Placer sur une carte</h2><div class="muted small">${esc(g.nom||'')}</div></div>
      <div class="field"><label for="caPc">Carte</label><select id="caPc" data-fin="carte"><option value="">— choisir —</option>${L.map(c=>`<option value="${esc(c.id)}"${g.carte===c.id?' selected':''}>${esc(fiPath(c).filter(fiSee).map(p=>p.nom).concat([c.nom]).join(' › '))}</option>`).join('')}</select></div>
      <div class="muted small">La carte s'ouvre : touche l'endroit voulu pour poser le repère.</div>
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="caPlaceGo">Continuer</button></div>`);}
  return null;}
/* ---------- Actions ---------- */
function caGo(cid,rid){const c=S.fiches[cid];if(!c||!fiSee(c))return;const r=rid&&S.fiches[rid];S.caMode=null;S.caTmp=null;S.caSel=null;S.caQ='';
  if(r)S.caFocus={cid,x:r.x,y:r.y,rid:r.id};
  if(S.fi===cid&&S.view==='univers'){render();return;}navGo({t:'fiche',id:cid});render();}
function caStart(m,c,o){S.caMode=m;S.caTmp={cid:c.id,pts:[],...(o||{})};S.caSel=null;render();}
function caZoomBy(c,k,px,py){const v=CA_V[c.id];if(!v)return;const el=document.getElementById('caMap');const W=el?el.clientWidth:caFit(c).W,H=el?el.clientHeight:caFit(c).H;
  if(px==null){px=W/2;py=H/2;}const z=Math.max(v.min||.05,Math.min(6,v.z*k)),f=z/v.z;v.x=px-(px-v.x)*f;v.y=py-(py-v.y)*f;v.z=z;caPaint(c);}
function caPaint(c){const el=document.getElementById('caMap'),v=CA_V[c.id];if(!el||!v)return;const i=el.querySelector('.cain');if(i){i.style.transform=`translate(${v.x}px,${v.y}px) scale(${v.z})`;i.style.setProperty('--k',(1/v.z).toFixed(4));}
  const b=el.querySelector('.cabar');if(b)b.outerHTML=caBar(c,v.z);}
function caClick(c,fx,fy){if(fx<0||fy<0||fx>1||fy>1)return;const M=S.caMode,T=S.caTmp;
  if(!M||!T||T.cid!==c.id){if(S.caSel){S.caSel=null;render();}return;}
  if(M==='rep'){S.caMode=null;S.caTmp=null;caRepOpen(c,null,fx,fy,T.pre);return;}
  if(M==='move'){const r=S.fiches[T.rid];S.caMode=null;S.caTmp=null;if(r&&caCanEd(r)){const n=clone(r);n.x=fx;n.y=fy;S.caSel=r.id;fiSave(n);}else render();return;}
  if(M==='regle'){if((T.pts||[]).length>=2)T.pts=[];T.pts.push([fx,fy]);render();return;}
  if(M==='ech'){T.pts.push([fx,fy]);if(T.pts.length>=2){const e=c.ech&&caMpp(c)?c.ech:null;fiOpenDlg({kind:'caEch',cid:c.id,pts:T.pts.slice(0,2),l:e?String(e.l):'',u:e?e.u:'m'});}render();return;}
  if(M==='traj'){T.pts.push([fx,fy]);render();return;}}
function caRepOpen(c,r,x,y,pre){
  if(r)fiOpenDlg({kind:'caRep',cid:c.id,id:r.id,ty:caCibTy(r),cid2:(r.cib||{}).id||'',nom:r.nom,cat:r.cat||caCfg().cats[0].id,txt:r.note||'',vis:r.vis||'rev'});
  else{const ty=pre?pre.ty:'lieu',cat=isGest()?caCfg().cats[0].id:(caCfg().cats.find(x=>x.id==='jou')||caCfg().cats[0]).id;
    fiOpenDlg({kind:'caRep',cid:c.id,id:'',x,y,ty,cid2:pre?pre.id:'',nom:'',cat,txt:'',vis:'rev'});}
  render();}
function caAct(a,d){if(/^caPd/.test(a))return caParamAct(a,d);const f=S.fi&&S.fiches[S.fi],c=caIsMap(f)?f:null,g=S.dlg;
  if(a==='caGo'){caGo(d.id,d.rid);return true;}
  if(a==='caSel'){S.caSel=d.id||null;const r=d.id&&S.fiches[d.id];if(r&&c&&d.id&&CA_V[c.id]){const v=CA_V[c.id],el=document.getElementById('caMap');if(v&&el){const sx=r.x*caIW(c)*v.z+v.x,sy=r.y*caIH(c)*v.z+v.y;if(sx<40||sy<80||sx>el.clientWidth-40||sy>el.clientHeight-20){v.x=el.clientWidth/2-r.x*caIW(c)*v.z;v.y=el.clientHeight*.6-r.y*caIH(c)*v.z;}}if(el)el.scrollIntoView({block:'nearest'});}render();return true;}
  if(a==='caTrSel'){const t=S.fiches[d.id];if(t&&c&&(t.pts||[]).length){const xs=t.pts.map(p=>p[0]),ys=t.pts.map(p=>p[1]);S.caFocus={cid:c.id,x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2};const el=document.getElementById('caMap');if(el)el.scrollIntoView({block:'nearest'});}render();return true;}
  if(a==='caZoom'){if(c)caZoomBy(c,+d.v>0?1.4:1/1.4);return true;}
  if(a==='caFull'){S.caFull=!S.caFull;document.body.classList.toggle('cafull',S.caFull);render();return true;}
  if(a==='caPan'){const op=S.caPan!==false&&S.caPan!==undefined?!!S.caPan:(window.innerWidth||390)>=1024;S.caPan=!op;render();return true;}
  if(a==='caPt'){S.caPt=d.v||'rep';S.caPan=true;render();return true;}
  if(a==='caCatTog'){S.caHid={...S.caHid,[d.id]:!S.caHid[d.id]};render();return true;}
  if(a==='caRegle'){if(c)caStart('regle',c);return true;}
  if(a==='caCancel'){S.caMode=null;S.caTmp=null;render();return true;}
  if(S.visit)return true;
  if(a==='caAdd'){if(c&&fiCanNew())caStart('rep',c);return true;}
  if(a==='caTrNew'){if(c&&fiCanNew())caStart('traj',c,{coul:CA_COUL[0]});return true;}
  if(a==='caEchGo'){if(c&&canEdit())caStart('ech',c);return true;}
  if(a==='caMove'){const r=S.fiches[d.id];if(c&&r&&caCanEd(r))caStart('move',c,{rid:r.id});return true;}
  if(a==='caUndo'){if(S.caTmp){S.caTmp.pts.pop();render();}return true;}
  if(a==='caTrEnd'){const T=S.caTmp;if(!c||!T||(T.pts||[]).length<2)return true;const t=T.tid&&S.fiches[T.tid];S.caMode=null;S.caTmp=null;
    fiOpenDlg({kind:'caTraj',cid:c.id,id:t?t.id:'',pts:T.pts,nom:t?t.nom:'',coul:t?t.coul:(T.coul||CA_COUL[0]),note:t?t.note||'':'',vis:t?t.vis:'rev'});render();return true;}
  if(a==='caTrEd'){const t=S.fiches[d.id];if(!c||!t||!caCanEd(t))return true;fiOpenDlg({kind:'caTraj',cid:c.id,id:t.id,pts:t.pts||[],nom:t.nom,coul:t.coul||CA_COUL[0],note:t.note||'',vis:t.vis||'rev'});render();return true;}
  if(a==='caTrRedo'){if(!g||g.kind!=='caTraj')return true;const cc=S.fiches[g.cid];S.dlg=null;S.caMode='traj';S.caTmp={cid:g.cid,pts:(g.pts||[]).slice(),tid:g.id||'',coul:g.coul};if(cc&&S.fi!==cc.id)caGo(cc.id);else render();return true;}
  if(a==='caRepEd'){const r=S.fiches[d.id];if(c&&r&&caCanEd(r))caRepOpen(c,r);return true;}
  if(a==='caPlace'){if(!fiCanNew())return true;const o=d.t==='perso'?S.chars[d.id]:S.fiches[d.id];if(!o)return true;
    const ty=d.t==='perso'?'pnj':o.genre;fiOpenDlg({kind:'caPlace',t:d.t,id:d.id,ty,nom:d.t==='perso'?fiCN(o):o.nom,carte:''});render();return true;}
  if(a==='caPlaceGo'){if(!g||g.kind!=='caPlace'||!g.carte)return true;const cc=S.fiches[g.carte];if(!cc)return true;const pre={ty:g.ty,id:g.id};S.dlg=null;
    S.caMode='rep';S.caTmp={cid:cc.id,pts:[],pre};S.caSel=null;S.caQ='';navGo({t:'fiche',id:cc.id});render();return true;}
  /* fenêtres */
  if(!g)return true;
  if(a==='caTy'){g.ty=d.v;g.cid2='';S._fiRedraw=true;render();return true;}
  if(a==='caVis'){g.vis=d.v==='prep'?'prep':'rev';S._fiRedraw=true;render();return true;}
  if(a==='caCoul'){g.coul=d.v;S._fiRedraw=true;render();return true;}
  if(a==='caCatPick'){g.cat=d.id;g.nc=false;S._fiRedraw=true;render();return true;}
  if(a==='caCatNew'){g.nc=!g.nc;S._fiRedraw=true;render();return true;}
  if(a==='caRepDel'||a==='caTrDel'){g.confirm=true;S._fiRedraw=true;render();return true;}
  if(a==='caRepDelOk'||a==='caTrDelOk'){const x=S.fiches[g.id];if(!x||!caCanEd(x))return true;S.dlg=null;S.caSel=null;fiRemove(x.id);render();setTimeout(()=>toast(a==='caRepDelOk'?'Repère supprimé':'Trajet supprimé'),0);return true;}
  if(a==='caRepSave'){if(g.kind!=='caRep')return true;const cc=S.fiches[g.cid];if(!cc)return true;const ex=g.id&&S.fiches[g.id];if(ex&&!caCanEd(ex))return true;
    const err=t=>{g.err=t;S._fiRedraw=true;render();return true;};
    const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||'');let nom=(g.nom||'').trim(),cib=null;
    if(g.ty!=='libre'){if(!g.cid2)return err('Choisis la fiche à rattacher, ou « Libre ».');
      if(g.cid2==='__new'){if(!nom)return err('Écris le nom du repère : la fiche prendra ce nom.');
        if(g.ty==='pnj'){const nc=ctcNewPnj(nom);cib={s:'perso',id:nc.id};}
        else{const now=new Date().toISOString(),nf={id:fiRid('f-'),genre:g.ty,nom,type:'',parent:'',kanka:'',vis:'rev',eye:Object.fromEntries(['desc','sait'].concat(g.ty==='org'?FI6_EYE.org||[]:[]).map(k=>[k,true])),desc:'',sait:[],notes:'',par:ME||'',cree:now,modif:now};fiSave(nf,true);cib={s:'fiche',id:nf.id};}}
      else cib={s:g.ty==='pnj'?'perso':g.ty==='carte'?'carte':'fiche',id:g.cid2};
      if(!nom)nom=caCibNom({cib,nom:''});}
    if(!nom)return err('Le nom est obligatoire pour un repère libre.');
    let cat=g.cat;if(g.nc){const cn=(g.ncn||'').trim();if(!cn)return err('Donne un nom à la nouvelle catégorie.');const C=caCfg();const same=C.cats.find(x=>nrm(x.nom)===nrm(cn));
      if(same)cat=same.id;else{cat=uid('cat');caCfgSave({...C,cats:[...C.cats,{id:cat,nom:cn,coul:g.ncc||'#4d7a2a'}]});}}
    const now=new Date().toISOString(),n=ex?clone(ex):{id:fiRid('r-'),genre:'rep',carte:cc.id,x:g.x,y:g.y,par:ME||'',cree:now};
    n.nom=nom;n.cat=cat;n.note=txt;if(cib)n.cib=cib;else delete n.cib;n.vis=isGest()?(g.vis==='prep'?'prep':'rev'):(ex?ex.vis:'rev');
    FI_AT=null;S.dlg=null;S.caSel=n.id;fiSave(n);setTimeout(()=>toast(ex?'Repère enregistré':'Repère posé'),0);return true;}
  if(a==='caTrSave'){if(g.kind!=='caTraj')return true;const cc=S.fiches[g.cid];if(!cc)return true;const ex=g.id&&S.fiches[g.id];if(ex&&!caCanEd(ex))return true;const nom=(g.nom||'').trim();
    if(!nom){g.err='Donne un nom au trajet.';S._fiRedraw=true;render();return true;}
    const now=new Date().toISOString(),n=ex?clone(ex):{id:fiRid('t-'),genre:'traj',carte:cc.id,par:ME||'',cree:now};
    n.nom=nom;n.pts=(g.pts||[]).map(p=>[+(+p[0]).toFixed(5),+(+p[1]).toFixed(5)]);n.coul=g.coul||CA_COUL[0];n.note=(g.note||'').trim();n.vis=isGest()?(g.vis==='prep'?'prep':'rev'):(ex?ex.vis:'rev');
    S.dlg=null;fiSave(n);setTimeout(()=>toast('Trajet enregistré'),0);return true;}
  if(a==='caEchSave'){if(g.kind!=='caEch'||!canEdit())return true;const cc=S.fiches[g.cid],l=parseFloat(String(g.l||'').replace(',','.'));if(!cc)return true;
    if(!(l>0)){g.err='Indique une longueur.';S._fiRedraw=true;render();return true;}const P=g.pts||[];if(P.length<2)return true;
    const n=clone(cc);n.ech={ax:+P[0][0].toFixed(5),ay:+P[0][1].toFixed(5),bx:+P[1][0].toFixed(5),by:+P[1][1].toFixed(5),l,u:CA_UNIT[g.u]?g.u:'m'};
    S.dlg=null;S.caMode=null;S.caTmp=null;fiSave(n);setTimeout(()=>toast('Échelle enregistrée'),0);return true;}
  if(a==='caEchDel'){if(g.kind!=='caEch'||!canEdit())return true;const cc=S.fiches[g.cid];if(!cc)return true;const n=clone(cc);delete n.ech;S.dlg=null;S.caMode=null;S.caTmp=null;fiSave(n);return true;}
  return true;}
function caCfgSave(n){S.caCfg=n;persist('meta/cartes',n);}
/* Suppressions : repères et trajets d'une carte supprimés avec elle ; repères visant une fiche supprimée devenus libres */
function caUnlink(t,id){const f=t==='fiche'?S.fiches[id]:null;
  if(f&&caIsMap(f))for(const x of fiAll())if((x.genre==='rep'||x.genre==='traj')&&x.carte===id){const m={...S.fiches};delete m[x.id];S.fiches=m;persistDel('fiches/'+x.id);}
  for(const r of fiAll())if(r.genre==='rep'&&r.cib&&r.cib.id===id&&(t==='perso')===(r.cib.s==='perso')){const n=clone(r);n.nom=n.nom||caCibNom(r);delete n.cib;fiSave(n,true);}}
/* ---------- Gestes sur la carte ---------- */
const CA_G={pts:new Map(),pin:null,moved:false,d0:0,z0:1,mid:null,lp:null,t0:0};
function caFromEv(el,ev){const c=S.fiches[el.dataset.cid],v=c&&CA_V[c.id];if(!v)return null;const b=el.getBoundingClientRect();return {c,v,px:ev.clientX-b.left,py:ev.clientY-b.top,fx:(ev.clientX-b.left-v.x)/v.z/caIW(c),fy:(ev.clientY-b.top-v.y)/v.z/caIH(c)};}
function caEnd(){CA_BUSY=false;if(CA_PEND){CA_PEND=false;render();}}
document.addEventListener('pointerdown',ev=>{const el=ev.target.closest&&ev.target.closest('#caMap');if(!el||ev.target.closest('.cactl,.cabub'))return;
  const p=caFromEv(el,ev);if(!p)return;CA_BUSY=true;el.setPointerCapture&&el.setPointerCapture(ev.pointerId);
  CA_G.pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});if(CA_G.pts.size===1){CA_G.moved=false;CA_G.s0={x:ev.clientX,y:ev.clientY};}CA_G.t0=Date.now();
  const pin=ev.target.closest('[data-capin]');CA_G.pin=pin?pin.dataset.capin:null;
  if(CA_G.pts.size===2){const [a,b]=[...CA_G.pts.values()];CA_G.d0=Math.hypot(a.x-b.x,a.y-b.y);CA_G.z0=p.v.z;CA_G.moved=true;clearTimeout(CA_G.lp);return;}
  clearTimeout(CA_G.lp);if(!S.caMode&&!CA_G.pin&&fiCanNew()&&!S.visit){const fx=p.fx,fy=p.fy,c=p.c;CA_G.lp=setTimeout(()=>{if(CA_G.moved||CA_G.pts.size!==1)return;CA_G.moved=true;CA_G.pts.clear();caEnd();if(navigator.vibrate)try{navigator.vibrate(30);}catch(e){}caRepOpen(c,null,fx,fy);},650);}
  if(ev.pointerType==='mouse')ev.preventDefault();});
document.addEventListener('pointermove',ev=>{if(!CA_G.pts.has(ev.pointerId))return;const el=document.getElementById('caMap');if(!el)return;const p=caFromEv(el,ev);if(!p)return;
  const prev=CA_G.pts.get(ev.pointerId);CA_G.pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  if(CA_G.pts.size===2){const [a,b]=[...CA_G.pts.values()],dd=Math.hypot(a.x-b.x,a.y-b.y),bb=el.getBoundingClientRect();if(CA_G.d0)caZoomBy(p.c,CA_G.z0*dd/CA_G.d0/p.v.z,(a.x+b.x)/2-bb.left,(a.y+b.y)/2-bb.top);return;}
  const dx=ev.clientX-prev.x,dy=ev.clientY-prev.y;
  if(!CA_G.moved){const s0=CA_G.s0||{x:prev.x,y:prev.y};if(Math.hypot(ev.clientX-s0.x,ev.clientY-s0.y)<6){CA_G.pts.set(ev.pointerId,prev);return;}CA_G.moved=true;clearTimeout(CA_G.lp);}
  p.v.x+=dx;p.v.y+=dy;caPaint(p.c);});
function caUp(ev){if(!CA_G.pts.has(ev.pointerId))return;const el=document.getElementById('caMap');const p=el&&caFromEv(el,ev);CA_G.pts.delete(ev.pointerId);clearTimeout(CA_G.lp);
  if(CA_G.pts.size)return;CA_G.s0=null;const moved=CA_G.moved,pin=CA_G.pin;CA_G.pin=null;CA_BUSY=false;
  if(!moved&&p&&ev.type==='pointerup'){CA_PEND=false;/* après le « click » qui suit (sinon il tomberait sur le fond de la fenêtre ouverte) */setTimeout(()=>{if(pin&&!S.caMode){S.caSel=S.caSel===pin?null:pin;render();return;}caClick(p.c,p.fx,p.fy);},0);return;}
  caEnd();}
document.addEventListener('pointerup',caUp);document.addEventListener('pointercancel',caUp);
document.addEventListener('wheel',ev=>{const el=ev.target.closest&&ev.target.closest('#caMap');if(!el)return;const p=caFromEv(el,ev);if(!p)return;ev.preventDefault();caZoomBy(p.c,ev.deltaY<0?1.15:1/1.15,p.px,p.py);},{passive:false});
document.addEventListener('input',ev=>{const t=ev.target;if(!t||!t.dataset)return;
  if(t.dataset.caq!==undefined){S.caQ=t.value;const f=S.fi&&S.fiches[S.fi],r=document.getElementById('caRes');if(r&&caIsMap(f))r.innerHTML=caLists(f);return;}
  if(t.dataset.cap!==undefined&&S.caPd){caPdInput(t);}});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&S.caFull&&!S.dlg){S.caFull=false;document.body.classList.remove('cafull');render();}});
/* ---------- Paramètres › Règles › Cartes ---------- */
function caParams(){const G=canEdit();if(!S.caPd)S.caPd=clone(caCfg());const P=S.caPd,used={};for(const r of fiAll())if(r.genre==='rep'){const k=r.cat||caCfg().cats[0].id;used[k]=(used[k]||0)+1;}
  const cats=P.cats.map((c,i)=>`<div class="srow capr"><input type="color" data-cap="coul" data-i="${i}" value="${esc(c.coul)}" aria-label="Couleur de ${esc(c.nom)}"${G?'':' disabled'}><input type="text" data-cap="nom" data-i="${i}" value="${esc(c.nom)}" aria-label="Nom de la catégorie"${G?'':' disabled'}><span class="muted small">${used[c.id]||0}</span>${G?`<button type="button" class="ibtn" data-act="caPdUp" data-k="cats" data-i="${i}" aria-label="Monter ${esc(c.nom)}"${i?'':' disabled'}>↑</button><select data-cap="into" data-i="${i}" aria-label="Fusionner ${esc(c.nom)} dans"><option value="">${used[c.id]?'Fusionner…':'Supprimer…'}</option>${used[c.id]?P.cats.filter(x=>x.id!==c.id).map(x=>`<option value="${esc(x.id)}">dans ${esc(x.nom)}</option>`).join(''):'<option value="__del">Supprimer</option>'}</select>`:''}</div>`).join('');
  const moy=P.moy.map((m,i)=>`<div class="srow capr"><input type="text" data-cap="mnom" data-i="${i}" value="${esc(m.nom)}" aria-label="Moyen de déplacement"${G?'':' disabled'}><input type="number" min="0" step="any" data-cap="v" data-i="${i}" value="${esc(String(m.v))}" aria-label="Vitesse de ${esc(m.nom)} en km/h" style="width:80px"${G?'':' disabled'}><span class="muted small">km/h</span>${G?`<button type="button" class="ibtn" data-act="caPdUp" data-k="moy" data-i="${i}" aria-label="Monter ${esc(m.nom)}"${i?'':' disabled'}>↑</button><button type="button" class="ibtn" data-act="caPdDel" data-i="${i}" aria-label="Retirer ${esc(m.nom)}">✕</button>`:''}</div>`).join('');
  return `${G?'':'<div class="rolock">Lecture seule : réservé à la gestion, en mode édition.</div>'}
    ${cBlk('ca-cat','Catégories de repère',String(P.cats.length),cats+(G?`<div class="radd"><button class="btn" data-act="caPdAdd" data-k="cats">+ Catégorie</button></div>`:'')+'<div class="muted small" style="margin-top:6px">La couleur de la pastille vient de la catégorie. Les joueurs peuvent créer une catégorie en posant un repère. Une catégorie utilisée ne se supprime qu\'en la fusionnant dans une autre.</div>')}
    ${cBlk('ca-pic','Pictogrammes','fixes',`<div class="capics">${CA_TY.map(([k,l])=>`<span>${FI_SVG(CA_SVG[k],20)}<small>${l}</small></span>`).join('')}</div><div class="muted small">Le picto suit le type de la fiche rattachée.</div>`)}
    ${cBlk('ca-moy','Moyens de déplacement',String(P.moy.length),moy+(G?`<div class="radd"><button class="btn" data-act="caPdAdd" data-k="moy">+ Moyen de déplacement</button></div>`:'')+'<div class="muted small" style="margin-top:6px">Durée d\'un trajet = distance ÷ vitesse (sans relief ni arrêts). Le premier de la liste sert à la règle.</div>')}
    ${G?`<div class="actions" style="margin-top:10px"><button class="btn" data-act="caPdReset">Annuler les changements</button><button class="btn pri" data-act="caPdSave">Enregistrer</button></div>`:''}`;}
function caPdInput(t){const P=S.caPd,i=+t.dataset.i,k=t.dataset.cap;if(!P)return;
  if(k==='coul'||k==='nom'){if(P.cats[i])P.cats[i][k]=t.value;}else if(k==='mnom'){if(P.moy[i])P.moy[i].nom=t.value;}else if(k==='v'){if(P.moy[i])P.moy[i].v=parseFloat(String(t.value).replace(',','.'))||0;}}
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.cap!=='into'||!S.caPd||!canEdit())return;const P=S.caPd,i=+t.dataset.i,c=P.cats[i];if(!c||!t.value)return;
  if(t.value!=='__del'){P.merge=(P.merge||[]).concat([[c.id,t.value]]);}P.cats.splice(i,1);render();});
function caParamAct(a,d){if(!canEdit())return true;const P=S.caPd;if(!P)return true;
  if(a==='caPdAdd'){if(d.k==='cats')P.cats.push({id:uid('cat'),nom:'Nouvelle catégorie',coul:'#4d7a2a'});else P.moy.push({id:uid('m'),nom:'Nouveau moyen',v:10});render();return true;}
  if(a==='caPdUp'){const L=P[d.k],i=+d.i;if(L&&i>0){[L[i-1],L[i]]=[L[i],L[i-1]];}render();return true;}
  if(a==='caPdDel'){P.moy.splice(+d.i,1);render();return true;}
  if(a==='caPdReset'){S.caPd=null;render();return true;}
  if(a==='caPdSave'){const M=P.merge||[],ok=new Set(P.cats.map(c=>c.id));
    const to=id=>{let x=id,n=0;while(!ok.has(x)&&n++<20){const m=M.find(y=>y[0]===x);if(!m)break;x=m[1];}return ok.has(x)?x:(P.cats[0]||{}).id;};
    if(!P.cats.length){toast('Il faut au moins une catégorie');return true;}
    for(const r of fiAll())if(r.genre==='rep'&&r.cat&&!ok.has(r.cat)){const n=clone(r);n.cat=to(r.cat);fiSave(n,true);}
    caCfgSave({cats:P.cats.map(c=>({id:c.id,nom:(c.nom||'').trim()||'Sans nom',coul:c.coul})),moy:P.moy.filter(m=>(m.nom||'').trim()).map(m=>({id:m.id,nom:m.nom.trim(),v:+m.v||0}))});
    S.caPd=null;render();setTimeout(()=>toast('Réglages des cartes enregistrés'),0);return true;}
  return true;}
function caHeadFields(g){const L=fiSort(fiAll().filter(x=>x.genre==='lieu'&&fiSee(x)));
  return `<div class="field"><label for="caLi">Lieu associé</label><select id="caLi" data-fin="lieu"><option value="">— aucun —</option>${L.map(x=>`<option value="${esc(x.id)}"${x.id===g.lieu?' selected':''}>${esc(fiPath(x).filter(fiSee).map(p=>p.nom).concat([x.nom]).join(' › '))}</option>`).join('')}</select><div class="muted small">La carte s'affiche sur la fiche du lieu (bloc « Sur la carte »).</div></div>`;}

/* ---------- Recherche globale (26/11/2026) ----------
   Loupe dans l'en-tête (et Ctrl + K ou « / » au clavier) → écran « Recherche » (S.view='srch').
   Cherche dans ce que la personne voit : noms (personnages, fiches, races, pouvoirs et capacités, journaux et quêtes, secrets)
   et textes (descriptions, « Ce que l'on sait », spécimens, Notes MJ pour la gestion, Portrait des PNJ, journaux, pouvoirs).
   Sans tenir compte des accents ni des majuscules ; résultats dès 2 lettres. Filtre par genre gardé pendant la session.
   Recherches récentes et fiches ouvertes depuis la recherche : propres à ce navigateur (localStorage xp.srch). */
const SR_G=[['perso','Personnages'],['lieu','Lieux'],['org','Organisations'],['famille','Familles'],['objet','Objets'],['bete','Bestiaire'],['carte','Cartes'],['evenement','Chronique'],['chrono','Histoire'],['jour','Journaux et quêtes'],['race','Races'],['pw','Pouvoirs et capacités'],['art','Arts obscurs'],['secret','Secrets'],['regle','Règles']];
const SR_LAB=Object.fromEntries(SR_G);
const cap1=t=>t?t[0].toUpperCase()+t.slice(1):t;
const srState=()=>S.srch||(S.srch={q:'',g:'all',more:false});
function srMem(){try{return JSON.parse(localStorage.getItem('xp.srch')||'null')||{q:[],o:[]};}catch(e){return {q:[],o:[]};}}
function srMemSet(m){try{localStorage.setItem('xp.srch',JSON.stringify(m));}catch(e){}}
/* Texte lisible : jetons « @ » remplacés par le nom, images retirées */
const srPlain=s=>String(s||'').replace(FI_TOK,(m,t,id,nom)=>t==='img'?'':(fiTokName(t,id)||nom));
/* Recherche sans accents, avec correspondance des positions pour surligner le texte d'origine */
function srIdx(txt,q){let n='',map=[];for(let i=0;i<txt.length;i++){const c=txt[i].normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[’]/g,"'").replace(/\s/g,' ');for(const x of c){n+=x;map.push(i);}}
  const k=n.indexOf(q);return k<0?null:{a:map[k],b:map[k+q.length-1]+1};}
const srMark=(txt,r)=>esc(txt.slice(0,r.a))+'<mark>'+esc(txt.slice(r.a,r.b))+'</mark>'+esc(txt.slice(r.b));
function srExtract(txt,q){txt=srPlain(txt).replace(/\s+/g,' ').trim();const r=srIdx(txt,q);if(!r)return null;
  const a=Math.max(0,r.a-55),b=Math.min(txt.length,r.b+75);let s=txt.slice(a,b);const ra={a:r.a-a,b:r.b-a};
  return (a>0?'… ':'')+srMark(s,ra)+(b<txt.length?' …':'');}
const srQ=q=>q.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
/* Calcul des résultats : {names:[{g,o,nom,sub,img,prep,st}], texts:[{g,o,nom,sub,where,ex}]} */
function srRun(q0){const q=srQ(q0),N=[],T=[],G=isGest();if(q.length<2)return {N,T};
  const nm=(g,o,noms,sub,img,prep)=>{const P=noms[0]||'';for(const x of noms.filter(Boolean)){const r=srIdx(x,q);if(r){N.push({g,o,nom:P,hi:x===P?srMark(x,r):esc(P),alt:x===P?'':'« '+srMark(x,r)+' » · ',sub,img,prep,st:r.a===0?0:1});return true;}}return false;};
  const tx=(g,o,nom,sub,where,txt)=>{const ex=srExtract(txt,q);if(ex)T.push({g,o,nom,sub,where,ex});return !!ex;};
  for(const c of Object.values(S.chars||{})){if(!vis(c))continue;const o={t:'perso',id:c.id},sub=c.type==='PJ'?'PJ':'PNJ'+(c.race?' · '+c.race:'');
    nm('perso',o,[c.court||c.nom,c.nom!==c.court?c.nom:'',c.surnom],sub,S.ptr&&S.ptr[c.id]);
    if(c.type==='PNJ')for(const [k,l] of PN_POR)if(pnBlkSee(c,k)&&tx('perso',o,fiCN(c),sub,'Portrait › '+l,(c.por||{})[k]))break;}
  for(const f of fiAll()){if(!fiSee(f)||!SR_LAB[f.genre])continue;const o={t:'fiche',id:f.id},ev=f.genre==='evenement',nom=ev&&(f.num||'').trim()?f.num.trim()+' · '+f.nom:f.nom;
    const sub=(f.type||cap1((FI_G[f.genre]||{}).un||(ev?'événement':f.genre==='carte'?'carte':'fiche')))+(f.parent&&S.fiches[f.parent]&&fiSee(S.fiches[f.parent])?' · '+S.fiches[f.parent].nom:'');
    nm(f.genre,o,[nom],sub,illOf('fiche',f.id),G&&f.vis!=='rev');
    const L=[[ev?'Résumé':'Description',fiBlkSee(f,'desc')&&f.desc]];
    for(const it of f.sait||[])if(fiItSee(f,it))L.push(["Ce que l'on sait",it.txt]);
    for(const x of f.spec||[])if(fiSpecSee(x))L.push(['Spécimens connus',(x.nom||'')+' : '+(x.txt||'')]);
    for(const x of f.els||[])if(ctElSee(x))L.push(['Histoire',(x.nom||'')+' : '+(x.txt||'')]); /* chronologies */
    if(f.effet&&fiBlkSee(f,'effet'))L.push(['Effet',f.effet]);
    if(G&&f.notes)L.push(['Notes MJ',f.notes]);
    for(const [w,t] of L)if(t&&tx(f.genre,o,nom,sub,w,t))break;}
  for(const cr of raceCres()){const x=raceRec(cr);if(!raceVisible(cr,x))continue;const o={t:'race',id:cr.id},p=raceNm(x),oth=(x.fem||'').trim()&&x.fem!==p?x.fem:x.sing!==p?x.sing:'';
    nm('race',o,[p,oth],'Race',illOf('race',cr.id));}
  for(const [k,M] of [['pw',S.pouvoirs],['cap',S.capacites]])for(const id in M||{}){if(!elSeen(k,id))continue;const e=M[id],o={t:k,id},sub=k==='pw'?'Pouvoir':'Capacité naturelle';
    nm('pw',o,[e.nom],sub,illOf(k,id));tx('pw',o,e.nom,sub,'Description',e.desc);}
  for(const f of fiAll())if(f.genre==='art'&&fiBlkSee(f,'sorts'))for(const x of aoSorts(f))nm('art',{t:'fiche',id:f.id},[x.nom],'Sort · '+f.nom); /* arts obscurs */
  for(const J of jrAll()){if(!jrCanRead(J))continue;const h=jrHost(J),o={t:'jour',id:J.id},sub=(J.genre==='quete'?'Quête':'Journal')+(h?' · '+(h.court||h.nom):'');
    nm('jour',o,[J.nom],sub);if(!tx('jour',o,J.nom,sub,'Description',J.desc))for(const e of J.ent||[])if(tx('jour',{t:'jour',id:J.id,i:e.id},J.nom,sub,'« '+(e.nom||'Entrée')+' »',e.txt))break;}
  for(const s of S.secrets||[]){const o={t:'secret',n:s.n};if(!lnkOk(o))continue;const lab=secLabel(s,G);nm('secret',o,[lab],'Secret');}
  /* UX3 : Règles (lignes des sections ; les pages du livre sont des fiches « regle ») */
  if(typeof rgData==='function'){const D=rgData();for(const [k,t] of RG_SEC)for(const [lab,txt] of D[k]||[]){const o={t:'regles',k,l:lab};if(!nm('regle',o,[lab],'Règles · '+t))tx('regle',o,lab,'Règles · '+t,'',txt);}}
  N.sort((a,b)=>a.st-b.st||a.nom.localeCompare(b.nom,'fr',{sensitivity:'base'}));
  const sk=x=>x.g+':'+(x.o.id||x.o.n||(x.o.k+'|'+x.o.l));const seen=new Set(N.map(sk));
  return {N,T:T.filter(x=>!seen.has(sk(x))).sort((a,b)=>a.nom.localeCompare(b.nom,'fr',{sensitivity:'base'}))};}
const SR_IC='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
const srThumb=(img,g)=>`<span class="srth${g==='perso'?' r':''}"${img?'':' aria-hidden="true"'}>${img?`<img src="${img}" alt="">`:''}</span>`;
function srRow(x){return `<button type="button" class="srrow" ${lnkAttrs(x.o)} data-srch="1">${srThumb(x.img,x.g)}<span class="srtx"><b>${x.hi||esc(x.nom)}</b><small>${x.alt||''}${esc(x.sub||'')}${x.where?' · '+esc(x.where):''}</small>${x.ex?`<span class="srex">${x.ex}</span>`:''}</span>${x.prep?'<span class="srprep">préparée</span>':''}</button>`;}
function srResults(){const st=srState(),q=srQ(st.q);
  if(q.length<2){const m=srMem(),rq=m.q||[],ro=(m.o||[]).filter(x=>lnkOk(x.o)).slice(0,5);
    if(!rq.length&&!ro.length)return `<div class="muted small srhint">Tape au moins 2 lettres. Accents et majuscules sont ignorés.</div>`;
    return (rq.length?`<div class="lab2 srlab">Recherches récentes</div><div class="srlst">${rq.map(t=>`<div class="srrec"><button type="button" class="srrecb" data-act="srRec" data-v="${esc(t)}">↺ ${esc(t)}</button><button type="button" class="srx" data-act="srRecDel" data-v="${esc(t)}" aria-label="Retirer ${esc(t)}">✕</button></div>`).join('')}</div>`:'')
      +(ro.length?`<div class="lab2 srlab">Ouverts récemment</div><div class="srlst">${ro.map(x=>`<button type="button" class="srrow" ${lnkAttrs(x.o)}>${srThumb(null,x.o.t==='perso'?'perso':'')}<span class="srtx"><b>${esc(x.n)}</b></span></button>`).join('')}</div>`:'');}
  const R=srRun(st.q),cnt={};for(const x of [...R.N,...R.T])cnt[x.g]=(cnt[x.g]||0)+1;
  const tot=R.N.length+R.T.length,G0=st.g!=='all'&&!cnt[st.g]?st.g:null,g=st.g;
  let h=`<div class="srchips" role="group" aria-label="Chercher dans"><button type="button" class="srchip" data-act="srG" data-v="all" aria-pressed="${g==='all'}">Tout · ${tot}</button>${SR_G.filter(([k])=>cnt[k]||k===G0).map(([k,l])=>`<button type="button" class="srchip" data-act="srG" data-v="${k}" aria-pressed="${g===k}">${l} · ${cnt[k]||0}</button>`).join('')}</div>`;
  const N=R.N.filter(x=>g==='all'||x.g===g),T=R.T.filter(x=>g==='all'||x.g===g);
  if(!N.length&&!T.length){const lab=g==='all'?'':SR_LAB[g].toLowerCase();
    return h+`<div class="srnone"><div class="rs srnt">Aucun résultat${lab?' dans « '+esc(SR_LAB[g])+' »':''}</div><div class="muted">${g!=='all'&&tot?`« ${esc(st.q.trim())} » apparaît ailleurs dans l'univers : ${tot} résultat${tot>1?'s':''}.`:`Rien pour « ${esc(st.q.trim())} » dans ce que tu peux voir.`}</div>${g!=='all'&&tot?'<button type="button" class="btn pri" data-act="srG" data-v="all">Chercher dans tout l\'univers</button>':''}</div>`;}
  if(N.length){h+=`<div class="rs srsec">Dans les noms · ${N.length}</div><div class="srlst">`;
    for(const [k,l] of SR_G){const L=N.filter(x=>x.g===k);if(L.length)h+=`<div class="srgh">${l}</div>`+L.map(srRow).join('');}h+='</div>';}
  if(T.length){const MX=12,V=st.more?T:T.slice(0,MX);h+=`<div class="rs srsec">Dans les textes · ${T.length}</div><div class="srlst">${V.map(srRow).join('')}${T.length>V.length?`<button type="button" class="srmore" data-act="srMore">Voir les ${T.length-V.length} autres</button>`:''}</div>`;}
  return h;}
function viewSrch(){const st=srState();
  return `<div class="srbox">${SR_IC}<label for="srchQ" class="vh">Rechercher</label><input id="srchQ" type="search" autocomplete="off" enterkeyhint="search" placeholder="Rechercher dans l'univers…" value="${esc(st.q)}"><button type="button" class="srx" data-act="srClose" aria-label="Fermer la recherche">✕</button></div>
    <div id="srchRes">${srResults()}</div>
    <div class="muted small srhint">Au clavier : Ctrl + K ou « / » ouvre la recherche, Échap la ferme.</div>`;}
function srPaint(){const r=document.getElementById('srchRes');if(r)r.innerHTML=srResults();}
function srOpen(){if(S.view==='srch'){const i=document.getElementById('srchQ');if(i)i.focus();return;}
  srState().more=false;S.dlg=null;S.sheet=null;S.asheet=null;S.confirm=null;S.view='srch';S._force=true;render();window.scrollTo(0,0);
  requestAnimationFrame(()=>{const i=document.getElementById('srchQ');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}});}
function srClose(){if(S.view!=='srch')return;if(HX.cur>0&&HX.L[HX.cur-1]&&HX.L[HX.cur-1].view!=='srch'){navBack();return;}navClear();S.view='home';S._force=true;render();}
function srAct(a,d){const st=srState();
  if(a==='srOpen'){srOpen();return true;}
  if(a==='srClose'){srClose();return true;}
  if(a==='srG'){st.g=d.v||'all';st.more=false;srPaint();return true;}
  if(a==='srMore'){st.more=true;srPaint();return true;}
  if(a==='srRec'){st.q=d.v||'';const i=document.getElementById('srchQ');if(i)i.value=st.q;srPaint();return true;}
  if(a==='srRecDel'){const m=srMem();m.q=(m.q||[]).filter(x=>x!==d.v);srMemSet(m);srPaint();return true;}
  return false;}
/* Mémoire : recherche et fiche ouverte depuis les résultats */
document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('#srchRes [data-act="lnk"]');if(!b||S.view!=='srch')return;
  const st=srState(),m=srMem(),q=(st.q||'').trim(),d=b.dataset,o={t:d.t};if(d.id!=null)o.id=d.id;if(d.n!=null&&d.t==='secret')o.n=+d.n;if(d.i!=null)o.i=d.i;
  if(q.length>=2)m.q=[q,...(m.q||[]).filter(x=>nrm(x)!==nrm(q))].slice(0,5);
  const nom=b.dataset.srch?(b.querySelector('b')||{}).textContent||'':'';if(nom){const k=JSON.stringify(o);m.o=[{o,n:nom},...(m.o||[]).filter(x=>JSON.stringify(x.o)!==k)].slice(0,5);}
  srMemSet(m);},true);
document.addEventListener('input',ev=>{if(ev.target&&ev.target.id==='srchQ'){const st=srState();st.q=ev.target.value;st.more=false;srPaint();}});
document.addEventListener('keydown',ev=>{if(S.gate)return;const t=ev.target,typing=t&&/INPUT|TEXTAREA|SELECT/.test(t.tagName)||(t&&t.isContentEditable);
  if((ev.key==='k'||ev.key==='K')&&(ev.ctrlKey||ev.metaKey)&&!ev.altKey){ev.preventDefault();srOpen();return;}
  if(ev.key==='/'&&!typing&&!S.dlg&&!ev.ctrlKey&&!ev.metaKey){ev.preventDefault();srOpen();return;}
  if(ev.key==='Escape'&&S.view==='srch'&&!S.dlg){ev.preventDefault();srClose();}});

/* ---------- Arts obscurs (26/11/2026) ----------
   Fiche genre « art » (règle des fiches) : description, prérequis, niveaux, sorts par niveau, pratiquants ; organisation liée (org).
   Réglages (Paramètres › Référentiel › Arts obscurs, gestion) : comp (compétence cachée, false pour le Spiritisme), org, pre:[{t,n,r,sp}],
   max (rang maximum, 7), cSort (XP par sort, 5), nReq (sorts du niveau inférieur pour monter, 2), niv:[4 noms propres].
   Sorts dans la fiche : sorts:[{id,nom,niv(1-4),type,act,cib,dur,por,res,zon,desc,fx}] ; illustration ill-sort-<id>.
   Personnage : c.arts = {<id de l'art>:{cur,d,sorts:[id]}} ; rang acheté comme une compétence (clé « art:<id> »), sort = achat « aosort:<art>:<sort> ».
   Onglet Progrès : section invisible tant qu'aucun art n'est débloqué ; le MJ (gestion) débloque quand les prérequis sont atteints. */
const AO_NIV=['Apprenti','Adepte','Maître','Grand maître'];
const AO_PACT=new Set(['aoTab','aoPComp','aoPAdd','aoPDel','aoPReset','aoPSave']);
const AO_RG=['1-2','3-4','5-6','7'];
FI_G.art={pl:'Arts obscurs',un:'art obscur',nv:'Nouvel art obscur',cnt:n=>n+' art'+(n>1?'s':'')+' obscur'+(n>1?'s':''),tl:"Types d'art"};
FI_IC.art='<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7a5 5 0 1 0 5 5"/><circle cx="12" cy="12" r="1.5"/><path d="M17 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>';
FI6_EYE.art=['pre','niv','sorts','prat'];
const aoComp=f=>!!f&&f.genre==='art'&&f.comp!==false;
const aoArts=()=>fiSort(fiAll().filter(f=>f.genre==='art'));
const aoNivOf=r=>r<=0?0:r<=2?1:r<=4?2:r<=6?3:4;
const aoNivName=(f,i)=>i<1?'':((f&&f.niv&&f.niv[i-1])||'').trim()||AO_NIV[i-1];
const aoNivLab=(f,i)=>{const p=aoNivName(f,i);return p===AO_NIV[i-1]?p:p+' · '+AO_NIV[i-1];};
/* UX3 : chiffres des arts obscurs datés dans Paramètres › Coûts et gains d'XP (champs max, cSort, nReq des fiches plus lus) */
const aoPrm=(k,d)=>{const v=typeof PRM!=='undefined'?PRM[k]:null;return v!=null&&v!==''&&!isNaN(+v)?+v:d;};
const aoMax=f=>aoPrm('aoMax',7),aoCSort=f=>aoPrm('aoSort',5),aoReq=f=>aoPrm('aoReq',2);
const aoSorts=f=>(f&&f.sorts)||[];
const aoSortOf=(f,id)=>aoSorts(f).find(x=>x.id===id)||null;
const aoOwn=(c,id)=>(c&&c.arts&&c.arts[id])||null;
const aoKnown=(c,id)=>((aoOwn(c,id)||{}).sorts)||[];
/* Montée de niveau (rangs 3, 5, 7) : il faut nReq sorts du niveau inférieur ; renvoie le motif du refus ou '' */
function aoGate(c,key,to){const id=key.slice(4),f=S.fiches&&S.fiches[id];if(!f)return 'art inconnu';const n1=aoNivOf(to),n0=aoNivOf(to-1);if(n0<1||n1<=n0)return '';
  const k=aoKnown(c,id).map(s=>aoSortOf(f,s)).filter(x=>x&&+x.niv===n0).length,q=aoReq(f);return k>=q?'':`${q} sorts ${aoNivName(f,n0)} requis (${k}/${q})`;}
/* Prérequis : compétence (rang, spécialité), caractéristique, race, autre art */
const AO_PT=[['comp','Compétence'],['carac','Caractéristique'],['race','Race'],['art','Art obscur']];
function aoPreLab(p){if(p.t==='race')return 'Race '+(p.n||'?');if(p.t==='art'){const a=S.fiches[p.n];return (a?a.nom:'Art')+' '+(+p.r||0);}return (p.n||'?')+' '+(+p.r||0)+(p.sp?' (spécialité '+p.sp+')':'');}
function aoPreOne(c,p){if(p.t==='race')return nrm(c.race||'')===nrm(p.n||'');
  if(p.t==='art')return ((aoOwn(c,p.n)||{}).cur||0)>=(+p.r||0);
  if(p.t==='carac')return lv(c,'carac:'+p.n)>=(+p.r||0);
  const v=Math.max(lv(c,'comp:'+p.n),lv(c,'fut:'+p.n));if(v<(+p.r||0))return false;
  return !p.sp||specsOf(c).some(s=>nrm(s.nom).includes(nrm(p.sp)));} /* spécialité : nom contenant le mot (ex. « Connaissance du druidisme ») */
const aoPreOk=(c,f)=>(f.pre||[]).every(p=>aoPreOne(c,p));
const aoUnlockable=c=>c&&c.type==='PJ'?aoArts().filter(f=>aoComp(f)&&!aoOwn(c,f.id)&&(f.pre||[]).length&&aoPreOk(c,f)):[];
/* ---------- Onglet Progrès : section « Arts obscurs » (entre Capacités féeriques et Ressources générales) ---------- */
function aoProgBlock(c,s,ir){if(!c||c.type!=='PJ')return '';const U=Object.keys(c.arts||{}).map(id=>S.fiches[id]).filter(f=>f&&f.genre==='art'),G=isGest()&&!S.visit,L=G?aoUnlockable(c):[];
  if(!U.length&&!L.length)return '';const ed=canEditC(c),OB=!!S.onlyBuy;let h='';
  for(const f of U){const o=aoOwn(c,f.id),cur=o.cur||0,nv=aoNivOf(cur),K=aoKnown(c,f.id).map(id=>aoSortOf(f,id)).filter(Boolean),row=ir('art:'+f.id);
    const avail=aoSorts(f).filter(x=>+x.niv>=1&&+x.niv<=Math.max(1,nv)&&!aoKnown(c,f.id).includes(x.id)),k=aoCSort(f),canL=ed&&nv>=1&&avail.length&&k<=s.dispo;
    if(OB&&!row&&!canL)continue;
    const nxt=cur<aoMax(f)?cur+1:0,gt=nxt?aoGate(c,'art:'+f.id,nxt):'';
    let b=row;
    if(nxt)b+=`<div class="muted small" style="padding-top:6px">Rang ${nxt}${aoNivOf(nxt)!==nv?` (<b>${esc(aoNivLab(f,aoNivOf(nxt)))}</b>)`:''} : <b class="num">${lvlCost('art',nxt)} XP</b>${gt?` · <span class="bad">${esc(gt)}</span>`:aoNivOf(nxt)!==nv&&nv>=1?` · sorts ${esc(aoNivName(f,nv))} ✓`:''}</div>`;
    b+=`<div class="spx" style="margin-top:6px">${K.map(x=>`<div class="ln acqd"><span><button type="button" class="lk" data-act="aoSortOpen" data-f="${esc(f.id)}" data-s="${esc(x.id)}">${esc(x.nom)}</button><small>${esc(aoNivName(f,+x.niv))}</small></span><span class="muted small">connu</span></div>`).join('')}
      ${nv>=1?`<div class="ln${canL?' dispo':''}"><span>Apprendre un sort<small>${avail.length?avail.length+' sort'+(avail.length>1?'s':'')+' accessible'+(avail.length>1?'s':''):'aucun sort accessible pour l\'instant'}</small></span>${ed?`<button class="bb" data-act="aoLearn" data-id="${esc(c.id)}" data-f="${esc(f.id)}"${canL?'':' disabled'} aria-label="Apprendre un sort pour ${k} XP">+ ${k}</button>`:''}</div>`:`<div class="ln"><span class="muted small">Les sorts s'apprennent à partir du rang 1.</span></div>`}</div>`;
    if(G&&canEdit()&&!cur&&!K.length)b+=`<div class="actions" style="justify-content:flex-start;margin-top:6px"><button class="lnk-bad" data-act="aoLock" data-id="${esc(c.id)}" data-f="${esc(f.id)}">Retirer l'art</button></div>`;
    h+=`<div class="card" style="margin-bottom:10px"><div class="prof-head"><b>${lk({t:'fiche',id:f.id},f.nom)}</b><span style="display:flex;gap:6px;align-items:center"><span class="pill acc">${nv?esc(aoNivLab(f,nv)):'débloqué'}</span><span class="pill">Sorts ${K.length}</span></span></div>${b}</div>`;}
  for(const f of L)h+=`<div class="card aounl" style="margin-bottom:10px"><div class="row2"><span><span class="pill plan">MJ</span> <b>${esc(f.nom)}</b> : prérequis atteints</span><button class="btn pri" data-act="aoUnlock" data-id="${esc(c.id)}" data-f="${esc(f.id)}">Débloquer</button></div><div class="muted small" style="margin-top:4px">Visible de la gestion seulement. La compétence apparaît au rang 0 ; le joueur achète ensuite les rangs.</div></div>`;
  return h?`<h2>Arts obscurs</h2>`+h:'';}
/* ---------- Fiche d'art : sous-titre et blocs ---------- */
function aoSub(f){const o=f.org&&S.fiches[f.org];return [aoComp(f)?'compétence cachée':'sans compétence',o?(fiSee(o)?lk({t:'fiche',id:o.id},o.nom):''):''].filter(Boolean);}
function aoBlocks(f,ed,G){if(!aoComp(f))return '';const e=fiEyeOf(f),E=canEdit();let h='';
  if(fiBlkSee(f,'pre')){const P=f.pre||[];h+=fiBlk('aopre','Prérequis',String(P.length||''),(P.length?P.map(p=>`<div class="fiml">${esc(aoPreLab(p))}</div>`).join(''):'<div class="muted small">Aucun prérequis saisi.</div>')+`<div class="muted small" style="margin-top:6px">Un PJ qui remplit les prérequis peut être débloqué par le MJ (onglet Progrès).${E?' Réglage : bloc « Réglages de l\'art », en mode édition.':''}</div>`,{hid:G&&!e.pre,eye:G?eyeBtn('fiEye','data-k="pre"',!!e.pre,'Prérequis'):''});}
  if(fiBlkSee(f,'niv'))h+=fiBlk('aoniv','Niveaux','',[1,2,3,4].map(i=>`<div class="srow"><span><span class="pill">${AO_RG[i-1]}</span> <b>${esc(aoNivName(f,i))}</b>${aoNivName(f,i)!==AO_NIV[i-1]?` <span class="muted small">${AO_NIV[i-1]}</span>`:''}</span></div>`).join('')+`<div class="muted small" style="margin-top:6px">Passer au niveau suivant : ${aoReq(f)} sorts du niveau en dessous. Rang maximum : ${aoMax(f)}.</div>`,{edit:ed?'aoNiv':'',hid:G&&!e.niv,eye:G?eyeBtn('fiEye','data-k="niv"',!!e.niv,'Niveaux'):''});
  if(fiBlkSee(f,'sorts')){const S0=aoSorts(f);let b='';
    for(let i=1;i<=4;i++){const L=S0.filter(x=>+x.niv===i).sort((a,b)=>a.nom.localeCompare(b.nom,'fr'));b+=`<div class="fimg">${esc(aoNivLab(f,i))} · rangs ${AO_RG[i-1]}</div>`+(L.map(x=>`<div class="lrw">${illOf('sort',x.id)?illThumb('sort',x.id,32):`<span class="illslot" style="width:32px;height:32px"></span>`}<button class="lrow" data-act="aoSortOpen" data-f="${esc(f.id)}" data-s="${esc(x.id)}"><span class="lm"><span class="lt">${esc(x.nom)}</span><span class="ls">${esc([x.type==='actif'?'Actif':x.type==='passif'?'Passif':'',x.act].filter(Boolean).join(' · '))}</span></span><span class="muted small">${aoCSort(f)} XP</span></button></div>`).join('')||'<div class="muted small">Aucun sort.</div>');}
    if(E)b+=`<div class="radd"><button class="btn" data-act="aoSortEd" data-f="${esc(f.id)}" data-s="">+ Sort</button></div>`;
    h+=fiBlk('aosorts','Sorts',String(S0.length||''),b,{hid:G&&!e.sorts,eye:G?eyeBtn('fiEye','data-k="sorts"',!!e.sorts,'Sorts'):''});}
  if(fiBlkSee(f,'prat')){const P=Object.values(S.chars||{}).filter(c=>vis(c)&&aoOwn(c,f.id)).sort((a,b)=>fiCN(a).localeCompare(fiCN(b),'fr'));
    h+=fiBlk('aoprat','Pratiquants',String(P.length||''),P.length?P.map(c=>{const o=aoOwn(c,f.id),nv=aoNivOf(o.cur||0);return `<div class="fiml">${lk({t:'perso',id:c.id},fiCN(c))}<span class="muted small"> · rang ${o.cur||0}${nv?' · '+esc(aoNivName(f,nv)):''} · ${aoKnown(c,f.id).length} sort${aoKnown(c,f.id).length>1?'s':''}</span></div>`;}).join(''):'<div class="muted small">Aucun personnage n\'a débloqué cet art.</div>',{hid:G&&!e.prat,eye:G?eyeBtn('fiEye','data-k="prat"',!!e.prat,'Pratiquants'):''});}
  return h;}
/* ---------- Fenêtres : sort (consultation, édition), noms des niveaux, apprendre un sort ---------- */
['aoSortV','aoSortEd','aoNiv','aoLearn'].forEach(k=>FI_DLG.add(k));
const AO_RL=[['act','Mise en œuvre'],['cib','Cible'],['dur','Durée'],['por','Portée'],['zon',"Zone d'effet"],['res','Résistance']];
function aoSheet(g){const f=S.fiches[g.f];if(!f)return null;
  if(g.kind==='aoSortV'){const x=aoSortOf(f,g.s);if(!x)return null;const R=AO_RL.filter(([k])=>(x[k]||'').trim()),who=Object.values(S.chars||{}).filter(c=>vis(c)&&aoKnown(c,f.id).includes(x.id));
    return fiShell(g,x.nom,`<div class="shd"><h2 class="rhd" style="margin:0"><span>${esc(x.nom)}</span></h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>
      ${illOf('sort',x.id)?`<div class="fibigw">${bigImg(illId('sort',x.id),illOf('sort',x.id),x.nom)}</div>`:''}
      <div class="tg3"><span>${esc(f.nom)}</span><span>${esc(aoNivLab(f,+x.niv||1))}</span>${x.type?`<span>${x.type==='actif'?'Actif':'Passif'}</span>`:''}<span>${aoCSort(f)} XP</span></div>
      ${x.desc?`<div class="small" style="white-space:pre-line">${esc(x.desc)}</div>`:''}
      ${R.length?`<div class="rg2">${R.map(([k,l])=>`<div><small>${l}</small>${esc(x[k])}</div>`).join('')}</div>`:''}
      ${(x.fx||[]).length?`<div class="lab2">Effets</div><div class="fxl">${x.fx.map(e=>fxChip(e)).join('')}</div>`:''}
      <div class="lab2">Connu par</div><div class="small">${who.length?who.map(c=>lk({t:'perso',id:c.id},fiCN(c))).join(', '):'<span class="muted">personne pour l\'instant</span>'}</div>
      <div class="actions" style="margin-top:12px">${canEdit()?`<button class="btn" data-act="aoSortEd" data-f="${esc(f.id)}" data-s="${esc(x.id)}">${ICON.crayon} Modifier</button>`:''}<button class="btn pri" data-act="closeSheet">Fermer</button></div>`);}
  if(g.kind==='aoSortEd'){const req='<span style="color:var(--bad)">*</span>',arm=S.confirm==='aosd:'+g.s,used=g.s&&Object.values(S.chars||{}).some(c=>aoKnown(c,f.id).includes(g.s));
    return fiShell(g,'Sort',`<div class="shd"><h2>${g.s?'Modifier le sort':'Nouveau sort'}</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div><div class="muted small">${esc(f.nom)}</div>
      <div class="field"><label for="aoN">Nom ${req}</label><input id="aoN" type="text" data-aoe="nom" value="${esc(g.nom)}"></div>
      <div class="field"><label>Niveau ${req}</label><div class="seg" role="group">${[1,2,3,4].map(i=>`<button data-act="aoSeg" data-k="niv" data-v="${i}" aria-pressed="${+g.niv===i}">${esc(aoNivName(f,i))}</button>`).join('')}</div></div>
      <div class="field"><label>Type</label><div class="seg" role="group">${[['actif','Actif'],['passif','Passif']].map(([v,l])=>`<button data-act="aoSeg" data-k="type" data-v="${v}" aria-pressed="${g.type===v}">${l}</button>`).join('')}</div></div>
      <div class="field"><label>Illustration <span class="muted small">(facultatif)</span></label>${illEdit('sort',g.s,g.nom)}</div>
      <div class="field"><label for="aoD">Description</label><textarea id="aoD" data-aoe="desc" rows="3">${esc(g.desc)}</textarea></div>
      <div class="lab2">Règles <span class="muted small" style="text-transform:none;letter-spacing:0">(facultatives)</span></div><div class="elrg">${AO_RL.map(([k,l])=>`<label><span>${l}</span><input type="text" data-aoe="${k}" value="${esc(g[k]||'')}" aria-label="${l}"></label>`).join('')}</div>
      <div class="lab2">Effets</div>${fxBox('dlg',g)}
      ${g.err?`<div class="pinerr" role="alert">${esc(g.err)}</div>`:''}
      <div class="actions" style="margin-top:10px"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="aoSortSave">Enregistrer</button></div>
      ${g.s?`<div class="danger2"><span>Zone sensible</span>${used?'<span class="muted small">Suppression impossible : sort connu d\'un personnage</span>':arm?'<button class="lnk-bad" data-act="aoSortDelOk">Confirmer la suppression</button>':'<button class="lnk-bad" data-act="aoSortDel">Supprimer le sort</button>'}</div>`:''}`);}
  if(g.kind==='aoNiv')return fiShell(g,'Noms des niveaux',`<div class="shd"><h2>Noms des niveaux</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div><div class="muted small">${esc(f.nom)} · laisser vide pour le nom commun</div>
      ${[1,2,3,4].map(i=>`<div class="field"><label for="aoNv${i}">${AO_NIV[i-1]} <span class="muted small">(rangs ${AO_RG[i-1]})</span></label><input id="aoNv${i}" type="text" data-aoe="n${i}" value="${esc(g['n'+i]||'')}" placeholder="${AO_NIV[i-1]}"></div>`).join('')}
      <div class="actions" style="margin-top:10px"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="aoNivSave">Enregistrer</button></div>`);
  if(g.kind==='aoLearn'){const c=S.chars[g.c];if(!c)return null;const nv=aoNivOf((aoOwn(c,f.id)||{}).cur||0),L=aoSorts(f).filter(x=>+x.niv>=1&&+x.niv<=Math.max(1,nv)&&!aoKnown(c,f.id).includes(x.id)).sort((a,b)=>a.niv-b.niv||a.nom.localeCompare(b.nom,'fr')),k=aoCSort(f),dispo=summary(c,S.events).dispo;
    return fiShell(g,'Apprendre un sort',`<div class="shd"><h2>Apprendre un sort</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div><div class="muted small">${esc(fiCN(c))} · ${esc(f.nom)} · ${k} XP le sort · ${dispo} XP disponibles</div>
      ${L.map(x=>`<label class="kkrad"><input type="radio" name="aoL" data-act="aoPick" data-s="${esc(x.id)}"${g.pick===x.id?' checked':''}> <b>${esc(x.nom)}</b> <span class="muted small">· ${esc(aoNivName(f,+x.niv))}${x.act?' · '+esc(x.act):''}</span></label>`).join('')||'<div class="muted small">Aucun sort accessible.</div>'}
      <div class="actions" style="margin-top:10px"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="aoLearnOk"${g.pick&&k<=dispo?'':' disabled'}>Apprendre · ${k} XP</button></div>`);}
  return null;}
function aoAct(a,d){const g=S.dlg;
  if(a==='aoSortOpen'){const f=S.fiches[d.f];if(!f||!aoSortOf(f,d.s))return true;fiOpenDlg({kind:'aoSortV',f:d.f,s:d.s});render();return true;}
  if(a==='aoSortEd'){if(!canEdit())return true;const f=S.fiches[d.f];if(!f)return true;const x=d.s?aoSortOf(f,d.s):null;S.confirm=null;
    fiOpenDlg({kind:'aoSortEd',f:d.f,s:x?x.id:'',nom:x?x.nom:'',niv:x?+x.niv:1,type:x?x.type||'':'',desc:x?x.desc||'':'',fx:clone((x&&x.fx)||[]),fxEd:null,...Object.fromEntries(AO_RL.map(([k])=>[k,x?x[k]||'':'']))});render();return true;}
  if(a==='aoSeg'&&g&&g.kind==='aoSortEd'){g[d.k]=d.k==='niv'?+d.v:(g[d.k]===d.v?'':d.v);S._fiRedraw=true;render();return true;}
  if(a==='aoSortSave'&&g&&g.kind==='aoSortEd'){const f=S.fiches[g.f],nom=(g.nom||'').trim();if(!f||!canEdit())return true;
    if(!nom){g.err='Le nom est obligatoire.';S._fiRedraw=true;render();return true;}
    if(aoSorts(f).some(x=>x.id!==g.s&&nrm(x.nom)===nrm(nom))){g.err='Un autre sort de cet art porte déjà ce nom.';S._fiRedraw=true;render();return true;}
    const n=clone(f),id=g.s||fiRid('so-'),x={id,nom,niv:+g.niv||1,type:g.type||'',desc:(g.desc||'').trim(),fx:clone(g.fx||[]),...Object.fromEntries(AO_RL.map(([k])=>[k,(g[k]||'').trim()]))};
    n.sorts=g.s?aoSorts(n).map(y=>y.id===id?{...y,...x}:y):[...aoSorts(n),x];fiSave(n,true);S.dlg=null;fiOpenDlg({kind:'aoSortV',f:g.f,s:id});render();toast('Enregistré');return true;}
  if(a==='aoSortDel'&&g){S.confirm='aosd:'+g.s;S._fiRedraw=true;render();return true;}
  if(a==='aoSortDelOk'&&g&&g.kind==='aoSortEd'){const f=S.fiches[g.f];if(!f||!canEdit())return true;if(Object.values(S.chars||{}).some(c=>aoKnown(c,f.id).includes(g.s)))return true;
    const n=clone(f);n.sorts=aoSorts(n).filter(x=>x.id!==g.s);fiSave(n,true);S.dlg=null;S.confirm=null;render();return true;}
  if(a==='aoNiv'){const f=S.fi&&S.fiches[S.fi];if(!f||!fiCanEd(f))return true;fiOpenDlg({kind:'aoNiv',f:f.id,n1:(f.niv||[])[0]||'',n2:(f.niv||[])[1]||'',n3:(f.niv||[])[2]||'',n4:(f.niv||[])[3]||''});render();return true;}
  if(a==='aoNivSave'&&g&&g.kind==='aoNiv'){const f=S.fiches[g.f];if(!f||!fiCanEd(f))return true;const n=clone(f);n.niv=[1,2,3,4].map(i=>(g['n'+i]||'').trim());fiSave(n,true);S.dlg=null;render();toast('Enregistré');return true;}
  if(a==='aoUnlock'){const c0=S.chars[d.id],f=S.fiches[d.f];if(!c0||!f||!isGest()||S.visit||aoOwn(c0,f.id))return true;const c=clone(c0);c.arts={...(c.arts||{}),[f.id]:{cur:0,d:today(),sorts:[]}};saveChar(c);toast(f.nom+' débloqué');return true;}
  if(a==='aoLock'){const c0=S.chars[d.id],o=aoOwn(c0,d.f);if(!o||!canEdit()||(o.cur||0)||(o.sorts||[]).length)return true;const c=clone(c0);delete c.arts[d.f];saveChar(c);return true;}
  if(a==='aoLearn'){const c=S.chars[d.id];if(!c||!canEditC(c))return true;fiOpenDlg({kind:'aoLearn',c:d.id,f:d.f,pick:''});render();return true;}
  if(a==='aoPick'&&g&&g.kind==='aoLearn'){g.pick=d.s;S._fiRedraw=true;render();return true;}
  if(a==='aoLearnOk'&&g&&g.kind==='aoLearn'){const c0=S.chars[g.c],f=S.fiches[g.f],x=f&&aoSortOf(f,g.pick);if(!c0||!x||!canEditC(c0))return true;const o0=aoOwn(c0,f.id);if(!o0||o0.sorts.includes(x.id))return true;
    const k=aoCSort(f);if(k>summary(c0,S.events).dispo)return true;
    const c=clone(c0),o=c.arts[f.id];o.sorts=[...(o.sorts||[]),x.id];c.achats=c.achats||[];c.achats.push({id:'a'+Date.now().toString(36)+Math.floor(Math.random()*1e3),date:today(),label:`${f.nom} · sort « ${x.nom} »`,cout:k,key:'aosort:'+f.id+':'+x.id});
    S.dlg=null;saveChar(c);toast('Sort appris');return true;}
  return false;}
document.addEventListener('input',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.aoe===undefined)return;const g=S.dlg;if(g&&/^ao/.test(g.kind))g[t.dataset.aoe]=t.value;});
/* ---------- Paramètres › Référentiel › Arts obscurs ---------- */
/* UX3 : réglages d'un art sur sa fiche (mode édition) ; les chiffres sont dans Paramètres › Coûts et gains d'XP */
function aoParams(one){const G=canEdit(),L=aoArts();if(!one)return '';
  const cur=one;S.aoTab=cur.id;
  if(!S.aoPd||S.aoPd.id!==cur.id)S.aoPd={id:cur.id,comp:cur.comp!==false,org:cur.org||'',pre:clone(cur.pre||[]),max:aoMax(cur),cSort:aoCSort(cur),nReq:aoReq(cur),niv:[0,1,2,3].map(i=>(cur.niv||[])[i]||'')};
  const P=S.aoPd,dis=G?'':' disabled',orgs=fiSort(fiAll().filter(x=>x.genre==='org'));
  const inp=(k,v,lab,ty)=>`<label class="aopf"><span>${lab}</span><input type="${ty||'number'}" data-aop="${k}" value="${esc(String(v))}"${dis}></label>`;
  let h='';
  h+=cBlk('ao-g','Réglages de l\'art','compétence cachée · organisation liée',`<div class="optrow2"><span><b>Compétence cachée</b><br><span class="muted small">non : art descriptif seulement (Spiritisme)</span></span><button class="tgb" data-act="aoPComp" role="switch" aria-checked="${P.comp}"${dis} aria-label="Compétence cachée"><span class="tg${P.comp?' on':''}"></span></button></div>
    <label class="aopf"><span>Organisation liée</span><select data-aop="org"${dis}><option value="">— aucune —</option>${orgs.map(o=>`<option value="${esc(o.id)}"${o.id===P.org?' selected':''}>${esc(o.nom)}</option>`).join('')}</select></label>`);
  if(P.comp){
    h+=cBlk('ao-p','Prérequis',String(P.pre.length),P.pre.map((p,i)=>`<div class="aopr"><select data-aop="pt" data-i="${i}" aria-label="Sorte de prérequis"${dis}>${AO_PT.map(([v,l])=>`<option value="${v}"${p.t===v?' selected':''}>${l}</option>`).join('')}</select>
      ${p.t==='art'?`<select data-aop="pn" data-i="${i}" aria-label="Art"${dis}><option value="">—</option>${L.filter(x=>x.id!==cur.id&&aoComp(x)).map(x=>`<option value="${esc(x.id)}"${x.id===p.n?' selected':''}>${esc(x.nom)}</option>`).join('')}</select>`
        :p.t==='carac'?`<select data-aop="pn" data-i="${i}" aria-label="Caractéristique"${dis}><option value="">—</option>${CARACS.map(x=>`<option${x===p.n?' selected':''}>${esc(x)}</option>`).join('')}</select>`
        :p.t==='race'?`<input type="text" data-aop="pn" data-i="${i}" value="${esc(p.n||'')}" placeholder="Race" aria-label="Race"${dis}>`
        :`<select data-aop="pn" data-i="${i}" aria-label="Compétence"${dis}><option value="">—</option>${COMPS_ALL.map(x=>`<option${x===p.n?' selected':''}>${esc(x)}</option>`).join('')}</select>`}
      ${p.t!=='race'?`<input type="number" min="0" max="12" data-aop="pr" data-i="${i}" value="${esc(String(p.r||''))}" placeholder="rang" aria-label="Rang minimum" style="width:64px"${dis}>`:''}
      ${p.t==='comp'?`<input type="text" data-aop="psp" data-i="${i}" value="${esc(p.sp||'')}" placeholder="spécialité (facultatif)" aria-label="Spécialité exigée"${dis}>`:''}
      ${G?`<button class="ibtn" data-act="aoPDel" data-i="${i}" aria-label="Retirer le prérequis">✕</button>`:''}</div>`).join('')+(G?`<div class="radd"><button class="btn" data-act="aoPAdd">+ Prérequis</button></div>`:'')+'<div class="muted small" style="margin-top:6px">Compétence (rang minimum, spécialité facultative), caractéristique, race, autre art obscur.</div>');
    h+=cBlk('ao-n','Noms des niveaux','noms propres',[0,1,2,3].map(i=>`<label class="aopf"><span>${AO_NIV[i]} · rangs ${AO_RG[i]}</span><input type="text" data-aop="niv" data-i="${i}" value="${esc(P.niv[i])}" placeholder="${AO_NIV[i]}"${dis}></label>`).join(''));}
  if(G)h+=`<div class="actions"><button class="btn ghost" data-act="aoPReset">Annuler</button><button class="btn pri" data-act="aoPSave">Enregistrer</button></div>`;
  return `<div class="aoreg">${h}</div>`;}
function aoParamAct(a,d){
  if(a==='aoTab'){S.aoTab=d.v;S.aoPd=null;return true;}
  if(!canEdit()||!S.aoPd)return true;const P=S.aoPd;
  if(a==='aoPComp')P.comp=!P.comp;
  else if(a==='aoPAdd')P.pre.push({t:'comp',n:'',r:1,sp:''});
  else if(a==='aoPDel')P.pre.splice(+d.i,1);
  else if(a==='aoPReset')S.aoPd=null;
  else if(a==='aoPSave'){const f=S.fiches[P.id];if(!f)return true;const n=clone(f);n.comp=!!P.comp;n.org=P.org||'';n.pre=P.pre.filter(p=>(p.n||'').trim()).map(p=>({t:p.t,n:(p.n||'').trim(),r:+p.r||0,sp:p.t==='comp'?(p.sp||'').trim():''}));
    n.niv=P.niv.map(x=>(x||'').trim());fiSave(n,true);S.aoPd=null;setTimeout(()=>toast('Enregistré'),0);}
  return true;}
document.addEventListener('input',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.aop===undefined||!S.aoPd)return;const P=S.aoPd,k=t.dataset.aop,i=+t.dataset.i;
  if(k==='pt'){P.pre[i].t=t.value;P.pre[i].n='';P.pre[i].sp='';S._force=true;render();return;}
  if(k==='pn')P.pre[i].n=t.value;else if(k==='pr')P.pre[i].r=t.value;else if(k==='psp')P.pre[i].sp=t.value;else if(k==='niv')P.niv[i]=t.value;else P[k]=t.value;});
document.addEventListener('change',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.aop==='pt'&&S.aoPd){S._force=true;render();}});

/* ---------- Règles en images (26/11/2026, import Kanka fin) ----------
   Collection « fiches », genre « regle » : {id, genre:'regle', nom, ord, imgs:[uid], kanka, vis:'rev'}.
   Image uid : vignette portraits/ill-rg-<id>-<uid>, grande image table images (même clé).
   Affichage : imgs dans l'ordre, puis les images de la note absentes de imgs (ajoutées à la main).
   Lecture pour tous ; gestion en mode édition : notes (créer, renommer, supprimer) et images (ajouter, ordre, retirer). */
const rgPre=f=>'ill-rg-'+f.id+'-';
const rgNotes=()=>fiAll().filter(f=>f.genre==='regle').sort((a,b)=>((+a.ord||0)-(+b.ord||0))||(a.nom||'').localeCompare(b.nom||'','fr',{sensitivity:'base'}));
function rgImgs(f){const P=S.ptr||{},pre=rgPre(f),L=(f.imgs||[]).map(u=>pre+u).filter(k=>P[k]),seen=new Set(L);
  return L.concat(Object.keys(P).filter(k=>k.startsWith(pre)&&!seen.has(k)).sort());}
const rgNb=n=>n+' image'+(n>1?'s':'');
function rgPane(){const E=canEdit(),f=S.rgNote&&S.fiches[S.rgNote];
  if(f&&f.genre==='regle')return rgNoteView(f);S.rgNote=null;
  const L=rgNotes();let h='';
  if(!S.fichesReady)return `<div class="card empty">Chargement…</div>`;
  h+=L.length?`<div class="plst rglst">${L.map(n=>{const K=rgImgs(n),im=K.length&&S.ptr[K[0]];
    return `<button type="button" class="pli rgli" data-act="rgOpen" data-id="${esc(n.id)}"><span class="rgth">${im?`<img src="${im}" alt="">`:''}</span><span class="ptx"><b>${esc(n.nom)}</b><small>${rgNb(K.length)}</small></span><span aria-hidden="true" class="pch">›</span></button>`;}).join('')}</div>`
    :`<div class="muted small">Aucune page du livre pour l'instant.</div>`;
  if(E)h+=`<div class="radd"><button class="btn" data-act="rgNoteEd" data-id="">+ Page du livre</button></div>`;
  return h;}
function rgNoteView(f){const E=canEdit(),K=rgImgs(f);
  let h=`<h2 style="margin-top:2px">${esc(f.nom)}</h2><div class="muted small">${rgNb(K.length)}${K.length?' · toucher pour agrandir':''}</div>`;
  if(E)h+=`<div style="margin:8px 0"><button type="button" class="edl" data-act="rgNoteEd" data-id="${esc(f.id)}">${ICON.crayon} Renommer, supprimer</button></div>`;
  h+=K.length?`<div class="rggrid">${K.map((k,i)=>`<div class="rgcell"><button type="button" class="rgimg" data-act="rgView" data-id="${esc(f.id)}" data-i="${i}" aria-label="Agrandir l'image ${i+1} sur ${K.length}"><img src="${S.ptr[k]}" alt=""></button>${E?`<div class="rgtools"><button type="button" class="ibtn" data-act="rgMv" data-k="${esc(k)}" data-v="-1" aria-label="Avancer l'image ${i+1}"${i?'':' disabled'}>‹</button><button type="button" class="ibtn" data-act="rgMv" data-k="${esc(k)}" data-v="1" aria-label="Reculer l'image ${i+1}"${i<K.length-1?'':' disabled'}>›</button>${S.confirm==='rgd:'+k?`<button type="button" class="ibtn rgko" data-act="rgDelOk" data-k="${esc(k)}" aria-label="Confirmer le retrait de l'image ${i+1}">Retirer ?</button>`:`<button type="button" class="ibtn" data-act="rgDel" data-k="${esc(k)}" aria-label="Retirer l'image ${i+1}">✕</button>`}</div>`:''}</div>`).join('')}</div>`
    :'<div class="card empty">Aucune image pour l\'instant.</div>';
  if(E)h+=`<div class="radd"><label class="btn" style="cursor:pointer">+ Ajouter une image<input type="file" accept="image/*" data-ptrfile="${esc(rgPre(f)+fiRid('u'))}" data-plab="${esc(f.nom)}" hidden></label></div><div class="muted small">Mode édition : la vignette se recadre, l'image entière reste visible en grand.</div>`;
  return h;}
function rgSave(f,K){const n=clone(f),pre=rgPre(f);n.imgs=K.map(k=>k.slice(pre.length));fiSave(n);}
function rgSheet(g){if(g.kind!=='rgNote'||!canEdit())return null;const f=g.id&&S.fiches[g.id];
  return fiShell(g,f?'Note : '+f.nom:'Nouvelle note',`<h2>${f?esc(f.nom):'Nouvelle note'}</h2>
    <div class="field"><label for="rgNm">Titre</label><input id="rgNm" type="text" data-fin="nom" value="${esc(g.nom||'')}" autocomplete="off"></div>
    <div class="field"><label for="rgOr">Ordre dans la liste</label><input id="rgOr" type="number" data-fin="ord" value="${esc(String(g.ord||''))}"></div>
    ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
    <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="rgNoteSave">${f?'Enregistrer':'Créer'}</button></div>
    ${f?`<div class="fidel">${g.confirm?`<div class="muted small">Supprimer « ${esc(f.nom)} » et ses ${rgNb(rgImgs(f).length)} ?</div><div class="actions"><button class="btn ghost" data-act="rgNoteNo">Garder</button><button class="btn" style="color:var(--bad)" data-act="rgNoteDelOk">Supprimer</button></div>`:`<button class="btn ghost" style="color:var(--bad)" data-act="rgNoteDel">Supprimer la note</button>`}</div>`:''}`);}
function rgAct(a,d){const g=S.dlg;if(typeof rgPageAct==='function'&&rgPageAct(a,d))return true; /* UX3 */
  if(a==='rgTab'){S.rgTab=d.v==='img'?'img':'';S.rgNote=null;S.confirm=null;window.scrollTo(0,0);render();return true;}
  if(a==='rgOpen'){const f=S.fiches[d.id];if(!f||f.genre!=='regle')return true;S.rgTab='img';S.rgNote=f.id;S.shFold={...(S.shFold||{}),'rg-l':false};S.confirm=null;window.scrollTo(0,0);render();return true;}
  if(a==='rgBack'){S.rgNote=null;S.confirm=null;S.shFold={...(S.shFold||{}),'rg-l':false};render();requestAnimationFrame(()=>{const el=document.getElementById('sec-rg-l');if(el)el.scrollIntoView({block:'start'});});return true;}
  if(a==='rgView'){const f=S.fiches[d.id];if(!f)return true;const K=rgImgs(f),L=K.map((k,i)=>({k,lab:f.nom+' · '+(i+1)+' / '+K.length})),i=+d.i||0;if(!L[i])return true;fiViewer(S.ptr[L[i].k],L[i].k,L[i].lab,{L,i});return true;}
  if(!canEdit())return true;
  if(a==='rgNoteEd'){const f=d.id&&S.fiches[d.id];fiOpenDlg({kind:'rgNote',id:f?f.id:'',nom:f?f.nom:'',ord:f?(f.ord||''):(rgNotes().length+1)});render();return true;}
  if(a==='rgNoteSave'&&g&&g.kind==='rgNote'){const nom=(g.nom||'').trim();if(!nom){g.err='Le titre est obligatoire.';S._fiRedraw=true;render();return true;}
    const now=new Date().toISOString(),f=g.id&&S.fiches[g.id],n=f?clone(f):{id:fiRid('f-'),genre:'regle',nom:'',ord:0,imgs:[],kanka:'',vis:'rev',par:ME||'',cree:now};
    n.nom=nom;n.ord=+g.ord||0;S.dlg=null;if(!f){S.rgTab='img';S.rgNote=n.id;}fiSave(n);setTimeout(()=>toast('Enregistré'),0);return true;}
  if(a==='rgNoteDel'&&g){g.confirm=true;S._fiRedraw=true;render();return true;}
  if(a==='rgNoteNo'&&g){g.confirm=false;S._fiRedraw=true;render();return true;}
  if(a==='rgNoteDelOk'&&g&&g.kind==='rgNote'){const f=S.fiches[g.id];if(!f)return true;let p=false;
    for(const k of rgImgs(f)){fiBigDel(k);if(S.ptr&&S.ptr[k]){const m={...S.ptr};delete m[k];S.ptr=m;persistDel('portraits/'+k);p=true;}}
    if(p){S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});}
    const m={...S.fiches};delete m[f.id];S.fiches=m;persistDel('fiches/'+f.id);S.dlg=null;S.rgNote=null;render();setTimeout(()=>toast('Note supprimée'),0);return true;}
  const f=S.rgNote&&S.fiches[S.rgNote];if(!f)return true;const K=rgImgs(f),i=K.indexOf(d.k);
  if(a==='rgMv'){const j=i+(+d.v||0);if(i<0||j<0||j>=K.length)return true;[K[i],K[j]]=[K[j],K[i]];rgSave(f,K);return true;}
  if(a==='rgDel'){S.confirm='rgd:'+d.k;render();return true;}
  if(a==='rgDelOk'){if(i<0)return true;S.confirm=null;fiBigDel(d.k);const m={...S.ptr};delete m[d.k];S.ptr=m;persistDel('portraits/'+d.k);S.ptrV=Date.now();persist('meta/portraits',{v:S.ptrV});K.splice(i,1);rgSave(f,K);return true;}
  return true;}
FI_DLG.add('rgNote');

/* ---------- Chronologies (26/11/2026, import Kanka fin) ----------
   Fiche genre « chrono » (règle des fiches) : desc, eres:[{id, nom, deb, fin, col, seances}], els:[{id, era, nom, date, an, txt, rev, cree, par}].
   Frise : ères triées par début, éléments triés par année de tri ; un œil par élément (élément ajouté par la gestion = préparé).
   Ères : gestion en mode édition. Séances de la Chronique : Scénarios et Interscénarios visibles, datés à partir du début de l'ère. */
FI_G.chrono={pl:'Histoire',un:'chronologie',nv:'Nouvelle chronologie',cnt:n=>n+' chronologie'+(n>1?'s':''),tl:'Types de chronologie'}; /* UX2 : « Histoire » */
FI_IC.chrono='<path d="M4 12h16"/><circle cx="7" cy="12" r="2"/><circle cx="13" cy="12" r="2"/><path d="M19 9v6"/><path d="M7 5v3M13 16v3"/>';
const CT_COL=[['violet','Violet'],['laiton','Laiton'],['brique','Brique'],['vert','Vert'],['bleu','Bleu'],['gris','Gris']];
const ctElSee=x=>!!x&&(isGest()||!!x.rev);
const ctEras=f=>((f&&f.eres)||[]).slice().sort((a,b)=>(+a.deb||0)-(+b.deb||0));
const ctEra=(f,id)=>((f&&f.eres)||[]).find(e=>e.id===id)||null;
const ctEls=(f,eid)=>((f&&f.els)||[]).filter(x=>x.era===eid).sort((a,b)=>((a.an===''||a.an==null?1e9:+a.an)-(b.an===''||b.an==null?1e9:+b.an))||((+a.pos||0)-(+b.pos||0))||(a.nom||'').localeCompare(b.nom||'','fr'));
const ctYr=v=>v===''||v==null||isNaN(+v)?'':String(+v);
const ctSpan=e=>{const a=ctYr(e.deb),b=ctYr(e.fin);return a&&b?a+' – '+b:a?'depuis '+a:b?"jusqu'à "+b:'';};
function ctSeances(e){const a=+e.deb,b=e.fin===''||e.fin==null?null:+e.fin;
  return chEvs().filter(f=>fiSee(f)&&f.type==='Scénario'&&chOk(f.debut)&&(isNaN(a)||f.debut.a>=a)&&(b==null||isNaN(b)||f.debut.a<b))
    .sort((x,y)=>chKey(x.debut)-chKey(y.debut)||String(chNumOf(x)).localeCompare(String(chNumOf(y)),'fr',{numeric:true}));}
function ctBlocks(f,ed,G){const E=canEdit(),R=ctEras(f),op=S.ctOpen||{};let h='';
  const ids=(f.els||[]).filter(ctElSee).filter(x=>(x.txt||'').trim()).map(x=>x.id);
  if(ids.length)h+=`<div class="chips ctall"><button type="button" class="chip" data-act="ctAll" data-v="1" aria-pressed="${ids.every(i=>op[i])}">Tout déplier</button><button type="button" class="chip" data-act="ctAll" data-v="0" aria-pressed="${!ids.some(i=>op[i])}">Tout replier</button></div>`;
  for(const e of R){const V=ctEls(f,e.id).filter(ctElSee),k='ct-'+e.id,fold=fiFolded(k),col=e.col||'gris',SE=e.seances?ctSeances(e):[];
    const sum=[ctSpan(e),V.length?V.length+' élément'+(V.length>1?'s':''):'',SE.length?SE.length+' séance'+(SE.length>1?'s':''):''].filter(Boolean).join(' · ');
    const rows=V.map(x=>{const has=!!(x.txt||'').trim(),o=has&&op[x.id];
      return `<div class="ctel${x.rev?'':' fihid'}"><span class="ctdot" aria-hidden="true"></span><div class="ctbd">${has?`<button type="button" class="ctt" data-act="ctTog" data-i="${esc(x.id)}" aria-expanded="${!!o}">`:'<div class="ctt">'}<span class="ctx">${(x.date||'').trim()?`<span class="ctd">${esc(x.date)}</span>`:''}<b>${esc(x.nom)}</b></span>${has?`<span class="chev" aria-hidden="true">${o?'⌄':'›'}</span></button>`:'</div>'}${o?fiRich(x.txt):''}</div>${ed?`<button type="button" class="fiedi" data-act="ctEl" data-i="${esc(x.id)}" aria-label="Modifier ${esc(x.nom)}">${ICON.crayon}</button>`:''}${G?eyeBtn('ctEye',`data-i="${esc(x.id)}"`,!!x.rev,'Élément '+x.nom):''}</div>`;}).join('');
    const ses=SE.length?`<details class="ctsd"><summary>Séances de la Chronique · ${SE.length}</summary>`+SE.map(s=>{const n=chNumOf(s),d=s.debut;return `<div class="ctses"><span class="chpil ${chCl(s)}">${esc(n||'')}</span><span class="ctsn">${lk({t:'fiche',id:s.id},s.nom)}</span><span class="muted small">${esc(chRangeShort(d,s.duree))}</span></div>`;}).join('')+'</details>':''; /* UX2 : repliées, Scénarios seulement */
    const body=(rows||(ses?'':'<div class="muted small">Aucun élément.</div>'))+ses+(ed?`<div class="radd"><button class="btn" data-act="ctEl" data-i="" data-e="${esc(e.id)}">+ Un élément</button></div>`:'');
    h+=`<section class="rblk ctera ctc-${esc(col)}"><div class="rbh"><button type="button" class="rbt" data-act="fiFold" data-k="${esc(k)}" aria-expanded="${!fold}" aria-controls="fb-${esc(k)}"><span class="tt"><span class="t">${esc(e.nom)}</span>${sum?`<span class="n">${esc(sum)}</span>`:''}</span><span class="chev" aria-hidden="true">${fold?'›':'⌄'}</span></button>${E?`<button type="button" class="edl" data-act="ctEra" data-i="${esc(e.id)}">${ICON.crayon} Ère</button>`:''}</div>${fold?'':`<div class="rbb" id="fb-${esc(k)}">${body}</div>`}</section>`;}
  if(!R.length)h+=`<div class="card empty">Aucune ère pour l'instant.</div>`;
  if(E)h+=`<div class="radd"><button class="btn" data-act="ctEra" data-i="">+ Une ère</button></div>`;
  return h;}
function ctSheet(g){const f=S.fiches[g.fid];if(!f)return null;
  if(g.kind==='ctEl'){if(!fiCanEd(f))return null;const it=g.iid?(f.els||[]).find(x=>x.id===g.iid):null;if(g.iid&&!it)return null;const R=ctEras(f);
    return fiShell(g,it?'Élément':'Nouvel élément',`<div><h2>${it?'Modifier l\'élément':'Nouvel élément'}</h2><div class="muted small">${esc(f.nom)}</div></div>
      <div class="field"><label for="ctNm">Titre</label><input id="ctNm" type="text" data-fin="nom" value="${esc(g.nom||'')}" autocomplete="off"></div>
      <div class="frow"><div class="field"><label for="ctDt">Date affichée</label><input id="ctDt" type="text" data-fin="date" value="${esc(g.date||'')}" placeholder="ex. 1795 - 1813" autocomplete="off"></div><div class="field"><label for="ctAn">Année de tri</label><input id="ctAn" type="number" data-fin="an" value="${esc(String(g.an==null?'':g.an))}"></div></div>
      <div class="field"><label for="ctEr">Ère</label><select id="ctEr" data-fin="era">${R.map(e=>`<option value="${esc(e.id)}"${e.id===g.era?' selected':''}>${esc(e.nom)}${ctSpan(e)?' ('+esc(ctSpan(e))+')':''}</option>`).join('')}</select></div>
      <div class="field"><label>Texte</label><div class="fiedw"><div id="fiEd" class="fied" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Texte de l'élément" spellcheck="true">${fiEdHtml(g.txt)}</div><div id="fiSug" class="fisug" role="listbox" hidden></div></div></div>
      <div class="muted small">Tape <b>@</b> pour lier une fiche. L'année de tri range l'élément dans son ère.${it?'':isGest()?' L\'élément sera préparé (œil fermé).':' L\'élément sera visible par toute la table.'}</div>
      ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
      <div class="actions">${it?(g.confirm?`<button class="btn" style="color:var(--bad)" data-act="ctElDelOk">Confirmer le retrait</button>`:`<button class="btn ghost" data-act="ctElDel">Retirer</button>`):''}<button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="ctElSave">Enregistrer</button></div>`);}
  if(g.kind==='ctEra'){if(!canEdit())return null;const e=g.eid?ctEra(f,g.eid):null;if(g.eid&&!e)return null;const n=e?ctEls(f,e.id).length:0;
    return fiShell(g,e?'Ère':'Nouvelle ère',`<div><h2>${e?esc(e.nom):'Nouvelle ère'}</h2><div class="muted small">${esc(f.nom)}</div></div>
      <div class="field"><label for="ctEn">Nom</label><input id="ctEn" type="text" data-fin="nom" value="${esc(g.nom||'')}" autocomplete="off"></div>
      <div class="frow"><div class="field"><label for="ctEd">Début (année)</label><input id="ctEd" type="number" data-fin="deb" value="${esc(String(g.deb==null?'':g.deb))}"></div><div class="field"><label for="ctEf">Fin (vide : en cours)</label><input id="ctEf" type="number" data-fin="fin" value="${esc(String(g.fin==null?'':g.fin))}"></div></div>
      <div class="field"><label>Couleur</label><div class="ctcols" role="group" aria-label="Couleur de l'ère">${CT_COL.map(([v,l])=>`<button type="button" class="ctcol ctc-${v}" data-act="ctCol" data-v="${v}" aria-pressed="${g.col===v}" aria-label="${l}"><span aria-hidden="true"></span></button>`).join('')}</div></div>
      <label class="kkrad"><input type="checkbox" data-fin="seances"${g.seances?' checked':''}> Afficher les séances de la Chronique (Scénarios et Interscénarios datés dans l'ère)</label>
      ${g.err?`<div class="small" role="alert" style="color:var(--bad)">${esc(g.err)}</div>`:''}
      <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="ctEraSave">Enregistrer</button></div>
      ${e?`<div class="fidel">${n?`<div class="muted small">Suppression possible quand l'ère est vide (${n} élément${n>1?'s':''}).</div>`:g.confirm?`<div class="actions"><button class="btn ghost" data-act="ctEraNo">Garder</button><button class="btn" style="color:var(--bad)" data-act="ctEraDelOk">Supprimer l'ère</button></div>`:`<button class="btn ghost" style="color:var(--bad)" data-act="ctEraDel">Supprimer l'ère</button>`}</div>`:''}`);}
  return null;}
function ctAct(a,d){const g=S.dlg,f=S.fi&&S.fiches[S.fi];
  if(a==='ctTog'){S.ctOpen={...(S.ctOpen||{}),[d.i]:!(S.ctOpen||{})[d.i]};render();return true;}
  if(a==='ctAll'){const o={...(S.ctOpen||{})};for(const x of (f&&f.els)||[])o[x.id]=d.v==='1';S.ctOpen=o;render();return true;}
  if(S.visit)return true;
  if(a==='ctEye'){if(!f||!isGest())return true;const n=clone(f),x=(n.els||[]).find(y=>y.id===d.i);if(!x)return true;const open=!x.rev;if(!open&&!canEdit())return true;x.rev=open;fiSave(n);return true;}
  if(a==='ctEl'){if(!f||!fiCanEd(f))return true;const it=d.i?(f.els||[]).find(x=>x.id===d.i):null;if(d.i&&!it)return true;const R=ctEras(f);if(!R.length)return true;
    fiOpenDlg({kind:'ctEl',fid:f.id,iid:it?it.id:'',nom:it?it.nom:'',date:it?(it.date||''):'',an:it?(it.an==null?'':it.an):'',era:it?it.era:(d.e||R[0].id),txt:it?(it.txt||''):''});render();return true;}
  if(a==='ctElDel'&&g&&g.kind==='ctEl'){g.confirm=true;S._fiRedraw=true;render();return true;}
  if(a==='ctElDelOk'&&g&&g.kind==='ctEl'){const x=S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const n=clone(x);n.els=(n.els||[]).filter(y=>y.id!==g.iid);FI_AT=null;S.dlg=null;fiSave(n);return true;}
  if(a==='ctElSave'&&g&&g.kind==='ctEl'){const x=S.fiches[g.fid];if(!x||!fiCanEd(x))return true;const nom=(g.nom||'').trim();if(!nom){g.err='Le titre est obligatoire.';S._fiRedraw=true;render();return true;}
    if(!ctEra(x,g.era)){g.err='Choisis une ère.';S._fiRedraw=true;render();return true;}
    const ed=document.getElementById('fiEd'),txt=ed?fiSer(ed):(g.txt||''),n=clone(x),an=ctYr(g.an);n.els=n.els||[];const it=g.iid&&n.els.find(y=>y.id===g.iid);
    const v={nom,date:(g.date||'').trim(),an:an===''?'':+an,era:g.era,txt};
    if(it)Object.assign(it,v);else n.els.push({id:fiRid('e'),...v,rev:!isGest(),cree:new Date().toISOString(),par:ME||''});
    FI_AT=null;S.dlg=null;fiSave(n);return true;}
  if(!canEdit())return true;
  if(a==='ctEra'){if(!f)return true;const e=d.i?ctEra(f,d.i):null;if(d.i&&!e)return true;const R=ctEras(f),last=R[R.length-1];
    fiOpenDlg({kind:'ctEra',fid:f.id,eid:e?e.id:'',nom:e?e.nom:'',deb:e?ctYr(e.deb):(last?ctYr(last.fin):''),fin:e?ctYr(e.fin):'',col:e?(e.col||'gris'):CT_COL[R.length%CT_COL.length][0],seances:e?!!e.seances:false});render();return true;}
  if(a==='ctCol'&&g&&g.kind==='ctEra'){g.col=d.v;S._fiRedraw=true;render();return true;}
  if(a==='ctEraDel'&&g){g.confirm=true;S._fiRedraw=true;render();return true;}
  if(a==='ctEraNo'&&g){g.confirm=false;S._fiRedraw=true;render();return true;}
  if(a==='ctEraDelOk'&&g&&g.kind==='ctEra'){const x=S.fiches[g.fid];if(!x||ctEls(x,g.eid).length)return true;const n=clone(x);n.eres=(n.eres||[]).filter(e=>e.id!==g.eid);S.dlg=null;fiSave(n);return true;}
  if(a==='ctEraSave'&&g&&g.kind==='ctEra'){const x=S.fiches[g.fid];if(!x)return true;const nom=(g.nom||'').trim();if(!nom){g.err='Le nom est obligatoire.';S._fiRedraw=true;render();return true;}
    const n=clone(x),v={nom,deb:ctYr(g.deb)===''?'':+g.deb,fin:ctYr(g.fin)===''?'':+g.fin,col:g.col||'gris',seances:!!g.seances};n.eres=n.eres||[];const e=g.eid&&n.eres.find(y=>y.id===g.eid);
    if(e)Object.assign(e,v);else n.eres.push({id:fiRid('r'),...v});S.dlg=null;fiSave(n);return true;}
  return true;}
['ctEl','ctEra'].forEach(k=>FI_DLG.add(k));FI_ED.add('ctEl');

/* ---------- PNJ : bloc « Pouvoirs et capacités » (26/11/2026, import Kanka fin) ----------
   c.pnpw = {pw:[id de pouvoir], cap:[id de capacité]} ; œil eye.pw ; modification : canEditC. */
const pnPwOf=c=>({pw:((c&&c.pnpw&&c.pnpw.pw)||[]).filter(id=>S.pouvoirs&&S.pouvoirs[id]),cap:((c&&c.pnpw&&c.pnpw.cap)||[]).filter(id=>S.capacites&&S.capacites[id])});
function pnPwBlk(c,E,G,e){if(!pnBlkSee(c,'pw'))return null;const P=pnPwOf(c),n=P.pw.length+P.cap.length;if(!n&&!E&&!G)return null;if(!n&&isFeal(c)&&!E)return null;
  const row=(t,id)=>{const M=t==='pw'?S.pouvoirs:S.capacites;return `<div class="srow"><span>${lk({t,id},M[id].nom)}</span><span class="muted small">${t==='pw'?'Pouvoir':'Capacité naturelle'}</span></div>`;};
  return {e:!n,h:pnBlk('pn-pw','Pouvoirs et capacités',n?String(n):'',(P.pw.map(id=>row('pw',id)).concat(P.cap.map(id=>row('cap',id))).join('')||'<div class="muted small">Aucun pouvoir ni capacité renseigné.</div>'),{empty:!n,edit:E?'pnPw':'',hid:G&&!isFeal(c)&&!e.pw,eye:pnEyeB(c,'pw','Pouvoirs et capacités')})};}
function pnPwSheet(g){const c=S.chars[g.cid];if(!c||!canEditC(c))return null;const P=S.pouvoirs||{},C=S.capacites||{};
  const srt=(M,L)=>Object.keys(M).filter(id=>!L.includes(id)).sort((a,b)=>(M[a].nom||'').localeCompare(M[b].nom||'','fr'));
  const chip=(t,id)=>{const M=t==='pw'?P:C;return M[id]?`<span class="rchip">${esc(M[id].nom)} <small class="muted">· ${t==='pw'?'pouvoir':'capacité'}</small><button type="button" class="ibtn" data-act="pnPwX" data-t="${t}" data-id="${esc(id)}" aria-label="Retirer ${esc(M[id].nom)}">✕</button></span>`:'';};
  return fiShell(g,'Pouvoirs et capacités',`<div><h2>Pouvoirs et capacités</h2><div class="muted small">${esc(pnName(c))}</div></div>
    <div class="fxl pnpwl">${g.pw.map(id=>chip('pw',id)).join('')}${g.cap.map(id=>chip('cap',id)).join('')||''}${!g.pw.length&&!g.cap.length?'<span class="muted small">Aucun pour l\'instant.</span>':''}</div>
    <div class="field"><label for="pnPwA">Ajouter</label><select id="pnPwA" data-pnpwadd="1"><option value="">— choisir —</option><optgroup label="Pouvoirs">${srt(P,g.pw).map(id=>`<option value="pw:${esc(id)}">${esc(P[id].nom)}</option>`).join('')}</optgroup><optgroup label="Capacités naturelles">${srt(C,g.cap).map(id=>`<option value="cap:${esc(id)}">${esc(C[id].nom)}</option>`).join('')}</optgroup></select></div>
    <div class="actions"><button class="btn" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="pnPwSave">Enregistrer</button></div>`);}
FI_DLG.add('pnPw');
document.addEventListener('change',ev=>{const t=ev.target;if(!t||!t.dataset||t.dataset.pnpwadd===undefined)return;const g=S.dlg;if(!g||g.kind!=='pnPw'||!t.value)return;
  const [k,id]=[t.value.slice(0,t.value.indexOf(':')),t.value.slice(t.value.indexOf(':')+1)];if((k==='pw'||k==='cap')&&!g[k].includes(id))g[k].push(id);S._fiRedraw=true;render();});
