import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, MessageSquare, HelpCircle, Trash2, Eye, Calendar, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Note {
  id: string;
  title: string;
  content: string;
  source_type: string;
  source_file_name: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string | null;
  messages: any[];
  created_at: string;
}

interface QuizAttempt {
  id: string;
  title: string;
  score: number;
  total_questions: number;
  questions: any;
  answers: any;
  source_type: string;
  source_file_name: string | null;
  created_at: string;
}

interface HistoryContentProps {
  onContinueChat?: (conversation: { id: string; messages: any[] }) => void;
}

export default function HistoryContent({ onContinueChat }: HistoryContentProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [quizzes, setQuizzes] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizAttempt | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const notePreviewRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Fetch notes
      const { data: notesData } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      // Fetch conversations
      const { data: conversationsData } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      // Fetch quiz attempts
      const { data: quizzesData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      setNotes(notesData || []);
      setConversations(conversationsData || []);
      setQuizzes(quizzesData || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await supabase.from('notes').delete().eq('id', id);
      setNotes(notes.filter(n => n.id !== id));
      setSelectedNote(null);
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await supabase.from('ai_conversations').delete().eq('id', id);
      setConversations(conversations.filter(c => c.id !== id));
      setSelectedConversation(null);
      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      await supabase.from('quiz_attempts').delete().eq('id', id);
      setQuizzes(quizzes.filter(q => q.id !== id));
      setSelectedQuiz(null);
      toast({
        title: "Success",
        description: "Quiz attempt deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateNotePDF = async (note: Note, download: boolean = false) => {
    if (!notePreviewRef.current) return;

    setIsGeneratingPDF(true);
    try {
      const element = notePreviewRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      if (download) {
        const filename = note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        pdf.save(`${filename}.pdf`);
        toast({
          title: "Success",
          description: "PDF downloaded successfully!",
        });
      } else {
        // Generate blob URL for preview
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleNoteSelect = async (note: Note) => {
    setSelectedNote(note);
    setPdfUrl(null); // Reset previous PDF
    // Small delay to ensure the content is rendered
    setTimeout(() => {
      generateNotePDF(note, false);
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes">
              <FileText className="h-4 w-4 mr-2" />
              Notes ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="chats">
              <MessageSquare className="h-4 w-4 mr-2" />
              AI Chats ({conversations.length})
            </TabsTrigger>
            <TabsTrigger value="quizzes">
              <HelpCircle className="h-4 w-4 mr-2" />
              Quizzes ({quizzes.length})
            </TabsTrigger>
          </TabsList>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            {notes.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No notes generated yet. Start creating notes from the Notes Generator!
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {notes.map((note) => (
                    <Card
                      key={note.id}
                      className={`cursor-pointer transition-all ${
                        selectedNote?.id === note.id ? 'border-primary ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleNoteSelect(note)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base flex items-start justify-between">
                          <span className="flex-1">{note.title}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(note.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(note.created_at)}
                        </div>
                        {note.source_file_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {note.source_file_name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div>
                  {selectedNote ? (
                    <Card className="sticky top-4">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{selectedNote.title}</CardTitle>
                          <Button
                            onClick={() => generateNotePDF(selectedNote, true)}
                            variant="outline"
                            size="sm"
                            disabled={isGeneratingPDF}
                          >
                            {isGeneratingPDF ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto">
                        {isGeneratingPDF && !pdfUrl ? (
                          <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : pdfUrl ? (
                          <div className="space-y-4">
                            <iframe
                              src={pdfUrl}
                              className="w-full h-[600px] border rounded"
                              title="Note PDF Preview"
                            />
                          </div>
                        ) : null}
                        {/* Hidden div for PDF generation */}
                        <div 
                          ref={notePreviewRef}
                          className="notes-handwritten prose prose-sm max-w-none bg-white rounded-lg p-6 sm:p-8 shadow-sm"
                          style={{ position: 'absolute', left: '-9999px', minHeight: '400px', maxWidth: '800px' }}
                        >
                          <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Select a note to view its PDF
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* AI Chats Tab */}
          <TabsContent value="chats" className="space-y-4">
            {conversations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No AI conversations yet. Start chatting with the AI Study Assistant!
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {conversations.map((conv) => (
                    <Card
                      key={conv.id}
                      className={`cursor-pointer transition-all ${
                        selectedConversation?.id === conv.id ? 'border-primary ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base flex items-start justify-between">
                          <span className="flex-1">
                            {conv.title || `Conversation ${conv.id.slice(0, 8)}`}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(conv.created_at)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onContinueChat) {
                                onContinueChat({
                                  id: conv.id,
                                  messages: conv.messages || []
                                });
                              }
                            }}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Continue Chat
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {conv.messages?.length || 0} messages
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div>
                  {selectedConversation ? (
                    <Card className="sticky top-4">
                      <CardHeader>
                        <CardTitle>
                          {selectedConversation.title || `Conversation ${selectedConversation.id.slice(0, 8)}`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-3">
                        {selectedConversation.messages?.map((msg: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg ${
                              msg.role === 'user' ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Select a conversation to view its messages
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-4">
            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No quiz attempts yet. Start taking quizzes from the Quiz Generator!
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <Card
                      key={quiz.id}
                      className={`cursor-pointer transition-all ${
                        selectedQuiz?.id === quiz.id ? 'border-primary ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedQuiz(quiz)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base flex items-start justify-between">
                          <span className="flex-1">{quiz.title}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQuiz(quiz.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">
                            Score: {quiz.score}/{quiz.total_questions}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((quiz.score / quiz.total_questions) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(quiz.created_at)}
                        </div>
                        {quiz.source_file_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            From: {quiz.source_file_name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div>
                  {selectedQuiz ? (
                    <Card className="sticky top-4">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{selectedQuiz.title}</span>
                          <span className="text-sm font-normal">
                            {selectedQuiz.score}/{selectedQuiz.total_questions}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-4">
                        {Array.isArray(selectedQuiz.questions) &&
                          selectedQuiz.questions.map((q: any, idx: number) => {
                            const userAnswer = Array.isArray(selectedQuiz.answers) 
                              ? selectedQuiz.answers[idx] 
                              : null;
                            const isCorrect = userAnswer === q.correctAnswer;

                            return (
                              <div key={idx} className="border rounded-lg p-3">
                                <p className="font-semibold text-sm mb-2">
                                  {idx + 1}. {q.question}
                                </p>
                                <div className="space-y-1">
                                  {q.options?.map((option: string, optIdx: number) => {
                                    const isUserAnswer = userAnswer === optIdx;
                                    const isCorrectAnswer = q.correctAnswer === optIdx;

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-2 rounded text-sm ${
                                          isCorrectAnswer
                                            ? 'bg-green-100 dark:bg-green-900/20 border border-green-500'
                                            : isUserAnswer && !isCorrect
                                            ? 'bg-red-100 dark:bg-red-900/20 border border-red-500'
                                            : 'bg-muted'
                                        }`}
                                      >
                                        {option}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Select a quiz to view its details
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
