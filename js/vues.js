/* La belle appli — vues : XP, personnages, joueurs, règles */
/* --- vues --- */
function teamCard(c){
  const s=summary(c,S.events),p=paliers(c),off=!actif(c);
  let stage='';
  if(p&&!off){stage=p.done?`<span class="pill good">Légendaire atteint</span>`:`<span class="pill acc">${p.stage} : ${p.blocked?'hors de portée':p.total+' XP'}</span>`;}
  const plan=off?`<span class="pill">${STATUTS[c.statut]||''}</span>`:s.prevu?`${s.manque?`<span class="pill bad">Il manque ${s.manque}</span>`:''}<span class="pill plan">Prévu ${s.prevu}</span>`:`<span class="pill">Rien de prévu</span>`;
  const img=portrait(c);
  return `<button class="card team${off?' off':''}" data-act="sel" data-id="${c.id}"><span class="thead"><span class="tph">${img?`<img src="${img}" alt="">`:`<span class="ini">${esc((c.court||'?').slice(0,1))}</span>`}</span><span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="nm">${esc(c.court)}</span>${c.race?`<span class="small" style="color:var(--accent);font-weight:600">${esc(c.race)}</span>`:''}<span class="muted small">${whoLine(c)}${c.cache?' · masqué aux autres':''}</span></span></span>
    <span class="big num">${s.dispo}</span><span class="muted small">XP disponibles · ${s.gains} gagnés, ${s.spent} dépensés</span>
    <span style="display:flex;gap:6px;flex-wrap:wrap">${plan}${stage}</span></button>`;
}
function heritageCard(){
  const auto=scenarioCount(S.events),n=starCount(S.events,S.heritage.delta),adj=n-auto;
  let st='';for(let i=1;i<=STARS;i++)st+=`<button class="star${i<=n?' on':''}" data-act="star" data-n="${i}" aria-pressed="${i<=n}" aria-label="Étoile ${i} sur ${STARS}">${i<=n?'★':'☆'}</button>`;
  return `<div class="card"><div class="prof-head"><b style="font-family:var(--font-display);font-size:18px">Rang d'héritage</b><span class="pill plan">${n} / ${STARS} étoiles</span></div><div class="frow" style="margin-bottom:6px"><div class="field"><label for="hs">Score</label><input id="hs" type="number" inputmode="numeric" data-her="score" value="${esc(S.heritage.score)}"></div></div><div class="stars">${st}</div><div class="muted small" style="margin-top:6px">Une étoile se remplit à chaque gain de type Scénario (${auto} joués). Touche une étoile pour corriger à la main${adj?' · ajusté de '+(adj>0?'+':'')+adj:''}.${adj?' <button class="btn ghost" style="padding:2px 8px" data-act="starReset">Annuler l\'ajustement</button>':''}</div></div>`;
}
function viewTeam(){
  const hc=heritageCard();
  if(!ids().length)return hc+emptyState();
  const act=ids().filter(i=>actif(S.chars[i])),arc=ids().filter(i=>!actif(S.chars[i]));
  let h=`<h2 style="margin-top:4px">Personnages</h2>`+hc+`<div class="grid">${act.map(i=>teamCard(S.chars[i])).join('')}</div>`;
  if(arc.length)h+=`<h2>Archives</h2><div class="grid">${arc.map(i=>teamCard(S.chars[i])).join('')}</div>`;
  return h;
}
function emptyState(){
  const msg=S.sync==='local'?"Les données sont partagées par la base du groupe, qui n'est pas accessible depuis cette vue. Ouvre la page depuis claude.ai avec ton compte.":S.ready?"Aucun personnage visible pour l'instant. Tu peux en créer un dans l'onglet Joueurs.":"Chargement des personnages…";
  return `<div class="card empty">${esc(msg)}</div>`;
}
const PORTRAITS=['kerian','maral','massetoc','rowen','sloan','theodule'];
function portrait(c){if(S.ptr&&c&&S.ptr[c.id])return S.ptr[c.id];const k=String(c.court||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');return PORTRAITS.includes(k)?'portraits/'+k+'.jpg':null;}
function viewSheet(){
  if(!ids().length)return emptyState();
  const id=S.sel&&S.chars[S.sel]&&vis(S.chars[S.sel])?S.sel:ids()[0];S.sel=id;const c=S.chars[id],s=summary(c,S.events);
  const chips=ids().map(i=>{const c=S.chars[i],img=portrait(c);return `<button class="pchip" data-act="sel" data-id="${i}" aria-pressed="${i===id}" aria-label="${esc(c.court)}"><span class="ph">${img?`<img src="${img}" alt="">`:`<span class="ini">${esc((c.court||'?').slice(0,1))}</span>`}</span><span class="pn">${esc(c.court)}</span></button>`;}).join('');
  let h=`<button class="back" data-act="tab" data-v="team"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Tous les personnages</button><div class="pchips">${chips}</div>`;
  h+=`<div style="margin-bottom:12px"><div style="font-family:var(--font-display);font-size:24px;font-weight:700">${esc(c.nom)}${c.race?`<span style="font-family:var(--font-body,inherit);font-size:15px;font-weight:600;color:var(--accent)"> · ${esc(c.race)}</span>`:''}</div><div class="muted small">${whoLine(c)}${actif(c)?'':' · '+(STATUTS[c.statut]||'')}${c.cache?' · masqué aux autres':''}</div></div>`;
  h+=`<div class="strip"><div><b class="num">${s.gains}</b><span>Gains</span></div><div><b class="num">${s.spent}</b><span>Dépensé</span></div><div class="hi"><b class="num">${s.dispo}</b><span>Dispo</span></div><div><b class="num">${s.prevu}</b><span>Prévu</span></div><div class="${s.manque?'warn':''}"><b class="num">${s.manque}</b><span>Manque</span></div></div>`;
  if(c.type==='PNJ'){
    const f=S.pnjForm;
    h+=`<h2>Ajouter des XP</h2><div class="card"><div class="frow"><div class="field"><label for="px">Intitulé</label><input id="px" type="text" data-pnj="titre" placeholder="ex. S12. Titre du scénario" value="${esc(f.titre)}"></div><div class="field"><label for="pm">XP</label><input id="pm" type="number" inputmode="numeric" min="0" data-pnj="montant" value="${esc(f.montant)}"></div></div><button class="btn pri" data-act="pnjXp"${f.titre.trim()&&+f.montant>0?'':' disabled'}>Ajouter à ${esc(c.court)}</button></div>`;
  }
  const fxl=fxOf(c),fm=S.forme||'m',hasD=fxl.some(e=>e.quand!=='tj');
  h+=`<div class="dhead"><h2>Caractéristiques dérivées</h2>${hasD?`<div class="seg sm" role="group" aria-label="Forme">${[['m','Masquée'],['d','Démasquée']].map(([v,l])=>`<button data-act="forme" data-v="${v}" aria-pressed="${fm===v}">${l}</button>`).join('')}</div>`:''}</div><div class="derived">`+derived(c,fm).map(([n,v,b,src])=>`<div><b class="num">${v}</b><span>${esc(n)}${b?' (dont '+(b>0?'+':'')+b+' de bonus)':''}${src&&src.length?`<em class="fxsrc">dont ${src.map(esc).join(', ')}</em>`:''}</span></div>`).join('')+`</div>`;
  h+=fxCard(c,fxl,fm);
  if(c.type==='PJ'){
    h+=`<h2>Ressources</h2><div class="card">`;
    h+=itemRow(c,'feerie',s.dispo)+itemRow(c,'masque',s.dispo)+staticRow('Tricherie',tricherie(c),'calculée')+itemRow(c,'fortune',s.dispo)+(()=>{const src=fxIntSrc(c,'fortune');return src.length?`<div class="muted small fxnote">Fortune : dont ${src.map(esc).join(', ')}</div>`:'';})()+itemRow(c,'atout',s.dispo)+(c.type==='PJ'?'':namesBlock(c,'atout'))+itemRow(c,'spec',s.dispo)+specBlock(c);
    h+=`</div>`;
  }
  h+=`<h2>Caractéristiques</h2><div class="card">`+CARACS.map(n=>itemRow(c,'carac:'+n,s.dispo)+(()=>{const src=fxIntSrc(c,'car:'+n);return src.length?`<div class="muted small fxnote">${esc(n)} : dont ${src.map(esc).join(', ')}</div>`:'';})()).join('')+`</div>`;
  h+=`<h2>${c.type==='PNJ'?'Profils':'Compétences'}</h2>`;
  for(const pr of c.profils||[]){
    const rk=rankOf(c,pr),nr=nextRank(c,pr);
    h+=`<div class="card" style="margin-bottom:10px"><div class="prof-head"><b>${esc(pr.nom)}</b><span style="display:flex;gap:8px;align-items:center"><span class="pill acc">rang ${rk}</span>`+
      (c.type==='PJ'?`<button class="ppf" data-act="ppOpen" data-prof="${esc(pr.nom)}" aria-label="Points de personnage ${esc(pr.nom)} : ${pr.note??0}"><small>PP</small>${esc(ppFmt(pr.note??0))}</button>`:'')+`</span></div>`;
    if(c.type==='PJ'){
      h+=(pr.comps||[]).map(x=>itemRow(c,'comp:'+x.nom,s.dispo)).join('');
      h+=nr?`<div class="muted small" style="padding-top:6px">Rang ${rk+1} : <b class="num">${nr.cost} XP</b> (${esc(nr.steps.join(', '))})</div>`:`<div class="muted small" style="padding-top:6px">Rang suivant hors de portée (maxima atteints).</div>`;
    }else{
      h+=itemRow(c,'prof:'+pr.nom,s.dispo);
      if(pr.subs&&pr.subs.length)h+=`<div class="tags">${pr.subs.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`;
    }
    h+=`</div>`;
  }
  if(c.type==='PNJ')h+=`<div class="card" style="margin-top:10px">${itemRow(c,'spec',s.dispo)}${specBlock(c)}</div>`;
  if(c.type==='PJ'){
    h+=`<h2>Compétences futiles</h2><div class="card">`+((c.futiles||[]).map(f=>itemRow(c,'fut:'+f.nom,s.dispo)).join('')||'<div class="muted">Aucune.</div>');
    if(S.futForm.open)h+=`<div class="frow" style="margin-top:10px"><div class="field"><label for="fn">Nom</label><input id="fn" type="text" data-fut="nom" value="${esc(S.futForm.nom)}"></div><div class="field"><label for="fm">Niveau max</label><input id="fm" type="number" min="1" max="12" data-fut="max" value="${esc(S.futForm.max)}"></div></div><div class="actions"><button class="btn pri" data-act="futSave">Ajouter</button><button class="btn" data-act="futCancel">Annuler</button></div>`;
    else h+=`<div style="margin-top:10px"><button class="btn" data-act="futOpen">+ Ajouter une compétence futile</button></div>`;
    h+=`</div>`;
  }
  if(c.type==='PJ'){
    h+=`<h2>Autres dépenses</h2><div class="card">`+AUTRES.map(n=>`<div class="irow" style="grid-template-columns:minmax(0,1fr) 60px"><button class="rmain" data-act="openAutre" data-nom="${n}" style="grid-template-columns:minmax(0,1fr) auto"><span class="nm">${n}</span><span class="lv">${autreTotal(c,n)}<small> XP</small></span></button><button class="plus${s.dispo>0?' ok':''}" data-act="autrePlus" data-nom="${n}"${s.dispo>0?'':' disabled'} aria-label="Dépenser des XP en ${n}">+</button></div>`).join('')+`</div>`;
  }
  const p=paliers(c);
  if(p){
    h+=`<h2>Chemin vers ${p.done?'Légendaire':p.stage}</h2><div class="card">`;
    if(p.done)h+=`<div class="muted">Les quatre minima du palier Légendaire sont atteints.</div>`;
    else{
      h+=`<div class="muted small" style="margin-bottom:6px">Il faut réunir les quatre critères. ${p.stage==='Légendaire'?'Le palier Profond est déjà passé.':''}</div>`;
      h+=p.gauges.map(g=>{const done=g.cost===0&&g.cur>=g.target;
        return `<div class="gauge${done?' done':''}"><span>${esc(g.label)}${g.via?`<br><span class="muted small">le moins cher : ${esc(g.via)}</span>`:''}</span>${bar(g.cur,g.target)}<span class="lv">${g.cur}<small>/${g.target}</small> <span class="pill ${done?'good':g.blocked?'bad':''}">${done?'OK':g.blocked?'max trop bas':g.cost+' XP'}</span></span></div>`;}).join('');
      h+=`<div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid var(--line)"><b>Total restant</b><b class="num">${p.blocked?'—':p.total+' XP'}</b></div>`;
      if(!p.blocked)h+=`<div class="muted small">${p.total<=s.dispo?'Finançable avec les XP disponibles.':'Il manque '+(p.total-s.dispo)+' XP par rapport au solde disponible.'}</div>`;
    }
    h+=`</div>`;
  }
  const ach=[...(c.achats||[])].reverse();
  h+=`<h2>Historique des achats</h2><div class="card"><div class="muted small" style="margin-bottom:6px">${ach.length} achats · ${s.spent} XP dépensés · touche un achat pour le modifier ou l'annuler</div>`;
  const shown=S.hist[id]?ach:ach.slice(0,8);
  h+=shown.map(a=>`<button class="row" style="grid-template-columns:minmax(0,1fr) auto" data-act="achatEdit" data-id="${a.id}"><span><span class="t" style="font-weight:600">${a.ppNP?esc(a.label.replace(/non précisé$/,'')).concat('<i style="font-weight:400">non précisé</i>'):esc(a.label)}</span><br><span class="muted small">${a.date?fmtDate(a.date):'importé du tableur'}</span></span><span class="nx">${a.cout} XP</span></button>`).join('')||'<div class="muted">Aucun achat.</div>';
  if(ach.length>8)h+=`<div style="margin-top:8px"><button class="btn ghost" data-act="histToggle">${S.hist[id]?'Réduire':'Tout afficher'}</button></div>`;
  h+=`</div>`;
  return h;
}
const allPJ=()=>Object.values(S.chars).filter(c=>c.type==='PJ'&&actif(c)&&!c.cache).map(c=>c.id);
const lp=l=>l.persos!=null?l.persos:(l.nature==='Scénario'||l.nature==='Groupe')?allPJ():[];
const lockedLine=l=>l.nature==='Groupe'&&l.persos==null;
function viewLegacyForm(){
  let h='';
  const f=S.form;if(!f.date)f.date=today();
  const formChars=pjIds().filter(i=>actif(S.chars[i]));
  const editing=!!f.editId;
  h+=`<h2 style="margin-top:4px">${editing?'Modifier le gain':'Nouveau gain d\'XP'}</h2><div class="card"${editing?' style="border-color:var(--accent)"':''}><div class="frow"><div class="field"><label for="gty">Type</label><select id="gty" data-f="type">${TYPES.map(t=>`<option${t===(f.type||'Scénario')?' selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label for="gt">Intitulé</label><input id="gt" type="text" data-f="titre" placeholder="ex. S12. Titre du scénario" value="${esc(f.titre)}"></div><div class="field"><label for="gd">Date</label><input id="gd" type="date" data-f="date" value="${esc(f.date)}"></div></div>`;
  f.lines.forEach((ln,i)=>{
    h+=`<div style="border-top:1px solid var(--line);padding-top:10px;margin-top:10px"><div class="frow"><div class="field"><label for="gn${i}">Nature</label><select id="gn${i}" data-l="${i}" data-k="nature">${NATURES.map(n=>`<option${n===ln.nature?' selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label for="gm${i}">XP par personnage</label><input id="gm${i}" type="number" inputmode="numeric" min="0" data-l="${i}" data-k="montant" value="${esc(ln.montant)}"></div></div>
    <div class="chips" style="flex-wrap:wrap;overflow:visible">${formChars.map(id=>`<button class="chip" data-act="lineChar" data-l="${i}" data-id="${id}" aria-pressed="${lp(ln).includes(id)}"${lockedLine(ln)?' disabled':''}>${esc(S.chars[id].court)}</button>`).join('')}</div>${lockedLine(ln)?'<div class="muted small">Groupe : s\'applique à tous les PJ.</div>':''}
    <div class="actions" style="margin-bottom:4px">${lockedLine(ln)?'':`<button class="btn ghost" data-act="lineAll" data-l="${i}">Tous les PJ</button><button class="btn ghost" data-act="lineNone" data-l="${i}">Aucun</button>`}${f.lines.length>1?`<button class="btn ghost" data-act="lineDel" data-l="${i}">Retirer la ligne</button>`:''}</div></div>`;
  });
  const valid=f.titre.trim()&&(f.lines.some(l=>+l.montant>0&&lp(l).length)||(editing&&(f.keep||[]).length));
  h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="lineAdd">+ Autre nature</button>${editing?'<button class="btn ghost" data-act="gainCancel">Annuler</button>':''}<button class="btn pri" data-act="gainSave"${valid?'':' disabled'}>${editing?'Enregistrer les modifications':'Enregistrer le gain'}</button></div></div>`;
  return h;
}

const sessList=()=>S.events.filter(e=>e.session&&!e.rattrapage).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||S.events.indexOf(b)-S.events.indexOf(a));
const sessById=id=>S.events.find(e=>e.id===id&&e.session);
function curSession(){const L=sessList();if(S.curSess&&L.some(e=>e.id===S.curSess))return sessById(S.curSess);return L[0]||null;}
/* PJ présents d'une session : liste enregistrée, sinon déduite (PJ ayant du Scénario, à défaut un gain quelconque) */
function presents(e){if(!e)return [];const isPJ=i=>S.chars[i]&&S.chars[i].type==='PJ';if(Array.isArray(e.pj))return e.pj.filter(isPJ);
  const sc=[...new Set(e.entries.filter(x=>x.nature==='Scénario'&&x.montant&&isPJ(x.perso)).map(x=>x.perso))];if(sc.length)return sc;
  return [...new Set(e.entries.filter(x=>x.montant&&isPJ(x.perso)).map(x=>x.perso))];}
const orderPJ=a=>{const o=pjIds();return [...a].sort((x,y)=>{const i=o.indexOf(x),j=o.indexOf(y);return (i<0?99:i)-(j<0?99:j);});};
/* Destinataires d'une ligne de saisie dans une session : Scénario → présents, Groupe → PJ actifs, Individuel → choix parmi les présents */
function slp(l,cs){if(l.nature==='Scénario')return presents(cs);if(l.nature==='Groupe')return allPJ();const pr=presents(cs);return (l.persos||[]).filter(p=>pr.includes(p));}
/* Modifier par nature : Scénario → présents ; Groupe → PJ qui l'ont déjà (sinon PJ actifs) ; Individuel → présents + ceux qui en ont */
function natTargets(e,n){if(n==='Scénario')return presents(e);const has=[...new Set(e.entries.filter(x=>x.nature===n&&x.montant&&S.chars[x.perso]&&S.chars[x.perso].type==='PJ').map(x=>x.perso))];return has.length?has:allPJ();}
function natList(e,g){return orderPJ([...new Set([...presents(e),...Object.keys(g.vals).filter(i=>+g.vals[i])])]).filter(i=>S.chars[i]&&vis(S.chars[i]));}
function modeOf(a){const c={};let b=null;for(const v of a){c[v]=(c[v]||0)+1;if(b===null||c[v]>c[b])b=v;}return b;}
/* Début d'intitulé proposé : numéro suivant le plus grand déjà utilisé pour ce type */
function sessPrefix(type){
  const re=type==='Scénario'?/^S\.?\s*0*(\d+)/i:type==='Interscénario'?/^\[\s*Int\.?\s*0*(\d+)/i:null;if(!re)return '';
  let n=0;for(const e of S.events)if(e.session&&evType(e)===type){const m=(e.titre||'').match(re);if(m)n=Math.max(n,+m[1]);}
  return type==='Scénario'?'S'+String(n+1).padStart(2,'0')+'. ':'[Int. '+String(n+1).padStart(3,'0')+'] ';
}
const sessLabel=e=>e?esc(e.titre)+(e.date?' · '+fmtDate(e.date):e.textuelle?' · Session textuelle':''):'';
const sessChildren=id=>S.events.filter(e=>e.sessionId===id);
function sessOptions(sel){return `<option value="">Aucune session</option>`+sessList().map(e=>`<option value="${e.id}"${e.id===sel?' selected':''}>${sessLabel(e)}</option>`).join('');}
function pnjAttached(){return Object.values(S.chars).filter(c=>c.type==='PNJ'&&c.pj&&S.chars[c.pj]&&vis(c)).sort((a,b)=>(a.court||'').localeCompare(b.court||''));}
function viewGains(){
  if(!ids().length)return emptyState();
  if(S.form.editId)return viewLegacyForm()+gainsTableAndJournal();
  const cs=curSession(),L=sessList();
  let h=`<h2 style="margin-top:4px">Session de jeu</h2><div class="card" style="display:flex;flex-direction:column;gap:10px">`;
  if(cs){h+=`<div class="field"><label for="cur-s">Session</label><select id="cur-s" data-cursess="1">${L.map(e=>`<option value="${e.id}"${e.id===cs.id?' selected':''}>${sessLabel(e)} · ${esc(evType(e))}</option>`).join('')}</select></div>`;}
  else h+=`<div class="muted">Aucune session pour l'instant. Crée la première pour y ajouter de l'XP.</div>`;
  h+=`<div class="actions">${cs?`<button class="btn" data-act="sessEdit">Modifier la session</button>`:''}<button class="btn pri" data-act="sessNew">+ Nouvelle session</button></div></div>`;
  if(cs){
    const f=S.form,formChars=pjIds().filter(i=>actif(S.chars[i]));
    h+=`<h2>Ajouter de l'XP à la session</h2><div class="card">`;
    const pr=orderPJ(presents(cs)),nmL=a=>a.map(i=>esc(S.chars[i].court)).join(', ');
    f.lines.forEach((ln,i)=>{
      h+=`<div style="${i?'border-top:1px solid var(--line);padding-top:10px;margin-top:10px':''}"><div class="frow"><div class="field"><label for="gn${i}">Nature</label><select id="gn${i}" data-l="${i}" data-k="nature">${NATURES.map(n=>`<option${n===ln.nature?' selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label for="gm${i}">XP par personnage</label><input id="gm${i}" type="number" inputmode="numeric" min="0" data-l="${i}" data-k="montant" value="${esc(ln.montant)}"></div></div>`;
      if(ln.nature==='Scénario')h+=`<div class="muted small" style="margin:6px 0 4px">${pr.length?`Attribuée aux ${pr.length} PJ présents : ${nmL(pr)}.`:'Aucun PJ présent : coche-les dans « Modifier la session ».'}</div>`;
      else if(ln.nature==='Groupe')h+=`<div class="muted small" style="margin:6px 0 4px">Attribuée à tous les PJ actifs (${allPJ().length}).</div>`;
      else{const sel=slp(ln,cs);h+=`<div class="chips" style="flex-wrap:wrap;overflow:visible;margin-top:6px">${pr.map(id=>`<button class="chip" data-act="slChar" data-l="${i}" data-id="${id}" aria-pressed="${sel.includes(id)}">${esc(S.chars[id].court)}</button>`).join('')}</div><div class="muted small" style="margin-top:4px">${pr.length?'Seuls les PJ présents sont proposés.':'Aucun PJ présent : coche-les dans « Modifier la session ».'}</div>`;}
      h+=f.lines.length>1?`<div class="actions" style="margin-bottom:4px"><button class="btn ghost" data-act="lineDel" data-l="${i}">Retirer la ligne</button></div>`:'';
      h+=`</div>`;
    });
    const valid=f.lines.some(l=>+l.montant>0&&slp(l,cs).length);
    h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="lineAdd">+ Autre nature</button><button class="btn pri" data-act="sessAdd"${valid?'':' disabled'}>Ajouter à la session</button></div>`;
    const P=pnjAttached();
    if(P.length){
      h+=`<div class="pnjbox"><h3>PNJ · part calculée sur la session</h3>`+P.map(c=>{const sh=pnjShares(c,S.events).find(x=>x.sess===cs.id),pj=S.chars[c.pj];
        if(!sh)return `<div class="prow"><span class="pn"><b>${esc(c.court)}</b> <span class="muted">· ${esc(pj.court)} · rattaché après cette session</span></span></div>`;
        return `<div class="prow"><span class="pn"><b>${esc(c.court)}</b> <span class="muted">· ${esc(pj.court)} · ${sh.pct} % de ${sh.base}</span></span><span class="pv num">+${sh.montant}</span><button class="tgl" role="switch" aria-checked="${sh.on}" aria-label="${esc(c.court)} a participé activement" data-act="pnjToggle" data-id="${c.id}"><i></i></button></div>`;}).join('')+
        `<div class="muted small" style="margin-top:6px">Interrupteur : a participé activement (50 %), sinon 25 %. Arrondi à l'inférieur, mis à jour automatiquement si un gain est rattaché plus tard.</div></div>`;
    }
    h+=`</div>`;
  }
  return h+gainsTableAndJournal();
}
function gainsTableAndJournal(){
  let h='';
  const list=pjIds().map(i=>S.chars[i]);
  const gt=gainsTable(list,S.events);
  const extra=[];for(const e of S.events)for(const en of e.entries){const ch=S.chars[en.perso];if(ch&&ch.type==='PJ'&&!NATURES.includes(en.nature)&&!extra.includes(en.nature))extra.push(en.nature);}
  const nat=NATURES.concat(extra);
  h+=`<h2>XP gagnée par nature</h2><div class="card"><div class="muted small" style="margin-bottom:8px">⚠ signale un PJ dont le total est inférieur d'au moins ${GAP} XP à la moyenne du groupe (${(Math.round(gt.avg*10)/10).toString().replace('.',',')}).</div><div class="tbl"><table><thead><tr><th>Perso</th>${nat.map(n=>`<th>${esc(n)}</th>`).join('')}<th>Total</th><th>Écart</th></tr></thead><tbody>`+
    gt.rows.map(r=>{const c=r.c,off=!actif(c)||c.horsMoyenne;const d=Math.round(r.delta);
      const rt=r.alert?rattrapage(gt.rows,r):null;
      return `<tr class="${r.alert?'alert':off?'off':''}"><td>${r.alert?'<span aria-label="Alerte">⚠</span> ':''}${esc(c.court)}${rt?` <button class="ratbtn" data-act="ratOpen" data-id="${c.id}" title="Rattrapage d'XP" aria-label="Rattrapage d'XP pour ${esc(c.court)}">↑</button>`:''}${!actif(c)?' <span class="pill">'+(STATUTS[c.statut]||'')+'</span>':''}${c.horsMoyenne&&actif(c)?' <span class="pill">hors moyenne</span>':''}</td>${nat.map(n=>`<td>${r.by[n]||'·'}</td>`).join('')}<td><b>${r.total}</b></td><td>${off?'·':(d>0?'+'+d:d<0?'−'+(-d):'0')}</td></tr>`;}).join('')+
    `<tr class="avg"><td>Moyenne du groupe</td>${nat.map(()=>'<td></td>').join('')}<td><b>${Math.round(gt.avg*10)/10}</b></td><td></td></tr></tbody></table></div></div>`;

  h+=`<h2>Journal</h2><div class="card">`;
  const pv=c=>{const ch=S.chars[c];return ch&&ch.type==='PJ'&&vis(ch);};
  const grpTags=ents=>{const grp={};for(const en of ents){const k=en.nature+' +'+en.montant;(grp[k]=grp[k]||[]).push(S.chars[en.perso].court);}return grp;};
  const top=[...S.events].reverse().filter(e=>!e.sessionId||!sessById(e.sessionId));
  const first=top.find(e=>e.session);S.jOpen=S.jOpen||{};
  h+=top.map(e=>{
    if(e.session){
      const open=e.id in S.jOpen?S.jOpen[e.id]:e===first;
      if(!open)return `<div class="sess"><div class="shead tg" data-act="sessToggle" data-id="${e.id}" role="button" tabindex="0" aria-expanded="false"><span class="chev" aria-hidden="true">›</span><div style="min-width:0"><div class="t" style="font-size:17px">${esc(e.titre)}</div><div class="muted small">${[e.date?fmtDate(e.date):e.textuelle?'Session textuelle':'',esc(evType(e))].filter(Boolean).join(' · ')}</div>${(()=>{const pr=orderPJ(presents(e));return pr.length?`<div class="muted small" style="margin-top:2px">👥 ${pr.map(i=>esc(S.chars[i].court)).join(', ')}</div>`:'';})()}</div></div></div>`;
      const kids=sessChildren(e.id);
      let body='';
      const NCL={Scénario:'n-sc',Groupe:'n-gr',Individuel:'n-in'},ord=pjIds(),by={};
      for(const en of e.entries){if(!pv(en.perso))continue;(by[en.nature]=by[en.nature]||{});by[en.nature][en.perso]=(by[en.nature][en.perso]||0)+en.montant;}
      const nats=NATURES.filter(n=>by[n]).concat(Object.keys(by).filter(n=>!NATURES.includes(n)));
      for(const n of nats){const o=by[n],ps=Object.keys(o).filter(p=>o[p]).sort((a,b)=>ord.indexOf(a)-ord.indexOf(b));if(!ps.length)continue;const cl=NCL[n]||'acc',nm=p=>esc(S.chars[p].court);
        const btn=`<button class="btn ghost" style="padding:4px 10px;flex:none" data-act="natEdit" data-id="${e.id}" data-n="${esc(n)}">Modifier</button>`;
        if(n==='Individuel'){body+=`<div class="nb"><div class="nbh"><b>${esc(n)}</b>${btn}</div><div class="nbl">${ps.map(p=>`<span class="xpi">${nm(p)} <span class="xpn">+${o[p]}</span></span>`).join(', ')}</div></div>`;continue;}
        const g={};for(const p of ps)(g[o[p]]=g[o[p]]||[]).push(p);const ks=Object.keys(g).sort((a,b)=>b-a);
        body+=`<div class="nb"><div class="nbh"><span class="nt"><b>${esc(n)}</b>${ks.length===1?`<span class="xpn">+${ks[0]}</span>`:''}</span>${btn}</div><div class="nbl">${ks.length===1?`<span class="muted small">${g[ks[0]].map(nm).join(', ')}</span>`:ks.map(m=>`<div><span class="xpn">+${m}</span> <span class="muted small">${g[m].map(nm).join(', ')}</span></div>`).join('')}</div></div>`;}
      body+=kids.map(k=>{const ents=k.entries.filter(en=>pv(en.perso));if(!ents.length)return '';const g=grpTags(ents);return `<div class="sline"><div style="min-width:0"><div>${esc(k.titre)}</div><div class="tags">${Object.keys(g).map(x=>`<span class="pill acc">${esc(x)}</span><span class="muted small">${g[x].length===allPJ().length?'tous les PJ actifs':esc(g[x].join(', '))}</span>`).join(' ')}</div></div><span class="locked" style="max-width:110px;text-align:right">Se corrige depuis Univers › ${k.creature?'Créatures':'Secrets'}</span></div>`;}).join('');
      {const pn=[];let calc=false,rep=false;
        for(const en of e.entries){const ch=S.chars[en.perso];if(!ch||ch.type!=='PNJ'||!vis(ch)||!en.montant)continue;const x=pn.find(y=>y.id===en.perso&&y.n===en.nature);if(x)x.m+=en.montant;else pn.push({id:en.perso,n:en.nature,m:en.montant});rep=true;}
        for(const c of Object.values(S.chars)){if(c.type!=='PNJ'||!vis(c))continue;const sh=pnjShares(c,S.events).find(x=>x.sess===e.id);if(sh&&sh.montant){pn.push({id:c.id,n:sh.nature,m:sh.montant});calc=true;}}
        if(pn.length)body+=`<div class="nb"><div class="nbh"><b>PNJ</b><span class="locked" style="text-align:right">${calc&&rep?'Calculée ou reprise':calc?'Calculée automatiquement':'Reprise de l\'ancien journal'}</span></div><div class="nbl">${pn.map(x=>{const m=(x.n||'').match(/\((\d+) %\)/);return `<div>${esc(S.chars[x.id].court)} <span class="xpn">+${x.m}</span>${m?' ('+m[1]+' %)':''}</div>`;}).join('')}</div></div>`;}
      const blocked=kids.filter(k=>!(k.secret&&k.secret.k==='bonus')).length;
      return `<div class="sess open"><div class="shead tg" data-act="sessToggle" data-id="${e.id}" role="button" tabindex="0" aria-expanded="true"><span class="chev" aria-hidden="true">›</span><div style="min-width:0"><div class="t" style="font-size:17px">${esc(e.titre)}</div><div class="muted small">${[e.date?fmtDate(e.date):e.textuelle?'Session textuelle':'',esc(evType(e))].filter(Boolean).join(' · ')}</div>${(()=>{const pr=orderPJ(presents(e));return pr.length?`<div class="muted small" style="margin-top:2px">👥 ${pr.map(i=>esc(S.chars[i].court)).join(', ')}</div>`:'';})()}</div><button class="btn ghost" style="padding:4px 10px;flex:none" data-act="sessEditId" data-id="${e.id}">Modifier</button></div>${body||'<div class="muted small" style="padding:6px 0">Aucun gain pour l\'instant.</div>'}${blocked?`<div class="muted small" style="margin-top:6px">Suppression impossible tant que ${blocked} découverte${blocked>1?'s sont rattachées':' est rattachée'} à cette session.</div>`:''}</div>`;
    }
    const ents=e.entries.filter(en=>pv(en.perso));if(!ents.length)return '';
    const g=grpTags(ents);
    const tags=Object.keys(g).map(k=>`<span class="pill acc">${esc(k)}</span><span class="muted small">${esc(g[k].join(', '))}</span>`).join(' ');
    return `<div class="ev"><div style="min-width:0"><div class="t">${esc(e.titre)}</div><div class="muted small">${e.date?fmtDate(e.date):'sans date'} · ${evType(e)}</div><div class="tags">${tags}</div></div>${e.secret||e.creature?`<span class="locked" style="flex:none;max-width:120px;text-align:right">Se corrige depuis Univers › ${e.creature?'Créatures':'Secrets'}</span>`:`<span style="display:flex;gap:6px;flex:none"><button class="btn ghost" style="padding:4px 10px" data-act="gainEdit" data-id="${e.id}">Modifier</button><button class="btn ghost" style="padding:4px 10px" data-act="gainDel" data-id="${e.id}">Supprimer</button></span>`}</div>`;
  }).join('')||'<div class="muted">Aucun gain enregistré.</div>';
  h+=`</div>`;
  return h;
}
function viewPlayers(){
  const pl=playersSorted(),tab=S.pTab||'joueurs',G=isGest();
  const me=S.players[ME],CHG='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
  const pushOk=pushOK()&&me&&Notification.permission!=='denied';
  let h=`<h2 style="margin-top:4px">Joueurs</h2><div class="card me2"><div style="min-width:0"><div class="muted small" style="white-space:nowrap">Sur cet appareil</div><b style="font-size:17px">${S.visit?'Visiteur':me?esc(me.nom):'—'}</b></div><div class="me2r">${pushOk?`<button class="nsw" data-act="${S.pushSub?'pushOff':'pushOn'}" role="switch" aria-checked="${!!S.pushSub}" aria-label="Notifications sur cet appareil" title="Notifications sur cet appareil"><span aria-hidden="true">🔔</span><span class="tg${S.pushSub?' on':''}"></span></button>`:''}<button class="icb" data-act="meOpen" title="Changer d'identité" aria-label="Changer d'identité">${CHG}</button></div></div>`;
  if(S.pushMsg||(!pushOK()&&me))h+=`<div class="muted small" style="margin:6px 4px 0">${S.pushMsg?esc(S.pushMsg):isIOS()&&!isStandalone()?'Notifications : sur iPhone, ajoute d\'abord l\'appli à l\'écran d\'accueil.':'Notifications non disponibles sur ce navigateur.'}</div>`;
  else if(me&&pushOK()&&Notification.permission==='denied')h+=`<div class="muted small" style="margin:6px 4px 0">Notifications bloquées pour ce site : autorise-les dans les réglages du navigateur.</div>`;
  const vc=ids().map(i=>S.chars[i]);
  h+=`<div class="seg2" role="group" aria-label="Affichage"><button data-act="pTab" data-v="joueurs" aria-pressed="${tab==='joueurs'}">Joueurs (${pl.filter(p=>!p.parti).length})</button><button data-act="pTab" data-v="perso" aria-pressed="${tab==='perso'}">Personnages (${vc.length})</button></div>`;
  const av=(txt,img)=>`<span class="av2">${img?`<img src="${img}" alt="">`:esc((txt||'?').slice(0,1))}</span>`;
  if(tab==='joueurs'){
    const row=p=>{const mine=vc.filter(c=>(p.persos||[]).includes(c.id)).map(c=>c.court).join(', ');
      const tags=(p.role==='MJ'?' <span class="tag2 mj">MJ</span>':'')+(hasGest(p)?' <span class="tag2 g">gestion</span>':'')+(p.id===ME?' <span class="tag2">toi</span>':'')+(p.parti?' <span class="tag2">parti</span>':'');
      const pin=G&&pinOn()?(S.id.pins&&S.id.pins.has(p.id)?'<span class="lk2" title="PIN défini">🔒</span>':'<span class="lk2">pas de PIN</span>'):'';
      return `<button class="lrow" data-act="plOpen" data-pid="${esc(p.id)}"${p.parti?' style="opacity:.7"':''}>${av(p.nom)}<span class="lm"><span class="lt">${esc(p.nom)}${tags}</span><span class="ls">${esc(mine||'—')}</span></span>${pin}<span class="chev">›</span></button>`;};
    h+=`<div class="card lcard">${pl.map(row).join('')||'<div class="empty">Aucun joueur.</div>'}</div>`;
    if(G)h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="newPOpen">+ Nouveau joueur</button></div>`;
    if(G&&!pinOn())h+=`<div class="muted small" style="margin-top:8px">Codes PIN inactifs : le script <b>3_pin.sql</b> n'est pas installé dans Supabase.</div>`;
  }else{
    const sub=c=>c.type==='PNJ'?(c.race?esc(c.race)+' · ':'')+(c.pj&&S.chars[c.pj]?'rattaché à '+esc(S.chars[c.pj].court):'non rattaché'):(c.race?esc(c.race):'race à préciser')+' · '+(owners(c).map(p=>esc(p.nom)).join(', ')||'sans joueur');
    const row=c=>`<button class="lrow" data-act="pcOpen" data-id="${esc(c.id)}">${av(c.court,portrait(c))}<span class="lm"><span class="lt">${esc(c.court)}${c.cache?' <span class="tag2">masqué</span>':''}</span><span class="ls">${sub(c)}</span></span><span class="chev">›</span></button>`;
    const act=c=>!c.statut||c.statut==='actif';
    const grp=(t,L)=>L.length?`<div class="grp2">${t}</div><div class="card lcard">${L.map(row).join('')}</div>`:'';
    const arch=vc.filter(c=>!act(c));
    h+=grp('PJ actifs',vc.filter(c=>act(c)&&c.type==='PJ'))+grp('PNJ',vc.filter(c=>act(c)&&c.type==='PNJ'));
    h+=`<div class="grp2">Archives</div>`+(arch.length?`<div class="card lcard">${arch.map(row).join('')}</div>`:`<div class="card"><span class="muted small">Décédés et retirés : aucun</span></div>`);
    if(ME&&!S.visit)h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="newCOpen">+ Nouveau personnage</button></div>`;
  }
  return h;
}
/* Droits dans l'onglet Joueurs : chacun sa fiche et ses personnages ; le reste avec les droits de gestion */
const canEditP=p=>!!p&&!S.visit&&(isGest()||p.id===ME);
const canEditC=c=>!!c&&!S.visit&&(isGest()||owners(c).some(p=>p.id===ME));
function plSheet(g){const p=S.players[g.id];if(!p)return null;const G=isGest(),ed=canEditP(p),last=gestCount()<=1,on=hasGest(p),arm=S.confirm==='pin:'+p.id;
  const mine=Object.values(S.chars).filter(c=>(p.persos||[]).includes(c.id)&&vis(c)).sort((a,b)=>(a.court||'').localeCompare(b.court||''));
  const opt=(lab,body)=>`<div class="optrow2"><span>${lab}</span>${body}</div>`;
  let h=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Fiche de ${esc(p.nom)}"><div class="in"><div class="shd"><h2>${esc(p.nom)}</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>
    <div class="frow"><div class="field"><label for="pn-${p.id}">Nom</label>${ed?`<input id="pn-${p.id}" type="text" data-pf="nom" data-pid="${p.id}" value="${esc(p.nom)}">`:`<div class="ro2">${esc(p.nom)}</div>`}</div><div class="field"><label for="pr-${p.id}">Rôle</label>${G?`<select id="pr-${p.id}" data-pf="role" data-pid="${p.id}">${['Joueur','MJ'].map(r=>`<option${(p.role||'Joueur')===r?' selected':''}>${r}</option>`).join('')}</select>`:`<div class="ro2">${esc(p.role||'Joueur')}</div>`}</div></div>
    <div class="grp2">Personnages</div>${mine.length?`<div class="plist2">${mine.map(c=>`<button class="lrow" data-act="pcOpen" data-id="${esc(c.id)}"><span class="av2">${portrait(c)?`<img src="${portrait(c)}" alt="">`:esc((c.court||'?').slice(0,1))}</span><span class="lm"><span class="lt">${esc(c.court)}${c.cache?' <span class="tag2">masqué</span>':''}</span><span class="ls">${c.type}${c.race?' · '+esc(c.race):''}</span></span><span class="chev">›</span></button>`).join('')}</div>`:'<div class="muted small">Aucun personnage.</div>'}`;
  let o='';
  if(ed)o+=opt('Parti de la table',`<button class="tgb" data-act="partiToggle" data-pid="${p.id}" role="switch" aria-checked="${!!p.parti}" aria-label="Parti de la table"><span class="tg${p.parti?' on':''}"></span></button>`);
  if(G)o+=opt('Droits de gestion',`<button class="tgb" data-act="gestToggle" data-pid="${p.id}" role="switch" aria-checked="${on}" aria-label="Droits de gestion"${on&&last?' disabled title="Il faut toujours au moins une personne avec ces droits"':''}><span class="tg${on?' on':''}"></span></button>`);
  if(G&&pinOn()){const has=S.id.pins&&S.id.pins.has(p.id);o+=opt(`Code PIN <span class="pst2 ${has?'ok':'no'}">${has?'défini':'pas encore de PIN'}</span>`,has?(arm?`<button class="btn" style="color:var(--bad)" data-act="pinResetOk" data-pid="${esc(p.id)}">Confirmer</button>`:`<button class="btn ghost" data-act="pinReset" data-pid="${esc(p.id)}">Réinitialiser</button>`):'');}
  if(o)h+=`<div class="grp2">Options</div>${o}`;
  if(G&&p.id===realId())h+=`<div class="actions" style="margin-top:10px"><button class="btn" data-act="asPlayer">Voir comme un joueur</button></div>`;
  if(G)h+=`<div class="danger2"><span>Zone sensible</span><button class="lnk-bad" data-act="pDel" data-pid="${p.id}">Supprimer le joueur</button></div>`;
  return h+`</div></div>`;}
function pcSheet(g){const c=S.chars[g.id];if(!c)return null;const ed=canEditC(c),G=isGest(),img=portrait(c),own=!!(S.ptr&&S.ptr[c.id]),ow=owners(c);
  const opt=(lab,body)=>`<div class="optrow2"><span>${lab}</span>${body}</div>`,ro=v=>`<div class="ro2">${v}</div>`;
  const sub=c.type+(c.race?' · '+esc(c.race):'')+(c.type==='PJ'?(ow.length?' · joué par '+ow.map(p=>esc(p.nom)).join(', '):' · sans joueur'):(c.pj&&S.chars[c.pj]?' · rattaché à '+esc(S.chars[c.pj].court):''));
  let h=`<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(c.court)}"><div class="in"><div class="shd"><span class="av2 big">${img?`<img src="${img}" alt="">`:esc((c.court||'?').slice(0,1))}</span><div style="flex:1;min-width:0"><h2>${esc(c.court)}</h2><div class="muted small">${sub}</div></div><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div>
    <div class="frow"><div class="field"><label for="cc-${c.id}">Nom court</label>${ed?`<input id="cc-${c.id}" type="text" data-cf="court" data-id="${c.id}" value="${esc(c.court)}">`:ro(esc(c.court))}</div><div class="field"><label for="cn-${c.id}">Nom complet</label>${ed?`<input id="cn-${c.id}" type="text" data-cf="nom" data-id="${c.id}" value="${esc(c.nom)}">`:ro(esc(c.nom||'—'))}</div>
    <div class="field"><label for="cs-${c.id}">Statut</label>${ed?`<select id="cs-${c.id}" data-cf="statut" data-id="${c.id}">${Object.entries(STATUTS).map(([k,v])=>`<option value="${k}"${(c.statut||'actif')===k?' selected':''}>${v}</option>`).join('')}</select>`:ro(STATUTS[c.statut||'actif'])}</div>
    <div class="field"><label for="cr-${c.id}">Race</label>${!c.race&&ed&&c.type==='PJ'?`<select id="cr-${c.id}" data-cf="race" data-id="${c.id}"><option value="">— à préciser —</option>${Object.keys(RACES).sort((a,b)=>a.localeCompare(b,'fr')).map(r=>`<option>${esc(r)}</option>`).join('')}</select>`:ro(esc(c.race||'—'))}</div>
    ${c.type==='PJ'?`<div class="field" style="grid-column:1/-1"><label for="co-${c.id}">Joué par</label>${ed?`<select id="co-${c.id}" data-owner="${c.id}"><option value="">— personne —</option>${playersSorted().filter(p=>!p.parti||ow.some(o=>o.id===p.id)).map(p=>`<option value="${p.id}"${ow[0]&&ow[0].id===p.id?' selected':''}>${esc(p.nom)}</option>`).join('')}</select>`:ro(ow.map(p=>esc(p.nom)).join(', ')||'—')}</div>`:`<div class="field" style="grid-column:1/-1"><label for="cp-${c.id}">Rattaché au PJ</label>${ed?`<select id="cp-${c.id}" data-cf="pj" data-id="${c.id}"><option value="">— aucun —</option>${Object.values(S.chars).filter(x=>x.type==='PJ').sort((a,b)=>(a.court||'').localeCompare(b.court||'')).map(x=>`<option value="${x.id}"${c.pj===x.id?' selected':''}>${esc(x.court)}</option>`).join('')}</select>`:ro(c.pj&&S.chars[c.pj]?esc(S.chars[c.pj].court):'—')}</div>`}</div>`;
  if(g.own!==undefined){const np=S.players[g.own];h+=`<div class="confirm2"><div><b>Confier ${esc(c.court)} à ${np?esc(np.nom):'personne'} ?</b></div><div class="muted small">${ow.length?esc(ow.map(p=>p.nom).join(', '))+' ne le verra plus dans ses personnages.':''}${np?' '+esc(np.nom)+' pourra le modifier.':' Le personnage n\'aura plus de joueur.'}</div><div class="actions"><button class="btn ghost" data-act="ownNo">Annuler</button><button class="btn pri" data-act="ownOk">Confirmer</button></div></div>`;}
  let o='';
  if(ed)o+=opt('Masquer aux autres',`<button class="tgb" data-act="cHide" data-id="${c.id}" role="switch" aria-checked="${!!c.cache}" aria-label="Masquer aux autres"><span class="tg${c.cache?' on':''}"></span></button>`);
  if(ed&&c.type==='PJ')o+=opt('Exclure de la moyenne d\'XP',`<button class="tgb" data-act="cMoy" data-id="${c.id}" role="switch" aria-checked="${!!c.horsMoyenne}" aria-label="Exclure de la moyenne d'XP"><span class="tg${c.horsMoyenne?' on':''}"></span></button>`);
  if(canPortrait(c))o+=opt('Portrait',`<span style="display:flex;gap:6px"><label class="btn ghost" style="cursor:pointer">Changer<input type="file" accept="image/*" data-ptrfile="${c.id}" hidden></label>${own?`<button class="btn ghost" data-act="ptrDel" data-id="${c.id}">Retirer</button>`:''}</span>`);
  if(o)h+=`<div class="grp2">Options</div>${o}`;
  h+=`<div class="actions" style="margin-top:12px"><button class="btn pri" data-act="pcSheetGo" data-id="${c.id}">Ouvrir la fiche ›</button></div>`;
  if(G)h+=`<div class="danger2"><span>Zone sensible</span><button class="lnk-bad" data-act="cDel" data-id="${c.id}">Supprimer le personnage</button></div>`;
  return h+`</div></div>`;}
function newPSheet(){return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Nouveau joueur"><div class="in"><div class="shd"><h2>Nouveau joueur</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div><div class="frow"><div class="field"><label for="np-n">Nom</label><input id="np-n" type="text" data-np="nom" value="${esc(S.newP.nom)}"></div><div class="field"><label for="np-r">Rôle</label><select id="np-r" data-np="role">${['Joueur','MJ'].map(r=>`<option${S.newP.role===r?' selected':''}>${r}</option>`).join('')}</select></div></div><div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="addP">Ajouter</button></div></div></div>`;}
function newCSheet(){const pl=playersSorted().filter(p=>!p.parti),G=isGest();if(!G&&!S.newC.owner)S.newC.owner=ME||'';
  return `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Nouveau personnage"><div class="in"><div class="shd"><h2>Nouveau personnage</h2><button class="x" data-act="closeSheet" aria-label="Fermer">✕</button></div><div class="frow"><div class="field"><label for="nc-c">Nom court</label><input id="nc-c" type="text" data-nc="court" value="${esc(S.newC.court)}"></div><div class="field"><label for="nc-n">Nom complet</label><input id="nc-n" type="text" data-nc="nom" value="${esc(S.newC.nom)}"></div><div class="field"><label for="nc-t">Type</label><select id="nc-t" data-nc="type"><option value="PJ"${S.newC.type==='PJ'?' selected':''}>PJ</option><option value="PNJ"${S.newC.type==='PNJ'?' selected':''}>PNJ</option></select></div><div class="field"><label for="nc-o">Joueur</label>${G?`<select id="nc-o" data-nc="owner"><option value="">— aucun —</option>${pl.map(p=>`<option value="${p.id}"${S.newC.owner===p.id?' selected':''}>${esc(p.nom)}</option>`).join('')}</select>`:`<div class="ro2">${esc((S.players[ME]||{}).nom||'—')}</div>`}</div></div><div class="muted small" style="margin-bottom:8px">La fiche démarre à zéro. L'assistant de création remplacera bientôt ce formulaire.</div><div class="actions"><button class="btn ghost" data-act="closeSheet">Annuler</button><button class="btn pri" data-act="addC">Créer</button></div></div></div>`;}
function viewRules(){
  const rows=[['Féerie',`(niveau suivant) × ${RULES.feerie}`],['Masque',`(niveau suivant) × ${RULES.masque}`],['Tricherie','moyenne Féerie/Masque, arrondie à l\'inférieur (calculée)'],['Caractéristique',`(niveau suivant) × ${RULES.carac}, sauf 1→2 qui coûte ${RULES.carac12}`],['Compétence',`(niveau suivant) × ${RULES.comp}`],['Compétence futile',`(niveau suivant) × ${RULES.fut}`],['Fortune',`(niveau suivant) × ${RULES.fortune} ; le détail donne la situation, l\'argent de poche, l\'argent disponible par mois et le modificateur de Classe et Entregent. Dépenser plus du double du mois en moins de deux mois fait perdre un rang`],['Atout féerique',`${RULES.atout} points par atout. Chaque race propose 4 atouts, plus « Spécialités typiques » qui offre les 2 spécialités typiques de la race (ou 2 spécialités à choisir). Le compteur affiche acquis / listés (un atout ajouté à la main compte dans les listés). Pas d'atout pour les humains`],['Spécialité',`${RULES.spec} points (${RULES.mauvaiseMain} pour Mauvaise main, ${RULES.specFut} pour une compétence futile). Elle se rattache à une compétence (à un profil pour un PNJ), donne +1 et ne demande aucun rang ; * = obligatoire pour agir dans ce domaine. Tant que des spécialités comptées restent à rattacher, en choisir une est gratuit`],['Points de personnage (PP)','atteindre le rang N d\'un profil ajoute N PP sur ce profil (automatique depuis le 16/11/2026). Toucher « PP » pour en dépenser : la dépense est inscrite dans l\'historique des achats et peut être annulée'],['Profil d\'un PNJ',`(niveau suivant) × ${RULES.prof}, soit quatre compétences à la fois`],['Rang de profil (PJ)','moyenne arrondie à l\'inférieur des quatre compétences'],['Masque et résistances','+1 de résistance physique et psychique par niveau de Masque au-delà de 5'],['Palier Profond',`Féerie ${STAGES[0].feerie}, une caractéristique ${STAGES[0].carac}, une compétence ${STAGES[0].comp}, ${STAGES[0].atout} atouts féeriques`],['Palier Légendaire',`Féerie ${STAGES[1].feerie}, une caractéristique ${STAGES[1].carac}, une compétence ${STAGES[1].comp}, ${STAGES[1].atout} atouts féeriques (après Profond)`],['Caractéristique accrue','une seule par personnage : +1 au score, au-delà du maximum (ex. Esprit 6/9 devient 7/10). Le coût d\'évolution et les paliers Profond et Légendaire se calculent sur la base, sans le bonus. Se coche dans le détail de la caractéristique'],['Paliers : éligibilité',`seules les compétences dont le niveau max est de ${PALIER_MAX} ou plus comptent pour Profond et Légendaire`],['Autres dépenses','Domaine, Triche, PNJ : montant libre, sans maximum ni évolution'],['Rang d\'héritage','une étoile par gain de type Scénario (30 au maximum), corrigeable à la main'],['Secrets de l\'univers','titre +1, indice +1, vérité mineure +2, vérité majeure +3 ; +4 quand toutes les vérités majeures d\'un secret sont découvertes. XP de nature Groupe pour tous les PJ actifs, inscrite au journal d\'XP (type « Secret de l\'univers »)'],['Créatures de l\'univers','+1 quand toutes nos connaissances sur un type de créature sont réunies (case cochée). XP de nature Groupe pour tous les PJ actifs, inscrite au journal d\'XP (type « Créature de l\'univers »)'],['Sessions de jeu','chaque gain d\'XP est saisi dans une session (type, intitulé, date) ; les secrets et créatures peuvent y être rattachés. Une session ne peut être supprimée tant que des découvertes y sont rattachées'],['Part des PNJ','PNJ rattaché à un PJ : 50 % des gains du PJ dans la session s\'il a participé activement, 25 % sinon, arrondi à l\'inférieur ; sessions datées à partir du rattachement'],['Planning','chaque joueur coche ses disponibilités en journée et en soirée ; créneaux préférés : samedi soir et dimanche journée. « Prochaines dates » : dates validées, créneaux où toute la table est libre, dates proposées que chacun accepte ou décline ; la prochaine date validée s\'affiche sur l\'accueil. Si un MJ décline une proposition, elle est refusée et ne peut pas être validée. Des créneaux consécutifs libres pour toute la table (par exemple samedi soir et dimanche journée) forment une seule date'],['Alerte de gains','PJ actif dont le total est inférieur d\'au moins '+GAP+' XP à la moyenne du groupe'],['Rattrapage d\'XP','sur la ligne d\'un PJ en alerte, la flèche ↑ ouvre une attribution pré-remplie (type Autre, nature Individuel, date du jour) du nombre d\'XP qui le ramène au total du PJ juste devant. Rien n\'est attribué automatiquement, tout reste modifiable. Hors session de jeu, sans part pour les PNJ rattachés']];
  return `<h2 style="margin-top:4px">Règles appliquées</h2><div class="card">${rows.map(r=>`<div class="ev"><div class="t" style="min-width:140px">${esc(r[0])}</div><div class="muted" style="text-align:right">${esc(r[1])}</div></div>`).join('')}</div>
  <div class="muted small" style="margin-top:12px">Ces valeurs viennent de l'écran Paramètres${isGest()?'':', modifiable par les personnes ayant les droits de gestion'}.</div><div class="actions" style="margin-top:8px"><button class="btn" data-act="tab" data-v="params">Paramètres ›</button></div><div class="actions" style="margin-top:12px"><button class="btn ghost" data-act="logout">Changer de code (se déconnecter)</button></div>`;
}


/* Fiche : effets de race et d'atouts (moteur de bonus) */
function fxCard(c,L,fm){if(!L.length)return '';
  const note=c.fx?`Acquis d'office avec la race ${esc(c.race)}${L.some(e=>e.kind==='at')?' et les atouts pris':''}.${L.some(e=>e.quand!=='tj')?' Les effets qui ne s\'appliquent pas à la forme choisie sont grisés.':''}`:`À titre d'information : ce personnage a été créé avant le moteur de bonus. La gestion peut l'y faire entrer depuis Paramètres › Bonus.`;
  return `<h2>Effets de race et d'atouts</h2><div class="card"><div class="muted small" style="margin-bottom:4px">${note}</div>${L.map(e=>`<div class="fxe${fxOn(e,fm)?'':' off'}">${fxChip(e)} <b>${esc(e.src)}</b><div class="s">${FX_KIND[e.kind]} · ${FX_Q[e.quand]}${e.t!=='rap'&&e.txt?' · '+esc(e.txt):''}${e.t==='jet'?' · non ajouté aux rangs':e.t==='perm'&&c.fx?(fxInteg(e)?' · compris dans la valeur enregistrée':' · ajouté à la valeur affichée'):''}</div></div>`).join('')}</div>`;}
