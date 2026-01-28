# Documentation des routes API - Application de chat bancaire

## 🔐 Authentification

### `POST /api/auth/register`
**Description :** Création d'un compte client  
**Accès :** Public  
**Body :**
```json
{
  "email": "client@example.com",
  "password": "motdepasse123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "CLIENT"
}
```
**Réponse 201 :**
```json
{
  "id": "uuid",
  "email": "client@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "CLIENT"
}
```
**Cas d'usage :** UC-01

---

### `POST /api/auth/login`
**Description :** Connexion (client ou conseiller)  
**Accès :** Public  
**Body :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```
**Réponse 200 :**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CLIENT",
    "firstName": "Jean",
    "lastName": "Dupont"
  }
}
```
**Cas d'usage :** UC-02

---

### `POST /api/auth/logout`
**Description :** Déconnexion  
**Accès :** Authentifié  
**Réponse 200 :**
```json
{
  "message": "Déconnexion réussie"
}
```

---

## 💬 Gestion des chats

### `POST /api/chats`
**Description :** Créer un nouveau chat  
**Accès :** CLIENT authentifié  
**Body :**
```json
{
  "initialMessage": "Bonjour, j'ai besoin d'aide avec mon compte"
}
```
**Réponse 201 :**
```json
{
  "id": "uuid",
  "status": "WAITING",
  "clientId": "uuid",
  "advisorId": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "takenAt": null,
  "closedAt": null
}
```
**Règles :** RG4, RG5  
**Cas d'usage :** UC-03

---

### `GET /api/chats`
**Description :** Liste des chats de l'utilisateur connecté  
**Accès :** Authentifié  
**Query params :**
- `status` : `WAITING` | `IN_PROGRESS` | `CLOSED` (optionnel)
- `page` : numéro de page (défaut: 1)
- `limit` : nombre par page (défaut: 20)

**Réponse 200 (CLIENT) :**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "IN_PROGRESS",
      "createdAt": "2024-01-15T10:30:00Z",
      "takenAt": "2024-01-15T10:35:00Z",
      "closedAt": null,
      "advisor": {
        "id": "uuid",
        "firstName": "Marie",
        "lastName": "Martin"
      },
      "lastMessage": {
        "content": "Je regarde ça tout de suite",
        "sentAt": "2024-01-15T10:36:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

**Réponse 200 (ADVISOR) :**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "IN_PROGRESS",
      "createdAt": "2024-01-15T10:30:00Z",
      "takenAt": "2024-01-15T10:35:00Z",
      "client": {
        "id": "uuid",
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "lastMessage": {
        "content": "Merci pour votre aide",
        "sentAt": "2024-01-15T10:40:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12
  }
}
```

---

### `GET /api/chats/waiting`
**Description :** Liste des chats en attente de prise en charge  
**Accès :** ADVISOR authentifié  
**Query params :**
- `page` : numéro de page (défaut: 1)
- `limit` : nombre par page (défaut: 20)

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "WAITING",
      "createdAt": "2024-01-15T11:00:00Z",
      "client": {
        "id": "uuid",
        "firstName": "Sophie",
        "lastName": "Bernard"
      },
      "messagesCount": 2,
      "firstMessage": "Bonjour, j'ai une question sur..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8
  }
}
```
**Cas d'usage :** UC-05

---

### `GET /api/chats/:chatId`
**Description :** Détails d'un chat spécifique  
**Accès :** Authentifié (client propriétaire OU conseiller assigné)  
**Réponse 200 :**
```json
{
  "id": "uuid",
  "status": "IN_PROGRESS",
  "createdAt": "2024-01-15T10:30:00Z",
  "takenAt": "2024-01-15T10:35:00Z",
  "closedAt": null,
  "client": {
    "id": "uuid",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com"
  },
  "advisor": {
    "id": "uuid",
    "firstName": "Marie",
    "lastName": "Martin"
  }
}
```
**Erreur 403 :** Si l'utilisateur n'est pas autorisé  
**Cas d'usage :** UC-08

---

### `PATCH /api/chats/:chatId/take`
**Description :** Prendre en charge un chat en attente  
**Accès :** ADVISOR authentifié  
**Réponse 200 :**
```json
{
  "id": "uuid",
  "status": "IN_PROGRESS",
  "advisorId": "uuid",
  "takenAt": "2024-01-15T10:35:00Z"
}
```
**Erreurs :**
- `400` : Chat déjà pris en charge (RG7)
- `403` : Rôle insuffisant

**Règles :** RG7, RG8, RG9  
**Cas d'usage :** UC-05

---

### `PATCH /api/chats/:chatId/close`
**Description :** Clôturer un chat  
**Accès :** ADVISOR authentifié (conseiller assigné uniquement)  
**Body (optionnel) :**
```json
{
  "closingMessage": "Merci pour votre contact, bonne journée !"
}
```
**Réponse 200 :**
```json
{
  "id": "uuid",
  "status": "CLOSED",
  "closedAt": "2024-01-15T11:00:00Z"
}
```
**Erreurs :**
- `400` : Chat pas en état IN_PROGRESS
- `403` : Vous n'êtes pas le conseiller assigné (RG14)

**Règles :** RG14, RG15  
**Cas d'usage :** UC-07

---

## 📨 Gestion des messages

### `GET /api/chats/:chatId/messages`
**Description :** Historique des messages d'un chat  
**Accès :** Authentifié (client propriétaire OU conseiller assigné)  
**Query params :**
- `page` : numéro de page (défaut: 1)
- `limit` : nombre par page (défaut: 50)
- `order` : `asc` | `desc` (défaut: asc)

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "Bonjour, j'ai besoin d'aide",
      "sentAt": "2024-01-15T10:30:00Z",
      "author": {
        "id": "uuid",
        "firstName": "Jean",
        "lastName": "Dupont",
        "role": "CLIENT"
      }
    },
    {
      "id": "uuid",
      "content": "Bonjour Jean, je vous écoute",
      "sentAt": "2024-01-15T10:36:00Z",
      "author": {
        "id": "uuid",
        "firstName": "Marie",
        "lastName": "Martin",
        "role": "ADVISOR"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15
  },
  "chatStatus": "IN_PROGRESS"
}
```
**Règle :** RG12, RG17

---

### `POST /api/chats/:chatId/messages`
**Description :** Envoyer un message dans un chat  
**Accès :** Authentifié  
**Body :**
```json
{
  "content": "Voici ma question..."
}
```
**Réponse 201 :**
```json
{
  "id": "uuid",
  "content": "Voici ma question...",
  "sentAt": "2024-01-15T10:45:00Z",
  "chatId": "uuid",
  "author": {
    "id": "uuid",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "CLIENT"
  }
}
```

**Erreurs :**
- `400` : Chat clôturé (RG16)
- `403` : Non autorisé à envoyer des messages dans ce chat (RG11)

**Validations :**
```
SI chat.status == CLOSED
  ALORS erreur 400 "Chat clôturé"

SI chat.status == WAITING
  ET auteur.id != chat.clientId
  ALORS erreur 403 "Seul le client peut envoyer des messages"

SI chat.status == IN_PROGRESS
  ET auteur.id NOT IN [chat.clientId, chat.advisorId]
  ALORS erreur 403 "Non autorisé"
```

**Règles :** RG6, RG11, RG16  
**Cas d'usage :** UC-04, UC-06

---

## 👤 Gestion utilisateur

### `GET /api/users/me`
**Description :** Profil de l'utilisateur connecté  
**Accès :** Authentifié  
**Réponse 200 :**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "CLIENT",
  "isActive": true,
  "createdAt": "2024-01-10T09:00:00Z"
}
```

---

### `PATCH /api/users/me`
**Description :** Modifier son profil  
**Accès :** Authentifié  
**Body :**
```json
{
  "firstName": "Jean-Pierre",
  "lastName": "Dupont"
}
```
**Réponse 200 :**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jean-Pierre",
  "lastName": "Dupont",
  "role": "CLIENT",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

---

### `GET /api/users/stats`
**Description :** Statistiques de l'utilisateur  
**Accès :** Authentifié

**Réponse CLIENT :**
```json
{
  "totalChats": 8,
  "waitingChats": 1,
  "inProgressChats": 2,
  "closedChats": 5
}
```

**Réponse ADVISOR :**
```json
{
  "totalChatsHandled": 156,
  "inProgressChats": 5,
  "closedChats": 151,
  "averageResponseTime": "5min 32s"
}
```

---

## 📊 Administration *(optionnel - extension future)*

### `GET /api/admin/advisors`
**Description :** Liste des conseillers  
**Accès :** ADMIN  
**Query params :**
- `isActive` : `true` | `false` (optionnel)
- `page` : numéro de page (défaut: 1)
- `limit` : nombre par page (défaut: 20)

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "advisor@example.com",
      "firstName": "Marie",
      "lastName": "Martin",
      "isActive": true,
      "createdAt": "2024-01-01T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

---

### `POST /api/admin/advisors`
**Description :** Créer un compte conseiller  
**Accès :** ADMIN  
**Body :**
```json
{
  "email": "newadvisor@example.com",
  "password": "temporaryPassword123",
  "firstName": "Sophie",
  "lastName": "Dubois"
}
```
**Réponse 201 :**
```json
{
  "id": "uuid",
  "email": "newadvisor@example.com",
  "firstName": "Sophie",
  "lastName": "Dubois",
  "role": "ADVISOR"
}
```

---

### `PATCH /api/admin/advisors/:advisorId`
**Description :** Modifier un conseiller (activer/désactiver)  
**Accès :** ADMIN  
**Body :**
```json
{
  "isActive": false
}
```
**Réponse 200 :**
```json
{
  "id": "uuid",
  "isActive": false,
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

---

## 🔄 WebSocket Events *(recommandé pour temps réel)*

### Connection
```
ws://domain.com/ws?token=jwt_token
```

### Events émis par le client

#### `join_chat`
Rejoindre un chat pour recevoir les notifications en temps réel
```json
{
  "event": "join_chat",
  "chatId": "uuid"
}
```

#### `leave_chat`
Quitter un chat
```json
{
  "event": "leave_chat",
  "chatId": "uuid"
}
```

#### `send_message`
Envoyer un message via WebSocket (alternative à l'API REST)
```json
{
  "event": "send_message",
  "chatId": "uuid",
  "content": "Mon message..."
}
```

#### `typing`
Indiquer que l'utilisateur est en train d'écrire
```json
{
  "event": "typing",
  "chatId": "uuid",
  "isTyping": true
}
```

---

### Events reçus par le client

#### `new_message`
Nouveau message reçu dans un chat
```json
{
  "event": "new_message",
  "chatId": "uuid",
  "message": {
    "id": "uuid",
    "content": "Nouveau message",
    "sentAt": "2024-01-15T10:45:00Z",
    "author": {
      "id": "uuid",
      "firstName": "Marie",
      "lastName": "Martin",
      "role": "ADVISOR"
    }
  }
}
```

#### `chat_taken`
Un chat en attente a été pris en charge
```json
{
  "event": "chat_taken",
  "chatId": "uuid",
  "advisor": {
    "id": "uuid",
    "firstName": "Marie",
    "lastName": "Martin"
  },
  "takenAt": "2024-01-15T10:35:00Z"
}
```

#### `chat_closed`
Un chat a été clôturé
```json
{
  "event": "chat_closed",
  "chatId": "uuid",
  "closedAt": "2024-01-15T11:00:00Z"
}
```

#### `user_typing`
Un utilisateur est en train d'écrire
```json
{
  "event": "user_typing",
  "chatId": "uuid",
  "user": {
    "id": "uuid",
    "firstName": "Jean",
    "role": "CLIENT"
  },
  "isTyping": true
}
```

#### `new_waiting_chat` *(pour conseillers)*
Un nouveau chat en attente est disponible
```json
{
  "event": "new_waiting_chat",
  "chat": {
    "id": "uuid",
    "createdAt": "2024-01-15T11:00:00Z",
    "client": {
      "id": "uuid",
      "firstName": "Sophie",
      "lastName": "Bernard"
    }
  }
}
```

---

## 📝 Codes de réponse HTTP

| Code | Signification | Exemple d'utilisation |
|------|---------------|----------------------|
| 200 | Succès | GET réussi, PATCH réussi |
| 201 | Créé | POST réussi (création) |
| 204 | Succès sans contenu | DELETE réussi |
| 400 | Requête invalide | Données manquantes, format incorrect |
| 401 | Non authentifié | Token manquant ou invalide |
| 403 | Non autorisé | Rôle insuffisant, accès refusé |
| 404 | Ressource non trouvée | Chat inexistant, utilisateur introuvable |
| 409 | Conflit | Email déjà utilisé, chat déjà pris |
| 422 | Entité non traitable | Validation échouée |
| 429 | Trop de requêtes | Rate limit dépassé |
| 500 | Erreur serveur | Erreur interne |

---

## 🛡️ Sécurité

### Authentification
- Toutes les routes (sauf `/api/auth/register` et `/api/auth/login`) nécessitent un token JWT valide
- Le token doit être envoyé dans le header : `Authorization: Bearer <token>`
- Durée de validité du token : 24 heures (configurable)
- Refresh token recommandé pour renouveler l'authentification

### Mots de passe
- Hash avec bcrypt (minimum 10 rounds, recommandé 12)
- Longueur minimale : 8 caractères
- Doit contenir : majuscule, minuscule, chiffre, caractère spécial

### Validation des données
- Utiliser un schéma de validation (Zod, Joi, class-validator)
- Sanitization des inputs pour prévenir les injections
- Validation côté serveur obligatoire (même si validation côté client)

### Rate limiting
- Recommandation : 100 requêtes par minute par IP
- Auth endpoints : 5 tentatives par minute
- Message sending : 20 messages par minute par utilisateur

### CORS
- Configurer les origins autorisées
- Credentials : true pour les cookies
- Methods : GET, POST, PATCH, DELETE

### Headers de sécurité
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 📌 Récapitulatif par cas d'usage

| Cas d'usage | Routes principales | Méthode | Rôle requis |
|-------------|-------------------|---------|-------------|
| UC-01 : Créer un compte | `/api/auth/register` | POST | Public |
| UC-02 : Se connecter | `/api/auth/login` | POST | Public |
| UC-03 : Démarrer un chat | `/api/chats` | POST | CLIENT |
| UC-04 : Envoyer message (attente) | `/api/chats/:chatId/messages` | POST | CLIENT |
| UC-05 : Prendre en charge | `/api/chats/:chatId/take` | PATCH | ADVISOR |
| UC-06 : Discuter | `/api/chats/:chatId/messages` | POST/GET | CLIENT/ADVISOR |
| UC-07 : Clôturer | `/api/chats/:chatId/close` | PATCH | ADVISOR |
| UC-08 : Consulter clôturé | `/api/chats/:chatId` + `/messages` | GET | CLIENT/ADVISOR |

---

## 🔍 Filtres et tri

### Requêtes de liste avec filtres

La plupart des endpoints de liste supportent ces query params standards :

- **Pagination :**
  - `page` : numéro de page (défaut: 1)
  - `limit` : éléments par page (défaut: 20, max: 100)

- **Tri :**
  - `sortBy` : champ de tri (ex: `createdAt`, `status`)
  - `order` : `asc` ou `desc` (défaut: `desc`)

- **Filtres :**
  - Selon l'endpoint (ex: `status`, `role`, `isActive`)

**Exemple :**
```
GET /api/chats?status=IN_PROGRESS&sortBy=createdAt&order=desc&page=1&limit=10
```

---

## 🧪 Exemples de requêtes cURL

### Inscription
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "SecurePass123!",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "CLIENT"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "SecurePass123!"
  }'
```

### Créer un chat
```bash
curl -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "initialMessage": "Bonjour, j'ai une question"
  }'
```

### Envoyer un message
```bash
curl -X POST http://localhost:3000/api/chats/<chatId>/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "content": "Voici ma question..."
  }'
```

### Prendre en charge un chat
```bash
curl -X PATCH http://localhost:3000/api/chats/<chatId>/take \
  -H "Authorization: Bearer <token>"
```

---

## 📚 Ressources complémentaires

### Documentation Prisma
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

### JWT
- [jwt.io](https://jwt.io/) - Décodeur et documentation
- [jsonwebtoken npm](https://www.npmjs.com/package/jsonwebtoken)

### WebSocket
- [Socket.io Documentation](https://socket.io/docs/v4/)

### Validation
- [Zod](https://zod.dev/)

---

## 🎯 Checklist d'implémentation

- [ ] Configuration Prisma et migrations
- [ ] Middleware d'authentification JWT
- [ ] Middleware de validation des données
- [ ] Rate limiting
- [ ] Gestion des erreurs centralisée
- [ ] Logger (Winston, Pino)
- [ ] Tests unitaires (Jest, Vitest)
- [ ] Tests d'intégration
- [ ] Documentation OpenAPI/Swagger
- [ ] Variables d'environnement (.env)
- [ ] CORS configuration
- [ ] WebSocket setup
- [ ] Monitoring (Sentry, DataDog)
- [ ] Health check endpoint

---

**Note :** Cette documentation est alignée avec le schéma Prisma et les spécifications fonctionnelles du projet. Toutes les routes respectent les règles de gestion (RG1-RG18) définies dans le cahier des charges.
