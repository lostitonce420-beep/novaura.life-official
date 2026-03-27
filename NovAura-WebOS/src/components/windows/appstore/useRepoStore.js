import { create } from 'zustand';

// ── Storage ─────────────────────────────────────────────────
const STORAGE_REPOS = 'novaura_repo_store';
const STORAGE_IMPORTED = 'novaura_imported_apps';

function loadImported() {
  try {
    const raw = localStorage.getItem(STORAGE_IMPORTED);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

// ── GitHub public search (no auth, 10 req/min) ─────────────
const GITHUB_API = 'https://api.github.com';
const HUGGINGFACE_API = 'https://huggingface.co/api';

// Licenses that allow rebranding / modification
const ALLOWED_LICENSES = [
  'mit', 'apache-2.0', 'bsd-2-clause', 'bsd-3-clause', 'unlicense',
  'isc', 'mpl-2.0', 'lgpl-2.1', 'lgpl-3.0', '0bsd', 'wtfpl', 'cc0-1.0',
];

function isLicenseAllowed(spdxId) {
  if (!spdxId) return false;
  return ALLOWED_LICENSES.includes(spdxId.toLowerCase());
}

// ── Store ───────────────────────────────────────────────────
const useRepoStore = create((set, get) => ({
  // ── Search state ──
  query: '',
  source: 'github',        // github | huggingface
  results: [],
  searching: false,
  searchError: null,
  page: 1,
  totalResults: 0,

  // ── Selected repo detail ──
  selectedRepo: null,       // full repo object
  repoFiles: [],            // { path, content, size }
  loadingFiles: false,

  // ── Imported apps ──
  importedApps: loadImported(),

  // ── Enhancement state ──
  enhancing: false,
  enhancePhase: null,
  enhanceLog: [],

  // ── Deploy state ──
  deploying: false,
  deployTarget: null,       // 'zip' | 'web' | 'tauri' | 'android'
  deployLog: [],

  // ── Persist helper ──
  _persistImported() {
    localStorage.setItem(STORAGE_IMPORTED, JSON.stringify(get().importedApps));
  },

  // ── Search actions ──
  setQuery(query) { set({ query }); },
  setSource(source) { set({ source, results: [], page: 1, totalResults: 0 }); },

  async searchRepos(queryOverride) {
    const { query, source, page } = get();
    const q = queryOverride || query;
    if (!q.trim()) return;

    set({ searching: true, searchError: null });

    try {
      if (source === 'github') {
        const res = await fetch(
          `${GITHUB_API}/search/repositories?q=${encodeURIComponent(q)}+license:mit+license:apache-2.0+license:unlicense&sort=stars&order=desc&per_page=20&page=${page}`,
          { headers: { Accept: 'application/vnd.github.v3+json' } }
        );
        if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
        const data = await res.json();

        const repos = (data.items || []).map(r => ({
          id: `gh-${r.id}`,
          source: 'github',
          name: r.name,
          fullName: r.full_name,
          description: r.description || '',
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          license: r.license?.spdx_id || null,
          licenseAllowed: isLicenseAllowed(r.license?.spdx_id),
          url: r.html_url,
          cloneUrl: r.clone_url,
          owner: r.owner?.login,
          ownerAvatar: r.owner?.avatar_url,
          updatedAt: r.updated_at,
          topics: r.topics || [],
          defaultBranch: r.default_branch,
          size: r.size,
        }));

        set({ results: repos, totalResults: data.total_count || 0, searching: false });
      } else {
        // HuggingFace — search models/spaces
        const res = await fetch(
          `${HUGGINGFACE_API}/models?search=${encodeURIComponent(q)}&sort=likes&direction=-1&limit=20`
        );
        if (!res.ok) throw new Error(`HuggingFace API: ${res.status}`);
        const data = await res.json();

        const repos = (data || []).map(r => ({
          id: `hf-${r.modelId || r.id}`,
          source: 'huggingface',
          name: r.modelId?.split('/').pop() || r.id,
          fullName: r.modelId || r.id,
          description: r.pipeline_tag || r.tags?.join(', ') || '',
          stars: r.likes || 0,
          forks: r.downloads || 0,
          language: r.pipeline_tag || 'model',
          license: r.cardData?.license || null,
          licenseAllowed: true, // HF models are generally open
          url: `https://huggingface.co/${r.modelId || r.id}`,
          owner: r.modelId?.split('/')[0] || '',
          ownerAvatar: null,
          updatedAt: r.lastModified,
          topics: r.tags || [],
          defaultBranch: 'main',
          size: 0,
        }));

        set({ results: repos, totalResults: repos.length, searching: false });
      }
    } catch (err) {
      set({ searchError: err.message, searching: false });
    }
  },

  // ── Fetch repo file tree from GitHub ──
  async fetchRepoFiles(repo) {
    if (repo.source !== 'github') {
      set({ selectedRepo: repo, repoFiles: [], loadingFiles: false });
      return;
    }

    set({ selectedRepo: repo, repoFiles: [], loadingFiles: true });

    try {
      // Get tree recursively (limited to ~1000 files)
      const res = await fetch(
        `${GITHUB_API}/repos/${repo.fullName}/git/trees/${repo.defaultBranch}?recursive=1`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
      if (!res.ok) throw new Error(`Failed to fetch tree: ${res.status}`);
      const data = await res.json();

      const files = (data.tree || [])
        .filter(f => f.type === 'blob')
        .map(f => ({
          path: f.path,
          size: f.size || 0,
          sha: f.sha,
          url: f.url,
          content: null, // lazy loaded
        }));

      set({ repoFiles: files, loadingFiles: false });
    } catch (err) {
      set({ repoFiles: [], loadingFiles: false });
      console.error('Failed to fetch repo files:', err);
    }
  },

  // ── Fetch single file content ──
  async fetchFileContent(repo, filePath) {
    try {
      const res = await fetch(
        `${GITHUB_API}/repos/${repo.fullName}/contents/${filePath}?ref=${repo.defaultBranch}`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.encoding === 'base64' && data.content) {
        return atob(data.content.replace(/\n/g, ''));
      }
      return data.content || null;
    } catch {
      return null;
    }
  },

  // ── Import repo as a local project ──
  async importRepo(repo) {
    const { repoFiles, importedApps } = get();

    // Check if already imported
    if (importedApps.find(a => a.sourceId === repo.id)) return;

    // Load key files (up to 50 files, skip binary/large)
    const textExtensions = [
      'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'json', 'md',
      'yaml', 'yml', 'toml', 'rs', 'go', 'java', 'c', 'cpp', 'h',
      'rb', 'php', 'sql', 'sh', 'bash', 'vue', 'svelte', 'scss', 'less',
      'xml', 'svg', 'env', 'txt', 'cfg', 'ini', 'dockerfile', 'makefile',
    ];

    const eligibleFiles = repoFiles
      .filter(f => {
        const ext = f.path.split('.').pop()?.toLowerCase();
        const name = f.path.split('/').pop()?.toLowerCase();
        return (textExtensions.includes(ext) || ['dockerfile', 'makefile', 'readme'].includes(name))
          && f.size < 100000; // skip files > 100KB
      })
      .slice(0, 50);

    const loadedFiles = [];
    for (const file of eligibleFiles) {
      const content = await get().fetchFileContent(repo, file.path);
      if (content !== null) {
        loadedFiles.push({ path: file.path, content, size: file.size });
      }
    }

    const app = {
      id: `app-${Date.now()}`,
      sourceId: repo.id,
      source: repo.source,
      originalName: repo.name,
      name: repo.name,
      rebrandedName: '',
      description: repo.description,
      files: loadedFiles,
      license: repo.license,
      stars: repo.stars,
      language: repo.language,
      url: repo.url,
      importedAt: new Date().toISOString(),
      status: 'imported', // imported | enhancing | enhanced | deploying | deployed
      enhanceLog: [],
      deployUrl: null,
    };

    set({ importedApps: [...importedApps, app] });
    get()._persistImported();
    return app;
  },

  // ── Update imported app ──
  updateApp(appId, updates) {
    set(s => ({
      importedApps: s.importedApps.map(a => a.id === appId ? { ...a, ...updates } : a),
    }));
    get()._persistImported();
  },

  // ── Update app files after enhancement ──
  updateAppFiles(appId, files) {
    set(s => ({
      importedApps: s.importedApps.map(a =>
        a.id === appId ? { ...a, files, status: 'enhanced' } : a
      ),
    }));
    get()._persistImported();
  },

  // ── Remove imported app ──
  removeApp(appId) {
    set(s => ({
      importedApps: s.importedApps.filter(a => a.id !== appId),
    }));
    get()._persistImported();
  },

  // ── Clear selection ──
  clearSelection() {
    set({ selectedRepo: null, repoFiles: [], loadingFiles: false });
  },

  // ── Deploy helpers ──
  setDeployTarget(target) { set({ deployTarget: target }); },
  addDeployLog(msg) { set(s => ({ deployLog: [...s.deployLog, { time: new Date().toLocaleTimeString(), msg }] })); },
  clearDeployLog() { set({ deployLog: [] }); },
}));

export default useRepoStore;
