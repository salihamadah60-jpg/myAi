import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, messages } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all conversations for a user, ordered by most recent first
 */
export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get conversations: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get conversations:", error);
    throw error;
  }
}

/**
 * Create a new conversation for a user
 */
export async function createConversation(
  userId: number,
  title: string = "New Conversation"
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create conversation: database not available");
    return null;
  }

  try {
    const result = await db.insert(conversations).values({
      userId,
      title,
    });
    const conversationId = result[0]?.insertId;
    return conversationId
      ? { id: conversationId, userId, title, createdAt: new Date(), updatedAt: new Date() }
      : null;
  } catch (error) {
    console.error("[Database] Failed to create conversation:", error);
    throw error;
  }
}

/**
 * Delete a conversation (and its messages)
 */
export async function deleteConversation(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete conversation: database not available");
    return false;
  }

  try {
    // First delete all messages in this conversation
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    // Then delete the conversation
    const result = await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      );
    return (result[0]?.affectedRows ?? 0) > 0;
  } catch (error) {
    console.error("[Database] Failed to delete conversation:", error);
    throw error;
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: number,
  userId: number,
  title: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update conversation: database not available");
    return false;
  }

  if (!title || title.trim().length === 0) {
    throw new Error("Title cannot be empty");
  }

  if (title.length > 255) {
    throw new Error("Title is too long");
  }

  try {
    const result = await db
      .update(conversations)
      .set({ title: title.trim() })
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      );
    return (result[0]?.affectedRows ?? 0) > 0;
  } catch (error) {
    console.error("[Database] Failed to update conversation:", error);
    throw error;
  }
}

/**
 * Get conversation by ID and verify ownership
 */
export async function getConversationIfOwned(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get conversation: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        )
      )
      .limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get conversation:", error);
    throw error;
  }
}

/**
 * Get all messages for a conversation
 */
export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get messages: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get messages:", error);
    throw error;
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: number,
  role: "user" | "assistant",
  content: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add message: database not available");
    return null;
  }

  try {
    const result = await db.insert(messages).values({
      conversationId,
      role,
      content,
    });
    const messageId = result[0]?.insertId;
    return messageId
      ? {
          id: messageId,
          conversationId,
          role,
          content,
          createdAt: new Date(),
        }
      : null;
  } catch (error) {
    console.error("[Database] Failed to add message:", error);
    throw error;
  }
}
