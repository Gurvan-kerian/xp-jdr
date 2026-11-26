/* Correctif du 26/11/2026 : contacts reliés aux PNJ.
   Usage : node tests/contacts.test.js — données inventées, sans navigateur.
   Rattachement par nom (majuscules, accents, surnom), plusieurs correspondances, PNJ préparé, « Rattacher » / « Détacher »,
   création du PNJ à la volée (achat en PP, gain en jeu, jauge, allié), PJ liés sur la fiche du PNJ, validation d'une création. */
const path=require('path');
const {loadApp,setDocs}=require('./harness.js');
const ROOT=path.join(__dirname,'..');
let fails=0;const ok=(c,m)=>{if(c)console.log('  ✓ '+m);else{fails++;console.log('  ✗ '+m);}};
const app=loadApp(ROOT,['config','engine','modele','migrations','core','vues','univers','fiches','chronique','referentiel','parametres','donnees','pouvoirs','planning']),r=c=>app.run(c);
const ch=(id,court,type,o)=>({...r(`newChar(${JSON.stringify(id)},${JSON.stringify(court)},${JSON.stringify(court)},${JSON.stringify(type)})`),...o});
const ppA=(id,prec,o)=>({id,date:'2026-11-26',label:'PP',cout:0,key:'pp:Mondain',pp:1,ppel:{id:'el',prof:'Mondain',rub:'C',nom:'Contact humain',opt:'',...(prec?{prec}:{}),...o}});
setDocs(app,{'meta/schema':{v:2},
  'players/mj':{id:'mj',nom:'MJ',role:'MJ',persos:[]},'players/alice':{id:'alice',nom:'Alice',role:'Joueur',persos:['kerian']},
  'chars/kerian':ch('kerian','Kerian','PJ',{race:'Humain',achats:[ppA('a1','caleis frédon'),ppA('a2','La Rose'),ppA('a3','Jean Martin'),ppA('a4','Armand'),ppA('a5','Inconnu Total')]}),
  'chars/caleis':ch('caleis','Caléïs Frédon','PNJ',{rang:'Cador'}),
  'chars/rose':ch('rose','Hortense Vallier','PNJ',{surnom:'La Rose'}),
  'chars/jm1':ch('jm1','Jean Martin','PNJ',{}),'chars/jm2':ch('jm2','Jean Martin','PNJ',{}),
  'chars/armand':ch('armand','Armand','PNJ',{vis:'prep',eye:{}}),
  'gains/all':{events:[]}});
r(`toast=function(){};confirm=function(){return true;};S.fiches={};S.fichesReady=true;`);
const R=()=>JSON.parse(r(`JSON.stringify(relsOf(S.chars.kerian).filter(x=>x.src==='pp'))`));
const pnjOf=aid=>(R().find(x=>x.aid===aid)||{}).pnj;

console.log('1. Rattachement par nom');
ok(pnjOf('a1')==='caleis','majuscules et accents ignorés : « caleis frédon » → Caléïs Frédon');
ok(pnjOf('a2')==='rose','surnom : « La Rose » → Hortense Vallier');
ok(!pnjOf('a3'),'deux PNJ « Jean Martin » : pas de rattachement automatique');
ok(!pnjOf('a5'),'aucun PNJ : texte');
r(`ME='alice';S.edit=false;S.visit=false;`);
{const h=r(`viewRelations(S.chars.kerian)`);
  ok(/data-act="relPP" data-id="a3"[^>]*>Rattacher/.test(h)&&/data-act="relPP" data-id="a5"[^>]*>Rattacher/.test(h),'joueur du PJ : bouton « Rattacher » sur les contacts non reliés');
  ok(/data-t="perso"[^>]*data-id="caleis"|caleis/.test(h)&&/Cador/.test(h),'contact relié : lien vers la fiche, rang repris');
  ok(!/>Armand</.test(h.replace(/<b>Armand<\/b>/,''))&&/<b>Armand<\/b>/.test(h),'PNJ préparé : texte seul pour le joueur');}
ok(/Kerian/.test(r(`pnRel(S.chars.caleis)`))&&/\(PP\)/.test(r(`pnRel(S.chars.caleis)`)),'fiche du PNJ : Kerian dans « PJ liés » (PP)');

console.log('2. Rattacher, détacher, créer depuis un contact PP');
r(`S.sel='kerian';shCharAct('relPP',{id:'a3'});S.dlg.f.pnj='jm2';shCharAct('relPPSave',{});`);
ok(pnjOf('a3')==='jm2'&&r(`S.chars.kerian.achats.find(a=>a.id==='a3').ppel.pnj`)==='jm2','« Rattacher » : choix enregistré dans l\'élément de PP');
r(`S.chars.jm2={...S.chars.jm2,nom:'Jean Martin dit le Borgne',court:'Le Borgne'};`);
ok(pnjOf('a3')==='jm2','rattachement gardé après renommage du PNJ');
r(`shCharAct('relPP',{id:'a1'});shCharAct('relPPDet',{});`);
ok(!pnjOf('a1'),'« Détacher » : plus de rattachement automatique');
r(`shCharAct('relPP',{id:'a5'});`);
ok(r(`S.dlg.f.pnj`)==='__new'&&r(`S.dlg.f.nnom`)==='Inconnu Total','sans correspondance : « Créer un nouveau PNJ » proposé, nom prérempli');
r(`shCharAct('relPPSave',{});`);
{const id=pnjOf('a5'),p=id&&JSON.parse(r(`JSON.stringify(S.chars[${JSON.stringify(id)}])`));
  ok(!!p&&p.type==='PNJ'&&p.nom==='Inconnu Total'&&p.race==='Humain'&&p.vis==='rev'&&r(`rangOf(S.chars[${JSON.stringify(id)}])`)==='Larbin','PNJ créé : nom seul, Humain, Larbin, révélé, et rattaché');}

console.log('3. Gain en jeu, jauge, allié : création du PNJ à la volée');
r(`shCharAct('relNew',{niv:'contact'});`);
ok(/value="__new"/.test(r(`shDlgSheet(S.dlg)`)),'fenêtre « Ajouter : contact » : option « + Créer un nouveau PNJ »');
r(`S.dlg.f.pnj='__new';`);ok(/Nom du nouveau PNJ/.test(r(`shDlgSheet(S.dlg)`)),'champ « Nom du nouveau PNJ » affiché');
r(`shCharAct('relNewSave',{});`);ok(/obligatoire/.test(r(`S.dlg.err`)),'nom vide refusé');
r(`S.dlg.f.nnom='Mme Ysolde';shCharAct('relNewSave',{});`);
{const rl=JSON.parse(r(`JSON.stringify((S.chars.kerian.rel||[]).map(x=>({niv:x.niv,nom:(S.chars[x.pnj]||{}).nom})))`));
  ok(rl.some(x=>x.niv==='contact'&&x.nom==='Mme Ysolde'),'gain en jeu : PNJ créé et ajouté aux Contacts');}
r(`shCharAct('relNew',{niv:'allie'});S.dlg.f.pnj='__new';S.dlg.f.nnom='Gaspard';shCharAct('relNewJ',{});`);
ok(/pas encore un contact/.test(r(`S.dlg.err`))&&!r(`Object.values(S.chars).some(c=>c.nom==='Gaspard')`),'jauge vers allié pour un nouveau PNJ : refusée, rien créé');
r(`S.dlg=null;shCharAct('relNew',{niv:'contact'});S.dlg.f.pnj='__new';S.dlg.f.nnom='Gaspard';S.dlg.f.taille='15';shCharAct('relNewJ',{});`);
ok(r(`(S.chars.kerian.rel||[]).some(x=>S.chars[x.pnj]&&S.chars[x.pnj].nom==='Gaspard'&&(x.jauges||[]).some(j=>j.obj==='contact'&&j.taille===15))`),'jauge vers contact : PNJ créé, jauge ouverte');
r(`shCharAct('relNew',{niv:'ennemi'});S.dlg.f.pnj='__new';S.dlg.f.nnom='Le Corbeau';shCharAct('relNewSave',{});`);
ok(r(`(S.chars.kerian.rel||[]).some(x=>x.niv==='ennemi'&&S.chars[x.pnj].nom==='Le Corbeau')`),'ennemi : PNJ créé et ajouté');

console.log('4. Achat en PP et validation d\'une création');
{r(`var X={rub:'C',prec:'Hortense Vallier'};ctcLinkX(X);var Y={rub:'C',prec:'Nouveau Venu'};ctcLinkX(Y);var Z={rub:'C',prec:'Jean Martin'};S.chars.jm2={...S.chars.jm2,nom:'Jean Martin',court:'Jean Martin'};ctcLinkX(Z);var W={rub:'A',prec:'Nouveau'};ctcLinkX(W);`);
  ok(r(`X.pnj`)==='rose','achat : contact relié au PNJ du même nom');
  ok(!!r(`Y.pnj&&S.chars[Y.pnj].nom==='Nouveau Venu'`),'achat : PNJ absent → fiche créée et reliée');
  ok(!r(`Z.pnj`)&&!r(`W.pnj`),'achat : plusieurs correspondances → non relié (Rattacher) ; autre rubrique ignorée');}

console.log(fails?`\n${fails} échec(s)`:'\nTout est vert');process.exit(fails?1:0);
