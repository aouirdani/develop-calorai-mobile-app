# CalorAI

Application mobile de suivi calorique par photo, construite autour de l'API REST `calorie-vision`.

| Dossier | Contenu |
| --- | --- |
| [`mobile/`](mobile/) | Application Expo SDK 57 / React Native / TypeScript (testée avec Expo Go) |
| `src/`, `index.html` | Prototype web Vite d'origine (design de référence) |

## Parcours principal

Scanner un repas → caméra → photo → écran Analyse → `POST /api/v1/estimates` (multipart) → écran Résultat (`GET /api/v1/estimates/{id}`).

Les valeurs nutritionnelles sont affichées en fourchettes (`min–max`), jamais avec une fausse précision.

## Démarrage rapide

```bash
cd mobile
npm install
cp .env.example .env      # puis renseigner les variables
npx expo start -c         # scanner le QR code avec Expo Go
npx tsc --noEmit --project tsconfig.expo.json   # vérification des types
```

## Configuration (`mobile/.env`)

| Variable | Rôle |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL du backend (ex. `http://192.168.1.20:8000`). Vide → mode mock. Sur iPhone, utiliser l'IP du Mac, pas `localhost`. |
| `EXPO_PUBLIC_API_KEY` | Envoyée dans `X-API-Key`. **Développement local uniquement.** |
| `EXPO_PUBLIC_USE_MOCK` | `true` force le mock même si une URL est définie. |

> ⚠️ **Sécurité** : les variables `EXPO_PUBLIC_*` sont embarquées en clair dans l'application.
> Ne jamais y mettre une vraie clé de production. La production devra utiliser une
> authentification utilisateur/session ou un backend gateway (BFF). Le fichier `.env` est ignoré par git.

## Documentation

Architecture, couche API (mock ⇄ réel) et gestion des fourchettes : voir [`mobile/README.md`](mobile/README.md).
