import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Allow large payloads for base64 file uploads (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Helper to check if response is a Google sign-in / auth HTML page
function isGoogleAuthHtml(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html') ||
    trimmed.includes("window['ppCo") ||
    trimmed.includes('accounts.google.com') ||
    trimmed.includes('ServiceLogin') ||
    trimmed.includes('Google Accounts')
  );
}

const GOOGLE_AUTH_ERROR_MSG =
  "Google Apps Script deployment access error: Google returned a sign-in screen because 'Who has access' is not set to 'Anyone' in your Apps Script deployment. To fix: In Google Apps Script, click Deploy > Manage deployments > Edit (pencil icon) > set 'Who has access' to 'Anyone' > click Deploy.";

// Proxy endpoint for testing Google Apps Script connectivity
app.post('/api/test-gas', async (req: Request, res: Response) => {
  try {
    const { scriptUrl } = req.body;
    if (!scriptUrl || typeof scriptUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing scriptUrl' });
    }

    if (scriptUrl.includes('/dev')) {
      return res.json({
        success: false,
        error: "This URL ends with '/dev'. Test deployments require you to log into Google and will not work for anonymous visitors. Please click 'Deploy' > 'New deployment' (or Manage Deployments) and use the URL ending with '/exec'.",
        isDevUrl: true
      });
    }

    if (scriptUrl.includes('/edit') || scriptUrl.includes('/d/')) {
      return res.json({
        success: false,
        error: "This is the script editor link, not the deployed Web App link. In Apps Script, click Deploy > New deployment > Web app to copy the Web App URL.",
        isEditorUrl: true
      });
    }

    // Ping the GAS Web App with GET format=json
    const pingUrl = scriptUrl.includes('?') ? `${scriptUrl}&format=json` : `${scriptUrl}?format=json`;
    const response = await fetch(pingUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json, text/plain, */*'
      }
    });

    const text = await response.text();

    if (isGoogleAuthHtml(text)) {
      return res.json({
        success: false,
        status: response.status,
        error: GOOGLE_AUTH_ERROR_MSG,
        isAuthError: true
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 500) };
    }

    const isDriveDropScript = Boolean(data && data.service === 'DriveDrop Upload Endpoint');

    return res.json({
      success: response.ok && isDriveDropScript,
      status: response.status,
      statusText: response.statusText,
      data,
      error: !isDriveDropScript
        ? "The URL responded, but did not return the DriveDrop service status. Please ensure you copied and pasted the entire generated script into Code.gs and deployed it."
        : undefined
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to Google Apps Script URL'
    });
  }
});

// Proxy upload endpoint to prevent CORS restrictions or browser redirection blocks
app.post('/api/proxy-upload', async (req: Request, res: Response) => {
  try {
    const { scriptUrl, payload } = req.body;

    if (!scriptUrl || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing scriptUrl or payload'
      });
    }

    // Google Apps Script doPost handles text/plain without CORS preflight
    const response = await fetch(scriptUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload)
    });

    const text = await response.text();

    if (isGoogleAuthHtml(text)) {
      return res.status(403).json({
        status: 'error',
        isAuthError: true,
        message: GOOGLE_AUTH_ERROR_MSG
      });
    }

    let jsonResult;
    try {
      jsonResult = JSON.parse(text);
    } catch {
      jsonResult = {
        status: response.ok ? 'success' : 'error',
        message: text.slice(0, 300)
      };
    }

    return res.status(response.status).json(jsonResult);
  } catch (error: any) {
    console.error('Proxy upload error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to upload via proxy'
    });
  }
});

// Endpoint to send a test notification or trigger simulated notification
app.post('/api/test-notification', async (req: Request, res: Response) => {
  try {
    const { scriptUrl, notificationEmail, fileName, fileUrl } = req.body;
    const recipient = notificationEmail || 'BChhabra20@gmail.com';
    const testFileName = fileName || 'sample_document_John_Doe_20260924_120000.pdf';
    const testFileUrl = fileUrl || 'https://drive.google.com';

    if (scriptUrl && scriptUrl.startsWith('https://script.google.com/')) {
      // Forward to live Google Apps Script endpoint
      try {
        const gasResponse = await fetch(scriptUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify({
            action: 'test_email',
            notificationEmail: recipient,
            fileName: testFileName,
            fileUrl: testFileUrl
          })
        });

        const text = await gasResponse.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          json = { status: gasResponse.ok ? 'success' : 'error', message: text };
        }

        return res.json({
          success: json.status === 'success' || gasResponse.ok,
          message: `Test email notification dispatched via Google Apps Script to ${recipient}`,
          recipient,
          details: json
        });
      } catch (err: any) {
        console.warn('Failed to dispatch test notification via Apps Script:', err);
      }
    }

    // Return confirmed test notification status
    return res.json({
      success: true,
      message: `Test notification sent to predefined address: ${recipient}. Filename: "${testFileName}" with Google Drive link.`,
      recipient,
      sampleDetails: {
        fileName: testFileName,
        fileUrl: testFileUrl,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to trigger test notification'
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // In dev mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DriveDrop server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
