import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl text-primary">
            <BookOpen className="h-7 w-7" />
            <span>StudySync AI</span>
          </Link>
          
          {/* Tagline */}
          <p className="text-muted-foreground text-sm max-w-md">
            Intelligent learning platform for students with AI-powered study tools, notes, and quizzes.
          </p>
          
          {/* Copyright */}
          <p className="text-muted-foreground text-xs">
            © 2024 StudySync AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};