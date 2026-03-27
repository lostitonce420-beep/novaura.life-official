/**
 * NovAura File Storage Service
 * Local storage via IndexedDB + GitHub + Google Drive integrations
 */

const DB_NAME = 'novaura_files';
const DB_VERSION = 1;
const FILES_STORE = 'files';

// ────────────────────────────────────────────
// IndexedDB
// ────────────────────────────────────────────
let dbInstance = null;

function getDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        const store = db.createObjectStore(FILES_STORE, { keyPath: 'id' });
        store.createIndex('parentPath', 'parentPath', { unique: false });
        store.createIndex('path', 'path', { unique: true });
      }
    };
    req.onsuccess = () => { dbInstance = req.result; resolve(dbInstance); };
    req.onerror = () => reject(req.error);
  });
}

function genId() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normPath(p) {
  return ('/' + p).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

async function dbGet(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(FILES_STORE, 'readonly').objectStore(FILES_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetByPath(path) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(FILES_STORE, 'readonly').objectStore(FILES_STORE).index('path').get(normPath(path));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(entry) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(FILES_STORE, 'readwrite').objectStore(FILES_STORE).put(entry);
    req.onsuccess = () => resolve(entry);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(id) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(FILES_STORE, 'readwrite').objectStore(FILES_STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ────────────────────────────────────────────
// Local File Operations
// ────────────────────────────────────────────

export async function listFiles(parentPath = '/') {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(FILES_STORE, 'readonly').objectStore(FILES_STORE).index('parentPath').getAll(normPath(parentPath));
    req.onsuccess = () => {
      resolve(req.result.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function uploadFiles(fileList, destPath = '/') {
  const dest = normPath(destPath);
  const results = [];
  for (const file of fileList) {
    const path = normPath(`${dest}/${file.name}`);
    const existing = await dbGetByPath(path);
    if (existing) await deleteItem(existing.id);
    const entry = {
      id: genId(), name: file.name, path, parentPath: dest,
      type: 'file', mimeType: file.type || 'application/octet-stream',
      size: file.size, content: file, source: 'local',
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    await dbPut(entry);
    results.push(entry);
  }
  return results;
}

export async function uploadFolder(fileList, destPath = '/') {
  const dest = normPath(destPath);
  const createdFolders = new Set();
  const results = [];
  for (const file of fileList) {
    const relPath = file.webkitRelativePath || file.name;
    const parts = relPath.split('/');
    // Create intermediate folders
    let cur = dest;
    for (let i = 0; i < parts.length - 1; i++) {
      cur = normPath(`${cur}/${parts[i]}`);
      if (!createdFolders.has(cur)) {
        createdFolders.add(cur);
        const parent = normPath(cur.split('/').slice(0, -1).join('/'));
        if (!(await dbGetByPath(cur))) await createFolderInternal(parts[i], parent);
      }
    }
    const filePath = normPath(`${dest}/${relPath}`);
    const parentPath = normPath(filePath.split('/').slice(0, -1).join('/'));
    const entry = {
      id: genId(), name: file.name, path: filePath, parentPath,
      type: 'file', mimeType: file.type || 'application/octet-stream',
      size: file.size, content: file, source: 'local',
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    await dbPut(entry);
    results.push(entry);
  }
  return results;
}

async function createFolderInternal(name, parentPath) {
  const pp = normPath(parentPath);
  const path = normPath(`${pp}/${name}`);
  return dbPut({
    id: genId(), name, path, parentPath: pp,
    type: 'folder', mimeType: '', size: 0, content: null,
    source: 'local', createdAt: Date.now(), updatedAt: Date.now(),
  });
}

export async function createFolder(name, parentPath = '/') {
  if (await dbGetByPath(normPath(`${parentPath}/${name}`))) throw new Error('Folder already exists');
  return createFolderInternal(name, parentPath);
}

export async function deleteItem(id) {
  const item = await dbGet(id);
  if (!item) return;
  if (item.type === 'folder') {
    const children = await listFiles(item.path);
    for (const child of children) await deleteItem(child.id);
  }
  await dbDelete(id);
}

export async function getFileContent(id) {
  const item = await dbGet(id);
  return item?.content || null;
}

export async function downloadFile(id) {
  const item = await dbGet(id);
  if (!item?.content) return;
  const url = URL.createObjectURL(item.content);
  const a = document.createElement('a');
  a.href = url; a.download = item.name; a.click();
  URL.revokeObjectURL(url);
}

export async function renameItem(id, newName) {
  const item = await dbGet(id);
  if (!item) throw new Error('Not found');
  item.name = newName;
  item.path = normPath(`${item.parentPath}/${newName}`);
  item.updatedAt = Date.now();
  return dbPut(item);
}

export async function getStorageUsage() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(FILES_STORE, 'readonly').objectStore(FILES_STORE).getAll();
    req.onsuccess = () => {
      const items = req.result;
      resolve({
        totalSize: items.reduce((s, i) => s + (i.size || 0), 0),
        fileCount: items.filter(i => i.type === 'file').length,
        folderCount: items.filter(i => i.type === 'folder').length,
      });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveFile(name, content, mimeType, destPath = '/', source = 'local') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const dest = normPath(destPath);
  return dbPut({
    id: genId(), name, path: normPath(`${dest}/${name}`), parentPath: dest,
    type: 'file', mimeType, size: blob.size, content: blob,
    source, createdAt: Date.now(), updatedAt: Date.now(),
  });
}

// ────────────────────────────────────────────
// GitHub
// ────────────────────────────────────────────
const GH_API = 'https://api.github.com';

export function getGitHubToken() { return localStorage.getItem('novaura_github_token') || ''; }
export function setGitHubToken(token) {
  token ? localStorage.setItem('novaura_github_token', token) : localStorage.removeItem('novaura_github_token');
}

function ghHeaders() {
  const h = { Accept: 'application/vnd.github.v3+json' };
  const t = getGitHubToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function listGitHubRepos(username) {
  const token = getGitHubToken();
  const url = token
    ? `${GH_API}/user/repos?per_page=100&sort=updated`
    : `${GH_API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`;
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function searchGitHubRepos(query) {
  const res = await fetch(`${GH_API}/search/repositories?q=${encodeURIComponent(query)}&per_page=20`, { headers: ghHeaders() });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return (await res.json()).items || [];
}

export async function getGitHubContents(owner, repo, path = '') {
  const res = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${path}`, { headers: ghHeaders() });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}

export async function importGitHubFile(downloadUrl, name, destPath = '/') {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error('GitHub download failed');
  const blob = await res.blob();
  return saveFile(name, blob, blob.type || 'application/octet-stream', destPath, 'github');
}

// ────────────────────────────────────────────
// Google Drive
// ────────────────────────────────────────────
let driveAccessToken = null;

function loadGIS() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = () => setTimeout(resolve, 150);
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
}

export async function connectGoogleDrive() {
  await loadGIS();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_FCM_OAUTH_CLIENT_ID;
  if (!clientId) throw new Error('Google OAuth Client ID not configured');
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (r) => {
        if (r.error) return reject(new Error(r.error_description || r.error));
        driveAccessToken = r.access_token;
        resolve(r.access_token);
      },
    });
    client.requestAccessToken();
  });
}

export function isDriveConnected() { return !!driveAccessToken; }
export function disconnectDrive() {
  if (driveAccessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(driveAccessToken);
  }
  driveAccessToken = null;
}

export async function listDriveFiles(searchQuery = '', folderId = 'root') {
  if (!driveAccessToken) throw new Error('Not connected to Google Drive');
  let q = searchQuery
    ? `name contains '${searchQuery.replace(/'/g, "\\'")}' and trashed = false`
    : `'${folderId}' in parents and trashed = false`;
  const params = new URLSearchParams({
    q, fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,iconLink,thumbnailLink)',
    pageSize: '100', orderBy: 'folder,name',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${driveAccessToken}` },
  });
  if (res.status === 401) { driveAccessToken = null; throw new Error('Drive session expired — reconnect'); }
  if (!res.ok) throw new Error(`Drive API ${res.status}`);
  return res.json();
}

export async function importDriveFile(fileId, fileName, mimeType, destPath = '/') {
  if (!driveAccessToken) throw new Error('Not connected');
  let url, finalMime = mimeType, finalName = fileName;
  if (mimeType.startsWith('application/vnd.google-apps.')) {
    const exportMap = {
      'application/vnd.google-apps.document': ['application/pdf', '.pdf'],
      'application/vnd.google-apps.spreadsheet': ['text/csv', '.csv'],
      'application/vnd.google-apps.presentation': ['application/pdf', '.pdf'],
      'application/vnd.google-apps.drawing': ['image/png', '.png'],
    };
    const [expMime, ext] = exportMap[mimeType] || ['application/pdf', '.pdf'];
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(expMime)}`;
    finalMime = expMime;
    if (!finalName.endsWith(ext)) finalName = finalName.replace(/\.[^.]*$/, '') + ext;
  } else {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${driveAccessToken}` } });
  if (!res.ok) throw new Error('Drive download failed');
  return saveFile(finalName, await res.blob(), finalMime, destPath, 'gdrive');
}
