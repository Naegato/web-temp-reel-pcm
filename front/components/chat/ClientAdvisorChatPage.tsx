'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, Chat, ClientChat } from '@/lib/auth/types';
import { getSocket, joinAdvisorGlobalChat, joinUserAdvisorChat, sendMessage, onNewMessage, offNewMessage } from '@/lib/socket';
import { connectChatsSSE } from '@/lib/sse';

type Props = {
  token: string;
  globalChat: Chat;
  clientChats: ClientChat[];
  currentUserId: string;
};

export function ClientAdvisorChatPage({ token, globalChat, clientChats: initialClientChats, currentUserId }: Props) {
  const [clientChats, setClientChats] = useState<ClientChat[]>(initialClientChats);
  const [selectedClientChatId, setSelectedClientChatId] = useState<string | null>(
    initialClientChats.length > 0 ? initialClientChats[0].id : null
  );
  const [clientMessages, setClientMessages] = useState<Record<string, Message[]>>(() => {
    const initial: Record<string, Message[]> = {};
    initialClientChats.forEach((chat) => {
      initial[chat.id] = chat.messages.map((m) => ({
        ...m,
        chatId: chat.id,
        senderId: '',
        sender: { id: '', email: chat.user.email },
      }));
    });
    return initial;
  });
  const [globalMessages, setGlobalMessages] = useState<Message[]>(globalChat.messages);
  const [clientInput, setClientInput] = useState('');
  const [globalInput, setGlobalInput] = useState('');

  const clientMessagesEndRef = useRef<HTMLDivElement>(null);
  const globalMessagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef(getSocket(token));

  // SSE for new client chats
  useEffect(() => {
    const disconnect = connectChatsSSE(token, (event) => {
      if (event.type === 'new_chat') {
        const newChat: ClientChat = {
          id: event.chat.id,
          type: 'USER_ADVISOR',
          userId: event.chat.userId,
          createdAt: new Date().toISOString(),
          user: event.chat.user,
          messages: [],
        };
        setClientChats((prev) => [...prev, newChat]);
        setClientMessages((prev) => ({ ...prev, [newChat.id]: [] }));
        // Join the new chat room
        joinUserAdvisorChat(socketRef.current, newChat.id);
      }
    });

    return disconnect;
  }, [token]);

  // Socket.io for messages
  useEffect(() => {
    const socket = socketRef.current;

    onNewMessage(socket, (message) => {
      if (message.chatId === globalChat.id) {
        setGlobalMessages((prev) => [...prev, message]);
      } else {
        setClientMessages((prev) => ({
          ...prev,
          [message.chatId]: [...(prev[message.chatId] || []), message],
        }));
      }
    });

    joinAdvisorGlobalChat(socket);

    initialClientChats.forEach((chat) => {
      joinUserAdvisorChat(socket, chat.id);
    });

    return () => {
      offNewMessage(socket);
    };
  }, [token, globalChat.id, initialClientChats]);

  useEffect(() => {
    clientMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clientMessages, selectedClientChatId]);

  useEffect(() => {
    globalMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages]);

  const handleSendClient = () => {
    if (!clientInput.trim() || !selectedClientChatId) return;
    sendMessage(socketRef.current, selectedClientChatId, clientInput);
    setClientInput('');
  };

  const handleSendGlobal = () => {
    if (!globalInput.trim()) return;
    sendMessage(socketRef.current, globalChat.id, globalInput);
    setGlobalInput('');
  };

  const handleKeyDownClient = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClient();
    }
  };

  const handleKeyDownGlobal = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendGlobal();
    }
  };

  const selectedChat = clientChats.find((c) => c.id === selectedClientChatId);
  const currentClientMessages = selectedClientChatId ? clientMessages[selectedClientChatId] || [] : [];

  return (
    <div className="flex h-[calc(100vh-100px)]">
      {/* Left section: Client chats */}
      <div className="flex-1 flex border-r">
        {/* Client list */}
        <div className="w-48 border-r overflow-y-auto">
          <h2 className="p-2 font-bold border-b">Clients</h2>
          {clientChats.length === 0 ? (
            <p className="p-2 text-gray-500">Aucun client</p>
          ) : (
            clientChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedClientChatId(chat.id)}
                className={`w-full p-2 text-left hover:bg-gray-100 ${
                  selectedClientChatId === chat.id ? 'bg-gray-200' : ''
                }`}
              >
                {chat.user.email}
              </button>
            ))
          )}
        </div>

        {/* Client messages */}
        <div className="flex-1 flex flex-col">
          <h2 className="p-2 font-bold border-b">
            {selectedChat ? `Chat avec ${selectedChat.user.email}` : 'Sélectionnez un client'}
          </h2>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {currentClientMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.senderId === currentUserId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  <p className="text-sm opacity-70">{msg.sender.email}</p>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={clientMessagesEndRef} />
          </div>

          {selectedClientChatId && (
            <div className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={clientInput}
                onChange={(e) => setClientInput(e.target.value)}
                onKeyDown={handleKeyDownClient}
                placeholder="Message au client..."
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={handleSendClient}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Envoyer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Global advisor chat */}
      <div className="w-96 flex flex-col">
        <h2 className="p-2 font-bold border-b">Chat Global Advisors</h2>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {globalMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] p-3 rounded-lg ${
                  msg.senderId === currentUserId
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                <p className="text-sm opacity-70">{msg.sender.email}</p>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={globalMessagesEndRef} />
        </div>

        <div className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={globalInput}
            onChange={(e) => setGlobalInput(e.target.value)}
            onKeyDown={handleKeyDownGlobal}
            placeholder="Message aux advisors..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={handleSendGlobal}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
