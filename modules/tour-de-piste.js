/* Learning IFR — Pratique : tour de piste sur planche de bord, à Toulouse-Lasbordes (LFCL).
   Valeurs indicatives (DR400-120, vitesses en km/h) : à adapter à la check-list du club, au manuel de vol et à la VAC en vigueur.
   Jetons dans les textes : {CS} indicatif complet (F-GLIF), {cs} indicatif abrégé (F-IF).
   Pour ajouter un avion : LI.sim.registerPanel({...}) puis un bloc {sim:{panel, scenario}}. */
(function(){
const SIM=LI.sim;

/* ================= Terrain : à vérifier sur la VAC LFCL en vigueur ================= */
const AD={station:'Lasbordes Tour',twr:'122.705',atis:'128.100',info:'Alpha',rwy:'33',elev:460,qnh:1018,wind:'300 degrés 8 nœuds',
 parking:'parking aéroclub',hold:"point d'attente piste 33",tdp:1000};
const TDPQ=AD.elev+AD.tdp, P300=AD.elev+300;

/* ================= Planche Robin DR400-120 ================= */
SIM.registerPanel({
 id:'dr400', name:'Robin DR400-120', vb:[1000,540],
 init:{throttle:'reduit',flaps:0,carb:'froid',mixture:'riche',pump:false,lights:false,nav:false,strobe:false,batt:false,alt:false,
  xpdr:'STBY',fuel:'F',mags:'OFF',brake:'serré',run:false,freq:AD.twr,qnh:1013},
 elements:[
  {type:'map',x:20,y:18,w:200,h:170,rwy:[70,140,130],qfuL:'33',qfuR:'15',
   wp:[[120,160],[84,160],[66,150],[74,140],[100,140],[128,140],[152,140],[176,124],[180,50],[164,32],[74,32],[42,32],[24,50],[22,122],[38,140],[56,140],[80,140],[118,140],[120,160]]},
  {type:'asi',z:'asi',label:'Anémomètre',zl:"l'anémomètre",x:310,y:108,r:72,min:40,max:320,unit:'KM/H',white:[85,170],green:[105,260],yellow:[260,308],red:308},
  {type:'ai',z:'ai',label:'Horizon artificiel',zl:"l'horizon artificiel",x:470,y:108,r:72},
  {type:'alt',z:'altim',label:'Altimètre',zl:"l'altimètre",x:630,y:108,r:72},
  {type:'tc',z:'tc',label:'Bille-aiguille',zl:'la bille-aiguille',x:310,y:272,r:72},
  {type:'dg',z:'dg',label:'Conservateur de cap',zl:'le conservateur de cap',x:470,y:272,r:72},
  {type:'vsi',z:'vsi',label:'Variomètre',zl:'le variomètre',x:630,y:272,r:72},
  {type:'tach',z:'tach',label:'Compte-tours',zl:'le compte-tours',x:780,y:108,r:60,green:[2000,2800],red:2800},
  {type:'radio',z:'radio',label:'Radio',zl:'la radio',x:858,y:42,w:128,h:52,freq:AD.twr},
  {type:'xpdr',z:'xpdr',label:'Transpondeur',zl:'le transpondeur',x:858,y:122,w:128,h:52,code:'7000'},
  {type:'gauge',z:'oilT',label:'T° HUILE',zl:'la température d\'huile',x:752,y:258,r:30,green:[.3,.75],val:st=>st.ctl.run?.32+Math.min(.3,st.rpm/8000):.12},
  {type:'gauge',z:'oilP',label:'P HUILE',zl:'la pression d\'huile',x:822,y:258,r:30,green:[.35,.8],val:st=>st.rpm<200?0:.42+Math.min(.3,st.rpm/9000)},
  {type:'gauge',z:'fuelP',label:'P ESS.',zl:'la pression d\'essence',x:892,y:258,r:30,green:[.3,.8],val:st=>st.ctl.fuel==='F'?0:st.ctl.pump?.68:st.ctl.run?.5:0},
  {type:'gauge',z:'fuelQ',label:'CARBU',zl:'la jauge carburant',x:962,y:258,r:30,green:[.25,1],val:st=>st.ctl.batt?.72:0},
  {type:'selector',z:'fuel',label:'Robinet essence',zl:"le robinet d'essence",x:85,y:262,r:26,pos:{F:-90,PR:0,AUX:90}},
  {type:'selector',z:'mags',label:'Magnétos',zl:'les magnétos',x:180,y:262,r:24,pos:{OFF:-80,G:-35,D:5,'2':45,'DÉM':90}},
  {type:'stick',z:'stick',label:'Manche',zl:'le manche',x:95,y:400},
  {type:'knob',z:'brake',label:'FREIN PARC',zl:'le frein de parc',x:190,y:400,pulled:'serré',color:'#E0B23A',states:{'serré':'SERRÉ',libre:''}},
  {type:'rocker',z:'batt',label:'BATT',zl:'la batterie',x:242,y:382},
  {type:'rocker',z:'alt',label:'ALTER',zl:"l'alternateur",x:298,y:382},
  {type:'rocker',z:'pump',label:'POMPE',zl:'la pompe électrique',x:354,y:382},
  {type:'rocker',z:'lights',label:'PHARES',zl:'les phares',x:410,y:382},
  {type:'rocker',z:'nav',label:'NAV',zl:'les feux de navigation',x:466,y:382},
  {type:'rocker',z:'strobe',label:'ANTICOL',zl:"l'anticollision",x:522,y:382},
  {type:'throttle',z:'throttle',label:'GAZ',zl:'la manette des gaz',x:640,y:372,h:120},
  {type:'knob',z:'carb',label:'RÉCHAUF.',zl:'le réchauffage carburateur',x:745,y:380,pulled:'chaud',states:{chaud:'CHAUD',froid:''}},
  {type:'knob',z:'mixture',label:'MÉLANGE',zl:'le mélange',x:815,y:380,pulled:'pauvre',color:'#C9302C',states:{riche:'RICHE',pauvre:'ÉTOUFFOIR'}},
  {type:'trim',z:'trim',label:'TRIM',zl:'le compensateur',x:720,y:452,w:120,h:40},
  {type:'flaps',z:'flaps',label:'VOLETS',zl:'les volets',x:930,y:376,h:110},
  {type:'label',x:410,y:362,text:'ÉLECTRICITÉ'}
 ]});

const magCheck=(ctl,st)=>{ctl.mags='G';st.rpmDrop=performance.now()+800;
 setTimeout(()=>{ctl.mags='D';st.rpmDrop=performance.now()+800},900);setTimeout(()=>{ctl.mags='2'},1800)};
const ATIS=`Lasbordes, information ${AD.info}. Piste en service ${AD.rwy}. Vent ${AD.wind}. CAVOK. Température 15, point de rosée 8. QNH ${AD.qnh}. Accusez réception de l'information ${AD.info} au premier contact.`;

/* ================= Phases ================= */
const W={
 /* ---- au sol ---- */
 avmr:{id:'avmr',name:'Avant mise en route',leg:'Parking',cue:`Au ${AD.parking}, verrière fermée, harnais bouclés. Check avant mise en route.`,dur:0,win:30,
  actions:[
   {c:'fuel',set:'PR',label:'Robinet essence sur principal',why:'Sans essence ouverte, le moteur cale après quelques minutes.'},
   {c:'batt',set:true,label:'Batterie ON'},
   {c:'radio',label:`Écouter l'ATIS (${AD.atis})`,fx:c=>c.freq=AD.atis,reply:ATIS,from:'ATIS',why:'Piste en service, vent, QNH : avant le premier contact radio.'},
   {c:'altim',set:AD.qnh,label:`Altimètre calé QNH ${AD.qnh}`,why:`L'altimètre doit indiquer ${AD.elev} ft, l'altitude du terrain.`},
   {c:'strobe',set:true,label:'Anticollision ON',why:'Prévient le personnel au sol que le moteur va démarrer.'},
   {c:'pump',set:true,label:'Pompe électrique ON',why:'Met le circuit carburant en pression avant le démarrage.'},
   {c:'mixture',check:'riche',label:'Mélange plein riche (vérifier)'},
   {c:'carb',check:'froid',label:'Réchauffage froid (vérifier)'},
   {c:'brake',check:'serré',label:'Frein de parc serré (vérifier)',why:"L'avion ne doit pas avancer au démarrage."}]},
 mer:{id:'mer',name:'Mise en route',leg:'Parking',cue:'Hélice dégagée : « Attention à l\'hélice ! » Démarrage, puis surveillance de la pression d\'huile.',dur:0,win:20,
  actions:[
   {c:'mags',set:'2',fx:c=>{c.run=true},label:'Magnétos : démarrage, puis sur les deux',why:'Clé sur DÉM jusqu\'au démarrage, puis relâchée sur 2.'},
   {c:'oilP',check:true,label:"Pression d'huile dans le vert (sous 30 s)",why:'Sans pression après 30 s, on coupe le moteur.'},
   {c:'throttle',set:'reduit',label:'Régime 1000 tr/min',why:'Ralenti accéléré pour la chauffe.'},
   {c:'alt',set:true,label:'Alternateur ON',why:'Charge la batterie après la forte demande du démarreur.'},
   {c:'pump',set:false,label:'Pompe électrique OFF',why:'Permet de vérifier que la pompe mécanique tient seule la pression.'},
   {c:'fuelP',check:true,label:'Pression essence (vérifier)'},
   {c:'nav',set:true,label:'Feux de navigation ON'}]},
 clr:{id:'clr',name:'Demande de roulage',leg:'Parking',cue:`Radio sur ${AD.twr} (${AD.station}). Demande de roulage puis collationnement.`,dur:0,win:30,
  actions:[
   {c:'radio',label:'Demande de roulage',fx:c=>c.freq=AD.twr,
    say:`${AD.station}, {CS}, DR400 au ${AD.parking}, deux personnes à bord, pour un tour de piste, avec l'information ${AD.info}, demandons à rouler.`,
    reply:`{cs}, roulez ${AD.hold}, QNH ${AD.qnh}, rappelez prêt.`},
   {c:'radio',label:'Collationner',say:`Roulons ${AD.hold}, QNH ${AD.qnh}, rappellerons prêts, {cs}.`,why:'Toute autorisation de roulage se collationne.'},
   {c:'xpdr',set:'ALT',label:'Transpondeur ALT',why:'Selon la consigne locale : beaucoup de terrains le demandent dès le roulage.'}]},
 taxi:{id:'taxi',name:'Roulage',leg:'Roulage',cue:`Roulage vers le ${AD.hold}. Freins et instruments en virage.`,dur:14,to:{pos:2,ias:0,hdg:240},
  actions:[
   {c:'brake',set:'libre',label:'Frein de parc desserré'},
   {c:'throttle',set:'approche',fx:c=>{setTimeout(()=>c.throttle='reduit',1200)},label:'Un peu de puissance pour démarrer le roulage'},
   {c:'brake',check:true,label:'Essai des freins',why:'Dès les premiers mètres, avant de prendre de la vitesse.'},
   {c:'tc',check:true,label:'Bille-aiguille en virage (vérifier)',why:'En virage à gauche, aiguille à gauche, bille à droite.'},
   {c:'dg',check:true,label:'Conservateur de cap (vérifier)',why:'Le cap doit tourner dans le bon sens.'},
   {c:'ai',check:true,label:'Horizon stable (vérifier)'}]},
 pf:{id:'pf',name:"Point d'attente : essais moteur",leg:"Point d'attente 33",cue:'Avion face au vent, frein de parc serré. Essais moteur.',dur:0,win:30,
  actions:[
   {c:'brake',set:'serré',label:'Frein de parc serré'},
   {c:'throttle',set:'approche',label:'Gaz 1800 tr/min',why:'Régime des essais moteur du DR400-120.'},
   {c:'mags',fx:magCheck,label:'Magnétos : G, D puis les deux',why:'Chute de régime normale et équilibrée sur chaque magnéto.'},
   {c:'carb',set:'chaud',label:'Réchauffage chaud : chute de régime',why:'Une chute confirme que le réchauffage fonctionne.'},
   {c:'carb',set:'froid',label:'Réchauffage froid'},
   {c:'oilT',check:true,label:'Températures et pressions (vérifier)'},
   {c:'throttle',set:'reduit',label:'Ralenti puis 1000 tr/min',why:'Le moteur ne doit pas caler au ralenti.'}]},
 avd:{id:'avd',name:'Check avant décollage',leg:"Point d'attente 33",cue:'Check-list avant décollage, puis annonce « prêt ».',dur:0,win:35,
  actions:[
   {c:'trim',label:'Compensateur position décollage'},
   {c:'flaps',set:1,label:'Volets 1er cran (décollage)',why:'Configuration décollage du DR400.'},
   {c:'fuel',check:true,label:'Essence : principal (vérifier)'},
   {c:'pump',set:true,label:'Pompe électrique ON',why:"Secours de la pompe mécanique pendant la phase critique du décollage."},
   {c:'mixture',check:'riche',label:'Mélange plein riche (vérifier)'},
   {c:'lights',set:true,label:'Phares ON',why:'Être vu au décollage et en montée initiale.'},
   {c:'radio',label:'Annonce « prêt »',say:`{cs}, prêts au ${AD.hold}, pour un tour de piste.`,
    reply:`{cs}, alignez-vous piste ${AD.rwy}, autorisé décollage, vent ${AD.wind}.`},
   {c:'radio',label:'Collationner',say:`Nous nous alignons et décollons piste ${AD.rwy}, {cs}.`}]},
 align:{id:'align',name:'Alignement',leg:'Piste 33',cue:'Aligné sur l\'axe, frein desserré, plein gaz.',dur:4,to:{pos:3,hdg:330},win:12,
  actions:[
   {c:'brake',set:'libre',label:'Frein de parc desserré'},
   {c:'dg',check:true,label:'Cap piste 330 (vérifier)',why:'Le conservateur doit afficher le QFU.'},
   {c:'throttle',set:'plein',label:'Plein gaz',why:'Mise en puissance progressive mais franche.'}]},
 /* ---- en vol ---- */
 roll:{id:'roll',name:'Roulement',leg:'Piste 33',cue:'Contrôle des paramètres pendant l\'accélération.',dur:7,to:{ias:100,pos:4},
  actions:[
   {c:'tach',check:true,label:'Tours moteur (≈ 2300 tr/min)',why:"Si la puissance n'est pas là, on interrompt le décollage."},
   {c:'asi',check:true,label:'Anémomètre actif',why:"Un badin qui ne bouge pas impose d'interrompre le décollage."}]},
 rot:{id:'rot',name:'Rotation',leg:'Montée initiale',cue:'100 km/h : rotation, puis montée à 130 km/h.',dur:8,to:{ias:130,agl:300,vs:600,pos:5.4},win:6,
  actions:[{c:'stick',label:'Rotation : cabrer',why:'Rotation vers 100 km/h, assiette de montée.'}]},
 p300:{id:'p300',name:'300 ft sol',leg:'Montée initiale',cue:`Tu passes 300 ft sol (${P300} ft QNH).`,dur:6,to:{agl:500,ias:145,vs:650,pos:6},
  actions:[{c:'flaps',set:0,label:'Volets rentrés',why:"Hauteur suffisante en cas de panne : on lisse l'avion pour la montée."}]},
 p500:{id:'p500',name:'500 ft sol',leg:'Virage vent traversier',cue:'500 ft sol : virage en vent traversier.',dur:9,to:{agl:720,hdg:240,pos:7.6,vs:600},
  actions:[
   {c:'pump',set:false,label:'Pompe électrique OFF'},
   {c:'fuelP',check:true,label:'Pression essence (vérifier)',why:'Confirme que la pompe mécanique alimente seule.'},
   {c:'trim',label:'Compenser',why:'Soulage le manche en montée stabilisée.'}]},
 xw:{id:'xw',name:'Vent traversier',leg:'Vent traversier',cue:'Montée vers la hauteur du tour de piste, virage en vent arrière.',dur:9,to:{agl:1000,hdg:150,pos:9,vs:400}},
 lvl:{id:'lvl',name:'Hauteur tour de piste : palier',leg:'Vent arrière',cue:`${AD.tdp} ft sol atteints (${TDPQ} ft QNH) : mise en palier.`,dur:6,to:{agl:1000,ias:170,vs:0,pos:9.5},
  actions:[
   {c:'throttle',set:'palier',label:'Réduire à la puissance de palier',why:"Laisser l'avion accélérer en palier puis afficher ≈ 2250 tr/min."},
   {c:'trim',label:'Compenser',why:'Avion compensé en palier : tu as les mains libres pour la check-list.'}]},
 dw:{id:'dw',name:'Vent arrière',leg:'Vent arrière',cue:'Report vent arrière, puis check-list pré-atterrissage.',dur:14,to:{pos:10,ias:170},win:20,
  actions:[
   {c:'radio',label:'Report vent arrière',say:`{cs}, vent arrière piste ${AD.rwy} pour un complet.`,reply:'{cs}, numéro un, rappelez en finale.',why:'Le contrôleur te séquence dans le circuit.'},
   {c:'radio',label:'Collationner',say:'Numéro un, rappellerons en finale, {cs}.'},
   {c:'pump',set:true,label:'Pompe électrique ON',why:"Secours pour l'approche et une éventuelle remise de gaz."},
   {c:'carb',set:'chaud',label:'Réchauffage carbu chaud',why:'Avant la réduction : le givrage carburateur menace à faible puissance.'},
   {c:'mixture',check:'riche',label:'Mélange plein riche (vérifier)'},
   {c:'fuel',check:true,label:'Robinet essence sur principal (vérifier)',why:"On n'atterrit pas sur un réservoir presque vide."},
   {c:'lights',check:true,label:'Phares ON (vérifier)'}]},
 abeam:{id:'abeam',name:'Travers seuil',leg:'Vent arrière',cue:'Travers du seuil de piste : début de la descente.',dur:7,to:{pos:11,ias:150,agl:900,vs:-300},
  actions:[
   {c:'throttle',set:'approche',label:'Réduire (≈ 1700 tr/min)',why:'Début de la descente au travers du seuil.'},
   {c:'flaps',set:1,label:'Volets 1er cran',why:'Sous la VFE, pour descendre à 150 km/h.'},
   {c:'trim',label:'Compenser',why:'Nouvelle vitesse, nouvelle compensation.'}]},
 base:{id:'base',name:'Étape de base',leg:'Étape de base',cue:'Virage en étape de base, descente à 150 km/h.',dur:9,to:{pos:13,hdg:60,agl:650,ias:150,vs:-400},
  actions:[{c:'vsi',check:true,label:'Taux de descente (vérifier)',why:'Environ 400 à 500 ft/min pour arriver en finale vers 500 ft sol.'}]},
 final:{id:'final',name:'Finale',leg:'Finale',cue:'Aligné en finale, plan de descente stabilisé.',dur:12,to:{pos:14.6,hdg:330,agl:300,ias:130,vs:-450},win:16,
  actions:[
   {c:'radio',label:'Report finale',say:`{cs}, finale piste ${AD.rwy}.`,reply:`{cs}, piste ${AD.rwy}, autorisé atterrissage, vent ${AD.wind}.`},
   {c:'radio',label:'Collationner',say:`Autorisés atterrissage piste ${AD.rwy}, {cs}.`},
   {c:'flaps',set:2,label:'Volets atterrissage',why:'Configuration finale : plus de traînée, pente plus forte.'},
   {c:'asi',check:true,label:'Vitesse finale 130 km/h (vérifier)',why:'Approche stabilisée : la vitesse est tenue au plus près.'},
   {c:'trim',label:'Compenser'}]},
 short:{id:'short',name:'Courte finale',leg:'Courte finale',cue:'Courte finale, 200 ft sol.',dur:7,to:{pos:15.6,agl:20,ias:120,vs:-400},
  actions:[{c:'carb',set:'froid',label:'Réchauffage carbu froid',why:'Toute la puissance est disponible si tu dois remettre les gaz.'}]},
 flare:{id:'flare',name:'Arrondi',leg:'Arrondi',cue:'Quelques mètres au-dessus de la piste : arrondi.',dur:5,to:{pos:16,agl:0,ias:95,vs:-60,pitch:6},
  actions:[
   {c:'throttle',set:'reduit',label:'Réduction totale',why:'Gaz réduits avant le toucher.'},
   {c:'stick',label:'Arrondi : cabrer progressivement',why:'On casse le plan de descente et on laisse la vitesse diminuer.'}]},
 /* ---- retour au parking ---- */
 roll2:{id:'roll2',name:"Après l'atterrissage",leg:'Dégagement',cue:'Posé. Freinage, piste dégagée : report et check-list après atterrissage.',dur:10,to:{pos:17,ias:15,vs:0,pitch:0},win:22,
  actions:[
   {c:'radio',label:'Report « piste dégagée »',say:'{cs}, piste dégagée.',reply:`{cs}, roulez ${AD.parking}, au revoir.`},
   {c:'radio',label:'Collationner',say:`Roulons ${AD.parking}, {cs}, au revoir.`},
   {c:'flaps',set:0,label:'Volets rentrés'},
   {c:'pump',set:false,label:'Pompe électrique OFF'},
   {c:'lights',set:false,label:'Phares OFF'},
   {c:'xpdr',set:'STBY',label:'Transpondeur STBY',why:'Selon la consigne locale au roulage.'}]},
 park:{id:'park',name:'Arrêt moteur',leg:'Parking',cue:'Au parking : frein de parc, coupure moteur, puis tout sur OFF.',dur:8,to:{pos:18,ias:0,hdg:60},win:28,
  actions:[
   {c:'brake',set:'serré',label:'Frein de parc serré'},
   {c:'throttle',check:true,label:'Régime 1000 tr/min, quelques secondes'},
   {c:'mixture',set:'pauvre',fx:c=>{setTimeout(()=>c.run=false,600)},label:'Mélange étouffoir : arrêt du moteur',why:'On coupe par le mélange : il ne reste pas d\'essence dans les cylindres.'},
   {c:'mags',set:'OFF',label:'Magnétos OFF, clé retirée',why:"Hélice « chaude » tant que les magnétos ne sont pas coupées."},
   {c:'nav',set:false,label:'Feux de navigation OFF'},
   {c:'strobe',set:false,label:'Anticollision OFF'},
   {c:'alt',set:false,label:'Alternateur OFF'},
   {c:'batt',set:false,label:'Batterie OFF'},
   {c:'fuel',set:'F',label:'Robinet essence fermé'}]}
};

/* Remise de gaz : départ en vent arrière */
const GA=[
 {...W.dw},{...W.abeam},{...W.base},{...W.final},
 {id:'ga',name:'Remise de gaz',leg:'Remise de gaz',cue:'Avion sur la piste à 300 ft : remise de gaz !',dur:6,to:{pos:15.2,agl:380,ias:125,vs:300,pitch:7},win:7,
  actions:[
   {c:'throttle',set:'plein',label:'Plein gaz',why:'Premier geste, immédiat.'},
   {c:'carb',set:'froid',label:'Réchauffage carbu froid',why:"Sinon tu n'as pas toute la puissance."},
   {c:'stick',label:'Assiette de montée',why:"Arrêter la descente sans dépasser l'assiette de montée."},
   {c:'flaps',set:1,label:'Volets 1er cran (décollage)',why:"On réduit la traînée, sans tout rentrer d'un coup près du sol."}]},
 {id:'ga2',name:'Montée après remise de gaz',leg:'Montée',cue:'Vario positif, 130 km/h, 300 ft au-dessus du sol.',dur:9,to:{pos:17,agl:650,ias:140,vs:600},win:18,
  actions:[
   {c:'flaps',set:0,label:'Volets rentrés',why:'Vitesse et hauteur suffisantes : configuration lisse.'},
   {c:'radio',label:'Report remise de gaz',say:'{cs}, remise de gaz.',reply:'{cs}, reçu, rappelez vent arrière.'},
   {c:'radio',label:'Collationner',say:'Rappellerons vent arrière, {cs}.'},
   {c:'trim',label:'Compenser'}]}
];

const base={elev:AD.elev,qnh:AD.qnh,qfu:240};
const ON={run:true,batt:true,alt:true,strobe:true,nav:true,fuel:'PR',mags:'2',brake:'libre',qnh:AD.qnh,freq:AD.twr};
const SOL={...base,title:'Mise en route et roulage DR400',intro:`${AD.station.split(' ')[0]} (LFCL) : du ${AD.parking} au décollage, avec ATIS, demande de roulage, essais moteur et check-list avant décollage.`,
 phases:['avmr','mer','clr','taxi','pf','avd','align','roll'].map(k=>W[k])};
const TDP={...base,title:'Tour de piste complet DR400',intro:`LFCL, piste ${AD.rwy} : du ${AD.parking} au ${AD.parking}. Mise en route, roulage, tour de piste à ${AD.tdp} ft sol et arrêt moteur.`,
 phases:['avmr','mer','clr','taxi','pf','avd','align','roll','rot','p300','p500','xw','lvl','dw','abeam','base','final','short','flare','roll2','park'].map(k=>W[k])};
const VOL={...base,title:'Décollage et tour de piste DR400',intro:`Aligné piste ${AD.rwy}, autorisé au décollage : du plein gaz jusqu'à l'arrondi.`,
 phases:['align','roll','rot','p300','p500','xw','lvl','dw','abeam','base','final','short','flare'].map(k=>W[k]),
 init:{vars:{pos:3,hdg:330},ctl:{...ON,brake:'serré',flaps:1,pump:true,lights:true,xpdr:'ALT',throttle:'reduit'}}};
const RDG={...base,title:'Remise de gaz DR400',intro:'Départ en vent arrière, approche normale, puis remise de gaz à 300 ft en finale.',phases:GA,
 init:{vars:{agl:1000,ias:170,vs:0,hdg:150,pos:9.5},ctl:{...ON,throttle:'palier',lights:true,xpdr:'ALT'}}};

const head=`<p>Valeurs indicatives pour un DR400-120 à Toulouse-Lasbordes. Ta check-list club, le manuel de vol et la VAC LFCL en vigueur priment : fréquences, sens et hauteur du tour de piste sont à vérifier.</p>
<h3>Terrain</h3><dl>
<dt>LFCL</dt><dd>${AD.elev} ft, piste ${AD.rwy}</dd><dt>${AD.station}</dt><dd>${AD.twr}</dd><dt>ATIS</dt><dd>${AD.atis}</dd>
<dt>300 ft sol</dt><dd>${P300} ft QNH</dd><dt>Tour de piste</dt><dd>${AD.tdp} ft sol = ${TDPQ} ft QNH</dd></dl>
<h3>Vitesses (km/h)</h3><dl>
<dt>Rotation</dt><dd>100</dd><dt>Montée initiale</dt><dd>130 (volets décollage)</dd><dt>Montée</dt><dd>145 (lisse)</dd>
<dt>Vent arrière</dt><dd>170 (≈ 2250 tr/min)</dd><dt>Base</dt><dd>150 (1er cran)</dd><dt>Finale</dt><dd>130 (volets atterrissage)</dd><dt>Courte finale</dt><dd>120</dd></dl>`;

const blk=(id,title,sc)=>({id,title,sim:{panel:'dr400',scenario:sc},get memo(){return SIM.memo(sc,head)}});
LI.register({id:'tdp',code:'TDP',kind:'pratique',title:'Tour de piste',
 intro:'Planche de bord animée à LFCL : touche ou dicte les commandes au bon moment pour ancrer les automatismes.',
 blocks:[blk('tdp-dr400','DR400 · du parking au parking',TDP),blk('tdp-dr400-vol','DR400 · de l\'alignement à l\'atterrissage',VOL),blk('tdp-dr400-sol','DR400 · mise en route et roulage',SOL),blk('tdp-dr400-rdg','DR400 · remise de gaz',RDG)]});
})();
