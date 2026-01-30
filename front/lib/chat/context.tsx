'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { ChatApi, handleChatError } from '@/lib/api/chat';
import { chatSocketService } from '@/lib/websocket/chat-socket';
import { useAuth } from '@/lib/auth/context';
import { Role } from '@/lib/types/chat';
import type { 
  Chat, 
  ChatContextType, 
  CreateChatDto, 
  MessageResponseDto,
  ChatResponseDto 
} from '@/lib/types/chat';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [waitingChats, setWaitingChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connexion WebSocket automatique quand l'utilisateur est connecté
  useEffect(() => {
    if (!user) {
      console.log('💬 Chat: No user, disconnecting WebSocket');
      chatSocketService.disconnect();
      setIsConnected(false);
      return;
    }

    console.log('💬 Chat: User connected, initializing WebSocket:', { 
      userId: user.id, 
      role: user.role 
    });

    const connectWebSocket = async () => {
      try {
        // Récupérer le token via l'API (car les cookies sont httpOnly)
        console.log('💬 Chat: Fetching WebSocket token from API...');
        
        const response = await fetch('/api/auth/websocket-token', {
          method: 'GET',
          credentials: 'include', // Include httpOnly cookies
        });

        if (!response.ok) {
          console.warn('💬 Chat: Failed to get WebSocket token:', response.status);
          return;
        }

        const { token } = await response.json();
        if (!token) {
          console.warn('💬 Chat: No token received from API');
          return;
        }
        
        console.log('💬 Chat: Got WebSocket token:', `${token.substring(0, 10)}...`);

        console.log('💬 Chat: Connecting WebSocket with token...');
        await chatSocketService.connect(token);
        setIsConnected(true);
        setError(null);
        
        console.log('💬 Chat: WebSocket connected, loading chats...');
        // Charger les chats initiaux
        await refreshChats();
      } catch (err) {
        console.error('💬 Chat: WebSocket connection error:', err);
        setError('Impossible de se connecter au chat en temps réel');
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      chatSocketService.disconnect();
      setIsConnected(false);
    };
  }, [user]);

  // Gestionnaires d'événements WebSocket
  useEffect(() => {
    if (!isConnected || !user) return;

    // Nouveau message reçu
    const unsubscribeNewMessage = chatSocketService.onNewMessage((message: MessageResponseDto) => {
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.id === message.chatId) {
            const messageExists = chat.messages.some(m => m.id === message.id);
            if (!messageExists) {
              return {
                ...chat,
                messages: [...chat.messages, {
                  id: message.id,
                  content: message.content,
                  authorId: message.authorId,
                  chatId: message.chatId,
                  createdAt: message.createdAt,
                  author: message.author
                }]
              };
            }
          }
          return chat;
        })
      );

      // Mettre à jour le chat actuel si c'est le bon
      if (currentChat?.id === message.chatId) {
        setCurrentChat(prevChat => {
          if (!prevChat) return null;
          const messageExists = prevChat.messages.some(m => m.id === message.id);
          if (!messageExists) {
            return {
              ...prevChat,
              messages: [...prevChat.messages, {
                id: message.id,
                content: message.content,
                authorId: message.authorId,
                chatId: message.chatId,
                createdAt: message.createdAt,
                author: message.author
              }]
            };
          }
          return prevChat;
        });
      }
    });

    // Chat assigné (pour les advisors)
    const unsubscribeChatAssigned = chatSocketService.onChatAssigned((chatData: ChatResponseDto) => {
      const transformedChat = transformChatResponse(chatData);
      setChats(prevChats => {
        const existingIndex = prevChats.findIndex(c => c.id === transformedChat.id);
        if (existingIndex >= 0) {
          const updatedChats = [...prevChats];
          updatedChats[existingIndex] = transformedChat;
          return updatedChats;
        }
        return [transformedChat, ...prevChats];
      });

      // Retirer des chats en attente
      setWaitingChats(prevWaiting => 
        prevWaiting.filter(c => c.id !== transformedChat.id)
      );
    });

    // Advisor assigné à mon chat (pour les clients)
    const unsubscribeAdvisorAssigned = chatSocketService.onAdvisorAssigned((chatData: ChatResponseDto) => {
      const transformedChat = transformChatResponse(chatData);
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === transformedChat.id ? transformedChat : chat
        )
      );

      if (currentChat?.id === transformedChat.id) {
        setCurrentChat(transformedChat);
      }
    });

    // Chat fermé
    const unsubscribeChatClosed = chatSocketService.onChatClosed((chatData: ChatResponseDto) => {
      const transformedChat = transformChatResponse(chatData);
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === transformedChat.id ? transformedChat : chat
        )
      );

      if (currentChat?.id === transformedChat.id) {
        setCurrentChat(transformedChat);
      }
    });

    // Nouveau chat en attente (pour les advisors)
    const unsubscribeNewChatWaiting = chatSocketService.onNewChatWaiting((chatData: ChatResponseDto) => {
      if (user.role === Role.ADVISOR) {
        const transformedChat = transformChatResponse(chatData);
        setWaitingChats(prevWaiting => [transformedChat, ...prevWaiting]);
      }
    });

    // Liste des chats en attente
    const unsubscribeWaitingChats = chatSocketService.onWaitingChats((chatsData: ChatResponseDto[]) => {
      if (user.role === Role.ADVISOR) {
        const transformedChats = chatsData.map(transformChatResponse);
        setWaitingChats(transformedChats);
      }
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeChatAssigned();
      unsubscribeAdvisorAssigned();
      unsubscribeChatClosed();
      unsubscribeNewChatWaiting();
      unsubscribeWaitingChats();
    };
  }, [isConnected, user, currentChat]);

  // Transformer la réponse API en Chat frontend
  const transformChatResponse = (chatResponse: ChatResponseDto): Chat => {
    return {
      id: chatResponse.id,
      status: chatResponse.status,
      subject: chatResponse.subject,
      clientId: chatResponse.clientId,
      advisorId: chatResponse.advisorId,
      createdAt: chatResponse.createdAt,
      updatedAt: chatResponse.updatedAt,
      client: chatResponse.client,
      advisor: chatResponse.advisor,
      messages: chatResponse.messages?.map(msg => ({
        id: msg.id,
        content: msg.content,
        authorId: msg.authorId,
        chatId: msg.chatId,
        createdAt: msg.createdAt,
        author: msg.author
      })) || []
    };
  };

  // Créer un nouveau chat
  const createChat = useCallback(async (data: CreateChatDto): Promise<Chat> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newChat = await ChatApi.createChat(data);
      setChats(prevChats => [newChat, ...prevChats]);
      
      return newChat;
    } catch (err) {
      const error = handleChatError(err);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sélectionner un chat
  const selectChat = useCallback(async (chatId: string) => {
    try {
      setError(null);
      
      // Quitter le chat précédent
      if (currentChat && isConnected) {
        chatSocketService.leaveChat(currentChat.id);
      }
      
      // Récupérer les détails du chat
      const chat = await ChatApi.getChatById(chatId);
      setCurrentChat(chat);
      
      // Rejoindre le nouveau chat via WebSocket
      if (isConnected) {
        chatSocketService.joinChat(chatId);
      }
    } catch (err) {
      const error = handleChatError(err);
      setError(error.message);
    }
  }, [currentChat, isConnected]);

  // Envoyer un message
  const sendMessage = useCallback(async (content: string) => {
    if (!currentChat || !user) {
      throw new Error('Aucun chat sélectionné ou utilisateur non connecté');
    }

    try {
      setError(null);
      
      const messageData = {
        chatId: currentChat.id,
        content
      };

      if (isConnected) {
        // Envoyer via WebSocket si possible
        chatSocketService.sendMessage(messageData);
      } else {
        // Fallback REST API
        const message = await ChatApi.sendMessage(messageData);
        
        // Mettre à jour l'état local si pas de WebSocket
        setCurrentChat(prevChat => {
          if (!prevChat) return null;
          return {
            ...prevChat,
            messages: [...prevChat.messages, {
              id: message.id,
              content: message.content,
              authorId: message.authorId,
              chatId: message.chatId,
              createdAt: message.createdAt,
              author: message.author
            }]
          };
        });
      }
    } catch (err) {
      const error = handleChatError(err);
      setError(error.message);
      throw error;
    }
  }, [currentChat, user, isConnected]);

  // S'assigner un chat (advisors)
  const assignChat = useCallback(async (chatId: string) => {
    try {
      setError(null);
      
      if (isConnected) {
        chatSocketService.assignChat(chatId);
      } else {
        await ChatApi.assignChat(chatId);
        await refreshChats();
      }
    } catch (err) {
      const error = handleChatError(err);
      setError(error.message);
      throw error;
    }
  }, [isConnected]);

  // Fermer un chat (advisors)
  const closeChat = useCallback(async (chatId: string) => {
    try {
      setError(null);
      
      if (isConnected) {
        chatSocketService.closeChat(chatId);
      } else {
        await ChatApi.closeChat(chatId);
        await refreshChats();
      }
    } catch (err) {
      const error = handleChatError(err);
      setError(error.message);
      throw error;
    }
  }, [isConnected]);

  // Rafraîchir les chats
  const refreshChats = useCallback(async () => {
    if (!user) {
      console.log('💬 Chat: No user for refresh');
      return;
    }

    try {
      console.log('💬 Chat: Refreshing chats...', { role: user.role });
      setIsLoading(true);
      setError(null);
      
      const [myChats, waitingChatsData] = await Promise.all([
        ChatApi.getMyChats(),
        user.role === Role.ADVISOR ? ChatApi.getWaitingChats() : Promise.resolve([])
      ]);
      
      console.log('💬 Chat: Chats loaded:', { 
        myChats: myChats.length, 
        waitingChats: waitingChatsData.length 
      });
      
      setChats(myChats);
      if (user.role === Role.ADVISOR) {
        setWaitingChats(waitingChatsData);
        
        // Demander aussi via WebSocket si connecté
        if (isConnected) {
          console.log('💬 Chat: Requesting waiting chats via WebSocket');
          chatSocketService.getWaitingChats();
        }
      }
    } catch (err) {
      console.error('💬 Chat: Error refreshing chats:', err);
      const error = handleChatError(err);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, isConnected]);

  const contextValue: ChatContextType = {
    chats,
    waitingChats,
    currentChat,
    isConnected,
    isLoading,
    error,
    createChat,
    selectChat,
    sendMessage,
    assignChat,
    closeChat,
    refreshChats
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook pour utiliser le contexte de chat
export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}