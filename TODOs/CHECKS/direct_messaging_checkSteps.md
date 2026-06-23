# Vérification : Messagerie Directe (direct_messaging)

Ce fichier sert de checklist pour vérifier l'implémentation complète de la spécification.

- [ ] Les modèles MongoDB `Conversation` et `Message` sont créés.
- [ ] Le backend (`/api/conversations`, `/api/messages`) gère correctement la sécurité (lecture uniquement si on est participant).
- [ ] Le composant UI `ChatWindow` est intégré pour les élèves (sur leur profil/espace).
- [ ] Le composant UI `ChatWindow` est intégré pour les parents (sur le Dashboard Parent).
- [ ] Le type de conversation (`STUDENT_TEACHER` vs `PARENT_TEACHER`) est correctement assigné.
- [ ] L'enseignant (Prof) dispose d'une "Boîte de réception" (Inbox) pour voir et répondre à tous ses messages, triés par "Élèves" et "Parents".
