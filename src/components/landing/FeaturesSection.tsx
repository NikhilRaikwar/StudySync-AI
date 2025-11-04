import { 
  FileText, 
  MessageSquare, 
  BookOpen, 
  Code, 
  BarChart3, 
  Brain,
  CheckCircle,
  Sparkles,
  HelpCircle
} from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "AI Study Chat",
      description: "Instantly answer any study question, clarify concepts, or summarize chapters with AI-powered chat assistant",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: FileText,
      title: "Handwritten Notes Generator",
      description: "Upload handwritten notes, photos, or PDFs and get instantly readable, organized AI-generated study notes",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: HelpCircle,
      title: "Quiz Generator",
      description: "Create, practice, and review quizzes AI-generated from any subject, note, or uploaded material with instant feedback",
      color: "bg-warning/10 text-warning",
    },
    {
      icon: Brain,
      title: "Smart Learning",
      description: "Personalized AI recommendations based on your learning patterns and subject preferences",
      color: "bg-success/10 text-success",
    },
    {
      icon: BarChart3,
      title: "Learning Analytics",
      description: "Track your study progress with detailed insights across all subjects and topics",
      color: "bg-info/10 text-info",
    },
    {
      icon: BookOpen,
      title: "Study History",
      description: "Access all your past notes, conversations, and quizzes anytime for quick revision",
      color: "bg-destructive/10 text-destructive",
    },
  ];

  const benefits = [
    "All-in-one study hub for any stream/year",
    "Personalized, instant AI study aid",
    "Real-time feedback and learning insights",
    "Works for all subjects and topics",
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4 mr-2" />
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Excel in Your Studies
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Our comprehensive platform combines the power of AI with smart learning tools 
            to help you master any subject with ease.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card p-8 rounded-2xl bg-card-gradient shadow-custom-md hover:shadow-custom-xl transition-all duration-300 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card-gradient rounded-3xl p-8 md:p-12 shadow-custom-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                  Why Choose StudySync AI?
                </h3>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <CheckCircle className="h-6 w-6 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-hero p-8 text-white text-center flex items-center justify-center">
                  <div>
                    <Brain className="h-16 w-16 mx-auto mb-4 opacity-80" />
                    <h4 className="text-xl font-semibold mb-2">AI-Powered Learning</h4>
                    <p className="opacity-90">Personalized study recommendations based on your needs</p>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};