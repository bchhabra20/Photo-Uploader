import { DropBoxConfig, UploadHistoryItem } from '../types';

const STORAGE_KEY_CONFIGS = 'drivedrop_boxes';
const STORAGE_KEY_ACTIVE_ID = 'drivedrop_active_id';
const STORAGE_KEY_HISTORY = 'drivedrop_history';

export const PREDEFINED_NOTIFICATION_EMAIL = 'BChhabra20@gmail.com';

const DEFAULT_CONFIGS: DropBoxConfig[] = [
  {
    id: 'demo-dropbox-1',
    title: 'Client File Drop Box',
    description: 'Please upload your high-resolution images, signed documents, or project archives here.',
    folderId: '1AbCdEfGhIjKlMnOpQrStUvWxYz12345',
    folderName: 'Client Inbound Assets',
    scriptUrl: '',
    maxFileSizeMb: 25,
    allowedCategory: 'all',
    customExtensions: '',
    subfolderRule: 'by-date',
    autoRenameTimestamp: true,
    appendSenderName: true,
    emailNotification: true,
    notificationEmail: PREDEFINED_NOTIFICATION_EMAIL,
    requireUploaderName: true,
    requireUploaderEmail: false,
    allowNotes: true,
    createdAt: new Date().toISOString(),
    isDemo: true
  }
];

export function getStoredDropBoxes(): DropBoxConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIGS);
    if (!raw) {
      saveDropBoxes(DEFAULT_CONFIGS);
      return DEFAULT_CONFIGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure autoRenameTimestamp, appendSenderName, and notification defaults are applied to existing saved configs
      return parsed.map((item) => ({
        ...item,
        autoRenameTimestamp: item.autoRenameTimestamp !== false,
        appendSenderName: item.appendSenderName !== false,
        notificationEmail: item.notificationEmail || PREDEFINED_NOTIFICATION_EMAIL,
        emailNotification: item.emailNotification !== false,
      }));
    }
    return DEFAULT_CONFIGS;
  } catch {
    return DEFAULT_CONFIGS;
  }
}

export function saveDropBoxes(boxes: DropBoxConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(boxes));
  } catch (err) {
    console.error('Failed to save drop boxes:', err);
  }
}

export function getActiveDropBoxId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (id) return id;
  } catch {}
  return DEFAULT_CONFIGS[0].id;
}

export function setActiveDropBoxId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch {}
}

export function getUploadHistory(): UploadHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addUploadHistoryItem(item: UploadHistoryItem): void {
  try {
    const current = getUploadHistory();
    const updated = [item, ...current].slice(0, 100); // keep last 100 items
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save history item:', err);
  }
}

export function clearUploadHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch {}
}
