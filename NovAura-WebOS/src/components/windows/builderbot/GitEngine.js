/**
 * GitEngine - Complete Git integration for Cybeni IDE
 * 
 * Uses isomorphic-git for browser-based Git operations
 * Features: branch management, commits, diff, history, push/pull
 */

import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import LightningFS from '@isomorphic-git/lightning-fs';

export class GitEngine {
  constructor(options = {}) {
    this.fs = new LightningFS('cybeni-git-fs');
    this.dir = options.dir || '/repo';
    this.author = options.author || { name: 'Cybeni User', email: 'user@cybeni.dev' };
    this.token = options.token || null;
    this.remote = options.remote || null;
    
    // Initialize repo directory
    this.fs.mkdir(this.dir, { recursive: true }).catch(() => {});
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Repository Setup
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Initialize a new Git repository
   */
  async init() {
    await git.init({
      fs: this.fs,
      dir: this.dir,
      defaultBranch: 'main'
    });
    return { success: true, message: 'Repository initialized' };
  }

  /**
   * Clone an existing repository
   */
  async clone(url, token = null) {
    this.remote = url;
    if (token) this.token = token;
    
    await git.clone({
      fs: this.fs,
      http,
      dir: this.dir,
      url,
      onAuth: () => ({ username: this.token }),
      onProgress: (event) => console.log('Clone progress:', event)
    });
    
    return { success: true, message: 'Repository cloned' };
  }

  /**
   * Check if directory is a git repo
   */
  async isRepo() {
    try {
      await git.resolveRef({ fs: this.fs, dir: this.dir, ref: 'HEAD' });
      return true;
    } catch {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Branch Management
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Get list of branches
   */
  async listBranches(remote = false) {
    const branches = await git.listBranches({
      fs: this.fs,
      dir: this.dir,
      remote
    });
    return branches;
  }

  /**
   * Get current branch
   */
  async getCurrentBranch() {
    try {
      return await git.currentBranch({ fs: this.fs, dir: this.dir });
    } catch {
      return 'main';
    }
  }

  /**
   * Create new branch
   */
  async createBranch(branchName, checkout = true) {
    await git.branch({
      fs: this.fs,
      dir: this.dir,
      ref: branchName,
      checkout
    });
    return { success: true, branch: branchName };
  }

  /**
   * Checkout branch
   */
  async checkout(branchName) {
    await git.checkout({
      fs: this.fs,
      dir: this.dir,
      ref: branchName
    });
    return { success: true, branch: branchName };
  }

  /**
   * Delete branch
   */
  async deleteBranch(branchName, force = false) {
    await git.deleteBranch({
      fs: this.fs,
      dir: this.dir,
      ref: branchName,
      force
    });
    return { success: true };
  }

  /**
   * Merge branch into current
   */
  async merge(branchName) {
    try {
      await git.merge({
        fs: this.fs,
        dir: this.dir,
        ours: await this.getCurrentBranch(),
        theirs: branchName,
        author: this.author
      });
      return { success: true, conflict: false };
    } catch (err) {
      if (err.message.includes('merge conflict')) {
        return { success: false, conflict: true, message: err.message };
      }
      throw err;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Commit Operations
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Get status of all files
   */
  async getStatus() {
    const statusMatrix = await git.statusMatrix({
      fs: this.fs,
      dir: this.dir
    });
    
    const files = statusMatrix.map(([filepath, head, workdir, stage]) => {
      let status = 'unmodified';
      if (head === 0 && workdir === 2 && stage === 0) status = 'added';
      else if (head === 1 && workdir === 2 && stage === 1) status = 'modified';
      else if (head === 1 && workdir === 0 && stage === 1) status = 'deleted';
      else if (stage === 2 || stage === 3) status = 'conflict';
      else if (head === 1 && workdir === 1 && stage === 2) status = 'staged';
      
      return { filepath, status, head, workdir, stage };
    });
    
    return files.filter(f => f.status !== 'unmodified');
  }

  /**
   * Stage file(s)
   */
  async add(filepath) {
    await git.add({
      fs: this.fs,
      dir: this.dir,
      filepath
    });
    return { success: true };
  }

  /**
   * Unstage file(s)
   */
  async remove(filepath) {
    await git.remove({
      fs: this.fs,
      dir: this.dir,
      filepath
    });
    return { success: true };
  }

  /**
   * Create commit
   */
  async commit(message, files = null) {
    // Stage specific files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        await this.add(file);
      }
    }
    
    const sha = await git.commit({
      fs: this.fs,
      dir: this.dir,
      message,
      author: this.author
    });
    
    return { success: true, sha, message };
  }

  /**
   * Get commit log
   */
  async log(maxCount = 50) {
    const commits = await git.log({
      fs: this.fs,
      dir: this.dir,
      depth: maxCount
    });
    
    return commits.map(commit => ({
      sha: commit.oid,
      message: commit.commit.message,
      author: commit.commit.author,
      committer: commit.commit.committer,
      parents: commit.commit.parents
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Diff Operations
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Get diff between commits or working directory
   */
  async diff(ref1 = 'HEAD', ref2 = null, filepath = null) {
    const args = {
      fs: this.fs,
      dir: this.dir,
      ref: ref1
    };
    
    if (ref2) {
      // Diff between two refs
      // This is a simplified version - full implementation would use git.walk
      return await this.diffRefs(ref1, ref2, filepath);
    }
    
    if (filepath) {
      // Diff specific file
      args.filepath = filepath;
    }
    
    const diffs = await git.statusMatrix({ fs: this.fs, dir: this.dir });
    const changedFiles = diffs.filter(([_, head, workdir, stage]) => 
      head !== workdir || stage !== head
    );
    
    return changedFiles.map(([filepath, head, workdir]) => ({
      filepath,
      oldContent: head === 0 ? '' : this.readFileAtRef(filepath, ref1),
      newContent: workdir === 0 ? '' : this.readFile(filepath),
      status: workdir === 0 ? 'deleted' : head === 0 ? 'added' : 'modified'
    }));
  }

  /**
   * Get diff between two refs (simplified)
   */
  async diffRefs(ref1, ref2, filepath = null) {
    // This would need full tree walking for complete implementation
    // For now, return status of changed files
    return this.diff(ref2, null, filepath);
  }

  /**
   * Read file content
   */
  async readFile(filepath) {
    try {
      const content = await this.fs.readFile(`${this.dir}/${filepath}`, { encoding: 'utf8' });
      return content;
    } catch {
      return '';
    }
  }

  /**
   * Read file at specific ref
   */
  async readFileAtRef(filepath, ref) {
    try {
      const { blob } = await git.readBlob({
        fs: this.fs,
        dir: this.dir,
        oid: ref,
        filepath
      });
      return new TextDecoder().decode(blob);
    } catch {
      return '';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Remote Operations
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Add remote
   */
  async addRemote(name, url) {
    await git.addRemote({
      fs: this.fs,
      dir: this.dir,
      remote: name,
      url
    });
    this.remote = url;
    return { success: true };
  }

  /**
   * List remotes
   */
  async listRemotes() {
    return await git.listRemotes({ fs: this.fs, dir: this.dir });
  }

  /**
   * Push to remote
   */
  async push(remote = 'origin', branch = null) {
    branch = branch || await this.getCurrentBranch();
    
    await git.push({
      fs: this.fs,
      http,
      dir: this.dir,
      remote,
      ref: branch,
      onAuth: () => ({ username: this.token })
    });
    
    return { success: true, branch };
  }

  /**
   * Pull from remote
   */
  async pull(remote = 'origin', branch = null) {
    branch = branch || await this.getCurrentBranch();
    
    await git.pull({
      fs: this.fs,
      http,
      dir: this.dir,
      remote,
      ref: branch,
      author: this.author,
      onAuth: () => ({ username: this.token })
    });
    
    return { success: true, branch };
  }

  /**
   * Fetch from remote
   */
  async fetch(remote = 'origin') {
    await git.fetch({
      fs: this.fs,
      http,
      dir: this.dir,
      remote,
      onAuth: () => ({ username: this.token })
    });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Stash Operations
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Create stash (simplified - creates a WIP commit on a stash branch)
   */
  async stash(message = 'WIP') {
    const currentBranch = await this.getCurrentBranch();
    const stashBranch = `stash-${Date.now()}`;
    
    await this.createBranch(stashBranch, false);
    await this.commit(`stash: ${message}`);
    await this.checkout(currentBranch);
    
    // Store stash info
    const stashes = JSON.parse(localStorage.getItem('cybeni_git_stashes') || '[]');
    stashes.push({
      branch: stashBranch,
      message,
      originalBranch: currentBranch,
      timestamp: Date.now()
    });
    localStorage.setItem('cybeni_git_stashes', JSON.stringify(stashes));
    
    return { success: true, stash: stashBranch };
  }

  /**
   * Get list of stashes
   */
  getStashes() {
    return JSON.parse(localStorage.getItem('cybeni_git_stashes') || '[]');
  }

  /**
   * Apply stash
   */
  async applyStash(stashBranch) {
    const stashes = this.getStashes();
    const stash = stashes.find(s => s.branch === stashBranch);
    
    if (!stash) return { success: false, error: 'Stash not found' };
    
    await this.merge(stashBranch);
    
    // Remove from stash list
    const updated = stashes.filter(s => s.branch !== stashBranch);
    localStorage.setItem('cybeni_git_stashes', JSON.stringify(updated));
    
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Conflict Resolution
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Check for merge conflicts
   */
  async hasConflicts() {
    const status = await this.getStatus();
    return status.some(f => f.status === 'conflict');
  }

  /**
   * Get conflict details for a file
   */
  async getConflictDetails(filepath) {
    const content = await this.readFile(filepath);
    
    // Parse conflict markers
    const conflicts = [];
    const regex = /<<<<<<<\s*(.*)\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>>\s*(.*)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      conflicts.push({
        oursRef: match[1],
        ours: match[2].trim(),
        theirs: match[3].trim(),
        theirsRef: match[4],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    return conflicts;
  }

  /**
   * Resolve conflict by choosing side
   */
  async resolveConflict(filepath, resolution, conflictIndex = 0) {
    const content = await this.readFile(filepath);
    const conflicts = await this.getConflictDetails(filepath);
    
    if (conflictIndex >= conflicts.length) {
      return { success: false, error: 'Invalid conflict index' };
    }
    
    const conflict = conflicts[conflictIndex];
    const replacement = resolution === 'ours' ? conflict.ours : conflict.theirs;
    
    const newContent = 
      content.substring(0, conflict.start) + 
      replacement + 
      content.substring(conflict.end);
    
    await this.fs.writeFile(`${this.dir}/${filepath}`, newContent, { encoding: 'utf8' });
    await this.add(filepath);
    
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // Utilities
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Get repository summary
   */
  async getSummary() {
    const [isRepo, currentBranch, branches, status, commits] = await Promise.all([
      this.isRepo(),
      this.getCurrentBranch(),
      this.listBranches(),
      this.getStatus(),
      this.log(1)
    ]);
    
    return {
      isRepo,
      currentBranch,
      branches: branches.length,
      modified: status.filter(f => f.status === 'modified').length,
      added: status.filter(f => f.status === 'added').length,
      deleted: status.filter(f => f.status === 'deleted').length,
      lastCommit: commits[0]?.message || 'No commits',
      hasRemote: !!this.remote
    };
  }
}

export default GitEngine;
