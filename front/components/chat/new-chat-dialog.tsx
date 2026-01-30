'use client';

import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { CreateChatDto } from '@/lib/types/chat';

interface NewChatDialogProps {
  onCreateChat: (data: CreateChatDto) => Promise<void>;
  trigger?: React.ReactNode;
}

export function NewChatDialog({ onCreateChat, trigger }: NewChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    initialMessage: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedData = {
      subject: formData.subject.trim() || undefined,
      initialMessage: formData.initialMessage.trim() || undefined
    };

    // Au moins un champ doit être rempli
    if (!trimmedData.subject && !trimmedData.initialMessage) {
      return;
    }

    try {
      setIsLoading(true);
      await onCreateChat(trimmedData);
      
      // Réinitialiser et fermer
      setFormData({ subject: '', initialMessage: '' });
      setOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création du chat:', error);
      // L'erreur sera gérée par le composant parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isSubmitDisabled = 
    isLoading || 
    (!formData.subject.trim() && !formData.initialMessage.trim());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle conversation
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Démarrez une nouvelle conversation avec un conseiller. 
            Décrivez brièvement votre demande pour être dirigé vers le bon service.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Sujet de votre demande
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Ex: Ouverture de compte, Prêt immobilier..."
              disabled={isLoading}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Optionnel • {formData.subject.length}/100
            </p>
          </div>

          {/* Message initial */}
          <div className="space-y-2">
            <Label htmlFor="initialMessage">
              Message initial
            </Label>
            <Textarea
              id="initialMessage"
              value={formData.initialMessage}
              onChange={(e) => handleInputChange('initialMessage', e.target.value)}
              placeholder="Décrivez votre demande en détail..."
              disabled={isLoading}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Optionnel • {formData.initialMessage.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}