import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Export project files as ZIP
 * @param {Object} options
 * @param {Array<{name, content}>} options.files - Files to include
 * @param {string} options.projectName - Project name
 * @param {Object} options.metadata - Additional metadata
 * @param {string} options.readme - Custom README content (optional)
 */
export async function exportProjectAsZip({ files, projectName, metadata = {}, readme = null }) {
  const zip = new JSZip();
  
  // Add all files
  files.forEach(file => {
    const path = file.path || file.name;
    zip.file(path, file.content || '');
  });
  
  // Add metadata
  const metadataContent = {
    projectName,
    exportedAt: new Date().toISOString(),
    fileCount: files.length,
    ...metadata
  };
  zip.file('.novaura/project.json', JSON.stringify(metadataContent, null, 2));
  
  // Add README if not provided
  if (!readme) {
    readme = generateReadme({ projectName, files, metadata });
  }
  zip.file('README.md', readme);
  
  // Generate and download
  const content = await zip.generateAsync({ type: 'blob' });
  const timestamp = new Date().toISOString().split('T')[0];
  saveAs(content, `${projectName.replace(/\s+/g, '-')}-${timestamp}.zip`);
  
  return { fileCount: files.length, fileName: `${projectName}.zip` };
}

/**
 * Export project as JSON (for backup/sharing)
 * @param {Object} data - Project data
 * @param {string} filename - Output filename
 */
export function exportAsJson(data, filename = 'project') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const timestamp = new Date().toISOString().split('T')[0];
  saveAs(blob, `${filename}-${timestamp}.json`);
}

/**
 * Import project from JSON
 * @param {File} file - JSON file
 * @returns {Promise<Object>} Parsed project data
 */
export function importFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Generate README content
 */
function generateReadme({ projectName, files, metadata = {} }) {
  const fileList = files.map(f => `- ${f.path || f.name}`).join('\n');
  
  return `# ${projectName}

Generated with NovAura Vibe Coding

## Files

${fileList}

## Getting Started

1. Extract the ZIP file
2. Open the project files in your preferred editor
3. Follow any setup instructions in the code comments

## Metadata

- Exported: ${new Date().toLocaleString()}
- Files: ${files.length}
${metadata.template ? `- Template: ${metadata.template}` : ''}
${metadata.language ? `- Language: ${metadata.language}` : ''}

---

Built with ❤️ using NovAura
`;
}

/**
 * Upload to Google Drive (requires Google Drive API setup)
 * @param {Blob} content - File content
 * @param {string} filename - File name
 * @param {string} accessToken - Google OAuth access token
 */
export async function uploadToGoogleDrive(content, filename, accessToken) {
  const metadata = {
    name: filename,
    mimeType: content.type || 'application/zip'
  };
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', content);
  
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: form
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload to Google Drive');
  }
  
  return response.json();
}

/**
 * Export individual file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  saveAs(blob, filename);
}

/**
 * Create project backup (all-in-one JSON with embedded files)
 * @param {Object} project - Complete project object
 */
export function createProjectBackup(project) {
  const backup = {
    version: '1.0',
    type: 'novaura-project',
    created: new Date().toISOString(),
    ...project
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const filename = `${project.name || 'project'}-backup-${Date.now()}.json`;
  saveAs(blob, filename);
  
  return backup;
}

/**
 * Parse uploaded files and create file objects
 * @param {FileList} fileList - Files from input
 * @returns {Promise<Array<{name, content, path}>>}
 */
export async function parseUploadedFiles(fileList) {
  const files = [];
  
  for (const file of fileList) {
    const content = await file.text();
    files.push({
      name: file.name,
      path: file.name,
      content,
      size: file.size,
      lastModified: file.lastModified
    });
  }
  
  return files;
}

/**
 * Export code with syntax highlighting as HTML
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @param {string} title - Document title
 */
export function exportAsHtml(code, language, title = 'Code Export') {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: monospace; background: #1a1a2e; color: #e0e0e0; padding: 20px; }
    pre { background: #0f0f1a; padding: 20px; border-radius: 8px; overflow-x: auto; }
    code { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <pre><code class="language-${language}">${escapeHtml(code)}</code></pre>
</body>
</html>`;
  
  const blob = new Blob([html], { type: 'text/html' });
  saveAs(blob, `${title.replace(/\s+/g, '-')}.html`);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export default {
  exportProjectAsZip,
  exportAsJson,
  importFromJson,
  uploadToGoogleDrive,
  downloadFile,
  createProjectBackup,
  parseUploadedFiles,
  exportAsHtml
};
