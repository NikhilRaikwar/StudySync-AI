import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare,
  Clock,
  FileText,
  HelpCircle,
  LogOut,
  History,
  BookOpen,
  ChevronDown,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AIChatContent from "@/components/dashboard/AIChatContent";
import NotesContent from "@/components/dashboard/NotesContent";
import QuizContent from "@/components/dashboard/QuizContent";
import HistoryContent from "@/components/dashboard/HistoryContent";

const sidebarItems = [
  { title: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  { title: "AI Chat", icon: MessageSquare, view: "chat" },
  { title: "Notes Generator", icon: FileText, view: "notes" },
  { title: "Quiz Generator", icon: HelpCircle, view: "quizzes" },
  { title: "History", icon: History, view: "history" },
];

export default function Dashboard() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState({
    conversations: 0,
    conversationsThisWeek: 0,
    notes: 0,
    notesToday: 0,
    quizzes: 0,
  });
  const [loadedConversation, setLoadedConversation] = useState<{
    id: string;
    messages: any[];
  } | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setProfile(data);
      }
    };

    const fetchAnalytics = async () => {
      if (user) {
        // Get total conversations
        const { count: totalConversations } = await supabase
          .from('ai_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get conversations this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: weekConversations } = await supabase
          .from('ai_conversations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekAgo.toISOString());

        // Get total notes
        const { count: totalNotes } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get notes created today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: notesToday } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        // Get total quiz attempts
        const { count: totalQuizzes } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setAnalytics({
          conversations: totalConversations || 0,
          conversationsThisWeek: weekConversations || 0,
          notes: totalNotes || 0,
          notesToday: notesToday || 0,
          quizzes: totalQuizzes || 0,
        });
      }
    };

    fetchProfile();
    fetchAnalytics();
  }, [user]);

  const stats = [
    {
      title: "AI Conversations",
      value: analytics.conversations.toString(),
      description: `+${analytics.conversationsThisWeek} this week`,
      icon: MessageSquare,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Notes Generated",
      value: analytics.notes.toString(),
      description: `${analytics.notesToday} new today`,
      icon: FileText,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Quizzes Taken",
      value: analytics.quizzes.toString(),
      description: "Across all subjects",
      icon: HelpCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  const quickActions = [
    {
      title: "AI Study Chat",
      description: "Ask me anything about your studies",
      icon: MessageSquare,
      color: "bg-primary",
      view: "chat",
      action: () => setCurrentView("chat"),
    },
    {
      title: "Generate Notes",
      description: "Create study notes from PDFs",
      icon: FileText,
      color: "bg-accent",
      view: "notes",
      action: () => setCurrentView("notes"),
    },
    {
      title: "Take Quizzes",
      description: "Test your knowledge",
      icon: HelpCircle,
      color: "bg-warning",
      view: "quizzes",
      action: () => setCurrentView("quizzes"),
    },
  ];


  const DashboardSidebar = () => (
    <Sidebar className="w-64 flex flex-col h-screen">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo and Navigation */}
        <div className="flex-1 overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center space-x-2 text-lg font-bold text-primary py-4">
              <BookOpen className="h-7 w-7" />
              <span>StudySync AI</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sidebarItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className={currentView === item.view ? "bg-primary text-primary-foreground" : ""}
                    >
                      <button
                        onClick={() => setCurrentView(item.view)}
                        className="flex items-center w-full"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* User Menu Fixed at Bottom */}
        <div className="border-t border-border mt-auto">
          <SidebarGroup>
            <SidebarGroupContent className="p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <main className="flex-1 bg-muted/30 overflow-x-hidden">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-lg">
            <div className="flex items-center space-x-4 px-4 sm:px-6 py-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {currentView === "dashboard" && "Dashboard"}
                {currentView === "chat" && "AI Study Assistant"}
                {currentView === "notes" && "Notes Generator"}
                {currentView === "quizzes" && "Quiz Generator"}
                {currentView === "history" && "History"}
              </h1>
            </div>
          </header>

          {/* Main Content */}
          <div className="p-4 sm:p-6 h-[calc(100vh-73px)] overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full">
            {currentView === "dashboard" && (
              <div className="space-y-8">
                {/* Welcome Section */}
                <div className="bg-gradient-hero text-white rounded-2xl p-8">
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Student'}! 👋
                  </h2>
                  <p className="text-white/90">Ready to continue your learning journey?</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat) => (
                    <Card key={stat.title} className="feature-card">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                          <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quickActions.map((action) => (
                      <Card 
                        key={action.title} 
                        className="feature-card cursor-pointer"
                        onClick={action.action}
                      >
                        <CardContent className="p-6">
                          <div className={`w-12 h-12 rounded-lg ${action.color} text-white flex items-center justify-center mb-4`}>
                            <action.icon className="h-6 w-6" />
                          </div>
                          <h4 className="font-semibold mb-2">{action.title}</h4>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentView === "chat" && (
              <AIChatContent 
                loadedConversation={loadedConversation}
                onConversationLoaded={() => setLoadedConversation(null)}
              />
            )}
            {currentView === "notes" && <NotesContent />}
            {currentView === "quizzes" && <QuizContent />}
            {currentView === "history" && (
              <HistoryContent 
                onContinueChat={(conversation) => {
                  setLoadedConversation(conversation);
                  setCurrentView("chat");
                }}
              />
            )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}