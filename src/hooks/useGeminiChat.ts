import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseGeminiChatOptions {
  context?: 'general' | 'resume' | 'interview' | 'study' | 'coding' | 'career';
}

export function useGeminiChat(options: UseGeminiChatOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (prompt: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt,
          context: options.context || 'general'
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading,
    error
  };
}