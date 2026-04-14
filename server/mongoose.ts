import mongoose, { Schema, Document } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Thaker:772951869Th@cluster0.mkp6hlu.mongodb.net/myai?retryWrites=true&w=majority';

export async function connectMongo() {
  if (mongoose.connection.readyState >= 1) return;

  // Global transform: _id -> id
  mongoose.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
    }
  });

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[MongoDB] Connected successfully');
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
  }
}

// User Schema
interface IUser extends Document {
  openId: string;
  name?: string;
  email?: string;
  loginMethod?: string;
  role: 'user' | 'admin';
  lastSignedIn: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  openId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  loginMethod: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastSignedIn: { type: Date, default: Date.now },
}, { timestamps: true });

export const MongoUser = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Conversation Schema
interface IConversation extends Document {
  userId: string; // Using openId as reference for simplicity in this setup
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'New Conversation' },
}, { timestamps: true });

export const MongoConversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

// Message Schema
interface IMessage extends Document {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export const MongoMessage = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
