'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, Chat, Advisor } from '@/lib/auth/types';
import { getSocket, joinUserAdvisorChat, sendMessage, onNewMessage, onJoined, offNewMessage } from '@/lib/socket';

type Props = {
  token: string;
  chat: Chat;
  advisor: Advisor;
  currentUserId: string;
};

export function ClientUserChatPage({ token, chat, advisor, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>(chat.messages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket(token);

    onJoined(socket, () => {
      console.log('Joined chat:', chat.id);
    });

    onNewMessage(socket, (message) => {
      setMessages((prev) => [...prev, message]);
    });

    joinUserAdvisorChat(socket, chat.id);

    return () => {
      offNewMessage(socket);
    };
  }, [token, chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const socket = getSocket(token);
    sendMessage(socket, chat.id, input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <h1 className="text-xl p-4 border-b">Chat avec {advisor.email}</h1>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
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
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
