export const chatConfig = {
  // Configuration CORS pour Socket.IO
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  
  // Configuration des namespaces
  namespace: '/chat',
  
  // Configuration des timeouts
  connectionTimeout: 20000, // 20 secondes
  pingTimeout: 60000,       // 1 minute
  pingInterval: 25000,      // 25 secondes
  
  // Configuration de la reconnexion
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
};