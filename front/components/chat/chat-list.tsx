'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  UserCheck 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChatStatus, Role } from '@/lib/types/chat';
import type { Chat } from '@/lib/types/chat';

interface ChatListProps {
  chats: Chat[];
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: string;
  userRole: Role;
  className?: string;
  emptyMessage?: string;
}

const statusConfig = {
  [ChatStatus.WAITING]: {
    icon: Clock,
    label: 'En attente',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    iconColor: 'text-orange-600'
  },
  [ChatStatus.IN_PROGRESS]: {
    icon: MessageCircle,
    label: 'En cours',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    iconColor: 'text-blue-600'
  },
  [ChatStatus.CLOSED]: {
    icon: CheckCircle,
    label: 'Fermé',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    iconColor: 'text-gray-600'
  }
};

function ChatStatusBadge({ status }: { status: ChatStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge variant="secondary" className={cn('text-xs', config.color)}>
      <Icon className={cn('w-3 h-3 mr-1', config.iconColor)} />
      {config.label}
    </Badge>
  );
}

function ChatListItem({ 
  chat, 
  onClick, 
  isSelected, 
  userRole 
}: { 
  chat: Chat; 
  onClick: () => void; 
  isSelected: boolean;
  userRole: Role;
}) {
  const lastMessage = chat.messages[chat.messages.length - 1];
  const isClient = userRole === Role.CLIENT;
  const otherUser = isClient ? chat.advisor : chat.client;
  
  return (
    <Card 
      className={cn(
        'p-4 cursor-pointer transition-all duration-200 hover:shadow-md border',
        {
          'ring-2 ring-primary border-primary': isSelected,
          'border-border': !isSelected
        }
      )}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {otherUser ? (
              `${otherUser.firstname[0]}${otherUser.lastname[0]}`
            ) : (
              <User className="w-5 h-5" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Contenu du chat */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header: Nom + Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm truncate">
                {otherUser ? (
                  `${otherUser.firstname} ${otherUser.lastname}`
                ) : (
                  isClient ? 'En attente d\'un conseiller' : 'Client non assigné'
                )}
              </h3>
              {otherUser && chat.status === ChatStatus.IN_PROGRESS && (
                <UserCheck className="w-4 h-4 text-green-600" />
              )}
            </div>
            <ChatStatusBadge status={chat.status} />
          </div>

          {/* Sujet du chat */}
          {chat.subject && (
            <p className="text-xs text-muted-foreground truncate">
              Sujet: {chat.subject}
            </p>
          )}

          {/* Dernier message */}
          {lastMessage ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground truncate">
                <span className="font-medium">
                  {lastMessage.author.firstname}:
                </span>{' '}
                {lastMessage.content}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Aucun message
            </p>
          )}

          {/* Footer: Date + Indicateur de messages */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(chat.updatedAt), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
            
            {chat.messages.length > 0 && (
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-3 h-3" />
                <span>{chat.messages.length}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ChatList({ 
  chats, 
  onChatSelect, 
  selectedChatId, 
  userRole,
  className,
  emptyMessage = "Aucun chat disponible"
}: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <div className="text-center space-y-2">
          <MessageCircle className="w-12 h-12 mx-auto opacity-50" />
          <p className="font-medium">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 p-4 overflow-y-auto', className)}>
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          onClick={() => onChatSelect(chat)}
          isSelected={selectedChatId === chat.id}
          userRole={userRole}
        />
      ))}
    </div>
  );
}