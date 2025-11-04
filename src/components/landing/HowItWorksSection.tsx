import { 
  UserPlus, 
  Upload, 
  MessageSquare, 
  BookCheck, 
  History,
  ArrowRight 
} from "lucide-react";

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: UserPlus,
      step: "01",
      title: "Sign Up & Choose Stream",
      description: "Create your account and select your stream/year to personalize your learning experience.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Upload,
      step: "02", 
      title: "Upload or Type Content",
      description: "Upload notes, PDFs, photos, type queries, or enter topics you want to learn about.",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: MessageSquare,
      step: "03",
      title: "Use AI Study Tools",
      description: "Use AI chat for doubts, generate neat study notes, or take quizzes instantly with smart AI assistance.",
      color: "bg-warning/10 text-warning",
    },
    {
      icon: BookCheck,
      step: "04",
      title: "Learn & Practice",
      description: "Study with AI-generated notes, practice quizzes, and get instant feedback on your understanding.",
      color: "bg-success/10 text-success",
    },
    {
      icon: History,
      step: "05",
      title: "Track & Revisit",
      description: "Track learning progress and revisit all past study content anytime for quick revision.",
      color: "bg-info/10 text-info",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            How It{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Our streamlined process makes learning simple, effective, and personalized to your academic needs.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Step Card */}
                <div className="text-center group">
                  {/* Step Number */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${step.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector Arrow (Desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <div className="flex items-center justify-center h-16">
                      <ArrowRight className="h-6 w-6 text-primary/40" />
                    </div>
                  </div>
                )}

                {/* Connector Line (Mobile) */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-8 mb-8">
                    <div className="w-0.5 h-12 bg-gradient-to-b from-primary/40 to-primary/10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-card-gradient rounded-3xl p-8 md:p-12 shadow-custom-lg max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Start Learning Smarter?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students who are acing their exams with StudySync AI.
              Your personalized learning journey is just one click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/auth" className="bg-gradient-primary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-glow hover:scale-105 transition-all duration-300 flex items-center justify-center group">
                Start Learning Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a 
                href="#features" 
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};