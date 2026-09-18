# CalorAI — application mobile (Expo / React Native / TypeScript)

Application iOS & Android construite **autour de l'API existante `calorie-vision`**.
Le contrat de référence est `calorie-vision/openapi.yaml` : aucun endpoint, champ ou
structure de réponse n'a été inventé au-delà de ce contrat (les rares hypothèses sont
signalées ci-dessous).

## Démarrage

```bash
npm install
cp .env.example .env     # configuration : voir README à la racine
npx expo start -c
```

> Le point d'entrée est `expo-router/entry` (`"main"` dans package.json).
> Vérification des types : `npx tsc --noEmit --project tsconfig.expo.json`.

## Architecture

```
app/                  Expo Router — écrans & navigation
  _layout.tsx         Stack racine, hydratation du store, garde onboarding
  onboarding.tsx      Objectifs + permission caméra (passable)
  (tabs)/             Barre d'onglets (bouton scan central)
    index.tsx         Aujourd'hui (dashboard)
    journal.tsx       Historique par jour
    aliments.tsx      GET /foods — recherche paginée + ajout manuel
    profil.tsx        Objectifs, unités, permissions, API, confidentialité
  scan.tsx            expo-camera + galerie + diamètre assiette + contexte
  analysis.tsx        Écran d'attente (messages génériques) pendant le POST
  barcode.tsx         Détection EAN (CameraView) + saisie manuelle (8–14 chiffres)
  result/[id].tsx     GET /estimates/{id} — détail + ajustement avant journal
components/           UI réutilisable (Button, Card, RangeText, MacroMeter, MealCard…)
services/api/         Couche API isolée (voir ci-dessous)
types/                Types TypeScript miroirs d'openapi.yaml
store/                État global persisté (goals, journal, prefs) — storage découplé
hooks/                useApiCall (loading / success / error / retry)
constants/            Thème + constantes nutrition
utils/                Formatage & arithmétique des fourchettes { estimation, min, max }
```

## Couche API — mock ⇄ réel

Les écrans ne connaissent que l'interface `ApiClient` (`services/api/types.ts`).

- `MockApiClient` (`mockClient.ts`) : données réalistes **exactement** aux structures du
  contrat (chaque valeur est `{ estimation, min, max }`), latences simulées, erreurs
  simulables (404 `produit_introuvable`, réseau coupé).
- `CalorieVisionApiClient` (`calorieVisionClient.ts`) : appels réels
  `POST /api/v1/estimates` (multipart `image`, `diametre_assiette_cm?`, `contexte?`),
  `GET /api/v1/estimates/{id}`, `POST /api/v1/estimates/barcode` `{ "code": "…" }`,
  `GET /api/v1/foods?q=…&limit&offset`, `GET /api/v1/healthz`.

Bascule : `services/api/env.ts` lit `EXPO_PUBLIC_API_URL` (+ `EXPO_PUBLIC_API_KEY` dev uniquement, `EXPO_PUBLIC_USE_MOCK`) (.env local, jamais
commité — voir `.env.example`). URL vide → mock ; URL renseignée → client réel.
Pour forcer manuellement : `createApiClient("calorie_vision", { baseUrl, getToken })`
dans `services/api/index.ts`.

**Sécurité** : aucune clé API en dur. Le token est lu via `getToken()` (SecureStore) et
devra provenir d'une future couche d'authentification.

## Fourchettes, pas des nombres simples

`NutriRange = { estimation, min, max }` traverse toute l'app. Les utilitaires
`fmtRangeSub`, `addRanges`, `scaleRange` (`utils/format.ts`) garantissent que les plages
sont affichées dès qu'elles existent et correctement sommées/mises à l'échelle — jamais
réduites silencieusement à un scalaire.

## À valider contre openapi.yaml

Points dont la forme exacte doit être confirmée dans le contrat :

1. L'enveloppe de pagination de `GET /foods` (ici : `{ aliments, total, limit, offset }`).
2. La réponse de `POST /estimates/barcode` (ici : même forme `Estimate` que la photo).
3. `score_qualite` modélisé nullable, `min`/`max` nullables quand la plage est inconnue.

## Hors périmètre (volontaire)

Pas de backend, PostgreSQL, Redis ni infra serveur dans ce projet ; pas de build EAS /
soumission stores pour l'instant (`eas build` quand la base sera validée).
