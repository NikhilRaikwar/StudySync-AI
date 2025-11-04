import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Network, Sparkles, Code, Download } from "lucide-react";

const DIAGRAM_TYPES = [
  { value: "mermaid", label: "Mermaid (Flowcharts)" },
  { value: "plantuml", label: "PlantUML (UML Diagrams)" },
  { value: "blockdiag", label: "BlockDiag (Block Diagrams)" },
  { value: "graphviz", label: "GraphViz (Network Diagrams)" },
];

export default function DiagramContent() {
  const [diagramType, setDiagramType] = useState("mermaid");
  const [description, setDescription] = useState("");
  const [diagramCode, setDiagramCode] = useState("");
  const [diagramSvg, setDiagramSvg] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const { toast } = useToast();

  const generateDiagramWithAI = async () => {
    if (!description.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe the diagram you want to create.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
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
                    text: `Generate ${diagramType} diagram code for: ${description}. Return ONLY the raw diagram code without markdown code blocks, explanations, or any other text. Just the pure ${diagramType} syntax.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to generate diagram code");
      }

      let code = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Clean up the code by removing markdown code blocks if present
      code = code.replace(/```[\w]*\n?/g, "").trim();
      
      setDiagramCode(code);
      
      // Automatically render the diagram
      await renderDiagram(code);
      
      toast({
        title: "Diagram Code Generated!",
        description: "AI has created the diagram code. Rendering now...",
      });
    } catch (error: any) {
      console.error("Error generating diagram code:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate diagram code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderDiagram = async (code?: string) => {
    const codeToRender = code || diagramCode;
    
    if (!codeToRender.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter diagram code to render.",
        variant: "destructive",
      });
      return;
    }

    setIsRendering(true);
    try {
      const response = await fetch(`https://kroki.io/${diagramType}/svg`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: codeToRender,
      });

      if (!response.ok) {
        throw new Error(`Failed to render diagram: ${response.statusText}`);
      }

      const svgText = await response.text();
      setDiagramSvg(svgText);
      toast({
        title: "Diagram Rendered!",
        description: "Your diagram has been created successfully.",
      });
    } catch (error: any) {
      console.error("Error rendering diagram:", error);
      toast({
        title: "Rendering Failed",
        description: error.message || "Failed to render diagram. Please check your code syntax.",
        variant: "destructive",
      });
    } finally {
      setIsRendering(false);
    }
  };

  const exampleCode: Record<string, string> = {
    blockdiag: `blockdiag {
  blockdiag -> generates -> "block-diagrams";
  blockdiag -> is -> "very easy!";

  blockdiag [color = "greenyellow"];
  "block-diagrams" [color = "pink"];
  "very easy!" [color = "orange"];
}`,
    plantuml: `@startmindmap
skinparam monochrome true
+ OS
++ Ubuntu
+++ Linux Mint
+++ Kubuntu
++ LMDE
-- Windows 95
-- Windows 98
-- Windows NT
@endmindmap`,
    mermaid: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D`,
    graphviz: `digraph G {
  A -> B
  B -> C
  C -> A
}`,
  };

  const loadExample = () => {
    setDiagramCode(exampleCode[diagramType] || "");
  };

  const downloadDiagram = () => {
    if (!diagramSvg) return;
    
    const blob = new Blob([diagramSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diagram_${diagramType}_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center space-y-2 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">AI Diagram Generator</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create diagrams with AI or write code manually using Kroki
          </p>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="space-y-3">
              <CardTitle className="text-lg sm:text-xl">Diagram Configuration</CardTitle>
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Diagram Type</label>
                <Select value={diagramType} onValueChange={setDiagramType}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAGRAM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-sm sm:text-base">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="ai" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="ai">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Generate
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Code className="h-4 w-4 mr-2" />
                  Write Code
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ai" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium">
                    Describe Your Diagram
                  </label>
                  <Textarea
                    placeholder="E.g., 'Create a flowchart showing the login process with username, password validation, and success/error paths'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px] text-sm sm:text-base"
                  />
                </div>

                <Button
                  onClick={generateDiagramWithAI}
                  disabled={isGenerating || isRendering}
                  className="w-full text-sm sm:text-base"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Diagram with AI
                    </>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <label className="text-xs sm:text-sm font-medium">Diagram Code</label>
                    <Button variant="outline" size="sm" onClick={loadExample} className="text-xs sm:text-sm w-full sm:w-auto">
                      Load Example
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Enter your diagram code here..."
                    value={diagramCode}
                    onChange={(e) => setDiagramCode(e.target.value)}
                    className="min-h-[200px] sm:min-h-[300px] font-mono text-xs sm:text-sm"
                  />
                </div>

                <Button
                  onClick={() => renderDiagram()}
                  disabled={isRendering}
                  className="w-full text-sm sm:text-base"
                  size="lg"
                >
                  {isRendering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rendering...
                    </>
                  ) : (
                    <>
                      <Network className="mr-2 h-4 w-4" />
                      Render Diagram
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {diagramCode && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-2">Generated Code:</p>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                  {diagramCode}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {diagramSvg && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl">Your Diagram</CardTitle>
                <Button
                  onClick={downloadDiagram}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download SVG
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div
                className="bg-card border rounded-lg p-3 sm:p-6 flex items-center justify-center overflow-x-auto min-h-[200px]"
                dangerouslySetInnerHTML={{ __html: diagramSvg }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
