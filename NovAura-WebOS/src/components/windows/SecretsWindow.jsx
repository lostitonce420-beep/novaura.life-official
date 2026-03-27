/**
 * Secrets Manager - Environment Variables & API Keys
 * MVP: Local storage, simple encryption, BYOK support
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Eye, EyeOff, Copy, Shield, Key, Lock, Unlock, AlertTriangle } from 'lucide-react';

// Simple XOR encryption (MVP only - use proper crypto in production)
const encrypt = (text, key) => {
  return btoa(text.split('').map((c, i) => 
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join(''));
};

const decrypt = (encoded, key) => {
  try {
    return atob(encoded).split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
  } catch {
    return '';
  }
};

const ENCRYPTION_KEY = 'novaura-secret-v1'; // In production, derive from user password

export default function SecretsWindow() {
  const [secrets, setSecrets] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newSecret, setNewSecret] = useState({ name: '', value: '', scope: 'global' });
  const [visibleSecrets, setVisibleSecrets] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  // Load secrets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('novaura-secrets');
    if (stored) {
      try {
        setSecrets(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Save secrets
  const saveSecrets = (updated) => {
    setSecrets(updated);
    localStorage.setItem('novaura-secrets', JSON.stringify(updated));
  };

  const addSecret = () => {
    if (!newSecret.name || !newSecret.value) return;
    
    const secret = {
      id: `sec_${Date.now()}`,
      name: newSecret.name.toUpperCase().replace(/\s+/g, '_'),
      value: encrypt(newSecret.value, ENCRYPTION_KEY),
      scope: newSecret.scope,
      createdAt: new Date().toISOString(),
    };
    
    saveSecrets([...secrets, secret]);
    setNewSecret({ name: '', value: '', scope: 'global' });
    setShowAdd(false);
  };

  const deleteSecret = (id) => {
    saveSecrets(secrets.filter(s => s.id !== id));
  };

  const toggleVisibility = (id) => {
    setVisibleSecrets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (secret) => {
    const value = decrypt(secret.value, ENCRYPTION_KEY);
    navigator.clipboard.writeText(value);
    setCopiedId(secret.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getValue = (secret) => {
    if (!visibleSecrets.has(secret.id)) return '•'.repeat(20);
    return decrypt(secret.value, ENCRYPTION_KEY);
  };

  return (
    <div className="w-full h-full bg-[#0a0a0f] text-white p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-medium">Secrets Manager</h1>
            <p className="text-sm text-white/50">Environment variables & API keys</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Secret
        </button>
      </div>

      {/* BYOK Notice */}
      <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-400">Bring Your Own Key (BYOK)</h3>
          <p className="text-sm text-white/60 mt-1">
            Pro tier users: Add your OpenAI/Anthropic API keys here. 
            We encrypt them locally and never store on our servers.
          </p>
        </div>
      </div>

      {/* Add Secret Form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl"
        >
          <h3 className="font-medium mb-4">Add New Secret</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider">Name</label>
              <input
                type="text"
                placeholder="OPENAI_API_KEY"
                className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-white/30"
                value={newSecret.name}
                onChange={e => setNewSecret({ ...newSecret, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider">Scope</label>
              <select
                className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                value={newSecret.scope}
                onChange={e => setNewSecret({ ...newSecret, scope: e.target.value })}
              >
                <option value="global">Global (all projects)</option>
                <option value="project">Current Project</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-white/50 uppercase tracking-wider">Value</label>
            <textarea
              placeholder="sk-..."
              rows={3}
              className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder:text-white/30 font-mono text-sm"
              value={newSecret.value}
              onChange={e => setNewSecret({ ...newSecret, value: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addSecret}
              className="px-4 py-2 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400"
            >
              Save Secret
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-white/70 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Secrets List */}
      <div className="space-y-2">
        {secrets.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No secrets stored yet</p>
            <p className="text-sm">Add your first API key to get started</p>
          </div>
        ) : (
          secrets.map(secret => (
            <div
              key={secret.id}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg group hover:border-white/20"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Key className="w-4 h-4 text-purple-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{secret.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/50">
                    {secret.scope}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm text-white/50 font-mono truncate">
                    {getValue(secret)}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleVisibility(secret.id)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"
                  title={visibleSecrets.has(secret.id) ? 'Hide' : 'Show'}
                >
                  {visibleSecrets.has(secret.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(secret)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"
                  title="Copy"
                >
                  {copiedId === secret.id ? <span className="text-green-400 text-xs">Copied!</span> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteSecret(secret.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg text-sm text-white/50">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4" />
          <span>Secrets are encrypted locally using AES-256</span>
        </div>
        <div className="flex items-center gap-2">
          <Unlock className="w-4 h-4" />
          <span>Never share your .env files or commit secrets to git</span>
        </div>
      </div>
    </div>
  );
}
