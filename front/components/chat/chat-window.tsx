'use client';

import React from 'react';
import { 
  UserCheck, 
  X, 
  Phone, 
  MoreVertical, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { cn } from '@/lib/utils';
import { Role, ChatStatus } from '@/lib/types/chat';
import type { Chat } from '@/lib/types/chat';

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
  userRole: Role;
  isConnected: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onAssignChat?: () => Promise<void>;
  onCloseChat?: () => Promise<void>;
  className?: string;
  error?: string | null;
}

const statusConfig = {
  [ChatStatus.WAITING]: {
    icon: Clock,
    label: 'En attente d\'un conseiller',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  [ChatStatus.IN_PROGRESS]: {
    icon: CheckCircle,
    label: 'Conversation en cours',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  [ChatStatus.CLOSED]: {
    icon: X,
    label: 'Conversation fermée',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
};

function ChatHeader({ 
  chat, 
  userRole, 
  onAssignChat, 
  onCloseChat 
}: {
  chat: Chat;
  userRole: Role;
  onAssignChat?: () => Promise<void>;
  onCloseChat?: () => Promise<void>;
}) {
  const isClient = userRole === Role.CLIENT;
  const isAdvisor = userRole === Role.ADVISOR;
  const otherUser = isClient ? chat.advisor : chat.client;
  const canAssign = isAdvisor && chat.status === ChatStatus.WAITING && !chat.advisor;
  const canClose = isAdvisor && chat.status === ChatStatus.IN_PROGRESS;
  const statusInfo = statusConfig[chat.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      {/* Informations utilisateur */}
      <div className="flex items-center space-x-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {otherUser ? (
              `${otherUser.firstname[0]}${otherUser.lastname[0]}`
            ) : (
              '?'
            )}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <h2 className="font-semibold text-sm">
            {otherUser ? (
              `${otherUser.firstname} ${otherUser.lastname}`
            ) : (
              isClient ? 'En attente d\'attribution' : 'Chat non assigné'
            )}
          </h2>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={cn('text-xs', statusInfo.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
            
            {chat.subject && (
              <span className="text-xs text-muted-foreground">
                • {chat.subject}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Actions rapides pour les advisors */}
        {canAssign && onAssignChat && (
          <Button
            size="sm"
            onClick={onAssignChat}
            className="h-8 text-xs"
          >
            <UserCheck className="w-4 h-4 mr-1" />
            Prendre en charge
          </Button>
        )}

        {/* Menu d'actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
              <span className="sr-only">Ouvrir le menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canAssign && onAssignChat && (
              <>
                <DropdownMenuItem onClick={onAssignChat}>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Prendre en charge
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            {canClose && onCloseChat && (
              <>
                <DropdownMenuItem onClick={onCloseChat} className="text-red-600">
                  <X className="w-4 h-4 mr-2" />
                  Fermer le chat
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem>
              <Phone className="w-4 h-4 mr-2" />
              Passer un appel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  if (isConnected) return null;

  return (
    <Alert className="m-4 mb-0 border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        Connexion en temps réel indisponible. Les messages seront synchronisés dès que possible.
      </AlertDescription>
    </Alert>
  );
}

function ChatClosedNotice({ chat }: { chat: Chat }) {
  if (chat.status !== ChatStatus.CLOSED) return null;

  return (
    <Alert className="m-4 mb-0 border-gray-200 bg-gray-50">
      <CheckCircle className="h-4 w-4 text-gray-600" />
      <AlertDescription className="text-gray-800">
        Cette conversation a été fermée. Vous ne pouvez plus envoyer de messages.
      </AlertDescription>
    </Alert>
  );
}

function ErrorNotice({ error }: { error?: string | null }) {
  if (!error) return null;

  return (
    <Alert className="m-4 mb-0 border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        {error}
      </AlertDescription>
    </Alert>
  );
}

export function ChatWindow({
  chat,
  currentUserId,
  userRole,
  isConnected,
  onSendMessage,
  onAssignChat,
  onCloseChat,
  className,
  error
}: ChatWindowProps) {
  const isChatClosed = chat.status === ChatStatus.CLOSED;
  const canSendMessage = !isChatClosed;

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <ChatHeader 
        chat={chat}
        userRole={userRole}
        onAssignChat={onAssignChat}
        onCloseChat={onCloseChat}
      />

      {/* Notices */}
      <ConnectionStatus isConnected={isConnected} />
      <ErrorNotice error={error} />
      <ChatClosedNotice chat={chat} />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={chat.messages}
          currentUserId={currentUserId}
          className="h-full"
        />
      </div>

      {/* Input pour nouveau message */}
      {canSendMessage && (
        <MessageInput
          onSendMessage={onSendMessage}
          disabled={isChatClosed}
          placeholder={
            chat.status === ChatStatus.WAITING
              ? "Votre message sera visible dès qu'un conseiller prendra en charge votre demande..."
              : "Tapez votre message..."
          }
        />
      )}
    </div>
  );
}