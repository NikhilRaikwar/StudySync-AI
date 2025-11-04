import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer?: number;
}

export default function QuizGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showResults, setShowResults] = useState(false);
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
      toast({
        title: "File Uploaded",
        description: `${droppedFile.name} is ready for processing.`,
      });
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      toast({
        title: "File Uploaded",
        description: `${selectedFile.name} is ready for processing.`,
      });
    }
  };

  const generateQuiz = async (source: "file" | "topic") => {
    if (source === "file" && !file) {
      toast({
        title: "No File Selected",
        description: "Please upload a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    if (source === "topic" && !topic.trim()) {
      toast({
        title: "No Topic Entered",
        description: "Please enter a topic for the quiz.",
        variant: "destructive",
      });
      return;
    }

    if (questionCount < 1 || questionCount > 20) {
      toast({
        title: "Invalid Question Count",
        description: "Please enter a number between 1 and 20.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
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
                    text: `Generate ${questionCount} multiple-choice quiz questions based on: ${contentText}. 

IMPORTANT: Return ONLY a valid JSON array with objects containing:
- "question": the question text (string)
- "options": array of exactly 4 answer choices (array of strings)
- "correctAnswer": the index (0, 1, 2, or 3) of the correct option in the options array (number)

Make sure the correctAnswer index correctly points to the right answer in the options array. Double-check your indexing.

Return ONLY the JSON array, no markdown code blocks, no explanations.`,
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
      setQuestions(quizQuestions.slice(0, questionCount));
      
      toast({
        title: "Quiz Generated!",
        description: `${quizQuestions.length} questions are ready.`,
      });
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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

  const submitQuiz = () => {
    const unanswered = questions.filter((q) => q.selectedAnswer === undefined);
    if (unanswered.length > 0) {
      toast({
        title: "Incomplete Quiz",
        description: `Please answer all ${questions.length} questions before submitting.`,
        variant: "destructive",
      });
      return;
    }

    setShowResults(true);
    const correct = questions.filter((q) => q.selectedAnswer === q.correctAnswer).length;
    toast({
      title: "Quiz Completed!",
      description: `You scored ${correct} out of ${questions.length}`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-16">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          <div className="text-center space-y-2 px-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Quiz Generator</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Generate interactive quizzes from PDFs or topics with AI
            </p>
          </div>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Create Your Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">Upload PDF</TabsTrigger>
                  <TabsTrigger value="topic">Enter Topic</TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
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
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {file ? file.name : "Drag & Drop Your PDF Here"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse files
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>
                          <FileText className="mr-2 h-4 w-4" />
                          Select PDF File
                        </span>
                      </Button>
                    </label>
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
                    disabled={isGenerating || !file}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
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
                      className="min-h-[120px]"
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
                    disabled={isGenerating || !topic.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
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
            </CardContent>
          </Card>

          {questions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-semibold">Your Quiz</h2>
                {!showResults && (
                  <Button onClick={submitQuiz} size="lg">
                    Submit Quiz
                  </Button>
                )}
              </div>

              {questions.map((q, qIndex) => (
                <Card key={qIndex}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        {qIndex + 1}. {q.question}
                      </h3>
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
                              className={`w-full text-left p-4 border-2 rounded-lg transition-all ${bgColor} ${
                                !showResults && "hover:border-primary cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {showAnswer && isCorrect && (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                )}
                                {showAnswer && isSelected && !isCorrect && (
                                  <XCircle className="h-5 w-5 text-red-600" />
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
                    <h3 className="text-2xl font-bold mb-2">Quiz Results</h3>
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
      </main>
      <Footer />
    </div>
  );
}
