import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Code2, 
  ArrowRight,
  ShieldAlert,
  SendHorizontal
} from 'lucide-react';
import { DropBoxConfig } from '../types';
import { generateGoogleAppsScript } from '../services/gasScriptGenerator';
import { testScriptConnectivity } from '../services/uploadService';

interface SetupGuideModalProps {
  config: DropBoxConfig;
  onUpdateScriptUrl: (url: string) => void;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  config,
  onUpdateScriptUrl,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'code'>('steps');
  const [testUrl, setTestUrl] = useState(config.scriptUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const generatedScript = generateGoogleAppsScript(config);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([generatedScript], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DriveDrop_Code_${config.folderName.replace(/\s+/g, '_')}.gs`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTestConnection = async () => {
    if (!testUrl.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    const result = await testScriptConnectivity(testUrl.trim());
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      onUpdateScriptUrl(testUrl.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-3xl w-full shadow-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100">Google Apps Script Setup</h2>
              <p className="text-xs text-neutral-400">
                Deploy in 3 minutes to accept anonymous uploads into &quot;{config.folderName}&quot;
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

        {/* Tab Toggle */}
        <div className="px-6 pt-4 pb-2 border-b border-neutral-800/80 flex items-center gap-4 text-xs font-medium shrink-0 bg-neutral-900">
          <button
            onClick={() => setActiveTab('steps')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'steps'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>Interactive Setup Steps</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>View & Copy Script Code</span>
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-neutral-300 text-sm">
          {/* Automatic Features Callout */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
            <span className="text-xs font-semibold text-blue-300 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Automated Features Pre-Configured in this Script
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-blue-200/90">
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-blue-500/20">
                <strong className="text-blue-100 block">Automatic File Renaming</strong>
                <span>Appends sender name first, then date &amp; timestamp (e.g. <code className="text-emerald-300">photo_Dave_20260926_143000.jpg</code>).</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-blue-500/20">
                <strong className="text-blue-100 block">Instant Email Notification</strong>
                <span>Sends an instant email to <strong className="text-emerald-300 font-mono">{config.notificationEmail || 'BChhabra20@gmail.com'}</strong> with the Drive link.</span>
              </div>
            </div>
          </div>

          {/* Target Folder Verification */}
          <div className="p-3.5 bg-neutral-950/70 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-neutral-400">Target Folder: <strong className="text-neutral-100">{config.folderName || 'Google Drive Folder'}</strong></span>
              <p className="text-[11px] text-neutral-500 font-mono">
                Folder ID: {config.folderId && config.folderId !== '1AbCdEfGhIjKlMnOpQrStUvWxYz12345' ? config.folderId : 'Using placeholder ID (Set your real Folder ID in settings)'}
              </p>
            </div>
            {(!config.folderId || config.folderId === '1AbCdEfGhIjKlMnOpQrStUvWxYz12345') && (
              <span className="text-[11px] px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg">
                ⚠️ Need your real Drive Folder ID
              </span>
            )}
          </div>

          {activeTab === 'steps' && (
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-neutral-100">Create a new Google Apps Script</h4>
                    <a
                      href="https://script.google.com/home/start"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 font-normal"
                    >
                      <span>Open script.google.com</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Click <strong>&quot;+ New project&quot;</strong> in Google Apps Script (or in Google Drive: click <strong>New &gt; More &gt; Google Apps Script</strong>).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-3 flex-1">
                  <h4 className="font-semibold text-neutral-100">Paste the auto-generated code into Code.gs</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Clear whatever code is currently in the editor, and paste this ready-to-run script configured for your folder.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Script Code</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadFile}
                      className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-xl inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .gs File</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-semibold text-neutral-100">Deploy as a Web App</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Click the blue <strong>&quot;Deploy&quot;</strong> button in the top right &gt; <strong>&quot;New deployment&quot;</strong>. Click the gear icon on the left and choose <strong>&quot;Web app&quot;</strong>.
                  </p>
                  
                  {/* Highlighted Callout */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-amber-200">
                    <p className="font-semibold flex items-center gap-1.5 text-amber-300">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Crucial Settings for Anonymous Uploads:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-amber-200/90">
                      <li>
                        <strong>Execute as:</strong> Select <strong>&quot;Me (your-email@gmail.com)&quot;</strong>
                      </li>
                      <li>
                        <strong>Who has access:</strong> Select <strong>&quot;Anyone&quot;</strong> (This permits file upload without forcing the visitor to log into Google!)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <div className="space-y-3 flex-1">
                  <h4 className="font-semibold text-neutral-100">Paste your Web App URL below</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    After authorizing, Google will give you a Web App URL ending with <code>/exec</code>. Paste it here to link your Drop Box:
                  </p>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={testUrl}
                        onChange={(e) => {
                          setTestUrl(e.target.value);
                          setTestResult(null);
                        }}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className="flex-1 px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleTestConnection}
                        disabled={isTesting || !testUrl.trim()}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                      >
                        {isTesting ? (
                          <span>Testing...</span>
                        ) : (
                          <>
                            <SendHorizontal className="w-3.5 h-3.5" />
                            <span>Test & Save URL</span>
                          </>
                        )}
                      </button>
                    </div>

                    {testResult && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          testResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 leading-relaxed">{testResult.message}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-medium">
                  File: <code className="text-neutral-200">Code.gs</code>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 font-mono text-xs">
                <pre className="p-4 overflow-x-auto text-neutral-300 max-h-[420px] leading-relaxed select-all">
                  {generatedScript}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70 flex items-center justify-between shrink-0">
          <p className="text-xs text-neutral-500">
            Need help finding your Folder ID? Look at the URL: drive.google.com/drive/folders/<strong>FOLDER_ID</strong>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
