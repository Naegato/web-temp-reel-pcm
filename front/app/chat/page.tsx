'use client';

import React, { useState } from 'react';

export const dynamic = 'force-dynamic';
import { MessageCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChat } from '@/lib/chat/context';
import { useAuth } from '@/lib/auth/context';
import { ChatList } from '@/components/chat/chat-list';
import { ChatWindow } from '@/components/chat/chat-window';
import { NewChatDialog } from '@/components/chat/new-chat-dialog';
import { Role } from '@/lib/types/chat';

function ChatPageContent() {
  const { user } = useAuth();
  const { 
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
    closeChat
  } = useChat();
  
  const [selectedChatId, setSelectedChatId] = useState<string>();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert className="max-w-md">
          <AlertDescription>
            Vous devez être connecté pour accéder au chat.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isClient = user.role === Role.CLIENT;
  const isAdvisor = user.role === Role.ADVISOR;

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    selectChat(chatId);
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const handleAssignChat = async () => {
    if (currentChat) {
      await assignChat(currentChat.id);
    }
  };

  const handleCloseChat = async () => {
    if (currentChat) {
      await closeChat(currentChat.id);
    }
  };

  const handleCreateChat = async (data: any) => {
    const newChat = await createChat(data);
    setSelectedChatId(newChat.id);
    selectChat(newChat.id);
  };

  // Vue mobile: afficher soit la liste soit le chat
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const showChatOnMobile = currentChat && mobileView === 'chat';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chat</h1>
            <p className="text-muted-foreground">
              {isClient 
                ? "Contactez nos conseillers pour obtenir de l'aide" 
                : "Gérez vos conversations avec les clients"
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Indicateur de connexion */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-orange-500'
              }`} />
              <span className="text-muted-foreground">
                {isConnected ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>

            {/* Bouton nouveau chat pour les clients */}
            {isClient && (
              <NewChatDialog 
                onCreateChat={handleCreateChat}
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Nouvelle conversation</span>
                    <span className="sm:hidden">Nouveau</span>
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Vue desktop: deux colonnes */}
        <div className="hidden lg:flex w-full">
          {/* Sidebar gauche - Liste des chats */}
          <div className="w-96 border-r bg-muted/50">
            {isAdvisor ? (
              <Tabs defaultValue="my-chats" className="h-full">
                <div className="p-4 border-b">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="my-chats">Mes chats</TabsTrigger>
                    <TabsTrigger value="waiting">En attente</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="my-chats" className="flex-1 mt-0 h-full">
                  <ChatList
                    chats={chats}
                    onChatSelect={(chat) => handleChatSelect(chat.id)}
                    selectedChatId={selectedChatId}
                    userRole={user.role}
                    emptyMessage="Aucun chat assigné"
                    className="h-full"
                  />
                </TabsContent>
                
                <TabsContent value="waiting" className="flex-1 mt-0 h-full">
                  <ChatList
                    chats={waitingChats}
                    onChatSelect={(chat) => handleChatSelect(chat.id)}
                    selectedChatId={selectedChatId}
                    userRole={user.role}
                    emptyMessage="Aucun chat en attente"
                    className="h-full"
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <ChatList
                chats={chats}
                onChatSelect={(chat) => handleChatSelect(chat.id)}
                selectedChatId={selectedChatId}
                userRole={user.role}
                emptyMessage="Aucune conversation. Créez-en une nouvelle pour commencer."
                className="h-full"
              />
            )}
          </div>

          {/* Zone principale - Chat */}
          <div className="flex-1">
            {currentChat ? (
              <ChatWindow
                chat={currentChat}
                currentUserId={user.id}
                userRole={user.role}
                isConnected={isConnected}
                onSendMessage={handleSendMessage}
                onAssignChat={isAdvisor ? handleAssignChat : undefined}
                onCloseChat={isAdvisor ? handleCloseChat : undefined}
                error={error}
                className="h-full"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-4">
                  <MessageCircle className="w-16 h-16 mx-auto opacity-50" />
                  <div>
                    <p className="text-lg font-medium">Sélectionnez une conversation</p>
                    <p className="text-sm">
                      {isClient 
                        ? "Choisissez une conversation existante ou créez-en une nouvelle"
                        : "Sélectionnez un chat pour commencer à répondre"
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vue mobile: une seule vue */}
        <div className="lg:hidden w-full">
          {!showChatOnMobile ? (
            <div className="h-full flex flex-col">
              {/* Liste des chats */}
              {isAdvisor ? (
                <Tabs defaultValue="my-chats" className="flex-1 flex flex-col">
                  <div className="p-4 border-b bg-background">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="my-chats">Mes chats</TabsTrigger>
                      <TabsTrigger value="waiting">En attente</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="my-chats" className="flex-1 mt-0">
                    <ChatList
                      chats={chats}
                      onChatSelect={(chat) => {
                        handleChatSelect(chat.id);
                        setMobileView('chat');
                      }}
                      selectedChatId={selectedChatId}
                      userRole={user.role}
                      emptyMessage="Aucun chat assigné"
                      className="h-full"
                    />
                  </TabsContent>
                  
                  <TabsContent value="waiting" className="flex-1 mt-0">
                    <ChatList
                      chats={waitingChats}
                      onChatSelect={(chat) => {
                        handleChatSelect(chat.id);
                        setMobileView('chat');
                      }}
                      selectedChatId={selectedChatId}
                      userRole={user.role}
                      emptyMessage="Aucun chat en attente"
                      className="h-full"
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <ChatList
                  chats={chats}
                  onChatSelect={(chat) => {
                    handleChatSelect(chat.id);
                    setMobileView('chat');
                  }}
                  selectedChatId={selectedChatId}
                  userRole={user.role}
                  emptyMessage="Aucune conversation. Créez-en une nouvelle pour commencer."
                  className="h-full"
                />
              )}
            </div>
          ) : currentChat ? (
            <div className="h-full">
              <ChatWindow
                chat={currentChat}
                currentUserId={user.id}
                userRole={user.role}
                isConnected={isConnected}
                onSendMessage={handleSendMessage}
                onAssignChat={isAdvisor ? handleAssignChat : undefined}
                onCloseChat={isAdvisor ? handleCloseChat : undefined}
                error={error}
                className="h-full"
              />
              {/* Bouton retour mobile */}
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 left-4 z-10"
                onClick={() => setMobileView('list')}
              >
                ← Retour
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <div className="h-screen pt-16"> {/* pt-16 pour compenser la navbar fixe */}
      <ChatPageContent />
    </div>
  );
}