import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ConversationSidebar from "@/components/ConversationSidebar";
import ChatBox from "@/components/ChatBox";
import ChatInput from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Chat() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations
  const conversationsQuery = trpc.conversations.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch messages for active conversation
  const messagesQuery = trpc.messages.list.useQuery(
    { conversationId: activeConversationId! },
    { enabled: isAuthenticated && activeConversationId !== null }
  );

  // Send message mutation
  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setError(null);
      messagesQuery.refetch();
    },
    onError: (err) => {
      const errorMessage = err.message || "حدث خطأ أثناء إرسال الرسالة";
      setError(errorMessage);
      console.error("[Send Message Error]", err);
    },
  });

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            مرحباً بك في تطبيق الدردشة
          </h1>
          <p className="text-muted-foreground">
            يرجى تسجيل الدخول للمتابعة
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>تسجيل الدخول</a>
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
                    )?.title || "محادثة"
                  : "محادثة جديدة"}
              </h1>
              {user && (
                <p className="text-xs text-muted-foreground">
                  {user.name || user.email}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </Button>
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
                  <p className="text-muted-foreground">جاري تحميل الرسائل...</p>
                </div>
              </div>
            ) : messagesQuery.isError ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-destructive">حدث خطأ أثناء تحميل الرسائل</p>
                  <Button 
                    variant="outline" 
                    onClick={() => messagesQuery.refetch()}
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <ChatBox
                  messages={messagesQuery.data || []}
                  isLoading={sendMessageMutation.isPending}
                  error={error}
                />
                <ChatInput
                  onSend={(content) =>
                    sendMessageMutation.mutate({
                      conversationId: activeConversationId,
                      content,
                    })
                  }
                  isLoading={sendMessageMutation.isPending}
                />
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                ابدأ محادثة جديدة للبدء
              </p>
              <Button 
                onClick={() => createConversationMutation.mutate()}
                disabled={createConversationMutation.isPending}
              >
                إنشاء محادثة جديدة
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
