/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export interface User {
  id: string;
  openId: string;
  name?: string;
  email?: string;
  role: 'user' | 'admin';
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export * from "./_core/errors";
