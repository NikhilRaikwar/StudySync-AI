import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, RotateCw, Download } from "lucide-react";

interface Flashcard {
  question: string;
  answer: string;
}

export default function FlashcardContent() {
  const [notes, setNotes] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const generateFlashcards = async () => {
    if (!notes.trim()) {
      setError("Please enter some study notes first");
      return;
    }

    setLoading(true);
    setError("");

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
                    text: `Convert these study notes into flashcards. Return ONLY a valid JSON array with objects containing "question" and "answer" fields. No markdown, no explanation, just the JSON array:\n\n${notes}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to generate flashcards");
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Could not parse flashcards from response");
      }

      const cards = JSON.parse(jsonMatch[0]);
      setFlashcards(cards);
      setFlippedCards(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flashcards");
    } finally {
      setLoading(false);
    }
  };

  const toggleFlip = (index: number) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedCards(newFlipped);
  };

  const cardColors = [
    "from-purple-400 to-pink-400",
    "from-blue-400 to-cyan-400",
    "from-green-400 to-emerald-400",
    "from-orange-400 to-red-400",
    "from-indigo-400 to-purple-400",
    "from-teal-400 to-blue-400",
  ];

  const downloadFlashcards = () => {
    const dataStr = JSON.stringify(flashcards, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flashcards_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter Your Study Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type or paste your study notes here... (e.g., 'Photosynthesis is the process by which plants convert light energy into chemical energy...')"
              className="min-h-[150px] resize-none"
            />
          </div>

          <Button
            onClick={generateFlashcards}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Flashcards...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Flashcards
              </>
            )}
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {flashcards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Your Flashcards ({flashcards.length})
              </h3>
              <Button
                onClick={downloadFlashcards}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcards.map((card, index) => (
                <div
                  key={index}
                  className="perspective-1000"
                  onClick={() => toggleFlip(index)}
                >
                  <div
                    className={`relative h-64 cursor-pointer transition-transform duration-500 transform-style-3d ${
                      flippedCards.has(index) ? "rotate-y-180" : ""
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: flippedCards.has(index) ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    {/* Front */}
                    <Card
                      className={`absolute inset-0 bg-gradient-to-br ${
                        cardColors[index % cardColors.length]
                      } text-white p-6 flex flex-col items-center justify-center text-center shadow-lg`}
                      style={{
                        backfaceVisibility: "hidden",
                      }}
                    >
                      <RotateCw className="absolute top-4 right-4 h-5 w-5 opacity-70" />
                      <div className="text-sm font-medium mb-2 opacity-90">
                        Question
                      </div>
                      <p className="text-lg font-semibold">{card.question}</p>
                    </Card>

                    {/* Back */}
                    <Card
                      className={`absolute inset-0 bg-gradient-to-br ${
                        cardColors[index % cardColors.length]
                      } text-white p-6 flex flex-col items-center justify-center text-center shadow-lg`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <RotateCw className="absolute top-4 right-4 h-5 w-5 opacity-70" />
                      <div className="text-sm font-medium mb-2 opacity-90">
                        Answer
                      </div>
                      <p className="text-base">{card.answer}</p>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
