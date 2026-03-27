/**
 * Cybeni Desktop Packager
 *
 * Generates a ready-to-build Electron app around the user's project files.
 * Downloads as a ZIP containing:
 *   - User's source files (in /src/)
 *   - Electron main process (main.js)
 *   - Preload script (preload.js)
 *   - package.json with electron + electron-builder
 *   - Build scripts (build.bat, build.sh)
 *   - README with instructions
 *
 * User extracts, runs `npm install && npm run package`, gets their .exe / .dmg / .AppImage
 */

// ── CRC32 (needed for ZIP) ──────────────────────────────
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[i] = c;
    }
    return t;
  })());
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── ZIP Generator ───────────────────────────────────────
function generateZipBlob(files) {
  const encoder = new TextEncoder();
  const entries = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const contentBytes = encoder.encode(file.content || '');
    const crcVal = crc32(contentBytes);

    const localHeader = new ArrayBuffer(30 + nameBytes.length);
    const lv = new DataView(localHeader);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(8, 0, true);
    lv.setUint32(14, crcVal, true);
    lv.setUint32(18, contentBytes.length, true);
    lv.setUint32(22, contentBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    new Uint8Array(localHeader, 30).set(nameBytes);

    entries.push({ nameBytes, contentBytes, crc: crcVal, localHeaderOffset: offset, localHeader });
    offset += localHeader.byteLength + contentBytes.length;
  }

  const centralEntries = [];
  for (const entry of entries) {
    const cd = new ArrayBuffer(46 + entry.nameBytes.length);
    const cv = new DataView(cd);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, entry.crc, true);
    cv.setUint32(20, entry.contentBytes.length, true);
    cv.setUint32(24, entry.contentBytes.length, true);
    cv.setUint16(28, entry.nameBytes.length, true);
    cv.setUint32(42, entry.localHeaderOffset, true);
    new Uint8Array(cd, 46).set(entry.nameBytes);
    centralEntries.push(cd);
  }

  const cdSize = centralEntries.reduce((s, c) => s + c.byteLength, 0);
  const ecd = new ArrayBuffer(22);
  const ev = new DataView(ecd);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  const parts = [];
  for (const entry of entries) {
    parts.push(entry.localHeader);
    parts.push(entry.contentBytes.buffer.slice(
      entry.contentBytes.byteOffset,
      entry.contentBytes.byteOffset + entry.contentBytes.byteLength
    ));
  }
  for (const cd of centralEntries) parts.push(cd);
  parts.push(ecd);

  return new Blob(parts, { type: 'application/zip' });
}

// ── Electron Shell Templates ────────────────────────────

function electronMainJs(projectName, entryFile) {
  return `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: '${projectName}',
    icon: path.join(__dirname, 'src', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0a0a0f',
    autoHideMenuBar: true,
  });

  win.loadFile(path.join(__dirname, 'src', '${entryFile}'));

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
`;
}

function electronPreloadJs() {
  return `const { contextBridge } = require('electron');

// Expose safe APIs to the renderer
contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  isDesktop: true,
});
`;
}

function electronPackageJson(projectName, safeName) {
  return JSON.stringify({
    name: safeName,
    version: '1.0.0',
    description: `${projectName} — Built with Cybeni IDE`,
    main: 'main.js',
    scripts: {
      start: 'electron .',
      dev: 'electron . --dev',
      'package': 'electron-builder --config electron-builder.json',
      'package:win': 'electron-builder --win --config electron-builder.json',
      'package:mac': 'electron-builder --mac --config electron-builder.json',
      'package:linux': 'electron-builder --linux --config electron-builder.json',
    },
    devDependencies: {
      electron: '^28.0.0',
      'electron-builder': '^24.9.1',
    },
    author: 'Built with Cybeni IDE (NovAura)',
  }, null, 2) + '\n';
}

function electronBuilderConfig(projectName, safeName) {
  return JSON.stringify({
    appId: `com.novaura.${safeName}`,
    productName: projectName,
    directories: { output: 'dist' },
    files: ['main.js', 'preload.js', 'src/**/*'],
    win: {
      target: 'nsis',
      icon: 'src/icon.png',
    },
    mac: {
      target: 'dmg',
      icon: 'src/icon.png',
    },
    linux: {
      target: 'AppImage',
      icon: 'src/icon.png',
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
    },
  }, null, 2) + '\n';
}

function buildBat(projectName) {
  return `@echo off
echo ================================================
echo   Building ${projectName} Desktop App
echo   Powered by Cybeni IDE (NovAura)
echo ================================================
echo.
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo.
echo Building for Windows...
call npm run package:win
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.
echo ================================================
echo   Build complete! Check the /dist folder
echo ================================================
pause
`;
}

function buildSh(projectName) {
  return `#!/bin/bash
echo "================================================"
echo "  Building ${projectName} Desktop App"
echo "  Powered by Cybeni IDE (NovAura)"
echo "================================================"
echo ""
echo "Installing dependencies..."
npm install || { echo "ERROR: npm install failed"; exit 1; }
echo ""

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building for macOS..."
    npm run package:mac
elif [[ "$OSTYPE" == "linux"* ]]; then
    echo "Building for Linux..."
    npm run package:linux
else
    echo "Building for current platform..."
    npm run package
fi

echo ""
echo "================================================"
echo "  Build complete! Check the /dist folder"
echo "================================================"
`;
}

function readmeContent(projectName) {
  return `# ${projectName}

Desktop application built with **Cybeni IDE** (NovAura).

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher

### Build

**Windows:**
\`\`\`
build.bat
\`\`\`

**macOS / Linux:**
\`\`\`bash
chmod +x build.sh
./build.sh
\`\`\`

**Or manually:**
\`\`\`bash
npm install
npm run package
\`\`\`

### Development
\`\`\`bash
npm install
npm run dev
\`\`\`

## Output
Built executables will be in the \`dist/\` folder:
- **Windows:** \`.exe\` installer
- **macOS:** \`.dmg\` disk image
- **Linux:** \`.AppImage\`

## Project Structure
\`\`\`
├── main.js              # Electron main process
├── preload.js           # Secure bridge to renderer
├── package.json         # Dependencies & scripts
├── electron-builder.json # Build configuration
├── build.bat            # Windows build script
├── build.sh             # macOS/Linux build script
└── src/                 # Your application files
\`\`\`

---
*Generated by [Cybeni IDE](https://novaura.life) — NovAura AI OS*
`;
}

// ── Main export ─────────────────────────────────────────

/**
 * Package project files as a downloadable Electron desktop app.
 * @param {Array<{name, path, content}>} projectFiles - User's source files
 * @param {string} projectName - Display name
 */
export function packageAsDesktopApp(projectFiles, projectName) {
  const safeName = (projectName || 'cybeni-app')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Find entry HTML file
  const htmlFile = projectFiles.find(f => f.name?.endsWith('.html'));
  const entryFile = htmlFile ? htmlFile.name : 'index.html';

  // If no HTML file, create a minimal one that runs the main script
  const hasHtml = !!htmlFile;

  // Build the ZIP file list
  const zipFiles = [];

  // User's source files go into /src/
  for (const f of projectFiles) {
    zipFiles.push({
      path: `${safeName}/src/${f.path || f.name}`,
      content: f.content || '',
    });
  }

  // If no HTML, generate a runner page
  if (!hasHtml) {
    const mainFile = projectFiles[0];
    zipFiles.push({
      path: `${safeName}/src/index.html`,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <style>
    body { margin: 0; background: #0a0a0f; color: #e0e0e0; font-family: monospace; padding: 1rem; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <pre id="output"></pre>
  <script src="${mainFile?.name || 'main.js'}"></script>
</body>
</html>`,
    });
  }

  // Electron files
  zipFiles.push({
    path: `${safeName}/main.js`,
    content: electronMainJs(projectName, hasHtml ? entryFile : 'index.html'),
  });

  zipFiles.push({
    path: `${safeName}/preload.js`,
    content: electronPreloadJs(),
  });

  zipFiles.push({
    path: `${safeName}/package.json`,
    content: electronPackageJson(projectName, safeName),
  });

  zipFiles.push({
    path: `${safeName}/electron-builder.json`,
    content: electronBuilderConfig(projectName, safeName),
  });

  zipFiles.push({
    path: `${safeName}/build.bat`,
    content: buildBat(projectName),
  });

  zipFiles.push({
    path: `${safeName}/build.sh`,
    content: buildSh(projectName),
  });

  zipFiles.push({
    path: `${safeName}/README.md`,
    content: readmeContent(projectName),
  });

  // Generate and download
  const blob = generateZipBlob(zipFiles);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}-desktop.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { fileName: `${safeName}-desktop.zip`, fileCount: zipFiles.length };
}

/**
 * Package project as a plain source ZIP (no Electron shell).
 */
export function packageAsZip(projectFiles, projectName) {
  const safeName = (projectName || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const zipFiles = projectFiles.map(f => ({
    path: `${safeName}/${f.path || f.name}`,
    content: f.content || '',
  }));

  const blob = generateZipBlob(zipFiles);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { fileName: `${safeName}.zip`, fileCount: zipFiles.length };
}
