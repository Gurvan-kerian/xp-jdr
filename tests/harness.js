/* Charge le code de l'appli dans un contexte Node (sans navigateur) pour tester le moteur, le modèle et les migrations. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const FILES=['config','engine','modele','migrations','core','univers','donnees'];
function loadApp(dir,files){
  const noop=()=>{},el=null;
  const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,Date,Math,JSON,
    window:{},navigator:{},history:{replaceState:noop},location:{hash:'',pathname:'/',search:''},
    localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},
    document:{addEventListener:noop,getElementById:()=>el,querySelector:()=>el,querySelectorAll:()=>[],hidden:false,
      documentElement:{setAttribute:noop,getAttribute:()=>null},body:{classList:{toggle:noop}},activeElement:null}};
  vm.createContext(ctx);
  for(const f of files||FILES){const p=path.join(dir,'js',f+'.js');if(!fs.existsSync(p))continue;vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});}
  /* pas de rendu ni d'écriture réelle en test */
  vm.runInContext('render=function(){};persist=function(p,d){(globalThis.__writes=globalThis.__writes||[]).push([p,d]);};',ctx);
  return {ctx,run:code=>vm.runInContext(code,ctx)};}
/* Met des documents (format Supabase coll/id → data) dans l'état S de l'appli */
function setDocs(app,docs){app.ctx.__docs=docs;app.run(`(()=>{const D=__docs;S.chars={};S.players={};
  for(const k in D){const [c,id]=k.split('/');if(c==='chars')S.chars[id]=normNoms(JSON.parse(JSON.stringify(D[k])));if(c==='players')S.players[id]=D[k];}
  S.races=(D['meta/races']||{}).byId||{};S.pouvoirs=(D['meta/pouvoirs']||{}).byId||{};S.capacites=(D['meta/capacites']||{}).byId||{};
  S.creatures=(D['meta/creatures']||{}).list||[];S.events=(D['gains/all']||{}).events||[];S.secretsDoc=D['meta/secrets']||null;S.secrets=(D['meta/secrets']||{}).list||[];
  S.params=D['meta/params']||{versions:[]};S.schema=D['meta/schema']||null;S.signalDoc=D['meta/signalements']||null;
  S.ready=S.racesReady=S.pouvoirsReady=S.creaturesReady=S.secretsReady=S.paramsReady=S.schemaReady=S.capReady=S.eventsReady=S.playersReady=true;
  S.schemaV=(S.schema&&S.schema.v)||0;if(typeof applyParams==='function')applyParams();rebuildRaces();})()`);}
/* Photographie, pour chaque personnage, de tout ce que le moteur calcule */
function charMetrics(app){return app.run(`(()=>{const out={};for(const c of Object.values(S.chars)){const L=fxOf(c);
  out[c.id]={m:derived(c,'m').map(x=>x[0]+'='+x[1]),d:derived(c,'d').map(x=>x[0]+'='+x[1]),
    fx:L.map(e=>e.kind+'|'+e.src+'|'+fxLabel(e)+'|'+fxQ(e.quand)).sort(),
    vals:JSON.stringify([c.carac,c.feerie,c.masque,c.fortune,(c.profils||[]).map(p=>[p.nom,(p.comps||[]).map(x=>x.cur),p.cur])]),
    pw:(c.pw||[]).map(o=>o.i+':'+pwFull(raceRecOf(c),o.i)),sum:JSON.stringify(summary(c,S.events))};}return out;})()`);}
module.exports={loadApp,setDocs,charMetrics};
