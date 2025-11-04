import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Flashcard {
  question: string;
  answer: string;
}

export default function FlashcardGenerator() {
  const [notes, setNotes] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const generateFlashcards = async () => {
    if (!notes.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some notes to generate flashcards.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          prompt: `Generate 5-8 flashcards from the following notes. Return ONLY a valid JSON array of objects with "question" and "answer" fields. No markdown, no explanations, just the JSON array:\n\n${notes}`,
          context: "study",
        },
      });

      if (error) throw error;

      // Parse the AI response to extract JSON
      let flashcardsData: Flashcard[] = [];
      const responseText = data.response;
      
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcardsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse flashcards from response");
      }

      setFlashcards(flashcardsData);
      setFlippedCards(new Set());
      toast({
        title: "Flashcards Generated!",
        description: `Created ${flashcardsData.length} flashcards from your notes.`,
      });
    } catch (error: any) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCard = (index: number) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-16">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
          <div className="text-center space-y-2 px-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Flashcard Generator</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Transform your notes into study flashcards with AI
            </p>
          </div>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Enter Your Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <Textarea
                placeholder="Paste your notes, text, or study material here..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[150px] sm:min-h-[200px] text-sm sm:text-base"
              />
              <Button
                onClick={generateFlashcards}
                disabled={isGenerating}
                className="w-full text-sm sm:text-base"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Flashcards
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {flashcards.length > 0 && (
            <div className="space-y-3 sm:space-y-4 px-2">
              <h2 className="text-xl sm:text-2xl font-semibold">Your Flashcards</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {flashcards.map((card, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer transition-all hover:shadow-lg active:scale-95"
                    onClick={() => toggleCard(index)}
                  >
                    <CardContent className="p-4 sm:p-6 min-h-[160px] sm:min-h-[200px] flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
                          {flippedCards.has(index) ? "ANSWER" : "QUESTION"}
                        </p>
                        <p className="text-sm sm:text-base md:text-lg break-words">
                          {flippedCards.has(index) ? card.answer : card.question}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
