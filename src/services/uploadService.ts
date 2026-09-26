import { DropBoxConfig, FileItem } from '../types';
import { generateRenamedFilename, generateTimestampedFilename } from '../utils/formatters';

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export interface UploadPayload {
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileData: string;
  folderId?: string;
  subfolderRule?: string;
  uploaderName?: string;
  uploaderEmail?: string;
  notes?: string;
  notificationEmail?: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
  originalFileName?: string;
  fileSize?: number;
  message?: string;
  isSimulated?: boolean;
  notificationSent?: boolean;
  notificationEmail?: string;
}

export async function uploadFileToDrive(
  fileItem: FileItem,
  config: DropBoxConfig,
  uploaderName: string,
  uploaderEmail: string,
  notes: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const maxBytes = config.maxFileSizeMb * 1024 * 1024;
  if (fileItem.file.size > maxBytes) {
    throw new Error(`File exceeds maximum size of ${config.maxFileSizeMb} MB`);
  }

  // Generate filename: timestamp prefix + original filename + sender name
  // e.g. document.pdf + 'John Doe' -> 20231027_153000_document_John_Doe.pdf
  const originalFileName = fileItem.file.name;
  const targetFileName = generateRenamedFilename(
    originalFileName,
    uploaderName,
    new Date(),
    {
      includeTimestamp: config.autoRenameTimestamp !== false,
      appendSender: config.appendSenderName !== false,
    }
  );

  const targetNotificationEmail = config.emailNotification
    ? (config.notificationEmail?.trim() || 'BChhabra20@gmail.com')
    : '';

  // Handle Demo Mode or unconfigured script URL
  if (config.isDemo || !config.scriptUrl || config.scriptUrl.trim() === '') {
    return simulateUpload(fileItem, targetFileName, originalFileName, config, onProgress);
  }

  onProgress?.(15);
  // Convert to Base64
  const base64Data = await fileToBase64(fileItem.file);
  onProgress?.(35);

  const payload: UploadPayload = {
    fileName: targetFileName,
    originalFileName: originalFileName,
    mimeType: fileItem.file.type || 'application/octet-stream',
    fileData: base64Data,
    folderId: config.folderId,
    subfolderRule: config.subfolderRule,
    uploaderName: uploaderName.trim() || 'Anonymous',
    uploaderEmail: uploaderEmail.trim() || '',
    notes: notes.trim() || '',
    notificationEmail: targetNotificationEmail
  };

  onProgress?.(55);

  const cleanScriptUrl = config.scriptUrl.trim();

  // Try direct upload first (using text/plain to avoid CORS OPTIONS preflight with Apps Script)
  try {
    const directResponse = await fetch(cleanScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    onProgress?.(85);

    if (directResponse.ok) {
      const responseText = await directResponse.text();
      const trimmed = responseText.trim();

      if (
        trimmed.startsWith('<!DOCTYPE') ||
        trimmed.startsWith('<html') ||
        trimmed.includes("window['ppCo") ||
        trimmed.includes('accounts.google.com')
      ) {
        throw new Error(
          "Google Apps Script deployment access error: Google returned a sign-in screen because 'Who has access' is not set to 'Anyone' in your Apps Script deployment. In Google Apps Script, click Deploy > Manage deployments > Edit > set 'Who has access' to 'Anyone' > Deploy."
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { status: 'success', message: responseText };
      }

      if (data.status === 'error') {
        throw new Error(data.message || 'Google Apps Script reported an error');
      }

      onProgress?.(100);
      return {
        success: true,
        fileId: data.fileId || `gas_${Date.now()}`,
        fileUrl: data.fileUrl || `https://drive.google.com/drive/folders/${config.folderId}`,
        fileName: data.fileName || targetFileName,
        originalFileName: originalFileName,
        fileSize: data.fileSize || fileItem.file.size,
        message: data.message || 'File uploaded successfully',
        notificationSent: Boolean(data.notificationSent || config.emailNotification),
        notificationEmail: targetNotificationEmail
      };
    }
  } catch (directErr: any) {
    console.warn('Direct upload to Google Apps Script encountered an issue, attempting backend proxy fallback...', directErr);
  }

  // Fallback: Use backend proxy to bypass CORS / redirect issues
  try {
    onProgress?.(70);
    const proxyRes = await fetch('/api/proxy-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scriptUrl: cleanScriptUrl,
        payload
      }),
    });

    onProgress?.(90);

    const proxyData = await proxyRes.json();
    if (!proxyRes.ok || proxyData.status === 'error') {
      throw new Error(proxyData.message || 'Failed to upload via proxy');
    }

    onProgress?.(100);
    return {
      success: true,
      fileId: proxyData.fileId || `gas_${Date.now()}`,
      fileUrl: proxyData.fileUrl || `https://drive.google.com/drive/folders/${config.folderId}`,
      fileName: proxyData.fileName || targetFileName,
      originalFileName: originalFileName,
      fileSize: proxyData.fileSize || fileItem.file.size,
      message: proxyData.message || 'File uploaded successfully',
      notificationSent: Boolean(proxyData.notificationSent || config.emailNotification),
      notificationEmail: targetNotificationEmail
    };
  } catch (proxyErr: any) {
    throw new Error(proxyErr.message || 'Could not upload file to Google Drive. Please verify your Apps Script Web App URL.');
  }
}

async function simulateUpload(
  fileItem: FileItem,
  targetFileName: string,
  originalFileName: string,
  config: DropBoxConfig,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const steps = [20, 45, 70, 90, 100];
  for (const step of steps) {
    await new Promise((r) => setTimeout(r, 220));
    onProgress?.(step);
  }

  const mockFileId = 'sim_' + Math.random().toString(36).substring(2, 12);
  const mockFileUrl = `https://drive.google.com/drive/folders/${config.folderId || '1AbCdEfGhIjKlMnOpQrStUvWxYz12345'}`;
  const targetEmail = config.emailNotification ? (config.notificationEmail?.trim() || 'BChhabra20@gmail.com') : '';

  return {
    success: true,
    fileId: mockFileId,
    fileUrl: mockFileUrl,
    fileName: targetFileName,
    originalFileName: originalFileName,
    fileSize: fileItem.file.size,
    message: 'Uploaded in Demo Sandbox (Ready for live Apps Script)',
    isSimulated: true,
    notificationSent: Boolean(config.emailNotification && targetEmail),
    notificationEmail: targetEmail
  };
}

export async function sendTestEmailNotification(
  scriptUrl?: string,
  notificationEmail?: string
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const res = await fetch('/api/test-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scriptUrl: scriptUrl?.trim(),
        notificationEmail: notificationEmail?.trim() || 'BChhabra20@gmail.com',
        uploaderName: 'John Doe',
        fileName: 'sample_document_John_Doe_20260924_120000.pdf'
      })
    });

    const data = await res.json();
    return {
      success: Boolean(data.success),
      message: data.message || 'Notification test executed',
      details: data
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to send test notification'
    };
  }
}

export async function testScriptConnectivity(scriptUrl: string): Promise<{ success: boolean; message: string; details?: any }> {
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'URL must begin with https://script.google.com/macros/s/.../exec'
    };
  }

  try {
    const res = await fetch('/api/test-gas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptUrl: scriptUrl.trim() }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error || `HTTP ${data.status}: Google Apps Script returned an unexpected response. Make sure 'Who has access' is set to 'Anyone'.`,
        details: data
      };
    }

    const scriptData = data.data || {};
    if (scriptData.status === 'active') {
      const folderNote = scriptData.folderValid
        ? `Target folder: "${scriptData.folderName}" verified.`
        : `Note: Folder ID couldn't be verified yet (check permissions or ID).`;
      return {
        success: true,
        message: `Connected successfully! Web App is online and operational. ${folderNote}`,
        details: scriptData
      };
    }

    return {
      success: false,
      message: data.error || 'The endpoint responded, but did not return the DriveDrop active status. Make sure the full Code.gs script is pasted and deployed with "Who has access: Anyone".',
      details: scriptData
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Could not reach endpoint.'
    };
  }
}
