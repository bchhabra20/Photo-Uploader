import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  FileCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  FolderLock, 
  ArrowRight, 
  RefreshCw, 
  ExternalLink,
  Lock,
  Sparkles,
  Info,
  HelpCircle,
  Clock,
  Mail,
  CheckCheck
} from 'lucide-react';
import { DropBoxConfig, FileItem, UploadHistoryItem } from '../types';
import { formatBytes, getFileTypeCategory, generateRenamedFilename, generateTimestampedFilename, sanitizeSenderName } from '../utils/formatters';
import { uploadFileToDrive } from '../services/uploadService';
import { addUploadHistoryItem } from '../services/storageService';

interface UploaderViewProps {
  config: DropBoxConfig;
  onOpenSetup?: () => void;
  onSwitchToManager?: () => void;
}

export const UploaderView: React.FC<UploaderViewProps> = ({
  config,
  onOpenSetup,
  onSwitchToManager,
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamically compute the preview filename reflecting timestamp and current sender name
  const computePreviewName = (originalName: string, completedName?: string) => {
    if (completedName) return completedName;
    return generateRenamedFilename(
      originalName,
      uploaderName,
      new Date(),
      {
        includeTimestamp: config.autoRenameTimestamp !== false,
        appendSender: config.appendSenderName !== false,
      }
    );
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, [files]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: FileItem[] = [];
    const maxBytes = config.maxFileSizeMb * 1024 * 1024;
    const errors: string[] = [];

    Array.from(incomingFiles).forEach((file) => {
      // Check size
      if (file.size > maxBytes) {
        errors.push(`"${file.name}" exceeds the ${config.maxFileSizeMb} MB limit.`);
        return;
      }

      // Check allowed category
      if (config.allowedCategory === 'images' && !file.type.startsWith('image/')) {
        errors.push(`"${file.name}" is not an image file.`);
        return;
      }
      if (config.allowedCategory === 'documents') {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'];
        if (!docExts.includes(ext) && !file.type.includes('pdf') && !file.type.includes('document')) {
          errors.push(`"${file.name}" is not a supported document.`);
          return;
        }
      }
      if (config.allowedCategory === 'custom' && config.customExtensions) {
        const allowedExtList = config.customExtensions
          .toLowerCase()
          .split(',')
          .map((s) => s.trim().replace(/^\./, ''));
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!allowedExtList.includes(ext)) {
          errors.push(`"${file.name}" does not match allowed types (${config.customExtensions}).`);
          return;
        }
      }

      let previewUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        try {
          previewUrl = URL.createObjectURL(file);
        } catch {}
      }

      const renamedName = computePreviewName(file.name);

      newItems.push({
        id: 'file_' + Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        renamedName,
        size: file.size,
        type: file.type || 'application/octet-stream',
        previewUrl,
        status: 'pending',
        progress: 0,
      });
    });

    if (errors.length > 0) {
      setErrorMessage(errors.join(' '));
    }

    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);
      setUploadCompleted(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = ''; // reset so same file can be re-selected if removed
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleClearAll = () => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setErrorMessage(null);
  };

  const handleUploadAll = async () => {
    // Validate required fields
    if (config.requireUploaderName && !uploaderName.trim()) {
      setErrorMessage('Please provide your name or identity before uploading.');
      return;
    }
    if (config.requireUploaderEmail && !uploaderEmail.trim()) {
      setErrorMessage('Please provide your email address so the owner can reach you.');
      return;
    }

    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);

    let hasErrors = false;

    for (const item of pendingFiles) {
      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 5 } : f))
      );

      try {
        const result = await uploadFileToDrive(
          item,
          config,
          uploaderName,
          uploaderEmail,
          notes,
          (progress) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === item.id ? { ...f, progress } : f))
            );
          }
        );

        const finalRenamedName = result.fileName || computePreviewName(item.name) || item.name;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'success',
                  progress: 100,
                  renamedName: finalRenamedName,
                  resultUrl: result.fileUrl,
                  resultId: result.fileId,
                }
              : f
          )
        );

        // Record history locally for tracking
        const historyItem: UploadHistoryItem = {
          id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          dropBoxId: config.id,
          dropBoxTitle: config.title,
          fileName: finalRenamedName,
          originalFileName: item.name,
          fileSize: item.size,
          uploaderName: uploaderName.trim() || 'Anonymous',
          uploaderEmail: uploaderEmail.trim(),
          notes: notes.trim(),
          timestamp: new Date().toISOString(),
          fileUrl: result.fileUrl,
          fileId: result.fileId,
          status: 'success',
          notificationSent: result.notificationSent,
          notificationEmail: result.notificationEmail || config.notificationEmail,
        };
        addUploadHistoryItem(historyItem);
      } catch (err: any) {
        hasErrors = true;
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'error',
                  progress: 0,
                  errorMsg: err.message || 'Upload failed',
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    if (!hasErrors) {
      setUploadCompleted(true);
    }
  };

  const totalBytes = files.reduce((acc, curr) => acc + curr.size, 0);
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const pendingCount = files.filter((f) => f.status === 'pending').length;

  const renderFileIcon = (fileName: string, mimeType: string) => {
    const cat = getFileTypeCategory(fileName, mimeType);
    switch (cat) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Film className="w-5 h-5 text-purple-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-amber-500" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-emerald-500" />;
    }
  };

  const isLive = !config.isDemo && Boolean(config.scriptUrl && config.scriptUrl.trim().startsWith('https://script.google.com/'));

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Top Banner if in Demo Mode */}
      {!isLive && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-200">
                Interactive Preview Sandbox Mode (Simulated Uploads)
              </p>
              <p className="text-xs text-amber-300/80">
                Files are currently tested in local simulation. To send uploads directly to your actual Google Drive &ldquo;{config.folderName || 'Engagement Party'}&rdquo; folder, connect your Google Apps Script Web App.
              </p>
            </div>
          </div>
          {onOpenSetup && (
            <button
              onClick={onOpenSetup}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
            >
              Connect Live Drive
            </button>
          )}
        </div>
      )}

      {/* Main Upload Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8">
        {/* Header Information */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-800/80 pb-6 mb-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Secure Anonymous File Drop</span>
              </div>
              {(config.autoRenameTimestamp !== false || config.appendSenderName !== false) && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium" title="Files automatically renamed with timestamp and sender name">
                  <Clock className="w-3 h-3" />
                  <span>
                    Auto-Renaming ({config.autoRenameTimestamp !== false ? 'Timestamp' : ''}{config.autoRenameTimestamp !== false && config.appendSenderName !== false ? ' + ' : ''}{config.appendSenderName !== false ? 'Sender Name' : ''})
                  </span>
                </div>
              )}
              {config.emailNotification && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium" title={`Email sent to ${config.notificationEmail || 'BChhabra20@gmail.com'} on file upload`}>
                  <Mail className="w-3 h-3" />
                  <span>Predefined Email Alerts</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight">
              {config.title || 'Google Drive File Drop'}
            </h1>
            <p className="text-neutral-400 text-sm max-w-xl leading-relaxed">
              {config.description ||
                'Anyone with this link can securely drop files directly into Google Drive without signing in.'}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-xs text-neutral-400 bg-neutral-950/40 p-3 rounded-2xl border border-neutral-800">
            <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <FolderLock className="w-4 h-4 text-blue-400" />
              <span className="truncate max-w-[140px]" title={config.folderName}>
                {config.folderName || 'Google Drive'}
              </span>
            </div>
            <span className="text-[11px] text-neutral-500">
              Limit: {config.maxFileSizeMb} MB / file
            </span>
          </div>
        </div>

        {/* Success Confirmation State */}
        {uploadCompleted && (
          <div className={`mb-8 p-6 rounded-2xl text-center space-y-4 border ${
            isLive
              ? 'bg-gradient-to-b from-emerald-950/40 to-neutral-900 border-emerald-500/30'
              : 'bg-gradient-to-b from-amber-950/40 to-neutral-900 border-amber-500/30'
          }`}>
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
              isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isLive ? <CheckCircle2 className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-neutral-100">
                {isLive
                  ? `Files Delivered to Google Drive "${config.folderName}"!`
                  : 'Simulated Sandbox Upload Complete'}
              </h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                {isLive ? (
                  <span>
                    Thank you, {uploaderName.trim() || 'friend'}! Your {successCount}{' '}
                    {successCount === 1 ? 'file was' : 'files were'} safely uploaded into &ldquo;{config.folderName}&rdquo; without needing a Google account.
                  </span>
                ) : (
                  <span>
                    Photos were processed in <strong>Sandbox Mode</strong>. Because a live Google Apps Script Web App URL is not linked yet, files were <strong>not</strong> written to your actual Google Drive &ldquo;{config.folderName}&rdquo; folder.
                  </span>
                )}
              </p>
            </div>

            {/* If in demo mode, show immediate callout to connect */}
            {!isLive && onOpenSetup && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-lg mx-auto">
                <div>
                  <p className="font-semibold text-amber-200">Want uploads saved to your real Google Drive?</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Connect your Google Apps Script in under 3 minutes to start collecting real files.
                  </p>
                </div>
                <button
                  onClick={onOpenSetup}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  Connect Drive
                </button>
              </div>
            )}

            {/* Email Notification Sent Confirmation */}
            {config.emailNotification && isLive && (
              <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-left text-xs text-emerald-300 flex items-start gap-3 max-w-lg mx-auto">
                <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-emerald-200">
                    Email Notification Sent Automatically
                  </p>
                  <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                    An email with the filename and a direct link to the file in Google Drive has been delivered to predefined address: <strong className="font-mono text-emerald-100">{config.notificationEmail || 'BChhabra20@gmail.com'}</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  handleClearAll();
                  setUploadCompleted(false);
                }}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Upload More Files
              </button>
            </div>
          </div>
        )}

        {/* Uploader Meta Fields (Identity / Notes) */}
        {!uploadCompleted && (
          <div className="mb-6 space-y-4 bg-neutral-950/50 p-5 rounded-2xl border border-neutral-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-neutral-500" />
                Sender Information
              </h3>
              <span className="text-[11px] text-neutral-500">No Google login required</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Your Name {config.requireUploaderName ? <span className="text-red-400">*</span> : <span className="text-neutral-500">(optional)</span>}
                </label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="e.g. Alex Morgan or Design Agency"
                  disabled={isUploading}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                {config.appendSenderName !== false && (
                  <span className="text-[11px] text-blue-400/90 flex items-center gap-1 mt-1">
                    <Sparkles className="w-3 h-3 text-blue-400 shrink-0" />
                    Appends your name to filenames (e.g. <span className="font-mono text-blue-300">document_{sanitizeSenderName(uploaderName) || 'YourName'}.pdf</span>)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Your Email {config.requireUploaderEmail ? <span className="text-red-400">*</span> : <span className="text-neutral-500">(optional)</span>}
                </label>
                <input
                  type="email"
                  value={uploaderEmail}
                  onChange={(e) => setUploaderEmail(e.target.value)}
                  placeholder="alex@company.com"
                  disabled={isUploading}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {config.allowNotes && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Message or Note to recipient <span className="text-neutral-500">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Here are the final revised presentation slides and signed contracts."
                  disabled={isUploading}
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Drag and Drop Zone */}
        {!uploadCompleted && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                : 'border-neutral-700 hover:border-blue-500/60 bg-neutral-950/40 hover:bg-neutral-950/70'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-200 ${
                  isDragging
                    ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/25'
                    : 'bg-neutral-800 text-neutral-300 group-hover:bg-neutral-700 group-hover:text-blue-400'
                }`}
              >
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <p className="text-base font-medium text-neutral-200">
                  <span className="text-blue-400 font-semibold group-hover:underline">Click to browse</span> or drag and drop files here
                </p>
                <p className="text-xs text-neutral-500">
                  Multiple files supported • Up to {config.maxFileSizeMb} MB each
                  {config.allowedCategory !== 'all' && (
                    <span className="block mt-0.5 text-neutral-400">
                      Category filter: {config.allowedCategory.toUpperCase()} {config.customExtensions ? `(${config.customExtensions})` : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* File Queue List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
              <span className="font-semibold text-neutral-300">
                Selected Files ({files.length}) • Total {formatBytes(totalBytes)}
              </span>
              {!isUploading && !uploadCompleted && (
                <button
                  onClick={handleClearAll}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl"
                >
                  {/* File preview / icon */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border border-neutral-800 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                        {renderFileIcon(item.name, item.type)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-200 truncate" title={item.name}>
                        {item.name}
                      </p>

                      {(config.autoRenameTimestamp !== false || (config.appendSenderName !== false && uploaderName.trim())) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${
                              item.status === 'success'
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                : 'bg-neutral-800/80 border border-neutral-700/80 text-blue-300'
                            }`}
                            title={
                              item.status === 'success'
                                ? 'Saved to Google Drive with timestamp and sender name'
                                : 'File will be automatically renamed with timestamp and sender name on upload'
                            }
                          >
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate max-w-[240px] sm:max-w-md">
                              {item.status === 'success' ? 'Saved as: ' : 'Will rename: '}
                              {item.status === 'success'
                                ? (item.renamedName || computePreviewName(item.name))
                                : computePreviewName(item.name)}
                            </span>
                          </span>
                          {config.appendSenderName !== false && uploaderName.trim() && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 inline-flex items-center gap-1">
                              + Sender: {sanitizeSenderName(uploaderName)}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                        <span>{formatBytes(item.size)}</span>
                        {item.status === 'uploading' && (
                          <span className="text-blue-400 font-medium">
                            Uploading {item.progress}%
                          </span>
                        )}
                        {item.status === 'success' && (
                          <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-red-400 font-medium truncate" title={item.errorMsg}>
                            {item.errorMsg || 'Failed'}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {item.status === 'uploading' && (
                        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'success' && item.resultUrl && (
                      <a
                        href={item.resultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors"
                        title="View in Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {!isUploading && item.status !== 'success' && (
                      <button
                        onClick={() => handleRemoveFile(item.id)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Button */}
            {!uploadCompleted && (
              <div className="pt-3">
                <button
                  onClick={handleUploadAll}
                  disabled={isUploading || pendingCount === 0}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending to Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>
                        Upload {files.length} {files.length === 1 ? 'File' : 'Files'} to Google Drive
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trust Badges Footer */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              Direct HTTPS Stream
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Automated Apps Script
            </span>
          </div>

          {onSwitchToManager && (
            <button
              onClick={onSwitchToManager}
              className="text-neutral-400 hover:text-neutral-200 transition-colors inline-flex items-center gap-1 text-xs"
            >
              <span>Folder Owner? Manage Drop Box</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
