import { connectMongo, MongoUser, MongoConversation, MongoMessage } from './mongoose';

// Ensure MongoDB is connected
connectMongo();

export async function getDb() {
  await connectMongo();
  return true; // Simplified for MongoDB setup
}

export async function upsertUser(user: any): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  try {
    const updateSet: any = {
      name: user.name,
      email: user.email,
      loginMethod: user.loginMethod,
      lastSignedIn: user.lastSignedIn || new Date(),
    };

    if (user.role) {
      updateSet.role = user.role;
    }

    await MongoUser.findOneAndUpdate(
      { openId: user.openId },
      { $set: updateSet },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  try {
    const user = await MongoUser.findOne({ openId }).lean();
    return user || undefined;
  } catch (error) {
    console.error("[Database] Failed to get user:", error);
    return undefined;
  }
}

export async function getUserConversations(userId: any) {
  try {
    // userId can be openId or internal _id, here we use openId as reference
    const openId = typeof userId === 'object' ? userId.openId : userId;
    const result = await MongoConversation.find({ userId: openId }).sort({ updatedAt: -1 }).lean();
    return result.map((c: any) => ({ ...c, id: c._id.toString() }));
  } catch (error) {
    console.error("[Database] Failed to get conversations:", error);
    throw error;
  }
}

export async function createConversation(userId: any, title: string = "New Conversation") {
  try {
    const openId = typeof userId === 'object' ? userId.openId : userId;
    const conversation = await MongoConversation.create({
      userId: openId,
      title,
    });
    return {
      id: conversation._id.toString(),
      userId: openId,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  } catch (error) {
    console.error("[Database] Failed to create conversation:", error);
    throw error;
  }
}

export async function deleteConversation(conversationId: string, userId: any) {
  try {
    const openId = typeof userId === 'object' ? userId.openId : userId;
    // Verify ownership and delete
    const result = await MongoConversation.deleteOne({ _id: conversationId, userId: openId });
    if (result.deletedCount > 0) {
      await MongoMessage.deleteMany({ conversationId });
      return true;
    }
    return false;
  } catch (error) {
    console.error("[Database] Failed to delete conversation:", error);
    throw error;
  }
}

export async function updateConversationTitle(conversationId: string, userId: any, title: string) {
  try {
    const openId = typeof userId === 'object' ? userId.openId : userId;
    const result = await MongoConversation.updateOne(
      { _id: conversationId, userId: openId },
      { $set: { title: title.trim() } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error("[Database] Failed to update conversation:", error);
    throw error;
  }
}

export async function getConversationIfOwned(conversationId: string, userId: any) {
  try {
    const openId = typeof userId === 'object' ? userId.openId : userId;
    const conversation = await MongoConversation.findOne({ _id: conversationId, userId: openId }).lean();
    return conversation ? { ...conversation, id: conversation._id.toString() } : null;
  } catch (error) {
    console.error("[Database] Failed to get conversation:", error);
    return null;
  }
}

export async function getConversationMessages(conversationId: string) {
  try {
    const result = await MongoMessage.find({ conversationId }).sort({ createdAt: 1 }).lean();
    return result.map((m: any) => ({ ...m, id: m._id.toString() }));
  } catch (error) {
    console.error("[Database] Failed to get messages:", error);
    throw error;
  }
}

export async function addMessage(conversationId: string, role: "user" | "assistant", content: string) {
  try {
    const message = await MongoMessage.create({
      conversationId,
      role,
      content,
    });
    // Update conversation updatedAt
    await MongoConversation.updateOne({ _id: conversationId }, { $set: { updatedAt: new Date() } });
    
    return {
      id: message._id.toString(),
      conversationId,
      role,
      content,
      createdAt: message.createdAt,
    };
  } catch (error) {
    console.error("[Database] Failed to add message:", error);
    throw error;
  }
}
