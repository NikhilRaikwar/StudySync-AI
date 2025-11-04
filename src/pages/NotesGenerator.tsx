import { useState, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Upload, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function NotesGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);
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
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
    }
  };

  const generateNotes = async (source: "file" | "topic") => {
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
        description: "Please enter a topic for your notes.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let contentText = "";

      if (source === "file" && file) {
        // Read PDF file as text (simplified - in production, use proper PDF parsing)
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
      
      // Call Gemini API to generate notes
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
      
      toast({
        title: "Notes Generated!",
        description: "Your study notes are ready to download.",
      });
    } catch (error: any) {
      console.error("Error generating notes:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
      
      // Capture the element as canvas
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

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}_studysync_ai.pdf`);

      toast({
        title: "Notes Downloaded",
        description: "Your notes have been saved as PDF file.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-16">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          <div className="text-center space-y-2 px-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Notes Generator</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload your study materials and get AI-generated notes
            </p>
          </div>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Upload Study Material</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">Upload PDF</TabsTrigger>
                  <TabsTrigger value="topic">Enter Topic</TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4 mt-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-all ${
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

                  <Button
                    onClick={() => generateNotes("file")}
                    disabled={isGenerating || !file}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
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

                <TabsContent value="topic" className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Enter Your Topic
                    </label>
                    <Textarea
                      placeholder="E.g., 'Photosynthesis and cellular respiration' or 'World War II causes and effects'"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="min-h-[150px]"
                    />
                  </div>

                  <Button
                    onClick={() => generateNotes("topic")}
                    disabled={isGenerating || !topic.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
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
            </CardContent>
          </Card>

          {notes && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg sm:text-xl">Generated Notes</CardTitle>
                  <Button 
                    onClick={downloadNotes} 
                    variant="outline" 
                    size="sm"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div 
                  ref={notesRef}
                  className="notes-handwritten prose prose-sm sm:prose lg:prose-lg max-w-none bg-white rounded-lg p-6 sm:p-8 lg:p-10 shadow-sm overflow-hidden"
                  style={{ minHeight: '400px', maxWidth: '100%' }}
                >
                  <ReactMarkdown>{notes}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
