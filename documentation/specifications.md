# Cahier des charges - Application de chat bancaire
## Vue d'ensemble

Application de messagerie permettant aux clients de communiquer avec des conseillers bancaires via un système de chat simple.
Rôles utilisateurs
### 👤 Client

    Utilisateur final de la banque
    Peut créer un compte
    Peut initier des discussions
    Peut envoyer des messages tant que le chat n'est pas clôturé

### 🧑‍💼 Conseiller

    Employé de la banque
    Peut prendre en charge les chats en attente
    Peut répondre aux clients
    Peut clôturer les conversations

### États d'un chat

EN_ATTENTE → EN_COURS → CLOTURE

- EN_ATTENTE : Chat créé par le client, en attente d'un conseiller
- EN_COURS : Chat pris en charge par un conseiller, discussion active
- CLOTURE : Chat terminé, lecture seule

    ⚠️ Transitions unidirectionnelles uniquement - aucun retour en arrière possible

## Règles de gestion (RG)
### Authentification & Comptes

- RG1 : Authentification obligatoire pour accéder à l'application
- RG2 : Un utilisateur = un seul rôle (Client OU Conseiller)
- RG3 : Un client peut créer plusieurs chats distincts

### Création de chat

- RG4 : Un client peut créer un chat sans conseiller assigné
- RG5 : À la création, le chat est automatiquement en état EN_ATTENTE
- RG6 : Le client peut envoyer des messages même sans conseiller assigné

### Prise en charge

- RG7 : Un seul conseiller peut prendre en charge un chat
- RG8 : L'assignation du conseiller est définitive
- RG9 : La prise en charge fait passer le chat en état EN_COURS
- RG10 : Les autres conseillers ne peuvent pas intervenir sur ce chat

### Discussion active

- RG11 : Seuls le client et le conseiller assigné peuvent envoyer des messages
- RG12 : Tous les messages sont conservés dans l'historique
- RG13 : Impossible de changer de conseiller une fois assigné

### Clôture

- RG14 : Seul le conseiller assigné peut clôturer le chat
- RG15 : La clôture fait passer le chat en état CLOTURE
- RG16 : Aucun message ne peut être envoyé après clôture
- RG17 : L'historique reste consultable en lecture seule

### Restrictions

- RG18 : Un client ne peut pas rouvrir un chat clôturé
- RG19 : Un conseiller ne peut pas réassigner un chat
- RG20 : Aucun transfert de chat entre conseillers

## Cas d'utilisation

- UC-01 : Créer un compte

      Acteur : Client
      Flux : Saisie informations → Création compte → Accès connexion

- UC-02 : Se connecter

      Acteurs : Client, Conseiller
      Flux : Saisie identifiants → Validation → Accès espace utilisateur
 
- UC-03 : Démarrer un chat

      Acteur : Client (authentifié)
      Flux : Clic "Démarrer un chat" → Création chat → État EN_ATTENTE
- UC-04 : Envoyer un message (chat en attente)

Acteur : Client
Prérequis : Chat en état EN_ATTENTE
Flux : Saisie message → Enregistrement → Affichage dans historique
- UC-05 : Prendre en charge un chat

Acteur : Conseiller (authentifié)
Prérequis : Chat en état EN_ATTENTE
Flux : Sélection chat → Assignation → État EN_COURS
- UC-06 : Discuter avec un client

Acteurs : Client, Conseiller
Prérequis : Chat en état EN_COURS
Flux : Envoi message → Enregistrement → Affichage bilatéral
- UC-07 : Clôturer un chat

Acteur : Conseiller assigné
Prérequis : Chat en état EN_COURS
Flux : Clic "Clôturer" → Fermeture → État CLOTURE
- UC-08 : Consulter un chat clôturé

Acteurs : Client, Conseiller
Prérequis : Chat en état CLOTURE
Flux : Ouverture chat → Affichage historique (lecture seule)
Modèle de données (suggéré)
Utilisateur

- id
- email
- mot_de_passe (hashé)
- role (CLIENT | CONSEILLER)
- nom
- prenom
- date_creation

Chat

- id
- client_id (référence Utilisateur)
- conseiller_id (référence Utilisateur, nullable)
- etat (EN_ATTENTE | EN_COURS | CLOTURE)
- date_creation
- date_prise_en_charge (nullable)
- date_cloture (nullable)

Message

- id
- chat_id (référence Chat)
- auteur_id (référence Utilisateur)
- contenu
- date_envoi

Validations techniques à implémenter
Sur l'envoi de message

SI chat.etat == CLOTURE
  ALORS rejeter avec erreur "Chat clôturé"

SI chat.etat == EN_COURS
  ET auteur NOT IN [chat.client_id, chat.conseiller_id]
  ALORS rejeter avec erreur "Non autorisé"

SI chat.etat == EN_ATTENTE
  ET auteur != chat.client_id
  ALORS rejeter avec erreur "Non autorisé"

Sur la prise en charge

SI chat.etat != EN_ATTENTE
  ALORS rejeter avec erreur "Chat déjà pris en charge"

SI auteur.role != CONSEILLER
  ALORS rejeter avec erreur "Rôle insuffisant"

Sur la clôture

SI chat.etat != EN_COURS
  ALORS rejeter avec erreur "Chat non actif"

SI auteur.id != chat.conseiller_id
  ALORS rejeter avec erreur "Vous n'êtes pas le conseiller assigné"

Fonctionnalités attendues
Pour le client

    Création de compte
    Connexion
    Démarrage de nouveau chat
    Envoi de messages
    Consultation de l'historique de ses chats
    Visualisation de l'état du chat

Pour le conseiller

    Connexion
    Liste des chats en attente
    Prise en charge d'un chat
    Envoi de messages
    Clôture d'un chat
    Consultation de ses chats en cours et clôturés

Interface utilisateur (suggestions)
Client

    Page d'accueil avec bouton "Démarrer une discussion"
    Liste de ses chats avec badges d'état
    Interface de chat avec indication de l'état
    Désactivation de l'input si chat clôturé

Conseiller

    Dashboard avec compteur de chats en attente
    Liste des chats en attente (avec bouton "Prendre en charge")
    Liste de ses chats en cours
    Interface de chat avec bouton "Clôturer la conversation"
    Historique des chats clôturés

Workflow simplifié

1. Client crée un compte et se connecte
2. Client démarre un chat → [EN_ATTENTE]
3. Client peut envoyer des messages
4. Conseiller se connecte
5. Conseiller prend en charge le chat → [EN_COURS]
6. Client et conseiller échangent
7. Conseiller clôture le chat → [CLOTURE]
8. Chat consultable en lecture seule

Points clés pour l'implémentation

    ✅ Pas de logique d'optimisation ou d'intelligence artificielle
    ✅ Pas de réassignation ou transfert
    ✅ Pas de réouverture de chat
    ✅ Validation stricte des transitions d'état
    ✅ Vérification systématique des autorisations
    ✅ Conservation complète de l'historique

