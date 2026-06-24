# Injection de Sécurité `schoolKey` sur les Modèles Secondaires

**Date :** Juin 2026
**Statut :** À Implémenter
**Sujet :** Sécurisation Multi-Tenant des données périphériques de l'ERP.

---

## 1. Description du Problème
L'architecture de base de l'application a été basculée avec succès sur un modèle SaaS Multi-Tenant. Les modèles principaux (`Eleve`, `Teacher`, `Classe`, `Institution`) sont correctement cloisonnés grâce à la clé `schoolKey`. 
Cependant, lors d'un récent audit, nous avons identifié que **22 modèles secondaires** (ex: `Post`, `Event`, `HomeworkEntry`, `ReportCard`, `Appointment`) n'intégraient pas le champ `schoolKey` dans leur schéma de base de données. 

Bien que le champ `schoolKey` ait été ajouté dans les schémas via un script d'automatisation, **les routes d'API correspondantes ne l'injectent pas encore lors de la création de nouvelles données.** 
Conséquence : Si un professeur crée un devoir (HomeworkEntry), celui-ci prendra la valeur par défaut (`ecole_st_martin`) et brisera le cloisonnement Sandbox/Production.

> **Risque de fuite de données inter-Sandbox** : Sans l'injection stricte de cette clé lors du POST/PUT, les événements de calendrier, les devoirs, les paiements ou les messages d'un bac à sable "A" pourraient se retrouver dans le bac à sable "B" ou pire, en production.

## 2. Solution Proposée

Il faut auditer et modifier toutes les routes d'API de l'application gérant la création et la modification (POST/PUT) de ces modèles secondaires.

**Comportement attendu pour chaque route :**
1. Récupérer la clé d'établissement depuis les cookies de la requête (`req.cookies.get('x-school-key')?.value`).
2. Si la clé est introuvable (par exemple sur une route publique), rejeter la création avec un code 401 ou 403.
3. Injecter explicitement `schoolKey: schoolKey` dans le payload lors de l'instanciation Mongoose ou du `findOneAndUpdate`.

## 3. Routes d'API Impactées (À Auditer)

Voici la liste des fichiers de route devant être scannés et modifiés :

### Pédagogie & Absences
- `app/api/classes/[id]/homework/route.js` (Modèles : `HomeworkEntry`, `HomeworkCompletion`)
- `app/api/classes/[id]/report-cards/generate/route.js` (Modèle : `ReportCard`)
- `app/api/classes/[id]/attendance/route.js` (Modèles : `AttendanceEntry`, `AttendanceRecord`)
- `app/api/classes/[id]/classbook/route.js` (Modèles : `ClassBook`, `StudentBook`)

### Communication & Événements
- `app/api/events/route.js` (Modèle : `Event`)
- `app/api/global/feed/route.js` (Modèle : `Post`)
- `app/api/groups/[id]/feed/route.js` (Modèle : `Post`)
- `app/api/groups/[id]/chat/route.js` (Modèle : `GroupMessage`)
- `app/api/conversations/[id]/messages/route.js` (Modèle : `Message`, `Conversation`)
- `app/api/articles/route.js` (Modèle : `Article`)

### Administratif & Divers
- `app/api/appointments/route.js` (Modèle : `Appointment`)
- `app/api/points/award/route.js` (Modèles : `PointTransaction`, `PointLabel`)
- `app/api/gallery/route.js` (Modèle : `MediaAlbum`, `ClassMedia`)

## 4. Plan de Vérification

1. Lancer l'application localement.
2. Basculer sur une Sandbox (qui modifie le cookie `x-school-key`).
3. Créer un nouvel événement de calendrier, un article de blog, ou attribuer un bon point.
4. Vérifier directement dans MongoDB Compass que le document nouvellement créé possède bien le champ `schoolKey` avec la valeur de la Sandbox (ex: `sandbox_4f8d2`), et non la valeur de fallback.
