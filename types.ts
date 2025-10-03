
export enum MessageRole {
  USER = 'user',
  BOT = 'model',
}

export interface MessagePart {
  text?: string;
  code?: {
    language: string;
    content: string;
  };
  imageUrl?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  imageFile?: File;
  textFile?: File;
}