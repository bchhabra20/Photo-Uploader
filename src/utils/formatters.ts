export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function getFileTypeCategory(fileName: string, mimeType: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (['pdf'].includes(ext) || mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext) || mimeType.includes('word') || mimeType.includes('text')) {
    return 'document';
  }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || mimeType.includes('sheet') || mimeType.includes('csv')) {
    return 'spreadsheet';
  }
  if (['ppt', 'pptx', 'odp'].includes(ext) || mimeType.includes('presentation')) {
    return 'presentation';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed')) {
    return 'archive';
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || mimeType.startsWith('video/')) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) || mimeType.startsWith('audio/')) {
    return 'audio';
  }
  return 'file';
}

/**
 * Cleans and sanitizes a sender's name for safe inclusion in filenames.
 * Replaces spaces with underscores, removes unsafe file characters, collapses underscores.
 * Example: 'John Doe' -> 'John_Doe', 'Dr. Smith' -> 'Dr_Smith'
 */
export function sanitizeSenderName(name?: string): string {
  if (!name) return '';
  return name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^\w\s-]/g, '') // remove characters not alphanumeric, whitespace, hyphen, or underscore
    .replace(/\s+/g, '_')    // replace spaces with underscores
    .replace(/_+/g, '_')     // collapse multiple underscores
    .replace(/^_+|_+$/g, ''); // trim leading/trailing underscores
}

/**
 * Splits a filename into its base name and extension.
 * Example: 'document.pdf' -> { base: 'document', ext: '.pdf' }
 * Example: 'README' -> { base: 'README', ext: '' }
 */
export function splitFilename(filename: string): { base: string; ext: string } {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return { base: filename, ext: '' };
  }
  return {
    base: filename.substring(0, lastDot),
    ext: filename.substring(lastDot),
  };
}

/**
 * Returns a timestamp string in the format: YYYYMMDD_HHMMSS
 * Example: 20231027_153000
 */
export function getTimestampString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Generates a renamed filename: appends sender name first, then date and timestamp.
 * Format: originalBase[_SenderName][_YYYYMMDD_HHMMSS].[ext]
 * Examples:
 * - 'document.pdf' + 'John Doe' -> 'document_John_Doe_20260926_134500.pdf'
 * - 'document.pdf' without sender -> 'document_20260926_134500.pdf'
 */
export function generateRenamedFilename(
  originalName: string,
  senderName?: string,
  date: Date = new Date(),
  options: {
    includeTimestamp?: boolean;
    appendSender?: boolean;
  } = {}
): string {
  const { includeTimestamp = true, appendSender = true } = options;
  const cleanSender = appendSender && senderName ? sanitizeSenderName(senderName) : '';

  const { base, ext } = splitFilename(originalName);

  // Strip existing timestamp prefixes or suffixes
  let coreBase = base
    .replace(/^(\d{8}_\d{6})_/, '')
    .replace(/_(\d{8}_\d{6})$/, '');

  if (cleanSender) {
    const senderSuffix = `_${cleanSender}`;
    if (coreBase.endsWith(senderSuffix)) {
      coreBase = coreBase.slice(0, -senderSuffix.length);
    }
  }

  const parts = [coreBase];

  // 1. Append sender name first
  if (cleanSender) {
    parts.push(cleanSender);
  }

  // 2. Append date and timestamp second
  if (includeTimestamp) {
    parts.push(getTimestampString(date));
  }

  return `${parts.join('_')}${ext}`;
}

/**
 * Automatically renames a file with timestamp (YYYYMMDD_HHMMSS) and optional sender name.
 * Example: 'document.pdf' + 'John Doe' -> '20231027_153000_document_John_Doe.pdf'
 */
export function generateTimestampedFilename(
  originalName: string,
  senderNameOrDate?: string | Date,
  maybeDate?: Date
): string {
  let sender: string | undefined;
  let date: Date = new Date();

  if (typeof senderNameOrDate === 'string') {
    sender = senderNameOrDate;
    if (maybeDate instanceof Date) {
      date = maybeDate;
    }
  } else if (senderNameOrDate instanceof Date) {
    date = senderNameOrDate;
  }

  return generateRenamedFilename(originalName, sender, date, {
    includeTimestamp: true,
    appendSender: Boolean(sender && sender.trim()),
  });
}

