#!/bin/bash
#
# Script de Vérification et Status du Dépôt NIRD Village
# ========================================================
#
# Ce script vérifie l'état actuel du dépôt et affiche toutes les informations
# nécessaires pour créer la branche main via l'interface web.
#

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo "================================"
echo "  NIRD Village - Status Check  "
echo "================================"
echo ""

# Fonction pour afficher avec couleur
print_status() {
    local status=$1
    local message=$2
    if [ "$status" == "ok" ]; then
        echo -e "${GREEN}✅${NC} $message"
    elif [ "$status" == "warning" ]; then
        echo -e "${YELLOW}⚠️ ${NC} $message"
    elif [ "$status" == "error" ]; then
        echo -e "${RED}❌${NC} $message"
    else
        echo -e "${BLUE}ℹ️ ${NC} $message"
    fi
}

print_header() {
    echo -e "\n${BOLD}${BLUE}═══ $1 ═══${NC}\n"
}

# 1. Vérifier la branche actuelle
print_header "Branche Actuelle"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_status "info" "Branche: ${BOLD}$CURRENT_BRANCH${NC}"

# 2. Vérifier les fichiers essentiels
print_header "Fichiers Essentiels"
check_file() {
    if [ -f "$1" ]; then
        SIZE=$(du -h "$1" | cut -f1)
        print_status "ok" "$1 ($SIZE)"
        return 0
    else
        print_status "error" "$1 - MANQUANT !"
        return 1
    fi
}

ALL_FILES_OK=true
check_file "index.html" || ALL_FILES_OK=false
check_file "script.js" || ALL_FILES_OK=false
check_file "style.css" || ALL_FILES_OK=false
check_file ".gitlab-ci.yml" || ALL_FILES_OK=false
check_file ".github/workflows/deploy.yml" || ALL_FILES_OK=false
check_file "DEPLOYMENT.md" || ALL_FILES_OK=false
check_file "GITLAB_FIX.md" || ALL_FILES_OK=false
check_file "WHY_BEHIND_MAIN.md" || ALL_FILES_OK=false
check_file "CREATE_MAIN_BRANCH.md" || ALL_FILES_OK=false
check_file "README.md" || ALL_FILES_OK=false
check_file "LICENSE" || ALL_FILES_OK=false

# 3. Vérifier l'état git
print_header "État Git"
if [ -z "$(git status --porcelain)" ]; then
    print_status "ok" "Working tree propre - aucun changement non commité"
else
    print_status "warning" "Il y a des changements non commités"
    git status --short
fi

# 4. Vérifier les branches remote
print_header "Branches Remote"
print_status "info" "Récupération des branches remote..."
git fetch --all --prune --quiet 2>/dev/null || true

echo ""
echo "Branches disponibles sur le remote :"
git branch -r | grep -v HEAD | while read branch; do
    echo "  • $branch"
done

# Vérifier si main existe sur le remote
if git branch -r | grep -q "origin/main"; then
    print_status "ok" "La branche 'main' existe déjà sur le remote"
    MAIN_EXISTS=true
else
    print_status "warning" "La branche 'main' n'existe PAS encore sur le remote"
    MAIN_EXISTS=false
fi

# 5. Afficher les derniers commits
print_header "Derniers Commits (Branche Actuelle)"
git log --oneline --decorate -5

# 6. Comparaison avec les autres branches
print_header "Comparaison des Branches"
if git branch -r | grep -q "origin/claude/minimal-version"; then
    MINIMAL_BRANCH=$(git branch -r | grep "origin/claude/minimal-version" | head -n 1 | tr -d ' ')
    echo "Branche ancienne détectée : $MINIMAL_BRANCH"
    COMMITS_AHEAD=$(git rev-list --count $MINIMAL_BRANCH..$CURRENT_BRANCH 2>/dev/null || echo "N/A")
    print_status "info" "Commits en avance sur l'ancienne branche : ${BOLD}$COMMITS_AHEAD${NC}"
fi

# 7. Vérifier la configuration CI/CD
print_header "Configuration CI/CD"

# Vérifier GitLab CI
if [ -f ".gitlab-ci.yml" ]; then
    print_status "ok" "GitLab CI configuré (.gitlab-ci.yml)"
    PAGES_JOB=$(grep -c "^pages:" .gitlab-ci.yml || echo "0")
    if [ "$PAGES_JOB" -gt 0 ]; then
        print_status "ok" "  • Job 'pages' configuré pour GitLab Pages"
    fi
    VALIDATE_JOB=$(grep -c "^validate:" .gitlab-ci.yml || echo "0")
    if [ "$VALIDATE_JOB" -gt 0 ]; then
        print_status "ok" "  • Job 'validate' configuré"
    fi
else
    print_status "error" "GitLab CI NON configuré"
fi

# Vérifier GitHub Actions
if [ -f ".github/workflows/deploy.yml" ]; then
    print_status "ok" "GitHub Actions configuré (.github/workflows/deploy.yml)"
    if grep -q "deploy-pages@v4" .github/workflows/deploy.yml; then
        print_status "ok" "  • Déploiement GitHub Pages configuré"
    fi
else
    print_status "error" "GitHub Actions NON configuré"
fi

# 8. Statistiques du projet
print_header "Statistiques du Projet"
TOTAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
print_status "info" "Taille totale du projet : ${BOLD}$TOTAL_SIZE${NC}"

if [ -f "index.html" ] && [ -f "script.js" ] && [ -f "style.css" ]; then
    HTML_LINES=$(wc -l < index.html)
    JS_LINES=$(wc -l < script.js)
    CSS_LINES=$(wc -l < style.css)
    TOTAL_LINES=$((HTML_LINES + JS_LINES + CSS_LINES))
    print_status "info" "Lignes de code :"
    echo "  • HTML : $HTML_LINES lignes"
    echo "  • JavaScript : $JS_LINES lignes"
    echo "  • CSS : $CSS_LINES lignes"
    echo "  • Total : ${BOLD}$TOTAL_LINES lignes${NC}"
fi

# 9. Actions recommandées
print_header "Actions Recommandées"

if [ "$MAIN_EXISTS" = false ]; then
    echo -e "${YELLOW}${BOLD}⚠️  ACTION REQUISE${NC}"
    echo ""
    echo "La branche 'main' n'existe pas encore sur le remote."
    echo "Vous devez la créer via l'interface web GitHub/GitLab."
    echo ""
    echo -e "${BOLD}📖 Suivez le guide :${NC} CREATE_MAIN_BRANCH.md"
    echo ""
    echo "Étapes rapides :"
    echo "  1. Aller sur GitHub/GitLab"
    echo "  2. Créer une Pull/Merge Request"
    echo "  3. Source : $CURRENT_BRANCH"
    echo "  4. Target : main (créer si nécessaire)"
    echo "  5. Merger la PR/MR"
    echo ""
else
    echo -e "${GREEN}✅ La branche main existe !${NC}"
    echo ""
    echo "Prochaines étapes :"
    echo "  1. Vérifier que main est à jour avec votre branche"
    echo "  2. Vérifier que les pipelines fonctionnent"
    echo "  3. Vérifier que les sites sont déployés"
    echo ""
fi

# 10. URLs de déploiement
print_header "URLs de Déploiement"

# Essayer de détecter le nom d'utilisateur depuis le remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$REMOTE_URL" ]; then
    print_status "info" "Remote URL : $REMOTE_URL"
    # Extraire le username si possible
    if [[ "$REMOTE_URL" =~ github.com[:/]([^/]+)/([^/.]+) ]]; then
        USERNAME="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
        echo ""
        echo -e "${BOLD}GitHub Pages (une fois main créé) :${NC}"
        echo "  https://$USERNAME.github.io/$REPO"
    fi
    if [[ "$REMOTE_URL" =~ gitlab.com[:/]([^/]+)/([^/.]+) ]]; then
        USERNAME="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
        echo ""
        echo -e "${BOLD}GitLab Pages (une fois main créé) :${NC}"
        echo "  https://$USERNAME.gitlab.io/$REPO"
    fi
fi

# 11. Résumé final
print_header "Résumé Final"

if [ "$ALL_FILES_OK" = true ] && [ "$MAIN_EXISTS" = false ]; then
    echo -e "${YELLOW}${BOLD}📋 STATUT : Prêt pour création de main${NC}"
    echo ""
    echo "Tous les fichiers sont présents et à jour."
    echo "Il ne reste qu'à créer la branche main via l'interface web."
    echo ""
    echo -e "${BOLD}→ Consultez CREATE_MAIN_BRANCH.md pour les instructions${NC}"
elif [ "$ALL_FILES_OK" = true ] && [ "$MAIN_EXISTS" = true ]; then
    echo -e "${GREEN}${BOLD}✅ STATUT : Tout est OK !${NC}"
    echo ""
    echo "Le dépôt est correctement configuré."
    echo "La branche main existe et les pipelines devraient fonctionner."
else
    echo -e "${RED}${BOLD}❌ STATUT : Des fichiers sont manquants${NC}"
    echo ""
    echo "Vérifiez les erreurs ci-dessus."
fi

echo ""
echo "================================"
echo "  Fin de la vérification"
echo "================================"
echo ""
