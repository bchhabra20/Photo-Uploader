import React, { useState } from 'react';
import { 
  FolderLock, 
  Plus, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  QrCode, 
  Eye, 
  Code2, 
  Settings2, 
  Trash2, 
  FileCheck2, 
  ExternalLink, 
  ShieldCheck, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  RefreshCw,
  FolderOpen,
  Mail,
  Send,
  CheckCheck
} from 'lucide-react';
import { DropBoxConfig, UploadHistoryItem } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { clearUploadHistory } from '../services/storageService';
import { sendTestEmailNotification } from '../services/uploadService';

interface AdminStudioProps {
  dropBoxes: DropBoxConfig[];
  activeId: string;
  onSelectDropBox: (id: string) => void;
  onCreateNew: () => void;
  onEdit: (box: DropBoxConfig) => void;
  onDelete: (id: string) => void;
  onOpenSetupGuide: (box: DropBoxConfig) => void;
  onOpenQrCode: (box: DropBoxConfig) => void;
  onPreviewPublic: (box: DropBoxConfig) => void;
  uploadHistory: UploadHistoryItem[];
  onRefreshHistory: () => void;
}

export const AdminStudio: React.FC<AdminStudioProps> = ({
  dropBoxes,
  activeId,
  onSelectDropBox,
  onCreateNew,
  onEdit,
  onDelete,
  onOpenSetupGuide,
  onOpenQrCode,
  onPreviewPublic,
  uploadHistory,
  onRefreshHistory,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'boxes' | 'history'>('boxes');
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const getShareableUrl = (box: DropBoxConfig) => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    return `${origin}${path}?drop=${box.id}`;
  };

  const handleCopyLink = (box: DropBoxConfig) => {
    const url = getShareableUrl(box);
    navigator.clipboard.writeText(url);
    setCopiedId(box.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Clear all uploaded files activity history?')) {
      clearUploadHistory();
      onRefreshHistory();
    }
  };

  const handleSendTestNotification = async (box: DropBoxConfig) => {
    setIsSendingTest(true);
    setTestNotificationStatus(null);
    try {
      const email = box.notificationEmail || 'BChhabra20@gmail.com';
      const res = await sendTestEmailNotification(box.scriptUrl, email);
      setTestNotificationStatus(res.message);
      setTimeout(() => setTestNotificationStatus(null), 5000);
    } catch {
      setTestNotificationStatus('Test notification triggered.');
      setTimeout(() => setTestNotificationStatus(null), 5000);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Top Header & Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 backdrop-blur-xl p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-100">Drop Box Manager</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              Google Apps Script Backend
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Create and share direct upload links for your Google Drive folders. No login required for uploaders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCreateNew}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Drop Box</span>
          </button>
        </div>
      </div>

      {/* Test Notification Toast */}
      {testNotificationStatus && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testNotificationStatus}</span>
          </div>
          <button
            onClick={() => setTestNotificationStatus(null)}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('boxes')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'boxes'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Drop Boxes ({dropBoxes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Recent Uploads ({uploadHistory.length})</span>
          </button>
        </div>

        {activeTab === 'history' && uploadHistory.length > 0 && (
          <button
            onClick={handleClearAllHistory}
            className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Content: Drop Boxes List */}
      {activeTab === 'boxes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {dropBoxes.map((box) => {
            const shareUrl = getShareableUrl(box);
            const isConnected = Boolean(box.scriptUrl && box.scriptUrl.trim().length > 0);

            return (
              <div
                key={box.id}
                className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-5 hover:border-neutral-700/80 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-neutral-100">{box.title}</h3>
                        {isConnected ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                            Apps Script Live
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                            Sandbox Demo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2">{box.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEdit(box)}
                        className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                        title="Edit Drop Box settings"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                      {dropBoxes.length > 1 && (
                        <button
                          onClick={() => onDelete(box.id)}
                          className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                          title="Delete Drop Box"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Target Folder Details */}
                  <div className="p-3.5 bg-neutral-950/60 rounded-2xl border border-neutral-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 flex items-center gap-1.5">
                        <FolderLock className="w-3.5 h-3.5 text-blue-400" />
                        Target Drive Folder:
                      </span>
                      <span className="text-neutral-200 font-medium truncate max-w-[170px]" title={box.folderName}>
                        {box.folderName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Folder ID:</span>
                      <span className="font-mono text-neutral-400 truncate max-w-[160px]">
                        {box.folderId || 'Not set (Demo mode)'}
                      </span>
                    </div>

                    {/* Automatic Timestamp & Sender Renaming Badge */}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-800/60">
                      <span className="text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        Auto-Rename:
                      </span>
                      <span className="text-blue-300 font-mono text-[10px]">
                        {box.autoRenameTimestamp !== false
                          ? (box.appendSenderName !== false ? 'Timestamp + Sender' : 'YYYYMMDD_HHMMSS')
                          : (box.appendSenderName !== false ? 'Sender Name Only' : 'Disabled')}
                      </span>
                    </div>

                    {/* Predefined Email Notification Info */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800/60">
                      <span className="text-neutral-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-emerald-400" />
                        Notify Email:
                      </span>
                      <span className="text-neutral-300 font-mono text-[10px] truncate max-w-[160px]" title={box.notificationEmail || 'BChhabra20@gmail.com'}>
                        {box.notificationEmail || 'BChhabra20@gmail.com'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                      <span>Max File Size: {box.maxFileSizeMb} MB</span>
                      <span>Subfolders: {box.subfolderRule}</span>
                    </div>
                  </div>

                  {/* Shareable Link Box */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Shareable Upload Link (No sign-in)</span>
                    </label>
                    <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="bg-transparent text-xs text-neutral-300 font-mono flex-1 outline-none px-2 truncate"
                      />
                      <button
                        onClick={() => handleCopyLink(box)}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                        title="Copy link to clipboard"
                      >
                        {copiedId === box.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenQrCode(box)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Show mobile QR code and copy ready-made website button code"
                    >
                      <QrCode className="w-3.5 h-3.5 text-neutral-400" />
                      <span>QR &amp; Website Button</span>
                    </button>

                    <button
                      onClick={() => onOpenSetupGuide(box)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-blue-400 text-xs font-medium rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Configure Google Apps Script"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{isConnected ? 'View Script' : 'Setup Apps Script'}</span>
                    </button>

                    <button
                      onClick={() => handleSendTestNotification(box)}
                      disabled={isSendingTest}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-xs font-medium rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title={`Send a test email notification to ${box.notificationEmail || 'BChhabra20@gmail.com'}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Test Email</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onPreviewPublic(box)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open Visitor View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Content: Upload Activity History */}
      {activeTab === 'history' && (
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6">
          {uploadHistory.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-200">No uploads recorded yet</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                When someone uses your link to drop files, the details, timestamped filenames, and email notification records will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 px-3">File Name (Timestamped)</th>
                    <th className="pb-3 px-3">Drop Box</th>
                    <th className="pb-3 px-3">Uploader</th>
                    <th className="pb-3 px-3">Email Notification</th>
                    <th className="pb-3 px-3">Size</th>
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3 text-right">Drive Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {uploadHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-950/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-neutral-200 max-w-[220px] truncate font-medium text-[11px]" title={item.fileName}>
                          {item.fileName}
                        </div>
                        {item.originalFileName && item.originalFileName !== item.fileName && (
                          <div className="text-[10px] text-neutral-400 truncate max-w-[200px]" title={item.originalFileName}>
                            Original: {item.originalFileName}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[11px] text-neutral-500 max-w-[200px] truncate" title={item.notes}>
                            Note: &quot;{item.notes}&quot;
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-400">{item.dropBoxTitle}</td>
                      <td className="py-3.5 px-3">
                        <div className="text-neutral-200">{item.uploaderName}</div>
                        {item.uploaderEmail && (
                          <div className="text-[11px] text-neutral-500">{item.uploaderEmail}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                          <span className="truncate max-w-[120px]" title={item.notificationEmail || 'BChhabra20@gmail.com'}>
                            {item.notificationEmail || 'BChhabra20@gmail.com'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-400">{formatBytes(item.fileSize)}</td>
                      <td className="py-3.5 px-3 text-neutral-500 whitespace-nowrap">{formatDate(item.timestamp)}</td>
                      <td className="py-3.5 px-3 text-right">
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-blue-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Drive</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-neutral-600">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* How it Works / FAQ Banner */}
      <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          How Anonymous Uploading with Google Apps Script Works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-neutral-400 leading-relaxed">
          <div className="space-y-1.5 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/60">
            <h4 className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 inline-flex items-center justify-center text-[10px]">1</span>
              Zero-Login Drop Experience
            </h4>
            <p>
              Visitors don&apos;t need a Google account or password. They open your custom link, select files, and submit.
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/60">
            <h4 className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 inline-flex items-center justify-center text-[10px]">2</span>
              Serverless Apps Script Webhook
            </h4>
            <p>
              Google Apps Script executes under your Google authorization, safely moving the incoming stream directly into your designated Drive folder.
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/60">
            <h4 className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 inline-flex items-center justify-center text-[10px]">3</span>
              Automatic Organization &amp; Alerts
            </h4>
            <p>
              Optionally auto-creates subfolders per date or uploader, stamps metadata notes on the Drive files, and notifies your email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
