import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getUserConversations,
  createConversation,
  deleteConversation,
  updateConversationTitle,
  getConversationMessages,
  addMessage,
  getConversationIfOwned,
} from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getUserConversations(ctx.user.id);
      } catch (error) {
        console.error("[Conversations] Error listing conversations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
        });
      }
    }),

    create: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const conversation = await createConversation(ctx.user.id);
        if (!conversation) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create conversation",
          });
        }
        return conversation;
      } catch (error) {
        console.error("[Conversations] Error creating conversation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create conversation",
        });
      }
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify ownership before deleting
          const conversation = await getConversationIfOwned(input.id, ctx.user.id);
          if (!conversation) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Conversation not found",
            });
          }

          const success = await deleteConversation(input.id, ctx.user.id);
          if (!success) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to delete conversation",
            });
          }
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Conversations] Error deleting conversation:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete conversation",
          });
        }
      }),

    rename: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify ownership before renaming
          const conversation = await getConversationIfOwned(input.id, ctx.user.id);
          if (!conversation) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Conversation not found",
            });
          }

          const success = await updateConversationTitle(
            input.id,
            ctx.user.id,
            input.title
          );
          if (!success) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to rename conversation",
            });
          }
          return { success: true };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Conversations] Error renaming conversation:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to rename conversation",
          });
        }
      }),
  }),

  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          // Verify ownership of conversation
          const conversation = await getConversationIfOwned(
            input.conversationId,
            ctx.user.id
          );
          if (!conversation) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Conversation not found",
            });
          }

          return await getConversationMessages(input.conversationId);
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Messages] Error listing messages:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch messages",
          });
        }
      }),

    send: protectedProcedure
      .input(z.object({ conversationId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify ownership of conversation
          const conversation = await getConversationIfOwned(
            input.conversationId,
            ctx.user.id
          );
          if (!conversation) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Conversation not found",
            });
          }

          // Add user message
          const userMessage = await addMessage(
            input.conversationId,
            "user",
            input.content
          );

          if (!userMessage) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to save user message",
            });
          }

          // Get all messages for context
          const allMessages = await getConversationMessages(input.conversationId);

          // Prepare messages for LLM
          const llmMessages = allMessages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));

          // Get response from LLM
          let assistantContent = "";
          try {
            const response = await invokeLLM({
              messages: llmMessages,
            });

            // Extract content from response
            const firstChoice = response.choices?.[0];
            if (firstChoice && "message" in firstChoice) {
              const message = firstChoice.message as { content?: string };
              assistantContent = message.content || "";
            }

            if (!assistantContent) {
              throw new Error("Empty response from LLM");
            }
          } catch (error) {
            console.error("[LLM] Error invoking LLM:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to get response from AI. Please try again.",
            });
          }

          // Add assistant message
          const assistantMessage = await addMessage(
            input.conversationId,
            "assistant",
            assistantContent
          );

          if (!assistantMessage) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to save assistant message",
            });
          }

          return {
            userMessage,
            assistantMessage,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Messages] Error sending message:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send message",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
