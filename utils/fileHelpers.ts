import { FileData, AppState } from '../types';

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const validateFile = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    return 'Unsupported file format. Please upload JPG, PNG, WEBP, or SVG.';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'File size exceeds 10MB limit.';
  }
  return null;
};

export const processFile = async (file: File): Promise<FileData> => {
  // Optimization: Do not read base64 immediately to save memory.
  // We will read it only when sending to the API.
  const previewUrl = URL.createObjectURL(file);
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    file,
    previewUrl,
    mimeType: file.type,
    processedUrl: null,
    status: AppState.IDLE,
    error: null
  };
};