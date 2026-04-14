import { Router } from "express";
import {
  getConversationIfOwned,
  getConversationMessages,
  addMessage,
} from "./db";
import { streamLLMResponse } from "./_core/llm";
import * as db from "./db";

const router = Router();

// Mock verify user for local development
const verifyUser = async (req: any, res: any, next: any) => {
  try {
    const openId = "local-dev-user";
    let user = await db.getUserByOpenId(openId);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

router.post("/messages/send-stream", verifyUser, async (req, res) => {
  try {
    const { conversationId, content, provider, model } = req.body;

    if (!conversationId || !content || typeof content !== "string") {
      return res.status(400).json({ error: "Invalid input" });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const conversation = await getConversationIfOwned(
      conversationId,
      req.user.id
    );
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const userMessage = await addMessage(
      conversationId,
      "user",
      content
    );

    if (!userMessage) {
      return res.status(500).json({ error: "Failed to save user message" });
    }

    const allMessages = await getConversationMessages(conversationId);

    const llmMessages = allMessages.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullContent = "";

    try {
      for await (const chunk of streamLLMResponse({
        messages: llmMessages,
        provider,
        model
      })) {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

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
