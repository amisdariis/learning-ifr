/* Learning IFR — ATPL 022 Instrumentation
   Blocs QCM : bank = [{q, c:[bonne, fausse, fausse, fausse], why}]. L'ordre des choix est mélangé à l'affichage. */
LI.register({
id:'022', code:'022', kind:'atpl', title:'Instrumentation',
intro:'Instruments de vol, capteurs, systèmes automatiques et d\'alerte.',
blocks:[
{id:'022-alti', title:'Altimètre et calages',
memo:`
<h3>Calages</h3>
<dl>
<dt>QNH</dt><dd>l'altimètre indique l'altitude (au-dessus du niveau moyen de la mer)</dd>
<dt>QFE</dt><dd>l'altimètre indique la hauteur au-dessus du terrain (0 au sol)</dd>
<dt>Standard 1013,25</dt><dd>altitude pression, lue en niveau de vol</dd>
</dl>
<h3>Transition</h3>
<dl>
<dt>Altitude de transition</dt><dd>en montée, on passe au calage standard en la franchissant</dd>
<dt>Niveau de transition</dt><dd>en descente, on passe au QNH en le franchissant</dd>
<dt>Couche de transition</dt><dd>entre les deux : on n'y vole pas en palier</dd>
</dl>
<h3>Erreurs</h3>
<ul>
<li>Vers une basse pression sans recaler : altitude vraie <b>inférieure</b> à l'indiquée.</li>
<li>Air plus froid que l'ISA : altitude vraie <b>inférieure</b> à l'indiquée.</li>
<li>Prise statique obstruée : altimètre figé, variomètre à zéro, anémomètre faux (sous-estime en montée, surestime en descente).</li>
<li>Pitot et purge obstrués : l'anémomètre réagit comme un altimètre (augmente en montée).</li>
</ul>`,
bank:[
{q:"L'altimètre est calé sur le QNH. Qu'indique-t-il ?",c:["L'altitude au-dessus du niveau moyen de la mer","La hauteur au-dessus du terrain","L'altitude pression","Le niveau de vol"],
 why:"Le QNH ramène la pression au niveau de la mer : l'altimètre affiche une altitude."},
{q:"Altimètre calé sur le QFE, avion posé sur le terrain de référence. Que lit-on ?",c:["0 ft","L'altitude du terrain","L'altitude pression du terrain","1013 ft"],
 why:"Le QFE est la pression au niveau du terrain : au sol, la hauteur affichée est nulle."},
{q:"Tu voles d'une zone de haute pression vers une zone de basse pression sans recaler l'altimètre. Ton altitude vraie est :",c:["Inférieure à l'altitude indiquée","Supérieure à l'altitude indiquée","Égale à l'altitude indiquée","Indépendante du calage"],
 why:"Du haut vers le bas, attention en bas : l'altimètre surestime l'altitude."},
{q:"En air plus froid que l'atmosphère standard, l'altitude vraie est :",c:["Inférieure à l'altitude indiquée","Supérieure à l'altitude indiquée","Égale à l'altitude indiquée","Supérieure uniquement au-dessus du FL100"],
 why:"L'air froid est plus dense : les surfaces isobares sont plus basses, l'altimètre surestime."},
{q:"Le calage 1013,25 hPa affiché, l'altimètre indique :",c:["L'altitude pression","L'altitude vraie","La hauteur","L'altitude densité"],
 why:"Le calage standard donne l'altitude pression, exprimée en niveau de vol."},
{q:"En montée, quand affiches-tu le calage standard ?",c:["En franchissant l'altitude de transition","En franchissant le niveau de transition","Au sommet de la montée","À 3000 ft sol"],
 why:"En montée : altitude de transition. En descente : niveau de transition."},
{q:"La prise statique est obstruée pendant une montée. L'altimètre :",c:["Reste figé à l'altitude de l'obstruction","Indique une altitude trop élevée","Continue d'indiquer correctement","Revient à zéro"],
 why:"La pression statique est piégée : l'altimètre ne voit plus de variation et reste figé. Le variomètre reste à zéro."},
{q:"Le tube de Pitot et sa purge sont obstrués. En montée, l'anémomètre :",c:["Indique une vitesse qui augmente","Indique une vitesse qui diminue","Reste figé","Indique zéro"],
 why:"La pression totale est piégée alors que la statique baisse : l'écart augmente, l'anémomètre se comporte comme un altimètre."}
]}
]});
