# Spécification : Faire l'appel (Gestion des présences)

L'objectif est d'offrir une interface très visuelle, rapide et fluide pour que le professeur puisse faire l'appel en quelques secondes, inspirée de l'expérience utilisateur de Klassly (grille d'avatars, clics rapides).

## 1. Modèle de données (Base de données)

Il est important de structurer les données pour pouvoir générer des statistiques ou des registres d'appel officiels par la suite.

**Collection `AttendanceRecord` (La session d'appel) :**
*   `id` : Identifiant unique
*   `classId` : Référence vers la classe
*   `teacherId` : Référence vers le prof qui a fait l'appel
*   `date` : Date du jour
*   `period` : Période de la journée (ex: `"MATIN"`, `"APRES_MIDI"`, ou un créneau horaire)
*   `createdAt` : Timestamp de validation

**Collection `AttendanceEntry` (Le statut de chaque élève pour un appel donné) :**
*   `id` : Identifiant unique
*   `recordId` : Référence vers la session d'appel (`AttendanceRecord`)
*   `studentId` : Référence vers l'élève
*   `status` : Enumérateur (`"PRESENT"`, `"ABSENT"`, `"LATE"`, `"EXCUSED"`)
*   `comment` : (Optionnel) Motif saisi par le prof (ex: "A raté le bus")

## 2. Logique Backend (API)

*   `POST /api/classes/{classId}/attendance` : 
    *   Sauvegarde la session d'appel globale. 
    *   *Payload attendu : `date`, `period`, et un tableau d'objets `{ studentId, status, comment }`.*
*   `PUT /api/attendance/{entryId}` : Mettre à jour le statut d'un élève (pratique si un élève noté absent finit par arriver en retard 10 minutes plus tard).
*   `GET /api/classes/{classId}/attendance` : Récupérer l'historique des appels (pour le registre).
*   `GET /api/students/{studentId}/attendance` : Récupérer les statistiques d'un élève spécifique.

## 3. Interface Utilisateur (Frontend / Vues)

**Côté Professeur (Écran d'appel) :**
*   **Affichage Trombinoscope :** Une grille avec les photos et prénoms de tous les élèves.
*   **UX Rapide (État par défaut) :** Pour gagner du temps, tous les élèves sont considérés comme "Présents" (vert) par défaut au chargement de la page.
*   **Interaction par clics successifs (Le modèle Klassly) :** 
    *   1 clic sur la carte = Passe en `Absent` (contour rouge, icône ❌).
    *   2ème clic = Passe en `Retard` (contour orange, icône ⏱️).
    *   3ème clic = Revient en `Présent` (contour vert, icône ✅).
*   **Résumé en temps réel :** Un bandeau flottant (sticky) en bas ou en haut de l'écran affichant les totaux en direct : *« 24 Présents | 2 Absents | 1 Retard »*.
*   **Validation :** Un gros bouton "Valider l'appel" qui envoie la donnée au serveur.

**Côté Élève / Parent :**
*   **Dashboard :** Un résumé visuel des absences/retards (ex: jauge ou compteur "Absences ce trimestre : 0").
*   **Notifications push/email :** (Crucial) Dès que l'appel est validé par le prof, le système détecte les statuts "Absent" ou "Retard" et envoie une alerte automatique au parent lié à l'élève.

## 4. Évolutions futures (Bonus)
*   **Justification par les parents :** Permettre aux parents d'envoyer un justificatif (mot d'absence, certificat médical en photo) directement depuis l'application suite à une notification d'absence. Le statut de l'élève passerait alors de `"ABSENT"` à `"EXCUSED"`.
*   **Génération PDF :** Export mensuel du registre d'appel au format PDF pour l'administration de l'école.
