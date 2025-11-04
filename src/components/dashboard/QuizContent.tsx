import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer?: number;
}

export default function QuizContent() {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentSource, setCurrentSource] = useState<'file' | 'topic'>('file');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please upload a PDF file only.");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError("");
    }
  };

  const generateQuiz = async (source: "file" | "topic") => {
    setCurrentSource(source);
    if (source === "file" && !file) {
      setError("Please upload a PDF file first");
      return;
    }

    if (source === "topic" && !topic.trim()) {
      setError("Please enter a topic for the quiz");
      return;
    }

    if (questionCount < 1 || questionCount > 20) {
      setError("Please enter a number between 1 and 20");
      return;
    }

    setLoading(true);
    setError("");
    setShowResults(false);

    try {
      let contentText = "";
      
      if (source === "file" && file) {
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = (e) => {
            contentText = (e.target?.result as string).slice(0, 30000);
            resolve(null);
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else {
        contentText = topic;
      }

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
                    text: `Generate ${questionCount} multiple-choice quiz questions based on: ${contentText}

CRITICAL INSTRUCTIONS:
1. Create factually accurate questions with 4 options each
2. The FIRST option (index 0) in the options array MUST be the CORRECT answer
3. The other 3 options should be plausible but incorrect distractors
4. Set correctAnswer to 0 for all questions since the correct option is always first

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Your question here?",
    "options": ["CORRECT ANSWER FIRST", "Wrong option 2", "Wrong option 3", "Wrong option 4"],
    "correctAnswer": 0
  }
]

IMPORTANT: 
- Do NOT randomize the correct answer position
- ALWAYS put the correct answer as the FIRST option (index 0)
- Set correctAnswer to 0 for every question
- Return ONLY the JSON array, no markdown, no explanations`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to generate quiz");
      }

      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Could not parse quiz from response");
      }

      const quizQuestions = JSON.parse(jsonMatch[0]);
      
      // Validate and shuffle options while tracking correct answer
      const validatedQuestions = quizQuestions.slice(0, questionCount).map((q: any) => {
        // Ensure we have exactly 4 options
        if (!q.options || q.options.length !== 4) {
          throw new Error("Each question must have exactly 4 options");
        }
        
        // Get the correct answer (should be at index 0 per our prompt)
        const correctAnswerIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
        const correctAnswerText = q.options[correctAnswerIndex];
        
        // Shuffle options for variety
        const shuffledOptions = [...q.options];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
        
        // Find new index of correct answer after shuffle
        const newCorrectIndex = shuffledOptions.indexOf(correctAnswerText);
        
        return {
          question: q.question,
          options: shuffledOptions,
          correctAnswer: newCorrectIndex
        };
      });
      
      setQuestions(validatedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (showResults) return;
    
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex ? { ...q, selectedAnswer: answerIndex } : q
      )
    );
  };

  const submitQuiz = async () => {
    const unanswered = questions.filter((q) => q.selectedAnswer === undefined);
    if (unanswered.length > 0) {
      setError(`Please answer all ${questions.length} questions before submitting`);
      return;
    }

    setShowResults(true);
    setError("");

    // Calculate score and save to database
    if (user) {
      const score = questions.filter((q) => q.selectedAnswer === q.correctAnswer).length;
      const answers = questions.map((q) => q.selectedAnswer);
      
      const quizTitle = currentSource === 'file' && file 
        ? file.name.replace('.pdf', '') 
        : topic.slice(0, 100);

      try {
        await supabase.from('quiz_attempts').insert({
          user_id: user.id,
          title: quizTitle,
          questions: questions as any,
          answers: answers as any,
          score,
          total_questions: questions.length,
          source_type: currentSource,
          source_file_name: currentSource === 'file' && file ? file.name : null,
        });

        toast({
          title: "Success",
          description: "Quiz results saved successfully!",
        });
      } catch (error) {
        console.error('Error saving quiz:', error);
        toast({
          title: "Error",
          description: "Failed to save quiz results",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-4">
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Upload PDF</TabsTrigger>
              <TabsTrigger value="topic">Enter Topic</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Your Study Material (PDF)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-base font-semibold mb-2">
                    {file ? file.name : "Drag & Drop Your PDF Here"}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload any study-related PDF
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload-quiz"
                  />
                  <label htmlFor="file-upload-quiz">
                    <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                      <span>
                        <FileText className="mr-2 h-4 w-4" />
                        Select PDF
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Questions (Max 20)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                />
              </div>

              <Button
                onClick={() => generateQuiz("file")}
                disabled={loading || !file}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  "Generate Quiz from PDF"
                )}
              </Button>
            </TabsContent>

            <TabsContent value="topic" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter Your Topic
                </label>
                <Textarea
                  placeholder="E.g., 'Data Structures and Algorithms' or 'World War II History'"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Questions (Max 20)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                />
              </div>

              <Button
                onClick={() => generateQuiz("topic")}
                disabled={loading || !topic.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  "Generate Quiz from Topic"
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Quiz ({questions.length} questions)</h3>
              {!showResults && (
                <Button onClick={submitQuiz} size="sm">
                  Submit Quiz
                </Button>
              )}
            </div>

            {questions.map((q, qIndex) => (
              <Card key={qIndex}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">
                      {qIndex + 1}. {q.question}
                    </h4>
                    <div className="space-y-2">
                      {q.options.map((option, oIndex) => {
                        const isSelected = q.selectedAnswer === oIndex;
                        const isCorrect = q.correctAnswer === oIndex;
                        const showAnswer = showResults;

                        let bgColor = "";
                        if (showAnswer) {
                          if (isCorrect) {
                            bgColor = "bg-green-100 border-green-500 dark:bg-green-900/20";
                          } else if (isSelected && !isCorrect) {
                            bgColor = "bg-red-100 border-red-500 dark:bg-red-900/20";
                          }
                        } else if (isSelected) {
                          bgColor = "bg-primary/10 border-primary";
                        }

                        return (
                          <button
                            key={oIndex}
                            onClick={() => handleAnswerSelect(qIndex, oIndex)}
                            disabled={showResults}
                            className={`w-full text-left p-3 border-2 rounded-lg transition-all text-sm ${bgColor} ${
                              !showResults && "hover:border-primary cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {showAnswer && isCorrect && (
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                              )}
                              {showAnswer && isSelected && !isCorrect && (
                                <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {showResults && (
              <Card className="bg-primary/5 border-primary">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">Quiz Results</h3>
                  <p className="text-lg">
                    You scored{" "}
                    <span className="font-bold text-primary">
                      {questions.filter((q) => q.selectedAnswer === q.correctAnswer).length}
                    </span>{" "}
                    out of <span className="font-bold">{questions.length}</span>
                  </p>
                  <p className="text-muted-foreground mt-2">
                    {Math.round(
                      (questions.filter((q) => q.selectedAnswer === q.correctAnswer).length /
                        questions.length) *
                        100
                    )}
                    % Correct
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
