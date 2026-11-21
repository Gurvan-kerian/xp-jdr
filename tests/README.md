# Tests

- `migration.test.js` : mise à jour des données (version 0 → 1) sur une copie anonymisée des données réelles (`fixtures/donnees-anonymisees.json`) : structure du nouveau modèle, stabilité des bonus, aller-retour de l'éditeur de race, données trop anciennes, reprise après interruption, installation vierge.
  Avec le dossier de l'ancienne version en second argument, compare les valeurs calculées avant et après, personnage par personnage :
  `node tests/migration.test.js tests/fixtures/donnees-anonymisees.json ../ancienne-version`
- `e2e.test.js` : l'appli dans un vrai navigateur (Playwright) avec un Supabase simulé : bandeau et lecture seule pour un joueur, carte et lancement de la mise à jour pour la gestion, écran Données, signalement manuel, tour de tous les écrans, rechargement, refus des données trop anciennes ; lot 2 : accueil et pictos, même page au rechargement, rang et Kanka sur la fiche, détail du calcul, libellés de Paramètres, case « inconnu » et son avertissement, rôle MJ, consigner masqué, propositions de découverte (joueur, rejet, confirmation avec session) et leurs notifications.

Installation : `npm install` puis `npx playwright install chromium`, puis `npm test`.
