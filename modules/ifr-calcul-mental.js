/* Learning IFR — Module pratique : calcul mental IFR
   Chaque bloc = une fiche mémo (memo, HTML) + des générateurs de problèmes (gens).
   Un générateur renvoie {t, ro, q, u, a, ok, s, tip, neg?, hdg?}. */
LI.register({
id:'calcul', code:'IFR', kind:'pratique', title:'Calcul mental IFR',
intro:'Les règles de pouce à appliquer de tête en approche et en croisière.',
blocks:[
/* ------------------------------------------------------------------ */
{id:'descente', title:'Descente et plans',
memo:`
<h3>Plan standard 3°</h3>
<dl>
<dt>Pente</dt><dd>≈ 300 ft par NM (valeur exacte 318 ft/NM)</dd>
<dt>Vz</dt><dd>Vs ÷ 2 × 10, soit 5 × Vs (120 kt → 600 ft/min)</dd>
<dt>Début de descente</dt><dd>perte d'altitude (ft) ÷ 1000 × 3 = distance en NM</dd>
<dt>Contrôle sur le plan</dt><dd>hauteur ≈ 300 × distance au seuil (5 NM → 1500 ft)</dd>
</dl>
<h3>Autres pentes</h3>
<dl>
<dt>2,5°</dt><dd>≈ 250 ft/NM</dd><dt>3,5°</dt><dd>≈ 350 ft/NM</dd><dt>4°</dt><dd>≈ 400 ft/NM</dd>
<dt>Vz quelconque</dt><dd>ft/NM × Vs ÷ 60</dd>
</dl>
<h3>Pièges</h3>
<ul><li>La Vz se calcule avec la <b>vitesse sol</b>, pas la vitesse propre : vent de face, Vz plus faible.</li>
<li>La règle 5 × Vs donne une Vz environ 5 % trop faible : en réel, surveille l'écart sur le plan.</li>
<li>Prévois 1 à 2 NM de plus si tu dois aussi décélérer.</li></ul>`,
gens:[
()=>{const gs=R(80,180,10),a=gs*5;return{t:'Vz sur plan 3°',ro:[['Vs',gs+' kt'],['Plan','3°']],
 q:`Tu descends sur un plan de 3° à ${gs} kt de vitesse sol. Quelle Vz affiches-tu ?`,u:'ft/min',a,ok:near(30),
 s:['Règle : Vz = Vs ÷ 2 × 10, autrement dit 5 × Vs.',`${gs} ÷ 2 = ${gs/2}`,`${gs/2} × 10 = <b>${a} ft/min</b>`],
 tip:"D'où ça vient : 3° ≈ 300 ft par NM, et tu fais Vs/60 NM par minute, donc 300 × Vs/60 = 5 × Vs."}},
()=>{const top=R(5000,12000,500),bot=R(1500,4000,500),l=top-bot,a=l/1000*3;return{t:'Début de descente',ro:[['Altitude',top+' ft'],['Cible',bot+' ft'],['Plan','3°']],
 q:`Tu es à ${top} ft et tu dois être à ${bot} ft au point de fin de descente. À combien de NM avant ce point commences-tu à descendre ?`,u:'NM',a,ok:near(.5),
 s:[`Perte d'altitude : ${top} − ${bot} = ${l} ft`,`${l} ÷ 1000 = ${fmt(l/1000)}`,`${fmt(l/1000)} × 3 = <b>${fmt(a)} NM</b>`],
 tip:'3 NM par tranche de 1000 ft. Ajoute 1 à 2 NM si tu dois aussi réduire la vitesse.'}},
()=>{const [p,r]=P([[2.5,250],[3,300],[3.5,350],[4,400]]),d=R(2,10),a=r*d;return{t:'Hauteur sur le plan',ro:[['Plan',fmt(p)+'°'],['Distance',d+' NM']],
 q:`Sur un plan de ${fmt(p)}°, à quelle hauteur au-dessus du seuil dois-tu passer à ${d} NM ?`,u:'ft',a,ok:pct(.05,20),
 s:[`Plan ${fmt(p)}° ≈ ${r} ft par NM`,`${r} × ${d} = <b>${a} ft</b>`],
 tip:'Vérification classique en approche : à 5 NM sur un plan 3°, environ 1500 ft de hauteur.'}},
()=>{const [p,r]=P([[2.5,250],[3.5,350],[4,400]]),gs=R(60,180,30),a=r*gs/60;return{t:'Vz hors 3°',ro:[['Vs',gs+' kt'],['Plan',fmt(p)+'°']],
 q:`Approche publiée avec un plan de ${fmt(p)}°. Vitesse sol ${gs} kt. Quelle Vz ?`,u:'ft/min',a,ok:pct(.05,20),
 s:[`${gs} kt = ${fmt(gs/60)} NM/min`,`Plan ${fmt(p)}° ≈ ${r} ft/NM`,`${r} × ${fmt(gs/60)} = <b>${fmt(a)} ft/min</b>`],
 tip:'Même logique que le 3° : ft par NM multiplié par NM par minute.'}}
]},
/* ------------------------------------------------------------------ */
{id:'vitesse', title:'Vitesse, temps, distance',
memo:`
<h3>Conversions de base</h3>
<dl>
<dt>NM par minute</dt><dd>Vs ÷ 60</dd>
<dt>Repères</dt><dd>60 kt = 1 · 90 kt = 1,5 · 120 kt = 2 · 150 kt = 2,5 · 180 kt = 3 NM/min</dd>
<dt>Distance</dt><dd>NM/min × temps (min)</dd>
<dt>Temps</dt><dd>distance ÷ NM/min</dd>
</dl>
<h3>Virage au taux standard</h3>
<dl>
<dt>Taux 1</dt><dd>3°/s, 360° en 2 min, 180° en 1 min, 90° en 30 s</dd>
<dt>Temps de virage</dt><dd>angle ÷ 3 (secondes)</dd>
</dl>
<h3>Pièges</h3>
<ul><li>Toujours repasser en NM/min avant de multiplier ou diviser.</li>
<li>Les temps d'approche publiés (FAF → MAPt) se lisent avec la <b>vitesse sol</b>.</li></ul>`,
gens:[
()=>{const gs=P([60,75,90,105,120,135,150,180]),t=R(2,15),a=gs/60*t;return{t:'Distance parcourue',ro:[['Vs',gs+' kt'],['Temps',t+' min']],
 q:`À ${gs} kt de vitesse sol, quelle distance parcours-tu en ${t} minutes ?`,u:'NM',a,ok:pct(.03,.3),
 s:[`${gs} kt = ${gs} ÷ 60 = ${fmt(gs/60)} NM/min`,`${fmt(gs/60)} × ${t} = <b>${fmt(a)} NM</b>`],
 tip:'Repères : 60 kt = 1 NM/min, 90 = 1,5, 120 = 2, 150 = 2,5, 180 = 3.'}},
()=>{const gs=P([60,90,120,150,180]),t=R(2,12),d=gs/60*t;return{t:'Temps de vol',ro:[['Vs',gs+' kt'],['Distance',fmt(d)+' NM']],
 q:`Il te reste ${fmt(d)} NM à ${gs} kt de vitesse sol. Combien de minutes ?`,u:'min',a:t,ok:near(.3),
 s:[`${gs} kt = ${fmt(gs/60)} NM/min`,`${fmt(d)} ÷ ${fmt(gs/60)} = <b>${t} min</b>`],tip:"Toujours repasser en NM par minute d'abord."}},
()=>{const d=P([30,45,60,90,120,135,180,225,270,360]),a=d/3;return{t:'Durée de virage taux 1',ro:[['Virage',d+'°'],['Taux','3°/s']],
 q:`Combien de secondes pour un virage de ${d}° au taux standard ?`,u:'s',a,ok:near(1),
 s:['Taux 1 = 3° par seconde',`${d} ÷ 3 = <b>${a} s</b>`+(a>=60?` (${Math.floor(a/60)} min${a%60?' '+a%60+' s':''})`:'')],
 tip:'Utile pour virer au chrono avec un compas en panne : 90° = 30 s, 180° = 1 min.'}}
]},
/* ------------------------------------------------------------------ */
{id:'virages', title:'Virages',
memo:`
<h3>Inclinaison au taux 1</h3>
<dl>
<dt>Formule</dt><dd>VP ÷ 10 + 7 (en degrés)</dd>
<dt>Variante</dt><dd>≈ 15 % de la VP</dd>
<dt>Exemples</dt><dd>100 kt → 17° · 120 kt → 19° · 150 kt → 22°</dd>
</dl>
<h3>Sortie de virage</h3>
<dl>
<dt>Anticipation</dt><dd>inclinaison ÷ 2, en degrés de cap</dd>
<dt>Virage à droite</dt><dd>cap visé − anticipation</dd>
<dt>Virage à gauche</dt><dd>cap visé + anticipation</dd>
</dl>
<h3>Pièges</h3>
<ul><li>L'inclinaison se calcule avec la <b>vitesse propre</b> (le taux de virage dépend de l'air, pas du sol).</li>
<li>Au-delà de 25 à 30° on limite l'inclinaison même si le taux 1 en demanderait plus.</li></ul>`,
gens:[
()=>{const v=R(80,180,10),a=v/10+7;return{t:'Inclinaison taux 1',ro:[['VP',v+' kt']],
 q:`Quelle inclinaison pour un virage au taux standard à ${v} kt de vitesse propre ?`,u:'°',a,
 ok:x=>Math.abs(x-a)<=2||Math.abs(x-v*.15)<=1,
 s:['Règle : VP ÷ 10 + 7',`${v} ÷ 10 = ${v/10}`,`${v/10} + 7 = <b>${a}°</b>`],
 tip:`Variante acceptée : 15 % de VP = ${fmt(v*.15)}°.`}},
()=>{const b=P([10,14,18,20,24,26,30]),tg=R(1,36)*10,dr=P(['droite','gauche']),a=dr==='droite'?tg-b/2:tg+b/2;
 return{t:'Sortie de virage',ro:[['Inclinaison',b+'°'],['Cap visé',H(tg)],['Virage',dr]],
 q:`Virage à ${dr} incliné à ${b}° pour rejoindre le cap ${H(tg)}. À quel cap commences-tu à redresser ?`,u:'cap',a,hdg:true,
 ok:x=>Math.abs(((x-a+540)%360)-180)<=1,
 s:[`Anticipation = inclinaison ÷ 2 = ${b/2}°`,`Virage à ${dr} : le cap ${dr==='droite'?'augmente':'diminue'}, tu redresses ${b/2}° avant d'y être`,`${H(tg)} ${dr==='droite'?'−':'+'} ${b/2} = <b>${H(a)}</b>`],
 tip:'Sans anticipation tu dépasses le cap et tu oscilles.'}}
]},
/* ------------------------------------------------------------------ */
{id:'vent', title:'Vent et composantes',
memo:`
<h3>Composante de travers</h3>
<dl>
<dt>30°</dt><dd>50 % du vent</dd><dt>45°</dt><dd>70 %</dd><dt>60°</dt><dd>85 % (≈ 90 %)</dd><dt>90°</dt><dd>100 %</dd>
</dl>
<h3>Composante de face</h3>
<dl><dt>Règle</dt><dd>prendre le pourcentage du travers pour (90° − angle)</dd>
<dt>Exemples</dt><dd>30° → 85 % · 45° → 70 % · 60° → 50 %</dd></dl>
<h3>Méthode</h3>
<ul><li>Angle = écart entre direction du vent et QFU (piste 27 = 270°).</li>
<li>Le vent METAR/ATIS est donné en degrés <b>vrais</b> (METAR) ou <b>magnétiques</b> (ATIS, tour) : pour la piste, utilise celui de la tour.</li>
<li>Mnémo : 30° la moitié, 45° sept dixièmes, 60° presque tout.</li></ul>`,
gens:[
()=>{const q=R(1,36),rw=q*10,face=Math.random()<.3,ang=face?P([30,45,60]):P([30,45,60,90]),sd=P([1,-1]),w=R(8,30),wd=H(rw+sd*ang);
 const fx={30:.5,45:.7,60:.85,90:1},f=face?fx[90-ang]:fx[ang],a=w*f,ex=w*(face?Math.cos(ang*Math.PI/180):Math.sin(ang*Math.PI/180));
 const lab=face?'de face':'de travers',pst=String(q).padStart(2,'0');
 return{t:'Composante '+lab,ro:[['Vent',wd+'°/'+w+' kt'],['Piste',pst+' ('+H(rw)+')']],
 q:`Vent ${wd}° pour ${w} kt, piste ${pst}. Quelle composante ${lab} ?`,u:'kt',a,
 ok:x=>Math.abs(x-a)<=Math.max(2,a*.1)||Math.abs(x-ex)<=1.5,
 s:[`Angle vent / piste : ${wd} et ${H(rw)}, soit ${ang}°`,
   face?`Composante de face : règle du travers pour 90 − ${ang} = ${90-ang}°, soit ${Math.round(f*100)} %`:`À ${ang}° : ${Math.round(f*100)} % du vent en travers`,
   `${w} × ${fmt(f)} = <b>${fmt(a)} kt</b>`],
 tip:'Mnémo : 30° la moitié, 45° sept dixièmes, 60° presque tout.'}}
]},
/* ------------------------------------------------------------------ */
{id:'altimetrie', title:'Atmosphère et altimétrie',
memo:`
<h3>Atmosphère standard (ISA)</h3>
<dl>
<dt>Au niveau de la mer</dt><dd>15 °C, 1013,25 hPa</dd>
<dt>Gradient</dt><dd>− 2 °C par 1000 ft (jusqu'à 36 000 ft)</dd>
<dt>Température ISA</dt><dd>15 − (FL ÷ 10 × 2) °C (FL100 → − 5 °C)</dd>
<dt>Écart ISA</dt><dd>ΔISA = OAT − T ISA (avec le signe)</dd>
</dl>
<h3>Corrections</h3>
<dl>
<dt>Température</dt><dd>4 ft par 1000 ft et par °C d'écart, sur la hauteur au-dessus de la station</dd>
<dt>Calage</dt><dd>1 hPa ≈ 28 ft (27 à 30)</dd>
</dl>
<h3>Pièges</h3>
<ul><li>Air froid : l'altitude vraie est <b>plus basse</b> que l'indiquée. On ajoute la correction aux altitudes minimales.</li>
<li>Du haut vers le bas, attention en bas : vers une basse pression ou un air plus froid sans recaler, tu es plus bas qu'affiché.</li>
<li>La correction de température s'applique à la hauteur au-dessus du terrain de référence, pas à l'altitude totale.</li></ul>`,
gens:[
()=>{const fl=R(3,24)*10,a=15-fl/5;return{t:'Température ISA',ro:[['Niveau',FL(fl)]],
 q:`Quelle est la température standard ISA au ${FL(fl)} ?`,u:'°C',a,ok:near(.5),neg:true,
 s:[`${FL(fl)} = ${fl*100} ft, soit ${fl/10} × 1000 ft`,`L'ISA perd 2 °C par 1000 ft : ${fl/10} × 2 = ${fl/5} °C`,`15 − ${fl/5} = <b>${sgn(a)} °C</b>`],
 tip:'Repère : 0 °C vers 7500 ft en atmosphère standard.'}},
()=>{const fl=R(3,20)*10,i=15-fl/5;let d=0;while(!d)d=R(-15,20);const o=i+d;return{t:'Écart ISA',ro:[['Niveau',FL(fl)],['OAT',sgn(o)+' °C']],
 q:`Au ${FL(fl)} tu lis une température extérieure de ${sgn(o)} °C. Quel est l'écart ISA, avec son signe ?`,u:'°C',a:d,ok:near(.5),neg:true,
 s:[`ISA au ${FL(fl)} : 15 − ${fl/10} × 2 = ${sgn(i)} °C`,`ΔISA = OAT − ISA = ${sgn(o)} − (${sgn(i)}) = <b>ISA ${sgn(d)}</b>`],
 tip:d<0?"Plus froid que standard : l'altitude vraie est inférieure à l'altitude indiquée.":"Plus chaud que standard : l'altitude densité augmente, les performances baissent."}},
()=>{const h=R(4,30)*100,d=P([-5,-10,-15,-20,-25,-30]),a=4*h/1000*-d;return{t:'Correction de température',ro:[['Hauteur',h+' ft'],['Écart','ISA '+sgn(d)]],
 q:`Ta hauteur de minimums est de ${h} ft au-dessus du terrain, la température est ISA ${sgn(d)}. Quelle correction ajoutes-tu ?`,u:'ft',a,ok:pct(.1,5),
 s:["Règle : 4 ft par 1000 ft et par °C d'écart",`${h} ft = ${fmt(h/1000)} × 1000 ft`,`4 × ${fmt(h/1000)} × ${-d} = <b>${fmt(a)} ft</b>`],
 tip:"Par temps froid tu es plus bas que ce que l'altimètre affiche : on ajoute la correction aux altitudes publiées."}},
()=>{const st=R(995,1030),d=R(3,15),lower=Math.random()<.5,rl=lower?st-d:st+d,a=d*28;return{t:'Erreur de calage',ro:[['Calé',st+' hPa'],['QNH réel',rl+' hPa']],
 q:`Altimètre calé sur ${st} hPa alors que le QNH réel est ${rl} hPa. De combien de pieds l'altitude affichée est-elle fausse ?`,u:'ft',a,
 ok:x=>x>=d*27-10&&x<=d*30+10,
 s:[`Écart de calage : ${d} hPa`,"1 hPa ≈ 28 ft (entre 27 et 30 selon l'altitude)",`${d} × 28 ≈ <b>${a} ft</b>`,
   lower?`Calage trop fort : tu es ${a} ft plus <b>bas</b> qu'affiché.`:`Calage trop faible : tu es ${a} ft plus <b>haut</b> qu'affiché.`],
 tip:'Du haut vers le bas, attention en bas : calage plus fort que le QNH, terrain plus près que prévu.'}}
]},
/* ------------------------------------------------------------------ */
{id:'anticipations', title:'Anticipations d\'interception',
memo:`
<h3>Arc DME</h3>
<dl>
<dt>Anticipation</dt><dd>Vs ÷ 200 = distance en NM (120 kt → 0,6 NM)</dd>
<dt>Marge de roulis</dt><dd>+ 0,2 NM</dd>
<dt>En rapprochement</dt><dd>virer à arc + anticipation</dd>
<dt>En éloignement</dt><dd>virer à arc − anticipation</dd>
</dl>
<h3>Radiale, temps à la balise T (min)</h3>
<dl>
<dt>Interception 30°</dt><dd>5 ÷ T degrés</dd><dt>45°</dt><dd>7 ÷ T</dd><dt>60°</dt><dd>10 ÷ T</dd><dt>90°</dt><dd>20 ÷ T</dd>
</dl>
<h3>Radiale, distance D (NM)</h3>
<dl><dt>Interception 90°</dt><dd>Vs ÷ (3 × D) degrés (120 kt à 8 NM → 5°)</dd></dl>
<h3>À retenir</h3>
<ul><li>Le rayon de virage au taux 1 vaut environ Vs ÷ 200 NM : c'est la base de toutes ces règles.</li>
<li>Plus tu es près de la balise ou plus tu vas vite, plus tu anticipes.</li></ul>`,
gens:[
()=>{const gs=R(90,180,10),r=R(7,15),inb=Math.random()<.5,l=gs/200,a=inb?r+l:r-l,a2=inb?a+.2:a-.2;
 return{t:'Interception arc DME',ro:[['Vs',gs+' kt'],['Arc',r+' NM'],['Sens',inb?'rapprochement':'éloignement']],
 q:inb?`Tu te rapproches de la balise pour rejoindre l'arc DME ${r} NM, vitesse sol ${gs} kt. À quelle distance DME commences-tu ton virage ?`
      :`Tu t'éloignes de la balise sur une radiale pour rejoindre l'arc DME ${r} NM, vitesse sol ${gs} kt. À quelle distance DME commences-tu ton virage ?`,
 u:'NM',a,ok:x=>Math.abs(x-a)<=.15||Math.abs(x-a2)<=.15,
 s:[`Anticipation = Vs ÷ 200 = ${gs} ÷ 200 = ${fmt(l)} NM`,
   inb?`Tu te rapproches : le virage commence avant l'arc, donc plus loin, ${r} + ${fmt(l)} = <b>${fmt(a)} NM</b>`
      :`Tu t'éloignes : le virage commence avant l'arc, donc plus près, ${r} − ${fmt(l)} = <b>${fmt(a)} NM</b>`],
 tip:`Avec 0,2 NM de marge pour la mise en roulis : ${fmt(a2)} NM, accepté aussi.`}},
()=>{const ang=P([30,45,60,90]),k={30:5,45:7,60:10,90:20}[ang],T=R(1,5),a=k/T;return{t:'Anticipation radiale (temps)',ro:[['Interception',ang+'°'],['Balise à',T+' min']],
 q:`Tu interceptes une radiale avec ${ang}° d'angle, à ${T} min de la balise. À combien de degrés de l'axe commences-tu à virer ?`,u:'°',a,ok:near(1),
 s:[`Pour ${ang}° d'interception : anticipation = ${k} ÷ T`,`${k} ÷ ${T} = <b>${fmt(a)}°</b>`],
 tip:"Plus tu es près de la balise, plus l'aiguille bouge vite : l'anticipation grandit."}},
()=>{const gs=P([90,120,150,180]),D=R(4,12),a=gs/(3*D);return{t:'Anticipation radiale (distance)',ro:[['Vs',gs+' kt'],['DME',D+' NM'],['Interception','90°']],
 q:`À ${D} NM du VOR, vitesse sol ${gs} kt, tu vires de 90° pour prendre une radiale. À combien de degrés de l'axe débutes-tu le virage ?`,u:'°',a,ok:near(1),
 s:['Règle : anticipation = Vs ÷ (3 × D)',`3 × ${D} = ${3*D}`,`${gs} ÷ ${3*D} = <b>${fmt(a)}°</b>`],
 tip:'Plus vite ou plus près de la balise, plus il faut anticiper.'}}
]}
]});
