import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Message } from "@shared/types";

interface ChatBoxStreamingProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent?: string;
  error?: string | null;
}

export default function ChatBoxStreaming({
  messages,
  isLoading,
  streamingContent = "",
  error,
}: ChatBoxStreamingProps) {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, streamingContent]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && !streamingContent && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-2">
              <p className="text-muted-foreground text-lg">
                {t("startNewConversation")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("typeYourMessageHere")}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-card text-card-foreground border border-border rounded-bl-none"
              }`}
            >
              {message.role === "assistant" ? (
                <Streamdown className="text-sm leading-relaxed">
                  {message.content}
                </Streamdown>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Streaming Content */}
        {streamingContent && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-card text-card-foreground border border-border px-4 py-3 rounded-lg rounded-bl-none max-w-xs lg:max-w-md xl:max-w-lg">
              <Streamdown className="text-sm leading-relaxed">
                {streamingContent}
              </Streamdown>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && !streamingContent && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-card text-card-foreground border border-border px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {t("replying")}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-destructive/10 text-destructive border border-destructive/20 px-4 py-3 rounded-lg rounded-bl-none flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{t("errorSendingMessage")}</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
