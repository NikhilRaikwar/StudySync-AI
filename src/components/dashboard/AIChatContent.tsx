import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Bot, User as UserIcon, Save, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatContentProps {
  loadedConversation?: {
    id: string;
    messages: Message[];
  } | null;
  onConversationLoaded?: () => void;
}

export default function AIChatContent({ loadedConversation, onConversationLoaded }: AIChatContentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! 👋 I'm your AI study buddy powered by Gemini 2.0. Ask me ANYTHING - coding questions, explanations, examples, interview prep, or general knowledge. I'm here to help! 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation when prop changes
  useEffect(() => {
    if (loadedConversation) {
      setMessages(loadedConversation.messages);
      setConversationId(loadedConversation.id);
      if (onConversationLoaded) {
        onConversationLoaded();
      }
    }
  }, [loadedConversation, onConversationLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hey! 👋 I'm your AI study buddy powered by Gemini 2.0. Ask me ANYTHING - coding questions, explanations, examples, interview prep, or general knowledge. I'm here to help! 🚀",
      },
    ]);
    setConversationId(null);
    setInput("");
    toast({
      title: "New Chat Started",
      description: "Start a fresh conversation!",
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    
    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${userMessage}\n\nPlease provide a helpful, concise answer with emojis. Keep it short unless more detail is requested. Avoid using markdown formatting like ** or ##.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to get AI response");
      }

      let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiResponse) {
        throw new Error("No response received from AI");
      }
      
      // Clean up response - remove excessive markdown formatting
      aiResponse = aiResponse
        .replace(/\*\*\*/g, '') // Remove triple asterisks
        .replace(/\*\*/g, '')   // Remove double asterisks (bold)
        .replace(/#{1,6}\s/g, '') // Remove markdown headers
        .trim();

      // Add AI response
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "Sorry, I encountered an error. Please try again. 😕" 
        },
      ]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveConversation = async () => {
    if (!user || messages.length <= 1) {
      toast({
        title: "Nothing to save",
        description: "Have a conversation first before saving.",
      });
      return;
    }

    try {
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage?.content.slice(0, 50) || 'Untitled Conversation';

      if (conversationId) {
        // Update existing conversation
        await supabase
          .from('ai_conversations')
          .update({ 
            messages: messages as any,
            title,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      } else {
        // Create new conversation
        const { data } = await supabase
          .from('ai_conversations')
          .insert({
            user_id: user.id,
            title,
            messages: messages as any,
          })
          .select()
          .single();
        
        if (data) {
          setConversationId(data.id);
        }
      }

      toast({
        title: "Success",
        description: "Conversation saved successfully!",
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: "Error",
        description: "Failed to save conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col w-full bg-background rounded-xl shadow-sm">
      {/* Header with Buttons */}
      <div className="flex items-center justify-end gap-2 p-4 border-b border-border bg-card">
        <Button
          onClick={startNewChat}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Button
          onClick={saveConversation}
          variant="default"
          size="sm"
          disabled={messages.length <= 1}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Chat
        </Button>
      </div>

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">

      {/* Chat Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 pb-4 space-y-4 sm:space-y-5" style={{ paddingBottom: '180px' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* AI Assistant - Avatar on LEFT */}
              {message.role === "assistant" && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              
              {/* Message bubble */}
              <div
                className={`max-w-[80%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
              </div>

              {/* User - Avatar on RIGHT */}
              {message.role === "user" && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

      {/* Input Area - Fixed at Bottom Center */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl p-4 z-10">
        <div className="flex gap-2 bg-card rounded-xl border border-border shadow-lg p-2">
          <Textarea
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[44px] sm:min-h-[56px] resize-none text-sm sm:text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-[44px] w-[44px] sm:h-[56px] sm:w-[56px] flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
