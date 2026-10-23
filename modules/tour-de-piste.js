/* Learning IFR — Pratique : tour de piste sur planche de bord.
   Valeurs indicatives (DR400-120, vitesses en km/h) : à adapter à la check-list du club et au manuel de vol.
   Pour ajouter un avion : LI.sim.registerPanel({...}) puis un bloc {sim:{panel, scenario}}. */
(function(){
const SIM=LI.sim;

/* ================= Planche Robin DR400-120 ================= */
SIM.registerPanel({
 id:'dr400', name:'Robin DR400-120', vb:[1000,540],
 init:{throttle:'reduit',flaps:0,carb:'froid',mixture:'riche',pump:false,lights:false,nav:true,strobe:true,batt:true,alt:true,xpdr:'STBY',fuel:'PR',mags:'2'},
 elements:[
  {type:'map',x:20,y:18,w:200,h:170,rwy:[70,140,130],qfuL:'33',qfuR:'15',
   wp:[[74,140],[100,140],[128,140],[152,140],[176,124],[180,50],[164,32],[74,32],[42,32],[24,50],[22,122],[38,140],[56,140],[80,140],[118,140]]},
  {type:'asi',z:'asi',label:'Anémomètre',x:310,y:108,r:72,min:40,max:320,unit:'KM/H',white:[85,170],green:[105,260],yellow:[260,308],red:308},
  {type:'ai',z:'ai',label:'Horizon artificiel',x:470,y:108,r:72},
  {type:'alt',z:'altim',label:'Altimètre',x:630,y:108,r:72},
  {type:'tc',z:'tc',label:'Bille-aiguille',x:310,y:272,r:72},
  {type:'dg',z:'dg',label:'Conservateur de cap',x:470,y:272,r:72},
  {type:'vsi',z:'vsi',label:'Variomètre',x:630,y:272,r:72},
  {type:'tach',z:'tach',label:'Compte-tours',x:780,y:108,r:60,green:[2000,2800],red:2800},
  {type:'radio',z:'radio',label:'Radio',x:858,y:42,w:128,h:52,freq:'123.500'},
  {type:'xpdr',z:'xpdr',label:'Transpondeur',x:858,y:122,w:128,h:52,code:'7000'},
  {type:'gauge',z:'oilT',label:'T° HUILE',x:752,y:258,r:30,green:[.3,.75],val:st=>.3+Math.min(.35,st.rpm/7000)},
  {type:'gauge',z:'oilP',label:'P HUILE',x:822,y:258,r:30,green:[.35,.8],val:st=>.2+Math.min(.5,st.rpm/4600)},
  {type:'gauge',z:'fuelP',label:'P ESS.',x:892,y:258,r:30,green:[.3,.8],val:st=>st.ctl.pump?.68:.5},
  {type:'gauge',z:'fuelQ',label:'CARBU',x:962,y:258,r:30,green:[.25,1],val:()=>.72},
  {type:'selector',z:'fuel',label:'Robinet essence',zl:'le robinet d\'essence',x:85,y:262,r:26,pos:{F:-90,PR:0,AUX:90}},
  {type:'selector',z:'mags',label:'Magnétos',zl:'les magnétos',x:180,y:262,r:24,pos:{G:-40,D:0,'2':40}},
  {type:'stick',z:'stick',label:'Manche',zl:'le manche',x:95,y:400},
  {type:'rocker',z:'batt',label:'BATT',zl:'la batterie',x:232,y:382},
  {type:'rocker',z:'alt',label:'ALTER',zl:"l'alternateur",x:290,y:382},
  {type:'rocker',z:'pump',label:'POMPE',zl:'la pompe électrique',x:348,y:382},
  {type:'rocker',z:'lights',label:'PHARES',zl:'les phares',x:406,y:382},
  {type:'rocker',z:'nav',label:'NAV',zl:'les feux de navigation',x:464,y:382},
  {type:'rocker',z:'strobe',label:'ANTICOL',zl:"l'anticollision",x:522,y:382},
  {type:'throttle',z:'throttle',label:'GAZ',zl:'la manette des gaz',x:640,y:372,h:120},
  {type:'knob',z:'carb',label:'RÉCHAUF.',zl:'le réchauffage carburateur',x:745,y:380,pulled:'chaud',states:{chaud:'CHAUD',froid:''}},
  {type:'knob',z:'mixture',label:'MÉLANGE',zl:'le mélange',x:815,y:380,pulled:'pauvre',color:'#C9302C',states:{riche:'RICHE',pauvre:'PAUVRE'}},
  {type:'trim',z:'trim',label:'TRIM',zl:'le compensateur',x:720,y:452,w:120,h:40},
  {type:'flaps',z:'flaps',label:'VOLETS',zl:'les volets',x:930,y:376,h:110},
  {type:'label',x:385,y:362,text:'ÉLECTRICITÉ'}
 ]});

/* ================= Phases communes ================= */
const W={
 align:{id:'align',name:'Alignement',leg:'Piste 33',cue:'Aligné piste 33, autorisé au décollage. Check avant décollage puis plein gaz.',dur:0,win:15,
  actions:[
   {c:'lights',set:true,label:'Phares ON',why:'Être vu au décollage et en montée initiale.'},
   {c:'xpdr',set:'ALT',label:'Transpondeur ALT',why:"Le contrôle et le TCAS des autres avions voient ton altitude."},
   {c:'pump',set:true,label:'Pompe électrique ON',why:"Secours de la pompe mécanique pendant la phase critique du décollage."},
   {c:'flaps',set:1,label:'Volets 1er cran (décollage)',why:'Configuration décollage du DR400.'},
   {c:'carb',check:'froid',label:'Réchauffage carbu froid (vérifier)',why:"Chaud, il fait perdre de la puissance au décollage."},
   {c:'mixture',check:'riche',label:'Mélange plein riche (vérifier)',why:'Pleine puissance et refroidissement du moteur.'},
   {c:'throttle',set:'plein',label:'Plein gaz',why:'Mise en puissance progressive mais franche.'}]},
 roll:{id:'roll',name:'Roulement',leg:'Piste 33',cue:'Contrôle des paramètres pendant l\'accélération.',dur:7,to:{ias:100,pos:1},
  actions:[
   {c:'tach',check:true,label:'Tours moteur (≈ 2300 tr/min)',why:'Si la puissance n\'est pas là, on interrompt le décollage.'},
   {c:'asi',check:true,label:'Anémomètre actif',why:'Un badin qui ne bouge pas impose d\'interrompre le décollage.'}]},
 rot:{id:'rot',name:'Rotation',leg:'Montée initiale',cue:'100 km/h : rotation, puis montée à 130 km/h.',dur:8,to:{ias:130,agl:300,vs:600,pos:2.4},win:6,
  actions:[{c:'stick',label:'Rotation : cabrer',why:'Rotation vers 100 km/h, assiette de montée.'}]},
 p300:{id:'p300',name:'300 ft sol',leg:'Montée initiale',cue:'Tu passes 300 ft sol (760 ft QNH).',dur:6,to:{agl:500,ias:145,vs:650,pos:3},
  actions:[{c:'flaps',set:0,label:'Volets rentrés',why:"Hauteur suffisante en cas de panne : on lisse l'avion pour la montée."}]},
 p500:{id:'p500',name:'500 ft sol',leg:'Virage vent traversier',cue:'500 ft sol : virage en vent traversier.',dur:9,to:{agl:720,hdg:240,pos:4.6,vs:600},
  actions:[
   {c:'pump',set:false,label:'Pompe électrique OFF',why:'Puis vérifier que la pression d\'essence reste dans le vert.'},
   {c:'fuelP',check:true,label:'Pression essence (vérifier)',why:'Confirme que la pompe mécanique alimente seule.'},
   {c:'trim',label:'Compenser',why:'Soulage le manche en montée stabilisée.'}]},
 xw:{id:'xw',name:'Vent traversier',leg:'Vent traversier',cue:'Montée vers la hauteur du tour de piste, virage en vent arrière.',dur:9,to:{agl:1000,hdg:150,pos:6,vs:400}},
 lvl:{id:'lvl',name:'1000 ft sol : palier',leg:'Vent arrière',cue:'Hauteur du tour de piste atteinte (1460 ft QNH) : mise en palier.',dur:6,to:{agl:1000,ias:170,vs:0,pos:6.5},
  actions:[
   {c:'throttle',set:'palier',label:'Réduire à la puissance de palier',why:'Laisser l\'avion accélérer en palier puis afficher ≈ 2250 tr/min.'},
   {c:'trim',label:'Compenser',why:'Avion compensé en palier : tu as les mains libres pour la check-list.'}]},
 dw:{id:'dw',name:'Vent arrière',leg:'Vent arrière',cue:'Annonce radio, puis check-list pré-atterrissage.',dur:12,to:{pos:7,ias:170},
  actions:[
   {c:'radio',label:'Annonce vent arrière',say:'F-GLIF, vent arrière piste 33 pour un complet.',why:'Les autres avions te situent dans le circuit.'},
   {c:'pump',set:true,label:'Pompe électrique ON',why:'Secours pour l\'approche et une éventuelle remise de gaz.'},
   {c:'carb',set:'chaud',label:'Réchauffage carbu chaud',why:'Avant la réduction : le givrage carburateur menace à faible puissance.'},
   {c:'mixture',check:'riche',label:'Mélange plein riche (vérifier)',why:'Pleine puissance disponible pour une remise de gaz.'},
   {c:'fuel',check:true,label:'Robinet essence sur principal (vérifier)',why:"On n'atterrit pas sur un réservoir presque vide."},
   {c:'lights',check:true,label:'Phares ON (vérifier)'}]},
 abeam:{id:'abeam',name:'Travers seuil',leg:'Vent arrière',cue:'Travers du seuil de piste : début de la descente.',dur:7,to:{pos:8,ias:150,agl:900,vs:-300},
  actions:[
   {c:'throttle',set:'approche',label:'Réduire (≈ 1700 tr/min)',why:'Début de la descente au travers du seuil.'},
   {c:'flaps',set:1,label:'Volets 1er cran',why:'Sous la VFE, pour descendre à 150 km/h.'},
   {c:'trim',label:'Compenser',why:'Nouvelle vitesse, nouvelle compensation.'}]},
 base:{id:'base',name:'Étape de base',leg:'Étape de base',cue:'Virage en étape de base, descente à 150 km/h.',dur:9,to:{pos:10,hdg:60,agl:650,ias:150,vs:-400},
  actions:[{c:'radio',label:'Annonce étape de base',say:'F-GLIF, base piste 33.',why:'Information des autres usagers.'}]},
 final:{id:'final',name:'Finale',leg:'Finale',cue:'Aligné en finale, plan de descente stabilisé.',dur:10,to:{pos:11.6,hdg:330,agl:300,ias:130,vs:-450},
  actions:[
   {c:'flaps',set:2,label:'Volets atterrissage',why:'Configuration finale : plus de traînée, pente plus forte.'},
   {c:'radio',label:'Annonce finale',say:'F-GLIF, finale piste 33 pour un complet.'},
   {c:'asi',check:true,label:'Vitesse finale 130 km/h (vérifier)',why:'Approche stabilisée : la vitesse est tenue au plus près.'},
   {c:'trim',label:'Compenser'}]},
 short:{id:'short',name:'Courte finale',leg:'Courte finale',cue:'Courte finale, 200 ft sol.',dur:7,to:{pos:12.6,agl:20,ias:120,vs:-400},
  actions:[{c:'carb',set:'froid',label:'Réchauffage carbu froid',why:'Toute la puissance est disponible si tu dois remettre les gaz.'}]},
 flare:{id:'flare',name:'Arrondi',leg:'Arrondi',cue:'Quelques mètres au-dessus de la piste : arrondi.',dur:5,to:{pos:13,agl:0,ias:95,vs:-60,pitch:6},
  actions:[
   {c:'throttle',set:'reduit',label:'Réduction totale',why:'Gaz réduits avant le toucher.'},
   {c:'stick',label:'Arrondi : cabrer progressivement',why:'On casse le plan de descente et on laisse la vitesse diminuer.'}]},
 roll2:{id:'roll2',name:'Après l\'atterrissage',leg:'Dégagement',cue:'Posé. Freinage, piste dégagée : check-list après atterrissage.',dur:8,to:{pos:14,ias:15,vs:0,pitch:0},
  actions:[
   {c:'flaps',set:0,label:'Volets rentrés'},
   {c:'pump',set:false,label:'Pompe électrique OFF'},
   {c:'lights',set:false,label:'Phares OFF',why:'Selon la pratique du club au roulage.'}]}
};

/* Remise de gaz : départ en vent arrière */
const GA=[
 {...W.dw},{...W.abeam},{...W.base},{...W.final},
 {id:'ga',name:'Remise de gaz',leg:'Remise de gaz',cue:'Avion sur la piste à 300 ft : remise de gaz !',dur:6,to:{pos:12.2,agl:380,ias:125,vs:300,pitch:7},win:6,
  actions:[
   {c:'throttle',set:'plein',label:'Plein gaz',why:'Premier geste, immédiat.'},
   {c:'carb',set:'froid',label:'Réchauffage carbu froid',why:'Sinon tu n\'as pas toute la puissance.'},
   {c:'stick',label:'Assiette de montée',why:'Arrêter la descente sans dépasser l\'assiette de montée.'},
   {c:'flaps',set:1,label:'Volets 1er cran (décollage)',why:'On réduit la traînée, sans tout rentrer d\'un coup près du sol.'}]},
 {id:'ga2',name:'Montée après remise de gaz',leg:'Montée',cue:'Vario positif, 130 km/h, 300 ft au-dessus du sol.',dur:8,to:{pos:14,agl:650,ias:140,vs:600},
  actions:[
   {c:'flaps',set:0,label:'Volets rentrés',why:'Vitesse et hauteur suffisantes : configuration lisse.'},
   {c:'radio',label:'Annonce remise de gaz',say:'F-GLIF, remise de gaz, je reprends le circuit.'},
   {c:'trim',label:'Compenser'}]}
];

const TDP={title:'Tour de piste DR400',intro:'Du check avant décollage au dégagement de piste, terrain à 460 ft, circuit main gauche à 1000 ft sol.',
 elev:460,qnh:1013,qfu:330,phases:['align','roll','rot','p300','p500','xw','lvl','dw','abeam','base','final','short','flare','roll2'].map(k=>W[k])};
const RDG={title:'Remise de gaz DR400',intro:'Départ en vent arrière, approche normale, puis remise de gaz à 300 ft en finale.',
 elev:460,qnh:1013,qfu:330,phases:GA,
 init:{vars:{agl:1000,ias:170,vs:0,hdg:150,pos:6.5},ctl:{throttle:'palier',lights:true,xpdr:'ALT'}}};

const head=`<p>Valeurs indicatives pour un DR400-120. Ta check-list club et le manuel de vol priment : adapte-les si ton aéroclub procède autrement.</p>
<h3>Vitesses (km/h)</h3><dl>
<dt>Rotation</dt><dd>100</dd><dt>Montée initiale</dt><dd>130 (volets décollage)</dd><dt>Montée</dt><dd>145 (lisse)</dd>
<dt>Vent arrière</dt><dd>170 (≈ 2250 tr/min)</dd><dt>Base</dt><dd>150 (1er cran)</dd><dt>Finale</dt><dd>130 (volets atterrissage)</dd><dt>Courte finale</dt><dd>120</dd>
</dl><h3>Hauteurs</h3><dl><dt>Terrain</dt><dd>460 ft</dd><dt>300 ft sol</dt><dd>760 ft QNH</dd><dt>Tour de piste</dt><dd>1000 ft sol = 1460 ft QNH</dd></dl>`;

LI.register({id:'tdp',code:'TDP',kind:'pratique',title:'Tour de piste',
 intro:'Planche de bord animée : touche les commandes au bon moment pour ancrer les automatismes.',
 blocks:[
  {id:'tdp-dr400',title:'DR400 · tour de piste complet',sim:{panel:'dr400',scenario:TDP},memo:SIM.memo(TDP,head)},
  {id:'tdp-dr400-rdg',title:'DR400 · remise de gaz',sim:{panel:'dr400',scenario:RDG},memo:SIM.memo(RDG,head)}
 ]});
})();
