import 'dotenv/config';
import crypto from 'crypto';
import { createServer } from 'http';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { Prisma, PrismaClient, Role, ChatType, User, Notification } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import express, { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { Server as SocketServer, Socket } from 'socket.io';
import cors from 'cors';
import ms from 'ms';

// SSE Event emitter
const sseEmitter = new EventEmitter();

// Track connected users per chat room: Map<chatId, Set<userId>>
const chatConnections = new Map<string, Set<string>>();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
});

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

// Auth types
interface AuthRequest extends Request {
  user?: User;
}

interface SocketUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthSocket extends Socket {
  user?: SocketUser;
}

// Auth middleware
const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: Role };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role guard
const roleGuard = (...roles: Role[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

const app = express();

app.use(express.json());
app.use(cors())

app.get('/', async (req, res) => {
  res.send('Welcome to the Prisma Express API');
})

app.post('/register', async (req, res) => {
  const schema = z.object({
    email: z.email(),
    password: z.string().min(2),
  })

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
  }

  const { email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const verifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: { email, password, verifyToken },
  });

  const verifyUrl = `http://localhost:4000/verify/${verifyToken}`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Verify your email',
    text: `Click here to verify your email: ${verifyUrl}`,
  });

  res.status(201).json({ id: user.id, email: user.email, role: user.role });
})

app.post('/login', async (req, res) => {
  const body = req.body;
  const schema = z.object({
    email: z.email(),
    password: z.string().min(2),
  })

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user && !user.verified) {
    return res.status(403).json({ error: 'Email not verified' });
  }

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as ms.StringValue }
  );

  res.json({ token });
})

app.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  const user = await prisma.user.findFirst({ where: { verifyToken: token } });
  if (!user) {
    return res.status(404).json({ error: 'Invalid token' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { verified: true, verifyToken: null },
  });

  res.json({ message: 'Email verified' });
})

// Exemple: endpoint protégé (user connecté)
app.get('/me', auth, async (req: AuthRequest, res) => {
  res.json(req.user);
})

// Exemple: endpoint protégé par role ADVISOR
app.get('/admin', auth, roleGuard('ADVISOR'), async (req: AuthRequest, res) => {
  res.json({ message: 'Welcome advisor' });
})

// Connecter des clients à l'advisor
app.post('/connect', auth, roleGuard('ADVISOR'), async (req: AuthRequest, res) => {
  const schema = z.object({
    userIds: z.array(z.string()),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
  }

  await prisma.user.updateMany({
    where: { id: { in: parsed.data.userIds } },
    data: { advisorId: req.user!.id },
  });

  res.json({ message: 'Clients connected' });
})

// Users sans advisor assigné
app.get('/users/unassigned', auth, roleGuard('ADVISOR'), async (req: AuthRequest, res) => {
  const users = await prisma.user.findMany({
    where: { advisorId: null, role: 'USER' },
    select: { id: true, email: true, createdAt: true }
  });

  res.json(users);
})

// Clients connectés à l'advisor
app.get('/users/my-clients', auth, roleGuard('ADVISOR'), async (req: AuthRequest, res) => {
  const clients = await prisma.user.findMany({
    where: { advisorId: req.user!.id },
    select: { id: true, email: true, createdAt: true }
  });

  res.json(clients);
})

// Récupérer son advisor
app.get('/users/my-advisor', auth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { advisor: { select: { id: true, email: true } } }
  });

  if (!user?.advisor) {
    return res.status(404).json({ error: 'No advisor assigned' });
  }

  res.json(user.advisor);
})

// ========== Chat REST Endpoints ==========

// GET /chats/advisor-global - Récupère/crée le chat global (ADVISOR only)
app.get('/chats/advisor-global', auth, roleGuard('ADVISOR'), async (req: AuthRequest, res) => {
  let chat = await prisma.chat.findFirst({
    where: { type: 'GLOBAL_ADVISOR' },
    include: { messages: { take: 50, orderBy: { createdAt: 'desc' }, include: { sender: { select: { id: true, email: true } } } } }
  });

  if (!chat) {
    chat = await prisma.chat.create({
      data: { type: 'GLOBAL_ADVISOR' },
      include: { messages: { take: 50, orderBy: { createdAt: 'desc' }, include: { sender: { select: { id: true, email: true } } } } }
    });
  }

  res.json({ ...chat, messages: chat.messages.reverse() });
});

// POST /chats/user-advisor - USER récupère/crée son chat avec advisor
app.post('/chats/user-advisor', auth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  // Si c'est un advisor, on refuse (ils doivent utiliser /chats/my-clients)
  if (req.user!.role === 'ADVISOR') {
    return res.status(400).json({ error: 'Advisors should use /chats/my-clients endpoint' });
  }

  // Vérifie que le user a un advisor assigné
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { advisorId: true } });
  if (!user?.advisorId) {
    return res.status(400).json({ error: 'No advisor assigned' });
  }

  let chat = await prisma.chat.findUnique({
    where: { userId },
    include: { messages: { take: 50, orderBy: { createdAt: 'desc' }, include: { sender: { select: { id: true, email: true } } } } }
  });

  if (!chat) {
    chat = await prisma.chat.create({
      data: { type: 'USER_ADVISOR', userId },
      include: { messages: { take: 50, orderBy: { createdAt: 'desc' }, include: { sender: { select: { id: true, email: true } } } } }
    });

    // Notifie les advisors via SSE
    sseEmitter.emit('chat:new', {
      id: chat.id,
      userId: chat.userId,
      user: { id: req.user!.id, email: req.user!.email }
    });
  }

  res.json({ ...chat, messages: chat.messages.reverse() });
});

// GET /chats/my-clients - Liste des chats clients (ADVISOR only)
app.get('/chats/my-clients', auth, roleGuard('ADVISOR'), async (req: AuthRequest, res) => {
  const advisorId = req.user!.id;

  const chats = await prisma.chat.findMany({
    where: {
      type: 'USER_ADVISOR',
      user: { advisorId }
    },
    include: {
      user: { select: { id: true, email: true } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } }
    }
  });

  res.json(chats);
});

// GET /chats/:chatId/messages - Historique messages (pagination)
app.get('/chats/:chatId/messages', auth, async (req: AuthRequest, res) => {
  const chatId = req.params.chatId as string;
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { user: { select: { id: true, advisorId: true } } }
  }) as { id: string; type: string; userId: string | null; user: { id: string; advisorId: string | null } | null } | null;

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  // Vérification des droits
  const userId = req.user!.id;
  const userRole = req.user!.role;

  if (chat.type === 'GLOBAL_ADVISOR') {
    if (userRole !== 'ADVISOR') {
      return res.status(403).json({ error: 'Only advisors can access this chat' });
    }
  } else {
    // USER_ADVISOR: seul le user propriétaire ou son advisor peuvent accéder
    const isOwner = chat.userId === userId;
    const isAdvisor = chat.user?.advisorId === userId;
    if (!isOwner && !isAdvisor) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  const messages = await prisma.message.findMany({
    where: { chatId: chatId },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: 'desc' },
    include: { sender: { select: { id: true, email: true } } }
  });

  res.json({
    messages: messages.reverse(),
    nextCursor: messages.length === limit ? messages[0]?.id : null
  });
});

// ========== Notifications Endpoints ==========

// GET /notifications - SSE stream des notifications
app.get('/notifications', auth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Envoie les notifications existantes
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  res.write(`data: ${JSON.stringify({ type: 'init', notifications })}\n\n`);

  // Écoute les nouvelles notifications
  const onNotification = (notification: Notification) => {
    if (notification.userId === userId) {
      res.write(`data: ${JSON.stringify({ type: 'new', notification })}\n\n`);
    }
  };

  sseEmitter.on('notification', onNotification);

  req.on('close', () => {
    sseEmitter.off('notification', onNotification);
  });
});

// GET /notifications/:id - Récupère et marque comme lu
app.get('/notifications/:id', auth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  if (notification.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true }
  });

  res.json(updated);
});

// POST /notifications - Créer une notification (ADVISOR only)
app.post('/notifications', auth, roleGuard('ADVISOR'), async (req: AuthRequest, res) => {
  const schema = z.object({
    userId: z.string(),
    content: z.string().min(1)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body', details: parsed.error.issues });
  }

  const { userId, content } = parsed.data;

  // Vérifie que l'utilisateur cible existe
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const notification = await prisma.notification.create({
    data: { userId, content }
  });

  sseEmitter.emit('notification', notification);

  res.status(201).json(notification);
});

// DELETE /notifications/:id - Supprimer une notification
app.delete('/notifications/:id', auth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  if (notification.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  await prisma.notification.delete({ where: { id } });

  res.json({ message: 'Notification deleted' });
});

// ========== SSE pour nouveaux chats (Advisors) ==========

// GET /chats/stream - SSE pour les advisors (nouveaux chats clients)
app.get('/chats/stream', auth, roleGuard('ADVISOR'), async (req: AuthRequest, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const onNewChat = (chat: { id: string; userId: string; user: { id: string; email: string } }) => {
    res.write(`data: ${JSON.stringify({ type: 'new_chat', chat })}\n\n`);
  };

  sseEmitter.on('chat:new', onNewChat);

  req.on('close', () => {
    sseEmitter.off('chat:new', onNewChat);
  });
});

// ========== HTTP Server + Socket.io ==========

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Socket.io auth middleware
io.use((socket: AuthSocket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('No token provided'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as SocketUser;
    socket.user = payload;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Socket.io event handlers
io.on('connection', (socket: AuthSocket) => {
  console.log(`Socket connected: ${socket.user?.email}`);

  // Join advisor global chat
  socket.on('join:advisor-global', async () => {
    if (socket.user?.role !== 'ADVISOR') {
      socket.emit('error', { message: 'Only advisors can join this chat' });
      return;
    }

    let chat = await prisma.chat.findFirst({ where: { type: 'GLOBAL_ADVISOR' } });
    if (!chat) {
      chat = await prisma.chat.create({ data: { type: 'GLOBAL_ADVISOR' } });
    }

    socket.join(`chat:${chat.id}`);

    // Track user in chat
    if (!chatConnections.has(chat.id)) {
      chatConnections.set(chat.id, new Set());
    }
    chatConnections.get(chat.id)!.add(socket.user!.id);

    socket.emit('joined', { chatId: chat.id });
  });

  // Join user-advisor chat
  socket.on('join:user-advisor', async (data: { chatId: string }) => {
    const chat = await prisma.chat.findUnique({
      where: { id: data.chatId },
      include: { user: { select: { id: true, advisorId: true } } }
    });

    if (!chat) {
      socket.emit('error', { message: 'Chat not found' });
      return;
    }

    // Vérification des droits
    const userId = socket.user!.id;
    if (chat.type === 'GLOBAL_ADVISOR') {
      if (socket.user?.role !== 'ADVISOR') {
        socket.emit('error', { message: 'Only advisors can join this chat' });
        return;
      }
    } else {
      const isOwner = chat.userId === userId;
      const isAdvisor = chat.user?.advisorId === userId;
      if (!isOwner && !isAdvisor) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }
    }

    socket.join(`chat:${chat.id}`);

    // Track user in chat
    if (!chatConnections.has(chat.id)) {
      chatConnections.set(chat.id, new Set());
    }
    chatConnections.get(chat.id)!.add(socket.user!.id);

    socket.emit('joined', { chatId: chat.id });
  });

  // Send message
  socket.on('message:send', async (data: { chatId: string; content: string }) => {
    const { chatId, content } = data;

    if (!content?.trim()) {
      socket.emit('error', { message: 'Message content is required' });
      return;
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { user: { select: { id: true, advisorId: true } } }
    });

    if (!chat) {
      socket.emit('error', { message: 'Chat not found' });
      return;
    }

    // Vérification des droits
    const userId = socket.user!.id;
    if (chat.type === 'GLOBAL_ADVISOR') {
      if (socket.user?.role !== 'ADVISOR') {
        socket.emit('error', { message: 'Only advisors can send messages here' });
        return;
      }
    } else {
      const isOwner = chat.userId === userId;
      const isAdvisor = chat.user?.advisorId === userId;
      if (!isOwner && !isAdvisor) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        chatId,
        senderId: userId
      },
      include: { sender: { select: { id: true, email: true } } }
    });

    io.to(`chat:${chatId}`).emit('message:new', message);

    // Create notification if recipient is not connected to the chat (USER_ADVISOR only)
    if (chat.type === 'USER_ADVISOR') {
      const connectedUsers = chatConnections.get(chatId) || new Set();
      let recipientId: string | null = null;

      if (chat.userId === userId) {
        // Sender is the user -> recipient is the advisor
        recipientId = chat.user?.advisorId || null;
      } else {
        // Sender is the advisor -> recipient is the user
        recipientId = chat.userId;
      }

      if (recipientId && !connectedUsers.has(recipientId)) {
        const notification = await prisma.notification.create({
          data: {
            userId: recipientId,
            content: `Nouveau message de ${socket.user!.email}`
          }
        });
        sseEmitter.emit('notification', notification);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.user?.email}`);

    // Remove user from all chat connections
    if (socket.user) {
      const userId = socket.user.id;
      chatConnections.forEach((users, chatId) => {
        users.delete(userId);
        if (users.size === 0) {
          chatConnections.delete(chatId);
        }
      });
    }
  });
});

httpServer.listen(4000, () =>
  console.log(`Server ready at: http://localhost:4000`),
);
