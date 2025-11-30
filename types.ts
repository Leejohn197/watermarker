export interface ProcessedImageResult {
  imageUrl: string;
  originalUrl: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type Language = 'en' | 'zh';

export enum ProcessingMode {
  WATERMARK = 'watermark',
  STICKER = 'sticker',
  TEXT = 'text',
  GENERAL = 'general'
}

export interface FileData {
  id: string;
  file: File;
  previewUrl: string;
  // base64 removed for memory optimization; generated on demand
  mimeType: string;
  processedUrl: string | null;
  status: AppState;
  error?: string | null;
}