import { useState, useCallback } from "react";

interface UseStreamingChatOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: string) => void;
}

export function useStreamingChat(options: UseStreamingChatOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessageWithStream = useCallback(
    async (conversationId: number, content: string) => {
      setIsStreaming(true);
      setError(null);

      let fullContent = "";

      try {
        const response = await fetch("/api/streaming/messages/send-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            conversationId,
            content,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.done) {
                  // Streaming complete
                  break;
                }

                if (parsed.content) {
                  fullContent += parsed.content;
                  options.onChunk?.(parsed.content);
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }

        options.onComplete?.(fullContent);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        options.onError?.(errorMessage);
      } finally {
        setIsStreaming(false);
      }
    },
    [options]
  );

  return {
    isStreaming,
    error,
    sendMessageWithStream,
  };
}
