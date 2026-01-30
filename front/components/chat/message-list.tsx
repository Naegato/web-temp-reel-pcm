'use client';

import React, { useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message } from '@/lib/types/chat';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  className?: string;
}

export function MessageList({ messages, currentUserId, className }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <div className="text-center">
          <p className="text-lg font-medium">Aucun message pour le moment</p>
          <p className="text-sm">Commencez la conversation en envoyant un message</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col space-y-4 p-4 overflow-y-auto', className)}>
      {messages.map((message, index) => {
        const isCurrentUser = message.authorId === currentUserId;
        const isConsecutive = index > 0 && messages[index - 1].authorId === message.authorId;
        const showAvatar = !isCurrentUser && !isConsecutive;
        const showTimestamp = !isConsecutive || index === messages.length - 1;

        return (
          <div key={message.id} className={cn('flex', {
            'justify-end': isCurrentUser,
            'justify-start': !isCurrentUser
          })}>
            <div className={cn('flex max-w-[70%] space-x-2', {
              'flex-row-reverse space-x-reverse': isCurrentUser
            })}>
              {/* Avatar */}
              {showAvatar && !isCurrentUser && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                    {message.author.firstname[0]}{message.author.lastname[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              {!showAvatar && !isCurrentUser && (
                <div className="w-8" /> // Espace pour l'alignement
              )}

              {/* Message bubble */}
              <div className={cn('flex flex-col', {
                'items-end': isCurrentUser,
                'items-start': !isCurrentUser
              })}>
                {/* Nom de l'auteur pour les messages consécutifs du début */}
                {!isCurrentUser && !isConsecutive && (
                  <div className="text-xs text-muted-foreground mb-1 px-3">
                    {message.author.firstname} {message.author.lastname}
                  </div>
                )}

                {/* Bulle de message */}
                <div className={cn(
                  'rounded-2xl px-4 py-2 max-w-full break-words',
                  {
                    'bg-primary text-primary-foreground rounded-br-md': isCurrentUser,
                    'bg-muted text-foreground rounded-bl-md': !isCurrentUser,
                    'rounded-tr-md': isCurrentUser && isConsecutive,
                    'rounded-tl-md': !isCurrentUser && isConsecutive
                  }
                )}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>

                {/* Timestamp */}
                {showTimestamp && (
                  <div className={cn('text-xs text-muted-foreground mt-1 px-3', {
                    'text-right': isCurrentUser
                  })}>
                    {formatDistanceToNow(new Date(message.createdAt), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Élément pour auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
}