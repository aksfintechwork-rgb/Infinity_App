import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function listGoogleDriveFiles(folderId?: string) {
  const drive = await getUncachableGoogleDriveClient();
  
  const query = folderId 
    ? `'${folderId}' in parents and trashed = false`
    : `'root' in parents and trashed = false`;

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink)',
    orderBy: 'folder,name',
  });

  return response.data.files || [];
}

export async function uploadFileToGoogleDrive(fileName: string, mimeType: string, fileBuffer: Buffer, folderId?: string) {
  const drive = await getUncachableGoogleDriveClient();

  const fileMetadata: any = {
    name: fileName,
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType,
    body: require('stream').Readable.from(fileBuffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, mimeType, size, webViewLink',
  });

  return response.data;
}

export async function downloadFileFromGoogleDrive(fileId: string) {
  const drive = await getUncachableGoogleDriveClient();

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

export async function deleteGoogleDriveFile(fileId: string) {
  const drive = await getUncachableGoogleDriveClient();
  await drive.files.delete({ fileId });
}

export async function createGoogleDriveFolder(folderName: string, parentFolderId?: string) {
  const drive = await getUncachableGoogleDriveClient();

  const fileMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, name',
  });

  return response.data;
}
