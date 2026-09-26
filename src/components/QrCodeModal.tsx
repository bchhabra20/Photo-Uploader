import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  QrCode, 
  Smartphone, 
  ExternalLink, 
  Code, 
  Globe, 
  Layout, 
  Sparkles,
  Info
} from 'lucide-react';

interface QrCodeModalProps {
  url: string;
  title: string;
  folderName: string;
  scriptUrl?: string;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  url,
  title,
  folderName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'button' | 'embed'>('qr');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedButtonCode, setCopiedButtonCode] = useState(false);
  const [copiedEmbedCode, setCopiedEmbedCode] = useState(false);
  const [buttonText, setButtonText] = useState(`📸 Upload Photos to ${folderName || 'Engagement Party'}`);
  const [buttonColor, setButtonColor] = useState('#2563eb');

  // Encode URL for QR code generation
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=14&data=${encodeURIComponent(url)}`;

  const buttonHtmlCode = `<!-- DriveDrop Upload Button -->
<a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: ${buttonColor}; color: #ffffff; padding: 14px 26px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(37,99,235,0.3); transition: all 0.2s ease;">
  ${buttonText}
</a>`;

  const embedHtmlCode = `<!-- DriveDrop Responsive Embed -->
<div style="width: 100%; max-width: 760px; margin: 0 auto; min-height: 650px;">
  <iframe
    src="${url}"
    width="100%"
    height="720"
    style="border: 1px solid #333333; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);"
    allow="camera; microphone"
    title="${title || 'DriveDrop Uploader'}"
  ></iframe>
</div>`;

  const handleCopy = (text: string, type: 'link' | 'button' | 'embed') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (type === 'button') {
      setCopiedButtonCode(true);
      setTimeout(() => setCopiedButtonCode(false), 2000);
    } else if (type === 'embed') {
      setCopiedEmbedCode(true);
      setTimeout(() => setCopiedEmbedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between gap-4 bg-neutral-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-100">
                Share & Website Integration
              </h3>
              <p className="text-xs text-neutral-400">
                Target Folder: <span className="text-neutral-200 font-medium">{folderName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-2 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-4 bg-neutral-950/20 border-b border-neutral-800 flex gap-2">
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'qr'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('button')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'button'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Website Button Code</span>
          </button>

          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'embed'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Embed on Webpage</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-neutral-300">
          {/* TAB 1: PHONE TESTING & QR CODE */}
          {activeTab === 'qr' && (
            <div className="space-y-6">
              {/* Highlight explaining how it works */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 space-y-1.5">
                <div className="font-semibold text-blue-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  How to test right now:
                </div>
                <p className="leading-relaxed opacity-90">
                  Click <strong>&ldquo;Visitor View&rdquo;</strong> in the top navigation bar or <strong>&ldquo;Test on this computer&rdquo;</strong> below. You can drop photos directly to test the upload into your Google Drive folder!
                </p>
              </div>

              {/* QR Code Graphic */}
              <div className="bg-white p-5 rounded-3xl mx-auto w-fit shadow-xl flex items-center justify-center">
                <img
                  src={qrImageUrl}
                  alt="Scan QR code to drop files"
                  className="w-56 h-56 object-contain"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-medium text-neutral-200">
                  Point phone camera at this QR code
                </p>
                <p className="text-[11px] text-neutral-400">
                  Opens the DriveDrop upload page
                </p>
              </div>

              {/* Shareable Link Box */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-400">Direct Link:</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>Test on this computer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                  <input
                    type="text"
                    readOnly
                    value={url}
                    className="bg-transparent text-xs text-neutral-300 font-mono flex-1 outline-none px-2 truncate"
                  />
                  <button
                    onClick={() => handleCopy(url, 'link')}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEBSITE BUTTON CODE */}
          {activeTab === 'button' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs space-y-2">
                <span className="text-neutral-200 font-semibold block flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-400" />
                  Which URL goes on your website button?
                </span>
                <p className="text-neutral-400 leading-relaxed text-[11px]">
                  Place this <strong>DriveDrop upload page link</strong> in your button&apos;s link destination (href). <strong className="text-amber-300">Do NOT</strong> put the Google Apps Script Web App URL (<code className="text-neutral-300">script.google.com/.../exec</code>) in your website button &mdash; that is an internal backend API.
                </p>
              </div>

              {/* Button Customizer */}
              <div className="space-y-3 p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl">
                <span className="text-xs font-semibold text-neutral-200 block">
                  Customize Button Appearance
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-100 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Button Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-mono text-neutral-100 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Button Preview */}
                <div className="pt-3 border-t border-neutral-800 flex flex-col items-center justify-center gap-2 py-3 bg-neutral-900/50 rounded-xl">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                    Live Preview
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: buttonColor }}
                    className="inline-block text-white px-6 py-3 font-semibold text-sm rounded-xl shadow-lg hover:opacity-90 transition-opacity"
                  >
                    {buttonText}
                  </a>
                </div>
              </div>

              {/* Ready-to-Copy HTML Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300">Copy HTML Button Code:</span>
                  <button
                    onClick={() => handleCopy(buttonHtmlCode, 'button')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedButtonCode ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied HTML!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy HTML</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300 overflow-x-auto whitespace-pre-wrap max-h-36">
                  {buttonHtmlCode}
                </pre>
              </div>

              {/* CMS Specific Guides */}
              <div className="space-y-3 pt-2 border-t border-neutral-800 text-xs">
                <span className="font-semibold text-neutral-200 block">
                  Instructions for Popular Website Builders:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                    <strong className="text-neutral-200 block">Wix</strong>
                    <p className="text-neutral-400">
                      Add &gt; <strong>Button</strong> &gt; Click the link icon &gt; Select <strong>Web Address</strong> &gt; Paste this Drop link &gt; Check &ldquo;New window&rdquo;.
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                    <strong className="text-neutral-200 block">Squarespace</strong>
                    <p className="text-neutral-400">
                      Add Block &gt; <strong>Button</strong> &gt; Click Settings icon &gt; In Link, paste URL &gt; Toggle <strong>Open in New Window</strong> on.
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                    <strong className="text-neutral-200 block">WordPress</strong>
                    <p className="text-neutral-400">
                      Add Block &gt; <strong>Buttons</strong> &gt; Enter label &gt; Paste URL &gt; In link settings toggle <strong>Open in new tab</strong>.
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                    <strong className="text-neutral-200 block">Shopify / Webflow / Other</strong>
                    <p className="text-neutral-400">
                      Add any Button element or paste the HTML code snippet directly into a Custom Code / HTML embed block.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMBED IFRAME */}
          {activeTab === 'embed' && (
            <div className="space-y-6">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-1">
                <p className="text-neutral-200 font-medium">Embed the uploader directly onto your webpage</p>
                <p className="text-[11px] leading-relaxed">
                  If you prefer visitors to upload photos without leaving your website, paste this iframe code onto any page of your site.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300">Responsive iFrame Snippet:</span>
                  <button
                    onClick={() => handleCopy(embedHtmlCode, 'embed')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedEmbedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Embed!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Embed Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-300 overflow-x-auto whitespace-pre-wrap max-h-44">
                  {embedHtmlCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Works across iPhone (Safari), Android (Chrome), and all desktop browsers.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
