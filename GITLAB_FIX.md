# 🔧 Correction Pipeline GitLab - Guide Rapide

## ✅ Ce qui a été fait

### 1. Configuration GitLab CI/CD créée (`.gitlab-ci.yml`)
- ✅ Job de validation pour vérifier les fichiers
- ✅ Job de déploiement GitLab Pages optimisé
- ✅ Vérifications d'erreur avancées
- ✅ Messages de debug détaillés
- ✅ Support branches `main` et `claude/*`

### 2. Configuration GitHub Actions mise à jour
- ✅ Support de toutes les branches `claude/**`
- ✅ Déploiement automatique sur push

### 3. Documentation complète
- ✅ `DEPLOYMENT.md` - Guide de déploiement complet
- ✅ `GITLAB_FIX.md` - Ce fichier de correction

---

## 🚨 Pour corriger la pipeline rouge sur `main`

### Étape 1 : Créer/Mettre à jour la branche main

**Option A : Via l'interface GitLab (Recommandé)**
1. Aller sur GitLab : Repository > Branches
2. Cliquer sur "New branch" ou "Merge Request"
3. Créer une Merge Request de `claude/worm-simulation-01WMmVwHRTtiajrT4ybmZGHD` vers `main`
4. Approuver et merger

**Option B : Ligne de commande (nécessite permissions)**
```bash
# Depuis la branche actuelle
git checkout -b main
git push origin main --force-with-lease

# ⚠️ Attention : --force-with-lease n'utiliser que si vous êtes sûr!
```

**Option C : Via Pull Request GitHub**
Si le projet est mirroré sur GitHub :
1. Créer une PR vers main sur GitHub
2. Merger la PR
3. GitLab synchronisera automatiquement

---

## 🔍 Diagnostic Pipeline Rouge

### Vérifier les logs GitLab CI

1. **Aller sur GitLab** :
   - `CI/CD` > `Pipelines`
   - Cliquer sur la pipeline rouge
   - Cliquer sur le job qui a échoué

2. **Erreurs communes et solutions** :

#### ❌ Erreur: "index.html not found"
**Cause** : Fichiers manquants dans le repo
**Solution** :
```bash
# Vérifier les fichiers
ls -la index.html style.css script.js

# Si manquants, les copier depuis cette branche
git checkout claude/worm-simulation-01WMmVwHRTtiajrT4ybmZGHD -- index.html style.css script.js
git commit -m "fix: Add missing files"
git push origin main
```

#### ❌ Erreur: "pages job not found"
**Cause** : `.gitlab-ci.yml` manquant ou mal configuré
**Solution** :
```bash
# Copier le fichier de configuration
git checkout claude/worm-simulation-01WMmVwHRTtiajrT4ybmZGHD -- .gitlab-ci.yml
git commit -m "fix: Add GitLab CI configuration"
git push origin main
```

#### ❌ Erreur: "Permission denied"
**Cause** : GitLab Pages non activé ou permissions insuffisantes
**Solution** :
1. Aller sur GitLab: `Settings` > `General` > `Visibility`
2. Activer "Pages" (doit être public ou internal)
3. Aller sur `Settings` > `CI/CD` > `Variables`
4. Vérifier qu'aucune variable ne bloque le déploiement

#### ❌ Erreur: "No artifacts"
**Cause** : Le dossier `public/` n'est pas créé
**Solution** : La nouvelle config `.gitlab-ci.yml` corrige ce problème automatiquement

#### ❌ Erreur: "Failed to parse .gitlab-ci.yml"
**Cause** : Syntaxe YAML invalide
**Solution** :
1. Utiliser le validateur GitLab: `CI/CD` > `Editor`
2. Copier le contenu de `.gitlab-ci.yml` depuis cette branche
3. Valider la syntaxe avant de commit

---

## 📋 Checklist de vérification

Avant de merger vers main, vérifier que :

- [ ] Tous les fichiers sont présents :
  ```bash
  test -f index.html && test -f style.css && test -f script.js && echo "✅ OK"
  ```

- [ ] Le fichier `.gitlab-ci.yml` existe :
  ```bash
  test -f .gitlab-ci.yml && echo "✅ OK"
  ```

- [ ] La syntaxe YAML est valide :
  ```bash
  # Aller sur GitLab CI/CD > Editor et coller le contenu
  ```

- [ ] GitLab Pages est activé :
  - `Settings` > `Pages` doit montrer "Access pages"

- [ ] Les permissions sont correctes :
  - `Settings` > `CI/CD` > `Variables` configurées
  - Pas de branch protection qui bloque le push

---

## 🎯 Après le merge vers main

Une fois mergé, la pipeline devrait :

1. ✅ Exécuter le job `validate` (vérification fichiers)
2. ✅ Exécuter le job `pages` (déploiement)
3. ✅ Créer les artifacts dans `public/`
4. ✅ Déployer sur GitLab Pages

**Accéder au site** :
- URL : `https://<username>.gitlab.io/sujet-national`
- Ou dans GitLab : `Settings` > `Pages`

---

## 🆘 Si la pipeline est toujours rouge après ces corrections

### Option 1 : Relancer la pipeline
```bash
# Dans GitLab CI/CD > Pipelines
# Cliquer sur "Retry" pour relancer
```

### Option 2 : Debug en local
```bash
# Tester les commandes localement
mkdir -p public
cp index.html public/
cp style.css public/
cp script.js public/
ls -la public/

# Si ça fonctionne localement, c'est un problème GitLab
```

### Option 3 : Déclencher manuellement
```bash
# Dans GitLab : CI/CD > Pipelines
# Cliquer "Run pipeline"
# Choisir la branche "main"
# Cliquer "Run"
```

### Option 4 : Vérifier les runners
```bash
# Dans GitLab : Settings > CI/CD > Runners
# S'assurer qu'au moins un runner est disponible
# Si aucun runner : contacter l'administrateur GitLab
```

---

## 📞 Support

**Logs détaillés** :
- La nouvelle configuration affiche des logs complets
- Chercher les émojis pour identifier rapidement :
  - 🚀 = Démarrage
  - ✅ = Succès
  - ❌ = Erreur
  - ⚠️ = Avertissement

**Commandes utiles** :
```bash
# Voir les branches
git branch -a

# Voir les commits récents
git log --oneline -10

# Comparer avec une autre branche
git diff main..claude/worm-simulation-01WMmVwHRTtiajrT4ybmZGHD

# Afficher la config GitLab CI
cat .gitlab-ci.yml
```

---

## ✨ Contenu déployé

Le site inclut toutes ces fonctionnalités impressionnantes :
- 🦠 Simulation de vers informatiques en temps réel
- 🔬 Laboratoire interactif avec graphiques
- 🎮 Système de gamification (badges, points, CO₂)
- ⚔️ Quiz NIRD interactif
- 📊 Statistiques et visualisations avancées

**Taille totale** : ~70 KB (très léger!)
- index.html : ~22 KB
- script.js : ~23 KB
- style.css : ~17 KB

---

**🎉 Bon déploiement !**
