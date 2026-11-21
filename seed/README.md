# Données de départ (hors du code chargé)

Depuis le lot Socle (version des données 1), l'appli ne contient plus de données de jeu : tout est lu dans Supabase.

- `legacy/data.js` et `legacy/kanka.js` : anciennes données de départ (tableur « Synthèse des races », doc « Fiches de race », relevé Kanka, effets préremplis, 22 secrets, créatures), au format d'avant le Socle. Elles ne sont plus chargées par `index.html`.
- Le jeu de départ du kit de déploiement vierge sera produit au format de la version 1 avec le lot « Kit de déploiement vierge ».
