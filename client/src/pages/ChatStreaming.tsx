import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatBoxStreaming from "@/components/ChatBoxStreaming";
import ChatInput from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Moon, Sun, Globe } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatStreaming() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streamingContent, setStreamingContent] = useState("");

  // Fetch conversations
  const conversationsQuery = trpc.conversations.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch messages for active conversation
  const messagesQuery = trpc.messages.list.useQuery(
    { conversationId: activeConversationId! },
    { enabled: isAuthenticated && activeConversationId !== null }
  );

  // Create conversation mutation
  const createConversationMutation = trpc.conversations.create.useMutation({
    onSuccess: (newConversation) => {
      if (newConversation) {
        setActiveConversationId(newConversation.id);
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
      // Refetch messages to get the saved assistant message
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
      setActiveConversationId(conversationsQuery.data[0]!.id);
    }
  }, [conversationsQuery.data, activeConversationId]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleSendMessage = (content: string) => {
    if (activeConversationId) {
      sendMessageWithStream(activeConversationId, content);
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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0`}
      >
        <ConversationSidebar
          conversations={conversationsQuery.data || []}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onNewConversation={() => createConversationMutation.mutate()}
          onDeleteConversation={(id) =>
            deleteConversationMutation.mutate({ id })
          }
          onRenameConversation={(id, title) =>
            renameConversationMutation.mutate({ id, title })
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">
                {activeConversationId
                  ? conversationsQuery.data?.find(
                      (c) => c.id === activeConversationId
                    )?.title || t("conversation")
                  : t("newConversation")}
              </h1>
              {user && (
                <p className="text-xs text-muted-foreground">
                  {user.name || user.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={theme === "dark" ? t("lightMode") : t("darkMode")}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* Language Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title={t("language")}>
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

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </Button>
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
                <ChatInput
                  onSend={handleSendMessage}
                  isLoading={isStreaming}
                />
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
