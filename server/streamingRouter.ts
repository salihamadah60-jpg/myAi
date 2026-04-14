import { Router } from "express";
import { protectedMiddleware } from "./_core/trpc";
import { z } from "zod";
import {
  getConversationIfOwned,
  getConversationMessages,
  addMessage,
} from "./db";
import { streamLLMResponse } from "./_core/llm";

const router = Router();

// Middleware to verify user (simplified version)
const verifyUser = async (req: any, res: any, next: any) => {
  try {
    // This assumes the user is already attached to req by your auth middleware
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

router.post("/messages/send-stream", verifyUser, async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    // Validate input
    if (!conversationId || !content || typeof content !== "string") {
      return res.status(400).json({ error: "Invalid input" });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Verify ownership of conversation
    const conversation = await getConversationIfOwned(
      conversationId,
      req.user.id
    );
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Add user message
    const userMessage = await addMessage(
      conversationId,
      "user",
      content
    );

    if (!userMessage) {
      return res.status(500).json({ error: "Failed to save user message" });
    }

    // Get all messages for context
    const allMessages = await getConversationMessages(conversationId);

    // Prepare messages for LLM
    const llmMessages = allMessages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Set up streaming response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullContent = "";

    try {
      // Stream the LLM response
      for await (const chunk of streamLLMResponse({
        messages: llmMessages,
      })) {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // Save the complete assistant message
      const assistantMessage = await addMessage(
        conversationId,
        "assistant",
        fullContent
      );

      if (!assistantMessage) {
        res.write(`data: ${JSON.stringify({ error: "Failed to save assistant message" })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ done: true, message: assistantMessage })}\n\n`);
      }
    } catch (error) {
      console.error("[Streaming Error]", error);
      res.write(
        `data: ${JSON.stringify({ error: "Failed to get response from AI" })}\n\n`
      );
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("[Stream Endpoint Error]", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
