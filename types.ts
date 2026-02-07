export interface EditResponse {
  imageUrl: string | null;
  text: string | null;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ImageFile {
  file: File;
  preview: string;
  base64: string; // Raw base64 without data prefix
  mimeType: string;
}
