# Learning IFR

Application web installable (PWA) de préparation théorique IFR et ATPL :
fiche mémo par bloc, entraînement en calcul mental ou en QCM, mode voix (questions lues, réponses dictées).

## Structure

- `index.html` : moteur et interface
- `modules/` : un fichier par matière (`LI.register({...})`)
- `sw.js` : cache hors ligne (lister chaque module dans `SHELL` et changer `VERSION` à chaque mise à jour)

## Ajouter un module

```js
LI.register({
  id: '050', code: '050', kind: 'atpl', title: 'Météorologie', intro: '…',
  blocks: [{
    id: '050-nuages', title: 'Nuages',
    memo: `<h3>…</h3><dl><dt>…</dt><dd>…</dd></dl>`,
    bank: [{ q: 'Question ?', c: ['Bonne réponse', 'Fausse', 'Fausse', 'Fausse'], why: 'Explication' }],
    gens: [ () => ({ t, q, u, a, ok, s, tip }) ]   // problèmes de calcul générés
  }]
});
```

Puis ajouter `<script src="modules/xxx.js">` dans `index.html` et le fichier dans `sw.js`.
