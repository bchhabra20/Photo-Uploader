export type AllowedCategory = 'all' | 'documents' | 'images' | 'media' | 'custom';
export type SubfolderRule = 'none' | 'by-date' | 'by-uploader';

export interface DropBoxConfig {
  id: string;
  title: string;
  description: string;
  folderId: string;
  folderName: string;
  scriptUrl: string;
  maxFileSizeMb: number;
  allowedCategory: AllowedCategory;
  customExtensions: string; // comma separated: "pdf, docx, png"
  subfolderRule: SubfolderRule;
  autoRenameTimestamp: boolean; // Automatically prepends YYYYMMDD_HHMMSS to filename
  appendSenderName: boolean; // Automatically appends sanitized sender name to filename (e.g. document_John_Doe.pdf)
  emailNotification: boolean;
  notificationEmail: string;
  requireUploaderName: boolean;
  requireUploaderEmail: boolean;
  allowNotes: boolean;
  createdAt: string;
  isDemo?: boolean;
}

export interface FileItem {
  id: string;
  file: File;
  name: string; // Original or display name
  renamedName?: string; // e.g. 20231027_153000_document.pdf
  size: number;
  type: string;
  previewUrl?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMsg?: string;
  resultUrl?: string;
  resultId?: string;
}

export interface UploadHistoryItem {
  id: string;
  dropBoxId: string;
  dropBoxTitle: string;
  fileName: string; // Timestamped filename
  originalFileName?: string; // Original filename before timestamp
  fileSize: number;
  uploaderName: string;
  uploaderEmail: string;
  notes: string;
  timestamp: string;
  fileUrl?: string;
  fileId?: string;
  status: 'success' | 'failed';
  notificationSent?: boolean;
  notificationEmail?: string;
}

export interface ScriptTestResult {
  tested: boolean;
  success: boolean;
  message: string;
  details?: any;
}
