'use client';

import React, { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Tapez votre message...",
  className,
  maxLength = 1000
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading || disabled) return;

    try {
      setIsLoading(true);
      await onSendMessage(trimmedContent);
      setContent('');
      
      // Remettre le focus sur le textarea
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      // L'erreur sera gérée par le contexte parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Envoyer avec Ctrl+Enter ou Shift+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }
    
    // Empêcher l'envoi avec Enter seul si on veut permettre les sauts de ligne
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setContent(value);
    }
  };

  // Auto-resize du textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  const isSubmitDisabled = !content.trim() || isLoading || disabled;

  return (
    <form onSubmit={handleSubmit} className={cn('flex items-end space-x-2 p-4 border-t bg-background', className)}>
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className="min-h-[40px] max-h-[120px] resize-none pr-12 text-sm"
          style={{ height: '40px' }}
        />
        
        {/* Compteur de caractères */}
        <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
          {content.length}/{maxLength}
        </div>
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={isSubmitDisabled}
        className="h-10 w-10 p-0 shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        <span className="sr-only">Envoyer le message</span>
      </Button>
    </form>
  );
}