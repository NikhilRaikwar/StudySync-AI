# StudySync AI

**An Intelligent Learning Platform for All Students**

StudySync AI is a comprehensive AI-powered learning management system designed to revolutionize how students study, take notes, and prepare for exams. Built with modern web technologies and powered by Google's Gemini AI, this platform provides instant study assistance, automated note generation, and interactive quiz creation.

---

## 📚 Project Overview

This is a **Major Project** submitted for academic requirements. StudySync AI addresses the challenges faced by students in managing their study materials, organizing notes, and preparing effectively for examinations.

### Problem Statement
Students often struggle with:
- Managing handwritten notes and study materials
- Finding quick answers to complex academic questions
- Creating effective revision materials
- Tracking their learning progress across subjects

### Solution
StudySync AI provides an all-in-one platform that:
- Converts handwritten notes and PDFs into organized digital notes
- Offers instant AI-powered answers to study questions
- Generates interactive quizzes for self-assessment
- Maintains comprehensive study history for easy revision

---

## ✨ Key Features

### 1. **AI Study Chat Assistant**
- Real-time answers to any study question
- Concept clarification and chapter summaries
- Powered by Google Gemini 2.0 Flash
- Conversation history with continue chat feature
- Save and revisit past conversations

### 2. **Handwritten Notes Generator**
- Upload handwritten notes, photos, or PDFs
- AI generates clean, organized study notes
- Markdown-formatted output
- PDF export functionality
- Automatic note saving and history

### 3. **Smart Quiz Generator**
- Create quizzes from any topic or uploaded material
- Multiple-choice questions with instant feedback
- Score tracking and performance analytics
- Quiz history for revision
- Customizable question count (1-20 questions)

### 4. **Learning Analytics Dashboard**
- Track AI conversations (total and weekly)
- Monitor notes generated (total and daily)
- View quiz attempts and scores
- Comprehensive learning insights

### 5. **Study History Management**
- Organized tabs for Notes, Chats, and Quizzes
- Easy access to past study materials
- Delete unwanted content
- PDF preview for saved notes

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication system
  - Row Level Security (RLS)
  - Real-time subscriptions
- **Supabase Edge Functions** - Serverless functions

### AI Integration
- **Google Gemini 2.0 Flash** - AI model for:
  - Chat responses
  - Note generation
  - Quiz creation

### Additional Libraries
- **jsPDF** - PDF generation
- **html2canvas** - HTML to canvas conversion
- **React Markdown** - Markdown rendering

---

## 📂 Project Structure

```
studysync-ai/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── dashboard/     # Dashboard-specific components
│   │   ├── landing/       # Landing page sections
│   │   ├── layout/        # Header, Footer
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React Context (Auth)
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Third-party integrations
│   │   └── supabase/      # Supabase client & types
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   └── index.css          # Global styles
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/         # Edge functions
└── public/                # Static assets
```

---

## 🗄️ Database Schema

### Tables

**1. profiles**
- User profile information
- Academic details and preferences

**2. ai_conversations**
- Stores chat conversations
- Messages in JSONB format
- User-specific with RLS

**3. notes**
- Generated study notes
- Source tracking (file/topic)
- Full content storage

**4. quiz_attempts**
- Quiz questions and answers
- Score and performance tracking
- Detailed analytics

**5. study_sessions**
- Time tracking for analytics
- Session type classification

---

## 🔐 Security Features

- **Row Level Security (RLS)** on all database tables
- **Environment variables** for sensitive data
- **Secure authentication** via Supabase Auth
- **API keys protected** and not exposed in code
- **Input validation** and sanitization

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Google Gemini API key

### Environment Configuration

1. Copy `.env.example` to `.env`
2. Add your credentials:
   - Supabase Project URL and Keys
   - Gemini API Key

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## 👥 User Workflow

1. **Sign Up/Login** - Create account or login
2. **Choose Feature**:
   - Start AI chat for doubts
   - Upload materials for note generation
   - Create quizzes from topics
3. **Interact with AI** - Get instant responses
4. **Save & Review** - Access history anytime
5. **Track Progress** - View analytics dashboard

---

## 🎯 Future Enhancements

- Multi-language support
- Voice input for queries
- Collaborative study groups
- Advanced analytics with AI insights
- Mobile application (React Native)
- Integration with learning management systems
- Offline mode support

---

## 📊 Project Outcomes

- ✅ Fully functional web application
- ✅ Responsive design for all devices
- ✅ Real-time AI integration
- ✅ Secure user authentication
- ✅ Comprehensive database system
- ✅ Production-ready codebase

---

## 📝 Conclusion

StudySync AI successfully demonstrates the integration of modern web technologies with artificial intelligence to solve real-world educational challenges. The platform provides students with powerful tools to enhance their learning experience, making studying more efficient and effective.

---

## 📄 License

This project is developed as an academic submission for major project requirements.

---

## 👨‍💻 Developer

**Major Project 2024-2025**

Built with ❤️ for students, by students.

---

## 🙏 Acknowledgments

- Google Gemini AI for powerful language model
- Supabase for backend infrastructure
- shadcn/ui for beautiful components
- All open-source contributors
