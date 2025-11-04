import { ArrowRight, Play, BookOpen, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  const stats = [
    { icon: BookOpen, value: "10,000+", label: "Active Learners" },
    { icon: Brain, value: "50,000+", label: "Notes Generated" },
    { icon: Sparkles, value: "100k+", label: "Quizzes Taken" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden pt-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-primary/[0.02] bg-grid" />
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 mr-2" />
            Trusted by students across all streams
          </div>

          {/* Headlines */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in">
            Master Your Studies{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              with AI
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Instant study help, notes & quizzes — powered by next-gen AI. 
            Your all-in-one intelligent learning platform for students everywhere.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up">
            <Button asChild size="lg" variant="hero" className="group">
              <Link to="/auth">
                Try Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="group">
              <a 
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </a>
            </Button>
          </div>

        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/5 rounded-full blur-xl animate-bounce-gentle" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-bounce-gentle" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-primary/30 rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
    </section>
  );
};