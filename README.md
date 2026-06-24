# La Cartographie du Goût

**La carte de ce que tu aimes — et la chose juste au-delà.**

Cartographie ton goût comme un ciel étoilé. Tu places ce que tu connais ; la carte
dessine elle-même ses axes ; puis elle te montre **l'inconnu adjacent** — la chose juste
au bord de ton amas, pas un sosie de ce que tu adores déjà.

Live: https://la-cartographie.netlify.app

---

## Comment ça marche

1. **Choisis un domaine** — films, vins nature, riffs de guitare, polices, cafés, romans…
   tout ce qui a un goût.
2. **Place ce que tu connais** — le *premier* objet d'un domaine fait définir par Claude
   4 à 6 **axes perceptuels** (tempo, chaleur, sauvagerie, abstraction…), puis l'y situe.
   Chaque objet devient une étoile, colorée par ton appréciation (coup de cœur = or,
   j'aime = sarcelle, bof = ardoise, non = rouille).
3. **Lis la carte** — choisis quelle paire d'axes projeter (X / Y). Ton **centre de goût**
   (centroïde pondéré) brille au milieu ; tes coups de cœur se relient en constellation.
4. **Trouve l'inconnu adjacent** — quand la carte est assez fournie, Claude propose UNE
   œuvre **réelle et correctement attribuée** qui t'étire sur exactement un axe.
   Règle d'honnêteté : jamais d'œuvre inventée. Essayé ? Note-la, elle rejoint la carte.

Tout reste sur ton appareil (Dexie / IndexedDB). FR-first, EN au choix.

---

## Stack

Vite + React 19 + TypeScript + Tailwind v3 + Dexie. Deux fonctions Netlify qui appellent
l'API Claude (`claude-opus-4-8`) en *forced tool-use*, streamées en NDJSON :

- `POST /api/chart` — définit/réutilise les axes d'un domaine et place un objet.
- `POST /api/discover` — propose l'inconnu adjacent à partir de ta carte.

Identité visuelle : atlas céleste — Bodoni Moda + Manrope + IBM Plex Mono, nuit profonde,
ivoire gravé, or pour l'amour et rose lumineux pour la découverte.

## Lancer en local

```bash
npm install
# pour les fonctions IA : crée un .env avec CLAUDE_API_KEY=...  (déjà gitignoré)
npm run dev          # netlify dev (sert /api + Vite)
npm run build        # tsc -b && vite build
```

> Note : `netlify dev` ne sert les fonctions que si le projet est **lié** à un site
> Netlify (`netlify link`). Sans lien, les routes `/api/*` renvoient 404.

---

© 2026 Jacques Gautreau · part of the Atelier.
