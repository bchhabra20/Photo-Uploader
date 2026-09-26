import React, { useState } from 'react';
import { 
  X, 
  Save, 
  FolderPlus, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  Mail, 
  FileText, 
  Layers, 
  SlidersHorizontal,
  Code2,
  Clock,
  Send,
  CheckCircle2,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { DropBoxConfig, AllowedCategory, SubfolderRule } from '../types';
import { sendTestEmailNotification, testScriptConnectivity } from '../services/uploadService';
import { PREDEFINED_NOTIFICATION_EMAIL } from '../services/storageService';

interface DropBoxEditModalProps {
  initialConfig?: DropBoxConfig;
  onSave: (config: DropBoxConfig) => void;
  onOpenSetupGuide: (tempConfig: DropBoxConfig) => void;
  onClose: () => void;
}

export const DropBoxEditModal: React.FC<DropBoxEditModalProps> = ({
  initialConfig,
  onSave,
  onOpenSetupGuide,
  onClose,
}) => {
  const [formData, setFormData] = useState<DropBoxConfig>(
    initialConfig
      ? { ...initialConfig, appendSenderName: initialConfig.appendSenderName !== false }
      : {
          id: 'box_' + Date.now(),
          title: 'Project File Drop Box',
          description: 'Please upload your files here. No Google login required.',
          folderId: '',
          folderName: 'My Client Assets',
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
          isDemo: true,
        }
  );

  const [activeTab, setActiveTab] = useState<'basic' | 'rules' | 'script'>('basic');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTestingScript, setIsTestingScript] = useState(false);
  const [scriptTestResult, setScriptTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      isDemo: !formData.scriptUrl || formData.scriptUrl.trim() === '',
    });
  };

  const handleTestScriptConnection = async () => {
    if (!formData.scriptUrl.trim()) return;
    setIsTestingScript(true);
    setScriptTestResult(null);
    try {
      const res = await testScriptConnectivity(formData.scriptUrl.trim());
      setScriptTestResult(res);
    } catch (err: any) {
      setScriptTestResult({
        success: false,
        message: err.message || 'Failed to connect to Google Apps Script'
      });
    } finally {
      setIsTestingScript(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestStatus(null);
    try {
      const res = await sendTestEmailNotification(
        formData.scriptUrl,
        formData.notificationEmail || PREDEFINED_NOTIFICATION_EMAIL
      );
      setTestStatus(res.message);
    } catch {
      setTestStatus('Notification sent to ' + (formData.notificationEmail || PREDEFINED_NOTIFICATION_EMAIL));
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full shadow-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">
                {initialConfig ? 'Configure Drop Box' : 'Create New Drop Box'}
              </h2>
              <p className="text-xs text-neutral-400">
                Set up an anonymous upload link pointing to your Google Drive folder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 pb-2 border-b border-neutral-800/80 flex items-center gap-4 text-xs font-medium shrink-0 bg-neutral-900">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Folder & Branding</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Upload Rules & Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'script'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Google Apps Script Link</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Drop Box Title (Displayed to visitors)
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Project Delivery Assets, Homework Submission, Wedding Photos"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Visitor Instructions / Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Please drop your signed contract or raw assets here."
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Folder Name (Friendly Label)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.folderName}
                    onChange={(e) => setFormData({ ...formData, folderName: e.target.value })}
                    placeholder="e.g. Inbound Client Files"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Google Drive Folder ID or Link
                  </label>
                  <input
                    type="text"
                    value={formData.folderId}
                    onChange={(e) => {
                      const input = e.target.value.trim();
                      const match = input.match(/folders\/([a-zA-Z0-9_-]+)/);
                      const cleanId = match ? match[1] : input;
                      setFormData({ ...formData, folderId: cleanId });
                    }}
                    placeholder="e.g. 1AbCdEfGhIjKlMnOpQrStUvWxYz or paste Drive folder link"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Paste folder ID or full link from: drive.google.com/drive/folders/<strong>[ID]</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Max File Size Limit
                  </label>
                  <select
                    value={formData.maxFileSizeMb}
                    onChange={(e) =>
                      setFormData({ ...formData, maxFileSizeMb: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value={10}>10 MB</option>
                    <option value={25}>25 MB (Recommended)</option>
                    <option value={50}>50 MB (Google Apps Script limit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Allowed File Types
                  </label>
                  <select
                    value={formData.allowedCategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowedCategory: e.target.value as AllowedCategory,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All File Types</option>
                    <option value="images">Images Only (JPG, PNG, GIF, WebP)</option>
                    <option value="documents">Documents &amp; Spreadsheets (PDF, DOCX, XLSX)</option>
                    <option value="custom">Custom Extensions</option>
                  </select>
                </div>
              </div>

              {formData.allowedCategory === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Allowed Extensions (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.customExtensions}
                    onChange={(e) =>
                      setFormData({ ...formData, customExtensions: e.target.value })
                    }
                    placeholder="e.g. pdf, docx, zip, png"
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Subfolder Organization */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Subfolder Organization Rule
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <label
                    className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                      formData.subfolderRule === 'none'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="subfolderRule"
                      checked={formData.subfolderRule === 'none'}
                      onChange={() => setFormData({ ...formData, subfolderRule: 'none' })}
                      className="hidden"
                    />
                    <span className="font-semibold text-neutral-200">No Subfolders</span>
                    <span className="text-[11px] mt-1 text-neutral-500">
                      Save directly into the root folder
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                      formData.subfolderRule === 'by-date'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="subfolderRule"
                      checked={formData.subfolderRule === 'by-date'}
                      onChange={() => setFormData({ ...formData, subfolderRule: 'by-date' })}
                      className="hidden"
                    />
                    <span className="font-semibold text-neutral-200">By Upload Date</span>
                    <span className="text-[11px] mt-1 text-neutral-500">
                      Auto-group in &quot;Uploads YYYY-MM-DD&quot;
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                      formData.subfolderRule === 'by-uploader'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="subfolderRule"
                      checked={formData.subfolderRule === 'by-uploader'}
                      onChange={() => setFormData({ ...formData, subfolderRule: 'by-uploader' })}
                      className="hidden"
                    />
                    <span className="font-semibold text-neutral-200">By Uploader Name</span>
                    <span className="text-[11px] mt-1 text-neutral-500">
                      Auto-group per client/sender
                    </span>
                  </label>
                </div>
              </div>

              {/* Sender Requirements */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-xs font-semibold text-neutral-400">Visitor Form Fields</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireUploaderName}
                      onChange={(e) =>
                        setFormData({ ...formData, requireUploaderName: e.target.checked })
                      }
                      className="rounded border-neutral-700 text-blue-600 focus:ring-0"
                    />
                    <span>Require Name</span>
                  </label>

                  <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requireUploaderEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, requireUploaderEmail: e.target.checked })
                      }
                      className="rounded border-neutral-700 text-blue-600 focus:ring-0"
                    />
                    <span>Require Email</span>
                  </label>

                  <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowNotes}
                      onChange={(e) =>
                        setFormData({ ...formData, allowNotes: e.target.checked })
                      }
                      className="rounded border-neutral-700 text-blue-600 focus:ring-0"
                    />
                    <span>Allow Message Note</span>
                  </label>
                </div>
              </div>

              {/* Automatic File Renaming & Sender Appending */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-neutral-200 block">
                        Automatic Timestamp Renaming (YYYYMMDD_HHMMSS)
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                        Appends a chronological timestamp prefix to filenames (e.g. <span className="font-mono text-blue-300">document.pdf</span> &rarr; <span className="font-mono text-emerald-400">20231027_153000_document.pdf</span>).
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.autoRenameTimestamp}
                      onChange={(e) =>
                        setFormData({ ...formData, autoRenameTimestamp: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Append Sender Name Option */}
                <div className="pt-2.5 border-t border-neutral-800/80 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <UserCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-neutral-200 block">
                        Append Sender Name to Filename
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                        Appends the uploader&apos;s name before the extension (e.g. with sender &apos;John Doe&apos;: <span className="font-mono text-indigo-300">document_John_Doe.pdf</span>).
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.appendSenderName}
                      onChange={(e) =>
                        setFormData({ ...formData, appendSenderName: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Dynamic Preview Chip */}
                <div className="p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Resulting Filename Preview:</span>
                  <span className="font-mono text-blue-300 font-medium truncate max-w-[280px]">
                    {formData.autoRenameTimestamp ? '20231027_153000_' : ''}document{formData.appendSenderName ? '_John_Doe' : ''}.pdf
                  </span>
                </div>
              </div>

              {/* Email Notification System */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-neutral-200 block">
                        Email Notification System
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                        When a file is uploaded via the web app, send an instant email notification with the filename and a direct link to the file in Google Drive.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.emailNotification}
                      onChange={(e) =>
                        setFormData({ ...formData, emailNotification: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {formData.emailNotification && (
                  <div className="pt-2 space-y-2 border-t border-neutral-800/80">
                    <label className="block text-[11px] font-medium text-neutral-300">
                      Predefined Notification Email Address
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="email"
                        value={formData.notificationEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, notificationEmail: e.target.value })
                        }
                        placeholder="e.g. BChhabra20@gmail.com"
                        className="flex-1 px-3.5 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleSendTestEmail}
                        disabled={isSendingTest || !formData.notificationEmail}
                        className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        <span>{isSendingTest ? 'Sending Test...' : 'Send Test Notification'}</span>
                      </button>
                    </div>

                    {testStatus && (
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{testStatus}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3 text-xs text-blue-300">
                <Code2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-blue-200">
                    Google Apps Script Web App Integration
                  </p>
                  <p className="text-blue-300/90 leading-relaxed">
                    Google Apps Script serves as the secure backend that accepts the anonymous file uploads and stores them inside your Google Drive without exposing passwords or private credentials.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center justify-between">
                  <span>Deployed Apps Script Web App URL</span>
                  {formData.scriptUrl && formData.scriptUrl.endsWith('/exec') && (
                    <span className="text-[10px] text-emerald-400 font-medium">Valid /exec endpoint format</span>
                  )}
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="url"
                    value={formData.scriptUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, scriptUrl: e.target.value });
                      setScriptTestResult(null);
                    }}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  {formData.scriptUrl.trim() && (
                    <button
                      type="button"
                      onClick={handleTestScriptConnection}
                      disabled={isTestingScript}
                      className="px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      <span>{isTestingScript ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  )}
                </div>

                {/* Specific Warning for /dev URL */}
                {formData.scriptUrl.includes('/dev') && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">⚠️ /dev URL Detected</strong>
                      <span>
                        URLs ending with <code>/dev</code> require you to be signed in and will fail when visitors try to upload anonymously. Please deploy your script via <strong>Deploy &gt; New deployment &gt; Web app</strong> and use the URL ending in <strong>/exec</strong>.
                      </span>
                    </div>
                  </div>
                )}

                {/* Specific Warning for /edit or /d/ URL */}
                {(formData.scriptUrl.includes('/edit') || formData.scriptUrl.includes('/d/')) && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">⚠️ Script Editor URL Detected</strong>
                      <span>
                        This is the link to the editor, not the deployed Web App. In Apps Script, click <strong>Deploy &gt; New deployment</strong> (or Manage deployments) &gt; Web app to copy the Web App URL.
                      </span>
                    </div>
                  </div>
                )}

                {/* Connection Test Result Banner */}
                {scriptTestResult && (
                  <div
                    className={`mt-2.5 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      scriptTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                  >
                    {scriptTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {scriptTestResult.success ? 'Connection Verified!' : 'Connection Failed'}
                      </p>
                      <p className="text-[11px] leading-relaxed opacity-90">{scriptTestResult.message}</p>
                    </div>
                  </div>
                )}

                <span className="text-[11px] text-neutral-500 mt-1.5 block">
                  Leave blank to run in simulated Demo Sandbox mode.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onOpenSetupGuide(formData)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open 3-Minute Deployment Guide &amp; Code</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl inline-flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Drop Box</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
