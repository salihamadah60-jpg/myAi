import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatBoxStreaming from "@/components/ChatBoxStreaming";
import ChatInput from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Moon, Sun, Globe, Cpu } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "forge" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq" },
  { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 70B", provider: "groq" },
  { id: "llama3", name: "Ollama Llama 3", provider: "ollama" },
  { id: "mistral", name: "Ollama Mistral", provider: "ollama" },
];

export default function ChatStreaming() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streamingContent, setStreamingContent] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);

  // Fetch conversations
  const conversationsQuery = trpc.conversations.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch messages for active conversation
  const messagesQuery = trpc.messages.list.useQuery(
    { conversationId: activeConversationId as any },
    { enabled: isAuthenticated && activeConversationId !== null }
  );

  // Create conversation mutation
  const createConversationMutation = trpc.conversations.create.useMutation({
    onSuccess: (newConversation) => {
      if (newConversation) {
        setActiveConversationId(newConversation.id as any);
        conversationsQuery.refetch();
      }
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = trpc.conversations.delete.useMutation({
    onSuccess: () => {
      if (activeConversationId) {
        setActiveConversationId(null);
      }
      conversationsQuery.refetch();
    },
  });

  // Rename conversation mutation
  const renameConversationMutation = trpc.conversations.rename.useMutation({
    onSuccess: () => {
      conversationsQuery.refetch();
    },
  });

  // Use streaming chat hook
  const { isStreaming, error, sendMessageWithStream } = useStreamingChat({
    onChunk: (chunk) => {
      setStreamingContent((prev) => prev + chunk);
    },
    onComplete: (fullContent) => {
      setStreamingContent("");
      messagesQuery.refetch();
    },
    onError: (err) => {
      console.error("Streaming error:", err);
      setStreamingContent("");
    },
  });

  // Set first conversation as active on load
  useEffect(() => {
    if (
      conversationsQuery.data &&
      conversationsQuery.data.length > 0 &&
      !activeConversationId
    ) {
      setActiveConversationId(conversationsQuery.data[0]!.id as any);
    }
  }, [conversationsQuery.data, activeConversationId]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleSendMessage = (content: string) => {
    if (activeConversationId) {
      sendMessageWithStream(
        activeConversationId, 
        content, 
        selectedModel.provider, 
        selectedModel.id
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            {t("welcomeToChat")}
          </h1>
          <p className="text-muted-foreground">
            {t("pleaseSignInToContinue")}
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>{t("signIn")}</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0 border-r border-border`}
      >
        <ConversationSidebar
          conversations={conversationsQuery.data || []}
          activeConversationId={activeConversationId as any}
          onSelectConversation={(id) => setActiveConversationId(id as any)}
          onNewConversation={() => createConversationMutation.mutate()}
          onDeleteConversation={(id) =>
            deleteConversationMutation.mutate({ id: id as any })
          }
          onRenameConversation={(id, title) =>
            renameConversationMutation.mutate({ id: id as any, title })
          }
          isLoading={
            createConversationMutation.isPending ||
            deleteConversationMutation.isPending
          }
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-foreground truncate max-w-[150px] md:max-w-[300px]">
                {activeConversationId
                  ? conversationsQuery.data?.find(
                      (c) => (c.id as any) === activeConversationId
                    )?.title || t("conversation")
                  : t("newConversation")}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <Select 
              value={selectedModel.id} 
              onValueChange={(val) => setSelectedModel(MODELS.find(m => m.id === val)!)}
            >
              <SelectTrigger className="w-[140px] md:w-[200px] h-9">
                <Cpu className="w-4 h-4 mr-2 text-primary" />
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2 py-1.5">
                  Select AI Model
                </DropdownMenuLabel>
                {MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 ml-1 border-l pl-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Language Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Globe className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setLanguage("ar")}
                    className={language === "ar" ? "bg-accent" : ""}
                  >
                    {t("arabic")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setLanguage("en")}
                    className={language === "en" ? "bg-accent" : ""}
                  >
                    {t("english")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{user?.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        {activeConversationId ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {messagesQuery.isLoading && messagesQuery.data === undefined ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="animate-spin inline-block">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full" />
                  </div>
                  <p className="text-muted-foreground">{t("loadingMessages")}</p>
                </div>
              </div>
            ) : messagesQuery.isError ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-destructive">{t("errorLoadingMessages")}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => messagesQuery.refetch()}
                  >
                    {t("retry")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <ChatBoxStreaming
                  messages={messagesQuery.data || []}
                  isLoading={isStreaming}
                  streamingContent={streamingContent}
                  error={error}
                />
                <div className="p-4 bg-background/80 backdrop-blur-md">
                  <div className="max-w-4xl mx-auto">
                    <ChatInput
                      onSend={handleSendMessage}
                      isLoading={isStreaming}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {t("startNewConversation")}
              </p>
              <Button 
                onClick={() => createConversationMutation.mutate()}
                disabled={createConversationMutation.isPending}
              >
                {t("createNewConversation")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
