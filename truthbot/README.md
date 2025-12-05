# 🤖 TruthBot - Détecteur de Désinformation Intelligent

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-CC--BY--SA%204.0-green)
![AI4GOOD](https://img.shields.io/badge/d%C3%A9fi-AI4GOOD-orange)

**TruthBot** est un widget JavaScript pluggable qui aide à combattre la désinformation en ligne. Développé pour le défi **AI4GOOD** de la Nuit de l'Info 2024, il utilise plusieurs sources de vérification pour évaluer la fiabilité des contenus web.

---

## 🎯 Caractéristiques Principales

- ✅ **Détection au survol** : Analyse instantanée du contenu au passage de la souris
- ✅ **Multi-sources** : Combine plusieurs APIs de fact-checking pour une évaluation fiable
- ✅ **Score agrégé** : Calcule un score de fiabilité de 0 à 100 basé sur plusieurs analyseurs
- ✅ **Interface intuitive** : Tooltip rapide + modal détaillé pour les résultats
- ✅ **Facile à intégrer** : Une seule ligne de code suffit
- ✅ **Zero dépendance** : JavaScript vanilla, pas de framework requis
- ✅ **Responsive** : Fonctionne sur desktop, tablette et mobile
- ✅ **Accessible** : Compatible avec les lecteurs d'écran et navigation au clavier
- ✅ **Respect de la vie privée** : Aucune collecte de données personnelles

---

## 🚀 Installation Rapide

### Étape 1 : Télécharger les fichiers

Copiez le dossier `/truthbot` dans votre projet :

```
votre-projet/
├── index.html
└── truthbot/
    ├── truthbot.js
    ├── truthbot.css
    ├── demo.html
    └── README.md
```

### Étape 2 : Intégrer dans votre HTML

Ajoutez cette ligne juste avant la fermeture de `</body>` :

```html
<script src="truthbot/truthbot.js"></script>
```

**C'est tout !** 🎉 TruthBot est maintenant actif sur votre page.

---

## 📖 Utilisation

### Mode de Base (Sans Configuration)

TruthBot fonctionne immédiatement en mode "démo" avec l'analyseur heuristique intégré :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ma Page avec TruthBot</title>
</head>
<body>
    <h1>Mon Site Web</h1>
    <p>Votre contenu ici...</p>

    <!-- Intégration de TruthBot -->
    <script src="truthbot/truthbot.js"></script>
</body>
</html>
```

### Configuration Avancée

Pour activer l'API Google Gemini et personnaliser TruthBot :

```html
<script>
// Configuration avant le chargement du script
window.TruthBotConfig = {
    position: 'bottom-right', // Position du widget
    theme: 'nird', // Thème visuel
    apis: {
        geminiFactCheck: {
            enabled: true,
            apiKey: 'VOTRE_CLE_API_GEMINI'
        }
    },
    thresholds: {
        minTextLength: 20,
        credibilityWarning: 50,
        credibilityDanger: 30
    },
    hover: {
        delay: 500, // Délai avant activation (ms)
        enabled: true
    }
};
</script>
<script src="truthbot/truthbot.js"></script>
```

---

## 🔑 Configuration des APIs

### Google Gemini AI API (Recommandé)

L'API Google Gemini utilise l'intelligence artificielle générative pour analyser le contexte et la véracité du contenu en temps réel.

#### Obtenir une Clé API (Gratuit)

1. Visitez [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Create API Key"** ou **"Get API Key"**
4. Visitez [Google Cloud Console - Generative Language API](https://console.developers.google.com/apis/api/generativelanguage.googleapis.com)
5. Sélectionnez votre projet et cliquez sur **"ACTIVER"**
6. Copiez la clé et ajoutez-la dans la configuration TruthBot

#### Limites Gratuites

- **Quotas** : ~15 requêtes par minute (tier gratuit)
- **Tokens** : 8192 tokens max par requête
- **Coût** : Gratuit pour usage modéré
- **Modèle** : `gemini-2.5-flash` (rapide et performant)

### Analyseurs Locaux (Toujours Actifs)

Ne nécessitent aucune configuration ni API :

**🔍 Heuristique :** Patterns suspects, mots sensationnalistes, structure
**🧠 Sémantique :** Faits vérifiés, théories complotistes, sources fiables

---

## 💻 API JavaScript

### Méthodes Publiques

```javascript
// Analyser du texte manuellement
const result = await window.TruthBot.analyze("Texte à analyser...");
console.log(result.finalScore); // Score de 0 à 100

// Afficher les détails du dernier élément survolé
window.TruthBot.showDetails();

// Modifier la configuration à la volée
window.TruthBot.configure({
    hover: {
        enabled: false // Désactiver le hover
    }
});
```

### Format de Résultat

```javascript
{
    finalScore: 75,          // Score final de 0 à 100
    confidence: 85,          // Niveau de confiance de l'analyse
    reliability: {
        percentage: 75,
        ratio: "2/2 APIs",
        level: "high"        // high, medium, low, very-low
    },
    message: "✅ Contenu fiable...",
    breakdown: [             // Détails par analyseur
        {
            score: 80,
            confidence: 75,
            source: "Analyse Heuristique",
            message: "...",
            warnings: [],
            details: []
        },
        {
            score: 70,
            confidence: 85,
            source: "Gemini AI",
            message: "~ Gemini nuance : partiellement vrai",
            warnings: [],
            details: []
        }
    ],
    warnings: [],            // Liste des avertissements
    details: [],             // Détails de l'analyse
    checkedBy: 2,            // Nombre d'analyseurs utilisés
    totalCheckers: 2         // Nombre total d'analyseurs disponibles
}
```

---

## 📊 Système de Scoring

### Échelle de Fiabilité

| Score | Niveau | Icône | Description |
|-------|--------|-------|-------------|
| 70-100 | Élevé | ✅ | Contenu fiable - Informations probablement vérifiées |
| 50-69 | Moyen | ⚠️ | Contenu à vérifier - Restez prudent |
| 30-49 | Faible | ⚠️ | Contenu suspect - Vérification fortement recommandée |
| 0-29 | Très faible | ❌ | Contenu très suspect - Ne pas partager sans vérifier |

### Calcul du Score Agrégé

Le score final est calculé par moyenne pondérée des différents analyseurs :

```
Score Final = Σ(Score_i × Confiance_i) / Σ(Confiance_i)
```

Chaque analyseur contribue proportionnellement à son niveau de confiance.

---

## 🔬 Les Trois Analyseurs de TruthBot

TruthBot utilise **trois sources d'analyse complémentaires** pour évaluer la fiabilité d'un contenu. Chaque analyseur apporte une perspective unique et contribue au score final.

### 🔍 1. Analyse Heuristique (Patterns Locaux)

**Type** : Analyse locale, sans API externe
**Vitesse** : ⚡⚡⚡ Instantanée
**Confiance moyenne** : 75%

#### Ce qu'elle détecte :

**✅ Indicateurs positifs :**
- Présence de sources vérifiables (URLs, citations)
- Sources reconnues (OMS, AFP, UNESCO, institutions gouvernementales, universités)
- Structure de texte cohérente avec plusieurs phrases
- Langage neutre et factuel

**❌ Indicateurs négatifs :**
- **TEXTE EN MAJUSCULES excessives**
- Ponctuation excessive (`!!!`, `???`)
- Mots sensationnalistes : "INCROYABLE", "CHOQUANT", "URGENT", "SCANDALE"
- Clickbait : "Vous n'allez pas croire", "ILS NE VEULENT PAS QUE", "CENSURÉ"
- Absence totale de sources
- Texte trop court ou mal structuré

#### Exemple de résultat :

```javascript
{
  score: 85,
  confidence: 75,
  source: "Analyse Heuristique",
  message: "Contenu probablement fiable",
  warnings: [],
  details: [
    "2 source(s) fiable(s) détectée(s)",
    "Structure de texte cohérente"
  ]
}
```

#### Forces et Limites :

**✅ Forces :**
- Fonctionne **hors ligne** (pas d'API nécessaire)
- Très **rapide** (< 1ms)
- Détecte efficacement le **clickbait** et le sensationnalisme
- Aucun coût

**⚠️ Limites :**
- Ne vérifie pas la **véracité factuelle** du contenu
- Peut donner de faux positifs (texte neutre mais faux)
- Ne comprend pas le **contexte** ou les nuances

---

### 🧠 2. Analyse Sémantique (Base de Connaissances)

**Type** : Analyse locale avec base de faits vérifiés
**Vitesse** : ⚡⚡⚡ Instantanée
**Confiance moyenne** : 60-95% (selon les correspondances)

#### Ce qu'elle vérifie :

**📚 Base de faits scientifiques vérifiés :**
- ❌ **Faux avérés** : "terre plate", "vaccins autisme", "5g dangereux", "covid microchip"
- ✅ **Vrais avérés** : "changement climatique", organisations reconnues (OMS, AFP, Stanford)
- ⚖️ **Débattus** : Sujets scientifiquement non tranchés

**🚨 Patterns de désinformation détectés :**
- Théories complotistes : "nouvel ordre mondial", "illuminati", "grand remplacement"
- Narratifs suspects : "scientifiques cachent", "médias mentent", "big pharma"
- Rhétorique anti-institutionnelle excessive

**🏛️ Reconnaissance de sources fiables :**
- Organisations internationales (OMS, UNESCO, ONU)
- Agences de presse (AFP, Reuters)
- Publications scientifiques (Nature, Science)
- Universités reconnues (Stanford, MIT, Harvard)
- Institutions gouvernementales

#### Exemple de résultat :

```javascript
{
  score: 20,
  confidence: 95,
  source: "Analyse Sémantique",
  message: "Contenu avec des affirmations problématiques",
  warnings: [
    "Affirmation fausse détectée: \"terre plate\""
  ],
  details: [
    "La Terre est un sphéroïde - fait scientifique établi"
  ]
}
```

#### Forces et Limites :

**✅ Forces :**
- Détecte les **affirmations factuellement fausses** connues
- Identifie les **théories complotistes** courantes
- Très haute **confiance** quand il y a correspondance
- Fonctionne **hors ligne**

**⚠️ Limites :**
- Limitée aux faits **pré-enregistrés** dans la base
- Ne peut pas vérifier les **nouvelles informations**
- Base à **maintenir manuellement**
- Risque de biais dans la sélection des faits

---

### ✨ 3. Gemini AI (Intelligence Artificielle Générative)

**Type** : API Google Gemini (LLM)
**Modèle** : `gemini-2.5-flash`
**Vitesse** : ⚡⚡ Rapide (1-3 secondes)
**Confiance moyenne** : 70-95%

#### Ce qu'elle fait :

**🤖 Analyse contextuelle avancée :**
- Comprend le **sens** et le **contexte** du texte
- Évalue la **cohérence** des affirmations
- Détecte les **contradictions** internes
- Analyse le **ton** et l'**intention**
- Identifie les **biais** subtils

**📊 Critères d'évaluation :**
1. **Véracité factuelle** des affirmations
2. **Présence de sources** crédibles
3. **Langage sensationnaliste** ou émotionnel
4. **Patterns de désinformation** connus
5. **Cohérence scientifique** et logique

#### Format de réponse JSON :

```javascript
{
  score: 70,
  confidence: 85,
  source: "Gemini AI",
  verdict: "PARTIELLEMENT_VRAI",
  message: "~ Gemini nuance : partiellement vrai",
  warnings: [],
  details: [
    "Le projet 'TruthBot' a bien été développé dans le cadre du défi 'AI4GOOD'...",
    "Affirmation factuelle vérifiable (AI4GOOD)",
    "Langage neutre, non sensationnaliste"
  ]
}
```

#### Verdicts possibles :

| Verdict | Signification | Score typique |
|---------|---------------|---------------|
| `VRAI` | Affirmations vérifiées comme vraies | 75-100 |
| `PARTIELLEMENT_VRAI` | Mélange de vrai et faux, ou nuancé | 50-75 |
| `FAUX` | Affirmations vérifiées comme fausses | 0-30 |
| `IMPOSSIBLE_A_VERIFIER` | Pas assez d'informations pour juger | 40-60 |

#### Forces et Limites :

**✅ Forces :**
- Comprend le **contexte** et les **nuances**
- Analyse **sémantique avancée** via LLM
- S'adapte aux **nouvelles informations**
- Explications **détaillées** et pertinentes
- Fonctionne sur du contenu **jamais vu**

**⚠️ Limites :**
- Nécessite une **connexion internet** et une **clé API**
- **Coût** (quota gratuit limité : ~15 requêtes/minute)
- Peut parfois **halluciner** ou se tromper
- **Latence** de 1-3 secondes
- Dépend de la **qualité du modèle** Google

---

### 🎯 Complémentarité des Analyseurs

Les trois analyseurs se complètent pour offrir une analyse robuste :

```
📊 Exemple d'analyse combinée :

Texte : "INCROYABLE ! La terre est plate, les scientifiques nous cachent la vérité !"

┌─────────────────────────────────────────────────────────────┐
│ 🔍 Heuristique : 25/100 (75% confiance)                    │
│    ❌ MAJUSCULES excessives                                 │
│    ❌ Mot sensationnaliste : "INCROYABLE"                   │
│    ❌ Absence de sources                                    │
├─────────────────────────────────────────────────────────────┤
│ 🧠 Sémantique : 5/100 (95% confiance)                      │
│    ❌ Affirmation fausse : "terre plate"                    │
│    ❌ Pattern suspect : "scientifiques cachent"             │
│    📚 Explication : "La Terre est un sphéroïde"            │
├─────────────────────────────────────────────────────────────┤
│ ✨ Gemini AI : 10/100 (90% confiance)                      │
│    ❌ Verdict : FAUX                                        │
│    📝 "Théorie complotiste démentie scientifiquement"      │
│    🔍 "Langage émotionnel et sensationnaliste"             │
└─────────────────────────────────────────────────────────────┘

Score Global Agrégé : 12/100 ❌
→ "Contenu très suspect - Ne pas partager sans vérifier"
```

### ⚖️ Tableau Comparatif

| Critère | 🔍 Heuristique | 🧠 Sémantique | ✨ Gemini AI |
|---------|---------------|---------------|--------------|
| **Vitesse** | ⚡⚡⚡ (<1ms) | ⚡⚡⚡ (<1ms) | ⚡⚡ (1-3s) |
| **Précision** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Hors ligne** | ✅ Oui | ✅ Oui | ❌ Non |
| **Coût** | 💰 Gratuit | 💰 Gratuit | 💰 Gratuit (limité) |
| **API requise** | ❌ Non | ❌ Non | ✅ Oui (Gemini) |
| **Nuances** | ❌ Basique | ⚠️ Moyen | ✅ Avancé |
| **Nouveauté** | ❌ Non | ❌ Non | ✅ Oui |
| **Explications** | ⚠️ Simples | ✅ Détaillées | ✅ Très détaillées |

---

## 🧮 Calcul du Score Final

Le score final est une **moyenne pondérée** basée sur la confiance de chaque analyseur :

```javascript
// Formule de calcul
Score_Final = Σ(Score_i × Confiance_i) / Σ(Confiance_i)

// Exemple concret :
// Heuristique : 25 × 0.75 = 18.75
// Sémantique  : 5  × 0.95 = 4.75
// Gemini      : 10 × 0.90 = 9.00
// Total       : 32.50 / 2.60 ≈ 12/100
```

### Facteurs de pondération :

- Plus un analyseur est **confiant**, plus il influence le score final
- Si un analyseur échoue (API down), les autres compensent
- Minimum **1 analyseur** requis pour un résultat
- Maximum **3 analyseurs** actuellement

---

Chaque analyseur contribue proportionnellement à son niveau de confiance.

---

## 🎨 Personnalisation

### Modifier les Couleurs

Éditez le fichier `truthbot.css` pour personnaliser les couleurs :

```css
:root {
    --truthbot-primary: #2d5f3f;    /* Couleur principale */
    --truthbot-secondary: #6b9f7f;  /* Couleur secondaire */
    --truthbot-accent: #f4a261;     /* Couleur d'accent */
    /* ... */
}
```

### Changer la Position du Widget

```javascript
window.TruthBotConfig = {
    position: 'bottom-left' // ou 'bottom-right', 'top-left', 'top-right'
};
```

---

## 🧪 Tests et Démonstration

### Page de Démonstration

Ouvrez `demo.html` dans votre navigateur pour voir TruthBot en action avec différents exemples de contenu.

### Tests Locaux

1. Placez le dossier `truthbot/` dans votre serveur web local
2. Ouvrez `demo.html` dans votre navigateur
3. Survolez les exemples de texte pour voir l'analyse en temps réel
4. Cliquez sur le bouton TruthBot pour tester l'analyse manuelle

---

## 🔧 Dépannage

### Le widget n'apparaît pas

- Vérifiez que le chemin vers `truthbot.js` est correct
- Ouvrez la console du navigateur pour voir les erreurs éventuelles
- Vérifiez que le script est chargé après le DOM (ou ajoutez `defer`)

### L'analyse au survol ne fonctionne pas

- Vérifiez que `hover.enabled` est à `true` dans la configuration
- Assurez-vous que le texte survolé contient au moins 20 caractères
- Testez avec un délai de hover plus court (ex: 300ms)

### L'API Gemini ne fonctionne pas

- Vérifiez que votre clé API est valide
- Assurez-vous que l'API "Generative Language" est activée dans Google Cloud
- Vérifiez les quotas : ~15 requêtes/minute en tier gratuit
- Regardez les erreurs dans la console du navigateur (F12)
- Les analyseurs locaux (Heuristique + Sémantique) continuent de fonctionner

---

## 🌱 Dimension Éthique

TruthBot s'inscrit dans la mission d'**AI4GOOD** en utilisant l'IA de manière responsable.

### Principes Éthiques

1. **Transparence** : Les sources d'analyse sont toujours indiquées
2. **Esprit Critique** : Encourage la vérification plutôt que la confiance aveugle
3. **Pas de Censure** : Informe mais ne bloque pas l'accès au contenu
4. **Vie Privée** : Aucune collecte de données personnelles, pas de tracking
5. **Inclusivité** : Accessible à tous, gratuit, open source

### Limitations

⚠️ **TruthBot est un outil d'aide, pas une vérité absolue**

- Les analyses automatisées peuvent faire des erreurs
- Le contexte et la nuance sont difficiles à détecter pour une IA
- Les utilisateurs doivent toujours vérifier les sources eux-mêmes
- Certains contenus légitimes peuvent être marqués comme suspects

### Utilisation Responsable

- Ne pas utiliser TruthBot pour censurer ou bloquer du contenu
- Toujours fournir le contexte et les détails de l'analyse
- Encourager les utilisateurs à développer leur esprit critique
- Mettre à jour régulièrement les sources et algorithmes

---

## 📚 Documentation Technique

### Architecture

```
TruthBot
├── TruthBotEngine
│   ├── LocalAnalyzer (Analyse heuristique)
│   ├── SemanticFactCheckAnalyzer (Analyse sémantique)
│   ├── GeminiFactCheckAnalyzer (API Gemini AI)
│   └── ResultAggregator (Agrégation des résultats)
└── TruthBotUI
    ├── Widget (Bouton flottant)
    ├── Tooltip (Résultats rapides avec détail par source)
    └── Modal (Résultats détaillés)
```

### Technologies Utilisées

- **JavaScript ES6+** : Programmation orientée objet, async/await
- **CSS3** : Flexbox, Grid, animations, variables CSS
- **Canvas API** : Non utilisé actuellement (prévu pour analyse d'images)
- **Fetch API** : Requêtes HTTP vers les APIs de fact-checking

### Compatibilité Navigateurs

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

---

## 📦 Contenu du Package

```
truthbot/
├── truthbot.js       # Widget principal (complet, standalone)
├── truthbot.css      # Styles (auto-chargé par le JS)
├── demo.html         # Page de démonstration
└── README.md         # Cette documentation
```

**Taille totale** : ~80 Ko (non compressé)

---

## 🎓 Ressources Supplémentaires

### APIs de Fact-Checking et IA

- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ClaimBuster API](https://idir.uta.edu/claimbuster/)
- [Full Fact API](https://fullfact.org/)

### Éducation à l'Esprit Critique

- [AI4GOOD](https://ai4good.org)
- [UNESCO Media Literacy](https://en.unesco.org/themes/media-and-information-literacy)
- [First Draft News](https://firstdraftnews.org/)

### Lutte contre la Désinformation

- [AFP Fact Check](https://factcheck.afp.com/)
- [Décodex (Le Monde)](https://www.lemonde.fr/verification/)
- [Les Décodeurs](https://www.lemonde.fr/les-decodeurs/)

---

## 📄 Licence

Ce projet est distribué sous licence **Creative Commons BY-SA 4.0**.

Vous êtes libre de :
- **Partager** : copier et redistribuer le matériel
- **Adapter** : remixer, transformer et créer à partir du matériel

Sous les conditions suivantes :
- **Attribution** : Vous devez créditer le projet et indiquer le défi AI4GOOD
- **Partage dans les mêmes conditions** : Si vous modifiez le projet, vous devez distribuer vos contributions sous la même licence

---

## 🤝 Contribution

Ce projet a été développé pour le défi **AI4GOOD** de la Nuit de l'Info 2024.

### Équipe

- **Développement** : Équipe AI4GOOD Challenge
- **Défi** : Intelligence Artificielle et Lutte contre la Désinformation
- **Contact** : abdelghader.khadijetou@gmail.com

### Améliorations Futures

- [ ] Analyse d'images (détection de deepfakes, images manipulées)
- [ ] Support de plus d'APIs de fact-checking
- [ ] Analyse de vidéos
- [ ] Traduction multilingue
- [ ] Historique des analyses
- [ ] Export des résultats (PDF, JSON)
- [ ] Extension navigateur

---

## 🏆 Prix et Reconnaissance

**Défi AI4GOOD - Nuit de l'Info 2024**

**Lot** : Livres ou ressources en IA et éthique numérique + Certificat officiel "TruthBot"

---

## ❓ FAQ

### TruthBot fonctionne-t-il hors ligne ?

Partiellement. Les analyseurs **Heuristique** et **Sémantique** fonctionnent hors ligne, mais l'analyseur **Gemini AI** nécessite une connexion internet. Vous obtenez donc toujours au moins 2 analyses, même sans connexion.

### Les analyses sont-elles stockées quelque part ?

Non. Aucune donnée n'est envoyée à nos serveurs. Les seules requêtes sont faites vers l'API Google Gemini (si configurée). Les analyses locales (Heuristique + Sémantique) restent 100% sur votre appareil.

### Puis-je utiliser TruthBot sur un site commercial ?

Oui, sous licence CC-BY-SA 4.0, vous devez juste créditer le projet.

### Combien coûte TruthBot ?

TruthBot est **100% gratuit et open source**. L'API Gemini a un quota gratuit de ~15 requêtes/minute. Les analyseurs locaux sont illimités et gratuits.

### TruthBot bloque-t-il les fausses informations ?

Non. TruthBot informe l'utilisateur mais ne bloque jamais l'accès au contenu. L'utilisateur reste libre de ses choix.

---

## 📞 Support

- **Email** : abdelghader.khadijetou@gmail.com
- **GitHub Issues** : [Lien vers le repo]
- **Documentation** : Ce fichier README.md

---

## 🎉 Remerciements

Merci à **AI4GOOD** pour l'organisation du défi, et à tous les acteurs de la lutte contre la désinformation.

Ensemble, construisons un internet plus fiable et responsable ! 🌐✨

---

**TruthBot** - *L'intelligence artificielle au service de la vérité*

Défi AI4GOOD • Nuit de l'Info 2024
