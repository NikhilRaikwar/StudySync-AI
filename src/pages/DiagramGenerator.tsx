import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Network } from "lucide-react";

const DIAGRAM_TYPES = [
  { value: "mermaid", label: "Mermaid" },
  { value: "plantuml", label: "PlantUML" },
  { value: "graphviz", label: "GraphViz (DOT)" },
  { value: "blockdiag", label: "BlockDiag" },
  { value: "seqdiag", label: "SeqDiag" },
  { value: "actdiag", label: "ActDiag" },
  { value: "nwdiag", label: "NwDiag" },
  { value: "c4plantuml", label: "C4 with PlantUML" },
];

export default function DiagramGenerator() {
  const [diagramType, setDiagramType] = useState("mermaid");
  const [diagramCode, setDiagramCode] = useState("");
  const [diagramSvg, setDiagramSvg] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDiagram = async () => {
    if (!diagramCode.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter diagram code to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`https://kroki.io/${diagramType}/svg`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: diagramCode,
      });

      if (!response.ok) {
        throw new Error(`Failed to generate diagram: ${response.statusText}`);
      }

      const svgText = await response.text();
      setDiagramSvg(svgText);
      toast({
        title: "Diagram Generated!",
        description: "Your diagram has been created successfully.",
      });
    } catch (error: any) {
      console.error("Error generating diagram:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate diagram. Please check your code syntax.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exampleCode: Record<string, string> = {
    mermaid: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> D`,
    plantuml: `@startuml
Alice -> Bob: Hello
Bob --> Alice: Hi!
@enduml`,
    graphviz: `digraph G {
  A -> B
  B -> C
  C -> A
}`,
  };

  const loadExample = () => {
    setDiagramCode(exampleCode[diagramType] || "");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-16">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">
          <div className="text-center space-y-2 px-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Diagram Generator</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create beautiful diagrams from code using Kroki
            </p>
          </div>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Diagram Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
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
                onClick={generateDiagram}
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
                    <Network className="mr-2 h-4 w-4" />
                    Generate Diagram
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {diagramSvg && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Your Diagram</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div
                  className="bg-card border rounded-lg p-3 sm:p-6 flex items-center justify-center overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: diagramSvg }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
