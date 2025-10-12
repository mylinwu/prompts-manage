import { ObjectId } from 'mongodb';

export interface Prompt {
  _id: ObjectId;
  userId: string;
  name: string;
  prompt: string;
  emoji?: string;
  description?: string;
  groups: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVersion {
  _id: ObjectId;
  promptId: string;
  version: number;
  name: string;
  prompt: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
}

export interface MarketPrompt {
  _id: ObjectId;
  originalPromptId?: string;
  userId?: string;
  name: string;
  prompt: string;
  emoji?: string;
  description?: string;
  groups: string[];
  publishedAt: Date;
  favoriteCount: number;
}

export interface Favorite {
  _id: ObjectId;
  userId: string;
  marketPromptId: string;
  createdAt: Date;
}

// 客户端使用的类型（不包含 ObjectId）
export interface PromptData {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  emoji?: string;
  description?: string;
  groups: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersionData {
  id: string;
  promptId: string;
  version: number;
  name: string;
  prompt: string;
  description?: string;
  createdAt: string;
  createdBy: string;
}

export interface MarketPromptData {
  id: string;
  originalPromptId?: string;
  userId?: string;
  name: string;
  prompt: string;
  emoji?: string;
  description?: string;
  groups: string[];
  publishedAt: string;
  favoriteCount: number;
  isFavorited?: boolean;
}

// Cherry Studio 导入导出格式
export interface AgentFormat {
  id: string;
  name: string;
  prompt: string;
  emoji?: string;
  description?: string;
  group?: string[];
}

