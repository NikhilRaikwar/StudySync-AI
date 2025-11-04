import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, Upload, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function NotesContent() {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
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
    } else {
      setError("Please upload a PDF file only.");
    }
  };

  const generateNotes = async (source: "file" | "topic") => {
    if (source === "file" && !file) {
      setError("Please upload a PDF file first");
      return;
    }

    if (source === "topic" && !topic.trim()) {
      setError("Please enter a topic for your notes");
      return;
    }

    setLoading(true);
    setError("");

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
                    text: `Create comprehensive and well-structured study notes from the following content. 

FORMATTING REQUIREMENTS:
- Use Markdown format for proper formatting
- Use **bold text** for main headings and important terms
- Use ## for main section headings
- Organize with clear sections
- Use bullet points (-) and numbered lists (1., 2., 3.)
- Include sections: KEY POINTS, ADVANTAGES, DISADVANTAGES, EXAMPLES
- Add EXAM TIPS section at the end
- Make it visually appealing and easy to scan
- Keep it concise but comprehensive
- Format should be suitable for Markdown (.md) files
- DO NOT use emojis or emoticons

Content to create notes from:
${contentText}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to generate notes");
      }

      const generatedNotes = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      setNotes(generatedNotes);

      // Save notes to database
      if (user && generatedNotes) {
        const noteTitle = source === 'file' && file 
          ? file.name.replace('.pdf', '') 
          : topic.slice(0, 100);

        await supabase.from('notes').insert({
          user_id: user.id,
          title: noteTitle,
          content: generatedNotes,
          source_type: source,
          source_file_name: source === 'file' && file ? file.name : null,
        });

        toast({
          title: "Success",
          description: "Notes generated and saved successfully!",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate notes");
    } finally {
      setLoading(false);
    }
  };

  const downloadNotes = async () => {
    if (!notes || !notesRef.current) return;

    setIsDownloading(true);
    try {
      // Generate filename from topic or file name
      let filename = 'notes';
      if (topic.trim()) {
        filename = topic.trim().substring(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      } else if (file) {
        filename = file.name.replace('.pdf', '').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      }
      
      const element = notesRef.current;
      
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

      pdf.save(`${filename}_studysync_ai.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
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
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
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
                Upload papers, PYQs, topics, chapters, or any study-related PDF
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-dash"
              />
              <label htmlFor="file-upload-dash">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <FileText className="mr-2 h-4 w-4" />
                    Select PDF File
                  </span>
                </Button>
              </label>
            </div>
              </div>

              <Button
                onClick={() => generateNotes("file")}
                disabled={loading || !file}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Notes...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Notes from PDF
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="topic" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter Your Topic
                </label>
                <Textarea
                  placeholder="E.g., 'Photosynthesis and cellular respiration' or 'World War II causes and effects'"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[150px] resize-none"
                />
              </div>

              <Button
                onClick={() => generateNotes("topic")}
                disabled={loading || !topic.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Notes...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Notes from Topic
                  </>
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

        {notes && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Notes</h3>
              <Button
                onClick={downloadNotes}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
            <Card className="p-6">
              <div 
                ref={notesRef}
                className="notes-handwritten prose prose-sm sm:prose lg:prose-lg max-w-none bg-white rounded-lg p-6 sm:p-8 shadow-sm overflow-hidden"
                style={{ minHeight: '400px', maxWidth: '100%' }}
              >
                <ReactMarkdown>{notes}</ReactMarkdown>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
