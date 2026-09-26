import { DropBoxConfig } from '../types';

export function generateGoogleAppsScript(config: Partial<DropBoxConfig>): string {
  const folderId = config.folderId?.trim() || 'REPLACE_WITH_YOUR_GOOGLE_DRIVE_FOLDER_ID';
  const folderName = config.folderName?.trim() || 'My DriveDrop Folder';
  const predefinedEmail = config.notificationEmail?.trim() || 'BChhabra20@gmail.com';
  const subfolderRule = config.subfolderRule || 'none';
  const maxMb = config.maxFileSizeMb || 25;
  const autoRenameTimestamp = config.autoRenameTimestamp !== false;
  const appendSenderName = config.appendSenderName !== false;

  return `/**
 * ========================================================================
 * DriveDrop - Anonymous Google Drive File Drop Webhook
 * ========================================================================
 * Target Folder: "${folderName}"
 * Folder ID: "${folderId}"
 * Notification Email: "${predefinedEmail}"
 * Auto-Renaming: Appends sender name first, then date and timestamp
 * (e.g. "photo.jpg" + "John Doe" -> "photo_John_Doe_20260926_134500.jpg")
 * 
 * HOW TO DEPLOY:
 * 1. Open https://script.google.com and click "+ New project".
 * 2. Delete any existing code in Code.gs and paste this ENTIRE script.
 * 3. Click the disk icon (Save).
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Click the gear icon (Select type) -> Choose "Web app".
 * 6. Set Description: "DriveDrop Upload API"
 * 7. Set "Execute as": "Me (<your-google-email>)"
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL for anonymous guest uploads!
 * 9. Click "Deploy", review/authorize permissions, and copy the Web App URL.
 * 10. Paste that Web App URL into your DriveDrop settings.
 * ========================================================================
 */

// ========================================================================
// 1. CONFIGURATION
// ========================================================================
var TARGET_FOLDER_ID = "${folderId}";
var TARGET_FOLDER_NAME = "${folderName}";
var PREDEFINED_NOTIFY_EMAIL = "${predefinedEmail}";
var DEFAULT_SUBFOLDER_RULE = "${subfolderRule}"; // 'none', 'by-date', 'by-uploader'
var MAX_FILE_SIZE_MB = ${maxMb};
var AUTO_RENAME_WITH_TIMESTAMP = ${autoRenameTimestamp};
var APPEND_SENDER_NAME = ${appendSenderName};

// ========================================================================
// 2. HEALTH CHECK HANDLER (GET)
// ========================================================================
function doGet(e) {
  var folderValid = false;
  var folderActualName = "Unknown";
  
  try {
    if (TARGET_FOLDER_ID && TARGET_FOLDER_ID !== "REPLACE_WITH_YOUR_GOOGLE_DRIVE_FOLDER_ID") {
      var folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
      folderActualName = folder.getName();
      folderValid = true;
    }
  } catch (err) {
    folderValid = false;
  }

  var result = {
    status: "active",
    service: "DriveDrop Upload Endpoint",
    configuredFolderId: TARGET_FOLDER_ID,
    folderValid: folderValid,
    folderName: folderActualName,
    maxFileSizeMb: MAX_FILE_SIZE_MB,
    subfolderRule: DEFAULT_SUBFOLDER_RULE,
    autoRenameTimestamp: AUTO_RENAME_WITH_TIMESTAMP,
    appendSenderName: APPEND_SENDER_NAME,
    predefinedNotifyEmail: PREDEFINED_NOTIFY_EMAIL,
    notificationsEnabled: Boolean(PREDEFINED_NOTIFY_EMAIL),
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(result, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================================================
// 3. FILE UPLOAD HANDLER (POST)
// ========================================================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "No upload payload received in request."
      });
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({
        status: "error",
        message: "Invalid JSON payload: " + parseErr.toString()
      });
    }

    // Handle test email notification action
    if (data.action === "test_email") {
      var targetEmail = data.notificationEmail || PREDEFINED_NOTIFY_EMAIL;
      sendNotificationEmail(targetEmail, {
        fileName: "sample_document_John_Doe_20260924_120000.pdf",
        originalName: "sample_document.pdf",
        fileUrl: "https://drive.google.com/drive/folders/" + TARGET_FOLDER_ID,
        fileId: "test_verification_id",
        fileSize: 1048576,
        folderName: TARGET_FOLDER_NAME || "Google Drive Folder",
        folderUrl: "https://drive.google.com/drive/folders/" + TARGET_FOLDER_ID,
        uploaderName: data.uploaderName || "John Doe",
        uploaderEmail: "johndoe@example.com",
        notes: "This is a test notification confirming email delivery to your address.",
        uploadTime: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd HH:mm:ss")
      });

      return createJsonResponse({
        status: "success",
        message: "Test email notification sent to " + targetEmail
      });
    }

    // Validate required fields
    if (!data.fileName || !data.fileData) {
      return createJsonResponse({
        status: "error",
        message: "Missing required fields: fileName or fileData"
      });
    }

    var folderIdToUse = data.folderId || TARGET_FOLDER_ID;
    if (!folderIdToUse || folderIdToUse === "REPLACE_WITH_YOUR_GOOGLE_DRIVE_FOLDER_ID") {
      return createJsonResponse({
        status: "error",
        message: "Google Drive Folder ID is not configured. Please set TARGET_FOLDER_ID in script."
      });
    }

    // Retrieve target root folder
    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(folderIdToUse);
    } catch (folderErr) {
      return createJsonResponse({
        status: "error",
        message: "Target Google Drive folder not found. Check permissions or ID: " + folderErr.toString()
      });
    }

    // 1. Build renamed filename: YYYYMMDD_HHMMSS_original_Sender.ext
    var originalFileName = data.originalFileName || data.fileName;
    var senderName = (data.uploaderName || "").trim();
    var finalFileName = buildRenamedFileName(
      data.fileName,
      senderName,
      AUTO_RENAME_WITH_TIMESTAMP,
      APPEND_SENDER_NAME
    );

    // 2. Resolve subfolder if configured
    var targetFolder = rootFolder;
    var rule = data.subfolderRule || DEFAULT_SUBFOLDER_RULE;
    if (rule === "by-date") {
      var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
      targetFolder = getOrCreateSubfolder(rootFolder, "Uploads " + dateStr);
    } else if (rule === "by-uploader" && data.uploaderName) {
      var safeName = sanitizeFolderName(data.uploaderName);
      targetFolder = getOrCreateSubfolder(rootFolder, safeName + " - Submissions");
    }

    // 3. Decode base64 file data and create file in Drive
    var base64Content = data.fileData;
    if (base64Content.indexOf(",") !== -1) {
      base64Content = base64Content.split(",")[1];
    }
    var rawBytes = Utilities.base64Decode(base64Content);
    var mimeType = data.mimeType || "application/octet-stream";
    var blob = Utilities.newBlob(rawBytes, mimeType, finalFileName);

    var newFile = targetFolder.createFile(blob);
    newFile.setName(finalFileName);

    // 4. Attach metadata description
    var description = [
      "DriveDrop Anonymous File Upload",
      "--------------------------------",
      "File Name: " + finalFileName,
      "Original Name: " + originalFileName,
      "Uploaded By: " + (data.uploaderName || "Anonymous"),
      "Uploaded At: " + new Date().toISOString(),
      "Target Folder: " + rootFolder.getName(),
      "Notes: " + (data.notes || "None")
    ].join("\\n");
    newFile.setDescription(description);

    // 5. Send Email Notification
    var emailRecipient = data.notificationEmail || PREDEFINED_NOTIFY_EMAIL;
    var notificationSent = false;
    if (emailRecipient && emailRecipient.indexOf("@") !== -1 && emailRecipient !== "your-email@example.com") {
      try {
        sendNotificationEmail(emailRecipient, {
          fileName: finalFileName,
          originalName: originalFileName,
          fileUrl: newFile.getUrl(),
          fileId: newFile.getId(),
          fileSize: newFile.getSize(),
          folderName: rootFolder.getName(),
          folderUrl: rootFolder.getUrl(),
          uploaderName: data.uploaderName || "Anonymous",
          uploaderEmail: data.uploaderEmail || "Not provided",
          notes: data.notes || "None",
          uploadTime: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd HH:mm:ss z")
        });
        notificationSent = true;
      } catch (emailErr) {
        Logger.log("Email notification error: " + emailErr.toString());
      }
    }

    return createJsonResponse({
      status: "success",
      message: "File uploaded successfully to Google Drive!",
      fileId: newFile.getId(),
      fileUrl: newFile.getUrl(),
      fileName: finalFileName,
      originalFileName: originalFileName,
      fileSize: newFile.getSize(),
      folderName: targetFolder.getName(),
      notificationSent: notificationSent,
      notificationEmail: emailRecipient,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    Logger.log("Upload error: " + error.toString());
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

// ========================================================================
// 4. HELPER FUNCTIONS
// ========================================================================

/**
 * Safely get or create a subfolder inside a parent folder
 */
function getOrCreateSubfolder(parentFolder, subfolderName) {
  var subfolders = parentFolder.getFoldersByName(subfolderName);
  if (subfolders.hasNext()) {
    return subfolders.next();
  }
  return parentFolder.createFolder(subfolderName);
}

/**
 * Clean sender names for safe filename appending (e.g. 'John Doe' -> 'John_Doe')
 */
function sanitizeForFileName(name) {
  if (!name) return "";
  return name.toString()
    .trim()
    .replace(/[^a-zA-Z0-9_\\s-]/g, "")
    .replace(/\\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Constructs a final filename: appends sender name first, then date and timestamp
 * Format: originalBase[_SenderName][_YYYYMMDD_HHMMSS].[ext]
 * Examples:
 * - 'photo.jpg' + 'John Doe' -> 'photo_John_Doe_20260926_134500.jpg'
 * - 'photo.jpg' (no sender)  -> 'photo_20260926_134500.jpg'
 */
function buildRenamedFileName(filename, senderName, addTimestamp, addSender) {
  var dotIndex = filename.lastIndexOf(".");
  var base = (dotIndex > 0) ? filename.substring(0, dotIndex) : filename;
  var ext = (dotIndex > 0) ? filename.substring(dotIndex) : "";

  // Strip existing timestamp prefixes or suffixes if present
  base = base.replace(/^(\d{8}_\d{6})_/, "");
  base = base.replace(/_(\d{8}_\d{6})$/, "");

  var cleanSender = (addSender && senderName) ? sanitizeForFileName(senderName) : "";
  if (cleanSender) {
    var senderPattern = new RegExp("_" + cleanSender + "$");
    base = base.replace(senderPattern, "");
  }

  var parts = [base];

  // 1. Append sender name first
  if (cleanSender) {
    parts.push(cleanSender);
  }

  // 2. Append date and timestamp second
  if (addTimestamp) {
    var now = new Date();
    var tz = Session.getScriptTimeZone() || "GMT";
    var timestampStr = Utilities.formatDate(now, tz, "yyyyMMdd_HHmmss");
    parts.push(timestampStr);
  }

  return parts.join("_") + ext;
}

/**
 * Clean folder names from invalid characters
 */
function sanitizeFolderName(name) {
  if (!name) return "Anonymous";
  return name.replace(/[\\\\/:*?"<>|]/g, "").trim().substring(0, 50) || "Uploader";
}

/**
 * Helper to construct JSON response with proper CORS headers
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Sends a clean email notification with links to the file and folder in Google Drive
 */
function sendNotificationEmail(recipient, details) {
  var subject = "📁 New Photo/File Uploaded: " + details.fileName + " (Google Drive)";
  
  var plainBody = [
    "Hello,",
    "",
    "A new file has been securely uploaded to your Google Drive folder (" + details.folderName + ").",
    "",
    "File Details:",
    "• Timestamped Filename: " + details.fileName,
    "• Original Filename: " + details.originalName,
    "• Uploaded By: " + details.uploaderName,
    "• Upload Time: " + details.uploadTime,
    "• Notes: " + details.notes,
    "",
    "Direct Link to File in Google Drive:",
    details.fileUrl,
    "",
    "Direct Link to Destination Folder:",
    details.folderUrl,
    "",
    "--",
    "Delivered automatically by DriveDrop & Google Apps Script"
  ].join("\\n");

  var htmlBody = [
    "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9fafb; border-radius: 16px; border: 1px solid #e5e7eb;'>",
    "  <h2 style='color: #111827; margin: 0 0 16px; font-size: 20px;'>📁 New File Uploaded to Google Drive</h2>",
    "  <p style='color: #4b5563; font-size: 14px; line-height: 1.5; margin-top: 0;'>",
    "    A new photo or document was just dropped into your <strong>" + details.folderName + "</strong> folder.",
    "  </p>",
    "  <div style='background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 16px; margin: 20px 0;'>",
    "    <table style='width: 100%; border-collapse: collapse; font-size: 13px;'>",
    "      <tr>",
    "        <td style='padding: 8px 0; color: #6b7280; font-weight: 500; width: 140px;'>Saved Filename:</td>",
    "        <td style='padding: 8px 0; color: #111827; font-family: monospace; font-weight: 600;'>" + details.fileName + "</td>",
    "      </tr>",
    "      <tr>",
    "        <td style='padding: 8px 0; color: #6b7280; font-weight: 500;'>Original Name:</td>",
    "        <td style='padding: 8px 0; color: #4b5563;'>" + details.originalName + "</td>",
    "      </tr>",
    "      <tr>",
    "        <td style='padding: 8px 0; color: #6b7280; font-weight: 500;'>Uploaded By:</td>",
    "        <td style='padding: 8px 0; color: #111827; font-weight: 500;'>" + details.uploaderName + "</td>",
    "      </tr>",
    "      <tr>",
    "        <td style='padding: 8px 0; color: #6b7280; font-weight: 500;'>Upload Time:</td>",
    "        <td style='padding: 8px 0; color: #4b5563;'>" + details.uploadTime + "</td>",
    "      </tr>",
    "      <tr>",
    "        <td style='padding: 8px 0; color: #6b7280; font-weight: 500;'>Notes:</td>",
    "        <td style='padding: 8px 0; color: #4b5563; font-style: italic;'>" + details.notes + "</td>",
    "      </tr>",
    "    </table>",
    "  </div>",
    "  <div style='text-align: center; margin: 24px 0 16px;'>",
    "    <a href='" + details.fileUrl + "' target='_blank' style='background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;'>View File in Google Drive</a>",
    "  </div>",
    "  <p style='text-align: center; margin: 0; font-size: 12px; color: #9ca3af;'>",
    "    <a href='" + details.folderUrl + "' target='_blank' style='color: #6b7280; text-decoration: underline;'>Open Destination Folder</a>",
    "  </p>",
    "</div>"
  ].join("");

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });
}
`;
}
