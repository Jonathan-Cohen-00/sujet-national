# Guide de Déploiement

## 🚀 Déploiement GitLab Pages

### Configuration GitLab CI/CD

Le fichier `.gitlab-ci.yml` est maintenant configuré pour déployer automatiquement sur GitLab Pages.

#### Fonctionnalités :
- ✅ Déploiement automatique sur GitLab Pages
- ✅ Support des branches `main` et `claude/*`
- ✅ Copie automatique de tous les fichiers nécessaires
- ✅ Artifacts conservés pendant 30 jours

### Pour activer le déploiement sur la branche main :

#### Option 1 : Via Pull Request (Recommandé)
1. Créer une Pull/Merge Request de `claude/worm-simulation-01WMmVwHRTtiajrT4ybmZGHD` vers `main`
2. Approuver et merger la PR
3. GitLab CI déclenchera automatiquement le déploiement

#### Option 2 : Merge local (nécessite permissions)
```bash
# Créer la branche main si elle n'existe pas
git checkout -b main claude/worm-simulation-01WMmVwHRTtiajrT4ybmZGHD

# Pousser vers le remote
git push origin main
```

### Vérification du déploiement

Une fois la pipeline terminée :
- Aller dans **Settings > Pages** dans GitLab
- L'URL de votre site sera affichée (généralement: `https://username.gitlab.io/sujet-national`)

### Structure des artifacts

Le job `pages` crée un dossier `public/` contenant :
- `index.html` - Page principale
- `style.css` - Styles
- `script.js` - JavaScript avec toutes les fonctionnalités
- `README.md` - Documentation
- `LICENSE` - Licence du projet

### Branches supportées

La pipeline se déclenche sur :
- Branche `main`
- Toutes les branches `claude/*`
- Déclenchement manuel via l'interface GitLab

### Troubleshooting

#### Pipeline rouge / échec du déploiement

**Problème 1 : Fichiers manquants**
- Vérifier que tous les fichiers (index.html, style.css, script.js) existent à la racine
- Vérifier les logs de la pipeline dans GitLab CI/CD > Pipelines

**Problème 2 : Permissions**
- S'assurer que GitLab Pages est activé pour le projet
- Vérifier dans Settings > General > Visibility que Pages est public ou internal

**Problème 3 : Artifacts non créés**
- Le dossier `public/` doit être créé et contenir au moins un fichier HTML
- Vérifier dans les logs du job que la commande `cp` réussit

**Problème 4 : Branch protection**
- Si la branche `main` est protégée, utiliser une Pull Request
- Ou ajuster les permissions dans Settings > Repository > Protected Branches

### GitHub Pages (déjà configuré)

Le fichier `.github/workflows/deploy.yml` est aussi configuré pour GitHub Pages et fonctionne en parallèle.

---

## 📊 Contenu déployé

Le site déployé inclut :

### 🦠 Simulation de Vers
- Simulation en temps réel avec Canvas
- Comparaison réseau vulnérable vs NIRD
- Statistiques live de propagation

### 🔬 Laboratoire Interactif
- Graphiques d'impact environnemental
- Comparaisons économiques
- Métriques de sécurité
- Jauge d'autonomie

### 🎮 Système de Gamification
- 8 badges débloquables
- Système de points
- Compteur CO₂
- Toast notifications

### ⚔️ Quiz NIRD
- Questions interactives
- Feedback instantané
- Score et progression

---

**Pour toute question, consultez les logs GitLab CI ou les issues GitHub.**
