#!/bin/bash

set -e

echo "=========================================="
echo " DEV3 AUTO-SYNC → MAIN"
echo "=========================================="

cd /var/www/tatovacesta_dev3

echo
echo "1) Kontrola pracovního stromu..."

if [ -n "$(git status --porcelain)" ]; then
    echo "CHYBA: Pracovní strom obsahuje necommitnuté změny."
    echo
    git status --short
    echo
    echo "AUTO-SYNC SE ZASTAVUJE."
    exit 1
fi

echo
echo "2) Aktualizace GitHub referencí..."

git fetch origin --prune

echo
echo "3) Přepnutí na main..."

git switch main

echo
echo "4) Záloha aktuálního main..."

BACKUP_TAG="backup-before-auto-sync-$(date +%Y%m%d-%H%M%S)"

git tag "$BACKUP_TAG"
git push origin "$BACKUP_TAG"

echo "Backup tag: $BACKUP_TAG"

echo
echo "5) Aktualizace main z GitHubu..."

git pull --ff-only origin main

echo
echo "6) Kontrola lokálních větví..."

BRANCHES=$(git for-each-ref --format="%(refname:short)" refs/heads/ | grep -v "^main$" || true)

for BRANCH in $BRANCHES; do

    COUNT=$(git rev-list --count main.."$BRANCH")

    if [ "$COUNT" -gt 0 ]; then

        echo
        echo "------------------------------------------"
        echo "NALEZENA VĚTEV: $BRANCH"
        echo "Nové commity: $COUNT"
        echo "------------------------------------------"

        git log --oneline --decorate main.."$BRANCH"

        echo
        echo "Provádím merge $BRANCH → main..."

        if ! git merge --no-ff "$BRANCH" \
            -m "merge: sync $BRANCH into main"; then

            echo
            echo "=========================================="
            echo " STOP – KONFLIKT PŘI MERGE"
            echo "=========================================="

            git status

            echo
            echo "AUTO-SYNC SE ZASTAVILO."
            echo
            echo "Konflikt vyřeš ručně."
            echo "Poté:"
            echo
            echo "git add ."
            echo "git commit"
            echo "git push origin main"

            exit 1
        fi
    fi

done

echo
echo "7) Kontrola výsledného main..."

echo
echo "LOCAL HEAD:"
git rev-parse main

echo
echo "ORIGIN/MAIN:"
git rev-parse origin/main

echo
echo "STATUS:"
git status --short --branch

echo
echo "8) Posledních 15 commitů:"

git log --oneline --decorate -15

echo
echo "9) Push main → GitHub..."

git push origin main

echo
echo "10) Finální synchronizace..."

git fetch origin

LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)

echo
echo "LOCAL main : $LOCAL"
echo "REMOTE main: $REMOTE"

if [ "$LOCAL" != "$REMOTE" ]; then

    echo
    echo "=========================================="
    echo " CHYBA – MAIN NENÍ SYNCHRONIZOVANÝ"
    echo "=========================================="

    exit 1
fi

echo
echo "=========================================="
echo " AUTO-SYNC ÚSPĚŠNĚ DOKONČEN"
echo "=========================================="

echo
echo "MAIN je synchronizovaný s GitHubem."
echo
echo "Commit:"
echo "$LOCAL"
echo
echo "Backup tag:"
echo "$BACKUP_TAG"
echo
echo "Nyní můžeš aktualizovat update-prod3."
echo
