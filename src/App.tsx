/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  Settings, 
  UploadCloud, 
  Share2, 
  QrCode, 
  ExternalLink, 
  Check, 
  Sparkles, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { DropBoxConfig, UploadHistoryItem } from './types';
import { 
  getStoredDropBoxes, 
  saveDropBoxes, 
  getActiveDropBoxId, 
  setActiveDropBoxId, 
  getUploadHistory 
} from './services/storageService';
import { UploaderView } from './components/UploaderView';
import { AdminStudio } from './components/AdminStudio';
import { DropBoxEditModal } from './components/DropBoxEditModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { QrCodeModal } from './components/QrCodeModal';

export default function App() {
  const [dropBoxes, setDropBoxes] = useState<DropBoxConfig[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [mode, setMode] = useState<'uploader' | 'admin'>('uploader');
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);

  // Modals state
  const [editingBox, setEditingBox] = useState<DropBoxConfig | null>(null);
  const [setupGuideBox, setSetupGuideBox] = useState<DropBoxConfig | null>(null);
  const [qrCodeBox, setQrCodeBox] = useState<DropBoxConfig | null>(null);
  const [copyToast, setCopyToast] = useState(false);

  // Initialize from storage & URL parameters
  useEffect(() => {
    const boxes = getStoredDropBoxes();
    setDropBoxes(boxes);

    const history = getUploadHistory();
    setUploadHistory(history);

    // Check URL parameters for direct link ?drop=<id>
    const urlParams = new URLSearchParams(window.location.search);
    const dropParam = urlParams.get('drop');

    if (dropParam) {
      const match = boxes.find((b) => b.id === dropParam);
      if (match) {
        setActiveId(match.id);
        setActiveDropBoxId(match.id);
        setMode('uploader');
        return;
      }
    }

    const savedActiveId = getActiveDropBoxId();
    const existing = boxes.find((b) => b.id === savedActiveId);
    if (existing) {
      setActiveId(existing.id);
    } else if (boxes.length > 0) {
      setActiveId(boxes[0].id);
    }
  }, []);

  const activeBox = dropBoxes.find((b) => b.id === activeId) || dropBoxes[0];

  const handleSelectBox = (id: string) => {
    setActiveId(id);
    setActiveDropBoxId(id);
  };

  const handleSaveBox = (newOrUpdated: DropBoxConfig) => {
    setDropBoxes((prev) => {
      const index = prev.findIndex((b) => b.id === newOrUpdated.id);
      let updatedList: DropBoxConfig[];
      if (index >= 0) {
        updatedList = [...prev];
        updatedList[index] = newOrUpdated;
      } else {
        updatedList = [...prev, newOrUpdated];
      }
      saveDropBoxes(updatedList);
      return updatedList;
    });

    setActiveId(newOrUpdated.id);
    setActiveDropBoxId(newOrUpdated.id);
    setEditingBox(null);
  };

  const handleDeleteBox = (id: string) => {
    if (dropBoxes.length <= 1) return;
    if (window.confirm('Are you sure you want to delete this Drop Box configuration?')) {
      const updatedList = dropBoxes.filter((b) => b.id !== id);
      setDropBoxes(updatedList);
      saveDropBoxes(updatedList);
      if (activeId === id) {
        setActiveId(updatedList[0].id);
        setActiveDropBoxId(updatedList[0].id);
      }
    }
  };

  const handleCopyActiveLink = () => {
    if (!activeBox) return;
    const origin = window.location.origin;
    const path = window.location.pathname;
    const shareUrl = `${origin}${path}?drop=${activeBox.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const handleUpdateScriptUrl = (url: string) => {
    if (!setupGuideBox) return;
    const updated: DropBoxConfig = {
      ...setupGuideBox,
      scriptUrl: url,
      isDemo: !url || url.trim() === '',
    };
    handleSaveBox(updated);
    setSetupGuideBox(updated);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-blue-500 selection:text-white antialiased">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <FolderLock className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-neutral-100 flex items-center gap-1.5">
                Wedding Photo Upload
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-400 font-mono">
                  No Login
                </span>
              </span>
            </div>
          </div>

          {/* Center Mode Switcher */}
          <div className="hidden sm:flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-2xl">
            <button
              onClick={() => setMode('uploader')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'uploader'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Public Drop Link (Visitor)</span>
            </button>
            <button
              onClick={() => setMode('admin')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Drop Box Studio &amp; Script</span>
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Box Selector if multiple */}
            {dropBoxes.length > 1 && (
              <div className="relative hidden md:block">
                <select
                  value={activeId}
                  onChange={(e) => handleSelectBox(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-1.5 pr-7 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {dropBoxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            )}

            {activeBox && (
              <>
                <button
                  onClick={handleCopyActiveLink}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy shareable link"
                >
                  {copyToast ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied Link</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="hidden sm:inline">Share Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setQrCodeBox(activeBox)}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl transition-colors"
                  title="Mobile QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Submenu for mode switching */}
        <div className="sm:hidden px-4 pb-3 flex items-center justify-center gap-2">
          <button
            onClick={() => setMode('uploader')}
            className={`flex-1 py-1.5 text-center rounded-xl text-xs font-medium transition-all ${
              mode === 'uploader'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
            }`}
          >
            Public Drop Portal
          </button>
          <button
            onClick={() => setMode('admin')}
            className={`flex-1 py-1.5 text-center rounded-xl text-xs font-medium transition-all ${
              mode === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
            }`}
          >
            Studio &amp; Script
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {mode === 'uploader' && activeBox ? (
          <UploaderView
            config={activeBox}
            onOpenSetup={() => setSetupGuideBox(activeBox)}
            onSwitchToManager={() => setMode('admin')}
          />
        ) : (
          <AdminStudio
            dropBoxes={dropBoxes}
            activeId={activeId}
            onSelectDropBox={handleSelectBox}
            onCreateNew={() => setEditingBox(null)}
            onEdit={(box) => setEditingBox(box)}
            onDelete={handleDeleteBox}
            onOpenSetupGuide={(box) => setSetupGuideBox(box)}
            onOpenQrCode={(box) => setQrCodeBox(box)}
            onPreviewPublic={(box) => {
              setActiveId(box.id);
              setActiveDropBoxId(box.id);
              setMode('uploader');
            }}
            uploadHistory={uploadHistory}
            onRefreshHistory={() => setUploadHistory(getUploadHistory())}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
        <p>
          Wedding Photo Upload — Anonymous Google Drive photo drop powered by Google Apps Script. No sign-in required for wedding guests.
        </p>
      </footer>

      {/* Edit / Create Drop Box Modal */}
      {editingBox !== null && (
        <DropBoxEditModal
          initialConfig={editingBox?.id ? editingBox : undefined}
          onSave={handleSaveBox}
          onOpenSetupGuide={(tempConfig) => {
            setSetupGuideBox(tempConfig);
          }}
          onClose={() => setEditingBox(null)}
        />
      )}

      {/* Setup Guide Modal */}
      {setupGuideBox && (
        <SetupGuideModal
          config={setupGuideBox}
          onUpdateScriptUrl={handleUpdateScriptUrl}
          onClose={() => setSetupGuideBox(null)}
        />
      )}

      {/* QR Code Modal */}
      {qrCodeBox && (
        <QrCodeModal
          url={`${window.location.origin}${window.location.pathname}?drop=${qrCodeBox.id}`}
          scriptUrl={qrCodeBox.scriptUrl}
          title={qrCodeBox.title}
          folderName={qrCodeBox.folderName}
          onClose={() => setQrCodeBox(null)}
        />
      )}
    </div>
  );
}
