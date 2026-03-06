# 📋 Chemin Critique CI/CD — Du Code Local à la Production

## 🗺️ Flux Global

```
💻 LOCAL  ──►  🔀 PULL REQUEST  ──►  🔨 BUILD & TESTS  ──►  🚀 STAGING  ──►  ✅ GO/NO-GO  ──►  🌍 PRODUCTION
```

---

## 1 — 💻 Développement Local `🖐️ Manuel`

- Créer une branche : `git checkout -b feature/nom-feature`
- Écrire le code, lancer les tests : `npm test` / `pytest`
- Vérifier le linting, puis commiter : `git commit -m "feat: description"`

---

## 2 — 🔀 Pull Request & Revue de Code `🖐️ Manuel`

- Pousser la branche et ouvrir une **Pull Request**
- Faire relire le code par un collègue
- Intégrer les retours, obtenir l'approbation, merger dans `main`

---

## 3 — 🔨 Build & Tests Automatisés `⚙️ Automatique`

Déclenché automatiquement à chaque merge sur `main` :

- Compilation et création de l'artefact (`docker build`)
- Exécution des tests unitaires et d'intégration
- Scan de sécurité et analyse de couverture de code
- Push de l'image dans le registry (`docker push`)

> 🖐️ **Si le pipeline échoue :** consulter les logs, corriger localement, re-pousser.

---

## 4 — 🚀 Déploiement sur Staging `⚙️ Automatique + 🖐️ Manuel`

- L'artefact est déployé automatiquement sur l'environnement de staging
- 🖐️ Tester manuellement les fonctionnalités clés
- 🖐️ Vérifier les logs et métriques
- 🖐️ Obtenir la **validation du Product Owner**

---

## 5 — ✅ Go / No-Go Pré-Production `🖐️ Manuel`

Checklist à valider avant tout déploiement en production :

- [ ] Pipeline CI/CD entièrement vert
- [ ] Tests de staging validés sans régression
- [ ] Approbation DevOps + responsable technique ✍️
- [ ] Plan de rollback prêt
- [ ] Backup BDD réalisé (si migration)

> ⚠️ **Une case non cochée = NO-GO. Déploiement reporté.**

---

## 6 — 🌍 Déploiement en Production `🖐️ Manuel`

- Déclencher le déploiement (bouton pipeline ou commande)
- Vérifier les **health checks** : `curl https://api.prod.com/health`
- Valider les **smoke tests** (3-5 flows critiques)
- Surveiller les logs et métriques pendant 1-2 heures
- Notifier les équipes : *"v1.3.0 déployée ✅"*

### 🚨 Rollback si problème
```bash
kubectl rollout undo deployment/app
```

---

## 📊 Récapitulatif

| Étape | Type | Responsable |
|-------|------|-------------|
| Développement & commit | 🖐️ Manuel | Développeur |
| Pull Request & revue | 🖐️ Manuel | Dev + Pair |
| Build & tests | ⚙️ Automatique | Pipeline CI/CD |
| Déploiement staging + validation | ⚙️ + 🖐️ | DevOps + Product Owner |
| Go / No-Go | 🖐️ Manuel | DevOps + Tech Lead |
| Déploiement production | 🖐️ Manuel | DevOps |

---

> 📝 **Règle d'or :** Tout ce qui peut être automatisé **doit** l'être. Tout ce qui reste manuel **doit** être documenté.

**Dernière mise à jour :** 6 mars 2026
